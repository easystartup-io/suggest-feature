package io.easystartup.suggestfeature.dto;


import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotBlank;

import java.util.List;

/**
 * @author indianBond
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class ChangelogUpdateDTO {

    @NotBlank
    private String changelogId;
    private List<String> postIds;
    private String title;
    private String content;
    private List<String> tags;
    private Long changelogDate;
    private boolean draft;

    public ChangelogUpdateDTO() {
    }

    public @NotBlank String getChangelogId() {
        return changelogId;
    }

    public void setChangelogId(@NotBlank String changelogId) {
        this.changelogId = changelogId;
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
}
