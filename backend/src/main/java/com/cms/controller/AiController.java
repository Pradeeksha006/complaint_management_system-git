package com.cms.controller;

import com.cms.dto.ComplaintDto;
import com.cms.entity.Complaint;
import com.cms.entity.ComplaintStatus;
import com.cms.entity.Department;
import com.cms.mapper.MapperUtils;
import com.cms.repository.ComplaintRepository;
import com.cms.repository.DepartmentRepository;
import com.cms.service.GeminiService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@Slf4j
public class AiController {

    private final GeminiService geminiService;
    private final ComplaintRepository complaintRepository;
    private final DepartmentRepository departmentRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @PostMapping("/chat")
    public ResponseEntity<Map<String, String>> chat(@RequestBody Map<String, Object> payload) {
        String message = (String) payload.get("message");
        Object historyObj = payload.get("history");
        String historyJson = "[]";
        try {
            historyJson = objectMapper.writeValueAsString(historyObj);
        } catch (Exception e) {
            log.error("Failed to parse history", e);
        }

        String reply = geminiService.chatCMS(message, historyJson);
        Map<String, String> response = new HashMap<>();
        response.put("reply", reply);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/search")
    public ResponseEntity<List<ComplaintDto>> search(@RequestParam String query) {
        // Fetch active complaints to perform semantic search ranking
        List<Complaint> activeComplaints = complaintRepository.findAll().stream()
                .filter(c -> c.getStatus() != ComplaintStatus.RESOLVED && c.getStatus() != ComplaintStatus.CLOSED)
                .collect(Collectors.toList());

        if (activeComplaints.isEmpty()) {
            return ResponseEntity.ok(new ArrayList<>());
        }

        // Format candidate lists
        List<Map<String, String>> candidates = activeComplaints.stream().map(c -> {
            Map<String, String> item = new HashMap<>();
            item.put("id", c.getId());
            item.put("title", c.getTitle());
            item.put("category", c.getCategory());
            item.put("summary", c.getSummary() != null ? c.getSummary() : c.getDescription());
            return item;
        }).collect(Collectors.toList());

        try {
            String candidatesJson = objectMapper.writeValueAsString(candidates);
            String rankJson = geminiService.semanticSearch(query, candidatesJson);
            JsonNode root = objectMapper.readTree(rankJson);
            JsonNode matchedIdsNode = root.path("matchedIds");

            List<String> matchedIds = new ArrayList<>();
            if (matchedIdsNode.isArray()) {
                for (JsonNode idNode : matchedIdsNode) {
                    matchedIds.add(idNode.asText());
                }
            }

            // Map and order based on matches
            List<ComplaintDto> sortedDtoList = activeComplaints.stream()
                    .filter(c -> matchedIds.contains(c.getId()))
                    .sorted((c1, c2) -> Integer.compare(matchedIds.indexOf(c1.getId()), matchedIds.indexOf(c2.getId())))
                    .map(MapperUtils::toDto)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(sortedDtoList);
        } catch (Exception e) {
            log.error("Semantic search calculation failed", e);
            // Fallback: match by title/description containing words
            List<ComplaintDto> fallbackList = activeComplaints.stream()
                    .filter(c -> c.getTitle().toLowerCase().contains(query.toLowerCase()) || 
                            c.getDescription().toLowerCase().contains(query.toLowerCase()))
                    .map(MapperUtils::toDto)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(fallbackList);
        }
    }

    @PostMapping("/detect-duplicates")
    public ResponseEntity<Map<String, Object>> detectDuplicates(@RequestBody Map<String, Object> payload) {
        String title = (String) payload.get("title");
        String description = (String) payload.get("description");
        Double lat = null;
        Double lng = null;
        if (payload.get("latitude") != null) {
            lat = Double.valueOf(payload.get("latitude").toString());
        }
        if (payload.get("longitude") != null) {
            lng = Double.valueOf(payload.get("longitude").toString());
        }

        Map<String, Object> response = new HashMap<>();
        if (lat == null || lng == null) {
            response.put("isDuplicate", false);
            response.put("matchedComplaintId", null);
            response.put("reason", "No geographic coordinates provided for comparison.");
            return ResponseEntity.ok(response);
        }

        // Fetch unresolved complaints in a 500m bounding box
        double latThreshold = 0.005;
        double lngThreshold = 0.005;
        List<Complaint> candidates = complaintRepository.findByLatitudeBetweenAndLongitudeBetweenAndStatusNot(
                lat - latThreshold, lat + latThreshold,
                lng - lngThreshold, lng + lngThreshold,
                ComplaintStatus.RESOLVED
        );

        if (candidates.isEmpty()) {
            response.put("isDuplicate", false);
            response.put("matchedComplaintId", null);
            response.put("reason", "No existing complaints nearby in this location.");
            return ResponseEntity.ok(response);
        }

        // Proximity check (same location, same department aim)
        String newDeptCode = com.cms.util.AiHelper.predictDepartment(title, description);
        for (Complaint cand : candidates) {
            if (cand.getLatitude() == null || cand.getLongitude() == null) continue;
            
            double distanceMeters = com.cms.util.AiHelper.calculateDistance(lat, lng, cand.getLatitude(), cand.getLongitude());
            
            // Check if they are reporting the same issue type (same department)
            boolean sameDept = cand.getDepartment() != null && cand.getDepartment().getCode().equals(newDeptCode);
            
            if (distanceMeters <= 50.0) {
                double textSimilarity = com.cms.util.AiHelper.calculateSimilarity(description, cand.getDescription());
                
                // If same department OR at least some minor text similarity (20% overlap)
                if (sameDept || textSimilarity >= 0.20) {
                    response.put("isDuplicate", true);
                    response.put("matchedComplaintId", cand.getId());
                    response.put("matchedComplaintTitle", cand.getTitle());
                    response.put("reason", "Location Proximity: An unresolved complaint of similar nature was already reported within " + 
                                 Math.round(distanceMeters) + " meters of this location.");
                    return ResponseEntity.ok(response);
                }
            }
        }

        List<Map<String, String>> candidatesInfo = candidates.stream().map(c -> {
            Map<String, String> item = new HashMap<>();
            item.put("id", c.getId());
            item.put("title", c.getTitle());
            item.put("description", c.getDescription());
            return item;
        }).collect(Collectors.toList());

        try {
            String candidatesJson = objectMapper.writeValueAsString(candidatesInfo);
            String aiResult = geminiService.detectDuplicates(title, description, candidatesJson);
            JsonNode root = objectMapper.readTree(aiResult);

            response.put("isDuplicate", root.path("isDuplicate").asBoolean(false));
            response.put("matchedComplaintId", root.path("matchedComplaintId").isNull() ? null : root.path("matchedComplaintId").asText());
            response.put("reason", root.path("reason").asText("Calculation complete."));

            // If matched ID is returned, attach matching complaint details
            String matchedId = (String) response.get("matchedComplaintId");
            if (matchedId != null && !matchedId.isEmpty()) {
                complaintRepository.findById(matchedId).ifPresent(c -> {
                    response.put("matchedComplaintTitle", c.getTitle());
                });
            }
        } catch (Exception e) {
            log.error("Duplicate check computation failed", e);
            response.put("isDuplicate", false);
            response.put("matchedComplaintId", null);
            response.put("reason", "Internal evaluation error occurred during evaluation.");
        }

        return ResponseEntity.ok(response);
    }

    @PostMapping("/predict-resolution")
    public ResponseEntity<Map<String, Object>> predictResolution(@RequestBody Map<String, Object> payload) {
        Long departmentId = Long.valueOf(payload.get("departmentId").toString());
        String category = (String) payload.get("category");
        String priority = (String) payload.get("priority");

        Department dept = departmentRepository.findById(departmentId).orElse(null);
        String deptName = dept != null ? dept.getName() : "General";

        // Query historical complaints under the same department that are resolved
        List<Complaint> historicalResolved = complaintRepository.findAll().stream()
                .filter(c -> c.getDepartment().getId().equals(departmentId) && 
                        c.getResolvedAt() != null)
                .collect(Collectors.toList());

        double averageHours = 48.0; // Default fallback
        if (!historicalResolved.isEmpty()) {
            averageHours = historicalResolved.stream()
                    .mapToLong(c -> Duration.between(c.getCreatedAt(), c.getResolvedAt()).toHours())
                    .average()
                    .orElse(48.0);
        }

        Map<String, Object> predictionResponse = new HashMap<>();
        try {
            String aiResponse = geminiService.predictResolution(deptName, category, priority, averageHours);
            JsonNode root = objectMapper.readTree(aiResponse);

            predictionResponse.put("estimatedHours", root.path("estimatedHours").asInt(48));
            predictionResponse.put("estimatedDays", root.path("estimatedDays").asInt(2));
            predictionResponse.put("confidenceScore", root.path("confidenceScore").asDouble(0.8));
        } catch (Exception e) {
            log.error("Resolution prediction computation failed", e);
            predictionResponse.put("estimatedHours", 48);
            predictionResponse.put("estimatedDays", 2);
            predictionResponse.put("confidenceScore", 0.7);
        }

        return ResponseEntity.ok(predictionResponse);
    }

    @PostMapping("/predict-department")
    public ResponseEntity<Map<String, Object>> predictDepartment(@RequestBody Map<String, Object> payload) {
        String title = (String) payload.get("title");
        String description = (String) payload.get("description");

        List<Department> departments = departmentRepository.findAll();
        List<Map<String, String>> candidates = departments.stream().map(d -> {
            Map<String, String> item = new HashMap<>();
            item.put("code", d.getCode());
            item.put("name", d.getName());
            return item;
        }).collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        try {
            String departmentsJson = objectMapper.writeValueAsString(candidates);
            String aiResult = geminiService.predictDepartment(title, description, departmentsJson);
            if (aiResult == null || aiResult.trim().isEmpty()) {
                throw new Exception("Gemini prediction returned null/empty response");
            }
            JsonNode root = objectMapper.readTree(aiResult);
            String predictedCode = root.path("predictedCode").asText("IT");

            // If predicted as IT, check if local keywords have a specific match
            if ("IT".equals(predictedCode)) {
                String localCode = com.cms.util.AiHelper.predictDepartment(title, description);
                if (!"IT".equals(localCode)) {
                    predictedCode = localCode;
                }
            }

            Department matchedDept = departmentRepository.findByCode(predictedCode)
                    .orElse(departmentRepository.findByCode("IT").orElse(null));

            if (matchedDept != null) {
                response.put("departmentId", matchedDept.getId());
                response.put("departmentName", matchedDept.getName());
                response.put("departmentCode", matchedDept.getCode());
            } else {
                response.put("departmentId", null);
            }
        } catch (Exception e) {
            log.error("AI department prediction calculation failed, executing fallback", e);
            String predictedCode = com.cms.util.AiHelper.predictDepartment(title, description);
            Department matchedDept = departmentRepository.findByCode(predictedCode).orElse(null);
            if (matchedDept != null) {
                response.put("departmentId", matchedDept.getId());
                response.put("departmentName", matchedDept.getName());
                response.put("departmentCode", matchedDept.getCode());
            }
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/correct-address")
    public ResponseEntity<Map<String, String>> correctAddress(@RequestBody Map<String, String> payload) {
        String query = payload.get("query");
        String corrected = geminiService.correctAddressSpelling(query);
        if (corrected == null || corrected.trim().isEmpty()) {
            corrected = query;
        }
        Map<String, String> response = new HashMap<>();
        response.put("correctedQuery", corrected);
        return ResponseEntity.ok(response);
    }
}
