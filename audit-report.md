# Audit Phase A – Bericht

Stand: 21.10.2026 · Branch `form-rebranding` (Basis `c6b5832`, entspricht `main` nach PR #45 plus den abgelegten Rebranding-Dateien) · Auftrag: `docs/prompts/audit-FORM.md`, Abschnitte 1, 2 und 17 (Phase A).

Regeln dieser Phase: Repository analysieren, Fehler und Risiken dokumentieren, nur P0 und P1 beheben, alle Tests ausführen. Keine neuen Features, kein Redesign, keine Änderung am Datenmodell ohne Migrations- und Rückfallplan, keine Änderung an Farben, Tokens und Komponenten (Rebranding folgt).

Status je Befund: **behoben** (mit Commit und D-Nummer in `docs/decisions.md`) oder **offen**. Nur Getestetes gilt als behoben.

---

## 1. Vorgehen

- Fünf Prüfbereiche, jeweils als eigene, nur lesende Teilsitzung; die Hauptsitzung hat die P1-Befunde im Code nachvollzogen und behebt sie:
  - **A** Datenbank, Dokumente, Snapshots, Export, Synchronisierung (`src/shared/db/**`, `src/modules/sync/**`, `src/main.tsx`, `src/app/RecoveryScreen.tsx`)
  - **B** Training und Übungen (`src/modules/training/**`, `src/modules/exercises/**`, gebündelte Stammdaten)
  - **C** Ernährung, Einkaufsliste, Wasser (`src/modules/nutrition/**`, `src/modules/shopping/**`, `src/modules/water/**`, `src/shared/lib/format.ts`)
  - **D** Tagesaufgaben, Ziele, Schritte, Körpergewicht, Fortschritt, „Heute“, Einstellungen, Profil (`src/modules/{habits,goals,steps,body,progress,dashboard,settings}/**`)
  - **E** App-Shell, PWA, Sicherheit, Infrastruktur, Tests (`src/app/**`, `src/shared/pwa/**`, `vercel.json`, `vite.config.ts`, `playwright.config.ts`, `.github/workflows/ci.yml`, Abhängigkeiten)
- Hypothesen wurden mit temporären Testdateien (`*.audit.test.ts`) gegen den echten Code verifiziert; die Dateien sind gelöscht, nichts davon ist im Repository.
- Ausgangslage vor den Fixes (Branch `form-rebranding`, `c6b5832`): `pnpm lint` ohne Befund, `pnpm typecheck` ohne Befund, `pnpm test` 797 Tests in 91 Dateien bestanden, `pnpm build` ok, `pnpm check:bundle` 249,4 KB von 250 KB (gzip, Startansicht). `pnpm audit --prod`: „No known vulnerabilities found“.
- Zeilenangaben in den Tabellen beziehen sich auf den Stand `c6b5832`.

## 2. Zusammenfassung

| Priorität | Anzahl | Status |
|---|---|---|
| P0 Kritisch | 0 | – |
| P1 Hoch | 4 (B-01, C-01, A-01, A-02) | B-01, C-01 und A-01 behoben; A-02 offen, Behebung in dieser Phase |
| P2 Mittel | 16 (A-07 und E-02 sind derselbe Befund) | offen, dokumentiert |
| P3 Optional | 50 (A-11 und E-11 überschneiden sich) | offen, dokumentiert |

Die vier P1-Befunde haben gemeinsam, dass Daten still verloren gehen oder sich still verändern, ohne dass die App es meldet: eine vergessene Einheit lässt sich nicht beenden (B-01), vorbelegte Mengen ab 1.000 werden beim Speichern falsch gelesen (C-01), der Sync überspringt Dokumente neuerer App-Versionen für immer (A-01), und das Verwerfen einer veralteten laufenden Kopie löscht ein abgeschlossenes Training auf allen Geräten (A-02).

Sicherheit: keine Befunde der Stufen P0/P1. CSP, Secrets, XSS, Token-Handhabung und Abhängigkeiten sind in Ordnung (Abschnitt 7).

---

## 3. P0 – Kritisch

Keine Befunde.

## 4. P1 – Hoch

| ID | Befund | Datei / Komponente | Auswirkung | Lösung | Status |
|---|---|---|---|---|---|
| B-01 | „Training beenden“ schlägt nach mehr als 24 Stunden dauerhaft fehl; einziger Ausweg ist „Verwerfen“ | `src/modules/training/service/sessionService.ts` 770–806 (`finishSession`, Zeile 799 schreibt die ungekappte Dauer); `src/modules/training/model/session.ts` 21–30, 118 (`durationSec` max. 86.400); `src/shared/db/repository.ts` 71–73 (`schema.parse` wirft) | Die Einheit lässt sich nie mehr abschließen („Nicht gespeichert“, „Erneut versuchen“ scheitert gleich). Die Leiste „Training läuft“ bleibt, ein neues Training ist blockiert. Verwerfen löscht alle erfassten Sätze. | Beim Beenden einer Einheit, die länger als 24 h offen war, endet sie mit dem Zeitpunkt des zuletzt erledigten Satzes (ohne erledigten Satz: jetzt); die Dauer wird auf 24 h gekappt. Neue Funktionen `lastCompletedAt` und `finishEndedAt` in `calc/session.ts`, Aufruf in `finishSession`. Tests in `calc/session.test.ts` und `service/sessionService.test.ts`. | **behoben** · Commit `715a575` · D-290 |
| C-01 | Vorbelegte Zahlen ab 1.000 stehen mit Tausenderpunkt im Eingabefeld und werden beim Speichern als „1“ gelesen (de-DE still falsch, de-CH blockiert, de-AT nur zufällig richtig) | `src/shared/lib/format.ts` 103–114 (`formatNumber` ohne `useGrouping: false`), 132–148 (`parseDecimal` lehnt Tausendertrennzeichen ab bzw. liest „1.000“ als 1); `src/modules/nutrition/ui/EntryDialog.tsx` 33–39 (Vorbelegung) und 47–55 (Menge wird immer neu gesendet, auch bei reinem Mahlzeitwechsel); `src/modules/nutrition/ui/FoodFormPage.tsx` 93–98, 109–114, 135–137; `src/modules/nutrition/ui/RecipeEditPage.tsx` 78–87, 96–105, 113–119; `src/modules/nutrition/service/nutritionService.ts` 260–276 (`changeEntry` rechnet die Nährwerte mit dem Faktor um). Ergänzung der Hauptsitzung, gleiche Ursache: `src/modules/training/ui/player/SessionPage.tsx` 218–221 (`number` für `ValueInput`, Distanz in m und Sekunden ab 1.000) und `src/modules/training/ui/HistoryDetailPage.tsx` 46 mit `HistoryEditForm.tsx` 48 (Vorbelegung beim Bearbeiten) | Eintrag „1000 ml“ wird beim Speichern (auch nur mit geänderter Mahlzeit) zu 1 ml, alle Nährwerte durch 1.000 geteilt; Rezept-Zutat „1000 g“ erscheint beim Öffnen als 1 g in der Vorschau und wird so gespeichert; Portion „Packung 1000 g“ wird beim nächsten Speichern des Lebensmittels zu 1 g; Distanz „2000 m“ im Verlauf wird nach dem Bearbeiten zu 2 m. Zweiter Auslöser in allen Sprachen: Portionsanzahl 0,333 wird als „0,33“ vorbelegt und so zurückgeschrieben. Tagessumme und Makro-Ring stimmen danach still nicht mehr. | Option `useGrouping` in `NumberOptions`; alle vorbelegten Eingabefelder formatieren mit `useGrouping: false` (EntryDialog, FoodFormPage, RecipeEditPage, Player, Verlauf bearbeiten). `EntryDialog` sendet Menge bzw. Anzahl nur, wenn der Text geändert wurde. Regressionstests: `format.test.ts` (de-DE, de-AT, de-CH), `nutrition-ui.test.tsx` (Eintrag 1.500 ml, Portion ⅓, Lebensmittel-Portion 1.000, Rezept-Zutat 1.200), `history-ui.test.tsx` und `player-ui.test.tsx` (Distanz 2.000 m). | **behoben** · Commit `affff5d` · D-291 |
| A-01 | Sync überspringt Zeilen unbekannter Tabellen oder Typen und rückt den Cursor trotzdem vor; bei Versionsversatz zwischen iPhone und Mac verliert ein Gerät diese Dokumente dauerhaft | `src/modules/sync/service/syncEngine.ts` 46–54 (`validRemote` gibt bei unbekanntem `doc_table`/`doc_type` `null`), 75–77 (`continue`), 126–127 (Cursor auf die letzte `rev` der Seite); `src/shared/db/schema.ts` 82–99 (`DOCUMENT_TABLES`); `src/shared/db/export.ts` 17–34 (`EXPORT_TYPES`) | Eine ältere App-Version (z. B. iPhone noch auf v7 ohne `waterLog`) übergeht Dokumente der neueren Version und holt sie nach dem Update nie nach, weil der Cursor schon dahinter steht und das andere Gerät sie nicht erneut sendet. Stiller, dauerhafter Datenverlust auf diesem Gerät; Listen und Verläufe unterscheiden sich zwischen den Geräten. Realistisch heute: v7 (20.10.) und v8 (21.10.) kamen an zwei Tagen, Versionen werden je Gerät erst nach „Jetzt aktualisieren“ aktiv. | `pull` verarbeitet eine Seite nur bis zur ersten Zeile mit unbekannter Tabelle oder Art, lässt den Cursor davor stehen, sendet in diesem Lauf nichts und wirft `AppOutdatedError`; Mehr › Synchronisierung zeigt „Ein anderes Gerät nutzt eine neuere Version … bitte aktualisieren“. Nach dem Update geht es an derselben Stelle weiter. Test „hält vor Dokumenten einer neueren App-Version an“ in `syncEngine.test.ts`; Hinweis in `known-limitations.md` Abschnitt 7. | **behoben** · Commit „Sync: Abgleich hält vor Dokumenten einer neueren App-Version an (D-292)“ · D-292 |
| A-02 | Konfliktregel K-03 fehlt: Wer auf dem zweiten Gerät eine veraltete laufende Kopie verwirft, löscht das abgeschlossene Training auf allen Geräten | `src/modules/sync/calc/merge.ts` 18–22 (`MergeDoc` ohne `deletedFrom`), 38–44 (sobald eine Seite gelöscht ist, gilt nur „jüngerer HLC gewinnt“); `src/modules/sync/service/syncEngine.ts` 115–120 (`take` schreibt den Tombstone); `src/modules/training/service/sessionService.ts` 808–810 (`discardSession` → `deletedFrom: 'in_progress'`); Regel K-03 in `docs/data-model.md` 7.2 und `docs/testing.md` 4.4 | Training am iPhone beendet; der Mac zeigt bis zum nächsten Abgleich noch „Training läuft“; „Verwerfen“ am Mac erzeugt eine jüngere Löschmarke, die beim Abgleich das abgeschlossene Training auf Server, Mac und iPhone ersetzt. Alle Sätze und die Übungshistorie sind weg; „Rückgängig“ stellt nur die veraltete laufende Kopie her. | `MergeDoc` um `deletedFrom` erweitern; in `decide` für `sessions` vor der LWW-Regel: lokale Löschmarke mit `deletedFrom === 'in_progress'` gegen entfernt abgeschlossen → `take`; entfernte Löschmarke mit `deletedFrom === 'in_progress'` gegen lokal abgeschlossen → `restamp`. Tests K-03 in `merge.test.ts` und `syncEngine.test.ts`. | **offen** · Behebung in dieser Phase |

## 5. P2 – Mittel

| ID | Befund | Datei / Komponente | Auswirkung | Lösung | Status |
|---|---|---|---|---|---|
| A-03 | D-234 („unbekannte Felder bleiben erhalten“) gilt nur für Wurzelfelder; Singletons verwerfen Felder neuerer Versionen, strikte Kindschemas machen Dokumente neuerer Versionen unlesbar | `src/shared/db/repository.ts` 48–82 (`validated`, `parseStored`); `src/modules/settings/data/settingsRepository.ts` 33–37; `profileRepository.ts` 33; `trainingStateRepository.ts` 35; `strictObject`-Kinder in `training/model/session.ts`, `program.ts`, `nutrition/model/recipe.ts`, `mealTemplate.ts`, `nutrition.ts`; `syncEngine.ts` 49, 109, 116 | Heute: Mac auf v8 speichert `settings.waterQuickMl`, das iPhone auf v7 ändert eine Einstellung → Schnellmengen gehen beim Abgleich verloren. Künftig bei jeder Schemaerweiterung an Kindern: Trainings und Rezepte des neueren Geräts sind auf dem älteren unsichtbar; ein neuer Aufzählungswert (z. B. `theme`) legt die ältere App lahm (`ThemeSync` → `RootErrorView`). | Singletons mit `{ ...SETTINGS_DEFAULTS, ...current, ...patch }` statt `parse(current)`; für gespeicherte Dokumente `looseObject`/`passthrough` in Kindern; mittelfristig `schema_version` je Dokument im Sync prüfen und bei höherer Version „App aktualisieren“ melden (verwandt mit A-01). | offen |
| A-04 | Konfliktkopie eines Programms kann das Namenslimit (80 Zeichen) verletzen; sie wird ohne Schemaprüfung gespeichert und gesendet und ist dann auf allen Geräten unsichtbar | `src/modules/sync/service/syncEngine.ts` 40–44 (`conflictName`: `base.slice(0, 70)` + „ (Konflikt …)“ = bis 92 Zeichen), 96–107 (`table.put(copy)` ohne Schema); `src/modules/training/model/program.ts` 186, 197; `programRepository.ts` 19–29 | Ab 59 Zeichen Programmname ist die Kopie ungültig: „1 Konfliktkopie angelegt“, aber nirgends sichtbar, nicht löschbar, trotzdem gesendet; die lokalen Änderungen sind praktisch verschwunden. | `base.slice(0, 50)` (50 + 22 ≤ 80) oder Limit je Tabelle; besser die Kopie mit dem Fachschema prüfen und bei Fehler den Namen kürzen. Test für den Grenzfall. | offen |
| A-05 | Pull-Cursor ohne Überlappung: Gleichzeitige Pushes zweier Geräte können eine Zeile dauerhaft überspringen (Sequenzlücke); das Server-SQL liegt nicht im Repository | `src/modules/sync/data/remote.ts` 211 (`rev=gt.<cursor>`); `syncEngine.ts` 126–130; `docs/data-model.md` 12; `docs/architecture.md` 11.2 (beschreibt 60 s Überlappung, nicht umgesetzt) | Postgres vergibt `rev` beim Aufruf, nicht beim Commit: Commitet T1 (rev 1001) nach T2 (rev 1002) und hat das andere Gerät 1002 schon gelesen, wird 1001 nie geholt. Stille Abweichung bis zur nächsten Änderung des Dokuments. Wahrscheinlichkeit gering. Nicht verifiziert, ob `push_documents` je Nutzer serialisiert. | In `push_documents` `pg_advisory_xact_lock(hashtext(auth.uid()::text))`; SQL von Tabelle, Funktionen, Index und RLS als Migrationsdatei ins Repository (`supabase/migrations/`), damit es prüfbar ist. | offen |
| A-06 | Snapshots lassen sich nirgends wiederherstellen; ein fehlgeschlagenes Schema-Upgrade endet im Wiederherstellungsbildschirm ohne Ausweg | `src/shared/db/snapshots.ts` 150–158 (`readSnapshot` nur in Tests genutzt); `src/modules/settings/ui/DataPage.tsx` 43–46, 150–176 (nur Liste); `src/app/RecoveryScreen.tsx` 25–57; `src/main.tsx` 35–49 | Acht Schemaversionen in drei Tagen; scheitert `db.open()` (Quota, Safari-Fehler), ist die App unbenutzbar, der Snapshot nur per Web-Inspector erreichbar, Import gibt es nicht. Bewusst zurückgestellt (AK-DAT-06/08, M4), Risiko trotzdem hoch. | (1) Im `RecoveryScreen` „Letzten Snapshot als Datei sichern“; (2) „Snapshot wiederherstellen“ (Hauptdatenbank löschen, Tabellen schreiben, `syncBase` und Cursor zurücksetzen); (3) AP 4.1/4.2 vorziehen. Siehe auch E-03. | offen |
| A-07 / E-02 | Dauerhafter Speicher wird nur angefordert, wenn ein Training läuft (AK-PWA-05 verlangt „nach dem ersten gespeicherten Datensatz“) | `src/shared/db/storage.ts` 21–32; einziger Aufrufer `src/modules/training/ui/SessionBanner.tsx` 41–48 | Wer wochenlang nur Ernährung, Wasser, Einkaufsliste, Gewicht oder Aufgaben nutzt, hat `navigator.storage.persist()` nie aufgerufen; der Browser darf die Daten bei Speicherdruck räumen (Chrome, Safari-Tab). | `requestPersistentStorage()` einmal je Lauf nach dem ersten erfolgreichen Dokumentschreiben (Basis-Repository) oder beim Start, wenn eine Dokumenttabelle nicht leer ist. Test für den Auslöser. | offen |
| A-08 | Kontowechsel: Nach Anmeldung mit einem anderen Konto werden alle lokalen Dokumente in das neue Konto hochgeladen und dessen Daten lokal eingemischt | `src/modules/sync/service/syncEngine.ts` 199–208 (`resetForUser`), 138–159 (Push ohne Basis); `syncService.ts` 33, 54 | Registrieren ist in der App möglich (D-273); ein Testkonto reicht: Alle Daten liegen danach in beiden Konten, die Daten des Testkontos sind lokal eingemischt; „Alle Daten löschen“ gibt es noch nicht. Bekannt und zurückgestellt (Q-20), Risiko real. | In `signIn`/`signUp` bei gesetztem anderem `sync.user` Rückfrage mit klarem Text oder Abbruch, bis „Alle Daten löschen“ existiert. | offen |
| B-02 | „Pausieren/Fortsetzen“ (AK-TRN-18) fehlt vollständig; die Dauer enthält jede Unterbrechung; Dokumente beschreiben die Funktion als vorhanden | `sessionService.ts` (keine Funktion befüllt `pauses`), `player/SessionPage.tsx` (kein Bedienelement); `docs/requirements.md` 128, `architecture.md` 141, `data-model.md` 3.1 und 9, `implementation-plan.md` 121/128, `testing.md` 69 (E-15) | Telefonat oder Weg zum Auto zählen zur Dauer; Zusammenfassung, Verlauf und Statistik „Minuten“ sind zu hoch. Zusammen mit B-01 wurde eine vergessene Einheit unbeendbar. Ehrlich vermerkt nur in `feature-inventory.md` (TS-13) und `testing.md` 320. | Entweder umsetzen (`pauseSession`/`resumeSession`, Knopf im Player-Kopf, Leiste „pausiert“; `sessionDurationSec` und `finishSession` sind vorbereitet) oder den Stand ehrlich machen (AK-TRN-18 als offen führen, Architektur-Tabelle und E-15 anpassen). | offen |
| B-03 | Programmfortschritt hängt an Positionen (`weekIndex`/`dayIndex`) statt an `dayId`; Umsortieren, Duplizieren oder Löschen von Tagen im Editor verfälscht den „nächsten Tag“ | `src/modules/training/calc/programProgress.ts` 19, 80, 96; `model/session.ts` 108 (`dayId` vorhanden, ungenutzt); `calc/programEdit.ts` 258–285 (`moveDay`, `duplicateDay`, `removeDay`) | Nach Verschieben von Tag B vor Tag A gilt die erledigte Einheit (A) als B; „Heute“ und „Training“ schlagen den falschen Tag vor, Zähler „Trainingstag x von n“ und „Erledigt“-Markierungen stimmen nicht; gelöschte Tage fallen stumm aus der Zählung. Nur eigene Programme. | Einheit zuerst über `s.program.dayId` auf `flattenDays(template)` abbilden, nur ohne Treffer auf die Position zurückfallen; fehlende Tage als Hinweis zurückgeben. Tests „Tag verschoben/dupliziert/gelöscht“. | offen |
| B-04 | Ein einziges ungültiges Session-Dokument legt die ganze App lahm (Fehleransicht auf jeder Seite, nur „Neu laden“) | `src/modules/training/data/sessionRepository.ts` 14–25 (`findActiveSession` parst streng); `useSession.ts` 20–23; `SessionBanner.tsx` 41; `src/app/banners/GlobalBanners.tsx` 100; `src/app/layout/AppLayout.tsx` 37; `src/app/routes.tsx` 24–30 (Fehlergrenze nur unter `AppLayout`) | Der Banner gehört zum Rahmen; ein `ZodError` dort landet in `RootErrorView`: Tab-Leiste, Seitenleiste und jede Seite sind weg, auch Export und Snapshots. Auslöser wäre ein verschärftes Schema bei laufender Einheit oder ein per Sync/Import eintreffendes Dokument einer anderen Version. | `findActiveSession` mit `safeParse` wie `listCompletedSessions` (ungültige Zeile übergehen und protokollieren); `SessionBanner` in eine eigene Fehlergrenze setzen. | offen |
| B-05 | „Übung ersetzen“ scheitert mit `ZodError`, wenn ein Arbeitssatz übersprungen wurde, dessen Drop-Satz noch offen ist | `sessionService.ts` 383–470 (`replaceExercise`, 426–435: Drop-Satz wandert ohne Elternsatz, `parentSetId` fehlt); `model/session.ts` 143–154 (Refinement) | Kein Datenverlust, aber die Aktion ist unmöglich: „Nicht gespeichert“, „Erneut versuchen“ scheitert gleich. Winter-Arc-Übungen mit Dropset-Stern sind betroffen. | In `moving` Drop-Sätze nur mitnehmen, wenn ihr Elternsatz mitwandert; zurückbleibende Drop-Sätze bei der alten Übung belassen. Alternativ `skipSet` eines Arbeitssatzes lässt offene Drop-Sätze mit überspringen. Test ergänzen. | offen |
| C-02 | Doppeltipp auf „Hinzufügen“ bzw. „Speichern“ erzeugt doppelte Einträge und doppelte Vorlagen (kein Sperrzustand) | `src/modules/nutrition/ui/AddFoodPage.tsx` 337–349, 362–365 (`LogDialog`), 484–520 (`QuickDialog`); `TemplateDialogs.tsx` 38–65 (`NameDialog`). Vorbild mit `busy`: `ApplyTemplateDialog`, `FoodFormPage`, `RecipeEditPage` | Tagessumme doppelt; beim Schnelleintrag ohne Namen zweimal „Schnelleintrag“; „Als Vorlage speichern“ legt je Tipp eine weitere Vorlage an. | `busy`-Zustand (Knopf `disabled`, frühes `return` in `submit`) in `LogDialog`, `QuickDialog`, `NameDialog`. | offen |
| C-03 | Scanner: „Schließen“ während „Suche …“ bricht die Abfrage nicht ab; ein spätes Ergebnis öffnet trotzdem den Eintragen-Dialog oder wechselt zum Formular | `src/modules/nutrition/ui/BarcodeFlow.tsx` 51–75 (kein Abbruch-Kennzeichen, `onFood`/`openForm` im `then`); `AddFoodPage.tsx` 261–273; `data/openFoodFacts.ts` 60–63 (`AbortController` nur für das 10-s-Limit). Verwandt (P3): `ScannerDialog.tsx` 38, 75–79, 135–149 (kein erneutes Scannen nach Treffer; Kamera läuft bei Ladefehler weiter) | Bis 10 s nach dem Schließen erscheint unvermittelt „Eintragen“ oder die App springt ins Formular „Neues Lebensmittel“. Keine Datenkorruption. | `cancelled`-Ref in `BarcodeFlow` (in `onClose`/Cleanup setzen) und Ergebnisse danach ignorieren; `AbortController` nach außen reichen und beim Unmount abbrechen. | offen |
| C-04 | Live-Abfragen laden die kompletten Lebensmitteldaten je Komponente und je Einhängen neu; Suchindex wird je Komponente neu gebaut; Wassertag lädt alle Einträge ab dem Tag | `src/modules/nutrition/data/catalogStore.ts` 122–142, 162, 192–212 (`useImportedCatalog`); `NutritionPage.tsx` 83–88; `useFoodCatalog.ts` 22–29; `foodSearch.ts` 28–37; `src/modules/water/data/waterRepository.ts` 13–17 (`aboveOrEqual(day)`) | „Ernährung“ → „Hinzufügen“ deserialisiert ≈ 0,6 MB zweimal und baut den Index; „Rezept bearbeiten“ → „Zutat“ noch einmal. Ein früherer Wassertag lädt alle Einträge seit diesem Tag. Keine Funktionsfehler; Dauer am Gerät nicht gemessen. | Geparste Katalogzeile und Index modulweit je `importedAt` zwischenspeichern; `brandCount` beim Speichern mitführen; Markenzuordnung nur bei Bedarf laden; `listWaterEntries` für einen Tag mit `equals(day)`. | offen |
| D-01 | Vergleich mit dem Zeitraum davor und Hinweis „verbessert“ sind für Aufgaben mit Wochentagen nie erreichbar | `src/modules/habits/calc/insights.ts` 160–179, 231–245 (`minComparableDue` relativ zur Zeitraumlänge), 340–343; `ui/TaskStats.tsx` 79–90; `ui/TaskDetailPage.tsx` 68–70, 108–118; `src/shared/i18n/de-task-stats.ts` 87 | Mo/Mi/Fr-Aufgabe hat in 30 Tagen höchstens 14 fällige Tage (< 15): `rateChange` bleibt `null`, Text sagt „zu wenig Daten“, obwohl alle Daten da sind; Sortierungen „Größte Verbesserung/Stärkster Rückgang“ fehlen; Hinweis `improving` entsteht nie. Genau die Aufgaben aus D-285 sind betroffen. | Schwelle relativ zu den geplanten fälligen Tagen des Zeitraums (`Math.max(3, Math.ceil(scheduledDue / 2))`); `compareNone` nach Grund unterscheiden; D-284 ergänzen. Test für Wochentags-Aufgaben. | offen |
| D-02 | Zugangs- und Erneuerungstoken des Dashboards (und `sync.auth`) landen in jedem Snapshot und überleben „Verbindung trennen“ | `src/shared/db/snapshots.ts` 100–108, 176 (kopiert alle Tabellen inkl. `meta`); `src/modules/steps/data/stepsState.ts` 189–202; `stepsService.ts` 200–215 (Logout-Fehler verschluckt); `snapshots.test.ts` 29 sichert das Gegenteil | D-277 sagt „‚Verbindung trennen‘ löscht sie“; ein langlebiger Refresh-Token bleibt in `fitness-snapshots`; ein späteres „Wiederherstellen“ (AK-DAT-06) würde ihn zurückholen. Daten verlassen das Gerät nicht, deshalb P2. | In `createSnapshot` die `meta`-Schlüssel `steps.*` und `sync.auth` auslassen (Liste in `meta.ts`), Test ergänzen; `disconnectDashboard` vor dem Logout bei Bedarf erneuern; Satz in `known-limitations.md` und D-277. | offen |
| E-01 | Update-Hinweis erscheint auch während einer laufenden Einheit (AK-PWA-03 nur zur Hälfte umgesetzt) | `src/app/banners/GlobalBanners.tsx` 43–64, 96–105 (`UpdateBanner` prüft nur `updateAvailable`); `src/app/layout/AppLayout.tsx` 37 (Banner auch im Vollbild); `docs/architecture.md` 178, 209; `requirements.md` 95; `known-limitations.md` 128 | Mitten im Satz schiebt sich die Leiste „Jetzt aktualisieren“ in den Player, die Seite verschiebt sich, Fehltipps sind möglich; ein Tipp lädt neu, eine gerade entprellte Eingabe (300 ms) kann verloren gehen. | In `UpdateBanner` `useActiveSession()` lesen und bei laufender Einheit `null` zurückgeben; der Hinweis erscheint nach dem Beenden automatisch. Test ergänzen. | offen |
| E-03 | Wiederherstellungsbildschirm ohne Ausweg; ein Snapshot-Fehler (z. B. voller Speicher) blockiert den Start | `src/app/RecoveryScreen.tsx` 13–27, 39–57 (`recoveryCause` kennt QuotaExceeded nicht → „Unbekannte Ursache“); `src/shared/db/runtime.ts` 28–31; `snapshots.ts` 126–139 (`add` vor dem Kürzen), 161–181 | Bei fast vollem iPhone bricht der Snapshot vor dem Upgrade ab, die App bleibt im Wiederherstellungsbildschirm; Daten intakt, aber unerreichbar; kein Export, keine Diagnose. Upgrades kommen regelmäßig vor. | In `createSnapshot` zuerst auf `keep − 1` kürzen, dann einfügen, bei `QuotaExceededError` einmal den ältesten löschen und wiederholen; `RecoveryScreen` mit Fehlername, „Fehlerprotokoll kopieren“ (`recentErrors()`) und „Daten exportieren“ über eine versionslose Dexie-Instanz. Siehe A-06. | offen |

## 6. P3 – Optional

| ID | Befund | Datei / Komponente | Auswirkung | Lösung | Status |
|---|---|---|---|---|---|
| A-09 | Uhrzustand kann durch den Abgleich hinter den gespeicherten Stand zurückfallen (zwei Tabs); keine Driftgrenze beim Empfang fremder Stempel | `syncEngine.ts` 56–58 (`persistClock` ohne vorheriges `observe`), 91, 101, 124; Gegenbeispiel `repository.ts` 40–46; `src/shared/lib/hlc.ts` 103–124 | Nur zusammen mit Stempeln aus der Zukunft: ein dritter Tab könnte kleinere Stempel vergeben, seine Änderung verliert; ein Gerät mit falscher Uhr zieht alle dauerhaft in die Zukunft (D-206 nimmt das in Kauf). | Zu Beginn jeder Pull-Transaktion `rt.clock.observe(meta.hlc)`; optional Warnung bei Stempeln > 1 h in der Zukunft. | offen |
| A-10 | Anmeldung: Supabase-Antwort „E-Mail nicht bestätigt“ wird als „E-Mail oder Passwort stimmt nicht“ gemeldet | `src/modules/sync/data/remote.ts` 126–127 (jede 400/401 → `InvalidCredentialsError`), `error_code` in 93, 191–193 nicht ausgewertet | Irreführende Meldung vor dem Klick auf den Bestätigungslink. Fehlercode (`email_not_confirmed`) nicht gegen die laufende Supabase-Version geprüft. | `error.code === 'email_not_confirmed'` → eigener Text. | offen |
| A-11 / E-11 | Abgleichfehler landen nicht im Fehlerprotokoll; im Status steht nur der Fehlername; Nicht-JSON-Antworten werden zu `SyntaxError` | `syncService.ts` 127–133 (`lastError: error.name`, kein `logError`); `remote.ts` 84–85 (`JSON.parse(text)` ungeschützt); Vorbild `steps/data/dashboardRemote.ts` 65–71 | Pausiertes Supabase-Projekt (HTML/5xx) oder RLS-Problem (403) sind später nicht vom nächsten Netzfehler zu unterscheiden; Anzeige „Der letzte Abgleich ist fehlgeschlagen“ bleibt vage. | Im `catch` `logError(rt.db, { area: 'sync', error })`; in `request()` `JSON.parse` absichern und bei `!response.ok` immer `SyncHttpError(status, …)` werfen. | offen |
| A-12 | Toter Code, ungenutzte Tabelle, unerreichbare Zweige, Dokumentationsdrift | Tabelle `sessionUi` (`schema.ts` 26, 135–138, 159, nirgends genutzt); ohne Verwendung außerhalb der Tests: `listDocs`, `getDocIncludingDeleted` (`repository.ts` 195–211), `recentErrors`, `listErrorLog` (`errorLog.ts` 60, 104), `readSnapshot`, `compareHlc`; unerreichbar `syncEngine.ts` 90 und 112; `architecture.md` 11.2 (Outbox, Mutations-ID, Basisrevision, 60 s Überlappung nicht umgesetzt), `data-model.md` 5 (`outbox`/`syncState` existieren nicht) | Wartbarkeit; Doku verspricht Mechanismen, die es nicht gibt. | Entfernen bzw. als M4-Vorbereitung kennzeichnen; `sessionUi` beim nächsten Schema-Schritt entfernen (Dexie-Version, Snapshot) oder als ungenutzt dokumentieren; Architektur-Doku an den Stand angleichen. | offen |
| A-13 | Gesundheitsprüfung und Hintergrund-Abgleich laufen bei Rückkehr in den Vordergrund gleichzeitig | `src/shared/db/health.ts` 16, 49–56, 82–89; `SyncRunner.tsx` 31–33, 45 | Schließt die Gesundheitsprüfung die Datenbank, bricht eine laufende Pull-Transaktion ab (Status „fehlgeschlagen“, nächster Anlass wiederholt; keine Korruption). Selten; D-216 bewusst so. | Hinweis, kein Fehler; ggf. Abgleich erst nach der Gesundheitsprüfung starten. | offen |
| B-06 | Verlauf bearbeiten: Dauer-Prüfung greift auch ohne Dauer-Änderung; das Formular schreibt bei jeder Änderung Beginn, Dauer und Ende gerundet neu | `src/modules/training/service/historyService.ts` 75–97; `ui/HistoryEditForm.tsx` 16–21, 35, 87–99 | Eine 30-s-Einheit lässt sich weder umbenennen noch kommentieren (`InvalidEditError('duration')`); wer nur eine Notiz ändert, verschiebt still Beginn (Sekunden weg) und Dauer (auf Minute gerundet); leeres Datum ergibt „Beginn … in der Zukunft“. | Nur Geändertes senden; Dauer nur bei `edit.durationSec !== undefined` prüfen; eigene Meldung für leeres Datum. | offen |
| B-07 | Start aus Programm: `planFromTemplateDay` läuft im Klick-Handler außerhalb jeder Fehlerbehandlung; bei fehlender Übung passiert stumm nichts | `ui/ActiveProgramCard.tsx` 69–78; `ui/SampleTemplatePage.tsx` 141–150; `ui/useStartSession.ts` 13–28; `sessionService.ts` 266 | Schaltfläche wirkt tot, keine Meldung, kein Protokolleintrag. Auslöser selten (übergangenes ungültiges Dokument einer eigenen Übung). | Aufruf in `start()` verlagern oder im Handler fangen und `t.training.startFailed` zeigen; fehlende Übungen im Programm-Detail markieren. | offen |
| B-08 | „Rückgängig“-Toasts hängen am `location.state` und können lange nach den 10 Sekunden wieder erscheinen | `ui/TrainingPage.tsx` 62–63, 124–149; `ui/HistoryPage.tsx` 24–25, 28–54; `sessionService.ts` 814–820 | Über die Browser-Historie (Mac/Desktop) erscheint der Toast erneut; `restoreSession` macht eine alte Einheit wieder „laufend“ (mit altem `startedAt`, siehe B-01). | State nach dem ersten Anzeigen löschen (`navigate(pathname, { replace: true, state: null })`) oder Zeitstempel im State und Toast nur innerhalb von 10 s. | offen |
| B-09 | Wiederholungen mit Nachkomma („8,5“) werden still auf 9 gerundet statt mit Hinweis abgelehnt (AK-TRN-04) | `calc/fields.ts` 55–58 (`toStored` rundet); `calc/session.ts` 41–46 (`checkValue 'whole'` unerreichbar); `ui/player/ValueInput.tsx` 49–60 | Stille Rundung statt Hinweis. | In `ValueInput`/`toStored` bei `decimals: false` nicht-ganzzahlige Eingaben als `'invalid'` melden. | offen |
| B-10 | Tabelle `sessionUi` ist angelegt und dokumentiert, wird aber nirgends genutzt (siehe A-12) | `src/shared/db/schema.ts` 26, 135–138, 159; `docs/data-model.md` 139, 278, 319, 334 | Der versprochene UI-Zustand (fokussierte Übung, Scrollposition) wird nicht gespeichert; der hervorgehobene Satz wird aus `completedAt` abgeleitet, was funktioniert. | Doku anpassen oder Tabelle beim nächsten Schema-Schritt entfernen. | offen |
| B-11 | Nachgetragene Krafttrainings lassen sich keinem Programmtag zuordnen; der Programmfortschritt bleibt stehen | `service/logService.ts` 89–143 (kein `program`-Feld); `ui/LogPage.tsx`; `calc/programProgress.ts` 92 | Ohne Handy trainierter Programmtag wird nachgetragen, „Heute“ schlägt weiter denselben Tag vor; „anderen Tag wählen“ zählt später als neuer Durchlauf. D-255 erwähnt die Einschränkung nicht. | Im Nachtragen-Formular optional „Programmtag“ wählen und `program`-Snapshot wie `planFromTemplateDay` schreiben. | offen |
| B-12 | Erfassungsart einer eigenen Übung ändern hinterlässt unpassende Ziele in Plänen | `src/modules/exercises/service/exerciseService.ts` 92–103; `training/calc/programEdit.ts` 358–396 (`adaptSet` nur beim Ersetzen); `sessionService.ts` 253–279; `calc/format.ts` 97–115 | „Plank“ von `reps` auf `time` umgestellt: geplante Sätze behalten `repsMin/Max`, der Player zeigt „Ziel 8–12“ bei Zeitfeldern. | Bei Änderung der Erfassungsart Pläne mit `adaptSet` nachziehen oder Hinweis im Editor. Siehe auch D-14. | offen |
| B-13 | Tombstones in Programmdokumenten wachsen unbegrenzt und zählen gegen die harten Schemagrenzen `max(1000)` | `calc/programTree.ts` 105–137 (`mergeLevel`); `model/program.ts` 227, 234, 239, 253; `data/programRepository.ts` 19–28 | Erst nach rund 1.000 Entfernungen je Ebene: Programm nicht mehr speicherbar und aus „Meine Programme“ verschwunden, ohne Meldung. | Grenzen auf lebende Elemente beziehen (Refinement) oder Tombstones nach dem Abgleich verdichten. | offen |
| B-14 | Player rendert während der Pause viermal pro Sekunde die komplette Übungsliste neu | `ui/player/SessionPage.tsx` 113–127 (`useNow`), 204; `SetRow`/`ValueInput` ohne Memoisierung | Bei bis zu 40 Satzzeilen 4 Re-Renders/s während jeder Pause; auf älteren iPhones möglicherweise spürbar, nicht gemessen. | `now` in die Timer-Komponenten verlagern oder `SetRow` memoisieren. Erst am Gerät messen. | offen |
| C-05 | Zielvorschlag kann über 600 g Kohlenhydrate liegen und lässt sich dann nicht übernehmen | `src/modules/nutrition/calc/targets.ts` 46–48; `model/nutrition.ts` 127–130 (`TARGET_LIMITS.grams.max = 600`); `nutritionService.ts` 302–304; `ui/TargetsPage.tsx` 95–97 | Beispiel 4.800 kcal → 606 g Kohlenhydrate: „Vorschlag übernehmen“ scheitert mit einer Meldung, die zum Vorschlag der App nicht passt. Selten. | Kohlenhydrate im Vorschlag auf 600 kappen (mit Hinweis) oder Grenze anheben. | offen |
| C-06 | Open Food Facts: Feld `nutrition_data_per` angefragt, aber ungenutzt; keine clientseitige Drosselung; jeder Fehler heißt „nicht erreichbar (kein Netz?)“ | `calc/openFoodFacts.ts` 18–29, 41; `service/barcodeService.ts` 27–64; `data/openFoodFacts.ts` 53–81 (429 → `OffUnavailableError`); `BarcodeFlow.tsx` 70–73; `docs/data-sources.md` 3.2 | HTTP 429 und lokale Fehler erscheinen als „kein Netz?“; die in `data-sources.md` zugesagte Drosselung (10/min) ist nicht umgesetzt. | Feld entfernen; eigener Text bei 429; `data-sources.md` angleichen oder einfache Drossel. | offen |
| C-07 | `mealSlotAt`: 0 bis 3:59 Uhr ergibt „Snacks“, D-275 sagt „bis 10:59 Frühstück“ | `calc/mealSlot.ts` 4, 8; `mealSlot.test.ts` 14 (gewollt) | Code und Entscheidung widersprechen sich im Text; Verhalten ist gewollt. | D-275 um „ab 4 Uhr“ ergänzen. | offen |
| C-08 | Tagesziele: Erfolgsmeldung geht durch Neu-Einhängen des Formulars verloren (nicht im Browser verifiziert) | `ui/TargetsPage.tsx` 44–50 (`key={current?.id}`), 89–94 | „Ziel gespeichert“ erscheint höchstens kurz; die Karte zeigt den neuen Wert. | `message` in `TargetsPage` halten oder `key` weglassen und Felder per Effekt setzen. | offen |
| C-09 | Nach „Selbst anlegen“ aus dem Scanner wird das neue Lebensmittel nicht eingetragen | `BarcodeFlow.tsx` 45–49; `AddFoodPage.tsx` 263; `FoodFormPage.tsx` 151 | Der Nutzer steht wieder auf „Lebensmittel hinzufügen“ und muss das eben angelegte Produkt per Suche finden. D-266 verspricht das Eintragen nicht. | Nach dem Anlegen mit `?lebensmittel=<id>` zurückkehren und `LogDialog` öffnen. | offen |
| C-10 | Wasser: Tagesaufgabe bleibt abgehakt, wenn Einträge gelöscht werden und das Ziel wieder unterschritten ist | `src/modules/water/service/waterService.ts` 51–59, 98–100; `habits/service/habitService.ts` 199–216 | Versehentliche 750 ml eingetragen und wieder entfernt: Aufgabe bleibt erledigt. D-289 regelt das Zurücknehmen nicht. | Entscheidung nötig: bei Unterschreiten nur automatisch gesetzte Logs zurücknehmen (braucht Kennzeichen am Log). | offen |
| C-11 | Tote Exporte und Reste | `service/catalogService.ts` 19–21 (`prepareCatalog`), 60–66 (`commitCatalog`); `nutritionService.ts` 349–351 (`localDayKey`); `shopping/service/shoppingService.ts` 65–67 (`addParsed`), 145–147 (`openCount`); `'bls'` in `FOOD_SOURCES` (`nutrition.ts` 44) und `AddFoodPage.tsx` 104 (unerreichbarer Vergleich) | Wartbarkeit. | Entfernen bzw. als absichtlich kommentieren; `sourceBadge.bls` bleibt für alte Einträge nötig. | offen |
| C-12 | Einkaufsliste: Mengen-Erkennung liest „1.000 g Mehl“ als 1 g; Kategorie-Reihenfolge ordnet „Apfelsaft“ als Obst ein | `src/modules/shopping/calc/entry.ts` 39, 46–48 (`NUMBER`), 92–139, 282–290 (`CATEGORY_WORDS`, Wortanfang) | Falsche Menge bzw. Kategorie; beides ist änderbar, D-287 verlangt nur „klare Wörter“. | Punkt plus genau drei Ziffern als Tausendertrennzeichen lesen (oder nicht erkennen); Getränke-Endungen („-saft“) vor Obst prüfen. Test für Tausenderpunkt. | offen |
| C-13 | `FoodFormPage.readDraft` prüft vom Verlaufszustand nur `barcode` | `ui/FoodFormPage.tsx` 43–50, 106, 110–114 | Ein manipulierter Verlaufseintrag würde die Seite zum Absturz bringen; Zustand kommt nur aus der eigenen App, geringes Risiko. | `Array.isArray(draft.servings)` und `per100` prüfen. | offen |
| D-03 | Verlauf beschriftet Tage und Wochen ohne fällige Aufgabe als „kein Eintrag“ | `habits/calc/insights.ts` 67–78, 259–284 (`noData` Startwert `true`); `ui/ProgressChart.tsx` 247–260; `de-task-stats.ts` 30–34 (`chartDay` „nichts fällig“ unerreichbar) | Tooltip und Screenreader-Liste sagen „kein Eintrag“, das Raster „nicht fällig“; Zahlen bleiben richtig. | In `progressBuckets` `dueDays` und `noDataDays` zählen, `noData = dueDays > 0 && noDataDays === dueDays`. | offen |
| D-04 | Auswahl „Trainings pro Woche“ zeigt immer „3“, nicht das aktuelle Wochenziel | `src/modules/goals/ui/GoalsPanel.tsx` 28, 38, 123–139 | Wochenziel 5, Feld zeigt 3; ein Tipp auf „Ändern“ setzt das Ziel auf 3 und beendet das alte. | Auswahl aus dem aktiven Ziel vorbelegen; „Ändern“ bei unverändertem Wert deaktivieren. | offen |
| D-05 | Abhaken auf „Heute“ und Löschen eines Gewichts scheitern ohne Rückmeldung | `habits/ui/TasksCard.tsx` 97–101; `body/ui/BodyWeightPage.tsx` 76–86; Vorbild `TasksPage.tsx` 84–89 | Haken springt zurück, kein Text, kein Toast (z. B. nach iOS-Verbindungsverlust der IndexedDB). | Meldung (`role="alert"` oder Toast) wie auf der Verwaltungsseite. | offen |
| D-06 | Hinweise erscheinen nur für Aufgaben, die heute fällig sind | `habits/calc/insights.ts` 331–333 (`activeOn(habits, today)`) | Mo/Mi/Fr-Aufgabe bekommt „oft ausgelassen“ nur an Mo, Mi, Fr; D-284 schließt nur gelöschte und pausierte aus. | `habits.filter((h) => h.toDayKey === undefined)`. | offen |
| D-07 | „Mit Training abhaken“ hängt am Endzeitpunkt und nur an heute; nachgetragene oder gelöschte Trainings werden nicht berücksichtigt | `habits/ui/TasksCard.tsx` 26–43; Vergleich `goals/calc/goals.ts` 69 (`dayKey`) | Für gestern nachgetragenes Training hakt nie ab; Training 23:30–00:15 zählt hier für den Folgetag, im Wochenziel für den Starttag; gelöschtes Training lässt den Haken stehen. D-285 verspricht nur „Heute“. | `session.dayKey` verwenden; `applyAutoDone` beim Abschließen und Nachtragen für den Tag der Einheit; optional `doneBy: 'auto'` am Log. | offen |
| D-08 | Screenreader hört in der Liste „Je Aufgabe“ nur „…: Auswertung öffnen“ | `habits/ui/TaskStats.tsx` 180–184 (`aria-label` ersetzt den Namen) | Quote, „an x von y fälligen Tagen“ und Serie werden nicht vorgelesen. | `aria-label` entfernen oder Zahlen per `aria-describedby`. | offen |
| D-09 | Toter Code und ungenutzte Texte in der Startansicht | `habits/calc/streak.ts` 69–110 (`streak`, `recentDays`, `pickDaily`); `habitService.ts` 130–137 (`deleteHabit`, `restoreHabit`); `de.ts` 145–160 (`motivation.sentences`); `settings/model/settings.ts` 22 (`backupReminderDays` ungelesen); `SettingsPage.tsx` 143–145 (Ternär mit gleichen Zweigen); doppelte `PERIOD_LENGTH`/`dateOf`/`statusOf` in `TaskStats.tsx`, `TaskDetailPage.tsx`, `TaskMatrix.tsx`, `ProgressChart.tsx` | Wartbarkeit; `de.ts` liegt im Startbündel (249,4 von 250 KB). | Entfernen bzw. nach `calc/insights.ts` ziehen; `pnpm check:bundle` danach. Siehe E-09. | offen |
| D-10 | „Heute“ rendert jede Sekunde die ganze Seite neu | `dashboard/ui/TodayPage.tsx` 42, 49, 55, 65–72 (`useToday(1000)` im Seitenbaustein, `Intl.DateTimeFormat` je Render) | Alle Karten rendern sekündlich mit; unnötige Last am iPhone, funktional unschädlich. | Uhr in eigenen Baustein mit `useToday(1000)`; `weightChange` mit `today` (60 s); `clock` in `useMemo`. | offen |
| D-11 | Verwaltungsseite lädt bei jedem Öffnen alle Einträge aller Zeiten | `habits/ui/useHabitHistory.ts` 65; `data/habitRepository.ts` 153–162; `ui/TasksPage.tsx` 83, 403 | Nach einem Jahr mit zehn Aufgaben rund 3.600 Dokumente je Öffnen und je Änderung. | Für 7/30/90 Tage nur ab `today − 2·Zeitraum` laden; „Gesamt“ und Serien bei Bedarf. | offen |
| D-12 | Schritte-Karte: fehlender Ladezustand, falscher Fehlertext, Neuanmeldung nur über „Trennen“, Token-Erneuerung ohne Sperre | `steps/ui/StepsTodayCard.tsx` 213–229, 249–265, 277–306; `ui/StepsPage.tsx` 129–180; `service/stepsService.ts` 217–228 | Beim ersten Abholen nur der Titel; HTTP 500 heißt „Keine Verbindung“; nach „abgelaufen“ führt der Weg über Trennen und neu anmelden; zwei gleichzeitige Erneuerungen möglich (selten). | Ladetext; `'failed'` auf `t.steps.failed`; Anmeldeformular bei `auth`; laufendes Promise in `refreshSteps` wiederverwenden. | offen |
| D-13 | Karte „Körpergewicht“ auf „Heute“ zeigt beim Laden den Leerzustand; Mini-Verlauf ab zwei statt drei Einträgen | `dashboard/ui/TodayPage.tsx` 46, 54, 212–262 (`weightNone` während `weights === undefined`; `sparkValues.length >= 2`); AK-DSH-06 und `ProgressPage.tsx` 165 (`>= 3`) | Kurzes Umspringen von „Noch kein Gewicht erfasst“ auf den Wert; Schwelle widerspricht AK-DSH-06. | Skeleton bei `undefined`; Schwelle vereinheitlichen und AK oder Code angleichen. | offen |
| D-14 | Bestleistungen und Übungsverlauf mischen Erfassungsarten, wenn die Erfassungsart einer eigenen Übung geändert wurde | `progress/calc/stats.ts` 77–99, 129–154; `ui/ExerciseProgressPage.tsx` 300–312; `exercises/ui/CustomExerciseDialog.tsx` 57, 72 | kg und Wiederholungen in einer Kurve; Bestleistung hängt von der Zeilenreihenfolge ab. Nicht ausgeführt. | Nur Zeilen mit der aktuellen `trackingMode` werten oder die Änderung bei vorhandenem Verlauf sperren. Siehe B-12. | offen |
| D-15 | Bearbeiten-Formular: Fehlertext steht oben, letzter Wochentag lässt sich stumm nicht abwählen | `habits/ui/TasksPage.tsx` 158–162, 175–178, 229–233 | Fehler erscheint beim Feld „+“ statt beim bearbeiteten Eintrag und wird nie zurückgesetzt; kein Hinweis „mindestens einer“. | Fehler im Formular der Zeile rendern und leeren; letzten Wochentag `aria-disabled` oder Hinweis. | offen |
| D-16 | Tagwechsel bei geöffneter App: bis zu 60 s schreibt „Heute“ auf den Vortag | `src/shared/ui/useToday.ts` 97–114; `habits/ui/useTodayTasks.ts` 25–26; `TasksCard.tsx` 98 | Haken um 00:00:30 geht auf den Vortag; nicht korrigierbar (kein Datum am Haken). Randfall. | Tag in `onChange` frisch bestimmen oder `useToday` zur nächsten Mitternacht wecken. | offen |
| D-17 | Zod-Grenze der Standardpause weiter als AK-SET-02 | `settings/model/settings.ts` 15 (`max(3600)`), AK-SET-02 „0 bis 600 s“, `SettingsPage.tsx` 78 | Nur über Import/Sync erreichbar. | AK oder Schema angleichen. | offen |
| D-18 | Ungültig gespeicherte Einstellungen (z. B. neuer Enum-Wert aus einer neueren Version) lassen die Einstellungsseite dauerhaft im Skeleton (nicht verifiziert) | `settings/data/settingsRepository.ts` 81–95; `repository.ts` 71–73, 185–193; `SettingsPage.tsx` 89; `formatting.ts` 13 | `useSettings()` bleibt `undefined`, `useFormatters` fällt still auf „auto“ zurück. Verwandt mit A-03. | `safeParse` je Feld mit Rückfall auf `SETTINGS_DEFAULTS` in `loadSettings`. | offen |
| D-19 | „Nach oben/unten“ ohne Wirkung bei gleicher Position (zwei Geräte) | `habits/service/habitService.ts` 40–45, 53–63 | Zwei Geräte legen vor dem Abgleich je eine Aufgabe an → gleiche `position`; `moveHabit` tauscht nur Werte, der Pfeil wirkt tot. | In `moveHabit` die aktive Liste neu durchnummerieren. | offen |
| E-04 | Nachgeladene Seite nach einem Deployment ohne Service-Worker-Kontrolle: nur generische Fehleransicht | `src/app/errors/ErrorViews.tsx` 18–33, 46–50; `src/shared/pwa/register.ts` 11–30 | Scheitert ein `lazy`-Import (nur ohne SW-Kontrolle und gleichzeitigem Deployment), erscheint „Diese Ansicht hat einen Fehler“ mit „Neu laden“. Selten. | Fehlertyp erkennen und einmal je Sitzung automatisch neu laden (`sessionStorage`-Marke), sonst Hinweis „neue Version – neu laden“. | offen |
| E-05 | Service Worker ohne `clientsClaim`: der allererste Besuch bleibt bis zum Neuladen unkontrolliert | `dist/sw.js`; `vite.config.ts` 82–87; `e2e/pwa.spec.ts` 55–62 | Neues Gerät, Link im Safari-Tab, ohne Neuladen in den Flugmodus: noch nicht besuchte Seite zeigt die Fehleransicht (E-04). Installierte App nicht betroffen. | `workbox: { clientsClaim: true }`. | offen |
| E-06 | Toter PWA-Zustand und veraltete Doku dazu | `src/shared/pwa/state.ts` 8–23 (`supported`, `offlineReady`, `registered` ungenutzt); `docs/known-limitations.md` 127 (Hinweis, der mit D-265 entfiel) | Kein Fehler; Doku und Code stimmen nicht überein. | Felder entfernen oder in „Über die App“ anzeigen; `known-limitations.md` anpassen. | offen |
| E-07 | Seitenmodule hängen statisch im Start-Bündel, weil Hilfsfunktionen aus Seitendateien exportiert werden | `src/modules/exercises/index.ts` 25 (`describeExercise` aus `ExerciseLibraryPage`); `training/ui/ActiveProgramCard.tsx` 8, `programs/ProgramEditPage.tsx` 21, `programs/DayEditPage.tsx` 36 (`describeDay`), `programs/OwnProgramPage.tsx` 11 (`ProgramDetail` aus `SampleTemplatePage`) | `ExerciseLibraryPage`, `ProgramsPage`, `SampleTemplatePage` werden bei jedem Start geladen; Startansicht bei 249,4 von 250 KB. | `describeExercise`, `describeDay`, `ProgramDetail` in eigene Dateien ohne Seitenlogik verschieben. | offen |
| E-08 | Bündelprüfung zählt die immer geladenen Karten von „Heute“ nicht | `tools/check-bundle-size.mjs` 12–22 (nur `chunk.imports`); `TasksCard`, `WaterCard`, `StepsTodayCard` (≈ 3–4 KB gzip) | Die Messung „Startansicht“ unterschätzt den echten Download. | `dynamicImports` der `TodayPage` gezielt mitzählen und die Grenze ehrlich neu setzen. | offen |
| E-09 | Ungenutzte Texte im Startkatalog `de.ts` | `src/shared/i18n/de.ts` 145–161 (`motivation.sentences`), 204, 280, 315, 333, 1202, 1224 | Toter Text im Startbündel. | Einträge entfernen (vorher `pnpm typecheck`); Prüfskript als `check:docs`-Schritt. Siehe D-09. | offen |
| E-10 | Navigation: `aria-current` fehlt bei Bereichs-Treffern | `src/app/layout/nav.ts` 31–36; `Sidebar.tsx` 28–42; `TabBar.tsx` 97 | Unter `/uebungen` hören Screenreader keinen aktuellen Bereich. | Eigenes `aria-current` für Bereichs-Treffer. | offen |
| E-12 | E2E- und CI-Konfiguration begünstigt die bekannten wackeligen Tests | `playwright.config.ts` 33–37 (`fullyParallel`, `retries: CI ? 1 : 0`, kein `expect.timeout`, keine `workers`-Grenze); `e2e/network-a11y.spec.ts` 4–29; `e2e/fixtures.ts` 45–74 (`/training/verlauf` fehlt in `APP_PAGES`); `.github/workflows/ci.yml` 37–63 | Wiederholung versteckt wackelige Läufe; Verlauf wird weder offline noch per axe geprüft; dynamische Seiten nicht in der axe-Runde. | In CI `expect: { timeout: 10_000 }`, `workers: 2`; „eigene Adresse“ je Seite aufteilen; `/training/verlauf` in `APP_PAGES`; axe im `player.spec.ts`; `timeout-minutes`; Browser-Cache. | offen |
| E-13 | Abdeckungsgrenzen lassen die Shell aus | `vitest.config.ts` 24–30 (keine Schwelle für `src/app/**`, `src/shared/ui/**`, `src/shared/pwa/**`) | `register.ts`, `tabLens.ts`, `tabMinimize.ts` nur per E2E abgedeckt. | Schwelle ergänzen oder bewusst dokumentieren. | offen |
| E-14 | `style-src 'unsafe-inline'` mit veralteter Begründung (Härtung, nicht verifiziert) | `vercel.json` 14; `docs/architecture.md` 218 (Radix ist nicht installiert) | Vermutlich verzichtbar; React setzt Styles über das CSSOM. | Probeweise entfernen, `pnpm build && pnpm test:e2e`, Begründung anpassen. | offen |
| E-15 | Linse der Tab-Leiste speichert Geometrie dauerhaft (nicht verifiziert) | `src/app/layout/tabLens.ts` 409–425, 487–490; `tabMinimize.ts` 53–62 | Tipp während des Zurückwachsens misst Zwischenbreiten und behält sie bis zum nächsten `resize`; nur optische Folge. | `geo` nach Ende der Minimier-Animation verwerfen. | offen |

---

## 7. Geprüft und in Ordnung

Diese Punkte wurden gezielt geprüft und sind korrekt oder bewusst so entschieden (mit Verweis auf die Entscheidung):

**Datenbank und Sync (A)**
- HLC-Monotonie über Neustart und Tabs: `nextStamp` liest, übernimmt und schreibt den Uhrzustand in derselben Transaktion wie das Dokument; alle Fachdienste stempeln nur über das Repository.
- `versionchange`: eigener Handler setzt „replaced“, Banner mit „Neu laden“; älterer Tab bei neuerer Datenbank → `RecoveryScreen` bzw. kontrollierter Neustart mit Schleifenschutz (D-216).
- Snapshot vor jedem Schema-Upgrade, gzip-komprimiert; Migrationstests v1…v7 → v8 ohne Verlust (D-217, AK-DAT-07).
- Export enthält alle 16 Dokumenttabellen inklusive `shoppingItems` und `waterLog`, Tombstones eingeschlossen; `meta` (Tokens), `syncBase`, `sessionUi`, `exerciseHistory`, `errorLog` bewusst nicht.
- Löschmarkierung mit `deletedFrom`, Wiederherstellung räumt beides; Fehlerprotokoll ohne Nutzdaten (Ringpuffer 500); `logError` wirft nie.
- Sync-Ablauf D-269: erst Pull, dann Push; Basis nur bei unverändertem Dokument; `navigator.locks` gegen parallele Abgleiche; Token-Erneuerung 60 s vor Ablauf und einmal nach 401; CSP `connect-src` nur auf die drei erlaubten Hosts. LWW ganzer Dokumente ist dokumentiert (D-269, `known-limitations.md` 7); A-02 ist der ausdrücklich ausgenommene Sonderfall.
- Anmeldung: Passwort nur im Request-Body, Tokens nur in `meta`, Rücksprung aus der Bestätigungsmail entfernt `access_token` sofort aus der Adresse.

**Training (B)**
- Höchstens eine laufende Einheit je Gerät (Prüfung in der Transaktion); Wiederherstellung nach Neuladen/Hintergrund aus dem Dokument (`restTimer.endsAt`, `setTimer.startedAt`, `completedAt`); `dayKey` und `tz` beim Start eingefroren.
- Entprellung 300 ms, sofort bei Blur, `visibilitychange: hidden`, `pagehide` und Aushängen; Pausentimer aus `Date.now()`, Ton nur im 1-s-Fenster und sichtbar (D-247/D-215); Drop-Sätze und Pause (D-244); Wake Lock (AK-TRN-13).
- Projektion `exerciseHistory` in derselben Transaktion bei Beenden, Nachtragen, Bearbeiten, Löschen, Sync; Volumen/Bester Satz/1RM nur `weight_reps`, Epley 1–10 (D-224, D-241).
- Zod-Grenzen (0–500 kg, 0–200 Wdh., 0–86.400 s, Distanz ≤ 1.000 km, Titel ≤ 200, Notizen 2.000/5.000); Übungen mit deterministischen IDs (D-240), eigene Übungen nur archivierbar (D-258); Editor liest das Dokument in der Transaktion (kein Lost Update); Status monoton; Verwerfen/Löschen weich mit Rückgängig.

**Ernährung, Einkaufsliste, Wasser (C)**
- Rechenlogik (`scaleNutrients`, `sumEntries`, `recipeTotals`, `toRecipeItem`) entspricht `data-model.md` 9 und D-261/D-267; Zielvorschlag exakt nach D-262; Makro-Ring mit vollständigem Label.
- Eingefrorene Werte (D-209): Einträge, Zutaten und Vorlagenposten tragen Snapshots; Lebensmittel nur archivierbar.
- Tagesschlüssel über `Intl` je Zeitzone; `useToday` minütlich und bei Rückkehr; „Nächster Tag“ in der Zukunft gesperrt.
- Open Food Facts nur mit Einwilligung (D-266, D-302), nur Barcode und feste Feldliste, `credentials: 'omit'`, `no-referrer`, 10 s Limit, Zod-Prüfung der Antwort; Barcode-Formate EAN-8/UPC-A/EAN-13/GTIN-14 mit Prüfziffer; Kamera-Lebenszyklus sauber; WASM-Polyfill aus dem eigenen Paket (D-305).
- Import der Lebensmitteldaten (D-263, D-271): Größe, JSON, Zeilen-Zod, Vorschau, stabile IDs, eigene Datenbank außerhalb Export/Snapshot/Sync.
- Einkaufsliste (D-287) und Wasser (D-289) wie entschieden; Wasser-Bearbeiten und Zieleingabe nutzen `String(...)` bzw. `replace(/\./g, '')` und sind von C-01 nicht betroffen.
- Zod-Grenzen passen zu realen Eingaben (Eintrag ≤ 10.000 g, Nährwert ≤ 100.000, Portion ≤ 5.000 g, Rezept 1–50 Portionen und 1–40 Zutaten, Wasser ≤ 5.000 ml, Ziel 250–8.000); einzige Enge C-05.

**Tagesaufgaben, Ziele, Körper, Fortschritt, Heute, Einstellungen, Schritte (D)**
- Gültigkeit je Tag (`activeOn`), Pausen, Löschen mit `removedAt`, Rückgängig (D-283); ein Eintrag je Aufgabe und Tag über stabile ID (D-253); Wochentage ab Tag der Änderung (D-285); automatisches Abhaken nur ohne Eintrag (D-285, D-289).
- Statistik nach D-284 (Quote ohne heute und ohne Tage ohne Eintrag, Serie, Hinweise ab 14 fälligen Tagen, Kalender 90 Tage).
- Ziele datiert mit `effectiveFrom`/`endedAt`, gleicher Wert ändert nichts, Rundung in `normalize` und Schema (D-254); Körpergewicht 20–400 kg, „Bitte prüfen“ > 3 kg in 3 Tagen, Trend ab drei Einträgen, Löschen weich.
- Fortschritt: 1RM nur 1–10 Wiederholungen, Linie ab drei Punkten, Kalorien nur mit Körpergewicht (D-251/D-252); keine erfundenen Werte.
- „Heute“: Begrüßung über `hourIn` (Fehler vom 20.10. behoben), Reihenfolge der Karten wie D-289/D-283/D-277.
- Einstellungen: Standardwerte wie `data-model.md` 3.7, `applyTheme` mit `theme-color` (D-281), Formatierung mit Dezimalkomma (D-212, D-233); Schritte nur lesend gegen das eigene Dashboard, Passwort nie gespeichert, Export ohne `meta` (D-277).

**Shell, PWA, Sicherheit, Tests (E)**
- CSP passt zum Code (`connect-src` genau drei Hosts, `wasm-unsafe-eval` für zxing, `frame-ancestors 'none'`, `object-src 'none'`); keine Inline-Skripte; keine Secrets im Client (nur öffentliche Schlüssel mit RLS-Begründung); kein `dangerouslySetInnerHTML`/`innerHTML`/`eval`; `videoUrl` nur `https:`; `rel="noopener noreferrer"`.
- `pnpm audit --prod` ohne Befund; alle Laufzeitpakete in D-203/D-266 benannt.
- Header: `Referrer-Policy: no-referrer`, `X-Content-Type-Options`, `Permissions-Policy camera=(self)`, `X-Robots-Tag`.
- PWA: Vorab-Cache vollständig (keine Datei über 2 MiB), Update-Fluss prompt-Modus korrekt (Gerätetest T-IPH-M0), Update-Suche beim Start, stündlich, manuell; Manifest und Icons geprüft (E2E); Offline-Start aller `APP_PAGES` (Chromium).
- Routing: `/` → `/heute`, 404-Seite, Fehlergrenzen je Ansicht und für den Rahmen; Vollbild-Player; Zeit- und Format-Helfer inklusive Sommerzeit und Jahreswechsel korrekt (temporär zusätzlich geprüft).
- Barrierefreiheit: native Dialoge mit `aria-labelledby` und Escape, Skip-Link, `role="switch"`, Radiogruppen, `role="status"`/`"alert"`, reduzierte Bewegung beachtet.
- CI: Node 24, `permissions: contents: read`, E2E-Matrix Chromium/WebKit; ESLint erzwingt Modulgrenzen (D-232); `tsconfig` strict mit `noUncheckedIndexedAccess`.

---

## 8. Bestandsliste der Features (Regressionsliste)

Quelle der Funktionsmatrix ist `docs/feature-inventory.md` (Status „Implementiert“ oder „Getestet“). Diese Liste ist nach jeder größeren Änderung gegen die Unit-, Komponenten- und E2E-Tests zu halten; die Nachweise stehen in `docs/testing.md`.

### 8.1 Funktionsmatrix (89 Zeilen)

| ID | Funktion | Status (Matrix) |
|---|---|---|
| ON-01 | Nutzung ohne Konto; lokales Profil mit optionalem Anzeigenamen | Implementiert |
| ON-07 | Wochenziel „Trainings pro Woche“ | Implementiert |
| ON-11 | Profil bearbeiten | Implementiert |
| ON-18 | Zielgewicht festlegen | Implementiert |
| TP-01 | Programme und Vorlagen | Implementiert |
| TP-02 | Programmdetailseite | Implementiert |
| TP-03 | Programmstruktur aus Wochen und Trainingstagen | Implementiert |
| TP-04 | Übungsreihenfolge im Plan festlegen | Implementiert |
| TP-06 | Übungsbibliothek mit Suche und Filtern | Getestet |
| TP-07 | Übungsdetail mit Beschreibung, Muskeln, Gerät, Videolink | Implementiert |
| TP-08 | Satzschema (Typ, Wiederholungsbereich, Zielgewicht, Zielzeit) | Implementiert |
| TP-09 | Pausenzeiten je Übung und Satz | Implementiert |
| TP-10 | Drop-Sätze | Implementiert |
| TP-12 | Übung im Plan ersetzen, mit Alternativen | Implementiert |
| TP-13 | Eigene Übungen | Implementiert |
| TP-14 | Eigenes Programm erstellen und bearbeiten | Implementiert |
| TP-15 | Sätze im Plan hinzufügen und entfernen | Implementiert |
| TP-16 | Verpasste Einheiten nachholen, Tag frei wählen | Implementiert |
| TP-17 | Vorschau aller Wochen und Tage | Implementiert |
| TP-19 | Programm aktivieren, beenden, neu starten | Implementiert |
| TP-21 | Reihenfolge-Modus: nächster Trainingstag aus der Programmfolge | Implementiert |
| TP-22 | Optionaler Wochentag je Trainingstag | Implementiert |
| TP-23 | Programm duplizieren | Implementiert |
| TP-24 | Gekennzeichnete Beispielvorlagen | Implementiert |
| TP-25 | Als Vorlage speichern, Vorlage verwenden | Implementiert |
| TS-02 | Übungsliste mit Sätzen | Implementiert |
| TS-03 | Vorherige Leistungswerte | Implementiert |
| TS-04 | Gewicht eingeben | Implementiert |
| TS-05 | Wiederholungen eingeben | Implementiert |
| TS-06 | Satz abschließen, mit Vorschlag | Implementiert |
| TS-07 | Pausentimer | Implementiert |
| TS-08 | Übungstimer für Zeitsätze | Implementiert |
| TS-09 | Nächster Satz im Pausentimer | Implementiert |
| TS-10 | Übung im Training ersetzen | Implementiert |
| TS-11 | Sätze und Übungen im Training hinzufügen und entfernen | Implementiert |
| TS-14 | Training abschließen | Implementiert |
| TS-17 | Krafttraining nachtragen, Aktivität erfassen | Implementiert |
| TS-18 | Kalorienschätzung pro Einheit | Implementiert |
| TS-19 | Notizen zu Einheit und Übung | Implementiert |
| TS-21 | Bildschirm während des Trainings aktiv halten | Implementiert |
| TS-22 | Aufwärmsätze | Implementiert |
| TS-23 | Satzstatus geplant, erledigt, übersprungen | Implementiert |
| TS-24 | Fortschrittsanzeige der Einheit | Implementiert |
| TS-25 | Leiste „Training läuft“ und Rücksprung ins Training | Implementiert |
| TS-26 | Training verwerfen | Implementiert |
| TS-27 | Freie Reihenfolge der Satzerfassung | Implementiert |
| TH-01 | Verlauf mit Detail, Bearbeiten und Löschen | Implementiert |
| TH-02 | Übungsverlauf als Liste und Diagramm | Implementiert |
| TH-05 | Persönliche Bestleistungen | Implementiert |
| TH-06 | Statistik zu Frequenz, Dauer, Volumen | Implementiert |
| TH-07 | Vergleich mit der vorherigen Einheit | Implementiert |
| TH-08 | Fortschritt zum Wochenziel | Implementiert |
| NU-01 | Kalorien- und Makroziele berechnen | Implementiert |
| NU-02 | Tagesübersicht mit Zielfortschritt | Implementiert |
| NU-03 | Mahlzeiten-Slots | Implementiert |
| NU-05 | Lebensmittel oder Mahlzeit protokollieren, mit Snapshot | Implementiert |
| NU-07 | Barcode-Scanning | Implementiert |
| NU-09 | Portionsgröße und Anzahl kombinierbar | Implementiert |
| NU-10 | Eigene Lebensmittel mit Nährwerten | Implementiert |
| NU-11 | Favoriten, zuletzt verwendet, Mahlzeitvorlagen | Implementiert |
| NU-15 | Neuberechnung bei Mengenänderung | Implementiert |
| NU-16 | Nährwert-Aufschlüsselung je Lebensmittel | Implementiert |
| NU-17 | Ziele manuell überschreiben | Implementiert |
| NU-20 | Schnelleintrag nur mit kcal und Makros | Implementiert |
| NU-21 | Generische Lebensmittel mit deutschen Namen | Implementiert |
| NU-22 | Kennzeichnung unvollständiger Nährwerte | Implementiert |
| NU-24 | Offline-Verhalten der Online-Suche | Implementiert |
| NU-25 | Lizenz- und Quellenhinweise für Lebensmitteldaten | Implementiert |
| NU-26 | Einkaufsliste in „Meine Küche“ | Implementiert |
| NU-27 | Wasser: Tagesmenge, Ziel, Schnellmengen, Verlauf | Implementiert |
| RE-02 | Rezept mit Zutaten, Schritten, Nährwerten pro Portion | Implementiert |
| RE-12 | Eigene Rezepte anlegen und bearbeiten | Implementiert |
| RE-13 | Portionsskalierung | Implementiert |
| BP-01 | Körpergewicht erfassen, bearbeiten, löschen, als Liste | Implementiert |
| BP-02 | Gewichtsverlauf mit Trend | Implementiert |
| BP-06 | Fortschritt zum Zielgewicht | Implementiert |
| AH-03 | Tägliche Aufgaben | Implementiert |
| AH-04 | Gewohnheiten definieren und verfolgen | Implementiert |
| AH-09 | Manuelle Aktivitätseinträge | Implementiert |
| SY-01 | Lokale Datenbank (Dexie, IndexedDB) als führender Speicher | Implementiert |
| SY-03 | Cloud-Synchronisierung | Implementiert |
| SY-06 | Hell- und Dunkelmodus | Implementiert |
| SY-08 | Lokales Fehlerprotokoll ohne Nutzdaten | Implementiert |
| SY-09 | Anmeldung nur für die Sync | Implementiert |
| SY-10 | Keine Drittanbieter-Telemetrie | Getestet |
| SY-12 | Dauerhaften Speicher anfordern, Speicherstatus | Implementiert |
| SY-15 | Hosting mit fester HTTPS-Adresse und Vorschau-Umgebungen | Implementiert |
| SY-16 | Deutsche Oberfläche, Formatierung nach Gerätesprache | Getestet |
| SY-17 | Sync-fähige Metadaten ab Schema v1 | Implementiert |

### 8.2 Funktionen je Bereich (Route, Komponente, Verhalten)

**Datenbank, Sicherung, Synchronisierung**

| Funktion | Route / Komponente | Auslöser und Verhalten |
|---|---|---|
| Datenbank öffnen mit Snapshot vor Schema-Upgrade, Geräte-ID, Uhrzustand | `src/main.tsx` → `openRuntime` (`src/shared/db/runtime.ts`) | Beim Start; v1…v7 → v8 ohne Verlust; Snapshot in `fitness-snapshots` |
| Wiederherstellungsbildschirm, wenn die Datenbank nicht öffnet | `src/app/RecoveryScreen.tsx` | Ursache, „Erneut versuchen“, ggf. „Jetzt aktualisieren“ |
| Hinweisleiste „anderes Fenster hat die Datenbank übernommen“ | `ConnectionBanner` (`GlobalBanners.tsx`) | Dexie `versionchange`, „Neu laden“ |
| Gesundheitsprüfung bei Rückkehr, einmal neu öffnen, kontrollierter Neustart mit Schleifenschutz | `src/shared/db/health.ts`, `src/main.tsx` | `visibilitychange`, `pageshow` |
| Fehlerprotokoll ohne Nutzdaten (Ringpuffer 500) | `src/shared/db/errorLog.ts` | Unbehandelte Fehler, Promises, Fehlergrenzen, Export, Service Worker |
| Daten exportieren (JSON; Teilen auf iOS, sonst Download), „Letzter Export“ | `/mehr/daten` (`DataPage.tsx`) | „Jetzt exportieren“ mit Ergebnistext |
| Speicherstatus und belegter Speicher; Snapshot-Liste | `/mehr/daten` | Nur Anzeige (kein Wiederherstellen, A-06) |
| Dauerhaften Speicher anfordern | `requestPersistentStorage` aus `SessionBanner.tsx` | Nur bei laufendem Training (A-07) |
| Anmelden, Registrieren (Bestätigungsmail, Rücksprung), Abmelden | `/mehr/synchronisierung` (`SyncPage.tsx`, `LoginScreen.tsx`) | Fehlertexte; nach Anmeldung sofortiger Abgleich; Abmelden lässt Daten stehen |
| Stand des Abgleichs und „Jetzt abgleichen“ | `/mehr/synchronisierung` | Reaktiv aus `meta.sync.status` |
| Automatischer Abgleich | `SyncRunner` (lazy in `AppLayout.tsx`) | Start, Rückkehr, `online`, 3 s nach Änderungen, alle 5 min; nur angemeldet |
| Zusammenführen beim Pull (same/take/keep/restamp/conflict, K-01, Konfliktkopie für Programme und Rezepte, Projektion) | `src/modules/sync/calc/merge.ts`, `syncEngine.ts` | Eine Transaktion je Seite |
| Senden aller seit der Basis geänderten Dokumente inkl. Tombstones | `syncEngine.ts` `push` | `accepted`/`stale`; Basis nur bei unverändertem Dokument |
| Kontowechsel: Basis und Cursor zurücksetzen | `resetForUser` | Daten bleiben (A-08) |

**Training und Übungen**

| Funktion | Route / Komponente |
|---|---|
| Training-Startseite: laufende Einheit fortsetzen, aktives Programm mit nächstem Tag, freies Training | `/training` · `TrainingPage`, `ActiveProgramCard`, `useStartSession` |
| Leiste „Training läuft“ mit Dauer, Fortschritt, Rücksprung | `SessionBanner` |
| Programme und Vorlagen: eigene, Archiv, gebündelte Programme A/B/C, Beispielvorlagen, Lösch-Toast | `/training/programme` · `ProgramsPage` |
| Gebündeltes Programm ansehen, Tag starten, aktivieren/beenden, übernehmen | `/training/vorlagen/:key` · `SampleTemplatePage`, `ProgramDetail`, `AdoptButton` |
| Eigenes Programm: ansehen, starten, aktivieren, bearbeiten, Vorlage, duplizieren, archivieren, löschen | `/training/programme/:id` · `OwnProgramPage`, `ProgramActions` |
| Programm-Editor (Name, Beschreibung, Wiederholen; Wochen und Tage verwalten) | `/training/programme/:id/bearbeiten` · `ProgramEditPage` |
| Tages-Editor (Übungen, Sätze, Zielbereiche, Pausen, Hinweise) | `/training/programme/:id/tage/:dayId` · `DayEditPage`, `ExerciseEditor` |
| Player: Bühne, Fortschritt, Beenden, Pausentimer, Satzzeilen mit Vorwert/Vorschlag, erledigt/überspringen, Sätze und Übungen verwalten, Übungstimer, Notizen, Verwerfen, Ton, Wake Lock | `/training/einheit/:id` · `SessionPage`, `SetRow`, `ValueInput`, `RestStage`, `NoteDialog` |
| Zusammenfassung mit Kennzahlen, Vergleich, beste Sätze, Bestleistung, „Trainingstag x von n“ | `/training/einheit/:id/zusammenfassung` · `SummaryPage` |
| Verlauf nach Woche, Aktivitäten, Lösch-Toast | `/training/verlauf` · `HistoryPage` |
| Verlauf-Detail mit Bearbeiten (Titel, Beginn, Dauer, Notizen, Satzwerte, Sätze entfernen) und Löschen | `/training/verlauf/:id` · `HistoryDetailPage`, `HistoryEditForm` |
| Nachtragen: Krafttraining oder Aktivität | `/training/nachtragen` · `LogPage` |
| Übungsbibliothek mit Suche, Filtern, eigenen Übungen, Archiv | `/uebungen` · `ExerciseLibraryPage`, `CustomExerciseDialog` |
| Übungsauswahl (Blatt) mit Alternativen | `ExercisePicker` |
| Übungsdetail mit persönlichen Angaben und letzten Einheiten | `/uebungen/:id` · `ExerciseDetailPage`, `ExercisePrefsCard` |
| Gebündelte Stammdaten mit Prüfung beim Laden | `core-exercises.v1.json`, `programs.v1.json`, `sample-templates.v1.json` |

**Ernährung, Einkaufsliste, Wasser**

| Funktion | Route / Komponente |
|---|---|
| Tagesprotokoll: Ring, Makros, Zusatzwerte, Hinweise, vier Mahlzeiten; Tagesnavigation `?tag=` | `/ernaehrung` · `NutritionPage` |
| Eintrag bearbeiten (Menge oder Portionsanzahl, Mahlzeit, Löschen mit Rückgängig) | `EntryDialog` |
| Mahlzeit als Vorlage speichern | `SaveTemplateDialog` |
| Wasser-Karte je Tag | `WaterCard` auf `/heute`, `/ernaehrung`, `/ernaehrung/wasser` |
| „Meine Küche“ (Lebensmittel, Rezepte, Einkaufsliste, Vorlagen mit Zählern) | `KitchenMenu` |
| Karte „Ernährung heute“ mit Knöpfen Barcode, Ernährung, Einkaufsliste | `/heute` · `NutritionTodayCard` |
| Lebensmittel hinzufügen: Suche (eigene, Rezepte, ÖNWT, Marken, österreichische Begriffe), Vorlagen, Favoriten, Zuletzt | `/ernaehrung/hinzufuegen` · `AddFoodPage` |
| Eintragen-Dialog (g/ml oder Portion, kcal-Vorschau, Nährwerttabelle) | `LogDialog` |
| Schnelleintrag | `QuickDialog` |
| Vorlage ansehen und „Alle eintragen“ | `ApplyTemplateDialog` |
| Barcode scannen und von Hand; lokal → Einwilligung → Open Food Facts; Ergebnisse mit „Selbst anlegen“ | `BarcodeFlow`, `ScannerDialog`, `?scan=1` |
| Meine Lebensmittel (aktive, Archiv, Favorit) | `/ernaehrung/lebensmittel` · `FoodsPage` |
| Lebensmittel anlegen/bearbeiten (Nährwerte, Portionen, Barcode, Archiv) | `/ernaehrung/lebensmittel/neu`, `/ernaehrung/lebensmittel/:foodId` · `FoodFormPage` |
| Lebensmitteldaten importieren, Markendatei, „Import entfernen“ | `CatalogCard` |
| Open Food Facts: Einwilligung erteilen/zurückziehen | `OffConsentCard` |
| Rezepte: Liste, anlegen/bearbeiten (Zutaten, Portionen, Nährwerte, Zubereitung, „Zutaten auf die Einkaufsliste“) | `/ernaehrung/rezepte`, `/ernaehrung/rezepte/neu`, `/ernaehrung/rezepte/:recipeId` · `RecipesPage`, `RecipeEditPage`, `IngredientPicker` |
| Vorlagen: Liste, umbenennen, löschen mit Rückgängig | `/ernaehrung/vorlagen` · `TemplatesPage` |
| Tagesziele: manuell oder Vorschlag | `/ernaehrung/ziele` · `TargetsPage` |
| Einkaufsliste: Schnelleingabe mit Mengen-Erkennung, Vorschläge, Doppelte, „Zuletzt gekauft“, Ansichten, abhaken, bearbeiten, „Gekaufte entfernen“, Rückgängig | `/ernaehrung/einkaufsliste` · `ShoppingListPage`, `EditItem` |
| Wasser-Seite: Tageskarte, Einträge, Tagesziel, Verlauf 7/30 Tage, Diagramm, Schnellmengen | `/ernaehrung/wasser` · `WaterPage`, `WaterChart` |
| Tagesaufgabe „Mit Wasserziel abhaken“ | `habits` (`applyWaterAutoDoneToday`), aus `waterService.afterChange` |
| Export enthält `foods`, `foodLog`, `nutritionTargets`, `recipes`, `mealTemplates`, `shoppingItems`, `waterLog` | `src/shared/db/export.ts` |

**Tagesaufgaben, Ziele, Körper, Fortschritt, Heute, Einstellungen, Schritte**

| Funktion | Route / Komponente |
|---|---|
| Karte „Tagesaufgaben“: abhaken, Fortschritt, Leerzustände, automatisches Abhaken | `/heute` · `TasksCard` |
| Aufgaben verwalten: anlegen, umbenennen, Wochentage, Auto-Abhaken, pausieren, löschen (Rückgängig), Reihenfolge | `/heute/aufgaben` · `TasksPage` |
| Fortschritt der Aufgaben: Zeitraum, Kacheln, Verlauf, Raster, Sortierung, Hinweise | `/heute/aufgaben` · `TaskStats`, `ProgressChart`, `TaskMatrix` |
| Aufgabe im Detail: Kennzahlen, Vergleich, Wochenverlauf, Kalender, Wochentage | `/heute/aufgaben/:id` · `TaskDetailPage` |
| Profil und Ziele: Anzeigename, Zielgewicht, Wochenziel, Verlauf der Ziele | `/mehr/profil` · `ProfilePage`, `GoalsPanel` |
| Karte „Wochenziel“ | `/heute` · `WeeklyGoalCard` |
| Körpergewicht: Kacheln, Zeitraum, Diagramm/Tabelle, Liste, erfassen/bearbeiten/löschen (Rückgängig) | `/fortschritt/gewicht` · `BodyWeightPage`, `BodyWeightSheet`, `WeightChart` |
| Karten „Körpergewicht“ auf Heute und Fortschritt | `TodayPage`, `ProgressPage` (`WeightCurve`, `Sparkline`) |
| Fortschritt: Zeitraum, Kacheln, Bestleistungen, Übungsverläufe | `/fortschritt` · `ProgressPage` |
| Übungsverlauf mit Diagramm/Tabelle | `/fortschritt/uebung/:exerciseId` · `ExerciseProgressPage` |
| „Heute“: Begrüßung, Datum, Uhr, Bühne (laufend › Programm › frei), Karten | `/heute` · `TodayPage` |
| Mehr: Profil, Einstellungen, Synchronisierung, Über die App | `/mehr` · `MorePage` |
| Einstellungen: Training, Darstellung, Datum und Zahlen, Weiteres | `/mehr/einstellungen` · `SettingsPage` |
| Installieren: Status, Chromium-Knopf, Anleitungen | `/mehr/installieren` · `InstallPage` |
| Über die App: Version, Build, Speicher-ID, „Nach Update suchen“, Datenschutz | `/mehr/ueber` · `AboutPage` |
| Schritte: Dashboard verbinden/trennen, abholen; Karte auf Heute | `/mehr/schritte` · `StepsPage`; `StepsTodayCard` |

**Shell, PWA**

| Funktion | Route / Komponente |
|---|---|
| Start `/` → „Heute“; unbekannte Adresse → „Seite nicht gefunden“ | `src/app/routes.tsx`, `ErrorViews.tsx` |
| Fehleransicht je Ansicht und für den Rahmen; Ladeplatzhalter | `RouteErrorView`, `RootErrorView`, `ShellFallback` |
| Seitenleiste ab 1024 px; Tab-Leiste mit Glas-Linse, minimiert beim Scrollen | `Sidebar.tsx`, `TabBar.tsx`, `tabLens.ts`, `tabMinimize.ts` |
| Logo und Name links oben; Skip-Link; Vollbild-Player | `AppLayout.tsx`, `training/routes.ts` |
| Leisten: Datenbank übernommen, Training läuft, Neue Version, iOS-Installationshinweis | `GlobalBanners.tsx` |
| Service Worker: Vorab-Cache, Offline-Start, Update erst nach Bestätigung; Update-Suche | `register.ts`, `state.ts`, `vite.config.ts` |
| Manifest, Icons, `theme-color`; Hell/Dunkel/System vor dem ersten Bild | `vite.config.ts`, `theme-init.js`, `theme.ts`, `ThemeSync` |
| Werkzeuge: `pnpm check:bundle`, `pnpm icons`, CI mit E2E Chromium und WebKit | `tools/*.mjs`, `.github/workflows/ci.yml` |

Vorhandene automatische Nachweise (Auszug): Unit und Komponenten `sessionService.test.ts`, `playerService.test.ts`, `historyService.test.ts`, `logService.test.ts`, `programService.test.ts`, `calc/*.test.ts`, `nutritionService.test.ts`, `recipeService.test.ts`, `barcodeService.test.ts`, `catalogService.test.ts`, `shoppingService.test.ts`, `waterService.test.ts`, `habitService.test.ts`, `insights.test.ts`, `goalService.test.ts`, `bodyWeightService.test.ts`, `stats.test.ts`, `stepStats.test.ts`, `syncEngine.test.ts`, `merge.test.ts`, `repository.test.ts`, `migrations.test.ts`, `snapshots.test.ts`, `export.test.ts`, `health.test.ts`, `errorLog.test.ts`, `format.test.ts`, `time.test.ts`, `tokens.test.ts`, `*-ui.test.tsx`, `app.test.tsx`; E2E `e2e/*.spec.ts` (Player, Session, Resilience, History, Log, Notes, Programs, Templates, Exercises, Nutrition, Shopping, Water, Steps, Goals, Habits, PWA, Shell, Install-Hint, Network-A11y).

---

## 9. Offene Fragen und nicht verifizierte Annahmen

An den Produktinhaber:
1. **Gerätesprache des iPhones** (C-01): Meldet es `de-AT` (dann war der Fehler bisher nur zufällig maskiert) oder „Deutsch“ ohne Region bzw. ist unter „Mehr › Einstellungen › Datum und Zahlen“ etwas Festes gewählt? Der Fix wirkt in allen drei Sprachen; die Frage klärt nur, ob bereits gespeicherte Mengen betroffen sein können.
2. **Versionsstand der Geräte** (A-01): Läuft das iPhone noch auf einer älteren Version (v7, vor Wasser), während der Mac auf v8 ist? Dann könnten Wasser-Einträge vom Mac auf dem iPhone bereits übersprungen worden sein und müssten nach dem Fix einmalig nachgeholt werden (Cursor zurücksetzen).
3. **Laufende Einheit eines anderen Geräts** (A-02): Soll sie überhaupt als „Training läuft“ erscheinen und verwerfbar sein (AK-TRN-22 spricht von „dieses Geräts“)? Der Fix schützt die abgeschlossene Einheit unabhängig davon.
4. **Pausieren/Fortsetzen** (B-02): umsetzen oder als offen dokumentieren?
5. **Wasser-Aufgabe zurücknehmen** (C-10): Soll ein gelöschter Wassereintrag den automatischen Haken wieder entfernen?
6. **Supabase-Projekt**: Site URL und „Allow new users to sign up“ (Übergabe 19.10., Abschnitt 3) sind laut Übergabe 21.10. nicht bestätigt. Solange offen, kann jede Person mit der App-Adresse ein Konto anlegen (D-273).

Nicht verifiziert (außerhalb des Repositories oder ohne Gerät):
7. Server-SQL (`sync_documents`, `push_documents`, Index, RLS) liegt nicht im Repository; Serialisierung je Nutzer (A-05) und Verhalten bei gleichem HLC sind nur aus der Testnachbildung bekannt.
8. Supabase-Fehlercode für unbestätigte E-Mail (A-10) und Verhalten bei parallelem Refresh bzw. Logout mit abgelaufenem Token (D-02, D-12).
9. HSTS auf der Produktivadresse (Vercel setzt ihn vermutlich selbst); `Cache-Control` für App-Routen; Node-Version bei Vercel; Vorab-Cache-Grenze 2 MiB bei künftigen großen Dateien.
10. Performance-Befunde (B-14, C-04, D-10, D-11) nur aus dem Code abgeleitet, nicht am iPhone gemessen.
11. Dashboard-Rechnung der Schritte (D-277) stützt sich allein auf den nachgerechneten Test; der Dashboard-Code liegt nicht im Repository.
12. Gerätetests (T-IPH-M1: Wake Lock, Ton, Audio-Session, IndexedDB-Verbindungsverlust; Kamera-Nachfrage bei jedem Start) stehen aus; der erste echte Abgleich zwischen zwei Geräten steht aus und sollte erst nach A-01/A-02 erfolgen.
13. Open Food Facts live war aus der Cloud-Umgebung nicht prüfbar (Netzsperre).

---

## 10. Tests

Wird nach jedem Fix und am Ende der Phase ergänzt.

| Lauf | Stand | Ergebnis |
|---|---|---|
| Ausgangslage `c6b5832`: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm check:bundle` | 21.10.2026 | lint und typecheck ohne Befund; 797 Tests in 91 Dateien bestanden; Build ok; 249,4 KB von 250 KB |
| `pnpm audit --prod` | 21.10.2026 | keine bekannten Schwachstellen |
| B-01 (`715a575`): `calc/session.test.ts`, `service/sessionService.test.ts` | 21.10.2026 | 30 Tests bestanden (inkl. zwei neue) |
| C-01 (`affff5d`, D-291): `pnpm format:check`, `pnpm lint`, `pnpm typecheck`; `format.test.ts`, `nutrition-ui.test.tsx`, `history-ui.test.tsx`, `player-ui.test.tsx` | 21.10.2026 | Format, Lint und Typecheck ohne Befund; 69 Tests in 4 Dateien bestanden (inkl. vier neue) |
| A-01 (D-292): `pnpm format:check`, `pnpm lint`, `pnpm typecheck`; `pnpm vitest run src/modules/sync` | 21.10.2026 | Format, Lint und Typecheck ohne Befund; 26 Tests in 4 Dateien bestanden (inkl. ein neuer, ein angepasster) |

Noch ausstehend für den Abschluss der Phase: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm check:docs`, `pnpm build`, `pnpm check:bundle`, `pnpm test:e2e` (Chromium lokal; WebKit nur in GitHub Actions über einen Pull Request).

## 11. Änderungen in dieser Phase

| Commit | Inhalt | Entscheidung |
|---|---|---|
| `715a575` | B-01: `finishEndedAt`/`lastCompletedAt` in `src/modules/training/calc/session.ts`; `finishSession` kappt die Dauer und nutzt den letzten erledigten Satz als Ende; Tests | D-290 |
| `affff5d` | C-01: Option `useGrouping` in `src/shared/lib/format.ts`; `useGrouping: false` in `EntryDialog.tsx`, `FoodFormPage.tsx`, `RecipeEditPage.tsx`, `player/SessionPage.tsx`, `HistoryDetailPage.tsx`; `EntryDialog` sendet die Menge nur bei geändertem Text; Tests in `format.test.ts`, `nutrition-ui.test.tsx`, `history-ui.test.tsx`, `player-ui.test.tsx` | D-291 |
| „Sync: Abgleich hält vor Dokumenten einer neueren App-Version an (D-292)“ | A-01: `AppOutdatedError` und `knownKind` in `src/modules/sync/service/syncEngine.ts`; `pull` rückt den Cursor nur bis zur letzten verarbeiteten Zeile; Text `sync.errors.AppOutdatedError` in `de.ts`; Test in `syncEngine.test.ts`; `known-limitations.md` Abschnitt 7 | D-292 |
