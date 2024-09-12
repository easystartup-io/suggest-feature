package io.easystartup.suggestfeature.services;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.easystartup.suggestfeature.filters.UserVisibleException;
import io.easystartup.suggestfeature.loggers.Logger;
import io.easystartup.suggestfeature.loggers.LoggerFactory;
import io.easystartup.suggestfeature.utils.Util;
import jakarta.ws.rs.core.UriBuilder;
import org.springframework.stereotype.Service;
import org.xbill.DNS.Address;
import org.xbill.DNS.CNAMERecord;
import org.xbill.DNS.Lookup;
import org.xbill.DNS.Type;

import java.io.IOException;
import java.net.InetAddress;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

/**
 * @author indianBond
 */
@Service
public class CustomDomainMappingService {

    private static final Logger LOGGER = LoggerFactory.getLogger(CustomDomainMappingService.class);

    public void createCustomDomainMapping(String customDomain, String orgId) {
        if (Util.isSelfHosted()) {
            return; // Skip domain deletion if self hosted
        }

        // Ignore if local testing with cloudflare tunnels. Don't want to go and create custom domain mappings
        if (!Util.isProdEnv() && customDomain.endsWith(".easystartup.io")){
            return;
        }

        // Validate by checking cname mapping is done to cname.suggestfeature.com
        if (!verifyCustomDomainMapping(customDomain)) {
            throw new UserVisibleException("DNS verification failed for %s. Please add here after your cname mapping is done. It can take some time for DNS to propagate".formatted(customDomain));
        }

        if (customDomain.contains("*")) {
            throw new UserVisibleException("Wildcard domains are not supported");
        }

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.cloudflare.com/client/v4/zones/%s/custom_hostnames".formatted(getCloudflareZoneId())))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + getCloudflareAuthKey())
                .method("POST", HttpRequest.BodyPublishers.ofString(getCloudflareRequestBody(customDomain)))
                .build();
        HttpResponse<String> response = null;
        try (HttpClient httpClient = HttpClient.newHttpClient()) {
            response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        } catch (IOException | InterruptedException e) {
            throw new RuntimeException(e);
        }
        LOGGER.error(response.body());
    }

    private String getCloudflareRequestBody(String customDomain) {
        return """
                {
                  "hostname": "%s",
                  "ssl": {
                    "method": "http",
                    "bundle_method": "ubiquitous",
                    "settings": {
                      "http2": "on",
                      "min_tls_version": "1.2",
                      "tls_1_3": "on"
                    },
                    "type": "dv",
                    "wildcard": false
                  }
                }
                """.formatted(customDomain);
    }

    public void deleteCustomDomainMapping(String customDomain) {
        if (Util.isSelfHosted()) {
            return; // Skip domain deletion if self hosted
        }

        String customHostnameId = getCustomHostnameId(customDomain);

        if (customHostnameId == null) {
            return;
        }

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.cloudflare.com/client/v4/zones/%s/custom_hostnames/%s".formatted(getCloudflareZoneId(), customHostnameId)))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + getCloudflareAuthKey())
                .method("DELETE", HttpRequest.BodyPublishers.noBody())
                .build();
        HttpResponse<String> response;
        try (HttpClient httpClient = HttpClient.newHttpClient()) {
            response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        } catch (IOException | InterruptedException e) {
            throw new RuntimeException(e);
        }
        LOGGER.error(response.body());
    }


    public boolean verifyCustomDomainMapping(String customDomain) {
        if (Util.getEnvVariable("SKIP_DOMAIN_VERIFICATION", "false").equalsIgnoreCase("true")) {
            return true; // Skip domain verification if explicitly disabled
        }
        // Do a DNS lookup to verify the domain, that it is pointed properly to cname.suggestfeature.com. Either cname or alias
        return verifyDomainMapping(customDomain, "cname.suggestfeature.com");
    }

    public static boolean verifyDomainMapping(String customDomain, String expectedDomain) {
        if (Util.isSelfHosted()) {
            return true; // Skip domain verification if self hosted
        }
        if (customDomain == null || expectedDomain == null) {
            return false;
        }
        try {
            // Lookup CNAME record for the custom domain
            Lookup lookup = new Lookup(customDomain, Type.CNAME);
            lookup.run();

            if (lookup.getResult() == Lookup.SUCCESSFUL) {
                for (org.xbill.DNS.Record record : lookup.getAnswers()) {
                    CNAMERecord cnameRecord = (CNAMERecord) record;
                    String cnameTarget = cnameRecord.getTarget().toString(true);
                    if (cnameTarget.equalsIgnoreCase(expectedDomain + ".")) {
                        return true; // CNAME points directly to the expected domain
                    }
                }
            }

            // If no CNAME, compare IP addresses of custom domain and expected domain
            InetAddress[] customDomainIps = Address.getAllByName(customDomain);
            InetAddress[] expectedDomainIps = Address.getAllByName(expectedDomain);

            for (InetAddress customIp : customDomainIps) {
                for (InetAddress expectedIp : expectedDomainIps) {
                    if (customIp.equals(expectedIp)) {
                        return true; // Domain resolves to the same IP as expected domain
                    }
                }
            }

        } catch (Exception e) {
            LOGGER.error("Error verifying domain mapping for " + customDomain , e);
        }
        return false; // Domain does not resolve to the expected domain or errors
    }

    private String getCloudflareZoneId() {
        return Util.getEnvVariable("CLOUDFLARE_ZONE_ID", "");
    }

    private String getCloudflareAuthKey() {
        return Util.getEnvVariable("CLOUDFLARE_AUTH_KEY", "");
    }

    private String getCustomHostnameId(String customDomain) {
        String customHostnameId = null;
        {
            URI uri = UriBuilder.fromUri("https://api.cloudflare.com/client/v4/zones/%s/custom_hostnames".formatted(getCloudflareZoneId())).queryParam("hostname", customDomain).build();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(uri)
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + getCloudflareAuthKey())
                    .method("GET", HttpRequest.BodyPublishers.noBody())
                    .build();

            HttpResponse<String> response = null;
            try (HttpClient httpClient = HttpClient.newHttpClient()) {
                response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
                // Parse the JSON response to fetch customhostnameid
                customHostnameId = getCustomHostnameId(response.body(), customHostnameId);
            } catch (IOException | InterruptedException e) {
                throw new RuntimeException(e);
            }
            LOGGER.error(response.body());
        }
        return customHostnameId;
    }

    private String getCustomHostnameId(String response, String customHostnameId) {
        ObjectMapper objectMapper = new ObjectMapper();
        try {
            JsonNode rootNode = objectMapper.readTree(response);
            JsonNode resultNode = rootNode.path("result").get(0);
            if (resultNode != null) {
                customHostnameId = resultNode.path("id").asText();
            }
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Error parsing JSON response", e);
        }
        return customHostnameId;
    }
}
