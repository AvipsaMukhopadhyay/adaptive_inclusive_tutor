package com.aist.tutor.personalization;

import com.aist.tutor.domain.Difficulty;

import java.util.List;

/**
 * How the tutor should adjust presentation, pacing, repetition and difficulty for one student.
 * These are learning accommodations only - not medical advice or a diagnosis.
 *
 * @param simpleLanguage      show short key points instead of long paragraphs
 * @param chunkSize           sentences per explanation chunk (0 = show everything at once)
 * @param readAloud           offer text-to-speech buttons
 * @param readableFont        use a highly legible font with extra spacing
 * @param structuredFlow      show a fixed, predictable lesson structure with explicit instructions
 * @param visualExamples      prefer examples with pictures/emoji visuals
 * @param calmMode            no animations, muted colours
 * @param maxAttempts         tries allowed per question before the answer is shown
 * @param stepUpStreak        first-try correct answers in a row needed before difficulty can increase
 * @param timeMultiplier      scales the "expected time" so slower, careful work is not treated as struggling
 * @param breakEvery          suggest a short break after this many questions (0 = never)
 * @param startDifficulty     difficulty of the first activity in a new chapter
 * @param explorationRate     RL epsilon: lower = more predictable choices
 * @param summary             human-readable list of what is being adjusted
 * @param stepByStep          teach one idea at a time, each with extra detail and its own example
 * @param guidedExamples      show fully worked "watch me solve it" examples before practice
 * @param animatedVisuals     animate picture examples piece by piece
 * @param celebrations        celebrate correct answers and finished chapters
 * @param focusMode           show only one section of the lesson at a time
 */
public record AccommodationProfile(
        boolean simpleLanguage,
        int chunkSize,
        boolean readAloud,
        boolean readableFont,
        boolean structuredFlow,
        boolean visualExamples,
        boolean calmMode,
        int maxAttempts,
        int stepUpStreak,
        double timeMultiplier,
        int breakEvery,
        Difficulty startDifficulty,
        double explorationRate,
        List<String> summary,
        boolean stepByStep,
        boolean guidedExamples,
        boolean animatedVisuals,
        boolean celebrations,
        boolean focusMode
) {
}
