"""Geräte in echten Maßen (Pilot 3D, D-402). Alle Maße in Metern.

Langhantel: olympische Stange 2,20 m, Griffteil 28 mm, Hülsen 50 mm und je 41,5 cm lang;
Scheiben aus Eisen, 20 kg mit 450 mm und 10 kg mit 330 mm Durchmesser.
Flachbank: Polster 1,20 × 0,30 m, Oberkante 0,43 m.
Latzug: Sitz 0,48 m hoch, Knierolle, Säule, obere Rolle 12 cm, Kabel 5 mm, Latzugstange 1,20 m
mit abgewinkelten Enden.
Kurzhantel 20 kg (D-462), Sechskant, gummiert, nach Herstellerangabe (Fitcom Hex 20 kg): 365 mm lang, Griff 130 mm
lang und 34 mm dick, Köpfe 145 mm über die Ecken.
Verstellbare Bank (D-462) nach Herstellerangaben (Factory Weights Adjustable Commercial Bench: 43 cm hoch, Lehne
30 cm breit, Stufen der Lehne 0, 15, 30, 45 … Grad, des Sitzes 0, 10, 20 Grad; Life Fitness Signature Series
Multi-Adjustable Bench: Rückenpolster 81 cm, Sitz 43 cm hoch): Polster 6 cm dick und 30 cm breit, Lehne 80 cm, Sitz
40 cm lang, 2 cm Spalt am Gelenk.
"""
from __future__ import annotations

import math

import bpy
from mathutils import Euler, Matrix, Vector

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


def latzug(sitz_oben: float, knie: Vector, rolle_y: float) -> dict[str, bpy.types.Object]:
    """Latzug mit Blick der Person nach -y, Sitz um den Ursprung, Säule vorn (bei -y).

    Eingestellt wie im Studio auf die Person: Sitzhöhe `sitz_oben` (Oberkante), Knierolle bei
    `knie` (Mitte der Rollen, liegt auf den Oberschenkeln kurz vor den Knien), Rolle oben bei
    `rolle_y` senkrecht über der Zugbahn der Stange.
    """
    polster = _mat("Polster", GERAET, 0.8)
    rahmen = _mat("Rahmen", GERAET_HELL, 0.45, 0.4)
    stahl = _mat("Stahl", GERAET_HELL, 0.35, 0.6)
    teile: dict[str, bpy.types.Object] = {}
    _kasten("Sitz", (0.40, 0.36, 0.08), Vector((0, 0.02, sitz_oben - 0.04)), polster, 0.025)
    _kasten("Sitzstuetze", (0.06, 0.06, sitz_oben - 0.08), Vector((0, 0.02, (sitz_oben - 0.08) / 2)), rahmen, 0.005)
    _kasten("Grundrahmen", (0.08, 1.05, 0.05), Vector((0, -0.48, 0.025)), rahmen, 0.005)
    # Säule vorn, Ausleger nach oben über der Person, Rolle über der Zugbahn.
    saeule_y = -0.95
    _kasten("Saeule", (0.10, 0.10, 2.30), Vector((0, saeule_y, 1.15)), rahmen, 0.008)
    _kasten("Ausleger", (0.08, rolle_y - saeule_y + 0.08, 0.08), Vector((0, (rolle_y + saeule_y) / 2, 2.26)), rahmen, 0.008)
    rolle = _zylinder("Rolle", 0.06, 0.03, Vector((0, rolle_y, 2.15)), "x", stahl, ecken=64)
    _kasten("Rollenhalter", (0.05, 0.05, 0.10), Vector((0, rolle_y, 2.22)), rahmen, 0.005)
    hintere_rolle = _zylinder("Rolle2", 0.05, 0.03, Vector((0, saeule_y + 0.05, 2.15)), "x", stahl, ecken=48)
    _kasten("Gewichtsblock", (0.30, 0.16, 0.65), Vector((0, saeule_y - 0.12, 0.40)), rahmen, 0.01)
    # Knierolle: Holm von der Säule, zwei Rollen über den Oberschenkeln.
    _kasten("Knieholm", (0.05, abs(knie.y - saeule_y), 0.05), Vector((0, (knie.y + saeule_y) / 2, knie.z)), rahmen, 0.005)
    for seite in (-1, 1):
        _zylinder("Knierolle", 0.055, 0.17, Vector((seite * 0.105, knie.y, knie.z)), "x", polster)
    teile["rolle"] = rolle
    teile["rolle2"] = hintere_rolle
    # Latzugstange: gerades Mittelstück 0,80 m, Enden 20° nach unten (ohne Gummigriffe, damit
    # die Griffposition der Hände auf dem geraden Teil eindeutig ist).
    stange = bpy.data.objects.new("Latzugstange", None)
    bpy.context.scene.collection.objects.link(stange)
    _zylinder("Mittelstueck", 0.012, 0.80, Vector(), "x", stahl, stange)
    for seite in (-1, 1):
        ende = _zylinder("Ende", 0.012, 0.22, Vector((seite * 0.503, 0, -0.037)), "x", stahl, stange)
        ende.rotation_euler = Euler((0, math.pi / 2 + seite * math.radians(20), 0))
        _zylinder("Kappe", 0.015, 0.02, Vector((seite * 0.6067, 0, -0.0752)), "x", stahl, stange).rotation_euler = Euler(
            (0, math.pi / 2 + seite * math.radians(20), 0))
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


