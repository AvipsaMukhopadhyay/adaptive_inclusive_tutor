package com.aist.tutor.domain;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Entity
@Table(name = "student")
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String email;
    private String phone;
    private int grade;
    private String board;

    @Enumerated(EnumType.STRING)
    @Column(name = "learner_type")
    private LearnerType learnerType;

    /** Comma-separated {@link LearningNeed} names. */
    @Column(name = "special_needs")
    private String specialNeeds;

    @Column(name = "other_needs")
    private String otherNeeds;

    /** BCrypt hash; never exposed through the API. */
    @Column(name = "password_hash")
    private String passwordHash;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public List<LearningNeed> getNeeds() {
        if (learnerType != LearnerType.SPECIAL_NEEDS || specialNeeds == null || specialNeeds.isBlank()) {
            return List.of();
        }
        return Arrays.stream(specialNeeds.split(",")).map(String::trim).map(LearningNeed::valueOf).toList();
    }

    public void setNeeds(List<LearningNeed> needs) {
        this.specialNeeds = needs == null ? null : String.join(",", needs.stream().map(Enum::name).toList());
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public int getGrade() { return grade; }
    public void setGrade(int grade) { this.grade = grade; }
    public String getBoard() { return board; }
    public void setBoard(String board) { this.board = board; }
    public LearnerType getLearnerType() { return learnerType; }
    public void setLearnerType(LearnerType learnerType) { this.learnerType = learnerType; }
    public String getOtherNeeds() { return otherNeeds; }
    public void setOtherNeeds(String otherNeeds) { this.otherNeeds = otherNeeds; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
}
