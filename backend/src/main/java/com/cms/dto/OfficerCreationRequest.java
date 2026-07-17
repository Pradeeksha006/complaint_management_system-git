package com.cms.dto;

import lombok.Data;

@Data
public class OfficerCreationRequest {
    private String fullName;
    private String username;
    private String email;
    private String password;
    private String phoneNumber;
    private String designation;
    private Long departmentId;

}
