package io.easystartup.suggestfeature.rest;


import com.google.common.collect.Sets;
import io.easystartup.suggestfeature.filters.UserContext;
import io.easystartup.suggestfeature.filters.UserVisibleException;
import io.easystartup.suggestfeature.loggers.Logger;
import io.easystartup.suggestfeature.loggers.LoggerFactory;
import io.easystartup.suggestfeature.services.AuthService;
import io.easystartup.suggestfeature.services.db.MongoTemplateFactory;
import io.easystartup.suggestfeature.utils.JacksonMapper;
import io.easystartup.suggestfeature.utils.Util;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.apache.commons.lang3.StringUtils;
import org.glassfish.jersey.media.multipart.FormDataBodyPart;
import org.glassfish.jersey.media.multipart.FormDataContentDisposition;
import org.glassfish.jersey.media.multipart.FormDataParam;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectResponse;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.nio.file.Files;
import java.util.*;

/**
 * @author indianBond
 */
@Path("/auth/upload")
@Component
public class UploadRestApi {

    private static final Logger LOGGER = LoggerFactory.getLogger(UploadRestApi.class);

    private final AuthService authService;
    private static final Set<String> allowedExtensions = Sets.newHashSet(
            "png", "jpeg", "jpg", "gif", "webp", "svg", "ico",
            "txt", "rtf", "csv", "md", "yaml", "pdf", "doc", "docx", "odt",
            "xls", "xlsx", "ods", "ppt", "pptx", "odp", "key",
            "json", "xml", "mp4", "avi", "mov", "wmv", "flv", "zip", "rar"
    );

    @Autowired
    public UploadRestApi(AuthService authService) {
        this.authService = authService;
    }

    @POST
    @Path("/upload-file")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    public Response uploadFile(@Context HttpServletRequest request,
                               @FormDataParam("file") InputStream fileInputStream, @FormDataParam("file") FormDataBodyPart bodyPart,
                               @FormDataParam("file") FormDataContentDisposition fileMetaData) {

        LOGGER.error("Uploading file" + fileMetaData.getFileName() + " " + fileMetaData.getParameters() + " " + fileMetaData.getSize());
        UserContext userContext = UserContext.current();

        if (fileInputStream == null || fileMetaData == null) {
            throw new UserVisibleException("File not found", Response.Status.BAD_REQUEST);
        }

        String orgId = null;
        if (userContext.getOrgId() != null) {
            orgId = userContext.getOrgId();
        }
        if (orgId == null && request.getHeader("host") != null) {
            orgId = authService.getOrgIdFromHost(request.getHeader("host"));
        }

        // Check file size does not exceed 100mb
        if (fileMetaData.getSize() > 100 * 1024 * 1024) {
            throw new UserVisibleException("File size should not be so large", Response.Status.REQUEST_ENTITY_TOO_LARGE);
        }

        String bucketName = Util.getEnvVariable("S3_BUCKET", "suggest-feature"); // Replace with your bucket name

        // Extract file extension from name
        String[] fileNameParts = fileMetaData.getFileName().split("\\.");
        if (fileNameParts.length < 2) {
            throw new UserVisibleException("File name should have an extension", Response.Status.BAD_REQUEST);
        }
        // only allow pdf, word doc, excel, image, jpeg, video, png
        String extension = fileNameParts[fileNameParts.length - 1].toLowerCase(Locale.ROOT);
        if (!allowedExtensions.contains(extension)) {
            throw new UserVisibleException("File type not allowed", Response.Status.BAD_REQUEST);
        }

        String key = userContext.getUserId() + "/" + UUID.randomUUID() + "." + extension;
        if (orgId != null) {
            key = orgId + "/" + key;
        }

        // Write to temp file before uploading
        File tempFile = getFile(fileInputStream, extension);
        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .contentType(bodyPart.getMediaType().toString())
                .build();
        try {

            s3Client().putObject(putObjectRequest, RequestBody.fromFile(tempFile));
            String url = Util.getEnvVariable("S3_CDN_URL", "https://assets.suggestfeature.com/") + key;
            Map<String, String> rv = new HashMap<>();
            rv.put("url", url);
            rv.put("name", fileMetaData.getFileName());
            rv.put("type", getFileType(bodyPart.getMediaType().toString()));
            rv.put("contentType", bodyPart.getMediaType().toString());
            return Response.ok(JacksonMapper.toJson(rv)).build();
        } catch (Throwable e) {
            throw new RuntimeException("File upload failed.", e);
        } finally {
            try {
                Files.deleteIfExists(tempFile.toPath());
            } catch (Throwable ignored) {
                // ignored
            }
        }
    }

    private String getFileType(String string) {
        if (StringUtils.isBlank(string)) {
            return null;
        }
        if (string.startsWith("application/json")) {
            return "json";
        } else if (string.startsWith("application/xml")) {
            return "xml";
        } else if (string.startsWith("text")) {
            return "text";
        } else if (string.startsWith("image")) {
            return "image";
        } else if (string.startsWith("video")) {
            return "video";
        } else if (string.startsWith("application/pdf")) {
            return "pdf";
        } else if (string.startsWith("application/msword") || string.startsWith("application/vnd.openxmlformats-officedocument.wordprocessingml.document")) {
            return "doc";
        } else if (string.startsWith("application/vnd.ms-excel") || string.startsWith("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")) {
            return "xls";
        } else if (string.startsWith("application/vnd.ms-powerpoint") || string.startsWith("application/vnd.openxmlformats-officedocument.presentationml.presentation")) {
            return "ppt";
        }
        return null;
    }

    private static File getFile(InputStream fileInputStream, String extension) {
        File tempFile = null;
        try {
            tempFile = File.createTempFile(UUID.randomUUID() + "-", "." + extension);
            try (FileOutputStream out = new FileOutputStream(tempFile)) {
                byte[] buffer = new byte[1024];
                int bytesRead;
                while ((bytesRead = fileInputStream.read(buffer)) != -1) {
                    out.write(buffer, 0, bytesRead);
                }
                out.flush();
            }
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
        return tempFile;
    }

    /*
     * For Cloudflare R2
     *  S3_ENDPOINT = 'https://<accountid>.r2.cloudflarestorage.com',
     *  S3_KEY = '<access_key_id>',
     *  S3_SECRET = '<access_key_secret>',
     *  S3_REGION = '# Must be one of: wnam, enam, weur, eeur, apac, auto',
     * */
    public S3Client s3Client() {
        String R2_ENDPOINT = Util.getEnvVariable("S3_ENDPOINT", "");
        String ACCESS_KEY = Util.getEnvVariable("S3_KEY", "");
        String SECRET_KEY = Util.getEnvVariable("S3_SECRET", "");
        String S3_REGION = Util.getEnvVariable("S3_REGION", "enam");
        return S3Client.builder()
                .credentialsProvider(
                        StaticCredentialsProvider.create(
                                AwsBasicCredentials.create(ACCESS_KEY, SECRET_KEY)
                        )
                )
                .endpointOverride(URI.create(R2_ENDPOINT))
                .region(Region.of(S3_REGION))
                .serviceConfiguration(
                        S3Configuration.builder()
                                .pathStyleAccessEnabled(true)
                                .build()
                )
                .build();
    }

}
