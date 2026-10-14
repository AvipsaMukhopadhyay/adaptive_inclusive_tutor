package com.aist.tutor.tutor;

import com.aist.tutor.adaptive.TutorAction;
import com.aist.tutor.domain.Chapter;
import com.aist.tutor.domain.Question;
import com.aist.tutor.personalization.AccommodationProfile;
import com.aist.tutor.personalization.Imagery;
import com.aist.tutor.personalization.LessonComposer.Step;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * A simple, predictable "personal teacher" that answers from the chapter content.
 * <p>
 * It speaks in one of four voices chosen from the accommodation profile:
 * <ul>
 *   <li><b>STANDARD</b> (no learning needs): concise and direct, full explanations, an analogy on request.</li>
 *   <li><b>GENTLE</b> (dyslexia, Down syndrome, other): warm and patient, one idea at a time, a picture for every
 *       idea, praise for effort, a second chance with a hint before any answer is revealed.</li>
 *   <li><b>CALM</b> (autism): literal, predictable wording, numbered steps and an explicit "what to do next".</li>
 *   <li><b>LIVELY</b> (ADHD): short, energetic bites with quick checks to keep things moving.</li>
 * </ul>
 * Simple-language learners additionally get only the key sentence of each idea, never the longer detail.
 */
@Component
public class RuleBasedTutorEngine implements TutorEngine {

    enum Voice { STANDARD, GENTLE, CALM, LIVELY }

    static final String NEXT = "Next idea ▶";
    static final String PICTURE = "Picture it 🎨";
    static final String CHECK = "Check my understanding";
    static final String EXAMPLE = "Give me an example";
    static final String SIMPLER = "Say it more simply";
    static final String QUESTION = "Ask me a question";
    static final String REVEAL = "Show me the answer";
    static final String ANIMATE = "Animate it 🎬";

    private static final Set<String> STOP_WORDS = Set.of("what", "is", "the", "a", "an", "of", "to", "and", "in", "how",
            "do", "does", "i", "me", "you", "can", "please", "why", "are", "it", "this", "that", "for", "with", "my",
            "explain", "chapter", "teach", "tell", "about", "learn", "mean", "means");

    static Voice voiceOf(AccommodationProfile p) {
        if (p.structuredFlow() && p.calmMode()) return Voice.CALM;
        if (p.breakEvery() > 0) return Voice.LIVELY;
        if (p.stepByStep() || p.simpleLanguage() || p.structuredFlow() || p.chunkSize() > 0) return Voice.GENTLE;
        return Voice.STANDARD;
    }

    static List<String> defaultChips(AccommodationProfile p) {
        return voiceOf(p) == Voice.STANDARD
                ? List.of("Explain this chapter", EXAMPLE, CHECK, QUESTION)
                : List.of("Teach me step by step", PICTURE, EXAMPLE, CHECK);
    }

    @Override
    public String voice(AccommodationProfile profile) {
        return voiceOf(profile).name().toLowerCase(Locale.ROOT);
    }

    @Override
    public List<String> starterChips(AccommodationProfile profile) {
        return defaultChips(profile);
    }

    // ================================================================== conversation

