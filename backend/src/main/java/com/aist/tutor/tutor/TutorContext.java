package com.aist.tutor.tutor;

import com.aist.tutor.domain.Chapter;
import com.aist.tutor.domain.Difficulty;
import com.aist.tutor.domain.Question;
import com.aist.tutor.personalization.AccommodationProfile;
import com.aist.tutor.personalization.LessonComposer.Step;

import java.util.List;

/**
 * Everything the tutor knows when replying. An LLM-based engine can turn this into a prompt;
 * a RAG engine can use the chapter as the retrieval scope.
 *
 * @param currentQuestion the question on screen (may be null)
 * @param turn            how many messages the student has sent in this chapter (lets the tutor vary replies)
 * @param steps           the chapter's ideas, one at a time (for the "walk me through it" conversation)
 * @param step            index of the idea the conversation is on (-1 = not started)
 * @param pendingCheck    the quick-check question the tutor just asked in the chat (null if none)
 * @param checkAttempt    which try at the pending check this is (1 = first)
 * @param checkCandidate  a question the tutor may ask as a quick check (null if none)
 */
public record TutorContext(String studentName, Chapter chapter, AccommodationProfile profile,
                           Difficulty difficulty, Question currentQuestion, int turn,
                           List<Step> steps, int step, Question pendingCheck, int checkAttempt,
                           Question checkCandidate) {

    public TutorContext(String studentName, Chapter chapter, AccommodationProfile profile,
                        Difficulty difficulty, Question currentQuestion, int turn) {
        this(studentName, chapter, profile, difficulty, currentQuestion, turn, List.of(), -1, null, 1, null);
    }
}
