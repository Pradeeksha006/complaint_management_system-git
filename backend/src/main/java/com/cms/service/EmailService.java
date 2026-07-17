package com.cms.service;

import com.cms.entity.Alert;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Service responsible for sending email notifications for critical alerts.
 * Uses Spring's {@link JavaMailSender} configured in {@code MailConfig}.
 */
@Service("alertEmailService")
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Autowired
    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /**
     * Sends an email to the SuperAdmin and the responsible department about a critical alert.
     * The method is executed asynchronously to avoid blocking the request thread.
     *
     * @param alert           the alert containing complaint details
     * @param superAdminEmail email address of the SuperAdmin (can be configured via properties)
     * @param departmentEmail email address of the responsible department
     */
    @Async
    public void sendCriticalAlert(Alert alert, String superAdminEmail, String departmentEmail) {
        try {
            String subject = "Critical Complaint Alert – " + alert.getTitle();
            String body = String.format(
                    "A critical complaint has been reported.%n%nComplaint ID: %s%nTitle: %s%nMessage: %s%nCreated At: %s%n%nPlease address this issue within ONE HOUR.%n",
                    alert.getComplaintId(),
                    alert.getTitle(),
                    alert.getMessage(),
                    alert.getCreatedAt()
            );

            // Send to SuperAdmin
            SimpleMailMessage superAdminMsg = new SimpleMailMessage();
            superAdminMsg.setTo(superAdminEmail);
            superAdminMsg.setSubject(subject);
            superAdminMsg.setText(body);
            mailSender.send(superAdminMsg);

            // Send to Department
            SimpleMailMessage deptMsg = new SimpleMailMessage();
            deptMsg.setTo(departmentEmail);
            deptMsg.setSubject(subject);
            deptMsg.setText(body);
            mailSender.send(deptMsg);

            log.info("Critical alert email sent for complaint {} to {} and {}", alert.getComplaintId(), superAdminEmail, departmentEmail);
        } catch (Exception e) {
            log.error("Failed to send critical alert email for complaint {}: {}", alert.getComplaintId(), e.getMessage(), e);
        }
    }
}
