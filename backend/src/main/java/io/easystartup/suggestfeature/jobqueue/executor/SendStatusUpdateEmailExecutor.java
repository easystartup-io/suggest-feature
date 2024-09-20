package io.easystartup.suggestfeature.jobqueue.executor;


import com.amazonaws.auth.AWSStaticCredentialsProvider;
import com.amazonaws.auth.BasicAWSCredentials;
import com.amazonaws.services.simpleemail.AmazonSimpleEmailService;
import com.amazonaws.services.simpleemail.AmazonSimpleEmailServiceClientBuilder;
import com.amazonaws.services.simpleemail.model.*;
import io.easystartup.suggestfeature.beans.*;
import io.easystartup.suggestfeature.jobqueue.scheduler.JobExecutor;
import io.easystartup.suggestfeature.loggers.Logger;
import io.easystartup.suggestfeature.loggers.LoggerFactory;
import io.easystartup.suggestfeature.services.AuthService;
import io.easystartup.suggestfeature.services.db.MongoTemplateFactory;
import io.easystartup.suggestfeature.utils.LazyService;
import io.easystartup.suggestfeature.utils.Util;
import io.github.resilience4j.ratelimiter.RateLimiterConfig;
import io.github.resilience4j.ratelimiter.RateLimiterRegistry;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.lang3.StringEscapeUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;

import java.time.Duration;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/*
 * @author indianBond
 */
public class SendStatusUpdateEmailExecutor implements JobExecutor {

    private static final Logger LOGGER = LoggerFactory.getLogger(SendStatusUpdateEmailExecutor.class);
    private final LazyService<AuthService> authService = new LazyService<>(AuthService.class);
    private final LazyService<MongoTemplateFactory> mongoConnection = new LazyService<>(MongoTemplateFactory.class);
    // Block indefinitely till lock received
    RateLimiterConfig config = RateLimiterConfig.custom()
            .timeoutDuration(Duration.ofHours(100))
            .limitRefreshPeriod(Duration.ofSeconds(1))
            .limitForPeriod(500)
            .build();
    RateLimiterRegistry rateLimiterRegistry = RateLimiterRegistry.of(config);

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
        if (CollectionUtils.isEmpty(voters)) {
            return;
        }
        if (voters.size() == 1 && voters.get(0).getUserId().equals(userId)) {
            return;
        }


        String senderEmail = Util.getEnvVariable("FROM_EMAIL", "fromEmail");
        Organization organization = authService.get().getOrgById(orgId);
        User userUpdatingStatus = authService.get().getUserByUserId(userId);

        String boardSlug = null;
        {
            Board board = mongoConnection.get().getDefaultMongoTemplate().findOne(Query.query(Criteria.where(Board.FIELD_ID).is(post.getBoardId()).and(Board.FIELD_ORGANIZATION_ID).is(organization.getId())), Board.class);
            boardSlug = board.getSlug();
        }

        String baseDomain = "";
        String slug = organization.getSlug();
        String customDomain = organization.getCustomDomain();
        if (StringUtils.isNotBlank(customDomain)) {
            baseDomain = "https://" + customDomain;
        } else {
            baseDomain = "https://" + slug + ".suggestfeature.com";
        }

        String postUrl = baseDomain + "/b/" + boardSlug + "/p/" + post.getSlug();

        // Prepare email content
        String subject = "Update on Post: " + escapeHtml(post.getTitle()) + " - Status Changed to " + escapeHtml(status);
        String bodyHtml = constructEmailBodyHtml(organization, post, userUpdatingStatus, status, postUrl);

        Set<String> values = new HashSet<>();
        // Get list of voterId vs userIds map from voters list
        Map<String, String> voterIdVsUserIdMap = voters.stream()
                .collect(Collectors.toMap(Voter::getId, Voter::getUserId));
        values.addAll(voterIdVsUserIdMap.values());

        // Fetch people who have commented. Just fetch commentedByUserIdField
        List<Comment> comments = mongoConnection.get().getDefaultMongoTemplate().find(Query.query(Criteria.where(Comment.FIELD_POST_ID).is(post.getId())), Comment.class);
        if (CollectionUtils.isNotEmpty(comments)) {
            List<String> commentedByUserIds = comments.stream().map(Comment::getCreatedByUserId).collect(Collectors.toList());
            values.addAll(commentedByUserIds);
        }

