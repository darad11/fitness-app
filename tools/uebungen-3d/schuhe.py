"""Socken und Schuhe nach dem Design-Board (D-450).

**Schuh** (Board unten rechts): weißer Sneaker, schwarzes FORM-F außen, schwarze Fersenkappe und
schwarzes Futter am Kragen, Fersenlasche in Lime; weiße Zwischensohle mit einem Einsatz in Lime an der
Ferse und einem schwarzen Keil davor, schwarze Laufsohle mit Zehenkappe; weiße Schnürung, ein kleines
schwarzes F oben auf der Zunge.

- **Schaft**: die Form `clothes/shoes05` von MakeHuman (CC0, aus dem Paket
  `makehuman_system_assets_cc0.zip` wie Haut und Haare, `docs/licenses-data.md` Abschnitt 8), an den Fuß
  angepasst wie Haare und Augen (`realistisch._lies_mhclo`: jeder Eckpunkt ein gewichtetes Mittel dreier
  Eckpunkte des Körpers plus Versatz) und mit den Gewichten aus `shoes05.mhw` am selben Skelett. Nur die
  Form wird übernommen: Das Bild von MakeHuman zeigt Streifen fremder Marken und bleibt ungenutzt;
  Farben, Aufteilung und Logo kommen vom Board. Die Socken der Datei entfallen.
- **Sohle**: eigener geschlossener Körper (D-451) um den unteren Teil des Schafts: dessen Umriss, nach
  außen versetzt (`SOHLE["wand"]`), senkrechte Wand vom Boden (`SOHLE["unter"]` unter dem Schaft) bis zur
  Oberkante, die zur Ferse steigt (`SOHLE["oben"]`), oben eine Lippe unter den Schaft. Die Figur steht so
  viel höher, wie die Sohle unter dem Fuß dick ist (`sohle_unter_fuss`).
- **Fersenlasche**: kleines eigenes Netz oben an der Ferse, in Lime.

**Socke** (Board unten links): weiße Crew-Socke aus dem Netz der Figur wie Shirt und Shorts (versetzt,
dieselben Gewichte, `kleidung._teil`), der Bund bei `SOCKE["bund"]` der Strecke Knöchel → Knie,
schwarzes F außen am Schaft, schwarze Spitze. Was im Schuh liegt, ist ausgeblendet (Attribut „ImSchuh“),
damit nichts durch den Schaft scheint; die Haut darunter blendet `kleidung.haut_ausblenden` aus.

Koordinaten am Schuh (Ruhehaltung): u längs (0 Ferse, 1 Spitze), h Höhe über dem Boden, q quer (positiv
außen). Links und rechts aus Sicht des Trägers (links = +x).
"""
from __future__ import annotations

import json
import math
import zipfile
from pathlib import Path

import bpy
import bmesh  # erst nach bpy verfügbar (Blender als Modul)
from mathutils import Vector

import figur
import kleidung
import realistisch
import szene

SCHUH = "clothes/shoes05"
QUELLE = realistisch.QUELLE
WEISS = "#EEEFF0"  # Schaft und Zwischensohle (Board, im Licht #B1AEAF bis #CBC8C7)
SCHWARZ = "#1C1E20"  # Fersenkappe, Futter, Laufsohle, Keil, Logos
LIME = szene.LIME
SCHNUERUNG = "#C9CCCF"  # Fugen der weißen Schnürung
SOCKE_WEISS = "#F0F0F0"
# Sohle: Wand nach außen, Boden so weit unter dem tiefsten Punkt des Schafts, Oberkante über dem Boden je u
# (m; Board: Sohle an der Ferse rund 38 % der Höhe des Schuhs, vorn rund ein Drittel); Richtungen des Umrisses
SOHLE = {"wand": ((0.0, 0.006), (0.35, 0.004), (1.0, 0.0035)), "unter": 0.010,
         "oben": ((0.0, 0.044), (0.25, 0.040), (0.5, 0.031), (0.75, 0.026), (1.0, 0.024))}
SOHLE_RINGE = 96
# Farben der Sohle (Board): Laufsohle unten (Höhe), an der Spitze höher (ab u, Höhe); Einsatz in Lime an
# der Ferse bis u und bis zu diesem Anteil der Sohlenhöhe; schwarzer Keil davor (von u bis u, Spitze oben
# bei diesem Anteil der Sohlenhöhe)
SOHLE_FARBEN = {"laufsohle": 0.0035, "kappe": (0.90, 0.012), "lime": (0.30, 0.62), "keil": (0.30, 0.40, 0.80)}
# Schwarze Fersenkappe (Board): Keil über der Sohle, hinten an der Ferse bis `h_ferse` hoch, schräg nach vorn
# unten bis zur Sohle bei u; darüber bleibt die Ferse bis zum Kragen weiß
FERSENKAPPE = {"u": 0.30, "h_ferse": 0.078, "h_sohle": 0.034}
# Schnürung oben auf dem Rist: von u bis u, halbe Breite (m), Abstand der Schnüre (m)
SCHNUER = {"von": 0.52, "bis": 0.74, "breite": 0.013, "abstand": 0.011, "schatten": (0.80, 0.90)}
# FORM-F außen: Mitte bei u und auf dieser Höhe über dem Boden, Höhe des F (Board: 0,42 der Höhe des
# Schafts dort); kleines F oben auf der Zunge
LOGO = {"u": 0.50, "h": 0.058, "hoehe": 0.030, "zunge": 0.011}
LASCHE = {"breite": 0.020, "hoehe": 0.026, "ueber": 0.016, "dicke": 0.003, "neigung": 12.0, "rund": 0.006}
# Socke: Bund bei diesem Anteil der Strecke Knöchel → Knie (Board: Höhe über dem Boden rund das 1,1-Fache
# der Fußlänge entlang des Schafts), Abstand zur Haut; F außen: Höhe in Breiten des Schafts, Mitte unter
# dem Bund in Anteilen der Schaftlänge
SCHAFT_DICKE = 0.002  # Dicke des Schafts nach innen (Futter), m
# Außenseite von Kragen und Zunge mindestens so weit über der Haut (Socke 3 mm, Schaft 2 mm, 2,5 mm Luft, damit
# auch in der Bewegung nichts in die Socke schneidet), m
KRAGEN_ABSTAND = 0.0075
SOCKE = {"bund": 0.45, "abstand": 0.0025, "f_hoehe": 0.39, "f_unter_bund": 0.16}
_SCHAEFTE: dict[str, dict] = {}


def hole() -> None:
    """Die Dateien des Schuhs aus dem Paket von MakeHuman auspacken (nicht im Repository)."""
    ordner = QUELLE / SCHUH
    if (ordner / "shoes05.obj").exists():
        return
    paket = QUELLE / realistisch.PAKET
    if not paket.exists():
        realistisch.hole()
    with zipfile.ZipFile(paket) as z:
        for name in z.namelist():
            if name.startswith(SCHUH + "/"):
                z.extract(name, QUELLE)


# ---------------------------------------------------------------------- Schaft und Koordinaten


