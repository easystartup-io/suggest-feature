package io.easystartup.suggestfeature.rest.admin;


import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.uuid.Generators;
import com.fasterxml.uuid.impl.TimeBasedGenerator;
import io.easystartup.suggestfeature.beans.Customer;
import io.easystartup.suggestfeature.beans.LoginState;
import io.easystartup.suggestfeature.beans.Organization;
import io.easystartup.suggestfeature.beans.User;
import io.easystartup.suggestfeature.dto.LoginResponse;
import io.easystartup.suggestfeature.filters.UserVisibleException;
import io.easystartup.suggestfeature.loggers.Logger;
import io.easystartup.suggestfeature.loggers.LoggerFactory;
import io.easystartup.suggestfeature.services.AuthService;
import io.easystartup.suggestfeature.services.db.MongoTemplateFactory;
import io.easystartup.suggestfeature.utils.JacksonMapper;
import io.easystartup.suggestfeature.utils.Util;
import jakarta.validation.constraints.NotBlank;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.Response;
import org.apache.commons.lang3.StringUtils;
import org.apache.hc.client5.http.classic.methods.HttpPost;
import org.apache.hc.client5.http.classic.methods.HttpUriRequestBase;
import org.apache.hc.client5.http.entity.UrlEncodedFormEntity;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.CloseableHttpResponse;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.core5.http.NameValuePair;
import org.apache.hc.core5.http.message.BasicNameValuePair;
import org.apache.hc.core5.net.URIBuilder;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * @author indianBond
 */
@Path("/unauth/oauth2")
@Component
public class Oauth2_0RestApi {

    private static final Logger LOGGER = LoggerFactory.getLogger(Oauth2_0RestApi.class);
    private final MongoTemplateFactory mongoConnection;
    private final AuthService authService;

    @Autowired
    public Oauth2_0RestApi(MongoTemplateFactory mongoConnection, AuthService authService) {
        this.mongoConnection = mongoConnection;
        this.authService = authService;
    }

    @GET
    @Path("/start/{provider}")
    public Response startLogin(@QueryParam("host") @NotBlank String host, @PathParam("provider") @NotBlank String provider) throws URISyntaxException {
        provider = provider.toUpperCase(Locale.ROOT);
        URI uri = new URI(host);
        // extract domain name
        String domain = uri.getAuthority();
        if (domain == null) {
            throw new UserVisibleException("Invalid host");
        }
        LoginState loginState = new LoginState();
        if (!domain.equals("app.suggestfeature.com")) {
            Criteria criteriaDefinition = null;
            if (domain.endsWith(".suggestfeature.com")) {
                criteriaDefinition = Criteria.where(Organization.FIELD_SLUG).is(domain.split("\\.")[0]);
            } else {
                criteriaDefinition = Criteria.where(Organization.FIELD_CUSTOM_DOMAIN).is(domain);
            }
            Organization one = mongoConnection.getDefaultMongoTemplate().findOne(new Query(criteriaDefinition), Organization.class);
            if (one != null) {
                if (one.getAllowedProviders().contains(provider)) {
                    loginState.setOrganizationId(one.getId());
                } else {
//                    throw new UserVisibleException("Provider not allowed");
                }
            }
        }

        TimeBasedGenerator timeBasedGenerator = Generators.timeBasedGenerator();
        loginState.setId(timeBasedGenerator.generate().toString());
        loginState.setProvider(provider);
        loginState.setHostUrl(host);
        loginState.setProvider(provider);
        try {
            mongoConnection.getDefaultMongoTemplate().insert(loginState);
        } catch (DuplicateKeyException e) {
            loginState.setId(timeBasedGenerator.generate().toString() + "_" + new ObjectId().toString());
            mongoConnection.getDefaultMongoTemplate().insert(loginState);
        }

        String CLIENT_ID = Util.getEnvVariable(provider + "_CLIENT_ID", "DEFAULT_" + provider + "_CLIENT_ID");
        String REDIRECT_URI = Util.getEnvVariable(provider + "_REDIRECT_URL", "https://app.suggestfeature.com/api/unauth/oauth2/code/" + provider);
        String AUTH_URL = Util.getEnvVariable(provider + "_AUTH_URL", getDefaultValueForProviders("AUTH_URL", provider));

        URIBuilder uriBuilder = new URIBuilder(AUTH_URL)
                .addParameter("client_id", CLIENT_ID)
                .addParameter("redirect_uri", REDIRECT_URI)
                .addParameter("response_type", "code")
                .addParameter("scope", getDefaultValueForProviders("SCOPE", provider))
                .addParameter("state", loginState.getId());

        return Response.temporaryRedirect(uriBuilder.build()).build();
    }

