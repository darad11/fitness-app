"""Die drei Pilot-Übungen auf dem IK-Rig (D-407, D-408).

Jede Übung baut ihre Szene (Figur, Geräte) und rechnet je Phase p (0 = Ausgang,
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
from rig import X, Y, Z, Rig, achse_winkel, ellbogen_zur_richtung, gelenkkreis, starr

STANGE_R = 0.014  # Griffteil der olympischen Stange, 28 mm


def _hinten(koerper: bpy.types.Object, z: float, breite: float = 0.05) -> float:
    """Hinterste Stelle des Körpers (größtes y) in der Grundhaltung auf Höhe z (Raum des Skeletts)."""
    return max(v.co.y for v in koerper.data.vertices if abs(v.co.x) < breite and abs(v.co.z - z) < 0.012)


def _rumpfhoehe(kopf: dict, anteil: float) -> float:
    """Höhe (Grundhaltung) als Anteil der Strecke Hüftgelenke (0) bis Halsansatz (1), wie in den
    Körperkoordinaten (`koordinaten.py`); so trifft dieselbe Zahl bei jeder Körperform dieselbe Stelle
    des Rumpfs."""
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

    def __init__(self, form: koerperform.Form | None = koerperform.NEUTRAL, stoff: float = 0.0, schuhe: bool = False):
        self.form = form
        # Höhe der Kleidung über der Haut (`kleidung.STOFF`), wo die Stange am Körper anliegt: auf dem
        # Trapez (Kniebeuge) und auf der Brust (Bankdrücken) liegt sie auf dem Stoff, nicht in ihm (D-422)
        self.stoff = stoff
        # In Schuhen (D-450): Die Figur steht auf der Sohle, um deren Dicke unter dem Fuß höher
        self.schuhe = schuhe
        self.sohle = 0.0

    def bauen(self) -> None:
        self.koerper, self.skelett = figur.baue_figur(form=self.form)
        if self.schuhe:
            # Bodenkontakt über die Sohle (D-450): Das Skelett steht um die Dicke der Sohle unter dem Fuß
            # höher, alle Ziele der Übung (Füße flach, Bank, Sitz) beziehen sich darauf
            import schuhe

            self.sohle = schuhe.sohle_unter_fuss(self.koerper)
            self.skelett.location.z += self.sohle
        bpy.context.view_layer.update()
        # Hilfsknochen an der Schulter (Muskelzonen gibt es seit D-449 nicht mehr)
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
        self.schuhspitze = self.sohlenmitte_y = None
        if self.schuhe:
            # In Schuhen (D-451): Fußgelenk bis Spitze des Schuhs und Mitte der Sohle, längs des Fußes
            import schuhe

            r = schuhe._schaft(self.koerper.name)["rahmen"]["L"]
            a = (r["c"] - A0).dot(r["vor"]) + r["ferse"]
            self.schuhspitze = a + r["L"]
            self.sohlenmitte_y = A0.y - (a + r["L"] / 2) * math.cos(w)
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
            **({"Stange über Mitte der Sohle (cm)": (B.y - self.sohlenmitte_y) * 100,
                "Knie hinter der Schuhspitze (cm)": (self.schuhspitze - vor) * 100} if self.schuhe else {}),
            "Ellbogenwinkel": arme["L"]["ellbogenwinkel"],
            "Handgelenk geknickt": arme["L"]["handgelenk_knick"],
            "Handgelenk gesamt (Grad)": arme["L"]["handgelenk_gesamt"],
            "Handgelenk gestreckt (Grad)": arme["L"]["handgelenk_streckung"],
            "Handgelenk seitlich (Grad, + zum Daumen)": arme["L"]["handgelenk_seitlich"],
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
    # tief in der Handfläche über dem Unterarm (voller Griff, D-423; vorher quer). 12° wie in D-423 statt 18°
    # (D-430): Die Schräge verschiebt das seitliche Abknicken des Handgelenks, bei 12° liegt es über die
    # ganze Bewegung am kleinsten (D-452)
    SCHRAEG = 12.0
    # Lage der Stange in der Hand (Anteil Handgelenk→Fingeransatz): in der Hohlhand, so dass die Finger sie
    # umschließen; seit D-452 etwas tiefer zum Handballen (0,65 statt 0,68 seit D-430). Bis D-429 lag sie bei
    # 0,38 auf den Ballen und die Faust vor ihr; unter 0,65 drückt der nachgeklappte Daumen in die Stange
    GRIFF_LAGE = 0.65
    # Handgelenk leicht gestreckt (Grad), Ziel bei der Suche der Handdrehung: 6° statt 12° (D-452); die
    # Streckung bleibt so in der ganzen Bewegung unter 10°, an der Längsachse der Mittelhand gemessen
    STRECKUNG = 6.0
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
            arme = [rig.arm(s, self.griff[s], self.oben + X * (x * self.griff_x), X * x, Vector((0, 0, -1)), self.STRECKUNG,
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
            arme[s] = rig.arm(s, self.griff[s], B + X * (x * self.griff_x), X * x, Vector((0, 0, -1)), self.STRECKUNG,
                              ellbogen=self._regel(s))
        self.stange.location = rig.welt(B)
        A = arme["L"]
        oberarm = (A["ellbogen"] - A["schulter"]).normalized()
        laengs = (rig.punkt("spine05", rig.kopf["spine05"]) - rig.punkt("spine01", rig.kopf["spine01"])).normalized()
        self.werte = {
            "Ellbogenwinkel": A["ellbogenwinkel"],
            "Oberarm zum Rumpf": math.degrees(oberarm.angle(laengs)),
            "Unterarm zur Senkrechten": math.degrees((A["handgelenk"] - A["ellbogen"]).angle(Z)),
            "Handgelenk geknickt": A["handgelenk_knick"],
            "Handgelenk gesamt (Grad)": A["handgelenk_gesamt"],
            "Handgelenk gestreckt (Grad)": A["handgelenk_streckung"],
            "Handgelenk seitlich (Grad, + zum Daumen)": A["handgelenk_seitlich"],
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
    # Dreiviertelansicht von hinten-seitlich (D-410): Rücken und Schulterblätter arbeiten sichtbar, die
    # Stange läuft vor dem Gesicht frei; seit D-449 ohne Zonen, die Kamera bleibt
    kamera = {"richtung": 135.0, "neigung": 10.0}
    # Vorschau oben: Arme über dem Kopf an der breiten Stange, dazu Sitz und Knierolle (D-415)
    vorschau_phase = 0.0
    GRIFF = 0.32
    LEHNE_OBEN, LEHNE_UNTEN = 8.0, 18.0
    SCHULTER_HOCH = 22.0  # Schlüsselbein angehoben bei gestreckten Armen
    ELLBOGEN_OBEN = 168.0
    UNTERARM = 0.0  # Unterarm-Neigung nach außen (Grad), die der Ellbogen anstrebt
    # Stange schräg in der Hand (breiter Griff), vom Zeigefinger zum Handballen an der Kleinfingerseite: 20° statt
    # 6° (D-455). Beim breiten Griff neigt sich der Unterarm oben und unten nach außen (die Armlängen lassen ihn
    # nicht senkrecht stehen), in der Mitte etwas nach innen; das Handgelenk knickte dadurch bis 30,6° zur
    # Daumenseite ab (an der Längsachse der Mittelhand gemessen). Mit 20° liegt es in der ganzen Bewegung zwischen
    # −13,4° und +13,3°; jedes Grad Schräge verschiebt den Verlauf um gut 1°, die Bewegung bleibt
    SCHRAEG = 20.0
    # Lage der Stange in der Hand (Anteil Handgelenk→Fingeransatz): 0,65 statt 0,72 (D-455), etwas tiefer in der
    # Hohlhand; weiter vorn drücken die Finger bei der größeren Schräge tiefer in die Stange
    GRIFF_LAGE = 0.65
    # Ziel der Streckung bei der Suche der Handdrehung (Grad); die Streckung bleibt so zwischen −2° und +4°
    STRECKUNG = 0.0
    UNTEN_DZ = 0.04  # Stange unten auf Höhe der Schlüsselbeine (obere Brust)
    FUESSE = 0.17  # halber Abstand der Fußgelenke, m
    BRUST = 0.835  # obere Brust unter den Schlüsselbeinen (Anteil Hüfte–Halsansatz)

    def bauen(self) -> None:
        super().bauen()
        rig = self.rig
        # Daumen über den Fingern wie beim Bankdrücken (D-440); bis D-439 als Ring (D-425), weil die frühere
        # Konstruktion über den Fingern an der dünnen Latzugstange als Haken abstand
        self.griff = {s: rig.griff(s, self.GRIFF_LAGE, 0.012, schraeg=self.SCHRAEG) for s in "LR"}
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
            arme = [rig.arm(s, self.griff[s], Vector((x * self.griff_x, y, z)), X * x, Z, self.STRECKUNG,
                            ellbogen=self._regel(s)) for s, x in (("L", 1), ("R", -1))]
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
            arme[s] = rig.arm(s, self.griff[s], B + X * (x * self.griff_x), X * x, Z, self.STRECKUNG,
                              ellbogen=self._regel(s))
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
            "Handgelenk gesamt (Grad)": A["handgelenk_gesamt"],
            "Handgelenk gestreckt (Grad)": A["handgelenk_streckung"],
            "Handgelenk seitlich (Grad, + zum Daumen)": A["handgelenk_seitlich"],
            "Lehne zurück": self._lehne(p),
            "Stange über Schulter (cm)": (B.z - self._schultern().z) * 100,
        }


# ---------------------------------------------------------------------- Familie „Waagrechtes Drücken“ mit Kurzhanteln (D-462)


def kopf_punkte(hantel: bpy.types.Object, schritte: int = 6) -> list[Vector]:
    """Punkte auf der Oberfläche beider Köpfe einer Kurzhantel (Welt), für den Abstand zum Körper."""
    kh = geraete.KH
    kopf_l = (kh["laenge"] - kh["griff"]) / 2
    R = kh["kopf"] / 2
    M = hantel.matrix_world
    pkte = []
    ecken = [(math.cos(math.radians(60 * k)), math.sin(math.radians(60 * k))) for k in range(6)]  # wie `geraete.kurzhantel`
    for seite in (-1, 1):
        x0, x1 = seite * kh["griff"] / 2, seite * (kh["griff"] / 2 + kopf_l)
        for i in range(schritte + 1):
            x = x0 + (x1 - x0) * i / schritte
            for k in range(6):
                (ay, az), (by, bz) = ecken[k], ecken[(k + 1) % 6]
                for j in range(schritte):
                    t = j / schritte
                    pkte.append(M @ Vector((x, R * (ay + (by - ay) * t), R * (az + (bz - az) * t))))
        for f in (0.0, 0.5):
            for k in range(6):
                ay, az = ecken[k]
                pkte.append(M @ Vector((x0, R * ay * f, R * az * f)))
    return pkte


HAND = ("wrist", "metacarpal", "finger")  # Gruppen der Hände (wie in `hand_zu_koepfen`)
_HANDFLAECHEN: dict[int, tuple[set[int], list[list[int]]]] = {}  # je Netz


def abstand_koerper(koerper: bpy.types.Object, punkte: list[Vector]) -> float:
    """Kleinster Abstand der Punkte zum Körper ohne die Hände (m, negativ = im Körper), am verformten Netz ohne
    Glättung. Die Hand hält den Griff zwischen den Köpfen, ihren Abstand misst `hand_zu_koepfen`. Im Körper liegt ein
    Punkt, wenn die nächste Fläche des ganzen (geschlossenen) Netzes keine Hand ist und er hinter ihr liegt; sonst zählt
    der Abstand zur nächsten Fläche ohne die Hände."""
    from mathutils.bvhtree import BVHTree

    schluessel = koerper.data.as_pointer()
    if schluessel not in _HANDFLAECHEN:
        namen = {g.index: g.name for g in koerper.vertex_groups}
        hand = {v.index for v in koerper.data.vertices
                if sum(g.weight for g in v.groups if namen[g.group].startswith(HAND)) >= 0.3}
        flaechen = {f.index for f in koerper.data.polygons if hand.intersection(f.vertices)}
        _HANDFLAECHEN[schluessel] = (flaechen, [list(f.vertices) for f in koerper.data.polygons if f.index not in flaechen])
    handflaechen, ohne_haende = _HANDFLAECHEN[schluessel]
    netz = _netz(koerper)
    ganz = BVHTree.FromPolygons(netz, [list(f.vertices) for f in koerper.data.polygons])
    ohne = BVHTree.FromPolygons(netz, ohne_haende)
    beste = float("inf")
    for p in punkte:
        ort, n, i, d = ganz.find_nearest(p)
        if ort is not None and i not in handflaechen and (p - ort).dot(n) < 0:
            beste = min(beste, -d)
            continue
        ort, _, _, d = ohne.find_nearest(p)
        if ort is not None:
            beste = min(beste, d)
    return beste


def hand_zu_koepfen(koerper: bpy.types.Object, hanteln: dict) -> float:
    """Kleinster Abstand der Hand zu den Innenseiten der Köpfe ihrer Hantel (m, negativ = in einem Kopf): Punkte der
    Hand (Gewicht an Handgelenk, Mittelhand und Fingern) im Raum der Hantel; gezählt wird, was innerhalb des Inkreises
    der Köpfe um die Achse liegt (die Hand umschließt den Griff mit rund 5 cm, der Inkreis hat 6,3 cm)."""
    kh = geraete.KH
    netz = _netz(koerper)
    namen = {g.index: g.name for g in koerper.vertex_groups}
    r_in = kh["kopf"] / 2 * math.cos(math.radians(30))
    beste = 1.0
    for s, hantel in hanteln.items():
        teile = ("wrist." + s, "metacarpal", "finger")
        Mi = hantel.matrix_world.inverted()
        for v, p in zip(koerper.data.vertices, netz):
            w = sum(g.weight for g in v.groups if namen[g.group].startswith(teile) and namen[g.group].endswith("." + s))
            if w < 0.3:
                continue
            q = Mi @ p
            if math.hypot(q.y, q.z) < r_in:
                beste = min(beste, kh["griff"] / 2 - abs(q.x))
    return beste


def polster_werte(koerper: bpy.types.Object, polster: list) -> dict:
    """Körper und Polster der Bank (Welt, verformtes Netz, mm): wie tief Rumpf und Gesäß einsinken (gewollt 4 mm) und
    wie weit die Oberschenkel über dem Polster bleiben. Jedes Polster als Kasten in seinem eigenen Raum."""
    netz = _netz(koerper)
    namen = {g.index: g.name for g in koerper.vertex_groups}
    bein = [sum(g.weight for g in v.groups if namen[g.group].startswith(("upperleg", "lowerleg"))) > 0.5
            for v in koerper.data.vertices]
    tief_rumpf, luft_bein = 0.0, float("nan")
    for obj in polster:
        Mi = obj.matrix_world.inverted()
        bb = [Vector(c) for c in obj.bound_box]
        lo = Vector((min(c.x for c in bb), min(c.y for c in bb), min(c.z for c in bb)))
        hi = Vector((max(c.x for c in bb), max(c.y for c in bb), max(c.z for c in bb)))
        for p, ist_bein in zip(netz, bein):
            q = Mi @ p
            if not (lo.x <= q.x <= hi.x and lo.y <= q.y <= hi.y and lo.z - 0.02 <= q.z <= hi.z + 0.10):
                continue
            if ist_bein:
                luft_bein = q.z - hi.z if math.isnan(luft_bein) else min(luft_bein, q.z - hi.z)
            else:
                tief_rumpf = max(tief_rumpf, hi.z - q.z)
    return {"Bank: Rumpf im Polster (mm)": tief_rumpf * 1000, "Bank: Oberschenkel über dem Polster (mm)": luft_bein * 1000}


class BankdrueckenKH(Bankdruecken):
    """Bankdrücken mit Kurzhanteln auf der Flachbank (Familie „Waagrechtes Drücken“, D-462).

    Lage auf der Bank, Füße und Schultern wie beim Bankdrücken mit Langhantel. Je Hand eine Kurzhantel, Griff quer
    (Handflächen zu den Füßen), voller Griff mit dem Daumen über den Fingern. Ausgang: Arme fast gestreckt
    (Ellbogen 172°), Hanteln senkrecht über den Schultergelenken, innen leicht zueinander. Unten steht der Unterarm
    senkrecht unter dem Griff, der Oberarm zeigt `ALPHA` = 50° vom Rumpf zur Seite (in der Ebene der Bank gemessen,
    empfohlen 45 bis 60°) und `BETA_UNTEN` = 25° unter die Ebene der Bank (Ellbogen knapp unter der Bank), höher nur,
    wenn der innere Kopf sonst näher als `LUFT` = 5 mm an Brust oder Schulter käme. Die Hanteln laufen auf einer
    gleichmäßigen Bahn von seitlich der Brust nach oben über die Schultern, nach oben leicht zusammen und nie breiter
    als unten (D-463, `_bahn`): Mit senkrechtem Unterarm gingen sie in der Mitte nach außen, weil der Ellbogen dort am
    weitesten vom Schultergelenk weg ist; dafür steht der Ellbogen in der Mitte etwas außerhalb der Hand. Die Griffe
    sinken gleichmäßig; aufwärts derselbe Weg zurück."""

    name = "bankdruecken_kh"
    titel = "Bankdrücken mit Kurzhanteln"
    kamera = {"richtung": 45.0, "neigung": 32.0}
    vorschau_phase = 0.0
    KH_R = geraete.KH["griff_d"] / 2
    LEHNE = 0.0  # Neigung der Bank unter dem Rücken (Grad), flach
    ALPHA = 50.0  # Oberarm vom Rumpf zur Seite, in der Ebene der Bank (Grad)
    BETA_UNTEN = 25.0  # unten: Oberarm so weit unter der Ebene der Flachbank (Grad)
    X_OBEN = 0.186  # oben: Mitte des Griffs neben der Mitte des Körpers (vor dem Maß der Schultern), m
    HAND = 0.075  # Mitte des Griffs über dem Handgelenk bei senkrechtem Unterarm, m
    LUFT = 0.005  # innerer Kopf mindestens so weit über dem Körper, m
    STUETZEN = 21  # Stützstellen der Bahn
    # Bahn (D-463): unten das Handgelenk auf einer Kurve, die nach oben nur enger wird, bis zum Bogen mit senkrechtem
    # Unterarm bei `ANSCHLUSS` (Oberarm 45° über der Waagrechten); von dort die Griffe auf einer zweiten Kurve, die in
    # Richtung des Bogens beginnt und am Ausgang über den Schultern endet. `EINWAERTS`: Richtung am Anfang der unteren
    # Kurve, so viel nach innen je Meter Höhe
    ANSCHLUSS = -45.0
    EINWAERTS = 0.04
    PROBEN = 30

    def rahmen_objekte(self) -> list:
        return [*self.hanteln.values(), self.bank]

    def stange_achse(self):
        # beide Griffe liegen auf einer Linie quer zum Körper (symmetrisch): für den Abstand der Finger
        return self.hanteln["L"].location.copy(), X, self.KH_R

    def polster_objekte(self) -> list:
        return [o for o in self.bank.children_recursive if o.name.startswith("Polster")]

    def _geraete(self) -> None:
        self.bank = geraete.flachbank()

    def bauen(self) -> None:
        Uebung.bauen(self)
        rig = self.rig
        self._geraete()
        self.hanteln = {s: geraete.kurzhantel(f"Kurzhantel.{s}") for s in "LR"}
        self.griff = {s: rig.griff(s, self.GRIFF_LAGE, self.KH_R, schraeg=self.SCHRAEG) for s in "LR"}
        self._lage()
        self._fuesse()
        self._bahn()

    def _lage(self) -> None:
        """Rücken auf der Bank wie beim Bankdrücken mit Langhantel (4 mm im Polster)."""
        rig = self.rig
        self.R_liegen = achse_winkel(X, -90)
        ruecken = _ruecken_tief(self.koerper, rig.kopf["upperleg01.L"].z - 0.2, rig.kopf["neck01"].z - 0.04)
        self.verschiebung = Vector((0, self.SCHULTER_Y - rig.kopf["upperarm01.L"].z, self.BANK_OBEN - rig.versatz.z + ruecken))
        rig.zuruecksetzen()
        self._torso()
        rig.anwenden()
        tief = min(p.z for p in _netz(self.koerper) if abs(p.x) < 0.15 and -0.55 < p.y < 0.58)
        self.verschiebung.z += self.BANK_OBEN - tief - 0.004

    def _fuesse(self) -> None:
        """Füße flach am Boden, Knie im Winkel `KNIE` (wie beim Bankdrücken mit Langhantel)."""
        rig = self.rig
        A0 = rig.kopf["foot.L"]
        rig.zuruecksetzen()
        self._torso()
        H = rig.punkt("pelvis.L", rig.kopf["upperleg01.L"])
        H0, K0 = rig.kopf["upperleg01.L"], rig.kopf["lowerleg01.L"]
        l1, l2 = (K0 - H0).length, (A0 - K0).length
        d = math.sqrt(l1 * l1 + l2 * l2 - 2 * l1 * l2 * math.cos(math.radians(self.KNIE)))
        x = self.FUESSE * self.mass
        dy = math.sqrt(max(d * d - (x - H.x) ** 2 - (A0.z - H.z) ** 2, 0.0))
        self.knoechel = {"L": Vector((x, H.y - dy, A0.z)), "R": Vector((-x, H.y - dy, A0.z))}

    def _bank_achsen(self) -> tuple[Vector, Vector]:
        """Richtungen der Bank unter dem Rücken (Welt): längs zum Gesäß und senkrecht aus dem Polster heraus."""
        a = math.radians(self.LEHNE)
        return Vector((0, -math.cos(a), -math.sin(a))), Vector((0, -math.sin(a), math.cos(a)))

    def _armlaengen(self) -> tuple[float, float]:
        k = self.rig.kopf
        return (k["lowerarm01.L"] - k["upperarm01.L"]).length, (k["wrist.L"] - k["lowerarm01.L"]).length

    def _richtung_unten(self) -> Vector:
        """Oberarm links unten (Welt): `ALPHA` vom Rumpf zur Seite und so weit unter die Ebene der Bank, dass der Griff
        senkrecht zur Bank gleich weit über dem Schultergelenk liegt wie auf der Flachbank mit `BETA_UNTEN`
        (Unterarm senkrecht, Griff `HAND` über dem Handgelenk). Flach ist das `BETA_UNTEN`; auf der Schrägbank steht
        der senkrechte Unterarm schräg zur Lehne, der Oberarm geht dann weniger tief unter die Lehne."""
        l1, l2 = self._armlaengen()
        a = math.radians(self.LEHNE)
        tief = math.asin(max(-1.0, min(1.0, math.sin(math.radians(self.BETA_UNTEN)) - (l2 + self.HAND) * (1 - math.cos(a)) / l1)))
        laengs, n = self._bank_achsen()
        seite = math.radians(self.ALPHA)
        return (laengs * math.cos(seite) + X * math.sin(seite)) * math.cos(tief) - n * math.sin(tief)

    def _ziele(self, mitte: Vector, x: float) -> dict:
        return {"L": mitte + X * (x * self.mass), "R": mitte - X * (x * self.mass)}

    def _pose(self, mitte: Vector, x: float) -> dict:
        """Rumpf, Beine und beide Arme an die Griffe (`mitte`, Abstand `x` vor dem Maß der Schultern); Hanteln an die
        Griffe. Gibt die Werte der Arme zurück."""
        rig = self.rig
        rig.zuruecksetzen()
        self._torso()
        hz = Vector((0.15, 0, 1)).normalized()
        for s, sx in (("L", 1), ("R", -1)):
            rig.bein(s, self.knoechel[s], Vector((hz.x * sx, -0.1, hz.z)), 6.0)
        ziele = self._ziele(mitte, x)
        arme = {s: rig.arm(s, self.griff[s], ziele[s], X * sx, Vector((0, 0, -1)), self.STRECKUNG, ellbogen=self._regel(s))
                for s, sx in (("L", 1), ("R", -1))}
        for s in "LR":
            self.hanteln[s].location = rig.welt(ziele[s])
        return arme

    def _handgelenk(self, s: str, beta: float) -> Vector:
        """Handgelenk bei senkrechtem Unterarm: Oberarm vom Schultergelenk `alpha_welt` zur Seite (waagrecht, 0 = längs
        zu den Füßen) und `beta` Grad unter die Waagrechte; der Unterarm steht senkrecht darüber."""
        rig = self.rig
        x = 1 if s == "L" else -1
        S = rig.punkt("shoulder01." + s, rig.kopf["upperarm01." + s])
        l1, l2 = self._armlaengen()
        a, b = math.radians(self.alpha_welt), math.radians(beta)
        d = Vector((x * math.sin(a) * math.cos(b), -math.cos(a) * math.cos(b), -math.sin(b)))
        return S + d * l1 + Z * l2

    def _pose_beta(self, beta: float) -> dict:
        """Haltung mit dem Oberarm `beta` unter der Waagrechten und senkrechtem Unterarm."""
        return self._pose_handgelenk({s: self._handgelenk(s, beta) for s in "LR"})

    def _bogen(self, beta: float) -> tuple[float, float]:
        """Handgelenk bei senkrechtem Unterarm und Oberarm `beta` unter der Waagrechten: Abstand waagrecht vom
        Schultergelenk (in der Richtung `alpha_welt`) und Höhe über ihm."""
        l1, l2 = self._armlaengen()
        b = math.radians(beta)
        return l1 * math.cos(b), l2 - l1 * math.sin(b)

    def _handgelenk_rh(self, s: str, r: float, h: float) -> Vector:
        """Handgelenk `r` waagrecht vom Schultergelenk in der Richtung `alpha_welt` und `h` über ihm."""
        rig = self.rig
        x = 1 if s == "L" else -1
        S = rig.punkt("shoulder01." + s, rig.kopf["upperarm01." + s])
        a = math.radians(self.alpha_welt)
        return S + Vector((x * math.sin(a) * r, -math.cos(a) * r, h))

    def _bahn_rh(self) -> list[tuple[float, float]]:
        """Untere Bahn des Handgelenks als (Abstand waagrecht vom Schultergelenk, Höhe über ihm), vom `ANSCHLUSS` am
        Bogen mit senkrechtem Unterarm bis unten (D-463): kubische Kurve (Bézier) vom Punkt unten, nach oben leicht nach
        innen (`EINWAERTS`), zum Bogen mit dessen Richtung. Ihre Stützpunkte werden nach oben nur enger und höher,
        damit auch die Kurve: Die Hanteln werden nach oben nie breiter und rücken nie zu den Füßen."""
        rB, hB = self._bogen(self.beta_unten)
        rP, hP = self._bogen(self.ANSCHLUSS)
        steigung = math.tan(math.radians(self.ANSCHLUSS))  # dr/dh am Bogen, nach oben (negativ)
        a = (hP - hB) / 3
        P1 = (rB - self.EINWAERTS * a, hB + a)
        b = min((hP - hB) / 3, 0.9 * (P1[0] - rP) / abs(steigung))
        P2 = (rP - b * steigung, hP - b)
        bahn = []
        for i in range(self.PROBEN + 1):
            t = 1 - i / self.PROBEN  # 1 = Anschluss, 0 = unten
            g = ((1 - t) ** 3, 3 * (1 - t) ** 2 * t, 3 * (1 - t) * t * t, t ** 3)
            bahn.append((g[0] * rB + g[1] * P1[0] + g[2] * P2[0] + g[3] * rP, g[0] * hB + g[1] * P1[1] + g[2] * P2[1] + g[3] * hP))
        return bahn

    def _pose_handgelenk(self, W: dict) -> dict:
        """Haltung mit den Handgelenken bei `W` (je Seite): Ziel der Griffe so, dass das Handgelenk dort liegt (der
        Versatz Handgelenk → Griff kommt aus dem Rig, bis auf 0,2 mm nachgeführt, immer vom selben Start). Der
        Ellbogen folgt der Regel „Unterarm so senkrecht wie möglich“."""
        versatz = Vector((0, 0.0, self.HAND))
        for _ in range(8):
            H = {s: W[s] + Vector((versatz.x * (1 if s == "L" else -1), versatz.y, versatz.z)) for s in "LR"}
            mitte = Vector((0, (H["L"].y + H["R"].y) / 2, (H["L"].z + H["R"].z) / 2))
            x = (H["L"].x - H["R"].x) / 2
            arme = self._pose(mitte, x / self.mass)
            fehler = W["L"] - arme["L"]["handgelenk"]
            if fehler.length < 2e-4:
                break
            versatz = versatz + fehler
        return {"arme": arme, "mitte": mitte, "x": x / self.mass}

    def _oben_suchen(self, S: Vector) -> None:
        """Oben wie mit der Langhantel: Griffe senkrecht über den Schultergelenken, Ellbogen knapp nicht gestreckt."""
        rig = self.rig
        lo, hi = S.z, S.z + 0.75
        for _ in range(28):
            z = (lo + hi) / 2
            rig.meldungen.clear()
            arme = self._pose(Vector((0, S.y, z)), self.X_OBEN)
            if max(a["ellbogenwinkel"] for a in arme.values()) < self.ELLBOGEN_OBEN and not rig.meldungen:
                lo = z
            else:
                hi = z
        self.oben = Vector((0, S.y, lo))

    def _koepfe_frei(self) -> float:
        self.rig.anwenden()
        return min(abstand_koerper(self.koerper, kopf_punkte(self.hanteln[s], 3)) for s in "LR")

    def _unten_suchen(self) -> None:
        """Unten: Oberarm wie `_richtung_unten`, höher nur, wenn der innere Kopf sonst näher als `LUFT` an den Körper
        käme."""
        rig = self.rig
        rig.meldungen.clear()
        self._pose_beta(self.beta_welt_unten)
        if self._koepfe_frei() >= self.LUFT and not rig.meldungen:
            self.beta_unten = self.beta_welt_unten
            rig.meldungen.clear()
            return
        lo, hi = -20.0, self.beta_welt_unten
        for _ in range(16):
            beta = (lo + hi) / 2
            rig.meldungen.clear()
            self._pose_beta(beta)
            if self._koepfe_frei() >= self.LUFT and not rig.meldungen:
                lo = beta
            else:
                hi = beta
        self.beta_unten = lo
        rig.meldungen.clear()

    def _bahn(self) -> None:
        """Stützstellen der Bahn (Mitte und Breite der Griffe), die Griffe sinken gleichmäßig (Höhe linear in der Phase),
        D-463. Unten die Bahn des Handgelenks aus `_bahn_rh`; oben eine kubische Kurve der Griffe vom `ANSCHLUSS` zum
        Ausgang über den Schultern, die in Richtung des Bogens beginnt und in Richtung der Sehne endet. Breite und Lage
        längs werden nach oben nur kleiner. Bis D-462: Bogen mit senkrechtem Unterarm (in der Mitte breiter als unten)
        und oben ein gerades Stück, auf dem die Hanteln auf 1,5 cm Höhe 8 cm zum Kopf schwenkten."""
        rig = self.rig
        rig.zuruecksetzen()
        self._torso()
        d = self._richtung_unten()
        self.alpha_welt = math.degrees(math.atan2(d.x, -d.y))
        self.beta_welt_unten = math.degrees(math.asin(-d.z))
        self._oben_suchen(self._schultern())
        self._unten_suchen()

        def punkt(erg: dict) -> Vector:  # Griff links als Punkt: Breite (m), Lage längs, Höhe
            return Vector((erg["x"] * self.mass, erg["mitte"].y, erg["mitte"].z))

        unten = [punkt(self._pose_handgelenk({s: self._handgelenk_rh(s, r, h) for s in "LR"})) for r, h in self._bahn_rh()]
        G0 = unten[0]
        ueber = punkt(self._pose_beta(self.ANSCHLUSS - 2.0))  # Richtung des Bogens über dem Anschluss
        G3 = Vector((self.X_OBEN * self.mass, self.oben.y, self.oben.z))
        sehne = (G3 - G0).length
        G1 = G0 + (ueber - G0).normalized() * (sehne / 3)
        G2 = G3 - (G3 - G0) / 3

        def oben_kurve(t: float) -> Vector:
            return (1 - t) ** 3 * G0 + 3 * (1 - t) ** 2 * t * G1 + 3 * (1 - t) * t * t * G2 + t ** 3 * G3

        self.unten = Vector((0, unten[-1].y, unten[-1].z))
        self.stuetzen = []
        for i in range(self.STUETZEN):
            z = self.oben.z + (self.unten.z - self.oben.z) * i / (self.STUETZEN - 1)
            if z >= G0.z:
                lo, hi = 0.0, 1.0
                for _ in range(40):
                    m = (lo + hi) / 2
                    if oben_kurve(m).z < z:
                        lo = m
                    else:
                        hi = m
                q = oben_kurve((lo + hi) / 2)
            else:
                k = next((k for k in range(len(unten) - 1) if unten[k + 1].z <= z), len(unten) - 2)
                q0, q1 = unten[k], unten[k + 1]
                q = q0.lerp(q1, (q0.z - z) / (q0.z - q1.z) if q0.z > q1.z else 1.0)
            self.stuetzen.append((Vector((0, q.y, z)), q.x / self.mass))
        rig.meldungen.clear()

    def _stuetze(self, p: float) -> tuple[Vector, float]:
        f = p * (self.STUETZEN - 1)
        i = min(int(f), self.STUETZEN - 2)
        t = f - i
        (m0, x0), (m1, x1) = self.stuetzen[i], self.stuetzen[i + 1]
        return m0.lerp(m1, t), x0 * (1 - t) + x1 * t

    def haltung(self, p: float) -> None:
        rig = self.rig
        B, x = self._stuetze(p)
        self._torso()
        hz = Vector((0.15, 0, 1)).normalized()
        for s, sx in (("L", 1), ("R", -1)):
            rig.bein(s, self.knoechel[s], Vector((hz.x * sx, -0.1, hz.z)), 6.0)
        ziele = self._ziele(B, x)
        A = None
        for s, sx in (("L", 1), ("R", -1)):
            arm = rig.arm(s, self.griff[s], ziele[s], X * sx, Vector((0, 0, -1)), self.STRECKUNG, ellbogen=self._regel(s))
            self.hanteln[s].location = rig.welt(ziele[s])
            A = arm if s == "L" else A
        oberarm = (A["ellbogen"] - A["schulter"]).normalized()
        laengs = (rig.punkt("spine05", rig.kopf["spine05"]) - rig.punkt("spine01", rig.kopf["spine01"])).normalized()
        bank_laengs, bank_normale = self._bank_achsen()
        unter = math.degrees(math.asin(max(-1.0, min(1.0, -oberarm.dot(bank_normale)))))
        H = rig.punkt("upperleg01.L", rig.kopf["upperleg01.L"])
        K = rig.punkt("lowerleg01.L", rig.kopf["lowerleg01.L"])
        F = rig.punkt("foot.L", rig.kopf["foot.L"])
        self.werte = {
            "Kniewinkel (Grad)": math.degrees((H - K).angle(F - K)),
            "Ellbogenwinkel": A["ellbogenwinkel"],
            "Oberarm zum Rumpf": math.degrees(oberarm.angle(laengs)),
            "Oberarm unter der Ebene der Bank (Grad)": unter,
            # nur, solange der Ellbogen unter der Ebene der Bank ist; darüber zeigt der Arm nach oben
            "Oberarm vom Rumpf zur Seite, Ellbogen unter der Bank (Grad)":
                math.degrees(math.atan2(abs(oberarm.dot(X)), oberarm.dot(bank_laengs))) if unter >= 0 else float("nan"),
            "Unterarm zur Senkrechten": math.degrees((A["handgelenk"] - A["ellbogen"]).angle(Z)),
            "Handgelenk geknickt": A["handgelenk_knick"],
            "Handgelenk gesamt (Grad)": A["handgelenk_gesamt"],
            "Handgelenk gestreckt (Grad)": A["handgelenk_streckung"],
            "Handgelenk seitlich (Grad, + zum Daumen)": A["handgelenk_seitlich"],
            "Griff über Schulter (cm, y)": (B.y - self._schultern().y) * 100,
            "Griff über unten (cm)": (B.z - self.unten.z) * 100,
            "Griffe auseinander (cm)": 2 * x * self.mass * 100,
            "Ellbogen von der Mitte (cm)": A["ellbogen"].x * 100,
            "Köpfe innen auseinander (cm)": (2 * x * self.mass - geraete.KH["laenge"]) * 100,
        }

    def zusatzwerte(self) -> dict:
        """Durchdringungen in der aktuellen Haltung (mm): Köpfe der Hanteln zum Körper, Hand zu den Köpfen, Körper im
        Polster der Bank."""
        aus = {"Kurzhantel: Köpfe über dem Körper (mm)":
               min(abstand_koerper(self.koerper, kopf_punkte(self.hanteln[s], 4)) for s in "LR") * 1000,
               "Kurzhantel: Hand zu den Köpfen (mm)": hand_zu_koepfen(self.koerper, self.hanteln) * 1000}
        aus.update(polster_werte(self.koerper, self.polster_objekte()))
        return aus


class SchraegbankdrueckenKH(BankdrueckenKH):
    """Schrägbankdrücken mit Kurzhanteln auf der verstellbaren Bank, Lehne 30°, Sitz flach (D-462).

    Gesäß auf dem Sitz am Gelenk, Rücken und Schulterblätter an der Lehne (je 4 mm im Polster), Füße flach am
    Boden. Arme wie beim Bankdrücken mit Kurzhanteln: oben senkrecht über den Schultergelenken, Unterarme senkrecht,
    Oberarm unten 50° vom Rumpf zur Seite (in der Ebene der Lehne). Unten kommen die Griffe so nah an die Brust wie
    auf der Flachbank, senkrecht zur Lehne gemessen (`_richtung_unten`): seitlich der oberen Brust, der Oberarm rund
    15° unter der Ebene der Lehne."""

    name = "schraegbankdruecken_kh"
    titel = "Schrägbankdrücken mit Kurzhanteln"
    kamera = {"richtung": 45.0, "neigung": 25.0}
    LEHNE = 30.0
    SITZ = 0.0

    def _geraete(self) -> None:
        self.bank = geraete.schraegbank(self.LEHNE, self.SITZ)

    def polster_objekte(self) -> list:
        return [o for o in self.bank.children_recursive if o.name in ("Lehne", "Sitz")]

    def _lage(self) -> None:
        """Rücken an der Lehne, Gesäß auf dem Sitz: Rumpf um die Lehne geneigt, dann so verschoben, dass der Rücken
        4 mm in die Lehne und das Gesäß 4 mm in den Sitz einsinkt (Punkte des Rückens zwischen Hüfte und Hals, des
        Gesäßes um die Hüfte, in der Ruhehaltung ausgewählt)."""
        rig = self.rig
        b = geraete.BANK
        a, s = math.radians(self.LEHNE), math.radians(self.SITZ)
        self.R_liegen = achse_winkel(X, self.LEHNE) @ achse_winkel(X, -90)
        gelenk = Vector((0, 0, b["oben"] - b["dicke"])) - rig.versatz
        n_lehne = Vector((0, -math.sin(a), math.cos(a)))
        d_lehne = Vector((0, math.cos(a), math.sin(a)))
        p_lehne = gelenk + d_lehne * (b["spalt"] / 2) + n_lehne * b["dicke"]
        n_sitz = Vector((0, -math.sin(s), math.cos(s)))
        p_sitz = gelenk + Vector((0, -math.cos(s), math.sin(s))) * (b["spalt"] / 2) + n_sitz * b["dicke"]
        huefte, hals = rig.kopf["upperleg01.L"].z, rig.kopf["neck01"].z
        ruhe = [v.co.copy() for v in self.koerper.data.vertices]
        ruecken_i = [i for i, r in enumerate(ruhe) if abs(r.x) < 0.14 and huefte + 0.12 < r.z < hals - 0.05 and r.y > 0.0]
        gesaess_i = [i for i, r in enumerate(ruhe) if abs(r.x) < 0.17 and huefte - 0.12 < r.z < huefte + 0.06 and r.y > 0.02]
        self.verschiebung = Vector((0, 0.20, 0.80)) - rig.versatz
        for _ in range(8):
            rig.zuruecksetzen()
            self._torso()
            rig.anwenden()
            netz = [rig.lokal(p) for p in _netz(self.koerper)]
            d_r = min((netz[i] - p_lehne).dot(n_lehne) for i in ruecken_i)
            self.verschiebung += n_lehne * (-d_r - 0.004)
            d_s = min((netz[i] + n_lehne * (-d_r - 0.004) - p_sitz).dot(n_sitz) for i in gesaess_i)
            self.verschiebung += d_lehne * ((-d_s - 0.004) / max(d_lehne.dot(n_sitz), 0.2))



# ---------------------------------------------------------------------- Familie „Kniebeuge“: Beinpresse (D-464)


class Beinpresse(Uebung):
    """Beinpresse 45° (Familie „Kniebeuge“, D-464).

    Rücken und Gesäß an Lehne (30° über der Waagrechten) und Sitz, je rund 4 mm im Polster; Hände an den Griffen
    neben dem Sitz, Handgelenke gerade. Füße etwas weiter als hüftbreit, Zehen 15° nach außen, die ganze Sohle flach
    auf der Platte, etwas über deren Mitte. Der Schlitten fährt auf der Schiene unter 45°: Ausgang oben mit fast
    gestreckten Knien (165°, nicht durchgedrückt), Ende unten bei 95° im Knie; die Knie zeigen über die Zehen, die
    Füße bleiben flach auf der Platte. Sprunggelenk unten rund 31° gebeugt, Hüfte rund 63° (Winkel zwischen
    Oberschenkel und Rumpf). Die Füße stehen etwas über der Linie Hüfte–Schiene (`HOEHER`), sonst müsste das
    Sprunggelenk unten über 40° gebeugt sein. Der Schlitten fährt gleichmäßig; aufwärts derselbe Weg zurück."""

    name = "beinpresse"
    titel = "Beinpresse"
    kamera = {"richtung": 115.0, "neigung": 22.0}
    vorschau_phase = 1.0
    LEHNE = 30.0  # Lehne, Grad über der Waagrechten
    SITZ = 15.0  # Sitz steigt nach vorn
    KNIE_OBEN = 165.0
    KNIE_UNTEN = 95.0
    FUESSE = 0.13  # halber Abstand der Fußgelenke vor dem Maß der Schultern, m
    ZEHEN = 15.0  # Füße nach außen gedreht, Grad
    HOEHER = 0.10  # Fußgelenke so weit über der Linie durch die Hüfte längs der Schiene (in der Platte nach oben), m
    ECKE = Vector((0.0, 0.0, 0.40))  # Ecke zwischen den Oberflächen von Sitz und Lehne (Welt), Sitz 40 cm hoch
    GRIFF_R = 0.016
    KNIE_AUSSEN = 0.05
    STRECKUNG = 0.0
    # Prüfansichten (`render.pruefen`, `familie_bilder.py`): Fuß von außen und von der Seite der Person, Griff von
    # außen und von oben
    fuss_ansichten = ((90, 0.0), (180, 0.20), (0, 0.12), (270, 0.0))
    griff_ansichten = (("aussen", 90.0, 25.0), ("oben", 160.0, 60.0))

    def rahmen_objekte(self) -> list:
        return [self.geraet["wurzel"]]

    def polster_objekte(self) -> list:
        return self.geraet["polster"]

    def stange_achse(self):
        # linker Haltegriff (Welt): für den Abstand der Finger zum Griff in `render.messen`
        return self.griff_mitte["L"].copy(), self.griff_achse, self.GRIFF_R

    def bauen(self) -> None:
        super().bauen()
        rig = self.rig
        r = math.radians(45.0)
        self.d = Vector((0, -math.cos(r), math.sin(r)))  # längs der Schiene, von der Person weg
        self.q = Vector((0, math.sin(r), math.cos(r)))  # in der Platte nach oben
        self.R_fuss = achse_winkel(X, -135.0)  # Boden → Platte: vorn (−y) wird +q, oben (+z) wird −d
        self._lage()
        rig.zuruecksetzen()
        self._torso()
        k = rig.kopf
        self.l1 = (k["lowerleg01.L"] - k["upperleg01.L"]).length
        self.l2 = (k["foot.L"] - k["lowerleg01.L"]).length
        self.huefte = {s: rig.punkt("pelvis." + s, k["upperleg01." + s]) for s in "LR"}
        x = self.FUESSE * self.mass
        self.basis = {s: Vector((x * (1 if s == "L" else -1), self.huefte[s].y, self.huefte[s].z)) + self.q * self.HOEHER
                      for s in "LR"}
        self.s_oben = self._weg(self.KNIE_OBEN)
        self.s_unten = self._weg(self.KNIE_UNTEN)
        platte = self._sohlenmitte()
        # Griffe schräg neben dem Sitz, vorn oben bis hinten unten: Achse vom Zeigefinger zum kleinen Finger nach
        # hinten unten (gesucht unter Griffen längs, quer, senkrecht und schräg: hier bleibt das Handgelenk am geradesten)
        sitz = math.radians(self.SITZ)
        d_sitz, n_sitz = Vector((0, -math.cos(sitz), math.sin(sitz))), Vector((0, math.sin(sitz), math.cos(sitz)))
        self.griff_achse = (-n_sitz - d_sitz).normalized()
        self.griff_mitte = self._griffe()
        import geraete as g

        self.geraet = g.beinpresse(self.ECKE, self.LEHNE, self.SITZ, platte, (self.s_unten - self.s_oben - 0.05, 0.05),
                                   {s: (m, self.griff_achse) for s, m in self.griff_mitte.items()})
        self.platte0 = platte
        self.schlitten = self.geraet["schlitten"]
        self.M_schlitten0 = self.schlitten.matrix_world.copy()
        self.griff = {s: rig.griff(s, 0.6, self.GRIFF_R, schraeg=0.0) for s in "LR"}

    def _sohlenmitte(self) -> Vector:
        """Mitte der Plattenoberfläche (Welt) unter den Füßen in der Ausgangsstellung: Die Unterkante der Sohle liegt
        in der Grundhaltung so tief unter dem Fußgelenk, wie dieses über dem Boden steht (mit Schuh steht die Figur
        auf der Sohle, D-450); längs der Platte in der Mitte zwischen Ferse und Zehenspitze."""
        rig = self.rig
        k = rig.kopf
        ueber_sohle = k["foot.L"].z + rig.versatz.z
        ferse, spitze = _fuss(self.koerper, k)
        mitte_vor = k["foot.L"].y - (ferse + spitze) / 2  # Fußgelenk bis Mitte des Fußes, nach vorn
        pkte = [rig.welt(self._knoechel(s, self.s_oben)) + self.d * ueber_sohle + self._zehenrichtung(s) * mitte_vor
                for s in "LR"]
        m = (pkte[0] + pkte[1]) / 2
        return Vector((0.0, m.y, m.z))

    def _weg(self, knie: float) -> float:
        """Weg längs der Schiene (von der Linie durch die Hüfte), bei dem das Knie den Winkel `knie` hat."""
        D = math.sqrt(self.l1 ** 2 + self.l2 ** 2 - 2 * self.l1 * self.l2 * math.cos(math.radians(knie)))
        seit = self.basis["L"] - self.huefte["L"]  # quer und in der Platte nach oben, unabhängig vom Weg
        return math.sqrt(max(D * D - seit.length_squared, 0.0))

    def _knoechel(self, s: str, weg: float) -> Vector:
        return self.basis[s] + self.d * weg

    def _zehenrichtung(self, s: str) -> Vector:
        w = math.radians(self.ZEHEN) * (1 if s == "L" else -1)
        return self.R_fuss @ Vector((math.sin(w), -math.cos(w), 0.0))

    def _knierichtung(self, s: str) -> Vector:
        """Richtung, in die das Knie ausweicht: über die Zehen, etwas nach außen (`KNIE_AUSSEN`), damit es über der
        Fußachse bleibt und nicht nach innen fällt."""
        return self._zehenrichtung(s) + X * (self.KNIE_AUSSEN * (1 if s == "L" else -1))

    def _beine(self, weg: float) -> dict:
        rig = self.rig
        return {s: rig.bein(s, self._knoechel(s, weg), self._knierichtung(s), self.ZEHEN, fuss_ebene=self.R_fuss) for s in "LR"}

    def _griffe(self) -> dict:
        """Mitte der Haltegriffe (Welt): neben dem Sitz, auf Höhe der Hüftgelenke, 10 cm vor ihnen."""
        rig = self.rig
        aus = {}
        for s, sx in (("L", 1), ("R", -1)):
            H = rig.welt(self.huefte[s])
            aus[s] = Vector((sx * 0.27, H.y - 0.10, H.z))
        return aus

    def _torso(self) -> None:
        self.rig.setze("root", starr(Vector(), self.verschiebung, self.R_liegen))

    def _lage(self) -> None:
        """Rücken an der Lehne, Gesäß auf dem Sitz (je 4 mm im Polster), wie beim Schrägbankdrücken mit Kurzhanteln:
        Rumpf um die Lehne geneigt, dann verschoben, bis Rücken und Gesäß auf den Ebenen der Polster liegen."""
        rig = self.rig
        a, s = math.radians(self.LEHNE), math.radians(self.SITZ)
        self.R_liegen = achse_winkel(X, self.LEHNE) @ achse_winkel(X, -90)
        ecke = self.ECKE - rig.versatz
        n_lehne = Vector((0, -math.sin(a), math.cos(a)))
        d_lehne = Vector((0, math.cos(a), math.sin(a)))
        n_sitz = Vector((0, math.sin(s), math.cos(s)))
        huefte, hals = rig.kopf["upperleg01.L"].z, rig.kopf["neck01"].z
        ruhe = [v.co.copy() for v in self.koerper.data.vertices]
        ruecken_i = [i for i, r in enumerate(ruhe) if abs(r.x) < 0.14 and huefte + 0.12 < r.z < hals - 0.05 and r.y > 0.0]
        gesaess_i = [i for i, r in enumerate(ruhe) if abs(r.x) < 0.17 and huefte - 0.12 < r.z < huefte + 0.06 and r.y > 0.02]
        self.verschiebung = Vector((0, 0.20, 0.80)) - rig.versatz
        for _ in range(8):
            rig.zuruecksetzen()
            self._torso()
            rig.anwenden()
            netz = [rig.lokal(p) for p in _netz(self.koerper)]
            d_r = min((netz[i] - ecke).dot(n_lehne) for i in ruecken_i)
            self.verschiebung += n_lehne * (-d_r - 0.004)
            d_s = min((netz[i] + n_lehne * (-d_r - 0.004) - ecke).dot(n_sitz) for i in gesaess_i)
            self.verschiebung += d_lehne * ((-d_s - 0.004) / max(d_lehne.dot(n_sitz), 0.2))

    def sohle_ebene(self) -> tuple[Vector, Vector]:
        """Oberfläche der Fußplatte in der aktuellen Stellung (Welt): Punkt und Normale zur Person."""
        M = self.schlitten.matrix_world
        return M.translation.copy(), (M.to_3x3() @ Vector((0, 0, 1))).normalized()

    def haltung(self, p: float) -> None:
        rig = self.rig
        weg = self.s_oben + (self.s_unten - self.s_oben) * p
        self._torso()
        beine = self._beine(weg)
        self.schlitten.matrix_world = Matrix.Translation(self.d * (weg - self.s_oben)) @ self.M_schlitten0
        arme = {}
        for s, sx in (("L", 1), ("R", -1)):
            ziel = rig.lokal(self.griff_mitte[s])
            arme[s] = rig.arm(s, self.griff[s], ziel, self.griff_achse, Vector((sx * 0.6, 0.0, -0.8)).normalized(),
                              self.STRECKUNG)
        L, A = beine["L"], arme["L"]
        rumpf = (rig.punkt("spine01", rig.kopf["spine01"]) - rig.punkt("spine05", rig.kopf["spine05"])).normalized()
        oberschenkel = (L["knie"] - L["huefte"]).normalized()
        schienbein = (L["knie"] - L["knoechel"]).normalized()
        zehen = self._zehenrichtung("L")
        # Knie über der Fußachse: Abstand des Knies von der Ebene durch Fußgelenk, Zehenrichtung und Plattennormale
        n_achse = zehen.cross(self.d).normalized()
        if n_achse.x < 0:
            n_achse = -n_achse
        self.werte = {
            "Kniewinkel (Grad)": self.kniewinkel(L),
            "Hüftwinkel (Grad)": math.degrees(oberschenkel.angle(rumpf)),
            "Sprunggelenk gebeugt (Grad)": 90.0 - math.degrees(schienbein.angle(zehen)),
            "Knie neben der Fußachse (cm, + außen)": (L["knie"] - L["knoechel"]).dot(n_achse) * 100,
            "Schlitten: Weg von oben (cm)": (weg - self.s_oben) * -100,
            "Ellbogenwinkel": A["ellbogenwinkel"],
            "Handgelenk gesamt (Grad)": A["handgelenk_gesamt"],
            "Handgelenk gestreckt (Grad)": A["handgelenk_streckung"],
            "Handgelenk seitlich (Grad, + zum Daumen)": A["handgelenk_seitlich"],
        }

    def zusatzwerte(self) -> dict:
        """Körper im Polster von Lehne und Sitz (mm); Sohle auf der Platte misst `render.messen`."""
        return polster_werte(self.koerper, self.polster_objekte())


UEBUNGEN = {u.name: u for u in (Kniebeuge, Bankdruecken, Latziehen, BankdrueckenKH, SchraegbankdrueckenKH,
                               Beinpresse)}
