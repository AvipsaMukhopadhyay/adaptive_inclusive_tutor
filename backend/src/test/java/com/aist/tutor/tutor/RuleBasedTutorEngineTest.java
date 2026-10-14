package com.aist.tutor.tutor;

import com.aist.tutor.domain.Chapter;
import com.aist.tutor.domain.Difficulty;
import com.aist.tutor.domain.LearnerType;
import com.aist.tutor.domain.LearningNeed;
import com.aist.tutor.domain.Question;
import com.aist.tutor.domain.Student;
import com.aist.tutor.personalization.AccommodationProfile;
import com.aist.tutor.personalization.AccommodationService;
import com.aist.tutor.personalization.Imagery;
import com.aist.tutor.personalization.LessonComposer;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class RuleBasedTutorEngineTest {

    private final RuleBasedTutorEngine engine = new RuleBasedTutorEngine();

    private final Chapter chapter = new Chapter(null, "Fractions", 1,
            "A fraction is a part of a whole. The bottom number is the denominator and the top number is the numerator.",
            List.of("A fraction is a part of a whole.", "The denominator tells how many equal parts there are."),
            List.of(Map.of("title", "Half", "content", "1/2 of a cake is one of two equal pieces.", "visual", "🍰 | 🍰")),
            "Fold paper into equal parts.");

    private final Question check = question();

    private static Question question() {
        Question q = new Question(null, Difficulty.EASY, "What is 1/2 of 10?", List.of("2", "5", "10"), "5",
                "Split 10 into 2 equal groups.", "10 ÷ 2 = 5.");
        ReflectionTestUtils.setField(q, "id", 7L);
        return q;
    }

    private AccommodationProfile profile(LearningNeed... needs) {
        Student s = new Student();
        s.setLearnerType(needs.length == 0 ? LearnerType.NORMAL : LearnerType.SPECIAL_NEEDS);
        s.setNeeds(List.of(needs));
        return new AccommodationService().profileFor(s);
    }

    private TutorContext ctx(AccommodationProfile p, int step, Question pending, int attempt) {
        return new TutorContext("Asha", chapter, p, Difficulty.EASY, null, 0,
                new LessonComposer().steps(chapter), step, pending, attempt, check);
    }

    @Test
    void voiceFollowsTheProfile() {
        assertThat(RuleBasedTutorEngine.voiceOf(profile())).isEqualTo(RuleBasedTutorEngine.Voice.STANDARD);
        assertThat(RuleBasedTutorEngine.voiceOf(profile(LearningNeed.DYSLEXIA))).isEqualTo(RuleBasedTutorEngine.Voice.GENTLE);
        assertThat(RuleBasedTutorEngine.voiceOf(profile(LearningNeed.DOWN_SYNDROME))).isEqualTo(RuleBasedTutorEngine.Voice.GENTLE);
        assertThat(RuleBasedTutorEngine.voiceOf(profile(LearningNeed.AUTISM))).isEqualTo(RuleBasedTutorEngine.Voice.CALM);
        assertThat(RuleBasedTutorEngine.voiceOf(profile(LearningNeed.ADHD))).isEqualTo(RuleBasedTutorEngine.Voice.LIVELY);
    }

    @Test
    void standardLearnersGetTheWholeChapterWithAnAnalogy() {
        TutorReply r = engine.reply(ctx(profile(), -1, null, 1), "Explain this chapter");
        assertThat(r.text()).contains("The big picture", "Key ideas", "pizza");
        assertThat(r.step()).isNull();
    }

    @Test
    void supportiveLearnersAreTaughtOneIdeaAtATimeWithAPicture() {
        TutorReply first = engine.reply(ctx(profile(LearningNeed.DYSLEXIA), -1, null, 1), "Teach me step by step");
        assertThat(first.text()).contains("Idea 1 of 2", "Picture it", "pizza", "Asha");
        assertThat(first.step()).isZero();
        assertThat(first.suggestions()).contains(RuleBasedTutorEngine.NEXT);

        TutorReply next = engine.reply(ctx(profile(LearningNeed.DYSLEXIA), 0, null, 1), RuleBasedTutorEngine.NEXT);
        assertThat(next.text()).contains("Idea 2 of 2");
        assertThat(next.step()).isEqualTo(1);

        TutorReply done = engine.reply(ctx(profile(LearningNeed.DYSLEXIA), 1, null, 1), RuleBasedTutorEngine.NEXT);
        assertThat(done.text()).contains("last idea");
    }

    @Test
    void autisticLearnersGetLiteralNumberedInstructions() {
        TutorReply r = engine.reply(ctx(profile(LearningNeed.AUTISM), -1, null, 1), "Explain this chapter");
        assertThat(r.text()).contains("There are 2 ideas", "What to do next");
        assertThat(r.text()).doesNotContain("🌱", "⚡");
    }

    @Test
    void quickCheckOffersTheOptionsAndGradesTheAnswer() {
        TutorReply asked = engine.reply(ctx(profile(), -1, null, 1), RuleBasedTutorEngine.CHECK);
        assertThat(asked.checkQuestionId()).isEqualTo(7L);
        assertThat(asked.suggestions()).containsExactly("2", "5", "10");

        TutorReply right = engine.reply(ctx(profile(), -1, check, 1), "5");
        assertThat(right.text()).startsWith("Correct");
        assertThat(right.checkQuestionId()).isNull();
    }

    @Test
    void supportiveLearnersGetASecondChanceBeforeTheAnswerIsShown() {
        AccommodationProfile ds = profile(LearningNeed.DOWN_SYNDROME);
        TutorReply retry = engine.reply(ctx(ds, -1, check, 1), "2");
        assertThat(retry.text()).contains("good try", "Split 10").doesNotContain("answer is");
        assertThat(retry.checkAttempt()).isEqualTo(2);
        assertThat(retry.suggestions()).doesNotContain("2").contains("5", RuleBasedTutorEngine.REVEAL);

        TutorReply reveal = engine.reply(ctx(ds, -1, check, 2), "10");
        assertThat(reveal.text()).contains("The answer is **5**");

        TutorReply standard = engine.reply(ctx(profile(), -1, check, 1), "2");
        assertThat(standard.text()).contains("The answer is **5**");
    }

    @Test
    void onlySpecialNeedsLearnersGetAnimations() {
        TutorReply animated = engine.reply(ctx(profile(LearningNeed.DOWN_SYNDROME), 1, null, 1), "Animate it 🎬");
        assertThat(animated.suggestedAction()).isEqualTo("ANIMATE");
        assertThat(animated.step()).isEqualTo(1);

        TutorReply standard = engine.reply(ctx(profile(), -1, null, 1), "can you animate it");
        assertThat(standard.suggestedAction()).isNull();
        assertThat(standard.text()).contains("analogy");
    }

    @Test
    void stepsCarryTheirPictureAndScene() {
        List<LessonComposer.Step> steps = new LessonComposer().steps(chapter);
        assertThat(steps.get(0).scene()).isEqualTo("fraction");
        assertThat(steps.get(0).picture()).contains("pizza");
    }

    @Test
    void feelingsGetAKindReply() {
        TutorReply gentle = engine.reply(ctx(profile(LearningNeed.DYSLEXIA), -1, null, 1), "I feel stupid, this is hard");
        assertThat(gentle.text()).contains("You are not stupid");
        TutorReply standard = engine.reply(ctx(profile(), -1, null, 1), "this is hard");
        assertThat(standard.text()).startsWith("No problem");
    }

    @Test
    void thePictureMatchesWhatTheTextIsMainlyAbout() {
        Chapter numbers = new Chapter(null, "Playing With Numbers", 1, "A factor divides a number.", List.of(), List.of(), "");
        assertThat(Imagery.picture(numbers, "A factor divides a number. Add the digits to test for 3."))
                .contains("chairs").doesNotContain("houses");
    }
}
