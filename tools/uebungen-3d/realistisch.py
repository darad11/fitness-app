"""Realistische Figur (Variante C, D-414; mit MakeHuman-Dateien D-418): Haut, Augen, Augenbrauen,
Wimpern und Haare.

Alle Teile stammen aus dem Paket `makehuman_system_assets_cc0.zip` von MakeHuman, CC0 1.0: Jede Datei
trägt im Kopf „This asset was explicitly released as CC0 in september 2020“, und die Seite des Pakets
führt jedes Teil mit „CC0“ (`docs/licenses-data.md` Abschnitt 8). `render.py --hole` lädt das Paket
(267 MB) von `files2.makehumancommunity.org` nach `quelle/makehuman/` und packt nur die genannten
Teile aus (nicht im Repository).

- **Haut:** `skins/young_caucasian_male` bzw. `_female`, Bild 2048 × 2048 auf der UV-Abwicklung von
  `base.obj` (`figur.lies_obj`), Unterflächenstreuung aus Blender.
- **Augen** `eyes/high-poly` mit `eyes/materials/brown_eye.png`, **Augenbrauen** `eyebrows/eyebrow001`
  und `eyebrow005`, **Wimpern** `eyelashes/eyelashes01` und `eyelashes02`, **Haare** `hair/short02`
  (männlich) und `hair/bob02` (weiblich): Netze aus Strähnen und Streifen mit Bild und Deckkraft.
- Anpassung wie in MakeHuman (`proxy.py`): Jeder Eckpunkt ist ein gewichtetes Mittel dreier Eckpunkte
  des Körpers plus Versatz, der mit dem Körper skaliert; so passen die Teile zu jeder Körperform. Sie
  hängen am Kopfknochen und bewegen sich mit dem Kopf.
"""
from __future__ import annotations

import urllib.request
import zipfile
from pathlib import Path

import bpy
from mathutils import Vector

import szene

QUELLE = Path(__file__).resolve().parent / "quelle" / "makehuman"
PAKET = "makehuman_system_assets_cc0.zip"
PAKET_URL = f"https://files2.makehumancommunity.org/asset_packs/makehuman_system_assets/{PAKET}"
AUGEN = "eyes/high-poly"
AUGEN_BILD = "eyes/materials/brown_eye.png"
TEILE = {
    "maennlich": {"haut": "skins/young_caucasian_male/young_lightskinned_male_diffuse.png", "haare": "hair/short02",
                  "brauen": "eyebrows/eyebrow001", "wimpern": "eyelashes/eyelashes01"},
    "weiblich": {"haut": "skins/young_caucasian_female/young_lightskinned_female_diffuse.png", "haare": "hair/bob02",
                 "brauen": "eyebrows/eyebrow005", "wimpern": "eyelashes/eyelashes02"},
}
TEILE["neutral"] = TEILE["maennlich"]
HAARTON = (0.42, 0.30, 0.22)  # Haarbilder von MakeHuman (blond) dunkelbraun eingefärbt, linear je Kanal


def _benoetigt() -> tuple[set[str], set[str]]:
    """Einzelne Dateien und ganze Ordner aus dem Paket, die die Figur braucht."""
    dateien = {AUGEN_BILD} | {t["haut"] for t in TEILE.values()}
    ordner = {AUGEN} | {t[k] for t in TEILE.values() for k in ("haare", "brauen", "wimpern")}
    return dateien, ordner


def hole() -> None:
    dateien, ordner = _benoetigt()
    if all((QUELLE / d).exists() for d in dateien) and all((QUELLE / o).is_dir() for o in ordner):
        return
    QUELLE.mkdir(parents=True, exist_ok=True)
    paket = QUELLE / PAKET
    if not paket.exists():
        urllib.request.urlretrieve(PAKET_URL, paket)
    with zipfile.ZipFile(paket) as z:
        for name in z.namelist():
            if name in dateien or any(name.startswith(o + "/") for o in ordner):
                z.extract(name, QUELLE)


# ---------------------------------------------------------------------- Dateien von MakeHuman


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


def _bild_aus_mhmat(ordner: Path, stamm: str) -> Path:
    """Die Bilddatei (`diffuseTexture`) aus der Materialdatei von MakeHuman."""
    for zeile in (ordner / f"{stamm}.mhmat").read_text(encoding="utf-8").splitlines():
        teile = zeile.split()
        if len(teile) == 2 and teile[0] == "diffuseTexture":
            return ordner / teile[1]
    raise FileNotFoundError(f"{stamm}.mhmat ohne diffuseTexture")


def _mh(p: Vector) -> tuple[float, float, float]:
    """Blender (m, z oben) → MakeHuman (dm, y oben)."""
    return (p.x / 0.1, p.z / 0.1, -p.y / 0.1)


