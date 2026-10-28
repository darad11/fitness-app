"""FORM-Kleidung für die Figur (Varianten C und D, D-414).

STEP Running Tee in Nacht #0C1219 und STEP Shorts in Graphit, dazu kleine Lime-Details: ein kleines
Zeichen auf der linken Brust und auf dem linken Hosenbein, schmale Paspeln an Ärmel- und Beinsaum.
Die Details bleiben klein (höchstens 3 cm, Paspeln 5 mm), damit sie nicht wie Muskelzonen wirken.

Die Teile entstehen aus dem Netz der Figur, ohne fremde Dateien: Die Flächen des bedeckten Bereichs
werden kopiert, nach außen versetzt (eng anliegend wie Laufkleidung), geglättet (kein Abdruck von
Brustwarzen, Bauch oder Rippen) und hängen mit denselben Gewichten am Skelett. So folgen sie jeder
Haltung ohne Stoffsimulation. Säume und Halsausschnitt sind keine Netzkanten, sondern ein Feld
(Abstand zum Saum in Metern, wie bei den Muskelzonen): Der Stoff endet dort scharf, unabhängig von
der Netzauflösung. Die Muskelzonen gehen auf den Stoff über (Attribute „Zone“, „ZoneMit“); mit
`zonen_an=False` bleibt der Stoff einfarbig.
"""
from __future__ import annotations

import math

import bpy
import bmesh  # erst nach bpy verfügbar (Blender als Modul)
from mathutils import Vector

import szene
import zonen

NACHT = "#0C1219"  # STEP Running Tee
GRAPHIT = "#575D67"  # STEP Shorts: Graphit (Vorlage nicht erhalten); heller als die Bank (#3C424E), sonst verschwimmen beide
LIME = szene.LIME

# Lage der Säume (Körperkoordinaten wie bei den Zonen, `zonen.Koordinaten`)
SHIRT_SAUM = 0.02  # Anteil Hüftgelenk (0) bis Halsansatz (1): Saum knapp über den Hüftgelenken
AERMEL = 0.40  # Anteil Schulter (0) bis Ellbogen (1): kurzer Ärmel
HOSE_BUND = 0.22  # Bund knapp unter dem Nabel
HOSE_BEIN = 0.40  # Anteil Hüfte (0) bis Knie (1): Laufshorts
HALS = (0.072, 0.066)  # Halbachsen des Ausschnitts (quer, vorn–hinten), m
ABSTAND = {"shirt": 0.0065, "hose": 0.0048}  # Stoff über der Haut, m
PASPEL = 0.005  # Breite der Paspeln, m


def _rechteck(px: float, py: float, mx: float, my: float, bx: float, by: float, r: float) -> float:
    """Abstand (m, positiv innen) zu einem Rechteck mit runden Ecken (Mitte, halbe Breiten, Radius)."""
    qx, qy = abs(px - mx) - (bx - r), abs(py - my) - (by - r)
    aussen = math.hypot(max(qx, 0.0), max(qy, 0.0)) + min(max(qx, qy), 0.0)
    return -(aussen - r)


