package com.aist.tutor.personalization;

import com.aist.tutor.domain.Chapter;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Everyday "picture it" images that make an idea concrete. Each image is matched by keywords in the idea,
 * the chapter name or the student's message. They are deliberately literal and concrete (real objects,
 * real actions) so they also suit learners who find figurative language confusing.
 */
public final class Imagery {

    /**
     * @param text  the picture, in words
     * @param scene id of the animated scene that shows it (null = the generic animation built from the lesson)
     */
    public record Match(String text, String scene) {}

    private record Picture(Pattern keywords, String text, String scene) {}

    private static Picture p(String regex, String text) {
        return p(null, regex, text);
    }

    private static Picture p(String scene, String regex, String text) {
        return new Picture(Pattern.compile("\\b(" + regex + ")(s|es)?\\b", Pattern.CASE_INSENSITIVE), text, scene);
    }

    // Order matters: more specific images come before broader ones.
    private static final List<Picture> PICTURES = List.of(
            // Mathematics
            p("place-value", "place value|digit", "Imagine a street of little houses: the Ones house on the right, then the Tens house, "
                    + "then the Hundreds house, then the Thousands house. A digit is worth more when it lives in a house "
                    + "further to the left. The 5 in the Hundreds house is really worth 500."),
            p("fraction", "fraction|numerator|denominator", "Picture a pizza cut into equal slices. The bottom number tells you how many "
                    + "equal slices the pizza was cut into. The top number tells you how many slices you take. "
                    + "3/8 means: cut into 8 slices, you take 3."),
            p("decimal", "Think of money. 1 rupee is one whole. 50 paise is half of a rupee, which we write as 0.5. "
                    + "The digits after the point are pieces of one whole."),
            p("percent\\w*", "Imagine a grid of 100 small boxes. If you colour 25 of them, you have coloured 25 percent. "
                    + "Percent just means \"out of 100\"."),
            p("integer", "integer|negative", "Imagine a lift in a tall building. Floor 0 is the ground floor. Going up is positive. "
                    + "Going down to the basements is negative: B1 is -1, B2 is -2. Start on floor 7 and go down 3 floors: you are on floor 4."),
            p("ratio|proportion", "Think of making lemonade: 1 cup of juice for every 3 cups of water. That is the ratio 1 : 3. "
                    + "Make a bigger jug with 2 cups of juice, and you need 6 cups of water so it tastes the same."),
            p("equation", "equation|solve for|balance", "Picture a balance scale that is perfectly level. An equation is that level scale. "
                    + "Whatever you add or take away on one side, do the same on the other side, and it stays level."),
            p("equation", "variable|algebra|unknown", "Imagine a closed box with a label \"x\" on it. A number is hidden inside. "
                    + "Algebra is the detective work to find out which number is in the box."),
            p("area-perimeter", "perimeter|boundary", "Imagine an ant walking all the way around the edge of a garden and back to where it started. "
                    + "The distance the ant walks is the perimeter."),
            p("area-perimeter", "area", "Imagine covering a floor with square tiles, with no gaps. The number of tiles you need is the area."),
            p("volume|capacity", "Imagine filling a box with small sugar cubes until it is completely full. "
                    + "The number of cubes that fit inside is its volume."),
            p("angle", "angle|degree", "Picture the two hands of a clock. When they open wider, the angle gets bigger. "
                    + "The corner of a book is a right angle: exactly 90 degrees."),
            p("triangle", "Hold three straws and join their ends to make a closed shape. That shape is a triangle. "
                    + "However you join them, the three corners always add up to 180 degrees, like a straight line."),
            p("circle|radius|diameter", "Imagine tying a string to a pin and walking around it while holding the string tight. "
                    + "Your path is a circle. The string is the radius. Two strings in a straight line across is the diameter."),
            p("probability|chance|likely", "Imagine a bag with 3 red marbles and 1 blue marble. Reach in without looking. "
                    + "Red is more likely: 3 chances out of 4."),
            p("average|arithmetic mean|mean value", "Imagine friends pouring all their sweets into one pile and then sharing them out equally. "
                    + "The number each friend gets is the mean (average)."),
            p("graph|chart|data", "Imagine stacking blocks to show how many students like each fruit. "
                    + "The taller the stack, the more students. That stack picture is a bar graph."),
            p("factor", "multiple|factor|prime", "Imagine arranging 12 chairs in neat rows: 1 row of 12, 2 rows of 6, 3 rows of 4. "
                    + "The row sizes (1, 2, 3, 4, 6, 12) are the factors of 12. A prime number can only make 1 long row."),
            // Science
            p("photosynthesis", "photosynthesis|chlorophyll", "Imagine every leaf is a tiny kitchen. Sunlight is the stove. Water and carbon dioxide "
                    + "are the ingredients. The leaf cooks food (sugar) and lets oxygen float out into the air."),
            p("cell|nucleus|mitochondria|membrane", "Imagine a cell as a tiny city. The nucleus is the city office that keeps the plans (DNA). "
                    + "The mitochondria are power stations. The cell membrane is the city wall with gates that let things in and out."),
            p("atom|electron|proton|neutron", "Picture a tiny solar system. Protons and neutrons sit together in the middle (the nucleus), "
                    + "and electrons move around it in layers called shells."),
            p("circuit", "current|circuit|electric\\w*|battery|batteries", "Imagine water flowing through pipes. The battery is the pump, the wire is the pipe, "
                    + "and the current is the water flowing. Open the switch and it is like a break in the pipe: the flow stops."),
            p("magnet", "Imagine two magnets as two people with the same name tag: same poles push each other away. "
                    + "Opposite poles pull together and click."),
            p("friction", "Imagine sliding in socks on a smooth floor, then on a carpet. The carpet grips your socks more. "
                    + "That grip that slows you down is friction."),
            p("gravity|weight", "Throw a ball up into the air. An invisible pull from the Earth always brings it back down. "
                    + "That pull is gravity."),
            p("force|push|pull|newton", "Imagine pushing a shopping trolley. Your push is a force. Push harder and it speeds up faster. "
                    + "Push it from the front and it slows down."),
            p("speed|velocity|motion", "Imagine two friends running a race. In the same time, the one who covers more distance "
                    + "is faster. Speed is distance divided by time."),
            p("energy", "Imagine a wind-up toy car. Winding it stores energy. When you let go, that stored energy turns into movement."),
            p("reflection|mirror|light", "Imagine throwing a ball at a wall: it bounces back. Light bounces off a mirror in the same way."),
            p("sound|vibrat\\w*", "Drop a stone in a still pond and watch the ripples spread. Sound spreads through air as tiny vibrations, "
                    + "like those ripples."),
            p("water-cycle", "evaporat\\w*|water cycle|condens\\w*", "Imagine a puddle on a sunny day getting smaller and smaller. The water turns into invisible "
                    + "vapour and rises. High up it cools, forms clouds, and falls again as rain."),
            p("digest\\w*|stomach|intestine", "Imagine food going down a long slide through a factory: chewed in the mouth, churned in the stomach, "
                    + "and the useful parts taken into the blood in the small intestine."),
            p("heart|blood|circulat\\w*", "Imagine the heart as a pump in the middle of a delivery network. Blood vessels are the roads, "
                    + "and blood carries oxygen and food to every part of the body."),
            p("food-chain", "food chain|ecosystem|producer|consumer", "Picture a line of who-eats-whom: grass → grasshopper → frog → snake. "
                    + "Energy is passed along the line like a baton in a relay race."),
            p("acid|base|alkali|neutrali\\w*", "Think of lemon juice (sour: an acid) and soap (slippery: a base). "
                    + "Mix an acid with a base and they cancel each other out. That is neutralisation."),
            p("chemical change|chemical reaction|reaction", "Imagine baking a cake. Once the flour, eggs and sugar are baked, you cannot get them back. "
                    + "Something new has formed. That is what happens in a chemical reaction."),
            p("matter", "matter|solid|liquid|gas", "Imagine people in a room. In a solid they stand still, packed close. In a liquid they move around "
                    + "but stay close. In a gas they run all over the room, far apart."),
            p("gene|dna|heredit\\w*|inherit\\w*", "Imagine a recipe book passed from parents to children. Genes are the recipes "
                    + "that decide things like eye colour."),
            // Social Science
            p("vote", "democracy|election|vote", "Imagine your class choosing a class monitor. Everyone gets one vote, and the person with "
                    + "the most votes wins. A democracy works the same way for a whole country."),
            p("constitution|rights|law", "Imagine the rulebook for a big game that everyone agrees to follow. "
                    + "A constitution is the rulebook for a country."),
            p("latitude|longitude|map|globe", "Imagine a giant net of lines wrapped around a ball. Lines going across are latitudes, "
                    + "lines going top to bottom are longitudes. Where two lines cross is an exact address on Earth."),
            p("government|parliament", "Imagine a school council: some students make the rules, some carry them out, and "
                    + "teachers decide if a rule was broken. A government is split into parts in the same way."),
            p("trade|market|economy", "Imagine a weekly village market. Farmers bring vegetables, potters bring pots, and people swap "
                    + "and buy what they need. That is trade."),
            // Economics
            p("demand|supply|price", "Imagine a mango stall. When mangoes are cheap, many people want them (high demand). "
                    + "When few mangoes are left (low supply), the seller can ask a higher price."),
            // English
            p("noun", "Imagine putting name tags on everything in a room: \"chair\", \"Riya\", \"window\". Those names are nouns."),
            p("verb", "Imagine a video of someone: they run, jump, eat, laugh. The doing words are verbs."),
            p("adjective", "Imagine painting a plain picture: a big, red, shiny ball. The words that add the paint are adjectives."),
            p("tense|past tense|future tense", "Imagine a timeline on the floor: yesterday behind you, today under your feet, tomorrow in front. "
                    + "Tense tells you where on the line the action happens."),
            p("poem|poetry|rhyme", "Imagine a song without music. A poem uses rhythm, rhyme and pictures in words to make you feel something."),
            p("story|character|plot", "Imagine a film in your head: the characters are the actors, and the plot is what happens to them, "
                    + "from the beginning to the end."),
            // Computer Science
            p("algorithm", "Think of a recipe for making tea: exact steps, in order. An algorithm is a recipe for a computer."),
            p("loop|iteration", "Imagine running laps around a track until the coach blows the whistle. A loop repeats steps until a condition says stop."),
            p("program|code|python", "Imagine giving very exact instructions to a robot that does exactly what you say, nothing more. That is programming.")
    );

