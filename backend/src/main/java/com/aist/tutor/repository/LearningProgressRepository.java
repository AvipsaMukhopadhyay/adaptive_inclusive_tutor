package com.aist.tutor.repository;

import com.aist.tutor.domain.LearningProgress;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LearningProgressRepository extends JpaRepository<LearningProgress, Long> {

    Optional<LearningProgress> findByStudentIdAndChapterId(Long studentId, Long chapterId);

    @EntityGraph(attributePaths = {"chapter", "chapter.subject"})
    List<LearningProgress> findByStudentIdOrderByUpdatedAtDesc(Long studentId);
}
