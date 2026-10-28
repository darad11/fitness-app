"""Gesichtsregler von MakeHuman an Fotos anpassen (Korrekturrunde 4, D-437, D-438).

Weg: Landmarken (MediaPipe, `landmarken.py`) auf den Fotos und auf einem Rendering des Modells von
vorn; die Landmarken des Renderings werden auf das Netz zurückprojiziert (je Landmarke Eckpunkte und
Gewichte einer Fläche des Grundmodells). Danach lassen sich die Landmarken für jede Reglerstellung
direkt aus dem verschobenen Netz berechnen, ohne neu zu rendern: Die Empfindlichkeit jedes Reglers
(Änderung der Maße aus `gesicht_masse.py` je Reglerwert) ergibt eine gedämpfte Ausgleichsrechnung,
die in wenigen Schritten die Reglerwerte liefert, mit denen die Maße des Modells denen der Fotos am
nächsten kommen. Ins Repository kommen nur die Reglerwerte; Fotos, Landmarken der Fotos und
Vorschauen bleiben außerhalb.

    python -I tools/uebungen-3d/gesicht_anpassen.py rendern --form maennlich --aus /tmp/privat/modell
    <mediapipe-venv>/python -I tools/uebungen-3d/landmarken.py --modell … --aus /tmp/privat/modell /tmp/privat/modell/vorn.png
    python -I tools/uebungen-3d/gesicht_anpassen.py marken --landmarken /tmp/privat/modell/vorn.json --kamera /tmp/privat/modell/kamera.json
    python -I tools/uebungen-3d/gesicht_anpassen.py anpassen --soll /tmp/privat/masse-soll.json --kamera … --aus /tmp/privat/regler.json
    python -I tools/uebungen-3d/gesicht_anpassen.py profil --form persoenlich

Die Zuordnung Landmarke → Eckpunkte (`gesicht-marken.json`) beschreibt nur das Grundmodell von
MakeHuman und liegt im Repository; sie dient auch dem Bart (`gesicht.py`).
"""
from __future__ import annotations

import argparse
import gzip
import json
import math
import sys
from pathlib import Path

HIER = Path(__file__).resolve().parent
sys.path.insert(0, str(HIER))

import bpy  # noqa: E402
import numpy as np  # noqa: E402
from mathutils import Matrix, Vector  # noqa: E402

import figur  # noqa: E402
import gesicht  # noqa: E402
import gesicht_masse  # noqa: E402
import koerperform  # noqa: E402
import realistisch  # noqa: E402
import szene  # noqa: E402

MARKEN = HIER / "gesicht-marken.json"
ANSICHTEN = {"vorn": 0.0, "dreiviertel": 40.0, "seite": 90.0}
GROESSE = 768
BRENNWEITE = 100.0
ABSTAND = 1.1


def _kopf_mitte(skelett) -> Vector:
    b = skelett.data.bones["head"]
    return skelett.matrix_world @ ((b.head_local + b.tail_local) / 2)


def baue(form_name: str, stil: str | None = None):
    """Figur mit Haut, Augen, Brauen und Haaren (Grundhaltung) für Kopfbilder."""
    s = szene.leere_szene()
    s.cycles.samples = 24
    s.render.resolution_x = s.render.resolution_y = GROESSE
    form = koerperform.FORMEN[form_name]
    k, sk = figur.baue_figur("Figur", form)
    bpy.context.view_layer.update()
    realistisch.hole()
    realistisch.ausstatten(k, sk, "Figur", stil or form_name, False)
    return s, k, sk


def kamera(sk, richtung: float):
    for o in [o for o in bpy.data.objects if o.type in ("CAMERA", "LIGHT")]:
        bpy.data.objects.remove(o)
    ziel = _kopf_mitte(sk) + Vector((0, 0, 0.01))
    return szene.licht_und_kamera(ziel, richtung, ABSTAND, 0.0, brennweite=BRENNWEITE, kantenlicht=False)


def kamera_daten(cam, k) -> dict:
    bpy.context.view_layer.update()  # matrix_world erst nach dem Aktualisieren gültig
    return {"matrix": [list(r) for r in cam.matrix_world], "lens": cam.data.lens, "sensor": cam.data.sensor_width,
            "groesse": GROESSE, "koerper_matrix": [list(r) for r in k.matrix_world]}


