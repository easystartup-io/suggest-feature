package io.easystartup.suggestfeature.jobqueue.executor;


import io.easystartup.suggestfeature.beans.*;
import io.easystartup.suggestfeature.jobqueue.scheduler.JobExecutor;
import io.easystartup.suggestfeature.loggers.Logger;
import io.easystartup.suggestfeature.loggers.LoggerFactory;
import io.easystartup.suggestfeature.services.AuthService;
import io.easystartup.suggestfeature.services.db.MongoTemplateFactory;
import io.easystartup.suggestfeature.utils.LazyService;
import io.easystartup.suggestfeature.utils.RateLimiters;
import io.easystartup.suggestfeature.utils.Util;
import org.apache.commons.collections4.CollectionUtils;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;

import java.util.*;
import java.util.stream.Collectors;

import static io.easystartup.suggestfeature.utils.EmailUtil.*;
import static io.easystartup.suggestfeature.utils.PostUtil.getPostUrl;

/*
 * @author indianBond
 */
public class SendCommentUpdateEmailExecutor implements JobExecutor {

    private static final Logger LOGGER = LoggerFactory.getLogger(SendCommentUpdateEmailExecutor.class);
    private final LazyService<AuthService> authService = new LazyService<>(AuthService.class);
    private final LazyService<MongoTemplateFactory> mongoConnection = new LazyService<>(MongoTemplateFactory.class);

    /**
     * 1. Send any admin public comment to voters
     * 2. If admin does a root level comment, send to others on that thread
     * 3. Send reply to user of the parent comment always, unless self reply
     */

    @Override
    public void execute(Map<String, Object> data, String orgId) {
        String commentId = (String) data.get("commentId");

        Comment comment = mongoConnection.get().getDefaultMongoTemplate().findById(commentId, Comment.class);
        if (comment == null) {
            return;
        }

        Member member = authService.get().getMemberForOrgId(comment.getCreatedByUserId(), orgId);

        boolean isUserAdmin = false;
        if (member != null) {
            isUserAdmin = true;
        }

        Post post = mongoConnection.get().getDefaultMongoTemplate().findById(comment.getPostId(), Post.class);

        if (post == null) {
            return;
        }

        // Send every comment to post author and send to people who have interacted with the comment/post
        String senderEmail = Util.getEnvVariable("FROM_EMAIL", "fromEmail");
        Organization organization = authService.get().getOrgById(orgId);
        User commentCreatedByUser = authService.get().getUserByUserId(comment.getCreatedByUserId());

        Set<String> userIds = new HashSet<>();
        // If admin commented root, send to all voters, including post creator, else send to all commenters
        if (comment.getReplyToCommentId() == null) {
            // Send email to voters
            List<Voter> voters = fetchVoters(post.getId());
            voters.forEach(voter -> userIds.add(voter.getUserId()));
            userIds.add(post.getCreatedByUserId());
        } else {
            // Send email to commentators of that post
            List<Comment> comments = mongoConnection.get().getDefaultMongoTemplate().find(Query.query(Criteria.where(Comment.FIELD_POST_ID).is(post.getId())), Comment.class);

            // All comments are fetched, find the root comment of the current comment
            Map<String, Comment> commentMap = comments.stream().collect(Collectors.toMap(Comment::getId, c -> c));
            Comment rootComment = Util.findRootComment(commentMap, comment);

            Comment parentComment = commentMap.get(comment.getReplyToCommentId());

            // Something is deleted
            if (rootComment == null) {
                return;
            }

            List<Comment> processedComments = Util.populateUserInCommentAndPopulateNestedCommentsStructure(comments, Collections.emptyMap());

            // Find all users who have commented on the same thread
            Optional<Comment> first = processedComments.stream().filter(val -> val.getId().equals(rootComment.getId())).findFirst();

            if (first.isPresent()) {
                Comment rootCommentFromList = first.get();
                userIds.add(rootCommentFromList.getCreatedByUserId());
                userIds.addAll(addAllPeopleWhoHaveCommented(rootCommentFromList));
            }
            if (parentComment != null) {
                userIds.add(parentComment.getCreatedByUserId());
            }
        }

        // remove the user who commented
        userIds.remove(comment.getCreatedByUserId());

        if (CollectionUtils.isEmpty(userIds)) {
            return;
        }

        String postUrl = getPostUrl(post, organization);

        // Prepare email content
        String subject = "Comment added on Post: " + escapeHtml(post.getTitle());
        String bodyHtml = constructEmailBodyHtml(organization, post, commentCreatedByUser, postUrl, comment, isUserAdmin);

        List<User> users = authService.get().getUsersByUserIds(userIds);

        // Rate limit to 500 per second using resiliency 4j rate limiter. Block thread till next one is avaailable

        users.forEach(user -> {
            RateLimiters.rateLimiter("send-email").executeSupplier(() -> {
                sendEmail(user.getEmail(), bodyHtml, subject, senderEmail);
                return null;
            });
        });
    }