# Kurzhantel und verstellbare Bank (D-462)
KH = {"laenge": 0.365, "griff": 0.130, "griff_d": 0.034, "kopf": 0.145, "ring": (0.022, 0.012)}
BANK = {"oben": 0.43, "dicke": 0.06, "breite": 0.30, "lehne": 0.80, "sitz": 0.40, "spalt": 0.02}


def kurzhantel(name: str) -> bpy.types.Object:
    """Kurzhantel (`KH`) mit dem Griff entlang x, Mitte des Griffs im Ursprung des Leerobjekts `name`: Griff aus Stahl
    mit je einem Ring (22 mm Radius, 12 mm) an den Köpfen, frei bleiben 106 mm; Köpfe als Sechskant aus Gummi, eine
    flache Seite unten, Kanten gerundet."""
    stahl = _mat("Stahl", GERAET_HELL, 0.35, 0.6)
    gummi = _mat("Gummi", GERAET, 0.7)
    mitte = bpy.data.objects.new(name, None)
    bpy.context.scene.collection.objects.link(mitte)
    _zylinder(f"{name}-Griff", KH["griff_d"] / 2, KH["griff"], Vector(), "x", stahl, mitte)
    kopf_l = (KH["laenge"] - KH["griff"]) / 2
    r_ring, l_ring = KH["ring"]
    for seite in (-1, 1):
        _zylinder(f"{name}-Ring", r_ring, l_ring, Vector((seite * (KH["griff"] / 2 - l_ring / 2), 0, 0)), "x", stahl, mitte)
        kopf = _zylinder(f"{name}-Kopf", KH["kopf"] / 2, kopf_l, Vector((seite * (KH["griff"] / 2 + kopf_l / 2), 0, 0)), "x",
                         gummi, mitte, ecken=6)
        # erst entlang x legen, dann 30° um die eigene Achse: Ecken bei 0, 60, 120 … Grad, unten eine flache Seite
        kopf.rotation_mode = "YXZ"
        kopf.rotation_euler = Euler((math.radians(30), math.pi / 2, 0), "YXZ")
        bpy.context.view_layer.objects.active = kopf
        bpy.ops.object.shade_flat()
        rund = kopf.modifiers.new("Rund", "BEVEL")
        rund.width = 0.008
        rund.segments = 3
    return mitte


