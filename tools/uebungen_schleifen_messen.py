#!/usr/bin/env python3
"""Misst jede Schleife der App Bild für Bild (D-536): Sprünge, Ruckler und Naht, in MP4 und WebM.

    python3 tools/uebungen_schleifen_messen.py           schreibt src/modules/exercises/data/schleifen-messung.v1.json
    python3 tools/uebungen_schleifen_messen.py --zeigen  gibt die Werte nur aus

Braucht ffmpeg und numpy (Arbeitsumgebung, nicht die CI). Die Werte prüft `schleifen.test.ts` gegen Grenzen,
`check_medien.py` prüft, dass die Datei genau die Dateien aus `public/uebungen/medien.json` nennt; eine neue Fassung
(neuer Name mit Prüfsumme, D-494) verlangt also eine neue Messung.

Gemessen an Graustufen in 360 × 270 (halbe Größe), Übergang t → t+1 mit dem vom letzten zum ersten Bild:
- `bewegung`: für jeden Übergang das 99. Perzentil der mittleren Änderung in Feldern von 15 × 15 px. Eine Bewegung
  verläuft weich, wenn kein Übergang mehr als das 1,8fache seiner beiden Nachbarn hat (Sprung oder Ruckler).
- `naht`: wie viele Pixel sich vom letzten zum ersten Bild um mehr als 8 Helligkeitsstufen ändern, dazu die größte
  Änderung. In der Pause vor der Naht steht das Bild still, jede Änderung dort ist ein Zucken.
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
MEDIEN = ROOT / "public/uebungen/medien.json"
ZIEL = ROOT / "src/modules/exercises/data/schleifen-messung.v1.json"
B, H, FELD = 360, 270, 15


def bilder(datei: Path) -> np.ndarray:
    roh = subprocess.run(["ffmpeg", "-v", "error", "-i", str(datei), "-vf", f"scale={B}:{H}", "-f", "rawvideo",
                          "-pix_fmt", "gray", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(roh, np.uint8).reshape(-1, H, B).astype(np.float32)


def messen(datei: Path) -> dict:
    f = bilder(datei)
    n = len(f)
    bewegung = []
    for t in range(n):
        d = np.abs(f[(t + 1) % n] - f[t])
        felder = d.reshape(H // FELD, FELD, B // FELD, FELD).mean(axis=(1, 3))
        bewegung.append(round(float(np.percentile(felder, 99)), 2))
    naht = np.abs(f[0] - f[-1])
    return {"bilder": n, "bewegung": bewegung, "nahtPixel": int((naht > 8).sum()), "nahtMax": int(naht.max())}


def main() -> int:
    visuals = json.loads(MEDIEN.read_text(encoding="utf-8"))["visuals"]
    aus = {}
    for key, v in sorted(visuals.items()):
        demo = v.get("demo", {})
        if demo.get("kind") != "animation":
            continue
        eintrag = {}
        for art, quelle in (("mp4", demo["file"]["src"]), ("webm", demo["webm"]["src"])):
            eintrag[art] = {"datei": quelle, **messen(ROOT / "public/uebungen" / quelle)}
        aus[key] = eintrag
        print(f"{key}: MP4 Naht {eintrag['mp4']['nahtPixel']} px (max {eintrag['mp4']['nahtMax']}), "
              f"WebM Naht {eintrag['webm']['nahtPixel']} px", flush=True)
    if "--zeigen" in sys.argv:
        return 0
    daten = {"version": 1, "messung": "tools/uebungen_schleifen_messen.py (D-536)", "schleifen": aus}
    ZIEL.write_text(json.dumps(daten, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"{ZIEL.relative_to(ROOT)}: {len(aus)} Schleifen")
    return 0


if __name__ == "__main__":
    sys.exit(main())