def _schaft(name: str) -> dict:
    """Schaft beider Schuhe, an die Figur `name` angepasst (Ruhehaltung, Raum des Skeletts): Punkte,
    Flächen, Seite je Punkt ("L"/"R") und Gewichte je Punkt; dazu je Seite der Rahmen des Fußes."""
    if name in _SCHAEFTE:
        return _SCHAEFTE[name]
    hole()
    stamm = Path(SCHUH).name
    skal, refs = realistisch._lies_mhclo(QUELLE / SCHUH / f"{stamm}.mhclo")
    v, _, flaechen, _ = realistisch._lies_obj(QUELLE / SCHUH / f"{stamm}.obj")
    punkte = figur.PUNKTE[name]
    mh = {}

    def h(i: int):
        if i not in mh:
            mh[i] = realistisch._mh(punkte[i])
        return mh[i]

    s = []
    for achse, n in (("x", 0), ("y", 1), ("z", 2)):
        v1, v2, den = skal[achse]
        s.append(abs(h(v1)[n] - h(v2)[n]) / den)
    lage = []
    for idx, w, d in refs:
        X = sum(w[j] * h(idx[j])[0] for j in range(3)) + s[0] * d[0]
        Y = sum(w[j] * h(idx[j])[1] for j in range(3)) + s[1] * d[1]
        Z = sum(w[j] * h(idx[j])[2] for j in range(3)) + s[2] * d[2]
        lage.append(Vector((X * 0.1, -Z * 0.1, Y * 0.1)))
    # Zusammenhängende Teile: die zwei Schuhe (je rund 650 Punkte); die Socken von MakeHuman (je 144) entfallen
    eltern = list(range(len(lage)))

    def wurzel(a: int) -> int:
        while eltern[a] != a:
            eltern[a] = eltern[eltern[a]]
            a = eltern[a]
        return a

    for f in flaechen:
        for a in f[1:]:
            ra, rb = wurzel(f[0]), wurzel(a)
            if ra != rb:
                eltern[ra] = rb
    groesse: dict[int, int] = {}
    for i in range(len(lage)):
        groesse[wurzel(i)] = groesse.get(wurzel(i), 0) + 1
    behalten = [i for i in range(len(lage)) if groesse[wurzel(i)] > 400]
    neu = {alt: n for n, alt in enumerate(behalten)}
    gewichte: list[dict[str, float]] = [{} for _ in behalten]
    for knochen, paare in json.loads((QUELLE / SCHUH / f"{stamm}.mhw").read_text(encoding="utf-8"))["weights"].items():
        for i, wert in paare:
            if i in neu:
                gewichte[neu[i]][knochen] = wert
    daten = {
        "punkte": [lage[i] for i in behalten],
        "flaechen": [[neu[i] for i in f] for f in flaechen if all(i in neu for i in f)],
        "seite": ["L" if lage[i].x > 0 else "R" for i in behalten],
        "gewichte": gewichte,
    }
    daten["rahmen"] = {s: _fussrahmen([p for p, ss in zip(daten["punkte"], daten["seite"]) if ss == s], s) for s in "LR"}
    _SCHAEFTE[name] = daten
    return daten


def _fussrahmen(punkte: list[Vector], seite: str) -> dict:
    """Rahmen eines Schuhs in der Ruhehaltung: Längsachse (Ferse → Spitze, aus den Punkten nahe der
    Sohle), Querachse nach außen, Boden (unterster Punkt des Schafts minus Verlängerung der Sohle)."""
    z0 = min(p.z for p in punkte)
    unten = [p for p in punkte if p.z < z0 + 0.012]
    cx = sum(p.x for p in unten) / len(unten)
    cy = sum(p.y for p in unten) / len(unten)
    sxx = sum((p.x - cx) ** 2 for p in unten)
    syy = sum((p.y - cy) ** 2 for p in unten)
    sxy = sum((p.x - cx) * (p.y - cy) for p in unten)
    a = 0.5 * math.atan2(2 * sxy, sxx - syy)
    vor = Vector((math.cos(a), math.sin(a), 0.0))
    if vor.y > 0:
        vor = -vor  # vorn ist -y
    seit = Vector((-vor.y, vor.x, 0.0))
    if (seit.x > 0) != (seite == "L"):
        seit = -seit
    c = Vector((cx, cy, z0))
    laengs = [(p - c).dot(vor) for p in punkte]
    return {"c": c, "vor": vor, "seit": seit, "ferse": min(laengs), "L": max(laengs) - min(laengs), "z0": z0,
            "boden": z0 - SOHLE["unter"]}


def _koord(r: dict, p: Vector) -> tuple[float, float, float]:
    """(u, h, q) eines Punkts am Schuh: längs 0 Ferse bis 1 Spitze, Höhe über dem Boden, quer nach außen."""
    d = p - r["c"]
    return (d.dot(r["vor"]) - r["ferse"]) / r["L"], p.z - r["boden"], d.dot(r["seit"])


def _profil(st, u: float) -> float:
    """Wert bei u, linear zwischen den Stützstellen (u, Wert)."""
    u = max(0.0, min(1.0, u))
    for (u0, h0), (u1, h1) in zip(st, st[1:]):
        if u <= u1:
            return h0 + (h1 - h0) * (u - u0) / (u1 - u0)
    return st[-1][1]


def _oben(u: float) -> float:
    """Oberkante der Sohle über dem Boden bei u (`SOHLE["oben"]`)."""
    return _profil(SOHLE["oben"], u)


