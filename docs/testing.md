# Teststrategie und Testprotokolle

Stand: 18.10.2026 · Version 0.3 (M0 umgesetzt) · Status: verbindlich ab M0 · Vorgänger: `archive/v0.1-phase-1/testing.md`

## Änderungen gegenüber Version 0.1

- Nachweisarten U, I, E, G an die MVP-Akzeptanzkriterien gebunden (`requirements.md` Abschnitt 6).
- Testumgebung präzisiert: WebKit läuft in GitHub Actions, nicht in dieser Cloud-Umgebung.
- Lighthouse-PWA-Prüfung ersetzt durch eigene PWA-Prüfungen (D-221).
- Neu: Geräteprotokolle T-IPH-M0, T-IPH-M1, T-IPH-M4, T-IPD-M4, T-MAC-M4 und Konflikttests K-01 bis K-21.
- Version 0.3 (M0): E2E-Läufe mit den Produktions-Headern (D-237) und Abbruch bei Konsolenfehlern; CI-Gates technisch umgesetzt (Abschnitt 5); Ergebnisse von M0 in Abschnitt 10.
- Nachtrag M0: Ursache und Behebung unzuverlässiger E2E-Tests in Chromium (Abschnitt 10); E2E-Fehler erscheinen in der CI zusätzlich als GitHub-Annotationen (Abschnitt 5).

## 1. Grundsätze

- Ein Kriterium gilt erst als erfüllt, wenn alle zugeordneten Nachweise bestanden sind.
- Ergebnisse werden wörtlich berichtet. Fehlschläge stehen mit Ausgabe im Bericht.
- Berechnungen und Anwendungsfälle werden ohne Oberfläche getestet; Abläufe mit Playwright; Safari-spezifisches Verhalten auf echten Geräten.
- Keine echten personenbezogenen Daten in Tests oder im Repository.

## 2. Nachweisarten und Werkzeuge

| Kürzel | Art | Werkzeug | Umgebung |
|---|---|---|---|
| U | Unit-Test | Vitest 5 | Lokal und CI |
| I | Integrationstest mit IndexedDB | Vitest mit fake-indexeddb 6 | Lokal und CI |
| E | E2E-Test | Playwright 1.64, Chromium und WebKit, Profile iPhone und Desktop | Chromium lokal und in CI; WebKit nur in CI |
| G | Gerätetest | Protokolle in Abschnitt 6 | iPhone, iPad, Mac des Produktinhabers |

Ergänzend: Testing Library für Komponenten, axe-core in Playwright für Barrierefreiheit, eigenes Kontrastskript für Tokens.

## 3. Testumgebungen und Grenzen

- **Diese Cloud-Umgebung:** Node 22.22; Chromium (Playwright-Build 1194) unter `/opt/pw-browsers` vorinstalliert; WebKit fehlt. `playwright install` darf hier nicht laufen. Lokale E2E-Läufe nutzen Chromium über `executablePath`.
- **GitHub Actions:** Node 24; `npx playwright install --with-deps chromium webkit`; alle E2E-Tests in beiden Engines (D-210).
- **Playwright-WebKit ist nicht Safari auf iOS.** Es deckt Rendering und Standardverhalten von WebKit ab, nicht aber Home-Bildschirm-Modus, Speicherisolation, Anhalten im Hintergrund, Wake Lock, Audio-Session oder Installation. Diese Punkte prüfen nur die Geräteprotokolle.
- **Lighthouse** hat die PWA-Kategorie entfernt. Stattdessen prüft Playwright: Manifest gültig und verlinkt; Service Worker registriert und kontrolliert die Seite nach Reload; jede MVP-Route lädt offline (Netzwerk im Browserkontext abgeschaltet).
- **Produktionsnahe E2E-Läufe:** Playwright testet den Build über `vite preview`. Die Vorschau sendet dieselben Sicherheits-Header wie Vercel, gelesen aus `vercel.json` (D-237). Jeder Test schlägt fehl, sobald der Browser einen Konsolenfehler meldet; so fallen auch CSP-Verstöße auf.
- **Service Worker und Offline-Start** prüft der E2E-Test in Chromium. In WebKit wird dieser Test übersprungen; dort gilt das Geräteprotokoll T-IPH-M0.

