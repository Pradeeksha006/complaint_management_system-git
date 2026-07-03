package com.cms.repository;

import com.cms.entity.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
    Optional<Feedback> findByComplaintId(String complaintId);

    @Query("SELECT AVG(f.rating) FROM Feedback f JOIN f.complaint c WHERE c.department.id = :deptId")
    Double getAverageRatingForDepartment(@Param("deptId") Long deptId);
    
    @Query("SELECT AVG(f.rating) FROM Feedback f")
    Double getGlobalAverageRating();
}
