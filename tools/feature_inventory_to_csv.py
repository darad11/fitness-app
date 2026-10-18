#!/usr/bin/env python3
"""Funktionsmatrix: CSV erzeugen, Kennzahlen eintragen, Konsistenz prüfen.

Quelle der Wahrheit ist docs/feature-inventory.md. Das Skript
  1. liest alle Matrixzeilen (15 Spalten) unter den "## "-Abschnitten,
  2. prüft Regeln zwischen Konfidenz, Herkunft, Umfang, Release, Status
     und die Verweise auf Akzeptanzkriterien in docs/requirements.md,
  3. schreibt docs/feature-inventory.csv (UTF-8 mit BOM, Semikolon),
  4. ersetzt den Kennzahlenblock zwischen den Markern STATS-BEGIN/STATS-END
     (oder den Platzhalter <!-- STATS -->) in docs/feature-inventory.md.
Andere Teile der Markdown-Datei bleiben unverändert.
Exit-Code 1, wenn eine Regel verletzt ist.
"""
from __future__ import annotations

import csv
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "docs" / "feature-inventory.md"
REQ = ROOT / "docs" / "requirements.md"
DST = ROOT / "docs" / "feature-inventory.csv"

COLUMNS = [
    "ID", "Funktion", "Originalverhalten (Xeela)", "Evidenz", "Konfidenz",
    "Herkunft", "Nutzen", "Abhängigkeiten", "Aufwand", "Prio", "Umfang",
    "Release", "Entscheidung", "Status", "Akzeptanzkriterien",
]
ID_RE = re.compile(r"^[A-Z]{2}-\d{2}$")
AK_RE = re.compile(r"AK-[A-Z]{2,3}-\d{2}")
AK_RANGE_RE = re.compile(r"(AK-[A-Z]{2,3})-(\d{2}) bis (AK-[A-Z]{2,3})-(\d{2})")
MATRIX_ID_RE = re.compile(r"\b[A-Z]{2}-\d{2}\b")
MATRIX_RANGE_RE = re.compile(r"\b([A-Z]{2})-(\d{2}) bis ([A-Z]{2})-(\d{2})\b")
HERKUNFT = {"V": "OV", "V-R": "OV", "P": "ON", "N": "ON", "VF": "EV", "E": "EV"}
LATER_STATUS = {"Noch zu recherchieren", "Analysiert", "Spezifiziert"}
BEGIN, END = "<!-- STATS-BEGIN -->", "<!-- STATS-END -->"


def expand(text: str, single: re.Pattern, rng: re.Pattern) -> set[str]:
    found = set(single.findall(text))
    for a, x, b, y in rng.findall(text):
        if a == b:
            found |= {f"{a}-{n:02d}" for n in range(int(x), int(y) + 1)}
    return found


def read_matrix() -> list[dict[str, str]]:
    module, rows = "", []
    for line in SRC.read_text(encoding="utf-8").splitlines():
        if line.startswith("## "):
            module = line[3:].strip()
            continue
        if not line.startswith("|"):
            continue
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if not cells or not ID_RE.match(cells[0]):
            continue
        if len(cells) != len(COLUMNS):
            sys.exit(f"Spaltenzahl falsch in {cells[0]}: {len(cells)} statt {len(COLUMNS)}")
        row = dict(zip(COLUMNS, cells))
        row["Modul"] = module
        rows.append(row)
    return rows


def read_requirements() -> dict[str, set[str]]:
    """AK-ID -> referenzierte Matrix-IDs aus der Tabelle in requirements.md."""
    aks: dict[str, set[str]] = {}
    for line in REQ.read_text(encoding="utf-8").splitlines():
        if not line.startswith("| AK-"):
            continue
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        aks[cells[0]] = expand(cells[2], MATRIX_ID_RE, MATRIX_RANGE_RE)
    return aks


