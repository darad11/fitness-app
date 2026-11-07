"""Bahnen der Schleifen Bild für Bild (D-536): Änderung der Geschwindigkeit je Körperteil und Gerät.

Mit dem Python von Blender, wie `render.py`:

    <python mit bpy> -I tools/uebungen-3d/bahnen_messen.py [name …]

Ohne Namen alle Schleifen des Programms „Dali’s PPLC“ (`programs.v1.json`, Bild der Übung in
`public/uebungen/medien.json`). Schreibt die Werte der gemessenen Schleifen in
`src/modules/exercises/data/schleifen-bahnen.v1.json` (die übrigen bleiben stehen); `schleifen.test.ts` prüft sie gegen
eine Grenze, `check_medien.py`, dass jede Messung zur WebM-Datei der Liste gehört (ein neuer Renderlauf verlangt eine
neue Messung).

Je Bild der Schleife werden Körper (je Gruppe der Figur mit mindestens 8 Punkten, jede 4. Ecke) und Teile (Geräte,
Kleidung, jede 12. Ecke) in das Bild der Kamera projiziert (Pixel im 720 × 540-Render), je Spur der Mittelpunkt. Für
jeden Übergang t → t+1 (mit dem vom letzten zum ersten Bild) der Schritt s(t); die Änderung an Bild t ist
|s(t+1) − 2 s(t) + s(t−1)| in px: wie viel weiter oder weniger weit ein Teil in einem Bild geht als im Mittel der Bilder
davor und danach. Eine weiche Bewegung, die über mehrere Bilder anläuft und ausläuft, bleibt klein (alle übrigen
Schleifen von Dali’s PPLC bis 2,9 px); ein Sprung, ein Stocken oder ein Ruck wird groß (am Stand vor D-536 Military Press
67,5 px, Kreuzheben 28,9 px, Bankdrücken mit Kurzhanteln 12,4 px). Gespeichert wird je Bild die größte Änderung über
alle Spuren und für das ganze Video die Spur mit der größten. Seile des Kabelzugs zählen nicht: Ihre Stücke wechseln
die Rolle, wenn das Seil den Kopf nicht mehr umläuft; im Bild bleibt es gleich, als Spur springt es. Ebenso nicht die
unsichtbare Hülle „Kollision …“.
"""
from __future__ import annotations

import json
import re
import sys
import time
from pathlib import Path

HIER = Path(__file__).resolve().parent
ROOT = HIER.parents[1]
sys.path.insert(0, str(HIER))

import bpy  # noqa: E402
from bpy_extras.object_utils import world_to_camera_view  # noqa: E402

import render  # noqa: E402
from uebungen import _netz  # noqa: E402

MEDIEN = ROOT / "public/uebungen/medien.json"
PROGRAMME = ROOT / "src/modules/training/data/programs.v1.json"
ZIEL = ROOT / "src/modules/exercises/data/schleifen-bahnen.v1.json"
PROGRAMM = "dali_pplc"
B, H = 720, 540
OHNE = ("Seil", "Kollision")  # Teile, die nicht zählen (siehe oben; „Kollision“: Hülle für die Messung, kein Bild)


def schleifen_des_programms() -> dict[str, dict]:
    """Schlüssel der Übung → Name der Schleife und Datei, für die Übungen des Programms mit Animation."""
    visuals = json.loads(MEDIEN.read_text(encoding="utf-8"))["visuals"]
    vorlagen = json.loads(PROGRAMME.read_text(encoding="utf-8"))["templates"]
    programm = next(p for p in vorlagen if p["key"] == PROGRAMM)
    schluessel = []
    for tag in programm["days"]:
        for uebung in tag["exercises"]:
            if uebung["exercise"] not in schluessel:
                schluessel.append(uebung["exercise"])
    aus = {}
    for k in schluessel:
        demo = visuals.get(k, {}).get("demo", {})
        if demo.get("kind") == "animation":
            # Die Bahnen gehören zum Renderlauf, nicht zur Kodierung: Bezug ist die WebM-Datei, die nur ein neuer
            # Renderlauf ändert (die MP4 kann neu kodiert werden, ohne dass sich eine Haltung ändert)
            datei = demo["webm"]["src"]
            name = re.sub(r"-[0-9a-f]{8}\.webm$", "", datei.split("/")[-1])
            aus[k] = {"name": name, "datei": datei}
    return aus


def _bild(s, cam, punkte) -> list[tuple[float, float]]:
    aus = []
    for v in punkte:
        c = world_to_camera_view(s, cam, v)
        aus.append((c.x * B, (1 - c.y) * H))
    return aus


def _mitte(pkte: list[tuple[float, float]]) -> tuple[float, float]:
    return sum(p[0] for p in pkte) / len(pkte), sum(p[1] for p in pkte) / len(pkte)


