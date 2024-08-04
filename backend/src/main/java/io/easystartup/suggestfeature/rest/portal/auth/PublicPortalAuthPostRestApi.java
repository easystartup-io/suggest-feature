package io.easystartup.suggestfeature.rest.portal.auth;


import io.easystartup.suggestfeature.beans.*;
import io.easystartup.suggestfeature.filters.UserContext;
import io.easystartup.suggestfeature.filters.UserVisibleException;
import io.easystartup.suggestfeature.loggers.Logger;
import io.easystartup.suggestfeature.loggers.LoggerFactory;
import io.easystartup.suggestfeature.services.AuthService;
import io.easystartup.suggestfeature.services.db.MongoTemplateFactory;
import io.easystartup.suggestfeature.utils.JacksonMapper;
import io.easystartup.suggestfeature.utils.Util;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.Response;
import org.apache.commons.lang3.StringUtils;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;

/*
 * @author indianBond
 */
@Path("/portal/auth/posts")
@Component
public class PublicPortalAuthPostRestApi {

    private static final String EMPTY_JSON_LIST = "[]";
    private static final String EMPTY_JSON = "{}";
    private static final Logger LOGGER = LoggerFactory.getLogger(PublicPortalAuthPostRestApi.class);
    private final MongoTemplateFactory mongoConnection;
    private final AuthService authService;

    @Autowired
    public PublicPortalAuthPostRestApi(MongoTemplateFactory mongoConnection, AuthService authService) {
        this.mongoConnection = mongoConnection;
        this.authService = authService;
    }

    @POST
    @Path("/upvote-post")
    @Produces("application/json")
    @Consumes("application/json")
    public Response upvotePost(@Context HttpServletRequest request, @QueryParam("postId") String postId, @QueryParam("upvote") Boolean upvote) {
        // Find Page.java from request host
        String userId = UserContext.current().getUserId();
        String host = request.getHeader("host");
        Organization org = getOrg(host);
        if (org == null) {
            return Response.status(Response.Status.NOT_FOUND).entity("Organization not found").build();
        }
        Criteria customerCriteria = Criteria.where(Customer.FIELD_USER_ID).is(userId).and(Customer.FIELD_ORGANIZATION_ID).is(org.getId());
        Customer customer = mongoConnection.getDefaultMongoTemplate().findOne(new Query(customerCriteria), Customer.class);
        if (customer == null || customer.isSpam()){
            return Response.status(Response.Status.FORBIDDEN).entity("User not allowed").build();
        }

        Query query = new Query(Criteria.where(Post.FIELD_ID).is(postId).and(Post.FIELD_ORGANIZATION_ID).is(org.getId()));
        Post post = mongoConnection.getDefaultMongoTemplate().findOne(query, Post.class);
        if (post == null){
            return Response.status(Response.Status.NOT_FOUND).entity("Post not found").build();
        }

        Criteria criteriaDefinition = Criteria.where(Board.FIELD_ID).is(post.getBoardId()).and(Board.FIELD_ORGANIZATION_ID).is(org.getId());
        Board board = mongoConnection.getDefaultMongoTemplate().findOne(new Query(criteriaDefinition), Board.class);
        if (board == null || board.isPrivateBoard()) {
            return Response.status(Response.Status.NOT_FOUND).entity("Board not found").build();
        }

        Voter voter = new Voter();
        voter.setUserId(userId);
        voter.setPostId(postId);
        voter.setOrganizationId(org.getId());
        voter.setCreatedAt(System.currentTimeMillis());
        try {
            if (upvote == null || upvote) {
                mongoConnection.getDefaultMongoTemplate().insert(voter);
            } else {
                Criteria voterCriteriaDefinition = Criteria
                        .where(Voter.FIELD_POST_ID).is(postId)
                        .and(Voter.FIELD_USER_ID).is(userId)
                        .and(Voter.FIELD_ORGANIZATION_ID).is(org.getId());
                mongoConnection.getDefaultMongoTemplate().remove(new Query(voterCriteriaDefinition), Voter.class);
            }
        } catch (DuplicateKeyException e) {
            throw new UserVisibleException("Already upvoted");
        }

        return Response.ok().entity(JacksonMapper.toJson(post)).build();
    }

    @POST
    @Path("/add-post")
    @Produces("application/json")
    @Consumes("application/json")
    public Response initPage(@Context HttpServletRequest request, Post reqPost) {
        // Find Page.java from request host
        String userId = UserContext.current().getUserId();
        String host = request.getHeader("host");
        Organization org = getOrg(host);
        if (org == null) {
            return Response.status(Response.Status.NOT_FOUND).entity("Organization not found").build();
        }
        Criteria customerCriteria = Criteria.where(Customer.FIELD_USER_ID).is(userId).and(Customer.FIELD_ORGANIZATION_ID).is(org.getId());
        Customer customer = mongoConnection.getDefaultMongoTemplate().findOne(new Query(customerCriteria), Customer.class);
        if (customer == null || customer.isSpam()){
            return Response.status(Response.Status.FORBIDDEN).entity("User not allowed").build();
        }

        String boardSlug = reqPost.getBoardSlug();
        if (StringUtils.isBlank(boardSlug)) {
            return Response.status(Response.Status.BAD_REQUEST).entity("Board slug is required").build();
        }
        Criteria criteriaDefinition = Criteria.where(Board.FIELD_SLUG).is(boardSlug).and(Board.FIELD_ORGANIZATION_ID).is(org.getId());
        Board board = mongoConnection.getDefaultMongoTemplate().findOne(new Query(criteriaDefinition), Board.class);
        if (board == null || board.isPrivateBoard()) {
            return Response.status(Response.Status.NOT_FOUND).entity("Board not found").build();
        }

        Post post = new Post();
        post.setOrganizationId(org.getId());
        post.setBoardId(board.getId());
        post.setCreatedByUserId(userId);
        post.setCreatedAt(System.currentTimeMillis());
        post.setTitle(reqPost.getTitle());
        post.setDescription(reqPost.getDescription());
        post.setStatus("OPEN");
        post.setSlug(Util.fixSlug(reqPost.getTitle()));
        try {
            mongoConnection.getDefaultMongoTemplate().insert(post);
        } catch (DuplicateKeyException exception) {
            String string = new ObjectId().toString();
            // set existing slug + objectid(first 5 characters) + - objectId remaining
            post.setSlug(post.getSlug() + "-" + string.substring(0, 5) + "-" + string.substring(5));
            mongoConnection.getDefaultMongoTemplate().insert(post);
        }
        return Response.ok().entity(JacksonMapper.toJson(post)).build();
    }

    private Organization getOrg(String host) {
        Criteria criteria;
        if (!host.endsWith(".suggestfeature.com")) {
            criteria = Criteria.where(Organization.FIELD_CUSTOM_DOMAIN).is(host);
        } else {
            criteria = Criteria.where(Organization.FIELD_SLUG).is(host.split("\\.")[0]);
        }
        return mongoConnection.getDefaultMongoTemplate().findOne(new Query(criteria), Organization.class);
    }
}
