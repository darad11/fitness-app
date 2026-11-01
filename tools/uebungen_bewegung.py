#!/usr/bin/env python3
"""Kurze Aufnahme der Bewegung: Schleifen der App nebeneinander, je dreimal abgespielt (wie `pilot-bewegung.mp4`
aus `tools/pilot-screens.mjs`), für die Übungen einer Familie (D-463).

    python3 tools/uebungen_bewegung.py waagrechtes-druecken schraegbankdruecken_kh bankdruecken_kh

Schreibt `docs/screens/uebungen/<name>-bewegung.mp4` aus `public/uebungen/medien/<übung>-<prüfsumme>.mp4` (D-494); eine einzelne Übung
bleibt in der Größe der App (720 × 540). Ab vier Übungen ein Raster mit vier Spalten (je 360 × 270, D-485); mit
`<übung>=<Beschriftung>` steht der Name unten links im Bild. Braucht ffmpeg.

    python3 tools/uebungen_bewegung.py schleifen kniebeuge=Kniebeuge bankdruecken=Bankdrücken latziehen=Latziehen …
"""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

from uebungen_medien_version import aktuelle_datei

HIER = Path(__file__).resolve().parent.parent


SCHRIFT = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
SPALTEN = 4


def _beschriftung(text: str) -> str:
    if not text:
        return ""
    text = text.replace("\\", "").replace(":", "\\:").replace(",", "\\,").replace("'", "")
    return f",drawtext=fontfile={SCHRIFT}:text='{text}':x=10:y=h-th-10:fontsize=18:fontcolor=0xE6E8EB:box=1:boxcolor=0x0B1018@0.65:boxborderw=6"


def main() -> None:
    name, angaben = sys.argv[1], sys.argv[2:]
    uebungen = [a.split("=", 1)[0] for a in angaben]
    texte = [a.split("=", 1)[1] if "=" in a else "" for a in angaben]
    eingaben = []
    for u in uebungen:
        eingaben += ["-stream_loop", "2", "-i", str(aktuelle_datei(f"{u}.mp4"))]
    n = len(uebungen)
    if n == 1:  # eine Übung: in voller Größe der App (D-465)
        filter_ = "[0:v]null" + _beschriftung(texte[0])
    elif n <= 3:
        skaliert = "".join(f"[{i}:v]scale=480:360{_beschriftung(texte[i])}[v{i}];" for i in range(n))
        filter_ = skaliert + "".join(f"[v{i}]" for i in range(n)) + f"hstack=inputs={n}"
    else:  # Raster (D-485): leere Felder in der Grundfarbe der App
        zeilen = -(-n // SPALTEN)
        felder = zeilen * SPALTEN
        b, h = 360, 270
        skaliert = "".join(f"[{i}:v]scale={b}:{h}{_beschriftung(texte[i])}[v{i}];" for i in range(n))
        for i in range(n, felder):
            eingaben += ["-f", "lavfi", "-i", f"color=c=0x0B1018:s={b}x{h}:r=24:d=7.5"]
            skaliert += f"[{i}:v]null[v{i}];"
        lage = "|".join(f"{(i % SPALTEN) * b}_{(i // SPALTEN) * h}" for i in range(felder))
        filter_ = skaliert + "".join(f"[v{i}]" for i in range(felder)) + f"xstack=inputs={felder}:layout={lage}"
    ziel = HIER / "docs/screens/uebungen" / f"{name}-bewegung.mp4"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *eingaben, "-filter_complex", filter_, "-an", "-c:v", "libx264",
                    "-pix_fmt", "yuv420p", "-crf", "26", "-preset", "slow", "-movflags", "+faststart", str(ziel)], check=True)
    print(f"{ziel.relative_to(HIER)} ({ziel.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
