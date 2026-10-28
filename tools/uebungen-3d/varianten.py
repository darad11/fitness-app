"""Varianten der Figur zur Probe (D-414).

A  geschlechtsneutral und athletisch, grau mit Lime-Zonen (wie bisher)
B  männlich und athletisch, grau mit Lime-Zonen
C  realistisch mit Haut, Haaren, Augen und Augenbrauen, männlich und weiblich, in FORM-Kleidung;
   je mit Lime-Zonen auf der Kleidung und ohne Zonen
D  die graue Figur (A) in FORM-Kleidung, mit Lime-Zonen auf der Kleidung und ohne Zonen

Körperformen aus `koerperform.py`, Kleidung aus `kleidung.py`, Haut, Augen und Haare aus
`realistisch.py`. Alle Varianten: sichtbar trainiert, natürliche Proportionen.
"""
from __future__ import annotations

import kleidung
import realistisch
import szene

VARIANTEN = {
    "A": {"titel": "A · neutral, grau, Zonen", "form": "neutral", "aussehen": "grau", "kleidung": False, "zonen": True},
    "B": {"titel": "B · männlich, grau, Zonen", "form": "maennlich", "aussehen": "grau", "kleidung": False, "zonen": True},
    "C-m-z": {"titel": "C · männlich, real, Zonen", "form": "maennlich", "aussehen": "real", "kleidung": True, "zonen": True},
    "C-m": {"titel": "C · männlich, real", "form": "maennlich", "aussehen": "real", "kleidung": True, "zonen": False},
    "C-w-z": {"titel": "C · weiblich, real, Zonen", "form": "weiblich", "aussehen": "real", "kleidung": True, "zonen": True},
    "C-w": {"titel": "C · weiblich, real", "form": "weiblich", "aussehen": "real", "kleidung": True, "zonen": False},
    "D-z": {"titel": "D · grau, Kleidung, Zonen", "form": "neutral", "aussehen": "grau", "kleidung": True, "zonen": True},
    "D": {"titel": "D · grau, Kleidung", "form": "neutral", "aussehen": "grau", "kleidung": True, "zonen": False},
}


def ausstatten(uebung, schluessel: str) -> list:
    """Materialien, Kleidung, Haut, Augen und Haare an die gebaute Übung (`uebung.bauen()`)."""
    v = VARIANTEN[schluessel]
    k, sk = uebung.koerper, uebung.skelett
    teile = []
    k.data.materials.clear()
    if v["kleidung"]:
        teile += kleidung.anziehen(k, sk, v["zonen"])
    if v["aussehen"] == "real":
        teile += realistisch.ausstatten(k, sk, k.name, v["form"], v["zonen"])
    else:
        mat = szene.koerper_material() if v["zonen"] else szene.matt("Koerper", szene.KOERPER, 0.72)
        k.data.materials.append(mat)
    if v["kleidung"]:
        kleidung.haut_ausblenden(k.data.materials[0])
    return teile
