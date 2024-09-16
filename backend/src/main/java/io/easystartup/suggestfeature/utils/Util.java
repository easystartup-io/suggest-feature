package io.easystartup.suggestfeature.utils;

import com.fasterxml.jackson.core.type.TypeReference;
import com.github.slugify.Slugify;
import com.google.common.base.CaseFormat;
import io.easystartup.suggestfeature.beans.*;
import io.easystartup.suggestfeature.loggers.Logger;
import io.easystartup.suggestfeature.loggers.LoggerFactory;
import io.easystartup.suggestfeature.services.AuthService;
import io.easystartup.suggestfeature.services.db.MongoTemplateFactory;
import io.github.cdimascio.dotenv.Dotenv;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.jetbrains.annotations.NotNull;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.URL;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

import static org.apache.commons.lang3.StringUtils.defaultIfBlank;
import static org.apache.commons.lang3.StringUtils.defaultIfEmpty;

/**
 * @author indianBond
 */
public class Util {

    public static final String WHITE_SPACE = " ";
    public static final Map<String, String> SLUGIFY_MAP;
    private static final Dotenv dotenv;
    private static final Logger LOGGER = LoggerFactory.getLogger(Util.class);
    private static LazyService<AuthService> authService = new LazyService<>(AuthService.class);
    private static LazyService<MongoTemplateFactory> mongoConnection = new LazyService<>(MongoTemplateFactory.class);

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
            // ignore
        }
    }

    public static String convertFieldNameToReadableString(String string) {
        String[] split = string.split("\\.");
        String to = CaseFormat.LOWER_CAMEL.to(CaseFormat.UPPER_UNDERSCORE, split[split.length - 1]);
        String[] s = to.split("_");
        StringBuilder stringBuilder1 = new StringBuilder();
        Arrays.stream(s).filter(StringUtils::isNotBlank).forEach(vale -> stringBuilder1.append(vale.toLowerCase(Locale.ROOT)).append(" "));
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
                    s3Client.putObject(putObjectRequest, RequestBody.fromFile(tempFile));
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
        return (dotIndex == -1) ? "" : fileName.substring(dotIndex + 1).toLowerCase(Locale.ROOT);
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

    public static void populatePost(Post post, String orgId, String userId, boolean adminPortalRequest) {
        if (post == null) {
            return;
        }
        List<Voter> voters = getVoters(post);
        List<Comment> comments = getComments(post);

        post.setVoters(voters);
        post.setVotes(voters.size());

        Set<String> allUserIdsToFetch = new HashSet<>();
        allUserIdsToFetch.addAll(voters.stream().map(Voter::getUserId).collect(Collectors.toSet()));
        allUserIdsToFetch.addAll(comments.stream().map(Comment::getCreatedByUserId).collect(Collectors.toSet()));
        allUserIdsToFetch.add(post.getCreatedByUserId());
        List<User> users = authService.get().getUsersByUserIds(allUserIdsToFetch);
        // These belong to the org so show special icon corresponding to those
        List<Member> membersForOrgId = authService.get().getMembersForOrgId(allUserIdsToFetch, orgId);
        Map<String, Member> userIdVsMember = membersForOrgId.stream().collect(Collectors.toMap(Member::getUserId, Function.identity()));

        Map<String, User> userIdVsSafeUser = users.stream().map(user -> {
            User safeUser = new User();
            safeUser.setId(user.getId());
            safeUser.setName(user.getName());
            if (StringUtils.isBlank(user.getName()) && StringUtils.isNotBlank(user.getEmail())) {
                safeUser.setName(getNameFromEmail(user.getEmail()));
            }
            if (adminPortalRequest){
                safeUser.setEmail(user.getEmail());
            }
            safeUser.setProfilePic(user.getProfilePic());
            safeUser.setPartOfOrg(userIdVsMember.containsKey(user.getId()));
            return safeUser;
        }).collect(Collectors.toMap(User::getId, Function.identity()));

        // Returning new map because need to remove comments which have a parent comment, else double comment in response
        comments = populateUserInCommentAndPopulateNestedCommentsStructure(comments, userIdVsSafeUser);
        post.setComments(comments);

        voters.forEach(voter -> {
            voter.setUser(userIdVsSafeUser.get(voter.getUserId()));
            if (voter.getUserId().equals(userId)) {
                post.setSelfVoted(true);
            }
        });

        post.setUser(userIdVsSafeUser.get(post.getCreatedByUserId()));
    }

    @NotNull
    private static List<Comment> getComments(Post post) {
        Criteria criteriaDefinition = Criteria.where(Comment.FIELD_POST_ID).is(post.getId());
        Query query = new Query(criteriaDefinition);
        query.with(Sort.by(Sort.Direction.ASC, Comment.FIELD_CREATED_AT));
        return mongoConnection.get().getDefaultMongoTemplate().find(query, Comment.class);
    }

    @NotNull
    private static List<Voter> getVoters(Post post) {
        Criteria criteriaDefinition = Criteria.where(Voter.FIELD_POST_ID).is(post.getId());
        Query query = new Query(criteriaDefinition);
        query.with(Sort.by(Sort.Direction.DESC, Voter.FIELD_CREATED_AT));
        List<Voter> voters = mongoConnection.get().getDefaultMongoTemplate().find(query, Voter.class);
        return voters;
    }


    public static List<Comment> populateUserInCommentAndPopulateNestedCommentsStructure(List<Comment> comments, Map<String, User> userIdVsSafeUser) {
        // All comments are already fetched. Now populate user in each comment by making single db call
        // And also populate nested comments structure. Based on replyToCommentId and comments list
        List<Comment> processedComments = new ArrayList<>();
        Map<String, Comment> commentIdVsComment = comments.stream().collect(Collectors.toMap(Comment::getId, Function.identity()));
        for (Comment comment : comments) {
            comment.setUser(userIdVsSafeUser.get(comment.getCreatedByUserId()));
            if (StringUtils.isBlank(comment.getReplyToCommentId())) {
                processedComments.add(comment);
                continue;
            }
            Comment parentComment = commentIdVsComment.get(comment.getReplyToCommentId());
            if (parentComment == null) {
                // Deleted comments which are dangling. Add support later
                continue;
            }
            if (parentComment.getComments() == null) {
                parentComment.setComments(new ArrayList<>());
            }
            parentComment.getComments().add(comment);
        }
        return processedComments;
    }

    public static Double calculateTrendingScore(long votes, Long createdAt) {
        long timeScore = System.currentTimeMillis() - createdAt;
        return votes / Math.pow(timeScore, 1.5);
    }

    public static void populateSelfVotedInPosts(List<Post> posts, String orgId, String userId) {
        if (CollectionUtils.isEmpty(posts)) {
            return;
        }

        List<String> postIds = posts.stream().map(Post::getId).collect(Collectors.toList());

        Criteria criteriaDefinition = Criteria.where(Voter.FIELD_POST_ID).in(postIds);
        criteriaDefinition.and(Voter.FIELD_USER_ID).is(userId);
        Query query = new Query(criteriaDefinition);
        List<Voter> voters = mongoConnection.get().getDefaultMongoTemplate().find(query, Voter.class);
        Set<String> postsWhichAreSelfVoted = voters.stream().map(Voter::getPostId).collect(Collectors.toSet());

        posts.forEach(post -> post.setSelfVoted(postsWhichAreSelfVoted.contains(post.getId())));
    }

    public static Sort getSort(String sortString) {
        if (StringUtils.isBlank(sortString)) {
            return Sort.by(Sort.Direction.DESC, Post.FIELD_CREATED_AT);
        }
        switch (sortString) {
            case "trending" -> {
                return Sort.by(Sort.Direction.DESC, Post.FIELD_VOTES);
            }
            case "top" -> {
                return Sort.by(Sort.Direction.DESC, Post.FIELD_VOTES);
            }
            case "newest" -> {
                return Sort.by(Sort.Direction.DESC, Post.FIELD_CREATED_AT);
            }
            case "oldest" -> {
                return Sort.by(Sort.Direction.ASC, Post.FIELD_CREATED_AT);
            }
            default -> {
                return Sort.by(Sort.Direction.DESC, Post.FIELD_CREATED_AT);
            }
        }
    }
}
