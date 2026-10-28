#!/usr/bin/env python3
"""Erzeugt docs/uebungen-animationsplan.md (D-429): die Animationen, die vorerst gebaut werden, nämlich
für die Übungen der Programme „Ganzkörper A/B, 4 Tage“, „Push/Pull/Beine, rotierend“ und
„Winterprogramm 2026“ (`programs.v1.json`). Je Übung die Bewegungsfamilie, die Quelle der Bewegung,
der geschätzte Aufwand und die Renderzeit (aus `tools/uebungen-3d/familien.json`, D-411, und den
gemessenen Renderzeiten der Pilot-Übungen); dazu die Summen und die Reihenfolge nach Familien.

    python3 tools/uebungen_animationsplan.py           # schreibt den Plan
    python3 tools/uebungen_animationsplan.py --check   # prüft, ob der Plan zu den Daten passt
"""
from __future__ import annotations

import json
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATEN = ROOT / "tools/uebungen-3d/familien.json"
PROGRAMME = ROOT / "src/modules/training/data/programs.v1.json"
ZIEL = ROOT / "docs/uebungen-animationsplan.md"
# Die drei Programme (Name in `programs.v1.json`) und ihr Kürzel in den Tabellen
PROGRAMM_KUERZEL = {"Ganzkörper A/B, 4 Tage": "GK", "Push/Pull/Beine, rotierend": "PPB", "Winterprogramm 2026": "W26"}
# Pilot-Übungen: Rig, Kamera und Bewegung stehen (D-407, D-408); ihre Familienbasis ist geleistet
PILOTEN = {"back_squat_barbell", "bench_press_barbell", "lat_pulldown"}
# Renderzeit je Übung: 60 Bilder der Schleife à 23 s (C männlich, Fassung A1, 720 × 540, 40 Proben,
# ein Prozess auf vier CPU-Kernen; gemessen an den Standbildern D-424: Kniebeuge 18 s, Bankdrücken
# 25 s) plus Aufbau und Vorschaubild rund 1 min. Übungen mit großem Gerät oder zwei Hanteln
# brauchen mehr Fläche im Bild; dafür 10 % Zuschlag (`geraet_modell` nicht „keins“).
BILDER = 60
SEKUNDEN_JE_BILD = 23.0
ZUSCHLAG_GERAET = 1.1
RUESTZEIT_MIN = 1.0
NAMEN = {
    "kniebeuge": "Kniebeuge",
    "hueftbeuge": "Hüftbeuge",
    "ausfallschritt": "Ausfallschritt und einbeinig",
    "waagrecht_druecken": "Waagrechtes Drücken",
    "senkrecht_druecken": "Senkrechtes Drücken",
    "waagrecht_ziehen": "Waagrechtes Ziehen",
    "senkrecht_ziehen": "Senkrechtes Ziehen",
    "arme": "Arme beugen und strecken",
    "schulter_brust_isoliert": "Schulter und Brust isoliert",
    "beine_isoliert": "Beine isoliert",
    "rumpf": "Rumpf",
    "kondition": "Kondition",
}
QUELLE = {"familie": "Familie (Code)", "cmu": "CMU", "mixamo": "Mixamo"}


def z(x: float, stellen: int = 1) -> str:
    return f"{x:.{stellen}f}".replace(".", ",")


def zelle(text) -> str:
    return " ".join(str(text).split()).replace("|", "/")


