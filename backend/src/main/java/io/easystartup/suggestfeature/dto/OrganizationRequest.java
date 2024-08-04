package io.easystartup.suggestfeature.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotBlank;

/*
 * @author indianBond
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class OrganizationRequest {

    @NotBlank
    private String organizationName;
    @NotBlank
    private String organizationSlug;

    public OrganizationRequest() {
    }

    public String getOrganizationName() {
        return organizationName;
    }

    public void setOrganizationName(String organizationName) {
        this.organizationName = organizationName;
    }

    public String getOrganizationSlug() {
        return organizationSlug;
    }

    public void setOrganizationSlug(String organizationSlug) {
        this.organizationSlug = organizationSlug;
    }
}
