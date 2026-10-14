package com.aist.tutor.service;

import com.aist.tutor.domain.LearnerType;
import com.aist.tutor.domain.LearningNeed;
import com.aist.tutor.domain.Student;
import com.aist.tutor.personalization.AccommodationService;
import com.aist.tutor.repository.StudentRepository;
import com.aist.tutor.repository.SubjectRepository;
import com.aist.tutor.web.ApiException;
import com.aist.tutor.web.dto.StudentDtos.CreateStudentRequest;
import com.aist.tutor.web.dto.StudentDtos.StudentResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class StudentService {

    private final StudentRepository students;
    private final SubjectRepository subjects;
    private final AccommodationService accommodations;

    public StudentService(StudentRepository students, SubjectRepository subjects, AccommodationService accommodations) {
        this.students = students;
        this.subjects = subjects;
        this.accommodations = accommodations;
    }

    /** Creates the student record for a new account. Called by {@link AuthService#signup}. */
    @Transactional
    public Student create(CreateStudentRequest req, String passwordHash) {
        if (!subjects.findAvailableGrades().contains(req.grade())) {
            throw ApiException.badRequest("Grade " + req.grade() + " is not available yet");
        }
        List<LearningNeed> needs = req.learnerType() == LearnerType.SPECIAL_NEEDS && req.specialNeeds() != null
                ? req.specialNeeds().stream().distinct().toList() : List.of();
        if (req.learnerType() == LearnerType.SPECIAL_NEEDS && needs.isEmpty()) {
            throw ApiException.badRequest("Please select at least one learning need");
        }
        if (needs.contains(LearningNeed.OTHER) && (req.otherNeeds() == null || req.otherNeeds().isBlank())) {
            throw ApiException.badRequest("Please describe the \"Other\" learning need");
        }

        Student s = new Student();
        s.setName(req.name().trim());
        s.setEmail(req.email().trim());
        s.setPhone(req.phone());
        s.setGrade(req.grade());
        s.setBoard(req.board());
        s.setLearnerType(req.learnerType());
        s.setNeeds(needs);
        s.setOtherNeeds(needs.contains(LearningNeed.OTHER) ? req.otherNeeds().trim() : null);
        s.setPasswordHash(passwordHash);
        return students.save(s);
    }

    @Transactional(readOnly = true)
    public StudentResponse get(Long id) {
        return toResponse(require(id));
    }

    public Student require(Long id) {
        return students.findById(id).orElseThrow(() -> ApiException.notFound("Student"));
    }

    private StudentResponse toResponse(Student s) {
        return new StudentResponse(s.getId(), s.getName(), s.getEmail(), s.getPhone(), s.getGrade(), s.getBoard(),
                s.getLearnerType(), s.getNeeds(), s.getOtherNeeds(), accommodations.profileFor(s));
    }
}
