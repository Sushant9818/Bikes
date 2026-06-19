package com.suzuki.bike.service;

import com.suzuki.bike.dto.ChangePasswordRequest;
import com.suzuki.bike.dto.UpdateProfileRequest;
import com.suzuki.bike.dto.UserDto;
import com.suzuki.bike.entity.User;
import com.suzuki.bike.entity.VerificationToken;
import com.suzuki.bike.exception.ResourceNotFoundException;
import com.suzuki.bike.repository.UserRepository;
import com.suzuki.bike.repository.VerificationTokenRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final VerificationTokenRepository verificationTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    private static final int VERIFICATION_EXPIRY_HOURS = 24;

    public UserService(UserRepository userRepository,
                       VerificationTokenRepository verificationTokenRepository,
                       PasswordEncoder passwordEncoder,
                       EmailService emailService) {
        this.userRepository = userRepository;
        this.verificationTokenRepository = verificationTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    public User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return null;
        }
        return userRepository.findByUsername(auth.getName())
                .orElse(null);
    }

    public UserDto getMe() {
        User user = getCurrentUser();
        if (user == null) {
            throw new ResourceNotFoundException("User", 0L);
        }
        return toDto(user);
    }

    @Transactional
    public UserDto updateMe(UpdateProfileRequest request) {
        User user = getCurrentUser();
        if (user == null) {
            throw new ResourceNotFoundException("User", 0L);
        }

        if (request.getUsername() != null && !request.getUsername().isBlank()) {
            if (!request.getUsername().equals(user.getUsername()) && userRepository.existsByUsername(request.getUsername())) {
                throw new IllegalArgumentException("Username already taken");
            }
            user.setUsername(request.getUsername());
        }

        boolean emailChanged = false;
        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            if (!request.getEmail().equals(user.getEmail())) {
                if (userRepository.existsByEmail(request.getEmail())) {
                    throw new IllegalArgumentException("Email already in use");
                }
                user.setEmail(request.getEmail());
                user.setEnabled(false);
                user.setEmailVerifiedAt(null);
                emailChanged = true;
            }
        }

        user.setUpdatedAt(Instant.now());
        user = userRepository.save(user);

        if (emailChanged) {
            String token = UUID.randomUUID().toString().replace("-", "");
            VerificationToken vt = new VerificationToken();
            vt.setToken(token);
            vt.setUser(user);
            vt.setExpiresAt(Instant.now().plusSeconds(VERIFICATION_EXPIRY_HOURS * 3600L));
            verificationTokenRepository.save(vt);
            emailService.sendVerificationEmail(user.getEmail(), user.getUsername(), token);
        }

        return toDto(user);
    }

    @Transactional
    public void changePassword(ChangePasswordRequest request) {
        User user = getCurrentUser();
        if (user == null) {
            throw new ResourceNotFoundException("User", 0L);
        }
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);
    }

    private UserDto toDto(User user) {
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setPhoneNumber(user.getPhoneNumber());
        dto.setRole(user.getRole());
        dto.setEmailVerifiedAt(user.getEmailVerifiedAt());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setEnabled(user.isEnabled());
        return dto;
    }
}
