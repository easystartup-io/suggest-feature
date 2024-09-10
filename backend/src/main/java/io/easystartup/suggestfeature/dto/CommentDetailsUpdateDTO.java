package io.easystartup.suggestfeature.dto;


import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import io.easystartup.suggestfeature.beans.Attachment;
import jakarta.validation.constraints.NotBlank;

import java.util.List;

/**
 * @author indianBond
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class CommentDetailsUpdateDTO {
    @NotBlank
    private String commentId;
    private String content;
    private List<Attachment> attachments;

    public CommentDetailsUpdateDTO() {
    }

    public String getCommentId() {
        return commentId;
    }

    public void setCommentId(String commentId) {
        this.commentId = commentId;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public List<Attachment> getAttachments() {
        return attachments;
    }

    public void setAttachments(List<Attachment> attachments) {
        this.attachments = attachments;
    }
}
