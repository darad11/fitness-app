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
| Antworten des Produktinhabers | nur Dunkel (Q-23), Tab-Leiste mit Glas und Linse in FORM-Farben, breitenunabhängig bauen | D-311 bis D-313 | festgehalten |
| F2 Komponenten | Maße, Radien, Schrift, Breakpoints und Inhaltsbreite als Tokens; Knopf, Karte, Chip (neu), Ring, Balken, Tab-Leiste (Glas in FORM-Farben), Listenzeile, Eingabe (`field`), Sheet (Griff, wegwischbar), Toast, Leerzustand; Symbole mit 1,75 px; Gewicht 600 | D-314 | umgesetzt, Screenshots in `docs/screens/komponenten/` |
| F3 Screens | Heute, Training, aktives Workout, Abschluss, Übungsdetails, Ernährung, Fortschritt und Mehr in Aufbau und Hierarchie des Konzepts; nur vorhandene Daten, keine Platzhalter; neue Komponenten `Tabs` und `MuscleTags` | D-315 | umgesetzt, Screenshots in `docs/screens/` (werden mit E erneuert) |
| C Anmeldung und Über die App | Anmeldung mit `logo-anmeldung-dunkel.svg`, Claim „FORM YOURSELF.“ und Unterzeile als Text, Felder und Knöpfe aus F2, ohne Karte, Glas und Lichtflecken; die eigenen Tokens der Anmeldung entfallen; „Über die App“ mit dem Logo ohne Claim | D-316 | umgesetzt, Screenshots `docs/screens/anmeldung.png` und `ueber-die-app.png` |
| D Startbild | `apple-touch-startup-image` für 20 Bildschirmmaße von iPhone und iPad, je hochkant und quer: drei Bilder unverändert aus dem Markenpaket, 37 nach derselben Regel erzeugt (`tools/splash.mjs`); nicht im Vorab-Speicher des Service Workers; Manifest-Farben #0C1219 seit A | D-317 | umgesetzt; Kaltstart ohne weißen Blitz nur am Gerät prüfbar (T-IPH-M0 Schritt 5, steht aus) |
| F4 Texte | Mikrotexte aus den Leitplanken (Abschluss „… Das warst du.“, Leerzustände Fortschritt und Verlauf, Ruhetag, Schritte-Ziel); keine Serie mehr in der Auswertung der Tagesaufgaben, dafür „Diese Woche x von y“; Programm „Winterprogramm 2026 (Nachbau)“ statt „Winter Arc“; Datenschutztext richtiggestellt; automatische Wortfeld-Prüfung | D-318 | umgesetzt |
| G Rückkehr-Flow | Nach 14 Tagen ohne Eintrag einmal je Rückkehr das Blatt „Schön, dass du da bist.“ mit „Ein Spaziergang“, „Ein leichtes Training“ (Hinweis im Player) und „Nur reinschauen“; „Pause“ im Verlauf und im Fortschritt; Satz zum ersten Start | D-319 | umgesetzt; Push nach 21 Tagen nicht gebaut (keine Push-Infrastruktur) |

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

### F2 Komponenten

