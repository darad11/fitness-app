"""Gesicht der personalisierten Variante „C männlich – Personalisiert“ (Korrekturrunde 4, D-437, D-438).

Hier liegen nur Reglerwerte und Konfiguration: die Gesichtsregler von MakeHuman (CC0, Formziele aus
MPFB2 wie in `koerperform.py`), Frisur, Brauen, Bart und Hautton. Fotos, daraus erkannte
Landmarken, Texturen und Vorschauen bleiben außerhalb des Repositorys (D-437). Die Werte entstehen
mit `gesicht_anpassen.py` aus Maßen der Fotos (`gesicht_masse.py`) und werden hier eingetragen; ein
Pfad in `GESICHT_REGLER` (Umgebungsvariable) überschreibt sie zum Probieren.

Jeder Regler läuft von −1 bis 1 wie in MakeHuman: negative Werte gewichten das `min`-Ziel, positive
das `max`-Ziel (`modeling_modifiers.json` von MakeHuman); Regler mit einem einzigen Ziel laufen
von 0 bis 1. Paare links/rechts werden gemeinsam gesetzt (symmetrisches Gesicht; die Fotos geben keine
belastbare Asymmetrie her).
"""
from __future__ import annotations

import json
import os
from pathlib import Path

import numpy as np

import koerperform

# Regler → (Ziele, min, max); Ziele als Tupel bei Paaren links/rechts; min/max None bei einem Ziel 0..1
REGLER = {
    "kopf-breite": (("head/head-scale-horiz",), "decr", "incr"),
    "kopf-hoehe": (("head/head-scale-vert",), "decr", "incr"),
    "kopf-tiefe": (("head/head-scale-depth",), "decr", "incr"),
    "kopf-rund": (("head/head-round",), None, None),
    "kopf-oval": (("head/head-oval",), None, None),
    "kopf-eckig": (("head/head-square",), None, None),
    "kopf-fett": (("head/head-fat",), "decr", "incr"),
    "stirn-hoehe": (("forehead/forehead-scale-vert",), "decr", "incr"),
    "stirn-vor": (("forehead/forehead-trans",), "backward", "forward"),
    "brauen-hoehe": (("eyebrows/eyebrows-trans",), "down", "up"),
    "brauen-winkel": (("eyebrows/eyebrows-angle",), "down", "up"),
    "augen-groesse": (("eyes/r-eye-scale", "eyes/l-eye-scale"), "decr", "incr"),
    "augen-hoehe": (("eyes/r-eye-height2", "eyes/l-eye-height2"), "decr", "incr"),
    "augen-abstand": (("eyes/r-eye-trans", "eyes/l-eye-trans"), "in", "out"),
    "augen-lage": (("eyes/r-eye-trans", "eyes/l-eye-trans"), "down", "up"),
    "nase-laenge": (("nose/nose-scale-vert",), "decr", "incr"),
    "nase-breite": (("nose/nose-scale-horiz",), "decr", "incr"),
    "nase-tiefe": (("nose/nose-scale-depth",), "decr", "incr"),
    "nase-fluegel": (("nose/nose-nostrils-width",), "decr", "incr"),
    "nase-spitze-breite": (("nose/nose-point-width",), "decr", "incr"),
    "nase-lage": (("nose/nose-trans",), "down", "up"),
    "nase-huegel": (("nose/nose-hump",), "decr", "incr"),
    "nase-spitze": (("nose/nose-point",), "down", "up"),
    "mund-breite": (("mouth/mouth-scale-horiz",), "decr", "incr"),
    "mund-hoehe": (("mouth/mouth-scale-vert",), "decr", "incr"),
    "mund-lage": (("mouth/mouth-trans",), "down", "up"),
    "mund-tiefe": (("mouth/mouth-scale-depth",), "decr", "incr"),
    "oberlippe-hoehe": (("mouth/mouth-upperlip-height",), "decr", "incr"),
    "unterlippe-hoehe": (("mouth/mouth-lowerlip-height",), "decr", "incr"),
    "kinn-breite": (("chin/chin-width",), "decr", "incr"),
    "kinn-hoehe": (("chin/chin-height",), "decr", "incr"),
    "kinn-vor": (("chin/chin-prominent",), "decr", "incr"),
    "kiefer-bogen": (("chin/chin-bones",), "decr", "incr"),
    "kiefer-fallen": (("chin/chin-jaw-drop",), "decr", "incr"),
    "wangen-knochen": (("cheek/r-cheek-bones", "cheek/l-cheek-bones"), "decr", "incr"),
    "wangen-volumen": (("cheek/r-cheek-volume", "cheek/l-cheek-volume"), "decr", "incr"),
    "wangen-lage": (("cheek/r-cheek-trans", "cheek/l-cheek-trans"), "down", "up"),
    "ohren-groesse": (("ears/r-ear-scale", "ears/l-ear-scale"), "decr", "incr"),
}
# Regler, die die Ausgleichsrechnung aus der Vorderansicht bestimmt; die übrigen (Tiefe, Profil) werden
# aus der Silhouette des Profils gesetzt
REGLER_VORN = [
    "kopf-breite", "kopf-hoehe", "kopf-rund", "kopf-oval", "kopf-eckig", "kopf-fett", "stirn-hoehe",
    "brauen-hoehe", "brauen-winkel", "augen-groesse", "augen-hoehe", "augen-abstand", "augen-lage",
    "nase-laenge", "nase-breite", "nase-fluegel", "nase-lage", "mund-breite", "mund-hoehe", "mund-lage",
    "oberlippe-hoehe", "unterlippe-hoehe", "kinn-breite", "kinn-hoehe", "kiefer-bogen", "kiefer-fallen",
    "wangen-knochen", "wangen-volumen", "wangen-lage",
]

