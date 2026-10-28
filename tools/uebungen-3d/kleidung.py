"""FORM-Kleidung für die Figur (Varianten C und D, D-414; Feinschliff D-417).

STEP Running Tee in Nacht #0C1219 mit Rundhals und kurzen Ärmeln, STEP Shorts in Graphit #4A4F57
(Farben nach der Vorlage des Produktinhabers, Nachricht vom 28.10.2026). Aufdruck ist das FORM-F aus
`public/brand/symbol-f-gruen.svg`: vorn auf der linken Brust, hinten zwischen den Schulterblättern,
außen auf dem linken Hosenbein; in Lime oder hell Ton in Ton (`logo`). Dazu 5 mm Paspeln in Lime an
Ärmel- und Beinsaum.

Die Teile entstehen aus dem Netz der Figur, ohne fremde Dateien: Die Flächen des bedeckten Bereichs
werden kopiert, nach außen versetzt (eng anliegend wie Laufkleidung), geglättet (kein Abdruck von
Brustwarzen, Bauch oder Rippen) und hängen mit denselben Gewichten am Skelett. So folgen sie jeder
Haltung ohne Stoffsimulation. Säume und Halsausschnitt sind keine Netzkanten, sondern ein Feld
(Abstand zum Saum in Metern, wie bei den Muskelzonen): Der Stoff endet dort scharf, unabhängig von
der Netzauflösung. Der Rundhals wird aus dem Netz bestimmt: Mitte und Maße des Halses aus der
Halshaut, dazu eine Kugel am Halsansatz für den runden Ausschnitt vorn. Weil der Schnitt an den
Eckpunkten hängt, bleibt der Hals in jeder Haltung frei.

Das F liegt als Bild auf dem Stoff (aus dem SVG gerastert, `quelle/form-f.png`), abgewickelt um die
Körperachse (Winkel × Radius quer, Höhe längs): scharf wie ein Aufdruck, unabhängig von der
Netzauflösung, und es bewegt sich mit dem Stoff. Die Muskelzonen gehen auf den Stoff über
(Attribute „Zone“, „ZoneMit“); mit `zonen_an=False` bleibt der Stoff einfarbig.
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
GRAPHIT = "#4A4F57"  # STEP Shorts (Vorlage)
LIME = szene.LIME
LOGO_FARBEN = {"lime": LIME, "hell": "#AAB2BE"}  # hell Ton in Ton: --fg-muted, dieselbe Farbfamilie wie Nacht und Graphit
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
PASPEL = 0.005  # Breite der Paspeln, m
# Logos: Winkel um die Achse (Rumpf: 0 vorn, links positiv; Rücken: 0 hinten; Bein: 0 vorn, 90 außen),
# Lage längs (Rumpf: Anteil Hüfte→Hals, Bein: Anteil Hüfte→Knie) und Höhe des F in Metern
LOGOS = {
    "brust": {"winkel": 24.0, "lage": 0.79, "hoehe": 0.055},
    "ruecken": {"winkel": 0.0, "lage": 0.80, "hoehe": 0.10},
    "bein": {"winkel": 68.0, "lage": 0.30, "hoehe": 0.045},
}
F_ANTEIL = 0.861  # Höhe des F im quadratischen Bild (`_f_bild`)


# ---------------------------------------------------------------------- Felder je Eckpunkt


def _halsmasse(koerper: bpy.types.Object, k: zonen.Koordinaten) -> tuple[float, float, float]:
    """Mitte (y) und Halbachsen (quer, vorn–hinten) der Halshaut am Halsansatz, aus dem Netz."""
    hals = k.kopf["neck01"]
    haut = [v.co for v in koerper.data.vertices
            if k.w(v.index, "neck01", "neck02", "neck03") > 0.5 and -0.005 < v.co.z - hals.z < 0.035]
    ys = [p.y for p in haut]
    return (min(ys) + max(ys)) / 2, max(abs(p.x) for p in haut) + HALS_RAND, (max(ys) - min(ys)) / 2 + HALS_RAND


def _felder(koerper: bpy.types.Object, skelett: bpy.types.Object) -> dict:
    """Je Eckpunkt: Abstand zum Rand von Shirt und Hose (m, positiv = bedeckt), Felder der Paspeln,
    Abwicklung für die Logos (Winkel in Grad, Lage längs in m) und die Radien an den Logos."""
    k = zonen.Koordinaten(koerper, skelett)
    kopf = k.kopf
    hals = kopf["neck01"]
    hals_y, hals_x, hals_tiefe = _halsmasse(koerper, k)
    kugel = Vector((0.0, hals_y - 0.015, hals.z - 0.025))
    achse = (k.N - k.O).normalized()
    felder = {n: [] for n in ("shirt", "hose", "detail_shirt", "detail_hose", "brust", "ruecken", "bein")}
    radien = {"brust": [], "ruecken": [], "bein": []}
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
        theta, s, L = k.rumpf(p)
        rel = p - k.O
        r_rumpf = (rel - rel.dot(achse) * achse).length
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
        # Paspeln an Ärmel- und Beinsaum (Abstand zur Mitte der Paspel)
        felder["detail_shirt"].append(PASPEL / 2 - abs(shirt - PASPEL / 2) if teil == "arm" and shirt > -0.002 else -1.0)
        felder["detail_hose"].append(PASPEL / 2 - abs(hose - PASPEL / 2) if teil == "bein" and hose > -0.002 else -1.0)
        # Abwicklung für die Logos: Winkel um die Achse und Lage längs, beides so, dass das Bild von
        # außen gesehen richtig herum liegt: am Rumpf vorn (0° vorn, nach links positiv) und hinten
        # (0° hinten, nach rechts positiv), am linken Oberschenkel um den Knochen (Lage nach oben)
        vorn = theta * x
        hinten = -(180.0 - theta) * x
        felder["brust"].append((vorn, s * L))
        felder["ruecken"].append((hinten, s * L))
        if teil == "rumpf":
            if abs(vorn - LOGOS["brust"]["winkel"]) < 15 and abs(s - LOGOS["brust"]["lage"]) < 0.06:
                radien["brust"].append(r_rumpf)
            if abs(hinten - LOGOS["ruecken"]["winkel"]) < 15 and abs(s - LOGOS["ruecken"]["lage"]) < 0.06:
                radien["ruecken"].append(r_rumpf)
        th, t, Lb, rb = k.glied(p, "upperleg01.L", "lowerleg01.L", Vector((0, -1, 0)), "L")
        felder["bein"].append((th, -t * Lb))
        if teil == "bein" and x == 1 and abs(th - LOGOS["bein"]["winkel"]) < 15 and abs(t - LOGOS["bein"]["lage"]) < 0.06:
            radien["bein"].append(rb)
    felder["radien"] = {n: sum(r) / len(r) for n, r in radien.items()}
    return felder


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


def _logo_uv(mesh: bpy.types.Mesh, alt: list[int], name: str, abwicklung: list[tuple[float, float]],
             radius: float, logo: dict) -> None:
    """UV-Schicht `name`: das F-Bild liegt mit seiner Höhe `logo["hoehe"]` bei Winkel und Lage des Logos.
    u = Bogenlänge quer (Winkel × Radius), v = Lage längs, beides in Metern, auf das Bild bezogen.
    Flächen über der Naht der Abwicklung (±180°) werden je Fläche aufgerollt, damit das Bild dort
    nicht durchläuft."""
    seite = logo["hoehe"] / F_ANTEIL  # Kantenlänge des Bildes auf dem Stoff, m
    w0, a0 = logo["winkel"], None
    schicht = mesh.uv_layers.new(name=name)
    for poly in mesh.polygons:
        ecken = [abwicklung[alt[mesh.loops[l].vertex_index]] for l in poly.loop_indices]
        winkel = [w for w, _ in ecken]
        if max(winkel) - min(winkel) > 180:
            winkel = [w + 360 if w < 0 else w for w in winkel]
        for l, w, (_, lage) in zip(poly.loop_indices, winkel, ecken):
            if a0 is None:
                a0 = logo["_lage_m"]
            u = (math.radians(w - w0) * radius) / seite + 0.5
            v = (lage - a0) / seite + 0.5
            schicht.data[l].uv = (u, v)


def _teil(name: str, koerper: bpy.types.Object, skelett: bpy.types.Object, feld: list[float], detail: list[float],
          abstand: float, logos: list[tuple[str, list, float, dict]], rand: float = 0.03) -> bpy.types.Object:
    """Kleidungsstück: Flächen, deren Eckpunkte höchstens `rand` außerhalb des Saums liegen, kopiert,
    versetzt und geglättet; mit denselben Gewichten am Skelett; UV-Schichten für die Logos."""
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
    for attr_name, werte in (("Saum", feld), ("Detail", detail)):
        ziel = mesh.attributes.new(attr_name, "FLOAT", "POINT")
        for neu_i, alt_i in enumerate(alt):
            ziel.data[neu_i].value = werte[alt_i]
    for schicht, abwicklung, radius, logo in logos:
        _logo_uv(mesh, alt, schicht, abwicklung, radius, logo)
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


def _f_bild() -> bpy.types.Image:
    """Das FORM-F als quadratisches Bild mit Deckkraft (weiß auf durchsichtig, 1024 px, 4-fach
    überabgetastet), gerastert aus `public/brand/symbol-f-gruen.svg`; gespeichert in `quelle/form-f.png`.
    Das F füllt `F_ANTEIL` der Höhe, in der Mitte."""
    pfad = QUELLE / "form-f.png"
    if pfad.exists():
        return bpy.data.images.load(str(pfad), check_existing=True)
    import numpy as np

    polys = [_pfad_polygon(d) for d in re.findall(r'<path[^>]*\sd="([^"]+)"', SVG_F.read_text(encoding="utf-8"))]
    xs = [x for p in polys for x, _ in p]
    ys = [y for p in polys for _, y in p]
    cx, cy = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2
    seite = (max(ys) - min(ys)) / F_ANTEIL
    N, U = 1024, 4
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
    bild.alpha_mode = "STRAIGHT"
    QUELLE.mkdir(parents=True, exist_ok=True)
    bild.filepath_raw = str(pfad)
    bild.file_format = "PNG"
    bild.save()
    return bild


# ---------------------------------------------------------------------- Material


def stoff_material(name: str, farbe: str, zonen_an: bool, logo_farbe: str, logos: list[str],
                   mit_deckkraft: float = 0.5) -> bpy.types.Material:
    """Stoff matt mit leichtem Glanz (Sheen); endet scharf am Saum (Attribut „Saum“), Lime-Paspeln
    (Attribut „Detail“), auf Wunsch Muskelzonen in Lime auf dem Stoff; darüber die Logos (UV-Schichten
    `logos`, FORM-F in `logo_farbe`) wie ein Aufdruck; ein Lime-F in einer Lime-Zone in der Stoffarbe."""
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    bsdf = nodes["Principled BSDF"]
    bsdf.inputs["Roughness"].default_value = 0.82
    bsdf.inputs["Sheen Weight"].default_value = 0.35
    bsdf.inputs["Sheen Roughness"].default_value = 0.45

    def maske(attribut: str, breite: float = 0.0012):
        attr = nodes.new("ShaderNodeAttribute")
        attr.attribute_name = attribut
        attr.attribute_type = "GEOMETRY"
        rng = nodes.new("ShaderNodeMapRange")
        rng.interpolation_type = "SMOOTHSTEP"
        rng.clamp = True
        rng.inputs["From Min"].default_value = -breite
        rng.inputs["From Max"].default_value = breite
        links.new(attr.outputs["Fac"], rng.inputs["Value"])
        return rng.outputs["Result"]

    def mischen(faktor, a, b):
        mix = nodes.new("ShaderNodeMix")
        mix.data_type = "RGBA"
        links.new(faktor, mix.inputs[0])
        if isinstance(a, tuple):
            mix.inputs[6].default_value = a
        else:
            links.new(a, mix.inputs[6])
        mix.inputs[7].default_value = b
        return mix.outputs[2]

    farbe_out = srgb = szene.srgb(farbe)
    logo_rgb = szene.srgb(logo_farbe)
    if zonen_an:
        haupt, mit = maske("Zone"), maske("ZoneMit")
        if logo_farbe == LIME:
            # Lime-F in einer Lime-Zone: ausgespart in der Stoffarbe, sonst verschwände es oder bliebe
            # als Rest stehen; so ist es nie mit einer Zone zu verwechseln (Bankdrücken, Latziehen)
            logo_rgb = mischen(haupt, logo_rgb, srgb)
        nicht = nodes.new("ShaderNodeMath")
        nicht.operation = "SUBTRACT"
        nicht.inputs[0].default_value = 1.0
        links.new(haupt, nicht.inputs[1])
        mf = nodes.new("ShaderNodeMath")
        mf.operation = "MULTIPLY"
        links.new(mit, mf.inputs[0])
        links.new(nicht.outputs[0], mf.inputs[1])
        md = nodes.new("ShaderNodeMath")
        md.operation = "MULTIPLY"
        md.inputs[1].default_value = mit_deckkraft
        links.new(mf.outputs[0], md.inputs[0])
        farbe_out = mischen(md.outputs[0], srgb, szene.srgb(LIME))
        farbe_out = mischen(haupt, farbe_out, szene.srgb(LIME))
    farbe_out = mischen(maske("Detail", 0.0006), farbe_out, szene.srgb(LIME))
    if logos:
        bild = _f_bild()
        summe = None
        for schicht in logos:
            uv = nodes.new("ShaderNodeUVMap")
            uv.uv_map = schicht
            tex = nodes.new("ShaderNodeTexImage")
            tex.image = bild
            tex.extension = "CLIP"
            links.new(uv.outputs["UV"], tex.inputs["Vector"])
            if summe is None:
                summe = tex.outputs["Alpha"]
            else:
                add = nodes.new("ShaderNodeMath")
                add.operation = "ADD"
                add.use_clamp = True
                links.new(summe, add.inputs[0])
                links.new(tex.outputs["Alpha"], add.inputs[1])
                summe = add.outputs[0]
        mix = nodes.new("ShaderNodeMix")
        mix.data_type = "RGBA"
        links.new(summe, mix.inputs[0])
        links.new(farbe_out, mix.inputs[6])
        if isinstance(logo_rgb, tuple):
            mix.inputs[7].default_value = logo_rgb
        else:
            links.new(logo_rgb, mix.inputs[7])
        farbe_out = mix.outputs[2]
    if isinstance(farbe_out, tuple):
        bsdf.inputs["Base Color"].default_value = farbe_out
    else:
        links.new(farbe_out, bsdf.inputs["Base Color"])
    links.new(maske("Saum", 0.0008), bsdf.inputs["Alpha"])
    return mat


def anziehen(koerper: bpy.types.Object, skelett: bpy.types.Object, zonen_an: bool, logo: str = "lime",
             tee: str = NACHT) -> list[bpy.types.Object]:
    """Shirt und Shorts an die Figur (nach `zonen.setze_zonen` und `figur.schulter_gewichte`); `logo`
    „lime“ oder „hell“, `tee` die Farbe des Shirts. Setzt am Körper das Attribut „Bedeckt“ (Abstand
    innerhalb von Shirt oder Hose, m): Haut, die tiefer als 12 mm unter dem Stoff liegt, blendet das
    Material aus (`haut_ausblenden`), damit sie in starken Beugungen nicht durch den Stoff sticht."""
    f = _felder(koerper, skelett)
    k = zonen.Koordinaten(koerper, skelett)
    L = (k.N - k.O).length
    Lb = (k.kopf["lowerleg01.L"] - k.kopf["upperleg01.L"]).length
    brust = dict(LOGOS["brust"], _lage_m=LOGOS["brust"]["lage"] * L)
    ruecken = dict(LOGOS["ruecken"], _lage_m=LOGOS["ruecken"]["lage"] * L)
    bein = dict(LOGOS["bein"], _lage_m=-LOGOS["bein"]["lage"] * Lb)
    hose = _teil("Shorts", koerper, skelett, f["hose"], f["detail_hose"], ABSTAND["hose"],
                 [("LogoBein", f["bein"], f["radien"]["bein"], bein)])
    shirt = _teil("Shirt", koerper, skelett, f["shirt"], f["detail_shirt"], ABSTAND["shirt"],
                  [("LogoBrust", f["brust"], f["radien"]["brust"], brust),
                   ("LogoRuecken", f["ruecken"], f["radien"]["ruecken"], ruecken)])
    farbe = LOGO_FARBEN[logo]
    hose.data.materials.append(stoff_material("Shorts", GRAPHIT, zonen_an, farbe, ["LogoBein"]))
    shirt.data.materials.append(stoff_material("Shirt", tee, zonen_an, farbe, ["LogoBrust", "LogoRuecken"]))
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
