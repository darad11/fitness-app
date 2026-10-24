#!/usr/bin/env python3
"""Wandelt den Bundeslebensmittelschlüssel 4.0 (Max Rubner-Institut) in eine kompakte Datei um.

Quelle: BLS_4_0_Daten_2025_DE.xlsx aus dem Download des MRI (kostenfrei, Nutzung auch für
App-Entwicklung, Quellenangabe empfohlen; Dokumentation Abschnitt 9.3). Die Excel-Datei wird
nicht ins Repository übernommen; nur die gekürzte Fassung mit den Nährwerten, die die App braucht.

Ziel: tools/data/bls-4.0.json, die Grundlage der Auswahlliste docs/lebensmittel-auswahl.csv
(Phase Ernährung §2, D-358; Prüfung mit tools/lebensmittel_auswahl.py). Die App enthält die Datei
nicht; eingebaut wird nach Freigabe nur die Auswahl (§6).
  { "version": 1, "source": ..., "fields": [...], "foods": [[code, name, kcal, protein, ...], ...] }
Werte je 100 g, auf höchstens zwei Nachkommastellen gerundet; fehlende Werte sind null.

Die Datei im Repository stammt aus D-261 (Umwandlung am 19.10.2026) und ist byte-gleich mit
`58dee8c^:src/modules/nutrition/data/bls-4.0.json`. Nach einem neuen Lauf `pnpm format` und
`python3 tools/lebensmittel_auswahl.py` ausführen.

  python3 tools/bls_build.py <Pfad/zu/BLS_4_0_Daten_2025_DE.xlsx>
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "tools/data/bls-4.0.json"

# Spalten der Excel-Datei je Nährwert der App (Reihenfolge = Feldreihenfolge der Ausgabe).
COLUMNS = {
    "kcal": "ENERCC Energie (Kilokalorien) [kcal/100g]",
    "protein": "PROT625 Protein (Nx6,25) [g/100g]",
    "carbs": "CHO Kohlenhydrate, verfügbar [g/100g]",
    "sugar": "SUGAR Zucker (Mono- und Disaccharide), gesamt [g/100g]",
    "fat": "FAT Fett [g/100g]",
    "saturatedFat": "FASAT Fettsäuren, gesättigt, gesamt [g/100g]",
    "fiber": "FIBT Ballaststoffe, gesamt [g/100g]",
    "salt": "NACL Salz (Natriumchlorid) [g/100g]",
}


def number(value: object) -> float | None:
    if value is None or value == "" or value == "-":
        return None
    try:
        result = float(value)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return None
    if result < 0:
        return None
    rounded = round(result, 2)
    return int(rounded) if rounded == int(rounded) else rounded


def main() -> int:
    if len(sys.argv) != 2:
        print(__doc__)
        return 2
    import openpyxl  # nur für die Umwandlung nötig

    workbook = openpyxl.load_workbook(sys.argv[1], read_only=True)
    sheet = workbook.worksheets[0]
    rows = sheet.iter_rows(values_only=True)
    header = [str(cell) if cell is not None else "" for cell in next(rows)]
    index = {name: header.index(name) for name in ["BLS Code", "Lebensmittelbezeichnung"]}
    for field, column in COLUMNS.items():
        if column not in header:
            print(f"Spalte fehlt: {column}", file=sys.stderr)
            return 1
        index[field] = header.index(column)

    foods = []
    seen: set[str] = set()
    for row in rows:
        code = row[index["BLS Code"]]
        name = row[index["Lebensmittelbezeichnung"]]
        if not code or not name:
            continue
        code = str(code).strip()
        if code in seen:
            print(f"Doppelter Code: {code}", file=sys.stderr)
            return 1
        seen.add(code)
        values = [number(row[index[field]]) for field in COLUMNS]
        if values[0] is None:
            continue  # ohne Energiewert nicht nutzbar
        foods.append([code, " ".join(str(name).split()), *values])

    foods.sort(key=lambda item: item[0])
    data = {
        "version": 1,
        "source": "Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0. Karlsruhe. Gekürzt und umgewandelt.",
        "fields": ["code", "name", *COLUMNS.keys()],
        "foods": foods,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"{len(foods)} Lebensmittel -> {OUT.relative_to(ROOT)} ({OUT.stat().st_size // 1024} KB)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
