package io.easystartup.suggestfeature.rest.admin;

import io.easystartup.suggestfeature.beans.*;
import io.easystartup.suggestfeature.dto.FetchPostsRequestDTO;
import io.easystartup.suggestfeature.dto.Order;
import io.easystartup.suggestfeature.dto.Page;
import io.easystartup.suggestfeature.dto.Sort;
import io.easystartup.suggestfeature.filters.UserContext;
import io.easystartup.suggestfeature.filters.UserVisibleException;
import io.easystartup.suggestfeature.services.AuthService;
import io.easystartup.suggestfeature.services.ValidationService;
import io.easystartup.suggestfeature.services.db.MongoTemplateFactory;
import io.easystartup.suggestfeature.utils.JacksonMapper;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Response;
import org.apache.commons.lang3.StringUtils;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Set;

/*
 * @author indianBond
 */
@Path("/auth/posts")
@Component
public class PostsRestApi {

    private final MongoTemplateFactory mongoConnection;
    private final AuthService authService;
    private final ValidationService validationService;
    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of(Post.FIELD_CREATED_AT, Post.FIELD_NAME);
    public static final String EMPTY_JSON_RESPONSE = JacksonMapper.toJson(Collections.emptyMap());

    @Autowired
    public PostsRestApi(MongoTemplateFactory mongoConnection, AuthService authService, ValidationService validationService) {
        this.mongoConnection = mongoConnection;
        this.authService = authService;
        this.validationService = validationService;
    }

    @POST
    @Path("/create-post")
    @Consumes("application/json")
    @Produces("application/json")
    public Response createPost(Post post) {
        String userId = UserContext.current().getUserId();
        validationService.validate(post);
        String boardId = post.getBoardId();
        Board board = getBoard(boardId, UserContext.current().getOrgId());
        if (board == null){
            throw new UserVisibleException("Board not found");
        }

        Post existingPost = getPost(post.getId(), UserContext.current().getOrgId());
        boolean isNew = false;
        if (existingPost == null) {
            post.setId(new ObjectId().toString());
            post.setCreatedAt(System.currentTimeMillis());
            post.setCreatedByUserId(userId);
            post.setApproved(false);
            isNew = true;
        } else {
            post.setCreatedByUserId(existingPost.getCreatedByUserId());
            post.setCreatedAt(existingPost.getCreatedAt());
            if (!existingPost.getBoardId().equals(boardId)) {
                throw new UserVisibleException("Cannot change board of a post");
            }
            post.setApproved(existingPost.isApproved());
        }
        post.setOrganizationId(UserContext.current().getOrgId());
        try {
            if (isNew) {
                mongoConnection.getDefaultMongoTemplate().insert(post);

                Voter voter = new Voter();
                voter.setUserId(userId);
                voter.setPostId(post.getId());
                voter.setOrganizationId(UserContext.current().getOrgId());
                voter.setCreatedAt(System.currentTimeMillis());
                mongoConnection.getDefaultMongoTemplate().insert(voter);

            } else {
                mongoConnection.getDefaultMongoTemplate().save(post);
            }
        } catch (DuplicateKeyException e) {
            throw new UserVisibleException("Post with this slug already exists");
        }
        return Response.ok(JacksonMapper.toJson(post)).build();
    }

    @POST
    @Path("/create-comment")
    @Consumes("application/json")
    @Produces("application/json")
    public Response createComment(Comment comment) {
        String userId = UserContext.current().getUserId();
        validationService.validate(comment);
        String postId = comment.getPostId();
        Post post = getPost(postId, UserContext.current().getOrgId());
        if (post == null){
            throw new UserVisibleException("Post not found");
        }

        if (StringUtils.isNotBlank(comment.getReplyToCommentId())){
            Comment inReplyToComment = getComment(comment.getReplyToCommentId(), UserContext.current().getOrgId());
            if (inReplyToComment == null){
                throw new UserVisibleException("Parent comment does not exist");
            }
        }

        Comment existingComment = getComment(comment.getId(), UserContext.current().getOrgId());
        boolean isNew = false;
        if (existingComment == null) {
            comment.setId(new ObjectId().toString());
            comment.setCreatedAt(System.currentTimeMillis());
            comment.setCreatedByUserId(userId);
            comment.setOrganizationId(UserContext.current().getOrgId());
            comment.setPostId(post.getId());
            comment.setBoardId(post.getBoardId());
            isNew = true;
        } else {
            // Todo: For normal page view, only allow to comment if same user trying to edit comment
            existingComment.setContent(comment.getContent());
            existingComment.setModifiedAt(System.currentTimeMillis());
        }
        comment.setOrganizationId(UserContext.current().getOrgId());
        try {
            if (isNew) {
                mongoConnection.getDefaultMongoTemplate().insert(comment);
            } else {
                mongoConnection.getDefaultMongoTemplate().save(existingComment);
            }
        } catch (DuplicateKeyException e) {
            throw new UserVisibleException("Comment already exists");
        }
        return Response.ok(EMPTY_JSON_RESPONSE).build();
    }


    @GET
    @Path("/fetch-post")
    @Consumes("application/json")
    @Produces("application/json")
    public Response fetchPost(@QueryParam("postId") String postId) {
        String userId = UserContext.current().getUserId();
        String orgId = UserContext.current().getOrgId();
        Post one = getPost(postId, orgId);
        if (postId != null && one == null) {
            throw new UserVisibleException("Post not found");
        }
        if (one != null && !one.getOrganizationId().equals(orgId)) {
            throw new UserVisibleException("Post not found");
        }
        populatePost(one);
        return Response.ok(JacksonMapper.toJson(one)).build();
    }

