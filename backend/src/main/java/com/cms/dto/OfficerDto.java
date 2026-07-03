package com.cms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class OfficerDto {
    private Long id;
    private Long userId;
    private String username;
    private String fullName;
    private String email;
    private Long departmentId;
    private String departmentName;
    private String designation;
}
