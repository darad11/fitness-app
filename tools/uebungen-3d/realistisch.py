"""Realistische Figur (Variante C, D-414): Haut, Augen, Augenbrauen und Haare.

- **Augen:** „HighPolyEyes“ aus MakeHuman (`makehumancommunity/makehuman`, `makehuman/data/eyes/`,
  CC0 1.0 laut Dateikopf und `LICENSE.md` Abschnitt C). Angepasst wie in MakeHuman (`proxy.py`):
  Jeder Eckpunkt ist ein gewichtetes Mittel dreier Eckpunkte des Körpers plus Versatz, der mit dem
  Körper skaliert. `render.py --hole` lädt die drei Dateien nach `quelle/augen/` (nicht im Repository).
- **Haut:** eigener Shader (Hautton, Unterflächenstreuung, leichte Unregelmäßigkeit), keine Bilddatei.
- **Augenbrauen:** auf die Haut gemalt, als Feld wie die Muskelzonen (scharfer Rand), keine Datei.
- **Haare:** männlich kurzes Partikelhaar von Blender aus einer Kopfhaut (oben länger, seitlich kurz);
  weiblich eine anliegende Haarfläche nach hinten mit Dutt und feinen Härchen am Rand. Gerade
  Partikelhaare können der Kopfform nicht folgen, darum die Fläche. Keine Datei.

Die MakeHuman-Haut-, Haar- und Brauen-Assets (ebenfalls CC0) liegen auf `files2.makehumancommunity.org`;
die Adresse ist in dieser Umgebung gesperrt. Mit ihr würden Haut und Haare aus der Nähe detailreicher.
"""
from __future__ import annotations

import math
import urllib.request
from pathlib import Path

import bpy
import bmesh  # erst nach bpy verfügbar (Blender als Modul)
from mathutils import Vector

import szene

QUELLE = Path(__file__).resolve().parent / "quelle" / "augen"
AUGEN_URL = "https://raw.githubusercontent.com/makehumancommunity/makehuman/master/makehuman/data/eyes"
AUGEN_DATEIEN = {
    "high-poly.obj": "high-poly/high-poly.obj",
    "high-poly.mhclo": "high-poly/high-poly.mhclo",
    "brown_eye.png": "materials/brown_eye.png",
}
HAUT = {"maennlich": "#C49A80", "weiblich": "#D2A68C", "neutral": "#C9A085"}
HAAR = {"maennlich": (0.82, 0.35), "weiblich": (0.72, 0.45), "neutral": (0.8, 0.4)}  # Melanin, Rötung
BRAUE = "#2A1D17"


def hole() -> None:
    QUELLE.mkdir(parents=True, exist_ok=True)
    for name, pfad in AUGEN_DATEIEN.items():
        ziel = QUELLE / name
        if not ziel.exists():
            urllib.request.urlretrieve(f"{AUGEN_URL}/{pfad}", ziel)


# ---------------------------------------------------------------------- Augen (MakeHuman-Proxy)


def _lies_mhclo(pfad: Path):
    skal: dict[str, tuple[int, int, float]] = {}
    refs = []
    in_verts = False
    for zeile in pfad.read_text(encoding="utf-8").splitlines():
        teile = zeile.split()
        if not teile or zeile.startswith("#"):
            continue
        if in_verts:
            if len(teile) == 9:
                refs.append(([int(t) for t in teile[:3]], [float(t) for t in teile[3:6]], [float(t) for t in teile[6:9]]))
                continue
            if len(teile) == 1 and teile[0].isdigit():
                refs.append(([int(teile[0])] * 3, [1.0, 0.0, 0.0], [0.0, 0.0, 0.0]))
                continue
            in_verts = False
        if teile[0] in ("x_scale", "y_scale", "z_scale"):
            skal[teile[0][0]] = (int(teile[1]), int(teile[2]), float(teile[3]))
        elif teile[0] == "verts":
            in_verts = True
    return skal, refs


