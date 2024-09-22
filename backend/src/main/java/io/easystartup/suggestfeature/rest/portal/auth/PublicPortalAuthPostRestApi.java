package io.easystartup.suggestfeature.rest.portal.auth;


import io.easystartup.suggestfeature.beans.*;
import io.easystartup.suggestfeature.filters.UserContext;
import io.easystartup.suggestfeature.filters.UserVisibleException;
import io.easystartup.suggestfeature.jobqueue.executor.SendCommentUpdateEmailExecutor;
import io.easystartup.suggestfeature.jobqueue.executor.SendStatusUpdateEmailExecutor;
import io.easystartup.suggestfeature.jobqueue.scheduler.JobCreator;
import io.easystartup.suggestfeature.services.AuthService;
import io.easystartup.suggestfeature.services.ValidationService;
import io.easystartup.suggestfeature.services.db.MongoTemplateFactory;
import io.easystartup.suggestfeature.utils.JacksonMapper;
import io.easystartup.suggestfeature.utils.Util;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.constraints.NotBlank;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.Response;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

import static io.easystartup.suggestfeature.utils.Util.*;

/**
 * @author indianBond
 */
@Path("/portal/auth/posts")
@Component
public class PublicPortalAuthPostRestApi {

    private final MongoTemplateFactory mongoConnection;
    private final ValidationService validationService;
    private final AuthService authService;
    private final JobCreator jobCreator;

    @Autowired
    public PublicPortalAuthPostRestApi(MongoTemplateFactory mongoConnection, ValidationService validationService, AuthService authService, JobCreator jobCreator) {
        this.mongoConnection = mongoConnection;
        this.validationService = validationService;
        this.authService = authService;
        this.jobCreator = jobCreator;
    }

    @POST
    @Path("/upvote-post")
    @Produces("application/json")
    @Consumes("application/json")
    public Response upvotePost(@Context HttpServletRequest request, @QueryParam("postId") String postId, @QueryParam("upvote") Boolean upvote) {
        if (upvote == null){
            upvote = true;
        }
        // Find Page.java from request host
        String userId = UserContext.current().getUserId();
        String host = request.getHeader("host");
        Organization org = getOrg(host);
        if (org == null) {
            return Response.status(Response.Status.NOT_FOUND).entity("Organization not found").build();
        }
        Criteria customerCriteria = Criteria.where(Customer.FIELD_USER_ID).is(userId).and(Customer.FIELD_ORGANIZATION_ID).is(org.getId());
        Customer customer = mongoConnection.getDefaultMongoTemplate().findOne(new Query(customerCriteria), Customer.class);

        Member memberForOrg = authService.getMemberForOrgId(userId, org.getId());
        if (memberForOrg == null && (customer == null || customer.isSpam())) {
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
            if (upvote) {
                mongoConnection.getDefaultMongoTemplate().insert(voter);
                post.setVotes(post.getVotes() + 1);
            } else {
                Criteria voterCriteriaDefinition = Criteria
                        .where(Voter.FIELD_POST_ID).is(postId)
                        .and(Voter.FIELD_USER_ID).is(userId)
                        .and(Voter.FIELD_ORGANIZATION_ID).is(org.getId());
                mongoConnection.getDefaultMongoTemplate().remove(new Query(voterCriteriaDefinition), Voter.class);
                post.setVotes(post.getVotes() - 1);
            }
            mongoConnection.getDefaultMongoTemplate().updateFirst(new Query(Criteria.where(Post.FIELD_ID).is(postId)), new Update().inc(Post.FIELD_VOTES, upvote ? 1 : -1), Post.class);
        } catch (DuplicateKeyException e) {
            throw new UserVisibleException("Already upvoted");
        }

        return Response.ok().entity(JacksonMapper.toJson(post)).build();
    }

    @GET
    @Path("/fetch-post")
    @Produces("application/json")
    public Response fetchPost(@Context HttpServletRequest request, @QueryParam("postSlug") @NotBlank String postSlug, @QueryParam("boardSlug") @NotBlank String boardSlug) {
        String host = request.getHeader("host");
        Organization org = getOrg(host);
        if (org == null || (org.getRoadmapSettings() != null && !org.getRoadmapSettings().isEnabled())) {
            return Response.ok().entity(Collections.emptyList()).build();
        }
        Criteria boardCriteriaDefinition = Criteria.where(Board.FIELD_ORGANIZATION_ID).is(org.getId()).and(Board.FIELD_SLUG).is(boardSlug);
        Board board = mongoConnection.getDefaultMongoTemplate().findOne(new Query(boardCriteriaDefinition), Board.class);
        if (board.isPrivateBoard()) {
            return Response.ok().entity(Collections.emptyList()).build();
        }
        Criteria criteriaDefinition = Criteria.where(Post.FIELD_BOARD_ID).is(board.getId()).and(Post.FIELD_SLUG).is(postSlug).and(Post.FIELD_ORGANIZATION_ID).is(org.getId());
        Post post = mongoConnection.getDefaultMongoTemplate().findOne(new Query(criteriaDefinition), Post.class);
        post.setBoardSlug(boardSlug);
        populatePost(post, org.getId(), UserContext.current().getUserId(), false);

        return Response.ok().entity(JacksonMapper.toJson(post)).build();
    }

