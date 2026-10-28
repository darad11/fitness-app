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
# neuen schrägen Nahaufnahme, Blatt B das zweite Shorts-Logo; das personalisierte Modell (Blatt C) entsteht
# nur außerhalb des Repositorys (`--runde 4 --privat <ordner>`).
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


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--paket", required=True, help="Ordner mit bilder/ und nah/ (Runde 3: vorher/ und nachher/)")
    ap.add_argument("--ziel", default=str(HIER.parent / "docs/screens/uebungen"))
    ap.add_argument("--runde", type=int, default=1,
                    help="1: Korrekturen D-421 bis D-424 (drei Körper); 2: D-425 bis D-428 (C männlich); 3: D-430 bis D-433 (vorher/nachher); 4: D-435 bis D-439; 5: D-440 bis D-443")
    args = ap.parse_args()
    paket, ziel = Path(args.paket), Path(args.ziel)
    ziel.mkdir(parents=True, exist_ok=True)
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
