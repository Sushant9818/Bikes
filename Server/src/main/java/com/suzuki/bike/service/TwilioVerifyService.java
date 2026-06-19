package com.suzuki.bike.service;

import com.suzuki.bike.exception.InvalidOtpException;
import com.suzuki.bike.exception.MissingTwilioConfigException;
import com.suzuki.bike.exception.TwilioApiException;
import com.twilio.Twilio;
import com.twilio.exception.ApiException;
import com.twilio.rest.verify.v2.service.Verification;
import com.twilio.rest.verify.v2.service.VerificationCheck;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class TwilioVerifyService {

    private static final Logger log = LoggerFactory.getLogger(TwilioVerifyService.class);

    private static final String CONFIG_MESSAGE =
            "Twilio Verify is not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID.";

    @Value("${twilio.account-sid:}")
    private String accountSid;

    @Value("${twilio.auth-token:}")
    private String authToken;

    @Value("${twilio.verify-service-sid:}")
    private String verifyServiceSid;

    private boolean configured = false;

    @PostConstruct
    public void init() {
        if (hasText(accountSid) && hasText(authToken) && hasText(verifyServiceSid)) {
            try {
                Twilio.init(accountSid, authToken);
                configured = true;
                log.info("Twilio Verify initialized successfully");
            } catch (Exception e) {
                log.warn("Twilio init failed: {}", e.getMessage());
            }
        } else {
            log.warn("Twilio Verify not configured (missing env: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID)");
        }
    }

    public boolean isConfigured() {
        return configured;
    }

    private boolean hasText(String s) {
        return s != null && !s.isBlank();
    }

    private void ensureConfigured() {
        if (!configured) {
            throw new MissingTwilioConfigException(CONFIG_MESSAGE);
        }
    }

    /**
     * Send OTP to phone number via Twilio Verify.
     * Phone should be in E.164 or 10-digit Nepal format (98XXXXXXXX).
     *
     * @throws MissingTwilioConfigException 503 if Twilio env vars are not set
     * @throws TwilioApiException           502 if Twilio API call fails
     */
    public void sendOtp(String phoneNumber) {
        ensureConfigured();
        if (phoneNumber == null || phoneNumber.isBlank()) {
            throw new IllegalArgumentException("Phone number is required");
        }
        String to = toE164(phoneNumber);
        if (to == null || to.length() < 10) {
            throw new IllegalArgumentException("Invalid phone number format");
        }
        try {
            Verification.creator(verifyServiceSid, to, "sms").create();
        } catch (ApiException e) {
            log.warn("Twilio Verify send failed: {}", e.getMessage());
            throw new TwilioApiException("Failed to send OTP: " + e.getMessage(), e);
        } catch (Exception e) {
            log.warn("Twilio Verify send error", e);
            throw new TwilioApiException("Failed to send OTP", e);
        }
    }

    /**
     * Verify OTP code. Returns true if valid and approved.
     *
     * @throws MissingTwilioConfigException 503 if Twilio env vars are not set
     * @throws InvalidOtpException          400 if code is invalid or expired
     * @throws TwilioApiException          502 if Twilio API call fails
     */
    public boolean verifyOtp(String phoneNumber, String code) {
        ensureConfigured();
        if (phoneNumber == null || phoneNumber.isBlank()) {
            throw new IllegalArgumentException("Phone number is required");
        }
        if (code == null || code.isBlank()) {
            throw new InvalidOtpException("Verification code is required");
        }
        String to = toE164(phoneNumber);
        if (to == null || to.length() < 10) {
            throw new IllegalArgumentException("Invalid phone number format");
        }
        try {
            VerificationCheck verificationCheck = VerificationCheck.creator(verifyServiceSid)
                    .setTo(to)
                    .setCode(code.trim())
                    .create();
            if (!"approved".equals(verificationCheck.getStatus())) {
                throw new InvalidOtpException("Invalid or expired verification code");
            }
            return true;
        } catch (InvalidOtpException e) {
            throw e;
        } catch (ApiException e) {
            if (e.getStatusCode() == 404 || (e.getMessage() != null && e.getMessage().toLowerCase().contains("invalid"))) {
                throw new InvalidOtpException("Invalid or expired verification code");
            }
            log.warn("Twilio Verify check failed: {}", e.getMessage());
            throw new TwilioApiException("Failed to verify OTP: " + e.getMessage(), e);
        } catch (Exception e) {
            log.warn("Twilio Verify check error", e);
            throw new TwilioApiException("Failed to verify OTP", e);
        }
    }

    /**
     * Convert 10-digit Nepal phone (98XXXXXXXX) to E.164 (+97798XXXXXXXX).
     */
    private String toE164(String phone) {
        if (phone == null) return null;
        String digits = phone.replaceAll("\\D", "");
        if (digits.length() == 10 && digits.startsWith("98")) {
            return "+977" + digits;
        }
        if (digits.startsWith("977")) {
            return "+" + digits;
        }
        if (!phone.startsWith("+")) {
            return "+977" + digits;
        }
        return phone;
    }

    /**
     * Mask phone number for display: 98******12
     */
    public static String maskPhone(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.length() < 6) return "******";
        String digits = phoneNumber.replaceAll("\\D", "");
        if (digits.length() < 6) return "******";
        return digits.substring(0, 2) + "******" + digits.substring(digits.length() - 2);
    }
}
