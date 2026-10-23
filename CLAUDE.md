# Arbeitsregeln für Claude-Sitzungen

FORM, persönliche Fitness-App als local-first PWA für einen einzigen Nutzer, den Produktinhaber. Stand, Entscheidungen und Pläne stehen im Repository, nicht im Chat einer früheren Sitzung.

## Dauerhafte Anweisungen des Produktinhabers

Diese Regeln gelten für jede Sitzung und gehen den übrigen Abschnitten vor.

- Branch: immer auf `form-rebranding` arbeiten, nie direkt auf `main`. Nach jedem Commit sofort pushen.
- Zu Beginn jeder Aufgabe lesen: `CLAUDE.md`, `docs/decisions.md`, `audit-report.md`, `form-markenleitplanken.md`; ab dem Rebranding zusätzlich `brand-tokens.md`.
- Ein Commit pro Paket. Jedes Paket bekommt eine D-Nummer in `docs/decisions.md`.
- Nach jedem Paket: `pnpm check:bundle` (Startansicht unter 250 KB) und E2E inklusive WebKit.
- Keine Änderungen an Datenmodellen ohne Migrations- und Rückfallplan.
- Texte in der App nach `form-markenleitplanken.md`: Du-Form, keine Ausrufezeichen, keine Emojis, keine Streaks oder Challenge-Zähler.
- Gemergt wird nur nach Freigabe des Produktinhabers.
- Rückfragen nur, wenn eine Entscheidung die Richtung ändert; alles andere selbst entscheiden und begründen.

## Zuerst lesen

- `docs/handover-2026-10-21.md`: letzter Arbeitsstand (Übergabe), offene Punkte beim Produktinhaber, bewährte Arbeitsweise; davor `docs/handover-2026-10-19.md`
- `docs/implementation-plan.md`: Meilensteine, Arbeitspakete, „Stand" und „Nächste konkrete Schritte"
- `docs/decisions.md`: Entscheidungen (D-…) und offene Fragen (Q-…)
- `docs/requirements.md`: Akzeptanzkriterien (AK-…); `docs/testing.md`: Nachweise und Protokolle
- `docs/evolution-plan.md`: Erweiterungsplan (Schritte A bis H), Programme A, B, C; dazu `docs/winterprogramm-2026.md` und `docs/reference-analysis.md`
- Je nach Aufgabe: `docs/brand-form.md` (Marke FORM, Q-22), `docs/shopping-list.md`, `docs/water-tracker.md`, `docs/data-model.md`, `docs/architecture.md`, `docs/design-system.md`, `docs/sample-templates.md`, `docs/exercise-library.md`

## Zusammenarbeit

- Sprache Deutsch, Anrede „du", kurze Sätze ohne Fachjargon. Texte der App gehören in `src/shared/i18n/de.ts`.
- Arbeitsbranch ist `form-rebranding` (siehe oben); Änderungen gehen per Pull Request nach `main`. `main` ist die Produktivadresse https://fitness-app-mu-drab.vercel.app und ändert sich nur per Pull Request mit grüner CI. Gemergt wird vom Produktinhaber nach seiner Freigabe.
- Rückfragen nur bei Entscheidungen, die die Richtung ändern; alle anderen Entscheidungen mit Begründung in `docs/decisions.md` festhalten.
- Nach jedem Arbeitspaket ein Bericht nach `docs/implementation-plan.md` Abschnitt 8; Stand, Testergebnisse und Status in der Funktionsmatrix nachtragen.

## Ehrlichkeit und Qualität

- Nur Getestetes als fertig bezeichnen; Testergebnisse wörtlich berichten, auch Fehlschläge; nichts erfinden.
- Keine Schaltflächen ohne Funktion, keine Platzhalter- oder Beispieldaten als echte Daten; nicht verfügbare Bereiche erscheinen nicht in der Navigation.
- Keine destruktiven Migrationen oder Löschungen ohne Snapshot, Plan und Zustimmung des Produktinhabers.
- Keine Nutzdaten an Dritte, keine Telemetrie; neue Laufzeitabhängigkeiten nur mit Eintrag in `docs/decisions.md` (D-203).
- Keine Zusagen, die das iPhone nicht halten kann (z. B. Töne bei gesperrtem Bildschirm); siehe `docs/known-limitations.md`.

## Befehle

```
pnpm format:check   pnpm lint   pnpm typecheck   pnpm test   pnpm test:coverage
pnpm check:docs     pnpm build  pnpm check:bundle            pnpm test:e2e (nach pnpm build)
```

- Cloud-Sitzungen: Der Start-Hook (`.claude/hooks/session-start.sh`) installiert die Abhängigkeiten und setzt `PW_CHROMIUM_PATH` und `E2E_ENGINES=chromium`. `playwright install` nicht ausführen; WebKit läuft in GitHub Actions.
- Funktionsmatrix: Quelle ist `docs/feature-inventory.md`; danach `python3 tools/feature_inventory_to_csv.py` ausführen.

## Code

- Fachmodule unter `src/modules/<name>` mit `model/`, `calc/`, `data/`, `service/`, `ui/` und `index.ts`. Andere Module nur über deren `index.ts` importieren; `src/shared` importiert keine Module; `model/` und `calc/` ohne React und Dexie. ESLint prüft das.
- Daten nur über das Basis-Repository `src/shared/db/repository.ts`: HLC-Stempel, Löschmarkierung statt Löschen, Prüfung mit Zod. Neue Tabellen oder Indizes nur mit neuer Dexie-Version, Snapshot und Migrationstest.
- Farben nur über die Tokens in `src/shared/ui/tokens.css`; den Kontrast prüft `tokens.test.ts`.
