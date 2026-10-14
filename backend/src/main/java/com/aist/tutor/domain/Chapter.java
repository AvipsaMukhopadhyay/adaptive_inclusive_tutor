package com.aist.tutor.domain;

import jakarta.persistence.*;

import java.util.List;
import java.util.Map;

@Entity
@Table(name = "chapter")
public class Chapter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "subject_id")
    private Subject subject;

    @Column(name = "chapter_name")
    private String chapterName;

    @Column(name = "chapter_order")
    private int chapterOrder;

    private String explanation;

    @Convert(converter = StringListConverter.class)
    @Column(name = "key_points")
    private List<String> keyPoints;

    /** Each example: {title, content, visual}. */
    @Convert(converter = JsonListConverter.class)
    private List<Map<String, String>> examples;

    private String activity;

    protected Chapter() {}

    public Chapter(Subject subject, String chapterName, int chapterOrder, String explanation,
                   List<String> keyPoints, List<Map<String, String>> examples, String activity) {
        this.subject = subject;
        this.chapterName = chapterName;
        this.chapterOrder = chapterOrder;
        this.explanation = explanation;
        this.keyPoints = keyPoints;
        this.examples = examples;
        this.activity = activity;
    }

    public Long getId() { return id; }
    public Subject getSubject() { return subject; }
    public String getChapterName() { return chapterName; }
    public int getChapterOrder() { return chapterOrder; }
    public String getExplanation() { return explanation; }
    public List<String> getKeyPoints() { return keyPoints; }
    public List<Map<String, String>> getExamples() { return examples; }
    public String getActivity() { return activity; }
}
