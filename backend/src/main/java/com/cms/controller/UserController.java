package com.cms.controller;

import com.cms.dto.OfficerDto;
import com.cms.dto.UserDto;
import com.cms.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<UserDto>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/officers")
    public ResponseEntity<List<OfficerDto>> getAllOfficers() {
        return ResponseEntity.ok(userService.getAllOfficers());
    }

    @PostMapping("/officers")
    public ResponseEntity<OfficerDto> createOfficer(
            @RequestParam Long userId,
            @RequestParam Long departmentId,
            @RequestParam String designation) {
        return ResponseEntity.ok(userService.createOfficer(userId, departmentId, designation));
    }

    @PostMapping("/officers/create")
    public ResponseEntity<OfficerDto> createNewOfficer(@RequestBody com.cms.dto.OfficerCreationRequest request) {
        return ResponseEntity.ok(userService.createNewOfficer(request));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Void> updateStatus(@PathVariable Long id, @RequestParam String status) {
        userService.updateUserStatus(id, status);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/officers/{id}/promote")
    public ResponseEntity<Void> promoteToDeptHead(@PathVariable Long id) {
        userService.promoteToDeptHead(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<List<com.cms.entity.AuditLog>> getAuditLogs() {
        return ResponseEntity.ok(userService.getAuditLogs());
    }

    @PutMapping("/profile/update")
    public ResponseEntity<UserDto> updateProfile(@RequestBody com.cms.dto.ProfileUpdateRequest request) {
        return ResponseEntity.ok(userService.updateProfile(request));
    }

    @PostMapping(value = "/profile/upload-avatar", consumes = {"multipart/form-data"})
    public ResponseEntity<UserDto> uploadAvatar(@RequestParam("file") org.springframework.web.multipart.MultipartFile file) throws java.io.IOException {
        return ResponseEntity.ok(userService.uploadAvatar(file));
    }
}
