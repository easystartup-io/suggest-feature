package io.easystartup.suggestfeature.beans;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * @author indianBond
 */
@Document
@JsonIgnoreProperties(ignoreUnknown = true)
@CompoundIndexes({
        @CompoundIndex(def = "{'slug': 1, 'organizationId': 1}",name = "slug_1_organizationId_1", unique = true)
})
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
    public static final String FIELD_POST_COUNT = "postCount";
    public static final String FIELD_NAME = "name";
    public static final String FIELD_SLUG = "slug";
    public static final String FIELD_ORDER = "order";
    public static final String FIELD_BOARD_FORM = "boardForm";

    @Id
    private String id;
    @NotBlank
    @Size(max = 500)
    private String name;
    @NotBlank
    private String slug;
    @Size(max = 5000)
    private String description;
    @Indexed
    private String organizationId;
    @Indexed
    private String createdByUserId;

    private BoardForm boardForm;

    private boolean privateBoard;

    private boolean allowAnonymous;
    private boolean allowWithoutEmailVerification;
    private boolean addPostOnlyAfterApproval;

    private Long postCount;

    private Long createdAt;

    private Long order;

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

    public Long getPostCount() {
        return postCount;
    }

    public void setPostCount(Long postCount) {
        this.postCount = postCount;
    }

    public String getSlug() {
        return slug;
    }

    public void setSlug(String slug) {
        this.slug = slug;
    }

    public boolean isPrivateBoard() {
        return privateBoard;
    }

    public void setPrivateBoard(boolean privateBoard) {
        this.privateBoard = privateBoard;
    }

    public Long getOrder() {
        if (order == null) {
            if (createdAt == null) {
                return System.currentTimeMillis();
            }
            return getCreatedAt();
        }
        return order;
    }

    public void setOrder(Long order) {
        this.order = order;
    }

    public BoardForm getBoardForm() {
        return boardForm;
    }

    public void setBoardForm(BoardForm boardForm) {
        this.boardForm = boardForm;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class BoardForm {
        private String heading;
        private String description;
        private String titleLabel;
        private String titlePlaceholder;
        private String descriptionLabel;
        private String descriptionPlaceholder;
        private String buttonText;

        public BoardForm() {
        }

        public String getHeading() {
            return heading;
        }

        public void setHeading(String heading) {
            this.heading = heading;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }

        public String getTitleLabel() {
            return titleLabel;
        }

        public void setTitleLabel(String titleLabel) {
            this.titleLabel = titleLabel;
        }

        public String getTitlePlaceholder() {
            return titlePlaceholder;
        }

        public void setTitlePlaceholder(String titlePlaceholder) {
            this.titlePlaceholder = titlePlaceholder;
        }

        public String getDescriptionLabel() {
            return descriptionLabel;
        }

        public void setDescriptionLabel(String descriptionLabel) {
            this.descriptionLabel = descriptionLabel;
        }

        public String getDescriptionPlaceholder() {
            return descriptionPlaceholder;
        }

        public void setDescriptionPlaceholder(String descriptionPlaceholder) {
            this.descriptionPlaceholder = descriptionPlaceholder;
        }

        public String getButtonText() {
            return buttonText;
        }

        public void setButtonText(String buttonText) {
            this.buttonText = buttonText;
        }
    }
}
