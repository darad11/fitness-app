"""FORM-Kleidung nach dem Design-Board (D-450; Grundlage D-414, D-417, D-419, D-422, D-431).

Das Board des Produktinhabers (`docs/prompts/uebungen-kleidung-neu-board.png`, Auftrag
`docs/prompts/uebungen-kleidung-neu-FORM.md`) wird 1:1 übernommen. Proportionen, Lagen und Größen sind
am Board gemessen, relativ zum Kleidungsstück (`BOARD`: Breite des Shirts, Bundbreite und Beinweite
der Shorts), und werden beim Anziehen auf die gemessene Figur übertragen (`_schnitt`):

- **T-Shirt** in Anthrazit (im Bild #2A2D30 wie auf dem Board, `TEE`), Rundhals mit Bündchen, kurze
  Ärmel, gerader, sportlicher Schnitt: An Taille und Saum steht der Stoff vom Körper ab, bis die Breiten
  denen des Boards entsprechen (`_weite`). Vorn das FORM-F in Lime auf der linken Brust des Trägers,
  hinten das große F in Lime über der Wortmarke FORM in Weiß, mittig im oberen Rücken. Keine
  Lime-Einfassung mehr (bis D-449 an den Seitenschlitzen, die es auf dem Board nicht gibt).
- **Shorts** fast schwarz (im Bild #202326, `SHORTS`), Länge und Weite wie auf dem Board (zum Saum hin
  weiter), breiter Bund mit dunkler Kordel; an beiden Beinen seitlich ein Streifen in Lime, der zum Saum
  breiter wird (`_streifen`), vorn und hinten sichtbar; vorn das F in Lime am linken Bein des Trägers
  nahe dem Saum. Das F vorn-außen (D-441) und die Kordelenden in Lime entfallen.
- **Socken und Schuhe**: `schuhe.py`.

Links und rechts gelten aus Sicht des Trägers (links = +x in Blender). Shirt und Shorts entstehen aus
dem Netz der Figur, ohne fremde Dateien: Die Flächen des bedeckten Bereichs werden kopiert, nach außen
versetzt (eng anliegend, an Taille, Saum und Beinen zusätzlich um die Weite des Schnitts), geglättet und
hängen mit denselben Gewichten am Skelett; so folgen sie jeder Haltung ohne Stoffsimulation. Säume,
Ärmel, Bund und Streifen sind keine Netzkanten, sondern Felder (Abstand zum Rand in Metern): Stoff und
Farben enden dort scharf.

**Rundhalskragen** (D-431): Die Halsöffnung ist der Schnitt des Körpers mit einer Fläche durch drei
Marken: vorn etwas unter der Drosselgrube (Höhe der inneren Schlüsselbeinenden), hinten knapp über dem
vorstehenden Halswirbel (Halsansatz `neck01`), seitlich am Halsansatz (Halsbreite, knapp unter dem
Halsknochen). Die Fläche ist die geneigte Ebene durch vorn und hinten, seitlich parabolisch zum
Halsansatz angehoben; nur so bleibt die Kante am Hals, denn bei diesem Körper liegen die Trapezmuskeln
seitlich fast auf Höhe des Halsansatzes und die reine Ebene schnitte über die Schultern. Stoff gibt es
nur unter der Fläche (`_halsoeffnung`, `_halsfeld`, Feld je Eckpunkt wie die Säume). Damit die Kante bei
gehobenem Trapez oder aufliegender Stange nicht mitgezogen wird, hängt der Stoff in der Nähe der
Öffnung am Halsansatz (`_kragen_binden`), wie der steife Kragen eines echten Shirts. Auf der Kante
liegt ein schmales Kragenbündchen als eigenes Netz (`_buendchen`).

**Logos**: das FORM-F aus `public/brand/symbol-f-gruen.svg` und die Wortmarke aus
`public/brand/logo-kopfzeile-dunkel.svg` in Originalproportionen, gerastert (`quelle/form-*.png`), als
Bild eben auf den Stoff projiziert (`_rahmen`): Mittelpunkt und Blickrichtung je Logo aus der
Körpergeometrie, die Bildebene senkrecht zur mittleren Oberflächennormalen; so wird nichts in die Breite
gezogen. Jedes Logo gilt nur für sein Körperteil und bis zu einer Tiefe vor und hinter der Bildebene
(D-422) und nur für Flächen, die zur Bildebene zeigen. Hinten stehen F und Wortmarke im
Größenverhältnis und Abstand des Boards: F 3,40 Versalhöhen der Wortmarke hoch, Abstand 0,78 (im
vertikalen Logo des Startbilds 2,28 und 0,82, D-325); beide Formen unverzerrt aus den Markendateien.
"""
from __future__ import annotations

import math
import re
from pathlib import Path

import bpy
import bmesh  # erst nach bpy verfügbar (Blender als Modul)
from mathutils import Vector, kdtree

import koordinaten
import szene

# Farben des Boards (Auftrag: Tee etwa #2A2D30, Shorts etwa #202326) an das Licht der Szene angepasst: Haupt-,
# Füll- und Kantenlicht hellen den Stoff auf, ein Teil davon als Glanz unabhängig von der Grundfarbe. Mit dem
# matten Stoff aus `stoff_material` ergeben diese Grundfarben im Bild die Werte des Boards (gemessen von vorn
# am Bauch und an den Shorts, D-450)
TEE = "#1B2023"  # Anthrazit, im Bild etwa #2A2D30
SHORTS = "#11171C"  # fast Schwarz, im Bild etwa #202326
BUND = "#0F141A"  # Bund der Shorts, etwas dunkler (Board: #1F2224 neben #222629)
KORDEL = "#060708"  # dunkle Kordel (im Bild dunkler als die Shorts, wie auf dem Board)
KORDEL_ENDE = "#363A3F"  # Kordelenden (Hülsen), etwas heller
LIME = szene.LIME
WEISS = "#F2F3F4"  # Wortmarke hinten: --fg der App, im Licht hellgrau wie auf dem Board
MARKE = Path(__file__).resolve().parent.parent.parent / "public" / "brand"
SVG_F = MARKE / "symbol-f-gruen.svg"
SVG_WORTMARKE = MARKE / "logo-kopfzeile-dunkel.svg"
QUELLE = Path(__file__).resolve().parent / "quelle"

# Am Board gemessen (453 × 696 px, `docs/prompts/uebungen-kleidung-neu-board.png`). W: Breite des Shirts
# knapp unter den Ärmeln in der jeweiligen Ansicht (vorn 128 px, hinten 120 px); B: Breite der Shorts am
# oberen Rand des Bunds (vorn 132 px); Bein: Weite eines Beins am Saum (vorn 89 px). In Klammern die Pixel.
BOARD = {
    "shirt_laenge": 1.83,  # höchster Punkt der Schulter am Kragen bis Saum, in W (234)
    "taille": 0.945,  # schmalste Breite des Shirts, in W (121), bei 0,39 der Strecke Achsel → Saum
    "taille_lage": 0.39,
    "saum": 1.07,  # Breite des Shirts am Saum, in W (137)
    "aermel": 0.58,  # Schulterpunkt bis Ärmelsaum außen, in W (74)
    # Brust-F: Höhe, Mitte links der Mitte und unter der Unterkante des Bündchens vorn, in W (16; 44,5; 24)
    "brust_f": {"hoehe": 0.125, "quer": 0.35, "unter_buendchen": 0.19},
    # Rücken-F: Höhe und Oberkante unter der Unterkante des Bündchens hinten, in W (48; 40)
    "ruecken_f": {"hoehe": 0.40, "oben": 0.33},
    # F und Abstand zur Wortmarke in Versalhöhen der Wortmarke (14 px; F 48, Abstand 11)
    "ruecken_versal": {"f": 3.40, "abstand": 0.78},
    "hose_laenge": 1.29,  # oberer Rand des Bunds bis Saum außen, in B (170)
    "hose_saum": 1.52,  # Breite über beide Beine am Saum, in B (200)
    "hose_bein": 0.445,  # Weite eines Beins am Saum, Anteil der Breite über beide Beine (89 von 200)
    "bund": 0.082,  # Höhe des Bunds, Anteil der Länge (14)
    # Streifen: halbe Breite in Grad um die Seitennaht, oben unter dem Bund (vorn, hinten) und am Saum; so
    # eingestellt, dass er an der Figur von vorn und hinten so breit wirkt wie auf dem Board (am Saum vorn
    # 13, hinten 14 px bei 89 px Beinweite, also rund 15 %)
    "streifen": {"oben_vorn": 13.0, "oben_hinten": 21.0, "saum": 40.0},
    # Shorts-F: Höhe und Unterkante über dem Saum in Bein, Mitte 24° von vorn nach außen (21; 10; 18)
    "hose_f": {"hoehe": 0.236, "ueber_saum": 0.112, "winkel": 24.0},
    # Kordel: zwei Schnüre aus der Mitte des Bunds, Abstand und Länge in B, Hülsen am Ende (6; 35; 7,5)
    "kordel": {"abstand": 0.045, "laenge": 0.21, "ende": 0.045},
}
HOSE_BUND = 0.22  # oberer Rand des Bunds knapp unter dem Nabel (Anteil Hüftgelenk → Halsansatz)
AKROMION = 0.14  # Schulterpunkt (Ansatz des Ärmels) rund 0,14 Oberarmlängen vor dem Schultergelenk
WEITE_VORN_HINTEN = 0.55  # Weite des Shirts vorn und hinten im Verhältnis zur Seite
SCHRITT_ABSTAND = 0.03  # Saum des Shirts höchstens bis so weit über dem Schritt, m (bis D-477)
# Saum des Shirts (D-478, Hinweis des Produktinhabers): 1 cm unter der Unterkante des Bunds der Shorts; das Shirt
# bedeckt die Shorts also um die Höhe des Bunds plus 1 cm (rund 4 cm). Bis D-477 reichte es nach der Länge des Boards
# bis 3 cm über den Schritt (21 cm über die Shorts), die Figur wirkte wie in einem Ganzkörperanzug
SAUM_UNTER_BUND = 0.01
# Fall des Shirts (D-478): Unter der Brust hängt der Stoff nach unten, statt Taille, Bauch und Hohlkreuz zu folgen:
# je Richtung um den Rumpf bis `FALL` des Wegs zur Hülle aller Querschnitte darüber (von der Achsel abwärts); dazu Luft,
# die zum Saum hin auf `LUFT_SAUM` wächst. Schultern und Brust liegen an wie bisher (Stange und Bank liegen auf dem Stoff)
FALL = 0.85
LUFT_SAUM = 0.010
# Weite Beine der Shorts (D-478): Je Bein fällt der Stoff von Hüfte und Gesäß gerade nach unten (Hülle der Querschnitte
# um den Oberschenkel, Anteil `HOSE_FALL`), dazu Luft, die zum Saum hin wächst; innen nur wenig (die Beine stehen nah)
HOSE_FALL = 0.9
HOSE_LUFT = {"aussen": 0.022, "vorn_hinten": 0.018, "innen": 0.006}
HOSE_INNEN_MAX = 0.012  # innen höchstens so viel Weite, m
# Saumband des Shirts (D-478): Höhe, Dicke und Abstand über dem Stoff; die Kante wirft einen leichten Schatten
SAUMBAND = {"hoehe": 0.016, "dicke": 0.003, "ueber": 0.0015, "unter": 0.002}
HOSE_WEITE = {"vorn_hinten": 0.45, "innen": 0.15, "steigung": 1.5}  # Weite der Shorts je Seite, zum Saum hin
# Rundhalskragen (D-431): vorn unter der Drosselgrube, hinten über dem Halswirbel, seitlich Halsbreite plus Rand
KRAGEN = {"unter_drosselgrube": 0.015, "ueber_halswirbel": 0.012,
          "seitlich_unter_hals": 0.015, "seitlich_rand": 0.006,  # seitliche Kante unter `neck01`, außerhalb der Halshaut, m
          "bindung": 0.06,  # bis zu diesem Abstand von der Öffnung hängt der Stoff gleitend am Halsansatz, m
          "buendchen": 0.014, "buendchen_dicke": 0.0032}  # Breite und Dicke des Kragenbündchens, m
