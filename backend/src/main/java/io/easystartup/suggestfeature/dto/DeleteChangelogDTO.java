package io.easystartup.suggestfeature.dto;


import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * @author indianBond
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class DeleteChangelogDTO {

    private String changelogId;

    public DeleteChangelogDTO() {
    }

    public String getChangelogId() {
        return changelogId;
    }

    public void setChangelogId(String changelogId) {
        this.changelogId = changelogId;
    }
}