def _kragen_frei(daten: dict, koerper: bpy.types.Object) -> None:
    """Kragen und Zunge außen auf der Socke (D-451): Der Schuh von MakeHuman sitzt am Grundmodell eng; an
    dieser Figur lagen Kragen und Zunge bis 6 mm unter der Haut, die Socke kam oben durch den Schaft, und an
    der Zunge sah man durch einen Spalt in den Schuh. Jetzt liegt die Außenseite von Kragen, Zunge und
    oberem Schaft (ab 5 cm über dem Boden, bis 60 % der Länge ab der Ferse) mindestens `KRAGEN_ABSTAND` über der
    Haut: Punkte, die tiefer liegen, rücken waagrecht in Richtung der Normale der Haut nach außen, die
    Verschiebung wird über die Nachbarn geglättet; sechs Runden, bis alle Punkte außen liegen. Zehenkappe und Sohle bleiben,
    wie sie sind. In der Zone hängt der Schuh an denselben Knochen wie die Haut darunter. Einmal je Figur,
    vor dem Bau der Netze."""
    from mathutils import kdtree
    from mathutils.bvhtree import BVHTree

    if daten.get("kragen_frei"):
        return
    P, F, S = daten["punkte"], daten["flaechen"], daten["seite"]
    haut = BVHTree.FromPolygons([v.co for v in koerper.data.vertices], [list(f.vertices) for f in koerper.data.polygons])
    nachbarn: list[set[int]] = [set() for _ in P]
    for f in F:
        for a, b in zip(f, f[1:] + f[:1]):
            nachbarn[a].add(b)
            nachbarn[b].add(a)

    def glatt(x: float) -> float:
        x = max(0.0, min(1.0, x))
        return x * x * (3 - 2 * x)

    zone, ziel = [], []
    normalen = _normalen(P, F)
    for p, s, n in zip(P, S, normalen):
        u, h, _ = _koord(daten["rahmen"][s], p)
        zone.append(glatt((h - 0.050) / 0.012) * (1.0 - glatt((u - 0.60) / 0.10)))
        # Am Kragen hat der Schuh zwei Lagen: außen den Schaft, innen ein Futter, das zum Bein zeigt (bis
        # zur Spitze der Fersenlasche). Das Futter ist selbst die Fläche am Bein und bleibt innen: um die
        # Dicke des Schafts näher an der Haut als die Außenlage
        ort, normale, _, _ = haut.find_nearest(p, 0.08)
        innen = ort is not None and n.dot(normale) < 0.0
        ziel.append(KRAGEN_ABSTAND - SCHAFT_DICKE if innen else KRAGEN_ABSTAND)
    for _ in range(6):
        versatz = [Vector() for _ in P]
        for i, p in enumerate(P):
            if zone[i] <= 0.0:
                continue
            ort, normale, _, _ = haut.find_nearest(p, 0.08)
            if ort is None:
                continue
            d = (p - ort).dot(normale)
            # nur waagrecht: längs der Normale wanderte der Kragen an der Achillessehne nach oben
            waag = Vector((normale.x, normale.y, 0.0))
            if d < ziel[i] and waag.length > 1e-6:
                waag.normalize()
                versatz[i] = waag * ((ziel[i] - d) / max(waag.dot(normale), 0.5) * zone[i])
        for _ in range(2):
            versatz = [(versatz[i] + sum((versatz[j] for j in nachbarn[i]), Vector())) / (1 + len(nachbarn[i]))
                       if zone[i] > 0.0 else versatz[i] for i in range(len(P))]
        for i in range(len(P)):
            P[i] = P[i] + versatz[i]
    # Gewichte: Am Kragen hängt der Schuh an denselben Knochen wie die Haut darunter (nächster Punkt des
    # Körpers), gleitend über die Zone; so bleibt der Abstand in jeder Haltung, wie bei Shirt und Shorts.
    # Darunter bleiben die Gewichte von MakeHuman (Fuß und Zehen, der Schuh steht fest auf der Sohle)
    namen = {g.index: g.name for g in koerper.vertex_groups}
    baum = kdtree.KDTree(len(koerper.data.vertices))
    for v in koerper.data.vertices:
        baum.insert(v.co, v.index)
    baum.balance()
    for i, p in enumerate(P):
        if zone[i] <= 0.0:
            continue
        _, j, _ = baum.find(p)
        haut_w = {namen[g.group]: g.weight for g in koerper.data.vertices[j].groups if g.weight > 0.0}
        summe = sum(haut_w.values()) or 1.0
        alt_w = daten["gewichte"][i]
        alt_summe = sum(alt_w.values()) or 1.0
        neu_w: dict[str, float] = {}
        for k, w in alt_w.items():
            neu_w[k] = neu_w.get(k, 0.0) + (1.0 - zone[i]) * w / alt_summe
        for k, w in haut_w.items():
            neu_w[k] = neu_w.get(k, 0.0) + zone[i] * w / summe
        daten["gewichte"][i] = neu_w
    daten["kragen_frei"] = True


def sohle_unter_fuss(koerper: bpy.types.Object) -> float:
    """So viel höher steht die Figur in Schuhen (m): tiefster Punkt des Fußes in der Ruhehaltung minus
    Unterkante der Sohle (D-450)."""
    daten = _schaft(koerper.name)
    fuss = min(v.co.z for v in koerper.data.vertices)
    return fuss - min(r["boden"] for r in daten["rahmen"].values())


# ---------------------------------------------------------------------- Netze


def _netz(name: str, punkte: list[Vector], flaechen: list[list[int]], gewichte: list[dict[str, float]],
          koerper: bpy.types.Object, skelett: bpy.types.Object, attribute: dict[str, list[float]],
          glatt: int = 2) -> bpy.types.Object:
    """Netz aus Punkten (Raum des Skeletts) mit Gewichten je Punkt und Attributen für den Shader."""
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata([tuple(p) for p in punkte], [], flaechen)
    mesh.update()
    for poly in mesh.polygons:
        poly.use_smooth = True
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    obj.parent = koerper.parent
    gruppen = {}
    for g in koerper.vertex_groups:
        gruppen[g.name] = obj.vertex_groups.new(name=g.name)
    for i, gw in enumerate(gewichte):
        for knochen, w in gw.items():
            if knochen in gruppen and w > 0:
                gruppen[knochen].add([i], w, "REPLACE")
    for attr_name, werte in attribute.items():
        attr = mesh.attributes.new(attr_name, "FLOAT", "POINT")
        for i, wert in enumerate(werte):
            attr.data[i].value = wert
    mod = obj.modifiers.new("Skelett", "ARMATURE")
    mod.object = skelett
    if glatt:
        sub = obj.modifiers.new("Glatt", "SUBSURF")
        sub.levels = 1
        sub.render_levels = glatt
    return obj


def _normalen(punkte: list[Vector], flaechen: list[list[int]]) -> list[Vector]:
    bm = bmesh.new()
    vs = [bm.verts.new(p) for p in punkte]
    for f in flaechen:
        try:
            bm.faces.new([vs[i] for i in f])
        except ValueError:
            pass
    bm.normal_update()
    aus = [v.normal.copy() for v in vs]
    bm.free()
    return aus


def _attribute_schuh(daten: dict, punkte: list[Vector], seiten: list[str]) -> dict[str, list[float]]:
    werte = {"SchuhU": [], "SchuhH": [], "SchuhQ": []}
    for p, s in zip(punkte, seiten):
        u, h, q = _koord(daten["rahmen"][s], p)
        werte["SchuhU"].append(u)
        werte["SchuhH"].append(h)
        werte["SchuhQ"].append(q)
    return werte


def _umriss(punkte: list[Vector], c: Vector, vor: Vector, seit: Vector, N: int, scheibe: float = 0.008) -> list[float]:
    """Umriss einer Punktmenge in der Ebene (längs `vor`, quer `seit`) als Abstand von der Mitte `c` in
    `N` Richtungen: Jeder Punkt wird als Scheibe (`scheibe` m) in ein Raster von 2 mm gefüllt, so
    schließen sich die Lücken zwischen den Punkten des Schafts; je Richtung der äußerste gefüllte Punkt
    minus die Scheibe, dann leicht geglättet. Bis auf die Glättung geht die Wand durch die äußersten
    Punkte; der Schaft bleibt innen."""
    import numpy as np

    xy = np.array([((p - c).dot(vor), (p - c).dot(seit)) for p in punkte])
    schritt = 0.002
    lo = xy.min(axis=0) - 2 * scheibe
    groesse = np.ceil((xy.max(axis=0) + 2 * scheibe - lo) / schritt).astype(int) + 1
    belegt = np.zeros(groesse, dtype=bool)
    gx, gy = np.meshgrid(np.arange(groesse[0]), np.arange(groesse[1]), indexing="ij")
    for x, y in xy:
        i, j = (x - lo[0]) / schritt, (y - lo[1]) / schritt
        belegt |= (gx - i) ** 2 + (gy - j) ** 2 <= (scheibe / schritt) ** 2
    rad = []
    for k in range(N):
        w = -math.pi + (k + 0.5) * 2 * math.pi / N
        dx, dy = math.cos(w), math.sin(w)
        r_aus = 0.0
        r = 0.0
        while r < 0.25:
            i, j = int(round((r * dx - lo[0]) / schritt)), int(round((r * dy - lo[1]) / schritt))
            if 0 <= i < groesse[0] and 0 <= j < groesse[1] and belegt[i, j]:
                r_aus = r
            r += 0.001
        rad.append(max(r_aus - scheibe, 0.01))
    for _ in range(2):
        rad = [(rad[k - 1] + 2 * rad[k] + rad[(k + 1) % N]) / 4 for k in range(N)]
    return rad