KRAGEN_KNOCHEN = {"spine01": 0.6, "neck01": 0.4}  # woran der Kragen hängt
ABSTAND = {"shirt": 0.0065, "hose": 0.0048}  # Stoff über der Haut, m (dazu die Weite des Schnitts)
DICKE = 0.0012  # Stoffdicke, m
STOFF = ABSTAND["shirt"] + DICKE  # Oberfläche des Tees über der Haut: Die Stange liegt darauf (D-422)
F_ANTEIL = 0.861  # Höhe des F im quadratischen Bild „f“ (`_bilder`)
WORTMARKE_BREITE = 5.396  # Breite der Wortmarke FORM in Versalhöhen (`logo-kopfzeile-dunkel.svg`)
RUECKEN_SEITE = 6.2  # Seitenlänge des quadratischen Bilds „ruecken“ in Versalhöhen
# Rückenlogo (D-459): F über FORM in der Proportion des vertikalen Logos im Startbild (D-325, `tools/splash.mjs`):
# F 2,28 Versalhöhen der Wortmarke hoch, Abstand 0,82. Die Wortmarke bleibt so groß wie auf dem Board, das F
# wird damit rund ein Drittel kleiner (2,28 statt 3,40); die Mitte des Blocks bleibt, wo sie auf dem Board liegt.
# Bis D-458 galt das Verhältnis des Boards (`BOARD["ruecken_versal"]`)
RUECKEN_LOGO = {"f": 2.28, "abstand": 0.82}
# Shorts-F (D-461): Mitte so weit von vorn nach außen (Grad um den Oberschenkel), dass zwischen F und Seitenstreifen
# auf dem Stoff ein klarer Abstand bleibt (Board: rund die halbe Breite des F, mindestens 2 cm), in allen Bildern der
# Pilot-Übungen. Bis D-460 lag die Mitte beim Punkt des Netzes nahe 24° (`BOARD["hose_f"]["winkel"]`, gemessen am
# Board); dort berührte das F den Streifen. Höhe über dem Saum und Größe wie bisher
HOSE_F_WINKEL = 10.0
RUMPFKNOCHEN = ("root", "spine01", "spine02", "spine03", "spine04", "spine05", "neck01", "neck02", "neck03",
                "pelvis.L", "pelvis.R", "clavicle.L", "clavicle.R", "breast.L", "breast.R", "shoulder01.L",
                "shoulder01.R")


# ---------------------------------------------------------------------- Halsöffnung


def _halsoeffnung(koerper: bpy.types.Object, k: koordinaten.Koordinaten) -> dict:
    """Fläche der Halsöffnung (D-431): die Ebene durch den Punkt vorn auf der Haut unter der
    Drosselgrube (Höhe der inneren Schlüsselbeinenden minus `unter_drosselgrube`) und den Punkt
    hinten auf der Haut über dem Halsansatz (`neck01` plus `ueber_halswirbel`), quer waagrecht;
    seitlich parabolisch angehoben (`c`), so dass die Kante bei der halben Halsbreite `b` (plus
    `seitlich_rand`) `seitlich_unter_hals` unter dem Halsknochen liegt. Rückgabe: Mitte C,
    Längsrichtung e (vorn → hinten), Normale m (nach oben), halbe Länge a, Halbbreite b, Wölbung c,
    vordere und hintere Kante (`vorn`, `hinten`; letztere für das Rückenlogo)."""
    verts = koerper.data.vertices
    N = k.kopf["neck01"]
    z_vorn = k.kopf["clavicle.L"].z - KRAGEN["unter_drosselgrube"]
    z_hinten = N.z + KRAGEN["ueber_halswirbel"]

    def haut(z: float, vorn: bool) -> Vector:
        p = [v.co for v in verts if abs(v.co.x) < 0.015 and abs(v.co.z - z) < 0.008]
        y = min(q.y for q in p) if vorn else max(q.y for q in p)
        return Vector((0.0, y, z))

    F, B = haut(z_vorn, True), haut(z_hinten, False)
    hals = [abs(v.co.x) for v in verts if k.w(v.index, "neck01", "neck02", "neck03") > 0.5 and 0.0 < v.co.z - N.z < 0.01]
    b = max(hals) + KRAGEN["seitlich_rand"]
    C = (F + B) / 2
    e = (B - F).normalized()
    m = Vector((1.0, 0.0, 0.0)).cross(e).normalized()
    if m.z < 0:
        m = -m
    # seitliche Kante: Höhe über der Ebene (längs m) bei x = b, als Parabel c · x²
    z_seite = N.z - KRAGEN["seitlich_unter_hals"]
    w_seite = (Vector((b, C.y, z_seite)) - C).dot(m)
    c = max(0.0, w_seite / (b * b))
    return {"C": C, "e": e, "m": m, "a": (B - F).length / 2, "b": b, "c": c, "vorn": F, "hinten": B}


def _halsfeld(h: dict, p: Vector) -> float:
    """Abstand zur Fläche der Halsöffnung (m, positiv = Stoff, unter der Fläche): Höhe über der Ebene
    längs m, verglichen mit der seitlichen Wölbung c · x². Unterhalb der vorderen Kante gibt es immer
    Stoff: Die Ebene schnitte sonst entlang der Brustbeinrinne in die vorgewölbte Brust und machte
    aus dem runden Ausschnitt vorn eine Spitze."""
    d = p - h["C"]
    return max(h["c"] * d.x * d.x - d.dot(h["m"]), h["vorn"].z - p.z)


# ---------------------------------------------------------------------- Schnitt nach dem Board


def _teile(koerper: bpy.types.Object, k: koordinaten.Koordinaten) -> list[str]:
    """Körperteil je Eckpunkt mit dem größten Gewicht: Oberarm, Rumpf (mit Hals), Oberschenkel oder Rest
    (Unterarm, Hand, Kopf, Unterschenkel, Fuß; von Shirt und Shorts nie bedeckt)."""
    teile = []
    for v in koerper.data.vertices:
        i = v.index
        seite = "L" if v.co.x >= 0 else "R"
        arm = k.w(i, f"upperarm01.{seite}", f"upperarm02.{seite}", f"achsel.{seite}")
        bein = k.w(i, f"upperleg01.{seite}", f"upperleg02.{seite}")
        rumpf = k.w(i, *RUMPFKNOCHEN)
        rest = max(0.0, 1.0 - arm - bein - rumpf)
        teile.append(max((arm, "arm"), (bein, "bein"), (rumpf, "rumpf"), (rest, "rest"))[1])
    return teile


def _breite(koerper: bpy.types.Object, teile: list[str], z: float, erlaubt: tuple[str, ...], dz: float = 0.006) -> float:
    """Breite des Körpers in der Ansicht von vorn (Ausdehnung in x) auf Höhe z, nur Eckpunkte der Teile."""
    xs = [v.co.x for v, t in zip(koerper.data.vertices, teile) if t in erlaubt and abs(v.co.z - z) < dz]
    return max(xs) - min(xs) if xs else 0.0


