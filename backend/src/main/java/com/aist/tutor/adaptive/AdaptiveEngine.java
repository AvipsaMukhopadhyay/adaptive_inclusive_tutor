package com.aist.tutor.adaptive;

import com.aist.tutor.adaptive.LearnerState.Performance;
import com.aist.tutor.domain.Difficulty;
import com.aist.tutor.personalization.AccommodationProfile;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Orchestrates the adaptive loop:
 * performance -> state -> (guarded) action -> reward -> policy update.
 */
@Service
public class AdaptiveEngine {

    private final AdaptivePolicy policy;
    private final StateEncoder encoder;
    private final RewardFunction rewardFunction;

    public AdaptiveEngine(AdaptivePolicy policy, StateEncoder encoder, RewardFunction rewardFunction) {
        this.policy = policy;
        this.encoder = encoder;
        this.rewardFunction = rewardFunction;
    }

    public record Decision(LearnerState state, TutorAction action, Difficulty nextDifficulty,
                           List<TutorAction> allowed, Map<TutorAction, Double> qValues) {}

    public record Learning(LearnerState state, TutorAction action, double reward, LearnerState nextState,
                           double oldQ, double newQ) {}

    public LearnerState observe(Difficulty current, List<Outcome> recentNewestFirst, int correctStreak,
                                AccommodationProfile profile) {
        return encoder.encode(current, recentNewestFirst, correctStreak, profile);
    }

    public Decision decide(Long studentId, LearnerState state, AccommodationProfile profile) {
        List<TutorAction> allowed = allowedActions(state);
        TutorAction action = policy.choose(studentId, state, allowed, profile.explorationRate());
        return new Decision(state, action, action.apply(state.difficulty()), allowed, policy.values(studentId, state));
    }

    public Learning learn(Long studentId, LearnerState state, TutorAction action, Outcome outcome,
                          LearnerState nextState, AccommodationProfile profile) {
        double reward = rewardFunction.reward(state, action, outcome, profile);
        double oldQ = policy.values(studentId, state).get(action);
        double newQ = policy.learn(studentId, state, action, reward, nextState);
        return new Learning(state, action, reward, nextState, oldQ, newQ);
    }

    public Map<TutorAction, Double> values(Long studentId, LearnerState state) {
        return policy.values(studentId, state);
    }

    /**
     * Safety guard-rails that sit outside the learned policy: the student's accommodation
     * decides how many correct answers in a row are needed (state.ready) before difficulty may increase.
     */
    List<TutorAction> allowedActions(LearnerState state) {
        List<TutorAction> allowed = new ArrayList<>(List.of(TutorAction.values()));
        boolean canLevelUp = state.difficulty() != Difficulty.HARD
                && state.performance() != Performance.STRUGGLING
                && state.ready();
        if (!canLevelUp) allowed.remove(TutorAction.LEVEL_UP);
        return allowed;
    }
}
