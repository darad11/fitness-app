"""FORM-Kleidung für die Figur (D-414, Feinschliff D-417, Korrekturrunde D-419).

Nach dem Text des Produktinhabers (`docs/prompts/uebungen-korrektur-logos-FORM.md`, Abschnitt 2):

- **STEP Running Tee** in Nacht #0C1219 mit Rundhals; kleines F vorn auf der linken Brust des Trägers,
  F zwischen den Schulterblättern, schmale Lime-Einfassung an den seitlichen Schlitzen am Saum.
- **STEP Shorts** in Graphit #4A4F57; Kordelenden in Lime vorn am Bund, F außen am linken Bein.

Links und rechts gelten aus Sicht des Trägers (links = +x in Blender). Die Teile entstehen aus dem Netz
der Figur, ohne fremde Dateien: Die Flächen des bedeckten Bereichs werden kopiert, nach außen versetzt
(eng anliegend wie Laufkleidung), geglättet und hängen mit denselben Gewichten am Skelett; so folgen
sie jeder Haltung ohne Stoffsimulation. Säume, Halsausschnitt und Schlitze sind keine Netzkanten,
sondern ein Feld (Abstand zum Rand in Metern, wie bei den Muskelzonen): Der Stoff endet dort scharf.
Der Rundhals wird aus dem Netz bestimmt (Mitte und Maße der Halshaut plus Kugel am Halsansatz),
darum bleibt der Hals in jeder Haltung frei (D-417).

**Logos** (Abschnitt 3): das FORM-F aus `public/brand/symbol-f-gruen.svg`, gerastert (`quelle/form-f.png`),
als Bild in Originalproportionen eben auf den Stoff projiziert (`_logo_rahmen`): Mittelpunkt und Blickrichtung
je Logo aus der Körpergeometrie, die Bildebene senkrecht zur mittleren Oberflächennormalen; so wird das
F nicht in die Breite gezogen. Das Bild hängt an den Eckpunkten und bewegt sich mit dem Stoff. Eine
Maske (nur Flächen, die zur Bildebene zeigen) verhindert ein Spiegelbild auf der Gegenseite. Jedes F
hat einen schmalen Rand in Stoffarbe und liegt über den Muskelzonen (Abschnitt 4). Größen, Lagen und
Farben kommen aus einer Konfiguration (`LOGOS`, `KOLLEKTION`) für alle Übungen und Körper.
"""
from __future__ import annotations

import math
import re
from pathlib import Path

import bpy
import bmesh  # erst nach bpy verfügbar (Blender als Modul)
from mathutils import Vector

import szene
import zonen

NACHT = "#0C1219"  # STEP Running Tee
GRAPHIT = "#4A4F57"  # STEP Shorts
LIME = szene.LIME
HELL = "#AAB2BE"  # hell Ton in Ton: --fg-muted, dieselbe Farbfamilie wie Nacht und Graphit
LOGO_FARBEN = {"lime": LIME, "hell": HELL}
KOLLEKTION = {"brust": "hell", "ruecken": "lime", "bein": "lime"}  # Logofarben der Kollektion
SVG_F = Path(__file__).resolve().parent.parent.parent / "public" / "brand" / "symbol-f-gruen.svg"
QUELLE = Path(__file__).resolve().parent / "quelle"

