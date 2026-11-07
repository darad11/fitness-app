#!/usr/bin/env python3
"""Übersicht eines Programms (D-493): alle Übungen in der Reihenfolge der Tage mit dem Stand ihrer Animation und der
Größe ihrer Dateien, dazu ein Bild mit dem Poster jeder Übung in Player-Größe (390 × 292 px wie der große Player am
iPhone, `uebungen_paket_bild.PLAYER_BREITE`).

    python3 tools/uebungen_programm_uebersicht.py compound_ab_4 --ziel docs/screens/uebungen --name ganzkoerper-ab

Gibt die Liste als Markdown-Tabelle aus und schreibt `<ziel>/<name>-uebersicht.webp`. Der Stand kommt aus
`tools/uebungen-3d/familien.json` (`fortschritt`), die Dateien aus `public/uebungen/medien.json`.

„Geladen“ (D-529) ist, was die App je Übung lädt: das Vorschaubild in Listen, das Poster und eine Datei der Schleife,
MP4 zuerst (`loopFile` in `src/modules/exercises/data/media.ts`); WebM nur, wenn MP4 nicht läuft.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image

from uebungen_paket_bild import PLAYER_BREITE, gitter, kachel, speichern

HIER = Path(__file__).resolve().parent.parent
TEILE = (("file", "MP4"), ("webm", "WebM"), ("still", "Poster"))


def kb(pfad: Path) -> float:
    return pfad.stat().st_size / 1024 if pfad.is_file() else 0.0


def zahl(x: float) -> str:
    return f"{x:,.1f}".replace(",", "X").replace(".", ",").replace("X", ".")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("programm", help="Schlüssel der Vorlage in src/modules/training/data/programs.v1.json")
    ap.add_argument("--ziel", default=str(HIER / "docs/screens/uebungen"))
    ap.add_argument("--name", required=True, help="Dateiname: <name>-uebersicht.webp")
    args = ap.parse_args()

    vorlagen = json.loads((HIER / "src/modules/training/data/programs.v1.json").read_text(encoding="utf-8"))["templates"]
    vorlage = next(v for v in vorlagen if v["key"] == args.programm)
    namen = {u["key"]: u["name"] for u in json.loads(
        (HIER / "src/modules/exercises/data/core-exercises.v1.json").read_text(encoding="utf-8"))["exercises"]}
    medien = json.loads((HIER / "public/uebungen/medien.json").read_text(encoding="utf-8"))["visuals"]
    stand = json.loads((HIER / "tools/uebungen-3d/familien.json").read_text(encoding="utf-8"))["fortschritt"]

    # Tage mit Bezeichnung (Dali’s PPLC: „Push“, „Pull“, „Legs“, „Compound“ über alle Wochen, D-529) zählen je
    # Bezeichnung einmal; sonst der Name des Tags („Tag A“)
    reihe: list[tuple[str, list[str]]] = []
    for tag in vorlage["days"]:
        titel = (tag.get("label") or tag["name"]).split(" · ")[0]  # „Push · leicht“ zählt als „Push“
        for eintrag in tag["exercises"]:
            schluessel = eintrag["exercise"]
            vorhanden = next((r for r in reihe if r[0] == schluessel), None)
            if vorhanden:
                if titel not in vorhanden[1]:
                    vorhanden[1].append(titel)
            else:
                reihe.append((schluessel, [titel]))

    zeilen = ["| Nr. | Tag | Übung | Stand | MP4 | WebM | Poster | Vorschau | geladen | alle Dateien |",
              "|---|---|---|---|---|---|---|---|---|---|"]
    kacheln = []
    summe = 0.0
    summe_geladen = 0.0
    for nr, (schluessel, tage) in enumerate(reihe, 1):
        visual = medien.get(schluessel)
        name = namen.get(schluessel, schluessel)
        groessen = {}
        if visual:
            demo = visual.get("demo", {})
            for teil, titel in TEILE:
                if teil in demo:
                    groessen[titel] = kb(HIER / "public/uebungen" / demo[teil]["src"])
            groessen["Vorschau"] = kb(HIER / "public/uebungen" / visual["preview"]["src"])
        zusammen = sum(groessen.values())
        geladen = sum(groessen.get(t, 0.0) for t in ("MP4", "Poster", "Vorschau"))
        summe += zusammen
        summe_geladen += geladen
        werte = [zahl(groessen[t]) + " KB" if t in groessen else "–" for t in ("MP4", "WebM", "Poster", "Vorschau")]
        zeilen.append(f"| {nr} | {', '.join(t.replace('Tag ', '') for t in tage)} | {name} | "
                      f"{stand.get(schluessel, 'offen')} | {' | '.join(werte)} | {zahl(geladen)} KB | {zahl(zusammen)} KB |")
        poster = HIER / "public/uebungen" / visual["demo"]["still"]["src"] if visual and "still" in visual.get("demo", {}) else None
        zusatz = (f"{', '.join(tage)} · geladen {zahl(geladen)} KB (MP4 {zahl(groessen.get('MP4', 0))} KB)"
                  if visual else f"{', '.join(tage)} · noch keine Animation")
        bild = Image.open(poster).convert("RGB") if poster and poster.is_file() else Image.new("RGB", (720, 540), (12, 18, 25))
        kacheln.append(kachel(bild, f"{nr}. {name}", PLAYER_BREITE, PLAYER_BREITE * 3 // 4, zusatz))
    zeilen.append(f"| | | **zusammen** | | | | | | **{zahl(summe_geladen)} KB** | **{zahl(summe)} KB** |")
    print("\n".join(zeilen))

    blatt = gitter(kacheln, 4, f"{vorlage['name']}: {len(reihe)} Übungen in Player-Größe",
                   f"Poster der Schleifen, je {PLAYER_BREITE} × {PLAYER_BREITE * 3 // 4} px wie der große Player am iPhone")
    speichern(blatt, Path(args.ziel), f"{args.name}-uebersicht")


if __name__ == "__main__":
    main()