- Neu: `src/shared/ui/Chip.tsx` (`Chip`, `chipClasses`, `tagClasses`), `src/shared/ui/breakpoints.ts` (`BREAKPOINTS`, `minWidth`, `isAtLeast`), Tests `src/app/breakpoints.test.ts` (CSS und Code nennen dieselben Breakpoints, keine festen Breakpoints neben dem Theme) und `src/shared/ui/dialog.test.tsx` (Blatt wegwischen), `tools/screenshots.mjs` (Screenshots je Komponente, später der Screens), Bilder `docs/screens/komponenten/*.png`.
- Geändert, gemeinsam: `src/app/styles.css` (Tokens für Breakpoints, Breiten, Abstände, Höhen, Schrift, Radien; Klasse `field`; `.stage` statt `.hero-glass`; Hintergrundebene, `.glass-blur` und Lichtflecken entfernt; Seitenleiste deckend; Tab-Leiste mit eigenem Glas), `src/shared/ui/tokens.css` (`--tabbar-glass`, `--tabbar-edge`, `--tabbar-blur`; `--lens-fill` transparent; `--bg-bottom`, `--glow-*`, `--glass-edge`, `--glass-blur` entfernt), `tokens.test.ts` (Tab-Beschriftung auf dem Glas), `Button.tsx`, `Card.tsx`, `Badge.tsx`, `Banner.tsx`, `Dialog.tsx`, `EmptyState.tsx`, `LinkList.tsx` (`TileIcon`), `PageHeader.tsx`, `SearchField.tsx`, `SegmentedControl.tsx`, `SelectField.tsx`, `Stat.tsx` (`StatTile`, `Meter`, `ProgressRing`), `Toast.tsx`, `index.ts`; `vitest.config.ts` (liest `styles.css` als Text); `src/app/layout/AppLayout.tsx`, `Sidebar.tsx`, `TabBar.tsx`, `src/app/errors/ErrorViews.tsx`.
- Geändert in den Modulen (nur Komponenten, keine Seitenstruktur): 19 lokale Klassen für Eingabefelder durch `field` ersetzt (Ernährung, Training, Wasser, Aufgaben, Ziele, Körper, Schritte, Einkaufsliste, Übungen); Bühnen-Karten `tone="stage"` und Primärknöpfe statt der entfallenen Variante „auf der Bühne“ (Heute, Training, Programm, Zusammenfassung, Ernährung, Ziele); zehn „Rückgängig“-Knöpfe in Hinweisen als leise Knöpfe; Kalorien-Ring auf den FORM-Ring (`MacroRing.tsx`), Makro-Balken als `Meter`; Schnellmengen beim Wasser, Wochentage der Aufgaben, Vorschläge der Einkaufsliste als Chips; „Meine Küche“ mit Ghost-Knöpfen, Symbol-Kacheln und wegwischbarem Blatt; Kopf und Fußleiste des Players und die Leiste „Training läuft“ ohne Glas; Titel und Werte mit Gewicht 600.
- Nicht geändert: Anordnung und Inhalte der Seiten (F3), Texte (F4), Anmeldung (C).

### F3 Screens

- Neu: `src/shared/ui/Tabs.tsx` (Reiter als Chips, Rollen `tablist`, `tab`, `tabpanel`, Pfeiltasten), `src/modules/exercises/ui/MuscleTags.tsx` (Hauptmuskeln als Etiketten, für Screenreader als ein Satz), Modus `screens` in `tools/screenshots.mjs`, Bilder `docs/screens/*.png` (13 Ansichten).
- Geändert, Heute: `dashboard/ui/TodayPage.tsx` (Bühne „Heute geplant“, ohne Plan „Freies Training“), `training/ui/ActiveProgramCard.tsx`, Kartentitel als Label in `goals/ui/WeeklyGoalCard.tsx`, `habits/ui/TasksCard.tsx`, `steps/ui/StepsTodayCard.tsx`, `water/ui/WaterCard.tsx`; `nutrition/ui/NutritionPage.tsx` (`NutritionTodayCard` mit Ring und Makro-Zeilen, runde Symbol-Knöpfe).
- Geändert, Training: `TrainingPage.tsx`, `ProgramsPage.tsx` (Symbol-Kachel, Etiketten, Kürzen der Beschreibung repariert), `SampleTemplatePage.tsx`, `SessionBanner.tsx`, `HistoryPage.tsx`, `programs/ProgramEditPage.tsx` (Chevrons), `player/SessionPage.tsx` (Kopf mit Zurück, Muskel-Etiketten, Fußleiste in Blau), `player/RestStage.tsx` (Chips ±15 s, „Überspringen“ in Blau, überzogene Pause mit Lime-Rand), `player/ValueInput.tsx`, `SummaryPage.tsx` (Abschluss neu aufgebaut, „Nächste Einheit“).
- Geändert, Ernährung: `NutritionPage.tsx` (Bühne „Gegessen“, Mahlzeiten mit Symbol-Kachel und Anzahl), `KitchenMenu.tsx`, `FoodsPage.tsx`, `RecipesPage.tsx`, `ScannerDialog.tsx` (Farben ohne `on-ink`), `TargetsPage.tsx`.
- Geändert, Übungen und Fortschritt: `progress/ui/ExerciseDetailPage.tsx` (Aliasse, Etiketten, Reiter „Muskeln“ und „Alternativen“, Tipp-Karte), `progress/ui/ProgressPage.tsx`, `exercises/ui/ExerciseLibraryPage.tsx`, `exercises/index.ts`, `habits/ui/TaskStats.tsx`.
- Geändert, gemeinsam: `src/shared/ui/Button.tsx` (Varianten `tile` und `action`), `Stat.tsx` (Hinweis im `dd`), `index.ts`; Texte `src/shared/i18n/de.ts` (Abschluss, Reiter der Übungsdetails, „Training starten“; Titel der Bühne ohne Plan entfernt), `de-nutrition.ts` (Anzahl der Einträge).
- Tests angepasst: `programs-ui.test.tsx`, `programs/own-programs-ui.test.tsx`, `player/player-ui.test.tsx`, `custom-exercises-ui.test.tsx`; E2E `programs.spec.ts`, `session.spec.ts`, `notes.spec.ts` (neue Überschrift, „Zur Übersicht“ führt zu „Heute“).
- Nicht geändert: Datenmodell, Routen und Funktionen; Texte nach den Leitplanken folgen mit F4, Anmeldung mit C.