def _schnitt(koerper: bpy.types.Object, k: koordinaten.Koordinaten, oeffnung: dict, teile: list[str]) -> dict:
    """Maße der Figur und daraus der Schnitt nach `BOARD` (Ruhehaltung, Raum des Skeletts, Meter):
    Brustbreite W des Shirts knapp unter den Ärmeln, höchster Punkt der Schulter am Kragen, Saum und
    Ärmel des Shirts, Weite an Taille und Saum; Bundbreite B und Saum der Shorts, ihre Weite am Saum."""
    L = (k.N - k.O).length
    S, E = k.kopf["upperarm01.L"], k.kopf["lowerarm01.L"]
    La = (E - S).length
    z_w = S.z - 0.56 * La  # knapp unter der Achsel (Board: Breite knapp unter den Ärmeln)
    W = _breite(koerper, teile, z_w, ("rumpf",)) + 2 * ABSTAND["shirt"]
    verts = koerper.data.vertices
    b = oeffnung["b"]
    schulter = [v.co.z for v, t in zip(verts, teile)
                if t == "rumpf" and b < abs(v.co.x) < b + 0.03 and _halsfeld(oeffnung, v.co) > 0]
    z_hals = max(schulter)  # höchster Punkt der Schulter am Kragen
    # Saum: Länge vom Board, aber über dem Schritt. Darunter läge der Stoff um jedes Bein einzeln wie eine
    # Hose, weil er dem Körper folgt; ein Shirt hängt dort frei (Vereinfachung, D-450)
    z_schritt = min(v.co.z for v in verts if abs(v.co.x) < 0.015)
    # Saum (D-478): knapp unter dem Bund der Shorts (`SAUM_UNTER_BUND`); Bund wie unten für die Shorts
    z_bund0 = k.O.z + HOSE_BUND * L
    B0 = _breite(koerper, teile, z_bund0, ("rumpf",)) + 2 * ABSTAND["hose"]
    z_saum = z_bund0 - BOARD["bund"] * BOARD["hose_laenge"] * B0 - SAUM_UNTER_BUND
    # Weite je Höhe: Der Umriss des Shirts folgt dem des Boards, von W unter den Ärmeln zur Taille (0,945 W
    # bei 0,39 der Strecke zum Saum) und zum Saum (1,07 W); wo der Körper schmaler ist, steht der Stoff
    # seitlich um die halbe Differenz ab (seitlich an der Hüfte hängt die Haut schon am Oberschenkel: Rumpf
    # und Bein zählen, die Arme nicht)
    z_taille = z_w - BOARD["taille_lage"] * (z_w - z_saum)
    weite = []
    for i in range(int((z_w - z_saum) / 0.01) + 2):
        z = z_w - i * 0.01
        if z >= z_taille:
            ziel = W + (BOARD["taille"] * W - W) * (z_w - z) / (z_w - z_taille)
        else:
            ziel = BOARD["taille"] * W + (BOARD["saum"] - BOARD["taille"]) * W * min(1.0, (z_taille - z) / (z_taille - z_saum))
        koerper_w = _breite(koerper, teile, z, ("rumpf", "bein")) + 2 * ABSTAND["shirt"]
        weite.append((z, max(0.0, (ziel - koerper_w) / 2)))
    # Shorts: Bund und Saum
    z_bund = k.O.z + HOSE_BUND * L
    B = _breite(koerper, teile, z_bund, ("rumpf",)) + 2 * ABSTAND["hose"]
    laenge = BOARD["hose_laenge"] * B
    z_hose_saum = z_bund - laenge
    A, K = k.kopf["upperleg01.L"], k.kopf["lowerleg01.L"]
    bein_t = (A.z - z_hose_saum) / (A.z - K.z)
    w_beine = _breite(koerper, teile, z_hose_saum, ("bein",)) + 2 * ABSTAND["hose"]
    saum_breite = BOARD["hose_saum"] * B
    return {
        "W": W, "z_w": z_w, "z_hals": z_hals, "La": La, "z_schritt": z_schritt,
        "shirt_laenge": z_hals - z_saum, "shirt_laenge_board": BOARD["shirt_laenge"] * W,
        "saum_s": (z_saum - k.O.z) / L, "z_saum": z_saum,
        "aermel_t": BOARD["aermel"] * W / La - AKROMION,
        "z_taille": z_taille, "weite": weite, "weite_max": max(e for _, e in weite),
        "B": B, "z_bund": z_bund, "hose_laenge": laenge, "z_hose_saum": z_hose_saum, "bein_t": bein_t,
        "weite_hose": max(0.0, (saum_breite - w_beine) / 2), "bein": BOARD["hose_bein"] * saum_breite,
        "Lb": (K - A).length,
    }


def _felder(koerper: bpy.types.Object, k: koordinaten.Koordinaten, oeffnung: dict, teile: list[str],
            schnitt: dict) -> dict:
    """Je Eckpunkt: Abstand zum Rand von Shirt (Saum und Ärmel, ohne den Halsausschnitt) und Hose
    (m, positiv = bedeckt); dazu der Abstand zur Halsöffnung (`hals`) für Kragen und Bündchen."""
    L = (k.N - k.O).length
    felder: dict = {n: [] for n in ("shirt", "hose", "hals")}
    for v, teil in zip(koerper.data.vertices, teile):
        p = v.co
        seite = "L" if p.x >= 0 else "R"
        _, s, _ = k.rumpf(p)
        shirt = hose = -1.0
        if teil == "arm":
            _, t, La, _ = k.glied(p, f"upperarm01.{seite}", f"lowerarm01.{seite}", Vector((0, -1, 0)), seite)
            shirt = (schnitt["aermel_t"] - t) * La
        elif teil == "rumpf":
            shirt = min((s - schnitt["saum_s"]) * L, _halsfeld(oeffnung, p))
            hose = (HOSE_BUND - s) * L
        elif teil == "bein":
            _, t, Lb, _ = k.glied(p, f"upperleg01.{seite}", f"lowerleg01.{seite}", Vector((0, -1, 0)), seite)
            hose = (schnitt["bein_t"] - t) * Lb
            shirt = (s - schnitt["saum_s"]) * L
        felder["shirt"].append(shirt)
        felder["hose"].append(hose)
        felder["hals"].append(_halsfeld(oeffnung, p) if teil == "rumpf" else 1.0)
    return felder


def _weite(koerper: bpy.types.Object, k: koordinaten.Koordinaten, teile: list[str], schnitt: dict) -> tuple[list, list]:
    """Zusätzlicher Abstand des Stoffs vom Körper (m) je Eckpunkt, damit der Schnitt dem Board folgt.
    Shirt: gerade geschnitten, unter den Ärmeln so weit, dass der Umriss dem des Boards folgt (Weite je
    Höhe aus `_schnitt`, dazwischen linear); seitlich voll, vorn und hinten `WEITE_VORN_HINTEN`.
    Shorts: am Bund eng, zum Saum hin weiter (Potenz `steigung`), außen bis zur Saumbreite des Boards,
    vorn und hinten weniger, innen kaum (die Beine berühren sich sonst)."""
    tabelle = schnitt["weite"]  # (z, Weite), von oben nach unten in Schritten von 1 cm
    z_w = schnitt["z_w"]

    def weite_bei(z: float) -> float:
        i = (z_w - z) / 0.01
        j = max(0, min(len(tabelle) - 2, int(i)))
        a = max(0.0, min(1.0, i - j))
        return tabelle[j][1] * (1 - a) + tabelle[j + 1][1] * a

    shirt, hose = [], []
    for v, teil in zip(koerper.data.vertices, teile):
        p = v.co
        th, _, _ = k.rumpf(p)
        e_shirt = 0.0
        if teil in ("rumpf", "bein") and p.z < z_w:
            g = math.sin(math.radians(th)) ** 2 + WEITE_VORN_HINTEN * math.cos(math.radians(th)) ** 2
            e_shirt = weite_bei(p.z) * g
        shirt.append(e_shirt)
        e_hose = 0.0
        if teil in ("rumpf", "bein"):
            vv = (schnitt["z_bund"] - p.z) / schnitt["hose_laenge"]
            if vv > 0:
                vv = min(1.0, vv) ** HOSE_WEITE["steigung"]
                if teil == "bein":
                    s = "L" if p.x >= 0 else "R"
                    tb, _, _, _ = k.glied(p, f"upperleg01.{s}", f"lowerleg01.{s}", Vector((0, -1, 0)), s)
                    c, fb = math.sin(math.radians(tb)), math.cos(math.radians(tb)) ** 2
                else:
                    c, fb = math.sin(math.radians(th)), math.cos(math.radians(th)) ** 2
                anteil = max(c, 0.0) ** 2 + HOSE_WEITE["vorn_hinten"] * fb + HOSE_WEITE["innen"] * max(-c, 0.0) ** 2
                e_hose = schnitt["weite_hose"] * vv * anteil
        hose.append(e_hose)
    # Fall (D-478): Shirt unter der Brust und Beine der Shorts hängen gerade nach unten
    fall_s, fall_h = _fall_shirt(koerper, k, teile, schnitt), _fall_hose(koerper, k, teile, schnitt)
    return [max(a, b) for a, b in zip(shirt, fall_s)], [max(a, b) for a, b in zip(hose, fall_h)]


def _fall_shirt(koerper: bpy.types.Object, k: koordinaten.Koordinaten, teile: list[str], schnitt: dict) -> list[float]:
    """Fall des Shirts (D-478, Ruhehaltung): Für jede Richtung um den Rumpf (6°-Fächer, beide Seiten zusammen) und
    jede Höhe (1 cm) unter der Achsel der größte Abstand der Haut von der Achse des Rumpfs; die Hülle nimmt von oben
    nach unten das Größte darüber mit. Der Stoff steht um `FALL` des Wegs zur Hülle ab: So hängt er von der Brust und
    den Schulterblättern gerade nach unten, statt in Taille, Bauch und Hohlkreuz einzufallen. Dazu Luft, die von der
    Achsel bis zum Saum auf `LUFT_SAUM` wächst."""
    u = (k.N - k.O).normalized()
    z_w, z_saum = schnitt["z_w"], schnitt["z_saum"]
    unten = z_saum - 0.04
    daten, rmax = [], {}
    for v, teil in zip(koerper.data.vertices, teile):
        p = v.co
        if teil not in ("rumpf", "bein") or p.z > z_w or p.z < unten:
            daten.append(None)
            continue
        th, _, _ = k.rumpf(p)
        rel = p - k.O
        r = (rel - rel.dot(u) * u).length
        fach, hoehe = min(29, int(th / 6.0)), int((z_w - p.z) / 0.01)
        daten.append((fach, hoehe, r))
        rmax[(fach, hoehe)] = max(rmax.get((fach, hoehe), 0.0), r)
    huelle = {}
    for fach in range(30):
        m = 0.0
        for hoehe in range(int((z_w - unten) / 0.01) + 2):
            m = max(m, rmax.get((fach, hoehe), 0.0))
            huelle[(fach, hoehe)] = m
    aus = []
    for d, v in zip(daten, koerper.data.vertices):
        if d is None:
            aus.append(0.0)
            continue
        fach, hoehe, r = d
        luft = LUFT_SAUM * min(1.0, max(0.0, (z_w - v.co.z) / (z_w - z_saum)))
        aus.append(FALL * max(0.0, huelle[(fach, hoehe)] - r) + luft)
    return aus


