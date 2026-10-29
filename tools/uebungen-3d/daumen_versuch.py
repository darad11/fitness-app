"""Versuch D-445: Daumen mit zwei Hebeln und einer Folgeänderung prüfen, ohne den Stand der Werkzeuge zu ändern.

Nachricht des Produktinhabers nach Korrekturrunde 5: ein letzter, gezielter Versuch mit zwei Hebeln, einzeln und
kombiniert. Die Schalter wirken nur in diesem Aufruf; `rig.py`, `koerperform.py` und die Übungen bleiben, wie sie
sind. Übernommen hat der Produktinhaber nur das Nachklappen des Endglieds (D-446).

Hebel 1  --finger-lang W   Formziele `hands/l-hand-fingers-length-incr` und `hands/r-hand-fingers-length-incr`
                           von MakeHuman (MPFB2, CC0) mit Gewicht W für C männlich (geprüft 0,3 und 0,5)
Hebel 2  --lage T          Lage der Stange in der Hand (Anteil Handgelenk → Fingeransatz) statt des Werts der
                           Übung (Bankdrücken 0,68, Kniebeuge 0,6, Latziehen 0,72)
         --einsinken M     Einsinken der Stange in die Handfläche in m (statt 0,009)
Folge    --daumen-seit M   Grundgelenk des Daumens axial neben dem Sattelgelenk in m (statt +0,004; negativ =
                           zum Zeigefinger hin)
         --ohne-kuppe      Endglied nicht nachklappen (Stand D-440). Seit D-446 klappt `rig.py` das Endglied
                           selbst um das Endgelenk zur Stange, bis die zur Kuppe hin dünnere Beere aufliegt; in
                           D-445 hieß das Prüfen dieses Schritts `--kuppe-klappen`

    python -I tools/uebungen-3d/daumen_versuch.py messen bankdruecken
    python -I tools/uebungen-3d/daumen_versuch.py messen bankdruecken --ohne-kuppe --finger-lang 0.5
    python -I tools/uebungen-3d/daumen_versuch.py bilder /tmp/d445/hebel1 bank --ohne-kuppe --finger-lang 0.5
    python -I tools/uebungen-3d/daumen_versuch.py stand bankdruecken 0.0 /tmp/d445/hebel1 --ohne-kuppe --finger-lang 0.5

`messen` (rechte Hand, Grundhaltung der Hand im Rahmen der Stange, Winkel 0 zur Handfläche):
- `silhouette`: Blick entlang der Stange; je 2° Winkel die innerste Haut von Grund- und Endglied des Daumens gegen
  die äußerste Fingerhaut (Finger 2 bis 5, alle axialen Lagen); ein Wert über 0 ist von der Seite als Spalt
  zu sehen (Mittel der positiven Werte, größter Wert, Anteil über 1 mm, Verlauf)
- `oben_seitlich_mm`: Haut des Grund- und Endglieds axial über die Außenkante des Zeigefingers hinaus
- `durchdringen`: Fingerhaut näher als 7,5 mm an den Daumenknochen und umgekehrt (Anzahl Eckpunkte)
- `fingerspitzen_phi`: Winkel der Fingerspitzen um die Stange; `handgelenk`: Knick in Ausgangs- und Endposition
`bilder`: Nahaufnahmen wie `nahaufnahme.py` (Umkreis 6,5 bzw. 7 cm um das linke Handgelenk, Scheiben
ausgeblendet), `bank` fünf Ansichten, `knie` und `lat` je zwei, `hand` die offene Hand von innen und außen.
`stand`: Standbild wie in der App (`varianten_bilder.py`, 720 × 540, 40 Proben).
`handkiste <ordner>`: Kiste der Hand im Standbild wie in der App (720 × 540) für Kniebeuge unten, Bankdrücken am
Start und Latziehen unten, je die größere der beiden Hände, als `<ordner>/hand.json` für das Blatt D-445.
"""
from __future__ import annotations

import argparse
import json
import math
import sys
import time
from dataclasses import replace
from pathlib import Path

HIER = Path(__file__).resolve().parent
sys.path.insert(0, str(HIER))