def einheiten_je_uebung() -> tuple[dict[str, int], dict[str, set[str]]]:
    """Einheiten je Übung im Verlauf der drei Programme (je Woche die Tage laut `weeks`) und die
    Programme, in denen sie vorkommt."""
    programme = json.loads(PROGRAMME.read_text(encoding="utf-8"))["templates"]
    einheiten: dict[str, int] = defaultdict(int)
    in_programm: dict[str, set[str]] = defaultdict(set)
    gefunden = set()
    for prog in programme:
        kuerzel = PROGRAMM_KUERZEL.get(prog["name"])
        if not kuerzel:
            continue
        gefunden.add(prog["name"])
        tage = {t["name"]: {x["exercise"] for x in t["exercises"]} for t in prog["days"]}
        for woche in prog["weeks"]:
            for tag in woche:
                for e in tage[tag]:
                    einheiten[e] += 1
                    in_programm[e].add(kuerzel)
    fehlend = set(PROGRAMM_KUERZEL) - gefunden
    if fehlend:
        raise SystemExit(f"Programme nicht gefunden: {sorted(fehlend)}")
    return einheiten, in_programm


def renderzeit_min(e: dict) -> float:
    minuten = BILDER * SEKUNDEN_JE_BILD / 60
    if e.get("geraet_modell", "keins") != "keins":
        minuten *= ZUSCHLAG_GERAET
    return minuten + RUESTZEIT_MIN


def quelle_text(e: dict) -> str:
    q = QUELLE[e["quelle"]]
    if e["quelle"] == "mixamo" and e.get("mixamo_name"):
        q += f" „{e['mixamo_name']}“"
    elif e["quelle"] == "cmu" and e.get("cmu_trial"):
        q += f" {e['cmu_trial']}"
    return q


