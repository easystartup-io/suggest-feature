package io.easystartup.suggestfeature.rest.portal.unauth;


import com.google.common.cache.Cache;
import com.google.common.cache.CacheBuilder;
import io.easystartup.suggestfeature.beans.Board;
import io.easystartup.suggestfeature.beans.Page;
import io.easystartup.suggestfeature.beans.Post;
import io.easystartup.suggestfeature.loggers.Logger;
import io.easystartup.suggestfeature.loggers.LoggerFactory;
import io.easystartup.suggestfeature.services.db.MongoTemplateFactory;
import io.easystartup.suggestfeature.utils.JacksonMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.Response;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;

/*
 * @author indianBond
 */
@Path("/portal/unauth/posts")
@Component
public class PublicPortalPostRestApi {

    private static final Logger LOGGER = LoggerFactory.getLogger(PublicPortalPostRestApi.class);
    private final MongoTemplateFactory mongoConnection;
    // Loading cache of host vs page
    private final Cache<String, String> hostPageCache = CacheBuilder.newBuilder()
            .maximumSize(20_000)
            .expireAfterWrite(1, TimeUnit.MINUTES)
            .build();

    @Autowired
    public PublicPortalPostRestApi(MongoTemplateFactory mongoConnection) {
        this.mongoConnection = mongoConnection;
    }

    @GET
    @Path("/get-page")
    @Produces("application/json")
    public Response getPage(@Context HttpServletRequest request) {
        // Find Page.java from request host
        String host = request.getHeader("host");
        String resp = null;
        try {
            resp = hostPageCache.get(host, () -> {
                Page page = getPage(host);
                return JacksonMapper.toJson(Objects.requireNonNullElse(page, Collections.emptyMap()));
            });
        } catch (ExecutionException e) {
            throw new RuntimeException(e);
        }
        return Response.ok().entity(resp).build();
    }

    @GET
    @Path("/get-boards")
    @Produces("application/json")
    public Response getBoards(@Context HttpServletRequest request) {
        String host = request.getHeader("host");
        Page page = getPage(host);
        if (page == null) {
            return Response.ok().entity(Collections.emptyList()).build();
        }
        List<String> boards = page.getBoards();
        List<Board> boardList = mongoConnection.getDefaultMongoTemplate().find(new Query(Criteria.where(Board.FIELD_ID).in(boards)), Board.class);
        return Response.ok().entity(JacksonMapper.toJson(boardList)).build();
    }

    @GET
    @Path("/get-posts")
    @Produces("application/json")
    public Response getPosts(@Context HttpServletRequest request, @QueryParam("boardId") String boardId) {
        String host = request.getHeader("host");
        Page page = getPage(host);
        if (page == null) {
            return Response.ok().entity(Collections.emptyList()).build();
        }
        List<String> boards = page.getBoards();
        if (boardId != null && !boards.contains(boardId)) {
            return Response.ok().entity(Collections.emptyList()).build();
        }
        List<Post> posts = mongoConnection.getDefaultMongoTemplate().find(new Query(Criteria.where(Post.FIELD_BOARD_ID).is(boardId)), Post.class);
        return Response.ok().entity(JacksonMapper.toJson(posts)).build();
    }

    private Page getPage(String host) {
        Criteria criteria;
        if (!host.endsWith(".suggestfeature.com")) {
            criteria = Criteria.where(Page.FIELD_CUSTOM_DOMAIN).is(host);
        } else {
            criteria = Criteria.where(Page.FIELD_SLUG).is(host.split("\\.")[0]);
        }
        return mongoConnection.getDefaultMongoTemplate().findOne(new Query(criteria), Page.class);
    }
}
