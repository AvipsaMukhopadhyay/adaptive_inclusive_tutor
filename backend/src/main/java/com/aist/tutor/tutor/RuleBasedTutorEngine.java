package com.aist.tutor.tutor;

import com.aist.tutor.adaptive.TutorAction;
import com.aist.tutor.domain.Chapter;
import com.aist.tutor.domain.Question;
import com.aist.tutor.personalization.AccommodationProfile;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * A simple, predictable "personal teacher" that answers from the chapter content.
 * It adapts wording and length to the student's accommodation profile.
 */
@Component
public class RuleBasedTutorEngine implements TutorEngine {

    private static final List<String> DEFAULT_CHIPS = List.of("Explain this chapter", "Give me an example", "Give me a hint", "Ask me a question");
    private static final Set<String> STOP_WORDS = Set.of("what", "is", "the", "a", "an", "of", "to", "and", "in", "how",
            "do", "does", "i", "me", "you", "can", "please", "why", "are", "it", "this", "that", "for", "with", "my",
            "explain", "chapter", "teach", "tell", "about", "learn", "mean", "means");

    @Override
    public TutorReply reply(TutorContext ctx, String message) {
        String m = message.toLowerCase(Locale.ROOT).trim();
        Chapter chapter = ctx.chapter();

        if (matches(m, "hint", "clue", "help me with", "stuck")) {
            return hint(ctx);
        }
        if (matches(m, "why", "wrong", "mistake", "solution", "how do i solve")) {
            return whyAnswer(ctx);
        }
        if (matches(m, "simpler", "simple", "simply", "don't understand", "dont understand", "confused", "again", "repeat", "easier words")) {
            return simpler(ctx);
        }
        if (matches(m, "example", "show me", "instance")) {
            return example(ctx);
        }
        if (matches(m, "question", "quiz", "test me", "practice", "ready")) {
            return new TutorReply(structured(ctx, "Great! I'm picking your next activity based on how you're doing.",
                    "Read the question, then choose or type your answer and press Submit."),
                    List.of("Give me a hint"), "NEXT_ACTIVITY");
        }
        if (matches(m, "harder", "challenge", "difficult")) {
            return TutorReply.of("I like your confidence! Answer a few questions correctly in a row and I'll "
                    + "move you up to a harder level automatically.", List.of("Ask me a question"));
        }
        if (matches(m, "explain", "teach", "what is", "what are", "tell me about", "learn", "mean")) {
            String specific = findRelatedPoint(chapter, m);
            if (specific != null && !matches(m, "more")) {
                return TutorReply.of(specific + "\n\nWould you like an example of this?",
                        List.of("Give me an example", "Explain it more simply"));
            }
            return explain(ctx);
        }
        if (matches(m, "hi", "hello", "hey")) {
            return TutorReply.of("Hi " + ctx.studentName() + "! I'm your tutor for \"" + chapter.getChapterName()
                    + "\". What would you like to do?", DEFAULT_CHIPS);
        }
        if (matches(m, "thank", "thanks", "ok", "okay", "got it")) {
            return TutorReply.of(pick(ctx, List.of("You're welcome! Keep going - you're learning well.",
                    "Happy to help! Shall we try a question?", "Great! Tell me whenever you need me.")), List.of("Ask me a question"));
        }

        String related = findRelatedPoint(chapter, m);
        if (related != null) {
            return TutorReply.of("Here's what I found in this chapter:\n\n" + related
                    + "\n\nWould you like an example of this?", List.of("Give me an example", "Explain it more simply"));
        }
        return TutorReply.of("I'm not sure I understood. I can explain the chapter, show an example, "
                + "give you a hint, or ask you a question. What would you like?", DEFAULT_CHIPS);
    }

    @Override
    public String feedback(TutorContext ctx, Question q, boolean correct, boolean finished, int attemptsLeft) {
        AccommodationProfile p = ctx.profile();
        if (correct) {
            String praise = pick(ctx, List.of("Correct! Well done.", "Yes, that's right! Great work.",
                    "Excellent - you got it!", "Correct! You're doing really well."));
            return p.simpleLanguage() ? praise : praise + " " + nullSafe(q.getExplanation());
        }
        if (!finished) {
            return "Not quite - that's okay, mistakes help us learn. Here's a hint: " + q.getHint()
                    + " You have " + attemptsLeft + (attemptsLeft == 1 ? " try" : " tries") + " left.";
        }
        String explanation = p.simpleLanguage() ? firstSentence(q.getExplanation()) : q.getExplanation();
        return "Good effort! The correct answer is \"" + q.displayAnswer() + "\". " + nullSafe(explanation)
                + " Let's keep practising - you'll get the next one.";
    }

