"""Muskelzonen auf dem Körper (Pilot 3D, D-402).

Je Eckpunkt ein Wert „Zone“ zwischen 0 (Grau) und 1 (Lime). Bestimmt in der Grundhaltung aus den
Gewichten der Knochen (welcher Körperteil), der Lage (Höhe, Seite) und der Richtung der Normale
(vorn oder hinten), dann geglättet, damit die Ränder weich verlaufen. Hauptmuskeln bekommen 1,
mitarbeitende 0,45.
"""
from __future__ import annotations

from collections import defaultdict

import bpy
from mathutils import Vector


def _glatt(x: float, a: float, b: float) -> float:
    """Weicher Übergang von 0 bei a nach 1 bei b."""
    if a == b:
        return 1.0 if x >= b else 0.0
    t = max(0.0, min(1.0, (x - a) / (b - a)))
    return t * t * (3 - 2 * t)


def _band(x: float, unten: float, oben: float, rand: float = 0.02) -> float:
    return _glatt(x, unten - rand, unten + rand) * (1 - _glatt(x, oben - rand, oben + rand))


class Koerperdaten:
    def __init__(self, koerper: bpy.types.Object, skelett: bpy.types.Object):
        self.mesh = koerper.data
        namen = {g.index: g.name for g in koerper.vertex_groups}
        self.gewichte: list[dict[str, float]] = []
        for v in self.mesh.vertices:
            self.gewichte.append({namen[g.group]: g.weight for g in v.groups})
        self.knochen = {b.name: (b.head_local.copy(), b.tail_local.copy()) for b in skelett.data.bones}

    def w(self, i: int, *namen: str) -> float:
        g = self.gewichte[i]
        return sum(g.get(n + s, 0.0) for n in namen for s in (".L", ".R", ""))

    def kopf(self, name: str) -> Vector:
        return self.knochen[name][0]


def _zone(d: Koerperdaten, name: str, i: int, p: Vector, n: Vector) -> float:
    vorn = _glatt(-n.y, -0.1, 0.35)
    hinten = _glatt(n.y, -0.1, 0.35)
    x = abs(p.x)
    huefte = d.kopf("upperleg01.L").z
    knie = d.kopf("lowerleg01.L").z
    schulter = d.kopf("upperarm01.L").z
    bein = d.w(i, "upperleg01", "upperleg02")
    oberarm = d.w(i, "upperarm01", "upperarm02")
    arm = oberarm + d.w(i, "shoulder01", "lowerarm01", "lowerarm02")
    if name == "quads":
        # Vorderseite und Außenseite des Oberschenkels, über dem Knie bis unter die Leiste.
        achse_x = d.kopf("upperleg02.L").x + (p.z - d.kopf("upperleg02.L").z) * -0.15
        aussen = _glatt(x - achse_x, -0.04, 0.0)
        seite = max(vorn, aussen * _glatt(-n.y, -0.5, -0.1))
        return _glatt(bein, 0.4, 0.7) * seite * _band(p.z, knie + 0.07, huefte - 0.05, 0.03)
    if name == "adductors":
        achse_x = d.kopf("upperleg02.L").x
        innen = _glatt(achse_x - x, 0.0, 0.035)
        return _glatt(bein, 0.4, 0.7) * innen * _band(p.z, knie + 0.12, huefte - 0.04, 0.03)
    if name == "glutes":
        return hinten * _band(p.z, huefte - 0.14, huefte + 0.1, 0.03) * (1 - _glatt(x, 0.16, 0.19)) * (
            1 - _glatt(-p.y, -0.01, 0.03))
    if name == "lower_back":
        return hinten * _band(p.z, huefte + 0.1, huefte + 0.24, 0.03) * (1 - _glatt(x, 0.05, 0.08))
    if name == "chest":
        return vorn * _band(p.z, schulter - 0.2, schulter - 0.01, 0.025) * (
            1 - _glatt(x, 0.13, 0.17)) * _glatt(x, 0.0, 0.015) * (1 - _glatt(oberarm, 0.2, 0.5))
    if name == "front_delts":
        return vorn * _glatt(d.w(i, "shoulder01", "upperarm01") + oberarm * 0.5, 0.35, 0.6) * _band(
            p.z, schulter - 0.12, schulter + 0.06, 0.02)
    if name == "biceps":
        return _glatt(-n.y + 0.1, 0.0, 0.3) * _glatt(d.w(i, "upperarm02"), 0.5, 0.8) * _band(
            p.z, d.kopf("lowerarm01.L").z + 0.03, schulter - 0.06, 0.02)
    if name == "triceps":
        return _glatt(n.y + 0.1, 0.0, 0.3) * _glatt(d.w(i, "upperarm02"), 0.5, 0.8) * _band(
            p.z, d.kopf("lowerarm01.L").z + 0.02, schulter - 0.04, 0.02)
    if name == "lats":
        # Breiter Rückenmuskel: seitlich und hinten zwischen Achsel und unteren Rippen.
        breite = 0.06 + (p.z - (schulter - 0.32)) * 0.35
        return max(hinten, _glatt(abs(n.x), 0.5, 0.8) * _glatt(n.y, -0.3, 0.0)) * _band(
            p.z, schulter - 0.3, schulter - 0.07, 0.03) * _glatt(x, 0.035, 0.06) * (
            1 - _glatt(x, breite + 0.1, breite + 0.13)) * (1 - _glatt(arm, 0.25, 0.5))
    if name == "upper_back":
        return hinten * _band(p.z, schulter - 0.14, schulter + 0.03, 0.025) * (1 - _glatt(x, 0.1, 0.13)) * (
            1 - _glatt(arm, 0.3, 0.5))
    raise ValueError(name)


def setze_zonen(koerper: bpy.types.Object, skelett: bpy.types.Object, haupt: list[str],
                mit: list[str], glaetten: int = 2) -> None:
    d = Koerperdaten(koerper, skelett)
    werte = [0.0] * len(d.mesh.vertices)
    for v in d.mesh.vertices:
        z = 0.0
        for name in haupt:
            z = max(z, _zone(d, name, v.index, v.co, v.normal))
        for name in mit:
            z = max(z, 0.45 * _zone(d, name, v.index, v.co, v.normal))
        werte[v.index] = z
    nachbarn: dict[int, list[int]] = defaultdict(list)
    for e in d.mesh.edges:
        a, b = e.vertices
        nachbarn[a].append(b)
        nachbarn[b].append(a)
    for _ in range(glaetten):
        werte = [
            (werte[i] * 2 + sum(werte[j] for j in nachbarn[i])) / (2 + len(nachbarn[i])) if nachbarn[i] else werte[i]
            for i in range(len(werte))
        ]
    attr = d.mesh.attributes.get("Zone") or d.mesh.attributes.new("Zone", "FLOAT", "POINT")
    for i, wert in enumerate(werte):
        attr.data[i].value = wert
