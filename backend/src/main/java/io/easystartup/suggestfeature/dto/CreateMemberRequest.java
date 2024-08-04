package io.easystartup.suggestfeature.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import io.easystartup.suggestfeature.beans.Member;
import io.easystartup.suggestfeature.beans.Member.Role;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import static io.easystartup.suggestfeature.beans.Member.Role.ADMIN;
import static io.easystartup.suggestfeature.beans.Member.Role.USER;

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
    private Role role = USER;

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

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }
}
