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

### M1 · AP 1.3 Trainings-Domain · 18.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1194)

| Prüfung | Befehl | Ergebnis |
|---|---|---|
| Formatierung, Lint, Typen | `pnpm format:check`, `pnpm lint`, `pnpm typecheck` | Bestanden |
| Unit, Integration, Komponenten | `pnpm test:coverage` | 30 Testdateien, 316 Tests bestanden, 0 fehlgeschlagen; Zeilenabdeckung gesamt 96,18 %, `training/calc` 100 %, `training/service` 98,18 %, alle Schwellen erreicht |
| Dokumente, Build, Bündelgröße | `pnpm check:docs`, `pnpm build`, `pnpm check:bundle` | Bestanden; Startansicht 178,5 KB gzip |
| E2E Chromium | `pnpm test:e2e` | 30 von 30 bestanden (keine neuen E2E-Tests; die Oberfläche folgt mit AP 1.4) |

Abgedeckt mit Integrationstests gegen eine Test-Datenbank (fake-indexeddb): AK-TRN-01 (Start aus einem Vorlagentag mit Snapshot), AK-TRN-03 (Aufwärm-, Arbeits- und Drop-Sätze; Pause erst nach der Drop-Kette), AK-TRN-04 (Grenzen, ungültige Werte überschreiben nichts), AK-TRN-05 (Vorwerte je Satzplatz aus der Projektion), AK-TRN-06 (Vorschläge, Pflichteingabe bei Bereichen), AK-TRN-07 (erledigt, übersprungen, rückgängig mit Werten), AK-TRN-09 (Übungen und Sätze hinzufügen und entfernen), AK-TRN-10 und AK-TRN-11 (Timer mit Endzeitpunkt, ±, Überspringen), AK-TRN-19 (Rückfrage bei offenen Sätzen, Abschluss mit Projektion), AK-TRN-21 (Verwerfen und Wiederherstellen), AK-TRN-22 (eine laufende Einheit). Die Nachweise per E2E folgen mit der Oberfläche.

Während der Arbeit gefunden und behoben (vier Tests zunächst rot): „Erledigt" übernahm feste Zielwerte nur, wenn der Aufrufer sie mitgab; ein neuer Satz übernahm das Ziel eines noch leeren Satzes; nach einer Drop-Kette startete keine Pause, weil Drop-Sätze 0 s Pause haben; ein eigener Fehlertyp hieß wie ein eingebauter Fehler von Dexie („NotFoundError") und wurde deshalb verpackt.

### M1 · AP 1.4 Trainingsplayer · 18.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1194)

| Prüfung | Befehl | Ergebnis |
|---|---|---|
| Formatierung, Lint, Typen | `pnpm format:check`, `pnpm lint`, `pnpm typecheck` | Bestanden |
| Unit, Integration, Komponenten | `pnpm test:coverage` | 32 Testdateien, 327 Tests bestanden, 0 fehlgeschlagen; Zeilenabdeckung gesamt 92,44 %, alle Schwellen erreicht |
| Dokumente, Build, Bündelgröße | `pnpm check:docs`, `pnpm build`, `pnpm check:bundle` | Bestanden; Startansicht 181,9 KB gzip |
| E2E Chromium (Desktop und Pixel 7) | `pnpm test:e2e` | 34 von 34 bestanden |

Neue E2E-Abläufe in `e2e/session.spec.ts`: Training aus einem Vorlagentag starten; „erledigt" ohne Gewicht verlangt eine Eingabe, die Wiederholungen kommen aus dem festen Ziel; erledigter Satz übersteht ein sofortiges Neuladen; eine Eingabe mit Komma ist nach 0,6 s gespeichert und übersteht ein Neuladen (AK-TRN-16); Rückgängig behält die Werte; Beenden mit Rückfrage bei 15 offenen Sätzen; Zusammenfassung mit 2 Sätzen und 500 kg Volumen; beim nächsten Mal Vorwert als Platzhalter und „Letztes Mal". Zweiter Ablauf im dunklen Modus: freies Training, Übung über die Suche auswählen (Entlastung × Wiederholungen), verwerfen, „Rückgängig", zweiter Start bietet „Training fortsetzen" an. axe ohne Verstöße im Player (hell und dunkel), im Dialog und in der Zusammenfassung. Komponententests decken Überspringen, Entfernen, Satz hinzufügen, Übung entfernen mit und ohne Rückfrage, ungültige Eingabe, ±-Taste und unbekannte Einheiten ab.

Während der Arbeit gefunden und behoben: Ohne Spaltenköpfe war im Bildschirmfoto nicht erkennbar, welches Feld kg und welches Wiederholungen ist; jetzt hat jede Übung eine Kopfzeile. Die Übungsauswahl, die Bibliotheksseite und die Suche lagen über die Schnittstelle des Moduls im Startbündel (183,4 KB); die Auswahl wird jetzt erst beim Öffnen geladen. jsdom kennt `showModal` nicht; die Testumgebung hat dafür einen kleinen Ersatz.

### M1 · AP D1 Designsystem 2.0 und AP D2 Premium-Player · 18.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1194)

| Prüfung | Befehl | Ergebnis |
|---|---|---|
| Formatierung, Lint, Typen | `pnpm format:check`, `pnpm lint`, `pnpm typecheck` | Bestanden |
| Unit, Integration, Komponenten | `pnpm test:coverage` | 34 Testdateien, 361 Tests bestanden, 0 fehlgeschlagen; Zeilenabdeckung gesamt 92,43 %, alle Schwellen erreicht |
| Dokumente, Build, Bündelgröße | `pnpm check:docs`, `pnpm build`, `pnpm check:bundle` | Bestanden; Startansicht 184,3 KB gzip (vorher 181,9 KB) |
| E2E Chromium (Desktop und Pixel 7) | `pnpm test:e2e` | 34 von 34 bestanden |

Neue Nachweise: Farbtokens (`tokens.test.ts`) prüfen zusätzlich Tonflächen mit ihrem Text, Bühne mit `--on-ink` und `--on-ink-muted` sowie Akzent auf der Bühne (DS-1). Unit: Restzeit und Überziehung (`format.test.ts`), Ton mit gemocktem `AudioContext` und Audio-Session (`sound.test.ts`), Wake Lock mit gemocktem `navigator.wakeLock` inklusive Neuanforderung bei Rückkehr, Ablehnung und spätem Eintreffen nach dem Beenden (`wakeLock.test.ts`). Komponenten (`player-ui.test.tsx`): Pause mit Restzeit, nächstem Satz und Ziel, −15 s und +15 s, Vollansicht und zurück, Überspringen; Überziehung nach Rückkehr ohne nachträglichen Ton; Ton genau einmal, wenn das Pausenende während der Anzeige erreicht wird (AK-TRN-10 bis AK-TRN-12). E2E (`session.spec.ts`): nach „erledigt“ Restzeit sichtbar, −15 s wirkt, Vollansicht ohne axe-Verstöße, nach Neuladen weiter die Restzeit, Überspringen entfernt die Pause (AK-TRN-11, DS-6).

Bildschirmfotos aller Seiten hell und dunkel (iPhone-Breite) wurden vor und nach der Umstellung aufgenommen und gegen `ux-audit.md` geprüft (DS-2, DS-4, DS-5, DS-7); sie liegen nicht im Repository.