# Lage der Säume (Körperkoordinaten wie bei den Zonen, `zonen.Koordinaten`)
SHIRT_SAUM = 0.02  # Anteil Hüftgelenk (0) bis Halsansatz (1): Saum knapp über den Hüftgelenken
AERMEL = 0.40  # Anteil Schulter (0) bis Ellbogen (1): kurzer Ärmel
HOSE_BUND = 0.22  # Bund knapp unter dem Nabel
HOSE_BEIN = 0.40  # Anteil Hüfte (0) bis Knie (1): Laufshorts
HALS_RAND = 0.008  # Abstand des Ausschnitts zur Halshaut, m
AUSSCHNITT_R = 0.075  # Kugel am Halsansatz: Radius des runden Ausschnitts, m
ABSTAND = {"shirt": 0.0065, "hose": 0.0048}  # Stoff über der Haut, m
# Lime-Details als Bilder auf dem Stoff (wie die Logos, `_detail_bilder`): Seitenschlitze am Saum des
# Tees mit Einfassung (der Schlitz schneidet den Stoff), Kordelenden vorn am Bund der Shorts. Maße in m.
SCHLITZ = {"hoehe": 0.05, "breite": 0.006, "einfassung": 0.0035}
KORDEL = {"abstand": 0.012, "laenge": 0.06, "breite": 0.003, "ende": 0.008, "ende_breite": 0.0045}
DETAILS = {
    "schlitz_l": {"teil": "shirt", "bild": "schlitz", "seite": 0.08, "winkel": 90.0, "lage": SHIRT_SAUM, "hoch": 0.025},
    "schlitz_r": {"teil": "shirt", "bild": "schlitz", "seite": 0.08, "winkel": -90.0, "lage": SHIRT_SAUM, "hoch": 0.025},
    "kordel": {"teil": "hose", "bild": "kordel", "seite": 0.08, "winkel": 0.0, "lage": HOSE_BUND, "hoch": -0.034},
}
# Logos: Höhe des F in Metern; Lage am Rumpf quer zur Mitte (m, links positiv) und unter der
# Schulternaht (Schultergelenk), Blickrichtung der Bildebene; am linken Oberschenkel Winkel um den
# Knochen (0 vorn, 90 außen) und Anteil Hüfte→Knie
LOGOS = {
    "brust": {"teil": "shirt", "hoehe": 0.040, "quer": 0.07, "unter_schulter": 0.085, "blick": (0.0, -1.0, 0.0)},
    "ruecken": {"teil": "shirt", "hoehe": 0.080, "quer": 0.0, "unter_schulter": 0.08, "blick": (0.0, 1.0, 0.0)},
    "bein": {"teil": "hose", "hoehe": 0.035, "winkel": 80.0, "lage": 0.30},
}
F_ANTEIL = 0.861  # Höhe des F im quadratischen Bild (`_f_bilder`)
RAND_PX = 32  # Rand in Stoffarbe um das F, px im 1024-px-Bild (rund 3,6 % der F-Höhe)


# ---------------------------------------------------------------------- Felder je Eckpunkt


def _halsmasse(koerper: bpy.types.Object, k: zonen.Koordinaten) -> tuple[float, float, float]:
    """Mitte (y) und Halbachsen (quer, vorn–hinten) der Halshaut am Halsansatz, aus dem Netz."""
    hals = k.kopf["neck01"]
    haut = [v.co for v in koerper.data.vertices
            if k.w(v.index, "neck01", "neck02", "neck03") > 0.5 and -0.005 < v.co.z - hals.z < 0.035]
    ys = [p.y for p in haut]
    return (min(ys) + max(ys)) / 2, max(abs(p.x) for p in haut) + HALS_RAND, (max(ys) - min(ys)) / 2 + HALS_RAND


