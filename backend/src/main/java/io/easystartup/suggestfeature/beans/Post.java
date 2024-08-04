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
        @CompoundIndex(name = "organizationId_1_boardId_1_createdAt_1", def = "{'organizationId': 1, 'boardId': 1, 'createdAt': 1}"),
        @CompoundIndex(name = "organizationId_1_createdAt_1", def = "{'organizationId': 1, 'createdAt': 1}"),
        @CompoundIndex(name = "organizationId_1_boardId_1_slug_1", def = "{'organizationId': 1, 'boardId': 1,'slug': 1}", unique = true),
        // Needed for search functionality Todo: Remove this index and implement search functionality using es/manticore
        @CompoundIndex(name = "organizationId_1_title_1", def = "{'organizationId': 1, 'title': 'text'}"),
        // For regex based search on title
        @CompoundIndex(name = "organizationId_1_title_1_regex", def = "{'organizationId': 1, 'title': 1}")
})
public class Post {
    public static final String FIELD_ID = "_id";
    public static final String FIELD_TITLE = "title";
    public static final String FIELD_DESCRIPTION = "description";
    public static final String FIELD_ORGANIZATION_ID = "organizationId";
    public static final String FIELD_BOARD_ID = "boardId";
    public static final String FIELD_STATUS = "status";
    public static final String FIELD_APPROVED = "approved";
    public static final String FIELD_CREATED_BY_USER_ID = "createdByUserId";
    public static final String FIELD_CREATED_AT = "createdAt";
    public static final String FIELD_PRIORITY = "priority";
    public static final String FIELD_SLUG = "slug";

    @Id
    private String id;
    @NotBlank
    @Size(max = 500)
    private String title;
    @NotBlank
    @Size(max = 5000)
    private String description;
    @Indexed
    private String organizationId;
    private String createdByUserId;
    @Indexed
    private String boardId;

    // Just used in request DTO
    @NotBlank
    @Transient
    private String boardSlug;

    private String status = "OPEN";
    private String priority;
    private String slug;

    @Transient
    private boolean selfVoted;

    private long votes;

    private boolean approved;

    private Long createdAt;

    @Reference
    @Transient
    private User user;

    @Reference
    @Transient
    private List<Comment> comments;

    @Reference
    @Transient
    private List<Voter> voters;

    private List<Attachment> attachments;

    public Post() {
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

    public Long getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Long createdAt) {
        this.createdAt = createdAt;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getBoardId() {
        return boardId;
    }

    public void setBoardId(String boardId) {
        this.boardId = boardId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public boolean isApproved() {
        return approved;
    }

    public void setApproved(boolean approved) {
        this.approved = approved;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public List<Comment> getComments() {
        return comments;
    }

    public void setComments(List<Comment> comments) {
        this.comments = comments;
    }

    public List<Voter> getVoters() {
        return voters;
    }

    public void setVoters(List<Voter> voters) {
        this.voters = voters;
    }

    public long getVotes() {
        return votes;
    }

    public void setVotes(long votes) {
        this.votes = votes;
    }

    public boolean isSelfVoted() {
        return selfVoted;
    }

    public void setSelfVoted(boolean selfVoted) {
        this.selfVoted = selfVoted;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public String getSlug() {
        return slug;
    }

    public void setSlug(String slug) {
        this.slug = slug;
    }

    public @NotBlank String getBoardSlug() {
        return boardSlug;
    }

    public void setBoardSlug(@NotBlank String boardSlug) {
        this.boardSlug = boardSlug;
    }

    public List<Attachment> getAttachments() {
        return attachments;
    }

    public void setAttachments(List<Attachment> attachments) {
        this.attachments = attachments;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Attachment {
        private String url;
        private String type;

        public Attachment() {
        }

        public String getUrl() {
            return url;
        }

        public void setUrl(String url) {
            this.url = url;
        }

        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
        }
    }
}