## 4. Testinhalte

### 4.1 Berechnungen (U, Ziel: alle Zweige)

Volumen je Satztyp und Erfassungsart · bester Satz · geschätztes 1RM (Grenzen 1, 2, 10, 11 Wiederholungen) · Dauer mit Pausen · nächster Trainingstag (Wochengrenzen, Ende mit und ohne Wiederholen, gelöschter Tag) · „Heute geplant" · Wochenziel über Wochen- und Jahreswechsel · Gewichtstrend und Veränderung (unter 3 Einträgen, unter 7 Tagen Abstand) · Plausibilität Körpergewicht · Zuordnung vorheriger Werte inklusive Drop-Ketten · HLC (Monotonie, Gleichstand, fremde Stempel, Uhrrücksprung) · UUID v5 · Textnormalisierung (Umlaute, ae, Bindestriche) · Zahleneingabe mit Komma und Punkt · Formatierung de-AT und de-DE · `dayKey` um Mitternacht und bei Zeitumstellung.

### 4.2 Persistenz (I)

Repositories mit Tombstones · Transaktion „Training starten" atomar · „Satz erledigt" schreibt Satz und Timer gemeinsam · Projektion bei Abschluss, Bearbeitung, Löschung · Neuaufbau der Projektion · Snapshot vor Upgrade · Migrationstest je Schemaversion mit Fixture der Vorversion · Export und Import (leere Datenbank, Zusammenführen, Ersetzen, ungültige Datei) · simulierter Schreibfehler · simulierte geschlossene Datenbank mit Neuöffnen.

### 4.3 Abläufe (E, Chromium und WebKit, iPhone- und Desktop-Profil)

| Nr. | Ablauf | AK |
|---|---|---|
| E-01 | Beispielvorlage starten, Aufwärm- und Arbeitssätze erfassen, Pause, beenden, Zusammenfassung, Verlauf | AK-TRN-01, -03, -06, -07, -10, -19, -20, AK-HIS-01, -02 |
| E-02 | Freies Training mit hinzugefügten Übungen und Sätzen, freie Reihenfolge | AK-TRN-02, -08, -09 |
| E-03 | „Erledigt", sofortiger Reload; Eingabe, 0,6 s warten, Reload | AK-TRN-16, -17 |
| E-04 | Timer: Restzeit nach Reload und nach simuliertem Sichtbarkeitswechsel, Überziehung | AK-TRN-11 |
| E-05 | Offline: Netzwerk aus, Training erfassen, Netzwerk an | AK-PWA-02, AK-TRN-17 |
| E-06 | Zweiter Start bei laufender Einheit | AK-TRN-22 |
| E-07 | Verwerfen und Rückgängig | AK-TRN-21 |
| E-08 | Ungültige Eingaben bei Gewicht und Wiederholungen | AK-TRN-04 |
| E-09 | Vorherige Werte über zwei Einheiten | AK-TRN-05 |
| E-10 | Programm anlegen, Wochen und Tage, Übungen sortieren, ersetzen, Satzschema mit Drop-Sätzen | AK-PRG-01 bis -04 |
| E-11 | Duplizieren, Vorlage speichern und verwenden, Beispielvorlage schreibgeschützt | AK-PRG-05, -06 |
| E-12 | Aktivieren, nächster Tag, anderer Tag, Wochentag-Hinweis | AK-PRG-07 bis -09, AK-DSH-02 |
| E-13 | Programmänderung lässt laufende und abgeschlossene Einheit unverändert | AK-PRG-10 |
| E-14 | Programmdatei exportieren und importieren | AK-PRG-13 |
| E-15 | Übungstimer, Pausieren, Notizen, Nachtragen | AK-TRN-14, -18, -23, -24 |
| E-16 | Verlauf bearbeiten und löschen, Projektion aktualisiert | AK-HIS-03, -04 |
| E-17 | Körpergewicht erfassen, bearbeiten, löschen; Diagramm mit 2, 3 und vielen Einträgen; Tooltip-Wert gleich Rohwert; Tabellenansicht | AK-BW-01 bis -06 |
| E-18 | Übungsdiagramm mit 2 und 3 Einheiten | AK-HIS-05 |
| E-19 | Dashboard in allen Zuständen | AK-DSH-01 bis -08 |
| E-20 | Ziele, Einstellungen, Ersteinrichtung | AK-SET-01, -02, -05, AK-ONB-01 |
| E-21 | Export; Import in leere Datenbank; Zusammenführen; Ersetzen mit Snapshot | AK-DAT-01 bis -06 |
| E-22 | Wiederherstellungsbildschirm (simulierter Öffnungsfehler); Fehlergrenze | AK-DAT-08, -09 |
| E-23 | Update-Hinweis, kein Wechsel während laufender Einheit | AK-PWA-03 |
| E-24 | Netzwerkprotokoll: nur eigene Adresse | AK-PWA-06 |
| E-25 | Safari-Tab-Hinweis (simuliert), Vorschau-Etikett | AK-PWA-04, -07 |
| E-26 | Klicktest aller sichtbaren Aktionen je Ansicht | AK-UX-01, -02 |
| E-27 | axe-Prüfung hell und dunkel, Tastaturbedienung, Kürzel, reduzierte Bewegung | AK-UX-04, -05, -08, AK-SET-03 |
| E-28 | Layouts iPhone, iPad hoch und quer, Desktop | AK-UX-03, -07 |
| E-29 | Leistung mit fünf Jahren generierter Daten | AK-UX-06, AK-HIS-01 |

