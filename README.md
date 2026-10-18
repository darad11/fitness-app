# Persönliche Fitnessplattform (Arbeitstitel „Fitness")

Eigenständige, local-first Web-App für Trainingsplanung, Trainingsdurchführung, Körperdaten und später Ernährung, Rezepte, Wochenmenü, Einkaufsliste, Aktivität und Gewohnheiten. Funktional orientiert an Xeela, ohne Übernahme geschützter Inhalte. Zielgeräte: iPhone, iPad und Mac als installierbare Web-App; optional synchronisiert über Supabase.

## Status

- Phase 1 (Produktanalyse) abgeschlossen am 17.10.2026.
- Phase 2 (Produktentscheidungen, MVP) abgeschlossen am 18.10.2026: MVP-Umfang, 101 Akzeptanzkriterien, Sitemap, Screen-Katalog und Implementierungsplan liegen vor und sind vorläufig freigegeben.
- Meilenstein M0 (Projektbasis, Auslieferung, PWA-Grundlage) abgeschlossen am 18.10.2026: installierbare App-Shell mit Offline-Start, Einstellungen für Darstellung und Formatierung, Datenbasis mit Schema v1. Ausgeliefert unter https://fitness-app-mu-drab.vercel.app; CI grün mit Chromium und WebKit; Gerätetest T-IPH-M0 mit iOS 27.0.1 bestanden (der Update-Hinweis wird mit der nächsten Auslieferung geprüft).
- Hosting: Vercel (D-231), Produktivadresse https://fitness-app-mu-drab.vercel.app. Repository: privat, `darad11/fitness-app` (Q-01).

## Entwicklung

Voraussetzungen: Node 22.22 oder neuer (CI: Node 24), pnpm 10.

```
pnpm install            # Abhängigkeiten
pnpm dev                # Entwicklungsserver (ohne Service Worker)
pnpm build              # Produktions-Build nach dist/
pnpm preview            # Build lokal ausliefern (Port 4173, mit den Headern aus vercel.json)

pnpm format:check       # Prettier
pnpm lint               # ESLint mit Modulgrenzen
pnpm typecheck          # TypeScript (App und Node)
pnpm test               # Vitest: Unit-, Integrations- und Komponententests
pnpm test:coverage      # dasselbe mit Abdeckung und Schwellen
pnpm test:e2e           # Playwright gegen den Build (vorher pnpm build)
pnpm check:docs         # Querverweise der Dokumente und Funktionsmatrix
pnpm check:bundle       # Größe der Startansicht (nach pnpm build)
pnpm icons              # App-Icons neu erzeugen
```

Arbeitsregeln für Claude-Sitzungen stehen in `CLAUDE.md`. In Cloud-Sitzungen installiert der Start-Hook `.claude/hooks/session-start.sh` die Abhängigkeiten automatisch und setzt die Variablen für die E2E-Tests (D-238).

In der Cloud-Entwicklungsumgebung ist nur Chromium vorhanden:
`E2E_ENGINES=chromium PW_CHROMIUM_PATH=/opt/pw-browsers/chromium pnpm test:e2e`.
WebKit läuft in GitHub Actions (`.github/workflows/ci.yml`).

## Aufbau

| Pfad | Inhalt |
|---|---|
| `src/app/` | App-Shell: Router, Layout mit Tab-Leiste und Seitenleiste, Hinweisleisten, Fehleransichten, Wiederherstellung |
| `src/modules/` | Fachmodule mit öffentlicher Schnittstelle `index.ts` (M0: `dashboard`, `settings`) |
| `src/shared/` | Gemeinsame Bausteine: `db` (Dexie, Repository, Snapshots), `lib` (HLC, IDs, Formatierung), `ui` (Tokens, Komponenten), `pwa`, `i18n`, `testing` |
| `e2e/` | Playwright-Tests |
| `public/` | Icons, `theme-init.js`, `robots.txt` |
| `tools/` | Skripte für Matrix, Dokumentprüfung, Bündelgröße und Icons |
| `docs/` | Planungs- und Projektdokumente |

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
| `docs/implementation-plan.md` | Meilensteine M0 bis M13 mit Arbeitspaketen, Abnahmekriterien und Stand |
| `docs/testing.md` | Teststrategie, E2E-Abläufe, Konflikttests, Geräteprotokolle, Ergebnisse je Meilenstein |
| `docs/decisions.md` | Entscheidungsprotokoll und offene Fragen |
| `docs/known-limitations.md` | Grenzen der Analyse, iOS- und Browser-Einschränkungen mit Quellen, Stand M0 |
| `docs/CHANGELOG.md` | Änderungen je Dokumentversion |
| `docs/archive/v0.1-phase-1/` | Unveränderter Stand von Phase 1 mit Prüfsummen |

## Nächste Schritte

1. Entwurf der Basisübungsliste und der Beispielvorlagen durchsehen (Q-05, Q-06).
2. Meilenstein M1: ein echtes Training auf dem iPhone mit Gerätetest T-IPH-M1.
