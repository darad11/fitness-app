"""Die drei Übungen des Piloten als Posen im Code (D-402).

Jede Übung baut ihre Szene (Figur, Geräte, Kamera, Zonen) und setzt je Phase p (0 = Ausgang,
1 = Endposition) die Ziele der Gelenke. Gelenkwinkel ergeben sich aus der IK; geprüft wird in
`render.py --pruefen` (Kniewinkel, Hüftwinkel, Lage der Stange).
"""
from __future__ import annotations

import math

import bpy
from mathutils import Euler, Vector

import figur
import geraete
import zonen
from haltung import Steuerung, leer, mische

AUF = Vector((0, 0, 1))


def _ruecken_y(koerper: bpy.types.Object, z: float, breite: float = 0.04) -> float:
    """Hinterste Stelle des Körpers (größtes y) in der Grundhaltung auf Höhe z (Welt)."""
    versatz = koerper.parent.location.z
    werte = [v.co.y for v in koerper.data.vertices if abs(v.co.x) < breite and abs(v.co.z + versatz - z) < 0.015]
    return max(werte)


class Uebung:
    name = ""
    haupt: list[str] = []
    mit: list[str] = []
    kamera = (70.0, 4.6, 0.4, Vector((0, 0, 0.9)))

    def bauen(self) -> None:
        self.koerper, self.skelett = figur.baue_figur()
        bpy.context.view_layer.update()
        self.st = Steuerung(self.skelett)
        zonen.setze_zonen(self.koerper, self.skelett, self.haupt, self.mit)

    def setzen(self, p: float) -> None:
        raise NotImplementedError

    def pruefwerte(self) -> dict[str, float]:
        return {}

    # Hilfen für die Prüfung: Winkel zwischen zwei Knochen in Grad (180 = gestreckt).
    def winkel(self, a: str, b: str) -> float:
        bpy.context.view_layer.update()
        pa = self.skelett.pose.bones[a]
        pb = self.skelett.pose.bones[b]
        va = (pa.head - pa.tail).normalized()
        vb = (pb.tail - pb.head).normalized()
        return math.degrees(va.angle(vb))


class Kniebeuge(Uebung):
    """Kniebeuge mit Langhantel, hohe Stangenposition auf dem oberen Trapez.

    Ausgang: aufrecht, Knie und Hüfte gestreckt. Endposition: Hüftgelenk etwa auf Kniehöhe
    (Oberschenkel waagrecht), Rumpf rund 40° nach vorn geneigt, Rücken gerade, Knie über den
    Zehen, Fersen am Boden. Die Stange bleibt über der Fußmitte.
    """

    name = "kniebeuge"
    haupt = ["quads", "glutes"]
    mit = ["adductors", "lower_back"]
    kamera = (140.0, 3.5, 0.5, Vector((0, 0.1, 0.82)))

    def bauen(self) -> None:
        super().bauen()
        st = self.st
        for s, x in (("L", 1), ("R", -1)):
            st.ik(f"lowerleg02.{s}", 4, f"Fuss.{s}", f"Knie.{s}", math.radians(-90))
            st.flach(f"foot.{s}")
            st.ik(f"lowerarm02.{s}", 4, f"Hand.{s}", f"Ellbogen.{s}", math.radians(90))
            st.faust(s)
            halter = st.ziele[f"foot.{s}_Halter"]
            halter.rotation_quaternion = (Euler((0, 0, x * math.radians(12))).to_quaternion()
                                          @ halter.rotation_quaternion)
        self.fuss = {s: st.ziele[f"Fuss.{s}"].location.copy() for s in "LR"}
        self.mitte_fuss_y = sum(v.y for v in self.fuss.values()) / 2 - 0.07
        # Stange auf dem oberen Trapez, hängt am oberen Rücken (Knochen spine01).
        z = 1.375
        y = _ruecken_y(self.koerper, z) + 0.016
        self.stange = geraete.langhantel([(0.45, 0.035), (0.45, 0.035)])
        self.stange.location = (0, y, z)
        bpy.context.view_layer.update()
        welt = self.stange.matrix_world.copy()
        self.stange.parent = self.skelett
        self.stange.parent_type = "BONE"
        self.stange.parent_bone = "spine01"
        bpy.context.view_layer.update()
        self.stange.matrix_world = welt
        for s, x in (("L", 1), ("R", -1)):
            hand = st.ziele[f"Hand.{s}"]
            hand.parent = self.stange
            hand.location = (x * 0.29, -0.015, -0.055)
        self.drehpunkt = self.skelett.data.bones["upperleg01.L"].head_local.copy()
        self.drehpunkt.x = 0

    def setzen(self, p: float) -> None:
        st = self.st
        tiefe = 0.45 * p
        neigung = 42.0 * p
        y = 0.0
        # Stange über die Fußmitte: Becken nach hinten schieben, bis die Stange darüber steht.
        for _ in range(4):
            st.becken(Vector((0, y, -tiefe)), neigung, self.drehpunkt)
            bpy.context.view_layer.update()
            fehler = self.stange.matrix_world.translation.y - self.mitte_fuss_y
            y -= fehler
        # Kopf in Verlängerung der Wirbelsäule, Blick leicht nach vorn unten.
        st.drehe("neck01", Vector((1, 0, 0)), -12.0 * p)
        for s, x in (("L", 1), ("R", -1)):
            knie = st.welt(f"lowerleg01.{s}")
            st.ziele[f"Knie.{s}"].location = knie + Vector((x * 0.12, -0.6, 0))
            schulter = st.welt(f"upperarm02.{s}")
            st.ziele[f"Ellbogen.{s}"].location = schulter + Vector((x * 0.25, 0.5, -0.5))

    def pruefwerte(self) -> dict[str, float]:
        bpy.context.view_layer.update()
        huefte = self.st.welt("upperleg01.L").z
        knie = self.st.welt("lowerleg01.L").z
        return {
            "Kniewinkel": self.winkel("upperleg02.L", "lowerleg01.L"),
            "Hüfte über Knie (cm)": (huefte - knie) * 100,
            "Stange vor Fußmitte (cm)": (self.mitte_fuss_y - self.stange.matrix_world.translation.y) * 100,
        }


