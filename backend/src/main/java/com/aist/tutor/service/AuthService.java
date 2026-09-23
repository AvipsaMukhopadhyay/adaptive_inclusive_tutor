package com.aist.tutor.service;

import com.aist.tutor.domain.AuthSession;
import com.aist.tutor.domain.Student;
import com.aist.tutor.repository.AuthSessionRepository;
import com.aist.tutor.repository.StudentRepository;
import com.aist.tutor.web.ApiException;
import com.aist.tutor.web.dto.AuthDtos.AuthResponse;
import com.aist.tutor.web.dto.AuthDtos.LoginRequest;
import com.aist.tutor.web.dto.AuthDtos.SignupRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Optional;

/** Sign-up, login and bearer-token sessions. */
@Service
public class AuthService {

    private static final int SESSION_DAYS = 30;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final StudentRepository students;
    private final AuthSessionRepository sessions;
    private final StudentService studentService;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public AuthService(StudentRepository students, AuthSessionRepository sessions, StudentService studentService) {
        this.students = students;
        this.sessions = sessions;
        this.studentService = studentService;
    }

    @Transactional
    public AuthResponse signup(SignupRequest req) {
        if (students.existsByEmailIgnoreCaseAndPasswordHashIsNotNull(req.profile().email().trim())) {
            throw new ApiException(HttpStatus.CONFLICT, "An account with this email already exists. Please log in.");
        }
        Student student = studentService.create(req.profile(), encoder.encode(req.password()));
        return new AuthResponse(openSession(student.getId()), studentService.get(student.getId()));
    }

    @Transactional
    public AuthResponse login(LoginRequest req) {
        Student student = students.findByEmailIgnoreCaseAndPasswordHashIsNotNull(req.email().trim())
                .filter(s -> encoder.matches(req.password(), s.getPasswordHash()))
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Incorrect email or password."));
        return new AuthResponse(openSession(student.getId()), studentService.get(student.getId()));
    }

    @Transactional
    public void logout(String token) {
        sessions.deleteById(hash(token));
    }

    /** Resolves a bearer token to a student id, if the session exists and has not expired. */
    @Transactional(readOnly = true)
    public Optional<Long> studentIdFor(String token) {
        if (token == null || token.isBlank()) return Optional.empty();
        return sessions.findById(hash(token)).filter(s -> !s.isExpired()).map(AuthSession::getStudentId);
    }

    private String openSession(Long studentId) {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        sessions.save(new AuthSession(hash(token), studentId, LocalDateTime.now().plusDays(SESSION_DAYS)));
        return token;
    }

    private static String hash(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
