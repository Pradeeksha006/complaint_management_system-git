package com.cms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AlertDto {
    private Long id;
    private String complaintId;
    private String title;
    private String message;
    private boolean isRead;
    private LocalDateTime createdAt;
}
