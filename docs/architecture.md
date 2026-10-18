# Architektur

Stand: 18.10.2026 · Version 0.2 (Phase 2) · Status: zur Umsetzung freigegeben (vorläufig) · Vorgänger: `archive/v0.1-phase-1/architecture.md`

## Änderungen gegenüber Version 0.1

- Stack gegen die aktuellen Paketversionen geprüft (Stand 18.10.2026); Abweichungen gekennzeichnet (Abschnitt 2).
- Lokale Datenhaltung als Aggregat-Dokumente mit Projektionen (Abschnitt 5).
- Neu: Laufzeitkonzept des Trainings mit Timern, Wake Lock, Ton und Hintergrundverhalten (Abschnitt 6) und Fehler- und Wiederherstellungskonzept (Abschnitt 7).
- Hosting und feste Produktivadresse als eigener Abschnitt (Abschnitt 10).
- Sync-Verfahren konkretisiert: Aggregat als Sync-Einheit, generische Servertabelle, optimistische Nebenläufigkeit, HLC, 3-Wege-Merge (Abschnitt 11).

## 1. Ziele und Randbedingungen

- Web-App mit PWA zuerst, nutzbar auf iPhone, iPad und Mac (D-101); erste Version früh im Alltag nutzbar.
- Local-first ist verbindlich: Kernfunktionen laufen ohne Netz, lokale Daten sind führend (D-113).
- Optionale Synchronisierung über Supabase ohne eigenen Server; Konfliktregeln pro Entität (D-113, D-205).
- Ein Nutzer, keine kommerziellen Funktionen; modular und langfristig wartbar; keine unnötigen Abhängigkeiten (D-203).
- Historische Daten bleiben unverändert, wenn sich Stammdaten ändern (Snapshots, D-209).

## 2. Stack-Prüfung

Geprüft am 18.10.2026 gegen die npm-Registry, einschließlich Peer-Abhängigkeiten und Node-Anforderungen. Exakte Versionen werden in M0 über die Lockdatei festgeschrieben.

| Baustein | Vorgabe | Geprüfte Version | Verträglichkeit | Ergebnis |
|---|---|---|---|---|
| UI | React | 19.3.1 | Voraussetzung für React Router 8 (≥ 19.2.7) erfüllt | Übernommen |
| Sprache | TypeScript strict | 7.0.2 aktuell, 6.0.3 letzte 6er-Version | typescript-eslint 8.71 unterstützt nur TypeScript < 6.1 | **Abweichung: TypeScript 6.0** (D-201). Auswirkung: keine funktionale; Wechsel auf 7, sobald typescript-eslint es unterstützt |
| Build | Vite | 8.3.4 (Rolldown-basiert) | @vitejs/plugin-react 6.1 verlangt Vite 8; Tailwind-, PWA- und Vitest-Plugins unterstützen Vite 8 | Übernommen |
| Routing | React Router | 8.4.0 (Hauptversion seit 17.06.2026) | Data Mode und deklarativer Modus bestehen; nur noch ESM; `react-router-dom` entfällt; Node ≥ 22.22 | **Aktualisiert von v7 auf v8** (D-011); keine Auswirkung auf eine reine Browser-App |
| Styling | Tailwind CSS mit eigenen Tokens | 4.3.3 mit `@tailwindcss/vite` | Setzt Safari 16.4, Chrome 111, Firefox 128 voraus | Übernommen; Mindestziel iOS 18.4 liegt darüber (D-228) |
| Primitives | Radix | 1.3.x | React 19 unterstützt | Übernommen für Dialog, Popover, Dropdown, Tabs, Switch, Toast; Bottom-Sheet als eigene Komponente auf Basis des Radix-Dialogs |
| Lokale Datenbank | Dexie und IndexedDB | Dexie 4.4.6, dexie-react-hooks 4.4.0 | Reaktive Abfragen über `useLiveQuery` | Übernommen; Safari-Verbindungsverlust gesondert behandelt (D-216) |
| Validierung | Zod | 4.6.7 | – | Übernommen |
| Datum | date-fns | 4.4.0, optional `@date-fns/tz` 1.5 | – | Übernommen |
| Diagramme | Recharts | 3.10.1 | React 19 unterstützt | Übernommen; nur in Fortschritt und Übungsdetail nachgeladen |
| PWA | vite-plugin-pwa | 2.0.0 (seit 03.10.2026); 1.3 unterstützt nur Vite bis 7 | Workbox 7.4 | **Übernommen mit Auflage** (D-016): Offline-E2E-Tests in M0; Rückfallebene Vite 7 mit Plugin 1.3 |
| Unit-Tests | Vitest | 5.0.5 | Node ^22.12 oder ^24 | Übernommen |
| E2E-Tests | Playwright mit WebKit | 1.64.1 | In dieser Cloud-Umgebung ist nur Chromium installiert | **Übernommen mit Auflage** (D-210): WebKit in GitHub Actions; Gerätetests bleiben Pflicht |
| Sync, Anmeldung | Supabase | supabase-js 2.118 | Kostenloses Projekt pausiert nach 7 Tagen ohne Aktivität | Übernommen für R3 |
| Ergänzungen | – | lucide-react 1.59, clsx 2.1, workbox-window 7.4; Tests: fake-indexeddb 6.2, Testing Library 16.3; Lint: ESLint 10, typescript-eslint 8.71, eslint-plugin-react-hooks 7.1 | – | Klein und begründet (D-203); Modulgrenzen über `no-restricted-imports` (D-232) |
| Später (R2) | – | barcode-detector 3.2 (Polyfill auf zxing-wasm 3.1) | Safari bietet `BarcodeDetector` nicht standardmäßig | Vorgesehen (D-305) |

