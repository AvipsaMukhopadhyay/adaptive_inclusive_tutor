package com.aist.tutor.repository;

import com.aist.tutor.domain.Chapter;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChapterRepository extends JpaRepository<Chapter, Long> {

    List<Chapter> findBySubjectIdOrderByChapterOrderAsc(Long subjectId);
}
