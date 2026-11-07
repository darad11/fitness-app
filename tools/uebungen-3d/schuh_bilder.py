"""Standbilder der Runde „Schuh und Rückenlogo“ (Phase Programme, Abschnitt 1 des Auftrags
`docs/prompts/programme-ganzkoerper-FORM.md`) in der Figur der App (`render.FIGUR`), Licht und Kantenlicht wie
in der App:

    python -I tools/uebungen-3d/schuh_bilder.py schuh <ordner>             # Schuh in der Ruhehaltung, Messwerte
    python -I tools/uebungen-3d/schuh_bilder.py schuh <ordner> --vorher    # derselbe Satz mit dem Schuh bis D-459
    python -I tools/uebungen-3d/schuh_bilder.py details <ordner>           # Nahaufnahmen: Schnürung, Zunge, Profil, Kragen
    python -I tools/uebungen-3d/schuh_bilder.py ruecken <ordner>           # Rückenlogo: Rückansicht und Latziehen
    python -I tools/uebungen-3d/schuh_bilder.py ruecken <ordner> --vorher  # Logo im Verhältnis des Boards, Schuh bis D-459

`schuh`: linker Schuh von außen, innen, hinten und oben, dazu beide Schuhe aus der Richtung des Boards; Messwerte
in der Ruhehaltung (`schuhe.bodenkontakt`, `schuhe.durchdringung`, Standhöhe). `ruecken`: Rückansicht der ganzen
Figur (orthografisch) und des Oberkörpers, Latziehen in Ausgangs- und Endposition mit der Kamera der App und von
hinten. Jeder Befehl schreibt `<befehl>.json` mit Laufzeiten und Messwerten. Die Blätter setzt
`tools/uebungen_korrektur_bild.py --runde 9` zusammen; die Bilder in der Größe des Players kommen aus
`varianten_bilder.py`.
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

import kleidung  # noqa: E402
import kleidung_bilder  # noqa: E402
import render  # noqa: E402
import schuhe  # noqa: E402
import szene  # noqa: E402
from uebungen import _netz  # noqa: E402

# Ansichten des Schuhs: Name, Ziel (linker Schuh oder beide), Richtung (0 vorn, 90 links = außen am linken Schuh),
# waagrechter Abstand und Höhe der Kamera über dem Ziel (m), Brennweite (mm). Von innen steht der rechte Schuh im
# Weg: näher heran, etwas von oben, weiteres Objektiv (wie D-453). „board“: beide Schuhe schräg von vorn außen,
# die Spitzen zeigen nach links wie auf dem Board
SCHUH_ANSICHTEN = (("aussen", "L", 90, 0.62, 0.05, 60.0), ("innen", "L", 270, 0.40, 0.10, 42.0),
                   ("hinten", "L", 180, 0.55, 0.08, 60.0), ("oben", "L", 20, 0.22, 0.48, 50.0),
                   ("board", "beide", 62, 0.85, 0.24, 60.0))
# Board bis D-458 (Rückenlogo vorher)
RUECKEN_BOARD = {"f": 3.40, "abstand": 0.78}
# Nahaufnahmen am linken Schuh: Name, Ziel in Koordinaten am Schuh (u, h, q; `schuhe._koord`), Richtung, waagrechter
# Abstand und Höhe der Kamera (m)
DETAILS = (("schnuerung-oben", (0.63, 0.085, 0.0), 10, 0.10, 0.22), ("schnuerung-seite", (0.63, 0.085, 0.0), 70, 0.22, 0.10),
           ("zunge", (0.48, 0.105, 0.0), 15, 0.16, 0.06), ("kragen-aussen", (0.25, 0.09, 0.03), 110, 0.20, 0.07),
           ("kragen-hinten", (0.05, 0.10, 0.0), 200, 0.20, 0.08), ("kragen-innen", (0.30, 0.09, -0.03), 290, 0.16, 0.10),
           ("profil-spitze", (0.90, 0.01, 0.0), 60, 0.20, 0.015), ("profil-ferse", (0.15, 0.01, 0.02), 150, 0.22, 0.02))


def _schuhmitte(seite: str) -> Vector:
    """Mitte der Sohle eines Schuhs (verformt, Welt), 4,5 cm darüber."""
    x = 1 if seite == "L" else -1
    sohle = [q for q in schuhe._verformt(bpy.data.objects["Sohle"])[0] if q.x * x > 0]
    return sum(sohle, Vector()) / len(sohle) + Vector((0, 0, 0.045))


def schuh(ziel: Path) -> dict:
    s, u = kleidung_bilder._ruhe(48, 560, 560)
    o = bpy.data.objects
    werte = {"Standhöhe: Sohle unter dem Fuß (mm)": round(u.sohle * 1000, 2)}
    werte.update({k: round(v, 2) for k, v in schuhe.bodenkontakt(o["Sohle"], o["Schuhe"]).items()})
    werte.update({k: round(v, 2) for k, v in schuhe.durchdringung(u.koerper, o["Socken"], o["Schuhe"], o.get("Shorts")).items()})
    if hasattr(schuhe, "pruefung_neu") and getattr(schuhe, "NEU", False):
        werte.update({k: round(v, 2) for k, v in schuhe.pruefung_neu(u.koerper, o["Socken"]).items()})
    ziele = {"L": _schuhmitte("L"), "beide": (_schuhmitte("L") + _schuhmitte("R")) / 2}
    zeiten = {}
    for name, wo, richtung, abstand, hoehe, brennweite in SCHUH_ANSICHTEN:
        t0 = time.time()
        kleidung_bilder._kamera(ziele[wo], richtung, abstand, hoehe, brennweite)
        s.render.filepath = str(ziel / f"schuh-{name}.png")
        bpy.ops.render.render(write_still=True)
        zeiten[name] = round(time.time() - t0, 1)
    return {"zeiten": zeiten, "messwerte": werte}


def details(ziel: Path) -> dict:
    s, u = kleidung_bilder._ruhe(48, 560, 560)
    r = schuhe.anziehen.daten["rahmen"]["L"]
    zeiten = {}
    for name, (uu, h, q), richtung, abstand, hoehe in DETAILS:
        t0 = time.time()
        kleidung_bilder._kamera(schuhe._punkt(r, uu, h, q) + u.rig.versatz, richtung, abstand, hoehe, 50.0)
        s.render.filepath = str(ziel / f"detail-{name}.png")
        bpy.ops.render.render(write_still=True)
        zeiten[name] = round(time.time() - t0, 1)
    return {"zeiten": zeiten}


def ruecken(ziel: Path) -> dict:
    zeiten = {}
    # Ruhehaltung: ganze Figur von hinten (orthografisch wie D-453) und der Oberkörper
    s, u = kleidung_bilder._ruhe(48, 600, 900)
    t0 = time.time()
    kleidung_bilder._kamera(Vector((0, 0, 1.0)), 180, 8.0, 0.0, 50.0)
    cam = bpy.context.scene.camera
    cam.data.type = "ORTHO"
    cam.data.ortho_scale = 2.0
    s.render.filepath = str(ziel / "ruecken-ganz.png")
    bpy.ops.render.render(write_still=True)
    zeiten["ruecken-ganz"] = round(time.time() - t0, 1)
    s.render.resolution_x = s.render.resolution_y = 560
    t0 = time.time()
    mitte = kleidung.anziehen.mitten["Ruecken"] + u.rig.versatz
    kleidung_bilder._kamera(mitte, 180, 0.95, 0.06)
    s.render.filepath = str(ziel / "ruecken-nah.png")
    bpy.ops.render.render(write_still=True)
    zeiten["ruecken-nah"] = round(time.time() - t0, 1)
    logos = {k: round(v * 100, 2) for k, v in kleidung.anziehen.logos.items() if k.startswith("ruecken")}
    # Latziehen: Kamera der App (wie die Schleife, 720 × 540) und von hinten auf den Rücken
    s, u, punkte = render.baue("latziehen", 720, 540, 40, variante=render.FIGUR)
    for p in (0.0, 1.0):
        u.setzen(p)
        t0 = time.time()
        render.kamera(u, punkte, "standard", 720, 540)
        s.render.filepath = str(ziel / f"latziehen-app-{p:.2f}.png")
        bpy.ops.render.render(write_still=True)
        zeiten[f"latziehen-app-{p:.2f}"] = round(time.time() - t0, 1)
        t0 = time.time()
        rig = u.rig
        mitte = rig.welt(rig.punkt("spine03", rig.kopf["spine03"]))
        nah = [q for q in _netz(u.koerper) if (q - mitte).length < 0.30]
        for obj in [obj for obj in bpy.data.objects if obj.type in ("CAMERA", "LIGHT")]:
            bpy.data.objects.remove(obj)
        z, abstand, h = szene.bildausschnitt(nah, 180, 8, 720, 540, rand=0.04)
        szene.licht_und_kamera(z, 180, abstand, h)
        s.render.filepath = str(ziel / f"latziehen-hinten-{p:.2f}.png")
        bpy.ops.render.render(write_still=True)
        zeiten[f"latziehen-hinten-{p:.2f}"] = round(time.time() - t0, 1)
    return {"zeiten": zeiten, "logo_cm": logos}


def main() -> None:
    befehl, ziel = sys.argv[1], Path(sys.argv[2])
    ziel.mkdir(parents=True, exist_ok=True)
    if "--vorher" in sys.argv:
        schuhe.NEU = False
        if befehl == "ruecken":
            kleidung.RUECKEN_LOGO = dict(RUECKEN_BOARD)
    t0 = time.time()
    werte = {"schuh": schuh, "details": details, "ruecken": ruecken}[befehl](ziel)
    werte["gesamt_s"] = round(time.time() - t0, 1)
    (ziel / f"{befehl}.json").write_text(json.dumps(werte, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"{befehl}: {round(time.time() - t0)} s")


if __name__ == "__main__":
    main()
