package io.easystartup.suggestfeature.utils;

import com.fasterxml.jackson.core.type.TypeReference;
import com.github.slugify.Slugify;
import com.google.common.base.CaseFormat;
import io.github.cdimascio.dotenv.Dotenv;
import org.apache.commons.lang3.StringUtils;

import java.util.Arrays;
import java.util.Map;
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

}