def _lies_obj(pfad: Path):
    v, vt, flaechen, uv = [], [], [], []
    for zeile in pfad.read_text(encoding="utf-8").splitlines():
        teile = zeile.split()
        if not teile:
            continue
        if teile[0] == "v":
            v.append(tuple(float(t) for t in teile[1:4]))
        elif teile[0] == "vt":
            vt.append((float(teile[1]), float(teile[2])))
        elif teile[0] == "f":
            ecken = [t.split("/") for t in teile[1:]]
            flaechen.append([int(e[0]) - 1 for e in ecken])
            uv.append([int(e[1]) - 1 if len(e) > 1 and e[1] else 0 for e in ecken])
    return v, vt, flaechen, uv


def _mh(p: Vector) -> tuple[float, float, float]:
    """Blender (m, z oben) → MakeHuman (dm, y oben)."""
    return (p.x / 0.1, p.z / 0.1, -p.y / 0.1)


def augen(skelett: bpy.types.Object, punkte: list[Vector]) -> bpy.types.Object:
    """Augen an den Körper angepasst (Raum des Skeletts), am Kopf mitbewegt."""
    skal, refs = _lies_mhclo(QUELLE / "high-poly.mhclo")
    _, vt, flaechen, uv = _lies_obj(QUELLE / "high-poly.obj")
    mh = {}

    def h(i):
        if i not in mh:
            mh[i] = _mh(punkte[i])
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
    mesh = bpy.data.meshes.new("Augen")
    mesh.from_pydata([tuple(p) for p in lage], [], flaechen)
    schicht = mesh.uv_layers.new(name="UV")
    for poly, ecken in zip(mesh.polygons, uv):
        for j, loop in enumerate(poly.loop_indices):
            schicht.data[loop].uv = vt[ecken[j]]
        poly.use_smooth = True
    obj = bpy.data.objects.new("Augen", mesh)
    bpy.context.scene.collection.objects.link(obj)
    obj.parent = skelett
    gruppe = obj.vertex_groups.new(name="head")
    gruppe.add(list(range(len(lage))), 1.0, "REPLACE")
    mod = obj.modifiers.new("Skelett", "ARMATURE")
    mod.object = skelett
    mat = bpy.data.materials.new("Augen")
    mat.use_nodes = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    bsdf = nodes["Principled BSDF"]
    bild = nodes.new("ShaderNodeTexImage")
    bild.image = bpy.data.images.load(str(QUELLE / "brown_eye.png"))
    links.new(bild.outputs["Color"], bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = 0.25
    bsdf.inputs["Coat Weight"].default_value = 0.6
    bsdf.inputs["Coat Roughness"].default_value = 0.05
    obj.data.materials.append(mat)
    return obj


def augenmitte(obj: bpy.types.Object, seite: str) -> Vector:
    pkte = [v.co for v in obj.data.vertices if (v.co.x > 0) == (seite == "L")]
    return sum(pkte, Vector()) / len(pkte)


# ---------------------------------------------------------------------- Augenbrauen und Haut


def _strecke(px: float, py: float, a: tuple[float, float], b: tuple[float, float]) -> tuple[float, float]:
    ex, ey = b[0] - a[0], b[1] - a[1]
    t = max(0.0, min(1.0, ((px - a[0]) * ex + (py - a[1]) * ey) / (ex * ex + ey * ey)))
    return math.hypot(px - a[0] - ex * t, py - a[1] - ey * t), t


def setze_brauen(koerper: bpy.types.Object, augen_obj: bpy.types.Object) -> None:
    """Attribut „Braue“: Abstand zum Rand der Augenbraue (m, positiv innen). Bogen über dem Auge,
    innen breiter, außen schmal."""
    gruppen = {g.name: g.index for g in koerper.vertex_groups}
    kopf_gruppen = {i for n, i in gruppen.items() if n in ("head",) or n.startswith(("orbicularis", "levator", "temporalis",
                                                                                       "special", "oculi", "eye"))}
    attr = koerper.data.attributes.get("Braue") or koerper.data.attributes.new("Braue", "FLOAT", "POINT")
    mitten = {s: augenmitte(augen_obj, s) for s in "LR"}
    # Linie relativ zur Augenmitte (x nach außen, z nach oben), halbe Dicke innen → außen
    linie = [(-0.013, 0.0155), (0.000, 0.0192), (0.012, 0.0202), (0.024, 0.0152)]
    dicke = [0.0038, 0.0034, 0.0026, 0.0014]
    for v in koerper.data.vertices:
        wert = -1.0
        if any(g.group in kopf_gruppen and g.weight > 0.3 for g in v.groups):
            s = "L" if v.co.x >= 0 else "R"
            E = mitten[s]
            if v.co.y < E.y + 0.004:
                px = (v.co.x - E.x) * (1 if s == "L" else -1)
                pz = v.co.z - E.z
                for (a, b), (da, db) in zip(zip(linie, linie[1:]), zip(dicke, dicke[1:])):
                    d, t = _strecke(px, pz, a, b)
                    wert = max(wert, da + (db - da) * t - d)
        attr.data[v.index].value = wert


def haut_material(ton: str, zonen_an: bool, mit_deckkraft: float = 0.42) -> bpy.types.Material:
    """Haut mit Unterflächenstreuung; Augenbrauen aus dem Attribut „Braue“; auf Wunsch Muskelzonen;
    unter der Kleidung blendet `kleidung.haut_ausblenden` die Haut aus (Attribut „Bedeckt“)."""
    mat = bpy.data.materials.new("Haut")
    mat.use_nodes = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    bsdf = nodes["Principled BSDF"]
    bsdf.inputs["Roughness"].default_value = 0.52
    bsdf.inputs["Subsurface Weight"].default_value = 0.25
    bsdf.inputs["Subsurface Radius"].default_value = (1.0, 0.42, 0.25)
    bsdf.inputs["Subsurface Scale"].default_value = 0.006
    bsdf.inputs["Specular IOR Level"].default_value = 0.35

    def attribut(name: str):
        a = nodes.new("ShaderNodeAttribute")
        a.attribute_name = name
        a.attribute_type = "GEOMETRY"
        return a.outputs["Fac"]

    def schwelle(wert, lo: float, hi: float):
        r = nodes.new("ShaderNodeMapRange")
        r.interpolation_type = "SMOOTHSTEP"
        r.clamp = True
        r.inputs["From Min"].default_value = lo
        r.inputs["From Max"].default_value = hi
        links.new(wert, r.inputs["Value"])
        return r.outputs["Result"]

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

    # leichte Unregelmäßigkeit im Hautton (± 4 %)
    rauschen = nodes.new("ShaderNodeTexNoise")
    rauschen.inputs["Scale"].default_value = 60.0
    rauschen.inputs["Detail"].default_value = 3.0
    basis = szene.srgb(ton)
    dunkler = tuple(c * 0.92 for c in basis[:3]) + (1.0,)
    farbe = mischen(rauschen.outputs["Fac"], dunkler, basis)
    farbe = mischen(schwelle(attribut("Braue"), -0.0006, 0.0006), farbe, szene.srgb(BRAUE))
    if zonen_an:
        haupt = schwelle(attribut("Zone"), -0.0012, 0.0012)
        mit = schwelle(attribut("ZoneMit"), -0.0012, 0.0012)
        nicht = nodes.new("ShaderNodeMath")
        nicht.operation = "SUBTRACT"
        nicht.inputs[0].default_value = 1.0
        links.new(haupt, nicht.inputs[1])
        mf = nodes.new("ShaderNodeMath")
        mf.operation = "MULTIPLY"
        links.new(mit, mf.inputs[0])
        links.new(nicht.outputs[0], mf.inputs[1])
        md = nodes.new("ShaderNodeMath")
        md.operation = "MULTIPLY"
        md.inputs[1].default_value = mit_deckkraft
        links.new(mf.outputs[0], md.inputs[0])
        farbe = mischen(md.outputs[0], farbe, szene.srgb(szene.LIME))
        farbe = mischen(haupt, farbe, szene.srgb(szene.LIME))
    links.new(farbe, bsdf.inputs["Base Color"])
    return mat


# ---------------------------------------------------------------------- Haare


def _haaransatz(koerper: bpy.types.Object, E: Vector, stil: str) -> dict[int, float]:
    """Höhe über dem Haaransatz (m) je Eckpunkt des Kopfs (Gewicht am Kopfknochen ab 0,5). Ansatz:
    Stirn gut 5 cm über der Augenmitte, Schläfen gut 2 cm, Nacken 5 bis 5,5 cm darunter; die Ohren
    bleiben frei."""
    kopf = koerper.vertex_groups["head"].index
    punkte = [(0.020, 0.050), (0.070, 0.024), (0.120, -0.055)] if stil != "weiblich" else \
        [(0.020, 0.054), (0.070, 0.022), (0.120, -0.050)]
    erg = {}
    for v in koerper.data.vertices:
        if sum(g.weight for g in v.groups if g.group == kopf) < 0.5:
            continue
        p = v.co
        rel_y = p.y - E.y  # nach hinten positiv
        if rel_y <= punkte[0][0]:
            ansatz = punkte[0][1]
        elif rel_y >= punkte[-1][0]:
            ansatz = punkte[-1][1]
        else:
            for (y1, z1), (y2, z2) in zip(punkte, punkte[1:]):
                if y1 <= rel_y <= y2:
                    ansatz = z1 + (z2 - z1) * (rel_y - y1) / (y2 - y1)
        hoehe = p.z - E.z - ansatz
        # Ohren frei: weicher Bogen um das Ohr (seitlich, zwischen Schläfe und Hinterkopf)
        ohr = math.hypot((rel_y - 0.085) / 0.040, (p.z - E.z + 0.005) / 0.040)
        if abs(p.x) > 0.06 and ohr < 1.0:
            hoehe = min(hoehe, (ohr - 1.0) * 0.04)
        erg[v.index] = hoehe
    return erg


def _kopf_netz(name: str, koerper: bpy.types.Object, skelett: bpy.types.Object, hoehe: dict[int, float],
               auswahl: float, dicke) -> tuple[bpy.types.Object, list[int]]:
    """Netz aus den Kopfflächen mit `hoehe` > `auswahl`, je Eckpunkt um `dicke(h)` nach außen,
    nur am Kopfknochen. Gibt (Objekt, ursprüngliche Nummern) zurück."""
    behalten = {i for i, h in hoehe.items() if h > auswahl}
    bm = bmesh.new()
    bm.from_mesh(koerper.data)
    bm.verts.ensure_lookup_table()
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.index not in behalten], context="VERTS")
    for schicht in list(bm.verts.layers.deform.values()):
        bm.verts.layers.deform.remove(schicht)
    bm.normal_update()
    alt = sorted(behalten)
    for v, i in zip(bm.verts, alt):
        v.co = v.co + v.normal * dicke(hoehe[i])
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    for poly in mesh.polygons:
        poly.use_smooth = True
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    obj.parent = skelett
    g = obj.vertex_groups.new(name="head")
    g.add(list(range(len(alt))), 1.0, "REPLACE")
    mod = obj.modifiers.new("Skelett", "ARMATURE")
    mod.object = skelett
    return obj, alt