    @GET
    @Path("/get-posts-by-board")
    @Produces("application/json")
    public Response getPostsByBoard(@Context HttpServletRequest request, @QueryParam("slug") @NotBlank String slug,
                                    @QueryParam("statusFilter") String statusFilter,
                                    @QueryParam("sortString") String sortString
    ) {
        String host = request.getHeader("host");
        Organization org = getOrg(host);
        if (org == null) {
            return Response.ok().entity(Collections.emptyList()).build();
        }
        Criteria criteriaDefinition1 = Criteria.where(Board.FIELD_SLUG).is(slug).and(Board.FIELD_ORGANIZATION_ID).is(org.getId());
        Board board = mongoConnection.getDefaultMongoTemplate().findOne(new Query(criteriaDefinition1), Board.class);
        if (board == null || board.isPrivateBoard()) {
            return Response.ok().entity(Collections.emptyList()).build();
        }
        Criteria criteriaDefinition = Criteria.where(Post.FIELD_BOARD_ID).is(board.getId());
        if (StringUtils.isNotBlank(statusFilter)) {
            criteriaDefinition.and(Post.FIELD_STATUS).is(statusFilter);
        }
        Query query = new Query(criteriaDefinition);
        query.with(Util.getSort(sortString));
        List<Post> posts;

        if (StringUtils.isNotBlank(sortString) && "trending".equals(sortString)) {
            posts = mongoConnection.getDefaultMongoTemplate().find(query, Post.class);
            posts.forEach(post -> {
                post.setTrendingScore(Util.calculateTrendingScore(post.getVotes(), post.getCreatedAt()));
            });
            posts.sort(Comparator.comparing(Post::getTrendingScore).reversed());
        } else {
            posts = mongoConnection.getDefaultMongoTemplate().find(query, Post.class);
        }


        posts.forEach(post -> post.setBoardSlug(slug));


        populateSelfVotedInPosts(posts, org.getId(), UserContext.current().getUserId());

        return Response.ok().entity(JacksonMapper.toJson(posts)).build();
    }

