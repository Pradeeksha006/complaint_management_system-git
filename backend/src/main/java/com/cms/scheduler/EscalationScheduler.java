package com.cms.scheduler;

import com.cms.entity.Complaint;
import com.cms.entity.ComplaintStatus;
import com.cms.entity.Timeline;
import com.cms.repository.ComplaintRepository;
import com.cms.repository.TimelineRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class EscalationScheduler {

    private final ComplaintRepository complaintRepository;
    private final TimelineRepository timelineRepository;

    // Runs every hour
    @Scheduled(cron = "0 0 * * * ?")
    @Transactional
    public void escalateStalledComplaints() {
        log.info("Starting EscalationScheduler run...");

        // Escalate complaints in ASSIGNED status with no updates for 48 hours
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
            // In production, we would also trigger a call to emailService to notify the Department Head.
        }

        log.info("EscalationScheduler completed. Escalated {} complaints.", stalledComplaints.size());
    }
}
