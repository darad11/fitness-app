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

**Laufschuh seit D-460** (`NEU`; Auftrag `docs/prompts/programme-ganzkoerper-FORM.md` Abschnitt 1), näher am Board:

- **Schnürung als Geometrie** (`_schnuerung`, `SENKEL`): sechs Paar Ösen als kleine Ringe auf dem Rist, flache
  Senkel über Kreuz von Öse zu Öse, unten ein Steg, oben ein Knoten mit zwei Schlaufen und zwei Enden mit Hülsen;
  alles sitzt auf der Oberfläche des Schafts und hängt an dessen Knochen. Die aufgemalten Fugen entfallen.
- **Profil und angehobene Spitze** (`_stollen`, `PROFIL`, `SPITZE`): Stollen quer zum Fuß, in der Mitte geteilt,
  unter dem Körper der Sohle; seitlich als Kerben in der schwarzen Laufsohle zu sehen. Ab dem Ballen hebt sich der
  Schuh zur Spitze um bis 12 mm; Ferse und Ballen stehen flach.
- **Polster am Knöchel** (`_polster`, `POLSTER`): schwarzer Wulst entlang der Oberkante um die Ferse, seitlich am
  Knöchel etwas aufgepolstert; das Futter im Kragen und hinter der Zunge ist schwarz (Attribut „SchuhFutter“).
- **Zehenbox eines Laufschuhs** (`_form_neu`, `ZEHENBOX`): vorn schmaler, flacher und zur großen Zehe gerichtet;
  der Schaft bleibt dabei mindestens 3,5 mm über der Socke und rückt dort nach außen, wo die Socke im Schuh von
  MakeHuman bis 4 mm durch den Schaft ragte (verdeckt, aber eine Durchdringung).

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
FUTTER_DICKE = 0.0003  # Dicke des Futters im Kragen seit D-460 (vom Umschlag nach innen), m
# Außenseite von Kragen und Zunge mindestens so weit über der Haut (Socke 3 mm, Schaft 2 mm, 2,5 mm Luft, damit
# auch in der Bewegung nichts in die Socke schneidet), m
KRAGEN_ABSTAND = 0.0075
SOCKE = {"bund": 0.45, "abstand": 0.0025, "f_hoehe": 0.39, "f_unter_bund": 0.16}
_SCHAEFTE: dict[str, dict] = {}

# ---------------------------------------------------------------------- Schuh nach D-460 (Laufschuh nach dem Board)
# NEU: Schnürung mit Senkeln und Ösen als Geometrie, Profil an der Laufsohle, angehobene Spitze, Polster am Knöchel,
# Zehenbox eines Laufschuhs, schwarzes Futter im Kragen. False: Schuh bis D-459 (für Vorher-Bilder)
NEU = True
# Zehenbox: ab u schmaler und flacher zur Spitze hin (Anteile an der Spitze), die Spitze zur Innenseite (große
# Zehe) verschoben (m); Verlauf mit glatt((u - ab) / (1 - ab)) hoch `exp`. Die Außenseite bleibt mindestens `luft`
# über der Socke (m; innen dann 1,5 mm), sonst gibt der Schaft dort nach
ZEHENBOX = {"ab": 0.56, "breite": 0.20, "hoehe": 0.30, "innen": 0.006, "exp": 1.4, "luft": 0.0035}
# Angehobene Spitze (Toe Spring): ab u hebt sich der Schuh quadratisch bis `hub` an der Spitze (m); Ferse und
# Ballen bleiben flach am Boden
SPITZE = {"ab": 0.70, "hub": 0.012}
# Profil der Laufsohle: Stollen quer zum Fuß, in der Mitte geteilt; Länge und Fuge längs (m), halbe Fuge in der Mitte
# (m), Höhe (m), von u bis u. Der Körper der Sohle beginnt um die Höhe des Profils über dem Boden
PROFIL = {"hoehe": 0.0025, "laenge": 0.0062, "fuge": 0.0034, "mitte": 0.0016, "von": 0.035, "bis": 0.955,
          "rand": 0.0004, "ueber": 0.0006}
# Schnürung: Ösen paarweise von u bis u (unten nach oben), halber Abstand quer unten und oben (m); Senkel flach
# (halbe Breite, halbe Dicke, m), Abstand über dem Schaft (m); oben ein Knoten mit zwei Schlaufen und zwei Enden
SENKEL = {"paare": 6, "unten": 0.785, "oben": 0.555, "quer": (0.0135, 0.0185), "breite": 0.0019,
          "dicke": 0.0009, "ueber": 0.0012, "kreuz": 0.0013, "oese": (0.0025, 0.0007),
          "schlaufe": {"quer": 0.028, "laenge": 0.012, "zurueck": -0.004}, "ende": {"quer": 0.012, "vor": 0.050}}
# Polster am Kragen: Wulst entlang der Oberkante (Umschlag des Schafts) um die Ferse, Radius (m), endet bei u (vor
# der Zunge, zu den Enden schmaler); die Mitte liegt `tiefe` Radien unter der Oberkante. Seitlich am Knöchel ist der
# Schaft um `knoechel` (m) aufgepolstert
POLSTER = {"radius": 0.0040, "bis": 0.37, "knoechel": 0.0025, "knoechel_u": (0.10, 0.40), "tiefe": 0.30}
SENKEL_WEISS = "#E4E6E8"  # Senkel weiß, etwas grauer als der Schaft (Board)
OESE_GRAU = "#8E949C"


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


# ---------------------------------------------------------------------- Laufschuh nach dem Board (D-460)


def _glatt(x: float) -> float:
    x = max(0.0, min(1.0, x))
    return x * x * (3 - 2 * x)


def _hub(u: float) -> float:
    """Angehobene Spitze (`SPITZE`): Höhe über der flachen Sohle bei u (m); bis `SPITZE["ab"]` null."""
    if not NEU or u <= SPITZE["ab"]:
        return 0.0
    t = min(1.0, (u - SPITZE["ab"]) / (1.0 - SPITZE["ab"]))
    return SPITZE["hub"] * t * t


