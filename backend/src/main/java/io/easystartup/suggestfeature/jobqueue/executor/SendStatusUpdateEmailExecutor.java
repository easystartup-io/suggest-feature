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
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.lang3.StringEscapeUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/*
 * @author indianBond
 */
public class SendStatusUpdateEmailExecutor implements JobExecutor {

    private static final Logger LOGGER = LoggerFactory.getLogger(SendStatusUpdateEmailExecutor.class);
    private final LazyService<AuthService> authService = new LazyService<>(AuthService.class);
    private final LazyService<MongoTemplateFactory> mongoConnection = new LazyService<>(MongoTemplateFactory.class);

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

        // Get list of voterId vs userIds map from voters list
        Map<String, String> voterIdVsUserIdMap = voters.stream()
                .collect(Collectors.toMap(Voter::getId, Voter::getUserId));
        List<User> users = authService.get().getUsersByUserIds(new HashSet<>(voterIdVsUserIdMap.values()));

        users.forEach(user -> sendEmail(user.getEmail(), bodyHtml, subject, senderEmail));
    }

    private List<Voter> fetchVoters(String postId) {
        Criteria criteriaDefinition = Criteria.where(Voter.FIELD_POST_ID).is(postId);
        Query query = new Query(criteriaDefinition).with(Sort.by(Sort.Direction.DESC, Voter.FIELD_CREATED_AT));
        return mongoConnection.get().getDefaultMongoTemplate().find(query, Voter.class);
    }

    private String constructEmailBodyHtml(Organization organization, Post post, User userUpdatingStatus, String status, String postUrl) {
        return "<html>"
                + "<head><style>body {font-family: Arial, sans-serif; background-color: #f2f2f2; padding: 20px;}</style></head>"
                + "<body>"
                + "<div style=\"background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); max-width: 600px; margin: auto;\">"
                + "<h1 style=\"color: #333333;\">Status Update for the Post: " + escapeHtml(post.getTitle()) + "</h1>"
                + "<p style=\"font-size: 16px; color: #666666;\">The status of the post \"" + escapeHtml(post.getTitle())
                + "\" has been updated to <strong>" + escapeHtml(status) + "</strong> by "
                + escapeHtml(userUpdatingStatus.getName()) + " .</p>"
                + "<p style=\"font-size: 16px; color: #666666;\">You can view the updated post on "
                + "<a href=\"" + postUrl
                + "\" style=\"color: #1a73e8; text-decoration: none;\">Suggest Feature</a>.</p>"
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
