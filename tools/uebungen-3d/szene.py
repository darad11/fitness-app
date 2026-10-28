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
KANTE = (280.0, 200.0)  # Kantenlicht hinten links und rechts, W (D-417; 420/300 war zu hell, 200/140 zu schwach)


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


def koerper_material(mit_deckkraft: float = 0.42) -> bpy.types.Material:
    """Grau, Muskelzonen in Lime mit scharfem Rand (D-409).

    Die Attribute „Zone“ (Hauptmuskeln) und „ZoneMit“ (mitarbeitend) sind Abstände zum Rand des
    Umrisses in Metern, positiv innen. Geschnitten wird bei 0 mit 1,2 mm Übergang: so bleibt der
    Rand glatt, aber klar. Mitarbeitende Muskeln: Lime mit geringer Deckkraft über dem Grau.
    """
    mat = bpy.data.materials.new("Koerper")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    bsdf = nodes["Principled BSDF"]
    bsdf.inputs["Roughness"].default_value = 0.72

    def maske(attribut: str):
        attr = nodes.new("ShaderNodeAttribute")
        attr.attribute_name = attribut
        attr.attribute_type = "GEOMETRY"
        rng = nodes.new("ShaderNodeMapRange")
        rng.interpolation_type = "SMOOTHSTEP"
        rng.clamp = True
        rng.inputs["From Min"].default_value = -0.0012
        rng.inputs["From Max"].default_value = 0.0012
        links.new(attr.outputs["Fac"], rng.inputs["Value"])
        return rng.outputs["Result"]

    haupt = maske("Zone")
    mit = maske("ZoneMit")
    # Mitarbeitend nur, wo kein Hauptmuskel ist; Deckkraft gering.
    nicht_haupt = nodes.new("ShaderNodeMath")
    nicht_haupt.operation = "SUBTRACT"
    nicht_haupt.inputs[0].default_value = 1.0
    links.new(haupt, nicht_haupt.inputs[1])
    mit_faktor = nodes.new("ShaderNodeMath")
    mit_faktor.operation = "MULTIPLY"
    links.new(mit, mit_faktor.inputs[0])
    links.new(nicht_haupt.outputs[0], mit_faktor.inputs[1])
    mit_deck = nodes.new("ShaderNodeMath")
    mit_deck.operation = "MULTIPLY"
    mit_deck.inputs[1].default_value = mit_deckkraft
    links.new(mit_faktor.outputs[0], mit_deck.inputs[0])

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

    farbe = mischen(mit_deck.outputs[0], srgb(KOERPER), srgb(LIME))
    farbe = mischen(haupt, farbe, srgb(LIME))
    links.new(farbe, bsdf.inputs["Base Color"])
    return mat


def licht_und_kamera(ziel: Vector, richtung_grad: float, abstand: float, hoehe: float,
                     brennweite: float = 50.0, kantenlicht: bool = True) -> bpy.types.Object:
    """Kamera in Dreiviertel- oder Seitenansicht; Hauptlicht schräg vorn oben, Fülllicht von der
    Kamera. Kantenlicht (D-417): zwei schmale Flächen hinter der Figur, je 30° neben der Gegenrichtung
    der Kamera und hoch, geben Figur, Kleidung und Geräten eine dünne helle Kante, damit sich dunkler
    Stoff vom Hintergrund Nacht abhebt. Ohne Kantenlicht (Stand bis D-416) nur ein schwaches
    Gegenlicht von hinten links."""
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
    if kantenlicht:
        for name, seite, staerke in (("KanteL", 150, KANTE[0]), ("KanteR", -150, KANTE[1])):
            w3 = winkel + math.radians(seite)
            flaeche(name, staerke, 1.0, ziel + Vector((math.sin(w3) * 4, -math.cos(w3) * 4, 3.2)))
    else:
        w3 = winkel + math.radians(150)
        flaeche("Kante", 90.0, 2.0, ziel + Vector((math.sin(w3) * 4, -math.cos(w3) * 4, 2.5)))
    flaeche("Fuell", 40.0, 4.0, ziel + Vector((math.sin(winkel) * 5, -math.cos(winkel) * 5, -0.5)))
    return cam


def bildausschnitt(punkte: list[Vector], richtung_grad: float, neigung_grad: float, breite: int, hoehe: int,
                   rand: float = 0.06, brennweite: float = 50.0) -> tuple[Vector, float, float]:
    """Kamera so weit weg wie nötig, dass alle Punkte mit Rand ins Bild passen.

    Gleiche Richtung und Neigung für alle Übungen einer Ansicht; der Abstand ergibt sich aus der
    Größe von Figur und Gerät. Gibt (Ziel, waagrechter Abstand, Höhe über dem Ziel) zurück, passend
    zu `licht_und_kamera`.
    """
    tan_x = 18.0 / brennweite * (1 - rand)
    tan_y = 18.0 / brennweite * hoehe / breite * (1 - rand)
    w, e = math.radians(richtung_grad), math.radians(neigung_grad)
    richtung = Vector((math.sin(w) * math.cos(e), -math.cos(w) * math.cos(e), math.sin(e)))  # Ziel → Kamera
    rechts = Vector((0, 0, 1)).cross(richtung).normalized()
    oben = richtung.cross(rechts).normalized()
    ziel = sum(punkte, Vector()) / len(punkte)
    abstand = 4.0
    for _ in range(4):
        def passt(D: float) -> bool:
            C = ziel + richtung * D
            for p in punkte:
                v = p - C
                tiefe = -v.dot(richtung)
                if tiefe <= 0.05:
                    return False
                if abs(v.dot(rechts)) / tiefe > tan_x or abs(v.dot(oben)) / tiefe > tan_y:
                    return False
            return True

        lo, hi = 0.5, 30.0
        for _ in range(40):
            mid = (lo + hi) / 2
            if passt(mid):
                hi = mid
            else:
                lo = mid
        abstand = hi
        # Ziel auf die Mitte der Abbildung schieben
        C = ziel + richtung * abstand
        xs, ys = [], []
        for p in punkte:
            v = p - C
            tiefe = -v.dot(richtung)
            xs.append(v.dot(rechts) / tiefe)
            ys.append(v.dot(oben) / tiefe)
        cx, cy = (max(xs) + min(xs)) / 2, (max(ys) + min(ys)) / 2
        ziel = ziel + rechts * cx * abstand + oben * cy * abstand
    return ziel, abstand * math.cos(e), abstand * math.sin(e)


def boden() -> None:
    """Unsichtbarer Boden, der nur einen weichen Schatten fängt."""
    bpy.ops.mesh.primitive_plane_add(size=20, location=(0, 0, 0))
    ebene = bpy.context.active_object
    ebene.name = "Boden"
    ebene.is_shadow_catcher = True
