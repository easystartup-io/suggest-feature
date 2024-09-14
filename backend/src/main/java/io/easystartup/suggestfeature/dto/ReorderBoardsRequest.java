package io.easystartup.suggestfeature.dto;


import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

/*
 * @author indianBond
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class ReorderBoardsRequest {

    private List<String> boardIds;

    public ReorderBoardsRequest() {
    }

    public List<String> getBoardIds() {
        return boardIds;
    }

    public void setBoardIds(List<String> boardIds) {
        this.boardIds = boardIds;
    }
}
