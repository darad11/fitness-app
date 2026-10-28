"""Realistische Figur (Variante C, D-414; mit MakeHuman-Dateien D-418): Haut, Augen, Augenbrauen,
Wimpern und Haare.

Alle Teile stammen aus dem Paket `makehuman_system_assets_cc0.zip` von MakeHuman, CC0 1.0: Jede Datei
trägt im Kopf „This asset was explicitly released as CC0 in september 2020“, und die Seite des Pakets
führt jedes Teil mit „CC0“ (`docs/licenses-data.md` Abschnitt 8). `render.py --hole` lädt das Paket
(267 MB) von `files2.makehumancommunity.org` nach `quelle/makehuman/` und packt nur die genannten
Teile aus (nicht im Repository).

- **Haut:** `skins/young_caucasian_male` bzw. `_female`, Bild 2048 × 2048 auf der UV-Abwicklung von
  `base.obj` (`figur.lies_obj`), Unterflächenstreuung aus Blender.
- **Augen** `eyes/high-poly` mit `eyes/materials/brown_eye.png`: Das Bild trägt Lederhaut, Iris und
  Pupille; die Hornhaut davor liegt auf dem durchsichtigen Teil des Bilds, darum ist sie im Material
  durchsichtig mit Glanz, und die Iris dahinter bleibt sichtbar (D-421; bis D-420 deckte eine graue
  Schale die Iris). Dieselben Augen bekommt die graue Figur D in Körpergrau mit weich dunklerer Iris,
  damit die Augenhöhlen nicht leer bleiben.
- **Augenbrauen** `eyebrows/eyebrow001` und `eyebrow005`, **Wimpern** `eyelashes/eyelashes01` und
  `eyelashes02`, **Haare** `hair/short02` (männlich, dunkelbraun eingefärbt) und `hair/ponytail01`
  (weiblich, zum Zopf gebunden, dunkel eingefärbt; D-421): Netze aus Strähnen und Streifen mit Bild
  und Deckkraft.
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
# Haarbilder von MakeHuman sind hell; `haarton` färbt sie ein (Faktoren je Kanal, linear): männlich
# dunkelbraun, weiblich dunkel (Zopf `ponytail01`, D-421)
TEILE = {
    "maennlich": {"haut": "skins/young_caucasian_male/young_lightskinned_male_diffuse.png", "haare": "hair/short02",
                  "brauen": "eyebrows/eyebrow001", "wimpern": "eyelashes/eyelashes01", "haarton": (0.42, 0.30, 0.22)},
    "weiblich": {"haut": "skins/young_caucasian_female/young_lightskinned_female_diffuse.png", "haare": "hair/ponytail01",
                 "brauen": "eyebrows/eyebrow005", "wimpern": "eyelashes/eyelashes02", "haarton": (0.22, 0.20, 0.19)},
}
TEILE["neutral"] = TEILE["maennlich"]
# „C männlich – Personalisiert“ (D-438): Körper und Haut wie C männlich; Frisur `short04` (Deckhaar nach
# hinten, kurze Seiten) fast schwarz, dichte Brauen `eyebrow009`, Hautton etwas wärmer und dunkler,
# Bart als dunkle Zone der Haut mit Stoppelmuster (`gesicht.bart_gewichte`), kleiner Leberfleck neben der
# Nase. Die Gesichtsform kommt aus den Reglern in `gesicht.py`; keine Bilddaten einer Person im Repository.
# „C männlich – Personalisiert“ nach dem Referenzblatt (D-442): Frisur, Bart und Brauen als Haarkurven
# (`haare.py`, `haarkurven`), kein Haarnetz und keine Brauen von MakeHuman, keine Zonen der Haut für Bart
# und Brauen mehr; Wimpern von MakeHuman bleiben; Leberfleck auf der linken Wange (Referenzblatt)
TEILE["persoenlich"] = {
    "haut": TEILE["maennlich"]["haut"], "haare": None, "brauen": None, "wimpern": "eyelashes/eyelashes01",
    "haarton": None, "hautton": (0.88, 0.72, 0.58), "hautstruktur": True,
    "haarkurven": ("frisur", "bart", "brauen", "fleck"),
}


def _benoetigt() -> tuple[set[str], set[str]]:
    """Einzelne Dateien und ganze Ordner aus dem Paket, die die Figur braucht."""
    dateien = {AUGEN_BILD} | {t["haut"] for t in TEILE.values()}
    ordner = {AUGEN} | {t[k] for t in TEILE.values() for k in ("haare", "brauen", "wimpern") if t.get(k)}
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
        # Referenzzeilen nach `verts`: drei Eckpunkte mit Gewichten und Versatz, oder ein Eckpunkt.
        # Dazwischen können Schlüsselwörter stehen (`material` bei ponytail01), die übersprungen werden.
        if in_verts and teile[0].isdigit():
            if len(teile) == 9:
                refs.append(([int(t) for t in teile[:3]], [float(t) for t in teile[3:6]], [float(t) for t in teile[6:9]]))
            elif len(teile) == 1:
                refs.append(([int(teile[0])] * 3, [1.0, 0.0, 0.0], [0.0, 0.0, 0.0]))
            continue
        if teile[0] in ("x_scale", "y_scale", "z_scale"):
            skal[teile[0][0]] = (int(teile[1]), int(teile[2]), float(teile[3]))
        elif teile[0] == "verts":
            in_verts = True
    if not refs:
        raise ValueError(f"{pfad.name}: keine Referenzen auf den Körper")
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


def _augen_material(bild: Path, grau: tuple[float, float, float, float] | None = None) -> bpy.types.Material:
    """Auge von MakeHuman: Wo das Bild deckt (Lederhaut, Iris, Pupille), feucht glänzende Oberfläche mit
    dem Bild; wo es durchsichtig ist (Hornhaut vor der Iris), eine durchsichtige Schale mit Glanz nach
    Fresnel, durch die die Iris sichtbar bleibt. Mit `grau` (Figur D) statt der Bildfarben das
    Körpergrau, die Helligkeit des Bilds macht Iris und Pupille als weichen dunkleren Kreis sichtbar."""
    mat = bpy.data.materials.new("Augen")
    mat.use_nodes = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    bsdf = nodes["Principled BSDF"]
    tex = nodes.new("ShaderNodeTexImage")
    tex.image = bpy.data.images.load(str(bild), check_existing=True)
    if grau is None:
        links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
        bsdf.inputs["Roughness"].default_value = 0.35
        bsdf.inputs["Specular IOR Level"].default_value = 0.4
        bsdf.inputs["Coat Weight"].default_value = 0.3
        bsdf.inputs["Coat Roughness"].default_value = 0.1
        glanz_rauheit = 0.05
    else:
        bw = nodes.new("ShaderNodeRGBToBW")
        links.new(tex.outputs["Color"], bw.inputs["Color"])
        rng = nodes.new("ShaderNodeMapRange")  # Lederhaut (linear rund 0,40) → 1, Pupille (0) → 0,55
        rng.clamp = True
        rng.inputs["From Min"].default_value = 0.0
        rng.inputs["From Max"].default_value = 0.40
        rng.inputs["To Min"].default_value = 0.55
        rng.inputs["To Max"].default_value = 1.0
        links.new(bw.outputs["Val"], rng.inputs["Value"])
        mix = nodes.new("ShaderNodeMix")
        mix.data_type = "RGBA"
        links.new(rng.outputs["Result"], mix.inputs[0])
        mix.inputs[6].default_value = (0.0, 0.0, 0.0, 1.0)
        mix.inputs[7].default_value = grau
        links.new(mix.outputs[2], bsdf.inputs["Base Color"])
        bsdf.inputs["Roughness"].default_value = 0.72
        glanz_rauheit = 0.2
    durch = nodes.new("ShaderNodeBsdfTransparent")
    glanz = nodes.new("ShaderNodeBsdfGlossy")
    glanz.inputs["Roughness"].default_value = glanz_rauheit
    fresnel = nodes.new("ShaderNodeLayerWeight")
    fresnel.inputs["Blend"].default_value = 0.35
    hornhaut = nodes.new("ShaderNodeMixShader")
    links.new(fresnel.outputs["Fresnel"], hornhaut.inputs["Fac"])
    links.new(durch.outputs[0], hornhaut.inputs[1])
    links.new(glanz.outputs[0], hornhaut.inputs[2])
    weg = nodes.new("ShaderNodeMath")  # 1 − Deckkraft: 0 Bild, 1 Hornhaut
    weg.operation = "SUBTRACT"
    weg.inputs[0].default_value = 1.0
    links.new(tex.outputs["Alpha"], weg.inputs[1])
    auswahl = nodes.new("ShaderNodeMixShader")
    links.new(weg.outputs[0], auswahl.inputs["Fac"])
    links.new(bsdf.outputs[0], auswahl.inputs[1])
    links.new(hornhaut.outputs[0], auswahl.inputs[2])
    links.new(auswahl.outputs[0], nodes["Material Output"].inputs["Surface"])
    return mat


def _proxy(name: str, ordner: str, skelett: bpy.types.Object, punkte: list[Vector],
           material: bpy.types.Material) -> bpy.types.Object:
    """Teil von MakeHuman an den Körper angepasst (Raum des Skeletts), am Kopf mitbewegt."""
    stamm = Path(ordner).name
    skal, refs = _lies_mhclo(QUELLE / ordner / f"{stamm}.mhclo")
    v, vt, flaechen, uv = _lies_obj(QUELLE / ordner / f"{stamm}.obj")
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
    if len(lage) != len(v):
        raise ValueError(f"{stamm}: {len(lage)} Referenzen für {len(v)} Eckpunkte")
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
    obj.data.materials.append(material)
    return obj


# ---------------------------------------------------------------------- Haut


def haut_material(stil: str, zonen_an: bool, mit_deckkraft: float = 0.42, zonen_staerke: float = 1.0) -> bpy.types.Material:
    """Haut aus dem Bild von MakeHuman mit Unterflächenstreuung; auf Wunsch Muskelzonen in Lime
    (`zonen_staerke` dämpft sie, D-419); unter der Kleidung blendet `kleidung.haut_ausblenden` die
    Haut aus (Attribut „Bedeckt“)."""
    mat = bpy.data.materials.new("Haut")
    mat.use_nodes = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    bsdf = nodes["Principled BSDF"]
    bsdf.inputs["Roughness"].default_value = 0.5
    bsdf.inputs["Subsurface Weight"].default_value = 0.2
    bsdf.inputs["Subsurface Radius"].default_value = (1.0, 0.42, 0.25)
    bsdf.inputs["Subsurface Scale"].default_value = 0.006
    bsdf.inputs["Specular IOR Level"].default_value = 0.35
    t = TEILE.get(stil, TEILE["neutral"])
    tex = nodes.new("ShaderNodeTexImage")
    tex.image = bpy.data.images.load(str(QUELLE / t["haut"]), check_existing=True)
    farbe = tex.outputs["Color"]
    if t.get("hautton"):
        ton = nodes.new("ShaderNodeMix")
        ton.data_type = "RGBA"
        ton.blend_type = "MULTIPLY"
        ton.inputs[0].default_value = 1.0
        links.new(farbe, ton.inputs[6])
        ton.inputs[7].default_value = (*t["hautton"], 1.0)
        farbe = ton.outputs[2]

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

    if zonen_an and zonen_staerke > 0:
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
        md.inputs[1].default_value = mit_deckkraft * zonen_staerke
        links.new(mf.outputs[0], md.inputs[0])
        hd = nodes.new("ShaderNodeMath")
        hd.operation = "MULTIPLY"
        hd.inputs[1].default_value = zonen_staerke
        links.new(haupt, hd.inputs[0])
        farbe = mischen(md.outputs[0], farbe, szene.srgb(szene.LIME))
        farbe = mischen(hd.outputs[0], farbe, szene.srgb(szene.LIME))
    if t.get("bart"):
        # Bart (D-438): Attribut „Bart“ (0 bis 1) mal Stoppelmuster, dunkelt die Haut zur Bartfarbe ab
        a = nodes.new("ShaderNodeAttribute")
        a.attribute_name = "Bart"
        a.attribute_type = "GEOMETRY"
        rausch = nodes.new("ShaderNodeTexNoise")
        rausch.inputs["Scale"].default_value = 420.0
        rausch.inputs["Detail"].default_value = 3.0
        rausch.inputs["Roughness"].default_value = 0.7
        r = nodes.new("ShaderNodeMapRange")
        r.inputs["From Min"].default_value = 0.3
        r.inputs["From Max"].default_value = 0.7
        r.inputs["To Min"].default_value = 0.85
        r.inputs["To Max"].default_value = 1.0
        r.clamp = True
        links.new(rausch.outputs["Fac"], r.inputs["Value"])
        mb = nodes.new("ShaderNodeMath")
        mb.operation = "MULTIPLY"
        links.new(a.outputs["Fac"], mb.inputs[0])
        links.new(r.outputs["Result"], mb.inputs[1])
        farbe = mischen(mb.outputs[0], farbe, (*t["bart"], 1.0))
    if t.get("brauenton"):
        a = nodes.new("ShaderNodeAttribute")
        a.attribute_name = "Brauen"
        a.attribute_type = "GEOMETRY"
        mb = nodes.new("ShaderNodeMath")
        mb.operation = "MULTIPLY"
        mb.inputs[1].default_value = 0.85
        links.new(a.outputs["Fac"], mb.inputs[0])
        farbe = mischen(mb.outputs[0], farbe, (*t["brauenton"], 1.0))
    if t.get("hautstruktur"):
        # Natürliche Hautstruktur statt Wachs (D-442): feines Rauschen als Unebenheit, Glanz etwas rauer,
        # Unterflächenstreuung geringer
        rausch = nodes.new("ShaderNodeTexNoise")
        rausch.inputs["Scale"].default_value = 900.0
        rausch.inputs["Detail"].default_value = 4.0
        rausch.inputs["Roughness"].default_value = 0.6
        bump = nodes.new("ShaderNodeBump")
        bump.inputs["Strength"].default_value = 0.12
        bump.inputs["Distance"].default_value = 0.0006
        links.new(rausch.outputs["Fac"], bump.inputs["Height"])
        links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
        bsdf.inputs["Roughness"].default_value = 0.58
        bsdf.inputs["Subsurface Weight"].default_value = 0.12
        bsdf.inputs["Specular IOR Level"].default_value = 0.3
    links.new(farbe, bsdf.inputs["Base Color"])
    return mat


def _gesichtsattribute(koerper: bpy.types.Object, name: str, t: dict) -> None:
    """Bart und Brauen als Attribute je Eckpunkt aus den Marken des Grundmodells (`gesicht.py`; bis D-439 auch
    der Leberfleck, der auf dem groben Netz keinen Eckpunkt traf, seit D-442 eine Kugel in `haare.py`)."""
    import json

    import numpy as np

    import figur
    import gesicht

    pfad = Path(__file__).resolve().parent / "gesicht-marken.json"
    if not pfad.exists():
        print("Hinweis: gesicht-marken.json fehlt, Bart und Brauen als Zonen entfallen (gesicht_anpassen.py marken)")
        return
    zuordnung = json.loads(pfad.read_text(encoding="utf-8"))["zuordnung"]
    V = np.array([tuple(p) for p in figur.PUNKTE[name]])
    n = len(koerper.data.vertices)
    for attr, werte in (("Bart", gesicht.bart_gewichte(V, zuordnung) if t.get("bart") else None),
                        ("Brauen", gesicht.brauen_gewichte(V, zuordnung) if t.get("brauenton") else None)):
        if werte is None:
            continue
        a = koerper.data.attributes.get(attr) or koerper.data.attributes.new(attr, "FLOAT", "POINT")
        a.data.foreach_set("value", [float(x) for x in werte[:n]])


def ausstatten(koerper: bpy.types.Object, skelett: bpy.types.Object, name: str, stil: str, zonen_an: bool,
               zonen_staerke: float = 1.0) -> list:
    """Haut, Augen, Brauen, Wimpern und Haare an die Figur `name` (gebaut mit `figur.baue_figur`)."""
    import figur

    punkte = figur.PUNKTE[name]
    t = TEILE.get(stil, TEILE["neutral"])
    teile = [_proxy("Augen", AUGEN, skelett, punkte, _augen_material(QUELLE / AUGEN_BILD))]
    for teil, ordner, ton in (("Augenbrauen", t["brauen"], None), ("Wimpern", t["wimpern"], None),
                              ("Haare", t["haare"], t["haarton"])):
        if not ordner:
            continue
        bild = _bild_aus_mhmat(QUELLE / ordner, Path(ordner).name)
        teile.append(_proxy(teil, ordner, skelett, punkte, _bild_material(teil, bild, 0.6, True, glanz=0.2, ton=ton)))
    koerper.data.materials.clear()
    koerper.data.materials.append(haut_material(stil, zonen_an, zonen_staerke=zonen_staerke))
    if t.get("bart") or t.get("brauenton"):
        _gesichtsattribute(koerper, name, t)
    if t.get("haarkurven"):
        teile += _haarkurven(koerper, skelett, name, t["haarkurven"])
    return teile


def _haarkurven(koerper: bpy.types.Object, skelett: bpy.types.Object, name: str, welche) -> list:
    """Frisur, Bart und Brauen als Haarkurven (D-442, `haare.py`) aus dem Grundmodell und den Marken."""
    import json

    import numpy as np

    import figur
    import haare

    pfad = Path(__file__).resolve().parent / "gesicht-marken.json"
    if not pfad.exists():
        print("Hinweis: gesicht-marken.json fehlt, keine Haarkurven (gesicht_anpassen.py marken)")
        return []
    zuordnung = json.loads(pfad.read_text(encoding="utf-8"))["zuordnung"]
    V = np.array([tuple(p) for p in figur.PUNKTE[name]])
    return haare.erzeugen(koerper, skelett, V, zuordnung, welche)


def augen_neutral(koerper: bpy.types.Object, skelett: bpy.types.Object, name: str, grau: str = szene.KOERPER) -> list:
    """Augen von MakeHuman für die graue Figur D, in Körpergrau mit weich dunklerer Iris (D-421):
    ohne sie bleiben die Augenhöhlen des Grundmodells leer."""
    import figur

    hole()
    return [_proxy("Augen", AUGEN, skelett, figur.PUNKTE[name], _augen_material(QUELLE / AUGEN_BILD, szene.srgb(grau)))]
