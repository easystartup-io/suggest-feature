package io.easystartup.suggestfeature.rest.portal.unauth;


import com.google.common.cache.Cache;
import com.google.common.cache.CacheBuilder;
import io.easystartup.suggestfeature.beans.Board;
import io.easystartup.suggestfeature.beans.Organization;
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

import java.util.*;
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
    private final Cache<String, String> hostOrgCache = CacheBuilder.newBuilder()
            .maximumSize(20_000)
            .expireAfterWrite(1, TimeUnit.MINUTES)
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
                List<Board> boardList = mongoConnection.getDefaultMongoTemplate().find(new Query(Criteria.where(Board.FIELD_ORGANIZATION_ID).in(org.getId())), Board.class);
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

    @GET
    @Path("/get-posts")
    @Produces("application/json")
    public Response getPosts(@Context HttpServletRequest request, @QueryParam("boardId") String boardId) {
        String host = request.getHeader("host");
        Organization page = getOrg(host);
        if (page == null) {
            return Response.ok().entity(Collections.emptyList()).build();
        }
        List<Board> boardList = mongoConnection.getDefaultMongoTemplate().find(new Query(Criteria.where(Board.FIELD_ORGANIZATION_ID).is(page.getId())), Board.class);
        if (boardId == null && boardList.size() > 0) {
            boardId = boardList.get(0).getId();
        }
        if (boardId != null && !boardList.contains(boardId)) {
            return Response.ok().entity(Collections.emptyList()).build();
        }
        List<Post> posts = mongoConnection.getDefaultMongoTemplate().find(new Query(Criteria.where(Post.FIELD_BOARD_ID).is(boardId)), Post.class);
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
}
