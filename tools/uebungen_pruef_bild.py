#!/usr/bin/env python3
"""Prüfseite einer Pilot-Übung (D-408, neu mit D-447): Prüfansichten aus `render.py <übung> --pruefen`
(vorn, Seite und Standard in fünf Phasen, Griff der linken Hand aus der Nähe von drei Seiten in Ausgangs-
und Endposition) auf einem Blatt `docs/screens/uebungen/pruef-<übung>.webp`.

    python3 tools/uebungen_pruef_bild.py kniebeuge bankdruecken latziehen --arbeit /tmp/uebungen-3d

Braucht Pillow (nur für dieses Werkzeug, nicht für die App); Gestaltung wie `uebungen_paket_bild.py`.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

HIER = Path(__file__).resolve().parent
sys.path.insert(0, str(HIER))

from PIL import Image, ImageDraw  # noqa: E402

from uebungen_paket_bild import GRUND, TEXT, schrift, speichern  # noqa: E402

PHASEN = ("0.00", "0.25", "0.50", "0.75", "1.00")
ANSICHTEN = (("vorn", "vorn"), ("seite", "Seite"), ("standard", "Standard"))
GRIFF = (("20", "Griff von vorn"), ("110", "Griff von außen"), ("200", "Griff von hinten"))


def zelle(pfad: Path, breite: int, text: str) -> Image.Image:
    bild = Image.open(pfad).convert("RGB")
    bild = bild.resize((breite, round(bild.height * breite / bild.width)), Image.LANCZOS)
    feld = Image.new("RGB", (breite, bild.height + 30), GRUND)
    feld.paste(bild, (0, 0))
    d = ImageDraw.Draw(feld)
    f = schrift(16)
    w = d.textlength(text, font=f)
    d.text(((breite - w) / 2, bild.height + 6), text, fill=TEXT, font=f)
    return feld


def blatt(arbeit: Path) -> Image.Image:
    breite = 1480
    zeilen: list[list[Image.Image]] = []
    for datei, titel in ANSICHTEN:
        zeilen.append([zelle(arbeit / f"pruef-{datei}-{p}.png", breite // 5 - 8,
                             f"{titel} · Phase {p.replace('.', ',')}") for p in PHASEN])
    zeilen.append([zelle(arbeit / f"pruef-hand-{r}-{p}.png", breite // 6 - 8,
                         f"{t} · {'Ausgang' if p == '0.00' else 'Endposition'}") for p in ("0.00", "1.00") for r, t in GRIFF])
    hoehe = sum(max(z.height for z in zeile) + 8 for zeile in zeilen) + 8
    gesamt = Image.new("RGB", (breite, hoehe), GRUND)
    y = 8
    for zeile in zeilen:
        x = (breite - sum(z.width + 8 for z in zeile) + 8) // 2
        for z in zeile:
            gesamt.paste(z, (x, y))
            x += z.width + 8
        y += max(z.height for z in zeile) + 8
    return gesamt


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("uebungen", nargs="+")
    ap.add_argument("--arbeit", default="/tmp/uebungen-3d")
    ap.add_argument("--ziel", default=str(HIER.parent / "docs/screens/uebungen"))
    args = ap.parse_args()
    for u in args.uebungen:
        speichern(blatt(Path(args.arbeit) / u), Path(args.ziel), f"pruef-{u}")


if __name__ == "__main__":
    main()
