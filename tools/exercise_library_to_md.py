#!/usr/bin/env python3
"""Erzeugt Abschnitt 5 von docs/exercise-library.md aus den gebündelten Basisübungen.

Quelle ist src/modules/exercises/data/core-exercises.v1.json. Zusätzlich wird geprüft,
dass jede Übung der Beispielvorlagen (docs/sample-templates.md Abschnitt 3) enthalten ist.

  python3 tools/exercise_library_to_md.py           schreibt den Abschnitt neu
  python3 tools/exercise_library_to_md.py --check   prüft nur (Exit-Code 1 bei Abweichung)
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "src/modules/exercises/data/core-exercises.v1.json"
DOC = ROOT / "docs/exercise-library.md"
TEMPLATES = ROOT / "docs/sample-templates.md"
MARKER = "## 5. Liste\n"

GROUPS = {
    "chest": "Brust",
    "back": "Rücken",
    "shoulders": "Schultern",
    "biceps_forearms": "Bizeps und Unterarme",
    "triceps": "Trizeps",
    "core": "Rumpf",
    "glutes": "Gesäß",
    "quads": "Oberschenkel vorne",
    "hamstrings": "Oberschenkel hinten",
    "lower_leg": "Waden, Adduktoren, Abduktoren",
    "conditioning": "Ganzkörper und Kondition",
}
MUSCLES = {
    "chest": "Brust", "lats": "Latissimus", "upper_back": "Oberer Rücken", "traps": "Trapez",
    "lower_back": "Unterer Rücken", "front_delts": "Vordere Schulter",
    "side_delts": "Seitliche Schulter", "rear_delts": "Hintere Schulter", "biceps": "Bizeps",
    "triceps": "Trizeps", "forearms": "Unterarme", "abs": "Bauch",
    "obliques": "Seitliche Bauchmuskeln", "glutes": "Gesäß", "quads": "Oberschenkel vorne",
    "hamstrings": "Oberschenkel hinten", "adductors": "Adduktoren", "abductors": "Abduktoren",
    "calves": "Waden", "full_body": "Ganzkörper",
}
EQUIPMENT = {
    "barbell": "Langhantel", "ez_bar": "SZ-Stange", "dumbbell": "Kurzhantel",
    "kettlebell": "Kettlebell", "cable": "Kabelzug", "machine": "Maschine",
    "smith": "Multipresse", "bench": "Bank", "pullup_bar": "Klimmzugstange",
    "dip_station": "Dipstation", "band": "Widerstandsband", "bodyweight": "Körpergewicht",
    "cardio_machine": "Cardiogerät", "other": "Sonstiges",
}
MODES = {
    "weight_reps": "Gewicht × Wdh.",
    "reps": "Wdh.",
    "time": "Dauer",
    "weight_time": "Gewicht × Dauer",
    "time_distance": "Dauer und Distanz",
    "assisted_reps": "Entlastung × Wdh.",
}
CATEGORIES = {"core": "Rumpf", "cardio": "Kondition", "mobility": "Beweglichkeit"}


def template_names() -> set[str]:
    text = TEMPLATES.read_text(encoding="utf-8")
    section = text.split("## 3. Vorlagen", 1)[1].split("## 4.", 1)[0]
    names = set()
    for line in section.splitlines():
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if line.startswith("|") and cells[0] not in ("Übung", "") and not cells[0].startswith("---"):
            names.add(cells[0])
    return names


def labels(mapping: dict[str, str], keys: list[str]) -> str:
    return ", ".join(mapping[k] for k in keys) or "–"


def render(exercises: list[dict], in_templates: set[str]) -> str:
    lines = [MARKER]
    group = None
    for number, ex in enumerate(exercises, 1):
        if ex["group"] != group:
            group = ex["group"]
            lines += [
                f"\n### {GROUPS[group]}\n",
                "| Nr. | Name | Alias-Namen (Suche) | Hauptmuskeln | Nebenmuskeln | Gerät | Erfassung | Je Seite | Vorlage | Schlüssel |",
                "|---|---|---|---|---|---|---|---|---|---|",
            ]
        mode = MODES[ex["trackingMode"]]
        if ex.get("distanceUnit"):
            mode += f" ({ex['distanceUnit']})"
        if ex["category"] != "strength":
            mode += f" · {CATEGORIES[ex['category']]}"
        cells = [
            str(number),
            ex["name"],
            ", ".join(ex["aliases"]),
            labels(MUSCLES, ex["primaryMuscles"]),
            labels(MUSCLES, ex["secondaryMuscles"]),
            labels(EQUIPMENT, ex["equipment"]),
            mode,
            "ja" if ex.get("isUnilateral") else "",
            "✓" if ex["name"] in in_templates else "",
            f"`{ex['key']}`",
        ]
        lines.append("| " + " | ".join(cells) + " |")
    return "\n".join(lines) + "\n"


def main() -> int:
    exercises = json.loads(DATA.read_text(encoding="utf-8"))["exercises"]
    names = {ex["name"] for ex in exercises}
    errors = [f"Übung aus den Vorlagen fehlt: {n}" for n in sorted(template_names() - names)]
    doc = DOC.read_text(encoding="utf-8")
    head = doc.split(MARKER, 1)[0]
    expected = head + render(exercises, template_names())
    if "--check" in sys.argv:
        if doc != expected:
            errors.append(
                "docs/exercise-library.md Abschnitt 5 weicht von den Daten ab; "
                "python3 tools/exercise_library_to_md.py ausführen"
            )
    elif not errors:
        DOC.write_text(expected, encoding="utf-8")
    for e in errors:
        print("  -", e)
    if errors:
        return 1
    print(f"Basisübungen: {len(exercises)}, davon in Vorlagen: {len(names & template_names())}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
