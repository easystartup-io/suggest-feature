package io.easystartup.suggestfeature.rest.portal.unauth;


import com.google.common.cache.Cache;
import com.google.common.cache.CacheBuilder;
import io.easystartup.suggestfeature.beans.*;
import io.easystartup.suggestfeature.filters.UserContext;
import io.easystartup.suggestfeature.loggers.Logger;
import io.easystartup.suggestfeature.loggers.LoggerFactory;
import io.easystartup.suggestfeature.services.AuthService;
import io.easystartup.suggestfeature.services.db.MongoTemplateFactory;
import io.easystartup.suggestfeature.utils.JacksonMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.constraints.NotBlank;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.Response;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.function.Function;
import java.util.stream.Collectors;

/*
 * @author indianBond
 */
@Path("/portal/unauth/posts")
@Component
public class PublicPortalPostRestApi {

    private static final Logger LOGGER = LoggerFactory.getLogger(PublicPortalPostRestApi.class);
    private final MongoTemplateFactory mongoConnection;
    private final AuthService authService;
    // Loading cache of host vs page
    private final Cache<String, String> hostOrgCache = CacheBuilder.newBuilder()
            .maximumSize(20_000)
            .expireAfterWrite(1, TimeUnit.MINUTES)
            .build();

    @Autowired
    public PublicPortalPostRestApi(MongoTemplateFactory mongoConnection, AuthService authService) {
        this.mongoConnection = mongoConnection;
        this.authService = authService;
    }

    @GET
    @Path("/init-page")
    @Produces("application/json")
    public Response initPage(@Context HttpServletRequest request) {
        // Find Page.java from request host
        String host = request.getHeader("host");
        String resp = null;
        try {
            resp = hostOrgCache.get(host, () -> {
                Organization org = getOrg(host);
                if (org == null) {
                    return JacksonMapper.toJson(Collections.emptyMap());
                }
                sanitizeOrg(org);
                List<Board> boardList = mongoConnection.getDefaultMongoTemplate().find(new Query(Criteria.where(Board.FIELD_ORGANIZATION_ID).in(org.getId())), Board.class);
                boardList.stream().filter((board) -> !board.isPrivateBoard()).forEach(PublicPortalPostRestApi::sanitizeBoard);
                Map<String, Object> rv = new HashMap<>();
                rv.put("org", org);
                rv.put("boards", boardList);
                return JacksonMapper.toJson(rv);
            });
        } catch (ExecutionException e) {
            throw new RuntimeException(e);
        }
        return Response.ok().entity(resp).build();
    }

    private void sanitizeOrg(Organization org) {
        org.setCreatedAt(null);
        org.setRoadmapSettings(null);
    }

    private static void sanitizeBoard(Board board) {
        board.setOrganizationId(null);
        board.setCreatedByUserId(null);
        board.setCreatedAt(null);
    }

    @GET
    @Path("/get-roadmap-posts")
    @Produces("application/json")
    public Response getPosts(@Context HttpServletRequest request) {
        String host = request.getHeader("host");
        Organization org = getOrg(host);
        if (org == null || (org.getRoadmapSettings() != null && !org.getRoadmapSettings().isEnabled())) {
            return Response.ok().entity(Collections.emptyList()).build();
        }
        List<Board> boardList = mongoConnection.getDefaultMongoTemplate().find(new Query(Criteria.where(Board.FIELD_ORGANIZATION_ID).is(org.getId())), Board.class);
        Set<String> disabledBoards = new HashSet<>();
        if (org.getRoadmapSettings() != null && CollectionUtils.isNotEmpty(org.getRoadmapSettings().getDisabledBoards())) {
            disabledBoards.addAll(org.getRoadmapSettings().getDisabledBoards());
        }
        Set<String> boardIds = boardList.stream().filter((board) -> !board.isPrivateBoard() && !disabledBoards.contains(board.getId())).map(Board::getId).collect(Collectors.toSet());
        Criteria criteriaDefinition = Criteria.where(Post.FIELD_BOARD_ID).in(boardIds);
        List<Post> posts = mongoConnection.getDefaultMongoTemplate().find(new Query(criteriaDefinition), Post.class);
        posts.sort(Comparator.comparing(Post::getCreatedAt).reversed());

        // Group posts based on status
        Map<String, List<Post>> postsByStatus = posts.stream().collect(Collectors.groupingBy(Post::getStatus));

        return Response.ok().entity(JacksonMapper.toJson(postsByStatus)).build();
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
        if (board.isPrivateBoard()){
            return Response.ok().entity(Collections.emptyList()).build();
        }
        Criteria criteriaDefinition = Criteria.where(Post.FIELD_BOARD_ID).is(board.getId()).and(Post.FIELD_SLUG).is(postSlug).and(Post.FIELD_ORGANIZATION_ID).is(org.getId());
        Post post = mongoConnection.getDefaultMongoTemplate().findOne(new Query(criteriaDefinition), Post.class);
        populatePost(post);

        return Response.ok().entity(JacksonMapper.toJson(post)).build();
    }

    @GET
    @Path("/get-posts-by-board")
    @Produces("application/json")
    public Response getPostsByBoard(@Context HttpServletRequest request, @QueryParam("slug") @NotBlank String slug) {
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
        List<Post> posts = mongoConnection.getDefaultMongoTemplate().find(new Query(criteriaDefinition), Post.class);
        posts.sort(Comparator.comparing(Post::getCreatedAt).reversed());
        return Response.ok().entity(JacksonMapper.toJson(posts)).build();
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

    private void populatePost(Post post) {
        if (post == null) {
            return;
        }
        Criteria criteriaDefinition = Criteria.where(Voter.FIELD_POST_ID).is(post.getId());
        List<Voter> voters = mongoConnection.getDefaultMongoTemplate().find(new Query(criteriaDefinition), Voter.class);
        post.setVoters(voters);
        post.setVotes(voters.size());

//        for (Voter voter : voters) {
//            if (voter.getUserId().equals(UserContext.current().getUserId())) {
//                post.setSelfVoted(true);
//                break;
//            }
//        }

        Criteria criteriaDefinition1 = Criteria.where(Comment.FIELD_POST_ID).is(post.getId());
        List<Comment> comments = mongoConnection.getDefaultMongoTemplate().find(new Query(criteriaDefinition1), Comment.class);
        post.setComments(comments);

        populateUserInCommentAndPopulateNestedCommentsStructure(comments);


        User userByUserId = authService.getUserByUserId(post.getCreatedByUserId());

        User safeUser = new User();
        safeUser.setId(userByUserId.getId());
        safeUser.setName(userByUserId.getName());
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
}
