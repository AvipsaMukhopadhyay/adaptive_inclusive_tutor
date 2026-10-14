package com.aist.tutor.seed;

import com.aist.tutor.domain.Chapter;
import com.aist.tutor.domain.Difficulty;
import com.aist.tutor.domain.Question;
import com.aist.tutor.domain.Subject;
import com.aist.tutor.repository.ChapterRepository;
import com.aist.tutor.repository.QuestionRepository;
import com.aist.tutor.repository.SubjectRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Syncs the predefined curriculum (seed/curriculum.json) into the database on startup.
 * Only missing subjects (matched by grade + name) and chapters (matched by order) are added,
 * so extending the JSON never touches existing content or student progress.
 * Later phases can replace this with syllabus upload / curriculum management.
 */
@Component
public class CurriculumSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(CurriculumSeeder.class);

    record SeedQuestion(Difficulty difficulty, String prompt, List<String> options, String answer, String hint,
                        String explanation) {}

    record SeedChapter(String name, String explanation, List<String> keyPoints, List<Map<String, String>> examples,
                       String activity, List<SeedQuestion> questions) {}

    record SeedSubject(String name, String icon, List<SeedChapter> chapters) {}

    record SeedGrade(int grade, List<SeedSubject> subjects) {}

    record SeedCurriculum(List<SeedGrade> grades) {}

    private final SubjectRepository subjects;
    private final ChapterRepository chapters;
    private final QuestionRepository questions;
    private final ObjectMapper mapper;

    public CurriculumSeeder(SubjectRepository subjects, ChapterRepository chapters, QuestionRepository questions,
                            ObjectMapper mapper) {
        this.subjects = subjects;
        this.chapters = chapters;
        this.questions = questions;
        this.mapper = mapper;
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        SeedCurriculum curriculum;
        try (InputStream in = new ClassPathResource("seed/curriculum.json").getInputStream()) {
            curriculum = mapper.readValue(in, SeedCurriculum.class);
        }
        int addedChapters = 0, addedQuestions = 0;
        for (SeedGrade g : curriculum.grades()) {
            for (SeedSubject s : g.subjects()) {
                Subject subject = subjects.findByGradeAndName(g.grade(), s.name())
                        .orElseGet(() -> subjects.save(new Subject(s.name(), g.grade(), s.icon())));
                Set<Integer> existing = chapters.findBySubjectIdOrderByChapterOrderAsc(subject.getId()).stream()
                        .map(Chapter::getChapterOrder).collect(Collectors.toSet());
                for (int i = 0; i < s.chapters().size(); i++) {
                    int order = i + 1;
                    if (existing.contains(order)) continue;
                    SeedChapter c = s.chapters().get(i);
                    Chapter chapter = chapters.save(new Chapter(subject, c.name(), order, c.explanation(),
                            c.keyPoints(), c.examples(), c.activity()));
                    addedChapters++;
                    for (SeedQuestion sq : c.questions()) {
                        questions.save(new Question(chapter, sq.difficulty(), sq.prompt(),
                                sq.options() == null ? List.of() : sq.options(), sq.answer(), sq.hint(), sq.explanation()));
                        addedQuestions++;
                    }
                }
            }
        }
        log.info("Curriculum sync: {} grades in seed file, added {} chapters and {} questions",
                curriculum.grades().size(), addedChapters, addedQuestions);
    }
}
