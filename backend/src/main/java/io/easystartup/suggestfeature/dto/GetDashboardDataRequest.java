package io.easystartup.suggestfeature.dto;


import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * @author indianBond
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class GetDashboardDataRequest {

    public enum TimeFrame {
        THIS_WEEK, THIS_MONTH, THIS_YEAR, LAST_WEEK, LAST_MONTH, LAST_YEAR
    }

    private String boardId = "ALL";
    private String timeFrame = "THIS_WEEK";

    public GetDashboardDataRequest() {
    }

    public String getBoardId() {
        return boardId;
    }

    public void setBoardId(String boardId) {
        this.boardId = boardId;
    }

    public String getTimeFrame() {
        return timeFrame;
    }

    public void setTimeFrame(String timeFrame) {
        this.timeFrame = timeFrame;
    }
}
