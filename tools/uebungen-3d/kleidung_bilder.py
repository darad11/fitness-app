"""Standbilder der Runde „Kleidung nach dem Design-Board“ (D-453, `docs/prompts/uebungen-kleidung-neu-FORM.md`
Abschnitt 6) in der Figur der App (`render.FIGUR`), Licht und Kantenlicht wie in der App:

    python -I tools/uebungen-3d/kleidung_bilder.py stand <ordner>       # Ruhehaltung von vorn und hinten, orthografisch
    python -I tools/uebungen-3d/kleidung_bilder.py nah <ordner>         # Brust-F, Rücken, Shorts, Socke, Schuh
    python -I tools/uebungen-3d/kleidung_bilder.py handgelenk <ordner>  # Bankdrücken: Handgelenk in fünf Phasen
    python -I tools/uebungen-3d/kleidung_bilder.py griff <ordner>       # Bankdrücken: Griffblatt, Phasen 0 und 0,5
    python -I tools/uebungen-3d/kleidung_bilder.py handgelenk <ordner> --vorher  # Griff im Stand D-451 (vor D-452)

`stand` und `nah` in der Ruhehaltung ohne Geräte (Kniebeuge ohne Stange), `handgelenk` von der Seite längs der
Stange (Scheiben, Hülsen und Verschlüsse ausgeblendet) und vom Fußende. Jeder Befehl schreibt `<befehl>.json`
mit den Laufzeiten, `handgelenk.json` stattdessen mit den Winkeln des Handgelenks je Phase an der Längsachse der
Mittelhand (D-452). Die Blätter setzt `tools/uebungen_korrektur_bild.py --runde 7` zusammen; die Bilder in der
Größe des Players kommen aus `varianten_bilder.py`.
"""
from __future__ import annotations

import json
import sys
import time
from pathlib import Path

HIER = Path(__file__).resolve().parent
sys.path.insert(0, str(HIER))

import bpy  # noqa: E402
from mathutils import Vector  # noqa: E402

import daumen_versuch  # noqa: E402
import kleidung  # noqa: E402
import render  # noqa: E402
import schuhe  # noqa: E402
import szene  # noqa: E402
from uebungen import _netz  # noqa: E402

GERAET = ("Scheibe", "Verschluss", "Griffteil", "Huelse", "Bund", "Langhantel")
HANTEL_ENDEN = ("Scheibe", "Verschluss", "Huelse", "Bund")


def _kamera(ziel: Vector, richtung: float, abstand: float, hoehe: float, brennweite: float = 60.0) -> None:
    for o in [o for o in bpy.data.objects if o.type in ("CAMERA", "LIGHT")]:
        bpy.data.objects.remove(o)
    szene.licht_und_kamera(ziel, richtung, abstand, hoehe, brennweite=brennweite)


def _ruhe(proben: int, breite: int, hoehe: int):
    """Kniebeuge in der Ruhehaltung, ohne Stange: Figur steht in ihrer Grundhaltung auf den Sohlen."""
    s, u, _ = render.baue("kniebeuge", breite, hoehe, proben, variante=render.FIGUR)
    u.rig.zuruecksetzen()
    u.rig.anwenden()
    for o in bpy.data.objects:
        if o.name.startswith(GERAET):
            o.hide_render = True
    return s, u


def stand(ziel: Path) -> dict:
    """Von vorn und von hinten, orthografisch 2 m hoch (wie das Board flach, ohne Fluchtlinien)."""
    s, u = _ruhe(48, 600, 900)
    zeiten = {}
    for richtung, name in ((0, "vorn"), (180, "hinten")):
        t0 = time.time()
        _kamera(Vector((0, 0, 1.0)), richtung, 8.0, 0.0, brennweite=50.0)
        cam = bpy.context.scene.camera
        cam.data.type = "ORTHO"
        cam.data.ortho_scale = 2.0
        s.render.filepath = str(ziel / f"stand-{name}.png")
        bpy.ops.render.render(write_still=True)
        zeiten[name] = round(time.time() - t0, 1)
    return zeiten


def nah(ziel: Path) -> dict:
    """Nahaufnahmen in der Ruhehaltung: Brust-F, Rückenlogo, Shorts von vorn und von der Seite, Socke und
    Schuh von außen, Schuh von innen; Ziel jeweils die Mitte des Logos bzw. des Schuhs."""
    s, u = _ruhe(48, 560, 560)
    V = u.rig.versatz
    m = kleidung.anziehen.mitten
    sohle = [q for q in schuhe._verformt(bpy.data.objects["Sohle"])[0] if q.x > 0]
    schuh = sum(sohle, Vector()) / len(sohle) + Vector((0, 0, 0.045))
    socke = schuhe._socke.mitten["L"] + V
    ansichten = {
        "brust": (m["Brust"] + V, 0, 0.50, 0.04),
        "ruecken": (m["Ruecken"] + V + Vector((0, 0, 0.0)), 180, 0.95, 0.06),
        "shorts-vorn": (m["Beinvorn"] + V + Vector((-0.06, 0, 0.06)), 20, 1.05, 0.10),
        "shorts-seite": (m["Beinvorn"] + V + Vector((0, 0.03, 0.08)), 90, 1.05, 0.06),
        "socke": (socke + Vector((0, 0, -0.04)), 90, 0.62, 0.03),
        "schuh-aussen": (schuh, 90, 0.62, 0.05),
        # von innen steht der rechte Schuh im Weg: näher heran, etwas von oben, weiteres Objektiv
        "schuh-innen": (schuh + Vector((0, 0, 0.02)), 270, 0.40, 0.10, 42.0),
    }
    zeiten = {}
    for name, (punkt, richtung, abstand, hoehe, *brennweite) in ansichten.items():
        t0 = time.time()
        _kamera(punkt, richtung, abstand, hoehe, *brennweite)
        s.render.filepath = str(ziel / f"{name}.png")
        bpy.ops.render.render(write_still=True)
        zeiten[name] = round(time.time() - t0, 1)
    return zeiten


