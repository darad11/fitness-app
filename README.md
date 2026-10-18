# Persönliche Fitnessplattform (Arbeitstitel „Fitness")

Eigenständige, local-first Web-App für Trainingsplanung, Trainingsdurchführung, Körperdaten und später Ernährung, Rezepte, Wochenmenü, Einkaufsliste, Aktivität und Gewohnheiten. Funktional orientiert an Xeela, ohne Übernahme geschützter Inhalte. Zielgeräte: iPhone, iPad und Mac als installierbare Web-App; optional synchronisiert über Supabase.

## Status

- Phase 1 (Produktanalyse) abgeschlossen am 17.10.2026.
- Phase 2 (Produktentscheidungen, MVP) abgeschlossen am 18.10.2026: MVP-Umfang, 101 Akzeptanzkriterien, Sitemap, Screen-Katalog und Implementierungsplan liegen vor und sind vorläufig freigegeben.
- Es gibt noch keinen Anwendungscode. Vor Meilenstein M0 sind zwei Fragen offen: Repository (Q-01) und Hosting mit fester Adresse (Q-02), siehe `docs/decisions.md` Abschnitt E.
- Wichtig: Diese Dateien liegen bis zur Antwort auf Q-01 nur in einer kurzlebigen Cloud-Umgebung.

## Dokumente

| Datei | Inhalt |
|---|---|
| `docs/product-research.md` | Recherche zu Xeela: Quellen, belegte und nicht belegte Funktionen, Versionshistorie, gewünschte Screenshots |
| `docs/feature-inventory.md` | Funktionsmatrix mit 165 Funktionen: Herkunft, Umfang, Release, Entscheidung, Status, Akzeptanzkriterien |
| `docs/feature-inventory.csv` | Dieselbe Matrix für Tabellenkalkulation (Semikolon, UTF-8) |
| `docs/requirements.md` | Anforderungen, MVP-Umfang und 101 MVP-Akzeptanzkriterien |
| `docs/architecture.md` | Stack-Prüfung, Module, lokale Daten, Laufzeit des Trainings, Fehlerbehandlung, PWA, Hosting, Sync |
| `docs/data-model.md` | Beziehungsanalyse, Aggregate, Dexie-Schema v1, Konfliktregeln je Entität, Berechnungen, Exportformat |
| `docs/data-sources.md` | Prüfung von Open Food Facts, BLS 4.0, Schweizer Nährwertdatenbank, Übungsdaten |
| `docs/sample-templates.md` | Gekennzeichnete Beispielvorlagen und Rahmen der deutschen Basisübungsbibliothek |
| `docs/design-system.md` | Designprinzipien, geprüfte Farbtokens, Diagrammregeln, Sitemap, Screen-Katalog |
| `docs/implementation-plan.md` | Meilensteine M0 bis M13 mit Arbeitspaketen und Abnahmekriterien |
| `docs/testing.md` | Teststrategie, E2E-Abläufe, Konflikttests, Geräteprotokolle |
| `docs/decisions.md` | Entscheidungsprotokoll und offene Fragen |
| `docs/known-limitations.md` | Grenzen der Analyse, iOS- und Browser-Einschränkungen mit Quellen |
| `docs/CHANGELOG.md` | Änderungen je Dokumentversion |
| `docs/archive/v0.1-phase-1/` | Unveränderter Stand von Phase 1 mit Prüfsummen |

## Werkzeuge

```
python3 tools/feature_inventory_to_csv.py   # prüft die Matrix, erzeugt die CSV, aktualisiert die Kennzahlen
```

## Nächste Schritte

1. Q-01 und Q-02 beantworten (Repository, Hosting und Adresse).
2. Dokumente ins Repository übernehmen; Meilenstein M0 umsetzen: Projektbasis, Auslieferung, PWA-Grundlage.
3. Meilenstein M1: ein echtes Training auf dem iPhone mit Gerätetest T-IPH-M1.
