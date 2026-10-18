# Änderungsprotokoll der Dokumentation

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
