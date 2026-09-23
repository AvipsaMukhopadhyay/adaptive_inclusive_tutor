package com.aist.tutor.domain;

import jakarta.persistence.*;

import java.util.Arrays;
import java.util.List;

@Entity
@Table(name = "question")
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "chapter_id")
    private Chapter chapter;

    @Enumerated(EnumType.STRING)
    private Difficulty difficulty;

    private String prompt;

    /** Multiple-choice options; empty means the student types the answer. */
    @Convert(converter = StringListConverter.class)
    private List<String> options;

    /** Accepted answers separated by '|'. */
    private String answer;

    private String hint;
    private String explanation;

    protected Question() {}

    public Question(Chapter chapter, Difficulty difficulty, String prompt, List<String> options,
                    String answer, String hint, String explanation) {
        this.chapter = chapter;
        this.difficulty = difficulty;
        this.prompt = prompt;
        this.options = options;
        this.answer = answer;
        this.hint = hint;
        this.explanation = explanation;
    }

    public boolean isCorrect(String given) {
        if (given == null) return false;
        String normalized = normalize(given);
        return Arrays.stream(answer.split("\\|")).map(Question::normalize).anyMatch(normalized::equals);
    }

    /** The main (first) accepted answer, for display. */
    public String displayAnswer() {
        return answer.split("\\|")[0].trim();
    }

    private static String normalize(String s) {
        return s.trim().toLowerCase()
                .replaceAll("(?<=\\d),(?=\\d)", "")   // 10,000 -> 10000
                .replaceAll("[\\s,]+", " ")
                .replaceAll("[.!]+$", "");
    }

    public Long getId() { return id; }
    public Chapter getChapter() { return chapter; }
    public Difficulty getDifficulty() { return difficulty; }
    public String getPrompt() { return prompt; }
    public List<String> getOptions() { return options; }
    public String getHint() { return hint; }
    public String getExplanation() { return explanation; }
}
