"""Vorschlag für gleich große Figuren in allen Schleifen (D-500).

Ohne `--massstab`: je Übung der größte Maßstab (Pixel je Meter an der Mitte der Figur), bei dem die
Figur in jedem Bild der Schleife mit 4 % Rand ganz ins Bild 720 × 540 passt; Kamera in Richtung und
Neigung unverändert, die Bildmitte auf der Figur statt auf Figur und Gerät. Mit `--massstab S` die
Kamera jeder Übung für diesen gemeinsamen Maßstab (Ziel und Abstand), Lage der Figur und der Geräte
im Bild; Geräte dürfen angeschnitten sein, die Figur nie. Mit `--bild ordner` dazu ein Standbild
(Mitte der Schleife) mit dieser Kamera. Ausgabe JSON je Zeile.

    <python mit bpy> -I -u tools/uebungen-3d/figur_vorschlag.py [--massstab S] [--bild ordner] <übung> …
"""
import json
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import bpy  # noqa: E402
import numpy as np  # noqa: E402
from mathutils import Vector  # noqa: E402

import render  # noqa: E402
import szene  # noqa: E402
from figur_messen import B, H, F_PX, figur_objekte, punkte, projiziert  # noqa: E402

RAND_X, RAND_Y = 0.04 * B, 0.04 * H  # Mindestabstand der Figur zum Bildrand

args = sys.argv[1:]
massstab = None
bildordner = None
if "--massstab" in args:
    i = args.index("--massstab")
    massstab = float(args[i + 1])
    del args[i:i + 2]
if "--bild" in args:
    i = args.index("--bild")
    bildordner = args[i + 1]
    del args[i:i + 2]


def kamera_setzen(u, ziel, abstand):
    for o in [o for o in bpy.data.objects if o.type in ("CAMERA", "LIGHT")]:
        bpy.data.objects.remove(o)
    e = math.radians(u.kamera["neigung"])
    szene.licht_und_kamera(ziel, u.kamera["richtung"], abstand * math.cos(e), abstand * math.sin(e),
                           kantenlicht=getattr(u, "kantenlicht", True))
    # Sonst ist `matrix_world` der neuen Kamera noch die Einheitsmatrix.
    bpy.context.view_layer.update()
    return bpy.context.scene.camera


def richtung(u):
    w, e = math.radians(u.kamera["richtung"]), math.radians(u.kamera["neigung"])
    r = Vector((math.sin(w) * math.cos(e), -math.cos(w) * math.cos(e), math.sin(e)))
    rechts = Vector((0, 0, 1)).cross(r).normalized()
    oben = r.cross(rechts).normalized()
    return r, rechts, oben


def einpassen(u, P, S):
    """Ziel und Abstand für Maßstab S, Figur (alle Punkte P) in der Bildmitte."""
    r, rechts, oben = richtung(u)
    mitte = Vector(P.mean(axis=0))
    abstand = F_PX / S
    ziel = mitte
    for _ in range(3):
        C = ziel + r * abstand
        v = P - np.array(C)
        tiefe = -(v @ np.array(r))
        xs = (v @ np.array(rechts)) / tiefe
        ys = (v @ np.array(oben)) / tiefe
        cx, cy = (xs.max() + xs.min()) / 2, (ys.max() + ys.min()) / 2
        ziel = ziel + rechts * float(cx) * abstand + oben * float(cy) * abstand
    return ziel, abstand


def box(cam, P):
    x, y, _ = projiziert(cam, P)
    return float(x.min()), float(y.min()), float(x.max()), float(y.max())


def passt(b):
    return b[0] >= RAND_X and b[1] >= RAND_Y and b[2] <= B - RAND_X and b[3] <= H - RAND_Y


for name in args:
    s, u, rahmen = render.baue(name, B, H, 24 if bildordner else 1, variante=render.FIGUR)
    render.kamera(u, rahmen, "standard", B, H)
    alt_cam = s.camera
    figur = figur_objekte(u)
    geraet = [o for o in bpy.data.objects if o.type == "MESH" and o not in figur and o.name != "Boden"
              and not o.hide_render]
    alle = []
    for bild in range(0, render.BILDER, 2):
        u.setzen(render.ablauf(bild, render.BILDER, **getattr(u, "ablauf", {})))
        alle.append(punkte(figur)[::7])
    P = np.concatenate(alle)
    bpy.context.view_layer.update()
    alt_tiefe = float(projiziert(alt_cam, P.mean(axis=0)[None, :])[2][0])
    alt_box = box(alt_cam, P)
    alt_S = F_PX / alt_tiefe
    if massstab is None:
        lo, hi = alt_S * 0.5, alt_S * 2.5
        for _ in range(30):
            mid = (lo + hi) / 2
            ziel, abstand = einpassen(u, P, mid)
            cam = kamera_setzen(u, ziel, abstand)
            if passt(box(cam, P)):
                lo = mid
            else:
                hi = mid
        print(json.dumps({"uebung": name, "massstab_jetzt": round(alt_S, 1), "massstab_hoechstens": round(lo, 1),
                          "box_jetzt": [round(v, 1) for v in alt_box]}), flush=True)
        continue
    ziel, abstand = einpassen(u, P, massstab)
    cam = kamera_setzen(u, ziel, abstand)
    b = box(cam, P)
    # Geräte: Anteil der Hüllquader-Ecken außerhalb des Bilds, über die Bewegung
    gx, gy = [], []
    for p in (0.0, 0.5, 1.0):
        u.setzen(p)
        bpy.context.evaluated_depsgraph_get().update()
        for o in geraet:
            ecken = np.array([list(o.matrix_world @ Vector(c)) for c in o.bound_box])
            x, y, z = projiziert(cam, ecken)
            gx += list(x[z > 0])
            gy += list(y[z > 0])
    print(json.dumps({
        "uebung": name, "massstab": massstab, "faktor": round(massstab / alt_S, 3),
        "figur_box_px": [round(v, 1) for v in b], "figur_hoehe_px": round(b[3] - b[1], 1),
        "figur_passt": passt(b),
        "geraet_box_px": [round(min(gx), 1), round(min(gy), 1), round(max(gx), 1), round(max(gy), 1)] if gx else None,
        "kamera": {"ziel": [round(v, 3) for v in ziel], "abstand": round(abstand, 3)},
    }), flush=True)
    if bildordner:
        u.setzen(render.ablauf(render.BILDER // 2, render.BILDER, **getattr(u, "ablauf", {})))
        s.render.filepath = f"{bildordner}/{name}.png"
        bpy.ops.render.render(write_still=True)
