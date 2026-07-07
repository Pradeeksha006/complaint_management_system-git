package com.cms.mapper;

import com.cms.dto.*;
import com.cms.entity.*;

import java.util.Collections;
import java.util.stream.Collectors;

public class MapperUtils {

    private MapperUtils() {}

    public static UserDto toDto(User user) {
        if (user == null) return null;
        return UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phoneNumber(user.getPhoneNumber())
                .role(user.getRole().name())
                .status(user.getStatus().name())
                .emailVerified(user.isEmailVerified())
                .build();
    }

    public static DepartmentDto toDto(Department dept) {
        if (dept == null) return null;
        return DepartmentDto.builder()
                .id(dept.getId())
                .name(dept.getName())
                .code(dept.getCode())
                .description(dept.getDescription())
                .build();
    }

    public static OfficerDto toDto(Officer officer) {
        if (officer == null) return null;
        return OfficerDto.builder()
                .id(officer.getId())
                .userId(officer.getUser().getId())
                .username(officer.getUser().getUsername())
                .fullName(officer.getUser().getFullName())
                .email(officer.getUser().getEmail())
                .departmentId(officer.getDepartment().getId())
                .departmentName(officer.getDepartment().getName())
                .designation(officer.getDesignation())
                .build();
    }

    public static AttachmentDto toDto(Attachment attachment) {
        if (attachment == null) return null;
        return AttachmentDto.builder()
                .id(attachment.getId())
                .fileUrl(attachment.getFileUrl())
                .fileType(attachment.getFileType().name())
                .build();
    }

    public static TimelineDto toDto(Timeline timeline) {
        if (timeline == null) return null;
        return TimelineDto.builder()
                .id(timeline.getId())
                .status(timeline.getStatus())
                .description(timeline.getDescription())
                .updatedByUsername(timeline.getUpdatedBy() != null ? timeline.getUpdatedBy().getUsername() : "System")
                .updatedByFullName(timeline.getUpdatedBy() != null ? timeline.getUpdatedBy().getFullName() : "System Automated")
                .createdAt(timeline.getCreatedAt())
                .build();
    }

    public static FeedbackDto toDto(Feedback feedback) {
        if (feedback == null) return null;
        return FeedbackDto.builder()
                .id(feedback.getId())
                .rating(feedback.getRating())
                .comments(feedback.getComments())
                .build();
    }

    public static ComplaintDto toDto(Complaint c) {
        if (c == null) return null;
        return ComplaintDto.builder()
                .id(c.getId())
                .citizenId(c.getCitizen() != null ? c.getCitizen().getId() : null)
                .citizenName(c.getCitizen() != null ? (c.isAnonymous() ? "Anonymous Citizen" : c.getCitizen().getFullName()) : "Anonymous Citizen")
                .departmentId(c.getDepartment().getId())
                .departmentName(c.getDepartment().getName())
                .title(c.getTitle())
                .description(c.getDescription())
                .category(c.getCategory())
                .priority(c.getPriority().name())
                .status(c.getStatus().name())
                .latitude(c.getLatitude())
                .longitude(c.getLongitude())
                .address(c.getAddress())
                .isAnonymous(c.isAnonymous())
                .assignedOfficerId(c.getAssignedOfficer() != null ? c.getAssignedOfficer().getId() : null)
                .assignedOfficerName(c.getAssignedOfficer() != null ? c.getAssignedOfficer().getUser().getFullName() : "Unassigned")
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .resolvedAt(c.getResolvedAt())
                .deadline(c.getDeadline())
                .attachments(c.getAttachments() != null ? 
                        c.getAttachments().stream().map(MapperUtils::toDto).collect(Collectors.toList()) : 
                        Collections.emptyList())
                .citizenEmail(c.getCitizen() != null ? c.getCitizen().getEmail() : "N/A")
                .citizenPhone(c.getCitizen() != null ? c.getCitizen().getPhoneNumber() : "N/A")
                .summary(c.getSummary())
                .translatedDescription(c.getTranslatedDescription())
                .translatedTitle(c.getTranslatedTitle())
                .supportCount(c.isAnonymous() ? 1 : ((c.getSupportingCitizens() != null ? c.getSupportingCitizens().size() : 0) + 1))
                .build();
    }

    public static NotificationDto toDto(Notification notification) {
        if (notification == null) return null;
        return NotificationDto.builder()
                .id(notification.getId())
                .userId(notification.getUserId())
                .message(notification.getMessage())
                .isRead(notification.isRead())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