def bauen() -> str:
    d = json.loads(DATEN.read_text(encoding="utf-8"))
    uebungen, familien = d["uebungen"], d["familien"]
    einheiten, in_programm = einheiten_je_uebung()
    keys = [k for k in einheiten if k in uebungen]
    unbekannt = sorted(k for k in einheiten if k not in uebungen)
    je_familie: dict[str, list[str]] = defaultdict(list)
    for k in keys:
        je_familie[uebungen[k]["familie"]].append(k)
    # Reihenfolge der Familien: Pilot-Familien zuerst (Basis steht), dann nach Einheiten in den drei
    # Programmen; innerhalb der Familie nach Einheiten, dann Name
    pilot_familien = [uebungen[p]["familie"] for p in ("back_squat_barbell", "bench_press_barbell", "lat_pulldown")]

    def summe(f: str) -> int:
        return sum(einheiten[k] for k in je_familie[f])

    reihenfolge = sorted(je_familie, key=lambda f: (f not in pilot_familien, -summe(f), NAMEN[f]))
    for f in je_familie:
        je_familie[f].sort(key=lambda k: (-einheiten[k], uebungen[k]["name"]))

    zeilen = [
        "# Animationsplan: Übungen der drei Programme",
        "",
        f"Stand: {d['stand']} (Zuordnung D-411), Plan vom 28.10.2026 (D-429). Erzeugt aus `tools/uebungen-3d/familien.json` und "
        "`src/modules/training/data/programs.v1.json` mit `tools/uebungen_animationsplan.py`; Änderungen dort, nicht hier.",
        "",
        "Vorerst bekommen nur die Übungen der Programme „Ganzkörper A/B, 4 Tage“ (GK), „Push/Pull/Beine, rotierend“ (PPB) und "
        "„Winterprogramm 2026“ (W26) eine Animation (Entscheidung des Produktinhabers, fünfte Nachricht vom 28.10.2026). Die drei "
        "Pilot-Übungen (Kniebeuge mit Langhantel, Bankdrücken mit Langhantel, Latziehen) sind gebaut und werden in der gewählten Fassung "
        "(C männlich, A1, Brust-F 4 cm) neu gerendert; ihre Familien haben die Basis (Rig-Muster, Kamera) schon.",
        "",
        "## 1. Was gezählt ist",
        "",
        "- **Einheiten:** wie oft die Übung im Verlauf der drei Programme vorkommt (je Woche die Tage laut Plan).",
        "- **Quelle der Bewegung:** „Familie (Code)“ heißt aus dem Grundmuster der Familie im Rig gebaut (wie die Piloten); "
        "„Mixamo“ und „CMU“ sind Aufnahmen, die übertragen werden (`docs/uebungen-bewegungsfamilien.md` Abschnitt 5).",
        "- **Aufwand:** Arbeitsstunden je Übung aus D-411 (Variante bauen und prüfen) plus das neue Gerät, einmal gezählt bei der "
        "ersten Übung, die es braucht; dazu je Familie die Basis (Grundmuster, Rig-Regeln, Kamera, Prüfseite), bei den drei "
        "Pilot-Familien schon geleistet. Ohne Rechenzeit.",
        f"- **Renderzeit:** je Übung {BILDER} Bilder der Schleife à {z(SEKUNDEN_JE_BILD, 0)} s (C männlich, A1, 720 × 540, 40 Proben, "
        f"ein Prozess auf vier CPU-Kernen, gemessen an den Standbildern D-424: Kniebeuge 18 s, Bankdrücken 25 s) plus {z(RUESTZEIT_MIN, 0)} min "
        f"Aufbau und Vorschaubild; mit Gerät im Bild {z((ZUSCHLAG_GERAET - 1) * 100, 0)} % mehr. Die Rechenzeit läuft im Hintergrund, "
        "sie ist kein Arbeitsaufwand.",
        "",
        "## 2. Übungen nach Familien",
        "",
    ]
    geraete_gezaehlt: set[str] = set()
    gesamt = {"uebungen": 0, "stunden": 0.0, "geraete": 0.0, "basis": 0.0, "render": 0.0, "einheiten": 0}
    je_familie_summe = []
    for rang, f in enumerate(reihenfolge, start=1):
        basis = 0.0 if f in pilot_familien else float(familien[f]["basis_stunden"])
        zeilen += [f"### {rang}. {NAMEN[f]}", "",
                   "| Übung | Programme | Einheiten | Quelle der Bewegung | Aufwand (Std.) | davon neues Gerät | Renderzeit (min) | Hinweis |",
                   "|---|---|---|---|---|---|---|---|"]
        std_f = ger_f = ren_f = 0.0
        ein_f = 0
        for k in je_familie[f]:
            e = uebungen[k]
            geraet = 0.0
            neu = [g for g in e.get("geraet_neu", []) if g not in geraete_gezaehlt]
            if neu and e.get("geraet_neu_stunden"):
                geraet = float(e["geraet_neu_stunden"])
                geraete_gezaehlt.update(neu)
            std = float(e["aufwand_stunden"]) + geraet
            ren = renderzeit_min(e)
            hinweis = "Pilot, gebaut (neu rendern)" if k in PILOTEN else ("neues Gerät: " + ", ".join(neu) if neu else "")
            if e.get("geraet_neu") and not neu and k not in PILOTEN:
                hinweis = "Gerät schon gezählt"
            zeilen.append(f"| {zelle(e['name'])} | {', '.join(sorted(in_programm[k]))} | {einheiten[k]} | {zelle(quelle_text(e))} | "
                          f"{z(std, 2)} | {z(geraet, 2)} | {z(ren, 0)} | {zelle(hinweis)} |")
            std_f += std
            ger_f += geraet
            ren_f += ren
            ein_f += einheiten[k]
        zeilen += ["", f"Familie {NAMEN[f]}: {len(je_familie[f])} Übungen, {ein_f} Einheiten, Aufwand {z(std_f)} Std. "
                   f"(davon neue Geräte {z(ger_f)}) plus Basis {z(basis)} Std., Renderzeit {z(ren_f, 0)} min.", ""]
        je_familie_summe.append((rang, f, len(je_familie[f]), ein_f, std_f, ger_f, basis, ren_f))
        gesamt["uebungen"] += len(je_familie[f])
        gesamt["stunden"] += std_f
        gesamt["geraete"] += ger_f
        gesamt["basis"] += basis
        gesamt["render"] += ren_f
        gesamt["einheiten"] += ein_f
    # Einmalige Arbeiten: nur, was die genutzten Quellen brauchen
    quellen = {uebungen[k]["quelle"] for k in keys}
    einmalig = []
    for posten, wert in d["einmalig"].items():
        if not isinstance(wert, (int, float)):
            continue
        if posten.startswith("CMU") and "cmu" not in quellen:
            continue
        if posten.startswith("Mixamo") and "mixamo" not in quellen:
            continue
        if posten.startswith("Prüfseite"):
            wert = float(len(reihenfolge))  # 1 h je Familie, nur die Familien im Plan
            posten = f"Prüfseite je Familie ({len(reihenfolge)} × 1 h)"
        einmalig.append((posten, float(wert)))
    einmalig_std = sum(w for _, w in einmalig)
    zeilen += ["## 3. Summen und Reihenfolge", "",
               "| Rang | Familie | Übungen | Einheiten | Aufwand Übungen (Std.) | davon neue Geräte | Basis (Std.) | Renderzeit (min) |",
               "|---|---|---|---|---|---|---|---|"]
    for rang, f, n, ein, std, ger, basis, ren in je_familie_summe:
        zeilen.append(f"| {rang} | {NAMEN[f]} | {n} | {ein} | {z(std)} | {z(ger)} | {z(basis)} | {z(ren, 0)} |")
    zeilen.append(f"| | **Summe** | **{gesamt['uebungen']}** | **{gesamt['einheiten']}** | **{z(gesamt['stunden'])}** | "
                  f"**{z(gesamt['geraete'])}** | **{z(gesamt['basis'])}** | **{z(gesamt['render'], 0)}** |")
    zeilen += ["", "Einmalige Arbeiten für die genutzten Quellen:", ""]
    for posten, wert in einmalig:
        zeilen.append(f"- {posten}: {z(wert, 0)} Std.")
    arbeit = gesamt["stunden"] + gesamt["basis"] + einmalig_std
    zeilen += ["",
               f"**Gesamt: {gesamt['uebungen']} Übungen, rund {z(arbeit, 0)} Arbeitsstunden** (Übungen {z(gesamt['stunden'])}, Basis der "
               f"Familien {z(gesamt['basis'])}, einmalig {z(einmalig_std, 0)}) **und rund {z(gesamt['render'] / 60)} Stunden Rechenzeit** "
               f"({z(gesamt['render'], 0)} min) auf vier CPU-Kernen. Die Schätzung je Übung ist eine Einzelschätzung wie in D-411 "
               "(Spanne dort 250 bis 400 Stunden für alle 124 Übungen); nach den ersten beiden Familien wird sie an der Ist-Zeit nachgeführt.",
               "",
               "**Reihenfolge:** erst die drei Pilot-Familien (Kniebeuge, Waagrechtes Drücken, Senkrechtes Ziehen), weil Rig-Muster und "
               "Kamera stehen, dann die übrigen Familien nach Einheiten in den drei Programmen. Jede Familie kommt auf einem eigenen "
               "Branch mit Prüfseite; die Videos gehen erst in die App, wenn der Produktinhaber die Prüfseite freigibt.",
               ""]
    if unbekannt:
        zeilen += [f"Nicht in der Zuordnung (keine Übung, z. B. Platzhalter der Programme): {', '.join(f'`{k}`' for k in unbekannt)}.", ""]
    return "\n".join(zeilen)


def main() -> None:
    text = bauen()
    if "--check" in sys.argv:
        if not ZIEL.exists() or ZIEL.read_text(encoding="utf-8") != text:
            print(f"{ZIEL.relative_to(ROOT)} passt nicht zu den Daten; python3 tools/uebungen_animationsplan.py ausführen")
            raise SystemExit(1)
        print("uebungen_animationsplan ok")
        return
    ZIEL.write_text(text, encoding="utf-8")
    print(f"{ZIEL.relative_to(ROOT)} geschrieben")


if __name__ == "__main__":
    main()
