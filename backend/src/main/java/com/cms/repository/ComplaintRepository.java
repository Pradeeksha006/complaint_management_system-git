package com.cms.repository;

import com.cms.entity.Complaint;
import com.cms.entity.ComplaintStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, String>, JpaSpecificationExecutor<Complaint> {
    
    Page<Complaint> findByCitizenId(Long citizenId, Pageable pageable);
    
    Page<Complaint> findByDepartmentId(Long departmentId, Pageable pageable);
    
    Page<Complaint> findByAssignedOfficerId(Long officerId, Pageable pageable);

    @Query("SELECT c FROM Complaint c WHERE c.department.id = :deptId " +
           "AND c.status NOT IN ('RESOLVED', 'CLOSED', 'REJECTED') " +
           "AND c.latitude BETWEEN :minLat AND :maxLat " +
           "AND c.longitude BETWEEN :minLon AND :maxLon")
    List<Complaint> findPotentialDuplicates(
            @Param("deptId") Long deptId,
            @Param("minLat") Double minLat,
            @Param("maxLat") Double maxLat,
            @Param("minLon") Double minLon,
            @Param("maxLon") Double maxLon);

    @Query("SELECT c FROM Complaint c WHERE c.status NOT IN (com.cms.entity.ComplaintStatus.RESOLVED, com.cms.entity.ComplaintStatus.CLOSED, com.cms.entity.ComplaintStatus.REJECTED) " +
           "AND c.latitude BETWEEN :minLat AND :maxLat " +
           "AND c.longitude BETWEEN :minLon AND :maxLon")
    List<Complaint> findPotentialDuplicatesAllDepts(
            @Param("minLat") Double minLat,
            @Param("maxLat") Double maxLat,
            @Param("minLon") Double minLon,
            @Param("maxLon") Double maxLon);

    @Query("SELECT c FROM Complaint c WHERE c.status NOT IN (com.cms.entity.ComplaintStatus.RESOLVED, com.cms.entity.ComplaintStatus.CLOSED, com.cms.entity.ComplaintStatus.REJECTED)")
    List<Complaint> findAllActiveComplaints();

    long countByStatus(ComplaintStatus status);

    @Query("SELECT c.status, COUNT(c) FROM Complaint c GROUP BY c.status")
    List<Object[]> countComplaintsGroupByStatus();

    @Query("SELECT c.department.name, COUNT(c) FROM Complaint c GROUP BY c.department.name")
    List<Object[]> countComplaintsGroupByDepartment();

    @Query("SELECT c.department.name, COUNT(c) FROM Complaint c WHERE c.status = 'RESOLVED' OR c.status = 'CLOSED' GROUP BY c.department.name")
    List<Object[]> countResolvedComplaintsGroupByDepartment();

    @Query("SELECT c.priority, COUNT(c) FROM Complaint c GROUP BY c.priority")
    List<Object[]> countComplaintsGroupByPriority();

    // Find escalatable complaints: ASSIGNED status for more than 48 hours
    List<Complaint> findByStatusAndUpdatedAtBefore(ComplaintStatus status, LocalDateTime time);

    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
    long countByResolvedAtBetween(LocalDateTime start, LocalDateTime end);

    List<Complaint> findByLatitudeBetweenAndLongitudeBetweenAndStatusNot(
        Double minLat, Double maxLat, Double minLng, Double maxLng, ComplaintStatus status
    );

    @Query("SELECT COUNT(c) FROM Complaint c WHERE c.createdAt BETWEEN :start AND :end AND c.status NOT IN ('RESOLVED', 'CLOSED', 'REJECTED')")
    long countPendingCreatedBetween(@org.springframework.data.repository.query.Param("start") LocalDateTime start, @org.springframework.data.repository.query.Param("end") LocalDateTime end);

    long countByDepartmentId(Long departmentId);

    @Query("SELECT COUNT(c) FROM Complaint c WHERE c.department.id = :departmentId AND c.masterComplaint IS NULL")
    long countIncidentsByDepartmentId(@Param("departmentId") Long departmentId);

    @Query("SELECT COUNT(c) FROM Complaint c WHERE c.department.id = :departmentId AND c.masterComplaint IS NOT NULL")
    long countMergedReportsByDepartmentId(@Param("departmentId") Long departmentId);

    long countByDepartmentIdAndStatus(Long departmentId, ComplaintStatus status);
    long countByDepartmentIdAndPriority(Long departmentId, com.cms.entity.Priority priority);
    long countByDepartmentIdAndStatusNotAndDeadlineBetween(Long departmentId, ComplaintStatus status, LocalDateTime start, LocalDateTime end);
    long countByDepartmentIdAndStatusNotAndDeadlineBefore(Long departmentId, ComplaintStatus status, LocalDateTime deadline);
}
