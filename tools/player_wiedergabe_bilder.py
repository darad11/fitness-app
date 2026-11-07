"""Bildblätter zu D-497 bis D-500 aus den Bildern von `tools/player-wiedergabe-bilder.mjs`.

    python3 -I tools/player_wiedergabe_bilder.py <bilderordner> <zielordner>

Ergebnis: `wiedergabe-schmal.webp` (iPhone und Duo zugeklappt) und `wiedergabe-aufgeklappt.webp`
(Duo aufgeklappt quer, mit Streifen und hoch), je Player, Übungsinfo nach zwei Durchläufen und
Übungsdetails.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from uebungen_paket_bild import gitter, kachel, speichern  # noqa: E402

QUELLE, ZIEL = Path(sys.argv[1]), Path(sys.argv[2])

schmal = [
    ('iphone', 'player', 'iPhone: Player, Schleife läuft'),
    ('iphone', 'uebungsinfo-angehalten', 'iPhone: Übungsinfo, angehalten'),
    ('iphone', 'details', 'iPhone: Details wie bisher'),
    ('duo-zu', 'player', 'Duo zu: Player, Schleife läuft'),
    ('duo-zu', 'uebungsinfo-angehalten', 'Duo zu: Übungsinfo, angehalten'),
    ('duo-zu', 'details', 'Duo zu: Details wie bisher'),
]
kacheln = [kachel(QUELLE / f'{lage}-{schritt}.png', titel, 330, 700) for lage, schritt, titel in schmal]
speichern(gitter(kacheln, 3, 'Player, Übungsinfo und Details schmal (D-497, D-498)',
                 'iPhone 390 × 844 und Duo zugeklappt 382 × 678, wie am Gerät gemessen (D-393)'),
          ZIEL, 'wiedergabe-schmal')

auf = [
    ('duo-quer', 'player', 'Duo quer beim Start (867 × 669): Player', 520, 400),
    ('duo-quer-streifen', 'player', 'Duo quer im Training (867 × 587): Player', 520, 400),
    ('duo-quer', 'uebungsinfo-angehalten', 'Duo quer: Übungsinfo nach zwei Durchläufen', 520, 400),
    ('duo-quer', 'details', 'Duo quer: Details, Muskelkarte daneben', 520, 400),
    ('duo-hoch', 'details', 'Duo hoch: Details, Muskelkarte daneben', 520, 400),
]
kacheln = [kachel(QUELLE / f'{lage}-{schritt}.png', titel, b, h) for lage, schritt, titel, b, h in auf]
speichern(gitter(kacheln, 2, 'Duo aufgeklappt: Player, Übungsinfo und Details (D-497 bis D-500)',
                 'Quer 867 × 669 und mit Streifen 867 × 587, hoch 669 × 869, wie am Gerät gemessen (D-393)'),
          ZIEL, 'wiedergabe-aufgeklappt')
