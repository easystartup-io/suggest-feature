package io.easystartup.suggestfeature.rest.admin;

import io.easystartup.suggestfeature.services.AuthService;
import io.easystartup.suggestfeature.services.db.MongoTemplateFactory;
import io.easystartup.suggestfeature.services.ValidationService;
import io.easystartup.suggestfeature.beans.User;
import io.easystartup.suggestfeature.dto.LoginRequest;
import io.easystartup.suggestfeature.utils.JacksonMapper;
import io.easystartup.suggestfeature.utils.Util;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.Response;
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.validator.routines.EmailValidator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;

import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.TimeUnit;
import java.util.regex.Pattern;

/**
 * @author indianBond
 */
@Path("/unauth")
@Component
public class AuthenticationRestApi {

    private final ValidationService validationService;
    private final MongoTemplateFactory mongoConnection;
    private final AuthService authService;
    private static final String CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final int CODE_LENGTH = 6;

    //  RFC 5322 Official Standard. DOes not support non unicode characters in email
    private static final Pattern EMAIL_VALIDATION_PATTERN = Pattern.compile("^[a-zA-Z0-9_!#$%&'*+/=?`{|}~^.-]+@[a-zA-Z0-9.-]+$");

    @Autowired
    public AuthenticationRestApi(ValidationService validationService, MongoTemplateFactory mongoConnection, AuthService authService) {
        this.validationService = validationService;
        this.mongoConnection = mongoConnection;
        this.authService = authService;
    }

    @POST
    @Path("/login")
    @Consumes("application/json")
    @Produces("application/json")
    public Response login(LoginRequest req) {
        validationService.validate(req);
        EmailValidator emailValidator = EmailValidator.getInstance();
        boolean valid = emailValidator.isValid(req.getEmail());
        if (!valid) {
            return Response.status(Response.Status.BAD_REQUEST).entity("Invalid email").build();
        }
        req.setEmail(req.getEmail().trim());
        req.setMagicToken(req.getMagicToken().trim());

        Criteria criteria = Criteria.where(User.FIELD_EMAIL).is(req.getEmail());
        User user = mongoConnection.getDefaultMongoTemplate().findOne(new Query(criteria), User.class);
        if (user == null) {
            return Response.status(Response.Status.UNAUTHORIZED).entity("No such user").build();
        }

        if (user.getUserBlockedUntil() != null && user.getUserBlockedUntil() > System.currentTimeMillis()) {
            return Response.status(Response.Status.UNAUTHORIZED).entity("User blocked, try after sometime!").build();
        }

        if (user.getIncorrectAttemptCount() != null && user.getIncorrectAttemptCount() > 10) {
            authService.blockUserUntil(req.getEmail(), System.currentTimeMillis() + TimeUnit.MINUTES.toMillis(10));
            return Response.status(Response.Status.UNAUTHORIZED).entity("Too many attempts, try after sometime").build();
        }

        if (user.getMagicLinkCode().equals(req.getMagicToken()) && user.getMagicLinkValidTill()!=null && user.getMagicLinkValidTill() > System.currentTimeMillis()) {
            authService.resetMagicLinkCount(req.getEmail());
            return Response.ok(JacksonMapper.toJson(authService.getLoginSignUpResponseJson(user, false))).build();
        } else if (!user.getMagicLinkCode().equals(req.getMagicToken())) {
            authService.incIncorrectAttemptCount(req.getEmail());
            return Response.status(Response.Status.UNAUTHORIZED).entity("Invalid magic token").build();
        } else if (user.getMagicLinkValidTill()!=null && user.getMagicLinkValidTill() < System.currentTimeMillis()) {
            authService.resetMagicLinkCount(req.getEmail());
            return Response.status(Response.Status.UNAUTHORIZED).entity("Magic token expired").build();
        }

        return Response.status(Response.Status.UNAUTHORIZED).entity("Magic token not valid").build();
    }