    @POST
    @Path("/upvote-post")
    @Consumes("application/json")
    @Produces("application/json")
    public Response upvotePost(@QueryParam("postId") String postId, @QueryParam("upvote") boolean upvote) {
        String userId = UserContext.current().getUserId();
        String orgId = UserContext.current().getOrgId();
        Post one = getPost(postId, orgId);
        if (postId != null && one == null) {
            throw new UserVisibleException("Post not found");
        }
        if (one != null && !one.getOrganizationId().equals(orgId)) {
            throw new UserVisibleException("Post not found");
        }
        Voter voter = new Voter();
        voter.setUserId(userId);
        voter.setPostId(postId);
        voter.setOrganizationId(orgId);
        voter.setCreatedAt(System.currentTimeMillis());
        try {
            if (upvote) {
                mongoConnection.getDefaultMongoTemplate().insert(voter);
            } else {
                Criteria criteriaDefinition = Criteria
                        .where(Voter.FIELD_POST_ID).is(postId)
                        .and(Voter.FIELD_USER_ID).is(userId)
                        .and(Voter.FIELD_ORGANIZATION_ID).is(orgId);
                mongoConnection.getDefaultMongoTemplate().remove(new Query(criteriaDefinition), Voter.class);
            }
        } catch (DuplicateKeyException e) {
            throw new UserVisibleException("Already upvoted");
        }
        return Response.ok(EMPTY_JSON_RESPONSE).build();
    }

    private void populatePost(Post post) {
        if (post == null) {
            return;
        }
        Criteria criteriaDefinition = Criteria.where(Voter.FIELD_POST_ID).is(post.getId());
        List<Voter> voters = mongoConnection.getDefaultMongoTemplate().find(new Query(criteriaDefinition), Voter.class);
        post.setVoters(voters);
        post.setVotes(voters.size());

        for (Voter voter : voters) {
            if (voter.getUserId().equals(UserContext.current().getUserId())) {
                post.setSelfVoted(true);
                break;
            }
        }

        Criteria criteriaDefinition1 = Criteria.where(Comment.FIELD_POST_ID).is(post.getId());
        List<Comment> comments = mongoConnection.getDefaultMongoTemplate().find(new Query(criteriaDefinition1), Comment.class);
        post.setComments(comments);
        User userByUserId = authService.getUserByUserId(post.getCreatedByUserId());

        User safeUser = new User();
        safeUser.setId(userByUserId.getId());
        safeUser.setName(userByUserId.getName());
        safeUser.setEmail(userByUserId.getEmail());
        safeUser.setProfilePic(userByUserId.getProfilePic());
        post.setUser(safeUser);
    }

    @POST
    @Path("/fetch-posts")
    @Consumes("application/json")
    @Produces("application/json")
    public Response fetchPosts(FetchPostsRequestDTO req) {
        String userId = UserContext.current().getUserId();
        String orgId = UserContext.current().getOrgId();
        Criteria criteriaDefinition = Criteria.where(Board.FIELD_ORGANIZATION_ID).is(orgId);
        if (StringUtils.isNotBlank(req.getBoardId())){
            criteriaDefinition.and(Post.FIELD_BOARD_ID).is(req.getBoardId());
        }
        Query query = new Query(criteriaDefinition);
        if (req.getSort()== null){
            req.setSort(new Sort(Post.FIELD_CREATED_AT, Order.DESC));
        }
        if (req.getPage() == null){
            req.setPage(new Page(0, 20));
        }
        String field = req.getSort().getField();
        if (!ALLOWED_SORT_FIELDS.contains(field)){
            throw new UserVisibleException("Invalid sort field");
        }
        query.with(org.springframework.data.domain.Sort.by(getOrder(req), field));
        List<Post> posts = mongoConnection.getDefaultMongoTemplate().find(query, Post.class);
        Collections.sort(posts, Comparator.comparing(Post::getId));
        return Response.ok(JacksonMapper.toJson(posts)).build();
    }

    private static org.springframework.data.domain.Sort.Direction getOrder(FetchPostsRequestDTO req) {
        switch (req.getSort().getOrder()){
            case ASC -> {
                return org.springframework.data.domain.Sort.Direction.ASC;
            }
            case DESC -> {
                return org.springframework.data.domain.Sort.Direction.DESC;
            }
        }
        return org.springframework.data.domain.Sort.Direction.DESC;
    }

    private Post getPost(String postId, String orgId) {
        if (postId == null) {
            return null;
        }
        Criteria criteriaDefinition = Criteria.where(Post.FIELD_ID).is(postId).and(Post.FIELD_ORGANIZATION_ID).is(orgId);
        return mongoConnection.getDefaultMongoTemplate().findOne(new Query(criteriaDefinition), Post.class);
    }

    private Comment getComment(String commentId, String orgId) {
        if (commentId == null) {
            return null;
        }
        Criteria criteriaDefinition = Criteria.where(Comment.FIELD_ID).is(commentId).and(Comment.FIELD_ORGANIZATION_ID).is(orgId);
        return mongoConnection.getDefaultMongoTemplate().findOne(new Query(criteriaDefinition), Comment.class);
    }

    private Board getBoard(String boardId, String orgId) {
        if (boardId == null) {
            return null;
        }
        Criteria criteriaDefinition = Criteria.where(Board.FIELD_ID).is(boardId).and(Post.FIELD_ORGANIZATION_ID).is(orgId);
        return mongoConnection.getDefaultMongoTemplate().findOne(new Query(criteriaDefinition), Board.class);
    }
}
