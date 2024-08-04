package io.easystartup.suggestfeature.beans;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Reference;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

/*
 * @author indianBond
 * Mapping of end customer to organization
 */
@Document
@JsonIgnoreProperties(ignoreUnknown = true)
@CompoundIndexes({
        @CompoundIndex(name = "userId_1_organizationId_1", def = "{'userId': 1, 'organizationId': 1}", unique = true),
        @CompoundIndex(name = "organizationId_1__id_1", def = "{'organizationId': 1, '_id': 1}", unique = true),
})
public class Customer {

    public static final String FIELD_ID = "_id";
    public static final String FIELD_USER_ID = "userId";
    public static final String FIELD_ORGANIZATION_ID = "organizationId";
    public static final String FIELD_CREATED_AT = "createdAt";

    @Id
    private String id;

    @Indexed
    private String userId;
    private Long createdAt;
    private boolean spam;
    private String organizationId;

    @Transient
    @Reference // Alternative to skip index
    private User user;

    public Customer() {
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

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public boolean isSpam() {
        return spam;
    }

    public void setSpam(boolean spam) {
        this.spam = spam;
    }
}
