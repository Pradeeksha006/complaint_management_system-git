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
    private final Map<String, PendingRegistrationData> pendingRegistrationsByEmail = new ConcurrentHashMap<>();

    @Transactional
    public UserDto registerUser(RegisterRequest request) {
        String otp = String.format("%06d", new java.util.Random().nextInt(999999));

        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new BadRequestException("Username is already taken");
        }
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new BadRequestException("Email address is already in use");
        }

        PendingRegistrationData pending = findPendingRegistration(request.getUsername(), request.getEmail())
                .orElseGet(PendingRegistrationData::new);
        ensurePendingRegistrationIsUnique(pending, request.getUsername(), request.getEmail());

        if (pending.email != null && !normalizeEmail(pending.email).equals(normalizeEmail(request.getEmail()))) {
            pendingRegistrationsByEmail.remove(normalizeEmail(pending.email));
        }

        pending.username = request.getUsername();
        pending.email = request.getEmail();
        pending.password = passwordEncoder.encode(request.getPassword());
        pending.fullName = request.getFullName();
        pending.phoneNumber = request.getPhoneNumber();
        pending.otp = otp;
        pending.otpExpiry = LocalDateTime.now().plusMinutes(15);
        pendingRegistrationsByEmail.put(normalizeEmail(pending.email), pending);
        
        emailService.sendRegistrationOtpEmail(pending.email, pending.fullName, otp);

        return UserDto.builder()
                .id(null)
                .username(pending.username)
                .email(pending.email)
                .fullName(pending.fullName)
                .phoneNumber(pending.phoneNumber)
                .role(Role.ROLE_CITIZEN.name())
                .status("PENDING_VERIFICATION")
                .emailVerified(false)
                .build();
    }

    private User createVerifiedCitizen(PendingRegistrationData pending) {
        return User.builder()
                .username(pending.username)
                .email(pending.email)
                .password(pending.password)
                .fullName(pending.fullName)
                .phoneNumber(pending.phoneNumber)
                .role(Role.ROLE_CITIZEN)
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .build();
    }

    private Optional<PendingRegistrationData> findPendingRegistration(String username, String email) {
        String normalizedEmail = normalizeEmail(email);
        return pendingRegistrationsByEmail.values().stream()
                .filter(pending -> pending.username != null
                        && pending.username.equalsIgnoreCase(username))
                .findFirst()
                .or(() -> Optional.ofNullable(pendingRegistrationsByEmail.get(normalizedEmail)));
    }

    private void ensurePendingRegistrationIsUnique(PendingRegistrationData currentPending, String username, String email) {
        String normalizedEmail = normalizeEmail(email);
        boolean usernameTaken = pendingRegistrationsByEmail.values().stream()
                .anyMatch(pending -> pending != currentPending
                        && pending.username != null
                        && pending.username.equalsIgnoreCase(username));
        if (usernameTaken) {
            throw new BadRequestException("Username is already taken");
        }

        boolean emailTaken = pendingRegistrationsByEmail.values().stream()
                .anyMatch(pending -> pending != currentPending
                        && normalizeEmail(pending.email).equals(normalizedEmail));
        if (emailTaken) {
            throw new BadRequestException("Email address is already in use");
        }
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    private static class PendingRegistrationData {
        private String username;
        private String email;
        private String password;
        private String fullName;
        private String phoneNumber;
        private String otp;
        private LocalDateTime otpExpiry;
    }

    @Transactional
    public AuthResponse loginUser(AuthRequest request) {
        ensureSuperAdminCanLogin(request);

        userRepository.findByUsername(request.getUsernameOrEmail())
                .or(() -> userRepository.findByEmail(request.getUsernameOrEmail()))
                .ifPresent(user -> {
                    if (passwordEncoder.matches(request.getPassword(), user.getPassword())) {
                        if (!user.isEmailVerified()) {
                            throw new BadRequestException("Please verify your email address first");
                        }
                        if (user.getStatus() == UserStatus.INACTIVE) {
                            throw new BadRequestException("Your account is suspended");
                        }
                    }
                });

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsernameOrEmail(), request.getPassword())
        );

        User user = userRepository.findByUsername(request.getUsernameOrEmail())
                .or(() -> userRepository.findByEmail(request.getUsernameOrEmail()))
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!user.isEmailVerified()) {
            throw new BadRequestException("Please verify your email address first");
        }
        if (user.getStatus() == UserStatus.INACTIVE) {
            throw new BadRequestException("Your account is suspended");
        }

        // Prevent concurrent logins for Citizens
        if (user.getRole() == Role.ROLE_CITIZEN && activeSessionRegistry.isSessionActive(user.getUsername())) {
            throw new BadRequestException("This account is already logged in on another device.");
        }

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

    public void logoutUser() {
        SecurityUtils.getCurrentUsername().ifPresent(activeSessionRegistry::removeSession);
    }

    private void ensureSuperAdminCanLogin(AuthRequest request) {
        String login = request.getUsernameOrEmail();
        if (login == null || request.getPassword() == null) {
            return;
        }

        String superAdminEmail = "pradeeksha2006@gmail.com";
        boolean isSuperAdminLogin = "admin".equalsIgnoreCase(login)
                || superAdminEmail.equalsIgnoreCase(login);
        if (!isSuperAdminLogin) {
            return;
        }

        User admin = userRepository.findByEmail(superAdminEmail)
                .or(() -> userRepository.findByUsername("admin"))
                .or(() -> userRepository.findByUsername(login))
                .or(() -> userRepository.findByEmail(login))
                .orElseGet(() -> User.builder()
                        .username("admin")
                        .email(superAdminEmail)
                        .fullName("Super Admin")
                        .phoneNumber("1234567890")
                        .build());

        admin.setEmail(superAdminEmail);
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
    public OfficerDto createOfficer(Long userId, Long deptId, String designation) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Department dept = departmentRepository.findById(deptId)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found"));

        user.setRole(Role.ROLE_OFFICER);
        userRepository.save(user);

        // Check if officer entry exists
        Officer officer = officerRepository.findByUserId(userId).orElse(null);
        if (officer == null) {
            officer = new Officer();
            officer.setUser(user);
        }
        officer.setDepartment(dept);
        officer.setDesignation(designation);

        Officer saved = officerRepository.save(officer);
        return MapperUtils.toDto(saved);
    }

    @Transactional
    public OfficerDto createNewOfficer(com.cms.dto.OfficerCreationRequest request) {
        if (request.getSecurityPin() == null || request.getSecurityPin().isBlank()) {
            throw new BadRequestException("Secret Recovery PIN is mandatory");
        }
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new BadRequestException("Username already exists");
        }
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new BadRequestException("Email already exists");
        }

        Department dept = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department not found"));

        User user = User.builder()
                .fullName(request.getFullName())
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phoneNumber(request.getPhoneNumber())
                .role(Role.ROLE_OFFICER)
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .securityPin(request.getSecurityPin())
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
        PendingRegistrationData pending = pendingRegistrationsByEmail.get(normalizeEmail(email));
        if (pending != null) {

            if (pending.otp == null || !pending.otp.equals(code)) {
                throw new BadRequestException("Invalid verification code");
            }

            if (pending.otpExpiry == null || pending.otpExpiry.isBefore(LocalDateTime.now())) {
                throw new BadRequestException("Verification code has expired");
            }

            if (userRepository.findByUsername(pending.username).isPresent()) {
                throw new BadRequestException("Username is already taken");
            }
            if (userRepository.findByEmail(pending.email).isPresent()) {
                throw new BadRequestException("Email address is already in use");
            }

            User user = userRepository.save(createVerifiedCitizen(pending));
            pendingRegistrationsByEmail.remove(normalizeEmail(pending.email));

            AuditLog auditLog = AuditLog.builder()
                    .user(user)
                    .action("VERIFY_EMAIL_REGISTER")
                    .details("User successfully verified email during registration.")
                    .ipAddress("127.0.0.1")
                    .build();
            auditLogRepository.save(auditLog);
            return;
        }

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
        PendingRegistrationData pending = pendingRegistrationsByEmail.get(normalizeEmail(email));
        if (pending != null) {
            String otp = String.format("%06d", new java.util.Random().nextInt(999999));
            pending.otp = otp;
            pending.otpExpiry = LocalDateTime.now().plusMinutes(15);

            emailService.sendRegistrationOtpEmail(pending.email, pending.fullName, otp);
            return;
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        if (user.isEmailVerified()) {
            throw new BadRequestException("Email is already verified");
        }

        String otp = String.format("%06d", new java.util.Random().nextInt(999999));
        user.setResetOtp(otp);
        user.setResetOtpExpiry(LocalDateTime.now().plusMinutes(15));
        userRepository.save(user);

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

        if (userToDelete.getRole() == Role.ROLE_ADMIN && userToDelete.getUsername().equals("admin")) {
            throw new BadRequestException("Super Admin account cannot be deleted");
        }

        // Clean up references
        jdbcTemplate.update("UPDATE complaints SET citizen_id = NULL WHERE citizen_id = ?", id);
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

    private void validatePasswordStrength(String password) {
        if (password == null || password.length() < 8) {
            throw new BadRequestException("Password must be at least 8 characters long");
        }
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^a-zA-Z0-9\\s]).{8,}$");
        if (!pattern.matcher(password).matches()) {
            throw new BadRequestException("Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character");
        }
    }
}