def _fall_hose(koerper: bpy.types.Object, k: koordinaten.Koordinaten, teile: list[str], schnitt: dict) -> list[float]:
    """Weite Beine der Shorts (D-478, Ruhehaltung): je Bein für jede Richtung um den Oberschenkel (12°-Fächer) und
    jeden Abschnitt längs (2 cm) ab dem Hüftgelenk der größte Abstand der Haut von seiner Achse; die Hülle nimmt nach
    unten das Größte darüber mit (Gesäß, Hüfte). Der Stoff steht um `HOSE_FALL` des Wegs zur Hülle ab und bekommt Luft,
    die zum Saum hin wächst (`HOSE_LUFT`); innen höchstens `HOSE_INNEN_MAX`, damit sich die Beine nicht kreuzen."""
    bein_t = schnitt["bein_t"]
    daten, rmax = [], {}
    for v, teil in zip(koerper.data.vertices, teile):
        p = v.co
        s = "L" if p.x >= 0 else "R"
        if teil not in ("rumpf", "bein") or p.z > schnitt["z_bund"]:
            daten.append(None)
            continue
        th, tt, Lb, r = k.glied(p, f"upperleg01.{s}", f"lowerleg01.{s}", Vector((0, -1, 0)), s)
        if tt < 0.0 or tt > bein_t + 0.05:
            daten.append(None)
            continue
        fach, abschnitt = int((th + 180.0) / 12.0) % 30, int(tt * Lb / 0.02)
        daten.append((s, fach, abschnitt, r, th, tt))
        rmax[(s, fach, abschnitt)] = max(rmax.get((s, fach, abschnitt), 0.0), r)
    huelle = {}
    n = int((bein_t + 0.05) * schnitt["Lb"] / 0.02) + 2
    for s in "LR":
        for fach in range(30):
            m = 0.0
            for abschnitt in range(n):
                m = max(m, rmax.get((s, fach, abschnitt), 0.0))
                huelle[(s, fach, abschnitt)] = m
    aus = []
    for d in daten:
        if d is None:
            aus.append(0.0)
            continue
        s, fach, abschnitt, r, th, tt = d
        sin, cos = math.sin(math.radians(th)), math.cos(math.radians(th))
        luft = (HOSE_LUFT["aussen"] * max(sin, 0.0) ** 2 + HOSE_LUFT["vorn_hinten"] * cos ** 2
                + HOSE_LUFT["innen"] * max(-sin, 0.0) ** 2) * min(1.0, max(0.0, tt / bein_t))
        e = HOSE_FALL * max(0.0, huelle[(s, fach, abschnitt)] - r) + luft
        if sin < -0.5:  # innen: kaum Weite, die Beine stehen nah beieinander
            e = min(e, HOSE_INNEN_MAX)
        aus.append(e)
    return aus


def _glatte_normalen(koerper: bpy.types.Object, radius: float = 0.03) -> list[Vector]:
    """Normalen der Ruhehaltung, gemittelt über die Umgebung (`radius`): ohne die Buckel der Muskeln."""
    verts = koerper.data.vertices
    baum = kdtree.KDTree(len(verts))
    for v in verts:
        baum.insert(v.co, v.index)
    baum.balance()
    aus = []
    for v in verts:
        n = Vector()
        for _, i, _ in baum.find_range(v.co, radius):
            n += verts[i].normal
        aus.append(n.normalized() if n.length > 1e-9 else v.normal.copy())
    return aus


def _streifen(koerper: bpy.types.Object, schnitt: dict, normalen: list[Vector]) -> list[float]:
    """Feld des Lime-Streifens an der Seite der Shorts (m, positiv = Streifen): Winkel der geglätteten
    Normale zur Seite (0 = genau seitlich nach außen, vorn negativ, hinten positiv) gegen die halbe Breite,
    die vom Bund zum Saum gleichmäßig wächst (`BOARD["streifen"]`, hinten oben breiter). Der Streifen
    beginnt unter dem Bund und reicht bis zum Saum, auf beiden Beinen."""
    st = BOARD["streifen"]
    aus = []
    for v, n in zip(koerper.data.vertices, normalen):
        p = v.co
        vv = (schnitt["z_bund"] - p.z) / schnitt["hose_laenge"]
        sx = 1.0 if p.x >= 0 else -1.0
        phi = math.degrees(math.atan2(n.y, n.x * sx))
        w = max(0.0, min(1.0, (vv - BOARD["bund"]) / (1 - BOARD["bund"])))
        oben = st["oben_hinten"] if phi > 0 else st["oben_vorn"]
        alpha = oben + (st["saum"] - oben) * w
        feld = (alpha - abs(phi)) * math.pi / 180 * 0.09
        aus.append(min(feld, (vv - BOARD["bund"]) * schnitt["hose_laenge"]))
    return aus


def _rahmen(koerper: bpy.types.Object, k: koordinaten.Koordinaten, teile: list[str], lage: dict, seite: float) -> dict:
    """Bildebene eines Logos oder Details: Mittelpunkt auf der Haut (Ruhehaltung), Normale als Mittel
    der Umgebung (3 cm), Hochachse längs des Körperteils, Querachse so, dass das Bild von außen
    richtig herum liegt. Lage am Rumpf über `ziel` (x, z) und `blick` (Logos und Kordel, genau auf den
    Punkt geschoben) oder am Oberschenkel bei `teil` „hose“ mit `winkel`/`lage` um den Knochen (0 vorn,
    90 außen; Anteil Hüfte→Knie). `erlaubt`: Eckpunkte des Körperteils (`teile`, Seite `x`), auf denen
    das Bild liegen darf; `tiefe`: Reichweite vor und hinter der Bildebene (D-422)."""
    verts = koerper.data.vertices
    if "winkel" in lage:
        s = "L" if lage.get("x", 1) > 0 else "R"  # Oberschenkel der Seite `x` (links positiv)
        kandidaten = []
        for i, t in enumerate(teile):
            if t == "bein" and verts[i].co.x * lage.get("x", 1) > 0:
                th, tt, _, _ = k.glied(verts[i].co, f"upperleg01.{s}", f"lowerleg01.{s}", Vector((0, -1, 0)), s)
                kandidaten.append((abs(th - lage["winkel"]) / 60 + abs(tt - lage["lage"]), i))
        achse = (k.kopf[f"upperleg01.{s}"] - k.kopf[f"lowerleg01.{s}"]).normalized()
    else:
        x0, z0 = lage["ziel"]
        blick = Vector(lage["blick"])
        kandidaten = [(abs(verts[i].co.x - x0) + abs(verts[i].co.z - z0), i)
                      for i, t in enumerate(teile) if t == "rumpf" and verts[i].normal.dot(blick) > 0.5]
        achse = (k.N - k.O).normalized()
    _, beste = min(kandidaten)
    P0 = verts[beste].co.copy()
    if "genau" in lage:
        # Genau auf den Winkel `genau` (D-461): Der Punkt des Netzes bei `winkel` gibt nur die Höhe vor (so bleibt
        # das Logo so hoch wie bisher); die Mitte liegt auf der Haut, wo ein Strahl von der Achse des Knochens in
        # dieser Höhe unter dem Winkel `genau` sie trifft. Bis D-460 sprang die Mitte zum nächsten Punkt des
        # Netzes (am Oberschenkel rund 10° auseinander)
        from mathutils.bvhtree import BVHTree

        _, t0, Lk, _ = k.glied(P0, f"upperleg01.{s}", f"lowerleg01.{s}", Vector((0, -1, 0)), s)
        A, B = k.kopf[f"upperleg01.{s}"], k.kopf[f"lowerleg01.{s}"]
        ach = (B - A).normalized()
        vorn = Vector((0, -1, 0))
        ant = (vorn - vorn.dot(ach) * ach).normalized()
        lat = ach.cross(ant) if s == "L" else ant.cross(ach)
        if lat.x * (1 if s == "L" else -1) < 0:
            lat = -lat
        w = math.radians(lage["genau"])
        haut = BVHTree.FromPolygons([v.co for v in verts], [list(f.vertices) for f in koerper.data.polygons])
        C = A + ach * (t0 * Lk)
        treffer, _, _, _ = haut.ray_cast(C, ant * math.cos(w) + lat * math.sin(w), 0.3)
        if treffer is not None:
            P0 = treffer
    n0 = sum((v.normal for v in verts if (v.co - P0).length < 0.03), Vector()).normalized()
    hoch = (achse - achse.dot(n0) * n0).normalized()
    quer = hoch.cross(n0)
    if "ziel" in lage:
        # genau auf den Zielpunkt schieben: längs der Hochachse auf z0, längs der Querachse auf x0
        x0, z0 = lage["ziel"]
        if abs(hoch.z) > 0.3:
            P0 = P0 + hoch * ((z0 - P0.z) / hoch.z)
        if abs(quer.x) > 0.3:
            P0 = P0 + quer * ((x0 - P0.x) / quer.x)
    x = lage.get("x")
    erlaubt = {i for i, t in enumerate(teile)
               if t in lage.get("teile", (t,)) and (x is None or verts[i].co.x * x > 0)}
    return {"P0": P0, "n": n0, "hoch": hoch, "quer": quer, "seite": seite,
            "erlaubt": erlaubt, "tiefe": lage.get("tiefe", 1.0)}


# ---------------------------------------------------------------------- Netz der Teile


def _glaetten(bm: bmesh.types.BMesh, runden: int, anteil: float = 0.5) -> None:
    """Laplace-Glättung ohne Ränder (Taubin: abwechselnd glätten und zurückschieben, kein Schrumpfen)."""
    for r in range(runden * 2):
        f = anteil if r % 2 == 0 else -anteil * 1.04
        neu = {}
        for v in bm.verts:
            if v.is_boundary or not v.link_edges:
                continue
            mitte = sum((e.other_vert(v).co for e in v.link_edges), Vector()) / len(v.link_edges)
            neu[v] = v.co + (mitte - v.co) * f
        for v, co in neu.items():
            v.co = co


