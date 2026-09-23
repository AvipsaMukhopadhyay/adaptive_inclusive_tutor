"""Builds src/main/resources/seed/curriculum.json from the per-grade content files.

Usage:  python3 build_curriculum.py
On startup the backend syncs the JSON into the database, adding any new subjects/chapters.
"""
import json
import os

from grade6 import GRADE6
from grade7 import GRADE7
from grade8 import GRADE8
from grade9 import GRADE9
from grade10 import GRADE10
from grade11 import GRADE11
from grade12 import GRADE12

from more6_7 import MORE6, MORE7
from more8 import MORE8
from more9 import MORE9
from more10 import MORE10
from more11 import MORE11
from more12 import MORE12

GRADES = [GRADE6, GRADE7, GRADE8, GRADE9, GRADE10, GRADE11, GRADE12]

# Extra chapters are appended after each subject's existing chapters, so chapter order
# (and therefore existing students' progress) never changes.
EXTRA = {6: MORE6, 7: MORE7, 8: MORE8, 9: MORE9, 10: MORE10, 11: MORE11, 12: MORE12}


def merge_extra_chapters():
    for grade in GRADES:
        extra = EXTRA[grade["grade"]]
        names = {s["name"] for s in grade["subjects"]}
        assert set(extra) == names, f"Grade {grade['grade']}: extra chapters for {set(extra) ^ names}"
        for subject in grade["subjects"]:
            subject["chapters"].extend(extra[subject["name"]])


def validate(grade):
    names = [s["name"] for s in grade["subjects"]]
    assert len(names) == len(set(names)), f"Grade {grade['grade']}: duplicate subject"
    for subject in grade["subjects"]:
        chapter_names = [c["name"] for c in subject["chapters"]]
        assert len(chapter_names) == len(set(chapter_names)), f"Grade {grade['grade']} / {subject['name']}: duplicate chapter"
        for chapter in subject["chapters"]:
            where = f"Grade {grade['grade']} / {subject['name']} / {chapter['name']}"
            assert chapter["explanation"] and chapter["keyPoints"] and chapter["examples"], f"{where}: missing content"
            levels = {q["difficulty"] for q in chapter["questions"]}
            assert levels == {"EASY", "MEDIUM", "HARD"}, f"{where}: needs all 3 levels"
            for q in chapter["questions"]:
                assert q["answer"].strip() and q["hint"] and q["explanation"], f"{where}: incomplete question {q['prompt']}"
                if q["options"]:
                    assert not any("|" in o for o in q["options"]), f"{where}: '|' is the answer separator: {q['prompt']}"
                    assert len(set(q["options"])) == len(q["options"]), f"{where}: duplicate options {q['prompt']}"
                    accepted = [a.strip() for a in q["answer"].split("|")]
                    assert any(a in q["options"] for a in accepted), f"{where}: answer not in options: {q['prompt']}"


if __name__ == "__main__":
    merge_extra_chapters()
    for g in GRADES:
        validate(g)
    out = os.path.join(os.path.dirname(__file__), "..", "src", "main", "resources", "seed", "curriculum.json")
    with open(out, "w", encoding="utf-8") as f:
        json.dump({"grades": GRADES}, f, ensure_ascii=False, indent=1)
    for g in GRADES:
        subs = ", ".join(f"{s['name']} ({len(s['chapters'])})" for s in g["subjects"])
        print(f"Grade {g['grade']:>2}: {subs}")
    chapters = sum(len(s["chapters"]) for g in GRADES for s in g["subjects"])
    total = sum(len(c["questions"]) for g in GRADES for s in g["subjects"] for c in s["chapters"])
    print(f"Total: {len(GRADES)} grades, {chapters} chapters, {total} questions")
