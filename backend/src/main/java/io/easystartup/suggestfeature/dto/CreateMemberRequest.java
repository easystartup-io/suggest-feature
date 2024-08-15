package io.easystartup.suggestfeature.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import io.easystartup.suggestfeature.beans.Member;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/*
 * @author indianBond
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class CreateMemberRequest {

    @NotBlank
    private String name;
    @NotBlank
    private String email;
    @NotNull
    private Member.Role role;

    public CreateMemberRequest() {
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Member.Role getRole() {
        return role;
    }

    public void setRole(Member.Role role) {
        this.role = role;
    }
}