def _haar_material(stil: str) -> bpy.types.Material:
    """Partikelhaar (Principled Hair BSDF, Farbe über Melanin)."""
    mat = bpy.data.materials.new("Haar")
    mat.use_nodes = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    for n in list(nodes):
        if n.type != "OUTPUT_MATERIAL":
            nodes.remove(n)
    haar = nodes.new("ShaderNodeBsdfHairPrincipled")
    haar.parametrization = "MELANIN"
    melanin, roetung = HAAR[stil]
    haar.inputs["Melanin"].default_value = melanin
    haar.inputs["Melanin Redness"].default_value = roetung
    haar.inputs["Roughness"].default_value = 0.35
    haar.inputs["Radial Roughness"].default_value = 0.4
    links.new(haar.outputs[0], nodes["Material Output"].inputs["Surface"])
    return mat


def _haarflaeche_material(farbe: str, strich: tuple[float, float, float]) -> bpy.types.Material:
    """Anliegendes Haar als Fläche: dunkle Grundfarbe mit feinen Strähnen (Rauschen, in
    Haarrichtung gestreckt), seidiger Glanz; am Haaransatz weich auslaufend (Attribut „Ansatz“)."""
    mat = bpy.data.materials.new("Haarflaeche")
    mat.use_nodes = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    bsdf = nodes["Principled BSDF"]
    bsdf.inputs["Roughness"].default_value = 0.38
    bsdf.inputs["Specular IOR Level"].default_value = 0.45
    bsdf.inputs["Sheen Weight"].default_value = 0.3
    koord = nodes.new("ShaderNodeTexCoord")
    abb = nodes.new("ShaderNodeMapping")
    abb.inputs["Scale"].default_value = strich
    links.new(koord.outputs["Object"], abb.inputs["Vector"])
    rauschen = nodes.new("ShaderNodeTexNoise")
    rauschen.inputs["Scale"].default_value = 40.0
    rauschen.inputs["Detail"].default_value = 6.0
    links.new(abb.outputs["Vector"], rauschen.inputs["Vector"])
    mix = nodes.new("ShaderNodeMix")
    mix.data_type = "RGBA"
    links.new(rauschen.outputs["Fac"], mix.inputs[0])
    grund = szene.srgb(farbe)
    mix.inputs[6].default_value = tuple(c * 0.55 for c in grund[:3]) + (1.0,)
    mix.inputs[7].default_value = tuple(min(1.0, c * 1.5) for c in grund[:3]) + (1.0,)
    links.new(mix.outputs[2], bsdf.inputs["Base Color"])
    attr = nodes.new("ShaderNodeAttribute")
    attr.attribute_name = "Ansatz"
    attr.attribute_type = "GEOMETRY"
    rng = nodes.new("ShaderNodeMapRange")
    rng.clamp = True
    rng.interpolation_type = "SMOOTHSTEP"
    rng.inputs["From Min"].default_value = -0.001
    rng.inputs["From Max"].default_value = 0.004
    links.new(attr.outputs["Fac"], rng.inputs["Value"])
    links.new(rng.outputs["Result"], bsdf.inputs["Alpha"])
    return mat


