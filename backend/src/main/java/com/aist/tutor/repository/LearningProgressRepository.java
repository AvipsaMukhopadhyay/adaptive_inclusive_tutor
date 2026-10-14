package com.aist.tutor.repository;

import com.aist.tutor.domain.LearningProgress;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface LearningProgressRepository extends JpaRepository<LearningProgress, Long> {

    Optional<LearningProgress> findByStudentIdAndChapterId(Long studentId, Long chapterId);

    /** Creates the row if missing; safe when two requests for the same chapter arrive at once. */
    @Modifying
    @Query(value = """
            INSERT INTO learning_progress (student_id, chapter_id, current_difficulty)
            VALUES (:studentId, :chapterId, :difficulty)
            ON CONFLICT (student_id, chapter_id) DO NOTHING""", nativeQuery = true)
    void insertIfAbsent(@Param("studentId") Long studentId, @Param("chapterId") Long chapterId,
                        @Param("difficulty") String difficulty);

    @EntityGraph(attributePaths = {"chapter", "chapter.subject"})
    List<LearningProgress> findByStudentIdOrderByUpdatedAtDesc(Long studentId);
}
