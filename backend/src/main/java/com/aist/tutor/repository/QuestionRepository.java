package com.aist.tutor.repository;

import com.aist.tutor.domain.Difficulty;
import com.aist.tutor.domain.Question;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuestionRepository extends JpaRepository<Question, Long> {

    List<Question> findByChapterIdAndDifficultyOrderByIdAsc(Long chapterId, Difficulty difficulty);
}
