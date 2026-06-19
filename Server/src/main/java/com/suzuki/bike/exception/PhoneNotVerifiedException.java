package com.suzuki.bike.exception;

public class PhoneNotVerifiedException extends RuntimeException {

    public PhoneNotVerifiedException() {
        super("Phone not verified. Please verify OTP.");
    }

    public PhoneNotVerifiedException(String message) {
        super(message);
    }
}
