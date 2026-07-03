package com.cms.service;

import com.cms.repository.ComplaintRepository;
import com.cms.repository.FeedbackRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final ComplaintRepository complaintRepository;
    private final FeedbackRepository feedbackRepository;

    @Transactional(readOnly = true)
    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();

        // Total
        long total = complaintRepository.count();
        stats.put("totalComplaints", total);

        // Status Counts
        List<Object[]> statusCounts = complaintRepository.countComplaintsGroupByStatus();
        Map<String, Long> statusMap = new HashMap<>();
        for (Object[] row : statusCounts) {
            statusMap.put(row[0].toString(), (Long) row[1]);
        }
        stats.put("statusWise", statusMap);

        // Department Counts
        List<Object[]> deptCounts = complaintRepository.countComplaintsGroupByDepartment();
        Map<String, Long> deptMap = new HashMap<>();
        for (Object[] row : deptCounts) {
            deptMap.put(row[0].toString(), (Long) row[1]);
        }
        stats.put("departmentWise", deptMap);

        // Priority Counts
        List<Object[]> priorityCounts = complaintRepository.countComplaintsGroupByPriority();
        Map<String, Long> priorityMap = new HashMap<>();
        for (Object[] row : priorityCounts) {
            priorityMap.put(row[0].toString(), (Long) row[1]);
        }
        stats.put("priorityWise", priorityMap);

        // Average satisfaction rating
        Double avgSatisfaction = feedbackRepository.getGlobalAverageRating();
        stats.put("averageSatisfaction", avgSatisfaction != null ? Math.round(avgSatisfaction * 10.0) / 10.0 : 0.0);

        // Calculate average resolution time
        double avgResolutionDays = complaintRepository.findAll().stream()
                .filter(c -> c.getResolvedAt() != null)
                .mapToLong(c -> Duration.between(c.getCreatedAt(), c.getResolvedAt()).toDays())
                .average()
                .orElse(0.0);
        stats.put("averageResolutionTimeDays", Math.round(avgResolutionDays * 10.0) / 10.0);

        return stats;
    }
}