def _punkt(r: dict, u: float, h: float, q: float) -> Vector:
    """Punkt aus den Koordinaten am Schuh (Umkehrung von `_koord`)."""
    return r["c"] + r["vor"] * (u * r["L"] + r["ferse"]) + r["seit"] * q + Vector((0.0, 0.0, r["boden"] + h - r["c"].z))


def _ringe(daten: dict) -> None:
    """Ringe um die Öffnung des Schafts (Ruhehaltung, einmal je Figur): Abstand in Kanten vom Rand des Netzes. Der
    Schaft von MakeHuman hat nur diesen einen Rand, den unteren Rand des Futters im Schuh (Ring 0, 6,4 bis 9,2 cm
    über dem Boden); von dort läuft das Futter nach oben, schlägt am Kragen und an der Zunge um und läuft außen
    hinunter. Der Umschlag, die sichtbare Oberkante, ist der Ring mit der größten mittleren Höhe (Ring 3, 9,2 bis
    12,4 cm). Setzt `daten["ring"]` (je Punkt), `daten["umschlag_ring"]` und `daten["umschlag"]` (je Seite die
    Punkte des Umschlags als geschlossene Schleife)."""
    from collections import Counter, deque

    P, F, S = daten["punkte"], daten["flaechen"], daten["seite"]
    kanten: Counter = Counter()
    nachbarn: list[set[int]] = [set() for _ in P]
    for f in F:
        for a, b in zip(f, f[1:] + f[:1]):
            kanten[(min(a, b), max(a, b))] += 1
            nachbarn[a].add(b)
            nachbarn[b].add(a)
    ring = [-1] * len(P)
    schlange = deque()
    for (a, b), n in kanten.items():
        if n == 1:
            for i in (a, b):
                if ring[i] < 0:
                    ring[i] = 0
                    schlange.append(i)
    while schlange:
        a = schlange.popleft()
        for b in nachbarn[a]:
            if ring[b] < 0:
                ring[b] = ring[a] + 1
                schlange.append(b)
    daten["ring"] = ring
    daten["umschlag_ring"] = {}
    daten["umschlag"] = {}
    for s in "LR":
        r = daten["rahmen"][s]
        hoehen: dict[int, list[float]] = {}
        for i, p in enumerate(P):
            if S[i] == s and 0 <= ring[i] <= 8:
                hoehen.setdefault(ring[i], []).append(_koord(r, p)[1])
        k = max(hoehen, key=lambda j: sum(hoehen[j]) / len(hoehen[j]))
        daten["umschlag_ring"][s] = k
        glieder = {i for i in range(len(P)) if S[i] == s and ring[i] == k}
        start = min(glieder, key=lambda i: _koord(r, P[i])[0])  # an der Ferse
        schleife, vorher = [start], None
        while True:
            weiter = [j for j in nachbarn[schleife[-1]] if j in glieder and j != vorher and j not in schleife]
            if not weiter:
                break
            # beim ersten Schritt nach außen (q > 0), damit die Schleife immer gleich herum läuft
            if vorher is None:
                weiter.sort(key=lambda j: -_koord(r, P[j])[2])
            vorher = schleife[-1]
            schleife.append(weiter[0])
        daten["umschlag"][s] = schleife


