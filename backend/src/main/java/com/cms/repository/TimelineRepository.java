package com.cms.repository;

import com.cms.entity.Timeline;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TimelineRepository extends JpaRepository<Timeline, Long> {
    List<Timeline> findByComplaintIdOrderByCreatedAtAsc(String complaintId);
    boolean existsByComplaintIdAndStatus(String complaintId, String status);
}
