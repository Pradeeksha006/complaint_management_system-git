package com.cms.dto;

import lombok.Data;

@Data
public class ResetPasswordRequest {
    private String email;
    private String code; // Will contain OTP for citizens or PIN for staff
    private String newPassword;
}
