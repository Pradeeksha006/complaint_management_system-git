package com.cms.config;

import com.cms.entity.Department;
import com.cms.repository.DepartmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final DepartmentRepository departmentRepository;

    @Override
    public void run(String... args) throws Exception {
        seedDepartments();
    }

    private void seedDepartments() {
        log.info("Checking/Seeding default government departments...");
        List<Department> defaultDepts = Arrays.asList(
            Department.builder().name("Water Supply & Sewage").code("WT").description("Manages pipelines, contamination, and sewage blockages.").build(),
            Department.builder().name("Sanitation & Waste Management").code("SN").description("Handles garbage cleaning, littering, and street sweeping.").build(),
            Department.builder().name("Electricity & Public Lighting").code("EL").description("Streetlight failures, voltage fluctuations, and wire hazards.").build(),
            Department.builder().name("Roads & Traffic Infrastructure").code("RD").description("Potholes, broken sidewalks, and highway repairs.").build(),
            Department.builder().name("Public Health & Veterinary").code("HL").description("Stray animal control, food hygiene, and pest control spray.").build(),
            Department.builder().name("Law & Public Security").code("PL").description("Public disturbance, local security, safety and policing.").build()
        );

        for (Department dept : defaultDepts) {
            if (departmentRepository.findByCode(dept.getCode()).isEmpty()) {
                departmentRepository.save(dept);
                log.info("Seeded department: {}", dept.getName());
            }
        }
    }
}
