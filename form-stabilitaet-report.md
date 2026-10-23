# Phase Stabilität – Bericht

Stand: 23.10.2026 · Branch `form-stabilitaet` (Basis `1dc1dd7`, `main` nach PR #49), Entwurfs-PR #50 · Auftrag: `docs/prompts/stabilitaet-FORM.md`. Aufbau wie `form-rebranding-report.md`.

Regeln: Keine neuen Funktionen außer den im Auftrag genannten. Ein Commit je Abschnitt mit D-Nummer, nach jedem Abschnitt Tests, sofort pushen. Texte nach `form-markenleitplanken.md`. Nur Getestetes gilt als fertig; Testergebnisse stehen wörtlich je Abschnitt.

---

## 1. Abschnitte

| Abschnitt | Ergebnis | Entscheidung | Stand |
|---|---|---|---|
| §1 E-16: Start nach Updates und ohne Netz | Ursache gefunden (Chromium bricht unter dem Service Worker Modul-Anfragen ab), Startwächter, einmal neu laden, Übernahme beim ersten Start, Update-Strategie, Test mit zwei Builds; Nachtrag nach der CI: drei Befunde in WebKit | D-343 | erledigt, WebKit zum Nachtrag in der CI |
| §2 Wackelnde Tests und CI | Ursachen gefunden und behoben: Linse hing an der Bildrate, Leertaste fiel in Chromium in das Ende eines Tipps, Messung am Seitenende vor dem Dialog der Anmeldung, Ernährungseinträge aus derselben Millisekunde ohne feste Reihenfolge; E2E-Jobs im Image von Playwright; Wiederholung auf Abruf | D-344 | erledigt; Nachträge: Seitenende auf `/ernaehrung`, Startwächter in WebKit (kein Vorladen in index.html, Bestätigung in der CI) |
| §3 Wiederherstellen aus dem Export | Datei wählen, prüfen, Zusammenfassung, zweimal bestätigen; vorher Sicherung als Datei und Snapshot; Ersetzen in einer Transaktion; Regeln für die Synchronisierung (K-01, K-03) | D-345 | erledigt, in WebKit (CI) bestanden; Gerätetest ausstehend |
| §4 Weitere P2-Befunde und B-07 | Behoben: A-04, A-07/E-02, A-08, B-03, B-04, B-05, B-07, C-02, C-03, D-01, D-02; teilweise: A-03, C-04, E-03; offen mit Grund: A-03 Rest, A-05, A-06, C-04 Rest, E-03 Rest; B-02 nach D-297 | D-346 | erledigt, WebKit in der CI |
| §5 Startansicht höchstens 235 KB | Textkatalog aufgeteilt: Texte nachgeladener Seiten und des Players in eigenen Dateien; 234,3 KB statt 239,5 KB, ohne neue Abhängigkeit | D-347 | erledigt, WebKit in der CI |

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

### Nachtrag: Befunde der CI zu `63d9428`

Die 20 Wiederholungen in der CI (Lauf 40005209039): Chromium 259 bestanden, 60 übersprungen, 1 fehlgeschlagen; WebKit 180 bestanden, 100 übersprungen, 40 fehlgeschlagen. Der E2E-Job in WebKit: 304 bestanden, 60 übersprungen, 2 fehlgeschlagen. Linse, Wasser-Schalter, Offline-Start und Barcode liefen in beiden Engines 20-mal ohne Fehlschlag.

| Test | Befund | Ursache | Behebung |
|---|---|---|---|
| „Seitenende: …“ auf `/ernaehrung` (Chromium, Pixel 7) | 1 von 20 rot: 807 statt höchstens 762,9; tiefster Inhalt war der Link der Wasser-Karte | Die Wasser-Karte lädt nach und hat keinen Platzhalter. Erschien sie zwischen der Prüfung „am Seitenende“ und der Messung, stand die Seite nicht mehr am Ende. Nachgestellt mit verzögerter Karte: zweimal je 5 von 61 Verzögerungen rot, einmal mit genau 807,05 | Prüfen und Messen in einem Schritt, erst wenn die Seite zweimal hintereinander gleich hoch ist; nachgestellt 61 von 61 grün |
| `start-watch.spec.ts` Fall 1 (WebKit, Desktop und Handy) | in der CI 2 von 2, in der Wiederholung 40 von 40 rot: Nach dem automatischen Neuladen startet die App nicht; Fall 2 (Neuladen per Knopf) grün | Diagnose in der CI (vier Fassungen des Neuladens, alle acht Läufe rot): Das zweite Dokument fragte den abgebrochenen Teil gar nicht erst an. WebKit behält ein fehlgeschlagenes Vorladen (`<link rel="modulepreload">`) im Speicher, solange die alte Seite lebt, und das neue Dokument übernimmt es; beim Knopf lag die alte Seite schon länger zurück | index.html lädt keine Module mehr vor; nachgeladene Bereiche weiter. Gegenprobe mit und ohne früheres Vorladen in der CI |

Dateien: `e2e/marks.spec.ts`, neu und vorübergehend `e2e/diagnose-start-watch.spec.ts`; `docs/decisions.md` (D-344, Nachtrag), `docs/testing.md`, `docs/implementation-plan.md`, `docs/CHANGELOG.md`.

Nachtrag 2 (Startwächter in WebKit): `vite.config.ts` (`build.modulePreload`), `e2e/diagnose-start-watch.spec.ts` als Gegenprobe, `docs/known-limitations.md`. Kosten: Beim ersten Aufruf ohne Service Worker fragt der Browser die Startmodule erst an, wenn er den Einstieg gelesen hat (eine Runde mehr); mit Service Worker kommen sie aus dem Zwischenspeicher. index.html wird 0,5 KB kleiner.

### Offen

- Startwächter in WebKit: Bestätigung der Behebung in der CI (Nachtrag 2).
- Nachgeladene Bereiche laden weiter vor; ob das einmalige Neuladen dort in WebKit bei einem Netzfehler hilft, ist nicht geprüft (`known-limitations.md`).

## 4. §3 Wiederherstellen aus dem Export

### Ausgangslage

Eine Exportdatei ließ sich nicht wieder einspielen (A-14). Wer die App vom Home-Bildschirm entfernt, das Gerät wechselt oder Speicher verliert, kam ohne Synchronisierung nicht an seine Daten.

### Ablauf

1. Mehr › Daten und Sicherung › „Sicherung wählen“.
2. FORM prüft die Datei. Bei einem Fehler nennt es den Grund und sagt: „An deinen Daten hat sich nichts geändert.“ Gründe: nicht lesbar, zu groß, keine Sicherung von FORM, beschädigt, von einer neueren Version, ungültiger Eintrag (mit seiner Art, nie mit Inhalt).
3. Zusammenfassung „In dieser Sicherung“: Stand, Zeitraum, Trainings, Ernährungseinträge, Aufgaben. Dazu der Hinweis, dass FORM alle Daten dieses Geräts ersetzt und vorher den aktuellen Stand als Datei sichert; mit Synchronisierung: „Beim nächsten Abgleich übernehmen deine anderen Geräte den wiederhergestellten Stand.“
4. „Wiederherstellen“, dann die Rückfrage „Daten ersetzen?“ mit „Sichern und ersetzen“. Auf einem leeren Gerät heißt sie „Sicherung übernehmen?“ mit „Übernehmen“; es gibt dann nichts vorher zu sichern.
5. FORM legt die Datei `fitness-sicherung-vor-wiederherstellung-…json` an (Teilen-Menü bzw. Download). Bricht man ab, ersetzt es nichts. Dann ein Snapshot, dann das Ersetzen in einer Transaktion. Während eines Trainings ist das gesperrt.

### Regeln

- **Alles oder nichts:** Schon ein ungültiger Eintrag lehnt die ganze Datei ab. Scheitert das Ersetzen mitten drin, ist nichts geändert.
- **Ältere Fassungen:** Schritte je Format und Dokumentart (bisher keine, weil es nur Format 1 und Schemaversion 1 gibt). Sicherungen älterer Datenbankversionen werden angenommen; Arten, die sie noch nicht kannten, gelten als leer.
- **Ersetzen:** Jedes Dokument der Sicherung bekommt einen neuen Stempel dieses Geräts; Löschmarken bleiben Löschmarken. Was nur lokal lag, bekommt eine Löschmarke. Ein abgeschlossenes Training dieses Geräts bleibt, wenn die Sicherung es noch laufend oder verworfen enthält (K-01, K-03). Die Projektion der Trainings wird neu geschrieben.
- **Synchronisierung:** Der eingespielte Stand ist die jüngste Änderung und geht an die anderen Geräte. Es bleiben die Regeln aus `data-model.md` 7.2: geänderte Programme und Rezepte eines anderen Geräts werden zur Konfliktkopie (K-09, K-17), ein dort abgeschlossenes Training gewinnt (K-01), dort neu Angelegtes bleibt. Einzelheiten: `data-model.md` 7.5 und D-345.

### Änderungen

- Neues Modul `src/modules/backup`: `model/backup.ts` (Hülle, Gründe, Zusammenfassung), `calc/check.ts` (Prüfung), `calc/migrate.ts` (Schritte für ältere Fassungen), `calc/summary.ts`, `calc/keep.ts` (K-01, K-03), `data/kinds.ts` (Dokumentarten aller Module), `service/restoreService.ts` (Lesen, Ersetzen), `ui/RestoreCard.tsx`.
- `src/shared/db/restore.ts`: `replaceDocuments`, eine Transaktion über alle Dokumenttabellen, Uhr und Projektion.
- Jedes Modul nennt seine Dokumentarten über `…DocDefs()` in seiner `index.ts`; sie laden erst bei Bedarf. `src/modules/sync/index.ts`: `loadSyncSignedIn` für den Hinweis.
- Texte in `src/shared/i18n/de-backup.ts` (eigene Datei, lädt mit der Seite).
- `src/modules/settings/ui/DataPage.tsx`: Karte unter „Daten exportieren“.

### Geänderte Dateien

- Neu: `src/modules/backup/` (wie oben, dazu `index.ts`, `backup.test.ts`, `ui/restore-card.test.tsx`), `src/shared/db/restore.ts`, `src/shared/i18n/de-backup.ts`, `e2e/restore.spec.ts`
- Geändert: `src/shared/db/index.ts`, `src/modules/{training,exercises,body,goals,settings,habits,nutrition,shopping,water,sync}/index.ts`, `src/modules/settings/ui/DataPage.tsx`
- Dokumente: `docs/decisions.md` (D-345), `docs/data-model.md` (7.4, 7.5, 11), `docs/architecture.md` (Modulstruktur), `docs/known-limitations.md`, `docs/testing.md`, `docs/feature-inventory.md` und CSV (SY-04), `docs/implementation-plan.md` (Punkt 66), `docs/CHANGELOG.md`, `audit-report.md` (A-14)

### Tests mit Ergebnis

Einzelheiten in `docs/testing.md`, Protokoll „Stabilität §3“.

| Test | Ergebnis |
|---|---|
| `backup.test.ts` (neu) | 23 bestanden; Gegenprobe K-01/K-03 mit abgeschalteter Regel 1 von 1 fehlgeschlagen |
| `restore-card.test.tsx` (neu) | 4 bestanden |
| `e2e/restore.spec.ts` (neu, Chromium Desktop und Pixel 7) | 2 bestanden |
| `pnpm test` | 109 Dateien, 952 Tests bestanden |
| `pnpm test:e2e` (Chromium) | 318 bestanden, 50 übersprungen, 0 fehlgeschlagen |
| `pnpm check:bundle` | Startansicht 239,4 KB von 250 KB |
| WebKit (CI zu `cc7c86b`) | `restore.spec.ts` bestanden; insgesamt 306 bestanden, 60 übersprungen, 2 fehlgeschlagen (nur der Startwächter, siehe Abschnitt 3) |

### Offen

- „Zusammenführen“ (AK-DAT-03): eine neue Funktion, nicht Teil dieses Auftrags.
- Snapshots über die App wiederherstellen (A-06).
- Gerätetest am iPhone (Dateien-App, Teilen-Menü).

## 5. §4 Weitere P2-Befunde und B-07

Reihenfolge wie in `audit-report.md` Abschnitt 5. Jede Behebung hat einen Test, der am alten Stand fehlschlägt (Gegenprobe in `docs/testing.md`, Protokoll „Stabilität §4“).

### Befunde und Behebung

| Befund | Ursache | Behebung | Test |
|---|---|---|---|
| A-03 Singletons verlieren Felder neuerer Versionen | Einstellungen, Profil und Trainingszustand bauten das Dokument beim Speichern aus den geprüften Feldern neu auf; was das Schema nicht kannte, fiel weg | `unknownFields` hängt sie wieder an; ein bekanntes Feld, das eine Änderung entfernt, bleibt entfernt | 3 neue Fälle, Gegenprobe 3 rot |
| A-04 Konfliktkopie mit zu langem Namen | `conflictName` kürzte auf 70 Zeichen und hängte 22 an; Programme erlauben 80 | Kürzung auf 80 Zeichen samt Zusatz (`CONFLICT_NAME_MAX`) | Grenzfälle 58 bis 80 Zeichen gegen die Schemas, Gegenprobe rot (81 > 80) |
| A-07/E-02 Dauerhafter Speicher nur im Training | Einziger Aufruf in der Leiste „Training läuft“ | Nach dem ersten gespeicherten Dokument (über `onDocumentWritten` der Laufzeit), nach einem Abgleich mit abgeholten Daten und nach dem Wiederherstellen | Unit-Test und `e2e/persist.spec.ts`, Gegenprobe rot |
| A-08 Kontowechsel mischt Daten | Anmeldung mit einem anderen Konto setzte nur Cursor und Basis zurück; danach gingen alle lokalen Daten an das neue Konto | Abbruch mit Hinweis, solange Daten auf dem Gerät liegen; die neue Anmeldung wird beendet | 3 neue Fälle, Gegenprobe 2 rot |
| B-03 Fortschritt an Positionen | Zuordnung der Einheiten über Woche und Tag als Position | Über die ID des Tages, nur ohne ID über die Position; ebenso die Nummer des Tages | 4 neue Fälle, Gegenprobe rot |
| B-04 Ein ungültiges Training legt die App lahm | `findActiveSession` prüfte streng; der Fehler landete über die Leiste in der Fehleransicht der App | Ungültige laufende Einheiten übergehen und einmal protokollieren; jede Leiste mit eigener Fehlergrenze | 3 neue Fälle, Gegenprobe 3 rot |
| B-05 „Übung ersetzen“ scheitert | Ein offener Drop-Satz wanderte ohne seinen übersprungenen Arbeitssatz und verlor den Bezug | Drop-Satz nur mit seinem Arbeitssatz | Gegenprobe rot (ZodError) |
| B-07 Start aus Programm ohne Meldung | Plan im Klick-Handler außerhalb der Fehlerbehandlung | Plan entsteht in `useStartSession`; Meldung, Protokoll, Knopf bleibt bedienbar | Gegenprobe rot |
| C-02 Doppeltipp speichert doppelt | Kein Sperrzustand in drei Dialogen | `useSubmitOnce` | 2 Fälle, Gegenprobe rot (2 statt 1) |
| C-03 Scanner: spätes Ergebnis nach „Schließen“ | Kein Abbruch-Kennzeichen | Ergebnis nach „Schließen“ ignoriert | Gegenprobe rot |
| C-04 Doppelte Arbeit beim Laden | Suchindex je Seite neu; Wassertag lud alle Einträge ab dem Tag | Index einmal je Import; Tag mit `equals(day)` | 2 Fälle; keine fachliche Gegenprobe, das Verhalten ist gleich |
| D-01 Kein Vergleich für Aufgaben an Wochentagen | Schwelle relativ zur Länge des Zeitraums; Hinweise nur für heute fällige Aufgaben | Schwellen anteilig zu den Wochentagen; Hinweise für alle laufenden Aufgaben | 2 Fälle, Gegenprobe rot |
| D-02 Zugänge in Snapshots | Snapshot kopierte `meta` vollständig | `sync.auth` und `steps.…` bleiben draußen | Gegenprobe rot |
| E-03 Voller Speicher blockiert das Upgrade | Snapshot fügte erst ein und kürzte danach; „Speicher voll“ unbekannt | Erst kürzen; bei vollem Speicher einmal den ältesten löschen; Ursache im Wiederherstellungsbildschirm | Gegenprobe rot |

### Geänderte Dateien

- Neu: `src/modules/nutrition/ui/useSubmitOnce.ts`; Tests `src/modules/training/data/trainingStateRepository.test.ts`, `src/modules/training/data/sessionRepository.test.ts`, `src/modules/training/ui/start-from-program.test.tsx`, `src/app/banners/banner-boundary.test.tsx`, `src/modules/nutrition/ui/barcode-flow.test.tsx`, `src/modules/nutrition/ui/use-food-catalog.test.ts`, `src/modules/steps/data/stepsState.test.ts`, `e2e/persist.spec.ts`
- Geändert: `src/shared/db/{documents,repository,runtime,snapshots,meta}.ts`, `src/main.tsx`, `src/app/RecoveryScreen.tsx`, `src/app/banners/GlobalBanners.tsx`, `src/shared/i18n/{de,de-sync}.ts`; `src/modules/settings/data/{settingsRepository,profileRepository}.ts`; `src/modules/training/{calc/programProgress,data/trainingStateRepository,data/sessionRepository,service/sessionService,ui/useStartSession,ui/ActiveProgramCard,ui/SampleTemplatePage,ui/SummaryPage}.ts(x)`; `src/modules/dashboard/ui/TodayPage.tsx`; `src/modules/sync/{service/syncEngine,service/syncService,ui/SyncPage}.ts(x)`; `src/modules/backup/service/restoreService.ts`; `src/modules/nutrition/ui/{AddFoodPage,TemplateDialogs,BarcodeFlow,useFoodCatalog}.ts(x)`; `src/modules/habits/{calc/days,calc/insights,ui/TaskStats,ui/TaskDetailPage}.ts(x)`; `src/modules/water/{data/waterRepository,data/useWater,service/waterService,ui/WaterCard,ui/WaterPage}.ts(x)`; bestehende Tests ergänzt
- Werkzeug: `tools/check_docs.py` (Verweise `C-…` gelten auch für Befunde aus `audit-report.md`)
- Dokumente: `docs/decisions.md` (D-346), `audit-report.md` (Status), `docs/testing.md`, `docs/known-limitations.md`, `docs/architecture.md`, `docs/data-model.md`, `docs/requirements.md` und `docs/implementation-plan.md` (B-02 vermerkt, Punkt 66), `docs/CHANGELOG.md`

### Tests mit Ergebnis

Einzelheiten in `docs/testing.md`, Protokoll „Stabilität §4“.

| Test | Ergebnis |
|---|---|
| neue und ergänzte Unit-Tests | alle bestanden; Gegenprobe je Befund rot (außer C-04, siehe oben) |
| `pnpm test` | 116 Dateien, 984 Tests bestanden |
| `pnpm check:bundle` | Startansicht 239,5 KB von 250 KB |
| `pnpm test:e2e` (Chromium) | 324 bestanden, 50 übersprungen, 0 fehlgeschlagen |
| WebKit | in der CI zu diesem Abschnitt |

### Offen

- **A-03 Rest:** strikte Kindschemas und neue Aufzählungswerte. Betrifft erst die nächste Schemaerweiterung; tolerante Leseschemas und eine Prüfung von `schema_version` im Abgleich sind ein eigenes Paket (verwandt mit A-01).
- **A-05:** Das SQL des Servers (`push_documents`) liegt nicht im Repository; eine Sperre je Nutzer wäre eine Änderung an der Datenbank des Servers und braucht deine Zustimmung.
- **A-06 und Rest von E-03:** Snapshot über die App wiederherstellen, Export und Fehlerprotokoll im Wiederherstellungsbildschirm. Eigenes Paket; das Wiederherstellen aus dem Export (§3) deckt den Gerätewechsel ab.
- **C-04 Rest:** Jede Seite mit Suche liest den Katalog aus IndexedDB (rund 0,6 MB). Ohne Messung am Gerät; die Abhilfe bräuchte einen eigenen kleinen Eintrag für den Stand des Imports, also eine Änderung am Datenmodell.
- **B-02:** Pausieren bleibt bis Phase B offen (D-297).
- Kleinere Reste: D-01 `compareNone` nach Grund, D-02 Erneuern vor dem Abmelden beim Dashboard, B-07 fehlende Übungen im Programm-Detail markieren, C-03 erneutes Scannen nach Treffer (P3).

## 6. §5 Startansicht höchstens 235 KB

### Ausgangslage

239,5 KB (gzip) nach §4, Ziel höchstens 235 KB. Aufteilung nach Quelldateien (Sourcemaps): react-dom 63,7 KB, Dexie 30,9 KB, React Router rund 28 KB, Zod rund 23 KB, Textkatalog `de.ts` 11,6 KB, Linse der Tab-Leiste 2,5 KB, sonst je Datei unter 2 KB. Der Katalog war der größte Teil aus dem eigenen Code; er lud mit der Startansicht, obwohl die meisten Texte zu nachgeladenen Seiten gehören.

### Änderungen

- Neue Kataloge nach dem Muster von D-288: `de-more.ts` (Mehr, Profil, Einstellungen, Daten, Installieren, Über die App, Schritte), `de-training-pages.ts` (Nachtragen, Verlauf, Zusammenfassung, Fortschritt, Pausenanzeige), `de-tasks.ts` (Tagesaufgaben), `de-session.ts` (Player). `t.session` behält nur Fortschritt der Sätze und Muskeln für die Startansicht.
- Die Aufrufer nutzen den neuen Katalog (`tMore.settings…` statt `t.settings…`); die Typprüfung findet jeden.
- `wording.test.ts` prüft alle Kataloge, dazu `de-backup.ts` aus §3, das dort fehlte.
- Verworfen: `"sideEffects"` in `package.json` (240,2 KB).

### Ergebnis

234,3 KB von 250 KB; der Katalog in der Startansicht 6,2 statt 11,6 KB. Keine neue Abhängigkeit, kein geänderter Ablauf.

### Geänderte Dateien

- Neu: `src/shared/i18n/{de-more,de-training-pages,de-tasks,de-session}.ts`
- Geändert: `src/shared/i18n/de.ts`, die Aufrufer in `src/modules/{goals,training,progress,settings,sync,steps,habits,exercises,body}/ui/…`, `src/app/wording.test.ts`
- Dokumente: `docs/decisions.md` (D-347), `docs/architecture.md`, `docs/testing.md`, `docs/implementation-plan.md`, `docs/CHANGELOG.md`

### Tests mit Ergebnis

Einzelheiten in `docs/testing.md`, Protokoll „Stabilität §5“.

| Test | Ergebnis |
|---|---|
| `pnpm check:bundle` | 234,3 KB von 250 KB |
| `pnpm test` | 116 Dateien, 984 Tests bestanden |
| `pnpm test:e2e` (Chromium) | 324 bestanden, 50 übersprungen, 0 fehlgeschlagen |
| WebKit | in der CI zu diesem Abschnitt |

### Offen

- Abstand zum Ziel 0,7 KB. Weitere Kandidaten ohne neue Abhängigkeit: die Abschnitte `programs` und `exercises` im Katalog (zusammen rund 11 KB roh), von denen die Startansicht nur wenige Schlüssel braucht, und die Linse der Tab-Leiste (2,5 KB), die erst bei der ersten Berührung gebraucht wird.

