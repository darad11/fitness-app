"""Übungsbilder rendern (Pilot 3D, D-402; Rig und Darstellung D-407 bis D-410).

Aufruf mit dem Python von Blender als Modul (`pip install bpy==4.2.0`, Python 3.11):

    python -I tools/uebungen-3d/render.py --hole                  # MakeHuman-Dateien (CC0) laden
    python -I tools/uebungen-3d/render.py kniebeuge                # Schleife, 60 Bilder, ffmpeg
    python -I tools/uebungen-3d/render.py kniebeuge --pruefen      # Prüfansichten und Messwerte
    python -I tools/uebungen-3d/render.py kniebeuge --nur-vorschau  # nur das Vorschaubild 240 × 240
    python -I tools/uebungen-3d/render.py kniebeuge --variante C-m  # Variante zur Probe (D-414)
    python -I tools/uebungen-3d/render.py kniebeuge --ansicht vorn --breite 360 --hoehe 270 \\
        --proben 16 --nur-bilder --arbeit /tmp/vergleich             # Einzelbilder einer Ansicht

Ergebnis der Schleife in `public/uebungen/medien/` (MP4, WebM, Poster, Vorschau). Die Kamera folgt
der Regel der Übung (`kamera`); der Abstand ergibt sich aus Figur und Gerät über die ganze Bewegung.
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

HIER = Path(__file__).resolve().parent
sys.path.insert(0, str(HIER))

import bpy  # noqa: E402
from mathutils import Vector  # noqa: E402

import koerperform  # noqa: E402
import realistisch  # noqa: E402
import szene  # noqa: E402
import varianten  # noqa: E402
from haltung import ablauf  # noqa: E402
from uebungen import UEBUNGEN, _netz  # noqa: E402

BILDER = 60
FPS = 24
VORSCHAU = 480  # Kantenlänge des Vorschau-Renders; verkleinert auf 240 × 240 (D-415)
QUELLE = "https://raw.githubusercontent.com/makehuman/makehuman/master/makehuman"
DATEIEN = {
    "base.obj": f"{QUELLE}/data/3dobjs/base.obj",
    "default.mhskel": f"{QUELLE}/data/rigs/default.mhskel",
    "default_weights.mhw": f"{QUELLE}/data/rigs/default_weights.mhw",
    "LICENSE.md": "https://raw.githubusercontent.com/makehuman/makehuman/master/LICENSE.md",
}
# Prüfansichten: (Richtung, Neigung); „vorn“ bei liegenden Übungen vom Fußende
ANSICHTEN = {"vorn": (0.0, 5.0), "seite": (90.0, 5.0)}
# In den Prüfansichten ausgeblendet, damit Arme, Hände und Kopf zu sehen sind (nur dort; die
# Schleife für die App zeigt alle Geräteteile): Hantelscheiben verdecken von der Seite den Oberkörper,
# Säule und Gewichtsblock des Latzugs von vorn den Rumpf.
AUSBLENDEN = {"vorn": ("Saeule", "Gewichtsblock"), "seite": ("Scheibe", "Verschluss")}


def hole() -> None:
    ziel = HIER / "quelle"
    ziel.mkdir(exist_ok=True)
    for name, url in DATEIEN.items():
        if not (ziel / name).exists():
            urllib.request.urlretrieve(url, ziel / name)
    koerperform.hole(list(koerperform.FORMEN.values()))
    realistisch.hole()


def baue(name: str, breite: int, hoehe: int, proben: int, form: str = "neutral", variante: str | None = None):
    """Szene der Übung. Ohne `variante`: graue Figur mit Zonen in der Körperform `form`; mit
    `variante` (Schlüssel aus `varianten.VARIANTEN`) deren Form, Kleidung und Aussehen (D-414)."""
    s = szene.leere_szene()
    s.cycles.samples = proben
    s.render.resolution_x = breite
    s.render.resolution_y = hoehe
    if variante:
        uebung = UEBUNGEN[name](koerperform.FORMEN[varianten.VARIANTEN[variante]["form"]])
        uebung.bauen()
        varianten.ausstatten(uebung, variante)
    else:
        uebung = UEBUNGEN[name](koerperform.FORMEN[form])
        uebung.bauen()
        uebung.koerper.data.materials.append(szene.koerper_material())
    szene.boden()
    punkte = uebung.rahmenpunkte()
    return s, uebung, punkte


def kamera(uebung, punkte, ansicht: str, breite: int, hoehe: int) -> None:
    for o in [o for o in bpy.data.objects if o.type in ("CAMERA", "LIGHT")]:
        bpy.data.objects.remove(o)
    if ansicht == "standard":
        richtung, neigung = uebung.kamera["richtung"], uebung.kamera["neigung"]
    else:
        richtung, neigung = ANSICHTEN[ansicht]
        if uebung.name == "bankdruecken" and ansicht == "vorn":
            neigung = 20.0
    ziel, abstand, h = szene.bildausschnitt(punkte, richtung, neigung, breite, hoehe)
    szene.licht_und_kamera(ziel, richtung, abstand, h)


def messen(uebung) -> dict:
    """Messwerte am verformten Netz: Abstand der Finger zur Stange, Bodenkontakt der Füße."""
    netz = _netz(uebung.koerper)
    gruppen = {g.name: g.index for g in uebung.koerper.vertex_groups}
    erg = {}
    finger = {gruppen[n] for n in gruppen if n.startswith("finger")}
    fuss = {gruppen[n] for n in gruppen if n.startswith(("foot", "toe"))}
    stange = uebung.stange_achse() if hasattr(uebung, "stange_achse") else None
    fingerpunkte, fusspunkte = [], []
    for v, p in zip(uebung.koerper.data.vertices, netz):
        gs = {g.group for g in v.groups if g.weight > 0.5}
        if gs & finger:
            fingerpunkte.append(p)
        if gs & fuss:
            fusspunkte.append(p)
    if stange is not None and fingerpunkte:
        mitte, achse, radius = stange
        abst = []
        for p in fingerpunkte:
            r = p - mitte
            abst.append((r - r.dot(achse) * achse).length - radius)
        erg["Finger: geringster Abstand zur Stange (mm, negativ = eingedrungen)"] = min(abst) * 1000
        erg["Finger: Punkte in Kontakt (≤ 3 mm)"] = sum(1 for a in abst if a <= 0.003)
    if fusspunkte:
        erg["Fuß: tiefster Punkt über dem Boden (mm)"] = min(p.z for p in fusspunkte) * 1000
    erg["_fuss"] = [tuple(round(c, 4) for c in p) for p in fusspunkte[::25]]
    return erg


def pruefen(name: str, arbeit: Path, form: str) -> None:
    """Prüfansichten (vorn, Seite, Standard) für fünf Phasen, Griff aus der Nähe und Messwerte für
    alle 60 Bilder."""
    s, u, punkte = baue(name, 480, 360, 16, form)
    werte = []
    fuss0 = None
    fuss_max = 0.0
    for bild in range(BILDER):
        p = ablauf(bild, BILDER)
        u.setzen(p)
        w = {k: round(v, 2) for k, v in u.pruefwerte().items()}
        m = messen(u)
        fuss = m.pop("_fuss")
        if fuss0 is None:
            fuss0 = fuss
        else:
            fuss_max = max(fuss_max, max((Vector(a) - Vector(b)).length for a, b in zip(fuss0, fuss)))
        w.update({k: round(v, 2) for k, v in m.items()})
        w["Meldungen"] = list(u.rig.meldungen)
        werte.append({"bild": bild, "phase": round(p, 3), **w})
    zusammen = {
        "uebung": name,
        "Fuß: größte Verschiebung über die Schleife (mm)": round(fuss_max * 1000, 2),
        "bilder": werte,
    }
    (arbeit / f"{name}-messwerte.json").write_text(json.dumps(zusammen, ensure_ascii=False, indent=1), encoding="utf-8")
    for p in (0.0, 0.25, 0.5, 0.75, 1.0):
        u.setzen(p)
        for ansicht in ("vorn", "seite", "standard"):
            for o in bpy.data.objects:
                o.hide_render = o.name.startswith(AUSBLENDEN.get(ansicht, ()))
            kamera(u, punkte, ansicht, 480, 360)
            s.render.filepath = str(arbeit / f"pruef-{ansicht}-{p:.2f}.png")
            bpy.ops.render.render(write_still=True)
    # Griff aus der Nähe: linke Hand von vorn, von außen und von hinten, Ausgang und Endposition
    for o in bpy.data.objects:
        o.hide_render = False
    for p in (0.0, 1.0):
        u.setzen(p)
        hand = u.rig.welt(u.rig.punkt("wrist.L", u.rig.kopf["metacarpal2.L"]))
        for richtung, hoehe in ((20, 0.10), (110, 0.25), (200, 0.15)):
            for o in [o for o in bpy.data.objects if o.type in ("CAMERA", "LIGHT")]:
                bpy.data.objects.remove(o)
            szene.licht_und_kamera(hand, richtung, 0.5, hoehe)
            s.render.filepath = str(arbeit / f"pruef-hand-{richtung}-{p:.2f}.png")
            bpy.ops.render.render(write_still=True)


def vorschau(u, s, arbeit: Path, ziel: Path, name: str, phase: float | None = None) -> Path:
    """Vorschaubild (D-415): Standbild in der Position, in der die Übung am besten zu erkennen ist
    (`vorschau_phase` der Übung), Kamera in Richtung und Neigung wie die Schleife, Ausschnitt eng auf
    die Figur (nur der Körper, 5 % Rand), quadratisch; gerendert mit 480 × 480, verkleinert auf
    240 × 240. So bleibt die Figur auch klein gut lesbar."""
    u.setzen(u.vorschau_phase if phase is None else phase)
    punkte = _netz(u.koerper)
    richtung, neigung = u.kamera["richtung"], u.kamera["neigung"]
    for o in [o for o in bpy.data.objects if o.type in ("CAMERA", "LIGHT")]:
        bpy.data.objects.remove(o)
    mitte, abstand, h = szene.bildausschnitt(punkte, richtung, neigung, VORSCHAU, VORSCHAU, rand=0.05)
    szene.licht_und_kamera(mitte, richtung, abstand, h)
    alt = (s.render.resolution_x, s.render.resolution_y)
    s.render.resolution_x = s.render.resolution_y = VORSCHAU
    bild = arbeit / f"vorschau-{name}.png"
    s.render.filepath = str(bild)
    bpy.ops.render.render(write_still=True)
    s.render.resolution_x, s.render.resolution_y = alt
    ziel.mkdir(parents=True, exist_ok=True)
    datei = ziel / f"{name}-vorschau.webp"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(bild), "-vf", "scale=240:240:flags=lanczos",
                    "-q:v", "82", str(datei)], check=True)
    return datei


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("uebung", nargs="?")
    ap.add_argument("--hole", action="store_true")
    ap.add_argument("--form", default="neutral", choices=sorted(koerperform.FORMEN))
    ap.add_argument("--variante", choices=sorted(varianten.VARIANTEN), help="Variante zur Probe (D-414)")
    ap.add_argument("--pruefen", action="store_true")
    ap.add_argument("--ansicht", default="standard", choices=["standard", "vorn", "seite"])
    ap.add_argument("--breite", type=int, default=720)
    ap.add_argument("--hoehe", type=int, default=540)
    ap.add_argument("--proben", type=int, default=40)
    ap.add_argument("--nur-bilder", action="store_true")
    ap.add_argument("--nur-vorschau", action="store_true", help="nur das Vorschaubild (D-415)")
    ap.add_argument("--vorschau-phase", type=float, help="Phase des Vorschaubilds statt der Vorgabe der Übung")
    ap.add_argument("--ziel", default=str(HIER.parent.parent / "public/uebungen/medien"))
    ap.add_argument("--arbeit", default="/tmp/uebungen-3d")
    args = ap.parse_args()
    if args.hole:
        hole()
        return
    arbeit = Path(args.arbeit) / args.uebung
    arbeit.mkdir(parents=True, exist_ok=True)
    if args.pruefen:
        pruefen(args.uebung, arbeit, args.form)
        return
    s, u, punkte = baue(args.uebung, args.breite, args.hoehe, args.proben, args.form, args.variante)
    name = f"{args.uebung}-{args.variante}" if args.variante else args.uebung
    if args.nur_vorschau:
        print(vorschau(u, s, arbeit, Path(args.ziel), name, args.vorschau_phase))
        return
    for o in bpy.data.objects:
        o.hide_render = o.name.startswith(AUSBLENDEN.get(args.ansicht, ()))
    kamera(u, punkte, args.ansicht, args.breite, args.hoehe)
    start = time.time()
    for bild in range(BILDER):
        u.setzen(ablauf(bild, BILDER))
        s.render.filepath = str(arbeit / f"{args.ansicht}-{bild:03d}.png")
        bpy.ops.render.render(write_still=True)
    print(f"Renderzeit {args.uebung} ({args.ansicht}): {time.time() - start:.0f} s für {BILDER} Bilder")
    if not args.nur_bilder:
        kodiere(arbeit, Path(args.ziel), name, args.ansicht)
        vorschau(u, s, arbeit, Path(args.ziel), name, args.vorschau_phase)


def kodiere(arbeit: Path, ziel: Path, name: str, ansicht: str) -> None:
    ziel.mkdir(parents=True, exist_ok=True)
    muster = str(arbeit / f"{ansicht}-%03d.png")
    gemeinsam = ["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(FPS), "-i", muster, "-an"]
    subprocess.run(gemeinsam + ["-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "24", "-preset", "slow",
                                "-movflags", "+faststart", str(ziel / f"{name}.mp4")], check=True)
    subprocess.run(gemeinsam + ["-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "36", "-row-mt", "1",
                                str(ziel / f"{name}.webm")], check=True)
    # Poster: Endposition (Mitte der Pause unten). Das Vorschaubild rendert `vorschau` eigens.
    poster = arbeit / f"{ansicht}-{BILDER // 2:03d}.png"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(poster), "-q:v", "80",
                    str(ziel / f"{name}-poster.webp")], check=True)


if __name__ == "__main__":
    main()
