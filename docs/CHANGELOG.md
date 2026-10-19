# Änderungsprotokoll der Dokumentation

## Version 0.19 · 19.10.2026 · Registrieren im Anmeldefenster

| Datei | Änderung |
|---|---|
| `decisions.md` | D-273 Registrieren mit E-Mail und Passwort |
| `known-limitations.md` | Bestätigungslink öffnet Safari, nicht die installierte App |
| `implementation-plan.md` | Stand und nächste Schritte |
| `testing.md` | Ergebnisse Registrierung |

## Version 0.17 · 19.10.2026 · Marken zu den ÖNWT-Lebensmitteln

| Datei | Änderung |
|---|---|
| `decisions.md` | D-271 Marken aus `nuts-marken.json` |
| `data-model.md` | Zeile `marken` in der Katalog-Datenbank |
| `data-sources.md` | Marken aus den Detailseiten übernommen |
| `implementation-plan.md` | Stand und nächste Schritte |
| `testing.md` | Ergebnisse Marken-Import |

## Version 0.16 · 19.10.2026 · Synchronisierung, erste Stufe

| Datei | Änderung |
|---|---|
| `decisions.md` | D-269 Synchronisierung mit Supabase; D-270 Anmeldung im Vollbild |
| `requirements.md` | Abschnitt 6.12b mit AK-SYN-01 bis AK-SYN-03 |
| `data-model.md` | Dexie v6 mit `syncBase`; umgesetztes Serverschema |
| `feature-inventory.md` | SY-03 und SY-09 vorgezogen und „Implementiert“ |
| `known-limitations.md` | Grenzen der ersten Stufe |
| `implementation-plan.md` | Stand und nächste Schritte |
| `testing.md` | Ergebnisse Synchronisierung |

## Version 0.15 · 19.10.2026 · Mahlzeit-Vorlagen

| Datei | Änderung |
|---|---|
| `decisions.md` | D-268 Mahlzeit-Vorlagen |
| `requirements.md` | AK-NUT-11 |
| `data-model.md` | Dexie v5 mit `mealTemplates`, Felder `meal_template` |
| `feature-inventory.md` | NU-11 vorgezogen und „Implementiert“ |
| `implementation-plan.md` | Stand und nächste Schritte |
| `testing.md` | Ergebnisse Mahlzeit-Vorlagen |

## Version 0.14 · 19.10.2026 · Rezepte (M7)

| Datei | Änderung |
|---|---|
| `decisions.md` | D-267 Rezepte |
| `requirements.md` | AK-NUT-10 |
| `data-model.md` | Dexie v4 mit `recipes`, Felder `recipe` |
| `feature-inventory.md` | RE-02, RE-12, RE-13 vorgezogen und „Implementiert“ |
| `implementation-plan.md` | Stand und nächste Schritte |
| `testing.md` | Ergebnisse Rezepte; Gerätetest Barcode-Scanner |

## Version 0.13 · 19.10.2026 · Barcode-Scanner mit Open Food Facts

| Datei | Änderung |
|---|---|
| `decisions.md` | D-266 Barcode-Scanner, Einwilligung, Abhängigkeiten, Sicherheitsheader; D-302 und D-305 umgesetzt |
| `requirements.md` | AK-NUT-09 |
| `feature-inventory.md` | NU-07 und NU-24 vorgezogen und „Implementiert“ |
| `data-sources.md` | Open Food Facts für Barcodes umgesetzt |
| `known-limitations.md` | Grenzen des Scanners und der Abfrage |
| `implementation-plan.md` | Stand und nächste Schritte |
| `testing.md` | Ergebnisse Barcode-Scanner |

## Version 0.12 · 19.10.2026 · Alle Nährwerte anzeigen, „Heute“ aufgeräumt

| Datei | Änderung |
|---|---|
| `decisions.md` | D-264 Nährwerttabelle und weitere Tageswerte; D-265 „Heute“ ohne „Status“ und „Diese Version“ |
| `design-system.md` | S-01 ohne die beiden Karten |
| `requirements.md` | AK-NUT-08 |
| `feature-inventory.md` | NU-16 vorgezogen und „Implementiert“ |
| `implementation-plan.md` | Stand und nächste Schritte |
| `testing.md` | Ergebnisse Nährwertanzeige |

## Version 0.11 · 19.10.2026 · Lebensmitteldaten importieren