import koerperform  # noqa: E402
import rig as rigmod  # noqa: E402

FINGERZIELE = ("hands/l-hand-fingers-length-incr", "hands/r-hand-fingers-length-incr")


def hebel_setzen(a: argparse.Namespace) -> dict:
    """Schalter anwenden, bevor eine Übung gebaut wird; gibt die gesetzten Werte zurück."""
    gesetzt = {}
    if a.finger_lang:
        f = koerperform.FORMEN["maennlich"]
        f = replace(f, zusatz={**f.zusatz, **{z: a.finger_lang for z in FINGERZIELE}})
        koerperform.FORMEN["maennlich"] = f
        koerperform.hole([f])
        gesetzt["finger_lang"] = a.finger_lang
    if a.lage is not None or a.einsinken is not None:
        alt = rigmod.Rig.griff

        def griff(self, seite, t, radius, daumen=True, schraeg=0.0, einsinken=rigmod.EINSINKEN):
            return alt(self, seite, a.lage if a.lage is not None else t, radius, daumen, schraeg,
                       a.einsinken if a.einsinken is not None else einsinken)

        rigmod.Rig.griff = griff
        gesetzt.update({k: v for k, v in (("lage", a.lage), ("einsinken", a.einsinken)) if v is not None})
    if a.daumen_seit is not None:
        rigmod.DAUMEN_SEIT = a.daumen_seit
        gesetzt["daumen_seit"] = a.daumen_seit
    if a.ohne_kuppe:
        rigmod.DAUMEN_KUPPE_KLAPPEN = False
        gesetzt["ohne_kuppe"] = True
    return gesetzt


def messen(uebung: str, gesetzt: dict) -> dict:
    import numpy as np
    from mathutils import Matrix

    import render

    s, u, _ = render.baue(uebung, 64, 64, 4, variante="Cm-A1")
    rig = u.rig
    seite = "R"
    g = u.griff[seite]
    k = rig.koerper
    achse, zyl, _ = rig._stangenrahmen(seite, g)
    rig.zuruecksetzen()
    rig.finger_setzen(seite, g, Matrix.Identity(4))
    rig.anwenden()
    netz = rig._verformt()
    namen = {gr.index: gr.name for gr in k.vertex_groups}
    gruppen: dict[str, list] = {}
    for v, p in zip(k.data.vertices, netz):
        best = max(((gg.weight, namen[gg.group]) for gg in v.groups if namen[gg.group].endswith("." + seite)), default=(0, ""))
        if best[0] > 0.4 and best[1].startswith("finger"):
            gruppen.setdefault(best[1].split(".")[0], []).append(p)
    Z = {n: np.array([zyl(p) for p in pts]) for n, pts in gruppen.items()}
    daumen = np.concatenate([Z[n] for n in ("finger1-2", "finger1-3") if n in Z])
    finger = np.concatenate([Z[n] for n in Z if n.startswith(("finger2-", "finger3-", "finger4-", "finger5-"))])

    def zellen(ph):
        return ((np.degrees(ph) % 360) / 2).astype(int)

    zd, zf = zellen(daumen[:, 2]), zellen(finger[:, 2])
    luecke = []
    for z in sorted(set(zd.tolist())):
        nachbarn = np.isin(zf, [(z + o) % 180 for o in (-1, 0, 1)])
        if nachbarn.any():
            luecke.append((z * 2, float((daumen[zd == z, 1].min() - finger[nachbarn, 1].max()) * 1000)))
    lw = np.array([x[1] for x in luecke])
    erg = {"uebung": uebung, "hebel": gesetzt}
    erg["silhouette"] = {"mittel_mm": round(float(np.clip(lw, 0, None).mean()), 1), "max_mm": round(float(lw.max()), 1),
                         "anteil_ueber_1mm": round(float((lw > 1).mean()), 2),
                         "verlauf": [[a, round(w, 1)] for a, w in luecke[::3]]}
    aussen = 1.0 if np.median(Z["finger2-1"][:, 0]) > np.median(Z["finger5-1"][:, 0]) else -1.0
    kante = max((Z[n][:, 0] * aussen).max() for n in Z if n.startswith("finger2-"))
    erg["oben_seitlich_mm"] = {gl: round(float(((Z[gl][:, 0] * aussen).max() - kante) * 1000), 1) for gl in ("finger1-2", "finger1-3") if gl in Z}

    def knochen(n):
        return rig.punkt(f"{n}.{seite}", rig.kopf[f"{n}.{seite}"]), rig.punkt(f"{n}.{seite}", rig.ende[f"{n}.{seite}"])

    def abstand(p, strecken):
        best = 1.0
        for a_, b_ in strecken:
            dv = b_ - a_
            t = max(0.0, min(1.0, (p - a_).dot(dv) / dv.length_squared))
            best = min(best, (p - (a_ + dv * t)).length)
        return best

    dk = [knochen("finger1-2"), knochen("finger1-3")]
    fk = [knochen(f"{f}-{i}") for f in ("finger2", "finger3") for i in (1, 2, 3)]
    fh = [p for n in gruppen if n.startswith(("finger2-", "finger3-")) for p in gruppen[n]]
    dh = [p for n in ("finger1-2", "finger1-3") for p in gruppen.get(n, [])]
    erg["durchdringen"] = {"fingerhaut_am_daumenknochen": sum(1 for p in fh if abstand(p, dk) < 0.0075),
                           "daumenhaut_am_fingerknochen": sum(1 for p in dh if abstand(p, fk) < 0.0075)}
    d = g.finger["finger1"]
    erg["daumen"] = {"r_mm": [round(zyl(p)[1] * 1000, 1) for p in d["punkte"]], "phi": [round(math.degrees(zyl(p)[2]) % 360) for p in d["punkte"]]}
    spitzen = {}
    for f in ("finger2", "finger3", "finger4", "finger5"):
        pk = rig._fingerpunkte(rig._kette(seite, f), achse, g.finger[f], g.finger.get("_spreiz_" + f + seite))
        spitzen[f] = round(math.degrees(zyl(pk[6])[2]) % 360)
    erg["fingerspitzen_phi"] = spitzen
    erg["handgelenk"] = {}
    for phase in (0.0, 1.0):
        u.setzen(phase)
        erg["handgelenk"][f"{phase:.1f}"] = round(float(u.werte.get("Handgelenk geknickt", float("nan"))), 1)
    return erg


