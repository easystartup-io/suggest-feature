package io.easystartup.suggestfeature.rest.portal.unauth;


import com.google.common.cache.Cache;
import com.google.common.cache.CacheBuilder;
import io.easystartup.suggestfeature.beans.Changelog;
import io.easystartup.suggestfeature.beans.Organization;
import io.easystartup.suggestfeature.beans.Post;
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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * @author indianBond
 */
@Path("/portal/unauth/changelog")
@Component
public class PublicPortalChangelogRestApi {

    private final MongoTemplateFactory mongoConnection;
    // Loading cache of host vs page
    private final Cache<String, String> hostOrgCache = CacheBuilder.newBuilder()
            .maximumSize(20_000)
            .expireAfterWrite(30, TimeUnit.SECONDS)
            .build();

    @Autowired
    public PublicPortalChangelogRestApi(MongoTemplateFactory mongoConnection) {
        this.mongoConnection = mongoConnection;
    }

    @GET
    @Path("/get-changelog-posts")
    @Produces("application/json")
    public Response getChangelog(@Context HttpServletRequest request, @QueryParam("limit") Integer limit, @QueryParam("page") Integer page) {
        String host = request.getHeader("host");
        Organization org = getOrg(host);
        if (org == null || (org.getChangelogSettings() != null && !org.getChangelogSettings().isEnabled())) {
            return Response.ok().entity(Collections.emptyList()).build();
        }
        Criteria criteriaDefinition = Criteria.where(Changelog.FIELD_ORGANIZATION_ID).is(org.getId());
        criteriaDefinition.and(Changelog.FIELD_DRAFT).ne(true);
        Query query = new Query(criteriaDefinition);
        query.with(Sort.by(Sort.Direction.DESC, Changelog.FIELD_CHANGELOG_DATE));
        if (limit != null) {
            query.limit(limit);
        }
        if (page != null && limit != null) {
            query.skip((long) page * limit);
        }
        List<Changelog> changelogs = mongoConnection.getDefaultMongoTemplate().find(query, Changelog.class);

        return Response.ok().entity(JacksonMapper.toJson(changelogs)).build();
    }

    @GET
    @Path("/fetch-changelog")
    @Produces("application/json")
    public Response fetchPost(@Context HttpServletRequest request, @QueryParam("changelogSlug") @NotBlank String changelogSlug) {
        String host = request.getHeader("host");
        Organization org = getOrg(host);
        if (org == null || (org.getChangelogSettings() != null && !org.getChangelogSettings().isEnabled())) {
            return Response.ok().entity(Collections.emptyList()).build();
        }
        Criteria criteriaDefinition = Criteria.where(Changelog.FIELD_SLUG).is(changelogSlug).and(Post.FIELD_ORGANIZATION_ID).is(org.getId());
        criteriaDefinition.and(Changelog.FIELD_DRAFT).ne(true);
        Query query = new Query(criteriaDefinition);
        Changelog changelog = mongoConnection.getDefaultMongoTemplate().findOne(query, Changelog.class);

        return Response.ok().entity(JacksonMapper.toJson(changelog)).build();
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
