package com.cms.dto;

import lombok.Data;

@Data
public class ProfileUpdateRequest {
    private String phoneNumber;
    private String fullName;
    private String currentPassword;
    private String newPassword;
    private String confirmPassword;
}
