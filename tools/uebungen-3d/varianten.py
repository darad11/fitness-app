"""Körper der Figur (D-414, D-417, D-418, D-419; Kleidung nach dem Design-Board seit D-450).

**D** graue, neutrale Figur; **Cm** und **Cw** realistisch mit Haut, Haaren, Augen, Brauen und Wimpern
von MakeHuman, männlich und weiblich. Alle in der Kleidung nach dem Board (`kleidung.py`, mit Socken und
Schuhen aus `schuhe.py`) mit Kantenlicht (D-417). Die Figur der App ist Cm (`render.FIGUR`).

Bis D-449 gab es dazu Fassungen der Logos und Zonen (A1, A2, B) und Größen des Brust-F; mit dem Board
sind Farben, Lagen und Größen fest, Muskelzonen gibt es seit D-449 nicht mehr.
"""
from __future__ import annotations

import kleidung
import realistisch
import szene

VARIANTEN = {
    "D": {"titel": "D · grau, neutral", "form": "neutral", "aussehen": "grau"},
    "Cm": {"titel": "C · männlich, MakeHuman", "form": "maennlich", "aussehen": "real"},
    "Cw": {"titel": "C · weiblich, MakeHuman", "form": "weiblich", "aussehen": "real"},
}


def ausstatten(uebung, schluessel: str) -> list:
    """Materialien, Kleidung, Socken, Schuhe, Haut, Augen und Haare an die gebaute Übung (`uebung.bauen()`)."""
    v = VARIANTEN[schluessel]
    k, sk = uebung.koerper, uebung.skelett
    uebung.kantenlicht = True
    k.data.materials.clear()
    teile = kleidung.anziehen(k, sk, mit_schuhen=getattr(uebung, "schuhe", True))
    if v["aussehen"] == "real":
        teile += realistisch.ausstatten(k, sk, k.name, v["form"])
    else:
        k.data.materials.append(szene.koerper_material())
        teile += realistisch.augen_neutral(k, sk, k.name)
    kleidung.haut_ausblenden(k.data.materials[0])
    return teile
