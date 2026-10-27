"""Muskelzonen mit klaren Rändern (D-409).

Jeder Muskel ist ein Umriss in Körperkoordinaten:

- **Rumpf:** Höhe s (0 = Hüftgelenke, 1 = Halsansatz) und Winkel um die Längsachse
  (0° vorn, 90° seitlich, 180° hinten; beide Seiten gespiegelt).
- **Gliedmaßen:** Anteil t entlang des Knochens (0 = oberes Gelenk, 1 = unteres Gelenk) und
  Winkel um den Knochen (0° vorn bzw. Beugeseite, 90° außen, 180° hinten, 270° innen).

Je Eckpunkt wird der vorzeichenbehaftete Abstand zum Umriss gespeichert (in Metern, positiv
innen); der Shader schneidet scharf bei 0. Weil der Abstand stetig über die Fläche verläuft,
ist der Rand glatt und scharf zugleich, unabhängig von der Netzauflösung: kein Farbnebel.
Gespeichert werden zwei Werte je Eckpunkt: „Zone“ (Hauptmuskeln) und „ZoneMit“ (mitarbeitend).
"""
from __future__ import annotations

import math

import bpy
from mathutils import Vector

# Umrisse: Liste von (Winkel in Grad, Anteil). Rumpf: Winkel |θ| 0–180. Gliedmaßen: 0–360.
RUMPF = {
    "chest": [(5, 0.63), (5, 0.84), (18, 0.875), (40, 0.885), (62, 0.87), (78, 0.83), (86, 0.77), (84, 0.71), (72, 0.655), (52, 0.61), (30, 0.59), (14, 0.595)],
    "abs": [(2, 0.14), (2, 0.58), (22, 0.58), (24, 0.40), (22, 0.16)],
    "obliques": [(30, 0.18), (28, 0.48), (52, 0.54), (78, 0.44), (80, 0.24), (58, 0.16)],
    "lats": [(96, 0.80), (112, 0.82), (140, 0.70), (164, 0.54), (171, 0.34), (160, 0.26), (130, 0.32), (106, 0.48), (94, 0.64)],
    "upper_back": [(178, 0.62), (155, 0.68), (135, 0.78), (138, 0.88), (160, 0.93), (178, 0.94)],
    "traps": [(178, 0.92), (150, 0.92), (115, 0.96), (110, 1.04), (150, 1.10), (178, 1.10)],
    "lower_back": [(176, 0.18), (154, 0.18), (152, 0.36), (156, 0.50), (176, 0.52)],
    "glutes": [(176, -0.12), (152, -0.17), (122, -0.15), (102, -0.04), (100, 0.10), (116, 0.19), (146, 0.22), (172, 0.17)],
}
OBERSCHENKEL = {
    "quads": [(-55, 0.12), (-20, 0.06), (40, 0.05), (100, 0.12), (112, 0.45), (100, 0.80), (60, 0.92), (20, 0.93), (-20, 0.93), (-58, 0.88), (-78, 0.76), (-72, 0.52), (-62, 0.28)],
    "adductors": [(-62, 0.04), (-150, 0.06), (-140, 0.40), (-98, 0.62), (-74, 0.46), (-60, 0.16)],
    "hamstrings": [(128, 0.16), (232, 0.16), (230, 0.86), (205, 0.92), (155, 0.92), (130, 0.86)],
    "abductors": [(70, -0.05), (125, -0.05), (120, 0.25), (80, 0.25)],
}
UNTERSCHENKEL = {
    "calves": [(125, 0.06), (235, 0.06), (225, 0.52), (180, 0.60), (135, 0.52)],
}
OBERARM = {
    "biceps": [(-40, 0.32), (40, 0.32), (42, 0.82), (0, 0.90), (-42, 0.82)],
    "triceps": [(115, 0.14), (245, 0.14), (240, 0.86), (180, 0.95), (120, 0.86)],
    "front_delts": [(-45, -0.12), (0, -0.22), (45, -0.20), (55, 0.30), (15, 0.40), (-30, 0.22)],
    "side_delts": [(45, -0.20), (100, -0.22), (125, 0.20), (85, 0.42), (55, 0.30)],
    "rear_delts": [(100, -0.22), (170, -0.18), (190, 0.10), (150, 0.30), (125, 0.20)],
}
UNTERARM = {
    "forearms": [(-185, 0.04), (185, 0.04), (185, 0.68), (-185, 0.68)],
}
GANZ = list(RUMPF) + list(OBERSCHENKEL) + list(UNTERSCHENKEL) + list(OBERARM) + list(UNTERARM)
# Muskeln der App ohne eigenen Umriss
AUFGETEILT = {"full_body": GANZ}


def _sdf(px: float, py: float, poly: list[tuple[float, float]]) -> float:
    """Vorzeichenbehafteter Abstand zu einem Vieleck (positiv innen)."""
    d = 1e9
    innen = False
    n = len(poly)
    for i in range(n):
        ax, ay = poly[i]
        bx, by = poly[(i + 1) % n]
        ex, ey = bx - ax, by - ay
        wx, wy = px - ax, py - ay
        t = max(0.0, min(1.0, (wx * ex + wy * ey) / (ex * ex + ey * ey)))
        dx, dy = wx - ex * t, wy - ey * t
        d = min(d, dx * dx + dy * dy)
        if (ay > py) != (by > py):
            x = ax + (py - ay) * (bx - ax) / (by - ay)
            if px < x:
                innen = not innen
    d = math.sqrt(d)
    return d if innen else -d