Node: lokal mindestens 22.22, in CI Node 24 LTS (D-202).

Bewusst nicht vorgesehen: Server-Rendering, globaler Zustandsspeicher, Formular-, i18n- und Drag-and-Drop-Bibliotheken im MVP, GraphQL, Microservices, Analytics.

## 3. Systemübersicht

```
+---------------------------------------------------------------------+
| Browser oder installierte Web-App (iPhone, iPad, Mac)               |
|                                                                     |
|  Oberfläche (React, React Router 8, Tailwind, Radix)                |
|     liest reaktiv (useLiveQuery)          ruft Anwendungsfälle      |
|                 |                                   |               |
|  Fachmodule: training · exercises · body · goals · settings         |
|              (später nutrition · recipes · activity · sync)         |
|     model (Zod) · calc (reine Funktionen) · service · data · ui     |
|                 |                                                   |
|  Dexie / IndexedDB  ── Aggregate, Projektionen, Meta, Fehlerprotokoll|
|  Snapshot-Datenbank ── Sicherungen vor riskanten Vorgängen          |
|  Gebündelte Stammdaten ── Basisübungen, Beispielvorlagen            |
|                                                                     |
|  Service Worker (Workbox): App-Shell, alle Code-Chunks, Stammdaten  |
+-----------------------------|---------------------------------------+
                              | HTTPS
           +------------------+--------------------+
           | Statisches Hosting mit fester Adresse |   R1
           +---------------------------------------+
           | Supabase: Auth, Postgres sync_documents, |   R3
           | Storage (Fotos, R5)                      |
           +---------------------------------------+
           | Open Food Facts (nach Einwilligung,    |   R2
           | direkt oder über Edge Function)        |
           +---------------------------------------+
```

Grundsatz: Die Oberfläche schreibt nie direkt an einen Server. Jede Änderung geht in die lokale Datenbank; die Sync-Engine (R3) gleicht asynchron ab. Online und offline verhält sich die App gleich.

## 4. Modulstruktur

