"""Frisur, Bart und Brauen als Haarkurven (Blender „Curves“, in Cycles als Haar gerendert) für die
personalisierte Variante (Korrekturrunde 5, D-442).

Statt Haarnetzen mit Bild (MakeHuman) oder Zonen der Haut (D-438) entstehen hier echte Strähnen aus
dem Netz der Figur in der Grundhaltung: Wurzeln auf den Flächen der Kopfhaut, des Bartfelds und der
Brauen, je Strähne eine Linie aus mehreren Punkten, die der Kopfform folgt. Die Regionen kommen aus
den Landmarken des Grundmodells (`gesicht-marken.json`, `gesicht.py`); die Ohren erkennt das Modul an
der dichten Vernetzung des Grundmodells. Die Parameter beschreiben die Frisur des Referenzblatts: kurz,
oben voll und nach hinten-oben gestylt mit leichter Welle, Seiten und Nacken kurz mit weichem
Übergang, Haaransatz tief; kurzer voller Bart mit klarer Wangenlinie, unter dem Kiefer begrenzt;
dichte, fast gerade Brauen. Alles ist Konfiguration, keine Bilddaten einer Person.

Die Kurvenobjekte hängen am Skelett und folgen dem Kopfknochen starr (`Rig.folger`, Eigenschaft
„folgt“); Kopf, Kiefer und Brauen bewegen sich in den Übungen nicht gegeneinander. Der Hals bleibt
frei, darum berühren die Strähnen weder Kragen noch Stange.
"""
from __future__ import annotations

import math

import bpy
import numpy as np
from mathutils import Vector, kdtree

import gesicht

FRISUR = {
    "ansatz_stirn": 0.18,  # Haaransatz über den Brauen, Anteil der Höhe Brauen→Kinn (Referenzblatt rund 0,29, Haut darunter sichtbar)
    "ansatz_schlaefe": 0.008,  # an den Schläfen (50° seitlich) so viel höher: leichte Ecken (m)
    "kotelette": 0.0,  # Koteletten enden auf Augenhöhe plus so viel (m)
    "nacken_unter_subnasale": 0.012,  # Nackenansatz unter der Nasenbasis (m)
    "kamm": 0.42,  # Kante Deckhaar/Seiten an den Seiten, Anteil der Höhe Brauen→Scheitel
    "kamm_breite": 0.022,  # Übergang Deckhaar/Seiten über so viel Höhe (m)
    "laenge_deck_vorn": 0.056, "laenge_deck_hinten": 0.034, "laenge_seite": 0.014, "laenge_nacken": 0.009,
    "volumen_vorn": 0.024, "volumen_hinten": 0.010, "volumen_seite": 0.0035,  # Abstand der Spitzen von der Kopfhaut (m)
    "auf_vorn": 0.6, "auf_hinten": -0.5,  # Anteil nach oben in der Richtung des Deckhaars (vorn steil, hinten anliegend)
    "uebergang_seite": 0.022, "uebergang_stirn": 0.008,  # Länge wächst vom Haaransatz über so viel (m)
    "welle": 0.0025, "welle_laenge": 0.028, "buendel": 0.8, "buendel_je": 24,  # Welle und Strähnenbündel
    "straehnen": 40000, "punkte": 10, "radius": (0.00036, 0.00014), "seiten_dichte": 1.7,
    "melanin": 0.82, "roetung": 0.58, "zufall": 0.1,
}
BART = {
    "laenge_dicht": 0.005, "laenge_wange": 0.0035, "laenge_hals": 0.0025, "neigung": 15.0,  # Grad zur Haut
    "straehnen": 36000, "punkte": 5, "radius": (0.00012, 0.00005), "welle": 0.0008,
    "melanin": 0.95, "roetung": 0.4, "zufall": 0.08,
}
BRAUEN = {
    "laenge_innen": 0.0055, "laenge_aussen": 0.004, "neigung": 8.0, "halbbreite": 0.0028, "rand": 0.0012,
    "straehnen": 2600, "punkte": 5, "radius": (0.00008, 0.00004), "melanin": 0.96, "roetung": 0.4, "zufall": 0.06,
}
UP, VORN, RECHTS = Vector((0, 0, 1)), Vector((0, -1, 0)), Vector((-1, 0, 0))  # Grundhaltung: Blick nach −y, links +x


