# Arbeitsregeln für Claude-Sitzungen

Persönliche Fitness-App als local-first PWA für einen einzigen Nutzer, den Produktinhaber. Stand, Entscheidungen und Pläne stehen im Repository, nicht im Chat einer früheren Sitzung.

## Zuerst lesen

- `docs/implementation-plan.md`: Meilensteine, Arbeitspakete, „Stand" und „Nächste konkrete Schritte"
- `docs/decisions.md`: Entscheidungen (D-…) und offene Fragen (Q-…)
- `docs/requirements.md`: Akzeptanzkriterien (AK-…); `docs/testing.md`: Nachweise und Protokolle
- Je nach Aufgabe: `docs/data-model.md`, `docs/architecture.md`, `docs/design-system.md`, `docs/sample-templates.md`, `docs/exercise-library.md`

## Zusammenarbeit

- Sprache Deutsch, Anrede „du", kurze Sätze ohne Fachjargon. Texte der App gehören in `src/shared/i18n/de.ts`.
- Je Meilenstein oder Arbeitspaket ein Branch und ein Pull Request nach `main`. `main` ist die Produktivadresse https://fitness-app-mu-drab.vercel.app und ändert sich nur per Pull Request mit grüner CI. Gemergt wird vom Produktinhaber.
- Produktentscheidungen, die noch nicht bestätigt sind, als Rückfrage stellen; kleine Details mit Begründung in `docs/decisions.md` festhalten.
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