def _form_neu(daten: dict, koerper: bpy.types.Object) -> None:
    """Form eines Laufschuhs (D-460), einmal je Figur, nach `_kragen_frei` und vor dem Bau der Netze:

    - **Zehenbox**: ab `ZEHENBOX["ab"]` wird der Schaft zur Spitze hin schmaler und flacher (an der Spitze um
      `breite` bzw. `hoehe`), die Spitze rückt um `innen` zur großen Zehe; der Schuh von MakeHuman ist vorn rund
      und breit wie ein Freizeitschuh. Die Höhe wird über dem Boden des Schafts gestaucht, die Sohle folgt dem
      Umriss. Wo der Schaft dabei näher als `ZEHENBOX["luft"]` an die Socke käme (Socke in der Ruhehaltung, 2,5 mm
      über der Haut), geht er nur so weit, wie die Luft reicht (Anteil der Verschiebung je Punkt, über die
      Nachbarn geglättet, nie über das Erlaubte); die Zehen bewegen sich in den Übungen nicht gegen den Fuß.
    - **Polster am Knöchel**: außen unter dem Umschlag (Ringe 1 bis 4 darunter) zwischen `POLSTER["knoechel_u"]`
      wölbt sich der Schaft um bis `POLSTER["knoechel"]` nach außen, nur nach außen, damit nichts in die Socke
      rückt.
    - **Angehobene Spitze**: ab `SPITZE["ab"]` hebt sich der Schaft um `_hub(u)`.
    - **Passform**: Wo die Socke schon im Schuh von MakeHuman durch den Schaft ragte (außen am Vorfuß bis 4 mm), rückt
      der sichtbare Schaft über der Sohle nach außen, bis `luft` plus 1,5 mm reichen (die Flächen zwischen den Ecken
      liegen näher an der Socke als die Ecken); die Verschiebung verteilt sich über die Nachbarn."""
    from mathutils.bvhtree import BVHTree

    if daten.get("form_neu"):
        return
    _ringe(daten)
    P, S, ring = daten["punkte"], daten["seite"], daten["ring"]
    normalen = _normalen(P, daten["flaechen"])
    zb = ZEHENBOX
    h0 = SOHLE["unter"]  # Boden des Schafts über dem Boden
    socke = BVHTree.FromPolygons([v.co + v.normal * SOCKE["abstand"] for v in koerper.data.vertices],
                                 [list(f.vertices) for f in koerper.data.polygons])

    def luft(x: Vector) -> float:
        ort, n, _, _ = socke.find_nearest(x, 0.2)
        return 1.0 if ort is None else (x - ort).dot(n)

    # Zehenbox: volle Verschiebung je Punkt (mit dem Hub der Spitze), erlaubter Anteil (Luft zur Socke), geglättet
    weg, hub = [], []
    for i, p in enumerate(P):
        r = daten["rahmen"][S[i]]
        u, h, q = _koord(r, p)
        t = _glatt((u - zb["ab"]) / (1.0 - zb["ab"])) ** zb["exp"]
        q2 = q * (1.0 - zb["breite"] * t) - zb["innen"] * t
        h2 = h0 + (h - h0) * (1.0 - zb["hoehe"] * t) if h > h0 else h
        weg.append(r["seit"] * (q2 - q) + Vector((0.0, 0.0, h2 - h)))
        hub.append(Vector((0.0, 0.0, _hub(u))))
    erlaubt = []
    for p, d, z in zip(P, weg, hub):
        if d.length < 1e-7 or luft(p + z + d) >= zb["luft"]:
            erlaubt.append(1.0)
            continue
        if luft(p + z) < zb["luft"]:
            erlaubt.append(0.0)
            continue
        lo, hi = 0.0, 1.0
        for _ in range(12):
            mid = (lo + hi) / 2
            if luft(p + z + d * mid) >= zb["luft"]:
                lo = mid
            else:
                hi = mid
        erlaubt.append(lo)
    nachbarn: list[set[int]] = [set() for _ in P]
    for f in daten["flaechen"]:
        for a, b in zip(f, f[1:] + f[:1]):
            nachbarn[a].add(b)
            nachbarn[b].add(a)
    anteil = list(erlaubt)
    for _ in range(8):
        anteil = [min(erlaubt[i], (anteil[i] + sum(anteil[j] for j in nachbarn[i])) / (1 + len(nachbarn[i])))
                  for i in range(len(P))]
    neu = [p + z + d * f for p, z, d, f in zip(P, hub, weg, anteil)]
    # Wo die Socke schon im Schuh von MakeHuman durch den Schaft ragt (außen am Vorfuß bis 4 mm, im Schuh
    # verdeckt), rückt der sichtbare Schaft über der Sohle nach außen, bis die Luft reicht; die Verschiebung
    # verteilt sich auf die Nachbarn (nie kleiner als nötig). Nur vor dem Kragen (u > 0,45): dort sorgt
    # `_kragen_frei` für Abstand
    noetig = [Vector() for _ in P]
    for i, p in enumerate(neu):
        r = daten["rahmen"][S[i]]
        u, h, _ = _koord(r, P[i])
        if u < 0.45 or h < _oben(u) - 0.004:
            continue
        ort, n, _, _ = socke.find_nearest(p, 0.2)
        if ort is not None:
            # 1,5 mm mehr als die Luft: zwischen den Ecken liegen die Flächen des Schafts näher an der Socke
            fehlt = zb["luft"] + 0.0015 - (p - ort).dot(n)
            if fehlt > 0:
                noetig[i] = n * fehlt
    schub = list(noetig)
    for _ in range(6):
        schub = [max((schub[i] + sum((schub[j] for j in nachbarn[i]), Vector())) / (1 + len(nachbarn[i])), noetig[i],
                     key=lambda v: v.length) for i in range(len(P))]
    daten["zehenbox"] = {"anteil": anteil, "schub_mm": max(v.length for v in schub) * 1000}
    k_u0, k_u1 = POLSTER["knoechel_u"]
    for i in range(len(P)):
        r = daten["rahmen"][S[i]]
        u = _koord(r, P[i])[0]
        p2 = neu[i] + schub[i]
        # Polster am Knöchel: außen unter dem Umschlag
        k = ring[i] - daten["umschlag_ring"][S[i]]
        if 1 <= k <= 4:
            w = _glatt((u - k_u0) / 0.06) * (1.0 - _glatt((u - (k_u1 - 0.06)) / 0.06)) * (1.0 if k <= 2 else (5 - k) / 3)
            p2 = p2 + normalen[i] * (POLSTER["knoechel"] * w)
        neu[i] = p2
    for i, p in enumerate(neu):
        P[i] = p
    daten["form_neu"] = True


def _oberseite(bvh, p: Vector) -> tuple[Vector | None, Vector | None]:
    """Punkt der Oberseite des Schafts unter p (Strahl senkrecht von oben) mit nach oben gerichteter Normale."""
    ort, normale, _, _ = bvh.ray_cast(p + Vector((0.0, 0.0, 0.25)), Vector((0.0, 0.0, -1.0)), 0.6)
    if ort is None:
        return None, None
    return ort, (normale if normale.z >= 0 else -normale)


def _roehre(mitten: list[Vector], oben: list[Vector], a, b, n: int = 8, zu: bool = False,
            punkte: list | None = None, flaechen: list | None = None) -> tuple[list[Vector], list[list[int]]]:
    """Röhre mit elliptischem Querschnitt entlang der Mitten: halbe Breite `a` quer zur Bahn in der Fläche, halbe
    Dicke `b` längs `oben` (Normale der Fläche darunter); `a`, `b` als Zahl oder je Mitte. `zu`: geschlossene
    Schleife (ohne Kappen), sonst mit Kappen an beiden Enden. Hängt an `punkte`/`flaechen` an."""
    punkte = [] if punkte is None else punkte
    flaechen = [] if flaechen is None else flaechen
    m = len(mitten)
    a_l = a if isinstance(a, list) else [a] * m
    b_l = b if isinstance(b, list) else [b] * m
    start = len(punkte)
    for k in range(m):
        if zu:
            t = mitten[(k + 1) % m] - mitten[k - 1]
        else:
            t = mitten[min(k + 1, m - 1)] - mitten[max(k - 1, 0)]
        t.normalize()
        quer = oben[k].cross(t)
        if quer.length < 1e-6:
            quer = Vector((1.0, 0.0, 0.0)).cross(t)
        quer.normalize()
        hoch = t.cross(quer).normalized()
        for j in range(n):
            w = 2.0 * math.pi * j / n
            punkte.append(mitten[k] + quer * (a_l[k] * math.cos(w)) + hoch * (b_l[k] * math.sin(w)))
    ringe = m if zu else m - 1
    for k in range(ringe):
        k2 = (k + 1) % m
        for j in range(n):
            j2 = (j + 1) % n
            flaechen.append([start + k * n + j, start + k * n + j2, start + k2 * n + j2, start + k2 * n + j])
    if not zu:
        for k, rich in ((0, -1), (m - 1, 1)):
            mitte = len(punkte)
            punkte.append(mitten[k].copy())
            for j in range(n):
                j2 = (j + 1) % n
                f = [mitte, start + k * n + j, start + k * n + j2]
                flaechen.append(f if rich > 0 else f[::-1])
    return punkte, flaechen


