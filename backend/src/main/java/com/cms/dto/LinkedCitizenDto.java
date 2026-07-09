package com.cms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class LinkedCitizenDto {
    private Long id;
    private String fullName;
    private String email;
    private String phoneNumber;
    private String sourceTicketId;
    private boolean masterReporter;
}
