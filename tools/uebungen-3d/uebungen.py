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
    """Haut und die Teile der Kleidung (`namen`), die vorhanden sind (D-465); zum Shirt gehört sein Saumband
    (D-478)."""
    if "Shirt" in namen:
        namen = (*namen, "Saumband")
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
    # Die Figur füllt ihren Rahmen mit 2 % Rand, Gerät am Rand angeschnitten (D-501).
    kamera = {"richtung": 115.0, "neigung": 22.0, "fuellen": 0.02}
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
    # Die Figur füllt ihren Rahmen mit 2 % Rand, Gerät am Rand angeschnitten (D-501).
    kamera = {"richtung": 135.0, "neigung": 10.0, "fuellen": 0.02}
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
    # Die Figur füllt ihren Rahmen mit 2 % Rand, Gerät am Rand angeschnitten (D-501).
    kamera = {"richtung": 100.0, "neigung": 20.0, "fuellen": 0.02}
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
            kleid = self._netz_mit("Shirt", "Shorts", "Saumband")
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
        self.becken0 = self._becken_mitte()
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

    def _becken_mitte(self) -> Vector:
        """Mitte zwischen den Köpfen der Beckenknochen (Welt)."""
        rig = self.rig
        k = rig.kopf
        return (rig.welt(rig.punkt("pelvis.L", k["pelvis.L"])) + rig.welt(rig.punkt("pelvis.R", k["pelvis.R"]))) / 2

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
        Unterschenkel und zu den Schuhen, Kopf und Hals zum Gerät, das Becken gegenüber dem Ausgang (D-479), Dellen im
        Polster."""
        from mathutils.bvhtree import BVHTree

        import schuhe

        netz = _netz(self.koerper)
        kleid = self._netz_mit("Shirt", "Shorts", "Saumband")
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
        # Becken (Auftrag des Produktinhabers, D-479): bleibt in jeder Phase auf dem Polster und hebt sich beim Beugen
        # nicht; gemessen als Verschiebung der Beckenmitte gegenüber dem Ausgang, senkrecht zum Oberschenkelpolster
        # (+ vom Polster weg); die Auflage zeigt die Tiefe der Hüfte am Scheitel (oben)
        aus["Becken gegenüber dem Ausgang angehoben (mm)"] = (self._becken_mitte() - self.becken0).dot(self.n_schenkel) * 1000
        aus["Polster: tiefste Delle (mm)"] = self.delle * 1000
        aus["Polster: Haut oder Kleidung durch die Oberfläche (mm)"] = geraete.durch_polster(self.polster_objekte(), self.auflage()) * 1000
        return aus


class RumaenischesKreuzhebenKH(Uebung):
    """Rumänisches Kreuzheben mit Kurzhanteln, Referenz der Familie „Hüftbeuge“ (D-487), nach dem Ausführungstext der
    App (ACE „Technique Series – Romanian Deadlift“, ExRx „Romanian Deadlift“) und den Werten der Familie (Hüfte 70 bis
    100° gebeugt, Knie 15 bis 25° fest, Rumpf unten 0 bis 45° zur Waagrechten, Last nah am Körper über der Fußmitte).
    Stand etwa hüftbreit (`FUESSE`), Zehen leicht nach außen, ganze Sohle am Boden; die Knie leicht gebeugt und fest
    (`KNIE`). In jeder Hand eine Kurzhantel (8 kg wie beim Seitheben) im Obergriff vor den Oberschenkeln, die Griffe quer
    (`GRIFF_X` neben der Mitte), die Arme fast gestreckt (`ELLBOGEN`). Abwärts schiebt sich die Hüfte nach hinten, der
    Rumpf neigt sich mit geradem Rücken um die Hüftgelenke bis `NEIGUNG_UNTEN`. Die Hanteln gleiten `LUFT` vor Beinen
    und Shorts an der Vorderseite der Beine nach unten; der gemeinsame Schwerpunkt von Körper und Hanteln bleibt über
    der Fußmitte (`_stuetzen`, `_schwerpunkt`). Kopf in Verlängerung des Rumpfs, Kinn leicht eingezogen (`KINN`), der
    Blick geht zum Boden. Zurück derselbe Weg."""

    name = "rumaenisches_kreuzheben_kh"
    titel = "Rumänisches Kreuzheben mit Kurzhanteln"
    kamera = {"richtung": 75.0, "neigung": 8.0}
    vorschau_phase = 1.0
    KH = geraete.KH8
    KH_R = geraete.KH8["griff_d"] / 2
    FUESSE = 0.105  # halber Abstand der Fußgelenke, m (vor dem Maß der Schultern): etwa hüftbreit wie beim Seitheben
    ZEHEN = 8.0
    KNIE = 160.0  # Knie 20° gebeugt und fest (Familie: 15 bis 25°)
    NEIGUNG_OBEN = 3.0  # Rumpf zur Senkrechten im Stand, Grad
    NEIGUNG_UNTEN = 66.0  # Rumpf zur Senkrechten unten, Grad: Griffe knapp unter den Kniegelenken
    KINN = 4.0  # Kopf gegenüber dem Rumpf leicht gebeugt (Kinn eingezogen), Grad
    GRIFF_X = 0.155  # Mitte des Griffs neben der Körpermitte (vor dem Maß der Schultern), m
    ELLBOGEN = 172.0  # Arme fast gestreckt
    LUFT = 0.004  # Köpfe der Hanteln so weit vor Haut, Shorts und Shirt, m: Sie gleiten an den Beinen entlang
    GRIFF_LAGE = 0.65  # Lage des Griffs in der Hand wie beim Seitheben
    SCHRAEG = 0.0
    # Phasen, an denen Hüfte und Arme gesucht werden: Mit fünf Stützen kamen die Köpfe an den Knien (Phase 0,8 bis 0,97)
    # zwischen zwei Stützen bis 8 mm in Haut und Kleidung
    STUETZEN = tuple(i / 16 for i in range(17))
    # Schwerpunkt (`_schwerpunkt`): Anteile der Körperteile an der Masse und Lage ihres Schwerpunkts vom ersten zum
    # zweiten Gelenk (Winter, Biomechanics and Motor Control of Human Movement, 4. Aufl. 2009, Tabelle 4.1); Körper
    # 75 kg angenommen, zwei Kurzhanteln je 8 kg
    KOERPER_KG = 75.0
    HANTEL_KG = 8.0
    fuss_ansichten = ((90, 0.08), (0, 0.12), (180, 0.10), (270, 0.08))
    griff_ansichten = (("griff_vorn", 15.0, 10.0), ("griff_seite", 100.0, 20.0))

    def rahmen_objekte(self) -> list:
        return list(self.hanteln.values())

    def bauen(self) -> None:
        super().bauen()
        rig = self.rig
        k = rig.kopf
        self.hanteln = {s: geraete.kurzhantel(f"Kurzhantel.{s}", self.KH) for s in "LR"}
        self.griff = {s: rig.griff(s, self.GRIFF_LAGE, self.KH_R, schraeg=self.SCHRAEG) for s in "LR"}
        A0 = k["foot.L"]
        w = math.radians(self.ZEHEN)
        x = self.FUESSE * self.mass
        self.knoechel = {"L": Vector((x, A0.y, A0.z)), "R": Vector((-x, A0.y, A0.z))}
        self.zehen = {"L": Vector((math.sin(w), -math.cos(w), 0)), "R": Vector((-math.sin(w), -math.cos(w), 0))}
        ferse, spitze = _fuss(self.koerper, k)
        self.fussmitte_y = A0.y - (A0.y - (ferse + spitze) / 2) * math.cos(w)
        self.H0 = (k["upperleg01.L"] + k["upperleg01.R"]) / 2
        self.S0 = (k["upperarm01.L"] + k["upperarm01.R"]) / 2
        l1 = (k["lowerarm01.L"] - k["upperarm01.L"]).length
        l2 = (k["wrist.L"] - k["lowerarm01.L"]).length
        self.armlaengen = (l1, l2)
        # Schulter bis Handgelenk bei `ELLBOGEN`
        self.reichweite = math.sqrt(l1 * l1 + l2 * l2 - 2 * l1 * l2 * math.cos(math.radians(self.ELLBOGEN)))
        self.sigma = 0.0
        self.raender: dict[str, set] = {}
        self.tabelle = None

    # ------------------------------------------------------------------ Rumpf und Beine

    def _neigung(self, p: float) -> float:
        return self.NEIGUNG_OBEN + (self.NEIGUNG_UNTEN - self.NEIGUNG_OBEN) * p

    def _becken(self, a: float, dy: float, dz: float) -> Matrix:
        return starr(self.H0, self.H0 + Vector((0, dy, dz)), achse_winkel(X, a))

    def _hoehe(self, a: float, dy: float) -> float:
        """Hüfthöhe per Halbierung, bis das Knie `KNIE` gebeugt ist."""
        rig = self.rig
        lo, hi = -0.30, 0.05
        for _ in range(36):
            dz = (lo + hi) / 2
            rig.zuruecksetzen()
            rig.setze("root", self._becken(a, dy, dz))
            if self.kniewinkel(rig.bein("L", self.knoechel["L"], self.zehen["L"], self.ZEHEN)) > self.KNIE:
                hi = dz
            else:
                lo = dz
        return (lo + hi) / 2

    def _rumpf(self, a: float, dy: float, dz: float) -> dict:
        """Becken, Kopf und Beine; gibt die Werte der Beine zurück."""
        rig = self.rig
        rig.zuruecksetzen()
        rig.setze("root", self._becken(a, dy, dz))
        rig.dreh("neck01", achse_winkel(X, self.KINN))
        return {s: rig.bein(s, self.knoechel[s], self.zehen[s], self.ZEHEN) for s in "LR"}

    # ------------------------------------------------------------------ Arme und Hanteln

    def _arm(self, s: str, alpha: float) -> dict:
        """Arm `s` vom Schultergelenk um `alpha` Grad vor der Senkrechten nach unten, die Mitte des Griffs `GRIFF_X` neben
        der Körpermitte und so weit von der Schulter, dass der Ellbogen `ELLBOGEN` hat (die Drehung der Hand um den Griff
        verschiebt das Handgelenk, deshalb gesucht). Ohne Zustand zwischen den Aufrufen: dieselbe Lage ergibt dieselbe
        Haltung. Obergriff, Griff quer (schräg in der Hand, `sigma`), Ellbogen nach hinten außen."""
        rig = self.rig
        sx = 1 if s == "L" else -1
        S = rig.punkt("shoulder01." + s, rig.kopf["upperarm01." + s])
        k = achse_winkel(Y, sx * self.sigma) @ (X * sx)
        pol = Vector((0.4 * sx, 1.0, 0.0))
        a = math.radians(alpha)

        def setze(weite: float, phi: float | None) -> tuple[dict, Vector]:
            b = math.asin(max(-1.0, min(1.0, (sx * self.GRIFF_X * self.mass - S.x) / weite)))
            d = Vector((math.sin(b), -math.sin(a) * math.cos(b), -math.cos(a) * math.cos(b)))
            mitte = S + d * weite
            return rig.arm(s, self.griff[s], mitte, k, pol, 0.0, phi=phi), mitte

        # Drehung der Hand um den Griff einmal frei gesucht (Handgelenk am geradesten), dann fest: Sonst springt sie bei
        # winzigen Änderungen zwischen zwei Lösungen, und mit ihr das Handgelenk. Danach die Entfernung per Halbierung
        # auf den Ellbogenwinkel (172° liegen nur 1,3 mm vor der vollen Streckung); bei fester Drehung wächst er stetig
        vorher = len(rig.meldungen)  # Suchschritte außer Reichweite melden sich; es zählt nur die gewählte Haltung
        phi = setze(self.reichweite + 0.075, None)[0]["phi"]
        lo, hi = self.reichweite - 0.04, self.reichweite + 0.14
        for _ in range(18):
            weite = (lo + hi) / 2
            if setze(weite, phi)[0]["ellbogenwinkel"] < self.ELLBOGEN:
                lo = weite
            else:
                hi = weite
        del rig.meldungen[vorher:]
        arm, mitte = setze((lo + hi) / 2, phi)
        f = (arm["handgelenk"] - arm["ellbogen"]).normalized()
        self.hantel_setzen(s, mitte, k, f)
        arm["mitte"] = mitte
        return arm

    def hantel_setzen(self, s: str, mitte: Vector, k: Vector, f: Vector) -> None:
        Seitheben.hantel_setzen(self, s, mitte, k, f)

    def _koepfe_frei(self) -> float:
        """Kleinster Abstand der Köpfe beider Hanteln zu Haut, Shorts und Shirt (m, negativ = darin) wie beim Seitheben,
        aber an den offenen Rändern der Kleidung (Saum, Bund): Liegt ein Punkt hinter einer Fläche am Rand, zählt er nicht
        als darin. Unter dem Saum der Shorts zeigt deren Normale zur Seite, nicht zum Punkt; so galt ein Kopf 22 mm vor
        der Haut als 40 mm in den Shorts. Zur Haut zählt der Abstand wie beim Seitheben."""
        from mathutils.bvhtree import BVHTree

        import schuhe

        punkte = [q for s in "LR" for q in kopf_punkte(self.hanteln[s], 4)]
        beste = abstand_koerper(self.koerper, punkte)
        for name in ("Shorts", "Shirt"):
            obj = bpy.data.objects.get(name)
            if obj is None:
                continue
            if name not in self.raender:
                zaehler: dict = {}
                for f in obj.data.polygons:
                    for e in f.edge_keys:
                        zaehler[e] = zaehler.get(e, 0) + 1
                offen = {e for e, n in zaehler.items() if n == 1}
                self.raender[name] = {f.index for f in obj.data.polygons if any(e in offen for e in f.edge_keys)}
            rand = self.raender[name]
            pk, pf, _ = schuhe._verformt(obj)
            bvh = BVHTree.FromPolygons(pk, pf)
            for q in punkte:
                ort, n, i, d = bvh.find_nearest(q, 0.05)
                if ort is not None:
                    beste = min(beste, -d if (q - ort).dot(n) < 0 and i not in rand else d)
        return beste

    def _schwerpunkt(self, beine: dict, arme: dict) -> Vector:
        """Gemeinsamer Schwerpunkt von Körper und Hanteln (Raum des Skeletts) nach `KOERPER_KG`, `HANTEL_KG` und den
        Anteilen von Winter: Kopf und Hals 8,1 % (Mitte des Kopfes), Rumpf 49,7 % (Mitte zwischen Hüft- und
        Schultergelenken), Oberarm 2,8 % (43,6 % vom Schultergelenk), Unterarm 1,6 % (43 % vom Ellbogen), Hand 0,6 %
        (am Griff), Oberschenkel 10 % (43,3 % vom Hüftgelenk), Unterschenkel 4,65 % (43,3 % vom Knie), Fuß 1,45 %
        (Fußmitte)."""
        rig = self.rig
        k = rig.kopf
        m, summe = self.KOERPER_KG, Vector()
        teile = []
        H = (beine["L"]["huefte"] + beine["R"]["huefte"]) / 2
        S = (arme["L"]["schulter"] + arme["R"]["schulter"]) / 2
        teile.append((0.081, rig.punkt("head", k["head"] + Vector((0.0, 0.0, 0.09)))))
        teile.append((0.497, (H + S) / 2))
        for s in "LR":
            a, b = arme[s], beine[s]
            teile += [(0.028, a["schulter"].lerp(a["ellbogen"], 0.436)),
                      (0.016, a["ellbogen"].lerp(a["handgelenk"], 0.43)),
                      (0.006, a["mitte"]), (0.100, b["huefte"].lerp(b["knie"], 0.433)),
                      (0.0465, b["knie"].lerp(b["knoechel"], 0.433)),
                      (0.0145, Vector((self.knoechel[s].x, self.fussmitte_y, self.knoechel[s].z)))]
        gesamt = 0.0
        for anteil, p in teile:
            summe += p * (anteil * m)
            gesamt += anteil * m
        for s in "LR":
            summe += arme[s]["mitte"] * self.HANTEL_KG
            gesamt += self.HANTEL_KG
        return summe / gesamt

    def _griffachse(self) -> None:
        """Griff schräg in der Hand: Neigung der Griffachse in der Ebene der Handfläche, bei der das Handgelenk in der
        Mitte der Bewegung am geradesten ist (gesucht von −35 bis 35°, dann fein); für beide Hände gespiegelt."""
        a = self._neigung(0.5)

        def gesamt(sigma: float) -> float:
            self.sigma = sigma
            dz = self._hoehe(a, 0.05)
            self._rumpf(a, 0.05, dz)
            return self._arm("L", 0.0)["handgelenk_gesamt"]

        beste = min(range(-35, 36, 5), key=gesamt)
        lo, hi = beste - 5.0, beste + 5.0
        for _ in range(14):
            m1, m2 = hi - 0.618 * (hi - lo), lo + 0.618 * (hi - lo)
            if gesamt(m1) < gesamt(m2):
                hi = m2
            else:
                lo = m1
        self.sigma = (lo + hi) / 2

    def _pose(self, a: float, dy: float, alpha: float) -> tuple[dict, dict]:
        dz = self._hoehe(a, dy)
        beine = self._rumpf(a, dy, dz)
        arme = {s: self._arm(s, alpha) for s in "LR"}
        return beine, arme

    def _stuetzen(self) -> None:
        """Hüfte und Arme an den `STUETZEN`, gesucht, wenn Kleidung und Schuhe da sind: Für die Neigung der Phase rückt die
        Hüfte so weit nach hinten (`dy`), dass der gemeinsame Schwerpunkt über der Fußmitte steht; die Arme hängen so weit
        vor der Senkrechten (`alpha`, per Halbierung), dass die Köpfe der Hanteln `LUFT` vor Haut, Shorts und Shirt
        bleiben. Jede Stütze beginnt bei den Werten der vorigen (`alpha` erst ±12°, bei Bedarf weiter)."""
        rig = self.rig
        self._griffachse()

        def frei(a: float, dy: float, alpha: float) -> float:
            self._pose(a, dy, alpha)
            rig.anwenden()
            return self._koepfe_frei()

        def arme_suchen(a: float, dy: float, start: float) -> float:
            lo, hi = start - 12.0, start + 12.0
            while frei(a, dy, lo) >= self.LUFT and lo > -60.0:
                lo -= 12.0
            while frei(a, dy, hi) < self.LUFT and hi < 60.0:
                hi += 12.0
            for _ in range(9):
                alpha = (lo + hi) / 2
                if frei(a, dy, alpha) < self.LUFT:
                    lo = alpha
                else:
                    hi = alpha
            return hi

        dys, alphas = [], []
        dy, alpha = 0.0, 15.0
        for p in self.STUETZEN:
            a = self._neigung(p)
            for _ in range(6):
                alpha = arme_suchen(a, dy, alpha)
                beine, arme = self._pose(a, dy, alpha)
                fehler = self._schwerpunkt(beine, arme).y - self.fussmitte_y
                if abs(fehler) < 0.0005:
                    break
                dy -= fehler / 0.8
            else:  # nicht unter 0,5 mm: Arme noch einmal zur letzten Lage der Hüfte
                alpha = arme_suchen(a, dy, alpha)
            dys.append(dy)
            alphas.append(alpha)
        self.tabelle = {"sigma": self.sigma, "dy": dys, "alpha": alphas, "werte": list(zip(self.STUETZEN, dys, alphas))}
        rig.zuruecksetzen()

    @staticmethod
    def _glatt(werte: list[float], p: float) -> float:
        """Catmull-Rom-Spline durch die Werte an gleich weit auseinander liegenden Stützen (0 bis 1): stetig, mit stetiger
        Steigung, ohne das Überschwingen eines Polynoms hohen Grades."""
        n = len(werte) - 1
        x = min(max(p, 0.0), 1.0) * n
        i = min(int(x), n - 1)
        t = x - i
        p1, p2 = werte[i], werte[i + 1]
        p0 = werte[i - 1] if i > 0 else 2 * p1 - p2
        p3 = werte[i + 2] if i + 2 <= n else 2 * p2 - p1
        return 0.5 * (2 * p1 + (p2 - p0) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t
                      + (3 * p1 - p0 - 3 * p2 + p3) * t ** 3)

    def setzen(self, p: float) -> None:
        if self.tabelle is None:
            self._stuetzen()
        self._phase = p  # für den Stand in `_ruecken`
        super().setzen(p)

    def haltung(self, p: float) -> None:
        a = self._neigung(p)
        dy = self._glatt(self.tabelle["dy"], p)
        alpha = self._glatt(self.tabelle["alpha"], p)
        beine, arme = self._pose(a, dy, alpha)
        rig = self.rig
        L, A = beine["L"], arme["L"]
        schultern = (rig.punkt("shoulder01.L", rig.kopf["upperarm01.L"])
                     + rig.punkt("shoulder01.R", rig.kopf["upperarm01.R"])) / 2
        huefte = (beine["L"]["huefte"] + beine["R"]["huefte"]) / 2
        rumpf = schultern - huefte
        oberschenkel = L["knie"] - L["huefte"]
        unterschenkel = L["knie"] - L["knoechel"]
        mitte = (arme["L"]["mitte"] + arme["R"]["mitte"]) / 2
        schwer = self._schwerpunkt(beine, arme)
        self.werte = {
            "Schwerpunkt über der Fußmitte (cm, + dahinter)": (schwer.y - self.fussmitte_y) * 100,
            "Griff schräg in der Hand (Grad)": self.sigma,
            "Kniewinkel (Grad)": self.kniewinkel(L),
            "Hüfte (Rumpf zum Oberschenkel, Grad, 180 = gestreckt)": math.degrees(rumpf.angle(oberschenkel)),
            "Rumpf zur Waagrechten (Grad)": math.degrees(math.asin(max(-1.0, min(1.0, rumpf.normalized().z)))),
            "Unterschenkel zur Senkrechten (Grad)": math.degrees(unterschenkel.angle(Z)),
            "Hanteln über der Fußmitte (cm, + dahinter)": (mitte.y - self.fussmitte_y) * 100,
            "Griffe unter dem Kniegelenk (cm)": (L["knie"].z - mitte.z) * 100,
            "Arme vor der Senkrechten (Grad)": alpha,
            "Ellbogenwinkel": A["ellbogenwinkel"],
            "Handgelenk gesamt (Grad)": A["handgelenk_gesamt"],
            "Handgelenk gestreckt (Grad)": A["handgelenk_streckung"],
            "Handgelenk seitlich (Grad, + zum Daumen)": A["handgelenk_seitlich"],
            "Pronation": A["pronation"],
            "Griffe auseinander (cm)": (arme["L"]["mitte"] - arme["R"]["mitte"]).length * 100,
        }

    def nah_punkte(self) -> list[Vector]:
        """Punkte für die Nahaufnahme des Griffs: linke Hand und beide Köpfe ihrer Hantel (Welt)."""
        rig = self.rig
        hand = rig.welt(rig.punkt("wrist.L", rig.kopf["metacarpal2.L"]))
        M = self.hanteln["L"].matrix_world
        ende = self.KH["laenge"] / 2
        return ([q for q in _netz(self.koerper) if (q - hand).length < 0.10]
                + [M @ Vector((ende, 0, 0)), M @ Vector((-ende, 0, 0))])

    def zusatzwerte(self) -> dict:
        """Hanteln und Hände (mm) wie beim Seitheben, dazu der Abstand der beiden Hanteln zueinander; Lende, Nacken und
        Blick (D-490, `_ruecken`)."""
        werte = Seitheben.zusatzwerte(self)
        links = kopf_punkte(self.hanteln["L"], 4)
        rechts = kopf_punkte(self.hanteln["R"], 4)
        werte["Kurzhanteln zueinander (mm)"] = min((p - q).length for p in links for q in rechts) * 1000
        werte.update(self._ruecken())
        return werte

    # ------------------------------------------------------------------ Lende, Nacken und Blick (D-490)

    def _lende(self) -> list[float]:
        """Hautlinie der Rückenmitte von 2 cm über `spine05` bis 1 cm über `spine03` (etwa L5 bis L1), alle 5 mm per
        Strahl von hinten auf das verformte Netz, im Raum des Beckens der Grundhaltung (hinten = +y)."""
        from mathutils.bvhtree import BVHTree
        rig = self.rig
        k = rig.kopf
        Gi = rig.g("root").inverted()
        punkte = [Gi @ rig.lokal(q) for q in _netz(self.koerper)]
        bvh = BVHTree.FromPolygons(punkte, [tuple(f.vertices) for f in self.koerper.data.polygons])
        z0, z1 = k["spine05"].z + 0.02, k["spine03"].z + 0.01
        n = int(round((z1 - z0) / 0.005))
        linie = []
        for i in range(n + 1):
            treffer = bvh.ray_cast(Vector((0.0, 0.6, z0 + i * 0.005)), Vector((0.0, -1.0, 0.0)))[0]
            linie.append(treffer.y if treffer is not None else float("nan"))
        return linie

    @staticmethod
    def _kruemmung(linie: list[float]) -> float:
        """Winkel zwischen der Tangente der unteren und der oberen 3 cm der Linie (Grad; negativ = hohl wie im Stand)."""
        def tangente(ys: list[float]) -> float:
            zs = [i * 0.005 for i in range(len(ys))]
            mz, my = sum(zs) / len(zs), sum(ys) / len(ys)
            return math.degrees(math.atan2(sum((z - mz) * (y - my) for z, y in zip(zs, ys)),
                                           sum((z - mz) ** 2 for z in zs)))
        return tangente(linie[:7]) - tangente(linie[-7:])

    def _ruecken(self) -> dict:
        """Lende: Drehung der Lendenwirbel (`spine05` bis `spine03`) gegen das Becken und Krümmung der Hautlinie
        (`_lende`) gegenüber dem Stand (Phase 0); Nacken: Beugung des Kopfs gegen den Rumpf (`spine01` zu `head`);
        Blick: Vorwärtsrichtung des Kopfs unter der Waagrechten. Der Stand wird einmal gemessen und gemerkt."""
        rig = self.rig

        def gedreht(a: str, b: str) -> float:
            """Drehung von `b` gegen `a` (Grad); positiv, wenn sie um +x geht (nach vorn gebeugt)."""
            q = (rig.g(a).to_3x3().inverted() @ rig.g(b).to_3x3()).to_quaternion()
            return math.degrees(q.angle) * (1.0 if q.axis.x >= 0 else -1.0)

        linie = self._lende()
        if getattr(self, "_lende_stand", None) is None:
            jetzt = self._phase
            self.setzen(0.0)
            self._lende_stand = self._lende()
            self.setzen(jetzt)
        stand = self._lende_stand
        blick = (rig.g("head").to_3x3() @ Vector((0.0, -1.0, 0.0))).normalized()
        return {
            "Lende: Wirbel gegen das Becken gedreht (Grad)": max(abs(gedreht("root", b)) for b in ("spine05", "spine04",
                                                                                                   "spine03")),
            "Lende: Krümmung der Hautlinie (Grad, negativ = hohl)": self._kruemmung(linie),
            "Lende: Krümmung gegenüber dem Stand (Grad, + flacher)": self._kruemmung(linie) - self._kruemmung(stand),
            "Lende: Hautlinie gegenüber dem Stand verschoben (mm)": max(abs(a - b) for a, b in zip(linie, stand)) * 1000,
            "Nacken: Kopf gegen den Rumpf gebeugt (Grad)": gedreht("spine01", "head"),
            "Blick unter der Waagrechten (Grad)": math.degrees(math.asin(max(-1.0, min(1.0, -blick.z)))),
        }


# ---------------------------------------------------------------------- Familie „Senkrechtes Drücken“ (D-491)


class SchulterdrueckenMaschine(Uebung):
    """Schulterdrücken an der Maschine, sitzend (Familie „Senkrechtes Drücken“, D-491), nach dem Ausführungstext der App
    (ExRx „Lever Shoulder Press“) und den Werten der Familie, für die Maschine angepasst (D-492): Griffe unten zwischen
    Kinn und Ohr, Oberarm etwa 30° unter der Waagrechten, Ellbogen etwa 115° gebeugt, Unterarme annähernd senkrecht,
    oben fast gestreckt. Sitzend auf dem Sitz der Maschine (`geraete.schulterpresse`), das Gesäß mit den Shorts `TIEF`
    im Polster, der Rücken mit dem Shirt ebenso tief im Rückenpolster, das `LEHNE` Grad nach hinten geneigt ist. Füße
    etwa schulterbreit flach am Boden, Knie `KNIE`. Hände im Obergriff an den waagrechten Griffen der beiden Hebel.
    Ausgang: Griffe etwa auf Höhe von Kinn bis Ohr (`GRIFF_UNTEN`), `VOR` vor der Ebene der Schultern und so weit
    entfernt, dass der Ellbogen `ELLBOGEN_UNTEN` hat; der Oberarm steht etwas unter der Waagrechten, der Unterarm
    annähernd senkrecht, die Griffe neben dem Kopf. Jeder Hebel dreht um eine eigene Achse hinter der Person (`HEBEL` lang): Die Griffe laufen
    auf einem Bogen nach oben und zusammen (zusammenlaufende Arme), oben sind die Arme fast gestreckt (`ELLBOGEN_OBEN`),
    die Griffe `X_OBEN` neben der Mitte über den Schultergelenken; die Schulterblätter drehen mit nach oben
    (`SCHULTER_HOCH`). Kopf gerade, Blick nach vorn. Der Gewichtsblock hebt sich mit den Hebeln. Zurück derselbe Weg."""

    name = "schulterdruecken_maschine"
    titel = "Schulterdrücken an der Maschine"
    # Schräg von vorn (verglichen mit 15°/6°, 45°/10°, 60°/10°): Gesicht, beide Arme und das Zusammenlaufen der Hebel zu
    # sehen; ab 45° verdeckt oben der Kopf den rechten Arm
    kamera = {"richtung": 30.0, "neigung": 8.0}
    vorschau_phase = 1.0
    LEHNE = 10.0  # Rückenpolster gegen die Senkrechte nach hinten geneigt, Grad
    KNIE = 95.0
    FUESSE = 0.17  # halber Abstand der Fußgelenke vor dem Maß der Schultern, m
    ZEHEN = 10.0
    SITZ_UNTER_KNIE = 0.07  # Oberseite des Sitzes so weit unter den Kniegelenken im Stand, m: Oberschenkel fast waagrecht
    TIEF = 0.004  # Gesäß und Rücken mit der Kleidung so tief in den Polstern, m
    # Ausgang (D-492, Entscheidung des Produktinhabers): Griffe etwa auf Höhe von Kinn bis Ohr, Oberarm etwas unter der
    # Waagrechten, Unterarm annähernd senkrecht. Höhe der Mitte des Griffs als Anteil von der Höhe des Kinns (0) zur
    # Mitte des Ohrs (1), am Netz gemessen; bis D-491 Oberarm 10° unter der Waagrechten, Unterarm senkrecht, die Griffe
    # standen 30 cm über den Schultergelenken (Stirn). Tiefer als das Ohr ginge mit senkrechtem Unterarm nur mit einem
    # Ellbogen unter 55°
    GRIFF_UNTEN = 0.75
    # Ellbogen im Ausgang: Die Entfernung der Griffe von den Schultergelenken wird darauf gesucht (Unterarm so senkrecht
    # wie möglich); mit senkrechtem Unterarm und Griffen auf Ohrhöhe wären es 60°
    ELLBOGEN_UNTEN = 65.0
    VOR = 45.0  # Ausgang: Griff so weit vor der Ebene der Schultern (Richtung vom Schultergelenk, waagrecht), Grad
    HAND = 0.075  # Mitte des Griffs vom Handgelenk längs des Unterarms, m
    # oben: Mitte des Griffs neben der Mitte des Körpers (vor dem Maß der Schultern), m; bei 0,19 liefen die Griffe so
    # früh zusammen, dass der Unterarm in der Mitte 17° nach innen kippte, mit 0,24 höchstens 13° (D-491); mit den
    # tieferen Griffen im Ausgang (D-492) knickte das Handgelenk bei 0,24 bis 12,2°, bei 0,26 bis 10,6°
    X_OBEN = 0.26
    Y_OBEN = 0.0  # oben: Griff so weit vor dem Schultergelenk, m
    ELLBOGEN_OBEN = 172.0
    HEBEL = 0.70  # Drehachse bis Mitte des Griffs, m
    SCHULTER_HOCH = 14.0  # oben: Schlüsselbeine angehoben, Grad
    GRIFF_LAGE = 0.65
    SCHRAEG = 15.0
    STRECKUNG = 0.0
    griff_ansichten = (("presse_vorn", 20.0, 10.0), ("presse_aussen", 100.0, 20.0))

    def rahmen_objekte(self) -> list:
        if self.geraet is None:
            return []
        g = self.geraet
        return [g["sitz"], g["lehne"], *g["griffe"].values()]

    def polster_objekte(self) -> list:
        return self.geraet["polster"] if self.geraet else []

    def auflage(self) -> list:
        return auflage_objekte(self.koerper, "Shirt", "Shorts")

    def bauen(self) -> None:
        super().bauen()
        rig = self.rig
        k = rig.kopf
        self.l_ober = (k["lowerleg01.L"] - k["upperleg01.L"]).length
        self.l_unter = (k["foot.L"] - k["lowerleg01.L"]).length
        self.armlaengen = ((k["lowerarm01.L"] - k["upperarm01.L"]).length, (k["wrist.L"] - k["lowerarm01.L"]).length)
        self.H0 = (k["upperleg01.L"] + k["upperleg01.R"]) / 2
        self.R = achse_winkel(X, -self.LEHNE)
        ruhe = [v.co for v in self.koerper.data.vertices]
        huefte, hals = k["upperleg01.L"].z, k["neck01"].z
        self.gesaess_i = [i for i, q in enumerate(ruhe) if abs(q.x) < 0.17 and huefte - 0.12 < q.z < huefte + 0.06 and q.y > 0.02]
        self.ruecken_i = [i for i, q in enumerate(ruhe) if abs(q.x) < 0.14 and huefte + 0.12 < q.z < hals - 0.05 and q.y > 0.0]
        self.sitz_oben = rig.welt(k["lowerleg01.L"]).z - self.SITZ_UNTER_KNIE
        self.verschiebung = Vector((0.0, 0.0, 0.0))
        self._sitzen()
        self.geraet = None
        self.geloest = False
        self.delle = 0.0
        self.griff = {s: rig.griff(s, self.GRIFF_LAGE, geraete.SCHULTERPRESSE["griff_d"] / 2, schraeg=self.SCHRAEG)
                      for s in "LR"}

    # ------------------------------------------------------------------ Sitzen und Beine

    def _becken(self) -> Matrix:
        return starr(self.H0, self.H0 + self.verschiebung, self.R)

    def _beine(self) -> dict:
        """Füße flach am Boden, so weit vorn, dass das Knie `KNIE` gebeugt ist; das Knie zeigt nach vorn, etwas außen."""
        rig = self.rig
        k = rig.kopf
        D = math.sqrt(self.l_ober ** 2 + self.l_unter ** 2 - 2 * self.l_ober * self.l_unter * math.cos(math.radians(self.KNIE)))
        aus = {}
        for s, sx in (("L", 1), ("R", -1)):
            H = rig.punkt("pelvis." + s, k["upperleg01." + s])
            A0 = k["foot." + s]
            dx = sx * self.FUESSE * self.mass - H.x
            dz = H.z - A0.z
            dy = math.sqrt(max(D * D - dx * dx - dz * dz, 0.0))
            aus[s] = rig.bein(s, Vector((H.x + dx, H.y - dy, A0.z)), Vector((0.15 * sx, -1.0, 0.1)).normalized(), self.ZEHEN)
        return aus

    def _sitzen(self) -> None:
        """Becken senkrecht über den Sitz, bis die tiefste Stelle des Gesäßes (Haut) `TIEF` unter der Oberseite liegt; mit
        der Kleidung wird der Sitz in `_loesen` nachgeführt."""
        rig = self.rig
        oben = self.sitz_oben - rig.versatz.z
        self.verschiebung = Vector((0.0, 0.0, oben + 0.09 - self.H0.z))
        for _ in range(4):
            rig.zuruecksetzen()
            rig.setze("root", self._becken())
            self._beine()
            rig.anwenden()
            tief = min(rig.lokal(_netz(self.koerper)[i]).z for i in self.gesaess_i)
            self.verschiebung.z += oben - self.TIEF - tief
        rig.zuruecksetzen()

    def _torso(self, p: float) -> float:
        rig = self.rig
        rig.setze("root", self._becken())
        hoch = self.SCHULTER_HOCH * p
        rig.dreh("clavicle.L", achse_winkel(-Y, hoch))
        rig.dreh("clavicle.R", achse_winkel(Y, hoch))
        return hoch

    # ------------------------------------------------------------------ Maschine

    def _punkte(self, *namen: str) -> list[Vector]:
        import schuhe

        aus = []
        for n in namen:
            if n in bpy.data.objects:
                aus += schuhe._verformt(bpy.data.objects[n])[0]
        return aus

    def _loesen(self) -> None:
        """Polster, Bahn der Griffe und Maschine, wenn die Kleidung da ist (erstes `setzen`): Sitz so hoch, dass das
        Gesäß mit den Shorts `TIEF` im Polster liegt; Rückenpolster so, dass der Rücken mit dem Shirt ebenso tief darin
        liegt. Griffe unten aus der Haltung der Arme (Oberarm, senkrechter Unterarm), oben über den Schultergelenken; dazu
        je Seite die Drehachse: Mitte des Kreises durch beide Lagen mit dem Halbmesser `HEBEL`, hinter der Person."""
        rig = self.rig
        k = rig.kopf
        rig.zuruecksetzen()
        self._torso(0.0)
        self._beine()
        rig.anwenden()
        netz = _netz(self.koerper)
        kleid = self._punkte("Shirt", "Saumband", "Shorts")
        H = rig.welt((rig.punkt("pelvis.L", k["upperleg01.L"]) + rig.punkt("pelvis.R", k["upperleg01.R"])) / 2)
        S = {s: rig.welt(rig.punkt("shoulder01." + s, k["upperarm01." + s])) for s in "LR"}
        # Sitz: tiefste Stelle unter dem Gesäß (Haut und Shorts) zwischen den Oberschenkeln und hinter den Knien
        sx_, sy_, _ = geraete.SCHULTERPRESSE["sitz"]
        sitz_y = H.y - 0.04
        alle = [netz[i] for i in self.gesaess_i] + kleid
        unten = [q for q in alle if abs(q.x) < sx_ / 2 and abs(q.y - sitz_y) < sy_ / 2 and q.z < H.z]
        sitz_z = min(q.z for q in unten) + self.TIEF
        sitz = Vector((0.0, sitz_y, sitz_z))
        # Rückenpolster: Ebene mit der Normale n zur Person, `TIEF` hinter dem hintersten Punkt von Rücken und Shirt
        a = math.radians(self.LEHNE)
        oben = Vector((0.0, math.sin(a), math.cos(a)))
        n = X.cross(oben)
        schulter_z = (S["L"].z + S["R"].z) / 2
        ruecken = [netz[i] for i in self.ruecken_i] + [q for q in kleid if abs(q.x) < 0.14 and q.y > H.y and sitz_z + 0.10 < q.z < schulter_z - 0.02]
        c = min(q.dot(n) for q in ruecken) + self.TIEF
        lx, ly, _ = geraete.SCHULTERPRESSE["lehne"]
        z_mitte = sitz_z + 0.05 + ly / 2 * oben.z
        for _ in range(3):  # alle Punkte von Haut und Kleidung über der Fläche des Polsters
            y_mitte = (n.z * z_mitte - c) / -n.y
            lehne = Vector((0.0, y_mitte, z_mitte))
            ueber = [q for q in [netz[i] for i in range(len(netz))] + kleid
                     if abs(q.x) < lx / 2 and abs((q - lehne).dot(oben)) < ly / 2 and -0.05 < (q - lehne).dot(n) < 0.10]
            c = min(q.dot(n) for q in ueber) + self.TIEF
        # Bahn der Griffe
        l1, l2 = self.armlaengen
        v = math.radians(self.VOR)
        self.kinn_z, self.ohr_z = self._kopf_hoehen(netz)
        ziel_z = self.kinn_z + self.GRIFF_UNTEN * (self.ohr_z - self.kinn_z)
        rig.zuruecksetzen()
        self._torso(1.0)
        S1 = {s: rig.welt(rig.punkt("shoulder01." + s, k["upperarm01." + s])) for s in "LR"}
        rig.zuruecksetzen()
        self.bahn = {}
        hebel, griffe = {}, {}
        for s, sx in (("L", 1), ("R", -1)):
            # Griff auf der Höhe `ziel_z`, waagrecht `VOR` vor der Ebene der Schultern; Entfernung per Halbierung, bis der
            # Ellbogen `ELLBOGEN_UNTEN` hat
            richtung = Vector((sx * math.cos(v), -math.sin(v), 0.0))
            lo, hi = 0.05, 0.50
            for _ in range(24):
                G0 = Vector((S[s].x, S[s].y, ziel_z)) + richtung * ((lo + hi) / 2)
                rig.zuruecksetzen()
                self._torso(0.0)
                vorher = len(rig.meldungen)
                arm = rig.arm(s, self.griff[s], rig.lokal(G0), Vector((sx, 0.0, 0.0)), Vector((sx, -0.3, -1.0)).normalized(),
                              self.STRECKUNG, ellbogen=self._regel)
                del rig.meldungen[vorher:]
                if arm["ellbogenwinkel"] < self.ELLBOGEN_UNTEN:
                    lo = (lo + hi) / 2
                else:
                    hi = (lo + hi) / 2
            G0 = Vector((S[s].x, S[s].y, ziel_z)) + richtung * ((lo + hi) / 2)
            rig.zuruecksetzen()
            G1 = Vector((sx * self.X_OBEN * self.mass, S1[s].y - self.Y_OBEN, 0.0))
            k0 = Vector((sx, 0.0, 0.0))  # Griff im Ausgang quer, nach außen; fest am Hebel
            k_oben = k0.copy()
            for _ in range(3):
                # Höhe oben per Halbierung, bis der Ellbogen `ELLBOGEN_OBEN` hat; die Richtung des Griffs oben folgt aus dem
                # Hebel, darum dreimal: Griff oben, Hebel, Richtung oben
                lo, hi = S1[s].z + 0.3, S1[s].z + 0.9
                for _ in range(24):
                    G1.z = (lo + hi) / 2
                    rig.zuruecksetzen()
                    self._torso(1.0)
                    vorher = len(rig.meldungen)
                    arm = rig.arm(s, self.griff[s], rig.lokal(G1), k_oben, Vector((sx, -0.3, -1.0)).normalized(),
                                  self.STRECKUNG, ellbogen=self._regel)
                    del rig.meldungen[vorher:]
                    if arm["ellbogenwinkel"] < self.ELLBOGEN_OBEN:
                        lo = G1.z
                    else:
                        hi = G1.z
                G1.z = (lo + hi) / 2
                rig.zuruecksetzen()
                sehne = G1 - G0
                hinten = Vector((0.0, 1.0, 0.0))
                quer = (hinten - sehne * (hinten.dot(sehne) / sehne.length_squared)).normalized()
                h = math.sqrt(max(self.HEBEL ** 2 - sehne.length_squared / 4, 0.0))
                P = (G0 + G1) / 2 + quer * h
                achse = (G0 - P).cross(G1 - P).normalized()
                delta = (G0 - P).angle(G1 - P)
                k_oben = Matrix.Rotation(delta, 3, achse) @ k0
            self.bahn[s] = (P, achse, delta, G0, k0)
            hebel[s] = (P, achse)
            griffe[s] = (G0, k0)
        self.sitz_welt, self.lehne_welt = sitz, (lehne, oben)
        self.geraet = geraete.schulterpresse(sitz, (lehne, oben), hebel, griffe)
        self.polster_ruhe = {o.name: geraete.weiches_polster(o) for o in self.polster_objekte()}
        # Das neue Netz der Polster liegt einige Millimeter neben der Fläche des Kastens: jedes Polster längs seiner
        # Normale so verschieben, dass die tiefste Stelle von Haut und Kleidung `TIEF` darin liegt
        rig.zuruecksetzen()
        self._torso(0.0)
        self._beine()
        rig.anwenden()
        punkte = self._auflage_punkte()
        for obj in self.polster_objekte():
            n_welt = (obj.matrix_world.to_3x3() @ Z).normalized()
            obj.matrix_world = Matrix.Translation(n_welt * (self.TIEF - self._tiefe(obj, punkte))) @ obj.matrix_world
        rig.zuruecksetzen()

    def _auflage_punkte(self) -> list[Vector]:
        dg = bpy.context.evaluated_depsgraph_get()
        punkte = []
        for obj in self.auflage():
            oe = obj.evaluated_get(dg)
            me = oe.to_mesh()
            punkte += [oe.matrix_world @ v.co for v in me.vertices]
            oe.to_mesh_clear()
        return punkte

    @staticmethod
    def _tiefe(obj, punkte: list[Vector]) -> float:
        """Wie tief Haut und Kleidung (`punkte`, Welt) höchstens unter der Oberseite des Polsters in Ruhe liegen (m), über
        seiner Fläche im eigenen Raum gemessen (Hüllbox; die Delle ändert die Oberseite nicht)."""
        Mi = obj.matrix_world.inverted()
        bb = [Vector(c) for c in obj.bound_box]
        lo = Vector((min(c.x for c in bb), min(c.y for c in bb), min(c.z for c in bb)))
        hi = Vector((max(c.x for c in bb), max(c.y for c in bb), max(c.z for c in bb)))
        tiefe = -1.0
        for q in punkte:
            ql = Mi @ q
            if lo.x <= ql.x <= hi.x and lo.y <= ql.y <= hi.y and lo.z < ql.z < hi.z + 0.05:
                tiefe = max(tiefe, hi.z - ql.z)
        return tiefe

    def _kopf_hoehen(self, netz: list[Vector]) -> tuple[float, float]:
        """Höhe (Welt) des Kinns (tiefster Punkt vorn in der Mitte des Kopfs) und der Mitte des Ohrs (Mitte der seitlichsten
        Punkte des Kopfs zwischen 7 cm unter und 2 cm über den Augen)."""
        rig = self.rig
        k = rig.kopf
        namen = {g.index: g.name for g in self.koerper.vertex_groups}
        kopf = [q for v, q in zip(self.koerper.data.vertices, netz)
                if sum(x.weight for x in v.groups if namen[x.group].startswith(("head", "jaw", "eye", "special", "tongue",
                                                                                 "levator", "oris", "orbicularis",
                                                                                 "temporalis"))) > 0.5]
        auge = rig.welt((rig.punkt("eye.L", k["eye.L"]) + rig.punkt("eye.R", k["eye.R"])) / 2)
        mitte_y = sum(q.y for q in kopf) / len(kopf)
        kinn = min(q.z for q in kopf if abs(q.x) < 0.015 and q.y < mitte_y - 0.05)
        ohr = [q.z for q in kopf if abs(q.x) > 0.07 and auge.z - 0.07 < q.z < auge.z + 0.02]
        return kinn, sum(ohr) / len(ohr)

    def _griff_lage(self, s: str, p: float) -> tuple[Vector, Vector, Matrix]:
        """Mitte und Richtung des Griffs (Welt) in Phase p und die Drehung des Hebels."""
        P, achse, delta, G0, k0 = self.bahn[s]
        D = Matrix.Rotation(delta * p, 3, achse)
        return P + D @ (G0 - P), D @ k0, D

    def setzen(self, p: float) -> None:
        if not self.geloest:
            self.geloest = True
            self._loesen()
        self._phase_jetzt = p
        super().setzen(p)
        self.delle = geraete.eindruecken(self.polster_objekte(), self.polster_ruhe, self.auflage())

    # ------------------------------------------------------------------ Haltung

    @staticmethod
    def _regel(S: Vector, W: Vector, l1: float, l2: float) -> Vector:
        return ellbogen_zur_richtung(S, W, l1, l2, Z)

    def haltung(self, p: float) -> None:
        rig = self.rig
        hoch = self._torso(p)
        beine = self._beine()
        arme, griffe = {}, {}
        for s, sx in (("L", 1), ("R", -1)):
            G, kk, D = self._griff_lage(s, p)
            griffe[s] = G
            arme[s] = rig.arm(s, self.griff[s], rig.lokal(G), kk, Vector((sx, -0.3, -1.0)).normalized(), self.STRECKUNG,
                              ellbogen=self._regel)
            P = self.bahn[s][0]
            self.geraet["hebel"][s].matrix_world = (Matrix.Translation(P) @ D.to_4x4() @ Matrix.Translation(-P)
                                                    @ self.geraet["hebel0"][s])
        hub = geraete.SCHULTERPRESSE["block_hub"] * p
        self.geraet["block"].matrix_world = Matrix.Translation(Vector((0, 0, hub))) @ self.geraet["block0"]
        A, L = arme["L"], beine["L"]
        ober = A["ellbogen"] - A["schulter"]
        unter = A["handgelenk"] - A["ellbogen"]
        S = rig.welt(A["schulter"])
        hebung = math.degrees(math.asin(max(-1.0, min(1.0, ober.normalized().z))))
        self.werte = {
            "Ellbogenwinkel": A["ellbogenwinkel"],
            "Oberarm zur Waagrechten (Grad, + darüber, ganze Bewegung)": hebung,
            "Oberarm vor der Ebene der Schultern (Grad, bis 30° über der Waagrechten)":
                math.degrees(math.atan2(-ober.y, abs(ober.x))) if hebung < 30 else float("nan"),
            "Unterarm zur Senkrechten": math.degrees(unter.angle(Z)),
            "Handgelenk gesamt (Grad)": A["handgelenk_gesamt"],
            "Handgelenk gestreckt (Grad)": A["handgelenk_streckung"],
            "Handgelenk seitlich (Grad, + zum Daumen)": A["handgelenk_seitlich"],
            "Pronation": A["pronation"],
            "Schlüsselbein gehoben (Grad)": hoch,
            "Griffe auseinander (cm)": (griffe["L"].x - griffe["R"].x) * 100,
            "Griffe über dem Schultergelenk (cm)": (griffe["L"].z - S.z) * 100,
            "Griffe vor dem Schultergelenk (cm)": (S.y - griffe["L"].y) * 100,
            "Griffe über dem Kinn (cm)": (griffe["L"].z - self.kinn_z) * 100,
            "Griffe unter der Mitte des Ohrs (cm)": (self.ohr_z - griffe["L"].z) * 100,
            "Hebel der Maschine gedreht (Grad)": math.degrees(self.bahn["L"][2] * p),
            "Kniewinkel (Grad)": self.kniewinkel(L),
        }

    def nah_punkte(self) -> list[Vector]:
        """Punkte für die Nahaufnahme des Griffs: linke Hand und ihr Griff (Welt)."""
        rig = self.rig
        hand = rig.welt(rig.punkt("wrist.L", rig.kopf["metacarpal2.L"]))
        G, kk, _ = self._griff_lage("L", self._phase_jetzt)
        halb = geraete.SCHULTERPRESSE["griff_l"] / 2
        return [q for q in _netz(self.koerper) if (q - hand).length < 0.10] + [G - kk * halb, G + kk * halb]

    def zusatzwerte(self) -> dict:
        """Polster (Gesäß und Rücken mit Kleidung darin, Delle, nichts ragt durch), Abstand von Kopf und Armen zu Hebeln,
        Griffen und Rahmen, Finger am eigenen Griff (mm)."""
        from mathutils.bvhtree import BVHTree

        dg = bpy.context.evaluated_depsgraph_get()
        g = self.geraet
        auflage = self.auflage()
        punkte = self._auflage_punkte()
        werte = {"Gesäß im Sitz (mm)": self._tiefe(g["sitz"], punkte) * 1000,
                 "Rücken im Polster (mm)": self._tiefe(g["lehne"], punkte) * 1000}
        werte["Polster: tiefste Delle (mm)"] = self.delle * 1000
        werte["Polster: Haut oder Kleidung durch die Oberfläche (mm)"] = geraete.durch_polster(self.polster_objekte(),
                                                                                              auflage) * 1000
        # Abstand zu den Teilen der Maschine ohne die Polster
        teile = [o for o in g["wurzel"].children_recursive if o.type == "MESH" and o not in g["polster"]]
        baeume = []
        for obj in teile:
            oe = obj.evaluated_get(dg)
            me = oe.to_mesh()
            baeume.append(BVHTree.FromPolygons([oe.matrix_world @ v.co for v in me.vertices], [tuple(f.vertices) for f in me.polygons]))
            oe.to_mesh_clear()
        namen = {gr.index: gr.name for gr in self.koerper.vertex_groups}
        netz = _netz(self.koerper)

        def gruppe(v, *anfang) -> bool:
            return sum(x.weight for x in v.groups if namen[x.group].startswith(anfang)) > 0.5

        kopf = [q for v, q in zip(self.koerper.data.vertices, netz) if gruppe(v, "head", "neck", "jaw", "eye")]
        kopf += self._punkte("Haare")
        arme = [q for v, q in zip(self.koerper.data.vertices, netz) if gruppe(v, "upperarm", "lowerarm", "shoulder")]

        def abstand(pkte) -> float:
            best = 1.0
            for q in pkte:
                for b in baeume:
                    t = b.find_nearest(q, best)
                    if t[0] is not None:
                        best = min(best, t[3])
            return best

        werte["Kopf und Hals zum Gerät (mm)"] = abstand(kopf) * 1000
        werte["Arme zu Hebeln, Griffen und Rahmen (mm)"] = abstand(arme) * 1000
        # Finger am eigenen Griff: Abstand zur Achse des Griffs minus Halbmesser
        r = geraete.SCHULTERPRESSE["griff_d"] / 2
        halb = geraete.SCHULTERPRESSE["griff_l"] / 2
        finger = {}
        for s in "LR":
            G, kk, _ = self._griff_lage(s, self._phase_jetzt)
            pk = [q for v, q in zip(self.koerper.data.vertices, netz) if gruppe(v, "finger") and
                  any(namen[x.group].endswith("." + s) for x in v.groups if x.weight > 0.5)]
            d = []
            for q in pk:
                w = q - G
                t = max(-halb, min(halb, w.dot(kk)))
                d.append((w - kk * t).length - r)
            finger[s] = min(d) if d else float("nan")
        werte["Finger: geringster Abstand zum Griff (mm, negativ = eingedrückt)"] = min(finger.values()) * 1000
        return werte


# ---------------------------------------------------------------------- Familie „Senkrechtes Ziehen“: Klimmzug mit Unterstützung (D-508)


class KlimmzugUnterstuetzt(Uebung):
    """Klimmzüge mit Unterstützung an der Gegengewichtsmaschine, kniend (Familie „Senkrechtes Ziehen“, D-508), nach dem
    Ausführungstext der App (ExRx „Machine-assisted Pull-up (open-centered bar)“, kniende Fassung). Kniend auf dem
    Kniepolster der Maschine (`geraete.klimmzugmaschine`): Oberschenkel fast senkrecht (`OBERSCHENKEL` Grad vor der
    Senkrechten), Unterschenkel waagrecht nach hinten, Knie und Schienbeine `TIEF` im Polster, die Füße hängen hinter
    dem Polster frei. Hände weit im Obergriff an den offenen Klimmzuggriffen (`GRIFF_X` von der Mitte), die Handflächen
    nach vorn. Ausgang: Arme und Schultern gestreckt (Ellbogen `ELLBOGEN_UNTEN`, Schlüsselbeine `SCHULTER_HOCH` angehoben),
    Oberkörper `LEHNE_UNTEN` zurück. Hoch, bis der Hals auf Höhe der Hände ist (`HALS`); die Ellbogen ziehen nach unten
    und etwas nach hinten, die Unterarme bleiben etwa senkrecht, die Schulterblätter senken sich, der Oberkörper lehnt
    `LEHNE_OBEN` zurück. Das Polster folgt den Knien auf dem Bogen seiner Hebel (`HEBEL` lang, parallel, das Polster
    bleibt waagrecht); der Gewichtsblock senkt sich, wenn das Polster steigt. Zurück derselbe Weg."""

    name = "klimmzug_unterstuetzt"
    titel = "Klimmzüge mit Unterstützung"
    fuesse_frei = True  # die Füße hängen hinter dem Polster (`render.messen`: kein Bodenkontakt)
    # Schräg von hinten wie das Latziehen (D-410): Rücken, Schulterblätter und beide Arme; der Turm steht vorn
    kamera = {"richtung": 135.0, "neigung": 10.0, "fuellen": 0.02}
    vorschau_phase = 1.0
    GRIFF_X = 0.30  # Mitte der Griffe so weit von der Mitte (vor dem Maß der Schultern), m: weiter Griff
    GRIFF_Z = 2.20  # Mitte der Griffe über dem Boden, m (geschätzt)
    # Griffe so weit vor den Schultergelenken im Ausgang, m. Mit 3 cm (Prüfseite D-508) lag die Brust oben 10 cm vor der
    # Linie der Griffe, sie ging an der Stange vorbei; mit 14 cm geht sie zur Stange und bleibt 1 cm dahinter (D-509,
    # verglichen mit 10 cm und 22° statt 15° Rücklage)
    GRIFF_VOR = 0.14
    GRIFF_LAGE = 0.65
    # Griff schräg in der Hand (vom Zeigefinger zum Handballen) und Unterarm leicht nach außen: 13 Fassungen verglichen,
    # 10° bis 30° Schräge, 0°, 10° und 15° Unterarm, Griffe nach außen 15° und 25° ab- oder ansteigend (D-508). Mit 20°
    # wie beim Latziehen knickte das Handgelenk in der Mitte bis 22° zum kleinen Finger, abfallende Griffe machten es
    # schlimmer (bis 48°); mit 14° und 10° liegt es zwischen −10° und +12°
    SCHRAEG = 14.0
    GRIFF_NEIGUNG = 0.0  # Griffe nach außen abfallend, Grad; waagrecht
    STRECKUNG = 0.0
    UNTERARM = 10.0  # Unterarm-Neigung nach außen (Grad), die der Ellbogen anstrebt
    ELLBOGEN_UNTEN = 165.0  # „bis Arme und Schultern ganz gestreckt sind“
    LEHNE_UNTEN, LEHNE_OBEN = 5.0, 15.0  # Oberkörper zurückgelehnt, Grad
    SCHULTER_HOCH = 22.0  # Schlüsselbeine angehoben im Ausgang, Grad
    HALS = 0.5  # oben: Griffe auf Höhe der Mitte des Halses (0 = Halsansatz, 1 = Schädelbasis)
    OBERSCHENKEL = 8.0  # Knie so weit vor der Senkrechten unter der Hüfte, Grad
    UNTERSCHENKEL = 0.0  # Unterschenkel nach hinten abfallend, Grad
    TIEF = 0.004  # Knie und Schienbeine so tief im Polster, m
    HEBEL = 0.70  # Hebel vom Lager bis zum Polster, m
    POLSTER_VOR = 0.03  # Polster beginnt so weit vor den Kniescheiben, m
    # Griff von vorn und von hinten; von außen verdeckt der Griffhalter die Hand
    griff_ansichten = (("klimmzug_vorn", 20.0, 10.0), ("klimmzug_hinten", 200.0, 10.0))
    fuss_ansichten = ((90, 0.10), (180, 0.20))

    def rahmen_objekte(self) -> list:
        if self.geraet is None:
            return []
        return [*self.geraet["griffe"].values(), *self.geraet["polster"]]

    def polster_objekte(self) -> list:
        return self.geraet["polster"] if self.geraet else []

    def auflage(self) -> list:
        return auflage_objekte(self.koerper, "Shorts")

    def stange_achse(self):
        # linker Griff (Welt): für den Abstand der Finger zum Griff in `render.messen`
        mitte, k = self.griffe["L"]
        return mitte.copy(), k.normalized(), geraete.KLIMMZUGMASCHINE["griff_d"] / 2

    def bauen(self) -> None:
        super().bauen()
        rig = self.rig
        k = rig.kopf
        self.l1 = (k["lowerleg01.L"] - k["upperleg01.L"]).length
        self.l2 = (k["foot.L"] - k["lowerleg01.L"]).length
        self.H0 = (k["upperleg01.L"] + k["upperleg01.R"]) / 2
        namen = {g.index: g.name for g in self.koerper.vertex_groups}
        knie_z = k["lowerleg01.L"].z
        # Knie und Unterschenkel bis eine Handbreit über das Fußgelenk: Sie liegen auf dem Polster
        self.unterschenkel_i = [v.index for v in self.koerper.data.vertices
                                if sum(g.weight for g in v.groups if namen[g.group].startswith(("lowerleg", "upperleg"))) > 0.5
                                and k["foot.L"].z + 0.10 < v.co.z < knie_z + 0.05]
        self.griff = {s: rig.griff(s, self.GRIFF_LAGE, geraete.KLIMMZUGMASCHINE["griff_d"] / 2, schraeg=self.SCHRAEG)
                      for s in "LR"}
        self.griff_x = self.GRIFF_X * self.mass
        self.huefte = self.H0.copy()  # Hüfte in Ruhe: Bezug für Polster, Schultern und Hals
        kopf_gruppen = ("head", "jaw", "eye", "special", "tongue", "levator", "oris", "orbicularis", "temporalis")
        self.kopf_i = [v.index for v in self.koerper.data.vertices
                       if sum(g.weight for g in v.groups if namen[g.group].startswith(kopf_gruppen)) > 0.5]
        self.geraet = None
        self.geloest = False
        self.delle = 0.0

    # ------------------------------------------------------------------ Haltung des Körpers

    def _lehne(self, p: float) -> float:
        return self.LEHNE_UNTEN + (self.LEHNE_OBEN - self.LEHNE_UNTEN) * p

    def _torso(self, p: float, huefte: Vector) -> float:
        rig = self.rig
        rig.setze("root", starr(self.H0, huefte, achse_winkel(X, -self._lehne(p))))
        hoch = self.SCHULTER_HOCH * (1 - p)
        rig.dreh("clavicle.L", achse_winkel(-Y, hoch) @ achse_winkel(Z, 6 * p))
        rig.dreh("clavicle.R", achse_winkel(Y, hoch) @ achse_winkel(Z, -6 * p))
        return hoch

    def _beine(self) -> dict:
        """Kniend: Oberschenkel `OBERSCHENKEL` vor der Senkrechten, Unterschenkel waagrecht nach hinten, der Fuß fest am
        Unterschenkel wie im Stand (die Zehen zeigen nach unten); das Knie zeigt nach vorn unten."""
        from rig import abbild

        rig = self.rig
        k = rig.kopf
        a, b = math.radians(self.OBERSCHENKEL), math.radians(self.UNTERSCHENKEL)
        ober = Vector((0.0, -math.sin(a), -math.cos(a)))
        unter = Vector((0.0, math.cos(b), -math.sin(b)))
        aus = {}
        for s in "LR":
            H = rig.punkt("pelvis." + s, k["upperleg01." + s])
            A = H + ober * self.l1 + unter * self.l2
            bein = rig.bein(s, A, Vector((0.0, -1.0, -1.0)).normalized(), 0.0)
            A0, K0 = k["foot." + s], k["lowerleg01." + s]
            R_unter = abbild(A0 - K0, -Y, bein["knoechel"] - bein["knie"], bein["richtung"])
            rig.setze("foot." + s, starr(A0, bein["knoechel"], R_unter))
            aus[s] = bein
        return aus

    def _schultern(self) -> Vector:
        rig = self.rig
        return (rig.punkt("shoulder01.L", rig.kopf["upperarm01.L"]) + rig.punkt("shoulder01.R", rig.kopf["upperarm01.R"])) / 2

    def _regel(self, s: str):
        # Unterarm wie beim Latziehen so senkrecht wie möglich (optional leicht nach außen)
        w = math.radians(self.UNTERARM) * (1 if s == "L" else -1)
        richtung = Vector((math.sin(w), 0, math.cos(w)))
        return lambda S, W, l1, l2: ellbogen_zur_richtung(S, W, l1, l2, richtung)

    def _arme(self) -> dict:
        rig = self.rig
        arme = {}
        for s, sx in (("L", 1), ("R", -1)):
            mitte, kk = self.griffe[s]
            arme[s] = rig.arm(s, self.griff[s], rig.lokal(mitte), kk, Z, self.STRECKUNG, ellbogen=self._regel(s))
        return arme

    def _pose(self, p: float, huefte: Vector, arme: bool = True) -> dict:
        rig = self.rig
        rig.zuruecksetzen()
        self._torso(p, huefte)
        self._beine()
        aus = self._arme() if arme else {}
        rig.anwenden()
        return aus

    # ------------------------------------------------------------------ Polster, Griffe und Maschine

    def _polster_versatz(self) -> tuple[Vector, float]:
        """Mitte der Oberseite des Polsters gegenüber der Hüfte (Welt) und vordere Kante: unter der tiefsten Stelle von
        Knien und Schienbeinen, `TIEF` darin; das Polster beginnt `POLSTER_VOR` vor den Kniescheiben."""
        rig = self.rig
        self._pose(0.0, self.huefte, arme=False)
        netz = _netz(self.koerper)
        H = rig.welt(self.huefte)
        pts = [netz[i] for i in self.unterschenkel_i]
        vorn = min(q.y for q in pts)
        py = geraete.KLIMMZUGMASCHINE["polster"][1]
        auf = [q for q in pts if vorn - 0.01 < q.y < vorn + py and abs(q.x) < geraete.KLIMMZUGMASCHINE["polster"][0] / 2]
        oben = min(q.z for q in auf) + self.TIEF
        mitte = Vector((0.0, vorn - self.POLSTER_VOR + py / 2, oben))
        return mitte - H, py

    def _hals_hoehe(self, p: float) -> float:
        """Höhe der Mitte des Halses (Welt) gegenüber der Hüfte in der Haltung von Phase p (ohne Arme)."""
        rig = self.rig
        self._pose(p, self.huefte, arme=False)
        k = rig.kopf
        unten = rig.welt(rig.punkt("neck01", k["neck01"]))
        oben = rig.welt(rig.punkt("head", k["head"]))
        return unten.lerp(oben, self.HALS).z - rig.welt(self.huefte).z

    def _auf_bogen(self, z: float) -> Vector:
        """Mitte der Oberseite des Polsters (Welt) auf der Höhe z: Das obere Hebelende läuft auf dem Kreis um das Lager."""
        phi = math.asin(max(-1.0, min(1.0, (z - self.ende_unter - self.lager.z) / self.HEBEL)))
        return Vector((0.0, self.lager.y + self.HEBEL * math.cos(phi) + self.ende_hinter, z))

    def _bahn_polster(self, p: float) -> Vector:
        """Polster in Phase p: Höhe linear von unten nach oben, auf dem Bogen der Hebel."""
        return self._auf_bogen(self.polster_z[0] + (self.polster_z[1] - self.polster_z[0]) * p)

    def _huefte_fuer(self, polster: Vector) -> Vector:
        return self.rig.lokal(polster - self.versatz)

    def _loesen(self) -> None:
        """Bahn und Maschine, wenn Kleidung und Schuhe da sind (erstes `setzen`)."""
        self._loesen_maschine()
        self.polster0 = self._bahn_polster(0.0)
        self._geraet_bauen()

    def _loesen_maschine(self) -> None:
        """Bahn und Maschine des Klimmzugs (auch Grundlage des Dips, D-510). Griffe weit über den Schultern, oben
        so hoch über dem Boden, dass die Mitte des Halses dann auf ihrer Höhe ist; unten so tief, dass der Ellbogen
        `ELLBOGEN_UNTEN` hat. Das Polster läuft auf dem Bogen der Hebel, die Hüfte folgt ihm; das Lager liegt auf halber
        Höhe der Hebelenden `HEBEL` vor ihnen. Darum dreimal: Lager, untere Lage."""
        rig = self.rig
        m = geraete.KLIMMZUGMASCHINE
        # Stand ohne Haltung: Ohr über dem Schultergelenk, Bezug für „Schultern nicht zu den Ohren“ (D-509)
        rig.zuruecksetzen()
        rig.anwenden()
        S = rig.welt(rig.punkt("shoulder01.L", rig.kopf["upperarm01.L"]))
        self.ohr_stand = (self._ohr_hoehe(_netz(self.koerper)) - S.z) * 100
        self.versatz, py = self._polster_versatz()
        pd = m["polster"][2]
        self.ende_unter = pd + 0.03  # oberes Hebelende unter der Oberseite des Polsters
        self.ende_hinter = py / 2 - 0.06  # Mitte des Polsters hinter dem Hebelende
        self._pose(0.0, self.huefte, arme=False)
        S = rig.welt(self._schultern())
        H = rig.welt(self.huefte)
        gy = S.y - self.GRIFF_VOR
        w = math.radians(self.GRIFF_NEIGUNG)
        self.griffe = {s: (Vector((sx * self.griff_x, gy, self.GRIFF_Z)), Vector((sx * math.cos(w), 0.0, -math.sin(w))))
                       for s, sx in (("L", 1), ("R", -1))}
        oben = self.GRIFF_Z - self._hals_hoehe(1.0) + self.versatz.z  # Polster oben
        unten = oben - 0.45  # erste Schätzung
        self.lager = Vector((0.0, H.y + self.versatz.y - self.ende_hinter - self.HEBEL, 0.0))
        for _ in range(3):
            self.lager.z = (unten + oben) / 2 - self.ende_unter
            lo, hi = oben - 1.0, oben
            for _ in range(28):
                z = (lo + hi) / 2
                vorher = len(rig.meldungen)
                arme = self._pose(0.0, self._huefte_fuer(self._auf_bogen(z)))
                del rig.meldungen[vorher:]
                if arme["L"]["ellbogenwinkel"] < self.ELLBOGEN_UNTEN:
                    hi = z
                else:
                    lo = z
            unten = (lo + hi) / 2
        self.lager.z = (unten + oben) / 2 - self.ende_unter
        self.polster_z = (unten, oben)
        self.zug_z = self.polster_z  # Weg des Polsters beim Klimmzug: Bezug für den Gewichtsblock (D-510)
        rig.zuruecksetzen()

    def _geraet_bauen(self, dip: bool = False) -> None:
        """Maschine mit dem Polster in der Lage `polster0`; Diparme zur Person geschwenkt mit `dip` (D-510)."""
        rig = self.rig
        self.geraet = geraete.klimmzugmaschine(self.griffe, self.polster0, self.lager, self.lager.y + 0.06, dip=dip)
        self.polster_ruhe = {o.name: geraete.weiches_polster(o) for o in self.polster_objekte()}
        # Das neue Netz liegt einige Millimeter neben der Fläche des Kastens (wie beim Schulterdrücken, D-491): das
        # Polster so verschieben, dass Knie und Schienbeine im Ausgang `TIEF` darin liegen
        self._pose(0.0, self._huefte_fuer(self.polster0))
        punkte = self._auflage_punkte()
        for obj in self.polster_objekte():
            n_welt = (obj.matrix_world.to_3x3() @ Z).normalized()
            obj.matrix_world = Matrix.Translation(n_welt * (self.TIEF - SchulterdrueckenMaschine._tiefe(obj, punkte))) @ obj.matrix_world
        rig.zuruecksetzen()

    def _auflage_punkte(self) -> list[Vector]:
        dg = bpy.context.evaluated_depsgraph_get()
        punkte = []
        for obj in self.auflage():
            oe = obj.evaluated_get(dg)
            me = oe.to_mesh()
            punkte += [oe.matrix_world @ v.co for v in me.vertices]
            oe.to_mesh_clear()
        return punkte

    def _maschine(self, p: float) -> Vector:
        """Polster, Hebel und Gewichtsblock in Phase p; gibt die Mitte der Oberseite des Polsters zurück (Welt)."""
        g = self.geraet
        polster = self._bahn_polster(p)
        g["traeger"].matrix_world = Matrix.Translation(polster - self.polster0) @ g["traeger0"]
        ende0 = Vector((0.0, self.polster0.y - self.ende_hinter, self.polster0.z - self.ende_unter))
        ende = Vector((0.0, polster.y - self.ende_hinter, polster.z - self.ende_unter))
        drehung = (ende0 - self.lager).angle(ende - self.lager)
        if ende.z < ende0.z:
            drehung = -drehung
        D = Matrix.Rotation(drehung, 4, X)
        for name, M0 in g["hebel0"].items():
            P = M0.to_translation()
            g["hebel"][name].matrix_world = Matrix.Translation(P) @ D @ Matrix.Translation(-P) @ M0
        # Der Block hebt sich, wenn das Polster sinkt: über den Weg des Klimmzugs um `block_hub`, beim Dip ebenso (D-510)
        hub = geraete.KLIMMZUGMASCHINE["block_hub"] * (self.zug_z[1] - polster.z) / (self.zug_z[1] - self.zug_z[0])
        g["block"].matrix_world = Matrix.Translation(Vector((0, 0, hub))) @ g["block0"]
        return polster

    def setzen(self, p: float) -> None:
        if not self.geloest:
            self.geloest = True
            self._loesen()
        super().setzen(p)
        self.delle = geraete.eindruecken(self.polster_objekte(), self.polster_ruhe, self.auflage())

    def haltung(self, p: float) -> None:
        rig = self.rig
        polster = self._maschine(p)
        huefte = self._huefte_fuer(polster)
        hoch = self._torso(p, huefte)
        beine = self._beine()
        arme = self._arme()
        A, L = arme["L"], beine["L"]
        ober = A["ellbogen"] - A["schulter"]
        unter = A["handgelenk"] - A["ellbogen"]
        k = rig.kopf
        hals = rig.welt(rig.punkt("neck01", k["neck01"])).lerp(rig.welt(rig.punkt("head", k["head"])), self.HALS)
        S = rig.welt(A["schulter"])
        G = self.griffe["L"][0]
        self.werte = {
            "Ellbogenwinkel": A["ellbogenwinkel"],
            "Unterarm zur Senkrechten": math.degrees(unter.angle(Z)),
            "Oberarm zur Waagrechten (Grad, + darüber, ganze Bewegung)": math.degrees(math.asin(max(-1.0, min(1.0, ober.normalized().z)))),
            "Handgelenk gesamt (Grad)": A["handgelenk_gesamt"],
            "Handgelenk gestreckt (Grad)": A["handgelenk_streckung"],
            "Handgelenk seitlich (Grad, + zum Daumen)": A["handgelenk_seitlich"],
            "Lehne zurück": self._lehne(p),
            "Schlüsselbein gehoben (Grad)": hoch,
            "Griffe auseinander (cm)": (self.griffe["L"][0].x - self.griffe["R"][0].x) * 100,
            "Griffe über dem Schultergelenk (cm)": (G.z - S.z) * 100,
            "Griffe vor dem Schultergelenk (cm)": (S.y - G.y) * 100,
            "Griffe über der Mitte des Halses (cm)": (G.z - hals.z) * 100,
            "Polster über dem Boden (cm)": polster.z * 100,
            "Polster gegenüber dem Ausgang gehoben (cm)": (polster.z - self.polster0.z) * 100,
            # Schwingen (D-509): Hüfte waagrecht gegenüber dem Ausgang, + zum Turm
            "Hüfte waagrecht gegenüber dem Ausgang (cm, + zum Turm)": (self._bahn_polster(0.0).y - polster.y) * 100,
            "Kniewinkel (Grad)": self.kniewinkel(L),
        }

    def nah_punkte(self) -> list[Vector]:
        """Punkte für die Nahaufnahme des Griffs: linke Hand und ihr Griff (Welt)."""
        rig = self.rig
        hand = rig.welt(rig.punkt("wrist.L", rig.kopf["metacarpal2.L"]))
        mitte, kk = self.griffe["L"]
        halb = geraete.KLIMMZUGMASCHINE["griff_l"] / 2
        return [q for q in _netz(self.koerper) if (q - hand).length < 0.10] + [mitte - kk * halb, mitte + kk * halb]

    def zusatzwerte(self) -> dict:
        """Knie im Polster (Delle, nichts ragt durch), Abstand von Kopf und Armen zur Maschine, Finger am Griff (mm)."""
        werte, netz, gruppe, abstand = self._abstaende(("Griff.",))
        kopf = [q for v, q in zip(self.koerper.data.vertices, netz) if gruppe(v, "head", "neck", "jaw", "eye")]
        kopf += self._punkte("Haare")
        arme = [q for v, q in zip(self.koerper.data.vertices, netz) if gruppe(v, "upperarm", "lowerarm", "shoulder")]
        koerper = [q for v, q in zip(self.koerper.data.vertices, netz) if not gruppe(v, "finger", "wrist", "metacarpal")]
        koerper += self._punkte("Shirt", "Saumband", "Shorts", "Socken", "Schuhe", "Sohle")
        # Schultern unten, Brust zur Stange (D-509): Ohr über dem Schultergelenk (im Stand `ohr_stand`), vorderste Stelle
        # der Brust 5 bis 25 cm unter dem Halsansatz und die Halsgrube gegenüber der Linie der Griffe
        rig, k = self.rig, self.rig.kopf
        S = rig.welt(rig.punkt("shoulder01.L", k["upperarm01.L"]))
        werte["Ohr über dem Schultergelenk (cm)"] = (self._ohr_hoehe(netz) - S.z) * 100
        werte["Ohr über dem Schultergelenk im Stand (cm)"] = self.ohr_stand
        G = self.griffe["L"][0]
        hals = rig.welt(rig.punkt("neck01", k["neck01"]))
        rumpf = [q for v, q in zip(self.koerper.data.vertices, netz)
                 if gruppe(v, "spine", "chest", "breast", "pectoral", "clavicle") and abs(q.x) < 0.06]
        vorn = min((q for q in rumpf if hals.z - 0.25 < q.z < hals.z - 0.05), key=lambda q: q.y)
        werte["Brust hinter der Linie der Griffe (cm, unter 0 = davor)"] = (vorn.y - G.y) * 100
        grube = min((q for q in rumpf if abs(q.z - hals.z) < 0.02), key=lambda q: q.y)
        werte["Halsgrube unter den Griffen (cm)"] = (G.z - grube.z) * 100
        # Schwingen (D-509): Mitte aller Punkte des Körpers waagrecht gegenüber der Linie der Griffe
        mitte = sum(netz, Vector()) / len(netz)
        werte["Körpermitte hinter der Linie der Griffe (cm)"] = (mitte.y - G.y) * 100
        werte["Kopf und Hals zur Maschine (mm)"] = abstand(kopf) * 1000
        werte["Arme zur Maschine (mm)"] = abstand(arme) * 1000
        werte["Körper, Kleidung und Schuhe zur Maschine (mm, ohne Polster und Griffe)"] = abstand(koerper) * 1000
        return werte

    def _abstaende(self, ausser: tuple[str, ...]):
        """Polster (tiefste Delle, nichts durch die Oberfläche), Netz des Körpers, Prüfung der Gruppen und Abstand von
        Punkten zur Maschine ohne Polster und ohne die Teile, deren Name mit `ausser` beginnt (Griffe in der Hand)."""
        from mathutils.bvhtree import BVHTree

        dg = bpy.context.evaluated_depsgraph_get()
        g = self.geraet
        werte = {"Polster: tiefste Delle (mm)": self.delle * 1000,
                 "Polster: Haut oder Kleidung durch die Oberfläche (mm)": geraete.durch_polster(self.polster_objekte(), self.auflage()) * 1000}
        teile = [o for o in g["wurzel"].children_recursive if o.type == "MESH" and o not in g["polster"]
                 and not o.name.startswith(ausser)]
        # Alle Teile in einem Baum: Die Suche läuft einmal je Punkt statt einmal je Teil
        ecken, flaechen = [], []
        for obj in teile:
            oe = obj.evaluated_get(dg)
            me = oe.to_mesh()
            n = len(ecken)
            ecken += [oe.matrix_world @ v.co for v in me.vertices]
            flaechen += [tuple(n + i for i in f.vertices) for f in me.polygons]
            oe.to_mesh_clear()
        baum = BVHTree.FromPolygons(ecken, flaechen)
        namen = {gr.index: gr.name for gr in self.koerper.vertex_groups}
        netz = _netz(self.koerper)

        def gruppe(v, *anfang) -> bool:
            return sum(x.weight for x in v.groups if namen[x.group].startswith(anfang)) > 0.5

        def abstand(pkte) -> float:
            best = 1.0
            for q in pkte:
                t = baum.find_nearest(q, best)
                if t[0] is not None:
                    best = min(best, t[3])
            return best

        return werte, netz, gruppe, abstand

    def _ohr_hoehe(self, netz: list[Vector]) -> float:
        """Höhe (Welt) der Mitte des linken Ohrs: Mitte der seitlichsten Punkte des Kopfs zwischen 7 cm unter und 2 cm über
        den Augen (wie beim Schulterdrücken, D-492)."""
        rig, k = self.rig, self.rig.kopf
        auge = rig.welt((rig.punkt("eye.L", k["eye.L"]) + rig.punkt("eye.R", k["eye.R"])) / 2)
        ohr = [netz[i].z for i in self.kopf_i if netz[i].x > 0.06 and auge.z - 0.07 < netz[i].z < auge.z + 0.02]
        return sum(ohr) / len(ohr)

    def _punkte(self, *namen: str) -> list[Vector]:
        import schuhe

        aus = []
        for n in namen:
            if n in bpy.data.objects:
                aus += schuhe._verformt(bpy.data.objects[n])[0]
        return aus


class DipUnterstuetzt(KlimmzugUnterstuetzt):
    """Dips mit Unterstützung an derselben Gegengewichtsmaschine, kniend (Familie „Waagrechtes Drücken“, D-510), nach dem
    Ausführungstext der App (ExRx „Machine-assisted Triceps Dip“, kniende Fassung). Maschine, Lager, Hebel und Polster
    wie beim Pull-Up: Erst löst die Übung dessen Bahn (`KlimmzugUnterstuetzt._loesen_maschine`, Modus „klimmzug“), dann
    ihre eigene auf demselben Bogen; die Diparme sind zur Person geschwenkt (`geraete.dipgriffe`). Kniend wie beim
    Pull-Up. Hände im neutralen Griff auf den Dipgriffen, die Daumen nach vorn, senkrecht unter den Schultergelenken im
    Ausgang. Ausgang oben: Arme gestreckt (Ellbogen `ELLBOGEN_OBEN`), Schultern gesenkt (`SCHULTER_OBEN`), Oberkörper
    `VOR_OBEN` vor. Ab, bis der Oberarm waagrecht ist (`OBERARM_UNTEN`; Text: „bis du eine leichte Dehnung in den
    Schultern spürst“); die Ellbogen gehen nach hinten, die Unterarme bleiben fast senkrecht (`UNTERARM_VOR`), der
    Oberkörper neigt sich `VOR_UNTEN` vor. Das Polster folgt den Knien auf dem Bogen seiner Hebel, der Gewichtsblock
    hebt sich, wenn das Polster sinkt. Zurück derselbe Weg."""

    name = "dip_unterstuetzt"
    titel = "Dips mit Unterstützung"
    # Schräg von hinten, mehr von der Seite als beim Pull-Up: Tiefe, Ellbogen und Vorneigung, beide Arme (verglichen mit
    # 135°, 95° und 160°, D-510)
    kamera = {"richtung": 115.0, "neigung": 10.0, "fuellen": 0.02}
    vorschau_phase = 1.0
    ELLBOGEN_OBEN = 172.0  # „bis die Arme gestreckt sind“
    # unten: Oberarm so weit über der Waagrechten (unter 0: Ellbogen unter der Schulter), Grad. „Etwa waagrecht“ (Familie);
    # mit 0° hatte der Ellbogen 77,6° (102° gebeugt), die Familie nennt 80 bis 100° Beugung
    OBERARM_UNTEN = -3.0
    # Oberkörper vorgeneigt, Grad (eigene Namen: LEHNE_… gehören dem Pull-Up, dessen Bahn die Maschine bestimmt)
    VOR_OBEN, VOR_UNTEN = 5.0, 24.0
    SCHULTER_OBEN, SCHULTER_UNTEN = -6.0, -3.0  # Schlüsselbeine gehoben (unter 0 gesenkt), Grad
    UNTERARM_VOR = 4.0  # Unterarm (Ellbogen → Hand) so weit nach vorn: Der Ellbogen bleibt hinter der Hand
    DIP_LAGE = 0.6  # Griff in der Hand (0 Handgelenk, 1 Fingeransatz)
    DIP_SCHRAEG = 10.0
    griff_ansichten = (("dip_aussen", 90.0, 15.0), ("dip_hinten", 200.0, 20.0))
    fuss_ansichten = ((90, 0.10), (180, 0.20))

    def bauen(self) -> None:
        super().bauen()
        self.modus = "klimmzug"
        self.dipgriff = {s: self.rig.griff(s, self.DIP_LAGE, geraete.KLIMMZUGMASCHINE["dipgriff_d"] / 2,
                                           schraeg=self.DIP_SCHRAEG) for s in "LR"}

    def rahmen_objekte(self) -> list:
        if self.geraet is None:
            return []
        return [*self.geraet["dipgriffe"].values(), *self.geraet["polster"]]

    def stange_achse(self):
        mitte, k = self.dipgriffe["L"]
        return mitte.copy(), k.normalized(), geraete.KLIMMZUGMASCHINE["dipgriff_d"] / 2

    def nah_punkte(self) -> list[Vector]:
        rig = self.rig
        hand = rig.welt(rig.punkt("wrist.L", rig.kopf["metacarpal2.L"]))
        mitte, kk = self.dipgriffe["L"]
        return [q for q in _netz(self.koerper) if (q - hand).length < 0.10] + [mitte - kk * 0.08, mitte + kk * 0.08]

    # ------------------------------------------------------------------ Haltung

    def _vor(self, p: float) -> float:
        return self.VOR_OBEN + (self.VOR_UNTEN - self.VOR_OBEN) * p

    def _torso(self, p: float, huefte: Vector) -> float:
        if self.modus == "klimmzug":
            return super()._torso(p, huefte)
        rig = self.rig
        rig.setze("root", starr(self.H0, huefte, achse_winkel(X, self._vor(p))))
        hoch = self.SCHULTER_OBEN + (self.SCHULTER_UNTEN - self.SCHULTER_OBEN) * p
        rig.dreh("clavicle.L", achse_winkel(-Y, hoch))
        rig.dreh("clavicle.R", achse_winkel(Y, hoch))
        return hoch

    def _regel(self, s: str):
        if self.modus == "klimmzug":
            return super()._regel(s)
        w = math.radians(self.UNTERARM_VOR)
        richtung = Vector((0.0, -math.sin(w), -math.cos(w)))
        return lambda S, W, l1, l2: ellbogen_zur_richtung(S, W, l1, l2, richtung)

    def _arme(self) -> dict:
        if self.modus == "klimmzug":
            return super()._arme()
        rig = self.rig
        # Griffachse vom Zeigefinger zum kleinen Finger: nach hinten (+y), die Daumen zeigen nach vorn
        return {s: rig.arm(s, self.dipgriff[s], rig.lokal(self.dipgriffe[s][0]), self.dipgriffe[s][1], Y, 0.0,
                           ellbogen=self._regel(s)) for s in "LR"}

    # ------------------------------------------------------------------ Bahn

    def _ohr_rumpf(self, netz: list[Vector]) -> float:
        """Mitte des linken Ohrs über dem linken Schultergelenk längs des Rumpfs (Becken → Halsansatz), cm. Neigt sich
        der Oberkörper vor, misst die Senkrechte zu wenig; die Punkte des Ohrs stehen aus dem Stand fest (`ohr_i`)."""
        rig, k = self.rig, self.rig.kopf
        ohr = sum((netz[i] for i in self.ohr_i), Vector()) / len(self.ohr_i)
        S = rig.welt(rig.punkt("shoulder01.L", k["upperarm01.L"]))
        hals = rig.welt(rig.punkt("neck01", k["neck01"]))
        becken = rig.welt((rig.punkt("pelvis.L", k["upperleg01.L"]) + rig.punkt("pelvis.R", k["upperleg01.R"])) / 2)
        return (ohr - S).dot((hals - becken).normalized()) * 100

    def _oberarm(self, arm: dict) -> float:
        return math.degrees(math.asin(max(-1.0, min(1.0, (arm["ellbogen"] - arm["schulter"]).normalized().z))))

    def _loesen(self) -> None:
        """Erst die Maschine wie beim Pull-Up (dieselben Griffe, Lager, Hebel und Polster), dann die Bahn des Dips auf
        demselben Bogen: oben so hoch, dass der Ellbogen `ELLBOGEN_OBEN` hat, unten so tief, dass der Oberarm waagrecht
        ist. Die Hände greifen senkrecht unter den Schultergelenken im Ausgang; darum dreimal."""
        rig = self.rig
        m = geraete.KLIMMZUGMASCHINE
        # Ohr im Stand: Punkte der Mitte des linken Ohrs (wie `_ohr_hoehe`) und Bezug für „Schultern unten“
        rig.zuruecksetzen()
        rig.anwenden()
        netz = _netz(self.koerper)
        k = rig.kopf
        auge = rig.welt((rig.punkt("eye.L", k["eye.L"]) + rig.punkt("eye.R", k["eye.R"])) / 2)
        self.ohr_i = [i for i in self.kopf_i if netz[i].x > 0.06 and auge.z - 0.07 < netz[i].z < auge.z + 0.02]
        self.ohr_stand_rumpf = self._ohr_rumpf(netz)
        self.modus = "klimmzug"
        self._loesen_maschine()
        self.modus = "dip"
        lage = geraete.dipgriffe(self.lager.y + 0.06, True)
        oben = sum(self.zug_z) / 2
        self.griff_t = {}
        for _ in range(3):
            self._pose(0.0, self._huefte_fuer(self._auf_bogen(oben)), arme=False)
            self.dipgriffe = {}
            for s in "LR":
                S = rig.welt(rig.punkt("shoulder01." + s, rig.kopf["upperarm01." + s]))
                g = lage[s]
                t = (S.y - g["anfang"].y) / g["richtung"].y
                self.griff_t[s] = t
                t = max(0.06, min(m["dipgriff_l"] - 0.06, t))
                self.dipgriffe[s] = (g["anfang"] + g["richtung"] * t, g["richtung"].copy())
            lo, hi = oben - 0.40, oben + 0.40
            for _ in range(28):
                z = (lo + hi) / 2
                vorher = len(rig.meldungen)
                arme = self._pose(0.0, self._huefte_fuer(self._auf_bogen(z)))
                del rig.meldungen[vorher:]
                if arme["L"]["ellbogenwinkel"] < self.ELLBOGEN_OBEN:
                    lo = z
                else:
                    hi = z
            oben = (lo + hi) / 2
        lo, hi = oben - 0.60, oben
        for _ in range(28):
            z = (lo + hi) / 2
            vorher = len(rig.meldungen)
            arme = self._pose(1.0, self._huefte_fuer(self._auf_bogen(z)))
            del rig.meldungen[vorher:]
            if self._oberarm(arme["L"]) < self.OBERARM_UNTEN:
                hi = z
            else:
                lo = z
        unten = (lo + hi) / 2
        self.polster_z = (oben, unten)
        rig.zuruecksetzen()
        self.polster0 = self._bahn_polster(0.0)
        self._geraet_bauen(dip=True)

    # ------------------------------------------------------------------ Messwerte

    def haltung(self, p: float) -> None:
        rig = self.rig
        polster = self._maschine(p)
        huefte = self._huefte_fuer(polster)
        hoch = self._torso(p, huefte)
        beine = self._beine()
        arme = self._arme()
        A, B, L = arme["L"], arme["R"], beine["L"]
        ober = A["ellbogen"] - A["schulter"]
        unter = A["handgelenk"] - A["ellbogen"]
        S, E, W = rig.welt(A["schulter"]), rig.welt(A["ellbogen"]), rig.welt(A["handgelenk"])
        H = rig.welt(huefte)
        rumpf = (S - H).normalized()
        G = self.dipgriffe["L"][0]
        self.werte = {
            "Ellbogenwinkel": A["ellbogenwinkel"],
            "Unterarm zur Senkrechten": math.degrees(unter.angle(-Z)),
            "Oberarm zur Waagrechten (Grad, + darüber, ganze Bewegung)": self._oberarm(A),
            # Oberarm hinter dem Rumpf: Winkel zwischen Oberarm und Rumpf (Hüfte → Schulter umgekehrt), seitlich gesehen
            "Oberarm zum Rumpf (Grad)": math.degrees(Vector((0.0, ober.y, ober.z)).angle(Vector((0.0, -rumpf.y, -rumpf.z)))),
            "Handgelenk gesamt (Grad)": A["handgelenk_gesamt"],
            "Handgelenk gestreckt (Grad)": A["handgelenk_streckung"],
            "Handgelenk seitlich (Grad, + zum Daumen)": A["handgelenk_seitlich"],
            "Lehne vor": self._vor(p),
            "Schlüsselbein gehoben (Grad)": hoch,
            "Ellbogen hinter dem Handgelenk (cm)": (E.y - W.y) * 100,
            "Ellbogen neben dem Handgelenk (cm, + außen)": (E.x - W.x) * 100,
            "Schultergelenk vor der Mitte des Griffs (cm)": (G.y - S.y) * 100,
            "Schultergelenk über der Mitte des Griffs (cm)": (S.z - G.z) * 100,
            "Hände auseinander (cm)": (self.dipgriffe["L"][0].x - self.dipgriffe["R"][0].x) * 100,
            "Ellbogen L/R gleich (Grad)": abs(A["ellbogenwinkel"] - B["ellbogenwinkel"]),
            "Polster über dem Boden (cm)": polster.z * 100,
            "Polster gegenüber dem Ausgang gesenkt (cm)": (self.polster0.z - polster.z) * 100,
            "Hüfte waagrecht gegenüber dem Ausgang (cm, + zum Turm)": (self.polster0.y - polster.y) * 100,
            "Kniewinkel (Grad)": self.kniewinkel(L),
        }

    def zusatzwerte(self) -> dict:
        """Knie im Polster, Abstand von Kopf, Armen und Rumpf zur Maschine (die Diparme laufen neben dem Rumpf),
        Schultern unten (Ohr über dem Schultergelenk), Mitte des Körpers."""
        werte, netz, gruppe, abstand = self._abstaende(("Dipgriff.", "Dipkappe"))
        verts = self.koerper.data.vertices
        kopf = [q for v, q in zip(verts, netz) if gruppe(v, "head", "neck", "jaw", "eye")] + self._punkte("Haare")
        arme = [q for v, q in zip(verts, netz) if gruppe(v, "upperarm", "lowerarm", "shoulder")]
        rumpf = [q for v, q in zip(verts, netz) if not gruppe(v, "finger", "wrist", "metacarpal", "upperarm", "lowerarm")]
        rumpf += self._punkte("Shirt", "Saumband", "Shorts", "Socken", "Schuhe", "Sohle")
        werte["Ohr über dem Schultergelenk längs des Rumpfs (cm)"] = self._ohr_rumpf(netz)
        werte["Ohr über dem Schultergelenk längs des Rumpfs im Stand (cm)"] = self.ohr_stand_rumpf
        mitte = sum(netz, Vector()) / len(netz)
        werte["Körpermitte hinter der Mitte der Griffe (cm)"] = (mitte.y - self.dipgriffe["L"][0].y) * 100
        werte["Kopf und Hals zur Maschine (mm)"] = abstand(kopf) * 1000
        werte["Arme zur Maschine (mm, ohne die Dipgriffe)"] = abstand(arme) * 1000
        werte["Rumpf, Beine, Kleidung und Schuhe zur Maschine (mm, ohne Polster und Dipgriffe)"] = abstand(rumpf) * 1000
        return werte


class Hackenschmidt(Uebung):
    """Hackenschmidt-Kniebeuge an der Maschine (Familie „Kniebeuge“, D-511), nach dem Ausführungstext der App (ExRx „Sled
    Hack Squat“). Der Rücken liegt am Polster des Schlittens (`geraete.hackenschmidt`), das unter `SCHIENE` Grad längs
    der Schienen läuft; die Schulterpolster liegen auf den Schultern, die Hände an den Griffen daneben. Der Rumpf liegt in
    der ganzen Schleife gleich am Polster (Lende `LENDE` flacher als im Stand, Kopf an der Lehne) und fährt mit dem
    Schlitten: Nur Hüfte, Knie und Sprunggelenke beugen sich. Füße etwas weiter als hüftbreit, Zehen `ZEHEN` nach außen,
    flach auf der festen Fußplatte (`PLATTE` Grad, vorn höher), etwas über ihrem unteren Rand. Ausgang oben mit fast
    gestreckten Knien (`KNIE_OBEN`, nicht durchgedrückt), ab bis `KNIE_UNTEN`; die Knie zeigen über die Zehen, die
    Fersen bleiben auf der Platte, Rücken und Becken am Polster. Aufwärts derselbe Weg."""

    name = "hackenschmidt"
    titel = "Hackenschmidt-Kniebeuge"
    # Schräg von vorn links: Knie, Füße auf der Platte und der Weg des Schlittens (verglichen mit 45°, 75° und 90°)
    kamera = {"richtung": 60.0, "neigung": 10.0, "fuellen": 0.02}
    vorschau_phase = 1.0
    griff_ansichten = (("hack_vorn", 30.0, 25.0), ("hack_aussen", 100.0, 10.0))
    fuss_ansichten = ((90, 0.10), (0, 0.12))
    fuss_gedreht = True  # Füße auf der geneigten Platte: die Prüfung auf Löcher in der Socke dreht mit (`render.messen`)
    SCHIENE = 45.0  # Schienen und Rückenpolster, Grad über der Waagrechten
    PLATTE = 15.0  # Fußplatte vorn höher, Grad
    KNIE_OBEN = 168.0
    KNIE_UNTEN = 75.0  # unten: Oberschenkel etwa parallel zur Platte (Familie: Knie 100 bis 120° gebeugt)
    # Linie Hüfte → Fußgelenk im Ausgang so weit vor der Senkrechten, Grad: fast in der Richtung der Schiene, damit die
    # Hüfte geradewegs zu den Füßen fährt (mit 16° standen die Knie unten 23 cm vor den Zehen, das Sprunggelenk 75°
    # gebeugt; gerechnet: mit 44° und der Platte 15° unten rund 25° gebeugt, oben rund 23° gestreckt)
    BEIN = 44.0
    FUESSE = 0.13  # halber Abstand der Fußgelenke vor dem Maß der Schultern, m
    ZEHEN = 15.0
    KNIE_AUSSEN = 0.05
    # Rumpf am Polster wie bei der Beinpresse (D-465): Lende flacher, Rumpf unterhalb des oberen Brustkorbs zur Lehne
    # gedreht, oberer Brustkorb gestreckt, Kopf zurück an die Lehne (Blick wie zuvor), Grad. Die Lende stärker flach
    # als dort (35 statt 25°): Mit gestreckter Hüfte lag das Gesäß sonst 33 mm im Polster, jetzt 21 mm wie das Kreuzbein
    # an der Beinpresse (verglichen mit 25° bis 40° und KIPP 0° bis 12°)
    LENDE, KIPP, BRUST, KOPF = 35.0, 9.0, 10.0, 14.0
    RUECKEN = 0.003  # Lende so tief im Polster, an der Stelle mit dem geringsten Wert, m
    SCHULTER_TIEF = 0.004  # Schulterpolster so tief auf den Schultern, m
    PLATTE_Z = 0.30  # Mitte der Fußplatte über dem Boden, m (geschätzt)
    GRIFF_R = 0.016
    STRECKUNG = 0.0
    # Griffe neben den Schulterpolstern: so weit außen, vor und unter dem Schultergelenk (m), Achse längs der Normalen
    # des Polsters (Vorzeichen: Zeigefinger → kleiner Finger)
    # (verglichen: 10 cm unter dem Schultergelenk Ellbogen 31°, 20 cm 49°, 24 cm 56°; Achse vom Polster weg: Handgelenk
    # bis 72°, zum Polster hin unter 10°)
    GRIFF_SEITE, GRIFF_VOR, GRIFF_TIEF, GRIFF_ACHSE = 0.16, 0.04, 0.20, -1.0
    # Schulterpolster so weit von der Mitte (vor dem Maß der Schultern, m): innen frei von Kopf und Haaren (bis 9 cm)
    SCHULTERPOLSTER_X = 0.125

    def rahmen_objekte(self) -> list:
        return [*self.geraet["griffe"].values(), *self.geraet["polster"]] if hasattr(self, "geraet") else []

    def polster_objekte(self) -> list:
        return self.geraet["polster"]

    def auflage(self) -> list:
        return auflage_objekte(self.koerper, "Shirt", "Shorts", "Haare")

    def stange_achse(self):
        # linker Griff (Welt) in der aktuellen Stellung des Schlittens: für den Abstand der Finger in
        # `render.messen`
        mitte, k = self.griff_lage["L"]
        return self.rig.welt(mitte + self.u * self.weg_jetzt), k.normalized(), self.GRIFF_R

    # ------------------------------------------------------------------ Aufbau

    def bauen(self) -> None:
        super().bauen()
        rig = self.rig
        k = rig.kopf
        a = math.radians(self.SCHIENE)
        self.v = Vector((0, math.cos(a), math.sin(a)))  # die Schiene hinauf
        self.u = -self.v  # Weg des Schlittens nach unten
        self.n = Vector((0, -math.sin(a), math.cos(a)))  # aus dem Polster zur Person
        self.R_liegen = achse_winkel(X, self.SCHIENE - 90.0)  # Stand → am Polster: um 90° − Schiene zurückgelehnt
        self.R_fuss = achse_winkel(X, -self.PLATTE)  # Boden → Fußplatte: vorn höher
        self.pn = self.R_fuss @ Z  # Normale der Platte
        self.l1 = (k["lowerleg01.L"] - k["upperleg01.L"]).length
        self.l2 = (k["foot.L"] - k["lowerleg01.L"]).length
        huefte = k["upperleg01.L"].z
        ruhe = [v.co.copy() for v in self.koerper.data.vertices]
        self.lenden_baender = [[i for i, r in enumerate(ruhe) if abs(r.x) < 0.10 and r.y > 0.0
                                and huefte + z / 100 <= r.z < huefte + (z + 2) / 100] for z in range(12, 26, 2)]
        self.kreuz_i = [i for i, r in enumerate(ruhe) if abs(r.x) < 0.10 and r.y > 0.0 and huefte <= r.z < huefte + 0.12]
        self.brust_i = [i for i, r in enumerate(ruhe) if abs(r.x) < 0.14 and r.y > 0.0 and huefte + 0.26 <= r.z < huefte + 0.50]
        self.gesaess_i = [i for i, r in enumerate(ruhe) if abs(r.x) < 0.17 and huefte - 0.12 < r.z < huefte + 0.06 and r.y > 0.02]
        schulter_z = k["upperarm01.L"].z
        namen = {g.index: g.name for g in self.koerper.vertex_groups}
        # Oberseite der Schultern (Trapez bis Schulterhöhe), je Seite: dort liegen die Schulterpolster
        px = self.SCHULTERPOLSTER_X * self.mass
        self.schulter_i = {s: [v.index for v in self.koerper.data.vertices
                               if abs(sx * v.co.x - px) < 0.05 and v.co.z > schulter_z - 0.02
                               and not any(namen[g.group].startswith(("head", "neck", "jaw")) and g.weight > 0.3 for g in v.groups)]
                           for s, sx in (("L", 1), ("R", -1))}
        ferse, spitze = _fuss(self.koerper, k)
        self.zehen_laenge = k["foot.L"].y - spitze  # Fußgelenk bis Zehenspitze, längs des Fußes
        self.geraet = None
        self.geloest = False
        self.delle = 0.0
        self.weg_jetzt = 0.0

    def _torso(self, weg: float) -> None:
        """Rumpf am Polster, um `weg` die Schiene hinab, in der Haltung der Beinpresse (D-465): Lende `LENDE` flacher als
        im Stand, Rumpf unterhalb des oberen Brustkorbs `KIPP` zur Lehne gedreht, oberer Brustkorb `BRUST` gestreckt,
        Kopf `KOPF` zurück an die Lehne (Blick wie zuvor)."""
        rig = self.rig
        rig.setze("root", starr(Vector(), self.verschiebung + self.u * weg,
                                self.R_liegen @ achse_winkel(X, self.KIPP - self.LENDE)))
        for n_ in ("spine05", "spine04", "spine03"):
            rig.dreh(n_, achse_winkel(X, self.LENDE / 3))
        if self.BRUST:
            rig.dreh("spine01", achse_winkel(X, -self.BRUST))
        if self.KOPF:
            rig.dreh("neck01", achse_winkel(X, -self.KOPF))
            rig.dreh("head", achse_winkel(X, self.KOPF))

    def _zehenrichtung(self, s: str) -> Vector:
        w = math.radians(self.ZEHEN) * (1 if s == "L" else -1)
        return self.R_fuss @ Vector((math.sin(w), -math.cos(w), 0.0))

    def _knierichtung(self, s: str) -> Vector:
        return self._zehenrichtung(s) + X * (self.KNIE_AUSSEN * (1 if s == "L" else -1))

    def _beine(self) -> dict:
        return {s: self.rig.bein(s, self.knoechel[s], self._knierichtung(s), self.ZEHEN, fuss_ebene=self.R_fuss) for s in "LR"}

    def _huefte(self, s: str) -> Vector:
        return self.rig.punkt("pelvis." + s, self.rig.kopf["upperleg01." + s])

    def _weg_fuer(self, knie: float) -> float:
        """Weg des Schlittens von oben, bei dem das linke Knie den Innenwinkel `knie` hat (Hüfte auf der Linie längs der
        Schiene, Fußgelenk fest)."""
        D = math.sqrt(self.l1 ** 2 + self.l2 ** 2 - 2 * self.l1 * self.l2 * math.cos(math.radians(knie)))
        r = self.huefte0["L"] - self.knoechel["L"]
        b = self.u.dot(r)
        c = r.length_squared - D * D
        if b * b - c < 0:
            return -b
        return -b - math.sqrt(b * b - c)

    def _lage(self) -> None:
        """Rücken an das Polster (wie bei der Beinpresse, D-465): Rumpf geneigt, dann so verschoben, dass die Lende in
        Streifen zu 2 cm von 12 bis 26 cm über den Hüftgelenken an jeder Stelle anliegt, auch der Streifen mit dem
        geringsten Wert `RUECKEN` tief. Die Oberfläche des Polsters ist eine Ebene durch den Ursprung des Skeletts
        mit der Normalen `n`; die Höhe stimmt erst `_loesen` ab."""
        rig = self.rig
        self.verschiebung = Vector((0, 0.40, 1.0))
        for _ in range(8):
            rig.zuruecksetzen()
            self._torso(0.0)
            rig.anwenden()
            netz = [rig.lokal(p) for p in _netz(self.koerper)]
            d_r = max(min(netz[i].dot(self.n) for i in band) for band in self.lenden_baender)
            self.verschiebung += self.n * (-d_r - self.RUECKEN)

    def _loesen(self) -> None:
        """Lage am Polster, Füße auf der Platte, Weg des Schlittens, Griffe und Schulterpolster; dann die Maschine. Alles
        im Raum des Skeletts, die Maschine in der Welt (`rig.welt`)."""
        rig = self.rig
        k = rig.kopf
        self._lage()
        rig.zuruecksetzen()
        self._torso(0.0)
        rig.anwenden()
        self.huefte0 = {s: self._huefte(s) for s in "LR"}
        D = math.sqrt(self.l1 ** 2 + self.l2 ** 2 - 2 * self.l1 * self.l2 * math.cos(math.radians(self.KNIE_OBEN)))
        b = math.radians(self.BEIN)
        x = self.FUESSE * self.mass
        self.knoechel = {}
        for s, sx in (("L", 1), ("R", -1)):
            H = self.huefte0[s]
            seit = sx * x - H.x
            vorn = math.sqrt(max(D * D - seit * seit, 0.0))
            self.knoechel[s] = H + Vector((seit, -vorn * math.sin(b), -vorn * math.cos(b)))
        # Platte unter den Sohlen: Unterkante der Sohle so tief unter dem Fußgelenk wie im Stand, Mitte des Fußes
        ueber_sohle = k["foot.L"].z + rig.versatz.z
        ferse, spitze = _fuss(self.koerper, k)
        mitte_vor = k["foot.L"].y - (ferse + spitze) / 2
        sohlen = [self.knoechel[s] - self.pn * ueber_sohle + self._zehenrichtung(s) * mitte_vor for s in "LR"]
        platte = (sohlen[0] + sohlen[1]) / 2
        platte.x = 0.0
        # Höhe: die Platte `PLATTE_Z` über dem Boden; alles im Raum des Skeletts um dieselbe Höhe verschieben
        dz = self.PLATTE_Z - rig.welt(platte).z
        hoch = Vector((0, 0, dz))
        self.verschiebung += hoch
        self.ebene = hoch.copy()  # ein Punkt der Polsteroberfläche (Raum des Skeletts), Normale n
        for s in "LR":
            self.knoechel[s] = self.knoechel[s] + hoch
            self.huefte0[s] = self.huefte0[s] + hoch
        platte = platte + hoch
        # Die Füße etwas über dem unteren Rand der Platte (Text): Platte so lang, dass vor den Zehen und hinter den
        # Fersen Platz bleibt; ihre Mitte etwas vor der Mitte der Füße
        vorn_p = Vector((0, -math.cos(math.radians(self.PLATTE)), math.sin(math.radians(self.PLATTE))))
        self.platte = platte + vorn_p * 0.04
        self.weg = (0.0, self._weg_fuer(self.KNIE_UNTEN))
        # Schulterpolster: Unterseite auf der Oberseite der Schultern (am weitesten die Schiene hinauf), `SCHULTER_TIEF`
        rig.zuruecksetzen()
        self._torso(0.0)
        self._beine()
        rig.anwenden()
        netz = [rig.lokal(p) for p in _netz(self.koerper)]
        self.schulter_lage = {}
        for s, sx in (("L", 1), ("R", -1)):
            pk = [netz[i] for i in self.schulter_i[s]]
            top = max(pk, key=lambda q: q.dot(self.v))
            mitte = sum(pk, Vector()) / len(pk)
            # Mitte der Auflage: quer bei `SCHULTERPOLSTER_X`, längs der Normalen in der Mitte der Schulterpunkte, längs
            # der Schiene am höchsten Punkt, `SCHULTER_TIEF` darin
            auflage = Vector((sx * self.SCHULTERPOLSTER_X * self.mass, mitte.y, mitte.z))
            auflage = auflage + self.v * ((top - auflage).dot(self.v) - self.SCHULTER_TIEF)
            self.schulter_lage[s] = auflage
        # Griffe neben den Schulterpolstern: vor und unter dem Schultergelenk, Achse aus dem Polster zur Person
        self.griff_lage = {}
        for s, sx in (("L", 1), ("R", -1)):
            S = rig.punkt("shoulder01." + s, k["upperarm01." + s])
            mitte = S + X * (sx * self.GRIFF_SEITE * self.mass) + self.n * self.GRIFF_VOR - self.v * self.GRIFF_TIEF
            # Achse vom Zeigefinger zum kleinen Finger: zum Polster hin (Daumen vorn, Handflächen zueinander)
            self.griff_lage[s] = (mitte, self.n * self.GRIFF_ACHSE)
        rig.zuruecksetzen()
        # Mitte der Polsteroberfläche: auf der Ebene `ebene` mit der Normalen n, längs der Schiene 32 cm über der Mitte
        # der Hüftgelenke (das Polster reicht vom Gesäß bis zum Kopf)
        H = (self.huefte0["L"] + self.huefte0["R"]) / 2
        mitte_lehne = H + self.v * 0.32
        mitte_lehne = mitte_lehne - self.n * (mitte_lehne - self.ebene).dot(self.n)
        self.lehne_mitte = mitte_lehne
        import geraete as g

        self.geraet = g.hackenschmidt(rig.welt(mitte_lehne), {s: rig.welt(p) for s, p in self.schulter_lage.items()},
                                      {s: (rig.welt(m), kk) for s, (m, kk) in self.griff_lage.items()}, rig.welt(self.platte),
                                      self.PLATTE, self.weg[1])
        # Leerobjekt des Schlittens; nicht `schlitten` genannt: Daran misst `render.pruefen` die Sohlen (Beinpresse, Platte am
        # Schlitten), hier steht die Platte fest
        self.wagen = self.geraet["schlitten"]
        self.M_wagen0 = self.wagen.matrix_world.copy()
        self.polster_ruhe = {o.name: geraete.weiches_polster(o) for o in self.polster_objekte()}
        self.griff = {s: rig.griff(s, 0.6, self.GRIFF_R, schraeg=0.0) for s in "LR"}

    def _welt_im_schlitten(self, p: Vector, weg: float) -> Vector:
        """Punkt am Schlitten (Raum des Skeletts im Ausgang) in der Welt, wenn der Schlitten um `weg` hinab gefahren ist."""
        return self.rig.welt(p + self.u * weg)

    def setzen(self, p: float) -> None:
        if not self.geloest:
            self.geloest = True
            self._loesen()
        super().setzen(p)
        self.delle = geraete.eindruecken(self.polster_objekte(), self.polster_ruhe, self.auflage())

    def sohle_ebene(self) -> tuple[Vector, Vector]:
        return self.rig.welt(self.platte), self.pn.copy()

    def haltung(self, p: float) -> None:
        rig = self.rig
        weg = self.weg[0] + (self.weg[1] - self.weg[0]) * p
        self.weg_jetzt = weg
        self.wagen.matrix_world = Matrix.Translation(self.u * weg) @ self.M_wagen0
        self._torso(weg)
        beine = self._beine()
        arme = {}
        for s, sx in (("L", 1), ("R", -1)):
            mitte, kk = self.griff_lage[s]
            arme[s] = rig.arm(s, self.griff[s], mitte + self.u * weg, kk, (-self.v + X * (sx * 0.4)).normalized(),
                              self.STRECKUNG)
        L, A = beine["L"], arme["L"]
        rumpf = (rig.punkt("spine01", rig.kopf["spine01"]) - rig.punkt("spine05", rig.kopf["spine05"])).normalized()
        oberschenkel = (L["knie"] - L["huefte"]).normalized()
        schienbein = (L["knie"] - L["knoechel"]).normalized()
        zehen = self._zehenrichtung("L")
        n_achse = zehen.cross(self.pn).normalized()
        if n_achse.x < 0:
            n_achse = -n_achse
        self.werte = {
            "Kniewinkel (Grad)": self.kniewinkel(L),
            "Hüftwinkel (Grad)": math.degrees(oberschenkel.angle(rumpf)),
            "Sprunggelenk gebeugt (Grad)": 90.0 - math.degrees(schienbein.angle(zehen)),
            "Knie neben der Fußachse (cm, + außen)": (L["knie"] - L["knoechel"]).dot(n_achse) * 100,
            "Knie vor der Zehenspitze (cm, längs des Fußes)": (L["knie"] - (L["knoechel"] + zehen * self.zehen_laenge)).dot(zehen) * 100,
            "Schlitten: Weg von oben (cm)": weg * 100,
            "Oberschenkel zur Platte (Grad, + Knie höher)": 90.0 - math.degrees(oberschenkel.angle(self.pn)),
            "Ellbogenwinkel": A["ellbogenwinkel"],
            "Handgelenk gesamt (Grad)": A["handgelenk_gesamt"],
            "Handgelenk gestreckt (Grad)": A["handgelenk_streckung"],
            "Handgelenk seitlich (Grad, + zum Daumen)": A["handgelenk_seitlich"],
        }

    def zusatzwerte(self) -> dict:
        """Rücken, Kreuzbein und Kopf am Polster (mm, an der Oberfläche vor dem Eindrücken), Schulterpolster auf den
        Schultern, tiefste Delle und was durch die eingedrückte Oberfläche ragt; Sohlen auf der Platte misst
        `render.messen`."""
        aus = {}
        netz = _netz(self.koerper)
        lehne, *schulter = self.polster_objekte()
        aus["Unterer Rücken im Polster (mm, schwächste Stelle)"] = min(Beinpresse._im_polster(netz, b, lehne)
                                                                       for b in self.lenden_baender) * 1000
        aus["Kreuzbein im Polster (mm)"] = Beinpresse._im_polster(netz, self.kreuz_i, lehne) * 1000
        aus["Oberer Rücken im Polster (mm)"] = Beinpresse._im_polster(netz, self.brust_i, lehne) * 1000
        aus["Gesäß im Polster (mm)"] = Beinpresse._im_polster(netz, self.gesaess_i, lehne) * 1000
        haare = bpy.data.objects.get("Haare")
        if haare is not None:
            he = haare.evaluated_get(bpy.context.evaluated_depsgraph_get())
            me = he.to_mesh()
            punkte = [he.matrix_world @ v.co for v in me.vertices]
            he.to_mesh_clear()
            aus["Kopf (Haare) in der Lehne (mm)"] = Beinpresse._im_polster(punkte, range(len(punkte)), lehne) * 1000
        for s, obj in zip("LR", schulter):
            aus[f"Schulterpolster {s} auf der Schulter (mm)"] = Beinpresse._im_polster(netz, self.schulter_i[s], obj) * 1000
        aus["Polster: tiefste Delle (mm)"] = self.delle * 1000
        aus["Polster: Haut oder Kleidung durch die Oberfläche (mm)"] = geraete.durch_polster(self.polster_objekte(),
                                                                                           self.auflage()) * 1000
        # Abstand zu den übrigen Teilen der Maschine (Griffhalter, Schienen, Rahmen): ohne Polster, Griffe und Fußplatte
        import schuhe

        namen = {gr.index: gr.name for gr in self.koerper.vertex_groups}
        verts = self.koerper.data.vertices

        def gruppe(v, *anfang) -> bool:
            return sum(x.weight for x in v.groups if namen[x.group].startswith(anfang)) > 0.5

        def kleidung(*teile) -> list[Vector]:
            return [q for t in teile if t in bpy.data.objects for q in schuhe._verformt(bpy.data.objects[t])[0]]

        abstand = self._maschine_abstand()
        aus["Arme zur Maschine (mm, ohne Polster und Griffe)"] = abstand(
            [q for v, q in zip(verts, netz) if gruppe(v, "upperarm", "lowerarm", "shoulder")]) * 1000
        aus["Beine, Shorts und Socken zur Maschine (mm, ohne Fußplatte)"] = abstand(
            [q for v, q in zip(verts, netz) if gruppe(v, "upperleg", "lowerleg")] + kleidung("Shorts", "Socken")) * 1000
        aus["Kopf und Haare zur Maschine (mm, ohne Polster)"] = abstand(
            [q for v, q in zip(verts, netz) if gruppe(v, "head", "neck", "jaw", "eye")] + kleidung("Haare")) * 1000
        return aus

    def _maschine_abstand(self):
        """Abstand von Punkten zur Maschine ohne Rücken- und Schulterpolster, Griffe und Fußplatte (m)."""
        from mathutils.bvhtree import BVHTree

        dg = bpy.context.evaluated_depsgraph_get()
        g = self.geraet
        frei = set(self.polster_objekte()) | set(g["griffe"].values())
        ecken, flaechen = [], []
        for obj in g["wurzel"].children_recursive:
            if obj.type != "MESH" or obj in frei or obj.name.startswith("Fussplatte"):
                continue
            oe = obj.evaluated_get(dg)
            me = oe.to_mesh()
            n0 = len(ecken)
            ecken += [oe.matrix_world @ v.co for v in me.vertices]
            flaechen += [tuple(n0 + i for i in f.vertices) for f in me.polygons]
            oe.to_mesh_clear()
        baum = BVHTree.FromPolygons(ecken, flaechen)

        def abstand(pkte) -> float:
            best = 1.0
            for q in pkte:
                t = baum.find_nearest(q, best)
                if t[0] is not None:
                    best = min(best, t[3])
            return best

        return abstand


# ---------------------------------------------------------------------- Familie „Beine isoliert“: Sitzmaschinen und Waden (D-514)


class Beinstrecker(Uebung):
    """Beinstrecker, Familie „Beine isoliert“ (D-514), nach dem Ausführungstext der App (ExRx „Lever Leg Extension“) und
    den Werten der Familie (Knie von 90° bis 0–5° gebeugt). Sitzend auf der Maschine (`geraete.beinmaschine_sitzend`), der
    Rücken am Rückenpolster, das `LEHNE` Grad nach hinten geneigt ist; Gesäß und Rücken liegen mit der Kleidung `TIEF` in
    den Polstern, die Oberschenkel waagrecht auf dem Sitz, die Kniekehlen knapp vor der Sitzkante (`KNIE_FREI`). Die
    Drehachse des Hebels liegt auf der Achse der Kniegelenke („Kniegelenk auf Höhe der Drehachse“), die Rolle vorn auf
    den Unterschenkeln `ROLLE_UEBER` über den Fußgelenken. Die Hände halten die Griffe seitlich am Sitz. Die Knie strecken
    von `KNIE_AUS` bis `KNIE_EIN` („bis die Beine gerade sind“); Hebel und Rolle drehen mit den Unterschenkeln um
    dieselbe Achse, der Gewichtsblock hebt sich um den Weg der Nocke. Das Sprunggelenk bleibt wie im Stand. Zurück
    derselbe Weg."""

    name = "beinstrecker"
    titel = "Beinstrecker"
    fuesse_frei = True  # die Füße hängen frei (`render.messen`: kein Bodenkontakt)
    kamera = {"richtung": 75.0, "neigung": 12.0, "fuellen": 0.02}
    vorschau_phase = 1.0
    LEHNE = 15.0  # Rückenpolster gegen die Senkrechte nach hinten geneigt, Grad
    KNIE_AUS = 90.0  # Ausgang: Knie 90° gebeugt (Familie)
    KNIE_EIN = 177.0  # Ende: fast gestreckt (Familie: 0 bis 5° gebeugt)
    KINN = 12.0  # Kopf gegenüber dem Rumpf gebeugt, damit der Blick trotz der Lehne etwa waagrecht bleibt, Grad
    FUSS = 0.0  # Sprunggelenk gegenüber dem Stand angezogen (+, Fußspitzen zum Schienbein), Grad
    TIEF = 0.004  # Gesäß und Rücken mit der Kleidung so tief in den Polstern, m
    # Sohle bei 90° im Knie so weit über dem Boden, m: mit 6 cm streiften die Schuhe beim Beinbeuger sitzend den
    # Längsträger (0,08 mm), der zwischen den Füßen 6 cm hoch ist
    FREI = 0.09
    KNIE_FREI = 0.015  # Vorderkante des Sitzes so weit hinter den Waden (im Ausgang), m
    ROLLE_UEBER = 0.09  # Mitte der Rolle so weit über dem Fußgelenk (längs des Unterschenkels), m
    ROLLE_TIEF = 0.001  # Rolle so tief in Socke und Haut, m
    ROLLE_VORN = True  # Rolle vor den Unterschenkeln (Beinstrecker) oder hinter ihnen (Beinbeuger)
    GRIFF_X = 0.25  # Mitte der Griffe so weit von der Mitte, m
    GRIFF_VOR = 0.02  # Mitte der Griffe so weit vor den Hüftgelenken, m
    GRIFF_HOCH = 0.06  # Mitte der Griffe so weit über dem Sitz, m
    # Achse der Griffe (Welt, linke Seite) vom Zeigefinger zum kleinen Finger: waagrecht, 41° zur Mitte hin gedreht
    # (gesucht unter 17 Richtungen und drei Ellbogenrichtungen: längs nach hinten knickte das Handgelenk 18,7°, quer 9,1°)
    GRIFF_RICHTUNG = (-0.75, 0.66, 0.0)
    GRIFF_LAGE = 0.6
    STRECKUNG = 0.0
    POL = (0.6, 0.6, -0.2)  # Ellbogen nach außen und hinten (Raum des Skeletts, linke Seite)
    fuss_ansichten = ((90, 0.10), (0, 0.10), (180, 0.15), (270, 0.05))
    griff_ansichten = (("sitzgriff_aussen", 90.0, 20.0), ("sitzgriff_vorn", 15.0, 25.0))

    def rahmen_objekte(self) -> list:
        if self.geraet is None:
            return []
        g = self.geraet
        return [g["sitz"], g["lehne"], g["rolle"], *g["griffe"].values()]

    def polster_objekte(self) -> list:
        return self.geraet["polster"] if self.geraet else []

    def auflage(self) -> list:
        return auflage_objekte(self.koerper, "Shirt", "Shorts")

    def stange_achse(self):
        m, richtung = self.griffe["L"]
        return m.copy(), richtung, geraete.SITZMASCHINE["griff_d"] / 2

    def bauen(self) -> None:
        super().bauen()
        rig = self.rig
        k = rig.kopf
        self.l1 = (k["lowerleg01.L"] - k["upperleg01.L"]).length
        self.l2 = (k["foot.L"] - k["lowerleg01.L"]).length
        self.H0 = (k["upperleg01.L"] + k["upperleg01.R"]) / 2
        self.R = achse_winkel(X, -self.LEHNE)
        # Kniegelenke so hoch wie im Stand plus `FREI`: Bei 90° hängen die Schuhe so weit über dem Boden
        knie_z = k["lowerleg01.L"].z + self.FREI
        self.verschiebung = Vector((0.0, -self.H0.y, knie_z - self.H0.z))
        ruhe = [v.co for v in self.koerper.data.vertices]
        namen = {g.index: g.name for g in self.koerper.vertex_groups}

        def gruppe(*anfaenge: str) -> list[int]:
            return [v.index for v in self.koerper.data.vertices
                    if sum(g.weight for g in v.groups if namen[g.group].startswith(anfaenge)) > 0.5]

        huefte, hals = k["upperleg01.L"].z, k["neck01"].z
        self.gesaess_i = [i for i, q in enumerate(ruhe) if abs(q.x) < 0.17 and huefte - 0.12 < q.z < huefte + 0.06 and q.y > 0.02]
        self.schenkel_i = gruppe("upperleg")
        self.ruecken_i = [i for i, q in enumerate(ruhe) if abs(q.x) < 0.14 and huefte + 0.12 < q.z < hals - 0.05 and q.y > 0.0]
        self.unterschenkel_i = gruppe("lowerleg")
        self.phi0 = math.radians(180.0 - self.KNIE_AUS)
        self.geraet = None
        self.geloest = False
        self.delle = 0.0
        self._phase_jetzt = 0.0

    # ------------------------------------------------------------------ Haltung der Beine

    def _becken(self) -> Matrix:
        return starr(self.H0, self.H0 + self.verschiebung, self.R)

    @staticmethod
    def _unter(phi: float) -> tuple[Vector, Vector]:
        """Richtung des Unterschenkels (Knie → Fußgelenk) bei Beugung `phi` aus der Streckung (Raum des Skeletts) und
        die Richtung zu seiner Vorderseite."""
        return Vector((0.0, -math.cos(phi), -math.sin(phi))), Vector((0.0, -math.sin(phi), math.cos(phi)))

    def _beine(self, phi: float) -> dict:
        """Oberschenkel waagrecht nach vorn, Unterschenkel um `phi` aus der Streckung gebeugt; der Fuß fest am
        Unterschenkel wie im Stand, um `FUSS` angezogen."""
        from rig import abbild

        rig = self.rig
        k = rig.kopf
        u, v = self._unter(phi)
        aus = {}
        for s in "LR":
            H = rig.punkt("pelvis." + s, k["upperleg01." + s])
            K = H + Vector((0.0, -self.l1, 0.0))
            A = K + u * self.l2
            bein = rig.bein(s, A, Vector((0.0, -0.4, 1.0)).normalized(), 0.0)
            A0, K0 = k["foot." + s], k["lowerleg01." + s]
            R_unter = abbild(A0 - K0, -Y, bein["knoechel"] - bein["knie"], bein["richtung"])
            if self.FUSS:
                R_unter = achse_winkel(X, -self.FUSS) @ R_unter  # + zieht die Fußspitzen zum Schienbein
            rig.setze("foot." + s, starr(A0, bein["knoechel"], R_unter))
            aus[s] = bein
        return aus

    # ------------------------------------------------------------------ Maschine

    def _punkte(self, *namen: str) -> list[Vector]:
        import schuhe

        aus = []
        for n in namen:
            if n in bpy.data.objects:
                aus += schuhe._verformt(bpy.data.objects[n])[0]
        return aus

    def _loesen(self) -> None:
        """Polster und Maschine, wenn Kleidung und Schuhe da sind (erstes `setzen`): Sitz unter Gesäß und Oberschenkeln
        (Haut und Shorts) `TIEF` tief, Rückenpolster ebenso unter Rücken und Shirt; Drehachse auf der Achse der
        Kniegelenke, Rolle auf den Unterschenkeln, Griffe seitlich am Sitz."""
        import schuhe

        rig = self.rig
        k = rig.kopf
        m = geraete.SITZMASCHINE
        # Waden bei der stärksten Beugung (Lage der Sitzkante), dann der Ausgang
        rig.zuruecksetzen()
        rig.setze("root", self._becken())
        self._beine(max(self.phi0, math.radians(180.0 - self._knie(1.0))))
        rig.anwenden()
        wade = [q.copy() for q in (lambda n_: [n_[i] for i in self.unterschenkel_i])(_netz(self.koerper))] + self._punkte("Socken")
        rig.zuruecksetzen()
        rig.setze("root", self._becken())
        self._beine(self.phi0)
        rig.anwenden()
        netz = _netz(self.koerper)
        kleid = self._punkte("Shirt", "Saumband", "Shorts")
        H = rig.welt((rig.punkt("pelvis.L", k["upperleg01.L"]) + rig.punkt("pelvis.R", k["upperleg01.R"])) / 2)
        KL = rig.welt(rig.punkt("lowerleg01.L", k["lowerleg01.L"]))
        KR = rig.welt(rig.punkt("lowerleg01.R", k["lowerleg01.R"]))
        knie = (KL + KR) / 2
        S = {s: rig.welt(rig.punkt("shoulder01." + s, k["upperarm01." + s])) for s in "LR"}
        sb, sd = m["sitz"]
        # Rückenpolster: Ebene mit der Normale n zur Person, `TIEF` hinter dem hintersten Punkt von Rücken und Shirt
        a = math.radians(self.LEHNE)
        oben = Vector((0.0, math.sin(a), math.cos(a)))
        n = X.cross(oben)
        schulter_z = (S["L"].z + S["R"].z) / 2
        ruecken = [netz[i] for i in self.ruecken_i] + [q for q in kleid if abs(q.x) < 0.14 and q.y > H.y and H.z + 0.12 < q.z < schulter_z - 0.02]
        c = min(q.dot(n) for q in ruecken) + self.TIEF
        # Sitz: tiefste Stelle von Gesäß, Oberschenkeln und Shorts über der Fläche des Sitzes (vor dem Rückenpolster)
        # Vorderkante `KNIE_FREI` hinter den Waden (Haut und Socke) unter der Sitzfläche, im Ausgang mit 90° im Knie
        unten = [netz[i] for i in self.gesaess_i + self.schenkel_i] + kleid
        vorn_y = knie.y + 0.10
        for _ in range(3):
            auf = [q for q in unten if abs(q.x) < sb / 2 and vorn_y < q.y and q.dot(n) > c - 0.01 and q.z < H.z]
            sitz_z = min(q.z for q in auf) + self.TIEF
            hinter = [q.y for q in wade if sitz_z - sd - 0.03 < q.z < sitz_z + 0.01 and abs(q.x) < sb / 2]
            vorn_y = (max(hinter) if hinter else knie.y) + self.KNIE_FREI
        lx, ly, _ = m["lehne"]
        z_mitte = sitz_z + 0.04 + ly / 2 * oben.z
        for _ in range(3):  # alle Punkte von Haut und Kleidung über der Fläche des Polsters
            y_mitte = (n.z * z_mitte - c) / -n.y
            lehne = Vector((0.0, y_mitte, z_mitte))
            ueber = [q for q in netz + kleid
                     if abs(q.x) < lx / 2 and abs((q - lehne).dot(oben)) < ly / 2 and -0.05 < (q - lehne).dot(n) < 0.10]
            c = min(q.dot(n) for q in ueber) + self.TIEF
        y_mitte = (n.z * z_mitte - c) / -n.y
        lehne = Vector((0.0, y_mitte, z_mitte))
        hinten_y = (lehne - oben * (ly / 2)).y + 0.02
        # Drehachse auf der Achse der Kniegelenke, rechts neben dem rechten Knie
        self.achse = Vector((-m["hebel_x"], knie.y, knie.z))
        u, v = self._unter(self.phi0)
        if not self.ROLLE_VORN:
            v = -v
        L = self.l2 - self.ROLLE_UEBER
        r = m["rolle_d"] / 2 - self.ROLLE_TIEF
        bein = [netz[i] for i in self.unterschenkel_i] + self._punkte("Socken")
        hoch = -1.0
        for q in bein:
            w = q - Vector((q.x, knie.y, knie.z))
            du = w.dot(u) - L
            if abs(du) < r and abs(q.x) < m["rolle_l"] / 2:
                hoch = max(hoch, w.dot(v) + math.sqrt(r * r - du * du))
        rolle = Vector((0.0, knie.y, knie.z)) + u * L + v * hoch
        self.rolle0 = rolle
        # Griffe seitlich am Sitz
        self.griffe = {}
        for s, sx in (("L", 1), ("R", -1)):
            gm = Vector((sx * self.GRIFF_X * self.mass, H.y - self.GRIFF_VOR, sitz_z + self.GRIFF_HOCH))
            g0, g1, g2 = self.GRIFF_RICHTUNG
            self.griffe[s] = (gm, Vector((sx * g0, g1, g2)).normalized())
        schenkel = self._schenkelpolster(netz, kleid, knie) if hasattr(self, "_schenkelpolster") else None
        rig.zuruecksetzen()
        self.sitz_z, self.sitz_vorn = sitz_z, vorn_y
        self.lehne_welt = (lehne, oben)
        self.geraet = geraete.beinmaschine_sitzend(self.titel, (sitz_z, vorn_y, hinten_y), (lehne, oben), self.achse, rolle,
                                                   self.griffe, schenkel)
        self.polster_ruhe = {o.name: geraete.weiches_polster(o) for o in self.polster_objekte()}
        # Das neue Netz der Polster liegt einige Millimeter neben der Fläche des Kastens: jedes Polster längs seiner
        # Normale so verschieben, dass die tiefste Stelle von Haut und Kleidung `TIEF` darin liegt
        rig.zuruecksetzen()
        rig.setze("root", self._becken())
        self._beine(self.phi0)
        rig.anwenden()
        punkte = SchulterdrueckenMaschine._auflage_punkte(self)
        for obj in self.polster_objekte():
            n_welt = (obj.matrix_world.to_3x3() @ Z).normalized()
            obj.matrix_world = Matrix.Translation(n_welt * (self.TIEF - SchulterdrueckenMaschine._tiefe(obj, punkte))) @ obj.matrix_world
        rig.zuruecksetzen()
        self.griff = {s: rig.griff(s, self.GRIFF_LAGE, m["griff_d"] / 2) for s in "LR"}

    # ------------------------------------------------------------------ Haltung

    def _arme(self) -> dict:
        rig = self.rig
        aus = {}
        for s, sx in (("L", 1), ("R", -1)):
            gm, richtung = self.griffe[s]
            pol = Vector((sx * self.POL[0], self.POL[1], self.POL[2])).normalized()
            aus[s] = rig.arm(s, self.griff[s], rig.lokal(gm), richtung, pol, self.STRECKUNG)
        return aus

    def _knie(self, p: float) -> float:
        return self.KNIE_AUS + (self.KNIE_EIN - self.KNIE_AUS) * p

    def haltung(self, p: float) -> None:
        rig = self.rig
        k = rig.kopf
        phi = math.radians(180.0 - self._knie(p))
        rig.setze("root", self._becken())
        rig.dreh("neck01", achse_winkel(X, self.KINN))
        beine = self._beine(phi)
        arme = self._arme()
        dreh = math.degrees(phi - self.phi0)
        g = self.geraet
        g["hebel"].matrix_world = (Matrix.Translation(self.achse) @ achse_winkel(X, dreh).to_4x4()
                                   @ Matrix.Translation(-self.achse) @ g["hebel0"])
        weg = geraete.SITZMASCHINE["nocke_r"] * abs(phi - self.phi0)
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
            "Sprunggelenk gebeugt (Grad, + Fußspitzen zum Schienbein)": 90.0 - math.degrees(schienbein.angle(zehen)),
            "Kniegelenk zur Drehachse (mm)": math.hypot(K.y - self.achse.y, K.z - self.achse.z) * 1000,
            "Hebel gedreht (Grad)": dreh,
            "Gewichtsblock gehoben (cm)": weg * 100,
            "Ellbogenwinkel": A["ellbogenwinkel"],
            "Handgelenk gesamt (Grad)": A["handgelenk_gesamt"],
            "Handgelenk gestreckt (Grad)": A["handgelenk_streckung"],
            "Handgelenk seitlich (Grad, + zum Daumen)": A["handgelenk_seitlich"],
        }

    def setzen(self, p: float) -> None:
        if not self.geloest:
            self.geloest = True
            self._loesen()
        self._phase_jetzt = p
        super().setzen(p)
        self.delle = geraete.eindruecken(self.polster_objekte(), self.polster_ruhe, self.auflage())

    # ------------------------------------------------------------------ Messwerte und Nahaufnahmen

    def _rolle(self) -> tuple[Vector, Vector, float, float]:
        m = geraete.SITZMASCHINE
        M = self.geraet["rolle"].matrix_world
        return M.translation.copy(), (M.to_3x3() @ Vector((0, 0, 1))).normalized(), m["rolle_d"] / 2, m["rolle_l"] / 2

    _zur_rolle = BeinbeugerLiegend._zur_rolle

    def fuss_ziel(self, sohle: list[Vector]) -> Vector:
        rig = self.rig
        A = rig.welt(rig.punkt("foot.L", rig.kopf["foot.L"]))
        c, ax, _, _ = self._rolle()
        return (A + c + ax * (A - c).dot(ax)) / 2

    def nah_punkte(self) -> list[Vector]:
        rig = self.rig
        hand = rig.welt(rig.punkt("wrist.L", rig.kopf["metacarpal2.L"]))
        gm, richtung = self.griffe["L"]
        halb = geraete.SITZMASCHINE["griff_l"] / 2
        return [q for q in _netz(self.koerper) if (q - hand).length < 0.10] + [gm + richtung * halb, gm - richtung * halb]

    def zusatzwerte(self) -> dict:
        """Gesäß und Rücken in den Polstern, Delle, nichts ragt durch; die Rolle auf Socke und Haut der Unterschenkel und
        zu den Schuhen; die Waden zur Sitzkante (mm)."""
        from mathutils.bvhtree import BVHTree

        g = self.geraet
        punkte = SchulterdrueckenMaschine._auflage_punkte(self)
        werte = {"Gesäß im Sitz (mm)": SchulterdrueckenMaschine._tiefe(g["sitz"], punkte) * 1000,
                 "Rücken im Polster (mm)": SchulterdrueckenMaschine._tiefe(g["lehne"], punkte) * 1000,
                 "Polster: tiefste Delle (mm)": self.delle * 1000,
                 "Polster: Haut oder Kleidung durch die Oberfläche (mm)": geraete.durch_polster(self.polster_objekte(),
                                                                                                 self.auflage()) * 1000}
        netz = _netz(self.koerper)
        socke = self._punkte("Socken")
        werte["Rolle: Socke und Haut (mm, negativ = eingedrückt)"] = self._zur_rolle([netz[i] for i in self.unterschenkel_i] + socke) * 1000
        schuh = self._punkte("Schuhe", "Sohle")
        if schuh:
            werte["Rolle zu den Schuhen (mm)"] = self._zur_rolle(schuh) * 1000
        # Waden (Haut und Socke) zum Sitzpolster: an der Vorderkante darf nichts hineinragen
        dg = bpy.context.evaluated_depsgraph_get()
        oe = g["sitz"].evaluated_get(dg)
        me = oe.to_mesh()
        M = oe.matrix_world
        bvh = BVHTree.FromPolygons([M @ v.co for v in me.vertices], [tuple(f.vertices) for f in me.polygons])
        oe.to_mesh_clear()
        beste = 1.0
        for q in [netz[i] for i in self.unterschenkel_i] + socke:
            ort, nn, _, d = bvh.find_nearest(q, 0.2)
            if ort is not None:
                beste = min(beste, d if (q - ort).dot(nn) >= 0 else -d)
        werte["Unterschenkel zum Sitz (mm, negativ = darin)"] = beste * 1000
        # Schuhe zum Gerät ohne Rolle (Längsträger, Füße des Rahmens, Hebel)
        teile = [o for o in g["wurzel"].children_recursive if o.type == "MESH" and o is not g["rolle"]]
        schuh = self._punkte("Schuhe", "Sohle")
        beste = 1.0
        for o in teile:
            oe = o.evaluated_get(dg)
            me = oe.to_mesh()
            M = oe.matrix_world
            bvh = BVHTree.FromPolygons([M @ v.co for v in me.vertices], [tuple(f.vertices) for f in me.polygons])
            oe.to_mesh_clear()
            for q in schuh[::3]:
                ort, _, _, d = bvh.find_nearest(q, 0.3)
                if ort is not None:
                    beste = min(beste, d)
        werte["Schuhe zum Gerät ohne Rolle (mm)"] = beste * 1000
        return werte

class BeinbeugerSitzend(Beinstrecker):
    """Beinbeuger sitzend, Familie „Beine isoliert“ (D-514), nach dem Ausführungstext der App (ExRx „Lever Seated Leg
    Curl“) und den Werten der Familie (Knie von gestreckt bis 110–130° gebeugt). Dieselbe Sitzmaschine wie beim
    Beinstrecker (`geraete.beinmaschine_sitzend`), die Lehne `LEHNE` Grad nach hinten geneigt; die Kniegelenke auf der
    Drehachse des Hebels, die Rolle hinter den Unterschenkeln `ROLLE_UEBER` über den Fußgelenken („knapp über den
    Knöcheln“), das Oberschenkelpolster quer über den Oberschenkeln `SCHENKEL_HINTER` hinter den Kniegelenken, mit der
    Haut `SCHENKEL_TIEF` darin. Die Fußspitzen sind `FUSS` zum Schienbein angezogen („Zieh die Fußspitzen zu dir“). Die
    Knie beugen von `KNIE_AUS` bis `KNIE_EIN`, die Unterschenkel gehen unter den Sitz; Hebel und Rolle drehen mit.
    Zurück derselbe Weg bis zu gestreckten Knien. Die Vorderkante des Sitzes liegt `KNIE_FREI` hinter den Waden bei der
    stärksten Beugung."""

    name = "beinbeuger_sitzend"
    titel = "Beinbeuger sitzend"
    kamera = {"richtung": 80.0, "neigung": 14.0, "fuellen": 0.02}
    LEHNE = 20.0
    KNIE_AUS = 172.0  # Ausgang: Knie fast gestreckt („bis die Knie gestreckt sind“)
    KNIE_EIN = 60.0  # Ende: Knie 120° gebeugt (Familie: 110 bis 130°)
    FUSS = 10.0
    ROLLE_VORN = False
    ROLLE_UEBER = 0.08
    SCHENKEL_HINTER = 0.10  # Mitte des Oberschenkelpolsters so weit hinter den Kniegelenken, m
    SCHENKEL_TIEF = 0.002  # Oberschenkelpolster so tief in Haut und Shorts, m

    def rahmen_objekte(self) -> list:
        aus = super().rahmen_objekte()
        if self.geraet is not None and self.geraet["schenkelpolster"] is not None:
            aus.append(self.geraet["schenkelpolster"])
        return aus

    def _schenkelpolster(self, netz: list, kleid: list, knie: Vector) -> Vector:
        """Mitte des Oberschenkelpolsters (Welt): `SCHENKEL_HINTER` hinter den Kniegelenken, so tief, dass es
        `SCHENKEL_TIEF` in Haut und Shorts der Oberschenkel liegt."""
        m = geraete.SITZMASCHINE
        r = m["schenkel_d"] / 2 - self.SCHENKEL_TIEF
        y = knie.y + self.SCHENKEL_HINTER
        hoch = -1.0
        for q in [netz[i] for i in self.schenkel_i + self.unterschenkel_i] + kleid:
            dy = q.y - y
            if abs(dy) < r and abs(q.x) < m["schenkel_l"] / 2 and q.z > knie.z - 0.02:
                hoch = max(hoch, q.z + math.sqrt(r * r - dy * dy))
        self.schenkel_mitte = Vector((0.0, y, hoch))
        return self.schenkel_mitte

    def zusatzwerte(self) -> dict:
        """Dazu: das Oberschenkelpolster auf Haut und Shorts, die Schuhe zum Rahmen (mm)."""
        from mathutils.bvhtree import BVHTree

        werte = super().zusatzwerte()
        m = geraete.SITZMASCHINE
        netz = _netz(self.koerper)
        c, r = self.schenkel_mitte, m["schenkel_d"] / 2
        beste = 1.0
        for q in [netz[i] for i in self.schenkel_i] + self._punkte("Shorts"):
            if abs(q.x) <= m["schenkel_l"] / 2:
                beste = min(beste, math.hypot(q.y - c.y, q.z - c.z) - r)
        werte["Oberschenkelpolster: Haut und Shorts (mm, negativ = eingedrückt)"] = beste * 1000
        return werte

class WadenhebenStehend(Uebung):
    """Wadenheben stehend an der Maschine, Familie „Beine isoliert“ (D-514), nach dem Ausführungstext der App (ExRx „Lever
    Standing Calf Raise“) und den Werten der Familie (Sprunggelenk von 10–15° gebeugt bis 20–30° gestreckt). Die
    Schultern unter den Polstern des Schlittens (`geraete.wadenmaschine_stehend`), die Vorfüße auf dem Block, die Ballen
    über seiner hinteren Kante, die Fersen frei; Füße parallel und hüftbreit, Knie fast gestreckt (`KNIE`), der Rumpf
    aufrecht; die Hände an den Griffen neben den Polstern. Das Sprunggelenk geht von `DORSAL` gebeugt (Fersen unter der
    Kante, „bis du eine Dehnung spürst“) bis `PLANTAR` gestreckt („so hoch wie möglich“). Unter der Kante dreht sich der
    ganze Schuh um die Kante; über ihr bleibt der Vorfuß flach auf dem Block, der Schuh biegt sich am Ballen
    (`schuhe.Vorfuss`, D-467), die Ferse hebt sich. Der Körper fährt mit dem Schlitten senkrecht; der Gewichtsblock hebt
    sich ebenso. Zurück derselbe Weg."""

    name = "wadenheben_stehend"
    titel = "Wadenheben stehend"
    fuesse_frei = True  # Füße auf der Kante, Fersen frei: kein Bodenkontakt (`render.messen`); Messung am Block
    kamera = {"richtung": 85.0, "neigung": 6.0, "fuellen": 0.02}
    vorschau_phase = 1.0
    BLOCK = 0.10  # Höhe des Blocks, m
    # Bewegungsweite nach der Entscheidung des Produktinhabers (D-516): unten die Fersen etwa 5 bis 6 cm unter dem Block
    # (bis D-515 12° gebeugt, 3,5 cm), oben so hoch auf die Ballen, wie Fuß und Schuh es sauber zulassen (bis D-515 25°).
    # Gemessen: 18° → Ferse 5,5 cm unter dem Block. Oben bleibt die Innenseite des Kragens bis 40° über der Socke
    # (0,5 mm, bei 45° 0,5 mm darin); das Polster am Kragen berührt sie aber schon bei 39° (40°: 0,2 mm darin), daher 38°
    # (0,2 mm darüber)
    DORSAL = 18.0  # Ausgang: Sprunggelenk gebeugt, Grad
    PLANTAR = 38.0  # oben: Sprunggelenk gestreckt, Grad
    KNIE = 176.0  # „Halt die Knie gerade“: fast gestreckt
    KANTE = 0.0  # Kante des Blocks so weit hinter der Mitte des Bogens am Ballen (zur Ferse), m
    SCHULTER_TIEF = 0.004  # Schulterpolster so tief auf den Schultern, m
    SCHULTERPOLSTER_X = 0.125  # wie bei der Hackenschmidt-Maschine: innen frei von Kopf und Haaren
    GRIFF_R = 0.016
    POL = (0.6, 0.2, -0.8)  # Ellbogen nach unten, außen und etwas hinten (linke Seite)
    STRECKUNG = 0.0
    # Griffe quer vor der Brust, an Haltern vom Schlitten: so weit außen, vor und unter dem Schultergelenk (m), Obergriff
    # (Achse vom Zeigefinger zum kleinen Finger nach außen), Ellbogen unten und etwas außen. Gesucht unter vier Lagen,
    # zwölf Richtungen und drei Ellbogenrichtungen: neben den Polstern wie bei der Hackenschmidt-Maschine standen die
    # Ellbogen weit nach hinten außen, vor den Schultern auf ihrer Höhe war der Ellbogen unter 37° gebeugt
    GRIFF_SEITE, GRIFF_VOR, GRIFF_TIEF = 0.06, 0.22, 0.20
    GRIFF_ACHSE = (1.0, 0.0, 0.0)
    fuss_ansichten = ((90, 0.06), (180, 0.10), (0, 0.10), (270, 0.06))
    griff_ansichten = (("waden_hand", 100.0, 10.0), ("waden_hand_vorn", 20.0, 20.0))

    def rahmen_objekte(self) -> list:
        if self.geraet is None:
            return []
        return [*self.geraet["polster"], *self.geraet["griffe"].values()]

    def polster_objekte(self) -> list:
        return self.geraet["polster"] if self.geraet else []

    def auflage(self) -> list:
        return auflage_objekte(self.koerper, "Shirt", "Haare")

    def stange_achse(self):
        mitte, k = self.griff_lage["L"]
        return self.rig.welt(mitte + self.T), k.normalized(), self.GRIFF_R

    def bauen(self) -> None:
        super().bauen()
        rig = self.rig
        k = rig.kopf
        self.l1 = (k["lowerleg01.L"] - k["upperleg01.L"]).length
        self.l2 = (k["foot.L"] - k["lowerleg01.L"]).length
        self.H0 = (k["upperleg01.L"] + k["upperleg01.R"]) / 2
        schulter_z = k["upperarm01.L"].z
        namen = {g.index: g.name for g in self.koerper.vertex_groups}
        px = self.SCHULTERPOLSTER_X * self.mass
        self.schulter_i = {s: [v.index for v in self.koerper.data.vertices
                               if abs(sx * v.co.x - px) < 0.05 and v.co.z > schulter_z - 0.02
                               and not any(namen[g.group].startswith(("head", "neck", "jaw")) and g.weight > 0.3 for g in v.groups)]
                           for s, sx in (("L", 1), ("R", -1))}
        self.T = Vector()
        self.beta_jetzt = 0.0
        self.geraet = None
        self.geloest = False
        self.delle = 0.0
        self._beta_cache = {}

    # ------------------------------------------------------------------ Fuß auf der Kante

    def vorfuss_grad(self, p: float) -> dict:
        g = max(self._beta(p), 0.0) if self.geloest else 0.0
        return {"L": g, "R": g}

    def _fuss_tabelle(self) -> None:
        """Bogen am Ballen (`schuhe.Vorfuss`): Für Winkel g die starre Bewegung der Sohle vor dem Bogen (Raum des
        Skeletts, Ruhehaltung), Drehung −g um x und Verschiebung t(g); dazu die Kante unter der Mitte des Bogens."""
        import schuhe

        rig = self.rig
        if self.vorfuss is None:
            self.vorfuss = schuhe.Vorfuss(self.koerper, self.skelett)
        sohle = bpy.data.objects["Sohle"]
        u = [a.value for a in sohle.data.attributes["SchuhU"].data]
        rig.zuruecksetzen()
        rig.anwenden()
        self.vorfuss.setze({"L": 0.0, "R": 0.0})
        p0 = [rig.lokal(q) for q in schuhe._verformt(sohle)[0]]
        z0, z1 = self.vorfuss.zone["L"]
        vorn = [i for i, (q, uu) in enumerate(zip(p0, u)) if q.x > 0 and uu > z1 + 0.03]
        # Mitte des Bogens (Raum des Skeletts): Ursprung des Bogens (hinteres Ende der Zone) plus halbe Länge nach vorn;
        # dort liegt die Kante des Blocks
        M = self.vorfuss.ursprung["L"].matrix_basis
        self.bogen_mitte = M.translation + (M.to_3x3() @ Vector((1.0, 0.0, 0.0))) * (self.vorfuss.laenge / 2)
        self.kante_y = self.bogen_mitte.y + self.KANTE
        self.sohle_z0 = min(q.z for q in p0)  # Unterkante der Sohle in Ruhe (Raum des Skeletts)
        links = [i for i, q in enumerate(p0) if q.x > 0]
        self.t_tabelle = []
        self.t_rest = 0.0
        for g in range(0, 46, 5):
            self.vorfuss.setze({"L": float(g), "R": float(g)})
            pg = [rig.lokal(q) for q in schuhe._verformt(sohle)[0]]
            R = achse_winkel(X, -float(g))
            t = sum((pg[i] - R @ p0[i] for i in vorn), Vector()) / len(vorn)
            self.t_rest = max(self.t_rest, max((pg[i] - R @ p0[i] - t).length for i in vorn))
            t = Vector((0.0, t.y, t.z))
            # Lücke: tiefster Punkt der Sohle über dem Block, wenn der Fuß um g geneigt ist und der Vorfuß liegt, gegenüber
            # der Unterkante in Ruhe (Vorfuß mit gebogener Spitze: liegt sonst einige Millimeter hoch)
            Rb = achse_winkel(X, float(g))
            ueber = [(Rb @ (pg[i] - t)).z for i in links if (Rb @ (pg[i] - t)).y < self.kante_y]
            luecke = (min(ueber) - self.sohle_z0) if (g > 0 and ueber) else 0.0
            self.t_tabelle.append((float(g), t, luecke))
        self.vorfuss.setze({"L": 0.0, "R": 0.0})
        rig.zuruecksetzen()

    def _t(self, g: float) -> tuple[Vector, float]:
        tab = self.t_tabelle
        if g <= 0:
            return Vector(), 0.0
        for (g0, t0, l0), (g1, t1, l1) in zip(tab, tab[1:]):
            if g <= g1:
                a = (g - g0) / (g1 - g0)
                return t0.lerp(t1, a), l0 + (l1 - l0) * a
        return tab[-1][1], tab[-1][2]

    def _knoechel(self, s: str, beta: float) -> Vector:
        """Fußgelenk bei der Neigung `beta` des Fußes (Grad, + Ferse hoch): Unter null dreht der ganze Schuh um die Kante,
        darüber bleibt der Vorfuß flach (Bogen `beta`), das Fußgelenk folgt aus der Bewegung des Bogens."""
        A0 = self.rig.kopf["foot." + s]
        A_null = A0 + self.hoch
        R = achse_winkel(X, beta)
        if beta <= 0.0:
            E = Vector((A0.x, self.kante_y, self.kante_z))
            return E + R @ (A_null - E)
        t, luecke = self._t(beta)
        return A_null - A0 + R @ (A0 - t) - Vector((0.0, 0.0, luecke))

    # ------------------------------------------------------------------ Beine und Becken

    def _bein_lage(self, beta: float) -> tuple[Vector, dict, dict]:
        """Becken (Verschiebung), Fußgelenke und Knie bei `beta`: Hüftgelenke senkrecht über ihrer Lage im Stand, so hoch,
        dass das Knie `KNIE` hat."""
        from rig import zwei_glieder

        k = self.rig.kopf
        D = math.sqrt(self.l1 ** 2 + self.l2 ** 2 - 2 * self.l1 * self.l2 * math.cos(math.radians(self.KNIE)))
        A = {s: self._knoechel(s, beta) for s in "LR"}
        H0 = k["upperleg01.L"]
        dx, dy = H0.x - A["L"].x, H0.y - A["L"].y
        tz = A["L"].z - H0.z + math.sqrt(max(D * D - dx * dx - dy * dy, 0.0))
        T = Vector((0.0, 0.0, tz))
        K = {s: zwei_glieder(k["upperleg01." + s] + T, A[s], self.l1, self.l2, Vector((0.0, -1.0, 0.0)))[0] for s in "LR"}
        return T, A, K

    def _sprung(self, beta: float, A: Vector, K: Vector) -> float:
        """Sprunggelenk (Grad, + gebeugt: Fußspitzen zum Schienbein) aus Unterschenkel und Fuß."""
        zehen = achse_winkel(X, beta) @ Vector((0.0, -1.0, 0.0))
        return 90.0 - math.degrees((K - A).angle(zehen))

    def _beta(self, p: float) -> float:
        """Neigung des Fußes, bei der das Sprunggelenk in Phase p seinen Wert hat (Gebeugt `DORSAL` → gestreckt
        `PLANTAR`)."""
        schluessel = round(p, 6)
        if schluessel in self._beta_cache:
            return self._beta_cache[schluessel]
        ziel = self.DORSAL - (self.DORSAL + self.PLANTAR) * p
        beta = -ziel
        for _ in range(30):
            _, A, K = self._bein_lage(beta)
            w = self._sprung(beta, A["L"], K["L"])
            if abs(w - ziel) < 1e-4:
                break
            beta += w - ziel
        self._beta_cache[schluessel] = beta
        return beta

    # ------------------------------------------------------------------ Maschine

    def _loesen(self) -> None:
        """Bogen am Ballen, Kante des Blocks, Schulterpolster und Griffe; dann die Maschine (Welt)."""
        rig = self.rig
        k = rig.kopf
        self._fuss_tabelle()
        # Die Figur steht um die Höhe des Blocks höher als im Stand
        self.hoch = Vector((0.0, 0.0, self.BLOCK))
        self.kante_z = self.sohle_z0 + self.BLOCK
        self.geloest = True
        T, A, K = self._bein_lage(0.0)
        self.T0 = T
        rig.zuruecksetzen()
        rig.setze("root", starr(Vector(), T, Matrix.Identity(3)))
        rig.anwenden()
        netz = [rig.lokal(q) for q in _netz(self.koerper)]
        # Schulterpolster: Unterseite auf der höchsten Stelle der Schultern, `SCHULTER_TIEF` darin; Lage gegenüber dem
        # Becken (fährt mit ihm)
        self.schulter_lage = {}
        for s, sx in (("L", 1), ("R", -1)):
            pk = [netz[i] for i in self.schulter_i[s]]
            top = max(q.z for q in pk)
            mitte = sum(pk, Vector()) / len(pk)
            self.schulter_lage[s] = Vector((sx * self.SCHULTERPOLSTER_X * self.mass, mitte.y, top - self.SCHULTER_TIEF)) - T
        self.griff_lage = {}
        for s, sx in (("L", 1), ("R", -1)):
            S = k["upperarm01." + s]
            mitte = S + Vector((sx * self.GRIFF_SEITE * self.mass, -self.GRIFF_VOR, -self.GRIFF_TIEF))
            self.griff_lage[s] = (mitte, Vector((sx * self.GRIFF_ACHSE[0], self.GRIFF_ACHSE[1], self.GRIFF_ACHSE[2])).normalized())
        rig.zuruecksetzen()
        self.geraet = geraete.wadenmaschine_stehend(self.BLOCK, rig.welt(Vector((0.0, self.kante_y, 0.0))).y,
                                                    {s: rig.welt(q + T) for s, q in self.schulter_lage.items()},
                                                    {s: (rig.welt(m + T), kk) for s, (m, kk) in self.griff_lage.items()})
        self.polster_ruhe = {o.name: geraete.weiches_polster(o) for o in self.polster_objekte()}
        self.griff = {s: rig.griff(s, 0.6, self.GRIFF_R, schraeg=0.0) for s in "LR"}

    # ------------------------------------------------------------------ Haltung

    def setzen(self, p: float) -> None:
        if not self.geloest:
            self._loesen()
        super().setzen(p)
        self.delle = geraete.eindruecken(self.polster_objekte(), self.polster_ruhe, self.auflage())

    def haltung(self, p: float) -> None:
        rig = self.rig
        beta = self._beta(p)
        self.beta_jetzt = beta
        T, A, K = self._bein_lage(beta)
        self.T = T
        rig.setze("root", starr(Vector(), T, Matrix.Identity(3)))
        R = achse_winkel(X, beta)
        beine = {s: rig.bein(s, A[s], Vector((0.0, -1.0, 0.0)), 0.0, fuss_ebene=R) for s in "LR"}
        arme = {}
        for s, sx in (("L", 1), ("R", -1)):
            m, kk = self.griff_lage[s]
            pol = Vector((sx * self.POL[0], self.POL[1], self.POL[2])).normalized()
            arme[s] = rig.arm(s, self.griff[s], m + T, kk, pol, self.STRECKUNG)
        dz = (T - self.T0).z
        g = self.geraet
        g["schlitten"].matrix_world = Matrix.Translation(Vector((0, 0, dz))) @ g["schlitten0"]
        g["block"].matrix_world = Matrix.Translation(Vector((0, 0, dz))) @ g["block0"]
        L, Ar = beine["L"], arme["L"]
        self.werte = {
            "Sprunggelenk (Grad, + gebeugt, − gestreckt)": self._sprung(beta, A["L"], K["L"]),
            "Fuß geneigt (Grad, + Ferse hoch)": beta,
            "Schuh am Ballen gebogen (Grad)": max(beta, 0.0),
            "Kniewinkel (Grad)": self.kniewinkel(L),
            "Körper gehoben (cm, gegenüber dem flachen Fuß)": dz * 100,
            "Ellbogenwinkel": Ar["ellbogenwinkel"],
            "Handgelenk gesamt (Grad)": Ar["handgelenk_gesamt"],
            "Handgelenk gestreckt (Grad)": Ar["handgelenk_streckung"],
            "Handgelenk seitlich (Grad, + zum Daumen)": Ar["handgelenk_seitlich"],
        }

    # ------------------------------------------------------------------ Messwerte

    def _block_werte(self, top_welt: float, kante_welt: float) -> dict:
        import schuhe

        sohle = bpy.data.objects["Sohle"]
        pk, _, _ = schuhe._verformt(sohle)
        u = [a.value for a in sohle.data.attributes["SchuhU"].data]
        auf = [q.z - top_welt for q in pk if q.y < kante_welt]
        ferse = [q.z - top_welt for q, uu in zip(pk, u) if uu < 0.15]
        vorn = [q.z - top_welt for q, uu in zip(pk, u) if uu > 0.85]
        return {"Sohle über dem Block: tiefster Punkt über der Oberseite (mm, negativ = darin)": min(auf) * 1000 if auf else float("nan"),
                "Sohle: Spitze über der Oberseite des Blocks (mm)": min(vorn) * 1000,
                "Ferse: Unterkante zur Oberseite des Blocks (cm, + darüber)": min(ferse) * 100}

    def zusatzwerte(self) -> dict:
        """Sohle auf dem Block, Ferse zur Oberseite, Schulterpolster (Delle, nichts durch), Kopf und Haare zum Gerät."""
        from mathutils.bvhtree import BVHTree

        rig = self.rig
        top = rig.welt(Vector((0.0, 0.0, self.kante_z))).z
        werte = self._block_werte(top, rig.welt(Vector((0.0, self.kante_y, 0.0))).y)
        werte["Schulterpolster: tiefste Delle (mm)"] = self.delle * 1000
        werte["Schulterpolster: Haut, Shirt oder Haare durch die Oberfläche (mm)"] = geraete.durch_polster(self.polster_objekte(),
                                                                                                          self.auflage()) * 1000
        g = self.geraet
        teile = [o for o in g["wurzel"].children_recursive if o.type == "MESH" and o not in g["polster"]]
        dg = bpy.context.evaluated_depsgraph_get()
        namen = {gr.index: gr.name for gr in self.koerper.vertex_groups}
        netz = _netz(self.koerper)
        kopf = [q for v, q in zip(self.koerper.data.vertices, netz)
                if sum(x.weight for x in v.groups if namen[x.group].startswith(("head", "neck", "jaw"))) > 0.5]
        import schuhe

        if "Haare" in bpy.data.objects:
            kopf += schuhe._verformt(bpy.data.objects["Haare"])[0][::4]
        beste = 1.0
        for o in teile:
            oe = o.evaluated_get(dg)
            me = oe.to_mesh()
            M = oe.matrix_world
            bvh = BVHTree.FromPolygons([M @ v.co for v in me.vertices], [tuple(f.vertices) for f in me.polygons])
            oe.to_mesh_clear()
            for q in kopf[::2]:
                ort, _, _, d = bvh.find_nearest(q, 0.3)
                if ort is not None:
                    beste = min(beste, d)
        werte["Kopf und Haare zum Gerät ohne Polster (mm)"] = beste * 1000
        werte["Bogen am Ballen: Abweichung der Sohle vorn von starr (mm)"] = self.t_rest * 1000
        return werte

    def fuss_ziel(self, sohle: list[Vector]) -> Vector:
        rig = self.rig
        return rig.welt(Vector((self.rig.kopf["foot.L"].x, self.kante_y, self.kante_z + 0.05)))


class WadenhebenSitzend(WadenhebenStehend):
    """Wadenheben sitzend an der Maschine, Familie „Beine isoliert“ (D-514), nach dem Ausführungstext der App (ExRx „Lever
    Seated Calf Raise“) und den Werten der Familie. Sitzend auf dem Sitz ohne Lehne (`geraete.wadenmaschine_sitzend`),
    der Rumpf `VOR` Grad vorgeneigt; die Oberschenkel etwa waagrecht unter dem Kniepolster, einer Rolle quer über den
    unteren Oberschenkeln `POLSTER_HINTER` hinter den Kniegelenken; die Vorfüße auf dem Block, die Ballen über seiner
    hinteren Kante, die Fersen frei; die Hände an den Griffen an den Enden des Polsters. Das Sprunggelenk geht wie beim
    Wadenheben stehend von `DORSAL` gebeugt bis `PLANTAR` gestreckt; die Hüftgelenke bleiben fest, Knie und Polster heben
    sich mit den Fersen, der Hebel dreht um seine Achse an der Säule vor dem Block. Der Sitz liegt in der höchsten Stellung
    `TIEF` unter dem Gesäß; weiter unten drücken die Oberschenkel ihn weiter ein. Zurück derselbe Weg."""

    name = "wadenheben_sitzend"
    titel = "Wadenheben sitzend"
    kamera = {"richtung": 80.0, "neigung": 10.0, "fuellen": 0.02}
    VOR = 6.0  # Rumpf vorgeneigt, Grad
    BLOCK = 0.12
    TIEF = 0.004
    # Bewegungsweite (D-516): Bei gebeugtem Knie steht der Unterschenkel anders zum Fuß als im Stand; für dieselbe Tiefe
    # der Fersen (5,4 cm unter dem Block) 20° statt 18°. Oben berührt das Polster am Kragen die Socke hier schon bei 31°
    # (34°: 0,6 mm darin; die Innenseite des Kragens erst ab etwa 36°), daher 29° (0,2 mm darüber)
    DORSAL = 20.0
    PLANTAR = 29.0
    # Vorderkante des Sitzes so weit vor den Hüftgelenken, m: Weiter vorn heben sich die Oberschenkel mit den Knien vom
    # Sitz (unten drücken sie ihn ein)
    SITZ_VOR = 0.06
    # Mitte des Kniepolsters so weit hinter den Kniegelenken (längs des Oberschenkels), m: auf der Haut vor dem Saum der
    # Shorts (er beginnt im Sitzen 14 cm hinter den Kniegelenken und steht dort bis 6,4 cm über der Haut)
    POLSTER_HINTER = 0.075
    POLSTER_TIEF = 0.002  # Kniepolster so tief in der Haut, m
    GRIFF_X = 0.27  # Mitte der Griffe so weit von der Mitte, m (das Polster ist 40 cm lang)
    # Griffe in Verlängerung der Rolle, vom Zeigefinger zum kleinen Finger nach außen (linke Seite); gesucht unter zwölf
    # Richtungen und drei Ellbogenrichtungen: längs nach hinten knickte das Handgelenk über 15°, so 6°
    GRIFF_ACHSE = (1.0, 0.0, 0.0)
    GRIFF_LAGE = 0.6
    STRECKUNG = 0.0
    POL = (0.9, 0.0, -0.4)  # Ellbogen nach außen und unten (linke Seite)
    griff_ansichten = (("waden_hand", 95.0, 20.0), ("waden_hand_vorn", 20.0, 30.0))

    def rahmen_objekte(self) -> list:
        if self.geraet is None:
            return []
        return [self.geraet["sitz"], self.geraet["kniepolster"], *self.geraet["griffe"].values()]

    def polster_objekte(self) -> list:
        return self.geraet["polster"] if self.geraet else []

    def auflage(self) -> list:
        return auflage_objekte(self.koerper, "Shirt", "Shorts")

    def stange_achse(self):
        m, k = self._griff_lage("L", self.dreh_jetzt)
        return self.rig.welt(m), k, geraete.WADE_SITZEND["griff_d"] / 2

    def bauen(self) -> None:
        super().bauen()
        k = self.rig.kopf
        ruhe = [v.co for v in self.koerper.data.vertices]
        namen = {g.index: g.name for g in self.koerper.vertex_groups}

        def gruppe(*anfaenge: str) -> list[int]:
            return [v.index for v in self.koerper.data.vertices
                    if sum(g.weight for g in v.groups if namen[g.group].startswith(anfaenge)) > 0.5]

        huefte = k["upperleg01.L"].z
        self.gesaess_i = [i for i, q in enumerate(ruhe) if abs(q.x) < 0.17 and huefte - 0.12 < q.z < huefte + 0.06 and q.y > 0.02]
        self.schenkel_i = gruppe("upperleg")
        self.unterschenkel_i = gruppe("lowerleg")
        self.R = achse_winkel(X, self.VOR)
        self.verschiebung = Vector()
        self.dreh_jetzt = 0.0

    def _becken(self) -> Matrix:
        return starr(self.H0, self.H0 + self.verschiebung, self.R)

    def _huefte(self, s: str) -> Vector:
        return self._becken() @ self.rig.kopf["upperleg01." + s]

    def _bein_lage(self, beta: float) -> tuple[Vector, dict, dict]:
        from rig import zwei_glieder

        A = {s: self._knoechel(s, beta) for s in "LR"}
        K = {s: zwei_glieder(self._huefte(s), A[s], self.l1, self.l2, Vector((0.0, -0.5, 1.0)))[0] for s in "LR"}
        return self.verschiebung, A, K

    def _schenkel_rahmen(self, s: str, K: Vector) -> Matrix:
        """Rahmen des Oberschenkels (Raum des Skeletts): Spalten längs zum Knie, nach oben, quer; Ursprung im Hüftgelenk."""
        H = self._huefte(s)
        d = (K - H).normalized()
        n = senkrecht(Z, d)
        e = d.cross(n)
        M = Matrix((d, n, e)).transposed().to_4x4()
        M.translation = H
        return M

    def _stellen(self, p: float) -> tuple[float, dict, dict]:
        beta = self._beta(p)
        _, A, K = self._bein_lage(beta)
        rig = self.rig
        rig.zuruecksetzen()
        rig.setze("root", self._becken())
        for s in "LR":
            rig.bein(s, A[s], Vector((0.0, -0.5, 1.0)), 0.0, fuss_ebene=achse_winkel(X, beta))
        rig.anwenden()
        return beta, A, K

    def _loesen(self) -> None:
        """Bogen am Ballen; Becken so, dass bei flachem Fuß der Oberschenkel waagrecht und der Unterschenkel wie im Stand
        steht und die Sohle auf dem Block liegt; Sitz (in der höchsten Stellung), Kniepolster (im Ausgang), Griffe und
        Hebel; dann die Maschine."""
        rig = self.rig
        k = rig.kopf
        self._fuss_tabelle()
        K0 = k["lowerleg01.L"]
        for _ in range(3):
            K_null = self._huefte("L") + Vector((0.0, -self.l1, 0.0))
            self.hoch = K_null - K0
            self.kante_y = self.bogen_mitte.y + self.hoch.y + self.KANTE
            self.kante_z = self.sohle_z0 + self.hoch.z
            dz = self.BLOCK - rig.welt(Vector((0.0, 0.0, self.kante_z))).z
            self.verschiebung = self.verschiebung + Vector((0.0, 0.0, dz))
        self.geloest = True
        w = geraete.WADE_SITZEND
        sb, sl, sd = w["sitz"]
        # Sitz: höchste Stellung (Knie oben)
        self._stellen(1.0)
        netz = [rig.lokal(q) for q in _netz(self.koerper)]
        kleid = [rig.lokal(q) for q in self._punkte("Shirt", "Saumband", "Shorts")]
        H = (self._huefte("L") + self._huefte("R")) / 2
        unten = [netz[i] for i in self.gesaess_i + self.schenkel_i] + kleid
        vorn_y = H.y - self.SITZ_VOR
        auf = [q for q in unten if abs(q.x) < sb / 2 and vorn_y < q.y < vorn_y + sl and q.z < H.z]
        sitz_z = min(q.z for q in auf) + self.TIEF
        self.sitz = Vector((0.0, vorn_y + sl / 2, sitz_z))
        # Kniepolster im Ausgang: Rolle quer, `POLSTER_TIEF` in der Haut der Oberschenkel
        _, _, K = self._stellen(0.0)
        netz = [rig.lokal(q) for q in _netz(self.koerper)]
        r = w["polster_d"] / 2 - self.POLSTER_TIEF
        y_c = (K["L"].y + K["R"].y) / 2 + self.POLSTER_HINTER
        hoch = -1.0
        for q in [netz[i] for i in self.schenkel_i]:
            dy = q.y - y_c
            if abs(dy) < r and abs(q.x) < w["polster_l"] / 2:
                hoch = max(hoch, q.z + math.sqrt(r * r - dy * dy))
        self.polster0 = Vector((0.0, y_c, hoch))
        self.polster_rel = {s: self._schenkel_rahmen(s, K[s]).inverted() @ self.polster0 for s in "LR"}
        # Achse des Hebels an der Säule vor dem Block, so hoch, dass das Polster am Anfang in die Richtung läuft, in die die
        # Oberschenkel es tragen (Mittel bis zur höchsten Stellung): es gleitet so am wenigsten
        saeule_y = self.kante_y - w["block"][1] - 0.10
        _, _, K1 = self._stellen(1.0)
        weg = sum(((self._schenkel_rahmen(s, K1[s]) @ self.polster_rel[s]) - self.polster0 for s in "LR"), Vector()) / 2
        weg.x = 0.0
        quer = Vector((0.0, -weg.z, weg.y)).normalized()
        if quer.y > 0:
            quer = -quer
        rho = (saeule_y + 0.02 - self.polster0.y) / quer.y
        self.achse = Vector((-w["hebel_x"], 0.0, 0.0)) + Vector((0.0, self.polster0.y, self.polster0.z)) + quer * rho
        g0, g1, g2 = self.GRIFF_ACHSE
        self.griff0 = {s: (self.polster0 + Vector((sx * self.GRIFF_X * self.mass, 0.0, 0.0)), Vector((sx * g0, g1, g2)).normalized())
                       for s, sx in (("L", 1), ("R", -1))}
        rig.zuruecksetzen()
        self.geraet = geraete.wadenmaschine_sitzend(rig.welt(self.sitz), self.BLOCK, rig.welt(Vector((0.0, self.kante_y, 0.0))).y,
                                                    rig.welt(self.achse), rig.welt(self.polster0),
                                                    {s: (rig.welt(m), kk) for s, (m, kk) in self.griff0.items()})
        self.polster_ruhe = {o.name: geraete.weiches_polster(o) for o in self.polster_objekte()}
        # Sitz längs seiner Normale so, dass die tiefste Stelle von Haut und Kleidung in der höchsten Stellung `TIEF` darin
        # liegt
        self._stellen(1.0)
        punkte = SchulterdrueckenMaschine._auflage_punkte(self)
        sitz = self.geraet["sitz"]
        n_welt = (sitz.matrix_world.to_3x3() @ Z).normalized()
        sitz.matrix_world = Matrix.Translation(n_welt * (self.TIEF - SchulterdrueckenMaschine._tiefe(sitz, punkte))) @ sitz.matrix_world
        rig.zuruecksetzen()
        self.griff = {s: rig.griff(s, self.GRIFF_LAGE, w["griff_d"] / 2) for s in "LR"}

    _punkte = Beinstrecker._punkte

    def setzen(self, p: float) -> None:
        if not self.geloest:
            self._loesen()
        Uebung.setzen(self, p)
        self.delle = geraete.eindruecken(self.polster_objekte(), self.polster_ruhe, self.auflage())

    def _hebel(self, K: dict) -> tuple[float, float]:
        """Drehung des Hebels (Grad), mit der das Polster den Oberschenkeln folgt (Mittel beider Seiten), und wie weit es
        dabei längs der Oberschenkel gleitet (mm)."""
        P = self.achse
        ideal = sum((self._schenkel_rahmen(s, K[s]) @ self.polster_rel[s] for s in "LR"), Vector()) / 2
        r0 = Vector((0.0, self.polster0.y - P.y, self.polster0.z - P.z))
        r1 = Vector((0.0, ideal.y - P.y, ideal.z - P.z))
        d = math.degrees(math.atan2(r0.cross(r1).x, r0.dot(r1)))
        wirklich = P + achse_winkel(X, d) @ (self.polster0 - P)
        ideal.x = wirklich.x
        return d, (ideal - wirklich).length * 1000

    def _griff_lage(self, s: str, dreh: float) -> tuple[Vector, Vector]:
        """Mitte und Achse eines Griffs (Raum des Skeletts) bei der Drehung des Hebels."""
        m, k = self.griff0[s]
        D = achse_winkel(X, dreh)
        return self.achse + D @ (m - self.achse), D @ k

    def haltung(self, p: float) -> None:
        rig = self.rig
        k = rig.kopf
        beta = self._beta(p)
        self.beta_jetzt = beta
        _, A, K = self._bein_lage(beta)
        rig.setze("root", self._becken())
        Rb = achse_winkel(X, beta)
        beine = {s: rig.bein(s, A[s], Vector((0.0, -0.5, 1.0)), 0.0, fuss_ebene=Rb) for s in "LR"}
        dreh, gleiten = self._hebel({s: beine[s]["knie"] for s in "LR"})
        self.dreh_jetzt = dreh
        g = self.geraet
        P = rig.welt(self.achse)
        g["hebel"].matrix_world = Matrix.Translation(P) @ achse_winkel(X, dreh).to_4x4() @ Matrix.Translation(-P) @ g["hebel0"]
        weg = geraete.WADE_SITZEND["nocke_r"] * math.radians(abs(dreh))
        g["block"].matrix_world = Matrix.Translation(Vector((0, 0, weg))) @ g["block0"]
        arme = {}
        for s, sx in (("L", 1), ("R", -1)):
            m, kk = self._griff_lage(s, dreh)
            pol = Vector((sx * self.POL[0], self.POL[1], self.POL[2])).normalized()
            arme[s] = rig.arm(s, self.griff[s], m, kk, pol, self.STRECKUNG)
        L, Ar = beine["L"], arme["L"]
        rumpf = (rig.punkt("neck01", k["neck01"]) - rig.punkt("spine05", k["spine05"])).normalized()
        oberschenkel = (L["knie"] - L["huefte"]).normalized()
        self.werte = {
            "Sprunggelenk (Grad, + gebeugt, − gestreckt)": self._sprung(beta, A["L"], K["L"]),
            "Fuß geneigt (Grad, + Ferse hoch)": beta,
            "Schuh am Ballen gebogen (Grad)": max(beta, 0.0),
            "Kniewinkel (Grad)": self.kniewinkel(L),
            "Hüftwinkel (Grad)": math.degrees(oberschenkel.angle(rumpf)),
            "Oberschenkel zur Waagrechten (Grad, + Knie höher)": math.degrees(math.asin(max(-1.0, min(1.0, oberschenkel.z)))),
            "Hebel gedreht (Grad)": dreh,
            "Kniepolster: gleiten längs des Oberschenkels (mm)": gleiten,
            "Ellbogenwinkel": Ar["ellbogenwinkel"],
            "Handgelenk gesamt (Grad)": Ar["handgelenk_gesamt"],
            "Handgelenk gestreckt (Grad)": Ar["handgelenk_streckung"],
            "Handgelenk seitlich (Grad, + zum Daumen)": Ar["handgelenk_seitlich"],
        }

    def zusatzwerte(self) -> dict:
        rig = self.rig
        top = rig.welt(Vector((0.0, 0.0, self.kante_z))).z
        werte = self._block_werte(top, rig.welt(Vector((0.0, self.kante_y, 0.0))).y)
        g = self.geraet
        punkte = SchulterdrueckenMaschine._auflage_punkte(self)
        werte["Gesäß im Sitz (mm)"] = SchulterdrueckenMaschine._tiefe(g["sitz"], punkte) * 1000
        werte["Polster: tiefste Delle (mm)"] = self.delle * 1000
        werte["Polster: Haut oder Kleidung durch die Oberfläche (mm)"] = geraete.durch_polster(self.polster_objekte(), self.auflage()) * 1000
        netz = _netz(self.koerper)
        M = g["kniepolster"].matrix_world
        c, ax = M.translation.copy(), (M.to_3x3() @ Vector((0, 0, 1))).normalized()
        w = geraete.WADE_SITZEND
        r, halb = w["polster_d"] / 2, w["polster_l"] / 2

        def zum_polster(pkte) -> float:
            beste = 1.0
            for q in pkte:
                v = q - c
                t = v.dot(ax)
                if abs(t) <= halb:
                    beste = min(beste, (v - ax * t).length - r)
            return beste

        werte["Kniepolster: Haut und Shorts (mm, negativ = eingedrückt)"] = zum_polster([netz[i] for i in self.schenkel_i] + self._punkte("Shorts")) * 1000
        return werte

    def nah_punkte(self) -> list[Vector]:
        rig = self.rig
        hand = rig.welt(rig.punkt("wrist.L", rig.kopf["metacarpal2.L"]))
        m, k = self._griff_lage("L", self.dreh_jetzt)
        halb = geraete.WADE_SITZEND["griff_l"] / 2
        m = rig.welt(m)
        return [q for q in _netz(self.koerper) if (q - hand).length < 0.10] + [m + k * halb, m - k * halb]


# ---------------------------------------------------------------------- Familie „Arme beugen und strecken“ (D-515)


class Bizepscurl(Seitheben):
    """Bizepscurls mit Kurzhanteln, stehend (Familie „Arme beugen und strecken“, D-515), nach dem Ausführungstext der App
    (ExRx „Dumbbell Curl“). Stand wie beim Seitheben, der Rumpf aufrecht (`NEIGUNG`), die Knie leicht gebeugt. Je Hand
    eine Kurzhantel (`geraete.KH8`), die Hanteln hängen an den Seiten, die Handflächen zum Körper (Daumen vorn); der
    Oberarm so weit zur Seite, dass die Köpfe `LUFT` vor Oberschenkeln und Shorts bleiben (`_ausgang`). Beide Arme
    beugen gleichzeitig (der Text erlaubt beides): der Ellbogen von `ELLBOGEN_UNTEN` bis `ELLBOGEN_OBEN`, der Oberarm geht
    dabei bis `VOR` nach vorn („Der Ellbogen darf oben leicht nach vorn gehen“), der Unterarm dreht nach außen
    (`DREHUNG`), bis die Handfläche oben zur Schulter zeigt. Abwärts derselbe Weg."""

    name = "bizepscurl_kh"
    titel = "Bizepscurls mit Kurzhanteln"
    kamera = {"richtung": 30.0, "neigung": 8.0}
    vorschau_phase = 1.0
    NEIGUNG = 0.0
    KNIE = 172.0
    # „bis der Arm gestreckt ist“, nicht durchgedrückt: Mit 168° fand die Hand den Griff unten nicht (6,8 mm daneben), im
    # dritten Bild sprang der Arm auf 178°; mit 165° liegt die Hand in jedem Bild am Ziel (höchstens 0,2 mm)
    ELLBOGEN_UNTEN = 165.0
    ELLBOGEN_OBEN = 40.0  # Familie: 130 bis 145° gebeugt
    VOR = 25.0  # Oberarm oben so weit vor der Senkrechten, Grad
    DREHUNG = 90.0  # Unterarm oben so weit nach außen gedreht (Handfläche zur Schulter), Grad
    LUFT = 0.012  # Köpfe der Hanteln unten mindestens so weit vor Haut, Shorts und Shirt, m
    griff_ansichten = (("griff_vorn", 15.0, 10.0), ("griff_seite", 100.0, 20.0))

    def bauen(self) -> None:
        super().bauen()
        self.seite_grad = 6.0  # Oberarm zur Seite, Grad; `_ausgang` sucht ihn

    def _curl_rahmen(self, s: str, p: float) -> tuple[Vector, Vector, Vector, Vector, Vector]:
        """Oberarm `u`, Unterarm `f`, Beugerichtung `b`, Griffachse `k` (Zeigefinger → kleiner Finger) und Handfläche `n`
        in Phase p (Raum des Skeletts, Blick nach −y)."""
        sx = 1 if s == "L" else -1
        a = math.radians(self.seite_grad)
        u = achse_winkel(X, -self.VOR * p) @ Vector((sx * math.sin(a), 0.0, -math.cos(a)))
        b = senkrecht(-Y, u)
        beta = math.radians(180.0 - (self.ELLBOGEN_UNTEN + (self.ELLBOGEN_OBEN - self.ELLBOGEN_UNTEN) * p))
        f = (u * math.cos(beta) + b * math.sin(beta)).normalized()
        achse = u.cross(b).normalized()
        k = senkrecht(achse_winkel(achse, math.degrees(beta)) @ senkrecht(Y, u), f)
        if self.DREHUNG:
            k = achse_winkel(f, -sx * self.DREHUNG * p) @ k
        n = (k.cross(f) * sx).normalized()
        return u, f, b, k, n

    def _curl_arm(self, s: str, p: float) -> dict:
        """Arm `s` in Phase p: Handgelenk aus Ober- und Unterarm, die Mitte des Griffs so, dass das Handgelenk dort liegt
        (wie beim Seitheben nachgeführt); Hantel an den Griff."""
        rig = self.rig
        u, f, b, k, n = self._curl_rahmen(s, p)
        S = rig.punkt("shoulder01." + s, rig.kopf["upperarm01." + s])
        l1, l2 = self.armlaengen
        W = S + u * l1 + f * l2
        versatz = f * 0.07 + n * 0.025
        # Ellbogen nach unten und etwas nach hinten: oben läuft die Linie Schulter → Hand nach vorn, „nach hinten“ allein
        # stünde längs dieser Linie und ließe den Ellbogen zur Seite fallen
        pol = Vector((0.0, 0.3, -1.0)).normalized()
        # Drehung der Hand um den Griff einmal frei gesucht (am Griff in der Verlängerung des Unterarms), dann fest: Beim
        # Nachführen des Griffs sprang die freie Suche nahe der Streckung in eine zweite, fast gleich gute Lösung (Ellbogen
        # 178° in einem Bild, D-515)
        phi = None
        for _ in range(20):
            mitte = W + versatz
            arm = rig.arm(s, self.griff[s], mitte, k, pol, 0.0, phi=phi)
            phi = arm["phi"]
            fehler = W - arm["handgelenk"]
            if fehler.length < 2e-4:
                break
            versatz = versatz + fehler
        self.rest = fehler.length
        self.hantel_setzen(s, mitte, k, f)
        arm.update({"mitte": mitte, "u": u, "f": f, "k": k})
        return arm

    def _ausgang(self) -> None:
        """Oberarm zur Seite per Halbierung, bis die Köpfe der Hanteln unten `LUFT` vor Haut, Shorts und Shirt bleiben."""
        rig = self.rig
        lo, hi = 0.0, 25.0
        for _ in range(12):
            self.seite_grad = (lo + hi) / 2
            rig.zuruecksetzen()
            self._stand(0.0)
            for s in "LR":
                self._curl_arm(s, 0.0)
            rig.anwenden()
            if self._koepfe_frei() < self.LUFT:
                lo = self.seite_grad
            else:
                hi = self.seite_grad
        self.seite_grad = hi
        rig.zuruecksetzen()

    def setzen(self, p: float) -> None:
        if not self.geloest:
            self.geloest = True
            self._ausgang()
        Uebung.setzen(self, p)

    def _stand(self, p: float) -> dict:
        rig = self.rig
        rig.setze("root", self.becken)
        return {s: rig.bein(s, self.knoechel[s], self.zehen[s], self.ZEHEN) for s in "LR"}

    def haltung(self, p: float) -> None:
        rig = self.rig
        beine = self._stand(p)
        arme = {s: self._curl_arm(s, p) for s in "LR"}
        A = arme["L"]
        S, E, W = A["schulter"], A["ellbogen"], A["handgelenk"]
        u, f = (E - S).normalized(), (W - E).normalized()
        self.werte = {
            "Ellbogenwinkel": A["ellbogenwinkel"],
            "Oberarm vor der Senkrechten (Grad)": math.degrees(math.atan2(-u.y, -u.z)),
            "Oberarm zur Seite (Grad)": math.degrees(math.asin(max(-1.0, min(1.0, u.x)))),
            "Unterarm zur Senkrechten (Grad, 0 = nach oben)": math.degrees(f.angle(Z)),
            "Unterarm gedreht (Grad)": A["pronation"],
            "Handgelenk gesamt (Grad)": A["handgelenk_gesamt"],
            "Handgelenk gestreckt (Grad)": A["handgelenk_streckung"],
            "Handgelenk seitlich (Grad, + zum Daumen)": A["handgelenk_seitlich"],
            "Kniewinkel (Grad)": self.kniewinkel(beine["L"]),
            "Griffe auseinander (cm)": (arme["L"]["mitte"] - arme["R"]["mitte"]).length * 100,
            "Handgelenk am Ziel (mm)": self.rest * 1000,
        }


class Hammercurl(Bizepscurl):
    """Hammercurls mit Kurzhanteln (Familie „Arme beugen und strecken“, D-515), nach dem Ausführungstext der App: wie
    die Bizepscurls, aber im neutralen Griff über den ganzen Weg (`DREHUNG` 0): Die Daumen zeigen unten nach vorn und oben
    zur Schulter."""

    name = "hammercurl_kh"
    titel = "Hammercurls"
    DREHUNG = 0.0

class Trizepsdruecken(Uebung):
    """Trizepsdrücken am Kabel, stehend (Familie „Arme beugen und strecken“, D-515), nach dem Ausführungstext der App
    (ExRx „Cable Pushdown“). Vor dem Kabelzug mit oberer Rolle (`geraete.kabelzug_oben`), Stand etwa hüftbreit, Knie
    leicht gebeugt, Oberkörper `NEIGUNG` vor. Hände eng im Obergriff an der kurzen geraden Stange (`GRIFF_X`), die
    Ellbogen seitlich am Körper. Ausgang oben: der Unterarm nahe am Oberarm (`ELLBOGEN_OBEN`), der Oberarm `VOR_OBEN`
    vor dem Rumpf („Oben darf der Ellbogen etwas nach oben wandern“); die Arme strecken nach unten, bis sie gestreckt
    sind (`ELLBOGEN_UNTEN`), der Oberarm kommt dabei an den Rumpf zurück. Das Kabel läuft von der Rolle über der Stange
    zu ihr hinab; der Gewichtsblock hebt sich, wenn die Stange sinkt. Zurück derselbe Weg."""

    name = "trizepsdruecken_kabel"
    titel = "Trizepsdrücken am Kabel"
    kamera = {"richtung": 75.0, "neigung": 8.0, "fuellen": 0.02}
    vorschau_phase = 1.0
    FUESSE = 0.105  # halber Abstand der Fußgelenke vor dem Maß der Schultern, m: etwa hüftbreit
    ZEHEN = 8.0
    KNIE = 168.0
    NEIGUNG = 10.0  # Oberkörper in der Hüfte vor, Grad
    ELLBOGEN_OBEN = 50.0  # Ausgang: „bis der Unterarm nahe am Oberarm ist“
    # „bis sie ganz gestreckt sind“, nicht durchgedrückt; das Ziel der Hand liegt dann etwas weiter innen als der Arm,
    # der Ellbogen öffnet sich dadurch noch etwas weiter (mit 172° war das Handgelenk nicht mehr zu erreichen)
    ELLBOGEN_UNTEN = 164.0
    VOR_OBEN = 12.0  # Oberarm im Ausgang so weit vor dem Rumpf, Grad
    GRIFF_X = 0.10  # Mitte der Hände so weit von der Mitte (vor dem Maß der Schultern), m: eng
    GRIFF_LAGE = 0.62
    SCHRAEG = 0.0
    STRECKUNG = 0.0
    HAND = 0.07  # Mitte des Griffs vom Handgelenk längs des Unterarms, m
    ROLLE_Z = 2.05  # Unterkante der Rolle über dem Boden, m
    SAEULE_VOR = 0.30  # Säulen so weit vor der Rolle, m
    # Hände an der Stange schräg von vorn und von hinten (von vorn stehen oben Säule und Gewichtsblock davor)
    griff_ansichten = (("stange_schraeg", 60.0, 15.0), ("stange_hinten", 135.0, 30.0))

    def rahmen_objekte(self) -> list:
        return [self.geraet["stange"], *self.geraet["stange"].children]

    def stange_achse(self):
        return self.stange_mitte.copy(), Vector((1.0, 0.0, 0.0)), geraete.KABELZUG["stange_d"] / 2

    def bauen(self) -> None:
        super().bauen()
        rig = self.rig
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
        self.becken = Seitheben._becken_suchen(self)
        self.griff = {s: rig.griff(s, self.GRIFF_LAGE, geraete.KABELZUG["stange_d"] / 2, schraeg=self.SCHRAEG) for s in "LR"}
        # Bahn der Stange (Raum des Skeletts) und Maschine
        self.bahn = [self._griffe(p) for p in (0.0, 0.25, 0.5, 0.75, 1.0)]
        mitte_y = sum(rig.welt(g["mitte"]).y for g in self.bahn) / len(self.bahn)
        rolle = Vector((0.0, mitte_y - 0.02, self.ROLLE_Z))
        self.stange0 = rig.welt(self.bahn[0]["mitte"])
        self.geraet = geraete.kabelzug_oben(rolle, self.stange0, rolle.y - self.SAEULE_VOR)
        self.L0 = (rolle - self._haken(self.stange0)).length
        self.stange_mitte = self.stange0.copy()

    _becken = Seitheben._becken

    def _haken(self, mitte: Vector) -> Vector:
        k = geraete.KABELZUG
        return mitte + Vector((0, 0, k["stange_d"] / 2 + k["haken"]))

    def _rumpf(self) -> tuple[Vector, Vector]:
        """Richtung des Rumpfs nach unten und nach vorn (Raum des Skeletts), nach der Neigung."""
        R = achse_winkel(X, self.NEIGUNG)
        return R @ Vector((0, 0, -1.0)), R @ Vector((0, -1.0, 0))

    def _griffe(self, p: float) -> dict:
        """Ziele der Hände in Phase p (Raum des Skeletts): Oberarm senkrecht, im Ausgang `VOR_OBEN` vor (längs des
        vorgeneigten Rumpfs lagen die Hände unten in den Oberschenkeln); Unterarm
        um den Ellbogenwinkel nach vorn oben; die Hände `GRIFF_X` von der Mitte. Gibt Mitte der Stange und die Ziele je
        Seite zurück."""
        rig = self.rig
        rig.zuruecksetzen()
        rig.setze("root", self.becken)
        unten, vor = Vector((0, 0, -1.0)), Vector((0, -1.0, 0))
        l1, l2 = self.armlaengen
        ziele = {}
        for s, sx in (("L", 1), ("R", -1)):
            S = rig.punkt("shoulder01." + s, rig.kopf["upperarm01." + s])
            a = math.radians(self.VOR_OBEN * (1 - p))
            u = (unten * math.cos(a) + vor * math.sin(a)).normalized()
            b = senkrecht(vor, u)
            beta = math.radians(180.0 - (self.ELLBOGEN_OBEN + (self.ELLBOGEN_UNTEN - self.ELLBOGEN_OBEN) * p))
            f = (u * math.cos(beta) + b * math.sin(beta)).normalized()
            G = S + u * l1 + f * (l2 + self.HAND)
            G.x = sx * self.GRIFF_X * self.mass
            ziele[s] = G
        rig.zuruecksetzen()
        return {"mitte": (ziele["L"] + ziele["R"]) / 2, "ziele": ziele}

    def haltung(self, p: float) -> None:
        rig = self.rig
        g = self._griffe(p)  # zuerst: `_griffe` setzt das Rig zurück (danach standen die Beine in der Grundhaltung, 14 mm im Boden)
        rig.setze("root", self.becken)
        beine = {s: rig.bein(s, self.knoechel[s], self.zehen[s], self.ZEHEN) for s in "LR"}
        arme = {}
        for s, sx in (("L", 1), ("R", -1)):
            arme[s] = rig.arm(s, self.griff[s], g["ziele"][s], Vector((sx, 0.0, 0.0)), Vector((sx * 0.3, 0.4, -1.0)).normalized(),
                              self.STRECKUNG)
        mitte = rig.welt(g["mitte"])
        self.stange_mitte = mitte
        self.geraet["stange"].matrix_world = Matrix.Translation(mitte)
        rolle = self.geraet["rolle"]
        haken = self._haken(mitte)
        geraete.kabel("Kabel-Zug", rolle, haken)
        hub = (rolle - haken).length - self.L0
        self.geraet["block"].matrix_world = Matrix.Translation(Vector((0, 0, hub))) @ self.geraet["block0"]
        A = arme["L"]
        S, E, W = A["schulter"], A["ellbogen"], A["handgelenk"]
        unten, vor = self._rumpf()
        ober = (E - S).normalized()
        kabel = (rolle - haken).normalized()
        self.werte = {
            "Ellbogenwinkel": A["ellbogenwinkel"],
            "Oberarm vor dem Rumpf (Grad)": math.degrees(math.atan2(ober.dot(vor), ober.dot(unten))),
            "Ellbogen zur Mitte (cm, gegenüber dem Schultergelenk)": (S.x - E.x) * 100,
            "Unterarm zur Senkrechten (Grad, 0 = nach unten)": math.degrees((W - E).angle(-Z)),
            "Handgelenk gesamt (Grad)": A["handgelenk_gesamt"],
            "Handgelenk gestreckt (Grad)": A["handgelenk_streckung"],
            "Handgelenk seitlich (Grad, + zum Daumen)": A["handgelenk_seitlich"],
            "Hände auseinander (cm)": (rig.welt(g["ziele"]["L"]) - rig.welt(g["ziele"]["R"])).length * 100,
            "Kabel zur Senkrechten (Grad)": math.degrees(kabel.angle(Z)),
            "Gewichtsblock gehoben (cm)": hub * 100,
            "Kniewinkel (Grad)": self.kniewinkel(beine["L"]),
            "Rumpfneigung (Grad)": self.NEIGUNG,
        }

    def zusatzwerte(self) -> dict:
        """Stange zum Körper und zur Kleidung (mm), Abstand der Ellbogen zum Rumpf (mm)."""
        from mathutils.bvhtree import BVHTree

        import schuhe

        netz = _netz(self.koerper)
        namen = {g.index: g.name for g in self.koerper.vertex_groups}

        def gruppe(v, *anfang) -> bool:
            return sum(x.weight for x in v.groups if namen[x.group].startswith(anfang)) > 0.5

        verts = self.koerper.data.vertices
        rumpf = [q for v, q in zip(verts, netz) if gruppe(v, "spine", "chest", "breast", "pectoral", "pelvis", "clavicle")]
        arme = [q for v, q in zip(verts, netz) if gruppe(v, "upperarm", "lowerarm") and not gruppe(v, "wrist")]
        kd = __import__("mathutils").kdtree.KDTree(len(rumpf))
        for i, q in enumerate(rumpf):
            kd.insert(q, i)
        kd.balance()
        ellbogen = rig_e = self.rig.welt(self.rig.punkt("lowerarm01.L", self.rig.kopf["lowerarm01.L"]))
        nah = [q for q in arme if (q - ellbogen).length < 0.06]
        am_rumpf = min(kd.find(q)[2] for q in nah) if nah else float("nan")
        # Stange: Punkte auf ihrer Oberfläche zu Haut, Shorts und Shirt
        M = self.stange_mitte
        l, d = geraete.KABELZUG["stange_l"], geraete.KABELZUG["stange_d"]
        stange = [M + Vector((t, math.cos(w) * d / 2, math.sin(w) * d / 2)) for t in [l * (i / 20 - 0.5) for i in range(21)]
                  for w in [j * math.pi / 6 for j in range(12)]]
        beste = 1.0
        for name in ("Shorts", "Shirt"):
            obj = bpy.data.objects.get(name)
            if obj is None:
                continue
            pk, pf, _ = schuhe._verformt(obj)
            bvh = BVHTree.FromPolygons(pk, pf)
            for q in stange:
                ort, n, _, dd = bvh.find_nearest(q, 0.2)
                if ort is not None:
                    beste = min(beste, dd if (q - ort).dot(n) >= 0 else -dd)
        haut = abstand_koerper(self.koerper, stange)
        return {"Ellbogen am Rumpf (mm, Haut zu Haut)": am_rumpf * 1000,
                "Stange zur Kleidung (mm)": beste * 1000, "Stange zur Haut (mm)": haut * 1000}

# ---------------------------------------------------------------------- Familie „Waagrechtes Ziehen“ für Dali’s PPLC (D-518)


class RudernLanghantel(RumaenischesKreuzhebenKH):
    """Rudern mit Langhantel, vorgebeugt (Familie „Waagrechtes Ziehen“, D-518), nach dem Ausführungstext der App (ExRx
    „Barbell Bent-over Row“) und den Werten der Familie (Vorbeuge-Rudern: Rumpf fest 30 bis 60° zur Waagrechten, Knie 15
    bis 25°; Ellbogen bis 90 bis 110° gebeugt, 15 bis 30° hinter dem Rumpf; Schulterblätter zusammen). Die Haltung kommt
    aus der Hüftbeuge (`RumaenischesKreuzhebenKH`, D-490): Stand etwa hüftbreit, die Knie `KNIE`, der Rumpf mit geradem
    Rücken `NEIGUNG` vor der Senkrechten, die Hüfte so weit hinten, dass der gemeinsame Schwerpunkt mit der Stange über
    der Fußmitte steht (für die hängende Stange gesucht, dann fest: Rumpf und Beine bewegen sich nicht). Kopf in
    Verlängerung des Rumpfs. Die Langhantel (`SCHEIBEN`) breit im Obergriff (`GRIFF_X`). Ausgang: die Arme hängen fast
    gestreckt (`ELLBOGEN`) senkrecht unter den Schultern, die Schlüsselbeine etwas nach vorn (`SCHULTER_VOR`). Die
    Stange kommt auf einer Geraden zum oberen Bauch (`BAUCH`, `LUFT_BAUCH` vor dem Shirt), die Ellbogen gehen nach oben
    und hinten, die Schulterblätter zusammen (`SCHULTER_ZURUECK`). Zurück derselbe Weg."""

    name = "rudern_langhantel"
    titel = "Rudern mit Langhantel, vorgebeugt"
    # Schräg von vorn (verglichen mit 30°, 45°, 60° und 75°/90°): Ab 60° verdeckt die nahe Scheibe Beine und Rumpf, bei
    # 75° und 90° fast den ganzen Körper; bei 45° sieht man die Neigung des Rumpfs, die Arme und die Stange
    kamera = {"richtung": 45.0, "neigung": 8.0}
    vorschau_phase = 1.0
    NEIGUNG = 52.0  # Rumpf vor der Senkrechten, Grad: 38° zur Waagrechten (Familie 30 bis 60°)
    KNIE = 158.0  # 22° gebeugt (Familie 15 bis 25°)
    KINN = 4.0
    GRIFF_X = 0.25  # Mitte der Hand so weit neben der Mitte (vor dem Maß der Schultern), m: breiter als die Schultern
    ELLBOGEN = 170.0  # Ausgang: Arme hängen fast gestreckt
    BAUCH = 0.62  # Ziel am oberen Bauch: Anteil auf der Linie von der Mitte der Schultern zur Mitte der Hüften
    LUFT_BAUCH = 0.015  # Stange oben so weit vor dem Shirt, m
    SCHULTER_VOR = -6.0  # Ausgang: Schlüsselbeine nach vorn, Grad
    SCHULTER_ZURUECK = 8.0  # oben: Schlüsselbeine zurück, die Schulterblätter gehen zusammen, Grad
    SCHEIBEN = [(0.45, 0.035)]  # je Seite eine Scheibe, 20 kg
    HANTEL_KG = 30.0  # je Hand die Hälfte von Stange (20 kg) und Scheiben (2 × 20 kg), für den Schwerpunkt
    GRIFF_LAGE = 0.62
    # Stange schräg in der Hand (D-452), wie bei breiten Griffen: ohne knickte das Handgelenk unten 22° zum Daumen; mit 10°
    # unten 11,7°, oben 8,9° zur anderen Seite
    SCHRAEG = 11.0
    POL = (0.45, 0.5, 0.75)  # Ellbogen nach oben, hinten und außen (linke Seite)
    griff_ansichten = (("griff_vorn", 15.0, 10.0), ("griff_seite", 100.0, 20.0))

    def rahmen_objekte(self) -> list:
        return [self.stange]

    def stange_achse(self):
        return self.stange.location.copy(), X, STANGE_R

    def bauen(self) -> None:
        Uebung.bauen(self)
        rig = self.rig
        k = rig.kopf
        self.stange = geraete.langhantel(self.SCHEIBEN)
        self.hanteln = {}
        self.griff = {s: rig.griff(s, self.GRIFF_LAGE, STANGE_R, schraeg=self.SCHRAEG) for s in "LR"}
        A0 = k["foot.L"]
        w = math.radians(self.ZEHEN)
        x = self.FUESSE * self.mass
        self.knoechel = {"L": Vector((x, A0.y, A0.z)), "R": Vector((-x, A0.y, A0.z))}
        self.zehen = {"L": Vector((math.sin(w), -math.cos(w), 0)), "R": Vector((-math.sin(w), -math.cos(w), 0))}
        ferse, spitze = _fuss(self.koerper, k)
        self.fussmitte_y = A0.y - (A0.y - (ferse + spitze) / 2) * math.cos(w)
        self.H0 = (k["upperleg01.L"] + k["upperleg01.R"]) / 2
        self.S0 = (k["upperarm01.L"] + k["upperarm01.R"]) / 2
        l1 = (k["lowerarm01.L"] - k["upperarm01.L"]).length
        l2 = (k["wrist.L"] - k["lowerarm01.L"]).length
        self.armlaengen = (l1, l2)
        self.reichweite = math.sqrt(l1 * l1 + l2 * l2 - 2 * l1 * l2 * math.cos(math.radians(self.ELLBOGEN)))
        self.sigma = 0.0
        self.raender = {}
        self.tabelle = None
        self.stand = None

    def _neigung(self, p: float) -> float:
        return self.NEIGUNG

    def hantel_setzen(self, s: str, mitte: Vector, k: Vector, f: Vector) -> None:
        """Keine Kurzhanteln: Die Stange setzt `haltung`."""

    def _schultern(self, p: float) -> None:
        sch = self.SCHULTER_VOR + (self.SCHULTER_ZURUECK - self.SCHULTER_VOR) * p
        self.rig.dreh("clavicle.L", achse_winkel(Z, sch))
        self.rig.dreh("clavicle.R", achse_winkel(Z, -sch))

    def _loesen(self) -> None:
        """Stand: Hüfte (`dy`) so, dass der Schwerpunkt mit der hängenden Stange über der Fußmitte steht; Höhe (`dz`)
        für den Kniewinkel. Dann die Stange unten (Mitte der Griffe) und oben (vor dem oberen Bauch)."""
        rig = self.rig
        a = self.NEIGUNG
        dy = 0.0
        for _ in range(12):
            dz = self._hoehe(a, dy)
            beine = self._rumpf(a, dy, dz)
            self._schultern(0.0)
            arme = {s: self._arm(s, 0.0) for s in "LR"}
            fehler = self._schwerpunkt(beine, arme).y - self.fussmitte_y
            if abs(fehler) < 0.0005:
                break
            dy -= fehler / 0.8
        self.stand = (dy, dz)
        self.unten = (arme["L"]["mitte"] + arme["R"]["mitte"]) / 2
        # Ziel oben: Punkt auf der Linie Schultern → Hüften (`BAUCH`), von vorn per Strahl auf das Shirt
        rig.anwenden()
        S = (rig.punkt("shoulder01.L", rig.kopf["upperarm01.L"]) + rig.punkt("shoulder01.R", rig.kopf["upperarm01.R"])) / 2
        H = (beine["L"]["huefte"] + beine["R"]["huefte"]) / 2
        unten_r, vor_r = self._rumpf_achsen(S, H)
        P = S.lerp(H, self.BAUCH)
        from mathutils.bvhtree import BVHTree

        import schuhe

        shirt = bpy.data.objects.get("Shirt")
        if shirt is not None:
            pk, pf, _ = schuhe._verformt(shirt)
            pk = [rig.lokal(q) for q in pk]
        else:
            pk, pf = _netz(self.koerper), [list(f.vertices) for f in self.koerper.data.polygons]
            pk = [rig.lokal(q) for q in pk]
        bvh = BVHTree.FromPolygons(pk, pf)
        start = P + vor_r * 0.40
        treffer, _, _, _ = bvh.ray_cast(start, -vor_r, 0.6)
        self.bauch = treffer if treffer is not None else P + vor_r * 0.12
        self.oben = self.bauch + vor_r * (STANGE_R + self.LUFT_BAUCH)
        rig.zuruecksetzen()

    @staticmethod
    def _rumpf_achsen(S: Vector, H: Vector) -> tuple[Vector, Vector]:
        """Achse des Rumpfs von den Schultern zu den Hüften und die Richtung nach vorn (Bauchseite), senkrecht dazu in
        der Ebene y-z (Raum des Skeletts, Blick nach −y)."""
        unten = (H - S).normalized()
        vor = Vector((0.0, -unten.z, unten.y))
        if vor.z > 0:  # die Bauchseite zeigt beim vorgeneigten Rumpf nach unten
            vor = -vor
        return unten, vor

    def setzen(self, p: float) -> None:
        if self.stand is None:
            self._loesen()
        self._phase = p
        Uebung.setzen(self, p)

    def haltung(self, p: float) -> None:
        rig = self.rig
        dy, dz = self.stand
        beine = self._rumpf(self.NEIGUNG, dy, dz)
        self._schultern(p)
        mitte = self.unten.lerp(self.oben, p)
        arme = {}
        for s, sx in (("L", 1), ("R", -1)):
            ziel = Vector((sx * self.GRIFF_X * self.mass, mitte.y, mitte.z))
            pol = Vector((sx * self.POL[0], self.POL[1], self.POL[2])).normalized()
            arme[s] = rig.arm(s, self.griff[s], ziel, X * sx, pol, 0.0)
            arme[s]["mitte"] = ziel
        self.stange.location = rig.welt(mitte)
        L, A = beine["L"], arme["L"]
        S = (arme["L"]["schulter"] + arme["R"]["schulter"]) / 2
        H = (beine["L"]["huefte"] + beine["R"]["huefte"]) / 2
        unten_r, vor_r = self._rumpf_achsen(S, H)
        ober = (A["ellbogen"] - A["schulter"]).normalized()
        # Rumpf an der Wirbelsäule (Lende zum Hals): Die Schlüsselbeine bewegen sich, die Schultergelenke mit ihnen
        k = rig.kopf
        rumpf = rig.punkt("neck01", k["neck01"]) - rig.punkt("spine05", k["spine05"])
        oberschenkel = L["knie"] - L["huefte"]
        schwer = self._schwerpunkt(beine, arme)
        self.werte = {
            "Ellbogenwinkel": A["ellbogenwinkel"],
            "Oberarm hinter dem Rumpf (Grad, + zum Rücken)": math.degrees(math.atan2(-ober.dot(vor_r), ober.dot(unten_r))),
            "Ellbogen vom Rumpf weg (Grad, Oberarm zur Ebene längs des Rumpfs)": math.degrees(math.asin(max(-1.0, min(1.0, abs(ober.x))))),
            "Handgelenk gesamt (Grad)": A["handgelenk_gesamt"],
            "Handgelenk gestreckt (Grad)": A["handgelenk_streckung"],
            "Handgelenk seitlich (Grad, + zum Daumen)": A["handgelenk_seitlich"],
            "Griffe auseinander (cm)": (arme["L"]["mitte"] - arme["R"]["mitte"]).length * 100,
            "Rumpf zur Waagrechten (Grad)": math.degrees(math.asin(max(-1.0, min(1.0, rumpf.normalized().z)))),
            "Kniewinkel (Grad)": self.kniewinkel(L),
            "Hüfte (Rumpf zum Oberschenkel, Grad, 180 = gestreckt)": math.degrees(rumpf.angle(oberschenkel)),
            "Schwerpunkt über der Fußmitte (cm, + dahinter)": (schwer.y - self.fussmitte_y) * 100,
            "Stange über der Fußmitte (cm, + dahinter)": (mitte.y - self.fussmitte_y) * 100,
            "Stange über dem Boden (cm)": rig.welt(mitte).z * 100,
            "Schlüsselbein zurück (Grad)": self.SCHULTER_VOR + (self.SCHULTER_ZURUECK - self.SCHULTER_VOR) * p,
        }

    def nah_punkte(self) -> list[Vector]:
        rig = self.rig
        hand = rig.welt(rig.punkt("wrist.L", rig.kopf["metacarpal2.L"]))
        M = self.stange.location
        return [q for q in _netz(self.koerper) if (q - hand).length < 0.10] + [M + X * 0.40, M + X * 0.20]

    def zusatzwerte(self) -> dict:
        """Stange zu Shirt, Shorts und Haut; Scheiben zum Boden und zu den Beinen; Lende, Nacken und Blick (D-490)."""
        from mathutils.bvhtree import BVHTree

        import schuhe

        M = self.stange.location
        stange = [M + Vector((t, math.cos(w) * STANGE_R, math.sin(w) * STANGE_R)) for t in [i * 0.05 - 0.55 for i in range(23)]
                  for w in [j * math.pi / 6 for j in range(12)]]
        werte = {}
        beste = 1.0
        for name in ("Shirt", "Shorts"):
            obj = bpy.data.objects.get(name)
            if obj is None:
                continue
            pk, pf, _ = schuhe._verformt(obj)
            bvh = BVHTree.FromPolygons(pk, pf)
            for q in stange:
                ort, n, _, d = bvh.find_nearest(q, 0.3)
                if ort is not None:
                    beste = min(beste, d if (q - ort).dot(n) >= 0 else -d)
        werte["Stange zur Kleidung (mm)"] = beste * 1000
        werte["Stange zur Haut ohne Hände (mm)"] = abstand_koerper(self.koerper, stange) * 1000
        # Scheiben: Rand (Durchmesser) zum Boden und zur Haut der Beine
        r = self.SCHEIBEN[0][0] / 2
        werte["Scheiben über dem Boden (mm)"] = (M.z - r) * 1000
        rand = [M + Vector((sx * x0, math.cos(w) * r, math.sin(w) * r)) for sx in (-1, 1) for x0 in (0.70, 0.735)
                for w in [j * math.pi / 24 for j in range(48)]]
        werte["Scheiben zur Haut (mm)"] = abstand_koerper(self.koerper, rand) * 1000
        werte.update(self._ruecken())
        return werte


class RudernMaschine(SchulterdrueckenMaschine):
    """Rudern an der Maschine mit Brustpolster (Familie „Waagrechtes Ziehen“, D-518), nach dem Ausführungstext der App
    (ExRx „Lever Seated Row“) und den Werten der Familie. Sitzend auf dem Sitz der Rudermaschine
    (`geraete.rudermaschine`), der Rumpf `-LEHNE` Grad vorgeneigt, die Brust mit dem Shirt `TIEF` im Brustpolster; Füße
    flach am Boden, Knie `KNIE`. Hände im neutralen Griff (Daumen oben) an den Griffen der beiden Hebel. Ausgang: Arme
    fast gestreckt (`ELLBOGEN_VORN`), die Schultern nach vorn (`SCHULTER_VOR`, „Lass die Griffe zurück, bis die Arme
    gestreckt sind und die Schultern nach vorn gehen“). Ende: die Ellbogen `OBERARM_HINTEN` hinter dem Rumpf, nah am
    Körper (`OBERARM_SEITE`), die Unterarme zeigen nach vorn (`UNTERARM_HOCH` über der Waagrechten), die Schulterblätter
    zusammen (`SCHULTER_ZURUECK`). Jeder Hebel dreht um eine eigene Achse (`HEBEL` lang); die Griffe laufen auf seinem
    Bogen durch Ausgang und Ende (`_bogen`). Zurück derselbe Weg."""

    name = "rudern_maschine"
    titel = "Rudern an der Maschine"
    kamera = {"richtung": 135.0, "neigung": 10.0, "fuellen": 0.02}
    vorschau_phase = 1.0
    LEHNE = -12.0  # Rumpf so weit vorgeneigt (negativ = nach vorn), Grad
    KNIE = 100.0
    FUESSE = 0.15
    ZEHEN = 8.0
    SITZ_UNTER_KNIE = 0.05
    TIEF = 0.004
    # Mitte des Brustpolsters: Anteil von den Hüftgelenken zu den Schultergelenken; bei 0,62 und 42 cm Höhe reichte das
    # Polster unten bis auf die Oberschenkel
    BRUST_HOEHE = 0.72
    BRUST_MASS = None  # Breite, Höhe und Dicke des Brustpolsters (m); None: wie `geraete.RUDERMASCHINE`
    ELLBOGEN_VORN = 166.0
    GRIFF_DZ = 0.03  # Ausgang: Griff so viel höher als am Ende, m
    # Ende: Oberarm so weit hinter dem Rumpf (Familie 15 bis 30°); der Rumpf ist 12° vorgeneigt, der Oberarm steht damit
    # 27° hinter der Senkrechten. Mit 22° und waagrechtem Unterarm endete der Ellbogen bei 56° (Familie 70 bis 90°)
    OBERARM_HINTEN = 15.0
    OBERARM_SEITE = 14.0  # Ende: Oberarm so weit vom Rumpf zur Seite, Grad
    UNTERARM_HOCH = -10.0  # Ende: Unterarm so weit über der Waagrechten nach vorn, Grad (negativ: Hände tiefer)
    HEBEL = 0.85  # Drehachse bis Mitte des Griffs, m
    ACHSE_OBEN = True  # Drehachse über der Bahn der Griffe (Hebel hängt), sonst vorn unten
    GRIFF_KIPP = 0.0  # Griff im Ausgang aus der Senkrechten nach vorn gekippt, Grad
    START_HOCH = None  # Ausgang: Richtung vom Schultergelenk über der Waagrechten (Grad); None: auf Höhe des Endes
    SCHULTER_VOR = -8.0
    SCHULTER_ZURUECK = 10.0
    HAND = 0.075
    GRIFF_LAGE = 0.65
    # Griff schräg in der Hand (D-452): Mit dem Griff quer zur Mittelhand knickte das Handgelenk am senkrechten Griff um
    # die Neigung des Unterarms plus 14° zum Daumen; mit 14° schräg nur noch um die Neigung des Unterarms, und die gleicht
    # der drehbare Griff aus (`DREHGRIFF`)
    SCHRAEG = 14.0
    STRECKUNG = 0.0
    POL = (0.4, 0.8, -1.0)  # Ellbogen nach außen, hinten und unten (linke Seite)
    # Griff drehbar um die Querachse (D-518): Er stellt sich quer zum Unterarm, das Handgelenk bleibt gerade; fest am
    # Hebel knickte es bei der High Row in der Mitte des Zugs 17° zur Seite
    DREHGRIFF = True
    MASCHINE = {}  # weitere Angaben für `geraete.rudermaschine`
    griff_ansichten = (("rudern_aussen", 100.0, 15.0), ("rudern_hinten", 160.0, 25.0))
    # Fuß aus der Nähe wie `render.FUSS_ANSICHTEN`, auf der Prüfseite aber von außen und von hinten: von vorn steht beim
    # Rudern der Turm vor dem Fuß
    fuss_ansichten = ((90, 0.08), (180, 0.10), (0, 0.12), (270, 0.08))

    def rahmen_objekte(self) -> list:
        if self.geraet is None:
            return []
        g = self.geraet
        return [g["sitz"], g["brust"], *g["griffe"].values()]

    def bauen(self) -> None:
        super().bauen()
        rig = self.rig
        k = rig.kopf
        ruhe = [v.co for v in self.koerper.data.vertices]
        huefte, hals = k["upperleg01.L"].z, k["neck01"].z
        self.brust_i = [i for i, q in enumerate(ruhe) if abs(q.x) < 0.15 and huefte + 0.15 < q.z < hals - 0.02 and q.y < 0.0]
        self.griff = {s: rig.griff(s, self.GRIFF_LAGE, geraete.RUDERMASCHINE["griff_d"] / 2, schraeg=self.SCHRAEG) for s in "LR"}
        self._phase_jetzt = 0.0

    def _torso(self, p: float) -> float:
        rig = self.rig
        rig.setze("root", self._becken())
        sch = self.SCHULTER_VOR + (self.SCHULTER_ZURUECK - self.SCHULTER_VOR) * p
        rig.dreh("clavicle.L", achse_winkel(Z, sch))
        rig.dreh("clavicle.R", achse_winkel(Z, -sch))
        return sch

    def _arm_welt(self, s: str, G: Vector, k: Vector, p: float = 0.0) -> dict:
        """Arm an den Griff bei `G` (Welt); mit `DREHGRIFF` stellt sich der Griff quer zum Unterarm (zweimal nachgeführt,
        der Unterarm folgt dem Griff ein wenig); `griff_k` ist die Richtung des Griffs."""
        rig = self.rig
        vorher = len(rig.meldungen)
        arm = rig.arm(s, self.griff[s], rig.lokal(G), k, self._pol(s, p), self.STRECKUNG)
        if self.DREHGRIFF:
            for _ in range(2):
                f = (arm["handgelenk"] - arm["ellbogen"]).normalized()
                k = senkrecht(Z, f)
                # es zählt nur die Haltung mit der letzten Richtung des Griffs: Mit der Richtung des Ausgangs lag das
                # Handgelenk am fast gestreckten Arm in Zwischenschritten außer Reichweite
                del rig.meldungen[vorher:]
                arm = rig.arm(s, self.griff[s], rig.lokal(G), k, self._pol(s, p), self.STRECKUNG)
        arm["griff_k"] = k
        return arm

    def _pol(self, s: str, p: float) -> Vector:
        sx = 1 if s == "L" else -1
        return Vector((sx * self.POL[0], self.POL[1], self.POL[2])).normalized()

    def _griff_lage(self, s: str, p: float) -> tuple[Vector, Vector, Matrix]:
        """Mitte des Griffs (Welt) in Phase p auf dem Bogen des Hebels; der Griff ist drehbar gelagert und bleibt in der
        Richtung des Ausgangs; dazu die Drehung des Hebels."""
        P, achse, delta, G0, k0 = self.bahn[s]
        D = Matrix.Rotation(delta * p, 3, achse)
        return P + D @ (G0 - P), k0, D

    def _ausgang_finden(self, s: str, S0: Vector, G1: Vector, k0: Vector) -> Vector:
        """Griff im Ausgang: auf der Linie von `_ausgang_punkt`, so weit vorn, dass der Ellbogen `ELLBOGEN_VORN` hat
        (Halbierung); mit `START_HOCH` über das Handgelenk (`_ausgang_handgelenk`)."""
        if self.START_HOCH is not None:
            return self._ausgang_handgelenk(s, S0, G1, k0)
        rig = self.rig
        lo, hi = 0.20, 0.90
        for _ in range(24):
            d = (lo + hi) / 2
            G0 = self._ausgang_punkt(S0, G1, d)
            rig.zuruecksetzen()
            self._torso(0.0)
            vorher = len(rig.meldungen)
            arm = self._arm_welt(s, G0, k0)
            del rig.meldungen[vorher:]
            if arm["ellbogenwinkel"] < self.ELLBOGEN_VORN:
                lo = d
            else:
                hi = d
        return self._ausgang_punkt(S0, G1, (lo + hi) / 2)

    def _ausgang_handgelenk(self, s: str, S0: Vector, G1: Vector, k0: Vector) -> Vector:
        """Griff im Ausgang über das Handgelenk: Es liegt `START_HOCH` über der Waagrechten vor dem Schultergelenk, so
        weit, wie der Arm mit `ELLBOGEN_VORN` reicht; der Griff wird nachgeführt, bis das Handgelenk dort liegt. (Über die
        Entfernung des Griffs gesucht, sprang der Ellbogen nahe der Streckung auf 178°: Wenige Millimeter ändern dort
        viele Grad.)"""
        rig = self.rig
        l1, l2 = self.armlaengen
        reich = math.sqrt(l1 * l1 + l2 * l2 - 2 * l1 * l2 * math.cos(math.radians(self.ELLBOGEN_VORN)))
        e = math.radians(self.START_HOCH)
        r = Vector((G1.x - S0.x, -math.cos(e), math.sin(e)))
        r.x = max(-0.4, min(0.4, r.x / reich))  # Richtung auf die Ebene des Griffs am Ende, gekappt
        r = r.normalized()
        W0 = S0 + r * reich
        G0 = W0 + Vector((0.0, -math.cos(e), math.sin(e))) * self.HAND
        for _ in range(10):
            rig.zuruecksetzen()
            self._torso(0.0)
            vorher = len(rig.meldungen)
            arm = self._arm_welt(s, G0, k0)
            del rig.meldungen[vorher:]
            fehler = W0 - rig.welt(arm["handgelenk"])
            if fehler.length < 3e-4:
                break
            G0 = G0 + fehler
        return G0

    def _ausgang_punkt(self, S: Vector, G1: Vector, d: float) -> Vector:
        """Griff im Ausgang in der Entfernung `d` vor dem Schultergelenk `S` (Welt), in der Ebene x des Endes: auf Höhe des
        Endes (`GRIFF_DZ` darüber) oder `START_HOCH` über der Waagrechten."""
        if self.START_HOCH is None:
            return Vector((G1.x, S.y - d, G1.z + self.GRIFF_DZ))
        e = math.radians(self.START_HOCH)
        return Vector((G1.x, S.y - d * math.cos(e), S.z + d * math.sin(e)))

    def _bogen(self, G0: Vector, G1: Vector) -> tuple[Vector, Vector, float]:
        """Drehachse des Hebels: Mitte des Kreises mit dem Halbmesser `HEBEL` durch Ausgang und Ende (Ebene x fest), über
        der Bahn (`ACHSE_OBEN`) oder vorn unten; Richtung der Achse und Winkel vom Ausgang zum Ende."""
        M = (G0 + G1) / 2
        c = G1 - G0
        h = c.length / 2
        d = math.sqrt(max(self.HEBEL ** 2 - h * h, 0.0))
        quer = Vector((0.0, -c.z, c.y)).normalized()
        if self.ACHSE_OBEN:
            if quer.z < 0:
                quer = -quer
        elif quer.y > 0:  # vorn (−y)
            quer = -quer
        P = M + quer * d
        achse = (G0 - P).cross(G1 - P).normalized()
        return P, achse, (G0 - P).angle(G1 - P)

    def _loesen(self) -> None:
        """Sitz, Brustpolster, Bahn der Griffe und Maschine (erstes `setzen`, Kleidung da)."""
        rig = self.rig
        k = rig.kopf
        rig.zuruecksetzen()
        self._torso(0.0)
        self._beine()
        rig.anwenden()
        netz = _netz(self.koerper)
        kleid = self._punkte("Shirt", "Saumband", "Shorts")
        H = rig.welt((rig.punkt("pelvis.L", k["upperleg01.L"]) + rig.punkt("pelvis.R", k["upperleg01.R"])) / 2)
        S0 = {s: rig.welt(rig.punkt("shoulder01." + s, k["upperarm01." + s])) for s in "LR"}
        # Sitz unter dem Gesäß
        sx_, sy_, _ = geraete.RUDERMASCHINE["sitz"]
        sitz_y = H.y - 0.03
        alle = [netz[i] for i in self.gesaess_i] + kleid
        unten = [q for q in alle if abs(q.x) < sx_ / 2 and abs(q.y - sitz_y) < sy_ / 2 and q.z < H.z]
        sitz = Vector((0.0, sitz_y, min(q.z for q in unten) + self.TIEF))
        # Brustpolster: Ebene längs des vorgeneigten Rumpfs, die vorderste Stelle von Brust und Shirt `TIEF` darin
        oben = (self.R @ Z).normalized()
        n = oben.cross(X)  # zur Person
        Sm = (S0["L"] + S0["R"]) / 2
        mitte = H.lerp(Sm, self.BRUST_HOEHE)
        bx, by, _ = self.BRUST_MASS or geraete.RUDERMASCHINE["brust"]
        self.huefte_z = H.z
        vorne = [netz[i] for i in self.brust_i] + [q for q in kleid if abs(q.x) < 0.15 and q.y < H.y and q.z > H.z + 0.12]
        im_feld = [q for q in vorne if abs(q.x) < bx / 2 and abs((q - mitte).dot(oben)) < by / 2]
        c = min(q.dot(n) for q in im_feld) + self.TIEF
        brust = mitte + n * (c - mitte.dot(n))
        self.brust_welt = (brust, oben)
        hebel, griffe = self._bahnen(S0)
        self.sitz_welt = sitz
        # Turm vorn vor den Fußspitzen (bis dahin stießen die Zehen an Turm und Querfuß)
        import schuhe

        spitzen = min(q.y for q in schuhe._verformt(bpy.data.objects["Sohle"])[0]) if "Sohle" in bpy.data.objects else -0.7
        turm_y = min(spitzen - 0.15, min(h[0].y for h in hebel.values()) - 0.08)
        self.geraet = geraete.rudermaschine("Rudermaschine", sitz, (brust, oben), hebel, griffe, turm_y=turm_y,
                                            brust_mass=self.BRUST_MASS, **self.MASCHINE)
        self.polster_ruhe = {o.name: geraete.weiches_polster(o) for o in self.polster_objekte()}
        # Polster nachführen in der Haltung des Ausgangs (mit den Armen an den Griffen; in der Grundhaltung lagen die Arme
        # vor dem Brustpolster)
        rig.zuruecksetzen()
        self.haltung(0.0)
        rig.anwenden()
        punkte = self._auflage_punkte()
        for obj in self.polster_objekte():
            n_welt = (obj.matrix_world.to_3x3() @ Z).normalized()
            obj.matrix_world = Matrix.Translation(n_welt * (self.TIEF - self._tiefe(obj, self._fuer(obj, punkte)))) @ obj.matrix_world
        rig.zuruecksetzen()

    def _bahnen(self, S0: dict) -> tuple[dict, dict]:
        """Bahn der Griffe je Seite (`self.bahn`: Drehpunkt, Achse, Winkel, Griff und Richtung im Ausgang) und die
        Angaben für die Maschine (Lager, Griffe). Ende: Oberarm hinter dem Rumpf und zur Seite, Unterarm nach vorn;
        Ausgang auf derselben Ebene x, so weit vorn, dass der Ellbogen `ELLBOGEN_VORN` hat; die Achse aus `_bogen`."""
        rig = self.rig
        k = rig.kopf
        l1, l2 = self.armlaengen
        rig.zuruecksetzen()
        self._torso(1.0)
        S1 = {s: rig.welt(rig.punkt("shoulder01." + s, k["upperarm01." + s])) for s in "LR"}
        rig.zuruecksetzen()
        unten_r = (self.R @ -Z).normalized()
        vor_r = (self.R @ -Y).normalized()
        self.bahn = {}
        hebel, griffe = {}, {}
        for s, sx in (("L", 1), ("R", -1)):
            u = achse_winkel(X, self.OBERARM_HINTEN) @ unten_r
            u = achse_winkel(vor_r, sx * self.OBERARM_SEITE) @ u  # Ellbogen nach außen
            f = achse_winkel(X, -self.UNTERARM_HOCH) @ Vector((0.0, -1.0, 0.0))
            E1 = S1[s] + u * l1
            W1 = E1 + f * l2
            G1 = W1 + f * self.HAND
            k0 = achse_winkel(X, -self.GRIFF_KIPP) @ Z
            # Griff am Ende nachgeführt, bis das Handgelenk am Ende des geplanten Unterarms liegt (die Mitte des Griffs liegt
            # nicht auf der Linie des Unterarms; ohne Nachführen endete der Ellbogen bei 52° statt etwa 80°)
            for _ in range(8):
                rig.zuruecksetzen()
                self._torso(1.0)
                vorher = len(rig.meldungen)
                arm = self._arm_welt(s, G1, k0, 1.0)
                del rig.meldungen[vorher:]
                fehler = W1 - rig.welt(arm["handgelenk"])
                if fehler.length < 3e-4:
                    break
                G1 = G1 + fehler
            G0 = self._ausgang_finden(s, S0[s], G1, k0)
            rig.zuruecksetzen()
            P, achse, delta = self._bogen(G0, G1)
            self.bahn[s] = (P, achse, delta, G0, k0)
            hebel[s] = (P, achse)
            griffe[s] = (G0, k0)
        return hebel, griffe

    def _fuer(self, obj, punkte: list[Vector]) -> list[Vector]:
        """Punkte, die auf einem Polster aufliegen dürfen: am Brustpolster nur Rumpf und Shirt (über den Hüftgelenken),
        nicht die Oberschenkel unter seinem unteren Rand."""
        if obj is self.geraet["brust"]:
            return [q for q in punkte if q.z > self.huefte_z + 0.12]
        return punkte

    def haltung(self, p: float) -> None:
        rig = self.rig
        sch = self._torso(p)
        beine = self._beine()
        arme, griffe = {}, {}
        for s in "LR":
            G, kk, D = self._griff_lage(s, p)
            griffe[s] = G
            arme[s] = self._arm_welt(s, G, kk, p)
            kk = arme[s]["griff_k"]
            P, k0 = self.bahn[s][0], self.bahn[s][4]
            self.geraet["hebel"][s].matrix_world = (Matrix.Translation(P) @ D.to_4x4() @ Matrix.Translation(-P)
                                                    @ self.geraet["hebel0"][s])
            # drehbarer Griff: folgt dem Ende des Hebels, in der Richtung `kk`
            G0 = self.bahn[s][3]
            dreh = k0.rotation_difference(kk).to_matrix().to_4x4()
            self.geraet["griffe"][s].matrix_world = (Matrix.Translation(G) @ dreh @ Matrix.Translation(-G0)
                                                     @ self.geraet["griffe0"][s])
        A, L = arme["L"], beine["L"]
        unten_r = (self.R @ -Z).normalized()
        vor_r = (self.R @ -Y).normalized()
        ober = (A["ellbogen"] - A["schulter"]).normalized()
        self.werte = {
            "Ellbogenwinkel": A["ellbogenwinkel"],
            "Oberarm hinter dem Rumpf (Grad, + zum Rücken)": math.degrees(math.atan2(-ober.dot(vor_r), ober.dot(unten_r))),
            "Oberarm vom Rumpf zur Seite (Grad)": math.degrees(math.asin(max(-1.0, min(1.0, abs(ober.x))))),
            "Unterarm zur Waagrechten (Grad, + Hand höher)": math.degrees(math.asin(max(-1.0, min(1.0, (A["handgelenk"] - A["ellbogen"]).normalized().z)))),
            "Handgelenk gesamt (Grad)": A["handgelenk_gesamt"],
            "Handgelenk gestreckt (Grad)": A["handgelenk_streckung"],
            "Handgelenk seitlich (Grad, + zum Daumen)": A["handgelenk_seitlich"],
            "Pronation": A["pronation"],
            "Schlüsselbein zurück (Grad)": sch,
            "Griffe auseinander (cm)": (griffe["L"].x - griffe["R"].x) * 100,
            "Hebel der Maschine gedreht (Grad)": math.degrees(self.bahn["L"][2] * p),
            "Kniewinkel (Grad)": self.kniewinkel(L),
        }

    def nah_punkte(self) -> list[Vector]:
        rig = self.rig
        hand = rig.welt(rig.punkt("wrist.L", rig.kopf["metacarpal2.L"]))
        G, kk, _ = self._griff_lage("L", self._phase_jetzt)
        halb = geraete.RUDERMASCHINE["griff_l"] / 2
        return [q for q in _netz(self.koerper) if (q - hand).length < 0.10] + [G - kk * halb, G + kk * halb]

    def zusatzwerte(self) -> dict:
        """Polster (Gesäß und Brust mit Kleidung darin, Delle, nichts ragt durch), Abstand von Körper und Kleidung zu den
        Teilen der Maschine ohne die Polster und die eigenen Griffe, Arme zum Brustpolster (mm)."""
        from mathutils.bvhtree import BVHTree

        import schuhe

        dg = bpy.context.evaluated_depsgraph_get()
        g = self.geraet
        auflage = self.auflage()
        punkte = self._auflage_punkte()
        werte = {"Gesäß im Sitz (mm)": self._tiefe(g["sitz"], punkte) * 1000,
                 "Brust im Polster (mm)": self._tiefe(g["brust"], self._fuer(g["brust"], punkte)) * 1000,
                 "Polster: tiefste Delle (mm)": self.delle * 1000,
                 "Polster: Haut oder Kleidung durch die Oberfläche (mm)": geraete.durch_polster(self.polster_objekte(), auflage) * 1000}
        namen = {gr.index: gr.name for gr in self.koerper.vertex_groups}
        netz = _netz(self.koerper)
        verts = self.koerper.data.vertices
        ohne_haende = [q for v, q in zip(verts, netz)
                       if sum(x.weight for x in v.groups if namen[x.group].startswith(HAND)) < 0.3]
        arme = [q for v, q in zip(verts, netz)
                if sum(x.weight for x in v.groups if namen[x.group].startswith(("upperarm", "lowerarm"))) > 0.5]
        for name in ("Shirt",):
            if name in bpy.data.objects:
                ohne_haende += schuhe._verformt(bpy.data.objects[name])[0][::2]

        def naechster(obj_liste, pkte) -> float:
            beste = 1.0
            for obj in obj_liste:
                oe = obj.evaluated_get(dg)
                me = oe.to_mesh()
                M = oe.matrix_world
                bvh = BVHTree.FromPolygons([M @ v.co for v in me.vertices], [tuple(f.vertices) for f in me.polygons])
                oe.to_mesh_clear()
                for q in pkte:
                    ort, _, _, d = bvh.find_nearest(q, 0.2)
                    if ort is not None:
                        beste = min(beste, d)
            return beste

        griffe = set(g["griffe"].values())
        teile = [o for o in g["wurzel"].children_recursive if o.type == "MESH" and o not in g["polster"] and o not in griffe]
        werte["Körper und Shirt zur Maschine ohne Polster und Griffe (mm)"] = naechster(teile, ohne_haende[::2]) * 1000
        werte["Arme zum Brustpolster (mm)"] = naechster([g["brust"]], arme[::2]) * 1000
        return werte


class HighRowMaschine(RudernMaschine):
    """High Row an der Maschine mit Brustpolster (Familie „Waagrechtes Ziehen“, D-518), nach den Werten der Familie und
    der Beschreibung im Plan („sitzend, Brust am Polster, Griffe vorn oben an Hebelarmen, Zug schräg nach unten zu den
    unteren Rippen“); einen Ausführungstext hat die Übung in der App noch nicht (D-504, die Quelle war nicht erreichbar).
    Wie das Rudern an der Maschine, aber: Ausgang mit den Armen schräg nach vorn oben (`START_HOCH`), Ende mit den
    Ellbogen unten seitlich am Rumpf, die Unterarme schräg nach vorn oben (`UNTERARM_HOCH`); die Drehachse des Hebels
    liegt vorn unter der Bahn, der Hebel ist lang (`HEBEL`), die Bahn der Griffe fast gerade."""

    name = "high_row_maschine"
    titel = "High Row an der Maschine"
    START_HOCH = 40.0
    # Ende: Unterarm 15° über der Waagrechten, Oberarm 5° hinter dem Rumpf; mit 30° und 15° endete der Ellbogen bei 36°
    UNTERARM_HOCH = 15.0
    OBERARM_HINTEN = 5.0
    OBERARM_SEITE = 12.0
    ACHSE_OBEN = False
    # Hebel lang, die Bahn fast gerade: Mit 0,80 m lief der Griff in der Mitte nah am Gesicht vorbei
    HEBEL = 1.30
    # Richtung der Griffe im Ausgang, oben zur Person gekippt (der Unterarm steht dort 42° über der Waagrechten); danach
    # stellt sich der drehbare Griff je Bild quer zum Unterarm (`DREHGRIFF`)
    GRIFF_KIPP = 36.0


# ---------------------------------------------------------------------- Familie „Schulter und Brust isoliert“ für Dali’s PPLC (D-519)


class FliegendeKabel(Seitheben):
    """Fliegende am Kabel, stehend zwischen zwei Säulen (Familie „Schulter und Brust isoliert“, D-519), nach dem
    Ausführungstext der App (ExRx „Cable Isolateral Standing Fly“) und den Werten der Familie (Ellbogen 10 bis 20° fest;
    horizontale Adduktion von 10 bis 20° hinter der Körperebene bis 80 bis 90° nach vorn). Stand etwa hüftbreit, Hüfte
    und Knie leicht gebeugt, der Oberkörper aus der Hüfte `NEIGUNG` vor („so hält dein Oberkörper dem Zug der Kabel
    stand“). In jeder Hand ein D-Griff an einem Kabel von der oberen Rolle (`geraete.kabelturm`). Die Ellbogen bleiben in
    einem festen, leicht gebeugten Winkel (`ELLBOGEN`); der ganze Arm dreht um das Schultergelenk auf dem kürzesten Weg
    vom Ausgang zum Ende. Ausgang: die Arme zur Seite, `HINTEN` hinter der Ebene der Schultern und `HOCH` über der
    Waagrechten („bis du eine Dehnung in der Brust spürst“), die Ellbogen nach hinten. Ende: die Hände vor dem unteren
    Bauch (`ENDE_UNTER` unter den Schultergelenken), die Griffe `ENDE_X` neben der Mitte („in einer umarmenden Bewegung
    vor dem Körper zusammen“), die Ellbogen nach außen. Die Kabel laufen von den Rollen zu den Ösen der Griffe, die Blöcke
    heben sich um den Weg der Kabel. Zurück derselbe Weg."""

    name = "fliegende_kabel"
    titel = "Fliegende am Kabel"
    kamera = {"richtung": 20.0, "neigung": 10.0}
    vorschau_phase = 1.0
    NEIGUNG = 15.0
    KNIE = 165.0
    ELLBOGEN = 160.0  # fest, leicht gebeugt (Familie 10 bis 20°)
    HINTEN = 12.0  # Ausgang: Oberarm so weit hinter der Ebene der Schultern, Grad (Familie 10 bis 20°)
    HOCH = 12.0  # Ausgang: Oberarm so weit über der Waagrechten, Grad
    # Ende: Mitte der Griffe so weit neben der Mitte (vor dem Maß der Schultern), m. Mit 0,06 berührten sich die Hände, und
    # die beiden D-Griffe lagen 12,9 mm ineinander; mit 0,075 bleiben sie 31 mm auseinander
    ENDE_X = 0.075
    ENDE_UNTER = 0.42  # Ende: Handgelenke so weit unter den Schultergelenken, m (vor dem unteren Bauch)
    ENDE_POL = (1.0, 0.4, 0.3)  # Ende: Ellbogen nach außen, etwas hinten und oben (linke Seite)
    ROLLE_Z = 2.05  # Rolle oben: Unterkante über dem Boden, m
    ROLLE_X = 1.10  # Rolle so weit neben der Mitte, m
    # Säulen und Rollen so weit hinter den Schultergelenken, m: Am Ende laufen die Kabel am Unterarm vorbei, mit 0,30 m
    # 0,06 mm, mit 0,12 m 3,3 mm, in der Ebene der Schultern 7,6 mm davon
    SAEULE_HINTEN = 0.0
    SCHULTER_HOCH = 0.0
    GRIFF_LAGE = 0.62
    SCHRAEG = 0.0
    # D-Griff an das Handgelenk gelegt: Zum Ende hin läuft das Kabel fast in Linie mit dem Unterarm; mit der Öse genau zur
    # Rolle lagen die zusammenlaufenden Streben dann bis 4,8 mm in Handgelenk und Unterarm (Kleinfingerseite; Griff schräg
    # in der Hand ±10° oder eine höhere Öse halfen nicht). Der Griff kippt je Bild so wenig wie möglich um seine Stange, bis
    # die Streben `STREBE_LUFT` vor der Haut liegen, wie sich ein echter Griff an das Handgelenk anlegt
    STREBE_LUFT = 0.001  # m
    KIPP_MAX = 40.0  # Grad
    griff_ansichten = (("dgriff_vorn", 15.0, 10.0), ("dgriff_seite", 100.0, 20.0))  # wie beim Seitheben, mit D-Griff
    # Von der Seite (Kamera auf der Seite von `L`) verdeckt die nahe Säule den Körper: in dieser Prüfansicht ausgeblendet
    ausblenden = {"seite": ("Saeulenfuss.L", "Saeule.L", "Fuehrung.L", "Saeulenkopf.L", "Gewichtsblock.L", "Schiene.L",
                            "Schlitten.L", "Rollenhalter.L", "Rolle.L", "Kabel-Saeule.L")}

    def rahmen_objekte(self) -> list:
        return list(self.hanteln.values())

    def bauen(self) -> None:
        Uebung.bauen(self)
        rig = self.rig
        k = rig.kopf
        self.griff = {s: rig.griff(s, self.GRIFF_LAGE, geraete.KABELTURM["d_griff_d"] / 2, schraeg=self.SCHRAEG) for s in "LR"}
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
        # Kabelturm: Rollen hinter und neben den Schultern, oben
        rig.zuruecksetzen()
        self._stand(0.0)
        S = rig.welt((rig.punkt("shoulder01.L", k["upperarm01.L"]) + rig.punkt("shoulder01.R", k["upperarm01.R"])) / 2)
        rig.zuruecksetzen()
        y = S.y + self.SAEULE_HINTEN
        rollen = {"L": Vector((self.ROLLE_X, y, self.ROLLE_Z)), "R": Vector((-self.ROLLE_X, y, self.ROLLE_Z))}
        self.geraet = geraete.kabelturm(rollen, y)
        self.hanteln = self.geraet["griffe"]
        self.kabel_l0 = None

    def _rahmen_oben(self, s: str) -> dict:
        """Arm am Ende (Raum des Skeletts): Handgelenk vor dem unteren Bauch, `ENDE_UNTER` unter dem Schultergelenk und so
        weit vorn, dass der Ellbogen `ELLBOGEN` hat; Ellbogen nach außen (`ENDE_POL`); Griffachse vom Zeigefinger zum
        kleinen Finger nach unten, quer zum Unterarm, Handflächen zueinander."""
        rig = self.rig
        sx = 1 if s == "L" else -1
        rig.zuruecksetzen()
        self._stand(1.0)
        S = rig.punkt("shoulder01." + s, rig.kopf["upperarm01." + s])
        rig.zuruecksetzen()
        l1, l2 = self.armlaengen
        d = math.sqrt(l1 * l1 + l2 * l2 - 2 * l1 * l2 * math.cos(math.radians(self.ELLBOGEN)))
        x = sx * (self.ENDE_X * self.mass + 0.02)
        dz = -self.ENDE_UNTER
        dx = x - S.x
        dy = -math.sqrt(max(d * d - dx * dx - dz * dz, 0.0))
        W = S + Vector((dx, dy, dz))
        from rig import zwei_glieder

        pol = Vector((sx * self.ENDE_POL[0], self.ENDE_POL[1], self.ENDE_POL[2])).normalized()
        E = zwei_glieder(S, W, l1, l2, pol)[0]
        u, f = (E - S).normalized(), (W - E).normalized()
        b = senkrecht(f, u)
        k = senkrecht(-Z, f)
        n = f.cross(k).normalized()
        if n.x * sx > 0:  # Handfläche zur Mitte
            n = -n
        return {"u": u, "f": f, "b": b, "k": k, "n": n}

    def _ausgang(self) -> None:
        """Ausgang: Oberarm zur Seite, `HINTEN` hinter der Ebene der Schultern und `HOCH` über der Waagrechten; der Arm als
        Ganzes vom Ende dorthin gedreht, dazu um den Oberarm, bis die Beugung des Ellbogens nach vorn zeigt (Ellbogen
        hinten)."""
        h, e = math.radians(self.HINTEN), math.radians(self.HOCH)
        self.start = {}
        for s, sx in (("L", 1), ("R", -1)):
            o = self.oben_rahmen[s]
            u1 = Vector((sx * math.cos(h) * math.cos(e), math.sin(h) * math.cos(e), math.sin(e)))
            q = o["u"].rotation_difference(u1)
            b1 = q @ o["b"]
            ziel = senkrecht(Vector((0.0, -1.0, 0.0)), u1)
            dreh = Quaternion(u1, math.atan2(b1.cross(ziel).dot(u1), b1.dot(ziel)))
            self.start[s] = dreh @ q

    def hantel_setzen(self, s: str, mitte: Vector, k: Vector, f: Vector) -> None:
        """D-Griff an die Hand: Griff längs `k`, die Öse zur Rolle (`_griff_anlegen` kippt ihn danach, wo nötig)."""
        M_w = self.rig.welt(mitte)
        rolle = self.geraet["rollen"][s]
        x = k.normalized()
        y = senkrecht(rolle - M_w, x)
        M = Matrix((x, y, x.cross(y))).transposed().to_4x4()
        M.translation = M_w
        self._griff_setzen(s, M)

    def _griff_setzen(self, s: str, M: Matrix) -> None:
        """D-Griff in der Lage `M`, dazu das Kabel von der Rolle zur Öse und der Block."""
        g = self.geraet
        self.hanteln[s].matrix_world = M
        rolle = g["rollen"][s]
        oese = M @ Vector((0, geraete.KABELTURM["d_oese"], 0))
        geraete.kabel(f"Kabel-Griff.{s}", rolle, oese)
        laenge = (rolle - oese).length
        if self.kabel_l0 is None:
            self.kabel_l0 = {}
        self.kabel_l0.setdefault(s, laenge)
        g["bloecke"][s].matrix_world = Matrix.Translation(Vector((0, 0, laenge - self.kabel_l0[s]))) @ g["bloecke0"][s]

    def setzen(self, p: float) -> None:
        if not self.geloest:
            self.geloest = True
            self._griffachse()
            self._ausgang()
            Uebung.setzen(self, 0.0)  # Länge der Kabel im Ausgang
            self.kabel_l0 = None
            Uebung.setzen(self, 0.0)
        Uebung.setzen(self, p)
        self._griff_anlegen()  # erst hier: die Haltung muss am verformten Körper angekommen sein (`rig.anwenden`)

    def _strebe_punkte(self) -> list[Vector]:
        """Punkte auf den Mittellinien der beiden Streben eines D-Griffs (im Griff: x längs, y zur Öse)."""
        l, h = geraete.KABELTURM["d_griff_l"], geraete.KABELTURM["d_oese"]
        punkte = []
        for sx in (-1, 1):
            a, b = Vector((sx * (l / 2 + 0.006), 0, 0)), Vector((sx * (l / 2 + 0.006), 0.03, 0))
            c = Vector((sx * 0.008, h, 0))
            punkte += [a.lerp(b, i / 4) for i in range(5)] + [b.lerp(c, i / 10) for i in range(11)]
        return punkte

    def _griff_anlegen(self) -> None:
        """Jeden D-Griff so wenig wie möglich um seine Stange kippen, bis die Streben `STREBE_LUFT` vor der Haut liegen
        (Suche je Grad in beide Richtungen, dann halbiert); Wert „D-Griff um die Stange gekippt“."""
        from mathutils import kdtree

        netz = _netz(self.koerper)
        baum = kdtree.KDTree(len(netz))
        for i, q in enumerate(netz):
            baum.insert(q, i)
        baum.balance()
        lokal = self._strebe_punkte()
        kipp = {}
        for s in "LR":
            M0 = self.hanteln[s].matrix_world.copy()

            def luft(grad: float) -> float:
                M = M0 @ Matrix.Rotation(math.radians(grad), 4, "X")
                return min(baum.find(M @ q)[2] for q in lokal) - 0.006

            grad = 0.0
            if luft(0.0) < self.STREBE_LUFT:
                gefunden = None
                for n in range(1, int(self.KIPP_MAX) + 1):
                    gefunden = next((g for g in (n, -n) if luft(g) >= self.STREBE_LUFT), None)
                    if gefunden is not None:
                        break
                if gefunden is None:
                    self.rig.meldungen.append(f"D-Griff {s}: Streben bis {self.KIPP_MAX:.0f}° nicht frei")
                    gefunden = self.KIPP_MAX
                innen, aussen = math.copysign(abs(gefunden) - 1, gefunden), gefunden
                for _ in range(12):
                    mitte = (innen + aussen) / 2
                    innen, aussen = (mitte, aussen) if luft(mitte) < self.STREBE_LUFT else (innen, mitte)
                grad = aussen
                self._griff_setzen(s, M0 @ Matrix.Rotation(math.radians(grad), 4, "X"))
            kipp[s] = abs(grad)
        self.werte["D-Griff um die Stange gekippt (Grad)"] = max(kipp.values())

    def haltung(self, p: float) -> None:
        Seitheben.haltung(self, p)
        # Der Winkel des Seithebens gilt erst ab 60° Armhebung und fehlt am Ende; hier zählt er waagrecht gemessen (unten)
        self.werte.pop("Oberarm vor der Ebene der Schultern (Grad, ab 60° Armhebung)", None)
        rig = self.rig
        S = rig.punkt("shoulder01.L", rig.kopf["upperarm01.L"])
        u = (rig.punkt("lowerarm01.L", rig.kopf["lowerarm01.L"]) - S).normalized()
        self.werte["Oberarm vor der Ebene der Schultern (Grad, waagrecht gemessen)"] = math.degrees(math.atan2(-u.y, abs(u.x)))
        self.werte["Kabel: Block gehoben (cm)"] = (self.geraet["bloecke"]["L"].matrix_world.translation.z
                                                  - self.geraet["bloecke0"]["L"].translation.z) * 100

    def nah_punkte(self) -> list[Vector]:
        rig = self.rig
        hand = rig.welt(rig.punkt("wrist.L", rig.kopf["metacarpal2.L"]))
        M = self.hanteln["L"].matrix_world
        halb = geraete.KABELTURM["d_griff_l"] / 2
        return ([q for q in _netz(self.koerper) if (q - hand).length < 0.10]
                + [M @ Vector((halb, 0, 0)), M @ Vector((-halb, 0, 0)), M @ Vector((0, geraete.KABELTURM["d_oese"], 0))])

    def zusatzwerte(self) -> dict:
        """Kabel zu Haut und Kleidung (mm), Streben der D-Griffe zu den Händen (mm), Hände zueinander (mm)."""
        import schuhe

        g = self.geraet
        punkte = []
        for s in "LR":
            M = self.hanteln[s].matrix_world
            oese = M @ Vector((0, geraete.KABELTURM["d_oese"], 0))
            rolle = g["rollen"][s]
            punkte += [rolle.lerp(oese, i / 40) for i in range(41)]
        werte = {"Kabel zur Haut ohne Hände (mm)": abstand_koerper(self.koerper, punkte) * 1000}
        from mathutils.bvhtree import BVHTree

        beste = 1.0
        for name in ("Shirt", "Shorts"):
            obj = bpy.data.objects.get(name)
            if obj is None:
                continue
            pk, pf, _ = schuhe._verformt(obj)
            bvh = BVHTree.FromPolygons(pk, pf)
            for q in punkte:
                # nur nahe Punkte: weit weg zeigt die Normale der nächsten Fläche nichts über innen und außen
                ort, n, _, d = bvh.find_nearest(q, 0.05)
                if ort is not None:
                    beste = min(beste, d if (q - ort).dot(n) >= 0 else -d)
        # gesucht wird nur 5 cm weit: weiter weg zählt als 50 mm (bis D-519 stand dann 1000 mm auf der Prüfseite)
        werte["Kabel zur Kleidung (mm)"] = min(beste, 0.05) * 1000
        # Streben der Griffe zur Haut (mit Händen): Punkte auf den Streben
        streben = []
        l, h = geraete.KABELTURM["d_griff_l"], geraete.KABELTURM["d_oese"]
        for s in "LR":
            M = self.hanteln[s].matrix_world
            for sx in (-1, 1):
                a, b = Vector((sx * (l / 2 + 0.006), 0, 0)), Vector((sx * (l / 2 + 0.006), 0.03, 0))
                c = Vector((sx * 0.008, h, 0))
                streben += [M @ a.lerp(b, i / 4) for i in range(5)] + [M @ b.lerp(c, i / 10) for i in range(11)]
        netz = _netz(self.koerper)
        from mathutils import kdtree

        baum = kdtree.KDTree(len(netz))
        for i, q in enumerate(netz):
            baum.insert(q, i)
        baum.balance()
        werte["D-Griff: Streben zur Haut (mm, Mitte der Strebe)"] = (min(baum.find(q)[2] for q in streben) - 0.006) * 1000
        # Hände zueinander: kleinster Abstand zwischen Punkten der linken und der rechten Hand
        namen = {gr.index: gr.name for gr in self.koerper.vertex_groups}
        haende = {s: [q for v, q in zip(self.koerper.data.vertices, netz)
                      if sum(x.weight for x in v.groups if namen[x.group].startswith(HAND) and namen[x.group].endswith("." + s)) > 0.5]
                  for s in "LR"}
        rechts = kdtree.KDTree(len(haende["R"]))
        for i, q in enumerate(haende["R"]):
            rechts.insert(q, i)
        rechts.balance()
        werte["Hände zueinander (mm)"] = min(rechts.find(q)[2] for q in haende["L"]) * 1000
        return werte


class ReverseButterfly(RudernMaschine):
    """Reverse Butterfly an der Maschine (Familie „Schulter und Brust isoliert“, D-519), nach dem Ausführungstext der App
    (ExRx „Lever Seated Reverse Fly“ mit parallelen Griffen) und den Werten der Familie (Reverse Fly: Gegenrichtung der
    horizontalen Adduktion, Brust am Polster; Ellbogen 10 bis 20° fest). Sitzend mit der Brust am Polster einer Maschine
    der Bauart der Rudermaschine (D-518: Sitz, Brustpolster, Turm vorn), der Rumpf `-LEHNE` Grad vorgeneigt, Füße flach am
    Boden. Hände im neutralen Griff (Daumen oben) an senkrechten Griffen auf Schulterhöhe („Arme auf Schulterhöhe“). Die
    Arme bleiben leicht gebeugt (`ELLBOGEN`) und drehen als Ganzes um die senkrechte Achse durch das Schultergelenk:
    Ausgang mit den Armen nach vorn, `START_INNEN` nach innen; Ende mit den Ellbogen auf Höhe des Rumpfs („bis die
    Ellbogen etwa auf Höhe des Oberkörpers sind“, `ENDE_HINTEN` hinter der Ebene der Schultern). Die Ellbogen bleiben auf
    Schulterhöhe. Jeder Hebel hängt von einem Lager senkrecht über dem Schultergelenk (`LAGER_HOCH`) und dreht um seine
    senkrechte Achse. Zurück derselbe Weg."""

    name = "reverse_butterfly"
    titel = "Reverse Butterfly an der Maschine"
    kamera = {"richtung": 160.0, "neigung": 25.0, "fuellen": 0.02}
    LEHNE = -6.0
    ELLBOGEN = 165.0
    START_INNEN = 8.0  # Ausgang: Arme so weit aus der Richtung nach vorn zur Mitte, Grad
    ENDE_HINTEN = 0.0  # Ende: Oberarm so weit hinter der Ebene der Schultern, Grad
    LAGER_HOCH = 0.42  # Lager so weit über den Schultergelenken, m
    # Schlüsselbeine fest: Der Griff läuft auf einem Kreis um die senkrechte Achse über dem Schultergelenk; bewegte sich
    # das Gelenk mit (−3° → 6°), änderte sich der Ellbogen in der ersten Probe von 149° auf 166°
    SCHULTER_VOR = 0.0
    SCHULTER_ZURUECK = 0.0
    # Brustpolster tiefer und niedriger als beim Rudern: Die Arme gehen auf Schulterhöhe darüber nach vorn (bei 0,66 lagen
    # sie im Ausgang über seinem oberen Rand im Polster); mit 34 cm Höhe und Mitte bei 0,50 reichte es unten 2 cm in die
    # Oberschenkel (20 Punkte der Haut im Polster, die Delle zum Schein 10 cm tief). Jetzt 24 cm hoch, die Mitte höher
    BRUST_HOEHE = 0.615
    BRUST_MASS = (0.32, 0.24, 0.08)
    SCHRAEG = 14.0  # Griff schräg in der Hand: am senkrechten Griff mit waagrechtem Unterarm knickte das Handgelenk sonst 16°
    MASCHINE = {"haengend": True, "scheiben": False}
    griff_ansichten = (("butterfly_oben", 160.0, 40.0), ("butterfly_vorn", 20.0, 15.0))

    def _bahnen(self, S0: dict) -> tuple[dict, dict]:
        """Senkrechte Achse durch das Schultergelenk (Mitte aus Ausgang und Ende); die Griffe auf einem waagrechten Kreis
        auf Schulterhöhe, so weit vom Gelenk, wie der Arm mit `ELLBOGEN` und der Hand reicht."""
        rig = self.rig
        k = rig.kopf
        l1, l2 = self.armlaengen
        rig.zuruecksetzen()
        self._torso(1.0)
        S1 = {s: rig.welt(rig.punkt("shoulder01." + s, k["upperarm01." + s])) for s in "LR"}
        rig.zuruecksetzen()
        self.bahn = {}
        self.pol0 = {"L": Vector((1.0, 0.0, 0.0)), "R": Vector((-1.0, 0.0, 0.0))}  # Ellbogen im Ausgang nach außen
        hebel, griffe = {}, {}
        for s, sx in (("L", 1), ("R", -1)):
            S = (S0[s] + S1[s]) / 2
            a0, a1 = math.radians(self.START_INNEN), math.radians(self.ENDE_HINTEN)
            r0 = Vector((-sx * math.sin(a0), -math.cos(a0), 0.0))
            r1 = Vector((sx * math.cos(a1), math.sin(a1), 0.0))
            # Halbmesser per Halbierung, bis der Ellbogen im Ausgang `ELLBOGEN` hat (die Mitte des Griffs liegt nicht auf
            # der Linie des Unterarms; mit der Reichweite des Arms allein waren es 149°)
            lo, hi = 0.40, 0.90
            for _ in range(22):
                reich = (lo + hi) / 2
                rig.zuruecksetzen()
                self._torso(0.0)
                vorher = len(rig.meldungen)
                arm = rig.arm(s, self.griff[s], rig.lokal(S + r0 * reich), Z, self.pol0[s], self.STRECKUNG)
                del rig.meldungen[vorher:]
                if arm["ellbogenwinkel"] < self.ELLBOGEN:
                    lo = reich
                else:
                    hi = reich
            rig.zuruecksetzen()
            reich = (lo + hi) / 2
            G0, G1 = S + r0 * reich, S + r1 * reich
            P = Vector((S.x, S.y, S.z + self.LAGER_HOCH))
            winkel = math.atan2(r0.cross(r1).z, r0.dot(r1))
            achse = Z.copy() if winkel > 0 else -Z
            k0 = Z.copy()
            self.bahn[s] = (P, achse, abs(winkel), G0, k0)
            hebel[s] = (P, achse)
            griffe[s] = (G0, k0)
        return hebel, griffe

    def _pol(self, s: str, p: float) -> Vector:
        P, achse, delta, G0, k0 = self.bahn[s]
        return Matrix.Rotation(delta * p, 3, achse) @ self.pol0[s]

    def haltung(self, p: float) -> None:
        super().haltung(p)
        rig = self.rig
        S = rig.welt(rig.punkt("shoulder01.L", rig.kopf["upperarm01.L"]))
        E = rig.welt(rig.punkt("lowerarm01.L", rig.kopf["lowerarm01.L"]))
        u = (E - S).normalized()
        self.werte["Oberarm vor der Ebene der Schultern (Grad, waagrecht)"] = math.degrees(math.atan2(-u.y, abs(u.x)))
        self.werte["Ellbogen über dem Schultergelenk (cm)"] = (E.z - S.z) * 100
        # Der Winkel des Ruderns (in der Ebene längs des Rumpfs) sagt beim waagrechten Arm nichts und springt bei der
        # Seitenlage von −109° auf +109°; hier zählt die Ebene der Schultern (oben)
        self.werte.pop("Oberarm hinter dem Rumpf (Grad, + zum Rücken)", None)


UEBUNGEN = {u.name: u for u in (Kniebeuge, Bankdruecken, Latziehen, BankdrueckenKH, SchraegbankdrueckenKH,
                               Beinpresse, Unterarmstuetz, Crunch, Seitheben, RudernKabel,
                               BeinbeugerLiegend, RumaenischesKreuzhebenKH,
                               SchulterdrueckenMaschine, KlimmzugUnterstuetzt, DipUnterstuetzt,
                               Hackenschmidt, Beinstrecker, BeinbeugerSitzend, WadenhebenStehend, WadenhebenSitzend,
                               Bizepscurl, Hammercurl, Trizepsdruecken, RudernLanghantel, RudernMaschine,
                               HighRowMaschine, FliegendeKabel, ReverseButterfly)}
