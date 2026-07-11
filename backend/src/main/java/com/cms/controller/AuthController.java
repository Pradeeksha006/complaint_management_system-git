package com.cms.controller;

import com.cms.dto.*;
import com.cms.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;

    @PostMapping("/register")
    public ResponseEntity<UserDto> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(userService.registerUser(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request) {
        return ResponseEntity.ok(userService.loginUser(request));
    }

    @GetMapping("/verify-email")
    public ResponseEntity<MessageResponse> verifyEmail(@RequestParam String token) {
        userService.verifyEmail(token);
        return ResponseEntity.ok(new MessageResponse("Email verified successfully. You can now log in."));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ForgotPasswordResponse> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        return ResponseEntity.ok(userService.initiateOtpForgotPassword(email));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<MessageResponse> resetPassword(@RequestBody ResetPasswordRequest request) {
        userService.verifyAndResetPassword(request);
        return ResponseEntity.ok(new MessageResponse("Password reset successful. You can now log in with your new password."));
    }

    @PostMapping("/verify-reset-otp")
    public ResponseEntity<MessageResponse> verifyResetOtp(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String code = body.get("code");
        userService.verifyResetOtp(email, code);
        return ResponseEntity.ok(new MessageResponse("Verification successful."));
    }

    @PostMapping("/register/verify-otp")
    public ResponseEntity<MessageResponse> verifyRegistrationOtp(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String code = body.get("code");
        userService.verifyRegistrationOtp(email, code);
        return ResponseEntity.ok(new MessageResponse("Email verification successful! Your account is now activated."));
    }

    @PostMapping("/register/resend-otp")
    public ResponseEntity<MessageResponse> resendRegistrationOtp(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        userService.resendRegistrationOtp(email);
        return ResponseEntity.ok(new MessageResponse("A new verification code has been sent to your email."));
    }

    @PostMapping("/logout")
    public ResponseEntity<MessageResponse> logout() {
        userService.logoutUser();
        return ResponseEntity.ok(new MessageResponse("Logged out successfully."));
    }
}
