#!/usr/bin/env python3
"""Erzeugt die Abschnitte 5 und 6 von docs/winterprogramm-2026.md (Programm C) aus den Daten.

Quellen: tools/data/winterprogramm-2026.source.json (Programm nach der Vorlage) und
tools/data/winterprogramm-2026-uebungen.json (Abgleich mit der Basisbibliothek). Geprüft wird,
dass jede Übung des Programms im Abgleich steht, dass vorhandene Schlüssel in
core-exercises.v1.json existieren und neue Schlüssel nicht mit vorhandenen kollidieren.

  python3 tools/winterprogramm_to_md.py           schreibt die Abschnitte neu
  python3 tools/winterprogramm_to_md.py --check   prüft nur (Exit-Code 1 bei Abweichung)
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "tools/data/winterprogramm-2026.source.json"
MAP = ROOT / "tools/data/winterprogramm-2026-uebungen.json"
CORE = ROOT / "src/modules/exercises/data/core-exercises.v1.json"
DOC = ROOT / "docs/winterprogramm-2026.md"
MARKER = "## 5. Übungsabgleich\n"

STATUS = {
    "vorhanden": "Vorhanden",
    "variante": "Variante",
    "neu": "Neu",
    "unklar": "Unklar",
}
DAY_NAMES = {
    "Chest and Back": "Brust und Rücken",
    "Shoulders and Arms": "Schultern und Arme",
    "Legs and Abs": "Beine und Bauch",
    "Upper Body": "Oberkörper",
    "Lower Body and Abs": "Unterkörper und Bauch",
}
MUSCLES = {
    "Chest": "Brust", "Lats": "Latissimus", "Shoulders": "Schultern", "Biceps": "Bizeps",
    "Triceps": "Trizeps", "Quads": "Oberschenkel vorne", "Hamstrings": "Oberschenkel hinten",
    "Glutes": "Gesäß", "Calves": "Waden", "Abs": "Bauch", "Obliques": "Bauch seitlich",
    "Cardio": "Kondition",
}


def load() -> tuple[dict, dict, dict[str, dict]]:
    source = json.loads(SOURCE.read_text(encoding="utf-8"))
    mapping = json.loads(MAP.read_text(encoding="utf-8"))
    core = {e["key"]: e for e in json.loads(CORE.read_text(encoding="utf-8"))["exercises"]}
    return source, mapping, core


def validate(source: dict, mapping: dict, core: dict[str, dict]) -> list[str]:
    errors: list[str] = []
    by_name = {e["original"]: e for e in mapping["entries"]}
    if len(by_name) != len(mapping["entries"]):
        errors.append("Abgleich: doppelter Name der Vorlage")
    used: set[str] = set()
    for day in source["days"]:
        if len(day["items"]) != day["exercises"]:
            errors.append(f"Tag {day['day']}: {len(day['items'])} Übungen, angegeben {day['exercises']}")
        total = sum(item[2] for item in day["items"])
        if total != day["sets"]:
            errors.append(f"Tag {day['day']}: {total} Sätze, angegeben {day['sets']}")
        for item in day["items"]:
            used.add(item[1])
            if item[1] not in by_name:
                errors.append(f"Tag {day['day']}: „{item[1]}“ fehlt im Abgleich")
    for entry in mapping["entries"]:
        if entry["original"] not in used:
            errors.append(f"Abgleich: „{entry['original']}“ kommt im Programm nicht vor")
        if entry["status"] not in STATUS:
            errors.append(f"Abgleich: unbekannter Status {entry['status']}")
        exists = entry["key"] in core
        if entry["status"] == "neu" and exists:
            errors.append(f"Abgleich: neuer Schlüssel {entry['key']} existiert schon")
        if entry["status"] != "neu" and not exists:
            errors.append(f"Abgleich: Schlüssel {entry['key']} fehlt in der Bibliothek")
        if exists and core[entry["key"]]["name"] != entry["de"]:
            errors.append(f"Abgleich: Name „{entry['de']}“ ≠ „{core[entry['key']]['name']}“ ({entry['key']})")
    if len(source["days"]) != source["program"]["sessions"]:
        errors.append("Anzahl der Tage passt nicht zu program.sessions")
    return errors


def esc(text: str) -> str:
    return text.replace("|", "\\|")


def render(source: dict, mapping: dict, core: dict[str, dict]) -> str:
    out: list[str] = [MARKER, "\n"]
    entries = mapping["entries"]
    counts = {s: sum(1 for e in entries if e["status"] == s) for s in STATUS}
    new_keys = sorted({e["key"] for e in entries if e["status"] == "neu"})
    out.append(
        f"{len(entries)} Übungsnamen der Vorlage: {counts['vorhanden']} vorhanden, {counts['variante']} Varianten "
        f"vorhandener Übungen, {counts['neu']} fehlen ({len(new_keys)} neue Übungen vorgeschlagen), "
        f"{counts['unklar']} unklar. Erzeugt aus `tools/data/winterprogramm-2026-uebungen.json`; "
        "Status und Konfidenz beziehen sich auf die Zuordnung, nicht auf die Satzwerte. "
        "Varianten werden als Ausführungshinweis im Programm und als Alias in der Bibliothek geführt, "
        "nicht als eigene Übung (`exercise-library.md` Abschnitt 2). Quelle je Übung: erstes Vorkommen im Programm.\n\n"
    )
    first: dict[str, tuple[int, int, str]] = {}
    for day in source["days"]:
        for item in day["items"]:
            first.setdefault(item[1], (day["week"], day["day"], day["source"]))
    out.append("| Name in der Vorlage | Deutscher Name | Schlüssel | Status | Ergänzung | Quelle | Konfidenz |\n")
    out.append("|---|---|---|---|---|---|---|\n")
    for e in sorted(entries, key=lambda x: (STATUS[x["status"]] != "Neu", x["de"], x["original"])):
        week, day, src = first[e["original"]]
        key = f"`{e['key']}`" if e["status"] != "neu" else f"`{e['key']}` (Vorschlag)"
        out.append(
            f"| {esc(e['original'])} | {esc(e['de'])} | {key} | {STATUS[e['status']]} | "
            f"{esc(e['addition']) or '–'} | W{week} T{day}, {esc(src)} | {e['confidence']} |\n"
        )
    out.append("\n## 6. Trainingstage\n\n")
    out.append(
        "Je Tag: Muskelgruppe und Name wie in der Vorlage angezeigt, Sätze × Wiederholungen oder Dauer, "
        "Pause nach dem Satz in Sekunden. „Quelle“ nennt Teil und Zeitstempel der Aufnahme, an dem "
        "die Werte gelesen wurden (T1 bis T8; „player“ ist das Player-Video). Ruhetage je Woche aus "
        "`restDaysByWeek`.\n\n"
    )
    rest = source["restDaysByWeek"]
    for week in range(1, source["program"]["weeks"] + 1):
        days = [d for d in source["days"] if d["week"] == week]
        rest_days = ", ".join(str(d) for d in rest[str(week)])
        out.append(f"### Woche {week}\n\n")
        out.append(f"Ruhetage: Tag {rest_days}. Trainingstage: {', '.join(str(d['day']) for d in days)}.\n\n")
        for d in days:
            name_de = DAY_NAMES.get(d["name"], d["name"])
            out.append(
                f"**Tag {d['day']} · {esc(d['name'])} ({name_de})** · {d['exercises']} Übungen, "
                f"{d['sets']} Sätze · Quelle: {esc(d['source'])}\n\n"
            )
            out.append("| # | Muskel | Übung (Vorlage) | Sätze | Wdh. / Dauer | Pause s |\n")
            out.append("|---|---|---|---|---|---|\n")
            for i, item in enumerate(d["items"], 1):
                muscle = MUSCLES.get(item[0], item[0])
                out.append(f"| {i} | {muscle} | {esc(item[1])} | {item[2]} | {esc(item[3])} | {item[4]} |\n")
            out.append("\n")
    return "".join(out)


def main() -> int:
    check = "--check" in sys.argv
    source, mapping, core = load()
    errors = validate(source, mapping, core)
    if errors:
        print(f"{len(errors)} Probleme:")
        for e in errors:
            print("  -", e)
        return 1
    text = DOC.read_text(encoding="utf-8")
    if MARKER not in text:
        print(f"Markierung „{MARKER.strip()}“ fehlt in {DOC.relative_to(ROOT)}")
        return 1
    head = text.split(MARKER, 1)[0]
    new = head + render(source, mapping, core)
    if check:
        if new != text:
            print(f"{DOC.relative_to(ROOT)} ist nicht aktuell; python3 tools/winterprogramm_to_md.py ausführen")
            return 1
        print(f"Programm C: {len(source['days'])} Tage, {len(mapping['entries'])} Übungsnamen abgeglichen")
        return 0
    DOC.write_text(new, encoding="utf-8")
    print(f"{DOC.relative_to(ROOT)} geschrieben")
    return 0


if __name__ == "__main__":
    sys.exit(main())
