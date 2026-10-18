# Erweiterungsplan „Fitness App Evolution“

Version 1.0 · 18.10.2026 · Antwort auf den Master-Prompt des Produktinhabers. Verbindlich bleiben `implementation-plan.md` (Meilensteine), `decisions.md` und `requirements.md`; dieses Dokument ordnet die gewünschten Erweiterungen ein und schlägt die Reihenfolge vor. Umgesetzt wird erst nach Freigabe (Q-18).

## 1. Verifizierter Projektstand (18.10.2026)

Geprüft in der Cloud-Umgebung auf dem Branch `m1-training`, Commit `6f2a093` (CI grün inklusive WebKit):

| Prüfung | Ergebnis (wörtlich) |
|---|---|
| `pnpm format:check` | „All matched files use Prettier code style!“ |
| `pnpm lint`, `pnpm typecheck` | ohne Fehler |
| `pnpm test:coverage` | „Test Files 32 passed (32)“, „Tests 327 passed (327)“, „Lines: 92.44 % (1504/1627)“ |
| `pnpm check:docs` | „Basisübungen: 105, davon in Vorlagen: 39“, „Beispielvorlagen: 4“ |
| `pnpm build && pnpm check:bundle` | „181.9 KB Summe Startansicht (gzip), Grenze 250 KB“ |

| Bereich | Stand | Nachweis |
|---|---|---|
| M0 Projektbasis, PWA, Hosting | Gemergt und ausgeliefert; T-IPH-M0 bestanden | `implementation-plan.md` Abschnitt 9, `testing.md` Abschnitt 10 |
| M1 AP 1.1 Übungsbibliothek | 105 Übungen, Suche, Filter, `/uebungen` | `testing.md` AP 1.1 |
| M1 AP 1.2 Beispielvorlagen | 4 Vorlagen aus `sample-templates.md`, `/training/programme`, `/training/vorlagen/:key` | `testing.md` AP 1.2 |
| M1 AP 1.3 Trainings-Domain | Modell, Anwendungsfälle, Berechnungen, Projektion `exerciseHistory`, Pausentimer in der Domain | `testing.md` AP 1.3 |
| M1 AP 1.4 Trainingsplayer | `/training/einheit/:id`, Satzzeilen, Übungsauswahl, Einstiege, einfache Zusammenfassung | `testing.md` AP 1.4 |
| M1 AP 1.5 Pausentimer | Angefangen auf `m1-training-wip-ap15`: Texte, `restRemainingSec`, `sound.ts`, `wakeLock.ts` (ein Lint-Fehler, keine Tests, keine Oberfläche); Pull Request darad11/fitness-app#5 enthält davon nichts | `handover-m1.md` Abschnitt 3 |
| M1 AP 1.6 bis 1.9 | Offen (Persistenz-Leiste, Verlauf, Einstellungen, Export, Snapshot, E2E, Gerätetest) | – |
| M2 bis M13 | Nicht begonnen. Keine eigenen Programme, kein aktives Programm, kein Verlauf, keine Statistik, keine Ernährung, keine Tagesaufgaben, keine Sync | Routen in `src/app` |

Nicht geprüft: Verhalten auf dem iPhone seit AP 1.4 (Gerätetest T-IPH-M1 steht aus); die Vorschau-Adresse ist aus der Cloud-Umgebung nicht erreichbar.

## 2. Ergebnisse der Referenzanalyse

- **Winter Arc vollständig rekonstruiert:** 8 Wochen, 40 Trainingstage, 278 Übungseinträge, 71 Übungsnamen, Pausen und Wiederholungen je Satz, Quelle je Tag; 8 offene Punkte (`winter-arc-reconstruction.md` Abschnitt 4). Keine öffentliche Quelle; nichts erfunden.
- **Übungsabgleich:** 28 Namen vorhanden, 19 Varianten vorhandener Übungen, 19 fehlen (18 neue Übungen vorgeschlagen), 5 unklar (`winter-arc-reconstruction.md` Abschnitt 5).
- **Referenzmatrix** für V1 bis V3, T1 bis T8, S1 und S2 mit Stufen G, O, A, E, U (`reference-analysis.md` Abschnitt 2), Abgleich mit der eigenen App und zehn Verbesserungen (Abschnitte 3 und 4).
- **Recherche (18.10.2026):** Ergänzungen zu Open Food Facts, MET-Werten, Übungsdatenquellen und Nutzerfeedback in `product-research.md` Abschnitt 13 und `data-sources.md`; gesperrte Hosts dieser Sitzung dort vermerkt.