def _vorn_punkt(koerper: bpy.types.Object, z_lokal: float, breite: float = 0.03) -> Vector:
    """Vorderste Stelle des Körpers (kleinstes y) auf Höhe z, Raum des Skeletts."""
    kandidaten = [v.co for v in koerper.data.vertices if abs(v.co.x) < breite and abs(v.co.z - z_lokal) < 0.012]
    return min(kandidaten, key=lambda c: c.y).copy()


def _ruecken_max(koerper: bpy.types.Object) -> float:
    """Größtes y des Rumpfs (Schulterblätter, Gesäß) im Raum des Skeletts."""
    return max(v.co.y for v in koerper.data.vertices if abs(v.co.x) < 0.15 and -0.1 < v.co.z < 0.55)


class Bankdruecken(Uebung):
    """Bankdrücken auf der Flachbank mit Langhantel.

    Rücken auf der Bank, Füße flach am Boden, Knie etwa 90°. Griff etwas breiter als die
    Schultern. Ausgang: Arme gestreckt, Stange über den Schultern. Endposition: Stange berührt
    die untere Brust, Ellbogen rund 50 bis 70° vom Rumpf. Die Stange läuft in einem leichten
    Bogen (unten über der Brust, oben über den Schultern).
    """

    name = "bankdruecken"
    haupt = ["chest"]
    mit = ["triceps", "front_delts"]
    kamera = (55.0, 3.4, 1.5, Vector((0, 0.05, 0.62)))

    def bauen(self) -> None:
        super().bauen()
        st = self.st
        ruecken = _ruecken_max(self.koerper)
        # Liegen: Skelett um x drehen (Blick nach oben, Kopf nach +y), Rücken auf das Polster (0,43 m).
        self.skelett.rotation_euler = Euler((-math.pi / 2, 0, 0))
        self.skelett.location = (0, -0.145, 0.43 + ruecken - 0.012)
        geraete.flachbank()
        bpy.context.view_layer.update()
        for s, x in (("L", 1), ("R", -1)):
            st.ik(f"lowerleg02.{s}", 4, f"Fuss.{s}", f"Knie.{s}", math.radians(-90))
            st.flach(f"foot.{s}")
            st.ziele[f"Fuss.{s}"].location = (x * 0.30, -0.47, 0.075)
            st.ziele[f"Knie.{s}"].location = (x * 0.4, -0.45, 1.5)
            st.ik(f"lowerarm02.{s}", 4, f"Hand.{s}", f"Ellbogen.{s}", math.radians(90))
            st.faust(s)
        brust = _vorn_punkt(self.koerper, 0.41)
        self.brust = st.punkt("spine02", brust)
        self.schulter = {s: st.punkt("upperarm01." + s, self.skelett.data.bones["upperarm01." + s].head_local)
                         for s in "LR"}
        self.stange = geraete.langhantel([(0.45, 0.035), (0.33, 0.03)])
        for s, x in (("L", 1), ("R", -1)):
            hand = st.ziele[f"Hand.{s}"]
            hand.parent = self.stange
            hand.location = (x * 0.31, 0.0, -0.045)

    def setzen(self, p: float) -> None:
        st = self.st
        schulter = (self.schulter["L"]() + self.schulter["R"]()) / 2
        oben = Vector((0, schulter.y + 0.01, schulter.z + 0.55))
        unten = self.brust() + Vector((0, 0, 0.018))
        # Bogen: waagrecht erst im letzten Teil, damit die Stange über der Brust landet.
        q = p * p * (3 - 2 * p)
        lage = Vector((0, oben.y + (unten.y - oben.y) * q, oben.z + (unten.z - oben.z) * p))
        self.stange.location = lage
        for s, x in (("L", 1), ("R", -1)):
            sch = self.schulter[s]()
            st.ziele[f"Ellbogen.{s}"].location = sch + Vector((x * 0.7, 0.02, -0.25))
        bpy.context.view_layer.update()

    def pruefwerte(self) -> dict[str, float]:
        bpy.context.view_layer.update()
        ellbogen = self.winkel("upperarm02.L", "lowerarm01.L")
        oberarm = (self.st.welt("upperarm02.L", ende=True) - self.st.welt("upperarm01.L")).normalized()
        rumpf = (self.st.welt("spine05") - self.st.welt("spine01")).normalized()
        return {
            "Ellbogenwinkel": ellbogen,
            "Oberarm zum Rumpf": math.degrees(oberarm.angle(rumpf)),
            "Kniewinkel": self.winkel("upperleg02.L", "lowerleg01.L"),
            "Stange über Brust (cm)": (self.stange.location.z - self.brust().z) * 100,
        }


