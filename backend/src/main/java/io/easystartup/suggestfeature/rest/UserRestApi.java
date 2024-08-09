package io.easystartup.suggestfeature.rest;

import io.easystartup.suggestfeature.AuthService;
import io.easystartup.suggestfeature.MongoTemplateFactory;
import io.easystartup.suggestfeature.beans.Member;
import io.easystartup.suggestfeature.beans.User;
import io.easystartup.suggestfeature.filters.UserContext;
import io.easystartup.suggestfeature.utils.JacksonMapper;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Response;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Component;

/*
 * @author indianBond
 */
@Path("/auth/user")
@Component
public class UserRestApi {

    private final MongoTemplateFactory mongoConnection;
    private final AuthService authService;

    @Autowired
    public UserRestApi(MongoTemplateFactory mongoConnection, AuthService authService) {
        this.mongoConnection = mongoConnection;
        this.authService = authService;
    }

    @GET
    @Path("/")
    @Consumes("application/json")
    @Produces("application/json")
    public Response getUser() {
        String userId = UserContext.current().getUserId();
        Criteria criteria = Criteria.where(User.FIELD_ID).is(userId);
        User user = mongoConnection.getDefaultMongoTemplate().findOne(new Query(criteria), User.class);
        if (user == null) {
            return Response.status(Response.Status.UNAUTHORIZED).entity("No such user").build();
        }
        User safeUser = new User();
        safeUser.setName(user.getName());
        safeUser.setEmail(user.getEmail());
        safeUser.setId(user.getId());
        safeUser.setProfilePic(user.getProfilePic());
        safeUser.setVerifiedEmail(true);
        return Response.ok(JacksonMapper.toJson(safeUser)).build();
    }

}
