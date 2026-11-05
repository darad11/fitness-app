#!/usr/bin/env python3
"""Prüfseite einer Pilot-Übung (D-408, neu mit D-447): Prüfansichten aus `render.py <übung> --pruefen`
(vorn, Seite und Standard in fünf Phasen, Griff der linken Hand aus der Nähe von drei Seiten in Ausgangs-
und Endposition) auf einem Blatt `docs/screens/uebungen/pruef-<übung>.webp`.

    python3 tools/uebungen_pruef_bild.py kniebeuge bankdruecken latziehen --arbeit /tmp/uebungen-3d
    python3 tools/uebungen_pruef_bild.py bankdruecken_kh schraegbankdruecken_kh --familie waagrechtes-druecken \
        --titel "Waagrechtes Drücken" --arbeit /tmp/uebungen-3d     # Prüfseite einer Familie (Programme, Abschnitt 2)

Prüfseite einer Familie (D-462): je Übung Ausgangs- und Endposition mit der Kamera der App und von der Seite, der
Griff der linken Hand in beiden Positionen von der Handfläche und vom Handrücken (`pruef-griff-<Seite>-<Phase>.png`
aus `familie_bilder.py`, je Übung auch andere Seiten), der linke Fuß aus zwei Richtungen (die ersten beiden aus
`fuss_ansichten` der Übung, sonst von außen und von vorn) und die Messwerte aller 60 Bilder (kleinster und größter
Wert aus `<übung>-messwerte.json`).

Braucht Pillow (nur für dieses Werkzeug, nicht für die App); Gestaltung wie `uebungen_paket_bild.py`.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

HIER = Path(__file__).resolve().parent
sys.path.insert(0, str(HIER))

from PIL import Image, ImageDraw  # noqa: E402

from uebungen_paket_bild import GRUND, LEISE, TEXT, schrift, speichern  # noqa: E402

PHASEN = ("0.00", "0.25", "0.50", "0.75", "1.00")
ANSICHTEN = (("vorn", "vorn"), ("seite", "Seite"), ("standard", "Standard"))
GRIFF = (("20", "Griff von vorn"), ("110", "Griff von außen"), ("200", "Griff von hinten"))


def zelle(pfad: Path, breite: int, text: str) -> Image.Image:
    bild = Image.open(pfad).convert("RGB")
    bild = bild.resize((breite, round(bild.height * breite / bild.width)), Image.LANCZOS)
    feld = Image.new("RGB", (breite, bild.height + 30), GRUND)
    feld.paste(bild, (0, 0))
    d = ImageDraw.Draw(feld)
    f = schrift(16)
    w = d.textlength(text, font=f)
    d.text(((breite - w) / 2, bild.height + 6), text, fill=TEXT, font=f)
    return feld


def blatt(arbeit: Path) -> Image.Image:
    breite = 1480
    zeilen: list[list[Image.Image]] = []
    for datei, titel in ANSICHTEN:
        zeilen.append([zelle(arbeit / f"pruef-{datei}-{p}.png", breite // 5 - 8,
                             f"{titel} · Phase {p.replace('.', ',')}") for p in PHASEN])
    zeilen.append([zelle(arbeit / f"pruef-hand-{r}-{p}.png", breite // 6 - 8,
                         f"{t} · {'Ausgang' if p == '0.00' else 'Endposition'}") for p in ("0.00", "1.00") for r, t in GRIFF])
    hoehe = sum(max(z.height for z in zeile) + 8 for zeile in zeilen) + 8
    gesamt = Image.new("RGB", (breite, hoehe), GRUND)
    y = 8
    for zeile in zeilen:
        x = (breite - sum(z.width + 8 for z in zeile) + 8) // 2
        for z in zeile:
            gesamt.paste(z, (x, y))
            x += z.width + 8
        y += max(z.height for z in zeile) + 8
    return gesamt


# Messwerte der Prüfseite einer Familie: (Schlüssel in `<übung>-messwerte.json`, Text, Art: „spanne“ = kleinster bis
# größter Wert, „min“, „max“, „betrag“ = größter Betrag; Einheit)
MESSWERTE = (
    ("Ellbogenwinkel", "Ellbogen", "spanne", "°"),
    ("Oberarm vom Rumpf zur Seite, Ellbogen unter der Bank (Grad)", "Oberarm vom Rumpf zur Seite (Ellbogen unter der Bank)",
     "spanne", "°"),
    ("Oberarm unter der Ebene der Bank (Grad)", "Oberarm unten unter der Bankebene", "max", "°"),
    ("Unterarm zur Senkrechten", "Unterarm zur Senkrechten", "max", "°"),
    ("Handgelenk gestreckt (Grad)", "Handgelenk nach hinten", "spanne", "°"),
    ("Handgelenk seitlich (Grad, + zum Daumen)", "Handgelenk zur Seite (+ Daumen)", "spanne", "°"),
    ("Handgelenk gesamt (Grad)", "Handgelenk gesamt", "max", "°"),
    ("Finger: geringster Abstand zur Stange (mm, negativ = eingedrungen)", "Finger am Griff (gewollt 4 mm eingedrückt)", "min",
     " mm"),
    ("Kurzhantel: Hand zu den Köpfen (mm)", "Hand zu den Köpfen", "min", " mm"),
    ("Kurzhantel: Köpfe über dem Körper (mm)", "Köpfe über dem Körper (ohne Hände)", "min", " mm"),
    ("Köpfe innen auseinander (cm)", "Köpfe innen auseinander", "spanne", " cm"),
    ("Kniewinkel (Grad)", "Knie", "spanne", "°"),
    ("Hüftwinkel (Grad)", "Hüfte (Oberschenkel zum Rumpf)", "spanne", "°"),
    ("Hüftgelenk gebeugt (Grad, gegenüber dem Stand)", "Hüftgelenk gebeugt (zum Becken)", "spanne", "°"),
    ("Sprunggelenk gebeugt (Grad)", "Sprunggelenk gebeugt", "spanne", "°"),
    ("Knie neben der Fußachse (cm, + außen)", "Knie neben der Fußachse (+ außen)", "spanne", " cm"),
    ("Schlitten: Weg von oben (cm)", "Weg des Schlittens", "max", " cm"),
    ("Sohle L: Ferse auf der Platte (mm)", "Sohle links, Ferse auf der Platte", "betrag", " mm"),
    ("Sohle L: Ballen auf der Platte (mm)", "Sohle links, Ballen auf der Platte", "betrag", " mm"),
    ("Sohle R: Ferse auf der Platte (mm)", "Sohle rechts, Ferse auf der Platte", "betrag", " mm"),
    ("Sohle R: Ballen auf der Platte (mm)", "Sohle rechts, Ballen auf der Platte", "betrag", " mm"),
    ("Sohle L: Ferse über dem Boden (mm)", "Sohle links, Ferse über dem Boden", "betrag", " mm"),
    ("Sohle L: Ballen über dem Boden (mm)", "Sohle links, Ballen über dem Boden", "betrag", " mm"),
    ("Sohle R: Ferse über dem Boden (mm)", "Sohle rechts, Ferse über dem Boden", "betrag", " mm"),
    ("Sohle R: Ballen über dem Boden (mm)", "Sohle rechts, Ballen über dem Boden", "betrag", " mm"),
    ("Kragen: Innenseite über der Socke (mm)", "Kragen über der Socke", "min", " mm"),
    ("Polster: kleinster Abstand über der Socke (mm)", "Kragenpolster über der Socke", "min", " mm"),
    # Vorfuß gebogen (D-467)
    ("Vorfuß L: Schuh am Ballen gebogen (Grad)", "Schuh am Ballen gebogen", "spanne", "°"),
    ("Senkel: kleinster Abstand über der Socke (mm)", "Senkel über der Socke", "min", " mm"),
    ("Ösen: kleinster Abstand über der Socke (mm)", "Ösen über der Socke", "min", " mm"),
    ("Zehenbox: Socke unter der Außenseite des Schafts (mm)", "Socke unter der Außenseite des Schafts", "min", " mm"),
    ("Fuß: Haut unter der Außenseite des Schafts (mm)", "Fuß (Haut) unter der Außenseite des Schafts", "min", " mm"),
    ("Fuß und Socke: außerhalb des Schuhs (Punkte)", "Fuß und Socke außerhalb des Schuhs (Punkte)", "max", ""),
    ("Shorts: kleinster Abstand F zum Streifen (cm)", "Shorts-F zum Streifen", "min", " cm"),
    ("Bank: Rumpf im Polster (mm)", "Rumpf im Polster, tiefste Stelle", "max", " mm"),
    ("Bank: Oberschenkel über dem Polster (mm)", "Oberschenkel über dem Polster", "min", " mm"),
    ("Gesäß im Sitz (mm)", "Gesäß im Sitz (unter 0 = abgehoben)", "spanne", " mm"),
    ("Unterer Rücken im Polster (mm, schwächste Stelle)", "Lende an der Lehne, schwächste Stelle (unter 0 = Lücke)",
     "spanne", " mm"),
    ("Kreuzbein im Polster (mm)", "Kreuzbein im Polster (Polster gibt nach)", "spanne", " mm"),
    ("Oberer Rücken im Polster (mm)", "Oberer Rücken im Polster", "spanne", " mm"),
    ("Kopf (Haare) in der Lehne (mm)", "Kopf an der Lehne (unter 0 = Luft)", "spanne", " mm"),
    ("Becken verschoben (mm)", "Becken verschoben", "max", " mm"),
    ("Becken gedreht (Grad)", "Becken gedreht (Einrollen)", "max", "°"),
    # Beinbeuger liegend (D-475)
    ("Rumpf zur Waagrechten (Grad, + Kopf tiefer)", "Rumpf zur Waagrechten (+ Kopf tiefer)", "spanne", "°"),
    ("Brust und Bauch im Polster (mm)", "Brust und Bauch im Polster", "spanne", " mm"),
    ("Hüfte am Scheitel im Polster (mm)", "Hüfte am Scheitel im Polster", "spanne", " mm"),
    ("Becken gegenüber dem Ausgang angehoben (mm)", "Becken gegenüber dem Ausgang angehoben", "spanne", " mm"),
    ("Oberschenkel im Polster (mm)", "Oberschenkel im Polster", "spanne", " mm"),
    ("Kniegelenk zur Drehachse (mm)", "Kniegelenk zur Drehachse", "max", " mm"),
    ("Hebel gedreht (Grad)", "Hebel und Rolle gedreht", "spanne", "°"),
    ("Rolle: Socke und Haut (mm, negativ = eingedrückt)", "Rolle auf Socke und Haut (negativ = eingedrückt)", "spanne", " mm"),
    ("Rolle zu den Schuhen (mm)", "Rolle zu den Schuhen", "min", " mm"),
    ("Kopf und Hals zum Gerät (mm)", "Kopf und Hals zum Gerät", "min", " mm"),
    ("Socke: Löcher über dem Schuh (Punkte)", "Socke: Löcher über dem Schuh (Punkte)", "max", ""),
    ("Polster: tiefste Delle (mm)", "Polster: tiefste Delle", "spanne", " mm"),
    ("Polster: Haut oder Kleidung durch die Oberfläche (mm)", "Haut oder Kleidung durch das Polster", "max", " mm"),
    # Familie „Rumpf“ (D-466)
    ("Körperlinie: Hüfte über der Linie Schulter–Fußgelenk (cm)", "Hüfte über der Linie Schulter–Fußgelenk", "spanne", " cm"),
    ("Körper steigt zu den Schultern (Grad)", "Körper steigt zu den Schultern", "spanne", "°"),
    ("Ellbogen vor der Schulter (cm, + zum Kopf)", "Ellbogen vor der Schulter", "spanne", " cm"),
    ("Oberarm zur Senkrechten (Grad)", "Oberarm zur Senkrechten", "max", "°"),
    ("Unterarm auf der Matte (mm)", "Unterarm auf der Matte (unter 0 = Luft)", "spanne", " mm"),
    ("Faust auf der Matte (mm)", "Faust auf der Matte (unter 0 = Luft)", "spanne", " mm"),
    ("Hand auf der Matte (mm)", "Handfläche auf der Matte (unter 0 = Luft)", "spanne", " mm"),
    ("Finger auf der Matte (mm, alle)", "Finger auf der Matte, alle (unter 0 = Luft)", "spanne", " mm"),
    ("Unterarme zueinander (Grad)", "Unterarme zueinander (parallel = 0)", "max", "°"),
    ("Körper sonst über der Matte (mm)", "Körper sonst über der Matte", "min", " mm"),
    ("Sohle: tiefster Punkt über der Matte (mm)", "Schuh: tiefster Punkt über der Matte", "spanne", " mm"),
    ("Sohle L: Ferse auf der Matte (mm)", "Sohle links: Ferse auf der Matte", "spanne", " mm"),
    ("Sohle L: Ballen auf der Matte (mm)", "Sohle links: Ballen auf der Matte", "spanne", " mm"),
    ("Oberkörper zur Matte (Grad)", "Oberkörper zur Matte", "spanne", "°"),
    ("Unterer Rücken auf der Matte (mm, schwächste Stelle)", "Lende auf der Matte, schwächste Stelle (unter 0 = Lücke)",
     "spanne", " mm"),
    ("Gesäß auf der Matte (mm)", "Gesäß auf der Matte", "spanne", " mm"),
    ("Gesäß ohne Abflachen (mm)", "Gesäß ohne Abflachen (Gewebe gibt so weit nach)", "spanne", " mm"),
    ("Untere Brustwirbel auf der Matte (mm, unter 0 = abgehoben)", "Untere Brustwirbel auf der Matte", "spanne", " mm"),
    ("Schulterblätter auf der Matte (mm, unter 0 = abgehoben)", "Schulterblätter auf der Matte (unter 0 = abgehoben)",
     "spanne", " mm"),
    ("Schulterblätter ohne Abflachen (mm)", "Schulterblätter ohne Abflachen", "spanne", " mm"),
    ("Hände über der Matte (mm)", "Hände über der Matte", "spanne", " mm"),
    ("Hand links auf dem Shirt (mm, unter 0 = eingedrückt)", "Hand links auf dem Shirt (unter 0 = eingedrückt)", "spanne", " mm"),
    ("Hand rechts auf dem Shirt (mm, unter 0 = eingedrückt)", "Hand rechts auf dem Shirt (unter 0 = eingedrückt)", "spanne", " mm"),
    ("Unterarm rechts auf dem linken (mm, unter 0 = ineinander)", "Unterarm rechts auf dem linken", "spanne", " mm"),
    ("Unterarme und Hände über dem Shirt (mm, unter 0 = im Shirt)", "Unterarme und Hände über dem Shirt", "min", " mm"),
    ("Handgelenk gesamt (Grad, links)", "Handgelenk links, gesamt", "max", "°"),
    ("Handgelenk gesamt (Grad, rechts)", "Handgelenk rechts, gesamt", "max", "°"),
    ("Kopf (Haare) auf der Matte (mm, unter 0 = abgehoben)", "Kopf auf der Matte (unter 0 = abgehoben)", "spanne", " mm"),
    ("Kinn zum Brustbein (cm)", "Kinn zum Brustbein", "min", " cm"),
    ("Matte: Auflage vom Rand (cm, mindestens)", "Auflage vom Rand der Matte", "min", " cm"),
    ("Matte: tiefste Delle (mm)", "Matte: tiefste Delle", "max", " mm"),
    ("Matte: Haut, Kleidung oder Schuh durch die Oberfläche (mm)", "Haut, Kleidung oder Schuh durch die Matte", "max", " mm"),
    # Familie „Schulter und Brust isoliert“ (D-468)
    ("Armhebung (Grad, 0 = hängend)", "Armhebung (0 = hängend)", "spanne", "°"),
    ("Oberarm zur Waagrechten (Grad, + darüber)", "Oberarm oben zur Waagrechten (+ darüber)", "max", "°"),
    ("Ellbogen über dem Schultergelenk (cm)", "Ellbogen oben über dem Schultergelenk", "max", " cm"),
    ("Ellbogen über dem Handgelenk (cm)", "Ellbogen über dem Handgelenk (unter 0 = darunter)", "min", " cm"),
    ("Oberarm vor der Ebene der Schultern (Grad, ab 60° Armhebung)", "Oberarm vor der Ebene der Schultern (ab 60°)", "spanne",
     "°"),
    ("Rumpfneigung (Grad)", "Rumpf vorgeneigt", "spanne", "°"),
    ("Schlüsselbein gehoben (Grad)", "Schlüsselbein gehoben", "spanne", "°"),
    ("Griffe auseinander (cm)", "Griffe auseinander", "spanne", " cm"),
    ("Kurzhantel: Köpfe vor Haut und Kleidung (mm)", "Köpfe vor Haut, Shorts und Shirt", "min", " mm"),
    # Familie „Waagrechtes Ziehen“ (D-470)
    ("Rumpf zur Senkrechten (Grad, + nach vorn)", "Rumpf zur Senkrechten (+ nach vorn)", "spanne", "°"),
    ("Lende gebeugt (Grad)", "Lende gebeugt", "spanne", "°"),
    ("Schlüsselbein zurück (Grad)", "Schlüsselbein zurück (Schulterblätter)", "spanne", "°"),
    ("Oberarm hinter dem Rumpf (Grad)", "Oberarm hinter dem Rumpf (Ende)", "max", "°"),
    ("Ellbogen hinter dem Schultergelenk (cm)", "Ellbogen hinter dem Schultergelenk (Ende)", "max", " cm"),
    ("Griff über dem Sitz (cm)", "Griff über dem Sitz", "spanne", " cm"),
    ("Weg des Griffs (cm)", "Weg des Griffs", "max", " cm"),
    ("Hände und Griff vor dem Shirt (mm)", "Hände und Griff vor dem Shirt", "min", " mm"),
    ("Hände, Unterarme und Griff über den Beinen (mm)", "Hände, Unterarme und Griff über Beinen und Shorts", "min", " mm"),
    ("Kabel: Abstand zu Beinen, Shorts und Schuhen (mm)", "Kabel zu Beinen, Shorts und Schuhen", "min", " mm"),
    # Kleidung (D-478, D-480): Shorts unter dem Shirt, Saumband über den Shorts, Haut unter dem Ärmel
    ("Shorts unter dem Shirt (mm, negativ = durch)", "Shorts unter dem Shirt (unter 0 = durch)", "min", " mm"),
    ("Saumband über den Shorts (mm, negativ = in den Shorts)", "Saumband über den Shorts (unter 0 = darin)", "min", " mm"),
    ("Haut unter dem Ärmel am Saum (mm, negativ = durch)", "Haut unter dem Ärmel (unter 0 = durch)", "min", " mm"),
    # Familie „Hüftbeuge“ (D-487)
    ("Hüfte (Rumpf zum Oberschenkel, Grad, 180 = gestreckt)", "Hüfte, Rumpf zum Oberschenkel (180 = gestreckt)", "spanne",
     "°"),
    ("Rumpf zur Waagrechten (Grad)", "Rumpf zur Waagrechten", "spanne", "°"),
    ("Unterschenkel zur Senkrechten (Grad)", "Unterschenkel zur Senkrechten", "spanne", "°"),
    ("Schwerpunkt über der Fußmitte (cm, + dahinter)", "Schwerpunkt mit Hanteln über der Fußmitte (+ dahinter)", "spanne",
     " cm"),
    ("Hanteln über der Fußmitte (cm, + dahinter)", "Hanteln über der Fußmitte (+ dahinter)", "spanne", " cm"),
    ("Griffe unter dem Kniegelenk (cm)", "Griffe unter dem Kniegelenk", "spanne", " cm"),
    ("Arme vor der Senkrechten (Grad)", "Arme vor der Senkrechten (unter 0 = zurück)", "spanne", "°"),
    ("Kurzhanteln zueinander (mm)", "Hanteln zueinander", "min", " mm"),
    # Lende, Nacken und Blick (D-490)
    ("Lende: Wirbel gegen das Becken gedreht (Grad)", "Lende: Wirbel gegen das Becken gedreht", "max", "°"),
    ("Lende: Krümmung gegenüber dem Stand (Grad, + flacher)", "Lende: Krümmung gegenüber dem Stand (+ flacher)",
     "spanne", "°"),
    ("Lende: Hautlinie gegenüber dem Stand verschoben (mm)", "Lende: Hautlinie gegenüber dem Stand verschoben",
     "max", " mm"),
    ("Nacken: Kopf gegen den Rumpf gebeugt (Grad)", "Nacken: Kopf gegen den Rumpf gebeugt", "spanne", "°"),
    ("Blick unter der Waagrechten (Grad)", "Blick unter der Waagrechten", "spanne", "°"),
    # Familie „Senkrechtes Drücken“: Schulterdrücken an der Maschine (D-491)
    ("Oberarm zur Waagrechten (Grad, + darüber, ganze Bewegung)", "Oberarm zur Waagrechten (+ darüber)", "spanne", "°"),
    ("Hebel der Maschine gedreht (Grad)", "Hebel gedreht", "spanne", "°"),
    ("Oberarm vor der Ebene der Schultern (Grad, bis 30° über der Waagrechten)",
     "Oberarm vor der Ebene der Schultern (bis 30° über der Waagrechten)", "spanne", "°"),
    ("Griffe über dem Schultergelenk (cm)", "Griffe über dem Schultergelenk", "spanne", " cm"),
    ("Griffe vor dem Schultergelenk (cm)", "Griffe vor dem Schultergelenk", "spanne", " cm"),
    ("Rücken im Polster (mm)", "Rücken mit Shirt im Polster", "max", " mm"),
    ("Arme zu Hebeln, Griffen und Rahmen (mm)", "Arme zu Hebeln, Griffen und Rahmen", "min", " mm"),
    ("Finger: geringster Abstand zum Griff (mm, negativ = eingedrückt)", "Finger am Griff (gewollt 4 mm eingedrückt)",
     "min", " mm"),
    # Familie „Senkrechtes Ziehen“: Klimmzüge mit Unterstützung (D-508)
    ("Lehne zurück", "Oberkörper zurückgelehnt", "spanne", "°"),
    ("Griffe über der Mitte des Halses (cm)", "Griffe über der Mitte des Halses", "spanne", " cm"),
    ("Polster über dem Boden (cm)", "Kniepolster über dem Boden", "spanne", " cm"),
    ("Polster gegenüber dem Ausgang gehoben (cm)", "Kniepolster gehoben", "max", " cm"),
    ("Ohr über dem Schultergelenk (cm)", "Ohr über dem Schultergelenk (Schultern unten: größer)", "spanne", " cm"),
    ("Ohr über dem Schultergelenk im Stand (cm)", "Ohr über dem Schultergelenk im Stand", "max", " cm"),
    ("Brust hinter der Linie der Griffe (cm, unter 0 = davor)", "Brust hinter der Linie der Griffe (unter 0 = davor)", "spanne",
     " cm"),
    ("Halsgrube unter den Griffen (cm)", "Halsgrube unter den Griffen", "spanne", " cm"),
    ("Hüfte waagrecht gegenüber dem Ausgang (cm, + zum Turm)", "Hüfte waagrecht gegenüber dem Ausgang (+ zum Turm)", "spanne",
     " cm"),
    ("Körpermitte hinter der Linie der Griffe (cm)", "Körpermitte (Mittel aller Punkte) hinter der Linie der Griffe", "spanne",
     " cm"),
    # Hackenschmidt-Kniebeuge (D-511)
    ("Knie vor der Zehenspitze (cm, längs des Fußes)", "Knie vor der Zehenspitze (unter 0 = dahinter)", "spanne", " cm"),
    ("Oberschenkel zur Platte (Grad, + Knie höher)", "Oberschenkel zur Platte (unter 0 = Hüfte höher)", "spanne", "°"),
    ("Gesäß im Polster (mm)", "Gesäß im Rückenpolster", "spanne", " mm"),
    ("Schulterpolster L auf der Schulter (mm)", "Schulterpolster auf der Schulter (links)", "spanne", " mm"),
    ("Schulterpolster R auf der Schulter (mm)", "Schulterpolster auf der Schulter (rechts)", "spanne", " mm"),
    ("Arme zur Maschine (mm, ohne Polster und Griffe)", "Arme zur Maschine (ohne Polster und Griffe)", "min", " mm"),
    ("Beine, Shorts und Socken zur Maschine (mm, ohne Fußplatte)", "Beine, Shorts und Socken zur Maschine (ohne Platte)", "min",
     " mm"),
    ("Kopf und Haare zur Maschine (mm, ohne Polster)", "Kopf und Haare zur Maschine (ohne Polster)", "min", " mm"),
    # Dips mit Unterstützung (D-510)
    ("Oberarm zum Rumpf (Grad)", "Oberarm zum Rumpf (Schulter gestreckt)", "spanne", "°"),
    ("Lehne vor", "Oberkörper vorgeneigt", "spanne", "°"),
    ("Ellbogen hinter dem Handgelenk (cm)", "Ellbogen hinter dem Handgelenk", "spanne", " cm"),
    ("Ellbogen neben dem Handgelenk (cm, + außen)", "Ellbogen neben dem Handgelenk (+ außen)", "spanne", " cm"),
    ("Schultergelenk vor der Mitte des Griffs (cm)", "Schultergelenk vor der Mitte des Griffs", "spanne", " cm"),
    ("Schultergelenk über der Mitte des Griffs (cm)", "Schultergelenk über der Mitte des Griffs", "spanne", " cm"),
    ("Hände auseinander (cm)", "Hände auseinander (Mitte der Griffe)", "max", " cm"),
    ("Polster gegenüber dem Ausgang gesenkt (cm)", "Kniepolster gesenkt", "max", " cm"),
    ("Ohr über dem Schultergelenk längs des Rumpfs (cm)", "Ohr über dem Schultergelenk längs des Rumpfs (Schultern unten: größer)",
     "spanne", " cm"),
    ("Ohr über dem Schultergelenk längs des Rumpfs im Stand (cm)", "Ohr über dem Schultergelenk längs des Rumpfs im Stand", "max",
     " cm"),
    ("Körpermitte hinter der Mitte der Griffe (cm)", "Körpermitte (Mittel aller Punkte) hinter der Mitte der Griffe", "spanne",
     " cm"),
    ("Arme zur Maschine (mm, ohne die Dipgriffe)", "Arme zur Maschine (ohne die Dipgriffe)", "min", " mm"),
    ("Rumpf, Beine, Kleidung und Schuhe zur Maschine (mm, ohne Polster und Dipgriffe)",
     "Rumpf, Beine, Kleidung und Schuhe zur Maschine (ohne Polster und Dipgriffe)", "min", " mm"),
    ("Kopf und Hals zur Maschine (mm)", "Kopf und Hals zur Maschine", "min", " mm"),
    ("Arme zur Maschine (mm)", "Arme zur Maschine", "min", " mm"),
    ("Körper, Kleidung und Schuhe zur Maschine (mm, ohne Polster und Griffe)",
     "Körper, Kleidung und Schuhe zur Maschine (ohne Polster und Griffe)", "min", " mm"),
    # Beine isoliert: Beinstrecker, Beinbeuger sitzend, Wadenheben (D-514)
    ("Sprunggelenk gebeugt (Grad, + Fußspitzen zum Schienbein)", "Sprunggelenk (+ Fußspitzen zum Schienbein)", "spanne", "°"),
    ("Gewichtsblock gehoben (cm)", "Gewichtsblock gehoben", "max", " cm"),
    ("Unterschenkel zum Sitz (mm, negativ = darin)", "Unterschenkel zum Sitz (unter 0 = darin)", "min", " mm"),
    ("Oberschenkelpolster: Haut und Shorts (mm, negativ = eingedrückt)", "Oberschenkelpolster auf Haut und Shorts (unter 0 = darin)",
     "spanne", " mm"),
    ("Schuhe zum Gerät ohne Rolle (mm)", "Schuhe zum Gerät (ohne Rolle)", "min", " mm"),
    ("Sprunggelenk (Grad, + gebeugt, − gestreckt)", "Sprunggelenk (+ gebeugt, − gestreckt)", "spanne", "°"),
    ("Fuß geneigt (Grad, + Ferse hoch)", "Fuß geneigt (+ Ferse hoch)", "spanne", "°"),
    ("Körper gehoben (cm, gegenüber dem flachen Fuß)", "Körper gehoben (gegenüber dem flachen Fuß)", "spanne", " cm"),
    ("Sohle über dem Block: tiefster Punkt über der Oberseite (mm, negativ = darin)",
     "Sohle über dem Block: tiefster Punkt über der Oberseite", "spanne", " mm"),
    ("Sohle: Spitze über der Oberseite des Blocks (mm)", "Schuhspitze über dem Block", "spanne", " mm"),
    ("Ferse: Unterkante zur Oberseite des Blocks (cm, + darüber)", "Ferse zur Oberseite des Blocks (+ darüber)", "spanne", " cm"),
    ("Bogen am Ballen: Abweichung der Sohle vorn von starr (mm)", "Bogen am Ballen: Vorfuß starr (Abweichung)", "max", " mm"),
    ("Schulterpolster: tiefste Delle (mm)", "Schulterpolster: tiefste Delle", "max", " mm"),
    ("Schulterpolster: Haut, Shirt oder Haare durch die Oberfläche (mm)", "Schulterpolster: etwas durch die Oberfläche", "max",
     " mm"),
    ("Kopf und Haare zum Gerät ohne Polster (mm)", "Kopf und Haare zum Gerät (ohne Polster)", "min", " mm"),
    ("Oberschenkel zur Waagrechten (Grad, + Knie höher)", "Oberschenkel zur Waagrechten (+ Knie höher)", "spanne", "°"),
    ("Kniepolster: gleiten längs des Oberschenkels (mm)", "Kniepolster gleiten längs des Oberschenkels", "max", " mm"),
    ("Kniepolster: Haut und Shorts (mm, negativ = eingedrückt)", "Kniepolster auf Haut und Shorts (unter 0 = darin)", "spanne",
     " mm"),
    # Arme beugen und strecken: Curls, Trizepsdrücken am Kabel (D-515)
    ("Oberarm vor der Senkrechten (Grad)", "Oberarm vor der Senkrechten", "spanne", "°"),
    ("Oberarm zur Seite (Grad)", "Oberarm zur Seite", "spanne", "°"),
    ("Unterarm zur Senkrechten (Grad, 0 = nach oben)", "Unterarm zur Senkrechten (0 = nach oben)", "spanne", "°"),
    ("Unterarm gedreht (Grad)", "Unterarm gedreht", "spanne", "°"),
    ("Handgelenk am Ziel (mm)", "Handgelenk am Ziel (Abweichung)", "max", " mm"),
    ("Oberarm vor dem Rumpf (Grad)", "Oberarm vor dem Rumpf", "spanne", "°"),
    ("Unterarm zur Senkrechten (Grad, 0 = nach unten)", "Unterarm zur Senkrechten (0 = nach unten)", "spanne", "°"),
    ("Kabel zur Senkrechten (Grad)", "Kabel zur Senkrechten", "spanne", "°"),
    ("Ellbogen am Rumpf (mm, Haut zu Haut)", "Ellbogen am Rumpf (Haut zu Haut)", "spanne", " mm"),
    ("Stange zur Kleidung (mm)", "Stange zur Kleidung", "min", " mm"),
    ("Stange zur Haut (mm)", "Stange zur Haut", "min", " mm"),
    ("Kabel zu Kopf und Haaren (mm)", "Kabel zu Kopf und Haaren", "min", " mm"),
    ("Ellbogen weg vom festen Punkt (mm)", "Ellbogen weg vom festen Punkt", "max", " mm"),
    # Waagrechtes Ziehen für Dali’s PPLC (D-518)
    ("Oberarm hinter dem Rumpf (Grad, + zum Rücken)", "Oberarm hinter dem Rumpf (+ zum Rücken)", "spanne", "°"),
    ("Ellbogen vom Rumpf weg (Grad, Oberarm zur Ebene längs des Rumpfs)", "Ellbogen vom Rumpf zur Seite", "spanne", "°"),
    ("Oberarm vom Rumpf zur Seite (Grad)", "Oberarm vom Rumpf zur Seite", "spanne", "°"),
    ("Unterarm zur Waagrechten (Grad, + Hand höher)", "Unterarm zur Waagrechten (+ Hand höher)", "spanne", "°"),
    ("Stange über der Fußmitte (cm, + dahinter)", "Stange über der Fußmitte (+ dahinter)", "spanne", " cm"),
    ("Stange zur Haut ohne Hände (mm)", "Stange zur Haut (ohne Hände)", "min", " mm"),
    ("Scheiben über dem Boden (mm)", "Scheiben über dem Boden", "min", " mm"),
    ("Scheiben zur Haut (mm)", "Scheiben zur Haut", "min", " mm"),
    ("Brust im Polster (mm)", "Brust im Polster", "spanne", " mm"),
    ("Arme zum Brustpolster (mm)", "Arme zum Brustpolster", "min", " mm"),
    ("Körper und Shirt zur Maschine ohne Polster und Griffe (mm)", "Körper und Shirt zur Maschine (ohne Polster und Griffe)",
     "min", " mm"),
    # Schulter und Brust isoliert für Dali’s PPLC (D-519)
    ("Oberarm vor der Ebene der Schultern (Grad, waagrecht gemessen)", "Oberarm vor der Ebene der Schultern (waagrecht)",
     "spanne", "°"),
    ("Oberarm vor der Ebene der Schultern (Grad, waagrecht)", "Oberarm vor der Ebene der Schultern (waagrecht)", "spanne", "°"),
    ("Kabel zur Haut ohne Hände (mm)", "Kabel zur Haut (ohne Hände)", "min", " mm"),
    ("Kabel zur Kleidung (mm)", "Kabel zur Kleidung (gesucht bis 50 mm)", "min", " mm"),
    ("D-Griff: Streben zur Haut (mm, Mitte der Strebe)", "Streben des D-Griffs zur Haut", "min", " mm"),
    ("D-Griff um die Stange gekippt (Grad)", "D-Griff um die Stange gekippt (liegt am Handgelenk an)", "max", "°"),
    ("Hände zueinander (mm)", "Hände zueinander", "min", " mm"),
    ("Kabel: Block gehoben (cm)", "Gewichtsblock gehoben", "max", " cm"),
    # Senkrechtes Drücken für Dali’s PPLC (D-522)
    ("Oberarm vor der Ebene der Schultern (Grad)", "Oberarm vor der Ebene der Schultern", "spanne", "°"),
    ("Griffe über dem Kinn (cm)", "Griffe über dem Kinn", "spanne", " cm"),
    ("Rücken in der Lehne (mm)", "Rücken in der Lehne", "spanne", " mm"),
    ("Hinterkopf vor der Lehne (mm)", "Hinterkopf vor der Lehne (unter 0 = am Polster)", "spanne", " mm"),
    ("Köpfe der Hanteln zur Haut ohne Hände (mm)", "Köpfe der Hanteln zur Haut (ohne Hände)", "min", " mm"),
    ("Köpfe der Hanteln zu den Haaren (mm)", "Köpfe der Hanteln zu den Haaren", "min", " mm"),
    ("Hanteln zueinander (mm, innere Köpfe)", "Hanteln zueinander (innere Köpfe)", "min", " mm"),
    ("Arme zur Bank (mm)", "Arme zur Bank", "min", " mm"),
    ("Stange vor dem Schultergelenk (cm)", "Stange vor dem Schultergelenk", "spanne", " cm"),
    ("Stange über dem Boden (cm)", "Stange über dem Boden", "spanne", " cm"),
    ("Gesicht, Hals und Haare vor der Stange (mm)", "Gesicht, Hals und Haare vor der Stange", "min", " mm"),
    ("Kopf zurück (Grad)", "Kopf zurück (Hals gestreckt, Blick geradeaus)", "max", "°"),
    ("Rumpf zur Senkrechten (Grad, + nach hinten)", "Rumpf zur Senkrechten (+ nach hinten)", "spanne", "°"),
    ("Lende: Krümmung der Hautlinie (Grad, negativ = hohl)", "Lende: Hautlinie (unter 0 = hohl)", "spanne", "°"),
    # Hüftbeuge für Dali’s PPLC (D-523)
    ("Arm zur Senkrechten (Grad, + Hand hinter der Schulter)", "Arm zur Senkrechten (+ Hand hinter der Schulter)", "spanne", "°"),
    ("Hüfte über den Knien (cm)", "Hüfte über den Knien", "spanne", " cm"),
    ("Schultern vor der Stange (cm)", "Schultern vor der Stange", "spanne", " cm"),
)


def _zahl(w: float, einheit: str) -> str:
    if abs(w) < 0.05:  # gerundet 0: ohne Vorzeichen (sonst „−0,0“)
        w = 0.0
    text = f"{w:.1f}".replace(".", ",").replace("-", "−")
    return f"{text}{einheit}"


def messtabelle(messwerte: Path, breite: int) -> Image.Image:
    """Tabelle der Messwerte aller Bilder einer Schleife (nur Schlüssel, die es gibt)."""
    import json
    import math

    daten = json.loads(messwerte.read_text(encoding="utf-8"))
    bilder = daten["bilder"]
    zeilen = []
    for schluessel, text, art, einheit in MESSWERTE:
        werte = [b[schluessel] for b in bilder if isinstance(b.get(schluessel), (int, float))
                 and not (isinstance(b[schluessel], float) and math.isnan(b[schluessel]))]
        if not werte:
            continue
        if art == "spanne":
            wert = f"{_zahl(min(werte), einheit)} bis {_zahl(max(werte), einheit)}"
        elif art == "min":
            wert = _zahl(min(werte), einheit)
        elif art == "max":
            wert = _zahl(max(werte), einheit)
        else:
            wert = _zahl(max(abs(w) for w in werte), einheit)
        zeilen.append((text, wert))
    verschiebung = [v for k, v in daten.items() if k.endswith("größte Verschiebung über die Schleife (mm)")]
    if verschiebung:
        platte = any("auf der Platte" in k for k in bilder[0])
        text = "Füße auf der Platte verschoben" if platte else "Sohle: Verschiebung über die Schleife"
        zeilen.append((text, _zahl(verschiebung[0], " mm")))
    meldungen = sum(len(b.get("Meldungen", [])) for b in bilder)
    zeilen.append(("Meldungen des Rigs", str(meldungen)))
    f = schrift(15)
    spalten = 2
    je = (len(zeilen) + spalten - 1) // spalten
    hoehe = 34 + je * 24 + 8
    feld = Image.new("RGB", (breite, hoehe), GRUND)
    d = ImageDraw.Draw(feld)
    d.text((10, 6), f"Messwerte über alle {len(bilder)} Bilder der Schleife", fill=TEXT, font=schrift(17, True))
    for i, (text, wert) in enumerate(zeilen):
        x = 10 + (i // je) * (breite // spalten)
        y = 34 + (i % je) * 24
        d.text((x, y), text, fill=LEISE, font=f)
        d.text((x + breite // spalten - 190, y), wert, fill=TEXT, font=f)
    return feld


# Beschriftung der Nahaufnahmen (Dateien aus `familie_bilder.py` und `render.py --pruefen`)
GRIFF_TEXT = {"handflaeche": "Griff von der Handfläche", "handruecken": "Griff vom Handrücken", "aussen": "Griff von außen",
              "oben": "Griff von oben", "unterarm_aussen": "Unterarm und Hand von außen",
              "unterarm_vorn": "Unterarm und Hand von vorn", "ruecken_seite": "Lende und Becken von der Seite",
              "ruecken_schraeg": "Rücken schräg vom Kopf her", "griff_vorn": "Griff und Hantel von vorn",
              "griff_seite": "Griff und Hantel von außen", "vgriff_seite": "V-Griff und Hände von der Seite",
              "vgriff_vorn": "V-Griff und Hände schräg von vorn", "beingriff_aussen": "Hand am Griff von außen",
              "beingriff_vorn": "Hand am Griff von vorn", "presse_vorn": "Hand am Griff von vorn",
              "presse_aussen": "Hand am Griff von außen", "klimmzug_vorn": "Hand am Griff von vorn",
              "klimmzug_hinten": "Hand am Griff von hinten", "dip_aussen": "Hand am Dipgriff von außen",
              "dip_hinten": "Hand am Dipgriff von hinten", "hack_vorn": "Hand am Griff von vorn",
              "hack_aussen": "Hand am Griff von außen", "sitzgriff_aussen": "Hand am Sitzgriff von außen",
              "sitzgriff_vorn": "Hand am Sitzgriff von vorn", "waden_hand": "Hand am Griff von außen",
              "waden_hand_vorn": "Hand am Griff von vorn", "stange_schraeg": "Stange schräg von vorn",
              "stange_hinten": "Stange von hinten", "rudern_aussen": "Hand am Griff von außen",
              "rudern_hinten": "Hand am Griff von hinten", "butterfly_oben": "Griff von hinten oben",
              "butterfly_vorn": "Hand am Griff von vorn", "dgriff_vorn": "Hand am D-Griff von vorn",
              "dgriff_seite": "Hand am D-Griff von außen"}
FUSS_TEXT = {"90": "linker Fuß von außen", "0": "linker Fuß von vorn", "180": "linker Fuß von hinten",
             "270": "linker Fuß von innen"}


def familienblock(arbeit: Path, uebung: str, titel: str, breite: int) -> Image.Image:
    """Ein Block der Prüfseite: Positionen aus zwei Perspektiven, Griff und Fuß aus der Nähe, Messwerte."""
    zeilen: list[list[Image.Image]] = []
    b4 = breite // 4 - 8
    zeilen.append([zelle(arbeit / f"pruef-{a}-{p}.png", b4, f"{t} · {pt}")
                   for a, t in (("standard", "Kamera der App"), ("seite", "von der Seite"))
                   for p, pt in (("0.00", "Ausgangsposition"), ("1.00", "Endposition"))])
    import json

    daten = json.loads((arbeit / f"{uebung}-messwerte.json").read_text(encoding="utf-8"))
    griffe = [g for g in GRIFF_TEXT if (arbeit / f"pruef-griff-{g}-0.00.png").exists()][:2]
    fuesse = [str(a) for a in daten.get("fuss_ansichten", [90, 0])][:2]
    zeilen.append([zelle(arbeit / f"pruef-griff-{r}-{p}.png", b4, f"{GRIFF_TEXT[r]} · {pt}")
                   for p, pt in (("0.00", "Ausgangsposition"), ("1.00", "Endposition")) for r in griffe])
    zeilen.append([zelle(arbeit / f"pruef-fuss-{r}-{p}.png", b4, f"{FUSS_TEXT.get(r, r)} · {pt}")
                   for p, pt in (("0.00", "Ausgangsposition"), ("1.00", "Endposition")) for r in fuesse])
    zeilen.append([messtabelle(arbeit / f"{uebung}-messwerte.json", breite - 16)])
    hoehe = 44 + sum(max(z.height for z in zeile) + 8 for zeile in zeilen)
    block = Image.new("RGB", (breite, hoehe), GRUND)
    d = ImageDraw.Draw(block)
    d.text((10, 8), titel, fill=TEXT, font=schrift(22, True))
    y = 44
    for zeile in zeilen:
        x = (breite - sum(z.width + 8 for z in zeile) + 8) // 2
        for z in zeile:
            block.paste(z, (x, y))
            x += z.width + 8
        y += max(z.height for z in zeile) + 8
    return block


def familienblatt(arbeit: Path, uebungen: list[str], titel: str) -> Image.Image:
    import json

    breite = 1480
    bloecke = []
    for u in uebungen:
        name = json.loads((arbeit / u / f"{u}-messwerte.json").read_text(encoding="utf-8")).get("titel", u)
        bloecke.append(familienblock(arbeit / u, u, name, breite))
    kopf = 70
    gesamt = Image.new("RGB", (breite, kopf + sum(b.height + 12 for b in bloecke)), GRUND)
    d = ImageDraw.Draw(gesamt)
    d.text((16, 14), f"Prüfseite · {titel}", fill=TEXT, font=schrift(28, True))
    d.text((16, 48), "C männlich, Kleidung, Licht und Kamera wie bei den Pilot-Übungen; linke Hand und linker Fuß", fill=LEISE,
           font=schrift(15))
    y = kopf
    for b in bloecke:
        gesamt.paste(b, (0, y))
        y += b.height + 12
    return gesamt


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("uebungen", nargs="+")
    ap.add_argument("--arbeit", default="/tmp/uebungen-3d")
    ap.add_argument("--ziel", default=str(HIER.parent / "docs/screens/uebungen"))
    ap.add_argument("--familie", help="Prüfseite einer Familie: Name der Datei familie-<Name>.webp")
    ap.add_argument("--titel", default="", help="Name der Familie auf der Prüfseite")
    args = ap.parse_args()
    if args.familie:
        speichern(familienblatt(Path(args.arbeit), args.uebungen, args.titel), Path(args.ziel), f"familie-{args.familie}")
        return
    for u in args.uebungen:
        speichern(blatt(Path(args.arbeit) / u), Path(args.ziel), f"pruef-{u}")


if __name__ == "__main__":
    main()
