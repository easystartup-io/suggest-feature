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
import org.apache.commons.io.FileUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.InputStream;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;
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
    @Path("/get-ss")
    public Response getScreenshot(
            @Context HttpServletRequest httpServletRequest,
            @QueryParam("title") String title,
            @QueryParam("category") String category) {
        File tempFile = null;
        try {
            String host = httpServletRequest.getHeader("host");
            String orgIdFromHost = authService.getOrgIdFromHost(host);

            String cacheKeyForCompany = getCacheKeyForCompany(orgIdFromHost, title + category);
            String finalUrl = keyValueStore.get(cacheKeyForCompany);
            if (finalUrl != null) {
                return Response.temporaryRedirect(URI.create(finalUrl)).build();
            }

            Organization org = authService.getOrgById(orgIdFromHost);
            if (org == null) {
                return Response.ok().entity(Collections.emptyList()).build();
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
            InputStream is = new ByteArrayInputStream(imageBytes);
            BufferedImage image = ImageIO.read(is);

            if (image == null) {
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                        .entity("Failed to decode image")
                        .build();
            }

            tempFile = File.createTempFile(UUID.randomUUID().toString(), ".png");
            ImageIO.write(image, "png", tempFile);

            // Create year/month/day folder structure
            SimpleDateFormat simpleDateFormat = new SimpleDateFormat("yyyy/MM/dd");
            String format = simpleDateFormat.format(new Date());

            // Upload to S3 using the provided method
            String uploadedUrl = Util.uploadCopyOfLocalFile(null, org.getId(), tempFile.getAbsolutePath(), "og-image/" + format);

            if (uploadedUrl == null) {
                throw new UserVisibleException("Failed to upload image for : " + host);
            }

            keyValueStore.save(cacheKeyForCompany, uploadedUrl, TimeUnit.MINUTES.toMillis(30));
            return Response.temporaryRedirect(URI.create(uploadedUrl)).build();
        } catch (Exception e) {
            LOGGER.error("Failed to get screenshot", e);
            throw new UserVisibleException("Failed to get screenshot", e);
        } finally {
            FileUtils.deleteQuietly(tempFile);
        }
    }

    private static String getCacheKeyForCompany(String orgId, String title) {
        return "og-company-image-" + orgId + "-" + title;
    }
}
