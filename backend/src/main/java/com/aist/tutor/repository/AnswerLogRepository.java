package com.aist.tutor.repository;

import com.aist.tutor.domain.AnswerLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AnswerLogRepository extends JpaRepository<AnswerLog, Long> {

    List<AnswerLog> findTop5ByStudentIdAndChapterIdOrderByCreatedAtDesc(Long studentId, Long chapterId);

    List<AnswerLog> findByStudentIdAndChapterId(Long studentId, Long chapterId);

    List<AnswerLog> findByStudentId(Long studentId);
}
