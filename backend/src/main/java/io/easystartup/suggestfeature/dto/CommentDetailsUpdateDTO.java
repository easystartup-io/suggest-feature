package io.easystartup.suggestfeature.dto;


import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotBlank;

/**
 * @author indianBond
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class CommentDetailsUpdateDTO {
    @NotBlank
    private String commentId;
    private String content;

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
}