def rendern(args) -> None:
    s, k, sk = baue(args.form, args.stil)
    aus = Path(args.aus)
    aus.mkdir(parents=True, exist_ok=True)
    for name, richtung in ANSICHTEN.items():
        cam = kamera(sk, richtung)
        if name == "vorn":
            (aus / "kamera.json").write_text(json.dumps(kamera_daten(cam, k)), encoding="utf-8")
        s.render.filepath = str(aus / f"{name}.png")
        bpy.ops.render.render(write_still=True)
        print("geschrieben", s.render.filepath)


def _strahl(kd: dict, u: float, v: float) -> tuple[Vector, Vector]:
    """Strahl von der Kamera durch den Bildpunkt (u, v in Anteilen, v von oben), Weltkoordinaten."""
    M = Matrix(kd["matrix"])
    t = kd["sensor"] / 2 / kd["lens"]
    d = Vector(((u - 0.5) * 2 * t, (0.5 - v) * 2 * t, -1.0)).normalized()
    return M.translation, (M.to_3x3() @ d).normalized()


def projizieren(kd: dict, p_welt: Vector) -> tuple[float, float]:
    """Bildpunkt (Pixel, y nach unten) eines Weltpunkts in der Kamera `kd`."""
    M = Matrix(kd["matrix"]).inverted()
    c = M @ p_welt
    t = kd["sensor"] / 2 / kd["lens"]
    u = 0.5 + (c.x / -c.z) / (2 * t)
    v = 0.5 - (c.y / -c.z) / (2 * t)
    return u * kd["groesse"], v * kd["groesse"]


def marken(args) -> None:
    """Landmarken des Renderings von vorn auf das Grundmodell zurückprojizieren."""
    kd = json.loads(Path(args.kamera).read_text(encoding="utf-8"))
    lm = json.loads(Path(args.landmarken).read_text(encoding="utf-8"))
    if not lm.get("gefunden"):
        raise SystemExit("keine Landmarken im Rendering")
    _, k, sk = baue(args.form)
    bpy.context.view_layer.update()
    punkte = figur.PUNKTE["Figur"]
    mesh = k.data
    # Nummern des Netzes = Nummern des Grundmodells (Hilfsgeometrie liegt dahinter und ist gelöscht)
    for i in (0, 100, len(mesh.vertices) - 1):
        assert (mesh.vertices[i].co - punkte[i]).length < 1e-6, "Eckpunktnummern passen nicht zum Grundmodell"
    Mi = k.matrix_world.inverted()
    # Strahl gegen das unverfeinerte Netz (Glättung aus), damit die Flächennummern die des Grundmodells sind
    glatt = k.modifiers.get("Glatt")
    if glatt:
        glatt.show_viewport = False
    bpy.context.view_layer.update()
    deps = bpy.context.evaluated_depsgraph_get()
    zuordnung, fehlend = [], []
    for n, (x, y, _) in enumerate(lm["punkte"]):
        o, d = _strahl(kd, x / lm["breite"], y / lm["hoehe"])
        ok, ort, _, idx = k.ray_cast(Mi @ o, (Mi.to_3x3() @ d).normalized(), depsgraph=deps)
        if not ok:
            zuordnung.append(None)
            fehlend.append(n)
            continue
        ecken = list(mesh.polygons[idx].vertices)
        w = np.array([1.0 / max((mesh.vertices[e].co - ort).length, 1e-5) for e in ecken])
        w /= w.sum()
        zuordnung.append({"ecken": ecken, "gewichte": [round(float(g), 5) for g in w]})
    if glatt:
        glatt.show_viewport = True
    MARKEN.write_text(json.dumps({"quelle": "Face Landmarker von MediaPipe auf einem Rendering des Grundmodells "
                                  "von MakeHuman (C männlich) von vorn, Strahl je Landmarke auf das Netz",
                                  "fehlend": fehlend, "zuordnung": zuordnung}, ensure_ascii=False), encoding="utf-8")
    print("geschrieben", MARKEN, "fehlend:", fehlend)


# ---------------------------------------------------------------------- Anpassen ohne Rendern


