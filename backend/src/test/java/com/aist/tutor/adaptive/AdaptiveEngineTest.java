package com.aist.tutor.adaptive;

import com.aist.tutor.adaptive.LearnerState.Pace;
import com.aist.tutor.adaptive.LearnerState.Performance;
import com.aist.tutor.domain.Difficulty;
import com.aist.tutor.domain.LearnerType;
import com.aist.tutor.domain.LearningNeed;
import com.aist.tutor.domain.Student;
import com.aist.tutor.personalization.AccommodationProfile;
import com.aist.tutor.personalization.AccommodationService;
import org.junit.jupiter.api.Test;

import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;

class AdaptiveEngineTest {

    static class InMemoryStore implements QTableStore {
        final Map<String, Map<TutorAction, Double>> table = new HashMap<>();

        public Map<TutorAction, Double> load(Long studentId, String stateKey) {
            return table.getOrDefault(studentId + "/" + stateKey, Map.of());
        }

        public void save(Long studentId, String stateKey, TutorAction action, double value) {
            table.computeIfAbsent(studentId + "/" + stateKey, k -> new EnumMap<>(TutorAction.class)).put(action, value);
        }
    }

    private final AccommodationService accommodations = new AccommodationService();
    private final StateEncoder encoder = new StateEncoder();
    private final RewardFunction rewards = new RewardFunction();

    private static Student student(LearningNeed... needs) {
        Student s = new Student();
        s.setLearnerType(needs.length == 0 ? LearnerType.NORMAL : LearnerType.SPECIAL_NEEDS);
        s.setNeeds(List.of(needs));
        return s;
    }

    private AdaptiveEngine engine(InMemoryStore store) {
        return new AdaptiveEngine(new QLearningPolicy(store, new Random(42)), encoder, rewards);
    }

    @Test
    void encodesPerformanceAndPace() {
        AccommodationProfile normal = accommodations.profileFor(student());
        assertThat(encoder.encode(Difficulty.EASY, List.of(), 0, normal).performance()).isEqualTo(Performance.STEADY);

        List<Outcome> strong = Collections.nCopies(4, new Outcome(Difficulty.EASY, true, 1, 10));
        LearnerState s = encoder.encode(Difficulty.EASY, strong, 0, normal);
        assertThat(s.performance()).isEqualTo(Performance.STRONG);
        assertThat(s.pace()).isEqualTo(Pace.FAST);

        List<Outcome> weak = Collections.nCopies(4, new Outcome(Difficulty.MEDIUM, false, 2, 100));
        LearnerState w = encoder.encode(Difficulty.MEDIUM, weak, 0, normal);
        assertThat(w.performance()).isEqualTo(Performance.STRUGGLING);
        assertThat(w.pace()).isEqualTo(Pace.SLOW);
    }

    @Test
    void accommodationGivesExtraTimeBeforeCountingAsSlow() {
        List<Outcome> careful = Collections.nCopies(4, new Outcome(Difficulty.EASY, true, 1, 60));
        assertThat(encoder.encode(Difficulty.EASY, careful, 0, accommodations.profileFor(student())).pace())
                .isEqualTo(Pace.SLOW);
        assertThat(encoder.encode(Difficulty.EASY, careful, 0, accommodations.profileFor(student(LearningNeed.DOWN_SYNDROME))).pace())
                .isEqualTo(Pace.ON_TRACK);
    }

    @Test
    void rewardFavoursChallengeAndPenalisesFailure() {
        AccommodationProfile p = accommodations.profileFor(student());
        LearnerState steady = new LearnerState(Difficulty.EASY, Performance.STEADY, Pace.ON_TRACK, false);
        LearnerState strong = new LearnerState(Difficulty.EASY, Performance.STRONG, Pace.ON_TRACK, false);
        double easy = rewards.reward(steady, TutorAction.PRACTICE, new Outcome(Difficulty.EASY, true, 1, 30), p);
        double hard = rewards.reward(steady, TutorAction.PRACTICE, new Outcome(Difficulty.HARD, true, 1, 60), p);
        double fail = rewards.reward(steady, TutorAction.PRACTICE, new Outcome(Difficulty.HARD, false, 2, 60), p);
        double underChallenged = rewards.reward(strong, TutorAction.PRACTICE, new Outcome(Difficulty.EASY, true, 1, 30), p);
        assertThat(hard).isGreaterThan(easy);
        assertThat(fail).isNegative();
        assertThat(underChallenged).isLessThan(easy);
    }

