package com.aist.tutor.adaptive;

import com.aist.tutor.adaptive.LearnerState.Pace;
import com.aist.tutor.adaptive.LearnerState.Performance;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

/**
 * Tabular Q-learning with epsilon-greedy exploration and one Q-table per student.
 * <p>
 * Q(s,a) <- Q(s,a) + alpha * (reward + gamma * max_a' Q(s',a') - Q(s,a))
 * <p>
 * Unvisited entries start from a small "teacher intuition" prior so the very first
 * decisions are sensible; real rewards from the student then reshape the table.
 */
@Component
public class QLearningPolicy implements AdaptivePolicy {

    static final double ALPHA = 0.3;
    static final double GAMMA = 0.6;

    private final QTableStore store;
    private final Random random;

    @Autowired
    public QLearningPolicy(QTableStore store) {
        this(store, new Random());
    }

    QLearningPolicy(QTableStore store, Random random) {
        this.store = store;
        this.random = random;
    }

    @Override
    public TutorAction choose(Long studentId, LearnerState state, List<TutorAction> allowed, double explorationRate) {
        if (allowed.size() > 1 && random.nextDouble() < explorationRate) {
            return allowed.get(random.nextInt(allowed.size()));
        }
        Map<TutorAction, Double> q = values(studentId, state);
        return allowed.stream().max(Comparator.comparingDouble(q::get)).orElse(TutorAction.PRACTICE);
    }

    @Override
    public double learn(Long studentId, LearnerState state, TutorAction action, double reward, LearnerState next) {
        double current = values(studentId, state).get(action);
        double bestNext = values(studentId, next).values().stream().mapToDouble(Double::doubleValue).max().orElse(0);
        double updated = current + ALPHA * (reward + GAMMA * bestNext - current);
        updated = Math.round(updated * 1000.0) / 1000.0;
        store.save(studentId, state.key(), action, updated);
        return updated;
    }

    @Override
    public Map<TutorAction, Double> values(Long studentId, LearnerState state) {
        Map<TutorAction, Double> stored = store.load(studentId, state.key());
        Map<TutorAction, Double> result = new EnumMap<>(TutorAction.class);
        for (TutorAction a : TutorAction.values()) {
            result.put(a, stored.getOrDefault(a, prior(state, a)));
        }
        return result;
    }

    static double prior(LearnerState state, TutorAction action) {
        double base = switch (state.performance()) {
            case STRONG -> switch (action) {
                case LEVEL_UP -> 0.6; case PRACTICE -> 0.3; case WORKED_EXAMPLE -> 0.1; case REVIEW_EASIER -> 0.0;
            };
            case STEADY -> switch (action) {
                case PRACTICE -> 0.4; case WORKED_EXAMPLE -> 0.3; case LEVEL_UP -> 0.2; case REVIEW_EASIER -> 0.1;
            };
            case STRUGGLING -> switch (action) {
                case REVIEW_EASIER -> 0.5; case WORKED_EXAMPLE -> 0.4; case PRACTICE -> 0.1; case LEVEL_UP -> -0.2;
            };
        };
        if (state.pace() == Pace.SLOW && action == TutorAction.WORKED_EXAMPLE) base += 0.1;
        if (state.pace() == Pace.FAST && state.performance() != Performance.STRUGGLING
                && action == TutorAction.LEVEL_UP) base += 0.1;
        return base;
    }
}