def schraegbank(lehne: float, sitz: float = 0.0) -> bpy.types.Object:
    """Verstellbare Bank (`BANK`), Person mit dem Kopf nach +y: Gelenk zwischen Sitz und Lehne bei y = 0 an der
    Unterkante der Polster; die Lehne steigt um `lehne` Grad zum Kopf, der Sitz um `sitz` Grad zu den Füßen. Polster
    „Lehne“ und „Sitz“ auf Platten, Rahmen mit Träger, Füßen, Stütze unter dem Gelenk und Strebe unter der Lehne."""
    polster = _mat("Polster", GERAET, 0.8)
    rahmen = _mat("Rahmen", GERAET_HELL, 0.45, 0.4)
    b = BANK
    wurzel = bpy.data.objects.new("Bank", None)
    bpy.context.scene.collection.objects.link(wurzel)
    gelenk = Vector((0, 0, b["oben"] - b["dicke"]))
    for name, winkel, laenge, richt in (("Lehne", lehne, b["lehne"], 1), ("Sitz", -sitz, b["sitz"], -1)):
        dreh = bpy.data.objects.new(f"{name}Dreh", None)
        bpy.context.scene.collection.objects.link(dreh)
        dreh.location = gelenk
        dreh.rotation_euler = Euler((math.radians(winkel), 0, 0))
        dreh.parent = wurzel
        _kasten(name, (b["breite"], laenge, b["dicke"]), Vector((0, richt * (b["spalt"] / 2 + laenge / 2), b["dicke"] / 2)),
                polster, 0.02, dreh)
        _kasten(f"{name}Platte", (0.10, laenge - 0.06, 0.02), Vector((0, richt * (b["spalt"] / 2 + laenge / 2), -0.01)),
                rahmen, 0.004, dreh)
    _kasten("Traeger", (0.08, 1.10, 0.05), Vector((0, 0.0, 0.055)), rahmen, 0.005, wurzel)
    for y in (-0.52, 0.52):
        _kasten("Fuss", (0.42, 0.06, 0.04), Vector((0, y, 0.02)), rahmen, 0.005, wurzel)
    _kasten("Stuetze", (0.06, 0.06, gelenk.z - 0.08), Vector((0, 0, (gelenk.z + 0.08) / 2)), rahmen, 0.005, wurzel)
    if lehne > 1.0:
        a = math.radians(lehne)
        oben = gelenk + Vector((0, math.cos(a), math.sin(a))) * (b["lehne"] * 0.55) - Vector((0, -math.sin(a), math.cos(a))) * 0.02
        unten = Vector((0, oben.y + 0.05, 0.08))
        strebe = _kasten("Strebe", (0.05, 0.05, (oben - unten).length), (oben + unten) / 2, rahmen, 0.004, wurzel)
        strebe.rotation_euler = Euler((math.atan2(-(oben - unten).y, (oben - unten).z), 0, 0))
    return wurzel


# Beinpresse 45° (D-464), Maße nach Herstellerangaben: Grundfläche wie Hammer Strength Linear Leg Press (241 × 165 ×
# 145 cm) und Precor DPL0601 (244 × 145 × 145 cm), Fußplatte wie Bodykore G277 (28,35 × 19,92 Zoll, 72 × 50 cm),
# Schlitten auf Schienen unter 45°, Lehne verstellbar (Benchfit Exceed ISO: 30 bis 50°)
BEINPRESSE = {"platte": (0.72, 0.50, 0.03), "schiene": 45.0, "polster_breite": 0.38, "polster_dicke": 0.07,
              "sitz": 0.40, "lehne": 0.85, "schienen_abstand": 0.56, "griff": (0.016, 0.30)}


def _quader(name: str, groesse: tuple[float, float, float], mitte: Vector, drehung, mat, rund: float = 0.0,
            eltern=None) -> bpy.types.Object:
    """Kasten mit Mitte `mitte` (Welt) und Ausrichtung `drehung` (3 × 3: Spalten sind die Richtungen von x, y, z des
    Kastens)."""
    obj = _kasten(name, groesse, Vector(), mat, rund)
    obj.matrix_world = Matrix.Translation(mitte) @ drehung.to_4x4()
    if eltern is not None:
        welt = obj.matrix_world.copy()
        obj.parent = eltern
        obj.matrix_world = welt
    return obj


def _stab(name: str, von: Vector, nach: Vector, radius: float, mat, eltern=None, ecken: int = 32) -> bpy.types.Object:
    """Zylinder von `von` nach `nach` (Welt)."""
    obj = _zylinder(name, radius, (nach - von).length, Vector(), "z", mat, ecken=ecken)
    obj.matrix_world = Matrix.Translation((von + nach) / 2) @ (nach - von).to_track_quat("Z", "Y").to_matrix().to_4x4()
    if eltern is not None:
        welt = obj.matrix_world.copy()
        obj.parent = eltern
        obj.matrix_world = welt
    return obj


