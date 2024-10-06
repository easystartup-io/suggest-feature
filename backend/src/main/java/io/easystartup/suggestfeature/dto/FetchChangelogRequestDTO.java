package io.easystartup.suggestfeature.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

/**
 * @author indianBond
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class FetchChangelogRequestDTO {
    private String sortString;
    private List<String> tagFilter;
    private Page page;

    public FetchChangelogRequestDTO() {
    }

    public String getSortString() {
        return sortString;
    }

    public void setSortString(String sortString) {
        this.sortString = sortString;
    }

    public List<String> getTagFilter() {
        return tagFilter;
    }

    public void setTagFilter(List<String> tagFilter) {
        this.tagFilter = tagFilter;
    }

    public Page getPage() {
        return page;
    }

    public void setPage(Page page) {
        this.page = page;
    }
}
