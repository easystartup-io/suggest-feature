package io.easystartup.suggestfeature.dto;


import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/*
 * @author indianBond
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class CheckoutRequestDTO {
    private String plan;

    public String getPlan() {
        return plan;
    }

    public void setPlan(String plan) {
        this.plan = plan;
    }
}
