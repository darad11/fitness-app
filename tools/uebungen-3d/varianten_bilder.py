"""Standbilder der Varianten zur Probe (D-414): eine Variante, eine Übung, gewählte Phasen.

    python -I tools/uebungen-3d/varianten_bilder.py A kniebeuge 1.0 --arbeit /tmp/varianten
    python -I tools/uebungen-3d/varianten_bilder.py C-w bankdruecken 0.0 1.0 --arbeit /tmp/varianten

Kamera wie in der App (Regel der Übung, Abstand aus Figur und Gerät über die ganze Bewegung).
Schreibt `<Variante>-<Übung>-<Phase>.png` und `<Variante>-<Übung>.json` (Renderzeit je Bild).
"""
from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

HIER = Path(__file__).resolve().parent
sys.path.insert(0, str(HIER))

import bpy  # noqa: E402

import render  # noqa: E402


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("variante")
    ap.add_argument("uebung")
    ap.add_argument("phasen", nargs="+", type=float)
    ap.add_argument("--arbeit", default="/tmp/uebungen-varianten")
    ap.add_argument("--breite", type=int, default=720)
    ap.add_argument("--hoehe", type=int, default=540)
    ap.add_argument("--proben", type=int, default=40)
    args = ap.parse_args()
    arbeit = Path(args.arbeit)
    arbeit.mkdir(parents=True, exist_ok=True)
    start = time.time()
    s, u, punkte = render.baue(args.uebung, args.breite, args.hoehe, args.proben, variante=args.variante)
    aufbau = time.time() - start
    render.kamera(u, punkte, "standard", args.breite, args.hoehe)
    zeiten = {}
    for p in args.phasen:
        u.setzen(p)
        t = time.time()
        s.render.filepath = str(arbeit / f"{args.variante}-{args.uebung}-{p:.2f}.png")
        bpy.ops.render.render(write_still=True)
        zeiten[f"{p:.2f}"] = round(time.time() - t, 1)
    (arbeit / f"{args.variante}-{args.uebung}.json").write_text(
        json.dumps({"aufbau_s": round(aufbau, 1), "bild_s": zeiten, "breite": args.breite, "hoehe": args.hoehe,
                    "proben": args.proben}, ensure_ascii=False), encoding="utf-8")


if __name__ == "__main__":
    main()
