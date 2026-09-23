package com.aist.tutor.web.dto;

import com.aist.tutor.domain.Difficulty;
import com.aist.tutor.service.CompletionService.Status;

public final class CurriculumDtos {

    private CurriculumDtos() {}

    public record SubjectResponse(Long id, String name, int grade, String icon, int chapterCount) {
    }

    public record ChapterSummary(Long id, String name, int order, int questionsAttempted, double accuracy,
                                 Difficulty currentDifficulty, int percent, Status status) {
    }
}
