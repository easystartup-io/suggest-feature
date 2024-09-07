package io.easystartup.suggestfeature.beans;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.Size;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * @author indianBond
 */
@Document
@JsonIgnoreProperties(ignoreUnknown = true)
public class User {
    public static final String FIELD_EMAIL = "email";
    public static final String FIELD_ID = "_id";
    public static final String FIELD_NAME = "name";
    public static final String FIELD_PROFILE_PIC = "profilePic";
    public static final String FIELD_CREATED_AT = "createdAt";

    public static final String FIELD_USER_BLOCKED_UNTIL = "userBlockedUntil";
    public static final String FIELD_INCORRECT_ATTEMPT_COUNT = "incorrectAttemptCount";
    public static final String FIELD_MAGIC_LINK_SENT_COUNT = "magicLinkSentCount";
    public static final String FIELD_MAGIC_LINK_CODE = "magicLinkCode";
    public static final String FIELD_MAGIC_LINK_VALID_TILL = "magicLinkValidTill";

    @Id
    private String id;

    private Long createdAt;

    @Size(max = 500)
    private String name;

    @Indexed(unique = true)
    private String email;
    private String password;
    private boolean verifiedEmail;

    private String magicLinkCode;
    private Long magicLinkValidTill;

    private Long incorrectAttemptCount;
    private Long userBlockedUntil;
    private Long magicLinkSentCount;
    private String profilePic;

    // When rendering result displaying whether user is a member of the org
    @Transient
    private boolean partOfOrg;

    public User() {
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public boolean isVerifiedEmail() {
        return verifiedEmail;
    }

    public void setVerifiedEmail(boolean verifiedEmail) {
        this.verifiedEmail = verifiedEmail;
    }

    public Long getUserBlockedUntil() {
        return userBlockedUntil;
    }

    public void setUserBlockedUntil(Long userBlockedUntil) {
        this.userBlockedUntil = userBlockedUntil;
    }

    public Long getIncorrectAttemptCount() {
        return incorrectAttemptCount;
    }

    public void setIncorrectAttemptCount(Long incorrectAttemptCount) {
        this.incorrectAttemptCount = incorrectAttemptCount;
    }

    public Long getMagicLinkSentCount() {
        return magicLinkSentCount;
    }

    public void setMagicLinkSentCount(Long magicLinkSentCount) {
        this.magicLinkSentCount = magicLinkSentCount;
    }

    public String getMagicLinkCode() {
        return magicLinkCode;
    }

    public void setMagicLinkCode(String magicLinkCode) {
        this.magicLinkCode = magicLinkCode;
    }

    public Long getMagicLinkValidTill() {
        return magicLinkValidTill;
    }

    public void setMagicLinkValidTill(Long magicLinkValidTill) {
        this.magicLinkValidTill = magicLinkValidTill;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getProfilePic() {
        return profilePic;
    }

    public void setProfilePic(String profilePic) {
        this.profilePic = profilePic;
    }

    public Long getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Long createdAt) {
        this.createdAt = createdAt;
    }

    public boolean isPartOfOrg() {
        return partOfOrg;
    }

    public void setPartOfOrg(boolean partOfOrg) {
        this.partOfOrg = partOfOrg;
    }
}
