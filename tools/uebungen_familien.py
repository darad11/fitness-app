#!/usr/bin/env python3
"""Erzeugt docs/uebungen-bewegungsfamilien.md aus tools/uebungen-3d/familien.json (D-411).

Die Zuordnung der 124 Basisübungen zu Bewegungsfamilien, Geräten und Quellen der Bewegung
(CMU-Motion-Capture, Mixamo oder im Code aus der Familie) steht als Daten in der JSON-Datei;
dieses Skript macht daraus die lesbare Übersicht mit Aufwandsschätzung. Abschnitt 8 zählt, wie oft
jede Übung in den Programmen (`programs.v1.json`) und Vorlagen (`sample-templates.v1.json`)
vorkommt, und ordnet die Familien danach (D-416).

    python3 tools/uebungen_familien.py           # schreibt die Übersicht
    python3 tools/uebungen_familien.py --check   # prüft, ob die Übersicht zu den Daten passt
"""
from __future__ import annotations

import json
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATEN = ROOT / "tools/uebungen-3d/familien.json"
ZIEL = ROOT / "docs/uebungen-bewegungsfamilien.md"
PROGRAMME = ROOT / "src/modules/training/data/programs.v1.json"
VORLAGEN = ROOT / "src/modules/training/data/sample-templates.v1.json"
# Die Kniebeuge-Familie kommt zuerst (Pilot, Rig und Kamera stehen), danach nach Häufigkeit (D-416)
ERSTE_FAMILIE = "kniebeuge"

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


def zelle(text: str) -> str:
    return " ".join(str(text).split()).replace("|", "/")


def zaehlen() -> tuple[dict, dict, dict, dict, list, list]:
    """Wie oft jede Übung vorkommt. Programme: Einheiten im Verlauf (je Woche die Tage laut `weeks`,
    über alle Wochen des Plans). Vorlagen: Tage, an denen sie vorkommt."""
    programme = json.loads(PROGRAMME.read_text(encoding="utf-8"))["templates"]
    vorlagen = json.loads(VORLAGEN.read_text(encoding="utf-8"))["templates"]
    einheiten: dict[str, int] = defaultdict(int)
    in_programm: dict[str, set] = defaultdict(set)
    for prog in programme:
        tage = {t["name"]: {x["exercise"] for x in t["exercises"]} for t in prog["days"]}
        for woche in prog["weeks"]:
            for tag in woche:
                for e in tage[tag]:
                    einheiten[e] += 1
                    in_programm[e].add(prog["name"])
    vorlage_tage: dict[str, int] = defaultdict(int)
    in_vorlage: dict[str, set] = defaultdict(set)
    for v in vorlagen:
        for t in v["days"]:
            for e in {x["exercise"] for x in t["exercises"]}:
                vorlage_tage[e] += 1
                in_vorlage[e].add(v["name"])
    return einheiten, in_programm, vorlage_tage, in_vorlage, programme, vorlagen


def geraete_stunden(uebungen: dict) -> dict[str, float]:
    """Neue Geräte mit Stunden (bei zwei Geräten an einer Übung je zur Hälfte)."""
    erg: dict[str, float] = {}
    for u in uebungen.values():
        neu = u.get("geraet_neu") or []
        for g in neu:
            erg[g] = round(u["geraet_neu_stunden"] / len(neu), 2)
    return erg


