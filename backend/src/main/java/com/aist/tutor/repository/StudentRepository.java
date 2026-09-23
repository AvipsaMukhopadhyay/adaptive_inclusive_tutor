package com.aist.tutor.repository;

import com.aist.tutor.domain.Student;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface StudentRepository extends JpaRepository<Student, Long> {

    /** Only students with an account (a password) can log in. */
    Optional<Student> findByEmailIgnoreCaseAndPasswordHashIsNotNull(String email);

    boolean existsByEmailIgnoreCaseAndPasswordHashIsNotNull(String email);
}
