package com.cms.scheduler;

import com.cms.entity.*;
import com.cms.repository.*;
import com.cms.email.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.Duration;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class EscalationScheduler {

    private final ComplaintRepository complaintRepository;
    private final TimelineRepository timelineRepository;
    private final OfficerRepository officerRepository;
    private final NotificationRepository notificationRepository;
    private final EmailService emailService;

    // Runs every minute to support instant SLA alerting and escalations!
    @Scheduled(cron = "0 */1 * * * ?")
    @Transactional
    public void monitorSlaDeadlinesAndEscalate() {
        log.info("Starting SLA Deadline Monitoring Scheduler run...");

        // 1. Escalate complaints in ASSIGNED status with no updates for 48 hours
        LocalDateTime thresholdTime = LocalDateTime.now().minusHours(48);
        List<Complaint> stalledComplaints = complaintRepository.findByStatusAndUpdatedAtBefore(ComplaintStatus.ASSIGNED, thresholdTime);

        for (Complaint complaint : stalledComplaints) {
            complaint.setStatus(ComplaintStatus.ESCALATED);
            complaintRepository.save(complaint);

            Timeline event = Timeline.builder()
                    .complaint(complaint)
                    .status("ESCALATED")
                    .description("System auto-escalated this complaint: no progress update received from the assigned officer within 48 hours.")
                    .build();
            timelineRepository.save(event);

            log.info("Complaint {} automatically escalated.", complaint.getId());
        }

        // 2. SLA Deadlines checks
        List<Complaint> activeComplaints = complaintRepository.findAll();
        LocalDateTime now = LocalDateTime.now();

        for (Complaint complaint : activeComplaints) {
            if (complaint.getStatus() == ComplaintStatus.RESOLVED || 
                complaint.getStatus() == ComplaintStatus.CLOSED || 
                complaint.getStatus() == ComplaintStatus.REJECTED || 
                complaint.getDeadline() == null) {
                continue;
            }

            // Find Department Head to send notifications to
            Long deptHeadUserId = null;
            List<Officer> officers = officerRepository.findByDepartmentId(complaint.getDepartment().getId());
            for (Officer off : officers) {
                if (off.getUser().getRole() == Role.ROLE_DEPT_HEAD) {
                    deptHeadUserId = off.getUser().getId();
                    break;
                }
            }

            // A. Check approaching deadline (within 4 hours)
            boolean nearAlertSent = timelineRepository.existsByComplaintIdAndStatus(complaint.getId(), "SLA_WARNING");
            if (!nearAlertSent && now.isAfter(complaint.getDeadline().minusHours(4))) {
                Duration remaining = Duration.between(now, complaint.getDeadline());
                long hours = remaining.toHours();
                long minutes = remaining.toMinutes() % 60;
                String remainingStr = hours > 0 ? (hours + "h " + minutes + "m") : (minutes + "m");
                if (remaining.isNegative()) {
                    remainingStr = "0m";
                }

                // Send warning email to Super Admin
                emailService.sendNearDeadlineAlert("pradeeksha2006@gmail.com", complaint.getId(), complaint.getTitle(), remainingStr, complaint.getDepartment().getName());

                // Create alert notification for Department Head
                if (deptHeadUserId != null) {
                    Notification alert = Notification.builder()
                            .userId(deptHeadUserId)
                            .message("WARNING: Complaint " + complaint.getId() + " is approaching its SLA deadline. Time remaining: " + remainingStr + ".")
                            .build();
                    notificationRepository.save(alert);
                }

                // Log a timeline event as warning marker
                Timeline warningEvent = Timeline.builder()
                        .complaint(complaint)
                        .status("SLA_WARNING")
                        .description("Complaint is approaching its target SLA resolution deadline. Warning alert triggered.")
                        .build();
                timelineRepository.save(warningEvent);

                log.info("SLA approaching deadline warning triggered for complaint {}", complaint.getId());
            }

            // B. Check crossed/exceeded deadline
            boolean overAlertSent = timelineRepository.existsByComplaintIdAndStatus(complaint.getId(), "SLA_EXCEEDED");
            if (!overAlertSent && now.isAfter(complaint.getDeadline())) {
                // Send apology email to citizen (if not anonymous and email is present)
                if (complaint.getCitizenEmail() != null && !complaint.getCitizenEmail().equals("Anonymous Email") && !complaint.getCitizenEmail().equals("N/A")) {
                    emailService.sendDeadlinePassedApologyEmail(
                        complaint.getCitizenEmail(), 
                        complaint.getCitizenName(), 
                        complaint.getId(), 
                        complaint.getTitle()
                    );
                }

                // Create critical notification for Department Head
                if (deptHeadUserId != null) {
                    Notification alert = Notification.builder()
                            .userId(deptHeadUserId)
                            .message("CRITICAL: Complaint " + complaint.getId() + " has exceeded its target SLA resolution deadline!")
                            .build();
                    notificationRepository.save(alert);
                }

                // Log a timeline event
                Timeline event = Timeline.builder()
                        .complaint(complaint)
                        .status("SLA_EXCEEDED")
                        .description("Target SLA resolution deadline exceeded. Apology email sent to citizen.")
                        .build();
                timelineRepository.save(event);

                log.info("SLA target exceeded warning triggered for complaint {}", complaint.getId());
            }
        }
    }
}
