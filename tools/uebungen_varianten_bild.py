#!/usr/bin/env python3
"""Vergleichsbilder der Varianten zur Probe (D-414) aus den Standbildern von
`tools/uebungen-3d/varianten_bilder.py`: je Moment der Bewegung ein Bild mit allen Varianten,
dazu eine Übersicht. Alle Kacheln eines Moments zeigen denselben Ausschnitt (gemeinsamer Bereich
von Figur und Gerät über alle Varianten, mit Rand), damit die Figuren groß und vergleichbar sind.
Mit `--zeiten` steht die Renderzeit je Bild aus einem eigenen Lauf (ein Prozess) unter dem Titel.
Hintergrund und Schrift in FORM-Farben (Inter, wenn vorhanden).

    python3 tools/uebungen_varianten_bild.py --arbeit /tmp/uebungen-varianten --zeiten /tmp/zeit \
        --ziel docs/screens/uebungen

Braucht Pillow (nur für dieses Werkzeug, nicht für die App).
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

HIER = Path(__file__).resolve().parent
sys.path.insert(0, str(HIER / "uebungen-3d"))

GRUND = (12, 18, 25)  # #0C1219
TEXT = (242, 243, 244)  # #F2F3F4
LEISE = (170, 178, 190)  # #AAB2BE
REIHENFOLGE = ["A", "B", "D-z", "D", "C-m-z", "C-m", "C-w-z", "C-w"]
TITEL = {
    "A": "A · neutral, grau, Zonen",
    "B": "B · männlich, grau, Zonen",
    "C-m-z": "C · männlich, real, Zonen",
    "C-m": "C · männlich, real",
    "C-w-z": "C · weiblich, real, Zonen",
    "C-w": "C · weiblich, real",
    "D-z": "D · grau, Kleidung, Zonen",
    "D": "D · grau, Kleidung",
}
MOMENTE = [
    ("kniebeuge", "1.00", "kniebeuge-unten", "Kniebeuge · tiefste Position"),
    ("bankdruecken", "0.00", "bank-oben", "Bankdrücken · Ausgangsposition"),
    ("bankdruecken", "1.00", "bank-unten", "Bankdrücken · Endposition"),
]


def schrift(groesse: int, fett: bool = False) -> ImageFont.FreeTypeFont:
    for pfad in ([f"/usr/share/fonts/opentype/inter/Inter-{'SemiBold' if fett else 'Regular'}.otf",
                  "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"]):
        if Path(pfad).exists():
            return ImageFont.truetype(pfad, groesse)
    return ImageFont.load_default()


def inhalt(bild: Image.Image) -> tuple[int, int, int, int] | None:
    """Rechteck der Pixel, die sich deutlich vom Hintergrund abheben (Figur, Gerät, Schatten)."""
    maske = Image.eval(bild.convert("L"), lambda v: 255 if abs(v - 16) > 10 else 0)
    return maske.getbbox()


def ausschnitt(bilder: list[Path], rand: float = 0.06) -> tuple[int, int, int, int]:
    """Gemeinsamer Ausschnitt aller Bilder eines Moments, im Seitenverhältnis 4 : 3."""
    kisten = [inhalt(Image.open(b)) for b in bilder if b.exists()]
    kisten = [k for k in kisten if k]
    w, h = Image.open(next(b for b in bilder if b.exists())).size
    x0, y0 = min(k[0] for k in kisten), min(k[1] for k in kisten)
    x1, y1 = max(k[2] for k in kisten), max(k[3] for k in kisten)
    bw, bh = (x1 - x0) * (1 + 2 * rand), (y1 - y0) * (1 + 2 * rand)
    if bw / bh < 4 / 3:
        bw = bh * 4 / 3
    else:
        bh = bw * 3 / 4
    bw, bh = min(bw, w), min(bh, h)
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    links = int(max(0, min(w - bw, cx - bw / 2)))
    oben = int(max(0, min(h - bh, cy - bh / 2)))
    return links, oben, links + int(bw), oben + int(bh)


def kachel(bild: Path, titel: str, breite: int, hoehe: int, zusatz: str = "",
           kiste: tuple[int, int, int, int] | None = None) -> Image.Image:
    rand = 44
    k = Image.new("RGB", (breite, hoehe + rand), GRUND)
    if bild.exists():
        b = Image.open(bild).convert("RGB")
        if kiste:
            b = b.crop(kiste)
        k.paste(b.resize((breite, hoehe), Image.LANCZOS), (0, rand))
    d = ImageDraw.Draw(k)
    d.text((10, 6), titel, fill=TEXT, font=schrift(17, True))
    if zusatz:
        d.text((10, 26), zusatz, fill=LEISE, font=schrift(13))
    return k


def blatt(arbeit: Path, uebung: str, phase: str, titel: str, zeiten: Path | None = None, spalten: int = 4,
          breite: int = 480, hoehe: int = 360) -> Image.Image:
    bilder = [arbeit / f"{v}-{uebung}-{phase}.png" for v in REIHENFOLGE]
    kiste = ausschnitt(bilder)
    kacheln = []
    for v, bild in zip(REIHENFOLGE, bilder):
        zeit = ""
        info = zeiten / f"{v}-kniebeuge.json" if zeiten else None
        if info and info.exists():
            werte = json.loads(info.read_text(encoding="utf-8"))
            s = werte["bild_s"].get("1.00")
            if s is not None:
                zeit = (f"Renderzeit {s:.0f} s je Bild ({werte['breite']} × {werte['hoehe']}, "
                        f"{werte['proben']} Proben, Kniebeuge unten)")
        kacheln.append(kachel(bild, TITEL[v], breite, hoehe, zeit, kiste))
    zeilen = (len(kacheln) + spalten - 1) // spalten
    kopf = 56
    w, h = kacheln[0].size
    gesamt = Image.new("RGB", (spalten * w + (spalten + 1) * 8, kopf + zeilen * (h + 8) + 8), GRUND)
    ImageDraw.Draw(gesamt).text((16, 14), titel, fill=TEXT, font=schrift(26, True))
    for i, k in enumerate(kacheln):
        gesamt.paste(k, (8 + (i % spalten) * (w + 8), kopf + (i // spalten) * (h + 8)))
    return gesamt


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--arbeit", default="/tmp/uebungen-varianten")
    ap.add_argument("--zeiten", help="Ordner mit <Variante>-kniebeuge.json aus einem Lauf mit einem Prozess")
    ap.add_argument("--ziel", default=str(HIER.parent / "docs/screens/uebungen"))
    args = ap.parse_args()
    arbeit, ziel = Path(args.arbeit), Path(args.ziel)
    zeiten = Path(args.zeiten) if args.zeiten else None
    ziel.mkdir(parents=True, exist_ok=True)
    blaetter = []
    for uebung, phase, datei, titel in MOMENTE:
        b = blatt(arbeit, uebung, phase, titel, zeiten)
        b.save(ziel / f"varianten-{datei}.webp", quality=82, method=6)
        blaetter.append(b)
    # Übersicht: alle drei Momente untereinander, verkleinert
    breite = max(b.width for b in blaetter)
    uebersicht = Image.new("RGB", (breite, sum(b.height for b in blaetter)), GRUND)
    y = 0
    for b in blaetter:
        uebersicht.paste(b, (0, y))
        y += b.height
    uebersicht = uebersicht.resize((uebersicht.width // 2, uebersicht.height // 2), Image.LANCZOS)
    uebersicht.save(ziel / "varianten-uebersicht.webp", quality=80, method=6)


if __name__ == "__main__":
    main()
