package com.aist.tutor.tutor;

import java.util.List;

/**
 * @param suggestions     quick-reply chips the student can tap
 * @param suggestedAction optional UI action, e.g. {@code NEXT_ACTIVITY}
 * @param step            the idea the conversation is now on, sent back with the next message (null = unchanged)
 * @param checkQuestionId set when the tutor asked a quick check in the chat; the suggestions are its answer options
 * @param checkAttempt    which try at that check the student is on, sent back with the answer
 */
public record TutorReply(String text, List<String> suggestions, String suggestedAction, Integer step,
                         Long checkQuestionId, Integer checkAttempt) {

    public TutorReply(String text, List<String> suggestions, String suggestedAction) {
        this(text, suggestions, suggestedAction, null, null, null);
    }

    public static TutorReply of(String text, List<String> suggestions) {
        return new TutorReply(text, suggestions, null);
    }

    public static TutorReply atStep(String text, List<String> suggestions, int step) {
        return new TutorReply(text, suggestions, null, step, null, null);
    }

    public static TutorReply check(String text, List<String> answerChips, Long questionId, int attempt) {
        return new TutorReply(text, answerChips, null, null, questionId, attempt);
    }
}
