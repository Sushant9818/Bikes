package com.suzuki.bike.dto;

import com.suzuki.bike.entity.enums.Role;

public class LoginResponse {

    private String token;
    private String username;
    private Role role;

    public LoginResponse() {
    }

    public LoginResponse(String token, String username, Role role) {
        this.token = token;
        this.username = username;
        this.role = role;
    }

    public static LoginResponseBuilder builder() {
        return new LoginResponseBuilder();
    }

    public static class LoginResponseBuilder {
        private String token;
        private String username;
        private Role role;

        public LoginResponseBuilder token(String token) {
            this.token = token;
            return this;
        }

        public LoginResponseBuilder username(String username) {
            this.username = username;
            return this;
        }

        public LoginResponseBuilder role(Role role) {
            this.role = role;
            return this;
        }

        public LoginResponse build() {
            return new LoginResponse(token, username, role);
        }
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
}
