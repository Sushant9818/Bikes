package com.suzuki.bike.exception;

/**
 * Thrown when OTP code is invalid or expired.
 * Mapped to 400 Bad Request.
 */
public class InvalidOtpException extends RuntimeException {

    public InvalidOtpException(String message) {
        super(message);
    }
}