## 3. Leitplanken (unverändert aus `CLAUDE.md` und `decisions.md`)

- `main` bleibt produktiv; jede Änderung per Pull Request mit grüner CI, gemergt vom Produktinhaber.
- Keine Nutzdaten an Dritte, keine Telemetrie; Open Food Facts nur nach Einwilligung (Q-08), Supabase erst R3 und nur nach ausdrücklicher Freigabe.
- Keine destruktiven Migrationen; jede neue Dexie-Version mit Snapshot und Migrationstest (AK-DAT-06, AK-DAT-07).
- Keine Xeela-Videos, -Bilder, -Texte oder erfundenen Bild-Adressen; Übungsabbildungen später nur aus gemeinfreien Quellen (D-304).
- Keine Platzhalterdaten, keine Schaltflächen ohne Funktion (AK-UX-01); Kalorien nur als gekennzeichnete Schätzung.
- Keine Zusagen, die das iPhone nicht hält (`known-limitations.md` Abschnitt 3): kein Ton bei gesperrtem Bildschirm, keine Push-Erinnerung im MVP.

## 4. Drei Programme

Alle drei werden wie die Beispielvorlagen als gebündelte, versionierte Stammdaten geführt (D-230, D-243): Quelle ist eine Markdown-Tabelle bzw. die JSON-Rekonstruktion, ein Skript erzeugt die Daten, `pnpm check:docs` prüft die Übereinstimmung. Kein Programm gibt Gewichte vor; der Player zeigt den Vorwert (AK-TRN-05). Für alle drei muss das Vorlagenmodell erweitert werden (Abschnitt 5, Schritt C).

### 4.1 Programm A: Ganzkörper A/B, 4 Tage je Woche (Wiedereinstieg)

Zweck: Wiedereinstieg nach rund 1,5 Jahren Pause. Grundübungen, zwei Tage im Wechsel (A, B, A, B), niedriges Volumen in den ersten zwei Wochen. **Eigener Vorschlag (E), zu bestätigen (Q-14).** Keine Gewichte, keine Prozentangaben, keine RPE-Vorgaben.

| Tag | Übungen (Schlüssel der Bibliothek) | Sätze × Wiederholungen | Pause |
|---|---|---|---|
| A | Kniebeuge mit Langhantel (`back_squat_barbell`) oder Beinpresse (`leg_press`); Bankdrücken mit Kurzhanteln (`bench_press_dumbbell`); Rudern am Kabel, sitzend (`seated_cable_row`); Schulterdrücken an der Maschine (`shoulder_press_machine`); Unterarmstütz (`plank`) | Woche 1 bis 2: 2 × 8–12; ab Woche 3: 3 × 8–12; Plank 3 × 30–45 s | 120 s Grundübungen, 90 s übrige, 45 s Plank |
| B | Rumänisches Kreuzheben mit Kurzhanteln (`romanian_deadlift_dumbbell`); Latziehen (`lat_pulldown`); Schrägbankdrücken mit Kurzhanteln (`incline_bench_press_dumbbell`); Beinbeuger liegend (`lying_leg_curl`); Seitheben mit Kurzhanteln (`lateral_raise_dumbbell`); Crunches (`crunch`) | wie A; Crunches 3 × 12–15 | wie A |

Dauer 8 Wochen, Reihenfolge-Modus (AK-PRG-08), keine festen Wochentage. Progression nur als Regel im Text: „Wenn alle Sätze die obere Grenze erreichen, nächstes Mal den Gewichtsschritt mehr“ (TP-18 bleibt später).

### 4.2 Programm B: Push/Pull/Beine, rotierend auf 4 Tage

Zweck: Nach Programm A. Drei Trainingstage Push, Pull, Beine laufen über vier Trainingstage je Woche weiter, die Folge wird nicht zurückgesetzt: Woche 1 Push, Pull, Beine, Push; Woche 2 Pull, Beine, Push, Pull; Woche 3 Beine, Push, Pull, Beine; danach von vorn. **Eigener Vorschlag (E), zu bestätigen (Q-15).** Übungen aus der vorhandenen Beispielvorlage „Push/Pull/Beine“ (`sample-templates.md`), 3 × 6–10 Grundübungen, 3 × 10–15 Isolation; 12 Wochen. Technisch: Vorlage mit drei Tagen und `weeks` als Rotation von 3 Wochen, `repeat: true`.

