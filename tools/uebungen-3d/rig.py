"""Rig mit inverser Kinematik für die Übungsbilder (D-407).

Statt Gelenkwinkel einzeln zu setzen, rechnet das Rig jede Haltung aus Zielen:

- **Beine:** Zwei-Gelenk-IK von der Hüfte zum Fußgelenk. Das Knie liegt in der Ebene aus
  Hüfte, Fußgelenk und der Kniestellung (Richtung der Zehen), es kann nicht nach innen kippen.
  Der Fuß bleibt flach und fest am Boden („foot lock“), gedreht um die Fußstellung.
- **Arme:** Zwei-Gelenk-IK von der Schulter zum Handgelenk, Ellbogen zur Richtung des Pol-Ziels.
  Die Hand hängt am Gerät: Ihre Lage ergibt sich aus dem Griff (Stange in der Handfläche, quer zur
  Hand), nicht umgekehrt. Die Unterarmdrehung (Pronation) verteilt sich auf die zwei Segmente.
- **Finger:** Jedes Glied beugt sich um die Achse der Stange; die Winkel aller drei Gelenke werden
  so gesucht, dass die Finger die Stange umschließen, ohne sie zu durchdringen, die Spitzen rollen
  unter die Stange (D-440); die Beeren sinken wie die Handfläche etwas in die Stange ein (D-435).
  Der Daumen umgreift gegenläufig und liegt flach auf der Faust: Grundgelenk an der unteren
  Außenkante der Stange, Grund- und Endglied schräg über dem Rücken von Zeige- und Mittelfinger,
  die Kuppe am Mittelfinger, der Nagel nach außen (voller Griff nach dem Handfoto, D-440; davor
  D-423, D-425, D-435).
- **Rumpf:** Becken und Wirbelsäule als starre oder fein verteilte Drehungen um echte Gelenkpunkte.

Gerechnet wird mit Segment-Transformationen `G` (Grundhaltung → Haltung) im Raum des Skeletts; am
Ende werden daraus die lokalen Matrizen der Knochen. Kein Blender-IK-Löser, keine Zufallswinkel:
dieselben Ziele ergeben immer dieselbe Haltung.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field

import bpy
from mathutils import Matrix, Quaternion, Vector

X, Y, Z = Vector((1, 0, 0)), Vector((0, 1, 0)), Vector((0, 0, 1))
KONTAKT = -0.0008  # Finger berühren die Stange, Haut 0,8 mm eingedrückt
EINSINKEN = 0.009  # Stange sinkt in die Haut der Handfläche ein, m (D-430)
# Daumen über den Fingern (D-435): Die Spitze endet axial zwischen Zeige- und Mittelfinger (Anteil
# vom Zeige- zum Mittelfinger), die Beere liegt mit etwas Luft auf dem Fingerrücken; die Umgebung, in
# der Finger unter dem Daumen zählen, ist die halbe Daumenbreite
DAUMEN_QUER = 1.0  # Kuppe am Mittelfinger (Handfoto, D-440); bis D-439 0,45 zwischen Zeige- und Mittelfinger
DAUMEN_AUF_FINGER = -0.004  # Beere und Fingerrücken geben unter Druck nach: 4 mm ineinander
DAUMEN_AUF_STANGE = -0.004  # Beere auf der Stange eingedrückt wie die Fingerbeeren
DAUMEN_SEIT = 0.004  # Grundgelenk des Daumens axial außen neben dem Zeigefinger, m (D-440)
DAUMEN_BREITE = 0.006  # halbe Breite der Auflagefläche der Beere: nur direkt unter dem Daumen zählen Finger
# Fingerbeeren sinken wie die Handfläche in die Stange ein (D-435): Mit nur 0,8 mm lagen die
# Fingerknochen des Grundmodells (Beere 15 mm vom Knochen) 29 mm von der Stangenachse, die Finger
# rollten sich kaum und die Spitzen endeten oben auf der Stange, wo der Daumen liegen muss
FINGER_EINSINKEN = 0.004
FINGER_ENDGELENK = 76.0  # Endgelenk der Finger beugt sich bis dahin (Grad), die Spitze rollt unter die Stange (D-440)
DAUMEN_ABSTIEG = 0.25  # ein Daumenglied fällt höchstens 0,25 seiner Länge radial: kein Haken zurück zur Stange
DAUMEN_WINKEL = 6.0  # Winkelfenster (Grad) um den Daumen, in dem Finger unter ihm zählen


def senkrecht(v: Vector, achse: Vector) -> Vector:
    """Anteil von v senkrecht zur Achse, normiert."""
    a = achse.normalized()
    w = v - v.dot(a) * a
    return w.normalized() if w.length > 1e-9 else w


def rahmen(y: Vector, z: Vector) -> Matrix:
    """Orthonormale Basis (3 × 3) mit y entlang der ersten Richtung, z aus der zweiten."""
    yy = y.normalized()
    zz = senkrecht(z, yy)
    xx = yy.cross(zz)
    return Matrix((xx, yy, zz)).transposed()


def abbild(alt_y: Vector, alt_z: Vector, neu_y: Vector, neu_z: Vector) -> Matrix:
    """Drehung, die die Basis (alt_y, alt_z) auf (neu_y, neu_z) bringt."""
    return rahmen(neu_y, neu_z) @ rahmen(alt_y, alt_z).transposed()


def um_punkt(punkt: Vector, drehung: Matrix) -> Matrix:
    """Drehung (3 × 3) um einen Punkt als 4 × 4."""
    return Matrix.Translation(punkt) @ drehung.to_4x4() @ Matrix.Translation(-punkt)


def starr(von: Vector, nach: Vector, drehung: Matrix) -> Matrix:
    """Starre Abbildung: dreht um `von` und verschiebt `von` nach `nach`."""
    return Matrix.Translation(nach) @ drehung.to_4x4() @ Matrix.Translation(-von)


def achse_winkel(achse: Vector, grad: float) -> Matrix:
    return Quaternion(achse.normalized(), math.radians(grad)).to_matrix()


def winkel_um(a: Vector, b: Vector, achse: Vector) -> float:
    """Vorzeichenbehafteter Winkel (Grad) von a nach b um die Achse."""
    pa, pb = senkrecht(a, achse), senkrecht(b, achse)
    if pa.length < 1e-9 or pb.length < 1e-9:
        return 0.0
    return math.degrees(math.atan2(achse.normalized().dot(pa.cross(pb)), pa.dot(pb)))


def zwei_glieder(start: Vector, ziel: Vector, l1: float, l2: float, richtung: Vector):
    """Mittleres Gelenk einer Zwei-Glieder-Kette. Gibt (Gelenk, Ausweichrichtung, erreicht) zurück."""
    d_vec = ziel - start
    d = d_vec.length
    erreicht = d <= (l1 + l2) * 0.9999 and d >= abs(l1 - l2)
    d = min(max(d, abs(l1 - l2) + 1e-6), (l1 + l2) * 0.9999)
    u = d_vec.normalized()
    a = (l1 * l1 - l2 * l2 + d * d) / (2 * d)
    h = math.sqrt(max(l1 * l1 - a * a, 0.0))
    p = senkrecht(richtung, u)
    return start + u * a + p * h, p, erreicht


def gelenkkreis(S: Vector, W: Vector, l1: float, l2: float):
    """Kreis aller möglichen Lagen des mittleren Gelenks: Mitte, Radius, zwei Achsen."""
    d_vec = W - S
    d = min(max(d_vec.length, abs(l1 - l2) + 1e-6), (l1 + l2) * 0.9999)
    u = d_vec.normalized()
    a = (l1 * l1 - l2 * l2 + d * d) / (2 * d)
    h = math.sqrt(max(l1 * l1 - a * a, 0.0))
    e1 = senkrecht(Z if abs(u.dot(Z)) < 0.95 else X, u)
    e2 = u.cross(e1)
    return S + u * a, h, e1, e2


def ellbogen_zur_richtung(S: Vector, W: Vector, l1: float, l2: float, richtung: Vector) -> Vector:
    """Ellbogen so, dass der Unterarm (Ellbogen → Hand) möglichst in `richtung` zeigt.
    Geschlossene Lösung: eindeutig und stetig, ohne Suche und ohne Gedächtnis."""
    M, h, e1, e2 = gelenkkreis(S, W, l1, l2)
    # f·r = ((W - M) - h·(e1 cos φ + e2 sin φ))·r → maximal, wenn e(φ) entgegen r zeigt
    A, B = e1.dot(richtung), e2.dot(richtung)
    if abs(A) + abs(B) < 1e-9:
        return M + e1 * h
    phi = math.atan2(B, A) + math.pi
    return M + (e1 * math.cos(phi) + e2 * math.sin(phi)) * h


@dataclass
class Griff:
    """Lage der Stange in der Hand (Grundhaltung). Achse quer zur Hand entlang der Knöchellinie."""

    mitte: Vector  # Mittelpunkt der Stange in der Grundhaltung, Raum des Skeletts
    achse: Vector  # Richtung Zeigefinger → kleiner Finger
    handflaeche: Vector  # Normale der Handfläche (zur Stange hin)
    laengs: Vector  # Handgelenk → Fingeransatz
    radius: float
    finger: dict[str, list[float]] = field(default_factory=dict)  # Beugewinkel je Glied


class Rig:
    def __init__(self, skelett: bpy.types.Object, koerper: bpy.types.Object):
        self.sk = skelett
        self.koerper = koerper
        self.knochen = skelett.data.bones
        self.ruhe = {b.name: b.matrix_local.copy() for b in self.knochen}
        self.kopf = {b.name: b.head_local.copy() for b in self.knochen}
        self.ende = {b.name: b.tail_local.copy() for b in self.knochen}
        self.reihe: list[str] = []

        def tiefe(b):
            self.reihe.append(b.name)
            for c in b.children:
                tiefe(c)

        for b in self.knochen:
            if b.parent is None:
                tiefe(b)
        self.G: dict[str, Matrix] = {}
        self.versatz = skelett.location.copy()
        self.meldungen: list[str] = []
        # Objekte, die starr an einem Knochen hängen: (Objekt, Knochen, Lage in der Grundhaltung, Raum
        # des Skeletts); `anwenden` setzt ihre Weltlage je Haltung (Leerobjekt „Hals“, D-422)
        self.folger: list[tuple] = []
        self._hand = self._handdaten()
        self._daumen: dict[str, tuple] = {}

    # ------------------------------------------------------------------ Grundlagen

    def welt(self, p: Vector) -> Vector:
        return p + self.versatz

    def lokal(self, p: Vector) -> Vector:
        return p - self.versatz

    def zuruecksetzen(self) -> None:
        self.G = {}
        self.meldungen = []

    def g(self, name: str) -> Matrix:
        b = self.knochen[name]
        while b is not None:
            if b.name in self.G:
                return self.G[b.name]
            b = b.parent
        return Matrix.Identity(4)

    def setze(self, name: str, G: Matrix) -> None:
        self.G[name] = G

    def dreh(self, name: str, drehung: Matrix) -> None:
        """Vorwärtskinematik: Knochen relativ zum Elternteil um seinen Kopf drehen (Achsen der
        Grundhaltung)."""
        eltern = self.knochen[name].parent
        Gp = self.g(eltern.name) if eltern else Matrix.Identity(4)
        self.G[name] = Gp @ um_punkt(self.kopf[name], drehung)

    def punkt(self, name: str, p_ruhe: Vector) -> Vector:
        """Lage eines Punkts der Grundhaltung, der am Knochen hängt (Raum des Skeletts)."""
        return self.g(name) @ p_ruhe

    def anwenden(self) -> None:
        for name in self.reihe:
            b = self.knochen[name]
            pose = self.g(name) @ self.ruhe[name]
            if b.parent is not None:
                eltern = self.g(b.parent.name) @ self.ruhe[b.parent.name]
                rel = self.ruhe[b.parent.name].inverted() @ self.ruhe[name]
                basis = rel.inverted() @ eltern.inverted() @ pose
            else:
                basis = self.ruhe[name].inverted() @ pose
            self.sk.pose.bones[name].matrix_basis = basis
        for obj, knochen, lage in self.folger:
            obj.matrix_world = self.sk.matrix_world @ self.g(knochen) @ lage
        bpy.context.view_layer.update()

    # ------------------------------------------------------------------ Beine

    def bein(self, seite: str, knoechel: Vector, knie_richtung: Vector, fuss_grad: float) -> dict:
        """Fuß flach am Boden, um `fuss_grad` nach außen gedreht, Fußgelenk bei `knoechel`.
        Das Knie zeigt in `knie_richtung` (in der Regel die Zehenrichtung)."""
        s = seite
        H0, K0, A0 = self.kopf["upperleg01." + s], self.kopf["lowerleg01." + s], self.kopf["foot." + s]
        H = self.punkt("pelvis." + s, H0)
        l1, l2 = (K0 - H0).length, (A0 - K0).length
        K, p, ok = zwei_glieder(H, knoechel, l1, l2, knie_richtung)
        if not ok:
            self.meldungen.append(f"Bein {s}: Fußgelenk nicht erreichbar")
        vorn = -Y
        R_ober = abbild(K0 - H0, vorn, K - H, p)
        G_ober = starr(H0, H, R_ober)
        self.setze("upperleg01." + s, G_ober)
        self.setze("upperleg02." + s, G_ober)
        R_unter = abbild(A0 - K0, vorn, knoechel - K, p)
        G_unter = starr(K0, K, R_unter)
        self.setze("lowerleg01." + s, G_unter)
        self.setze("lowerleg02." + s, G_unter)
        drehung = achse_winkel(Z, fuss_grad if s == "L" else -fuss_grad)
        self.setze("foot." + s, starr(A0, knoechel, drehung))
        return {"huefte": H, "knie": K, "knoechel": knoechel, "richtung": p}

    # ------------------------------------------------------------------ Hände und Arme

    def armhebung(self, u: Vector) -> float:
        """Winkel des Oberarms zur Längsachse des Rumpfs nach unten (0 = hängend, 90 = waagrecht nach
        vorn oder zur Seite, 180 = über dem Kopf)."""
        unten = self.g("spine01").to_3x3() @ Vector((0, 0, -1))
        return math.degrees(u.angle(unten))

    def _schulterhilfe(self, s: str, S0: Vector, S: Vector, R_ober: Matrix, u: Vector) -> None:
        """Hilfsknochen `achsel` (Haut an Brust und Achsel, `figur.schulter_gewichte`): bis 110°
        Armhebung nimmt er die halbe Drehung des Oberarms mit, bis 160° gleitend die ganze. Halb
        glättet die Achselfalte beim Drücken nach vorn; über dem Kopf (Latziehen oben) zöge die
        halbe Drehung die Brusthaut in Falten, dort verformt die Haut wieder genau wie ohne
        Hilfsknochen (D-413)."""
        if "achsel." + s not in self.knochen:
            return
        hebung = self.armhebung(u)
        t = min(1.0, max(0.0, (hebung - 110.0) / 50.0))
        anteil = 0.5 + 0.5 * t * t * (3 - 2 * t)
        R_eltern = self.g("clavicle." + s).to_3x3()
        q = R_eltern.to_quaternion().slerp(R_ober.to_quaternion(), anteil)
        self.setze("achsel." + s, starr(S0, S, q.to_matrix()))

    def _handdaten(self) -> dict[str, dict]:
        daten = {}
        k = self.koerper
        for s in "LR":
            W0 = self.kopf["wrist." + s]
            iM, mM, lM = self.kopf["finger2-1." + s], self.kopf["finger3-1." + s], self.kopf["finger5-1." + s]
            n = (iM - W0).cross(lM - W0).normalized()
            if (self.ende["finger1-3." + s] - W0).dot(n) < 0:
                n = -n
            achse = (lM - iM).normalized()
            n = senkrecht(n, achse)
            laengs = senkrecht(mM - W0, achse)
            namen = [f"metacarpal{i}.{s}" for i in range(1, 5)]
            idx = {k.vertex_groups[nm].index for nm in namen}
            L = (mM - W0).length
            proben = []
            for v in k.data.vertices:
                w = sum(g.weight for g in v.groups if g.group in idx)
                if w < 0.5:
                    continue
                rel = v.co - W0
                t = rel.dot(laengs) / L
                proben.append((t, rel.dot(n), rel.dot(achse)))
            quer = ((iM + lM) / 2 - W0).dot(achse)
            daten[s] = {"W0": W0, "n": n, "achse": achse, "laengs": laengs, "L": L, "proben": proben, "quer": quer}
        return daten

    def handdaten(self, seite: str) -> dict:
        """Achsen der Hand in der Grundhaltung: Handgelenk W0, Handflächennormale n, Knöchelachse
        achse, Längsachse laengs."""
        return self._hand[seite]

    def handflaeche(self, seite: str, t: float) -> Vector:
        """Punkt auf der Haut der Handfläche bei Anteil t (0 Handgelenk, 1 Fingeransatz), mittig."""
        d = self._hand[seite]
        nahe = [p for p in d["proben"] if abs(p[0] - t) < 0.08 and abs(p[2] - d["quer"]) < 0.02]
        tiefe = max(p[1] for p in nahe) if nahe else 0.015
        return d["W0"] + d["laengs"] * (t * d["L"]) + d["achse"] * d["quer"] + d["n"] * tiefe

    def griff(self, seite: str, t: float, radius: float, daumen: bool | str = True, schraeg: float = 0.0,
              einsinken: float = EINSINKEN) -> Griff:
        """Griff um eine Stange mit `radius`, quer in der Handfläche bei Anteil t (0 Handgelenk, 1
        Fingeransatz). `schraeg` (Grad) legt die Stange schräg in die Hand (zur Kleinfingerseite
        tiefer), wie bei breiten Griffen, damit Hand und Unterarm in einer Linie bleiben.

        Die Stange liegt in der Hand (D-430): Sie sinkt `einsinken` in die Haut der Handfläche ein,
        wie Ballen und Hohlhand unter Last nachgeben; was von der Haut in der Stange liegt, ist nicht
        zu sehen. Bis D-429 wurde die Stange so weit von der Handfläche weggeschoben, dass kein Punkt
        der Hand mehr als 2,5 mm in sie ragte; damit lag sie auf den Ballen, 4,8 cm über den
        Mittelhandknochen, die Finger kamen nicht um sie herum und rollten als Faust vor ihr ein.
        Geprüft wird nur, dass die Haut nicht auf der anderen Seite aus der Stange herausragt.

        `daumen`: True (oder "ueber") legt den Daumen flach über die Finger (D-440, alle drei
        Pilot-Übungen); "ring" schließt ihn als Ring in seiner Querebene (D-425, bis D-439 beim
        Latziehen); False lässt ihn weg."""
        d = self._hand[seite]
        achse = d["achse"]
        if schraeg:
            achse = achse_winkel(d["n"], schraeg if seite == "L" else -schraeg) @ achse
        mitte = self.handflaeche(seite, t) + d["n"] * (radius - einsinken)
        k = self.koerper
        hand = {k.vertex_groups[n].index for n in
                [f"metacarpal{i}.{seite}" for i in range(1, 5)] + [f"wrist.{seite}", f"finger1-1.{seite}"]}
        punkte = [v.co for v in k.data.vertices if sum(gg.weight for gg in v.groups if gg.group in hand) > 0.4]
        # Haut darf nicht durch die Stange hindurch auf der Gegenseite erscheinen: Punkte der
        # Handfläche in der Nähe der Achse bleiben unter ihr (Abstand längs n höchstens Radius − 3 mm)
        for _ in range(6):
            hoechste = max(((p - mitte).dot(d["n"]) for p in punkte
                            if abs((p - mitte).dot(achse)) < 0.05 and abs((p - mitte).dot(d["laengs"])) < radius), default=-1.0)
            if hoechste <= radius - 0.003:
                break
            mitte = mitte + d["n"] * (hoechste - (radius - 0.003))
        g = Griff(mitte, achse, d["n"], d["laengs"], radius)
        # Fingerdicke (Knochen bis Haut der Beugeseite) als Startwert; danach am verformten Netz
        # nachgemessen und angepasst, bis jeder Finger die Stange berührt (Haut 0,8 mm eingedrückt).
        dicke = {"finger2": 0.0085, "finger3": 0.0085, "finger4": 0.0085, "finger5": 0.0065}
        ring = daumen == "ring"
        if ring:
            dicke["finger1"] = 0.0125
        kontakt = -FINGER_EINSINKEN

        def soll(f: str) -> float:
            return KONTAKT if f == "finger1" else kontakt

        for runde in range(4):
            for f in ("finger2", "finger3", "finger4", "finger5"):
                g.finger[f] = self._finger_wickeln(seite, f, g, dicke[f])
            if ring:
                g.finger["finger1"] = self._daumen_ring(seite, g, dicke["finger1"])
            elif daumen:
                # Daumen über den Fingern (D-435): Beere aus dem Netz gemessen, keine Suche am Kontakt
                g.finger["finger1"] = self._daumen_wickeln(seite, g, self._fingerhuelle(seite, g))
            abstand = self._kontakt(seite, g)
            g.finger["_abstand"] = dict(abstand)
            if runde == 3 or all(abs(a - soll(f)) < 0.0004 for f, a in abstand.items() if ring or f != "finger1"):
                break
            for f, a in abstand.items():
                if f == "finger1":
                    if ring:
                        dicke[f] = min(0.018, max(0.008, dicke[f] - (a - KONTAKT)))  # Beere 8 bis 18 mm vom Knochen
                else:
                    dicke[f] = max(0.002, dicke[f] - (a - kontakt))
        self.zuruecksetzen()
        self.anwenden()
        return g

    def _verformt(self) -> list[Vector]:
        """Eckpunkte des verformten Körpers (Raum des Skeletts), ohne Glättung."""
        sub = self.koerper.modifiers.get("Glatt")
        if sub:
            sub.show_viewport = False
        deps = bpy.context.evaluated_depsgraph_get()
        obj = self.koerper.evaluated_get(deps)
        mesh = obj.to_mesh()
        pkte = [v.co.copy() for v in mesh.vertices]
        obj.to_mesh_clear()
        if sub:
            sub.show_viewport = True
        return pkte

    def _kontakt(self, seite: str, g: Griff) -> dict[str, float]:
        """Geringster Abstand (m) jedes Fingers zur Stangenoberfläche, gemessen am verformten Netz
        mit gebeugten Fingern und Hand in Grundhaltung (negativ = Haut eingedrückt)."""
        self.zuruecksetzen()
        self.finger_setzen(seite, g, Matrix.Identity(4))
        self.anwenden()
        netz = self._verformt()
        k = self.koerper
        namen = {gr.index: gr.name for gr in k.vertex_groups}
        # Daumenglieder in der gebeugten Lage: Nur Haut bis 16 mm neben dem Knochen zählt als Daumen
        # (Beere und Rücken des Glieds); Ballen und Schwimmhaut hängen zwar am Daumen, liegen aber
        # weit vom Knochen und trieben sonst die Daumendicke auf das Doppelte (D-425)
        glieder = {}
        for i in (2, 3):
            name = f"finger1-{i}.{seite}"
            if name in self.knochen:
                glieder[str(i)] = (self.punkt(name, self.kopf[name]), self.punkt(name, self.ende[name]))

        def nahe_am_glied(p: Vector, glied: str) -> bool:
            a, b = glieder[glied]
            d = b - a
            t = max(0.0, min(1.0, (p - a).dot(d) / d.length_squared))
            return (p - (a + d * t)).length < 0.016

        erg: dict[str, float] = {}
        for v, p in zip(k.data.vertices, netz):
            for gg in v.groups:
                n = namen[gg.group]
                if gg.weight <= 0.5 or not (n.startswith("finger") and n.endswith("." + seite)):
                    continue
                f, glied = n.split(".")[0].split("-")
                if f not in g.finger or (f == "finger1" and glied == "1"):  # Daumenballen gehört zur Handfläche
                    continue
                if f == "finger1" and not nahe_am_glied(p, glied):
                    continue
                a = self._abstand_achse(p, g.mitte, g.achse) - g.radius
                erg[f] = min(erg.get(f, 1.0), a)
        return erg

    def _kette(self, seite: str, f: str) -> list[tuple[Vector, Vector]]:
        return [(self.kopf[f"{f}-{i}.{seite}"], self.ende[f"{f}-{i}.{seite}"]) for i in (1, 2, 3)]

    @staticmethod
    def _abstand_achse(p: Vector, mitte: Vector, achse: Vector) -> float:
        r = p - mitte
        return (r - r.dot(achse) * achse).length

    def _spreizung(self, seite: str, f: str, g: Griff, achse: Vector) -> Matrix:
        """Drehung um die Handflächennormale, die den Finger quer zur Stange stellt (Finger im
        Griff parallel statt gespreizt)."""
        kopf, ende = self._kette(seite, f)[0]
        d = ende - kopf
        ziel = senkrecht(d, g.achse)
        return achse_winkel(g.handflaeche, winkel_um(d, ziel, g.handflaeche))

    def _finger_wickeln(self, seite: str, f: str, g: Griff, dicke: float) -> list[float]:
        """Beugewinkel (Grad) der drei Glieder. Jedes Glied beugt sich um die Stangenachse; gesucht
        werden Grund-, Mittel- und Endgelenk so, dass Mittelgelenk, Endgelenk und Spitze auf dem Kreis
        um die Stange liegen (Radius plus Fingerdicke) und kein Punkt des Fingers in die Stange ragt:
        so wickelt sich der Finger um die Stange, ohne sie zu durchdringen. Bis D-439 folgte das
        Endgelenk dem Mittelgelenk fest (0,7 : 1); damit blieben die Spitzen 17 mm über der Stange
        stehen, genau dort, wo der Daumen über die Finger läuft. Jetzt wird das Endgelenk mit gesucht
        (bis `FINGER_ENDGELENK` Grad), die Spitze rollt unter die Stange (D-440). Gerechnet wird das
        ganze Raster der drei Winkel auf einmal (numpy)."""
        import numpy as np

        kette = self._kette(seite, f)
        R = g.radius + dicke
        achse = g.achse if g.achse.dot(g.laengs.cross(g.handflaeche)) > 0 else -g.achse
        g.finger["_achse_" + seite] = achse
        Rs = self._spreizung(seite, f, g, achse)
        g.finger["_spreiz_" + f + seite] = Rs
        u = np.array(achse, dtype=float)
        mitte = np.array(g.mitte, dtype=float)
        glieder = [np.array(Rs @ (ende - kopf), dtype=float) for kopf, ende in kette]
        a1 = np.arange(0.0, 101.0, 2.0)
        a2 = np.arange(0.0, 111.0, 2.0)
        a3 = np.arange(0.0, FINGER_ENDGELENK + 1.0, 2.0)
        A1, A2, A3 = np.meshgrid(a1, a2, a3, indexing="ij")
        summen = [np.radians(A1), np.radians(A1 + A2), np.radians(A1 + A2 + A3)]

        def gedreht(d: np.ndarray, t: np.ndarray) -> np.ndarray:
            """Rodrigues: Richtung d um die Achse u gedreht, Winkel t je Rasterpunkt."""
            c, s = np.cos(t)[..., None], np.sin(t)[..., None]
            return d * c + np.cross(u, d) * s + u * float(u @ d) * (1.0 - c)

        def radius(q: np.ndarray) -> np.ndarray:
            r = q - mitte
            return np.linalg.norm(r - (r @ u)[..., None] * u, axis=-1)

        kosten = np.zeros(A1.shape)
        p = np.broadcast_to(np.array(kette[0][0], dtype=float), A1.shape + (3,))
        for d, t in zip(glieder, summen):
            v = gedreht(d, t)
            halb = p + v * 0.5
            p = p + v
            for q, gelenk in ((halb, False), (p, True)):
                r = radius(q)
                kosten = kosten + np.where(r < R - 0.0015, 1e6 * (R - 0.0015 - r) ** 2, 0.0)
                if gelenk:  # Mittelgelenk, Endgelenk, Spitze: auf der Stange
                    kosten = kosten + 1e4 * (r - (R + 0.0005)) ** 2
        best = np.unravel_index(int(np.argmin(kosten)), kosten.shape)
        return [float(a1[best[0]]), float(a2[best[1]]), float(a3[best[2]])]

    @staticmethod
    def _fingerpunkte(kette, achse: Vector, winkel, Rs: Matrix | None = None) -> list[Vector]:
        """Punkte entlang des gebeugten Fingers (Gelenke und Mitten der Glieder)."""
        Rs = Rs or Matrix.Identity(3)
        pkte = [kette[0][0]]
        p = kette[0][0]
        summe = 0.0
        for (kopf, ende), w in zip(kette, winkel):
            summe += w
            d = achse_winkel(achse, summe) @ (Rs @ (ende - kopf))
            pkte.append(p + d * 0.5)
            p = p + d
            pkte.append(p)
        return pkte

    def _stangenrahmen(self, seite: str, g: Griff):
        """Zylinderkoordinaten um die Stange in der Grundhaltung der Hand: axial entlang der
        Wickelachse der Finger, Winkel 0 zur Handfläche hin, positiv in Wickelrichtung der Finger."""
        achse = g.finger.get("_achse_" + seite, g.achse)
        e1 = senkrecht(-g.handflaeche, achse)
        e2 = achse.cross(e1)

        def zyl(p: Vector) -> tuple[float, float, float]:
            r = p - g.mitte
            a = r.dot(achse)
            rad = r - a * achse
            return a, rad.length, math.atan2(rad.dot(e2), rad.dot(e1))

        def punkt(a: float, r: float, phi: float) -> Vector:
            return g.mitte + achse * a + (e1 * math.cos(phi) + e2 * math.sin(phi)) * r

        return achse, zyl, punkt

    def _fingerhuelle(self, seite: str, g: Griff) -> list[tuple[float, float, float]]:
        """Haut von Zeige- und Mittelfinger im Griff ohne Daumen, als (axial, Radius, Winkel) um die
        Stange: die Hülle, über die der Daumen hinwegläuft (D-435)."""
        ohne = Griff(g.mitte, g.achse, g.handflaeche, g.laengs, g.radius)
        ohne.finger = {k: v for k, v in g.finger.items() if k != "finger1"}
        self.zuruecksetzen()
        self.finger_setzen(seite, ohne, Matrix.Identity(4))
        self.anwenden()
        netz = self._verformt()
        _, zyl, _ = self._stangenrahmen(seite, g)
        k = self.koerper
        namen = {gr.index: gr.name for gr in k.vertex_groups}
        huelle = []
        for v, p in zip(k.data.vertices, netz):
            for gg in v.groups:
                n = namen[gg.group]
                if gg.weight > 0.5 and n.endswith("." + seite) and n.startswith(("finger2-", "finger3-")):
                    huelle.append(zyl(p))
                    break
        return huelle

    def _daumenbeere(self, seite: str) -> tuple[Vector, dict[str, float]]:
        """Richtung der Daumenbeere in der Grundhaltung und Dicke der Beere je Daumenglied (m), aus
        dem Querschnitt der Haut in der Mitte des Endglieds (Hauptachsen; die Beere ist die dickere
        Seite der dünnen Achse). Der Daumen liegt in der Grundhaltung um etwa 80° gegen die Handfläche
        gedreht: Seine Beere zeigt zur Handmitte, nicht wie die Fingerbeeren zur Handfläche. Bis D-439
        galt die Handflächennormale als Beerenrichtung; so lag der Daumen im Griff um seine Achse
        verdreht mit der breiten Seite (23 mm) zur Stange und nach außen, und als Beere wurde seine
        halbe Breite gemessen (12,6 statt 9,4 mm). Jetzt zeigt die Beere zur Stangenachse, der Nagel
        nach außen (D-440)."""
        if seite in self._daumen:
            return self._daumen[seite]
        import numpy as np

        k = self.koerper

        def punkte(glied: str, gewicht: float, grenze: float):
            a, b = self.kopf[f"{glied}.{seite}"], self.ende[f"{glied}.{seite}"]
            ax = np.array((b - a).normalized())
            idx = k.vertex_groups[f"{glied}.{seite}"].index
            pts = np.array([list(v.co) for v in k.data.vertices
                            if any(gg.group == idx and gg.weight > gewicht for gg in v.groups)]) - np.array(a)
            t = pts @ ax / (b - a).length
            quer = pts - np.outer(pts @ ax, ax)
            nah = (t > 0.25) & (t < 0.75) & (np.linalg.norm(quer, axis=1) < grenze)
            return ax, quer[nah]

        ax, quer = punkte("finger1-3", 0.3, 0.013)
        _, V = np.linalg.eigh(np.cov(quer.T))
        duenn = V[:, 1]  # kleinste Ausdehnung quer zum Knochen (V[:, 0] liegt längs des Knochens)
        x = quer @ duenn
        if x.max() < -x.min():
            duenn = -duenn
        richtung = Vector(duenn.tolist()).normalized()
        # Dicke je Glied: Haut auf der Beerenseite (bis 35° neben der Beerenrichtung) in der Gliedmitte,
        # Median ihres Abstands zum Knochen; der größte Abstand läge an Schwimmhaut oder Ballen
        dicken = {}
        for glied in ("finger1-2", "finger1-3"):
            ax, quer = punkte(glied, 0.3, 0.02)
            r = np.array(senkrecht(richtung, Vector(ax.tolist())))
            abstand = np.linalg.norm(quer, axis=1)
            seite_beere = (quer @ r) > abstand * math.cos(math.radians(35))
            dicken[glied] = float(np.median(abstand[seite_beere])) if seite_beere.any() else 0.010
        self._daumen[seite] = (richtung, dicken)
        return self._daumen[seite]

    def _daumen_wickeln(self, seite: str, g: Griff, huelle: list) -> dict:
        """Daumen auf der Faust, feste Konstruktion ohne Suche (D-425, D-435, D-440).

        Der Daumen läuft in Gegenrichtung der Finger um die Stange und dabei schräg über sie hinweg,
        wie auf dem Handfoto des Produktinhabers: Ballen und Grundgelenk auf der Stange an deren
        unterer Außenkante, Grundglied über dem Rücken der Fingerspitzen, Endglied über den Mittel-
        und Endgliedern von Zeige- und Mittelfinger, die Kuppe am Mittelfinger (`DAUMEN_QUER`), der
        Nagel nach außen. Je Gelenk liegt die Beere auf dem, was unter ihr ist: auf der Stange
        (Radius plus Beere, um `DAUMEN_AUF_STANGE` eingedrückt) oder auf der Fingerhaut (`huelle`:
        Haut von Zeige- und Mittelfinger ohne Daumen, plus Beere, um `DAUMEN_AUF_FINGER` eingedrückt).
        Der Winkel um die Stange folgt je Gelenk aus der Länge des Glieds; die axiale Lage läuft
        von der Mittelhand neben dem Zeigefinger (`DAUMEN_SEIT` außen am Sattelgelenk) gleichmäßig
        zur Spitze. Ragt die Beere entlang eines Glieds in Stange oder Finger, werden beide
        Gelenke des Glieds in Schritten angehoben (`hub`), nicht mehr.

        Bis D-439 wurde jedes Gelenk so weit angehoben, dass auch das nächste Glied flach folgen
        konnte; weil die Fingerspitzen 17 mm über der Stange standen, trieb das Grundgelenk auf
        40 mm und das Endgelenk auf 51 mm von der Achse, das Endglied bog sich 71° zurück: der
        Daumen stand von der Seite als Haken über der Stange. Je Glied eine Drehung relativ zum
        vorigen Glied für `finger_setzen`; dazu Gelenkwinkel (Grad), Radien, axiale Lagen, Winkel
        um die Stange und Hub für das Protokoll."""
        import numpy as np

        kette = self._kette(seite, "finger1")
        achse, zyl, punkt = self._stangenrahmen(seite, g)
        p0 = kette[0][0]
        a0, _, phi0 = zyl(p0)
        laengen = [(e - k).length for k, e in kette]

        def axial(f: str) -> float:
            pk = self._fingerpunkte(self._kette(seite, f), achse, g.finger[f], g.finger.get("_spreiz_" + f + seite))
            return (zyl(pk[2])[0] + zyl(pk[4])[0]) / 2  # Mittelglied: Mittel- und Endgelenk

        a_spitze = axial("finger2") + DAUMEN_QUER * (axial("finger3") - axial("finger2"))
        a_grund = a0 + DAUMEN_SEIT * (1.0 if a0 >= a_spitze else -1.0)
        axiale = [a_grund, a_grund + (a_spitze - a_grund) * laengen[1] / (laengen[1] + laengen[2]), a_spitze]
        beere_richtung, dicken = self._daumenbeere(seite)
        beeren = [dicken["finger1-2"], dicken["finger1-2"], dicken["finger1-3"]]

        # Hülle als Raster über axialer Lage (1 mm) und Winkel (2°), je Zelle der größte Radius der
        # Fingerhaut, dann über die halbe Daumenbreite und das Winkelfenster ausgedehnt
        if huelle:
            a_min = min(h[0] for h in huelle) - 0.002
            n_a = int((max(h[0] for h in huelle) - a_min) / 0.001) + 3
            raster = np.full((n_a, 180), g.radius)
            for ah, rh, ph in huelle:
                ia = int((ah - a_min) / 0.001)
                ip = int((math.degrees(ph) + 180) / 2) % 180
                raster[ia, ip] = max(raster[ia, ip], rh)
            weit = raster.copy()
            da = int(DAUMEN_BREITE / 0.001)
            for sa in range(-da, da + 1):
                verschoben = np.full_like(raster, g.radius)
                if sa >= 0:
                    verschoben[sa:] = raster[:n_a - sa] if sa else raster
                else:
                    verschoben[:sa] = raster[-sa:]
                for sp in range(-int(DAUMEN_WINKEL / 2), int(DAUMEN_WINKEL / 2) + 1):
                    weit = np.maximum(weit, np.roll(verschoben, sp, axis=1))
        else:
            a_min, n_a, weit = 0.0, 0, None

        def huelle_r(a: float, phi: float) -> float:
            if weit is None:
                return g.radius
            ia = int((a - a_min) / 0.001)
            if ia < 0 or ia >= n_a:
                return g.radius
            return float(weit[ia, int((math.degrees(phi) + 180) / 2) % 180])

        def soll(k: int, a: float, phi: float) -> float:
            """Radius, bei dem die Beere des Glieds k auf der Stange oder der Fingerhaut liegt."""
            return max(g.radius + beeren[k] + DAUMEN_AUF_STANGE, huelle_r(a, phi) + beeren[k] + DAUMEN_AUF_FINGER)

        def loese(k: int, vorher: Vector, phi_v: float, r: float) -> tuple[Vector, float]:
            """Gelenk k bei Radius r: Drehung gegen die Finger, mit der das Glied seine Länge behält."""
            a_k, L = axiale[k], laengen[k]

            def f(delta: float) -> float:
                return (punkt(a_k, r, phi_v - delta) - vorher).length - L

            lo, hi = 0.0, math.pi
            if f(lo) > 0:
                delta = 0.0  # radialer und axialer Sprung größer als das Glied: so weit es reicht
            elif f(hi) < 0:
                delta = hi
            else:
                for _ in range(40):
                    m = (lo + hi) / 2
                    if f(m) > 0:
                        hi = m
                    else:
                        lo = m
                delta = (lo + hi) / 2
            return punkt(a_k, r, phi_v - delta), phi_v - delta

        hub = [0.0, 0.0, 0.0]
        for _ in range(60):
            ziele, radien, phis, ist = [], [], [], []
            vorher, phi_v = p0, phi0
            for k in range(3):
                r = soll(k, axiale[k], phi_v) + hub[k]
                for _i in range(6):  # der Radius hängt über die Hülle vom Winkel ab
                    z, phi_k = loese(k, vorher, phi_v, r)
                    r_neu = soll(k, axiale[k], phi_k) + hub[k]
                    if radien:
                        r_neu = max(r_neu, radien[-1] - DAUMEN_ABSTIEG * laengen[k])  # kein Haken zurück
                    if abs(r_neu - r) < 1e-4:
                        break
                    r = r_neu
                z, phi_k = loese(k, vorher, phi_v, r)
                ziele.append(z)
                radien.append(r)
                phis.append(phi_k)
                vorher = vorher + (z - vorher).normalized() * laengen[k]  # tatsächliches Gelenk
                ist.append(vorher)
                phi_v = phi_k
            # Beere entlang jedes Glieds über Stange und Fingerhaut? Sonst beide Gelenke anheben
            tief = [0.0, 0.0, 0.0]
            start = p0
            for k in range(3):
                for t in (0.2, 0.4, 0.6, 0.8):
                    q = start + (ziele[k] - start) * t
                    aq, rq, pq = zyl(q)
                    tief[k] = max(tief[k], soll(k, aq, pq) - rq)
                start = ist[k]
            if max(tief) <= 0.0005:
                break
            for k in range(3):
                if tief[k] <= 0.0005:
                    continue
                schritt = min(tief[k], 0.001)
                if k == 0:
                    hub[0] += schritt
                elif radien[k - 1] < radien[k] - 0.0005:  # flach: erst das tiefere Gelenk des Glieds anheben
                    hub[k - 1] += schritt
                elif radien[k] < radien[k - 1] - 0.0005:
                    hub[k] += schritt
                else:  # dann beide
                    hub[k - 1] += schritt
                    hub[k] += schritt

        # Je Glied die Drehung, die die Ruhe-Richtung auf die Sehne bringt und die Beere (Richtung in der
        # Grundhaltung aus `_daumenbeere`) zur Stangenachse dreht, den Nagel nach außen
        absolut, richtungen = [], []
        start = p0
        for (kopf, ende), ziel in zip(kette, ziele):
            v = ziel - start
            mitte_glied = (start + ziel) / 2
            radial = mitte_glied - (g.mitte + achse * zyl(mitte_glied)[0])
            absolut.append(abbild(ende - kopf, beere_richtung, v, -radial))
            richtungen.append(v.normalized())
            start = start + v.normalized() * (ende - kopf).length
        relativ = [absolut[0], absolut[0].inverted() @ absolut[1], absolut[1].inverted() @ absolut[2]]
        winkel = {
            "sattel": math.degrees((kette[0][1] - kette[0][0]).angle(richtungen[0])),
            "grund": math.degrees(richtungen[0].angle(richtungen[1])),
            "end": math.degrees(richtungen[1].angle(richtungen[2])),
        }
        return {"R": relativ, "winkel": winkel, "punkte": ziele, "radien": radien, "axial": axiale,
                "phi": [math.degrees(x) for x in phis], "spitze_axial": a_spitze, "beeren": beeren, "hub": hub}

    def _daumen_ring(self, seite: str, g: Griff, dicke: float) -> dict:
        """Daumen als Ring in der Querebene des Sattelgelenks (D-425; seit D-435 nur noch für dünne Stangen,
        beim Latziehen): Daumen und Finger bilden einen
        geschlossenen Ring um die Stange. Alle Gelenke des Daumens liegen auf dem Kreis um die
        Stangenachse mit dem Radius Stange plus Daumendicke, in der Ebene quer zur Stange durch das
        Sattelgelenk; der Daumen läuft in Gegenrichtung der Finger um die Stange (vom Handgelenk her
        unter der Stange hindurch und auf der Gegenseite hoch), die Spitze endet auf der Stange unter
        den Mittelgliedern der Finger, die sich darüber schließen. Je Glied eine Drehung, die die
        Ruhe-Richtung auf die Sehne des Kreises abbildet (`Rabs`), daraus die Drehung relativ zum
        vorigen Glied für `finger_setzen`. Gibt die Drehungen und die Gelenkwinkel (Grad) zurück."""
        kette = self._kette(seite, "finger1")
        R = g.radius + dicke
        achse_w = g.finger.get("_achse_" + seite, g.achse)  # Wickelachse der Finger
        w = (-achse_w).normalized()  # der Daumen wickelt in Gegenrichtung
        p0 = kette[0][0]
        laengen = [(e - k).length for k, e in kette]
        mitte = g.mitte + w * (p0 - g.mitte).dot(w)  # Kreismittelpunkt auf der Achsenhöhe des Sattelgelenks
        e1 = (p0 - mitte).normalized()
        e2 = w.cross(e1).normalized()
        r0 = (p0 - mitte).length

        def kreis(theta: float) -> Vector:
            return mitte + R * (math.cos(theta) * e1 + math.sin(theta) * e2)

        # Grundgelenk: auf dem Kreis, so dass der Mittelhandknochen seine Länge behält
        cos1 = max(-1.0, min(1.0, (r0 * r0 + R * R - laengen[0] ** 2) / (2 * r0 * R)))
        th1 = math.acos(cos1)
        th2 = th1 + 2 * math.asin(min(1.0, laengen[1] / (2 * R)))
        th3 = th2 + 2 * math.asin(min(1.0, laengen[2] / (2 * R)))
        ziele = [kreis(th1), kreis(th2), kreis(th3)]

        # Je Glied die Drehung, die die Ruhe-Richtung auf die Sehne bringt und die Beere (Richtung in der
        # Grundhaltung aus `_daumenbeere`) zur Stangenachse dreht, den Nagel nach außen
        absolut = []
        start = p0
        richtungen = []
        beere_richtung, _ = self._daumenbeere(seite)
        for (kopf, ende), ziel in zip(kette, ziele):
            v = ziel - start
            mitte_glied = (start + ziel) / 2
            radial = mitte_glied - (mitte + w * (mitte_glied - mitte).dot(w))
            absolut.append(abbild(ende - kopf, beere_richtung, v, -radial))
            richtungen.append(v.normalized())
            start = ziel
        relativ = [absolut[0], absolut[0].inverted() @ absolut[1], absolut[1].inverted() @ absolut[2]]
        winkel = {
            "sattel": math.degrees((kette[0][1] - kette[0][0]).angle(richtungen[0])),
            "grund": math.degrees(richtungen[0].angle(richtungen[1])),
            "end": math.degrees(richtungen[1].angle(richtungen[2])),
        }
        return {"R": relativ, "winkel": winkel, "punkte": ziele}

    def finger_setzen(self, seite: str, g: Griff, G_hand: Matrix) -> None:
        achse = g.finger.get("_achse_" + seite, g.achse)
        for f in ("finger2", "finger3", "finger4", "finger5"):
            winkel = g.finger[f]
            Rs = g.finger.get("_spreiz_" + f + seite, Matrix.Identity(3))
            Gp = G_hand
            for i, w in enumerate(winkel, start=1):
                name = f"{f}-{i}.{seite}"
                drehung = achse_winkel(achse, w) @ Rs if i == 1 else Rs.inverted() @ achse_winkel(achse, w) @ Rs
                G = Gp @ um_punkt(self.kopf[name], drehung)
                self.setze(name, G)
                Gp = G
        if "finger1" in g.finger:
            # Daumen: je Glied eine Drehung relativ zum vorigen Glied (Konstruktion in `_daumen_wickeln`)
            G = G_hand
            for i, L in enumerate(g.finger["finger1"]["R"], start=1):
                name = f"finger1-{i}.{seite}"
                G = G @ um_punkt(self.kopf[name], L)
                self.setze(name, G)

    def hand_an_stange(self, seite: str, g: Griff, mitte: Vector, stangen_achse: Vector, phi: float) -> Matrix:
        """Starre Abbildung der Hand: Stangenmitte des Griffs auf `mitte`, Griffachse auf die
        Stangenachse, Hand um die Stange um `phi` Grad gedreht."""
        d = self._hand[seite]
        e1 = senkrecht(d["n"], g.achse)
        k_neu = stangen_achse.normalized()
        hilf = Z if abs(k_neu.dot(Z)) < 0.9 else Y
        e1_neu = senkrecht(hilf, k_neu)
        R0 = abbild(g.achse, e1, k_neu, e1_neu)
        R = achse_winkel(k_neu, phi) @ R0
        return starr(g.mitte, mitte, R)

    def arm(self, seite: str, g: Griff, mitte: Vector, stangen_achse: Vector, ellbogen_richtung: Vector,
            streckung: float = 0.0, ellbogen=None, phi: float | None = None) -> dict:
        """Arm an die Stange: Die Hand liegt im Griff an `mitte` und kann sich nur um die Stange
        drehen (Winkel φ). Für jedes φ liegt das Handgelenk fest; den Ellbogen bestimmt die Regel
        der Übung `ellbogen(S, W, l1, l2)` (geschlossen, z. B. Unterarm senkrecht) oder die
        Pol-Richtung. Gewählt wird das φ, bei dem das Handgelenk am geradesten ist (Hand in
        Verlängerung des Unterarms, plus `streckung` Grad zum Handrücken). Gesucht wird über den ganzen
        Kreis, dann fein: kein Pendeln zwischen Lösungen, dieselbe Phase ergibt dieselbe Haltung. Mit
        `phi` ist die Drehung vorgegeben (Armhaltung, die fest zum Rumpf gesucht wurde)."""
        s = seite
        S0, E0, W0 = self.kopf["upperarm01." + s], self.kopf["lowerarm01." + s], self.kopf["wrist." + s]
        # Schultergelenk: folgt dem Schlüsselbein
        S = self.punkt("shoulder01." + s, S0)
        l1, l2 = (E0 - S0).length, (W0 - E0).length
        d = self._hand[s]
        k = stangen_achse.normalized()

        def ellbogen_fuer(W: Vector) -> Vector:
            if ellbogen is not None:
                return ellbogen(S, W, l1, l2)
            return zwei_glieder(S, W, l1, l2, ellbogen_richtung)[0]

        def knick(phi: float) -> float:
            G = self.hand_an_stange(s, g, mitte, k, phi)
            W = G @ W0
            E = ellbogen_fuer(W)
            f = (W - E).normalized()
            R = G.to_3x3()
            ziel = f
            if streckung:
                ziel = achse_winkel(f.cross(-(R @ d["n"])), streckung) @ f
            return math.degrees((R @ d["laengs"]).angle(ziel))

        if phi is None:
            phi = min(range(-180, 180, 3), key=knick)
            lo, hi = phi - 3.0, phi + 3.0
            for _ in range(30):  # Goldener Schnitt im Umfeld des besten Rasterpunkts
                m1, m2 = hi - 0.618 * (hi - lo), lo + 0.618 * (hi - lo)
                if knick(m1) < knick(m2):
                    hi = m2
                else:
                    lo = m1
            phi = (lo + hi) / 2
        G_hand = self.hand_an_stange(s, g, mitte, k, phi)
        W = G_hand @ W0
        E = ellbogen_fuer(W)
        p = senkrecht(E - S, W - S)
        ok = abs((E - S).length - l1) < 2e-3 and abs((W - E).length - l2) < 2e-3
        if not ok:
            self.meldungen.append(f"Arm {s}: Handgelenk nicht erreichbar")
        u, f = (E - S).normalized(), (W - E).normalized()
        u0, f0 = (E0 - S0).normalized(), (W0 - E0).normalized()
        scharnier0 = u0.cross(f0).normalized()
        scharnier = u.cross(-p).normalized() if u.cross(-p).length > 1e-6 else u.cross(f).normalized()
        R_ober = abbild(u0, scharnier0.cross(u0), u, scharnier.cross(u))
        G_ober = starr(S0, S, R_ober)
        self.setze("upperarm01." + s, G_ober)
        self.setze("upperarm02." + s, G_ober)
        self._schulterhilfe(s, S0, S, R_ober, u)
        R_unter0 = abbild(f0, scharnier0, f, scharnier)
        n_ohne = R_unter0 @ d["n"]
        n_soll = G_hand.to_3x3() @ d["n"]
        tau = winkel_um(n_ohne, n_soll, f)
        for name, anteil in (("lowerarm01." + s, 0.35), ("lowerarm02." + s, 0.85)):
            R = achse_winkel(f, tau * anteil) @ R_unter0
            self.setze(name, starr(E0, E, R))
        self.setze("wrist." + s, G_hand)
        for i in range(1, 5):
            self.setze(f"metacarpal{i}.{s}", G_hand)
        self.finger_setzen(s, g, G_hand)
        laengs_neu = G_hand.to_3x3() @ d["laengs"]
        return {
            "schulter": S,
            "ellbogen": E,
            "handgelenk": W,
            "ellbogenwinkel": 180 - math.degrees(u.angle(f)),
            "handgelenk_knick": math.degrees(f.angle(laengs_neu)),
            "pronation": tau,
            "phi": phi,
        }
