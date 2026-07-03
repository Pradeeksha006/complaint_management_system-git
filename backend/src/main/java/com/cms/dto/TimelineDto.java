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
public class TimelineDto {
    private Long id;
    private String status;
    private String description;
    private String updatedByUsername;
    private String updatedByFullName;
    private LocalDateTime createdAt;
}
