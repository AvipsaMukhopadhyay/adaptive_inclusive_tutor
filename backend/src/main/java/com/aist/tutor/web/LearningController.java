package com.aist.tutor.web;

import com.aist.tutor.service.LearningService;
import com.aist.tutor.tutor.TutorReply;
import com.aist.tutor.web.dto.LearningDtos.*;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/students/{studentId}")
public class LearningController {

    private final LearningService learning;

    public LearningController(LearningService learning) {
        this.learning = learning;
    }

    @GetMapping("/chapters/{chapterId}/lesson")
    public LessonResponse lesson(@PathVariable Long studentId, @PathVariable Long chapterId) {
        return learning.lesson(studentId, chapterId);
    }

    /** Asks the adaptive engine to choose the next activity. */
    @PostMapping("/chapters/{chapterId}/next-activity")
    public ActivityResponse nextActivity(@PathVariable Long studentId, @PathVariable Long chapterId) {
        return learning.nextActivity(studentId, chapterId);
    }

    @PostMapping("/chapters/{chapterId}/answers")
    public AnswerResponse answer(@PathVariable Long studentId, @PathVariable Long chapterId,
                                 @Valid @RequestBody AnswerRequest request) {
        return learning.submitAnswer(studentId, chapterId, request);
    }

    @PostMapping("/tutor/chat")
    public TutorReply chat(@PathVariable Long studentId, @Valid @RequestBody ChatRequest request) {
        return learning.chat(studentId, request);
    }
}
