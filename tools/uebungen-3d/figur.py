"""Figur für die Übungsbilder (Phase Übungen, Pilot 3D, D-401).

Baut in Blender (als Python-Modul `bpy`) das Grundmodell von MakeHuman mit Skelett und Gewichten
auf. Grundlage sind drei Dateien aus dem MakeHuman-Repository, alle CC0 1.0 (Lizenz der Assets,
`makehuman/LICENSE.md` Abschnitt C; Renderings ausdrücklich ohne Anspruch, Abschnitt D):

    makehuman/data/3dobjs/base.obj           Grundmodell (neutral, ohne Geschlechtsmerkmale)
    makehuman/data/rigs/default.mhskel       Skelett: Gelenke als Mittelpunkte von Eckpunkten
    makehuman/data/rigs/default_weights.mhw  Gewichte je Knochen

Die Dateien liegen nicht im Repository (rund 2,8 MB); `render.py --hole` lädt sie nach
`tools/uebungen-3d/quelle/` (in `.gitignore`).

Die Körperform (Geschlecht, Muskeln, Gewicht, Proportionen) kommt aus den Formzielen von MakeHuman
(`koerperform.py`, D-413); sie verschieben die Eckpunkte vor dem Aufbau, das Skelett folgt.
"""
from __future__ import annotations

import json
from pathlib import Path

import bpy
from mathutils import Vector

import koerperform

QUELLE = Path(__file__).resolve().parent / "quelle"
# MakeHuman rechnet in Dezimetern mit y nach oben; Blender in Metern mit z nach oben.
SKALA = 0.1
PUNKTE: dict[str, list[Vector]] = {}


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


# Rumpfknochen, an denen Haut der Brust und der Achsel mit hängt (D-413)
RUMPF_SCHULTER = ("spine01", "spine02", "spine03", "breast.{s}", "clavicle.{s}")


def schulter_gewichte(koerper: bpy.types.Object) -> None:
    """Haut, die am Oberarm und am Rumpf zugleich hängt (vordere und hintere Achselfalte, äußere
    Brust), bekommt ihren Oberarmanteil am Hilfsknochen `achsel`, der je nach Armhebung nur einen
    Teil der Oberarmdrehung mitnimmt (`Rig.arm`). Je stärker der Eckpunkt am Rumpf hängt, desto mehr
    wandert (voll ab 0,3 Rumpfgewicht). Ohne das knickt die Haut vorn an der Schulter ein, sobald der
    Arm nach vorn gehoben ist (Bankdrücken oben)."""
    gruppen = {g.name: g for g in koerper.vertex_groups}
    for s in "LR":
        oberarm = gruppen["upperarm01." + s]
        hilfe = gruppen.get("achsel." + s) or koerper.vertex_groups.new(name="achsel." + s)
        rumpf = {gruppen[n.format(s=s)].index for n in RUMPF_SCHULTER}
        for v in koerper.data.vertices:
            gw = {g.group: g.weight for g in v.groups}
            w_arm = gw.get(oberarm.index, 0.0)
            w_rumpf = sum(gw.get(i, 0.0) for i in rumpf)
            if w_arm > 0 and w_rumpf > 0.02:
                anteil = min(1.0, w_rumpf / 0.3)
                oberarm.add([v.index], w_arm * (1 - anteil), "REPLACE")
                hilfe.add([v.index], gw.get(hilfe.index, 0.0) + w_arm * anteil, "REPLACE")


def baue_figur(name: str = "Figur", form: koerperform.Form | None = None) -> tuple[bpy.types.Object, bpy.types.Object]:
    """Gibt (Körper, Skelett) zurück. Der Körper hängt mit Gewichten am Skelett."""
    punkte, flaechen = lies_obj(QUELLE / "base.obj")
    if form is not None:
        koerperform.wende_an(punkte, form)
    # Alle Eckpunkte in der Nummerierung von base.obj (mit Hilfsgeometrie): Bezug für Anbauteile
    # wie die Augen (`realistisch.augen`), deren Lage MakeHuman über diese Nummern festlegt.
    PUNKTE[name] = [p.copy() for p in punkte]
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
    # Hilfsknochen „achsel“ je Seite (D-413): sitzt im Schultergelenk, hängt am Schlüsselbein, nicht
    # verbunden; trägt die Haut, die zugleich am Oberarm und am Rumpf hängt (`schulter_gewichte`).
    for seite in "LR":
        eb = arm_daten.edit_bones.new(f"achsel.{seite}")
        eb.head = knochen[f"upperarm01.{seite}"].head
        eb.tail = eb.head + Vector((0, 0, 0.03))
        eb.parent = knochen[f"clavicle.{seite}"]
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
