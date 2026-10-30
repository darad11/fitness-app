#!/usr/bin/env python3
"""Kurze Aufnahme der Bewegung: Schleifen der App nebeneinander, je dreimal abgespielt (wie `pilot-bewegung.mp4`
aus `tools/pilot-screens.mjs`), für die Übungen einer Familie (D-463).

    python3 tools/uebungen_bewegung.py waagrechtes-druecken schraegbankdruecken_kh bankdruecken_kh

Schreibt `docs/screens/uebungen/<name>-bewegung.mp4` aus `public/uebungen/medien/<übung>.mp4`. Braucht ffmpeg.
"""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

HIER = Path(__file__).resolve().parent.parent


def main() -> None:
    name, uebungen = sys.argv[1], sys.argv[2:]
    eingaben = []
    for u in uebungen:
        eingaben += ["-stream_loop", "2", "-i", str(HIER / "public/uebungen/medien" / f"{u}.mp4")]
    skaliert = "".join(f"[{i}:v]scale=480:360[v{i}];" for i in range(len(uebungen)))
    filter_ = skaliert + "".join(f"[v{i}]" for i in range(len(uebungen))) + f"hstack=inputs={len(uebungen)}"
    ziel = HIER / "docs/screens/uebungen" / f"{name}-bewegung.mp4"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *eingaben, "-filter_complex", filter_, "-an", "-c:v", "libx264",
                    "-pix_fmt", "yuv420p", "-crf", "26", "-preset", "slow", "-movflags", "+faststart", str(ziel)], check=True)
    print(f"{ziel.relative_to(HIER)} ({ziel.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
