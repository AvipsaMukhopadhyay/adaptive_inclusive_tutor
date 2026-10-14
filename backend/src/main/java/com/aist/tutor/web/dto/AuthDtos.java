package com.aist.tutor.web.dto;

import com.aist.tutor.web.dto.StudentDtos.CreateStudentRequest;
import com.aist.tutor.web.dto.StudentDtos.StudentResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public final class AuthDtos {

    private AuthDtos() {}

    public record SignupRequest(@Valid @NotNull CreateStudentRequest profile,
                                @NotBlank @Size(min = 8, max = 100, message = "must be at least 8 characters") String password) {
    }

    public record LoginRequest(@NotBlank @Email String email, @NotBlank String password) {
    }

    public record AuthResponse(String token, StudentResponse student) {
    }
}
