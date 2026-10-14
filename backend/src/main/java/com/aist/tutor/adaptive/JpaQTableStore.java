package com.aist.tutor.adaptive;

import com.aist.tutor.domain.QValue;
import com.aist.tutor.repository.QValueRepository;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.Map;

@Component
public class JpaQTableStore implements QTableStore {

    private final QValueRepository repository;

    public JpaQTableStore(QValueRepository repository) {
        this.repository = repository;
    }

    @Override
    public Map<TutorAction, Double> load(Long studentId, String stateKey) {
        Map<TutorAction, Double> values = new EnumMap<>(TutorAction.class);
        repository.findByStudentIdAndStateKey(studentId, stateKey)
                .forEach(q -> values.put(TutorAction.valueOf(q.getAction()), q.getValue()));
        return values;
    }

    @Override
    public void save(Long studentId, String stateKey, TutorAction action, double value) {
        QValue row = repository.findByStudentIdAndStateKey(studentId, stateKey).stream()
                .filter(q -> q.getAction().equals(action.name()))
                .findFirst()
                .orElseGet(() -> new QValue(studentId, stateKey, action.name(), value));
        row.update(value);
        repository.save(row);
    }
}
