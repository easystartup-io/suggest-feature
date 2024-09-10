package io.easystartup.suggestfeature.dto;


import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import io.easystartup.suggestfeature.beans.Attachment;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * @author indianBond
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class PostDetailsUpdateDTO {

    @NotBlank
    private String postId;
    private String status;
    private Boolean approved;
    private String priority;
    private String title;
    private String description;
    private List<Attachment> attachments;

    public PostDetailsUpdateDTO() {
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public String getPostId() {
        return postId;
    }

    public void setPostId(String postId) {
        this.postId = postId;
    }

    public Boolean getApproved() {
        return approved;
    }

    public void setApproved(Boolean approved) {
        this.approved = approved;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public List<Attachment> getAttachments() {
        return attachments;
    }

    public void setAttachments(List<Attachment> attachments) {
        this.attachments = attachments;
    }
}
