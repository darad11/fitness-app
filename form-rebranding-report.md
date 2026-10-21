# Rebranding zu FORM – Bericht

Stand: 21.10.2026 · Branch `form-rebranding` (Basis `1891e68`, `main` nach PR #48) · Auftrag: `handover-form-rebranding.md`, `handover-markenassets.md`, `form-markenleitplanken.md`. Aufbau wie der Bericht der Audit-Phase A (`audit-report.md`).

Regeln: Jeder Screen, jede Funktion und jeder Datenfluss bleibt; die App bekommt den Look des FORM-Konzepts. Texte kommen aus den Leitplanken, nicht aus dem Konzeptbild. Keine Streak-, Serien- oder Challenge-Zähler. Dark ist Standard; helle Tokens werden nur angelegt. Ein Commit je Paket mit D-Nummer in `docs/decisions.md`; nach jedem Paket `pnpm check:bundle` und E2E (Chromium lokal, WebKit in GitHub Actions).

Nur Getestetes gilt als fertig; Testergebnisse stehen wörtlich in Abschnitt 3.

---

## 1. Pakete

| Paket | Inhalt | Entscheidung | Stand |
|---|---|---|---|
| F0 Platz im Startbündel | Nachladen statt mitliefern: Beschreibungshilfen aus Seiten in `calc`-Dateien, Trainingsdienst erst beim Start, `lazy`-Komponente für Übungseinstellungen, Texte nachgeladener Seiten in `de-nutrition.ts`, `de-sync.ts`, `de-program-editor.ts`; ungenutzter Block `motivation` entfernt | D-307 | umgesetzt, Startansicht 226,9 KB (vorher 249,6 KB) |

## 2. Geänderte Dateien je Paket

### F0 Platz im Startbündel

- Neu: `src/modules/training/calc/describe.ts` (`describeSets`, `describeDay`, `describeTemplate`), `src/modules/training/calc/plan.ts` (`planFromTemplateDay`, `StartInput`, `ExerciseInput`, `PlannedSetInput`, `ExerciseInfo`, `ItemNotFoundError`), `src/modules/exercises/ui/describe.ts` (`describeExercise`, `MUSCLE_OPTIONS`, `EQUIPMENT_OPTIONS`), `src/shared/i18n/de-nutrition.ts`, `de-sync.ts`, `de-program-editor.ts`.
- Geändert: `training/index.ts` (`startSession`, `completeSet`, `finishSession` laden den Dienst beim Aufruf; `planFromTemplateDay` aus `calc/plan`), `training/service/sessionService.ts` (re-exportiert die verschobenen Typen), `training/ui/useStartSession.ts` (lädt den Dienst beim Start), `ActiveProgramCard.tsx`, `SampleTemplatePage.tsx`, `ProgramsPage.tsx`, `programs/ProgramEditPage.tsx`, `programs/DayEditPage.tsx`, `programs/editorParts.tsx`; `exercises/index.ts` (`ExercisePrefsCard` als `lazy`, `describeExercise` aus `ui/describe`), `ExerciseLibraryPage.tsx`, `ExercisePicker.tsx`; `goals/index.ts` (ohne `GoalsPanel`), `progress/index.ts` (ohne `bestRecords`); 18 Dateien der Ernährung, `sync/ui/SyncPage.tsx`, `sync/ui/LoginScreen.tsx` (Texte aus den neuen Dateien); `src/shared/i18n/de.ts` (Blöcke `nutrition`, `sync`, `programEditor` ausgelagert, `motivation` entfernt).
- Verhalten unverändert: Beim Tipp auf „Starten“ lädt die App den Trainingsdienst nach (vom Service Worker vorab gespeichert, deshalb auch offline); alle übrigen Änderungen sind reine Umstrukturierung.

## 3. Tests

| Lauf | Stand | Ergebnis |
|---|---|---|
| Ausgangslage `1891e68`: `pnpm build`, `pnpm check:bundle` | 21.10.2026 | Build ok; Startansicht 249,6 KB von 250 KB |
| F0: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | 21.10.2026 | ohne Befund (Konsistenzprüfung: Beispielvorlagen 4, Winter Arc 40 Tage, 71 Übungsnamen, Programme 3, Trainingstage 84) |
| F0: `pnpm test` | 21.10.2026 | 806 Tests in 91 Dateien bestanden (wie vorher) |
| F0: `pnpm build`, `pnpm check:bundle` | 21.10.2026 | Build ok; Startansicht 226,9 KB von 250 KB (gzip), Reserve 23,1 KB |
| F0: `pnpm test:e2e` (Chromium, lokal nach `pnpm build`) | 21.10.2026 | 232 bestanden, 4 übersprungen (Tab-Leiste und Logo nur im Handy-, Seitenleiste nur im Desktop-Projekt), 0 fehlgeschlagen, 6,1 min |

## 4. Audit-Befunde P2, die das Rebranding erledigt

Wird je Paket ergänzt; andere P2-Punkte bleiben unangetastet.

## 5. Offen beim Produktinhaber

Wird am Ende ergänzt.
