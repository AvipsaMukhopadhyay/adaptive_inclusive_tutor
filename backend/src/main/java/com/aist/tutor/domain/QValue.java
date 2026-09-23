package com.aist.tutor.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "q_value")
public class QValue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id")
    private Long studentId;

    @Column(name = "state_key")
    private String stateKey;

    private String action;

    @Column(name = "q_value")
    private double value;

    private int visits;

    protected QValue() {}

    public QValue(Long studentId, String stateKey, String action, double value) {
        this.studentId = studentId;
        this.stateKey = stateKey;
        this.action = action;
        this.value = value;
    }

    public String getStateKey() { return stateKey; }
    public String getAction() { return action; }
    public double getValue() { return value; }
    public int getVisits() { return visits; }

    public void update(double newValue) {
        this.value = newValue;
        this.visits++;
    }
}