    @POST
    @Path("/magic-link-generator")
    @Consumes("application/json")
    @Produces("application/json")
    public Response magicLinkGenerator(LoginRequest req, @Context HttpServletRequest request) {
        validationService.validate(req);
        req.setEmail(req.getEmail().trim());
        EmailValidator emailValidator = EmailValidator.getInstance();
        boolean valid = emailValidator.isValid(req.getEmail());
        if (!valid) {
            return Response.status(Response.Status.BAD_REQUEST).entity("Invalid email").build();
        }

        Criteria criteria = Criteria.where(User.FIELD_EMAIL).is(req.getEmail());
        String linkCode = generateMagicLinkCode();
        long magicLinkValidTill = System.currentTimeMillis() + TimeUnit.MINUTES.toMillis(10);
        Update update = new Update()
                .inc(User.FIELD_MAGIC_LINK_SENT_COUNT, 1)
                .set(User.FIELD_MAGIC_LINK_CODE, linkCode)
                .set(User.FIELD_MAGIC_LINK_VALID_TILL, magicLinkValidTill);
        User user = mongoConnection.getDefaultMongoTemplate().findAndModify(new Query(criteria),
                update, FindAndModifyOptions.options().returnNew(true).upsert(false), User.class);

        if (user == null) {
            User user1 = new User();
            user1.setEmail(req.getEmail());
            user1.setCreatedAt(System.currentTimeMillis());
            user1.setMagicLinkSentCount(1L);
            if (StringUtils.isNotBlank(req.getFirstName()) && StringUtils.isNotBlank(req.getLastName())) {
                user1.setName(req.getFirstName().trim() + " " + req.getLastName().trim());
            } else if (StringUtils.isNotBlank(req.getFirstName())) {
                user1.setName(req.getFirstName().trim());
            } else if (StringUtils.isNotBlank(req.getLastName())) {
                user1.setName(req.getLastName().trim());
            } else {
                // Extract name from email
                String nameToSet = null;
                String[] parts = req.getEmail().split("@");
                // If email contains separators then separate and join to form name
                if (parts.length > 1) {
                    String[] nameParts = parts[0].split("[._-]");
                    StringBuilder name = new StringBuilder();
                    for (String part : nameParts) {
                        // Remove numbers
                        name.append(StringUtils.capitalize(part)).append(" ");
                    }
                    // Remove numbers

                    nameToSet = name.toString().trim();
                } else {
                    // Capitalize
                    nameToSet = StringUtils.capitalize(parts[0].trim());
                }
                user1.setName(nameToSet);
            }
            user1.setMagicLinkCode(linkCode);
            user1.setMagicLinkValidTill(magicLinkValidTill);
            user = mongoConnection.getDefaultMongoTemplate().insert(user1);
        } else {
            authService.incMagicLinkSentCount(req.getEmail());
        }

        // Todo: Write job which unblocks users after 10 minutes. For now they have to raise support ticket
        if (user.getUserBlockedUntil() != null && user.getUserBlockedUntil() > System.currentTimeMillis()) {
            return Response.status(Response.Status.UNAUTHORIZED).entity("User blocked, try after sometime!").build();
        } else if (user.getIncorrectAttemptCount() != null && user.getIncorrectAttemptCount() > 10) {
            authService.blockUserUntil(req.getEmail(), magicLinkValidTill);
            return Response.status(Response.Status.UNAUTHORIZED).entity("Too many attempts, try after sometime").build();
        } else if (user.getIncorrectAttemptCount() != null && user.getMagicLinkSentCount() > 10) {
            authService.blockUserUntil(req.getEmail(), magicLinkValidTill);
            return Response.status(Response.Status.UNAUTHORIZED).entity("Too many attempts, try after sometime").build();
        }

        authService.sendMagicLink(req.getEmail(), linkCode);
        String host = request.getHeader("host");
        if (!host.equals("app.suggestfeature.com") && !host.equals("localhost:8080")) {
            String orgIdFromHost = authService.getOrgIdFromHost(host);
            if (orgIdFromHost != null) {
                authService.getOrCreateCustomer(user.getId(), orgIdFromHost);
            }
        }

        return Response.ok().build();
    }

    public static String generateMagicLinkCode() {
        StringBuilder code = new StringBuilder(CODE_LENGTH);
        for (int i = 0; i < CODE_LENGTH; i++) {
            int index = ThreadLocalRandom.current().nextInt(CHARACTERS.length());
            code.append(CHARACTERS.charAt(index));
        }
        return code.toString();
    }
}
