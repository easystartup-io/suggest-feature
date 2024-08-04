package io.easystartup.suggestfeature.dto;


import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotBlank;

/*
 * @author indianBond
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class SearchPostDTO {
    @NotBlank
    private String query;
    private String boardSlug;

    public SearchPostDTO() {
    }

    public String getQuery() {
        return query;
    }

    public void setQuery(String query) {
        this.query = query;
    }

    public String getBoardSlug() {
        return boardSlug;
    }

    public void setBoardSlug(String boardSlug) {
        this.boardSlug = boardSlug;
    }
}
