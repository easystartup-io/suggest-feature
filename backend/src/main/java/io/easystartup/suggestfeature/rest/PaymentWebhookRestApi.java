package io.easystartup.suggestfeature.rest;


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
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/*
 * @author indianBond
 */
@Path("/payment")
@Component
public class PaymentWebhookRestApi {

    private static final Logger LOGGER = LoggerFactory.getLogger(PaymentWebhookRestApi.class);
    private final MongoTemplateFactory mongoConnection;
    private final BillingService billingService;
    private final AuthService authService;

    @Autowired
    public PaymentWebhookRestApi(MongoTemplateFactory mongoConnection, BillingService billingService, AuthService authService) {
        this.mongoConnection = mongoConnection;
        this.billingService = billingService;
        this.authService = authService;
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

        return Response.ok().build();
    }

    private LocalDateTime parseDate(String dateString) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSSSSS'Z'");
        return LocalDateTime.parse(dateString, formatter);
    }

    private boolean validateWebhookAndGetEventAndObject(String payload, String signature) {
        String webhookSecret = Util.getEnvVariable("LEMON_SQUEEZY_API_WEBHOOK_SECRET", "");
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
}