ANSICHTEN = {
    "bank": ("bankdruecken", 0.0, [("griff-vorn", 0.065, 0, 15), ("griff-seite", 0.065, 90, 25), ("griff-oben", 0.065, 0, 80),
                                   ("griff-schraeg", 0.065, 40, 35), ("griff-kopf", 0.065, 180, 15)]),
    "knie": ("kniebeuge", 1.0, [("griff-knie", 0.07, 120, 15), ("griff-knie-vorn", 0.07, 60, 20)]),
    "lat": ("latziehen", 1.0, [("griff-lat", 0.07, 60, 20), ("griff-lat-seite", 0.07, 100, 10)]),
    "hand": ("kniebeuge", None, [("hand-innen", 0.12, 90, 0), ("hand-aussen", 0.12, -90, 0)]),
}


def bilder(ziel: Path, art: str, groesse: int, proben: int) -> None:
    import bpy

    import render
    import szene
    from uebungen import _netz

    ziel.mkdir(parents=True, exist_ok=True)
    uebung, phase, kameras = ANSICHTEN[art]
    s, u, _ = render.baue(uebung, groesse, groesse, proben, variante="Cm-A1")
    if phase is None:  # offene Hand in der Grundhaltung, ohne Stange
        u.rig.zuruecksetzen()
        u.rig.anwenden()
        for o in bpy.data.objects:
            if o.type == "MESH" and o != u.koerper and ("Stange" in o.name or o.name.startswith(("Scheibe", "Hantel"))):
                o.hide_render = True
    else:
        u.setzen(phase)
        for o in bpy.data.objects:
            if o.name.startswith("Scheibe"):
                o.hide_render = True
    for name, radius, richtung, neigung in kameras:
        t1 = time.time()
        mitte = u.rig.welt(u.rig.punkt("wrist.L", u.rig.kopf["wrist.L"]))
        if phase is None:
            mitte = (mitte + u.rig.welt(u.rig.punkt("finger3-3.L", u.rig.ende["finger3-3.L"]))) / 2
        nah = [p for p in _netz(u.koerper) if (p - mitte).length < radius]
        for o in [o for o in bpy.data.objects if o.type in ("CAMERA", "LIGHT")]:
            bpy.data.objects.remove(o)
        z, abstand, h = szene.bildausschnitt(nah, richtung, neigung, groesse, groesse, rand=0.04)
        szene.licht_und_kamera(z, richtung, abstand, h, kantenlicht=getattr(u, "kantenlicht", True))
        s.render.filepath = str(ziel / f"{name}.png")
        bpy.ops.render.render(write_still=True)
        print(f"geschrieben: {name}.png ({time.time() - t1:.0f} s)", flush=True)


