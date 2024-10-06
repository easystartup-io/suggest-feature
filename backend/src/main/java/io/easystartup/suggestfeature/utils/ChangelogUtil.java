package io.easystartup.suggestfeature.utils;


import io.easystartup.suggestfeature.beans.Changelog;
import io.easystartup.suggestfeature.beans.Organization;
import io.easystartup.suggestfeature.services.db.MongoTemplateFactory;
import org.apache.commons.lang3.StringUtils;

/*
 * @author indianBond
 */
public class ChangelogUtil {
    private static final LazyService<MongoTemplateFactory> mongoConnection = new LazyService<>(MongoTemplateFactory.class);

    public static String getChangelogUrl(Changelog changelog, Organization organization) {
        String baseDomain = "";
        String slug = organization.getSlug();
        String customDomain = organization.getCustomDomain();
        if (StringUtils.isNotBlank(customDomain)) {
            baseDomain = "https://" + customDomain;
        } else {
            baseDomain = "https://" + slug + ".suggestfeature.com";
        }

        return baseDomain + "/c/" + changelog.getSlug();
    }
}