def _teil(name: str, koerper: bpy.types.Object, skelett: bpy.types.Object, feld: list[float],
          abstand: float, rahmen: dict[str, dict], rand: float = 0.03, kragen: list[float] | None = None,
          weite: list[float] | None = None, attribute: dict[str, list[float]] | None = None) -> bpy.types.Object:
    """Kleidungsstück: Flächen, deren Eckpunkte höchstens `rand` außerhalb des Saums liegen, kopiert,
    um `abstand` plus die Weite des Schnitts (`weite`, je Eckpunkt) versetzt und geglättet; mit denselben
    Gewichten am Skelett. Je Logo und Detail eine UV-Schicht (ebene Projektion auf die Bildebene) und eine
    Maske: nur Flächen des erlaubten Körperteils in Reichweite der Bildebene, die zu ihr zeigen. Mit
    `kragen` (Abstand zur Halsöffnung je Eckpunkt) hängt der Stoff nahe der Öffnung am Halsansatz
    (`_kragen_binden`, D-431). `attribute`: weitere Felder je Eckpunkt für den Shader (z. B. Streifen)."""
    quelle = koerper.data
    behalten = {v.index for v in quelle.vertices if feld[v.index] > -rand}
    bm = bmesh.new()
    bm.from_mesh(quelle)
    bm.verts.ensure_lookup_table()
    nummer = bm.verts.layers.int.new("nummer")
    for v in bm.verts:
        v[nummer] = v.index
    weg = [v for v in bm.verts if v.index not in behalten]
    bmesh.ops.delete(bm, geom=weg, context="VERTS")
    bm.normal_update()
    # Abstand zur Haut, dann glätten; danach nirgends näher als 3 mm an der Haut
    haut = {v: (v.co.copy(), v.normal.copy()) for v in bm.verts}
    for v in bm.verts:
        v.co = v.co + v.normal * (abstand + (weite[v[nummer]] if weite else 0.0))
    _glaetten(bm, 6)
    for v in bm.verts:
        co0, n0 = haut[v]
        tiefe = (v.co - co0).dot(n0)
        if tiefe < 0.003:
            v.co = v.co + n0 * (0.003 - tiefe)
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    # Gewichte kommen mit dem Netz (bmesh übernimmt sie je Eckpunkt mit den Nummern der Gruppen); dazu
    # dieselben Gruppen in derselben Reihenfolge wie am Körper. Die Felder der Säume und Details nach den
    # ursprünglichen Nummern der Eckpunkte.
    alt = sorted(behalten)
    for g in koerper.vertex_groups:
        obj.vertex_groups.new(name=g.name)
    if kragen is not None:
        _kragen_binden(obj, [kragen[i] for i in alt])
    felder = {"Saum": feld, **(attribute or {})}
    if kragen is not None:
        felder["Hals"] = kragen  # Abstand zur Halsöffnung, für das Bündchen
    for attr_name, werte in felder.items():
        attr = mesh.attributes.new(attr_name, "FLOAT", "POINT")
        for neu_i, alt_i in enumerate(alt):
            attr.data[neu_i].value = werte[alt_i]
    for logo_name, r in rahmen.items():
        schicht = mesh.uv_layers.new(name="Logo" + logo_name)
        maske = mesh.attributes.new("Maske" + logo_name, "FLOAT", "POINT")
        uv = []
        for neu_i, alt_i in enumerate(alt):
            v = quelle.vertices[alt_i]
            d = v.co - r["P0"]
            uv.append((d.dot(r["quer"]) / r["seite"] + 0.5, d.dot(r["hoch"]) / r["seite"] + 0.5))
            if alt_i in r["erlaubt"] and abs(d.dot(r["n"])) <= r["tiefe"]:
                maske.data[neu_i].value = max(0.0, min(1.0, (v.normal.dot(r["n"]) - 0.15) / 0.25))
            else:
                maske.data[neu_i].value = 0.0
        for loop in mesh.loops:
            schicht.data[loop.index].uv = uv[loop.vertex_index]
    for poly in mesh.polygons:
        poly.use_smooth = True
    obj.parent = koerper.parent
    mod = obj.modifiers.new("Skelett", "ARMATURE")
    mod.object = skelett
    dicke = obj.modifiers.new("Dicke", "SOLIDIFY")
    dicke.thickness = DICKE
    dicke.offset = -1.0
    sub = obj.modifiers.new("Glatt", "SUBSURF")
    sub.levels = 1
    sub.render_levels = 2
    return obj


def _kragen_binden(obj: bpy.types.Object, abstand: list[float]) -> None:
    """Gewichte des Stoffs nahe der Halsöffnung gleitend auf die Knochen des Halsansatzes umbinden
    (`KRAGEN_KNOCHEN`): an der Kante ganz, bis `KRAGEN["bindung"]` auslaufend. So bleibt der Kragen
    ein Ring am Halsansatz, auch wenn Schultern und Trapez den Stoff heben (D-431)."""
    gruppen = {g.name: g for g in obj.vertex_groups}
    for v, d in zip(obj.data.vertices, abstand):
        if d >= KRAGEN["bindung"]:
            continue
        x = max(0.0, min(1.0, 1.0 - d / KRAGEN["bindung"]))
        t = x * x * (3 - 2 * x)
        alt = {g.group: g.weight for g in v.groups}
        for idx, w in alt.items():
            obj.vertex_groups[idx].add([v.index], w * (1 - t), "REPLACE")
        for name, anteil in KRAGEN_KNOCHEN.items():
            vorher = alt.get(gruppen[name].index, 0.0) * (1 - t)
            gruppen[name].add([v.index], vorher + t * anteil, "REPLACE")


def _buendchen(shirt: bpy.types.Object, koerper: bpy.types.Object, skelett: bpy.types.Object,
               oeffnung: dict, material: bpy.types.Material) -> bpy.types.Object:
    """Kragenbündchen (D-431): ein schmales Band auf der Kante der Halsöffnung, aus den Punkten, in
    denen das Feld `Hals` des Shirts (Abstand zur Öffnung je Eckpunkt) die Null kreuzt, nach dem Winkel
    um die Öffnung geordnet, geglättet und auf 72 Stützen verteilt; jede Stütze liegt mindestens 2,5 mm
    über dem Stoff. Innenkante knapp in der Öffnung, Außenkante `KRAGEN["buendchen"]` nach außen auf dem
    Stoff; Dicke über Solidify. Gewichte vom nächsten Eckpunkt des Shirts (schon umgebunden)."""
    mesh = shirt.data
    hals = mesh.attributes["Hals"].data
    C, e, m = oeffnung["C"], oeffnung["e"], oeffnung["m"]
    punkte = []
    for ed in mesh.edges:
        i, j = ed.vertices
        a, b = hals[i].value, hals[j].value
        if (a < 0) == (b < 0) or abs(a - b) < 1e-9:
            continue
        t = a / (a - b)
        p = mesh.vertices[i].co.lerp(mesh.vertices[j].co, t)
        d = p - C
        if d.length > 0.2:
            continue
        n = mesh.vertices[i].normal.lerp(mesh.vertices[j].normal, t).normalized()
        punkte.append((math.atan2(d.x, -d.dot(e)), p, n))
    if len(punkte) < 12:
        raise ValueError("Kragen: zu wenige Schnittpunkte der Halsöffnung")
    punkte.sort(key=lambda x: x[0])
    N = 72
    stuetzen = []
    for s_i in range(N):
        w = -math.pi + 2 * math.pi * (s_i + 0.5) / N
        # Mittel der Schnittpunkte im Winkelfenster ±2,5 Schritte (Glättung, Lücken überbrückt)
        nahe = [(p, n) for a, p, n in punkte if abs(((a - w + math.pi) % (2 * math.pi)) - math.pi) < 2.5 * 2 * math.pi / N]
        if not nahe:
            nahe = [min(punkte, key=lambda x: abs(((x[0] - w + math.pi) % (2 * math.pi)) - math.pi))[1:]]
        p = sum((q for q, _ in nahe), Vector()) / len(nahe)
        n = sum((q for _, q in nahe), Vector()).normalized()
        stuetzen.append((p, n))
    # dreimal glätten (Nachbarn mitteln), damit die Kante ruhig läuft
    for _ in range(3):
        stuetzen = [((stuetzen[i - 1][0] + 2 * stuetzen[i][0] + stuetzen[(i + 1) % N][0]) / 4,
                     (stuetzen[i - 1][1] + 2 * stuetzen[i][1] + stuetzen[(i + 1) % N][1]).normalized()) for i in range(N)]
    # jede Stütze mindestens 2,5 mm über der Tangentialebene des nächsten Stoffpunkts (die Glättung
    # zieht Stützen an gewölbten Stellen unter den Stoff)
    sv = mesh.vertices
    angehoben = []
    for p, n in stuetzen:
        naechster = min(sv, key=lambda v: (v.co - p).length_squared)
        hoehe = (p - naechster.co).dot(naechster.normal)
        if hoehe < 0.0025:
            p = p + naechster.normal * (0.0025 - hoehe)
        angehoben.append((p, n))
    stuetzen = angehoben
    ecken = []
    for i, (p, n) in enumerate(stuetzen):
        tang = (stuetzen[(i + 1) % N][0] - stuetzen[i - 1][0]).normalized()
        aussen = n.cross(tang).normalized()
        # nach außen heißt von der Öffnung weg: in der Ebene der Öffnung radial nach außen und unter
        # die Ebene (auf die Schulter, die Brust, den Rücken), nicht den Hals hinauf
        radial = (p - C) - m * (p - C).dot(m)
        if aussen.dot(radial.normalized()) - aussen.dot(m) < 0:
            aussen = -aussen
        # Innenkante 3 mm in der Öffnung, damit das Bündchen die Schnittkante des Stoffs verdeckt
        ecken.append(p - aussen * 0.003)
        ecken.append(p + aussen * KRAGEN["buendchen"])
    flaechen = [[2 * i, 2 * i + 1, 2 * ((i + 1) % N) + 1, 2 * ((i + 1) % N)] for i in range(N)]
    bm_mesh = bpy.data.meshes.new("Kragen")
    bm_mesh.from_pydata([tuple(q) for q in ecken], [], flaechen)
    bm_mesh.update()
    for poly in bm_mesh.polygons:
        poly.use_smooth = True
    obj = bpy.data.objects.new("Kragen", bm_mesh)
    bpy.context.scene.collection.objects.link(obj)
    obj.parent = shirt.parent
    # Gewichte: vom nächsten Eckpunkt des Shirts
    kd = {g.index: g.name for g in shirt.vertex_groups}
    namen = {}
    for g in koerper.vertex_groups:
        namen[g.name] = obj.vertex_groups.new(name=g.name)
    for i, q in enumerate(ecken):
        naechster = min(sv, key=lambda v: (v.co - q).length_squared)
        for g in naechster.groups:
            namen[kd[g.group]].add([i], g.weight, "REPLACE")
    mod = obj.modifiers.new("Skelett", "ARMATURE")
    mod.object = skelett
    dicke = obj.modifiers.new("Dicke", "SOLIDIFY")
    dicke.thickness = KRAGEN["buendchen_dicke"]
    dicke.offset = 1.0
    sub = obj.modifiers.new("Glatt", "SUBSURF")
    sub.levels = 1
    sub.render_levels = 2
    obj.data.materials.append(material)
    return obj