### C Anmeldung und Über die App

- Geändert: `src/modules/sync/ui/LoginScreen.tsx` (neu aufgebaut: Logo als Überschrift mit Alternativtext „FORM“, Claim mit `lang="en"`, Unterzeile, Felder `field`, Primärknopf, „Später“ als Ghost-Knopf, Umschalter als leiser Knopf; Lichtflecken und das Umstellen von `theme-color` entfernt), `src/modules/settings/ui/AboutPage.tsx` (Logo ohne Claim oben in der ersten Karte), `src/app/styles.css` (Block der Anmeldung: `.login-screen`, `.login-body`, `.brand-logo`, `.form-claim`, `.form-claim-sub`; Glas, Lichtflecken und ihre Animation entfernt; Tokens `--container-logo` und `--text-claim`), `src/shared/ui/tokens.css` (17 Tokens `--login-*` je Block entfernt), `src/shared/ui/tokens.test.ts` (Paare der Anmeldung entfernt; die Anmeldung nutzt die geprüften Paare der App), `src/shared/i18n/de-sync.ts` (`loginTitle` „FORM“, `claim`, `claimSub`).
- Tests: `src/modules/sync/ui/sync-ui.test.tsx` (neu: Logo als Name, Claim mit Unterzeile), `src/app/app.test.tsx` (Logo in „Über die App“, ohne Claim), E2E `e2e/sync.spec.ts` (Name des Fensters „FORM“ statt „Fitness“).
- Screenshots: `tools/screenshots.mjs` (Anmeldung, Über die App), Bilder `docs/screens/anmeldung.png` und `docs/screens/ueber-die-app.png`.
- Nicht geändert: Ablauf von Anmelden, Registrieren, Bestätigungsmail und Abgleich (D-269, D-273); Texte außer Name und Claim.

### D Startbild

- Neu: `tools/splash.mjs` (erzeugt Startbilder aus `public/splash/splash.svg`: Nacht, Symbol mittig, 24 % der kurzen Seite, Mitte bei 47 % der Höhe; prüft die Regel vorher gegen die drei Bilder des Markenpakets und gibt die Zeilen für `index.html` aus), 37 Bilder `public/splash/splash-<Breite>x<Höhe>.png`, `src/app/splash.test.ts` (je Zeile Datei und Pixelmaß, beide Lagen je Gerät, jedes Bild verlinkt, die drei Bilder des Markenpakets dabei).
- Geändert: `index.html` (40 Zeilen `apple-touch-startup-image`), `vite.config.ts` (`globIgnores` um `**/splash/*.png` ergänzt), `e2e/pwa.spec.ts` (neuer Test: alle 40 Startbilder werden als PNG in passender Größe ausgeliefert), `docs/testing.md` (T-IPH-M0 Schritt 5: Kaltstart hochkant und quer), `docs/known-limitations.md` (Zeile „Startbild“).
- Nicht geändert: die drei Bilder aus dem Markenpaket, Manifest (Farben seit Paket A), `theme-color`.

### F4 Texte

