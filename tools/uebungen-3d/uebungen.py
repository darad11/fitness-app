"""Die drei Pilot-Übungen auf dem IK-Rig (D-407, D-408).

Jede Übung baut ihre Szene (Figur, Geräte) und rechnet je Phase p (0 = Ausgang,
1 = Endposition) die Haltung aus Zielen: Füße fest am Boden, Hände im Griff an der Stange, Becken
und Rumpf so, dass die Last über der Unterstützungsfläche bleibt. `pruefwerte()` liefert die
Kennwerte für die Qualitätskontrolle (Gelenkwinkel, Abstände, Meldungen des Rigs).
"""
from __future__ import annotations

import math

import bpy
from mathutils import Matrix, Quaternion, Vector

import figur
import geraete
import koerperform
from rig import X, Y, Z, Rig, achse_winkel, ellbogen_zur_richtung, gelenkkreis, senkrecht, starr, um_punkt, winkel_um

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


def auflage_objekte(koerper: bpy.types.Object, *namen: str) -> list:
    """Haut und die Teile der Kleidung (`namen`), die vorhanden sind (D-465)."""
    return [koerper] + [o for o in (bpy.data.objects.get(n) for n in namen) if o]


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

    # Vorfuß (D-467): Übungen, deren Schuhe sich mit den Zehen am Ballen biegen, nennen den Winkel je Fuß in
    # `vorfuss_grad(p)`; der Bogen entsteht beim ersten `setzen`, wenn Socken und Schuhe da sind
    vorfuss = None

    def _vorfuss(self, p: float) -> None:
        if not hasattr(self, "vorfuss_grad") or "Sohle" not in bpy.data.objects:
            return
        if self.vorfuss is None:
            import schuhe

            self.vorfuss = schuhe.Vorfuss(self.koerper, self.skelett)
        self.vorfuss.setze(self.vorfuss_grad(p))

    def setzen(self, p: float) -> None:
        self._vorfuss(p)
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


def _kh(hantel: bpy.types.Object) -> dict:
    """Maße einer Kurzhantel: am Leerobjekt gemerkt (`geraete.kurzhantel`, D-468), sonst `geraete.KH`."""
    if "kh" in hantel:
        laenge, griff, griff_d, kopf = hantel["kh"]
        return {"laenge": laenge, "griff": griff, "griff_d": griff_d, "kopf": kopf}
    return geraete.KH


