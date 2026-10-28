"""Die drei Pilot-Übungen auf dem IK-Rig (D-407, D-408).

Jede Übung baut ihre Szene (Figur, Geräte, Muskelzonen) und rechnet je Phase p (0 = Ausgang,
1 = Endposition) die Haltung aus Zielen: Füße fest am Boden, Hände im Griff an der Stange, Becken
und Rumpf so, dass die Last über der Unterstützungsfläche bleibt. `pruefwerte()` liefert die
Kennwerte für die Qualitätskontrolle (Gelenkwinkel, Abstände, Meldungen des Rigs).
"""
from __future__ import annotations

import math

import bpy
from mathutils import Matrix, Vector

import figur
import geraete
import koerperform
import zonen
from rig import X, Y, Z, Rig, achse_winkel, ellbogen_zur_richtung, gelenkkreis, starr

STANGE_R = 0.014  # Griffteil der olympischen Stange, 28 mm


def _hinten(koerper: bpy.types.Object, z: float, breite: float = 0.05) -> float:
    """Hinterste Stelle des Körpers (größtes y) in der Grundhaltung auf Höhe z (Raum des Skeletts)."""
    return max(v.co.y for v in koerper.data.vertices if abs(v.co.x) < breite and abs(v.co.z - z) < 0.012)


def _rumpfhoehe(kopf: dict, anteil: float) -> float:
    """Höhe (Grundhaltung) als Anteil der Strecke Hüftgelenke (0) bis Halsansatz (1), wie bei den
    Muskelzonen; so trifft dieselbe Zahl bei jeder Körperform dieselbe Stelle des Rumpfs."""
    unten = (kopf["upperleg01.L"].z + kopf["upperleg01.R"].z) / 2
    return unten + (kopf["neck01"].z - unten) * anteil


def _vorn(koerper: bpy.types.Object, z: float, breite: float = 0.03) -> Vector:
    """Vorderste Stelle des Körpers (kleinstes y) auf Höhe z (Raum des Skeletts)."""
    pkte = [v.co for v in koerper.data.vertices if abs(v.co.x) < breite and abs(v.co.z - z) < 0.012]
    return min(pkte, key=lambda c: c.y).copy()


def _ruecken_tief(koerper: bpy.types.Object, unten: float, oben: float) -> float:
    """Größtes y des Rumpfs (Schulterblätter, Gesäß) zwischen den Höhen: Auflage beim Liegen."""
    return max(v.co.y for v in koerper.data.vertices if abs(v.co.x) < 0.14 and unten < v.co.z < oben)


def _fuss(koerper: bpy.types.Object, kopf: dict) -> tuple[float, float]:
    """Linker Fuß in der Grundhaltung: (Ferse, Zehenspitze) als y-Werte (Raum des Skeletts)."""
    gruppen = {g.index for g in koerper.vertex_groups if g.name.startswith(("foot.L", "toe")) and g.name.endswith(".L")}
    ys = [v.co.y for v in koerper.data.vertices
          if v.co.x > 0 and v.co.z < kopf["foot.L"].z + 0.05 and any(g.group in gruppen and g.weight > 0.3 for g in v.groups)]
    return max(ys), min(ys)


class Uebung:
    """Grundlage der Übungen. Maße in Metern gelten für das Grundmodell von MakeHuman (Schultergelenke
    16,77 cm von der Mitte); für andere Körperformen werden die Abstände quer zum Körper mit dem
    Verhältnis der Schulterbreite skaliert (`mass`), Höhen beziehen sich auf Gelenke (D-413)."""

    name = ""
    haupt: list[str] = []
    mit: list[str] = []
    SCHULTER_GRUND = 0.1677  # halber Abstand der Schultergelenke im Grundmodell, m
    # Kamera (D-410): Dreiviertelansicht von vorn-seitlich, 45° zur linken Körperseite, leicht von
    # oben. Der Abstand ergibt sich aus Figur und Gerät (`szene.bildausschnitt`).
    kamera = {"richtung": 45.0, "neigung": 10.0}
    # Vorschaubild (D-415): Position, in der die Übung klein am besten zu erkennen ist
    vorschau_phase = 1.0

    def rahmen_objekte(self) -> list:
        """Geräteteile, die ganz im Bild sein sollen."""
        return []

    def rahmenpunkte(self, phasen=(0.0, 0.5, 1.0)) -> list[Vector]:
        """Punkte von Figur und Gerät über die ganze Bewegung, für den Bildausschnitt."""
        punkte: list[Vector] = []
        for p in phasen:
            self.setzen(p)
            netz = _netz(self.koerper)
            punkte += netz[::6]
            for obj in self.rahmen_objekte():
                for teil in [obj, *obj.children_recursive]:
                    if teil.type == "MESH":
                        punkte += [teil.matrix_world @ Vector(c) for c in teil.bound_box]
        return punkte

    def __init__(self, form: koerperform.Form | None = koerperform.NEUTRAL, stoff: float = 0.0):
        self.form = form
        # Höhe der Kleidung über der Haut (`kleidung.STOFF`), wo die Stange am Körper anliegt: auf dem
        # Trapez (Kniebeuge) und auf der Brust (Bankdrücken) liegt sie auf dem Stoff, nicht in ihm (D-422)
        self.stoff = stoff

    def bauen(self) -> None:
        self.koerper, self.skelett = figur.baue_figur(form=self.form)
        bpy.context.view_layer.update()
        # Zonen nach den Gewichten des Grundmodells, danach der Hilfsknochen an der Schulter
        zonen.setze_zonen(self.koerper, self.skelett, self.haupt, self.mit)
        figur.schulter_gewichte(self.koerper)
        self.rig = Rig(self.skelett, self.koerper)
        self.mass = self.rig.kopf["upperarm01.L"].x / self.SCHULTER_GRUND
        self.werte: dict[str, float] = {}

    def setzen(self, p: float) -> None:
        self.rig.zuruecksetzen()
        self.werte = {}
        self.haltung(p)
        self.rig.anwenden()

    def haltung(self, p: float) -> None:
        raise NotImplementedError

    def pruefwerte(self) -> dict[str, float]:
        return dict(self.werte)

    @staticmethod
    def kniewinkel(info: dict) -> float:
        """Innenwinkel am Knie (180 = gestreckt)."""
        a = (info["huefte"] - info["knie"]).normalized()
        b = (info["knoechel"] - info["knie"]).normalized()
        return math.degrees(a.angle(b))


