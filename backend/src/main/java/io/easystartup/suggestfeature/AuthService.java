package io.easystartup.suggestfeature;

import com.amazonaws.auth.AWSStaticCredentialsProvider;
import com.amazonaws.auth.BasicAWSCredentials;
import com.amazonaws.services.simpleemail.AmazonSimpleEmailService;
import com.amazonaws.services.simpleemail.AmazonSimpleEmailServiceClientBuilder;
import com.amazonaws.services.simpleemail.model.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import io.easystartup.suggestfeature.beans.RateLimit;
import io.easystartup.suggestfeature.beans.User;
import io.easystartup.suggestfeature.loggers.Logger;
import io.easystartup.suggestfeature.loggers.LoggerFactory;
import io.easystartup.suggestfeature.utils.Util;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtBuilder;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.apache.commons.lang3.time.StopWatch;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.TimeUnit;

@Service
public class AuthService {

    private static final Logger LOGGER = LoggerFactory.getLogger(AuthService.class);
    private final MongoTemplateFactory mongoTemplateFactory;

    @Autowired
    public AuthService(MongoTemplateFactory mongoTemplateFactory) {
        this.mongoTemplateFactory = mongoTemplateFactory;
    }

    public String createJWTToken(String issuer, String subject, long ttlMillis, User user) {

        long nowMillis = System.currentTimeMillis();
        Date now = new Date(nowMillis);

        //We will sign our JWT with our ApiKey secret
        Map<String, Object> claims = new HashMap<>();
        claims.put("userName", user.getEmail());
        claims.put("userId", user.getId());

        long expMillis = nowMillis + ttlMillis;
        Date exp = new Date(expMillis);

        //Let's set the JWT Claims
        JwtBuilder builder = Jwts.builder()
                .id(UUID.randomUUID().toString())
                .issuedAt(now)
                .subject(subject)
                .issuer(issuer)
                .notBefore(new Date(nowMillis - TimeUnit.MINUTES.toMillis(20)))
                .claims(claims)
                .expiration(exp)
                .signWith(getJWTSecretKey());


        //Builds the JWT and serializes it to a compact, URL-safe string
        return builder.compact();
    }

    public Claims decodeJWT(String jwt) {
        try {
            if (jwt.startsWith("Bearer ")) {
                jwt = jwt.substring(7);
            }
            //This line will throw an exception if it is not a signed JWS (as expected)
            return Jwts.parser()
                    .clockSkewSeconds(TimeUnit.MINUTES.toSeconds(15))
                    .verifyWith(getJWTSecretKey())
                    .build()
                    .parseSignedClaims(jwt)
                    .getPayload();
        } catch (Throwable throwable) {
            return null;
        }
    }

    public LoginResponse getLoginSignUpResponseJson(User user) {
        StopWatch stopWatch = StopWatch.createStarted();
        User safeUser = new User();
        safeUser.setEmail(user.getEmail());
        safeUser.setId(user.getId());
        safeUser.setName(user.getName());
        String jwtToken = createJWTToken("suggestFeature", "user", TimeUnit.DAYS.toMillis(15), safeUser);
        stopWatch.stop();
        user.setPassword(null);
        return new LoginResponse("Bearer " + jwtToken, safeUser);
    }

    /**
     * On successful login, reset everything
     * On incorrect attempt, increment the count
     * On magic link sent, increment the count
     */

    public void incMagicLinkSentCount(String email) {
        mongoTemplateFactory.getDefaultMongoTemplate().updateFirst(new Query(Criteria.where(User.FIELD_EMAIL).is(email)),
                new Update().inc(User.FIELD_MAGIC_LINK_SENT_COUNT, 1), User.class);
    }

    public void blockUserUntil(String email, Long until) {
        mongoTemplateFactory.getDefaultMongoTemplate().updateFirst(new Query(Criteria.where(User.FIELD_EMAIL).is(email)),
                new Update().set(User.FIELD_USER_BLOCKED_UNTIL, until), User.class);
    }

    public void incIncorrectAttemptCount(String email) {
        mongoTemplateFactory.getDefaultMongoTemplate().updateFirst(new Query(Criteria.where(User.FIELD_EMAIL).is(email)),
                new Update().inc(User.FIELD_INCORRECT_ATTEMPT_COUNT, 1), User.class);
    }

