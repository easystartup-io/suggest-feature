package io.easystartup.suggestfeature.rest.portal.unauth;


import com.google.common.cache.Cache;
import com.google.common.cache.CacheBuilder;
import io.easystartup.suggestfeature.beans.Board;
import io.easystartup.suggestfeature.beans.Organization;
import io.easystartup.suggestfeature.beans.Post;
import io.easystartup.suggestfeature.beans.RoadmapSettings;
import io.easystartup.suggestfeature.dto.SearchPostDTO;
import io.easystartup.suggestfeature.services.db.MongoTemplateFactory;
import io.easystartup.suggestfeature.utils.JacksonMapper;
import io.easystartup.suggestfeature.utils.SearchUtil;
import io.easystartup.suggestfeature.utils.Util;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.constraints.NotBlank;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.Response;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

import static io.easystartup.suggestfeature.utils.Util.populatePost;

/**
 * @author indianBond
 */
@Path("/portal/unauth/posts")
@Component
public class PublicPortalPostRestApi {

    private final MongoTemplateFactory mongoConnection;
    // Loading cache of host vs page
    private final Cache<String, String> hostOrgCache = CacheBuilder.newBuilder()
            .maximumSize(20_000)
            .expireAfterWrite(10, TimeUnit.SECONDS)
            .build();
    @Autowired
    public PublicPortalPostRestApi(MongoTemplateFactory mongoConnection) {
        this.mongoConnection = mongoConnection;
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
                Organization safeOrg = org.createSafeOrg();

                List<Board> boardList = mongoConnection.getDefaultMongoTemplate().find(new Query(Criteria.where(Board.FIELD_ORGANIZATION_ID).in(org.getId())), Board.class);
                boardList.stream().filter((board) -> !board.isPrivateBoard()).forEach(PublicPortalPostRestApi::sanitizeBoard);
                boardList.sort(Comparator.comparing(Board::getOrder));
                Map<String, Object> rv = new HashMap<>();
                rv.put("org", safeOrg);
                rv.put("boards", boardList);
                return JacksonMapper.toJson(rv);
            });
        } catch (ExecutionException e) {
            throw new RuntimeException(e);
        }
        return Response.ok().entity(resp).build();
    }

    private static void sanitizeBoard(Board board) {
        board.setOrganizationId(null);
        board.setCreatedByUserId(null);
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
        Map<String, Board> boardMap = boardList.stream().collect(Collectors.toMap(Board::getId, board -> board));
        Map<String, String> boardIdVsSlug = boardList.stream().collect(Collectors.toMap(Board::getId, Board::getSlug));
        Set<String> disabledBoards = new HashSet<>();
        if (org.getRoadmapSettings() != null && CollectionUtils.isNotEmpty(org.getRoadmapSettings().getDisabledBoards())) {
            disabledBoards.addAll(org.getRoadmapSettings().getDisabledBoards());
        }
        Set<String> boardIds = boardList.stream().filter((board) -> !board.isPrivateBoard() && !disabledBoards.contains(board.getId())).map(Board::getId).collect(Collectors.toSet());
        Criteria criteriaDefinition = Criteria.where(Post.FIELD_BOARD_ID).in(boardIds).and(Post.FIELD_ORGANIZATION_ID).is(org.getId());
        Query query = new Query(criteriaDefinition);
        query.with(Sort.by(Sort.Direction.DESC, Post.FIELD_CREATED_AT));
        List<Post> posts = mongoConnection.getDefaultMongoTemplate().find(query, Post.class);
        List<String> allowedStatuses;
        if (org.getRoadmapSettings() != null) {
            allowedStatuses = org.getRoadmapSettings().getAllowedStatuses();
        } else {
            RoadmapSettings roadmapSettings = new RoadmapSettings();
            allowedStatuses = roadmapSettings.getAllowedStatuses();
        }
        posts = posts.stream().filter(post -> allowedStatuses.contains(post.getStatus())).collect(Collectors.toList());

        for (Post post : posts) {
            post.setBoardSlug(boardIdVsSlug.get(post.getBoardId()));
            Board board = boardMap.get(post.getBoardId());
            if (board == null) {
                continue;
            }
            post.setBoardName(board.getName());
        }

        // Group posts based on status
        Map<String, List<Post>> postsByStatus = posts.stream().collect(Collectors.groupingBy(Post::getStatus));

        Map<String, List<Post>> rv = new LinkedHashMap<>();
        allowedStatuses.forEach(status -> rv.put(status, postsByStatus.getOrDefault(status, new ArrayList<>())));

        return Response.ok().entity(JacksonMapper.toJson(rv)).build();
    }

    @POST
    @Path("/search-post")
    @Consumes("application/json")
    @Produces("application/json")
    public Response searchPost(@Context HttpServletRequest request, SearchPostDTO req) throws ExecutionException {
        String host = request.getHeader("host");
        String returnValue = SearchUtil.searchPosts(host, req);
        return Response.ok(returnValue).build();
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
        post.setBoardSlug(boardSlug);
        populatePost(post, org.getId(), null, false);

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
        List<Post> posts;

        Query query = new Query(criteriaDefinition).with(Sort.by(Sort.Direction.DESC, Post.FIELD_CREATED_AT));
        query.with(Util.getSort(sortString));
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

    public static class SearchPostCacheKey {
        private final String query;
        private final String boardSlug;
        private final String host;

        public SearchPostCacheKey(String query, String boardSlug, String host) {
            this.query = query;
            this.boardSlug = boardSlug;
            this.host = host;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof SearchPostCacheKey)) return false;

            SearchPostCacheKey that = (SearchPostCacheKey) o;
            return Objects.equals(query, that.query) && Objects.equals(boardSlug, that.boardSlug) && Objects.equals(host, that.host);
        }

        @Override
        public int hashCode() {
            return Objects.hash(query, boardSlug, host);
        }
    }
}