### 4.4 Konflikttests (ab R1 für den Import, ab R3 für die Sync)

| Nr. | Fall | Erwartung |
|---|---|---|
| K-01 | Gerät A schließt eine Einheit ab, Gerät B hält eine veraltete laufende Kopie | Ergebnis ist abgeschlossen |
| K-02 | Beide schließen ab | Endzeit und Dauer der jüngeren Fassung |
| K-03 | B verwirft die veraltete laufende Kopie, A hat abgeschlossen | Einheit bleibt erhalten |
| K-04 | A löscht eine abgeschlossene Einheit, B ändert später eine Notiz | Jüngere Änderung gewinnt, Wiederherstellung protokolliert |
| K-05 | Satz auf A erledigt, auf B gleichzeitig übersprungen | Erledigt |
| K-06 | Beide erledigen denselben Satz mit verschiedenen Werten | Werte der jüngeren Fassung, nicht gemischt |
| K-07 | A löscht einen Satz, B hat ihn erledigt | Satz bleibt |
| K-08 | Notiz auf beiden geändert | Jüngere gewinnt |
| K-09 | Programm auf beiden geändert | Serverfassung plus Konfliktkopie |
| K-10 | Aktives Programm auf beiden gewechselt | Jüngere Aktivierung; Historie vereinigt |
| K-11 | Verschiedene Einstellungen auf beiden geändert | Beide Änderungen erhalten |
| K-12 | Neues Ziel auf beiden | Beide Einträge; aktiv nach Regel |
| K-13 | Körpergewicht gelöscht gegen geändert | Jüngere gewinnt |
| K-14 | Eigene Übung auf beiden geändert | Feldweise, jüngere bei gleichem Feld |
| K-15 bis K-21 | Regeln für R2 bis R4 aus `data-model.md` Abschnitt 7.2 | Werden mit der jeweiligen Stufe umgesetzt |

## 5. CI-Gates

Jeder Pull Request und jeder Push auf `main` (Arbeitszweige laufen über ihren Pull Request, damit nichts doppelt läuft): Lint, Typprüfung, Unit- und Integrationstests mit Abdeckung (`calc/` ≥ 95 %, `service/` und `data/` ≥ 85 % Zeilen), E2E in Chromium und WebKit, Build, PWA-Prüfungen aus Abschnitt 3, Bündelgröße der Startansicht unter 250 KB komprimiert, Kontrasttest der Tokens. Ein roter Lauf blockiert Merge und Auslieferung.

