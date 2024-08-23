package io.easystartup.suggestfeature.beans;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotBlank;
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


    @Id
    private String id;
    @NotBlank
    private String name;
    @Indexed(unique = true)
    @NotBlank
    private String slug;
    @Indexed
    private String customDomain;
    private Long createdAt;
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
}
