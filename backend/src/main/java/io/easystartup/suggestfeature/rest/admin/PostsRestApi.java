package io.easystartup.suggestfeature.rest.admin;

import io.easystartup.suggestfeature.beans.*;
import io.easystartup.suggestfeature.dto.*;
import io.easystartup.suggestfeature.filters.UserContext;
import io.easystartup.suggestfeature.filters.UserVisibleException;
import io.easystartup.suggestfeature.services.AuthService;
import io.easystartup.suggestfeature.services.ValidationService;
import io.easystartup.suggestfeature.services.db.MongoTemplateFactory;
import io.easystartup.suggestfeature.utils.JacksonMapper;
import io.easystartup.suggestfeature.utils.Util;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Response;
import org.apache.commons.lang3.StringUtils;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

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
    @Path("/update-post-details")
    @Consumes("application/json")
    @Produces("application/json")
    public Response updatePostDetails(PostDetailsUpdateDTO req) {
        String userId = UserContext.current().getUserId();
        validationService.validate(req);

        validateStatus(req.getStatus());
        validatePriority(req.getPriority());

        Post existingPost = getPost(req.getPostId(), UserContext.current().getOrgId());
        if (existingPost == null) {
            throw new UserVisibleException("Post not found");
        }
        if (StringUtils.isNotBlank(req.getStatus())) {
            existingPost.setStatus(req.getStatus());
        }
        if (req.getApproved() != null) {
            existingPost.setApproved(req.getApproved());
        }
        if (StringUtils.isNotBlank(req.getPriority())) {
            existingPost.setPriority(req.getPriority());
        }

        mongoConnection.getDefaultMongoTemplate().save(existingPost);
        return Response.ok(EMPTY_JSON_RESPONSE).build();
    }

    @POST
    @Path("/create-post")
    @Consumes("application/json")
    @Produces("application/json")
    public Response createPost(Post post) {
        String userId = UserContext.current().getUserId();
        validationService.validate(post);

        validateStatus(post.getStatus());
        validatePriority(post.getPriority());

        Board board = null;
        if (StringUtils.isNotBlank(post.getBoardSlug())) {
            board = getBoardFromSlug(post.getBoardSlug(), UserContext.current().getOrgId());
            post.setBoardId(board.getId());
        }

        String boardId = post.getBoardId();
        if (board == null) {
            board = getBoard(boardId, UserContext.current().getOrgId());
        }
        if (board == null) {
            throw new UserVisibleException("Board not found");
        }

        Post existingPost = getPost(post.getId(), UserContext.current().getOrgId());
        boolean isNew = false;
        if (existingPost == null) {
            post.setId(new ObjectId().toString());
            post.setCreatedAt(System.currentTimeMillis());
            post.setCreatedByUserId(userId);
            post.setApproved(false);
            post.setSlug(Util.fixSlug(post.getTitle()));
            isNew = true;
        } else {
            post.setCreatedByUserId(existingPost.getCreatedByUserId());
            post.setCreatedAt(existingPost.getCreatedAt());
            if (!existingPost.getBoardId().equals(boardId)) {
                throw new UserVisibleException("Cannot change board of a post");
            }
            post.setApproved(existingPost.isApproved());
            post.setSlug(existingPost.getSlug());
            post.setBoardId(existingPost.getBoardId());
        }
        post.setOrganizationId(UserContext.current().getOrgId());
        try {
            if (isNew) {
                try {
                    mongoConnection.getDefaultMongoTemplate().insert(post);
                } catch (DuplicateKeyException e) {
                    String slugSuffix = new ObjectId().toString();
                    // split slug suffix into two parts
                    post.setSlug(post.getSlug() + "-" + slugSuffix.substring(0, 4) + "-" + slugSuffix.substring(4));
                    mongoConnection.getDefaultMongoTemplate().insert(post);
                }
            } else {
                mongoConnection.getDefaultMongoTemplate().save(post);
            }

        } catch (DuplicateKeyException e) {
            throw new UserVisibleException("Post with this slug already exists");
        }

        if (isNew) {
            Voter voter = new Voter();
            voter.setUserId(userId);
            voter.setPostId(post.getId());
            voter.setOrganizationId(UserContext.current().getOrgId());
            voter.setCreatedAt(System.currentTimeMillis());
            mongoConnection.getDefaultMongoTemplate().insert(voter);

            // Update post count in board
            mongoConnection.getDefaultMongoTemplate().updateFirst(new Query(Criteria.where(Board.FIELD_ID).is(boardId)), new Update().inc(Board.FIELD_POST_COUNT, 1), Board.class);
        }
        return Response.ok(JacksonMapper.toJson(post)).build();
    }

    private void validatePriority(String priority) {
        if (StringUtils.isBlank(priority)) {
            return;
        }
        Set<String> validPriority = Set.of("High", "Medium", "Low");
        if (!validPriority.contains(priority)) {
            throw new UserVisibleException("Invalid priority");
        }
    }

    private void validateStatus(String status) {
        if (StringUtils.isBlank(status)) {
            return;
        }
        Set<String> validStatus = Set.of("OPEN", "UNDER REVIEW", "PLANNED", "IN PROGRESS", "LIVE", "COMPLETE", "CLOSED");
        if (!validStatus.contains(status)) {
            throw new UserVisibleException("Invalid status");
        }
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
        if (post == null) {
            throw new UserVisibleException("Post not found");
        }

        if (StringUtils.isNotBlank(comment.getReplyToCommentId())) {
            Comment inReplyToComment = getComment(comment.getReplyToCommentId(), UserContext.current().getOrgId());
            if (inReplyToComment == null) {
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

        populateUserInCommentAndPopulateNestedCommentsStructure(comments);


        User userByUserId = authService.getUserByUserId(post.getCreatedByUserId());

        User safeUser = new User();
        safeUser.setId(userByUserId.getId());
        safeUser.setName(userByUserId.getName());
        safeUser.setEmail(userByUserId.getEmail());
        safeUser.setProfilePic(userByUserId.getProfilePic());
        post.setUser(safeUser);
    }

    private void populateUserInCommentAndPopulateNestedCommentsStructure(List<Comment> comments) {
        // All comments are already fetched. Now populate user in each comment by making single db call
        // And also populate nested comments structure. Based on replyToCommentId and comments list
        Set<String> userIds = comments.stream().map(Comment::getCreatedByUserId).collect(Collectors.toSet());

        Map<String, User> userIdVsUser = authService.getUsersByUserIds(userIds).stream().map(user -> {
            User safeUser = new User();
            safeUser.setId(user.getId());
            safeUser.setName(user.getName());
            safeUser.setEmail(user.getEmail());
            safeUser.setProfilePic(user.getProfilePic());
            return safeUser;
        }).collect(Collectors.toMap(User::getId, Function.identity()));

        for (Comment comment : comments) {
            comment.setUser(userIdVsUser.get(comment.getCreatedByUserId()));
        }

        // Desc sort by created at
        Collections.sort(comments, Comparator.comparing(Comment::getCreatedAt).reversed());

        Map<String, Comment> commentIdVsComment = comments.stream().collect(Collectors.toMap(Comment::getId, Function.identity()));
        for (Comment comment : comments) {
            if (StringUtils.isNotBlank(comment.getReplyToCommentId())) {
                Comment parentComment = commentIdVsComment.get(comment.getReplyToCommentId());
                if (parentComment != null) {
                    if (parentComment.getComments() == null) {
                        parentComment.setComments(new ArrayList<>());
                    }
                    parentComment.getComments().add(comment);
                }
            }
        }
    }

    @POST
    @Path("/fetch-posts")
    @Consumes("application/json")
    @Produces("application/json")
    public Response fetchPosts(FetchPostsRequestDTO req) {
        String userId = UserContext.current().getUserId();
        String orgId = UserContext.current().getOrgId();
        Criteria criteriaDefinition = Criteria.where(Board.FIELD_ORGANIZATION_ID).is(orgId);
        if (StringUtils.isNotBlank(req.getBoardSlug())) {
            Criteria boardFetch = Criteria.where(Board.FIELD_SLUG).is(req.getBoardSlug()).and(Board.FIELD_ORGANIZATION_ID).is(orgId);
            Board board = mongoConnection.getDefaultMongoTemplate().findOne(new Query(boardFetch), Board.class);
            criteriaDefinition.and(Post.FIELD_BOARD_ID).is(board.getId());
        }
        Query query = new Query(criteriaDefinition);
        if (req.getSort() == null) {
            req.setSort(new Sort(Post.FIELD_CREATED_AT, Order.DESC));
        }
        if (req.getPage() == null) {
            req.setPage(new Page(0, 20));
        }
        String field = req.getSort().getField();
        if (!ALLOWED_SORT_FIELDS.contains(field)) {
            throw new UserVisibleException("Invalid sort field");
        }
        query.with(org.springframework.data.domain.Sort.by(getOrder(req), field));
        List<Post> posts = mongoConnection.getDefaultMongoTemplate().find(query, Post.class);
        Collections.sort(posts, Comparator.comparing(Post::getId));
        return Response.ok(JacksonMapper.toJson(posts)).build();
    }

    private static org.springframework.data.domain.Sort.Direction getOrder(FetchPostsRequestDTO req) {
        switch (req.getSort().getOrder()) {
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

    private Board getBoardFromSlug(String boardSlug, String orgId) {
        if (boardSlug == null) {
            return null;
        }
        Criteria criteriaDefinition = Criteria.where(Board.FIELD_SLUG).is(boardSlug).and(Post.FIELD_ORGANIZATION_ID).is(orgId);
        return mongoConnection.getDefaultMongoTemplate().findOne(new Query(criteriaDefinition), Board.class);
    }

}