    /** Topics that have an animated scene but no picture in words of their own. Stems use \\w*. */
    private record Topic(String scene, Pattern keywords) {}

    private static Topic topic(String scene, String regex) {
        return new Topic(scene, Pattern.compile("\\b(" + regex + ")(s|es)?\\b", Pattern.CASE_INSENSITIVE));
    }

    private static final List<Topic> TOPICS = List.of(
            // Mathematics
            topic("place-value", "place value|large numbers?|knowing our numbers|numerals?|estimat\\w*"),
            topic("fraction", "fraction|numerator|denominator|decimal"),
            topic("integer", "integer|negative numbers?"),
            topic("factor-tree", "prime factori\\w*|factor tree|hcf|lcm|highest common factor|lowest common multiple|fundamental theorem of arithmetic|composite|euclid\\w*"),
            topic("number-line", "number line|rational|irrational|whole numbers?|natural numbers?"),
            topic("equation", "equation|algebra\\w*|solve|solving"),
            topic("graph-line", "equations? in two variables|graph|coordinate|straight lines?|slope|polynomial|quadratic|parabola|plot\\w*|x-axis|y-axis|zeroe?s of"),
            topic("progression", "progression|sequence|series|nth term|common difference|pattern"),
            topic("probability", "probabilit\\w*|chance|likely|outcome|coin|dice|random"),
            topic("right-triangle", "trigonometr\\w*|sine|cosine|sin|cos|tan|hypotenuse|pythagora\\w*|right.angled|triangle|heron\\w*"),
            topic("angle", "angle|lines and angles|parallel|perpendicular|geometr\\w*|polygon|shape|line segment"),
            topic("area-perimeter", "perimeter|area|mensuration"),
            topic("venn", "set|subset|union|intersection|venn|relation"),
            topic("powers", "exponent|powers? of|square numbers?|square roots?|cube|scientific notation|index form"),
            topic("percent", "percent\\w*|profit|loss|discount|interest|comparing quantities|ratio"),
            topic("arrange", "permutation|combination|arrangement|factorial|number of ways|ways to arrange"),
            topic("area-under-curve", "integra\\w*|antiderivative|area under"),
            topic("tangent", "continu\\w*|differentia\\w*|derivative|limit|rate of change"),
            topic("function-machine", "function|mapping|domain|range|inverse|matri\\w*|determinant"),
            topic("bar-chart", "arithmetic mean|mean value|the mean|median|mode|average|central tendency|data|statistic\\w*|frequency|bar graph"),
            topic("measure", "measure\\w*|units of measurement|metre|centimetre|kilogram|distance|si units?"),
            // Science
            topic("photosynthesis", "photosynth\\w*|chlorophyll|nutrition in plants|autotroph\\w*|stomata"),
            topic("food-chain", "food chain|food web|ecosystem|environment|habitat|decomposer|ozone"),
            topic("water-cycle", "water cycle|water|rain\\w*|cloud|air|atmosphere|weather|climate|wind"),
            topic("matter", "matter|solid|liquid|gas|particle|states of|diffusion|surroundings"),
            topic("earth-sun", "solar system|planet|sun|rotation|revolution(?=\\s+(of|is|around|takes))|revolv\\w*|day and night|season|orbit|motions of the earth"),
            topic("gravity", "gravit\\w*|weight|free fall|falling"),
            topic("atom", "atom\\w*|electron|proton|neutron|molecule|valency|bond\\w*|ion|mole|isotope|chemical formula|basic concepts of chemistry"),
            topic("motion-force", "force|motion|newton|inertia|momentum|accelerat\\w*|velocity|speed|pressure|push|pull|work done"),
            topic("energy", "energy|power plant|fuel|renewable|solar|kinetic energy|potential energy|work, energy|sources of energy"),
            topic("light-ray", "light|reflect\\w*|refract\\w*|mirror|lens|ray|optic\\w*|eye|spectrum|rainbow|photo\\w*|radiation|shadow|dual nature"),
            topic("sound-wave", "sound|vibrat\\w*|echo|pitch|loud\\w*|wave"),
            topic("magnet", "magnet\\w*|electromagnet\\w*|induction|compass|pole"),
            topic("circuit", "electric\\w*|circuit|current|voltage|resistance|battery|batteries|charge|ohm"),
            topic("breathing", "breath\\w*|respirat\\w*|lung|oxygen|blood|heart|circulat\\w*|life process\\w*|excret\\w*|kidney|digest\\w*"),
            topic("cell-division", "cell|tissue|mitosis|meiosis|cell division|reproduc\\w*|microorganism|organism|bacteri\\w*|fung\\w*"),
            topic("heredity", "heredit\\w*|inherit\\w*|gene|dna|chromosome|trait|evolution|variation|biotechnolog\\w*|mendel"),
            topic("reaction", "reaction|acid|alkali\\w*|salt|indicator|neutrali\\w*|metal|non-metal|corrosion|rust|carbon compound|solute|solvent|dissolv\\w*|electrochem\\w*|kinetics|combust\\w*|carbon and its compounds"),
            topic("heat", "heat|temperature|thermo\\w*|conduct\\w*|convect\\w*|insulat\\w*|melting|boiling"),
            topic("separation", "is matter around us pure|separat\\w*|mixture|filtrat\\w*|pure|impure|sieving|decant\\w*"),
            topic("nutrients", "biomolecule|food|nutri\\w*|diet|vitamin|protein|carbohydrate|fat|components of food"),
            topic("germs", "germ|disease|ill|infect\\w*|immun\\w*|vaccin\\w*|health|microbe|pathogen|fall ill"),
            topic("periodic", "classification of elements|periodic\\w*|elements?|mendeleev|d-block|f-block|d- and f-block"),
            topic("classify", "classif\\w*|kingdom|species|diversity in living|living world|taxonom\\w*|vertebrate"),
            topic("reflex", "nerv\\w*|brain|reflex|hormone|coordination|neuron|spinal"),
            topic("plant-growth", "crop|agricultur\\w*|farm\\w*|irrigation|harvest\\w*|soil|resource|forest|conserv\\w*|food resource|manure|fertili\\w*"),
            // Social Science
            topic("vote", "democra\\w*|election|vote|voting|electoral|parliament"),
            topic("globe", "globe|latitude|longitude|map|size and location|equator|meridian|tropic"),
            topic("timeline", "history|revolution|nationalism|freedom struggle|empire|king|ancient|early humans|medieval|colonial|independence|hunting"),
            topic("society", "diversit\\w*|equality|constitution|judiciary|court|power sharing|rights|federal\\w*|community|gender|caste|government"),
            topic("earth-layers", "inside our earth|crust|mantle|core|volcano|earthquake|rock|plate"),
            topic("landforms", "physical features|mountain|plain|plateau|desert|coast|island|river|himalaya\\w*|landform|relief"),
            topic("factory", "industr\\w*|sector|manufactur\\w*|factory|factories|primary|secondary|tertiary|raw material|employment"),
            // English
            topic("figurative", "figures? of speech|simile|metaphor|personification|idiom|phrase|vocabulary|word meaning|context"),
            topic("letter", "letter writing|letter|writing|paragraph|notice|report|speech|debate|invitation|application|essay|format"),
            topic("sentence-builder", "noun|pronoun|verb|adjective|adverb|article|preposition|conjunction|tense|voice|sentence|clause|determiner|modal|gerund|infinitive|subject|question tag|reported|phrasal|prefix|suffix|punctuation|grammar|editing|errors|conditional"),
            // Economics
            topic("supply-demand", "demand|supply|equilibrium|market|price|elasticit\\w*"),
            topic("money-flow", "money|bank\\w*|credit|loan|income|budget|tax|gdp|national income|economy|economics|macroeconomics|exchange rate|balance of payments|saving|deposit"),
            // Computer Science
            topic("database", "database|sql|query|queries|record|dbms|file handling|file"),
            topic("network", "network|internet|protocol|router|ip address|web|email|topology|lan|wan"),
            topic("stack", "stack|list|dictionar\\w*|tuple|array|queue|push|pop|index"),
            topic("binary", "binary|bit|byte|computer basics|hardware|software|memory|cpu|storage"),
            topic("code-robot", "python|program\\w*|code|loop|condition\\w*|if statement|statement|string|algorithm|syntax|print|operator")
    );

