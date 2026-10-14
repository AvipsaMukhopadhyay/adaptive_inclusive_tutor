package com.aist.tutor.domain;

public enum Difficulty {
    EASY(30), MEDIUM(45), HARD(60);

    /** Rough time (seconds) a typical learner needs for one question at this level. */
    private final int expectedSeconds;

    Difficulty(int expectedSeconds) {
        this.expectedSeconds = expectedSeconds;
    }

    public int expectedSeconds() {
        return expectedSeconds;
    }

    public Difficulty harder() {
        return this == HARD ? HARD : values()[ordinal() + 1];
    }

    public Difficulty easier() {
        return this == EASY ? EASY : values()[ordinal() - 1];
    }
}