def _schnuerung(daten: dict) -> dict:
    """Schnürung als Geometrie (D-460) auf dem Rist des fertigen Schafts (Ruhehaltung): `SENKEL["paare"]` Ösen
    je Seite von u `unten` bis `oben`, quer von `quer[0]` bis `quer[1]`, als kleine Ringe auf der Oberfläche;
    Senkel als flache Röhren über Kreuz von Öse zu Öse (die Bahn nach außen oben liegt über der anderen), unten ein
    Steg quer, oben ein Knoten mit zwei Schlaufen und zwei Enden, die auf dem Rist liegen. Jeder Punkt der Bahn
    sitzt senkrecht über der Oberfläche des Schafts (Strahl von oben). Gibt je Teil Punkte, Flächen, Seiten und
    Gewichte (vom nächsten Punkt des Schafts, so laufen Senkel und Ösen mit dem Fuß)."""
    from mathutils import kdtree
    from mathutils.bvhtree import BVHTree

    sn = SENKEL
    P = daten["punkte"]
    bvh = BVHTree.FromPolygons(P, daten["flaechen"])
    baum = kdtree.KDTree(len(P))
    for i, p in enumerate(P):
        baum.insert(p, i)
    baum.balance()
    teile = {"Senkel": ([], [], []), "Oesen": ([], [], [])}
    basis = sn["ueber"] + sn["dicke"]  # Mitte des Senkels über dem Schaft
    for s in "LR":
        r = daten["rahmen"][s]
        oesen = {+1: [], -1: []}
        for k in range(sn["paare"]):
            t = k / (sn["paare"] - 1)
            u = sn["unten"] + (sn["oben"] - sn["unten"]) * t
            q = sn["quer"][0] + (sn["quer"][1] - sn["quer"][0]) * t
            for z in (+1, -1):
                ort, n = _oberseite(bvh, _punkt(r, u, 0.0, z * q))
                oesen[z].append((ort, n))
        # Ösen: Ringe auf der Oberfläche
        pk, fl, sei = teile["Oesen"]
        for z in (+1, -1):
            for ort, n in oesen[z]:
                R, rr = sn["oese"]
                tang = n.cross(r["vor"]).normalized()
                bi = n.cross(tang).normalized()
                kreis = [ort + n * (rr * 0.6) + (tang * math.cos(w) + bi * math.sin(w)) * R
                         for w in (2 * math.pi * j / 14 for j in range(14))]
                vor_n = len(pk)
                _roehre(kreis, [n] * len(kreis), rr, rr, n=6, zu=True, punkte=pk, flaechen=fl)
                sei += [s] * (len(pk) - vor_n)

        def bahn(A: Vector, B: Vector, anhub, schritte: int = 12, tauchen: bool = True):
            mitten, normalen = [], []
            for j in range(schritte + 1):
                x = j / schritte
                X = A.lerp(B, x)
                ort, n = _oberseite(bvh, X)
                if ort is None:
                    ort, n = X, Vector((0.0, 0.0, 1.0))
                tief = -sn["dicke"] * 0.4 if tauchen and j in (0, schritte) else basis
                mitten.append(ort + n * (tief + anhub(x) if 0 < j < schritte or not tauchen else tief))
                normalen.append(n)
            return mitten, normalen

        pk, fl, sei = teile["Senkel"]

        def senkel(mitten, normalen, zu=False, dicker_ab=None):
            vor_n = len(pk)
            a = [sn["breite"]] * len(mitten)
            b = [sn["dicke"]] * len(mitten)
            if dicker_ab is not None:  # Endhülse (Aglet)
                for j in range(dicker_ab, len(mitten)):
                    a[j], b[j] = sn["breite"] * 0.75, sn["breite"] * 0.75
            _roehre(mitten, normalen, a, b, n=8, zu=zu, punkte=pk, flaechen=fl)
            sei.extend([s] * (len(pk) - vor_n))

        ob = [o[0] for o in oesen[+1]]
        un = [o[0] for o in oesen[-1]]
        # Steg unten quer
        senkel(*bahn(ob[0], un[0], lambda x: 0.0))
        # über Kreuz: außen unten nach innen oben über, innen unten nach außen oben darunter
        for k in range(sn["paare"] - 1):
            senkel(*bahn(ob[k], un[k + 1], lambda x: sn["kreuz"] * math.sin(math.pi * x)))
            senkel(*bahn(un[k], ob[k + 1], lambda x: -sn["kreuz"] * 0.8 * math.sin(math.pi * x)))
        # Knoten oben in der Mitte, etwas zur Spitze hin; Wege von den oberen Ösen dorthin
        u_k = sn["oben"] + 0.010
        K, nK = _oberseite(bvh, _punkt(r, u_k, 0.0, 0.0))
        hoch_k = basis + sn["kreuz"] + 2 * sn["dicke"]
        K = K + nK * hoch_k
        for oese in (ob[-1], un[-1]):
            mitten, normalen = bahn(oese, K - nK * hoch_k, lambda x: (hoch_k - basis) * x)
            senkel(mitten[:-1] + [K], normalen)
        vor_n = len(pk)
        knoten = []
        for j in range(10):
            w = 2 * math.pi * j / 10
            knoten.append(K + r["seit"] * (0.0022 * math.cos(w)) + r["vor"] * (0.0016 * math.sin(w)))
        _roehre(knoten, [nK] * 10, 0.0016, 0.0013, n=8, zu=True, punkte=pk, flaechen=fl)
        sei.extend([s] * (len(pk) - vor_n))
        # zwei Schlaufen zur Seite und etwas zur Spitze, zwei Enden zur Spitze hin; sie liegen auf dem Rist
        sl, en = sn["schlaufe"], sn["ende"]
        for z in (+1, -1):
            lang = (r["seit"] * (z * math.cos(math.radians(28))) + r["vor"] * math.sin(math.radians(28))).normalized()
            seit = Vector((0.0, 0.0, 1.0)).cross(lang).normalized()
            mitten, normalen = [], []
            for j in range(24):
                w = 2 * math.pi * j / 24
                along = sl["quer"] * (1 - math.cos(w)) / 2
                X = K + lang * along + seit * (sl["laenge"] / 2 * math.sin(w)) - r["vor"] * (sl["zurueck"] * math.sin(w / 2))
                ort, n = _oberseite(bvh, X)
                if ort is None:
                    ort, n = X - nK * hoch_k, nK
                x = along / sl["quer"]
                mitten.append(ort + n * (hoch_k + 0.0012 - (hoch_k - basis + 0.0004) * x))
                normalen.append(n)
            senkel(mitten, normalen, zu=True)
            richt = (r["vor"] * math.cos(math.radians(12)) + r["seit"] * (z * math.sin(math.radians(12)))).normalized()
            mitten, normalen = [], []
            for j in range(15):
                x = j / 14
                X = K + richt * (en["vor"] * x) + r["seit"] * (z * en["quer"] * x * x)
                ort, n = _oberseite(bvh, X)
                if ort is None:
                    ort, n = X - nK * hoch_k, nK
                mitten.append(ort + n * (hoch_k - (hoch_k - basis - 0.0004) * min(1.0, x * 1.6)))
                normalen.append(n)
            senkel(mitten, normalen, dicker_ab=13)
    aus = {}
    for name, (pk, fl, sei) in teile.items():
        gew = [daten["gewichte"][baum.find(p)[1]] for p in pk]
        aus[name] = (pk, fl, sei, gew)
    return aus


