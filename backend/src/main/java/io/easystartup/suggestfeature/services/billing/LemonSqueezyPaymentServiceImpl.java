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
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.HashMap;
import java.util.Map;

/*
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
    public String checkoutLink(String plan, String orgId, String userId) {
        Organization org = authService.getOrgById(orgId);
        User user = authService.getUserByUserId(userId);
        return requestCheckout(plan, org, user);
    }

    @Override
    public void cancelSubscription(String orgId) {
        System.out.println("Subscription cancelled for orgId: " + orgId);
    }

    private String requestCheckout(String plan, Organization org, User user) {
        try (HttpClient client = HttpClient.newHttpClient()) {
            Map<String, String> variables = new HashMap<>();
            variables.put("name", "Suggest Feature - Monthly");
            variables.put("orgId", org.getId());
            variables.put("orgName", org.getName());
            variables.put("usersName", user.getName());
            variables.put("userEmail", user.getEmail());
            variables.put("redirectUrl", "https://app.suggestfeature.com/" + org.getSlug() + "/billing?state=success");
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
                              "organization_id": "${orgId}",
                              "user_id": "${userId}"
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