    @POST
    @Path("/create-comment")
    @Consumes("application/json")
    @Produces("application/json")
    public Response createComment(Comment comment, @Context HttpServletRequest request) {
        String userId = UserContext.current().getUserId();
        validationService.validate(comment);

        String host = request.getHeader("host");
        Organization org = getOrg(host);
        if (org == null) {
            return Response.status(Response.Status.NOT_FOUND).entity("Organization not found").build();
        }
        Criteria customerCriteria = Criteria.where(Customer.FIELD_USER_ID).is(userId).and(Customer.FIELD_ORGANIZATION_ID).is(org.getId());
        Customer customer = mongoConnection.getDefaultMongoTemplate().findOne(new Query(customerCriteria), Customer.class);
        Member memberForOrg = authService.getMemberForOrgId(userId, org.getId());
        if (memberForOrg == null && (customer == null || customer.isSpam())) {
            return Response.status(Response.Status.FORBIDDEN).entity("User not allowed").build();
        }

        String postId = comment.getPostId();
        Post post = getPost(postId, org.getId());
        if (post == null) {
            throw new UserVisibleException("Post not found");
        }

        String boardId = post.getBoardId();
        Board board = getBoard(boardId, org.getId());
        if (board == null || board.isPrivateBoard()){
            throw new UserVisibleException("Post not found");
        }

        if (StringUtils.isNotBlank(comment.getReplyToCommentId())) {
            Comment inReplyToComment = getComment(comment.getReplyToCommentId(), org.getId());
            if (inReplyToComment == null) {
                throw new UserVisibleException("Parent comment does not exist");
            }
        }

        Comment existingComment = getComment(comment.getId(), org.getId());
        boolean isNew = false;
        if (existingComment == null) {
            comment.setId(new ObjectId().toString());
            comment.setCreatedAt(System.currentTimeMillis());
            comment.setCreatedByUserId(userId);
            comment.setOrganizationId(org.getId());
            comment.setPostId(post.getId());
            isNew = true;
        } else {
            if (!existingComment.getCreatedByUserId().equals(userId)) {
                throw new UserVisibleException("User not allowed");
            }
            existingComment.setContent(comment.getContent());
            existingComment.setModifiedAt(System.currentTimeMillis());
        }
        comment.setCommentType(Comment.CommentType.COMMENT);
        comment.setOrganizationId(org.getId());
        try {
            if (isNew) {
                mongoConnection.getDefaultMongoTemplate().insert(comment);
                mongoConnection.getDefaultMongoTemplate().updateFirst(new Query(Criteria.where(Post.FIELD_ID).is(postId)), new Update().inc(Post.FIELD_COMMENT_COUNT, 1), Post.class);
                createJobForCommentAddedEmail(comment.getId(), org.getId());
            } else {
                mongoConnection.getDefaultMongoTemplate().save(existingComment);
            }
        } catch (DuplicateKeyException e) {
            throw new UserVisibleException("Comment already exists");
        }
        return Response.ok("{}").build();
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
        Member memberForOrg = authService.getMemberForOrgId(userId, org.getId());
        if (memberForOrg == null && (customer == null || customer.isSpam())) {
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

        if (CollectionUtils.isNotEmpty(reqPost.getAttachments()) && reqPost.getAttachments().size() > 50) {
            throw new UserVisibleException("Too many attachments");
        }

        StringBuilder error = getPostValidationErrorForCustomFormFields(reqPost, board);
        if (!error.isEmpty()) {
            throw new UserVisibleException(error.toString());
        }
        // validating late, because we need to check custom form fields and give custom error
        validationService.validate(reqPost);

        Post post = new Post();
        post.setAttachments(reqPost.getAttachments());
        post.setOrganizationId(org.getId());
        post.setBoardId(board.getId());
        post.setCreatedByUserId(userId);
        post.setCreatedAt(System.currentTimeMillis());
        post.setTitle(reqPost.getTitle());
        post.setDescription(reqPost.getDescription());
        post.setStatus("OPEN");
        post.setVotes(1L);
        post.setSlug(Util.fixSlug(reqPost.getTitle()));
        try {
            mongoConnection.getDefaultMongoTemplate().insert(post);
        } catch (DuplicateKeyException exception) {
            String string = new ObjectId().toString();
            // set existing slug + objectid(first 5 characters) + - objectId remaining
            post.setSlug(post.getSlug() + "-" + string.substring(0, 5) + "-" + string.substring(5));
            mongoConnection.getDefaultMongoTemplate().insert(post);
        }

        Voter voter = new Voter();
        voter.setUserId(userId);
        voter.setPostId(post.getId());
        voter.setOrganizationId(board.getOrganizationId());
        voter.setCreatedAt(System.currentTimeMillis());
        mongoConnection.getDefaultMongoTemplate().insert(voter);

        mongoConnection.getDefaultMongoTemplate().updateFirst(new Query(Criteria.where(Board.FIELD_ID).is(board.getId())), new Update().inc(Board.FIELD_POST_COUNT, 1), Board.class);

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

    private Post getPost(String postId, String orgId) {
        Criteria criteriaDefinition = Criteria.where(Post.FIELD_ID).is(postId).and(Post.FIELD_ORGANIZATION_ID).is(orgId);
        return mongoConnection.getDefaultMongoTemplate().findOne(new Query(criteriaDefinition), Post.class);
    }

    private Board getBoard(String boardId, String orgId) {
        Criteria criteriaDefinition = Criteria.where(Board.FIELD_ID).is(boardId).and(Board.FIELD_ORGANIZATION_ID).is(orgId);
        return mongoConnection.getDefaultMongoTemplate().findOne(new Query(criteriaDefinition), Board.class);
    }

    private Comment getComment(String replyToCommentId, String orgId) {
        Criteria criteriaDefinition = Criteria.where(Comment.FIELD_ID).is(replyToCommentId).and(Comment.FIELD_ORGANIZATION_ID).is(orgId);
        return mongoConnection.getDefaultMongoTemplate().findOne(new Query(criteriaDefinition), Comment.class);
    }

    private void createJobForCommentAddedEmail(String commentId, String orgId) {
        jobCreator.scheduleJobNow(SendCommentUpdateEmailExecutor.class, Map.of("commentId", commentId), orgId);
    }

}
