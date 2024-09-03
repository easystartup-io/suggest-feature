package io.easystartup.suggestfeature.beans;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Reference;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

/*
 * @author indianBond
 */
@JsonIgnoreProperties(ignoreUnknown = true)
@Document
@CompoundIndexes({
        @CompoundIndex(name = "postId_1_userId_1",def = "{'postId': 1, 'userId': 1}", unique = true),
        @CompoundIndex(name = "postId_1_createdAt_1",def = "{'postId': 1, 'createdAt': 1}"),
})
public class Voter {
    public static final String FIELD_ID = "_id";
    public static final String FIELD_USER_ID = "userId";
    public static final String FIELD_CUSTOMER_ID = "customerId";
    public static final String FIELD_POST_ID = "postId";
    public static final String FIELD_ORGANIZATION_ID = "organizationId";
    public static final String FIELD_CREATED_AT = "createdAt";

    @Id
    private String id;

    private String userId;

    private String postId;
    private String organizationId;
    private Long createdAt;

    @Reference
    @Transient
    private User user;

    public Voter() {
    }

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

    public String getOrganizationId() {
        return organizationId;
    }

    public void setOrganizationId(String organizationId) {
        this.organizationId = organizationId;
    }

    public Long getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Long createdAt) {
        this.createdAt = createdAt;
    }

    public String getPostId() {
        return postId;
    }

    public void setPostId(String postId) {
        this.postId = postId;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public User getUser() {
        return user;
    }
}