    @Override
    public String introduceActivity(TutorContext ctx, TutorAction action) {
        String msg = action.studentMessage();
        if (ctx.profile().structuredFlow()) {
            msg += switch (action) {
                case REVIEW_EASIER -> " Step 1: read the key ideas. Step 2: answer the question.";
                case WORKED_EXAMPLE -> " Step 1: read the example. Step 2: answer the question.";
                default -> " Step 1: read the question. Step 2: choose or type your answer. Step 3: press Submit.";
            };
        }
        return msg;
    }

    private TutorReply explain(TutorContext ctx) {
        Chapter c = ctx.chapter();
        AccommodationProfile p = ctx.profile();
        String text;
        if (p.simpleLanguage() || p.chunkSize() > 0) {
            List<String> points = c.getKeyPoints();
            int n = p.chunkSize() > 0 ? Math.min(p.chunkSize(), points.size()) : points.size();
            int start = (ctx.turn() * n) % Math.max(points.size(), 1);
            text = points.stream().skip(start).limit(n).map(s -> "• " + s).collect(Collectors.joining("\n"));
            text += "\n\nShall I tell you the next part, or ask you a quick question?";
        } else {
            text = c.getExplanation() + "\n\nKey ideas:\n"
                    + c.getKeyPoints().stream().map(s -> "• " + s).collect(Collectors.joining("\n"));
        }
        return TutorReply.of(structured(ctx, text, "When you are ready, tap \"Ask me a question\"."),
                List.of("Explain more", "Give me an example", "Ask me a question"));
    }

    private TutorReply simpler(TutorContext ctx) {
        List<String> points = ctx.chapter().getKeyPoints();
        String point = points.isEmpty() ? ctx.chapter().getExplanation() : points.get(ctx.turn() % points.size());
        return TutorReply.of("Let's make it simple. Just remember this one idea:\n\n👉 " + point
                + "\n\nDoes that make sense? I can show you an example.", List.of("Give me an example", "Say it again", "Ask me a question"));
    }

    private TutorReply example(TutorContext ctx) {
        List<Map<String, String>> examples = ctx.chapter().getExamples();
        if (examples.isEmpty()) return explain(ctx);
        Map<String, String> ex = examples.get(ctx.turn() % examples.size());
        String visual = ex.getOrDefault("visual", "");
        String text = "📘 " + ex.get("title") + "\n\n" + ex.get("content")
                + (visual.isBlank() ? "" : "\n\n" + visual);
        return TutorReply.of(text, List.of("Another example", "Ask me a question"));
    }

    private TutorReply hint(TutorContext ctx) {
        Question q = ctx.currentQuestion();
        if (q == null) {
            return new TutorReply("There's no question on screen yet. Let me give you one!", List.of(), "NEXT_ACTIVITY");
        }
        return TutorReply.of("💡 Hint: " + q.getHint(), List.of("Explain it more simply", "Why is that the answer?"));
    }

    private TutorReply whyAnswer(TutorContext ctx) {
        Question q = ctx.currentQuestion();
        if (q == null) return explain(ctx);
        return TutorReply.of("Let's think it through together. " + q.getHint()
                + "\n\nTry once more. After you submit, I'll show the full explanation.", List.of("Give me an example", "Explain it more simply"));
    }

    private String structured(TutorContext ctx, String text, String nextStep) {
        return ctx.profile().structuredFlow() ? text + "\n\nWhat to do next: " + nextStep : text;
    }

    private static String findRelatedPoint(Chapter chapter, String message) {
        Set<String> words = Arrays.stream(message.split("[^a-z0-9]+"))
                .filter(w -> w.length() > 2 && !STOP_WORDS.contains(w)).collect(Collectors.toSet());
        if (words.isEmpty()) return null;
        String best = null;
        long bestScore = 0;
        for (String point : chapter.getKeyPoints()) {
            String lower = point.toLowerCase(Locale.ROOT);
            long score = words.stream().filter(lower::contains).count();
            if (score > bestScore) {
                bestScore = score;
                best = point;
            }
        }
        return best;
    }

    private static boolean matches(String message, String... keywords) {
        for (String k : keywords) {
            if (k.contains(" ") ? message.contains(k) : message.matches(".*\\b" + k + "\\b.*")) return true;
        }
        return false;
    }

    private static String pick(TutorContext ctx, List<String> options) {
        return options.get(Math.floorMod(ctx.turn(), options.size()));
    }

    private static String firstSentence(String s) {
        if (s == null) return "";
        int i = s.indexOf(". ");
        return i > 0 ? s.substring(0, i + 1) : s;
    }

    private static String nullSafe(String s) {
        return s == null ? "" : s;
    }
}