def _felder(koerper: bpy.types.Object, skelett: bpy.types.Object) -> dict:
    """Je Eckpunkt: Abstand zum Rand von Shirt und Hose (m, positiv = bedeckt), Felder der
    Lime-Details und das Körperteil mit dem größten Gewicht."""
    k = zonen.Koordinaten(koerper, skelett)
    kopf = k.kopf
    hals = kopf["neck01"]
    hals_y, hals_x, hals_tiefe = _halsmasse(koerper, k)
    kugel = Vector((0.0, hals_y - 0.015, hals.z - 0.025))
    achse = (k.N - k.O).normalized()
    L = (k.N - k.O).length
    felder: dict = {n: [] for n in ("shirt", "hose", "teil")}
    # Rumpf mit dem ganzen Hals: Der Ausschnitt schneidet ihn, so bleibt das Feld dort stetig
    rumpfknochen = ("root", "spine01", "spine02", "spine03", "spine04", "spine05", "neck01", "neck02", "neck03",
                    "pelvis.L", "pelvis.R", "clavicle.L", "clavicle.R", "breast.L", "breast.R", "shoulder01.L",
                    "shoulder01.R")
    for v in koerper.data.vertices:
        i, p = v.index, v.co
        seite = "L" if p.x >= 0 else "R"
        x = 1 if seite == "L" else -1
        # Körperteil mit dem größten Gewicht: Oberarm, Rumpf (mit Hals), Oberschenkel oder Rest
        # (Unterarm, Hand, Kopf, Gesicht, Unterschenkel, Fuß; nie bedeckt)
        arm = k.w(i, f"upperarm01.{seite}", f"upperarm02.{seite}", f"achsel.{seite}")
        bein = k.w(i, f"upperleg01.{seite}", f"upperleg02.{seite}")
        rumpf = k.w(i, *rumpfknochen)
        rest = max(0.0, 1.0 - arm - bein - rumpf)
        teil = max((arm, "arm"), (bein, "bein"), (rumpf, "rumpf"), (rest, "rest"))[1]
        theta, s, _ = k.rumpf(p)
        # Rundhals: außerhalb der Kugel am Halsansatz und, darüber, außerhalb des Halses (Ellipse um
        # die gemessene Halsmitte); beides als Abstand in Metern, positiv = Stoff
        f_kugel = (p - kugel).length - AUSSCHNITT_R
        if p.z > kugel.z:
            e = math.hypot(p.x / hals_x, (p.y - hals_y) / hals_tiefe)
            ausschnitt = min(f_kugel, (e - 1.0) * hals_tiefe)
        else:
            ausschnitt = f_kugel
        shirt = hose = -1.0
        if teil == "arm":
            _, t, La, _ = k.glied(p, f"upperarm01.{seite}", f"lowerarm01.{seite}", Vector((0, -1, 0)), seite)
            shirt = (AERMEL - t) * La
        elif teil == "rumpf":
            shirt = min((s - SHIRT_SAUM) * L, ausschnitt)
            hose = (HOSE_BUND - s) * L
        elif teil == "bein":
            _, t, Lb, _ = k.glied(p, f"upperleg01.{seite}", f"lowerleg01.{seite}", Vector((0, -1, 0)), seite)
            hose = (HOSE_BEIN - t) * Lb
            shirt = (s - SHIRT_SAUM) * L
        felder["shirt"].append(shirt)
        felder["hose"].append(hose)
        felder["teil"].append(teil)
    felder["k"] = k
    return felder


def _rahmen(koerper: bpy.types.Object, k: zonen.Koordinaten, teile: list[str], lage: dict, seite: float) -> dict:
    """Bildebene eines Logos oder Details: Mittelpunkt auf der Haut (Ruhehaltung), Normale als Mittel
    der Umgebung (3 cm), Hochachse längs des Körperteils, Querachse so, dass das Bild von außen
    richtig herum liegt. Lage am Rumpf über `quer`/`unter_schulter`/`blick` (Logos) oder über
    `winkel`/`lage` (Winkel um die Rumpfachse, 0 vorn, links positiv; Anteil Hüfte→Hals), am linken
    Oberschenkel bei `teil` „hose“ mit `winkel`/`lage` um den Knochen; `hoch` verschiebt den
    Mittelpunkt längs (m)."""
    verts = koerper.data.vertices
    if lage["teil"] == "hose" and "winkel" in lage and "lage" in lage and lage.get("bild") is None:
        kandidaten = []
        for i, t in enumerate(teile):
            if t == "bein" and verts[i].co.x > 0:
                th, tt, _, _ = k.glied(verts[i].co, "upperleg01.L", "lowerleg01.L", Vector((0, -1, 0)), "L")
                kandidaten.append((abs(th - lage["winkel"]) / 60 + abs(tt - lage["lage"]), i))
        achse = (k.kopf["upperleg01.L"] - k.kopf["lowerleg01.L"]).normalized()
    elif "quer" in lage:
        z0 = k.kopf["upperarm01.L"].z - lage["unter_schulter"]
        blick = Vector(lage["blick"])
        kandidaten = [(abs(verts[i].co.x - lage["quer"]) + abs(verts[i].co.z - z0), i)
                      for i, t in enumerate(teile) if t == "rumpf" and verts[i].normal.dot(blick) > 0.5]
        achse = (k.N - k.O).normalized()
    else:
        # Rumpf und Hüfte (am Saum zählt die Hüftseite zum Bein), nicht die Arme
        kandidaten = []
        for i, t in enumerate(teile):
            if t in ("rumpf", "bein"):
                th, s, _ = k.rumpf(verts[i].co)
                th *= 1 if verts[i].co.x >= 0 else -1
                kandidaten.append((abs(th - lage["winkel"]) / 90 + abs(s - lage["lage"]), i))
        achse = (k.N - k.O).normalized()
    _, beste = min(kandidaten)
    P0 = verts[beste].co.copy()
    n0 = sum((v.normal for v in verts if (v.co - P0).length < 0.03), Vector()).normalized()
    hoch = (achse - achse.dot(n0) * n0).normalized()
    quer = hoch.cross(n0)
    return {"P0": P0 + hoch * lage.get("hoch", 0.0), "n": n0, "hoch": hoch, "quer": quer, "seite": seite}


