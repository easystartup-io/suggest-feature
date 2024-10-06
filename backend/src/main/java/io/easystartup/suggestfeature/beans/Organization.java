package io.easystartup.suggestfeature.beans;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.google.common.collect.Lists;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

/**
 * @author indianBond
 */
@Document
@JsonIgnoreProperties(ignoreUnknown = true)
public class Organization {

    public static final String FIELD_ID = "_id";
    public static final String FIELD_NAME = "name";
    public static final String FIELD_SLUG = "slug";
    public static final String FIELD_CUSTOM_DOMAIN = "customDomain";
    public static final String FIELD_CREATED_AT = "createdAt";
    public static final String FIELD_ROADMAP_SETTINGS = "roadmapSettings";
    public static final String FIELD_SSO_SETTINGS = "ssoSettings";

    @Id
    private String id;
    @NotBlank
    @Size(max = 500)
    private String name;
    @Indexed(unique = true)
    @NotBlank
    private String slug;
    @Indexed
    private String customDomain;
    private Long createdAt;
    private List<String> allowedProviders = Lists.newArrayList("GOOGLE", "FACEBOOK", "GITHUB", "LINKEDIN", "CUSTOM");
    private RoadmapSettings roadmapSettings;
    private ChangelogSettings changelogSettings;
    private String logo;
    private String favicon;
    private boolean hideOrgName;

    private boolean enableReturnToSiteUrl;
    private String returnToSiteUrl;
    private String returnToSiteUrlText;

    private SSOSettings ssoSettings;

    private boolean onboardingCompleted;
    private int onboardingStep;


    // To populate subscription Details in response

    @Transient
    private boolean trial;
    @Transient
    private boolean validSubscription;

    public Organization() {
    }

    @JsonIgnore
    @Transient
    public Organization createSafeOrg() {
        Organization safeOrg = new Organization();
        safeOrg.setId(getId());
        safeOrg.setName(getName());
        safeOrg.setCustomDomain(getCustomDomain());
        safeOrg.setSlug(getSlug());
        safeOrg.setLogo(getLogo());
        safeOrg.setFavicon(getFavicon());
        safeOrg.setHideOrgName(isHideOrgName());
        safeOrg.setEnableReturnToSiteUrl(isEnableReturnToSiteUrl());
        safeOrg.setReturnToSiteUrl(getReturnToSiteUrl());
        safeOrg.setReturnToSiteUrlText(getReturnToSiteUrlText());

        if (this.ssoSettings != null) {
            SSOSettings safeSsoSettings = new SSOSettings();
            safeSsoSettings.setEnableCustomSSO(this.ssoSettings.isEnableCustomSSO());
            safeSsoSettings.setExclusiveSSO(this.ssoSettings.isExclusiveSSO());
            safeSsoSettings.setSsoRedirectUrl(this.ssoSettings.getSsoRedirectUrl());
            safeOrg.setSsoSettings(safeSsoSettings);
        }

        return safeOrg;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSlug() {
        return slug;
    }

    public void setSlug(String slug) {
        this.slug = slug;
    }

    public Long getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Long createdAt) {
        this.createdAt = createdAt;
    }

    public String getCustomDomain() {
        return customDomain;
    }

    public void setCustomDomain(String customDomain) {
        this.customDomain = customDomain;
    }

    public RoadmapSettings getRoadmapSettings() {
        return roadmapSettings;
    }

    public void setRoadmapSettings(RoadmapSettings roadmapSettings) {
        this.roadmapSettings = roadmapSettings;
    }

    public List<String> getAllowedProviders() {
        return allowedProviders;
    }

    public void setAllowedProviders(List<String> allowedProviders) {
        this.allowedProviders = allowedProviders;
    }

    public String getLogo() {
        return logo;
    }

    public void setLogo(String logo) {
        this.logo = logo;
    }

    public String getFavicon() {
        return favicon;
    }

    public void setFavicon(String favicon) {
        this.favicon = favicon;
    }

    public boolean isHideOrgName() {
        return hideOrgName;
    }

    public void setHideOrgName(boolean hideOrgName) {
        this.hideOrgName = hideOrgName;
    }

    public boolean isOnboardingCompleted() {
        return onboardingCompleted;
    }

    public void setOnboardingCompleted(boolean onboardingCompleted) {
        this.onboardingCompleted = onboardingCompleted;
    }

    public int getOnboardingStep() {
        return onboardingStep;
    }

    public void setOnboardingStep(int onboardingStep) {
        this.onboardingStep = onboardingStep;
    }

    public boolean isEnableReturnToSiteUrl() {
        return enableReturnToSiteUrl;
    }

    public void setEnableReturnToSiteUrl(boolean enableReturnToSiteUrl) {
        this.enableReturnToSiteUrl = enableReturnToSiteUrl;
    }

    public String getReturnToSiteUrl() {
        return returnToSiteUrl;
    }

    public void setReturnToSiteUrl(String returnToSiteUrl) {
        this.returnToSiteUrl = returnToSiteUrl;
    }

    public String getReturnToSiteUrlText() {
        return returnToSiteUrlText;
    }

    public void setReturnToSiteUrlText(String returnToSiteUrlText) {
        this.returnToSiteUrlText = returnToSiteUrlText;
    }

    public SSOSettings getSsoSettings() {
        return ssoSettings;
    }

    public void setSsoSettings(SSOSettings ssoSettings) {
        this.ssoSettings = ssoSettings;
    }

    public boolean isTrial() {
        return trial;
    }

    public void setTrial(boolean trial) {
        this.trial = trial;
    }

    public void setValidSubscription(boolean validSubscription) {
        this.validSubscription = validSubscription;
    }

    public boolean isValidSubscription() {
        return validSubscription;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class SSOSettings {

        private boolean enableCustomSSO;
        private boolean exclusiveSSO;
        private String ssoRedirectUrl;
        private String primaryKey;
        private String secondaryKey;

        public SSOSettings() {
        }

        public String getSsoRedirectUrl() {
            return ssoRedirectUrl;
        }

        public void setSsoRedirectUrl(String ssoRedirectUrl) {
            this.ssoRedirectUrl = ssoRedirectUrl;
        }

        public String getPrimaryKey() {
            return primaryKey;
        }

        public void setPrimaryKey(String primaryKey) {
            this.primaryKey = primaryKey;
        }

        public boolean isEnableCustomSSO() {
            return enableCustomSSO;
        }

        public void setEnableCustomSSO(boolean enableCustomSSO) {
            this.enableCustomSSO = enableCustomSSO;
        }

        public String getSecondaryKey() {
            return secondaryKey;
        }

        public void setSecondaryKey(String secondaryKey) {
            this.secondaryKey = secondaryKey;
        }

        public boolean isExclusiveSSO() {
            return exclusiveSSO;
        }

        public void setExclusiveSSO(boolean exclusiveSSO) {
            this.exclusiveSSO = exclusiveSSO;
        }
    }

    public ChangelogSettings getChangelogSettings() {
        return changelogSettings;
    }

    public void setChangelogSettings(ChangelogSettings changelogSettings) {
        this.changelogSettings = changelogSettings;
    }
}