    @Test
    void qUpdateFollowsBellmanEquation() {
        InMemoryStore store = new InMemoryStore();
        QLearningPolicy policy = new QLearningPolicy(store, new Random(1));
        LearnerState s = new LearnerState(Difficulty.EASY, Performance.STEADY, Pace.ON_TRACK, false);
        LearnerState next = new LearnerState(Difficulty.EASY, Performance.STRONG, Pace.ON_TRACK, false);

        double before = policy.values(1L, s).get(TutorAction.PRACTICE);          // prior 0.4
        double maxNext = Collections.max(policy.values(1L, next).values());      // prior 0.6
        double updated = policy.learn(1L, s, TutorAction.PRACTICE, 1.0, next);

        double expected = before + QLearningPolicy.ALPHA * (1.0 + QLearningPolicy.GAMMA * maxNext - before);
        assertThat(updated).isCloseTo(expected, org.assertj.core.data.Offset.offset(0.001));
        assertThat(policy.values(1L, s).get(TutorAction.PRACTICE)).isEqualTo(updated);
    }

    @Test
    void levelUpIsBlockedUntilTheProfileStreakIsReached() {
        AdaptiveEngine engine = engine(new InMemoryStore());
        List<Outcome> good = Collections.nCopies(3, new Outcome(Difficulty.EASY, true, 1, 30));
        AccommodationProfile normal = accommodations.profileFor(student());
        AccommodationProfile ds = accommodations.profileFor(student(LearningNeed.DOWN_SYNDROME));

        assertThat(engine.allowedActions(encoder.encode(Difficulty.EASY, good, 1, normal))).doesNotContain(TutorAction.LEVEL_UP);
        assertThat(engine.allowedActions(encoder.encode(Difficulty.EASY, good, 2, normal))).contains(TutorAction.LEVEL_UP);
        // Down syndrome accommodation: slower progression, needs 4 in a row.
        assertThat(engine.allowedActions(encoder.encode(Difficulty.EASY, good, 3, ds))).doesNotContain(TutorAction.LEVEL_UP);
        assertThat(engine.allowedActions(encoder.encode(Difficulty.EASY, good, 4, ds))).contains(TutorAction.LEVEL_UP);
    }

    /** Simulated students: the full loop state -> action -> outcome -> reward -> update. */
    @Test
    void strongStudentClimbsToHardAndStrugglingStudentStaysEasy() {
        assertThat(simulate(d -> true, 12)).isEqualTo(Difficulty.HARD);
        assertThat(simulate(d -> false, 12)).isEqualTo(Difficulty.EASY);
    }

    @Test
    void studentWhoCanOnlyHandleMediumSettlesAtMedium() {
        List<Difficulty> path = new ArrayList<>();
        simulate(d -> d != Difficulty.HARD, 30, path);
        // Tries HARD at some point, fails, and the engine brings them back down.
        assertThat(path).contains(Difficulty.HARD);
        assertThat(path.get(path.size() - 1)).isNotEqualTo(Difficulty.HARD);
    }

    @Test
    void accommodatedStrongStudentStillReachesHardJustMoreSlowly() {
        List<Difficulty> normalPath = new ArrayList<>();
        List<Difficulty> dsPath = new ArrayList<>();
        simulate(d -> true, 16, normalPath);
        simulate(d -> true, 16, dsPath, accommodations.profileFor(student(LearningNeed.DOWN_SYNDROME)));
        assertThat(dsPath.get(dsPath.size() - 1)).isEqualTo(Difficulty.HARD);
        assertThat(dsPath.indexOf(Difficulty.HARD)).isGreaterThan(normalPath.indexOf(Difficulty.HARD));
    }

    interface Learner { boolean answersCorrectly(Difficulty d); }

    private Difficulty simulate(Learner learner, int steps) {
        return simulate(learner, steps, new ArrayList<>());
    }

    private Difficulty simulate(Learner learner, int steps, List<Difficulty> path) {
        return simulate(learner, steps, path, accommodations.profileFor(student()));
    }

    private Difficulty simulate(Learner learner, int steps, List<Difficulty> path, AccommodationProfile profile) {
        AdaptiveEngine engine = engine(new InMemoryStore());
        Deque<Outcome> history = new ArrayDeque<>();
        Difficulty current = Difficulty.EASY;
        int streak = 0;
        for (int i = 0; i < steps; i++) {
            LearnerState state = engine.observe(current, List.copyOf(history), streak, profile);
            AdaptiveEngine.Decision decision = engine.decide(1L, state, profile);
            if (decision.nextDifficulty() != current) streak = 0;
            current = decision.nextDifficulty();
            path.add(current);

            boolean correct = learner.answersCorrectly(current);
            Outcome outcome = new Outcome(current, correct, correct ? 1 : 2, current.expectedSeconds());
            streak = outcome.firstTry() ? streak + 1 : 0;
            history.addFirst(outcome);
            LearnerState next = engine.observe(current, List.copyOf(history), streak, profile);
            engine.learn(1L, state, decision.action(), outcome, next, profile);
        }
        return current;
    }
}