    @Override
    public TutorReply reply(TutorContext ctx, String message) {
        String m = message.toLowerCase(Locale.ROOT).trim();

        if (ctx.pendingCheck() != null) {
            TutorReply answer = answerCheck(ctx, m, message);
            if (answer != null) return answer;
        }
        if (matches(m, "break", "tired", "sleepy", "exhausted")) {
            return takeBreak(ctx);
        }
        if (matches(m, "harder", "challenge", "more difficult", "too easy")) {
            return challenge(ctx);
        }
        if (matches(m, "confused", "don't get", "dont get", "don't understand", "dont understand", "difficult", "hard",
                "frustrated", "can't do", "cant do", "give up", "stupid", "scared", "nervous", "worried", "sad", "not yet")) {
            return encourage(ctx, m);
        }
        if (matches(m, "hint", "clue", "help me with", "stuck")) {
            return hint(ctx);
        }
        if (matches(m, "why", "wrong", "mistake", "solution", "how do i solve")) {
            return whyAnswer(ctx);
        }
        if (matches(m, "simpler", "simple", "simply", "easier words", "say it again", "repeat", "again")
                && !matches(m, "start again")) {
            return simpler(ctx);
        }
        if (matches(m, "animate", "animation", "animated", "cartoon", "video", "show it moving", "show me moving")) {
            return animate(ctx);
        }
        if (matches(m, "picture", "imagine", "visual", "analogy", "real life", "like what", "story", "draw")) {
            return picture(ctx, m);
        }
        if (matches(m, "example", "show me", "instance")) {
            return example(ctx);
        }
        if (matches(m, "check my understanding", "quick check", "quiz me", "quiz", "check me", "another check")) {
            return askCheck(ctx);
        }
        if (matches(m, "question", "test me", "practice", "ready to practi")) {
            return startPractice(ctx);
        }
        if (matches(m, "start again", "from the start", "step by step", "walk me through", "one at a time")) {
            return step(ctx, 0);
        }
        if (matches(m, "next", "continue", "go on", "explain more", "tell me more", "more", "i'm back", "im back")) {
            return step(ctx, ctx.step() + 1);
        }
        if (matches(m, "explain", "teach", "what is", "what are", "tell me about", "learn", "mean")) {
            String specific = findRelatedPoint(ctx.chapter(), m);
            if (specific != null && !matches(m, "chapter")) {
                return relatedPoint(ctx, specific);
            }
            return explain(ctx);
        }
        if (matches(m, "hi", "hello", "hey", "good morning", "good afternoon")) {
            return greet(ctx);
        }
        if (matches(m, "thank", "thanks", "ok", "okay", "got it", "i understand", "makes sense", "yes")) {
            return acknowledge(ctx);
        }

        String related = findRelatedPoint(ctx.chapter(), m);
        if (related != null) {
            return relatedPoint(ctx, related);
        }
        return notUnderstood(ctx);
    }

    // ------------------------------------------------------------------ teaching

    private TutorReply explain(TutorContext ctx) {
        if (voiceOf(ctx.profile()) != Voice.STANDARD) {
            return step(ctx, 0);
        }
        Chapter c = ctx.chapter();
        String text = "**The big picture: " + c.getChapterName() + "**\n\n" + c.getExplanation()
                + "\n\n**Key ideas**\n" + bullets(c.getKeyPoints())
                + "\n\n💡 **Think of it like this:** " + Imagery.picture(c, c.getChapterName(), String.join(" ", c.getKeyPoints()), c.getExplanation());
        return TutorReply.of(text, List.of(EXAMPLE, "Walk me through it", CHECK, QUESTION));
    }

