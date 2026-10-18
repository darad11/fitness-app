#!/usr/bin/env python3
"""Erzeugt docs/feature-inventory.csv aus docs/feature-inventory.md.

Die Markdown-Datei ist die Quelle der Wahrheit. Das Skript liest alle
Tabellenzeilen unterhalb von "## "-Überschriften, ergänzt das Modul und
schreibt eine UTF-8-CSV (mit BOM, damit Excel und Numbers sie korrekt öffnen).
Zusätzlich gibt es eine kleine Statistik aus.
"""
from __future__ import annotations

import csv
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "docs" / "feature-inventory.md"
DST = ROOT / "docs" / "feature-inventory.csv"

COLUMNS = [
    "ID", "Funktion", "Originalverhalten (Xeela)", "Evidenz", "Konfidenz",
    "Nutzen", "Abhängigkeiten", "Aufwand", "Prio", "Entscheidung", "Status",
    "Akzeptanzkriterien",
]
ID_PATTERN = re.compile(r"^[A-Z]{2}-\d{2}$")


def main() -> int:
    module = ""
    rows: list[dict[str, str]] = []
    for line in SRC.read_text(encoding="utf-8").splitlines():
        if line.startswith("## "):
            module = line[3:].strip()
            continue
        if not line.startswith("|"):
            continue
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if len(cells) != len(COLUMNS) or not ID_PATTERN.match(cells[0]):
            continue
        row = dict(zip(COLUMNS, cells))
        row["Modul"] = module
        rows.append(row)

    with DST.open("w", encoding="utf-8-sig", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=["Modul", *COLUMNS], delimiter=";")
        writer.writeheader()
        writer.writerows(rows)

    conf = Counter(r["Konfidenz"] for r in rows)
    prio = Counter(r["Prio"] for r in rows)
    status = Counter(r["Status"] for r in rows)
    print(f"{len(rows)} Funktionen -> {DST.relative_to(ROOT)}")
    print("Konfidenz:", dict(sorted(conf.items())))
    print("Prio:", dict(sorted(prio.items())))
    print("Status:", dict(sorted(status.items())))
    return 0


if __name__ == "__main__":
    sys.exit(main())