    /** Which scenes suit which subjects, so a stray word (like "salt" in a history lesson) does not pick a science scene. */
    private static final Set<String> MATH = Set.of("place-value", "fraction", "integer", "factor", "factor-tree", "number-line",
            "equation", "graph-line", "progression", "probability", "right-triangle", "angle", "area-perimeter", "venn", "powers",
            "percent", "arrange", "area-under-curve", "tangent", "function-machine", "bar-chart", "measure");
    private static final Set<String> SCIENCE = Set.of("photosynthesis", "food-chain", "water-cycle", "matter", "earth-sun", "gravity",
            "atom", "motion-force", "energy", "light-ray", "sound-wave", "magnet", "circuit", "breathing", "cell-division", "heredity",
            "reaction", "heat", "separation", "nutrients", "germs", "periodic", "classify", "reflex", "plant-growth", "measure", "graph-line");
    private static final Set<String> SOCIAL = Set.of("vote", "globe", "timeline", "society", "earth-layers", "landforms", "factory",
            "money-flow", "plant-growth", "water-cycle", "earth-sun", "food-chain", "energy");
    private static final Map<String, Set<String>> SUBJECT_GROUPS = Map.of(
            "Mathematics", MATH, "Science", SCIENCE, "Physics", SCIENCE, "Chemistry", SCIENCE, "Biology", SCIENCE,
            "Social Science", SOCIAL, "English", Set.of("sentence-builder", "letter", "figurative"),
            "Economics", Set.of("supply-demand", "money-flow", "factory", "bar-chart", "percent"),
            "Computer Science", Set.of("code-robot", "stack", "network", "binary", "database", "function-machine"));

