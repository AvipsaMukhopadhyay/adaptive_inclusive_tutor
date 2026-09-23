package com.aist.tutor.web.dto;

import com.aist.tutor.adaptive.TutorAction;
import com.aist.tutor.domain.Difficulty;
import com.aist.tutor.personalization.AccommodationProfile;
import com.aist.tutor.personalization.LessonComposer.GuidedExample;
import com.aist.tutor.personalization.LessonComposer.Step;
import com.aist.tutor.service.CompletionService;
import com.aist.tutor.service.CompletionService.ChapterCompletion;
import com.aist.tutor.service.CompletionService.Status;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.Map;

public final class LearningDtos {

    private LearningDtos() {}

    public record LessonResponse(Long chapterId, String chapterName, String subjectName, int grade,
                                 String explanation, List<String> explanationChunks, List<String> keyPoints,
                                 List<Map<String, String>> examples, String activity,
                                 ProgressResponse progress, AccommodationProfile profile,
                                 List<Step> steps, List<GuidedExample> guidedExamples,
                                 CompletionView completion, boolean hasPendingActivity) {
    }

    /** Chapter mastery as shown to the student. */
    public record CompletionView(int percent, Status status, int distinctCorrect, boolean hardSolved, int target) {
        public static CompletionView of(ChapterCompletion c) {
            return new CompletionView(c.percent(), c.status(), c.distinctCorrect(), c.hardSolved(),
                    CompletionService.MASTERY_CORRECT);
        }
    }

    public record QuestionView(Long id, Difficulty difficulty, String prompt, List<String> options) {
    }

    public record WorkedExample(String prompt, String answer, String explanation) {
    }

    /** Shows the RL decision so the adaptive behaviour is visible and explainable. */
    public record DecisionTrace(String state, TutorAction action, List<TutorAction> allowedActions,
                                Map<TutorAction, Double> qValues, boolean resumed) {
    }

    public record LearningTrace(String state, TutorAction action, double reward, String nextState,
                                double oldQ, double newQ) {
    }

    public record ActivityResponse(TutorAction action, String tutorMessage, Difficulty difficulty,
                                   QuestionView question, List<String> reviewPoints, WorkedExample workedExample,
                                   int maxAttempts, boolean breakSuggested, DecisionTrace decision,
                                   ProgressResponse progress) {
    }

    public record AnswerRequest(@NotNull Long questionId, @NotNull String answer,
                                @Min(1) int attemptNumber, @Min(0) int timeTakenSeconds) {
    }

    public record AnswerResponse(boolean correct, boolean finished, int attemptsLeft, String hint,
                                 String correctAnswer, String explanation, String tutorMessage,
                                 LearningTrace learning, ProgressResponse progress,
                                 CompletionView completion, boolean chapterJustCompleted) {
    }

    public record ProgressResponse(Long chapterId, String chapterName, String subjectName,
                                   int questionsAttempted, int correctAnswers, int incorrectAnswers,
                                   int totalAttempts, int totalTimeSeconds, double avgTimeSeconds,
                                   double accuracy, Difficulty currentDifficulty, String learningState,
                                   int correctStreak) {
    }

    public record OverallProgress(int totalChapters, int completed, int inProgress, int notStarted, int percent) {
    }

    public record SubjectProgress(Long subjectId, String name, String icon, int totalChapters, int completed,
                                  int inProgress, int percent) {
    }

    /** The chapter to resume (in progress) or start next. */
    public record ContinueLearning(Long chapterId, String chapterName, String subjectName, String subjectIcon,
                                   int percent, boolean resume) {
    }

    public record ProgressOverview(OverallProgress overall, List<SubjectProgress> subjects,
                                   ContinueLearning continueLearning, List<ProgressResponse> chapters,
                                   List<String> strengths, List<String> struggles) {
    }

    public record ChatRequest(@NotNull Long chapterId, Long questionId, @NotBlank String message, @Min(0) int turn) {
    }
}