# ---------------------------------------------------------------------- Netz der Teile


def _glaetten(bm: bmesh.types.BMesh, runden: int, anteil: float = 0.5) -> None:
    """Laplace-Glättung ohne Ränder (Taubin: abwechselnd glätten und zurückschieben, kein Schrumpfen)."""
    for r in range(runden * 2):
        f = anteil if r % 2 == 0 else -anteil * 1.04
        neu = {}
        for v in bm.verts:
            if v.is_boundary or not v.link_edges:
                continue
            mitte = sum((e.other_vert(v).co for e in v.link_edges), Vector()) / len(v.link_edges)
            neu[v] = v.co + (mitte - v.co) * f
        for v, co in neu.items():
            v.co = co


def _teil(name: str, koerper: bpy.types.Object, skelett: bpy.types.Object, feld: list[float],
          abstand: float, rahmen: dict[str, dict], rand: float = 0.03) -> bpy.types.Object:
    """Kleidungsstück: Flächen, deren Eckpunkte höchstens `rand` außerhalb des Saums liegen, kopiert,
    versetzt und geglättet; mit denselben Gewichten am Skelett. Je Logo und Detail eine UV-Schicht
    (ebene Projektion auf die Bildebene) und eine Maske für die Flächen, die zur Bildebene zeigen."""
    quelle = koerper.data
    behalten = {v.index for v in quelle.vertices if feld[v.index] > -rand}
    bm = bmesh.new()
    bm.from_mesh(quelle)
    bm.verts.ensure_lookup_table()
    weg = [v for v in bm.verts if v.index not in behalten]
    bmesh.ops.delete(bm, geom=weg, context="VERTS")
    bm.normal_update()
    # Abstand zur Haut, dann glätten; danach nirgends näher als 3 mm an der Haut
    haut = {v: (v.co.copy(), v.normal.copy()) for v in bm.verts}
    for v in bm.verts:
        v.co = v.co + v.normal * abstand
    _glaetten(bm, 6)
    for v in bm.verts:
        co0, n0 = haut[v]
        tiefe = (v.co - co0).dot(n0)
        if tiefe < 0.003:
            v.co = v.co + n0 * (0.003 - tiefe)
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    # Gewichte und Zonen kommen mit dem Netz (bmesh übernimmt sie je Eckpunkt, die Gewichte mit den
    # Nummern der Gruppen); dazu dieselben Gruppen in derselben Reihenfolge wie am Körper. Die Felder
    # der Säume und Details nach den ursprünglichen Nummern der Eckpunkte.
    alt = sorted(behalten)
    for g in koerper.vertex_groups:
        obj.vertex_groups.new(name=g.name)
    for attr_name in ("Zone", "ZoneMit"):
        if attr_name not in mesh.attributes:
            ziel = mesh.attributes.new(attr_name, "FLOAT", "POINT")
            for i in range(len(alt)):
                ziel.data[i].value = -1.0
    saum = mesh.attributes.new("Saum", "FLOAT", "POINT")
    for neu_i, alt_i in enumerate(alt):
        saum.data[neu_i].value = feld[alt_i]
    for logo_name, r in rahmen.items():
        schicht = mesh.uv_layers.new(name="Logo" + logo_name)
        maske = mesh.attributes.new("Maske" + logo_name, "FLOAT", "POINT")
        uv = []
        for neu_i, alt_i in enumerate(alt):
            v = quelle.vertices[alt_i]
            d = v.co - r["P0"]
            uv.append((d.dot(r["quer"]) / r["seite"] + 0.5, d.dot(r["hoch"]) / r["seite"] + 0.5))
            maske.data[neu_i].value = max(0.0, min(1.0, (v.normal.dot(r["n"]) - 0.15) / 0.25))
        for loop in mesh.loops:
            schicht.data[loop.index].uv = uv[loop.vertex_index]
    for poly in mesh.polygons:
        poly.use_smooth = True
    obj.parent = koerper.parent
    mod = obj.modifiers.new("Skelett", "ARMATURE")
    mod.object = skelett
    dicke = obj.modifiers.new("Dicke", "SOLIDIFY")
    dicke.thickness = 0.0012
    dicke.offset = -1.0
    sub = obj.modifiers.new("Glatt", "SUBSURF")
    sub.levels = 1
    sub.render_levels = 2
    return obj