Umsetzung (M0) in `.github/workflows/ci.yml`:

| Gate | Befehl | Stand |
|---|---|---|
| Formatierung, Lint mit Modulgrenzen, Typprüfung | `pnpm format:check`, `pnpm lint`, `pnpm typecheck` | Umgesetzt |
| Unit-, Integrations- und Komponententests mit Abdeckungsschwellen | `pnpm test:coverage` (Schwellen in `vitest.config.ts`: `shared/lib` und `calc/` ≥ 95 %, `shared/db`, `data/` und `service/` ≥ 85 % Zeilen) | Umgesetzt |
| Kontrasttest der Tokens | Teil von `pnpm test:coverage` (`tokens.test.ts`) | Umgesetzt |
| Dokumentprüfungen | `pnpm check:docs` | Umgesetzt |
| Build und Bündelgröße der Startansicht | `pnpm build`, `pnpm check:bundle` (Grenze 250 KB gzip) | Umgesetzt |
| E2E in Chromium und WebKit einschließlich PWA-Prüfungen | `pnpm test:e2e` je Engine | Umgesetzt. In der CI wird ein fehlgeschlagener Test einmal wiederholt; Fehler erscheinen zusätzlich als GitHub-Annotationen (Reporter `github`), weil die Logdateien aus der Cloud-Umgebung nicht abrufbar sind. `openPage` wartet, bis die Überschrift sichtbar ist und kein Bereich mehr `aria-busy` trägt |

## 6. Geräteprotokolle

Jedes Protokoll wird mit Datum, Gerät, Betriebssystemversion, App-Version und Ergebnis je Schritt in Abschnitt 7 eingetragen (AK-DEV-03). Ich werte die Befunde aus und übertrage Abweichungen in `known-limitations.md`.

### T-IPH-M0 · iPhone, Installation und Offline-Start

1. Produktivadresse `https://fitness-app-mu-drab.vercel.app` in Safari öffnen. Erwartung: Hinweis zur Installation und zur Datentrennung.
2. „Teilen › Zum Home-Bildschirm" ausführen, App vom Home-Bildschirm starten. Erwartung: Vollbild ohne Browserleiste, Name und Icon korrekt.
3. Flugmodus ein, App beenden und neu starten. Erwartung: Alle Bereiche öffnen sich ohne Fehler.
4. Nach einer zweiten Auslieferung App öffnen. Erwartung: Hinweis „Neue Version verfügbar"; Wechsel erst nach Bestätigung.

### T-IPH-M1 · iPhone, Training unter Alltagsbedingungen

Vorbereitung: iOS-Version notieren; App installiert und einmal online gestartet; Automatische Sperre auf 30 Sekunden; Musik-App mit laufender Wiedergabe für die Schritte 5 und 7; Stellung des Stummschalters notieren.

| Schritt | Handlung | Erwartung | Zu notieren |
|---|---|---|---|
| 1 | Beispielvorlage „Ganzkörper A/B" öffnen, „Nur heute trainieren" für Tag A | Einheit läuft, alle Übungen sichtbar | – |
| 2 | Zwei Aufwärmsätze und einen Arbeitssatz Kniebeuge erfassen, Gewicht mit Komma (z. B. 62,5) | Werte gespeichert; Pausentimer startet | – |
| 3 | Während des Timers die App im App-Umschalter beenden und neu starten | Einheit, Sätze und Timer (Restzeit oder Überziehung) vorhanden; Leiste „Training läuft" | – |
| 4 | Satz erledigen, Bildschirm sperren, 3 Minuten warten, entsperren | Satz vorhanden; Timer zeigt Überziehung | Gab es bei gesperrtem Bildschirm ein Signal? |
| 5 | Satz erledigen, zur Musik-App wechseln, 5 Minuten warten, zurückkehren | Wie Schritt 4; Datenbank funktioniert ohne Fehlermeldung | Signal im Hintergrund? Musik unterbrochen? |
| 6 | Während einer Pause 2 Minuten nichts berühren | Bildschirm bleibt an (Wake Lock) | Bildschirm dunkel geworden? Stromsparmodus aktiv? |
| 7 | Pausentimer im Vordergrund ablaufen lassen: Stummschalter aus, Stummschalter an, mit laufender Musik | Visuelle Anzeige immer | Ton hörbar? Musik unterbrochen oder leiser? |
| 8 | Flugmodus ein, drei Sätze erfassen, Übung hinzufügen, Flugmodus aus | Alles funktioniert; keine Fehlermeldung | – |
| 9 | Gewicht ändern, 1 Sekunde warten, App beenden, neu starten | Geänderter Wert gespeichert | – |
| 10 | Training mit offenen Sätzen beenden | Rückfrage; Zusammenfassung mit Volumen ohne Aufwärmsätze; Einheit im Verlauf | – |
| 11 | Zweite Einheit mit derselben Übung starten | Vorherige Werte mit Datum sichtbar | – |
| 12 | Mehr › Daten › Exportieren, „In Dateien sichern" | Datei mit Datum im Namen in der Dateien-App | – |
| 13 | Mehr › Daten | Status des dauerhaften Speichers und Verbrauch sichtbar | Status „dauerhaft" ja oder nein |