def _felder(koerper: bpy.types.Object, skelett: bpy.types.Object) -> dict[str, list[float]]:
    """Je Eckpunkt: Abstand zum Rand von Shirt und Hose (m, positiv = bedeckt) und Felder der Details."""
    k = zonen.Koordinaten(koerper, skelett)
    kopf = k.kopf
    hals = kopf["neck01"]
    felder = {n: [] for n in ("shirt", "hose", "detail_shirt", "detail_hose")}
    # Rumpf mit dem ganzen Hals: Der Ausschnitt schneidet ihn, so bleibt das Feld dort stetig
    rumpfknochen = ("root", "spine01", "spine02", "spine03", "spine04", "spine05", "neck01", "neck02", "neck03",
                    "pelvis.L", "pelvis.R", "clavicle.L", "clavicle.R", "breast.L", "breast.R", "shoulder01.L",
                    "shoulder01.R")
    for v in koerper.data.vertices:
        i, p = v.index, v.co
        seite = "L" if p.x >= 0 else "R"
        x = 1 if seite == "L" else -1
        # Körperteil mit dem größten Gewicht: Oberarm, Rumpf (mit Halsansatz), Oberschenkel oder
        # Rest (Unterarm, Hand, Kopf, Gesicht, Unterschenkel, Fuß; nie bedeckt)
        arm = k.w(i, f"upperarm01.{seite}", f"upperarm02.{seite}", f"achsel.{seite}")
        bein = k.w(i, f"upperleg01.{seite}", f"upperleg02.{seite}")
        rumpf = k.w(i, *rumpfknochen)
        rest = max(0.0, 1.0 - arm - bein - rumpf)
        teil = max((arm, "arm"), (bein, "bein"), (rumpf, "rumpf"), (rest, "rest"))[1]
        theta, s, L = k.rumpf(p)
        # Halsausschnitt: elliptischer Zylinder um den Hals, Mitte etwas hinter dem Halsgelenk
        e = math.hypot(p.x / HALS[0], (p.y - hals.y - 0.004) / HALS[1])
        ausschnitt = (e - 1.0) * HALS[1] if p.z > hals.z - 0.10 else 1.0
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
        # Details Shirt: Zeichen auf der linken Brust (3,0 × 1,4 cm), Paspel am Ärmelsaum
        d = -1.0
        if teil == "rumpf" and x == 1:
            d = _rechteck(theta * math.pi / 180 * 0.13, s * L, 30 * math.pi / 180 * 0.13, 0.80 * L, 0.015, 0.007, 0.003)
        if teil == "arm" and shirt > -0.002:
            d = max(d, PASPEL / 2 - abs(shirt - PASPEL / 2))
        felder["detail_shirt"].append(d)
        # Details Hose: Zeichen außen auf dem linken Bein (2,4 × 1,2 cm), Paspel am Beinsaum
        d = -1.0
        if teil == "bein":
            th, t, Lb, _ = k.glied(p, f"upperleg01.{seite}", f"lowerleg01.{seite}", Vector((0, -1, 0)), seite)
            if x == 1:
                d = _rechteck(th * math.pi / 180 * 0.075, t * Lb, 75 * math.pi / 180 * 0.075, (HOSE_BEIN - 0.07) * Lb,
                              0.012, 0.006, 0.0025)
            if hose > -0.002:
                d = max(d, PASPEL / 2 - abs(hose - PASPEL / 2))
        felder["detail_hose"].append(d)
    return felder


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


def _teil(name: str, koerper: bpy.types.Object, skelett: bpy.types.Object, feld: list[float], detail: list[float],
          abstand: float, rand: float = 0.03) -> bpy.types.Object:
    """Kleidungsstück: Flächen, deren Eckpunkte höchstens `rand` außerhalb des Saums liegen, kopiert,
    versetzt und geglättet; mit denselben Gewichten am Skelett."""
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


def stoff_material(name: str, farbe: str, zonen_an: bool, mit_deckkraft: float = 0.5) -> bpy.types.Material:
    """Stoff matt mit leichtem Glanz (Sheen); endet scharf am Saum (Attribut „Saum“), Lime-Details
    (Attribut „Detail“), auf Wunsch Muskelzonen in Lime auf dem Stoff."""
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
    if zonen_an:
        haupt, mit = maske("Zone"), maske("ZoneMit")
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
    if isinstance(farbe_out, tuple):
        bsdf.inputs["Base Color"].default_value = farbe_out
    else:
        links.new(farbe_out, bsdf.inputs["Base Color"])
    links.new(maske("Saum", 0.0008), bsdf.inputs["Alpha"])
    return mat


def anziehen(koerper: bpy.types.Object, skelett: bpy.types.Object, zonen_an: bool) -> list[bpy.types.Object]:
    """Shirt und Shorts an die Figur (nach `zonen.setze_zonen` und `figur.schulter_gewichte`). Setzt
    am Körper das Attribut „Bedeckt“ (Abstand innerhalb von Shirt oder Hose, m): Haut, die tiefer als
    12 mm unter dem Stoff liegt, blendet das Material aus (`haut_ausblenden`), damit sie in starken
    Beugungen nicht durch den Stoff sticht."""
    f = _felder(koerper, skelett)
    hose = _teil("Shorts", koerper, skelett, f["hose"], f["detail_hose"], ABSTAND["hose"])
    shirt = _teil("Shirt", koerper, skelett, f["shirt"], f["detail_shirt"], ABSTAND["shirt"])
    hose.data.materials.append(stoff_material("Shorts", GRAPHIT, zonen_an))
    shirt.data.materials.append(stoff_material("Shirt", NACHT, zonen_an))
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
