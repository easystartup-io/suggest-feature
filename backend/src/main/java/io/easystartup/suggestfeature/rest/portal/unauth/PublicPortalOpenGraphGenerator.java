package io.easystartup.suggestfeature.rest.portal.unauth;


import com.luciad.imageio.webp.WebPReadParam;
import io.easystartup.suggestfeature.beans.Organization;
import io.easystartup.suggestfeature.loggers.Logger;
import io.easystartup.suggestfeature.loggers.LoggerFactory;
import io.easystartup.suggestfeature.services.AuthService;
import io.easystartup.suggestfeature.services.KeyValueStore;
import io.easystartup.suggestfeature.services.db.MongoTemplateFactory;
import io.easystartup.suggestfeature.utils.Util;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.Response;
import org.apache.batik.transcoder.TranscoderInput;
import org.apache.batik.transcoder.TranscoderOutput;
import org.apache.batik.transcoder.image.ImageTranscoder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.nio.file.Files;
import java.util.Collections;
import java.util.Iterator;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/*
 * @author indianBond
 */
@Path("/portal/unauth/og")
@Component
public class PublicPortalOpenGraphGenerator {

    private final MongoTemplateFactory mongoConnection;
    private final AuthService authService;
    private final KeyValueStore keyValueStore;
    private static final Logger LOGGER = LoggerFactory.getLogger(PublicPortalOpenGraphGenerator.class);

    @Autowired
    public PublicPortalOpenGraphGenerator(MongoTemplateFactory mongoConnection, AuthService authService, KeyValueStore keyValueStore) {
        this.mongoConnection = mongoConnection;
        this.authService = authService;
        this.keyValueStore = keyValueStore;
    }

    @GET
    @Path("/get-company")
    public Response getOpenGraph(@Context HttpServletRequest request) {
        String host = request.getHeader("host");
        String orgIdFromHost = authService.getOrgIdFromHost(host);

        String cacheKeyForCompany = getCacheKeyForCompany(orgIdFromHost);
        String finalUrl = keyValueStore.get(cacheKeyForCompany);
        if (finalUrl != null) {
            return Response.temporaryRedirect(URI.create(finalUrl)).build();
        }

        Organization org = authService.getOrgById(orgIdFromHost);
        if (org == null) {
            return Response.ok().entity(Collections.emptyList()).build();
        }
        String name = org.getName();
        String logo = org.getLogo();
        if (logo == null) {
            logo = "https://suggestfeature.com/logo-light.jpeg";
        }
        String uploadedUrl = generateAndUploadOpenGraphImage(logo, name, null, org.getId());
        if (uploadedUrl != null) {
            keyValueStore.save(cacheKeyForCompany, uploadedUrl, TimeUnit.MINUTES.toMillis(30));
        }
        return Response.temporaryRedirect(URI.create(uploadedUrl)).build();
    }

    public String generateAndUploadOpenGraphImage(String logoUrl, String orgName, String userId, String orgId) {
        int width = 1200;
        int height = 630;
        File tempFile = null;

        try {
            // Create a high-quality buffered image
            BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);
            Graphics2D g2d = image.createGraphics();

            // Enable anti-aliasing for smoother rendering
            g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            g2d.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
            g2d.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
            g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);

            // Set background
            g2d.setColor(Color.WHITE);
            g2d.fillRect(0, 0, width, height);

            // Load and draw logo
            BufferedImage logo = loadImage(logoUrl);
            int logoHeight = height / 3;
            int logoWidth = (int) ((double) logo.getWidth() / logo.getHeight() * logoHeight);
            int logoX = 50;
            int logoY = 50;
            g2d.drawImage(logo, logoX, logoY, logoWidth, logoHeight, null);

            // Add organization name
            g2d.setColor(Color.BLACK);
            g2d.setFont(new Font("Arial", Font.BOLD, 48));
            FontMetrics fm = g2d.getFontMetrics();
            int textY = logoY + logoHeight + 50 + fm.getAscent();
            g2d.drawString(orgName, 50, textY);

