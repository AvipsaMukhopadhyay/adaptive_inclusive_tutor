package com.aist.tutor.domain;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "answer_log")
public class AnswerLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id")
    private Long studentId;
    @Column(name = "chapter_id")
    private Long chapterId;
    @Column(name = "question_id")
    private Long questionId;

    @Enumerated(EnumType.STRING)
    private Difficulty difficulty;

    private boolean correct;
    private int attempts;

    @Column(name = "time_taken_seconds")
    private int timeTakenSeconds;

    @Column(name = "rl_state")
    private String rlState;
    @Column(name = "rl_action")
    private String rlAction;
    private Double reward;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    protected AnswerLog() {}

    public AnswerLog(Long studentId, Long chapterId, Long questionId, Difficulty difficulty, boolean correct,
                     int attempts, int timeTakenSeconds, String rlState, String rlAction, Double reward) {
        this.studentId = studentId;
        this.chapterId = chapterId;
        this.questionId = questionId;
        this.difficulty = difficulty;
        this.correct = correct;
        this.attempts = attempts;
        this.timeTakenSeconds = timeTakenSeconds;
        this.rlState = rlState;
        this.rlAction = rlAction;
        this.reward = reward;
    }

    public boolean isFirstTryCorrect() { return correct && attempts == 1; }

    public Long getQuestionId() { return questionId; }
    public Long getChapterId() { return chapterId; }
    public Difficulty getDifficulty() { return difficulty; }
    public boolean isCorrect() { return correct; }
    public int getAttempts() { return attempts; }
    public int getTimeTakenSeconds() { return timeTakenSeconds; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
