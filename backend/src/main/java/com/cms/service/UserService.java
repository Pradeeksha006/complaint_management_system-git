package com.cms.service;

import com.cms.dto.*;
import com.cms.entity.*;
import com.cms.mapper.MapperUtils;
import com.cms.email.EmailService;
import com.cms.exception.BadRequestException;
import com.cms.exception.ResourceNotFoundException;
import com.cms.repository.AuditLogRepository;
import com.cms.repository.DepartmentRepository;
import com.cms.repository.OfficerRepository;
import com.cms.repository.UserRepository;
import com.cms.security.JwtTokenProvider;
import com.cms.repository.CitizenRepository;
import com.cms.entity.Citizen;
import com.cms.security.SecurityUtils;
import com.cms.security.ActiveSessionRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.jdbc.core.JdbcTemplate;
import java.io.IOException;
import java.util.Map;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final CitizenRepository citizenRepository;
    private final OfficerRepository officerRepository;
    private final DepartmentRepository departmentRepository;
    private final AuditLogRepository auditLogRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;
    private final CloudinaryService cloudinaryService;
    private final JdbcTemplate jdbcTemplate;
    private final ActiveSessionRegistry activeSessionRegistry;

    @org.springframework.beans.factory.annotation.Value("${app.admin.username:superadmin}")
    private String adminUsername;

    @org.springframework.beans.factory.annotation.Value("${app.admin.email:pradeeksha2006@gmail.com}")
    private String adminEmail;
    @Transactional
    public UserDto registerUser(RegisterRequest request) {
        // Registrations are for citizens; store in the dedicated 'users' table
        // Prevent registration with reserved admin email or username
        if (adminEmail.equalsIgnoreCase(request.getEmail()) || adminUsername.equalsIgnoreCase(request.getUsername())) {
            throw new BadRequestException("Admin email or username is reserved");
        }
        // Reject if email or username already exists (verified accounts)
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new BadRequestException("Username already exists");
        }
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new BadRequestException("Email already exists");
        }
        String otp = String.format("%06d", new java.util.Random().nextInt(999999));

        // Clean up any existing user (admin/officer/citizen) with the same username or email that is not yet verified
        userRepository.findByUsername(request.getUsername()).ifPresent(u -> {
            if (!u.isEmailVerified()) {
                userRepository.delete(u);
                userRepository.flush();
            }
        });
        userRepository.findByEmail(request.getEmail()).ifPresent(u -> {
            if (!u.isEmailVerified()) {
                userRepository.delete(u);
                userRepository.flush();
            }
        });

        // Create a new User entry with role CITIZEN and pending verification status
        User newUser = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phoneNumber(request.getPhoneNumber())
                .role(Role.ROLE_CITIZEN)
                .status(UserStatus.PENDING)
                .emailVerified(false)
                .build();
        // Set OTP and expiry for verification
        newUser.setResetOtp(otp);
        newUser.setResetOtpExpiry(LocalDateTime.now().plusMinutes(15));
        userRepository.save(newUser);

        // Send OTP for email verification
        log.info("Sending registration OTP {} to email {}", otp, newUser.getEmail());
        emailService.sendRegistrationOtpEmail(newUser.getEmail(), newUser.getFullName(), otp);

        // Return DTO for the newly created user
        return UserDto.builder()
                .id(newUser.getId())
                .username(newUser.getUsername())
                .email(newUser.getEmail())
                .fullName(newUser.getFullName())
                .phoneNumber(newUser.getPhoneNumber())
                .role(Role.ROLE_CITIZEN.name())
                .status(UserStatus.PENDING.name())
                .emailVerified(false)
                .build();

    }

    @Transactional
    public AuthResponse loginUser(AuthRequest request) {
        // Allow super admin login without restrictions
        // Duplicate login block removed

        // Attempt to find a regular user (admin/officer)
        Optional<User> userOpt = userRepository.findByUsername(request.getUsernameOrEmail())
                .or(() -> userRepository.findByEmail(request.getUsernameOrEmail()));
        // If the login matches the reserved super admin credentials but the stored role is ADMIN,
        // downgrade it to a citizen role to prevent admin dashboard access.


        if (userOpt.isPresent()) {
            User user = userOpt.get();
            // Verify password
            if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
                throw new BadRequestException("Invalid credentials");
            }
            // Verify email and status
            if (!user.isEmailVerified()) {
                throw new BadRequestException("Please verify your email address first");
            }
            if (user.getStatus() == UserStatus.INACTIVE) {
                throw new BadRequestException("Your account is suspended");
            }
            // Prevent concurrent logins for Citizens (regular users may also be citizens, but handled separately)
            if (user.getRole() == Role.ROLE_CITIZEN && activeSessionRegistry.isSessionActive(user.getUsername())) {
                throw new BadRequestException("This account is already logged in on another device.");
            }
            // Generate JWT token
            String token = tokenProvider.generateToken(user.getUsername(), user.getRole().name());
            // Register active session
            activeSessionRegistry.registerSession(user.getUsername(), token);
            // Send login alert email
            emailService.sendLoginAlertEmail(user.getEmail(), user.getFullName());

            Long deptId = null;
            if (user.getRole() == Role.ROLE_OFFICER || user.getRole() == Role.ROLE_DEPT_HEAD) {
                Officer officer = officerRepository.findByUserId(user.getId()).orElse(null);
                if (officer != null) {
                    deptId = officer.getDepartment().getId();
                }
            }

            return AuthResponse.builder()
                    .token(token)
                    .id(user.getId())
                    .username(user.getUsername())
                    .email(user.getEmail())
                    .fullName(user.getFullName())
                    .role(user.getRole().name())
                    .departmentId(deptId)
                    .build();
        }

        // If not a regular user, attempt citizen login
        Citizen citizen = citizenRepository.findByUsername(request.getUsernameOrEmail())
                .or(() -> citizenRepository.findByEmail(request.getUsernameOrEmail()))
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (!passwordEncoder.matches(request.getPassword(), citizen.getPassword())) {
            throw new BadRequestException("Invalid credentials");
        }
        // Generate token for citizen
        String token = tokenProvider.generateToken(citizen.getUsername(), Role.ROLE_CITIZEN.name());
        activeSessionRegistry.registerSession(citizen.getUsername(), token);
        emailService.sendLoginAlertEmail(citizen.getEmail(), citizen.getFullName());

        return AuthResponse.builder()
                .token(token)
                .id(citizen.getId())
                .username(citizen.getUsername())
                .email(citizen.getEmail())
                .fullName(citizen.getFullName())
                .role(Role.ROLE_CITIZEN.name())
                .departmentId(null)
                .build();
    }

    public void logoutUser() {
        SecurityUtils.getCurrentUsername().ifPresent(activeSessionRegistry::removeSession);
    }

    private void ensureSuperAdminCanLogin(AuthRequest request) {
        String login = request.getUsernameOrEmail();
        if (login == null || request.getPassword() == null) {
            return;
        }

        boolean isSuperAdminLogin = adminUsername.equalsIgnoreCase(login)
                || adminEmail.equalsIgnoreCase(login);
        if (!isSuperAdminLogin) {
            return;
        }

        User admin = userRepository.findByEmail(adminEmail)
                .or(() -> userRepository.findByUsername(adminUsername))
                .or(() -> userRepository.findByUsername(login))
                .or(() -> userRepository.findByEmail(login))
                .orElseGet(() -> User.builder()
                        .username(adminUsername)
                        .email(adminEmail)
                        .fullName("Super Admin")
                        .phoneNumber("1234567890")
                        .build());

        admin.setEmail(adminEmail);
        admin.setFullName("Super Admin");
        admin.setRole(Role.ROLE_ADMIN);
        admin.setStatus(UserStatus.ACTIVE);
        admin.setEmailVerified(true);
        admin.setSecurityPin("123456");
        User savedAdmin = userRepository.save(admin);
        officerRepository.findByUserId(savedAdmin.getId()).ifPresent(officerRepository::delete);
    }

    @Transactional
    public void verifyEmail(String token) {
        User user = userRepository.findByVerificationToken(token)
                .orElseThrow(() -> new BadRequestException("Invalid verification token"));

        user.setEmailVerified(true);
        user.setStatus(UserStatus.ACTIVE);
        user.setVerificationToken(null);
        userRepository.save(user);
    }

    @Transactional
    public void initiateForgotPassword(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        String token = UUID.randomUUID().toString();
        user.setResetPasswordToken(token);
        userRepository.save(user);

        emailService.sendResetPasswordEmail(user.getEmail(), user.getFullName(), token);
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        User user = userRepository.findByResetPasswordToken(token)
                .orElseThrow(() -> new BadRequestException("Invalid reset token"));

        if (newPassword == null || newPassword.isBlank()) {
            throw new BadRequestException("New password is required");
        }
        validatePasswordStrength(newPassword);
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setResetPasswordToken(null);
        userRepository.saveAndFlush(user);
    }



    @Transactional
    public OfficerDto createNewOfficer(com.cms.dto.OfficerCreationRequest request) {

        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new BadRequestException("Username already exists");
        }
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new BadRequestException("Email already exists");
        }

                // Determine department. Superintendent (admin) does not need to provide departmentId.
        Department dept;
        User currentUser = SecurityUtils.getCurrentUsername()
                .flatMap(userRepository::findByUsername)
                .orElseThrow(() -> new BadRequestException("Unable to determine current user"));
        if (currentUser.getRole() == Role.ROLE_ADMIN) {
            // Assign default department (e.g., the first available department)
            dept = departmentRepository.findAll().stream().findFirst()
                    .orElseThrow(() -> new ResourceNotFoundException("No departments found"));
        } else {
            if (request.getDepartmentId() == null) {
                throw new BadRequestException("Department ID is required");
            }
            dept = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Department not found"));
        }

        User user = User.builder()
                .fullName(request.getFullName())
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phoneNumber(request.getPhoneNumber())
                .role(Role.ROLE_OFFICER)
                .status(UserStatus.ACTIVE)
                .emailVerified(true)

                .build();
        User savedUser = userRepository.save(user);

        Officer officer = new Officer();
        officer.setUser(savedUser);
        officer.setDepartment(dept);
        officer.setDesignation(request.getDesignation());
        
        Officer savedOfficer = officerRepository.save(officer);

        // Save Audit Log
        AuditLog audit = AuditLog.builder()
                .user(savedUser)
                .action("CREATE_OFFICER")
                .details("Created new Officer account: " + request.getUsername() + " in department: " + dept.getName())
                .ipAddress("127.0.0.1")
                .build();
        auditLogRepository.save(audit);

        return MapperUtils.toDto(savedOfficer);
    }

    @Transactional
    public void promoteToDeptHead(Long officerId) {
        Officer officer = officerRepository.findById(officerId)
                .orElseThrow(() -> new ResourceNotFoundException("Officer not found"));
        
        User user = officer.getUser();
        user.setRole(Role.ROLE_DEPT_HEAD);
        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(MapperUtils::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<OfficerDto> getAllOfficers() {
        return officerRepository.findAll().stream()
                .map(MapperUtils::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public void updateUserStatus(Long id, String status) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        UserStatus nextStatus = UserStatus.valueOf(status.toUpperCase());
        user.setStatus(nextStatus);
        if (nextStatus == UserStatus.ACTIVE && user.getRole() == Role.ROLE_CITIZEN) {
            user.setEmailVerified(true);
            user.setResetOtp(null);
            user.setResetOtpExpiry(null);
        }
        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public List<AuditLog> getAuditLogs() {
        return auditLogRepository.findAll();
    }

    @Transactional
    public UserDto updateProfile(ProfileUpdateRequest request) {
        String username = SecurityUtils.getCurrentUsername()
                .orElseThrow(() -> new BadRequestException("Not authenticated"));
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Update phone number if provided
        if (request.getPhoneNumber() != null && !request.getPhoneNumber().isBlank()) {
            user.setPhoneNumber(request.getPhoneNumber());
        }

        // Update full name if provided
        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setFullName(request.getFullName());
        }

        // Update profile picture url if provided
        if (request.getProfilePictureUrl() != null) {
            user.setProfilePictureUrl(request.getProfilePictureUrl());
        }

        // Handle password change if requested
        if (request.getNewPassword() != null && !request.getNewPassword().isBlank()) {
            if (request.getCurrentPassword() == null || request.getCurrentPassword().isBlank()) {
                throw new BadRequestException("Current password is required to change password");
            }
            if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
                throw new BadRequestException("Incorrect current password");
            }
            if (!request.getNewPassword().equals(request.getConfirmPassword())) {
                throw new BadRequestException("New password and confirm password do not match");
            }
            validatePasswordStrength(request.getNewPassword());
            user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        }

        User saved = userRepository.save(user);

        // Save Audit Log
        AuditLog audit = AuditLog.builder()
                .user(user)
                .action("UPDATE_PROFILE")
                .details("User updated profile settings.")
                .ipAddress("127.0.0.1")
                .build();
        auditLogRepository.save(audit);

        return MapperUtils.toDto(saved);
    }

    @Transactional
    public void deleteAvatar() {
        String username = SecurityUtils.getCurrentUsername()
                .orElseThrow(() -> new BadRequestException("Not authenticated"));
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        // Remove profile picture URL
        user.setProfilePictureUrl(null);
        userRepository.save(user);

        // Audit log for deletion
        AuditLog audit = AuditLog.builder()
                .user(user)
                .action("DELETE_AVATAR")
                .details("User removed profile picture.")
                .ipAddress("127.0.0.1")
                .build();
        auditLogRepository.save(audit);
    }

    @Transactional
    public UserDto uploadAvatar(MultipartFile file) throws IOException {
        String username = SecurityUtils.getCurrentUsername()
                .orElseThrow(() -> new BadRequestException("Not authenticated"));
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (file == null || file.isEmpty()) {
            throw new BadRequestException("File is empty");
        }

        Map<String, String> uploadRes = cloudinaryService.uploadFile(file, "avatars/" + username);
        String avatarUrl = uploadRes.get("url");

        user.setProfilePictureUrl(avatarUrl);
        User saved = userRepository.save(user);

        AuditLog audit = AuditLog.builder()
                .user(user)
                .action("UPLOAD_AVATAR")
                .details("User uploaded profile picture.")
                .ipAddress("127.0.0.1")
                .build();
        auditLogRepository.save(audit);

        return MapperUtils.toDto(saved);
    }

    @Transactional
    public ForgotPasswordResponse initiateOtpForgotPassword(String email) {
        String emailOrUsername = email == null ? "" : email.trim();
        User user = userRepository.findByEmail(emailOrUsername)
                .or(() -> userRepository.findByUsername(emailOrUsername))
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email/username: " + emailOrUsername));

        if (user.getRole() == Role.ROLE_DEPT_HEAD) {
            return ForgotPasswordResponse.builder()
                    .requiresPin(true)
                    .message("Staff account detected. Please verify with your Secret Recovery PIN.")
                    .build();
        } else {
            String otp = user.getResetOtp();
            if (otp == null || user.getResetOtpExpiry() == null || LocalDateTime.now().isAfter(user.getResetOtpExpiry())) {
                otp = String.format("%06d", new java.util.Random().nextInt(900000) + 100000);
                user.setResetOtp(otp);
                user.setResetOtpExpiry(LocalDateTime.now().plusMinutes(10));
                userRepository.save(user);
            }

            emailService.sendResetOtpEmail(user.getEmail(), user.getFullName(), otp);

            return ForgotPasswordResponse.builder()
                    .requiresPin(false)
                    .message("Verification code (OTP) has been sent to your email: " + user.getEmail())
                    .build();
        }
    }

    @Transactional
    public void verifyAndResetPassword(ResetPasswordRequest request) {
        String emailOrUsername = request.getEmail() == null ? "" : request.getEmail().trim();
        String code = request.getCode() == null ? "" : request.getCode().trim();

        User user = userRepository.findByEmail(emailOrUsername)
                .or(() -> userRepository.findByUsername(emailOrUsername))
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getRole() == Role.ROLE_DEPT_HEAD) {
            if (user.getSecurityPin() == null || !user.getSecurityPin().trim().equals(code)) {
                throw new BadRequestException("Invalid Secret Recovery PIN");
            }
        } else {
            if (user.getResetOtp() == null || !user.getResetOtp().trim().equals(code)) {
                throw new BadRequestException("Invalid Verification Code (OTP)");
            }
            if (user.getResetOtpExpiry() == null || LocalDateTime.now().isAfter(user.getResetOtpExpiry())) {
                throw new BadRequestException("Verification Code (OTP) has expired");
            }
            user.setResetOtp(null);
            user.setResetOtpExpiry(null);
        }

        if (request.getNewPassword() == null || request.getNewPassword().isBlank()) {
            throw new BadRequestException("New password is required");
        }
        validatePasswordStrength(request.getNewPassword());

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        
        // Auto-activate the user if they successfully complete password recovery OTP verification
        user.setEmailVerified(true);
        if (user.getStatus() == UserStatus.PENDING) {
            user.setStatus(UserStatus.ACTIVE);
        }
        
        userRepository.saveAndFlush(user);

        // Audit Log
        AuditLog audit = AuditLog.builder()
                .user(user)
                .action("RESET_PASSWORD")
                .details("User reset password via " + (user.getRole() == Role.ROLE_DEPT_HEAD ? "Security PIN" : "OTP") + ".")
                .ipAddress("127.0.0.1")
                .build();
        auditLogRepository.save(audit);
    }

    @Transactional
    public void verifyRegistrationOtp(String email, String code) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        if (user.isEmailVerified()) {
            throw new BadRequestException("Email is already verified");
        }

        if (user.getResetOtp() == null || !user.getResetOtp().equals(code)) {
            throw new BadRequestException("Invalid verification code");
        }

        if (user.getResetOtpExpiry() == null || user.getResetOtpExpiry().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Verification code has expired");
        }

        // Activate user
        user.setEmailVerified(true);
        user.setStatus(UserStatus.ACTIVE);
        user.setResetOtp(null);
        user.setResetOtpExpiry(null);
        userRepository.save(user);

        // Save Audit Log
        AuditLog auditLog = AuditLog.builder()
                .user(user)
                .action("VERIFY_EMAIL_REGISTER")
                .details("User successfully verified email during registration.")
                .ipAddress("127.0.0.1")
                .build();
        auditLogRepository.save(auditLog);
    }

    @Transactional
    public void resendRegistrationOtp(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        if (user.isEmailVerified()) {
            throw new BadRequestException("Email is already verified");
        }

        String otp = String.format("%06d", new java.util.Random().nextInt(999999));
        user.setResetOtp(otp);
        user.setResetOtpExpiry(LocalDateTime.now().plusMinutes(15));
        userRepository.save(user);

        log.info("Sending registration OTP {} to email {}", otp, user.getEmail());
        emailService.sendRegistrationOtpEmail(user.getEmail(), user.getFullName(), otp);
    }

    @Transactional(readOnly = true)
    public void verifyResetOtp(String email, String code) {
        String emailOrUsername = email == null ? "" : email.trim();
        String verificationCode = code == null ? "" : code.trim();

        User user = userRepository.findByEmail(emailOrUsername)
                .or(() -> userRepository.findByUsername(emailOrUsername))
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getRole() == Role.ROLE_DEPT_HEAD) {
            if (user.getSecurityPin() == null || !user.getSecurityPin().trim().equals(verificationCode)) {
                throw new BadRequestException("Invalid Secret Recovery PIN");
            }
        } else {
            if (user.getResetOtp() == null || !user.getResetOtp().trim().equals(verificationCode)) {
                throw new BadRequestException("Invalid Verification Code (OTP)");
            }
            if (user.getResetOtpExpiry() == null || LocalDateTime.now().isAfter(user.getResetOtpExpiry())) {
                throw new BadRequestException("Verification Code (OTP) has expired");
            }
        }
    }

    @Transactional
    public void deleteUser(Long id) {
        String currentUsername = SecurityUtils.getCurrentUsername()
                .orElseThrow(() -> new BadRequestException("Unauthenticated user"));
        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (currentUser.getRole() != Role.ROLE_ADMIN) {
            throw new BadRequestException("Only administrators can delete users");
        }

        User userToDelete = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User to delete not found"));

        if (userToDelete.getRole() == Role.ROLE_ADMIN && userToDelete.getUsername().equals(adminUsername)) {
            throw new BadRequestException("Super Admin account cannot be deleted");
        }

        // Clean up references
        jdbcTemplate.update("UPDATE complaints SET cid = NULL WHERE cid = ?", id);
        jdbcTemplate.update("UPDATE complaint_timeline SET updated_by_id = NULL WHERE updated_by_id = ?", id);
        jdbcTemplate.update("UPDATE audit_logs SET user_id = NULL WHERE user_id = ?", id);
        jdbcTemplate.update("DELETE FROM notifications WHERE user_id = ?", id);
        jdbcTemplate.update("DELETE FROM complaint_supports WHERE user_id = ?", id);
        officerRepository.findByUserId(id).ifPresent(officer -> {
            jdbcTemplate.update("UPDATE complaints SET assigned_officer_id = NULL WHERE assigned_officer_id = ?", officer.getId());
            officerRepository.delete(officer);
        });

        userRepository.delete(userToDelete);

        // Audit Log
        AuditLog audit = AuditLog.builder()
                .user(currentUser)
                .action("DELETE_USER")
                .details("Administrator deleted user: " + userToDelete.getUsername() + " (ID: " + id + ")")
                .ipAddress("127.0.0.1")
                .build();
        auditLogRepository.save(audit);
    }

    public Map<String, Object> debugLogin(String usernameOrEmail, String password) {
        Map<String, Object> result = new java.util.HashMap<>();
        result.put("inputUsernameOrEmail", usernameOrEmail);
        result.put("inputPasswordLength", password == null ? 0 : password.length());

        Optional<User> userOpt = userRepository.findByUsername(usernameOrEmail)
                .or(() -> userRepository.findByEmail(usernameOrEmail));

        if (userOpt.isEmpty()) {
            result.put("status", "USER_NOT_FOUND");
            return result;
        }

        User user = userOpt.get();
        result.put("dbUsername", user.getUsername());
        result.put("dbEmail", user.getEmail());
        result.put("dbRole", user.getRole().name());
        result.put("dbStatus", user.getStatus().name());
        result.put("dbEmailVerified", user.isEmailVerified());

        boolean matches = passwordEncoder.matches(password, user.getPassword());
        result.put("passwordMatches", matches);

        if (matches) {
            result.put("status", "SUCCESS");
        } else {
            result.put("status", "PASSWORD_MISMATCH");
        }

        return result;
    }

    private void validatePasswordStrength(String password) {
        if (password == null || password.length() < 8) {
            throw new BadRequestException("Password must be at least 8 characters long");
        }
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^a-zA-Z0-9\\s]).{8,}$");
        if (!pattern.matcher(password).matches()) {
            throw new BadRequestException("Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character");
        }
    }
    /**
     * Delete a user (citizen) by email. Used for cleanup of test accounts.
     * Throws BadRequestException if user not found.
     */
    @Transactional
    public void deleteUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("User with email " + email + " not found"));
        userRepository.delete(user);
    }

    /**
     * Change the role of a user identified by email to ROLE_CITIZEN.
     * Used for converting an admin account to a citizen account.
     */
    @Transactional
    public void convertAdminToCitizen(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("User with email " + email + " not found"));
        // Only perform conversion if current role is ADMIN
        if (user.getRole() == Role.ROLE_ADMIN) {
            user.setRole(Role.ROLE_CITIZEN);
            userRepository.save(user);
        }
    }
    
    // existing closing brace


}
