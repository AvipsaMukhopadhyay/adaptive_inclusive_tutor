package com.aist.tutor.web;

import com.aist.tutor.service.CurriculumService;
import com.aist.tutor.service.ProgressService;
import com.aist.tutor.service.StudentService;
import com.aist.tutor.web.dto.CurriculumDtos.ChapterSummary;
import com.aist.tutor.web.dto.CurriculumDtos.SubjectResponse;
import com.aist.tutor.web.dto.LearningDtos.ProgressOverview;
import com.aist.tutor.web.dto.StudentDtos.StudentResponse;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class StudentController {

    private final StudentService students;
    private final CurriculumService curriculum;
    private final ProgressService progress;

    public StudentController(StudentService students, CurriculumService curriculum, ProgressService progress) {
        this.students = students;
        this.curriculum = curriculum;
        this.progress = progress;
    }

    @GetMapping("/grades")
    public List<Integer> grades() {
        return curriculum.availableGrades();
    }

    @GetMapping("/students/{id}")
    public StudentResponse get(@PathVariable Long id) {
        return students.get(id);
    }

    @GetMapping("/students/{id}/subjects")
    public List<SubjectResponse> subjects(@PathVariable Long id) {
        return curriculum.subjectsFor(id);
    }

    @GetMapping("/students/{id}/subjects/{subjectId}/chapters")
    public List<ChapterSummary> chapters(@PathVariable Long id, @PathVariable Long subjectId) {
        return curriculum.chaptersFor(id, subjectId);
    }

    @GetMapping("/students/{id}/progress")
    public ProgressOverview progress(@PathVariable Long id) {
        return progress.overview(id);
    }
}
