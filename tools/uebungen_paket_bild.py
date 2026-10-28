#!/usr/bin/env python3
"""Vergleichspaket der Korrekturrunde (D-420, `docs/prompts/uebungen-korrektur-logos-FORM.md` Abschnitt 9)
aus den Renderbildern von `tools/uebungen-3d/varianten_bilder.py`, `render.py --nur-vorschau` und
`nahaufnahme.py` sowie den App-Ansichten von `tools/uebungen-fassungen-screens.mjs`.

Ordner `<paket>/`: `bilder/<Fassung>-<Übung>-<Phase>.png` (720 × 540), `vorschau/<Übung>-<Fassung>-vorschau.webp`
(240 × 240), `nah/<Körper>-{brust-vorn,brust-app,ruecken,ruecken-lat,bein,hals}.png`,
`kante/<Körper>-{ohne,mit}.png`, `app/<Fassung>-{player-iphone,player-auf,liste,details}.png`.

    python3 tools/uebungen_paket_bild.py --paket /tmp/paket --app-medien /tmp/app-medien   # Medien je Fassung für die App
    python3 tools/uebungen_paket_bild.py --paket /tmp/paket --ziel docs/screens/uebungen       # die Blätter

Braucht Pillow und ffmpeg (nur für dieses Werkzeug, nicht für die App).
"""
from __future__ import annotations

import argparse
import json
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

HIER = Path(__file__).resolve().parent
GRUND = (12, 18, 25)  # #0C1219
TEXT = (242, 243, 244)  # #F2F3F4
LEISE = (170, 178, 190)  # #AAB2BE
KOERPER = [("D", "D · grau, neutral"), ("Cm", "C · männlich, MakeHuman"), ("Cw", "C · weiblich, MakeHuman")]
FASSUNGEN = [("A1", "A1 · Zonen Lime, Logos hell"), ("A2", "A2 · Zonen gedämpft, Logos Kollektion"),
             ("B", "B · ohne Zonen, Logos Kollektion")]
MOMENTE = [("kniebeuge", "1.00", "kniebeuge", "Kniebeuge · tiefste Position"),
           ("bankdruecken", "0.00", "bank-oben", "Bankdrücken · Ausgangsposition"),
           ("bankdruecken", "1.00", "bank-unten", "Bankdrücken · Endposition")]
PLAYER_BREITE = 390  # Breite des großen Players am iPhone, px (Übungsdetails, Duo aufgeklappt)
THUMB = 56  # Vorschaubild im kleinen Player und in der Übungsübersicht, px (3,5 rem)


def schrift(groesse: int, fett: bool = False) -> ImageFont.FreeTypeFont:
    for pfad in ([f"/usr/share/fonts/opentype/inter/Inter-{'SemiBold' if fett else 'Regular'}.otf",
                  "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"]):
        if Path(pfad).exists():
            return ImageFont.truetype(pfad, groesse)
    return ImageFont.load_default()


def inhalt(bild: Image.Image) -> tuple[int, int, int, int] | None:
    maske = Image.eval(bild.convert("L"), lambda v: 255 if abs(v - 16) > 10 else 0)
    return maske.getbbox()


def ausschnitt(bilder: list[Path], rand: float = 0.06) -> tuple[int, int, int, int]:
    """Gemeinsamer Ausschnitt aller Bilder eines Moments, im Seitenverhältnis 4 : 3."""
    kisten = [k for k in (inhalt(Image.open(b)) for b in bilder if b.exists()) if k]
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


