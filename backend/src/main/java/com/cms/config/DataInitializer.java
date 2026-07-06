package com.cms.config;

import com.cms.entity.Department;
import com.cms.entity.User;
import com.cms.entity.UserStatus;
import com.cms.entity.Role;
import com.cms.entity.Officer;
import com.cms.repository.DepartmentRepository;
import com.cms.repository.UserRepository;
import com.cms.repository.OfficerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final OfficerRepository officerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        migrateDatabaseTablesIfNecessary();
        cleanupLegacyMockUsers();
        seedDepartments();
        seedAdminUser();
        seedDepartmentHeads();
        seedDatabaseViews();
    }

    private void migrateDatabaseTablesIfNecessary() {
        log.info("Checking if database tables need migration...");
        try {
            // Check if 'users' needs migration to 'all_users'
            String checkUsersSql = "SELECT COUNT(*) FROM information_schema.tables " +
                                   "WHERE table_schema = DATABASE() " +
                                   "AND table_name = 'users' " +
                                   "AND table_type = 'BASE TABLE'";
            Integer isUsersBaseTable = jdbcTemplate.queryForObject(checkUsersSql, Integer.class);
            
            if (isUsersBaseTable != null && isUsersBaseTable > 0) {
                log.info("Migrating physical table 'users' to 'all_users'...");
                jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 0");
                jdbcTemplate.execute("DROP TABLE IF EXISTS all_users");
                jdbcTemplate.execute("RENAME TABLE users TO all_users");
                jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 1");
                log.info("Successfully migrated users table structure.");
            }

            // Check if 'officers' needs migration to 'officer_records'
            String checkOfficersSql = "SELECT COUNT(*) FROM information_schema.tables " +
                                     "WHERE table_schema = DATABASE() " +
                                     "AND table_name = 'officers' " +
                                     "AND table_type = 'BASE TABLE'";
            Integer isOfficersBaseTable = jdbcTemplate.queryForObject(checkOfficersSql, Integer.class);
            
            if (isOfficersBaseTable != null && isOfficersBaseTable > 0) {
                log.info("Migrating physical table 'officers' to 'officer_records'...");
                jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 0");
                jdbcTemplate.execute("DROP TABLE IF EXISTS officer_records");
                jdbcTemplate.execute("RENAME TABLE officers TO officer_records");
                jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 1");
                log.info("Successfully migrated officers table structure.");
            }
        } catch (Exception e) {
            log.error("Failed to migrate database tables: {}", e.getMessage());
        }
    }

    private void cleanupLegacyMockUsers() {
        log.info("Cleaning up legacy mock/seeded users if present...");
        try {
            // First, delete timeline events updated by non-existent users or legacy mock users to prevent foreign key errors
            jdbcTemplate.update("DELETE FROM complaint_timeline WHERE updated_by_id NOT IN (SELECT id FROM all_users) OR updated_by_id IN (SELECT id FROM all_users WHERE username IN ('jane_citizen', 'david_dept_head', 'john_officer'))");
            
            jdbcTemplate.update("DELETE FROM feedbacks WHERE complaint_id IN (SELECT id FROM complaints WHERE citizen_id IN (SELECT id FROM all_users WHERE username IN ('jane_citizen', 'david_dept_head', 'john_officer')))");
            jdbcTemplate.update("DELETE FROM complaint_timeline WHERE complaint_id IN (SELECT id FROM complaints WHERE citizen_id IN (SELECT id FROM all_users WHERE username IN ('jane_citizen', 'david_dept_head', 'john_officer')))");
            jdbcTemplate.update("DELETE FROM attachments WHERE complaint_id IN (SELECT id FROM complaints WHERE citizen_id IN (SELECT id FROM all_users WHERE username IN ('jane_citizen', 'david_dept_head', 'john_officer')))");
            jdbcTemplate.update("DELETE FROM complaints WHERE citizen_id IN (SELECT id FROM all_users WHERE username IN ('jane_citizen', 'david_dept_head', 'john_officer'))");
            jdbcTemplate.update("DELETE FROM officer_records WHERE user_id IN (SELECT id FROM all_users WHERE username IN ('jane_citizen', 'david_dept_head', 'john_officer'))");
            jdbcTemplate.update("DELETE FROM all_users WHERE username IN ('jane_citizen', 'david_dept_head', 'john_officer')");
            log.info("Legacy mock users cleaned up successfully.");
        } catch (Exception e) {
            log.error("Failed to clean up legacy mock users: {}", e.getMessage());
        }
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
            if (!"pradeeksha2006@gmail.com".equalsIgnoreCase(admin.getEmail())) {
                admin.setEmail("pradeeksha2006@gmail.com");
                admin.setEmailVerified(true);
                admin.setStatus(UserStatus.ACTIVE);
                userRepository.save(admin);
                log.info("Updated existing admin user email to pradeeksha2006@gmail.com");
            }
        } else {
            Optional<User> adminByEmail = userRepository.findByEmail("pradeeksha2006@gmail.com");
            if (adminByEmail.isPresent()) {
                User admin = adminByEmail.get();
                admin.setRole(Role.ROLE_ADMIN);
                admin.setStatus(UserStatus.ACTIVE);
                admin.setEmailVerified(true);
                userRepository.save(admin);
                log.info("Promoted user with email pradeeksha2006@gmail.com to ROLE_ADMIN");
            } else {
                User admin = User.builder()
                        .username("admin")
                        .password(passwordEncoder.encode("pradeeksha2006"))
                        .email("pradeeksha2006@gmail.com")
                        .fullName("Super Admin")
                        .phoneNumber("1234567890")
                        .role(Role.ROLE_ADMIN)
                        .status(UserStatus.ACTIVE)
                        .emailVerified(true)
                        .build();
                userRepository.save(admin);
                log.info("Seeded new Super Admin account with username 'admin' and email 'pradeeksha2006@gmail.com'");
            }
        }
    }

    private void seedDepartmentHeads() {
        log.info("Checking/Seeding Department Head accounts...");
        seedDeptHead("WT", "water_admin", "water@cms.com", "waterpassword", "Water Chief Superintendent");
        seedDeptHead("SN", "sanitation_admin", "sanitation@cms.com", "sanitationpassword", "Sanitation Chief Superintendent");
        seedDeptHead("EL", "electricity_admin", "electricity@cms.com", "electricitypassword", "Electricity Chief Superintendent");
        seedDeptHead("RD", "roads_admin", "roads@cms.com", "roadspassword", "Roads Chief Superintendent");
        seedDeptHead("HL", "health_admin", "health@cms.com", "healthpassword", "Health Chief Superintendent");
        seedDeptHead("PL", "police_admin", "police@cms.com", "policepassword", "Police Chief Superintendent");
    }

    private void seedDeptHead(String deptCode, String username, String email, String password, String fullName) {
        Optional<Department> deptOpt = departmentRepository.findByCode(deptCode);
        if (deptOpt.isEmpty()) {
            return;
        }
        Department dept = deptOpt.get();

        Optional<User> existingUserOpt = userRepository.findByUsername(username);
        User user;
        if (existingUserOpt.isPresent()) {
            user = existingUserOpt.get();
        } else {
            user = User.builder()
                    .username(username)
                    .password(passwordEncoder.encode(password))
                    .email(email)
                    .fullName(fullName)
                    .phoneNumber("9876543210")
                    .role(Role.ROLE_DEPT_HEAD)
                    .status(UserStatus.ACTIVE)
                    .emailVerified(true)
                    .build();
            user = userRepository.save(user);
            log.info("Seeded user account: {}", username);
        }

        // Make sure officer entry exists
        Optional<Officer> existingOfficerOpt = officerRepository.findByUserId(user.getId());
        if (existingOfficerOpt.isEmpty()) {
            Officer officer = Officer.builder()
                    .user(user)
                    .department(dept)
                    .designation("Chief Superintendent")
                    .build();
            officerRepository.save(officer);
            log.info("Seeded Chief Superintendent for department {}", dept.getName());
        }
    }

    private void seedDatabaseViews() {
        log.info("Checking/Creating MySQL views...");
        try {
            // Create user, admin and officers views
            jdbcTemplate.execute("CREATE OR REPLACE VIEW users AS SELECT id AS cid, username, password, email, full_name, phone_number, role, status, verification_token, reset_password_token, email_verified, created_at, updated_at FROM all_users WHERE role = 'ROLE_CITIZEN'");
            jdbcTemplate.execute("CREATE OR REPLACE VIEW admin AS SELECT * FROM all_users WHERE role = 'ROLE_ADMIN'");
            jdbcTemplate.execute("CREATE OR REPLACE VIEW officers AS SELECT o.user_id, o.department_id, d.name AS department_name, o.designation, o.created_at, o.updated_at FROM officer_records o JOIN departments d ON o.department_id = d.id");
            
            // Create resolved and pending complaints views
            jdbcTemplate.execute("CREATE OR REPLACE VIEW resolved_complaints AS SELECT * FROM complaints WHERE status IN ('RESOLVED', 'CLOSED')");
            jdbcTemplate.execute("CREATE OR REPLACE VIEW pending_complaints AS SELECT * FROM complaints WHERE status NOT IN ('RESOLVED', 'CLOSED', 'REJECTED')");

            // Create department views
            jdbcTemplate.execute("CREATE OR REPLACE VIEW water_department_complaints AS SELECT c.* FROM complaints c JOIN departments d ON c.department_id = d.id WHERE d.code = 'WT'");
            jdbcTemplate.execute("CREATE OR REPLACE VIEW sanitation_department_complaints AS SELECT c.* FROM complaints c JOIN departments d ON c.department_id = d.id WHERE d.code = 'SN'");
            jdbcTemplate.execute("CREATE OR REPLACE VIEW electricity_department_complaints AS SELECT c.* FROM complaints c JOIN departments d ON c.department_id = d.id WHERE d.code = 'EL'");
            jdbcTemplate.execute("CREATE OR REPLACE VIEW road_department_complaints AS SELECT c.* FROM complaints c JOIN departments d ON c.department_id = d.id WHERE d.code = 'RD'");
            jdbcTemplate.execute("CREATE OR REPLACE VIEW police_department_complaints AS SELECT c.* FROM complaints c JOIN departments d ON c.department_id = d.id WHERE d.code = 'PL'");
            jdbcTemplate.execute("CREATE OR REPLACE VIEW health_department_complaints AS SELECT c.* FROM complaints c JOIN departments d ON c.department_id = d.id WHERE d.code = 'HL'");
            log.info("Successfully registered all MySQL views.");
        } catch (Exception e) {
            log.error("Failed to create database views: {}", e.getMessage());
        }
    }
}
