#!/usr/bin/env python3
"""Erzeugt die gebündelten Programme (Dali’s PPLC, A, B und C) und docs/programs.md.

Quellen: tools/data/dali-pplc.source.json (Dali’s PPLC: Tage, Phasen je Woche, Wechselübung und
Hinweise, D-505), tools/data/programs.source.json (A und B, Dropset-Liste, Metadaten für C),
tools/data/winterprogramm-2026.source.json und tools/data/winterprogramm-2026-uebungen.json (C).
Ziel: src/modules/training/data/programs.v1.json im Format der Beispielvorlagen
(sample-templates.v1.json, erweitert um description, program, slug, note, originalName).

  python3 tools/programs_build.py           schreibt JSON und Dokument neu
  python3 tools/programs_build.py --check   prüft nur (Exit-Code 1 bei Abweichung)
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "tools/data/programs.source.json"
DALI = ROOT / "tools/data/dali-pplc.source.json"
PROGRAM_C = ROOT / "tools/data/winterprogramm-2026.source.json"
MAP = ROOT / "tools/data/winterprogramm-2026-uebungen.json"
CORE = ROOT / "src/modules/exercises/data/core-exercises.v1.json"
OUT = ROOT / "src/modules/training/data/programs.v1.json"
DOC = ROOT / "docs/programs.md"

DAY_NAMES = {
    "Chest and Back": "Brust und Rücken",
    "Shoulders and Arms": "Schultern und Arme",
    "Legs and Abs": "Beine und Bauch",
    "Upper Body": "Oberkörper",
    "Lower Body and Abs": "Unterkörper und Bauch",
}


def load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def parse_target(text: str) -> dict:
    """„10" → Wiederholungen; „00:45 s", „01:00 min", „30:00 min" → Sekunden."""
    if text.isdigit():
        n = int(text)
        return {"repsMin": n, "repsMax": n}
    m = re.fullmatch(r"(\d+):(\d+) (s|min)", text)
    if not m:
        raise ValueError(f"Unbekanntes Ziel: {text}")
    seconds = int(m.group(1)) * 60 + int(m.group(2))
    return {"durationMinSec": seconds, "durationMaxSec": seconds}


def hint_from_addition(addition: str) -> str | None:
    hints = re.findall(r"Hinweis „([^“]+)“", addition)
    return "; ".join(hints) if hints else None


def build_program_c(source: dict, plan: dict, mapping: dict, core: dict) -> dict:
    meta = source["programC"]
    by_name = {e["original"]: e for e in mapping["entries"]}
    keys = {e["key"] for e in core["exercises"]}
    dropsets = {tuple(item) for item in source["dropsets"]["items"]}
    days = []
    weeks: dict[int, list[str]] = {}
    for day in plan["days"]:
        name = f"Tag {day['day']} · {DAY_NAMES[day['name']]}"
        exercises = []
        for position, item in enumerate(day["items"], 1):
            muscle, original, sets, target_text, rest = item
            entry = by_name[original]
            if entry["key"] not in keys:
                raise ValueError(f"Übung fehlt in der Bibliothek: {entry['key']}")
            target = parse_target(target_text)
            # Tag 14: Laufband „3 Sets • 30:00" ist ein Datenfehler der Vorlage; 1 × 30 min (Q-13).
            if original == "Cardio Treadmill" and sets > 1:
                sets = 1
            notes = []
            hint = hint_from_addition(entry["addition"])
            if hint:
                notes.append(hint)
            if entry["status"] == "unklar":
                notes.append("Zuordnung unsicher")
            exercise = {
                "exercise": entry["key"],
                "originalName": original,
                "warmup": 0,
                "working": sets,
                "target": target,
                "restSec": rest,
            }
            if (day["day"], position) in dropsets:
                if sets < 2:
                    raise ValueError(f"Dropset mit nur einem Satz: Tag {day['day']} {original}")
                exercise["working"] = 1
                exercise["drop"] = sets - 1
                exercise["dropTarget"] = target
                notes.insert(0, meta["dropsetNote"])
            if notes:
                exercise["note"] = " · ".join(notes)
            exercises.append(exercise)
        days.append({"name": name, "exercises": exercises})
        weeks.setdefault(day["week"], []).append(name)
    return {
        "key": meta["key"],
        "slug": meta["slug"],
        "program": True,
        "name": meta["name"],
        "description": meta["description"],
        "level": meta["level"],
        "location": meta["location"],
        "daysPerWeek": meta["daysPerWeek"],
        "repeat": meta["repeat"],
        "days": days,
        "weeks": [weeks[w] for w in sorted(weeks)],
    }


def build_dali(plan: dict, core: dict) -> dict:
    """Dali’s PPLC (D-505): je Woche die Tage mit der Satzzahl ihrer Phase (Grundübungen, übrige
    und feste Satzzahl), am Compound-Tag in ungeraden Wochen die erste, in geraden die zweite
    Wechselübung, Hinweise am ersten Tag von Woche 4, jeder leichten Woche und jedes neuen
    Aufbaublocks. Gleiche Tage bekommen denselben Schlüssel; angezeigt wird `label`."""
    keys = {e["key"] for e in core["exercises"]}
    days: dict[str, dict] = {}
    weeks: list[list[str]] = []
    for number, phase_key in enumerate(plan["weeks"], 1):
        phase = plan["phases"][phase_key]
        previous = plan["weeks"][number - 2] if number > 1 else None
        names = []
        for position, day in enumerate(plan["days"]):
            exercises, chosen = [], []
            for entry in day["exercises"]:
                if "alternate" in entry:
                    entry = entry["alternate"][(number + 1) % 2]
                    chosen.append(entry["exercise"])
                if entry["exercise"] not in keys:
                    raise ValueError(f"Übung fehlt in der Bibliothek: {entry['exercise']}")
                if "reps" in entry:
                    target = {"repsMin": entry["reps"][0], "repsMax": entry["reps"][1]}
                else:
                    target = {"durationMinSec": entry["durationSec"][0], "durationMaxSec": entry["durationSec"][1]}
                exercise = {"exercise": entry["exercise"], "originalName": entry["originalName"]}
                if entry.get("note"):
                    exercise["note"] = entry["note"]
                exercise.update({
                    "warmup": entry.get("warmup", 0),
                    "working": phase[entry["class"]],
                    "target": target,
                    "restSec": entry["restSec"],
                })
                exercises.append(exercise)
            note = None
            if position == 0:
                if number == 4:
                    note = plan["notes"]["week4"]
                elif phase_key == "leicht":
                    note = plan["notes"]["leicht"]
                elif phase_key == "neuer_block" and previous == "leicht":
                    note = plan["notes"]["neuer_block"]
            key = "_".join([day["name"].lower(), phase_key, *chosen, *(["hinweis"] if note else [])])
            label = day["name"] + (f" · {phase['label']}" if phase.get("label") else "")
            entry_day = {"name": key, "label": label, "weekday": day["weekday"]}
            if note:
                entry_day["notes"] = note
            entry_day["exercises"] = exercises
            if key in days and days[key] != entry_day:
                raise ValueError(f"Tag {key} mit verschiedenem Inhalt")
            days.setdefault(key, entry_day)
            names.append(key)
        weeks.append(names)
    return {
        "key": plan["key"],
        "slug": plan["slug"],
        "program": True,
        "name": plan["name"],
        "description": plan["description"],
        "level": plan["level"],
        "location": plan["location"],
        "daysPerWeek": plan["daysPerWeek"],
        "repeat": True,
        "repeatFromWeek": plan["repeatFromWeek"],
        "days": list(days.values()),
        "weeks": weeks,
    }


def validate(templates: list[dict], core: dict) -> list[str]:
    errors: list[str] = []
    keys = {e["key"] for e in core["exercises"]}
    seen: set[str] = set()
    for t in templates:
        if t["key"] in seen:
            errors.append(f"doppelter Schlüssel {t['key']}")
        seen.add(t["key"])
        names = {d["name"] for d in t["days"]}
        if len(names) != len(t["days"]):
            errors.append(f"{t['key']}: doppelter Tagesname")
        for week in t["weeks"]:
            for name in week:
                if name not in names:
                    errors.append(f"{t['key']}: unbekannter Tag {name}")
        for d in t["days"]:
            for e in d["exercises"]:
                if e["exercise"] not in keys:
                    errors.append(f"{t['key']}: unbekannte Übung {e['exercise']}")
    return errors


def describe_sets(e: dict) -> str:
    parts = []
    if e["warmup"]:
        parts.append(f"{e['warmup']} Aufwärmen + {e['working']}")
    else:
        parts.append(str(e["working"]))
    if e.get("drop"):
        parts.append(f"+ {e['drop']} Drop")
    return " ".join(parts)


def describe_target(t: dict) -> str:
    if "repsMin" in t:
        return str(t["repsMin"]) if t["repsMin"] == t["repsMax"] else f"{t['repsMin']}–{t['repsMax']}"
    lo, hi = t["durationMinSec"], t["durationMaxSec"]
    fmt = lambda s: f"{s // 60}:{s % 60:02d} min" if s >= 60 else f"{s} s"  # noqa: E731
    return fmt(lo) if lo == hi else f"{fmt(lo)}–{fmt(hi)}"


def render_doc(templates: list[dict], core: dict) -> str:
    names = {e["key"]: e["name"] for e in core["exercises"]}
    out = [
        "# Programme: Dali’s PPLC, A, B und C\n\n",
        "Erzeugt von `tools/programs_build.py` aus `tools/data/dali-pplc.source.json`, `tools/data/programs.source.json` und ",
        "`tools/data/winterprogramm-2026.source.json`; `pnpm check:docs` prüft die Übereinstimmung. Grundlage: ",
        "`evolution-plan.md` Abschnitt 4, Antworten Q-13 bis Q-15; Dali’s PPLC nach dem Plan des Produktinhabers (D-504, D-505). ",
        "Kein Programm gibt Gewichte vor; der Player zeigt den Vorwert (AK-TRN-05). Varianten stehen als Hinweis je Übung.\n\n",
    ]
    for t in templates:
        total = sum(len(w) for w in t["weeks"])
        out.append(f"## {t['name']} (`{t.get('slug', t['key'])}`)\n\n")
        out.append(f"{t['description']}\n\n")
        repeat = "nein"
        if t["repeat"]:
            repeat = f"ja, ab Woche {t['repeatFromWeek']}" if t.get("repeatFromWeek", 1) > 1 else "ja"
        out.append(
            f"Niveau {t['level']} · Ort {t['location']} · {t['daysPerWeek']} Tage pro Woche · "
            f"{len(t['weeks'])} Wochen, {total} Trainingstage · wiederholen: {repeat}\n\n"
        )
        if "source" in t:
            out.append(f"Quelle: {t['source']}\n\n")
        labels = {d["name"]: d.get("label", d["name"]) for d in t["days"]}
        used: dict[str, list[int]] = {}
        out.append("| Woche | Tage |\n|---|---|\n")
        for w, names_in_week in enumerate(t["weeks"], 1):
            out.append(f"| {w} | {', '.join(labels[n] for n in names_in_week)} |\n")
            for n in names_in_week:
                used.setdefault(n, []).append(w)
        out.append("\n")
        weekdays = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"]
        for d in t["days"]:
            if "label" in d:
                in_weeks = used.get(d["name"], [])
                extra = [f"{'Woche' if len(in_weeks) == 1 else 'Wochen'} {', '.join(str(w) for w in in_weeks)}"]
                if d.get("weekday"):
                    extra.append(weekdays[d["weekday"] - 1])
                out.append(f"**{d['label']}** (`{d['name']}`; {'; '.join(extra)})\n\n")
            else:
                out.append(f"**{d['name']}**\n\n")
            if d.get("notes"):
                out.append(f"Hinweis auf „Heute“: {d['notes']}\n\n")
            out.append("| Übung | Sätze | Ziel | Pause | Hinweis |\n|---|---|---|---|---|\n")
            for e in d["exercises"]:
                hint = e.get("note", "")
                if e.get("originalName"):
                    hint = f"{hint} (Englisch: {e['originalName']})" if hint else f"Englisch: {e['originalName']}"
                out.append(
                    f"| {names[e['exercise']]} | {describe_sets(e)} | {describe_target(e['target'])} | "
                    f"{e['restSec']} s | {hint.replace('|', '/')} |\n"
                )
            out.append("\n")
    return "".join(out)


def main() -> int:
    check = "--check" in sys.argv
    source, plan, mapping, core = load(SOURCE), load(PROGRAM_C), load(MAP), load(CORE)
    templates = [
        build_dali(load(DALI), core),
        *source["templates"],
        build_program_c(source, plan, mapping, core),
    ]
    errors = validate(templates, core)
    if errors:
        print(f"{len(errors)} Probleme:")
        for e in errors:
            print("  -", e)
        return 1
    data = json.dumps({"version": 1, "templates": templates}, ensure_ascii=False, indent=2) + "\n"
    doc = render_doc(templates, core)
    if check:
        ok = OUT.exists() and OUT.read_text(encoding="utf-8") == data
        ok = ok and DOC.exists() and DOC.read_text(encoding="utf-8") == doc
        if not ok:
            print("Programme nicht aktuell; python3 tools/programs_build.py ausführen")
            return 1
        print(f"Programme: {len(templates)}, Trainingstage: {sum(sum(len(w) for w in t['weeks']) for t in templates)}")
        return 0
    OUT.write_text(data, encoding="utf-8")
    DOC.write_text(doc, encoding="utf-8")
    print(f"{OUT.relative_to(ROOT)} und {DOC.relative_to(ROOT)} geschrieben")
    return 0


if __name__ == "__main__":
    sys.exit(main())
