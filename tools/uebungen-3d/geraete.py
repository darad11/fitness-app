"""Geräte in echten Maßen (Pilot 3D, D-402). Alle Maße in Metern.

Langhantel: olympische Stange 2,20 m, Griffteil 28 mm, Hülsen 50 mm und je 41,5 cm lang;
Scheiben aus Eisen, 20 kg mit 450 mm und 10 kg mit 330 mm Durchmesser.
Flachbank: Polster 1,20 × 0,30 m, Oberkante 0,43 m.
Latzug: Sitz 0,48 m hoch, Knierolle, Säule, obere Rolle 12 cm, Kabel 5 mm, Latzugstange 1,20 m
mit abgewinkelten Enden.
Kurzhantel 20 kg (D-462), Sechskant, gummiert, nach Herstellerangabe (Fitcom Hex 20 kg): 365 mm lang, Griff 130 mm
lang und 34 mm dick, Köpfe 145 mm über die Ecken.
Verstellbare Bank (D-462) nach Herstellerangaben (Factory Weights Adjustable Commercial Bench: 43 cm hoch, Lehne
30 cm breit, Stufen der Lehne 0, 15, 30, 45 … Grad, des Sitzes 0, 10, 20 Grad; Life Fitness Signature Series
Multi-Adjustable Bench: Rückenpolster 81 cm, Sitz 43 cm hoch): Polster 6 cm dick und 30 cm breit, Lehne 80 cm, Sitz
40 cm lang, 2 cm Spalt am Gelenk.
"""
from __future__ import annotations

import math

import bpy
from mathutils import Euler, Vector

from szene import GERAET, GERAET_HELL, matt


def _mat(name: str, farbe: str, rauheit: float, metall: float = 0.0) -> bpy.types.Material:
    mat = bpy.data.materials.get(name) or matt(name, farbe, rauheit)
    mat.node_tree.nodes["Principled BSDF"].inputs["Metallic"].default_value = metall
    return mat


def _zylinder(name: str, radius: float, laenge: float, ort: Vector, achse: str, mat, eltern=None,
              ecken: int = 48) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cylinder_add(vertices=ecken, radius=radius, depth=laenge, location=ort)
    obj = bpy.context.active_object
    obj.name = name
    if achse == "x":
        obj.rotation_euler = Euler((0, math.pi / 2, 0))
    elif achse == "y":
        obj.rotation_euler = Euler((math.pi / 2, 0, 0))
    bpy.ops.object.shade_smooth()
    obj.data.materials.append(mat)
    if eltern:
        obj.parent = eltern
    return obj


def _kasten(name: str, groesse: tuple[float, float, float], ort: Vector, mat, rund: float = 0.0,
            eltern=None) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cube_add(size=1, location=ort)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = groesse
    bpy.ops.object.transform_apply(scale=True)
    if rund > 0:
        mod = obj.modifiers.new("Rund", "BEVEL")
        mod.width = rund
        mod.segments = 4
        bpy.ops.object.shade_smooth()
    obj.data.materials.append(mat)
    if eltern:
        obj.parent = eltern
    return obj


def langhantel(scheiben: list[tuple[float, float]]) -> bpy.types.Object:
    """Stange entlang x, Mitte im Ursprung des zurückgegebenen Leerobjekts.

    `scheiben`: (Durchmesser, Dicke) von innen nach außen, je Seite gleich.
    """
    stahl = _mat("Stahl", GERAET_HELL, 0.35, 0.6)
    eisen = _mat("Eisen", GERAET, 0.55, 0.2)
    mitte = bpy.data.objects.new("Langhantel", None)
    bpy.context.scene.collection.objects.link(mitte)
    _zylinder("Griffteil", 0.014, 1.31, Vector(), "x", stahl, mitte)
    for seite in (-1, 1):
        _zylinder("Bund", 0.0275, 0.03, Vector((seite * 0.67, 0, 0)), "x", stahl, mitte)
        _zylinder("Huelse", 0.025, 0.415, Vector((seite * (0.685 + 0.2075), 0, 0)), "x", stahl, mitte)
        x = 0.70
        for durchmesser, dicke in scheiben:
            _zylinder("Scheibe", durchmesser / 2, dicke, Vector((seite * (x + dicke / 2), 0, 0)), "x", eisen,
                      mitte, ecken=96)
            x += dicke + 0.004
        _zylinder("Verschluss", 0.035, 0.03, Vector((seite * (x + 0.015), 0, 0)), "x", stahl, mitte)
    return mitte


def flachbank(laenge_achse: str = "y") -> bpy.types.Object:
    polster = _mat("Polster", GERAET, 0.8)
    rahmen = _mat("Rahmen", GERAET_HELL, 0.45, 0.4)
    wurzel = bpy.data.objects.new("Bank", None)
    bpy.context.scene.collection.objects.link(wurzel)
    _kasten("Polster", (0.30, 1.20, 0.06), Vector((0, 0, 0.40)), polster, 0.02, wurzel)
    _kasten("Traeger", (0.08, 1.05, 0.05), Vector((0, 0, 0.345)), rahmen, 0.005, wurzel)
    for y in (-0.48, 0.48):
        _kasten("Bein", (0.06, 0.06, 0.32), Vector((0, y, 0.17)), rahmen, 0.005, wurzel)
        _kasten("Fuss", (0.40, 0.06, 0.04), Vector((0, y, 0.02)), rahmen, 0.005, wurzel)
    return wurzel