def ohren(V: np.ndarray, zuordnung: list) -> set[int]:
    """Eckpunkte der Ohren: Im Grundmodell ist das Ohr viel dichter vernetzt als die Kopfhaut (Nachbarn
    1 bis 3 mm statt 5 bis 8 mm). Gesucht wird seitlich am Kopf (60° bis 135° von vorn) in der Höhe
    der Ohren, dazu ein Saum von 4 mm um die dichten Punkte. Die Ohr-Formziele von MakeHuman taugen
    nicht als Maske: Sie verschieben auch die Haut der halben Kopfseite."""
    L = lambda n: gesicht._marke(V, zuordnung, n)
    mitte = (L(234) + L(454)) / 2
    z_lo, z_hi = L(2)[2] - 0.02, (L(105)[2] + L(334)[2]) / 2 + 0.02
    kand = [i for i, (x, y, z) in enumerate(V) if z_lo < z < z_hi and abs(x) > 0.045
            and 60 <= math.degrees(math.atan2(abs(x - mitte[0]), -(y - mitte[1]))) <= 135]
    if not kand:
        return set()
    baum = kdtree.KDTree(len(kand))
    for n, i in enumerate(kand):
        baum.insert(Vector(V[i]), n)
    baum.balance()
    dicht = []
    for n, i in enumerate(kand):
        nachbarn = baum.find_n(Vector(V[i]), 7)[1:]
        if nachbarn and sum(d for _, _, d in nachbarn) / len(nachbarn) < 0.0033:
            dicht.append(i)
    saum = set(dicht)
    for i in dicht:
        for _, n, _ in baum.find_range(Vector(V[i]), 0.004):
            saum.add(kand[n])
    return saum


def _flaechen(koerper: bpy.types.Object, V: np.ndarray):
    """Flächen des Netzes als Eckpunktlisten, Normalen und Flächeninhalte (Grundhaltung)."""
    polys = [list(p.vertices) for p in koerper.data.polygons]
    normalen, flaechen = [], []
    for ecken in polys:
        p = V[ecken]
        n = np.cross(p[1] - p[0], p[2] - p[0]) + (np.cross(p[2] - p[0], p[3] - p[0]) if len(ecken) > 3 else 0.0)
        a = np.linalg.norm(n) / 2
        normalen.append(n / (np.linalg.norm(n) or 1e-9))
        flaechen.append(a)
    return polys, np.array(normalen), np.array(flaechen)


def _wurzeln(V, polys, normalen, flaechen, gewicht: np.ndarray, n: int, rng: np.random.Generator):
    """`n` Wurzeln auf den Flächen, Wahrscheinlichkeit Flächeninhalt mal Gewicht (0 bis 1 je Fläche):
    Lage, Normale, Flächennummer."""
    w = flaechen * gewicht
    if w.sum() <= 0:
        return np.zeros((0, 3)), np.zeros((0, 3)), np.zeros(0, dtype=int)
    wahl = rng.choice(len(polys), size=n, p=w / w.sum())
    lagen, norms = [], []
    for f in wahl:
        ecken = polys[f]
        p = V[ecken]
        if len(ecken) == 4:
            # Viereck: bilinear, gleichmäßig genug für Haare
            u, v = rng.random(), rng.random()
            q = (1 - u) * (1 - v) * p[0] + u * (1 - v) * p[1] + u * v * p[2] + (1 - u) * v * p[3]
        else:
            a, b = rng.random(), rng.random()
            if a + b > 1:
                a, b = 1 - a, 1 - b
            q = p[0] + a * (p[1] - p[0]) + b * (p[2] - p[0])
        lagen.append(q)
        norms.append(normalen[f])
    return np.array(lagen), np.array(norms), wahl


