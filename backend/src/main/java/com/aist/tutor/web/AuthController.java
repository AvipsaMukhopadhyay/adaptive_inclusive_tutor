package com.aist.tutor.web;

import com.aist.tutor.service.AuthService;
import com.aist.tutor.service.StudentService;
import com.aist.tutor.web.dto.AuthDtos.AuthResponse;
import com.aist.tutor.web.dto.AuthDtos.LoginRequest;
import com.aist.tutor.web.dto.AuthDtos.SignupRequest;
import com.aist.tutor.web.dto.StudentDtos.StudentResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService auth;
    private final StudentService students;

    public AuthController(AuthService auth, StudentService students) {
        this.auth = auth;
        this.students = students;
    }

    @PostMapping("/signup")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse signup(@Valid @RequestBody SignupRequest request) {
        return auth.signup(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return auth.login(request);
    }

    /** Returns the logged-in student, so the app can restore the session on reload. */
    @GetMapping("/me")
    public StudentResponse me(HttpServletRequest request) {
        Long id = auth.studentIdFor(AuthInterceptor.bearerToken(request))
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Please log in to continue."));
        return students.get(id);
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(HttpServletRequest request) {
        String token = AuthInterceptor.bearerToken(request);
        if (token != null) auth.logout(token);
    }
}