    /** One idea of the chapter, with its detail, a picture and an example, in the student's voice. */
    private TutorReply step(TutorContext ctx, int index) {
        List<Step> steps = ctx.steps();
        if (steps.isEmpty()) {
            return voiceOf(ctx.profile()) == Voice.STANDARD ? explain(ctx) : simpler(ctx);
        }
        if (index >= steps.size()) {
            return finishedSteps(ctx);
        }
        int i = Math.max(index, 0);
        int n = steps.size();
        Step s = steps.get(i);
        AccommodationProfile p = ctx.profile();
        String picture = s.picture();
        String example = s.example() == null ? null : exampleText(s.example(), p);
        boolean last = i == n - 1;
        List<String> chips = new ArrayList<>(List.of(last ? CHECK : NEXT, voiceOf(p) == Voice.STANDARD ? PICTURE : ANIMATE, SIMPLER));
        if (!last) chips.add(CHECK);

        StringBuilder t = new StringBuilder();
        switch (voiceOf(p)) {
            case GENTLE -> {
                if (i == 0) {
                    t.append("Let's learn this together, ").append(ctx.studentName())
                            .append(". We'll go slowly, one small idea at a time. 🌱\n\n");
                }
                t.append("**Idea ").append(i + 1).append(" of ").append(n).append("**\n\n").append(s.point());
                if (!p.simpleLanguage() && s.detail() != null) t.append("\n\n").append(s.detail());
                t.append("\n\n🎨 **Picture it:** ").append(picture);
                if (example != null) t.append("\n\n✏️ **For example:** ").append(example);
                t.append("\n\n").append(pick(ctx, List.of(
                        "Does that feel okay? You can ask me to say it another way anytime. 💛",
                        "How does that sound? There's no rush at all.",
                        "Take your time with this one. When you're ready, tap \"Next idea\".")));
            }
            case CALM -> {
                if (i == 0) {
                    t.append("We will learn \"").append(ctx.chapter().getChapterName()).append("\" one idea at a time. There are ")
                            .append(n).append(" ideas.\n\n");
                }
                t.append("**Idea ").append(i + 1).append(" of ").append(n).append(".**\n").append(s.point());
                if (!p.simpleLanguage() && s.detail() != null) t.append("\n\n**What it means:** ").append(s.detail());
                t.append("\n\n**Picture:** ").append(picture);
                if (example != null) t.append("\n\n**Example:** ").append(example);
                t.append("\n\n**What to do next:** ").append(last
                        ? "tap \"Check my understanding\"."
                        : "tap \"Next idea\" to go to idea " + (i + 2) + ", or tap \"Check my understanding\".");
            }
            case LIVELY -> {
                if (i == 0) t.append("Let's go, ").append(ctx.studentName()).append("! ⚡ Bite-sized ideas, one at a time.\n\n");
                t.append("**Idea ").append(i + 1).append("/").append(n).append(":** ").append(s.point())
                        .append("\n\n🎨 ").append(picture);
                if (example != null && p.simpleLanguage()) t.append("\n\n✏️ ").append(example);
                t.append("\n\n").append(pick(ctx, List.of("Got it? Tap Next! 🚀", "Quick check or next idea? You choose! 🎯",
                        "Nice and short. On to the next one? ⚡")));
            }
            case STANDARD -> {
                t.append("**").append(i + 1).append("/").append(n).append(". ").append(s.point()).append("**");
                if (s.detail() != null) t.append("\n").append(s.detail());
                if (example != null) t.append("\n\nExample: ").append(example);
            }
        }
        return TutorReply.atStep(t.toString(), chips, i);
    }

    private TutorReply finishedSteps(TutorContext ctx) {
        String text = switch (voiceOf(ctx.profile())) {
            case GENTLE -> "That was the last idea, " + ctx.studentName() + "! 🎉 You went through the whole chapter. "
                    + "I'm really proud of you.\n\nShall we try a tiny check together, or start practising?";
            case CALM -> "That was the last idea. You have finished all the ideas in this chapter.\n\n"
                    + "**What to do next:** tap \"Check my understanding\" or \"Ask me a question\".";
            case LIVELY -> "That's every idea done! 🎉🏁 Time to test your skills?";
            case STANDARD -> "That covers all the key ideas. Ready to test yourself?";
        };
        return TutorReply.atStep(text, List.of(CHECK, QUESTION, "Start again"), ctx.steps().size() - 1);
    }

    private TutorReply relatedPoint(TutorContext ctx, String point) {
        String picture = Imagery.picture(ctx.chapter(), point);
        int index = ctx.chapter().getKeyPoints().indexOf(point);
        String text = switch (voiceOf(ctx.profile())) {
            case GENTLE -> "Great question! 🌟 Here's the idea:\n\n" + point + "\n\n🎨 **Picture it:** " + picture
                    + "\n\nWould you like an example too?";
            case CALM -> "Here is the idea from this chapter:\n" + point + "\n\n**Picture:** " + picture
                    + "\n\n**What to do next:** tap \"Give me an example\" or ask another question.";
            case LIVELY -> "Good one! ⚡ " + point + "\n\n🎨 " + picture;
            case STANDARD -> point + "\n\n💡 " + picture;
        };
        List<String> chips = List.of(EXAMPLE, SIMPLER, CHECK);
        return index >= 0 ? TutorReply.atStep(text, chips, index) : TutorReply.of(text, chips);
    }

    private TutorReply simpler(TutorContext ctx) {
        String point = currentPoint(ctx);
        String picture = Imagery.picture(ctx.chapter(), point);
        String text = switch (voiceOf(ctx.profile())) {
            case GENTLE -> "Of course! Let's make it really small. Just remember this one thing:\n\n👉 " + point
                    + "\n\n🎨 " + picture + "\n\nThat's all. You're doing great. 💛";
            case CALM -> "Here is the same idea in fewer words.\n\n" + point
                    + "\n\n**What to do next:** tap \"Give me an example\" to see it used.";
            case LIVELY -> "Short version: 👉 " + point + "\n\n🎨 " + picture;
            case STANDARD -> "In one line: " + point + "\n\n💡 " + picture;
        };
        return TutorReply.of(text, supportive(ctx, List.of(EXAMPLE, PICTURE, ctx.step() >= 0 ? NEXT : CHECK)));
    }

