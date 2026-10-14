package com.aist.tutor.adaptive;

import com.aist.tutor.domain.Difficulty;

/**
 * Discrete RL state: difficulty x recent performance x pace x readiness (3 x 3 x 3 x 2 = 54 states).
 * <p>
 * {@code ready} means the student has answered enough questions right in a row (per their
 * accommodation profile) to be allowed to level up. Keeping it in the state means experience gathered
 * while levelling up is locked does not distort the values of states where it is allowed.
 */
public record LearnerState(Difficulty difficulty, Performance performance, Pace pace, boolean ready) {

    public enum Performance { STRUGGLING, STEADY, STRONG }

    public enum Pace { FAST, ON_TRACK, SLOW }

    public String key() {
        return difficulty + "|" + performance + "|" + pace + "|" + (ready ? "READY" : "BUILDING");
    }

    public static LearnerState fromKey(String key) {
        String[] p = key.split("\\|");
        return new LearnerState(Difficulty.valueOf(p[0]), Performance.valueOf(p[1]), Pace.valueOf(p[2]),
                p.length > 3 && p[3].equals("READY"));
    }
}
