package com.aist.tutor.adaptive;

import com.aist.tutor.domain.Difficulty;

/** What happened on one finished question. */
public record Outcome(Difficulty difficulty, boolean correct, int attempts, int timeSeconds) {

    public boolean firstTry() {
        return correct && attempts == 1;
    }

    /** 1.0 = right first time, 0.5 = right after a hint, 0 = not solved. */
    public double score() {
        return firstTry() ? 1.0 : correct ? 0.5 : 0.0;
    }
}
