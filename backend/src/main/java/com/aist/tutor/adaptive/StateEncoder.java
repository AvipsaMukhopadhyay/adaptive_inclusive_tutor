package com.aist.tutor.adaptive;

import com.aist.tutor.adaptive.LearnerState.Pace;
import com.aist.tutor.adaptive.LearnerState.Performance;
import com.aist.tutor.domain.Difficulty;
import com.aist.tutor.personalization.AccommodationProfile;
import org.springframework.stereotype.Component;

import java.util.List;

/** Converts raw recent performance into a discrete {@link LearnerState}. */
@Component
public class StateEncoder {

    /** How many recent questions define "recent performance". */
    public static final int WINDOW = 4;

    public LearnerState encode(Difficulty current, List<Outcome> recent, int correctStreak, AccommodationProfile profile) {
        boolean ready = correctStreak >= profile.stepUpStreak();
        List<Outcome> window = recent.stream().limit(WINDOW).toList();
        if (window.isEmpty()) {
            return new LearnerState(current, Performance.STEADY, Pace.ON_TRACK, ready);
        }

        double avgScore = window.stream().mapToDouble(Outcome::score).average().orElse(0);
        Performance performance = avgScore < 0.45 ? Performance.STRUGGLING
                : avgScore < 0.8 ? Performance.STEADY
                : Performance.STRONG;

        // Time relative to what is expected for that difficulty, scaled by the student's accommodation.
        double timeRatio = window.stream()
                .mapToDouble(o -> o.timeSeconds() / (o.difficulty().expectedSeconds() * profile.timeMultiplier()))
                .average().orElse(1);
        Pace pace = timeRatio < 0.5 ? Pace.FAST : timeRatio > 1.5 ? Pace.SLOW : Pace.ON_TRACK;

        return new LearnerState(current, performance, pace, ready);
    }
}
