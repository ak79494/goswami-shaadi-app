package com.goswami.shaadi.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.util.Properties;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @PostConstruct
    public void testMailConfig() {
        try {
            JavaMailSenderImpl impl = (JavaMailSenderImpl) mailSender;
            log.info("Mail Host: {}", impl.getHost());
            log.info("Mail Port: {}", impl.getPort());
            log.info("Mail Username: {}", impl.getUsername());
            log.info("Mail Password: {}", impl.getPassword() != null ? "✅ Set" : "❌ Not Set");
        } catch (Exception e) {
            log.error("Mail config error: ", e);
        }
    }

    public void sendOtpEmail(String email, String otp) {
        try {
            log.info("Attempting to send OTP to: {}", email);

            SimpleMailMessage message = new SimpleMailMessage();

            message.setTo(email);
            message.setSubject("Goswami Jodi - Password Reset OTP");
            message.setText(
                "Hello,\n\n" +
                "Your password reset OTP is: " + otp + "\n\n" +
                "This OTP is valid for 10 minutes.\n\n" +
                "If you did not request a password reset, " +
                "please ignore this email.\n\n" +
                "Regards,\n" +
                "Goswami Jodi Team"
            );

            mailSender.send(message);
            log.info("✅ OTP email sent successfully to: {}", email);

        } catch (Exception e) {
            log.error("❌ Failed to send OTP email to: {}", email, e);
            throw new RuntimeException("Failed to send OTP: " + e.getMessage(), e);
        }
    }
}