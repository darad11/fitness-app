#!/usr/bin/env python3
"""Auswahlliste der Grundnahrungsmittel prüfen und zusammenfassen (Phase Ernährung §2, D-358, D-361).

Quelle der Wahrheit ist docs/lebensmittel-auswahl.csv (UTF-8 mit BOM, Semikolon), vom
Produktinhaber am 25.10.2026 freigegeben. Das Skript prüft sie gegen tools/data/bls-4.0.json und
tools/data/usda-sr28-auswahl.json:
  - Kopfzeile und Spaltenzahl,
  - Gruppen aus der festen Liste und in deren Reihenfolge sortiert,
  - Anzeigenamen, BLS-Codes und USDA-Nummern je nur einmal,
  - BLS-Code vorhanden und BLS-Bezeichnung wortgleich mit dem BLS,
  - ohne BLS-Code: Quelle „USDA SR28 <Nummer> „<Bezeichnung>“ …“ (Nummer und Bezeichnung wie im
    Auszug) oder „fehlt im BLS …“ (dann nicht in der App),
  - Einheit leer oder eine der festen Einheiten; Stückgewicht nur mit Einheit, als positive Zahl
    und mit Herkunft; eine Einheit ohne Stückgewicht hat die Herkunft „offen …“; ein Hinweis nur
    mit Einheit,
  - abgeleitete Werte (Regel D-361): nur 0 g für einen Wert, der in der Quelle fehlt; Ballaststoffe
    bei rein tierischen Lebensmitteln und reinen Fetten, Eiweiß und Kohlenhydrate bei reinen Fetten
    (Gruppe Öle und Fette, mindestens 99 g Fett); wo die Regel greift, ist sie auch angewandt.
Ohne Schalter gibt es danach die Zusammenfassung aus (Anzahl je Gruppe, Stückgewichte, Lücken).
Mit --build entsteht daraus die Datei der App, src/modules/nutrition/data/basicFoods.json
(Phase Ernährung §6, D-362): je Eintrag Quelle, Code, Bezeichnung in der Quelle, Anzeigename,
Suchbegriffe, Einheit, Stückgewicht, Hinweis, abgeleitete Werte und die acht Nährwerte je 100 g.
USDA-Werte werden dabei nach den EU-Regeln umgerechnet (`usda_eu`). Zeilen „fehlt im BLS“ kommen
nicht in die App.
Mit --check nur die Prüfung (für pnpm check:docs), dazu der Vergleich mit der Datei der App.
Exit-Code 1, wenn eine Regel verletzt ist oder die Datei der App nicht zur Liste passt.
"""
from __future__ import annotations

import csv
import json
import re
import sys
from collections import Counter
from decimal import ROUND_HALF_UP, Decimal
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSV_PATH = ROOT / "docs" / "lebensmittel-auswahl.csv"
BLS_PATH = ROOT / "tools" / "data" / "bls-4.0.json"
USDA_PATH = ROOT / "tools" / "data" / "usda-sr28-auswahl.json"
APP_PATH = ROOT / "src" / "modules" / "nutrition" / "data" / "basicFoods.json"

COLUMNS = [
    "Anzeigename", "Suchbegriffe", "Gruppe", "Zubereitung", "BLS-Code", "BLS-Bezeichnung",
    "Stückgewicht (g)", "Herkunft des Stückgewichts", "Quelle", "Einheit", "Hinweis in der App",
    "Abgeleitete Werte",
]
GROUPS = [
    "Obst", "Gemüse", "Erdäpfel", "Hülsenfrüchte", "Getreide und Getreideprodukte", "Eier",
    "Milch und Milchprodukte", "Fleisch", "Geflügel", "Wurst und Schinken", "Fisch",
    "Nüsse und Samen", "Öle und Fette", "Zucker, Honig und Marmelade", "Getränke",
]
UNITS = ["Stück", "Scheibe", "Zehe", "Stange", "Kolben"]
HINT_MAX = 40
SOURCE_BLS = "BLS 4.0"
MISSING_PREFIX = "fehlt im BLS"
USDA_RE = re.compile(r"^USDA SR28 (\d{5}) „([^“]+)“, umgerechnet nach EU-Regeln")
WEIGHT_RE = re.compile(r"^\d+(,\d+)?$")

# Regel für abgeleitete Werte (Entscheidung 3 des Produktinhabers, D-361).
ANIMAL_GROUPS = {"Eier", "Milch und Milchprodukte", "Fleisch", "Geflügel", "Wurst und Schinken", "Fisch"}
ANIMAL_FATS = {"Butter", "Butterschmalz", "Schweineschmalz"}  # tierisch in der Gruppe Öle und Fette
PURE_FAT_MIN = 99
DERIVED_LABELS = {"Eiweiß": "protein", "Kohlenhydrate": "carbs", "Ballaststoffe": "fiber"}
NUTRIENT_LABEL = {key: label for label, key in DERIVED_LABELS.items()}
DERIVED_RE = re.compile(r"^(Eiweiß|Kohlenhydrate|Ballaststoffe) 0 g \((rein tierisch|reines Fett)\)$")


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


