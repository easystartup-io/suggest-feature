package io.easystartup.suggestfeature.services;


import io.easystartup.suggestfeature.beans.Comment;
import io.easystartup.suggestfeature.beans.Notification;
import io.easystartup.suggestfeature.beans.Notification.NotificationType;
import io.easystartup.suggestfeature.beans.Post;
import io.easystartup.suggestfeature.loggers.Logger;
import io.easystartup.suggestfeature.loggers.LoggerFactory;
import io.easystartup.suggestfeature.services.db.MongoTemplateFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Map;

/*
 * @author indianBond
 */
@Service
public class NotificationService {

    private final MongoTemplateFactory mongoConnection;
    private final Logger LOGGER = LoggerFactory.getLogger(NotificationService.class);

    @Autowired
    public NotificationService(MongoTemplateFactory mongoConnection) {
        this.mongoConnection = mongoConnection;
    }


    public void addPostNotification(Post post) {
        addNotification(NotificationType.POST, post.getCreatedByUserId(), post.getOrganizationId(), Map.of("postId", post.getId()));
    }

    public void addCommentNotification(Comment comment) {
        addNotification(NotificationType.COMMENT, comment.getCreatedByUserId(), comment.getOrganizationId(), Map.of("commentId", comment.getId()));
    }

    public void addPostStatusUpdateNotification(Post post, String userId) {
        addNotification(NotificationType.POST_STATUS_UPDATE, userId, post.getOrganizationId(), Map.of("postId", post.getId(), "status", post.getStatus()));
    }

    public void addNotification(NotificationType type, String userId, String organizationId, Map<String, Object> data) {
        try {
            Notification notification = new Notification();
            notification.setUserId(userId);
            notification.setOrganizationId(organizationId);
            notification.setType(type);
            notification.setData(data);
            notification.setCreatedAt(System.currentTimeMillis());
            mongoConnection.getDefaultMongoTemplate().save(notification);
        } catch (Throwable throwable) {
            LOGGER.error("Error adding notification " + type + " for " + organizationId, throwable);
        }
    }

}
