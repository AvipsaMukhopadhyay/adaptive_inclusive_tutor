package com.aist.tutor.service;

import com.aist.tutor.adaptive.AdaptiveEngine;
import com.aist.tutor.adaptive.AdaptiveEngine.Decision;
import com.aist.tutor.adaptive.AdaptiveEngine.Learning;
import com.aist.tutor.adaptive.LearnerState;
import com.aist.tutor.adaptive.Outcome;
import com.aist.tutor.adaptive.StateEncoder;
import com.aist.tutor.adaptive.TutorAction;
import com.aist.tutor.domain.*;
import com.aist.tutor.personalization.AccommodationProfile;
import com.aist.tutor.personalization.AccommodationService;
import com.aist.tutor.personalization.LessonComposer;
import com.aist.tutor.service.CompletionService.ChapterCompletion;
import com.aist.tutor.repository.AnswerLogRepository;
import com.aist.tutor.repository.LearningProgressRepository;
import com.aist.tutor.repository.QuestionRepository;
import com.aist.tutor.tutor.TutorContext;
import com.aist.tutor.tutor.TutorEngine;
import com.aist.tutor.tutor.TutorReply;
import com.aist.tutor.web.ApiException;
import com.aist.tutor.web.dto.LearningDtos.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * The learning loop for one student in one chapter:
 * lesson -> next activity (RL decision) -> answer -> reward + Q-update -> next activity ...
 */
@Service
public class LearningService {

    private final StudentService students;
    private final CurriculumService curriculum;
    private final AccommodationService accommodations;
    private final QuestionRepository questions;
    private final LearningProgressRepository progressRepo;
    private final AnswerLogRepository answerLogs;
    private final AdaptiveEngine engine;
    private final TutorEngine tutor;
    private final LessonComposer composer;
    private final CompletionService completion;

    public LearningService(StudentService students, CurriculumService curriculum, AccommodationService accommodations,
                           QuestionRepository questions, LearningProgressRepository progressRepo,
                           AnswerLogRepository answerLogs, AdaptiveEngine engine, TutorEngine tutor,
                           LessonComposer composer, CompletionService completion) {
        this.composer = composer;
        this.completion = completion;
        this.students = students;
        this.curriculum = curriculum;
        this.accommodations = accommodations;
        this.questions = questions;
        this.progressRepo = progressRepo;
        this.answerLogs = answerLogs;
        this.engine = engine;
        this.tutor = tutor;
    }

    // ---------------------------------------------------------------- lesson

    @Transactional
    public LessonResponse lesson(Long studentId, Long chapterId) {
        Student student = students.require(studentId);
        Chapter chapter = curriculum.requireChapterFor(student, chapterId);
        AccommodationProfile profile = accommodations.profileFor(student);
        LearningProgress progress = progressFor(student, chapter, profile);

        return new LessonResponse(chapter.getId(), chapter.getChapterName(), chapter.getSubject().getName(),
                chapter.getSubject().getGrade(), chapter.getExplanation(),
                chunk(chapter, profile), chapter.getKeyPoints(), examplesFor(chapter, profile),
                chapter.getActivity(), toProgress(progress), profile,
                profile.stepByStep() ? composer.steps(chapter) : List.of(),
                profile.guidedExamples() ? composer.guidedExamples(questionsByDifficulty(chapter.getId())) : List.of(),
                CompletionView.of(completion.forChapter(studentId, chapterId)),
                progress.getPendingQuestionId() != null);
    }

    private Map<Difficulty, List<Question>> questionsByDifficulty(Long chapterId) {
        Map<Difficulty, List<Question>> map = new EnumMap<>(Difficulty.class);
        for (Difficulty d : Difficulty.values()) {
            map.put(d, questions.findByChapterIdAndDifficultyOrderByIdAsc(chapterId, d));
        }
        return map;
    }