def _bild_material(name: str, bild: Path, rauheit: float, deckkraft: bool, glanz: float = 0.5,
                   lack: float = 0.0, ton: tuple[float, float, float] | None = None) -> bpy.types.Material:
    """Material aus einer Bilddatei (Farbe, auf Wunsch die Deckkraft aus dem Bild); `ton` färbt das
    Bild ein (Faktoren je Kanal, linear), z. B. helles Haar dunkelbraun."""
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    bsdf = nodes["Principled BSDF"]
    tex = nodes.new("ShaderNodeTexImage")
    tex.image = bpy.data.images.load(str(bild), check_existing=True)
    farbe = tex.outputs["Color"]
    if ton:
        mix = nodes.new("ShaderNodeMix")
        mix.data_type = "RGBA"
        mix.blend_type = "MULTIPLY"
        mix.inputs[0].default_value = 1.0
        links.new(farbe, mix.inputs[6])
        mix.inputs[7].default_value = (*ton, 1.0)
        farbe = mix.outputs[2]
    links.new(farbe, bsdf.inputs["Base Color"])
    if deckkraft:
        links.new(tex.outputs["Alpha"], bsdf.inputs["Alpha"])
    bsdf.inputs["Roughness"].default_value = rauheit
    bsdf.inputs["Specular IOR Level"].default_value = glanz
    if lack:
        bsdf.inputs["Coat Weight"].default_value = lack
        bsdf.inputs["Coat Roughness"].default_value = 0.05
    return mat


def _proxy(name: str, ordner: str, skelett: bpy.types.Object, punkte: list[Vector], bild: Path, rauheit: float,
           deckkraft: bool, glanz: float = 0.5, lack: float = 0.0, ton=None) -> bpy.types.Object:
    """Teil von MakeHuman an den Körper angepasst (Raum des Skeletts), am Kopf mitbewegt."""
    stamm = Path(ordner).name
    skal, refs = _lies_mhclo(QUELLE / ordner / f"{stamm}.mhclo")
    _, vt, flaechen, uv = _lies_obj(QUELLE / ordner / f"{stamm}.obj")
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
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata([tuple(p) for p in lage], [], flaechen)
    schicht = mesh.uv_layers.new(name="UV")
    for poly, ecken in zip(mesh.polygons, uv):
        for j, loop in enumerate(poly.loop_indices):
            schicht.data[loop].uv = vt[ecken[j]]
        poly.use_smooth = True
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    obj.parent = skelett
    gruppe = obj.vertex_groups.new(name="head")
    gruppe.add(list(range(len(lage))), 1.0, "REPLACE")
    mod = obj.modifiers.new("Skelett", "ARMATURE")
    mod.object = skelett
    obj.data.materials.append(_bild_material(name, bild, rauheit, deckkraft, glanz, lack, ton))
    return obj


# ---------------------------------------------------------------------- Haut


def haut_material(stil: str, zonen_an: bool, mit_deckkraft: float = 0.42) -> bpy.types.Material:
    """Haut aus dem Bild von MakeHuman mit Unterflächenstreuung; auf Wunsch Muskelzonen in Lime; unter
    der Kleidung blendet `kleidung.haut_ausblenden` die Haut aus (Attribut „Bedeckt“)."""
    mat = bpy.data.materials.new("Haut")
    mat.use_nodes = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    bsdf = nodes["Principled BSDF"]
    bsdf.inputs["Roughness"].default_value = 0.5
    bsdf.inputs["Subsurface Weight"].default_value = 0.2
    bsdf.inputs["Subsurface Radius"].default_value = (1.0, 0.42, 0.25)
    bsdf.inputs["Subsurface Scale"].default_value = 0.006
    bsdf.inputs["Specular IOR Level"].default_value = 0.35
    tex = nodes.new("ShaderNodeTexImage")
    tex.image = bpy.data.images.load(str(QUELLE / TEILE.get(stil, TEILE["neutral"])["haut"]), check_existing=True)
    farbe = tex.outputs["Color"]

    def schwelle(name: str):
        a = nodes.new("ShaderNodeAttribute")
        a.attribute_name = name
        a.attribute_type = "GEOMETRY"
        r = nodes.new("ShaderNodeMapRange")
        r.interpolation_type = "SMOOTHSTEP"
        r.clamp = True
        r.inputs["From Min"].default_value = -0.0012
        r.inputs["From Max"].default_value = 0.0012
        links.new(a.outputs["Fac"], r.inputs["Value"])
        return r.outputs["Result"]

    def mischen(faktor, a, b):
        mix = nodes.new("ShaderNodeMix")
        mix.data_type = "RGBA"
        links.new(faktor, mix.inputs[0])
        links.new(a, mix.inputs[6])
        mix.inputs[7].default_value = b
        return mix.outputs[2]

    if zonen_an:
        haupt, mit = schwelle("Zone"), schwelle("ZoneMit")
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


def ausstatten(koerper: bpy.types.Object, skelett: bpy.types.Object, name: str, stil: str, zonen_an: bool) -> list:
    """Haut, Augen, Brauen, Wimpern und Haare an die Figur `name` (gebaut mit `figur.baue_figur`)."""
    import figur

    punkte = figur.PUNKTE[name]
    t = TEILE.get(stil, TEILE["neutral"])
    teile = [_proxy("Augen", AUGEN, skelett, punkte, QUELLE / AUGEN_BILD, 0.25, False, lack=0.6)]
    for teil, ordner, rauheit, ton in (("Augenbrauen", t["brauen"], 0.6, None), ("Wimpern", t["wimpern"], 0.6, None),
                                       ("Haare", t["haare"], 0.6, HAARTON)):
        if not ordner:
            continue
        bild = _bild_aus_mhmat(QUELLE / ordner, Path(ordner).name)
        teile.append(_proxy(teil, ordner, skelett, punkte, bild, rauheit, True, glanz=0.2, ton=ton))
    koerper.data.materials.clear()
    koerper.data.materials.append(haut_material(stil, zonen_an))
    return teile
