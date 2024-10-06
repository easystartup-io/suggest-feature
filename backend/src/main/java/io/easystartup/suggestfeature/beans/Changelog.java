package io.easystartup.suggestfeature.beans;


import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Reference;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

/*
 * @author indianBond
 */

@Document
@JsonIgnoreProperties(ignoreUnknown = true)
@CompoundIndexes({
        @CompoundIndex(name = "organizationId_1_createdAt_1", def = "{'organizationId': 1, 'createdAt': 1}"),
        // Needed for search functionality Todo: Remove this index and implement search functionality using es/manticore
        @CompoundIndex(name = "organizationId_1_title_1", def = "{'organizationId': 1, 'title': 'text'}"),
        // For regex based search on title
        @CompoundIndex(name = "organizationId_1_title_1_regex", def = "{'organizationId': 1, 'title': 1}")
})
public class Changelog {

    public static final String FIELD_ID = "_id";
    public static final String FIELD_ORGANIZATION_ID = "organizationId";
    public static final String FIELD_TAGS = "tags";
    public static final String FIELD_CREATED_AT = "createdAt";
    public static final String FIELD_SLUG = "slug";

    @Id
    private String id;
    @NotBlank
    @Size(max = 500)
    private String title;
    @NotBlank
    @Size(max = 100_000)
    private String content;
    @Indexed
    private String organizationId;
    private String createdByUserId;

    private List<String> postIds;

    @Indexed
    private String slug;

    private Long createdAt;
    private Long modifiedAt;

    @Reference
    @Transient
    private User user;

    private List<String> tags;

    public Changelog() {
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public @NotBlank @Size(max = 500) String getTitle() {
        return title;
    }

    public void setTitle(@NotBlank @Size(max = 500) String title) {
        this.title = title;
    }

    public @NotBlank @Size(max = 100_000) String getContent() {
        return content;
    }

    public void setContent(@NotBlank @Size(max = 100_000) String content) {
        this.content = content;
    }

    public String getOrganizationId() {
        return organizationId;
    }

    public void setOrganizationId(String organizationId) {
        this.organizationId = organizationId;
    }

    public String getCreatedByUserId() {
        return createdByUserId;
    }

    public void setCreatedByUserId(String createdByUserId) {
        this.createdByUserId = createdByUserId;
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

    public Long getModifiedAt() {
        return modifiedAt;
    }

    public void setModifiedAt(Long modifiedAt) {
        this.modifiedAt = modifiedAt;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public List<String> getTags() {
        return tags;
    }

    public void setTags(List<String> tags) {
        this.tags = tags;
    }

    public List<String> getPostIds() {
        return postIds;
    }

    public void setPostIds(List<String> postIds) {
        this.postIds = postIds;
    }
}
