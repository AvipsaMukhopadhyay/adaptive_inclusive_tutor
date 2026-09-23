package com.aist.tutor.web.dto;

import com.aist.tutor.domain.LearnerType;
import com.aist.tutor.domain.LearningNeed;
import com.aist.tutor.personalization.AccommodationProfile;
import jakarta.validation.constraints.*;

import java.util.List;

public final class StudentDtos {

    private StudentDtos() {}

    public record CreateStudentRequest(
            @NotBlank @Size(max = 120) String name,
            @NotBlank @Email String email,
            @Pattern(regexp = "^[+0-9 ()-]{0,20}$", message = "must be a valid phone number") String phone,
            @NotNull @Min(1) @Max(12) Integer grade,
            @NotBlank String board,
            @NotNull LearnerType learnerType,
            List<LearningNeed> specialNeeds,
            @Size(max = 500) String otherNeeds) {
    }

    public record StudentResponse(Long id, String name, String email, String phone, int grade, String board,
                                  LearnerType learnerType, List<LearningNeed> specialNeeds, String otherNeeds,
                                  AccommodationProfile profile) {
    }
}