- Texte: `src/shared/i18n/de.ts` (Abschlusszeile `summary.doneLine`, Leerzustände `progress.empty*` und `history.empty*`, `today.restPlanned`, `today.heroText` ohne Speicherversprechen, `steps.targetReached`, `about.privacyText` richtiggestellt, `profile.greeting` entfernt), `de-task-stats.ts` (Serie durch „Diese Woche“ ersetzt, „Weiter so“ entfernt).
- Abschluss: `training/ui/SummaryPage.tsx` (Zeile nur mit erledigtem Satz). Verlauf: `HistoryPage.tsx` (Leerzustand mit Sekundärknopf). Ruhetag: `calc/programProgress.ts` (`isPlannedRest`), `ui/ActiveProgramCard.tsx` (`rest`, `plannedRest`), `training/index.ts`, `dashboard/ui/TodayPage.tsx`.
- Tagesaufgaben ohne Serie: `habits/calc/insights.ts` (`overallWeek`, `habitWeek` statt `overallStreaks`, `habitStreaks`), `habits/calc/streak.ts` umbenannt in `days.ts` (ohne `streak`, `recentDays`, `pickDaily`), `ui/TaskStats.tsx`, `ui/TaskDetailPage.tsx`, Importe in `TasksPage.tsx`, `useTodayTasks.ts`, `habitService.ts`.
- Programm C umbenannt: `tools/data/programs.source.json`, daraus `programs.v1.json` und `docs/programs.md` (`python3 tools/programs_build.py`).
- Neu: `src/app/wording.test.ts` (Wortfeld-Prüfung), `training/ui/active-program-card.test.tsx` (Ruhetag). Angepasst: `insights.test.ts`, `days.test.ts`, `habitService.test.ts`, `task-stats.test.tsx`, `programProgress.test.ts`, `progress-ui.test.tsx`, `history-ui.test.tsx`, `player-ui.test.tsx`, `programs-ui.test.tsx`; E2E `session.spec.ts` (Abschlusszeile).
- Dokumente: `docs/requirements.md` (AK-HAB-03, AK-HAB-04), `docs/feature-inventory.md` mit `feature-inventory.csv` (TH-04 ausgeschlossen).

### G Rückkehr-Flow

