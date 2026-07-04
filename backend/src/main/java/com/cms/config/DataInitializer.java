package com.cms.config;

import com.cms.entity.Department;
import com.cms.entity.User;
import com.cms.entity.UserStatus;
import com.cms.entity.Role;
import com.cms.repository.DepartmentRepository;
import com.cms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        seedDepartments();
        seedAdminUser();
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

    private void seedAdminUser() {
        log.info("Checking/Seeding Super Admin account...");
        
        Optional<User> existingAdminOpt = userRepository.findByUsername("admin");
        if (existingAdminOpt.isPresent()) {
            User admin = existingAdminOpt.get();
            if (!"pradeeksha006s@gmail.com".equalsIgnoreCase(admin.getEmail())) {
                admin.setEmail("pradeeksha006s@gmail.com");
                admin.setEmailVerified(true);
                admin.setStatus(UserStatus.ACTIVE);
                userRepository.save(admin);
                log.info("Updated existing admin user email to pradeeksha006s@gmail.com");
            }
        } else {
            Optional<User> adminByEmail = userRepository.findByEmail("pradeeksha006s@gmail.com");
            if (adminByEmail.isPresent()) {
                User admin = adminByEmail.get();
                admin.setRole(Role.ROLE_ADMIN);
                admin.setStatus(UserStatus.ACTIVE);
                admin.setEmailVerified(true);
                userRepository.save(admin);
                log.info("Promoted user with email pradeeksha006s@gmail.com to ROLE_ADMIN");
            } else {
                User admin = User.builder()
                        .username("admin")
                        .password(passwordEncoder.encode("pradeeksha2006"))
                        .email("pradeeksha006s@gmail.com")
                        .fullName("Super Admin")
                        .phoneNumber("1234567890")
                        .role(Role.ROLE_ADMIN)
                        .status(UserStatus.ACTIVE)
                        .emailVerified(true)
                        .build();
                userRepository.save(admin);
                log.info("Seeded new Super Admin account with username 'admin' and email 'pradeeksha006s@gmail.com'");
            }
        }
    }
}