### 4.3 Programm C: Winter Arc 2026 (Nachbau)

Exakt nach `winter-arc-reconstruction.md`: 8 Wochen, 40 Tage, Übungen nach Abschnitt 5 zugeordnet, Sätze, Wiederholungen, Dauer und Pausen wie gesehen. Offene Punkte U-1 bis U-8 werden markiert, nicht geraten: Tag 14 Laufband nach Antwort auf Q-13; unklare Übungen erhalten den Hinweis „Zuordnung unsicher“ im Programmtext, bis der Produktinhaber sie bestätigt. Eigener Programmtext (keine Xeela-Beschreibung), Name „Winter Arc 2026 (Nachbau)“, Quelle im Text genannt. Ruhetage als Wocheneigenschaft (zwei Ruhetage je Woche, Lage frei), Start datumsunabhängig.

## 5. Priorisierter Umsetzungsplan

Reihenfolge nach Nutzen für das tägliche Training und nach Abhängigkeiten. Jeder Schritt ist ein eigener Branch mit Pull Request, Bericht nach `implementation-plan.md` Abschnitt 8 und Tests; Status in `feature-inventory.md` nachgetragen.

| Schritt | Inhalt | Umfang | Voraussetzung | Tests |
|---|---|---|---|---|
| 0 | Dieser Plan, Rekonstruktion, Abgleich, Referenzmatrix, Recherche (Branch `evolution-plan`) | S | – | `pnpm check:docs` |
| A | **M1 abschließen** (AP 1.5 bis 1.9; begonnen am 18.10.2026 mit AP D1 Designsystem 2.0 und AP D2 Premium-Player, `ux-audit.md`): Pausenleiste mit Vollansicht (nächster Satz, Eingabe, ±15 s, Überspringen, Ton, Wake Lock); WIP-Branch übernehmen nach Lint-Korrektur und Tests, nicht blind; Leiste „Training läuft“, Gesundheitsprüfung, dauerhafter Speicher; Verlauf, Zusammenfassung, Einstellungen; Export und Snapshot; E2E; Gerätetest T-IPH-M1 | L | – | Unit (Formatierung, Ton, Wake Lock, Verlauf), Komponenten (Leiste mit Fake-Timern), E2E (AK-TRN-10 bis 13, 17), Gerätetest |
| B | **Bibliothek erweitern:** 18 neue Übungen aus dem Abgleich, Alias-Namen, Feld `cues` (kurze eigene Ausführungshinweise, nur wo nötig), Liste in `exercise-library.md` neu erzeugen; keine Schemaänderung der Datenbank (gebündelte Daten, IDs aus Schlüsseln) | S | Q-13 (unklare Übungen) | Zod-Prüfung, Suche, `check:docs`, Snapshot der Anzahl (123) |
| C | **Programme als Stammdaten und aktives Programm:** Vorlagenmodell um Wochen mit Ruhetagen, Dauerziele, Ausführungshinweis je Übung und Rotation erweitern; Programme A, B, C erzeugen; aktives Programm mit nächstem Tag, Zähler „Trainingstag x von n“, abgeschlossene Tage, Startseite „Heute geplant“ (M2 AP 2.3 vorgezogen); Dexie v2 (`training_state` erweitert oder neue Tabelle `program_progress`) mit Snapshot und Migrationstest | L | A; Q-13 bis Q-15 | Generator mit `--check`, Migrationstest v1 → v2, Unit (nächster Tag, Rotation, Ruhetage), E2E (Programm aktivieren, Tag starten, Zähler) |
| D | **Player ausbauen:** Übung ersetzen mit Alternativen (gleicher Hauptmuskel, verfügbares Gerät; TS-10, TP-12); Umsortieren im Player; Tagesvorschau mit geschätzter Dauer; Ausführungshinweis und Muskeln in der Übungsinfo; Übungstimer für Zeitsätze (AK-TRN-14) | M | A, B | Unit (Alternativensuche, Dauer), Komponenten, E2E (ersetzen, Vorschau) |
| E | **Fortschritt und Auswertung:** Körpergewicht und Diagramme (M3 AP 3.1, 3.2), Kennzahlen Trainings, Minuten, Volumen mit Zeitraumwahl, Bestleistungen (TH-05) aus `exerciseHistory`, Kalorienschätzung nach MET (Abschnitt 7) in Zusammenfassung und Statistik | L | A | Unit (MET, Zeiträume, Bestleistungen), Diagramm-Screenshots hell und dunkel, E2E (Gewicht erfassen) |
| F | **Tagesaufgaben und Motivation:** eigene Aufgabenliste je Tag mit Abhaken und Streak (AH-03, TH-04); Motivationstexte: eigene, kurze deutsche Sätze ohne Zitate oder Namen, in `de.ts`, ohne Anspruch auf Urheberschaft Dritter | M | A; Q-17 | Unit (Streak-Regeln, Tageswechsel), E2E (Aufgabe abhaken) |
| G | **Ernährung** (R2, M5 bis M7 wie geplant): BLS gebündelt, Tagesübersicht mit Ring und Makros, Mahlzeiten-Slots, Schnelleintrag, Open Food Facts nach Einwilligung mit Drosselung (15 Produkt- und 10 Suchanfragen je Minute und IP laut Dokumentation, eigene Grenze darunter), Lizenzhinweis ODbL | XL | Prüfspikes S-1 bis S-3 | Unit (Summen, Umrechnung), Integration (Cache, Drosselung), E2E (Tag protokollieren) |
| H | **Synchronisierung** (R3) nur nach ausdrücklicher Freigabe; bis dahin Export und Import als Gerätewechsel | – | Freigabe | Konflikttests K-01 bis K-19 |

