#!/usr/bin/env python3
"""Blätter der Korrekturen vom 28.10.2026 (D-424): Standbilder in Fassung A1 mit Brust-F 4 cm (Kniebeuge
tiefste Position, Bankdrücken Ausgangs- und Endposition) für D, C männlich und C weiblich, dazu je Körper
Nahaufnahmen von Augen, Hals, Rücken mit Schriftzug, Shorts-Logo und dem Griff beim Bankdrücken von vorn
(Fußende), von der Seite und vom Kopfende, dazu der Griff in der Kniebeuge.

Ordner `<paket>/`: `bilder/<Körper>-A1-<Übung>-<Phase>.png` und `.json` (720 × 540, 40 Proben, aus
`tools/uebungen-3d/varianten_bilder.py`) und `nah/<Körper>-<Ansicht>.png` (480 px, `nahaufnahme.py`),
Ansichten `augen`, `hals`, `ruecken`, `shorts`, `griff-vorn`, `griff-seite`, `griff-kopf`, `griff-knie`.

    python3 tools/uebungen_korrektur_bild.py --paket /tmp/korrektur --ziel docs/screens/uebungen
    python3 tools/uebungen_korrektur_bild.py --paket /tmp/korrektur2 --runde 2   # D-428: C männlich, Griff, Kragen, Rückenlogo
    python3 tools/uebungen_korrektur_bild.py --paket /tmp/korrektur3 --runde 3   # D-433: vorher/nachher Griff, Kragen, Rückenlogo, Gesamt, Player
    python3 tools/uebungen_korrektur_bild.py --paket /tmp/korrektur4 --runde 4   # D-439: vorher/nachher Daumen, zweites Shorts-F, Player
    python3 tools/uebungen_korrektur_bild.py --paket /tmp/korrektur5 --runde 5   # D-443: vorher/nachher Daumen nach Handfoto, ein Shorts-F, Player
    python3 tools/uebungen_korrektur_bild.py --paket /tmp/korrektur6 --runde 6   # D-445: Daumen, zwei Hebel und Folgeänderung, Hand im Player
    python3 tools/uebungen_korrektur_bild.py --paket /tmp/kleidung --runde 7     # D-453: Kleidung nach dem Board, Handgelenk
    python3 tools/uebungen_korrektur_bild.py --paket /tmp/latziehen --runde 8   # D-455: Griffblatt Latziehen vorher/nachher
    python3 tools/uebungen_korrektur_bild.py --paket /tmp/schuh --runde 9       # D-460: Schuh und Rückenlogo, Player-Größe
    python3 tools/uebungen_korrektur_bild.py --paket /tmp/shorts --runde 10     # D-461: Shorts-F und Streifen, Abstand

Braucht Pillow (nur für dieses Werkzeug, nicht für die App); Gestaltung wie `uebungen_paket_bild.py`.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

HIER = Path(__file__).resolve().parent
sys.path.insert(0, str(HIER))

from PIL import Image, ImageDraw  # noqa: E402

from uebungen_paket_bild import GRUND, KOERPER, LEISE, MOMENTE, PLAYER_BREITE, THUMB, ausschnitt, gitter, kachel, schrift, speichern  # noqa: E402

NAH = [
    ("augen", "Augen", "Kniebeuge, Ausgang, von vorn"),
    ("hals", "Hals und Kragen", "Kniebeuge, tiefste Position, Kamera der App"),
    ("ruecken", "Rücken mit Schriftzug", "Latziehen, Endposition, von hinten"),
    ("shorts", "Shorts-Logo", "linkes Bein außen, von der Seite"),
    ("griff-vorn", "Griff Bankdrücken, von vorn", "vom Fußende, Ausgangsposition, linke Hand"),
    ("griff-seite", "Griff Bankdrücken, von der Seite", "schräg entlang der Stange, Scheiben ausgeblendet"),
    ("griff-kopf", "Griff Bankdrücken, vom Kopfende", "Blick des Trainierenden auf die Hand"),
    ("griff-knie", "Griff Kniebeuge, von der Seite", "hinten-seitlich, Scheiben ausgeblendet"),
]


def blatt_standbilder(paket: Path) -> "Image":
    """Zeilen = Körper, Spalten = Momente; je Moment derselbe Ausschnitt für alle Körper."""
    kisten = {}
    for u, p, _, _ in MOMENTE:
        kisten[(u, p)] = ausschnitt([paket / "bilder" / f"{k}-A1-{u}-{p}.png" for k, _ in KOERPER])
    kacheln = []
    for k, kt in KOERPER:
        for u, p, _, mt in MOMENTE:
            zeit = ""
            info = paket / "bilder" / f"{k}-A1-{u}.json"
            if info.exists():
                w = json.loads(info.read_text(encoding="utf-8"))
                s = w["bild_s"].get(p)
                if s is not None:
                    zeit = f"Renderzeit {s:.0f} s ({w['breite']} × {w['hoehe']}, {w['proben']} Proben)"
            kacheln.append(kachel(paket / "bilder" / f"{k}-A1-{u}-{p}.png", f"{kt} · {mt}", 480, 360, zeit, kisten[(u, p)]))
    return gitter(kacheln, 3, "1 · Standbilder · Fassung A1, Brust-F 4 cm",
                  "Augen, Zopf, Logos, Kragen und Griff korrigiert (D-421 bis D-423); Kamera wie in der App")


def blatt_nah(paket: Path, k: str, kt: str, nummer: int) -> "Image":
    kacheln = [kachel(paket / "nah" / f"{k}-{datei}.png", at, 380, 380, zusatz) for datei, at, zusatz in NAH]
    return gitter(kacheln, 4, f"{nummer} · Nahaufnahmen · {kt}", "Fassung A1, Brust-F 4 cm; links und rechts aus Sicht des Trägers")


NAH2 = [
    ("griff-vorn", "Griff Bankdrücken, von vorn", "vom Fußende, Ausgangsposition, linke Hand"),
    ("griff-seite", "Griff Bankdrücken, von der Seite", "entlang der Stange, Scheiben ausgeblendet"),
    ("griff-kopf", "Griff Bankdrücken, vom Kopfende", "Blick des Trainierenden, Scheiben ausgeblendet"),
    ("griff-oben", "Griff Bankdrücken, von oben", "senkrecht auf die Hand, Scheiben ausgeblendet"),
    ("kragen-45", "Kragen, tiefste Kniebeuge", "Kamera der App"),
    ("kragen-135", "Kragen, tiefste Kniebeuge, von hinten-seitlich", "Seite der Stange"),
    ("ruecken-lat", "Rückenlogo, Latziehen", "Endposition, von hinten"),
    ("ruecken-knie", "Rückenlogo, Kniebeuge", "Ausgang, von hinten"),
]


def blatt_standbilder2(paket: Path, k: str, kt: str) -> "Image":
    """Zweite Runde (D-428): ein Körper, drei Momente nebeneinander."""
    kacheln = []
    for u, p, _, mt in MOMENTE:
        kiste = ausschnitt([paket / "bilder" / f"{k}-A1-{u}-{p}.png"])
        zeit = ""
        info = paket / "bilder" / f"{k}-A1-{u}.json"
        if info.exists():
            w = json.loads(info.read_text(encoding="utf-8"))
            s = w["bild_s"].get(p)
            if s is not None:
                zeit = f"Renderzeit {s:.0f} s ({w['breite']} × {w['hoehe']}, {w['proben']} Proben)"
        kacheln.append(kachel(paket / "bilder" / f"{k}-A1-{u}-{p}.png", mt, 480, 360, zeit, kiste))
    return gitter(kacheln, 3, f"1 · Standbilder · {kt} · Fassung A1, Brust-F 4 cm",
                  "Daumen, Kragen und Rückenlogo korrigiert (D-425 bis D-427); Kamera wie in der App")


def blatt_nah2(paket: Path, kt: str) -> "Image":
    kacheln = [kachel(paket / "nah" / f"{datei}.png", at, 380, 380, zusatz) for datei, at, zusatz in NAH2]
    return gitter(kacheln, 4, f"2 · Nahaufnahmen · {kt}", "Fassung A1, Brust-F 4 cm; links und rechts aus Sicht des Trägers")


# Korrekturrunde 3 (D-433): Vorher (Stand D-429) und Nachher je Ansicht, Ordner `<paket>/vorher/` und
# `<paket>/nachher/`, je mit `nah/<Ansicht>.png` und `bilder/Cm-A1-<Übung>-<Phase>.png`
VERGLEICH3 = {
    "griff": ("1 · Griff beim Bankdrücken, Kniebeuge und Latziehen", [
        ("griff-vorn", "Bankdrücken, vom Fußende"), ("griff-seite", "Bankdrücken, von der Seite entlang der Stange"),
        ("griff-oben", "Bankdrücken, von oben auf die Hand"), ("griff-kopf", "Bankdrücken, vom Kopfende"),
        ("griff-knie", "Kniebeuge, hinten-seitlich"), ("griff-lat", "Latziehen, schräg von vorn")]),
    "kragen": ("2 · Rundhalskragen", [
        ("kragen-vorn", "von vorn, Stand"), ("kragen-seite", "von der Seite, Stand"),
        ("kragen-knie", "tiefste Kniebeuge, Kamera der App"), ("kragen-knie-hinten", "tiefste Kniebeuge, von hinten-seitlich"),
        ("kragen-lat-oben", "Latziehen oben, Arme gehoben")]),
    "ruecken": ("3 · Rückenlogo", [
        ("ruecken-knie", "Kniebeuge, Ausgang, von hinten"), ("ruecken-lat", "Latziehen, Endposition, von hinten")]),
}
GESAMT3 = [("kniebeuge", "1.00", "Kniebeuge · tiefste Position"), ("bankdruecken", "0.00", "Bankdrücken · Ausgangsposition"),
           ("latziehen", "1.00", "Latziehen · Endposition")]


def blatt_vergleich3(paket: Path, schluessel: str) -> "Image":
    titel, ansichten = VERGLEICH3[schluessel]
    kacheln = []
    for datei, at in ansichten:
        kacheln.append(kachel(paket / "vorher" / "nah" / f"{datei}.png", f"vorher · {at}", 380, 380, "Stand D-429"))
        kacheln.append(kachel(paket / "nachher" / "nah" / f"{datei}.png", f"nachher · {at}", 380, 380, "Stand D-430 bis D-432"))
    return gitter(kacheln, 4, titel, "C männlich, Fassung A1, Brust-F 4 cm; links und rechts aus Sicht des Trägers; links vorher, rechts nachher")


def blatt_gesamt3(paket: Path) -> "Image":
    """Gesamtansicht jeder Pilot-Übung vorher und nachher, Kamera wie in der App, dazu die Größe des
    großen Players (390 px breit) und das Vorschaubild des kleinen Players (56 px)."""
    kacheln = []
    for u, p, mt in GESAMT3:
        for stand, titel in (("vorher", "vorher"), ("nachher", "nachher")):
            pfad = paket / stand / "bilder" / f"Cm-A1-{u}-{p}.png"
            zeit = ""
            info = paket / stand / "bilder" / f"Cm-A1-{u}.json"
            if info.exists():
                w = json.loads(info.read_text(encoding="utf-8"))
                sek = w["bild_s"].get(p)
                if sek is not None:
                    zeit = f"Renderzeit {sek:.0f} s ({w['breite']} × {w['hoehe']}, {w['proben']} Proben)"
            kacheln.append(kachel(pfad, f"{titel} · {mt}", 480, 360, zeit, ausschnitt([pfad])))
    return gitter(kacheln, 2, "4 · Gesamtansicht je Pilot-Übung", "links vorher (D-429), rechts nachher (D-430 bis D-432); Kamera wie in der App")


def blatt_player3(paket: Path) -> "Image":
    kacheln = []
    for u, p, mt in GESAMT3:
        still = Image.open(paket / "nachher" / "bilder" / f"Cm-A1-{u}-{p}.png").convert("RGB")
        gross = still.resize((PLAYER_BREITE, PLAYER_BREITE * 3 // 4), Image.LANCZOS)
        feld = Image.new("RGB", (PLAYER_BREITE, gross.height + THUMB * 2 + 16), GRUND)
        feld.paste(gross, (0, 0))
        klein = still.crop(ausschnitt([paket / "nachher" / "bilder" / f"Cm-A1-{u}-{p}.png"], rand=0.02))
        seite = min(klein.size)
        klein = klein.crop(((klein.width - seite) // 2, (klein.height - seite) // 2, (klein.width + seite) // 2, (klein.height + seite) // 2))
        feld.paste(klein.resize((THUMB, THUMB), Image.LANCZOS), (0, gross.height + 8))
        feld.paste(klein.resize((THUMB * 2, THUMB * 2), Image.LANCZOS), (THUMB + 8, gross.height + 8))
        ImageDraw.Draw(feld).text((THUMB * 3 + 16, gross.height + 12), "kleiner Player: 56 px, rechts 2-fach", fill=LEISE, font=schrift(13))
        kacheln.append(kachel(feld, f"nachher · {mt}", feld.width, feld.height, "oben: großer Player am iPhone (390 px breit)"))
    return gitter(kacheln, 3, "5 · In der Größe des Players", "nachher (D-430 bis D-432); Standbilder statt Schleifen")


# Korrekturrunde 4 (D-439): Vorher (Stand D-434) und Nachher, Ordner wie in Runde 3. Blatt A Griff mit der
# neuen schrägen Nahaufnahme, Blatt B das zweite Shorts-Logo; das Blatt des personalisierten Modells entstand
# nur außerhalb des Repositorys, die Variante ist mit D-444 entfernt.
VERGLEICH4 = {
    "griff": ("1 · Griff: Daumen klar getrennt (Bankdrücken), Kniebeuge und Latziehen", [
        ("griff-vorn", "Bankdrücken, vom Fußende"), ("griff-seite", "Bankdrücken, von der Seite entlang der Stange"),
        ("griff-oben", "Bankdrücken, von oben auf die Hand"), ("griff-schraeg", "Bankdrücken, schräg: Daumen und Finger zugleich"),
        ("griff-kopf", "Bankdrücken, vom Kopfende"), ("griff-knie", "Kniebeuge, hinten-seitlich"),
        ("griff-lat", "Latziehen, schräg von vorn (Daumen als Ring)")]),
    "logo": ("2 · Zweites FORM-F auf den Shorts (linkes Bein, vorn-außen nahe dem Saum)", [
        ("logo-bein-bank", "Bankdrücken, Kamera der App, Oberschenkel"), ("logo-bein-knie", "Kniebeuge, tiefste Position, Kamera der App"),
        ("logo-bein-lat", "Latziehen, Kamera der App (beide F sichtbar)")]),
}


def blatt_vergleich4(paket: Path, schluessel: str, nummer: str) -> "Image":
    titel, ansichten = VERGLEICH4[schluessel]
    kacheln = []
    for datei, at in ansichten:
        kacheln.append(kachel(paket / "vorher" / "nah" / f"{datei}.png", f"vorher · {at}", 380, 380, "Stand D-434"))
        kacheln.append(kachel(paket / "nachher" / "nah" / f"{datei}.png", f"nachher · {at}", 380, 380, "Stand D-435 und D-436"))
    return gitter(kacheln, 4, titel, "C männlich, Fassung A1, Brust-F 4 cm; links und rechts aus Sicht des Trägers; links vorher, rechts nachher")


def blatt_player4(paket: Path) -> "Image":
    """Bankdrücken vorher und nachher in der Größe des großen Players (390 px) mit dem Vorschaubild (56 px):
    dort muss das zweite F erkennbar sein."""
    kacheln = []
    for stand, titel in (("vorher", "vorher (D-434)"), ("nachher", "nachher (D-435, D-436)")):
        pfad = paket / stand / "bilder" / "Cm-A1-bankdruecken-0.00.png"
        still = Image.open(pfad).convert("RGB")
        gross = still.resize((PLAYER_BREITE, PLAYER_BREITE * 3 // 4), Image.LANCZOS)
        feld = Image.new("RGB", (PLAYER_BREITE, gross.height + THUMB * 2 + 16), GRUND)
        feld.paste(gross, (0, 0))
        klein = still.crop(ausschnitt([pfad], rand=0.02))
        seite = min(klein.size)
        klein = klein.crop(((klein.width - seite) // 2, (klein.height - seite) // 2, (klein.width + seite) // 2, (klein.height + seite) // 2))
        feld.paste(klein.resize((THUMB, THUMB), Image.LANCZOS), (0, gross.height + 8))
        feld.paste(klein.resize((THUMB * 2, THUMB * 2), Image.LANCZOS), (THUMB + 8, gross.height + 8))
        ImageDraw.Draw(feld).text((THUMB * 3 + 16, gross.height + 12), "kleiner Player: 56 px, rechts 2-fach", fill=LEISE, font=schrift(13))
        kacheln.append(kachel(feld, f"{titel} · Bankdrücken · Ausgangsposition", feld.width, feld.height, "oben: großer Player am iPhone (390 px breit)"))
    for u, p, mt in GESAMT3:
        pfad = paket / "nachher" / "bilder" / f"Cm-A1-{u}-{p}.png"
        kacheln.append(kachel(pfad, f"nachher · {mt}", 480, 360, "Kamera wie in der App", ausschnitt([pfad])))
    return gitter(kacheln, 2, "3 · In der Größe des Players und Gesamtansicht", "Bankdrücken vorher und nachher im Player; darunter die drei Pilot-Übungen nachher")


# Korrekturrunde 5 (D-440 bis D-443): Vorher (Stand D-439) und Nachher, Ordner wie in Runde 3. Blatt 1 Griff
# (das Handfoto des Produktinhabers bleibt außerhalb des Repositorys), Blatt 2 Shorts mit nur einem F,
# Blatt 3 die drei Pilot-Übungen in Player-Größe; das personalisierte Modell nur außerhalb des Repositorys.
VERGLEICH5 = {
    "griff": ("1 · Griff: Daumen flach auf der Faust nach dem Handfoto (Bankdrücken), Kniebeuge und Latziehen", [
        ("griff-vorn", "Bankdrücken, vom Fußende"), ("griff-seite", "Bankdrücken, von der Seite entlang der Stange"),
        ("griff-oben", "Bankdrücken, von oben auf die Hand"), ("griff-schraeg", "Bankdrücken, schräg: Daumen und Finger zugleich"),
        ("griff-kopf", "Bankdrücken, vom Kopfende"), ("griff-knie", "Kniebeuge, hinten-seitlich"),
        ("griff-knie-vorn", "Kniebeuge, vorn-seitlich"), ("griff-lat", "Latziehen, schräg von vorn"),
        ("griff-lat-seite", "Latziehen, von der Seite")]),
    "logo": ("2 · Shorts: nur noch das F vorn-außen nahe dem Saum (linkes Bein)", [
        ("logo-bein-bank", "Bankdrücken, Kamera der App, Oberschenkel"), ("logo-bein-knie", "Kniebeuge, tiefste Position, Kamera der App"),
        ("logo-bein-lat", "Latziehen, Kamera der App"), ("logo-bein-seite", "Kniebeuge, Stand, von links (bisheriges F außen)")]),
}
STAND5 = {"vorher": "Stand D-439", "nachher": "Stand D-440 und D-441"}


def blatt_vergleich5(paket: Path, schluessel: str) -> "Image":
    titel, ansichten = VERGLEICH5[schluessel]
    kacheln = []
    for datei, at in ansichten:
        for stand in ("vorher", "nachher"):
            kacheln.append(kachel(paket / stand / "nah" / f"{datei}.png", f"{stand} · {at}", 380, 380, STAND5[stand]))
    hinweis = "; Daumen nach dem Handfoto des Produktinhabers (nicht im Repository)" if schluessel == "griff" else ""
    return gitter(kacheln, 4, titel, "C männlich, Fassung A1, Brust-F 4 cm; links und rechts aus Sicht des Trägers; links vorher, rechts nachher" + hinweis)


def blatt_player5(paket: Path) -> "Image":
    """Die drei Pilot-Übungen vorher und nachher in der Größe des großen Players (390 px) mit dem
    Vorschaubild (56 px): Daumen und das eine Shorts-F in der tatsächlichen Darstellung."""
    kacheln = []
    for u, p, mt in GESAMT3:
        for stand in ("vorher", "nachher"):
            pfad = paket / stand / "bilder" / f"Cm-A1-{u}-{p}.png"
            still = Image.open(pfad).convert("RGB")
            gross = still.resize((PLAYER_BREITE, PLAYER_BREITE * 3 // 4), Image.LANCZOS)
            feld = Image.new("RGB", (PLAYER_BREITE, gross.height + THUMB * 2 + 16), GRUND)
            feld.paste(gross, (0, 0))
            klein = still.crop(ausschnitt([pfad], rand=0.02))
            seite = min(klein.size)
            klein = klein.crop(((klein.width - seite) // 2, (klein.height - seite) // 2, (klein.width + seite) // 2, (klein.height + seite) // 2))
            feld.paste(klein.resize((THUMB, THUMB), Image.LANCZOS), (0, gross.height + 8))
            feld.paste(klein.resize((THUMB * 2, THUMB * 2), Image.LANCZOS), (THUMB + 8, gross.height + 8))
            ImageDraw.Draw(feld).text((THUMB * 3 + 16, gross.height + 12), "kleiner Player: 56 px, rechts 2-fach", fill=LEISE, font=schrift(13))
            kacheln.append(kachel(feld, f"{stand} ({STAND5[stand]}) · {mt}", feld.width, feld.height, "oben: großer Player am iPhone (390 px breit)"))
    return gitter(kacheln, 2, "3 · Die drei Pilot-Übungen in der Größe des Players", "links vorher (D-439), rechts nachher (D-440, D-441); Standbilder statt Schleifen")


# Nachricht nach Korrekturrunde 5 (D-445): letzter Versuch am Daumen mit zwei Hebeln, einzeln und zusammen, und der
# Folgeänderung (Endglied nachgeklappt), gerendert mit `tools/uebungen-3d/daumen_versuch.py`. Ordner
# `<paket>/nah/<stand>/` (Nahaufnahmen wie in Runde 5), `<paket>/bilder/<stand>/` (Standbilder wie in der App, dazu
# `hand.json` mit der Kiste der Hand je Übung im Bild 720 × 540), `<paket>/hand/<gewicht>/` (offene Hand) und
# `<paket>/messwerte.json` (je Stand und Übung Spalt von der Seite und Überstand über den Zeigefinger). Das
# Handfoto des Produktinhabers bleibt außerhalb des Repositorys.
STAENDE6 = [("d440", "Stand D-440"), ("hebel1", "Hebel 1 · Finger 0,5"), ("hebel2", "Hebel 2 · Stange 0,74"),
            ("beide", "Hebel 1 und 2"), ("kuppe", "Endglied geklappt"), ("kuppe-hebel1", "Endglied + Hebel 1")]
ANSICHTEN6 = [("griff-vorn", "Bankdrücken, Fußende", "bankdruecken"), ("griff-seite", "Bankdrücken, Seite", "bankdruecken"),
              ("griff-oben", "Bankdrücken, oben", "bankdruecken"), ("griff-schraeg", "Bankdrücken, schräg", "bankdruecken"),
              ("griff-knie", "Kniebeuge", "kniebeuge"), ("griff-lat", "Latziehen", "latziehen")]


def _komma(wert: float, stellen: int = 1) -> str:
    return f"{wert:.{stellen}f}".replace(".", ",")


def blatt_hebel6(paket: Path) -> "Image":
    """Zeilen = Stände, Spalten = Ansichten; unter jeder Ansicht der gemessene Spalt von der Seite."""
    werte = json.loads((paket / "messwerte.json").read_text(encoding="utf-8"))
    kacheln = []
    for stand, titel in STAENDE6:
        for datei, at, uebung in ANSICHTEN6:
            w = werte.get(stand, {}).get(uebung, {})
            mass = f"Spalt {_komma(w['spalt'])} mm" if w else ""
            if w and datei == "griff-oben":
                mass = f"über Zeigefinger {_komma(w['seitlich'], 0)} mm"
            kacheln.append(kachel(paket / "nah" / stand / f"{datei}.png", titel, 300, 300, f"{at} · {mass}"))
    return gitter(kacheln, 6, "1 · Daumen: zwei Hebel einzeln und zusammen, dazu die Folgeänderung",
                  "Spalt: mittlere Lücke zwischen Daumen und Fingern im Blick entlang der Stange (rechte Hand); oben: Daumen über die Außenkante des Zeigefingers")


def blatt_hand6(paket: Path) -> "Image":
    """Die Hand im großen Player (390 px breit): Ausschnitt 1 : 1 und sechsfach, je Stand und Übung; dazu die
    offene Hand mit den Fingerlängen 0, 0,3 und 0,5."""
    kisten = json.loads((paket / "bilder" / "d440" / "hand.json").read_text(encoding="utf-8"))
    momente = [("kniebeuge", "1.00", "Kniebeuge unten"), ("bankdruecken", "0.00", "Bankdrücken Start"), ("latziehen", "1.00", "Latziehen unten")]
    kacheln = []
    for stand, titel in (("d440", "Stand D-440"), ("hebel1", "Hebel 1 · Finger 0,5"), ("kuppe", "Endglied geklappt"),
                         ("kuppe-hebel1", "Endglied + Hebel 1")):
        for u, p, mt in momente:
            still = Image.open(paket / "bilder" / stand / f"Cm-A1-{u}-{p}.png").convert("RGB")
            f = PLAYER_BREITE / still.width
            gross = still.resize((PLAYER_BREITE, round(still.height * f)), Image.LANCZOS)
            x0, y0, x1, y1 = kisten[u]
            m = 6
            hand = gross.crop((max(0, int(x0 * f) - m), max(0, int(y0 * f) - m), min(gross.width, int(x1 * f) + m), min(gross.height, int(y1 * f) + m)))
            feld = Image.new("RGB", (PLAYER_BREITE, 210), GRUND)
            feld.paste(hand, (8, 8))
            d = ImageDraw.Draw(feld)
            d.text((8, hand.height + 16), "1 : 1 wie im Player", fill=LEISE, font=schrift(13))
            d.text((150, 192), "sechsfach", fill=LEISE, font=schrift(13))
            sechs = hand.resize((hand.width * 6, hand.height * 6), Image.LANCZOS)
            s_ = min(1.0, (PLAYER_BREITE - 158) / sechs.width, 186 / sechs.height)
            if s_ < 1.0:
                sechs = sechs.resize((int(sechs.width * s_), int(sechs.height * s_)), Image.LANCZOS)
            feld.paste(sechs, (150, 0))
            kacheln.append(kachel(feld, f"{titel} · {mt}", feld.width, feld.height, "Ausschnitt aus dem großen Player (390 px breit)"))
    for gewicht, gt in (("0", "Fingerlänge 0 (D-440)"), ("0.3", "Fingerlänge 0,3"), ("0.5", "Fingerlänge 0,5")):
        for ansicht, at in (("hand-innen", "Handfläche"), ("hand-aussen", "Handrücken")):
            kacheln.append(kachel(paket / "hand" / gewicht / f"{ansicht}.png", f"{gt} · {at}", PLAYER_BREITE, 236, "offene Hand, Proportion"))
    return gitter(kacheln, 3, "2 · Die Hand in der Größe des Players und die Proportion der Hand",
                  "Standbilder statt Schleifen; unten die offene Hand mit dem MakeHuman-Regler für die Fingerlänge")


# Runde „Kleidung nach dem Design-Board“ (D-449 bis D-453, `docs/prompts/uebungen-kleidung-neu-FORM.md` Abschnitt 6),
# gerendert mit `tools/uebungen-3d/kleidung_bilder.py` und `varianten_bilder.py`. Ordner `<paket>/`: `stand/`
# (stand-vorn, stand-hinten), `nah/` (Nahaufnahmen), `bilder/Cm-<Übung>-<Phase>.png` (720 × 540) und je Stand
# `vorher/` und `nachher/` mit `handgelenk/` (Bilder und handgelenk.json) und `griff/`.
BOARD = HIER.parent / "docs" / "prompts" / "uebungen-kleidung-neu-board.png"
NAH7 = [("brust", "Brust-F", "von vorn, Ruhehaltung"), ("ruecken", "Rückenlogo", "F über FORM, von hinten"),
        ("shorts-vorn", "Shorts von vorn", "Seitenstreifen und F am linken Bein"),
        ("shorts-seite", "Shorts von der Seite", "Seitenstreifen, zum Saum breiter"),
        ("socke", "Socke", "F schwarz außen, Spitze schwarz"), ("schuh-aussen", "Schuh von der Seite", "außen, mit F"),
        ("schuh-innen", "Schuh von innen", "Sohle geschlossen (D-451)")]
MOMENTE7 = [("kniebeuge", "1.00", "Kniebeuge · tiefste Position"), ("bankdruecken", "0.00", "Bankdrücken · Ausgangsposition"),
            ("bankdruecken", "1.00", "Bankdrücken · Endposition"), ("latziehen", "1.00", "Latziehen · Endposition")]
STAND7 = {"vorher": "vorher D-451", "nachher": "nachher D-452"}


def _figur(bild: Path) -> "Image":
    """Die Figur aus dem orthografischen Bild, oben und unten knapp beschnitten."""
    b = Image.open(bild).convert("RGB")
    maske = Image.eval(b.convert("L"), lambda v: 255 if v > 24 else 0)
    k = maske.getbbox()
    return b.crop((0, max(0, k[1] - 12), b.width, min(b.height, k[3] + 12)))


def blatt_board7(paket: Path) -> "Image":
    """Das Board und die Figur von vorn und von hinten, alle gleich hoch."""
    hoehe = 900
    board = Image.open(BOARD).convert("RGB")
    board = board.resize((round(board.width * hoehe / board.height), hoehe), Image.LANCZOS)
    vorn, hinten = (_figur(paket / "stand" / f"stand-{n}.png") for n in ("vorn", "hinten"))
    vorn = vorn.resize((round(vorn.width * hoehe / vorn.height), hoehe), Image.LANCZOS)
    hinten = hinten.resize((round(hinten.width * hoehe / hinten.height), hoehe), Image.LANCZOS)
    kacheln = [kachel(board, "Design-Board", board.width, hoehe, "Vorlage des Produktinhabers"),
               kachel(vorn, "Figur von vorn", vorn.width, hoehe, "Ruhehaltung, orthografisch, Licht wie in der App"),
               kachel(hinten, "Figur von hinten", hinten.width, hoehe, "Ruhehaltung, orthografisch")]
    breite = max(k.width for k in kacheln)
    kacheln = [k if k.width == breite else _breiter(k, breite) for k in kacheln]
    return gitter(kacheln, 3, "1 · Die neue Kleidung neben dem Design-Board",
                  "C männlich; T-Shirt, Shorts, Socken und Schuhe nach dem Board (D-450, D-451); links und rechts aus Sicht des Trägers")


def _breiter(k: "Image", breite: int) -> "Image":
    neu = Image.new("RGB", (breite, k.height), GRUND)
    neu.paste(k, ((breite - k.width) // 2, 0))
    return neu


def blatt_nah7(paket: Path) -> "Image":
    kacheln = [kachel(paket / "nah" / f"{datei}.png", titel, 400, 400, zusatz) for datei, titel, zusatz in NAH7]
    return gitter(kacheln, 4, "2 · Nahaufnahmen der Kleidung",
                  "Ruhehaltung, Licht und Kantenlicht wie in der App; links und rechts aus Sicht des Trägers")


def blatt_player7(paket: Path, titel: str = "3 · Die drei Pilot-Übungen in der Größe des Players",
                  unter: str = "Standbilder statt Schleifen; die Schleifen der App folgen nach deiner Freigabe") -> "Image":
    """Die vier Momente in der Größe des großen Players (390 px) mit dem Vorschaubild (56 px)."""
    kacheln = []
    for u, p, mt in MOMENTE7:
        pfad = paket / "bilder" / f"Cm-{u}-{p}.png"
        still = Image.open(pfad).convert("RGB")
        gross = still.resize((PLAYER_BREITE, PLAYER_BREITE * 3 // 4), Image.LANCZOS)
        feld = Image.new("RGB", (PLAYER_BREITE, gross.height + THUMB * 2 + 16), GRUND)
        feld.paste(gross, (0, 0))
        klein = still.crop(ausschnitt([pfad], rand=0.02))
        seite = min(klein.size)
        klein = klein.crop(((klein.width - seite) // 2, (klein.height - seite) // 2, (klein.width + seite) // 2, (klein.height + seite) // 2))
        feld.paste(klein.resize((THUMB, THUMB), Image.LANCZOS), (0, gross.height + 8))
        feld.paste(klein.resize((THUMB * 2, THUMB * 2), Image.LANCZOS), (THUMB + 8, gross.height + 8))
        d = ImageDraw.Draw(feld)
        d.text((THUMB * 3 + 16, gross.height + 12), "kleiner Player 56 px,", fill=LEISE, font=schrift(13))
        d.text((THUMB * 3 + 16, gross.height + 30), "rechts 2-fach", fill=LEISE, font=schrift(13))
        info = json.loads((paket / "bilder" / f"Cm-{u}.json").read_text(encoding="utf-8"))
        zeit = f"{info['bild_s'][p]:.0f} s"
        kacheln.append(kachel(feld, mt, feld.width, feld.height, f"großer Player am iPhone, 390 px · Renderzeit {zeit}"))
    return gitter(kacheln, 2, titel, unter)


def _grad(w: float) -> str:
    return f"{w:+.1f}°".replace(".", ",") if w < 0 else f"{w:.1f}°".replace(".", ",")


def blatt_handgelenk7(paket: Path) -> "Image":
    """Zeilen: von der Seite vorher und nachher, vom Fußende vorher und nachher; Spalten: Phasen 0 bis 1."""
    phasen = ["0.00", "0.25", "0.50", "0.75", "1.00"]
    namen = {"0.00": "Ausgang", "0.25": "Viertel", "0.50": "Mitte", "0.75": "Dreiviertel", "1.00": "unten"}
    kacheln = []
    for ansicht, at in (("seite", "Seite"), ("fussende", "Fuß")):
        for stand in ("vorher", "nachher"):
            werte = json.loads((paket / stand / "handgelenk" / "handgelenk.json").read_text(encoding="utf-8"))["werte"]
            for p in phasen:
                w = werte[p]
                mass = (f"hinten {_grad(w['Handgelenk gestreckt (Grad)'])} · seitlich {_grad(w['Handgelenk seitlich (Grad, + zum Daumen)'])}"
                        f" · gesamt {_grad(w['Handgelenk gesamt (Grad)'])}")
                kacheln.append(kachel(paket / stand / "handgelenk" / f"handgelenk-{ansicht}-{p}.png",
                                      f"{STAND7[stand]} · {namen[p]} · {at}", 300, 300, mass))
    return gitter(kacheln, 5, "4 · Handgelenk beim Bankdrücken vorher und nachher",
                  "linke Hand; oben von der Seite längs der Stange, unten vom Fußende; Winkel an der Längsachse der Mittelhand: hinten = gestreckt, seitlich + zum Daumen")


def blatt_griff7(paket: Path) -> "Image":
    ansichten = [("griff-vorn", "vom Fußende"), ("griff-seite", "von der Seite"), ("griff-oben", "von oben"),
                 ("griff-schraeg", "schräg"), ("griff-kopf", "vom Kopfende")]
    kacheln = []
    for phase, pt in (("0.00", "Ausgang"), ("0.50", "Mitte")):
        for stand in ("vorher", "nachher"):
            for datei, at in ansichten:
                kacheln.append(kachel(paket / stand / "griff" / f"{datei}-{phase}.png", f"{STAND7[stand]} · {pt}", 300, 300, at))
    return gitter(kacheln, 5, "5 · Griffblatt Bankdrücken vorher und nachher",
                  "vorher: Stange 18° schräg bei 0,68 der Hand; nachher: 12° schräg, etwas tiefer zum Handballen (0,65); Daumen nachgeklappt wie freigegeben")


# Runde „Pilot-Übungen mit der neuen Kleidung“ (D-455): Griffblatt Latziehen aus `kleidung_bilder.py latziehen`,
# Ordner `<paket>/vorher/` (Stand D-454) und `<paket>/nachher/` mit lat-<Ansicht>-<Phase>.png und latziehen.json
STAND8 = {"vorher": "vorher", "nachher": "nachher"}
LAT8 = [("vorher", "vorn", "von vorn"), ("nachher", "vorn", "von vorn"), ("nachher", "seite", "Seite"),
        ("nachher", "hinten", "von hinten"), ("nachher", "schraeg", "schräg")]


def blatt_lat8(paket: Path) -> "Image":
    """Zeilen: vorher und nachher von vorn, nachher von der Seite, von hinten und schräg; Spalten: Phasen 0 bis 1."""
    phasen = ["0.00", "0.25", "0.50", "0.75", "1.00"]
    namen = {"0.00": "oben", "0.25": "Viertel", "0.50": "Mitte", "0.75": "Dreiviertel", "1.00": "unten"}
    werte = {st: json.loads((paket / st / "latziehen.json").read_text(encoding="utf-8"))["werte"] for st in STAND8}
    kacheln = []
    for stand, ansicht, at in LAT8:
        for p in phasen:
            w = werte[stand][p]
            mass = (f"hinten {_grad(w['Handgelenk gestreckt (Grad)'])} · seitlich {_grad(w['Handgelenk seitlich (Grad, + zum Daumen)'])}"
                    f" · gesamt {_grad(w['Handgelenk gesamt (Grad)'])}")
            kacheln.append(kachel(paket / stand / f"lat-{ansicht}-{p}.png", f"{STAND8[stand]} · {namen[p]} · {at}", 300, 300, mass))
    return gitter(kacheln, 5, "Griffblatt Latziehen vorher und nachher",
                  "linke Hand; Winkel an der Längsachse der Mittelhand: hinten = gestreckt, seitlich + zum Daumen; "
                  "vorher Stand D-454 (Stange 6° schräg bei 0,72 der Hand), nachher D-455 (20° schräg bei 0,65)")


# Runde „Schuh und Rückenlogo“ (Phase Programme, Abschnitt 1, D-460), gerendert mit `tools/uebungen-3d/schuh_bilder.py`
# und `varianten_bilder.py`. Ordner `<paket>/`: `vorher/` (schuh, ruecken mit --vorher: Schuh bis D-459, Logo im
# Verhältnis des Boards), `nachher/` (schuh, details, ruecken), `bilder/Cm-<Übung>-<Phase>.png` (720 × 540)
BOARD_SCHUH = (178, 528, 453, 688)  # Ausschnitt der Schuhe auf dem Board (453 × 696 px)
SCHUH9 = [("aussen", "von außen"), ("innen", "von innen"), ("hinten", "von hinten"), ("oben", "von oben")]
DETAILS9 = [("schnuerung-oben", "Schnürung von oben", "Senkel über Kreuz, Ösen, Knoten mit Schlaufen"),
            ("schnuerung-seite", "Schnürung von der Seite", "Senkel liegen auf dem Rist"),
            ("zunge", "Zunge", "kleines F über der Schnürung"),
            ("kragen-aussen", "Kragen außen", "Polster und schwarzes Futter"),
            ("kragen-hinten", "Kragen hinten", "Polster um die Ferse, Lasche"),
            ("kragen-innen", "Kragen innen", "Polster und Futter"),
            ("profil-spitze", "Spitze und Profil", "angehobene Spitze, Stollen"),
            ("profil-ferse", "Ferse und Profil", "Stollen unter dem Einsatz in Lime")]


def _mm(w: float) -> str:
    return f"{w:.1f} mm".replace(".", ",")


def blatt_schuh9(paket: Path) -> "Image":
    """Board, beide Schuhe aus der Richtung des Boards vorher und nachher, darunter die vier Ansichten nachher und
    vorher."""
    g = 360
    board = Image.open(BOARD).convert("RGB").crop(BOARD_SCHUH)
    kacheln = [kachel(board, "Design-Board", g, g, "Vorlage, Schuhe"),
               kachel(paket / "nachher" / "schuh-board.png", "Nachher · wie auf dem Board", g, g, "beide Schuhe, schräg von vorn außen"),
               kachel(paket / "vorher" / "schuh-board.png", "Vorher · wie auf dem Board", g, g, "Stand D-459"),
               kachel(paket / "nachher" / "detail-schnuerung-oben.png", "Nachher · Schnürung", g, g, "aus der Nähe")]
    for stand, st in (("nachher", "Nachher"), ("vorher", "Vorher")):
        for datei, at in SCHUH9:
            kacheln.append(kachel(paket / stand / f"schuh-{datei}.png", f"{st} · {at}", g, g, "linker Schuh, Ruhehaltung"))
    return gitter(kacheln, 4, "1 · Der Schuh neben dem Board, vorher und nachher",
                  "C männlich, Ruhehaltung, Licht wie in der App; außen = Seite mit dem F")


def blatt_details9(paket: Path) -> "Image":
    werte = json.loads((paket / "nachher" / "schuh.json").read_text(encoding="utf-8"))["messwerte"]
    alt = json.loads((paket / "vorher" / "schuh.json").read_text(encoding="utf-8"))["messwerte"]
    kacheln = [kachel(paket / "nachher" / f"detail-{datei}.png", titel, 360, 360, zusatz) for datei, titel, zusatz in DETAILS9]
    z = "Zehenbox: Socke unter der Außenseite des Schafts (mm)"
    unter = (f"Ruhehaltung: Sohle flach, Standhöhe {_mm(werte['Standhöhe: Sohle unter dem Fuß (mm)'])} "
             f"(vorher {_mm(alt['Standhöhe: Sohle unter dem Fuß (mm)'])}); Socke im Schuh ≥ {_mm(werte[z])} unter der Außenseite; "
             f"Senkel {_mm(werte['Senkel: kleinster Abstand über der Socke (mm)'])}, Polster {_mm(werte['Polster: kleinster Abstand über der Socke (mm)'])} über der Socke")
    return gitter(kacheln, 4, "2 · Schnürung, Zunge, Kragen und Profil aus der Nähe", unter)


def blatt_ruecken9(paket: Path) -> "Image":
    """Rückenlogo vorher und nachher: ganze Figur und Oberkörper von hinten, Latziehen mit der Kamera der App und
    von hinten in Ausgangs- und Endposition."""
    lv = json.loads((paket / "vorher" / "ruecken.json").read_text(encoding="utf-8"))["logo_cm"]
    ln = json.loads((paket / "nachher" / "ruecken.json").read_text(encoding="utf-8"))["logo_cm"]

    def cm(w: float) -> str:
        return f"{w:.1f} cm".replace(".", ",")

    mass = {st: f"F {cm(l['ruecken_f'])}, FORM {cm(l['ruecken_wortmarke'])} breit" for st, l in (("vorher", lv), ("nachher", ln))}
    kacheln = []
    for datei, titel in (("ruecken-ganz", "Rückansicht"), ("ruecken-nah", "Oberkörper")):
        for stand, st in (("vorher", "Vorher"), ("nachher", "Nachher")):
            kacheln.append(kachel(paket / stand / f"{datei}.png", f"{st} · {titel}", 300, 300, mass[stand]))
    for p, pt in (("1.00", "Endposition"), ("0.00", "Ausgangsposition")):
        for datei, titel in (("latziehen-app", "Kamera der App"), ("latziehen-hinten", "von hinten")):
            for stand, st in (("vorher", "Vorher"), ("nachher", "Nachher")):
                kacheln.append(kachel(paket / stand / f"{datei}-{p}.png", f"{st} · {titel}", 300, 300, f"Latziehen, {pt}"))
    return gitter(kacheln, 4, "Rückenlogo vorher und nachher",
                  "vorher Verhältnis des Boards (F 3,40 Versalhöhen), nachher des Startbilds (F 2,28, Abstand 0,82); Mitte des Blocks gleich")


# Runde „Shorts-F weiter nach vorn“ (D-461): Nahaufnahmen aus `tools/uebungen-3d/shorts_bilder.py`, Ordner `<paket>/` mit
# `shorts-<Übung>.png` und `.json` (Abstand, Bild der Schleife, Lage der nächsten Punkte von F und Streifen im Bild)
SHORTS10 = [("kniebeuge", "Kniebeuge"), ("bankdruecken", "Bankdrücken"), ("latziehen", "Latziehen")]


def blatt_shorts10(paket: Path) -> "Image":
    kacheln = []
    for datei, titel in SHORTS10:
        werte = json.loads((paket / f"shorts-{datei}.json").read_text(encoding="utf-8"))
        bild = Image.open(paket / f"shorts-{datei}.png").convert("RGB")
        d = ImageDraw.Draw(bild)
        (fx, fy), (sx, sy) = werte["pixel"]["f"], werte["pixel"]["streifen"]
        for x, y in ((fx, fy), (sx, sy)):
            d.ellipse((x - 5, y - 5, x + 5, y + 5), outline=(255, 255, 255), width=2)
        d.line((fx, fy, sx, sy), fill=(255, 255, 255), width=2)
        abstand = f"{werte['abstand_cm']:.1f} cm".replace(".", ",")
        # Maß rechts neben der Strecke, auf dunklem Feld, damit es nicht ins F oder den Streifen läuft
        f = schrift(22, True)
        x0, y0 = max(fx, sx) + 16, (fy + sy) / 2 - 14
        box = d.textbbox((x0, y0), abstand, font=f)
        d.rounded_rectangle((box[0] - 6, box[1] - 4, box[2] + 6, box[3] + 4), radius=6, fill=(14, 18, 24))
        d.text((x0, y0), abstand, fill=(255, 255, 255), font=f)
        bild_nr = werte["bild"]
        kacheln.append(kachel(bild, f"{titel} · F zum Streifen {abstand}", 420, 420,
                              f"kleinster Abstand über alle 60 Bilder (Bild {bild_nr}), größter {werte['groesster_cm']:.1f} cm".replace(".", ",")))
    return gitter(kacheln, 3, "Shorts-F mit Abstand zum Seitenstreifen",
                  "linkes Bein; gemessen auf dem Stoff zwischen den nächsten Punkten von F und Streifen; Höhe über dem Saum und Größe des F wie bisher")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--paket", required=True, help="Ordner mit bilder/ und nah/ (Runde 3: vorher/ und nachher/)")
    ap.add_argument("--ziel", default=str(HIER.parent / "docs/screens/uebungen"))
    ap.add_argument("--runde", type=int, default=1,
                    help="1: Korrekturen D-421 bis D-424 (drei Körper); 2: D-425 bis D-428 (C männlich); 3: D-430 bis D-433 (vorher/nachher); 4: D-435 bis D-439; 5: D-440 bis D-443; 6: D-445; 7: D-449 bis D-453 (Kleidung nach dem Board); 8: D-455 (Griffblatt Latziehen); 9: D-460 (Schuh und Rückenlogo); 10: D-461 (Shorts-F und Streifen)")
    args = ap.parse_args()
    paket, ziel = Path(args.paket), Path(args.ziel)
    ziel.mkdir(parents=True, exist_ok=True)
    if args.runde == 10:
        speichern(blatt_shorts10(paket), ziel, "shorts-f-abstand")
        return
    if args.runde == 9:
        speichern(blatt_schuh9(paket), ziel, "schuh-1-board")
        speichern(blatt_details9(paket), ziel, "schuh-2-details")
        speichern(blatt_ruecken9(paket), ziel, "ruecken-vorher-nachher")
        speichern(blatt_player7(paket, "3 · Die drei Pilot-Übungen in der Größe des Players",
                                "Standbilder mit Schuh und Rückenlogo nach D-460; die Schleifen folgen nach deiner Freigabe"),
                   ziel, "schuh-3-player")
        return
    if args.runde == 8:
        speichern(blatt_lat8(paket), ziel, "latziehen-griff")
        return
    if args.runde == 7:
        speichern(blatt_board7(paket), ziel, "kleidung-1-board")
        speichern(blatt_nah7(paket), ziel, "kleidung-2-nah")
        speichern(blatt_player7(paket), ziel, "kleidung-3-player")
        speichern(blatt_handgelenk7(paket), ziel, "kleidung-4-handgelenk")
        speichern(blatt_griff7(paket), ziel, "kleidung-5-griff")
        return
    if args.runde == 6:
        speichern(blatt_hebel6(paket), ziel, "korrektur6-1-hebel")
        speichern(blatt_hand6(paket), ziel, "korrektur6-2-hand-player")
        return
    if args.runde == 5:
        speichern(blatt_vergleich5(paket, "griff"), ziel, "korrektur5-1-griff")
        speichern(blatt_vergleich5(paket, "logo"), ziel, "korrektur5-2-shorts-logo")
        speichern(blatt_player5(paket), ziel, "korrektur5-3-player")
        return
    if args.runde == 4:
        speichern(blatt_vergleich4(paket, "griff", "1"), ziel, "korrektur4-1-griff")
        speichern(blatt_vergleich4(paket, "logo", "2"), ziel, "korrektur4-2-shorts-logo")
        speichern(blatt_player4(paket), ziel, "korrektur4-3-player")
        return
    if args.runde == 3:
        for schluessel in ("griff", "kragen", "ruecken"):
            speichern(blatt_vergleich3(paket, schluessel), ziel, f"korrektur3-{VERGLEICH3[schluessel][0][0]}-{schluessel}")
        speichern(blatt_gesamt3(paket), ziel, "korrektur3-4-gesamt")
        speichern(blatt_player3(paket), ziel, "korrektur3-5-player")
        return
    if args.runde == 2:
        k, kt = KOERPER[1]
        speichern(blatt_standbilder2(paket, k, kt), ziel, "korrektur2-1-standbilder")
        speichern(blatt_nah2(paket, kt), ziel, "korrektur2-2-nahaufnahmen")
        return
    speichern(blatt_standbilder(paket), ziel, "korrektur-1-standbilder")
    for n, (k, kt) in enumerate(KOERPER, start=2):
        speichern(blatt_nah(paket, k, kt, n), ziel, f"korrektur-{n}-nah-{k}")


if __name__ == "__main__":
    main()