    public void resetMagicLinkCount(String email) {
        Update inc = new Update()
                .set(User.FIELD_MAGIC_LINK_SENT_COUNT, 0)
                .set(User.FIELD_INCORRECT_ATTEMPT_COUNT, 0)
                .unset(User.FIELD_MAGIC_LINK_CODE)
                .unset(User.FIELD_MAGIC_LINK_VALID_TILL)
                .unset(User.FIELD_USER_BLOCKED_UNTIL);
        mongoTemplateFactory.getDefaultMongoTemplate().updateFirst(new Query(Criteria.where(User.FIELD_EMAIL).is(email)),
                inc, User.class);
    }

    public void sendMagicLink(String to, String linkCode) {
        String from = Util.getEnvVariable("FROM_EMAIL", "fromEmail");
        String subject = "Your verification code";

        String bodyHtml = "<html>"
                + "<head></head>"
                + "<body style=\"font-family: Arial, sans-serif; background-color: #f2f2f2; padding: 20px;\">"
                + "<div style=\"background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); max-width: 600px; margin: auto;\">"
                + "<h1 style=\"color: #333333;\">Your Verification Code</h1>"
                + "<p style=\"font-size: 16px; color: #666666;\">Use the following verification code to complete your sign-in process:</p>"
                + "<p style=\"font-size: 32px; font-weight: bold; color: #007BFF; background-color: #e9ecef; padding: 10px; border-radius: 5px; display: inline-block; text-align: center; margin: 20px 0;\">" + linkCode + "</p>"
                + "<p style=\"font-size: 16px; color: #666666;\">If you didn't request this code, please ignore this email.</p>"
                + "</div>"
                + "</body>"
                + "</html>";

        validateRateLimit();

        sendEmail(to, bodyHtml, subject, from);
    }

    private void validateRateLimit() {
        int month = Calendar.getInstance().get(Calendar.MONTH);
        int year = Calendar.getInstance().get(Calendar.YEAR);

        Criteria criteriaDefinition = Criteria.where(RateLimit.FIELD_ID).is("rateLimit:" + year + ":" + month);
        Query query = new Query(criteriaDefinition);
        Update update = new Update().inc(RateLimit.FIELD_LIMIT, 1)
                .setOnInsert(RateLimit.FIELD_ID, "rateLimit:" + year + ":" + month);
        RateLimit rateLimit = mongoTemplateFactory.getDefaultMongoTemplate().findAndModify(query, update, FindAndModifyOptions.options().returnNew(true).upsert(true), RateLimit.class);
        if (rateLimit.getCount() > Util.getEnvVariable("EMAIL_RATE_LIMIT", 1_000_000L)) {
            LOGGER.error("Rate limit exceeded for sending magic link email");
            throw new RuntimeException("Rate limit exceeded for sending magic link email! Please try again later.");
        }
    }

    private static void sendEmail(String to, String bodyText, String subject, String from) {
        try {
            AmazonSimpleEmailService client = createSesClient();

            SendEmailRequest request = new SendEmailRequest()
                    .withDestination(new Destination().withToAddresses(to))
                    .withMessage(new Message()
                            .withBody(new Body().withHtml(new Content().withCharset("UTF-8").withData(bodyText)))
                            .withSubject(new Content().withCharset("UTF-8").withData(subject)))
                    .withSource(from);

            // Send the email
            client.sendEmail(request);
            LOGGER.error("Magic link email sent! " + to);
        } catch (Exception ex) {
            System.out.println("The email was not sent. Error message: " + ex.getMessage());
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

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class LoginResponse {

        private String token;
        private User user;
        private String organizationSlug;
        private String projectSlug;

        public LoginResponse(String token, User user) {
            this.token = token;
            this.user = user;
        }

        public LoginResponse() {
        }

        public String getToken() {
            return token;
        }

        public void setToken(String token) {
            this.token = token;
        }

        public User getUser() {
            return user;
        }

        public void setUser(User user) {
            this.user = user;
        }

        public String getOrganizationSlug() {
            return organizationSlug;
        }

        public void setOrganizationSlug(String organizationSlug) {
            this.organizationSlug = organizationSlug;
        }

        public String getProjectSlug() {
            return projectSlug;
        }

        public void setProjectSlug(String projectSlug) {
            this.projectSlug = projectSlug;
        }
    }

    private SecretKey getJWTSecretKey() {
        return Keys.hmacShaKeyFor(Util.getEnvVariable("JWT_KEY", UUID.randomUUID().toString()).getBytes(StandardCharsets.UTF_8));
    }

}