    private TutorReply picture(TutorContext ctx, String message) {
        String point = currentPoint(ctx);
        String picture = Imagery.picture(ctx.chapter(), message, point);
        String text = switch (voiceOf(ctx.profile())) {
            case GENTLE -> "Let's imagine it together. Close your eyes for a moment... 🎨\n\n" + picture
                    + "\n\nCan you see it in your mind? That picture shows the idea: **" + point + "**";
            case CALM -> "Here is a picture to think about.\n\n" + picture + "\n\n**This shows:** " + point;
            case LIVELY -> "🎬 Picture this: " + picture + "\n\n👉 " + point;
            case STANDARD -> "Here's an analogy: " + picture;
        };
        return TutorReply.of(text, supportive(ctx, List.of(ctx.step() >= 0 ? NEXT : EXAMPLE, CHECK, SIMPLER)));
    }

    /** Opens the animation of the current idea (special-needs learners only; others get the picture in words). */
    private TutorReply animate(TutorContext ctx) {
        if (voiceOf(ctx.profile()) == Voice.STANDARD || ctx.steps().isEmpty()) {
            return picture(ctx, "");
        }
        int i = Math.min(Math.max(ctx.step(), 0), ctx.steps().size() - 1);
        String text = switch (voiceOf(ctx.profile())) {
            case GENTLE -> "Let's watch it come to life! 🎬 Sit back and watch. You can pause or replay it as many times as you like. 💛";
            case CALM -> "The animation for idea " + (i + 1) + " is opening now. Tap \"Next\" to move through it. Tap \"Close\" when you are done.";
            case LIVELY -> "Lights, camera, action! 🎬🍿";
            case STANDARD -> "";
        };
        return new TutorReply(text, List.of(CHECK, NEXT, SIMPLER), "ANIMATE", i, null, null);
    }

    private TutorReply example(TutorContext ctx) {
        List<Map<String, String>> examples = ctx.chapter().getExamples();
        if (examples.isEmpty()) return explain(ctx);
        Map<String, String> ex = examples.get(Math.floorMod(ctx.turn(), examples.size()));
        String body = "**" + ex.get("title") + "**\n" + exampleText(ex, ctx.profile());
        String text = switch (voiceOf(ctx.profile())) {
            case GENTLE -> "Let's look at one together. ✏️\n\n" + body
                    + "\n\nRead it slowly. Can you spot the idea we just learned?";
            case CALM -> "Here is an example.\n\n" + body + "\n\n**What to do next:** read it, then tap \"Check my understanding\".";
            case LIVELY -> "Example time! ✏️\n\n" + body;
            case STANDARD -> "📘 " + body;
        };
        return TutorReply.of(text, List.of("Another example", CHECK, QUESTION));
    }

    // ------------------------------------------------------------------ quick checks in the chat

    private TutorReply askCheck(TutorContext ctx) {
        Question q = ctx.checkCandidate();
        if (q == null) return startPractice(ctx);
        String text = switch (voiceOf(ctx.profile())) {
            case GENTLE -> "Let's do a tiny check. No pressure, it's just for practice. 😊\n\n**" + q.getPrompt()
                    + "**\n\nTap the answer you think is right.";
            case CALM -> "Quick check. There is 1 question.\n\n**" + q.getPrompt() + "**\n\n**What to do next:** tap one answer.";
            case LIVELY -> "Speed round! ⚡\n\n**" + q.getPrompt() + "**";
            case STANDARD -> "Quick check:\n\n**" + q.getPrompt() + "**";
        };
        return TutorReply.check(text, q.getOptions(), q.getId(), 1);
    }

