package com.suzuki.bike.exception;

/**
 * Thrown when Twilio Verify is required but env vars are missing.
 * Mapped to 503 Service Unavailable.
 */
public class MissingTwilioConfigException extends RuntimeException {

    public MissingTwilioConfigException(String message) {
        super(message);
    }
}