def load_bls() -> dict[str, dict[str, object]]:
    data = json.loads(BLS_PATH.read_text(encoding="utf-8"))
    return {food[0]: dict(zip(data["fields"], food)) for food in data["foods"]}


def load_usda() -> dict[str, dict[str, object]]:
    data = json.loads(USDA_PATH.read_text(encoding="utf-8"))
    return {food[0]: dict(zip(data["fields"], food)) for food in data["foods"]}


def usda_ref(row: dict[str, str]) -> tuple[str, str] | None:
    match = USDA_RE.match(row["Quelle"])
    return (match.group(1), match.group(2)) if match else None


def is_pure_fat(row: dict[str, str], values: dict[str, object] | None) -> bool:
    fat = values.get("fat") if values else None
    return row["Gruppe"] == "Öle und Fette" and isinstance(fat, (int, float)) and fat >= PURE_FAT_MIN


def is_animal(row: dict[str, str]) -> bool:
    return row["Gruppe"] in ANIMAL_GROUPS or row["Anzeigename"] in ANIMAL_FATS


def rule_reasons(row: dict[str, str], values: dict[str, object] | None, nutrient: str) -> set[str]:
    """Gründe, mit denen ein fehlender Wert nach der Regel 0 g sein darf."""
    reasons: set[str] = set()
    if nutrient == "fiber" and is_animal(row):
        reasons.add("rein tierisch")
    if is_pure_fat(row, values):
        reasons.add("reines Fett")
    return reasons


def check_derived(row: dict[str, str], values: dict[str, object] | None, where: str) -> list[str]:
    errors: list[str] = []
    derived: dict[str, str] = {}
    text = row["Abgeleitete Werte"]
    if text:
        for part in text.split(", "):
            match = DERIVED_RE.match(part)
            if not match:
                errors.append(f"{where}: abgeleiteter Wert „{part}“ nicht im Format „Ballaststoffe 0 g (rein tierisch)“")
                continue
            nutrient = DERIVED_LABELS[match.group(1)]
            if nutrient in derived:
                errors.append(f"{where}: {match.group(1)} doppelt abgeleitet")
            derived[nutrient] = match.group(2)
    if values is None:
        if derived:
            errors.append(f"{where}: abgeleitete Werte ohne Nährwerte aus einer Quelle")
        return errors
    for nutrient, reason in derived.items():
        if values.get(nutrient) is not None:
            errors.append(f"{where}: {NUTRIENT_LABEL[nutrient]} steht in der Quelle und darf nicht abgeleitet werden")
        elif reason not in rule_reasons(row, values, nutrient):
            errors.append(f"{where}: Regel „{reason}“ gilt hier nicht für {NUTRIENT_LABEL[nutrient]}")
    for nutrient in DERIVED_LABELS.values():
        if values.get(nutrient) is None and nutrient not in derived and rule_reasons(row, values, nutrient):
            errors.append(f"{where}: {NUTRIENT_LABEL[nutrient]} fehlt in der Quelle, die Regel für abgeleitete Werte greift, ist aber nicht eingetragen")
    return errors


def source_values(row: dict[str, str], bls: dict[str, dict[str, object]],
                  usda: dict[str, dict[str, object]]) -> dict[str, object] | None:
    if row["BLS-Code"]:
        return bls.get(row["BLS-Code"])
    ref = usda_ref(row)
    if ref and ref[0] in usda:
        raw = usda[ref[0]]
        return {"protein": raw["protein"], "carbs": raw["carbsByDifference"], "fiber": raw["fiber"],
                "fat": raw["fat"]}
    return None


