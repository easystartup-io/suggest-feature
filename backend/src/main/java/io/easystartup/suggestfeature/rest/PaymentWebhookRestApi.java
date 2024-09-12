package io.easystartup.suggestfeature.rest;


import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import io.easystartup.suggestfeature.beans.SubscriptionDetails;
import io.easystartup.suggestfeature.filters.UserVisibleException;
import io.easystartup.suggestfeature.loggers.Logger;
import io.easystartup.suggestfeature.loggers.LoggerFactory;
import io.easystartup.suggestfeature.services.AuthService;
import io.easystartup.suggestfeature.services.billing.BillingService;
import io.easystartup.suggestfeature.services.db.MongoTemplateFactory;
import io.easystartup.suggestfeature.utils.Util;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.Response;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.concurrent.TimeUnit;

/**
 * @author indianBond
 */
@Path("/payment")
@Component
public class PaymentWebhookRestApi {

    private static final Logger LOGGER = LoggerFactory.getLogger(PaymentWebhookRestApi.class);
    private final MongoTemplateFactory mongoConnection;
    private final BillingService billingService;

    @Autowired
    public PaymentWebhookRestApi(MongoTemplateFactory mongoConnection, BillingService billingService) {
        this.mongoConnection = mongoConnection;
        this.billingService = billingService;
    }

    @POST
    @Path("/lemonsqueezy/webhook")
    @Produces("application/json")
    @Consumes("application/json")
    public Response lemonsqueezyWebhook(String payload, @Context HttpServletRequest httpServletRequest) {
        String sigHeader = httpServletRequest.getHeader("X-Signature");
        String eventName = httpServletRequest.getHeader("X-Event-Name");
        boolean validated = validateWebhookAndGetEventAndObject(payload, sigHeader);
        if (!validated) {
            LOGGER.error("Invalid webhook received " + payload + " with signature " + sigHeader + " and event name " + eventName);
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }
        LOGGER.error("Webhook received " + payload + " with signature " + sigHeader + " and event name " + eventName);
        try {
            JsonNode jsonNode = getObjectMapper().readTree(payload);
            JsonNode metaNode = jsonNode.get("meta");
            JsonNode dataNode = jsonNode.get("data");
            String eventNameFromPayload = metaNode.get("event_name").asText();
            if (!eventName.equals(eventNameFromPayload)) {
                LOGGER.error("Event name mismatch " + eventName + " and " + eventNameFromPayload);
                throw new UserVisibleException("Event name mismatch " + eventName, Response.Status.BAD_REQUEST);
            }
            JsonNode metadataNode = metaNode.get("custom_data");
            if (metadataNode != null){
            }

            if ("subscription_created".equals(eventName) || "subscription_updated".equals(eventName)) {
                String orgId = metadataNode.get("orgId").asText();
                String userId = metadataNode.get("userId").asText();
                String subscriptionId = dataNode.get("id").asText();
                JsonNode dataAttributes = dataNode.get("attributes");
                String plan = dataAttributes.get("variant_name").asText().toLowerCase(Locale.ROOT);
                LocalDateTime nextBillingDate = parseDate(dataAttributes.get("renews_at").asText());
                long epochSecond = nextBillingDate.toEpochSecond(ZoneOffset.UTC);
                mongoConnection.getDefaultMongoTemplate().findAndModify(
                        Query.query(Criteria.where(SubscriptionDetails.FIELD_ORGANIZATION_ID).is(orgId)),
                        new Update().set(SubscriptionDetails.FIELD_SUBSCRIPTION_STATUS, SubscriptionDetails.Status.active.name())
                                .set(SubscriptionDetails.FIELD_SUBSCRIPTION_ID, subscriptionId)
                                .set(SubscriptionDetails.FIELD_SUBSCRIPTION_PLAN, SubscriptionDetails.Plan.valueOf(plan))
                                .set(SubscriptionDetails.FIELD_BILLING_INTERVAL, SubscriptionDetails.BillingInterval.monthly)
                                .set(SubscriptionDetails.FIELD_USER_ID, userId)
                                .set(SubscriptionDetails.FIELD_PRICE, userId)
                                .set(SubscriptionDetails.FIELD_CARD_BRAND, dataAttributes.get("card_brand").asText())
                                .set(SubscriptionDetails.FIELD_CARD_LAST_FOUR, dataAttributes.get("card_last_four").asText())
                                .set(SubscriptionDetails.FIELD_EMAIL, dataAttributes.get("user_email").asText())
                                .set(SubscriptionDetails.FIELD_NEXT_BILLING_DATE, epochSecond*1000)
                                .set(SubscriptionDetails.FIELD_TRIAL, false)
                                ,
                        SubscriptionDetails.class);
            } else if ("subscription_cancelled".equals(eventName)) {
                String orgId = metadataNode.get("orgId").asText();
                billingService.cancelSubscription(orgId);
            }

        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }

        return Response.ok().build();
    }

    private LocalDateTime parseDate(String dateString) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSSSSS'Z'");
        return LocalDateTime.parse(dateString, formatter);
    }

    private boolean validateWebhookAndGetEventAndObject(String payload, String signature) {
        String webhookSecret = Util.getEnvVariable("LEMONSQUEEZY_WEBHOOK_SIGNING_SECRET", "");
        String hash = hmacSha256(payload, webhookSecret);
        if (!hash.equals(signature)) {
            return false;
        }
        return true;
    }


    private String hmacSha256(String data, String key) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKeySpec);
            byte[] hashBytes = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return bytesToHex(hashBytes);
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            throw new RuntimeException("Failed to calculate HMAC SHA-256", e);
        }
    }

    private static String bytesToHex(byte[] bytes) {
        StringBuilder hexString = new StringBuilder();
        for (byte b : bytes) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) {
                hexString.append('0');
            }
            hexString.append(hex);
        }
        return hexString.toString();
    }

    private static ObjectMapper getObjectMapper() {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        return objectMapper;
    }
}