# ---------------------------------------------------------------------- FORM-F als Bild


def _pfad_polygon(d: str) -> list[tuple[float, float]]:
    """SVG-Pfad (absolute M, L, C, Z) als Polygon; Kurven in 24 Stücke."""
    tokens = re.findall(r"[MLCZ]|-?\d*\.?\d+(?:e-?\d+)?", d)
    pts: list[tuple[float, float]] = []
    i, cur, cmd = 0, (0.0, 0.0), ""
    while i < len(tokens):
        if tokens[i] in "MLCZ":
            cmd = tokens[i]
            i += 1
            if cmd == "Z":
                continue
        if cmd in ("M", "L"):
            cur = (float(tokens[i]), float(tokens[i + 1]))
            pts.append(cur)
            i += 2
        elif cmd == "C":
            p1, p2, p3 = [(float(tokens[i + j]), float(tokens[i + j + 1])) for j in (0, 2, 4)]
            for n in range(1, 25):
                t, mt = n / 24, 1 - n / 24
                pts.append((mt**3 * cur[0] + 3 * mt * mt * t * p1[0] + 3 * mt * t * t * p2[0] + t**3 * p3[0],
                            mt**3 * cur[1] + 3 * mt * mt * t * p1[1] + 3 * mt * t * t * p2[1] + t**3 * p3[1]))
            cur = p3
            i += 6
        else:
            raise ValueError(f"SVG-Pfad: unbekannt {tokens[i]}")
    return pts


def _speichern(bild: bpy.types.Image, pfad: Path) -> None:
    QUELLE.mkdir(parents=True, exist_ok=True)
    bild.alpha_mode = "STRAIGHT"
    bild.filepath_raw = str(pfad)
    bild.file_format = "PNG"
    bild.save()


def _f_bilder() -> tuple[bpy.types.Image, bpy.types.Image]:
    """Das FORM-F als quadratisches Bild mit Deckkraft (weiß auf durchsichtig, 1024 px, 4-fach
    überabgetastet), gerastert aus `public/brand/symbol-f-gruen.svg`, und sein Rand (das F um
    `RAND_PX` verbreitert); beide gespeichert in `quelle/form-f.png` und `quelle/form-f-rand.png`.
    Das F füllt `F_ANTEIL` der Höhe, in der Mitte."""
    import numpy as np

    N, U = 1024, 4
    pfad_f, pfad_rand = QUELLE / "form-f.png", QUELLE / "form-f-rand.png"
    if pfad_f.exists():
        bild = bpy.data.images.load(str(pfad_f), check_existing=True)
    else:
        polys = [_pfad_polygon(d) for d in re.findall(r'<path[^>]*\sd="([^"]+)"', SVG_F.read_text(encoding="utf-8"))]
        xs = [x for p in polys for x, _ in p]
        ys = [y for p in polys for _, y in p]
        cx, cy = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2
        seite = (max(ys) - min(ys)) / F_ANTEIL
        S = N * U
        zaehl = np.zeros((S, S + 1), dtype=np.int32)
        yc = np.arange(S) + 0.5
        for poly in polys:
            pts = [((x - cx) / seite * S + S / 2, (y - cy) / seite * S + S / 2) for x, y in poly]
            for (x1, y1), (x2, y2) in zip(pts, pts[1:] + pts[:1]):
                if y1 == y2:
                    continue
                zeilen = np.nonzero((y1 > yc) != (y2 > yc))[0]
                if zeilen.size == 0:
                    continue
                kreuz = x1 + (yc[zeilen] - y1) * (x2 - x1) / (y2 - y1)
                spalten = np.clip(np.ceil(kreuz - 0.5).astype(int), 0, S)
                np.add.at(zaehl, (zeilen, spalten), 1)
        innen = (np.cumsum(zaehl, axis=1)[:, :S] % 2).astype(np.float32)
        alpha = innen.reshape(N, U, N, U).mean(axis=(1, 3))[::-1]  # SVG zählt y nach unten, Blender nach oben
        bild = bpy.data.images.new("FORM-F", N, N, alpha=True)
        px = np.ones((N, N, 4), dtype=np.float32)
        px[..., 3] = alpha
        bild.pixels.foreach_set(px.ravel())
        _speichern(bild, pfad_f)
    if pfad_rand.exists():
        rand = bpy.data.images.load(str(pfad_rand), check_existing=True)
    else:
        px = np.empty(N * N * 4, dtype=np.float32)
        bild.pixels.foreach_get(px)
        form = px.reshape(N, N, 4)[..., 3] > 0.5
        for _ in range(RAND_PX):  # Verbreitern um je ein Pixel in alle Richtungen
            erweitert = form.copy()
            erweitert[1:] |= form[:-1]
            erweitert[:-1] |= form[1:]
            erweitert[:, 1:] |= form[:, :-1]
            erweitert[:, :-1] |= form[:, 1:]
            form = erweitert
        weich = form.astype(np.float32)
        for _ in range(2):  # Kanten glätten
            weich = (weich + np.roll(weich, 1, 0) + np.roll(weich, -1, 0) + np.roll(weich, 1, 1) + np.roll(weich, -1, 1)) / 5
        rand = bpy.data.images.new("FORM-F-Rand", N, N, alpha=True)
        px = np.ones((N, N, 4), dtype=np.float32)
        px[..., 3] = weich
        rand.pixels.foreach_set(px.ravel())
        _speichern(rand, pfad_rand)
    return bild, rand


