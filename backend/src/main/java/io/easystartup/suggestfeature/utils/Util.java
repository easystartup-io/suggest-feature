package io.easystartup.suggestfeature.utils;

import com.fasterxml.jackson.core.type.TypeReference;
import com.github.slugify.Slugify;
import com.google.common.base.CaseFormat;
import io.easystartup.suggestfeature.loggers.Logger;
import io.easystartup.suggestfeature.loggers.LoggerFactory;
import io.github.cdimascio.dotenv.Dotenv;
import org.apache.commons.lang3.StringUtils;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectResponse;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.URL;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.Arrays;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;

import static org.apache.commons.lang3.StringUtils.defaultIfBlank;
import static org.apache.commons.lang3.StringUtils.defaultIfEmpty;

/*
 * @author indianBond
 */
public class Util {

    private static final Pattern NON_LATIN = Pattern.compile("[^\\w_-]");
    private static final Pattern SEPARATORS = Pattern.compile("[\\s\\p{Punct}&&[^-]]");
    public static final String WHITE_SPACE = " ";
    public static final Map<String, String> SLUGIFY_MAP;
    private static final Dotenv dotenv;
    private static final Logger LOGGER = LoggerFactory.getLogger(Util.class);

    static {
        // Used to replace $ with dollar
        SLUGIFY_MAP = JacksonMapper.fromJsonResource("slugify.json", new TypeReference<Map<String, String>>() {
        });

        // https://github.com/cdimascio/dotenv-java
        // Environment variables listed in the host environment override those in .env.
        dotenv = Dotenv
                .configure()
                .ignoreIfMissing()
                .directory(defaultIfBlank(System.getProperty("envfile.dir"), "./"))
                .filename(defaultIfBlank(System.getProperty("envfile.filename"), ".env"))
                .load();
    }