def _sohle(daten: dict) -> tuple[list[Vector], list[list[int]], list[str], list[dict]]:
    """Sohle als eigener, geschlossener Körper (D-451) je Schuh: Umriss des Schafts bis zur Oberkante der
    Sohle (Ruhehaltung, `_umriss` in `SOHLE_RINGE` Richtungen), um die Wand `SOHLE["wand"]` nach außen
    versetzt. Die Wand steht senkrecht vom Boden bis
    zur Oberkante `SOHLE["oben"]`, unten leicht gerundet; oben läuft eine Lippe nach innen und unter den
    Schaft, darunter schließt der Boden. Die Sohle hängt nur am Fuß und steht damit fest und flach. Bis
    D-450 entstand sie aus dem unteren Teil des Schafts; wo dessen Unterseite fehlte oder sich hob (an
    Ferse, Gewölbe und Spitze), war sie zerklüftet oder vorn offen."""
    P, seiten = daten["punkte"], daten["seite"]
    N = SOHLE_RINGE
    punkte: list[Vector] = []
    flaechen: list[list[int]] = []
    s_neu: list[str] = []
    gewichte: list[dict] = []
    for s in "LR":
        r = daten["rahmen"][s]
        vor, seit = r["vor"], r["seit"]
        kq = [(_koord(r, P[i]), i) for i in range(len(P)) if seiten[i] == s]
        unten = [P[i] for (u, h, _), i in kq if h < _oben(u)]
        c = sum(unten, Vector()) / len(unten)
        c.z = r["boden"]
        rad = _umriss(unten, c, vor, seit, N)
        start = len(punkte)
        ringe = []  # je Richtung: Boden innen, Boden außen, Wand unten, Wand oben, Kante, Lippe
        for k in range(N):
            w = -math.pi + (k + 0.5) * 2 * math.pi / N
            richt = vor * math.cos(w) + seit * math.sin(w)
            aussen = c + richt * rad[k]
            u = _koord(r, aussen)[0]
            aussen = aussen + richt * _profil(SOHLE["wand"], u)
            oben = _oben(u)
            lippe = c + (aussen - c) * 0.80
            ringe.append([aussen - richt * 0.004, aussen + Vector((0, 0, 0.0015)), aussen + Vector((0, 0, 0.004)),
                          aussen + Vector((0, 0, oben - 0.003)), aussen + Vector((0, 0, oben)),
                          lippe + Vector((0, 0, oben - 0.002))])
        for ring in ringe:
            for q in ring:
                punkte.append(q)
        R = len(ringe[0])
        for k in range(N):
            k2 = (k + 1) % N
            for j in range(R - 1):
                a0, a1 = start + k * R + j, start + k * R + j + 1
                b0, b1 = start + k2 * R + j, start + k2 * R + j + 1
                flaechen.append([a0, b0, b1, a1])
        # Boden und Deckel: je ein Fächer um die Mitte
        mitte_unten = len(punkte)
        punkte.append(c.copy())
        mitte_oben = len(punkte)
        punkte.append(c + Vector((0, 0, _oben(0.5) - 0.002)))
        for k in range(N):
            k2 = (k + 1) % N
            flaechen.append([mitte_unten, start + k2 * R, start + k * R])
            flaechen.append([mitte_oben, start + k * R + R - 1, start + k2 * R + R - 1])
        anzahl = len(punkte) - start
        s_neu += [s] * anzahl
        gewichte += [{f"foot.{s}": 1.0} for _ in range(anzahl)]
    return punkte, flaechen, s_neu, gewichte


def _lasche(daten: dict) -> tuple[list[Vector], list[list[int]], list[str], list[dict]]:
    """Fersenlasche je Schuh: abgerundetes Rechteck in der Ebene quer zum Fuß, oben an der Ferse, leicht
    nach hinten geneigt; Gewichte vom nächsten Punkt des Schafts."""
    punkte, flaechen, seiten, gewichte = [], [], [], []
    P = daten["punkte"]
    for s in "LR":
        r = daten["rahmen"][s]
        kandidaten = [(p.z, i) for i, p in enumerate(P) if daten["seite"][i] == s
                      and _koord(r, p)[0] < 0.06 and abs(_koord(r, p)[2]) < 0.012]
        _, oben_i = max(kandidaten)
        T = P[oben_i] - r["vor"] * 0.002
        w = math.radians(LASCHE["neigung"])
        hoch = (Vector((0, 0, 1)) * math.cos(w) - r["vor"] * math.sin(w)).normalized()
        quer = r["seit"]
        nx, ny = 7, 9
        start = len(punkte)
        b, hh, ue, rund = LASCHE["breite"], LASCHE["hoehe"], LASCHE["ueber"], LASCHE["rund"]
        for j in range(ny):
            y = -(hh - ue) + hh * j / (ny - 1)
            for i in range(nx):
                x = -b / 2 + b * i / (nx - 1)
                # obere Ecken abrunden: Punkte in den Ecken auf den Viertelkreis ziehen
                ex, ey = abs(x) - (b / 2 - rund), y - (ue - rund)
                if ex > 0 and ey > 0:
                    d = math.hypot(ex, ey)
                    if d > rund:
                        x = math.copysign(b / 2 - rund + ex * rund / d, x)
                        y = ue - rund + ey * rund / d
                punkte.append(T + quer * x + hoch * y)
                seiten.append(s)
                naechster = min(range(len(P)), key=lambda k: (P[k] - punkte[-1]).length_squared)
                gewichte.append(daten["gewichte"][naechster])
        for j in range(ny - 1):
            for i in range(nx - 1):
                a = start + j * nx + i
                flaechen.append([a, a + 1, a + nx + 1, a + nx])
    return punkte, flaechen, seiten, gewichte


# ---------------------------------------------------------------------- Logos am Schuh und an der Socke


def _projektion(punkte: list[Vector], normalen: list[Vector], P0: Vector, n0: Vector, seite_m: float,
                erlaubt) -> tuple[list[tuple[float, float]], list[float]]:
    """Ebene Projektion eines quadratischen Bilds (`seite_m` Meter) mit Mitte P0 und Blickrichtung n0:
    UV je Punkt und Maske (nur erlaubte Punkte, die zur Bildebene zeigen)."""
    hoch = Vector((0, 0, 1)) - n0 * n0.z
    hoch.normalize()
    quer = hoch.cross(n0)
    uv, maske = [], []
    for i, (p, n) in enumerate(zip(punkte, normalen)):
        d = p - P0
        uv.append((d.dot(quer) / seite_m + 0.5, d.dot(hoch) / seite_m + 0.5))
        maske.append(max(0.0, min(1.0, (n.dot(n0) - 0.2) / 0.25)) if erlaubt(i) and abs(d.dot(n0)) < 0.03 else 0.0)
    return uv, maske