def beinpresse(ecke: Vector, lehne: float, sitz: float, platte: Vector, weg: tuple[float, float],
               griffe: dict[str, Vector]) -> dict:
    """Beinpresse 45°, Person mit dem Kopf nach +y, die Platte vorn oben bei -y (D-464).

    `ecke`: Ecke zwischen den Oberflächen von Sitz und Lehne (Welt); die Lehne steigt um `lehne` Grad nach +y, der
    Sitz um `sitz` Grad nach -y. `platte`: Mitte der Oberfläche der Fußplatte in der Ausgangsstellung des Schlittens;
    der Schlitten fährt längs der Schienen (`schiene` Grad, nach -y und oben) um `weg` (kleinster und größter Abstand
    von der Ausgangsstellung, m, negativ zur Person hin). `griffe`: je Seite Mitte und Richtung eines Haltegriffs
    (Welt). Gibt Wurzel, Schlitten (Leerobjekt an der Mitte der Plattenoberfläche, wird je Bild verschoben), Polster
    von Lehne und Sitz und die Richtungen der Schiene zurück."""
    b = BEINPRESSE
    polster = _mat("Polster", GERAET, 0.8)
    rahmen = _mat("Rahmen", GERAET_HELL, 0.45, 0.4)
    stahl = _mat("Stahl", GERAET_HELL, 0.35, 0.6)
    eisen = _mat("Eisen", GERAET, 0.55, 0.2)
    gummi = _mat("Gummi", GERAET, 0.7)
    wurzel = bpy.data.objects.new("Beinpresse", None)
    bpy.context.scene.collection.objects.link(wurzel)
    X = Vector((1, 0, 0))
    r = math.radians(b["schiene"])
    d = Vector((0, -math.cos(r), math.sin(r)))  # längs der Schiene, von der Person weg
    q = Vector((0, math.sin(r), math.cos(r)))  # in der Platte nach oben
    # Polster: Lehne und Sitz als Kästen, Oberfläche durch die Ecke
    a, s = math.radians(lehne), math.radians(sitz)
    d_lehne, n_lehne = Vector((0, math.cos(a), math.sin(a))), Vector((0, -math.sin(a), math.cos(a)))
    d_sitz, n_sitz = Vector((0, -math.cos(s), math.sin(s))), Vector((0, -math.sin(s), -math.cos(s)))
    n_sitz = -n_sitz if n_sitz.z < 0 else n_sitz
    dicke, breite = b["polster_dicke"], b["polster_breite"]
    R_lehne = Matrix((X, d_lehne, n_lehne)).transposed()
    R_sitz = Matrix((X, d_sitz, n_sitz)).transposed()
    lehne_obj = _quader("Lehne", (breite, b["lehne"], dicke), ecke + d_lehne * (b["lehne"] / 2 + 0.01) - n_lehne * (dicke / 2),
                        R_lehne, polster, 0.025, wurzel)
    sitz_obj = _quader("Sitz", (breite, b["sitz"], dicke), ecke + d_sitz * (b["sitz"] / 2 + 0.01) - n_sitz * (dicke / 2),
                       R_sitz, polster, 0.025, wurzel)
    for teil, R, laenge, rich, n in (("Lehne", R_lehne, b["lehne"], d_lehne, n_lehne), ("Sitz", R_sitz, b["sitz"], d_sitz, n_sitz)):
        _quader(f"{teil}Platte", (0.12, laenge - 0.06, 0.02), ecke + rich * (laenge / 2 + 0.01) - n * (dicke + 0.01), R, rahmen,
                0.004, wurzel)
    # Rahmen unter Sitz und Lehne: Träger am Boden, Stützen
    unter_sitz = ecke + d_sitz * (b["sitz"] / 2) - n_sitz * (dicke + 0.02)
    unter_lehne = ecke + d_lehne * (b["lehne"] * 0.6) - n_lehne * (dicke + 0.02)
    for name, oben in (("Sitzstuetze", unter_sitz), ("Lehnenstuetze", unter_lehne)):
        _stab(name, Vector((0, oben.y, 0.06)), oben, 0.03, rahmen, wurzel, ecken=16)
    # Schienen: zwei Rohre unter dem Schlitten, von vorn am Sitz bis über den größten Weg hinaus
    unten_mitte = platte + d * (weg[0] - 0.30) - q * 0.30
    oben_mitte = platte + d * (weg[1] + 0.20) - q * 0.30
    for seite in (-1, 1):
        o = X * (seite * b["schienen_abstand"] / 2)
        _stab("Schiene", unten_mitte + o, oben_mitte + o, 0.035, rahmen, wurzel, ecken=24)
        # Stütze am oberen Ende und Fuß am unteren Ende
        _stab("Schienenstuetze", Vector((o.x, oben_mitte.y, 0.06)), oben_mitte + o - d * 0.05, 0.035, rahmen, wurzel, ecken=16)
        _stab("Schienenfuss", Vector((o.x, unten_mitte.y, 0.06)), unten_mitte + o, 0.035, rahmen, wurzel, ecken=16)
    # Grundrahmen: Längsträger von hinter der Lehne bis unter das obere Ende, Querträger
    y_hinten = (ecke + d_lehne * b["lehne"]).y + 0.05  # bis unter das Ende der Lehne
    y_vorn = oben_mitte.y - 0.10
    for seite in (-1, 1):
        _kasten("Grundtraeger", (0.08, y_hinten - y_vorn, 0.06), Vector((seite * 0.34, (y_hinten + y_vorn) / 2, 0.03)), rahmen,
                0.005, wurzel)
    for y in (y_hinten - 0.04, unten_mitte.y, oben_mitte.y, unter_sitz.y):
        _kasten("Quertraeger", (0.76, 0.06, 0.06), Vector((0, y, 0.06)), rahmen, 0.005, wurzel)
    # Haltegriffe neben dem Sitz, je mit einem Halter an beiden Enden zum Sitzrahmen
    for mitte, richtung in griffe.values():
        halb = richtung.normalized() * (b["griff"][1] / 2)
        _stab("Griff", mitte - halb, mitte + halb, b["griff"][0], gummi, wurzel)
        for ende in (mitte - halb, mitte + halb):
            _stab("Griffhalter", ende, Vector((math.copysign(breite / 2 - 0.02, mitte.x), ende.y, ende.z)), 0.015, rahmen, wurzel,
                  ecken=16)
    # Schlitten: Leerobjekt an der Mitte der Plattenoberfläche, Platte, Wagen, Hörner mit Scheiben
    schlitten = bpy.data.objects.new("Schlitten", None)
    bpy.context.scene.collection.objects.link(schlitten)
    schlitten.parent = wurzel
    R_platte = Matrix((X, q, -d)).transposed()  # z des Kastens zeigt zur Person
    schlitten.matrix_world = Matrix.Translation(platte) @ R_platte.to_4x4()
    pw, ph, pd = b["platte"]

    def lokal(p: Vector) -> Vector:  # Welt → Raum des Schlittens in der Ausgangsstellung
        return R_platte.transposed() @ (p - platte)

    _kasten("Fussplatte", (pw, ph, pd), Vector((0, 0, -pd / 2)), _mat("Platte", GERAET, 0.75), 0.006, schlitten)
    _kasten("Wagen", (b["schienen_abstand"] + 0.10, 0.20, 0.16), lokal(platte - q * 0.22 + d * 0.11), rahmen, 0.01, schlitten)
    _kasten("Plattenstuetze", (0.50, 0.08, 0.10), lokal(platte + d * 0.06), rahmen, 0.008, schlitten)
    for seite in (-1, 1):
        # Hörner seitlich am Wagen, mit den Scheiben etwa so breit wie die Vorbilder (145 bis 165 cm)
        fuss = platte - q * 0.22 + d * 0.11 + X * (seite * (b["schienen_abstand"] / 2 + 0.05))
        spitze = fuss + X * (seite * 0.42)
        _stab("Horn", fuss, spitze, 0.025, stahl, schlitten)
        for i, dicke_s in enumerate((0.035, 0.035)):
            m = fuss + X * (seite * (0.26 + i * 0.04 + dicke_s / 2))
            _stab("Scheibe", m - X * (dicke_s / 2), m + X * (dicke_s / 2), 0.225, eisen, schlitten, ecken=96)
    return {"wurzel": wurzel, "schlitten": schlitten, "polster": [lehne_obj, sitz_obj], "d": d, "q": q,
            "R_platte": R_platte}
