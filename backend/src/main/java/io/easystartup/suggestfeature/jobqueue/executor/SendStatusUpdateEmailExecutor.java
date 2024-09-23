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

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static io.easystartup.suggestfeature.utils.EmailUtil.*;
import static io.easystartup.suggestfeature.utils.PostUtil.getPostUrl;

/*
 * @author indianBond
 */
public class SendStatusUpdateEmailExecutor implements JobExecutor {

    private static final Logger LOGGER = LoggerFactory.getLogger(SendStatusUpdateEmailExecutor.class);
    private final LazyService<AuthService> authService = new LazyService<>(AuthService.class);
    private final LazyService<MongoTemplateFactory> mongoConnection = new LazyService<>(MongoTemplateFactory.class);

    /**
     * Send status update email to everyone who has interacted with the post, created the post
     */
    @Override
    public void execute(Map<String, Object> data, String orgId) {
        String postId = (String) data.get("postId");
        String status = (String) data.get("status");
        String userId = (String) data.get("userId");

        Post post = mongoConnection.get().getDefaultMongoTemplate().findById(postId, Post.class);
        if (post == null) {
            return;
        }

        // Fetch list of voters
        List<Voter> voters = fetchVoters(post.getId());

        String senderEmail = Util.getEnvVariable("FROM_EMAIL", "fromEmail");
        Organization organization = authService.get().getOrgById(orgId);
        User userUpdatingStatus = authService.get().getUserByUserId(userId);

        boolean isUserAdmin = false;
        Member memberForOrgId = authService.get().getMemberForOrgId(userUpdatingStatus.getId(), organization.getId());
        if (memberForOrgId != null) {
            isUserAdmin = true;
        }

        String postUrl = getPostUrl(post, organization);

        // Prepare email content
        String subject = "Update on Post: " + escapeHtml(post.getTitle()) + " - Status Changed to " + escapeHtml(status);
        String bodyHtml = constructEmailBodyHtml(organization, post, userUpdatingStatus, status, postUrl, isUserAdmin);

        // Get list of voterId vs userIds map from voters list
        Map<String, String> voterIdVsUserIdMap = voters.stream()
                .collect(Collectors.toMap(Voter::getId, Voter::getUserId));
        Set<String> userIds = new HashSet<>(voterIdVsUserIdMap.values());

        // If post is created by user(who might not be admin), add that user to the list
        userIds.add(post.getCreatedByUserId());

        // Fetch people who have commented. Just fetch commentedByUserIdField
        List<Comment> comments = mongoConnection.get().getDefaultMongoTemplate().find(Query.query(Criteria.where(Comment.FIELD_POST_ID).is(post.getId())), Comment.class);
        if (CollectionUtils.isNotEmpty(comments)) {
            List<String> commentedByUserIds = comments.stream().map(Comment::getCreatedByUserId).collect(Collectors.toList());
            userIds.addAll(commentedByUserIds);
        }

        // Don't send notification to person who updated the status, because he knows it already
        userIds = userIds.stream().filter(uId -> !userId.equals(uId)).collect(Collectors.toSet());

        if (CollectionUtils.isEmpty(userIds)) {
            return;
        }

        List<User> users = authService.get().getUsersByUserIds(userIds);

        // Rate limit to 500 per second using resiliency 4j rate limiter. Block thread till next one is avaailable
        users.forEach(user -> {
            RateLimiters.rateLimiter("send-email").executeSupplier(() -> {
                sendEmail(user.getEmail(), bodyHtml, subject, senderEmail);
                return null;
            });
        });
    }

    private List<Voter> fetchVoters(String postId) {
        Criteria criteriaDefinition = Criteria.where(Voter.FIELD_POST_ID).is(postId);
        Query query = new Query(criteriaDefinition).with(Sort.by(Sort.Direction.DESC, Voter.FIELD_CREATED_AT));
        return mongoConnection.get().getDefaultMongoTemplate().find(query, Voter.class);
    }

    private String constructEmailBodyHtml(Organization organization, Post post, User userUpdatingStatus, String status, String postUrl, boolean isUserAdmin) {
        String logo = organization.getLogo();
        String organizationName = escapeHtml(organization.getName());
        String postTitle = escapeHtml(post.getTitle());
        String statusText = escapeHtml(status);
        String userProfilePic = userUpdatingStatus.getProfilePic();
        String userName = escapeHtml(userUpdatingStatus.getName());
        String userInitials = getUserInitials(userName, userUpdatingStatus.getEmail());


        String userNameField = isUserAdmin
                ? userName + " from <span style=\"color: #4F46E5;\">" + organizationName + "</span>"
                : userName + " from " + organizationName;

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

        String userMessage = "The status of the post \"" + postTitle + "\" has been updated to " + statusText + " by " + userName + ".";

        return "<html>"
                + "<head><style>"
                + "body {font-family: Arial, sans-serif; background-color: #f3f4f6; padding: 0; margin: 0;}"
                + ".container {background-color: #ffffff; padding: 2rem; border-radius: 0.5rem; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); max-width: 32rem; margin: 2rem auto;}"
                + ".logo {max-height: 3rem; margin-bottom: 1.5rem;}"
                + ".title {font-size: 1.5rem; color: #111827; margin: 1.5rem 0; font-weight: normal;}"
                + ".post-title {font-weight: 700;}"
                + ".status {color: #34A853; font-weight: bold;}"
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
                + "<h1 class=\"title\">Your post, <span class=\"post-title\">\"" + postTitle + "\"</span>, has been marked as <span class=\"status\">" + statusText + "</span></h1>"
                + "<div class=\"user-info\">"
                + avatarHtml
                + "<span class=\"user-name\">" + userNameField + "</span>"
                + "</div>"
                + "<p class=\"message\">" + userMessage + "</p>"
                + "<a href=\"" + postUrl + "\" class=\"reply-button\">VIEW POST</a>"
                + "</div>"
                + "</body>"
                + "</html>";
    }
}