def _uv_schicht(obj: bpy.types.Object, name: str, uv: list[tuple[float, float]], maske: list[float]) -> None:
    mesh = obj.data
    schicht = mesh.uv_layers.new(name="Logo" + name)
    for loop in mesh.loops:
        schicht.data[loop.index].uv = uv[loop.vertex_index]
    attr = mesh.attributes.new("Maske" + name, "FLOAT", "POINT")
    for i, wert in enumerate(maske):
        attr.data[i].value = wert


# ---------------------------------------------------------------------- Material


def _schuh_material(name: str, teil: str) -> bpy.types.Material:
    """Farben des Schuhs nach dem Board aus den Attributen „SchuhU“, „SchuhH“, „SchuhQ“: am Schaft weiß,
    die Fersenkappe schwarz, oben auf dem Rist die Schnürung, das FORM-F außen und auf der Zunge schwarz;
    an der Sohle die schwarze Laufsohle mit Zehenkappe, der Einsatz in Lime an der Ferse und der schwarze
    Keil davor. `teil`: „schaft“, „sohle“ oder „lasche“; das Futter (Innenseite) hat eigenes Material."""
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    bsdf = nodes["Principled BSDF"]
    bsdf.inputs["Roughness"].default_value = 0.45 if teil != "sohle" else 0.55
    bsdf.inputs["Specular IOR Level"].default_value = 0.4
    if teil == "lasche":
        bsdf.inputs["Base Color"].default_value = szene.srgb(LIME)
        return mat

    def attr(n: str):
        a = nodes.new("ShaderNodeAttribute")
        a.attribute_name = n
        a.attribute_type = "GEOMETRY"
        return a.outputs["Fac"]

    def rech(op: str, a, b=None):
        return kleidung._rechne(nodes, links, op, a, b)

    def stufe(wert, von: float, bis: float):
        return kleidung._stufe(nodes, links, wert, von, bis)

    def mischen(faktor, a, b):
        mix = nodes.new("ShaderNodeMix")
        mix.data_type = "RGBA"
        links.new(faktor, mix.inputs[0])
        for eingang, wert in ((6, a), (7, b)):
            if isinstance(wert, tuple):
                mix.inputs[eingang].default_value = wert
            else:
                links.new(wert, mix.inputs[eingang])
        return mix.outputs[2]

    u, h, q = attr("SchuhU"), attr("SchuhH"), attr("SchuhQ")
    farbe = szene.srgb(WEISS)
    if teil == "sohle":
        sf = SOHLE_FARBEN
        # Oberkante der Sohle als Funktion von u nachgebaut: linear zwischen Ferse und Spitze (genügt für
        # die Anteile von Einsatz und Keil)
        hoehe = rech("ADD", SOHLE["oben"][0][1], rech("MULTIPLY", u, SOHLE["oben"][-1][1] - SOHLE["oben"][0][1]))
        anteil = rech("DIVIDE", h, hoehe)
        # Einsatz in Lime: an der Ferse (u < lime_u) bis zum Anteil lime_h der Sohlenhöhe, über der Laufsohle
        lime = rech("MULTIPLY", stufe(rech("SUBTRACT", sf["lime"][0], u), -0.006, 0.006),
                    stufe(rech("SUBTRACT", sf["lime"][1], anteil), -0.02, 0.02))
        farbe = mischen(lime, farbe, szene.srgb(LIME))
        # schwarzer Keil: zwischen u0 und u1, unten breit, Spitze bei Anteil keil_h über u1
        u0, u1, kh = sf["keil"]
        lage = rech("DIVIDE", rech("SUBTRACT", u, u0), u1 - u0)  # 0 hinten, 1 vorn
        grenze = rech("MULTIPLY", rech("SUBTRACT", 1.0, lage), kh)  # Höhe der schrägen Vorderkante
        keil = rech("MULTIPLY", rech("MULTIPLY", stufe(lage, -0.03, 0.03), stufe(rech("SUBTRACT", 1.0, lage), -0.03, 0.03)),
                    stufe(rech("SUBTRACT", grenze, anteil), -0.02, 0.02))
        farbe = mischen(keil, farbe, szene.srgb(SCHWARZ))
        # Laufsohle unten, an der Spitze höher (Zehenkappe)
        kappe = rech("MULTIPLY", stufe(rech("SUBTRACT", u, sf["kappe"][0]), -0.01, 0.03), sf["kappe"][1] - sf["laufsohle"])
        unten = stufe(rech("SUBTRACT", rech("ADD", sf["laufsohle"], kappe), h), -0.0006, 0.0006)
        farbe = mischen(unten, farbe, szene.srgb(SCHWARZ))
    else:
        fk = FERSENKAPPE
        # Fersenkappe: unter der Linie von (0, h_ferse) nach (u, h_sohle), hinter u
        linie = rech("SUBTRACT", fk["h_ferse"], rech("MULTIPLY", u, (fk["h_ferse"] - fk["h_sohle"]) / fk["u"]))
        kappe = rech("MULTIPLY", stufe(rech("SUBTRACT", linie, h), -0.0012, 0.0012), stufe(rech("SUBTRACT", fk["u"], u), -0.004, 0.004))
        farbe = mischen(kappe, farbe, szene.srgb(SCHWARZ))
        # Schnürung: Schnüre quer über den Rist, Fugen in Grau
        sn = SCHNUER
        auf_rist = rech("MULTIPLY", rech("MULTIPLY", stufe(rech("SUBTRACT", u, sn["von"]), -0.01, 0.01),
                                         stufe(rech("SUBTRACT", sn["bis"], u), -0.01, 0.01)),
                        stufe(rech("SUBTRACT", sn["breite"], rech("ABSOLUTE", q)), -0.001, 0.001))
        welle = nodes.new("ShaderNodeMath")
        welle.operation = "FRACT"
        links.new(rech("DIVIDE", rech("MULTIPLY", u, 0.27), sn["abstand"]), welle.inputs[0])  # Fußlänge rund 0,27 m
        fuge = rech("MULTIPLY", auf_rist, rech("MULTIPLY", stufe(rech("SUBTRACT", welle.outputs[0], sn["schatten"][0]), -0.02, 0.02),
                                                stufe(rech("SUBTRACT", sn["schatten"][1], welle.outputs[0]), -0.02, 0.02)))
        farbe = mischen(fuge, farbe, szene.srgb(SCHNUERUNG))
        for logo in ("Seite", "Zunge"):
            uvn = nodes.new("ShaderNodeUVMap")
            uvn.uv_map = "Logo" + logo
            tex = nodes.new("ShaderNodeTexImage")
            tex.image = kleidung._bilder("f")["f"]
            tex.extension = "CLIP"
            links.new(uvn.outputs["UV"], tex.inputs["Vector"])
            sichtbar = stufe(attr("Maske" + logo), 0.45, 0.55)
            farbe = mischen(rech("MULTIPLY", tex.outputs["Alpha"], sichtbar), farbe, szene.srgb(SCHWARZ))
    links.new(farbe, bsdf.inputs["Base Color"])
    return mat


