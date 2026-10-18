# Persönliche Fitnessplattform (Arbeitstitel)

Eigenständige, local-first Web-App für Trainingsplanung, Trainingsdurchführung, Ernährung, Rezepte, Wochenplanung, Einkaufsliste, Körperdaten, Aktivität und Gewohnheiten. Funktional orientiert an Xeela, ohne Übernahme geschützter Inhalte. Ziel: Mac, iPhone und iPad als PWA, optional synchronisiert über Supabase.

## Status

Phase 1 (Produktanalyse) abgeschlossen am 17.10.2026. Es existiert noch kein Anwendungscode. Die Entscheidungen in `docs/decisions.md`, Abschnitt C, sind offen.

## Dokumente

| Datei | Inhalt |
|---|---|
| `docs/product-research.md` | Recherche zu Xeela: Quellen, verifizierte und nicht verifizierte Funktionen, Versionshistorie, benötigte Screenshots |
| `docs/feature-inventory.md` | Funktionsmatrix mit 138 Positionen (ID, Modul, Beschreibung, Originalverhalten, Evidenz, Konfidenz, Nutzen, Abhängigkeiten, Aufwand, Priorität, Entscheidung, Status, Akzeptanzkriterien) |
| `docs/feature-inventory.csv` | Dieselbe Matrix für Tabellenkalkulation (Semikolon-getrennt, UTF-8) |
| `docs/requirements.md` | Anforderungen (Entwurf) |
| `docs/architecture.md` | Architekturempfehlung: Stack, Modulstruktur, lokale Datenhaltung, Sync, PWA, Sicherheit |
| `docs/data-model.md` | Datenmodellvorschlag: Entitäten, Felder, Indizes, Konflikt- und Integritätsregeln, Berechnungen |
| `docs/design-system.md` | Designprinzipien, Tokens, Komponenten, Sitemap, Screen-Katalog (Entwurf) |
| `docs/implementation-plan.md` | Priorisierter Plan in Phasen und Arbeitspaketen mit Meilensteinen |
| `docs/testing.md` | Teststrategie (Entwurf) |
| `docs/decisions.md` | Entscheidungsprotokoll und offene Produktentscheidungen |
| `docs/known-limitations.md` | Grenzen der Analyse, Browser- und PWA-Einschränkungen, Lizenzen, Web-App-Eignung |

## Werkzeuge

```
python3 tools/feature_inventory_to_csv.py   # erzeugt docs/feature-inventory.csv aus der Markdown-Matrix
```

## Nächste Schritte

1. Analyse prüfen und die offenen Fragen in `docs/decisions.md` beantworten.
2. Screenshots oder Aufnahmen der Xeela-App gemäß `docs/product-research.md`, Abschnitt 11, bereitstellen (optional, aber hilfreich).
3. Phase 2: Funktionsmatrix finalisieren, MVP festlegen, Sitemap bestätigen.
4. Phase 3: Projektstruktur, Designsystem, Datenbank, Testinfrastruktur.
