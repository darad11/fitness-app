"""Fassungen der Figur zum Vergleich (D-414, D-417, D-418; Korrekturrunde D-419; ohne Zonen seit D-449).

Körper (Abschnitt 5 der Korrekturrunde): **D** graue, neutrale Figur; **Cm** und **Cw** realistisch mit
Haut, Haaren, Augen, Brauen und Wimpern von MakeHuman, männlich und weiblich. Alle in der FORM-Kleidung
(`kleidung.py`) mit Kantenlicht (D-417).

Fassungen: **A1** alle Logos hell Ton in Ton; **B** Logos in den Farben der Kollektion (vorn hell, hinten
und am Bein Lime). Muskelzonen gibt es seit D-449 in keiner Fassung mehr (bis D-448: A1 mit Zonen in
Lime, A2 mit gedämpften Zonen). Schlüssel `<Körper>-<Fassung>`, z. B. `D-A1`, `Cm-B`; dazu `D-A1-35` und
`D-A1-45` (Brust-F 3,5 und 4,5 cm statt 4 cm) für den Größenvergleich.
"""
from __future__ import annotations

import kleidung
import realistisch
import szene

KOERPER = {
    "D": {"titel": "D · grau, neutral", "form": "neutral", "aussehen": "grau"},
    "Cm": {"titel": "C · männlich, MakeHuman", "form": "maennlich", "aussehen": "real"},
    "Cw": {"titel": "C · weiblich, MakeHuman", "form": "weiblich", "aussehen": "real"},
}
ALLE_HELL = {"brust": "hell", "ruecken": "hell", "bein": "hell"}
FASSUNGEN = {
    "A1": {"titel": "A1 · Logos hell", "logos": ALLE_HELL},
    "B": {"titel": "B · Logos Kollektion", "logos": kleidung.KOLLEKTION},
}
VARIANTEN = {}
for kk, koerper in KOERPER.items():
    for fk, fassung in FASSUNGEN.items():
        VARIANTEN[f"{kk}-{fk}"] = {**koerper, **fassung, "titel": f"{koerper['titel']} · {fassung['titel']}"}
    for cm in (35, 45):
        VARIANTEN[f"{kk}-A1-{cm}"] = {**VARIANTEN[f"{kk}-A1"], "brust_hoehe": cm / 1000,
                                      "titel": f"{koerper['titel']} · A1, Brust-F {cm / 10:.1f} cm".replace(".", ",")}


def ausstatten(uebung, schluessel: str) -> list:
    """Materialien, Kleidung, Haut, Augen und Haare an die gebaute Übung (`uebung.bauen()`)."""
    v = VARIANTEN[schluessel]
    k, sk = uebung.koerper, uebung.skelett
    uebung.kantenlicht = True
    k.data.materials.clear()
    teile = kleidung.anziehen(k, sk, v["logos"], v.get("brust_hoehe"))
    if v["aussehen"] == "real":
        teile += realistisch.ausstatten(k, sk, k.name, v["form"])
    else:
        k.data.materials.append(szene.koerper_material())
        teile += realistisch.augen_neutral(k, sk, k.name)
    kleidung.haut_ausblenden(k.data.materials[0])
    return teile