# Maß → Regler, das die Anpassung Paar für Paar einstellt (`gesicht_anpassen.py anpassen`): je Schritt
# die Empfindlichkeit des Reglers auf sein Maß, Änderung begrenzt, dann alle Maße neu gemessen
PAARE = [
    ("gesicht_hoehe_breite", "kopf-hoehe"), ("nase_laenge", "nase-laenge"), ("nase_breite", "nase-breite"),
    ("mund_breite", "mund-breite"), ("oberlippe", "oberlippe-hoehe"), ("unterlippe", "unterlippe-hoehe"),
    ("auge_breite", "augen-groesse"), ("auge_hoehe", "augen-hoehe"), ("augen_innen", "augen-abstand"),
    ("braue_hoehe", "brauen-hoehe"), ("brauen_winkel", "brauen-winkel"), ("kinn_hoehe", "kinn-hoehe"),
    ("mundwinkel", "mund-lage"), ("wangenknochen", "wangen-knochen"),
]

# Charakterregler nach Augenschein der Fotos (D-438), nicht aus Maßen: Die Verhältnisse der Landmarken
# erfassen Fülle, Rundung und Kiefer kaum, und die Ausgleichsrechnung über alle Maße trieb sie an die
# Grenzen (hageres Gesicht). Begründung je Wert im Bericht; alle Werte vorsichtig gewählt.
FEST = {
    "kopf-fett": 0.5,  # volles Gesicht, weiche Wangen
    "wangen-volumen": 0.5,
    "kopf-rund": 0.35,  # eher rundes als längliches Gesicht
    "kiefer-bogen": 0.4,  # kräftiger, runder Kiefer
    "kiefer-fallen": 0.3,
    "kinn-breite": 0.9,  # breites, rundes Kinn
    "kinn-vor": 0.3,  # Kinn im Profil deutlich
    "nase-fluegel": 0.4,  # breite Nasenflügel
    "nase-spitze-breite": 0.4,  # runde, breite Nasenspitze
    "nase-tiefe": 0.6,  # gerade, deutlich hervortretende Nase (Profilfoto am Nasenrand beschnitten, darum nach Augenschein)
    "mund-tiefe": -0.3,  # Lippen voll, aber nicht vorgewölbt
    "stirn-hoehe": -0.6,  # niedriger Haaransatz
    "stirn-vor": -0.15,
    "augen-lage": -0.1,
}
# Grenzen für Paare, bei denen die Landmarken mehr zeigen als die Fotos hergeben (Lippen im Selfie)
GRENZEN = {"unterlippe-hoehe": (-1.0, 0.5), "oberlippe-hoehe": (-1.0, 0.5), "augen-hoehe": (-1.0, 0.2), "augen-groesse": (-1.0, 0.3)}

