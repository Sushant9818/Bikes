package com.suzuki.bike.service;

import com.suzuki.bike.config.JwtService;
import com.suzuki.bike.dto.*;
import com.suzuki.bike.entity.PasswordResetToken;
import com.suzuki.bike.entity.User;
import com.suzuki.bike.entity.VerificationToken;
import com.suzuki.bike.entity.enums.Role;
import com.suzuki.bike.exception.PhoneNotVerifiedException;
import com.suzuki.bike.repository.PasswordResetTokenRepository;
import com.suzuki.bike.repository.UserRepository;
import com.suzuki.bike.repository.VerificationTokenRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final VerificationTokenRepository verificationTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final TwilioVerifyService twilioVerifyService;
    private final OtpRateLimiter otpRateLimiter;

    private static final int VERIFICATION_EXPIRY_HOURS = 24;
    private static final int RESET_PASSWORD_EXPIRY_MINUTES = 60;

    public AuthService(UserRepository userRepository,
                       VerificationTokenRepository verificationTokenRepository,
                       PasswordResetTokenRepository passwordResetTokenRepository,
                       AuthenticationManager authenticationManager,
                       JwtService jwtService,
                       PasswordEncoder passwordEncoder,
                       EmailService emailService,
                       TwilioVerifyService twilioVerifyService,
                       OtpRateLimiter otpRateLimiter) {
        this.userRepository = userRepository;
        this.verificationTokenRepository = verificationTokenRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.twilioVerifyService = twilioVerifyService;
        this.otpRateLimiter = otpRateLimiter;
    }

    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username already exists");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new com.suzuki.bike.exception.EmailAlreadyExistsException("Email already exists");
        }
        if (userRepository.existsByPhoneNumber(request.getPhoneNumber())) {
            throw new IllegalArgumentException("Phone number already exists");
        }
        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.CLIENT)
                .build();
        user.setPhoneNumber(request.getPhoneNumber());

        if (twilioVerifyService.isConfigured()) {
            user.setPhoneVerified(false);
            user.setEnabled(false);
            user = userRepository.save(user);
            twilioVerifyService.sendOtp(request.getPhoneNumber());
            otpRateLimiter.recordSend(request.getPhoneNumber());
            String phoneMasked = TwilioVerifyService.maskPhone(request.getPhoneNumber());
            return new RegisterResponse("OTP sent", phoneMasked);
        } else {
            // Twilio not configured — auto-verify and enable the account
            user.setPhoneVerified(true);
            user.setEnabled(true);
            userRepository.save(user);
            return new RegisterResponse("Registration successful. You can now login.", TwilioVerifyService.maskPhone(request.getPhoneNumber()));
        }
    }

    @Transactional
    public void sendOtp(SendOtpRequest request) {
        User user = userRepository.findByPhoneNumber(request.getPhoneNumber())
                .orElseThrow(() -> new IllegalArgumentException("No account found with this phone number"));
        if (user.isPhoneVerified()) {
            throw new IllegalArgumentException("Phone already verified. Please login.");
        }
        if (!otpRateLimiter.canSend(request.getPhoneNumber())) {
            long secs = otpRateLimiter.secondsUntilCanResend(request.getPhoneNumber());
            throw new IllegalArgumentException("Please wait " + secs + " seconds before requesting a new code.");
        }
        twilioVerifyService.sendOtp(request.getPhoneNumber());
        otpRateLimiter.recordSend(request.getPhoneNumber());
    }

    @Transactional
    public void verifyOtp(VerifyOtpRequest request) {
        User user = userRepository.findByPhoneNumber(request.getPhoneNumber())
                .orElseThrow(() -> new IllegalArgumentException("No account found with this phone number"));
        twilioVerifyService.verifyOtp(request.getPhoneNumber(), request.getCode());
        user.setPhoneVerified(true);
        user.setEnabled(true);
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);
    }

    public LoginResponse login(LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
            );
        } catch (AuthenticationException e) {
            throw new BadCredentialsException("Invalid username or password");
        }

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));

        if (user.getRole() == Role.CLIENT && !user.isPhoneVerified()) {
            throw new PhoneNotVerifiedException("Phone not verified. Please verify OTP.");
        }

        if (!user.isEnabled()) {
            throw new BadCredentialsException("Account is disabled. Please verify your phone.");
        }

        String token = jwtService.generateToken(user);

        return LoginResponse.builder()
                .token(token)
                .username(user.getUsername())
                .role(user.getRole())
                .build();
    }

    @Transactional
    public void verifyEmail(String tokenStr) {
        VerificationToken vt = verificationTokenRepository.findByToken(tokenStr)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired verification token"));

        if (vt.getUsedAt() != null) {
            throw new IllegalArgumentException("This verification link has already been used");
        }
        if (vt.getExpiresAt().isBefore(Instant.now())) {
            throw new IllegalArgumentException("Verification link has expired");
        }

        User user = vt.getUser();
        user.setEnabled(true);
        user.setEmailVerifiedAt(Instant.now());
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);

        vt.setUsedAt(Instant.now());
        verificationTokenRepository.save(vt);
    }

    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        userRepository.findByEmail(request.getEmail()).ifPresent(user -> {
            String token = UUID.randomUUID().toString().replace("-", "");
            PasswordResetToken prt = new PasswordResetToken();
            prt.setToken(token);
            prt.setUser(user);
            prt.setExpiresAt(Instant.now().plusSeconds(RESET_PASSWORD_EXPIRY_MINUTES * 60L));
            passwordResetTokenRepository.save(prt);
            emailService.sendResetPasswordEmail(user.getEmail(), user.getUsername(), token);
        });
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        PasswordResetToken prt = passwordResetTokenRepository.findByToken(request.getToken())
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired reset token"));

        if (prt.getUsedAt() != null) {
            throw new IllegalArgumentException("This reset link has already been used");
        }
        if (prt.getExpiresAt().isBefore(Instant.now())) {
            throw new IllegalArgumentException("Reset link has expired");
        }

        User user = prt.getUser();
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);

        prt.setUsedAt(Instant.now());
        passwordResetTokenRepository.save(prt);
    }
}
