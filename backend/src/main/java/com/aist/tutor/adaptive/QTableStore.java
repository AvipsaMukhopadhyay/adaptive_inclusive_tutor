package com.aist.tutor.adaptive;

import java.util.Map;

/** Persistence for Q-values, so the policy logic stays storage-agnostic (and easy to unit test). */
public interface QTableStore {

    /** Stored values for a state; actions never updated before are absent. */
    Map<TutorAction, Double> load(Long studentId, String stateKey);

    void save(Long studentId, String stateKey, TutorAction action, double value);
}
