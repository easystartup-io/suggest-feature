package io.easystartup.suggestfeature.services;

import com.google.common.base.Splitter;
import com.google.common.collect.Iterables;
import io.easystartup.suggestfeature.beans.*;
import io.easystartup.suggestfeature.dto.LoginResponse;
import io.easystartup.suggestfeature.filters.UserContext;
import io.easystartup.suggestfeature.loggers.Logger;
import io.easystartup.suggestfeature.loggers.LoggerFactory;
import io.easystartup.suggestfeature.services.db.MongoTemplateFactory;
import io.easystartup.suggestfeature.utils.EmailUtil;
import io.easystartup.suggestfeature.utils.Util;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtBuilder;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.lang3.StringEscapeUtils;
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

        // We will sign our JWT with our ApiKey secret
        Map<String, Object> claims = new HashMap<>();
        claims.put("userName", user.getEmail());
        claims.put("userId", user.getId());

        long expMillis = nowMillis + ttlMillis;
        Date exp = new Date(expMillis);

        // Let's set the JWT Claims
        JwtBuilder builder = Jwts.builder()
                .id(UUID.randomUUID().toString())
                .issuedAt(now)
                .subject(subject)
                .issuer(issuer)
                .notBefore(new Date(nowMillis - TimeUnit.MINUTES.toMillis(20)))
                .claims(claims)
                .expiration(exp)
                .signWith(getJWTSecretKey());

        // Builds the JWT and serializes it to a compact, URL-safe string
        return builder.compact();
    }

    public Claims decodeJWT(String jwt) {
        try {
            if (jwt.startsWith("Bearer ")) {
                jwt = jwt.substring(7);
            }
            // This line will throw an exception if it is not a signed JWS (as expected)
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

    public LoginResponse getLoginSignUpResponseJson(User user, boolean portal) {
        StopWatch stopWatch = StopWatch.createStarted();
        User safeUser = getSafeLoggedInUser(user);

        String jwtToken = createJWTToken("suggestFeature", "user", TimeUnit.DAYS.toMillis(90), safeUser);
        stopWatch.stop();
        user.setPassword(null);

        if (!portal) {
            List<Member> orgsForUser = getOrgsForUser(user.getId());
            if (CollectionUtils.isNotEmpty(orgsForUser)) {
                Member member = orgsForUser.get(0);
                Organization org = getOrganizationForId(member.getOrganizationId());
                if (org != null) {
                    return new LoginResponse("Bearer " + jwtToken, safeUser, org.getSlug(), member.getRole());
                }
            }
        }

        return new LoginResponse("Bearer " + jwtToken, safeUser, null, null);
    }

    public User getSafeLoggedInUser(User user) {
        User safeUser = new User();
        safeUser.setId(user.getId());
        safeUser.setEmail(user.getEmail());
        safeUser.setProfilePic(user.getProfilePic());

        // Do not make fake name and set, because will ask user to enter name while logging in if no name set
        safeUser.setName(user.getName());
        return safeUser;
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
                + "<p style=\"font-size: 32px; font-weight: bold; color: #007BFF; background-color: #e9ecef; padding: 10px; border-radius: 5px; display: inline-block; text-align: center; margin: 20px 0;\">"
                + linkCode + "</p>"
                + "<p style=\"font-size: 16px; color: #666666;\">This code is only valid for 10 minutes.</p>"
                + "<p style=\"font-size: 16px; color: #666666;\">If you didn't request this code, please ignore this email.</p>"
                + "</div>"
                + "</body>"
                + "</html>";

        validateRateLimit();

        EmailUtil.sendEmail(to, bodyHtml, subject, from);
    }


    public void sendAddedToOrgEmail(String recipientEmail, String organizationId, String addedByUserId) {
        String senderEmail = Util.getEnvVariable("FROM_EMAIL", "fromEmail");
        Organization organization = getOrgById(organizationId);
        User addedByUser = getUserByUserId(addedByUserId);

        // Subject
        String subject = "You have been added to " + organization.getName() + " - Suggest Feature";

        // Email Body
        String bodyHtml = "<html>"
                + "<head></head>"
                + "<body style=\"font-family: Arial, sans-serif; background-color: #f2f2f2; padding: 20px;\">"
                + "<div style=\"background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); max-width: 600px; margin: auto;\">"
                + "<h1 style=\"color: #333333;\">You have been added to the organization " + escapeHtml(organization.getName())
                + " by " + escapeHtml(addedByUser.getName()) + " &lt;" + escapeHtml(addedByUser.getEmail()) + "&gt;</h1>"
                + "<p style=\"font-size: 16px; color: #666666;\">Please visit <a href=\"https://app.suggestfeature.com\" style=\"color: #1a73e8; text-decoration: none;\">Suggest Feature</a> to accept the invitation.</p>"
                + "</div>"
                + "</body>"
                + "</html>";

        // Validate rate limit before sending the email
        validateRateLimit();

        // Send the email
        EmailUtil.sendEmail(recipientEmail, bodyHtml, subject, senderEmail);
    }

    private void validateRateLimit() {
        int month = Calendar.getInstance().get(Calendar.MONTH);
        int year = Calendar.getInstance().get(Calendar.YEAR);

        Criteria criteriaDefinition = Criteria.where(RateLimit.FIELD_ID).is("rateLimit:" + year + ":" + month);
        Query query = new Query(criteriaDefinition);
        Update update = new Update().inc(RateLimit.FIELD_LIMIT, 1)
                .setOnInsert(RateLimit.FIELD_ID, "rateLimit:" + year + ":" + month);
        RateLimit rateLimit = mongoTemplateFactory.getDefaultMongoTemplate().findAndModify(query, update,
                FindAndModifyOptions.options().returnNew(true).upsert(true), RateLimit.class);
        if (rateLimit.getCount() > Util.getEnvVariable("EMAIL_RATE_LIMIT", 1_000_000L)) {
            LOGGER.error("Rate limit exceeded for sending magic link email");
            throw new RuntimeException("Rate limit exceeded for sending magic link email! Please try again later.");
        }
    }

    private SecretKey getJWTSecretKey() {
        return Keys
                .hmacShaKeyFor(Util.getEnvVariable("JWT_KEY", UUID.randomUUID().toString()).getBytes(StandardCharsets.UTF_8));
    }

    // Todo: add cache
    public List<Member> getOrgsForUser(String userId) {
        return mongoTemplateFactory.getDefaultMongoTemplate()
                .find(new Query(Criteria.where(Member.FIELD_USER_ID).is(userId)), Member.class);
    }

    public Organization getOrgById(String orgId) {
        return mongoTemplateFactory.getDefaultMongoTemplate()
                .findOne(new Query(Criteria.where(Organization.FIELD_ID).is(orgId)), Organization.class);
    }

    public List<Organization> getOrgsByIds(Set<String> orgIds) {
        return mongoTemplateFactory.getDefaultMongoTemplate()
                .find(new Query(Criteria.where(Organization.FIELD_ID).in(orgIds)), Organization.class);
    }

    public User getUserByUserId(String userId) {
        return mongoTemplateFactory.getDefaultMongoTemplate()
                .findOne(new Query(Criteria.where(User.FIELD_ID).is(userId)), User.class);
    }

    // Todo: add cache
    public Member getMemberForOrgId(String userId, String orgId) {
        return mongoTemplateFactory.getDefaultMongoTemplate().findOne(
                new Query(Criteria.where(Member.FIELD_USER_ID).is(userId).and(Member.FIELD_ORGANIZATION_ID).is(orgId)),
                Member.class);
    }

    // Todo: add cache
    public List<Member> getMembersForOrgId(Set<String> userIds, String orgId) {
        return mongoTemplateFactory.getDefaultMongoTemplate().find(
                new Query(Criteria.where(Member.FIELD_USER_ID).in(userIds).and(Member.FIELD_ORGANIZATION_ID).is(orgId)),
                Member.class);
    }

    // Todo: add cache
    public Member getMemberForSlug(String userId, String orgSlug) {
        Organization organization = mongoTemplateFactory.getDefaultMongoTemplate()
                .findOne(new Query(Criteria.where(Organization.FIELD_SLUG).is(orgSlug)), Organization.class);
        if (organization == null) {
            return null;
        }

        return mongoTemplateFactory.getDefaultMongoTemplate()
                .findOne(new Query(
                                Criteria.where(Member.FIELD_USER_ID).is(userId).and(Member.FIELD_ORGANIZATION_ID).is(organization.getId())),
                        Member.class);
    }

    // Todo: add cache
    private Organization getOrganizationForId(String organizationId) {
        return mongoTemplateFactory.getDefaultMongoTemplate()
                .findOne(new Query(Criteria.where(Organization.FIELD_ID).is(organizationId)), Organization.class);
    }

    private String escapeHtml(String input) {
        return StringEscapeUtils.escapeHtml4(input);
    }

    public List<User> getUsersByUserIds(Set<String> userIds) {
        return mongoTemplateFactory.getDefaultMongoTemplate()
                .find(new Query(Criteria.where(User.FIELD_ID).in(userIds)), User.class);
    }

    public String getOrgIdFromHost(String host) {
        Criteria criteriaDefinition = null;
        if (host.endsWith(".suggestfeature.com")) {
            Splitter splitter = Splitter.on(".").trimResults();
            Iterable<String> split = splitter.split(host);
            String slug = Iterables.get(split, 0);
            criteriaDefinition = Criteria.where(Organization.FIELD_SLUG).is(host.split("\\.")[0]);
        } else {
            criteriaDefinition = Criteria.where(Organization.FIELD_CUSTOM_DOMAIN).is(host);
        }
        Organization one = mongoTemplateFactory.getDefaultMongoTemplate().findOne(new Query(criteriaDefinition), Organization.class);
        return one != null ? one.getId() : null;
    }

    public void getOrCreateCustomer(String userId, String orgIdFromHost) {
        Criteria criteriaDefinition = Criteria.where(Customer.FIELD_USER_ID).is(userId).and(Customer.FIELD_ORGANIZATION_ID).is(orgIdFromHost);
        Customer member = mongoTemplateFactory.getDefaultMongoTemplate().findOne(new Query(criteriaDefinition), Customer.class);
        if (member == null){
            Customer customer = new Customer();
            customer.setUserId(userId);
            customer.setOrganizationId(orgIdFromHost);
            customer.setCreatedAt(System.currentTimeMillis());
            mongoTemplateFactory.getDefaultMongoTemplate().insert(customer);
        }
    }

    public void validateIfValidMember() {
        UserContext userContext = UserContext.current();
        if (userContext == null || userContext.getUserId() == null || userContext.getOrgId() == null) {
            throw new RuntimeException("User not member");
        }

        Member member = getMemberForOrgId(userContext.getUserId(), userContext.getOrgId());
        if (member == null) {
            throw new RuntimeException("User not member");
        }
    }

}