    public static void sleepSafe(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException ignore) {
        }
    }

    public static String convertFieldNameToReadableString(String string) {
        String[] split = string.split("\\.");
        String to = CaseFormat.LOWER_CAMEL.to(CaseFormat.UPPER_UNDERSCORE, split[split.length - 1]);
        String[] s = to.split("_");
        StringBuilder stringBuilder1 = new StringBuilder();
        Arrays.stream(s).filter(StringUtils::isNotBlank).forEach(vale -> stringBuilder1.append(vale.toLowerCase()).append(" "));
        return StringUtils.capitalize(stringBuilder1.toString().trim());
    }

    public static String getHostName() {
        return getEnvVariable("HOSTNAME", isProdEnv() ? "DEFAULT_PROD_HOSTNAME" : "DEFAULT_QA_HOSTNAME");
    }

    public static String getEnvVariable(String key, String defaultVal) {
        return defaultIfEmpty(dotenv.get(key), defaultVal);
    }

    public static boolean isProdEnv() {
        String env = getEnvVariable("ENV", "DEV");
        return "PROD".equals(env);
    }

    public static boolean isSelfHosted() {
        // By default, assume self-hosted if the environment variable is not set or not equal to "false"
        String selfHosted = getEnvVariable("SELF_HOSTED", "true");
        return !"false".equalsIgnoreCase(selfHosted);
    }

    public static Integer getEnvVariable(String key, Integer defaultVal) {
        return StringUtils.isBlank(dotenv.get(key)) ? defaultVal : Integer.parseInt(dotenv.get(key));
    }

    public static Long getEnvVariable(String key, Long defaultVal) {
        return StringUtils.isBlank(dotenv.get(key)) ? defaultVal : Long.parseLong(dotenv.get(key));
    }

    public static String fixSlug(String slug) {
        slug = slug.trim();

        // If the slug field has a character is in the map, replace all with the value from the map
        // Used to replace $ with dollar
        for (Map.Entry<String, String> entry : SLUGIFY_MAP.entrySet()) {
            slug = slug.replace(entry.getKey(), entry.getValue());
        }

        // Set slug based on the org name, all lower case and all special characters removed and spaces replaced with -
        // Also cant end with - or start with -
        // Example: "Example Org" => "example-org"
        // Example: "hello-how-do-you-do" => "hello-how-do-you-do"
        // Example: "-hello-how-do-you-do" => "hello-how-do-you-do"
        // Example: "-hello-how-do-you-do-" => "hello-how-do-you-do"
        // Limit max length to 35 characters
        Slugify builder = Slugify.builder().transliterator(true).build();
        slug = builder.slugify(slug);
        slug = slug.substring(0, Math.min(slug.length(), 35));
        return slug;
    }


    public static String getNameFromEmail(String email) {
        // Extract name from email
        email = email.substring(0, email.indexOf('@'));
        // if it contains dots or any delimiters split it and capitalize first letter of each word and use just first two words
        if (email.contains(".") || email.contains("_") || email.contains("-")) {
            String[] split = email.split("[._-]");
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < Math.min(2, split.length); i++) {
                sb.append(StringUtils.capitalize(split[i]));
                if (i != split.length - 1) {
                    sb.append(" ");
                }
            }
            return sb.toString();
        }
        return StringUtils.capitalize(email);
    }


    public static String uploadCopy(String userId, String orgId, String externalUrl) {
        if (StringUtils.isBlank(externalUrl)) {
            return null;
        }
        URL url = null;
        String BUCKET_NAME = Util.getEnvVariable("S3_BUCKET", "suggest-feature"); // Replace with your bucket name
        try {
            url = new URL(externalUrl);
            String fileName = getFileNameFromUrl(url);
            String extension = getExtensionFromFileName(fileName);

            // Construct the S3 key
            String key = (orgId != null ? orgId + "/" : "") + userId + "/" + UUID.randomUUID() + "." + extension;

            // Get file content and content type from the external URL
            String contentType = url.openConnection().getContentType();

            // Write to temp file before uploading
            File tempFile = null;
            try (InputStream inputStream = url.openStream()) {
                tempFile = File.createTempFile("upload", "." + extension);
                Files.copy(inputStream, tempFile.toPath(), java.nio.file.StandardCopyOption.REPLACE_EXISTING);

                PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                        .bucket(BUCKET_NAME)
                        .key(key)
                        .contentType(contentType)
                        .build();

                try (S3Client s3Client = S3Client.create()) {
                    PutObjectResponse putObjectResponse = s3Client.putObject(putObjectRequest, RequestBody.fromFile(tempFile));
                    return Util.getEnvVariable("S3_CDN_URL", "https://assets.suggestfeature.com/") + key;
                }
            } catch (IOException e) {
                throw new RuntimeException("File upload failed.", e);
            } finally {
                if (tempFile != null) {
                    try {
                        Files.deleteIfExists(tempFile.toPath());
                    } catch (IOException ignored) {
                        // Ignored
                    }
                }
            }
        } catch (Throwable e) {
            LOGGER.error("Failed to upload file from external URL: " + externalUrl, e);
            return externalUrl;
        }
    }

    private static String getFileNameFromUrl(URL url) {
        String path = url.getPath();
        String decoded = URLDecoder.decode(path, StandardCharsets.UTF_8);
        return decoded.substring(decoded.lastIndexOf('/') + 1);
    }

    private static String getExtensionFromFileName(String fileName) {
        int dotIndex = fileName.lastIndexOf('.');
        return (dotIndex == -1) ? "" : fileName.substring(dotIndex + 1).toLowerCase();
    }

    /*
     * For Cloudflare R2
     *  S3_ENDPOINT = 'https://<accountid>.r2.cloudflarestorage.com',
     *  S3_KEY = '<access_key_id>',
     *  S3_SECRET = '<access_key_secret>',
     *  S3_REGION = '# Must be one of: wnam, enam, weur, eeur, apac, auto',
     * */
    public static S3Client s3Client() {
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
