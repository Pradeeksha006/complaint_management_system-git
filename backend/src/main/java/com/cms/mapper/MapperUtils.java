package com.cms.mapper;

import com.cms.dto.*;
import com.cms.entity.*;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.HashSet;
import java.util.Set;
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
                .profilePictureUrl(user.getProfilePictureUrl())
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
        Complaint source = c.getMasterComplaint() != null ? c.getMasterComplaint() : c;
        int reportCount = (source.getChildReports() != null ? source.getChildReports().size() : 0) + 1;
        Set<Long> linkedCitizenIds = new HashSet<>();
        if (source.getCitizen() != null) {
            linkedCitizenIds.add(source.getCitizen().getId());
        }
        if (source.getSupportingCitizens() != null) {
            for (User supporter : source.getSupportingCitizens()) {
                if (supporter != null && supporter.getId() != null) {
                    linkedCitizenIds.add(supporter.getId());
                }
            }
        }
        if (source.getChildReports() != null) {
            for (Complaint child : source.getChildReports()) {
                if (child.getCitizen() != null && child.getCitizen().getId() != null) {
                    linkedCitizenIds.add(child.getCitizen().getId());
                }
            }
        }
        int supportCount = Math.max(reportCount, linkedCitizenIds.isEmpty() ? reportCount : linkedCitizenIds.size());
        List<LinkedCitizenDto> linkedCitizens = buildLinkedCitizens(source);

        return ComplaintDto.builder()
                .id(c.getId())
                .citizenId(c.getCitizen() != null ? c.getCitizen().getId() : null)
                .citizenName(c.getCitizen() != null ? c.getCitizen().getFullName() : (c.getCitizenName() != null ? c.getCitizenName() : "Anonymous Citizen"))
                .departmentId(source.getDepartment().getId())
                .departmentName(source.getDepartment().getName())
                .title(c.getTitle())
                .description(c.getDescription())
                .category(c.getCategory())
                .priority(source.getPriority().name())
                .status(source.getStatus().name())
                .latitude(c.getLatitude())
                .longitude(c.getLongitude())
                .address(c.getAddress())
                .isAnonymous(c.getCitizenName() == null || c.getCitizenName().equals("Anonymous Citizen"))
                .assignedOfficerId(source.getAssignedOfficer() != null ? source.getAssignedOfficer().getId() : null)
                .assignedOfficerName(source.getAssignedOfficer() != null ? source.getAssignedOfficer().getUser().getFullName() : "Unassigned")
                .createdAt(c.getCreatedAt())
                .updatedAt(source.getUpdatedAt())
                .resolvedAt(source.getResolvedAt())
                .deadline(source.getDeadline())
                .attachments(c.getAttachments() != null ? 
                        c.getAttachments().stream().map(MapperUtils::toDto).collect(Collectors.toList()) : 
                        Collections.emptyList())
                .citizenEmail(c.getCitizen() != null ? c.getCitizen().getEmail() : (c.getCitizenEmail() != null ? c.getCitizenEmail() : "N/A"))
                .citizenPhone(c.getCitizen() != null ? c.getCitizen().getPhoneNumber() : "N/A")
                .summary(c.getSummary())
                .translatedDescription(c.getTranslatedDescription())
                .translatedTitle(c.getTranslatedTitle())
                .supportCount(supportCount)
                .masterComplaintId(c.getMasterComplaint() != null ? c.getMasterComplaint().getId() : null)
                .linkedCitizens(linkedCitizens)
                .build();
    }

    private static List<LinkedCitizenDto> buildLinkedCitizens(Complaint source) {
        Map<Long, LinkedCitizenDto> linked = new LinkedHashMap<>();
        addLinkedCitizen(linked, source.getCitizen(), source.getId(), true);

        if (source.getSupportingCitizens() != null) {
            for (User supporter : source.getSupportingCitizens()) {
                addLinkedCitizen(linked, supporter, source.getId(), false);
            }
        }

        if (source.getChildReports() != null) {
            for (Complaint child : source.getChildReports()) {
                addLinkedCitizen(linked, child.getCitizen(), child.getId(), false);
            }
        }

        return new ArrayList<>(linked.values());
    }

    private static void addLinkedCitizen(Map<Long, LinkedCitizenDto> linked, User user, String sourceTicketId, boolean masterReporter) {
        if (user == null || user.getId() == null) {
            return;
        }

        linked.putIfAbsent(user.getId(), LinkedCitizenDto.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .sourceTicketId(sourceTicketId)
                .masterReporter(masterReporter)
                .build());
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