class Kniebeuge(Uebung):
    """Kniebeuge mit Langhantel, hohe Stangenposition auf dem oberen Trapez.

    Ausgang: Füße etwa schulterbreit, Zehen 18° nach außen, ganze Sohle am Boden; Stange auf dem
    oberen Rücken über der Fußmitte; Hände umgreifen die Stange knapp außerhalb der Schultern,
    Handgelenke gerade, Ellbogen nach unten-hinten. Abwärts: Hüfte nach unten und hinten, Knie
    folgen den Zehen, Rumpf neigt sich mit dem Becken (Rücken gerade), Stange senkrecht über der
    Fußmitte. Tiefste Position: Oberschenkel waagrecht. Aufwärts derselbe Weg zurück.
    """

    name = "kniebeuge"
    haupt = ["quads", "glutes"]
    mit = ["adductors", "lower_back"]
    NEIGUNG = 44.0  # Rumpfneigung unten, Grad zur Senkrechten
    NEIGUNG_OBEN = 6.0  # leichte Rumpfneigung im Stand, damit die Stange über der Fußmitte steht
    KNIE_OBEN = 176.0  # Kniewinkel im Stand (Knie nicht ganz durchgedrückt)
    ZEHEN = 18.0
    GRIFF = 0.29  # halber Abstand der Hände, m (knapp anderthalbfache Schulterbreite)
    FUESSE = 0.185  # halber Abstand der Fußgelenke, m (etwa schulterbreit)
    # Hohe Stangenposition auf dem oberen Trapez, knapp unter dem Halswirbel C7: so weit unter dem
    # Halsansatz (Gelenk `neck01`, Grundhaltung). Tiefer kann die Hand die Stange nur mit stark
    # geknicktem Handgelenk oder nach vorn zeigenden Ellbogen greifen (Oberarm 23 bis 25 cm).
    STANGE_UNTER_HALS = 0.009
    SCHRAEG = 20.0  # Stange schräg in der Hand (vom Zeigefinger- zum Kleinfingerballen), Grad
    STRECKUNG = 15.0  # Handgelenk leicht gestreckt, Grad

    def bauen(self) -> None:
        super().bauen()
        rig = self.rig
        z0 = rig.kopf["neck01"].z - self.STANGE_UNTER_HALS
        self.B0 = Vector((0, _hinten(self.koerper, z0, 0.15) + self.stoff + STANGE_R - 0.003, z0))
        self.griff_x = self.GRIFF * self.mass
        self.stange = geraete.langhantel([(0.45, 0.035), (0.45, 0.035)])
        self.griff = {s: rig.griff(s, 0.6, STANGE_R, schraeg=self.SCHRAEG) for s in "LR"}
        A0 = rig.kopf["foot.L"]
        w = math.radians(self.ZEHEN)
        x = self.FUESSE * self.mass
        self.knoechel = {"L": Vector((x, A0.y, A0.z)), "R": Vector((-x, A0.y, A0.z))}
        self.zehen = {"L": Vector((math.sin(w), -math.cos(w), 0)), "R": Vector((-math.sin(w), -math.cos(w), 0))}
        # Fußmitte: halbe Strecke Ferse–Zehenspitze; das Fußgelenk sitzt über dem hinteren Drittel.
        ferse, spitze = _fuss(self.koerper, rig.kopf)
        self.fussmitte_y = A0.y - (A0.y - (ferse + spitze) / 2) * math.cos(w)
        self.zehenspitze = A0.y - spitze  # Fußgelenk bis Zehenspitze, m
        hl, hr = rig.kopf["upperleg01.L"], rig.kopf["upperleg01.R"]
        self.H0 = (hl + hr) / 2
        self.tiefe = self._tiefe_suchen()
        self.armhaltung = {s: self._arm_suchen(s) for s in "LR"}

    def _arm_suchen(self, s: str) -> tuple[Vector, float]:
        """Armhaltung zur Stange auf dem Rücken, einmal im Raum des Rumpfs gesucht (sie bleibt über die
        ganze Bewegung gleich): Handdrehung um die Stange (φ) und Lage des Ellbogens auf seinem Kreis.
        Ziel: Handgelenk gerade (bis auf `STRECKUNG`), Ellbogen nach unten-hinten und etwas außen,
        Handfläche nach vorn."""
        rig = self.rig
        x = 1 if s == "L" else -1
        rig.zuruecksetzen()
        S0, E0, W0 = rig.kopf["upperarm01." + s], rig.kopf["lowerarm01." + s], rig.kopf["wrist." + s]
        l1, l2 = (E0 - S0).length, (W0 - E0).length
        d = rig.handdaten(s)
        g = self.griff[s]
        mitte = self.B0 + X * (x * self.griff_x)
        oberarm = Vector((0.30 * x, 0.40, -0.87)).normalized()
        best = (1e9, None, 0.0)
        for phi in range(-180, 180, 3):
            G = rig.hand_an_stange(s, g, mitte, X * x, phi)
            W = G @ W0
            R = G.to_3x3()
            laengs, n = R @ d["laengs"], R @ d["n"]
            M, h, e1, e2 = gelenkkreis(S0, W, l1, l2)
            if (W - S0).length > l1 + l2 - 0.002:
                continue
            for i in range(0, 360, 4):
                w = math.radians(i)
                E = M + (e1 * math.cos(w) + e2 * math.sin(w)) * h
                f = (W - E).normalized()
                ziel = achse_winkel(f.cross(-n), self.STRECKUNG) @ f if self.STRECKUNG else f
                kosten = (math.degrees(laengs.angle(ziel)) + math.degrees((E - S0).angle(oberarm))
                          + math.degrees(n.angle(-Y)) / 4)
                if kosten < best[0]:
                    best = (kosten, E.copy(), float(phi))
        return best[1], best[2]

    def rahmen_objekte(self) -> list:
        return [self.stange]

    def stange_achse(self):
        return self.stange.location.copy(), X, STANGE_R

    def _becken(self, s: float, dz: float) -> Matrix:
        a = self.NEIGUNG_OBEN + (self.NEIGUNG - self.NEIGUNG_OBEN) * s
        R = achse_winkel(X, a)
        # Stange über die Fußmitte: Becken waagrecht so verschieben, dass B.y = Fußmitte.
        b = R @ (self.B0 - self.H0)
        dy = self.fussmitte_y - self.H0.y - b.y
        return starr(self.H0, self.H0 + Vector((0, dy, dz)), R)

    def _bein_probe(self, s: float, dz: float) -> dict:
        self.rig.zuruecksetzen()
        self.rig.setze("root", self._becken(s, dz))
        return self.rig.bein("L", self.knoechel["L"], self.zehen["L"], self.ZEHEN)

    def _dz_fuer(self, s: float, tiefer) -> float:
        """Hüftabsenkung per Halbierung: `tiefer(info)` ist wahr, solange es noch tiefer gehen muss."""
        lo, hi = -0.75, 0.05
        for _ in range(40):
            dz = (lo + hi) / 2
            if tiefer(self._bein_probe(s, dz)):
                hi = dz
            else:
                lo = dz
        return (lo + hi) / 2

    def _tiefe_suchen(self) -> float:
        """Unten: Hüftgelenk auf Kniehöhe (Oberschenkel waagrecht); merkt sich den Kniewinkel dort."""
        dz = self._dz_fuer(1.0, lambda i: i["huefte"].z > i["knie"].z)
        self.knie_unten = self.kniewinkel(self._bein_probe(1.0, dz))
        return -dz

    def _absenkung(self, s: float) -> float:
        """Der Kniewinkel läuft gleichmäßig vom Stand zur tiefsten Position; dazu die Hüfthöhe."""
        ziel = self.KNIE_OBEN + (self.knie_unten - self.KNIE_OBEN) * s
        return self._dz_fuer(s, lambda i: self.kniewinkel(i) > ziel)

    def haltung(self, p: float) -> None:
        rig = self.rig
        G = self._becken(p, self._absenkung(p))
        rig.zuruecksetzen()
        rig.setze("root", G)
        # Kopf in Verlängerung der Wirbelsäule, Blick leicht nach vorn unten.
        rig.dreh("neck01", achse_winkel(X, -14.0 * p))
        beine = {s: rig.bein(s, self.knoechel[s], self.zehen[s], self.ZEHEN) for s in "LR"}
        B = rig.punkt("spine01", self.B0)
        arme = {}
        # Pol-Ziel der Ellbogen: nach unten-hinten, fest zum Rumpf (die Arme halten die Stange auf
        # dem Rücken, ihre Haltung zum Oberkörper bleibt über die ganze Bewegung gleich)
        # Die Armhaltung ist im Raum des Rumpfs gesucht; der Rumpf dreht sich um die Stangenachse (X),
        # die Hand dreht sich mit (φ plus Rumpfwinkel, rechts gegenläufig, weil die Achse dort -X ist).
        rumpf = math.degrees(math.atan2(G[2][1], G[1][1]))
        for s, x in (("L", 1), ("R", -1)):
            mitte = B + X * (x * self.griff_x)
            E_rumpf, phi = self.armhaltung[s]
            arme[s] = rig.arm(s, self.griff[s], mitte, X * x, Z, self.STRECKUNG, phi=phi + rumpf * x,
                              ellbogen=lambda S, W, l1, l2, E=E_rumpf: G @ E)
        self.stange.location = rig.welt(B)
        L = beine["L"]
        oberschenkel = L["knie"] - L["huefte"]
        unterschenkel = L["knie"] - L["knoechel"]
        vor = (L["knie"] - self.knoechel["L"]).dot(self.zehen["L"])
        self.werte = {
            "Kniewinkel": self.kniewinkel(L),
            "Oberschenkel zur Waagrechten": math.degrees(
                math.asin(max(-1.0, min(1.0, (L["huefte"].z - L["knie"].z) / oberschenkel.length)))
            ),
            "Rumpfneigung": self.NEIGUNG_OBEN + (self.NEIGUNG - self.NEIGUNG_OBEN) * p,
            "Unterschenkel zur Senkrechten": math.degrees(unterschenkel.angle(Z)),
            "Stange über Fußmitte (cm)": (B.y - self.fussmitte_y) * 100,
            "Knie hinter Zehenspitze (cm)": (self.zehenspitze - vor) * 100,
            "Knie zur Zehenrichtung (Grad)": self._knie_zu_zehen(L, "L"),
            "Ellbogenwinkel": arme["L"]["ellbogenwinkel"],
            "Handgelenk geknickt": arme["L"]["handgelenk_knick"],
            "Pronation": arme["L"]["pronation"],
        }

    def _knie_zu_zehen(self, info: dict, s: str) -> float:
        """Winkel (waagrecht) zwischen der Richtung, in die das Knie zeigt, und der Zehenrichtung;
        positiv nach außen. Kippt das Knie nach innen, wird der Wert negativ."""
        p = info["richtung"]
        a = Vector((p.x, p.y, 0)).normalized()
        b = self.zehen[s]
        winkel = math.degrees(a.angle(b))
        aussen = (a - b).dot(Vector((1 if s == "L" else -1, 0, 0)))
        return winkel if aussen >= 0 else -winkel