    /** Splits the explanation into small parts for students who benefit from chunked content. */
    private static List<String> chunk(Chapter chapter, AccommodationProfile profile) {
        if (profile.simpleLanguage()) {
            // Key points are already short, plain sentences.
            return group(chapter.getKeyPoints(), Math.max(profile.chunkSize(), 1));
        }
        List<String> sentences = Arrays.stream(chapter.getExplanation().split("(?<=[.!?])\\s+"))
                .filter(s -> !s.isBlank()).toList();
        return profile.chunkSize() > 0 ? group(sentences, profile.chunkSize())
                : List.of(chapter.getExplanation());
    }

    private static List<String> group(List<String> items, int size) {
        List<String> out = new ArrayList<>();
        for (int i = 0; i < items.size(); i += size) {
            out.add(String.join(" ", items.subList(i, Math.min(i + size, items.size()))));
        }
        return out;
    }

    /** Visual learners see examples with a picture first. */
    private static List<Map<String, String>> examplesFor(Chapter chapter, AccommodationProfile profile) {
        List<Map<String, String>> examples = new ArrayList<>(chapter.getExamples());
        if (profile.visualExamples()) {
            examples.sort(Comparator.comparing(e -> e.getOrDefault("visual", "").isBlank()));
        }
        return examples;
    }

    // ---------------------------------------------------------------- next activity (RL decision)

    @Transactional
    public ActivityResponse nextActivity(Long studentId, Long chapterId) {
        Student student = students.require(studentId);
        Chapter chapter = curriculum.requireChapterFor(student, chapterId);
        AccommodationProfile profile = accommodations.profileFor(student);
        LearningProgress progress = progressFor(student, chapter, profile);

        // Resume an unfinished activity (e.g. after a page refresh) instead of skipping it unlearned.
        if (progress.getPendingQuestionId() != null) {
            Question pending = questions.findById(progress.getPendingQuestionId()).orElse(null);
            if (pending != null) {
                LearnerState state = LearnerState.fromKey(progress.getPendingState());
                TutorAction action = TutorAction.valueOf(progress.getPendingAction());
                DecisionTrace trace = new DecisionTrace(state.key(), action, List.of(action),
                        engine.values(studentId, state), true);
                return buildActivity(student, chapter, profile, progress, action, pending, trace);
            }
        }

        LearnerState state = engine.observe(progress.getCurrentDifficulty(), recentOutcomes(studentId, chapterId),
                progress.getCorrectStreak(), profile);
        Decision decision = engine.decide(studentId, state, profile);
        // Questions already shown as guided examples are served last, so practice stays fresh.
        Set<Long> shownAsExamples = profile.guidedExamples()
                ? composer.guidedExamples(questionsByDifficulty(chapterId)).stream()
                        .map(LessonComposer.GuidedExample::questionId).collect(Collectors.toSet())
                : Set.of();
        Question question = pickQuestion(studentId, chapterId, decision.nextDifficulty(), shownAsExamples);
        progress.changeDifficulty(question.getDifficulty());
        progress.setPending(state.key(), decision.action().name(), question.getId());
        progress.setLearningState(state.key());
        progressRepo.save(progress);

        DecisionTrace trace = new DecisionTrace(state.key(), decision.action(), decision.allowed(),
                decision.qValues(), false);
        return buildActivity(student, chapter, profile, progress, decision.action(), question, trace);
    }

    private ActivityResponse buildActivity(Student student, Chapter chapter, AccommodationProfile profile,
                                           LearningProgress progress, TutorAction action, Question question,
                                           DecisionTrace trace) {
        List<String> reviewPoints = null;
        WorkedExample worked = null;
        if (action == TutorAction.REVIEW_EASIER) {
            reviewPoints = chapter.getKeyPoints().stream().limit(profile.chunkSize() > 0 ? 2 : 4).toList();
        } else if (action == TutorAction.WORKED_EXAMPLE) {
            worked = questions.findByChapterIdAndDifficultyOrderByIdAsc(chapter.getId(), question.getDifficulty())
                    .stream().filter(q -> !q.getId().equals(question.getId())).findFirst()
                    .map(q -> new WorkedExample(q.getPrompt(), q.displayAnswer(), q.getExplanation()))
                    .orElseGet(() -> chapter.getExamples().isEmpty() ? null : new WorkedExample(
                            chapter.getExamples().get(0).get("title"), null, chapter.getExamples().get(0).get("content")));
        }
        int attempted = progress.getQuestionsAttempted();
        boolean breakSuggested = profile.breakEvery() > 0 && attempted > 0 && attempted % profile.breakEvery() == 0
                && !trace.resumed();

        TutorContext ctx = context(student, chapter, profile, progress, question, 0);
        return new ActivityResponse(action, tutor.introduceActivity(ctx, action), question.getDifficulty(),
                new QuestionView(question.getId(), question.getDifficulty(), question.getPrompt(), question.getOptions()),
                reviewPoints, worked, profile.maxAttempts(), breakSuggested, trace, toProgress(progress));
    }

