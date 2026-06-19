package com.suzuki.bike.dto;

public class RegisterResponse {

    private String message;
    private String phoneNumberMasked;

    public RegisterResponse() {
    }

    public RegisterResponse(String message, String phoneNumberMasked) {
        this.message = message;
        this.phoneNumberMasked = phoneNumberMasked;
    }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getPhoneNumberMasked() { return phoneNumberMasked; }
    public void setPhoneNumberMasked(String phoneNumberMasked) { this.phoneNumberMasked = phoneNumberMasked; }
}
