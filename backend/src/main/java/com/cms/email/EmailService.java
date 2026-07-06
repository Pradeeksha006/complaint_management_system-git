package com.cms.email;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Async
    public void sendEmail(String to, String subject, String htmlContent) {
        if (to == null || to.trim().isEmpty() || to.toLowerCase().endsWith("@cms.com")) {
            log.info("Bypassing actual email sending to dummy/invalid address: {}", to);
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            
            mailSender.send(message);
            log.info("Email successfully sent to {}", to);
        } catch (Exception e) {
            log.error("Failed to send email to {}", to, e);
        }
    }

    public void sendVerificationEmail(String email, String name, String token) {
        String verificationUrl = frontendUrl + "/verify-email?token=" + token;
        String content = getEmailTemplate(
            "Verify Your Account",
            "Dear " + name + ",",
            "Thank you for registering with the Citizen & Government Complaint Management System. Please verify your email address to activate your account and start filing complaints.",
            verificationUrl,
            "Verify Account"
        );
        sendEmail(email, "Activate Your Account - CMS", content);
    }

    public void sendLoginAlertEmail(String email, String name) {
        String content = getEmailTemplate(
            "Security Notice: New Login Detected",
            "Dear " + name + ",",
            "A new login was detected on your Citizen & Government Complaint Management System account. " +
            "If this was you, no action is required. If you did not authorize this login, please change your password or contact an administrator immediately.",
            frontendUrl + "/settings",
            "Review Account Settings"
        );
        sendEmail(email, "Security Notice: New Login Detected", content);
    }

    public void sendResetPasswordEmail(String email, String name, String token) {
        String resetUrl = frontendUrl + "/reset-password?token=" + token;
        String content = getEmailTemplate(
            "Reset Your Password",
            "Dear " + name + ",",
            "We received a request to reset your password. Click the button below to set a new password. This link is valid for 24 hours.",
            resetUrl,
            "Reset Password"
        );
        sendEmail(email, "Reset Your Password - CMS", content);
    }

    public void sendComplaintSubmittedEmail(String email, String name, String complaintId, String title) {
        String trackUrl = frontendUrl + "/track-complaint/" + complaintId;
        String content = getEmailTemplate(
            "Complaint Filed Successfully",
            "Dear " + name + ",",
            "Your complaint regarding <strong>\"" + title + "\"</strong> has been registered. Your tracking ID is <strong>" + complaintId + "</strong>. You can follow the timeline and progress using the link below.",
            trackUrl,
            "Track Complaint"
        );
        sendEmail(email, "Complaint Registered: " + complaintId, content);
    }

    public void sendComplaintAssignedEmail(String email, String name, String complaintId, String title) {
        String trackUrl = frontendUrl + "/track-complaint/" + complaintId;
        String content = getEmailTemplate(
            "Complaint Assigned to Officer",
            "Dear " + name + ",",
            "Your complaint <strong>" + complaintId + "</strong> (\"" + title + "\") has been assigned to an officer and is currently under review.",
            trackUrl,
            "Track Progress"
        );
        sendEmail(email, "Complaint Assigned: " + complaintId, content);
    }

    public void sendComplaintResolvedEmail(String email, String name, String complaintId, String title) {
        String trackUrl = frontendUrl + "/track-complaint/" + complaintId;
        String content = getEmailTemplate(
            "Complaint Resolved",
            "Dear " + name + ",",
            "Good news! Your complaint <strong>" + complaintId + "</strong> has been marked as <strong>RESOLVED</strong> by the assigned officer. Please click the button below to review the resolution details and submit your feedback.",
            trackUrl,
            "Provide Feedback & Close"
        );
        sendEmail(email, "Complaint Resolved: " + complaintId, content);
    }

    public void sendComplaintClosedEmail(String email, String name, String complaintId) {
        String trackUrl = frontendUrl + "/track-complaint/" + complaintId;
        String content = getEmailTemplate(
            "Complaint Closed",
            "Dear " + name + ",",
            "Your complaint <strong>" + complaintId + "</strong> has been officially closed. Thank you for using our service to keep our community safe and functioning.",
            trackUrl,
            "View Details"
        );
        sendEmail(email, "Complaint Closed: " + complaintId, content);
    }

    public void sendNearDeadlineAlert(String adminEmail, String complaintId, String title, String remainingTime, String deptName) {
        String trackUrl = frontendUrl + "/track-complaint/" + complaintId;
        String content = getEmailTemplate(
            "SLA Deadline Warning",
            "Dear Admin,",
            "The complaint <strong>" + complaintId + "</strong> (Title: " + title + ") assigned to the <strong>" + deptName + "</strong> department is approaching its deadline. There is approximately " + remainingTime + " remaining.",
            trackUrl,
            "Inspect Complaint"
        );
        sendEmail(adminEmail, "SLA WARNING: " + complaintId + " approaching deadline", content);
    }

    public void sendDeadlinePassedApologyEmail(String citizenEmail, String name, String complaintId, String title) {
        String trackUrl = frontendUrl + "/track-complaint/" + complaintId;
        String content = getEmailTemplate(
            "Apology: SLA Resolution Deadline Exceeded",
            "Dear " + name + ",",
            "We sincerely apologize. Your complaint <strong>" + complaintId + "</strong> (Title: " + title + ") has exceeded our target resolution SLA. Our department heads are actively prioritizing this case to resolve it as quickly as possible. Thank you for your continued patience.",
            trackUrl,
            "Track Complaint"
        );
        sendEmail(citizenEmail, "Apology: Resolution delay for complaint " + complaintId, content);
    }

    private String getEmailTemplate(String title, String salutation, String message, String actionUrl, String actionText) {
        return """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f9; color: #333; margin: 0; padding: 20px; }
                .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
                .header { background: linear-gradient(135deg, #1e3c72 0%%, #2a5298 100%%); color: white; padding: 30px 20px; text-align: center; }
                .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
                .content { padding: 30px 20px; line-height: 1.6; }
                .content p { margin: 0 0 20px 0; }
                .button-container { text-align: center; margin: 30px 0; }
                .button { background-color: #2563eb; color: white !important; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px rgba(37,99,235,0.2); }
                .footer { background: #f8fafc; text-align: center; padding: 20px; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>%s</h1>
                </div>
                <div class="content">
                    <p><strong>%s</strong></p>
                    <p>%s</p>
                    <div class="button-container">
                        <a href="%s" class="button">%s</a>
                    </div>
                    <p>If the button doesn't work, copy and paste this URL into your browser:</p>
                    <p style="word-break: break-all; font-size: 13px; color: #64748b;"><a href="%s">%s</a></p>
                </div>
                <div class="footer">
                    <p>This is an automated notification from the Complaint Management System.</p>
                    <p>&copy; 2026 CMS. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """.formatted(title, salutation, message, actionUrl, actionText, actionUrl, actionUrl);
    }
}