```
src/
  app/            App-Shell, Router, Layouts (Tab-Leiste, Seitenleiste), Provider, Fehlergrenzen
  modules/
    dashboard/    „Heute": Zusammensetzung aus anderen Modulen
    training/     Programme, Vorlagen, Einheiten, Verlauf, Projektionen, Timer
    exercises/    Basisbibliothek (gebündelt), eigene Übungen, persönliche Angaben, Suche
    body/         Körpergewicht (R4: Maße, Fotos)
    goals/        Wochenziel, Zielgewicht
    settings/     Einstellungen, Profil, Installation, Über
    data/         Export, Import, Snapshots, Speicherstatus, Wiederherstellung
    nutrition/    R2
    recipes/      R2 (Rezepte, Wochenmenü, Einkaufsliste)
    activity/     R4 (Schritte, Gewohnheiten)
    sync/         R3
  shared/
    ui/           Designsystem-Komponenten
    lib/          HLC, IDs, Datum (dayKey), Einheiten, Formatierung, Textnormalisierung
    db/           Dexie-Datenbank, Basis-Repository, Snapshots, Gesundheitsprüfung
    i18n/         Typisierter deutscher Textkatalog
    testing/      Fixtures, Datengenerator, fake-indexeddb-Setup
public/           Manifest, Icons
e2e/              Playwright-Tests
tools/            Skripte (Matrix-Export, später BLS-Import)
docs/             Dokumentation
```

Jedes Fachmodul hat dieselbe Struktur: `model/` (Zod-Schemas, Typen), `calc/` (reine Funktionen), `data/` (Repositories), `service/` (Anwendungsfälle), `ui/` (Seiten, Komponenten), `index.ts` (öffentliche Schnittstelle).

Abhängigkeitsregeln, per ESLint-Regel `no-restricted-imports` mit den Pfad-Aliasen `@/shared` und `@/modules/<name>` erzwungen (D-232):

1. `ui` nutzt `service`, `data`, `model`, `calc`; nie umgekehrt.
2. `model` und `calc` importieren weder React noch Dexie noch Supabase.
3. Module importieren nur die `index.ts` anderer Module.
4. `shared` importiert nichts aus `modules`.
5. Die spätere Sync-Engine kennt Typen nur über eine Registrierung (Typname, Schema, Merge-Funktion).

## 5. Lokale Datenhaltung