    private static Set<String> addAllPeopleWhoHaveCommented(Comment rootCommentFromList) {
        Set<String> resp = new HashSet<>();
        resp.add(rootCommentFromList.getCreatedByUserId());

        if (CollectionUtils.isNotEmpty(rootCommentFromList.getComments())) {
            for (Comment c : rootCommentFromList.getComments()) {
                resp.add(c.getCreatedByUserId());
                resp.addAll(addAllPeopleWhoHaveCommented(c));
            }
        }
        return resp;
    }

    private String constructEmailBodyHtml(Organization organization, Post post, User commentCreatedByUser, String postUrl, Comment comment, boolean isUserAdmin) {
        String logo = organization.getLogo();
        String organizationName = escapeHtml(organization.getName());
        String postTitle = escapeHtml(post.getTitle());
        String userProfilePic = commentCreatedByUser.getProfilePic();
        String userName = escapeHtml(commentCreatedByUser.getName());
        String userInitials = getUserInitials(userName, commentCreatedByUser.getEmail());
        String userMessage = escapeHtml(comment.getContent());

        String userNameField = isUserAdmin
                ? userName + " from <span style=\"color: #4F46E5;\">" + organizationName + "</span>"
                : userName;

        String starIcon = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 20 20\" fill=\"#4F46E5\" class=\"star-icon\"><path d=\"M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z\"/></svg>";

        String avatarHtml = "<div class=\"avatar-container\">";
        if (userProfilePic != null && !userProfilePic.isEmpty()) {
            avatarHtml += "<img src=\"" + userProfilePic + "\" alt=\"" + userName + "\" class=\"user-avatar\" />";
        } else {
            avatarHtml += "<div class=\"user-avatar-fallback\">" + userInitials + "</div>";
        }
        if (isUserAdmin) {
            avatarHtml += "<div class=\"star-icon-container\">" + starIcon + "</div>";
        }
        avatarHtml += "</div>";

        return "<html>"
                + "<head><style>"
                + "body {font-family: Arial, sans-serif; background-color: #f3f4f6; padding: 0; margin: 0;}"
                + ".container {background-color: #ffffff; padding: 2rem; border-radius: 0.5rem; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); max-width: 32rem; margin: 2rem auto;}"
                + ".logo {max-height: 3rem; margin-bottom: 1.5rem;}"
                + ".title {font-size: 1.5rem; color: #111827; margin: 1.5rem 0; font-weight: normal;}"
                + ".post-title {font-weight: 700;}"
                + ".user-info {display: flex; align-items: center; margin: 1.5rem 0;}"
                + ".avatar-container {position: relative; margin-right: 1rem;}"
                + ".user-avatar, .user-avatar-fallback {width: 2.5rem; height: 2.5rem; border-radius: 9999px; object-fit: cover;}"
                + ".user-avatar-fallback {background-color: #E5E7EB; color: #4B5563; display: flex; align-items: center; justify-content: center; font-weight: 600;}"
                + ".star-icon-container {position: absolute; bottom: -0.25rem; right: -0.25rem; background-color: white; border-radius: 9999px; padding: 0.125rem;}"
                + ".star-icon {width: 1rem; height: 1rem;}"
                + ".user-name {font-weight: 600;}"
                + ".message {font-size: 1rem; color: #4b5563; margin: 1.5rem 0; line-height: 1.5; padding: 1rem; background-color: #f3f4f6; border-radius: 0.375rem;}"
                + ".reply-button {display: inline-block; padding: 0.75rem 1.5rem; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 0.375rem; font-weight: 600; font-size: 0.875rem; transition: background-color 0.2s;}"
                + ".reply-button:hover {background-color: #1d4ed8;}"
                + "</style></head>"
                + "<body>"
                + "<div class=\"container\">"
                + "<img src=\"" + logo + "\" alt=\"" + organizationName + "\" class=\"logo\" />"
                + "<h1 class=\"title\">A new comment has been added to your post, <span class=\"post-title\">\"" + postTitle + "\"</span></h1>"
                + "<div class=\"user-info\">"
                + avatarHtml
                + "<span class=\"user-name\">" + userNameField + "</span>"
                + "</div>"
                + "<p class=\"message\">" + userMessage + "</p>"
                + "<a href=\"" + postUrl + "\" class=\"reply-button\">REPLY</a>"
                + "</div>"
                + "</body>"
                + "</html>";
    }

    private List<Voter> fetchVoters(String postId) {
        Criteria criteriaDefinition = Criteria.where(Voter.FIELD_POST_ID).is(postId);
        Query query = new Query(criteriaDefinition).with(Sort.by(Sort.Direction.DESC, Voter.FIELD_CREATED_AT));
        return mongoConnection.get().getDefaultMongoTemplate().find(query, Voter.class);
    }
}