def _polster(daten: dict, socke_bvh) -> tuple[list[Vector], list[list[int]], list[str], list[dict]]:
    """Polster am Kragen (D-460): Wulst entlang des Umschlags von der Zunge (bis u `POLSTER["bis"]`) außen um die
    Ferse zur Zunge innen, Radius `POLSTER["radius"]`, an den Enden schmaler. Die Mitte liegt unter der
    Oberkante, der Wulst umschließt sie; zur Socke hin bleiben mindestens 2,5 mm (`socke_bvh`: Socke in der
    Ruhehaltung), sonst rückt die Mitte nach außen. Gewichte vom nächsten Punkt des Schafts."""
    from mathutils import kdtree

    P = daten["punkte"]
    normalen = _normalen(P, daten["flaechen"])
    baum = kdtree.KDTree(len(P))
    for i, p in enumerate(P):
        baum.insert(p, i)
    baum.balance()
    R = POLSTER["radius"]
    punkte, flaechen, seiten = [], [], []
    for s in "LR":
        r = daten["rahmen"][s]
        schleife = daten["umschlag"][s]
        # offene Bahn: Punkte hinter der Zunge, beginnend an der Ferse in beide Richtungen
        hinten = [i for i in schleife if _koord(r, P[i])[0] <= POLSTER["bis"]]
        k0 = schleife.index(min(hinten, key=lambda i: _koord(r, P[i])[0]))
        bahn_aussen, bahn_innen = [], []
        for k in range(1, len(schleife)):
            i = schleife[(k0 + k) % len(schleife)]
            if _koord(r, P[i])[0] > POLSTER["bis"]:
                break
            bahn_aussen.append(i)
        for k in range(1, len(schleife)):
            i = schleife[(k0 - k) % len(schleife)]
            if _koord(r, P[i])[0] > POLSTER["bis"]:
                break
            bahn_innen.append(i)
        bahn = bahn_innen[::-1] + [schleife[k0]] + bahn_aussen
        # glätten (der Umschlag springt von Punkt zu Punkt um einige Millimeter in der Höhe), dann gleichmäßig alle
        # 2,5 mm neu verteilen
        roh = [P[i].copy() for i in bahn]
        for _ in range(12):
            roh = [roh[0]] + [(roh[j - 1] + 2 * roh[j] + roh[j + 1]) / 4 for j in range(1, len(roh) - 1)] + [roh[-1]]
        laengen = [0.0]
        for a, b in zip(roh, roh[1:]):
            laengen.append(laengen[-1] + (b - a).length)
        anzahl = max(2, int(laengen[-1] / 0.0025))
        dicht, j = [], 0
        for k in range(anzahl + 1):
            ziel_l = laengen[-1] * k / anzahl
            while j < len(roh) - 2 and laengen[j + 1] < ziel_l:
                j += 1
            t = (ziel_l - laengen[j]) / max(laengen[j + 1] - laengen[j], 1e-9)
            dicht.append(roh[j].lerp(roh[j + 1], min(1.0, max(0.0, t))))
        mitten, oben, radien = [], [], []
        m = len(dicht)
        for j, p in enumerate(dicht):
            n = sum((normalen[i] for _, i, _ in baum.find_n(p, 6)), Vector()).normalized()
            ende = _glatt(min(j, m - 1 - j) / 10.0)
            # zu den Enden taucht der Wulst in die Kante, statt spitz auszulaufen
            c = p - n * (R * (POLSTER["tiefe"] + (1.2 - POLSTER["tiefe"]) * (1.0 - ende)))
            if socke_bvh is not None:
                for _ in range(6):
                    ort, nn, _, _ = socke_bvh.find_nearest(c, 0.05)
                    if ort is None:
                        break
                    frei = (c - ort).dot(nn) - R
                    if frei >= 0.0025:
                        break
                    waag = Vector((nn.x, nn.y, 0.0))
                    if waag.length < 1e-6:
                        break
                    c = c + waag.normalized() * (0.0025 - frei + 0.0002)
            mitten.append(c)
            oben.append(n)
            radien.append(R * (0.55 + 0.45 * ende))
        vor_n = len(punkte)
        _roehre(mitten, oben, radien, radien, n=10, punkte=punkte, flaechen=flaechen)
        seiten += [s] * (len(punkte) - vor_n)
    gewichte = [daten["gewichte"][baum.find(p)[1]] for p in punkte]
    return punkte, flaechen, seiten, gewichte


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
        werte["SchuhH"].append(h - _hub(u))  # über der flachen Sohle: Farbfelder folgen der angehobenen Spitze
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
    Ferse, Gewölbe und Spitze), war sie zerklüftet oder vorn offen.

    Seit D-460 (`NEU`): Der Körper der Sohle beginnt um die Höhe des Profils (`PROFIL["hoehe"]`) über dem Boden,
    darunter tragen die Stollen (`_stollen`); der Boden ist ein Netz aus Ringen statt eines Fächers, damit er der
    angehobenen Spitze folgt (`_hub`, auf alle Punkte nach ihrem u). Die Punkte der Stollen stehen in
    `_sohle.profil` (für Kanten und flache Schattierung)."""
    P, seiten = daten["punkte"], daten["seite"]
    N = SOHLE_RINGE
    punkte: list[Vector] = []
    flaechen: list[list[int]] = []
    s_neu: list[str] = []
    gewichte: list[dict] = []
    profil: list[int] = []
    T = PROFIL["hoehe"] if NEU else 0.0
    for s in "LR":
        r = daten["rahmen"][s]
        vor, seit = r["vor"], r["seit"]
        kq = [(_koord(r, P[i]), i) for i in range(len(P)) if seiten[i] == s]
        unten = [P[i] for (u, h, _), i in kq if h - _hub(u) < _oben(u)]
        c = sum(unten, Vector()) / len(unten)
        c.z = r["boden"]
        rad = _umriss(unten, c, vor, seit, N)
        start = len(punkte)
        ringe = []  # je Richtung: Boden innen, Boden außen, Wand unten, Wand oben, Kante, Lippe
        umriss = []  # Umriss unten in (u, q), für die Stollen
        for k in range(N):
            w = -math.pi + (k + 0.5) * 2 * math.pi / N
            richt = vor * math.cos(w) + seit * math.sin(w)
            aussen = c + richt * rad[k]
            u = _koord(r, aussen)[0]
            aussen = aussen + richt * _profil(SOHLE["wand"], u)
            oben = _oben(u)
            lippe = c + (aussen - c) * 0.80
            if NEU:
                umriss.append(_koord(r, aussen)[::2])
                z = Vector((0, 0, _hub(_koord(r, aussen)[0])))
                ringe.append([aussen - richt * 0.0015 + Vector((0, 0, T)) + z, aussen + Vector((0, 0, T + 0.0008)) + z,
                              aussen + Vector((0, 0, T + 0.0025)) + z, aussen + Vector((0, 0, oben - 0.003)) + z,
                              aussen + Vector((0, 0, oben)) + z, lippe + Vector((0, 0, oben - 0.002)) + z])
            else:
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
        # Deckel: Fächer um die Mitte (im Schuh, nicht zu sehen)
        mitte_oben = len(punkte)
        punkte.append(c + Vector((0, 0, _oben(0.5) - 0.002)))
        for k in range(N):
            k2 = (k + 1) % N
            flaechen.append([mitte_oben, start + k * R + R - 1, start + k2 * R + R - 1])
        if NEU:
            # Boden: Ringe zwischen dem inneren Rand und der Mitte, jeder Punkt um `_hub` angehoben
            anteile = (0.8, 0.6, 0.4, 0.2)
            innen = [ringe[k][0] for k in range(N)]
            vorige = [start + k * R for k in range(N)]
            for f in anteile:
                neu_ring = []
                for k in range(N):
                    x = c + (innen[k] - c) * f
                    x.z = r["boden"] + T + _hub(_koord(r, x)[0])
                    neu_ring.append(len(punkte))
                    punkte.append(x)
                for k in range(N):
                    k2 = (k + 1) % N
                    flaechen.append([vorige[k], neu_ring[k], neu_ring[k2], vorige[k2]])
                vorige = neu_ring
            mitte_unten = len(punkte)
            punkte.append(Vector((c.x, c.y, r["boden"] + T + _hub(_koord(r, c)[0]))))
            for k in range(N):
                flaechen.append([mitte_unten, vorige[(k + 1) % N], vorige[k]])
        else:
            mitte_unten = len(punkte)
            punkte.append(c.copy())
            for k in range(N):
                k2 = (k + 1) % N
                flaechen.append([mitte_unten, start + k2 * R, start + k * R])
        if NEU:
            vor_n = len(punkte)
            _stollen(r, umriss, punkte, flaechen)
            profil += list(range(vor_n, len(punkte)))
        anzahl = len(punkte) - start
        s_neu += [s] * anzahl
        gewichte += [{f"foot.{s}": 1.0} for _ in range(anzahl)]
    _sohle.profil = profil
    return punkte, flaechen, s_neu, gewichte


def _stollen(r: dict, umriss: list[tuple[float, float]], punkte: list[Vector], flaechen: list[list[int]]) -> None:
    """Profil der Laufsohle (D-460): Stollen quer zum Fuß, in der Mitte durch eine Fuge geteilt, von u
    `PROFIL["von"]` bis `bis`, je `laenge` lang mit `fuge` Abstand; jeder Stollen reicht von der Mittelfuge bis
    knapp an den Umriss der Sohle (`umriss` in (u, q)), vom Boden bis `ueber` in den Körper der Sohle. Seitlich
    sieht man das Profil als Kerben in der schwarzen Laufsohle. Alle Punkte folgen der angehobenen Spitze."""
    pr = PROFIL

    def q_rand(u: float, z: int) -> float | None:
        werte = []
        for (u1, q1), (u2, q2) in zip(umriss, umriss[1:] + umriss[:1]):
            if (u1 - u) * (u2 - u) <= 0 and u1 != u2:
                werte.append(q1 + (u - u1) / (u2 - u1) * (q2 - q1))
        if not werte:
            return None
        return max(werte) if z > 0 else min(werte)

    schritt = (pr["laenge"] + pr["fuge"]) / r["L"]
    u0 = pr["von"]
    while u0 + pr["laenge"] / r["L"] <= pr["bis"]:
        u1 = u0 + pr["laenge"] / r["L"]
        for z in (+1, -1):
            qa, qb = q_rand(u0, z), q_rand(u1, z)
            if qa is None or qb is None or min(abs(qa), abs(qb)) - pr["mitte"] - pr["rand"] < 0.003:
                continue
            ecken = [(u0, z * pr["mitte"]), (u0, qa - z * pr["rand"]), (u1, qb - z * pr["rand"]), (u1, z * pr["mitte"])]
            i0 = len(punkte)
            for h_unten in (True, False):
                for u, q in ecken:
                    h = _hub(u) + (0.0 if h_unten else pr["hoehe"] + pr["ueber"])
                    punkte.append(_punkt(r, u, h, q))
            flaechen += [[i0, i0 + 1, i0 + 2, i0 + 3], [i0 + 7, i0 + 6, i0 + 5, i0 + 4]]
            for j in range(4):
                j2 = (j + 1) % 4
                flaechen.append([i0 + j, i0 + 4 + j, i0 + 4 + j2, i0 + j2])
        u0 += schritt


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
        lauf = sf["laufsohle"] + (PROFIL["hoehe"] if NEU else 0.0)  # seit D-460 über dem Profil
        kappe = rech("MULTIPLY", stufe(rech("SUBTRACT", u, sf["kappe"][0]), -0.01, 0.03), sf["kappe"][1] - lauf)
        unten = stufe(rech("SUBTRACT", rech("ADD", lauf, kappe), h), -0.0006, 0.0006)
        farbe = mischen(unten, farbe, szene.srgb(SCHWARZ))
    else:
        fk = FERSENKAPPE
        # Fersenkappe: unter der Linie von (0, h_ferse) nach (u, h_sohle), hinter u
        linie = rech("SUBTRACT", fk["h_ferse"], rech("MULTIPLY", u, (fk["h_ferse"] - fk["h_sohle"]) / fk["u"]))
        kappe = rech("MULTIPLY", stufe(rech("SUBTRACT", linie, h), -0.0012, 0.0012), stufe(rech("SUBTRACT", fk["u"], u), -0.004, 0.004))
        farbe = mischen(kappe, farbe, szene.srgb(SCHWARZ))
        # Futter (D-460): innen am Kragen und an der Zunge schwarz bis zum Umschlag
        if NEU:
            farbe = mischen(stufe(attr("SchuhFutter"), 0.45, 0.55), farbe, szene.srgb(SCHWARZ))
        # Schnürung bis D-459: Schnüre quer über den Rist, Fugen in Grau (seit D-460 als Geometrie, `_schnuerung`)
        sn = SCHNUER
        auf_rist = rech("MULTIPLY", rech("MULTIPLY", stufe(rech("SUBTRACT", u, sn["von"]), -0.01, 0.01),
                                         stufe(rech("SUBTRACT", sn["bis"], u), -0.01, 0.01)),
                        stufe(rech("SUBTRACT", sn["breite"], rech("ABSOLUTE", q)), -0.001, 0.001))
        welle = nodes.new("ShaderNodeMath")
        welle.operation = "FRACT"
        links.new(rech("DIVIDE", rech("MULTIPLY", u, 0.27), sn["abstand"]), welle.inputs[0])  # Fußlänge rund 0,27 m
        fuge = rech("MULTIPLY", auf_rist, rech("MULTIPLY", stufe(rech("SUBTRACT", welle.outputs[0], sn["schatten"][0]), -0.02, 0.02),
                                                stufe(rech("SUBTRACT", sn["schatten"][1], welle.outputs[0]), -0.02, 0.02)))
        if not NEU:
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
    if NEU:
        _form_neu(daten, koerper)  # Zehenbox, Polster am Knöchel, angehobene Spitze (D-460)
    P, seiten, F = daten["punkte"], daten["seite"], daten["flaechen"]
    normalen = _normalen(P, F)
    teile = []
    # Schaft: weiß mit Fersenkappe und Logos; Innenseite (Futter) und Kante schwarz; seit D-460 auch das Futter
    # bis zum Umschlag (Attribut „SchuhFutter“)
    attribute = _attribute_schuh(daten, P, seiten)
    if NEU:
        attribute["SchuhFutter"] = [1.0 if rg < daten["umschlag_ring"][sd] else (0.5 if rg == daten["umschlag_ring"][sd] else 0.0)
                                    for rg, sd in zip(daten["ring"], seiten)]
    schaft = _netz("Schuhe", P, F, daten["gewichte"], koerper, skelett, attribute)
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
    if NEU:
        # Futter dünn (D-460): Seine Normalen zeigen zum Bein, die Dicke wächst also nach außen zur Außenlage. Wo das
        # Futter näher als 2 mm an der Außenlage lag (an der Ferse bis 1 mm), schaute seine schwarze Rückseite durch
        # die Außenseite (beim Bankdrücken innen an der Ferse, auch im Schuh bis D-459). Jetzt 0,3 mm
        gruppe = schaft.vertex_groups.new(name="Dicke")
        for i, (rg, sd) in enumerate(zip(daten["ring"], seiten)):
            gruppe.add([i], 1.0 if rg > daten["umschlag_ring"][sd] else FUTTER_DICKE / SCHAFT_DICKE, "REPLACE")
        dicke.vertex_group = "Dicke"
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
    if NEU:
        # Stollen des Profils: Kanten scharf (Falte für die Glättung), Flächen flach schattiert
        profil = set(_sohle.profil)
        mesh = sohle.data
        falte = mesh.attributes.get("crease_edge") or mesh.attributes.new("crease_edge", "FLOAT", "EDGE")
        for e in mesh.edges:
            if e.vertices[0] in profil and e.vertices[1] in profil:
                falte.data[e.index].value = 1.0
        for poly in mesh.polygons:
            if poly.vertices[0] in profil:
                poly.use_smooth = False
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
    if NEU:
        teile += _teile_neu(daten, koerper, skelett)
    # Socke aus dem Netz der Figur
    socke, feld = _socke(koerper, skelett, k, daten)
    teile.append(socke)
    anziehen.daten = daten
    return {"teile": teile, "socke": feld}


def _geschlossen(obj: bpy.types.Object) -> None:
    """Normalen eines Netzes aus geschlossenen Körpern nach außen."""
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(obj.data)
    bm.free()


def _teile_neu(daten: dict, koerper: bpy.types.Object, skelett: bpy.types.Object) -> list[bpy.types.Object]:
    """Senkel, Ösen und Polster am Kragen (D-460) als eigene Netze an denselben Knochen wie der Schaft."""
    from mathutils.bvhtree import BVHTree

    teile = []
    for name, (pk, fl, sei, gew) in _schnuerung(daten).items():
        obj = _netz(name, pk, fl, gew, koerper, skelett, {}, glatt=1)
        _geschlossen(obj)
        if name == "Senkel":
            mat = szene.matt("Senkel", SENKEL_WEISS, 0.8)
            mat.node_tree.nodes["Principled BSDF"].inputs["Sheen Weight"].default_value = 0.3
        else:
            mat = szene.matt("Oesen", OESE_GRAU, 0.4)
        obj.data.materials.append(mat)
        teile.append(obj)
    verts = koerper.data.vertices
    socke = BVHTree.FromPolygons([v.co + v.normal * SOCKE["abstand"] for v in verts],
                                 [list(f.vertices) for f in koerper.data.polygons])
    pk, fl, sei, gew = _polster(daten, socke)
    # „Kragenpolster“: die Bank des Bankdrückens hat schon ein Teil namens „Polster“
    polster = _netz("Kragenpolster", pk, fl, gew, koerper, skelett, {}, glatt=2)
    _geschlossen(polster)
    mat = szene.matt("Kragenpolster", SCHWARZ, 0.75)
    mat.node_tree.nodes["Principled BSDF"].inputs["Sheen Weight"].default_value = 0.1
    polster.data.materials.append(mat)
    teile.append(polster)
    return teile


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
    _socke.mitten = {s: r[0].copy() for s, r in rahmen.items()}  # F der Socke, für Nahaufnahmen (D-453)
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


def pruefung_neu(koerper: bpy.types.Object, socke: bpy.types.Object) -> dict:
    """Prüfung der Teile seit D-460 in der aktuellen Haltung (verformte Netze ohne Glättung, Welt):

    - **Senkel, Ösen, Polster über der Socke** (mm): kleinster Abstand ihrer Punkte über der Socke, negativ heißt,
      das Teil schneidet in die Socke (oder das Bein);
    - **Zehenbox über der Socke** (mm): kleinster Abstand der Socke im Schuh unter der Außenseite des Schafts,
      zwischen Oberkante der Sohle (an der Spitze mit angehoben) und 5 cm über dem Boden (Lage in der
      Ruhehaltung), negativ heißt, die Socke ragt durch den Schaft; darunter umschließt die Sohle die Socke;
    - **Socke sichtbar außerhalb des Schuhs** (Punkte): sichtbare Punkte der Socke unter 5 cm, die weder im Schaft
      noch in der Sohle liegen; dort sähe man die Socke durch den Schuh."""
    from mathutils.bvhtree import BVHTree

    o = bpy.data.objects
    daten = anziehen.daten
    sp, sf, sn = _verformt(socke)
    bvh_socke = BVHTree.FromPolygons(sp, sf)
    aus: dict[str, float] = {}
    for name, titel in (("Senkel", "Senkel"), ("Oesen", "Ösen"), ("Kragenpolster", "Polster")):
        if name not in o:
            continue
        abst = []
        for q in _verformt(o[name])[0]:
            ort, n, _, _ = bvh_socke.find_nearest(q, 0.05)
            if ort is not None:
                abst.append((q - ort).dot(n))
        aus[f"{titel}: kleinster Abstand über der Socke (mm)"] = min(abst) * 1000 if abst else float("nan")
    hp, hf, _ = _verformt(o["Schuhe"])
    bvh_schaft = BVHTree.FromPolygons(hp, hf)
    op, of, _ = _verformt(o["Sohle"])
    bvh_sohle = BVHTree.FromPolygons(op, of)
    saum = [a.value for a in socke.data.attributes["Saum"].data]
    im_schuh = [a.value for a in socke.data.attributes["ImSchuh"].data]
    nummer = [int(a.value) for a in socke.data.attributes["nummer"].data]
    verts = koerper.data.vertices
    zehen, sichtbar = [], 0
    for i, p in enumerate(sp):
        if saum[i] <= 0.0:
            continue
        ruhe = verts[nummer[i]].co + verts[nummer[i]].normal * SOCKE["abstand"]
        seite = "L" if ruhe.x > 0 else "R"
        u, h, _ = _koord(daten["rahmen"][seite], ruhe)
        if not -0.05 < u < 1.05 or h > 0.05:
            continue
        if im_schuh[i] >= 0.5:
            if h > _oben(u) + _hub(u):  # über der Oberkante der Sohle, die an der Spitze mit angehoben ist
                ort, n, _, _ = bvh_schaft.find_nearest(p, 0.05)
                if ort is not None:
                    zehen.append(-(p - ort).dot(n))
        else:
            if _im_schaft(bvh_schaft, p, sn[i]):
                continue
            ort, n, _, _ = bvh_sohle.ray_cast(p, Vector((0.0, 0.0, 1.0)), 0.2)
            if ort is not None and n.z > 0:
                continue
            sichtbar += 1
    aus["Zehenbox: Socke unter der Außenseite des Schafts (mm)"] = min(zehen) * 1000 if zehen else float("nan")
    aus["Socke: sichtbar außerhalb des Schuhs unter 5 cm (Punkte)"] = sichtbar
    return aus