| Datei | Änderung |
|---|---|
| `decisions.md` | D-263 lokaler Import der BLS-Recherche; Nachtrag zu Q-19 |
| `data-sources.md` | BLS-Recherche als lokaler Import (Version 0.4) |
| `requirements.md` | AK-NUT-07 |
| `data-model.md` | Eigene Datenbank für importierte Lebensmitteldaten |
| `feature-inventory.md` | NU-25 mit AK-NUT-07 |
| `implementation-plan.md` | Stand und nächste Schritte |
| `testing.md` | Ergebnisse Import |

## Version 0.10 · 19.10.2026 · Ernährung Grundausbau (Schritt G)

| Datei | Änderung |
|---|---|
| `decisions.md` | D-261 Ernährung Grundausbau, D-262 Zielvorschlag; Q-19 beantwortet |
| `data-sources.md` | ÖNWT, BLS-Recherche und andere Apps bewertet; BLS 4.0 umgesetzt, Prüfspike S-2 bestanden |
| `requirements.md` | Abschnitt 6.12a mit AK-NUT-01 bis AK-NUT-06 |
| `data-model.md` | Dexie v3, Felder `food`, `food_log_entry`, `nutrition_target` |
| `design-system.md` | Navigation mit Ernährung; S-15, S-16, S-18, S-19, S-26 |
| `implementation-plan.md` | Stand und nächste Schritte |
| `feature-inventory.md` | NU-01, NU-02, NU-03, NU-05, NU-09, NU-10, NU-15, NU-17, NU-20, NU-21, NU-22, NU-25 vorgezogen und „Implementiert“ |
| `testing.md` | Ergebnisse Ernährung |
## Version 0.9 · 19.10.2026 · Notizen im Player (TS-19)

| Datei | Änderung |
|---|---|
| `decisions.md` | D-260 Notizen zu Übung und Einheit |
| `data-model.md` | Feld `note` je Übung einer Einheit |
| `implementation-plan.md` | AP 2.4 vollständig, nächste Schritte (Ernährung) |
| `feature-inventory.md` | TS-19 auf „Implementiert“ |
| `testing.md` | Ergebnisse Notizen |

## Version 0.8 · 19.10.2026 · Eigene Übungen und persönliche Angaben (AP 2.5)

| Datei | Änderung |
|---|---|
| `decisions.md` | D-258 eigene Übungen und persönliche Angaben; D-259 Programmdatei entfällt zugunsten der Synchronisierung |
| `requirements.md` | AK-PRG-13 nach R3 verschoben |
| `data-model.md` | Umsetzung `exercise` und `exercise_pref` |
| `design-system.md` | S-12, S-13, S-14, S-39 Stand AP 2.5 |
| `implementation-plan.md` | AP 2.5 umgesetzt, AP 2.8 ohne Programmdatei, nächste Schritte |
| `feature-inventory.md` | TP-07, TP-13 auf „Implementiert“; TP-26 „Später“ (R3) |
| `testing.md` | Ergebnisse eigene Übungen |

## Version 0.7 · 19.10.2026 · Eigene Programme und Vorlagen (AP 2.1 bis 2.4)

| Datei | Änderung |
|---|---|
| `decisions.md` | D-257 eigene Programme und Vorlagen |
| `data-model.md` | Dokument `program` mit Stempeln je Element, Grenzen des Editors |
| `design-system.md` | S-04, S-05, S-06, S-38, S-49 Stand AP 2.1 bis 2.4 |
| `implementation-plan.md` | AP 2.1 bis 2.4 umgesetzt, Stand, nächste Schritte |
| `feature-inventory.md` | TP-01 bis TP-04, TP-08 bis TP-10, TP-12, TP-14 bis TP-16, TP-22 bis TP-25 auf „Implementiert“ |
| `testing.md` | Ergebnisse eigene Programme |

## Version 0.6 · 18.10.2026 · Schritte B bis F und Ziele: Bibliothek, Programme A, B, C, aktives Programm, Player, Fortschritt, Tagesaufgaben, Ziele

Grundlage: Antworten des Produktinhabers auf Q-13 bis Q-17 (Dropset-Regel, Laufband Tag 14, Studio, Beinpresse, drei Sätze von Beginn an, Rotation, Kalorien, Tagesaufgaben).

