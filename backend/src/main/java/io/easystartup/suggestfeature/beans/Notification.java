package io.easystartup.suggestfeature.beans;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Map;

/*
 * @author indianBond
 */
@Document
@JsonIgnoreProperties(ignoreUnknown = true)
@CompoundIndexes({
        @CompoundIndex(name = "organizationId_1_createdAt_1", def = "{'organizationId': 1, 'createdAt': 1}"),
})
public class Notification {

    public static final String FIELD_ID = "_id";
    public static final String FIELD_USER_ID = "userId";
    public static final String FIELD_CREATED_AT = "createdAt";
    public static final String FIELD_ORGANIZATION_ID = "organizationId";
    public static final String FIELD_BOARD_ID = "boardId";
    public static final String FIELD_TYPE = "type";
    public static final String FIELD_DATA = "data";
    public static final String FIELD_CREATED_BY_USER_TYPE = "createdByUserType";

    public enum NotificationType {
        POST,
        COMMENT,
        POST_STATUS_UPDATE,
        UPVOTE,
        FOLLOW,
        MENTION,
        REPLY
    }

    @Id
    private String id;

    private String organizationId;
    @Indexed
    private String userId;
    private String boardId;
    private Long createdAt;
    private Map<String, Object> data;
    private NotificationType type;

    // END_USER or TEAM_MEMBER
    private String createdByUserType;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public Long getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Long createdAt) {
        this.createdAt = createdAt;
    }

    public String getOrganizationId() {
        return organizationId;
    }

    public void setOrganizationId(String organizationId) {
        this.organizationId = organizationId;
    }

    public NotificationType getType() {
        return type;
    }

    public void setType(NotificationType type) {
        this.type = type;
    }

    public Map<String, Object> getData() {
        return data;
    }

    public void setData(Map<String, Object> data) {
        this.data = data;
    }

    public String getBoardId() {
        return boardId;
    }

    public void setBoardId(String boardId) {
        this.boardId = boardId;
    }

    public String getCreatedByUserType() {
        return createdByUserType;
    }

    public void setCreatedByUserType(String createdByUserType) {
        this.createdByUserType = createdByUserType;
    }
}