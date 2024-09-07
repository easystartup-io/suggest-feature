package io.easystartup.suggestfeature.beans;


import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * @author indianBond
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class StatusConfig {
    private static final String FIELD_STATUS = "status";
    private static final String FIELD_COLOR = "color";

    private String status;
    private String color;

    public StatusConfig() {
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }
}
