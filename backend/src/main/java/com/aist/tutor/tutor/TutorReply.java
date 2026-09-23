package com.aist.tutor.tutor;

import java.util.List;

/**
 * @param suggestions     quick-reply chips the student can tap
 * @param suggestedAction optional UI action, e.g. {@code NEXT_ACTIVITY}
 */
public record TutorReply(String text, List<String> suggestions, String suggestedAction) {

    public static TutorReply of(String text, List<String> suggestions) {
        return new TutorReply(text, suggestions, null);
    }
}