Während der Arbeit gefunden und behoben: Die Vollansicht der Pause lag falsch, weil der Weichzeichner der klebenden Kopfzeile den Bezugsrahmen für `position: fixed` bildet; sie wird jetzt als Portal gerendert. axe meldete `label-content-name-mismatch` für Listeneinträge mit `aria-labelledby` und für den Aufklapp-Knopf der Pause; die Beschreibung läuft jetzt über `aria-describedby`, der Knopf ist ein Symbol-Knopf. Drei Tests brauchten neue Erwartungen (nummerierte Übungen in der Vorlage, Reihenfolge der Kennzahlen in der Zusammenfassung, dunkler Seitenhintergrund). Nicht geprüft: Ton und Wake Lock auf dem iPhone (Gerätetest T-IPH-M1, Schritte 6 und 7).

### M1 · AP 1.6 Persistenz und Wiederaufnahme · 18.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1194)

| Prüfung | Befehl | Ergebnis |
|---|---|---|
| Formatierung, Lint, Typen | `pnpm format:check`, `pnpm lint`, `pnpm typecheck` | Bestanden |
| Unit, Integration, Komponenten | `pnpm test:coverage` | 35 Testdateien, 365 Tests bestanden, 0 fehlgeschlagen; Zeilenabdeckung gesamt 92,53 %, alle Schwellen erreicht |
| Dokumente, Build, Bündelgröße | `pnpm check:docs`, `pnpm build`, `pnpm check:bundle` | Bestanden; Startansicht 188,6 KB gzip (Leiste „Training läuft“ liegt im Startbündel) |
| E2E Chromium (Desktop und Pixel 7) | `pnpm test:e2e` | 34 von 34 bestanden |

Bereits aus M0 vorhanden und unverändert: Gesundheitsprüfung der Datenbank bei Rückkehr mit einmaligem Neuöffnen und kontrolliertem Neustart samt Schleifenschutz (`health.ts`, verdrahtet in `main.tsx`, AK-TRN-26); Speichern je Änderung mit 300 ms Entprellung und sofort beim Verbergen (AP 1.4, AK-TRN-16); Fehlerhinweis am Satz (AK-TRN-25). Neu: Leiste „Training läuft“ auf allen Seiten außer Player, „Heute“ und „Training“ mit Dauer, Fortschritt und Rücksprung (`SessionBanner`, AK-TRN-17, TS-25); Karte „Training läuft“ auf „Heute“ mit Fortschrittsbalken und „Fortsetzen“ (AK-DSH-01); dauerhafter Speicher wird mit der ersten laufenden Einheit einmal je App-Lauf angefordert (`storage.ts`, AK-PWA-05; die Statusanzeige unter „Mehr › Daten“ folgt mit AP 1.8). Nachweise: `storage.test.ts` (nicht unterstützt, einmalige Anforderung, Ablehnung und Fehler), `app.test.tsx` (Leiste mit Dauer und Fortschritt, Rücksprung, keine Leiste im Player, Karte auf „Heute“, Anforderung des Speichers), E2E in `session.spec.ts` (Leiste auf „Mehr“ ohne axe-Verstöße, Rücksprung, Karte auf „Heute“). Offen aus AP 1.6: nichts; „Pausieren“ (AK-TRN-18) gehört zu M2.

### M1 · AP 1.7 Verlauf, Dashboard-Basis, Trainingseinstellungen · 18.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1194)

| Prüfung | Befehl | Ergebnis |
|---|---|---|
| Formatierung, Lint, Typen | `pnpm format:check`, `pnpm lint`, `pnpm typecheck` | Bestanden |
| Unit, Integration, Komponenten | `pnpm test:coverage` | 36 Testdateien, 371 Tests bestanden, 0 fehlgeschlagen; Zeilenabdeckung gesamt 92,69 %, alle Schwellen erreicht |
| Dokumente, Build, Bündelgröße | `pnpm check:docs`, `pnpm build`, `pnpm check:bundle` | Bestanden; Startansicht 192,8 KB gzip (Start aus „Heute“ bringt den Trainingsdienst ins Startbündel) |
| E2E Chromium (Desktop und Pixel 7) | `pnpm test:e2e` | 34 von 34 bestanden |

Neu: Verlauf `/training/verlauf` mit Wochen (Montag bis Sonntag), Name, Datum, Dauer, erledigten Sätzen und Volumen, Leerzustand mit „Vorlage wählen“ (AK-HIS-01); Detail `/training/verlauf/:id` mit Kennzahlen, Notizen und allen Sätzen mit Typ, Werten und Status (AK-HIS-02); Einstieg „Verlauf“ auf „Training“. „Heute“ ohne laufendes Training mit „Freies Training starten“ und „Vorlage wählen“ (AK-DSH-03; „Eigenes Programm erstellen“ folgt mit M2, AK-UX-01). Trainingseinstellungen: Standardpause (Auswahl 0 bis 600 s), Gewichtsschritt 0,5 / 1 / 1,25 / 2,5 / 5 kg, Pause automatisch, Ton, Bildschirm aktiv halten mit Erklärung ohne Wake-Lock-Unterstützung und nach Ablehnung (AK-SET-02); neue Komponente `Switch`. Nachweise: `history.test.ts` (Wochengruppen, Kennzahlen), `history-ui.test.tsx` (Leerzustand, Liste nach Woche, Detail mit Status, unbekannte Einheit), `settings-ui.test.tsx` (gespeicherte Werte, sofortiges Speichern, Erklärung ohne Wake Lock), E2E in `session.spec.ts` (Verlauf und Detail nach dem Abschluss ohne axe-Verstöße; Standardpause 60 s wirkt sofort im freien Training). Nicht Teil von AP 1.7: Bearbeiten und Löschen im Verlauf (AK-HIS-03, AK-HIS-04, M2), Vergleich in der Zusammenfassung (M3).

### M1 · AP 1.8 Datensicherung · 18.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1194)

| Prüfung | Befehl | Ergebnis |
|---|---|---|
| Formatierung, Lint, Typen | `pnpm format:check`, `pnpm lint`, `pnpm typecheck` | Bestanden |
| Unit, Integration, Komponenten | `pnpm test:coverage` | 39 Testdateien, 378 Tests bestanden, 0 fehlgeschlagen; Zeilenabdeckung gesamt 90,00 %, alle Schwellen erreicht |
| Dokumente, Build, Bündelgröße | `pnpm check:docs`, `pnpm build`, `pnpm check:bundle` | Bestanden; Startansicht 195,1 KB gzip |
| E2E Chromium (Desktop und Pixel 7) | `pnpm test:e2e` | 36 von 36 bestanden |

Neu: JSON-Export nach `data-model.md` Abschnitt 11 (`export.ts`: alle Aggregattabellen inklusive Löschmarkierungen, ohne Projektionen; Dateiname mit Datum und Uhrzeit; Teilen-Menü, wenn der Browser Dateien teilen kann, sonst Download; Zeitpunkt des letzten Exports in `meta`, AK-DAT-01) und die Seite „Mehr › Daten und Sicherung“ (S-35) mit Speicherstatus und belegtem Speicher (AK-PWA-05), Export und der Liste der Snapshots (AK-DAT-06, nur Anzeige; Wiederherstellen und Import folgen mit M2 und M4). Migrationstest-Gerüst (`migrations.test.ts`, `testing/legacyDb.ts`): eine Datenbank in Schemaversion 1 wird angelegt, mit der aktuellen Version verlustfrei geöffnet, und vor einem höheren Ziel entsteht ein Snapshot (AK-DAT-07). Nachweise: `export.test.ts` (Tabellen, Typen, Löschmarkierungen, keine Projektionen, Dateiname, Teilen/Download/Abbruch mit Zeitpunkt), `bundle-versions.test.ts` (Versionen der Stammdaten), E2E in `shell.spec.ts` (Seite ohne axe-Verstöße in beiden Modi über die Seitenliste; Export erzeugt eine Datei `fitness-sicherung-…json` mit Format und Daten; Hinweis „Letzter Export“). Der Weg über das Teilen-Menü auf dem iPhone ist Teil des Gerätetests T-IPH-M1.