### T-IPH-M4 · iPhone, Regression und MVP

Schritte 1 bis 13 aus T-IPH-M1, zusätzlich: eigenes Programm anlegen und trainieren; Körpergewicht an drei Tagen erfassen und Diagramm prüfen; Dashboard in allen Zuständen; Dunkelmodus; Import der Exportdatei in eine frisch installierte App (Datenvergleich); VoiceOver-Grundprüfung des Trainingsplayers.

### T-IPD-M4 · iPad

Installation; Hoch- und Querformat; Split View; externe Tastatur mit allen Kürzeln aus AK-UX-05; kurzer Trainingsablauf; Programm-Editor zweispaltig.

### T-MAC-M4 · Mac

Safari „Zum Dock hinzufügen" und Chrome-Installation; Fenstergrößen von 1024 px bis Vollbild; Tastaturbedienung und Kürzel; Programm-Editor; Export als Download; Import einer Datei vom iPhone.

## 7. Protokolleinträge

| Datum | Protokoll | Gerät | Betriebssystem | App-Version | Ergebnis | Abweichungen |
|---|---|---|---|---|---|---|
| 18.10.2026 | T-IPH-M0 | iPhone (Modell nicht angegeben) | iOS 27.0.1 | 0.1.0, Build `b5fb9aa` | Alle vier Schritte bestanden: Hinweis im Safari-Tab, Installation über „Teilen › Zum Home-Bildschirm" mit Name und Icon, Offline-Start aller Bereiche; nach der Auslieferung von Build `66abab4` erschien „Neue Version verfügbar", der Wechsel erfolgte erst nach „Jetzt aktualisieren" (Schritt 4, am selben Tag) | Keine |

## 8. Testdaten

Deterministische Fixtures je Modul unter `shared/testing/fixtures`; ein Generator mit festem Startwert erzeugt fünf Jahre Daten (etwa 1.000 Einheiten, 25.000 Sätze, 1.800 Gewichtseinträge).

## 9. Berichtspflicht

Jeder Arbeitspaket-Bericht nennt die ausgeführten Befehle, Anzahl bestandener und fehlgeschlagener Tests, Dauer, bei Fehlern die wörtliche Ausgabe und Playwright-Traces sowie offene Fehler mit ID.

## 10. Ergebnisse je Meilenstein

### M0 · 18.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1194)

| Prüfung | Befehl | Ergebnis |
|---|---|---|
| Formatierung, Lint, Typen | `pnpm format:check`, `pnpm lint`, `pnpm typecheck` | Bestanden |
| Unit, Integration, Komponenten | `pnpm test:coverage` | 20 Testdateien, 247 Tests bestanden, 0 fehlgeschlagen; Zeilenabdeckung gesamt 94 %, alle Schwellen erreicht |
| Dokumente | `pnpm check:docs` | Bestanden |
| Build, Bündelgröße | `pnpm build`, `pnpm check:bundle` | Bestanden; Startansicht 172,8 KB gzip; Service Worker mit 30 vorab gespeicherten Dateien |
| E2E Chromium (Desktop und Pixel 7) | `E2E_ENGINES=chromium PW_CHROMIUM_PATH=/opt/pw-browsers/chromium pnpm test:e2e` | 26 Tests bestanden, 0 fehlgeschlagen |
| E2E WebKit | – | In dieser Umgebung nicht ausführbar (WebKit nicht installiert); siehe GitHub Actions unten |
| Gerätetest T-IPH-M0 | – | Alle vier Schritte bestanden am 18.10.2026 mit iOS 27.0.1 (Abschnitt 7) |

