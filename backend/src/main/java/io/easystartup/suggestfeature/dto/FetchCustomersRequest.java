package io.easystartup.suggestfeature.dto;


import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/*
 * @author indianBond
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class FetchCustomersRequest {

    private String cursor;

    public FetchCustomersRequest() {
    }

    public String getCursor() {
        return cursor;
    }

    public void setCursor(String cursor) {
        this.cursor = cursor;
    }
}
