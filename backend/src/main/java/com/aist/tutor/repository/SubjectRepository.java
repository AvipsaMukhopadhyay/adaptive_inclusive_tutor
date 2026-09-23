package com.aist.tutor.repository;

import com.aist.tutor.domain.Subject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface SubjectRepository extends JpaRepository<Subject, Long> {

    List<Subject> findByGradeOrderByIdAsc(int grade);

    Optional<Subject> findByGradeAndName(int grade, String name);

    @Query("select distinct s.grade from Subject s order by s.grade")
    List<Integer> findAvailableGrades();
}
