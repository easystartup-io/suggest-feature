package io.easystartup.suggestfeature.dto;


import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * @author indianBond
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class DeletePostDTO {

    private String postId;

    public DeletePostDTO() {
    }

    public String getPostId() {
        return postId;
    }

    public void setPostId(String postId) {
        this.postId = postId;
    }
}
