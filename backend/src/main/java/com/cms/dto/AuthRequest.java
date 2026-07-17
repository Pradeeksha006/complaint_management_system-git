package com.cms.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class AuthRequest {
    @NotBlank(message = "Username or Email is required")
    private String usernameOrEmail;

    @NotBlank(message = "Password is required")
    private String password;
}