def _detail_bilder() -> dict[str, dict[str, bpy.types.Image]]:
    """Bilder der Lime-Details, je Art mit Deckkraft für Lime (`lime`) und, beim Schlitz, für den
    Schnitt im Stoff (`schnitt`); 512 px auf `DETAILS[...]["seite"]` Metern, gespeichert in `quelle/`."""
    import numpy as np

    N = 512
    aus: dict[str, dict[str, bpy.types.Image]] = {}

    def bild(name: str, maske) -> bpy.types.Image:
        pfad = QUELLE / f"detail-{name}.png"
        if pfad.exists():
            return bpy.data.images.load(str(pfad), check_existing=True)
        px = np.ones((N, N, 4), dtype=np.float32)
        px[..., 3] = maske
        b = bpy.data.images.new("Detail-" + name, N, N, alpha=True)
        b.pixels.foreach_set(px.ravel())
        _speichern(b, pfad)
        return b

    # Koordinaten in Metern, Mitte des Bildes = Mittelpunkt des Rahmens, y nach oben
    for art in ("schlitz", "kordel"):
        seite = DETAILS["schlitz_l" if art == "schlitz" else "kordel"]["seite"]
        lin = (np.arange(N) + 0.5) / N * seite - seite / 2
        X, Y = np.meshgrid(lin, lin)  # Zeile 0 ist in Blender unten: y steigt mit der Zeile
        if art == "schlitz":
            # Schlitz von der Saumkante (unten, -hoch) nach oben, Einfassung beidseits
            unten = -DETAILS["schlitz_l"]["hoch"]
            im_schlitz = (np.abs(X) < SCHLITZ["breite"] / 2) & (Y > unten - 0.01) & (Y < unten + SCHLITZ["hoehe"])
            einfassung = ((np.abs(X) < SCHLITZ["breite"] / 2 + SCHLITZ["einfassung"]) & (Y > unten - 0.01)
                          & (Y < unten + SCHLITZ["hoehe"] + SCHLITZ["einfassung"]) & ~im_schlitz)
            aus[art] = {"schnitt": bild("schlitz-schnitt", im_schlitz.astype(np.float32)),
                        "lime": bild("schlitz-lime", einfassung.astype(np.float32))}
        else:
            # Zwei Kordelenden vom Bund (oben) nach unten, unten ein dickeres Ende
            oben = -DETAILS["kordel"]["hoch"]
            tief = oben - Y
            breite = np.where(tief > KORDEL["laenge"] - KORDEL["ende"], KORDEL["ende_breite"], KORDEL["breite"])
            band = ((np.abs(np.abs(X) - KORDEL["abstand"]) < breite / 2) & (tief > 0.004) & (tief < KORDEL["laenge"]))
            aus[art] = {"lime": bild("kordel-lime", band.astype(np.float32))}
    return aus


