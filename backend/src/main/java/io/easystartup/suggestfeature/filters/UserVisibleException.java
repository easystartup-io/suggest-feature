package io.easystartup.suggestfeature.filters;

import jakarta.ws.rs.core.Response.Status;

/**
 * @author indianBond
 */
public class UserVisibleException extends RuntimeException {

    private Status status = Status.BAD_REQUEST;

    public UserVisibleException() {
        super();
    }

    public UserVisibleException(String message) {
        super(message);
    }

    public UserVisibleException(String message, Status status) {
        super(message);
        this.status = status;
    }

    public UserVisibleException(String message, Throwable cause) {
        super(message, cause);
    }

    public UserVisibleException(Throwable cause) {
        super(cause);
    }

    public UserVisibleException(String message, Throwable cause, boolean enableSuppression, boolean writableStackTrace) {
        super(message, cause, enableSuppression, writableStackTrace);
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }
}
