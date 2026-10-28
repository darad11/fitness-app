#!/usr/bin/env python3
"""Blätter der Korrekturen vom 28.10.2026 (D-424): Standbilder in Fassung A1 mit Brust-F 4 cm (Kniebeuge
tiefste Position, Bankdrücken Ausgangs- und Endposition) für D, C männlich und C weiblich, dazu je Körper
Nahaufnahmen von Augen, Hals, Rücken mit Schriftzug, Shorts-Logo und dem Griff beim Bankdrücken von vorn
(Fußende), von der Seite und vom Kopfende, dazu der Griff in der Kniebeuge.

Ordner `<paket>/`: `bilder/<Körper>-A1-<Übung>-<Phase>.png` und `.json` (720 × 540, 40 Proben, aus
`tools/uebungen-3d/varianten_bilder.py`) und `nah/<Körper>-<Ansicht>.png` (480 px, `nahaufnahme.py`),
Ansichten `augen`, `hals`, `ruecken`, `shorts`, `griff-vorn`, `griff-seite`, `griff-kopf`, `griff-knie`.

    python3 tools/uebungen_korrektur_bild.py --paket /tmp/korrektur --ziel docs/screens/uebungen

Braucht Pillow (nur für dieses Werkzeug, nicht für die App); Gestaltung wie `uebungen_paket_bild.py`.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

HIER = Path(__file__).resolve().parent
sys.path.insert(0, str(HIER))

from uebungen_paket_bild import KOERPER, MOMENTE, ausschnitt, gitter, kachel, speichern  # noqa: E402

NAH = [
    ("augen", "Augen", "Kniebeuge, Ausgang, von vorn"),
    ("hals", "Hals und Kragen", "Kniebeuge, tiefste Position, Kamera der App"),
    ("ruecken", "Rücken mit Schriftzug", "Latziehen, Endposition, von hinten"),
    ("shorts", "Shorts-Logo", "linkes Bein außen, von der Seite"),
    ("griff-vorn", "Griff Bankdrücken, von vorn", "vom Fußende, Ausgangsposition, linke Hand"),
    ("griff-seite", "Griff Bankdrücken, von der Seite", "schräg entlang der Stange, Scheiben ausgeblendet"),
    ("griff-kopf", "Griff Bankdrücken, vom Kopfende", "Blick des Trainierenden auf die Hand"),
    ("griff-knie", "Griff Kniebeuge, von der Seite", "hinten-seitlich, Scheiben ausgeblendet"),
]


def blatt_standbilder(paket: Path) -> "Image":
    """Zeilen = Körper, Spalten = Momente; je Moment derselbe Ausschnitt für alle Körper."""
    kisten = {}
    for u, p, _, _ in MOMENTE:
        kisten[(u, p)] = ausschnitt([paket / "bilder" / f"{k}-A1-{u}-{p}.png" for k, _ in KOERPER])
    kacheln = []
    for k, kt in KOERPER:
        for u, p, _, mt in MOMENTE:
            zeit = ""
            info = paket / "bilder" / f"{k}-A1-{u}.json"
            if info.exists():
                w = json.loads(info.read_text(encoding="utf-8"))
                s = w["bild_s"].get(p)
                if s is not None:
                    zeit = f"Renderzeit {s:.0f} s ({w['breite']} × {w['hoehe']}, {w['proben']} Proben)"
            kacheln.append(kachel(paket / "bilder" / f"{k}-A1-{u}-{p}.png", f"{kt} · {mt}", 480, 360, zeit, kisten[(u, p)]))
    return gitter(kacheln, 3, "1 · Standbilder · Fassung A1, Brust-F 4 cm",
                  "Augen, Zopf, Logos, Kragen und Griff korrigiert (D-421 bis D-423); Kamera wie in der App")


def blatt_nah(paket: Path, k: str, kt: str, nummer: int) -> "Image":
    kacheln = [kachel(paket / "nah" / f"{k}-{datei}.png", at, 380, 380, zusatz) for datei, at, zusatz in NAH]
    return gitter(kacheln, 4, f"{nummer} · Nahaufnahmen · {kt}", "Fassung A1, Brust-F 4 cm; links und rechts aus Sicht des Trägers")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--paket", required=True, help="Ordner mit bilder/ und nah/")
    ap.add_argument("--ziel", default=str(HIER.parent / "docs/screens/uebungen"))
    args = ap.parse_args()
    paket, ziel = Path(args.paket), Path(args.ziel)
    ziel.mkdir(parents=True, exist_ok=True)
    speichern(blatt_standbilder(paket), ziel, "korrektur-1-standbilder")
    for n, (k, kt) in enumerate(KOERPER, start=2):
        speichern(blatt_nah(paket, k, kt, n), ziel, f"korrektur-{n}-nah-{k}")


if __name__ == "__main__":
    main()
