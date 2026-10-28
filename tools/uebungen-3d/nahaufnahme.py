"""Nahaufnahme einer Variante zum Prüfen von Hals, Logos und Kantenlicht (D-417): Kamera auf die
Umgebung eines Knochens im verformten Netz, wahlweise mit eigener Richtung und Neigung.

    python -I tools/uebungen-3d/nahaufnahme.py D-z kniebeuge 0.0 neck01 0.26 --richtung 0 --ziel hals.png
    python -I tools/uebungen-3d/nahaufnahme.py D-z-hell kniebeuge 0.0 upperleg02.L 0.22 --richtung 90 --ziel bein.png

Ohne `--richtung`/`--neigung` die Kamera der Übung (wie in der App). `--kante a b` setzt die Stärke
des Kantenlichts (W), `--ohne-kante` den Stand bis D-416.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

HIER = Path(__file__).resolve().parent
sys.path.insert(0, str(HIER))

import bpy  # noqa: E402

import render  # noqa: E402
import szene  # noqa: E402
from uebungen import _netz  # noqa: E402


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("variante")
    ap.add_argument("uebung")
    ap.add_argument("phase", type=float)
    ap.add_argument("knochen", help="Knochen in der Mitte des Bildes, z. B. neck01, spine03, upperleg02.L")
    ap.add_argument("radius", type=float, help="Umkreis um den Knochen, der ins Bild soll (m)")
    ap.add_argument("--richtung", type=float, help="Kamerarichtung in Grad (0 vorn, 90 links, 180 hinten)")
    ap.add_argument("--neigung", type=float)
    ap.add_argument("--groesse", type=int, default=420)
    ap.add_argument("--proben", type=int, default=16)
    ap.add_argument("--kante", type=float, nargs=2, metavar=("LINKS", "RECHTS"))
    ap.add_argument("--ohne-kante", action="store_true")
    ap.add_argument("--ziel", required=True)
    args = ap.parse_args()
    if args.kante:
        szene.KANTE = tuple(args.kante)
    s, u, _ = render.baue(args.uebung, args.groesse, args.groesse, args.proben, variante=args.variante)
    if args.ohne_kante:
        u.kantenlicht = False
    u.setzen(args.phase)
    mitte = u.rig.welt(u.rig.punkt(args.knochen, u.rig.kopf[args.knochen]))
    nah = [p for p in _netz(u.koerper) if (p - mitte).length < args.radius]
    richtung = args.richtung if args.richtung is not None else u.kamera["richtung"]
    neigung = args.neigung if args.neigung is not None else u.kamera["neigung"]
    for o in [o for o in bpy.data.objects if o.type in ("CAMERA", "LIGHT")]:
        bpy.data.objects.remove(o)
    ziel, abstand, h = szene.bildausschnitt(nah, richtung, neigung, args.groesse, args.groesse, rand=0.04)
    szene.licht_und_kamera(ziel, richtung, abstand, h, kantenlicht=getattr(u, "kantenlicht", True))
    s.render.filepath = args.ziel
    bpy.ops.render.render(write_still=True)
    print("geschrieben:", args.ziel)


if __name__ == "__main__":
    main()