def _socken_material(name: str) -> bpy.types.Material:
    """Socke: weiß, Stoff mit Sheen; schwarze Spitze (Attribut „Spitze“), schwarzes F außen (UV-Schichten
    `LogoSockeL`/`LogoSockeR`); Bund (Attribut „Saum“) und was im Schuh liegt („ImSchuh“) ausgeblendet."""
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    bsdf = nodes["Principled BSDF"]
    bsdf.inputs["Roughness"].default_value = 0.85
    bsdf.inputs["Sheen Weight"].default_value = 0.4
    bsdf.inputs["Sheen Roughness"].default_value = 0.5

    def attr(n: str):
        a = nodes.new("ShaderNodeAttribute")
        a.attribute_name = n
        a.attribute_type = "GEOMETRY"
        return a.outputs["Fac"]

    def mischen(faktor, a, b):
        mix = nodes.new("ShaderNodeMix")
        mix.data_type = "RGBA"
        links.new(faktor, mix.inputs[0])
        for eingang, wert in ((6, a), (7, b)):
            if isinstance(wert, tuple):
                mix.inputs[eingang].default_value = wert
            else:
                links.new(wert, mix.inputs[eingang])
        return mix.outputs[2]

    farbe = mischen(kleidung._stufe(nodes, links, attr("Spitze"), 0.45, 0.55), szene.srgb(SOCKE_WEISS), szene.srgb(SCHWARZ))
    for s in "LR":
        uvn = nodes.new("ShaderNodeUVMap")
        uvn.uv_map = "LogoSocke" + s
        tex = nodes.new("ShaderNodeTexImage")
        tex.image = kleidung._bilder("f")["f"]
        tex.extension = "CLIP"
        links.new(uvn.outputs["UV"], tex.inputs["Vector"])
        sichtbar = kleidung._stufe(nodes, links, attr("MaskeSocke" + s), 0.45, 0.55)
        farbe = mischen(kleidung._rechne(nodes, links, "MULTIPLY", tex.outputs["Alpha"], sichtbar), farbe, szene.srgb(SCHWARZ))
    links.new(farbe, bsdf.inputs["Base Color"])
    saum = kleidung._stufe(nodes, links, attr("Saum"), -0.0008, 0.0008)
    frei = kleidung._rechne(nodes, links, "SUBTRACT", 1.0, kleidung._stufe(nodes, links, attr("ImSchuh"), 0.45, 0.55))
    links.new(kleidung._rechne(nodes, links, "MULTIPLY", saum, frei), bsdf.inputs["Alpha"])
    return mat


# ---------------------------------------------------------------------- Anziehen


_RICHTUNGEN = (Vector((0.0, 0.0, -1.0)), Vector((1.0, 0.0, 0.0)), Vector((-1.0, 0.0, 0.0)),
               Vector((0.0, 1.0, 0.0)), Vector((0.0, -1.0, 0.0)))


def _im_schaft(bvh, p: Vector, n: Vector) -> bool:
    """Liegt der Punkt (Normale `n`) im Schuh (`bvh`: Schaft)? Ja, wenn vier von fünf Strahlen (nach unten
    und waagrecht in vier Richtungen, bis 40 cm) den Schaft von innen treffen: Dann verdeckt ihn der Schaft
    von der Seite. Oder er ragt knapp durch den Schaft: Der Strahl gegen seine Normale trifft ihn bis
    1,5 cm von außen, der Schaft liegt dahinter."""
    treffer = 0
    for d in _RICHTUNGEN:
        ort, normale, _, _ = bvh.ray_cast(p, d, 0.4)
        if ort is not None and normale.dot(d) > 0:
            treffer += 1
    if treffer >= 4:
        return True
    ort, normale, _, _ = bvh.ray_cast(p, -n, 0.015)
    return ort is not None and normale.dot(n) > 0


def _im_schuh(punkte: list[Vector], normalen: list[Vector], seiten: list[str | None], daten: dict,
              kanten) -> list[float]:
    """1, wenn der Punkt der Socke im Schuh liegt (Ruhehaltung, D-451, `_im_schaft`): Der Schaft verdeckt
    ihn von der Seite, oder er ragt knapp durch den Schaft. Was über dem Kragen liegt, bleibt sichtbar, ebenso
    ein Ring von Punkten im Schuh am Rand der sichtbaren Socke (`kanten`: Paare benachbarter Punkte);
    so endet die sichtbare Socke immer im Schuh und nie mit einem Spalt über dem Kragen. Bis D-450 galt
    ein Höhenprofil je Abschnitt (höchster Punkt des Schafts); es versteckte die Socke an den Seiten
    über dem Kragen, dort sah man in den Schuh."""
    from mathutils.bvhtree import BVHTree

    schaft = BVHTree.FromPolygons(daten["punkte"], daten["flaechen"])
    innen = [s is not None and _im_schaft(schaft, p, n) for p, n, s in zip(punkte, normalen, seiten)]
    sichtbar_nah = [False] * len(punkte)
    for a, b in kanten:
        if innen[a] and not innen[b]:
            sichtbar_nah[a] = True
        elif innen[b] and not innen[a]:
            sichtbar_nah[b] = True
    return [1.0 if d and not r else 0.0 for d, r in zip(innen, sichtbar_nah)]


