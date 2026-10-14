package com.aist.tutor.web;

import com.aist.tutor.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.cors.CorsUtils;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.HandlerMapping;

import java.util.Map;

/**
 * Protects /api/students/{id}/** : the caller must send a valid bearer token,
 * and may only access their own student record.
 */
@Component
public class AuthInterceptor implements HandlerInterceptor {

    public static final String STUDENT_ID_ATTRIBUTE = "authStudentId";

    private final AuthService auth;

    public AuthInterceptor(AuthService auth) {
        this.auth = auth;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (CorsUtils.isPreFlightRequest(request)) return true;

        Long studentId = auth.studentIdFor(bearerToken(request))
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Please log in to continue."));

        @SuppressWarnings("unchecked")
        Map<String, String> vars = (Map<String, String>) request.getAttribute(HandlerMapping.URI_TEMPLATE_VARIABLES_ATTRIBUTE);
        String pathId = vars == null ? null : vars.getOrDefault("studentId", vars.get("id"));
        if (pathId != null && !pathId.equals(String.valueOf(studentId))) {
            throw ApiException.forbidden("You can only access your own learning data.");
        }
        request.setAttribute(STUDENT_ID_ATTRIBUTE, studentId);
        return true;
    }

    public static String bearerToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        return header != null && header.startsWith("Bearer ") ? header.substring(7).trim() : null;
    }
}
