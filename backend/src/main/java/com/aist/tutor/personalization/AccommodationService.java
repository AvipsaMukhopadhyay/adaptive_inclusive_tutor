package com.aist.tutor.personalization;

import com.aist.tutor.domain.Difficulty;
import com.aist.tutor.domain.LearningNeed;
import com.aist.tutor.domain.Student;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * Turns the student's self-reported learning needs into teaching accommodations.
 * When several needs are selected, the most supportive setting for each dimension wins.
 */
@Service
public class AccommodationService {

    public AccommodationProfile profileFor(Student student) {
        List<LearningNeed> needs = new ArrayList<>(student.getNeeds());
        if (needs.isEmpty() && student.getOtherNeeds() != null && !student.getOtherNeeds().isBlank()) {
            needs.add(LearningNeed.OTHER);
        }

        boolean simpleLanguage = false, readAloud = false, readableFont = false, structuredFlow = false,
                visualExamples = false, calmMode = false;
        boolean stepByStep = false, guidedExamples = false, animatedVisuals = false, celebrations = false,
                focusMode = false;
        int chunkSize = 0, maxAttempts = 2, stepUpStreak = 2, breakEvery = 0;
        double timeMultiplier = 1.0, exploration = 0.10;
        Set<String> summary = new LinkedHashSet<>();

        for (LearningNeed need : needs) {
            switch (need) {
                case DYSLEXIA -> {
                    simpleLanguage = true;
                    readAloud = true;
                    readableFont = true;
                    chunkSize = minPositive(chunkSize, 2);
                    maxAttempts = Math.max(maxAttempts, 3);
                    stepUpStreak = Math.max(stepUpStreak, 3);
                    timeMultiplier = Math.max(timeMultiplier, 1.5);
                    summary.add("Clear, easy-to-read text with extra spacing");
                    summary.add("Short explanations you can listen to (read aloud)");
                    summary.add("Extra time and more repetition");
                    stepByStep = guidedExamples = animatedVisuals = celebrations = true;
                    summary.add("One idea at a time, each with extra explanation and an example");
                }
                case ADHD -> {
                    chunkSize = minPositive(chunkSize, 2);
                    breakEvery = minPositive(breakEvery, 4);
                    summary.add("Small chunks of content, one step at a time");
                    summary.add("Frequent quick questions to keep things active");
                    summary.add("Short break reminders");
                    stepByStep = animatedVisuals = celebrations = focusMode = true;
                    summary.add("Focus mode: only one part of the lesson on screen at a time");
                    summary.add("Animated pictures and celebrations to keep things lively");
                }
                case AUTISM -> {
                    structuredFlow = true;
                    calmMode = true;
                    exploration = Math.min(exploration, 0.03);
                    stepUpStreak = Math.max(stepUpStreak, 3);
                    summary.add("The same lesson structure every time: Learn → Examples → Practice");
                    summary.add("Clear instructions telling you what comes next");
                    summary.add("Calm screen with no surprise animations");
                    stepByStep = guidedExamples = celebrations = focusMode = true;
                    summary.add("Guided examples showing exactly how each question is solved");
                }
                case DOWN_SYNDROME -> {
                    simpleLanguage = true;
                    readAloud = true;
                    visualExamples = true;
                    structuredFlow = true;
                    chunkSize = minPositive(chunkSize, 1);
                    maxAttempts = Math.max(maxAttempts, 3);
                    stepUpStreak = Math.max(stepUpStreak, 4);
                    timeMultiplier = Math.max(timeMultiplier, 2.0);
                    exploration = Math.min(exploration, 0.03);
                    summary.add("Simple words and small learning steps");
                    summary.add("Picture examples and lots of practice");
                    summary.add("Slower pace - move up only when you feel confident");
                    stepByStep = guidedExamples = animatedVisuals = celebrations = true;
                    summary.add("Animated pictures, guided examples and celebrations when you get it right");
                }
                case OTHER -> {
                    maxAttempts = Math.max(maxAttempts, 3);
                    timeMultiplier = Math.max(timeMultiplier, 1.3);
                    stepUpStreak = Math.max(stepUpStreak, 3);
                    summary.add("Extra tries and extra time on every question");
                    stepByStep = guidedExamples = celebrations = true;
                    summary.add("Step-by-step explanations and guided examples");
                }
            }
        }
        if (summary.isEmpty()) {
            summary.add("Standard pace - the tutor adapts to how you perform");
        }

        return new AccommodationProfile(simpleLanguage, chunkSize, readAloud, readableFont, structuredFlow,
                visualExamples, calmMode, maxAttempts, stepUpStreak, timeMultiplier, breakEvery,
                Difficulty.EASY, exploration, List.copyOf(summary),
                stepByStep, guidedExamples, animatedVisuals, celebrations, focusMode);
    }

    private static int minPositive(int current, int candidate) {
        return current == 0 ? candidate : Math.min(current, candidate);
    }
}
