package com.suzuki.bike.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public class UpdateProfileRequest {

    @Size(min = 3, max = 100)
    private String username;

    @Email(message = "Invalid email format")
    @Size(max = 255)
    private String email;

    public UpdateProfileRequest() {
    }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}
