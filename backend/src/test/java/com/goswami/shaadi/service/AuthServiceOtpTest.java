package com.goswami.shaadi.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

import com.goswami.shaadi.model.User;
import com.goswami.shaadi.repository.UserRepository;
import com.goswami.shaadi.security.JwtService;
import com.goswami.shaadi.security.LoginGuard;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

class AuthServiceOtpTest {

    private static final String EMAIL = "member@example.com";

    private final UserRepository users = mock(UserRepository.class);
    private final PasswordEncoder encoder = mock(PasswordEncoder.class);
    private final EmailService email = mock(EmailService.class);
    private final AtomicReference<String> sentOtp = new AtomicReference<>();
    private AuthService auth;
    private User user;

    @BeforeEach
    void setUp() throws Exception {
        user = new User();
        user.setEmail(EMAIL);
        user.setPasswordHash("old");
        when(users.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(encoder.encode(anyString())).thenReturn("new");
        doAnswer(i -> {
            sentOtp.set(i.getArgument(1));
            return null;
        }).when(email).sendOtpEmail(anyString(), anyString());
        auth = new AuthService(users, encoder, mock(JwtService.class), email, new LoginGuard());
        auth.sendForgotPasswordOtp(EMAIL);
    }

    private String wrongOtp() {
        return "000000".equals(sentOtp.get()) ? "111111" : "000000";
    }

    @Test
    void rightCodeResetsThePassword() {
        auth.resetPassword(EMAIL, sentOtp.get(), "new-password");
        assertEquals("new", user.getPasswordHash());
    }

    @Test
    void aFewWrongCodesThenTheRightOneStillWorks() {
        for (int i = 0; i < 4; i++) {
            assertThrows(IllegalArgumentException.class, () -> auth.resetPassword(EMAIL, wrongOtp(), "x"));
        }
        auth.resetPassword(EMAIL, sentOtp.get(), "new-password");
        assertEquals("new", user.getPasswordHash());
    }

    @Test
    void fiveWrongCodesCancelTheCode() {
        for (int i = 0; i < 4; i++) {
            assertThrows(IllegalArgumentException.class, () -> auth.resetPassword(EMAIL, wrongOtp(), "x"));
        }
        IllegalArgumentException fifth = assertThrows(IllegalArgumentException.class, () -> auth.resetPassword(EMAIL, wrongOtp(), "x"));
        assertTrue(fifth.getMessage().contains("request a new OTP"));
        assertThrows(IllegalArgumentException.class, () -> auth.resetPassword(EMAIL, sentOtp.get(), "x"));
        assertEquals("old", user.getPasswordHash());
    }
}