def check(rows: list[dict[str, str]], bls: dict[str, dict[str, object]],
          usda: dict[str, dict[str, object]]) -> list[str]:
    errors: list[str] = []
    names: Counter[str] = Counter(r["Anzeigename"].casefold() for r in rows)
    codes: Counter[str] = Counter(r["BLS-Code"] for r in rows if r["BLS-Code"])
    usda_numbers: Counter[str] = Counter(ref[0] for r in rows if (ref := usda_ref(r)))
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
            elif r["BLS-Bezeichnung"] != bls[code]["name"]:
                errors.append(f"{where}: BLS-Bezeichnung weicht ab (BLS: „{bls[code]['name']}“)")
            if codes[code] > 1:
                errors.append(f"{where}: BLS-Code {code} doppelt")
            if r["Quelle"] != SOURCE_BLS:
                errors.append(f"{where}: Quelle muss „{SOURCE_BLS}“ sein")
        else:
            if r["BLS-Bezeichnung"]:
                errors.append(f"{where}: BLS-Bezeichnung ohne BLS-Code")
            ref = usda_ref(r)
            if ref:
                number, description = ref
                if number not in usda:
                    errors.append(f"{where}: USDA-Nummer {number} fehlt in {USDA_PATH.name}")
                elif description != usda[number]["description"]:
                    errors.append(f"{where}: USDA-Bezeichnung weicht ab (USDA: „{usda[number]['description']}“)")
                if usda_numbers[number] > 1:
                    errors.append(f"{where}: USDA-Nummer {number} doppelt")
            elif not r["Quelle"].startswith(MISSING_PREFIX):
                errors.append(f"{where}: ohne BLS-Code muss die Quelle mit „USDA SR28“ oder „{MISSING_PREFIX}“ beginnen")
        unit, weight = r["Einheit"], r["Stückgewicht (g)"]
        origin, hint = r["Herkunft des Stückgewichts"], r["Hinweis in der App"]
        if unit and unit not in UNITS:
            errors.append(f"{where}: unbekannte Einheit „{unit}“ (erlaubt: {', '.join(UNITS)})")
        if weight:
            if not unit:
                errors.append(f"{where}: Stückgewicht ohne Einheit")
            if not WEIGHT_RE.match(weight) or float(weight.replace(",", ".")) <= 0:
                errors.append(f"{where}: Stückgewicht „{weight}“ ist keine positive Zahl")
            if not origin or origin.startswith("offen"):
                errors.append(f"{where}: Stückgewicht ohne Herkunft")
        elif unit and not origin.startswith("offen"):
            errors.append(f"{where}: Einheit ohne Stückgewicht braucht die Herkunft „offen …“")
        elif not unit and origin:
            errors.append(f"{where}: Herkunft des Stückgewichts ohne Einheit")
        if hint and not unit:
            errors.append(f"{where}: Hinweis ohne Einheit")
        if len(hint) > HINT_MAX:
            errors.append(f"{where}: Hinweis länger als {HINT_MAX} Zeichen")
        errors += check_derived(r, source_values(r, bls, usda), where)
    return errors


def summary(rows: list[dict[str, str]]) -> str:
    lines = ["| Gruppe | Einträge | aus dem BLS | aus USDA | nicht in der App | Stückgewicht belegt | Stückgewicht offen |",
             "|---|---:|---:|---:|---:|---:|---:|"]
    total = Counter()
    for group in GROUPS:
        part = [r for r in rows if r["Gruppe"] == group]
        counts = Counter(
            all=len(part),
            bls=sum(1 for r in part if r["BLS-Code"]),
            usda=sum(1 for r in part if usda_ref(r)),
            missing=sum(1 for r in part if r["Quelle"].startswith(MISSING_PREFIX)),
            weight=sum(1 for r in part if r["Stückgewicht (g)"]),
            open=sum(1 for r in part if r["Einheit"] and not r["Stückgewicht (g)"]),
        )
        total.update(counts)
        lines.append(f"| {group} | {counts['all']} | {counts['bls']} | {counts['usda']} | {counts['missing']} | "
                     f"{counts['weight']} | {counts['open']} |")
    lines.append(f"| **Summe** | **{total['all']}** | **{total['bls']}** | **{total['usda']}** | "
                 f"**{total['missing']}** | **{total['weight']}** | **{total['open']}** |")
    usda_rows = [r["Anzeigename"] for r in rows if usda_ref(r)]
    missing = [f"{r['Anzeigename']} ({r['Gruppe']})" for r in rows if r["Quelle"].startswith(MISSING_PREFIX)]
    derived = [f"{r['Anzeigename']}: {r['Abgeleitete Werte']}" for r in rows if r["Abgeleitete Werte"]]
    lines += ["", "Aus USDA: " + ", ".join(usda_rows), "", "Nicht in der App: " + ", ".join(missing), "",
              "Abgeleitet: " + "; ".join(derived)]
    return "\n".join(lines)


NUTRIENTS = ["kcal", "protein", "carbs", "sugar", "fat", "saturatedFat", "fiber", "salt"]
APP_FIELDS = ["origin", "code", "sourceName", "name", "aliases", "unit", "pieceGrams", "pieceHint",
              "derived", *NUTRIENTS]


def rounded(value: Decimal, places: int) -> int | float:
    """Kaufmännisch gerundet (0,005 wird 0,01), ganze Zahlen ohne Nachkommastellen."""
    result = value.quantize(Decimal(1).scaleb(-places), rounding=ROUND_HALF_UP)
    return int(result) if result == result.to_integral_value() else float(result)


