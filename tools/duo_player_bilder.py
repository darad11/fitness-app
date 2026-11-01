#!/usr/bin/env python3
"""Bilder für D-495 und D-496 aus zwei Rundgängen (`tools/duo-player-rundgang.mjs`): korrigierte
Ansichten in den Größen des Duo, vorher und nachher, weitere Befunde. Die Bildschirmfotos (Faktor 2)
zeigen das Fenster; die Systemstreifen daneben (rechts 84 pt, quer zeitweise oben 82 pt, D-393)
werden dunkel ergänzt, damit die Mitte des ganzen Bildschirms sichtbar ist (feine Linie in Lime).

    python3 tools/duo_player_bilder.py <rundgang> <rundgang-vorher> docs/screens/duo
"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw

from uebungen_paket_bild import gitter, kachel, schrift, speichern

NEU, ALT, ZIEL = (Path(a) for a in sys.argv[1:4])
F = 2  # Faktor der Bildschirmfotos
STREIFEN = (5, 8, 12)
LIME = (199, 255, 70)

LAGEN = {
    'duo-quer': {'rechts': 84, 'oben': 0},
    'duo-quer-oben': {'rechts': 84, 'oben': 82},
    'duo-hoch': {'rechts': 0, 'oben': 82},
    'duo-zu': {'rechts': 84, 'oben': 0},
}


def bildschirm(datei: Path, lage: str, mitte: bool = False) -> Image.Image:
    """Fenster plus Systemstreifen, wahlweise mit der Mitte des ganzen Bildschirms."""
    fenster = Image.open(datei).convert('RGB')
    s = LAGEN[lage]
    r, o = s['rechts'] * F, s['oben'] * F
    ganz = Image.new('RGB', (fenster.width + r, fenster.height + o), STREIFEN)
    ganz.paste(fenster, (0, o))
    d = ImageDraw.Draw(ganz)
    klein = schrift(18)
    if r:
        d.text((fenster.width + 12, o + 14), 'Streifen', fill=(120, 128, 140), font=klein)
    if o:
        d.text((14, 12), 'Streifen oben', fill=(120, 128, 140), font=klein)
    if mitte:
        mx, my = ganz.width // 2, ganz.height // 2
        for y in range(0, ganz.height, 14):
            d.line([(mx, y), (mx, y + 7)], fill=LIME, width=2)
        for x in range(0, ganz.width, 14):
            d.line([(x, my), (x + 7, my)], fill=LIME, width=2)
    return ganz


def datei(ordner: Path, lage: str, schritt: str) -> Path:
    return next(ordner.glob(f'{lage}-[0-9][0-9]-{schritt}.png'))


B, H = 476, 335  # Kachel für quer (951 × 669 pt, halbe Größe)

# 1) Duo aufgeklappt quer: die korrigierten Ansichten.
quer = [
    ('start', 'Start: rechte Spalte passt über die Fußleiste', False),
    ('scroll-ende', 'Seitenende: Spalte steht wie am Anfang', False),
    ('pause-klein', 'Pause klein: Animation skaliert mit', False),
    ('pause-gross', 'Pause groß: Mitte des Bildschirms', True),
    ('uebungsinfo', 'Übungsinfo: Mitte, Bild füllt den Rahmen', True),
    ('uebung-hinzufuegen', 'Übung hinzufügen: Blatt in der Mitte', True),
    ('naechste-uebung', 'Nächste Übung: neue Animation', False),
    ('beenden-rueckfrage', 'Training beenden: Rückfrage in der Mitte', True),
]
kacheln = [kachel(bildschirm(datei(NEU, 'duo-quer', s), 'duo-quer', m), t, B, H) for s, t, m in quer]
speichern(gitter(kacheln, 4, 'iPhone Duo aufgeklappt quer: Player nach D-495',
                 'Fenster 867 × 669 pt wie am Gerät gemessen (D-393), rechts der Systemstreifen; Linie in Lime: Mitte des ganzen Bildschirms'),
          ZIEL, 'player-duo-quer')

# 2) Weitere Lagen des Duo.
weitere = [
    ('duo-quer-oben', 'start', 'Quer mit Streifen oben (867 × 587): Spalte passt', False),
    ('duo-quer-oben', 'pause-gross', 'Quer mit Streifen oben: Pause in der Mitte', True),
    ('duo-hoch', 'start', 'Aufgeklappt hoch (669 × 869): eine Spalte', False),
    ('duo-hoch', 'pause-gross', 'Aufgeklappt hoch: Pause in der Mitte', True),
    ('duo-zu', 'start', 'Zugeklappt (382 × 678)', False),
    ('duo-zu', 'pause-gross', 'Zugeklappt: Pause in der Mitte, Knöpfe in zwei Zeilen', True),
    ('duo-zu', 'uebungsinfo', 'Zugeklappt: Übungsinfo in der Mitte', True),
    ('duo-zu', 'beenden-rueckfrage', 'Zugeklappt: Rückfrage in der Mitte', True),
]
kacheln = [kachel(bildschirm(datei(NEU, l, s), l, m), t, 360, 420) for l, s, t, m in weitere]
speichern(gitter(kacheln, 4, 'iPhone Duo: weitere Lagen nach D-495',
                 'Gemessene Fenster (D-393) mit den Systemstreifen daneben; Linie in Lime: Mitte des ganzen Bildschirms'),
          ZIEL, 'player-duo-lagen')

# 3) Vorher und nachher.
paare = [
    ('duo-quer', 'pause-gross', 'A · Pause groß', True),
    ('duo-quer', 'uebungsinfo', 'A, B · Übungsinfo', True),
    ('duo-quer', 'scroll-ende', 'C, D · Seitenende', False),
    ('duo-zu', 'pause-gross', 'A · Pause groß, zugeklappt', True),
]
kacheln = []
for lage, schritt, titel, mitte in paare:
    for ordner, wann in ((ALT, 'vorher'), (NEU, 'nachher')):
        b, h = (B, H) if lage.startswith('duo-quer') else (300, 440)
        kacheln.append(kachel(bildschirm(datei(ordner, lage, schritt), lage, mitte), f'{titel} · {wann}', b, h))
speichern(gitter(kacheln, 4, 'Befunde A bis D: vorher (b9eb461) und nachher (D-495)',
                 'Gleiche Schritte, gleiche Lage; Linie in Lime: Mitte des ganzen Bildschirms'),
          ZIEL, 'player-vorher-nachher')

# 4) Weitere Befunde aus dem Rundgang (D-496).
kacheln = [
    kachel(Image.open(datei(NEU, 'duo-quer', 'pause-klein')).convert('RGB'),
           'E1 · Duo quer, Pause rechts: „Ziel“ / „5“ getrennt', 440, 270, kiste=(980, 200, 1720, 640)),
    kachel(Image.open(datei(NEU, 'iphone', 'start')).convert('RGB'),
           'E1 · iPhone, „Jetzt“: „Ziel“ / „10“ getrennt', 440, 270, kiste=(20, 380, 760, 760)),
    kachel(Image.open(datei(NEU, 'iphone', 'pause-klein')).convert('RGB'),
           'E2 · iPhone, kleine Pause: nur „Beinpresse,…“', 440, 270, kiste=(20, 220, 760, 540)),
    kachel(bildschirm(datei(NEU, 'duo-zu', 'beenden-rueckfrage'), 'duo-zu', True),
           'E3 · zugeklappt: Rückfrage 266 statt 350 pt breit', 440, 270, kiste=(0, 400, 932, 1000)),
    kachel(bildschirm(datei(NEU, 'duo-zu', 'uebungsinfo'), 'duo-zu', True),
           'E3 · zugeklappt: Übungsinfo schmaler', 440, 270, kiste=(0, 0, 932, 640)),
    kachel(Image.open(datei(NEU, 'duo-quer', 'start')).convert('RGB'),
           'E4 · Duo quer: „Als Nächstes“ hat keinen Platz', 440, 270, kiste=(990, 0, 1734, 1100)),
]
speichern(gitter(kacheln, 3, 'Rundgang durch den Player: weitere Befunde (D-496)',
                 'E1, E2 bestanden schon vor D-495; E3, E4 sind Folgen von A und D und zur Entscheidung'),
          ZIEL, 'player-weitere-befunde')