- Neu: `src/shared/lib/pause.ts` (`PAUSE_DAYS` = 14, `isPause`), `src/shared/db/activity.ts` (`lastEntryDay`: letzter Tag mit Eintrag in Training, Tagesaufgaben, Ernährung, Wasser, Körpergewicht), `src/modules/dashboard/calc/returnFlow.ts` (`shouldShowReturn`, `laterDay`), `src/modules/dashboard/ui/ReturnFlow.tsx` (`useReturnFlow`, `ReturnSheet`); Tests `activity.test.ts`, `returnFlow.test.ts`, E2E `e2e/return.spec.ts`.
- Geändert: `dashboard/ui/TodayPage.tsx` (Blatt, Hervorhebung der Schritte, leichtes Training, Satz zum ersten Start), `steps/index.ts` (`lastStepsDay`, lädt den Zwischenspeicher erst bei Bedarf), `training/ui/useStartSession.ts` (`light`, `LIGHT_QUERY`), `training/ui/ActiveProgramCard.tsx` (`nextDayInput`), `training/ui/player/SessionPage.tsx` (Hinweis „Weniger Sätze sind heute in Ordnung.“), `training/calc/history.ts` (`pauseAfterGroup`) mit `HistoryPage.tsx` („Pause“ zwischen Wochen), `progress/ui/ProgressPage.tsx` („Pause“ statt Nullwerten), `src/shared/ui/Dialog.tsx` (Blatt nach Inhalt `fit`, Startfokus auf dem Titel `focusTitle`), `src/shared/i18n/de.ts` (Texte `returnFlow`, `today.firstStart`, `history.pause`, `progress.pause`), `tools/screenshots.mjs` (Rückkehr-Flow), Tests `history.test.ts`, `progress-ui.test.tsx`; `docs/requirements.md` (AK-DSH-09).
- Nicht geändert: Daten der Tagesaufgaben (pausierte bleiben pausiert), Pläne und Sätze; kein neues Feld in der Datenbank (der Vermerk liegt in `meta`).

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
| CI auf PR #49 nach B (`4029407`, Lauf 39678948616) | 21.10.2026 | Job „Lint, Typen, Unit-Tests, Dokumente, Build“ rot: `custom-exercises-ui.test.tsx` „legt eine Übung an, speichert Angaben und archiviert sie“, Dialog „Eigene Übung anlegen“ nicht innerhalb von 1 s gefunden; E2E (Chromium, WebKit) deshalb übersprungen. Lokal mit `pnpm test:coverage` derselbe Fehlertyp in `habits-ui.test.tsx` (Überschrift „Tagesaufgaben“ nach 1 s nicht da); einzeln laufen beide grün. Ursache: `findBy…` wartet auf nachgeladene Teile nur die Standardzeit von 1 s, unter Volllast mit Coverage reicht das nicht |
| Fix `ada0da4` (Wartezeit 5 s in `src/test-setup.ts`): `pnpm test:coverage` zweimal | 21.10.2026 | je 834 Tests in 91 Dateien bestanden |
| `ada0da4`: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs`, `pnpm build`, `pnpm check:bundle` | 21.10.2026 | ohne Befund; Startansicht 226,5 KB von 250 KB (gzip) |
| `ada0da4`: `pnpm test:e2e` (Chromium, lokal) | 21.10.2026 | 171 bestanden, 4 übersprungen, 1 fehlgeschlagen: `network-a11y.spec.ts` „alle Anfragen gehen an die eigene Adresse“ (Handy), `/mehr/daten` zeigte unter Volllast nach 5 s keine Überschrift. Einzeln wiederholt: 2 bestanden (13,6 s) |
| CI auf PR #49 nach `ada0da4` (Lauf 39685415804) | 21.10.2026 | Checks grün; E2E Chromium: 172 bestanden, 4 übersprungen (3,0 min); E2E WebKit: 166 bestanden, 10 übersprungen (6,4 min); keine Wiederholungen nötig |
| F2: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | 21.10.2026 | ohne Befund |
| F2: `pnpm test:coverage`, danach `pnpm test` | 21.10.2026 | 843 Tests in 92 Dateien bestanden (vorher 834 in 91: neu 6 Prüfungen der Tab-Beschriftung auf dem Glas, 3 Breakpoint-Tests); mit `dialog.test.tsx` (Blatt wegwischen, 4 Tests) 847 Tests in 93 Dateien bestanden |
| F2: `pnpm build`, `pnpm check:bundle` | 21.10.2026 | Build ok; Startansicht 227,1 KB von 250 KB (gzip) |
| F2: `pnpm test:e2e` (Chromium, lokal nach `pnpm build`) | 21.10.2026 | 172 bestanden, 4 übersprungen, 0 fehlgeschlagen (5,1 min); nach der letzten Änderung an „Meine Küche“ `nutrition.spec.ts`, `shopping.spec.ts`, `tabbar.spec.ts` wiederholt: 19 bestanden, 3 übersprungen. WebKit läuft in GitHub Actions |
| CI auf PR #49 nach F2 (`9944f96`) | 21.10.2026 | Checks grün; E2E Chromium grün; E2E WebKit: 166 bestanden, 10 übersprungen (6,2 min) |
| F3: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | 21.10.2026 | ohne Befund (Prettier formatierte vorher `ProgramsPage.tsx` und `SummaryPage.tsx` nach) |
| F3: `pnpm test` | 21.10.2026 | 847 Tests in 93 Dateien bestanden |
| F3: `pnpm build`, `pnpm check:bundle` | 21.10.2026 | Build ok; Startansicht 227,7 KB von 250 KB (gzip) |
| F3: `pnpm test:e2e` (Chromium, lokal nach `pnpm build`), erster Lauf | 21.10.2026 | 170 bestanden, 4 übersprungen, 2 fehlgeschlagen (4,3 min): `session.spec.ts` „Training aus einer Vorlage …“ (Desktop und Handy), axe meldet auf dem Abschluss `definition-list: .gap-4`. Ursache: `StatTile` setzte den Hinweis „Gewicht × Wiederholungen ohne Aufwärmsätze“ als `p` in die Definitionsliste (seit Arbeitspaket D1, `e42b474`; auf dem Abschluss erst mit F3 in einer Definitionsliste). Fix: Hinweis im `dd`; Prüfung des Werts in `session.spec.ts` von `toHaveText` auf `toContainText` |
| F3: `pnpm test:e2e` (Chromium, lokal), zweiter Lauf nach dem Fix | 21.10.2026 | 171 bestanden, 4 übersprungen, 1 fehlgeschlagen (4,4 min): `pwa.spec.ts` „Service Worker übernimmt und alle Bereiche starten offline“ (Handy), `/training/vorlagen/full_body_ab` blieb offline 5 s leer (keine Überschrift, keine Konsolenfehler); im selben Lauf am Desktop grün, im ersten Lauf in beiden Projekten grün. `session.spec.ts` jetzt in beiden Projekten grün. Wiederholung `pwa.spec.ts` mit `--repeat-each=3`: 12 bestanden (52 s). Der Test ist als zeitkritisch bekannt (Kommentar im Test: einmal rot am Handy auf dem CI-Runner) |
| CI auf PR #49 nach F3 (`007d1c4`, Lauf 39695137749) | 21.10.2026 | Checks grün; E2E Chromium grün (Job 3,8 min mit Einrichtung); E2E WebKit: 166 bestanden, 10 übersprungen (6,0 min) |
| C: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | 21.10.2026 | ohne Befund |
| C: `pnpm test` | 21.10.2026 | 810 Tests in 93 Dateien bestanden (F3: 847; 38 Kontrastprüfungen der entfallenen Tokens `--login-*` fallen weg, 19 je Modus; neu 1 Test der Anmeldung) |
| C: `pnpm build`, `pnpm check:bundle` | 21.10.2026 | Build ok; Startansicht 227,1 KB von 250 KB (gzip; F3: 227,7 KB, die Regeln für Glas und Lichtflecken der Anmeldung entfallen) |
| C: `pnpm test:e2e` (Chromium, lokal nach `pnpm build`) | 21.10.2026 | 172 bestanden, 4 übersprungen, 0 fehlgeschlagen (4,4 min); axe prüft `/mehr/synchronisierung` mit offener Anmeldung und `/mehr/ueber` (`network-a11y.spec.ts`) |
| CI auf PR #49 nach C (`d444b74`, Lauf 39696479837) | 22.10.2026 | Checks grün; E2E Chromium grün; E2E WebKit: 166 bestanden, 10 übersprungen (4,6 min) |
| D: `node tools/splash.mjs --check` | 22.10.2026 | Regel gegen die drei Bilder des Markenpakets: mittlere Abweichung 0,226 (1170 × 2532), 0,214 (1290 × 2796), 0,225 (2048 × 2732) von 255 |
| D: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | 22.10.2026 | ohne Befund |
| D: `pnpm test` | 22.10.2026 | 814 Tests in 94 Dateien bestanden (neu `splash.test.ts` mit 4 Tests; Gegenprobe: ein vertauschter Dateiname lässt 2 davon fehlschlagen) |
| D: `pnpm build`, `pnpm check:bundle` | 22.10.2026 | Build ok; Service Worker 177 Einträge (2785 KiB) ohne Startbilder; Startansicht 227,1 KB von 250 KB (gzip) |
| D: `pnpm test:e2e` (Chromium, lokal nach `pnpm build`) | 22.10.2026 | 174 bestanden, 4 übersprungen, 0 fehlgeschlagen (4,4 min); neu je Projekt „Startbilder für iPhone und iPad werden ausgeliefert“ |
| CI auf PR #49 nach D (`de10a84`, Lauf 39697634270) | 22.10.2026 | Checks grün; E2E Chromium grün; E2E WebKit: 168 bestanden, 10 übersprungen (4,1 min), die Startbild-Tests auch in WebKit grün |
| F4: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | 22.10.2026 | ohne Befund (Prettier formatierte vorher `history-ui.test.tsx` nach) |
| F4: `pnpm test` | 22.10.2026 | 838 Tests in 96 Dateien bestanden (D: 814 in 94; neu `wording.test.ts` mit 25 und `active-program-card.test.tsx` mit 2 Tests, Wochenbild statt Serie in `insights.test.ts`, Ruhetag in `programProgress.test.ts`; entfallen die Tests der Serie, von `recentDays` und `pickDaily`). Gegenprobe der Wortfeld-Prüfung: mit dem alten Programmnamen schlägt „kein Text enthält „Winter Arc““ fehl |
| F4: `pnpm build`, `pnpm check:bundle` | 22.10.2026 | Build ok; Startansicht 227,3 KB von 250 KB (gzip) |
| F4: `pnpm test:e2e` (Chromium, lokal nach `pnpm build`) | 22.10.2026 | 173 bestanden, 4 übersprungen, 1 fehlgeschlagen (4,4 min): wieder `pwa.spec.ts` „… alle Bereiche starten offline“ (Handy), wieder `/training/vorlagen/full_body_ab` leer. Laut Trace scheiterte offline die Anfrage nach `assets/uuid-*.js` (Status -1), die übrigen Module kamen aus dem Service Worker; ohne dieses Modul startet die App nicht. Das ist dieselbe Stelle wie bei F3 und unabhängig von F4. Wiederholung `--repeat-each=3`: 18 bestanden. Ursachensuche als eigene Aufgabe vorgeschlagen; `session.spec.ts` mit der Abschlusszeile in beiden Projekten grün |
| CI auf PR #49 nach F4 (`abf29b6`, Lauf 39699806899) | 22.10.2026 | Checks grün; E2E Chromium grün; E2E WebKit: 168 bestanden, 10 übersprungen (4,8 min), die Abschlusszeile auch in WebKit grün |
| G: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | 22.10.2026 | ohne Befund |
| G: `pnpm test` | 22.10.2026 | 846 Tests in 98 Dateien bestanden (F4: 838 in 96; neu `activity.test.ts` mit 3 und `returnFlow.test.ts` mit 4 Tests, „Pause“ in `history.test.ts` und `progress-ui.test.tsx`) |
| G: `pnpm build`, `pnpm check:bundle` | 22.10.2026 | Build ok; Service Worker 178 Einträge; Startansicht 228,7 KB von 250 KB (gzip; F4: 227,3 KB) |
| G: `pnpm exec playwright test e2e/return.spec.ts` (neu) | 22.10.2026 | 6 bestanden: Blatt erst nach 14 Tagen, genau einmal, ohne Ziffern im Text, ohne axe-Verstöße; „Nur reinschauen“, „Ein Spaziergang“ (Schritte-Karte hervorgehoben und fokussiert), „Ein leichtes Training“ (Player mit Hinweis), erneutes Blatt erst nach neuem Eintrag und neuer Pause; „Pause“ im Verlauf |
| G: `pnpm test:e2e` (Chromium, lokal nach `pnpm build`) | 22.10.2026 | 179 bestanden, 4 übersprungen, 1 fehlgeschlagen (4,9 min): wieder `pwa.spec.ts` „… alle Bereiche starten offline“ (Handy), diesmal `/mehr/profil`; laut Trace scheiterte offline das Einstiegsmodul `assets/index-*.js` (Status -1). Damit ist es kein bestimmtes Modul und keine bestimmte Seite, sondern ein zufälliges Modul aus dem Service Worker unter Volllast. Wiederholung von `pwa.spec.ts` und `return.spec.ts` mit `--repeat-each=2`: 24 bestanden. In der CI war der Test in allen Läufen dieser Sitzung grün |
| CI auf PR #49 nach G (`a91b255`, Lauf 39702602270) | 22.10.2026 | Checks grün; E2E Chromium grün; E2E WebKit: 174 bestanden, 10 übersprungen (6,1 min), darunter die 6 Tests des Rückkehr-Flows |
| E: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | 22.10.2026 | ohne Befund |
| E: `pnpm test` | 22.10.2026 | 822 Tests in 98 Dateien bestanden (G: 846; 24 Kontrastprüfungen der entfallenen Tokens `--ink-2`, `--on-ink`, `--on-ink-muted` fallen weg, 12 je Modus) |
| E: `pnpm build`, `pnpm check:bundle` | 22.10.2026 | Build ok; Startansicht 228,7 KB von 250 KB (gzip) |
| E: `node tools/screenshots.mjs komponenten` und `screens` | 22.10.2026 | 11 Komponenten- und 17 Screen-Bilder erneuert, darunter neu `rueckkehr-flow.png` und `rueckkehr-leichtes-training.png`; durchgesehen |
| E: `pnpm test:e2e` (Chromium, lokal nach `pnpm build`) | 22.10.2026 | 180 bestanden, 4 übersprungen, 0 fehlgeschlagen (4,8 min) |
| CI auf PR #49 nach E (`9e46ec3`, Lauf 39703722166) | 22.10.2026 | Checks grün; E2E Chromium grün; E2E WebKit: 174 bestanden (4,2 min) |

## 4. Audit-Befunde P2, die das Rebranding erledigt

Keiner. Die P2-Befunde aus `audit-report.md` Abschnitt 5 betreffen Daten, Abgleich und Logik, nicht das Erscheinungsbild; sie bleiben offen und unangetastet. Berührt, aber nicht behoben: B-07 (Start aus einem Programm ohne Fehlerbehandlung im Klick); die Startdaten kommen jetzt aus einer Funktion (`nextDayInput`, G), die Fehlerbehandlung fehlt weiter. Aus P3 A-12 (toter Code) entfielen nebenbei `streak()`, `recentDays()` und `pickDaily()` (F4) sowie ungenutzte Tokens (C, E); die dort genannten Stellen (`sessionUi`, `listDocs` …) bleiben.

## 5. Antworten des Produktinhabers (21.10.2026) und offene Punkte

- Q-23 heller Modus: zum Start nur Dunkel; die hellen Tokens bleiben angelegt und werden nicht ausgeliefert; neu bewerten, wenn Nutzer danach fragen (D-311).
- Tab-Leiste: Die schwebende Leiste bleibt mit Glas, Linse und dem Schrumpfen zum runden Knopf beim Scrollen; nur die Farben werden FORM. Das Glas der Tab-Leiste ist die einzige Ausnahme von „kein Glas“ (D-312). Der Plan aus F1, Linse und Schrumpfen entfallen zu lassen, ist damit verworfen.
- Breitenunabhängig bauen: F2 und F3 ohne feste Pixelbreiten, Abstände und Breiten über Tokens, Breakpoints an einer Stelle, eine größte Inhaltsbreite; mehrspaltige Layouts für breite Bildschirme in einer eigenen Sitzung (D-313).

Offen beim Produktinhaber:

1. Durchsicht und Merge von PR #49 (`form-rebranding` → `main`).
2. Name von Programm C: „Winterprogramm 2026 (Nachbau)“ statt „Winter Arc 2026 (Nachbau)“, weil „Winter Arc“ zu den gestrichenen Wörtern gehört (D-318). Bestätigen oder einen anderen Namen nennen.
3. Serie in der Auswertung der Tagesaufgaben entfernt, „Diese Woche x von y“ stattdessen (D-318, ändert D-284). Die Leitplanken verlangen es ausdrücklich; die Entscheidung ist leicht umkehrbar, die Rechnung ist aber entfernt.
4. Gerätetest T-IPH-M0 Schritt 5: App neu zum Home-Bildschirm hinzufügen, Kaltstart hochkant und quer, kein weißer Blitz (D-317).
5. `brand-tokens.md` Abschnitt 5: App-Farben an die Markenfarben angleichen? Empfehlung: so lassen; Grundfläche, Akzent und Kachel sind schon gleich.
6. Push nach 21 Tagen Pause ist nicht gebaut (keine Push-Infrastruktur, D-319).
7. Der E2E-Test „Service Worker übernimmt und alle Bereiche starten offline“ ist lokal im vollen Lauf am Handy wiederholt rot (ein zufälliges Modul kommt offline nicht aus dem Service Worker, Abschnitt 3); in der CI war er in allen Läufen grün. Ursachensuche als eigene Aufgabe vorgeschlagen.

## 6. Stand nach dieser Sitzung

Alle Pakete der Übergabe sind umgesetzt, committet und gepusht: F0 (`1d5b6c8`), F1 (`196d00b`), A (`b031664`), B (`4029407`), Test-Fix für die CI (`ada0da4`), Entscheidungen D-311 bis D-313 (`10fa638`), F2 (`9944f96`), F3 (`007d1c4`), C (`d444b74`), D (`de10a84`), F4 (`abf29b6`), G (`a91b255`) und E (`9e46ec3`, Token-Abgleich, Screenshots, dieser Bericht). Entscheidungen D-307 bis D-320 in `docs/decisions.md`.

Ergebnisse wie vorgesehen:

- `brand-tokens.md` final: Abgleich mit `brand.css`, Zuordnung alt → neu je Token, nachgerechnete Kontraste, bewusste Abweichungen vom Konzept, offene Punkte (D-320).
- Screenshots in `docs/screens/`: Heute, Training (mit Programmliste), aktives Workout, Abschluss, Übungsdetails, Ernährung, Fortschritt (leer und mit Daten), Mehr, Anmeldung, Über die App, Rückkehr-Flow (Blatt und leichtes Training), Tab-Leiste ausgeklappt und als runder Knopf; Komponenten in `docs/screens/komponenten/`.
- Entwurfs-PR #49 (`form-rebranding` → `main`) mit CI für jeden Paket-Commit; gemergt wird erst nach Freigabe durch den Produktinhaber.

Testergebnisse je Paket stehen wörtlich in Abschnitt 3. Nicht hier prüfbar und deshalb offen: Gerätetests am iPhone (Startbild, Anmeldung, Rückkehr-Flow am Gerät).
