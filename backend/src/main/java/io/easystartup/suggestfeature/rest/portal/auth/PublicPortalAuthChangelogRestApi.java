package io.easystartup.suggestfeature.rest.portal.auth;


import io.easystartup.suggestfeature.beans.ChangelogSubscriber;
import io.easystartup.suggestfeature.beans.Organization;
import io.easystartup.suggestfeature.filters.UserContext;
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

/**
 * @author indianBond
 */
@Path("/portal/auth/changelog")
@Component
public class PublicPortalAuthChangelogRestApi {

    private final MongoTemplateFactory mongoConnection;

    @Autowired
    public PublicPortalAuthChangelogRestApi(MongoTemplateFactory mongoConnection) {
        this.mongoConnection = mongoConnection;
    }


    @GET
    @Path("/get-changelog-subscription")
    @Produces("application/json")
    public Response getChangelogSubscription(@Context HttpServletRequest request) {
        String host = request.getHeader("host");
        Organization org = getOrg(host);
        if (org == null) {
            return Response.ok().entity(Collections.emptyList()).build();
        }

        Criteria criteria = Criteria.where(ChangelogSubscriber.FIELD_ORGANIZATION_ID).is(org.getId())
                .and(ChangelogSubscriber.FIELD_USER_ID).is(UserContext.current().getUserId());
        ChangelogSubscriber changelogSubscriber = mongoConnection.getDefaultMongoTemplate().findOne(new Query(criteria), ChangelogSubscriber.class);
        if (changelogSubscriber == null) {
            return Response.ok().entity("{}").build();
        }
        return Response.ok(JacksonMapper.toJson(changelogSubscriber)).build();
    }

    @GET
    @Path("/subscribe-to-changelog")
    @Produces("application/json")
    public Response subscribeToChangelog(@Context HttpServletRequest request, @QueryParam("unsubscribe") Boolean unsubscribe) {
        String host = request.getHeader("host");
        Organization org = getOrg(host);
        if (org == null || (org.getChangelogSettings() != null && !org.getChangelogSettings().isEnabled())) {
            return Response.ok().entity(Collections.emptyList()).build();
        }

        if (Boolean.TRUE.equals(unsubscribe)) {
            Criteria criteria = Criteria.where(ChangelogSubscriber.FIELD_ORGANIZATION_ID).is(org.getId())
                    .and(ChangelogSubscriber.FIELD_USER_ID).is(UserContext.current().getUserId());
            mongoConnection.getDefaultMongoTemplate().remove(new Query(criteria), ChangelogSubscriber.class);
            return Response.ok().entity("{}").build();
        }

        ChangelogSubscriber changelogSubscriber = new ChangelogSubscriber();
        changelogSubscriber.setId("changelog-subscriber-" + UserContext.current().getUserId() + "-" + org.getId());
        changelogSubscriber.setOrganizationId(org.getId());
        changelogSubscriber.setUserId(UserContext.current().getUserId());
        changelogSubscriber.setCreatedAt(System.currentTimeMillis());
        mongoConnection.getDefaultMongoTemplate().save(changelogSubscriber);

        return Response.ok().entity("{}").build();
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
