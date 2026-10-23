# Übergabe M1 · Training auf dem iPhone

Stand: 18.10.2026, 16:30 UTC · Für die nächste Claude-Sitzung (D-238) · Verbindlich bleiben `CLAUDE.md`, `implementation-plan.md` und `decisions.md`; diese Datei fasst nur den Arbeitsstand zusammen.

## 1. Wo alles liegt

| Was | Wo |
|---|---|
| Branch | `m1-training` |
| Pull Request | darad11/fitness-app#5 (Entwurf, begleitet ganz M1; gemergt wird vom Produktinhaber) |
| Letzter Commit mit grüner CI | `6f2a093` (AP 1.4 und Übergabe); AP D1 und D2 siehe `testing.md` Abschnitt 10 |
| Vorschau | https://fitness-app-git-m1-training-dr-b21f.vercel.app (Testdaten, getrennt von `main`) |
| Stand je Arbeitspaket | `implementation-plan.md`, Abschnitt M1 („Stand M1") und Abschnitt 9 |
| Testergebnisse | `testing.md` Abschnitt 10 (je AP ein Unterabschnitt) |
| Neue Entscheidungen in M1 | D-240 bis D-245 in `decisions.md` |

## 2. Erledigt

| AP | Ergebnis |
|---|---|
| Q-05 | Basisübungsliste durchgesehen; Antworten in `exercise-library.md` Abschnitt 3 |
| 1.1 | Übungsbibliothek: 105 Übungen als nachgeladene Daten (`core-exercises.v1.json`), Suche, Filter, Seite `/uebungen` |
| 1.2 | Beispielvorlagen aus `sample-templates.md` erzeugt (`tools/sample_templates_from_md.py`), Seiten `/training/programme` und `/training/vorlagen/:key` |
| 1.3 | Trainings-Domain: Modell, Anwendungsfälle, Berechnungen, Projektion `exerciseHistory` |
| 1.4 | Trainingsplayer `/training/einheit/:id`, Übungsauswahl, Einstiege, Grundfassung der Zusammenfassung, `Dialog`, `Toast`, Token `--scrim` |

## 3. Neu seit der Übergabe: Erweiterungsplan, Designsystem 2.0, Premium-Player

- Der Produktinhaber hat den Master-Prompt „Fitness App Evolution“ gegeben und den Erweiterungsplan freigegeben (Q-18). Verbindlich: `evolution-plan.md` (Schritte A bis H), `ux-audit.md`, `reference-analysis.md`, `winterprogramm-2026.md`. Seine Vorgabe: Alles Weitere folgt dem neuen Prompt, nicht dem alten Erscheinungsbild.
- AP D1 Designsystem 2.0 (D-246) und AP D2 Premium-Player mit Pause, Ton und Wake Lock (D-247, ersetzt AP 1.5) sind umgesetzt. Der frühere WIP-Branch `m1-training-wip-ap15` ist übernommen und kann gelöscht werden.
- Pull Request darad11/fitness-app#6 (Planung) ist in `m1-training` enthalten und kann geschlossen werden.

## 4. Nächste Schritte

1. **Erledigt (AP D2):** Pause als Bühne (`RestStage`), Ton (`sound.ts`), Wake Lock (`wakeLock.ts` mit `wakeLockStatus()` und `subscribeWakeLockStatus()` für die Trainingseinstellungen in AP 1.7), Tests Unit, Komponenten und E2E.
2. **Erledigt (AP 1.6):** Leiste „Training läuft" (`SessionBanner`), Karte auf „Heute", dauerhafter Speicher (`storage.ts`); Gesundheitsprüfung und Neustart stammen aus M0 (`main.tsx`).
3. **Erledigt (AP 1.7):** Verlauf (`HistoryPage`, `HistoryDetailPage`), „Heute" mit Einstiegen, Trainingseinstellungen (`SettingsPage`, `Switch`).
4. **Erledigt (AP 1.8):** JSON-Export (`export.ts`), Seite `/mehr/daten` (`DataPage`), Migrationstest-Gerüst (`migrations.test.ts`, `testing/legacyDb.ts`).
5. **Erledigt (AP 1.9) bis auf den Gerätetest:** E2E in `resilience.spec.ts`; T-IPH-M1 durch den Produktinhaber, Befunde in `known-limitations.md`.
6. Erledigt: Karte „Diese Version" angepasst. Offen: Pull Request auf „bereit" stellen, sobald der Gerätetest bestanden ist.

## 5. Vom Produktinhaber noch zu bestätigen

Ich habe diese Punkte selbst festgelegt; sie sind änderbar.

| Punkt | Entscheidung |
|---|---|
| Distanzeinheit | Rudergerät in Metern, Laufband, Fahrradergometer und Crosstrainer in Kilometern (D-241) |
| Bester Satz bei Unterstützung | geringste Entlastung, bei Gleichstand mehr Wiederholungen (D-241) |
| Einzelner Aufwärmsatz | 5 Wiederholungen (D-243) |
| „3 je Seite" | drei Sätze, jeder mit beiden Seiten; Wiederholungen und Zeit je Seite (D-243) |
| Cardio im Player | Zeit in Minuten (D-245) |

## 6. Hinweise zur Arbeit

- Abläufe und Prüfungen wie in `CLAUDE.md`; `pnpm check:docs` prüft auch die Übungsliste und die Vorlagen gegen die Daten.
- Startbündel klein halten: Gebündelte Daten und große Seiten nur nachladen. Was die `index.ts` eines Moduls statisch exportiert, landet im Startbündel (so passiert mit Suche und Übungsauswahl, behoben in AP 1.4). Prüfen mit `pnpm build && pnpm check:bundle`; Stand 181,9 KB von 250 KB.
- Eigene Fehlerklassen nicht wie Fehler von Dexie benennen (z. B. „NotFoundError"), sonst kommen sie verpackt an.
- jsdom kennt `<dialog>.showModal` nicht; `src/test-setup.ts` enthält einen Ersatz.
- Umgebung: GitHub GraphQL ist gesperrt, Pull Requests per REST (`gh api repos/darad11/fitness-app/pulls …`). Logdateien der CI sind nicht abrufbar; Fehler über die Annotationen der Check-Runs. vercel.app ist aus der Cloud-Umgebung nicht erreichbar. WebKit läuft nur in GitHub Actions.
- Ein E2E-Lauf in AP 1.2 war einmal rot (Filter auf der Übungsseite); Ursache wahrscheinlich behoben, Einzelheiten in `testing.md`. Tritt Ähnliches wieder auf, zuerst die Annotationen lesen.
