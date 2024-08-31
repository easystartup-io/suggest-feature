package io.easystartup.suggestfeature.rest.admin;

import io.easystartup.suggestfeature.beans.Member;
import io.easystartup.suggestfeature.beans.SubscriptionDetails;
import io.easystartup.suggestfeature.dto.CheckoutRequestDTO;
import io.easystartup.suggestfeature.filters.UserContext;
import io.easystartup.suggestfeature.filters.UserVisibleException;
import io.easystartup.suggestfeature.services.billing.BillingService;
import io.easystartup.suggestfeature.services.db.MongoTemplateFactory;
import io.easystartup.suggestfeature.utils.JacksonMapper;
import io.easystartup.suggestfeature.utils.Util;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/*
 * @author indianBond
 */

@Path("/auth/billing")
@Component
public class BillingRestApi {

    private final MongoTemplateFactory mongoConnection;
    private final BillingService billingService;

    @Autowired
    public BillingRestApi(MongoTemplateFactory mongoConnection, BillingService billingService) {
        this.mongoConnection = mongoConnection;
        this.billingService = billingService;
    }

    @GET
    @Path("/get-subscription-details")
    @Produces("application/json")
    public Response getSubscriptionDetails() {
        if (Util.isSelfHosted()){
            SubscriptionDetails subscriptionDetails = new SubscriptionDetails();
            subscriptionDetails.setOrganizationId(UserContext.current().getOrgId());
            subscriptionDetails.setSubscriptionStatus(SubscriptionDetails.Status.active.name());
            subscriptionDetails.setSubscriptionPlan(SubscriptionDetails.Plan.self_hosted.name());
            return Response.ok(JacksonMapper.toJson(subscriptionDetails)).build();
        }
        UserContext userContext = UserContext.current();
        if (userContext.getOrgId() == null) {
            throw new UserVisibleException("Organization id is not valid");
        }
        if (userContext.getRole() != Member.Role.ADMIN) {
            throw new UserVisibleException("Only admin can access this resource", Response.Status.FORBIDDEN);
        }
        Criteria criteria = Criteria.where(SubscriptionDetails.FIELD_ORGANIZATION_ID).is(userContext.getOrgId());
        SubscriptionDetails subscriptionDetails = mongoConnection.getDefaultMongoTemplate().findOne(new Query(criteria), SubscriptionDetails.class);
        if (subscriptionDetails == null) {
            SubscriptionDetails newSubscriptionDetails = new SubscriptionDetails();
            newSubscriptionDetails.setOrganizationId(userContext.getOrgId());
            newSubscriptionDetails.setSubscriptionStatus("active");
            newSubscriptionDetails.setTrial(true);
            newSubscriptionDetails.setSubscriptionPlan(SubscriptionDetails.Plan.basic.name());
            newSubscriptionDetails.setTrialEndDate(System.currentTimeMillis() + TimeUnit.DAYS.toMillis(7));
            mongoConnection.getDefaultMongoTemplate().insert(newSubscriptionDetails);
            subscriptionDetails = newSubscriptionDetails;
        }
        return Response.ok(JacksonMapper.toJson(subscriptionDetails)).build();
    }

    @POST
    @Path("/get-checkout-link")
    @Produces("application/json")
    @Consumes("application/json")
    public Response getCheckoutLink(CheckoutRequestDTO checkoutRequestDTO) {
        if (Util.isSelfHosted()){
            return Response.ok().build();
        }
        if (StringUtils.isBlank(checkoutRequestDTO.getPlan())){
            throw new UserVisibleException("Plan is required");
        }
        checkoutRequestDTO.setPlan(checkoutRequestDTO.getPlan().toLowerCase().trim());
        UserContext userContext = UserContext.current();
        if (userContext.getOrgId() == null) {
            throw new UserVisibleException("Organization id is not valid");
        }
        if (userContext.getRole() != Member.Role.ADMIN) {
            throw new UserVisibleException("Only admin can access this resource", Response.Status.FORBIDDEN);
        }
        Criteria criteriaDefinition = Criteria.where(SubscriptionDetails.FIELD_ORGANIZATION_ID).is(userContext.getOrgId());
        SubscriptionDetails existingSubscriptionDetails =
                mongoConnection.getDefaultMongoTemplate().findOne(new Query(criteriaDefinition), SubscriptionDetails.class);
        if (existingSubscriptionDetails != null && !existingSubscriptionDetails.isTrial() && !existingSubscriptionDetails.getSubscriptionStatus().equals(SubscriptionDetails.Status.inactive.name())) {
            throw new UserVisibleException("Subscription already active");
        }

        String url = billingService.checkoutLink(checkoutRequestDTO.getPlan(), userContext.getOrgId(), userContext.getUserId(), checkoutRequestDTO.getCurrentUrl());
        Map<String, String> response = new HashMap<>();
        response.put("url", url);
        return Response.ok(JacksonMapper.toJson(response)).build();
    }