def _partikel(obj: bpy.types.Object, name: str, anzahl: int, laenge: float, richtung: tuple[float, float, float],
              normal: float, kinder: int, mat_index: int, klumpen: float = 0.15, rau: float = 0.0015,
              dichte: str = "", laengen: str = "") -> None:
    mod = obj.modifiers.new(name, "PARTICLE_SYSTEM")
    ps = mod.particle_system
    ps.vertex_group_density = dichte
    ps.vertex_group_length = laengen
    st = ps.settings
    st.type = "HAIR"
    st.use_advanced_hair = True
    st.count = anzahl
    st.emit_from = "FACE"
    st.use_emit_random = True
    # Bei Haar mit Richtung („Advanced“) bestimmt die Startgeschwindigkeit Richtung und Länge
    # (Länge = 4 × Geschwindigkeit): Normale und Richtung so skalieren, dass die Länge stimmt.
    k = laenge / (4.0 * math.sqrt(normal * normal + sum(c * c for c in richtung)))
    st.normal_factor = normal * k
    st.object_align_factor = tuple(c * k for c in richtung)
    st.child_type = "INTERPOLATED"
    st.child_percent = 6
    st.rendered_child_count = kinder
    st.length_random = 0.25
    st.clump_factor = klumpen
    st.roughness_1 = rau
    st.roughness_endpoint = rau * 0.6
    st.root_radius = 1.0
    st.tip_radius = 0.25
    st.radius_scale = 0.00006
    st.use_close_tip = True
    st.material = mat_index + 1
    st.render_type = "PATH"
    st.display_step = 3
    st.render_step = 4
    obj.show_instancer_for_render = False
    obj.show_instancer_for_viewport = True


