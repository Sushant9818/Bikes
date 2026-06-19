package com.suzuki.bike.service;

import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory rate limiter for OTP resend. Do not allow resend more than once every 30 seconds per phone.
 * For production, consider Redis-based rate limiting.
 */
@Component
public class OtpRateLimiter {

    private static final long COOLDOWN_MS = 30_000;

    private final Map<String, Long> lastSentByPhone = new ConcurrentHashMap<>();

    public boolean canSend(String phoneNumber) {
        Long last = lastSentByPhone.get(phoneNumber);
        if (last == null) return true;
        return System.currentTimeMillis() - last >= COOLDOWN_MS;
    }

    public void recordSend(String phoneNumber) {
        lastSentByPhone.put(phoneNumber, System.currentTimeMillis());
    }

    public long secondsUntilCanResend(String phoneNumber) {
        Long last = lastSentByPhone.get(phoneNumber);
        if (last == null) return 0;
        long elapsed = System.currentTimeMillis() - last;
        if (elapsed >= COOLDOWN_MS) return 0;
        return (COOLDOWN_MS - elapsed) / 1000;
    }
}