    /** Handles the student's answer to a quick check, or returns null if the message is about something else. */
    private TutorReply answerCheck(TutorContext ctx, String m, String original) {
        Question q = ctx.pendingCheck();
        boolean isOption = q.getOptions().stream().anyMatch(o -> o.equalsIgnoreCase(original.trim()));
        Voice v = voiceOf(ctx.profile());
        String name = ctx.studentName();

        if (matches(m, "show me the answer", "skip", "i don't know", "i dont know")) {
            return revealCheck(ctx, q, false);
        }
        if (matches(m, "hint", "clue")) {
            String text = (v == Voice.STANDARD ? "Hint: " : "💡 Here's a little clue: ") + q.getHint();
            return TutorReply.check(text, withReveal(q.getOptions()), q.getId(), ctx.checkAttempt());
        }
        if (!isOption && !q.isCorrect(original)) {
            return null;
        }
        if (q.isCorrect(original)) {
            String praise = switch (v) {
                case GENTLE -> pick(ctx, List.of("Yes! You got it, " + name + "! 🌟 I'm so proud of how carefully you thought about that.",
                        "That's right! 🎉 See? You really do understand this.",
                        "Correct! 💛 Well done, " + name + ". Your hard work is paying off."));
                case CALM -> "Correct. Well done.";
                case LIVELY -> pick(ctx, List.of("Boom! 🎉 Nailed it!", "Yes!! ⚡ You're on fire!", "Correct! 🚀 Too easy for you!"));
                case STANDARD -> "Correct.";
            };
            String why = q.getExplanation() == null ? "" : "\n\n" + (v == Voice.CALM ? "**Reason:** " : "") + q.getExplanation();
            return TutorReply.of(praise + why, List.of(ctx.step() >= 0 ? NEXT : "Another check", QUESTION));
        }
        // Wrong: supportive voices get a second chance with a hint before anything is revealed.
        if (v != Voice.STANDARD && ctx.checkAttempt() < 2) {
            List<String> remaining = q.getOptions().stream().filter(o -> !o.equalsIgnoreCase(original.trim())).toList();
            String text = switch (v) {
                case GENTLE -> "That's a really good try, " + name + ". 💛 Mistakes help our brains grow.\n\n"
                        + "💡 Here's a little clue: " + q.getHint() + "\n\nWould you like to try once more?";
                case CALM -> "That answer is not correct. That is okay.\n\n**Hint:** " + q.getHint()
                        + "\n\n**What to do next:** tap one of the answers that are left.";
                default -> "Ooh, close! 😅 Here's a clue: " + q.getHint() + "\n\nTry again!";
            };
            return TutorReply.check(text, withReveal(remaining), q.getId(), ctx.checkAttempt() + 1);
        }
        return revealCheck(ctx, q, true);
    }

    private TutorReply revealCheck(TutorContext ctx, Question q, boolean afterTrying) {
        String answer = q.displayAnswer();
        String why = q.getExplanation() == null ? "" : q.getExplanation();
        String text = switch (voiceOf(ctx.profile())) {
            case GENTLE -> (afterTrying ? "Thank you for trying so hard. 💛 " : "That's okay! ")
                    + "Let's look at it together.\n\nThe answer is **" + answer + "**.\n\n" + why
                    + "\n\n🎨 " + Imagery.picture(ctx.chapter(), q.getPrompt(), why)
                    + "\n\nYou'll remember this next time. 🌱";
            case CALM -> "The correct answer is **" + answer + "**.\n\n**Reason:** " + why
                    + "\n\n**What to do next:** tap \"Another check\" or \"Next idea\".";
            case LIVELY -> "No worries! 🙌 It's **" + answer + "**. " + why + "\n\nNext one's yours! 💪";
            case STANDARD -> "The answer is **" + answer + "**. " + why;
        };
        return TutorReply.of(text, List.of(ctx.step() >= 0 ? NEXT : "Another check", PICTURE, QUESTION));
    }

    /** Adds the "Animate it" chip for learners who get animations. */
    private static List<String> supportive(TutorContext ctx, List<String> chips) {
        if (voiceOf(ctx.profile()) == Voice.STANDARD || ctx.steps().isEmpty()) return chips;
        List<String> withAnimation = new ArrayList<>(List.of(ANIMATE));
        withAnimation.addAll(chips);
        return withAnimation;
    }

    private static List<String> withReveal(List<String> options) {
        List<String> chips = new ArrayList<>(options);
        chips.add(REVEAL);
        return chips;
    }

    // ------------------------------------------------------------------ practice, hints, feelings

