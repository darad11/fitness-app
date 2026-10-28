"""Körperform aus den Formzielen von MakeHuman (D-413, D-414).

MakeHuman beschreibt einen Körper über Makro-Werte zwischen 0 und 1: Geschlecht (0 weiblich,
1 männlich), Alter (0,5 = 25 Jahre), Muskeln, Gewicht, Proportionen, Brustgröße und -festigkeit,
Herkunft (je ein Drittel). Jeder Wert verteilt sich auf Faktoren wie `male`, `averagemuscle` oder
`maxweight`; ein Formziel (Datei mit Verschiebungen je Eckpunkt) zählt mit dem Produkt der Faktoren
in seinem Namen, etwa `universal-male-young-maxmuscle-minweight` = male · young · maxmuscle ·
minweight. So rechnet auch MakeHuman (`apps/humanmodifier.py`, `lib/targets.py`, `apps/human.py`).

Die Formziele stammen aus dem Repository von MPFB2 (`makehumancommunity/mpfb2`,
`src/mpfb/data/targets/`), CC0 1.0 wie das Grundmodell (`LICENSE.md` Abschnitt C: „Targets and
modifiers … released under CC0 1.0 Universal“). Sie liegen nicht im Repository; `render.py --hole`
lädt die benötigten Dateien nach `tools/uebungen-3d/quelle/ziele/`.

Ersetzt die frühere Stauchung der Brustknochen (`Rig.brust_flach`), die die Brust nach innen
wölbte (D-413).
"""
from __future__ import annotations

import gzip
import urllib.request
from dataclasses import dataclass, field
from pathlib import Path

QUELLE = Path(__file__).resolve().parent / "quelle" / "ziele"
URL = "https://raw.githubusercontent.com/makehumancommunity/mpfb2/master/src/mpfb/data/targets"
SKALA = 0.1  # MakeHuman rechnet in Dezimetern


@dataclass(frozen=True)
class Form:
    """Makro-Werte wie in MakeHuman (0 bis 1, Vorgabe 0,5)."""

    name: str
    geschlecht: float = 0.5  # 0 weiblich, 1 männlich
    muskeln: float = 0.5
    gewicht: float = 0.5
    proportionen: float = 0.5  # 1 = ideal, 0 = ungewöhnlich
    brust: float = 0.5  # Brustgröße (nur weiblicher Anteil)
    festigkeit: float = 0.5
    groesse: float = 0.5
    zusatz: dict[str, float] = field(default_factory=dict)  # einzelne Formziele mit Gewicht


def _drei(wert: float, klein: str, mitte: str, gross: str) -> dict[str, float]:
    """Wert 0..1 auf drei Faktoren wie `_setMuscleVals` und Verwandte in MakeHuman (`apps/human.py`):
    unter 0,5 wächst `klein`, über 0,5 `gross`, der Rest bleibt bei `mitte`."""
    hoch = max(0.0, wert * 2 - 1)
    tief = max(0.0, 1 - wert * 2)
    return {klein: tief, gross: hoch, mitte: 1 - (hoch + tief)}


def faktoren(f: Form) -> dict[str, float]:
    w = {"male": f.geschlecht, "female": 1 - f.geschlecht, "young": 1.0, "old": 0.0, "child": 0.0, "baby": 0.0,
         "african": 1 / 3, "asian": 1 / 3, "caucasian": 1 / 3}
    w.update(_drei(f.muskeln, "minmuscle", "averagemuscle", "maxmuscle"))
    w.update(_drei(f.gewicht, "minweight", "averageweight", "maxweight"))
    w.update(_drei(f.groesse, "minheight", "averageheight", "maxheight"))
    w.update(_drei(f.brust, "mincup", "averagecup", "maxcup"))
    w.update(_drei(f.festigkeit, "minfirmness", "averagefirmness", "maxfirmness"))
    w.update(_drei(f.proportionen, "uncommonproportions", "regularproportions", "idealproportions"))
    return w


def ziele(f: Form) -> list[tuple[str, float]]:
    """Alle Formziele mit Gewicht ungleich 0 (Pfad relativ zu `targets/`)."""
    w = faktoren(f)
    liste: list[tuple[str, list[str]]] = []
    for g in ("male", "female"):
        for h in ("african", "asian", "caucasian"):
            liste.append((f"macrodetails/{h}-{g}-young", [h, g, "young"]))
        for m in ("minmuscle", "averagemuscle", "maxmuscle"):
            for k in ("minweight", "averageweight", "maxweight"):
                liste.append((f"macrodetails/universal-{g}-young-{m}-{k}", [g, "young", m, k]))
                for hoehe in ("minheight", "maxheight"):
                    liste.append((f"macrodetails/height/{g}-young-{m}-{k}-{hoehe}", [g, "young", m, k, hoehe]))
                for p in ("uncommonproportions", "idealproportions"):
                    liste.append((f"macrodetails/proportions/{g}-young-{m}-{k}-{p}", [g, "young", m, k, p]))
                if g == "female":
                    for c in ("mincup", "maxcup"):
                        for fe in ("minfirmness", "averagefirmness", "maxfirmness"):
                            liste.append((f"breast/{g}-young-{m}-{k}-{c}-{fe}", [g, "young", m, k, c, fe]))
    erg = []
    for pfad, teile in liste:
        gewicht = 1.0
        for t in teile:
            gewicht *= w[t]
        if gewicht > 1e-6:
            erg.append((pfad, gewicht))
    erg += list(f.zusatz.items())
    return erg


def _datei(pfad: str) -> Path:
    return QUELLE / f"{pfad}.target.gz"


def hole(formen: list[Form]) -> None:
    """Fehlende Formziele laden (CC0, raw.githubusercontent.com)."""
    for f in formen:
        for pfad, _ in ziele(f):
            ziel = _datei(pfad)
            if not ziel.exists():
                ziel.parent.mkdir(parents=True, exist_ok=True)
                urllib.request.urlretrieve(f"{URL}/{pfad}.target.gz", ziel)


def _lies(pfad: str) -> list[tuple[int, float, float, float]]:
    zeilen = []
    with gzip.open(_datei(pfad), "rt", encoding="utf-8") as datei:
        for zeile in datei:
            teile = zeile.split()
            if len(teile) == 4 and not zeile.startswith("#"):
                zeilen.append((int(teile[0]), float(teile[1]), float(teile[2]), float(teile[3])))
    return zeilen


def wende_an(punkte: list, f: Form) -> None:
    """Verschiebt die Eckpunkte des Grundmodells (Blender-Koordinaten, Meter, z oben) nach der Form;
    die Hilfspunkte für die Gelenke wandern mit, das Skelett passt sich so von selbst an."""
    for pfad, gewicht in ziele(f):
        for i, dx, dy, dz in _lies(pfad):
            p = punkte[i]
            p.x += gewicht * dx * SKALA
            p.y += gewicht * -dz * SKALA
            p.z += gewicht * dy * SKALA


# Varianten zur Probe (D-414): sichtbar trainiert, natürliche Proportionen, keine Bodybuilder-Optik.
NEUTRAL = Form("neutral", geschlecht=0.5, muskeln=0.7, gewicht=0.45, proportionen=0.75, brust=0.1, festigkeit=0.7)
MAENNLICH = Form("maennlich", geschlecht=1.0, muskeln=0.72, gewicht=0.45, proportionen=0.75)
WEIBLICH = Form("weiblich", geschlecht=0.0, muskeln=0.66, gewicht=0.42, proportionen=0.75, brust=0.4, festigkeit=0.7)
FORMEN = {f.name: f for f in (NEUTRAL, MAENNLICH, WEIBLICH)}
