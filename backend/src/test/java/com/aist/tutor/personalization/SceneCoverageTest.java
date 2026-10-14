package com.aist.tutor.personalization;

import com.aist.tutor.domain.Chapter;
import com.aist.tutor.domain.Subject;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

/** Every idea in the curriculum must open a real animation, and only scenes the frontend has may be named. */
class SceneCoverageTest {

    /** Scene ids implemented in frontend/src/components/animation (library.js). */
    static final Set<String> FRONTEND_SCENES = Set.of(
            "fraction", "factor", "place-value", "integer", "equation", "angle", "area-perimeter", "photosynthesis", "circuit",
            "matter", "water-cycle", "food-chain", "vote",
            "factor-tree", "number-line", "graph-line", "progression", "probability", "right-triangle", "venn", "powers",
            "percent", "arrange", "area-under-curve", "tangent", "function-machine", "bar-chart", "measure",
            "earth-sun", "gravity", "atom", "motion-force", "light-ray", "sound-wave", "magnet", "breathing", "cell-division",
            "heredity", "reaction", "heat", "separation", "nutrients", "germs", "energy", "periodic", "classify", "reflex",
            "plant-growth",
            "globe", "timeline", "society", "earth-layers", "landforms", "factory", "sentence-builder", "letter", "figurative",
            "supply-demand", "money-flow", "code-robot", "stack", "network", "binary", "database");

    @Test
    void everyStepOfEveryChapterHasAKnownScene() throws Exception {
        JsonNode root;
        try (InputStream in = getClass().getResourceAsStream("/seed/curriculum.json")) {
            root = new ObjectMapper().readTree(in);
        }
        LessonComposer composer = new LessonComposer();
        List<String> problems = new ArrayList<>();
        int steps = 0;
        for (JsonNode grade : root.get("grades")) {
            for (JsonNode subjectNode : grade.get("subjects")) {
                Subject subject = new Subject(subjectNode.get("name").asText(), grade.get("grade").asInt(), "");
                for (JsonNode c : subjectNode.get("chapters")) {
                    List<String> points = new ArrayList<>();
                    c.get("keyPoints").forEach(p -> points.add(p.asText()));
                    List<Map<String, String>> examples = new ArrayList<>();
                    c.get("examples").forEach(e -> examples.add(Map.of("title", e.get("title").asText(),
                            "content", e.get("content").asText(), "visual", e.path("visual").asText(""))));
                    Chapter chapter = new Chapter(subject, c.get("name").asText(), 1, c.get("explanation").asText(),
                            points, examples, c.path("activity").asText(""));
                    for (LessonComposer.Step step : composer.steps(chapter)) {
                        steps++;
                        if (step.scene() == null || !FRONTEND_SCENES.contains(step.scene())) {
                            problems.add(chapter.getChapterName() + ": " + step.point() + " -> " + step.scene());
                        }
                        if (System.getProperty("printScenes") != null) {
                            System.out.println("SCENE\t" + subject.getName() + "\t" + chapter.getChapterName() + "\t" + step.scene() + "\t" + step.point());
                        }
                    }
                }
            }
        }
        assertThat(steps).isGreaterThan(900);
        assertThat(problems).isEmpty();
    }
}
