package com.cms.mapper;

import com.cms.dto.OfficerDto;
import com.cms.entity.Officer;
import java.time.format.DateTimeFormatter;

public class OfficerMapper {
    private static final DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    public static OfficerDto toDto(Officer officer) {
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
    }
}