# ---------------------------------------------------------------------- Material


def stoff_material(name: str, farbe: str, zonen_an: bool, logos: list[tuple[str, str]], details: list[str],
                   zonen_staerke: float = 1.0, mit_deckkraft: float = 0.5) -> bpy.types.Material:
    """Stoff matt mit leichtem Glanz (Sheen); endet scharf am Saum (Attribut „Saum“); auf Wunsch
    Muskelzonen in Lime auf dem Stoff (`zonen_staerke` dämpft sie); darüber die Lime-Details
    (`details`, Schlüssel aus `DETAILS`: Bild, Schnitt) und die Logos (je (Name, Farbe): UV-Schicht
    `Logo<Name>`, Maske `Maske<Name>`) wie ein Aufdruck mit schmalem Rand in Stoffarbe."""
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    bsdf = nodes["Principled BSDF"]
    bsdf.inputs["Roughness"].default_value = 0.82
    bsdf.inputs["Sheen Weight"].default_value = 0.35
    bsdf.inputs["Sheen Roughness"].default_value = 0.45

    def maske(attribut: str, von: float, bis: float):
        attr = nodes.new("ShaderNodeAttribute")
        attr.attribute_name = attribut
        attr.attribute_type = "GEOMETRY"
        rng = nodes.new("ShaderNodeMapRange")
        rng.interpolation_type = "SMOOTHSTEP"
        rng.clamp = True
        rng.inputs["From Min"].default_value = von
        rng.inputs["From Max"].default_value = bis
        links.new(attr.outputs["Fac"], rng.inputs["Value"])
        return rng.outputs["Result"]

    def mal(a, b):
        m = nodes.new("ShaderNodeMath")
        m.operation = "MULTIPLY"
        for eingang, wert in ((0, a), (1, b)):
            if isinstance(wert, float):
                m.inputs[eingang].default_value = wert
            else:
                links.new(wert, m.inputs[eingang])
        return m.outputs[0]

    def mischen(faktor, a, b):
        mix = nodes.new("ShaderNodeMix")
        mix.data_type = "RGBA"
        links.new(faktor, mix.inputs[0])
        for eingang, wert in ((6, a), (7, b)):
            if isinstance(wert, tuple):
                mix.inputs[eingang].default_value = wert
            else:
                links.new(wert, mix.inputs[eingang])
        return mix.outputs[2]

    stoff = szene.srgb(farbe)
    farbe_out = stoff
    if zonen_an and zonen_staerke > 0:
        haupt, mit = maske("Zone", -0.0012, 0.0012), maske("ZoneMit", -0.0012, 0.0012)
        nicht = nodes.new("ShaderNodeMath")
        nicht.operation = "SUBTRACT"
        nicht.inputs[0].default_value = 1.0
        links.new(haupt, nicht.inputs[1])
        farbe_out = mischen(mal(mal(mit, nicht.outputs[0]), mit_deckkraft * zonen_staerke), stoff, szene.srgb(LIME))
        farbe_out = mischen(mal(haupt, zonen_staerke), farbe_out, szene.srgb(LIME))
    alpha = maske("Saum", -0.0008, 0.0008)
    if details:
        bilder = _detail_bilder()
        for d in details:
            uv = nodes.new("ShaderNodeUVMap")
            uv.uv_map = "Logo" + d
            sichtbar = maske("Maske" + d, 0.45, 0.55)
            for art, bild in bilder[DETAILS[d]["bild"]].items():
                tex = nodes.new("ShaderNodeTexImage")
                tex.image = bild
                tex.extension = "CLIP"
                tex.interpolation = "Cubic"
                links.new(uv.outputs["UV"], tex.inputs["Vector"])
                wert = mal(tex.outputs["Alpha"], sichtbar)
                if art == "lime":
                    farbe_out = mischen(wert, farbe_out, szene.srgb(LIME))
                else:
                    weg = nodes.new("ShaderNodeMath")
                    weg.operation = "SUBTRACT"
                    weg.inputs[0].default_value = 1.0
                    links.new(wert, weg.inputs[1])
                    alpha = mal(alpha, weg.outputs[0])
    if logos:
        bild_f, bild_rand = _f_bilder()
        for logo_name, farb_name in logos:
            uv = nodes.new("ShaderNodeUVMap")
            uv.uv_map = "Logo" + logo_name
            sichtbar = maske("Maske" + logo_name, 0.45, 0.55)
            for bild, ziel in ((bild_rand, stoff), (bild_f, szene.srgb(LOGO_FARBEN[farb_name]))):
                tex = nodes.new("ShaderNodeTexImage")
                tex.image = bild
                tex.extension = "CLIP"
                links.new(uv.outputs["UV"], tex.inputs["Vector"])
                farbe_out = mischen(mal(tex.outputs["Alpha"], sichtbar), farbe_out, ziel)
    links.new(farbe_out, bsdf.inputs["Base Color"])
    links.new(alpha, bsdf.inputs["Alpha"])
    return mat


