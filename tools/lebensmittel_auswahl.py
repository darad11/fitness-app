#!/usr/bin/env python3
"""Auswahlliste der Grundnahrungsmittel prüfen und zusammenfassen (Phase Ernährung §2, D-358).

Quelle der Wahrheit ist docs/lebensmittel-auswahl.csv (UTF-8 mit BOM, Semikolon). Die Liste
wird vom Produktinhaber durchgesehen und erst nach seiner Freigabe in die App eingebaut.
Das Skript prüft sie gegen tools/data/bls-4.0.json:
  - Kopfzeile und Spaltenzahl,
  - Gruppen aus der festen Liste und in deren Reihenfolge sortiert,
  - Anzeigenamen und BLS-Codes je nur einmal,
  - BLS-Code vorhanden und BLS-Bezeichnung wortgleich mit dem BLS,
  - fehlende Lebensmittel ohne Code und mit „fehlt im BLS“ in der Quelle,
  - Stückgewicht leer oder eine positive Zahl, eine Zahl immer mit Herkunft.
Ohne Schalter gibt es danach die Zusammenfassung aus (Anzahl je Gruppe, Stückgewichte, fehlende
Lebensmittel). Mit --check nur die Prüfung (für pnpm check:docs).
Exit-Code 1, wenn eine Regel verletzt ist.
"""
from __future__ import annotations

import csv
import json
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSV_PATH = ROOT / "docs" / "lebensmittel-auswahl.csv"
BLS_PATH = ROOT / "tools" / "data" / "bls-4.0.json"

COLUMNS = [
    "Anzeigename", "Suchbegriffe", "Gruppe", "Zubereitung", "BLS-Code", "BLS-Bezeichnung",
    "Stückgewicht (g)", "Herkunft des Stückgewichts", "Quelle",
]
GROUPS = [
    "Obst", "Gemüse", "Erdäpfel", "Hülsenfrüchte", "Getreide und Getreideprodukte", "Eier",
    "Milch und Milchprodukte", "Fleisch", "Geflügel", "Fisch", "Nüsse und Samen", "Öle und Fette",
]
SOURCE_BLS = "BLS 4.0"
MISSING_PREFIX = "fehlt im BLS"
WEIGHT_RE = re.compile(r"^\d+(,\d+)?$")


def read_rows() -> list[dict[str, str]]:
    raw = CSV_PATH.read_bytes()
    if not raw.startswith(b"\xef\xbb\xbf"):
        raise SystemExit(f"{CSV_PATH.name}: UTF-8 mit BOM erwartet")
    reader = csv.reader(raw.decode("utf-8-sig").splitlines(), delimiter=";")
    header = next(reader)
    if header != COLUMNS:
        raise SystemExit(f"{CSV_PATH.name}: Kopfzeile weicht ab: {header}")
    rows = []
    for number, fields in enumerate(reader, start=2):
        if len(fields) != len(COLUMNS):
            raise SystemExit(f"Zeile {number}: {len(fields)} statt {len(COLUMNS)} Spalten")
        rows.append({"_line": str(number), **dict(zip(COLUMNS, fields))})
    return rows


def check(rows: list[dict[str, str]], bls: dict[str, str]) -> list[str]:
    errors: list[str] = []
    names: Counter[str] = Counter(r["Anzeigename"].casefold() for r in rows)
    codes: Counter[str] = Counter(r["BLS-Code"] for r in rows if r["BLS-Code"])
    last_group = 0
    for r in rows:
        where = f"Zeile {r['_line']} ({r['Anzeigename'] or 'ohne Namen'})"
        if not r["Anzeigename"].strip():
            errors.append(f"{where}: Anzeigename fehlt")
        if names[r["Anzeigename"].casefold()] > 1:
            errors.append(f"{where}: Anzeigename doppelt")
        if r["Gruppe"] not in GROUPS:
            errors.append(f"{where}: unbekannte Gruppe „{r['Gruppe']}“")
        else:
            index = GROUPS.index(r["Gruppe"])
            if index < last_group:
                errors.append(f"{where}: nicht nach Gruppe sortiert")
            last_group = max(last_group, index)
        code = r["BLS-Code"]
        if code:
            if code not in bls:
                errors.append(f"{where}: BLS-Code {code} gibt es nicht")
            elif r["BLS-Bezeichnung"] != bls[code]:
                errors.append(f"{where}: BLS-Bezeichnung weicht ab (BLS: „{bls[code]}“)")
            if codes[code] > 1:
                errors.append(f"{where}: BLS-Code {code} doppelt")
            if r["Quelle"] != SOURCE_BLS:
                errors.append(f"{where}: Quelle muss „{SOURCE_BLS}“ sein")
        else:
            if r["BLS-Bezeichnung"]:
                errors.append(f"{where}: BLS-Bezeichnung ohne BLS-Code")
            if not r["Quelle"].startswith(MISSING_PREFIX):
                errors.append(f"{where}: ohne BLS-Code muss die Quelle mit „{MISSING_PREFIX}“ beginnen")
        weight, origin = r["Stückgewicht (g)"], r["Herkunft des Stückgewichts"]
        if weight:
            if not WEIGHT_RE.match(weight) or float(weight.replace(",", ".")) <= 0:
                errors.append(f"{where}: Stückgewicht „{weight}“ ist keine positive Zahl")
            if not origin or origin.startswith("offen"):
                errors.append(f"{where}: Stückgewicht ohne Herkunft")
        elif origin and not origin.startswith("offen"):
            errors.append(f"{where}: Herkunft ohne Stückgewicht muss mit „offen“ beginnen")
    return errors


def summary(rows: list[dict[str, str]]) -> str:
    lines = ["| Gruppe | Einträge | davon aus dem BLS | fehlt im BLS | Stückgewicht belegt | Stückgewicht offen |",
             "|---|---:|---:|---:|---:|---:|"]
    total = Counter()
    for group in GROUPS:
        part = [r for r in rows if r["Gruppe"] == group]
        counts = Counter(
            all=len(part),
            bls=sum(1 for r in part if r["BLS-Code"]),
            missing=sum(1 for r in part if not r["BLS-Code"]),
            weight=sum(1 for r in part if r["Stückgewicht (g)"]),
            open=sum(1 for r in part if r["Herkunft des Stückgewichts"].startswith("offen")),
        )
        total.update(counts)
        lines.append(f"| {group} | {counts['all']} | {counts['bls']} | {counts['missing']} | "
                     f"{counts['weight']} | {counts['open']} |")
    lines.append(f"| **Summe** | **{total['all']}** | **{total['bls']}** | **{total['missing']}** | "
                 f"**{total['weight']}** | **{total['open']}** |")
    missing = [f"{r['Anzeigename']} ({r['Gruppe']})" for r in rows if not r["BLS-Code"]]
    lines += ["", "Fehlt im BLS: " + ", ".join(missing)]
    return "\n".join(lines)


def main() -> int:
    bls = {food[0]: food[1] for food in json.loads(BLS_PATH.read_text(encoding="utf-8"))["foods"]}
    rows = read_rows()
    errors = check(rows, bls)
    for error in errors:
        print(f"lebensmittel-auswahl: {error}", file=sys.stderr)
    if errors:
        return 1
    if "--check" in sys.argv[1:]:
        print(f"lebensmittel-auswahl: {len(rows)} Einträge geprüft")
    else:
        print(summary(rows))
    return 0


if __name__ == "__main__":
    sys.exit(main())
