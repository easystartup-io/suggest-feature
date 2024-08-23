package io.easystartup.suggestfeature.rest.admin;

import io.easystartup.suggestfeature.beans.Board;
import io.easystartup.suggestfeature.beans.Organization;
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
import org.apache.commons.validator.routines.DomainValidator;
import org.apache.commons.validator.routines.UrlValidator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Component;

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
            "localhost",
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
            "images", "css", "js", "fonts", "widget", "component", "module", "iframe", "fuck", "mofo", "fuck-it", "sign-in", "log-in", "cards", "credit-card", "payment", "payments", "fuck-off", "test", "cool", "fuckoff", "fuckit"
    );

    @Autowired
    public PagesRestApi(MongoTemplateFactory mongoConnection, AuthService authService, ValidationService validationService, CustomDomainMappingService customDomainMappingService) {
        this.mongoConnection = mongoConnection;
        this.authService = authService;
        this.validationService = validationService;
        this.customDomainMappingService = customDomainMappingService;
    }

    @POST
    @Path("/edit-org")
    @Consumes("application/json")
    @Produces("application/json")
    public Response editOrg(Organization organization) {
        String userId = UserContext.current().getUserId();
        validationService.validate(organization);
        organization.setId(UserContext.current().getOrgId());
        organization.setSlug(validateAndFix(organization.getSlug()));
        Organization existingOrg = authService.getOrgById(organization.getId());
        if (organization.getCustomDomain() != null && !organization.getCustomDomain().equals(existingOrg.getCustomDomain())) {
            validateCustomDomainNotInUse(organization.getCustomDomain());
            customDomainMappingService.updateCustomDomainMapping(organization.getCustomDomain(), organization.getId());
        } else if (organization.getCustomDomain() == null && existingOrg.getCustomDomain() != null) {
            customDomainMappingService.deleteCustomDomainMapping(existingOrg.getCustomDomain());
        } else if (organization.getCustomDomain() != null && existingOrg.getCustomDomain() == null) {
            validateCustomDomainNotInUse(organization.getCustomDomain());
            customDomainMappingService.createCustomDomainMapping(organization.getCustomDomain(), organization.getId());
        }
        existingOrg.setName(organization.getName().trim());
        existingOrg.setSlug(organization.getSlug().trim());
        if (StringUtils.isNotBlank(organization.getCustomDomain()) && (organization.getCustomDomain().endsWith(".suggestfeature.com") || organization.getCustomDomain().equals("suggestfeature.com") )) {
            throw new UserVisibleException("Custom domain cannot end with suggestfeature.com");
        }
        // Validate the domain name and ensure it doesnot start with https or have a path and allow localhost and suggestfeature.com
        if (StringUtils.isNotBlank(organization.getCustomDomain()) && !DomainValidator.getInstance(true).isValid(organization.getCustomDomain())) {
            throw new UserVisibleException("Invalid domain name. It should be of this format subdomain.yourdomain.com");
        }
        if (StringUtils.isNotBlank(organization.getCustomDomain())) {
            existingOrg.setCustomDomain(organization.getCustomDomain().trim());
        }
        try {
            mongoConnection.getDefaultMongoTemplate().save(existingOrg);
        } catch (DuplicateKeyException e) {
            throw new UserVisibleException("Page with this slug already exists");
        }

        return Response.ok(JacksonMapper.toJson(existingOrg)).build();
    }

    private void validateCustomDomainNotInUse(String customDomain) {
        // Verify if a custom domain exists with same name, then throw exception
        Organization one = mongoConnection.getDefaultMongoTemplate().findOne(new Query(Criteria.where(Organization.FIELD_CUSTOM_DOMAIN).is(customDomain)), Organization.class);
        if (one != null) {
            throw new UserVisibleException("Custom domain already exists");
        }
    }

    @GET
    @Path("/fetch-org")
    @Consumes("application/json")
    @Produces("application/json")
    public Response fetchOrg() {
        String userId = UserContext.current().getUserId();
        String orgId = UserContext.current().getOrgId();
        Organization org = authService.getOrgById(orgId);
        return Response.ok(JacksonMapper.toJson(org)).build();
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
        if (RESERVED_SLUGS.contains(slug) && !Util.isSelfHosted()) {
            throw new UserVisibleException("Slug is already used");
        }
        if (slug.length() < 3) {
            throw new UserVisibleException("Minimum 3 letters required");
        }
        return slug;
    }
}
