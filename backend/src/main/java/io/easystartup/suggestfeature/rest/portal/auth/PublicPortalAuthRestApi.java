package io.easystartup.suggestfeature.rest.portal.auth;


import io.easystartup.suggestfeature.beans.User;
import io.easystartup.suggestfeature.filters.UserContext;
import io.easystartup.suggestfeature.filters.UserVisibleException;
import io.easystartup.suggestfeature.services.AuthService;
import io.easystartup.suggestfeature.services.db.MongoTemplateFactory;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.Response;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;

/**
 * @author indianBond
 */
@Path("/portal/auth")
@Component
public class PublicPortalAuthRestApi {

    private static final String EMPTY_JSON = "{}";
    private final MongoTemplateFactory mongoConnection;

    @Autowired
    public PublicPortalAuthRestApi(MongoTemplateFactory mongoConnection) {
        this.mongoConnection = mongoConnection;
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

        Update update = new Update();
        if (user.getName() != null) {
            update.set(User.FIELD_NAME, user.getName().trim());
        }
        if (user.getProfilePic() != null) {
            update.set(User.FIELD_PROFILE_PIC, user.getProfilePic());
        }

        mongoConnection.getDefaultMongoTemplate().updateFirst(Query.query(Criteria.where(User.FIELD_ID).is(userId)), update, User.class);

        return Response.ok().entity(EMPTY_JSON).build();
    }

}
