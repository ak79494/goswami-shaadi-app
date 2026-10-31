package com.goswami.shaadi.controller;

import com.goswami.shaadi.dto.AuthDtos.*;
import com.goswami.shaadi.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService service;

    public AuthController(AuthService s) {
        service = s;
    }

    @PostMapping("/register")
    public AuthResponse register(
            @Valid @RequestBody RegisterRequest r
    ) {
        return service.register(r);
    }

    @PostMapping("/login")
    public AuthResponse login(
            @Valid @RequestBody LoginRequest r
    ) {
        return service.login(r);
    }

    // ==============================
    // FORGOT PASSWORD
    // ==============================

    @PostMapping("/heartbeat")
    public void heartbeat(Authentication authentication) {
        service.heartbeat((Long) authentication.getPrincipal());
    }

    @PostMapping("/forgot-password")
    public String forgotPassword(
            @RequestBody ForgotPasswordRequest request
    ) {

        service.sendForgotPasswordOtp(
                request.email()
        );

        return "OTP sent successfully to your email";
    }

    // ==============================
    // RESET PASSWORD
    // ==============================

    @PostMapping("/reset-password")
    public String resetPassword(
            @RequestBody ResetPasswordRequest request
    ) {

        service.resetPassword(
                request.email(),
                request.otp(),
                request.newPassword()
        );

        return "Password reset successfully";
    }
}