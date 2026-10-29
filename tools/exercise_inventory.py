#!/usr/bin/env python3
"""Bestandsaufnahme der Übungsbibliothek (Phase Übungen, D-397, Leitlinien Kapitel 5).

Erzeugt Abschnitt 3 von docs/uebungen-bestand.md aus den Daten der App:
  - src/modules/exercises/data/core-exercises.v1.json   Basisübungen
  - public/uebungen/medien.json                         Visuals je Schlüssel
  - src/modules/exercises/data/exercise-guides.v1.json  Ausführungstexte mit Quellen

  python3 tools/exercise_inventory.py           schreibt den Abschnitt neu
  python3 tools/exercise_inventory.py --check   prüft nur (Exit-Code 1 bei Abweichung)
"""
from __future__ import annotations

import json
import re
import sys
import uuid
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from exercise_library_to_md import EQUIPMENT, GROUPS, MUSCLES, labels  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
CORE = ROOT / "src/modules/exercises/data/core-exercises.v1.json"
MEDIA = ROOT / "public/uebungen/medien.json"
GUIDES = ROOT / "src/modules/exercises/data/exercise-guides.v1.json"
DOC = ROOT / "docs/uebungen-bestand.md"
MARKER = "## 3. Tabelle\n"
# Namensraum der App (src/shared/lib/uuid.ts); die ID einer Basisübung ist UUID v5 aus
# `core-exercise:<Schlüssel>` (D-240), geprüft in coreLibrary.test.ts.
APP_NAMESPACE = uuid.UUID("a9f1c5d1-6d1e-4d1d-b94d-d8ca701b9904")

# Alias-Namen, die nur ASCII haben, aber deutsch sind; sie gelten nicht als englischer Name.
GERMAN_ASCII = re.compile(
    r"(Klimmzug|Latzug|Kabel|rudern|Rudern|Seitheben|Untergriff|Obergriff|Brustpresse|drücken|"
    r"Kniebeuge|Ausfallschritt|Wadenheben|Hampelmann|Seilspringen|Bauch|Stuetz|Unterarm|"
    r"Beinheben|Gesaess|Hyperextensions?$|Flys$|Shrugs$|Dips$|Crunches$)",
    re.IGNORECASE,
)


# Wo die Alias-Namen keinen passenden englischen Namen hergeben (deutsche Alias-Namen in ASCII
# oder nur eine Variante), gilt der hier genannte.
ENGLISH = {
    "dip": "Dips",
    "heel_tap": "Heel Taps",
    "windshield_wiper": "Windshield Wipers",
    "goblet_squat": "Goblet Squat",
    "sit_up": "Sit-ups",
}


def english_name(key: str, aliases: list[str]) -> str:
    if key in ENGLISH:
        return ENGLISH[key]
    for alias in aliases:
        if re.fullmatch(r"[A-Za-z0-9' ()/-]+", alias) and not GERMAN_ASCII.search(alias):
            return alias
    return "–"


def base_name(name: str) -> str:
    """Bewegung ohne Gerät: „Bankdrücken mit Langhantel“ → „Bankdrücken“."""
    part = re.split(r",| mit | an der | am | im ", name, maxsplit=1)[0]
    return part.strip()


def render(core: list[dict], media: dict, guides: dict) -> str:
    bases: dict[str, list[str]] = {}
    for ex in core:
        bases.setdefault(base_name(ex["name"]), []).append(ex["name"])
    open_reasons = {entry["key"]: entry["reason"] for entry in guides["open"]}
    lines = [MARKER]
    group = None
    for number, ex in enumerate(core, 1):
        if ex["group"] != group:
            group = ex["group"]
            lines += [
                f"\n### {GROUPS[group]}\n",
                "| Nr. | Name | Englisch | Gerät | Hauptmuskeln | Nebenmuskeln | Varianten in der Bibliothek | Visual | Ausführung | Hinweis zur Quelle | Schlüssel und ID |",
                "|---|---|---|---|---|---|---|---|---|---|---|",
            ]
        key = ex["key"]
        variants = [n for n in bases[base_name(ex["name"])] if n != ex["name"]]
        visual = media["visuals"].get(key)
        guide = guides["guides"].get(key)
        if guide:
            hosts = sorted({re.sub(r"^www\.", "", s["url"].split("/")[2]) for s in guide["sources"]})
            guide_cell = f"fertig ({', '.join(hosts)})"
            note = guide.get("sourceNote", "")
        else:
            guide_cell = "offen"
            note = open_reasons.get(key, "")
        cells = [
            str(number),
            ex["name"],
            english_name(key, ex["aliases"]),
            labels(EQUIPMENT, ex["equipment"]),
            labels(MUSCLES, ex["primaryMuscles"]),
            labels(MUSCLES, ex["secondaryMuscles"]),
            " · ".join(variants) or "–",
            "vorhanden" if visual else "fehlt",
            guide_cell,
            note or "–",
            f"`{key}` · `{uuid.uuid5(APP_NAMESPACE, 'core-exercise:' + key)}`",
        ]
        lines.append("| " + " | ".join(c.replace("|", "/") for c in cells) + " |")
    with_visual = sum(1 for ex in core if ex["key"] in media["visuals"])
    written = sum(1 for ex in core if ex["key"] in guides["guides"])
    lines += [
        "",
        f"Summe: {len(core)} Übungen · mit Visual {with_visual} · ohne Visual {len(core) - with_visual} "
        f"· Ausführung fertig {written} · offen {len(core) - written}",
    ]
    return "\n".join(lines) + "\n"


def main() -> int:
    core = json.loads(CORE.read_text(encoding="utf-8"))["exercises"]
    media = json.loads(MEDIA.read_text(encoding="utf-8"))
    guides = json.loads(GUIDES.read_text(encoding="utf-8"))
    doc = DOC.read_text(encoding="utf-8")
    head = doc.split(MARKER, 1)[0]
    expected = head + render(core, media, guides)
    if "--check" in sys.argv:
        if doc != expected:
            print(
                "  - docs/uebungen-bestand.md Abschnitt 3 weicht von den Daten ab; "
                "python3 tools/exercise_inventory.py ausführen"
            )
            return 1
    else:
        DOC.write_text(expected, encoding="utf-8")
    print(
        f"Bestand: {len(core)} Übungen, Visuals {len(media['visuals'])}, "
        f"Ausführung {len(guides['guides'])}, offen {len(guides['open'])}"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
