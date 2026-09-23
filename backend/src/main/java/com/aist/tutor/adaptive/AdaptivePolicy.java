package com.aist.tutor.adaptive;

import java.util.List;
import java.util.Map;

/**
 * Pluggable decision policy. The Q-learning implementation can later be replaced by
 * a contextual bandit, deep RL, or knowledge-tracing based policy without touching callers.
 */
public interface AdaptivePolicy {

    TutorAction choose(Long studentId, LearnerState state, List<TutorAction> allowed, double explorationRate);

    /** Returns the new value for (state, action). */
    double learn(Long studentId, LearnerState state, TutorAction action, double reward, LearnerState next);

    Map<TutorAction, Double> values(Long studentId, LearnerState state);
}