    @POST
    @Path("/upgrade-subscription")
    @Produces("application/json")
    @Consumes("application/json")
    public Response upgradeSubscription(CheckoutRequestDTO checkoutRequestDTO) {
        if (Util.isSelfHosted()) {
            return Response.ok().build();
        }
        if (StringUtils.isBlank(checkoutRequestDTO.getPlan())) {
            throw new UserVisibleException("Plan is required");
        }
        checkoutRequestDTO.setPlan(checkoutRequestDTO.getPlan().toLowerCase().trim());
        UserContext userContext = UserContext.current();
        if (userContext.getOrgId() == null) {
            throw new UserVisibleException("Organization id is not valid");
        }
        if (userContext.getRole() != Member.Role.ADMIN) {
            throw new UserVisibleException("Only admin can access this resource", Response.Status.FORBIDDEN);
        }
        Criteria criteriaDefinition = Criteria.where(SubscriptionDetails.FIELD_ORGANIZATION_ID).is(userContext.getOrgId());
        SubscriptionDetails existingSubscriptionDetails =
                mongoConnection.getDefaultMongoTemplate().findOne(new Query(criteriaDefinition), SubscriptionDetails.class);
        if (existingSubscriptionDetails == null) {
            throw new UserVisibleException("No subscription found for this organization");
        }
        if (existingSubscriptionDetails.getSubscriptionPlan().equals(checkoutRequestDTO.getPlan())) {
            throw new UserVisibleException("Already subscribed to this plan");
        }
        // Do not allow downgrading the plan without contacting support, need to check how to handle this properly, since existing might be higher than the new plan

        // Compare based on enum SubscriptionDetails.Plan
        String currentSubscriptionPlan = existingSubscriptionDetails.getSubscriptionPlan();
        String newPlan = checkoutRequestDTO.getPlan();
        if (SubscriptionDetails.Plan.valueOf(currentSubscriptionPlan).ordinal() > SubscriptionDetails.Plan.valueOf(newPlan).ordinal()) {
            throw new UserVisibleException("Contact support to downgrade the plan", Response.Status.BAD_REQUEST);
        }

        billingService.upgradeSubcription(checkoutRequestDTO.getPlan(), userContext.getOrgId(), userContext.getUserId());
        existingSubscriptionDetails.setSubscriptionPlan(checkoutRequestDTO.getPlan());
        return Response.ok(JacksonMapper.toJson(existingSubscriptionDetails)).build();
    }


    @POST
    @Path("/update-payment-details")
    @Produces("application/json")
    @Consumes("application/json")
    public Response updatePaymentDetails(String payload) {
        if (Util.isSelfHosted()) {
            return Response.ok().build();
        }
        UserContext userContext = UserContext.current();
        if (userContext.getOrgId() == null) {
            throw new UserVisibleException("Organization id is not valid");
        }
        if (userContext.getRole() != Member.Role.ADMIN) {
            throw new UserVisibleException("Only admin can access this resource", Response.Status.FORBIDDEN);
        }
        Criteria criteriaDefinition = Criteria.where(SubscriptionDetails.FIELD_ORGANIZATION_ID).is(userContext.getOrgId());
        SubscriptionDetails existingSubscriptionDetails =
                mongoConnection.getDefaultMongoTemplate().findOne(new Query(criteriaDefinition), SubscriptionDetails.class);
        if (existingSubscriptionDetails == null) {
            throw new UserVisibleException("No subscription found for this organization");
        }
        String billingDetailsUpdateUrl = billingService.getBillingDetailsUpdateUrl(userContext.getOrgId(), userContext.getUserId());
        Map<String, String> response = new HashMap<>();
        response.put("url", billingDetailsUpdateUrl);
        return Response.ok(JacksonMapper.toJson(response)).build();
    }

    @POST
    @Path("/cancel-subscription")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public Response cancelSubscription() {
        if (Util.isSelfHosted()){
            SubscriptionDetails subscriptionDetails = new SubscriptionDetails();
            subscriptionDetails.setOrganizationId(UserContext.current().getOrgId());
            subscriptionDetails.setSubscriptionStatus(SubscriptionDetails.Status.active.name());
            subscriptionDetails.setSubscriptionPlan(SubscriptionDetails.Plan.self_hosted.name());
            return Response.ok(JacksonMapper.toJson(subscriptionDetails)).build();
        }
        UserContext userContext = UserContext.current();
        if (userContext.getOrgId() == null) {
            throw new UserVisibleException("Organization id is not valid");
        }
        if (userContext.getRole() != Member.Role.ADMIN) {
            throw new UserVisibleException("Only admin can make changes to this", Response.Status.FORBIDDEN);
        }
        return Response.ok("{}").build();
    }
}
