package io.easystartup.suggestfeature.rest;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import io.easystartup.suggestfeature.AuthService;
import io.easystartup.suggestfeature.MongoTemplateFactory;
import io.easystartup.suggestfeature.ValidationService;
import io.easystartup.suggestfeature.beans.User;
import io.easystartup.suggestfeature.utils.JacksonMapper;
import jakarta.validation.constraints.NotBlank;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Response;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;

import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.TimeUnit;

/*
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
            return Response.ok(JacksonMapper.toJson(authService.getLoginSignUpResponseJson(user))).build();
        } else if (!user.getMagicLinkCode().equals(req.getMagicToken())) {
            authService.incIncorrectAttemptCount(req.getEmail());
            return Response.status(Response.Status.UNAUTHORIZED).entity("Invalid magic token").build();
        } else if (user.getMagicLinkValidTill()!=null && user.getMagicLinkValidTill() < System.currentTimeMillis()) {
            authService.resetMagicLinkCount(req.getEmail());
            return Response.status(Response.Status.UNAUTHORIZED).entity("Magic token expired").build();
        }

        return Response.ok(JacksonMapper.toJson(authService.getLoginSignUpResponseJson(user))).build();
    }

    @POST
    @Path("/magic-link-generator")
    @Consumes("application/json")
    @Produces("application/json")
    public Response magicLinkGenerator(LoginRequest req) {
        validationService.validate(req);
        req.setEmail(req.getEmail().trim());

        Criteria criteria = Criteria.where(User.FIELD_EMAIL).is(req.getEmail());
        String linkCode = generateMagicLinkCode();
        Update update = new Update()
                .inc(User.FIELD_MAGIC_LINK_SENT_COUNT, 1)
                .set(User.FIELD_MAGIC_LINK_CODE, linkCode)
                .set(User.FIELD_MAGIC_LINK_VALID_TILL, System.currentTimeMillis() + TimeUnit.MINUTES.toMillis(10));
        User user = mongoConnection.getDefaultMongoTemplate().findAndModify(new Query(criteria),
                update, FindAndModifyOptions.options().returnNew(true).upsert(false), User.class);

        if (user == null) {
            User user1 = new User();
            user1.setEmail(req.getEmail());
            user1.setCreatedAt(System.currentTimeMillis());
            user1.setMagicLinkSentCount(1L);
            user = mongoConnection.getDefaultMongoTemplate().insert(user1);
        } else {
            authService.incMagicLinkSentCount(req.getEmail());
        }

        // Todo: Write job which unblocks users after 10 minutes. For now they have to raise support ticket
        if (user.getUserBlockedUntil() != null && user.getUserBlockedUntil() > System.currentTimeMillis()) {
            return Response.status(Response.Status.UNAUTHORIZED).entity("User blocked, try after sometime!").build();
        } else if (user.getIncorrectAttemptCount() != null && user.getIncorrectAttemptCount() > 10) {
            authService.blockUserUntil(req.getEmail(), System.currentTimeMillis() + TimeUnit.MINUTES.toMillis(10));
            return Response.status(Response.Status.UNAUTHORIZED).entity("Too many attempts, try after sometime").build();
        } else if (user.getIncorrectAttemptCount() != null && user.getMagicLinkSentCount() > 10) {
            authService.blockUserUntil(req.getEmail(), System.currentTimeMillis() + TimeUnit.MINUTES.toMillis(10));
            return Response.status(Response.Status.UNAUTHORIZED).entity("Too many attempts, try after sometime").build();
        }

        authService.sendMagicLink(req.getEmail(), linkCode);

        return Response.ok(JacksonMapper.toJson(authService.getLoginSignUpResponseJson(user))).build();
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class LoginRequest {

        @NotBlank
        private String email;
        private String magicToken;

        public LoginRequest() {
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getMagicToken() {
            return magicToken;
        }

        public void setMagicToken(String magicToken) {
            this.magicToken = magicToken;
        }
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
