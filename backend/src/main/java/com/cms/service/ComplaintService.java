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
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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
    private final ObjectMapper objectMapper;

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

        // Calculate translation first so we can use it for cross-lingual duplicate checks!
        String language = "English";
        if (description != null && description.startsWith("[Language: ")) {
            int closeBracket = description.indexOf(']');
            if (closeBracket > 0) {
                language = description.substring(11, closeBracket).trim();
            }
        }

        String translatedDesc = geminiService.translateToEnglish(description, language);
        String summary = geminiService.generateSummary(translatedDesc);
        String translatedTitle = geminiService.translateToEnglish(title, language);

        // A. Duplicate Check - Merge duplicate submissions into a single Master Complaint (using cross-lingual translation)
        if (latitude != null && longitude != null) {
            List<ComplaintDto> duplicates = detectDuplicates(dept.getId(), latitude, longitude, description, translatedDesc);
            if (!duplicates.isEmpty()) {
                ComplaintDto duplicateDto = duplicates.get(0);
                Complaint master = complaintRepository.findById(duplicateDto.getId()).orElse(null);
                if (master != null) {
                    if (!isAnonymous && citizen != null) {
                        boolean alreadySupporting = false;
                        if (master.getCitizen() != null && master.getCitizen().getId().equals(citizen.getId())) {
                            alreadySupporting = true;
                        } else {
                            if (master.getSupportingCitizens() == null) {
                                master.setSupportingCitizens(new ArrayList<>());
                            }
                            for (User suUser : master.getSupportingCitizens()) {
                                if (suUser.getId().equals(citizen.getId())) {
                                    alreadySupporting = true;
                                    break;
                                }
                            }
                        }
                        
                        if (!alreadySupporting) {
                            master.getSupportingCitizens().add(citizen);
                            complaintRepository.save(master);
                            
                            saveTimelineEvent(master, "SUPPORTED", "Citizen " + citizen.getFullName() + " registered support for this complaint (Duplicate report).", citizen);
                            
                            emailService.sendComplaintSubmittedEmail(citizen.getEmail(), citizen.getFullName(), master.getId(), master.getTitle());
                        }
                    }
                    return MapperUtils.toDto(master);
                }
            }
        }

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

        // Sanitize database field lengths to prevent SQL truncation 500 errors
        String safeTitle = title;
        if (safeTitle != null && safeTitle.length() > 150) {
            safeTitle = safeTitle.substring(0, 147) + "...";
        }
        String safeTranslatedTitle = translatedTitle;
        if (safeTranslatedTitle != null && safeTranslatedTitle.length() > 150) {
            safeTranslatedTitle = safeTranslatedTitle.substring(0, 147) + "...";
        }
        String safeDescription = description;
        if (safeDescription != null && safeDescription.length() > 2000) {
            safeDescription = safeDescription.substring(0, 1997) + "...";
        }
        String safeTranslatedDesc = translatedDesc;
        if (safeTranslatedDesc != null && safeTranslatedDesc.length() > 2000) {
            safeTranslatedDesc = safeTranslatedDesc.substring(0, 1997) + "...";
        }
        String safeAddress = address;
        if (safeAddress != null && safeAddress.length() > 255) {
            safeAddress = safeAddress.substring(0, 252) + "...";
        }

        Complaint complaint = Complaint.builder()
                .id(complaintId)
                .citizen(citizen)
                .department(dept)
                .title(safeTitle)
                .description(safeDescription)
                .translatedDescription(safeTranslatedDesc)
                .translatedTitle(safeTranslatedTitle)
                .summary(summary)
                .category(dept.getName())
                .priority(priority)
                .status(ComplaintStatus.SUBMITTED)
                .latitude(latitude)
                .longitude(longitude)
                .address(safeAddress)
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
    public List<ComplaintDto> detectDuplicates(Long departmentId, Double latitude, Double longitude, 
                                               String description, String translatedDescription) {
        List<Complaint> candidates = complaintRepository.findAllActiveComplaints();
        List<ComplaintDto> duplicates = new ArrayList<>();

        if (candidates.isEmpty()) {
            return duplicates;
        }

        // 1. Prepare candidates info for semantic AI duplicate analysis
        List<Map<String, String>> candidatesInfo = new ArrayList<>();
        for (Complaint cand : candidates) {
            Map<String, String> item = new HashMap<>();
            item.put("id", cand.getId());
            item.put("title", cand.getTranslatedTitle() != null ? cand.getTranslatedTitle() : cand.getTitle());
            item.put("description", cand.getTranslatedDescription() != null ? cand.getTranslatedDescription() : cand.getDescription());
            candidatesInfo.add(item);
        }

        try {
            String candidatesJson = objectMapper.writeValueAsString(candidatesInfo);
            String aiResult = geminiService.detectDuplicates(
                (translatedDescription != null && !translatedDescription.isBlank()) ? translatedDescription : description, 
                candidatesJson
            );
            JsonNode root = objectMapper.readTree(aiResult);
            boolean isDuplicate = root.path("isDuplicate").asBoolean(false);
            String matchedId = root.path("matchedComplaintId").isNull() ? null : root.path("matchedComplaintId").asText();
            
            if (isDuplicate && matchedId != null && !matchedId.isEmpty()) {
                complaintRepository.findById(matchedId).ifPresent(c -> {
                    duplicates.add(MapperUtils.toDto(c));
                });
                return duplicates;
            }
        } catch (Exception e) {
            log.error("AI duplicate evaluation failed, falling back to local checks", e);
        }

        // 2. Local fallback duplicate check if AI fails/rate-limited
        for (Complaint cand : candidates) {
            if (cand.getLatitude() == null || cand.getLongitude() == null || latitude == null || longitude == null) {
                // If coordinates are missing, compare translated description similarity
                double similarity = AiHelper.calculateSimilarity(
                    (translatedDescription != null) ? translatedDescription : description,
                    (cand.getTranslatedDescription() != null) ? cand.getTranslatedDescription() : cand.getDescription()
                );
                if (similarity >= 0.50) {
                    duplicates.add(MapperUtils.toDto(cand));
                    break;
                }
                continue;
            }

            double distanceMeters = AiHelper.calculateDistance(latitude, longitude, cand.getLatitude(), cand.getLongitude());
            boolean sameDepartment = departmentId != null && departmentId > 0 && 
                                     cand.getDepartment() != null && 
                                     cand.getDepartment().getId().equals(departmentId);
            
            String text1 = (translatedDescription != null) ? translatedDescription : description;
            String text2 = (cand.getTranslatedDescription() != null) ? cand.getTranslatedDescription() : cand.getDescription();
            
            if (distanceMeters <= 50.0) {
                double similarity = AiHelper.calculateSimilarity(text1, text2);
                if (sameDepartment || similarity >= 0.20) {
                    duplicates.add(MapperUtils.toDto(cand));
                    break;
                }
            }
            
            if (distanceMeters > 50.0 && distanceMeters <= 500.0) {
                double textSimilarity = AiHelper.calculateSimilarity(text1, text2);
                if (textSimilarity >= 0.35) {
                    duplicates.add(MapperUtils.toDto(cand));
                    break;
                }
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

        // Notify Citizen(s)
        if (!saved.isAnonymous()) {
            if (saved.getCitizen() != null) {
                emailService.sendComplaintAssignedEmail(saved.getCitizen().getEmail(), saved.getCitizen().getFullName(), saved.getId(), saved.getTitle());
            }
            if (saved.getSupportingCitizens() != null) {
                for (User suUser : saved.getSupportingCitizens()) {
                    emailService.sendComplaintAssignedEmail(suUser.getEmail(), suUser.getFullName(), saved.getId(), saved.getTitle());
                }
            }
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

        // Email notifications to all linked citizens
        if (!saved.isAnonymous()) {
            if (saved.getCitizen() != null) {
                if (status == ComplaintStatus.RESOLVED) {
                    emailService.sendComplaintResolvedEmail(saved.getCitizen().getEmail(), saved.getCitizen().getFullName(), saved.getId(), saved.getTitle());
                } else if (status == ComplaintStatus.CLOSED) {
                    emailService.sendComplaintClosedEmail(saved.getCitizen().getEmail(), saved.getCitizen().getFullName(), saved.getId());
                }
            }
            if (saved.getSupportingCitizens() != null) {
                for (User suUser : saved.getSupportingCitizens()) {
                    if (status == ComplaintStatus.RESOLVED) {
                        emailService.sendComplaintResolvedEmail(suUser.getEmail(), suUser.getFullName(), saved.getId(), saved.getTitle());
                    } else if (status == ComplaintStatus.CLOSED) {
                        emailService.sendComplaintClosedEmail(suUser.getEmail(), suUser.getFullName(), saved.getId());
                    }
                }
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
            spec = spec.and((root, query, cb) -> {
                User u = new User();
                u.setId(citizenId);
                return cb.or(
                    cb.equal(root.get("citizen").get("id"), citizenId),
                    cb.isMember(u, root.get("supportingCitizens"))
                );
            });
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