def latzug(sitz_oben: float, knie: Vector, rolle_y: float) -> dict[str, bpy.types.Object]:
    """Latzug mit Blick der Person nach -y, Sitz um den Ursprung, Säule vorn (bei -y).

    Eingestellt wie im Studio auf die Person: Sitzhöhe `sitz_oben` (Oberkante), Knierolle bei
    `knie` (Mitte der Rollen, liegt auf den Oberschenkeln kurz vor den Knien), Rolle oben bei
    `rolle_y` senkrecht über der Zugbahn der Stange.
    """
    polster = _mat("Polster", GERAET, 0.8)
    rahmen = _mat("Rahmen", GERAET_HELL, 0.45, 0.4)
    stahl = _mat("Stahl", GERAET_HELL, 0.35, 0.6)
    teile: dict[str, bpy.types.Object] = {}
    _kasten("Sitz", (0.40, 0.36, 0.08), Vector((0, 0.02, sitz_oben - 0.04)), polster, 0.025)
    _kasten("Sitzstuetze", (0.06, 0.06, sitz_oben - 0.08), Vector((0, 0.02, (sitz_oben - 0.08) / 2)), rahmen, 0.005)
    _kasten("Grundrahmen", (0.08, 1.05, 0.05), Vector((0, -0.48, 0.025)), rahmen, 0.005)
    # Säule vorn, Ausleger nach oben über der Person, Rolle über der Zugbahn.
    saeule_y = -0.95
    _kasten("Saeule", (0.10, 0.10, 2.30), Vector((0, saeule_y, 1.15)), rahmen, 0.008)
    _kasten("Ausleger", (0.08, rolle_y - saeule_y + 0.08, 0.08), Vector((0, (rolle_y + saeule_y) / 2, 2.26)), rahmen, 0.008)
    rolle = _zylinder("Rolle", 0.06, 0.03, Vector((0, rolle_y, 2.15)), "x", stahl, ecken=64)
    _kasten("Rollenhalter", (0.05, 0.05, 0.10), Vector((0, rolle_y, 2.22)), rahmen, 0.005)
    hintere_rolle = _zylinder("Rolle2", 0.05, 0.03, Vector((0, saeule_y + 0.05, 2.15)), "x", stahl, ecken=48)
    _kasten("Gewichtsblock", (0.30, 0.16, 0.65), Vector((0, saeule_y - 0.12, 0.40)), rahmen, 0.01)
    # Knierolle: Holm von der Säule, zwei Rollen über den Oberschenkeln.
    _kasten("Knieholm", (0.05, abs(knie.y - saeule_y), 0.05), Vector((0, (knie.y + saeule_y) / 2, knie.z)), rahmen, 0.005)
    for seite in (-1, 1):
        _zylinder("Knierolle", 0.055, 0.17, Vector((seite * 0.105, knie.y, knie.z)), "x", polster)
    teile["rolle"] = rolle
    teile["rolle2"] = hintere_rolle
    # Latzugstange: gerades Mittelstück 0,80 m, Enden 20° nach unten (ohne Gummigriffe, damit
    # die Griffposition der Hände auf dem geraden Teil eindeutig ist).
    stange = bpy.data.objects.new("Latzugstange", None)
    bpy.context.scene.collection.objects.link(stange)
    _zylinder("Mittelstueck", 0.012, 0.80, Vector(), "x", stahl, stange)
    for seite in (-1, 1):
        ende = _zylinder("Ende", 0.012, 0.22, Vector((seite * 0.503, 0, -0.037)), "x", stahl, stange)
        ende.rotation_euler = Euler((0, math.pi / 2 + seite * math.radians(20), 0))
        _zylinder("Kappe", 0.015, 0.02, Vector((seite * 0.6067, 0, -0.0752)), "x", stahl, stange).rotation_euler = Euler(
            (0, math.pi / 2 + seite * math.radians(20), 0))
    _zylinder("Oese", 0.02, 0.04, Vector((0, 0, 0.02)), "y", stahl, stange)
    teile["stange"] = stange
    return teile


def kabel(name: str, von: Vector, nach: Vector) -> bpy.types.Object:
    """Gerades Kabel zwischen zwei Punkten (wird je Bild neu gesetzt)."""
    stahl = _mat("Kabel", GERAET_HELL, 0.4, 0.5)
    obj = bpy.data.objects.get(name)
    if obj is None:
        obj = _zylinder(name, 0.0025, 1.0, Vector(), "z", stahl, ecken=12)
    richtung = nach - von
    obj.location = (von + nach) / 2
    obj.rotation_euler = richtung.to_track_quat("Z", "Y").to_euler()
    obj.scale = (1, 1, richtung.length)
    return obj