def handgelenk(ziel: Path) -> dict:
    """Bankdrücken, linke Hand mit Unterarm: von der Seite längs der Stange und vom Fußende, Phasen 0 bis 1;
    Winkel des Handgelenks je Phase."""
    G = 480
    s, u, _ = render.baue("bankdruecken", G, G, 32, variante=render.FIGUR)
    for o in bpy.data.objects:
        if o.name.startswith(HANTEL_ENDEN):
            o.hide_render = True
    werte = {}
    for p in (0.0, 0.25, 0.5, 0.75, 1.0):
        u.setzen(p)
        rig = u.rig
        W = rig.welt(rig.punkt("wrist.L", rig.kopf["wrist.L"]))
        E = rig.welt(rig.punkt("lowerarm01.L", rig.kopf["lowerarm01.L"]))
        mitte = W + (W - E).normalized() * 0.02
        punkte = [q for q in _netz(u.koerper) if (q - mitte).length < 0.11]
        werte[f"{p:.2f}"] = {k: round(u.werte[k], 1) for k in u.werte if k.startswith("Handgelenk") and "(" in k}
        for name, richtung, neigung in (("seite", 90, 5), ("fussende", 0, 10)):
            for o in [o for o in bpy.data.objects if o.type in ("CAMERA", "LIGHT")]:
                bpy.data.objects.remove(o)
            z, abstand, h = szene.bildausschnitt(punkte, richtung, neigung, G, G, rand=0.06)
            szene.licht_und_kamera(z, richtung, abstand, h)
            s.render.filepath = str(ziel / f"handgelenk-{name}-{p:.2f}.png")
            bpy.ops.render.render(write_still=True)
    return werte


def griff(ziel: Path) -> dict:
    """Griffblatt Bankdrücken: die Ansichten aus `daumen_versuch.ANSICHTEN["bank"]` in den Phasen 0 und 0,5."""
    G = 480
    s, u, _ = render.baue("bankdruecken", G, G, 32, variante=render.FIGUR)
    for o in bpy.data.objects:
        if o.name.startswith("Scheibe"):
            o.hide_render = True
    zeiten = {}
    for phase in (0.0, 0.5):
        u.setzen(phase)
        for name, radius, richtung, neigung in daumen_versuch.ANSICHTEN["bank"][2]:
            t0 = time.time()
            mitte = u.rig.welt(u.rig.punkt("wrist.L", u.rig.kopf["wrist.L"]))
            punkte = [p for p in _netz(u.koerper) if (p - mitte).length < radius]
            for o in [o for o in bpy.data.objects if o.type in ("CAMERA", "LIGHT")]:
                bpy.data.objects.remove(o)
            z, abstand, h = szene.bildausschnitt(punkte, richtung, neigung, G, G, rand=0.04)
            szene.licht_und_kamera(z, richtung, abstand, h)
            s.render.filepath = str(ziel / f"{name}-{phase:.2f}.png")
            bpy.ops.render.render(write_still=True)
            zeiten[f"{name}-{phase:.2f}"] = round(time.time() - t0, 1)
    return zeiten


# Griff beim Bankdrücken bis D-451; D-452 hat nur diese drei Werte geändert (dazu die Messung)
GRIFF_D451 = {"GRIFF_LAGE": 0.68, "SCHRAEG": 18.0, "STRECKUNG": 12.0}


def main() -> None:
    befehl, ziel = sys.argv[1], Path(sys.argv[2])
    ziel.mkdir(parents=True, exist_ok=True)
    if "--vorher" in sys.argv:
        from uebungen import Bankdruecken

        for name, wert in GRIFF_D451.items():
            setattr(Bankdruecken, name, wert)
    t0 = time.time()
    werte = {"stand": stand, "nah": nah, "handgelenk": handgelenk, "griff": griff}[befehl](ziel)
    (ziel / f"{befehl}.json").write_text(json.dumps({"werte": werte, "gesamt_s": round(time.time() - t0, 1)},
                                                     ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"{befehl}: {round(time.time() - t0)} s")


if __name__ == "__main__":
    main()
