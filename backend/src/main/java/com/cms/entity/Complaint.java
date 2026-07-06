package com.cms.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "complaints")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Complaint {

    @Id
    @Column(length = 50)
    private String id; // Generated pattern e.g. WT-20260703-0001

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "citizen_id")
    private User citizen; // Nullable if anonymous

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(nullable = false, length = 2000)
    private String description;

    @Column(nullable = false, length = 100)
    private String category; // e.g. Pipe Leakage, Pothole

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Priority priority;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ComplaintStatus status;

    private Double latitude;
    private Double longitude;
    
    @Column(length = 255)
    private String address;

    @Column(name = "is_anonymous", nullable = false)
    @Builder.Default
    private boolean isAnonymous = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_officer_id")
    private Officer assignedOfficer; // Assigned staff member

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @Column(name = "deadline")
    private LocalDateTime deadline;

    @Column(name = "near_deadline_alert_sent", nullable = false)
    @Builder.Default
    private boolean nearDeadlineAlertSent = false;

    @Column(name = "over_deadline_alert_sent", nullable = false)
    @Builder.Default
    private boolean overDeadlineAlertSent = false;

    @OneToMany(mappedBy = "complaint", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @ToString.Exclude
    private List<Attachment> attachments = new ArrayList<>();
}
