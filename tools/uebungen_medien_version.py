#!/usr/bin/env python3
"""Prüfsumme im Namen der Übungsbilder (D-494).

Der Service Worker speichert jede Datei unter `/uebungen/medien/` beim ersten Abruf und liefert sie danach aus
seinem Speicher (CacheFirst, `vite.config.ts`). Bleibt der Name einer neu gerenderten Schleife gleich, sieht ein
Gerät, das die alte Datei schon hat, weiter die alte. Deshalb trägt jede Datei die ersten acht Zeichen ihrer
SHA-256-Prüfsumme im Namen: `kniebeuge-1a2b3c4d.mp4`, `kniebeuge-poster-5e6f7a8b.webp`. Neuer Inhalt heißt neue
Adresse, und die App lädt die neue Datei.

Nach dem Rendern (`tools/uebungen-3d/render.py` schreibt `<name>.mp4`, `<name>.webm`, `<name>-poster.webp` und
`<name>-vorschau.webp` ohne Prüfsumme) einmal, wenn alle Renderläufe fertig sind:

    python3 tools/uebungen_medien_version.py

Je Datei, die `public/uebungen/medien.json` nennt: Liegt daneben eine frisch gerenderte Datei mit dem Namen ohne
Prüfsumme, ersetzt sie die bisherige, sonst bleibt die bisherige. Die Datei bekommt den Namen mit ihrer
Prüfsumme, die ersetzte wird gelöscht, und in der Liste wird nur die Adresse ersetzt (Formatierung danach mit
Prettier wie in `pnpm format:check`). Ein neuer Eintrag nennt seine Dateien zuerst ohne Prüfsumme. Ob alles
stimmt, prüft `tools/check_medien.py` in `pnpm check:docs`.
"""
from __future__ import annotations

import hashlib
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LISTE = ROOT / "public/uebungen/medien.json"
ORDNER = LISTE.parent / "medien"
DEMO_DATEIEN = ("file", "webm", "still", "poster", "start", "end")
PRUEFSUMME = re.compile(r"-[0-9a-f]{8}(?=\.[a-z0-9]+$)")


def grundname(name: str) -> str:
    """`kniebeuge-1a2b3c4d.mp4` → `kniebeuge.mp4`; ein Name ohne Prüfsumme bleibt."""
    return PRUEFSUMME.sub("", name)


def pruefsumme(pfad: Path) -> str:
    return hashlib.sha256(pfad.read_bytes()).hexdigest()[:8]


def versioniert(grund: str, summe: str) -> str:
    stamm, endung = grund.rsplit(".", 1)
    return f"{stamm}-{summe}.{endung}"


def aktuelle_datei(grund: str, ordner: Path = ORDNER) -> Path:
    """Datei zu `kniebeuge.mp4` für Werkzeuge: frisch gerendert ohne Prüfsumme, sonst die eine mit Prüfsumme."""
    if (ordner / grund).is_file():
        return ordner / grund
    treffer = [p for p in sorted(ordner.iterdir()) if p.is_file() and p.name != grund and grundname(p.name) == grund]
    if len(treffer) != 1:
        raise FileNotFoundError(f"{grund}: {len(treffer)} passende Dateien in {ordner}")
    return treffer[0]


def dateien(liste: dict) -> list[str]:
    """Alle Adressen der Liste (`medien/…`) in der Reihenfolge der Einträge, ohne Doppelte."""
    srcs: list[str] = []
    for eintrag in liste.get("visuals", {}).values():
        teile = [eintrag.get("preview")]
        demo = eintrag.get("demo")
        if isinstance(demo, dict):
            teile += [demo.get(teil) for teil in DEMO_DATEIEN]
        for teil in teile:
            if isinstance(teil, dict) and isinstance(teil.get("src"), str) and teil["src"] not in srcs:
                srcs.append(teil["src"])
    return srcs


def main() -> int:
    text = LISTE.read_text(encoding="utf-8")
    geaendert: list[str] = []
    fehler: list[str] = []
    for src in dateien(json.loads(text)):
        name = src.removeprefix("medien/")
        grund = grundname(name)
        bisher, frisch = ORDNER / name, ORDNER / grund
        quelle = frisch if frisch.is_file() else bisher
        if not quelle.is_file():
            fehler.append(f"{src}: Datei fehlt")
            continue
        neu = versioniert(grund, pruefsumme(quelle))
        ziel = ORDNER / neu
        if quelle != ziel:
            shutil.move(quelle, ziel)
        if bisher not in (quelle, ziel) and bisher.is_file():
            bisher.unlink()
        if neu != name:
            text = text.replace(f'"medien/{name}"', f'"medien/{neu}"')
            geaendert.append(f"{name} → {neu}" + (" (neu gerendert)" if quelle == frisch and frisch != bisher else ""))
    for zeile in geaendert:
        print(zeile)
    if geaendert:
        LISTE.write_text(text, encoding="utf-8")
        prettier = ROOT / "node_modules/.bin/prettier"
        if prettier.is_file():
            subprocess.run([str(prettier), "--write", "--log-level", "warn", str(LISTE)], cwd=ROOT, check=True)
        else:
            print(f"Prettier fehlt: {LISTE.relative_to(ROOT)} vor dem Commit formatieren (pnpm install)", file=sys.stderr)
    print(f"{LISTE.relative_to(ROOT)}: {len(geaendert)} Dateien mit neuer Prüfsumme im Namen")
    for f in fehler:
        print(f"  - {f}", file=sys.stderr)
    return 1 if fehler else 0


if __name__ == "__main__":
    sys.exit(main())
