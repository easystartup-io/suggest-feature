package io.easystartup.suggestfeature.beans;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

/*
 * @author indianBond
 */
@Document
@JsonIgnoreProperties(ignoreUnknown = true)
public class Board {
    public static final String FIELD_ID = "_id";
    public static final String FIELD_ORGANIZATION_ID = "organizationId";
    public static final String FIELD_CREATED_BY_USER_ID = "createdByUserId";
    public static final String FIELD_CREATED_AT = "createdAt";
    public static final String FIELD_PAGE_ID = "pageId";
    public static final String FIELD_DESCRIPTION = "description";
    public static final String FIELD_ALLOW_ANONYMOUS = "allowAnonymous";
    public static final String FIELD_ALLOW_WITHOUT_EMAIL_VERIFICATION = "allowWithoutEmailVerification";
    public static final String FIELD_ADD_POST_ONLY_AFTER_APPROVAL = "addPostOnlyAfterApproval";

    @Id
    private String id;
    private String name;
    private String description;
    @Indexed
    private String pageId;
    @Indexed
    private String organizationId;
    @Indexed
    private String createdByUserId;

    private boolean allowAnonymous;
    private boolean allowWithoutEmailVerification;
    private boolean addPostOnlyAfterApproval;

    private Long createdAt;

    public Board() {
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

    public String getPageId() {
        return pageId;
    }

    public void setPageId(String pageId) {
        this.pageId = pageId;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public boolean isAllowAnonymous() {
        return allowAnonymous;
    }

    public void setAllowAnonymous(boolean allowAnonymous) {
        this.allowAnonymous = allowAnonymous;
    }

    public boolean isAllowWithoutEmailVerification() {
        return allowWithoutEmailVerification;
    }

    public void setAllowWithoutEmailVerification(boolean allowWithoutEmailVerification) {
        this.allowWithoutEmailVerification = allowWithoutEmailVerification;
    }

    public boolean isAddPostOnlyAfterApproval() {
        return addPostOnlyAfterApproval;
    }

    public void setAddPostOnlyAfterApproval(boolean addPostOnlyAfterApproval) {
        this.addPostOnlyAfterApproval = addPostOnlyAfterApproval;
    }
}