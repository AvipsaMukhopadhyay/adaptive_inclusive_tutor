package com.aist.tutor.tutor;

import com.aist.tutor.domain.Chapter;
import com.aist.tutor.domain.Difficulty;
import com.aist.tutor.domain.Question;
import com.aist.tutor.personalization.AccommodationProfile;

/**
 * Everything the tutor knows when replying. An LLM-based engine can turn this into a prompt;
 * a RAG engine can use the chapter as the retrieval scope.
 *
 * @param currentQuestion the question on screen (may be null)
 * @param turn            how many messages the student has sent in this chapter (lets the tutor vary replies)
 */
public record TutorContext(String studentName, Chapter chapter, AccommodationProfile profile,
                           Difficulty difficulty, Question currentQuestion, int turn) {
}
