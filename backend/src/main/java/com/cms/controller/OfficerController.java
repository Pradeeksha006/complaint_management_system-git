package com.cms.controller;

import com.cms.dto.OfficerDto;
import com.cms.entity.Officer;
import com.cms.mapper.OfficerMapper;
import com.cms.repository.OfficerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/officers")
@RequiredArgsConstructor
public class OfficerController {
    private final OfficerRepository officerRepository;

    @GetMapping("/list")
    public ResponseEntity<List<OfficerDto>> listOfficers() {
        List<Officer> officers = officerRepository.findAll();
        List<OfficerDto> dtos = officers.stream()
                .map(officer -> {
                    OfficerDto dto = new OfficerDto();
                    dto.setId(officer.getId());
                    dto.setUserId(officer.getUser().getId());
                    dto.setUsername(officer.getUser().getUsername());
                    dto.setFullName(officer.getUser().getFullName());
                    dto.setEmail(officer.getUser().getEmail());
                    dto.setDepartmentId(officer.getDepartment().getId());
                    dto.setDepartmentName(officer.getDepartment().getName());
                    dto.setDesignation(officer.getDesignation());
                    return dto;
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
}