    /** When nothing in the idea or chapter name matches. */
    private static final Map<String, String> SUBJECT_SCENES = Map.of(
            "Mathematics", "number-line", "Science", "matter", "Physics", "motion-force", "Chemistry", "atom",
            "Biology", "cell-division", "English", "sentence-builder", "Social Science", "timeline",
            "Computer Science", "code-robot", "Economics", "money-flow");

    private Imagery() {
    }

    /** The best picture for this text, or one built from the chapter's own visual example. Never null. */
    public static String picture(Chapter chapter, String... texts) {
        return match(chapter, texts).text();
    }

    /**
     * The best picture and its animated scene. The scene comes from the chapter name (which says what the whole
     * chapter is about), then the idea itself, then the subject, so every lesson step has one.
     */
    public static Match match(Chapter chapter, String... texts) {
        return new Match(pictureFor(chapter, texts), sceneFor(chapter, texts));
    }

    static String sceneFor(Chapter chapter, String... texts) {
        String subject = chapter.getSubject() == null ? null : chapter.getSubject().getName();
        Set<String> allowed = subject == null ? null : SUBJECT_GROUPS.get(subject);
        String scene = earliestScene(chapter.getChapterName(), allowed);
        if (scene != null) return scene;
        for (String text : texts) {
            scene = earliestScene(text, allowed);
            if (scene != null) return scene;
        }
        return subject == null ? "number-line" : SUBJECT_SCENES.getOrDefault(subject, "number-line");
    }