def _ziel_laden(pfad: str):
    idx, delta = [], []
    with gzip.open(koerperform._datei(pfad), "rt", encoding="utf-8") as f:
        for zeile in f:
            t = zeile.split()
            if len(t) == 4 and not zeile.startswith("#"):
                idx.append(int(t[0]))
                dx, dy, dz = float(t[1]), float(t[2]), float(t[3])
                delta.append((dx * koerperform.SKALA, -dz * koerperform.SKALA, dy * koerperform.SKALA))
    return np.array(idx, dtype=int), np.array(delta, dtype=float)


class Netz:
    """Eckpunkte des Grundmodells mit Körperform, plus Gesichtsregler als Verschiebungen."""

    def __init__(self, form: koerperform.Form):
        basis = koerperform.Form(form.name, form.geschlecht, form.muskeln, form.gewicht, form.proportionen,
                                 form.brust, form.festigkeit, form.groesse, {})
        punkte, _, _, _ = figur.lies_obj(figur.QUELLE / "base.obj")
        koerperform.wende_an(punkte, basis)
        self.basis = np.array([tuple(p) for p in punkte])
        self.ziele: dict[str, tuple[np.ndarray, np.ndarray]] = {}

    def ziel(self, pfad: str):
        if pfad not in self.ziele:
            self.ziele[pfad] = _ziel_laden(pfad)
        return self.ziele[pfad]

    def punkte(self, regler: dict[str, float]) -> np.ndarray:
        V = self.basis.copy()
        for name, wert in gesicht.ziele(regler).items():
            idx, delta = self.ziel(name)
            V[idx] += wert * delta
        return V


def _landmarken_2d(V: np.ndarray, zuordnung: list, kd: dict) -> np.ndarray:
    Mk = Matrix(kd["koerper_matrix"])
    P = np.zeros((len(zuordnung), 2))
    for n, z in enumerate(zuordnung):
        if z is None:
            continue
        p = np.zeros(3)
        for e, w in zip(z["ecken"], z["gewichte"]):
            p += w * V[e]
        P[n] = projizieren(kd, Mk @ Vector(p))
    return P


def anpassen(args) -> None:
    """Regler Paar für Paar (`gesicht.PAARE`) an die Sollmaße bringen; die Charakterregler aus
    `gesicht.FEST` bleiben, wie sie sind. Je Schritt die Empfindlichkeit jedes Paars um den aktuellen
    Wert (±0,25), Änderung je Schritt auf ±0,4 begrenzt, Werte auf ±1, danach alle Maße neu."""
    kd = json.loads(Path(args.kamera).read_text(encoding="utf-8"))
    zuordnung = json.loads(MARKEN.read_text(encoding="utf-8"))["zuordnung"]
    soll = json.loads(Path(args.soll).read_text(encoding="utf-8"))
    netz = Netz(koerperform.FORMEN[args.form])
    regler = dict(gesicht.FEST)
    if args.start:
        regler.update(json.loads(Path(args.start).read_text(encoding="utf-8")))
    for _, name in gesicht.PAARE:
        regler.setdefault(name, 0.0)

    def masse_fuer(r):
        return gesicht_masse.masse(_landmarken_2d(netz.punkte(r), zuordnung, kd))

    ist = masse_fuer(regler)
    print("Start: Abweichung %.1f %%" % gesicht_masse.abweichung(ist, soll))
    for schritt in range(args.schritte):
        neu = dict(regler)
        for mass, name in gesicht.PAARE:
            if not (np.isfinite(ist.get(mass, np.nan)) and mass in soll):
                continue
            h = 0.25
            oben, unten = dict(regler), dict(regler)
            oben[name] = min(1.0, regler[name] + h)
            unten[name] = max(-1.0, regler[name] - h)
            j = (masse_fuer(oben)[mass] - masse_fuer(unten)[mass]) / (oben[name] - unten[name])
            if abs(j) < 1e-5:
                continue
            delta = float(np.clip((soll[mass] - ist[mass]) / j, -0.4, 0.4))
            lo, hi = gesicht.GRENZEN.get(name, (-1.0, 1.0))
            neu[name] = float(np.clip(regler[name] + delta, lo, hi))
        regler = neu
        ist = masse_fuer(regler)
        print("Schritt %d: Abweichung %.1f %%" % (schritt + 1, gesicht_masse.abweichung(ist, soll)))
    aus = Path(args.aus)
    aus.write_text(json.dumps({k: round(v, 3) for k, v in regler.items()}, indent=1, ensure_ascii=False), encoding="utf-8")
    print("geschrieben", aus)
    print("Maße Modell / Soll:")
    for k in soll:
        print("  %-22s %.3f  %.3f" % (k, ist[k], soll[k]) if np.isfinite(ist[k]) else "  %-22s fehlt (Landmarke ohne Zuordnung)" % k)