def anziehen(koerper: bpy.types.Object, skelett: bpy.types.Object, k) -> dict:
    """Socken und Schuhe an die Figur (Körperkoordinaten `k` aus `koordinaten.Koordinaten`). Gibt die neuen
    Objekte (`teile`) und das Feld der Socke je Eckpunkt des Körpers (`socke`, m, positiv = bedeckt) für
    das Attribut „Bedeckt“ zurück."""
    daten = _schaft(koerper.name)
    _kragen_frei(daten, koerper)
    P, seiten, F = daten["punkte"], daten["seite"], daten["flaechen"]
    normalen = _normalen(P, F)
    teile = []
    # Schaft: weiß mit Fersenkappe, Schnürung und Logos; Innenseite (Futter) und Kante schwarz
    schaft = _netz("Schuhe", P, F, daten["gewichte"], koerper, skelett, _attribute_schuh(daten, P, seiten))
    # FORM-F außen an jedem Schuh und klein oben auf der Zunge
    uv_seite = [(0.5, 0.5)] * len(P)
    m_seite = [0.0] * len(P)
    uv_zunge = [(0.5, 0.5)] * len(P)
    m_zunge = [0.0] * len(P)
    for s in "LR":
        r = daten["rahmen"][s]
        ziel = [i for i in range(len(P)) if seiten[i] == s]
        # außen: nächster Punkt zu (u, h) auf der Außenseite
        _, i0 = min((abs(_koord(r, P[i])[0] - LOGO["u"]) * r["L"] + abs(_koord(r, P[i])[1] - LOGO["h"]), i)
                    for i in ziel if normalen[i].dot(r["seit"]) > 0.6)
        n0 = sum((normalen[i] for i in ziel if (P[i] - P[i0]).length < 0.02), Vector()).normalized()
        uv, m = _projektion(P, normalen, P[i0], n0, LOGO["hoehe"] / kleidung.F_ANTEIL,
                            lambda i, s=s, r=r: seiten[i] == s and _koord(r, P[i])[2] > 0)
        for i in ziel:
            uv_seite[i], m_seite[i] = uv[i], m[i]
        # Zunge: höchster Punkt vorn in der Mitte, das F etwas darunter auf der Vorderseite
        _, iz = max((P[i].z, i) for i in ziel if 0.45 < _koord(r, P[i])[0] < 0.8 and abs(_koord(r, P[i])[2]) < 0.012)
        vorn = [i for i in ziel if abs(_koord(r, P[i])[2]) < 0.01 and normalen[i].dot(r["vor"]) > 0.3
                and 0.0 < P[iz].z - P[i].z < 0.03]
        iz2 = min(vorn, key=lambda i: abs(P[iz].z - P[i].z - 0.012)) if vorn else iz
        nz = sum((normalen[i] for i in ziel if (P[i] - P[iz2]).length < 0.015), Vector()).normalized()
        uv, m = _projektion(P, normalen, P[iz2], nz, LOGO["zunge"] / kleidung.F_ANTEIL,
                            lambda i, s=s, r=r: seiten[i] == s and abs(_koord(r, P[i])[2]) < 0.02)
        for i in ziel:
            uv_zunge[i], m_zunge[i] = uv[i], m[i]
    _uv_schicht(schaft, "Seite", uv_seite, m_seite)
    _uv_schicht(schaft, "Zunge", uv_zunge, m_zunge)
    dicke = schaft.modifiers.new("Dicke", "SOLIDIFY")
    dicke.thickness = SCHAFT_DICKE
    dicke.offset = -1.0
    dicke.material_offset = 1
    dicke.material_offset_rim = 1
    schaft.modifiers.move(schaft.modifiers.find("Dicke"), schaft.modifiers.find("Glatt"))
    schaft.data.materials.append(_schuh_material("Schaft", "schaft"))
    schaft.data.materials.append(szene.matt("Futter", SCHWARZ, 0.7))
    teile.append(schaft)
    # Sohle
    sp, sf, ss, sg = _sohle(daten)
    sohle = _netz("Sohle", sp, sf, sg, koerper, skelett, _attribute_schuh(daten, sp, ss))
    bm = bmesh.new()  # geschlossener Körper: Normalen nach außen
    bm.from_mesh(sohle.data)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(sohle.data)
    bm.free()
    sohle.data.materials.append(_schuh_material("Sohle", "sohle"))
    teile.append(sohle)
    # Fersenlasche
    lp, lf, ls, lg = _lasche(daten)
    lasche = _netz("Lasche", lp, lf, lg, koerper, skelett, {}, glatt=1)
    dicke = lasche.modifiers.new("Dicke", "SOLIDIFY")
    dicke.thickness = LASCHE["dicke"]
    dicke.offset = 0.0
    lasche.modifiers.move(lasche.modifiers.find("Dicke"), lasche.modifiers.find("Glatt"))
    lasche.data.materials.append(_schuh_material("Lasche", "lasche"))
    teile.append(lasche)
    # Socke aus dem Netz der Figur
    socke, feld = _socke(koerper, skelett, k, daten)
    teile.append(socke)
    anziehen.daten = daten
    return {"teile": teile, "socke": feld}


def _socke(koerper: bpy.types.Object, skelett: bpy.types.Object, k, daten: dict):
    """Socke beider Füße: Unterschenkel unter dem Bund und der ganze Fuß, versetzt wie Shirt und Shorts;
    Bund bei `SOCKE["bund"]` der Strecke Knöchel → Knie; F außen am Schaft; was im Schuh liegt, aus."""
    verts = koerper.data.vertices
    feld, spitze, seiten = [], [], []
    for v in verts:
        i, p = v.index, v.co
        s = "L" if p.x >= 0 else "R"
        unter = k.w(i, f"lowerleg01.{s}", f"lowerleg02.{s}")
        fuss = k.w(i, f"foot.{s}") + sum(k.w(i, f"toe{a}-{b}.{s}") for a in range(1, 6) for b in range(1, 4))
        zeh = sum(k.w(i, f"toe{a}-{b}.{s}") for a in range(1, 6) for b in range(1, 4))
        if fuss > 0.5:
            feld.append(0.2)
        elif unter > 0.3:
            _, t, Ls, _ = k.glied(p, f"lowerleg01.{s}", f"foot.{s}", Vector((0, -1, 0)), s)
            feld.append((t - (1.0 - SOCKE["bund"])) * Ls)
        else:
            feld.append(-1.0)
        spitze.append(1.0 if zeh > 0.5 else 0.0)
        seiten.append(s if (fuss > 0.3 or unter > 0.3) else None)
    lage = [v.co + v.normal * SOCKE["abstand"] for v in verts]
    im_schuh = _im_schuh(lage, [v.normal for v in verts], seiten, daten, [e.vertices for e in koerper.data.edges])
    # F außen am Schaft der Socke: Mitte unter dem Bund, Höhe in Breiten des Schafts
    rahmen = {}
    for s, x in (("L", 1), ("R", -1)):
        K, A = k.kopf[f"lowerleg01.{s}"], k.kopf[f"foot.{s}"]
        Ls = (A - K).length
        t_bund = 1.0 - SOCKE["bund"]
        t_f = t_bund + SOCKE["f_unter_bund"] * SOCKE["bund"]
        mitte = K.lerp(A, t_f)
        ach = (A - K).normalized()
        # Das Netz des Unterschenkels ist grob (Ringe rund 3 cm auseinander): äußerster Punkt in der Nähe,
        # dann längs des Knochens genau auf die Höhe des F geschoben
        aussen = [v for v in verts if abs((v.co - K).dot(ach) / Ls - t_f) < 0.07
                  and v.co.x * x > 0 and (v.co - mitte).dot(Vector((x, 0, 0))) > 0 and k.w(v.index, f"lowerleg01.{s}", f"lowerleg02.{s}") > 0.5]
        P0 = max(aussen, key=lambda v: v.co.x * x).co.copy()
        P0 = P0 + ach * (t_f * Ls - (P0 - K).dot(ach))
        n0 = sum((v.normal for v in verts if (v.co - P0).length < 0.03), Vector()).normalized()
        schaft_breite = _schaftbreite(verts, k, s, t_f)
        rahmen[s] = (P0, n0, SOCKE["f_hoehe"] * schaft_breite / kleidung.F_ANTEIL)
    socke = kleidung._teil("Socken", koerper, skelett, feld, SOCKE["abstand"], {}, attribute={"ImSchuh": im_schuh, "Spitze": spitze})
    # UV der Logos auf dem Netz der Socke (Punkte der Ruhehaltung des Körpers über die Nummern)
    behalten = sorted(v.index for v in verts if feld[v.index] > -0.03)
    pk = [verts[i].co for i in behalten]
    nk = [verts[i].normal for i in behalten]
    for s, x in (("L", 1), ("R", -1)):
        P0, n0, seite_m = rahmen[s]
        uv, m = _projektion(pk, nk, P0, n0, seite_m, lambda j, x=x: pk[j].x * x > 0)
        _uv_schicht(socke, "Socke" + s, uv, m)
    socke.data.materials.append(_socken_material("Socken"))
    return socke, feld


