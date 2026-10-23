#!/usr/bin/env python3
"""Prüft, dass das Repository keine Hinweise auf die fremde App enthält, deren Programm die
Vorlage für Programm C war (F5 Abschnitt 7.1, D-328): weder ihren Namen noch den alten
Programmnamen noch das Wort für eine Kopie. Gelesen werden alle Dateien unter
Versionskontrolle und alle neuen, nicht ignorierten (ohne Bilder, Schriften und Archive).

Ausgenommen sind genau die dokumentierten, technisch nötigen Stellen mit ihrer Anzahl
(ALLOWED). Neue Treffer und nicht mehr nötige Ausnahmen sind Fehler (Exit-Code 1).
Die Suchmuster sind aus Teilen zusammengesetzt, damit diese Datei sich nicht selbst meldet.

  python3 tools/check_names.py
"""
from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

PATTERNS = [
    re.compile("xe" + "ela", re.IGNORECASE),
    re.compile(r"winter[\s_-]*" + "arc", re.IGNORECASE),
    re.compile("nach" + "bau", re.IGNORECASE),
]

# Datei → erlaubte Anzahl Treffer, jeweils mit Grund (D-328).
ALLOWED = {
    # Markenleitplanken: das Wort steht in der Liste der gestrichenen Wörter.
    "form-markenleitplanken.md": 1,
    # Wortfeld-Prüfung: die Regeln, die genau diese Wörter in Produkttexten verbieten.
    "src/app/wording.test.ts": 4,
    # Interner Schlüssel von Programm C: aus ihm entstehen gespeicherte IDs (programC.ts).
    "src/modules/training/data/programC.ts": 1,
    "src/modules/training/data/programs.v1.json": 1,
    "tools/data/programs.source.json": 1,
}

SKIP_SUFFIXES = {
    ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".pdf", ".zip",
    ".otf", ".ttf", ".woff", ".woff2",
}


def files() -> list[str]:
    try:
        out = subprocess.run(
            ["git", "ls-files", "--cached", "--others", "--exclude-standard"],
            cwd=ROOT, check=True, capture_output=True, text=True,
        ).stdout
        return sorted({line for line in out.splitlines() if line})
    except (OSError, subprocess.CalledProcessError):
        skip = {"node_modules", ".git", "dist", "dev-dist", "coverage", "test-results", "playwright-report"}
        return sorted(
            str(p.relative_to(ROOT)) for p in ROOT.rglob("*")
            if p.is_file() and not skip & set(p.relative_to(ROOT).parts)
        )


def main() -> int:
    errors: list[str] = []
    found: dict[str, int] = {}
    for name in files():
        path = ROOT / name
        if path.suffix.lower() in SKIP_SUFFIXES or not path.is_file():
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        hits = [
            (i, m.group(0), line.strip())
            for i, line in enumerate(text.splitlines(), 1)
            for pattern in PATTERNS
            for m in pattern.finditer(line)
        ]
        if hits:
            found[name] = len(hits)
            if found[name] != ALLOWED.get(name, 0):
                for i, word, line in hits:
                    errors.append(f"{name}:{i}: „{word}“ in: {line[:120]}")
    for name, count in ALLOWED.items():
        if found.get(name, 0) != count:
            errors.append(f"{name}: {found.get(name, 0)} Treffer, erwartet {count} (Ausnahme anpassen)")
    if errors:
        print(f"{len(errors)} Probleme (D-328):")
        for e in errors:
            print("  -", e)
        return 1
    print(f"Namen geprüft: {len(ALLOWED)} dokumentierte Ausnahmen, sonst keine Treffer")
    return 0


if __name__ == "__main__":
    sys.exit(main())
