package com.aist.tutor.service;

import com.aist.tutor.domain.Chapter;
import com.aist.tutor.domain.LearningProgress;
import com.aist.tutor.domain.Student;
import com.aist.tutor.domain.Subject;
import com.aist.tutor.repository.ChapterRepository;
import com.aist.tutor.repository.LearningProgressRepository;
import com.aist.tutor.repository.SubjectRepository;
import com.aist.tutor.service.CompletionService.ChapterCompletion;
import com.aist.tutor.service.CompletionService.Status;
import com.aist.tutor.web.dto.LearningDtos.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/** "How much have I done and how much is left?" for the student's grade. */
@Service
public class ProgressService {

    private final StudentService students;
    private final SubjectRepository subjects;
    private final ChapterRepository chapters;
    private final LearningProgressRepository progressRepo;
    private final CompletionService completion;

    public ProgressService(StudentService students, SubjectRepository subjects, ChapterRepository chapters,
                           LearningProgressRepository progressRepo, CompletionService completion) {
        this.students = students;
        this.subjects = subjects;
        this.chapters = chapters;
        this.progressRepo = progressRepo;
        this.completion = completion;
    }

    @Transactional(readOnly = true)
    public ProgressOverview overview(Long studentId) {
        Student student = students.require(studentId);
        Map<Long, ChapterCompletion> done = completion.forStudent(studentId);

        List<SubjectProgress> subjectRows = new ArrayList<>();
        int total = 0, completed = 0, inProgress = 0, percentSum = 0;
        ContinueLearning firstNotStarted = null;

        for (Subject s : subjects.findByGradeOrderByIdAsc(student.getGrade())) {
            List<Chapter> list = chapters.findBySubjectIdOrderByChapterOrderAsc(s.getId());
            int sDone = 0, sProgress = 0, sPercent = 0;
            for (Chapter c : list) {
                ChapterCompletion cc = done.getOrDefault(c.getId(), ChapterCompletion.NONE);
                sPercent += cc.percent();
                if (cc.status() == Status.COMPLETED) sDone++;
                else if (cc.status() == Status.IN_PROGRESS) sProgress++;
                else if (firstNotStarted == null) {
                    firstNotStarted = new ContinueLearning(c.getId(), c.getChapterName(), s.getName(), s.getIcon(), 0, false);
                }
            }
            subjectRows.add(new SubjectProgress(s.getId(), s.getName(), s.getIcon(), list.size(), sDone, sProgress,
                    list.isEmpty() ? 0 : sPercent / list.size()));
            total += list.size();
            completed += sDone;
            inProgress += sProgress;
            percentSum += sPercent;
        }

        List<LearningProgress> recent = progressRepo.findByStudentIdOrderByUpdatedAtDesc(studentId).stream()
                .filter(p -> p.getChapter().getSubject().getGrade() == student.getGrade()).toList();

        // Resume the most recently studied unfinished chapter; otherwise suggest the next new one.
        ContinueLearning next = recent.stream()
                .filter(p -> done.getOrDefault(p.getChapter().getId(), ChapterCompletion.NONE).status() != Status.COMPLETED)
                .findFirst()
                .map(p -> new ContinueLearning(p.getChapter().getId(), p.getChapter().getChapterName(),
                        p.getChapter().getSubject().getName(), p.getChapter().getSubject().getIcon(),
                        done.getOrDefault(p.getChapter().getId(), ChapterCompletion.NONE).percent(), true))
                .orElse(firstNotStarted);

        List<String> strengths = recent.stream()
                .filter(p -> p.getQuestionsAttempted() >= 3 && p.accuracy() >= 0.75)
                .map(p -> p.getChapter().getChapterName()).toList();
        List<String> struggles = recent.stream()
                .filter(p -> p.getQuestionsAttempted() >= 2 && p.accuracy() < 0.5)
                .map(p -> p.getChapter().getChapterName()).toList();

        return new ProgressOverview(
                new OverallProgress(total, completed, inProgress, total - completed - inProgress,
                        total == 0 ? 0 : percentSum / total),
                subjectRows, next,
                recent.stream().filter(p -> p.getQuestionsAttempted() > 0).map(LearningService::toProgress).toList(),
                strengths, struggles);
    }
}
