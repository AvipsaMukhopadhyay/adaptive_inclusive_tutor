package com.aist.tutor.service;

import com.aist.tutor.domain.AnswerLog;
import com.aist.tutor.domain.Difficulty;
import com.aist.tutor.service.CompletionService.Status;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class CompletionServiceTest {

    private static AnswerLog log(long questionId, Difficulty d, boolean correct) {
        return new AnswerLog(1L, 1L, questionId, d, correct, 1, 20, null, null, 0.0);
    }

    @Test
    void notStartedWithoutAnswers() {
        assertThat(CompletionService.compute(List.of()).status()).isEqualTo(Status.NOT_STARTED);
    }

    @Test
    void repeatedCorrectAnswersToTheSameQuestionCountOnce() {
        var c = CompletionService.compute(List.of(log(1, Difficulty.EASY, true), log(1, Difficulty.EASY, true)));
        assertThat(c.distinctCorrect()).isEqualTo(1);
        assertThat(c.status()).isEqualTo(Status.IN_PROGRESS);
    }

    @Test
    void needsFiveDifferentCorrectAnswersIncludingAHardOne() {
        List<AnswerLog> logs = new ArrayList<>();
        for (long q = 1; q <= 5; q++) logs.add(log(q, Difficulty.MEDIUM, true));
        var withoutHard = CompletionService.compute(logs);
        assertThat(withoutHard.status()).isEqualTo(Status.IN_PROGRESS);
        assertThat(withoutHard.percent()).isEqualTo(83);

        logs.add(log(6, Difficulty.HARD, true));
        var mastered = CompletionService.compute(logs);
        assertThat(mastered.status()).isEqualTo(Status.COMPLETED);
        assertThat(mastered.percent()).isEqualTo(100);
    }

    @Test
    void wrongAnswersDoNotCount() {
        var c = CompletionService.compute(List.of(log(1, Difficulty.HARD, false), log(2, Difficulty.EASY, false)));
        assertThat(c.distinctCorrect()).isZero();
        assertThat(c.hardSolved()).isFalse();
        assertThat(c.percent()).isZero();
    }
}