def handkiste(ordner: Path) -> dict:
    import bpy
    from bpy_extras.object_utils import world_to_camera_view

    import render

    erg = {}
    for uebung, phase in (("kniebeuge", 1.0), ("bankdruecken", 0.0), ("latziehen", 1.0)):
        b, h = 720, 540
        s, u, punkte = render.baue(uebung, b, h, 4, variante="Cm-A1")
        render.kamera(u, punkte, "standard", b, h)
        u.setzen(phase)
        bpy.context.view_layer.update()
        szene = bpy.context.scene
        k = u.koerper
        obj = k.evaluated_get(bpy.context.evaluated_depsgraph_get())
        netz = obj.to_mesh()
        namen = {gr.index: gr.name for gr in k.vertex_groups}
        kisten = []
        for seite in ("L", "R"):
            xy = []
            for v, mv in zip(k.data.vertices, netz.vertices):
                if any(gg.weight > 0.5 and namen[gg.group].endswith("." + seite) and namen[gg.group].startswith(("finger", "metacarpal"))
                       for gg in v.groups):
                    q = world_to_camera_view(szene, szene.camera, obj.matrix_world @ mv.co)
                    xy.append((q.x * b, (1 - q.y) * h))
            if xy:
                kisten.append([min(x for x, _ in xy), min(y for _, y in xy), max(x for x, _ in xy), max(y for _, y in xy)])
        obj.to_mesh_clear()
        erg[uebung] = [round(w, 1) for w in max(kisten, key=lambda k_: (k_[2] - k_[0]) * (k_[3] - k_[1]))]
    ordner.mkdir(parents=True, exist_ok=True)
    (ordner / "hand.json").write_text(json.dumps(erg), encoding="utf-8")
    return erg


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("befehl", choices=("messen", "bilder", "stand", "handkiste"))
    ap.add_argument("werte", nargs="*")
    ap.add_argument("--finger-lang", type=float, default=0.0)
    ap.add_argument("--lage", type=float)
    ap.add_argument("--einsinken", type=float)
    ap.add_argument("--daumen-seit", type=float)
    ap.add_argument("--ohne-kuppe", action="store_true", help="Endglied nicht nachklappen (Stand D-440)")
    ap.add_argument("--groesse", type=int, default=560)
    ap.add_argument("--proben", type=int, default=24)
    a = ap.parse_args()
    gesetzt = hebel_setzen(a)
    if a.befehl == "messen":
        print(json.dumps(messen(a.werte[0] if a.werte else "bankdruecken", gesetzt), ensure_ascii=False))
    elif a.befehl == "bilder":
        bilder(Path(a.werte[0]), a.werte[1], a.groesse, a.proben)
    elif a.befehl == "handkiste":
        print(json.dumps(handkiste(Path(a.werte[0]))))
    else:
        import varianten_bilder

        sys.argv = ["varianten_bilder.py", "Cm-A1", a.werte[0], a.werte[1], "--arbeit", a.werte[2]]
        varianten_bilder.main()


if __name__ == "__main__":
    main()