Nicht geplant: Countdown, Videos, Store, Wettbewerb, Empfehlungsprogramm, Fotoerkennung von Mahlzeiten, Push-Benachrichtigungen im MVP.

## 6. Datenintegrität bei jedem Schritt

| Regel | Umsetzung |
|---|---|
| Schreiben nur über `src/shared/db/repository.ts` | HLC-Stempel, Löschmarkierung, Zod-Prüfung bei Lesen und Schreiben (AK-DAT-11) |
| Neue Tabelle oder Index | Neue Dexie-Version, automatischer Snapshot vor dem Upgrade (AK-DAT-06), Migrationstest mit Datenbank der Vorversion (AK-DAT-07) |
| Stammdaten (Übungen, Programme) | Gebündelt, versioniert, IDs aus Schlüsseln (D-240); Änderungen ändern nie IDs; Einheiten speichern Snapshots (D-244) |
| Abgeschlossene Einheiten | Unveränderlich außer über „Bearbeiten“ im Verlauf (M2 AP 2.7) mit Aktualisierung der Projektion |
| Vor jedem Pull Request | `pnpm format:check lint typecheck test:coverage check:docs build check:bundle`, E2E nach Build; Ergebnisse wörtlich in `testing.md` |
| Export | JSON mit Metadaten und Schemaversion (AK-DAT-01) ab Schritt A; Hinweis nach 14 Tagen ohne Export (AK-DAT-12) ab Schritt E |

## 7. Kalorienschätzung (Schritt E)

- Formel: kcal pro Minute = MET × 3,5 × Körpergewicht in kg ÷ 200 (Standardumrechnung der Compendium-Methodik). Ohne gespeichertes Körpergewicht wird keine Zahl angezeigt, sondern „Schätzung erst mit Körpergewicht“.
- MET-Werte aus dem Adult Compendium of Physical Activities 2024 (Websuche 18.10.2026, Ausschnitte; vor der Umsetzung gegen die Primärquelle prüfen, `product-research.md` Abschnitt 13): Krafttraining „multiple exercises, 8–15 reps“ 3,5; Krafttraining allgemein kräftig 6,0; Kniebeuge und Kreuzheben 5,0; Körpergewichtsübungen allgemein 3,0; hochintensiv 6,5. Laufband: Wert abhängig von Tempo; ohne Tempo wird nur die Dauer gezählt, kein Kalorienwert (Q-16).
- Anzeige immer mit dem Wort „Schätzung“ und Erklärung auf Antippen; keine Tagesbilanz mit der Ernährung, solange der Produktinhaber das nicht ausdrücklich wünscht.

## 8. Rückfragen vor der Umsetzung

Q-13 bis Q-18 in `decisions.md` Abschnitt E.2. Ohne Antwort gilt die dort genannte Standardannahme; Schritt A braucht keine Antwort.

## 9. Berichtspflicht

Nach jedem Schritt: Bericht nach `implementation-plan.md` Abschnitt 8, Testergebnisse wörtlich in `testing.md` Abschnitt 10, Status in `feature-inventory.md` (danach `python3 tools/feature_inventory_to_csv.py`), neue Entscheidungen in `decisions.md`, Grenzen in `known-limitations.md`.
