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

        // Resolved Department Counts
        List<Object[]> resolvedDeptCounts = complaintRepository.countResolvedComplaintsGroupByDepartment();
        Map<String, Long> resolvedDeptMap = new HashMap<>();
        for (Object[] row : resolvedDeptCounts) {
            resolvedDeptMap.put(row[0].toString(), (Long) row[1]);
        }
        stats.put("resolvedDepartmentWise", resolvedDeptMap);

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

        // Compute daily, weekly, and monthly trends dynamically
        java.time.LocalDate now = java.time.LocalDate.now();
        
        // 1. Daily Trends (last 7 days)
        List<Map<String, Object>> dailyTrends = new java.util.ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            java.time.LocalDate day = now.minusDays(i);
            java.time.LocalDateTime start = day.atStartOfDay();
            java.time.LocalDateTime end = day.atTime(23, 59, 59);

            long filed = complaintRepository.countByCreatedAtBetween(start, end);
            long resolved = complaintRepository.countByResolvedAtBetween(start, end);
            String label = day.format(java.time.format.DateTimeFormatter.ofPattern("dd MMM"));

            Map<String, Object> trendRow = new HashMap<>();
            trendRow.put("label", label);
            trendRow.put("Filed", filed);
            trendRow.put("Resolved", resolved);
            dailyTrends.add(trendRow);
        }
        stats.put("dailyTrends", dailyTrends);

        // 2. Weekly Trends (last 6 weeks)
        List<Map<String, Object>> weeklyTrends = new java.util.ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            java.time.LocalDate weekStart = now.minusWeeks(i).with(java.time.DayOfWeek.MONDAY);
            java.time.LocalDate weekEnd = weekStart.plusDays(6);

            java.time.LocalDateTime start = weekStart.atStartOfDay();
            java.time.LocalDateTime end = weekEnd.atTime(23, 59, 59);

            long filed = complaintRepository.countByCreatedAtBetween(start, end);
            long resolved = complaintRepository.countByResolvedAtBetween(start, end);
            String label = weekStart.format(java.time.format.DateTimeFormatter.ofPattern("dd/MM"));

            Map<String, Object> trendRow = new HashMap<>();
            trendRow.put("label", "Wk " + label);
            trendRow.put("Filed", filed);
            trendRow.put("Resolved", resolved);
            weeklyTrends.add(trendRow);
        }
        stats.put("weeklyTrends", weeklyTrends);

        // 3. Monthly Trends (last 6 months)
        List<Map<String, Object>> monthlyTrends = new java.util.ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            java.time.LocalDate monthStart = now.minusMonths(i).withDayOfMonth(1);
            java.time.LocalDate monthEnd = monthStart.plusMonths(1).minusDays(1);
            
            java.time.LocalDateTime start = monthStart.atStartOfDay();
            java.time.LocalDateTime end = monthEnd.atTime(23, 59, 59);

            long filed = complaintRepository.countByCreatedAtBetween(start, end);
            long resolved = complaintRepository.countByResolvedAtBetween(start, end);
            String monthName = monthStart.getMonth().getDisplayName(java.time.format.TextStyle.SHORT, java.util.Locale.ENGLISH);

            Map<String, Object> trendRow = new HashMap<>();
            trendRow.put("label", monthName);
            trendRow.put("Filed", filed);
            trendRow.put("Resolved", resolved);
            monthlyTrends.add(trendRow);
        }
        stats.put("monthlyTrends", monthlyTrends);

        return stats;
    }
}