        List<User> users = authService.get().getUsersByUserIds(new HashSet<>(values));

        // Rate limit to 10 per second using resiliency 4j rate limiter. Block thread till next one is avaailable

        users.forEach(user -> {
            rateLimiterRegistry.rateLimiter("send-email").executeSupplier(() -> {
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

    private String constructEmailBodyHtml(Organization organization, Post post, User userUpdatingStatus, String status, String postUrl) {
        String logo = organization.getLogo();
        String organizationName = escapeHtml(organization.getName());
        String postTitle = escapeHtml(post.getTitle());
        String statusText = escapeHtml(status);
        String userProfilePic = userUpdatingStatus.getProfilePic();
        String userName = escapeHtml(userUpdatingStatus.getName());

        String userMessage = "The status of the post \"" + postTitle + "\" has been updated to " + statusText + " by " + userName + ".";

        return "<html>"
                + "<head><style>"
                + "body {font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 0; margin: 0;}"
                + ".container {background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); max-width: 600px; margin: 40px auto;}"
                + ".logo {max-height: 50px; margin-bottom: 20px;}"
                + ".title {font-size: 24px; color: #333333; margin: 20px 0; font-weight: normal;}"
                + ".post-title {font-weight: bold;}"
                + ".status {color: #34A853; font-weight: bold;}"
                + ".user-info {display: flex; align-items: center; margin: 20px 0;}"
                + ".user-avatar {width: 40px; height: 40px; border-radius: 50%; margin-right: 15px;}"
                + ".user-name {font-weight: bold;}"
                + ".message {font-size: 16px; color: #555555; margin: 20px 0; line-height: 1.6;}"
                + ".reply-button {display: inline-block; padding: 10px 20px; background-color: #4285F4; color: #ffffff; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 14px;}"
                + "</style></head>"
                + "<body>"
                + "<div class=\"container\">"
                + "<img src=\"" + logo + "\" alt=\"" + organizationName + "\" class=\"logo\" />"
                + "<h1 class=\"title\">Your post, <span class=\"post-title\">\"" + postTitle + "\"</span>, has been marked as <span class=\"status\">" + statusText + "</span></h1>"
                + "<div class=\"user-info\">"
                + "<img src=\"" + userProfilePic + "\" alt=\"" + userName + "\" class=\"user-avatar\" />"
                + "<span class=\"user-name\">" + userName + " from " + organizationName + ":</span>"
                + "</div>"
                + "<p class=\"message\">" + userMessage + "</p>"
                + "<a href=\"" + postUrl + "\" class=\"reply-button\">REPLY</a>"
                + "</div>"
                + "</body>"
                + "</html>";
    }

    private void sendEmail(String to, String bodyHtml, String subject, String from) {
        try {
            AmazonSimpleEmailService client = createSesClient();
            SendEmailRequest request = new SendEmailRequest()
                    .withDestination(new Destination().withToAddresses(to))
                    .withMessage(new Message()
                            .withBody(new Body().withHtml(new Content().withCharset("UTF-8").withData(bodyHtml)))
                            .withSubject(new Content().withCharset("UTF-8").withData(subject)))
                    .withSource(from);

            SendEmailResult sendEmailResult = client.sendEmail(request);
            LOGGER.info("Email sent! " + to + " Message ID: " + sendEmailResult.getMessageId());
        } catch (Exception ex) {
            LOGGER.error("The email was not sent. Error message: " + ex.getMessage(), ex);
        }
    }

    private AmazonSimpleEmailService createSesClient() {
        String accessKey = Util.getEnvVariable("AWS_ACCESS_KEY", "accessKey");
        String secretKey = Util.getEnvVariable("AWS_SECRET", "secretKey");
        String region = Util.getEnvVariable("AWS_REGION", "us-east-1");
        BasicAWSCredentials awsCreds = new BasicAWSCredentials(accessKey, secretKey);
        return AmazonSimpleEmailServiceClientBuilder.standard()
                .withRegion(region)
                .withCredentials(new AWSStaticCredentialsProvider(awsCreds))
                .build();
    }

    private String escapeHtml(String input) {
        return StringEscapeUtils.escapeHtml4(input);
    }
}
