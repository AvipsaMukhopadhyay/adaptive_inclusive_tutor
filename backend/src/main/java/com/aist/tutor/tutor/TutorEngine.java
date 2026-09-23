package com.aist.tutor.tutor;

import com.aist.tutor.adaptive.TutorAction;
import com.aist.tutor.domain.Question;

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
}