class Latziehen(Uebung):
    """Latziehen am Kabel, breiter Obergriff, Stange vor dem Körper zur oberen Brust.

    Sitzend, Oberschenkel unter der Knierolle, Füße am Boden. Ausgang: Arme fast gestreckt
    über dem Kopf. Endposition: Stange an der oberen Brust, Ellbogen nach unten und leicht
    hinten, Oberkörper etwa 15° zurückgelehnt, Rücken gerade.
    """

    name = "latziehen"
    haupt = ["lats"]
    mit = ["biceps", "upper_back"]
    kamera = (148.0, 4.2, 0.3, Vector((0, -0.15, 1.05)))

    def bauen(self) -> None:
        super().bauen()
        st = self.st
        self.teile = geraete.latzug()
        bpy.context.view_layer.update()
        for s, x in (("L", 1), ("R", -1)):
            st.ik(f"lowerleg02.{s}", 4, f"Fuss.{s}", f"Knie.{s}", math.radians(-90))
            st.flach(f"foot.{s}")
            st.ziele[f"Fuss.{s}"].location = (x * 0.20, -0.50, 0.075)
            st.ziele[f"Knie.{s}"].location = (x * 0.25, -1.4, 0.7)
            st.ik(f"lowerarm02.{s}", 4, f"Hand.{s}", f"Ellbogen.{s}", math.radians(90))
            st.faust(s)
        brust = _vorn_punkt(self.koerper, 0.47)
        self.brust = st.punkt("spine01", brust)
        self.schulter = {s: st.punkt("upperarm01." + s, self.skelett.data.bones["upperarm01." + s].head_local)
                         for s in "LR"}
        self.drehpunkt = self.skelett.data.bones["upperleg01.L"].head_local.copy()
        self.drehpunkt.x = 0
        # Sitzen: Hüftgelenk 9 cm über der Sitzfläche (0,52 m), über der Mitte des Sitzes.
        huefte = self.skelett.matrix_world @ self.drehpunkt
        self.sitz = Vector((0, 0.04 - huefte.y, 0.61 - huefte.z))
        stange = self.teile["stange"]
        for s, x in (("L", 1), ("R", -1)):
            hand = st.ziele[f"Hand.{s}"]
            hand.parent = stange
            hand.location = (x * 0.47, 0.0, -0.06)

    def setzen(self, p: float) -> None:
        st = self.st
        st.becken(self.sitz, -6.0 - 12.0 * p, self.drehpunkt)
        bpy.context.view_layer.update()
        schulter = (self.schulter["L"]() + self.schulter["R"]()) / 2
        oben = Vector((0, -0.09, schulter.z + 0.47))
        unten = self.brust() + Vector((0, -0.05, 0.03))
        stange = self.teile["stange"]
        stange.location = oben.lerp(unten, p)
        for s, x in (("L", 1), ("R", -1)):
            sch = self.schulter[s]()
            st.ziele[f"Ellbogen.{s}"].location = sch + Vector((x * 0.6, 0.25, -0.5))
        rolle = self.teile["rolle"].location
        geraete.kabel("Kabel", Vector((rolle.x, rolle.y, rolle.z - 0.06)), stange.location + Vector((0, 0, 0.04)))
        geraete.kabel("Kabel2", Vector((rolle.x, rolle.y - 0.06, rolle.z)), Vector((0, -0.9, 2.13)))
        bpy.context.view_layer.update()

    def pruefwerte(self) -> dict[str, float]:
        return {
            "Ellbogenwinkel": self.winkel("upperarm02.L", "lowerarm01.L"),
            "Kniewinkel": self.winkel("upperleg02.L", "lowerleg01.L"),
            "Stange über Brust (cm)": (self.teile["stange"].location.z - self.brust().z) * 100,
        }


UEBUNGEN = {u.name: u for u in (Kniebeuge, Bankdruecken, Latziehen)}
