package io.easystartup.suggestfeature.rest.portal.unauth;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.easystartup.suggestfeature.beans.Organization;
import io.easystartup.suggestfeature.filters.UserVisibleException;
import io.easystartup.suggestfeature.loggers.Logger;
import io.easystartup.suggestfeature.loggers.LoggerFactory;
import io.easystartup.suggestfeature.services.AuthService;
import io.easystartup.suggestfeature.services.KeyValueStore;
import io.easystartup.suggestfeature.utils.Util;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.Response;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Collections;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/*
 * @author indianBond
 */
@Path("/portal/unauth/og")
@Component
public class PublicPortalOpenGraphGenerator {

    private final AuthService authService;
    private final KeyValueStore keyValueStore;
    private static final Logger LOGGER = LoggerFactory.getLogger(PublicPortalOpenGraphGenerator.class);
    private final String SCREENSHOT_SERVICE_URL;
    private final String OG_IMAGE_BASE_URL;

    @Autowired
    public PublicPortalOpenGraphGenerator(AuthService authService, KeyValueStore keyValueStore) {
        this.authService = authService;
        this.keyValueStore = keyValueStore;
        SCREENSHOT_SERVICE_URL = Util.getEnvVariable("SCREENSHOT_SERVICE_URL", "http://localhost:9191/screenshot");
        OG_IMAGE_BASE_URL = Util.getEnvVariable("OG_IMAGE_BASE_URL", "http://localhost:8080/og-image");
    }

    @GET
    @Path("/get-blog-og-image")
    public Response getBlogOgImage(
            @Context HttpServletRequest httpServletRequest,
            @QueryParam("title") String title) {
        try {
            String encodedTitle = URLEncoder.encode(title, StandardCharsets.UTF_8);
            String ogImageUrl = String.format("%s/blog?title=%s", OG_IMAGE_BASE_URL, encodedTitle);

            ObjectMapper mapper;
            HttpResponse<String> response;
            try (HttpClient client = HttpClient.newHttpClient()) {
                mapper = new ObjectMapper();

                String jsonInputString = mapper.writeValueAsString(Map.of(
                        "url", ogImageUrl,
                        "height", "630"
                ));

                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(SCREENSHOT_SERVICE_URL))
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(jsonInputString))
                        .build();

                response = client.send(request, HttpResponse.BodyHandlers.ofString());
            }

            if (response.statusCode() != 200) {
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                        .entity("Failed to get screenshot: " + response.body())
                        .build();
            }

            JsonNode jsonNode = mapper.readTree(response.body());
            String base64Image = jsonNode.get("image").asText();

            byte[] imageBytes = Base64.getDecoder().decode(base64Image);
            return Response.ok(imageBytes)
                    .header("Content-Type", "image/png")
                    .build();
        } catch (Exception e) {
            LOGGER.error("Failed to get og-image", e);
            throw new UserVisibleException("Failed to get screenshot", e);
        }
    }

    @GET
    @Path("/get-ss")
    public Response getScreenshot(
            @Context HttpServletRequest httpServletRequest,
            @QueryParam("title") String title,
            @QueryParam("category") String category) {
        try {
            String host = httpServletRequest.getHeader("host");
            String orgIdFromHost = authService.getOrgIdFromHost(host);

            Organization org = authService.getOrgById(orgIdFromHost);
            if (org == null) {
                return Response.ok().entity(Collections.emptyList()).build();
            }

            String cacheKeyForCompany = getCacheKeyForCompany(orgIdFromHost, title + category + org.getLogo() + org.getName());
            // If any of these things change then the cache should be invalidated
            String base64EncodedString = keyValueStore.get(cacheKeyForCompany);
            if (base64EncodedString != null) {
                byte[] imageBytes = Base64.getDecoder().decode(base64EncodedString);
                return Response.ok(imageBytes)
                        .header("Content-Type", "image/png")
                        .build();
            }

            String logo = org.getLogo();
            if (StringUtils.isEmpty(logo)) {
                logo = "https://suggestfeature.com/logo-light.jpeg";
            }

            if (StringUtils.isEmpty(title)) {
                title = category;
            }

            String encodedTitle = URLEncoder.encode(title, StandardCharsets.UTF_8);
            String encodedCompany = URLEncoder.encode(org.getName(), StandardCharsets.UTF_8);
            String encodedLogo = URLEncoder.encode(logo, StandardCharsets.UTF_8);

            String ogImageUrl = String.format("%s?title=%s&company=%s&logo=%s",
                    OG_IMAGE_BASE_URL, encodedTitle, encodedCompany, encodedLogo);

            ObjectMapper mapper;
            HttpResponse<String> response;
            try (HttpClient client = HttpClient.newHttpClient()) {
                mapper = new ObjectMapper();

                String jsonInputString = mapper.writeValueAsString(Map.of(
                        "url", ogImageUrl,
                        "height", "630"
                ));

                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(SCREENSHOT_SERVICE_URL))
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(jsonInputString))
                        .build();

                response = client.send(request, HttpResponse.BodyHandlers.ofString());
            }

            if (response.statusCode() != 200) {
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                        .entity("Failed to get screenshot: " + response.body())
                        .build();
            }

            JsonNode jsonNode = mapper.readTree(response.body());
            String base64Image = jsonNode.get("image").asText();

            byte[] imageBytes = Base64.getDecoder().decode(base64Image);
            keyValueStore.save(cacheKeyForCompany, base64Image, TimeUnit.DAYS.toMillis(30));
            return Response.ok(imageBytes)
                    .header("Content-Type", "image/png")
                    .build();
        } catch (Exception e) {
            LOGGER.error("Failed to get screenshot", e);
            throw new UserVisibleException("Failed to get screenshot", e);
        }
    }

    private static String getCacheKeyForCompany(String orgId, String title) {
        return "og-company-image-" + orgId + "-" + title;
    }
}