| Datei | Änderung |
|---|---|
| `programs.md` | Neu, erzeugt: Programme A, B, C mit Wochen, Tagen, Sätzen, Zielen, Pausen und Hinweisen |
| `exercise-library.md` | 124 Übungen (19 neu, D-248) |
| `winter-arc-reconstruction.md` | Zuordnung nach Antworten; U-1 Dropset-Liste (12 Sterne, Rest offen) |
| `decisions.md` | D-248 Bibliothek, D-249 Programme und aktives Programm; Q-13 bis Q-17 beantwortet |
| `evolution-plan.md` | Schritte B und C als umgesetzt; Programme A und B bestätigt |
| `data-model.md`, `sample-templates.md` | Programme als Vorlagen mit Zusatzfeldern; Fortschritt berechnet statt gespeichert |
| `implementation-plan.md` | Stand Erweiterungsplan; AP 2.3 teilweise vorgezogen; nächste Schritte |
| `feature-inventory.md` | TP-17, TP-19, TP-21 auf „Implementiert“ |
| `testing.md` | Ergebnisse Schritt B bis F, Ziele, Nachtragen und Verlauf bearbeiten |
| `decisions.md` (Verlauf) | D-256 Verlauf bearbeiten und löschen |
| `feature-inventory.md` (Verlauf) | TH-01 auf „Implementiert“ |
| `decisions.md` (Nachtragen) | D-255 Nachtragen von Krafttraining und Aktivität |
| `feature-inventory.md` (Nachtragen) | TS-17, AH-09 auf „Implementiert“ |
| `implementation-plan.md`, `design-system.md` (Nachtragen) | AP 2.6 umgesetzt, S-10 |
| `decisions.md` (Ziele) | D-254 Ziele und Profil |
| `feature-inventory.md` (Ziele) | ON-07, ON-18, TH-08, BP-06 auf „Implementiert“ |
| `implementation-plan.md`, `design-system.md` (Ziele) | AP 3.3 umgesetzt, AP 3.4 Stand, S-33 |
| `decisions.md` (Schritt F) | D-253 Tagesaufgaben, Serie, Dexie v2, Motivationstexte |
| `requirements.md` (Schritt F) | Abschnitt 6.12 Tagesaufgaben: AK-HAB-01, AK-HAB-02; Gerätetests jetzt 6.13 |
| `feature-inventory.md` (Schritt F) | AH-03, AH-04, AH-05 auf „Implementiert“ |
| `data-model.md`, `architecture.md`, `design-system.md` (Schritt F) | Dexie v2, Felder von `habit` und `habit_log`, Module `body`, `progress`, `habits`, Screen S-50 |
| `decisions.md` (Schritt E) | D-251 Kalorienschätzung nach MET (ersetzt D-226), D-252 Fortschritt mit Modulen `body` und `progress`, Diagramme |
| `feature-inventory.md` (Schritt E) | BP-01, BP-02, TH-02, TH-05, TH-06, TH-07, TS-18 auf „Implementiert“ |
| `design-system.md` | Stand der Diagramme C-01 bis C-03, Bildschirmfotos unter `screenshots/` |
| `requirements.md` | AK-HIS-06 Kennzahlen und Kalorienschätzung, AK-HIS-07 Bestleistungen |
| `evolution-plan.md`, `implementation-plan.md` | Schritt E als umgesetzt; AP 3.1, 3.2, 3.6 vorgezogen; nächste Schritte |
| `decisions.md` (Schritt D) | D-250 Player ausgebaut: Ersetzen, Alternativen, Umsortieren, Übungstimer, Tagesvorschau, Übungsinfo |
| `feature-inventory.md` (Schritt D) | TS-08, TS-10 auf „Implementiert“ |
| `evolution-plan.md`, `implementation-plan.md`, `data-model.md` (Schritt D) | Schritt D als umgesetzt; AP 2.4 teilweise vorgezogen; Felder `notes` und `replacedFromExerciseId` erläutert |

## Version 0.5 · 18.10.2026 · Erweiterungsplan, Designsystem 2.0 und Premium-Player (AP D1, D2)

Grundlage: Master-Prompt „Fitness App Evolution“ des Produktinhabers, Freigabe des Plans (Q-18) und seine Vorgabe, ab jetzt alles nach dem neuen Prompt zu gestalten.

| Datei | Änderung |
|---|---|
| `evolution-plan.md`, `winter-arc-reconstruction.md`, `reference-analysis.md` | Neu: Erweiterungsplan, Rekonstruktion „Winter Arc“, Referenzanalyse (Branch `evolution-plan`, in `m1-training` übernommen) |
| `ux-audit.md` | Neu: Befunde A-01 bis A-18, Richtung Designsystem 2.0, Kriterien DS-1 bis DS-8 |
| `design-system.md` | Version 0.4: Tonflächen, Bühne, Schatten, Radien, Typografie, Komponenten, Player |
| `decisions.md` | D-246 Designsystem 2.0, D-247 Premium-Player; Q-13 bis Q-18 |
| `implementation-plan.md` | Stand AP D1 und D2; AP 1.5 durch D2 ersetzt; nächste Schritte |
| `feature-inventory.md` | TS-07, TS-09, TS-21 auf „Implementiert“ |
| `testing.md` | Ergebnisse AP D1, D2, 1.6 bis 1.9 |
| `handover-m1.md` | Stand nach AP D2 |