def _netz(koerper: bpy.types.Object) -> list[Vector]:
    """Eckpunkte des verformten Körpers in Weltkoordinaten (ohne Glättung)."""
    sub = koerper.modifiers.get("Glatt")
    if sub:
        sub.show_viewport = False
    deps = bpy.context.evaluated_depsgraph_get()
    obj = koerper.evaluated_get(deps)
    mesh = obj.to_mesh()
    pkte = [obj.matrix_world @ v.co for v in mesh.vertices]
    obj.to_mesh_clear()
    if sub:
        sub.show_viewport = True
    return pkte


class Bankdruecken(Uebung):
    """Bankdrücken auf der Flachbank mit Langhantel.

    Rücken und Schulterblätter auf der Bank, Schultern leicht zurückgezogen, Füße flach am Boden,
    Knie etwa 100°. Beide Hände greifen gleich breit, etwas weiter als die Schultern; die Stange
    liegt tief in der Handfläche, Handgelenk leicht gestreckt, Daumen umgreift. Ausgang: Arme fast
    gestreckt, Stange über den Schultern. Abwärts senkt sich die Stange in einem leichten Bogen zur
    unteren Brust; die Handgelenke bleiben über den Ellbogen (Unterarme senkrecht). Unten berührt
    die Stange die Brust; aufwärts derselbe Weg zurück.
    """

    name = "bankdruecken"
    haupt = ["chest"]
    mit = ["triceps", "front_delts"]
    # Liegend: dieselbe Richtung, steiler von oben, damit die Brust zu sehen ist
    kamera = {"richtung": 45.0, "neigung": 32.0}
    # Vorschau oben: gestreckte Arme mit der Stange über der Brust sind klein sofort Bankdrücken; unten
    # verdeckt die Stange das Gesicht und die gebeugten Arme werden angeschnitten (D-415)
    vorschau_phase = 0.0

    def rahmen_objekte(self) -> list:
        return [self.stange, self.bank]

    def stange_achse(self):
        return self.stange.location.copy(), X, STANGE_R
    BANK_OBEN = 0.43
    GRIFF = 0.30
    FUESSE = 0.27  # halber Abstand der Fußgelenke, m
    KNIE = 100.0  # Kniewinkel, Füße flach am Boden
    BRUST = 0.65  # Kontakt der Stange: untere Brust (Anteil Hüfte–Halsansatz, Brustwarzenlinie)
    SCHULTER_Y = 0.32  # Schultern über dem Kopfende des Polsters (Welt)
    ZURUECK = 8.0  # Schultern zurückgezogen, Grad
    ELLBOGEN_OBEN = 172.0
    UNTERARM = 0.0  # Unterarm-Neigung nach außen (Grad), die der Ellbogen anstrebt
    # Stange schräg in der Hand (Grad): vom Zeigefingerballen zum Handballen an der Kleinfingerseite,
    # tief in der Handfläche über dem Unterarm (voller Griff, D-423; vorher quer)
    SCHRAEG = 18.0
    # Lage der Stange in der Hand (Anteil Handgelenk→Fingeransatz, D-430): in der oberen Hohlhand, so dass
    # die Finger sie umschließen; bis D-429 lag sie bei 0,38 auf den Ballen und die Faust vor ihr
    GRIFF_LAGE = 0.68
    UNTEN_DZ = 0.0  # Stange unten höher (m)
    BOGEN = 1.4  # Form der Stangenbahn: Exponent der Bewegung zur Brust hin

    def bauen(self) -> None:
        super().bauen()
        rig = self.rig
        self.bank = geraete.flachbank()
        self.stange = geraete.langhantel([(0.45, 0.035), (0.33, 0.03)])
        self.griff = {s: rig.griff(s, self.GRIFF_LAGE, STANGE_R, schraeg=self.SCHRAEG) for s in "LR"}
        self.griff_x = self.GRIFF * self.mass
        self.R_liegen = achse_winkel(X, -90)
        ruecken = _ruecken_tief(self.koerper, rig.kopf["upperleg01.L"].z - 0.2, rig.kopf["neck01"].z - 0.04)
        z_bank = self.BANK_OBEN - rig.versatz.z
        schulter_z = rig.kopf["upperarm01.L"].z
        self.verschiebung = Vector((0, self.SCHULTER_Y - schulter_z, z_bank + ruecken))
        A0 = rig.kopf["foot.L"]
        self.knoechel = {}
        self.oben, self.unten = Vector((0, 0, 0)), Vector((0, 0, 0))
        # Auflage aus dem verformten Netz: tiefster Punkt von Rücken und Gesäß auf der Bank
        rig.zuruecksetzen()
        self._torso()
        self.rig.anwenden()
        tief = min(p.z for p in _netz(self.koerper) if abs(p.x) < 0.15 and -0.55 < p.y < 0.58)
        self.verschiebung.z += self.BANK_OBEN - tief - 0.004
        # Füße flach am Boden, Knie im Winkel `KNIE`: Abstand Hüfte–Fußgelenk aus den Beinlängen
        rig.zuruecksetzen()
        self._torso()
        H = rig.punkt("pelvis.L", rig.kopf["upperleg01.L"])
        H0, K0 = rig.kopf["upperleg01.L"], rig.kopf["lowerleg01.L"]
        l1, l2 = (K0 - H0).length, (A0 - K0).length
        d = math.sqrt(l1 * l1 + l2 * l2 - 2 * l1 * l2 * math.cos(math.radians(self.KNIE)))
        x = self.FUESSE * self.mass
        dy = math.sqrt(max(d * d - (x - H.x) ** 2 - (A0.z - H.z) ** 2, 0.0))
        self.knoechel = {"L": Vector((x, H.y - dy, A0.z)), "R": Vector((-x, H.y - dy, A0.z))}
        self._bahn()

    def _torso(self) -> None:
        rig = self.rig
        rig.setze("root", starr(Vector(), self.verschiebung, self.R_liegen))
        rig.dreh("clavicle.L", achse_winkel(Z, self.ZURUECK))
        rig.dreh("clavicle.R", achse_winkel(Z, -self.ZURUECK))

    def _schultern(self) -> Vector:
        return (self.rig.punkt("shoulder01.L", self.rig.kopf["upperarm01.L"])
                + self.rig.punkt("shoulder01.R", self.rig.kopf["upperarm01.R"])) / 2

    def _bahn(self) -> None:
        """Stange oben (Ellbogen fast gestreckt, über den Schultern) und unten (auf der Brust)."""
        rig = self.rig
        rig.zuruecksetzen()
        self._torso()
        S = self._schultern()
        lo, hi = S.z, S.z + 0.7
        for _ in range(30):
            z = (lo + hi) / 2
            self.oben = Vector((0, S.y, z))
            rig.zuruecksetzen()
            self._torso()
            arme = [rig.arm(s, self.griff[s], self.oben + X * (x * self.griff_x), X * x, Vector((0, 0, -1)), 12.0,
                            ellbogen=self._regel(s)) for s, x in (("L", 1), ("R", -1))]
            if max(a["ellbogenwinkel"] for a in arme) < self.ELLBOGEN_OBEN and not rig.meldungen:
                lo = z
            else:
                hi = z
        self.oben = Vector((0, S.y, lo))
        # unten: untere Brust (Höhe der Brustwarzenlinie); Stange liegt auf dem höchsten Punkt darunter
        rig.zuruecksetzen()
        self._torso()
        self.rig.anwenden()
        brust = rig.punkt("spine02", _vorn(self.koerper, _rumpfhoehe(rig.kopf, self.BRUST)))
        y = brust.y
        hoehe = max(p.z for p in _netz(self.koerper) if abs(p.x) < 0.2 and abs(p.y - rig.welt(brust).y) < 0.012)
        self.unten = Vector((0, y, rig.lokal(Vector((0, 0, hoehe))).z + self.stoff + STANGE_R - 0.002))

    def _regel(self, s: str):
        # Handgelenk über dem Ellbogen: Unterarm so senkrecht wie möglich (optional leicht nach außen)
        w = math.radians(self.UNTERARM) * (1 if s == "L" else -1)
        richtung = Vector((math.sin(w), 0, math.cos(w)))
        return lambda S, W, l1, l2: ellbogen_zur_richtung(S, W, l1, l2, richtung)

    def haltung(self, p: float) -> None:
        rig = self.rig
        self._torso()
        hz = Vector((0.15, 0, 1)).normalized()
        for s, x in (("L", 1), ("R", -1)):
            rig.bein(s, self.knoechel[s], Vector((hz.x * x, -0.1, hz.z)), 6.0)
        y = self.oben.y + (self.unten.y - self.oben.y) * p ** self.BOGEN
        z = self.oben.z + (self.unten.z - self.oben.z) * p
        B = Vector((0, y, z))
        arme = {}
        for s, x in (("L", 1), ("R", -1)):
            arme[s] = rig.arm(s, self.griff[s], B + X * (x * self.griff_x), X * x, Vector((0, 0, -1)), 12.0, ellbogen=self._regel(s))
        self.stange.location = rig.welt(B)
        A = arme["L"]
        oberarm = (A["ellbogen"] - A["schulter"]).normalized()
        laengs = (rig.punkt("spine05", rig.kopf["spine05"]) - rig.punkt("spine01", rig.kopf["spine01"])).normalized()
        self.werte = {
            "Ellbogenwinkel": A["ellbogenwinkel"],
            "Oberarm zum Rumpf": math.degrees(oberarm.angle(laengs)),
            "Unterarm zur Senkrechten": math.degrees((A["handgelenk"] - A["ellbogen"]).angle(Z)),
            "Handgelenk geknickt": A["handgelenk_knick"],
            "Stange über Schulter (cm, y)": (B.y - self._schultern().y) * 100,
            "Stangenhöhe über Brustkontakt (cm)": (B.z - self.unten.z) * 100,
        }


