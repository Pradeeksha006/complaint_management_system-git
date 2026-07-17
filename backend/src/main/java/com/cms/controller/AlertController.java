package com.cms.controller;

import com.cms.dto.AlertDto;
import com.cms.entity.Alert;
import com.cms.repository.AlertRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/alerts")
@RequiredArgsConstructor
@Slf4j
public class AlertController {

    private final AlertRepository alertRepository;

    /**
     * Retrieve all alerts.
     */
    @GetMapping
    public ResponseEntity<List<AlertDto>> getAllAlerts() {
        List<AlertDto> alerts = alertRepository.findAll()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(alerts);
    }

    /**
     * Retrieve only unread alerts.
     */
    @GetMapping("/unread")
    public ResponseEntity<List<AlertDto>> getUnreadAlerts() {
        List<AlertDto> alerts = alertRepository.findByIsReadFalse()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(alerts);
    }

    /**
     * Mark a specific alert as read.
     */
    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markAlertAsRead(@PathVariable Long id) {
        return alertRepository.findById(id)
                .map(alert -> {
                    alert.setRead(true);
                    alertRepository.save(alert);
                    return ResponseEntity.ok().<Void>build();
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // Simple mapper from Alert entity to AlertDto
    private AlertDto toDto(Alert alert) {
        return AlertDto.builder()
                .id(alert.getId())
                .complaintId(alert.getComplaintId())
                .title(alert.getTitle())
                .message(alert.getMessage())
                .isRead(alert.isRead())
                .createdAt(alert.getCreatedAt())
                .build();
    }
}
