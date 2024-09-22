package io.easystartup.suggestfeature.utils;


import com.amazonaws.auth.AWSStaticCredentialsProvider;
import com.amazonaws.auth.BasicAWSCredentials;
import com.amazonaws.services.simpleemail.AmazonSimpleEmailService;
import com.amazonaws.services.simpleemail.AmazonSimpleEmailServiceClientBuilder;
import com.amazonaws.services.simpleemail.model.*;
import io.easystartup.suggestfeature.loggers.Logger;
import io.easystartup.suggestfeature.loggers.LoggerFactory;
import org.apache.commons.lang3.StringEscapeUtils;
import org.apache.commons.lang3.StringUtils;

import static io.easystartup.suggestfeature.utils.Util.getNameFromEmail;

/*
 * @author indianBond
 */
public class EmailUtil {

    private static final Logger LOGGER = LoggerFactory.getLogger(EmailUtil.class);

    public static void sendEmail(String to, String bodyHtml, String subject, String from) {
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

    private static AmazonSimpleEmailService createSesClient() {
        String accessKey = Util.getEnvVariable("AWS_ACCESS_KEY", "accessKey");
        String secretKey = Util.getEnvVariable("AWS_SECRET", "secretKey");
        String region = Util.getEnvVariable("AWS_REGION", "us-east-1");
        BasicAWSCredentials awsCreds = new BasicAWSCredentials(accessKey, secretKey);
        return AmazonSimpleEmailServiceClientBuilder.standard()
                .withRegion(region)
                .withCredentials(new AWSStaticCredentialsProvider(awsCreds))
                .build();
    }

    public static String getUserInitials(String userName, String email) {
        if (StringUtils.isBlank(userName)) {
            return getNameFromEmail(email);
        }
        String[] nameParts = userName.split("\\s+");
        if (nameParts.length > 1) {
            return (nameParts[0].charAt(0) + "" + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
        }
        return userName.substring(0, Math.min(userName.length(), 2)).toUpperCase();
    }

    public static String escapeHtml(String input) {
        return StringEscapeUtils.escapeHtml4(input);
    }
}
