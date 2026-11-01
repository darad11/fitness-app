"""Größe der Figur in den Schleifen, mit der Kamera der Schleife (D-500).

Je Übung: Szene wie `render.py` (Figur mit Kleidung und Schuhen), Kamera `standard`, dann für jedes
zweite Bild der Schleife alle Eckpunkte der Figur (Körper, Kleidung, Schuhe: Netze am Skelett) in
das Bild 720 × 540 projiziert; dazu die Hüllquader der Geräte. Maßstab: Pixel je Meter an der Mitte
der Figur (Brennweite 50 mm auf 36 mm Sensorbreite, also 1.000 px geteilt durch die Tiefe). Ausgabe
JSON je Zeile.

    <python mit bpy> -I -u tools/uebungen-3d/figur_messen.py <übung> …
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import bpy  # noqa: E402
import numpy as np  # noqa: E402
from bpy_extras.object_utils import world_to_camera_view  # noqa: E402
from mathutils import Vector  # noqa: E402

import render  # noqa: E402

B, H = 720, 540
F_PX = B * 50.0 / 36.0  # Brennweite 50 mm auf 36 mm Sensorbreite


def figur_objekte(u):
    return [o for o in bpy.data.objects if o.type == "MESH" and not o.hide_render and any(
        m.type == "ARMATURE" and m.object == u.skelett for m in o.modifiers)]


def punkte(objs):
    """Eckpunkte der Netze in Weltkoordinaten (n × 3), Körper ohne Glättung wie `_netz`."""
    for o in objs:
        sub = o.modifiers.get("Glatt")
        if sub:
            sub.show_viewport = False
    deps = bpy.context.evaluated_depsgraph_get()
    deps.update()
    teile = []
    for o in objs:
        ev = o.evaluated_get(deps)
        me = ev.to_mesh()
        co = np.empty(len(me.vertices) * 3)
        me.vertices.foreach_get("co", co)
        co = co.reshape(-1, 3)
        mw = np.array(ev.matrix_world)
        teile.append(co @ mw[:3, :3].T + mw[:3, 3])
        ev.to_mesh_clear()
    for o in objs:
        sub = o.modifiers.get("Glatt")
        if sub:
            sub.show_viewport = True
    return np.concatenate(teile)


def projiziert(cam, pkte):
    """Pixel (x nach rechts, y nach unten) und Tiefe vor der Kamera."""
    inv = np.array(cam.matrix_world.inverted())
    c = pkte @ inv[:3, :3].T + inv[:3, 3]
    z = -c[:, 2]
    x = B / 2 + F_PX * c[:, 0] / z
    y = H / 2 - F_PX * c[:, 1] / z
    return x, y, z


if __name__ == "__main__":
    for name in sys.argv[1:]:
        s, u, rahmen = render.baue(name, B, H, 1, variante=render.FIGUR)
        render.kamera(u, rahmen, "standard", B, H)
        cam = s.camera
        figur = figur_objekte(u)
        geraet = [o for o in bpy.data.objects if o.type == "MESH" and o not in figur and o.name != "Boden"
                  and not o.hide_render]
        alle_x, alle_y, hoehen, breiten, mitten_tiefe = [], [], [], [], []
        for bild in range(0, render.BILDER, 2):
            u.setzen(render.ablauf(bild, render.BILDER, **getattr(u, "ablauf", {})))
            f = punkte(figur)
            xs, ys, ts = projiziert(cam, f)
            if bild == 0:
                # Gegenprobe der Projektion mit Blender
                q = world_to_camera_view(s, cam, Vector(f[0]))
                assert abs(q.x * B - xs[0]) < 0.05 and abs((1 - q.y) * H - ys[0]) < 0.05, (q, xs[0], ys[0])
            alle_x += [float(xs.min()), float(xs.max())]
            alle_y += [float(ys.min()), float(ys.max())]
            hoehen.append(float(ys.max() - ys.min()))
            breiten.append(float(xs.max() - xs.min()))
            mitte = f.mean(axis=0)
            mitten_tiefe.append(float(projiziert(cam, mitte[None, :])[2][0]))
        # Geräte (Hüllquader, über die Bewegung wie `rahmenpunkte`)
        gx, gy = [], []
        for p in (0.0, 0.5, 1.0):
            u.setzen(p)
            bpy.context.evaluated_depsgraph_get().update()
            for o in geraet:
                ecken = np.array([list(o.matrix_world @ Vector(c)) for c in o.bound_box])
                x, y, z = projiziert(cam, ecken)
                gx += list(x[z > 0])
                gy += list(y[z > 0])
        tiefe = sum(mitten_tiefe) / len(mitten_tiefe)
        print(json.dumps({
            "uebung": name,
            "kamera": {"richtung": u.kamera["richtung"], "neigung": u.kamera["neigung"],
                       "ort": [round(v, 3) for v in cam.location]},
            "tiefe_figur_m": round(tiefe, 3),
            "massstab_px_je_m": round(F_PX / tiefe, 1),
            "figur_box_px": [round(min(alle_x), 1), round(min(alle_y), 1), round(max(alle_x), 1), round(max(alle_y), 1)],
            "figur_hoehe_px": [round(min(hoehen), 1), round(max(hoehen), 1)],
            "figur_breite_px": [round(min(breiten), 1), round(max(breiten), 1)],
            "geraet_box_px": [round(min(gx), 1), round(min(gy), 1), round(max(gx), 1), round(max(gy), 1)] if gx else None,
            "figur_objekte": sorted(o.name for o in figur),
            "geraet_objekte": len(geraet),
        }), flush=True)
