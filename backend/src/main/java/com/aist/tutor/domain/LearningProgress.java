package com.aist.tutor.domain;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "learning_progress")
public class LearningProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id")
    private Long studentId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "chapter_id")
    private Chapter chapter;

    @Column(name = "questions_attempted")
    private int questionsAttempted;
    @Column(name = "correct_answers")
    private int correctAnswers;
    @Column(name = "incorrect_answers")
    private int incorrectAnswers;
    @Column(name = "total_attempts")
    private int totalAttempts;
    @Column(name = "total_time_seconds")
    private int totalTimeSeconds;

    @Enumerated(EnumType.STRING)
    @Column(name = "current_difficulty")
    private Difficulty currentDifficulty;

    @Column(name = "learning_state")
    private String learningState;

    @Column(name = "correct_streak")
    private int correctStreak;

    /** RL bookkeeping for the activity currently in front of the student. */
    @Column(name = "pending_state")
    private String pendingState;
    @Column(name = "pending_action")
    private String pendingAction;
    @Column(name = "pending_question_id")
    private Long pendingQuestionId;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    protected LearningProgress() {}

    public LearningProgress(Long studentId, Chapter chapter, Difficulty startDifficulty) {
        this.studentId = studentId;
        this.chapter = chapter;
        this.currentDifficulty = startDifficulty;
    }

    public void recordQuestion(boolean correct, int attempts, int timeSeconds, boolean firstTry) {
        questionsAttempted++;
        totalAttempts += attempts;
        totalTimeSeconds += timeSeconds;
        if (correct) correctAnswers++; else incorrectAnswers++;
        correctStreak = firstTry ? correctStreak + 1 : 0;
        updatedAt = LocalDateTime.now();
    }

    /** Called when difficulty changes: the streak must be earned again at the new level. */
    public void changeDifficulty(Difficulty difficulty) {
        if (difficulty != currentDifficulty) {
            currentDifficulty = difficulty;
            correctStreak = 0;
        }
    }

    public void setPending(String state, String action, Long questionId) {
        this.pendingState = state;
        this.pendingAction = action;
        this.pendingQuestionId = questionId;
    }

    public void clearPending() {
        setPending(null, null, null);
    }

    public double accuracy() {
        return questionsAttempted == 0 ? 0 : (double) correctAnswers / questionsAttempted;
    }

    public Long getId() { return id; }
    public Long getStudentId() { return studentId; }
    public Chapter getChapter() { return chapter; }
    public int getQuestionsAttempted() { return questionsAttempted; }
    public int getCorrectAnswers() { return correctAnswers; }
    public int getIncorrectAnswers() { return incorrectAnswers; }
    public int getTotalAttempts() { return totalAttempts; }
    public int getTotalTimeSeconds() { return totalTimeSeconds; }
    public Difficulty getCurrentDifficulty() { return currentDifficulty; }
    public String getLearningState() { return learningState; }
    public void setLearningState(String s) { this.learningState = s; }
    public int getCorrectStreak() { return correctStreak; }
    public String getPendingState() { return pendingState; }
    public String getPendingAction() { return pendingAction; }
    public Long getPendingQuestionId() { return pendingQuestionId; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public LocalDateTime getCompletedAt() { return completedAt; }

    /** Marks the chapter as mastered; returns true only the first time. */
    public boolean markCompleted() {
        if (completedAt != null) return false;
        completedAt = LocalDateTime.now();
        return true;
    }
}
