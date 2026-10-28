"""FORM-Kleidung für die Figur (D-414, Feinschliff D-417, Korrekturrunde D-419, Korrekturen D-422).

Nach dem Text des Produktinhabers (`docs/prompts/uebungen-korrektur-logos-FORM.md`, Abschnitt 2):

- **STEP Running Tee** in Nacht #0C1219 mit Rundhals; kleines F vorn auf der linken Brust des Trägers,
  hinten das vertikale Logo (F über der Wortmarke FORM) zwischen den Schulterblättern, schmale
  Lime-Einfassung an den seitlichen Schlitzen am Saum.
- **STEP Shorts** in Graphit #4A4F57; Kordelenden in Lime vorn am Bund, F vorn-außen am linken Bein nahe dem Saum (D-441).

Links und rechts gelten aus Sicht des Trägers (links = +x in Blender). Die Teile entstehen aus dem Netz
der Figur, ohne fremde Dateien: Die Flächen des bedeckten Bereichs werden kopiert, nach außen versetzt
(eng anliegend wie Laufkleidung), geglättet und hängen mit denselben Gewichten am Skelett; so folgen
sie jeder Haltung ohne Stoffsimulation. Säume, Ärmel und Schlitze sind keine Netzkanten, sondern ein
Feld (Abstand zum Rand in Metern, wie bei den Muskelzonen): Der Stoff endet dort scharf.

**Rundhalskragen** (D-431): Die Halsöffnung ist der Schnitt des Körpers mit einer Fläche durch drei
Marken: vorn etwas unter der Drosselgrube (Höhe der inneren Schlüsselbeinenden), hinten knapp über dem
vorstehenden Halswirbel (Halsansatz `neck01`), seitlich am Halsansatz (Halsbreite, knapp unter dem
Halsknochen). Die Fläche ist die geneigte Ebene durch vorn und hinten, seitlich parabolisch zum
Halsansatz angehoben; nur so bleibt die Kante am Hals, denn bei diesem Körper liegen die Trapezmuskeln
seitlich fast auf Höhe des Halsansatzes und die reine Ebene schnitte über die Schultern. Stoff gibt es
nur unter der Fläche (`_halsoeffnung`, `_halsfeld`, Feld je Eckpunkt wie die Säume); der Schnitt ist
eine geschlossene, glatte Kurve wie der Halsausschnitt eines Schnittmusters. Damit die Kante bei gehobenem Trapez oder aufliegender Stange nicht mitgezogen
wird, hängt der Stoff in der Nähe der Öffnung am Halsansatz (Gewichte gleitend auf `spine01` und
`neck01` umgebunden, `_kragen_binden`), wie der steife Kragen eines echten Shirts; weiter unten
folgt er wieder Schultern und Armen. Auf der Kante liegt ein schmales Kragenbündchen als eigenes Netz
(`_buendchen`), aus den Schnittpunkten des Felds auf dem Stoff. Bis D-430 schnitten Kugel, Ellipse und
Ebenen im Shader an einem mitlaufenden Leerobjekt; das gab seitlich Spitzen und eine unruhige Kante.

**Logos** (Abschnitt 3): das FORM-F aus `public/brand/symbol-f-gruen.svg` und die Wortmarke aus
`public/brand/logo-kopfzeile-dunkel.svg`, gerastert (`quelle/form-f.png`, `quelle/form-vertikal.png`),
als Bild in Originalproportionen eben auf den Stoff projiziert (`_rahmen`): Mittelpunkt und
Blickrichtung je Logo aus der Körpergeometrie, die Bildebene senkrecht zur mittleren
Oberflächennormalen; so wird nichts in die Breite gezogen. Das Bild hängt an den Eckpunkten und bewegt
sich mit dem Stoff. Jedes Logo gilt nur für sein Körperteil (Rumpf bzw. ein Bein) und nur bis zu
einer Tiefe vor und hinter der Bildebene (D-422; vorher traf die Projektion des Shorts-F auch die
Innenseite des rechten Beins) und nur für Flächen, die zur Bildebene zeigen (kein Spiegelbild). Jedes
Logo hat einen schmalen Rand in Stoffarbe und liegt über den Muskelzonen (Abschnitt 4). Größen, Lagen
und Farben kommen aus einer Konfiguration (`LOGOS`, `KOLLEKTION`) für alle Übungen und Körper. Das
vertikale Logo folgt der Regel des Startbilds (`tools/splash.mjs`, D-325): F 2,28 Versalhöhen hoch,
Abstand 0,82 Versalhöhen, beide mittig (`VERTIKAL`); am Rücken als Backprint mit fester Breite der
Wortmarke, die Oberkante des F unter dem Kragen (D-432).
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
MARKE = Path(__file__).resolve().parent.parent.parent / "public" / "brand"
SVG_F = MARKE / "symbol-f-gruen.svg"
SVG_WORTMARKE = MARKE / "logo-kopfzeile-dunkel.svg"
QUELLE = Path(__file__).resolve().parent / "quelle"

# Lage der Säume (Körperkoordinaten wie bei den Zonen, `zonen.Koordinaten`)
SHIRT_SAUM = 0.02  # Anteil Hüftgelenk (0) bis Halsansatz (1): Saum knapp über den Hüftgelenken
AERMEL = 0.40  # Anteil Schulter (0) bis Ellbogen (1): kurzer Ärmel
HOSE_BUND = 0.22  # Bund knapp unter dem Nabel
HOSE_BEIN = 0.40  # Anteil Hüfte (0) bis Knie (1): Laufshorts
# Rundhalskragen (D-431): vorn unter der Drosselgrube, hinten über dem Halswirbel, seitlich Halsbreite plus Rand
KRAGEN = {"unter_drosselgrube": 0.015, "ueber_halswirbel": 0.012,
          "seitlich_unter_hals": 0.015, "seitlich_rand": 0.006,  # seitliche Kante unter `neck01`, außerhalb der Halshaut, m
          "bindung": 0.06,  # bis zu diesem Abstand von der Öffnung hängt der Stoff gleitend am Halsansatz, m
          "buendchen": 0.014, "buendchen_dicke": 0.0032}  # Breite und Dicke des Kragenbündchens, m
KRAGEN_KNOCHEN = {"spine01": 0.6, "neck01": 0.4}  # woran der Kragen hängt
ABSTAND = {"shirt": 0.0065, "hose": 0.0048}  # Stoff über der Haut, m
DICKE = 0.0012  # Stoffdicke, m
STOFF = ABSTAND["shirt"] + DICKE  # Oberfläche des Tees über der Haut: Die Stange liegt darauf (D-422)
# Lime-Details als Bilder auf dem Stoff (wie die Logos, `_detail_bilder`): Seitenschlitze am Saum des
# Tees mit Einfassung (der Schlitz schneidet den Stoff), Kordelenden vorn am Bund der Shorts. Maße in m.
# `teile`: Körperteile, auf denen das Bild gilt; `x`: nur links (1) oder rechts (-1); `tiefe`: Reichweite
# der Projektion vor und hinter der Bildebene, m.
SCHLITZ = {"hoehe": 0.05, "breite": 0.006, "einfassung": 0.0035}
KORDEL = {"abstand": 0.012, "laenge": 0.06, "breite": 0.003, "ende": 0.008, "ende_breite": 0.0045}
DETAILS = {
    "schlitz_l": {"teil": "shirt", "bild": "schlitz", "seite": 0.08, "winkel": 90.0, "lage": SHIRT_SAUM, "hoch": 0.025,
                  "teile": ("rumpf", "bein"), "x": 1, "tiefe": 0.05},
    "schlitz_r": {"teil": "shirt", "bild": "schlitz", "seite": 0.08, "winkel": -90.0, "lage": SHIRT_SAUM, "hoch": 0.025,
                  "teile": ("rumpf", "bein"), "x": -1, "tiefe": 0.05},
    "kordel": {"teil": "hose", "bild": "kordel", "seite": 0.08, "winkel": 0.0, "lage": HOSE_BUND, "hoch": -0.034,
               "teile": ("rumpf",), "tiefe": 0.06},
}
# Logos: Höhe des F in Metern; Lage am Rumpf quer zur Mitte (m, links positiv) und unter der
# Schulternaht (Schultergelenk), Blickrichtung der Bildebene; am linken Oberschenkel Winkel um den
# Knochen (0 vorn, 90 außen) und Anteil Hüfte→Knie. `motiv`: „f“ (nur das F) oder „vertikal“ (F über
# der Wortmarke FORM, Rücken); `teile`, `x`, `tiefe` wie bei den Details.
LOGOS = {
    "brust": {"teil": "shirt", "motiv": "f", "hoehe": 0.040, "quer": 0.07, "unter_schulter": 0.085,
              "blick": (0.0, -1.0, 0.0), "teile": ("rumpf",), "tiefe": 0.08},
    # Rücken (D-432): Backprint mit fester Breite der Wortmarke (`wortmarke`, m), die Höhe des F folgt
    # aus der Proportion des vertikalen Logos; die Oberkante des F `unter_kragen` unter der hinteren
    # Kante der Halsöffnung, waagrecht mittig
    "ruecken": {"teil": "shirt", "motiv": "vertikal", "wortmarke": 0.15, "unter_kragen": 0.07, "quer": 0.0,
                "blick": (0.0, 1.0, 0.0), "teile": ("rumpf",), "tiefe": 0.10},
    # Das eine F auf den Shorts (D-441): vorn-außen nahe dem Saum auf dem Bein, das beim Bankdrücken zur
    # Kamera zeigt. Das ist das linke Bein (Kamera 45° zur linken Seite, D-410); die Markierung des
    # Produktinhabers trifft, von der Kamera der App aus auf den Stoff gezielt, das linke Bein bei 17°
    # von vorn nach außen und 0,32 Hüfte→Knie (Saum bei 0,40; D-436). Das frühere F außen am linken
    # Bein (80°, 0,30; D-419 bis D-440) entfällt, damit nie zwei F nebeneinander zu sehen sind; seine
    # Farbe in den Fassungen heißt weiter `bein`.
    "beinvorn": {"teil": "hose", "motiv": "f", "hoehe": 0.035, "winkel": 17.0, "lage": 0.32,
                 "teile": ("bein",), "x": 1, "tiefe": 0.05, "farbe": "bein"},
}
F_ANTEIL = 0.861  # Höhe des F im quadratischen Bild „f“ (`_bilder`)
RAND_PX = 32  # Rand in Stoffarbe um das F, px im 1024-px-Bild (rund 3,6 % der F-Höhe)
# Vertikales Logo (Rücken, D-422) nach der Regel des Startbilds (`tools/splash.mjs`, Variante C3): in
# Versalhöhen der Wortmarke die Höhe des F, der Abstand zwischen F und Wortmarke und die Seitenlänge des
# quadratischen Bilds; der Block (F oben, Wortmarke darunter, beide waagrecht mittig) steht in der Mitte.
VERTIKAL = {"f": 2.28, "abstand": 0.82, "seite": 6.0}
WORTMARKE_BREITE = 5.396  # Breite der Wortmarke FORM in Versalhöhen (`logo-kopfzeile-dunkel.svg`)


# ---------------------------------------------------------------------- Halsöffnung


def _halsoeffnung(koerper: bpy.types.Object, k: zonen.Koordinaten) -> dict:
    """Fläche der Halsöffnung (D-431): die Ebene durch den Punkt vorn auf der Haut unter der
    Drosselgrube (Höhe der inneren Schlüsselbeinenden minus `unter_drosselgrube`) und den Punkt
    hinten auf der Haut über dem Halsansatz (`neck01` plus `ueber_halswirbel`), quer waagrecht;
    seitlich parabolisch angehoben (`c`), so dass die Kante bei der halben Halsbreite `b` (plus
    `seitlich_rand`) `seitlich_unter_hals` unter dem Halsknochen liegt. Rückgabe: Mitte C,
    Längsrichtung e (vorn → hinten), Normale m (nach oben), halbe Länge a, Halbbreite b, Wölbung c,
    vordere und hintere Kante (`vorn`, `hinten`; letztere für das Rückenlogo)."""
    verts = koerper.data.vertices
    N = k.kopf["neck01"]
    z_vorn = k.kopf["clavicle.L"].z - KRAGEN["unter_drosselgrube"]
    z_hinten = N.z + KRAGEN["ueber_halswirbel"]

    def haut(z: float, vorn: bool) -> Vector:
        p = [v.co for v in verts if abs(v.co.x) < 0.015 and abs(v.co.z - z) < 0.008]
        y = min(q.y for q in p) if vorn else max(q.y for q in p)
        return Vector((0.0, y, z))

    F, B = haut(z_vorn, True), haut(z_hinten, False)
    hals = [abs(v.co.x) for v in verts if k.w(v.index, "neck01", "neck02", "neck03") > 0.5 and 0.0 < v.co.z - N.z < 0.01]
    b = max(hals) + KRAGEN["seitlich_rand"]
    C = (F + B) / 2
    e = (B - F).normalized()
    m = Vector((1.0, 0.0, 0.0)).cross(e).normalized()
    if m.z < 0:
        m = -m
    # seitliche Kante: Höhe über der Ebene (längs m) bei x = b, als Parabel c · x²
    z_seite = N.z - KRAGEN["seitlich_unter_hals"]
    w_seite = (Vector((b, C.y, z_seite)) - C).dot(m)
    c = max(0.0, w_seite / (b * b))
    return {"C": C, "e": e, "m": m, "a": (B - F).length / 2, "b": b, "c": c, "vorn": F, "hinten": B}


def _halsfeld(h: dict, p: Vector) -> float:
    """Abstand zur Fläche der Halsöffnung (m, positiv = Stoff, unter der Fläche): Höhe über der Ebene
    längs m, verglichen mit der seitlichen Wölbung c · x². Unterhalb der vorderen Kante gibt es immer
    Stoff: Die Ebene schnitte sonst entlang der Brustbeinrinne in die vorgewölbte Brust und machte
    aus dem runden Ausschnitt vorn eine Spitze."""
    d = p - h["C"]
    return max(h["c"] * d.x * d.x - d.dot(h["m"]), h["vorn"].z - p.z)


# ---------------------------------------------------------------------- Felder je Eckpunkt


def _felder(koerper: bpy.types.Object, skelett: bpy.types.Object) -> dict:
    """Je Eckpunkt: Abstand zum Rand von Shirt (Saum und Ärmel, ohne den Halsausschnitt) und Hose
    (m, positiv = bedeckt) und das Körperteil mit dem größten Gewicht; dazu die Maße des Rundhalses
    (`hals`) für das Leerobjekt und den Shader."""
    k = zonen.Koordinaten(koerper, skelett)
    L = (k.N - k.O).length
    oeffnung = _halsoeffnung(koerper, k)
    felder: dict = {n: [] for n in ("shirt", "hose", "teil", "hals")}
    # Rumpf mit dem ganzen Hals: Die Halsöffnung schneidet ihn als Feld (`_halsfeld`)
    rumpfknochen = ("root", "spine01", "spine02", "spine03", "spine04", "spine05", "neck01", "neck02", "neck03",
                    "pelvis.L", "pelvis.R", "clavicle.L", "clavicle.R", "breast.L", "breast.R", "shoulder01.L",
                    "shoulder01.R")
    for v in koerper.data.vertices:
        i, p = v.index, v.co
        seite = "L" if p.x >= 0 else "R"
        # Körperteil mit dem größten Gewicht: Oberarm, Rumpf (mit Hals), Oberschenkel oder Rest
        # (Unterarm, Hand, Kopf, Gesicht, Unterschenkel, Fuß; nie bedeckt)
        arm = k.w(i, f"upperarm01.{seite}", f"upperarm02.{seite}", f"achsel.{seite}")
        bein = k.w(i, f"upperleg01.{seite}", f"upperleg02.{seite}")
        rumpf = k.w(i, *rumpfknochen)
        rest = max(0.0, 1.0 - arm - bein - rumpf)
        teil = max((arm, "arm"), (bein, "bein"), (rumpf, "rumpf"), (rest, "rest"))[1]
        _, s, _ = k.rumpf(p)
        shirt = hose = -1.0
        if teil == "arm":
            _, t, La, _ = k.glied(p, f"upperarm01.{seite}", f"lowerarm01.{seite}", Vector((0, -1, 0)), seite)
            shirt = (AERMEL - t) * La
        elif teil == "rumpf":
            shirt = min((s - SHIRT_SAUM) * L, _halsfeld(oeffnung, p))
            hose = (HOSE_BUND - s) * L
        elif teil == "bein":
            _, t, Lb, _ = k.glied(p, f"upperleg01.{seite}", f"lowerleg01.{seite}", Vector((0, -1, 0)), seite)
            hose = (HOSE_BEIN - t) * Lb
            shirt = (s - SHIRT_SAUM) * L
        felder["shirt"].append(shirt)
        felder["hose"].append(hose)
        felder["teil"].append(teil)
        felder["hals"].append(_halsfeld(oeffnung, p) if teil == "rumpf" else 1.0)
    felder["k"] = k
    felder["oeffnung"] = oeffnung
    return felder


def _rahmen(koerper: bpy.types.Object, k: zonen.Koordinaten, teile: list[str], lage: dict, seite: float) -> dict:
    """Bildebene eines Logos oder Details: Mittelpunkt auf der Haut (Ruhehaltung), Normale als Mittel
    der Umgebung (3 cm), Hochachse längs des Körperteils, Querachse so, dass das Bild von außen
    richtig herum liegt. Lage am Rumpf über `quer`/`unter_schulter`/`blick` (Logos) oder über
    `winkel`/`lage` (Winkel um die Rumpfachse, 0 vorn, links positiv; Anteil Hüfte→Hals), am linken
    Oberschenkel bei `teil` „hose“ mit `winkel`/`lage` um den Knochen; `hoch` verschiebt den
    Mittelpunkt längs (m). `erlaubt`: Eckpunkte des Körperteils (`teile`, Seite `x`), auf denen das
    Bild liegen darf; `tiefe`: Reichweite vor und hinter der Bildebene (D-422)."""
    verts = koerper.data.vertices
    if lage["teil"] == "hose" and "winkel" in lage and "lage" in lage and lage.get("bild") is None:
        s = "L" if lage.get("x", 1) > 0 else "R"  # Oberschenkel der Seite `x` (links positiv)
        kandidaten = []
        for i, t in enumerate(teile):
            if t == "bein" and verts[i].co.x * lage.get("x", 1) > 0:
                th, tt, _, _ = k.glied(verts[i].co, f"upperleg01.{s}", f"lowerleg01.{s}", Vector((0, -1, 0)), s)
                kandidaten.append((abs(th - lage["winkel"]) / 60 + abs(tt - lage["lage"]), i))
        achse = (k.kopf[f"upperleg01.{s}"] - k.kopf[f"lowerleg01.{s}"]).normalized()
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
    x = lage.get("x")
    erlaubt = {i for i, t in enumerate(teile)
               if t in lage.get("teile", (t,)) and (x is None or verts[i].co.x * x > 0)}
    return {"P0": P0 + hoch * lage.get("hoch", 0.0), "n": n0, "hoch": hoch, "quer": quer, "seite": seite,
            "erlaubt": erlaubt, "tiefe": lage.get("tiefe", 1.0)}


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
          abstand: float, rahmen: dict[str, dict], rand: float = 0.03,
          kragen: list[float] | None = None) -> bpy.types.Object:
    """Kleidungsstück: Flächen, deren Eckpunkte höchstens `rand` außerhalb des Saums liegen, kopiert,
    versetzt und geglättet; mit denselben Gewichten am Skelett. Je Logo und Detail eine UV-Schicht
    (ebene Projektion auf die Bildebene) und eine Maske: nur Flächen des erlaubten Körperteils in
    Reichweite der Bildebene, die zu ihr zeigen. Mit `kragen` (Abstand zur Halsöffnung je Eckpunkt)
    hängt der Stoff nahe der Öffnung am Halsansatz (`_kragen_binden`, D-431)."""
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
    if kragen is not None:
        _kragen_binden(obj, [kragen[i] for i in alt])
    for attr_name in ("Zone", "ZoneMit"):
        if attr_name not in mesh.attributes:
            ziel = mesh.attributes.new(attr_name, "FLOAT", "POINT")
            for i in range(len(alt)):
                ziel.data[i].value = -1.0
    saum = mesh.attributes.new("Saum", "FLOAT", "POINT")
    for neu_i, alt_i in enumerate(alt):
        saum.data[neu_i].value = feld[alt_i]
    if kragen is not None:
        hals = mesh.attributes.new("Hals", "FLOAT", "POINT")  # Abstand zur Halsöffnung, für das Bündchen
        for neu_i, alt_i in enumerate(alt):
            hals.data[neu_i].value = kragen[alt_i]
    for logo_name, r in rahmen.items():
        schicht = mesh.uv_layers.new(name="Logo" + logo_name)
        maske = mesh.attributes.new("Maske" + logo_name, "FLOAT", "POINT")
        uv = []
        for neu_i, alt_i in enumerate(alt):
            v = quelle.vertices[alt_i]
            d = v.co - r["P0"]
            uv.append((d.dot(r["quer"]) / r["seite"] + 0.5, d.dot(r["hoch"]) / r["seite"] + 0.5))
            if alt_i in r["erlaubt"] and abs(d.dot(r["n"])) <= r["tiefe"]:
                maske.data[neu_i].value = max(0.0, min(1.0, (v.normal.dot(r["n"]) - 0.15) / 0.25))
            else:
                maske.data[neu_i].value = 0.0
        for loop in mesh.loops:
            schicht.data[loop.index].uv = uv[loop.vertex_index]
    for poly in mesh.polygons:
        poly.use_smooth = True
    obj.parent = koerper.parent
    mod = obj.modifiers.new("Skelett", "ARMATURE")
    mod.object = skelett
    dicke = obj.modifiers.new("Dicke", "SOLIDIFY")
    dicke.thickness = DICKE
    dicke.offset = -1.0
    sub = obj.modifiers.new("Glatt", "SUBSURF")
    sub.levels = 1
    sub.render_levels = 2
    return obj


def _kragen_binden(obj: bpy.types.Object, abstand: list[float]) -> None:
    """Gewichte des Stoffs nahe der Halsöffnung gleitend auf die Knochen des Halsansatzes umbinden
    (`KRAGEN_KNOCHEN`): an der Kante ganz, bis `KRAGEN["bindung"]` auslaufend. So bleibt der Kragen
    ein Ring am Halsansatz, auch wenn Schultern und Trapez den Stoff heben (D-431)."""
    gruppen = {g.name: g for g in obj.vertex_groups}
    for v, d in zip(obj.data.vertices, abstand):
        if d >= KRAGEN["bindung"]:
            continue
        x = max(0.0, min(1.0, 1.0 - d / KRAGEN["bindung"]))
        t = x * x * (3 - 2 * x)
        alt = {g.group: g.weight for g in v.groups}
        for idx, w in alt.items():
            obj.vertex_groups[idx].add([v.index], w * (1 - t), "REPLACE")
        for name, anteil in KRAGEN_KNOCHEN.items():
            vorher = alt.get(gruppen[name].index, 0.0) * (1 - t)
            gruppen[name].add([v.index], vorher + t * anteil, "REPLACE")


def _buendchen(shirt: bpy.types.Object, koerper: bpy.types.Object, skelett: bpy.types.Object,
               oeffnung: dict, material: bpy.types.Material) -> bpy.types.Object:
    """Kragenbündchen (D-431): ein schmales Band auf der Kante der Halsöffnung, aus den Punkten, in
    denen das Feld `Hals` des Shirts (Abstand zur Öffnung je Eckpunkt) die Null kreuzt, nach dem Winkel
    um die Öffnung geordnet, geglättet und auf 72 Stützen verteilt; jede Stütze liegt mindestens 2,5 mm
    über dem Stoff. Innenkante knapp in der Öffnung, Außenkante `KRAGEN["buendchen"]` nach außen auf dem
    Stoff; Dicke über Solidify. Gewichte vom nächsten Eckpunkt des Shirts (schon umgebunden)."""
    mesh = shirt.data
    hals = mesh.attributes["Hals"].data
    C, e, m = oeffnung["C"], oeffnung["e"], oeffnung["m"]
    punkte = []
    for ed in mesh.edges:
        i, j = ed.vertices
        a, b = hals[i].value, hals[j].value
        if (a < 0) == (b < 0) or abs(a - b) < 1e-9:
            continue
        t = a / (a - b)
        p = mesh.vertices[i].co.lerp(mesh.vertices[j].co, t)
        d = p - C
        if d.length > 0.2:
            continue
        n = mesh.vertices[i].normal.lerp(mesh.vertices[j].normal, t).normalized()
        punkte.append((math.atan2(d.x, -d.dot(e)), p, n))
    if len(punkte) < 12:
        raise ValueError("Kragen: zu wenige Schnittpunkte der Halsöffnung")
    punkte.sort(key=lambda x: x[0])
    N = 72
    stuetzen = []
    for s_i in range(N):
        w = -math.pi + 2 * math.pi * (s_i + 0.5) / N
        # Mittel der Schnittpunkte im Winkelfenster ±2,5 Schritte (Glättung, Lücken überbrückt)
        nahe = [(p, n) for a, p, n in punkte if abs(((a - w + math.pi) % (2 * math.pi)) - math.pi) < 2.5 * 2 * math.pi / N]
        if not nahe:
            nahe = [min(punkte, key=lambda x: abs(((x[0] - w + math.pi) % (2 * math.pi)) - math.pi))[1:]]
        p = sum((q for q, _ in nahe), Vector()) / len(nahe)
        n = sum((q for _, q in nahe), Vector()).normalized()
        stuetzen.append((p, n))
    # dreimal glätten (Nachbarn mitteln), damit die Kante ruhig läuft
    for _ in range(3):
        stuetzen = [((stuetzen[i - 1][0] + 2 * stuetzen[i][0] + stuetzen[(i + 1) % N][0]) / 4,
                     (stuetzen[i - 1][1] + 2 * stuetzen[i][1] + stuetzen[(i + 1) % N][1]).normalized()) for i in range(N)]
    # jede Stütze mindestens 2,5 mm über der Tangentialebene des nächsten Stoffpunkts (die Glättung
    # zieht Stützen an gewölbten Stellen unter den Stoff)
    sv = mesh.vertices
    angehoben = []
    for p, n in stuetzen:
        naechster = min(sv, key=lambda v: (v.co - p).length_squared)
        hoehe = (p - naechster.co).dot(naechster.normal)
        if hoehe < 0.0025:
            p = p + naechster.normal * (0.0025 - hoehe)
        angehoben.append((p, n))
    stuetzen = angehoben
    ecken = []
    for i, (p, n) in enumerate(stuetzen):
        tang = (stuetzen[(i + 1) % N][0] - stuetzen[i - 1][0]).normalized()
        aussen = n.cross(tang).normalized()
        # nach außen heißt von der Öffnung weg: in der Ebene der Öffnung radial nach außen und unter
        # die Ebene (auf die Schulter, die Brust, den Rücken), nicht den Hals hinauf
        radial = (p - C) - m * (p - C).dot(m)
        if aussen.dot(radial.normalized()) - aussen.dot(m) < 0:
            aussen = -aussen
        # Innenkante 3 mm in der Öffnung, damit das Bündchen die Schnittkante des Stoffs verdeckt
        ecken.append(p - aussen * 0.003)
        ecken.append(p + aussen * KRAGEN["buendchen"])
    flaechen = [[2 * i, 2 * i + 1, 2 * ((i + 1) % N) + 1, 2 * ((i + 1) % N)] for i in range(N)]
    bm_mesh = bpy.data.meshes.new("Kragen")
    bm_mesh.from_pydata([tuple(q) for q in ecken], [], flaechen)
    bm_mesh.update()
    for poly in bm_mesh.polygons:
        poly.use_smooth = True
    obj = bpy.data.objects.new("Kragen", bm_mesh)
    bpy.context.scene.collection.objects.link(obj)
    obj.parent = shirt.parent
    # Gewichte: vom nächsten Eckpunkt des Shirts
    kd = {g.index: g.name for g in shirt.vertex_groups}
    namen = {}
    for g in koerper.vertex_groups:
        namen[g.name] = obj.vertex_groups.new(name=g.name)
    for i, q in enumerate(ecken):
        naechster = min(sv, key=lambda v: (v.co - q).length_squared)
        for g in naechster.groups:
            namen[kd[g.group]].add([i], g.weight, "REPLACE")
    mod = obj.modifiers.new("Skelett", "ARMATURE")
    mod.object = skelett
    dicke = obj.modifiers.new("Dicke", "SOLIDIFY")
    dicke.thickness = KRAGEN["buendchen_dicke"]
    dicke.offset = 1.0
    sub = obj.modifiers.new("Glatt", "SUBSURF")
    sub.levels = 1
    sub.render_levels = 2
    obj.data.materials.append(material)
    return obj


# ---------------------------------------------------------------------- Logos als Bild


def _pfad_polygone(d: str) -> list[list[tuple[float, float]]]:
    """SVG-Pfad (absolute M, L, C, Z) als Polygone, eines je Teilpfad (ein Buchstabe mit Loch hat zwei);
    Kurven in 24 Stücke."""
    tokens = re.findall(r"[MLCZ]|-?\d*\.?\d+(?:e-?\d+)?", d)
    polys: list[list[tuple[float, float]]] = []
    pts: list[tuple[float, float]] = []
    i, cur, cmd = 0, (0.0, 0.0), ""
    while i < len(tokens):
        if tokens[i] in "MLCZ":
            cmd = tokens[i]
            i += 1
            if cmd == "Z":
                continue
            if cmd == "M" and pts:
                polys.append(pts)
                pts = []
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
    if pts:
        polys.append(pts)
    return polys


def _svg_polygone(pfad: Path, gruppe: str | None = None) -> list[list[tuple[float, float]]]:
    """Alle Pfade einer SVG-Datei (oder nur der Gruppe `gruppe`) als Polygone in SVG-Koordinaten."""
    text = pfad.read_text(encoding="utf-8")
    if gruppe:
        m = re.search(rf'<g id="{gruppe}"[^>]*>(.*?)</g>', text, re.S)
        if not m:
            raise ValueError(f"{pfad.name}: Gruppe {gruppe} fehlt")
        text = m.group(1)
    return [poly for d in re.findall(r'<path[^>]*\sd="([^"]+)"', text) for poly in _pfad_polygone(d)]


def _bbox(polys) -> tuple[float, float, float, float]:
    xs = [x for p in polys for x, _ in p]
    ys = [y for p in polys for _, y in p]
    return min(xs), max(xs), min(ys), max(ys)


def _rastern(polys: list[list[tuple[float, float]]], N: int, U: int = 4):
    """Deckkraft (N × N, Zeile 0 unten) der Polygone in Bildkoordinaten 0 bis 1 (y nach oben),
    gerade-ungerade gefüllt (Löcher bleiben frei), U-fach überabgetastet."""
    import numpy as np

    S = N * U
    zaehl = np.zeros((S, S + 1), dtype=np.int32)
    yc = (np.arange(S) + 0.5) / S
    for poly in polys:
        for (x1, y1), (x2, y2) in zip(poly, poly[1:] + poly[:1]):
            if y1 == y2:
                continue
            zeilen = np.nonzero((y1 > yc) != (y2 > yc))[0]
            if zeilen.size == 0:
                continue
            kreuz = (x1 + (yc[zeilen] - y1) * (x2 - x1) / (y2 - y1)) * S
            spalten = np.clip(np.ceil(kreuz - 0.5).astype(int), 0, S)
            np.add.at(zaehl, (zeilen, spalten), 1)
    innen = (np.cumsum(zaehl, axis=1)[:, :S] % 2).astype(np.float32)
    return innen.reshape(N, U, N, U).mean(axis=(1, 3))


def _einpassen(polys, mitte_x: float, mitte_y: float, hoehe: float, einheit: float):
    """Polygone aus SVG-Koordinaten (y nach unten) in Bildkoordinaten 0..1 (y nach oben): das Motiv
    `hoehe` Bildseiten hoch, seine Mitte bei (`mitte_x`, `mitte_y`); `einheit` ist die Höhe des
    Motivs in SVG-Einheiten."""
    x0, x1, y0, y1 = _bbox(polys)
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    f = hoehe / einheit
    return [[(mitte_x + (x - cx) * f, mitte_y - (y - cy) * f) for x, y in poly] for poly in polys]


def _speichern(bild: bpy.types.Image, pfad: Path) -> None:
    QUELLE.mkdir(parents=True, exist_ok=True)
    bild.alpha_mode = "STRAIGHT"
    bild.filepath_raw = str(pfad)
    bild.file_format = "PNG"
    bild.save()


def _bild_aus_alpha(name: str, alpha) -> bpy.types.Image:
    import numpy as np

    N = alpha.shape[0]
    bild = bpy.data.images.new(name, N, N, alpha=True)
    px = np.ones((N, N, 4), dtype=np.float32)
    px[..., 3] = alpha
    bild.pixels.foreach_set(px.ravel())
    return bild


def _rand_alpha(alpha, px: int):
    """Das Motiv um `px` Pixel in alle Richtungen verbreitert, Kanten geglättet: der Rand in Stoffarbe."""
    import numpy as np

    form = alpha > 0.5
    for _ in range(px):
        erweitert = form.copy()
        erweitert[1:] |= form[:-1]
        erweitert[:-1] |= form[1:]
        erweitert[:, 1:] |= form[:, :-1]
        erweitert[:, :-1] |= form[:, 1:]
        form = erweitert
    weich = form.astype(np.float32)
    for _ in range(2):
        weich = (weich + np.roll(weich, 1, 0) + np.roll(weich, -1, 0) + np.roll(weich, 1, 1) + np.roll(weich, -1, 1)) / 5
    return weich


def _bilder(motiv: str) -> tuple[bpy.types.Image, bpy.types.Image]:
    """Motiv als quadratisches Bild mit Deckkraft (weiß auf durchsichtig) und sein Rand, gespeichert in
    `quelle/form-<motiv>.png` und `quelle/form-<motiv>-rand.png`:

    - „f“: das FORM-F aus `symbol-f-gruen.svg`, 1024 px, `F_ANTEIL` der Höhe, in der Mitte;
    - „vertikal“: F über der Wortmarke FORM (`logo-kopfzeile-dunkel.svg`, Gruppe `wortmarke`) nach
      `VERTIKAL`, 2048 px: Seitenlänge `seite` Versalhöhen, Block vertikal mittig, F oben.

    Der Rand ist bei beiden rund 3,6 % der F-Höhe breit."""
    import numpy as np

    pfad_bild, pfad_rand = QUELLE / f"form-{motiv}.png", QUELLE / f"form-{motiv}-rand.png"
    if pfad_bild.exists():
        bild = bpy.data.images.load(str(pfad_bild), check_existing=True)
    else:
        f_polys = _svg_polygone(SVG_F)
        if motiv == "f":
            N = 1024
            f_hoehe = F_ANTEIL
            polys = _einpassen(f_polys, 0.5, 0.5, f_hoehe, _bbox(f_polys)[3] - _bbox(f_polys)[2])
        elif motiv == "vertikal":
            N = 2048
            v = VERTIKAL
            f_hoehe = v["f"] / v["seite"]
            # Versalhöhe der Wortmarke = 1 Einheit; der Block ist f + abstand + 1 hoch, seine Mitte in
            # der Bildmitte: Mitte des F um (abstand + 1) / 2 darüber, Mitte der Wortmarke um (f + abstand) / 2 darunter
            w_polys = _svg_polygone(SVG_WORTMARKE, "wortmarke")
            wx0, wx1, wy0, wy1 = _bbox(w_polys)
            polys = (_einpassen(f_polys, 0.5, 0.5 + (v["abstand"] + 1.0) / 2 / v["seite"], f_hoehe,
                                _bbox(f_polys)[3] - _bbox(f_polys)[2])
                     + _einpassen(w_polys, 0.5, 0.5 - (v["f"] + v["abstand"]) / 2 / v["seite"], 1.0 / v["seite"],
                                  wy1 - wy0))
        else:
            raise ValueError(f"Motiv {motiv} unbekannt")
        bild = _bild_aus_alpha("FORM-" + motiv, _rastern(polys, N))
        _speichern(bild, pfad_bild)
    if pfad_rand.exists():
        rand = bpy.data.images.load(str(pfad_rand), check_existing=True)
    else:
        N = bild.size[0]
        f_px = N * (F_ANTEIL if motiv == "f" else VERTIKAL["f"] / VERTIKAL["seite"])
        px = np.empty(N * N * 4, dtype=np.float32)
        bild.pixels.foreach_get(px)
        rand = _bild_aus_alpha("FORM-" + motiv + "-Rand", _rand_alpha(px.reshape(N, N, 4)[..., 3], round(RAND_PX / (F_ANTEIL * 1024) * f_px)))
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
        b = _bild_aus_alpha("Detail-" + name, maske)
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


# ---------------------------------------------------------------------- Hilfen für den Shader


def _rechne(nodes, links, op: str, a, b=None):
    """Rechenknoten; `a` und `b` sind Sockets oder Zahlen."""
    m = nodes.new("ShaderNodeMath")
    m.operation = op
    for eingang, wert in ((0, a), (1, b)):
        if wert is None:
            continue
        if isinstance(wert, (int, float)):
            m.inputs[eingang].default_value = float(wert)
        else:
            links.new(wert, m.inputs[eingang])
    return m.outputs[0]


def _stufe(nodes, links, wert, von: float, bis: float, nach: tuple[float, float] = (0.0, 1.0)):
    """Weicher Übergang (Smoothstep) von `von` nach `bis` auf `nach`, geklemmt."""
    rng = nodes.new("ShaderNodeMapRange")
    rng.interpolation_type = "SMOOTHSTEP"
    rng.clamp = True
    rng.inputs["From Min"].default_value = von
    rng.inputs["From Max"].default_value = bis
    rng.inputs["To Min"].default_value = nach[0]
    rng.inputs["To Max"].default_value = nach[1]
    links.new(wert, rng.inputs["Value"])
    return rng.outputs["Result"]


# ---------------------------------------------------------------------- Material


def stoff_material(name: str, farbe: str, zonen_an: bool, logos: list[tuple[str, str, str]], details: list[str],
                   zonen_staerke: float = 1.0, mit_deckkraft: float = 0.5, mit_saum: bool = True) -> bpy.types.Material:
    """Stoff matt mit leichtem Glanz (Sheen); endet scharf am Saum (Attribut „Saum“, auch die
    Halsöffnung); auf Wunsch Muskelzonen in Lime auf dem Stoff (`zonen_staerke` dämpft sie); darüber
    die Lime-Details (`details`, Schlüssel aus `DETAILS`: Bild, Schnitt) und die Logos (je (Name, Farbe,
    Motiv): UV-Schicht `Logo<Name>`, Maske `Maske<Name>`) wie ein Aufdruck mit schmalem Rand in
    Stoffarbe. Ohne `mit_saum` (Kragenbündchen) ist der Stoff überall deckend."""
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
        return _stufe(nodes, links, attr.outputs["Fac"], von, bis)

    def mal(a, b):
        return _rechne(nodes, links, "MULTIPLY", a, b)

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
        nicht = _rechne(nodes, links, "SUBTRACT", 1.0, haupt)
        farbe_out = mischen(mal(mal(mit, nicht), mit_deckkraft * zonen_staerke), stoff, szene.srgb(LIME))
        farbe_out = mischen(mal(haupt, zonen_staerke), farbe_out, szene.srgb(LIME))
    alpha = maske("Saum", -0.0008, 0.0008) if mit_saum else None
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
                elif alpha is not None:
                    alpha = mal(alpha, _rechne(nodes, links, "SUBTRACT", 1.0, wert))
    for logo_name, farb_name, motiv in logos:
        bild_f, bild_rand = _bilder(motiv)
        uv = nodes.new("ShaderNodeUVMap")
        uv.uv_map = "Logo" + logo_name
        sichtbar = maske("Maske" + logo_name, 0.45, 0.55)
        for bild, ziel in ((bild_rand, stoff), (bild_f, szene.srgb(LOGO_FARBEN[farb_name]))):
            tex = nodes.new("ShaderNodeTexImage")
            tex.image = bild
            tex.extension = "CLIP"
            links.new(uv.outputs["UV"], tex.inputs["Vector"])
            farbe_out = mischen(mal(tex.outputs["Alpha"], sichtbar), farbe_out, ziel)
    if isinstance(farbe_out, tuple):  # nur Stofffarbe (Kragenbündchen ohne Zonen, Details und Logos)
        bsdf.inputs["Base Color"].default_value = farbe_out
    else:
        links.new(farbe_out, bsdf.inputs["Base Color"])
    if alpha is not None:
        links.new(alpha, bsdf.inputs["Alpha"])
    return mat


def anziehen(koerper: bpy.types.Object, skelett: bpy.types.Object, zonen_an: bool,
             logo_farben: dict[str, str] = KOLLEKTION, zonen_staerke: float = 1.0,
             brust_hoehe: float | None = None, tee: str = NACHT) -> list[bpy.types.Object]:
    """Shirt mit Kragenbündchen und Shorts an die Figur (nach `zonen.setze_zonen` und
    `figur.schulter_gewichte`). `logo_farben` je Logo „lime“ oder „hell“, `zonen_staerke` 1 (Lime) bis 0
    (gedämpft bis aus), `brust_hoehe` ersetzt die Höhe des Brust-F aus `LOGOS`, `tee` die Farbe des
    Shirts. Setzt am Körper das Attribut „Bedeckt“ (Abstand innerhalb von Shirt oder Hose, m): Haut, die
    tiefer als 12 mm unter dem Stoff liegt, blendet das Material aus (`haut_ausblenden`)."""
    f = _felder(koerper, skelett)
    k, teile = f["k"], f["teil"]
    rahmen = {"shirt": {}, "hose": {}}
    motive = {}
    masse = {}
    for logo_name, logo in LOGOS.items():
        lage = dict(logo)
        if logo.get("motiv") == "vertikal":
            # Backprint (D-432): F aus der festen Breite der Wortmarke; Bildseite so, dass das F `hoehe`
            # hoch ist. Die Oberkante des F liegt `unter_kragen` unter der hinteren Kante der Halsöffnung;
            # daraus die Lage des F-Mittelpunkts unter dem Schultergelenk (`unter_schulter`) und, um die
            # halbe Höhe von Abstand und Wortmarke tiefer, der Mittelpunkt des Bilds
            hoehe = logo["wortmarke"] / WORTMARKE_BREITE * VERTIKAL["f"]
            seite = hoehe * VERTIKAL["seite"] / VERTIKAL["f"]
            z_f = f["oeffnung"]["hinten"].z - logo["unter_kragen"] - hoehe / 2
            lage["unter_schulter"] = k.kopf["upperarm01.L"].z - z_f
            lage["hoch"] = -(VERTIKAL["abstand"] + 1.0) / 2 / VERTIKAL["seite"] * seite
            masse[logo_name] = {"wortmarke": logo["wortmarke"], "f": hoehe, "f_oben_unter_kragen": logo["unter_kragen"],
                                "block": hoehe * (VERTIKAL["f"] + VERTIKAL["abstand"] + 1.0) / VERTIKAL["f"]}
        else:
            hoehe = brust_hoehe if logo_name == "brust" and brust_hoehe else logo["hoehe"]
            seite = hoehe / F_ANTEIL
        rahmen[logo["teil"]][logo_name.capitalize()] = _rahmen(koerper, k, teile, lage, seite)
        motive[logo_name] = logo.get("motiv", "f")
    for d_name, d in DETAILS.items():
        rahmen[d["teil"]][d_name] = _rahmen(koerper, k, teile, d, d["seite"])
    hose = _teil("Shorts", koerper, skelett, f["hose"], ABSTAND["hose"], rahmen["hose"])
    shirt = _teil("Shirt", koerper, skelett, f["shirt"], ABSTAND["shirt"], rahmen["shirt"], kragen=f["hals"])
    hose.data.materials.append(stoff_material("Shorts", GRAPHIT, zonen_an,
                                               [("Beinvorn", logo_farben[LOGOS["beinvorn"]["farbe"]], motive["beinvorn"])],
                                              [d for d in DETAILS if DETAILS[d]["teil"] == "hose"], zonen_staerke))
    shirt.data.materials.append(stoff_material("Shirt", tee, zonen_an,
                                               [("Brust", logo_farben["brust"], motive["brust"]),
                                                ("Ruecken", logo_farben["ruecken"], motive["ruecken"])],
                                               [d for d in DETAILS if DETAILS[d]["teil"] == "shirt"], zonen_staerke))
    kragen = _buendchen(shirt, koerper, skelett, f["oeffnung"], stoff_material("Kragen", tee, False, [], [], mit_saum=False))
    attr = koerper.data.attributes.get("Bedeckt") or koerper.data.attributes.new("Bedeckt", "FLOAT", "POINT")
    for i in range(len(koerper.data.vertices)):
        attr.data[i].value = max(f["shirt"][i], f["hose"][i])
    anziehen.masse = masse  # Maße des Rückenlogos der zuletzt angezogenen Figur (D-432)
    anziehen.oeffnung = f["oeffnung"]
    return [shirt, hose, kragen]


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
