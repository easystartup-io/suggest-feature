package io.easystartup.suggestfeature.utils;

import com.google.common.base.CaseFormat;
import org.apache.commons.lang3.StringUtils;

import java.util.Arrays;
import java.util.regex.Pattern;

/*
 * @author indianBond
 */
public class Util {

    private static final Pattern NON_LATIN = Pattern.compile("[^\\w_-]");
    private static final Pattern SEPARATORS = Pattern.compile("[\\s\\p{Punct}&&[^-]]");
    public static final String WHITE_SPACE = " ";

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
        return System.getenv(key) == null ? defaultVal : System.getenv(key);
    }

    public static boolean isProdEnv() {
        return System.getenv("ENV") != null && "PROD".equals(System.getenv("ENV"));
    }

    public static Integer getEnvVariable(String key, Integer defaultVal) {
        return StringUtils.isBlank(System.getenv(key)) ? defaultVal : Integer.parseInt(System.getenv(key));
    }

    public static Long getEnvVariable(String key, Long defaultVal) {
        return StringUtils.isBlank(System.getenv(key)) ? defaultVal : Long.parseLong(System.getenv(key));
    }

}
