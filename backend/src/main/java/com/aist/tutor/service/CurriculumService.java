package com.aist.tutor.service;

import com.aist.tutor.domain.Chapter;
import com.aist.tutor.domain.LearningProgress;
import com.aist.tutor.domain.Student;
import com.aist.tutor.domain.Subject;
import com.aist.tutor.repository.ChapterRepository;
import com.aist.tutor.repository.LearningProgressRepository;
import com.aist.tutor.repository.SubjectRepository;
import com.aist.tutor.web.ApiException;
import com.aist.tutor.web.dto.CurriculumDtos.ChapterSummary;
import com.aist.tutor.web.dto.CurriculumDtos.SubjectResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/** Curriculum access, always scoped to the student's own grade. */
@Service
public class CurriculumService {

    private final SubjectRepository subjects;
    private final ChapterRepository chapters;
    private final LearningProgressRepository progress;
    private final StudentService students;
    private final CompletionService completion;

    public CurriculumService(SubjectRepository subjects, ChapterRepository chapters,
                             LearningProgressRepository progress, StudentService students,
                             CompletionService completion) {
        this.subjects = subjects;
        this.chapters = chapters;
        this.progress = progress;
        this.students = students;
        this.completion = completion;
    }

    public List<Integer> availableGrades() {
        return subjects.findAvailableGrades();
    }

    @Transactional(readOnly = true)
    public List<SubjectResponse> subjectsFor(Long studentId) {
        Student student = students.require(studentId);
        return subjects.findByGradeOrderByIdAsc(student.getGrade()).stream()
                .map(s -> new SubjectResponse(s.getId(), s.getName(), s.getGrade(), s.getIcon(),
                        chapters.findBySubjectIdOrderByChapterOrderAsc(s.getId()).size()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ChapterSummary> chaptersFor(Long studentId, Long subjectId) {
        Student student = students.require(studentId);
        Subject subject = subjects.findById(subjectId).orElseThrow(() -> ApiException.notFound("Subject"));
        requireSameGrade(student, subject);

        Map<Long, LearningProgress> byChapter = progress.findByStudentIdOrderByUpdatedAtDesc(studentId).stream()
                .collect(Collectors.toMap(p -> p.getChapter().getId(), Function.identity()));
        Map<Long, CompletionService.ChapterCompletion> done = completion.forStudent(studentId);
        return chapters.findBySubjectIdOrderByChapterOrderAsc(subjectId).stream()
                .map(c -> {
                    LearningProgress p = byChapter.get(c.getId());
                    var cc = done.getOrDefault(c.getId(), CompletionService.ChapterCompletion.NONE);
                    return new ChapterSummary(c.getId(), c.getChapterName(), c.getChapterOrder(),
                            p == null ? 0 : p.getQuestionsAttempted(), p == null ? 0 : p.accuracy(),
                            p == null ? null : p.getCurrentDifficulty(), cc.percent(), cc.status());
                })
                .toList();
    }

    /** Loads a chapter and verifies it belongs to the student's grade. */
    public Chapter requireChapterFor(Student student, Long chapterId) {
        Chapter chapter = chapters.findById(chapterId).orElseThrow(() -> ApiException.notFound("Chapter"));
        requireSameGrade(student, chapter.getSubject());
        return chapter;
    }

    private static void requireSameGrade(Student student, Subject subject) {
        if (subject.getGrade() != student.getGrade()) {
            throw ApiException.forbidden("This content belongs to Grade " + subject.getGrade()
                    + ". You can study Grade " + student.getGrade() + " content.");
        }
    }
}