class Latziehen(Uebung):
    """Latziehen am Kabel, breiter Obergriff, Stange vor dem Körper zur oberen Brust.

    Sitzend, Sitz auf Kniehöhe, Oberschenkel waagrecht unter der Knierolle, Füße flach am Boden.
    Hände greifen die Stange gut schulterbreit plus eine Handbreite, Handflächen nach vorn,
    Handgelenke gerade. Ausgang: Arme fast gestreckt über dem Kopf, Schultern mit angehoben,
    Oberkörper leicht zurückgelehnt. Abwärts ziehen die Ellbogen nach unten und leicht nach hinten,
    die Unterarme folgen der Zugrichtung des Kabels, die Schulterblätter senken sich; die Stange
    kommt vor dem Gesicht zur oberen Brust, der Oberkörper lehnt etwas weiter zurück, Rücken gerade.
    """

    name = "latziehen"
    haupt = ["lats"]
    mit = ["biceps", "upper_back"]
    # Die arbeitenden Muskeln liegen auf dem Rücken: dieselbe Dreiviertelansicht, von hinten-seitlich
    kamera = {"richtung": 135.0, "neigung": 10.0}
    # Vorschau oben: Arme über dem Kopf an der breiten Stange, dazu Sitz und Knierolle (D-415)
    vorschau_phase = 0.0
    GRIFF = 0.32
    LEHNE_OBEN, LEHNE_UNTEN = 8.0, 18.0
    SCHULTER_HOCH = 22.0  # Schlüsselbein angehoben bei gestreckten Armen
    ELLBOGEN_OBEN = 168.0
    UNTERARM = 0.0  # Unterarm-Neigung nach außen (Grad), die der Ellbogen anstrebt
    # Stange leicht schräg in der Hand (breiter Griff): Hand und Unterarm bleiben oben und unten in
    # einer Linie (Handgelenk höchstens etwa 13° seitlich statt 33°).
    SCHRAEG = 6.0
    UNTEN_DZ = 0.04  # Stange unten auf Höhe der Schlüsselbeine (obere Brust)
    FUESSE = 0.17  # halber Abstand der Fußgelenke, m
    BRUST = 0.835  # obere Brust unter den Schlüsselbeinen (Anteil Hüfte–Halsansatz)

    def bauen(self) -> None:
        super().bauen()
        rig = self.rig
        self.griff = {s: rig.griff(s, 0.72, 0.012, schraeg=self.SCHRAEG) for s in "LR"}
        self.griff_x = self.GRIFF * self.mass
        knie_welt = rig.welt(rig.kopf["lowerleg01.L"]).z
        self.sitz_oben = round(knie_welt - 0.005, 3)
        H0 = (rig.kopf["upperleg01.L"] + rig.kopf["upperleg01.R"]) / 2
        self.H0 = H0
        self.huefte = Vector((0, 0.04, rig.lokal(Vector((0, 0, self.sitz_oben))).z + 0.09))
        A0 = rig.kopf["foot.L"]
        self.knoechel = {}
        self.oben = self.unten = Vector()
        # Sitzhöhe aus dem verformten Netz: tiefster Punkt unter dem Gesäß auf dem Polster
        self._torso(0.0)
        HL = rig.punkt("pelvis.L", rig.kopf["upperleg01.L"])
        oberschenkel = (rig.kopf["lowerleg01.L"] - rig.kopf["upperleg01.L"]).length
        self.knie_y = HL.y - oberschenkel * 0.98
        x = self.FUESSE * self.mass
        self.knoechel = {"L": Vector((x, self.knie_y + 0.06, A0.z)), "R": Vector((-x, self.knie_y + 0.06, A0.z))}
        self._pose_ohne_arme(0.0)
        netz = _netz(self.koerper)
        tief = min(p.z for p in netz if abs(p.x) < 0.17 and -0.12 < p.y - rig.welt(self.huefte).y < 0.12)
        self.huefte.z += self.sitz_oben - tief - 0.004
        self._pose_ohne_arme(0.0)
        netz = _netz(self.koerper)
        # Knierolle auf dem Oberschenkel, kurz vor dem Knie (82 % der Strecke Hüfte–Knie)
        b = self._bein
        y_rolle = rig.welt(b["huefte"].lerp(b["knie"], 0.82)).y
        oberseite = max(p.z for p in netz if 0.04 < abs(p.x) < 0.17 and abs(p.y - y_rolle) < 0.02)
        self.knierolle = Vector((0, y_rolle, oberseite + 0.055 - 0.004))
        self._bahn()
        self.teile = geraete.latzug(self.sitz_oben, self.knierolle, rig.welt(Vector((0, (self.oben.y + self.unten.y) / 2, 0))).y)

    def rahmen_objekte(self) -> list:
        return [self.teile["stange"]]

    def stange_achse(self):
        return self.teile["stange"].location.copy(), X, 0.012

    def _lehne(self, p: float) -> float:
        # Zurücklehnen früh in der Bewegung (die Stange kommt am Gesicht vorbei), unten ruhig
        return self.LEHNE_OBEN + (self.LEHNE_UNTEN - self.LEHNE_OBEN) * (1 - (1 - p) ** 2)

    def _torso(self, p: float) -> None:
        rig = self.rig
        R = achse_winkel(X, -self._lehne(p))
        rig.setze("root", starr(self.H0, self.huefte, R))
        hoch = self.SCHULTER_HOCH * (1 - p)
        rig.dreh("clavicle.L", achse_winkel(-Y, hoch) @ achse_winkel(Z, 6 * p))
        rig.dreh("clavicle.R", achse_winkel(Y, hoch) @ achse_winkel(Z, -6 * p))
        rig.dreh("neck01", achse_winkel(X, 6 * p))

    def _pose_ohne_arme(self, p: float) -> None:
        rig = self.rig
        rig.zuruecksetzen()
        self._torso(p)
        if self.knoechel:
            for s, x in (("L", 1), ("R", -1)):
                info = rig.bein(s, self.knoechel[s], Vector((0.15 * x, -1, 0.1)), 8.0)
                if s == "L":
                    self._bein = info
        rig.anwenden()

    def _schultern(self) -> Vector:
        return (self.rig.punkt("shoulder01.L", self.rig.kopf["upperarm01.L"])
                + self.rig.punkt("shoulder01.R", self.rig.kopf["upperarm01.R"])) / 2

    def _regel(self, s: str):
        # Unterarm in Zugrichtung des Kabels: so senkrecht wie möglich (optional leicht nach außen)
        w = math.radians(self.UNTERARM) * (1 if s == "L" else -1)
        richtung = Vector((math.sin(w), 0, math.cos(w)))
        return lambda S, W, l1, l2: ellbogen_zur_richtung(S, W, l1, l2, richtung)

    def _bahn(self) -> None:
        rig = self.rig
        # unten: Stange vor der oberen Brust (Höhe Schlüsselbein), 3 cm Abstand
        self._pose_ohne_arme(1.0)
        brust = rig.punkt("spine01", _vorn(self.koerper, _rumpfhoehe(rig.kopf, self.BRUST)))
        self.unten = Vector((0, brust.y - 0.03 - 0.012, brust.z + 0.01 + self.UNTEN_DZ))
        # oben: über dem Kopf, Ellbogen fast gestreckt
        rig.zuruecksetzen()
        self._torso(0.0)
        S = self._schultern()
        lo, hi = S.z, S.z + 0.8
        y = self.unten.y - 0.03  # oben etwas weiter vorn: Kabel senkrecht vor dem Gesicht
        for _ in range(30):
            z = (lo + hi) / 2
            rig.zuruecksetzen()
            self._torso(0.0)
            arme = [rig.arm(s, self.griff[s], Vector((x * self.griff_x, y, z)), X * x, Z, 0.0, ellbogen=self._regel(s))
                    for s, x in (("L", 1), ("R", -1))]
            if max(a["ellbogenwinkel"] for a in arme) < self.ELLBOGEN_OBEN and not rig.meldungen:
                lo = z
            else:
                hi = z
        self.oben = Vector((0, y, lo))
        self._abstand_gesicht()

    def _abstand_gesicht(self) -> None:
        """Die Stange läuft vor dem Gesicht vorbei: Wo Nase und Kinn in die gerade Bahn ragen, wird
        sie nach vorn verlegt (4 cm Abstand zur Haut), geglättet über die ganze Bewegung."""
        rig = self.rig
        phasen = [i / 20 for i in range(21)]
        noetig = []
        for p in phasen:
            self._pose_ohne_arme(p)
            B = self.oben.lerp(self.unten, p)
            z = rig.welt(B).z
            vorn = [q.y for q in _netz(self.koerper) if abs(q.x) < 0.1 and abs(q.z - z) < 0.012 + 0.03]
            y_frei = rig.lokal(Vector((0, min(vorn), 0))).y - 0.012 - 0.04 if vorn else B.y
            noetig.append(max(0.0, B.y - y_frei))
        # gleitendes Maximum, dann Mittel: weicher Bogen ohne Knick
        breit = [max(noetig[max(0, i - 1):i + 2]) for i in range(21)]
        self._noetig = noetig
        self.vorlage = [sum(breit[max(0, i - 2):i + 3]) / len(breit[max(0, i - 2):i + 3]) for i in range(21)]
        self.vorlage[-1] = noetig[-1]  # unten genau an der oberen Brust

    def _stange(self, p: float) -> Vector:
        B = self.oben.lerp(self.unten, p)
        i = min(int(p * 20), 19)
        t = p * 20 - i
        vor = self.vorlage[i] * (1 - t) + self.vorlage[i + 1] * t
        return B - Y * vor

    def haltung(self, p: float) -> None:
        rig = self.rig
        self._torso(p)
        for s, x in (("L", 1), ("R", -1)):
            rig.bein(s, self.knoechel[s], Vector((0.15 * x, -1, 0.1)), 8.0)
        B = self._stange(p)
        arme = {}
        for s, x in (("L", 1), ("R", -1)):
            arme[s] = rig.arm(s, self.griff[s], B + X * (x * self.griff_x), X * x, Z, 0.0, ellbogen=self._regel(s))
        stange = self.teile["stange"]
        stange.location = rig.welt(B) + Vector((0, 0, 0.0))
        rolle = self.teile["rolle"].location
        geraete.kabel("Kabel", Vector((0, rolle.y, rolle.z - 0.06)), stange.location + Vector((0, 0, 0.04)))
        r2 = self.teile["rolle2"].location
        geraete.kabel("Kabel2", Vector((0, rolle.y, rolle.z + 0.06)), Vector((0, r2.y, r2.z + 0.05)))
        A = arme["L"]
        self.werte = {
            "Ellbogenwinkel": A["ellbogenwinkel"],
            "Unterarm zur Senkrechten": math.degrees((A["handgelenk"] - A["ellbogen"]).angle(Z)),
            "Handgelenk geknickt": A["handgelenk_knick"],
            "Lehne zurück": self._lehne(p),
            "Stange über Schulter (cm)": (B.z - self._schultern().z) * 100,
        }


UEBUNGEN = {u.name: u for u in (Kniebeuge, Bankdruecken, Latziehen)}