def _saumband(shirt: bpy.types.Object, koerper: bpy.types.Object, skelett: bpy.types.Object, schnitt: dict,
              material: bpy.types.Material) -> bpy.types.Object:
    """Saumband des Shirts (D-478): ein Band auf dem Saum am Rumpf wie das Kragenbündchen (`_buendchen`), damit
    zwischen Shirt und Shorts eine Kante mit leichtem Schatten zu sehen ist, auch bäuchlings und von hinten. Aus den
    Punkten, in denen das Feld `Saum` des Shirts die Null kreuzt (nur nahe der Saumhöhe, nicht an den Ärmeln), nach
    dem Winkel um den Rumpf geordnet, geglättet und auf 96 Stützen verteilt; jede Stütze mindestens
    `SAUMBAND["ueber"]` über dem Stoff. Unterkante `SAUMBAND["unter"]` unter dem Saum (sie verdeckt die Schnittkante),
    Oberkante `SAUMBAND["hoehe"]` darüber am Stoff entlang; Dicke über Solidify nach außen. Gewichte vom nächsten
    Eckpunkt des Shirts."""
    mesh = shirt.data
    saum = mesh.attributes["Saum"].data
    z0 = schnitt["z_saum"]
    roh = []
    for ed in mesh.edges:
        i, j = ed.vertices
        a, b = saum[i].value, saum[j].value
        if (a < 0) == (b < 0) or abs(a - b) < 1e-9:
            continue
        t = a / (a - b)
        p = mesh.vertices[i].co.lerp(mesh.vertices[j].co, t)
        if abs(p.z - z0) > 0.05:  # Ärmel und Hals liegen weit darüber
            continue
        n = mesh.vertices[i].normal.lerp(mesh.vertices[j].normal, t).normalized()
        roh.append((p, n))
    if len(roh) < 24:
        raise ValueError("Saumband: zu wenige Schnittpunkte des Saums")
    y_mitte = sum(p.y for p, _ in roh) / len(roh)
    punkte = sorted(((math.atan2(p.x, -(p.y - y_mitte)), p, n) for p, n in roh), key=lambda x: x[0])
    N = 96
    stuetzen = []
    for s_i in range(N):
        w = -math.pi + 2 * math.pi * (s_i + 0.5) / N
        nahe = [(p, n) for a, p, n in punkte if abs(((a - w + math.pi) % (2 * math.pi)) - math.pi) < 2.5 * 2 * math.pi / N]
        if not nahe:
            nahe = [min(punkte, key=lambda x: abs(((x[0] - w + math.pi) % (2 * math.pi)) - math.pi))[1:]]
        stuetzen.append((sum((q for q, _ in nahe), Vector()) / len(nahe), sum((q for _, q in nahe), Vector()).normalized()))
    for _ in range(3):
        stuetzen = [((stuetzen[i - 1][0] + 2 * stuetzen[i][0] + stuetzen[(i + 1) % N][0]) / 4,
                     (stuetzen[i - 1][1] + 2 * stuetzen[i][1] + stuetzen[(i + 1) % N][1]).normalized()) for i in range(N)]
    sv = mesh.vertices
    baum = kdtree.KDTree(len(sv))
    for v in sv:
        baum.insert(v.co, v.index)
    baum.balance()
    ecken = []
    for i, (p, n) in enumerate(stuetzen):
        tang = (stuetzen[(i + 1) % N][0] - stuetzen[i - 1][0]).normalized()
        hoch = n.cross(tang).normalized()
        if hoch.z < 0:
            hoch = -hoch
        for q in (p - hoch * SAUMBAND["unter"], p + hoch * SAUMBAND["hoehe"]):
            _, j, _ = baum.find(q)
            hoehe = (q - sv[j].co).dot(sv[j].normal)
            if hoehe < SAUMBAND["ueber"]:
                q = q + sv[j].normal * (SAUMBAND["ueber"] - hoehe)
            ecken.append(q)
    flaechen = [[2 * i, 2 * ((i + 1) % N), 2 * ((i + 1) % N) + 1, 2 * i + 1] for i in range(N)]
    me = bpy.data.meshes.new("Saumband")
    me.from_pydata([tuple(q) for q in ecken], [], flaechen)
    me.update()
    # Flächen nach außen (vom Rumpf weg)
    mitte = sum(ecken, Vector()) / len(ecken)
    for poly in me.polygons:
        poly.use_smooth = True
    aussen = sum(((me.vertices[poly.vertices[0]].co - mitte).dot(poly.normal) for poly in me.polygons))
    if aussen < 0:
        for poly in me.polygons:
            poly.flip()
        me.update()
    obj = bpy.data.objects.new("Saumband", me)
    bpy.context.scene.collection.objects.link(obj)
    obj.parent = shirt.parent
    kd = {g.index: g.name for g in shirt.vertex_groups}
    namen = {g.name: obj.vertex_groups.new(name=g.name) for g in koerper.vertex_groups}
    for i, q in enumerate(ecken):
        _, j, _ = baum.find(q)
        for g in sv[j].groups:
            namen[kd[g.group]].add([i], g.weight, "REPLACE")
    mod = obj.modifiers.new("Skelett", "ARMATURE")
    mod.object = skelett
    dicke = obj.modifiers.new("Dicke", "SOLIDIFY")
    dicke.thickness = SAUMBAND["dicke"]
    dicke.offset = 1.0
    sub = obj.modifiers.new("Glatt", "SUBSURF")
    sub.levels = 1
    sub.render_levels = 2
    obj.data.materials.append(material)
    return obj


# ---------------------------------------------------------------------- Logos als Bild


def _pfad_polygone(d: str) -> list[list[tuple[float, float]]]:
    """SVG-Pfad (absolute M, L, C, Z) als Polygone, eines je Teilpfad (ein Buchstabe mit Loch hat zwei);
    Kurven in 24 Stücke."""
    tokens = re.findall(r"[MLCZ]|-?\d*\.?\d+(?:e-?\d+)?", d)
    polys: list[list[tuple[float, float]]] = []
    pts: list[tuple[float, float]] = []
    i, cur, cmd = 0, (0.0, 0.0), ""
    while i < len(tokens):
        if tokens[i] in "MLCZ":
            cmd = tokens[i]
            i += 1
            if cmd == "Z":
                continue
            if cmd == "M" and pts:
                polys.append(pts)
                pts = []
        if cmd in ("M", "L"):
            cur = (float(tokens[i]), float(tokens[i + 1]))
            pts.append(cur)
            i += 2
        elif cmd == "C":
            p1, p2, p3 = [(float(tokens[i + j]), float(tokens[i + j + 1])) for j in (0, 2, 4)]
            for n in range(1, 25):
                t, mt = n / 24, 1 - n / 24
                pts.append((mt**3 * cur[0] + 3 * mt * mt * t * p1[0] + 3 * mt * t * t * p2[0] + t**3 * p3[0],
                            mt**3 * cur[1] + 3 * mt * mt * t * p1[1] + 3 * mt * t * t * p2[1] + t**3 * p3[1]))
            cur = p3
            i += 6
        else:
            raise ValueError(f"SVG-Pfad: unbekannt {tokens[i]}")
    if pts:
        polys.append(pts)
    return polys


def _svg_polygone(pfad: Path, gruppe: str | None = None) -> list[list[tuple[float, float]]]:
    """Alle Pfade einer SVG-Datei (oder nur der Gruppe `gruppe`) als Polygone in SVG-Koordinaten."""
    text = pfad.read_text(encoding="utf-8")
    if gruppe:
        m = re.search(rf'<g id="{gruppe}"[^>]*>(.*?)</g>', text, re.S)
        if not m:
            raise ValueError(f"{pfad.name}: Gruppe {gruppe} fehlt")
        text = m.group(1)
    return [poly for d in re.findall(r'<path[^>]*\sd="([^"]+)"', text) for poly in _pfad_polygone(d)]


def _bbox(polys) -> tuple[float, float, float, float]:
    xs = [x for p in polys for x, _ in p]
    ys = [y for p in polys for _, y in p]
    return min(xs), max(xs), min(ys), max(ys)


def _rastern(polys: list[list[tuple[float, float]]], N: int, U: int = 4):
    """Deckkraft (N × N, Zeile 0 unten) der Polygone in Bildkoordinaten 0 bis 1 (y nach oben),
    gerade-ungerade gefüllt (Löcher bleiben frei), U-fach überabgetastet."""
    import numpy as np

    S = N * U
    zaehl = np.zeros((S, S + 1), dtype=np.int32)
    yc = (np.arange(S) + 0.5) / S
    for poly in polys:
        for (x1, y1), (x2, y2) in zip(poly, poly[1:] + poly[:1]):
            if y1 == y2:
                continue
            zeilen = np.nonzero((y1 > yc) != (y2 > yc))[0]
            if zeilen.size == 0:
                continue
            kreuz = (x1 + (yc[zeilen] - y1) * (x2 - x1) / (y2 - y1)) * S
            spalten = np.clip(np.ceil(kreuz - 0.5).astype(int), 0, S)
            np.add.at(zaehl, (zeilen, spalten), 1)
    innen = (np.cumsum(zaehl, axis=1)[:, :S] % 2).astype(np.float32)
    return innen.reshape(N, U, N, U).mean(axis=(1, 3))


def _einpassen(polys, mitte_x: float, mitte_y: float, hoehe: float, einheit: float):
    """Polygone aus SVG-Koordinaten (y nach unten) in Bildkoordinaten 0..1 (y nach oben): das Motiv
    `hoehe` Bildseiten hoch, seine Mitte bei (`mitte_x`, `mitte_y`); `einheit` ist die Höhe des
    Motivs in SVG-Einheiten."""
    x0, x1, y0, y1 = _bbox(polys)
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    f = hoehe / einheit
    return [[(mitte_x + (x - cx) * f, mitte_y - (y - cy) * f) for x, y in poly] for poly in polys]


def _speichern(bild: bpy.types.Image, pfad: Path) -> None:
    QUELLE.mkdir(parents=True, exist_ok=True)
    bild.alpha_mode = "STRAIGHT"
    bild.filepath_raw = str(pfad)
    bild.file_format = "PNG"
    bild.save()


def _bild_aus_alpha(name: str, alpha) -> bpy.types.Image:
    import numpy as np

    N = alpha.shape[0]
    bild = bpy.data.images.new(name, N, N, alpha=True)
    px = np.ones((N, N, 4), dtype=np.float32)
    px[..., 3] = alpha
    bild.pixels.foreach_set(px.ravel())
    return bild


