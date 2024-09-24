package io.easystartup.suggestfeature.services;


import io.easystartup.suggestfeature.beans.Comment;
import io.easystartup.suggestfeature.beans.Notification;
import io.easystartup.suggestfeature.beans.Notification.NotificationType;
import io.easystartup.suggestfeature.beans.Post;
import io.easystartup.suggestfeature.beans.User;
import io.easystartup.suggestfeature.dto.GetNotificationRequestDTO;
import io.easystartup.suggestfeature.loggers.Logger;
import io.easystartup.suggestfeature.loggers.LoggerFactory;
import io.easystartup.suggestfeature.services.db.MongoTemplateFactory;
import io.easystartup.suggestfeature.utils.Util;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static java.util.stream.Collectors.groupingBy;

/*
 * @author indianBond
 */
@Service
public class NotificationService {

    private final MongoTemplateFactory mongoConnection;
    private final AuthService authService;
    private final Logger LOGGER = LoggerFactory.getLogger(NotificationService.class);

    @Autowired
    public NotificationService(MongoTemplateFactory mongoConnection, AuthService authService) {
        this.mongoConnection = mongoConnection;
        this.authService = authService;
    }

    public void addPostNotification(Post post, boolean teamMember) {
        addNotification(NotificationType.POST, post.getCreatedByUserId(), post.getOrganizationId(), post.getBoardId(), Map.of("postId", post.getId()), teamMember, post.getCreatedAt());
    }

    public void addCommentNotification(Comment comment, boolean teamMember) {
        addNotification(NotificationType.COMMENT, comment.getCreatedByUserId(), comment.getOrganizationId(), comment.getBoardId(), Map.of("commentId", comment.getId()), teamMember, comment.getCreatedAt());
    }

    public void addPostStatusUpdateNotification(Post post, String userId) {
        addNotification(NotificationType.POST_STATUS_UPDATE, userId, post.getOrganizationId(), post.getBoardId(), Map.of("postId", post.getId(), "status", post.getStatus()), true, null);
    }

    public void addNotification(NotificationType type, String userId, String organizationId, String boardId, Map<String, Object> data, boolean teamMember, Long createdTime) {
        try {
            Notification notification = new Notification();
            notification.setUserId(userId);
            notification.setBoardId(boardId);
            notification.setOrganizationId(organizationId);
            notification.setCreatedByUserType(teamMember ? "TEAM_MEMBER" : "END_USER");
            notification.setType(type);
            notification.setData(data);
            if (createdTime == null) {
                createdTime = System.currentTimeMillis();
            }
            notification.setCreatedAt(createdTime);
            mongoConnection.getDefaultMongoTemplate().save(notification);
        } catch (Throwable throwable) {
            LOGGER.error("Error adding notification " + type + " for " + organizationId, throwable);
        }
    }

    public List<Notification> getNotifications(GetNotificationRequestDTO requestDTO, String orgId) {
        Criteria criteria = Criteria.where(Notification.FIELD_ORGANIZATION_ID).is(orgId);
        if (requestDTO.getBoardId() != null) {
            criteria.and(Notification.FIELD_BOARD_ID).is(requestDTO.getBoardId());
        }
        if (requestDTO.getNotificationType() != null) {
            criteria.and(Notification.FIELD_TYPE).is(requestDTO.getNotificationType().name());
        }
        if (requestDTO.getCreatedByUserType() != null) {
            criteria.and(Notification.FIELD_CREATED_BY_USER_TYPE).is(requestDTO.getCreatedByUserType());
        }
        Query query = new Query(criteria);
        query.with(Sort.by(Sort.Direction.DESC, Notification.FIELD_CREATED_AT));
        List<Notification> notifications = mongoConnection.getDefaultMongoTemplate().find(query, Notification.class);
        populateData(notifications);
        return notifications;
    }

    private void populateData(List<Notification> notifications) {
        // group notifications by notification type
        Map<NotificationType, List<Notification>> collect = notifications.stream().collect(groupingBy(Notification::getType));
        for (Map.Entry<NotificationType, List<Notification>> notificationTypeListEntry : collect.entrySet()) {
            switch (notificationTypeListEntry.getKey()) {
                case POST_STATUS_UPDATE:
                case POST:
                    populatePostData(notificationTypeListEntry.getValue());
                    break;
                case COMMENT:
                    populateCommentData(notificationTypeListEntry.getValue());
                    break;
            }
        }
    }

    private void populateCommentData(List<Notification> value) {
        Set<String> commentIds = value.stream().map(notification -> (String) notification.getData().get("commentId")).collect(Collectors.toSet());
        Query query = new Query(Criteria.where(Comment.FIELD_ID).in(commentIds));
        List<Comment> comments = mongoConnection.getDefaultMongoTemplate().find(query, Comment.class);
        Set<String> postIds = comments.stream().map(comment -> comment.getPostId()).collect(Collectors.toSet());
        Map<String, Post> postMap = getPosts(postIds);

        Set<String> allUserIdsToFetch = comments.stream().map(Comment::getCreatedByUserId).collect(Collectors.toSet());
        postMap.values().forEach(post -> allUserIdsToFetch.add(post.getCreatedByUserId()));

        List<User> users = authService.getUsersByUserIds(allUserIdsToFetch);
        Map<String, User> userMap = users.stream().collect(Collectors.toMap(User::getId, user -> user));

        Map<String, Comment> commentMap = comments.stream().collect(Collectors.toMap(Comment::getId, comment -> comment));
        for (Notification notification : value) {
            Comment comment = commentMap.get((String) notification.getData().get("commentId"));
            if (comment == null) {
                continue;
            }
            comment.setUser(Util.getSafeUser(userMap.get(comment.getCreatedByUserId()), false, "TEAM_MEMBER".equals(notification.getCreatedByUserType())));
            Post post = postMap.get(comment.getPostId());
            if (post == null) {
                continue;
            }
            post.setUser(Util.getSafeUser(userMap.get(post.getCreatedByUserId()), false, "TEAM_MEMBER".equals(notification.getCreatedByUserType())));
            notification.setData(Map.of("comment", comment, "post", post));
        }
    }

    private void populatePostData(List<Notification> value) {
        Set<String> postIds = value.stream().map(notification -> (String) notification.getData().get("postId")).collect(Collectors.toSet());
        Set<String> allUserIdsToFetch = new HashSet<>();
        Map<String, Post> postMap = getPosts(postIds);
        postMap.values().forEach(post -> allUserIdsToFetch.add(post.getCreatedByUserId()));
        List<User> users = authService.getUsersByUserIds(allUserIdsToFetch);
        Map<String, User> userMap = users.stream().collect(Collectors.toMap(User::getId, user -> user));
        for (Notification notification : value) {
            Post post = postMap.get((String) notification.getData().get("postId"));
            if (post == null) {
                continue;
            }
            post.setUser(Util.getSafeUser(userMap.get(post.getCreatedByUserId()), false, "TEAM_MEMBER".equals(notification.getCreatedByUserType())));
            notification.setData(Map.of("post", post));
        }
    }

    private Map<String, Post> getPosts(Set<String> postIds) {
        Query query = new Query(Criteria.where(Post.FIELD_ID).in(postIds));
        List<Post> posts = mongoConnection.getDefaultMongoTemplate().find(query, Post.class);
        return posts.stream().collect(Collectors.toMap(Post::getId, post -> post));
    }
}
