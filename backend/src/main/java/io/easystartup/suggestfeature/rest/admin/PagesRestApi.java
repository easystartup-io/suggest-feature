package io.easystartup.suggestfeature.rest.admin;

import io.easystartup.suggestfeature.beans.Organization;
import io.easystartup.suggestfeature.filters.UserContext;
import io.easystartup.suggestfeature.filters.UserVisibleException;
import io.easystartup.suggestfeature.services.AuthService;
import io.easystartup.suggestfeature.services.CustomDomainMappingService;
import io.easystartup.suggestfeature.services.SubscriptionService;
import io.easystartup.suggestfeature.services.ValidationService;
import io.easystartup.suggestfeature.services.db.MongoTemplateFactory;
import io.easystartup.suggestfeature.utils.JacksonMapper;
import io.easystartup.suggestfeature.utils.Util;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Response;
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.validator.routines.DomainValidator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;

import java.util.Set;

/*
 * @author indianBond
 */
@Path("/auth/pages")
@Component
public class PagesRestApi {

    private final MongoTemplateFactory mongoConnection;
    private final AuthService authService;
    private final SubscriptionService subscriptionService;
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
    public PagesRestApi(MongoTemplateFactory mongoConnection, AuthService authService, SubscriptionService subscriptionService, ValidationService validationService, CustomDomainMappingService customDomainMappingService) {
        this.mongoConnection = mongoConnection;
        this.authService = authService;
        this.subscriptionService = subscriptionService;
        this.validationService = validationService;
        this.customDomainMappingService = customDomainMappingService;
    }


    @POST
    @Path("/edit-roadmap")
    @Consumes("application/json")
    @Produces("application/json")
    public Response editRoadmap(Organization organization) {
        String userId = UserContext.current().getUserId();
        if (organization.getRoadmapSettings() == null){
            throw new UserVisibleException("Invalid settings");
        }
        organization.setId(UserContext.current().getOrgId());
        organization.setSlug(validateAndFix(organization.getSlug()));
        Organization existingOrg = authService.getOrgById(organization.getId());
        existingOrg.setRoadmapSettings(organization.getRoadmapSettings());
        Organization andModify = mongoConnection.getDefaultMongoTemplate().findAndModify(new Query(Criteria.where(Organization.FIELD_ID).is(organization.getId())), new Update().set(Organization.FIELD_ROADMAP_SETTINGS, organization.getRoadmapSettings()), FindAndModifyOptions.options().returnNew(true), Organization.class);
        return Response.ok(JacksonMapper.toJson(andModify)).build();
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

        if (subscriptionService.isTrial(organization.getId()) || !subscriptionService.hasValidSubscription(organization.getId())) {
            // If subscription is valid, then only allow custom domain
            throwExceptionIfTrialOrNotValidSubscription(organization);
        }

        if (StringUtils.isNotBlank(organization.getCustomDomain()) && StringUtils.isNotBlank(existingOrg.getCustomDomain()) && !organization.getCustomDomain().equals(existingOrg.getCustomDomain())) {
            validateCustomDomainNotInUse(organization.getCustomDomain());
            // Updating custom domain mapping
            customDomainMappingService.createCustomDomainMapping(organization.getCustomDomain(), organization.getId());
            customDomainMappingService.deleteCustomDomainMapping(existingOrg.getCustomDomain());
        } else if (StringUtils.isBlank(organization.getCustomDomain()) && existingOrg.getCustomDomain() != null) {
            customDomainMappingService.deleteCustomDomainMapping(existingOrg.getCustomDomain());
            existingOrg.setCustomDomain(null);
        } else if (StringUtils.isNotBlank(organization.getCustomDomain()) && existingOrg.getCustomDomain() == null) {
            validateCustomDomainNotInUse(organization.getCustomDomain());
            customDomainMappingService.createCustomDomainMapping(organization.getCustomDomain(), organization.getId());
        }
        existingOrg.setName(organization.getName().trim());
        existingOrg.setSlug(organization.getSlug().trim());
        if (StringUtils.isNotBlank(organization.getCustomDomain()) && (organization.getCustomDomain().endsWith(".suggestfeature.com") || organization.getCustomDomain().equals("suggestfeature.com") )) {
            throw new UserVisibleException("Custom domain cannot end with suggestfeature.com");
        }
        // Validate the domain name and ensure it doesnot start with https or have a path and allow localhost and suggestfeature.com
        if (StringUtils.isNotBlank(organization.getCustomDomain()) && !Util.getEnvVariable("SKIP_DOMAIN_VERIFICATION", "false").equalsIgnoreCase("true") && !DomainValidator.getInstance(true).isValid(organization.getCustomDomain())) {
            throw new UserVisibleException("Invalid domain name. It should be of this format subdomain.yourdomain.com");
        }
        if (StringUtils.isNotBlank(organization.getCustomDomain())) {
            existingOrg.setCustomDomain(organization.getCustomDomain().trim());
        } else {
            existingOrg.setCustomDomain(null);
        }
        try {
            mongoConnection.getDefaultMongoTemplate().save(existingOrg);
        } catch (DuplicateKeyException e) {
            throw new UserVisibleException("Page with this slug already exists");
        }

        return Response.ok(JacksonMapper.toJson(existingOrg)).build();
    }

    private void throwExceptionIfTrialOrNotValidSubscription(Organization organization) {
        boolean customDomainIsBlank = StringUtils.isBlank(organization.getCustomDomain());
        if (customDomainIsBlank) {
            return;
        }
        if (subscriptionService.isTrial(organization.getId())) {
            throw new UserVisibleException("Custom domain is not available during trial");
        } else if (!subscriptionService.hasValidSubscription(organization.getId())) {
            throw new UserVisibleException("Custom domain can not be set for inactive subscription");
        }
    }

    private void validateCustomDomainNotInUse(String customDomain) {
        // Verify if a custom domain exists with same name, then throw exception
        Organization one = mongoConnection.getDefaultMongoTemplate().findOne(new Query(Criteria.where(Organization.FIELD_CUSTOM_DOMAIN).is(customDomain)), Organization.class);
        if (one != null) {
            throw new UserVisibleException("Custom domain is already in use");
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

    public static String validateAndFix(String slug) {
        slug = Util.fixSlug(slug);

        if (RESERVED_SLUGS.contains(slug) && !Util.isSelfHosted()) {
            throw new UserVisibleException("Slug is already used");
        }
        if (slug.length() < 3) {
            throw new UserVisibleException("Minimum 3 letters required");
        }
        return slug;
    }
}