def prioritaet(d: dict) -> list[str]:
    """Abschnitt 8: Häufigkeit je Übung, Reihenfolge der Familien und Aufwand für ihre Programm-Übungen."""
    uebungen = d["uebungen"]
    einheiten, in_programm, vorlage_tage, in_vorlage, programme, vorlagen = zaehlen()
    fehlen = sorted((set(einheiten) | set(vorlage_tage)) - set(uebungen))
    if fehlen:
        raise SystemExit(f"Übungen ohne Familie in familien.json: {', '.join(fehlen)}")
    familien: dict[str, list[str]] = defaultdict(list)
    for key, u in uebungen.items():
        familien[u["familie"]].append(key)

    def summe(f: str, quelle: dict) -> int:
        return sum(quelle.get(k, 0) for k in familien[f])
    rest = sorted((f for f in NAMEN if f != ERSTE_FAMILIE),
                  key=lambda f: (-summe(f, einheiten), -summe(f, vorlage_tage), NAMEN[f]))
    reihenfolge = [ERSTE_FAMILIE] + rest
    geraete = geraete_stunden(uebungen)
    gebaut: set[str] = set()
    zeilen = [
        "## 8. Priorität nach Programmen und Vorlagen",
        "",
        f"Gezählt in `{PROGRAMME.relative_to(ROOT)}` ({len(programme)} Programme) und "
        f"`{VORLAGEN.relative_to(ROOT)}` ({len(vorlagen)} Vorlagen). **Einheiten** = wie oft die Übung im "
        "Verlauf eines Programms drankommt (je Woche die Tage des Plans, über alle Wochen; das rotierende "
        "Push/Pull/Beine-Programm steht mit drei Wochen im Plan). **Vorlagen** = Tage in den Vorlagen, an denen sie "
        "vorkommt. Übertragen wird zuerst, was in Programmen vorkommt; Übungen nur aus Vorlagen und alle übrigen "
        "behalten vorerst Symbol und Muskelkarte. Die Kniebeuge-Familie kommt zuerst (Pilot, Rig und Kamera stehen), "
        "danach die Familien nach ihren Einheiten in Programmen.",
        "",
        "### 8.1 Familien in Reihenfolge",
        "",
        "| Rang | Familie | Einheiten in Programmen | Übungen in Programmen | nur in Vorlagen | übrige (Symbol und Muskelkarte) | "
        "Aufwand für die Programm-Übungen (Std.) |",
        "|---|---|---|---|---|---|---|",
    ]
    aufwand = {}
    for rang, f in enumerate(reihenfolge, start=1):
        prog = [k for k in familien[f] if einheiten.get(k)]
        nur_vorlage = [k for k in familien[f] if not einheiten.get(k) and vorlage_tage.get(k)]
        uebrig = len(familien[f]) - len(prog) - len(nur_vorlage)
        neue = []
        for k in prog:
            for g in [t.strip() for t in uebungen[k]["geraet_modell"].split("+")]:
                if g in geraete and g not in gebaut:
                    gebaut.add(g)
                    neue.append(g)
        std_u = sum(uebungen[k]["aufwand_stunden"] for k in prog)
        std_g = sum(geraete[g] for g in neue)
        basis = d["familien"][f]["basis_stunden"] if prog else 0
        pruefseite = 1 if prog else 0
        gesamt = basis + std_u + std_g + pruefseite
        aufwand[f] = (basis, std_u, std_g, pruefseite, gesamt, prog, neue)
        zeilen.append(f"| {rang} | {NAMEN[f]} | {summe(f, einheiten)} | {len(prog)} | {len(nur_vorlage)} | {uebrig} | "
                      f"{gesamt:.1f} |")
    zeilen += [
        "",
        "Aufwand je Familie = Basis der Familie + Übungen in Programmen + neue Geräte, die diese Übungen brauchen "
        "(jedes Gerät einmal, in der ersten Familie, die es braucht) + 1 Std. Prüfseite; Werte aus Abschnitt 2 bis 4.",
        "",
        "### 8.2 Übungen in Programmen und Vorlagen",
        "",
        "| Familie | Übung | Einheiten in Programmen | Programme | Tage in Vorlagen | Vorlagen |",
        "|---|---|---|---|---|---|",
    ]
    for f in reihenfolge:
        liste = [k for k in familien[f] if einheiten.get(k) or vorlage_tage.get(k)]
        liste.sort(key=lambda k: (-einheiten.get(k, 0), -vorlage_tage.get(k, 0), uebungen[k]["nr"]))
        for k in liste:
            zeilen.append(
                f"| {NAMEN[f]} | {zelle(uebungen[k]['name'])} | {einheiten.get(k, 0)} | "
                f"{zelle(', '.join(sorted(in_programm.get(k, []))) or '–')} | {vorlage_tage.get(k, 0)} | "
                f"{zelle(', '.join(sorted(in_vorlage.get(k, []))) or '–')} |"
            )
    zeilen += ["", "### 8.3 Aufwand der ersten drei Familien", ""]
    for f in reihenfolge[:3]:
        basis, std_u, std_g, pruef, gesamt, prog, neue = aufwand[f]
        namen = ", ".join(f"{uebungen[k]['name']} ({uebungen[k]['aufwand_stunden']:g})"
                          for k in sorted(prog, key=lambda k: uebungen[k]["nr"]))
        geraet = ", ".join(f"{g} ({geraete[g]:g})" for g in neue) or "keine"
        fremd = [k for k in prog if uebungen[k]["quelle"] in ("mixamo", "cmu")]
        zusatz = ""
        if fremd:
            quellen = sorted({QUELLE[uebungen[k]["quelle"]] for k in fremd})
            zusatz = (f" Bewegung aus {' und '.join(quellen)}: {', '.join(uebungen[k]['name'] for k in fremd)}; dafür einmalig "
                      "die Übertragung aufs Skelett (Abschnitt 4) und bei Mixamo die Dateien von dir, sonst aus der Familie "
                      "im Code.")
        zeilen.append(
            f"- **{NAMEN[f]}: rund {round(gesamt):d} Std.** Basis {basis:g}, Übungen {std_u:g} ({namen}), neue Geräte "
            f"{std_g:g} ({geraet}), Prüfseite {pruef:g}.{zusatz}"
        )
    zeilen += [
        "",
        "Die Zahlen sind meine Schätzung der Arbeitszeit, ohne Rechenzeit; die Rechenzeit hängt von der gewählten "
        "Variante der Figur ab (Renderzeiten in `form-uebungen-report.md` Abschnitt 11).",
        "",
    ]
    return zeilen


