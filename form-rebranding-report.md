# Rebranding zu FORM – Bericht

Stand: 21.10.2026 · Branch `form-rebranding` (Basis `1891e68`, `main` nach PR #48) · Auftrag: `handover-form-rebranding.md`, `handover-markenassets.md`, `form-markenleitplanken.md`. Aufbau wie der Bericht der Audit-Phase A (`audit-report.md`).

Regeln: Jeder Screen, jede Funktion und jeder Datenfluss bleibt; die App bekommt den Look des FORM-Konzepts. Texte kommen aus den Leitplanken, nicht aus dem Konzeptbild. Keine Streak-, Serien- oder Challenge-Zähler. Dark ist Standard; helle Tokens werden nur angelegt. Ein Commit je Paket mit D-Nummer in `docs/decisions.md`; nach jedem Paket `pnpm check:bundle` und E2E (Chromium lokal, WebKit in GitHub Actions).

Nur Getestetes gilt als fertig; Testergebnisse stehen wörtlich in Abschnitt 3.

---

## 1. Pakete

| Paket | Inhalt | Entscheidung | Stand |
|---|---|---|---|
| F0 Platz im Startbündel | Nachladen statt mitliefern: Beschreibungshilfen aus Seiten in `calc`-Dateien, Trainingsdienst erst beim Start, `lazy`-Komponente für Übungseinstellungen, Texte nachgeladener Seiten in `de-nutrition.ts`, `de-sync.ts`, `de-program-editor.ts`; ungenutzter Block `motivation` entfernt | D-307 | umgesetzt, Startansicht 226,9 KB (vorher 249,6 KB) |
| F1 Tokens | FORM-Farben unter den bestehenden Token-Namen, Dunkel erzwungen, helle Tokens nur angelegt, keine Schatten und kein Glas, Label 13/500, tabellarische Ziffern; `brand-tokens.md` mit Zuordnung alt → neu, Kontrasten und Abweichungen; Einstellung „Darstellung“ entfällt | D-308, Q-23 | umgesetzt |
| A Icons und Manifest | Assets aus `form-app-assets.zip` unter `public/icons/`, `public/brand/`, `public/splash/`; Manifest „FORM“ mit Nacht-Farben und vier Icons; Favicon-Links; altes Hantel-Motiv und `pnpm icons` entfernt | D-309 | umgesetzt |
| B Kopfzeile | Kachel-F plus Wortmarke als `<img>` (30 px, Tippfläche 44 px) auf jeder Seite, Seitenleiste mit Kachel-F bzw. Logo, Begrüßung nach Tageszeit ohne Uhr, `app.name` „FORM“ | D-310 | umgesetzt |

## 2. Geänderte Dateien je Paket

### F0 Platz im Startbündel

- Neu: `src/modules/training/calc/describe.ts` (`describeSets`, `describeDay`, `describeTemplate`), `src/modules/training/calc/plan.ts` (`planFromTemplateDay`, `StartInput`, `ExerciseInput`, `PlannedSetInput`, `ExerciseInfo`, `ItemNotFoundError`), `src/modules/exercises/ui/describe.ts` (`describeExercise`, `MUSCLE_OPTIONS`, `EQUIPMENT_OPTIONS`), `src/shared/i18n/de-nutrition.ts`, `de-sync.ts`, `de-program-editor.ts`.
- Geändert: `training/index.ts` (`startSession`, `completeSet`, `finishSession` laden den Dienst beim Aufruf; `planFromTemplateDay` aus `calc/plan`), `training/service/sessionService.ts` (re-exportiert die verschobenen Typen), `training/ui/useStartSession.ts` (lädt den Dienst beim Start), `ActiveProgramCard.tsx`, `SampleTemplatePage.tsx`, `ProgramsPage.tsx`, `programs/ProgramEditPage.tsx`, `programs/DayEditPage.tsx`, `programs/editorParts.tsx`; `exercises/index.ts` (`ExercisePrefsCard` als `lazy`, `describeExercise` aus `ui/describe`), `ExerciseLibraryPage.tsx`, `ExercisePicker.tsx`; `goals/index.ts` (ohne `GoalsPanel`), `progress/index.ts` (ohne `bestRecords`); 18 Dateien der Ernährung, `sync/ui/SyncPage.tsx`, `sync/ui/LoginScreen.tsx` (Texte aus den neuen Dateien); `src/shared/i18n/de.ts` (Blöcke `nutrition`, `sync`, `programEditor` ausgelagert, `motivation` entfernt).
- Verhalten unverändert: Beim Tipp auf „Starten“ lädt die App den Trainingsdienst nach (vom Service Worker vorab gespeichert, deshalb auch offline); alle übrigen Änderungen sind reine Umstrukturierung.

### F1 Tokens

- Geändert: `src/shared/ui/tokens.css` (beide Blöcke neu), `src/shared/ui/tokens.test.ts` (prüft `:root` dunkel und `:root[data-theme='light']`, neue Paare `action-fg`/`action`, `login-accent-fg`/`login-accent`, Makros auf Karten), `src/shared/ui/theme.ts` (`THEME_BACKGROUND` #0c1219 / #ffffff, `SHIPPED_THEME`), `src/modules/settings/ui/ThemeSync.tsx` (wendet immer Dunkel an), `public/theme-init.js` (immer Dunkel), `index.html` (`data-theme="dark"`, `theme-color` #0c1219), `src/app/styles.css` (Tailwind-Zuordnung für `bg-elevated`, `faint`, `action`, `on-action`, `tile`, `tile-border`; `eyebrow` 13/500/4 %; `body` mit tabellarischen Ziffern; Bühne flach; Anmeldeknopf Lime mit Nacht-Schrift), `src/modules/settings/ui/SettingsPage.tsx` (Karte „Darstellung“ entfernt), `src/shared/i18n/de.ts` (Texte der Darstellung entfernt); Tests `theme.test.ts`, `settings-ui.test.tsx`, `app.test.tsx`; E2E `fixtures.ts` (ohne `chooseTheme`), `shell.spec.ts` (bleibt dunkel, auch mit alter Kopie „hell“ im localStorage), `custom-exercises.spec.ts`, `own-programs.spec.ts`, `network-a11y.spec.ts`, `session.spec.ts` (ein Lauf statt Hell und Dunkel).
- Neu: `brand-tokens.md` (Entwurf, wird mit Paket E abgeschlossen).

### A Icons und Manifest

- Neu: `public/icons/*` (10 Dateien), `public/brand/*` (20 Dateien), `public/splash/*` (5 Dateien) aus `form-app-assets.zip`.
- Geändert: `vite.config.ts` (Manifest, `includeAssets`, `globIgnores`), `index.html` (Titel, Apple-Titel, Favicon-Links), `e2e/pwa.spec.ts` (Name „FORM“, vier Icons, Farben), `package.json` und `README.md` (ohne `pnpm icons`).
- Entfernt: `public/favicon.svg`, `public/icons/maskable-512.png`, `tools/generate-icons.mjs`.

### B Kopfzeile

- Geändert: `src/app/layout/AppLayout.tsx` (Kopfzeile 56 px mit `logo-kopfzeile-dunkel.svg`, `alt="FORM – zu Heute"`), `src/app/layout/Sidebar.tsx` (eingeklappt `kachel-f.svg`, ausgeklappt das Logo), `src/app/styles.css` (`.sidebar-tile`), `src/modules/dashboard/ui/TodayPage.tsx` (Begrüßung ab 5, 11 und 18 Uhr; Uhrzeit entfernt), `src/shared/i18n/de.ts` (`app.name` „FORM“, `app.brandLink` „FORM – zu Heute“); Tests `src/app/app.test.tsx`, `e2e/shell.spec.ts` (Selektor auf das Logo-Bild, Höhe 30 px, Tippfläche ≥ 44 px).
- Nicht geändert: Die Anmeldung zeigt noch das App-Icon (Paket C), die Tab-Leiste und die Komponenten folgen mit F2.

## 3. Tests

| Lauf | Stand | Ergebnis |
|---|---|---|
| Ausgangslage `1891e68`: `pnpm build`, `pnpm check:bundle` | 21.10.2026 | Build ok; Startansicht 249,6 KB von 250 KB |
| F0: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | 21.10.2026 | ohne Befund (Konsistenzprüfung: Beispielvorlagen 4, Winter Arc 40 Tage, 71 Übungsnamen, Programme 3, Trainingstage 84) |
| F0: `pnpm test` | 21.10.2026 | 806 Tests in 91 Dateien bestanden (wie vorher) |
| F0: `pnpm build`, `pnpm check:bundle` | 21.10.2026 | Build ok; Startansicht 226,9 KB von 250 KB (gzip), Reserve 23,1 KB |
| F0: `pnpm test:e2e` (Chromium, lokal nach `pnpm build`) | 21.10.2026 | 232 bestanden, 4 übersprungen (Tab-Leiste und Logo nur im Handy-, Seitenleiste nur im Desktop-Projekt), 0 fehlgeschlagen, 6,1 min |
| F1 und A: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | 21.10.2026 | ohne Befund |
| F1 und A: `pnpm test` | 21.10.2026 | 834 Tests in 91 Dateien bestanden (F0: 806; `tokens.test.ts` prüft jetzt 180 Paare in beiden Blöcken) |
| F1 und A: `pnpm build`, `pnpm check:bundle` | 21.10.2026 | Build ok; Startansicht 226,5 KB von 250 KB (gzip); Service Worker 178 Einträge |
| F1 und A: `pnpm test:e2e` (Chromium, lokal nach `pnpm build`) | 21.10.2026 | 172 bestanden, 4 übersprungen, 0 fehlgeschlagen, 4,9 min (weniger Tests als vorher, weil die Schleifen über „Hell“ und „Dunkel“ zu einem Lauf wurden, D-308) |
| B: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | 21.10.2026 | ohne Befund |
| B: `pnpm test` | 21.10.2026 | 834 Tests in 91 Dateien bestanden |
| B: `pnpm build`, `pnpm check:bundle` | 21.10.2026 | Build ok; Startansicht 226,5 KB von 250 KB (gzip) |
| B: `pnpm test:e2e` (Chromium, lokal nach `pnpm build`) | 21.10.2026 | Erster Lauf: 171 bestanden, 4 übersprungen, 1 fehlgeschlagen: `shell.spec.ts` „meldet unbekannte Adressen mit Weg zurück“ (Handy), weil der Selektor „Zu Heute“ auch den neuen Logo-Link „FORM – zu Heute“ traf (Playwright-Strict-Mode, Ursache im Test). Selektor auf `exact: true` gesetzt; Wiederholung von `shell.spec.ts`: 15 bestanden, 1 übersprungen, 0 fehlgeschlagen. WebKit läuft in GitHub Actions auf PR #49 |

## 4. Audit-Befunde P2, die das Rebranding erledigt

Wird je Paket ergänzt; andere P2-Punkte bleiben unangetastet.

## 5. Offen beim Produktinhaber

- Q-23: Heller Modus nach dem Rebranding (bleibt er, oder entfällt er mit den `-hell`-Dateien)? Bis dahin nur Dunkel (D-308).
- Für F2 vorgesehen: Die Tab-Leiste wird die Leiste aus dem Konzept (Nacht, Rand oben, aktiver Tab in Lime, keine Füllfläche). Die Glas-Linse (D-272) und das Schrumpfen zum Kreis beim Scrollen (D-276) passen nicht zu dieser festen Leiste und sollen entfallen; bitte widersprechen, falls das Scroll-Verhalten bleiben soll.

## 6. Stand nach dieser Sitzung

Umgesetzt, committet und gepusht: F0 (`1d5b6c8`), F1 (`196d00b`), A (`b031664`), B. Entwurfs-PR #49 (`form-rebranding` → `main`) für die CI; gemergt wird erst nach Freigabe. Offen: F2, F3, C, D, F4, G, E (Reihenfolge laut Übergabe Abschnitt 6); `brand-tokens.md` liegt als Entwurf vor und wird mit E abgeschlossen; Screenshots in `docs/screens/` folgen mit E.
