package com.aist.tutor.tutor;

import com.aist.tutor.adaptive.TutorAction;
import com.aist.tutor.domain.Question;
import com.aist.tutor.personalization.AccommodationProfile;

import java.util.List;

/**
 * The conversational tutor. The first implementation is rule-based; an LLM or RAG-backed
 * implementation can be dropped in later by providing another bean of this type.
 */
public interface TutorEngine {

    TutorReply reply(TutorContext context, String studentMessage);

    /** Message shown after the student submits an answer. */
    String feedback(TutorContext context, Question question, boolean correct, boolean finished, int attemptsLeft);

    /** Message introducing the next activity chosen by the adaptive engine. */
    String introduceActivity(TutorContext context, TutorAction action);

    /** How the tutor speaks to this learner (e.g. "standard", "gentle"); the chat UI styles itself to match. */
    String voice(AccommodationProfile profile);

    /** Quick-reply chips shown before the student has said anything. */
    List<String> starterChips(AccommodationProfile profile);
}