GitHub Actions (Node 24, Ubuntu, Pull Request darad11/fitness-app#1):

| Lauf | Stand | Ergebnis |
|---|---|---|
| 1 | `016fc5d` | Fehlgeschlagen in `pnpm test:coverage`: Der Formatierungstest erwartete für de-CH das Tausendertrennzeichen „’"; Node 24 bringt ICU 78 mit und liefert „'". Der Test prüft seitdem die Art des Zeichens (D-233). E2E wurde nicht erreicht |
| 2 | `0ab67f2` | Bestanden: Formatierung, Lint, Typen, Unit-Tests mit Schwellen, Dokumente, Build, Bündelgröße; E2E in Chromium und in WebKit (Desktop und iPhone-Profil). Die Logdateien sind aus dieser Umgebung nicht abrufbar; die genaue Zahl der Tests je Engine steht deshalb hier nicht. In WebKit wird der Offline-Test mit Service Worker planmäßig übersprungen (Abschnitt 3) |

Abgedeckte Fälle: PWA-Prüfungen aus Abschnitt 3 (Manifest, Icons, Service Worker, Offline-Start aller vorhandenen Routen), E-24 (nur eigene Adresse, Sicherheits-Header), E-25 (Safari-Tab-Hinweis simuliert; das Vorschau-Etikett ist nur als Komponententest geprüft, weil es vom Vercel-Build abhängt), E-27 als Grundfassung (axe hell und dunkel ohne Verstöße; Tastatur und Kürzel folgen). Fehlergrenze je Ansicht und Update-Bestätigung sind als Komponententests geprüft (Teile von E-22 und E-23).

### Nachtrag M0 · 18.10.2026 · Unzuverlässige E2E-Tests in Chromium

GitHub Actions nach der Abnahme:

| Lauf | Stand | Ergebnis |
|---|---|---|
| 3, 4 | `d17ed3f` (darad11/fitness-app#1), `b5fb9aa` (`main`) | Bestanden |
| 5, 6 | `29b0e08`, `a56e363` (darad11/fitness-app#2) | Bestanden |
| 7 | `66abab4` (`main`) | E2E Chromium fehlgeschlagen, alles andere bestanden. Welche Tests betroffen waren, lässt sich nicht mehr feststellen: Die Logdatei ist aus der Cloud-Umgebung nicht abrufbar, Annotationen gab es damals noch nicht |
| 8 | `ec0c1df` (darad11/fitness-app#3) | Wie Lauf 7 |
| 9 | `a3dfd48` (`main`) | Bestanden |
| 10 | `42be4a1` (darad11/fitness-app#4) | Formatierungsprüfung fehlgeschlagen (Playwright-Konfiguration); E2E nicht erreicht |
| 11 | `263728d` (darad11/fitness-app#4) | Versuche 1 bis 3 bestanden. Versuch 4: E2E Chromium mit 22 bestandenen, 3 fehlgeschlagenen und 1 erst in der Wiederholung bestandenen Test |

E2E Chromium war damit in 3 von 12 Ausführungen rot, WebKit in allen Läufen grün. Ursache laut den Annotationen von Lauf 11, Versuch 4 (beide Fehler auch in der Wiederholung):

1. **Safari-Hinweis (E-25):** Der Test tippte „Hinweis wieder anzeigen" und wechselte sofort die Seite. War das Speichern bis dahin nicht fertig, blieb der Hinweis ausgeblendet. Ein Fehler des Tests, nicht der App.
2. **axe in „Dunkel" (E-27):** Kontrastfehler am Umschalter „Farbschema" unter `/mehr/einstellungen`. Die Seite zeigte vor dem Laden der Einstellungen die Standardwahl „Hell" und sprang danach mit einem Farbübergang von 120 ms auf „Dunkel"; axe hat mitten im Übergang gemessen. Das war auch in der App zu sehen: kurz eine falsche Auswahl, dann ein Flackern.

Lokal trat keiner der Fehler auf, auch nicht mit sechsfach gedrosselter CPU (42 Läufe der beiden betroffenen Testdateien mit dem alten Stand, alle bestanden).

Behebung (darad11/fitness-app#4, D-239):

- Die Einstellungsseite zeigt bis zum Laden nur einen Platzhalter in der Form der Karten (`Skeleton`, Bereich mit `aria-busy`). Die Auswahl erscheint erst mit den gespeicherten Werten und damit ohne Übergang. Das Beispiel zur Formatierung nutzt dieselben Werte.
- `openPage` in `e2e/fixtures.ts` wartet zusätzlich, bis kein Bereich mehr `aria-busy` trägt.
- Der Test zum Safari-Hinweis wartet, bis „Hinweis wieder anzeigen" verschwunden und die Änderung damit gespeichert ist.
- Neuer Komponententest: Beim ersten Bild ist keine Auswahl zu sehen, danach gleich die gespeicherte. Er schlägt mit dem alten Stand fehl und besteht mit dem neuen.
- Die CI meldet E2E-Fehler zusätzlich als GitHub-Annotationen.

Ergebnisse des neuen Stands:

| Prüfung | Befehl | Ergebnis |
|---|---|---|
| Formatierung, Lint, Typen | `pnpm format:check`, `pnpm lint`, `pnpm typecheck` | Bestanden |
| Unit, Integration, Komponenten | `pnpm test:coverage` | 20 Testdateien, 248 Tests bestanden, 0 fehlgeschlagen; Zeilenabdeckung gesamt 94 %, alle Schwellen erreicht |
| Dokumente, Build, Bündelgröße | `pnpm check:docs`, `pnpm build`, `pnpm check:bundle` | Bestanden; Startansicht 172,9 KB gzip |
| E2E Chromium lokal | `pnpm test:e2e`, danach mit `--repeat-each=3` | 26 von 26 bestanden; jeder Test dreimal: 78 von 78 bestanden |
| GitHub Actions, Lauf 12 auf `2ce322d` (darad11/fitness-app#4) | – | Alle Prüfungen bestanden. E2E Chromium in fünf Versuchen je 26 von 26 bestanden, ohne Wiederholung; WebKit 24 bestanden, 2 planmäßig übersprungen |

Vorher waren 3 von 12 Ausführungen rot. Fünf grüne Versuche allein beweisen die Behebung nicht. Zusammen mit der gefundenen Ursache und dem neuen Komponententest gilt der Fehler als behoben. Tritt er wieder auf, zeigen die Annotationen den betroffenen Test.

### M1 · AP 1.1 Übungsbibliothek · 18.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1194)

| Prüfung | Befehl | Ergebnis |
|---|---|---|
| Formatierung, Lint, Typen | `pnpm format:check`, `pnpm lint`, `pnpm typecheck` | Bestanden |
| Unit, Integration, Komponenten | `pnpm test:coverage` | 23 Testdateien, 270 Tests bestanden, 0 fehlgeschlagen; Zeilenabdeckung gesamt 94,59 %, alle Schwellen erreicht |
| Dokumente | `pnpm check:docs` | Bestanden; neu geprüft: Liste in `exercise-library.md` stimmt mit den Daten überein, alle 39 Übungen der Vorlagen sind enthalten |
| Build, Bündelgröße | `pnpm build`, `pnpm check:bundle` | Bestanden; Startansicht 177,5 KB gzip (vorher 173,3 KB); Service Worker mit 37 vorab gespeicherten Dateien, darunter die Übungsdaten |
| E2E Chromium (Desktop und Pixel 7) | `pnpm test:e2e` | 28 Tests bestanden, 0 fehlgeschlagen |
| GitHub Actions auf `784b93e` (darad11/fitness-app#5) | – | Alle Prüfungen bestanden: Lint, Typen, Unit-Tests, Dokumente, Build; E2E Chromium und E2E WebKit |

Abgedeckt: AK-EXL-01 (105 Übungen mit Name, Hauptmuskeln, Gerät und Erfassungsart; Seite `/uebungen` startet offline, geprüft im Offline-Test aller Seiten in Chromium) und AK-EXL-02 (Suche nach Namen und Alias-Namen, auch englisch, unabhängig von Groß- und Kleinschreibung, ä/ae und Bindestrichen; Filter nach Muskelgruppe und Gerät; 500 Übungen in unter 100 ms, gemessen im Unit-Test). Die neuen Seiten `/training` und `/uebungen` sind in die Prüfungen auf fremde Anfragen und auf axe-Verstöße in Hell und Dunkel aufgenommen.

Ein Fehler wurde während der Arbeit gefunden und behoben: Die Übungsdaten landeten zunächst im Startbündel (180,8 KB gzip); sie werden jetzt mit der Seite nachgeladen (D-242). Danach lud zunächst jede Eingabe ins Suchfeld die Daten neu, weil sich die Adresse ändert; zwei Komponententests schlugen deshalb fehl. Die Route lädt seitdem nicht mehr neu, beide Tests bestehen.

### M1 · AP 1.2 Beispielvorlagen · 18.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1194)

| Prüfung | Befehl | Ergebnis |
|---|---|---|
| Formatierung, Lint, Typen | `pnpm format:check`, `pnpm lint`, `pnpm typecheck` | Bestanden |
| Unit, Integration, Komponenten | `pnpm test:coverage` | 27 Testdateien, 289 Tests bestanden, 0 fehlgeschlagen; Zeilenabdeckung gesamt 95,33 %, alle Schwellen erreicht |
| Dokumente | `pnpm check:docs` | Bestanden; neu geprüft: Vorlagen-Daten stimmen mit den Tabellen in `sample-templates.md` überein |
| Build, Bündelgröße | `pnpm build`, `pnpm check:bundle` | Bestanden; Startansicht 178,4 KB gzip |
| E2E Chromium (Desktop und Pixel 7) | `pnpm test:e2e` | Erster Lauf: 29 bestanden, 1 fehlgeschlagen (siehe unten). Nach der Behebung drei Läufe mit je 30 von 30 bestanden; dazu Übungen und Vorlagen zehnfach mit 8 parallelen Workern: 40 von 40 bestanden |

Abgedeckt: Vorlagenliste und Vorlage mit Etikett „Beispiel", Hinweistext, Ablauf und Satzschema (Teil von AK-PRG-06), stabile IDs, Aufwärm- und Drop-Sätze, Zeitbereiche, unbekannte Vorlage als „Seite nicht gefunden". Beide neuen Seiten sind im Offline-Test aller Seiten sowie in den Prüfungen auf fremde Anfragen und axe-Verstöße enthalten (Teil von AK-PWA-02). Ein Fehlschlag beim Nachladen der Daten führt beim nächsten Aufruf zu einem neuen Versuch (Unit-Test).

Fehlschlag im ersten Lauf: `e2e/exercises.spec.ts` (Desktop) wartete vergeblich auf die Liste „3 Treffer" nach der Wahl von Muskelgruppe und Gerät. In 15 Einzelwiederholungen und vier weiteren kompletten Läufen trat er nicht wieder auf, ein Komponententest mit zwei direkt aufeinanderfolgenden Filteränderungen bestand. Wahrscheinliche Ursache: Die Seite hat jede Änderung aus der aktuellen Adresse abgeleitet; React Router übernimmt eine neue Adresse verzögert, sodass ein zweiter Filter kurz danach den ersten überschreiben konnte. Das betrifft auch schnelle Eingaben auf dem iPhone. Die Seite hält Suche und Filter seitdem selbst und schreibt sie nur in die Adresse. Ob genau das die Ursache war, ist nicht bewiesen; der Komponententest sichert das Verhalten ab.