## Version 0.4 · 18.10.2026 · M1, AP 1.1 bis 1.4 (Übungsbibliothek, Beispielvorlagen, Trainings-Domain, Trainingsplayer)

Grundlage: Durchsicht der Basisübungsliste durch den Produktinhaber (Q-05).

| Datei | Änderung |
|---|---|
| `exercise-library.md` | Neu: Basisübungsliste mit 105 Übungen, Rückfragen und Antworten; Abschnitt 5 wird aus den Daten erzeugt |
| `decisions.md` | D-240 Schlüssel der Basisübungen, D-241 Erfassungsarten Dauer und Distanz sowie Entlastung, D-242 Übungsbibliothek in der App; Q-05 beantwortet |
| `data-model.md` | Erfassungsarten und Satzfelder `distanceM`, `assistKg`, Feld `distanceUnit` |
| `sample-templates.md` | Kabelrudern in Push/Pull/Beine vereinheitlicht; Schlüsselformat; Erfassungsarten |
| `implementation-plan.md` | Stand M1; nächste Schritte |
| `feature-inventory.md` | TP-06 „Implementiert" |
| `design-system.md` | Stand der Navigation, S-03 und S-12 |
| `testing.md` | Abschnitt 10: Ergebnisse AP 1.1 |
| Code | Modul `exercises` (Daten, Prüfung, Suche, Seite `/uebungen`), Modul `training` mit Seite `/training`, Suchfeld als Basiskomponente; `tools/exercise_library_to_md.py` in `pnpm check:docs` |
| AP 1.2 | `decisions.md` D-243; `sample-templates.md` Regeln zu Aufwärmsätzen und „je Seite"; `data-model.md` Zeitbereiche `durationMinSec`, `durationMaxSec`; Code: Programm-Modell, Beispielvorlagen als Daten aus dem Dokument (`tools/sample_templates_from_md.py`), Seiten `/training/programme` und `/training/vorlagen/:key`, Basiskomponente `Badge` |
| AP 1.3 | `decisions.md` D-244; `data-model.md` Snapshot-Felder der Einheit und Aufbau der Projektion; Code: Basis-Repository reicht den Änderungsstempel weiter; Modell, Berechnungen, Anwendungsfälle und Projektion der Einheit |
| AP 1.4 | `decisions.md` D-245; `design-system.md` Stand S-07, S-09, S-39; `feature-inventory.md` zwölf Funktionen „Implementiert"; Code: Player, Übungsauswahl, Zusammenfassung, Einstiege, `Dialog`, `Toast`, Token `--scrim` |

## Nachtrag zu Version 0.3 · 18.10.2026 · Stabile E2E-Tests

