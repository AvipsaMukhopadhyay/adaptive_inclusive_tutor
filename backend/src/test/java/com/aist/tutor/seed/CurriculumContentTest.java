package com.aist.tutor.seed;

import com.aist.tutor.domain.Difficulty;
import com.aist.tutor.domain.Question;
import com.aist.tutor.seed.CurriculumSeeder.SeedCurriculum;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

/** Guards the seed curriculum: every grade 6-12 is present and every stored answer is accepted by the grader. */
class CurriculumContentTest {

    private static SeedCurriculum load() throws Exception {
        try (InputStream in = new ClassPathResource("seed/curriculum.json").getInputStream()) {
            return new ObjectMapper().readValue(in, SeedCurriculum.class);
        }
    }

    @Test
    void coversGradesSixToTwelveWithScienceSplitFromGradeNine() throws Exception {
        SeedCurriculum c = load();
        assertThat(c.grades()).extracting(CurriculumSeeder.SeedGrade::grade).containsExactly(6, 7, 8, 9, 10, 11, 12);
        for (CurriculumSeeder.SeedGrade g : c.grades()) {
            List<String> subjects = g.subjects().stream().map(CurriculumSeeder.SeedSubject::name).toList();
            if (g.grade() >= 9) {
                assertThat(subjects).contains("Physics", "Chemistry", "Biology").doesNotContain("Science");
            } else {
                assertThat(subjects).contains("Science");
            }
        }
    }

    @Test
    void everyChapterHasAllLevelsAndEveryAnswerIsGradedCorrect() throws Exception {
        List<String> problems = new ArrayList<>();
        for (CurriculumSeeder.SeedGrade g : load().grades()) {
            for (CurriculumSeeder.SeedSubject s : g.subjects()) {
                for (CurriculumSeeder.SeedChapter ch : s.chapters()) {
                    var levels = ch.questions().stream().map(CurriculumSeeder.SeedQuestion::difficulty).collect(Collectors.toSet());
                    if (levels.size() != Difficulty.values().length) problems.add(ch.name() + ": missing a difficulty level");
                    for (CurriculumSeeder.SeedQuestion sq : ch.questions()) {
                        Question q = new Question(null, sq.difficulty(), sq.prompt(), sq.options(), sq.answer(), sq.hint(), sq.explanation());
                        // What the student would submit: the matching option, or the displayed answer when typing.
                        String submitted = sq.options() == null || sq.options().isEmpty() ? q.displayAnswer()
                                : sq.options().stream().filter(q::isCorrect).findFirst().orElse(null);
                        if (submitted == null || !q.isCorrect(submitted)) {
                            problems.add("Grade " + g.grade() + " / " + ch.name() + ": " + sq.prompt());
                        }
                    }
                }
            }
        }
        assertThat(problems).isEmpty();
    }
}
