"""Figur für die Übungsbilder (Phase Übungen, Pilot 3D, D-401).

Baut in Blender (als Python-Modul `bpy`) das Grundmodell von MakeHuman mit Skelett und Gewichten
auf. Grundlage sind drei Dateien aus dem MakeHuman-Repository, alle CC0 1.0 (Lizenz der Assets,
`makehuman/LICENSE.md` Abschnitt C; Renderings ausdrücklich ohne Anspruch, Abschnitt D):

    makehuman/data/3dobjs/base.obj           Grundmodell (neutral, ohne Geschlechtsmerkmale)
    makehuman/data/rigs/default.mhskel       Skelett: Gelenke als Mittelpunkte von Eckpunkten
    makehuman/data/rigs/default_weights.mhw  Gewichte je Knochen

Die Dateien liegen nicht im Repository (rund 2,8 MB); `render.py --hole` lädt sie nach
`tools/uebungen-3d/quelle/` (in `.gitignore`).
"""
from __future__ import annotations

import json
from pathlib import Path

import bpy
from mathutils import Vector

QUELLE = Path(__file__).resolve().parent / "quelle"
# MakeHuman rechnet in Dezimetern mit y nach oben; Blender in Metern mit z nach oben.
SKALA = 0.1


def mh_zu_blender(x: float, y: float, z: float) -> Vector:
    return Vector((x * SKALA, -z * SKALA, y * SKALA))


def lies_obj(pfad: Path) -> tuple[list[Vector], list[list[int]]]:
    """Eckpunkte und nur die Flächen der Gruppe „body“ (ohne Hilfsgeometrie)."""
    punkte: list[Vector] = []
    flaechen: list[list[int]] = []
    gruppe = ""
    for zeile in pfad.read_text(encoding="utf-8").splitlines():
        if zeile.startswith("v "):
            _, x, y, z = zeile.split()[:4]
            punkte.append(mh_zu_blender(float(x), float(y), float(z)))
        elif zeile.startswith("g "):
            gruppe = zeile[2:].strip()
        elif zeile.startswith("f ") and gruppe == "body":
            flaechen.append([int(teil.split("/")[0]) - 1 for teil in zeile.split()[1:]])
    return punkte, flaechen


def baue_figur(name: str = "Figur") -> tuple[bpy.types.Object, bpy.types.Object]:
    """Gibt (Körper, Skelett) zurück. Der Körper hängt mit Gewichten am Skelett."""
    punkte, flaechen = lies_obj(QUELLE / "base.obj")
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata([tuple(p) for p in punkte], [], flaechen)
    mesh.update()
    for poly in mesh.polygons:
        poly.use_smooth = True
    koerper = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(koerper)

    skel = json.loads((QUELLE / "default.mhskel").read_text(encoding="utf-8"))
    gelenke = {
        name: sum((punkte[i] for i in idx), Vector()) / len(idx)
        for name, idx in skel["joints"].items()
    }
    arm_daten = bpy.data.armatures.new(name + "Skelett")
    skelett = bpy.data.objects.new(name + "Skelett", arm_daten)
    bpy.context.scene.collection.objects.link(skelett)
    bpy.context.view_layer.objects.active = skelett
    bpy.ops.object.mode_set(mode="EDIT")
    knochen = {}
    for kname, k in skel["bones"].items():
        eb = arm_daten.edit_bones.new(kname)
        eb.head = gelenke[k["head"]]
        eb.tail = gelenke[k["tail"]]
        if (eb.tail - eb.head).length < 1e-4:
            eb.tail = eb.head + Vector((0, 0, 0.01))
        knochen[kname] = eb
    for kname, k in skel["bones"].items():
        if k["parent"]:
            knochen[kname].parent = knochen[k["parent"]]
            # Verbunden, wo der Kopf am Ende des Elternknochens sitzt.
            if (knochen[kname].head - knochen[k["parent"]].tail).length < 1e-3:
                knochen[kname].use_connect = True
    bpy.ops.object.mode_set(mode="OBJECT")

    gewichte = json.loads((QUELLE / "default_weights.mhw").read_text(encoding="utf-8"))["weights"]
    for kname, paare in gewichte.items():
        gruppe = koerper.vertex_groups.new(name=kname)
        for index, wert in paare:
            gruppe.add([index], wert, "REPLACE")
    mod = koerper.modifiers.new("Skelett", "ARMATURE")
    mod.object = skelett
    koerper.parent = skelett

    # Lose Eckpunkte der Hilfsgeometrie entfernen, nachdem die Gewichte gesetzt sind.
    bpy.context.view_layer.objects.active = koerper
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="DESELECT")
    bpy.ops.mesh.select_loose()
    bpy.ops.mesh.delete(type="VERT")
    bpy.ops.object.mode_set(mode="OBJECT")
    # Füße auf den Boden (z = 0): Das Grundmodell steht um den Ursprung.
    unten = min(v.co.z for v in koerper.data.vertices)
    skelett.location.z = -unten
    sub = koerper.modifiers.new("Glatt", "SUBSURF")
    sub.levels = 1
    sub.render_levels = 2
    return koerper, skelett