    private TutorReply startPractice(TutorContext ctx) {
        String text = switch (voiceOf(ctx.profile())) {
            case GENTLE -> "Lovely! I'm picking a question that's just right for you. 😊 Take all the time you need.";
            case CALM -> "I am choosing your next question now.";
            case LIVELY -> "Let's do this! 🎯 Picking your next challenge...";
            case STANDARD -> "Great! I'm picking your next activity based on how you're doing.";
        };
        return new TutorReply(structured(ctx, text, "Read the question, then choose or type your answer and press Submit."),
                List.of("Give me a hint"), "NEXT_ACTIVITY");
    }

    private TutorReply hint(TutorContext ctx) {
        Question q = ctx.currentQuestion();
        if (q == null) {
            return askCheck(ctx);
        }
        String text = switch (voiceOf(ctx.profile())) {
            case GENTLE -> "Here's a little clue 💡\n\n" + q.getHint() + "\n\nTake your time. There's no hurry. 🌱";
            case CALM -> "**Hint:** " + q.getHint() + "\n\n**What to do next:** read the question again, then use the hint.";
            case LIVELY -> "💡 Clue: " + q.getHint() + " You've got this!";
            case STANDARD -> "💡 Hint: " + q.getHint();
        };
        return TutorReply.of(text, List.of(PICTURE, SIMPLER, "Why is that the answer?"));
    }

    private TutorReply whyAnswer(TutorContext ctx) {
        Question q = ctx.currentQuestion();
        if (q == null) return explain(ctx);
        String text = switch (voiceOf(ctx.profile())) {
            case GENTLE -> "Let's think it through together, step by step. 💛\n\n1️⃣ Read the question slowly.\n2️⃣ "
                    + q.getHint() + "\n3️⃣ Pick the answer that fits.\n\nAfter you submit, I'll explain the full answer.";
            case CALM -> "Follow these steps.\n1. Read the question again.\n2. " + q.getHint()
                    + "\n3. Choose your answer and press Submit.\n\nAfter you submit, you will see the full explanation.";
            case LIVELY -> "Think it through: " + q.getHint() + " ⚡ Then hit Submit and I'll show you why!";
            case STANDARD -> "Let's think it through. " + q.getHint()
                    + "\n\nTry once more. After you submit, I'll show the full explanation.";
        };
        return TutorReply.of(text, List.of(EXAMPLE, SIMPLER));
    }

    private TutorReply encourage(TutorContext ctx, String m) {
        String point = currentPoint(ctx);
        boolean hurt = matches(m, "stupid", "give up", "can't do", "cant do", "sad");
        String text = switch (voiceOf(ctx.profile())) {
            case GENTLE -> "It's completely okay to feel that way, " + ctx.studentName() + ". 💛 "
                    + (hurt ? "You are not stupid at all. Every expert was once a beginner, and you are learning right now. "
                            : "Lots of people find this tricky at first. That just means your brain is growing. ")
                    + "\n\nLet's make it smaller. Just this one idea:\n\n👉 " + point
                    + "\n\n🎨 " + Imagery.picture(ctx.chapter(), point);
            case CALM -> "That is okay. Many students find this hard at first.\n\nWe will do one small step.\n"
                    + "**Step 1:** read this idea: " + point
                    + "\n**Step 2:** tap \"Give me an example\" to see it used.";
            case LIVELY -> "Totally fair! 🙌 Let's shrink it down to one thing:\n\n👉 " + point
                    + "\n\nThat's it. Want a picture or a quick break?";
            case STANDARD -> "No problem, let's break it down. The key idea is: " + point
                    + "\n\n💡 " + Imagery.picture(ctx.chapter(), point);
        };
        return TutorReply.of(text, supportive(ctx, List.of(PICTURE, EXAMPLE, "Take a short break")));
    }

    private TutorReply takeBreak(TutorContext ctx) {
        String text = switch (voiceOf(ctx.profile())) {
            case GENTLE -> "Good idea. Let's take a little break. 🌿\n\nStand up, stretch your arms up high, "
                    + "and take 3 slow, deep breaths. Have a sip of water.\n\nI'll be right here when you're ready. 💛";
            case CALM -> "We will take a break now.\n**Step 1:** stand up and stretch.\n**Step 2:** take 3 slow breaths.\n"
                    + "**Step 3:** when you are ready, tap \"I'm back, let's continue\".";
            case LIVELY -> "Break time! 🕺 Do 10 jumping jacks or a quick stretch, then come back. I'll wait! ⏱️";
            case STANDARD -> "Sure, take a short break. Come back whenever you're ready.";
        };
        return TutorReply.of(text, List.of("I'm back, let's continue"));
    }

