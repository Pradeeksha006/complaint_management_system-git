package com.cms.controller;

import com.cms.dto.ComplaintDto;
import com.cms.dto.PageResponse;
import com.cms.dto.TimelineDto;
import com.cms.service.ComplaintService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/complaints")
@RequiredArgsConstructor
public class ComplaintController {

    private final ComplaintService complaintService;

    @PostMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<ComplaintDto> createComplaint(
            @RequestParam("title") String title,
            @RequestParam("description") String description,
            @RequestParam("category") String category,
            @RequestParam(value = "latitude", required = false) Double latitude,
            @RequestParam(value = "longitude", required = false) Double longitude,
            @RequestParam(value = "address", required = false) String address,
            @RequestParam("isAnonymous") boolean isAnonymous,
            @RequestParam(value = "departmentId", required = false) Long departmentId,
            @RequestParam(value = "priority", required = false) String priority,
            @RequestParam(value = "files", required = false) List<MultipartFile> files) throws IOException {

        return ResponseEntity.ok(complaintService.createComplaint(
                title, description, category, latitude, longitude, address, isAnonymous, departmentId, priority, files));
    }

    @PostMapping("/detect-duplicates")
    public ResponseEntity<List<ComplaintDto>> detectDuplicates(
            @RequestParam("departmentId") Long departmentId,
            @RequestParam("latitude") Double latitude,
            @RequestParam("longitude") Double longitude,
            @RequestParam("description") String description) {
        return ResponseEntity.ok(complaintService.detectDuplicates(departmentId, latitude, longitude, description));
    }

    @GetMapping
    public ResponseEntity<PageResponse<ComplaintDto>> getComplaints(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortField,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) Long citizenId,
            @RequestParam(required = false) Long deptId,
            @RequestParam(required = false) Long officerId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority) {
        return ResponseEntity.ok(complaintService.getComplaints(
                page, size, sortField, sortDir, citizenId, deptId, officerId, status, priority));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ComplaintDto> getComplaintById(@PathVariable String id) {
        return ResponseEntity.ok(complaintService.getComplaintById(id));
    }

    @GetMapping("/{id}/timeline")
    public ResponseEntity<List<TimelineDto>> getTimeline(@PathVariable String id) {
        return ResponseEntity.ok(complaintService.getComplaintTimeline(id));
    }

    @PutMapping("/{id}/assign")
    public ResponseEntity<ComplaintDto> assign(@PathVariable String id, @RequestParam Long officerId) {
        return ResponseEntity.ok(complaintService.assignComplaint(id, officerId));
    }

    @PutMapping(value = "/{id}/status", consumes = {"multipart/form-data"})
    public ResponseEntity<ComplaintDto> updateStatus(
            @PathVariable String id,
            @RequestParam("status") String status,
            @RequestParam("remarks") String remarks,
            @RequestParam(value = "workFile", required = false) MultipartFile workFile) throws IOException {
        return ResponseEntity.ok(complaintService.updateStatus(id, status, remarks, workFile));
    }

    @PutMapping("/{id}/transfer")
    public ResponseEntity<ComplaintDto> transfer(
            @PathVariable String id,
            @RequestParam("targetDeptId") Long targetDeptId,
            @RequestParam("remarks") String remarks) {
        return ResponseEntity.ok(complaintService.transferComplaint(id, targetDeptId, remarks));
    }
}