def haare(koerper: bpy.types.Object, skelett: bpy.types.Object, augen_obj: bpy.types.Object, stil: str) -> list:
    """Kurzhaarschnitt aus Partikelhaar (männlich) oder glatt anliegendes Haar mit Dutt (weiblich)."""
    E = (augenmitte(augen_obj, "L") + augenmitte(augen_obj, "R")) / 2
    hoehe = _haaransatz(koerper, E, stil)
    if stil == "weiblich":
        # Fläche 0,5 bis 7 mm über der Kopfhaut, am Ansatz dünn auslaufend
        flaeche, alt = _kopf_netz("Haare", koerper, skelett, hoehe, -0.015,
                                  lambda h: 0.0005 + 0.0065 * max(0.0, min(1.0, (h + 0.002) / 0.03)))
        ansatz = flaeche.data.attributes.new("Ansatz", "FLOAT", "POINT")
        for neu_i, alt_i in enumerate(alt):
            ansatz.data[neu_i].value = hoehe[alt_i]
        mat = _haarflaeche_material("#3A271D", (6.0, 0.6, 6.0))
        flaeche.data.materials.append(mat)
        sub = flaeche.modifiers.new("Glatt", "SUBSURF")
        sub.levels, sub.render_levels = 1, 2
        # feine Härchen über der Fläche, nach hinten gekämmt: bricht den glatten Rand der Fläche
        g_dichte = flaeche.vertex_groups.new(name="Dichte")
        for neu_i, alt_i in enumerate(alt):
            g_dichte.add([neu_i], max(0.0, min(1.0, (hoehe[alt_i] + 0.001) / 0.008)), "REPLACE")
        flaeche.data.materials.append(_haar_material(stil))
        _partikel(flaeche, "Haerchen", 5000, 0.014, (0.0, 1.0, -0.15), 0.35, 12, 1, klumpen=0.3, rau=0.0008,
                  dichte="Dichte")
        flaeche.show_instancer_for_render = True
        # Dutt am Hinterkopf, knapp über Augenhöhe
        hinten = max(koerper.data.vertices[i].co.y for i in alt if abs(koerper.data.vertices[i].co.z - E.z - 0.03) < 0.01
                     and abs(koerper.data.vertices[i].co.x) < 0.02)
        bpy.ops.mesh.primitive_uv_sphere_add(radius=1.0, segments=32, ring_count=16)
        dutt = bpy.context.active_object
        dutt.name = "Dutt"
        dutt.scale = (0.034, 0.026, 0.030)
        dutt.location = Vector((0.0, hinten + 0.014, E.z + 0.035))
        bpy.ops.object.transform_apply(location=True, scale=True)
        for poly in dutt.data.polygons:
            poly.use_smooth = True
        dutt.parent = skelett
        g = dutt.vertex_groups.new(name="head")
        g.add(list(range(len(dutt.data.vertices))), 1.0, "REPLACE")
        mod = dutt.modifiers.new("Skelett", "ARMATURE")
        mod.object = skelett
        dutt.data.materials.append(_haarflaeche_material("#3A271D", (0.8, 8.0, 8.0)))
        a = dutt.data.attributes.new("Ansatz", "FLOAT", "POINT")
        for i in range(len(dutt.data.vertices)):
            a.data[i].value = 1.0
        return [flaeche, dutt]
    # männlich: Partikelhaar, oben länger (3 cm), seitlich und hinten kurz (1,2 cm)
    haut, alt = _kopf_netz("Kopfhaut", koerper, skelett, hoehe, -0.012, lambda h: 0.0005)
    g_dichte = haut.vertex_groups.new(name="Dichte")
    g_laenge = haut.vertex_groups.new(name="Laenge")
    for neu_i, alt_i in enumerate(alt):
        h = hoehe[alt_i]
        g_dichte.add([neu_i], max(0.0, min(1.0, (h + 0.002) / 0.008)), "REPLACE")
        n = koerper.data.vertices[alt_i].normal
        g_laenge.add([neu_i], 0.4 + 0.6 * max(0.0, n.z), "REPLACE")
    mat = _haar_material(stil)
    haut.data.materials.append(mat)
    _partikel(haut, "Haare", 9000, 0.030, (0.0, 0.35, 0.25), 1.0, 30, 0, klumpen=0.1, rau=0.0012,
              dichte="Dichte", laengen="Laenge")
    return [haut]


def ausstatten(koerper: bpy.types.Object, skelett: bpy.types.Object, name: str, stil: str, zonen_an: bool) -> list:
    """Haut, Augen, Brauen und Haare an die Figur `name` (gebaut mit `figur.baue_figur`)."""
    import figur

    augen_obj = augen(skelett, figur.PUNKTE[name])
    setze_brauen(koerper, augen_obj)
    koerper.data.materials.clear()
    koerper.data.materials.append(haut_material(HAUT.get(stil, HAUT["neutral"]), zonen_an))
    return [augen_obj, *haare(koerper, skelett, augen_obj, stil)]
