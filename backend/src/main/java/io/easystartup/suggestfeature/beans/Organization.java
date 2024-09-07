package io.easystartup.suggestfeature.beans;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.google.common.collect.Lists;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.data.annotation.Id;
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
    private List<String> allowedStatuses = Lists.newArrayList("UNDER REVIEW", "PLANNED", "IN PROGRESS");
    private List<String> allowedProviders = Lists.newArrayList("GOOGLE");
    private RoadmapSettings roadmapSettings;
    private String logo;
    private String favicon;
    private boolean hideOrgName;

    private boolean onboardingCompleted;
    private int onboardingStep;

    public Organization() {
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

    public List<String> getAllowedStatuses() {
        return allowedStatuses;
    }

    public void setAllowedStatuses(List<String> allowedStatuses) {
        this.allowedStatuses = allowedStatuses;
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
}
