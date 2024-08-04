package io.easystartup.suggestfeature.dto;


import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotBlank;

/*
 * @author indianBond
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class PostDetailsUpdateDTO {

    @NotBlank
    private String postId;
    private String status;
    private Boolean approved;
    private String priority;

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
}
