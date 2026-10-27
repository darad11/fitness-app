"""Szene im FORM-Look für die Übungsbilder (Pilot 3D, D-402).

Hintergrund #0C1219, Körper matt in Grau, arbeitende Muskeln als Zonen in Lime #C7FF46, weiches
Licht von schräg vorn, kein Leuchten (keine Emission, kein Bloom). Farben als sRGB-Werte; Blender
rechnet linear, deshalb `srgb()`.
"""
from __future__ import annotations

import math

import bpy
from mathutils import Vector

HINTERGRUND = "#0C1219"
KOERPER = "#8D96A3"  # --data-8 / --macro-other aus brand-tokens.md
GERAET = "#3C424E"  # --tile-border
GERAET_HELL = "#6B7482"  # --border-input
LIME = "#C7FF46"


def srgb(hex_farbe: str) -> tuple[float, float, float, float]:
    werte = [int(hex_farbe[i : i + 2], 16) / 255 for i in (1, 3, 5)]
    lin = [v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4 for v in werte]
    return (lin[0], lin[1], lin[2], 1.0)


def leere_szene() -> bpy.types.Scene:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    szene = bpy.context.scene
    szene.render.engine = "CYCLES"
    szene.cycles.device = "CPU"
    szene.cycles.samples = 48
    szene.cycles.use_denoising = True
    szene.cycles.max_bounces = 4
    szene.view_settings.view_transform = "Standard"
    szene.view_settings.look = "None"
    szene.render.film_transparent = False
    welt = bpy.data.worlds.new("Welt")
    welt.use_nodes = True
    hg = welt.node_tree.nodes["Background"]
    hg.inputs[0].default_value = srgb(HINTERGRUND)
    hg.inputs[1].default_value = 1.0
    szene.world = welt
    return szene


def matt(name: str, farbe: str, rauheit: float = 0.7) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = srgb(farbe)
    bsdf.inputs["Roughness"].default_value = rauheit
    return mat


def koerper_material() -> bpy.types.Material:
    """Grau, mit Lime, wo das Farbattribut „Zone“ 1 ist (weicher Übergang)."""
    mat = bpy.data.materials.new("Koerper")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    bsdf = nodes["Principled BSDF"]
    bsdf.inputs["Roughness"].default_value = 0.75
    attr = nodes.new("ShaderNodeAttribute")
    attr.attribute_name = "Zone"
    attr.attribute_type = "GEOMETRY"
    # Zone: Gleitkommawert je Eckpunkt, 0 = Grau, 1 = Lime (siehe `zonen.py`).
    mix = nodes.new("ShaderNodeMix")
    mix.data_type = "RGBA"
    mix.inputs[6].default_value = srgb(KOERPER)
    mix.inputs[7].default_value = srgb(LIME)
    links.new(attr.outputs["Fac"], mix.inputs[0])
    links.new(mix.outputs[2], bsdf.inputs["Base Color"])
    return mat


def licht_und_kamera(ziel: Vector, richtung_grad: float, abstand: float, hoehe: float,
                     brennweite: float = 50.0) -> bpy.types.Object:
    """Kamera in Dreiviertel- oder Seitenansicht; Hauptlicht schräg vorn oben, Gegenlicht schwach."""
    szene = bpy.context.scene
    winkel = math.radians(richtung_grad)
    pos = ziel + Vector((math.sin(winkel) * abstand, -math.cos(winkel) * abstand, hoehe))
    cam_daten = bpy.data.cameras.new("Kamera")
    cam_daten.lens = brennweite
    cam = bpy.data.objects.new("Kamera", cam_daten)
    szene.collection.objects.link(cam)
    cam.location = pos
    blick = (ziel - pos).to_track_quat("-Z", "Y")
    cam.rotation_euler = blick.to_euler()
    szene.camera = cam

    def flaeche(name: str, staerke: float, groesse: float, ort: Vector) -> None:
        daten = bpy.data.lights.new(name, "AREA")
        daten.energy = staerke
        daten.size = groesse
        obj = bpy.data.objects.new(name, daten)
        szene.collection.objects.link(obj)
        obj.location = ort
        obj.rotation_euler = (ziel - ort).to_track_quat("-Z", "Y").to_euler()

    # Hauptlicht schräg vorn (von der Kamera aus 35° zur Seite, oben), weich durch große Fläche.
    w2 = winkel - math.radians(40)
    flaeche("Hauptlicht", 260.0, 3.0, ziel + Vector((math.sin(w2) * 4, -math.cos(w2) * 4, 3.0)))
    w3 = winkel + math.radians(150)
    flaeche("Kante", 90.0, 2.0, ziel + Vector((math.sin(w3) * 4, -math.cos(w3) * 4, 2.5)))
    flaeche("Fuell", 40.0, 4.0, ziel + Vector((math.sin(winkel) * 5, -math.cos(winkel) * 5, -0.5)))
    return cam


def boden() -> None:
    """Unsichtbarer Boden, der nur einen weichen Schatten fängt."""
    bpy.ops.mesh.primitive_plane_add(size=20, location=(0, 0, 0))
    ebene = bpy.context.active_object
    ebene.name = "Boden"
    ebene.is_shadow_catcher = True
