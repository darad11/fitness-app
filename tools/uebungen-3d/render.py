"""Übungsbilder rendern (Pilot 3D, D-402).

Aufruf mit dem Python von Blender als Modul (`pip install bpy==4.2.0`, Python 3.11):

    python -I tools/uebungen-3d/render.py kniebeuge --probe 0 1   # zwei Standbilder zur Kontrolle
    python -I tools/uebungen-3d/render.py kniebeuge                # 60 Bilder, dann ffmpeg

Ergebnis in `public/uebungen/medien/` (MP4, WebM, Poster, Vorschau). Die Grundlage (MakeHuman,
CC0) lädt `--hole` nach `tools/uebungen-3d/quelle/`.
"""
from __future__ import annotations

import argparse
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

HIER = Path(__file__).resolve().parent
sys.path.insert(0, str(HIER))

import bpy  # noqa: E402

import szene  # noqa: E402
from haltung import ablauf  # noqa: E402
from uebungen import UEBUNGEN  # noqa: E402

BILDER = 60
FPS = 24
QUELLE = "https://raw.githubusercontent.com/makehuman/makehuman/master/makehuman"
DATEIEN = {
    "base.obj": f"{QUELLE}/data/3dobjs/base.obj",
    "default.mhskel": f"{QUELLE}/data/rigs/default.mhskel",
    "default_weights.mhw": f"{QUELLE}/data/rigs/default_weights.mhw",
    "LICENSE.md": "https://raw.githubusercontent.com/makehuman/makehuman/master/LICENSE.md",
}


def hole() -> None:
    ziel = HIER / "quelle"
    ziel.mkdir(exist_ok=True)
    for name, url in DATEIEN.items():
        if not (ziel / name).exists():
            urllib.request.urlretrieve(url, ziel / name)


def baue(name: str, breite: int, hoehe: int, proben: int):
    s = szene.leere_szene()
    s.cycles.samples = proben
    s.render.resolution_x = breite
    s.render.resolution_y = hoehe
    s.render.use_persistent_data = True
    uebung = UEBUNGEN[name]()
    uebung.bauen()
    uebung.koerper.data.materials.append(szene.koerper_material())
    szene.boden()
    richtung, abstand, hoehe_kamera, ziel = uebung.kamera
    szene.licht_und_kamera(ziel, richtung, abstand, hoehe_kamera)
    return s, uebung


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("uebung", nargs="?")
    ap.add_argument("--probe", nargs="*", type=float, help="Phasen (0 bis 1) als Standbilder")
    ap.add_argument("--hole", action="store_true")
    ap.add_argument("--ziel", default=str(HIER.parent.parent / "public/uebungen/medien"))
    ap.add_argument("--arbeit", default="/tmp/uebungen-3d")
    ap.add_argument("--proben", type=int, default=40)
    args = ap.parse_args()
    if args.hole:
        hole()
        return
    arbeit = Path(args.arbeit) / args.uebung
    arbeit.mkdir(parents=True, exist_ok=True)
    if args.probe is not None:
        s, u = baue(args.uebung, 720, 540, 16)
        for p in args.probe:
            u.setzen(p)
            print(f"Phase {p}:", {k: round(v, 1) for k, v in u.pruefwerte().items()})
            s.render.filepath = str(arbeit / f"probe-{p:.2f}.png")
            bpy.ops.render.render(write_still=True)
        return
    s, u = baue(args.uebung, 720, 540, args.proben)
    start = time.time()
    for bild in range(BILDER):
        u.setzen(ablauf(bild, BILDER))
        s.render.filepath = str(arbeit / f"bild-{bild:03d}.png")
        bpy.ops.render.render(write_still=True)
    dauer = time.time() - start
    print(f"Renderzeit {args.uebung}: {dauer:.0f} s für {BILDER} Bilder")
    kodiere(arbeit, Path(args.ziel), args.uebung)


def kodiere(arbeit: Path, ziel: Path, name: str) -> None:
    ziel.mkdir(parents=True, exist_ok=True)
    muster = str(arbeit / "bild-%03d.png")
    gemeinsam = ["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(FPS), "-i", muster, "-an"]
    subprocess.run(gemeinsam + ["-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "24", "-preset", "slow",
                                "-movflags", "+faststart", str(ziel / f"{name}.mp4")], check=True)
    subprocess.run(gemeinsam + ["-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "36", "-row-mt", "1",
                                str(ziel / f"{name}.webm")], check=True)
    # Poster: Endposition (Mitte der Pause unten); Vorschau 240 × 240 aus der Mitte.
    poster = arbeit / f"bild-{BILDER // 2:03d}.png"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(poster), "-q:v", "80",
                    str(ziel / f"{name}-poster.webp")], check=True)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(poster), "-vf",
                    "crop=540:540:90:0,scale=240:240:flags=lanczos", "-q:v", "82",
                    str(ziel / f"{name}-vorschau.webp")], check=True)


if __name__ == "__main__":
    main()
