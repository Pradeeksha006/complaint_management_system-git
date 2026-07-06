package com.cms.service;

import com.cms.dto.FeedbackDto;
import com.cms.entity.*;
import com.cms.exception.BadRequestException;
import com.cms.exception.ResourceNotFoundException;
import com.cms.mapper.MapperUtils;
import com.cms.repository.ComplaintRepository;
import com.cms.repository.FeedbackRepository;
import com.cms.repository.UserRepository;
import com.cms.repository.TimelineRepository;
import com.cms.security.SecurityUtils;
import com.cms.util.AiHelper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class FeedbackService {

    private final FeedbackRepository feedbackRepository;
    private final ComplaintRepository complaintRepository;
    private final UserRepository userRepository;
    private final TimelineRepository timelineRepository;

    @Transactional
    public FeedbackDto submitFeedback(String complaintId, FeedbackDto dto) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found"));

        if (complaint.getStatus() != ComplaintStatus.RESOLVED) {
            throw new BadRequestException("Feedback can only be submitted for RESOLVED complaints");
        }

        if (feedbackRepository.findByComplaintId(complaintId).isPresent()) {
            throw new BadRequestException("Feedback already submitted for this complaint");
        }

        String username = SecurityUtils.getCurrentUsername().orElse(null);
        User user = null;
        if (username != null) {
            user = userRepository.findByUsername(username).orElse(null);
        }

        // AI Sentiment Analysis on citizen comments
        String sentiment = AiHelper.analyzeSentiment(dto.getComments());
        log.info("Citizen feedback sentiment analysis result: {}", sentiment);

        Feedback feedback = Feedback.builder()
                .complaint(complaint)
                .rating(dto.getRating())
                .comments(dto.getComments() + " (Sentiment: " + sentiment + ")")
                .build();

        Feedback saved = feedbackRepository.save(feedback);

        // Update complaint status to CLOSED
        complaint.setStatus(ComplaintStatus.CLOSED);
        complaintRepository.save(complaint);

        // Save timeline event
        Timeline event = Timeline.builder()
                .complaint(complaint)
                .status("CLOSED")
                .description("Citizen submitted feedback (Rating: " + dto.getRating() + "/5) and closed the complaint.")
                .updatedBy(user)
                .build();
        timelineRepository.save(event);
        
        return MapperUtils.toDto(saved);
    }
}
