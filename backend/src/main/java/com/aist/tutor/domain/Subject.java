package com.aist.tutor.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "subject")
public class Subject {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private int grade;
    private String icon;

    protected Subject() {}

    public Subject(String name, int grade, String icon) {
        this.name = name;
        this.grade = grade;
        this.icon = icon;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public int getGrade() { return grade; }
    public String getIcon() { return icon; }
}
