package com.aist.tutor.personalization;

import com.aist.tutor.domain.Chapter;
import com.aist.tutor.domain.LearnerType;
import com.aist.tutor.domain.LearningNeed;
import com.aist.tutor.domain.Student;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class LessonComposerTest {

    private final Chapter chapter = new Chapter(null, "Fun with Magnets", 1,
            "A magnet attracts materials like iron, nickel and cobalt. Every magnet has two poles, a north pole and a south pole. "
                    + "Like poles repel each other and unlike poles attract.",
            List.of("Magnets pull iron, nickel and cobalt.", "Every magnet has a north and a south pole.",
                    "Same poles push away. Opposite poles pull together."),
            List.of(Map.of("title", "Attract or repel", "content", "N facing S stick together. N facing N push apart.", "visual", ""),
                    Map.of("title", "Magnetic or not", "content", "A steel pin sticks to a magnet made of iron.", "visual", "")),
            "Test magnets at home.");

    @Test
    void everyKeyIdeaGetsExtraDetailAndAnExample() {
        List<LessonComposer.Step> steps = new LessonComposer().steps(chapter);
        assertThat(steps).hasSize(3);
        assertThat(steps).allSatisfy(s -> assertThat(s.example()).isNotNull());
        assertThat(steps.get(0).detail()).contains("iron, nickel and cobalt");
        assertThat(steps.get(1).detail()).contains("two poles");
    }

    @Test
    void onlyAccommodatedLearnersGetStepByStepAndGuidedExamples() {
        AccommodationService service = new AccommodationService();
        Student normal = new Student();
        normal.setLearnerType(LearnerType.NORMAL);
        Student ds = new Student();
        ds.setLearnerType(LearnerType.SPECIAL_NEEDS);
        ds.setNeeds(List.of(LearningNeed.DOWN_SYNDROME));

        assertThat(service.profileFor(normal).stepByStep()).isFalse();
        assertThat(service.profileFor(normal).guidedExamples()).isFalse();
        assertThat(service.profileFor(ds).stepByStep()).isTrue();
        assertThat(service.profileFor(ds).guidedExamples()).isTrue();
        assertThat(service.profileFor(ds).animatedVisuals()).isTrue();
    }
}
