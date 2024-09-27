package io.easystartup.suggestfeature.rest.portal.auth;


import io.easystartup.suggestfeature.beans.User;
import io.easystartup.suggestfeature.filters.UserContext;
import io.easystartup.suggestfeature.filters.UserVisibleException;
import io.easystartup.suggestfeature.services.AuthService;
import io.easystartup.suggestfeature.services.db.MongoTemplateFactory;
import io.easystartup.suggestfeature.utils.JacksonMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.Response;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;

import java.net.MalformedURLException;
import java.net.URL;

/**
 * @author indianBond
 */
@Path("/portal/auth")
@Component
public class PublicPortalAuthRestApi {

    private static final String EMPTY_JSON = "{}";
    private final MongoTemplateFactory mongoConnection;
    private final AuthService authService;

    @Autowired
    public PublicPortalAuthRestApi(MongoTemplateFactory mongoConnection, AuthService authService) {
        this.mongoConnection = mongoConnection;
        this.authService = authService;
    }

    @POST
    @Path("/update-user")
    @Produces("application/json")
    @Consumes("application/json")
    public Response updateUser(@Context HttpServletRequest request, User user) {
        if (StringUtils.isBlank(user.getName())) {
            throw new UserVisibleException("Name is required");
        }
        String userId = UserContext.current().getUserId();

        if (StringUtils.isNotBlank(user.getProfilePic())) {
            // Just validating that its a valid url
            try {
                URL url = new URL(user.getProfilePic());
            } catch (MalformedURLException e) {
                throw new UserVisibleException("Invalid profile pic");
            }
        }

        Update update = new Update();
        boolean updatePresent = false;
        if (user.getName() != null) {
            update.set(User.FIELD_NAME, user.getName().trim());
            updatePresent = true;
        }
        if (user.getProfilePic() != null) {
            update.set(User.FIELD_PROFILE_PIC, user.getProfilePic());
            updatePresent = true;
        }

        User modifiedUser;
        if (updatePresent) {
            modifiedUser = mongoConnection.getDefaultMongoTemplate().findAndModify(Query.query(Criteria.where(User.FIELD_ID).is(userId)), update, FindAndModifyOptions.options().returnNew(true), User.class);
        } else {
            modifiedUser = mongoConnection.getDefaultMongoTemplate().findById(userId, User.class);
        }

        User safeLoggedInUser = authService.getSafeLoggedInUser(modifiedUser);

        return Response.ok().entity(JacksonMapper.toJson(safeLoggedInUser)).build();
    }

}
