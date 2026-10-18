#!/usr/bin/env python3
"""Prüft Querverweise und Tabellen in docs/ (ohne Archiv). Ändert keine Dateien.

Geprüft wird:
  - Verweise auf Akzeptanzkriterien (AK-…), Entscheidungen (D-…), Fragen (Q-…),
    Konflikttests (K-…), Screens (S-…), Diagramme (C-…), Matrix-IDs und
    Meilensteine (M0 bis M13) zeigen auf definierte Einträge.
  - Jede Markdown-Tabelle hat in allen Zeilen dieselbe Spaltenzahl.
Exit-Code 1 bei Fehlern.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOCS = [p for p in sorted((ROOT / "docs").glob("*.md"))] + [ROOT / "README.md"]


def defined(path: str, pattern: str) -> set[str]:
    text = (ROOT / path).read_text(encoding="utf-8")
    return set(re.findall(pattern, text, flags=re.MULTILINE))


def main() -> int:
    defs = {
        "AK": defined("docs/requirements.md", r"^\| (AK-[A-Z]{2,3}-\d{2}) \|"),
        "D": defined("docs/decisions.md", r"^\| (D-\d{3}) \|"),
        "Q": defined("docs/decisions.md", r"^\| (Q-\d{2}) \|"),
        "K": defined("docs/data-model.md", r"\b(K-\d{2})\b"),
        "S": defined("docs/design-system.md", r"^\| (S-\d{2}) \|"),
        "C": defined("docs/design-system.md", r"^\| (C-\d{2}) \|"),
        "MX": defined("docs/feature-inventory.md", r"^\| ([A-Z]{2}-\d{2}) \|"),
    }
    # Spätere Screens, die nur als Bereich gelistet sind
    defs["S"] |= {f"S-{n:02d}" for n in list(range(15, 27)) + [29, 30, 31, 32, 36, 47]}
    patterns = {
        "AK": r"\bAK-[A-Z]{2,3}-\d{2}\b",
        "D": r"\bD-\d{3}\b",
        "Q": r"\bQ-\d{2}\b",
        "K": r"\bK-\d{2}\b",
        "S": r"\bS-\d{2}\b",
        "C": r"\bC-\d{2}\b",
        "MX": r"\b(?:ON|TP|TS|TH|NU|RE|BP|AH|CH|SY)-\d{2}\b",
    }
    milestones = {f"M{n}" for n in range(14)}
    errors: list[str] = []
    for doc in DOCS:
        text = doc.read_text(encoding="utf-8")
        name = doc.relative_to(ROOT)
        for key, pat in patterns.items():
            for ref in sorted(set(re.findall(pat, text)) - defs[key]):
                errors.append(f"{name}: unbekannter Verweis {ref}")
        for ref in sorted(set(re.findall(r"\bM(\d{1,2})\b", text))):
            if f"M{ref}" not in milestones:
                errors.append(f"{name}: unbekannter Meilenstein M{ref}")
        cols, in_code = None, False
        for i, line in enumerate(text.splitlines(), 1):
            if line.startswith("```"):
                in_code, cols = not in_code, None
                continue
            if in_code:
                continue
            if line.startswith("|"):
                n = line.count("|") - line.count("\\|")
                if cols is None:
                    cols = n
                elif n != cols:
                    errors.append(f"{name}:{i}: Tabellenzeile mit {n - 1} statt {cols - 1} Spalten")
            else:
                cols = None
    print("Definiert:", {k: len(v) for k, v in defs.items()})
    if errors:
        print(f"{len(errors)} Probleme:")
        for e in errors:
            print("  -", e)
        return 1
    print("Querverweise und Tabellen in Ordnung")
    return 0


if __name__ == "__main__":
    sys.exit(main())