# Kurzhantel und verstellbare Bank (D-462)
KH = {"laenge": 0.365, "griff": 0.130, "griff_d": 0.034, "kopf": 0.145, "ring": (0.022, 0.012)}
BANK = {"oben": 0.43, "dicke": 0.06, "breite": 0.30, "lehne": 0.80, "sitz": 0.40, "spalt": 0.02}


def kurzhantel(name: str) -> bpy.types.Object:
    """Kurzhantel (`KH`) mit dem Griff entlang x, Mitte des Griffs im Ursprung des Leerobjekts `name`: Griff aus Stahl
    mit je einem Ring (22 mm Radius, 12 mm) an den Köpfen, frei bleiben 106 mm; Köpfe als Sechskant aus Gummi, eine
    flache Seite unten, Kanten gerundet."""
    stahl = _mat("Stahl", GERAET_HELL, 0.35, 0.6)
    gummi = _mat("Gummi", GERAET, 0.7)
    mitte = bpy.data.objects.new(name, None)
    bpy.context.scene.collection.objects.link(mitte)
    _zylinder(f"{name}-Griff", KH["griff_d"] / 2, KH["griff"], Vector(), "x", stahl, mitte)
    kopf_l = (KH["laenge"] - KH["griff"]) / 2
    r_ring, l_ring = KH["ring"]
    for seite in (-1, 1):
        _zylinder(f"{name}-Ring", r_ring, l_ring, Vector((seite * (KH["griff"] / 2 - l_ring / 2), 0, 0)), "x", stahl, mitte)
        kopf = _zylinder(f"{name}-Kopf", KH["kopf"] / 2, kopf_l, Vector((seite * (KH["griff"] / 2 + kopf_l / 2), 0, 0)), "x",
                         gummi, mitte, ecken=6)
        # erst entlang x legen, dann 30° um die eigene Achse: Ecken bei 0, 60, 120 … Grad, unten eine flache Seite
        kopf.rotation_mode = "YXZ"
        kopf.rotation_euler = Euler((math.radians(30), math.pi / 2, 0), "YXZ")
        bpy.context.view_layer.objects.active = kopf
        bpy.ops.object.shade_flat()
        rund = kopf.modifiers.new("Rund", "BEVEL")
        rund.width = 0.008
        rund.segments = 3
    return mitte


def schraegbank(lehne: float, sitz: float = 0.0) -> bpy.types.Object:
    """Verstellbare Bank (`BANK`), Person mit dem Kopf nach +y: Gelenk zwischen Sitz und Lehne bei y = 0 an der
    Unterkante der Polster; die Lehne steigt um `lehne` Grad zum Kopf, der Sitz um `sitz` Grad zu den Füßen. Polster
    „Lehne“ und „Sitz“ auf Platten, Rahmen mit Träger, Füßen, Stütze unter dem Gelenk und Strebe unter der Lehne."""
    polster = _mat("Polster", GERAET, 0.8)
    rahmen = _mat("Rahmen", GERAET_HELL, 0.45, 0.4)
    b = BANK
    wurzel = bpy.data.objects.new("Bank", None)
    bpy.context.scene.collection.objects.link(wurzel)
    gelenk = Vector((0, 0, b["oben"] - b["dicke"]))
    for name, winkel, laenge, richt in (("Lehne", lehne, b["lehne"], 1), ("Sitz", -sitz, b["sitz"], -1)):
        dreh = bpy.data.objects.new(f"{name}Dreh", None)
        bpy.context.scene.collection.objects.link(dreh)
        dreh.location = gelenk
        dreh.rotation_euler = Euler((math.radians(winkel), 0, 0))
        dreh.parent = wurzel
        _kasten(name, (b["breite"], laenge, b["dicke"]), Vector((0, richt * (b["spalt"] / 2 + laenge / 2), b["dicke"] / 2)),
                polster, 0.02, dreh)
        _kasten(f"{name}Platte", (0.10, laenge - 0.06, 0.02), Vector((0, richt * (b["spalt"] / 2 + laenge / 2), -0.01)),
                rahmen, 0.004, dreh)
    _kasten("Traeger", (0.08, 1.10, 0.05), Vector((0, 0.0, 0.055)), rahmen, 0.005, wurzel)
    for y in (-0.52, 0.52):
        _kasten("Fuss", (0.42, 0.06, 0.04), Vector((0, y, 0.02)), rahmen, 0.005, wurzel)
    _kasten("Stuetze", (0.06, 0.06, gelenk.z - 0.08), Vector((0, 0, (gelenk.z + 0.08) / 2)), rahmen, 0.005, wurzel)
    if lehne > 1.0:
        a = math.radians(lehne)
        oben = gelenk + Vector((0, math.cos(a), math.sin(a))) * (b["lehne"] * 0.55) - Vector((0, -math.sin(a), math.cos(a))) * 0.02
        unten = Vector((0, oben.y + 0.05, 0.08))
        strebe = _kasten("Strebe", (0.05, 0.05, (oben - unten).length), (oben + unten) / 2, rahmen, 0.004, wurzel)
        strebe.rotation_euler = Euler((math.atan2(-(oben - unten).y, (oben - unten).z), 0, 0))
    return wurzel