    /** The allowed scene whose keyword appears earliest in the text (the longer keyword on a tie), or null. */
    private static String earliestScene(String text, Set<String> allowed) {
        if (text == null) return null;
        List<Map.Entry<String, Pattern>> candidates = new ArrayList<>();
        PICTURES.stream().filter(p -> p.scene() != null).forEach(p -> candidates.add(Map.entry(p.scene(), p.keywords())));
        TOPICS.forEach(t -> candidates.add(Map.entry(t.scene(), t.keywords())));
        String best = null;
        int bestAt = Integer.MAX_VALUE, bestLen = 0;
        for (Map.Entry<String, Pattern> c : candidates) {
            if (allowed != null && !allowed.contains(c.getKey())) continue;
            Matcher m = c.getValue().matcher(text);
            if (m.find() && (m.start() < bestAt || (m.start() == bestAt && m.end() - m.start() > bestLen))) {
                best = c.getKey();
                bestAt = m.start();
                bestLen = m.end() - m.start();
            }
        }
        return best;
    }

    private static String pictureFor(Chapter chapter, String... texts) {
        for (String text : texts) {
            if (text == null) continue;
            // The picture whose keyword appears earliest in the text is the one the text is mainly about.
            Picture best = null;
            int bestAt = Integer.MAX_VALUE;
            for (Picture pic : PICTURES) {
                Matcher m = pic.keywords().matcher(text);
                if (m.find() && m.start() < bestAt) {
                    best = pic;
                    bestAt = m.start();
                }
            }
            if (best != null) return best.text();
        }
        for (Picture pic : PICTURES) {
            if (pic.keywords().matcher(chapter.getChapterName()).find()) return pic.text();
        }
        for (Map<String, String> ex : chapter.getExamples()) {
            String visual = ex.getOrDefault("visual", "");
            if (!visual.isBlank()) {
                return "Picture this in your mind: " + visual + "\n(" + ex.get("content") + ")";
            }
        }
        if (!chapter.getExamples().isEmpty()) {
            return "Imagine you are watching this happen in front of you: " + chapter.getExamples().get(0).get("content");
        }
        return "Imagine explaining \"" + chapter.getChapterName().toLowerCase(Locale.ROOT)
                + "\" to a friend using things you can see around you.";
    }
}
