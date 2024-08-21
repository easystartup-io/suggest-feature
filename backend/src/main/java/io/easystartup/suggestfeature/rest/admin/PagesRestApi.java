package io.easystartup.suggestfeature.rest.admin;

import io.easystartup.suggestfeature.beans.Board;
import io.easystartup.suggestfeature.beans.Page;
import io.easystartup.suggestfeature.filters.UserContext;
import io.easystartup.suggestfeature.filters.UserVisibleException;
import io.easystartup.suggestfeature.services.AuthService;
import io.easystartup.suggestfeature.services.CustomDomainMappingService;
import io.easystartup.suggestfeature.services.ValidationService;
import io.easystartup.suggestfeature.services.db.MongoTemplateFactory;
import io.easystartup.suggestfeature.utils.JacksonMapper;
import io.easystartup.suggestfeature.utils.Util;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Response;
import org.apache.commons.collections4.CollectionUtils;
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
@Path("/auth/pages")
@Component
public class PagesRestApi {

    private final MongoTemplateFactory mongoConnection;
    private final AuthService authService;
    private final ValidationService validationService;
    private final CustomDomainMappingService customDomainMappingService;
    private static final Set<String> RESERVED_SLUGS = Set.of(
            "create-page", "fetch-page", "fetch-pages", "app", "docs", "blog", "feedback", "demo",
            "login", "sign-up", "logout", "auth", "unauth", "portal", "api", "pages",
            "posts", "users", "organizations", "custom-domains", "custom-domain-mappings",
            "create-organization", "fetch", "fetch-organization", "fetch-organizations",
            "fetch-user", "fetch-users", "fetch-custom-domain", "fetch-custom-domains",
            "fetch-custom-domain-mapping", "fetch-custom-domain-mappings", "create-user",
            "create-custom-domain", "create-custom-domain-mapping",
            "", "system", "config", "error", "settings", "dashboard", "help",
            "support", "status", "version", "monitoring", "graphql", "webhook", "callback",
            "register", "signin", "token", "oauth", "profile", "security", "password",
            "reset", "forgot", "verify", "mfa", "sso", "home", "notifications", "messages",
            "activity", "reports", "analytics", "billing", "subscription", "checkout",
            "cart", "robots.txt", "favicon.ico", "sitemap.xml", "manifest.json", "ads.txt",
            ".well-known", "null", "undefined", "void", "unknown", "default", "true",
            "false", "administrator", "admin", "root", "terms", "privacy", "contact",
            "about", "team", "careers", "jobs", "faq", "legal", "tos", "eula", "pricing",
            "assets", "static", "public", "private", "uploads", "media", "resources",
            "images", "css", "js", "fonts", "widget", "component", "module", "iframe", "fuck", "mofo", "fuck-it", "sign-in", "log-in", "cards", "credit-card", "payment", "payments", "fuck-off", "test", "cool","fuckoff", "fuckit"
    );
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
        page.setSlug(validateAndFix(page.getSlug()));
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
                validateCustomDomainNotInUse(page.getCustomDomain());
                customDomainMappingService.updateCustomDomainMapping(page.getCustomDomain(), page.getId());
            } else if (page.getCustomDomain() == null && existingPage.getCustomDomain() != null) {
                customDomainMappingService.deleteCustomDomainMapping(existingPage.getCustomDomain());
            } else if (page.getCustomDomain() != null && existingPage.getCustomDomain() == null) {
                validateCustomDomainNotInUse(page.getCustomDomain());
                customDomainMappingService.createCustomDomainMapping(page.getCustomDomain(), page.getId());
            }
        }
        List<String> boards = page.getBoards();
        if (CollectionUtils.isNotEmpty(boards)) {
            boards = boards.stream().filter(StringUtils::isNotBlank).distinct().toList();
        }
        if (CollectionUtils.isNotEmpty(boards)) {
            Criteria in = Criteria.where(Board.FIELD_ID).in(boards).and(Board.FIELD_ORGANIZATION_ID).is(UserContext.current().getOrgId());
            List<String> boardIds = mongoConnection.getDefaultMongoTemplate().find(new Query(in), Board.class).stream().map(Board::getId).toList();
            if (boardIds.size() != boards.size()) {
                throw new UserVisibleException("Invalid board id");
            }
        }
        page.setBoards(boards);
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

        long count = mongoConnection.getDefaultMongoTemplate().count(new Query(Criteria.where(Page.FIELD_ORGANIZATION_ID).is(UserContext.current().getOrgId())), Page.class);
        if (count > 500 && !Util.isSelfHosted()) {
            // Limit present to prevent spam
            throw new UserVisibleException("Too many pages. To increase please raise a support ticket");
        }
        return Response.ok(JacksonMapper.toJson(page)).build();
    }

    private void validateCustomDomainNotInUse(String customDomain) {
        // Verify if a custom domain exists with same name, then throw exception
        Page one = mongoConnection.getDefaultMongoTemplate().findOne(new Query(Criteria.where(Page.FIELD_CUSTOM_DOMAIN).is(customDomain)), Page.class);
        if (one != null) {
            throw new UserVisibleException("Custom domain already exists");
        }
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

    private String validateAndFix(String slug) {
        // Set slug based on the org name, all lower case and all special characters removed and spaces replaced with -
        // Also cant end with - or start with -
        // Example: "Example Org" => "example-org"
        // Example: "hello-how-do-you-do" => "hello-how-do-you-do"
        // Example: "-hello-how-do-you-do" => "hello-how-do-you-do"
        // Example: "-hello-how-do-you-do-" => "hello-how-do-you-do"
        // Limit max length to 35 characters
        slug = slug.trim().toLowerCase().replaceAll("[^a-z0-9\\s-]", "").replaceAll("[\\s-]+", "-").replaceAll("^-|-$", "");

        slug = slug.substring(0, Math.min(slug.length(), 35));
        if (RESERVED_SLUGS.contains(slug)) {
            throw new UserVisibleException("Slug is already used");
        }
        if (slug.length() < 3){
            throw new UserVisibleException("Minimum 3 letters required");
        }
        return slug;
    }
}
