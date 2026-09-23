package com.aist.tutor.domain;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/** A login session. Only the SHA-256 hash of the bearer token is stored. */
@Entity
@Table(name = "auth_session")
public class AuthSession {

    @Id
    @Column(name = "token_hash")
    private String tokenHash;

    @Column(name = "student_id")
    private Long studentId;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    protected AuthSession() {}

    public AuthSession(String tokenHash, Long studentId, LocalDateTime expiresAt) {
        this.tokenHash = tokenHash;
        this.studentId = studentId;
        this.expiresAt = expiresAt;
    }

    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }

    public Long getStudentId() { return studentId; }
}
