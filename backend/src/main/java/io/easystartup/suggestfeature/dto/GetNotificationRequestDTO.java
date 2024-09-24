package io.easystartup.suggestfeature.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import static io.easystartup.suggestfeature.beans.Notification.NotificationType;

/*
 * @author indianBond
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class GetNotificationRequestDTO {

    private String boardId;
    private String createdByUserType;
    private NotificationType notificationType;

    public GetNotificationRequestDTO() {
    }

    public String getBoardId() {
        return boardId;
    }

    public void setBoardId(String boardId) {
        this.boardId = boardId;
    }

    public NotificationType getNotificationType() {
        return notificationType;
    }

    public void setNotificationType(NotificationType notificationType) {
        this.notificationType = notificationType;
    }

    public String getCreatedByUserType() {
        return createdByUserType;
    }

    public void setCreatedByUserType(String createdByUserType) {
        this.createdByUserType = createdByUserType;
    }
}
