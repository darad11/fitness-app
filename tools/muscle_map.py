"""Erzeugt die Pfade der Muskelkarte (Phase Übungen, D-401).

Quelle: npm-Paket `react-native-body-highlighter` 3.2.0 (MIT, Copyright (c) 2022 ELABBASSI Hicham),
Dateien `dist/assets/bodyFront.js`, `dist/assets/bodyBack.js` und die Umrisse aus
`dist/components/SvgMaleWrapper.js`. Übernommen werden nur die Pfade (ohne Haare); Farben,
Zuordnung und Darstellung sind eigene. Die Dateien werden als Text gelesen, nicht ausgeführt.

    curl -sSO https://registry.npmjs.org/react-native-body-highlighter/-/react-native-body-highlighter-3.2.0.tgz
    tar xzf react-native-body-highlighter-3.2.0.tgz
    python3 -I tools/muscle_map.py package
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ZIEL = Path(__file__).resolve().parent.parent / "src/modules/exercises/ui/muscleMapPaths.ts"
WEG = {"hair"}


def teile(text: str) -> list[tuple[str, list[str]]]:
    bloecke = re.split(r'slug:\s*"', text)[1:]
    ergebnis = []
    for block in bloecke:
        slug = block[: block.index('"')]
        if slug in WEG:
            continue
        pfade = re.findall(r'"(M[^"]+)"', block)
        ergebnis.append((slug, [" ".join(p.split()) for p in pfade]))
    return ergebnis


def umriss(text: str, seite: str) -> str:
    treffer = re.search(r'd="(M[^"]+)"[^>]*accessibilityLabel="male-body-outline-' + seite, text)
    if not treffer:
        raise SystemExit(f"Umriss {seite} fehlt")
    return " ".join(treffer.group(1).split())


def main() -> None:
    paket = Path(sys.argv[1])
    huelle = (paket / "dist/components/SvgMaleWrapper.js").read_text(encoding="utf-8")
    ansichten = {
        "front": ("0 0 724 1448", paket / "dist/assets/bodyFront.js"),
        "back": ("724 0 724 1448", paket / "dist/assets/bodyBack.js"),
    }
    zeilen = [
        "// Erzeugt von tools/muscle_map.py, nicht von Hand ändern.",
        "// Pfade aus react-native-body-highlighter 3.2.0, MIT, Copyright (c) 2022 ELABBASSI Hicham",
        "// (Lizenz in docs/licenses-data.md). Farben und Zuordnung sind eigene (D-401).",
        "",
        "export interface MuscleMapView {",
        "  viewBox: string;",
        "  outline: string;",
        "  parts: readonly (readonly [region: string, paths: readonly string[]])[];",
        "}",
        "",
        "export const MUSCLE_MAP_VIEWS: Readonly<Record<'front' | 'back', MuscleMapView>> = {",
    ]
    for name, (box, datei) in ansichten.items():
        zeilen.append(f"  {name}: {{")
        zeilen.append(f"    viewBox: '{box}',")
        zeilen.append(f"    outline: '{umriss(huelle, name)}',")
        zeilen.append("    parts: [")
        for slug, pfade in teile(datei.read_text(encoding="utf-8")):
            liste = ", ".join(f"'{p}'" for p in pfade)
            zeilen.append(f"      ['{slug}', [{liste}]],")
        zeilen.append("    ],")
        zeilen.append("  },")
    zeilen.append("};")
    ZIEL.write_text("\n".join(zeilen) + "\n", encoding="utf-8")
    print(f"{ZIEL.relative_to(ZIEL.parents[4])}: {ZIEL.stat().st_size} Bytes")


if __name__ == "__main__":
    main()