def _bilder(motiv: str) -> dict[str, bpy.types.Image]:
    """Motiv als quadratische Bilder mit Deckkraft (weiß auf durchsichtig), je Teil eines, gespeichert in
    `quelle/form-<motiv>[-<teil>].png`:

    - „f“: das FORM-F aus `symbol-f-gruen.svg`, 1024 px, `F_ANTEIL` der Höhe, in der Mitte (Teil „f“);
    - „ruecken“: F über der Wortmarke FORM (`logo-kopfzeile-dunkel.svg`, Gruppe `wortmarke`) im
      Verhältnis des Startbilds (`RUECKEN_LOGO`, D-459), 2048 px auf `RUECKEN_SEITE` Versalhöhen, der
      Block senkrecht mittig, beide waagrecht mittig; Teile „f“ und „wort“ (zwei Farben)."""
    f_polys = _svg_polygone(SVG_F)
    f_einheit = _bbox(f_polys)[3] - _bbox(f_polys)[2]
    if motiv == "f":
        N = 1024
        teile = {"f": _einpassen(f_polys, 0.5, 0.5, F_ANTEIL, f_einheit)}
        dateien = {"f": QUELLE / "form-f.png"}
    elif motiv == "ruecken":
        N = 2048
        v = RUECKEN_LOGO
        s = RUECKEN_SEITE
        w_polys = _svg_polygone(SVG_WORTMARKE, "wortmarke")
        _, _, wy0, wy1 = _bbox(w_polys)
        # Versalhöhe = 1 Einheit; der Block ist f + abstand + 1 hoch, seine Mitte in der Bildmitte
        teile = {"f": _einpassen(f_polys, 0.5, 0.5 + (v["abstand"] + 1.0) / 2 / s, v["f"] / s, f_einheit),
                 "wort": _einpassen(w_polys, 0.5, 0.5 - (v["f"] + v["abstand"]) / 2 / s, 1.0 / s, wy1 - wy0)}
        # Verhältnis im Namen: Ändern sich die Werte, entsteht ein neues Bild statt eines veralteten
        name = f"form-ruecken-{v['f']:.2f}-{v['abstand']:.2f}"
        dateien = {"f": QUELLE / f"{name}-f.png", "wort": QUELLE / f"{name}-wort.png"}
    else:
        raise ValueError(f"Motiv {motiv} unbekannt")
    aus = {}
    for teil, polys in teile.items():
        pfad = dateien[teil]
        if pfad.exists():
            aus[teil] = bpy.data.images.load(str(pfad), check_existing=True)
        else:
            aus[teil] = _bild_aus_alpha(f"FORM-{motiv}-{teil}", _rastern(polys, N))
            _speichern(aus[teil], pfad)
    return aus


def _kordel_bilder(schnitt: dict) -> dict[str, bpy.types.Image]:
    """Kordel der Shorts als Bilder (Deckkraft) für Schnur und Hülsen: zwei Schnüre aus der Mitte des
    Bunds nach unten, leicht auseinander, unten je eine Hülse; 512 px auf `seite` Metern, Mitte des Bilds
    an der Unterkante des Bunds. Maße aus `BOARD["kordel"]` mal Bundbreite B."""
    import numpy as np

    kd = BOARD["kordel"]
    B = schnitt["B"]
    seite = 2.4 * kd["laenge"] * B
    N = 512
    lin = (np.arange(N) + 0.5) / N * seite - seite / 2
    X, Y = np.meshgrid(lin, lin)  # Zeile 0 ist in Blender unten: y steigt mit der Zeile
    tief = -Y  # unter der Unterkante des Bunds
    laenge, ende = kd["laenge"] * B, kd["ende"] * B
    mitte = kd["abstand"] * B / 2 + tief * 0.08  # die Schnüre laufen nach unten leicht auseinander
    abst = np.abs(np.abs(X) - mitte)
    schnur = (abst < 0.0016) & (tief > -0.002) & (tief < laenge - ende)
    huelse = (abst < 0.0024) & (tief >= laenge - ende) & (tief < laenge)
    aus = {}
    for name, maske in (("schnur", schnur), ("huelse", huelse)):
        aus[name] = _bild_aus_alpha("Kordel-" + name, maske.astype(np.float32))
    aus["seite"] = seite
    return aus


# ---------------------------------------------------------------------- Hilfen für den Shader


def _rechne(nodes, links, op: str, a, b=None):
    """Rechenknoten; `a` und `b` sind Sockets oder Zahlen."""
    m = nodes.new("ShaderNodeMath")
    m.operation = op
    for eingang, wert in ((0, a), (1, b)):
        if wert is None:
            continue
        if isinstance(wert, (int, float)):
            m.inputs[eingang].default_value = float(wert)
        else:
            links.new(wert, m.inputs[eingang])
    return m.outputs[0]


def _stufe(nodes, links, wert, von: float, bis: float, nach: tuple[float, float] = (0.0, 1.0)):
    """Weicher Übergang (Smoothstep) von `von` nach `bis` auf `nach`, geklemmt."""
    rng = nodes.new("ShaderNodeMapRange")
    rng.interpolation_type = "SMOOTHSTEP"
    rng.clamp = True
    rng.inputs["From Min"].default_value = von
    rng.inputs["From Max"].default_value = bis
    rng.inputs["To Min"].default_value = nach[0]
    rng.inputs["To Max"].default_value = nach[1]
    links.new(wert, rng.inputs["Value"])
    return rng.outputs["Result"]


# ---------------------------------------------------------------------- Material


def stoff_material(name: str, farbe: str, logos: list[tuple[str, str, dict[str, str]]],
                   kordel: dict | None = None, streifen: bool = False, bund: float | None = None,
                   mit_saum: bool = True) -> bpy.types.Material:
    """Stoff matt mit leichtem Glanz (Sheen); endet scharf am Saum (Attribut „Saum“, auch die
    Halsöffnung). Darauf, je nach Teil: der Bund etwas dunkler (`bund`: Höhe in m, Attribut „Bund“ =
    Abstand unter dem oberen Rand), der Streifen in Lime (Attribut „Streifen“), die Kordel (Bilder aus
    `_kordel_bilder`, UV-Schicht `LogoKordel`) und die Logos (je (Name, Motiv, Farbe je Teil): UV-Schicht
    `Logo<Name>`, Maske `Maske<Name>`) wie ein Aufdruck. Ohne `mit_saum` (Kragenbündchen) ist der Stoff
    überall deckend. Keine Muskelzonen (D-449)."""
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    bsdf = nodes["Principled BSDF"]
    # matt wie das Board: wenig Glanz und Sheen, sonst wirkt der dunkle Stoff grau (D-450)
    bsdf.inputs["Roughness"].default_value = 0.88
    bsdf.inputs["Specular IOR Level"].default_value = 0.25
    bsdf.inputs["Sheen Weight"].default_value = 0.1
    bsdf.inputs["Sheen Roughness"].default_value = 0.45

    def maske(attribut: str, von: float, bis: float):
        attr = nodes.new("ShaderNodeAttribute")
        attr.attribute_name = attribut
        attr.attribute_type = "GEOMETRY"
        return _stufe(nodes, links, attr.outputs["Fac"], von, bis)

    def mal(a, b):
        return _rechne(nodes, links, "MULTIPLY", a, b)

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

    def bild(image, uv_name: str):
        uv = nodes.new("ShaderNodeUVMap")
        uv.uv_map = uv_name
        tex = nodes.new("ShaderNodeTexImage")
        tex.image = image
        tex.extension = "CLIP"
        tex.interpolation = "Cubic"
        links.new(uv.outputs["UV"], tex.inputs["Vector"])
        return tex.outputs["Alpha"]

    farbe_out = szene.srgb(farbe)
    if bund:
        farbe_out = mischen(_rechne(nodes, links, "SUBTRACT", 1.0, maske("Bund", bund - 0.0008, bund + 0.0008)),
                            farbe_out, szene.srgb(BUND))
    if streifen:
        farbe_out = mischen(maske("Streifen", -0.0008, 0.0008), farbe_out, szene.srgb(LIME))
    if kordel:
        sichtbar = maske("MaskeKordel", 0.45, 0.55)
        for teil, ton in (("schnur", KORDEL), ("huelse", KORDEL_ENDE)):
            farbe_out = mischen(mal(bild(kordel[teil], "LogoKordel"), sichtbar), farbe_out, szene.srgb(ton))
    for logo_name, motiv, farben in logos:
        bilder = _bilder(motiv)
        sichtbar = maske("Maske" + logo_name, 0.45, 0.55)
        for teil, ton in farben.items():
            farbe_out = mischen(mal(bild(bilder[teil], "Logo" + logo_name), sichtbar), farbe_out, szene.srgb(ton))
    if isinstance(farbe_out, tuple):  # nur Stofffarbe (Kragenbündchen)
        bsdf.inputs["Base Color"].default_value = farbe_out
    else:
        links.new(farbe_out, bsdf.inputs["Base Color"])
    if mit_saum:
        links.new(maske("Saum", -0.0008, 0.0008), bsdf.inputs["Alpha"])
    return mat