# Reglerwerte der personalisierten Variante (D-438): FEST plus das Ergebnis der Anpassung
PERSOENLICH: dict[str, float] = {**FEST, **{
    "kopf-hoehe": -0.387,
    "nase-laenge": 0.531,
    "nase-breite": -0.468,
    "mund-breite": -0.324,
    "oberlippe-hoehe": 0.217,
    "unterlippe-hoehe": 0.5,
    "augen-groesse": -0.057,
    "augen-hoehe": -1.0,
    "augen-abstand": -0.067,
    "brauen-hoehe": 1.0,
    "brauen-winkel": 1.0,
    "kinn-hoehe": 1.0,
    "mund-lage": -1.0,
    "wangen-knochen": 0.679,
}}


def ziele(regler: dict[str, float]) -> dict[str, float]:
    """Formziele (Pfad relativ zu `targets/`) mit Gewicht aus Reglerwerten."""
    erg: dict[str, float] = {}
    for name, wert in regler.items():
        if name not in REGLER or abs(wert) < 1e-6:
            continue
        pfade, mn, mx = REGLER[name]
        for pfad in pfade:
            if mn is None:
                if wert > 0:
                    erg[pfad] = erg.get(pfad, 0.0) + min(1.0, wert)
            else:
                ziel = f"{pfad}-{mx if wert > 0 else mn}"
                erg[ziel] = erg.get(ziel, 0.0) + min(1.0, abs(wert))
    return erg


def alle_ziele() -> list[str]:
    liste = []
    for pfade, mn, mx in REGLER.values():
        for pfad in pfade:
            liste += [pfad] if mn is None else [f"{pfad}-{mn}", f"{pfad}-{mx}"]
    return liste


def regler_werte() -> dict[str, float]:
    pfad = os.environ.get("GESICHT_REGLER")
    if pfad:
        return {k: float(v) for k, v in json.loads(Path(pfad).read_text(encoding="utf-8")).items()}
    return dict(PERSOENLICH)


def form_persoenlich() -> koerperform.Form:
    """Körper wie C männlich (D-413), Gesicht nach den Reglern."""
    m = koerperform.MAENNLICH
    return koerperform.Form("persoenlich", m.geschlecht, m.muskeln, m.gewicht, m.proportionen, m.brust, m.festigkeit,
                            m.groesse, ziele(regler_werte()))


def hole() -> None:
    """Fehlende Gesichtsziele laden (CC0, MPFB2)."""
    import urllib.request

    for pfad in alle_ziele():
        ziel = koerperform._datei(pfad)
        if not ziel.exists():
            ziel.parent.mkdir(parents=True, exist_ok=True)
            urllib.request.urlretrieve(f"{koerperform.URL}/{pfad}.target.gz", ziel)


# ---------------------------------------------------------------------- Silhouette im Profil


