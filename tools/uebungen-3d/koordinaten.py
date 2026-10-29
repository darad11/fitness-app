"""Körperkoordinaten der Figur in der Grundhaltung (aus `zonen.py`, D-409; seit D-449 eigenes Modul).

Die Kleidung (`kleidung.py`) legt Säume, Halsöffnung und Logos in diesen Koordinaten fest, damit
dieselbe Zahl bei jeder Körperform dieselbe Stelle trifft:

- **Rumpf:** Höhe s (0 = Hüftgelenke, 1 = Halsansatz) und Winkel um die Längsachse
  (0° vorn, 90° seitlich, 180° hinten; beide Seiten gespiegelt).
- **Gliedmaßen:** Anteil t entlang des Knochens (0 = oberes Gelenk, 1 = unteres Gelenk) und
  Winkel um den Knochen (0° vorn bzw. Beugeseite, 90° außen, 180° hinten, 270° innen).

Bis D-448 lagen hier auch die Muskelzonen in Lime; seit D-449 zeigt nur noch die Muskelkarte der
Übungsdetails, welche Muskeln arbeiten.
"""
from __future__ import annotations

import math

import bpy
from mathutils import Vector


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
