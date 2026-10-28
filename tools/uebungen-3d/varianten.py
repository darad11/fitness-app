"""Varianten der Figur zur Probe (D-414, Feinschliff D-417, C mit MakeHuman-Dateien D-418).

A  geschlechtsneutral und athletisch, grau mit Lime-Zonen (wie bisher)
B  männlich und athletisch, grau mit Lime-Zonen
C  realistisch mit Haut, Haaren, Augen, Augenbrauen und Wimpern von MakeHuman, männlich und weiblich,
   in FORM-Kleidung; je mit Lime-Zonen auf der Kleidung und ohne Zonen
D  die graue Figur (A) in FORM-Kleidung, mit Lime-Zonen auf der Kleidung und ohne Zonen

Entscheidung des Produktinhabers vom 28.10.2026: D mit Zonen. Zum Feinschliff Fassungen mit dem
FORM-F in Lime oder hell Ton in Ton (`logo`), ohne Kantenlicht (`kantenlicht`, Stand bis D-416) und
mit dem Tee in Graphit statt Nacht (`tee`). Körperformen aus `koerperform.py`, Kleidung aus
`kleidung.py`, Haut, Augen, Brauen, Wimpern und Haare aus `realistisch.py`. Alle Varianten: sichtbar
trainiert, natürliche Proportionen.
"""
from __future__ import annotations

import kleidung
import realistisch
import szene

VARIANTEN = {
    "A": {"titel": "A · neutral, grau, Zonen", "form": "neutral", "aussehen": "grau", "kleidung": False, "zonen": True},
    "B": {"titel": "B · männlich, grau, Zonen", "form": "maennlich", "aussehen": "grau", "kleidung": False, "zonen": True},
    "C-m-z": {"titel": "C · männlich, MakeHuman, Zonen", "form": "maennlich", "aussehen": "real", "kleidung": True, "zonen": True},
    "C-m": {"titel": "C · männlich, MakeHuman", "form": "maennlich", "aussehen": "real", "kleidung": True, "zonen": False},
    "C-w-z": {"titel": "C · weiblich, MakeHuman, Zonen", "form": "weiblich", "aussehen": "real", "kleidung": True, "zonen": True},
    "C-w": {"titel": "C · weiblich, MakeHuman", "form": "weiblich", "aussehen": "real", "kleidung": True, "zonen": False},
    "D-z": {"titel": "D · Zonen, F in Lime, Kantenlicht", "form": "neutral", "aussehen": "grau", "kleidung": True, "zonen": True},
    "D-z-hell": {"titel": "D · Zonen, F hell Ton in Ton", "form": "neutral", "aussehen": "grau", "kleidung": True, "zonen": True,
                 "logo": "hell"},
    "D-z-ohne-kante": {"titel": "D · Zonen, F in Lime, ohne Kantenlicht (bisher)", "form": "neutral", "aussehen": "grau",
                       "kleidung": True, "zonen": True, "kantenlicht": False},
    "D-z-graphit": {"titel": "D · Zonen, Tee in Graphit", "form": "neutral", "aussehen": "grau", "kleidung": True, "zonen": True,
                    "tee": kleidung.GRAPHIT},
    "D": {"titel": "D · Kleidung ohne Zonen", "form": "neutral", "aussehen": "grau", "kleidung": True, "zonen": False},
}


def ausstatten(uebung, schluessel: str) -> list:
    """Materialien, Kleidung, Haut, Augen und Haare an die gebaute Übung (`uebung.bauen()`); merkt an
    der Übung, ob das Kantenlicht gesetzt wird (`render.kamera`)."""
    v = VARIANTEN[schluessel]
    k, sk = uebung.koerper, uebung.skelett
    uebung.kantenlicht = v.get("kantenlicht", True)
    teile = []
    k.data.materials.clear()
    if v["kleidung"]:
        teile += kleidung.anziehen(k, sk, v["zonen"], v.get("logo", "lime"), v.get("tee", kleidung.NACHT))
    if v["aussehen"] == "real":
        teile += realistisch.ausstatten(k, sk, k.name, v["form"], v["zonen"])
    else:
        mat = szene.koerper_material() if v["zonen"] else szene.matt("Koerper", szene.KOERPER, 0.72)
        k.data.materials.append(mat)
    if v["kleidung"]:
        kleidung.haut_ausblenden(k.data.materials[0])
    return teile
