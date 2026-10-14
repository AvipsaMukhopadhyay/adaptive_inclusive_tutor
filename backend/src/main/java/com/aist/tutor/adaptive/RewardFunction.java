package com.aist.tutor.adaptive;

import com.aist.tutor.personalization.AccommodationProfile;
import org.springframework.stereotype.Component;

/**
 * Reward for the activity the engine chose, based on how the student did on it.
 * <ul>
 *   <li>Correct first time earns more at higher difficulty -> rewards appropriate challenge.</li>
 *   <li>Failing a question is penalised -> discourages pushing too hard.</li>
 *   <li>Very slow answers get a small penalty -> the level may be too demanding.</li>
 *   <li>Staying at the same level although the student was already strong earns less
 *       (under-challenge) -> encourages progression instead of endless easy practice.</li>
 * </ul>
 */
@Component
public class RewardFunction {

    static final double UNDER_CHALLENGE_PENALTY = 0.4;

    public double reward(LearnerState state, TutorAction action, Outcome outcome, AccommodationProfile profile) {
        double reward;
        if (outcome.firstTry()) {
            reward = switch (outcome.difficulty()) {
                case EASY -> 0.6;
                case MEDIUM -> 1.0;
                case HARD -> 1.4;
            };
        } else if (outcome.correct()) {
            reward = 0.3;
        } else {
            reward = -1.0;
        }

        boolean underChallenged = state.performance() == LearnerState.Performance.STRONG
                && action != TutorAction.LEVEL_UP && outcome.firstTry()
                && outcome.difficulty() != com.aist.tutor.domain.Difficulty.HARD;
        if (underChallenged) {
            reward -= UNDER_CHALLENGE_PENALTY;
        }

        double expected = outcome.difficulty().expectedSeconds() * profile.timeMultiplier();
        if (outcome.timeSeconds() > expected * 2) {
            reward -= 0.2;
        } else if (outcome.firstTry() && outcome.timeSeconds() < expected * 0.5) {
            reward += 0.1;
        }
        return Math.round(reward * 100.0) / 100.0;
    }
}
