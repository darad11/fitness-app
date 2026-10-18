# Änderungsprotokoll der Dokumentation

## Version 0.3 · 18.10.2026 · M0 (Projektbasis, Auslieferung, PWA-Grundlage)

Grundlage: Antwort des Produktinhabers zu Repository und Hosting (Q-01, Q-02). Erster Anwendungscode (App-Version 0.1.0, Datenbankschema v1).

| Datei | Änderung |
|---|---|
| `decisions.md` | D-231 Hosting auf Vercel, D-232 Modulgrenzen per ESLint-Regel; aus der Umsetzung D-233 (de-CH mit Dezimalkomma), D-234 (Typfeld, unbekannte Felder bleiben), D-235 (Namensraum für UUID v5), D-236 (zwei Farbtokens), D-237 (Produktions-Header in E2E); Q-01 und Q-02 beantwortet |
| `architecture.md` | Hosting-Entscheidung; Modul `shared/pwa`; Umsetzungshinweise zur PWA |
| `data-model.md` | Basisfeld `type`; Namensraum der deterministischen IDs; Inhalt von `meta` und Snapshot-Datenbank; Schema v1 umgesetzt |
| `design-system.md` | Tokens umgesetzt und automatisch geprüft; `--border-input` hell und `--meter-track` dunkel angepasst; Grundfassungen von S-01 und S-34 |
| `testing.md` | Produktionsnahe E2E-Läufe; CI-Gates umgesetzt; Ergebnisse M0 (Abschnitt 10) |
| `implementation-plan.md` | Stand M0 je Arbeitspaket; nächste Schritte |
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