    /**
     * Picks a question at the target difficulty: prefer ones not yet solved, never the one just answered.
     * Falls back to the nearest difficulty that has content.
     */
    private Question pickQuestion(Long studentId, Long chapterId, Difficulty target, Set<Long> deprioritised) {
        List<AnswerLog> history = answerLogs.findByStudentIdAndChapterId(studentId, chapterId);
        Set<Long> solved = history.stream().filter(AnswerLog::isCorrect).map(AnswerLog::getQuestionId)
                .collect(Collectors.toCollection(HashSet::new));
        solved.addAll(deprioritised);
        Map<Long, java.time.LocalDateTime> lastSeen = history.stream().collect(Collectors.toMap(
                AnswerLog::getQuestionId, AnswerLog::getCreatedAt, (a, b) -> a.isAfter(b) ? a : b));
        Long lastAnswered = history.stream().max(Comparator.comparing(AnswerLog::getCreatedAt))
                .map(AnswerLog::getQuestionId).orElse(null);

        for (Difficulty d : Stream.of(target, target.easier(), target.harder(), Difficulty.EASY).distinct().toList()) {
            List<Question> pool = questions.findByChapterIdAndDifficultyOrderByIdAsc(chapterId, d);
            if (pool.isEmpty()) continue;
            List<Question> candidates = pool.size() > 1
                    ? pool.stream().filter(q -> !q.getId().equals(lastAnswered)).toList() : pool;
            List<Question> unsolved = candidates.stream().filter(q -> !solved.contains(q.getId())).toList();
            if (!unsolved.isEmpty()) {
                return unsolved.get(new Random().nextInt(unsolved.size()));
            }
            // Everything solved: repeat the one seen longest ago (spaced repetition, very lightly).
            return candidates.stream().min(Comparator.comparing(q -> lastSeen.getOrDefault(q.getId(),
                    java.time.LocalDateTime.MIN))).orElseThrow();
        }
        throw ApiException.notFound("Questions for this chapter");
    }

    // ---------------------------------------------------------------- answer + RL update

