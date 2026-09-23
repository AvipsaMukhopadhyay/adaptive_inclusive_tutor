package com.aist.tutor.service;

import com.aist.tutor.domain.AnswerLog;
import com.aist.tutor.domain.Difficulty;
import com.aist.tutor.repository.AnswerLogRepository;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Chapter mastery: a chapter is COMPLETED when the student has answered
 * {@value #MASTERY_CORRECT} different questions correctly, including at least one HARD question.
 */
@Service
public class CompletionService {

    public static final int MASTERY_CORRECT = 5;

    public enum Status { NOT_STARTED, IN_PROGRESS, COMPLETED }

    public record ChapterCompletion(int distinctCorrect, boolean hardSolved, int percent, Status status) {
        public static final ChapterCompletion NONE = new ChapterCompletion(0, false, 0, Status.NOT_STARTED);
    }

    private final AnswerLogRepository answerLogs;

    public CompletionService(AnswerLogRepository answerLogs) {
        this.answerLogs = answerLogs;
    }

    /** Completion for every chapter the student has attempted, keyed by chapter id. */
    public Map<Long, ChapterCompletion> forStudent(Long studentId) {
        return answerLogs.findByStudentId(studentId).stream()
                .collect(Collectors.groupingBy(AnswerLog::getChapterId)).entrySet().stream()
                .collect(Collectors.toMap(Map.Entry::getKey, e -> compute(e.getValue())));
    }

    public ChapterCompletion forChapter(Long studentId, Long chapterId) {
        return compute(answerLogs.findByStudentIdAndChapterId(studentId, chapterId));
    }

    static ChapterCompletion compute(List<AnswerLog> logs) {
        if (logs.isEmpty()) return ChapterCompletion.NONE;
        Set<Long> correct = new HashSet<>();
        boolean hard = false;
        for (AnswerLog l : logs) {
            if (!l.isCorrect()) continue;
            correct.add(l.getQuestionId());
            if (l.getDifficulty() == Difficulty.HARD) hard = true;
        }
        int points = Math.min(correct.size(), MASTERY_CORRECT) + (hard ? 1 : 0);
        int percent = (int) Math.round(100.0 * points / (MASTERY_CORRECT + 1));
        Status status = percent >= 100 ? Status.COMPLETED : Status.IN_PROGRESS;
        return new ChapterCompletion(correct.size(), hard, percent, status);
    }
}
