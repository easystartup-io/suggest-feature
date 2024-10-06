package io.easystartup.suggestfeature.dto;


import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotBlank;

/**
 * @author indianBond
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class SearchChangelogDTO {
    @NotBlank
    private String query;

    public SearchChangelogDTO() {
    }

    public String getQuery() {
        return query;
    }

    public void setQuery(String query) {
        this.query = query;
    }
}
