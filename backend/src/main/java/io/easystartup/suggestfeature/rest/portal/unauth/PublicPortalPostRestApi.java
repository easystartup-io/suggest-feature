package io.easystartup.suggestfeature.rest.portal.unauth;


import com.google.common.cache.Cache;
import com.google.common.cache.CacheBuilder;
import io.easystartup.suggestfeature.beans.Page;
import io.easystartup.suggestfeature.loggers.Logger;
import io.easystartup.suggestfeature.loggers.LoggerFactory;
import io.easystartup.suggestfeature.services.db.MongoTemplateFactory;
import io.easystartup.suggestfeature.utils.JacksonMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.Response;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Component;

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
                Criteria criteria;
                if (!host.endsWith(".suggestfeature.com")) {
                    criteria = Criteria.where(Page.FIELD_CUSTOM_DOMAIN).is(host);
                } else {
                    criteria = Criteria.where(Page.FIELD_SLUG).is(host.split("\\.")[0]);
                }
                Page page = mongoConnection.getDefaultMongoTemplate().findOne(new Query(criteria), Page.class);
                return JacksonMapper.toJson(page);
            });
        } catch (ExecutionException e) {
            throw new RuntimeException(e);
        }
        return Response.ok().entity(resp).build();
    }

    @GET
    @Path("/get-posts")
    @Produces("application/json")
    public Response getPosts() {
        return Response.ok().entity("Hello").build();
    }
}