def anziehen(koerper: bpy.types.Object, skelett: bpy.types.Object, mit_schuhen: bool = True) -> list[bpy.types.Object]:
    """Shirt mit Kragenbündchen und Shorts nach dem Board an die Figur (nach `figur.schulter_gewichte`),
    mit `mit_schuhen` dazu Socken und Schuhe (`schuhe.anziehen`). Setzt am Körper das Attribut „Bedeckt“
    (Abstand innerhalb von Shirt, Shorts oder Socke, m): Haut, die tiefer als 12 mm unter dem Stoff liegt,
    blendet das Material aus (`haut_ausblenden`). Die Maße des Schnitts stehen danach in
    `anziehen.schnitt`, die der Logos in `anziehen.logos` (für Bericht und Prüfung), ihre Mittelpunkte in
    `anziehen.mitten`."""
    k = koordinaten.Koordinaten(koerper, skelett)
    oeffnung = _halsoeffnung(koerper, k)
    teile = _teile(koerper, k)
    schnitt = _schnitt(koerper, k, oeffnung, teile)
    f = _felder(koerper, k, oeffnung, teile, schnitt)
    weite_shirt, weite_hose = _weite(koerper, k, teile, schnitt)
    normalen = _glatte_normalen(koerper)
    streifen = _streifen(koerper, schnitt, normalen)
    bund = [schnitt["z_bund"] - v.co.z for v in koerper.data.vertices]
    W = schnitt["W"]
    buendchen = KRAGEN["buendchen"]
    # Logos nach dem Board: Höhe des F, Mittelpunkt des Bilds; Seitenlänge des Bilds aus der Höhe
    bf, rf, rv, hf = BOARD["brust_f"], BOARD["ruecken_f"], BOARD["ruecken_versal"], BOARD["hose_f"]
    brust_h = bf["hoehe"] * W
    brust = {"teil": "shirt", "ziel": (bf["quer"] * W, oeffnung["vorn"].z - buendchen - bf["unter_buendchen"] * W),
             "blick": (0.0, -1.0, 0.0), "teile": ("rumpf",), "tiefe": 0.08}
    # Rücken (D-459): Versalhöhe der Wortmarke wie auf dem Board, F in der Proportion des Startbilds
    # (`RUECKEN_LOGO`); Mitte des Blocks (F, Abstand, Wortmarke) an der Stelle des Boards. Das Bild hat den
    # Block senkrecht mittig, seine Mitte ist also die Mitte des Bilds
    versal = rf["hoehe"] * W / rv["f"]
    rl = RUECKEN_LOGO
    ruecken_h = rl["f"] * versal
    seite_r = RUECKEN_SEITE * versal
    mitte_r = oeffnung["hinten"].z - buendchen - rf["oben"] * W - (rv["f"] + rv["abstand"] + 1.0) / 2 * versal
    f_oben_unter = oeffnung["hinten"].z - buendchen - (mitte_r + (rl["f"] + rl["abstand"] + 1.0) / 2 * versal)
    ruecken = {"teil": "shirt", "ziel": (0.0, mitte_r), "blick": (0.0, 1.0, 0.0), "teile": ("rumpf",), "tiefe": 0.10}
    bein_h = hf["hoehe"] * schnitt["bein"]
    lage_f = schnitt["bein_t"] - (hf["ueber_saum"] * schnitt["bein"] + bein_h / 2) / schnitt["Lb"]
    beinvorn = {"teil": "hose", "winkel": hf["winkel"], "lage": lage_f, "teile": ("bein",), "x": 1, "tiefe": 0.05}
    if HOSE_F_WINKEL is not None:  # None: Stand bis D-460 (für Vorher-Bilder)
        beinvorn["genau"] = HOSE_F_WINKEL
    kordel_bilder = _kordel_bilder(schnitt)
    kordel = {"teil": "hose", "ziel": (0.0, schnitt["z_bund"] - BOARD["bund"] * schnitt["hose_laenge"]),
              "blick": (0.0, -1.0, 0.0), "teile": ("rumpf",), "tiefe": 0.06}
    rahmen = {"shirt": {"Brust": _rahmen(koerper, k, teile, brust, brust_h / F_ANTEIL),
                        "Ruecken": _rahmen(koerper, k, teile, ruecken, seite_r)},
              "hose": {"Beinvorn": _rahmen(koerper, k, teile, beinvorn, bein_h / F_ANTEIL)}}
    # Kordel: Bildmitte an der Unterkante des Bunds, die Schnüre hängen in der unteren Hälfte des Bilds
    rahmen["hose"]["Kordel"] = _rahmen(koerper, k, teile, kordel, kordel_bilder["seite"])
    hose = _teil("Shorts", koerper, skelett, f["hose"], ABSTAND["hose"], rahmen["hose"], weite=weite_hose,
                 attribute={"Streifen": streifen, "Bund": bund})
    shirt = _teil("Shirt", koerper, skelett, f["shirt"], ABSTAND["shirt"], rahmen["shirt"], kragen=f["hals"],
                  weite=weite_shirt)
    hose.data.materials.append(stoff_material("Shorts", SHORTS, [("Beinvorn", "f", {"f": LIME})],
                                              kordel=kordel_bilder, streifen=True,
                                              bund=BOARD["bund"] * schnitt["hose_laenge"]))
    shirt.data.materials.append(stoff_material("Shirt", TEE, [("Brust", "f", {"f": LIME}),
                                                              ("Ruecken", "ruecken", {"f": LIME, "wort": WEISS})]))
    kragen = _buendchen(shirt, koerper, skelett, oeffnung, stoff_material("Kragen", TEE, [], mit_saum=False))
    saumband = _saumband(shirt, koerper, skelett, schnitt, stoff_material("Saumband", TEE, [], mit_saum=False))
    teile_obj = [shirt, hose, kragen, saumband]
    bedeckt = [max(a, b) for a, b in zip(f["shirt"], f["hose"])]
    if mit_schuhen:
        import schuhe

        fuesse = schuhe.anziehen(koerper, skelett, k)
        teile_obj += fuesse["teile"]
        bedeckt = [max(a, b) for a, b in zip(bedeckt, fuesse["socke"])]
    attr = koerper.data.attributes.get("Bedeckt") or koerper.data.attributes.new("Bedeckt", "FLOAT", "POINT")
    for i, wert in enumerate(bedeckt):
        attr.data[i].value = wert
    anziehen.schnitt = schnitt
    anziehen.logos = {"brust_f": brust_h, "ruecken_f": ruecken_h, "ruecken_wortmarke": versal * WORTMARKE_BREITE,
                      "ruecken_f_oben_unter_buendchen": f_oben_unter, "bein_f": bein_h}
    anziehen.oeffnung = oeffnung
    # Mittelpunkte der Logos auf der Haut (Ruhehaltung, Raum des Skeletts), für Nahaufnahmen (D-453)
    anziehen.mitten = {name: r["P0"].copy() for teil in rahmen.values() for name, r in teil.items() if name != "Kordel"}
    return teile_obj


def haut_ausblenden(mat: bpy.types.Material) -> None:
    """Material des Körpers unter der Kleidung durchsichtig (Attribut „Bedeckt“ über 12 bis 16 mm)."""
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    bsdf = nodes["Principled BSDF"]
    attr = nodes.new("ShaderNodeAttribute")
    attr.attribute_name = "Bedeckt"
    attr.attribute_type = "GEOMETRY"
    rng = nodes.new("ShaderNodeMapRange")
    rng.clamp = True
    rng.inputs["From Min"].default_value = 0.012
    rng.inputs["From Max"].default_value = 0.016
    rng.inputs["To Min"].default_value = 1.0
    rng.inputs["To Max"].default_value = 0.0
    links.new(attr.outputs["Fac"], rng.inputs["Value"])
    links.new(rng.outputs["Result"], bsdf.inputs["Alpha"])


def f_streifen_abstand(hose: bpy.types.Object, schritte: int = 10) -> dict:
    """Shorts-F und Seitenstreifen (D-461): kürzester Abstand auf dem Stoff in der aktuellen Haltung (cm). Das Netz
    der Shorts ohne Glättung und Dicke (verformt, Welt) wird je Dreieck dicht abgetastet (`schritte` Teilungen je
    Kante, am F rund 2 mm), jeder Punkt eingeordnet wie im Shader: **F**, wo Deckkraft des Bilds an der UV-Stelle
    mal Maske (`MaskeBeinvorn`, 0,45 bis 0,55 weich) über 0,5 liegt; **Streifen**, wo das Feld „Streifen“
    positiv ist. Gemessen am linken Bein (dort sitzt das F) als gerade Strecke zwischen den Punkten; auf 2 cm
    weicht sie vom Weg über den gekrümmten Stoff (Radius rund 9 cm) um weniger als 0,1 mm ab. Gibt auch den
    nächsten Punkt des F und des Streifens zurück (für Nahaufnahmen)."""
    import numpy as np
    from mathutils import kdtree

    mesh = hose.data
    aus = [m for m in hose.modifiers if m.type in ("SUBSURF", "SOLIDIFY") and m.show_viewport]
    for m in aus:
        m.show_viewport = False
    deps = bpy.context.evaluated_depsgraph_get()
    ev = hose.evaluated_get(deps)
    em = ev.to_mesh()
    welt = [ev.matrix_world @ v.co for v in em.vertices]
    ev.to_mesh_clear()
    for m in aus:
        m.show_viewport = True
    streifen = [a.value for a in mesh.attributes["Streifen"].data]
    maske = [a.value for a in mesh.attributes["MaskeBeinvorn"].data]
    uv = [None] * len(mesh.vertices)
    for loop in mesh.loops:
        uv[loop.vertex_index] = tuple(mesh.uv_layers["LogoBeinvorn"].data[loop.index].uv)
    bild = _bilder("f")["f"]
    w, h = bild.size
    deck = np.array(bild.pixels[:], dtype=np.float32).reshape(h, w, 4)[..., 3]

    def deckkraft(u: float, v: float) -> float:
        if not (0.0 <= u <= 1.0 and 0.0 <= v <= 1.0):
            return 0.0
        x, y = u * (w - 1), v * (h - 1)
        x0, y0 = int(x), int(y)
        x1, y1 = min(x0 + 1, w - 1), min(y0 + 1, h - 1)
        fx, fy = x - x0, y - y0
        return float(deck[y0, x0] * (1 - fx) * (1 - fy) + deck[y0, x1] * fx * (1 - fy)
                     + deck[y1, x0] * (1 - fx) * fy + deck[y1, x1] * fx * fy)

    def weich(x: float) -> float:
        x = max(0.0, min(1.0, (x - 0.45) / 0.10))
        return x * x * (3 - 2 * x)

    mesh.calc_loop_triangles()
    f_pkte, s_pkte = [], []
    for tri in mesh.loop_triangles:
        a, b, c = tri.vertices
        if min(mesh.vertices[i].co.x for i in (a, b, c)) <= 0.0:
            continue
        mit_f = max(maske[a], maske[b], maske[c]) > 0.05
        mit_s = max(streifen[a], streifen[b], streifen[c]) > -0.02
        if not (mit_f or mit_s):
            continue
        for i in range(schritte + 1):
            for j in range(schritte + 1 - i):
                la, lb = i / schritte, j / schritte
                lc = 1.0 - la - lb
                p = welt[a] * la + welt[b] * lb + welt[c] * lc
                if mit_s and streifen[a] * la + streifen[b] * lb + streifen[c] * lc > 0.0:
                    s_pkte.append(p)
                if mit_f:
                    m = maske[a] * la + maske[b] * lb + maske[c] * lc
                    if m > 0.45:
                        uu = uv[a][0] * la + uv[b][0] * lb + uv[c][0] * lc
                        vv = uv[a][1] * la + uv[b][1] * lb + uv[c][1] * lc
                        if deckkraft(uu, vv) * weich(m) > 0.5:
                            f_pkte.append(p)
    if not f_pkte or not s_pkte:
        return {"abstand_cm": float("nan"), "f_punkte": len(f_pkte), "streifen_punkte": len(s_pkte)}
    baum = kdtree.KDTree(len(s_pkte))
    for i, p in enumerate(s_pkte):
        baum.insert(p, i)
    baum.balance()
    beste = min(((baum.find(p), p) for p in f_pkte), key=lambda x: x[0][2])
    (s_p, _, d), f_p = beste
    return {"abstand_cm": d * 100, "f_punkt": f_p, "streifen_punkt": s_p, "f_punkte": len(f_pkte),
            "streifen_punkte": len(s_pkte)}