class Koordinaten:
    def __init__(self, koerper: bpy.types.Object, skelett: bpy.types.Object):
        b = {x.name: x for x in skelett.data.bones}
        self.kopf = {n: x.head_local.copy() for n, x in b.items()}
        self.mesh = koerper.data
        namen = {g.index: g.name for g in koerper.vertex_groups}
        self.gewichte = [{namen[g.group]: g.weight for g in v.groups} for v in self.mesh.vertices]
        self.O = (self.kopf["upperleg01.L"] + self.kopf["upperleg01.R"]) / 2
        self.N = self.kopf["neck01"]

    def w(self, i: int, *namen: str) -> float:
        g = self.gewichte[i]
        return sum(g.get(n, 0.0) for n in namen)

    def rumpf(self, p: Vector) -> tuple[float, float, float]:
        u = (self.N - self.O)
        L = u.length
        u.normalize()
        rel = p - self.O
        s = rel.dot(u) / L
        r = rel - rel.dot(u) * u
        theta = math.degrees(math.atan2(abs(r.x), -r.y))
        return theta, s, L

    def glied(self, p: Vector, a: str, b: str, vorn: Vector, seite: str) -> tuple[float, float, float, float]:
        A, B = self.kopf[a], self.kopf[b]
        u = B - A
        L = u.length
        u.normalize()
        rel = p - A
        t = rel.dot(u) / L
        r = rel - rel.dot(u) * u
        ant = (vorn - vorn.dot(u) * u).normalized()
        lat = u.cross(ant) if seite == "L" else ant.cross(u)
        if lat.x * (1 if seite == "L" else -1) < 0:
            lat = -lat
        theta = math.degrees(math.atan2(r.dot(lat), r.dot(ant)))
        return theta, t, L, r.length


def _feld(k: Koordinaten, i: int, p: Vector, muskel: str) -> float:
    """Abstand (m, positiv innen) des Eckpunkts i zum Umriss des Muskels."""
    if muskel in AUFGETEILT:
        return max(_feld(k, i, p, m) for m in AUFGETEILT[muskel])
    seite = "L" if p.x >= 0 else "R"
    if muskel in RUMPF:
        theta, s, L = k.rumpf(p)
        # nur Rumpf und Becken: Eckpunkte mit Gewicht auf Rumpfknochen, nicht Arme oder Hände
        rumpfknochen = ("root", "spine01", "spine02", "spine03", "spine04", "spine05", "neck01",
                        "pelvis.L", "pelvis.R", "clavicle.L", "clavicle.R", "breast.L", "breast.R",
                        "shoulder01.L", "shoulder01.R")
        if k.w(i, *rumpfknochen) < 0.3 and muskel != "glutes":
            return -1.0
        if k.w(i, *(f"{n}.{seite}" for n in ("upperarm01", "upperarm02", "lowerarm01", "lowerarm02"))) > 0.35:
            return -1.0
        if muskel != "glutes" and k.w(i, f"upperleg01.{seite}", f"upperleg02.{seite}") > 0.4:
            return -1.0
        return _sdf(theta * math.pi / 180 * 0.13, s * L, [(a * math.pi / 180 * 0.13, b * L) for a, b in RUMPF[muskel]])
    tabellen = (
        (OBERSCHENKEL, "upperleg01", "lowerleg01", ("upperleg01", "upperleg02"), -Vector((0, 1, 0)), 0.075),
        (UNTERSCHENKEL, "lowerleg01", "foot", ("lowerleg01", "lowerleg02"), -Vector((0, 1, 0)), 0.05),
        (OBERARM, "upperarm01", "lowerarm01", ("upperarm01", "upperarm02", "shoulder01"), None, 0.045),
        (UNTERARM, "lowerarm01", "wrist", ("lowerarm01", "lowerarm02"), None, 0.035),
    )
    for tabelle, a, b, glieder, vorn, radius in tabellen:
        if muskel not in tabelle:
            continue
        if k.w(i, *(f"{n}.{seite}" for n in glieder)) < 0.3:
            return -1.0
        if vorn is None:
            # Beugeseite des Arms in der Grundhaltung: Richtung, in die der Unterarm abknickt
            E0, W0 = k.kopf[f"lowerarm01.{seite}"], k.kopf[f"wrist.{seite}"]
            vorn = (W0 - E0).normalized()
        theta, t, L, _ = k.glied(p, f"{a}.{seite}", f"{b}.{seite}", vorn, seite)
        poly = tabelle[muskel]
        # Winkel in den Bereich des Umrisses legen (Umrisse über 180° hinweg)
        if min(x for x, _ in poly) >= 0 and max(x for x, _ in poly) > 180 and theta < 0:
            theta += 360
        return _sdf(theta * math.pi / 180 * radius, t * L, [(x * math.pi / 180 * radius, y * L) for x, y in poly])
    return -1.0


def setze_zonen(koerper: bpy.types.Object, skelett: bpy.types.Object, haupt: list[str], mit: list[str]) -> None:
    k = Koordinaten(koerper, skelett)
    mesh = koerper.data
    for name, liste in (("Zone", haupt), ("ZoneMit", mit)):
        attr = mesh.attributes.get(name) or mesh.attributes.new(name, "FLOAT", "POINT")
        for v in mesh.vertices:
            werte = [_feld(k, v.index, v.co, m) for m in liste]
            attr.data[v.index].value = max(werte) if werte else -1.0