def _schaftbreite(verts, k, s: str, t: float) -> float:
    """Breite des Unterschenkels in der Ansicht von vorn bei Anteil t (Knie → Knöchel)."""
    K, A = k.kopf[f"lowerleg01.{s}"], k.kopf[f"foot.{s}"]
    ach = (A - K).normalized()
    L = (A - K).length
    xs = [v.co.x for v in verts if abs((v.co - K).dot(ach) / L - t) < 0.07 and (v.co.x > 0) == (s == "L")
          and k.w(v.index, f"lowerleg01.{s}", f"lowerleg02.{s}") > 0.5]
    return (max(xs) - min(xs)) if xs else 0.1


# ---------------------------------------------------------------------- Prüfung (D-451)


def _verformt(obj: bpy.types.Object) -> tuple[list[Vector], list[list[int]], list[Vector]]:
    """Eckpunkte (Welt), Flächen und Normalen der Eckpunkte des verformten Netzes, ohne Glättung und
    Dicke: dieselben Eckpunkte in derselben Reihenfolge wie im Netz selbst."""
    aus = [m for m in obj.modifiers if m.type in ("SUBSURF", "SOLIDIFY") and m.show_viewport]
    for m in aus:
        m.show_viewport = False
    deps = bpy.context.evaluated_depsgraph_get()
    ev = obj.evaluated_get(deps)
    mesh = ev.to_mesh()
    M = ev.matrix_world
    R = M.to_3x3()
    pkte = [M @ v.co for v in mesh.vertices]
    normalen = [(R @ v.normal).normalized() for v in mesh.vertices]
    flaechen = [list(f.vertices) for f in mesh.polygons]
    ev.to_mesh_clear()
    for m in aus:
        m.show_viewport = True
    return pkte, flaechen, normalen


def bodenkontakt(sohle: bpy.types.Object, schaft: bpy.types.Object | None = None) -> dict:
    """Unterkante der Sohle im verformten Netz (Welt, mm): tiefster Punkt, Ferse (u < 0,3) und Ballen
    (u > 0,6) je Seite; flach und fest heißt alle nahe 0. Mit `schaft` auch dessen tiefster Punkt (er
    endet innen über der Sohle und darf nicht durch sie in den Boden)."""
    pkte, _, _ = _verformt(sohle)
    u = [a.value for a in sohle.data.attributes["SchuhU"].data]
    aus = {"Sohle: tiefster Punkt über dem Boden (mm)": min(p.z for p in pkte) * 1000}
    for s, x in (("L", 1), ("R", -1)):
        ferse = [p.z for p, uu in zip(pkte, u) if uu < 0.3 and p.x * x > 0]
        ballen = [p.z for p, uu in zip(pkte, u) if uu > 0.6 and p.x * x > 0]
        aus[f"Sohle {s}: Ferse über dem Boden (mm)"] = min(ferse) * 1000
        aus[f"Sohle {s}: Ballen über dem Boden (mm)"] = min(ballen) * 1000
    if schaft is not None:
        aus["Schaft: tiefster Punkt über dem Boden (mm)"] = min(p.z for p in _verformt(schaft)[0]) * 1000
    return aus


def durchdringung(koerper: bpy.types.Object, socke: bpy.types.Object, schaft: bpy.types.Object,
                  hose: bpy.types.Object | None = None) -> dict:
    """Socke und Schuh in der aktuellen Haltung (verformte Netze ohne Glättung, Welt). Im Schuh sind Socke
    und Haut ausgeblendet (Attribut „ImSchuh“ der Socke, `_im_schuh`); sichtbar durchdringen kann nur,
    was am Kragen aufeinandertrifft. Gemessen wird:

    - **Kragen über der Socke** (mm): kleinster Abstand der Innenseite von Kragen, Zunge und oberem Schaft
      (bei der Außenlage minus `SCHAFT_DICKE`, das Futter selbst; Punkte ab 5 cm über dem Boden bis 65 % der
      Länge) über der Socke, negativ heißt, der Schuh schneidet in die Socke;
    - **Socke über der Haut** (mm): kleinster Abstand der sichtbaren Socke über der Haut am selben Punkt
      des Netzes, negativ heißt, die Haut kommt durch;
    - **Löcher über dem Schuh**: ausgeblendete Punkte der Socke, die nicht mehr im Schuh liegen (dieselbe
      Prüfung wie `_im_schuh`, in der aktuellen Haltung); dort sähe man in den Schuh;
    - **Abstand zu den Shorts** (cm): kleinster Abstand der Socke zu den Shorts."""
    from mathutils import kdtree
    from mathutils.bvhtree import BVHTree

    sp, sf, sn = _verformt(socke)
    kp, _, kn = _verformt(koerper)
    hp, hf, hn = _verformt(schaft)

    def werte(obj: bpy.types.Object, name: str) -> list[float]:
        return [a.value for a in obj.data.attributes[name].data]

    saum, im_schuh, nummer = werte(socke, "Saum"), werte(socke, "ImSchuh"), werte(socke, "nummer")
    su, sh = werte(schaft, "SchuhU"), werte(schaft, "SchuhH")
    aus: dict[str, float] = {}
    # Kragen über der Socke
    bvh_socke = BVHTree.FromPolygons(sp, sf)
    abst = []
    for q, n, uu, hh in zip(hp, hn, su, sh):
        if hh < 0.05 or uu > 0.65:
            continue
        ort, normale, _, _ = bvh_socke.find_nearest(q, 0.03)
        if ort is not None:
            # Außenlage: ihre Innenseite liegt um die Dicke tiefer; das Futter zeigt selbst zum Bein
            abst.append((q - ort).dot(normale) - (SCHAFT_DICKE if n.dot(normale) > 0 else 0.0))
    aus["Kragen: Innenseite über der Socke (mm)"] = min(abst) * 1000 if abst else float("nan")
    # Socke über der Haut, am selben Punkt des Netzes, wo die Socke zu sehen ist
    abst = [(sp[i] - kp[int(nummer[i])]).dot(kn[int(nummer[i])]) for i in range(len(sp))
            if saum[i] > 0.0 and im_schuh[i] < 0.5]
    aus["Socke: kleinster Abstand über der Haut (mm)"] = min(abst) * 1000
    # Löcher: ausgeblendete Socke, die nicht mehr im Schuh liegt
    bvh_schaft = BVHTree.FromPolygons(hp, hf)
    loecher = 0
    for i in range(len(sp)):
        if saum[i] > 0.0 and im_schuh[i] >= 0.5 and not _im_schaft(bvh_schaft, sp[i], sn[i]):
            loecher += 1
    aus["Socke: Löcher über dem Schuh (Punkte)"] = loecher
    if hose is not None:
        hp2, _, _ = _verformt(hose)
        baum = kdtree.KDTree(len(hp2))
        for i, q in enumerate(hp2):
            baum.insert(q, i)
        baum.balance()
        aus["Socke: kleinster Abstand zu den Shorts (cm)"] = min(baum.find(q)[2] for q in sp) * 100
    return aus
