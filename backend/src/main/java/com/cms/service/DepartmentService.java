package com.cms.service;

import com.cms.dto.DepartmentDto;
import com.cms.entity.Department;
import com.cms.exception.BadRequestException;
import com.cms.exception.ResourceNotFoundException;
import com.cms.mapper.MapperUtils;
import com.cms.repository.DepartmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DepartmentService {

    private final DepartmentRepository departmentRepository;

    @Transactional
    public DepartmentDto createDepartment(DepartmentDto dto) {
        if (departmentRepository.findByCode(dto.getCode().toUpperCase()).isPresent()) {
            throw new BadRequestException("Department code already exists: " + dto.getCode());
        }
        if (departmentRepository.findByName(dto.getName()).isPresent()) {
            throw new BadRequestException("Department name already exists: " + dto.getName());
        }

        Department department = Department.builder()
                .name(dto.getName())
                .code(dto.getCode().toUpperCase())
                .description(dto.getDescription())
                .build();

        Department saved = departmentRepository.save(department);
        return MapperUtils.toDto(saved);
    }

    @Transactional
    public DepartmentDto updateDepartment(Long id, DepartmentDto dto) {
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found"));

        departmentRepository.findByName(dto.getName()).ifPresent(d -> {
            if (!d.getId().equals(id)) {
                throw new BadRequestException("Department name is already taken");
            }
        });

        dept.setName(dto.getName());
        dept.setDescription(dto.getDescription());
        
        Department saved = departmentRepository.save(dept);
        return MapperUtils.toDto(saved);
    }

    @Transactional(readOnly = true)
    public List<DepartmentDto> getAllDepartments() {
        return departmentRepository.findAll().stream()
                .map(MapperUtils::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DepartmentDto getDepartmentById(Long id) {
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found"));
        return MapperUtils.toDto(dept);
    }

    @Transactional
    public void deleteDepartment(Long id) {
        if (!departmentRepository.existsById(id)) {
            throw new ResourceNotFoundException("Department not found");
        }
        departmentRepository.deleteById(id);
    }
}
