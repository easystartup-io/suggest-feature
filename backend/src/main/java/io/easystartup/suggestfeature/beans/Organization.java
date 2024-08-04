package io.easystartup.suggestfeature.beans;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.google.common.collect.Lists;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

/*
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
    private List<String> allowedProviders = Lists.newArrayList("GOOGLE");
    private RoadmapSettings roadmapSettings;

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
}
