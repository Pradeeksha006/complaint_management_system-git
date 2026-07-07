package com.cms.service;

import com.cms.dto.*;
import com.cms.entity.*;
import com.cms.email.EmailService;
import com.cms.exception.BadRequestException;
import com.cms.exception.ResourceNotFoundException;
import com.cms.mapper.MapperUtils;
import com.cms.repository.*;
import com.cms.security.SecurityUtils;
import com.cms.util.AiHelper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ComplaintService {

    private final ComplaintRepository complaintRepository;
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final OfficerRepository officerRepository;
    private final TimelineRepository timelineRepository;
    private final FeedbackRepository feedbackRepository;
    private final CloudinaryService cloudinaryService;
    private final EmailService emailService;
    private final GeminiService geminiService;

    @Transactional
    public ComplaintDto createComplaint(String title, String description, String category,
                                        Double latitude, Double longitude, String address,
                                        boolean isAnonymous, Long departmentId, String priorityStr,
                                        List<MultipartFile> files) throws IOException {
        
        // 1. Resolve Citizen
        User citizen = null;
        if (!isAnonymous) {
            String username = SecurityUtils.getCurrentUsername()
                    .orElseThrow(() -> new BadRequestException("Unauthenticated user cannot file non-anonymous complaint"));
            citizen = userRepository.findByUsername(username)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        }

        // 2. AI Auto-Categorization & Priority prediction if missing
        Department dept;
        if (departmentId == null || departmentId == 0) {
            String predictedCode = AiHelper.predictDepartment(title, description);
            dept = departmentRepository.findByCode(predictedCode)
                    .orElse(departmentRepository.findAll().get(0)); // fallback
        } else {
            dept = departmentRepository.findById(departmentId)
                    .orElseThrow(() -> new ResourceNotFoundException("Department not found"));
        }

        // Always predict priority automatically using AI
        Priority priority = AiHelper.predictPriority(title, description);

        // 3. Generate Complaint ID: e.g. WT-20260703-0001
        String complaintId = generateComplaintId(dept.getCode());

        // SLA deadline calculation based on priority
        LocalDateTime deadline = LocalDateTime.now();
        if (priority == Priority.HIGH || priority == Priority.CRITICAL) {
            deadline = deadline.plusDays(1); // 24 hours
        } else if (priority == Priority.MEDIUM) {
            deadline = deadline.plusDays(3); // 3 days
        } else {
            deadline = deadline.plusDays(7); // 5-7 business/calendar days (using 7 calendar days)
        }

        String summary = geminiService.generateSummary(description);
        String translatedDesc = geminiService.translateToEnglish(description);
        String translatedTitle = geminiService.translateToEnglish(title);

        Complaint complaint = Complaint.builder()
                .id(complaintId)
                .citizen(citizen)
                .department(dept)
                .title(title)
                .description(description)
                .translatedDescription(translatedDesc)
                .translatedTitle(translatedTitle)
                .summary(summary)
                .category(dept.getName())
                .priority(priority)
                .status(ComplaintStatus.SUBMITTED)
                .latitude(latitude)
                .longitude(longitude)
                .address(address)
                .isAnonymous(isAnonymous)
                .deadline(deadline)
                .attachments(new ArrayList<>())
                .build();

        // 4. Handle File Uploads to Cloudinary
        if (files != null && !files.isEmpty()) {
            for (MultipartFile file : files) {
                if (!file.isEmpty()) {
                    Map<String, String> uploadRes = cloudinaryService.uploadFile(file, "complaints/" + complaintId);
                    
                    FileType fileType = FileType.IMAGE;
                    String filename = file.getOriginalFilename();
                    if (filename != null) {
                        if (filename.toLowerCase().endsWith(".pdf")) {
                            fileType = FileType.PDF;
                        } else if (filename.toLowerCase().endsWith(".mp4") || filename.toLowerCase().endsWith(".mkv") || filename.toLowerCase().endsWith(".avi")) {
                            fileType = FileType.VIDEO;
                        }
                    }

                    Attachment attachment = Attachment.builder()
                            .complaint(complaint)
                            .fileUrl(uploadRes.get("url"))
                            .fileType(fileType)
                            .publicId(uploadRes.get("public_id"))
                            .build();

                    complaint.getAttachments().add(attachment);
                }
            }
        }

        Complaint saved = complaintRepository.save(complaint);

        // 5. Create timeline event
        saveTimelineEvent(saved, "SUBMITTED", "Complaint filed successfully" + (isAnonymous ? " anonymously" : "") + ".", citizen);

        // 6. Send Email Notifications
        if (!isAnonymous && citizen != null) {
            emailService.sendComplaintSubmittedEmail(citizen.getEmail(), citizen.getFullName(), saved.getId(), saved.getTitle());
        }

        return MapperUtils.toDto(saved);
    }

    @Transactional(readOnly = true)
    public List<ComplaintDto> detectDuplicates(Long departmentId, Double latitude, Double longitude, String description) {
        if (latitude == null || longitude == null || departmentId == null) {
            return Collections.emptyList();
        }

        // Search boundaries (approx 500 meters delta lat/lon)
        double delta = 0.005;
        double minLat = latitude - delta;
        double maxLat = latitude + delta;
        double minLon = longitude - delta;
        double maxLon = longitude + delta;

        List<Complaint> candidates = complaintRepository.findPotentialDuplicates(departmentId, minLat, maxLat, minLon, maxLon);
        List<ComplaintDto> duplicates = new ArrayList<>();

        for (Complaint cand : candidates) {
            double textSimilarity = AiHelper.calculateSimilarity(description, cand.getDescription());
            if (textSimilarity >= 0.70) {
                duplicates.add(MapperUtils.toDto(cand));
            }
        }

        return duplicates;
    }

    @Transactional
    public ComplaintDto assignComplaint(String id, Long officerId) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found"));
        Officer officer = officerRepository.findById(officerId)
                .orElseThrow(() -> new ResourceNotFoundException("Officer not found"));

        String currentUsername = SecurityUtils.getCurrentUsername().orElse("System");
        User currentUser = userRepository.findByUsername(currentUsername).orElse(null);

        complaint.setAssignedOfficer(officer);
        complaint.setStatus(ComplaintStatus.ASSIGNED);
        Complaint saved = complaintRepository.save(complaint);

        saveTimelineEvent(saved, "ASSIGNED", "Complaint assigned to officer " + officer.getUser().getFullName() + " (" + officer.getDesignation() + ").", currentUser);

        // Notify Citizen
        if (!saved.isAnonymous() && saved.getCitizen() != null) {
            emailService.sendComplaintAssignedEmail(saved.getCitizen().getEmail(), saved.getCitizen().getFullName(), saved.getId(), saved.getTitle());
        }

        return MapperUtils.toDto(saved);
    }

    @Transactional
    public ComplaintDto updateStatus(String id, String statusStr, String remarks, MultipartFile workFile) throws IOException {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found"));
        
        ComplaintStatus status = ComplaintStatus.valueOf(statusStr.toUpperCase());
        String currentUsername = SecurityUtils.getCurrentUsername()
                .orElseThrow(() -> new BadRequestException("Unauthenticated user cannot update status"));
        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        complaint.setStatus(status);
        
        if (status == ComplaintStatus.RESOLVED) {
            complaint.setResolvedAt(LocalDateTime.now());
        }

        // Upload work images if present
        if (workFile != null && !workFile.isEmpty()) {
            Map<String, String> uploadRes = cloudinaryService.uploadFile(workFile, "complaints/" + id + "/work");
            Attachment attachment = Attachment.builder()
                    .complaint(complaint)
                    .fileUrl(uploadRes.get("url"))
                    .fileType(FileType.IMAGE)
                    .publicId(uploadRes.get("public_id"))
                    .build();
            complaint.getAttachments().add(attachment);
        }

        Complaint saved = complaintRepository.save(complaint);
        
        saveTimelineEvent(saved, statusStr.toUpperCase(), remarks, currentUser);

        // Email notifications
        if (!saved.isAnonymous() && saved.getCitizen() != null) {
            if (status == ComplaintStatus.RESOLVED) {
                emailService.sendComplaintResolvedEmail(saved.getCitizen().getEmail(), saved.getCitizen().getFullName(), saved.getId(), saved.getTitle());
            } else if (status == ComplaintStatus.CLOSED) {
                emailService.sendComplaintClosedEmail(saved.getCitizen().getEmail(), saved.getCitizen().getFullName(), saved.getId());
            }
        }

        return MapperUtils.toDto(saved);
    }

    @Transactional
    public ComplaintDto transferComplaint(String id, Long targetDeptId, String remarks) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found"));
        Department targetDept = departmentRepository.findById(targetDeptId)
                .orElseThrow(() -> new ResourceNotFoundException("Target department not found"));

        String currentUsername = SecurityUtils.getCurrentUsername().orElse("System");
        User currentUser = userRepository.findByUsername(currentUsername).orElse(null);

        String prevDeptName = complaint.getDepartment().getName();
        complaint.setDepartment(targetDept);
        complaint.setAssignedOfficer(null); // Unassign officer
        complaint.setStatus(ComplaintStatus.SUBMITTED); // Revert to submitted state

        Complaint saved = complaintRepository.save(complaint);

        saveTimelineEvent(saved, "TRANSFERRED", "Complaint transferred from " + prevDeptName + " to " + targetDept.getName() + ". Remarks: " + remarks, currentUser);

        return MapperUtils.toDto(saved);
    }

    @Transactional(readOnly = true)
    public PageResponse<ComplaintDto> getComplaints(int page, int size, String sortField, String sortDir,
                                                   Long citizenId, Long deptId, Long officerId, String statusStr, String priorityStr) {
        
        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortField).descending() : Sort.by(sortField).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Specification<Complaint> spec = Specification.where(null);

        if (citizenId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("citizen").get("id"), citizenId));
        }
        if (deptId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("department").get("id"), deptId));
        }
        if (officerId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("assignedOfficer").get("id"), officerId));
        }
        if (statusStr != null && !statusStr.isBlank()) {
            ComplaintStatus status = ComplaintStatus.valueOf(statusStr.toUpperCase());
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), status));
        }
        if (priorityStr != null && !priorityStr.isBlank()) {
            Priority priority = Priority.valueOf(priorityStr.toUpperCase());
            spec = spec.and((root, query, cb) -> cb.equal(root.get("priority"), priority));
        }

        Page<Complaint> pageResult = complaintRepository.findAll(spec, pageable);
        List<ComplaintDto> list = pageResult.getContent().stream()
                .map(MapperUtils::toDto)
                .collect(Collectors.toList());

        return PageResponse.<ComplaintDto>builder()
                .content(list)
                .pageNumber(pageResult.getNumber())
                .pageSize(pageResult.getSize())
                .totalElements(pageResult.getTotalElements())
                .totalPages(pageResult.getTotalPages())
                .last(pageResult.isLast())
                .build();
    }

    @Transactional(readOnly = true)
    public ComplaintDto getComplaintById(String id) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found"));
        
        ComplaintDto dto = MapperUtils.toDto(complaint);
        
        // Include feedback if present
        feedbackRepository.findByComplaintId(id).ifPresent(f -> dto.setFeedback(MapperUtils.toDto(f)));

        return dto;
    }

    @Transactional(readOnly = true)
    public List<TimelineDto> getComplaintTimeline(String id) {
        return timelineRepository.findByComplaintIdOrderByCreatedAtAsc(id).stream()
                .map(MapperUtils::toDto)
                .collect(Collectors.toList());
    }

    private String generateComplaintId(String deptCode) {
        String dateStr = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        long todayCount = complaintRepository.count();
        // Format to a 4-digit zero-padded number e.g. 0001
        String sequence = String.format("%04d", todayCount + 1);
        return deptCode + "-" + dateStr + "-" + sequence;
    }

    private void saveTimelineEvent(Complaint complaint, String status, String description, User user) {
        Timeline event = Timeline.builder()
                .complaint(complaint)
                .status(status)
                .description(description)
                .updatedBy(user)
                .build();
        timelineRepository.save(event);
    }

    @Transactional
    public ComplaintDto modifyDepartment(String id, Long departmentId) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found"));

        String currentUsername = SecurityUtils.getCurrentUsername()
                .orElseThrow(() -> new BadRequestException("Unauthenticated user cannot modify complaint"));
        User user = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Check if user is the owner of the complaint
        if (complaint.getCitizen() == null || !complaint.getCitizen().getId().equals(user.getId())) {
            throw new BadRequestException("You are not authorized to modify this complaint");
        }

        // Check 5 minutes limit
        if (LocalDateTime.now().isAfter(complaint.getCreatedAt().plusMinutes(5))) {
            throw new BadRequestException("Complaints can only be modified within 5 minutes of filing");
        }

        Department newDept = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found"));

        complaint.setDepartment(newDept);
        complaint.setCategory(newDept.getName());
        complaint = complaintRepository.save(complaint);

        // Add a timeline event
        saveTimelineEvent(complaint, "MODIFIED", "Citizen modified the department assignment to: " + newDept.getName(), user);

        return MapperUtils.toDto(complaint);
    }

    @Transactional
    public void deleteComplaint(String id) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found"));

        String currentUsername = SecurityUtils.getCurrentUsername()
                .orElseThrow(() -> new BadRequestException("Unauthenticated user cannot delete complaint"));
        User user = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Check authorization (only the owner citizen or an Admin can delete)
        if (user.getRole() != Role.ROLE_ADMIN) {
            if (complaint.getCitizen() == null || !complaint.getCitizen().getId().equals(user.getId())) {
                throw new BadRequestException("You are not authorized to delete this complaint");
            }
            
            // Check 5 minutes limit: only allow deletion AFTER 5 minutes!
            if (LocalDateTime.now().isBefore(complaint.getCreatedAt().plusMinutes(5))) {
                throw new BadRequestException("Complaints can only be deleted after 5 minutes of filing");
            }
        }

        // Programmatically delete timeline and feedback first
        Optional<Feedback> feedback = feedbackRepository.findByComplaintId(id);
        feedback.ifPresent(feedbackRepository::delete);

        List<Timeline> timelines = timelineRepository.findByComplaintIdOrderByCreatedAtAsc(id);
        timelineRepository.deleteAll(timelines);
        
        // Delete the complaint (attachments are cascaded via orphanRemoval = true)
        complaintRepository.delete(complaint);
    }

    @Transactional
    public ComplaintDto autoRouteComplaint(String id) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found"));

        String predictedCode = AiHelper.predictDepartment(complaint.getTitle(), complaint.getDescription());
        Department targetDept = departmentRepository.findByCode(predictedCode)
                .orElseThrow(() -> new ResourceNotFoundException("Predicted department not found"));

        String currentUsername = SecurityUtils.getCurrentUsername().orElse("System");
        User currentUser = userRepository.findByUsername(currentUsername).orElse(null);

        String prevDeptName = complaint.getDepartment().getName();
        complaint.setDepartment(targetDept);
        complaint.setCategory(targetDept.getName());
        complaint.setAssignedOfficer(null);
        complaint.setStatus(ComplaintStatus.SUBMITTED);

        Complaint saved = complaintRepository.save(complaint);

        saveTimelineEvent(saved, "TRANSFERRED", "AI Auto-Routed complaint from " + prevDeptName + " to " + targetDept.getName() + " based on content analysis.", currentUser);

        return MapperUtils.toDto(saved);
    }
}
