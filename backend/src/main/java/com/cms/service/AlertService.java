package com.cms.service;

import com.cms.entity.Alert;
import com.cms.entity.Complaint;
import com.cms.repository.AlertRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class AlertService {

    private final AlertRepository alertRepository;

    /**
     * Creates an alert for a critical complaint.
     * The alert message includes the complaint ID and title.
     * @param complaint the complaint to base the alert on
     */
    public Alert createAlert(Complaint complaint) {
        try {
            Alert alert = Alert.builder()
                    .complaintId(complaint.getId())
                    .title(complaint.getTitle())
                    .message("Critical complaint filed: " + complaint.getTitle())
                    .build();
            alertRepository.save(alert);
            log.info("Created critical alert for complaint {}", complaint.getId());
            return alert;
        } catch (Exception e) {
            log.error("Failed to create alert for complaint {}: {}", complaint.getId(), e.getMessage(), e);
            return null;
        }
    }
}
