"""Geräte in echten Maßen (Pilot 3D, D-402). Alle Maße in Metern.

Langhantel: olympische Stange 2,20 m, Griffteil 28 mm, Hülsen 50 mm und je 41,5 cm lang;
Scheiben aus Eisen, 20 kg mit 450 mm und 10 kg mit 330 mm Durchmesser.
Flachbank: Polster 1,20 × 0,30 m, Oberkante 0,43 m.
Latzug: Sitz 0,48 m hoch, Knierolle, Säule, obere Rolle 12 cm, Kabel 5 mm, Latzugstange 1,20 m
mit abgewinkelten Enden.
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


def latzug() -> dict[str, bpy.types.Object]:
    """Gerät mit Blick der Person nach -y. Sitz im Ursprung, Säule vorn (bei -y)."""
    polster = _mat("Polster", GERAET, 0.8)
    rahmen = _mat("Rahmen", GERAET_HELL, 0.45, 0.4)
    stahl = _mat("Stahl", GERAET_HELL, 0.35, 0.6)
    teile: dict[str, bpy.types.Object] = {}
    _kasten("Sitz", (0.40, 0.36, 0.08), Vector((0, 0, 0.48)), polster, 0.025)
    _kasten("Sitzstuetze", (0.06, 0.06, 0.44), Vector((0, 0, 0.22)), rahmen, 0.005)
    _kasten("Grundrahmen", (0.08, 0.95, 0.05), Vector((0, -0.45, 0.025)), rahmen, 0.005)
    # Knierolle über den Oberschenkeln, nahe den Knien.
    _kasten("Knieholm", (0.05, 0.05, 0.30), Vector((0, -0.38, 0.55)), rahmen, 0.005)
    for seite in (-1, 1):
        _zylinder("Knierolle", 0.055, 0.2, Vector((seite * 0.12, -0.36, 0.69)), "x", polster)
    # Säule vorn, Ausleger nach oben über der Person, Rolle über dem Griffbereich.
    _kasten("Saeule", (0.10, 0.10, 2.25), Vector((0, -0.85, 1.125)), rahmen, 0.008)
    _kasten("Ausleger", (0.08, 0.80, 0.08), Vector((0, -0.48, 2.22)), rahmen, 0.008)
    rolle = _zylinder("Rolle", 0.06, 0.03, Vector((0, -0.10, 2.13)), "x", stahl, ecken=64)
    _kasten("Rollenhalter", (0.05, 0.05, 0.10), Vector((0, -0.10, 2.20)), rahmen, 0.005)
    _kasten("Gewichtsblock", (0.30, 0.16, 0.65), Vector((0, -1.0, 0.40)), rahmen, 0.01)
    teile["rolle"] = rolle
    # Latzugstange: gerades Mittelstück, Enden 20° nach unten, Griffe.
    stange = bpy.data.objects.new("Latzugstange", None)
    bpy.context.scene.collection.objects.link(stange)
    _zylinder("Mittelstueck", 0.012, 0.80, Vector(), "x", stahl, stange)
    for seite in (-1, 1):
        ende = _zylinder("Ende", 0.012, 0.22, Vector((seite * 0.503, 0, -0.037)), "x", stahl, stange)
        ende.rotation_euler = Euler((0, math.pi / 2 + seite * math.radians(20), 0))
        griff = _zylinder("Griff", 0.016, 0.13, Vector((seite * 0.52, 0, -0.043)), "x", polster, stange)
        griff.rotation_euler = Euler((0, math.pi / 2 + seite * math.radians(20), 0))
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
