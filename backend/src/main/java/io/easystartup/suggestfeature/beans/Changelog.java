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
        @CompoundIndex(name = "organizationId_1_changelogDate_1", def = "{'organizationId': 1, 'changelogDate': 1}"),
        // Needed for search functionality Todo: Remove this index and implement search functionality using es/manticore
        @CompoundIndex(name = "organizationId_1_title_1", def = "{'organizationId': 1, 'title': 'text'}"),
        // For regex based search on title
        @CompoundIndex(name = "organizationId_1_title_1_regex", def = "{'organizationId': 1, 'title': 1}"),
        @CompoundIndex(name = "organizationId_1_slug_1", def = "{'organizationId': 1, 'slug': 1}", unique = true),
})
public class Changelog {

    public static final String FIELD_ID = "_id";
    public static final String FIELD_ORGANIZATION_ID = "organizationId";
    public static final String FIELD_TAGS = "tags";
    public static final String FIELD_CREATED_AT = "createdAt";
    public static final String FIELD_CHANGELOG_DATE = "changelogDate";
    public static final String FIELD_SLUG = "slug";
    public static final String FIELD_DRAFT = "draft";

    @Id
    private String id;
    @NotBlank
    @Size(max = 500)
    private String title;

    @NotBlank
    @Size(max = 100_000)
    private String content;

    private String html;

    private String coverImage;
    @Indexed
    private String organizationId;
    private String createdByUserId;

    private Long changelogDate;

    private boolean draft;

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

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
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

    public Long getChangelogDate() {
        return changelogDate;
    }

    public void setChangelogDate(Long changelogDate) {
        this.changelogDate = changelogDate;
    }

    public boolean isDraft() {
        return draft;
    }

    public void setDraft(boolean draft) {
        this.draft = draft;
    }

    public String getCoverImage() {
        return coverImage;
    }

    public void setCoverImage(String coverImage) {
        this.coverImage = coverImage;
    }

    public String getHtml() {
        return html;
    }

    public void setHtml(String html) {
        this.html = html;
    }
}
