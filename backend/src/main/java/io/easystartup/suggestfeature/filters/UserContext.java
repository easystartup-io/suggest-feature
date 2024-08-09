package io.easystartup.suggestfeature.filters;

import io.easystartup.suggestfeature.beans.Member.Role;

public class UserContext {

    private static final ThreadLocal<UserContext> context = new ThreadLocal<>();
    private static final UserContext NO_OP = new UserContext(null, null, null, null) {
        @Override
        public UserContext start() {
            context.remove();
            return NO_OP;
        }
    };

    private String userId;
    private String userName;
    private String orgId;
    private Role role;

    public UserContext(String userId, String userName, String orgId, Role role) {
        this.userId = userId;
        this.userName = userName;
        this.orgId = orgId;
        this.role = role;
    }

    public static UserContext current() {
        UserContext currentUserContext = context.get();
        return currentUserContext == null ? NO_OP : currentUserContext;
    }

    public UserContext start() {
        UserContext previous = context.get();
        context.set(this);
        return previous == null ? NO_OP : previous;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getOrgId() {
        return orgId;
    }

    public void setOrgId(String orgId) {
        this.orgId = orgId;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }
}
