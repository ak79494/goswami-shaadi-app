package com.goswami.shaadi.dto;
import com.goswami.shaadi.model.Gender;
import jakarta.validation.constraints.*;
public class AuthDtos {
 public record RegisterRequest(@Email @NotBlank String email,@NotBlank @Size(min=8) String password,@NotBlank String phone,@NotNull Gender gender){}
 public record LoginRequest(@NotBlank String email,@NotBlank String password){}
 public record AuthResponse(String token,Long userId,String email,String role){}
 public record DeleteAccountRequest(@NotBlank String password,@Size(max=200) String reason){}
 public record DeleteWithLoginRequest(@NotBlank String email,@NotBlank String password,@Size(max=200) String reason){}
 public record ForgotPasswordRequest(
         String email
 ) {}

 public record ResetPasswordRequest(
         String email,
         String otp,
         String newPassword
 ) {}
}
