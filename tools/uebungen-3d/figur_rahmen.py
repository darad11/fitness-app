"""Figur über die ganze Bewegung ins Bild einpassen (D-500, D-501).

Die Kamera der Schleifen passt sonst Figur und Gerät zusammen ins Bild (`szene.bildausschnitt`). Liegt
das Gerät weit um die Figur (Beinpresse, Kabelzug), bleibt die Figur klein; ragt die Figur über das
Gerät hinaus (Beinbeuger), kann sie den Rand berühren. Mit `fuellen` füllt die Figur ihren Rahmen:
Kamera in Richtung und Neigung der Übung, auf die Mitte der Figur gerichtet, so nah, dass die Figur in
jedem Bild der Bewegung mit dem Rand ganz im Bild bleibt. Geräte dürfen am Rand angeschnitten sein.
"""
from __future__ import annotations

import math

import bpy
import numpy as np
from mathutils import Vector

SENSOR = 36.0  # Sensorbreite in mm, wie die Kamera in `szene.licht_und_kamera`


def figur_objekte(u) -> list:
    """Netze am Skelett der Figur: Körper, Kleidung, Schuhe, Haare, Augen."""
    return [o for o in bpy.data.objects if o.type == "MESH" and not o.hide_render and any(
        m.type == "ARMATURE" and m.object == u.skelett for m in o.modifiers)]


def punkte(objs) -> np.ndarray:
    """Eckpunkte der Netze in Weltkoordinaten (n × 3), Körper ohne Glättung wie `_netz`."""
    for o in objs:
        sub = o.modifiers.get("Glatt")
        if sub:
            sub.show_viewport = False
    deps = bpy.context.evaluated_depsgraph_get()
    deps.update()
    teile = []
    for o in objs:
        ev = o.evaluated_get(deps)
        me = ev.to_mesh()
        co = np.empty(len(me.vertices) * 3)
        me.vertices.foreach_get("co", co)
        co = co.reshape(-1, 3)
        mw = np.array(ev.matrix_world)
        teile.append(co @ mw[:3, :3].T + mw[:3, 3])
        ev.to_mesh_clear()
    for o in objs:
        sub = o.modifiers.get("Glatt")
        if sub:
            sub.show_viewport = True
    return np.concatenate(teile)


def achsen(richtung_grad: float, neigung_grad: float) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Ziel → Kamera, rechts und oben im Bild, wie in `szene.bildausschnitt`."""
    w, e = math.radians(richtung_grad), math.radians(neigung_grad)
    r = np.array([math.sin(w) * math.cos(e), -math.cos(w) * math.cos(e), math.sin(e)])
    rechts = np.cross([0.0, 0.0, 1.0], r)
    rechts /= np.linalg.norm(rechts)
    oben = np.cross(r, rechts)
    oben /= np.linalg.norm(oben)
    return r, rechts, oben


def bildpunkte(P: np.ndarray, ziel: np.ndarray, abstand: float, ax, breite: int, hoehe: int,
               brennweite: float) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Pixel (x nach rechts, y nach unten) und Tiefe für die Kamera im `abstand` vor dem Ziel."""
    r, rechts, oben = ax
    f_px = breite * brennweite / SENSOR
    v = P - (ziel + r * abstand)
    tiefe = -(v @ r)
    return breite / 2 + f_px * (v @ rechts) / tiefe, hoehe / 2 - f_px * (v @ oben) / tiefe, tiefe


def fuellen(P: np.ndarray, richtung_grad: float, neigung_grad: float, breite: int, hoehe: int, rand: float,
            brennweite: float = 50.0) -> tuple[Vector, float]:
    """Ziel und Abstand der Kamera, bei denen die Figur (alle Punkte `P` über die Bewegung) mittig im
    Bild steht und es bis auf `rand` (Anteil der Bildseite) füllt. Gibt (Ziel, Abstand entlang der
    Blickrichtung) zurück; waagrecht `abstand · cos(Neigung)`, Höhe `abstand · sin(Neigung)`."""
    ax = achsen(richtung_grad, neigung_grad)
    r, rechts, oben = ax
    f_px = breite * brennweite / SENSOR

    def mittig(abstand: float) -> np.ndarray:
        ziel = P.mean(axis=0)
        for _ in range(4):
            x, y, _ = bildpunkte(P, ziel, abstand, ax, breite, hoehe, brennweite)
            dx = (x.max() + x.min()) / 2 - breite / 2
            dy = (y.max() + y.min()) / 2 - hoehe / 2
            ziel = ziel + rechts * dx * abstand / f_px - oben * dy * abstand / f_px
        return ziel

    def passt(abstand: float) -> bool:
        ziel = mittig(abstand)
        x, y, tiefe = bildpunkte(P, ziel, abstand, ax, breite, hoehe, brennweite)
        if tiefe.min() <= 0.05:
            return False
        return (x.min() >= rand * breite and x.max() <= breite * (1 - rand)
                and y.min() >= rand * hoehe and y.max() <= hoehe * (1 - rand))

    lo, hi = 0.3, 30.0
    for _ in range(40):
        mid = (lo + hi) / 2
        if passt(mid):
            hi = mid
        else:
            lo = mid
    return Vector(mittig(hi).tolist()), hi
