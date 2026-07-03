package com.cms.controller;

import com.cms.dto.FeedbackDto;
import com.cms.service.FeedbackService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/feedback")
@RequiredArgsConstructor
public class FeedbackController {

    private final FeedbackService feedbackService;

    @PostMapping("/{complaintId}")
    public ResponseEntity<FeedbackDto> submitFeedback(
            @PathVariable String complaintId,
            @Valid @RequestBody FeedbackDto dto) {
        return ResponseEntity.ok(feedbackService.submitFeedback(complaintId, dto));
    }
}