    @GET
    @Path("/code/{provider}")
    public Response google(@QueryParam("code") String code, @QueryParam("state") String state, @PathParam("provider") @NotBlank String provider) throws URISyntaxException {
        LoginState one = mongoConnection.getDefaultMongoTemplate().findAndRemove(new Query(Criteria.where(LoginState.FIELD_ID).is(state)), LoginState.class);
        if (one == null) {
            throw new UserVisibleException("Invalid state. Please restart login process, you have timed out.");
        }

        String CLIENT_ID = Util.getEnvVariable(provider + "_CLIENT_ID", "DEFAULT_" + provider + "_CLIENT_ID");
        String CLIENT_SECRET = Util.getEnvVariable(provider + "_CLIENT_SECRET", "DEFAULT_" + provider + "_CLIENT_SECRET");
        String REDIRECT_URI = Util.getEnvVariable(provider + "_REDIRECT_URL", "https://app.suggestfeature.com/api/unauth/oauth2/code/" + provider);
        String TOKEN_URL = Util.getEnvVariable(provider + "_TOKEN_URL", getDefaultValueForProviders("TOKEN_URL", provider));
        String USER_INFO_URL = Util.getEnvVariable(provider + "_USER_INFO_URL", getDefaultValueForProviders("USER_INFO_URL", provider));

        List<NameValuePair> form = new ArrayList<>();
        form.add(new BasicNameValuePair("client_id", CLIENT_ID));
        form.add(new BasicNameValuePair("client_secret", CLIENT_SECRET));
        form.add(new BasicNameValuePair("redirect_uri", REDIRECT_URI));
        form.add(new BasicNameValuePair("grant_type", "authorization_code"));
        form.add(new BasicNameValuePair("code", code));

        try (CloseableHttpClient httpClient = HttpClients.createDefault()) {
            HttpPost httpPost = new HttpPost(TOKEN_URL);
            httpPost.setEntity(new UrlEncodedFormEntity(form));

            try (CloseableHttpResponse response = httpClient.execute(httpPost)) {
                ObjectMapper objectMapper = new ObjectMapper();
                JsonNode tokenResponse = objectMapper.readTree(response.getEntity().getContent());

                String accessToken = tokenResponse.get("access_token").asText();

                // Fetch user info
                HttpUriRequestBase userInfoRequest = new HttpUriRequestBase("GET", new URI(USER_INFO_URL));
                userInfoRequest.addHeader("Authorization", "Bearer " + accessToken);

                try (CloseableHttpResponse userInfoResponse = httpClient.execute(userInfoRequest)) {
                    JsonNode userInfo = objectMapper.readTree(userInfoResponse.getEntity().getContent());
                    LOGGER.error("User info: " + userInfo.toString());

                    String email = userInfo.get("email").asText();
                    if (email == null) {
                        throw new UserVisibleException("Invalid email or email not yet verified");
                    }
                    String name = getData(userInfo, "name");
                    String profilePic = getProfilePic(userInfo, provider);
                    String firstName = getData(userInfo, "given_name");
                    String lastName = getData(userInfo, "family_name");

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
                    } else {
                        boolean update = false;
                        Update userUpdate = new Update();
                        if (StringUtils.isBlank(existingUser.getProfilePic()) && StringUtils.isNotBlank(profilePic)) {
                            // Copy profile pic to local cloudflare instance else  google is blocking it
                            String ppic = Util.uploadCopy(existingUser.getId(), one.getOrganizationId(), profilePic);
                            existingUser.setProfilePic(ppic);
                            update = true;
                            userUpdate.set(User.FIELD_PROFILE_PIC, ppic);
                        }

                        if (StringUtils.isBlank(existingUser.getName()) && StringUtils.isNotBlank(name)) {
                            update = true;
                            existingUser.setName(name);
                            userUpdate.set(User.FIELD_NAME, name);
                        }

                        if (update) {
                            mongoConnection.getDefaultMongoTemplate().updateFirst(new Query(Criteria.where(User.FIELD_ID).is(existingUser.getId())), userUpdate, User.class);
                        }
                    }

                    if (one.getOrganizationId() != null) {
                        // Create customer

                        Customer existingCustomer = mongoConnection.getDefaultMongoTemplate().findOne(new Query(Criteria.where(Customer.FIELD_USER_ID).is(existingUser.getId()).and(Customer.FIELD_ORGANIZATION_ID).is(one.getOrganizationId())), Customer.class);
                        if (existingCustomer!=null && existingCustomer.isSpam()) {
                            throw new UserVisibleException("Not allowed to sign in");
                        }
                        if (existingCustomer == null) {
                            Customer customer = new Customer();
                            customer.setCreatedAt(System.currentTimeMillis());
                            customer.setUserId(existingUser.getId());
                            customer.setOrganizationId(one.getOrganizationId());
                            mongoConnection.getDefaultMongoTemplate().insert(customer);
                        }
                        // End user Logging to portal
                        LoginResponse loginSignUpResponseJson = authService.getLoginSignUpResponseJson(existingUser, true);

                        URI location = new URI(one.getHostUrl());
                        URIBuilder uriBuilder =
                                new URIBuilder(location.getScheme() + "://" + location.getAuthority() + "/login-interceptor")
                                        .addParameter("redirectToPage", one.getHostUrl())
                                        .addParameter("response", JacksonMapper.toJson(loginSignUpResponseJson));
                        return Response.temporaryRedirect(uriBuilder.build()).build();
                    } else {
                        // Logging to admin page
                        LoginResponse loginSignUpResponseJson = authService.getLoginSignUpResponseJson(existingUser, false);
                        URI location = new URI(one.getHostUrl());
                        URIBuilder uriBuilder = new URIBuilder(location.getScheme() + "://"+ location.getAuthority()+ "/login-interceptor")
                                .addParameter("response", JacksonMapper.toJson(loginSignUpResponseJson));
                        return Response.temporaryRedirect(uriBuilder.build()).build();
                    }
                }
            } catch (URISyntaxException e) {
                throw new RuntimeException(e);
            }
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    private static String getData(JsonNode userInfo, String picture) {
        return userInfo.get(picture) != null ? userInfo.get(picture).asText() : "";
    }

    private String getDefaultValueForProviders(String value, String provider) {
        switch (provider) {
            case "GOOGLE" -> {
                switch (value) {
                    case "SCOPE":
                        return "openid email profile";
                    case "AUTH_URL":
                        return "https://accounts.google.com/o/oauth2/auth";
                    case "TOKEN_URL":
                        return "https://oauth2.googleapis.com/token";
                    case "USER_INFO_URL":
                        return "https://www.googleapis.com/oauth2/v3/userinfo";
                }
            }
            case "FACEBOOK" -> {
                switch (value) {
                    case "SCOPE":
                        return "email public_profile";
                    case "AUTH_URL":
                        return "https://www.facebook.com/v20.0/dialog/oauth";
                    case "TOKEN_URL":
                        return "https://graph.facebook.com/v20.0/oauth/access_token";
                    case "USER_INFO_URL":
                        return "https://graph.facebook.com/v20.0/me?fields=id,first_name,middle_name,last_name,name,email,verified,picture.width(250).height(250)";
                }
            }
        }
        return provider + "_" + value;
    }

    private static String getProfilePic(JsonNode userInfo, String provider) {
        if ("FACEBOOK".equalsIgnoreCase(provider)) {
            JsonNode pictureNode = userInfo.path("picture").path("data").path("url");
            return pictureNode.isMissingNode() ? "" : pictureNode.asText();
        } else if ("GOOGLE".equalsIgnoreCase(provider)) {
            JsonNode pictureNode = userInfo.path("picture");
            return pictureNode.isMissingNode() ? "" : pictureNode.asText();
        }

        return "";
    }
}
