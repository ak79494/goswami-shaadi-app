package com.goswami.shaadi.service;

import com.goswami.shaadi.dto.AuthDtos.*;
import com.goswami.shaadi.model.*;
import com.goswami.shaadi.repository.UserRepository;
import com.goswami.shaadi.security.JwtService;
import com.goswami.shaadi.security.LoginGuard;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtService jwt;
    private final EmailService emailService;
    private final LoginGuard guard;

    private static final int MAX_OTP_TRIES = 5;

    private final Map<String, OtpData> otpStore = new ConcurrentHashMap<>();
    private final SecureRandom random = new SecureRandom();

    public AuthService(UserRepository u, PasswordEncoder e, JwtService j, EmailService emailService, LoginGuard guard) {
        users = u;
        encoder = e;
        jwt = j;
        this.emailService = emailService;
        this.guard = guard;
    }

    @Transactional
    public AuthResponse register(RegisterRequest r) {
        if (users.findByEmail(r.email()).isPresent() || users.findByPhone(r.phone()).isPresent()) {
            throw new IllegalArgumentException("Email or phone already registered");
        }

        User u = new User();
        u.setEmail(r.email());
        u.setPhone(r.phone());
        u.setPasswordHash(encoder.encode(r.password()));
        u.setGender(r.gender());

        // goswami_id is NOT NULL, but the real value needs the generated user id, so insert
        // with a unique placeholder first and replace it below in the same transaction.
        u.setGoswamiId("TMP" + UUID.randomUUID().toString().replace("-", "").substring(0, 16));

        // First save -> database generates User ID
        users.save(u);

        // Generate Goswami ID from database User ID
        String goswamiId = "GJ" + String.format("%04d", u.getId());
        u.setGoswamiId(goswamiId);

        // Save Goswami ID
        users.save(u);

        return new AuthResponse(
            jwt.generate(u.getId(), u.getEmail(), u.getRole().name()),
            u.getId(),
            u.getEmail(),
            u.getRole().name()
        );
    }

    public AuthResponse login(LoginRequest r) {
        guard.check(r.email());
        User u = users.findByEmail(r.email()).orElse(null);

        if (u == null || !encoder.matches(r.password(), u.getPasswordHash())) {
            guard.failed(r.email());
            throw new IllegalArgumentException("Invalid credentials");
        }
        guard.succeeded(r.email());

        if (!u.isEnabled()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "This account has been suspended. Please contact support.");
        }

        u.setLastActiveAt(LocalDateTime.now());
        users.save(u);

        return new AuthResponse(
            jwt.generate(u.getId(), u.getEmail(), u.getRole().name()),
            u.getId(),
            u.getEmail(),
            u.getRole().name()
        );
    }


    @Transactional
    public void heartbeat(Long uid) {
        User u = users.findById(uid)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        u.setLastActiveAt(LocalDateTime.now());
        users.save(u);
    }

    // ==============================
    // FORGOT PASSWORD - SEND OTP
    // ==============================

    public void sendForgotPasswordOtp(String email) {
        log.info("Processing forgot password for: {}", email);

        User user = users.findByEmail(email)
            .orElseThrow(() -> {
                log.warn("Email not found: {}", email);
                return new IllegalArgumentException("No account found with this email");
            });

        String otp = String.format("%06d", random.nextInt(1000000));
        LocalDateTime expiry = LocalDateTime.now().plusMinutes(10);

        otpStore.put(email, new OtpData(otp, expiry, 0));
        log.info("OTP generated for: {}, expiry: {}", email, expiry);

        try {
            emailService.sendOtpEmail(user.getEmail(), otp);
            log.info("✅ OTP sent successfully to: {}", email);
        } catch (Exception e) {
            otpStore.remove(email);
            log.error("❌ OTP sending failed for: {}", email, e);
            throw new RuntimeException("Unable to send OTP. Please check your email configuration.", e);
        }
    }

    // ==============================
    // RESET PASSWORD
    // ==============================

    @Transactional
    public void resetPassword(String email, String otp, String newPassword) {
        log.info("Resetting password for: {}", email);

        OtpData data = otpStore.get(email);

        if (data == null) {
            log.warn("OTP not found for: {}", email);
            throw new IllegalArgumentException("OTP not found. Please request a new OTP.");
        }

        if (LocalDateTime.now().isAfter(data.expiry())) {
            otpStore.remove(email);
            log.warn("OTP expired for: {}", email);
            throw new IllegalArgumentException("OTP has expired. Please request a new OTP.");
        }

        if (!data.otp().equals(otp)) {
            log.warn("Invalid OTP provided for: {}", email);
            // A 6-digit code could be guessed if tries were unlimited.
            if (data.tries() + 1 >= MAX_OTP_TRIES) {
                otpStore.remove(email);
                throw new IllegalArgumentException("Too many wrong codes. Please request a new OTP.");
            }
            otpStore.put(email, new OtpData(data.otp(), data.expiry(), data.tries() + 1));
            throw new IllegalArgumentException("Invalid OTP");
        }

        User user = users.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        user.setPasswordHash(encoder.encode(newPassword));
        users.save(user);

        otpStore.remove(email);
        log.info("✅ Password reset successful for: {}", email);
    }

    private record OtpData(String otp, LocalDateTime expiry, int tries) {}
}