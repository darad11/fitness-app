"""Nahaufnahmen für die Prüfseite einer Familie (Phase Programme, Abschnitt 2 des Auftrags
`docs/prompts/programme-ganzkoerper-FORM.md`, D-462): Griff der linken Hand in Ausgangs- und Endposition, von der
Handfläche und vom Handrücken, quer zum Griff gesehen (die Köpfe der Hanteln stehen dann nicht davor).

    python -I tools/uebungen-3d/familie_bilder.py bankdruecken_kh <ordner>

Schreibt `pruef-griff-handflaeche-<Phase>.png` und `pruef-griff-handruecken-<Phase>.png` (360 × 360 Pixel) in
`<ordner>/<übung>/`, passend zu den Prüfansichten aus `render.py <übung> --pruefen` und zur Prüfseite
`tools/uebungen_pruef_bild.py --familie`. Eine Übung kann eigene Ansichten nennen (`griff_ansichten`, D-464; die
Beinpresse: `aussen` und `oben`).
"""
from __future__ import annotations

import sys
from pathlib import Path

HIER = Path(__file__).resolve().parent
sys.path.insert(0, str(HIER))

import bpy  # noqa: E402
from mathutils import Vector  # noqa: E402

import render  # noqa: E402
import szene  # noqa: E402
from uebungen import _netz  # noqa: E402

G = 360
# Richtung, Neigung (Grad): Handfläche von der Seite der Füße und von oben, Handrücken von der Seite des Kopfes
GRIFF = (("handflaeche", 0.0, 40.0), ("handruecken", 180.0, 35.0))


def griff(name: str, ziel: Path) -> None:
    s, u, _ = render.baue(name, G, G, 32, variante=render.FIGUR)
    for p in (0.0, 1.0):
        u.setzen(p)
        rig = u.rig
        hand = rig.welt(rig.punkt("wrist.L", rig.kopf["metacarpal2.L"]))
        punkte = [q for q in _netz(u.koerper) if (q - hand).length < 0.10]
        for datei, richtung, neigung in getattr(u, "griff_ansichten", GRIFF):
            for o in [o for o in bpy.data.objects if o.type in ("CAMERA", "LIGHT")]:
                bpy.data.objects.remove(o)
            z, abstand, h = szene.bildausschnitt(punkte + [hand + Vector((0.09, 0, 0)), hand - Vector((0.09, 0, 0))],
                                                 richtung, neigung, G, G, rand=0.06)
            szene.licht_und_kamera(z, richtung, abstand, h)
            s.render.filepath = str(ziel / f"pruef-griff-{datei}-{p:.2f}.png")
            bpy.ops.render.render(write_still=True)


def main() -> None:
    name, ordner = sys.argv[1], Path(sys.argv[2])
    ziel = ordner / name
    ziel.mkdir(parents=True, exist_ok=True)
    griff(name, ziel)
    print(f"{name}: Griffbilder in {ziel}")


if __name__ == "__main__":
    main()
