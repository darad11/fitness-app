#!/usr/bin/env python3
"""Prüft die Liste der Übungsbilder `public/uebungen/medien.json` vor Build und E2E (D-488).

Die App überspringt einen ungültigen Eintrag nur noch einzeln und meldet ihn in der Konsole
(`parseExerciseMedia`); damit so ein Eintrag gar nicht erst ausgeliefert wird, findet ihn diese
Prüfung schon in `pnpm check:docs`:

- Schlüssel der Basisübung (Muster wie `CORE_KEY_PATTERN`, vorhanden in der Bibliothek),
- Alternativtext nach dem Kürzen der Leerzeichen 1 bis höchstens so viele Zeichen, wie das Schema
  erlaubt (die Grenze wird aus `src/modules/exercises/model/media.ts` gelesen, gezählt wie in
  JavaScript in UTF-16-Einheiten),
- Quelle vorhanden, Dateien im Ordner `medien/` mit erlaubter Endung, ganzzahlige Maße, und die
  Dateien liegen wirklich unter `public/uebungen/`,
- jede Datei trägt die Prüfsumme ihres Inhalts im Namen, und im Ordner liegt keine Datei, die die
  Liste nicht nennt (D-494). So fällt eine neu gerenderte Schleife auf, die noch nicht mit
  `tools/uebungen_medien_version.py` eingebaut ist; das Gerät sähe sonst weiter die alte.

Fehler mit Schlüssel und Grund, Exit-Code 1.

  python3 tools/check_medien.py
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

from uebungen_medien_version import ORDNER, grundname, pruefsumme, versioniert

ROOT = Path(__file__).resolve().parents[1]
LISTE = ROOT / "public/uebungen/medien.json"
SCHEMA = ROOT / "src/modules/exercises/model/media.ts"
BIBLIOTHEK = ROOT / "src/modules/exercises/data/core-exercises.v1.json"
SCHLUESSEL = re.compile(r"^[a-z0-9]+(?:_[a-z0-9]+)*$")
DATEI = re.compile(r"^medien/[a-z0-9_-]+\.(?:webp|avif|png|jpg|svg|gif|mp4|webm)$")
DEMO_DATEIEN = ("file", "webm", "still", "poster", "start", "end")
HINWEIS = "python3 tools/uebungen_medien_version.py"


def grenze_alt() -> int:
    treffer = re.findall(r"\balt:\s*text\((\d+)\)", SCHEMA.read_text(encoding="utf-8"))
    if len(treffer) != 1:
        sys.exit(f"check_medien: Grenze des Alternativtexts in {SCHEMA.relative_to(ROOT)} nicht eindeutig gefunden")
    return int(treffer[0])


def utf16(text: str) -> int:
    return len(text.encode("utf-16-le")) // 2


def datei_fehler(name: str, datei: object) -> list[str]:
    if not isinstance(datei, dict):
        return [f"{name}: keine Datei"]
    fehler = []
    src = datei.get("src")
    if not isinstance(src, str) or not DATEI.match(src):
        fehler.append(f"{name}.src ungültig: {src!r}")
    elif not (LISTE.parent / src).is_file():
        fehler.append(f"{name}.src fehlt: public/uebungen/{src}")
    else:
        datei_name = src.removeprefix("medien/")
        soll = versioniert(grundname(datei_name), pruefsumme(LISTE.parent / src))
        if datei_name != soll:
            fehler.append(f"{name}.src ohne passende Prüfsumme im Namen: {datei_name} statt {soll} ({HINWEIS})")
    for mass in ("width", "height"):
        wert = datei.get(mass)
        if not isinstance(wert, int) or isinstance(wert, bool) or wert <= 0:
            fehler.append(f"{name}.{mass} ungültig: {wert!r}")
    return fehler


def main() -> int:
    grenze = grenze_alt()
    liste = json.loads(LISTE.read_text(encoding="utf-8"))
    bekannt = {u["key"] for u in json.loads(BIBLIOTHEK.read_text(encoding="utf-8"))["exercises"]}
    fehler: list[str] = []
    if liste.get("version") != 1:
        fehler.append(f"version: {liste.get('version')!r} statt 1")
    quellen = liste.get("sources", {})
    visuals = liste.get("visuals", {})
    for schluessel, eintrag in visuals.items():
        gruende = []
        if not SCHLUESSEL.match(schluessel):
            gruende.append("Schlüssel ungültig")
        elif schluessel not in bekannt:
            gruende.append("keine Basisübung mit diesem Schlüssel")
        alt = eintrag.get("alt")
        if not isinstance(alt, str) or not alt.strip():
            gruende.append("Alternativtext fehlt")
        elif utf16(alt.strip()) > grenze:
            gruende.append(f"Alternativtext {utf16(alt.strip())} Zeichen, höchstens {grenze}")
        if eintrag.get("source") not in quellen:
            gruende.append(f"Quelle fehlt: {eintrag.get('source')!r}")
        gruende += datei_fehler("preview", eintrag.get("preview"))
        demo = eintrag.get("demo")
        if isinstance(demo, dict):
            for teil in DEMO_DATEIEN:
                if teil in demo:
                    gruende += datei_fehler(f"demo.{teil}", demo[teil])
        fehler += [f"{schluessel}: {g}" for g in gruende]
    genannt = {
        teil["src"].removeprefix("medien/")
        for eintrag in visuals.values()
        for teil in [eintrag.get("preview"), *(eintrag.get("demo") or {}).values()]
        if isinstance(teil, dict) and isinstance(teil.get("src"), str)
    }
    for datei in sorted(p.name for p in ORDNER.iterdir() if p.is_file()):
        if datei not in genannt:
            fehler.append(f"medien/{datei}: liegt im Ordner, steht aber nicht in der Liste (neu gerendert? {HINWEIS})")
    if fehler:
        print(f"{LISTE.relative_to(ROOT)}: {len(fehler)} Probleme", file=sys.stderr)
        for f in fehler:
            print(f"  - {f}", file=sys.stderr)
        return 1
    print(f"{LISTE.relative_to(ROOT)}: {len(visuals)} Einträge geprüft, Alternativtexte höchstens {grenze} Zeichen, "
          f"{len(genannt)} Dateien mit Prüfsumme im Namen")
    return 0


if __name__ == "__main__":
    sys.exit(main())
