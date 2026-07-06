package com.cms.controller;

import com.cms.dto.NotificationDto;
import com.cms.entity.Notification;
import com.cms.mapper.MapperUtils;
import com.cms.repository.NotificationRepository;
import com.cms.security.SecurityUtils;
import com.cms.repository.UserRepository;
import com.cms.entity.User;
import com.cms.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class NotificationController {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<NotificationDto>> getMyNotifications() {
        String username = SecurityUtils.getCurrentUsername()
                .orElseThrow(() -> new ResourceNotFoundException("Not authenticated"));
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        List<NotificationDto> dtos = notifications.stream()
                .map(MapperUtils::toDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Long> getUnreadCount() {
        String username = SecurityUtils.getCurrentUsername()
                .orElseThrow(() -> new ResourceNotFoundException("Not authenticated"));
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return ResponseEntity.ok(notificationRepository.countByUserIdAndIsReadFalse(user.getId()));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        notification.setRead(true);
        notificationRepository.save(notification);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead() {
        String username = SecurityUtils.getCurrentUsername()
                .orElseThrow(() -> new ResourceNotFoundException("Not authenticated"));
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        for (Notification n : notifications) {
            n.setRead(true);
        }
        notificationRepository.saveAll(notifications);
        return ResponseEntity.ok().build();
    }
}