def check(rows: list[dict[str, str]], aks: dict[str, set[str]]) -> list[str]:
    errors, ids = [], [r["ID"] for r in rows]
    for dup in [i for i, n in Counter(ids).items() if n > 1]:
        errors.append(f"doppelte ID {dup}")
    known = set(ids)
    referenced_aks: set[str] = set()
    for r in rows:
        rid, scope = r["ID"], r["Umfang"]
        if HERKUNFT.get(r["Konfidenz"]) != r["Herkunft"]:
            errors.append(f"{rid}: Herkunft {r['Herkunft']} passt nicht zu Konfidenz {r['Konfidenz']}")
        refs = expand(r["Akzeptanzkriterien"], AK_RE, AK_RANGE_RE)
        referenced_aks |= refs
        for ak in sorted(refs - aks.keys()):
            errors.append(f"{rid}: unbekanntes Akzeptanzkriterium {ak}")
        if scope == "MVP":
            if not r["Release"].startswith("R1"):
                errors.append(f"{rid}: MVP ohne Release R1")
            if r["Status"] != "Zur Umsetzung ausgewählt":
                errors.append(f"{rid}: MVP mit Status {r['Status']}")
            if not refs:
                errors.append(f"{rid}: MVP ohne AK-Verweis")
            if r["Prio"] not in {"P0", "P1", "P2"}:
                errors.append(f"{rid}: MVP mit Prio {r['Prio']}")
        elif scope == "Später":
            if not re.match(r"^(R[2-5]|Backlog)", r["Release"]):
                errors.append(f"{rid}: später ohne Release R2 bis R5 oder Backlog")
            if r["Status"] not in LATER_STATUS:
                errors.append(f"{rid}: später mit Status {r['Status']}")
        elif scope == "Ausgeschlossen":
            if r["Release"] != "–" or r["Prio"] != "–":
                errors.append(f"{rid}: ausgeschlossen mit Release oder Prio")
        else:
            errors.append(f"{rid}: unbekannter Umfang {scope}")
    for ak, mids in aks.items():
        for mid in sorted(mids - known):
            errors.append(f"{ak}: verweist auf unbekannte Matrix-ID {mid}")
    unreferenced = sorted(set(aks) - referenced_aks)
    if unreferenced:
        print("Hinweis: AK ohne Verweis aus der Matrix:", ", ".join(unreferenced))
    return errors


def stats_block(rows: list[dict[str, str]]) -> str:
    def count(key: str) -> Counter:
        return Counter(r[key] for r in rows)

    origin, scope = count("Herkunft"), count("Umfang")
    cross = Counter((r["Herkunft"], r["Umfang"]) for r in rows)
    release = Counter(r["Release"].split(" ")[0] for r in rows if r["Umfang"] != "Ausgeschlossen")
    lines = [
        BEGIN,
        "## Überblick in Zahlen",
        "",
        "Automatisch erzeugt von `tools/feature_inventory_to_csv.py`.",
        "",
        "| Herkunft | MVP | Später | Ausgeschlossen | Summe |",
        "|---|---|---|---|---|",
    ]
    names = {"OV": "Original verifiziert (OV)", "ON": "Original nicht verifiziert (ON)", "EV": "Eigene Verbesserung (EV)"}
    for key in ("OV", "ON", "EV"):
        lines.append(f"| {names[key]} | {cross[(key, 'MVP')]} | {cross[(key, 'Später')]} | "
                     f"{cross[(key, 'Ausgeschlossen')]} | {origin[key]} |")
    lines.append(f"| Summe | {scope['MVP']} | {scope['Später']} | {scope['Ausgeschlossen']} | {len(rows)} |")
    lines += ["", "| Release | Funktionen |", "|---|---|"]
    for key in sorted(release):
        lines.append(f"| {key} | {release[key]} |")
    lines += ["", "| Prio | " + " | ".join(sorted(count("Prio"))) + " |",
              "|---|" + "---|" * len(count("Prio")),
              "| Anzahl | " + " | ".join(str(count("Prio")[k]) for k in sorted(count("Prio"))) + " |",
              "", "| Status | Anzahl |", "|---|---|"]
    for key, n in sorted(count("Status").items()):
        lines.append(f"| {key} | {n} |")
    lines.append(END)
    return "\n".join(lines)


def write_stats(rows: list[dict[str, str]]) -> None:
    text = SRC.read_text(encoding="utf-8")
    block = stats_block(rows)
    if BEGIN in text and END in text:
        start, stop = text.index(BEGIN), text.index(END) + len(END)
        text = text[:start] + block + text[stop:]
    elif "<!-- STATS -->" in text:
        text = text.replace("<!-- STATS -->", block)
    else:
        sys.exit("Kein Kennzahlen-Marker gefunden")
    SRC.write_text(text, encoding="utf-8")


def main() -> int:
    rows, aks = read_matrix(), read_requirements()
    errors = check(rows, aks)
    with DST.open("w", encoding="utf-8-sig", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=["Modul", *COLUMNS], delimiter=";")
        writer.writeheader()
        writer.writerows(rows)
    write_stats(rows)
    print(f"{len(rows)} Funktionen -> {DST.relative_to(ROOT)}; {len(aks)} Akzeptanzkriterien gelesen")
    print("Umfang:", dict(Counter(r["Umfang"] for r in rows)))
    print("Herkunft:", dict(Counter(r["Herkunft"] for r in rows)))
    if errors:
        print(f"{len(errors)} Regelverletzungen:")
        for e in errors:
            print("  -", e)
        return 1
    print("Konsistenzprüfung bestanden")
    return 0


if __name__ == "__main__":
    sys.exit(main())