def anziehen(koerper: bpy.types.Object, skelett: bpy.types.Object, zonen_an: bool,
             logo_farben: dict[str, str] = KOLLEKTION, zonen_staerke: float = 1.0,
             brust_hoehe: float | None = None, tee: str = NACHT) -> list[bpy.types.Object]:
    """Shirt und Shorts an die Figur (nach `zonen.setze_zonen` und `figur.schulter_gewichte`).
    `logo_farben` je Logo „lime“ oder „hell“, `zonen_staerke` 1 (Lime) bis 0 (gedämpft bis aus),
    `brust_hoehe` ersetzt die Höhe des Brust-F aus `LOGOS`, `tee` die Farbe des Shirts. Setzt am Körper
    das Attribut „Bedeckt“ (Abstand innerhalb von Shirt oder Hose, m): Haut, die tiefer als 12 mm
    unter dem Stoff liegt, blendet das Material aus (`haut_ausblenden`)."""
    f = _felder(koerper, skelett)
    k, teile = f["k"], f["teil"]
    rahmen = {"shirt": {}, "hose": {}}
    for logo_name, logo in LOGOS.items():
        hoehe = brust_hoehe if logo_name == "brust" and brust_hoehe else logo["hoehe"]
        rahmen[logo["teil"]][logo_name.capitalize()] = _rahmen(koerper, k, teile, logo, hoehe / F_ANTEIL)
    for d_name, d in DETAILS.items():
        rahmen[d["teil"]][d_name] = _rahmen(koerper, k, teile, d, d["seite"])
    hose = _teil("Shorts", koerper, skelett, f["hose"], ABSTAND["hose"], rahmen["hose"])
    shirt = _teil("Shirt", koerper, skelett, f["shirt"], ABSTAND["shirt"], rahmen["shirt"])
    hose.data.materials.append(stoff_material("Shorts", GRAPHIT, zonen_an, [("Bein", logo_farben["bein"])],
                                              [d for d in DETAILS if DETAILS[d]["teil"] == "hose"], zonen_staerke))
    shirt.data.materials.append(stoff_material("Shirt", tee, zonen_an, [("Brust", logo_farben["brust"]),
                                                                        ("Ruecken", logo_farben["ruecken"])],
                                               [d for d in DETAILS if DETAILS[d]["teil"] == "shirt"], zonen_staerke))
    attr = koerper.data.attributes.get("Bedeckt") or koerper.data.attributes.new("Bedeckt", "FLOAT", "POINT")
    for i in range(len(koerper.data.vertices)):
        attr.data[i].value = max(f["shirt"][i], f["hose"][i])
    return [shirt, hose]


def haut_ausblenden(mat: bpy.types.Material) -> None:
    """Material des Körpers unter der Kleidung durchsichtig (Attribut „Bedeckt“ über 12 bis 16 mm)."""
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    bsdf = nodes["Principled BSDF"]
    attr = nodes.new("ShaderNodeAttribute")
    attr.attribute_name = "Bedeckt"
    attr.attribute_type = "GEOMETRY"
    rng = nodes.new("ShaderNodeMapRange")
    rng.clamp = True
    rng.inputs["From Min"].default_value = 0.012
    rng.inputs["From Max"].default_value = 0.016
    rng.inputs["To Min"].default_value = 1.0
    rng.inputs["To Max"].default_value = 0.0
    links.new(attr.outputs["Fac"], rng.inputs["Value"])
    links.new(rng.outputs["Result"], bsdf.inputs["Alpha"])
