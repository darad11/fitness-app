"""Gelenke steuern (Pilot 3D, D-402).

Beine und Arme folgen Zielpunkten über inverse Kinematik (IK): Fußgelenk und Handgelenk sitzen
dort, wo die Übung sie verlangt, Knie und Ellbogen zeigen zu einem Richtungspunkt. Becken und
Rumpf werden direkt gedreht (Hüftbeuge, Neigung). Füße bleiben flach auf dem Boden, die Finger
schließen sich um den Griff.
"""
from __future__ import annotations

import math

import bpy
from mathutils import Matrix, Quaternion, Vector


def leer(name: str, ort: Vector = Vector()) -> bpy.types.Object:
    obj = bpy.data.objects.new(name, None)
    obj.empty_display_size = 0.03
    bpy.context.scene.collection.objects.link(obj)
    obj.location = ort
    return obj


class Steuerung:
    def __init__(self, skelett: bpy.types.Object):
        self.sk = skelett
        self.ziele: dict[str, bpy.types.Object] = {}
        for pb in skelett.pose.bones:
            pb.rotation_mode = "QUATERNION"
        bpy.context.view_layer.update()

    def welt(self, knochen: str, ende: bool = False) -> Vector:
        bpy.context.view_layer.update()
        pb = self.sk.pose.bones[knochen]
        return self.sk.matrix_world @ (pb.tail if ende else pb.head)

    def ik(self, knochen: str, kette: int, name: str, pol_name: str, pol_winkel: float = 0.0) -> None:
        ziel = leer(name, self.welt(knochen, ende=True))
        pol = leer(pol_name)
        c = self.sk.pose.bones[knochen].constraints.new("IK")
        c.target = ziel
        c.pole_target = pol
        c.pole_angle = pol_winkel
        c.chain_count = kette
        c.use_stretch = False
        c.iterations = 800
        self.ziele[name] = ziel
        self.ziele[pol_name] = pol

    def flach(self, knochen: str) -> None:
        """Knochen behält seine Richtung in der Welt aus der Grundhaltung (Fuß flach)."""
        bpy.context.view_layer.update()
        pb = self.sk.pose.bones[knochen]
        # Richtung im Stand (ohne Drehung des Skeletts): Fuß flach auf dem Boden, auch im Liegen.
        rest = pb.bone.matrix_local
        halter = leer(knochen + "_Halter")
        halter.rotation_mode = "QUATERNION"
        halter.rotation_quaternion = rest.to_quaternion()
        c = pb.constraints.new("COPY_ROTATION")
        c.target = halter
        self.ziele[knochen + "_Halter"] = halter

    def punkt(self, knochen: str, ort_rest: Vector) -> "callable":
        """Punkt, der am Knochen hängt: gibt eine Funktion zurück, die seine Lage in der Welt liefert."""
        pb = self.sk.pose.bones[knochen]
        versatz = pb.bone.matrix_local.inverted() @ ort_rest

        def lage() -> Vector:
            bpy.context.view_layer.update()
            return self.sk.matrix_world @ (pb.matrix @ versatz)

        return lage

    def drehe(self, knochen: str, achse: Vector, grad: float) -> None:
        """Dreht einen Knochen um eine Achse im Raum des Skeletts (Grundhaltung)."""
        pb = self.sk.pose.bones[knochen]
        rest = pb.bone.matrix_local.to_quaternion()
        q = Quaternion(achse, math.radians(grad))
        pb.rotation_quaternion = rest.inverted() @ q @ rest

    def becken(self, verschiebung: Vector, neigung: float, drehpunkt: Vector) -> None:
        """Becken („root“) um `neigung` Grad um x neigen (positiv = Oberkörper nach vorn) und
        verschieben; gedreht wird um `drehpunkt` (Raum des Skeletts, Grundhaltung)."""
        pb = self.sk.pose.bones["root"]
        rest = pb.bone.matrix_local
        kopf = rest.translation
        q = Quaternion(Vector((1, 0, 0)), math.radians(neigung))
        pb.rotation_quaternion = rest.to_quaternion().inverted() @ q @ rest.to_quaternion()
        ausgleich = (drehpunkt - kopf) - q @ (drehpunkt - kopf)
        welt = verschiebung + ausgleich
        pb.location = rest.to_quaternion().inverted() @ welt

    def faust(self, seite: str, grad: float = 70.0) -> None:
        """Finger um den Griff schließen: jedes Glied um seine eigene x-Achse."""
        for finger in range(2, 6):
            for glied, anteil in ((1, 0.8), (2, 1.0), (3, 0.7)):
                name = f"finger{finger}-{glied}.{seite}"
                pb = self.sk.pose.bones.get(name)
                if pb:
                    pb.rotation_quaternion = Quaternion(Vector((1, 0, 0)), math.radians(grad * anteil))
        for glied in (2, 3):
            pb = self.sk.pose.bones.get(f"finger1-{glied}.{seite}")
            if pb:
                pb.rotation_quaternion = Quaternion(Vector((1, 0, 0)), math.radians(grad * 0.5))


def weich(t: float) -> float:
    """Weiche Beschleunigung und Abbremsung (Kosinus)."""
    return 0.5 - 0.5 * math.cos(math.pi * max(0.0, min(1.0, t)))


def ablauf(bild: int, bilder: int, pause: float = 0.1) -> float:
    """Phase 0 (Ausgang) bis 1 (Endposition) und zurück; kurze Pausen an beiden Endpunkten.

    Aufteilung einer Wiederholung: Pause, Weg hin, Pause, Weg zurück. Der Weg zurück (konzentrisch)
    ist etwas kürzer als der Weg hin. Bild `bilder` entspricht wieder Bild 0: nahtlose Schleife.
    """
    t = (bild % bilder) / bilder
    p = pause / 2
    hin = 0.5 - 2 * p + 0.04
    if t < p:
        return 0.0
    if t < p + hin:
        return weich((t - p) / hin)
    if t < 2 * p + hin + p:
        return 1.0
    zurueck_start = 3 * p + hin
    return 1.0 - weich((t - zurueck_start) / (1.0 - p - zurueck_start))


def mische(a: Vector, b: Vector, t: float) -> Vector:
    return a.lerp(b, t)


__all__ = ["Steuerung", "ablauf", "mische", "leer", "weich", "Matrix"]
