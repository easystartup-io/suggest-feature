package io.easystartup.suggestfeature.services.billing;


import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import io.easystartup.suggestfeature.beans.Organization;
import io.easystartup.suggestfeature.beans.SubscriptionDetails;
import io.easystartup.suggestfeature.beans.User;
import io.easystartup.suggestfeature.loggers.Logger;
import io.easystartup.suggestfeature.loggers.LoggerFactory;
import io.easystartup.suggestfeature.services.AuthService;
import io.easystartup.suggestfeature.services.db.MongoTemplateFactory;
import io.easystartup.suggestfeature.utils.Util;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.HashMap;
import java.util.Map;

/**
 * @author indianBond
 */
@Service
public class LemonSqueezyPaymentServiceImpl implements LemonSqueezyPaymentService {

    private static final Logger LOGGER = LoggerFactory.getLogger(LemonSqueezyPaymentServiceImpl.class);
    private final MongoTemplateFactory mongoConnection;
    private final AuthService authService;

    private final String API_BASE_ENDPOINT = "https://api.lemonsqueezy.com/v1/";

    @Autowired
    public LemonSqueezyPaymentServiceImpl(MongoTemplateFactory mongoConnection, AuthService authService) {
        this.mongoConnection = mongoConnection;
        this.authService = authService;
    }

    @Override
    public String checkoutLink(String plan, String orgId, String userId, String currentUrl) {
        Organization org = authService.getOrgById(orgId);
        User user = authService.getUserByUserId(userId);
        return requestCheckout(plan, org, user, currentUrl);
    }

    @Override
    public String upgradeSubscription(String plan, String orgId, String userId) {
        SubscriptionDetails existingSubscription = mongoConnection.getDefaultMongoTemplate().findOne(new Query(Criteria.where(SubscriptionDetails.FIELD_ORGANIZATION_ID).is(orgId)), SubscriptionDetails.class);
        if (existingSubscription == null) {
            throw new RuntimeException("Subscription not found for orgId: " + orgId);
        }

        upgradeSub(existingSubscription.getSubscriptionId(), plan);
        return "";
    }