def silhouette_marken(vorn: np.ndarray, hoehe: np.ndarray, drucken: bool = False) -> dict[str, float]:
    """Marken einer Profilsilhouette: `vorn` = wie weit die Kontur je Zeile nach vorn reicht, `hoehe`
    absteigend (Stirn zuerst). Nasenspitze = vorderster Punkt; Nasenwurzel = tiefster Punkt darüber;
    Subnasale = tiefster Punkt im Viertel darunter; Kinn = vorderster Punkt im unteren Drittel.
    Verhältnisse zur Höhe Nasenwurzel → Kinn."""
    vorn, hoehe = np.asarray(vorn, float), np.asarray(hoehe, float)
    i_nase = int(np.argmax(vorn))
    i_wurzel = int(np.argmin(vorn[: i_nase + 1])) if i_nase > 0 else 0
    rest = vorn[i_nase:]
    i_sub = i_nase + int(np.argmin(rest[: max(2, len(rest) // 4)]))
    start = i_sub + (len(vorn) - i_sub) // 3
    i_kinn = start + int(np.argmax(vorn[start:])) if start < len(vorn) else len(vorn) - 1
    h = abs(hoehe[i_wurzel] - hoehe[i_kinn]) or 1.0
    erg = {
        "nase_vorsprung": (vorn[i_nase] - vorn[i_wurzel]) / h,
        "nase_laenge_profil": abs(hoehe[i_wurzel] - hoehe[i_sub]) / h,
        "kinn_vorsprung": (vorn[i_kinn] - vorn[i_sub]) / h,
        "stirn_vorsprung": (vorn[0] - vorn[i_wurzel]) / h,
        "wurzel_tiefe": (vorn[i_nase] - vorn[i_wurzel]) / (vorn[i_nase] - min(vorn[i_wurzel], vorn[0]) or 1.0),
    }
    if drucken:
        print("Marken (Zeile, vorn, Höhe):", {k: (int(i), round(float(vorn[i]), 4), round(float(hoehe[i]), 4))
                                              for k, i in (("stirn", 0), ("wurzel", i_wurzel), ("nase", i_nase), ("subnasale", i_sub), ("kinn", i_kinn))})
        print("Verhältnisse:", {k: round(float(v), 3) for k, v in erg.items()})
    return erg


# ---------------------------------------------------------------------- Bart und Leberfleck


def _marke(V: np.ndarray, zuordnung: list, n: int) -> np.ndarray:
    """Lage der Landmarke n auf dem Netz; Landmarken ohne Zuordnung (am Rand des Gesichts daneben
    projiziert) nehmen die nächste zugeordnete Landmarke der Gesichtskontur."""
    z = zuordnung[n]
    if z is None:
        kontur = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152,
                  148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109]
        i = kontur.index(n) if n in kontur else 0
        for schritt in (1, -1, 2, -2, 3, -3):
            z = zuordnung[kontur[(i + schritt) % len(kontur)]]
            if z is not None:
                break
    return sum(w * V[e] for e, w in zip(z["ecken"], z["gewichte"]))


BART = {"dicht": 1.0, "wange": 0.95, "koteletten": 1.0, "hals": 0.045, "wangenlinie_ueber_mund": 0.034, "wangenlinie_am_ohr": 0.02}
BRAUE = {"halbbreite": 0.0035, "rand": 0.003}


def bart_gewichte(V: np.ndarray, zuordnung: list) -> np.ndarray:
    """Bart je Eckpunkt (0 bis 1) aus Marken des Gesichts: Oberlippe, Kinn und Kiefer dicht, Wangen
    unterhalb einer Linie vom Ohr zum Mundwinkel lichter, Koteletten bis zum Ohr, Hals bis 4,5 cm
    unter dem Kinn; Lippen, Augen, Nase und alles über der Wangenlinie frei."""
    L = {n: _marke(V, zuordnung, n) for n in (0, 2, 17, 61, 291, 152, 58, 288, 234, 454, 172, 397)}
    z_nase, z_kinn = L[2][2], L[152][2]
    z_mund = (L[61][2] + L[291][2]) / 2
    halb = abs(L[61][0] - L[291][0]) / 2
    w = np.zeros(len(V))
    for i, (x, y, z) in enumerate(V):
        if z > z_nase - 0.004 or z < z_kinn - BART["hals"] or y > L[234][1] + 0.012:
            continue
        seite = 234 if x < 0 else 454
        mund = 61 if x < 0 else 291
        E, M = L[seite], L[mund]
        # Lippen frei (nur das Lippenrot, knapp innerhalb der Mundwinkel)
        if abs(x) < halb - 0.003 and L[17][2] - 0.002 < z < L[0][2] - 0.002 and y < M[1] + 0.012:
            continue
        if z >= z_mund - 0.008:
            # Oberlippe/Mundwinkel: Schnurrbart dicht, seitlich die Wangenlinie
            if abs(x) < halb + 0.018:
                w[i] = BART["dicht"]
            else:
                M2 = M + np.array([0.0, 0.0, BART["wangenlinie_ueber_mund"]])
                E2 = E + np.array([0.0, 0.0, BART["wangenlinie_am_ohr"]])
                t = (y - M2[1]) / ((E2[1] - M2[1]) or 1e-6)
                z_linie = M2[2] + (E2[2] - M2[2]) * min(1.0, max(0.0, t))
                if z < z_linie:
                    w[i] = BART["wange"] if y < E[1] - 0.02 else BART["koteletten"]
        else:
            w[i] = BART["dicht"] if y < E[1] - 0.01 else BART["koteletten"]
        if z < z_kinn - BART["hals"] + 0.012:  # Übergang am Hals
            w[i] *= (z - (z_kinn - BART["hals"])) / 0.012
    return w


def brauen_gewichte(V: np.ndarray, zuordnung: list) -> np.ndarray:
    """Dichte, dunkle Brauen als Zone der Haut (D-438): Band um die Brauenlinie der Landmarken (Mitte aus
    oberem und unterem Rand), halbe Breite `BRAUE["halbbreite"]`, weicher Rand."""
    oben = {"r": (70, 63, 105, 66, 107), "l": (300, 293, 334, 296, 336)}
    unten = {"r": (46, 53, 52, 65, 55), "l": (276, 283, 282, 295, 285)}
    w = np.zeros(len(V))
    z_max = max(_marke(V, zuordnung, n)[2] for n in oben["r"]) + 0.03
    z_min = min(_marke(V, zuordnung, n)[2] for n in unten["r"]) - 0.03
    for seite in ("r", "l"):
        linie = [(_marke(V, zuordnung, a) + _marke(V, zuordnung, b)) / 2 for a, b in zip(oben[seite], unten[seite])]
        for i, (x, y, z) in enumerate(V):
            if z < z_min or z > z_max or y > linie[0][1] + 0.03:
                continue
            best = 1.0
            for a, b in zip(linie[:-1], linie[1:]):
                d = b - a
                t = min(1.0, max(0.0, float(np.dot(V[i] - a, d) / (np.dot(d, d) or 1e-9))))
                best = min(best, float(np.linalg.norm(V[i] - (a + d * t))))
            w[i] = max(w[i], float(np.clip((BRAUE["halbbreite"] + BRAUE["rand"] - best) / BRAUE["rand"], 0.0, 1.0)))
    return w


def fleck_gewichte(V: np.ndarray, zuordnung: list, seite: str = "links", radius: float = 0.0035) -> np.ndarray:
    """Kleiner Leberfleck neben der Nase (vorsichtige Annäherung: Lage seitlich des Nasenflügels)."""
    n = 358 if seite == "links" else 129
    p = _marke(V, zuordnung, n) + np.array([0.013 if seite == "links" else -0.013, -0.004, -0.004])
    d = np.linalg.norm(V - p, axis=1)
    return np.clip(1.0 - d / radius, 0.0, 1.0)


# Die personalisierte Form steht wie die übrigen unter ihrem Namen bereit (`render.baue`, `varianten`)
koerperform.FORMEN["persoenlich"] = form_persoenlich()
