package com.aist.tutor.adaptive;

import com.aist.tutor.domain.Difficulty;

/** The actions the adaptive engine can take when choosing the student's next activity. */
public enum TutorAction {
    /** Drop one level (or stay at EASY) and re-teach the key points before the next question. */
    REVIEW_EASIER("Let's slow down, review the key ideas and try an easier question."),
    /** Same level, but show a fully worked example first. */
    WORKED_EXAMPLE("Here's a worked example first, then you try one just like it."),
    /** Same level, another practice question. */
    PRACTICE("Let's practise another one at this level."),
    /** Move up one level. */
    LEVEL_UP("You're doing great - let's try something more challenging!");

    private final String studentMessage;

    TutorAction(String studentMessage) {
        this.studentMessage = studentMessage;
    }

    public String studentMessage() {
        return studentMessage;
    }

    public Difficulty apply(Difficulty current) {
        return switch (this) {
            case REVIEW_EASIER -> current.easier();
            case WORKED_EXAMPLE, PRACTICE -> current;
            case LEVEL_UP -> current.harder();
        };
    }
}
