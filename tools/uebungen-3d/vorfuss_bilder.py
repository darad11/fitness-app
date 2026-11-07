"""Nahaufnahmen des linken Fußes beim Unterarmstütz (D-467): Der Schuh biegt sich im Vorfuß mit den Zehen.

Aufruf mit dem Python von Blender als Modul, wie `render.py`:

    python -I tools/uebungen-3d/vorfuss_bilder.py <ordner>                                  # Stand dieses Baums
    python -I tools/uebungen-3d/vorfuss_bilder.py <ordner> --quelle <baum>/tools/uebungen-3d  # anderer Stand, etwa vorher

Figur der App (`render.FIGUR`) in Phase 0, Licht wie in der App. Ansichten von außen, Ballen und Biegung aus
der Nähe, schräg von vorn außen und schräg von hinten außen; die Kamera richtet sich nach dem Schuh und der Lage
des Körpers, damit vorher und nachher gleich gerahmt sind. `vorfuss.json` hält Laufzeiten und Messwerte
(`render.messen`). Das Blatt setzt `tools/uebungen_korrektur_bild.py --runde 11` zusammen.
"""
from __future__ import annotations

import argparse
import json
import math
import sys
import time
from pathlib import Path

HIER = Path(__file__).resolve().parent

# Name, Seite der Kamera (aussen, vorn = zum Kopf, hinten = zu den Füßen), waagrechter Abstand und Höhe über dem
# Ziel (m), Brennweite (mm), Ziel („schuh“ = Mitte des Schuhs, „ballen“ = über der Auflage der Sohle zur Ferse hin,
# wo sich der Schuh biegt)
ANSICHTEN = (("aussen", (1.0, 0.0), 0.95, 0.00, 60.0, "schuh"),
             ("ballen", (1.0, 0.0), 0.48, 0.00, 60.0, "ballen"),
             ("vorn-aussen", (1.0, -1.0), 0.90, 0.10, 60.0, "schuh"),
             ("hinten-aussen", (1.0, 1.0), 0.95, 0.20, 60.0, "schuh"))


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("ordner")
    ap.add_argument("--quelle", default=str(HIER), help="Ordner mit render.py und den übrigen Modulen")
    ap.add_argument("--proben", type=int, default=48)
    args = ap.parse_args()
    sys.path.insert(0, args.quelle)
    import bpy
    from mathutils import Vector

    import render
    import schuhe
    import szene
    from uebungen import _netz

    ziel = Path(args.ordner)
    ziel.mkdir(parents=True, exist_ok=True)
    t0 = time.time()
    s, u, _ = render.baue("unterarmstuetz", 720, 540, args.proben, variante=render.FIGUR)
    u.setzen(0.0)
    zeiten = {"Aufbau": round(time.time() - t0, 1)}
    m = render.messen(u)
    m.pop("_fuss", None)
    werte = {k: round(v, 2) for k, v in {**u.werte, **m}.items() if isinstance(v, (int, float))}

    schuh = [q for q in schuhe._verformt(bpy.data.objects["Schuhe"])[0] if q.x > 0]
    sohle = [q for q in schuhe._verformt(bpy.data.objects["Sohle"])[0] if q.x > 0]
    lo = Vector((min(q.x for q in schuh), min(q.y for q in schuh), min(q.z for q in schuh)))
    hi = Vector((max(q.x for q in schuh), max(q.y for q in schuh), max(q.z for q in schuh)))
    boden = min(q.z for q in sohle)
    auflage = [q for q in sohle if q.z < boden + 0.004]
    # Richtung zu den Füßen (vom Körper weg), waagrecht; außen = +x am linken Fuß
    netz = _netz(u.koerper)
    hinten = (lo + hi) / 2 - sum(netz, Vector()) / len(netz)
    hinten.z = 0.0
    hinten.normalize()
    ziele = {"schuh": (lo + hi) / 2, "ballen": sum(auflage, Vector()) / len(auflage) + hinten * 0.03 + Vector((0, 0, 0.035))}
    aussen = Vector((1.0, 0.0, 0.0))
    for name, (a, h), abstand, hoehe, brennweite, wo in ANSICHTEN:
        t1 = time.time()
        d = (aussen * a + hinten * h).normalized()
        for o in [o for o in bpy.data.objects if o.type in ("CAMERA", "LIGHT")]:
            bpy.data.objects.remove(o)
        szene.licht_und_kamera(ziele[wo], math.degrees(math.atan2(d.x, -d.y)), abstand, hoehe, brennweite=brennweite)
        s.render.filepath = str(ziel / f"vorfuss-{name}.png")
        bpy.ops.render.render(write_still=True)
        zeiten[name] = round(time.time() - t1, 1)
    (ziel / "vorfuss.json").write_text(json.dumps({"zeiten": zeiten, "messwerte": werte}, ensure_ascii=False, indent=1),
                                       encoding="utf-8")
    print("Vorfuß-Bilder", ziel, zeiten)


if __name__ == "__main__":
    main()
