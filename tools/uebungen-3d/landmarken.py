#!/usr/bin/env python3
"""Gesichtslandmarken mit dem Face Landmarker von MediaPipe (Apache 2.0; D-437) für Fotos oder
Renderings. Läuft in einer eigenen Umgebung mit `mediapipe` (geprüft mit 0.10.14, Python 3.12), nicht
im Python von Blender:

    python -m venv /tmp/mp && /tmp/mp/bin/pip install mediapipe==0.10.14
    curl -L -o /tmp/mp/face_landmarker.task https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task
    /tmp/mp/bin/python -I tools/uebungen-3d/landmarken.py --modell /tmp/mp/face_landmarker.task --aus /tmp/privat/landmarken bild1.jpg bild2.png

Schreibt je Bild `<name>.json` mit 478 Punkten (x, y in Pixel, z relativ) oder `gefunden: false`.
Bilder von Personen, ihre Landmarken und alles Abgeleitete gehören nicht ins Repository.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path


def erkenne(pfad: str, modell: str) -> dict:
    import mediapipe as mp
    from mediapipe.tasks.python import BaseOptions, vision

    opts = vision.FaceLandmarkerOptions(base_options=BaseOptions(model_asset_path=modell), num_faces=1,
                                        output_face_blendshapes=False, output_facial_transformation_matrixes=False)
    with vision.FaceLandmarker.create_from_options(opts) as lm:
        bild = mp.Image.create_from_file(pfad)
        res = lm.detect(bild)
    if not res.face_landmarks:
        return {"datei": pfad, "gefunden": False}
    w, h = bild.width, bild.height
    return {"datei": pfad, "gefunden": True, "breite": w, "hoehe": h,
            "punkte": [[p.x * w, p.y * h, p.z * w] for p in res.face_landmarks[0]]}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("bilder", nargs="+")
    ap.add_argument("--modell", required=True, help="face_landmarker.task")
    ap.add_argument("--aus", required=True, help="Zielordner für die JSON-Dateien (außerhalb des Repositorys)")
    args = ap.parse_args()
    aus = Path(args.aus)
    aus.mkdir(parents=True, exist_ok=True)
    for bild in args.bilder:
        erg = erkenne(bild, args.modell)
        ziel = aus / (Path(bild).stem + ".json")
        ziel.write_text(json.dumps(erg), encoding="utf-8")
        print(Path(bild).name, "gefunden" if erg["gefunden"] else "kein Gesicht", "->", ziel)


if __name__ == "__main__":
    main()
