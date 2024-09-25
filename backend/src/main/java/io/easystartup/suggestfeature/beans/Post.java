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
import java.util.Set;

/**
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
    public static final String FIELD_MODIFIED_AT = "modifiedAt";
    public static final String FIELD_PRIORITY = "priority";
    public static final String FIELD_VOTES = "votes";
    public static final String FIELD_COMMENT_COUNT = "commentCount";
    public static final String FIELD_SLUG = "slug";
    public static final Set<Long> MILESTONES = Set.of(
            5L,
            10L,
            25L,
            50L,
            100L,
            250L,
            500L,
            1000L,
            2500L,
            5000L,
            10_000L,
            25_000L,
            50_000L,
            100_000L,
            250_000L,
            500_000L,
            1_000_000L,
            2_500_000L,
            5_000_000L,
            10_000_000L,
            20_000_000L,
            40_000_000L
    );

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

    private Double trendingScore;

    // Just used in request DTO
    @NotBlank
    @Transient
    private String boardSlug;

    // Just used in response DTO
    @Transient
    private String boardName;

    private String status = "OPEN";
    private String priority;
    private String slug;

    @Transient
    private boolean selfVoted;

    private long votes;
    private long commentCount;

    private boolean approved;

    private Long createdAt;
    private Long modifiedAt;

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
    private List<String> tags;

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

    public Long getModifiedAt() {
        return modifiedAt;
    }

    public void setModifiedAt(Long modifiedAt) {
        this.modifiedAt = modifiedAt;
    }

    public List<String> getTags() {
        return tags;
    }

    public void setTags(List<String> tags) {
        this.tags = tags;
    }

    public long getCommentCount() {
        return commentCount;
    }

    public void setCommentCount(long commentCount) {
        this.commentCount = commentCount;
    }

    public Double getTrendingScore() {
        return trendingScore;
    }

    public void setTrendingScore(Double trendingScore) {
        this.trendingScore = trendingScore;
    }

    public String getBoardName() {
        return boardName;
    }

    public void setBoardName(String boardName) {
        this.boardName = boardName;
    }
}