Grundlage: unzuverlässige E2E-Läufe in Chromium nach der Abnahme von M0 (darad11/fitness-app#4).

| Datei | Änderung |
|---|---|
| `decisions.md` | D-239: Ladezustand mit Platzhalter statt Standardwerten |
| `design-system.md` | Abschnitt 7: Zustand „Laden" präzisiert |
| `testing.md` | Abschnitt 5: Annotationen in der CI, Wartebedingung von `openPage`; Abschnitt 10: Ursache, Behebung und Ergebnisse |
| `implementation-plan.md` | Nachtrag zum Stand M0; nächste Schritte |
| Code | Einstellungsseite mit Platzhalter beim Laden; Basiskomponente `Skeleton`; `openPage` und Test zum Safari-Hinweis warten auf gespeicherte Zustände |

## Version 0.3 · 18.10.2026 · M0 (Projektbasis, Auslieferung, PWA-Grundlage)

Grundlage: Antwort des Produktinhabers zu Repository und Hosting (Q-01, Q-02). Erster Anwendungscode (App-Version 0.1.0, Datenbankschema v1).

| Datei | Änderung |
|---|---|
| `decisions.md` | D-231 Hosting auf Vercel, D-232 Modulgrenzen per ESLint-Regel; aus der Umsetzung D-233 (de-CH mit Dezimalkomma), D-234 (Typfeld, unbekannte Felder bleiben), D-235 (Namensraum für UUID v5), D-236 (zwei Farbtokens), D-237 (Produktions-Header in E2E); Q-01 und Q-02 beantwortet |
| `architecture.md` | Hosting-Entscheidung; Modul `shared/pwa`; Umsetzungshinweise zur PWA |
| `data-model.md` | Basisfeld `type`; Namensraum der deterministischen IDs; Inhalt von `meta` und Snapshot-Datenbank; Schema v1 umgesetzt |
| `design-system.md` | Tokens umgesetzt und automatisch geprüft; `--border-input` hell und `--meter-track` dunkel angepasst; Grundfassungen von S-01 und S-34 |
| `testing.md` | Produktionsnahe E2E-Läufe; CI-Gates umgesetzt; Ergebnisse M0 (Abschnitt 10); Gerätetest T-IPH-M0 mit iOS 27.0.1 (Abschnitt 7) |
| `implementation-plan.md` | Stand M0 je Arbeitspaket; nächste Schritte; Arbeit über mehrere Sitzungen (D-238) |
| `CLAUDE.md`, `.claude/` | Neu: Arbeitsregeln für Claude-Sitzungen und Start-Hook für Cloud-Sitzungen |
| `known-limitations.md` | Grenzen des Standes M0 (Abschnitt 12) |
| `feature-inventory.md`, `.csv` | Status von sieben Funktionen nach Nachweis geändert |
| Datenbankschema | Version 1 mit allen MVP-Tabellen (`src/shared/db/schema.ts`) |
| `tools/feature_inventory_to_csv.py` | Prüfmodus `--check` für die CI; MVP-Status bis „Abgenommen" erlaubt |
| `tools/check-bundle-size.mjs`, `tools/generate-icons.mjs` | Neu: Prüfung der Bündelgröße, Erzeugung der App-Icons |

## Version 0.2 · 18.10.2026 · Phase 2 (Produktentscheidungen und MVP)

Grundlage: Produktentscheidungen des Produktinhabers vom 18.10.2026 (vorläufige Freigabe). Der Stand von Version 0.1 liegt unverändert mit Prüfsummen in `archive/v0.1-phase-1/`.

| Datei | Änderung |
|---|---|
| `decisions.md` | Produktentscheidungen D-101 bis D-119; Status der Phase-1-Vorschläge; neue technische Entscheidungen D-201 bis D-230; Datenquellen D-301 bis D-305; offene Fragen Q-01 bis Q-12; Zuordnung der Phase-1-Fragen |
| `feature-inventory.md`, `.csv` | Neue Spalten Herkunft, Umfang, Release; Entscheidungen eingetragen; 27 neue Funktionen (165 gesamt); MVP-Zeilen mit AK-Verweisen; Kennzahlen automatisch erzeugt |
| `requirements.md` | MVP-Umfang final; 101 Akzeptanzkriterien; Ausbaustufen; nichtfunktionale Budgets |
| `architecture.md` | Stack gegen aktuelle Versionen geprüft (TypeScript 6 statt 7, React Router 8, vite-plugin-pwa 2); Laufzeitkonzept Training; Fehler und Wiederherstellung; Hosting; Sync pro Aggregat |
| `data-model.md` | Beziehungsanalyse; Aggregat-Dokumente mit Projektionen; HLC; deterministische IDs; Konfliktregeln K-01 bis K-21; Importregeln; Dexie-Schema v1; Serverschema R3 |
| `implementation-plan.md` | Meilensteine M0 bis M13 mit Arbeitspaketen, AK-Zuordnung und Abnahme; Berichtsvorlage |
| `known-limitations.md` | iOS-Befunde mit Quellen; Timer-Zusagen; Testwerkzeuge; Adressbindung; Supabase-Grenzen; Korrektur zu `persist()` |
| `design-system.md` | Geprüfte Tokens (geänderte Farben für Akzent, Erfolg, Warnung); Diagrammregeln mit validierter Palette; Sitemap und Screen-Katalog final |
| `testing.md` | Nachweisarten, E2E-Abläufe E-01 bis E-29, Konflikttests, Geräteprotokolle, CI-Gates ohne Lighthouse-PWA |
| `data-sources.md` | Neu |
| `sample-templates.md` | Neu |
| `product-research.md` | Nur ergänzende Hinweise; Inhalt unverändert |
| `tools/feature_inventory_to_csv.py` | Neue Spalten, Konsistenzprüfung gegen die Akzeptanzkriterien, automatische Kennzahlen |

## Version 0.1 · 17.10.2026 · Phase 1 (Produktanalyse)

Erstfassung aller Dokumente: Produktrecherche, Funktionsinventar mit 138 Funktionen, Anforderungsentwurf, Architektur- und Datenmodellvorschlag, Designsystem-Entwurf, Implementierungsplan, Teststrategie, Entscheidungsprotokoll, bekannte Einschränkungen.