def usda_eu(raw: dict[str, object]) -> dict[str, int | float | None]:
    """USDA SR28 je 100 g nach den EU-Regeln (D-361): Kohlenhydrate ohne Ballaststoffe, Energie mit
    4/4/9 und 2 kcal je g Ballaststoffe, Salz = Natrium × 2,5."""
    def dec(key: str) -> Decimal | None:
        value = raw[key]
        return None if value is None else Decimal(str(value))
    protein, fat, fiber = dec("protein"), dec("fat"), dec("fiber")
    by_difference, sugar, saturated, sodium = (dec("carbsByDifference"), dec("sugar"),
                                               dec("saturatedFat"), dec("sodiumMg"))
    if protein is None or fat is None or by_difference is None or fiber is None:
        raise SystemExit(f"USDA {raw['ndb']}: Eiweiß, Fett, Kohlenhydrate und Ballaststoffe nötig")
    carbs = max(by_difference - fiber, Decimal(0))
    kcal = 4 * protein + 4 * carbs + 9 * fat + 2 * fiber
    return {
        "kcal": rounded(kcal, 0),
        "protein": rounded(protein, 2),
        "carbs": rounded(carbs, 2),
        "sugar": None if sugar is None else rounded(sugar, 2),
        "fat": rounded(fat, 2),
        "saturatedFat": None if saturated is None else rounded(saturated, 2),
        "fiber": rounded(fiber, 2),
        "salt": None if sodium is None else rounded(sodium * Decimal("2.5") / 1000, 2),
    }


def build(rows: list[dict[str, str]], bls: dict[str, dict[str, object]],
          usda: dict[str, dict[str, object]]) -> str:
    """Datei der App als Text: eine Zeile je Lebensmittel, damit Änderungen im Diff lesbar bleiben."""
    foods = []
    for r in rows:
        if r["Quelle"].startswith(MISSING_PREFIX):
            continue
        if r["BLS-Code"]:
            origin, code, source_name = "bls", r["BLS-Code"], r["BLS-Bezeichnung"]
            values = {n: bls[code][n] for n in NUTRIENTS}
        else:
            ref = usda_ref(r)
            assert ref, r["Anzeigename"]
            origin, code, source_name = "usda", ref[0], ref[1]
            values = usda_eu(usda[code])
        derived = []
        for part in filter(None, r["Abgeleitete Werte"].split(", ")):
            match = DERIVED_RE.match(part)
            assert match, part
            nutrient = DERIVED_LABELS[match.group(1)]
            derived.append(nutrient)
            values[nutrient] = 0
        weight = r["Stückgewicht (g)"]
        piece = None
        if weight:
            number = Decimal(weight.replace(",", "."))
            piece = rounded(number, 1)
        # Getrennt durch Komma und Leerzeichen; „Milch 0,5 %“ bleibt ein Begriff.
        aliases = [term.strip() for term in r["Suchbegriffe"].split(", ") if term.strip()]
        foods.append([origin, code, source_name, r["Anzeigename"], aliases, r["Einheit"] or None, piece,
                      r["Hinweis in der App"] or None, sorted(derived, key=NUTRIENTS.index),
                      *(values[n] for n in NUTRIENTS)])
    head = {
        "version": 1,
        "list": "docs/lebensmittel-auswahl.csv (freigegeben am 25.10.2026, D-361)",
        "fields": APP_FIELDS,
    }
    lines = ["{"]
    for key, value in head.items():
        lines.append(f"  {json.dumps(key)}: {json.dumps(value, ensure_ascii=False)},")
    lines.append('  "foods": [')
    for i, food in enumerate(foods):
        comma = "," if i < len(foods) - 1 else ""
        lines.append(f"    {json.dumps(food, ensure_ascii=False, separators=(',', ':'))}{comma}")
    lines += ["  ]", "}", ""]
    return "\n".join(lines)


def main() -> int:
    rows = read_rows()
    bls, usda = load_bls(), load_usda()
    errors = check(rows, bls, usda)
    for error in errors:
        print(f"lebensmittel-auswahl: {error}", file=sys.stderr)
    if errors:
        return 1
    args = sys.argv[1:]
    built = build(rows, bls, usda)
    if "--build" in args:
        APP_PATH.write_text(built, encoding="utf-8")
        count = built.count("\n    [")
        print(f"lebensmittel-auswahl: {count} Lebensmittel -> {APP_PATH.relative_to(ROOT)}")
        return 0
    if "--check" in args:
        current = APP_PATH.read_text(encoding="utf-8") if APP_PATH.exists() else ""
        if current != built:
            print(f"lebensmittel-auswahl: {APP_PATH.relative_to(ROOT)} passt nicht zur Liste; "
                  "python3 tools/lebensmittel_auswahl.py --build ausführen", file=sys.stderr)
            return 1
        print(f"lebensmittel-auswahl: {len(rows)} Einträge geprüft, Datei der App aktuell")
    else:
        print(summary(rows))
    return 0


if __name__ == "__main__":
    sys.exit(main())
