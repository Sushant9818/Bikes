package com.suzuki.bike.exception;

/**
 * Thrown when Twilio API call fails (network, invalid request, etc.).
 * Mapped to 502 Bad Gateway.
 */
public class TwilioApiException extends RuntimeException {

    public TwilioApiException(String message) {
        super(message);
    }

    public TwilioApiException(String message, Throwable cause) {
        super(message, cause);
    }
}
