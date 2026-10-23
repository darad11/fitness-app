# Phase Stabilität – Bericht

Stand: 23.10.2026 · Branch `form-stabilitaet` (Basis `1dc1dd7`, `main` nach PR #49), Entwurfs-PR #50 · Auftrag: `docs/prompts/stabilitaet-FORM.md`. Aufbau wie `form-rebranding-report.md`.

Regeln: Keine neuen Funktionen außer den im Auftrag genannten. Ein Commit je Abschnitt mit D-Nummer, nach jedem Abschnitt Tests, sofort pushen. Texte nach `form-markenleitplanken.md`. Nur Getestetes gilt als fertig; Testergebnisse stehen wörtlich je Abschnitt.

---

## 1. Abschnitte

| Abschnitt | Ergebnis | Entscheidung | Stand |
|---|---|---|---|
| §1 E-16: Start nach Updates und ohne Netz | Ursache gefunden (Chromium bricht unter dem Service Worker Modul-Anfragen ab), Startwächter, einmal neu laden, Übernahme beim ersten Start, Update-Strategie, Test mit zwei Builds; Nachtrag nach der CI: drei Befunde in WebKit | D-343 | erledigt, WebKit zum Nachtrag in der CI |
| §2 Wackelnde Tests und CI | Ursachen gefunden und behoben: Linse hing an der Bildrate, Leertaste fiel in Chromium in das Ende eines Tipps, Messung am Seitenende vor dem Dialog der Anmeldung, Ernährungseinträge aus derselben Millisekunde ohne feste Reihenfolge; E2E-Jobs im Image von Playwright; Wiederholung auf Abruf | D-344 | erledigt, Wiederholung in der CI ausstehend |

## 2. §1 E-16 – zuverlässiger Start nach Updates und ohne Netz

### Ursachen

Der Test „Service Worker übernimmt und alle Bereiche starten offline“ ließ sich hier zunächst nicht nachstellen: einzeln 16 von 16 bestanden, im vollen Lauf am alten Stand 304 bestanden, 42 übersprungen, 0 fehlgeschlagen. Unter mehr Last (8 Worker auf 4 Kernen, 12 Wiederholungen je Projekt) schlug er in 6 von 24 Läufen fehl. Alle sechs Traces zeigen dasselbe Muster: Beim fehlgeschlagenen Seitenaufruf bricht ein Block der vorgeladenen Startmodule gemeinsam ab (`net::ERR_ABORTED`, nach 40 bis 450 ms), die eigentlichen Modul-Anfragen dafür kommen nie, die App startet nicht und meldet keinen Fehler. Davor warnt Chromium für jedes Modul: „A preload for '…' is found, but is not used because it is a cross-world service worker resource mismatch.“ Unter einem Service Worker verwendet Chromium vorgeladene Module also nicht und lädt sie ein zweites Mal.

Gegenproben am alten Stand, je 24 Läufe mit 8 Workern:

| Variante | Ergebnis | Schluss |
|---|---|---|
| offline, mit Service Worker (der Test selbst) | 6 von 24 rot | nachgestellt |
| derselbe Rundgang online, mit Service Worker | 5 von 24 rot, gleiches Muster | nicht an den Offline-Zustand gebunden |
| derselbe Rundgang ohne Service Worker | 0 von 24 rot | der Service Worker ist Voraussetzung |
| mit Service Worker, Build ohne `modulepreload` | 1 von 24 rot, auch dort brechen Modul-Anfragen gemeinsam ab | Vorladen verstärkt es, ist aber nicht allein die Ursache |
| Fehlerereignis im Fehlerfall | `error` am Einstiegsskript `index-….js` | daran setzt der Startwächter an |

Die vier Hypothesen aus dem Auftrag:

| Hypothese | Ergebnis |
|---|---|
| Vorab-Liste unvollständig (Muster, Ausnahmen, Größengrenze, nachgeladene Teile) | ausgeschlossen: alle 168 Dateien der App stehen im Service Worker, ausgenommen sind nur `sw.js`, die Workbox-Laufzeit, das Vite-Manifest und große Bilder (`globIgnores`); die größte Datei hat 1,1 MB, die Grenze von Workbox liegt bei 2 MiB. Neu prüft `tools/check-precache.mjs` das nach jedem Build (Teil von `pnpm check:bundle`) |
| Wettlauf beim Update | für den Test ausgeschlossen (ein Build, kein Update). Für echte Updates geprüft: Eine wartende neue Version bringt alle ihre Teile mit; nach „Jetzt aktualisieren“ und beim Neustart ohne Netz startet sie vollständig (`e2e/update.spec.ts`) |
| Vercel liefert die gehashten Teile der alten Version nicht mehr | für den Test ausgeschlossen (lokaler Server). Für echte Deployments belegt: Eine Seite ohne Service Worker bekommt für eine fehlende alte Datei `index.html` (Rewrite in `vercel.json`) und lehnt sie als Modul ab („Failed to load module script: … MIME type of "text/html"“). Am alten Stand: Fehleransicht; jetzt: einmal neu laden |
| Navigations-Fallback und `index.html` | ausgeschlossen: `index.html` kommt immer aus demselben Vorab-Speicher wie ihre Teile; Vercel liefert sie mit `no-cache` |

Dabei gefunden, ohne Ursache des Tests zu sein: Ohne `clientsClaim` lief die erste Sitzung nach der Installation ohne Service Worker. Nachgeladene Bereiche kamen dann bis zum ersten Neuladen nur über das Netz; ohne Netz oder nach einem Deployment fehlten sie (E-05).

### Änderungen

1. **Startwächter** (`public/theme-init.js`): Meldet das Einstiegsskript einen Ladefehler, lädt die App einmal neu. Ein zweites Mal innerhalb von fünf Minuten nicht (Marke in `sessionStorage`), stattdessen „FORM ließ sich nicht starten“ und „Lade die App neu. Deine Daten bleiben erhalten.“ mit „Neu laden“. Die Texte stehen gleich lautend in `de.ts`; `wording.test.ts` vergleicht sie.
2. **Einmal neu laden bei fehlenden nachgeladenen Teilen** (`src/app/chunkRecovery.ts`, Fehleransichten): bei `vite:preloadError` oder einem Ladefehler in der Ansicht. Nie während eines laufenden Trainings, nicht zweimal in fünf Minuten, nicht ohne Service Worker und ohne Netz (sonst käme die Fehlerseite des Browsers). Sonst ein ruhiger Hinweis „Dieser Bereich ließ sich nicht laden“ mit „Neu laden“; während eines Trainings: „Dein Training ist gespeichert. Nach dem Neuladen geht es an derselben Stelle weiter.“ Ein zweiter Import derselben Datei fragt in Chromium nicht neu an (nachgeprüft in Chromium 153), deshalb hilft nur Neuladen. Diese Fehler stehen im Fehlerprotokoll und nicht mehr in der Konsole; alle anderen Fehler meldet die Konsole wie bisher.
3. **Übernahme beim ersten Start** (`vite.config.ts`, `clientsClaim: true`).
4. **Update-Strategie** (`src/shared/pwa/register.ts`, `state.ts`, `GlobalBanners.tsx`, `AboutPage.tsx`):
   - Eine neue Version lädt im Hintergrund vollständig in den Speicher und wartet.
   - „Neue Version verfügbar“ mit „Jetzt aktualisieren“ erscheint, sobald sie bereit ist, außer während eines Trainings (E-01). Dann erscheint der Hinweis nach dem Beenden, und „Über die App“ sagt: „Eine neue Version ist bereit. „Jetzt aktualisieren“ erscheint, wenn dein Training beendet ist.“
   - Sie übernimmt nach „Jetzt aktualisieren“ oder beim nächsten Start, wenn kein Fenster der alten Version mehr offen ist.
   - Übernimmt sie eine offene Seite, lädt diese neu, außer während eines Trainings (dann nach dem Training über den Hinweis). Den Wechsel erkennt die App selbst (`createControllerWatcher`): Mit `clientsClaim` meldete `vite-plugin-pwa` nach der Übernahme beim ersten Start einen späteren Wechsel nicht mehr als Update, und „Jetzt aktualisieren“ lud nicht neu. Das hat der neue Test gefunden.

### Geänderte Dateien

- Neu: `src/app/chunkRecovery.ts`, `src/app/chunkRecovery.test.ts`, `e2e/update.spec.ts`, `e2e/updateServer.ts`, `e2e/start-watch.spec.ts`, `tools/check-precache.mjs`, `docs/prompts/stabilitaet-FORM.md`, `form-stabilitaet-report.md`
- Geändert: `public/theme-init.js`, `vite.config.ts`, `package.json` (`check:bundle`), `src/main.tsx`, `src/app/App.tsx`, `src/app/errors/ErrorViews.tsx`, `src/app/banners/GlobalBanners.tsx`, `src/shared/pwa/register.ts`, `src/shared/pwa/state.ts`, `src/shared/i18n/de.ts`, `src/modules/training/data/sessionRepository.ts` (`hasActiveSession`), `src/modules/training/index.ts`, `src/modules/settings/ui/AboutPage.tsx`; Tests `src/app/app.test.tsx`, `src/app/wording.test.ts`, `src/shared/pwa/pwa.test.ts`
- Dokumente: `docs/decisions.md` (D-343), `docs/architecture.md` (Abschnitt 9), `docs/known-limitations.md` („Updates und Start“), `docs/testing.md`, `docs/feature-inventory.md` (SY-02), `docs/implementation-plan.md` (Punkt 66), `docs/CHANGELOG.md`, `audit-report.md` (E-16, E-01, E-04, E-05)

### Tests mit Ergebnis

| Lauf | Ergebnis |
|---|---|
| `e2e/update.spec.ts` (neu, zwei Builds nacheinander, Chromium Desktop) | 7 bestanden: erster Start ohne Neuladen, nach einem Deployment und ohne Netz öffnen sich nachgeladene Bereiche; wartende Version, App ohne Netz neu geöffnet: neue Version, alle 28 Seiten; wartende Version ohne Netz, „Jetzt aktualisieren“: neue Version; Training läuft: kein Hinweis, „Über die App“ nennt die bereite Version, nach dem Beenden erscheint der Hinweis; ohne Service Worker nach einem Deployment: einmal neu geladen, neue Version zeigt den Bereich; Teil fehlt auch danach: Hinweis, genau ein Neuladen; Training läuft: kein Neuladen, Hinweis „Dein Training ist gespeichert …“, nach „Neu laden“ läuft das Training mit der neuen Version weiter |
| Gegenprobe `e2e/update.spec.ts` am alten Stand (einzeln, ohne `serial`) | 7 von 7 fehlgeschlagen: vier an „Die Seite wird vom Service Worker übernommen“ (fehlendes `clientsClaim`), drei an der Fehleransicht statt des Bereichs bzw. statt des Hinweises. Mit einem Neuladen statt der Übernahme bestehen am alten Stand die Fälle „Neustart ohne Netz“ und „Jetzt aktualisieren ohne Netz“ (sie sichern vorhandenes Verhalten ab), der Trainingsfall schlägt weiter fehl |
| `e2e/start-watch.spec.ts` (neu) | Chromium Desktop und Pixel 7: 4 bestanden; Gegenprobe am alten Stand: 2 von 2 fehlgeschlagen (leere Seite, kein Hinweis) |
| Belastung: Offline-Test mit 8 Workern, 24 Läufe, neuer Stand | 24 von 24 bestanden (alter Stand: 18 von 24) |
| Belastung: Rundgang mit Zählung der Neuladevorgänge, 24 Läufe, neuer Stand | 24 von 24 bestanden; in 1 Lauf genau ein automatisches Neuladen (ein Teil brach ab, danach startete die App), in 23 Läufen keins. Ein Lauf vor der letzten Änderung: 23 von 24, dreimal genau ein Neuladen, 1 rot nur an der Konsolenprüfung, weil React den abgebrochenen Teil (`WaterCard`) noch in der Konsole meldete; seitdem stehen solche Fehler nur im Fehlerprotokoll |
| `chunkRecovery.test.ts` (21), `pwa.test.ts` (11), `app.test.tsx`, `wording.test.ts` (29) | bestanden. Gegenprobe „kein Hinweis während des Trainings“ in `app.test.tsx` mit der alten Regel im Banner: 1 von 1 fehlgeschlagen, danach bestanden |
| `pnpm test` | 107 Dateien, 921 Tests bestanden |
| `pnpm check:bundle` | Startansicht 238,9 KB von 250 KB (vorher 237,6 KB); Vorab-Liste 168 von 227 Dateien, die übrigen bewusst ausgenommen. Negativprobe: eine zusätzliche Datei in `dist/assets` lässt die Prüfung scheitern |

### Nachtrag: Befunde der CI in WebKit

Die CI zu `5a1db80` (Lauf 39990720590) war in Chromium grün. WebKit: 299 bestanden, 59 übersprungen, 5 fehlgeschlagen, 1 wackelnd. Alle sechs gehen auf diesen Abschnitt zurück:

| Befund | Ursache | Änderung |
|---|---|---|
| `update.spec.ts` „Während eines Trainings …“ ohne Service Worker: allgemeine Fehleransicht statt „Dein Training ist gespeichert …“ | WebKit meldet eine als `text/html` gelieferte Datei mit „'text/html' is not a valid JavaScript MIME type for module script …“; die Erkennung kannte nur die Meldungen von Chromium und Firefox. Das hätte das iPhone genauso getroffen | `isChunkLoadError` erkennt den Text |
| `sync.spec.ts`, zwei Fälle: Konsolenfehler „… due to access control checks.“ | WebKit bricht zu Beginn einer Navigation alle laufenden Importe ab, schon vor `pagehide`. Die Wiederherstellung fragte dann beim Server nach, und WebKit meldete die abgebrochene Anfrage. Ohne Service Worker hätte sie die Navigation sogar mit einem Neuladen überholen können | Ab `beforeunload` entscheidet die Wiederherstellung nichts mehr; ohne Netz (`navigator.onLine`) fragt sie nicht nach. iOS kennt `beforeunload` nicht, dort bleibt `pagehide` |
| `start-watch.spec.ts` Fall 1 (Desktop und Handy): App startete nach dem Neuladen nicht | Fall 2 (Neuladen, dann Hinweis) bestand, der Wächter lädt also neu. Vermutlich kam das Ereignis `request` des zweiten Dokuments erst nach dessen Modul-Anfrage an, und der Test brach das Modul auch dort ab. Nicht nachgestellt, weil WebKit hier nicht läuft | Der Test zählt Dokumente über ihre Route: Ein Dokument fragt seine Module erst an, nachdem die Route es durchgelassen hat. Seine Meldungen nennen die Reihenfolge von Dokumenten und Modul-Anfragen |
| `barcode.spec.ts` wackelnd: Anfrage an Open Food Facts mit 404 | Seit `clientsClaim` steuert der Service Worker die Seite schon beim ersten Aufruf; in WebKit umgehen ihre Anfragen dann `page.route` (bekannt aus `sync.spec.ts`), die Anfrage ging ans echte Netz | Der Test läuft ohne Service Worker wie die übrigen mit `page.route` |

Tests: `chunkRecovery.test.ts` 24 bestanden, die drei neuen Fälle am alten Stand 3 von 3 fehlgeschlagen; `start-watch`, `barcode`, `sync`, `update` und `switches` in Chromium (Desktop und Pixel 7): 59 bestanden, 9 übersprungen; `pnpm test` 107 Dateien, 924 Tests bestanden; `pnpm test:e2e` in Chromium: 315 bestanden, 49 übersprungen, 0 fehlgeschlagen (11,5 min); Startansicht 239,0 KB. WebKit: in der CI zum Nachtrag.

### Offen

- WebKit: Die Fälle mit Service Worker laufen nur in Chromium (wie der bisherige Offline-Test); die Fälle ohne Service Worker und der Startwächter laufen in der CI auch in WebKit. Ob Safari unter dem Service Worker ebenfalls Modul-Anfragen abbricht, ist nicht geprüft; die Erholung greift dort genauso, sobald Safari einen Ladefehler meldet.
- Gerätetest T-IPH-M0 Schritt 4 (Update am iPhone) für diese Fassung.
- Hängt eine Modul-Anfrage, ohne zu scheitern, greift der Startwächter nicht; die Startfläche blendet sich nach 10 s trotzdem aus (D-325). In den Traces kam das nicht vor.

## 3. §2 Wackelnde Tests und CI

### Ursachen

| Test | Befund | Ursache |
|---|---|---|
| „Tab-Leiste: Ziehen mit der Linse …“ (WebKit) | zweimal erst im zweiten Versuch grün, bei `687d0bf` in beiden Versuchen rot: Die Klasse `lens-active` blieb | Die Feder rechnete je Bild höchstens 50 ms weiter und brauchte zum Ablegen rund neun Bilder. Bei wenigen Bildern je Sekunde dauerte das Sekunden: in Chromium mit 20-facher CPU-Drosselung 3,96 s, bei zwei Bildern je Sekunde 2,5 s. In der CI lag die Linse nach 5 s noch nicht; wie wenige Bilder WebKit dort lieferte, ist nicht gemessen, der Befund passt aber dazu |
| „Tagesaufgabe: „Mit Wasserziel abhaken“ per Tipp und Tastatur …“ (Chromium, Handy) | einmal rot in F6 §7: Nach der zweiten Leertaste blieb der Schalter aus | Chromium hält ein angetipptes Element bis zu 150 ms „aktiv“ und hebt das per Zeitgeber auf. Die Leertaste schaltet beim Loslassen nur, wenn das Element dann noch „aktiv“ ist. Fällt das Ende des Tipps zwischen Drücken und Loslassen, löst die Taste nichts aus. Der Test tippte und drückte gleich danach die Leertaste. Nachgewiesen mit gehaltener Taste (siehe Tests) |
| „Seitenende: …“ auf `/mehr/synchronisierung` (WebKit) | bei `ef8b18e` wackelnd, bei `687d0bf` rot: 623 statt höchstens 579 | Die Anmeldung öffnet sich erst nach dem Laden als Vollbild-Dialog. Der Test fragte den Dialog ab, bevor er sich öffnete, und maß danach; die Knöpfe der Anmeldung zählten dann als Inhalt der Seite. Der Platzhalter der Seite war nicht als beschäftigt markiert, `openPage` wartete deshalb nicht auf das Laden |
| Unit-Test „belegt Mengen ab 1000 …“ (`nutrition-ui.test.tsx`) | in der CI zu `0f50be6` rot: Die Bearbeitung zeigte „Anzahl (Packung)“ statt „Menge in ml“ | Die beiden Einträge des Tests entstehen in derselben Millisekunde. `listDayEntries` sortierte nur nach der Uhrzeit; bei Gleichstand entschied die zufällige ID, und der Test öffnete den falschen Eintrag |
| Installation von WebKit in der CI | einmal 37 min 47 s für 117 MB Systempakete per apt (51,6 kB/s) | `playwright install --with-deps` lädt die Systempakete bei jedem Lauf per apt; ist der Spiegel langsam, wartet der Job |

Der E-16-Offline-Test (§1) und der Barcode-Test (Nachtrag §1) sind in Abschnitt 2 beschrieben; sie laufen in der Wiederholung mit.

### Änderungen

1. **Linse** (`src/app/layout/tabLens.ts`): bis 250 ms je Bild statt 50 ms, weiter in Teilschritten von 1/240 s, damit die Feder stabil bleibt. Spätestens 900 ms nach dem Loslassen liegt die Linse; kommt gar kein Bild mehr, legt ein Zeitgeber sie nach 1,2 s ab. Neuer Test mit nur zwei Bildern je Sekunde.
2. **Wasser-Schalter** (`e2e/switches.spec.ts`): Der Test wartet nach dem Tipp, bis der Schalter nicht mehr „aktiv“ ist, und nutzt erst dann die Tastatur. In der App spielt das keine Rolle; dafür müssten Tipp und Tastatur binnen 150 ms kommen.
3. **Reihenfolge der Ernährungseinträge** (`src/modules/nutrition/data/nutritionRepository.ts`): bei gleicher Uhrzeit nach dem Änderungsstempel, also in der Reihenfolge des Eintragens. Das gilt auch in der App, z. B. für eine Vorlage, die mehrere Einträge auf einmal anlegt.
4. **Seitenende** (`e2e/marks.spec.ts`, `src/modules/sync/ui/SyncPage.tsx`): Abfrage des Dialogs und Messung in einem Schritt; der Platzhalter der Seite „Synchronisierung“ ist als beschäftigt markiert (`aria-busy`) wie auf allen anderen Seiten.
5. **CI** (`.github/workflows/ci.yml`): E2E-Jobs im offiziellen Image von Playwright (`mcr.microsoft.com/playwright:v<Version>-noble`); die Version kommt aus dem Lockfile über eine Ausgabe des ersten Jobs. `playwright install` entfällt. Zeitgrenzen 20 min für die Prüfungen und 30 min je E2E-Job, vorher 6 Stunden.
6. **Wiederholung auf Abruf** (`.github/workflows/repeat.yml`): die früher wackelnden Tests 20-mal hintereinander, ohne Wiederholung bei Fehlschlag, in Chromium und WebKit im selben Image. Auslöser: Label „wiederholen“ am Pull Request oder Start von Hand.

Keine Wiederholungen erhöht (`retries` bleibt 1 in der CI, 0 lokal).

### Geänderte Dateien

- Neu: `.github/workflows/repeat.yml`
- Geändert: `src/app/layout/tabLens.ts`, `src/modules/sync/ui/SyncPage.tsx`, `src/modules/nutrition/data/nutritionRepository.ts`, `.github/workflows/ci.yml`; Tests `e2e/tabbar.spec.ts`, `e2e/switches.spec.ts`, `e2e/marks.spec.ts`, `src/modules/nutrition/service/nutritionService.test.ts`
- Dokumente: `docs/decisions.md` (D-344), `docs/testing.md`, `docs/implementation-plan.md` (Punkt 66), `docs/CHANGELOG.md`; zum Nachtrag D-343 `docs/architecture.md` und `docs/known-limitations.md`

### Tests mit Ergebnis

Siehe `docs/testing.md`, Protokoll „Stabilität §2“.

### Offen

- Ergebnis der 20 Wiederholungen in der CI (Chromium und WebKit).

