#!/usr/bin/env python3
"""Erzeugt die gebündelten Beispielvorlagen aus docs/sample-templates.md Abschnitt 3.

Quelle der Übungen, Sätze, Wiederholungen und Pausen sind die Tabellen im Dokument; Name,
Niveau, Ort und Wochenablauf stehen unten in TEMPLATES. Übungsnamen werden über die
Basisbibliothek (core-exercises.v1.json) in Schlüssel übersetzt.

  python3 tools/sample_templates_from_md.py           schreibt die JSON-Datei neu
  python3 tools/sample_templates_from_md.py --check   prüft nur (Exit-Code 1 bei Abweichung)
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOC = ROOT / "docs/sample-templates.md"
EXERCISES = ROOT / "src/modules/exercises/data/core-exercises.v1.json"
OUT = ROOT / "src/modules/training/data/sample-templates.v1.json"

# Abschnitt im Dokument → Metadaten. Tage stehen in der Reihenfolge der Tabellen.
TEMPLATES = [
    {
        "section": "3.1",
        "key": "full_body_ab",
        "name": "Ganzkörper A/B",
        "level": "beginner",
        "location": "gym",
        "daysPerWeek": "3",
        "weeks": [["Tag A", "Tag B", "Tag A"], ["Tag B", "Tag A", "Tag B"]],
    },
    {
        "section": "3.2",
        "key": "upper_lower",
        "name": "Oberkörper/Unterkörper",
        "level": "intermediate",
        "location": "gym",
        "daysPerWeek": "4",
        "weeks": [["Oberkörper 1", "Unterkörper 1", "Oberkörper 2", "Unterkörper 2"]],
    },
    {
        "section": "3.3",
        "key": "push_pull_legs",
        "name": "Push/Pull/Beine",
        "level": "advanced",
        "location": "gym",
        "daysPerWeek": "3–6",
        "weeks": [["Push", "Pull", "Beine"]],
    },
    {
        "section": "3.4",
        "key": "home_dumbbells",
        "name": "Zuhause mit Kurzhanteln",
        "level": "beginner",
        "location": "home",
        "daysPerWeek": "3",
        "weeks": [["Tag 1", "Tag 2", "Tag 3"]],
    },
]

RANGE = r"(\d+)(?:–(\d+))?"


def parse_range(text: str) -> dict:
    """„6–8" → Wiederholungen, „30–45 s" → Dauer in Sekunden."""
    m = re.fullmatch(RANGE + r"( s)?", text.strip())
    if not m:
        raise ValueError(f"Unbekannter Bereich: {text!r}")
    low = int(m.group(1))
    high = int(m.group(2) or low)
    if m.group(3):
        return {"durationMinSec": low, "durationMaxSec": high}
    return {"repsMin": low, "repsMax": high}


def parse_row(cells: list[str], names: dict[str, str]) -> dict:
    name, sets, reps, rest = cells
    if name not in names:
        raise ValueError(f"Übung nicht in der Basisbibliothek: {name}")
    m = re.fullmatch(r"(?:(\d) Aufwärmen \+ )?(\d)(?: \+ (\d) Drop-Satz)?(?: je Seite)?", sets)
    if not m:
        raise ValueError(f"Unbekanntes Satzschema: {sets!r}")
    reps_parts = reps.split(", Drop ")
    entry = {
        "exercise": names[name],
        "warmup": int(m.group(1) or 0),
        "working": int(m.group(2)),
        "target": parse_range(reps_parts[0]),
        "restSec": int(re.fullmatch(r"(\d+) s", rest).group(1)),
    }
    if m.group(3):
        entry["drop"] = int(m.group(3))
        entry["dropTarget"] = parse_range(reps_parts[1])
    return entry


def build() -> dict:
    text = DOC.read_text(encoding="utf-8")
    exercises = json.loads(EXERCISES.read_text(encoding="utf-8"))["exercises"]
    names = {ex["name"]: ex["key"] for ex in exercises}
    sections = re.split(r"^### ", text.split("## 3. Vorlagen", 1)[1].split("\n## 4.", 1)[0], flags=re.M)
    by_number = {s.split(" ", 1)[0]: s for s in sections if s.strip()}
    templates = []
    for meta in TEMPLATES:
        section = by_number[meta["section"]]
        days = []
        for block in re.split(r"^\*\*(.+)\*\*$", section, flags=re.M)[1:]:
            if not days or "exercises" in days[-1]:
                days.append({"name": block.strip()})
                continue
            rows = [
                [c.strip() for c in line.strip().strip("|").split("|")]
                for line in block.splitlines()
                if line.startswith("|")
            ]
            days[-1]["exercises"] = [parse_row(r, names) for r in rows[2:]]
        day_names = [d["name"] for d in days]
        for week in meta["weeks"]:
            for day in week:
                if day not in day_names:
                    raise ValueError(f"{meta['key']}: Tag {day} fehlt im Dokument")
        templates.append(
            {k: meta[k] for k in ("key", "name", "level", "location", "daysPerWeek")}
            | {"repeat": True, "days": days, "weeks": meta["weeks"]}
        )
    return {"version": 1, "templates": templates}


def main() -> int:
    try:
        built = build()
    except ValueError as error:
        print("  -", error)
        return 1
    if "--check" in sys.argv:
        # Inhaltlich vergleichen; die Formatierung der Datei übernimmt Prettier.
        if not OUT.exists() or json.loads(OUT.read_text(encoding="utf-8")) != built:
            print(
                "  - sample-templates.v1.json weicht von docs/sample-templates.md ab; "
                "python3 tools/sample_templates_from_md.py ausführen"
            )
            return 1
    else:
        OUT.parent.mkdir(parents=True, exist_ok=True)
        OUT.write_text(json.dumps(built, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    count = len(built["templates"])
    print(f"Beispielvorlagen: {count}, aus docs/sample-templates.md")
    return 0


if __name__ == "__main__":
    sys.exit(main())