    private void upgradeSub(String subscriptionId, String plan) {
        try (HttpClient client = HttpClient.newHttpClient()) {
            String variantId = getVariantId(plan);

            String jsonBody = """
                    {
                      "data": {
                        "type": "subscriptions",
                        "id": "%s",
                        "attributes": {
                          "variant_id": %s,
                          "invoice_immediately": true
                        }
                      }
                    }
                    """.formatted(subscriptionId, variantId);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(API_BASE_ENDPOINT + "subscriptions/" + subscriptionId))
                    .header("Accept", "application/vnd.api+json")
                    .header("Content-Type", "application/vnd.api+json")
                    .header("Authorization", "Bearer " + getLemonSqueezyApiToken())
                    .method("PATCH", HttpRequest.BodyPublishers.ofString(jsonBody))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                LOGGER.error("Subscription upgrade failed. Status code: " + response.statusCode() + " response: " + response.body());
                throw new RuntimeException("Subscription upgrade failed. Status code: " + response.statusCode());
            }
        } catch (IOException | InterruptedException e) {
            throw new RuntimeException("Failed to upgrade subscription", e);
        }
    }

    @Override
    public String getBillingDetailsUpdateUrl(String orgId, String userId) {
        // Fetch subscription and in its response its present
        SubscriptionDetails one = mongoConnection.getDefaultMongoTemplate().findOne(new Query(Criteria.where(SubscriptionDetails.FIELD_ORGANIZATION_ID).is(orgId)), SubscriptionDetails.class);
        String subscriptionId = one.getSubscriptionId();

        // Use subscriptionId to get billing details update url. Fetch subscription from lemonsqueezy and get the url from it
        return getBillingDetailsUpdateUrlFromLemonSqueezy(subscriptionId);
    }

    private String getBillingDetailsUpdateUrlFromLemonSqueezy(String subscriptionId) {
        try (HttpClient client = HttpClient.newHttpClient()) {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(API_BASE_ENDPOINT + "subscriptions/" + subscriptionId))
                    .header("Accept", "application/vnd.api+json")
                    .header("Content-Type", "application/vnd.api+json")
                    .header("Authorization", "Bearer " + getLemonSqueezyApiToken())
                    .GET()
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                LOGGER.error("Failed to get subscription details. Status code: " + response.statusCode() + " response: " + response.body());
                throw new RuntimeException("Failed to get subscription details. Status code: " + response.statusCode());
            }

            return getObjectMapper().readTree(response.body()).get("data").get("attributes").get("urls").get("update_payment_method").asText();
        } catch (IOException | InterruptedException e) {
            throw new RuntimeException("Failed to get billing details update url", e);
        }
    }

    @Override
    public void cancelSubscription(String orgId) {
        LOGGER.error("Subscription cancelled for orgId: " + orgId);
    }

    private String requestCheckout(String plan, Organization org, User user, String currentUrl) {
        try (HttpClient client = HttpClient.newHttpClient()) {
            Map<String, String> variables = new HashMap<>();
            variables.put("name", "Suggest Feature - Monthly");
            variables.put("orgId", org.getId());
            variables.put("orgName", org.getName());
            String name;
            if (StringUtils.isNotBlank(user.getName())) {
                name = user.getName();
            } else {
                name = Util.getNameFromEmail(user.getEmail());
            }
            variables.put("usersName", name);
            variables.put("userEmail", user.getEmail());

            // from current url replace query params with empty string
            currentUrl = currentUrl.split("\\?")[0];

            variables.put("redirectUrl", currentUrl + "?status=success");
            variables.put("userId", user.getId());
            variables.put("storeId", getStoreId());
            variables.put("variantId", getVariantId(plan));

            String jsonTemplate = """
                    {
                      "data": {
                        "type": "checkouts",
                        "attributes": {
                          "product_options": {
                            "name": "${name}",
                            "description": "Subscription for ${orgName}",
                            "redirect_url": "${redirectUrl}"
                          },
                          "checkout_data": {
                            "custom": {
                              "orgId": "${orgId}",
                              "userId": "${userId}"
                            },
                            "email": "${userEmail}",
                            "name": "${usersName}"
                          }
                        },
                        "relationships": {
                          "store": {
                            "data": {
                              "type": "stores",
                              "id": "${storeId}"
                            }
                          },
                          "variant": {
                            "data": {
                              "type": "variants",
                              "id": "${variantId}"
                            }
                          }
                        }
                      }
                    }
                    """;

            String jsonBody = replaceVariables(jsonTemplate, variables);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(API_BASE_ENDPOINT + "checkouts"))
                    .header("Accept", "application/vnd.api+json")
                    .header("Content-Type", "application/vnd.api+json")
                    .header("Authorization", "Bearer " + getLemonSqueezyApiToken())
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 201) {
                LOGGER.error("Checkout creation failed. Status code: " + response.statusCode() + " response: " + response.body());
                throw new RuntimeException("Checkout creation failed. Status code: " + response.statusCode());
            }

            return getObjectMapper().readTree(response.body()).get("data").get("attributes").get("url").asText();
        } catch (IOException | InterruptedException e) {
            throw new RuntimeException("Failed to create checkout", e);
        }
    }

    private String getVariantId(String plan) {
        SubscriptionDetails.Plan value = SubscriptionDetails.Plan.valueOf(plan);
        switch (value) {
            case basic:
                if (Util.isProdEnv()) {
                    return "504172";
                }
                return "504167";
            case pro:
                if (Util.isProdEnv()) {
                    return "504173";
                }
                return "504168";
            case team:
                if (Util.isProdEnv()) {
                    return "504174";
                }
                return "504169";
            default:
                throw new RuntimeException("Invalid plan");
        }
    }

    private String replaceVariables(String template, Map<String, String> variables) {
        String result = template;
        for (Map.Entry<String, String> entry : variables.entrySet()) {
            result = result.replace("${" + entry.getKey() + "}", entry.getValue());
        }
        return result;
    }

    private String getLemonSqueezyApiToken() {
        return Util.getEnvVariable("LEMONSQUEEZY_API_TOKEN", "");
    }

    private static ObjectMapper getObjectMapper() {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        return objectMapper;
    }

    private String getStoreId() {
        return Util.getEnvVariable("LEMONSQUEEZY_STORE_ID", "79422");
    }

}
