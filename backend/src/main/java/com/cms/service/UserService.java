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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
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

    @Transactional
    public UserDto registerUser(RegisterRequest request) {
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new BadRequestException("Username is already taken");
        }
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new BadRequestException("Email address is already in use");
        }

        String verificationToken = UUID.randomUUID().toString();

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phoneNumber(request.getPhoneNumber())
                .role(Role.ROLE_CITIZEN)
                .status(UserStatus.ACTIVE)
                .verificationToken(null)
                .emailVerified(true)
                .build();

        User savedUser = userRepository.save(user);
        
        // Send Verification Email
        emailService.sendVerificationEmail(savedUser.getEmail(), savedUser.getFullName(), verificationToken);

        return MapperUtils.toDto(savedUser);
    }

    public AuthResponse loginUser(AuthRequest request) {
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

        String token = tokenProvider.generateToken(user.getUsername(), user.getRole().name());

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

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setResetPasswordToken(null);
        userRepository.save(user);
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
        user.setStatus(UserStatus.valueOf(status.toUpperCase()));
        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public List<AuditLog> getAuditLogs() {
        return auditLogRepository.findAll();
    }
}