    private TutorReply challenge(TutorContext ctx) {
        String text = voiceOf(ctx.profile()) == Voice.CALM
                ? "The level goes up automatically when you answer " + ctx.profile().stepUpStreak()
                    + " questions in a row correctly on your first try."
                : "I like your confidence! 💪 Answer " + ctx.profile().stepUpStreak()
                    + " questions in a row correctly on your first try and I'll move you up to a harder level automatically.";
        return TutorReply.of(text, List.of(QUESTION, CHECK));
    }

    // ------------------------------------------------------------------ small talk

    private TutorReply greet(TutorContext ctx) {
        String chapter = ctx.chapter().getChapterName();
        String text = switch (voiceOf(ctx.profile())) {
            case GENTLE -> "Hi " + ctx.studentName() + "! 👋 I'm so happy to learn \"" + chapter
                    + "\" with you. We can go as slowly as you like. What would you like to do first?";
            case CALM -> "Hello " + ctx.studentName() + ". We are learning \"" + chapter + "\". Choose one option below.";
            case LIVELY -> "Hey " + ctx.studentName() + "! 👋 Ready to crush \"" + chapter + "\"? Pick one! ⚡";
            case STANDARD -> "Hi " + ctx.studentName() + "! I'm your tutor for \"" + chapter + "\". What would you like to do?";
        };
        return TutorReply.of(text, defaultChips(ctx.profile()));
    }

    private TutorReply acknowledge(TutorContext ctx) {
        String text = switch (voiceOf(ctx.profile())) {
            case GENTLE -> pick(ctx, List.of("Wonderful! 🌟 Want to try a tiny check to see how well it stuck?",
                    "I'm so glad! 💛 You're learning really well.", "Great! Tell me whenever you need me. I'm right here."));
            case CALM -> "Okay. Choose what to do next below.";
            case LIVELY -> pick(ctx, List.of("Awesome! 🚀 Quick check?", "Nice! ⚡ Keep the streak going!"));
            case STANDARD -> pick(ctx, List.of("You're welcome! Keep going.", "Happy to help! Shall we try a question?",
                    "Great! Tell me whenever you need me."));
        };
        return TutorReply.of(text, List.of(ctx.step() >= 0 ? NEXT : CHECK, QUESTION));
    }

    private TutorReply notUnderstood(TutorContext ctx) {
        String text = switch (voiceOf(ctx.profile())) {
            case GENTLE -> "Hmm, I'm not sure I understood that, and that's my fault, not yours. 💛 "
                    + "You can tap one of the buttons below, or ask me about any word from the lesson.";
            case CALM -> "I did not understand that message. Please tap one of the options below.";
            case LIVELY -> "Oops, I didn't catch that! 🤔 Tap a button or ask about a word from the lesson.";
            case STANDARD -> "I'm not sure I understood. I can explain the chapter, show an example, "
                    + "give you a hint, or check your understanding. What would you like?";
        };
        return TutorReply.of(text, defaultChips(ctx.profile()));
    }

    // ================================================================== answer feedback & activity intros

