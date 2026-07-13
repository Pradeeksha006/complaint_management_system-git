package com.cms.repository;

import com.cms.entity.Citizen;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CitizenRepository extends JpaRepository<Citizen, Long> {
    Optional<Citizen> findByUsername(String username);
    Optional<Citizen> findByEmail(String email);
}