def kopf_punkte(hantel: bpy.types.Object, schritte: int = 6) -> list[Vector]:
    """Punkte auf der Oberfläche beider Köpfe einer Kurzhantel (Welt), für den Abstand zum Körper."""
    kh = _kh(hantel)
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
    netz = _netz(koerper)
    namen = {g.index: g.name for g in koerper.vertex_groups}
    beste = 1.0
    for s, hantel in hanteln.items():
        kh = _kh(hantel)
        r_in = kh["kopf"] / 2 * math.cos(math.radians(30))
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
    """Beinpresse 45° (Familie „Kniebeuge“, D-464, D-465).

    Sitzend an Lehne (30° über der Waagrechten) und Sitz, in der Haltung des Sitzens (`_torso`): Die Lende liegt an
    jeder Stelle an der Lehne, das Gesäß in jeder Phase auf dem Sitz, Kopf an der Lehne; das Becken bleibt fest, die
    Polster geben unter Haut und Kleidung nach (`setzen`). Hände an den Griffen neben dem Sitz, Handgelenke gerade.
    Füße etwas weiter als hüftbreit, Zehen 15° nach außen, die ganze Sohle flach auf der Platte, etwas über deren
    Mitte. Der Schlitten fährt auf der Schiene unter 45°: Ausgang oben mit fast gestreckten Knien (165°, nicht
    durchgedrückt), Ende unten bei 95° im Knie; die Knie zeigen über die Zehen, die Füße bleiben flach auf der Platte.
    Sprunggelenk unten rund 31° gebeugt, Hüfte rund 59° (Winkel zwischen Oberschenkel und Rumpf), das Hüftgelenk
    gegenüber dem Becken rund 107°. Die Füße stehen etwas über der Linie Hüfte–Schiene (`HOEHER`), sonst müsste das
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
    LENDE = 25.0  # Lende so viel flacher als im Stand, Grad (D-465)
    KIPP = 9.0  # Rumpf unterhalb des oberen Brustkorbs gegenüber der Lehne gedreht, Lende zur Lehne hin, Grad (D-465)
    BRUST = 10.0  # oberer Brustkorb dagegen gestreckt, Schultern zur Lehne, Grad (D-465)
    KOPF = 14.0  # Kopf zurück an die Lehne: Hals gestreckt, Kopf ebenso weit gebeugt, Blick wie zuvor, Grad (D-465)
    GESAESS = 0.004  # Gesäß so tief im Sitz, in der Phase mit dem geringsten Wert, m (D-465)
    RUECKEN = 0.002  # Lende so tief in der Lehne, an der Stelle mit dem geringsten Wert, m (D-465)
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
        k = rig.kopf
        self.l1 = (k["lowerleg01.L"] - k["upperleg01.L"]).length
        self.l2 = (k["foot.L"] - k["lowerleg01.L"]).length
        self._lage()
        self._sitzen()
        rig.zuruecksetzen()
        self._torso()
        self._beingeometrie()
        # Punkte für die Messwerte (Ruhehaltung, D-465): Gesäß wie in `_sitzen`, Lende, Kreuzbein, oberer Rücken
        huefte = k["upperleg01.L"].z
        ruhe = [v.co for v in self.koerper.data.vertices]
        self.gesaess_i = [i for i, r in enumerate(ruhe) if abs(r.x) < 0.17 and huefte - 0.12 < r.z < huefte + 0.06 and r.y > 0.02]
        # Lende (12 bis 26 cm über den Hüftgelenken) in Streifen zu 2 cm, Kreuzbein darunter (0 bis 12 cm)
        self.lenden_baender = [[i for i, r in enumerate(ruhe) if abs(r.x) < 0.10 and r.y > 0.0
                                and huefte + z / 100 <= r.z < huefte + (z + 2) / 100] for z in range(12, 26, 2)]
        self.kreuz_i = [i for i, r in enumerate(ruhe) if abs(r.x) < 0.10 and r.y > 0.0 and huefte <= r.z < huefte + 0.12]
        self.brust_i = [i for i, r in enumerate(ruhe) if abs(r.x) < 0.14 and r.y > 0.0 and huefte + 0.26 <= r.z < huefte + 0.50]
        self.becken0 = self._becken()
        self.oberschenkel_ruhe = (k["lowerleg01.L"] - k["upperleg01.L"]).normalized()
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
        # Sitz und Lehne geben unter dem Körper nach (D-465): dichtes Netz, je Haltung eingedrückt (`setzen`)
        self.polster_ruhe = {o.name: g.weiches_polster(o) for o in self.geraet["polster"]}
        self.delle = 0.0
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
        """Rumpf an der Lehne in der Haltung des Sitzens (D-465), in der ganzen Schleife gleich: Lende `LENDE` flacher
        als im Stand (das Becken kippt gegenüber dem Brustkorb nach hinten, die drei Lendenwirbel beugen sich je um ein
        Drittel), Rumpf unterhalb des oberen Brustkorbs `KIPP` zur Lehne gedreht, oberer Brustkorb `BRUST` gestreckt
        (Schultern an der Lehne), Kopf zurück an die Lehne (`KOPF`, Blick wie zuvor). So liegt auch der untere Rücken
        an."""
        rig = self.rig
        rig.setze("root", starr(Vector(), self.verschiebung, self.R_liegen @ achse_winkel(X, self.KIPP - self.LENDE)))
        for n in ("spine05", "spine04", "spine03"):
            rig.dreh(n, achse_winkel(X, self.LENDE / 3))
        if self.BRUST:
            rig.dreh("spine01", achse_winkel(X, -self.BRUST))
        if self.KOPF:
            rig.dreh("neck01", achse_winkel(X, -self.KOPF))
            rig.dreh("head", achse_winkel(X, self.KOPF))

    def _beingeometrie(self) -> None:
        """Hüftgelenke, Fußgelenke auf der Platte und Weg des Schlittens zur aktuellen Lage des Rumpfs."""
        rig = self.rig
        k = rig.kopf
        self.huefte = {s: rig.punkt("pelvis." + s, k["upperleg01." + s]) for s in "LR"}
        x = self.FUESSE * self.mass
        self.basis = {s: Vector((x * (1 if s == "L" else -1), self.huefte[s].y, self.huefte[s].z)) + self.q * self.HOEHER
                      for s in "LR"}
        self.s_oben = self._weg(self.KNIE_OBEN)
        self.s_unten = self._weg(self.KNIE_UNTEN)

    def _sitzen(self) -> None:
        """Gesäß auf den Sitz (D-465). Mit gebeugter Hüfte liegt die Haut unter dem Becken anders als im Stand, darum
        mit den Beinen der Schleife gemessen (fünf Phasen). Der Rumpf gleitet längs der Lehne, der Rücken bleibt an
        ihr, bis die tiefste Stelle über dem Sitz auch in der Phase mit dem geringsten Wert `GESAESS` im Polster liegt.
        Es zählt das Gesäß über der Fläche des Sitzes (wie in `zusatzwerte`)."""
        rig = self.rig
        a, s = math.radians(self.LEHNE), math.radians(self.SITZ)
        n_sitz, d_sitz = Vector((0, math.sin(s), math.cos(s))), Vector((0, -math.cos(s), math.sin(s)))
        d_lehne = Vector((0, math.cos(a), math.sin(a)))
        ecke = self.ECKE - rig.versatz
        laenge, breite = geraete.BEINPRESSE["sitz"], geraete.BEINPRESSE["polster_breite"]
        huefte = rig.kopf["upperleg01.L"].z
        ruhe = [v.co for v in self.koerper.data.vertices]
        gesaess_i = [i for i, r in enumerate(ruhe) if abs(r.x) < 0.17 and huefte - 0.12 < r.z < huefte + 0.06 and r.y > 0.02]
        for schritt in range(9):
            tiefen = []
            for p in (0.0, 0.25, 0.5, 0.75, 1.0):
                rig.zuruecksetzen()
                self._torso()
                self._beingeometrie()
                self._beine(self.s_oben + (self.s_unten - self.s_oben) * p)
                rig.anwenden()
                netz = _netz(self.koerper)
                tief = -1.0
                for i in gesaess_i:
                    r = rig.lokal(netz[i]) - ecke
                    t = self._tiefe(r.x, r.dot(d_sitz) - 0.01 - laenge / 2, r.dot(n_sitz), breite / 2, laenge / 2, 0.0)
                    if t is not None:
                        tief = max(tief, t)
                tiefen.append(tief)
            fehler = self.GESAESS - min(tiefen)
            if abs(fehler) < 1e-4 or schritt == 8:
                break
            self.verschiebung -= d_lehne * (fehler / d_lehne.dot(n_sitz))
        self.sitz_tiefen = tiefen

    def _lage(self) -> None:
        """Rücken an der Lehne (D-465): Rumpf um die Lehne geneigt, dann so verschoben, dass die Lende an jeder Stelle
        anliegt: In Streifen zu 2 cm von 12 bis 26 cm über den Hüftgelenken liegt auch der Streifen mit dem
        geringsten Wert `RUECKEN` im Polster. Brustkorb und Kreuzbein sinken dabei tiefer ein, das Polster gibt dort
        nach (`setzen`). Vorläufig auch das Gesäß auf den Sitz (mit Beinen in Grundhaltung); genau setzt es
        `_sitzen`."""
        rig = self.rig
        a, s = math.radians(self.LEHNE), math.radians(self.SITZ)
        self.R_liegen = achse_winkel(X, self.LEHNE) @ achse_winkel(X, -90)
        ecke = self.ECKE - rig.versatz
        n_lehne = Vector((0, -math.sin(a), math.cos(a)))
        d_lehne = Vector((0, math.cos(a), math.sin(a)))
        n_sitz = Vector((0, math.sin(s), math.cos(s)))
        huefte = rig.kopf["upperleg01.L"].z
        ruhe = [v.co.copy() for v in self.koerper.data.vertices]
        lende = [[i for i, r in enumerate(ruhe) if abs(r.x) < 0.10 and r.y > 0.0 and huefte + z / 100 <= r.z < huefte + (z + 2) / 100]
                 for z in range(12, 26, 2)]
        gesaess_i = [i for i, r in enumerate(ruhe) if abs(r.x) < 0.17 and huefte - 0.12 < r.z < huefte + 0.06 and r.y > 0.02]
        self.verschiebung = Vector((0, 0.20, 0.80)) - rig.versatz
        for _ in range(8):
            rig.zuruecksetzen()
            self._torso()
            rig.anwenden()
            netz = [rig.lokal(p) for p in _netz(self.koerper)]
            d_r = max(min((netz[i] - ecke).dot(n_lehne) for i in band) for band in lende)
            self.verschiebung += n_lehne * (-d_r - self.RUECKEN)
            d_s = min((netz[i] + n_lehne * (-d_r - self.RUECKEN) - ecke).dot(n_sitz) for i in gesaess_i)
            self.verschiebung += d_lehne * ((-d_s - 0.004) / max(d_lehne.dot(n_sitz), 0.2))

    def auflage(self) -> list:
        """Haut, Shirt, Shorts und Haare: liegen an Lehne und Sitz. Die Kleidung entsteht erst nach `bauen`
        (`varianten.ausstatten`), darum je Haltung gesucht."""
        return auflage_objekte(self.koerper, "Shirt", "Shorts", "Haare")

    def setzen(self, p: float) -> None:
        super().setzen(p)
        self.delle = geraete.eindruecken(self.geraet["polster"], self.polster_ruhe, self.auflage())

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
        R_becken = rig.g("root").to_3x3()
        self.werte = {
            "Kniewinkel (Grad)": self.kniewinkel(L),
            "Hüftwinkel (Grad)": math.degrees(oberschenkel.angle(rumpf)),
            "Hüftgelenk gebeugt (Grad, gegenüber dem Stand)": abs(winkel_um(R_becken @ self.oberschenkel_ruhe, oberschenkel,
                                                                            R_becken @ X)),
            "Sprunggelenk gebeugt (Grad)": 90.0 - math.degrees(schienbein.angle(zehen)),
            "Knie neben der Fußachse (cm, + außen)": (L["knie"] - L["knoechel"]).dot(n_achse) * 100,
            "Schlitten: Weg von oben (cm)": (weg - self.s_oben) * -100,
            "Ellbogenwinkel": A["ellbogenwinkel"],
            "Handgelenk gesamt (Grad)": A["handgelenk_gesamt"],
            "Handgelenk gestreckt (Grad)": A["handgelenk_streckung"],
            "Handgelenk seitlich (Grad, + zum Daumen)": A["handgelenk_seitlich"],
        }

    def _becken(self) -> tuple[Vector, Vector]:
        """Mitte der Hüftgelenke und Richtung von dort zum Lendenwirbel `spine03` (Raum des Skeletts)."""
        rig = self.rig
        mitte = (rig.punkt("pelvis.L", rig.kopf["upperleg01.L"]) + rig.punkt("pelvis.R", rig.kopf["upperleg01.R"])) / 2
        return mitte, (rig.punkt("spine03", rig.kopf["spine03"]) - mitte).normalized()

    @staticmethod
    def _im_polster(netz: list[Vector], idx: list[int], polster: bpy.types.Object) -> float:
        """Wie tief die Punkte `idx` höchstens im Polster liegen (m, positiv = im Polster, negativ = Luft darüber),
        gemessen an der Oberfläche vor dem Eindrücken mit gerundeten Kanten; nur Punkte über der Fläche zählen."""
        Mi = polster.matrix_world.inverted()
        bb = [Vector(c) for c in polster.bound_box]
        lo = Vector((min(c.x for c in bb), min(c.y for c in bb), min(c.z for c in bb)))
        hi = Vector((max(c.x for c in bb), max(c.y for c in bb), max(c.z for c in bb)))
        mitte, halb = (lo + hi) / 2, (hi - lo) / 2
        beste = -1.0
        for i in idx:
            q = Mi @ netz[i] - mitte
            t = Beinpresse._tiefe(q.x, q.y, q.z, halb.x, halb.y, halb.z)
            if t is not None:
                beste = max(beste, t)
        return beste

    @staticmethod
    def _tiefe(x: float, y: float, z: float, hx: float, hy: float, hz: float) -> float | None:
        """Tiefe eines Punkts unter der Oberseite eines Polsters (m; Raum des Polsters, Mitte im Ursprung, halbe Maße
        `hx`, `hy`, `hz`), die Kanten um `polster_rund` gerundet; `None`, wenn der Punkt nicht über dem Polster liegt.
        Stetig bis an den Rand, darum springt `_sitzen` nicht, wenn ein Punkt über die Kante wandert."""
        r = geraete.BEINPRESSE["polster_rund"]
        dx, dy = max(abs(x) - (hx - r), 0.0), max(abs(y) - (hy - r), 0.0)
        d = math.hypot(dx, dy)
        if d >= r:
            return None
        return hz - r + math.sqrt(r * r - d * d) - z

    def zusatzwerte(self) -> dict:
        """Körper im Polster von Lehne und Sitz (mm, gemessen an der Oberfläche vor dem Eindrücken); Sohle auf der
        Platte misst `render.messen`. Dazu (D-465): Gesäß im Sitz; unterer Rücken in Streifen zu 2 cm, gezählt der
        Streifen mit dem geringsten Wert (unter 0 mm hieße: dort eine Lücke zur Lehne); Kreuzbein; das Becken
        gegenüber dem Ausgang, verschoben (mm) und gedreht (Grad; einrollen hieße: gedreht); die tiefste Delle der
        Polster und wie weit Haut oder Kleidung noch durch die eingedrückte Oberfläche ragen."""
        aus = polster_werte(self.koerper, self.polster_objekte())
        netz = _netz(self.koerper)
        lehne, sitz = self.polster_objekte()
        aus["Gesäß im Sitz (mm)"] = self._im_polster(netz, self.gesaess_i, sitz) * 1000
        aus["Unterer Rücken im Polster (mm, schwächste Stelle)"] = min(self._im_polster(netz, b, lehne)
                                                                       for b in self.lenden_baender) * 1000
        aus["Kreuzbein im Polster (mm)"] = self._im_polster(netz, self.kreuz_i, lehne) * 1000
        aus["Oberer Rücken im Polster (mm)"] = self._im_polster(netz, self.brust_i, lehne) * 1000
        haare = bpy.data.objects.get("Haare")
        if haare is not None:
            he = haare.evaluated_get(bpy.context.evaluated_depsgraph_get())
            me = he.to_mesh()
            punkte = [he.matrix_world @ v.co for v in me.vertices]
            he.to_mesh_clear()
            aus["Kopf (Haare) in der Lehne (mm)"] = self._im_polster(punkte, range(len(punkte)), lehne) * 1000
        mitte, richtung = self._becken()
        aus["Becken verschoben (mm)"] = (mitte - self.becken0[0]).length * 1000
        aus["Becken gedreht (Grad)"] = math.degrees(richtung.angle(self.becken0[1]))
        aus["Polster: tiefste Delle (mm)"] = self.delle * 1000
        aus["Polster: Haut oder Kleidung durch die Oberfläche (mm)"] = geraete.durch_polster(self.polster_objekte(),
                                                                                           self.auflage()) * 1000
        return aus


class Boden(Uebung):
    """Übungen auf der Gymnastikmatte (Familie „Rumpf“, D-466). Die Matte liegt flach auf dem Boden, Länge längs y,
    Mitte im Ursprung, und gibt unter Körper und Schuhen nach (`geraete.eindruecken`), wie Polster unter Last."""

    sohle_auf = "Matte"

    def matte_bauen(self) -> None:
        self.matte, ruhe = geraete.matte(Vector((0.0, 0.0, 0.0)))
        self.matte_ruhe = {self.matte.name: ruhe}
        self.oben = geraete.MATTE["dicke"]
        self.delle = 0.0
        self.geloest = False

    def auflage(self) -> list:
        """Haut, Kleidung, Haare und Schuhe; die Kleidung entsteht erst nach `bauen`, darum je Haltung gesucht."""
        return auflage_objekte(self.koerper, "Shirt", "Shorts", "Haare", "Sohle", "Schuhe")

    def loesen(self) -> None:
        """Haltung, die Schuhe und Kleidung braucht: beim ersten `setzen`, wenn sie da sind."""

    def setzen(self, p: float) -> None:
        self._vorfuss(p)  # vor `loesen`: Die Haltung hängt davon ab, wie die Schuhe aufsetzen
        if not self.geloest:
            self.geloest = True
            self.loesen()
        super().setzen(p)
        self.delle = geraete.eindruecken([self.matte], self.matte_ruhe, self.auflage(), wand=(0.0, geraete.MATTE["dicke"]))

    def sohle_ebene(self) -> tuple[Vector, Vector]:
        """Oberseite der Matte vor dem Eindrücken (Welt): Punkt und Normale."""
        return Vector((0.0, 0.0, self.oben)), Vector((0.0, 0.0, 1.0))

    def gruppenpunkte(self, *anfaenge: str, ausser: tuple = (), mindestens: float = 0.5) -> list[int]:
        """Punkte des Körpers, deren Gewichte auf Knochen mit diesen Namensanfängen zusammen mindestens `mindestens`
        sind (ohne Knochen, die mit `ausser` beginnen)."""
        namen = {g.index: g.name for g in self.koerper.vertex_groups}
        aus = []
        for v in self.koerper.data.vertices:
            w = sum(g.weight for g in v.groups if namen[g.group].startswith(anfaenge) and not namen[g.group].startswith(ausser or ("\0",)))
            if w >= mindestens:
                aus.append(v.index)
        return aus

    def in_matte(self, netz: list[Vector], idx) -> float:
        """Wie tief die Punkte `idx` höchstens in der Matte liegen (m, Oberseite vor dem Eindrücken; negativ = Luft)."""
        return max((self.oben - netz[i].z for i in idx), default=float("nan"))

    def abflachen(self, ein: float = 0.003) -> None:
        """Gewebe flacht sich beim Liegen ab (D-466): Haut, Shirt, Shorts und Haare legen sich `ein` unter der
        Oberseite der Matte auf eine unsichtbare Fläche, wo sie tiefer lägen (Shrinkwrap „außen“ nach dem Skelett,
        vor der Glättung; die Haut `kleidung.STOFF` darüber, damit sie im Stoff bleibt). Die Matte gibt dort `ein` nach.
        Wie tief sie ohne das lägen, misst `ohne_abflachen`."""
        import kleidung

        me = bpy.data.meshes.new("Liegeflaeche")
        me.from_pydata([(-1.5, -1.5, 0.0), (1.5, -1.5, 0.0), (1.5, 1.5, 0.0), (-1.5, 1.5, 0.0)], [], [[0, 1, 2, 3]])
        flaeche = bpy.data.objects.new("Liegeflaeche", me)
        bpy.context.scene.collection.objects.link(flaeche)
        flaeche.location.z = self.oben - ein
        # unsichtbar für jeden Strahl: Die Prüfansichten und die Schleife setzen `hide_render` aller Objekte neu
        flaeche.hide_render = True
        for art in ("camera", "diffuse", "glossy", "transmission", "volume_scatter", "shadow"):
            setattr(flaeche, f"visible_{art}", False)
        self.flaeche = flaeche
        self.flach = []
        for obj in self.auflage():
            if obj.name in ("Sohle", "Schuhe"):
                continue
            mod = obj.modifiers.new("Abflachen", "SHRINKWRAP")
            mod.target = flaeche
            mod.wrap_method = "PROJECT"
            mod.use_project_z = True
            mod.use_negative_direction = True
            mod.use_positive_direction = True
            mod.wrap_mode = "OUTSIDE"
            mod.offset = kleidung.STOFF if obj == self.koerper else 0.0
            if obj == self.koerper:  # Hände und Arme liegen mit ihrer Haut auf (eigener Kontakt), sie flachen nicht ab
                namen = {g.index: g.name for g in obj.vertex_groups}
                arm = ("upperarm", "lowerarm", "wrist", "metacarpal", "finger")
                gruppe = obj.vertex_groups.new(name="Abflachen")
                gruppe.add([v.index for v in obj.data.vertices
                            if sum(g.weight for g in v.groups if namen[g.group].startswith(arm)) < 0.3], 1.0, "REPLACE")
                mod.vertex_group = "Abflachen"
            # nach dem Skelett (und der Dicke des Stoffs), vor der Glättung
            ziel = next((i for i, m in enumerate(obj.modifiers) if m.type == "SUBSURF"), None)
            if ziel is not None:
                with bpy.context.temp_override(object=obj, active_object=obj):
                    bpy.ops.object.modifier_move_to_index(modifier="Abflachen", index=ziel)
            self.flach.append(mod)

    def ohne_abflachen(self, idx_listen: list) -> list[float]:
        """Wie tief die Punktlisten ohne Abflachen in der Matte lägen (m)."""
        for m in getattr(self, "flach", []):
            m.show_viewport = False
        netz = _netz(self.koerper)
        aus = [self.in_matte(netz, idx) for idx in idx_listen]
        for m in getattr(self, "flach", []):
            m.show_viewport = True
        return aus

    def matte_werte(self) -> dict:
        b = geraete.MATTE
        dg = bpy.context.evaluated_depsgraph_get()
        rand = float("inf")
        for o in self.auflage():  # was aufliegt (bis 2 mm über der Oberseite): Abstand zum Rand der Matte
            oe = o.evaluated_get(dg)
            me = oe.to_mesh()
            for v in me.vertices:
                q = oe.matrix_world @ v.co
                if q.z < self.oben + 0.002:
                    rand = min(rand, b["breite"] / 2 - abs(q.x), b["laenge"] / 2 - abs(q.y))
            oe.to_mesh_clear()
        return {"Matte: Auflage vom Rand (cm, mindestens)": rand * 100,
                "Matte: tiefste Delle (mm)": self.delle * 1000,
                "Matte: Haut, Kleidung oder Schuh durch die Oberfläche (mm)":
                    geraete.durch_polster([self.matte], self.auflage()) * 1000}


class Unterarmstuetz(Boden):
    """Unterarmstütz (Plank), Familie „Rumpf“ (D-466, Freigabe D-467). Bäuchlings über der Matte, Kopf zu −y: Unterarme
    parallel auf der Matte, Ellbogen unter den Schultern (Oberarm senkrecht), Hände flach, Handflächen unten, Finger nach
    vorn (Entscheidung des Produktinhabers; ACE „Front Plank“: „palms down and hands facing forward“); Beine geschlossen
    und gestreckt, auf dem Vorfuß: Der Schuh biegt sich am Ballen mit den Zehen (`VORFUSS`, `schuhe.Vorfuss`), der
    Vorfuß liegt auf der Matte. Der Körper bildet von Kopf bis Fersen eine Linie: Er steigt von den Füßen zu den
    Schultern um den Winkel, bei dem die Schuhe die Matte berühren (`_neigung`). Kopf in Verlängerung des Rumpfs wie im
    Stand. Schleife: Halten mit dezenter Atmung, der Rücken wölbt sich beim Einatmen in der Mitte leicht (`ATMUNG`).
    Bis D-466 lagen die Hände locker zur Faust mit dem Daumen oben, und der Schuh stand starr auf dem Rand der Sohle."""

    name = "unterarmstuetz"
    titel = "Unterarmstütz (Plank)"
    kamera = {"richtung": 62.0, "neigung": 12.0}
    vorschau_phase = 0.0
    # Ellbogen auf der Matte (Welt), Kopf zu −y: Fingerspitzen vorn und Vorfuß hinten gleich weit vom Rand (D-467; bis
    # D-466 −0,479 für Fäuste und Schuhspitzen)
    ELLBOGEN_Y = -0.4228
    FUSS_X = 0.055  # Fußgelenke so weit von der Mitte: Beine geschlossen
    KNIE = 177.0  # Knie fast gestreckt
    SPRUNG = -15.0  # Fuß gegenüber dem Rumpf gedreht, + Spitze zu den Füßen hin (Grad): Fersen nach hinten, Vorfuß auf der Matte
    # Schuh am Ballen gebogen (Grad, D-467): Bei 55° liegt die Sohle vom Ende der Biegezone bis zur Spitze flach auf der
    # Matte (bei 40° stand sie noch auf dem vorderen Teil, die Ferse 141 statt 129 mm hoch)
    VORFUSS = 55.0
    ATMUNG = 1.2  # Atmung: Rücken in der Mitte beim Einatmen leicht gewölbt (Grad)
    TIEF = 0.002  # Unterarm, Hand und Schuhe so tief in der Matte (m)
    fuss_ansichten = ((90, 0.0), (180, 0.10), (0, 0.10), (270, 0.0))
    griff_ansichten = (("unterarm_aussen", 90.0, 8.0), ("unterarm_vorn", 0.0, 25.0))

    def vorfuss_grad(self, p: float) -> dict:
        return {"L": self.VORFUSS, "R": self.VORFUSS}

    def fuss_ziel(self, sohle: list[Vector]) -> Vector:
        """Mitte der Fuß-Nahaufnahmen: über der Mitte der linken Sohle auf der Matte, 6 cm hoch, damit Vorfuß, Biegung
        und Sohle im Bild liegen."""
        unten = [q for q in sohle if q.z < self.oben + 0.002]
        m = sum(unten, Vector()) / len(unten) if unten else min(sohle, key=lambda q: q.z)
        return Vector((m.x, m.y + 0.03, self.oben + 0.06))

    def nah_punkte(self) -> list[Vector]:
        """Punkte für die Nahaufnahme von Unterarm und Hand (linke Seite, Welt)."""
        rig = self.rig
        e = rig.welt(rig.punkt("lowerarm01.L", rig.kopf["lowerarm01.L"]))
        w = rig.welt(rig.punkt("wrist.L", rig.kopf["wrist.L"]))
        spitze = rig.welt(rig.punkt("finger3-3.L", rig.ende["finger3-3.L"]))
        return [e, w, spitze, e + Vector((0, 0, 0.12)), e - Vector((0, 0, 0.04))]

    def bauen(self) -> None:
        super().bauen()
        self.matte_bauen()
        rig = self.rig
        k = rig.kopf
        self.l1 = (k["lowerarm01.L"] - k["upperarm01.L"]).length
        self.l2 = (k["wrist.L"] - k["lowerarm01.L"]).length
        b1, b2 = (k["lowerleg01.L"] - k["upperleg01.L"]).length, (k["foot.L"] - k["lowerleg01.L"]).length
        self.bein_l = math.sqrt(b1 * b1 + b2 * b2 - 2 * b1 * b2 * math.cos(math.radians(self.KNIE)))
        self.unterarm_i = self.gruppenpunkte("lowerarm")
        self.hand_i = self.gruppenpunkte("wrist", "metacarpal")
        vs = self.koerper.data.vertices
        self.finger_i = {(s, f): [i for i in self.gruppenpunkte(f"finger{f}-", mindestens=0.5) if (vs[i].co.x > 0) == (s == "L")]
                         for s in "LR" for f in range(1, 6)}
        self.finger_G: dict[str, Matrix] = {}
        ohne = set(self.unterarm_i) | set(self.gruppenpunkte("wrist", "metacarpal", "finger")) | set(self.gruppenpunkte("foot", "toe", "lowerleg"))
        self.rest_i = [i for i in range(len(self.koerper.data.vertices)) if i not in ohne]
        self.atmung = 0.0
        self.r_e, self.hand_z, self.eps = 0.035, 0.02, 8.0
        self.handgelenk: dict[str, Vector] = {}

    def loesen(self) -> None:
        """Höhe des Ellbogengelenks und des Handgelenks über der Matte: so lange angepasst, bis Unterarm und Hand
        (Handfläche) `TIEF` in der Matte liegen; dazu die Neigung, bei der die Schuhe aufsetzen."""
        rig = self.rig
        for _ in range(8):
            self.eps = self._neigung()
            self.handgelenk = {}
            rig.zuruecksetzen()
            self._haltung_ohne_werte(0.0)
            rig.anwenden()
            netz = _netz(self.koerper)
            ua, ha = self.in_matte(netz, self.unterarm_i), self.in_matte(netz, self.hand_i)
            self.r_e += ua - self.TIEF
            self.hand_z += ha - self.TIEF
            if abs(ua - self.TIEF) < 2e-4 and abs(ha - self.TIEF) < 2e-4:
                break
        # Handgelenke fest auf der Matte: Beim Atmen bewegen sich nur Schultern und Ellbogen
        rig.zuruecksetzen()
        self._haltung_ohne_werte(0.0)
        self.handgelenk = dict(self._ziele)
        self._finger_flach()

    def _finger_flach(self) -> None:
        """Finger flach auf der Matte (D-467): In der Grundhaltung von MakeHuman sind sie leicht gebeugt, der Daumen
        hängt nach unten; mit der Handfläche auf der Matte lägen sie 9 bis 41 mm in ihr. Jedes Glied wird waagrecht
        gestellt (seine Richtung zur Seite bleibt), dann dreht sich der ganze Finger um sein erstes Gelenk, bis er
        `TIEF` in der Matte liegt (Halbierung). Die Hand liegt fest, die Finger bleiben so über die ganze Schleife."""
        from mathutils import Quaternion  # noqa: F401  (Drehung aus rotation_difference)

        rig = self.rig
        self.finger_G = {}
        rig.zuruecksetzen()
        self._haltung_ohne_werte(0.0)
        for s in "LR":
            for f in range(1, 6):
                kette = [f"finger{f}-{j}.{s}" for j in (1, 2, 3)]
                for b in kette:  # Glieder waagrecht, vom Grundglied zur Spitze
                    G = rig.g(b)
                    kopf, ende = G @ rig.kopf[b], G @ rig.ende[b]
                    v = ende - kopf
                    w = Vector((v.x, v.y, 0.0))
                    R = v.normalized().rotation_difference(w.normalized()).to_matrix()
                    rig.setze(b, um_punkt(kopf, R) @ G)
                basis = {b: rig.G[b].copy() for b in kette}
                b0 = kette[0]
                kopf = basis[b0] @ rig.kopf[b0]
                richtung = basis[kette[-1]] @ rig.ende[kette[-1]] - kopf
                achse = Vector((richtung.x, richtung.y, 0.0)).cross(Vector((0.0, 0.0, 1.0))).normalized()

                def tiefe(grad: float) -> float:
                    D = um_punkt(kopf, achse_winkel(achse, grad))
                    for b in kette:
                        rig.setze(b, D @ basis[b])
                    rig.anwenden()
                    return self.in_matte(_netz(self.koerper), self.finger_i[(s, f)])

                lo, hi = -40.0, 40.0  # Grad um die Achse quer zum Finger
                t_lo = tiefe(lo)
                for _ in range(16):
                    mitte = (lo + hi) / 2
                    t_m = tiefe(mitte)
                    if (t_m > self.TIEF) == (t_lo > self.TIEF):
                        lo, t_lo = mitte, t_m
                    else:
                        hi = mitte
                tiefe((lo + hi) / 2)
                for b in kette:
                    self.finger_G[b] = rig.G[b].copy()

    def _R(self) -> Matrix:
        return achse_winkel(X, 90.0 - self.eps)

    def _torso(self) -> None:
        """Rumpf bäuchlings, um `eps` zu den Schultern ansteigend; die Schultergelenke stehen senkrecht über den
        Ellbogen (y = `ELLBOGEN_Y`), so hoch, wie Oberarm und Ellbogen über der Matte (`r_e`) es verlangen."""
        rig = self.rig
        R = self._R()
        rig.setze("root", starr(Vector(), Vector(), R))
        S = (rig.punkt("shoulder01.L", rig.kopf["upperarm01.L"]) + rig.punkt("shoulder01.R", rig.kopf["upperarm01.R"])) / 2
        ziel = rig.lokal(Vector((0.0, self.ELLBOGEN_Y, self.oben + self.r_e + self.l1)))
        rig.setze("root", starr(Vector(), Vector((0.0, ziel.y - S.y, ziel.z - S.z)), R))
        if self.atmung:  # Rücken wölbt sich in der Mitte leicht, Schultern und Becken bleiben fast, wo sie sind
            rig.dreh("spine03", achse_winkel(X, -self.atmung))
            rig.dreh("spine02", achse_winkel(X, self.atmung))

    def _beine(self) -> dict:
        rig = self.rig
        R = self._R()
        unten = R @ Vector((0, 0, -1))
        beine = {}
        for s, sx in (("L", 1), ("R", -1)):
            H = rig.punkt("pelvis." + s, rig.kopf["upperleg01." + s])
            A = H + unten * self.bein_l
            A.x = sx * self.FUSS_X * self.mass
            A = H + (A - H).normalized() * self.bein_l
            beine[s] = rig.bein(s, A, Vector((0, 0, -1)), 3.0, fuss_ebene=R @ achse_winkel(X, self.SPRUNG))
        return beine

    def _spitze(self) -> float:
        """Tiefster Punkt der Sohlen über der Matte (m); ohne Schuhe der Füße."""
        sohle = bpy.data.objects.get("Sohle")
        if sohle is None:
            netz = _netz(self.koerper)
            return min(netz[i].z for i in self.gruppenpunkte("foot", "toe")) - self.oben
        dg = bpy.context.evaluated_depsgraph_get()
        oe = sohle.evaluated_get(dg)
        me = oe.to_mesh()
        z = min((oe.matrix_world @ v.co).z for v in me.vertices)
        oe.to_mesh_clear()
        return z - self.oben

    def _neigung(self) -> float:
        """Neigung des Körpers (Grad), bei der die Schuhe `TIEF` in der Matte liegen (Halbierung)."""
        rig = self.rig
        lo, hi = -5.0, 25.0
        for _ in range(30):
            self.eps = (lo + hi) / 2
            rig.zuruecksetzen()
            self._torso()
            self._beine()
            rig.anwenden()
            if self._spitze() > -self.TIEF:
                lo = self.eps  # Schuhe über der Matte: Körper steiler, die Füße sinken
            else:
                hi = self.eps
        return (lo + hi) / 2

    def _arme(self) -> dict:
        """Unterarme parallel nach vorn: Ellbogen senkrecht unter der Schulter, `r_e` über der Matte, das Handgelenk
        `hand_z` über ihr (beim ersten Mal so gesetzt, danach fest); Hand flach, Handfläche unten, Finger nach vorn."""
        rig = self.rig
        aus = {}
        self._ziele = {}
        for s in "LR":
            S = rig.welt(rig.punkt("shoulder01." + s, rig.kopf["upperarm01." + s]))
            E = Vector((S.x, S.y, self.oben + self.r_e))
            W = self.handgelenk.get(s)
            if W is None:
                dz = (self.oben + self.hand_z) - E.z
                W = E + Vector((0.0, -math.sqrt(max(self.l2 ** 2 - dz * dz, 0.0)), dz))
            self._ziele[s] = W.copy()
            aus[s] = rig.arm_frei(s, rig.lokal(W), E - S, Vector((0.0, 0.0, -1.0)), hand_laengs=Vector((0.0, -1.0, 0.0)))
        for b, G in self.finger_G.items():  # Finger flach, wie in `_finger_flach` gefunden (die Hand liegt fest)
            rig.setze(b, G)
        return aus

    def _haltung_ohne_werte(self, p: float) -> dict:
        self.atmung = self.ATMUNG * p
        self._torso()
        beine = self._beine()
        arme = self._arme()
        return {"beine": beine, "arme": arme}

    def haltung(self, p: float) -> None:
        rig = self.rig
        h = self._haltung_ohne_werte(p)
        L, A = h["beine"]["L"], h["arme"]["L"]
        S = (A["schulter"] + h["arme"]["R"]["schulter"]) / 2
        H = (L["huefte"] + h["beine"]["R"]["huefte"]) / 2
        F = (L["knoechel"] + h["beine"]["R"]["knoechel"]) / 2
        linie = (F - S).normalized()
        quer = linie.cross(X).normalized()  # senkrecht zur Linie, nach oben
        if quer.z < 0:
            quer = -quer
        schienbein = (L["knie"] - L["knoechel"]).normalized()
        zehen = (rig.g("foot.L").to_3x3() @ Vector((0, -1, 0))).normalized()
        ua = {s: (h["arme"][s]["handgelenk"] - h["arme"][s]["ellbogen"]) for s in "LR"}
        self.werte = {
            "Körperlinie: Hüfte über der Linie Schulter–Fußgelenk (cm)": (H - S).dot(quer) * 100,
            "Körper steigt zu den Schultern (Grad)": self.eps,
            "Ellbogen vor der Schulter (cm, + zum Kopf)": (A["schulter"].y - A["ellbogen"].y) * 100,
            "Oberarm zur Senkrechten (Grad)": math.degrees((A["schulter"] - A["ellbogen"]).angle(Vector((0, 0, 1)))),
            "Ellbogenwinkel": A["ellbogenwinkel"],
            "Unterarme zueinander (Grad)": math.degrees(Vector((ua["L"].x, ua["L"].y, 0)).angle(Vector((ua["R"].x, ua["R"].y, 0)))),
            "Handgelenk gesamt (Grad)": A["handgelenk_gesamt"],
            "Handgelenk gestreckt (Grad)": A["handgelenk_streckung"],
            "Handgelenk seitlich (Grad, + zum Daumen)": A["handgelenk_seitlich"],
            "Kniewinkel (Grad)": self.kniewinkel(L),
            "Sprunggelenk gebeugt (Grad)": 90.0 - math.degrees(schienbein.angle(zehen)),
        }

    def zusatzwerte(self) -> dict:
        netz = _netz(self.koerper)
        aus = {"Unterarm auf der Matte (mm)": self.in_matte(netz, self.unterarm_i) * 1000,
               "Hand auf der Matte (mm)": self.in_matte(netz, self.hand_i) * 1000}
        for f in range(1, 6):
            aus[f"Finger {f} auf der Matte (mm, links)"] = self.in_matte(netz, self.finger_i[("L", f)]) * 1000
        aus["Finger auf der Matte (mm, alle)"] = min(self.in_matte(netz, idx) for idx in self.finger_i.values()) * 1000
        aus["Körper sonst über der Matte (mm)"] = -self.in_matte(netz, self.rest_i) * 1000
        aus.update(self.matte_werte())
        return aus


class Crunch(Boden):
    """Crunches, Referenz der Familie „Rumpf“ (D-466, Freigabe D-467). Rückenlage auf der Matte, Kopf zu +y: Hüfte und
    Knie gebeugt (Knie `KNIE`), Füße etwas schmaler als schulterbreit flach auf der Matte. Liegen wie beim Sitzen an der
    Lehne der Beinpresse (D-465): Lende flacher als im Stand (`LENDE`, `KIPP`, `BRUST`), sie liegt an jeder Stelle auf der
    Matte. Kopf und Nacken wie im Stand in Verlängerung der Wirbelsäule (`KOPF` 0): Der Kopf bleibt leicht angehoben, das
    Kinn etwa eine Faust von der Brust (Entscheidung des Produktinhabers, D-467; bis D-466 lag der Kopf auf, Hals 20°
    gestreckt). Bewegung: Der Oberkörper rollt ein, `EINROLLEN` Grad, verteilt auf drei Wirbel (`VERTEILUNG`, von unten
    nach oben), bis die Schulterblätter von der Matte gelöst sind; Lende und Becken bleiben liegen. Arme vor der Brust
    verschränkt (Entscheidung des Produktinhabers, D-467; ExRx „Crunch (arms crossed)“: Handgelenke über Kreuz auf der
    Brust): Handgelenke über Kreuz auf dem oberen Brustbein, der rechte Unterarm auf dem linken, die Hände reichen zur
    Gegenschulter und liegen auf; die Ellbogen zeigen zu den Knien. Die Arme gehen mit dem Brustkorb; beim Einrollen heben
    sich die Ellbogen etwas und die Hände passen ihre Beugung an (`_tabellen`). Bis D-466 lagen die Arme lang neben dem
    Körper."""

    name = "crunch"
    titel = "Crunches"
    kamera = {"richtung": 70.0, "neigung": 16.0}
    vorschau_phase = 1.0
    KNIE = 70.0  # bei 85° stünde der Fuß 44° gestreckt, der Kragen des Schuhs schnitte 0,7 mm in die Socke
    FUESSE = 0.10  # halber Abstand der Fußgelenke vor dem Maß der Schultern, m
    ZEHEN = 8.0
    HUEFTE_Y = 0.0  # Hüftgelenke über der Matte (Welt, y): Kopf und Füße gleich weit vom Rand
    LENDE, KIPP, BRUST, KOPF = 45.0, 9.0, 10.0, 0.0
    RUECKEN = 0.004  # Lende (Stoff) so tief in der Matte, an der Stelle mit dem geringsten Wert, m
    EINROLLEN = 40.0
    VERTEILUNG = (0.0, 0.25, 0.75)  # spine03, spine02, spine01: das Einrollen liegt über der Lende
    # Arme verschränkt (D-467): Handgelenke über Kreuz auf dem Brustbein, Ellbogen nach vorn unten (Pol), der obere
    # Unterarm liegt `AUF` über dem unteren (`_arm_ziele`)
    KREUZ = (0.02, -0.04)  # Handgelenk so weit zur Gegenseite und unter den Schultergelenken auf dem Brustbein (m)
    POL = (0.4, -0.8, -0.8)  # Ellbogen nach unten und vorn, etwas zur Seite: im Liegen zu den Knien und zur Decke
    OBEN, UNTEN = "R", "L"
    AUF = 0.002  # oberer Unterarm in der Ausgangslage so weit über dem unteren (m): beim Einrollen rücken sie bis 1,9 mm zusammen
    fuss_ansichten = ((90, 0.0), (0, 0.10), (180, 0.10), (270, 0.0))
    griff_ansichten = (("ruecken_seite", 90.0, 3.0), ("ruecken_schraeg", 125.0, 6.0))

    def nah_punkte(self) -> list[Vector]:
        """Punkte für die Nahaufnahme: Rumpf vom Becken bis zu den Schultern auf der Matte (Welt), knapp über der Matte
        von der Seite und schräg vom Kopf her; die verschränkten Arme liegen darüber auf der Brust."""
        rig = self.rig
        k = rig.kopf
        h = rig.welt(rig.punkt("root", (k["upperleg01.L"] + k["upperleg01.R"]) / 2))
        return [Vector((0.0, h.y - 0.15, self.oben)), Vector((0.0, h.y + 0.55, self.oben)), Vector((0.0, h.y + 0.20, self.oben + 0.30)),
                Vector((0.15, h.y + 0.20, self.oben)), Vector((-0.15, h.y + 0.20, self.oben))]

    def bauen(self) -> None:
        super().bauen()
        self.matte_bauen()
        rig = self.rig
        k = rig.kopf
        huefte = k["upperleg01.L"].z
        ruhe = [v.co for v in self.koerper.data.vertices]
        self.lenden_baender = [[i for i, r in enumerate(ruhe) if abs(r.x) < 0.10 and r.y > 0.0
                                and huefte + z / 100 <= r.z < huefte + (z + 2) / 100] for z in range(12, 26, 2)]
        self.gesaess_i = [i for i, r in enumerate(ruhe) if abs(r.x) < 0.17 and huefte - 0.12 < r.z < huefte + 0.06 and r.y > 0.02]
        self.kreuz_i = [i for i, r in enumerate(ruhe) if abs(r.x) < 0.10 and r.y > 0.0 and huefte <= r.z < huefte + 0.12]
        self.brust_i = [i for i, r in enumerate(ruhe) if abs(r.x) < 0.14 and r.y > 0.0 and huefte + 0.26 <= r.z < huefte + 0.36]
        self.schulter_i = [i for i, r in enumerate(ruhe) if abs(r.x) < 0.14 and r.y > 0.0 and huefte + 0.36 <= r.z < huefte + 0.50]
        vs = self.koerper.data.vertices
        self.hand_i = {s: [i for i in self.gruppenpunkte("wrist", "metacarpal", "finger") if (vs[i].co.x > 0) == (s == "L")] for s in "LR"}
        self.arm_i = {s: {i for i in self.gruppenpunkte("lowerarm", "wrist", "metacarpal", "finger") if (vs[i].co.x > 0) == (s == "L")}
                      for s in "LR"}
        self.unterarm_i = {s: [i for i in self.gruppenpunkte("lowerarm") if (vs[i].co.x > 0) == (s == "L")] for s in "LR"}
        self.unterarm_nah_i = {s: [i for i in self.gruppenpunkte("lowerarm02") if (vs[i].co.x > 0) == (s == "L")] for s in "LR"}
        self.ellbogen_i = {s: [i for i in self.gruppenpunkte("lowerarm01", "upperarm02") if (vs[i].co.x > 0) == (s == "L")] for s in "LR"}
        self.ganzer_arm_i = {s: {i for i in self.gruppenpunkte("upperarm", "lowerarm", "wrist", "metacarpal", "finger")
                                 if (vs[i].co.x > 0) == (s == "L")} for s in "LR"}
        # Kinn (tiefster Punkt des Gesichts vor dem Hals) und Brustbein (Drosselgrube: vorderster Punkt auf Höhe der
        # Brustbein-Schlüsselbein-Gelenke)
        kopf_i = self.gruppenpunkte("head", "jaw")
        hals_y, hals_z = k["neck01"].y, k["neck01"].z
        self.kinn = min((i for i in kopf_i if abs(ruhe[i].x) < 0.01 and ruhe[i].y < hals_y - 0.04), key=lambda i: ruhe[i].z)
        self.brustbein = min((i for i, r in enumerate(ruhe) if abs(r.x) < 0.01 and abs(r.z - k["clavicle.L"].z) < 0.01),
                             key=lambda i: ruhe[i].y)
        self.l1 = (k["lowerleg01.L"] - k["upperleg01.L"]).length
        self.l2 = (k["foot.L"] - k["lowerleg01.L"]).length
        self.a1 = (k["lowerarm01.L"] - k["upperarm01.L"]).length
        self.a2 = (k["wrist.L"] - k["lowerarm01.L"]).length
        self.ueber_sohle = k["foot.L"].z + rig.versatz.z  # Fußgelenk über der Unterseite der Sohle im Stand
        self.R_liegen = achse_winkel(X, -90.0)
        self.verschiebung = Vector()
        self.einrollen = 0.0
        self._lage()
        rig.zuruecksetzen()
        self._torso()
        self.becken0 = self._becken()
        self.knoechel = self._fuesse()
        self.arm_rel: dict[str, dict] = {}

    def loesen(self) -> None:
        """Gewebe flacht auf der Matte ab; Arme verschränkt (`_arm_ziele`), in der Ausgangslage gesucht."""
        self.abflachen()
        rig = self.rig
        rig.zuruecksetzen()
        self.einrollen = 0.0
        self._torso()
        for s in "LR":
            rig.bein(s, self.knoechel[s], Vector((0, -0.3, 1.0)).normalized(), self.ZEHEN)
        self._arm_ziele()

    @staticmethod
    def _flaeche(punkte: list[Vector], flaechen: list[list[int]]):
        """Suchbaum einer Fläche und die Nummern ihrer Randflächen (an Kanten, die nur eine Fläche hat)."""
        from collections import Counter

        from mathutils.bvhtree import BVHTree

        kanten = Counter((min(a, b), max(a, b)) for f in flaechen for a, b in zip(f, f[1:] + f[:1]))
        rand = {k for k, f in enumerate(flaechen) if any(kanten[(min(a, b), max(a, b))] == 1 for a, b in zip(f, f[1:] + f[:1]))}
        return BVHTree.FromPolygons(punkte, flaechen), rand

    @staticmethod
    def _abstand(flaeche, punkte) -> float:
        """Kleinster Abstand der Punkte über einer Fläche (m, negativ = darin), die Seite nach der Normale der nächsten
        Stelle. Liegt diese auf einer Randfläche (Kragen, Saum, Schnitt am Ellbogen), gilt der Punkt als außen: Dort gibt
        die Normale für Punkte daneben ein falsches Vorzeichen (bis −8,7 mm für Punkte 3 bis 10 cm über dem Shirt, D-467)."""
        bvh, rand = flaeche
        werte = []
        for q in punkte:
            o, n, f, dist = bvh.find_nearest(q, 0.5)
            if o is not None:
                werte.append(dist if f in rand else (q - o).dot(n))
        return min(werte) if werte else float("nan")

    def _shirt(self, ohne: str | None = None):
        """Fläche des Shirts (Welt, ohne Glättung und Dicke); mit `ohne` ohne den Ärmel dieser Seite."""
        import schuhe

        sh = bpy.data.objects["Shirt"]
        pk, pf, _ = schuhe._verformt(sh)
        if ohne:
            namen = {g.index: g.name for g in sh.vertex_groups}
            aermel = {v.index for v in sh.data.vertices if (v.co.x > 0) == (ohne == "L")
                      and sum(g.weight for g in v.groups if namen.get(g.group, "").startswith(("upperarm", "shoulder", "lowerarm"))) >= 0.3}
            pf = [f for f in pf if not any(i in aermel for i in f)]
        return self._flaeche(pk, pf)

    def _zum_shirt(self, idx, netz, seite: str) -> float:
        """Kleinster Abstand der Punkte `idx` des Arms `seite` über dem Shirt ohne dessen eigenen Ärmel (m, negativ =
        im Shirt)."""
        return self._abstand(self._shirt(ohne=seite), [netz[i] for i in idx])

    def _auf_unterarm(self, netz) -> float:
        """Kleinster Abstand des oberen Unterarms (mit Hand) über dem unteren (m, negativ = ineinander)."""
        unten = self.arm_i[self.UNTEN]
        flaeche = self._flaeche(netz, [list(f.vertices) for f in self.koerper.data.polygons if all(i in unten for i in f.vertices)])
        return self._abstand(flaeche, [netz[i] for i in self.arm_i[self.OBEN]])

    def _arm_ziele(self) -> None:
        """Arme verschränkt (D-467; ExRx „Crunch (arms crossed)“: Handgelenke über Kreuz auf der Brust), relativ zum
        Brustkorb (Knochen spine01) gesucht, dann für die ganze Schleife fest. Die Handgelenke liegen über Kreuz auf dem
        Brustbein (`KREUZ`: so weit zur Gegenseite und unter den Schultergelenken), das obere auf dem unteren; die Hände
        folgen dem Unterarm (das Handgelenk knickt nicht zur Seite) und reichen zur Gegenschulter, im Handgelenk gebeugt,
        bis sie auf der Brust liegen. Die Ellbogen zeigen nach vorn unten (im Liegen zur Decke und zu den Knien).
        Gesucht wird jeweils durch Halbierung: die Höhe des unteren Handgelenks (sein Unterarm berührt das Shirt), die
        Beugung der unteren Hand (sie berührt es), die Höhe des oberen Handgelenks (sein Unterarm liegt `AUF` über dem
        unteren), die Beugung der oberen Hand."""
        rig = self.rig
        k = rig.kopf
        G = rig.g("spine01")
        R = G.to_3x3()
        richt = (R @ Vector((0.0, 1.0, 0.0))).normalized()
        sz = (k["upperarm01.L"].z + k["upperarm01.R"].z) / 2
        basis, h, beugen = {}, {"L": 0.02, "R": 0.06}, {"L": 0.0, "R": 0.0}
        self._arm_erg = {}

        def ziele() -> None:
            bvh = self._shirt()[0]
            for s, sx in (("L", 1), ("R", -1)):
                ort, n, _, _ = bvh.ray_cast(rig.welt(G @ Vector((-sx * self.KREUZ[0], -0.4, sz + self.KREUZ[1]))), richt, 1.0)
                n = n.normalized()
                if n.dot(richt) > 0:
                    n = -n
                f = self._arm_erg[s]["handgelenk"] - self._arm_erg[s]["ellbogen"] if s in self._arm_erg else R @ Vector((-sx, 0.0, 0.6))
                laengs = (f - f.dot(n) * n).normalized()
                pol = (R @ Vector((sx * self.POL[0], self.POL[1], self.POL[2]))).normalized()
                basis[s] = {"ort": ort, "n": n, "l": laengs, "pol": pol}

        def halbieren(f, lo: float, hi: float, schritte: int = 14) -> float:
            """Nullstelle einer steigenden Funktion zwischen lo und hi."""
            for _ in range(schritte):
                mitte = (lo + hi) / 2
                if f(mitte) < 0:
                    lo = mitte
                else:
                    hi = mitte
            return (lo + hi) / 2

        def suche(werte: dict, s: str, messen, lo: float, hi: float, groesste: bool = False, phasen: tuple = (0.0,)) -> None:
            """Wert so, dass die Messung in der ungünstigsten der Lagen `phasen` null ist (Abstand: der kleinere; bei der
            Beugung ist die Messung der negative Abstand, also der größere Wert)."""
            def f(wert: float) -> float:
                werte[s] = wert
                _, netze = self._arme_setzen(basis, h, beugen, phasen)
                m = [messen(netz) for netz in netze]
                return max(m) if groesste else min(m)
            werte[s] = halbieren(f, lo, hi)
            self._arme_setzen(basis, h, beugen)

        o, u = self.OBEN, self.UNTEN
        ziele()
        self._arme_setzen(basis, h, beugen)
        for _ in range(3):  # die Richtung der Hände folgt dem Unterarm aus der vorigen Runde
            ziele()
            suche(h, u, lambda netz: self._zum_shirt(self.unterarm_i[u], netz, u), -0.03, 0.10)
            suche(beugen, u, lambda netz: -self._zum_shirt(self.hand_i[u], netz, u), -40.0, 70.0, groesste=True)
            suche(h, o, lambda netz: self._auf_unterarm(netz) - self.AUF, 0.0, 0.15)
            suche(beugen, o, lambda netz: -self._zum_shirt(self.hand_i[o], netz, o), -40.0, 70.0, groesste=True)
        self.arm_runden = 3
        ziele_, _ = self._arme_setzen(basis, h, beugen)
        self.arm_hoehe, self.arm_beugen = dict(h), dict(beugen)
        Gi = G.inverted()
        Ri = Gi.to_3x3()
        self.arm_rel = {s: {"W": Gi @ z["W"], "n": Ri @ z["n"], "l": Ri @ z["l"], "pol": Ri @ z["pol"],
                            "l0": Ri @ basis[s]["l"], "nn": Ri @ basis[s]["n"]} for s, z in ziele_.items()}
        self._tabellen()

    PHASEN_ARME = (0.0, 0.25, 0.5, 0.75, 1.0)

    def _pol(self, s: str, heben: float) -> Vector:
        """Pol des Ellbogens relativ zum Brustkorb (Ruhehaltung von spine01), um `heben` weiter nach vorn."""
        sx = 1 if s == "L" else -1
        return Vector((sx * self.POL[0], self.POL[1] - heben, self.POL[2])).normalized()

    def _tabelle(self, name: str, s: str, p: float) -> float:
        """Wert der Tabelle `name` bei Phase p (linear zwischen den Stützstellen `PHASEN_ARME`)."""
        werte = getattr(self, name)[s]
        stellen = [(q, werte[q]) for q in self.PHASEN_ARME]
        for (p0, w0), (p1, w1) in zip(stellen, stellen[1:]):
            if p <= p1:
                return w0 + (w1 - w0) * (p - p0) / (p1 - p0)
        return stellen[-1][1]

    def _arme_phase(self, p: float, heben: dict, beugen: dict) -> dict:
        """Arme bei Phase p: Handgelenke fest am Brustkorb, Ellbogen um `heben` angehoben, Hände um `beugen` (Grad) zur
        Unterlage gebeugt."""
        rig = self.rig
        G = rig.g("spine01")
        R = G.to_3x3()
        aus = {}
        for s, z in self.arm_rel.items():
            a = math.radians(beugen[s])
            laengs = (z["l0"] * math.cos(a) - z["nn"] * math.sin(a)).normalized()
            flaeche = -(z["nn"] * math.cos(a) + z["l0"] * math.sin(a)).normalized()
            aus[s] = rig.arm_frei(s, G @ z["W"], R @ self._pol(s, heben[s]), R @ flaeche, hand_laengs=R @ laengs)
        return aus

    def _tabellen(self) -> None:
        """Beim Einrollen bewegen sich Brust und Schultern unter den Armen etwas (der Rumpf faltet sich, die Schultern
        lösen sich von der Matte); die Handgelenke bleiben am Brustkorb. Je Phase `PHASEN_ARME` (Halbierung): Der untere
        Ellbogen hebt sich, bis sein Unterarm frei über dem Shirt bleibt; der obere, bis sein Unterarm `AUF` über dem
        unteren und frei über dem Shirt bleibt; jede Hand beugt sich, bis sie das Shirt berührt. Dazwischen linear."""
        rig = self.rig
        o, u = self.OBEN, self.UNTEN
        frei = {s: sorted(set(self.unterarm_i[s]) | set(self.ellbogen_i[s])) for s in "LR"}
        self.arm_heben_tab = {"L": {}, "R": {}}
        self.arm_beugen_tab = {"L": {}, "R": {}}
        heben = {"L": 0.0, "R": 0.0}
        beugen = dict(self.arm_beugen)

        def netz_bei(p: float) -> list:
            rig.zuruecksetzen()
            self.einrollen = self.EINROLLEN * p
            self._torso()
            self._arme_phase(p, heben, beugen)
            rig.anwenden()
            return _netz(self.koerper)

        def halbieren(f, lo: float, hi: float) -> float:
            """Nullstelle einer steigenden Funktion; ist sie bei lo schon nicht negativ, bleibt lo. Wird sie auch bei hi
            nicht null, bleibt der Wert mit dem größeren Ergebnis (der obere Ellbogen hebt sich nicht ohne Nutzen)."""
            f_lo = f(lo)
            if f_lo >= 0:
                return lo
            f_hi = f(hi)
            if f_hi < 0:
                return lo if f_lo >= f_hi - 1e-4 else hi
            for _ in range(14):
                mitte = (lo + hi) / 2
                if f(mitte) < 0:
                    lo = mitte
                else:
                    hi = mitte
            return hi

        for p in self.PHASEN_ARME:
            def f_u(wert: float) -> float:
                heben[u] = wert
                return self._zum_shirt(frei[u], netz_bei(p), u)
            heben[u] = halbieren(f_u, 0.0, 2.0)

            def f_o(wert: float) -> float:
                heben[o] = wert
                netz = netz_bei(p)
                return min(self._auf_unterarm(netz) - self.AUF, self._zum_shirt(frei[o], netz, o))
            heben[o] = halbieren(f_o, 0.0, 2.0)
            for s in (u, o):
                def f_h(wert: float, s=s) -> float:  # steigt mit wert: weniger gebeugt, mehr Luft
                    beugen[s] = -wert
                    return self._zum_shirt(self.hand_i[s], netz_bei(p), s)
                beugen[s] = -halbieren(f_h, -70.0, 40.0)
            for s in "LR":
                self.arm_heben_tab[s][p] = heben[s]
                self.arm_beugen_tab[s][p] = beugen[s]
        rig.zuruecksetzen()
        self.einrollen = 0.0
        self._torso()

    def _arme_setzen(self, basis: dict, h: dict, beugen: dict, phasen: tuple = (0.0,)) -> tuple[dict, list]:
        """Arme auf die Ziele (Welt, Ausgangslage) und je Phase das verformte Netz: Die Ziele hängen am Brustkorb
        (spine01) und gehen mit ihm. Gibt die Ziele der Ausgangslage und die Netze zurück."""
        rig = self.rig
        G0 = rig.g("spine01")
        ziele = {}
        for s in "LR":
            b = basis[s]
            W = b["ort"] + b["n"] * h[s]  # Handgelenk über dem Kreuzungspunkt auf dem Brustbein
            a = math.radians(beugen[s])  # Hand zur Unterlage gebeugt
            laengs = (b["l"] * math.cos(a) - b["n"] * math.sin(a)).normalized()
            ziele[s] = {"W": rig.lokal(W), "n": -(b["n"] * math.cos(a) + b["l"] * math.sin(a)).normalized(), "l": laengs, "pol": b["pol"]}
        netze = []
        for p in phasen:
            if p:
                rig.zuruecksetzen()
                self.einrollen = self.EINROLLEN * p
                self._torso()
            D = rig.g("spine01") @ G0.inverted()
            Dr = D.to_3x3()
            for s, z in ziele.items():
                erg = rig.arm_frei(s, D @ z["W"], Dr @ z["pol"], Dr @ z["n"], hand_laengs=Dr @ z["l"])
                if not p:
                    self._arm_erg[s] = erg
            rig.anwenden()
            netze.append(_netz(self.koerper))
        if any(phasen):  # zurück in die Ausgangslage
            rig.zuruecksetzen()
            self.einrollen = 0.0
            self._torso()
            for s, z in ziele.items():
                rig.arm_frei(s, z["W"], z["pol"], z["n"], hand_laengs=z["l"])
            rig.anwenden()
        return ziele, netze

    def _torso(self) -> None:
        rig = self.rig
        rig.setze("root", starr(Vector(), self.verschiebung, self.R_liegen @ achse_winkel(X, self.KIPP - self.LENDE)))
        for n in ("spine05", "spine04"):
            rig.dreh(n, achse_winkel(X, self.LENDE / 3))
        # spine03 trägt das letzte Drittel der Lende und den ersten Teil des Einrollens
        a3, a2, a1 = (self.einrollen * v for v in self.VERTEILUNG)
        rig.dreh("spine03", achse_winkel(X, self.LENDE / 3 + a3))
        if a2:
            rig.dreh("spine02", achse_winkel(X, a2))
        rig.dreh("spine01", achse_winkel(X, a1 - self.BRUST))
        if self.KOPF:
            rig.dreh("neck01", achse_winkel(X, -self.KOPF))
            rig.dreh("head", achse_winkel(X, self.KOPF))

    def _lage(self) -> None:
        """Lende auf der Matte: in jedem Streifen zu 2 cm (12 bis 26 cm über den Hüftgelenken) liegt das Shirt
        `RUECKEN` tief (die Haut `kleidung.STOFF` darüber), auch im Streifen mit dem geringsten Wert; Hüftgelenke bei
        y = `HUEFTE_Y`."""
        import kleidung

        rig = self.rig
        for _ in range(4):
            rig.zuruecksetzen()
            self._torso()
            rig.anwenden()
            netz = [rig.welt(rig.lokal(q)) for q in _netz(self.koerper)]
            d = max(min(netz[i].z for i in band) for band in self.lenden_baender) - self.oben
            H = rig.welt((rig.punkt("pelvis.L", rig.kopf["upperleg01.L"]) + rig.punkt("pelvis.R", rig.kopf["upperleg01.R"])) / 2)
            self.verschiebung += Vector((0.0, self.HUEFTE_Y - H.y, -d - self.RUECKEN + kleidung.STOFF))

    def _becken(self) -> tuple[Vector, Vector]:
        rig = self.rig
        mitte = (rig.punkt("pelvis.L", rig.kopf["upperleg01.L"]) + rig.punkt("pelvis.R", rig.kopf["upperleg01.R"])) / 2
        return mitte, (rig.punkt("spine04", rig.kopf["spine04"]) - mitte).normalized()

    def _fuesse(self) -> dict:
        """Fußgelenke über der Matte so weit vor den Hüftgelenken, dass das Knie `KNIE` gebeugt ist; die Sohle liegt
        flach auf der Matte (Fußgelenk `ueber_sohle` über ihr)."""
        rig = self.rig
        D = math.sqrt(self.l1 ** 2 + self.l2 ** 2 - 2 * self.l1 * self.l2 * math.cos(math.radians(self.KNIE)))
        aus = {}
        for s, sx in (("L", 1), ("R", -1)):
            H = rig.punkt("pelvis." + s, rig.kopf["upperleg01." + s])
            x = sx * self.FUESSE * self.mass
            z = rig.lokal(Vector((0, 0, self.oben + self.ueber_sohle))).z
            quer = (x - H.x) ** 2 + (z - H.z) ** 2
            aus[s] = Vector((x, H.y - math.sqrt(max(D * D - quer, 0.0)), z))
        return aus

    def _arme(self) -> dict:
        """Arme verschränkt, fest am Brustkorb (spine01): Ziele aus `_arm_ziele`."""
        rig = self.rig
        if not self.arm_rel:
            return {}
        p = self.einrollen / self.EINROLLEN if self.EINROLLEN else 0.0
        return self._arme_phase(p, {s: self._tabelle("arm_heben_tab", s, p) for s in "LR"},
                                {s: self._tabelle("arm_beugen_tab", s, p) for s in "LR"})

    def haltung(self, p: float) -> None:
        rig = self.rig
        self.einrollen = self.EINROLLEN * p
        self._torso()
        beine = {s: rig.bein(s, self.knoechel[s], Vector((0, -0.3, 1.0)).normalized(), self.ZEHEN) for s in "LR"}
        arme = self._arme()
        k = rig.kopf
        L = beine["L"]
        # Oberkörper zur Matte: Linie vom Wirbel spine02 zum Halsansatz
        oben_v = (rig.punkt("neck01", k["neck01"]) - rig.punkt("spine02", k["spine02"])).normalized()
        rumpf = (rig.punkt("spine01", k["spine01"]) - rig.punkt("spine05", k["spine05"])).normalized()
        oberschenkel = (L["knie"] - L["huefte"]).normalized()
        self.werte = {
            "Oberkörper zur Matte (Grad)": math.degrees(math.asin(max(-1.0, min(1.0, oben_v.z)))),
            "Einrollen (Grad)": self.einrollen,
            "Kniewinkel (Grad)": self.kniewinkel(L),
            "Hüftwinkel (Grad)": math.degrees(oberschenkel.angle(rumpf)),
        }
        if arme:
            self.werte["Ellbogenwinkel"] = arme["L"]["ellbogenwinkel"]
            for s, seite in (("L", "links"), ("R", "rechts")):
                self.werte[f"Handgelenk gesamt (Grad, {seite})"] = arme[s]["handgelenk_gesamt"]
                self.werte[f"Handgelenk gestreckt (Grad, {seite})"] = arme[s]["handgelenk_streckung"]
                self.werte[f"Handgelenk seitlich (Grad, {seite}, + zum Daumen)"] = arme[s]["handgelenk_seitlich"]

    def zusatzwerte(self) -> dict:
        """Kontakt zur Matte an der Oberfläche der Kleidung (Haut + `kleidung.STOFF`), positiv = in der Matte: Lende
        in Streifen zu 2 cm (gezählt der mit dem geringsten Wert), Gesäß, Kreuzbein, untere Brustwirbel (26 bis 36 cm
        über den Hüftgelenken) und Schulterblätter (36 bis 50 cm); dazu, wie tief sie ohne Abflachen lägen (so weit
        gibt das Gewebe nach), Hände und Unterarme am Shirt und aufeinander, Kopf, Becken gegenüber dem Ausgang, Kinn zum
        Brustbein und die Matte."""
        import kleidung

        st = kleidung.STOFF
        netz = _netz(self.koerper)
        aus = {
            "Unterer Rücken auf der Matte (mm, schwächste Stelle)": (min(self.in_matte(netz, b) for b in self.lenden_baender) + st) * 1000,
            "Gesäß auf der Matte (mm)": (self.in_matte(netz, self.gesaess_i) + st) * 1000,
            "Kreuzbein auf der Matte (mm)": (self.in_matte(netz, self.kreuz_i) + st) * 1000,
            "Untere Brustwirbel auf der Matte (mm, unter 0 = abgehoben)": (self.in_matte(netz, self.brust_i) + st) * 1000,
            "Schulterblätter auf der Matte (mm, unter 0 = abgehoben)": (self.in_matte(netz, self.schulter_i) + st) * 1000,
        }
        if self.arm_rel:
            aus["Hand links auf dem Shirt (mm, unter 0 = eingedrückt)"] = self._zum_shirt(self.hand_i["L"], netz, "L") * 1000
            aus["Hand rechts auf dem Shirt (mm, unter 0 = eingedrückt)"] = self._zum_shirt(self.hand_i["R"], netz, "R") * 1000
            aus["Unterarm rechts auf dem linken (mm, unter 0 = ineinander)"] = self._auf_unterarm(netz) * 1000
            aus["Unterarme und Hände über dem Shirt (mm, unter 0 = im Shirt)"] = min(
                self._zum_shirt(self.arm_i[s], netz, s) for s in "LR") * 1000

        ohne = self.ohne_abflachen([self.gesaess_i, self.kreuz_i, self.brust_i, self.schulter_i])
        (aus["Gesäß ohne Abflachen (mm)"], aus["Kreuzbein ohne Abflachen (mm)"], aus["Untere Brustwirbel ohne Abflachen (mm)"],
         aus["Schulterblätter ohne Abflachen (mm)"]) = ((w + st) * 1000 for w in ohne)
        haare = bpy.data.objects.get("Haare")
        if haare is not None:
            he = haare.evaluated_get(bpy.context.evaluated_depsgraph_get())
            me = he.to_mesh()
            aus["Kopf (Haare) auf der Matte (mm, unter 0 = abgehoben)"] = (self.oben - min((he.matrix_world @ v.co).z for v in me.vertices)) * 1000
            he.to_mesh_clear()
        mitte, richtung = self._becken()
        aus["Becken verschoben (mm)"] = (mitte - self.becken0[0]).length * 1000
        aus["Becken gedreht (Grad)"] = math.degrees(richtung.angle(self.becken0[1]))
        aus["Kinn zum Brustbein (cm)"] = (netz[self.kinn] - netz[self.brustbein]).length * 100
        aus.update(self.matte_werte())
        return aus


class Seitheben(Uebung):
    """Seitheben mit Kurzhanteln, Referenz der Familie „Schulter und Brust isoliert“ (D-468), nach dem Ausführungstext
    der App (ExRx „Dumbbell Lateral Raise“). Stand etwa hüftbreit, Zehen leicht nach außen, die ganze Sohle am Boden; in
    Hüfte und Knien leicht vorgebeugt (`NEIGUNG`, `KNIE`), Kopf in Verlängerung des Rumpfs. Je Hand eine leichte
    Kurzhantel (`geraete.KH8`, 8 kg), voller Griff mit dem Daumen über den Fingern. Ausgang: Hanteln vor den
    Oberschenkeln, Handflächen zueinander, Ellbogen leicht gebeugt (`ELLBOGEN`) und nach hinten gerichtet; der Arm
    hängt so weit nach vorn, dass die Köpfe der Hanteln `LUFT` vor Körper und Kleidung bleiben (`_ausgang`). Die Arme
    heben sich seitlich, bis die Ellbogen auf Schulterhöhe sind (Oberarm waagrecht, `EBENE` vor der Ebene der
    Schultern); oben liegt der Ellbogen etwas über dem Handgelenk (`TIEFER`), die Handflächen zeigen nach unten. Der
    Arm dreht dabei als Ganzes um das Schultergelenk auf dem kürzesten Weg, ohne Drehung um den Oberarm: Ellbogenwinkel
    und Griff bleiben gleich, der Arm dreht nicht nach außen. Das Schlüsselbein hebt sich oben etwas mit
    (`SCHULTER_HOCH`); Becken und Beine bleiben fest. Abwärts derselbe Weg."""

    name = "seitheben_kh"
    titel = "Seitheben mit Kurzhanteln"
    kamera = {"richtung": 20.0, "neigung": 8.0}
    vorschau_phase = 1.0
    KH_R = geraete.KH8["griff_d"] / 2
    FUESSE = 0.105  # halber Abstand der Fußgelenke, m (vor dem Maß der Schultern): etwa hüftbreit
    ZEHEN = 8.0
    KNIE = 168.0  # Knie leicht gebeugt
    NEIGUNG = 10.0  # Rumpf in der Hüfte leicht vorgeneigt, Grad zur Senkrechten
    ELLBOGEN = 165.0  # Ellbogen leicht gebeugt, über die ganze Bewegung gleich (Familie: 10 bis 20° gebeugt)
    # oben: Oberarm so weit vor der Ebene von Schulter zu Schulter (Grad); 30° wie die Ebene des Schulterblatts
    # (Entscheidung des Produktinhabers, D-469; bis D-468 20°)
    EBENE = 30.0
    TIEFER = 4.0  # oben: Unterarm so weit unter der Waagrechten, der Ellbogen bleibt über dem Handgelenk (Grad)
    SCHULTER_HOCH = 8.0  # Schlüsselbein oben so weit gehoben (Grad)
    START_X = 0.11  # Ausgang: Mitte des Griffs so weit neben der Mitte des Körpers (vor dem Maß der Schultern), m
    LUFT = 0.012  # Ausgang: Köpfe der Hanteln mindestens so weit vor Haut, Shorts und Shirt, m
    GRIFF_LAGE = 0.65  # Lage des Griffs in der Hand wie beim Bankdrücken (D-452)
    SCHRAEG = 12.0  # Griff schräg in der Hand wie beim Bankdrücken (D-452)
    fuss_ansichten = ((90, 0.08), (0, 0.12), (180, 0.10), (270, 0.08))
    griff_ansichten = (("griff_vorn", 15.0, 10.0), ("griff_seite", 100.0, 20.0))

    def rahmen_objekte(self) -> list:
        return list(self.hanteln.values())

    def bauen(self) -> None:
        super().bauen()
        rig = self.rig
        self.hanteln = {s: geraete.kurzhantel(f"Kurzhantel.{s}", geraete.KH8) for s in "LR"}
        self.griff = {s: rig.griff(s, self.GRIFF_LAGE, self.KH_R, schraeg=self.SCHRAEG) for s in "LR"}
        k = rig.kopf
        A0 = k["foot.L"]
        w = math.radians(self.ZEHEN)
        x = self.FUESSE * self.mass
        self.knoechel = {"L": Vector((x, A0.y, A0.z)), "R": Vector((-x, A0.y, A0.z))}
        self.zehen = {"L": Vector((math.sin(w), -math.cos(w), 0)), "R": Vector((-math.sin(w), -math.cos(w), 0))}
        ferse, spitze = _fuss(self.koerper, k)
        self.fussmitte_y = A0.y - (A0.y - (ferse + spitze) / 2) * math.cos(w)
        self.H0 = (k["upperleg01.L"] + k["upperleg01.R"]) / 2
        self.armlaengen = ((k["lowerarm01.L"] - k["upperarm01.L"]).length, (k["wrist.L"] - k["lowerarm01.L"]).length)
        self.becken = self._becken_suchen()
        self.oben_rahmen = {s: self._rahmen_oben(s) for s in "LR"}
        self.versatz = {s: None for s in "LR"}
        self.start = None
        self.geloest = False

    # ------------------------------------------------------------------ Stand

    def _becken(self, dz: float) -> Matrix:
        """Rumpf um die Hüftgelenke `NEIGUNG` vorgeneigt; die Mitte zwischen Hüfte und Schultern über der Fußmitte."""
        k = self.rig.kopf
        R = achse_winkel(X, self.NEIGUNG)
        b = R @ ((k["upperarm01.L"] + k["upperarm01.R"]) / 2 - self.H0)
        dy = self.fussmitte_y - self.H0.y - b.y / 2
        return starr(self.H0, self.H0 + Vector((0, dy, dz)), R)

    def _becken_suchen(self) -> Matrix:
        """Hüfthöhe per Halbierung, bis das Knie `KNIE` gebeugt ist."""
        rig = self.rig
        lo, hi = -0.30, 0.05
        for _ in range(40):
            dz = (lo + hi) / 2
            rig.zuruecksetzen()
            rig.setze("root", self._becken(dz))
            if self.kniewinkel(rig.bein("L", self.knoechel["L"], self.zehen["L"], self.ZEHEN)) > self.KNIE:
                hi = dz
            else:
                lo = dz
        rig.zuruecksetzen()
        return self._becken((lo + hi) / 2)

    def _stand(self, p: float) -> dict:
        """Becken, Beine und Schlüsselbeine; gibt die Werte der Beine zurück."""
        rig = self.rig
        rig.setze("root", self.becken)
        hoch = self.SCHULTER_HOCH * p
        rig.dreh("clavicle.L", achse_winkel(-Y, hoch))
        rig.dreh("clavicle.R", achse_winkel(Y, hoch))
        return {s: rig.bein(s, self.knoechel[s], self.zehen[s], self.ZEHEN) for s in "LR"}

    # ------------------------------------------------------------------ Arme

    def _rahmen_oben(self, s: str) -> dict:
        """Arm oben (Raum des Skeletts): Oberarm `u` waagrecht, `EBENE` vor der Ebene der Schultern; Unterarm `f` um
        180° − `ELLBOGEN` nach vorn unten gebeugt (Richtung `b`), so dass er `TIEFER` unter der Waagrechten liegt;
        Griffachse `k` vom Zeigefinger zum kleinen Finger nach hinten, quer zum Unterarm, Handfläche `n` unten."""
        sx = 1 if s == "L" else -1
        e = math.radians(self.EBENE)
        u = Vector((sx * math.cos(e), -math.sin(e), 0.0))
        vor = senkrecht(-Y, u)
        beta = math.radians(180.0 - self.ELLBOGEN)
        tau = math.asin(min(1.0, math.sin(math.radians(self.TIEFER)) / math.sin(beta)))
        b = (vor * math.cos(tau) - Z * math.sin(tau)).normalized()
        f = (u * math.cos(beta) + b * math.sin(beta)).normalized()
        k = senkrecht(Y, f)
        n = f.cross(k).normalized()
        if n.z > 0:
            n = -n
        return {"u": u, "f": f, "b": b, "k": k, "n": n}

    def _arm(self, s: str, q: Quaternion) -> dict:
        """Arm `s` in der Lage des Rahmens oben, gedreht um `q` (um das Schultergelenk): Ellbogen und Handgelenk aus
        Oberarm und Unterarm; die Mitte des Griffs so, dass das Handgelenk dort liegt (Versatz aus dem Rig, nachgeführt
        bis 0,2 mm). Hantel an den Griff, ihre Achse entlang `k`, quer dazu zum Ellbogen hin oben."""
        rig = self.rig
        o = self.oben_rahmen[s]
        R = q.to_matrix()
        u, f, b, k = R @ o["u"], R @ o["f"], R @ o["b"], R @ o["k"]
        S = rig.punkt("shoulder01." + s, rig.kopf["upperarm01." + s])
        l1, l2 = self.armlaengen
        W = S + u * l1 + f * l2
        versatz = R @ self.versatz[s] if self.versatz[s] is not None else f * 0.07 + (R @ o["n"]) * 0.025
        for _ in range(10):
            mitte = W + versatz
            arm = rig.arm(s, self.griff[s], mitte, k, -b, 0.0)
            fehler = W - arm["handgelenk"]
            if fehler.length < 2e-4:
                break
            versatz = versatz + fehler
        self.hantel_setzen(s, mitte, k, f)
        arm.update({"mitte": mitte, "u": u, "f": f, "versatz_oben": R.inverted() @ versatz})
        return arm

    def hantel_setzen(self, s: str, mitte: Vector, k: Vector, f: Vector) -> None:
        x = k.normalized()
        z = senkrecht(-f, x)
        M = Matrix((x, z.cross(x), z)).transposed().to_4x4()
        M.translation = self.rig.welt(mitte)
        self.hanteln[s].matrix_world = M

    def _drehung(self, s: str, p: float) -> Quaternion:
        """Drehung des Arms gegenüber oben: vom Ausgang (p = 0) auf dem kürzesten Weg nach oben (p = 1)."""
        return self.start[s].slerp(Quaternion(), p)

    def _koepfe_frei(self) -> float:
        """Kleinster Abstand der Köpfe beider Hanteln zu Haut, Shorts und Shirt (m, negativ = darin): zur Haut wie beim
        Bankdrücken (`abstand_koerper`), zur Kleidung an der nächsten Fläche ihres verformten Netzes (außen = positiv)."""
        from mathutils.bvhtree import BVHTree

        import schuhe

        punkte = [q for s in "LR" for q in kopf_punkte(self.hanteln[s], 4)]
        beste = abstand_koerper(self.koerper, punkte)
        for name in ("Shorts", "Shirt"):
            obj = bpy.data.objects.get(name)
            if obj is None:
                continue
            pk, pf, _ = schuhe._verformt(obj)
            bvh = BVHTree.FromPolygons(pk, pf)
            for q in punkte:
                ort, n, _, d = bvh.find_nearest(q, 0.05)
                if ort is not None:
                    beste = min(beste, d if (q - ort).dot(n) >= 0 else -d)
        return beste

    def _ausgang(self) -> None:
        """Ausgang gesucht, wenn Kleidung und Schuhe da sind: Oberarm `ALPHA` nach vorn und so weit zur Seite, dass die
        Mitte des Griffs `START_X` neben der Körpermitte liegt; `ALPHA` per Halbierung, bis die Köpfe `LUFT` vor Haut,
        Shorts und Shirt bleiben."""
        rig = self.rig
        k = rig.kopf

        def drehung(s: str, alpha: float, delta: float) -> Quaternion:
            sx = 1 if s == "L" else -1
            u0 = Vector((sx * math.tan(math.radians(delta)), -math.tan(math.radians(alpha)), -1.0)).normalized()
            return self.oben_rahmen[s]["u"].rotation_difference(u0)

        def haltung(alpha: float) -> dict:
            delta = 0.0
            for _ in range(4):
                rig.zuruecksetzen()
                self._stand(0.0)
                arme = {s: self._arm(s, drehung(s, alpha, delta)) for s in "LR"}
                x = arme["L"]["mitte"].x
                ziel = self.START_X * self.mass
                if abs(x - ziel) < 5e-4:
                    break
                delta += math.degrees((ziel - x) / 0.6)
            rig.anwenden()
            return {"delta": delta, "frei": self._koepfe_frei()}

        lo, hi = 0.0, 45.0
        for _ in range(14):
            alpha = (lo + hi) / 2
            if haltung(alpha)["frei"] < self.LUFT:
                lo = alpha
            else:
                hi = alpha
        ergebnis = haltung(hi)
        self.alpha, self.delta = hi, ergebnis["delta"]
        self.start = {s: drehung(s, hi, ergebnis["delta"]) for s in "LR"}

    def _griffachse(self) -> None:
        """Griff schräg in der Hand (`SCHRAEG`): Die Griffachse oben wird so um die Handfläche gedreht, dass das
        Handgelenk am geradesten bleibt (gesucht von −20 bis 20°, dann fein)."""
        rig = self.rig
        for s in "LR":
            o = self.oben_rahmen[s]
            k0 = Vector(o["k"])

            def gesamt(sigma: float) -> float:
                o["k"] = achse_winkel(o["n"], sigma) @ k0
                rig.zuruecksetzen()
                self._stand(1.0)
                return self._arm(s, Quaternion())["handgelenk_gesamt"]

            beste = min(range(-20, 21, 2), key=gesamt)
            lo, hi = beste - 2.0, beste + 2.0
            for _ in range(16):
                m1, m2 = hi - 0.618 * (hi - lo), lo + 0.618 * (hi - lo)
                if gesamt(m1) < gesamt(m2):
                    hi = m2
                else:
                    lo = m1
            sigma = (lo + hi) / 2
            o["k"] = achse_winkel(o["n"], sigma) @ k0
            o["sigma"] = sigma
            rig.zuruecksetzen()
            self._stand(1.0)
            self.versatz[s] = self._arm(s, Quaternion())["versatz_oben"]

    def setzen(self, p: float) -> None:
        if not self.geloest:
            self.geloest = True
            self._griffachse()
            self._ausgang()
        super().setzen(p)

    def haltung(self, p: float) -> None:
        rig = self.rig
        beine = self._stand(p)
        arme = {s: self._arm(s, self._drehung(s, p)) for s in "LR"}
        A = arme["L"]
        u = A["u"]
        S, E, W = A["schulter"], A["ellbogen"], A["handgelenk"]
        L = beine["L"]
        self.werte = {
            "Ellbogenwinkel": A["ellbogenwinkel"],
            "Armhebung (Grad, 0 = hängend)": math.degrees(u.angle(-Z)),
            "Oberarm zur Waagrechten (Grad, + darüber)": math.degrees(math.asin(max(-1.0, min(1.0, u.z)))),
            # nur mit gehobenem Arm: Hängt er, zeigt die Richtung zur Seite nichts
            "Oberarm vor der Ebene der Schultern (Grad, ab 60° Armhebung)":
                math.degrees(math.atan2(-u.y, abs(u.x))) if u.angle(-Z) > math.radians(60) else float("nan"),
            "Ellbogen über dem Schultergelenk (cm)": (E.z - S.z) * 100,
            "Ellbogen über dem Handgelenk (cm)": (E.z - W.z) * 100,
            "Handgelenk gesamt (Grad)": A["handgelenk_gesamt"],
            "Handgelenk gestreckt (Grad)": A["handgelenk_streckung"],
            "Handgelenk seitlich (Grad, + zum Daumen)": A["handgelenk_seitlich"],
            "Pronation": A["pronation"],
            "Kniewinkel (Grad)": self.kniewinkel(L),
            "Rumpfneigung (Grad)": self.NEIGUNG,
            "Schlüsselbein gehoben (Grad)": self.SCHULTER_HOCH * p,
            "Griffe auseinander (cm)": (arme["L"]["mitte"] - arme["R"]["mitte"]).length * 100,
        }

    def nah_punkte(self) -> list[Vector]:
        """Punkte für die Nahaufnahme des Griffs: linke Hand und beide Köpfe ihrer Hantel (Welt)."""
        rig = self.rig
        hand = rig.welt(rig.punkt("wrist.L", rig.kopf["metacarpal2.L"]))
        M = self.hanteln["L"].matrix_world
        ende = geraete.KH8["laenge"] / 2
        return ([q for q in _netz(self.koerper) if (q - hand).length < 0.10]
                + [M @ Vector((ende, 0, 0)), M @ Vector((-ende, 0, 0))])

    def zusatzwerte(self) -> dict:
        """Hanteln und Hände (mm): Köpfe zu Haut und Kleidung, Hand zu den Köpfen, Finger am eigenen Griff (Punkte wie in
        `render.messen`: ein Gewicht eines Fingers über 0,5; die Griffe liegen hier nicht auf einer Linie)."""
        netz = _netz(self.koerper)
        namen = {g.index: g.name for g in self.koerper.vertex_groups}
        abst = []
        for s in "LR":
            M = self.hanteln[s].matrix_world
            mitte, achse = M.translation, M.to_3x3() @ Vector((1, 0, 0))
            for v, p in zip(self.koerper.data.vertices, netz):
                if any(g.weight > 0.5 and namen[g.group].startswith("finger") and namen[g.group].endswith("." + s) for g in v.groups):
                    r = p - mitte
                    abst.append((r - r.dot(achse) * achse).length - self.KH_R)
        return {"Kurzhantel: Köpfe vor Haut und Kleidung (mm)": self._koepfe_frei() * 1000,
                "Kurzhantel: Hand zu den Köpfen (mm)": hand_zu_koepfen(self.koerper, self.hanteln) * 1000,
                "Finger: geringster Abstand zur Stange (mm, negativ = eingedrungen)": min(abst) * 1000,
                "Finger: Punkte in Kontakt (≤ 3 mm)": sum(1 for a in abst if a <= 0.003)}


class RudernKabel(Uebung):
    """Rudern am Kabel, sitzend, Referenz der Familie „Waagrechtes Ziehen“ (D-470), Ausführung nach dem Vorlagebild des
    Produktinhabers (D-473). Sitzend mittig auf dem Sitz der Kabelrudern-Station (`geraete.kabelrudern`), Rumpf aufrecht
    über die ganze Bewegung, die Füße etwa hüftbreit flach auf der Fußplatte, Knie gebeugt (`KNIE`); das Becken bleibt
    fest, das Gesäß liegt `GESAESS` im Polster, das unter Haut und Kleidung nachgibt. Enger V-Griff
    (`geraete.v_griff`), Handflächen zueinander, voller Griff mit dem Daumen oben; das Kabel läuft waagrecht von der Rolle
    vorn an der Säule in Höhe der unteren Brust (`HOEHE`) zur Öse des Griffs, der Griff hängt drehbar daran und liegt quer
    zu den Unterarmen. Ausgang: Arme fast gestreckt (`ELLBOGEN_VORN`), die Schultern nach vorn (`SCHULTER_VOR`). Der Griff
    kommt waagrecht zum Körper (`_bahn_punkt`), die Schulterblätter gehen zusammen (`SCHULTER_ZURUECK`). Ende: Griff vor
    der unteren Brust, `LUFT` vor dem Shirt, die Ellbogen hinter dem Rumpf und nah am Körper. Der Gewichtsblock hebt sich
    um den Weg des Griffs. Zurück derselbe Weg."""

    name = "rudern_kabel"
    titel = "Rudern am Kabel, sitzend"
    # Schräg von hinten wie beim Latziehen (Entscheidung des Produktinhabers, D-474): Die Schulterblätter gehen sichtbar
    # zusammen, Arme, Griff und Kabel bleiben im Bild (bis D-473 schräg von vorn, 75° und 12°)
    kamera = {"richtung": 135.0, "neigung": 10.0}
    vorschau_phase = 1.0
    # Zeitablauf (`haltung.ablauf`): ohne Pause am vorderen Umkehrpunkt, wie es der Ausführungstext verlangt
    ablauf = {"pause_vorn": 0.0}
    FUESSE = 0.12  # halber Abstand der Fußgelenke vor dem Maß der Schultern, m: etwa hüftbreit
    ZEHEN = 6.0
    KNIE = 130.0  # Knie gebeugt wie auf dem Vorlagebild (D-473; bis D-472 160°, fast gestreckt)
    # Fußgelenke so weit unter den Hüftgelenken, m (D-473; bis D-472 0,05, bis D-470 0,12): bei 0,08 kamen Fäuste und
    # Unterarme den Knien in der Mitte des Zugs bis 16 mm nah
    TIEFER = 0.11
    # Vorderkante des Sitzes so weit vor den Hüftgelenken, m: unter den Knien (bei D-472 41,5 cm vor den Hüftgelenken,
    # mit 130° im Knie 39,3 cm); der Sitz reicht ebenso weit hinter das Gesäß, die Person sitzt in der Mitte (D-472). Bis
    # D-470 0,08 m: Da saß die Figur ganz vorn auf der Kante, Hinweis des Produktinhabers
    SITZ_VOR = 0.42
    # Ausgang: Rumpf in der Lende so weit vorgeneigt (auf drei Wirbel verteilt), Grad: keine Neigung, der Rumpf bleibt
    # aufrecht wie auf dem Vorlagebild (D-473; bis D-472 16°)
    VOR = 0.0
    SCHULTER_VOR = -8.0  # Ausgang: Schlüsselbeine nach vorn, Grad
    SCHULTER_ZURUECK = 10.0  # Ende: Schlüsselbeine zurück, die Schulterblätter gehen zusammen, Grad
    ELLBOGEN_VORN = 168.0  # Ausgang: Arme fast gestreckt
    # Kabel und Mitte des Griffs so weit über den Hüftgelenken (untere Brust), m: Das Kabel läuft waagrecht wie auf dem
    # Vorlagebild (D-473; bis D-472 kam es von unten zwischen den Füßen, der Griff endete 23 cm über den Hüftgelenken)
    HOEHE = 0.32
    ROLLE_VOR = 0.30  # Rolle so weit hinter der Mitte der Fußplatte (zur Säule), m
    LUFT = 0.010  # Ende: Hände und Griff mindestens so weit vor dem Shirt, m
    # Richtung, in die die Ellbogen zeigen (außen, hinten, unten; Raum des Skeletts): weiter nach hinten als bis D-472
    # (0,3, 0,5, −1), sonst endete der Oberarm mit dem Griff vor der unteren Brust nur 11° hinter dem Rumpf (D-473)
    POL = (0.3, 1.6, -1.0)
    GESAESS = 0.004  # Gesäß so tief im Sitz, m
    GRIFF_LAGE = 0.62
    # Griff schräg in der Hand wie beim Bankdrücken (D-452): Quer zur Knöchellinie knickte das Handgelenk 14° zum Daumen
    SCHRAEG = 12.0
    STRECKUNG = 0.0
    # Nahaufnahmen: Fuß von außen und von der Person aus (von vorn verdeckt die Fußplatte den Fuß), von der Person aus
    # höher (bei 0,15 stand die Kamera im Ausgang im linken Unterarm, D-472); Griff von der Seite und schräg von vorn oben
    # (von hinten oben verdeckt am Ende der Kopf die Hände)
    fuss_ansichten = ((90, 0.0), (180, 0.35), (0, 0.10), (270, 0.0))
    griff_ansichten = (("vgriff_seite", 90.0, 15.0), ("vgriff_vorn", 40.0, 30.0))

    def rahmen_objekte(self) -> list:
        # Bildausschnitt aus Figur, Sitz mit den Beinen bis zum Boden, Fußplatte, Rolle und Griff: Die Säule (2,1 m) darf
        # oben angeschnitten sein, sonst wird die Figur klein
        return [self.geraet["sitz"], *self.geraet["beine"], self.geraet["fussplatte"], self.geraet["rolle"], self.vgriff]

    def polster_objekte(self) -> list:
        return [self.geraet["sitz"]]

    def bauen(self) -> None:
        super().bauen()
        rig = self.rig
        k = rig.kopf
        r = geraete.RUDERN
        self.l1 = (k["lowerleg01.L"] - k["upperleg01.L"]).length
        self.l2 = (k["foot.L"] - k["lowerleg01.L"]).length
        self.armlaengen = ((k["lowerarm01.L"] - k["upperarm01.L"]).length, (k["wrist.L"] - k["lowerarm01.L"]).length)
        self.R_fuss = achse_winkel(X, -r["neigung"])  # Boden → Platte: Zehen in der Platte nach oben, Sohle auf ihr
        ruhe = [v.co for v in self.koerper.data.vertices]
        huefte = k["upperleg01.L"].z
        self.gesaess_i = [i for i, q in enumerate(ruhe) if abs(q.x) < 0.17 and huefte - 0.12 < q.z < huefte + 0.06 and q.y > 0.02]
        self.verschiebung = Vector((0.0, 0.0, 0.0))
        self._sitzen()
        platte = self._sohlenmitte()
        hl = rig.welt(rig.punkt("pelvis.L", k["upperleg01.L"]))
        rig.setze("root", self._becken())  # Hüftgelenke im Sitzen: Höhe des Kabels
        sitzend = (rig.welt(rig.punkt("pelvis.L", k["upperleg01.L"])) + rig.welt(rig.punkt("pelvis.R", k["upperleg01.R"]))) / 2
        rig.zuruecksetzen()
        rolle = Vector((0.0, platte.y - self.ROLLE_VOR, sitzend.z + self.HOEHE))
        self.rolle = rolle
        self.geraet = geraete.kabelrudern(hl.y - self.SITZ_VOR, platte, rolle)
        self.vgriff = geraete.v_griff("V-Griff")
        self.griff = {s: rig.griff(s, self.GRIFF_LAGE, geraete.RUDERN["griff_d"] / 2, schraeg=self.SCHRAEG) for s in "LR"}
        self.polster_ruhe = {o.name: geraete.weiches_polster(o) for o in self.polster_objekte()}
        self.delle = 0.0
        self.bahn = None
        self.geloest = False

    # ------------------------------------------------------------------ Sitzen und Beine

    def _becken(self) -> Matrix:
        return Matrix.Translation(self.verschiebung)

    def _beine(self) -> dict:
        """Füße flach auf den Platten: Fußgelenke `TIEFER` unter den Hüftgelenken, so weit vorn, dass das Knie `KNIE`
        gebeugt ist; das Knie zeigt nach oben und etwas nach außen."""
        rig = self.rig
        k = rig.kopf
        D = math.sqrt(self.l1 ** 2 + self.l2 ** 2 - 2 * self.l1 * self.l2 * math.cos(math.radians(self.KNIE)))
        aus = {}
        for s, sx in (("L", 1), ("R", -1)):
            H = rig.punkt("pelvis." + s, k["upperleg01." + s])
            dx = sx * self.FUESSE * self.mass - H.x
            dy = math.sqrt(max(D * D - dx * dx - self.TIEFER ** 2, 0.0))
            A = Vector((H.x + dx, H.y - dy, H.z - self.TIEFER))
            aus[s] = rig.bein(s, A, Vector((sx * 0.15, 0.0, 1.0)).normalized(), self.ZEHEN, fuss_ebene=self.R_fuss)
        return aus

    def _sitzen(self) -> None:
        """Gesäß auf den Sitz: Becken senkrecht über den Sitz gesetzt, bis die tiefste Stelle des Gesäßes (bei
        gebeugter Hüfte gemessen) `GESAESS` unter der Oberseite liegt."""
        rig = self.rig
        oben = geraete.RUDERN["sitz_oben"] - rig.versatz.z
        self.verschiebung = Vector((0.0, 0.0, 0.55 - rig.kopf["upperleg01.L"].z))
        for _ in range(4):
            rig.zuruecksetzen()
            rig.setze("root", self._becken())
            self._beine()
            rig.anwenden()
            tief = min(rig.lokal(_netz(self.koerper)[i]).z for i in self.gesaess_i)
            self.verschiebung.z += oben - self.GESAESS - tief
        rig.zuruecksetzen()

    def _sohlenmitte(self) -> Vector:
        """Mitte der Oberfläche beider Platten (Welt): unter den Sohlen, längs der Füße in ihrer Mitte (wie bei der
        Beinpresse); die Platten stehen so, dass die Sohlen flach aufliegen."""
        rig = self.rig
        k = rig.kopf
        rig.zuruecksetzen()
        rig.setze("root", self._becken())
        self._beine()
        ueber_sohle = k["foot.L"].z + rig.versatz.z
        ferse, spitze = _fuss(self.koerper, k)
        mitte_vor = k["foot.L"].y - (ferse + spitze) / 2
        n = self.R_fuss @ Z
        pkte = []
        for s, sx in (("L", 1), ("R", -1)):
            A = rig.welt(rig.punkt("foot." + s, k["foot." + s]))
            w = math.radians(self.ZEHEN) * sx
            zehen = self.R_fuss @ Vector((math.sin(w), -math.cos(w), 0.0))
            pkte.append(A - n * ueber_sohle + zehen * mitte_vor)
        rig.zuruecksetzen()
        m = (pkte[0] + pkte[1]) / 2
        return Vector((0.0, m.y, m.z))

    def sohle_ebene(self) -> tuple[Vector, Vector]:
        return self.geraet["platte"]

    # ------------------------------------------------------------------ Rumpf, Arme, Griff

    def _torso(self, p: float) -> None:
        rig = self.rig
        rig.setze("root", self._becken())
        vor = self.VOR * (1.0 - p)
        for n in ("spine05", "spine04", "spine03"):
            rig.dreh(n, achse_winkel(X, vor / 3))
        sch = self.SCHULTER_VOR + (self.SCHULTER_ZURUECK - self.SCHULTER_VOR) * p
        rig.dreh("clavicle.L", achse_winkel(Z, sch))
        rig.dreh("clavicle.R", achse_winkel(Z, -sch))

    @staticmethod
    def _griff_rahmen(vor: Vector) -> Matrix:
        """Ausrichtung des V-Griffs (Raum des Skeletts): y nach vorn zur Öse (`vor`), x quer, z = x × y längs der Griffe
        (nach unten)."""
        y = vor.normalized()
        x = senkrecht(X, y)
        return Matrix((x, y, x.cross(y))).transposed()

    def _arme(self, mitte: Vector) -> tuple[dict, Matrix]:
        """Arme an den V-Griff bei `mitte` (Raum des Skeletts). Der Griff hängt mit einem drehbaren Karabiner am Kabel:
        Er richtet sich nach den Händen, seine Griffe stehen quer zu den Unterarmen (mittlere Richtung beider
        Unterarme, viermal nachgeführt; begonnen mit der Richtung zur Rolle). Die Hand dreht sich um ihren Griff so,
        dass das Handgelenk am geradesten bleibt."""
        rig = self.rig
        halb = geraete.RUDERN["griff_abstand"] / 2
        vor = rig.lokal(self.rolle) - mitte
        n = len(rig.meldungen)
        for runde in range(4):
            del rig.meldungen[n:]  # Meldungen nur aus der letzten Runde (die erste beginnt mit der Richtung zur Rolle)
            R = self._griff_rahmen(vor)
            x, z = R.col[0].to_3d(), R.col[2].to_3d()
            aus = {}
            for s, sx in (("L", 1), ("R", -1)):
                pol = Vector((sx * self.POL[0], self.POL[1], self.POL[2])).normalized()
                aus[s] = rig.arm(s, self.griff[s], mitte + x * (sx * halb), z, pol, self.STRECKUNG)
            vor = sum(((a["handgelenk"] - a["ellbogen"]).normalized() for a in aus.values()), Vector())
        return aus, R

    def _griff_setzen(self, mitte: Vector, R: Matrix) -> None:
        rig = self.rig
        M = R.to_4x4()
        M.translation = rig.welt(mitte)
        self.vgriff.matrix_world = M
        oese = M @ Vector((0, geraete.RUDERN["griff_oese"], 0))
        geraete.kabel("Kabel", self.rolle, oese)
        weg = (oese - self.rolle).length - self.kabel0 if self.bahn is not None else 0.0
        self.geraet["block"].matrix_world = Matrix.Translation(Vector((0, 0, weg))) @ self.geraet["block0"]

    def _haltung_roh(self, p: float, mitte: Vector) -> dict:
        rig = self.rig
        rig.zuruecksetzen()
        self._torso(p)
        beine = self._beine()
        arme, R = self._arme(mitte)
        return {"beine": beine, "arme": arme, "R": R}

    def _vor_dem_shirt(self) -> float:
        """Kleinster Abstand von Händen und V-Griff zum Rumpf des Shirts (m, negativ = darin), an der nächsten Fläche
        des verformten Shirts ohne die Ärmel (außen = positiv; die Unterarme stecken nicht in den Ärmeln, sie liegen
        aber an deren Saum)."""
        import schuhe

        sh = bpy.data.objects.get("Shirt")
        if sh is None:
            return 1.0
        pk, pf, _ = schuhe._verformt(sh)
        if not hasattr(self, "_aermel"):
            namen = {g.index: g.name for g in sh.vertex_groups}
            self._aermel = {v.index for v in sh.data.vertices
                            if sum(g.weight for g in v.groups if namen.get(g.group, "").startswith(("upperarm", "shoulder", "lowerarm"))) >= 0.3}
        flaeche = Crunch._flaeche(pk, [f for f in pf if not any(i in self._aermel for i in f)])
        netz = _netz(self.koerper)
        if not hasattr(self, "_hand_i"):
            namen = {g.index: g.name for g in self.koerper.vertex_groups}
            self._hand_i = [v.index for v in self.koerper.data.vertices
                            if sum(g.weight for g in v.groups if namen[g.group].startswith(("wrist", "metacarpal", "finger"))) > 0.5]
        punkte = [netz[i] for i in self._hand_i] + self._griff_punkte()
        return Crunch._abstand(flaeche, punkte)

    def _griff_punkte(self) -> list[Vector]:
        punkte = []
        for teil in self.vgriff.children:
            ev = teil.evaluated_get(bpy.context.evaluated_depsgraph_get())
            me = ev.to_mesh()
            punkte += [ev.matrix_world @ v.co for v in me.vertices]
            ev.to_mesh_clear()
        return punkte

    def _loesen(self) -> None:
        """Bahn des Griffs, wenn Kleidung und Schuhe da sind: Ende vor der unteren Brust (`HOEHE` über den Hüftgelenken),
        so weit vor dem Körper, dass Hände und Griff `LUFT` vor dem Shirt bleiben (Halbierung waagrecht nach vorn);
        Ausgang auf der Geraden zur Rolle, wo der Ellbogen `ELLBOGEN_VORN` gestreckt ist."""
        rig = self.rig
        k = rig.kopf
        rig.zuruecksetzen()
        rig.setze("root", self._becken())
        H = (rig.punkt("pelvis.L", k["upperleg01.L"]) + rig.punkt("pelvis.R", k["upperleg01.R"])) / 2
        basis = Vector((0.0, H.y - 0.05, H.z + self.HOEHE))
        richtung = (rig.lokal(self.rolle) - basis).normalized()

        def frei(t: float) -> float:
            mitte = basis - Y * t
            roh = self._haltung_roh(1.0, mitte)
            self._griff_setzen(mitte, roh["R"])
            rig.anwenden()
            return self._vor_dem_shirt()

        lo, hi = -0.10, 0.30
        for _ in range(16):
            t = (lo + hi) / 2
            if frei(t) < self.LUFT:
                lo = t
            else:
                hi = t
        ende = basis - Y * hi
        richtung = (rig.lokal(self.rolle) - ende).normalized()

        def winkel(t: float) -> float:
            arme = self._haltung_roh(0.0, ende + richtung * t)["arme"]
            return arme["L"]["ellbogenwinkel"]

        lo, hi = 0.0, 0.80
        for _ in range(24):
            t = (lo + hi) / 2
            if winkel(t) < self.ELLBOGEN_VORN:
                lo = t
            else:
                hi = t
        start = ende + richtung * lo
        self.bahn = (start, ende)
        R0 = self._haltung_roh(0.0, start)["R"]
        self.kabel0 = (rig.welt(start) + R0 @ Vector((0, geraete.RUDERN["griff_oese"], 0)) - self.rolle).length

    def auflage(self) -> list:
        return auflage_objekte(self.koerper, "Shirt", "Shorts")

    def setzen(self, p: float) -> None:
        if not self.geloest:
            self.geloest = True
            self._loesen()
        super().setzen(p)
        self.delle = geraete.eindruecken(self.polster_objekte(), self.polster_ruhe, self.auflage())

    def _bahn_punkt(self, p: float) -> Vector:
        """Mitte des Griffs in Phase p: auf der Geraden zur Rolle, waagrecht wie das Kabel (D-473; bis D-472 stieg der
        Griff von unten zur Taille)."""
        start, ende = self.bahn
        return start.lerp(ende, p)

    def haltung(self, p: float) -> None:
        rig = self.rig
        start, ende = self.bahn
        mitte = self._bahn_punkt(p)
        roh = self._haltung_roh(p, mitte)
        self._griff_setzen(mitte, roh["R"])
        A, L = roh["arme"]["L"], roh["beine"]["L"]
        k = rig.kopf
        S, E, W = A["schulter"], A["ellbogen"], A["handgelenk"]
        rumpf = (rig.punkt("neck01", k["neck01"]) - rig.punkt("spine05", k["spine05"])).normalized()
        oberarm = (E - S).normalized()
        oberschenkel = (L["knie"] - L["huefte"]).normalized()
        schienbein = (L["knie"] - L["knoechel"]).normalized()
        zehen = self.R_fuss @ Vector((math.sin(math.radians(self.ZEHEN)), -math.cos(math.radians(self.ZEHEN)), 0.0))
        self.werte = {
            "Ellbogenwinkel": A["ellbogenwinkel"],
            "Rumpf zur Senkrechten (Grad, + nach vorn)": math.degrees(math.atan2(-rumpf.y, rumpf.z)),
            "Lende gebeugt (Grad)": self.VOR * (1.0 - p),
            "Schlüsselbein zurück (Grad)": self.SCHULTER_VOR + (self.SCHULTER_ZURUECK - self.SCHULTER_VOR) * p,
            "Oberarm hinter dem Rumpf (Grad)": winkel_um(-rumpf, oberarm, X),
            "Ellbogen hinter dem Schultergelenk (cm)": (E.y - S.y) * 100,
            "Ellbogen seitlich der Schulter (cm, + außen)": (E.x - S.x) * 100,
            "Griff über dem Sitz (cm)": (rig.welt(mitte).z - geraete.RUDERN["sitz_oben"]) * 100,
            "Weg des Griffs (cm)": (mitte - start).length * 100,
            "Handgelenk gesamt (Grad)": A["handgelenk_gesamt"],
            "Handgelenk gestreckt (Grad)": A["handgelenk_streckung"],
            "Handgelenk seitlich (Grad, + zum Daumen)": A["handgelenk_seitlich"],
            "Kniewinkel (Grad)": self.kniewinkel(L),
            "Hüftwinkel (Grad)": math.degrees(oberschenkel.angle(rumpf)),
            "Sprunggelenk gebeugt (Grad)": 90.0 - math.degrees(schienbein.angle(zehen)),
        }

    def _ueber_den_beinen(self, netz: list[Vector]) -> float:
        """Kleinster Abstand von Händen, Unterarmen und V-Griff zu den Beinen (Haut der Ober- und Unterschenkel) und den
        Shorts (m, negativ = darin; an der nächsten Fläche, außen = positiv; an offenen Rändern ohne Vorzeichen,
        `Crunch._abstand`)."""
        import schuhe

        namen = {g.index: g.name for g in self.koerper.vertex_groups}
        if not hasattr(self, "_bein_f"):
            bein = {v.index for v in self.koerper.data.vertices
                    if sum(g.weight for g in v.groups if namen[g.group].startswith(("upperleg", "lowerleg"))) > 0.5}
            self._bein_f = [list(f.vertices) for f in self.koerper.data.polygons if all(i in bein for i in f.vertices)]
            self._arm_i = [v.index for v in self.koerper.data.vertices
                           if sum(g.weight for g in v.groups if namen[g.group].startswith(("lowerarm", "wrist", "metacarpal", "finger"))) > 0.5]
        flaechen = [Crunch._flaeche(netz, self._bein_f)]
        if "Shorts" in bpy.data.objects:
            pk, pf, _ = schuhe._verformt(bpy.data.objects["Shorts"])
            flaechen.append(Crunch._flaeche(pk, pf))
        punkte = [netz[i] for i in self._arm_i] + self._griff_punkte()
        return min(Crunch._abstand(f, punkte) for f in flaechen)

    def nah_punkte(self) -> list[Vector]:
        """Linke Hand und der V-Griff (Welt)."""
        rig = self.rig
        hand = rig.welt(rig.punkt("wrist.L", rig.kopf["metacarpal2.L"]))
        M = self.vgriff.matrix_world
        return ([q for q in _netz(self.koerper) if (q - hand).length < 0.10]
                + [M @ Vector((0.10, 0, 0)), M @ Vector((-0.10, 0, 0)), M @ Vector((0, geraete.RUDERN["griff_oese"], 0))])

    def zusatzwerte(self) -> dict:
        """Gesäß im Sitz und Oberschenkel am Polster (mm, Oberfläche vor dem Eindrücken), Hände und Griff vor dem
        Shirt, Finger am eigenen Griff, das Kabel zu Beinen und Shorts, Dellen im Polster."""
        from mathutils.bvhtree import BVHTree

        import schuhe

        netz = _netz(self.koerper)
        sitz = self.geraet["sitz"]
        aus = {"Gesäß im Sitz (mm)": Beinpresse._im_polster(netz, self.gesaess_i, sitz) * 1000}
        aus.update(polster_werte(self.koerper, [sitz]))
        aus["Hände und Griff vor dem Shirt (mm)"] = self._vor_dem_shirt() * 1000
        namen = {g.index: g.name for g in self.koerper.vertex_groups}
        M = self.vgriff.matrix_world
        abst = []
        for s, sx in (("L", 1), ("R", -1)):
            mitte = M @ Vector((sx * geraete.RUDERN["griff_abstand"] / 2, 0, 0))
            achse = (M.to_3x3() @ Z).normalized()
            for v, q in zip(self.koerper.data.vertices, netz):
                if any(g.weight > 0.5 and namen[g.group].startswith("finger") and namen[g.group].endswith("." + s) for g in v.groups):
                    rr = q - mitte
                    abst.append((rr - rr.dot(achse) * achse).length - geraete.RUDERN["griff_d"] / 2)
        aus["Finger: geringster Abstand zur Stange (mm, negativ = eingedrungen)"] = min(abst) * 1000
        aus["Finger: Punkte in Kontakt (≤ 3 mm)"] = sum(1 for a in abst if a <= 0.003)
        # Kabel: kleinster Abstand der Geraden von der Rolle zur Öse zu Haut, Shorts, Socken und Schuhen
        oese = M @ Vector((0, geraete.RUDERN["griff_oese"], 0))
        beste = 1.0
        for obj in [self.koerper] + [bpy.data.objects[n] for n in ("Shorts", "Socken", "Schuhe", "Sohle") if n in bpy.data.objects]:
            pk, pf, _ = schuhe._verformt(obj) if obj is not self.koerper else (netz, [list(f.vertices) for f in obj.data.polygons], None)
            bvh = BVHTree.FromPolygons(pk, pf)
            for i in range(41):
                q = self.rolle.lerp(oese, i / 40)
                ort, _, _, d = bvh.find_nearest(q, 0.5)
                if ort is not None:
                    beste = min(beste, d)
        aus["Kabel: Abstand zu Beinen, Shorts und Schuhen (mm)"] = beste * 1000
        aus["Hände, Unterarme und Griff über den Beinen (mm)"] = self._ueber_den_beinen(netz) * 1000
        aus["Polster: tiefste Delle (mm)"] = self.delle * 1000
        aus["Polster: Haut oder Kleidung durch die Oberfläche (mm)"] = geraete.durch_polster(self.polster_objekte(), self.auflage()) * 1000
        return aus


class BeinbeugerLiegend(Uebung):
    """Beinbeuger liegend, Referenz der Familie „Beine isoliert“ (D-475), nach dem Ausführungstext der App (ExRx „Lever
    Lying Leg Curl“) und den Handbüchern von Life Fitness und Hoist. Bäuchlings auf Brust- und Oberschenkelpolster der
    Maschine (`geraete.beinbeuger`), die vom Scheitel unter der Hüfte je `NEIGUNG` Grad abfallen: Der Rumpf fällt zum
    Kopf hin ab, die Oberschenkel zu den Knien; Rumpf und Oberschenkel liegen `TIEF` im Polster, das unter Haut und
    Kleidung nachgibt. Die Knie liegen knapp hinter dem Oberschenkelpolster (`KNIE_FREI`), ihre Achse auf der Drehachse
    des Hebels; die Rolle liegt hinten auf den Unterschenkeln knapp über den Fersen (`ROLLE_UEBER`). Hände an den
    Griffen vorn neben dem Brustpolster, Kopf in Verlängerung des Rumpfs. Das Knie beugt von fast gestreckt
    (`KNIE_AUS`) bis `KNIE_EIN`; Hebel und Rolle drehen mit dem Unterschenkel um dieselbe Achse, der Gewichtsblock hebt
    sich um den Weg der Nocke. Hüfte und Oberkörper bleiben auf dem Polster, das Sprunggelenk bleibt wie im Stand.
    Zurück derselbe Weg."""

    name = "beinbeuger_liegend"
    titel = "Beinbeuger liegend"
    fuesse_frei = True  # die Füße hängen frei (`render.messen`: kein Bodenkontakt)
    # Von der Seite, etwas von hinten und oben: Kniebeugung, Rückseite der Oberschenkel und Rolle (verglichen mit 70° und
    # 15° schräg vom Kopf her und 120° und 25° schräg von hinten)
    kamera = {"richtung": 100.0, "neigung": 20.0}
    vorschau_phase = 1.0
    NEIGUNG = 15.0  # Brust- und Oberschenkelpolster fallen vom Scheitel so weit ab, Grad
    KNIE_AUS = 175.0  # Ausgang: Knie fast gestreckt („bis die Knie wieder gestreckt sind“)
    KNIE_EIN = 60.0  # Ende: Knie 120° gebeugt (Familie: 110 bis 130°)
    TIEF = 0.004  # Rumpf und Oberschenkel so tief im Polster, m
    SCHEITEL_Z = 0.76  # Scheitel der Polster über dem Boden, m (geschätzt)
    KNIE_FREI = 0.06  # Oberschenkelpolster endet so weit vor den Kniegelenken (längs des Polsters), m
    HALS_FREI = 0.03  # Brustpolster endet so weit vor dem Halsansatz (längs des Polsters), m
    ROLLE_UEBER = 0.07  # Mitte der Rolle so weit über dem Fußgelenk (längs des Unterschenkels), m
    ROLLE_TIEF = 0.001  # Rolle so tief in Socke und Haut, m
    GRIFF_X = 0.22  # Griffe so weit von der Mitte, m
    GRIFF_VOR = 0.06  # Griffe so weit vor den Schultergelenken (längs des Brustpolsters, zum Kopf), m
    GRIFF_TIEF = 0.30  # Griffe so weit unter den Schultergelenken (senkrecht zum Brustpolster), m
    # Achse der Griffe vom Zeigefinger zum kleinen Finger: Anteile zu den Füßen (längs des Brustpolsters), nach unten
    # (senkrecht zum Polster) und nach außen. Gesucht unter elf Richtungen: längs des Polsters knickte das Handgelenk 10°
    # zum kleinen Finger, senkrecht 66°, quer 31°; 11° zu den Füßen hin abfallend 0,4°
    GRIFF_RICHTUNG = (1.0, 0.2, 0.0)
    GRIFF_LAGE = 0.6
    STRECKUNG = 0.0
    POL = (0.8, 0.3, 0.3)  # Ellbogen zeigen nach außen, etwas zu den Füßen und nach oben (Raum des Skeletts)
    fuss_ansichten = ((90, 0.10), (180, 0.20), (0, 0.10), (270, 0.0))
    griff_ansichten = (("beingriff_aussen", 90.0, 15.0), ("beingriff_vorn", 0.0, 25.0))

    def rahmen_objekte(self) -> list:
        return [*self.geraet["polster"], self.geraet["rolle"], *self.geraet["griffe"].values()]

    def polster_objekte(self) -> list:
        return self.geraet["polster"]

    def stange_achse(self):
        # linker Griff (Welt): für den Abstand der Finger zum Griff in `render.messen`
        m, richtung = self.griffe["L"]
        return m.copy(), richtung, geraete.BEINBEUGER["griff_d"] / 2

    def bauen(self) -> None:
        super().bauen()
        rig = self.rig
        k = rig.kopf
        a = math.radians(self.NEIGUNG)
        self.d_brust, self.n_brust = Vector((0, -math.cos(a), -math.sin(a))), Vector((0, -math.sin(a), math.cos(a)))
        self.d_schenkel, self.n_schenkel = Vector((0, math.cos(a), -math.sin(a))), Vector((0, math.sin(a), math.cos(a)))
        self.R = achse_winkel(X, 90.0 + self.NEIGUNG)
        self.l1 = (k["lowerleg01.L"] - k["upperleg01.L"]).length
        self.l2 = (k["foot.L"] - k["lowerleg01.L"]).length
        self.verschiebung = Vector()
        ruhe = [v.co for v in self.koerper.data.vertices]
        namen = {g.index: g.name for g in self.koerper.vertex_groups}

        def gruppe(*anfaenge: str) -> list[int]:
            return [v.index for v in self.koerper.data.vertices
                    if sum(g.weight for g in v.groups if namen[g.group].startswith(anfaenge)) > 0.5]

        huefte = k["upperleg01.L"].z
        # Vorderseite von Bauch und Brust (aufs Brustpolster), Vorderseite der Oberschenkel (aufs Oberschenkelpolster),
        # Unterschenkel (unter der Rolle)
        self.rumpf_i = [i for i, r in enumerate(ruhe) if abs(r.x) < 0.14 and r.y < 0.0 and huefte + 0.10 < r.z < huefte + 0.50]
        self.schenkel_i = [i for i in gruppe("upperleg") if ruhe[i].y < 0.0]
        self.unterschenkel_i = gruppe("lowerleg")
        self.gesaess_i = [i for i, r in enumerate(ruhe) if abs(r.x) < 0.17 and huefte - 0.12 < r.z < huefte + 0.06 and r.y > 0.02]
        self.theta = math.radians(180.0 - self.KNIE_AUS)
        self.geraet = None
        self.geloest = False

    def _loesen(self) -> None:
        """Lage auf den Polstern und die Maschine, wenn Kleidung und Schuhe da sind (`setzen`): Shirt, Shorts und Socken
        liegen auf den Polstern und unter der Rolle."""
        self._lage()
        self._geraet_bauen()

    # ------------------------------------------------------------------ Lage auf den Polstern

    def _rumpf(self) -> None:
        self.rig.setze("root", starr(Vector(), self.verschiebung, self.R))

    def _beine(self, theta: float) -> dict:
        """Oberschenkel längs des Oberschenkelpolsters, Unterschenkel um `theta` gebeugt (um die Achse der Kniegelenke),
        Fuß fest am Unterschenkel wie im Stand; das Knie zeigt zum Polster."""
        from rig import abbild

        rig = self.rig
        k = rig.kopf
        a = math.radians(self.NEIGUNG)
        unter = Vector((0.0, math.cos(theta - a), math.sin(theta - a)))
        aus = {}
        for s in "LR":
            H = rig.punkt("pelvis." + s, k["upperleg01." + s])
            K = H + self.d_schenkel * self.l1
            A = K + unter * self.l2
            bein = rig.bein(s, A, -self.n_schenkel, 0.0)
            A0, K0 = k["foot." + s], k["lowerleg01." + s]
            R_unter = abbild(A0 - K0, -Y, bein["knoechel"] - bein["knie"], bein["richtung"])
            rig.setze("foot." + s, starr(A0, bein["knoechel"], R_unter))
            aus[s] = bein
        return aus

    def _netz_mit(self, *namen: str) -> list[Vector]:
        import schuhe

        punkte = []
        for n in namen:
            if n in bpy.data.objects:
                punkte += schuhe._verformt(bpy.data.objects[n])[0]
        return punkte

    def _lage(self) -> None:
        """Lage von Figur und Polstern: Figur bäuchlings mit gestreckten Knien, dann die Ebenen der Polster so, dass die
        tiefsten Punkte von Rumpf (mit Shirt) und Oberschenkeln (mit Shorts) `TIEF` unter ihnen liegen; der Scheitel ist
        die Schnittlinie beider Ebenen. Dann wird alles so verschoben, dass der Scheitel bei y = 0 in `SCHEITEL_Z` Höhe
        liegt."""
        rig = self.rig
        k = rig.kopf
        for runde in range(2):
            rig.zuruecksetzen()
            self._rumpf()
            self._beine(self.theta)
            rig.anwenden()
            netz = _netz(self.koerper)
            H = (rig.punkt("pelvis.L", k["upperleg01.L"]) + rig.punkt("pelvis.R", k["upperleg01.R"])) / 2
            Hw = rig.welt(H)
            kleid = self._netz_mit("Shirt", "Shorts")
            rumpf = [netz[i] for i in self.rumpf_i] + [q for q in kleid if abs(q.x) < 0.14 and (q - Hw).dot(self.d_brust) > 0.12]
            schenkel = [netz[i] for i in self.schenkel_i] + [q for q in kleid if abs(q.x) < 0.20 and (q - Hw).dot(self.d_schenkel) > 0.10]
            c_b = min(q.dot(self.n_brust) for q in rumpf) + self.TIEF
            c_s = min(q.dot(self.n_schenkel) for q in schenkel) + self.TIEF
            a = math.radians(self.NEIGUNG)
            z = (c_b + c_s) / (2 * math.cos(a))
            y = (c_s - c_b) / (2 * math.sin(a))
            if runde == 0:
                self.verschiebung = Vector((0.0, -y, self.SCHEITEL_Z - z))
        self.scheitel = Vector((0.0, y, z))
        rig.zuruecksetzen()

    def _geraet_bauen(self) -> None:
        """Drehachse auf der Achse der Kniegelenke (Ausgang), Rolle hinten auf den Unterschenkeln `ROLLE_UEBER` über den
        Fußgelenken, so tief, dass sie `ROLLE_TIEF` in Socke und Haut liegt; Griffe vor und unter den Schultergelenken.
        Dann die Maschine, die Polster als weiches Netz."""
        import schuhe

        rig = self.rig
        k = rig.kopf
        b = geraete.BEINBEUGER
        rig.zuruecksetzen()
        self._rumpf()
        self._beine(self.theta)
        rig.anwenden()
        KL = rig.welt(rig.punkt("lowerleg01.L", k["lowerleg01.L"]))
        KR = rig.welt(rig.punkt("lowerleg01.R", k["lowerleg01.R"]))
        mitte = (KL + KR) / 2
        self.achse = Vector((-b["hebel_x"], mitte.y, mitte.z))
        a = math.radians(self.NEIGUNG)
        u = Vector((0.0, math.cos(self.theta - a), math.sin(self.theta - a)))  # längs des Unterschenkels
        v = Vector((0.0, -math.sin(self.theta - a), math.cos(self.theta - a)))  # zur Rückseite der Beine
        L = self.l2 - self.ROLLE_UEBER
        r = b["rolle_d"] / 2 - self.ROLLE_TIEF
        netz = _netz(self.koerper)
        bein = [netz[i] for i in self.unterschenkel_i] + (schuhe._verformt(bpy.data.objects["Socken"])[0] if "Socken" in bpy.data.objects else [])
        h = -1.0
        for q in bein:
            w = q - Vector((q.x, mitte.y, mitte.z))
            du = w.dot(u) - L
            if abs(du) < r and abs(q.x) < b["rolle_l"] / 2:
                h = max(h, w.dot(v) + math.sqrt(r * r - du * du))
        rolle = Vector((0.0, mitte.y, mitte.z)) + u * L + v * h
        S = {s: rig.welt(rig.punkt("shoulder01." + s, k["upperarm01." + s])) for s in "LR"}
        self.griffe = {}
        for s, sx in (("L", 1), ("R", -1)):
            m = S[s] + self.d_brust * self.GRIFF_VOR - self.n_brust * self.GRIFF_TIEF
            m.x = sx * self.GRIFF_X
            g0, g1, g2 = self.GRIFF_RICHTUNG
            self.griffe[s] = (m, (-self.d_brust * g0 - self.n_brust * g1 + X * (sx * g2)).normalized())
        H = (rig.punkt("pelvis.L", k["upperleg01.L"]) + rig.punkt("pelvis.R", k["upperleg01.R"])) / 2
        hals = rig.welt(rig.punkt("neck01", k["neck01"]))
        brust = (hals - self.scheitel).dot(self.d_brust) - self.HALS_FREI
        schenkel = (mitte - self.scheitel).dot(self.d_schenkel) - self.KNIE_FREI
        rig.zuruecksetzen()
        self.laengen = (brust, schenkel)
        self.geraet = geraete.beinbeuger(self.scheitel, brust, schenkel, self.achse, rolle, self.griffe)
        self.polster_ruhe = {o.name: geraete.weiches_polster(o) for o in self.polster_objekte()}
        self.delle = 0.0
        self.griff = {s: rig.griff(s, self.GRIFF_LAGE, b["griff_d"] / 2) for s in "LR"}

    # ------------------------------------------------------------------ Haltung

    def _arme(self) -> dict:
        rig = self.rig
        aus = {}
        for s, sx in (("L", 1), ("R", -1)):
            m, richtung = self.griffe[s]
            pol = Vector((sx * self.POL[0], self.POL[1], self.POL[2])).normalized()
            aus[s] = rig.arm(s, self.griff[s], rig.lokal(m), richtung, pol, self.STRECKUNG)
        return aus

    def haltung(self, p: float) -> None:
        rig = self.rig
        k = rig.kopf
        knie = self.KNIE_AUS + (self.KNIE_EIN - self.KNIE_AUS) * p
        theta = math.radians(180.0 - knie)
        self._rumpf()
        beine = self._beine(theta)
        arme = self._arme()
        dreh = math.degrees(theta - self.theta)
        g = self.geraet
        g["hebel"].matrix_world = (Matrix.Translation(self.achse) @ achse_winkel(X, dreh).to_4x4()
                                   @ Matrix.Translation(-self.achse) @ g["hebel0"])
        weg = geraete.BEINBEUGER["nocke_r"] * (theta - self.theta)
        g["block"].matrix_world = Matrix.Translation(Vector((0, 0, weg))) @ g["block0"]
        L, A = beine["L"], arme["L"]
        rumpf = (rig.punkt("neck01", k["neck01"]) - rig.punkt("spine05", k["spine05"])).normalized()
        oberschenkel = (L["knie"] - L["huefte"]).normalized()
        schienbein = (L["knie"] - L["knoechel"]).normalized()
        zehen = (rig.g("foot.L").to_3x3() @ Vector((0.0, -1.0, 0.0))).normalized()
        K = rig.welt(L["knie"])
        self.werte = {
            "Kniewinkel (Grad)": self.kniewinkel(L),
            "Hüftwinkel (Grad)": math.degrees(oberschenkel.angle(rumpf)),
            "Rumpf zur Waagrechten (Grad, + Kopf tiefer)": math.degrees(math.asin(max(-1.0, min(1.0, -rumpf.z)))),
            "Sprunggelenk gebeugt (Grad)": 90.0 - math.degrees(schienbein.angle(zehen)),
            "Kniegelenk zur Drehachse (mm)": math.hypot(K.y - self.achse.y, K.z - self.achse.z) * 1000,
            "Hebel gedreht (Grad)": dreh,
            "Ellbogenwinkel": A["ellbogenwinkel"],
            "Handgelenk gesamt (Grad)": A["handgelenk_gesamt"],
            "Handgelenk gestreckt (Grad)": A["handgelenk_streckung"],
            "Handgelenk seitlich (Grad, + zum Daumen)": A["handgelenk_seitlich"],
        }

    def auflage(self) -> list:
        return auflage_objekte(self.koerper, "Shirt", "Shorts")

    def setzen(self, p: float) -> None:
        if not self.geloest:
            self.geloest = True
            self._loesen()
        super().setzen(p)
        self.delle = geraete.eindruecken(self.polster_objekte(), self.polster_ruhe, self.auflage())

    def _rolle(self) -> tuple[Vector, Vector, float, float]:
        """Mitte, Achse, Halbmesser und halbe Länge der Rolle (Welt)."""
        b = geraete.BEINBEUGER
        M = self.geraet["rolle"].matrix_world
        return M.translation.copy(), (M.to_3x3() @ Vector((0, 0, 1))).normalized(), b["rolle_d"] / 2, b["rolle_l"] / 2

    def _zur_rolle(self, punkte: list[Vector]) -> float:
        """Kleinster Abstand der Punkte zur Oberfläche der Rolle (m, negativ = darin), nur neben der Rolle."""
        c, ax, r, halb = self._rolle()
        beste = 1.0
        for q in punkte:
            w = q - c
            t = w.dot(ax)
            if abs(t) <= halb:
                beste = min(beste, (w - ax * t).length - r)
        return beste

    def fuss_ziel(self, sohle: list[Vector]) -> Vector:
        """Mitte der Fuß-Nahaufnahmen: zwischen der Rolle und dem linken Fußgelenk, damit Rolle, Unterschenkel und Schuh
        im Bild liegen."""
        rig = self.rig
        A = rig.welt(rig.punkt("foot.L", rig.kopf["foot.L"]))
        c, ax, _, _ = self._rolle()
        return (A + c + ax * (A - c).dot(ax)) / 2

    def nah_punkte(self) -> list[Vector]:
        """Linke Hand und linker Griff (Welt)."""
        rig = self.rig
        hand = rig.welt(rig.punkt("wrist.L", rig.kopf["metacarpal2.L"]))
        m, richtung = self.griffe["L"]
        laenge = geraete.BEINBEUGER["griff_l"] / 2
        return [q for q in _netz(self.koerper) if (q - hand).length < 0.10] + [m + richtung * laenge, m - richtung * laenge]

    def zusatzwerte(self) -> dict:
        """Rumpf und Oberschenkel im Polster (mm, Oberfläche vor dem Eindrücken), die Rolle auf Socke und Haut der
        Unterschenkel und zu den Schuhen, Kopf und Hals zum Gerät, Dellen im Polster."""
        from mathutils.bvhtree import BVHTree

        import schuhe

        netz = _netz(self.koerper)
        kleid = self._netz_mit("Shirt", "Shorts")
        brust, schenkel = self.laengen
        c_b, c_s = self.scheitel.dot(self.n_brust), self.scheitel.dot(self.n_schenkel)
        breite = geraete.BEINBEUGER["breite"] / 2

        def tiefe(punkte, d, c, n, von, bis) -> float:
            werte = [c - q.dot(n) for q in punkte if abs(q.x) < breite and von <= (q - self.scheitel).dot(d) <= bis]
            return max(werte) if werte else float("nan")

        rumpf = [netz[i] for i in self.rumpf_i] + [q for q in kleid if abs(q.x) < 0.14]
        schenkel_p = [netz[i] for i in self.schenkel_i] + kleid
        aus = {"Brust und Bauch im Polster (mm)": tiefe(rumpf, self.d_brust, c_b, self.n_brust, 0.12, brust) * 1000,
               "Oberschenkel im Polster (mm)": tiefe(schenkel_p, self.d_schenkel, c_s, self.n_schenkel, 0.10, schenkel) * 1000,
               "Hüfte am Scheitel im Polster (mm)": max(tiefe(rumpf, self.d_brust, c_b, self.n_brust, 0.0, 0.12),
                                                        tiefe(schenkel_p, self.d_schenkel, c_s, self.n_schenkel, 0.0, 0.10)) * 1000}
        socke = schuhe._verformt(bpy.data.objects["Socken"])[0] if "Socken" in bpy.data.objects else []
        aus["Rolle: Socke und Haut (mm, negativ = eingedrückt)"] = self._zur_rolle([netz[i] for i in self.unterschenkel_i] + socke) * 1000
        schuh = []
        for n in ("Schuhe", "Sohle"):
            if n in bpy.data.objects:
                schuh += schuhe._verformt(bpy.data.objects[n])[0]
        if schuh:
            aus["Rolle zu den Schuhen (mm)"] = self._zur_rolle(schuh) * 1000
        # Kopf und Hals zu Polstern, Griffen und Rahmen
        namen = {g.index: g.name for g in self.koerper.vertex_groups}
        if not hasattr(self, "_kopf_i"):
            self._kopf_i = [v.index for v in self.koerper.data.vertices
                            if sum(g.weight for g in v.groups if namen[g.group].startswith(("head", "neck", "jaw"))) > 0.5]
        teile = [o for o in self.geraet["wurzel"].children_recursive if o.type == "MESH"]
        dg = bpy.context.evaluated_depsgraph_get()
        beste = 1.0
        for o in teile:
            oe = o.evaluated_get(dg)
            me = oe.to_mesh()
            me.calc_loop_triangles()
            M = oe.matrix_world
            bvh = BVHTree.FromPolygons([M @ v.co for v in me.vertices], [tuple(t.vertices) for t in me.loop_triangles])
            oe.to_mesh_clear()
            for i in self._kopf_i[::3]:
                ort, _, _, d = bvh.find_nearest(netz[i], 0.3)
                if ort is not None:
                    beste = min(beste, d)
        aus["Kopf und Hals zum Gerät (mm)"] = beste * 1000
        aus["Polster: tiefste Delle (mm)"] = self.delle * 1000
        aus["Polster: Haut oder Kleidung durch die Oberfläche (mm)"] = geraete.durch_polster(self.polster_objekte(), self.auflage()) * 1000
        return aus


UEBUNGEN = {u.name: u for u in (Kniebeuge, Bankdruecken, Latziehen, BankdrueckenKH, SchraegbankdrueckenKH,
                               Beinpresse, Unterarmstuetz, Crunch, Seitheben, RudernKabel,
                               BeinbeugerLiegend)}
