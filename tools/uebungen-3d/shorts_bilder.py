"""Nahaufnahme der Shorts mit dem Abstand zwischen Shorts-F und Seitenstreifen (D-461), je Pilot-Übung:

    python -I tools/uebungen-3d/shorts_bilder.py kniebeuge bankdruecken latziehen --arbeit <ordner>

Je Übung wird über alle 60 Bilder der Schleife gemessen (`kleidung.f_streifen_abstand`); die Nahaufnahme zeigt das
Bild mit dem kleinsten Abstand, die Kamera senkrecht auf den Stoff zwischen F und Streifen. Schreibt
`shorts-<übung>.png` (480 × 480) und `shorts-<übung>.json` mit Abstand, Bild der Schleife und der Lage der beiden
nächsten Punkte im Bild (Pixel), damit das Blatt die gemessene Strecke einzeichnen kann.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

HIER = Path(__file__).resolve().parent
sys.path.insert(0, str(HIER))

import bpy  # noqa: E402
from bpy_extras.object_utils import world_to_camera_view  # noqa: E402

import kleidung  # noqa: E402
import render  # noqa: E402
import szene  # noqa: E402
from haltung import ablauf  # noqa: E402

G = 480


def nahaufnahme(name: str, ziel: Path) -> dict:
    s, u, _ = render.baue(name, G, G, 40, variante=render.FIGUR)
    hose = bpy.data.objects["Shorts"]
    werte = []
    for bild in range(render.BILDER):
        u.setzen(ablauf(bild, render.BILDER))
        werte.append((kleidung.f_streifen_abstand(hose)["abstand_cm"], bild))
    kleinster, bild = min(werte)
    u.setzen(ablauf(bild, render.BILDER))
    m = kleidung.f_streifen_abstand(hose)
    f_p, s_p = m["f_punkt"], m["streifen_punkt"]
    mitte = (f_p + s_p) / 2
    # Blick senkrecht auf den Stoff: Normale der Shorts am F (verformt)
    deps = bpy.context.evaluated_depsgraph_get()
    ev = hose.evaluated_get(deps)
    em = ev.to_mesh()
    from mathutils.bvhtree import BVHTree

    welt = [ev.matrix_world @ v.co for v in em.vertices]
    bvh = BVHTree.FromPolygons(welt, [list(f.vertices) for f in em.polygons])
    ev.to_mesh_clear()
    _, n, _, _ = bvh.find_nearest(mitte, 0.05)
    if n.dot(mitte - u.rig.welt(u.rig.punkt("upperleg02.L", u.rig.kopf["upperleg02.L"]))) < 0:
        n = -n
    import math

    a = 0.42
    richtung = math.degrees(math.atan2(n.x, -n.y))
    waag = math.hypot(n.x, n.y)
    for o in [o for o in bpy.data.objects if o.type in ("CAMERA", "LIGHT")]:
        bpy.data.objects.remove(o)
    cam = szene.licht_und_kamera(mitte, richtung, a * max(waag, 0.2), a * n.z)
    s.render.filepath = str(ziel / f"shorts-{name}.png")
    bpy.ops.render.render(write_still=True)
    pixel = {}
    for schluessel, p in (("f", f_p), ("streifen", s_p)):
        c = world_to_camera_view(bpy.context.scene, cam, p)
        pixel[schluessel] = (round(c.x * G, 1), round((1 - c.y) * G, 1))
    alle = [w for w, _ in werte]
    return {"uebung": name, "abstand_cm": kleinster, "bild": bild, "groesster_cm": max(alle), "pixel": pixel}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("uebungen", nargs="+")
    ap.add_argument("--arbeit", required=True)
    args = ap.parse_args()
    ziel = Path(args.arbeit)
    ziel.mkdir(parents=True, exist_ok=True)
    for name in args.uebungen:
        werte = nahaufnahme(name, ziel)
        (ziel / f"shorts-{name}.json").write_text(json.dumps(werte, ensure_ascii=False, indent=1), encoding="utf-8")
        print(name, werte)


if __name__ == "__main__":
    main()
