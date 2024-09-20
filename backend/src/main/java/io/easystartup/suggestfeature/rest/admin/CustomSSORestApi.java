package io.easystartup.suggestfeature.rest.admin;


import com.auth0.jwt.interfaces.Claim;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.fasterxml.uuid.Generators;
import com.fasterxml.uuid.impl.TimeBasedGenerator;
import io.easystartup.suggestfeature.beans.Customer;
import io.easystartup.suggestfeature.beans.LoginState;
import io.easystartup.suggestfeature.beans.Organization;
import io.easystartup.suggestfeature.beans.User;
import io.easystartup.suggestfeature.dto.LoginResponse;
import io.easystartup.suggestfeature.filters.UserVisibleException;
import io.easystartup.suggestfeature.services.AuthService;
import io.easystartup.suggestfeature.services.db.MongoTemplateFactory;
import io.easystartup.suggestfeature.utils.JacksonMapper;
import io.easystartup.suggestfeature.utils.Util;
import jakarta.validation.constraints.NotBlank;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.Response;
import org.apache.commons.lang3.StringUtils;
import org.apache.hc.core5.net.URIBuilder;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.URISyntaxException;

import static io.easystartup.suggestfeature.utils.SSOUtil.getDecodedJWT;

/*
 * @author indianBond
 */
@Path("/unauth/customSSO")
@Component
public class CustomSSORestApi {
    private final MongoTemplateFactory mongoConnection;
    private final AuthService authService;

    @Autowired
    public CustomSSORestApi(MongoTemplateFactory mongoConnection, AuthService authService) {
        this.mongoConnection = mongoConnection;
        this.authService = authService;
    }

    @GET
    @Path("/initiate}")
    public Response startLogin(@QueryParam("host") @NotBlank String host) throws URISyntaxException {
        URI uri = new URI(host);
        // extract domain name
        String domain = uri.getAuthority();
        if (domain == null) {
            throw new UserVisibleException("Invalid host");
        }
        LoginState loginState = new LoginState();
        Organization one = null;
        if (!domain.equals("app.suggestfeature.com")) {
            Criteria criteriaDefinition = null;
            if (domain.endsWith(".suggestfeature.com")) {
                criteriaDefinition = Criteria.where(Organization.FIELD_SLUG).is(domain.split("\\.")[0]);
            } else {
                criteriaDefinition = Criteria.where(Organization.FIELD_CUSTOM_DOMAIN).is(domain);
            }
            one = mongoConnection.getDefaultMongoTemplate().findOne(new Query(criteriaDefinition), Organization.class);
            if (one != null) {
                loginState.setOrganizationId(one.getId());
            }
        }
        if (one == null) {
            throw new UserVisibleException("Invalid host");
        }

        TimeBasedGenerator timeBasedGenerator = Generators.timeBasedGenerator();
        loginState.setId(timeBasedGenerator.generate().toString());
        loginState.setHostUrl(host);
        loginState.setProvider("CUSTOM_SSO");
        try {
            mongoConnection.getDefaultMongoTemplate().insert(loginState);
        } catch (DuplicateKeyException e) {
            loginState.setId(timeBasedGenerator.generate().toString() + "_" + new ObjectId().toString());
            mongoConnection.getDefaultMongoTemplate().insert(loginState);
        }

        Organization.SSOSettings ssoSettings = one.getSsoSettings();
        if (ssoSettings == null || !ssoSettings.isEnableCustomSSO() || StringUtils.isBlank(ssoSettings.getSsoRedirectUrl())) {
            throw new UserVisibleException("Invalid SSO settings");
        }

        String CUSTOM_SSO_RETURN_TO_URL = Util.getEnvVariable("CUSTOM_SSO_RETURN_TO_URL", "https://app.suggestfeature.com/api/unauth/customSSO/code");
        URIBuilder uriBuilder = new URIBuilder(ssoSettings.getPrimaryKey())
                .addParameter("returnTo", CUSTOM_SSO_RETURN_TO_URL)
                .addParameter("state", loginState.getId());

        return Response.temporaryRedirect(uriBuilder.build()).build();
    }

    @GET
    @Path("/code")
    public Response google(@QueryParam("jwt") String jwt, @QueryParam("state") String state) throws URISyntaxException {
        LoginState one = mongoConnection.getDefaultMongoTemplate().findAndRemove(new Query(Criteria.where(LoginState.FIELD_ID).is(state)), LoginState.class);
        if (one == null) {
            // 30 mins expiry
            throw new UserVisibleException("Invalid state. Please restart login process, you have timed out.");
        }
        Organization org = authService.getOrgById(one.getOrganizationId());

        String jwtSigningKey = org.getSsoSettings().getPrimaryKey();
        String jwtSigningKeySecondary = org.getSsoSettings().getSecondaryKey();

        DecodedJWT verify = getDecodedJWT(jwt, jwtSigningKey, jwtSigningKeySecondary);

        String email = verify.getClaim("email").asString();
        if (email == null) {
            throw new UserVisibleException("Invalid email or email not yet verified");
        }
        String name = getData(verify.getClaim("name"), "");
        String profilePic = getData(verify.getClaim("profilePic"), "");
        String firstName = getData(verify.getClaim("firstName"), "");
        String lastName = getData(verify.getClaim("lastName"), "");
        if (StringUtils.isBlank(firstName)) {
            firstName = getData(verify.getClaim("first_name"), "");
        }
        if (StringUtils.isBlank(lastName)) {
            lastName = getData(verify.getClaim("last_name"), "");
        }

        if (name == null || name.isEmpty()) {
            name = firstName + " " + lastName;
        }

        User existingUser = mongoConnection.getDefaultMongoTemplate().findOne(new Query(Criteria.where("email").is(email)), User.class);
        if (existingUser == null) {
            User user = new User();
            user.setEmail(email);
            user.setId(new ObjectId().toString());
            user.setName(name);
            // Copy profile pic to local cloudflare instance else  google is blocking it
            String ppic = Util.uploadCopy(user.getId(), one.getOrganizationId(), profilePic);
            user.setProfilePic(ppic);
            user.setCreatedAt(System.currentTimeMillis());
            mongoConnection.getDefaultMongoTemplate().insert(user);
            existingUser = user;
        }

        Customer existingCustomer = mongoConnection.getDefaultMongoTemplate().findOne(new Query(Criteria.where(Customer.FIELD_USER_ID).is(existingUser.getId()).and(Customer.FIELD_ORGANIZATION_ID).is(one.getOrganizationId())), Customer.class);
        if (existingCustomer != null && existingCustomer.isSpam()) {
            throw new UserVisibleException("Not allowed to sign in");
        }
        if (existingCustomer == null) {
            Customer customer = new Customer();
            customer.setCreatedAt(System.currentTimeMillis());
            customer.setUserId(existingUser.getId());
            customer.setOrganizationId(one.getOrganizationId());
            mongoConnection.getDefaultMongoTemplate().insert(customer);
        }
        LoginResponse loginSignUpResponseJson = authService.getLoginSignUpResponseJson(existingUser, true);

        URI location = new URI(one.getHostUrl());
        URIBuilder uriBuilder =
                new URIBuilder(location.getScheme() + "://" + location.getAuthority() + "/login-interceptor")
                        .addParameter("redirectToPage", one.getHostUrl())
                        .addParameter("response", JacksonMapper.toJson(loginSignUpResponseJson));
        return Response.temporaryRedirect(uriBuilder.build()).build();
    }

    private static String getData(Claim claim, String defaultValue) {
        return claim.isMissing() ? defaultValue : claim.asString();
    }
}
