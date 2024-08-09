package io.easystartup.suggestfeature.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import io.easystartup.suggestfeature.beans.Member;
import io.easystartup.suggestfeature.beans.User;

@JsonIgnoreProperties(ignoreUnknown = true)
public class LoginResponse {

    private String token;
    private User user;
    private String organizationSlug;
    private Member.Role role;

    public LoginResponse(String token, User user) {
        this.token = token;
        this.user = user;
    }

    public LoginResponse(String token, User user, String organizationSlug, Member.Role role) {
        this.token = token;
        this.user = user;
        this.organizationSlug = organizationSlug;
        this.role = role;
    }

    public LoginResponse() {
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getOrganizationSlug() {
        return organizationSlug;
    }

    public void setOrganizationSlug(String organizationSlug) {
        this.organizationSlug = organizationSlug;
    }

    public Member.Role getRole() {
        return role;
    }

    public void setRole(Member.Role role) {
        this.role = role;
    }
}