    @Override
    public String feedback(TutorContext ctx, Question q, boolean correct, boolean finished, int attemptsLeft) {
        AccommodationProfile p = ctx.profile();
        String name = ctx.studentName();
        Voice v = voiceOf(p);
        if (correct) {
            String praise = switch (v) {
                case GENTLE -> pick(ctx, List.of("Yes, that's right! 🌟 Well done, " + name + ".",
                        "Correct! 💛 You thought about that really carefully.", "You got it! 🎉 I knew you could."));
                case CALM -> "Correct. Well done.";
                case LIVELY -> pick(ctx, List.of("Boom! 🎉 Correct!", "Yes! ⚡ Nailed it!", "Correct! 🚀 Keep it going!"));
                case STANDARD -> pick(ctx, List.of("Correct! Well done.", "Yes, that's right! Great work.",
                        "Excellent - you got it!", "Correct! You're doing really well."));
            };
            return p.simpleLanguage() ? praise : praise + " " + nullSafe(q.getExplanation());
        }
        String tries = attemptsLeft + (attemptsLeft == 1 ? " try" : " tries");
        if (!finished) {
            return switch (v) {
                case GENTLE -> "Good try! 💛 That's not it yet, and that's completely okay. Here's a little clue: "
                        + q.getHint() + " You have " + tries + " left. Take your time.";
                case CALM -> "That answer is not correct. That is okay. Hint: " + q.getHint() + " You have " + tries + " left.";
                case LIVELY -> "Close! 😅 Clue: " + q.getHint() + " " + tries + " left - go!";
                case STANDARD -> "Not quite - that's okay, mistakes help us learn. Here's a hint: " + q.getHint()
                        + " You have " + tries + " left.";
            };
        }
        String explanation = p.simpleLanguage() ? firstSentence(q.getExplanation()) : q.getExplanation();
        return switch (v) {
            case GENTLE -> "Thank you for trying so hard, " + name + ". 💛 The answer is \"" + q.displayAnswer() + "\". "
                    + nullSafe(explanation) + " Every mistake teaches us something. Let's try the next one together. 🌱";
            case CALM -> "The correct answer is \"" + q.displayAnswer() + "\". Reason: " + nullSafe(explanation)
                    + " Next, you will get another question.";
            case LIVELY -> "No worries! 🙌 It's \"" + q.displayAnswer() + "\". " + nullSafe(explanation) + " Next one's yours! 💪";
            case STANDARD -> "Good effort! The correct answer is \"" + q.displayAnswer() + "\". " + nullSafe(explanation)
                    + " Let's keep practising - you'll get the next one.";
        };
    }

    @Override
    public String introduceActivity(TutorContext ctx, TutorAction action) {
        String msg = action.studentMessage();
        Voice v = voiceOf(ctx.profile());
        if (v == Voice.GENTLE) {
            msg = switch (action) {
                case REVIEW_EASIER -> "Let's slow down together and look at the key ideas again. Then an easier question. 🌱";
                case WORKED_EXAMPLE -> "Let's look at an example first, then you try one just like it. 💛";
                case LEVEL_UP -> "You're doing so well! 🌟 Let's try something a little harder. I'm right here if you need me.";
                default -> "Here's your next question. Take all the time you need. 😊";
            };
        } else if (v == Voice.LIVELY) {
            msg = msg + " ⚡";
        }
        if (ctx.profile().structuredFlow()) {
            msg += switch (action) {
                case REVIEW_EASIER -> " Step 1: read the key ideas. Step 2: answer the question.";
                case WORKED_EXAMPLE -> " Step 1: read the example. Step 2: answer the question.";
                default -> " Step 1: read the question. Step 2: choose or type your answer. Step 3: press Submit.";
            };
        }
        return msg;
    }

    // ================================================================== helpers

    /** The idea the conversation is on, or the first key idea. */
    private static String currentPoint(TutorContext ctx) {
        List<Step> steps = ctx.steps();
        if (!steps.isEmpty()) return steps.get(Math.min(Math.max(ctx.step(), 0), steps.size() - 1)).point();
        List<String> points = ctx.chapter().getKeyPoints();
        return points.isEmpty() ? firstSentence(ctx.chapter().getExplanation()) : points.get(Math.floorMod(ctx.turn(), points.size()));
    }

    private static String exampleText(Map<String, String> ex, AccommodationProfile p) {
        String visual = ex.getOrDefault("visual", "");
        String content = ex.getOrDefault("content", "");
        return visual.isBlank() ? content : content + "\n" + (p.visualExamples() ? "👀 " : "") + visual;
    }

    private String structured(TutorContext ctx, String text, String nextStep) {
        return ctx.profile().structuredFlow() ? text + "\n\n**What to do next:** " + nextStep : text;
    }

    private static String bullets(List<String> items) {
        return items.stream().map(s -> "• " + s).collect(Collectors.joining("\n"));
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
            if (k.contains(" ") || k.contains("'") ? message.contains(k) : message.matches("(?s).*\\b" + k + "\\b.*")) return true;
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
