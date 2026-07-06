package com.cms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ComplaintDto {
    private String id;
    private Long citizenId;
    private String citizenName;
    private Long departmentId;
    private String departmentName;
    private String title;
    private String description;
    private String category;
    private String priority;
    private String status;
    private Double latitude;
    private Double longitude;
    private String address;
    private boolean isAnonymous;
    private Long assignedOfficerId;
    private String assignedOfficerName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime resolvedAt;
    private LocalDateTime deadline;
    private List<AttachmentDto> attachments;
    private FeedbackDto feedback;
    private String citizenEmail;
    private String citizenPhone;
}