def _glatt(a: float, b: float, x) -> np.ndarray | float:
    t = np.clip((x - a) / ((b - a) or 1e-9), 0.0, 1.0)
    return t * t * (3 - 2 * t)


def _kurven(name: str, straehnen: list[np.ndarray], radius: tuple[float, float], material, skelett) -> bpy.types.Object:
    """Kurvenobjekt aus Strähnen (je n × 3 Punkte, Raum des Skeletts), Radius von Wurzel zu Spitze."""
    cu = bpy.data.hair_curves.new(name)
    cu.add_curves([len(s) for s in straehnen])
    lagen = np.concatenate(straehnen).astype(np.float32).ravel()
    cu.attributes["position"].data.foreach_set("vector", lagen)
    rad = cu.attributes.get("radius") or cu.attributes.new("radius", "FLOAT", "POINT")
    werte = np.concatenate([np.linspace(radius[0], radius[1], len(s)) for s in straehnen]).astype(np.float32)
    rad.data.foreach_set("value", werte)
    obj = bpy.data.objects.new(name, cu)
    bpy.context.scene.collection.objects.link(obj)
    obj.parent = skelett
    obj["folgt"] = "head"
    cu.materials.append(material)
    return obj


def haar_material(name: str, melanin: float, roetung: float, zufall: float) -> bpy.types.Material:
    """Haar nach Farbstoff (Principled Hair, Cycles): Melanin 0 hell bis 1 schwarz."""
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    for n in list(nodes):
        if n.type != "OUTPUT_MATERIAL":
            nodes.remove(n)
    haar = nodes.new("ShaderNodeBsdfHairPrincipled")
    haar.parametrization = "MELANIN"
    haar.inputs["Melanin"].default_value = melanin
    haar.inputs["Melanin Redness"].default_value = roetung
    haar.inputs["Roughness"].default_value = 0.32
    haar.inputs["Radial Roughness"].default_value = 0.3
    haar.inputs["Coat"].default_value = 0.4
    haar.inputs["Random Color"].default_value = zufall
    haar.inputs["Random Roughness"].default_value = 0.15
    links.new(haar.outputs[0], nodes["Material Output"].inputs["Surface"])
    return mat


def _tangenten(n: np.ndarray):
    """Tangenten an der Wurzel: nach oben, nach hinten und nach links (im Raum des Skeletts)."""
    def proj(v):
        w = v - (v @ n) * n
        return w / (np.linalg.norm(w) or 1e-9)
    return proj(np.array(UP)), proj(-np.array(VORN)), proj(-np.array(RECHTS))


# ---------------------------------------------------------------------- Frisur


