package io.easystartup.suggestfeature.dto;


import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * @author indianBond
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class CheckoutRequestDTO {
    private String plan;
    private String currentUrl;

    public String getPlan() {
        return plan;
    }

    public void setPlan(String plan) {
        this.plan = plan;
    }

    public String getCurrentUrl() {
        return currentUrl;
    }

    public void setCurrentUrl(String currentUrl) {
        this.currentUrl = currentUrl;
    }
}