def main() -> None:
    d = json.loads(DATEN.read_text(encoding="utf-8"))
    uebungen = d["uebungen"]
    nach_familie: dict[str, list] = defaultdict(list)
    for key, u in uebungen.items():
        nach_familie[u["familie"]].append((key, u))
    zeilen = [
        "# Übungen · Bewegungsfamilien und Quellen der Animationen",
        "",
        "Stand: 27.10.2026 · Auftrag `prompts/uebungen-animation-gratis-FORM.md` Abschnitt 3 und 7 (D-411) · "
        "Daten `tools/uebungen-3d/familien.json`, Abschnitte 2 bis 8 erzeugt von `python3 tools/uebungen_familien.py`; "
        "Abschnitt 8 (Priorität nach Programmen und Vorlagen) Stand 28.10.2026, D-416. "
        "Recherche zu CMU und Mixamo nur über Websuche und GitHub, Bewegungsdaten nicht angesehen: Jede Zuordnung "
        "zu einer Aufnahme braucht vor dem Einbau eine Sichtprüfung.",
        "",
        "## 1. Verfahren",
        "",
        "- **Rig:** Alle Übungen laufen über dasselbe IK-Rig (`tools/uebungen-3d/rig.py`, D-407): Füße fest am Boden, "
        "Knie folgen den Zehen, Hände im Griff am Gerät, Ellbogen nach der Regel der Übung (etwa Unterarm senkrecht), "
        "Hand um die Stange gedreht, bis das Handgelenk gerade ist, Rumpf über Becken und Wirbelsäule.",
        "- **Quelle der Bewegung:** Motion Capture nur, wenn die Aufnahme dieselbe Übung zeigt; bei gleich guter "
        "Passung CMU vor Mixamo, weil CMU kein Konto braucht. Sonst baut der Code die Bewegung aus der Familie "
        "(Ausgangs-, Zwischen- und Endposition, Minimum-Ruck-Zeitverlauf). Auch bei Motion Capture korrigiert das Rig "
        "Hände, Füße und Gerät.",
        "- **Rohdaten nicht ins Repository:** Das Repository ist öffentlich. CMU-Daten dürfen nicht weiterverkauft, "
        "Mixamo-Dateien nicht weitergegeben werden; beide werden wie das MakeHuman-Modell beim Rendern geladen "
        "(`tools/uebungen-3d/quelle/`, in `.gitignore`). In die App kommen nur die gerenderten Videos. Lizenzen in "
        "`licenses-data.md` Abschnitt 7.",
        "- **Familien statt Einzelstücke:** Jede Familie wird einmal biomechanisch sauber gebaut; eine Übung ist eine "
        "Variante davon (Gerät, Griff, Winkel, Bewegungsumfang). Keine starre gleiche Haltung für alle.",
        "",
        "## 2. Familien",
        "",
        "| Familie | Grundmuster | Gelenke und Kennwerte | Übungen | Basis (Std.) |",
        "|---|---|---|---|---|",
    ]
    for f, name in NAMEN.items():
        info = d["familien"][f]
        zeilen.append(
            f"| {name} | {zelle(info['grundmuster'])} | {zelle(info['gelenke'])} | {len(nach_familie[f])} | "
            f"{info['basis_stunden']} |"
        )
    zeilen += ["", "## 3. Zuordnung aller 124 Übungen", ""]
    for f, name in NAMEN.items():
        zeilen += [
            f"### {name}",
            "",
            "| Nr. | Übung | Variante | Gerät | Quelle | Std. Übung | Std. neues Gerät | Hinweis |",
            "|---|---|---|---|---|---|---|---|",
        ]
        for key, u in sorted(nach_familie[f], key=lambda x: x[1]["nr"]):
            quelle = QUELLE[u["quelle"]]
            if u["quelle"] == "cmu":
                quelle += f" {u.get('cmu_trial', '')}"
            if u["quelle"] == "mixamo":
                quelle += f" „{u.get('mixamo_name', '')}“"
            alt = u.get("alternative") or {}
            if alt.get("mixamo_name") and u["quelle"] != "mixamo":
                quelle += f"; Abgleich Mixamo „{alt['mixamo_name']}“"
            zeilen.append(
                f"| {u['nr']} | {zelle(u['name'])} | {zelle(u['variante'])} | {zelle(u['geraet_modell'])} | {quelle} | "
                f"{u['aufwand_stunden']} | {u['geraet_neu_stunden']} | {zelle(u.get('hinweis', ''))} |"
            )
        zeilen.append("")
    s = d["summen"]
    zeilen += [
        "## 4. Aufwand",
        "",
        "| Posten | Stunden |",
        "|---|---|",
        f"| Übungen (Varianten, Prüfung) | {s['uebungen_stunden']} |",
        f"| Neue Geräte ({s['geraete_neu_anzahl']}, je einmal gezählt) | {s['geraete_neu_stunden']} |",
        f"| Basis der Familien (davon {s['davon_basis_der_pilot_familien']} für die drei Familien der Pilot-Übungen) | {s['familien_basis_stunden']} |",
        f"| Einmalig (CMU- und Mixamo-Übertragung, Kabelverlauf, Prüfseiten) | {s['einmalig_stunden']} |",
        f"| **Summe** | **{s['gesamt_stunden']}** |",
        "",
        "Die Zahlen je Zeile sind eine Einzelschätzung. Meine Gesamteinschätzung nach dem Pilot: **rund 300 Stunden, "
        "Spanne 250 bis 400**, dazu rund 35 Stunden Rechenzeit auf vier CPU-Kernen (etwa 17 Minuten je Übung). "
        "Unsicher sind vor allem die Maschinen mit vielen Teilen (Beinpresse, Hackenschmidt, Butterfly, Kabelturm, "
        "Cardiogeräte) und Bodenübungen, bei denen Körper und Matte sich berühren. Nicht enthalten: deine Freigabe je Familie.",
        "",
        "## 5. Motion Capture",
        "",
        "### CMU Graphics Lab Motion Capture Database",
        "",
        "| Aufnahme | Beschreibung | passt zu | Beleg |",
        "|---|---|---|---|",
    ]
    for c in d["cmu"]:
        beleg = c.get("beleg")
        beleg = beleg[0] if isinstance(beleg, list) and beleg else (beleg or "")
        zeilen.append(f"| {zelle(c['trial'])} | {zelle(c['beschreibung'])} | {', '.join(c.get('passt_zu', []))} | {zelle(beleg)} |")
    zeilen += [
        "",
        "Laut Beschreibung zeigt keine Aufnahme eine Übung mit Langhantel, Kurzhantel oder an einem Gerät (79_93 "
        "„weight lifting“ ist nicht näher beschrieben und nicht angesehen). Für die drei Pilot-Übungen gibt es deshalb "
        "keine passende CMU-Aufnahme; eine Kniebeuge ohne Gewicht mit vorgestreckten Armen hat eine andere Rumpfneigung "
        "als die Kniebeuge mit der Stange auf dem Rücken.",
        "",
        "### Mixamo",
        "",
        "| Animation | dazu | passt zu | Beleg |",
        "|---|---|---|---|",
    ]
    for m in d["mixamo"]:
        beleg = m.get("beleg")
        beleg = beleg[0] if isinstance(beleg, list) and beleg else (beleg or "")
        zeilen.append(
            f"| {zelle(m['name'])} | {zelle(', '.join(m.get('dazu', [])))} | {', '.join(m.get('passt_zu', []) + m.get('referenz_fuer', []))} | {zelle(beleg)} |"
        )
    zeilen += [
        "",
        "## 6. Adressen",
        "",
        "| Host | Wofür | Stand | Empfehlung |",
        "|---|---|---|---|",
    ]
    for a in d["adressen_fuer_network_access"]:
        zeilen.append(f"| {zelle(a['host'])} | {zelle(a['zweck'])} | {zelle(a['status'])} | {zelle(a['empfehlung'])} |")
    zeilen += [
        "",
        "Für alles bisher Geplante brauche ich keine neue Adresse unter „Network access“: Die CMU-Aufnahmen liegen "
        "als BVH auf GitHub, MakeHuman auf `raw.githubusercontent.com`.",
        "",
        "## 7. Mixamo: Liste zum Herunterladen",
        "",
        "Nur falls du die Familien Rumpf und Kondition freigibst; für die drei Pilot-Übungen brauche ich nichts "
        "(in der Namensliste von Mixamo fanden sich weder Bankdrücken noch Latziehen, die Kniebeuge kommt aus dem Rig). Mixamo braucht ein "
        "Adobe-Konto; ich lege keines an. Gib mir die Dateien hier im Chat (einzeln oder als ZIP). Sie kommen nach "
        "`tools/uebungen-3d/quelle/mixamo/`, nicht ins Repository; in die App kommen nur die gerenderten Videos "
        "(Lizenz in `licenses-data.md` Abschnitt 7).",
        "",
        "**Einstellungen im Download-Fenster, für jede Datei gleich:**",
        "",
        "| Feld | Wert |",
        "|---|---|",
    ]
    for feld, wert in d["mixamo_einstellungen"]:
        zeilen.append(f"| {feld} | {zelle(wert)} |")
    zeilen += [
        "",
        "| Prio. | Animation (Suchbegriff bei Mixamo) | für | Vorlage für | In Place | Wozu |",
        "|---|---|---|---|---|---|",
    ]
    for m in d["mixamo_liste"]:
        fuer = ", ".join(uebungen[k]["name"] for k in m["fuer"]) or "–"
        ref = ", ".join(uebungen[k]["name"] for k in m.get("referenz", [])) or "–"
        zeilen.append(
            f"| {m['prioritaet']} | {zelle(m['name'])} | {zelle(fuer)} | {zelle(ref)} | "
            f"{'ja' if m['in_place'] else 'nein'} | {zelle(m['warum'])} |"
        )
    zeilen += [
        "",
        "Priorität 1: Hier bringt eine echte Aufnahme mehr als ein Ablauf aus dem Code (Sprünge, Abrollen, Rhythmus). "
        "Priorität 2: nur Vorlage oder Gegenprobe; ohne sie geht es auch. Jede Datei prüfe ich vor dem Einbau "
        "(Sichtprüfung, ob sie die Übung wirklich zeigt), Hände, Füße und Gerät korrigiert das Rig.",
        "",
    ]
    zeilen += prioritaet(d)
    text = "\n".join(zeilen)
    if "--check" in sys.argv:
        if not ZIEL.exists() or ZIEL.read_text(encoding="utf-8") != text:
            print(f"{ZIEL.relative_to(ROOT)} passt nicht zu {DATEN.relative_to(ROOT)}: python3 tools/uebungen_familien.py")
            sys.exit(1)
        print(f"{ZIEL.relative_to(ROOT)}: aktuell")
        return
    ZIEL.write_text(text, encoding="utf-8")
    print(f"{ZIEL.relative_to(ROOT)}: {len(uebungen)} Übungen")


if __name__ == "__main__":
    main()