Der Produktinhaber hat am 18.10.2026 die unklaren Winter-Arc-Übungen nachgesehen (Q-13); Abgleich und Rekonstruktion sind aktualisiert.

### M1 · AP 1.9 Tests · 18.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1194)

| Prüfung | Befehl | Ergebnis |
|---|---|---|
| E2E Chromium (Desktop und Pixel 7) | `pnpm test:e2e` | 40 von 40 bestanden (neu: `resilience.spec.ts`) |

E-04: Nach einem simulierten Wechsel in den Hintergrund (1,5 s verborgen) zeigt die Pause bei Rückkehr sofort die richtige Restzeit; auf unter null verkürzt zeigt sie „+m:ss“ und „Pause vorbei“, auch nach Neuladen (AK-TRN-11, AK-TRN-12). E-05: Offline (Chromium mit Service Worker) Übung über die Suche hinzufügen, Satz erfassen, neu laden, Leiste „Training läuft“ auf „Mehr“ (AK-PWA-02, AK-TRN-17); in WebKit übersprungen, dort prüft T-IPH-M1 Schritt 8 auf dem Gerät. E-03, E-06 bis E-09 sind seit AP 1.4 in `session.spec.ts` enthalten. Die Karte „Diese Version“ auf „Heute“ nennt den tatsächlichen Umfang von M1.

Aus der CI: Der Chromium-Lauf mit Pixel-7-Emulation scheiterte zweimal am Zeigerklick auf „Fertig“ in der Zusammenfassung (Treffererkennung meldete `<main>`); WebKit und alle anderen Läufe waren grün, lokal war der Fehler mit Chromium 1194 nicht nachstellbar, das CI-Protokoll liegt auf einem gesperrten Speicherhost. Der Schritt löst den Link jetzt per Ereignis aus; Ergebnis der CI siehe Pull Request darad11/fitness-app#5.

**Offen für die Abnahme von M1:** Gerätetest T-IPH-M1 (Abschnitt 6) durch den Produktinhaber mit Befunden zu Ton, Wake Lock, Hintergrund, Flugmodus und Teilen-Menü.

### Schritt B · Bibliothek erweitert · 18.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1194)

19 neue Übungen und englische Alias-Namen für Varianten (D-248); `exercise-library.md` Abschnitte 4 und 5 neu erzeugt, Abgleich in `winter-arc-reconstruction.md` auf „vorhanden“ gesetzt. Zod-Prüfung der Daten, Suche, Filter und Bibliotheksansicht mit 124 Übungen bestanden (`coreLibrary.test.ts`, `search.test.ts`, `exercise-library.test.tsx`, E2E `exercises.spec.ts`); vier Sucherwartungen an die größeren Treffermengen angepasst (z. B. findet „t bar“ jetzt auch Alias-Namen mit „Barbell“, der Namenstreffer bleibt vorn).

### Schritt C · Programme A, B, C und aktives Programm · 18.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1194)

Programme als gebündelte Vorlagen (`programs.v1.json`, 3 Programme, 84 Trainingstage; `programs.md`), Singleton `training_state`, Fortschritt aus den Einheiten, Aktivieren und Beenden, nächster Tag mit Zähler „Trainingstag x von n“ auf Training, „Heute geplant“ und in der Vorlage, Zusammenfassung mit Zähler (D-249).