- **Aggregate als Dokumente** (D-204): Eine Trainingseinheit mit Übungen und Sätzen ist ein Dokument. Jede Änderung ist eine Dexie-Transaktion „lesen, ändern, validieren, schreiben"; damit gibt es keine halben Zustände.
- **Projektionen:** `exerciseHistory` liefert vorherige Werte und Verläufe per Index `[exerciseId+completedAt]`. Sie wird in derselben Transaktion wie die Quelle aktualisiert und lässt sich jederzeit neu aufbauen.
- **Schreibzeitpunkte:** Aktionen (Satz erledigt, Übung hinzufügen) sofort; Tastatureingaben mit 300 ms Entprellung; beim Wechsel in den Hintergrund (`visibilitychange` auf „hidden", `pagehide`) sofortiges Schreiben ausstehender Werte. `beforeunload` und `unload` werden nicht genutzt, weil iOS sie nicht zuverlässig auslöst.
- **Verbindungsverlust in Safari** (D-216): Nach Rückkehr aus dem Hintergrund kann Safari die IndexedDB-Verbindung verlieren (WebKit-Fehler 197050, offen). Die App prüft bei `visibilitychange` auf „visible" und bei `pageshow` mit einem kleinen Lesezugriff. Schlägt er fehl, schließt und öffnet sie die Datenbank einmal neu. Gelingt auch das nicht, startet sie sich kontrolliert neu, bevor neue Eingaben möglich sind. Weil der Zustand vollständig in IndexedDB liegt, gehen gespeicherte Sätze dabei nicht verloren.
- **Dauerhafter Speicher:** Nach dem ersten gespeicherten Datensatz ruft die App `navigator.storage.persist()` auf und zeigt den Status sowie `navigator.storage.estimate()` unter Mehr › Daten (AK-PWA-05).
- **Snapshots** (D-217): Eigene Datenbank `fitness-snapshots`; Inhalt gzip-komprimiert über `CompressionStream`; Anlässe Schema-Upgrade, Import, „Alle Daten löschen"; die letzten fünf bleiben.
- **Gebündelte Stammdaten** (D-230): Basisübungen und Beispielvorlagen werden mit der App ausgeliefert, vom Service Worker vorgeladen und nicht in die Datenbank kopiert. IDs sind deterministisch, damit Verweise auf allen Geräten gleich sind.
- **localStorage** nur für unkritische Anzeigeeinstellungen ohne Verlustfolgen.

## 6. Laufzeitkonzept des Trainings

### 6.1 Lebenszyklus einer Einheit

| Zustand | Auslöser | Gespeichert |
|---|---|---|
| Laufend | „Starten" | Einheit mit Snapshot aller Übungen und Sätze, `startedAt`, `dayKey` |
| Pausiert | „Pausieren" | Offenes Pausenintervall |
| Laufend | „Fortsetzen" | Pausenintervall geschlossen |
| Abgeschlossen | „Training beenden" | `endedAt`, `durationSec`, offene Sätze als übersprungen, Projektion |
| Verworfen | „Training verwerfen" | Tombstone mit `deletedFrom = in_progress` |

Nach einem Neustart der App liest die Startseite die laufende Einheit aus der Datenbank, zeigt die Leiste „Training läuft" und führt mit einem Tipp zurück (AK-TRN-17).

### 6.2 Timer

- Gespeichert wird der Endzeitpunkt (`restTimer.endsAt`) bzw. der Startzeitpunkt eines Übungstimers (`setTimer.startedAt`), nie ein Zähler.
- Die Anzeige rechnet bei jedem Bildaufbau aus `Date.now()`; ein Intervall von 250 ms aktualisiert sie nur im Vordergrund.
- Bei `visibilitychange` auf „visible" wird sofort neu berechnet. War die Pause während der Abwesenheit abgelaufen, zeigt der Timer die Überziehung, zum Beispiel „+0:42".
- JavaScript wird unter iOS im Hintergrund und bei gesperrtem Bildschirm angehalten. Ein Signal zum Pausenende im Hintergrund ist deshalb nicht zugesagt (D-215, AK-TRN-12).

### 6.3 Ton

- Ein kurzer Ton über die Web Audio API, nur im Vordergrund und nur, wenn eingeschaltet. Der Audiokontext wird bei der ersten Bedienung im Training entsperrt, wie es Safari verlangt.
- Ist `navigator.audioSession` vorhanden, setzt die App den Typ „ambient", damit laufende Musik nicht unterbrochen wird. Der Stummschalter des iPhones bleibt dabei wirksam. Das Verhalten in Safari ist laut Berichten uneinheitlich und wird im Gerätetest T-IPH-M1 geprüft.
- Verworfen: stille Dauerwiedergabe, um die Seite im Hintergrund wach zu halten. Sie würde die Musik des Nutzers unterbrechen und ist laut Berichten unzuverlässig.
- Vibration steht unter iOS im Browser nicht zur Verfügung; die App erkennt das und bietet sie dort nicht an.

### 6.4 Bildschirm aktiv halten

- Während einer laufenden Einheit fordert die App `navigator.wakeLock.request('screen')` an, sofern eingeschaltet und verfügbar.
- In installierten Web-Apps funktioniert das unter iOS erst ab 18.4 (WebKit-Release-Notes 18.4). Darunter läuft die App ohne Wake Lock.
- Das Betriebssystem gibt den Wake Lock frei, sobald die Seite verborgen ist. Die App fordert ihn bei Rückkehr neu an und reagiert auf das `release`-Ereignis. Im Stromsparmodus kann iOS die Anforderung ablehnen; die Einstellung erklärt das.

## 7. Fehler- und Wiederherstellungskonzept

| Fall | Erkennung | Verhalten | Nachweis |
|---|---|---|---|
| Schreibfehler (z. B. Speicher voll) | Abgelehnte Dexie-Transaktion | Sofort sichtbarer Hinweis mit „Erneut versuchen"; der Satz erscheint nicht als gespeichert; Eintrag im Fehlerprotokoll | AK-TRN-25 |
| Verbindungsverlust nach Hintergrund | Gesundheitsprüfung bei Rückkehr | Einmal neu öffnen, sonst kontrollierter Neustart vor neuen Eingaben | AK-TRN-26 |
| Datenbank lässt sich nicht öffnen | Fehler beim Start | Wiederherstellungsbildschirm: Ursache, „Erneut versuchen", „Snapshot wiederherstellen", „Fehlerprotokoll exportieren", „Zurücksetzen" nur nach Export-Angebot und doppelter Bestätigung | AK-DAT-08 |
| Fehlgeschlagene Migration | Ausnahme im Upgrade | Upgrade bricht ab; der Snapshot von davor bleibt; Wiederherstellungsbildschirm | AK-DAT-06, AK-DAT-07 |
| Absturz einer Ansicht | React-Fehlergrenze je Route | Fehleransicht mit „Neu laden"; andere Bereiche bleiben nutzbar | AK-DAT-09 |
| Ungültige Importdatei | Zod-Prüfung vor dem Schreiben | Ablehnung ohne Änderung, mit Grund | AK-DAT-05 |
| Neue App-Version während des Trainings | Service Worker meldet Update | Hinweis erst nach Abschluss der Einheit; Aktivierung nur nach Bestätigung | AK-PWA-03 |
| Zweiter Tab mit älterer Version | Dexie-Ereignis `versionchange` | Der ältere Tab schließt seine Verbindung und bittet um Neuladen | Integrationstest |

Das Fehlerprotokoll speichert keine Nutzdaten: keine Gewichte, Namen, Notizen oder Nährwerte, nur Fehlerart, bereinigte Meldung, Hash des Stacks, Route und App-Version.

## 8. Routing und Navigation

React Router 8 im Data Mode mit `createBrowserRouter`; Bereiche werden per `lazy` nachgeladen. Deutsche Pfade ohne Umlaute (D-229).

| Route | Ansicht | Stufe |
|---|---|---|
| `/heute` | Dashboard | R1 |
| `/training` | Aktives Programm, nächster Tag, Wochenvorschau | R1 |
| `/training/programme`, `/training/programme/:id`, `/training/programme/:id/bearbeiten`, `/training/programme/:id/tage/:dayId` | Programme, Detail, Editor, Tag-Editor | R1 |
| `/training/vorlagen/:key` | Beispielvorlage | R1 |
| `/training/einheit/:id`, `/training/einheit/:id/zusammenfassung` | Trainingsplayer (Vollbild), Zusammenfassung | R1 |
| `/training/nachtragen` | Krafttraining nachtragen oder Aktivität erfassen | R1 |
| `/training/verlauf`, `/training/verlauf/:id` | Verlauf, Detail | R1 |
| `/uebungen`, `/uebungen/:id`, `/uebungen/neu` | Bibliothek, Detail, eigene Übung | R1 |
| `/fortschritt`, `/fortschritt/gewicht` | Fortschritt, Körpergewicht | R1 |
| `/mehr`, `/mehr/profil`, `/mehr/einstellungen`, `/mehr/daten`, `/mehr/installieren`, `/mehr/ueber` | Mehr und Unterseiten | R1 |
| `/ernaehrung/:datum`, `/lebensmittel`, `/rezepte`, `/plan/:woche`, `/einkauf/:id` | Ernährung | R2 |
| `/mehr/sync` | Synchronisierung | R3 |
| `/fortschritt/fotos`, `/fortschritt/masse`, `/gewohnheiten`, `/kalender` | Fortschritt, Aktivität | R4 |

Navigation: im MVP Tab-Leiste mit Heute, Training, Fortschritt, Mehr; am Desktop eine Seitenleiste mit denselben Bereichen (D-211). Details im Designsystem.

## 9. PWA-Strategie

- **Manifest:** `display: standalone`, Name und Kurzname (Arbeitstitel „Fitness", D-222), Icons in allen benötigten Größen inklusive Apple-Touch-Icon, Theme-Farben für Hell und Dunkel, `start_url` `/heute`, `scope` `/`.
- **Service Worker (Workbox über vite-plugin-pwa):** Vorab-Cache aller gebauten Dateien einschließlich aller nachgeladenen Code-Teile und der gebündelten Stammdaten; Navigations-Fallback auf die App-Shell; kein Cache für spätere API-Antworten, weil Daten in IndexedDB liegen.
- **Update:** `registerType: 'prompt'`. Eine neue Version wird geladen und erst nach „Jetzt aktualisieren" aktiv; während einer laufenden Einheit erscheint der Hinweis erst danach (AK-PWA-03).
- **Installationshilfe:** iOS bietet keinen Installationsdialog. Die App erkennt den Safari-Tab über `display-mode: standalone` und `navigator.standalone` und zeigt die Anleitung „Teilen › Zum Home-Bildschirm". Sie weist darauf hin, dass Daten im Browser-Tab getrennt von der installierten App gespeichert werden (AK-PWA-04).
- **Prüfung:** Lighthouse hat die PWA-Kategorie entfernt (D-221). Playwright prüft Manifest, Registrierung des Service Workers und den Offline-Start; zusätzlich prüfe ich die Installierbarkeit manuell in den Chrome-Entwicklerwerkzeugen.

## 10. Hosting und Auslieferung

- **Feste Produktivadresse:** IndexedDB-Daten gehören zu genau einer Adresse (Origin). Ein späterer Wechsel der Adresse oder Domain macht vorhandene Daten in der App unsichtbar; sie müssen dann per Export und Import umziehen. Die Adresse wird deshalb vor der ersten echten Nutzung festgelegt (Q-02).
- **Entscheidung:** Vercel im kostenlosen Hobby-Plan für persönliche Nutzung (D-231) mit Build aus dem privaten GitHub-Repository. Der Hauptzweig `main` wird zur Produktivadresse `<projekt>.vercel.app`, jeder andere Branch erhält eine Vorschau-Adresse. Vorschau-Adressen haben eigene, getrennte Daten und zeigen „Vorschau – Testdaten" (AK-PWA-07). Die Konfiguration liegt in `vercel.json` (Weiterleitung aller App-Routen auf `index.html`, Header, Caching). Supabase bietet kein eigenes Hosting für Web-Apps und dient erst ab R3 für Anmeldung und Sync. Cloudflare Pages bleibt eine gleichwertige Alternative; GitHub Pages scheidet für private Repositories im kostenlosen Plan aus.
- **Header:** Content Security Policy mit `default-src 'self'` als Ausgangspunkt; `style-src` mit `'unsafe-inline'`, weil Radix Positionierung über Inline-Styles setzt; `connect-src` ab R2 und R3 um die nötigen Hosts erweitert. Weitere Header: `Referrer-Policy: no-referrer`, `X-Content-Type-Options: nosniff`, `Permissions-Policy` mit Kamera nur ab R2. Für `sw.js` und `index.html` kein langes Caching.
- **Auslieferung:** Push auf den Hauptzweig → CI (Abschnitt 14) → Build → Deployment. Ein roter CI-Lauf verhindert die Auslieferung.

## 11. Synchronisierung (R3)

### 11.1 Entscheidung

Nach der Beziehungsanalyse in `data-model.md` Abschnitt 2 ist die Sync-Einheit das **Aggregat** (D-205). Eine Trainingseinheit mit allen Übungen und Sätzen wird als ein Dokument übertragen; unabhängige Einträge wie ein Körpergewicht sind Dokumente mit einem Element. Serverseitig genügt eine generische Tabelle `sync_documents` (Schema in `data-model.md` Abschnitt 12). Es gibt keinen eigenen Server; die Logik liegt in einer Postgres-Funktion und im getesteten Client.

### 11.2 Ablauf

1. **Lokale Änderung:** Das Dokument wird mit neuem HLC gespeichert; in derselben Transaktion entsteht ein Eintrag in der `outbox` (Typ, ID, Mutations-ID).
2. **Push:** Die Engine sendet Dokumente gebündelt an `push_documents` mit der zuletzt bekannten Serverrevision als Basis. Der Server nimmt an, wenn die Basis passt, und vergibt `rev + 1`. Eine wiederholte Mutations-ID gilt als Duplikat und ist unschädlich (Idempotenz).
3. **Konflikt:** Passt die Basis nicht, liefert der Server seine aktuelle Fassung. Der Client führt Basis, lokale und Serverfassung im 3-Wege-Merge nach den Regeln des Typs zusammen (`data-model.md` Abschnitt 7), speichert das Ergebnis, protokolliert es und sendet erneut.
4. **Pull:** Abfrage nach `server_updated_at` ab dem gespeicherten Cursor mit 60 Sekunden Überlappung, sortiert nach Zeit und ID. Die Überlappung fängt Transaktionen ab, die später committen als ihr Zeitstempel. Bereits bekannte Revisionen werden übersprungen. Der Cursor rückt erst nach erfolgreichem Schreiben vor.
5. **Auslöser:** App-Start, Rückkehr in den Vordergrund, Ereignis `online`, entprellt nach lokalen Änderungen, manuell. Hintergrund-Synchronisierung steht in Safari nicht zur Verfügung.
6. **Fehler:** Exponentielles Backoff je Outbox-Eintrag; nach mehreren Fehlversuchen „braucht Aufmerksamkeit" mit sichtbarem Hinweis; Fehlerprotokoll ohne Nutzdaten.
7. **Absturz:** Outbox, Basisfassungen und Cursor liegen in IndexedDB; die Engine setzt nach einem Neustart fort. Ein vollständiger Abgleich aller IDs ist jederzeit möglich.
8. **Erstes Gerät, weitere Geräte:** Beim Aktivieren lädt ein Gerät alle lokalen Dokumente hoch. Liegen auf dem Server Dokumente mit derselben ID, greift der 2-Wege-Merge (Importregeln).
9. **Status:** Die Oberfläche zeigt „abgeglichen", „ausstehend (n)", „offline" oder „Fehler" und unter Mehr › Sync ein Protokoll der Zusammenführungen.

### 11.3 Sicherheit und Daten bei Supabase

- Row Level Security auf `sync_documents` mit `user_id = auth.uid()` für alle Operationen; RLS-Tests gehören zur Abnahme von R3. Der öffentliche Anon-Key ist kein Geheimnis; der Service-Role-Key existiert nie im Client.
- Anmeldung per Magic Link oder Passkey; Abmelden löscht keine lokalen Fachdaten ohne Rückfrage.
- Bei aktivierter Sync liegen alle synchronisierten Nutzdaten bei Supabase: Training, Körperwerte, Einstellungen, später Ernährung. Die App erklärt das beim Aktivieren. Region EU (Frankfurt) als Standard (Q-09).
- Kostenloser Plan: Das Projekt pausiert nach 7 Tagen ohne Aktivität und muss manuell reaktiviert werden; es gibt keine automatischen Backups. Lokale Daten und Export bleiben deshalb die erste Sicherung. Laut einer Quelle ändert Supabase ab 30.10.2026 die Data API für bestehende kostenlose Projekte; das wird vor R3 geprüft.

## 12. Externe Integrationen

Siehe `data-sources.md`. Im MVP gibt es keine externen Datenabrufe. Ab R2 kommen BLS-Daten gebündelt und Open Food Facts nach Einwilligung hinzu.

## 13. Sicherheit und Datenschutz

- Datensparsamkeit: keine Telemetrie, keine Tracking- oder Analytics-SDKs (D-030).
- Keine Secrets im Client-Code; Konfiguration nur mit öffentlichen Werten.
- Externe Aufrufe sind dokumentiert (`data-sources.md` Abschnitt 8).
- Export enthält alle Daten im Klartext; die App weist beim Export darauf hin, die Datei sicher abzulegen.
- Keine medizinischen Aussagen; Berechnungen tragen Hinweise.

## 14. Qualität, Build und CI

- TypeScript strict, ESLint mit Modulgrenzen, Prettier.
- GitHub Actions (Node 24): Lint, Typprüfung, Unit- und Integrationstests, E2E mit Chromium und WebKit, Build, Prüfung von Manifest, Service Worker und Offline-Start, Bündelgröße der Startansicht.
- Tests und Nachweise: `testing.md`. Gerätetests nach Protokoll durch den Produktinhaber.
- Versionen nach SemVer; `CHANGELOG.md`; jede Schemaversion im Changelog.

## 15. Verworfene Alternativen

| Alternative | Grund |
|---|---|
| Native App, Capacitor oder React Native jetzt | Widerspricht „Web zuerst"; bleibt Option für HealthKit und Hintergrundtöne |
| Normalisierte Tabellen mit Synchronisierung pro Zeile | Teilweise übertragene Aggregate, Kaskaden, Servermigration je Tabelle (siehe `data-model.md` 2.2) |
| PowerSync, ElectricSQL | SQLite im Client und zusätzlicher Dienst; Reserve |
| Dexie Cloud | Anderer Anbieter als Supabase; Reserve |
| Server-Rendering | Kein Bedarf |
| Globaler Zustandsspeicher | IndexedDB mit `useLiveQuery` genügt |
| Stille Audiowiedergabe im Hintergrund | Unterbricht Musik, unzuverlässig |
| Lighthouse-PWA-Prüfung | Kategorie entfernt |

## 16. Risiken

| Risiko | Auswirkung | Gegenmaßnahme |
|---|---|---|
| Safari verliert die IndexedDB-Verbindung nach dem Hintergrund | Fehler beim Speichern | Gesundheitsprüfung, Neuöffnen, kontrollierter Neustart; sofortiges Schreiben (D-216) |
| Speicherdruck auf dem Gerät löscht Daten | Datenverlust ohne Sicherung | Installierte App, dauerhafter Speicher, Export-Erinnerung, Snapshots, später Sync |
| Kein Ton bei gesperrtem Bildschirm | Pausenende unbemerkt | Wake Lock, große Anzeige, Überziehungsanzeige; ehrlich dokumentiert |
| vite-plugin-pwa 2.0 ist neu | Fehler im Service Worker | Offline-E2E-Tests in M0; Rückfallebene Vite 7 |
| WebKit nicht in dieser Umgebung testbar | Safari-Fehler bleiben unentdeckt | WebKit in CI, Gerätetests |
| Wechsel der Produktivadresse | Daten unsichtbar | Adresse vor erster Nutzung festlegen; Export und Import |
| Eigene Sync-Engine | Konfliktfehler | Konflikttests K-01 bis K-21, Snapshots, Reserve PowerSync |
| Umfang wächst schneller als Qualität | Halbfertige Funktionen | Definition of Done, Matrix, kleine Arbeitspakete |

## 17. Auswirkungen der Änderungen gegenüber Version 0.1

- Die normalisierten Tabellen aus v0.1 entfallen zugunsten von Aggregat-Dokumenten. Für spätere Module bedeutet das keinen Umbau, weil die Sync-Einheit von Anfang an das Aggregat ist.
- TypeScript 6 statt 7 und React Router 8 statt 7 ändern keine Fachlogik.
- WebKit-Tests hängen am GitHub-Repository (Q-01).
- Die Release-Reihenfolge stellt die Synchronisierung vor Fortschritt, Aktivität und Gewohnheiten (D-219).
