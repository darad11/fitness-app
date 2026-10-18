# Änderungsprotokoll der Dokumentation

## Version 0.6 · 18.10.2026 · Schritte B und C: Bibliothek, Programme A, B, C, aktives Programm

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
| `testing.md` | Ergebnisse Schritt B und C |

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