    @Transactional
    public AnswerResponse submitAnswer(Long studentId, Long chapterId, AnswerRequest req) {
        Student student = students.require(studentId);
        Chapter chapter = curriculum.requireChapterFor(student, chapterId);
        AccommodationProfile profile = accommodations.profileFor(student);
        LearningProgress progress = progressFor(student, chapter, profile);

        if (!req.questionId().equals(progress.getPendingQuestionId())) {
            throw ApiException.badRequest("This question is not the current activity. Please load the next activity.");
        }
        Question question = questions.findById(req.questionId()).orElseThrow(() -> ApiException.notFound("Question"));

        boolean correct = question.isCorrect(req.answer());
        int attempt = Math.min(req.attemptNumber(), profile.maxAttempts());
        boolean finished = correct || attempt >= profile.maxAttempts();
        TutorContext ctx = context(student, chapter, profile, progress, question, attempt);

        if (!finished) {
            int left = profile.maxAttempts() - attempt;
            return new AnswerResponse(false, false, left, question.getHint(), null, null,
                    tutor.feedback(ctx, question, false, false, left), null, toProgress(progress),
                    CompletionView.of(completion.forChapter(studentId, chapterId)), false);
        }

        // 1. Observe the outcome of the activity the policy chose.
        Outcome outcome = new Outcome(question.getDifficulty(), correct, attempt, req.timeTakenSeconds());
        progress.recordQuestion(correct, attempt, req.timeTakenSeconds(), outcome.firstTry());

        // 2. Encode the new state (this outcome + recent history).
        List<Outcome> recent = new ArrayList<>();
        recent.add(outcome);
        recent.addAll(recentOutcomes(studentId, chapterId));
        LearnerState state = LearnerState.fromKey(progress.getPendingState());
        TutorAction action = TutorAction.valueOf(progress.getPendingAction());
        LearnerState next = engine.observe(progress.getCurrentDifficulty(), recent, progress.getCorrectStreak(), profile);

        // 3. Reward + Q-learning update.
        Learning learning = engine.learn(studentId, state, action, outcome, next, profile);

        answerLogs.save(new AnswerLog(studentId, chapterId, question.getId(), question.getDifficulty(), correct,
                attempt, req.timeTakenSeconds(), state.key(), action.name(), learning.reward()));
        progress.setLearningState(next.key());
        progress.clearPending();

        // 4. Chapter mastery.
        ChapterCompletion chapterCompletion = completion.forChapter(studentId, chapterId);
        boolean justCompleted = chapterCompletion.status() == CompletionService.Status.COMPLETED && progress.markCompleted();
        progressRepo.save(progress);

        String message = tutor.feedback(ctx, question, correct, true, 0);
        if (justCompleted) {
            message += " 🏆 You've completed this chapter! You can keep practising or move on to the next one.";
        }
        return new AnswerResponse(correct, true, 0, null, question.displayAnswer(), question.getExplanation(),
                message,
                new LearningTrace(state.key(), action, learning.reward(), next.key(), learning.oldQ(), learning.newQ()),
                toProgress(progress), CompletionView.of(chapterCompletion), justCompleted);
    }

    // ---------------------------------------------------------------- tutor chat

    @Transactional
    public TutorReply chat(Long studentId, ChatRequest req) {
        Student student = students.require(studentId);
        Chapter chapter = curriculum.requireChapterFor(student, req.chapterId());
        AccommodationProfile profile = accommodations.profileFor(student);
        LearningProgress progress = progressFor(student, chapter, profile);
        Question current = req.questionId() == null ? null : questions.findById(req.questionId())
                .filter(q -> q.getChapter().getId().equals(chapter.getId())).orElse(null);
        return tutor.reply(context(student, chapter, profile, progress, current, req.turn()), req.message());
    }

    // ---------------------------------------------------------------- helpers

    private LearningProgress progressFor(Student student, Chapter chapter, AccommodationProfile profile) {
        return progressRepo.findByStudentIdAndChapterId(student.getId(), chapter.getId())
                .orElseGet(() -> progressRepo.save(new LearningProgress(student.getId(), chapter, profile.startDifficulty())));
    }

    private List<Outcome> recentOutcomes(Long studentId, Long chapterId) {
        return answerLogs.findTop5ByStudentIdAndChapterIdOrderByCreatedAtDesc(studentId, chapterId).stream()
                .limit(StateEncoder.WINDOW)
                .map(l -> new Outcome(l.getDifficulty(), l.isCorrect(), l.getAttempts(), l.getTimeTakenSeconds()))
                .toList();
    }

    private TutorContext context(Student s, Chapter c, AccommodationProfile p, LearningProgress progress,
                                 Question q, int turn) {
        return new TutorContext(s.getName().split(" ")[0], c, p, progress.getCurrentDifficulty(), q, turn);
    }

    static ProgressResponse toProgress(LearningProgress p) {
        Chapter c = p.getChapter();
        int n = p.getQuestionsAttempted();
        return new ProgressResponse(c.getId(), c.getChapterName(), c.getSubject().getName(), n,
                p.getCorrectAnswers(), p.getIncorrectAnswers(), p.getTotalAttempts(), p.getTotalTimeSeconds(),
                n == 0 ? 0 : Math.round(10.0 * p.getTotalTimeSeconds() / n) / 10.0,
                Math.round(p.accuracy() * 100.0) / 100.0, p.getCurrentDifficulty(), p.getLearningState(),
                p.getCorrectStreak());
    }
}