            // Add "Feedback" text
            g2d.setFont(new Font("Arial", Font.PLAIN, 36));
            fm = g2d.getFontMetrics();
            int feedbackY = textY + fm.getHeight() + 20;
            g2d.drawString("Feedback", 50, feedbackY);

//            // Add a subtle border
//            g2d.setColor(new Color(200, 200, 200));
//            g2d.setStroke(new BasicStroke(2));
//            g2d.drawRect(10, 10, width - 20, height - 20);

            g2d.scale(1, 1);


            g2d.dispose();

            // Create temp file with high-quality PNG encoding
            tempFile = File.createTempFile(UUID.randomUUID().toString(), ".png");
            ImageIO.write(image, "png", tempFile);

            // Upload to S3 using the provided method
            return Util.uploadCopyOfLocalFile(userId, orgId, tempFile.getAbsolutePath(), "og-image");
        } catch (Exception e) {
            LOGGER.error("Failed to generate and upload Open Graph image", e);
            return null;
        } finally {
            if (tempFile != null) {
                try {
                    Files.deleteIfExists(tempFile.toPath());
                } catch (IOException e) {
                    LOGGER.error("Failed to delete temporary file", e);
                }
            }
        }
    }

    private BufferedImage loadImage(String imageUrl) throws Exception {
        if (imageUrl.toLowerCase().endsWith(".svg")) {
            return convertSvgToPng(imageUrl);
        } else if (imageUrl.toLowerCase().endsWith(".webp")) {
            return readWebpImage(imageUrl);
        } else {
            return ImageIO.read(new URL(imageUrl));
        }
    }

    private static BufferedImage convertSvgToPng(String svgUrl) throws Exception {
        // Fetch SVG from the URL
        InputStream svgInputStream = downloadSvgFromUrl(svgUrl);

        // Custom ImageTranscoder to store the BufferedImage
        final BufferedImage[] imagePointer = new BufferedImage[1];

        ImageTranscoder transcoder = new ImageTranscoder() {
            @Override
            public BufferedImage createImage(int width, int height) {
                return new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);
            }

            @Override
            public void writeImage(BufferedImage bufferedImage, TranscoderOutput output) {
                imagePointer[0] = bufferedImage;
            }
        };

        // Create TranscoderInput from the InputStream
        TranscoderInput input = new TranscoderInput(svgInputStream);

        // Perform the transcoding
        transcoder.transcode(input, null);

        // Close the InputStream
        svgInputStream.close();

        // Return the generated BufferedImage
        return imagePointer[0];
    }

    private static InputStream downloadSvgFromUrl(String svgUrl) throws Exception {
        URL url = new URL(svgUrl);
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
        connection.setRequestMethod("GET");

        // Check if the request is successful
        int responseCode = connection.getResponseCode();
        if (responseCode != HttpURLConnection.HTTP_OK) {
            throw new RuntimeException("Failed to download SVG: HTTP error code " + responseCode);
        }

        return connection.getInputStream();
    }

    private BufferedImage readWebpImage(String webpUrl) throws Exception {
        URL url = new URL(webpUrl);
        ImageReader reader = null;
        ImageInputStream iis = null;
        try {
            iis = ImageIO.createImageInputStream(url.openStream());
            Iterator<ImageReader> readers = ImageIO.getImageReadersByMIMEType("image/webp");
            if (!readers.hasNext()) {
                throw new IllegalStateException("No WebP image reader found");
            }
            reader = readers.next();
            reader.setInput(iis);
            WebPReadParam readParam = new WebPReadParam();
            readParam.setBypassFiltering(true);
            return reader.read(0, readParam);
        } finally {
            if (reader != null) reader.dispose();
            if (iis != null) iis.close();
        }
    }

    private static String getCacheKeyForCompany(String orgId) {
        return "og-company-image-" + orgId;
    }
}
