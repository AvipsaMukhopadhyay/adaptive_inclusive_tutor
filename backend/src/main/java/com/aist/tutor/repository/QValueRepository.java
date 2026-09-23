package com.aist.tutor.repository;

import com.aist.tutor.domain.QValue;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QValueRepository extends JpaRepository<QValue, Long> {

    List<QValue> findByStudentIdAndStateKey(Long studentId, String stateKey);

    long countByStudentId(Long studentId);
}