def kachel(bild: Path | Image.Image, titel: str, breite: int, hoehe: int, zusatz: str = "",
           kiste: tuple[int, int, int, int] | None = None, rand: int = 44) -> Image.Image:
    k = Image.new("RGB", (breite, hoehe + rand), GRUND)
    b = bild if isinstance(bild, Image.Image) else (Image.open(bild).convert("RGB") if bild.exists() else None)
    if b is not None:
        if kiste:
            b = b.crop(kiste)
        if b.size != (breite, hoehe):
            # ins Feld einpassen, Seitenverhältnis bleibt
            f = min(breite / b.width, hoehe / b.height)
            b = b.resize((max(1, int(b.width * f)), max(1, int(b.height * f))), Image.LANCZOS)
        k.paste(b, ((breite - b.width) // 2, rand + (hoehe - b.height) // 2))
    d = ImageDraw.Draw(k)
    d.text((10, 6), titel, fill=TEXT, font=schrift(17, True))
    if zusatz:
        d.text((10, 26), zusatz, fill=LEISE, font=schrift(13))
    return k


def gitter(kacheln: list[Image.Image], spalten: int, titel: str, unter: str = "") -> Image.Image:
    kopf = 56 + (22 if unter else 0)
    w = max(k.width for k in kacheln)
    h = max(k.height for k in kacheln)
    zeilen = (len(kacheln) + spalten - 1) // spalten
    gesamt = Image.new("RGB", (spalten * w + (spalten + 1) * 8, kopf + zeilen * (h + 8) + 8), GRUND)
    d = ImageDraw.Draw(gesamt)
    d.text((16, 14), titel, fill=TEXT, font=schrift(26, True))
    if unter:
        d.text((16, 50), unter, fill=LEISE, font=schrift(15))
    for i, k in enumerate(kacheln):
        gesamt.paste(k, (8 + (i % spalten) * (w + 8), kopf + (i // spalten) * (h + 8)))
    return gesamt


def speichern(bild: Image.Image, ziel: Path, name: str, q: int = 82) -> None:
    pfad = ziel / f"{name}.webp"
    bild.save(pfad, quality=q, method=6)
    print(f"{pfad} ({pfad.stat().st_size / 1024:.0f} KB, {bild.width} × {bild.height})")


# ---------------------------------------------------------------------- Blätter


def blatt_moment(paket: Path, uebung: str, phase: str, titel: str) -> Image.Image:
    """Ein Moment, Zeilen = Körper, Spalten = Fassungen, gleicher Ausschnitt."""
    bilder = [paket / "bilder" / f"{k}-{f}-{uebung}-{phase}.png" for k, _ in KOERPER for f, _ in FASSUNGEN]
    kiste = ausschnitt(bilder)
    kacheln = []
    for k, kt in KOERPER:
        for f, ft in FASSUNGEN:
            zeit = ""
            info = paket / "bilder" / f"{k}-{f}-{uebung}.json"
            if info.exists():
                w = json.loads(info.read_text(encoding="utf-8"))
                s = w["bild_s"].get(phase)
                if s is not None:
                    zeit = f"Renderzeit {s:.0f} s ({w['breite']} × {w['hoehe']}, {w['proben']} Proben)"
            kacheln.append(kachel(paket / "bilder" / f"{k}-{f}-{uebung}-{phase}.png", f"{kt} · {ft}", 480, 360, zeit, kiste))
    return gitter(kacheln, 3, titel)


def blatt_groessen(paket: Path) -> Image.Image:
    """Brustlogo 3,5, 4 und 4,5 cm in der Größe der App: großer Player (390 px breit, wie Übungsdetails
    und Duo aufgeklappt) und das Vorschaubild des kleinen Players (56 px, dazu 2-fach)."""
    kacheln = []
    for k, kt in KOERPER[:2]:
        for cm, key in ((35, f"{k}-A1-35"), (40, f"{k}-A1"), (45, f"{k}-A1-45")):
            still = Image.open(paket / "bilder" / f"{key}-kniebeuge-1.00.png").convert("RGB")
            vorschau = paket / "vorschau" / f"kniebeuge-{key}-vorschau.webp"
            gross = still.resize((PLAYER_BREITE, PLAYER_BREITE * 3 // 4), Image.LANCZOS)
            feld = Image.new("RGB", (PLAYER_BREITE, gross.height + THUMB * 3 + 16), GRUND)
            feld.paste(gross, (0, 0))
            if vorschau.exists():
                v = Image.open(vorschau).convert("RGB")
                feld.paste(v.resize((THUMB, THUMB), Image.LANCZOS), (0, gross.height + 8))
                feld.paste(v.resize((THUMB * 2, THUMB * 2), Image.LANCZOS), (THUMB + 8, gross.height + 8))
            ImageDraw.Draw(feld).text((THUMB * 3 + 16, gross.height + 12), "kleiner Player: 56 px, rechts 2-fach",
                                      fill=LEISE, font=schrift(13))
            kacheln.append(kachel(feld, f"{kt} · Brust-F {cm / 10:.1f} cm".replace(".", ","), feld.width, feld.height,
                                  "oben: großer Player am iPhone (390 px breit)"))
    return gitter(kacheln, 3, "1 · Brustlogo in Player-Größe · 3,5, 4 und 4,5 cm",
                  "Fassung A1 (F hell Ton in Ton), Kniebeuge in der tiefsten Position")


def blatt_nah(paket: Path, nummer: int, titel: str, ansichten: list[tuple[str, str]], fassung_text: str) -> Image.Image:
    kacheln = [kachel(paket / "nah" / f"{k}-{datei}.png", f"{kt} · {at}", 400, 400)
               for k, kt in KOERPER for datei, at in ansichten]
    return gitter(kacheln, len(ansichten), f"{nummer} · {titel}", fassung_text)


def blatt_koerper(paket: Path, k: str, kt: str, nummer: int) -> Image.Image:
    """Ein realistischer Körper: drei Momente in A1 und B, dazu die Logos aus der Nähe."""
    kacheln = []
    for f, ft in (("A1", "A1"), ("B", "B")):
        bilder = [paket / "bilder" / f"{k}-{f}-{u}-{p}.png" for u, p, _, _ in MOMENTE]
        kiste = ausschnitt(bilder)
        for (u, p, _, mt), b in zip(MOMENTE, bilder):
            kacheln.append(kachel(b, f"{ft} · {mt}", 400, 300, "", kiste))
    for datei, at in (("brust-vorn", "Brust von vorn"), ("ruecken", "Rücken"), ("bein", "Shorts")):
        kacheln.append(kachel(paket / "nah" / f"{k}-{datei}.png", f"Nahaufnahme · {at}", 400, 300,
                              "Fassung B (Logos in Kollektionsfarben)"))
    return gitter(kacheln, 3, f"{nummer} · {kt} · korrigierte Logos")


def blatt_app(paket: Path, k: str, kt: str) -> Image.Image:
    """App-Ansichten eines Körpers: je Fassung kleiner Player (iPhone), Übungsübersicht, Übungsdetails,
    aufgeklappter Player (Duo auf). Bildschirmfotos in doppelter Auflösung, hier auf 300 px Breite."""
    kacheln = []
    for f, ft in FASSUNGEN:
        for ansicht, at in (("player-iphone", "kleiner Player, iPhone"), ("liste", "Übungsübersicht, iPhone"),
                            ("details", "Übungsdetails, iPhone"), ("player-auf", "Player aufgeklappt, Duo")):
            pfad = paket / "app" / f"{k}-{f}-{ansicht}.png"
            if not pfad.exists():
                kacheln.append(kachel(pfad, f"{ft} · {at}", 300, 540, "fehlt"))
                continue
            b = Image.open(pfad).convert("RGB")
            if ansicht == "player-auf":
                b = b.crop((0, 0, b.width, min(b.height, int(b.width * 669 / 951))))
                breite = 600
            else:
                breite = 300
            b = b.resize((breite, int(b.height * breite / b.width)), Image.LANCZOS)
            kacheln.append(kachel(b, f"{ft} · {at}", 600 if ansicht == "player-auf" else 300, min(b.height, 650), ""))
    # Zeilen je Fassung: drei iPhone-Bilder plus das breite Duo-Bild; Breiten mischen sich, darum von Hand setzen
    kopf = 56
    zeilen = []
    for i in range(0, len(kacheln), 4):
        reihe = kacheln[i:i + 4]
        w = sum(r.width for r in reihe) + 8 * (len(reihe) + 1)
        h = max(r.height for r in reihe)
        zeilen.append((reihe, w, h))
    breite = max(w for _, w, _ in zeilen)
    gesamt = Image.new("RGB", (breite, kopf + sum(h + 8 for _, _, h in zeilen) + 8), GRUND)
    ImageDraw.Draw(gesamt).text((16, 14), f"9 · In der App · {kt}", fill=TEXT, font=schrift(26, True))
    y = kopf
    for reihe, _, h in zeilen:
        x = 8
        for r in reihe:
            gesamt.paste(r, (x, y))
            x += r.width + 8
        y += h + 8
    return gesamt


def blatt_hals_kante(paket: Path) -> Image.Image:
    kacheln = []
    for k, kt in KOERPER:
        kacheln.append(kachel(paket / "nah" / f"{k}-hals.png", f"{kt} · Hals, Kamera der App", 400, 400, "Fassung A1"))
        kacheln.append(kachel(paket / "kante" / f"{k}-ohne.png", f"{kt} · ohne Kantenlicht", 400, 400, "bisheriges Gegenlicht 90 W"))
        kacheln.append(kachel(paket / "kante" / f"{k}-mit.png", f"{kt} · mit Kantenlicht", 400, 400, "280 / 200 W (D-417)"))
    return gitter(kacheln, 3, "Hals und Kantenlicht je Körper", "Kniebeuge, Fassung A1")


# ---------------------------------------------------------------------- Medien für die App


def app_medien(paket: Path, ziel: Path) -> None:
    """Je Fassung die Dateien, die `tools/uebungen-fassungen-screens.mjs` in `dist/uebungen/medien/`
    tauscht: Poster (Standbild 720 × 540 als WebP) für Kniebeuge und Bankdrücken, Vorschaubilder."""
    for k, _ in KOERPER:
        for f, _ in FASSUNGEN:
            fassung = f"{k}-{f}"
            aus = ziel / fassung
            aus.mkdir(parents=True, exist_ok=True)
            for uebung, phase in (("kniebeuge", "1.00"), ("bankdruecken", "1.00")):
                subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(paket / "bilder" / f"{fassung}-{uebung}-{phase}.png"),
                                "-q:v", "80", str(aus / f"{uebung}-poster.webp")], check=True)
            for uebung in ("kniebeuge", "bankdruecken", "latziehen"):
                quelle = paket / "vorschau" / f"{uebung}-{fassung}-vorschau.webp"
                (aus / f"{uebung}-vorschau.webp").write_bytes(quelle.read_bytes())
            print(aus)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--paket", required=True, help="Ordner mit bilder/, vorschau/, nah/, kante/, app/")
    ap.add_argument("--app-medien", help="schreibt je Fassung die Medien für die App in diesen Ordner und endet")
    ap.add_argument("--ziel", default=str(HIER.parent / "docs/screens/uebungen"))
    args = ap.parse_args()
    paket, ziel = Path(args.paket), Path(args.ziel)
    if args.app_medien:
        app_medien(paket, Path(args.app_medien))
        return
    ziel.mkdir(parents=True, exist_ok=True)
    speichern(blatt_groessen(paket), ziel, "paket-1-brustlogo-groessen")
    speichern(blatt_nah(paket, 2, "Brustlogo in der Nahaufnahme", [("brust-vorn", "von vorn"), ("brust-app", "Kamera der App")],
                        "Fassung B (Logos in Kollektionsfarben), Ruhehaltung; links und rechts aus Sicht des Trägers"),
              ziel, "paket-2-brustlogo-nah")
    speichern(blatt_nah(paket, 3, "Rückenlogo in der Rückansicht", [("ruecken", "Kniebeuge von hinten"), ("ruecken-lat", "Latziehen, Kamera der App")],
                        "Fassung B, 8 cm, Originalproportionen"), ziel, "paket-3-ruecken")
    speichern(blatt_nah(paket, 4, "Shorts-Logo in der Nahaufnahme", [("bein", "linkes Bein außen")], "Fassung B, 3,5 cm"),
              ziel, "paket-4-shorts-nah")
    speichern(blatt_moment(paket, "bankdruecken", "0.00", "5 · Bankdrücken · Ausgangsposition · A1, A2 und B"), ziel, "paket-5-bank-oben")
    speichern(blatt_moment(paket, "bankdruecken", "1.00", "5 · Bankdrücken · Endposition · A1, A2 und B"), ziel, "paket-5-bank-unten")
    speichern(blatt_moment(paket, "kniebeuge", "1.00", "6 · Kniebeuge · tiefste Position · A1, A2 und B"), ziel, "paket-6-kniebeuge")
    speichern(blatt_koerper(paket, "Cm", "C · männlich, MakeHuman", 7), ziel, "paket-7-c-maennlich")
    speichern(blatt_koerper(paket, "Cw", "C · weiblich, MakeHuman", 8), ziel, "paket-8-c-weiblich")
    for k, kt in KOERPER:
        speichern(blatt_app(paket, k, kt), ziel, f"paket-9-app-{k}")
    speichern(blatt_hals_kante(paket), ziel, "paket-hals-kantenlicht")


if __name__ == "__main__":
    main()