def profil(args) -> None:
    """Silhouette des Kopfes im Profil (von links): je Höhe der vorderste Punkt, Marken wie bei der
    Silhouette eines Fotos (Stirn, Nasenwurzel, Nasenspitze, Subnasale, Kinn), Verhältnisse zur Höhe."""
    netz = Netz(koerperform.FORMEN[args.form])
    regler = dict(json.loads(Path(args.regler).read_text(encoding="utf-8"))) if args.regler else {}
    V = netz.punkte(regler)
    # Gesicht von der Stirnmarke (Landmarke 10) bis unter das Kinn (152), nur die Mitte
    zuordnung = json.loads(MARKEN.read_text(encoding="utf-8"))["zuordnung"]
    z_oben = gesicht._marke(V, zuordnung, 10)[2] + 0.005
    z_unten = gesicht._marke(V, zuordnung, 152)[2] - 0.015
    # nur die Vorderseite (vor der Ohrebene), Zeilen zu 4 mm: Zeilen ohne Gesichtspunkt dürfen nicht auf den
    # Hinterkopf zurückfallen
    y_ohr = gesicht._marke(V, zuordnung, 234)[1]
    aus = V[(V[:, 2] <= z_oben) & (V[:, 2] >= z_unten) & (np.abs(V[:, 0]) < 0.06) & (V[:, 1] < y_ohr - 0.03)]
    zeilen = {}
    for x, y, z in aus:
        key = round(z * 250)
        zeilen[key] = min(zeilen.get(key, 1.0), y)
    zs = np.array(sorted(zeilen, reverse=True), dtype=float) / 250
    ys = np.array([zeilen[round(z * 250)] for z in zs])
    print(json.dumps({"z_mm": [round(z * 1000) for z in zs], "vorn_mm": [round(-y * 1000, 1) for y in ys]}))
    gesicht.silhouette_marken(-ys, zs, drucken=True)
    # Dieselben Verhältnisse an den Zeilen der Landmarken (Stirn 10, Nasenwurzel 168, Nasenspitze 1,
    # Subnasale 2, Kinn 152): unabhängig von der Suche nach Extrempunkten
    vorn = -ys

    def zeile(n: int) -> float:
        z = gesicht._marke(V, zuordnung, n)[2]
        return float(vorn[int(np.argmin(np.abs(zs - z)))])

    z_w, z_k = gesicht._marke(V, zuordnung, 168)[2], gesicht._marke(V, zuordnung, 152)[2]
    h = z_w - z_k
    print("Verhältnisse an den Landmarken:", json.dumps({
        "nase_vorsprung": round((zeile(1) - zeile(168)) / h, 3), "kinn_vorsprung": round((zeile(152) - zeile(2)) / h, 3),
        "stirn_vorsprung": round((zeile(10) - zeile(168)) / h, 3),
        "nase_laenge_profil": round((z_w - gesicht._marke(V, zuordnung, 2)[2]) / h, 3)}))


def main() -> None:
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="stufe", required=True)
    r = sub.add_parser("rendern")
    r.add_argument("--form", default="maennlich")
    r.add_argument("--stil")
    r.add_argument("--aus", required=True)
    m = sub.add_parser("marken")
    m.add_argument("--form", default="maennlich")
    m.add_argument("--landmarken", required=True)
    m.add_argument("--kamera", required=True)
    a = sub.add_parser("anpassen")
    a.add_argument("--form", default="maennlich")
    a.add_argument("--soll", required=True)
    a.add_argument("--kamera", required=True)
    a.add_argument("--start")
    a.add_argument("--aus", required=True)
    a.add_argument("--schritte", type=int, default=4)
    a.add_argument("--daempfung", type=float, default=0.05)
    p = sub.add_parser("profil")
    p.add_argument("--form", default="maennlich")
    p.add_argument("--regler")
    args = ap.parse_args()
    {"rendern": rendern, "marken": marken, "anpassen": anpassen, "profil": profil}[args.stufe](args)


if __name__ == "__main__":
    main()
