package io.easystartup.suggestfeature.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * @author indianBond
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class FetchPostsRequestDTO {
    private String boardSlug;
    private String sortString;
    private String statusFilter;
    private Page page;

    public FetchPostsRequestDTO() {
    }

    public Page getPage() {
        return page;
    }

    public void setPage(Page page) {
        this.page = page;
    }

    public String getBoardSlug() {
        return boardSlug;
    }

    public void setBoardSlug(String boardSlug) {
        this.boardSlug = boardSlug;
    }

    public String getSortString() {
        return sortString;
    }

    public void setSortString(String sortString) {
        this.sortString = sortString;
    }

    public String getStatusFilter() {
        return statusFilter;
    }

    public void setStatusFilter(String statusFilter) {
        this.statusFilter = statusFilter;
    }
}
