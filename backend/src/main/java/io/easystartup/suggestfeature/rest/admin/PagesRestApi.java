package io.easystartup.suggestfeature.rest.admin;

import io.easystartup.suggestfeature.services.AuthService;
import io.easystartup.suggestfeature.services.db.MongoTemplateFactory;
import io.easystartup.suggestfeature.services.ValidationService;
import io.easystartup.suggestfeature.beans.Page;
import io.easystartup.suggestfeature.filters.UserContext;
import io.easystartup.suggestfeature.filters.UserVisibleException;
import io.easystartup.suggestfeature.services.CustomDomainMappingService;
import io.easystartup.suggestfeature.utils.JacksonMapper;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Response;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.Comparator;
import java.util.List;

/*
 * @author indianBond
 */
@Path("/auth/pages")
@Component
public class PagesRestApi {

    private final MongoTemplateFactory mongoConnection;
    private final AuthService authService;
    private final ValidationService validationService;
    private final CustomDomainMappingService customDomainMappingService;

    @Autowired
    public PagesRestApi(MongoTemplateFactory mongoConnection, AuthService authService, ValidationService validationService, CustomDomainMappingService customDomainMappingService) {
        this.mongoConnection = mongoConnection;
        this.authService = authService;
        this.validationService = validationService;
        this.customDomainMappingService = customDomainMappingService;
    }

    @POST
    @Path("/create-page")
    @Consumes("application/json")
    @Produces("application/json")
    public Response createPage(Page page) {
        String userId = UserContext.current().getUserId();
        validationService.validate(page);
        Page existingPage = getPage(page.getId(), UserContext.current().getOrgId());
        boolean isNew = false;
        if (existingPage == null) {
            page.setId(new ObjectId().toString());
            page.setCreatedAt(System.currentTimeMillis());
            page.setCreatedByUserId(userId);
            // Only show custom domain option later on
            page.setCustomDomain(null);
            isNew = true;
        } else {
            page.setCreatedByUserId(existingPage.getCreatedByUserId());
            page.setCreatedAt(existingPage.getCreatedAt());
            if (page.getCustomDomain() != null && !page.getCustomDomain().equals(existingPage.getCustomDomain())) {
                customDomainMappingService.updateCustomDomainMapping(page.getCustomDomain(), page.getId());
            } else if (page.getCustomDomain() == null && existingPage.getCustomDomain() != null) {
                customDomainMappingService.deleteCustomDomainMapping(existingPage.getCustomDomain());
            } else if (page.getCustomDomain() != null && existingPage.getCustomDomain() == null) {
                customDomainMappingService.createCustomDomainMapping(page.getCustomDomain(), page.getId());
            }
        }
        page.setOrganizationId(UserContext.current().getOrgId());
        try {
            if (isNew) {
                mongoConnection.getDefaultMongoTemplate().insert(page);
            } else {
                mongoConnection.getDefaultMongoTemplate().save(page);
            }
        } catch (DuplicateKeyException e) {
            throw new UserVisibleException("Page with this slug already exists");
        }
        return Response.ok(JacksonMapper.toJson(page)).build();
    }

    @GET
    @Path("/fetch-page")
    @Consumes("application/json")
    @Produces("application/json")
    public Response fetchPage(@QueryParam("pageId") String pageId) {
        String userId = UserContext.current().getUserId();
        String orgId = UserContext.current().getOrgId();
        Page one = getPage(pageId, orgId);
        return Response.ok(JacksonMapper.toJson(one)).build();
    }

    @GET
    @Path("/fetch-pages")
    @Consumes("application/json")
    @Produces("application/json")
    public Response fetchPages() {
        String userId = UserContext.current().getUserId();
        String orgId = UserContext.current().getOrgId();
        List<Page> pages = mongoConnection.getDefaultMongoTemplate().find(new Query(Criteria.where(Page.FIELD_ORGANIZATION_ID).is(orgId)), Page.class);
        Collections.sort(pages, Comparator.comparing(Page::getId));
        return Response.ok(JacksonMapper.toJson(pages)).build();
    }

    private Page getPage(String pageId, String orgId) {
        if (pageId == null) {
            return null;
        }
        Criteria criteriaDefinition = Criteria.where(Page.FIELD_ID).is(pageId).and(Page.FIELD_ORGANIZATION_ID).is(orgId);
        return mongoConnection.getDefaultMongoTemplate().findOne(new Query(criteriaDefinition), Page.class);
    }
}