def frisur(koerper, skelett, V: np.ndarray, zuordnung: list, ohren: set[int], p: dict = FRISUR, saat: int = 7):
    """Kopfhaar nach dem Referenzblatt. Region: Kopfhaut über dem Haaransatz (Höhe je Winkel um den Kopf:
    Stirn, Schläfen, Koteletten bis Augenhöhe, hinter dem Ohr zum Nacken), ohne Ohren. Deckhaar lang,
    nach hinten-oben mit Volumen und Welle in Bündeln; Seiten und Nacken kurz, vom Haaransatz her
    weich länger werdend."""
    rng = np.random.default_rng(saat)
    L = lambda n: gesicht._marke(V, zuordnung, n)
    z_braue = (L(105)[2] + L(334)[2]) / 2
    z_kinn, z_sub = L(152)[2], L(2)[2]
    z_auge = (L(159)[2] + L(145)[2] + L(386)[2] + L(374)[2]) / 4
    mitte = (L(234) + L(454)) / 2  # Ohrhöhe, Kopfmitte quer
    z_front = z_braue + p["ansatz_stirn"] * (z_braue - z_kinn)
    z_seite = z_auge + p["kotelette"]
    z_nacken = z_sub - p["nacken_unter_subnasale"]
    kopf = {i for i, (x, y, z) in enumerate(V) if z > z_nacken - 0.03 and abs(x) < 0.12 and abs(y - mitte[1]) < 0.14}
    z_top = max(V[i][2] for i in kopf)

    def winkel(q):  # 0 vorn, 180 hinten
        return math.degrees(math.atan2(abs(q[0] - mitte[0]), -(q[1] - mitte[1]))) if True else 0.0

    def ansatz(th: float) -> float:
        if th <= 50:
            return z_front + p["ansatz_schlaefe"] * (th / 50) ** 2
        if th <= 95:
            return z_front + p["ansatz_schlaefe"] + (z_seite - z_front - p["ansatz_schlaefe"]) * _glatt(50, 95, th)
        if th <= 135:
            return z_seite + (z_nacken - z_seite) * _glatt(95, 135, th)
        return z_nacken - 0.004 * _glatt(135, 180, th)

    z_kamm_seite = z_braue + p["kamm"] * (z_top - z_braue)  # Kante vom Deckhaar zu den Seiten

    def kamm(th: float) -> float:
        return z_front - 0.03 + (z_kamm_seite - z_front + 0.03) * _glatt(15, 75, th)

    polys, normalen, flaechen = _flaechen(koerper, V)
    gewicht = np.zeros(len(polys))
    for f, ecken in enumerate(polys):
        if any(e in ohren for e in ecken) or not all(e in kopf for e in ecken):
            continue
        q = V[ecken].mean(axis=0)
        th = winkel(q)
        d = q[2] - ansatz(th)
        if d <= 0:
            continue
        deck_f = float(_glatt(kamm(th) - p["kamm_breite"], kamm(th) + p["kamm_breite"], q[2]))
        gewicht[f] = (0.55 + 0.45 * _glatt(0.0, 0.02, d)) * (1.0 + (p["seiten_dichte"] - 1.0) * (1.0 - deck_f))  # Seiten dichter
    wurzeln, norms, _ = _wurzeln(V, polys, normalen, flaechen, gewicht, p["straehnen"], rng)
    baum = kdtree.KDTree(len(wurzeln))
    for i, w in enumerate(wurzeln):
        baum.insert(Vector(w), i)
    baum.balance()
    # Bündel: je `buendel_je` Strähnen eine Führung, Nachbarn gleicher Welle
    n_b = max(1, len(wurzeln) // p["buendel_je"])
    fuehrung = rng.choice(len(wurzeln), size=n_b, replace=False)
    fbaum = kdtree.KDTree(n_b)
    for k, i in enumerate(fuehrung):
        fbaum.insert(Vector(wurzeln[i]), k)
    fbaum.balance()
    phase_b = rng.random(n_b) * 2 * math.pi
    kurven = []
    t = np.linspace(0.0, 1.0, p["punkte"])

    def straehne(i: int, buendel_k: int | None):
        r, n = wurzeln[i], norms[i]
        th = winkel(r)
        d = r[2] - ansatz(th)
        deck = float(_glatt(kamm(th) - p["kamm_breite"], kamm(th) + p["kamm_breite"], r[2]))
        vorn = float(1.0 - _glatt(30.0, 125.0, th))
        laenge_deck = p["laenge_deck_vorn"] * vorn + p["laenge_deck_hinten"] * (1 - vorn)
        kurz = p["laenge_seite"] if th < 125 else p["laenge_nacken"]
        uebergang = p["uebergang_stirn"] if th < 40 else p["uebergang_seite"]
        kurz *= 0.25 + 0.75 * float(_glatt(0.0, uebergang, d))
        laenge = kurz * (1 - deck) + laenge_deck * deck * (0.35 + 0.65 * float(_glatt(0.0, uebergang, d)))
        laenge *= 0.85 + 0.3 * rng.random()
        hoch, hinten, links = _tangenten(n)
        auf = p["auf_vorn"] * vorn + p["auf_hinten"] * (1 - vorn)  # vorn nach oben, am Hinterkopf anliegend
        s_deck = hinten * 1.0 + hoch * auf
        s_seite = hinten * 0.75 - hoch * 0.75 if th < 125 else -hoch
        s = s_deck * deck + s_seite * (1 - deck)
        s /= np.linalg.norm(s) or 1e-9
        vol = (p["volumen_vorn"] * vorn + p["volumen_hinten"] * (1 - vorn)) * deck + p["volumen_seite"] * (1 - deck)
        vol *= laenge / max(laenge_deck, 1e-6) if deck > 0.5 else 1.0
        # Hebung: Deckhaar steigt bis zur Mitte der Strähne und legt sich dann zurück auf die Haarmasse
        # (Tolle); Seiten liegen an
        f_auf = (np.sin(np.pi * t) * (1.0 - 0.4 * t) + 0.35 * t) * deck + (1 - (1 - t) ** 2) * (1 - deck)
        heb = n * (1.0 - 0.75 * deck) + np.array(UP) * (0.75 * deck)  # Deckhaar steigt nach oben, nicht nach vorn
        heb /= np.linalg.norm(heb) or 1e-9
        seite = np.cross(s, n)
        k_welle = laenge / p["welle_laenge"]
        ph = phase_b[buendel_k] if buendel_k is not None else rng.random() * 2 * math.pi
        welle = p["welle"] * (0.4 + 0.6 * deck) * t
        pts = (r[None, :] + 0.0006 * n[None, :] + s[None, :] * (laenge * t)[:, None] + heb[None, :] * (vol * f_auf)[:, None]
               + seite[None, :] * (welle * np.sin(2 * math.pi * k_welle * t + ph))[:, None]
               + n[None, :] * (0.5 * welle * np.cos(2 * math.pi * k_welle * t + ph + 1.0))[:, None])
        return pts

    guides = {k: straehne(i, None) for k, i in enumerate(fuehrung)}
    for i in range(len(wurzeln)):
        _, k, _ = fbaum.find(Vector(wurzeln[i]))
        pts = straehne(i, k)
        g = guides[k]
        c = p["buendel"] * t[:, None] ** 2
        pts = pts * (1 - c) + (g + (wurzeln[i] - wurzeln[fuehrung[k]])[None, :] * (1 - t)[:, None]) * c
        # nicht in die Kopfhaut: über der nächsten Wurzel mindestens 0,8 mm
        for j in range(1, len(pts)):
            q = Vector(pts[j])
            _, idx, _ = baum.find(q)
            tief = float((pts[j] - wurzeln[idx]) @ norms[idx])
            if tief < 0.0008:
                pts[j] = pts[j] + norms[idx] * (0.0008 - tief)
        kurven.append(pts)
    mat = haar_material("Haare", p["melanin"], p["roetung"], p["zufall"])
    return _kurven("Haare", kurven, p["radius"], mat, skelett), len(kurven)


# ---------------------------------------------------------------------- Bart und Brauen


def bart(koerper, skelett, V: np.ndarray, zuordnung: list, p: dict = BART, saat: int = 11):
    """Kurzer voller Bart: Region aus `gesicht.bart_gewichte` (Wangenlinie, Schnurrbart mit Kinn
    verbunden, unter dem Kiefer begrenzt), Strähnen schräg zur Haut, am Kinn länger."""
    rng = np.random.default_rng(saat)
    w_ecke = gesicht.bart_gewichte(V, zuordnung)
    polys, normalen, flaechen = _flaechen(koerper, V)
    gewicht = np.array([w_ecke[ecken].mean() for ecken in polys])
    gewicht[gewicht < 0.15] = 0.0
    wurzeln, norms, wahl = _wurzeln(V, polys, normalen, flaechen, gewicht, p["straehnen"], rng)
    L = lambda n: gesicht._marke(V, zuordnung, n)
    z_mund = (L(61)[2] + L(291)[2]) / 2
    z_kinn = L(152)[2]
    t = np.linspace(0.0, 1.0, p["punkte"])
    neig = math.radians(p["neigung"])
    kurven = []
    for r, n, f in zip(wurzeln, norms, wahl):
        hoch, hinten, links = _tangenten(n)
        dicht = gewicht[f] > 0.97
        if r[2] > z_mund - 0.006 and abs(r[0]) < 0.03:  # Schnurrbart: zur Seite und nach unten
            s = -hoch * 0.7 + links * (0.6 if r[0] > 0 else -0.6)
            laenge = p["laenge_dicht"]
        elif r[2] < z_kinn - 0.008:  # unter dem Kiefer: nach hinten-unten, kurz
            s = -hoch * 0.6 + hinten * 0.5
            laenge = p["laenge_hals"]
        else:
            s = -hoch * 0.85 + hinten * 0.3
            laenge = p["laenge_dicht"] if dicht else p["laenge_wange"]
        s /= np.linalg.norm(s) or 1e-9
        laenge *= 0.7 + 0.6 * rng.random()
        seite = np.cross(s, n)
        ph = rng.random() * 2 * math.pi
        pts = (r[None, :] + s[None, :] * (laenge * math.cos(neig) * t)[:, None] + n[None, :] * (laenge * math.sin(neig) * t)[:, None]
               + seite[None, :] * (p["welle"] * t * np.sin(2 * math.pi * 1.5 * t + ph))[:, None])
        kurven.append(pts)
    mat = haar_material("Bart", p["melanin"], p["roetung"], p["zufall"])
    return _kurven("Bart", kurven, p["radius"], mat, skelett), len(kurven)


def brauen(koerper, skelett, V: np.ndarray, zuordnung: list, p: dict = BRAUEN, saat: int = 13):
    """Dichte, fast gerade Brauen: Band um die Brauenlinie der Landmarken, Strähnen liegen flach und
    laufen von innen nach außen (innen etwas nach oben, außen leicht nach unten)."""
    rng = np.random.default_rng(saat)
    alt = dict(gesicht.BRAUE)
    gesicht.BRAUE.update({"halbbreite": p["halbbreite"], "rand": p["rand"]})
    try:
        w_ecke = gesicht.brauen_gewichte(V, zuordnung)
    finally:
        gesicht.BRAUE.update(alt)
    polys, normalen, flaechen = _flaechen(koerper, V)
    gewicht = np.array([w_ecke[ecken].mean() for ecken in polys])
    gewicht[gewicht < 0.2] = 0.0
    L = lambda n: gesicht._marke(V, zuordnung, n)
    innen = {"l": L(336), "r": L(107)}
    aussen = {"l": L(300), "r": L(70)}
    for f, ecken in enumerate(polys):  # außen schmaler und lichter
        if gewicht[f] > 0:
            q = V[ecken].mean(axis=0)
            a, b = (innen["l"], aussen["l"]) if q[0] > 0 else (innen["r"], aussen["r"])
            u = float(np.clip(((q - a) @ (b - a)) / ((b - a) @ (b - a) or 1e-9), 0.0, 1.0))
            gewicht[f] *= 1.0 - 0.45 * u
    wurzeln, norms, _ = _wurzeln(V, polys, normalen, flaechen, gewicht, p["straehnen"], rng)
    t = np.linspace(0.0, 1.0, p["punkte"])
    neig = math.radians(p["neigung"])
    kurven = []
    for r, n in zip(wurzeln, norms):
        seite = "l" if r[0] > 0 else "r"
        a, b = innen[seite], aussen[seite]
        u = float(np.clip(((r - a) @ (b - a)) / ((b - a) @ (b - a) or 1e-9), 0.0, 1.0))  # 0 innen, 1 außen
        richtung = (b - a) / (np.linalg.norm(b - a) or 1e-9)
        richtung = richtung - (richtung @ n) * n
        hoch, _, _ = _tangenten(n)
        s = richtung + hoch * (0.7 * (1 - u) - 0.25 * u)
        s /= np.linalg.norm(s) or 1e-9
        laenge = (p["laenge_innen"] * (1 - u) + p["laenge_aussen"] * u) * (0.75 + 0.5 * rng.random())
        pts = r[None, :] + s[None, :] * (laenge * math.cos(neig) * t)[:, None] + n[None, :] * (laenge * math.sin(neig) * t)[:, None]
        kurven.append(pts)
    mat = haar_material("Brauen", p["melanin"], p["roetung"], p["zufall"])
    return _kurven("Brauen", kurven, p["radius"], mat, skelett), len(kurven)


FLECK = {"seite": "links", "neben_nase": 0.011, "unter_nase": 0.002, "radius": 0.0016, "farbe": (0.10, 0.055, 0.04)}


def leberfleck(koerper, skelett, V: np.ndarray, zuordnung: list, p: dict = FLECK) -> bpy.types.Object:
    """Leberfleck als kleine, flache Kugel auf der Haut (D-442): seitlich neben dem Nasenflügel auf
    Nasenbasishöhe, etwas über dem Mundwinkel (Referenzblatt: linke Wange). Bis D-439 war er ein
    Gewicht je Eckpunkt mit 3,5 mm Radius und traf auf dem groben Gesichtsnetz keinen Eckpunkt."""
    links = p["seite"] == "links"
    nase = gesicht._marke(V, zuordnung, 358 if links else 129)
    ziel_x = nase[0] + (p["neben_nase"] if links else -p["neben_nase"])
    ziel_z = nase[2] - p["unter_nase"]
    kand = [i for i, (x, y, z) in enumerate(V) if abs(x - ziel_x) < 0.008 and abs(z - ziel_z) < 0.008 and y < nase[1] + 0.03]
    i = min(kand, key=lambda i: V[i][1])  # vorderster Hautpunkt der Wange an dieser Stelle
    normale = Vector(koerper.data.vertices[i].normal) if i < len(koerper.data.vertices) else Vector((0, -1, 0))
    mitte = Vector(V[i]) + normale * (p["radius"] * 0.35)
    mesh = bpy.data.meshes.new("Fleck")
    import bmesh
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=12, v_segments=8, radius=p["radius"])
    bm.to_mesh(mesh)
    bm.free()
    for poly in mesh.polygons:
        poly.use_smooth = True
    obj = bpy.data.objects.new("Fleck", mesh)
    bpy.context.scene.collection.objects.link(obj)
    obj.parent = skelett
    obj.location = mitte
    obj.scale = (1.0, 1.0, 1.0)
    obj["folgt"] = "head"
    mat = bpy.data.materials.new("Fleck")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*p["farbe"], 1.0)
    bsdf.inputs["Roughness"].default_value = 0.6
    mesh.materials.append(mat)
    return obj


def erzeugen(koerper, skelett, V: np.ndarray, zuordnung: list, welche=("frisur", "bart", "brauen", "fleck")) -> list:
    """Kurvenobjekte und Leberfleck; die Ohren bleiben frei (`ohren`)."""
    ohr = ohren(V, zuordnung)
    teile = []
    if "fleck" in welche:
        teile.append(leberfleck(koerper, skelett, V, zuordnung))
    if "frisur" in welche:
        obj, n = frisur(koerper, skelett, V, zuordnung, ohr)
        print(f"Frisur: {n} Strähnen")
        teile.append(obj)
    if "bart" in welche:
        obj, n = bart(koerper, skelett, V, zuordnung)
        print(f"Bart: {n} Strähnen")
        teile.append(obj)
    if "brauen" in welche:
        obj, n = brauen(koerper, skelett, V, zuordnung)
        print(f"Brauen: {n} Strähnen")
        teile.append(obj)
    sc = bpy.context.scene
    if hasattr(sc, "cycles_curves"):
        sc.cycles_curves.shape = "RIBBONS"
        sc.cycles_curves.subdivisions = 2
    return teile