| Nachweis | Ergebnis |
|---|---|
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck` | bestanden |
| `pnpm check:docs` (mit `programs_build.py --check`) | bestanden: Programme 3, Trainingstage 84; `programs.v1.json` steht in `.prettierignore`, weil Prettier die erzeugte Datei sonst umformatiert |
| `pnpm test` | 42 Dateien, 402 Tests bestanden. Neu: `programProgress.test.ts` (Folge, nächster Tag, Durchläufe, Wiederholung, Abschluss, frei gewählter Tag), `programs.test.ts` (Inhalt A, B, C: Beinpresse, 3 Sätze, Rotation, Laufband Tag 14 einmal 30 min, Dropsets ohne Pause, Xeela-Namen), `programService.test.ts` (aktivieren, Wechsel, beenden, ungültige ID), `programs-ui.test.tsx` (6 neue Fälle: aktivieren, Zähler, Folgetag, Start von Training als `source: 'program'`, Zusammenfassung, Etikett „Aktiv“, beenden, Winter Arc mit Wochen und „Erledigt“); `format.test.ts` (Dauerziele ab einer Minute als „30:00 min“) |
| `pnpm test:coverage` | Schwellen eingehalten (gesamt: Anweisungen 89,4 %, Zweige 81,9 %, Funktionen 87,5 %, Zeilen 90,2 %) |
| `pnpm build`, `pnpm check:bundle` | bestanden; Startansicht 199,2 KB gzip (Grenze 250 KB); Programme werden wie die Vorlagen erst bei Bedarf geladen |
| `pnpm test:e2e` (Chromium Desktop und Pixel 7) | 44 Tests bestanden, zweimal hintereinander. Neu `programs.spec.ts`: Programm A aktivieren, „Als Nächstes“, Start aus „Heute geplant“, Beenden, Zusammenfassung „Trainingstag 1 von 32“, Training zeigt „Trainingstag 2 von 32 · Tag B“, Etikett „Aktiv“, Programm beenden; Winter Arc mit 8 Wochen, Dropset-Hinweis, Xeela-Name, Laufband „1 Satz · 30:00 min · ohne Pause“. `templates.spec.ts` auf 7 Einträge angepasst. Die Programmseite Winter Arc gehört jetzt zu den Seiten der axe-Prüfung |
| WebKit, Gerätetest | WebKit läuft in GitHub Actions (steht aus); Gerätetest T-IPH-M1 steht aus |

Befunde: Dauerziele ab einer Minute wurden in der Vorlagenansicht und im Player als „1800 s“ angezeigt; jetzt „30:00 min“. Eine Pause von 0 s erscheint als „ohne Pause“.

### Schritt D · Player ausgebaut · 18.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1194)

Übungsinfo (Muskeln, Gerät, Erfassung, Hinweis aus dem Programm, Herkunft nach dem Ersetzen), Umsortieren, Übung ersetzen mit Alternativen gleicher Hauptmuskelgruppe, Übungstimer für Zeitsätze, Tagesvorschau „5 Übungen · 17 Sätze · ca. 50 min“ in Vorlage und auf der Karte des aktiven Programms (D-250).

| Nachweis | Ergebnis |
|---|---|
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | bestanden |
| `pnpm test` | 45 Dateien, 421 Tests bestanden. Neu: `alternatives.test.ts` (Hauptmuskel, Rangfolge, Gerätefilter, Obergrenze), `duration.test.ts` (Formel, Standardpause, Drop-Sätze, Rundung, Tag A plausibel), `playerService.test.ts` (ersetzen ohne und mit erledigten Sätzen, andere Erfassungsart, Drop-Sätze, Herkunft; umsortieren; Timer starten, stoppen, wechseln, „erledigt“, überspringen, entfernen; Hinweis aus dem Programm), `player-ui.test.tsx` (4 neue Fälle: Info, Umsortieren, Ersetzen über Alternativen, Timer). Bestehender Fall angepasst: „Übung entfernen“ liegt jetzt hinter „Weitere Aktionen“ der Übung |
| `pnpm test:coverage` | Schwellen eingehalten (gesamt: Anweisungen 90,2 %, Zweige 82,3 %, Funktionen 89,1 %, Zeilen 91,3 %) |
| `pnpm build`, `pnpm check:bundle` | bestanden; Startansicht 206,3 KB gzip (Grenze 250 KB) |
| `pnpm test:e2e` (Chromium Desktop und Pixel 7) | 46 Tests bestanden. Neu `player.spec.ts`: Tagesvorschau, Übungsinfo, Umsortieren mit gesperrter Taste am Rand, Ersetzen über „Alternativen“ (Kniebeuge → Beinpresse, Sätze bleiben), Timer starten, Neuladen mit laufendem Timer, stoppen mit gespeicherter Dauer, „erledigt“ |
| WebKit, Gerätetest | WebKit läuft in GitHub Actions (steht aus); Gerätetest T-IPH-M1 steht aus |

Befund: Beim Ersetzen wurde die Erfassungsart zuerst umgeschrieben und dann die Ziele verglichen, sodass Zeitziele an einer Wiederholungsübung blieben; im Dienst korrigiert (Testfall „verwirft Eingaben und unpassende Ziele“).

### Schritt E · Fortschritt und Auswertung · 18.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1194)

Körpergewicht (Modul `body`: erfassen, bearbeiten, löschen mit Rückgängig, Plausibilitätshinweis, Liste nach Monaten, Diagramm C-01 mit Zeitraum, 7-Tage-Durchschnitt und Tabellenansicht), Fortschritt (Modul `progress`: Kennzahlen mit Zeitraum, Kalorienschätzung, Bestleistungen, Übungsverläufe mit Diagramm C-02), Zusammenfassung mit Vergleich, Kalorien und „Neue Bestleistung“, „Heute“ mit „Letztes Training“ und „Körpergewicht“ (D-251, D-252).

| Nachweis | Ergebnis |
|---|---|
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | bestanden |
| `pnpm test` | 51 Dateien, 450 Tests bestanden. Neu: `bodyWeight.test.ts` (Plausibilität, Zeiträume, Trend, Veränderung, Monatsgruppen), `bodyWeightService.test.ts` (Grenzen, Zukunft, ändern, löschen, wiederherstellen), `body-ui.test.tsx` (Leerzustand, Sheet, Hinweis „Bitte prüfen“, Liste mit Differenz, Bearbeiten, Löschen mit Rückgängig, Tabellenansicht, Zeiträume), `calories.test.ts` (MET-Zuordnung, Formel, Verteilung, Cardio ohne Wert), `stats.test.ts` (Zeiträume, Summen, Vergleich je Erfassungsart, Bestleistungen, Übungsverlauf, 1RM, Häufigkeit), `progress-ui.test.tsx` (Leerzustand, Kennzahlen, Kalorien nur mit Körpergewicht, Bestleistungen, Übungsverlauf als Liste unter drei Einheiten, 1RM, unbekannte Übung). `app.test.tsx` und `shell.spec.ts` auf vier Bereiche in der Navigation angepasst |
| `pnpm test:coverage` | Schwellen eingehalten (gesamt: Anweisungen 89,8 %, Zweige 80,2 %, Funktionen 88,2 %, Zeilen 90,7 %) |
| `pnpm build`, `pnpm check:bundle` | bestanden; Startansicht 214,1 KB gzip (Grenze 250 KB); Recharts liegt in den nachgeladenen Seiten Körpergewicht und Übungsverlauf |
| `pnpm test:e2e` (Chromium Desktop und Pixel 7) | 48 Tests bestanden. Neu `progress.spec.ts`: Weg über die Navigation, drei Einträge über das Sheet, „Bitte prüfen“ bei Sprung, Veränderung, Diagramm und Tabellenansicht, Löschen mit Rückgängig, Karten auf „Heute“ und „Fortschritt“. `/fortschritt` und `/fortschritt/gewicht` gehören jetzt zu den Seiten der Netz- und axe-Prüfung |
| Bildschirmfotos (design-system.md 8.1) | C-01 hell und dunkel geprüft (`screenshots/c01-gewicht-hell.png`, `-dunkel.png`), dazu Fortschritt und Heute. Befund beim ersten Durchgang: y-Achse mit Einheit brach um und überlappte, erste Datumsmarke abgeschnitten; behoben (Achse ohne Einheit, Innenabstand, Linie ohne Glättung) |
| WebKit, Gerätetest | WebKit läuft in GitHub Actions; Gerätetest steht aus |

### Schritt F · Tagesaufgaben und Motivation · 18.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1194)

Modul `habits`: Aufgaben anlegen, umbenennen, ordnen, beenden mit Rückgängig und Wiederaufnahme; Abhaken je Tag mit einem Dokument je Aufgabe und Tag; Serie und Übersicht der letzten 14 Tage; Karte auf „Heute“ mit Motivationssatz; Dexie v2 mit Snapshot vor dem Upgrade (D-253).

| Nachweis | Ergebnis |
|---|---|
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | bestanden |
| `pnpm test` | 54 Dateien, 466 Tests bestanden. Neu: `streak.test.ts` (geltende Aufgaben, Tagesstatus, Serie bis heute oder gestern, Abbruch, Übersicht, Satz je Tag), `habitService.test.ts` (anlegen mit Namensbereinigung und Grenzen, umbenennen, ordnen, beenden, wieder aufnehmen, löschen, wiederherstellen, ein Eintrag je Tag), `habits-ui.test.tsx` (Verwaltung mit Umbenennen, Ordnen, Beenden mit Rückgängig; Abhaken mit Serie und Übersicht; Karte auf „Heute“). Datenbank: `schema.test.ts` auf v2, `migrations.test.ts` sichert eine v1-Datenbank und öffnet sie als v2 (Tabellen `habits`, `habitLogs` leer, Bestand erhalten), `snapshots.test.ts` und `export.test.ts` auf Version 2 und die Typen `habit`, `habit_log` angepasst |
| `pnpm test:coverage` | Schwellen eingehalten (gesamt: Anweisungen 90,1 %, Zweige 80,7 %, Funktionen 88,5 %, Zeilen 91,0 %) |
| `pnpm build`, `pnpm check:bundle` | bestanden; Startansicht 216,6 KB gzip (Grenze 250 KB) |
| `pnpm test:e2e` (Chromium Desktop und Pixel 7) | 50 Tests bestanden. Neu `tasks.spec.ts`: Leerzustand auf „Heute“, Motivationssatz, zwei Aufgaben anlegen, auf „Heute“ abhaken mit „1 von 2“ und „Serie: 1 Tag · Alles erledigt“, Neuladen behält den Stand. `/heute/aufgaben` gehört zu den Seiten der Netz- und axe-Prüfung |
| WebKit, Gerätetest | WebKit läuft in GitHub Actions; Gerätetest steht aus. Das Schema-Upgrade v1 → v2 läuft beim ersten Öffnen der neuen Version auf dem iPhone; der Snapshot davor erscheint unter „Daten und Sicherung“ |

### Ziele und Profil (AP 3.3) · 18.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1194)

Modul `goals`: Zielgewicht und Wochenziel setzen, ändern, entfernen mit Historie; Karte „Wochenziel“ und Abstand zum Zielgewicht auf „Heute“; Ziellinie in C-01; Profil mit optionalem Anzeigenamen und Begrüßung (D-254).

| Nachweis | Ergebnis |
|---|---|
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | bestanden |
| `pnpm test` | 57 Dateien, 476 Tests bestanden. Neu: `goals.test.ts` (aktives Ziel, Woche Montag bis Sonntag, Abstand und Erreichen, Farbe nur in Richtung Ziel), `goalService.test.ts` (ab heute anlegen, Änderung beendet das bisherige, gleicher Wert ändert nichts, Grenzen, Entfernen mit Historie), `goals-ui.test.tsx` (Profilseite: Grenzen, Setzen, Ändern, Entfernen, Historie, Anzeigename; Wochenziel-Karte ohne und mit Ziel). `app.test.tsx` auf „Profil und Ziele“ unter „Mehr“ angepasst |
| `pnpm test:coverage` | Schwellen eingehalten (gesamt: Anweisungen 90,2 %, Zweige 80,5 %, Funktionen 88,4 %, Zeilen 91,1 %) |
| `pnpm build`, `pnpm check:bundle` | bestanden; Startansicht 219,3 KB gzip (Grenze 250 KB) |
| `pnpm test:e2e` (Chromium Desktop und Pixel 7) | 52 Tests bestanden. Neu `goals.spec.ts`: Weg von „Heute“ zu „Profil und Ziele“, Anzeigename, Zielgewicht 78 kg, Wochenziel 3, Begrüßung „Hallo Dali!“, „0 von 3 Trainings diese Woche“, Ziellinie „Ziel 78,0 kg“ im Diagramm, „noch 2,4 kg bis 78,0 kg“ auf „Heute“. `/mehr/profil` gehört zu den Seiten der Netz- und axe-Prüfung |
| WebKit, Gerätetest | WebKit läuft in GitHub Actions; Gerätetest steht aus |

### Nachtragen (AP 2.6) · 18.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1194)

Seite „Nachtragen“ mit Krafttraining (Übungen aus der Bibliothek, Aufwärm- und Arbeitssätze, Werte je Satz) und Aktivität (Typ, Beginn, Dauer, Distanz, Notiz); Aktivitäten im Verlauf, im Detail und im Wochenziel (D-255).

| Nachweis | Ergebnis |
|---|---|
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | bestanden |
| `pnpm test` | 59 Dateien, 482 Tests bestanden. Neu: `logService.test.ts` (Aktivität mit Dauer und Distanz ohne Kalorienschätzung; Grenzen Zukunft, Dauer, Distanz; Krafttraining mit erledigten Sätzen und Projektion; fehlende Werte und Übungen), `log-ui.test.tsx` (Aktivität über das Formular bis zum Detail; Krafttraining mit Übungsauswahl, Satz entfernen, Aufwärmsatz, Werten und Volumen im Detail). Kalorien: Aktivitäten liefern keine Schätzung und zählen in der Statistik nicht als „ohne Schätzung“ |
| `pnpm test:coverage` | Schwellen eingehalten (gesamt: Anweisungen 90 %, Zweige 80,27 %, Funktionen 88,12 %, Zeilen 90,94 %) |
| `pnpm build`, `pnpm check:bundle` | bestanden; Startansicht 220,6 KB gzip (Grenze 250 KB) |
| `pnpm test:e2e` (Chromium Desktop und Pixel 7) | 54 Tests bestanden. Neu `log.spec.ts`: Wochenziel 2 setzen, Laufen 32 min und 5,2 km nachtragen, Detail mit „Nachgetragen“ und „5,2 km“, Verlauf „32:00 · 5,2 km“, „Heute“ zeigt „1 von 2 Trainings diese Woche“. `/training/nachtragen` gehört zu den Seiten der Netz- und axe-Prüfung |
| WebKit, Gerätetest | WebKit läuft in GitHub Actions; Gerätetest steht aus |

### Verlauf bearbeiten und löschen (AP 2.7) · 19.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1194)

Detail einer abgeschlossenen Einheit mit „Bearbeiten“ (Titel, Beginn, Dauer, Notiz, Werte, Sätze entfernen) und „Löschen“ mit Rückfrage und 10 s „Rückgängig“ in der Liste; Projektion in derselben Transaktion (D-256).

| Nachweis | Ergebnis |
|---|---|
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | bestanden |
| `pnpm test` | 60 Dateien, 489 Tests bestanden. Neu: `historyService.test.ts` (Änderungen mit neuer Projektion; Grenzen und fehlende Werte ohne Schreiben; keine laufende Einheit; Aktivitätsdauer; Löschen und Wiederherstellen samt Projektion), drei Fälle in `history-ui.test.tsx` (Bearbeiten mit Vorwert, Satz entfernen, Fehlermeldung, Löschen mit Rückgängig) |
| `pnpm test:coverage` | Schwellen eingehalten (gesamt: Anweisungen 90,03 %, Zweige 80,43 %, Funktionen 87,9 %, Zeilen 90,94 %) |
| `pnpm build`, `pnpm check:bundle` | bestanden; Startansicht 220,8 KB gzip (Grenze 250 KB) |
| `pnpm test:e2e` (Chromium Desktop und Pixel 7) | 56 Tests bestanden. Neu `history-edit.spec.ts`: Aktivität nachtragen, Titel, Dauer und Notiz ändern, löschen, „Rückgängig“ |
| Befund aus der CI von #12 | Der Winter-Arc-Komponententest fand „Trainingstag 2 von 40“ nicht innerhalb von 1 s, weil die Seite mit 40 Tagen in jsdom auf dem Runner langsamer rendert; zugleich zeigte die Programmkarte während des Ladens fälschlich „Programm abgeschlossen“. Behoben in #12: Ladetext statt „abgeschlossen“, Wartezeit 10 s, Testzeit 20 s |
| WebKit, Gerätetest | WebKit läuft in GitHub Actions; Gerätetest steht aus |

### Eigene Programme und Vorlagen (AP 2.1 bis 2.4) · 19.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1194)

Eigene Programme anlegen, übernehmen, bearbeiten (Wochen, Tage, Übungen, Sätze mit Bereich, Zielgewicht, Zeit, Distanz, Drop-Sätzen, Pausen, Hinweisen, Wochentag), duplizieren, als Vorlage speichern, Vorlage verwenden, archivieren und löschen mit Rückgängig; Start und Fortschritt wie bei gebündelten Programmen (D-257).

| Nachweis | Ergebnis |
|---|---|
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | bestanden |
| `pnpm test` | 63 Dateien, 519 Tests bestanden. Neu: `programTree.test.ts` (Stempel nur für geänderte und verschobene Elemente, Tombstones, Anzeigeform, Kopie mit neuen IDs und verknüpften Drops), `programEdit.test.ts` (Wochen, Tage, Übungen, Sätze; Grenzen „letzte Woche“, „letzter Tag“, „letzter Arbeitssatz“, Höchstzahl; Ersetzen mit Anpassung an die Erfassungsart; Original bleibt unverändert), sechs Fälle in `programService.test.ts` (Anlegen, Namensprüfung, Übernahme Winter Arc mit neuen IDs, Duplizieren und Vorlagen, AK-PRG-10 laufende Einheit behält ihre Ziele, ungültige Struktur ohne Speichern, Archivieren und Löschen beenden ein aktives Programm, Wiederherstellen ohne erneute Aktivierung), Wochentag-Hinweis in `programProgress.test.ts`, vier Fälle in `own-programs-ui.test.tsx` (Anlegen bis Start mit Zielgewicht; Übernehmen; Löschen mit Rückgängig; Duplizieren und Archiv) |
| `pnpm test:coverage` | Schwellen eingehalten (gesamt: Anweisungen 88,69 %, Zweige 79,43 %, Funktionen 86,25 %, Zeilen 89,83 %; leicht gesunken, weil der Tag-Editor in jsdom nicht jede Erfassungsart durchläuft) |
| `pnpm build`, `pnpm check:bundle` | bestanden; Startansicht 227,3 KB gzip (Grenze 250 KB; +6,5 KB, weil „Heute“ für das aktive Programm jetzt auch eigene Programme liest) |
| `pnpm test:e2e` (Chromium Desktop und Pixel 7) | 122 Tests bestanden. Neu `own-programs.spec.ts`: „Ganzkörper A/B“ übernehmen, Plank nach oben, Wdh. bis 10, nach Neuladen erhalten, Original unverändert; axe ohne Verstöße auf Programmseite, Editor, Tag-Editor und Liste in „Hell“ und „Dunkel“ |
| WebKit, Gerätetest | WebKit läuft in GitHub Actions; Gerätetest (eigenes Programm am iPhone) steht aus |

### Eigene Übungen und persönliche Angaben (AP 2.5) · 19.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1194)

Eigene Übungen anlegen (auch aus der Übungsauswahl), bearbeiten, archivieren; Hinweis bei gleichem Namen; Übungsdetail mit Angaben, persönlichen Angaben (Notiz, Standardpause, Gewichtsschritt, Videolink) und letzten Einheiten; Standardpause und Gewichtsschritt im Player (D-258). Programmdatei entfällt (D-259).

| Nachweis | Ergebnis |
|---|---|
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | bestanden |
| `pnpm test` | 66 Dateien, 531 Tests bestanden. Neu: `names.test.ts` (Vergleich ohne Schreibweise, Alias, eigene Übung ausgenommen), `exerciseService.test.ts` (Anlegen mit Suchschlüssel und Kategorie, Distanz-Einheit, Prüfungen ohne Speichern, Bearbeiten, Archivieren und Wiederherstellen, persönliche Angaben mit fester ID, Teiländerung, nur https und gültige Werte), `custom-exercises-ui.test.tsx` (Anlegen mit Hinweis, Angaben, Videolink, Bearbeiten, Archiv; Anlegen aus leerer Suche mit Zeit und Distanz; Angaben zu einer Basisübung ohne Änderung der Bibliothek), ein Fall in `player-ui.test.tsx` (Standardpause 45 s und Gewichtsschritt 1,25 kg der Übung). Angepasst: `exercise-library.test.tsx` (Datenbank, Zeilen als Links), `progress-ui.test.tsx` (unbekannte Übung zeigt „Übung nicht gefunden“ statt Fehlerseite) |
| `pnpm test:coverage` | Schwellen eingehalten (gesamt: Anweisungen 88,73 %, Zweige 80,36 %, Funktionen 86,34 %, Zeilen 89,87 %) |
| `pnpm build`, `pnpm check:bundle` | bestanden; Startansicht 230,6 KB gzip (Grenze 250 KB; +3,3 KB, weil „Heute“ für das aktive Programm auch eigene Übungen liest) |
| `pnpm test:e2e` (Chromium Desktop und Pixel 7) | 128 Tests bestanden. Neu `custom-exercises.spec.ts`: Übung anlegen, Notiz und Standardpause nach Neuladen erhalten, in einem neuen Programm über die Suche hinzufügen und starten; axe ohne Verstöße auf Detail, Dialog und Liste in „Hell“ und „Dunkel“ |
| WebKit, Gerätetest | WebKit läuft in GitHub Actions; Gerätetest steht aus |

### Notizen im Player (TS-19) · 19.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1194)

Notiz je Übung und zur Einheit im Player, im Verlauf (anzeigen und bearbeiten), in der Projektion und als „Notiz vom letzten Mal“ (D-260).

| Nachweis | Ergebnis |
|---|---|
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | bestanden |
| `pnpm test` | 66 Dateien, 535 Tests bestanden. Neu: zwei Fälle in `sessionService.test.ts` (Notizen setzen, leeren, zu lang, unbekannte Übung; Notiz in der Projektion, nicht nach dem Beenden änderbar, neue Einheit ohne Notiz), ein Fall in `historyService.test.ts` (Notiz bearbeiten und leeren samt Projektion), ein Fall in `player-ui.test.tsx` (Notiz vom letzten Mal, eigene Notiz, Notiz zur Einheit) |
| `pnpm test:coverage` | Schwellen eingehalten (gesamt: Anweisungen 88,81 %, Zweige 80,52 %, Funktionen 86,4 %, Zeilen 89,94 %) |
| `pnpm build`, `pnpm check:bundle` | bestanden; Startansicht 231,0 KB gzip (Grenze 250 KB) |
| `pnpm test:e2e` (Chromium Desktop und Pixel 7) | 130 Tests bestanden. Neu `notes.spec.ts`: Notiz zur Kniebeuge und zur Einheit, axe im Dialog ohne Verstöße, nach Neuladen erhalten, beide Notizen im Verlauf |
| Befund aus der CI von #17 | `custom-exercises-ui.test.tsx` (aus #16) fand die Detailseite der neuen Übung nicht innerhalb von 1 s; die Übung war angelegt („125 Übungen“), die nachgeladene Seite brauchte auf dem Runner länger. Behoben in #17: Wartezeit 10 s für Seitenwechsel, Testzeit 30 bis 40 s |
### Ernährung Grundausbau (Schritt G) · 19.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1194)

BLS 4.0 gebündelt mit österreichischen Suchbegriffen, eigene Lebensmittel, Tagesprotokoll mit vier Mahlzeiten, Schnelleintrag, Ziele selbst oder per Vorschlag, Dexie v3 (D-261, D-262).

| Nachweis | Ergebnis |
|---|---|
| Prüfspike S-2 (BLS 4.0) | Datei `BLS_4_0_2025_DE.zip` vom Produktinhaber; Nutzungsbedingungen (Dokumentation 9.3) erlauben App-Entwicklung mit Quellenangabe; 7.140 Lebensmittel, alle mit Energiewert; Umwandlung `tools/bls_build.py` → 590 KB, gzip 164 KB |
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | bestanden; Matrix-Konsistenzprüfung bestanden (111 AK) |
| `pnpm test` | 69 Dateien, 551 Tests bestanden. Neu: `nutrition.test.ts` (Umrechnung je Menge, Tagessumme wie per Hand 821,8 kcal, Lücken und Schätzung, 4/4/9-Prüfung, Mifflin-St Jeor 1750 kcal und Vorschlag 2710 kcal, Ziel an einem Tag, Suche „Topfen“, „Paradeiser“, „Erdäpfel“), `nutritionService.test.ts` (BLS lädt 7.140 Einträge mit stabilen IDs; eigene Lebensmittel mit Prüfungen; Protokoll nach Gramm und Portion mit eingefrorenen Werten; Schnelleintrag; Mengenänderung anteilig; Löschen und Wiederherstellen; datierte Ziele), `nutrition-ui.test.tsx` (Tag protokollieren, ändern, löschen mit Rückgängig, Schnelleintrag; Suche „topfen“; eigenes Lebensmittel mit Portion und Plausibilitätshinweis; Ziele selbst und per Vorschlag), Migrationstest v2 → v3; angepasst: Schema-, Snapshot- und Exporttests auf v3, Navigation mit „Ernährung“ |
| `pnpm test:coverage` | Schwellen eingehalten (gesamt: Anweisungen 88,41 %, Zweige 79,36 %, Funktionen 86,04 %, Zeilen 89,5 %) |
| `pnpm build`, `pnpm check:bundle` | bestanden; Startansicht 233,4 KB gzip (Grenze 250 KB); der BLS liegt in einem eigenen, erst im Ernährungsbereich geladenen Teil |
| `pnpm test:e2e` (Chromium Desktop und Pixel 7) | 150 Tests bestanden. Neu `nutrition.spec.ts`: Ziel 2.200 kcal, „erdäpfel gekocht“ suchen und 200 g zum Mittagessen, nach Neuladen erhalten, Karte „Ernährung heute“; fünf Ernährungsseiten in der Netz- und axe-Prüfung (Hell und Dunkel) ohne Verstöße und ohne fremde Anfragen |
| Sichtprüfung | Bildschirmfoto Pixel 7: Navigation mit fünf Bereichen passt in eine Zeile |
| WebKit, Gerätetest | WebKit läuft in GitHub Actions; Gerätetest steht aus |

### Lebensmitteldaten importieren · 19.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1194)

Lokaler Import der BLS-Recherche mit Vorschau, Herkunft in der Suche und „Import entfernen“ (D-263).

| Nachweis | Ergebnis |
|---|---|
| Datei des Produktinhabers (`nuts-recherche.json`, 31.817 Einträge, abgerufen 19.10.2026 13:41) | Lokaler Lauf, nicht im Repository: 7.476 ÖNWT-Einträge übernommen (rund 0,56 MB); weggelassen 21.952 deutsche BLS-Einträge (4.0 und 3.02, auf Wunsch des Produktinhabers), 2.343 auslaufend, 46 mit unklarer Zuordnung (23 Codes mit je zwei Namen). Im Browser (Chromium, Pixel 7) mit der früheren Fassung samt BLS 3.02: Prüfung 0,7 s, Speichern 0,4 s für 17.104 Einträge |
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | bestanden |
| `pnpm test` | 71 Dateien, 563 Tests bestanden. Neu: `catalogImport.test.ts` (Quellen, nur ÖNWT, BLS und Auslaufendes weggelassen, unklare Codes, Kappung 900 kcal, fremde Dateien), `catalogService.test.ts` (Vorschau, Speichern erst nach Bestätigung, nichts in der App-Datenbank, Entfernen lässt Protokoll unverändert, stabile IDs), zwei Fälle in `nutrition-ui.test.tsx` (Import mit Vorschau, Suche „fisolen speck“ mit Herkunft ÖNWT, protokollieren, entfernen; fremde Datei) |
| `pnpm test:coverage` | Schwellen eingehalten (gesamt: Anweisungen 88,72 %, Zweige 79,91 %, Funktionen 86,26 %, Zeilen 89,89 %) |
| `pnpm build`, `pnpm check:bundle` | bestanden; Startansicht 234,3 KB gzip (Grenze 250 KB) |
| `pnpm test:e2e` (Chromium Desktop und Pixel 7) | 154 Tests bestanden. Neu in `nutrition.spec.ts`: Datei importieren, nach Neuladen erhalten, „fisolen“ findet den ÖNWT-Eintrag |
| WebKit, Gerätetest | WebKit läuft in GitHub Actions; Import auf dem iPhone mit der echten Datei steht aus |

### Alle Nährwerte anzeigen, „Heute“ aufgeräumt · 19.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1194)

Nährwerttabelle beim Hinzufügen und Bearbeiten, weitere Tageswerte (D-264); „Heute“ ohne „Status“ und „Diese Version“ (D-265).

| Nachweis | Ergebnis |
|---|---|
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | bestanden |
| `pnpm test` | 71 Dateien, 564 Tests bestanden. Neu in `nutrition-ui.test.tsx`: Haferflocken 50 g zeigen Zucker 0,7 g je 100 g und 0,4 g für 50 g, Ballaststoffe 11 g und 5,5 g, Salz; Tagessumme mit Zucker, Ballaststoffen, Salz; Bearbeiten zeigt „Nährwerte für 50 g“ |
| `pnpm test:coverage` | Schwellen eingehalten (gesamt: Anweisungen 88,78 %, Zweige 80,06 %, Funktionen 86,29 %, Zeilen 89,94 %) |
| `pnpm build`, `pnpm check:bundle` | bestanden; Startansicht 233,1 KB gzip (Grenze 250 KB) |
| `pnpm test:e2e` (Chromium Desktop und Pixel 7) | Erster Lauf: 152 bestanden, 2 fehlgeschlagen (`install-hint.spec.ts` suchte „Als App installiert“ aus der entfernten Statuskarte). Prüfung angepasst, die Erkennung prüft weiter die Seite „Installieren“; danach `install-hint.spec.ts` 4 bestanden. Neu in `nutrition.spec.ts`: Nährwerttabelle „für 200 g“ mit Zucker und Salz, Tageswerte. Erster Lauf der axe-Prüfung fand `dlitem` bei `role="group"` auf der Liste; behoben mit einer Gruppe um die Liste |
| WebKit, Gerätetest | WebKit läuft in GitHub Actions; Gerätetest steht aus |

### Barcode-Scanner mit Open Food Facts · 19.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1194)

Scanner mit Kamera und Eingabe von Hand, lokale Suche nach Barcode, Open Food Facts nach Einwilligung, Treffer unter „Meine Lebensmittel“ (D-266).

| Nachweis | Ergebnis |
|---|---|
| Open Food Facts erreichbar? | Nein, aus der Cloud-Umgebung gesperrt (`connect_rejected`). Alle Abfragen sind mit nachgebildeten Antworten getestet; der erste echte Scan auf dem iPhone ist Prüfspike S-1 |
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | bestanden |
| `pnpm test` | 73 Dateien, 575 Tests bestanden. Neu: `barcode.test.ts` (Prüfziffer EAN-13, EAN-8, UPC-A; UPC-A gleich EAN-13 mit 0; Übersetzung der Antwort mit Marke, Portion, kJ → kcal, ml, fehlende Pflichtwerte, unbekannt), `barcodeService.test.ts` (ohne Einwilligung keine Anfrage; nach Einwilligung genau eine Anfrage mit `credentials: 'omit'`, gespeichert mit Quelle und Barcode; zweiter Scan lokal; zurückgezogen wieder keine Anfrage; eigenes Lebensmittel mit Barcode ohne Netz; ungültig, 404, Netzfehler, 503, unvollständig), zwei Fälle in `nutrition-ui.test.tsx` (Eingabe von Hand, Einwilligung, speichern und eintragen, zweiter Scan lokal; unbekannt → Formular mit Barcode) |
| `pnpm test:coverage` | Schwellen eingehalten (gesamt: Anweisungen 87,96 %, Zweige 79,66 %, Funktionen 85,69 %, Zeilen 89,21 %) |
| `pnpm build`, `pnpm check:bundle` | bestanden; Startansicht 235,1 KB gzip (Grenze 250 KB); Scanner und WebAssembly (1,1 MB) liegen in eigenen, erst beim Öffnen geladenen Teilen und im Offline-Speicher |
| `pnpm test:e2e` (Chromium Desktop und Pixel 7) | 158 Tests bestanden. Neu `barcode.spec.ts` (Open Food Facts nachgebildet: vor der Einwilligung keine Anfrage, danach genau eine, eingetragen, nach Neuladen lokal gefunden, Erlaubnis zurückziehen; CSP ohne Konsolenfehler) und `barcode-camera.spec.ts` (künstliche Kamera: Scanner läuft, WebAssembly von der eigenen Adresse, keine fremden Anfragen) |
| WebKit, Gerätetest | WebKit läuft in GitHub Actions; Kamera und echter Scan auf dem iPhone stehen aus |

### Gerätetest Barcode-Scanner · 19.10.2026, iPhone (Produktinhaber)

| Nachweis | Ergebnis |
|---|---|
| Prüfspike S-3 (Kamera und Erkennung auf dem iPhone) | bestanden: „Scanner funktioniert“ |
| Prüfspike S-1 (Open Food Facts von der App aus) | bestanden: Marke und Nährwerte wurden geliefert |

### Rezepte (M7) · 19.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1194)

Rezepte mit Zutaten aus allen Quellen, Nährwerte je Portion und gesamt, portionsweise eintragen, Dexie v4 (D-267).

| Nachweis | Ergebnis |
|---|---|
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | bestanden |
| `pnpm test` | 74 Dateien, 581 Tests bestanden. Neu: `recipeService.test.ts` (Haferflocken 80 g und Banane 120 g: 373,2 kcal gesamt, 186,6 kcal je Portion und je 100 g, wie per Hand; fehlende Werte fehlen in der Summe; speichern, ändern, archivieren, löschen, wiederherstellen; Prüfungen; Eintrag als `recipe` mit Portion 100 g und eingefrorenen Werten), Migrationstest v3 → v4, ein Fall in `nutrition-ui.test.tsx` (Rezept anlegen mit zwei Zutaten, 187 kcal je Portion, in der Suche mit Etikett „Rezept“ eintragen); angepasst: Schema-, Snapshot- und Exporttests auf v4 |
| `pnpm test:coverage` | Schwellen eingehalten (gesamt: Anweisungen 87,45 %, Zweige 79,17 %, Funktionen 84,85 %, Zeilen 88,72 %) |
| `pnpm build`, `pnpm check:bundle` | bestanden; Startansicht 235,7 KB gzip (Grenze 250 KB) |
| `pnpm test:e2e` (Chromium Desktop und Pixel 7) | 168 Tests bestanden. Neu in `nutrition.spec.ts`: Rezept anlegen, nach Neuladen eintragen; `/ernaehrung/rezepte` und `/ernaehrung/rezepte/neu` in der Netz- und axe-Prüfung (Hell und Dunkel) ohne Verstöße |
| WebKit, Gerätetest | WebKit läuft in GitHub Actions; Gerätetest steht aus |

### Mahlzeit-Vorlagen · 19.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1194)

Vorlage aus einer Mahlzeit speichern, mit einem Tipp in eine Mahlzeit eintragen, umbenennen, löschen mit Rückgängig, Dexie v5 (D-268).

| Nachweis | Ergebnis |
|---|---|
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | bestanden |
| `pnpm test` | 75 Dateien, 585 Tests bestanden. Neu: `mealTemplateService.test.ts` (Frühstück aus Haferflocken 60 g, Banane 120 g und Schnelleintrag als Vorlage; an einem anderen Tag in „Snacks“ eingetragen mit 208,8, 94,8 und 30 kcal, Reihenfolge und Schätzung erhalten, eigene IDs; umbenennen, löschen, wiederherstellen; Prüfungen), Migrationstest v4 → v5, ein Fall in `nutrition-ui.test.tsx` (speichern am Tag, eintragen über „Vorlagen“ ins Abendessen, löschen mit Rückgängig) |
| `pnpm test:coverage` | Schwellen eingehalten (gesamt: Anweisungen 87,4 %, Zweige 79,17 %, Funktionen 84,71 %, Zeilen 88,63 %) |
| `pnpm build`, `pnpm check:bundle` | bestanden; Startansicht 236,0 KB gzip (Grenze 250 KB) |
| `pnpm test:e2e` (Chromium Desktop und Pixel 7) | 174 Tests bestanden. Neu in `nutrition.spec.ts`: Vorlage speichern, nach Neuladen ins Abendessen eintragen; `/ernaehrung/vorlagen` in der Netz- und axe-Prüfung (Hell und Dunkel) ohne Verstöße |
| WebKit, Gerätetest | WebKit läuft in GitHub Actions; Gerätetest steht aus |

### Synchronisierung, erste Stufe · 19.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1194) und Supabase-Projekt

Supabase-Projekt „fitness-app“ (Frankfurt), Tabelle `sync_documents` mit RLS, Funktion `push_documents`, Anmeldung, automatischer Abgleich, Dexie v6 (D-269).

| Nachweis | Ergebnis |
|---|---|
| Supabase erreichbar? | Aus der Cloud-Umgebung nicht (`curl` ohne Antwort); Datenbank über das Supabase-Werkzeug erreichbar |
| SQL-Test im Projekt (in einer Transaktion, danach zurückgerollt) | Zwei Testnutzer: neues Dokument `accepted`; ältere Fassung `stale`; jüngere Fassung `accepted`, Inhalt ersetzt, `rev` höher; zweiter Nutzer sieht 0 Zeilen (RLS). Danach 0 Nutzer, 0 Dokumente |
| Supabase-Sicherheitsprüfung (Advisors) | keine Hinweise |
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | bestanden |
| `pnpm test` | 79 Dateien, 603 Tests bestanden. Neu: `merge.test.ts` (Regeln: Neues, unverändert, eigene Fassung, jüngerer HLC, K-01, Konfliktkopie, Löschung), `syncEngine.test.ts` (zwei Geräte mit nachgebildetem Server nach den Regeln von `push_documents`: anlegen, ändern, löschen in beide Richtungen; gleichzeitige Änderung, Uhr läuft vor; Konfliktkopie bei Programmen; abgeschlossene Einheit gewinnt, Projektion wird neu aufgebaut; ungültige Zeilen übergangen; anderer Nutzer setzt Cursor und Basis zurück), `syncService.test.ts` (Anmeldung, falsches Passwort, Abmelden, Token-Erneuerung und Wiederholung nach 401, abgelaufene Anmeldung, Status), `sync-ui.test.tsx` (anmelden, abgleichen, abmelden), Migrationstest v5 → v6. Gefunden und behoben beim Test: Ein Gerät hielt die eigene, schon gesendete Fassung beim Abholen für einen Konflikt |
| `pnpm test:coverage` | Schwellen eingehalten (gesamt: Anweisungen 87,11 %, Zweige 78,95 %, Funktionen 84,48 %, Zeilen 88,42 %) |
| `pnpm build`, `pnpm check:bundle` | bestanden; Startansicht 236,9 KB gzip (Grenze 250 KB) |
| `pnpm test:e2e` (Chromium Desktop und Pixel 7) | 180 Tests bestanden. Neu `sync.spec.ts` (Supabase nachgebildet: Gewicht erfassen, anmelden, Abgleich sendet das Gewicht, nach Neuladen weiter angemeldet; CSP ohne Konsolenfehler); `/mehr/synchronisierung` in der Netz- und axe-Prüfung; ohne Anmeldung keine Anfragen an Supabase |
| Anmeldung im Vollbild (D-270) | Entwürfe als Bild abgenommen; danach Bildschirmfotos aus der gebauten App (Chromium, 1280 px und iPhone-Größe 390 px) wie der Entwurf. Kontraste der neuen Tokens in `tokens.test.ts`; `sync.spec.ts` zusätzlich: Startfokus auf dem Titel, „Später“ und Escape führen zu „Mehr“. Erster Versuch mit `autoFocus` scheiterte (Fokus landete auf „Später“), behoben durch Fokus nach dem Öffnen |
| WebKit in GitHub Actions | Erster Lauf: `sync.spec.ts` rot, die Anmeldung erreichte den echten Server statt der Nachbildung (Anfragen der vom Service Worker gesteuerten Seite umgehen in WebKit `page.route`); behoben, der Test blockiert den Service Worker. Zweiter Lauf: `barcode.spec.ts` rot auf webkit-mobile, „Importing a module script failed“, weil ein Seitenwechsel das Nachladen des Hintergrund-Abgleichs abbrach und die Fehleranzeige auslöste; behoben, ein gescheitertes Nachladen lässt die App ohne Abgleich weiterlaufen. Lokal danach `barcode`, `sync`, `shell` (Chromium) 20 Tests bestanden; Startansicht 237,8 KB gzip |
| Gerätetest | Abgleich zwischen zwei echten Geräten steht aus |