def spuren(name: str) -> tuple[dict[str, list], int]:
    """Mittelpunkt jeder Spur im Bild, je Bild der Schleife."""
    s, u, punkte = render.baue(name, B, H, 1, "neutral", render.FIGUR)
    for o in bpy.data.objects:
        o.hide_render = o.name.startswith(render.ausblenden(u, "standard"))
    render.kamera(u, punkte, "standard", B, H)
    cam = s.camera
    n = render.bilder_von(u)
    gruppen = {g.index: g.name for g in u.koerper.vertex_groups}
    zu_gruppe = None
    aus: dict[str, list] = {}
    for bild in range(n):
        render.stellen(u, bild)
        bpy.context.view_layer.update()
        netz = _netz(u.koerper)
        if zu_gruppe is None:
            zu_gruppe = {}
            for i in range(0, len(netz), 4):
                v = u.koerper.data.vertices[i]
                best = max(v.groups, key=lambda g: g.weight, default=None)
                if best is not None:
                    zu_gruppe.setdefault(gruppen[best.group], []).append(i)
            zu_gruppe = {g: idx for g, idx in zu_gruppe.items() if len(idx) >= 8}
        for g, idx in zu_gruppe.items():
            aus.setdefault(f"Körper {g}", []).append(_mitte(_bild(s, cam, [netz[i] for i in idx])))
        deps = bpy.context.evaluated_depsgraph_get()
        for o in bpy.data.objects:
            if o.type != "MESH" or o == u.koerper or o.hide_render or any(w in o.name for w in OHNE):
                continue
            ev = o.evaluated_get(deps)
            try:
                mesh = ev.to_mesh()
            except RuntimeError:
                continue
            n_ecken = len(mesh.vertices)
            if n_ecken:
                st = max(1, min(12, n_ecken // 8 or 1))  # jede 12. Ecke, höchstens 600
                pkte = [ev.matrix_world @ mesh.vertices[i].co for i in list(range(0, n_ecken, st))[:600]]
                aus.setdefault(o.name, []).append(_mitte(_bild(s, cam, pkte)))
            ev.to_mesh_clear()
    return {k: v for k, v in aus.items() if len(v) == n}, n


def aenderung(spur: list[tuple[float, float]]) -> list[float]:
    """Je Bild |s(t+1) − 2 s(t) + s(t−1)| in px."""
    n = len(spur)
    s = [((spur[(t + 1) % n][0] - spur[t][0]) ** 2 + (spur[(t + 1) % n][1] - spur[t][1]) ** 2) ** 0.5
         for t in range(n)]
    return [abs(s[(t + 1) % n] - 2 * s[t] + s[t - 1]) for t in range(n)]


def messen(name: str) -> dict:
    sp, n = spuren(name)
    je_bild = [0.0] * n
    groesste = (0.0, "", 0)
    for spur, x in sp.items():
        for t, a in enumerate(aenderung(x)):
            je_bild[t] = max(je_bild[t], a)
            if a > groesste[0]:
                groesste = (a, spur, t)
    return {"bilder": n, "aenderung": [round(a, 1) for a in je_bild], "groesste": round(groesste[0], 1),
            "spur": groesste[1], "bild": groesste[2]}


def main() -> int:
    alle = schleifen_des_programms()
    namen = sys.argv[1:]
    auswahl = {k: e for k, e in alle.items() if not namen or e["name"] in namen}
    if namen and len(auswahl) != len(set(namen)):
        print(f"unbekannt: {sorted(set(namen) - {e['name'] for e in auswahl.values()})}", file=sys.stderr)
        return 1
    neu = {}
    for k, e in sorted(auswahl.items()):
        t0 = time.time()
        neu[k] = {"name": e["name"], "datei": e["datei"], **messen(e["name"])}
        m = neu[k]
        print(f"{e['name']}: größte Änderung {m['groesste']} px ({m['spur']}, Bild {m['bild']}), "
              f"{time.time() - t0:.0f} s", flush=True)
    # Erst jetzt lesen: So bleiben Werte, die ein anderer Lauf inzwischen geschrieben hat
    daten = json.loads(ZIEL.read_text(encoding="utf-8")) if ZIEL.exists() else {"schleifen": {}}
    schleifen = {k: v for k, v in daten.get("schleifen", {}).items() if k in alle}
    schleifen.update(neu)
    aus = {"version": 1, "messung": "tools/uebungen-3d/bahnen_messen.py (D-536)", "programm": PROGRAMM,
           "einheit": "px je Bild² im 720 × 540-Render", "schleifen": dict(sorted(schleifen.items()))}
    ZIEL.write_text(json.dumps(aus, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"{ZIEL.relative_to(ROOT)}: {len(schleifen)} Schleifen")
    return 0


if __name__ == "__main__":
    sys.exit(main())
