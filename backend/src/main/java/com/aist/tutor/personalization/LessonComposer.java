package com.aist.tutor.personalization;

import com.aist.tutor.domain.Chapter;
import com.aist.tutor.domain.Difficulty;
import com.aist.tutor.domain.Question;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Builds the extra teaching material used for accommodated learners from the existing chapter content:
 * <ul>
 *   <li><b>Steps</b>: each key idea paired with the explanation sentence that expands on it and a matching example.</li>
 *   <li><b>Guided examples</b>: questions solved step by step (read → think → answer → why).</li>
 * </ul>
 * Deriving these from the chapter keeps them consistent with the lesson, and any new chapter gets them for free.
 */
@Component
public class LessonComposer {

    public record Step(String point, String detail, Map<String, String> example) {}

    public record GuidedExample(Long questionId, String prompt, List<String> options, String think, String answer,
                                String why) {}

    private static final Set<String> STOP = Set.of("the", "and", "for", "are", "with", "that", "this", "from", "into",
            "its", "has", "have", "was", "were", "they", "them", "their", "can", "all", "one", "two", "but", "not",
            "you", "your", "which", "when", "where", "what", "more", "also", "each", "every", "than", "then");

    public List<Step> steps(Chapter chapter) {
        List<String> sentences = Arrays.stream(chapter.getExplanation().split("(?<=[.!?])\\s+"))
                .map(String::trim).filter(s -> !s.isEmpty()).toList();
        List<Map<String, String>> examples = chapter.getExamples();
        Set<String> usedSentences = new HashSet<>();
        Set<Map<String, String>> usedExamples = new HashSet<>();
        List<Step> steps = new ArrayList<>();

        List<String> points = chapter.getKeyPoints();
        for (int i = 0; i < points.size(); i++) {
            String point = points.get(i);
            Set<String> words = words(point);

            // The explanation sentence that best expands on this idea (prefer ones not used yet).
            String detail = sentences.stream()
                    .filter(s -> !normalise(s).equals(normalise(point)))
                    .max(Comparator.comparingDouble(s -> overlap(words, words(s)) - (usedSentences.contains(s) ? 0.5 : 0)))
                    .filter(s -> overlap(words, words(s)) > 0)
                    .orElse(null);
            if (detail != null) usedSentences.add(detail);

            Map<String, String> example = null;
            final int fallback = i;
            if (!examples.isEmpty()) {
                Set<String> context = new HashSet<>(words);
                if (detail != null) context.addAll(words(detail));
                // Title words count double; an example already shown is slightly less preferred, for variety.
                Map<Map<String, String>, Integer> score = new HashMap<>();
                for (Map<String, String> e : examples) {
                    int s = overlap(context, words(e.get("content"))) + 2 * overlap(context, words(e.get("title")));
                    score.put(e, s > 0 && usedExamples.contains(e) ? s - 1 : s);
                }
                example = examples.stream().max(Comparator.comparingInt(score::get))
                        .filter(e -> score.get(e) > 0)
                        .orElseGet(() -> examples.stream().filter(e -> !usedExamples.contains(e)).findFirst()
                                .orElse(examples.get(fallback % examples.size())));   // every idea gets an example
                usedExamples.add(example);
            }
            steps.add(new Step(point, detail, example));
        }
        return steps;
    }

    /** One easy and one medium question, solved step by step. */
    public List<GuidedExample> guidedExamples(Map<Difficulty, List<Question>> byDifficulty) {
        List<GuidedExample> out = new ArrayList<>();
        for (Difficulty d : List.of(Difficulty.EASY, Difficulty.MEDIUM)) {
            byDifficulty.getOrDefault(d, List.of()).stream().findFirst().ifPresent(q -> out.add(new GuidedExample(
                    q.getId(), q.getPrompt(), q.getOptions(), q.getHint(), q.displayAnswer(), q.getExplanation())));
        }
        return out;
    }

    private static int overlap(Set<String> a, Set<String> b) {
        int n = 0;
        for (String w : a) if (b.contains(w)) n++;
        return n;
    }

    private static Set<String> words(String text) {
        return Arrays.stream(text.toLowerCase(Locale.ROOT).split("[^\\p{L}\\p{N}]+"))
                .filter(w -> w.length() > 2 && !STOP.contains(w))
                .map(w -> w.endsWith("s") && w.length() > 4 ? w.substring(0, w.length() - 1) : w)   // crude singular
                .collect(Collectors.toSet());
    }

    private static String normalise(String s) {
        return s.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", "");
    }
}
