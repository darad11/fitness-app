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

- **Diese Cloud-Umgebung:** Node 22.22; Chromium (Playwright-Build 1243, bis F6 1194) unter `/opt/pw-browsers` vorinstalliert; WebKit fehlt. `playwright install` darf hier nicht laufen. Lokale E2E-Läufe nutzen Chromium über `executablePath`.
- **GitHub Actions:** Node 24; die E2E-Jobs laufen im offiziellen Image von Playwright (`mcr.microsoft.com/playwright:v<Version>-noble`, Version aus dem Lockfile), ohne `playwright install` (D-344); alle E2E-Tests in beiden Engines (D-210). Die früher wackelnden Tests laufen auf Abruf 20-mal ohne Wiederholung (`repeat.yml`, Label „wiederholen“ oder von Hand).
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
| E-15 | Übungstimer, Notizen, Nachtragen; Pausieren offen (D-297) | AK-TRN-14, -18 (offen), -23, -24 |
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
| K-03 | B verwirft die veraltete laufende Kopie, A hat abgeschlossen | Einheit bleibt erhalten (automatisiert in `merge.test.ts` und `syncEngine.test.ts`, D-293) |
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

### 4.5 Schalter und Umschalter (F5, D-322)

Ein-/Aus-Schalter (`Switch`, Rolle „switch“). Getestet in `e2e/switches.spec.ts` mit einem Tipp auf die Schalterfläche selbst (Handy: Touch, Desktop: Maus; eine Aufgabe zusätzlich mit der Leertaste), Tippfläche mindestens 44 × 44, Zustand sofort sichtbar und nach dem Neuladen unverändert.

| Schalter | Ort | Gespeichert |
|---|---|---|
| Mit Training abhaken | Tagesaufgaben › Aufgabe bearbeiten | mit „Speichern“ an der Aufgabe (D-285) |
| Mit Wasserziel abhaken | Tagesaufgaben › Aufgabe bearbeiten | mit „Speichern“; höchstens eine Regel je Aufgabe (D-289) |
| Als Tabelle | Fortschritt › Körpergewicht | sofort, gerätelokal `view.bodyWeightTable` |
| Als Tabelle | Fortschritt › Übung | sofort, gerätelokal `view.exerciseTable` |
| Pause nach „erledigt“ automatisch starten | Mehr › Einstellungen | sofort in den Einstellungen |
| Ton bei Pausenende | Mehr › Einstellungen | sofort in den Einstellungen |
| Bildschirm im Training aktiv halten | Mehr › Einstellungen | sofort in den Einstellungen |
| Je Seite | Übungen › Eigene Übung anlegen bzw. bearbeiten | mit „Anlegen“ bzw. „Speichern“ |
| Nach der letzten Woche von vorn beginnen | Programm bearbeiten | sofort am Programm |
| Favorit | Lebensmittel bearbeiten | sofort |
| Favorit | Rezept bearbeiten | sofort |

Umschalter mit mehreren Werten. Die Einfachauswahl (`SegmentedControl`) besteht aus Optionsfeldern in ihrem `label`, ein Tipp auf den ganzen Chip wirkt; `e2e/switches.spec.ts` tippt jede Option an: Zeitraum in Fortschritt, Körpergewicht, Wasser und Tagesaufgaben, Art beim Nachtragen, „Nährwerte je“ beim Lebensmittel, Ansicht der Einkaufsliste. Weitere: Kennzahl und Zeitraum im Übungsfortschritt sowie Zeitraum der Auswertung einer Aufgabe (dieselbe Komponente), Reiter „Muskeln“ und „Alternativen“ in den Übungsdetails (`Tabs`, `exercises.spec.ts`), Wochentage einer Aufgabe (Chips mit `aria-pressed`, `tasks.spec.ts`, `switches.spec.ts`), Abhaken von Aufgaben und Einkäufen (Kontrollkästchen im `label`, `tasks.spec.ts`, `shopping.spec.ts`), „Satz erledigt“ im Player (Knopf mit `aria-pressed`, `session.spec.ts`, `player.spec.ts`). Aufklapper mit `aria-expanded` (pausierte Aufgaben, erledigte Einkäufe, Pausenkarte, Aktionen eines Satzes, Meine Küche) sind Knöpfe.

Gegen Regressionen an der gemeinsamen Stelle: `src/app/class-conflicts.test.ts` meldet jede Klasse, die einer gemeinsamen Komponente (Chip, Knopf, Symbol-Knopf) eine eigene Eigenschaft überschreibt.

## 5. CI-Gates

Jeder Pull Request und jeder Push auf `main` (Arbeitszweige laufen über ihren Pull Request, damit nichts doppelt läuft): Lint, Typprüfung, Unit- und Integrationstests mit Abdeckung (`calc/` ≥ 95 %, `service/` und `data/` ≥ 85 % Zeilen), E2E in Chromium und WebKit, Build, PWA-Prüfungen aus Abschnitt 3, Bündelgröße der Startansicht unter 250 KB komprimiert, Kontrasttest der Tokens. Ein roter Lauf blockiert Merge und Auslieferung.

Umsetzung (M0) in `.github/workflows/ci.yml`:

| Gate | Befehl | Stand |
|---|---|---|
| Formatierung, Lint mit Modulgrenzen, Typprüfung | `pnpm format:check`, `pnpm lint`, `pnpm typecheck` | Umgesetzt |
| Unit-, Integrations- und Komponententests mit Abdeckungsschwellen | `pnpm test:coverage` (Schwellen in `vitest.config.ts`: `shared/lib` und `calc/` ≥ 95 %, `shared/db`, `data/` und `service/` ≥ 85 % Zeilen) | Umgesetzt |
| Kontrasttest der Tokens | Teil von `pnpm test:coverage` (`tokens.test.ts`) | Umgesetzt |
| Dokumentprüfungen | `pnpm check:docs` | Umgesetzt |
| Build und Bündelgröße der Startansicht | `pnpm build`, `pnpm check:bundle` (Grenze 250 KB gzip; dazu `tools/check-precache.mjs`: jede Datei der App steht in der Vorab-Liste des Service Workers oder ist bewusst ausgenommen, D-343) | Umgesetzt |
| E2E in Chromium und WebKit einschließlich PWA-Prüfungen | `pnpm test:e2e` je Engine | Umgesetzt. In der CI wird ein fehlgeschlagener Test einmal wiederholt; Fehler erscheinen zusätzlich als GitHub-Annotationen (Reporter `github`), weil die Logdateien aus der Cloud-Umgebung nicht abrufbar sind. `openPage` wartet, bis die Überschrift sichtbar ist und kein Bereich mehr `aria-busy` trägt. Die Jobs laufen im Image von Playwright, Zeitgrenze 30 min je Job (D-344) |
| Wiederholung der früher wackelnden Tests | `.github/workflows/repeat.yml`: 20-mal hintereinander, ohne Wiederholung bei Fehlschlag, Chromium und WebKit | Umgesetzt, auf Abruf (Label „wiederholen“ am Pull Request oder von Hand), kein Gate (D-344) |

## 6. Geräteprotokolle

Jedes Protokoll wird mit Datum, Gerät, Betriebssystemversion, App-Version und Ergebnis je Schritt in Abschnitt 7 eingetragen (AK-DEV-03). Ich werte die Befunde aus und übertrage Abweichungen in `known-limitations.md`.

### T-IPH-M0 · iPhone, Installation und Offline-Start

1. Produktivadresse `https://fitness-app-mu-drab.vercel.app` in Safari öffnen. Erwartung: Hinweis zur Installation und zur Datentrennung.
2. „Teilen › Zum Home-Bildschirm" ausführen, App vom Home-Bildschirm starten. Erwartung: Vollbild ohne Browserleiste, Name und Icon korrekt.
3. Flugmodus ein, App beenden und neu starten. Erwartung: Alle Bereiche öffnen sich ohne Fehler.
4. Nach einer zweiten Auslieferung App öffnen. Erwartung: Hinweis „Neue Version verfügbar"; Wechsel erst nach Bestätigung.
5. Startbild (D-317): Ablauf (D-329): zuerst an der Vorschau von Vercel zum Pull Request (eigene Adresse, eigene App), nach dem Merge an der Produktivadresse. Die Daten in der App sind Testdaten; dass iOS beim Entfernen die Daten der installierten App löschen kann, spielt hier keine Rolle. Für echte Nutzer gilt die Warnung weiter, bis sich ein Export wieder einspielen lässt (`audit-report.md` A-14). App vom Home-Bildschirm entfernen und über „Teilen › Zum Home-Bildschirm“ neu hinzufügen (iOS lädt Name, Icon und Startbilder nur dabei), App beenden und neu starten, einmal hochkant und einmal quer. Erwartung: Startbild C3 (D-325): grünes F über der Wortmarke FORM, Mitte leicht über der Bildschirmmitte, unten „FORM YOURSELF.“; kein weißer Blitz; die Startfläche der App übernimmt ohne Sprung, bleibt ab dem ersten Bild mindestens 1 Sekunde stehen und blendet dann in etwa 300 ms zu „Heute“ über, ohne hellen Zwischenschritt (D-337); nach der Rückkehr aus dem Hintergrund und beim Wechsel der Ansicht erscheint sie nicht. Zu notieren: iPhone-Modell.
6. Logo der Kopfzeile (D-332): „Heute“ im Safari-Tab der Vorschau und in der installierten App öffnen, oben und nach kurzem Scrollen. Erwartung: Kachel und Wortmarke gestochen scharf, kein Schleier über dem Logo; über der Kopfzeile ein ruhiger Abstand von etwa 2 Fingerbreiten unter der Statusleiste. Zu notieren: Wirkt der Abstand zu groß, ob das Logo auch mit weniger Abstand scharf bleibt (Wert `--spacing-edge-clear`).

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
| 14 | Programmtag starten, nach unten scrollen, bis der aktive Satz direkt unter dem Kopf liegt; Gewicht und Wiederholungen eingeben, mit dem Häkchen der Tastaturleiste bestätigen, „Satz erledigt“; danach einen Satz bei offener Tastatur direkt mit „Satz erledigt“ (D-323) | Beim Tippen bewegt sich nichts; nach jedem Satz steht der nächste Satz sichtbar unter Kopf und Pausenkarte | Sprang die Ansicht beim Schließen der Tastatur? |

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
| 24.10.2026 | T-IPH-M0 Schritt 4 (Update nach D-343) | iPhone 18 Pro | iOS 27.0.1 | Vorschau `form-stabilitaet`, Update auf Build `b501403` | Bestanden: Während des laufenden Trainings kein Hinweis, „Über die App“ meldete die bereite Version; nach dem Beenden „Neue Version verfügbar“, danach Build `b501403`, alle Daten vorhanden. Start im Flugmodus in Ordnung | keine |
| 24.10.2026 | Wiederherstellen aus dem Export mit Dateien-App und Teilen-Menü (D-345, Ablauf in `form-stabilitaet-report.md` Abschnitt 4) | iPhone 18 Pro | iOS 27.0.1 | Vorschau `form-stabilitaet` | Bestanden: alle Schritte wie beschrieben | keine |

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

Der Produktinhaber hat am 18.10.2026 die unklaren Übungen von Programm C nachgesehen (Q-13); Abgleich und Rekonstruktion sind aktualisiert.

### M1 · AP 1.9 Tests · 18.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1194)

| Prüfung | Befehl | Ergebnis |
|---|---|---|
| E2E Chromium (Desktop und Pixel 7) | `pnpm test:e2e` | 40 von 40 bestanden (neu: `resilience.spec.ts`) |

E-04: Nach einem simulierten Wechsel in den Hintergrund (1,5 s verborgen) zeigt die Pause bei Rückkehr sofort die richtige Restzeit; auf unter null verkürzt zeigt sie „+m:ss“ und „Pause vorbei“, auch nach Neuladen (AK-TRN-11, AK-TRN-12). E-05: Offline (Chromium mit Service Worker) Übung über die Suche hinzufügen, Satz erfassen, neu laden, Leiste „Training läuft“ auf „Mehr“ (AK-PWA-02, AK-TRN-17); in WebKit übersprungen, dort prüft T-IPH-M1 Schritt 8 auf dem Gerät. E-03, E-06 bis E-09 sind seit AP 1.4 in `session.spec.ts` enthalten. Die Karte „Diese Version“ auf „Heute“ nennt den tatsächlichen Umfang von M1.

Aus der CI: Der Chromium-Lauf mit Pixel-7-Emulation scheiterte zweimal am Zeigerklick auf „Fertig“ in der Zusammenfassung (Treffererkennung meldete `<main>`); WebKit und alle anderen Läufe waren grün, lokal war der Fehler mit Chromium 1194 nicht nachstellbar, das CI-Protokoll liegt auf einem gesperrten Speicherhost. Der Schritt löst den Link jetzt per Ereignis aus; Ergebnis der CI siehe Pull Request darad11/fitness-app#5.

**Offen für die Abnahme von M1:** Gerätetest T-IPH-M1 (Abschnitt 6) durch den Produktinhaber mit Befunden zu Ton, Wake Lock, Hintergrund, Flugmodus und Teilen-Menü.

### Schritt B · Bibliothek erweitert · 18.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1194)

19 neue Übungen und englische Alias-Namen für Varianten (D-248); `exercise-library.md` Abschnitte 4 und 5 neu erzeugt, Abgleich in `winterprogramm-2026.md` auf „vorhanden“ gesetzt. Zod-Prüfung der Daten, Suche, Filter und Bibliotheksansicht mit 124 Übungen bestanden (`coreLibrary.test.ts`, `search.test.ts`, `exercise-library.test.tsx`, E2E `exercises.spec.ts`); vier Sucherwartungen an die größeren Treffermengen angepasst (z. B. findet „t bar“ jetzt auch Alias-Namen mit „Barbell“, der Namenstreffer bleibt vorn).

### Schritt C · Programme A, B, C und aktives Programm · 18.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1194)

Programme als gebündelte Vorlagen (`programs.v1.json`, 3 Programme, 84 Trainingstage; `programs.md`), Singleton `training_state`, Fortschritt aus den Einheiten, Aktivieren und Beenden, nächster Tag mit Zähler „Trainingstag x von n“ auf Training, „Heute geplant“ und in der Vorlage, Zusammenfassung mit Zähler (D-249).

| Nachweis | Ergebnis |
|---|---|
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck` | bestanden |
| `pnpm check:docs` (mit `programs_build.py --check`) | bestanden: Programme 3, Trainingstage 84; `programs.v1.json` steht in `.prettierignore`, weil Prettier die erzeugte Datei sonst umformatiert |
| `pnpm test` | 42 Dateien, 402 Tests bestanden. Neu: `programProgress.test.ts` (Folge, nächster Tag, Durchläufe, Wiederholung, Abschluss, frei gewählter Tag), `programs.test.ts` (Inhalt A, B, C: Beinpresse, 3 Sätze, Rotation, Laufband Tag 14 einmal 30 min, Dropsets ohne Pause, englische Namen), `programService.test.ts` (aktivieren, Wechsel, beenden, ungültige ID), `programs-ui.test.tsx` (6 neue Fälle: aktivieren, Zähler, Folgetag, Start von Training als `source: 'program'`, Zusammenfassung, Etikett „Aktiv“, beenden, Programm C mit Wochen und „Erledigt“); `format.test.ts` (Dauerziele ab einer Minute als „30:00 min“) |
| `pnpm test:coverage` | Schwellen eingehalten (gesamt: Anweisungen 89,4 %, Zweige 81,9 %, Funktionen 87,5 %, Zeilen 90,2 %) |
| `pnpm build`, `pnpm check:bundle` | bestanden; Startansicht 199,2 KB gzip (Grenze 250 KB); Programme werden wie die Vorlagen erst bei Bedarf geladen |
| `pnpm test:e2e` (Chromium Desktop und Pixel 7) | 44 Tests bestanden, zweimal hintereinander. Neu `programs.spec.ts`: Programm A aktivieren, „Als Nächstes“, Start aus „Heute geplant“, Beenden, Zusammenfassung „Trainingstag 1 von 32“, Training zeigt „Trainingstag 2 von 32 · Tag B“, Etikett „Aktiv“, Programm beenden; Programm C mit 8 Wochen, Dropset-Hinweis, englischer Name, Laufband „1 Satz · 30:00 min · ohne Pause“. `templates.spec.ts` auf 7 Einträge angepasst. Die Seite von Programm C gehört jetzt zu den Seiten der axe-Prüfung |
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
| Befund aus der CI von #12 | Der Komponententest zu Programm C fand „Trainingstag 2 von 40“ nicht innerhalb von 1 s, weil die Seite mit 40 Tagen in jsdom auf dem Runner langsamer rendert; zugleich zeigte die Programmkarte während des Ladens fälschlich „Programm abgeschlossen“. Behoben in #12: Ladetext statt „abgeschlossen“, Wartezeit 10 s, Testzeit 20 s |
| WebKit, Gerätetest | WebKit läuft in GitHub Actions; Gerätetest steht aus |

### Eigene Programme und Vorlagen (AP 2.1 bis 2.4) · 19.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1194)

Eigene Programme anlegen, übernehmen, bearbeiten (Wochen, Tage, Übungen, Sätze mit Bereich, Zielgewicht, Zeit, Distanz, Drop-Sätzen, Pausen, Hinweisen, Wochentag), duplizieren, als Vorlage speichern, Vorlage verwenden, archivieren und löschen mit Rückgängig; Start und Fortschritt wie bei gebündelten Programmen (D-257).

| Nachweis | Ergebnis |
|---|---|
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | bestanden |
| `pnpm test` | 63 Dateien, 519 Tests bestanden. Neu: `programTree.test.ts` (Stempel nur für geänderte und verschobene Elemente, Tombstones, Anzeigeform, Kopie mit neuen IDs und verknüpften Drops), `programEdit.test.ts` (Wochen, Tage, Übungen, Sätze; Grenzen „letzte Woche“, „letzter Tag“, „letzter Arbeitssatz“, Höchstzahl; Ersetzen mit Anpassung an die Erfassungsart; Original bleibt unverändert), sechs Fälle in `programService.test.ts` (Anlegen, Namensprüfung, Übernahme von Programm C mit neuen IDs, Duplizieren und Vorlagen, AK-PRG-10 laufende Einheit behält ihre Ziele, ungültige Struktur ohne Speichern, Archivieren und Löschen beenden ein aktives Programm, Wiederherstellen ohne erneute Aktivierung), Wochentag-Hinweis in `programProgress.test.ts`, vier Fälle in `own-programs-ui.test.tsx` (Anlegen bis Start mit Zielgewicht; Übernehmen; Löschen mit Rückgängig; Duplizieren und Archiv) |
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

### Marken zu den ÖNWT-Lebensmitteln · 19.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1194)

Marken aus `nuts-marken.json` herauslösen, beim Import zuordnen, in der Suche anzeigen (D-271).

| Nachweis | Ergebnis |
|---|---|
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | bestanden |
| `pnpm test` | 76 Dateien, 593 Tests bestanden. Neu: `catalogBrands.test.ts` (Regeln an Beispielen aus der Datei, u. a. Alnatura, Bahlsen GmbH & Co. KG, Knorr, Unilever, ja! Natürlich, Dr. Oetker; keine Marke bei „/“ und Beschreibungen; Datei erkennen und lesen), ein Fall in `catalogService.test.ts` (Markendatei ohne Lebensmitteldaten abgelehnt, Zuordnung nur bei gleichem Code und Namen, Marken bleiben bei neuem Import, „Import entfernen“ löscht beide) |
| `pnpm test:coverage` | Schwellen eingehalten (gesamt: Anweisungen 87,43 %, Zweige 79,09 %, Funktionen 84,59 %, Zeilen 88,69 %) |
| `pnpm build`, `pnpm check:bundle` | bestanden; Startansicht 236,2 KB gzip (Grenze 250 KB) |
| `pnpm test:e2e` (Chromium Desktop und Pixel 7) | 174 Tests bestanden |
| Echte Dateien im Build (Chromium, Pixel-Größe) | `nuts-recherche.json`: Vorschau 7.476 übernommen; `nuts-marken.json`: Vorschau „5.934 deiner importierten Lebensmittel bekommen eine Marke“; danach „7.476 Lebensmittel importiert · 5.934 davon mit Marke“. Suche „hummus“: 12 Treffer, z. B. „Hummus classic · Alnatura“, „Hummus Classic · NENI“; Suche „alnatura“: 50 Treffer (Grenze der Liste) |
| WebKit, Gerätetest | WebKit läuft in GitHub Actions; Import auf dem iPhone steht aus |

### Registrieren im Anmeldefenster · 19.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1194)

Registrieren mit E-Mail und Passwort, Bestätigungsmail, Rückkehr über den Link (D-273). Supabase ist aus der Cloud-Umgebung nicht erreichbar; geprüft mit nachgebildeten Antworten.

| Nachweis | Ergebnis |
|---|---|
| `pnpm test` (Synchronisierung) | 25 Tests bestanden. Neu in `syncService.test.ts`: sofort angemeldet ohne Bestätigung (Anfrage an `/auth/v1/signup` mit `redirect_to`, E-Mail ohne Leerzeichen), mit Bestätigung kein gespeicherter Zugang, fünf Ablehnungen werden richtig erkannt; in `sync-ui.test.tsx`: zu kurzes und abweichendes Passwort ohne Anfrage, danach Hinweis auf die Bestätigungsmail und zurück zu „Anmelden“ |
| `pnpm test:e2e` (Chromium Desktop und Pixel 7) | alle 184 bestanden; davon `sync.spec.ts` 6. Neu: Registrieren mit Bestätigungsmail; Rückkehr über den Link entfernt `access_token` aus der Adresse und zeigt den Hinweis. Erster Versuch scheiterte am Test selbst (Sprung nur im Anker lädt die Seite nicht neu) |
| Gerätetest | Steht aus: echte Registrierung gegen Supabase, Bestätigungsmail, Anmeldung am iPhone |

### Glas-Look · 19.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1194)

Glas-Look in hell und dunkel, Tab-Leiste mit Linse, einklappbare Seitenleiste, Kalorien-Ring, Gewichtskurve, ohne Vorschau-Balken (D-272).

| Nachweis | Ergebnis |
|---|---|
| Entwürfe | Als Bild abgenommen (Heute, Training, Ernährung; Handy und Web); danach Bildschirmfotos aus der gebauten App in hell und dunkel, Handy (390 px) und Web (1280 px), auch Seitenleiste ausgeklappt und Linse beim Ziehen |
| Kontrast der Tokens | `tokens.test.ts` neu: mischt durchscheinende Farben und prüft jede sichtbare Mischfarbe (3 Verlaufspunkte, 3 Lichtflecken in voller Stärke auf jedem, Glas darauf, Glas auf Glas); 140 Fälle bestanden. Erste Werte fielen bei 36 Paaren durch (vor allem Akzent und Signalfarben auf den Lichtflecken im Dunkeln); Flecken abgeschwächt, Textfarben angepasst |
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | bestanden |
| `pnpm test` | 79 Dateien, 646 Tests bestanden. Angepasst: Navigationstest (Tab-Leiste markiert über die Klasse `active`), Farbe für `theme-color`; entfernt: Test des Vorschau-Balkens |
| `pnpm test:coverage` | Schwellen eingehalten (gesamt: Anweisungen 84,4 %, Zweige 76,34 %, Funktionen 82,99 %, Zeilen 85,63 %); die Linse ist per E2E geprüft |
| `pnpm build`, `pnpm check:bundle` | bestanden; Startansicht 243,5 KB gzip (Grenze 250 KB) |
| `pnpm test:e2e` (Chromium Desktop und Pixel 7) | 183 bestanden, 1 übersprungen (Linse nur am Handy). Neu `tabbar.spec.ts`: Ziehen von „Heute“ nach „Ernährung“ hebt die Linse an und wählt beim Loslassen, danach liegt sie wieder; Tippen auf „Training“. Erster Lauf: axe meldete zu wenig Kontrast der aktiven Beschriftung über einer dunklen Karte (Leiste mit 80 % Deckkraft); behoben mit 90 %. `shell.spec.ts`: neue Farbe für `theme-color` |
| Nachtrag Seitenleiste | Auf Wunsch rückt der Inhalt beim Ausklappen mit (Abstand links 5,5 → 16,5 rem, 0,24 s); `tabbar.spec.ts` prüft am Desktop, dass der Titel unter der Maus um mehr als 150 px nach rechts rückt: bestanden |
| Nachtrag Ernährung | Weitere Nährwerte in den Spalten der Makros (Salz, Zucker, Ballaststoffe, gesättigte Fettsäuren) und dezent zugeklappt; Ziel, Lebensmittel, Rezepte, Vorlagen als Kacheln direkt unter „Gegessen“. `nutrition.spec.ts` klappt die weiteren Nährwerte auf. E2E 184 bestanden; einmal `network-a11y` „eigene Adresse“ am Desktop rot, bei Wiederholung grün |
| Nachtrag „Meine Küche“ | Entwürfe zweimal als Bild abgestimmt; danach Bildschirmfotos aus der gebauten App (Handy mit Glas-Fläche, Web mit Menü). Neu in `nutrition.spec.ts`: „Meine Küche“ öffnet am Handy die Fläche, am Desktop das Menü (Escape schließt), führt zu „Rezepte“. Ernährung und Netz/axe: 112 bestanden |
| Nachtrag Ring | Mehrere Entwürfe als Bild abgestimmt (mehrere Ringe, ein geteilter Ring, Verlauf, zuletzt 1:1 nach Vorlage); Bilder aus der gebauten App mit Haferflocken 150 g, Hähnchenbrust 250 g, Olivenöl 20 g. `tokens.test.ts`: Farben der Makros mindestens 3:1 auf `--ink` und `--ink-2` in beiden Modi (erstes Blau fiel mit 2,94:1 durch, aufgehellt). `nutrition.spec.ts` erwartet „/ 2.200 kcal“ |
| WebKit in GitHub Actions (Glas-Look) | `sync.spec.ts` „Später und Escape“ am Desktop rot: Escape kam, bevor das Anmeldefenster nach dem erneuten Öffnen offen war (Zeitproblem im Test). Behoben: Der Test wartet jetzt auf den Fokus im Fenster |
| Bekannt | Das Weichzeichnen hinter der Tab-Leiste zeigt Chromium im Test nur teilweise; auf dem iPhone steht es aus (Gerätetest) |
| WebKit, Gerätetest | WebKit läuft in GitHub Actions; Gerätetest auf dem iPhone steht aus |

### Gewicht nur einmal eintragen · 19.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1194)

Aktuelles Gewicht beim Zielgewicht, ein Knopf „Gewicht erfassen“ (D-274).

| Nachweis | Ergebnis |
|---|---|
| `pnpm test` | 80 Dateien, 674 Tests bestanden |
| `pnpm test:e2e` (Chromium Desktop und Pixel 7) | 190 bestanden, 2 übersprungen. Neu in `goals.spec.ts`: ohne Eintrag genau ein Knopf; Profil zeigt „Noch kein Gewicht gemessen“, nach 81,4 kg „Dein aktuelles Gewicht: 81,4 kg“. Ein zuerst gebautes Häkchen beim Kalorien-Vorschlag wurde auf Wunsch wieder entfernt |
| Bildschirmfotos | Handy dunkel: Körpergewicht leer, Zielgewicht mit aktuellem Gewicht |

### Ring und Scanner auf „Heute“ · 19.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1194)

Kleiner Makro-Ring und „Barcode scannen“ auf „Heute“ (D-275).

| Nachweis | Ergebnis |
|---|---|
| `pnpm test` | 81 Dateien, 675 Tests bestanden (neu: `mealSlot.test.ts`, Mahlzeit nach Uhrzeit) |
| `pnpm test:e2e` (Chromium Desktop und Pixel 7) | 190 bestanden, 2 übersprungen (Stand vor dem Einholen von #29). Neu in `barcode.spec.ts`: Ring auf „Heute“ mit „0 / 2.200 kcal“, „Barcode scannen“ öffnet den Scanner sofort, nach dem Eintragen zurück auf „Heute“ mit neuem Wert |
| Bildschirmfotos | Entwurf als Bilder aus der gebauten App (Handy hell und dunkel, Web hell und dunkel, Scanner), vom Produktinhaber freigegeben |

### „Heute“ wie im Dashboard · 19.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1194)

Begrüßung mit Uhr, minimierte Tab-Leiste, Tagesaufgaben unten (D-276).

| Nachweis | Ergebnis |
|---|---|
| `pnpm test` | 81 Dateien, 675 Tests bestanden (`app.test.tsx` erwartet die Überschrift „Heute: Guten …“) |
| `pnpm test:e2e` (Chromium Desktop und Pixel 7) | 193 bestanden, 3 übersprungen. Neu in `tabbar.spec.ts`: Runterscrollen macht die Leiste zum Kreis am rechten Rand (schmaler als ein Drittel, nur das aktive Symbol), Hochscrollen und Tipp auf den Kreis klappen auf, ohne die Seite zu wechseln. `goals.spec.ts` erwartet „Guten …, Dali.“; `tasks.spec.ts` ohne Motivationssatz |
| Bildschirmfotos | Handy hell und dunkel (oben, gescrollt mit Kreis, wieder aufgeklappt), Web dunkel; vom Produktinhaber freigegeben |
| Bekannt | Getestet mit Mausrad und Tasten in Chromium; das Wischen am iPhone steht als Gerätetest aus |

### Schritte aus dem Dashboard · 19.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1194)

Anmeldung beim Dashboard je Gerät, nur lesend; Karte unter „Ernährung heute“ (D-277).

| Nachweis | Ergebnis |
|---|---|
| `pnpm test` | 82 Dateien, 682 Tests bestanden. Neu `stepStats.test.ts`: dieselben Zahlen wie `steps-core.js` und `home-core.js` des Dashboards, mit Node nachgerechnet (Ziel 23.892, noch 15.472, 35 %, Jahr 2.258.872 = 56 %); ohne Eintrag heute, Tagesziel erreicht, Jahresziel erreicht, Stichtag nach heute, 31. Dezember |
| `pnpm test:e2e` (Chromium Desktop und Pixel 7) | Erster Lauf: 192 bestanden, 2 rot, 3 übersprungen (`shell.spec.ts` erwartete die Liste unter „Mehr“ ohne den neuen Eintrag; `pwa.spec.ts` Offline-Start am Handy). Liste ergänzt, `/mehr/schritte` in die geprüften Seiten aufgenommen; danach `pwa`, `shell`, `network-a11y`: 124 bestanden. Neu `steps.spec.ts` (Dashboard nachgebildet, Service Worker blockiert): ohne Verbindung keine Anfrage, falsches Passwort mit Hinweis, Karte direkt unter „Ernährung heute“ mit 8.420 Schritten, Ziel und Jahresstand, keine schreibende Anfrage, „Verbindung trennen“ |
| `pnpm check:bundle` | 247,7 KB Startansicht (Grenze 250 KB) |
| Bildschirmfotos | Karte auf „Heute“ hell und dunkel, Web, Seite vor und nach dem Verbinden (Beispielwerte); vom Produktinhaber freigegeben, danach unter die Ernährung verschoben |
| Offen | Echte Anmeldung beim Dashboard und Vergleich der Zahlen mit dem Dashboard (Produktinhaber) |

### Marke in Tagesliste und Fenstern · 20.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1194)

Marke unter dem Namen in der Tagesliste, in den Fenstern zum Eintragen und Bearbeiten, in Vorlagen in Klammern (D-278).

| Nachweis | Ergebnis |
|---|---|
| `pnpm test` | 83 Dateien, 686 Tests bestanden. Neu `format.test.ts` (Marke aus Eintrag, aus den Lebensmitteldaten, Klammer entfällt, ohne Marke unverändert); `mealTemplateService.test.ts` (Marke in Klammern im Vorlagenposten); `nutrition-ui.test.tsx` erwartet `brandSnapshot: 'Spar'` |
| `pnpm test:e2e` (Chromium Desktop und Pixel 7) | 199 bestanden, 3 übersprungen. `barcode.spec.ts`: „Skyr Natur“ mit „Spar ·“ in der Tagesliste |
| `pnpm check:bundle` | 247,8 KB Startansicht (Grenze 250 KB) |
| Bildschirmfotos | Suche, Eintragen, Tagesliste, Bearbeiten mit Testdaten (Alnatura, Bahlsen); vom Produktinhaber freigegeben |

### Fehler: Begrüßung immer „Guten Abend“ · 20.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1194)

Gemeldet vom Produktinhaber um 7:05 Uhr. Ursache: `Intl.DateTimeFormat` mit nur der Stunde liefert in `de-AT` „07 Uhr“; `Number("07 Uhr")` ergibt keine Zahl, deshalb galt jede Stunde als Abend (D-276), und „Barcode scannen“ auf „Heute“ wählte immer „Snacks“ (D-275). Behoben mit `hourIn` in `src/shared/lib/time.ts` (liest die Stunde über `formatToParts`).

| Nachweis | Ergebnis |
|---|---|
| Nachgestellt | Node 22: `format` liefert „07 Uhr“, `formatToParts` die Stunde „07“ |
| `time.test.ts` | `hourIn` liefert 7 um 05:05 UTC in Wien, 0 um Mitternacht, 18 um 18:59 |
| `goals.spec.ts` | Neu: Uhr auf 7:05 gestellt, „Guten Morgen“; auf 19 Uhr, „Guten Abend“. Der bisherige Test hatte jeden Gruß akzeptiert und den Fehler deshalb nicht bemerkt |
| WebKit in GitHub Actions | `tabbar.spec.ts` „Kreis rechts … zurück beim Hochscrollen“ am Handy einmal rot (zweimal im selben Lauf: die Leiste blieb nach dem Hochscrollen klein), beim Neustart grün; in Chromium morgens und abends grün. Wackelig, beobachten |

### Aufräumen · 20.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1194)

BLS 4.0 entfernt (D-279), Gewichte gleicher Minute, Zutatenzeile im Rezept, robustere Tests, Hinweis zu Grunddaten entfernt.

| Nachweis | Ergebnis |
|---|---|
| `pnpm test` | 83 Dateien, 687 Tests bestanden. Neu: sechs Gewichte im selben Zeitpunkt in Erfassungsreihenfolge (mit dem alten Code rot, die zufällige ID entschied); Tests nutzen feste Testlebensmittel mit den früheren BLS-Werten (`testing/foods.ts`), die Oberflächen-Tests importieren sie als ÖNWT-Daten |
| `pnpm test:e2e` (Chromium Desktop und Pixel 7) | 200 bestanden, 1 rot, 3 übersprungen: `steps.spec.ts` am Handy las die Reihenfolge der Karten, bevor die nachgeladene Ernährungskarte da war (Zeitproblem im Test). Behoben: Der Test wartet auf „Ernährung heute“; danach dreimal je 2 bestanden. `nutrition.spec.ts` importiert Testlebensmittel statt BLS |
| Wackelige Tests | `network-a11y` „eigene Adresse“ und `pwa` „Offline-Start“ gehen in einem Durchgang über alle Seiten und lagen nahe am Zeitlimit von 30 s: `test.slow()`. `tabbar` in WebKit: Vermutung, dass WebKit auf einem ausgelasteten Runner das Scrollen später als 0,6 s nach der Taste meldet; der Test sendet die Taste unmittelbar vor der Meldung erneut. Beobachten |
| Nachtrag WebKit (`main` nach #35) | `tabbar` am Handy wieder rot, `tasks` und `own-programs` erst im zweiten Versuch grün. App: Hochscrollen klappt die Leiste jetzt immer auf, unabhängig davon, ob die App das Scrollen als eigenes erkennt (nur das Einklappen verlangt das). Tests: `tasks` wartet nach der ersten Aufgabe auf das geleerte Feld; `own-programs` wartet, bis die Datenbank „Wdh. bis 10“ liefert, bevor neu geladen wird. Lokal zweimal je 11 bestanden |
| `pnpm check:bundle` | 247,7 KB Startansicht (Grenze 250 KB); der BLS war nie Teil der Startansicht |
| Geräteprüfung | Produktinhaber: Glas-Look am iPhone passt; Schritte werden richtig dargestellt und aus dem Dashboard übertragen |


### Logo und Einstellungen · 20.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1194)

Logo und Name der App über der Begrüßung (nur Handy), „Daten und Sicherung“, „Installieren“ und „Schritte aus dem Dashboard“ unter Einstellungen › Weiteres (D-280).

| Nachweis | Ergebnis |
|---|---|
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | ohne Befund |
| `pnpm test` | 83 Dateien, 687 Tests bestanden; „Mehr“ zeigt vier Einträge |
| `pnpm test:e2e` (Chromium Desktop und Pixel 7) | 202 bestanden, 4 übersprungen. Neu: Logo und Name über der Begrüßung am Handy; Einstellungen › „Weiteres“ mit drei Links; Rücksprung von Daten, Installieren und Schritte zu den Einstellungen |
| `pnpm check:bundle` | 247,8 KB Startansicht (Grenze 250 KB) |
| Bilder | Vom Produktinhaber vorab freigegeben („bilder passen“) |

### Statusleiste · 20.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1194)

Statusleiste ohne farbliche Unterbrechung auf allen Seiten und bei der Anmeldung (D-281).

| Nachweis | Ergebnis |
|---|---|
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | ohne Befund |
| `pnpm test` | 83 Dateien, 687 Tests bestanden; `theme-color` folgt `--bg-top` (hell `#f5f8fd`, dunkel `#212a3f`) |
| `pnpm test:e2e` (Chromium Desktop und Pixel 7) | 202 bestanden, 4 übersprungen; Hintergrund im Dunkelmodus `rgb(33, 42, 63)` |
| `pnpm check:bundle` | 247,9 KB Startansicht (Grenze 250 KB) |
| Bilder | Anmeldung und „Heute“ hell/dunkel mit nachgestellter Statusleiste, vom Produktinhaber freigegeben. Die Färbung durch iOS selbst ist erst am iPhone prüfbar |

### Datumsfeld · 20.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1194)

Datum- und Zeitfelder bleiben in ihrer Spalte (D-282), nach Bildschirmfoto vom iPhone (Nachtragen: „Beginn“ ragte über den Rand bzw. in „Dauer in Minuten“).

| Nachweis | Ergebnis |
|---|---|
| `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | ohne Befund |
| `pnpm test` | 83 Dateien, 687 Tests bestanden |
| `pnpm test:e2e` (Chromium Desktop und Pixel 7) | 204 bestanden, 4 übersprungen. Neu `date-field.spec.ts`: rechter Rand des Felds liegt in der Spalte und vor „Dauer in Minuten“. In Chromium war der Fehler nicht nachstellbar (der Test ist dort auch ohne Änderung grün); WebKit in GitHub Actions ist kein echtes iOS. Nachweis am iPhone durch den Produktinhaber steht aus |

### Tagesaufgaben als Checkliste · 20.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1194)

Schlichte tägliche Checkliste, Pausieren und Löschen ohne verfälschte Vergangenheit (D-283).

| Nachweis | Ergebnis |
|---|---|
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | ohne Befund |
| `pnpm test` | 83 Dateien, 693 Tests bestanden. Neu: Pausentage zählen nach dem Wiederaufnehmen nicht als offen (vorher ein Fehler); Löschen erhält frühere Tage; Rückgängig stellt den Stand vor dem Pausieren oder Löschen her; Karte ohne Serie mit „x von y erledigt“; neuer Tag offen, gestern gespeichert; Neuladen behält heute |
| `pnpm test:e2e` (Chromium Desktop und Pixel 7) | 208 bestanden, 4 übersprungen. `tasks.spec.ts`: hinzufügen, ordnen, abhaken, neu laden, nächster Tag (Uhr der Seite gestellt) alles offen und gestern noch in der Datenbank; 320 px breit ohne Überlauf; abhaken ohne Netz bleibt nach dem Neuladen |
| `pnpm check:bundle` | 248,2 KB Startansicht (Grenze 250 KB) |
| Nachtrag | Karte direkt unter „Schritte“, Verwalten über das Symbol mit den Schiebereglern: `tasks.spec.ts` prüft Reihenfolge und Link; `tasks.spec.ts` und `steps.spec.ts` zusammen 8 bestanden |
| GitHub Actions | `tasks.spec.ts` „kleiner Bildschirm“ in Chromium rot: 27 px zu breit, weil die Überschrift „Tagesaufgaben“ mit den Schriften des Runners breiter als 320 px war (lokal nicht nachstellbar, bei 290 px schon: 310 statt 290). Behoben in `PageHeader`: unter 360 px etwas kleinere Überschrift, Silbentrennung und Umbruch im Wort als Rückfall; danach `tasks.spec.ts` und `shell.spec.ts` 21 bestanden |
| GitHub Actions, WebKit | „abhaken ohne Netz“ rot: „Failed to load resource“ im Browser, weil die Seite offline ging, bevor der Service Worker sie steuerte (ohne ihn schlägt jede Anfrage fehl). Test wartet jetzt wie `resilience.spec.ts` auf den Service Worker; Chromium 6 bestanden, WebKit nur in GitHub Actions prüfbar |
| Bilder | Karte und Verwalten vom Produktinhaber freigegeben (Symbol oben rechts für Pausierte, ohne Hinweistext und ohne Übersicht der letzten 14 Tage) |

### Fortschritt der Tagesaufgaben · 20.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1194)

Kennzahlen, Verlauf, Gesamtübersicht, Einzelauswertung und Hinweise (D-284).

| Nachweis | Ergebnis |
|---|---|
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | ohne Befund |
| `pnpm test` | 85 Dateien, 709 Tests bestanden. Neu `insights.test.ts` (20): Zustände erledigt, offen, nicht fällig, kein Eintrag; Zeiträume nie vor der ersten Aufgabe; neue Aufgaben ohne Rückwirkung; gelöschte nur bis zum Löschen; Vergleich nur mit genug Daten; aktuelle und beste Serie (heute offen unterbricht nicht, Tag ohne Eintrag schon, Pausen neutral); Tage und Wochen im Verlauf; Wochentage; Hinweise nur mit genug Daten. `task-stats.test.tsx` (3): Kennzahlen, Gesamtübersicht, Sortieren, Zeitraum, Einzelauswertung, leerer Zustand |
| `pnpm test:e2e` (Chromium Desktop und Pixel 7) | 210 bestanden, 4 übersprungen. Neu in `tasks.spec.ts`: drei Tage mit gestellter Uhr, Quote 75 %, Diagramm, Übersicht, Einzelauswertung, 360 px ohne Überlauf. Dabei gefunden und behoben: das Diagramm machte das Raster breiter als den Bildschirm (Raster jetzt `grid-cols-1`) |
| `pnpm check:bundle` | zuerst 251,3 KB (über 250 KB); die Karte „Tagesaufgaben“ wird jetzt wie „Schritte“ nachgeladen, ungenutzte Exporte entfernt: 248,8 KB |
| Nachtrag Vorschau | Produktinhaber: am ersten Tag füllte das einzige Feld der Gesamtübersicht die ganze Breite, ebenso der Kalender der Einzelauswertung am Mac (Kalender jetzt höchstens 240 px breit, Tage etwa 31 px). Felder jetzt höchstens 40 px, bei bis zu 7 Spalten höchstens 448 px breit; Text „noch nichts zu werten; heute zählt ab morgen mit“. `tasks.spec.ts` 8 bestanden, Habits-Unit-Tests 37 bestanden, Startansicht 248,8 KB |
| Bilder | Fortschritt, Einzelauswertung und Gesamtübersicht mit Testdaten (45 bzw. 89 Tage im Browser erzeugt, nicht Nutzerdaten), vom Produktinhaber freigegeben |

### Wochentage je Aufgabe · 20.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1194)

Fällig nur an gewählten Wochentagen, „Mit Training abhaken“ (D-285).

| Nachweis | Ergebnis |
|---|---|
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | ohne Befund |
| `pnpm test` | 85 Dateien, 715 Tests bestanden. Neu: nur an Wochentagen fällig, Änderung erst ab ihrem Tag; Quote und Serie nur über fällige Tage; gleiche Änderung am selben Tag ersetzt; „mit Training“ hakt nur ohne eigenen Eintrag ab; Karte zeigt nur heute Fälliges, „Heute ist keine Aufgabe fällig.“; Verwaltung speichert Wochentage und Schalter |
| `pnpm test:e2e` (Chromium Desktop und Pixel 7) | 211 bestanden, 1 rot, 4 übersprungen: `network-a11y` „eigene Adresse“ (Pixel 7) fand unter voller Last eine Überschrift nicht rechtzeitig; allein dreimal je 2 bestanden (bekannt wackelig, siehe Übergabe). Neu in `tasks.spec.ts`: Mo/Mi/Fr, am Dienstag nicht auf „Heute“, am Mittwoch nach nachgetragener Aktivität abgehakt, Zurücknehmen bleibt nach Neuladen |
| `pnpm check:bundle` | 248,6 KB Startansicht (Grenze 250 KB) |
| Bilder | Bearbeiten mit „Fällig an“, „Heute“ an einem freien Tag, Auswertung Mo/Mi/Fr; vom Produktinhaber freigegeben („es kann alles zählen“) |

### Logo auf jeder Seite · 20.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1194)

Logo und Name am Handy auf jeder Seite links oben (D-286).

| Nachweis | Ergebnis |
|---|---|
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | ohne Befund |
| `pnpm test` | 85 Dateien, 715 Tests bestanden; der Test der Liste unter „Mehr“ zählt den Link „Fitness“ nicht mit (vorher rot) |
| `pnpm test:e2e` (Chromium Desktop und Pixel 7) | 212 bestanden, 4 übersprungen. `shell.spec.ts`: Logo am Handy auf Heute, Training, Ernährung, Fortschritt und Einstellungen links über der Überschrift, Tipp führt zu „Heute“ |
| `pnpm check:bundle` | 248,6 KB Startansicht (Grenze 250 KB) |
| Bilder | Training, Ernährung, Tagesaufgaben; vom Produktinhaber freigegeben („ja passt“) |

### Einkaufsliste · 20.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1194)

Einkaufsliste in „Meine Küche“ (D-287), Texte nachgeladener Seiten getrennt (D-288).

| Nachweis | Ergebnis |
|---|---|
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | ohne Befund |
| `pnpm test` | 88 Dateien, 752 Tests bestanden. Neu: Mengen-Erkennung (14 Eingaben, auch Unklares wie „7up“, „100% Orangensaft“, „2 3 Äpfel“, „0 Bananen“ bleibt Name), Kategorien (11 Beispiele, „Reis“ nicht „Eis“, „Eistee“ Getränk), Doppelte, „Zuletzt gekauft“; Dienst: anlegen, ungültige Eingaben, bearbeiten, Menge dazurechnen, löschen und wiederherstellen, abhaken, „Gekaufte entfernen“ ohne offene Artikel und Rückgängig, Rezept-Zutaten zusammenrechnen (200 g + 150 g + offene 100 g = 450 g Reis), nichts im Ernährungstagebuch; Oberfläche: mehrere Einträge mit Enter, Fokus bleibt, Doppelte, abhaken, Gekaufte, Rückgängig, bearbeiten, Ansicht nach Kategorie, löschen. Migration v6 → v7 verlustfrei mit Snapshot |
| `pnpm test:e2e` (Chromium Desktop und Pixel 7) | 220 bestanden, 4 übersprungen. Neu `shopping.spec.ts`: über „Meine Küche“, drei Artikel, abhaken, Neuladen, nach Kategorie, offline eintragen, Ernährung bleibt 0 kcal; 320 px ohne Überlauf. Einkaufsliste in `APP_PAGES` (Barrierefreiheit, Netzwerk, Offline-Start) |
| `pnpm check:bundle` | zuerst 252,0 KB (über 250 KB): Kategorie-Wörter lagen in der Startansicht, und `de.ts` wuchs. Rechnung und Dienst der Einkaufsliste werden nachgeladen, Texte von Einkaufsliste und Aufgaben-Fortschritt liegen in eigenen Dateien (D-288): 249,1 KB |
| Bilder | Meine Küche, Liste mit Doppelten-Hinweis, nach Kategorie, Bearbeiten (Testeinträge) |
| Nachtrag Abgleich mit dem Auftrag (`shopping-list.md`) | Vorschläge aus eigenen Lebensmitteln ergänzt (Abschnitt 7A). `pnpm format:check`, `lint`, `typecheck`, `check:docs` ohne Befund; `pnpm test` 88 Dateien, 754 Tests bestanden (neu: Namen eigener Lebensmittel ohne archivierte; Vorschlagsliste ohne Doppelte, freie Eingabe); `pnpm test:e2e` 220 bestanden, 4 übersprungen; `pnpm check:bundle` 249,4 KB |
| Nachtrag Vorschläge (Bildschirmaufnahme des Produktinhabers: Auswahl des Browsers blieb nach dem Hinzufügen offen) | Eigene Vorschlagsknöpfe statt `datalist`. `pnpm lint`, `typecheck` ohne Befund; `pnpm test` 88 Dateien, 755 Tests bestanden (neu: Vorschläge erst beim Tippen, Wortanfang zuerst, ohne Offene; Tipp fügt mit Menge hinzu, Feld leer, Fokus bleibt); `pnpm test:e2e` 220 bestanden, 4 übersprungen; `pnpm check:bundle` 249,4 KB |
| Nachtrag Tastatur (zweite Bildschirmaufnahme: nach Enter verdeckte die Tastatur, was dazukam) | „Hinzugefügt: …“ unter dem Feld, „Fertig“ schließt die Tastatur. Erster E2E-Lauf: 2 fehlgeschlagen (`shopping.spec.ts`, „1 von 3 gekauft“ nicht gefunden), weil die Zeile beim Verlassen des Feldes verschwand und die Liste unter dem Klick sprang; jetzt bleibt sie stehen. Danach `pnpm test` 88 Dateien, 756 Tests bestanden; `pnpm test:e2e` 220 bestanden, 4 übersprungen; `pnpm check:bundle` 249,4 KB |
| Nachtrag Texte (Wunsch des Produktinhabers) | Beispieltext unter dem Feld und Hinweis „zählt nicht als gegessen“ entfernt; die Trennung vom Tagebuch bleibt getestet. `pnpm test` 88 Dateien, 756 Tests bestanden; `pnpm test:e2e` 220 bestanden, 4 übersprungen; `pnpm check:bundle` 249,4 KB |
| Nachtrag „Ernährung heute“ (runde Knöpfe, Einkaufswagen) | `pnpm test` 88 Dateien, 756 Tests bestanden; neuer E2E-Test: drei Knöpfe je 48 × 48 px mit 20 px Symbol, Einkaufswagen öffnet die Einkaufsliste. `pnpm test:e2e` 221 bestanden, 1 fehlgeschlagen, 4 übersprungen; fehlgeschlagen `network-a11y.spec.ts` „alle Anfragen gehen an die eigene Adresse“ (chromium-mobile, `toBeVisible` nach Zeitüberschreitung), einzeln wiederholt: 110 bestanden (bekannt instabil unter Last). `pnpm check:bundle` 249,4 KB |
| Nachtrag Knöpfe mittig | `pnpm test` 756 Tests bestanden; E2E prüft gleichen Abstand links und rechts; `pnpm test:e2e` 222 bestanden, 4 übersprungen; `pnpm check:bundle` 249,5 KB |
| Nachtrag Makros zentriert („Ernährung heute“) | `pnpm test` 756 Tests bestanden; `pnpm test:e2e` 222 bestanden, 4 übersprungen; `pnpm check:bundle` 249,5 KB; Bilder mit und ohne Ziel |

### Wasser · 21.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1194)

Wasser auf „Heute“, in der Ernährung und als eigene Seite (D-289); Branch `feat/wasser` auf Basis von `feat/einkaufsliste`.

| Nachweis | Ergebnis |
|---|---|
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | ohne Befund |
| `pnpm test` | 91 Dateien, 797 Tests bestanden. Neu: Rechnung (Tagessumme, Rest, über dem Ziel, 9 gültige und 9 ungültige Eingaben, Ziel je Tag mit Wechsel und Ersetzen am selben Tag, Verlauf ohne erfundene Tage, Ø und „Ziel erreicht“ nur über Tage mit Einträgen, Schnellmengen); Dienst (Schnell- und eigene Menge, ungültige Mengen ohne Speichern, bearbeiten, löschen, wiederherstellen, Tageswechsel 23:50/00:10, Nachtragen, Ziel ab heute, erreicht, Schnellmengen, nichts im Tagebuch); Oberfläche (Schnellmenge, eigene Menge, ungültige Eingabe, letzten Eintrag entfernen und zurückholen, Ziel erreicht und darüber, Einträge bearbeiten und löschen, Ziel ändern, Schnellmengen anpassen, früherer Tag mit „nachgetragen am“); Tagesaufgaben (nur fällige mit Regel, manuell zurückgenommen bleibt, Schalter schließen sich aus). Migration v7 → v8 verlustfrei mit Snapshot |
| `pnpm test:e2e` (Chromium Desktop und Pixel 7) | 232 bestanden, 4 übersprungen. Neu `water.spec.ts`: auf „Heute“ eintragen, Neuladen, offline eintragen, nächster Tag beginnt bei 0, Verlauf zeigt gestern, Ernährung bleibt 0 kcal; Tagesaufgabe „mit Wasserziel abhaken“ bei 2 l, manuell zurücknehmen bleibt nach Neuladen; 320 px ohne Überlauf. `/ernaehrung/wasser` in `APP_PAGES`. Erster Lauf: 2 fehlgeschlagen (`steps.spec.ts`: „Schritte“ nicht mehr direkt unter „Ernährung heute“), weil die Wasserkarte dort stand; jetzt unter den Tagesaufgaben |
| `pnpm check:bundle` | zuerst 250,1 KB (über 250 KB). `goalOn` liegt im Modul Wasser statt in den Zielen, und „Meine Küche“ zählt offene Artikel der Einkaufsliste direkt in der Tabelle statt über Repository und Schema: 249,4 KB |
| Bilder | Karte auf „Heute“ (offen und Ziel erreicht), Seite „Wasser“, Ernährung (Testeinträge) |
| Nachtrag Platz auf „Heute“ (Wunsch des Produktinhabers: Wasser unter „Ernährung heute“) | `steps.spec.ts` und `water.spec.ts` prüfen die neue Reihenfolge (Ernährung heute, Wasser, Schritte, Tagesaufgaben). `pnpm lint`, `typecheck`, `check:docs` ohne Befund; `pnpm test` 91 Dateien, 797 Tests bestanden; `pnpm test:e2e` 232 bestanden, 4 übersprungen; `pnpm check:bundle` 249,4 KB |

### F5 §1 Bedienelemente · 23.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1194)

Schalter, widersprüchliche Klassen, Wochenziel, Tabellenansicht (D-322); Liste der Schalter in Abschnitt 4.5.

| Nachweis | Ergebnis |
|---|---|
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | ohne Befund |
| `pnpm test` | 99 Dateien, 826 Tests bestanden. Neu `class-conflicts.test.ts` (meldet ohne die Korrekturen 18 Stellen), Wochenziel 4 → 5 → 3 → 4 in `goals-ui.test.tsx` (ohne die Korrektur: „expected '3' to be '4'“) |
| `pnpm exec playwright test e2e/switches.spec.ts` | 38 bestanden, 2 übersprungen. Gegenprobe mit dem alten Schalter und Formular: 13 von 13 Handy-Tests fehlgeschlagen |
| `pnpm test:e2e` (Chromium Desktop und Pixel 7) | 218 bestanden, 6 übersprungen, 0 fehlgeschlagen (5,1 min) |
| `pnpm check:bundle` | 229,1 KB von 250 KB |

### F5 §2 Aktives Training · 23.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1194)

Kein Sprung nach dem Erledigen eines Satzes, Kopf mit dem Trainingstag (D-323); Gerätetest T-IPH-M1 Schritt 14 steht aus.

| Nachweis | Ergebnis |
|---|---|
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | ohne Befund |
| `pnpm test` | 99 Dateien, 826 Tests bestanden |
| `pnpm exec playwright test e2e/training-scroll.spec.ts` (Pixel 7) | 1 bestanden: 17 Sätze, abwechselnd mit Enter und direkt mit „Satz erledigt“, jeder dritte mit „Pause überspringen“; beim Tippen keine Bewegung, danach der nächste Satz ganz zwischen Kopf und Fußleiste. Gegenprobe ohne den Ausgleich: „verdeckt vom Kopf (160 px)“ nach dem ersten Satz |
| `pnpm test:e2e` (Chromium Desktop und Pixel 7) | 219 bestanden, 7 übersprungen, 0 fehlgeschlagen (5,4 min) |
| `pnpm check:bundle` | 229,0 KB von 250 KB |

### F5 §3 Programme und Training · 23.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1194)

Seitenanfang und Zurück, Etiketten der Programmkarten, „Bereit für dein Training?“ (D-324).

| Nachweis | Ergebnis |
|---|---|
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | ohne Befund |
| `pnpm test` | 99 Dateien, 826 Tests bestanden |
| `pnpm exec playwright test e2e/program-list.spec.ts --repeat-each=3` | 24 bestanden, 6 übersprungen (schmale Breiten nur im Handy-Projekt). Gegenprobe ohne die Änderungen: alle 5 Handy-Tests fehlgeschlagen |
| `pnpm test:e2e` (Chromium Desktop und Pixel 7) | 227 bestanden, 9 übersprungen, 0 fehlgeschlagen (5,5 min) |
| `pnpm check:bundle` | 229,5 KB von 250 KB |

### F5 §4 Kopfzeile, Icons, Markierungen, Startbild · 23.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1194)

Kompaktes Logo, Regler-Symbol, Kalender und Erledigt-Kreis, Seitenende, Startbild C3 und Startfläche (D-325); Gerätetest T-IPH-M0 Schritt 5 steht aus.

| Nachweis | Ergebnis |
|---|---|
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | ohne Befund (vorher: Typ von `Blob` im PNG-Leser, zwei Regeln von ESLint in den neuen Tests) |
| `pnpm test` | 101 Dateien, 840 Tests bestanden. Gegenproben: `theme-classes.test.ts` meldet `rounded-md` („key: md“); mit den alten Startbildern schlagen 6 von 10 Tests in `splash.test.ts` fehl |
| `node tools/splash.mjs --check` | „Bilder, Vorlage und Startfläche passen zur Regel“ |
| `pnpm exec playwright test e2e/marks.spec.ts --project=chromium-mobile --repeat-each=3` | 12 bestanden. Gegenprobe gegen den Stand vor Abschnitt 4: Regler-Symbol, Kalender und Erledigt-Kreis fehlgeschlagen, Seitenende bestanden (dort war kein Fehler). Erster Lauf einmal rot: „/heute: über dem Kreis“, weil Karten nach dem Scrollen noch wuchsen; der Test scrollt jetzt bis zum wirklichen Ende |
| `pnpm exec playwright test e2e/start-surface.spec.ts` | 5 bestanden, 3 übersprungen (Startbild nur im Handy-Projekt). Startfläche gegen `splash-1170x2532.png`: mittlere Abweichung 0,003 von 255, kein Pixel über 64 (zuerst 1 Gerätepixel Versatz, weil Chromium eingebettete SVG-Flächen auf ganze Pixel rückt; seitdem eine SVG über den ganzen Bildschirm) |
| `pnpm test:e2e` (Chromium Desktop und Pixel 7) | 239 bestanden, 13 übersprungen, 0 fehlgeschlagen (5,7 min) |
| `pnpm check:bundle` | 236,0 KB von 250 KB, jetzt mit `index.html` (6,1 KB) |

### F5 §5 Ernährung · 23.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1194)

Ring mit Makros, Karte „Gegessen“, kurze Datumszeile, Hinweis mit Aufzählung, „Aktuelles Ziel“ ohne Datum (D-326).

| Nachweis | Ergebnis |
|---|---|
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | ohne Befund |
| `pnpm test` | 104 Dateien, 857 Tests bestanden (neu `ring.test.ts` mit 8, `macro-ring.test.tsx` mit 5, `list.test.ts` mit 1 Test; kurzes Datum in `format.test.ts`, `--macro-other` in `tokens.test.ts`). Erster Lauf von `macro-ring.test.tsx` rot: de-AT trennt Tausender mit schmalem Leerzeichen, der Test nutzt jetzt de-DE |
| `pnpm exec playwright test e2e/nutrition-ring.spec.ts e2e/barcode.spec.ts e2e/nutrition.spec.ts` | 22 bestanden, 2 übersprungen. Gegenprobe von `nutrition-ring.spec.ts` gegen den Stand vor Abschnitt 5 (Handy): alle 5 Tests fehlgeschlagen |
| Sichtprüfung 360 und 390 pt (Bilder aus dem Browser) | Ring mit Abschnitten, Übergängen und runden Enden; über dem Ziel voll mit neutralem Text; drei Spalten ohne Überlauf; auf „Heute“ wurde „Kohlenhydrate“ auf 360 pt abgeschnitten, jetzt Kurzform „Kohlenh.“ |
| `pnpm test:e2e` (Chromium Desktop und Pixel 7) | 247 bestanden, 15 übersprungen, 0 fehlgeschlagen (6,4 min) |
| `pnpm check:bundle` | 235,8 KB von 250 KB |

### F5 §6 Fortschritt · 23.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1194)

Zeitraum-Auswahl in einer Zeile (D-327).

| Nachweis | Ergebnis |
|---|---|
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | ohne Befund |
| `pnpm test` | 104 Dateien, 857 Tests bestanden |
| `pnpm exec playwright test e2e/period-row.spec.ts` (neu) | 16 bestanden, 8 übersprungen (schmale Breiten nur im Handy-Projekt): Fortschritt, Körpergewicht, Tagesaufgaben und Wasser auf 360, 390 und 768 pt in einer Zeile, kein Wort gekürzt, Chips 36 px, jede Option per Tipp. Erster Lauf rot, weil der Test die absichtlich überstehende Tippfläche als Kürzung las; er misst jetzt den Text. Gegenprobe gegen den Stand vor Abschnitt 6 (Handy): Fortschritt und Körpergewicht auf 360 und 390 pt fehlgeschlagen (4 Tests), Tagesaufgaben und Wasser passten schon |
| `pnpm test:e2e` (Chromium Desktop und Pixel 7) | 263 bestanden, 23 übersprungen, 0 fehlgeschlagen (6,1 min) |
| `pnpm check:bundle` | 235,9 KB von 250 KB |

### F5 §7 Texte und Marke · 23.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1194)

Programm C neutral, keine Hinweise auf die fremde App, Registrierung offen, persönliche Angaben (D-328).

| Nachweis | Ergebnis |
|---|---|
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | ohne Befund; neu in `check:docs`: `tools/check_names.py` („Namen geprüft: 5 dokumentierte Ausnahmen, sonst keine Treffer“) |
| `pnpm test` | 104 Dateien, 860 Tests bestanden (neu: drei Regeln in `wording.test.ts`, Adresse von Programm C in `programs.test.ts`) |
| Gegenprobe gegen den Stand vor Abschnitt 7 (`687d0bf`) | Neue `wording.test.ts` mit den Texten von damals: 3 von 27 Tests fehlgeschlagen (je Begriff einer). `check_names.py`: Exit-Code 1, „757 Probleme“ in 50 Dateien |
| `pnpm test:e2e` (Chromium Desktop und Pixel 7) | 261 bestanden, 23 übersprungen, 2 fehlgeschlagen (6,4 min): `programs.spec.ts` erwartete noch die Quellenzeile von Programm C. Nach der Anpassung `e2e/programs.spec.ts`: 4 bestanden |
| `pnpm check:bundle` | 236,0 KB von 250 KB |

### F5 §9 Abschluss · 23.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1194)

Breiten 360, 390 und 768 pt, Korrekturen für schmale Breiten, Test „Seitenende“ mit modalem Dialog (D-331).

| Nachweis | Ergebnis |
|---|---|
| Breitenprüfung mit einem vorübergehenden Skript (39 Ansichten × drei Breiten, Testdaten im frischen Browserprofil) | Keine Seite breiter als der Bildschirm, keine Konsolenfehler. Gefunden: getrennte Wörter in Programmkarten (360 pt; „Oberkörper/Unterkörper“ auch 390 und 768 pt) und im Programm-Editor („Woche“, 360 pt), „Meine Küche“, „Als eigenes Programm übernehmen“ (360 pt) und „Tag … heute trainieren“ (360 und 390 pt) zweizeilig, „Kohlenhydrate“ im Schnelleintrag in der Nachbarspalte (360 pt). Nach den Korrekturen keine Befunde außer den bewusst gelassenen Kürzungen (D-331) |
| `pnpm exec playwright test e2e/narrow-layout.spec.ts e2e/program-list.spec.ts` | 20 bestanden, 8 übersprungen. Gegenprobe gegen `273d608` mit dem alten Knopftext: 10 fehlgeschlagen |
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | ohne Befund |
| `pnpm test` | 104 Dateien, 860 Tests bestanden |
| `pnpm test:e2e` (Chromium Desktop und Pixel 7) | 275 bestanden, 29 übersprungen, 0 fehlgeschlagen (6,3 min) |
| `pnpm check:bundle` | 236,0 KB von 250 KB |
| CI WebKit zu F5 §6 (`687d0bf`) | 1 fehlgeschlagen: `marks.spec.ts` „Seitenende …“ auf `/mehr/synchronisierung` (Inhalt der Anmeldung im Vollbild unter der verdeckten Leiste), behoben in diesem Abschnitt; `tabbar.spec.ts` „Ziehen mit der Linse …“ erst im zweiten Versuch bestanden |
| `node tools/screenshots.mjs komponenten`, `screens`; `node tools/screens-overview.mjs` | 18 Bilder erneuert; „docs/screens/uebersicht.png: 28 Bilder“, „docs/screens.zip: 29 Bilder“ |
| CI zu `61d7a52` | E2E Chromium und WebKit je 4 fehlgeschlagen (`program-list.spec.ts` 390 und 768 pt „Etikett neben dem Titel“, `narrow-layout.spec.ts` 360 pt „Meine Küche in einer Zeile“): Auf dem CI-Rechner fehlt Inter, die Systemschrift ist breiter. Korrigiert: Spalten der Knöpfe `minmax(max-content, 1fr)`, Test ohne die schriftabhängige Erwartung; mit erzwungener „DejaVu Sans“ lokal nachgestellt (vorher 1 fehlgeschlagen wie in der CI, danach 20 bestanden) |
| CI zu `81f230e` | Lint bis Build grün; E2E Chromium 275 bestanden, 29 übersprungen; E2E WebKit 268 bestanden, 35 übersprungen, 1 erst im zweiten Versuch (`nutrition-ring.spec.ts`, „TypeError: Importing a module script failed.“ beim Seitenwechsel; vermerkt bei E-16) |

### F6 §1 Logo der Kopfzeile · 23.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1194)

Logo in Anzeigegröße auf ganzen Pixeln, Abstand unter der Unschärfe von iOS am oberen Rand (D-332). Auftrag: `docs/prompts/F6-feinschliff-vor-dem-merge.md`.

| Nachweis | Ergebnis |
|---|---|
| Ursachensuche (Logo, Vorfahren, Pseudo-Elemente, überlagernde Flächen, Glas) | In der App nichts am Logo. Ursachen: die Unschärfe von iOS über den obersten rund 40 pt (das Logo lag 14 bis 42 pt unter dem Rand) und die Datei mit 5273 × 1400 als Größe (Anzeige 105,46 px breit) |
| `pnpm exec playwright test e2e/header-logo.spec.ts e2e/shell.spec.ts` | 20 bestanden, 4 übersprungen. Gegenprobe gegen `eee9bf9` (Handy): 4 fehlgeschlagen |
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | ohne Befund |
| `pnpm test` | 105 Dateien, 862 Tests bestanden |
| `pnpm test:e2e` (Chromium Desktop und Pixel 7) | 280 bestanden, 32 übersprungen, 0 fehlgeschlagen (6,8 min) |
| `pnpm check:bundle` | 236,3 KB von 250 KB |
| Gerätetest | steht aus: T-IPH-M0 Schritt 6 (Safari-Tab und installierte App) |

### F6 §2 Makro-Ring V2 · 23.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1194)

Makros Türkis, Blau, Violett überall gleich; Übergänge über 2 × 18° aus feinen Schritten, Mischfarben in OKLab (D-333).

| Nachweis | Ergebnis |
|---|---|
| `pnpm exec playwright test e2e/nutrition-ring.spec.ts` | 10 bestanden, 2 übersprungen. Gegenprobe gegen `6f99fc6`: „Ring V2 …“ fehlgeschlagen |
| `calc/ring.test.ts`, `ui/macro-ring.test.tsx` | bestanden; am alten Stand 6 fehlgeschlagen |
| Bildprüfung bei dreifacher Dichte (Ring auf „Ernährung“, „Heute“, über dem Ziel) | erster Entwurf in OKLCH mit grellem Cyan an der Naht Türkis–Blau (#00BCEC, außerhalb von sRGB); in OKLab weich, ohne Kanten zwischen den Schritten |
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | ohne Befund |
| `pnpm test` | 105 Dateien, 876 Tests bestanden |
| `pnpm test:e2e` (Chromium Desktop und Pixel 7) | 282 bestanden, 32 übersprungen, 0 fehlgeschlagen (7,0 min) |
| `pnpm check:bundle` | 236,3 KB von 250 KB |

### F6 §3 Erledigt-Markierungen · 23.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1194)

Eine Komponente `Mark` mit 14, 16 und 20 px; Verlauf, Je Aufgabe, Kalender und Abhakfeld (D-334).

| Nachweis | Ergebnis |
|---|---|
| `pnpm exec playwright test e2e/marks.spec.ts` | 9 bestanden, 1 übersprungen. Gegenprobe gegen `8271179` (Handy): 3 von 3 neuen Tests fehlgeschlagen |
| Vergleichsbild `docs/screens/komponenten/markierungen.png` | Verlauf 14 px unter dem Balken, Je Aufgabe 16 px, Kalender 16 px mit Wochentagen |
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | ohne Befund |
| `pnpm test` | 105 Dateien, 876 Tests bestanden |
| `pnpm test:e2e` (Chromium Desktop und Pixel 7) | 284 bestanden, 32 übersprungen, 0 fehlgeschlagen (6,8 min) |
| `pnpm check:bundle` | 236,5 KB von 250 KB |

### F6 §4 Aufgaben bearbeitbar (V1) · 23.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1194)

Zeile mit Abhakfeld links und Link in die Detailansicht, Einstellungen in der Detailansicht, Reihenfolge als eigener Schritt (D-335).

| Nachweis | Ergebnis |
|---|---|
| `pnpm exec playwright test e2e/task-rows.spec.ts e2e/tasks.spec.ts e2e/marks.spec.ts e2e/switches.spec.ts e2e/water.spec.ts e2e/period-row.spec.ts` | erster Lauf 87 bestanden, 2 fehlgeschlagen (Locator im Test), danach bestanden. Gegenprobe gegen `3f5b833`: 10 von 10 Fällen der neuen Datei fehlgeschlagen |
| Tipp aufs Abhakfeld, Tipp auf die Zeile, Tastatur (Tab, Leertaste, Enter) | auf „Heute“ und „Tagesaufgaben“ geprüft; das Abhakfeld öffnet nie die Details |
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | ohne Befund |
| `pnpm test` | 105 Dateien, 878 Tests bestanden |
| `pnpm test:e2e` (Chromium Desktop und Pixel 7) | 293 bestanden, 36 übersprungen, 1 fehlgeschlagen: Wettlauf im Test „Ring V2 …“ (§2) auf „Heute“, behoben; 5 Wiederholungen bestanden |
| `pnpm check:bundle` | 236,7 KB von 250 KB |

### F6 §5 Karte V2c · 23.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1194)

„Bereit für dein Training?“ als grüne Karte mit weißem Primärknopf (D-336).

| Nachweis | Ergebnis |
|---|---|
| `pnpm exec playwright test e2e/program-list.spec.ts` | 10 bestanden, 2 übersprungen. Gegenprobe gegen `4852076`: 2 von 2 fehlgeschlagen |
| Kontraste (`tokens.test.ts`) | Label und Text 7,9:1, Titel und Link 10,6:1, Schrift auf dem Knopf 16,9:1, Knopf zur Fläche 10,6:1 |
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | ohne Befund |
| `pnpm test` | 105 Dateien, 886 Tests bestanden |
| `pnpm test:e2e` (Chromium Desktop und Pixel 7) | 296 bestanden, 36 übersprungen, 0 fehlgeschlagen (7,7 min) |
| `pnpm check:bundle` | 237,5 KB von 250 KB |

### F6 §6 Startbild länger · 23.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1194)

Startfläche beim Kaltstart mindestens 1,0 s ab dem ersten Bild, dann 300 ms Ausblenden (D-337).

| Nachweis | Ergebnis |
|---|---|
| `src/app/startSurface.test.ts`, `src/app/splash.test.ts` | 7 und 10 bestanden (erster Lauf: 1 von 7 fehlgeschlagen, der Test prüfte eine Millisekunde zu spät; behoben) |
| `pnpm exec playwright test e2e/start-surface.spec.ts` | 8 bestanden, 6 übersprungen; 3 Wiederholungen: 24 bestanden. Gegenprobe gegen `6f77dbe`: 3 von 7 fehlgeschlagen |
| `node tools/splash.mjs --check` | Bilder, Vorlage und Startfläche passen zur Regel |
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | ohne Befund |
| `pnpm test` | 105 Dateien, 888 Tests bestanden |
| `pnpm test:e2e` (Chromium Desktop und Pixel 7) | 299 bestanden, 39 übersprungen, 0 fehlgeschlagen (7,8 min) |
| `pnpm check:bundle` | 237,6 KB von 250 KB |
| Am Gerät | offen: T-IPH-M0 Schritt 5 (Kaltstart der installierten App) |

### F6 §1 Nachtrag: Logo-Test in WebKit · 23.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1194)

Befund der CI zu `e2e/header-logo.spec.ts` im Projekt `webkit-mobile` (D-332). Nur der Test geändert.

| Nachweis | Ergebnis |
|---|---|
| CI zu `6f99fc6`, `8271179`, `3f5b833`, `4852076`, `6f77dbe` | jeweils dieselben 4 Fälle in `webkit-mobile` fehlgeschlagen („y 142.1875“, „y 181.375“, „Expected: 14, Received: 181.375“), alle anderen Jobs bestanden |
| Ursache | Mit der Kennung eines iPhones zeigt die App im Safari-Tab den Hinweis zur Installation über der Kopfzeile (AK-PWA-04) |
| Chromium mit der Kennung des iPhone 15, alter Test | 4 von 4 fehlgeschlagen, dieselben Werte wie in der CI |
| derselbe Aufbau, neuer Test | erst 1 von 6 Läufen fehlgeschlagen (Seitenwechsel vor dem Speichern von „Programm aktivieren“, freies Training ohne Übungen); nach der Korrektur 10 Wiederholungen: 40 bestanden |
| `pnpm exec playwright test e2e/header-logo.spec.ts --repeat-each=5` (Desktop, Pixel 7) | 25 bestanden, 15 übersprungen |
| WebKit | prüft die CI |

### F6 §7 Trainingskopf · 23.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1194)

„Woche n“ bleibt sichtbar, der Programmname kürzt sich (D-338).

| Nachweis | Ergebnis |
|---|---|
| `pnpm exec playwright test e2e/session-head.spec.ts` | 4 bestanden, 2 übersprungen. Gegenprobe gegen `4146fad`: 2 von 3 Handy-Fällen fehlgeschlagen (360 und 390 pt) |
| `player-ui.test.tsx` | 15 bestanden |
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | ohne Befund |
| `pnpm test` | 105 Dateien, 888 Tests bestanden |
| `pnpm test:e2e` (Chromium Desktop und Pixel 7) | erster Lauf: 302 bestanden, 41 übersprungen, 1 fehlgeschlagen (`switches.spec.ts`, Schalter per Tastatur, nicht nachgestellt); zweiter Lauf: 303 bestanden, 41 übersprungen, 0 fehlgeschlagen |
| `pnpm check:bundle` | 237,6 KB von 250 KB |

### F6 §6 Nachtrag: Startfläche in WebKit · 23.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1194)

Befund der CI zu `2a1990a` im Projekt `webkit-mobile` (D-337, Nachtrag).

| Nachweis | Ergebnis |
|---|---|
| CI zu `2a1990a`, WebKit | 296 bestanden, 47 übersprungen, 1 fehlgeschlagen: „Startfläche beim langsamen Start …“ („Expected: > 2812, Received: 1827“), auch im zweiten Versuch; Logo-Tests bestanden |
| Ursache | Kein Paint-Eintrag für die Fläche ohne Text, erst für den Text der App; die App zählte ab dort |
| `startSurface.test.ts` | am alten Stand 2 von 9 fehlgeschlagen (Fälle wie in Safari), danach 9 bestanden |
| `pnpm exec playwright test e2e/start-surface.spec.ts` | 9 bestanden, 7 übersprungen; 3 Wiederholungen 27 bestanden. Gegenprobe gegen `2a1990a`: der Fall ohne Paint-Eintrag fehlgeschlagen (1025 ms statt höchstens 400 ms nach „bereit“) |
| `node tools/splash.mjs --check` | Bilder, Vorlage und Startfläche passen zur Regel |
| WebKit | prüft die CI |

### F6 §9 Abschluss · 23.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1194)

Breiten, Knopfzeile der Einstellungen, Screenshots (D-340).

| Nachweis | Ergebnis |
|---|---|
| Breitenprüfung, 96 Ansichten auf 360, 390 und 768 pt | keine Konsolenfehler, kein Überlauf, nichts außerhalb, keine getrennten Wörter; gemeldet nur gewollte Kürzungen und das Menü „Meine Küche“ ab 768 pt |
| `pnpm exec playwright test e2e/switches.spec.ts e2e/task-rows.spec.ts e2e/tasks.spec.ts` | 58 bestanden, 6 übersprungen. Gegenprobe gegen `2a1990a`: 2 von 2 fehlgeschlagen („Pausieren und Löschen in einer Zeile“) |
| `node tools/screenshots.mjs komponenten` und `screens`, `node tools/screens-overview.mjs` | erster Lauf der Komponenten abgebrochen (Abhaken über den Namen), Werkzeug angepasst; danach alle Bilder, Übersicht 29 Bilder, Archiv 30 Bilder |
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | ohne Befund |
| `pnpm test` | 105 Dateien, 890 Tests bestanden |
| `pnpm test:e2e` (Chromium Desktop und Pixel 7) | 304 bestanden, 42 übersprungen, 0 fehlgeschlagen (7,1 min) |
| `pnpm check:bundle` | 237,6 KB von 250 KB |
| Am Gerät | offen: T-IPH-M0 Schritte 5 und 6 |

### F6 §9 Nachtrag: CI zu `6782756` · 23.10.2026

| Nachweis | Ergebnis |
|---|---|
| CI zu `6782756` | alle Jobs bestanden. Chromium 303 bestanden, 42 übersprungen, 1 flaky (`program-list.spec.ts`, „Heute geplant“ direkt nach „Programm aktivieren“ und dem Seitenwechsel nicht gefunden, im zweiten Versuch bestanden). WebKit nach einem Neustart des Jobs (der erste hing 24 Minuten in `playwright install --with-deps webkit`): 298 bestanden, 48 übersprungen, 0 fehlgeschlagen |
| `pnpm exec playwright test e2e/program-list.spec.ts --repeat-each=5` (nach der Korrektur) | 50 bestanden, 10 übersprungen |
| Gegenprobe | lokal nicht nachstellbar (20 Läufe mit 20-facher CPU-Drosselung, alter Ablauf bestanden) |

### Vor dem Merge · 23.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1194)

Hinweistext „Werte für“ und drei Screenshots (D-341).

| Nachweis | Ergebnis |
|---|---|
| `src/shared/i18n/de-nutrition.test.ts` (neu) | am alten Text 2 von 2 fehlgeschlagen, danach bestanden |
| `node tools/screenshots.mjs screens` und `komponenten`, `node tools/screens-overview.mjs` | Übersicht 32 Bilder, Archiv 33 Bilder |
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | ohne Befund |
| `pnpm test` | 106 Dateien, 892 Tests bestanden |
| `pnpm test:e2e` (Chromium Desktop und Pixel 7) | 302 bestanden, 42 übersprungen, 2 fehlgeschlagen: Offline-Test `pwa.spec.ts` in beiden Projekten (E-16; zwei Modul-Anfragen offline abgebrochen); einzeln 4 Wiederholungen je Projekt: 1 von 8 fehlgeschlagen |
| `pnpm check:bundle` | 237,6 KB von 250 KB |

### Nach dem Merge · 23.10.2026, Cloud-Umgebung (Node 22.22)

Merge von PR #49 (`1dc1dd7`), Auslieferung und Branch je Phase (D-342).

| Nachweis | Ergebnis |
|---|---|
| Vercel zu `1dc1dd7` | „Deployment has completed“ |
| CI auf `main` zu `1dc1dd7` | „Lint, Typen, Unit-Tests, Dokumente, Build“ bestanden; E2E lief beim Commit noch. Gleicher Inhalt wie `ef8b18e` (Tree `67769bd`), dort CI grün |
| Live-Adresse https://fitness-app-mu-drab.vercel.app | aus der Cloud-Umgebung nicht erreichbar („CONNECT tunnel failed, response 403“), nicht geprüft |
| `pnpm build` von `1dc1dd7` | Manifest „FORM“ (Name und Kurzname), vier Icons und `apple-touch-icon.png` vorhanden, 40 von 40 Startbildern vorhanden, Startfläche mit `theme-init.js`, Titel „FORM“ |
| `pnpm format:check`, `pnpm check:docs`, `pnpm build`, `pnpm check:bundle` (Commit auf `form-stabilitaet`) | ohne Befund; Startansicht 237,6 KB von 250 KB |

### Stabilität §1: Start nach Updates und ohne Netz · 23.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1243)

Ursache des Offline-Tests (E-16), Startwächter, einmal neu laden, Update-Strategie (D-343). Bericht: `form-stabilitaet-report.md` Abschnitt 2.

| Nachweis | Ergebnis |
|---|---|
| Ausgangslage am alten Stand: `pwa.spec.ts` „… alle Bereiche starten offline“ einzeln, 8 Wiederholungen je Projekt, 4 Worker | 16 bestanden |
| Ausgangslage: `pnpm test:e2e` (Chromium Desktop und Pixel 7) | 304 bestanden, 42 übersprungen, 0 fehlgeschlagen (10,7 min) |
| Nachstellen: derselbe Test mit 8 Workern auf 4 Kernen, 24 Läufe | 6 fehlgeschlagen, 18 bestanden; in allen sechs Traces ein Block vorgeladener Startmodule mit `net::ERR_ABORTED`, keine Konsolenfehler, Warnung „… is found, but is not used because it is a cross-world service worker resource mismatch.“ |
| Gegenprobe online mit Service Worker / ohne Service Worker / ohne `modulepreload`, je 24 Läufe mit 8 Workern | 5 / 0 / 1 fehlgeschlagen |
| `e2e/update.spec.ts` (neu, Chromium Desktop) | 7 bestanden; Gegenprobe am alten Stand: 7 von 7 fehlgeschlagen |
| `e2e/start-watch.spec.ts` (neu, Chromium Desktop und Pixel 7) | 4 bestanden; Gegenprobe am alten Stand: 2 von 2 fehlgeschlagen |
| Offline-Test mit 8 Workern, 24 Läufe, neuer Stand | 24 bestanden |
| Rundgang mit Zählung des Neuladens, 8 Worker, 24 Läufe, neuer Stand | 24 bestanden, 1 Lauf mit genau einem automatischen Neuladen |
| `e2e/update.spec.ts`, `start-watch.spec.ts`, `pwa.spec.ts`, `shell.spec.ts`, `resilience.spec.ts`, `session.spec.ts` | 40 bestanden, 8 übersprungen |
| `src/app/chunkRecovery.test.ts` (neu) | 21 bestanden |
| `src/shared/pwa/pwa.test.ts` | 11 bestanden (4 neu zum Wechsel des Service Workers) |
| `src/app/app.test.tsx` „kein Hinweis während eines Trainings“ | mit der alten Regel 1 von 1 fehlgeschlagen, danach bestanden |
| Chromium: zweiter Import einer Datei nach einem Fehlschlag | keine zweite Anfrage, derselbe Fehler (Grund für das Neuladen) |
| `node tools/check-precache.mjs` | 168 von 227 Dateien vorab gespeichert, die übrigen bewusst ausgenommen; mit einer zusätzlichen Datei in `dist/assets` Exit-Code 1 |
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | ohne Befund |
| `pnpm test` | 107 Dateien, 921 Tests bestanden |
| `pnpm build`, `pnpm check:bundle` | Startansicht 238,9 KB von 250 KB (vorher 237,6 KB) |
| WebKit, CI zu `5a1db80` (Lauf 39990720590) | 299 bestanden, 59 übersprungen, 5 fehlgeschlagen, 1 wackelnd (11,2 min): `start-watch.spec.ts` Fall 1 auf Desktop und Handy (App startete nach dem Neuladen nicht); `sync.spec.ts` „anmelden, Gewicht senden …“ und „Registrieren …“ (Konsolenfehler „… due to access control checks.“ beim Neuladen); `update.spec.ts` „Während eines Trainings …“ ohne Service Worker (WebKit-Meldung „'text/html' is not a valid JavaScript MIME type …“ nicht erkannt); wackelnd `barcode.spec.ts` (Anfrage an Open Food Facts am Service Worker vorbei, 404). Chromium: bestanden |
| Nachtrag (D-343): `chunkRecovery.test.ts` | 24 bestanden; die drei neuen Fälle (WebKit-Meldung, Navigation ab `beforeunload`, Navigation während der Prüfung) am alten Stand 3 von 3 fehlgeschlagen |
| Nachtrag: `start-watch`, `barcode`, `sync`, `update`, `switches` (Chromium Desktop und Pixel 7) | 59 bestanden, 9 übersprungen |
| Nachtrag: `pnpm test` | 107 Dateien, 924 Tests bestanden |
| Nachtrag: `pnpm build`, `pnpm check:bundle` | Startansicht 239,0 KB von 250 KB; Vorab-Liste 168 von 227 Dateien |
| Nachtrag: `pnpm test:e2e` (Chromium Desktop und Pixel 7) | 315 bestanden, 49 übersprungen, 0 fehlgeschlagen (11,5 min) |
| Nachtrag: WebKit | CI zu `0f50be6` (Lauf 40000437469): E2E nicht gelaufen, weil die Prüfungen am wackelnden Unit-Test „belegt Mengen ab 1000 …“ scheiterten (Ursache und Behebung in §2). In der CI zu `63d9428` (Lauf 40005195222) bestanden `sync.spec.ts` und `barcode.spec.ts` auf Desktop und Handy und die Fälle ohne Service Worker aus `update.spec.ts` (Handy, darunter „Während eines Trainings …“); `start-watch.spec.ts` Fall 1 blieb rot, behoben im Nachtrag 2 zu §2 (CI zu `9517f73`: bestanden) |


### Stabilität §2: Wackelnde Tests und CI · 23.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1243)

Linse der Tab-Leiste, Wasser-Schalter per Tastatur, Seitenende auf `/mehr/synchronisierung`, Installation von WebKit in der CI (D-344). Bericht: `form-stabilitaet-report.md` Abschnitt 3.

| Nachweis | Ergebnis |
|---|---|
| Ausgangslage aus der CI: „Ziehen mit der Linse …“ (WebKit) | zweimal erst im zweiten Versuch grün; bei `687d0bf` (Lauf 39881545035) in beiden Versuchen rot: „Received string: "tabbar pointer-events-auto lens-ready lens-active"“ |
| Ausgangslage aus der CI: „Seitenende: …“ (WebKit, `/mehr/synchronisierung`) | bei `ef8b18e` wackelnd, bei `687d0bf` in beiden Versuchen rot: „Expected: <= 579, Received: 623.359375“ |
| Ausgangslage aus der CI: Installation von WebKit (Lauf 39962966451, Job 120451347827, Versuch 2) | 13:51:46 bis 14:29:56, „Fetched 117 MB in 37min 47s (51.6 kB/s)“ |
| Linse, Dauer bis zum Ablegen nach dem Loslassen in Chromium, ohne und mit 6-, 12-, 20-facher CPU-Drosselung | alter Stand 444 ms (27 Bilder), 837 ms (9), 1944 ms (9), 3964 ms (8); neuer Stand 518 ms (24), 613 ms (7), 1326 ms (6), 1450 ms (5) |
| Neuer Test „Die Linse legt sich auch bei zwei Bildern je Sekunde binnen 2 s ab“ | neuer Stand bestanden; Gegenprobe am alten Stand: 2528 ms, fehlgeschlagen |
| Wasser-Schalter: Leertaste gehalten, gedrückt nach dem Tipp (Pixel 7) | gedrückt nach 65 und 104 ms: keine Wirkung (der Schalter war beim Drücken noch „aktiv“ vom Tipp, beim Loslassen nicht mehr); gedrückt nach 162, 167, 193, 197, 212, 244 und 345 ms: jedes Mal umgeschaltet |
| Wasser-Schalter: Gegenprobe, Leertaste direkt nach dem Tipp 250 ms gehalten, 2 × 10 Läufe mit 2 Workern | alter Ablauf 16 von 20 fehlgeschlagen; mit Warten auf das Ende des Tipps 20 von 20 bestanden |
| Wasser-Schalter: breiter Belastungslauf vor der Ursache (`switches`, `tasks`, `task-rows`, `water`, `network-a11y`, je 6 Wiederholungen, 6 Worker) | 732 bestanden, 36 übersprungen, 0 fehlgeschlagen (21,7 min); dazu 80 von 80 Läufen des Tests mit 8 Workern; nicht nachgestellt, bis die Ursache gezielt geprüft wurde |
| 20 Wiederholungen der früher wackelnden Tests, Chromium Desktop und Pixel 7, 2 Worker, ohne Wiederholung bei Fehlschlag (`--repeat-each=20 --retries=0`) | 260 bestanden, 60 übersprungen (Fälle nur für das Handy, auf dem Desktop), 0 fehlgeschlagen (17,5 min): Linse 20 und 20 (neuer Test), Seitenende 20, Wasser-Schalter 40, Offline-Start (E-16) 40, Barcode 40, Startwächter 80 |
| Ausgangslage aus der CI zu `0f50be6` (Lauf 40000437469): `nutrition-ui.test.tsx` „belegt Mengen ab 1000 …“ | rot: „Unable to find a label with the text of: Menge in ml“; die Bearbeitung zeigte „Anzahl (Packung)“, also den anderen der beiden Einträge |
| Neuer Test „Einträge mit gleicher Uhrzeit in der Reihenfolge des Eintragens“ (acht Einträge zur selben Zeit) | neuer Stand bestanden; Gegenprobe am alten Stand 3 von 3 fehlgeschlagen, jedes Mal eine andere Reihenfolge (z. B. 30, 80, 70, 10, 40, 50, 20, 60) |
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | ohne Befund |
| `pnpm test` und `pnpm test:coverage` | je 107 Dateien, 925 Tests bestanden |
| `pnpm build`, `pnpm check:bundle` | Startansicht 239,0 KB von 250 KB; Vorab-Liste 168 von 227 Dateien |
| `pnpm test:e2e` (Chromium Desktop und Pixel 7) | 316 bestanden, 50 übersprungen, 0 fehlgeschlagen (11,6 min) |
| WebKit, CI zu `63d9428` (Lauf 40005195222) | 304 bestanden, 60 übersprungen, 2 fehlgeschlagen (11,1 min): `start-watch.spec.ts` Fall 1 auf Desktop und Handy, auch im zweiten Versuch („App gestartet (Dokument 1, ui abgebrochen, Dokument 2)“, keine Überschrift „Heute“ binnen 5 s). Chromium: bestanden |
| 20 Wiederholungen in der CI (`repeat.yml`, Lauf 40005209039), Chromium | 259 bestanden, 60 übersprungen, 1 fehlgeschlagen (10,9 min): „Seitenende: …“ auf `/ernaehrung` (Pixel 7), „über dem Kreis (<a aria-label="Wasser: Einträge, Ziel und Verlauf" …)“, Expected: <= 762.93, Received: 807.05; alle übrigen bestanden |
| 20 Wiederholungen in der CI, WebKit | 180 bestanden, 100 übersprungen, 40 fehlgeschlagen (12,7 min): alle 40 Fehlschläge `start-watch.spec.ts` Fall 1 (20 von 20 auf Desktop und Handy); Linse, Seitenende, Offline-Start, Barcode und Startwächter Fall 2 ohne Fehlschlag |
| Nachtrag: Seitenende auf `/ernaehrung` nachgestellt, Wasser-Karte um 300 bis 1500 ms verzögert (61 Stufen zu 20 ms, Pixel 7, ohne Service Worker) | alter Ablauf zweimal je 5 von 61 fehlgeschlagen, mit 807,05 (wie in der CI) und 802,64; neuer Ablauf 61 von 61 bestanden |
| Nachtrag: `marks.spec.ts` (Chromium Desktop und Pixel 7) | 9 bestanden, 1 übersprungen |
| Nachtrag: `e2e/diagnose-start-watch.spec.ts` (vorübergehend, Chromium Desktop) | 4 bestanden; in allen vier Fassungen startet die App nach dem Neuladen (Protokoll im Testlauf) |
| Nachtrag: CI zu `505cc1a` (Lauf 40010891575), WebKit | 306 bestanden, 60 übersprungen, 2 fehlgeschlagen (nur `start-watch.spec.ts` Fall 1); `marks.spec.ts` bestanden. Chromium: bestanden |
| Nachtrag: Diagnose Startwächter in der CI (WebKit Desktop und Handy, je vier Fassungen: sofort, nach `load`, nach 1 s, `location.replace`) | in allen acht Läufen startete die App nicht; das zweite Dokument fragte `ui-…js` nicht an und zeigte „FORM ließ sich nicht starten“; nach dem Laden meldete WebKit „… was preloaded using link preload but not used within a few seconds …“. Chromium: alle acht gestartet |
| Nachtrag 2: kein Vorladen in index.html, `pnpm build`, `pnpm check:bundle` | 0 Vorlade-Links in `dist/index.html`; Startansicht 238,9 KB von 250 KB (vorher 239,4 KB; index.html 5,6 statt 6,1 KB); Vorab-Liste 170 von 229 Dateien |
| Nachtrag 2: `start-watch`, `diagnose-start-watch`, `pwa`, `update`, `start-surface`, `shell`, `resilience` (Chromium Desktop und Pixel 7) | 49 bestanden, 15 übersprungen |
| Nachtrag 2: `start-watch.spec.ts` und Gegenprobe `diagnose-start-watch.spec.ts` (Chromium Desktop und Pixel 7) | 8 bestanden; in Chromium startet die App mit und ohne das frühere Vorladen (31 Vorlade-Links nachgebildet) |
| Nachtrag 2: WebKit, CI zu `9517f73` (Lauf 40015267772) | 312 bestanden, 60 übersprungen, 0 fehlgeschlagen (11,9 min); `start-watch.spec.ts` Fall 1 und 2 bestanden. Chromium: bestanden |
| Nachtrag 2: Gegenprobe `diagnose-start-watch.spec.ts` in der CI (WebKit Desktop und Handy, Protokoll im Testlauf) | „ohne Vorladen (neu)“: `gestartet=true Dokumente=2 h1=["Heute: Guten Abend."]`, „Vorladen im Dokument: 0“, das zweite Dokument fragte `ui-…js` an („ui durchgelassen“). „mit Vorladen (alter Aufbau)“: `gestartet=false Dokumente=2 h1=["FORM ließ sich nicht starten"]`, „Vorladen im Dokument: 31“, das zweite Dokument fragte `ui-…js` nicht an. Auf beiden Geräten gleich |
| Nachtrag 2: 20 Wiederholungen in der CI zu `9517f73` (`repeat.yml`, Lauf 40017391070), Chromium | 260 bestanden, 60 übersprungen, 0 fehlgeschlagen (11,4 min): Linse 20 und 20 (Pixel 7, neuer und alter Test), Seitenende 20 (Pixel 7), Wasser-Schalter 40, Offline-Start (E-16) 40, Barcode 40, Startwächter 80; übersprungen sind die Fälle nur für das Handy auf dem Desktop |
| Nachtrag 2: 20 Wiederholungen in der CI, WebKit | 220 bestanden, 100 übersprungen, 0 fehlgeschlagen (11,6 min): Linse 20 und 20 (Handy), Seitenende 20 (Handy), Wasser-Schalter 40, Barcode 40, Startwächter 80 (Fall 1 im ersten Lauf 40 von 40 rot); der Offline-Start läuft nur in Chromium |

### Stabilität §3: Wiederherstellen aus dem Export · 23.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1243)

Prüfung, Zusammenfassung, Ersetzen, Regeln für die Synchronisierung (A-14, D-345). Bericht: `form-stabilitaet-report.md` Abschnitt 4.

| Nachweis | Ergebnis |
|---|---|
| `src/modules/backup/backup.test.ts` (neu) | 23 bestanden: Dokumentarten gleich `EXPORT_TYPES`; Export angenommen, Zusammenfassung; ältere Sicherung ohne neuere Arten angenommen; fremde, beschädigte, neuere und ungültige Dateien mit Grund abgelehnt (13 Fälle, darunter doppelte ID, falsche Art, Wert außerhalb des Schemas, Stand in der Zukunft, zu viele Dokumente); Migration Schritt für Schritt, ohne Schritt abgelehnt; keine JSON-Datei und zu große Datei; abgelehnte Dateien ändern weder Daten noch Uhr; Export, Änderungen, Import: fachlich derselbe Stand, nur lokal Liegendes gelöscht markiert, neue Stempel dieses Geräts, Projektion neu; in eine leere Datenbank (AK-DAT-02) ohne Sicherung vorher; zweimal eingespielt unverändert; während eines Trainings nichts gesichert und nichts ersetzt; abgebrochene Sicherung des aktuellen Stands ersetzt nichts; Fehler mitten in der Transaktion (Uhr nicht speicherbar) lässt alles wie vorher; K-01 und K-03 (fünf Fälle) |
| Gegenprobe K-01/K-03: Regel abgeschaltet (`keep: () => false`) | 1 von 1 fehlgeschlagen (das abgeschlossene Training wurde durch die laufende Fassung ersetzt) |
| `src/modules/backup/ui/restore-card.test.tsx` (neu) | 4 bestanden: fremde Datei mit Grund abgelehnt; Zusammenfassung, Rückfrage „Daten ersetzen?“, vorher eine Datei `fitness-sicherung-vor-wiederherstellung-…`, danach nur das Gewicht der Sicherung; leeres Gerät: „Sicherung übernehmen?“ ohne Datei vorher; während eines Trainings gesperrt |
| `e2e/restore.spec.ts` (neu, Chromium Desktop und Pixel 7) | 2 bestanden: Gewicht erfassen, exportieren, ändern; fremde, neuere und abgeschnittene Datei abgelehnt, Gewicht unverändert; echte Sicherung: Zusammenfassung, zweimal bestätigt, Download der Sicherung vorher, „Die Sicherung vom … ist wiederhergestellt.“, Gewicht wie in der Sicherung, auch nach Neuladen |
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | ohne Befund |
| `pnpm test` | 109 Dateien, 952 Tests bestanden |
| `pnpm build`, `pnpm check:bundle` | Startansicht 239,4 KB von 250 KB (die Karte und ihre Texte laden mit der Seite „Daten und Sicherung“); Vorab-Liste 170 von 229 Dateien |
| `pnpm test:e2e` (Chromium Desktop und Pixel 7) | 318 bestanden, 50 übersprungen, 0 fehlgeschlagen (11,3 min) |
| WebKit, CI zu `cc7c86b` (Lauf 40008767361) | 306 bestanden, 60 übersprungen, 2 fehlgeschlagen (11,0 min): nur `start-watch.spec.ts` Fall 1 auf Desktop und Handy (bekannt, Nachtrag zu D-344); `restore.spec.ts` bestanden. Chromium: bestanden |

### Stabilität §4: Weitere P2-Befunde und B-07 · 23.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1243)

Befunde aus `audit-report.md` Abschnitt 5 nach Priorität, dazu B-07 (D-346). Bericht: `form-stabilitaet-report.md` Abschnitt 5. Gegenprobe heißt: dieselben Tests mit dem alten Stand der geänderten Dateien.

| Nachweis | Ergebnis |
|---|---|
| A-03: `settings.test.ts` (zwei neue Fälle: Einstellungen, Profil mit geleertem Namen), `training/data/trainingStateRepository.test.ts` (neu: unbekanntes Feld bleibt, ein entferntes bekanntes Feld bleibt entfernt) | 8 bestanden; Gegenprobe 3 von 3 neuen Fällen fehlgeschlagen |
| A-04: `syncEngine.test.ts` „kürzt lange Namen …“ (58, 59, 79, 80 Zeichen gegen die Schemas von Programm und Rezept) | 10 bestanden; Gegenprobe mit der alten Kürzung: 1 von 1 fehlgeschlagen („expected 81 to be less than or equal to 80“) |
| A-07: `repository.test.ts` „ruft `onDocumentWritten` …“ (vier Schreibarten, außerhalb der Transaktion, abgelehnte Änderung meldet nichts) | 12 bestanden; Gegenprobe 1 von 1 fehlgeschlagen |
| A-07: `e2e/persist.spec.ts` (neu, Chromium Desktop und Pixel 7): vor dem ersten Gewicht keine Anfrage, danach genau eine | 2 bestanden; Gegenprobe 2 von 2 fehlgeschlagen („Expected: 1, Received: 0“) |
| A-07: Startansicht mit Import von `storage.ts` im Repository / mit Meldung über die Laufzeit | 242,2 KB (sechs kleine Teile neu abgespalten) / 239,3 KB; deshalb die Meldung über `onDocumentWritten` |
| A-08: `syncService.test.ts` (drei neue Fälle: Anmelden, Registrieren, Gerät ohne Daten) | alle bestanden (Modul `sync` 33 Tests); Gegenprobe ohne Prüfung: 2 von 3 fehlgeschlagen, der Fall ohne Daten besteht in beiden Fassungen |
| B-03: `programProgress.test.ts` (Tag verschoben, gelöscht, dupliziert; Nummer des Tages über die ID) | 15 bestanden; Gegenprobe 4 von 4 neuen Fällen fehlgeschlagen, dazu der bestehende Fall der Nummer (geänderter Aufruf) |
| B-04: `training/data/sessionRepository.test.ts` (neu), `app.test.tsx` „legt die App nicht lahm …“, `banners/banner-boundary.test.tsx` (neu) | alle bestanden; Gegenprobe 3 von 3 fehlgeschlagen (ZodError; Seite und Navigation erschienen nicht, Zeitlimit) |
| B-05: `playerService.test.ts` „lässt einen offenen Drop-Satz bei seinem übersprungenen Arbeitssatz“ | 9 bestanden; Gegenprobe 1 von 1 fehlgeschlagen (ZodError) |
| B-07: `training/ui/start-from-program.test.tsx` (neu: fehlende Übung, Meldung, Knopf bedienbar, Protokoll) | 1 bestanden; Gegenprobe 1 von 1 fehlgeschlagen |
| C-02: `nutrition-ui.test.tsx` (Doppeltipp auf „Hinzufügen“ im Schnelleintrag, auf „Speichern“ einer Vorlage) | 2 bestanden; Gegenprobe 2 von 2 fehlgeschlagen („expected 2 to be 1“) |
| C-03: `nutrition/ui/barcode-flow.test.tsx` (neu: spätes Ergebnis nach „Schließen“) | 1 bestanden; Gegenprobe 1 von 1 fehlgeschlagen (Dialog der Einwilligung erschien) |
| C-04: `waterService.test.ts` „lädt für einen Tag nur dessen Einträge“, `nutrition/ui/use-food-catalog.test.ts` (neu: ein Index je Import) | 2 bestanden. Keine fachliche Gegenprobe: Am alten Stand gab es beide Funktionen nicht; das Verhalten der App ist gleich, es entfällt doppelte Arbeit |
| D-01: `insights.test.ts` (Aufgabe für Mo/Mi/Fr: Vergleich mit dem Zeitraum davor, Hinweis „verbessert“ an einem Dienstag) | 18 bestanden; Gegenprobe 2 von 2 fehlgeschlagen („expected null to be 50“, „expected [] to deeply equal [ 'improving' ]“) |
| D-02, E-03: `snapshots.test.ts` (fünf neue Fälle), `app.test.tsx` (Ursache „Speicher voll“), `syncService.test.ts` und `steps/data/stepsState.test.ts` (Schlüssel der Module) | alle bestanden; Gegenprobe mit abgeschaltetem Filter, abgeschalteter Wiederholung und ohne neue Ursache: 4 von 4 betroffenen Fällen fehlgeschlagen |
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | ohne Befund |
| `pnpm test` | 116 Dateien, 984 Tests bestanden |
| `pnpm build`, `pnpm check:bundle` | Startansicht 239,5 KB von 250 KB (vorher 238,9 KB); Vorab-Liste 170 von 229 Dateien |
| `pnpm test:e2e` (Chromium Desktop und Pixel 7) | 324 bestanden, 50 übersprungen, 0 fehlgeschlagen (10,7 min) |
| WebKit, CI zu `aa936d2` (Lauf 40018756552) | 314 bestanden, 60 übersprungen, 0 fehlgeschlagen (11,7 min); `persist.spec.ts`, `restore.spec.ts` und `start-watch.spec.ts` auf Desktop und Handy bestanden. Chromium: 324 bestanden, 50 übersprungen, 0 fehlgeschlagen (6,7 min) |

### Stabilität §5: Startansicht höchstens 235 KB · 23.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1243)

Ziel aus dem Auftrag: höchstens 235 KB (gzip), vorher 239,5 KB (D-347). Bericht: `form-stabilitaet-report.md` Abschnitt 6.

| Nachweis | Ergebnis |
|---|---|
| Aufteilung der Startansicht nach Quelldateien (Build mit Sourcemaps, Anteil am gzip je Datei geschätzt) | react-dom 63,7 KB, Dexie 30,9 KB, React Router rund 28 KB, Zod rund 23 KB, Textkatalog `de.ts` 11,6 KB, Linse der Tab-Leiste 2,5 KB, der Rest unter 2 KB je Datei |
| Versuch `"sideEffects": ["**/*.css"]` in `package.json` | 240,2 KB, verworfen |
| Texte von „Mehr“, Nachtragen, Verlauf, Zusammenfassung, Fortschritt, Pausenanzeige und Tagesaufgaben in eigenen Dateien | 235,2 KB; Katalog in der Startansicht 7,2 KB |
| dazu die Texte des Players (`de-session.ts`, 76 Schlüssel; `t.session` behält Fortschritt und Muskeln) | 234,3 KB von 250 KB; Katalog in der Startansicht 6,2 KB; Vorab-Liste 173 von 232 Dateien |
| `pnpm typecheck` | ohne Befund; die Typprüfung fand jeden geänderten Aufrufer |
| `src/app/wording.test.ts` (alle Kataloge, neu dazu `tMore`, `tTrainingPages`, `tTasks`, `tSession` und `tBackup`) | 29 bestanden |
| `pnpm format:check`, `pnpm lint`, `pnpm check:docs` | ohne Befund |
| `pnpm test` | 116 Dateien, 984 Tests bestanden |
| `pnpm test:e2e` (Chromium Desktop und Pixel 7) | 324 bestanden, 50 übersprungen, 0 fehlgeschlagen (10,6 min) |
| WebKit, CI zu `86d4841` (Lauf 40021792538) | 314 bestanden, 60 übersprungen, 0 fehlgeschlagen (11,7 min). Chromium: 324 bestanden, 50 übersprungen, 0 fehlgeschlagen (6,1 min) |

### Stabilität §6: Tests und Abschluss · 23.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1243)

Alle Prüfungen auf dem Stand des Abschlusses; die vorübergehende Gegenprobe `e2e/diagnose-start-watch.spec.ts` ist entfernt (D-348). Bericht: `form-stabilitaet-report.md` Abschnitt 7.

| Nachweis | Ergebnis |
|---|---|
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | ohne Befund |
| `pnpm test` | 116 Dateien, 984 Tests bestanden |
| `pnpm test:coverage` | 116 Dateien, 984 Tests bestanden; Schwellen der Abdeckung erreicht |
| `pnpm build`, `pnpm check:bundle` | Startansicht 234,3 KB von 250 KB; Vorab-Liste 173 von 232 Dateien; 0 Vorlade-Links in `dist/index.html`. Die Summe schwankt von Build zu Build um 0,1 KB (gemessen 234,2 und 234,3 KB), weil `db-….js` in der Startansicht die Uhrzeit des Builds enthält |
| `pnpm test:e2e` (Chromium Desktop und Pixel 7) | 320 bestanden, 50 übersprungen, 0 fehlgeschlagen (10,7 min); 4 weniger als in §5, weil die Gegenprobe (2 Tests × 2 Projekte) entfällt |
| Wackelnder Unit-Test aus §2 (Einträge derselben Millisekunde), je 20-mal hintereinander: „belegt Mengen ab 1000 …“ (`nutrition-ui.test.tsx`), „Einträge mit gleicher Uhrzeit …“ (`nutritionService.test.ts`) | je 20 von 20 bestanden (jeder Lauf ein eigener Prozess, gezählt nur mit „1 passed“) |
| CI zu `86d4841` (Lauf 40021792538) | Prüfungen bestanden; Chromium 324 bestanden, 50 übersprungen, 0 fehlgeschlagen (6,1 min); WebKit 314 bestanden, 60 übersprungen, 0 fehlgeschlagen (11,7 min) |
| WebKit zum Commit des Abschlusses | steht beim Schreiben aus |

### Stabilität, Nachtrag A-05: Sperre je Konto · 24.10.2026, Cloud-Umgebung (Node 22.22, PostgreSQL 16.15)

Sperre je Konto in `push_documents`, SQL des Servers in `supabase/migrations/`, Datenbanktest (D-349). Bericht: `form-stabilitaet-report.md` Abschnitt 8.

| Nachweis | Ergebnis |
|---|---|
| Migrationen des Servers gegen die Dateien | `20261019145316` und `20261019145346`: Prüfsumme und Länge gleich (3851 und 1891 Bytes); `push_documents` auf dem Server vorher byte-gleich mit der zweiten |
| `pnpm test:db` (frische Datenbank, Nachbildung von Supabase, drei Migrationen) | bestanden: zwei gleichzeitige Sendungen eines Kontos, B wartete auf A, Gerät C hat rev 1 und 2 geholt; ein anderes Konto wartet nicht; jüngerer HLC angenommen, gleicher HLC stale; vor und nach der Sperre nur `push_documents` geändert; Zurücknehmen stellt die Funktion wortgleich her |
| Gegenprobe `node tools/test-db.mjs --bis 20261019145346` | fehlgeschlagen: „Übersprungen: Gerät C hat rev 1 nie geholt (A rev 1, B rev 2, B fertig, Cursor 2)“ |
| je 10 Wiederholungen | mit Sperre 10 von 10 bestanden, ohne Sperre 10 von 10 fehlgeschlagen |
| Server nach dem Einspielen (`tools/db/snapshot.sql`, lesend) | Migration `20261024055418` byte-gleich mit der Datei (2430 Bytes); 26 von 28 Werten wie vorher, anders nur Text von `push_documents` und „enthält die Sperre“; 0 Zeilen, 0 Konten; Hinweise von Supabase zur Sicherheit keine |
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | ohne Befund |
| `pnpm test` | 116 Dateien, 984 Tests bestanden |
| `pnpm build`, `pnpm check:bundle` | Startansicht 234,3 KB von 250 KB |
| `pnpm test:e2e` (Chromium Desktop und Pixel 7) | 320 bestanden, 50 übersprungen, 0 fehlgeschlagen (8,0 min) |
| CI zu `e33bcfb` (Lauf 40069234757) | alle Jobs grün; Datenbank (PostgreSQL 17.11) bestanden wie lokal; Chromium 320 bestanden, 50 übersprungen; WebKit 309 bestanden, 1 flaky (`switches.spec.ts:340`), 60 übersprungen |

### Stabilität, Nachtrag A-15: Rechte auf das Nötige · 24.10.2026, Cloud-Umgebung (Node 22.22, PostgreSQL 16.15)

Rechte an `sync_documents` und der Sequenz eingeschränkt (D-350). Bericht: `form-stabilitaet-report.md` Abschnitt 9.

| Nachweis | Ergebnis |
|---|---|
| Hinweise von Supabase zur Sicherheit vorher | keine |
| `pnpm test:db` (vier Migrationen) | bestanden: angemeldet senden und abholen, Leeren, Löschen und Lesen der Sequenz abgelehnt; nicht angemeldet weder Sequenz noch Tabelle noch `push_documents`; Rechte laut Katalog wie vorgesehen; Tests zu A-05 weiter bestanden; Zurücknehmen beider Migrationen wieder wie vorher |
| Gegenprobe `node tools/test-db.mjs --bis 20261024055418` | fehlgeschlagen: „Leeren wurde nicht abgelehnt: authenticated konnte sync_documents leeren“ |
| je 10 Wiederholungen | alle Migrationen 10 von 10 bestanden; Stand davor 10 von 10 fehlgeschlagen |
| Server nach dem Einspielen (`tools/db/snapshot.sql`, lesend) | Migration `20261024063941` byte-gleich mit der Datei (864 Bytes); 32 von 37 Werten wie vorher, anders nur die fünf Werte zu den Rechten; 0 Zeilen, 0 Konten |
| Hinweise von Supabase zur Sicherheit nachher | keine |
| CI zu `93d7f09` (Lauf 40071508901) | Datenbank (PostgreSQL 17.11) fehlgeschlagen: „malformed array literal: "MAINTAIN"“ in `rights.test.sql` Teil 3, ein Fehler im Test (Zweig nur ab Postgres 17). Nach der Änderung zu `unused \|\| array['MAINTAIN']`: Teil 3 lesend auf dem Server (PostgreSQL 17.11) ohne Fehler. E2E Chromium 320 bestanden, WebKit 310 bestanden, je 0 fehlgeschlagen |
| CI zu `3cc0523` (Lauf 40073309337) | alle Jobs grün; Datenbank (PostgreSQL 17.11): alle sechs „bestanden“, beide Migrationen wieder wie vorher zurückgenommen |
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | ohne Befund |
| `pnpm test` | 116 Dateien, 984 Tests bestanden |
| `pnpm build`, `pnpm check:bundle` | Startansicht 234,2 KB von 250 KB; Vorab-Liste 173 von 232 Dateien |
| E2E | App und E2E-Tests in diesem Paket unverändert; der volle Lauf folgt mit dem nächsten Paket (Testfix `switches.spec.ts`) auf diesem Stand, WebKit in der CI |

### Stabilität, Nachtrag: Auswahl nach dem ersten Gewicht · 24.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1243)

Wackelnder Test `e2e/switches.spec.ts:340` auf `/fortschritt/gewicht` (D-351). Bericht: `form-stabilitaet-report.md` Abschnitt 10.

| Nachweis | Ergebnis |
|---|---|
| CI zu `e33bcfb`, WebKit Desktop | einmal fehlgeschlagen („Expected: > 0, Received: 0“, Zeile 345), im zweiten Versuch bestanden |
| Gegenprobe mit 20-fach gedrosselter CPU (vorübergehender Test, nicht im Repository), je 30 Läufe in beiden Projekten, ohne zweiten Versuch | alter Ablauf 2 von 60 fehlgeschlagen (gleiche Meldung), neuer Ablauf 60 von 60 bestanden |
| `--grep "Einfachauswahl auf /fortschritt/gewicht" --repeat-each=20 --retries=0` | 40 von 40 bestanden |
| `e2e/switches.spec.ts`, ohne zweiten Versuch | 38 bestanden, 2 übersprungen, 0 fehlgeschlagen |
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | ohne Befund |
| `pnpm test` | 116 Dateien, 984 Tests bestanden |
| `pnpm build`, `pnpm check:bundle` | Startansicht 234,2 KB von 250 KB |
| `pnpm test:e2e` (Chromium Desktop und Pixel 7, Stand mit D-350 und D-351) | 320 bestanden, 50 übersprungen, 0 fehlgeschlagen (8,0 min) |
| Wiederholung in der CI (`repeat.yml`, Lauf 40072960651, Stand `11fa1eb`) | Chromium 300 bestanden, WebKit 260 bestanden, je 0 fehlgeschlagen; der behobene Test je Engine 40 von 40 |
| CI zu `3cc0523` (Lauf 40073309337) | alle Jobs grün; Chromium 320 bestanden, WebKit 310 bestanden; nichts im zweiten Versuch |

### Stabilität, Sicherungsdateien form-sicherung-… · 24.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1243)

Export und Sicherung vor dem Wiederherstellen heißen `form-sicherung-…` (D-352). Bericht: `form-stabilitaet-report.md` Abschnitt 12.

| Nachweis | Ergebnis |
|---|---|
| `src/shared/db/export.test.ts`, `src/modules/backup` | 33 bestanden, darunter neu: Wiederherstellen einer Datei `fitness-sicherung-2026-10-20-0815.json` und einer Datei `form-sicherung-2026-10-24-1730.json` |
| Gegenprobe mit dem alten Code | 2 von 33 fehlgeschlagen („Expected: "form-sicherung-2026-10-18-1605.json", Received: "fitness-sicherung-2026-10-18-1605.json"“ und der Name der Sicherung vor dem Wiederherstellen) |
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | ohne Befund |
| `pnpm test` | 116 Dateien, 986 Tests bestanden |
| `pnpm build`, `pnpm check:bundle` | Startansicht 234,3 KB von 250 KB |
| `pnpm test:e2e` (Chromium Desktop und Pixel 7) | 320 bestanden, 50 übersprungen, 0 fehlgeschlagen (10,2 min); darin `shell.spec.ts` (Name des Exports) und `restore.spec.ts` (Name der Sicherung vor dem Wiederherstellen) |
| WebKit | in der CI zum Commit |

### Ernährung §1: Suche für jede Datenquelle · 24.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1243)

Neue Lebensmittelsuche (D-356, AK-NUT-14). Bericht: `form-ernaehrung-report.md` Abschnitt 3.

| Nachweis | Ergebnis |
|---|---|
| `src/modules/nutrition/calc/foodSearch.test.ts` | 16 bestanden |
| `pnpm test` | 117 Dateien, 1002 Tests bestanden |
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | ohne Befund |
| `pnpm build`, `pnpm check:bundle` | Startansicht 234,3 KB von 250 KB |
| E2E `nutrition.spec.ts`, `nutrition-ring.spec.ts` (Chromium Desktop und Pixel 7) | 22 bestanden, 2 übersprungen, 0 fehlgeschlagen |
| Gegenprobe: neuer E2E-Test „Suche: Mehrzahl, Umlautschreibweise und Synonyme …“ gegen die alte Suche | 2 von 2 fehlgeschlagen („Expected pattern: /^Tomate roh/“) |
| Laufzeit (Node, vorübergehender Lauf) | Index 7.140 Einträge 147 ms; Suche über 12.140 Einträge Median 23,0 ms, höchstens 43,4 ms |
| WebKit | CI-Lauf 40124992752 zu `b7dfaec`: erfolgreich |

### Ernährung §1, Nachtrag: ganzes Wort vor Grundwort · 24.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1243)

Stufe 8 für das ganze Wort am Anfang des Namens, falsche Freunde „Oberschenkel“ und „Butternut“, Synonym „Gehacktes“ gestrichen (D-357). Bericht: `form-ernaehrung-report.md` Abschnitt 3, Nachtrag.

| Nachweis | Ergebnis |
|---|---|
| `src/modules/nutrition/calc/foodSearch.test.ts` | 19 bestanden |
| Gegenprobe: drei neue Tests gegen die Suche aus D-356 | 3 von 3 fehlgeschlagen |
| `pnpm test` | 117 Dateien, 1005 Tests bestanden |
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | ohne Befund |
| `pnpm build`, `pnpm check:bundle` | Startansicht 234,3 KB von 250 KB |
| E2E `nutrition.spec.ts`, `nutrition-ring.spec.ts` (Chromium Desktop und Pixel 7) | 22 bestanden, 2 übersprungen, 0 fehlgeschlagen |
| WebKit | CI-Lauf 40127846395 zu `6be7660`: erfolgreich |

### Ernährung §2: Auswahlliste aus dem BLS 4.0 · 24.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1243)

`docs/lebensmittel-auswahl.csv` mit 354 Zeilen zur Durchsicht, Prüfung `tools/lebensmittel_auswahl.py` in `pnpm check:docs` (D-358). Bericht: `form-ernaehrung-report.md` Abschnitt 4.

| Nachweis | Ergebnis |
|---|---|
| `python3 tools/lebensmittel_auswahl.py --check` | 354 Einträge geprüft |
| Gegenprobe mit drei absichtlichen Fehlern | 3 Fehler gemeldet, Exit-Code 1 |
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | ohne Befund |
| `pnpm test` | 117 Dateien, 1005 Tests bestanden |
| `pnpm build`, `pnpm check:bundle` | Startansicht 234,3 KB von 250 KB |
| E2E, ganze Suite (Chromium Desktop und Pixel 7) | 322 bestanden, 50 übersprungen, 0 fehlgeschlagen |
| WebKit | CI-Lauf 40129250444 zu `72e9094`: erfolgreich |

### Ernährung §3: Salz, Zucker, gesättigte Fettsäuren, Ballaststoffe mit Referenz · 24.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1243)

Ist und Tagesreferenz unter „Weitere Nährwerte“, fehlende Angaben nicht als 0 (D-359, AK-NUT-15). Bericht: `form-ernaehrung-report.md` Abschnitt 5.

| Nachweis | Ergebnis |
|---|---|
| `references.test.ts`, `de-nutrition.test.ts`, `nutrition-ui.test.tsx` | 6, 6 und 16 bestanden |
| Gegenprobe: zwei neue Komponententests gegen die alte Übersicht | 2 von 2 fehlgeschlagen |
| `pnpm test` | 118 Dateien, 1017 Tests bestanden |
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | ohne Befund |
| `pnpm build`, `pnpm check:bundle` | Startansicht 234,2 KB von 250 KB |
| E2E `nutrition.spec.ts`, `nutrition-ring.spec.ts`, `network-a11y.spec.ts` (Chromium Desktop und Pixel 7) | 80 bestanden, 2 übersprungen, 0 fehlgeschlagen |
| E2E, ganze Suite (Chromium), Stand vor dem gemeinsamen Hinweis | 322 bestanden, 50 übersprungen, 0 fehlgeschlagen |
| Gegenprobe: erweiterter E2E-Test gegen die alte Übersicht | 2 von 2 fehlgeschlagen („Expected pattern: /von höchstens 6 g/“) |
| WebKit | CI-Lauf 40130994920 zu `5c98762`: erfolgreich |

### Ernährung §4: Einkaufsliste, Wischen zum Löschen · 24.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1243)

Wisch nach links löscht einen Artikel mit Rückgängig (D-360, AK-NUT-16). Bericht: `form-ernaehrung-report.md` Abschnitt 6.

| Nachweis | Ergebnis |
|---|---|
| `swipe.test.ts`, `shopping-ui.test.tsx` | 5 und 10 bestanden |
| Gegenprobe: vier neue Komponententests gegen die alte Liste | 4 von 4 fehlgeschlagen |
| `pnpm test` | 119 Dateien, 1026 Tests bestanden |
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | ohne Befund |
| `pnpm build`, `pnpm check:bundle` | Startansicht 234,4 KB von 250 KB |
| E2E `shopping.spec.ts` (Chromium Desktop und Pixel 7, Maus und Touch) | 9 bestanden, 1 übersprungen |
| E2E, ganze Suite (Chromium) | 325 bestanden, 51 übersprungen, 0 fehlgeschlagen |
| WebKit | CI-Lauf 40133009248 zu `bce4e15`: alle vier Jobs grün |

### Ernährung: Auswahlliste nach der Freigabe ergänzt · 25.10.2026, Cloud-Umgebung (Node 22.22)

366 Zeilen, neue Spalten Einheit, Hinweis in der App und abgeleitete Werte, drei Einträge aus USDA SR28 (D-361).

| Nachweis | Ergebnis |
|---|---|
| `python3 tools/lebensmittel_auswahl.py --check` | 366 Einträge geprüft, ohne Befund |
| Gegenproben (je eine Änderung an einer Kopie der Zeilen): Regel nicht angewandt (Feta), Regel falsch angewandt (Honig, Margarine), Wert steht im BLS (Ei), Herkunft ohne Einheit (Apfel), unbekannte Einheit (Semmel), Hinweis ohne Einheit (Brokkoli), falsche USDA-Nummer (Magermilch), falsche USDA-Bezeichnung (Pfefferoni), falsches Format (Kokosöl) | 10 von 10 gemeldet |
| `pnpm check:docs` | ohne Befund |

### Ernährung §6: Einbau der Grundauswahl · 25.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1243)

361 Lebensmittel nachgeladen und offline, Suche beim Tippen, Menge in g oder Stück, Stückgewicht einmal angeben und gemerkt, Quelle je Eintrag, Lizenzliste (D-362, AK-NUT-17 bis AK-NUT-19). Bericht: `form-ernaehrung-report.md` Abschnitt 9.

| Nachweis | Ergebnis |
|---|---|
| `basicFoods.test.ts`, `pieces.test.ts`, `pieceWeightService.test.ts` (neu) | 22, 5 und 6 bestanden |
| `foodSearch.test.ts`, `nutrition-ui.test.tsx`, `app.test.tsx` | 20, 19 und 26 bestanden (1, 3 und 1 neu) |
| Gegenprobe: Tipp-Tests gegen die Suche vor §6 | 2 von 2 fehlgeschlagen |
| Gegenprobe: Fokus-Prüfung ohne Fokus-Logik | 1 von 19 fehlgeschlagen |
| `pnpm test` | 122 Dateien, 1064 Tests bestanden |
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | ohne Befund |
| `pnpm build`, `pnpm check:bundle` | Startansicht 234,5 KB von 250 KB; Grundauswahl als eigener Teil 47,3 KB (gzip 14,8 KB), vorab gespeichert |
| E2E `basic-foods.spec.ts` (neu), Chromium Desktop und Pixel 7 | 8 bestanden, darin axe für den Dialog ohne Verstoß (erster Lauf 2 fehlgeschlagen am Selektor im Test, behoben) |
| E2E, ganze Suite (Chromium), Stand vor der Fokus-Verbesserung | 333 bestanden, 51 übersprungen, 0 fehlgeschlagen |
| E2E mit dem Endstand: `basic-foods`, `nutrition`, `nutrition-ring`, `shopping`, `network-a11y` | 97 bestanden, 3 übersprungen, 0 fehlgeschlagen |
| WebKit, CI-Lauf 40170203278 zu `c117ec8` | rot: „Stückgewicht einmal angeben“ in webkit-desktop und webkit-mobile an `toBeFocused()` („Received: inactive“); 319 bestanden, 62 übersprungen, 1 wackelnd (Tab-Leiste, 2067 statt 2000 ms, nicht von §6) |
| Nachtrag: Komponententest mit der Reihenfolge von WebKit (Klick, danach Fokus aufs Optionsfeld) | mit dem verzögerten Fokus bestanden, Gegenprobe mit sofortigem Fokus fehlgeschlagen |
| Nachtrag: `pnpm test`; E2E `basic-foods.spec.ts` (Chromium) | 122 Dateien, 1065 Tests bestanden; 8 bestanden |
| Nachtrag: WebKit, CI-Lauf 40171590098 zu `9c851b1` | alle vier Jobs grün; „E2E (webkit)“ 322 bestanden, 62 übersprungen, 0 fehlgeschlagen |

### Ernährung, Abschluss §1: „Weitere Nährwerte“ kompakt · 25.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1243)

Je Zeile Name und „Ist / Referenz g“, einzeilig; Sternchen bei fehlenden Werten; Erklärung, Quellen und Einträge ohne Angabe im Info-Blatt (D-363, AK-NUT-15). Bericht: `form-ernaehrung-report.md` Abschnitt 11.

| Nachweis | Ergebnis |
|---|---|
| `de-nutrition.test.ts`, `nutrition-ui.test.tsx` | 5 und 20 bestanden |
| Gegenprobe: die zwei neu gefassten Komponententests gegen die alte Liste | 2 von 2 fehlgeschlagen |
| `pnpm test` | 122 Dateien, 1064 Tests bestanden |
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | ohne Befund |
| `pnpm build`, `pnpm check:bundle` | Startansicht 234,6 KB von 250 KB |
| E2E „Weitere Nährwerte: jede Zeile einzeilig“ bei 320, 360 und 390 pt (Pixel 7) | 3 bestanden (erster Lauf 3 fehlgeschlagen am erwarteten Text im Test, behoben) |
| E2E `narrow-layout`, `nutrition`, `basic-foods`, `nutrition-ring`, `network-a11y` mit dem Endstand | 103 bestanden, 11 übersprungen, 0 fehlgeschlagen |
| E2E, ganze Suite (Chromium), Stand vor dem Hinweis unter den Makros | 336 bestanden, 54 übersprungen, 0 fehlgeschlagen |

### Ernährung, Abschluss §2: Nährwerttabelle einzeilig · 25.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1243)

Köpfe und Werte einzeilig in festen Spalten, zweite Spalte nur bei einer Menge ungleich 100 g (D-364, AK-NUT-08). Bericht: `form-ernaehrung-report.md` Abschnitt 12.

| Nachweis | Ergebnis |
|---|---|
| `nutrition-ui.test.tsx`, `de-nutrition.test.ts` | 22 und 6 bestanden (2 und 1 neu) |
| Gegenprobe: die zwei neuen Komponententests gegen die alte Tabelle | 2 von 2 fehlgeschlagen |
| `pnpm test` | 122 Dateien, 1067 Tests bestanden |
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | ohne Befund |
| `pnpm build`, `pnpm check:bundle` | Startansicht 234,6 KB von 250 KB |
| E2E „Nährwerttabelle: Köpfe und Werte einzeilig …“ bei 360 und 390 pt (Pixel 7) | 2 bestanden |
| E2E `narrow-layout`, `nutrition`, `basic-foods`, `nutrition-ring`, `network-a11y` | 105 bestanden, 13 übersprungen, 0 fehlgeschlagen |

### Ernährung, Abschluss §3: Stückgewichte als Richtwerte · 25.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1243)

47 Richtwerte aus europäischen Quellen, „1 Stück · ca. … g“ vorgewählt, Plus und Minus in halben Stück, „Gewicht anpassen“ gemerkt und zurücksetzbar, ohne Richtwert nur Gramm (D-365, AK-NUT-18). Bericht: `form-ernaehrung-report.md` Abschnitt 13.

| Nachweis | Ergebnis |
|---|---|
| `nutrition-ui.test.tsx`, `basicFoods.test.ts`, `pieces.test.ts`, `pieceWeightService.test.ts`, `app.test.tsx` | 23, 22, 6, 6 und 26 bestanden |
| Gegenprobe: neue Dialog-Tests gegen den alten Dialog | 3 von 4 fehlgeschlagen (der vierte prüft nur Gramm und besteht mit der neuen Liste auch dort) |
| Gegenprobe: Listenprüfung mit acht absichtlichen Fehlern | 8 von 8 gemeldet |
| `pnpm test` | 122 Dateien, 1069 Tests bestanden |
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | ohne Befund |
| `pnpm build`, `pnpm check:bundle` | Startansicht 234,6 KB von 250 KB |
| E2E `basic-foods`, `narrow-layout`, `nutrition`, `nutrition-ring`, `network-a11y` | 109 bestanden, 15 übersprungen, 0 fehlgeschlagen |
| Gegenprobe: Abstandstest gegen die Tabelle aus D-364 | bei 360 pt fehlgeschlagen |

### Ernährung, Abschluss §4: Quellenangabe des BLS · 25.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1243)

Ohne eigenen Wortlaut bleibt die Zitierweise mit DOI; Zahl und Prozentzeichen in der Quellenzeile brechen nicht um (D-366). Bericht: `form-ernaehrung-report.md` Abschnitt 14.

| Nachweis | Ergebnis |
|---|---|
| `de-nutrition.test.ts` | 7 bestanden (1 neu) |
| `pnpm test` | 122 Dateien, 1070 Tests bestanden |
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | ohne Befund |
| `pnpm build`, `pnpm check:bundle` | Startansicht 234,5 KB von 250 KB |
| E2E `basic-foods`, `narrow-layout` | 29 bestanden, 13 übersprungen, 0 fehlgeschlagen |

### Ernährung, Abschluss §5: Nachweise und Bilder · 25.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1243)

Jeder Prüfpunkt des Auftrags mit Nachweis, fünf neue Bilder, Übersicht und Zip neu (D-367). Bericht: `form-ernaehrung-report.md` Abschnitt 15.

| Nachweis | Ergebnis |
|---|---|
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | ohne Befund |
| `pnpm test` | 122 Dateien, 1070 Tests bestanden |
| `pnpm build`, `pnpm check:bundle` | Startansicht 234,5 KB von 250 KB |
| E2E, ganze Suite (Chromium Desktop und Pixel 7), mit den neuen Prüfungen für Banane und „Parad“ | 344 bestanden, 58 übersprungen, 0 fehlgeschlagen |
| WebKit, CI-Lauf 40181118538 zu `b866a1f` (Abschnitt 1 und 2) | alle vier Jobs grün |
| WebKit, CI-Lauf 40183657652 zu `88de135` (Abschnitt 3 und 4) | alle vier Jobs grün; „E2E (webkit)“ 331 bestanden, 69 übersprungen, 0 fehlgeschlagen, nichts wackelnd. Die neuen E2E-Prüfungen dieses Abschnitts (Banane, „Parad“) laufen in der CI zum Abschluss-Commit nach dem Push |

### Ernährung: Richtwerte nach der Freigabe · 25.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1243)

Avocado 145 g nach DTU 2013 (Sorte Hass); „Datteln, Medjool“ ohne europäische Quelle nicht aufgenommen (D-368). Bericht: `form-ernaehrung-report.md` Abschnitt 16.

| Nachweis | Ergebnis |
|---|---|
| `python3 tools/lebensmittel_auswahl.py --check` nach `--build` | 366 Einträge geprüft, Datei der App aktuell |
| `basicFoods.test.ts`, `app.test.tsx` | 22 und 26 bestanden |
| `pnpm test` | 122 Dateien, 1070 Tests bestanden |
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | ohne Befund |
| `pnpm build`, `pnpm check:bundle` | Startansicht 234,6 KB von 250 KB |
| E2E `basic-foods`, `narrow-layout`, `nutrition` (Chromium) | 43 bestanden, 13 übersprungen, 0 fehlgeschlagen |

### Ernährung: Referenz für Zucker und gesättigte Fettsäuren aus dem Tagesziel · 25.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1243)

Zucker und gesättigte Fettsäuren höchstens 10 % der Kalorien aus dem Tagesziel (4 bzw. 9 kcal je g), ohne Ziel 50 und 22 g (D-369, AK-NUT-15). Bericht: `form-ernaehrung-report.md` Abschnitt 17.

| Nachweis | Ergebnis |
|---|---|
| `references.test.ts`, `nutrition-ui.test.tsx`, `de-nutrition.test.ts` | 8, 24 und 7 bestanden |
| Gegenprobe: neue und geänderte Tests gegen den alten Stand | 5 von 5 fehlgeschlagen |
| `pnpm test` | 122 Dateien, 1073 Tests bestanden |
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | ohne Befund |
| `pnpm build`, `pnpm check:bundle` | Startansicht 234,6 KB von 250 KB |
| E2E `nutrition`, `basic-foods`, `narrow-layout`, `nutrition-ring`, `network-a11y` (Chromium) | 111 bestanden, 15 übersprungen, 0 fehlgeschlagen |

### Phase iPhone Duo: Gerätemaße und Prüfmaße · 25.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1243)

Recherche der Maße zugeklappt und aufgeklappt, Prüfmaße als Annahmen (D-371). Bericht: `form-duo-report.md` Abschnitt 2.

| Nachweis | Ergebnis |
|---|---|
| Apple, Human Interface Guidelines „Designing for iPhone Duo“ | direkt gelesen; Leisten und Statusleiste an der Seite, Kamera in der Ecke |
| WebKit, Safari 27.1; technische Daten von Apple | nur über Suchergebnisse, weil die Netzwerkregel `apple.com`, `support.apple.com` und `webkit.org` sperrt |
| Chromium 153: `Emulation.setSafeAreaInsetsOverride` | `env(safe-area-inset-right)` meldet den gesetzten Wert (59 px gesetzt, 59 px gemessen) |

### Phase iPhone Duo: Systemrand an der Seite · 25.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1243)

Tab-Leiste, Blätter, Rückfragen, Hinweise, große Pause, Anmeldung und „Meine Küche“ beachten den sicheren Bereich links und rechts (D-372). Bericht: `form-duo-report.md` Abschnitt 3.1.

| Nachweis | Ergebnis |
|---|---|
| `e2e/duo-safe-area.spec.ts` (Chromium, Handy-Profil, Prüfmaße zugeklappt und aufgeklappt) | 3 bestanden |
| Gegenprobe: dieselben Tests gegen den alten Quellstand | 3 von 3 fehlgeschlagen („Mehr“ bis 446 statt höchstens 382,5; Kreis bis 939 statt höchstens 867,5; „Schließen“ im Scanner bis 458 statt höchstens 382,5) |
| `pnpm test` | 122 Dateien, 1073 Tests bestanden |
| `pnpm lint`, `pnpm typecheck`, `pnpm format:check` | ohne Befund |
| `pnpm build`, `pnpm check:bundle` | Startansicht 234,8 KB von 250 KB |
| `pnpm test:e2e` (Chromium, alle Dateien) | 347 bestanden, 61 übersprungen, 0 fehlgeschlagen, 8,9 min |

### Phase iPhone Duo: Tab-Leiste misst nach jeder Größenänderung neu · 25.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1243)

Auswahl folgt jeder Größenänderung der Einträge, die Linse misst bei jeder Berührung neu (D-373, Audit E-15). Bericht: `form-duo-report.md` Abschnitt 3.2.

| Nachweis | Ergebnis |
|---|---|
| `e2e/duo-tabbar.spec.ts` (Chromium, Handy-Profil) | 2 bestanden; dazu `e2e/tabbar.spec.ts` 3 bestanden |
| Gegenprobe: dieselben Tests gegen den alten Quellstand | 2 von 2 fehlgeschlagen (Auswahl 69,2 px neben dem Tab; Ziehen zu „Fortschritt“ endete auf `/mehr`) |
| `pnpm lint`, `pnpm typecheck`, `pnpm format:check` | ohne Befund |
| `pnpm build`, `pnpm check:bundle` | Startansicht 234,9 KB von 250 KB |
| `pnpm test:e2e` (Chromium, alle Dateien) | 349 bestanden, 63 übersprungen, 0 fehlgeschlagen, 8,7 min |

### Phase iPhone Duo: Barcode-Scanner, Bild, Rahmen und Erkennung · 25.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1243)

Erkennung nur im sichtbaren Ausschnitt um den Rahmen, Kamerabild höchstens 45 % der Fensterhöhe (D-374). Bericht: `form-duo-report.md` Abschnitt 3.3.

| Nachweis | Ergebnis |
|---|---|
| `scanRegion.test.ts` | 8 bestanden |
| `e2e/duo-scanner.spec.ts`, `duo-scanner-mitte.spec.ts`, `duo-scanner-lage.spec.ts` (Chromium, Standbild als Kamera) | 5 bestanden; dazu `barcode.spec.ts` und `barcode-camera.spec.ts` bestanden |
| Gegenprobe: dieselben Tests gegen den alten Quellstand | 2 von 5 fehlgeschlagen (unsichtbarer Code erkannt; quer Unterkante 561,7 statt höchstens 368); die 3 Gegenkontrollen „Code im Rahmen“ bestanden |
| `pnpm test` | 123 Dateien, 1081 Tests bestanden |
| `pnpm lint`, `pnpm typecheck`, `pnpm format:check` | ohne Befund |
| `pnpm build`, `pnpm check:bundle` | Startansicht 234,9 KB von 250 KB |
| `pnpm test:e2e` (Chromium, alle Dateien) | 354 bestanden, 71 übersprungen, 3 fehlgeschlagen, 8,5 min; alle drei in `e2e/duo-resize.spec.ts`, dem Test des nächsten Pakets (Leseposition beim Auf- und Zuklappen), an diesem Stand erwartet rot |
| CI, WebKit (Läufe 40228596744 und 40229890511) | 10 fehlgeschlagen, alle fünf Scanner-Tests je Profil: WebKit startete nicht („Unknown option --use-fake-device-for-media-stream“), weil die Kamera-Optionen von Chromium für alle Browser galten und der Browser vor dem `test.skip` der Datei startet. Nachtrag: `e2e/scanner.ts` setzt die Optionen und die Kamera-Erlaubnis nur in Chromium, sonst bleiben die des Projekts |

### Phase iPhone Duo: Auf- und Zuklappen, Leseposition · 25.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1243)

Im Training bleibt beim Größenwechsel alles erhalten; die Leseposition bleibt auf allen Seiten (D-375). Bericht: `form-duo-report.md` Abschnitt 3.4.

| Nachweis | Ergebnis |
|---|---|
| `e2e/duo-resize.spec.ts` (Chromium, Handy-Profil), dreimal wiederholt | 9 bestanden |
| Gegenprobe: dieselben Tests gegen den alten Quellstand | 2 von 3 fehlgeschlagen (Leseposition 182,4 und 192,7 px daneben); der Trainingstest bestand schon dort |
| `pnpm test` | 123 Dateien, 1081 Tests bestanden |
| `pnpm lint`, `pnpm typecheck`, `pnpm format:check` | ohne Befund |
| `pnpm build`, `pnpm check:bundle` | Startansicht 235,4 KB von 250 KB (zusammen mit dem nächsten Paket gebaut) |
| `pnpm test:e2e` (Chromium, alle Dateien, zusammen mit dem nächsten Paket gebaut) | 358 bestanden, 72 übersprungen, 0 fehlgeschlagen, 8,7 min |

### Phase iPhone Duo: Linse endet beim Loslassen außerhalb der Leiste · 25.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1243)

Während eines Drucks hört die Linse auch am Fenster auf das Loslassen (D-376). Bericht: `form-duo-report.md` Abschnitt 3.5.

| Nachweis | Ergebnis |
|---|---|
| `e2e/duo-tabbar.spec.ts`, `e2e/tabbar.spec.ts` (Chromium, Handy-Profil), dreimal wiederholt | alle bestanden |
| Gegenprobe: neuer Test gegen den alten Quellstand | fehlgeschlagen (Linse blieb aktiv) |
| `pnpm test` | 123 Dateien, 1081 Tests bestanden |
| `pnpm lint`, `pnpm typecheck`, `pnpm format:check` | ohne Befund |
| `pnpm build`, `pnpm check:bundle` | Startansicht 235,4 KB von 250 KB |
| `pnpm test:e2e` (Chromium, alle Dateien) | 358 bestanden, 72 übersprungen, 0 fehlgeschlagen, 8,7 min |

### Phase iPhone Duo: Weitere Funde der Prüfung in drei Breiten · 25.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1243)

Kopf im Training, Mahlzeit-Auswahl, „Meine Küche“, Namen der Zeilen nach WCAG 2.5.3, Minus und Plus der Pause, Wochentage 11 px (D-377). Bericht: `form-duo-report.md` Abschnitt 3.6.

| Nachweis | Ergebnis |
|---|---|
| `e2e/duo-funde.spec.ts` (Handy-Profil; der Kopf nur in Chromium) | 6 bestanden |
| Gegenprobe: dieselben Tests gegen den alten Quellstand | 6 von 6 fehlgeschlagen (Kopf endete bei 402 statt am Rand 466; Auswahl 57,75 px bei 640 px; „Rezepte“ verdeckt; axe `label-content-name-mismatch`; Wochentage 10 px; Minus-Symbol 0 px) |
| `src/shared/ui/name-rest.test.tsx`; Namen und Beschreibungen in `habits-ui.test.tsx`, `task-stats.test.tsx`, `nutrition-ui.test.tsx` | bestanden |
| Zwischenstände vor dem Commit | 10 E2E-Fehlschläge in `tasks`, `task-rows` und `marks`: Chromium trennt den versteckten Namensteil mit einem Leerzeichen ab („Lesen : Auswertung öffnen“), und ein versteckter Teil in abgeschnittenem Text machte die Seite bei 320 pt 77 px breiter. Danach 2 in `barcode.spec.ts` (Test erwartete den alten Namen „Skyr Natur, Spar“). Alle behoben, siehe D-377 |
| `pnpm test` | 124 Dateien, 1085 Tests bestanden |
| `pnpm lint`, `pnpm typecheck`, `pnpm format:check` | ohne Befund |
| `pnpm build`, `pnpm check:bundle` | Startansicht 235,5 KB von 250 KB |
| `pnpm test:e2e` (Chromium, alle Dateien) | 364 bestanden, 78 übersprungen, 0 fehlgeschlagen, 8,2 min |
| CI, Lauf 40236345703 (`dd4d35b`, mit dem Nachtrag zu D-374) | alle vier Jobs grün; WebKit 344 bestanden, 98 übersprungen, 13,1 min; die Scanner-Tests werden in WebKit übersprungen |

### Phase iPhone Duo: Satzzeile, lange Werte · 25.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1243)

„102,5“ passt zugeklappt und auf 375 bis 390 pt ins Feld (D-378). Bericht: `form-duo-report.md` Abschnitt 3.7.

| Nachweis | Ergebnis |
|---|---|
| `e2e/duo-funde.spec.ts` „Satzzeile: „102,5“ passt ins Feld …“ (390 pt und zugeklappt: passt; 382 pt: Schrift 16 px. Ob der Wert bei 382 pt ganz passt, hängt an der Schriftart: mit Inter 7,7 px Luft, mit der breiteren DejaVu Sans gerechnet knapp nicht, deshalb prüft der Test dort nur die Schrift) | bestanden |
| Gegenprobe: derselbe Test gegen den alten Quellstand | fehlgeschlagen (Wert 10 px über dem Rand bei 390 pt) |
| Messung (Chromium): Platz im Feld minus Breite von „102,5“ | mit Inter: zugeklappt +17,7 px, 382 pt +7,7, 390 pt +11,7, 375 pt +4,7, 360 pt −3,3 (Feld 45 px), 320 pt: Feld 25 px; mit DejaVu Sans: zugeklappt +9,4, 390 pt +3,4, 382 pt −0,6, 375 pt −3,6; vorher zugeklappt 57 px Feld für 59 px Wert |
| `pnpm test` | 124 Dateien, 1085 Tests bestanden |
| `pnpm lint`, `pnpm typecheck`, `pnpm format:check` | ohne Befund |
| `pnpm build`, `pnpm check:bundle` | Startansicht 235,5 KB von 250 KB |
| `pnpm test:e2e` (Chromium, alle Dateien) | 365 bestanden, 79 übersprungen, 0 fehlgeschlagen, 8,4 min |

### Phase iPhone Duo: Prüfung aller Screens in drei Breiten · 25.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1243)

28 Ansichten in den Prüfmaßen zugeklappt, Zwischenmaß und aufgeklappt, mit Testdaten (D-379). Bericht: `form-duo-report.md` Abschnitt 4. Browser-Fenster, nicht das Gerät.

| Nachweis | Ergebnis |
|---|---|
| `node tools/duo-screens.mjs`, erster Lauf (vor D-377) | 84 Ansichten: 16 × axe `label-content-name-mismatch`, 27 × Schrift unter 11 px, 7 Hinweise Tippfläche |
| `node tools/duo-screens.mjs` nach D-377 und D-378, 3 min | 84 Ansichten: 3 × Schrift unter 11 px (Tageszahl im Kalender, bewusst nach D-334), 7 Hinweise Tippfläche (Wochentag-Chips, 44 pt über unsichtbaren Rand); kein Überlauf, nichts unter dem Systemrand, keine Überlagerung, kein abgeschnittener Text, kein gestauchtes Symbol, keine axe-Verstöße |
| Messung für die Bewertung (Training mit Pause) | Player aufgeklappt: Kopf 264 pt, Fußleiste 97 pt, 284 pt für Übung und Sätze, eine Satzzeile ganz sichtbar, Felder 298 pt breit; zugeklappt: 274, 111, 269 pt, eine Satzzeile; Zwischenmaß: 542 pt, fünf Satzzeilen. Ernährung: erste Mahlzeit bei 619 von 669 pt (aufgeklappt) und 639 von 678 pt (zugeklappt) |

### Phase iPhone Duo, Phase 2: Workout-Player für beide Zustände · 26.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1243)

Aufgeklappt zwei Spalten, zugeklappt die Pause in einer Zeile, Satzzeile unter 20 rem mit zweiter Zeile (D-380). Bericht: `form-duo-report.md` Abschnitt 9.1. Browser-Fenster, nicht das Gerät.

| Nachweis | Ergebnis |
|---|---|
| `e2e/duo-player.spec.ts` (3 Tests, Handy-Profil) | 3 bestanden |
| Gegenprobe: dieselben Tests gegen den alten Quellstand | 3 von 3 fehlgeschlagen („Als Nächstes“ fehlt; Pause 142 px hoch statt höchstens 80; Vorwert bei 360 pt in derselben Zeile wie die Felder) |
| Gegenprobe: ohne Nachrücken des Satzes nach einer Größenänderung (`useStableSetView`) | fehlgeschlagen („unter dem Kopf“: der aufgeklappt nach oben gescrollte Satz lag nach dem Zuklappen hinter dem Kopf) |
| Gegenprobe: nächster Satz in der einzeiligen Pause in einer Textzeile (erster Entwurf) | fehlgeschlagen (Text 19,6 px hoch; zu sehen war nur „Beinpress…“) |
| Angepasst: `e2e/duo-resize.spec.ts` (aufgeklappt rückt der Satz um die Höhe des Kopfs nach oben und bleibt sichtbar), Test zu D-377 in `e2e/duo-funde.spec.ts` (±15 s bei 320 × 800, weil die Pause bei 320 × 640 einzeilig ist) | bestanden |
| Zwischenstände vor dem Commit | 3 Unit-Tests in `player-ui.test.tsx` (die Liste der Überschriften enthielt „Als Nächstes“; jetzt ein benannter Bereich ohne Überschrift); `pnpm lint` (`type` statt `interface` im Test); E2E: Test zu D-377 (einzeilige Pause bei 320 × 640) und `duo-resize` (Satz aufgeklappt nicht mehr an derselben Stelle). Alle behoben, siehe oben |
| Messung (Chromium, Training mit Pause, Seite ganz oben) | aufgeklappt: Kopf rechts, 572 pt für Übung und Sätze (vorher 284), fünf Satzzeilen ganz sichtbar (vorher eine), Felder 118 pt (vorher 298); zugeklappt: Kopf 192 pt (vorher 274), 351 pt (vorher 269), zwei Satzzeilen (vorher eine); Zwischenmaß unverändert (Kopf 264 pt, 542 pt, fünf Satzzeilen); 320 × 568: Kopf 192 pt, Felder 52 px (vorher 25) |
| Messung einzeilige Pause (Chromium): Breite des Players, nächster Satz | zugeklappt 362 px, Karte 60 px hoch, Text 86 px breit in zwei Zeilen; Safari zugeklappt (382 × 640) 342 px und 375 × 667 335 px: nur für Screenreader; zugeklappt quer (594 × 368) 490 px, Text 214 px; iPhone 15 quer (844 × 390) 750 px, Text 474 px |
| Messung Satzzeile (Chromium, Vorwert „102,5 × 10“) | zweite Zeile unter 384 pt Fensterbreite (Zeile unter 20 rem), Feld für kg: 383 pt 84 px, 382 pt 83 px, 375 pt 80 px, 360 pt 72 px, 320 pt 52 px; eine Zeile ab 384 pt: 384 pt 57 px, 390 pt 60 px, 393 pt 62 px, 414 pt 72 px, 430 pt 80 px |
| `pnpm test` | 124 Dateien, 1085 Tests bestanden |
| `pnpm lint`, `pnpm typecheck`, `pnpm format:check` | ohne Befund |
| `pnpm build`, `pnpm check:bundle` | Startansicht 235,6 KB von 250 KB (vorher 235,5); `player-layout.css` wird mit dem Player nachgeladen |
| `pnpm test:e2e` (Chromium, alle Dateien) | erster Lauf: 368 bestanden, 82 übersprungen, 0 fehlgeschlagen, 13,0 min; nach der zweiten Textzeile in der Pause: 368 bestanden, 82 übersprungen, 0 fehlgeschlagen, 13,7 min |

### Phase iPhone Duo, Phase 2: Nachtrag zu D-380 nach der CI · 26.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1243)

Einzeilige Pause auch am iPhone in Safari; Satz bleibt beim Auf- und Zuklappen sofort an seiner Stelle (D-380, Nachtrag). Bericht: `form-duo-report.md` Abschnitt 9.1.

| Nachweis | Ergebnis |
|---|---|
| CI, Lauf 40283966090 (`f27979f`, Paket 1) | „E2E (chromium)“ grün; „E2E (webkit)“ 3 fehlgeschlagen, 345 bestanden, 102 übersprungen: `session.spec.ts` und `resilience.spec.ts` (warteten auf „15 s weniger“ in der kleinen Pause, die im Profil iPhone 15 mit 393 × 659 einzeilig ist), `duo-player.spec.ts` Test 1 bei „hoch“ (Kopf über der Liste, geprüft nach dem Scrollen an den Anfang, das die App beim Größenwechsel wieder ausglich) |
| `e2e/duo-resize.spec.ts` Training, 6 Wiederholungen am Stand von `f27979f` | 2 von 6 fehlgeschlagen („zu: Position“, 72 px): Der Kopf wird beim Wechsel 72 px höher oder niedriger, ausgeglichen erst beim nächsten Takt der Pause |
| Ablauf Bild für Bild (Chromium, Skript): Lage des Satzes nach dem Wechsel zugeklappt → Zwischenmaß → zugeklappt | vorher 0, dann −85 px (Verankerung des Browsers, nachgeholter sicherer Bereich, Zeigen des Satzes mit offenem Menü); jetzt 0 und 0 px |
| Gegenprobe: neue Prüfung in `duo-player.spec.ts` Test 2 (Lage des Satzes im ersten Bild nach dem Wechsel zugeklappt → Zwischenmaß) gegen den Stand von `f27979f` | fehlgeschlagen („erstes Bild nach dem Wechsel“: 72 px statt höchstens 4) |
| `duo-player.spec.ts`, `duo-resize.spec.ts`, `duo-funde.spec.ts` (Chromium, Handy-Profil), je 5 Wiederholungen mit dem Endstand der Korrektur | 62 bestanden, 3 fehlgeschlagen: alle drei in „Meine Küche aufgeklappt“ (Paket 2, dort behoben); Player und Auf- und Zuklappen 30 von 30 |
| Zwischenstand der Korrektur | Ein ResizeObserver auf den Kopf allein reichte nicht: Er beobachtete die Inhaltsbox (der sichere Bereich ändert nur den Innenabstand), und ein Scroll-Ereignis im selben Bild merkte die verschobene Lage als neue Lage. Jetzt Außenkante, und in einem Bild mit geänderter Kopfhöhe gleicht der ResizeObserver aus |
| Angepasste Tests im Fenster des iPhone 15 (393 × 659, in Chromium nachgestellt): `session`, `resilience`, `duo-player`, `duo-resize`, `training-scroll`, `duo-funde`, `duo-nutrition` | 20 bestanden |
| Ganze Suite im Fenster des iPhone 15 (393 × 659, in Chromium nachgestellt, 7,8 min) | 204 bestanden, 22 übersprungen, 1 fehlgeschlagen: `nutrition.spec.ts` „Meine Küche“ wählt Handy oder Desktop nach dem Namen des Projekts, das Hilfsprojekt hieß nicht „…-mobile“; mit passendem Namen bestanden |
| `pnpm test` | 124 Dateien, 1085 Tests bestanden |
| `pnpm lint`, `pnpm typecheck`, `pnpm format:check` | ohne Befund |
| `pnpm test:e2e` (Chromium, alle Dateien, zusammen mit Paket 2) | 370 bestanden, 84 übersprungen, 0 fehlgeschlagen, 13,6 min |

### Phase iPhone Duo, Phase 2: Ernährung aufgeklappt zweispaltig · 26.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1243)

Links Ring, Makros und weitere Nährwerte, rechts Mahlzeiten und Wasser (D-381). Bericht: `form-duo-report.md` Abschnitt 9.2. Browser-Fenster, nicht das Gerät.

| Nachweis | Ergebnis |
|---|---|
| `e2e/duo-nutrition.spec.ts` (2 Tests, Handy-Profil) | 2 bestanden |
| Gegenprobe: Test 1 gegen die Seite ohne zweispaltiges Layout | fehlgeschlagen (eine Spalte: Frühstück beginnt links bei 24 pt statt rechts neben der Ringkarte ab 867 pt) |
| Gegenprobe: Test 2 („Meine Küche“ unten in der linken Spalte) gegen das Menü ohne Öffnen nach oben, 3 Wiederholungen | 3 von 3 fehlgeschlagen („Vorlagen“ verdeckt) |
| Zwischenstände vor dem Commit | Test zu D-377 „Meine Küche aufgeklappt“ in 3 von 5 Wiederholungen fehlgeschlagen („Vorlagen“ verdeckt): Das Menü öffnete nach unten, die Seite reichte vor dem Laden des Wassers nicht weit genug. Behoben, siehe D-381 |
| Wiederholung: `duo-nutrition`, `duo-funde`, `nutrition` (Chromium, Handy-Profil), je 4-mal | 60 bestanden |
| Messung (Chromium, Tagesziel, zwei Schnelleinträge, Wasser, Seite ganz oben) | aufgeklappt (951 × 669, 52,7 rem Inhalt): Ringkarte links 410 pt breit, Mahlzeiten rechts 410 pt, Frühstück beginnt bei 194 pt (vorher 619); iPad hoch (820 × 1180, 48,3 rem): zwei Spalten je 374 pt, Frühstück bei 218 pt; Desktop 1280 × 800: zwei Spalten je 552 pt; zugeklappt (22,6 rem) und Zwischenmaß (39,3 rem): eine Spalte wie bisher |
| `pnpm test` | 124 Dateien, 1085 Tests bestanden |
| `pnpm lint`, `pnpm typecheck`, `pnpm format:check` | ohne Befund |
| `pnpm build`, `pnpm check:bundle` | Startansicht 235,7 KB von 250 KB; `nutrition-layout.css` wird mit der Seite nachgeladen (`NutritionPage-*.css`) |
| `pnpm test:e2e` (Chromium, alle Dateien, zusammen mit dem Nachtrag zu D-380) | 370 bestanden, 84 übersprungen, 0 fehlgeschlagen, 13,6 min |

### Phase iPhone Duo, Phase 2: Fortschritt, Erklärung der Kalorien unter den Kacheln · 26.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1243)

Vier gleich hohe Kacheln, die Zahlen auf einer Linie, die Erklärung darunter (D-382). Bericht: `form-duo-report.md` Abschnitt 9.3. Browser-Fenster, nicht das Gerät.

| Nachweis | Ergebnis |
|---|---|
| `e2e/duo-progress.spec.ts` (Handy-Profil; zugeklappt, Zwischenmaß, aufgeklappt) | bestanden |
| Gegenprobe: derselbe Test gegen den alten Quellstand | fehlgeschlagen („zu“: Höhenunterschied der Kacheln 155 px statt höchstens 1) |
| `progress-ui.test.tsx` (Hinweis unter den Kacheln, nicht in der Kachel) | bestanden |
| Messung (Chromium, ein Training mit Körpergewicht): Höhe der vier Kacheln und Unterkante der Kacheln | zugeklappt vorher 86, 86, 242, 242 px (Unterkante 533), jetzt 4 × 103 px (412), Erklärung darunter in drei Zeilen; Zwischenmaß vorher 86, 86, 158, 158 (473), jetzt 4 × 86 (402); aufgeklappt vorher 4 × 208 (401), jetzt 4 × 103 (297); 320 × 568 vorher 86, 86, 242, 242, jetzt 4 × 103 |
| `pnpm test` | 124 Dateien, 1085 Tests bestanden |
| `pnpm lint`, `pnpm typecheck`, `pnpm format:check` | ohne Befund (ein Zwischenstand: Lint meldete eine vorübergehende Hilfsdatei für Playwright im Wurzelordner; sie liegt nicht im Repository) |
| `pnpm build`, `pnpm check:bundle` | Startansicht 235,7 KB von 250 KB |
| `pnpm test:e2e` (Chromium, alle Dateien) | 371 bestanden, 85 übersprungen, 0 fehlgeschlagen, 14,3 min |

### Phase iPhone Duo, Phase 2: Abschluss, Bilder in drei Breiten · 26.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1243)

Bilder erneuert, nächster Satz in der rechten Spalte des Players bis zu vier Zeilen, Liste für den Gerätetest ergänzt, Abschlussbericht (D-383). Bericht: `form-duo-report.md` Abschnitte 4.4, 6, 9 und 10. Browser-Fenster, nicht das Gerät.

| Nachweis | Ergebnis |
|---|---|
| `node tools/duo-screens.mjs`, erster Lauf nach Paket 3 (4 min) | 84 Ansichten: 3 × Schrift unter 11 px (Tageszahl im Kalender, bewusst nach D-334), 7 Hinweise Tippfläche (Wochentag-Chips); kein Überlauf, nichts unter dem Systemrand, keine Überlagerung, kein abgeschnittener Text, kein gestauchtes Symbol, axe ohne Verstöße. Beim Ansehen der Bilder: In der rechten Spalte des Players stand vom nächsten Satz nur „Beinpresse,…“ |
| `node tools/duo-screens.mjs` nach der Korrektur | 84 Ansichten, dieselben Befunde; Bilder zusammen 3,4 MB |
| Rechte Spalte (Chromium, aufgeklappt, Pause läuft) | „Nächster Satz: Beinpresse, Arbeitssatz 2 · Ziel 8–12“ ganz zu sehen, in vier Zeilen |
| Geänderte Bilder gegenüber Phase 1 | Player zugeklappt und aufgeklappt, „Training verwerfen“ aufgeklappt, Ernährung und „Meine Küche“ aufgeklappt, Fortschritt in drei Breiten; dazu „Heute“, Wasser, Wasser-Verlauf und Tab-Leiste, weil diesmal beide Wasser-Tipps der Testdaten ankamen (750 statt 250 ml), und ein einzelnes Pixel im Scanner aufgeklappt |
| CI, Lauf 40292622372 (`a94434a`, Paket 2 mit dem Nachtrag zu D-380) | alle vier Jobs grün; WebKit 350 bestanden, 104 übersprungen |
| CI, Lauf 40295195644 (`3a80d2e`, Paket 3) | alle vier Jobs grün; Chromium 371 bestanden, 85 übersprungen; WebKit 351 bestanden, 105 übersprungen |
| `pnpm test` | 124 Dateien, 1085 Tests bestanden |
| `pnpm lint`, `pnpm typecheck`, `pnpm format:check` | ohne Befund |
| `pnpm build`, `pnpm check:bundle` | Startansicht 235,7 KB von 250 KB |
| `pnpm test:e2e` (Chromium, alle Dateien) | 371 bestanden, 85 übersprungen, 0 fehlgeschlagen, 14,6 min |

### Phase iPhone Duo, Phase 2: Nachtrag zu D-382 nach der CI · 26.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1243)

Der Test zum Fortschritt prüft die Lage des Hinweises, nicht seinen Wortlaut (D-382, Nachtrag).

| Nachweis | Ergebnis |
|---|---|
| CI, Lauf 40298724340 (`ffa8fa6`, Abschluss) | alle vier Jobs grün; Chromium 370 bestanden, 85 übersprungen, 1 erst im zweiten Anlauf: `duo-progress.spec.ts` („zu“: „Schätzung nach MET“ nicht gefunden); WebKit 351 bestanden, 105 übersprungen |
| Ursache | Das Test-Training dauerte unter einer Sekunde; mit der Dauer 0 gibt es keine Schätzung (`estimateCalories`), unter den Kacheln stand „Kalorien werden erst mit Körpergewicht geschätzt.“ |
| Nachgestellt (Chromium): Körpergewicht erst nach dem Training, also ohne Schätzung | alte Fassung des Tests fehlgeschlagen, mit derselben Meldung wie in der CI; neue Fassung bestanden |
| `e2e/duo-progress.spec.ts`, neue Fassung, mit Schätzung | bestanden |
| `pnpm lint`, `pnpm format:check` | ohne Befund |

### Korrekturen nach dem Gerätetest: Feste Leisten kleben am unteren Rand · 26.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1243)

Die Seite scrollt in einem eigenen Rahmen, Tab-Leiste, Kreis, Fußleiste im Training und Hinweise liegen außerhalb (D-384). Der Fehler zeigte sich nur am iPhone Duo; im Browser ist er nicht nachstellbar. Geprüft wird deshalb der Aufbau, der ihn ausschließt, und die Lage der Leisten beim Scrollen. Browser-Fenster, nicht das Gerät.

| Nachweis | Ergebnis |
|---|---|
| Vorfahren der Leisten (Chromium, zugeklappt und aufgeklappt): `transform`, `translate`, `rotate`, `scale`, `perspective`, `filter`, `backdrop-filter`, `will-change`, `contain`, `container-type`, `content-visibility`, `transform-style`, `offset-path` | keiner bildet einen eigenen Bezugsrahmen, auch am alten Stand nicht; Gegenprobe im Test: `will-change: transform` an `.app-shell` und `container-type` an `body` werden gefunden |
| Messung (Chromium, zugeklappt 466 × 678 mit sicherem Bereich unten 34, „Übungen“, acht Schritte mit dem Mausrad) | Fenster bleibt bei 0, der Rahmen scrollt bis 2400 px; Unterkante der Leiste 636, als Kreis 632, rechte Kante 382 (Rand des sicheren Bereichs), in jedem Schritt gleich |
| `e2e/duo-feste-leisten.spec.ts` (4 Tests, Handy-Profil) | bestanden |
| Gegenprobe: derselbe Test gegen den alten Stand (`aec96f4`, neu gebaut) | 4 von 4 fehlgeschlagen („außerhalb des scrollenden Rahmens“: Die Seite scrollte im Fenster). Die Bewegung selbst zeigt Chromium auch am alten Stand nicht |
| Angepasst auf den Rahmen: `duo-player`, `duo-resize`, `duo-safe-area`, `duo-tabbar`, `header-logo`, `marks`, `program-list`, `shopping`, `tabbar`, `training-scroll`; `tools/duo-screens.mjs`, `tools/screenshots.mjs` | bestanden (in der ganzen Suite) |
| `pnpm test` | 124 Dateien, 1085 Tests bestanden; vorher in `app.test.tsx` 13 Zeitüberschreitungen, weil jsdom `scrollTo` an Elementen nicht kennt: Ergänzung in `src/test-setup.ts` |
| `pnpm lint`, `pnpm typecheck`, `pnpm format:check`, `pnpm check:docs` | ohne Befund |
| `pnpm build`, `pnpm check:bundle` | Startansicht 236,4 KB von 250 KB |
| `pnpm test:e2e` (Chromium, alle Dateien) | 375 bestanden, 89 übersprungen, 0 fehlgeschlagen, 12,3 min |
| WebKit | läuft in der CI (GitHub Actions) |

### Korrekturen nach dem Gerätetest: Scanner ohne eigene Drehung, Neustart der Kamera · 26.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1243)

Keine eigene Drehung im Scanner gefunden; bei einer neuen Haltung startet die Kamera neu (D-385). Ob das Bild am Duo aufrecht steht, zeigt nur das Gerät. Browser-Fenster mit künstlicher Kamera (Standbild 640 × 480), nicht das Gerät.

| Nachweis | Ergebnis |
|---|---|
| Durchsicht `ScannerDialog.tsx`, `scanRegion.ts`, `barcodeDetector.ts`, CSS der App | keine Drehung am Video oder an seinen Vorfahren, keine Abfrage von `screen.orientation`, `window.orientation` oder des Seitenverhältnisses; `getUserMedia` nur mit `facingMode: environment`; Erkennungsbereich aus `videoWidth` und `videoHeight` (D-374) |
| `calc/scanRegion.test.ts` (11 Tests, davon 3 neu für `cameraPostureChanged`) | bestanden |
| `e2e/duo-scanner-neustart.spec.ts` (zugeklappt, Zwischenmaß, aufgeklappt, zugeklappt quer, zurück; kleine Änderung) | bestanden: nach jedem Wechsel ein neuer Kamerastrom (2, 3, 4, 5 Starts), 640 × 480 wie geliefert, keine Drehung; bei 466 × 640 kein Neustart |
| Gegenprobe: derselbe Test am Stand vor der Änderung (Build zu `001b2a0`) | fehlgeschlagen („hoch: Kamera neu gestartet“, 1 statt 2 Starts) |
| `duo-scanner`, `duo-scanner-mitte`, `duo-scanner-lage` | bestanden |
| `pnpm test` | 124 Dateien, 1088 Tests bestanden |
| `pnpm lint`, `pnpm typecheck`, `pnpm format:check`, `pnpm check:docs` | ohne Befund |
| `pnpm build`, `pnpm check:bundle` | Startansicht 236,3 KB von 250 KB |
| `pnpm test:e2e` (Chromium, alle Dateien) | 376 bestanden, 90 übersprungen, 0 fehlgeschlagen, 11,4 min |
| WebKit | läuft in der CI (GitHub Actions) |

### Korrekturen nach dem Gerätetest: Nachtrag zu D-384 nach der CI · 26.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1243)

CI-Lauf 40350698760 zu `001b2a0` (D-384): Datenbank, Lint, Typen, Unit-Tests, Dokumente und Build grün; E2E Chromium grün; E2E WebKit rot.

| Nachweis | Ergebnis |
|---|---|
| WebKit, `duo-feste-leisten.spec.ts` (3 von 4 Tests) | fehlgeschlagen: „Mouse wheel is not supported in mobile WebKit“; jetzt Scrollen per Skript |
| WebKit, `shopping.spec.ts` „Wisch nach links löscht nur diesen Artikel …“ | fehlgeschlagen in beiden Anläufen: „„Milch“ gelöscht“ nicht gefunden; in Chromium bestanden. Ursache offen, der Test schreibt jetzt die Zeiger-Ereignisse in die Meldung |
| WebKit, `duo-resize.spec.ts` „Training: Satz, Werte, Pause …“ | im ersten Anlauf fehlgeschlagen („zu: Position“, 53 statt höchstens 4 px), im zweiten bestanden; die Meldung nennt jetzt Scrollposition und Höhe des Kopfs |
| Überlauf-Prüfungen am Dokument (11 Stellen in 10 Dateien) | seit dem Rahmen immer 0; Messung im Browser: ein 600 px breites Element bei 390 px, am Dokument 0, am Rahmen 230 px. Jetzt `pageOverflowX` (Rahmen und Dokument) |
| Geänderte Tests in Chromium (`duo-feste-leisten`, `shopping`, `duo-resize` und die zehn Dateien mit Überlauf-Prüfung) | 139 bestanden |

### Korrekturen nach dem Gerätetest: Nachtrag 2 zu D-384 nach der CI · 26.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1243)

CI-Lauf 40355441729 zu `932c3bc` (Nachtrag zu D-384): Datenbank, Lint, Typen, Unit-Tests, Dokumente und Build grün; E2E Chromium grün; E2E WebKit 354 bestanden, 111 übersprungen, 1 fehlgeschlagen.

| Nachweis | Ergebnis |
|---|---|
| WebKit, Handy-Profil (iPhone 15), `shopping.spec.ts` „Wisch nach links löscht nur diesen Artikel …“ | fehlgeschlagen in beiden Anläufen, am Desktop bestanden. Mitschrift wörtlich, erster Anlauf: „pointermove mouse Zeile x276 scroll 0/0 \| pointermove mouse Zeile x276 scroll 0/0 \| pointermove mouse Zeile x260 scroll 0/0“; zweiter Anlauf: „pointermove mouse Zeile x276 scroll 0/183 \| pointerdown mouse Zeile x276 scroll 0/183 \| pointermove mouse Zeile x260 scroll 0/183“. Nach dem Schritt, in dem die Zeile den Zeiger fing, kam nichts mehr an, auch kein Loslassen |
| WebKit, `duo-resize.spec.ts` „Training: Satz, Werte, Pause …“ | bestanden |
| Änderung | Die Zeile verfolgt die Geste am Fenster, ohne den Zeiger zu fangen; die Mitschrift nennt jetzt auch Maus-Ereignisse, gedrückte Tasten und Zeigerfang. Ob WebKit besteht, zeigt der nächste Lauf |
| Unit-Test „folgt dem Zeiger auch neben der Zeile, ohne ihn zu fangen“ (`shopping-ui.test.tsx`) | bestanden; Gegenprobe mit der alten Fassung von `SwipeToDelete`: fehlgeschlagen |
| Tastatur am Desktop, Gegenprobe (Chromium, „Übungen“, Fokus auf `body`) | Bild ab mit Weiterleitung an den Rahmen 630 px, ohne sie 0 px |
| `ScrollManager.test.tsx` (2 Tests, neu): Tasten scrollen den Rahmen; Felder, Kürzel, andere Tasten und offene Dialoge bleiben unberührt | bestanden |
| `e2e/rahmen-tastatur.spec.ts` (Desktop): Bild ab, Pfeil, Ende, Pos1, Leertaste; Fenster bleibt oben; im Suchfeld schreibt die Leertaste | bestanden |
| `shopping`, `rahmen-tastatur`, `duo-feste-leisten` (Chromium) | 14 bestanden, 6 übersprungen |
| `pnpm test` | 125 Dateien, 1091 Tests bestanden |
| `pnpm lint`, `pnpm typecheck`, `pnpm format:check`, `pnpm check:docs` | ohne Befund |
| `pnpm build`, `pnpm check:bundle` | Startansicht 236,6 KB von 250 KB |
| WebKit | läuft in der CI (GitHub Actions) |

### Korrekturen nach dem Gerätetest: Nachtrag 3 zu D-384 nach der CI · 26.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1243)

CI-Lauf 40360962751 zu `fc78543` (Nachtrag 2 zu D-384): Datenbank, Lint, Typen, Unit-Tests, Dokumente und Build grün; E2E Chromium 377 bestanden, 91 übersprungen; E2E WebKit 354 bestanden, 112 übersprungen, 2 fehlgeschlagen.

| Nachweis | Ergebnis |
|---|---|
| WebKit, Handy-Profil, `shopping.spec.ts` „Wisch nach links …“ | fehlgeschlagen in beiden Anläufen. Mitschrift wörtlich: „pointermove Zeile x276 b0 \| mousemove Zeile x276 b0 \| pointerdown Zeile x276 b1 \| mousedown Zeile x276 b1 \| pointermove Zeile x260 b1 \| mousemove Zeile x260 b1 \| dragstart Zeile x276 b0“. WebKit begann ein Ziehen des Browsers; danach kam nichts mehr. Jetzt ist Ziehen in der Zeile aus |
| Unit-Test „lässt in der Zeile kein Ziehen des Browsers zu“ (`shopping-ui.test.tsx`) | bestanden; Gegenprobe mit der Fassung aus `fc78543`: fehlgeschlagen |
| WebKit, Handy-Profil, `duo-resize.spec.ts` „Training: Satz, Werte, Pause …“ | fehlgeschlagen in beiden Anläufen: „hoch: Position (Scroll 190, Kopf 264.1875)“, 51,59 statt höchstens 4 px |
| Nachgestellt in Chromium wie in WebKit (Profil iPhone 15, ohne sicheren Bereich; einmal ohne Scroll-Verankerung) | Satz bleibt an seiner Stelle; ohne Verankerung gleicht der Player die Verschiebung von 39 px binnen 50 ms aus. Ursache in WebKit nicht nachstellbar |
| Neuer Test „Scrollt die Seite kurz nach dem Größenwechsel noch, steht der Satz wieder an seiner Stelle“ (60 px, 150 ms danach) | bestanden; Gegenprobe ohne das Festhalten: fehlgeschlagen (60 px daneben) |
| `duo-resize.spec.ts` (Handy-Profil) dreimal hintereinander | 3 von 3 bestanden (je 4 Tests) |
| `duo-resize`, `shopping`, `duo-player`, `training-scroll`, `session`, `session-head`, `notes`, `duo-feste-leisten` (Chromium) | 31 bestanden, 15 übersprungen |
| `pnpm test` | 125 Dateien, 1092 Tests bestanden |
| `pnpm lint`, `pnpm typecheck`, `pnpm format:check`, `pnpm check:docs` | ohne Befund |
| `pnpm build`, `pnpm check:bundle` | Startansicht 236,6 KB von 250 KB |
| WebKit | läuft in der CI (GitHub Actions) |

### Korrekturen nach dem Gerätetest: Muskel-Etiketten in der Titelzeile · 26.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1243)

Etiketten neben dem Namen, sonst in eigener Zeile darunter, nie über „Erstes Mal“ (D-386). Browser-Fenster, nicht das Gerät.

| Nachweis | Ergebnis |
|---|---|
| `e2e/duo-etiketten.spec.ts` (zugeklappt, Zwischenmaß, aufgeklappt, 390 × 844, 320 × 640) | bestanden |
| Gegenprobe: derselbe Test gegen den alten Stand | fehlgeschlagen („auf: Etiketten in der Titelzeile“, 0 statt mindestens 1); Überlappung zeigte Chromium auch am alten Stand nicht, nur das Gerät |
| Bilder (Chromium): zugeklappt „Kniebeuge mit Langhantel“ mit „Oberschenkel vorne“ und „Gesäß“ in eigener Zeile; aufgeklappt „Bankdrücken mit Langhantel“ mit „Brust“ in einer Zeile vor (i) und „…“ | angesehen |
| `duo-etiketten`, `duo-player`, `session`, `session-head`, `training-scroll`, `notes`, `duo-feste-leisten`, `duo-resize` (Chromium) | 23 bestanden, 15 übersprungen |
| `pnpm test` | 125 Dateien, 1092 Tests bestanden |
| `pnpm lint`, `pnpm typecheck`, `pnpm format:check`, `pnpm check:docs` | ohne Befund |
| `pnpm build`, `pnpm check:bundle` | Startansicht 236,6 KB von 250 KB |
| WebKit | läuft in der CI (GitHub Actions) |

### Korrekturen nach dem Gerätetest: Nachtrag 4 zu D-384 nach der CI · 26.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1243)

CI-Lauf 40366596552 zu `439269a` (Nachtrag 3 zu D-384): alle vier Jobs grün. E2E Chromium bestanden; E2E WebKit 355 bestanden, 113 übersprungen, 2 erst im zweiten Anlauf („flaky“). Danach CI-Lauf 40370315333 zu `c7946a0` (D-386): Chromium grün, WebKit rot (siehe Tabelle).

| Nachweis | Ergebnis |
|---|---|
| WebKit, Handy-Profil, `shopping.spec.ts` „Wisch nach links …“ | bestanden |
| CI-Lauf 40370315333 zu `c7946a0` (D-386), WebKit | 356 bestanden, 114 übersprungen; fehlgeschlagen in beiden Anläufen der neue Test „Scrollt die Seite kurz nach dem Größenwechsel noch …“ (51,78 statt höchstens 4 px; im Lauf davor bestanden); „Training: Satz, Werte, Pause …“ erst im zweiten Anlauf (erster: „hoch: Position“, 8,2 px; Verlauf „resize 255: s304 r301 k264 \| bild 255 \| bild 639 \| bild 669“, alle s304 r301, zwischen zwei Bildern 384 ms) |
| WebKit, `duo-resize.spec.ts` „Training: Satz, Werte, Pause …“, erster Anlauf | fehlgeschlagen: „zu: Position“, 53 statt höchstens 4 px. Verlauf (gekürzt): vorher Seite 138, Satz 482; „resize: s33 r535 k192 \| scroll: s33 r535 \| bild: s85 r483 \| bild: s33 r535“, danach bis zum Ende der Aufzeichnung (rund 360 ms) s33 r535 |
| WebKit, `duo-player.spec.ts` „Player aufgeklappt …“, erster Anlauf | fehlgeschlagen: „unter dem Kopf“ (5 s gewartet) |
| Nachgestellt in Chromium (Profil iPhone 15, ohne sicheren Bereich und ohne Scroll-Verankerung, Aufrufe am Rahmen mitgeschrieben) | beim Zwischenmaß und zurück nur je ein `scrollBy` des Players (±39 px), kein Aufruf des ScrollManagers; der Satz steht danach an seiner Stelle |
| `src/shared/ui/pageScroll.test.ts` (2 Tests, neu) | bestanden |
| Neuer Test „Der Player hält die Lage selbst, solange der aktive Satz zu sehen ist“ (Chromium) | bestanden: Satz zu sehen `overflow-anchor: none`, weit weg gescrollt wieder leer, zurück wieder `none` |
| `duo-resize`, `duo-player` (Chromium, Handy-Profil) | 8 bestanden |
| `training-scroll`, `session`, `session-head`, `notes`, `duo-feste-leisten`, `shopping`, `rahmen-tastatur`, `duo-etiketten`, `header-logo`, `program-list`, `tabbar`, `duo-resize`, `duo-player` (Chromium) | 53 bestanden, 27 übersprungen |
| `pnpm test` | 126 Dateien, 1094 Tests bestanden |
| `pnpm lint`, `pnpm typecheck`, `pnpm format:check`, `pnpm check:docs` | ohne Befund |
| `pnpm build`, `pnpm check:bundle` | Startansicht 236,7 KB von 250 KB |
| WebKit | läuft in der CI (GitHub Actions) |

### Korrekturen nach dem Gerätetest: Nachtrag 5 zu D-384 nach der CI · 26.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1243)

CI-Lauf 40373060505 zu `2c2435c` (Nachtrag 4 zu D-384): Datenbank, Lint, Typen, Unit-Tests, Dokumente, Build und E2E Chromium grün; E2E WebKit 357 bestanden, 115 übersprungen, 2 fehlgeschlagen.

| Nachweis | Ergebnis |
|---|---|
| WebKit, `duo-resize.spec.ts` „Training: Satz, Werte, Pause …“ und „Scrollt die Seite kurz nach dem Größenwechsel noch …“ | bestanden, im ersten Anlauf |
| WebKit, `duo-player.spec.ts` „Player aufgeklappt …“ | fehlgeschlagen in beiden Anläufen: „Satz 4 sichtbar“ (5 s gewartet); vorher an dieser Stelle bestanden |
| WebKit, `duo-resize.spec.ts` „Der Player hält die Lage selbst …“ | fehlgeschlagen in beiden Anläufen: „wieder zu sehen“, `overflow-anchor` leer statt `none`; der Test nahm an, dass der Satz ganz oben zu sehen ist |
| Änderung | Scroll-Verankerung nur noch aus, solange die App die Lage selbst nachführt (Festhalten nach dem Größenwechsel, Zurückgehen); der Test zum Halten und Freigeben entfällt |
| `src/shared/ui/pageScroll.test.ts` (2 Tests) | bestanden |
| `ScrollManager.test.tsx` „Leseposition beim Größenwechsel“ (2 Tests, neu) | bestanden; Gegenprobe ohne die Abfrage `ownPositionHeld`: „lässt die Lage der Seite, die sie selbst hält“ fehlgeschlagen |
| `duo-resize`, `duo-player`, `training-scroll`, `session`, `session-head`, `notes`, `duo-feste-leisten`, `shopping`, `rahmen-tastatur`, `duo-etiketten`, `header-logo`, `program-list`, `tabbar` (Chromium) | 52 bestanden, 26 übersprungen |
| `pnpm test` | 126 Dateien, 1096 Tests bestanden |
| `pnpm lint`, `pnpm typecheck`, `pnpm format:check`, `pnpm check:docs` | ohne Befund |
| `pnpm build`, `pnpm check:bundle` | Startansicht 236,6 KB von 250 KB |
| WebKit | läuft in der CI (GitHub Actions) |

### Korrekturen nach dem Gerätetest: Nachtrag 6 zu D-384 nach der CI · 26.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1243)

CI-Lauf 40376784316 zu `f140453` (Nachtrag 5 zu D-384): alle Jobs außer E2E WebKit grün; E2E WebKit 356 bestanden, 114 übersprungen, 1 fehlgeschlagen, 1 erst im zweiten Anlauf.

| Nachweis | Ergebnis |
|---|---|
| WebKit, `duo-player.spec.ts` „Player aufgeklappt …“ | fehlgeschlagen in beiden Anläufen: „Satz 4 sichtbar“ |
| WebKit, `duo-resize.spec.ts` „Training: Satz, Werte, Pause …“, erster Anlauf | fehlgeschlagen: „hoch: Position“, 8,2 px. Mitschrift wörtlich (gekürzt): „overflow-anchor ja; scrollBy {"top":39.21875,"behavior":"instant"} In@…/index-BO \< @…/SessionPag \| scrollTo {"top":304.21875,"behavior":"instant"} Ln@…/index-BO \< c@…/index-BOf \| resize 175: s304 r301 k264“; zweiter Anlauf bestanden |
| Änderung | Sichtbarkeit des aktiven Satzes ohne den Abstand von 12 px gemessen; `duo-player.spec.ts` schreibt Größenwechsel, Scrollen und Aufrufe am Rahmen in seine Meldung (`e2e/scroll-log.ts`) |
| `duo-resize`, `duo-player`, `training-scroll`, `session`, `session-head`, `notes`, `duo-feste-leisten`, `shopping`, `duo-etiketten` (Chromium) | 32 bestanden, 16 übersprungen |
| `pnpm test` | 126 Dateien, 1096 Tests bestanden |
| `pnpm lint`, `pnpm typecheck`, `pnpm format:check`, `pnpm check:docs` | ohne Befund |
| `pnpm build`, `pnpm check:bundle` | Startansicht 236,6 KB von 250 KB |
| WebKit | läuft in der CI (GitHub Actions) |

### Korrekturen nach dem Gerätetest: Nachtrag 7 zu D-384 nach der CI · 26.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1243)

CI-Lauf 40380283870 zu `fcc1828` (Nachtrag 6 zu D-384): alle Jobs außer E2E WebKit grün; E2E WebKit 354 bestanden, 114 übersprungen, 2 fehlgeschlagen, 2 erst im zweiten Anlauf, Laufzeit 19,1 min (sonst rund 12,5).

| Nachweis | Ergebnis |
|---|---|
| WebKit, `duo-player.spec.ts` „Player aufgeklappt …“, erster Anlauf | fehlgeschlagen: „unter dem Kopf“, 25-mal „s704 r54 k192“; Mitschrift: „scrollBy 4729: {"top":260.5625} … SessionPag \| scrollTo 4786: {"top":704.375} … index \| resize 4787: 466×678“ |
| WebKit, derselbe Test, zweiter Anlauf | fehlgeschlagen: „Satz 4 sichtbar (Satz 497 bis 605, Fußleiste ab 605; scrollBy 4552: {"top":25.078125,"behavior":"smooth"} … \| scroll 4578: s24 \| scrollBy 4581: {"top":-24,"behavior":"instant"} … \| scroll 4625: s0)“ |
| WebKit, `start-surface.spec.ts` „Startfläche beim schnellen Start …“ | fehlgeschlagen in beiden Anläufen: 1303 bzw. 1281 statt unter 1190 bzw. 1163 ms; in allen Läufen davor bestanden |
| WebKit, `duo-player.spec.ts` „Pause zugeklappt …“ und `duo-tabbar.spec.ts` „Tipp beim Aufgehen …“ | je im ersten Anlauf fehlgeschlagen (51,78 px im ersten Bild; Linse 128,7 statt über 306,2), im zweiten bestanden |
| Änderung | Ausgleich für die Höhe des Kopfs nur, wenn er über der Liste steht; schiebt die neue Anordnung einen sichtbaren Satz hinter den Kopf oder unter die Fußleiste, zeigt der Player ihn sofort ganz |
| `duo-resize`, `duo-player`, `training-scroll`, `session`, `session-head`, `notes`, `duo-feste-leisten`, `duo-etiketten` (Chromium) | 23 bestanden, 15 übersprungen; `duo-player` und `duo-resize` (Handy-Profil) zweimal wiederholt: 7 von 7 und 7 von 7 |
| Gegenprobe | in Chromium nicht nachstellbar (dort kommt der Größenwechsel vor der neuen Darstellung, und das sanfte Zeigen endet vor der neuen Höhe des Kopfs); geprüft wird in WebKit in der CI |
| `pnpm test` | 126 Dateien, 1096 Tests bestanden |
| `pnpm lint`, `pnpm typecheck`, `pnpm format:check`, `pnpm check:docs` | ohne Befund |
| `pnpm build`, `pnpm check:bundle` | Startansicht 236,7 KB von 250 KB |
| WebKit | läuft in der CI (GitHub Actions) |

### Korrekturen nach dem Gerätetest: Nachtrag 8 zu D-384 nach der CI · 26.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1243)

CI-Lauf 40385119596 zu `7ccb640` (Nachtrag 7 zu D-384): alle Jobs außer E2E WebKit grün; E2E WebKit 357 bestanden, 114 übersprungen, 1 fehlgeschlagen.

| Nachweis | Ergebnis |
|---|---|
| WebKit, `duo-player.spec.ts` (alle drei Tests), `start-surface.spec.ts`, `duo-tabbar.spec.ts` | bestanden, im ersten Anlauf |
| WebKit, `duo-resize.spec.ts` „Training: Satz, Werte, Pause …“ | fehlgeschlagen in beiden Anläufen: „hoch: Position“, 51,78 und 15,78 px. Mitschrift erster Anlauf: „scrollBy {"top":39.21875} … SessionPag \| resize 165: s175 r430 k264“, danach alle Bilder s175 r430; zweiter Anlauf: „scrollBy {"top":39.21875} … \| scrollBy {"top":-35.328125} … \| resize 189: s328 r277 k264“ |
| Vergleich mit Lauf 40373060505 (Nachtrag 4, Verankerung aus, solange der Player die Lage hält) | dort bestand dieser Test im ersten Anlauf |
| Änderung | Scroll-Verankerung wieder aus, solange der aktive Satz zu sehen ist; die Mitschrift nennt die Lage direkt nach dem Ausgleich für den Kopf |
| `duo-resize`, `duo-player`, `training-scroll`, `session`, `session-head`, `notes`, `duo-feste-leisten`, `duo-etiketten`, `shopping`, `rahmen-tastatur` (Chromium) | 33 bestanden, 17 übersprungen; `duo-player`, `duo-resize`, `training-scroll` (Handy-Profil) zweimal wiederholt: 8 von 8 und 8 von 8 |
| `pnpm test` | 126 Dateien, 1096 Tests bestanden |
| `pnpm lint`, `pnpm typecheck`, `pnpm format:check`, `pnpm check:docs` | ohne Befund |
| `pnpm build`, `pnpm check:bundle` | Startansicht 236,7 KB von 250 KB |
| WebKit | läuft in der CI (GitHub Actions) |

### Korrekturen nach dem Gerätetest: Knöpfe der Karte „Ernährung heute“ · 26.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1243)

Aufgeklappt Knöpfe mittig im freien Raum unter den Makros (D-387). Browser-Fenster, nicht das Gerät.

| Nachweis | Ergebnis |
|---|---|
| `e2e/duo-heute-ernaehrung.spec.ts` | bestanden: aufgeklappt Karte und Wasser-Karte nebeneinander und gleich hoch, Knöpfe vertikal und horizontal mittig (je höchstens 1 px); zugeklappt 16 px unter den Makros, unten ohne Lücke |
| Gegenprobe: derselbe Test gegen den alten Stand | fehlgeschlagen („vertikal mittig“, 51,9 px) |
| `shopping.spec.ts` „„Heute“: runde Knöpfe mittig in „Ernährung heute““ | bestanden |
| `duo-heute-ernaehrung`, `shopping`, `nutrition`, `nutrition-ring`, `duo-nutrition`, `water` (Chromium) | 40 bestanden, 6 übersprungen |
| `pnpm test` | 126 Dateien, 1096 Tests bestanden |
| `pnpm lint`, `pnpm typecheck`, `pnpm format:check`, `pnpm check:docs` | ohne Befund |
| `pnpm build`, `pnpm check:bundle` | Startansicht 236,7 KB von 250 KB |
| WebKit | läuft in der CI (GitHub Actions) |

### Korrekturen nach dem Gerätetest: Gerätedaten unter „Über die App“ · 26.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1243)

Zugeklappter Bereich „Gerätedaten“, nachgeladen beim Aufklappen (D-388). Browser-Fenster, nicht das Gerät.

| Nachweis | Ergebnis |
|---|---|
| `settings/calc/deviceData.test.ts` (3 Tests) | bestanden |
| `e2e/duo-geraetedaten.spec.ts` (Chromium mit sicherem Bereich) | bestanden: zugeklappt ohne Werte; 466 × 678, sicherer Bereich 0, 84, 34, 0; nach Aufklappen ohne Neuladen 951 × 669 und 0, 84, 20, 0; Zwischenmaß 669 × 951; beim Aufklappen nur Skripte der App von der eigenen Adresse; axe ohne Verstöße |
| Bild (Chromium, zugeklappt): alle sieben Werte unter „Gerätedaten“, darunter die Tab-Leiste | angesehen |
| Nachgeladen | eigene Datei `DeviceData` 2,69 KB (gzip 1,15 KB), nicht in der Startansicht |
| `duo-geraetedaten`, `shell`, `update`, `network-a11y` (Chromium; `network-a11y` prüft „Über die App“ mit allen Seiten) | 81 bestanden, 9 übersprungen |
| `pnpm test` | 127 Dateien, 1099 Tests bestanden |
| `pnpm lint`, `pnpm typecheck`, `pnpm format:check`, `pnpm check:docs` | ohne Befund |
| `pnpm build`, `pnpm check:bundle` | Startansicht 236,7 KB von 250 KB |
| WebKit | läuft in der CI (GitHub Actions) |

### Korrekturen nach dem Gerätetest: Abschluss, Bilder in drei Breiten · 26.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1243)

Tests je Abschnitt, Bilder erneuert, Bericht mit Ursache oder geprüften Hypothesen je Fehler und Liste für den erneuten Gerätetest (D-389). Bericht: `form-duo-report.md` Abschnitt 11. Browser-Fenster, nicht das Gerät.

| Nachweis | Ergebnis |
|---|---|
| Je Abschnitt ein Test, der am alten Stand fehlschlägt | §1 `duo-feste-leisten` (4 von 4 rot), §2 `duo-scanner-neustart`, §3 `duo-etiketten`, §4 `duo-heute-ernaehrung` (Gegenproben bei D-384 bis D-387); §5 neu: `deviceData.test.ts`, `duo-geraetedaten` |
| Prüfung aus Abschnitt 6: kein Vorfahre der Leisten bildet einen eigenen Bezugsrahmen für `position: fixed` | `duo-feste-leisten.spec.ts`, mit Gegenprobe im Test; bestanden in Chromium und WebKit (CI) |
| `node tools/duo-screens.mjs` | 84 Ansichten, Befunde wie nach D-383: 3 × Schrift unter 11 px, bewusst nach D-334, und 7 Hinweise zu Wochentag-Chips, axe ohne Verstöße; das Werkzeug prüft wieder die ganze Seite statt nur des sichtbaren Teils im Rahmen und wartet, bis die Testdaten fürs Wasser gespeichert sind |
| Geänderte Bilder gegenüber D-383 | Player zugeklappt, im Zwischenmaß und aufgeklappt (Etiketten; im Zwischenmaß bleibt der aktive Satz an seiner Stelle), erster Start aufgeklappt (Knöpfe der Karte „Ernährung heute“), „Training verwerfen“ aufgeklappt und im Zwischenmaß (hinter dem Dialog die Etiketten; aufgeklappt steht die Seite dahinter weiter unten); in den übrigen 71 Bildern 2 bis 2 597 abweichende Pixel, in Stichproben ohne sichtbaren Unterschied |
| CI, Lauf 40388811241 (`8b6656e`, Nachtrag 8 zu D-384) | alle vier Jobs grün; Chromium 379 bestanden, 93 übersprungen; WebKit 358 bestanden, 114 übersprungen |
| CI, Lauf 40391095695 (`88b4533`, D-387) | alle vier Jobs grün; Chromium 380 bestanden, 94 übersprungen; WebKit 359 bestanden, 115 übersprungen |
| CI, Lauf 40393360149 (`8bc5a28`, D-388) | alle vier Jobs grün; Chromium 381 bestanden, 95 übersprungen; WebKit 360 bestanden, 116 übersprungen |
| `pnpm test` | 127 Dateien, 1099 Tests bestanden |
| `pnpm lint`, `pnpm typecheck`, `pnpm format:check`, `pnpm check:docs` | ohne Befund |
| `pnpm build`, `pnpm check:bundle` | Startansicht 236,7 KB von 250 KB |
| `pnpm test:e2e` (Chromium, alle Dateien) | 381 bestanden, 95 übersprungen, 0 fehlgeschlagen, 11,1 min |
| WebKit | läuft in der CI (GitHub Actions) |

### Korrekturen nach dem zweiten Gerätetest: Startfläche und Startbilder · 26.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1243)

Startfläche in der Mitte des ganzen Bildschirms, vier Startbilder für das Duo (D-390). Browser-Fenster, nicht das Gerät.

| Nachweis | Ergebnis |
|---|---|
| Nachgemessen in Bild A (Einzelbilder, Maßstab aus der Bildschirmbreite) | Mitte von Logo und Claim zugeklappt 190 statt 233 pt, aufgeklappt quer 433 statt 475,5 pt; Wortmarke zugeklappt 139 pt breit (36 % von 382 pt) |
| Nachgemessen in Bild B und in den Bildern vom ersten Gerätetest | jetzt endet der Inhalt bei 362 pt (382 minus 20 pt Rand), die Tab-Leiste bei 370 pt; vorher endeten Karten und Tab-Leiste bei 382 bis 384 pt, also beim sicheren Bereich von rund 84 pt in einem 466 pt breiten Bereich |
| `node tools/splash.mjs`, dann die 40 bestehenden Bilder aus Git zurück (Chromium schrieb sie bytegleich bis auf Kleinigkeiten neu) | 4 neue Bilder: 1398 × 2034, 2034 × 1398, 2007 × 2853, 2853 × 2007 |
| `node tools/splash.mjs --check` | „Bilder, Vorlage und Startfläche passen zur Regel“ |
| `src/app/splash.test.ts` | 14 Tests bestanden, darunter neu: Duo hoch und quer verlinkt, Regel C3 in 1398 × 2034 und 2853 × 2007, Startfläche ohne sichere Bereiche, Regeln fürs Duo |
| `e2e/start-surface.spec.ts` (Chromium, Handy-Profil; Bildschirm und Bereich der App getrennt eingestellt) | 13 bestanden, darunter die vier neuen: zugeklappt (Bereich 382 und 466 pt) und aufgeklappt quer (867 und 951 pt): Symbol in der Mitte des ganzen Bildschirms, Fläche pixelgleich mit dem Startbild (mittlere Abweichung unter 0,25 von 255) |
| Gegenprobe: dieselben vier Tests mit der Startfläche vor D-390 | 2 fehlgeschlagen („Mitte des Symbols 191“ und „433.5“, wie auf den Bildern), 2 bestanden (Bereich so breit wie der Bildschirm) |
| WebKit | Die vier neuen Tests laufen nur in Chromium: WebKit in Playwright stellt Bildschirm und Fenster nicht getrennt ein |
| `pnpm test:e2e` (Chromium, alle Dateien) | 383 bestanden, 99 übersprungen, 2 fehlgeschlagen: `pwa.spec.ts` erwartete 40 Startbilder (Desktop und Handy); jetzt 44, danach `pwa.spec.ts` 6 bestanden |
| `pnpm test` | 127 Dateien, 1103 Tests bestanden |
| `pnpm lint`, `pnpm typecheck`, `pnpm format:check`, `pnpm check:docs` | ohne Befund |
| `pnpm build`, `pnpm check:bundle` | Startansicht 236,8 KB von 250 KB (`index.html` 5,7 KB); Startbilder nicht vorab gespeichert, wie bisher |
| WebKit | läuft in der CI (GitHub Actions) |

### Korrekturen nach dem zweiten Gerätetest: Tastatur in Formularen · 26.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1243)

Tab-Leiste und Kreis bei offener Tastatur aus, angetipptes Feld im oberen Teil der Seite, Fußleiste im Training über der Tastatur (D-391). Browser-Fenster, nicht das Gerät; die Tastatur ist als um 55 % niedrigeres Fenster nachgestellt.

| Nachweis | Ergebnis |
|---|---|
| Nachgemessen in Bild B | Tastatur samt Leiste darüber 54 % der Höhe; die Tab-Leiste liegt darüber, mitten im Formular |
| Nachgemessen im Player (Chromium, Duo zugeklappt) | Kopf 120 px, mit laufender Pause 192 px; Fußleiste 111 px (mit sicherem Bereich unten), Satzzeile 108 px, Feld 48 px. Mit Pause passen Kopf, Feld, Fußleiste und Tastatur nicht zugleich in 678 px |
| `src/app/keyboard.test.ts`, `src/modules/training/ui/player/useFootClearOfField.test.tsx` | 13 und 6 Tests bestanden |
| `e2e/duo-tastatur.spec.ts` (Chromium, Handy-Profil; zugeklappt, aufgeklappt, iPhone je sieben Formulare) | 21 bestanden |
| Gegenprobe: dieselben 21 Tests mit dem Stand vor D-391 | 21 von 21 fehlgeschlagen. 16 an der Sache, z. B. „zugeklappt, Was möchtest du einkaufen?: ganz zu sehen (182 bis 230 von 305, darüber <a data-tab=\"/heute\" class=\"tabbar-tab\" …)“, „zugeklappt, Lebensmittel suchen: im oberen Teil (Feld 450 bis 498, oben 80, Linie 271)“, „iPhone, kg im ersten Satz: im oberen Teil (Feld 536 bis 584, oben 80, Linie 341)“; 5 nur an den neuen Klassen `tabbar-dock` und `player-foot` („Tab-Leiste wieder da“ bei „Gewicht erfassen“ in allen Haltungen und aufgeklappt in der Einkaufsliste, „Fußleiste über der Tastatur“ aufgeklappt im Training) |
| Erste Fassung (Fußleiste im niedrigen Fenster beim Tippen immer aus), ganze Suite | 401 bestanden, 120 übersprungen, 5 fehlgeschlagen: vier Tests im Training kamen nicht an „Satz erledigt“ (Zeitüberschreitung beim Klick, das Feld hatte noch den Fokus), `training-scroll.spec.ts` „verdeckt von der Fußleiste“. Danach: Fußleiste nur aus, wenn sie das Feld verdeckte |
| Zweite Fassung, Training (`duo-tastatur`, `duo-player`, `duo-resize`, `training-scroll`) | 26 bestanden, 3 fehlgeschlagen: `training-scroll.spec.ts` (der Kopf als `scroll-padding-top` des Rahmens zählte mit dem `scroll-margin-top` der Satzzeilen doppelt; jetzt eigene Angabe `--tastatur-oben`) und zwei Tests in `duo-resize.spec.ts` (Satz 72,8 px tiefer) |
| Dritte Fassung, dieselben Dateien | 27 bestanden, 2 fehlgeschlagen: `duo-player.spec.ts` „erstes Bild nach dem Wechsel“ (72,8 px) und einmal „Satzzeile unter 20 rem“ (der Dialog „Training beenden?“ meldete den eben erledigten Satz als offen; in drei Wiederholungen danach bestanden) |
| Satz 72,8 px tiefer | Seit dem Antippen steht der Satz direkt unter dem Kopf. Wird der Kopf beim Aufklappen 72 px höher (Pause als Karte), läge er darüber; der Player rückt den Satz 12 px darunter, wie seit D-380. Drei Tests erwarten jetzt: an seiner Stelle, oder 12 px unter dem Kopf, wenn dieser darüber läge |
| `duo-player.spec.ts`, dreimal wiederholt | 9 bestanden |
| `pnpm test:e2e` (Chromium, alle Dateien) | 406 bestanden, 120 übersprungen, 0 fehlgeschlagen, 10,5 min |
| `pnpm test` | 129 Dateien, 1122 Tests bestanden |
| `pnpm lint`, `pnpm typecheck`, `pnpm format:check`, `pnpm check:docs` | ohne Befund |
| `pnpm build`, `pnpm check:bundle` | Startansicht 237,8 KB von 250 KB |
| WebKit | läuft in der CI (GitHub Actions); die neuen Tests laufen dort nur, wenn WebKit einen Touch-Zeiger meldet (`pointer: coarse`), sonst übersprungen |

### Korrekturen nach dem zweiten Gerätetest: Scroll-Balken, Bilder und Abschluss · 26.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1243)

Keine Scroll-Balken am Touch-Gerät, dünne in den Farben der App am Computer (D-392); Bilder erneuert. Browser-Fenster, nicht das Gerät.

| Nachweis | Ergebnis |
|---|---|
| `src/app/scrollbars.test.ts`, `src/shared/ui/tokens.test.ts` | 5 Tests bestanden; Griff `--scrollbar-thumb` auf `--bg`, `--surface`, `--surface-2` und `--panel` mindestens 3:1, hell und dunkel (8 Tests) |
| `e2e/scrollbars.spec.ts` (Chromium, Handy- und Desktop-Profil) | 3 bestanden, 3 übersprungen (je Profil nur die passenden) |
| Gegenprobe: dieselben Tests mit dem Stand vor D-392 | 3 von 3 fehlgeschlagen: Der Rahmen `#seite` hatte `scrollbar-width: auto`, erwartet waren am Computer `thin` und am Touch-Gerät `none` |
| Breite am Computer, gemessen mit sichtbaren Balken (Chromium ohne `--hide-scrollbars`, Übungsliste) | Rahmen 10 px statt 15 px ohne Vorgabe; Griff #6b7482 auf durchsichtiger Spur. Mit dem Handy-Profil 0 px. Playwright blendet Balken in Chromium ohne Fenster sonst aus |
| `node tools/duo-screens.mjs` (84 Ansichten) | 2 Bilder geändert: `dialog-verwerfen-auf.png` (der Inhalt hinter dem Dialog steht 7 px höher, die Einheit stammt aus den Ansichten davor, in denen Felder angetippt wurden) und das Übersichtsbild; `befunde.json` unverändert. Scroll-Balken zeigen die Bilder weder vorher noch nachher: Das Handy-Profil zeichnet keine |
| `pnpm test:e2e` (Chromium, alle Dateien) | 409 bestanden, 123 übersprungen, 0 fehlgeschlagen, 10,6 min |
| `pnpm test` | 130 Dateien, 1135 Tests bestanden |
| `pnpm lint`, `pnpm typecheck`, `pnpm format:check`, `pnpm check:docs` | ohne Befund |
| `pnpm build`, `pnpm check:bundle` | Startansicht 237,9 KB von 250 KB |
| WebKit | läuft in der CI (GitHub Actions); die Tests prüfen dort nur, was die Engine kennt (`scrollbar-width`, `scrollbar-color`, Touch-Zeiger) |

### Nachtrag zu D-391 nach der CI (WebKit) · 26.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1243)

| Nachweis | Ergebnis |
|---|---|
| CI-Lauf 40413276661 (`8a7c7ac`, D-391) | Chromium grün; WebKit 380 bestanden, 145 übersprungen, 1 fehlgeschlagen, auch im zweiten Anlauf: `duo-tastatur.spec.ts` „iPhone: Anmeldung“, Meldung „iPhone, E-Mail: ganz zu sehen (-32 bis 16 von 383, darüber <input id=\"_r_1_-email\" …>)“. Die übrigen 20 neuen Tests liefen in WebKit (es meldet `pointer: coarse`) und bestanden |
| Ursache | WebKit stellt keinen sicheren Bereich nach. Der Abstand über dem Logo der Anmeldung (`max(env(safe-area-inset-top) + … + 4.5rem, 30dvh - 2rem)`) hängt dann nur an der Fensterhöhe und wird mit der Tastatur 140 px kleiner; das Feld rutscht oben aus dem Bild. In Chromium mit nachgestelltem sicherem Bereich schrumpft er weniger, dort blieb das Feld zu sehen |
| Neuer Test in Chromium (Anmeldung am iPhone ohne sicheren Bereich), Stand ohne Korrektur | 1 fehlgeschlagen: „iPhone ohne sicheren Bereich, E-Mail: ganz zu sehen (-32 bis 16 von 383 …)“, wie in der CI; die drei bisherigen Tests zur Anmeldung bestanden |
| Mit `keepFieldVisible` | `keyboard.test.ts` 16 Tests bestanden; `duo-tastatur`, `duo-player`, `duo-resize`, `training-scroll`, `scrollbars` (Handy-Profil) 32 bestanden, 1 übersprungen |
| `pnpm test:e2e` (Chromium, alle Dateien) | 410 bestanden, 124 übersprungen, 0 fehlgeschlagen, 10,1 min |
| `pnpm test` | 130 Dateien, 1138 Tests bestanden |
| `pnpm lint`, `pnpm typecheck`, `pnpm format:check`, `pnpm check:docs` | ohne Befund |
| `pnpm build`, `pnpm check:bundle` | Startansicht 238,0 KB von 250 KB |
| CI zu D-392 (Lauf 40415825999, `17e0fbc`) | Chromium grün; WebKit 381 bestanden, 148 übersprungen, 3 fehlgeschlagen: dieselbe Anmeldung und die beiden Touch-Tests aus `scrollbars.spec.ts` (Nachtrag zu D-392) |

### Nachtrag zu D-392 nach der CI (WebKit) · 26.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1243)

| Nachweis | Ergebnis |
|---|---|
| CI-Lauf 40415825999 (`17e0fbc`, D-392) | Chromium grün; WebKit 381 bestanden, 148 übersprungen, 3 fehlgeschlagen: die Anmeldung aus D-391 (Nachtrag zu D-391) und beide Tests am Touch-Gerät aus `scrollbars.spec.ts` mit „mouse.wheel: Mouse wheel is not supported in mobile WebKit“, auch im zweiten Anlauf. Die Prüfung der Balken davor bestand in WebKit; der Test am Computer bestand |
| `e2e/scrollbars.spec.ts` mit Wischen statt Mausrad (Chromium als Wisch-Geste über `Input.dispatchTouchEvent`, WebKit per Skript), dreimal wiederholt | 9 bestanden, 9 übersprungen (je Profil nur die passenden) |
| `pnpm lint`, `pnpm format:check`, `pnpm check:docs` | ohne Befund |

### Startfläche nach der Messung am Gerät · 27.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1243)

Startfläche in allen vier Haltungen des Duo in der Mitte des ganzen Bildschirms, Gerätedaten erweitert (D-393). Browser-Fenster, nicht das Gerät.

| Nachweis | Ergebnis |
|---|---|
| Nachgemessen im Messbild A (Maßstab aus der Breite der Einzelbilder, 0,904 und 0,896 px je pt) | aufgeklappt hoch: Wortmarke 166 pt breit (36 % von 466 statt von 669 pt), Mitte des Logos 232 pt (Bildschirmmitte 334,5), senkrecht 490 pt, Claim unten 892 pt: passt nur zu einem Fenster 669 × 869 bei 82 pt; aufgeklappt quer: Mitte 433 pt (Bildschirmmitte 475,5), Wortmarke 239 pt breit (36 % von 669 pt), Mitte des Logos senkrecht 315 pt (47 % von 669 pt): Fenster beim Start 867 × 669, ohne Streifen oben |
| `src/app/startLage.test.ts` | 16 Tests bestanden: die vier Haltungen mit den Messwerten (zugeklappt hoch 42, 0 aus `screen.*`; aufgeklappt hoch 0, −41 und quer 42, −41 aus den Maßen des Duo; zugeklappt quer 42, 0, angenommen), der Start quer (867 × 669: 42, 0), Fenster so groß wie das Display, `screen.*` richtig gemeldet, `screen.*` hochkant bei Fenster quer, nie in die Gegenrichtung (5 Fenster mit 5 gemeldeten Bildschirmen), Rückfall ins Fenster (iPhone, geteilter Bildschirm, ohne `screen`, Seite unbekannt, Handy-Profil der Tests), `screenX` zählt nicht, CSS-Variablen beim Laden und nach dem Aufklappen, Ende nach dem Start |
| `src/app/splash.test.ts` | 19 Tests bestanden, neu je Lage (zugeklappt hoch und quer, aufgeklappt hoch und quer, quer beim Start): Startbild dekodiert und gemessen, Startfläche aus den Prozentwerten der `<use>`-Elemente und der Rechnung: Mitte des Logos waagrecht und senkrecht, Breite der Wortmarke, Mitte und Unterkante des Claims auf 1 pt gleich; die Verschiebung der Gerätedaten führt von der Mitte des Fensters zur Mitte des Bildschirms |
| `src/modules/settings/calc/deviceData.test.ts` | 4 Tests bestanden: 13 Zeilen in fester Reihenfolge, zugeklappt hoch „466 × 678, aus screen.*“ und „42, 0“, aufgeklappt hoch „669 × 951, Maße des Duo“ und „0, -41“, quer „951 × 669, Maße des Duo“ und „42, -41“; fehlende Werte „nicht verfügbar“ |
| `e2e/start-surface.spec.ts` (Chromium, Handy-Profil, Bildschirm 466 × 678 gemeldet) | sieben Lagen des Duo bestanden, neu aufgeklappt hoch (669 × 869), aufgeklappt quer mit Streifen oben (867 × 587) und beim Start (867 × 669): Symbol in der Mitte des ganzen Bildschirms, Fläche pixelgleich mit dem Ausschnitt des Startbilds |
| Gegenprobe: dieselben sieben Tests mit dem Stand vor D-393 (`index.html` aus `8e17394`, neu gebaut) | 4 von 7 fehlgeschlagen: Mitte des Symbols 42 pt neben der Bildschirmmitte (zugeklappt quer, aufgeklappt quer mit und ohne Streifen oben) und 101,5 pt (aufgeklappt hoch), wie am Gerät gemessen; 3 bestanden (zugeklappt hoch, Fenster so groß wie der Bildschirm) |
| Erster Lauf nach dem Umbau | `Startfläche: gleich dem Startbild` scheiterte mit „mittlere Abweichung je Kanal 1.5263662161371483“, dreimal gleich: Das Handy-Profil Pixel 7 meldet einen Bildschirm von 412 × 915 bei einem Fenster von 390 × 844, die erste Fassung nahm ihn als plausibel und zeichnete die Grafik dafür. Jetzt zählt der Bildschirm nur mit bekannter Lage des Fensters; danach bestanden |
| `e2e/duo-geraetedaten.spec.ts` (Chromium, Handy-Profil) | bestanden: die neuen Zeilen `screen.*`, `screen.avail*`, `outerWidth`, `screenX / screenY` mit Zahlen; Startfläche zugeklappt „466 × 678“, aufgeklappt quer „951 × 669“ und hoch „669 × 951“, Verschiebung „0, 0“, denn das Fenster ist dort so groß wie das Display |
| `pnpm test:e2e` (Chromium, alle Dateien) | 413 bestanden, 127 übersprungen, 0 fehlgeschlagen, 11,2 min; die Ergänzung in `duo-geraetedaten.spec.ts` danach einzeln bestanden |
| `pnpm test` | 131 Dateien, 1160 Tests bestanden |
| `pnpm lint`, `pnpm typecheck`, `pnpm format:check`, `pnpm check:docs` | ohne Befund |
| `pnpm build`, `pnpm check:bundle` | Startansicht 242,3 KB von 250 KB. Neu zählt `tools/check-bundle-size.mjs` die Skripte im Kopf mit, die es bisher nicht erfasste: `startflaeche.js` 2,6 KB, `theme-init.js` 1,6 KB; ohne sie 238,1 KB. `startflaeche.js` ist vorab gespeichert |
| `node tools/splash.mjs --check` | „Bilder, Vorlage und Startfläche passen zur Regel“; die 44 Startbilder sind unverändert |
| WebKit | läuft in der CI (GitHub Actions); die Lagen des Duo nur in Chromium, wie seit D-390 |

### Startfläche ohne einmalige Messung · 27.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1243)

Die Startfläche misst in jedem Bild, das Logo erscheint erst bei stabilen Werten, Widersprüche zählen nicht, die Gerätedaten zeigen das Protokoll des Starts (D-394). Browser-Fenster, nicht das Gerät.

| Nachweis | Ergebnis |
|---|---|
| Nachgemessen im Bild `duo-startflaeche-wechselnd.png` (Maßstab 640 px für 951 pt) | Start 1 und 3: Mitte des Logos 474,8 pt, senkrecht 314,3 pt, Wortmarke 239,2 pt; Start 4: Mitte 231,8 pt, senkrecht 314,3 pt, Wortmarke 237,8 pt. Streifen rechts (84 pt) auf allen drei Bildern, das Fenster war 867 pt breit. Passt zu einer Grafik von 466 × 669 pt |
| `src/app/startLage.test.ts` | 28 Tests bestanden: Rechnung mit den Messwerten, Widersprüche (466 × 669, 466 × 678, 382 × 678 bei quer; 867 × 669 bei hoch), Rückfälle (iPhone, auch unter der Statusleiste und quer, Handy-Profil der Tests, iPad, geteilter Bildschirm, ohne `screen`), und Bild für Bild mit nachgestellter Seite: vierter Start, zuerst zugeklappt ohne Widerspruch, Widerspruch über 100 ms, Widerspruch bleibt (Logo nach 300 ms ohne Streifen), ohne Bilder (Zeitgeber), Computer, `window.orientation`, Streifen oben kommt nach dem Erscheinen dazu, echtes Zuklappen, Widerspruch nach dem Erscheinen, alle vier Hörer, Ende nach dem Entfernen der Fläche, höchstens 10 s und 20 Änderungen |
| `src/app/splash.test.ts` | 19 Tests bestanden: CSS (Grafik = Fenster plus Streifen, Logo verborgen bei `data-startlage=warten`, 300 ms in CSS und Skript gleich, Claim mit `min(100vw + …, 100vh + …)`), Startbild gegen Fläche in fünf Lagen auf 1 pt |
| `src/modules/settings/calc/deviceData.test.ts` | 6 Tests bestanden: 17 Zeilen in fester Reihenfolge, Protokoll des Starts, Widerspruch, fehlende Werte |
| `e2e/start-surface.spec.ts`, neue Tests (Chromium, Handy-Profil, Fenster 867 × 669, Bildschirm 466 × 678, quer; zuerst 466 × 669 gemeldet), je dreimal wiederholt | 6 bestanden. In jedem mitgeschnittenen Bild mit Logo liegt die Mitte bei 475,5 pt, am Ende pixelgleich mit dem Startbild; erstes Protokoll 466 × 669, erste Änderung 867 × 669, Logo „stabil“ |
| Erster Lauf des Tests mit 120 ms falschen Werten | scheiterte am Test, nicht an der App: Bis das Skript lief, waren seit Beginn der Navigation schon mehr als 120 ms vergangen, die Seite meldete schon die echten Werte. Die Zeit zählt jetzt ab dem ersten Lesen |
| Gegenprobe im Browser mit denselben Werten beim Laden (Bilder mitgeschnitten) | Stand D-393: Grafik 466 × 669, Mitte 233,0 pt, vom ersten Bild an sichtbar, wie beim vierten Start. Stand D-394: 40 Bilder, das erste ohne Logo, danach in jedem Bild 475,5 pt; mit 120 ms falschen Werten 38 Bilder, 9 ohne Logo, danach 475,5 pt |
| `pnpm test:e2e` (Chromium, alle Dateien) | 414 bestanden, 129 übersprungen, 1 fehlgeschlagen, 12,1 min: `duo-resize.spec.ts` „Training: Satz, Werte, Pause, Menü, Notiz und Position bleiben beim Auf- und Zuklappen (D-375)“ mit „zu: Position … Expected: <= 4, Received: 24.1875“. Die Datei danach einzeln fünfmal wiederholt: 20 von 20 bestanden; die Startfläche ist in diesem Test längst entfernt |
| `e2e/duo-geraetedaten.spec.ts` mit den neuen Zeilen, Muster für ein abweichendes Layout gelockert | bestanden |
| `pnpm test` | 131 Dateien, 1174 Tests bestanden |
| `pnpm lint`, `pnpm typecheck`, `pnpm format:check`, `pnpm check:docs` | ohne Befund |
| `pnpm build`, `pnpm check:bundle` | Startansicht 244,7 KB von 250 KB (`startflaeche.js` 4,9 KB, `theme-init.js` 1,6 KB) |
| `node tools/splash.mjs --check` | „Bilder, Vorlage und Startfläche passen zur Regel“; die 44 Startbilder sind unverändert |
| WebKit | läuft in der CI; die Tests mit Ausrichtung über das Chrome-Protokoll nur in Chromium |

### Gerätetest am iPhone Duo bestanden · 27.10.2026, Gerät des Produktinhabers

Nachtrag zur Phase iPhone Duo (D-370 bis D-394), eingetragen in der Phase Übungen (D-395). Getestet vom Produktinhaber am echten Gerät nach dem Merge von PR #52 (`25a3553`).

| Nachweis | Ergebnis |
|---|---|
| Startfläche, zehn Kaltstarts aufgeklappt hoch und aufgeklappt quer | bestanden: jedes Mal mittig |
| Übrige Punkte der Listen für den erneuten Gerätetest (`form-duo-report.md` Abschnitte 12.5, 13.4, 14.4) | bestanden: in Ordnung |

### Platz in der Startansicht · 27.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1243)

Kopf-Skripte beim Bauen verkleinert, Kommentare aus `index.html`, Linse und Kreis der Tab-Leiste nachgeladen (D-396).

| Nachweis | Ergebnis |
|---|---|
| `pnpm build`, `pnpm check:bundle` | Startansicht 237,0 KB von 250 KB (vorher 244,7 KB): `startflaeche.js` 1,7 KB (vorher 4,9), `theme-init.js` 0,8 KB (vorher 1,6), `index.html` 5,4 KB (vorher 5,8); `tabLens` und `tabMinimize` in eigenen nachgeladenen Dateien |
| `tools/check-precache.mjs` mit neuer Prüfung der Prüfsummen | „Vorab gespeichert: 180 von 243 Dateien“, keine Abweichung. Erster Versuch scheiterte am Muster (Einträge mit `revision:null` nicht erkannt), korrigiert. Vor dem Entfernen aus `includeAssets` standen beide Skripte zweimal im Service Worker, mit verschiedenen Prüfsummen |
| `e2e/tabbar.spec.ts`, `duo-tabbar.spec.ts`, `start-surface.spec.ts`, `offline.spec.ts` (Chromium) | 25 bestanden, 23 übersprungen |
| `pnpm test:e2e` (Chromium, alle Dateien) | 415 bestanden, 129 übersprungen, 0 fehlgeschlagen, 15,1 min |
| `pnpm test` | 131 Dateien, 1174 Tests bestanden |
| `pnpm lint`, `pnpm typecheck` | ohne Befund |
| WebKit | läuft in der CI |

### Phase Übungen, Phase 1 · 27.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1243)

Bestandsaufnahme, Gerüst für Visuals mit Rückfall auf das Symbol, Ausführungstexte, Quellenvorschlag (D-397 bis D-399). Browser-Fenster, nicht das Gerät; Visuals in den Tests nur als Testliste über `page.route` bzw. gestubbtes `fetch`.

| Nachweis | Ergebnis |
|---|---|
| `src/modules/exercises/data/media.test.ts` | 15 Tests bestanden: Liste gültig, Zuordnung über die ID aus dem Schlüssel, unbekannter Schlüssel ordnet nichts zu, ungültige Liste und Netzfehler ergeben keine Visuals, neuer Versuch beim nächsten Aufruf, Vorausladen je Datei einmal; Texte: jede Basisübung genau einmal (Text oder offen), nur https und zugelassene Fachseiten, keine zwei gleichen Beschreibungen, Leitplanken, `useGuide` zeigt beim Wechsel nie den Text der vorigen Übung; IDs wie in `tools/exercise_inventory.py` |
| `src/modules/exercises/ui/exercise-visual.test.tsx` | 12 Tests bestanden: Symbol ohne Visual, Bild mit leerem Alternativtext und `loading=lazy`, Ladefehler und fehlende Liste zeigen das Symbol, Wechsel der Übung ohne Bild der vorigen (auch im ersten Bild nach dem Wechsel), Fehler gilt nicht für die nächste Übung, zwei Phasen und bei weniger Bewegung nebeneinander, Video stumm, ohne Autoplay bei weniger Bewegung, Animation mit ruhendem Bild, `onlyWithVisual`, Knopf mit Namen |
| `src/modules/training/ui/player/player-demo.test.tsx` | 2 Tests bestanden: Demonstration folgt der aktuellen Übung (Verschieben), Abhaken mit Pause ändert sie nicht, Vorausladen aktuelle und nächste Übung; ohne Visual Symbol mit Etiketten, Antippen öffnet die Info mit Ausführung und Link zu den Details |
| Angepasste Tests | `player-ui.test.tsx`, `log-ui.test.tsx` (Name im Knopf nicht mehr im ersten `span`, dort steht das Vorschaubild); `custom-exercises-ui.test.tsx` (zuerst Reiter „Ausführung“; mit Coverage wartet der Test bis 15 s auf die nachgeladenen Etiketten, ein Lauf scheiterte vorher nach 5 s) |
| `e2e/uebungen.spec.ts` (Chromium) | 8 bestanden, 2 übersprungen (Desktop-Profil für die Player-Tests): Liste mit Symbol, alle Kacheln 56 × 56; mit Testliste richtiges Bild, 404 zeigt das Symbol; Player zugeklappt kompakt, aufgeklappt groß, „Satz erledigt“ im Bild, Verschieben, Neuladen und Zurück mit richtiger Zuordnung; ohne Visuals Symbol mit Etiketten und Info mit Ausführung; Details mit Quellen und offener Übung |
| `pnpm test:e2e` (Chromium, alle Dateien), erster Lauf | 418 bestanden, 131 übersprungen, 5 fehlgeschlagen: `player.spec.ts` (zweimal, „Hauptmuskeln“ doppelt in der Übungsinfo), `duo-player.spec.ts` (Bereich „Ausführung von Beinpresse“ traf die Suche nach dem Bereich „Beinpresse“), `duo-tastatur.spec.ts` zweimal (lief, während ich parallel einen Einzeltest startete). Behoben: Demonstration in der Übungsinfo nur mit Visual, Bereich heißt „Ausführung der aktuellen Übung“; die vier Dateien danach 35 bestanden, 27 übersprungen |
| `pnpm test:e2e` (Chromium, alle Dateien), zweiter Lauf | 422 bestanden, 131 übersprungen, 1 fehlgeschlagen: `duo-player.spec.ts` „Satzzeile unter 20 rem“ („Training abgeschlossen“ nicht gefunden). Einzeln mit `session.spec.ts` dreimal wiederholt: 9 von 9 bestanden |
| `pnpm test`, `pnpm test:coverage` | 134 Dateien, 1203 Tests bestanden (Coverage zweimal in Folge ohne Befund) |
| `pnpm lint`, `pnpm typecheck`, `pnpm format:check`, `pnpm check:docs` | ohne Befund; `check:docs` prüft neu `uebungen-bestand.md` gegen die Daten |
| `pnpm build`, `pnpm check:bundle` | Startansicht 237,7 KB von 250 KB; „Vorab gespeichert: 188 von 251 Dateien“, Prüfsummen passen; `uebungen/medien.json` vorab gespeichert, Bilder unter `uebungen/medien/` nicht |
| Bilder `node tools/uebungen-screens.mjs` | 14 Ansichten und Übersicht in `docs/screens/uebungen/`, selbst angesehen |
| WebKit | läuft in der CI |
| Nachtrag nach der CI (Lauf 40492306595, Job „Lint, Typen, Unit-Tests“) | `custom-exercises-ui.test.tsx` „legt eine Übung an …“ scheiterte mit „Unable to find role="heading" and name "Brustpresse Technogym"“ nach 10 s; der DOM-Auszug zeigt noch die Bibliothek. Ursache: Die Liste hat jetzt 124 Symbol-Kacheln mit je 5 SVG-Pfaden, Rollen-Abfragen in jsdom mit Coverage dauern damit länger. Neu: Symbol als ein Pfad (gleiches Bild, 496 Elemente weniger in der Liste), Wartezeit dieses Schritts 20 s (Test 40 s). Danach `pnpm test:coverage` 134 Dateien, 1203 Tests bestanden; `uebungen.spec.ts` und `custom-exercises.spec.ts` bestanden |

### Phase Übungen, Nachtrag nach der CI (WebKit) · 27.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1243)

| Nachweis | Ergebnis |
|---|---|
| CI Lauf 40493458163 (`2510894`), E2E WebKit | 390 bestanden, 1 fehlgeschlagen, 2 erst im zweiten Anlauf: `duo-tastatur.spec.ts` „zugeklappt: Eingaben im Training“ (Gewichtsfeld ohne Fokus), `duo-tabbar.spec.ts` (Linse), `program-list.spec.ts` („Importing a module script failed“) |
| Diagnose (`d8f652b`), CI Lauf 40497208432 | Meldung: „Getippt bei 184, 614 auf <button …>; Feld jetzt bei 590, vorher 590; Fokus auf <button …>“: Der Tipp traf den Knopf der Fußleiste, das Feld lag tiefer als in Chromium (471). Außerdem `uebungen.spec.ts` Player rot: In WebKit sieht `page.route` die Anfragen des Service Workers nicht, die Liste kam leer aus seinem Speicher |
| Messung in Chromium gegen `main` (gebaut in eigenem Arbeitsverzeichnis), erster Satz oben | `main`: 471 / 477 / 477 px (466 × 678, 382 × 678, 390 × 664). Mit Vorschaubild als erstem Element der Titelzeile (verworfener Versuch): 496 / 521 / 521. Mit `player-card-thumb` erst ab 30 rem: 471 / 477 / 477 |
| `e2e/uebungen.spec.ts` (ohne Service Worker, neu: schmal kein Vorschaubild in der Karte, erster Satz über der Fußleiste; aufgeklappt sichtbar), dazu `duo-tastatur`, `player`, `duo-player`, `program-list`, `session` (Chromium) | 49 bestanden |
| `vitest run src/modules/training src/modules/exercises` | 244 Tests bestanden |
| `pnpm build`, `pnpm check:bundle` | 237,7 KB von 250 KB |
| Bilder | `node tools/uebungen-screens.mjs` neu, 14 Ansichten und Übersicht |
| CI Lauf 40500435564 (`8879e65`), E2E WebKit | `duo-tastatur.spec.ts` jetzt bestanden. 2 fehlgeschlagen: `program-list.spec.ts` mit „Fetch API cannot load …/uebungen/medien.json due to access control checks“ (Abruf der Liste lief noch beim Seitenwechsel), `uebungen.spec.ts` (mit Testbild war das kompakte Bild 72 px hoch, erster Satz unten bei 633 px, Leiste ab 601). 2 erst im zweiten Anlauf: `program-list.spec.ts` (Desktop), `player.spec.ts` (Info schließen) |
| Behoben (zweiter Nachtrag) | Seiten mit Übungsbildern laden Komponenten und Liste der Visuals in ihrem `lazy` (`loadExerciseVisuals`): Player, Zusammenfassung, Vorlage, Trainingstag bearbeiten, Übungsdetails, Bibliothek. Kompaktes Bild so groß wie das Symbol (56 px). Danach 10 E2E-Dateien (Chromium) 61 bestanden; `vitest run src/modules` 677 bestanden; Startansicht 237,8 KB |


### Phase Übungen, Fortsetzung · 27.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1243)

| Nachweis | Ergebnis |
|---|---|
| CI zu 989007c (Lauf 40503897777) | Lint, Unit, Build, Datenbank, E2E Chromium grün; E2E WebKit: 392 bestanden, 1 fehlgeschlagen (`uebungen.spec.ts` Player, erster Satz bei 632,7 statt höchstens 601), `duo-tastatur.spec.ts` bestanden |
| CI zu 748051c (Lauf 40509052343), E2E WebKit | 398 bestanden, 1 fehlgeschlagen (derselbe Test); Diagnose: Karte „Jetzt“ bei y 295 (Chromium 147), Kopf des Players 148 px höher, Bild und Karte gleich groß |
| Nachladen (D-400): `uebungen.spec.ts` „Teil für Übungsbilder lädt nicht …“ (2 Tests) | am alten Stand beide rot (Player ersetzt durch den Hinweis; Seite nach dem Neuladen leer), danach mit `update.spec.ts` 19 bestanden, 9 übersprungen |
| Muskelkarte (D-401): `muscle-map.test.tsx` | 3 bestanden; E2E Reiter „Muskeln“ 2 bestanden |
| `pnpm test` (nach D-403) | 135 Dateien, 1.208 Tests bestanden; danach `exercise-visual.test.tsx` mit Offline-Test 27 bestanden |
| `pnpm test:e2e` (Chromium, nach D-403) | 428 bestanden, 4 fehlgeschlagen (`pwa.spec.ts` und `resilience.spec.ts` offline: „Failed to load resource“ für nie geladene Vorschaubilder), 132 übersprungen. Behoben: ohne Netz nur Gespeichertes anfragen. Danach `pwa`, `resilience`, `uebungen`, `uebungen-offline`: 27 bestanden, 3 übersprungen |
| `uebungen-offline.spec.ts` | Latziehen online gezeigt, danach offline neu geladen: Video läuft aus dem Speicher (Range Requests) |
| `pnpm build`, `pnpm check:bundle` | 237,8 KB von 250 KB; Dateien der Übungsbilder 12 von 12 |
| Renderzeit 3D-Pilot | 968, 1.179 und 928 s je 60 Bilder (4 CPU-Kerne, Cycles, 40 Samples) |

### Phase Übungen, Animationen ohne Kosten · 27.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1243)

Pilot-Übungen auf dem IK-Rig neu gerendert (D-406 bis D-410). Prüfung der Bewegung mit `python -I tools/uebungen-3d/render.py <übung> --pruefen` (Blender 4.2 als Python-Modul): Messwerte für alle 60 Bilder, Prüfbilder vorn, Seite, Standard in fünf Phasen und der Griff aus der Nähe (`docs/screens/uebungen/pruef-<übung>.webp`, selbst angesehen). Browser-Fenster, nicht das Gerät.

| Nachweis | Ergebnis |
|---|---|
| Kniebeuge, Messwerte | Knie 176° bis 67°, Oberschenkel unten waagrecht (0,0°), Rumpf 6° bis 44°, Stange über der Fußmitte 0,00 cm in allen Bildern, Knie zur Zehenrichtung −0,59 bis +1,38°, Knie unten 2,5 cm hinter der Zehenspitze; Fuß tiefster Punkt 0 mm, Verschiebung höchstens 2,82 mm; Ellbogen 37,2°, Handgelenk 12,3° (gleichbleibend); Finger höchstens 1,71 mm eingedrückt, 222 Punkte ≤ 3 mm; Schleife ohne Unterschied, keine Meldung |
| Bankdrücken, Messwerte | Ellbogen 171° bis 56°, Oberarm zum Rumpf 95° bis 66°, Unterarm unten höchstens 5,7° aus der Senkrechten (über die ganze Bewegung höchstens 17,2°), Handgelenk 11,8° bis 27,1°, Stange von über den Schultern bis zum Brustkontakt (0,0 cm); Finger höchstens 1,21 mm, 332 Punkte; Füße 0 mm; keine Meldung |
| Latziehen, Messwerte | Ellbogen 168° bis 52°, Unterarm im Mittelteil höchstens 5,1°, unten 27,3°; Handgelenk höchstens 16,9°; Lehne 8° bis 18°; Stange vor dem Gesicht mindestens 4,1 cm von der Haut (eigene Messung am verformten Netz, Phasen 0 bis 1 in Zehntelschritten); Finger höchstens 1,28 mm, 264 Punkte; Füße 0,1 mm; keine Meldung |
| Gegenprobe nach dem Aufräumen des Rigs | Messwerte von fünf Bildern je Übung gleich wie im Prüflauf (größte Abweichung 0,0) |
| `pnpm lint`, `pnpm typecheck` | ohne Befund |
| `pnpm test` | 135 Dateien, 1.208 Tests bestanden, 1 fehlgeschlagen: `media.test.ts` „die ausgelieferte Liste ist gültig …“ (neue Bildbeschreibungen von Kniebeuge und Bankdrücken über 240 Zeichen). Gekürzt (240 und 222 Zeichen), danach `media.test.ts` 15 bestanden |
| `pnpm build`, `pnpm check:bundle` (neuer Code, Videos noch alt) | Startansicht 237,8 KB von 250 KB; „Vorab gespeichert: 191 von 266 Dateien“; Dateien der Übungsbilder 12 von 12 |
| `pnpm test:e2e` (Chromium, alle Dateien) | 432 bestanden, 132 übersprungen, keiner fehlgeschlagen (16,7 min) |
| Mit den neuen Videos: `pnpm build`, `pnpm check:bundle` | Startansicht 237,8 KB von 250 KB; Dateien der Übungsbilder 12 von 12 |
| Mit den neuen Videos: `uebungen`, `uebungen-offline`, `pwa`, `resilience`, `player` (Chromium) | 29 bestanden, 3 übersprungen |
| Mit den neuen Videos: `pnpm test` | 135 Dateien, 1.209 Tests bestanden |
| App-Bilder `node tools/pilot-screens.mjs` (mit `pnpm preview`) | Liste, Player zu- und aufgeklappt, Details je Übung, Übersicht und Aufnahme des Players in `docs/screens/uebungen/`, selbst angesehen |
| WebKit | läuft in der CI |
| CI zu 1f3faa8 (Lauf 40558753879, neue Videos) | Lint, Typen, Unit, Dokumente, Build; Datenbank; E2E Chromium; E2E WebKit: alle grün |
| Vergleich alt und neu | alter Stand (`5d155fa`) und neuer Stand je vorn und Seite, 60 Bilder, 360 × 270, 16 Samples; Werte des alten Stands mit dessen Code nachgemessen (Bankdrücken: Unterarm in der Mitte 20,8°, Stange unten 1,8 cm über der Brust, Oberarm 54°; Latziehen: Unterarm unten 58,1°; Kniebeuge: Knie unten 16,7 cm innerhalb des Fußgelenks, Fuß im Stand 10 bis 11 mm über dem Boden) |

### Phase Übungen, Brust und Varianten der Figur · 28.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1243)

Auftrag `prompts/uebungen-varianten-FORM.md`: Brust und Körperform (D-413), Varianten der Figur (D-414), Vorschaubild (D-415), Priorität (D-416). Werkzeuge und Daten, die App-Videos unverändert. Brust gemessen am verformten Netz: Querschnitt im Raum des Rumpfs (Knochen `spine02`) als Schnitt der Netzflächen mit der Ebene, je Übung fünf Phasen und Höhen 60, 65, 72, 80 und 86 % der Strecke Hüftgelenke–Halsansatz. „Wölbung“ = Abstand der Brustmuskeln (4 bis 10 cm neben der Mitte) vor der Brustbeinlinie; „Delle“ = größter Abstand des Profils hinter seiner vorderen konvexen Hülle 3 bis 11 cm neben der Mitte.

| Nachweis | Ergebnis |
|---|---|
| Brust vorher (Stand `bac6438`, Grundmodell mit gestauchter Brust) | Wölbung −36,0 bis −20,4 mm (Kniebeuge), −36,1 bis −21,2 mm (Bankdrücken), −36,1 bis −20,4 mm (Latziehen): Brustmuskeln hinter dem Brustbein, in jeder Phase |
| Brust nachher, neutral | Wölbung +5,8 bis +10,3 mm (Kniebeuge), +4,8 bis +10,1 mm (Bankdrücken), +5,3 bis +10,4 mm (Latziehen); Delle höchstens 6,1, 8,1 und 6,7 mm |
| Brust nachher, männlich | Wölbung +6,1 bis +12,9, +3,5 bis +12,9, +5,2 bis +12,9 mm; Delle höchstens 10,1, 6,6 und 11,5 mm |
| Brust nachher, weiblich | Wölbung +6,7 bis +17,2, +6,4 bis +17,1, +6,5 bis +17,2 mm; Delle höchstens 7,5 mm, nur Bankdrücken oben bei 80 % (über der Brust, Arm senkrecht) 26,8 mm |
| Achsel-Hilfsknochen an und aus (neutral, Bankdrücken oben bei 80 und 86 %) | Delle 8,1 und 16,6 mm statt 13,5 und 39,3 mm; Latziehen und Kniebeuge praktisch gleich (Unterschied höchstens 6 mm, in den Nahaufnahmen nicht zu sehen) |
| Erster Versuch mit dem Knochen `shoulder01` | Finger bis −13,4 mm in der Stange (Grundmodell) bzw. +3,8 mm daneben (neutral), weil Blender den verbundenen Knochen am Gelenk festhält und den Arm verschiebt; verworfen |
| Gegenprobe Grundmodell mit neuem Code (`griff_test`, Kniebeuge) | Finger −1,71 mm, 222 Punkte in Kontakt: genau der alte Wert |
| Kniebeuge, Prüfung neutral (60 Bilder) | Knie 176° bis 75,4°, Oberschenkel unten waagrecht (0,0°), Rumpf 6° bis 44°, Stange über der Fußmitte 0,00 cm in allen Bildern, Knie zur Zehenrichtung −1,12 bis +0,24°, Knie unten 7,5 cm hinter der Zehenspitze; Ellbogen 38,1°, Handgelenk 16,0°; Finger −1,17 mm, 230 Punkte; Fuß 0 mm, Verschiebung höchstens 2,26 mm; keine Meldung |
| Bankdrücken, Prüfung neutral | Ellbogen 171,5° bis 49,2°, Oberarm zum Rumpf 95,4° bis 76,8°, Unterarm unten 8,7° aus der Senkrechten (über die Bewegung höchstens 19,9°), Handgelenk 11,8° bis 26,5°, Stange bis zum Brustkontakt (0,0 cm); Finger −1,25 mm, 326 Punkte; Füße 0 mm; keine Meldung |
| Latziehen, Prüfung neutral | Ellbogen 168° bis 47,4°, Unterarm unten 18,0°, Handgelenk höchstens 14,9°, Lehne 8° bis 18°; Finger −1,11 mm, 220 Punkte; Füße 0,1 mm; keine Meldung |
| Nahaufnahmen vorher und nachher | `docs/screens/uebungen/brust-vorher-nachher.webp` (Bankdrücken oben und unten, Latziehen oben, Kniebeuge unten), selbst angesehen: vorher eingesunkene Brust mit Falte in der Mitte, nachher gewölbt |
| Varianten, Standbilder (D-414) | 8 Varianten × 3 Momente (Kniebeuge unten, Bankdrücken Ausgang und Ende), 720 × 540, 40 Samples, Kamera wie in der App: `tools/uebungen-3d/varianten_bilder.py`, zusammengesetzt mit `tools/uebungen_varianten_bild.py` zu `docs/screens/uebungen/varianten-*.webp`, selbst angesehen |
| Renderzeit je Variante (ein Prozess nacheinander, Kniebeuge unten) | A 13,0 s, B 13,7 s, D mit Zonen 14,1 s, D ohne 13,6 s, C männlich 20,0 und 19,9 s, C weiblich 16,1 und 16,6 s je Bild; Poster 4,9 bis 6,3 KB |
| Kleidung: Gewichte am Skelett | erster Stand mit doppelten und vertauschten Gruppen (Summe der Gewichte 1,3 bis 2,1, zerrissener Stoff im Bild); behoben, danach Summe 0,95 bis 1,06 und keine Kante über 5 cm in der Haltung |
| Kleidung: Grenzen der Teile | erster Stand bedeckte Hände und Gesicht mit dem Shirt (Einteilung nur nach Oberarmgewicht); behoben mit Einteilung nach dem Körperteil mit dem größten Gewicht |
| Kleidung: Zonenwerte | doppelt angelegt (`Zone` und `Zone.001` mit gleichen Werten, ohne Wirkung aufs Bild); aufgeräumt, danach je ein Attribut, größte Abweichung zum Körper 0,0 |
| Haare | erster Stand 4 m lang (bei Partikelhaar mit Richtung legt die Startgeschwindigkeit die Länge fest); behoben, danach 1,7 bis 2,6 cm (männlich) |
| Graphit der Shorts | #3C424E (wie die Bank) verschwimmt mit dem Polster, #575D67 hebt sich ab (Probebilder) |
| Schleife Kniebeuge, Variante A (`render.py kniebeuge --variante A`) | 60 Bilder in 841 s (14,0 s je Bild), mit Aufbau und Kodieren 861 s; MP4 51,8 KB, WebM 39,3 KB, Poster 5,1 KB, Vorschau 3,2 KB; Bewegung aus derselben Form und denselben Knochen wie die Prüfung neutral, Kleidung und Material ändern sie nicht |
| Schleife Kniebeuge, Variante D mit Zonen (`--variante D-z`) | 60 Bilder in 897 s (14,9 s je Bild), mit Aufbau und Kodieren 917 s; MP4 55,6 KB, WebM 41,6 KB, Poster 5,4 KB, Vorschau 3,3 KB; Bewegung aus derselben Form und denselben Knochen wie die Prüfung neutral, Kleidung und Material ändern sie nicht |
| Sichtprüfung der Schleifen | Vier Momente beider Schleifen (oben, abwärts, unten, aufwärts), jedes dritte Bild von D und zwei Nahaufnahmen selbst angesehen: Bewegung, Stange und Füße wie bisher; bei D folgt der Stoff jeder Haltung, keine Haut sticht durch, Säume und das kleine Zeichen bleiben an ihrem Platz, die Zone geht ohne Kante von den Shorts auf den Oberschenkel über. Zeit je Bild 12,7 bis 15,3 s (A) und 13,9 bis 16,8 s (D), stehend etwas länger als unten |
| Vorschaubild (D-415) | `render.py <übung> --variante A --nur-vorschau`: 480 × 480 gerendert, 240 × 240 als WebP; Vergleich alt und neu je in 240 und 96 px in `docs/screens/uebungen/vorschau-vergleich.webp`, selbst angesehen; `medien.json` und die Dateien der App unverändert |
| Priorität (D-416) | `python3 tools/uebungen_familien.py --check`: aktuell; 79 Übungen in Programmen oder Vorlagen, 68 in Programmen, 11 nur in Vorlagen, keine ohne Familie |
| CI zu 101b31b (Lauf 40644885547, D-413) | Lint, Typen, Unit, Dokumente, Build; Datenbank; E2E Chromium; E2E WebKit: alle grün |
| `pnpm format:check`, `lint`, `typecheck`, `check:docs` (Stand `0806790` mit den Dokumenten von D-416; Code der App in D-413 bis D-416 unverändert) | bestanden |
| `pnpm test:coverage` | 135 Dateien, 1.209 Tests bestanden |
| `pnpm build`, `pnpm check:bundle` | Startansicht 237,8 KB von 250 KB; „Vorab gespeichert: 191 von 266 Dateien“; Dateien der Übungsbilder 12 von 12 |
| `pnpm test:e2e` (Chromium) | 431 bestanden, 132 übersprungen, 1 fehlgeschlagen: `start-surface.spec.ts:484` „Startfläche am iPhone Duo: zuerst Maße des zugeklappten Zustands, nur beim Laden des Skripts wie beim vierten Start“ (D-394) mit „Bilder ohne Logo davor: Expected > 0, Received 0“, das erste mitgeschnittene Bild zeigte schon das Logo |
| Derselbe Test einzeln, `--repeat-each=10` (beide Fälle) | 20 bestanden |

### Phase Übungen, Feinschliff D und C mit MakeHuman-Dateien · 28.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1243)

Zweite Nachricht vom 28.10.2026 in `prompts/uebungen-varianten-FORM.md`: Feinschliff der gewählten Variante D (D-417) und C mit den Dateien von MakeHuman (D-418). Nur Werkzeuge und Daten; Code und Videos der App unverändert. Nahaufnahmen mit `tools/uebungen-3d/nahaufnahme.py` (Kamera auf einen Knochen des verformten Netzes), Standbilder mit `varianten_bilder.py` (720 × 540, 40 Proben, Kamera wie in der App), zusammengesetzt mit `tools/uebungen_varianten_bild.py`.

| Nachweis | Ergebnis |
|---|---|
| Hals vermessen (Ruhehaltung, neutral) | Halsgelenk `neck01` bei y = −0,005 m; Halshaut am Ansatz (0 bis 3,5 cm darüber): x ±0,063 m, y −0,081 bis +0,023 m, Mitte y −0,029 m, Kehle also 8 cm vor dem Gelenk; der alte Ausschnitt (Ellipse 7,2 × 6,6 cm um das Gelenk, Vorderkante y −0,067 m) ließ vorn Stoff am Hals stehen |
| Rundhals, Ruhehaltung (`nahaufnahme.py D-z kniebeuge 0.0 neck01 0.26`, von vorn, seitlich, hinten, Kamera der App) | Hals frei, Ausschnitt rund, vorn rund 5 cm unter der Kehle, hinten am Halsansatz; selbst angesehen |
| Rundhals in allen Phasen (drei Übungen × Phasen 0, 0,25, 0,5, 0,75, 1, Kamera der App, 300 px, 12 Proben) | 15 Bilder, Hals in jedem frei: `docs/screens/uebungen/feinschliff-hals.webp` |
| FORM-F gerastert (`kleidung._f_bild`, numpy, 1024 px, 4-fach überabgetastet) gegen eine Pillow-Rasterung derselben Pfade | Umriss 37–987 × 71–953 px gegen 35–989 × 69–955 px; größte Abweichung 69 von 255 nur an Rändern, Mittel 0,125; das F füllt 36,1 % des Bildes |
| Ausrichtung der Logos (Nahaufnahmen Brust 20°, Rücken 180°, Bein 90°) | erster Stand: Rücken-F spiegelverkehrt, Bein-F auf dem Kopf (Abwicklung am Rücken nach links, am Bein von der Hüfte nach unten gezählt); behoben, danach alle drei richtig herum, selbst angesehen |
| Lime-F in einer Lime-Zone (Latziehen hinten, Bankdrücken Brust) | erster Stand: das F verschwand in der Zone oder blieb als Rest stehen (Latziehen); jetzt in der Stoffarbe ausgespart, als F lesbar, selbst angesehen |
| Kantenlicht, Kniebeuge unten (`nahaufnahme.py --kante`, 420 px) | ohne (bisher 90 W): Oberkörper verschwimmt mit dem Hintergrund; 200/140 W: Kante kaum sichtbar; 280/200 W: Silhouette klar, Kante schmal; 420/300 W: Arme und Schultern zu hell. Gewählt 280/200 W: `docs/screens/uebungen/feinschliff-kantenlicht.webp` |
| MakeHuman-Paket (`render.py --hole`) | `makehuman_system_assets_cc0.zip` 298.739.872 Byte, 517 Dateien; ausgepackt nur Haut (2), Augen, Brauen (2), Wimpern (2), Haare (2); jede Datei mit „explicitly released as CC0 in september 2020“ im Kopf |
| Haare von MakeHuman | Bilder sind blond (`short02`, `bob02`) mit starkem Glanz; eingefärbt (`HAARTON` 0,42/0,30/0,22, Glanz 0,2, Rauheit 0,6), danach dunkelbraun; Nahaufnahmen selbst angesehen |
| Augen des Mannes (Nahaufnahme Kopf, mit Wimpern `eyelashes01`, ohne, mit `eyelashes02`) | in allen drei Fällen gleich schmal: liegt an Augen und Lidern aus den MakeHuman-Dateien, nicht an den Wimpern; in der Größe der App nicht zu sehen |
| Standbilder D, vier Fassungen × drei Momente (720 × 540, 40 Proben, `varianten_bilder.py`, ein Prozess) | je Bild im Schnitt: Zonen, F in Lime, Kantenlicht 21,2 s, Zonen, F hell Ton in Ton 20,5 s, Zonen, F in Lime, ohne Kantenlicht (bisher) 19,7 s, Zonen, Tee in Graphit 20,2 s; zusammengesetzt mit `uebungen_varianten_bild.py --praefix feinschliff` (Reihe 1) und `--nah` (`logos-nah.webp`, 81,5 KB), selbst angesehen |
| Standbilder C mit MakeHuman-Dateien, vier Fassungen × drei Momente (D-418) | je Bild im Schnitt: männlich, MakeHuman, Zonen 21,9 s, männlich, MakeHuman 21,5 s, weiblich, MakeHuman, Zonen 21,9 s, weiblich, MakeHuman 20,5 s; Reihe 2 der Vergleichsbilder `feinschliff-kniebeuge-unten.webp` (81,2 KB), `feinschliff-bank-oben.webp` (80,5 KB), `feinschliff-bank-unten.webp` (83,2 KB), Übersicht `feinschliff-uebersicht.webp`; selbst angesehen |
| `pnpm check:docs` je Paket am Stand des Commits, `python3 -m py_compile` aller Werkzeuge | bestanden |

### Phase Übungen, Korrekturrunde Logos und Zonen · 28.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1243)

Auftrag `prompts/uebungen-korrektur-logos-FORM.md`: Kleidung, Logos und Fassungen (D-419), Vergleichspaket mit App-Ansichten (D-420). Nur Werkzeuge und Daten; Code und Videos der App unverändert. App-Ansichten mit `tools/uebungen-fassungen-screens.mjs` gegen `pnpm preview` (Build vom Stand `890dd80`, App-Code seither unverändert), Medien nur in `dist/` getauscht und zurückgesetzt.

| Nachweis | Ergebnis |
|---|---|
| CI zu dfa586e (Lauf 40666024325, D-418) | Lint, Typen, Unit, Dokumente, Build; Datenbank; E2E Chromium; E2E WebKit: alle grün (der Lauf zu 2e4b2c4 wurde vom nächsten Commit abgebrochen, wie in der CI vorgesehen) |
| Logos aus mehreren Perspektiven (`nahaufnahme.py`, D, C männlich, C weiblich; Brust von vorn und aus der Kamera der App, Rücken von hinten, Shorts von der Seite und aus der Kamera der App) | Brust-F links des Trägers auf der Herzseite, aus der Kamera der App sichtbar; bei C männlich näher an der Mitte als in D-417; Rücken-F in Originalproportionen (vorher gestreckt); Shorts-F außen am linken Bein, von der Seite und aus der Kamera der App sichtbar; selbst angesehen |
| Rand in Stoffarbe über Zonen (A1 Bankdrücken Brust, A2 Latziehen Rücken, A2 Kniebeuge Shorts) | helles bzw. Lime-F mit dunklem Rand auf der Zone lesbar, kein Ausschnitt in der Zone; selbst angesehen |
| Seitenschlitz mit Einfassung (Nahaufnahme Hüfte von der Seite, D und C weiblich) | erster Stand 3,6 cm über dem Saum, weil die Hüftseite am Saum zum Bein zählt und die Suche nur Rumpfpunkte nahm; behoben, danach am Saum, 5 cm hoch mit Einfassung beidseits |
| Kordelenden am Bund (Nahaufnahme von vorn) | vorhanden, aber unter dem Saum des Tees, von außen nicht zu sehen |
| Standbilder 3 Körper × 3 Fassungen × 3 Momente (`varianten_bilder.py`, 720 × 540, 40 Proben) und je 3 Vorschaubilder (`render.py --nur-vorschau`), dazu Brust-F 3,5 und 4,5 cm für D und C männlich (D-420) | je Bild im Schnitt: D 20,7/22,6/22,1 s (A1/A2/B); C männlich 23,1/22,9/22,9 s (A1/A2/B); C weiblich 23,1/23,4/23,5 s (A1/A2/B) |
| Nahaufnahmen je Körper (Brust von vorn und aus der Kamera der App, Rücken von hinten und beim Latziehen, Shorts, Hals) und Kantenlicht ohne/mit (D-420) | 24 Bilder, selbst angesehen; Blätter `paket-2` bis `paket-4`, `paket-hals-kantenlicht` |
| App-Ansichten (`tools/uebungen-fassungen-screens.mjs`, D-420) | 36 Bildschirmfotos (9 Fassungen × kleiner Player am iPhone, aufgeklappter Player am Duo, Übungsübersicht mit Suche „Langhantel“, Übungsdetails der Kniebeuge; iPhone 390 × 844 in doppelter Auflösung, Duo aufgeklappt 951 × 669, „Bewegung reduzieren“), Medien nur in `dist/uebungen/medien/` getauscht und danach zurückgesetzt (Prüfsummen gleich `public/`); Blätter `paket-9-app-D`, `-Cm`, `-Cw` |
| Blätter des Pakets (`tools/uebungen_paket_bild.py`) | 13 Dateien, zusammen 1328,3 KB, selbst angesehen |
| `pnpm check:docs` je Paket am Stand des Commits, `python3 -m py_compile` aller Werkzeuge | bestanden |

### Phase Übungen, Korrekturen Augen, Logos, Kragen und Griff · 28.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1243)

Vierte Nachricht des Produktinhabers vom 28.10.2026 (Entscheidung Fassung A1 mit Brust-F 4 cm; Korrekturen 1 bis 6): Augen und Zopf (D-421), Kleidung (D-422), Griff (D-423), Standbilder und Nahaufnahmen (D-424). Nur Werkzeuge und Daten; Code und Videos der App unverändert. Der genannte Anhang `korrektur-markierungen.png` ist nicht angekommen (Upload-Ordner ohne neue Datei); Prüfung nach dem Text.

| Nachweis | Ergebnis |
|---|---|
| Ursache der schwarzen Augen (Bild `brown_eye.png` gemessen: Lederhaut hellgrau, zwei Iris-Bereiche, 1,3 % durchsichtig in einer Ecke; UV des vordersten Punkts der Hornhaut (0,937, 0,069) liegt in diesem Bereich) | Hornhaut auf dem durchsichtigen Teil des Bilds, Material ohne Deckkraft; behoben in `realistisch._augen_material` |
| Nahaufnahmen Kopf von vorn (`nahaufnahme.py`, 600 px, 32 Proben): D, C männlich, C weiblich | D: graue Augen mit weich dunklerer Iris, keine Löcher; C: Lederhaut, Iris, Pupille und Glanz sichtbar; selbst angesehen |
| Zopf von hinten (C weiblich, 150°) | dunkler Zopf am Hinterkopf, Hals und Nacken frei; selbst angesehen |
| `hair/ponytail01` laden | erster Lauf: Absturz von Blender (Segmentation fault) bei einem Netz mit 0 Eckpunkten, weil `ponytail01.mhclo` eine `material`-Zeile in der Referenzliste führt; nach der Korrektur 3718 Eckpunkte, 2676 Flächen, `mesh.validate` ohne Befund |
| Ursache des Shorts-F innen (Bankdrücken D, Kamera vom Fußende) | F auf der Innenseite des rechten Beins: ebene Projektion ohne Begrenzung traf das andere Bein (Normale zeigt zur Bildebene); behoben (D-422), danach in derselben Ansicht keine Spur mehr, F außen am linken Bein (Seitenansicht 90°) unverändert |
| Kragen Kniebeuge unten (D, 45° und 135°, dazu Kamera der App, 700 px) | liegt beidseits am Halsansatz, Stange auf dem Stoff; bis D-420 stieg er auf der Seite der Stange am Hals hoch |
| Rücken mit Wortmarke (D Kniebeuge von hinten; C weiblich Latziehen unten von hinten) | F über FORM mittig zwischen den Schulterblättern, Wortmarke in Originalproportionen, Rand in Stoffarbe über den Lime-Zonen; selbst angesehen |
| Daumen vor der Korrektur (D, Bankdrücken vom Fußende und vom Kopfende, Kniebeuge hinten-seitlich, Latziehen von vorn) | Haken unter der Stange, Spitze von den Fingern weg; Ursache: Ziel der Spitze auf der Stangenoberfläche gegenüber der Handfläche |
| Messung je Übung (D-A1, `pruef_griff.py` im Arbeitsordner): Daumen Grundgelenk, Beugung Grund- und Endglied, Abstand zur Stange; Finger in den Phasen 0, 0,5 und 1 | mit weichen Strafen: Bankdrücken 8°/92°, Kniebeuge 0°/0°, Latziehen 0°/70° (Daumen gestreckt oder geknickt). Mit festen Grenzen: Bankdrücken Grundgelenk −62°/28°, Beugung 20°/70°, Daumen −0,6 mm; Kniebeuge −50°/−14°, 20°/20°, −0,1 mm; Latziehen −28°/38°, 20°/28°, −0,7 mm; Finger geringster Abstand −4,3 / −1,2 / −1,1 mm, Kontaktpunkte 324 / 206 / 236, in allen Phasen gleich, keine Meldungen des Rigs |
| Nahaufnahmen danach (Bankdrücken vom Fußende, vom Kopfende und schräg entlang der Stange ohne Scheiben; Kniebeuge hinten-seitlich; Latziehen schräg) | Faust um die Stange, Daumenspitze über dem Zeigefinger, nicht abstehend, kein Knick nach hinten; in der Kniebeuge ragt die Spitze über dem Zeigefinger knapp über die Stange; selbst angesehen |
| Standbilder A1 mit Brust-F 4 cm, 3 Körper × 3 Momente (`varianten_bilder.py`, 720 × 540, 40 Proben, D-424) | je Bild im Schnitt: D 27,1 s, C männlich 22,7 s, C weiblich 22,7 s |
| Nahaufnahmen je Körper (`nahaufnahme.py`, 480 px): Augen, Hals, Rücken mit Schriftzug, Shorts-Logo, Griff Bankdrücken von vorn, von der Seite und vom Kopfende, Griff Kniebeuge (D-424) | 24 Bilder, selbst angesehen; Blätter `korrektur-2-nah-D`, `-3-nah-Cm`, `-4-nah-Cw` |
| Blätter (`tools/uebungen_korrektur_bild.py`) | 4 Dateien, zusammen 346,3 KB, selbst angesehen |
| CI | CI zu `bd65d53` (D-421, Lauf 40682710242) und `fd5d8ee` (D-422, Lauf 40682762529) vom jeweils nächsten Commit abgebrochen, wie in der CI vorgesehen; Lauf 40684266041 zu `f0bc9aa` (D-423) lief beim Schreiben dieses Protokolls noch, der Lauf zum Commit von D-424 folgt; Stand in PR #53 |
| `pnpm check:docs`, Prettier, `python3 -m py_compile` je Paket am Stand des Commits | bestanden |
| `pnpm check:docs`, `python3 -m py_compile` | bestanden |

### Phase Übungen, Korrekturen Daumen, Kragen und Rückenlogo · 28.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1243)

Fünfte Nachricht des Produktinhabers vom 28.10.2026 (Entscheidung Körper C männlich, A1, Brust-F 4 cm; Korrekturen 1 bis 3; Anhang `korrektur-markierungen` diesmal angekommen): Griff (D-425), Kragen (D-426), Rückenlogo (D-427), Standbilder und Nahaufnahmen (D-428), Animationsplan (D-429). Nur Werkzeuge und Daten; Code und Videos der App unverändert.

| Nachweis | Ergebnis |
|---|---|
| Lage der Daumengelenke im Griff (Skript im Arbeitsordner, C männlich, Bankdrücken): Abstand zur Stangenachse, axiale Lage, Soll gegen Ist | erster Stand der Konstruktion: alle Gelenke auf 3,95 cm statt 2,65 cm, weil die Kontaktmessung Ballen und Schwimmhaut mitnahm; danach 3,13 cm (Dicke 17 mm aus der Messung an der Beere), Soll und Ist gleich, alle Gelenke in einer Ebene quer zur Stange |
| Messung je Übung (`pruef_griff.py`, C männlich): Daumenwinkel, Abstand zur Stange, Finger in den Phasen 0, 0,5 und 1 | Bankdrücken Sattel 71°, Grund 39°, End 69°, Daumen −0,7 mm; Kniebeuge 52°/30°/69°, −0,7 mm; Latziehen 43°/19°/73°, −0,8 mm; Finger geringster Abstand −2,3 / −0,7 / −2,0 mm, Kontaktpunkte 346 / 182 / 226, in allen Phasen gleich, keine Meldungen |
| Nahaufnahmen Bankdrücken vom Fußende, von der Seite (90°, Scheiben ausgeblendet), vom Kopfende und von oben; Kniebeuge hinten-seitlich; Latziehen schräg | Daumen umschließt die Stange unter den Fingern, nichts ragt über die Stange oder zeigt von ihr weg; von vorn ist die Daumenspitze neben dem Zeigefinger zu sehen, vom Kopfende liegt sie unter den Fingern; selbst angesehen |
| Kragen in der tiefsten Kniebeuge (C männlich, 45° Kamera der App und 135° hinten-seitlich, 480 px) | vor D-426 Spitze seitlich am Hals auf der Seite der Stange (Markierung des Produktinhabers); danach gleichmäßige Kante am Halsansatz rundum, Stange auf dem Stoff; selbst angesehen |
| Rückenlogo (C männlich, Latziehen unten und Kniebeuge oben von hinten, 480 px) | Marken der Schulterblätter aus `base.obj` gelesen (±11,8 cm beim Grundmodell); C männlich Breite zwischen den Schulterblättern 12,6 cm, Wortmarke 8,4 cm, F 3,5 cm (`kleidung.anziehen.masse`, nachgemessen in D-428; D 11,4 cm, C weiblich 10,1 cm), mittig zwischen den Schulterblättern über den Lime-Zonen; selbst angesehen |
| Standbilder C männlich A1 mit Brust-F 4 cm, drei Momente (`varianten_bilder.py`, 720 × 540, 40 Proben, D-428) | Kniebeuge unten 17,7 s, Bankdrücken oben 24,3 s, unten 25,8 s; selbst angesehen |
| Nahaufnahmen (`nahaufnahme.py`, 480 px, 24 Proben, D-428): Griff von vorn, von der Seite, vom Kopfende, von oben; Kragen 45° und 135°; Rückenlogo Latziehen und Kniebeuge | 8 Bilder, selbst angesehen; Blatt `korrektur2-2-nahaufnahmen` |
| Blätter (`tools/uebungen_korrektur_bild.py --runde 2`) | 2 Dateien, zusammen 122,2 KB, selbst angesehen |
| Animationsplan (`tools/uebungen_animationsplan.py`, D-429): drei Programme in `programs.v1.json` gefunden, 68 Übungen der Zuordnung D-411, vier Platzhalter der Programme (keine Übungen) ausgeschlossen; `--check` in `pnpm check:docs` | Summen 103,0 Std. Übungen, 63,0 Std. Basis, 1784 min Rechenzeit; Plan und Daten stimmen überein |
| `pnpm check:docs`, `python3 -m py_compile` | bestanden |

### Phase Übungen, Korrekturrunde 3 (Griff, Rundhalskragen, Rückenlogo) · 28.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1243)

Auftrag `prompts/uebungen-korrektur3-FORM.md` (Anhang mit Markierungen angekommen): Griff (D-430), Rundhalskragen (D-431), Rückenlogo (D-432), Vergleichsblätter (D-433), Animationsplan nach Programmen (D-434). Nur C männlich, Fassung A1, Brust-F 4 cm; Werkzeuge und Daten, Code und Videos der App unverändert.

| Nachweis | Ergebnis |
|---|---|
| Handgeometrie im Griff (Skript im Arbeitsordner, C männlich, Grundhaltung): Mittelhandknochen, Fingergrundgelenke, Hauttiefe der Handfläche je Anteil Handgelenk → Fingeransatz, Lage der Stange | Haut der Ballen 2,9 bis 3,2 cm über den Mittelhandknochen (Anteil 0,2 bis 0,4), Hohlhand 1,8 bis 2,2 cm (0,6 bis 0,9); Stange bis D-429 bei Anteil 0,38, Mitte 4,8 cm über den Knochen: auf den Ballen, nicht in der Hand |
| Messung je Übung nach der Korrektur (`pruef_griff.py`): Daumenwinkel, Abstand jedes Fingers zur Stange, Finger in den Phasen 0, 0,5 und 1 | Bankdrücken Daumen 41°/53°/69°, Finger −0,1 bis −1,9 mm, Daumen −0,7 mm; Kniebeuge 51°/67°/69°, −0,7 bis −1,7 mm; Latziehen 44°/33°/73°, −0,4 bis −1,2 mm; in den Phasen geringster Abstand −1,9 / −5,1 / −1,2 mm (Kniebeuge: Haut des Daumenballens in der Stange, Einsinken 9 mm, nicht sichtbar), keine Meldungen des Rigs |
| Nahaufnahmen Bankdrücken (640 px, 24 Proben, Scheiben ausgeblendet): vom Fußende, von der Seite entlang der Stange, von oben, vom Kopfende; Kniebeuge hinten-seitlich und von hinten; Latziehen schräg | Stange läuft durch die geschlossene Hand, Finger greifen von oben über die Stange, Daumen schließt den Ring unten, Spitze neben dem Zeigefinger; Handgelenk über dem Unterarm; nichts ragt aus der Stange; selbst angesehen |
| Halsansatz gemessen (Skript im Arbeitsordner, C männlich, Grundhaltung): Höhe der Schlüsselbeinenden 0,591 m, `neck01` 0,665 m, Halsbreite knapp über dem Halsansatz ±6,7 cm, Haut der Trapezmuskeln bei 13 cm seitlich 0,63 bis 0,64 m | die Trapezmuskeln liegen seitlich fast auf Höhe des Halsansatzes: Grund, warum die reine Ebene vorn/hinten über die Schultern schnitt |
| Halsöffnung, vier Fassungen nacheinander (Nahaufnahmen Stand von vorn und von der Seite, tiefste Kniebeuge 45° und 135°, Latziehen oben, 560 px, 16 Proben) | 1. Ellipse in geneigter Ebene mit Zylinder: Nacken über der hinteren Kante außerhalb des Zylinders, Lappen seitlich am Hals; 2. reine Ebene: Kante über den Schultern (siehe Messung); 3. Ebene seitlich parabolisch zum Halsansatz angehoben: Kante am Hals, vorn Spitze entlang der Brustbeinrinne, Bündchen ohne Schnittpunkte vorn (Haken); 4. dazu Stoff unterhalb der vorderen Kante, Bündchen aus dem Feld `Hals` und mindestens 2,5 mm über dem Stoff: runder Bogen vorn, Kante seitlich am Halsansatz, hinten über dem Halswirbel, Bündchen durchgehend; in der tiefsten Kniebeuge mit aufliegender Stange und beim Latziehen oben unverändert am Halsansatz; selbst angesehen |
| Bündchen (Skript im Arbeitsordner): 72 Stützen je Winkel, Höhe über der Tangentialebene des nächsten Stoffpunkts | nach der Anhebung 2,2 bis 2,6 mm überall (vorher −12 bis +1,6 mm, Stützen im Stoff); Innenkante z 0,59 bis 0,68 m, x ±7,3 cm; 144 Eckpunkte, 72 Flächen |
| Rückenlogo (`kleidung.anziehen.masse`, C männlich): Wortmarke 15,0 cm, F 6,3 cm hoch, Block 11,4 cm, Oberkante des F 7,0 cm unter der hinteren Kante der Halsöffnung; Nahaufnahmen Kniebeuge Ausgang und Latziehen Endposition von hinten, Kniebeuge tiefste Position von hinten-seitlich | mittig im oberen Rücken, Originalproportionen, über den Lime-Zonen lesbar; vorher (D-427) 8,4 cm und 3,5 cm, Oberkante des F rund 13 cm unter der Kante |
| Vergleichsblätter (D-433): vorher mit dem Werkzeugstand D-429 (`git archive HEAD` vor D-430 in einen eigenen Ordner, dieselben Quelldateien), nachher mit dem Stand D-432; 13 Ansichten je Stand (`nahaufnahme.py`, 560 px, 24 Proben) und 3 Standbilder je Stand (`varianten_bilder.py`, 720 × 540, 40 Proben) | Kniebeuge unten 19,4 / 17,3 s; Bankdrücken oben 32,1 / 23,9 s; Latziehen unten 37,3 / 18,6 s (vorher / nachher); 5 Blätter, zusammen 385,2 KB, selbst angesehen |
| Animationsplan nach Programmen (D-434, `tools/uebungen_animationsplan.py --check`) | Ganzkörper A/B, 4 Tage: 11 Übungen, 22,2 Std. plus Basis 42,0, 289 min; Push/Pull/Beine, rotierend: 14 Übungen, 24,0 Std. plus Basis 4,0, 368 min; Winterprogramm 2026: 43 Übungen, 56,8 Std. plus Basis 17,0, 1126 min; Summe unverändert 68 Übungen, 103,0 Std., 63,0 Std. Basis, 1784 min |


### Phase Übungen, Korrekturrunde 4 (Daumen, zweites Shorts-F, personalisiertes Modell) · 28.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1243)

Auftrag `prompts/uebungen-korrektur4-FORM.md` (beide Anhänge mit Markierungen angekommen): Daumen (D-435), zweites Shorts-F (D-436), Grundlage und Variante des personalisierten Modells (D-437, D-438), Vergleichsblätter (D-439). Nur C männlich, Fassung A1, Brust-F 4 cm; Code und Videos der App unverändert. Fotos, Landmarken und Vorschauen der Person nur im Arbeitsordner der Sitzung, nie im Repository.

| Nachweis | Ergebnis |
|---|---|
| Daumen-Diagnose am Stand D-434 (Skript im Arbeitsordner, Bankdrücken, beide Hände): Lage aller Daumen- und Fingergelenke um die Stange (axial, Radius, Winkel), kürzester Abstand der Glieder, Haut im verformten Netz | Daumen in der Querebene des Zeigefingers (axial 29 gegen 24 bis 26 mm) auf demselben Radius (31 mm); Grund- und Endglied 3,5 bis 4,7 mm neben den Zeigefingerknochen; 57 von 180 Hautpunkten des Daumens innerhalb 7,5 mm um die Knochen von Zeige- und Mittelfinger (nächster 0,2 mm), 75 von 377 Fingerhautpunkten innerhalb 8 mm um die Daumenknochen |
| Dicken am Grundmodell (Skript im Arbeitsordner, rechte Hand, Grundhaltung): Haut je Glied zur Handfläche hin, zum Rücken, seitlich | Daumen Grundglied 12,6 / 16,2 / 16,6 mm, Endglied 11,3 / 11,4 / 14,4 mm; Zeigefinger Mittelglied 15,5 / 4,8 / 11,6 mm, Mittelfinger 15,5 / 3,6 / 11,7 mm: Fingerknochen fast am Rücken, Beere 15 mm vom Knochen |
| Zwischenstände der Daumenkonstruktion (Diagnose, dieselben Maße): nur Gelenke über der Hülle; Glieder dazwischen geprüft; Vorausschau ohne enge Fenster | 1. Spitze 17,5 mm über dem Zeigefinger, aber Grundglied 3,2 mm neben dessen Endglied; 2. ohne Vorausschau Mittelgelenk 68 mm von der Achse (Daumen steht senkrecht ab); 3. mit Hülle 15 mm und 15° Mittelgelenk 61 mm; mit 6 mm und 6°, 3 mm Nachgeben und Abstiegsgrenze 50,6 mm |
| Diagnose nach D-435 je Übung und Phase (Bankdrücken 0 und 1, Kniebeuge 0 und 1, Latziehen 0 und 1) | Bankdrücken: Daumen 56°/34°/71°, Grundgelenk 39,6, Mittelgelenk 50,6, Spitze 43,0 mm von der Achse; Abstand zu den Fingerknochen ab 10,0 mm; Daumenhaut 0,7 mm von der Fingerhaut; 8 Daumenhautpunkte innerhalb 7,5 mm um Fingerknochen (nächster 2,8 mm), keine Fingerhaut im Daumen; Finger −3,4 bis −4,3 mm in der Stange (Ziel −4). Kniebeuge: 64°/45°/74°, Abstände ab 8,8 mm. Latziehen über den Fingern: Sattel 48, Mittelgelenk 53 mm von der Achse, Daumen als Haken neben der Hand (verworfen); mit Ring (D-425): 44°/33°/73°, 36 Daumenhautpunkte innerhalb 7,5 mm um Fingerknochen (nächster 0,1 mm), 72 Fingerhautpunkte im Daumen, hinter den Fingern verdeckt |
| Nahaufnahmen Bankdrücken (`nahaufnahme.py`, 560 px, 24 Proben, Scheiben ausgeblendet): vom Fußende, von der Seite entlang der Stange, von oben, schräg (40°, 35°), vom Kopfende; Kniebeuge hinten-seitlich; Latziehen schräg; dazu Markierungskugeln an den Daumengelenken in drei Ansichten | Daumen vom Fußende als eigener Finger vor der Stange, Spitze am Zeigefinger; von oben und schräg getrennt vor den Fingern; von der Seite als Profil mit Spalt zur Fingerspitze; Kniebeuge wie bisher (Daumen hinter der Stange); Latziehen mit Ring wie D-434, Finger 4 mm eingesunken |
| Bein zur Kamera beim Bankdrücken (Skript im Arbeitsordner): Abstand der Oberschenkelmitten zur Kamera der App; Strahl durch die rote Markierung (Lage im Blatt `korrektur3-5-player` per Bildvergleich bestimmt: Bild bei 406/122 px, Kreis bei 567,6/290,2 px, also u 0,4144, v 0,5760) auf Körper und Shorts | linkes Bein 3,676 m, rechtes 3,957 m; Treffer auf „Shorts“ bei (0,218, −0,232, 0,609) m, nächster Körperpunkt x = +0,151 m (links), 16,8° von vorn nach außen, Anteil 0,320 Hüfte→Knie, Gewichte upperleg02.L 0,52 und upperleg01.L 0,46 |
| Zweites Shorts-F (D-436): Nahaufnahmen des linken Oberschenkels mit der Kamera der App beim Bankdrücken, in der tiefsten Kniebeuge und beim Latziehen (480 bzw. 560 px); Bankdrücken 720 × 540 mit 40 Proben, verkleinert auf 390 px | F liegt auf dem Stoff vorn-außen nahe dem Saum, Originalproportionen, Rand in Stoffarbe; in der Kniebeuge am Rand der Lime-Zone sichtbar; beim Latziehen beide F zugleich sichtbar (außen 80° und vorn 17°, 6 cm Abstand); im großen Player als heller Fleck erkennbar, im kleinen nicht (wie das Brust-F) |
| Personalisiertes Modell (D-437, D-438): Werkzeuge, Landmarken, Maße, Vorschauen | Nachweise mit D-444 entfernt: Der Produktinhaber verwendet die personalisierte Variante nicht; Reglerwerte, Haarparameter, die Beschreibung des Aussehens und die aus Fotos und Referenzblatt gemessenen Maße stehen nicht mehr im Repository |
| Vergleichsblätter (D-439): vorher mit dem Werkzeugstand D-434 (`git archive HEAD` vor D-435 in einen eigenen Ordner, dieselben Quelldateien; sechs Griffansichten aus Runde 3 übernommen, drei Logoansichten und die schräge Griffansicht neu gerendert), nachher mit dem Stand D-436; 10 Nahaufnahmen je Stand (`nahaufnahme.py`, 560 px, 24 Proben) und 3 Standbilder je Stand (`varianten_bilder.py`, 720 × 540, 40 Proben) | Kniebeuge unten 17,3 / 17,5 s; Bankdrücken oben 23,9 / 25,2 s; Latziehen unten 18,6 / 17,4 s (vorher / nachher); drei Blätter 142, 66 und 63 KB; alle Ansichten selbst angesehen |
| Dokumente je Paket (`pnpm check:docs`, Prettier), Werkzeuge kompiliert (`python3 -m py_compile` aller Dateien in `tools/uebungen-3d/` und `tools/uebungen_korrektur_bild.py`) | bestanden; Verweise auf noch nicht vorhandene D-Nummern vom Prüfskript gemeldet und je Paket aufgelöst |
| Fotos und abgeleitete Daten der Person nach dem Rendern gelöscht | gelöscht; seit D-444 sind auch Reglerwerte, Zuordnung und Werkzeuge der Variante entfernt |
| CI zu `01aa781` (D-437), `57e9acd` (D-438) und `338823b` (D-439): Job „Lint, Typen, Unit-Tests, Dokumente, Build“ rot | Ursache `pnpm format:check`: die erzeugte `tools/uebungen-3d/gesicht-marken.json` ist einzeilig, lokal war Prettier nur auf den Markdown-Dateien gelaufen. Nachtrag: Datei in `.prettierignore` wie die anderen erzeugten Datendateien; danach `pnpm format:check`, `lint`, `typecheck`, `test`, `check:docs`, `build` und `check:bundle` lokal bestanden |

### Phase Übungen, Korrekturrunde 5 (Daumen nach Handfoto, ein Shorts-F, personalisiertes Modell nach Referenzblatt) · 28.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1243)

Auftrag `prompts/uebungen-korrektur5-FORM.md` (Handfoto und neunteiliges Referenzblatt angekommen, kein separates Profilfoto): Daumen (D-440), danach ein Shorts-F, das personalisierte Modell neu sowie Blätter und Bericht (je eigene Entscheidung, Zeilen folgen je Paket). Nur C männlich, Fassung A1, Brust-F 4 cm; Code und Videos der App unverändert. Handfoto, Referenzblatt, Landmarken, Reglerdateien und Vorschauen der Person nur im Arbeitsordner der Sitzung, nie im Repository.

| Nachweis | Ergebnis |
|---|---|
| Daumen-Diagnose am Stand D-439 (Skript im Arbeitsordner, Bankdrücken, rechte Hand): Lage der Daumen- und Fingergelenke um die Stange, Beeren, Hub, Ballenhaut, Daumen- und Fingerrücken | Grundgelenk 39,6, Mittelgelenk 50,6, Spitze 43,0 mm von der Achse; 56°/34°/71°; Daumenrücken bis 58,9 mm, Fingerrücken (Zeige- und Mittelfinger) bis 35,3 mm; Ballenhaut (12 Punkte der Gruppe `finger1-1`) 2,9 mm von der Stange; Zeigefinger 88°/32°/22°, Spitze 30,8 mm von der Achse |
| Querschnitt der Daumenglieder in der Gliedmitte (Hauptachsen der Haut quer zum Knochen, Skript im Arbeitsordner) | Endglied dünne Achse 11,6 (Beere) / 3,8 mm (Rücken), breite Achse 12,0 / 11,0 mm; Beerenrichtung 83° zur Handflächennormale, 10° zur Knöchelachse; Grundglied 9,4 / 9,0 und 12,4 / 9,8 mm, Beerenrichtung 119° zur Handflächennormale: Der Daumen lag um seine Achse verdreht, die alte Beere (12,6 mm) war seine halbe Breite |
| Zwischenstand 1 (Endgelenke der Finger frei, Hub beider Gelenke eines Glieds gleich, Beere wie bisher) | Zeigefinger 98°/2°/56°, Spitze 28,2 mm; Daumen 32,6 / 52,7 / 45,1 mm, 36°/36°/71,5°: weiter ein Haken, weil das Grundglied über die Zeigefingerspitze steigen muss |
| Zwischenstand 2 (flach: erst das tiefere Gelenk eines Glieds anheben, dann beide) | 41,6 / 43,6 / 46,0 mm, 46°/58°/34°, Hub 19 / 5 / 6 mm, Daumenrücken 54,5 mm; Bilder: kein Haken mehr, von vorn aber breit und flach (verdrehter Daumen) |
| Stand D-440 (Beerenrichtung und -dicke aus dem Netz: Median 14,8 und 13,8 mm), Diagnose je Übung | Bankdrücken: 41,8 / 46,0 / 48,5 mm, 47°/55°/35°, Hub 17 / 5 / 6 mm, Daumenrücken 51,5 (Fingerrücken 32,8), Daumenhaut 1,1 mm von der Fingerhaut, 10 Daumenhautpunkte innerhalb 7,5 mm um Fingerknochen, keine Fingerhaut im Daumen, Finger −4,0 bis −4,8 mm in der Stange, Ballenhaut 3,9 mm. Kniebeuge: 33,8 / 44,8 / 44,0 mm, 49°/52°/51°, Rücken 49,7 (36,2), Spalt 0,3 mm. Latziehen über den Fingern: 43,8 / 44,2 / 44,3 mm, 39°/45°/44°, Hub 20,9 / 2,5 / 7,4 mm, Daumenhaut 11 mm von der Stange, Rücken 52,3 (32,0), 21 Punkte; Ring (bisher): 87 Fingerhautpunkte innerhalb 7,5 mm um die Daumenknochen und 64 umgekehrt (Daumen unter den Fingern, verdeckt) |
| Nahaufnahmen (Skript im Arbeitsordner baut je Übung einmal und rendert mehrere Kameras; 560 px, 24 Proben, Scheiben ausgeblendet): Bankdrücken vom Fußende, von der Seite entlang der Stange, von oben, schräg, vom Kopfende; Kniebeuge hinten-seitlich und vorn-seitlich; Latziehen schräg von vorn und von der Seite; vorher mit dem Werkzeugstand D-439 (`git archive HEAD` in einen eigenen Ordner), Latziehen zusätzlich als Ring und über den Fingern | Von der Seite liegt der Daumen auf der Faust, kein Haken; vom Fußende schmal mit Nagel nach außen, Kuppe am Mittelfinger; von oben und schräg klar getrennt über Zeige- und Mittelfinger; Latziehen über den Fingern ohne Abstehen, darum übernommen; Handfoto daneben als privates Blatt (Arbeitsordner), Blatt `korrektur5-1-griff.webp` 189 KB, 1560 × 2246 |
| Ein Shorts-F (D-441): Nahaufnahmen des linken Oberschenkels mit der Kamera der App (Bankdrücken 45°/32°, Kniebeuge unten 45°/10°, Latziehen 135°/10°) und im Stand von links (90°/10°), 560 px, 24 Proben; vorher aus Runde 4 (Stand D-439) bzw. Stand neu gerendert aus dem archivierten Werkzeug; Standbilder der drei Pilot-Übungen (`varianten_bilder.py`, 720 × 540, 40 Proben) vorher und nachher | Nachher nur das vordere F: beim Latziehen und von links ein F statt zwei; Bankdrücken und Kniebeuge unverändert (dort war das seitliche F nicht im Bild). Standbilder Kniebeuge 17,5 / 16,5 s, Bankdrücken 25,2 / 23,0 s, Latziehen 17,4 / 17,5 s (vorher / nachher); Blätter `korrektur5-2-shorts-logo.webp` 79 KB (1560 × 950) und `korrektur5-3-player.webp` 82 KB (804 × 1502); alle Ansichten selbst angesehen |
| Personalisiertes Modell neu (D-442): Landmarken, Anpassung, Kopffassungen, Haarkurven, Vorschauen | Nachweise mit D-444 entfernt: Der Produktinhaber verwendet die personalisierte Variante nicht; Reglerwerte, Haarparameter, die Beschreibung des Aussehens und die aus Fotos und Referenzblatt gemessenen Maße stehen nicht mehr im Repository |
| Vergleichsblätter (D-443) aus `uebungen_korrektur_bild.py --runde 5` | `korrektur5-1-griff.webp` 189 KB (1560 × 2246), `korrektur5-2-shorts-logo.webp` 79 KB (1560 × 950), `korrektur5-3-player.webp` 82 KB (804 × 1502); alle Ansichten selbst angesehen; private Blätter (Griff mit Handfoto, C1 bis C3) als Dateien an den Produktinhaber |
| Dokumente je Paket (`pnpm check:docs`, Prettier), Werkzeuge kompiliert (`python3 -m py_compile` aller Dateien in `tools/uebungen-3d/` und `tools/uebungen_korrektur_bild.py`); D-440 zusätzlich `pnpm format:check`, `lint`, `typecheck`, `test`, `build`, `check:bundle` lokal | bestanden; Verweise auf noch nicht vorhandene D-Nummern vom Prüfskript gemeldet und umformuliert |
| Handfoto, Referenzblatt und abgeleitete Daten der Person nach dem Rendern gelöscht | gelöscht; ein Arbeitsbild mit einem Ausschnitt des Handfotos blieb dabei übersehen im Arbeitsordner, gelöscht mit D-444; seit D-444 sind auch Reglerwerte, Haarparameter und Werkzeuge der Variante entfernt |

### Phase Übungen, Nachricht nach Korrekturrunde 5 (Variante entfernt, Shorts-F frei, Daumen letzter Versuch) · 28.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1243)

Nachricht des Produktinhabers vom 28.10.2026 (mit dem Handfoto erneut als Anhang): personalisierte Variante vollständig entfernen und bestätigen, dass im aktuellen Stand keine Daten der Person liegen (D-444); Shorts-F (D-441) freigegeben; Daumen letzter Versuch mit zwei Hebeln, danach Halt. Das Handfoto liegt nur im Arbeitsordner der Sitzung.

| Nachweis | Ergebnis |
|---|---|
| Entfernen der Variante (D-444): Werkzeugdateien gelöscht, gemeinsame Dateien auf den Stand vor D-437 (`git checkout 1c6a1ee --` für `realistisch.py`, `varianten.py`, `render.py`, `.gitignore`, `.prettierignore`), danach Suche im Code nach `gesicht`, `haare`, `persoenlich`, `Cp`, `folgt` | keine Verweise mehr (Treffer nur `_abstand_gesicht` der Latziehen-Kamera, ein anderes Thema); `py_compile` aller Werkzeuge bestanden |
| Suche im ganzen aktuellen Stand (`git grep`) nach Merkmalen und Werten der Person: Begriffe für Haar, Bart, Brauen, Augen, Haut und Leberfleck, die Namen der Frisur- und Brauendateien, Selfie, Front- und Profilfoto, Referenzblatt, die Schlüssel `persoenlich` und `Cp` sowie die in den Runden 4 und 5 gemessenen Verhältnisse | übrig bleiben nur Hinweise, dass es die Variante gab und dass sie entfernt ist; drei kurze Erwähnungen von Bart und Brauen neutral umformuliert; keine Werte, keine Maße, keine Beschreibung des Aussehens |
| Arbeitsumgebung: Bilddateien der Sitzung außerhalb des Repositorys durchgesehen | ein Arbeitsbild aus Runde 5 mit einem Ausschnitt des Handfotos (`blatt-zoom.jpg`) war bei der damaligen Prüfung übersehen worden, jetzt gelöscht; die gespeicherten Bilder früherer Nachrichten zeigen App-Vorlagen und Render-Blätter, keine Person; archivierter Werkzeugstand mit den alten Reglerwerten, Umgebungen von MediaPipe und die nur für das Gesicht geladenen Formziele gelöscht |
| Daumen, letzter Versuch (D-445): Messung mit `tools/uebungen-3d/daumen_versuch.py messen` je Variante in Bankdrücken (Start), Kniebeuge (unten) und Latziehen (unten), rechte Hand im Rahmen der Stange; das Werkzeug gegen die Arbeitsskripte der Sitzung geprüft | gleiche Werte (Stichprobe „Endglied geklappt mit Hebel 1, 0,5“: Spalt 1,7 / 15,0 mm, Anteil 0,29, Daumen 46,4 / 46,2 / 35,9 mm von der Achse); Werte in der Tabelle unten; keine Variante ohne Spalt und ohne Überstand |
| Handproportion: Summe der drei Knochen je Finger in der Grundhaltung, Gewicht der Fingerlänge 0 / 0,3 / 0,5 | Zeigefinger 83,0 / 95,8 / 104,3 mm, Mittelfinger 96,5 / 107,6 / 115,0, Ringfinger 88,9 / 95,7 / 100,3, kleiner Finger 62,2 / 69,6 / 74,5, Daumen mit Mittelhandknochen 104,0 / 113,4 / 119,7; Mittelhand bis zum Mittelfinger 112,5 mm unverändert; offene Hand von innen und außen selbst angesehen: 0,3 natürlich, 0,5 lang (Finger etwa so lang wie die Handfläche) |
| Nahaufnahmen (560 px, 24 Proben, Kameras wie `nahaufnahme.py`, im Werkzeug `daumen_versuch.py bilder`): Bankdrücken fünf Ansichten für 14 Stände (darunter Zwischenstände mit verschobenem Daumenansatz und einzeln geklappten Gliedern), Kniebeuge und Latziehen je zwei für sechs Stände | alle selbst angesehen: Von der Seite steht der Daumen in jedem Stand als eigener Finger neben der Hand, mit nachgeklapptem Endglied berührt die Kuppe die Finger; von oben ragt die Daumenspitze in jedem Stand unter der Stange hervor; vom Fußende und schräg wie D-440 |
| Diagnose (Arbeitsskripte, nicht im Repository): Karte der Fingerhaut um die Stange mit der Daumenbahn, Ansicht genau entlang der Stange und radial von außen (orthografisch, ohne Stange), Gelenke in die Kamerabilder projiziert, Protokoll der Anhebung je Runde | mit Hebel 1 liegt unter fast der ganzen Daumenbahn Fingerhaut; die Konstruktion D-440 hebt die Spitze an, wenn das Endglied nahe dem Endgelenk in die Fingerknöchel ragt (bis 14,9 mm); die Beere ist an der Spitze 3,5 mm dick, in der Gliedmitte 12,0 mm, gerechnet werden 13,1 mm |
| Standbilder wie in der App (`daumen_versuch.py stand`, 720 × 540, 40 Proben) für Hebel 1 (0,5), Endglied geklappt ohne und mit Hebel 1; Stand D-440 aus Runde 5; Kiste der Hand mit `daumen_versuch.py handkiste` | Hand im großen Player (390 px) rund 15 bis 17 px groß; der Daumen ist dort in keinem Stand als eigene Form zu erkennen, Unterschiede zwischen den Ständen kaum zu sehen |
| Blätter (`uebungen_korrektur_bild.py --runde 6`) | `korrektur6-1-hebel.webp` 273 KB (1856 × 2198), `korrektur6-2-hand-player.webp` 126 KB (1202 × 1814); selbst angesehen, Beschriftungen nach einer Korrektur der Anordnung im zweiten Blatt lesbar |
| Griffblatt mit dem Handfoto (Handfoto links, Blatt 1 rechts) nur im Arbeitsordner gebaut und dem Produktinhaber geschickt; danach Handfoto, Vorschauen, Griffblatt und das hochgeladene PDF gelöscht; Arbeitsumgebung nach PDF, HEIC, Bildern mit Apple-Kennung und Bildern im Format des Fotos durchsucht | gelöscht; übrig nur Startbilder der App und Render-Blätter, keine Kopie des Handfotos |
| `pnpm format:check`, `pnpm check:docs`, `pnpm lint`, `pnpm typecheck`, `python3 -m py_compile` der geänderten Werkzeuge, `pnpm build`, `pnpm check:bundle`; App unverändert, E2E mit Chromium und WebKit in der CI | bestanden; Startansicht 237,8 KB von 250 KB, „Vorab gespeichert: 191 von 266 Dateien“, Dateien der Übungsbilder 12 von 12 |

Werte je Variante (Spalt: mittlere Lücke zwischen Daumen und Fingern im Blick entlang der Stange in mm, größter Wert, Anteil der Winkel über 1 mm; oben: Daumen über die Außenkante des Zeigefingers; Spitzen: Zeige- und Mittelfinger um die Stange; Handgelenk: Knick beim Bankdrücken am Start und am Ende). Beim Latziehen ragt der Daumen in keiner Variante über den Zeigefinger hinaus.

| Variante (Schalter von `daumen_versuch.py`) | Spalt Bankdrücken | Spalt Kniebeuge | Spalt Latziehen | Oben, Bankdrücken / Kniebeuge | Spitzen | Handgelenk |
|---|---|---|---|---|---|---|
| Stand D-440 (keine) | 3,7 / 15,0 / 60 % | 2,2 / 14,4 / 48 % | 4,0 / 19,0 / 43 % | 12,0 / 14,3 mm | 219° / 235° | 12,0° / 21,7° |
| Hebel 1 `--finger-lang 0.3` | 4,6 / 22,4 / 49 % | 3,6 / 17,6 / 45 % | 5,0 / 16,3 / 52 % | 12,1 / 14,3 mm | 243° / 253° | 12,0° / 21,7° |
| Hebel 1 `--finger-lang 0.5` | 2,8 / 15,0 / 37 % | 4,8 / 17,7 / 46 % | 5,0 / 19,8 / 54 % | 12,2 / 14,5 mm | 258° / 260° | 12,0° / 21,7° |
| Hebel 2 `--lage 0.74` | 1,8 / 10,2 / 35 % | 2,2 / 19,6 / 33 % | 4,3 / 18,8 / 41 % | 12,0 / 14,2 mm | 218° / 230° | 12,2° / 21,0° |
| Hebel 2 `--lage 0.80` | 2,7 / 15,1 / 40 % | – | – | 12,1 mm | 222° / 204° | 12,4° / 20,3° |
| Hebel 2 `--einsinken 0.012` | 3,1 / 27,7 / 44 % | – | – | 11,9 mm | 223° / 239° | 12,4° / 21,5° |
| Beide `--finger-lang 0.5 --lage 0.78` | 3,4 / 16,3 / 48 % | 3,7 / 15,6 / 43 % | 4,1 / 18,7 / 44 % | 12,3 / 14,6 mm | 258° / 241° | 12,3° / 20,6° |
| Beide `--finger-lang 0.5 --einsinken 0.012` | 2,7 / 14,2 / 39 % | – | – | 12,1 mm | 264° / 268° | 12,4° / 21,5° |
| Folgeänderung `--kuppe-klappen` | 1,6 / 14,4 / 32 % | 1,4 / 14,4 / 29 % | 3,4 / 19,0 / 38 % | 12,0 / 14,3 mm | 219° / 235° | 12,0° / 21,7° |
| Folgeänderung mit Hebel 1 (0,3) | 4,4 / 22,4 / 47 % | 2,5 / 15,0 / 39 % | 3,6 / 16,3 / 43 % | 12,1 / 14,3 mm | 243° / 253° | 12,0° / 21,7° |
| Folgeänderung mit Hebel 1 (0,5) | 1,7 / 15,0 / 29 % | 4,6 / 17,7 / 47 % | 3,8 / 19,8 / 48 % | 12,2 / 14,5 mm | 258° / 260° | 12,0° / 21,7° |
| Folgeänderung, Hebel 1 (0,5), `--daumen-seit -0.004` | 2,8 / 21,7 / 40 % | 4,4 / 23,0 / 57 % | 7,2 / 18,8 / 76 % | 6,6 / 8,9 mm | 258° / 260° | 12,0° / 21,7° |

Mit `--kuppe-klappen` liegen je nach Übung bis zu 11 Eckpunkte der Fingerhaut näher als 7,5 mm an den Daumenknochen (ohne die Folgeänderung in keiner Variante); das Handgelenk ändert sich mit Hebel 2 in Kniebeuge (14,4 bis 14,8° statt 16,0°) und Latziehen (16,9 bis 17,8° statt 16,5° am Ende) wenig.

### Phase Übungen, Entscheidung zum Daumen und neue Pilot-Übungen · 29.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1243)

Nachricht des Produktinhabers vom 29.10.2026: Nachklappen des Daumen-Endglieds übernehmen, längere Finger und andere Lage der Stange nicht; Git-Historie nicht umschreiben; die drei Pilot-Übungen in C männlich, Fassung A1, Brust-F 4 cm mit dem neuen Daumen neu rendern, in die App einbauen, Übersichtsbild und kurze Aufnahme schicken, dann Halt bis zum Gerätetest.

| Nachweis | Ergebnis |
|---|---|
| Nachklappen im Rig (D-446): `daumen_versuch.py messen` für Bankdrücken, Kniebeuge, Latziehen mit dem neuen `rig.py` und mit `--ohne-kuppe` | mit Nachklappen Spalt 1,6 / 14,4 mm / 32 %, 1,4 / 14,4 / 29 %, 3,4 / 19,0 / 38 %; Daumenspitze 37,7, 36,6 und 36,9 mm von der Achse; ohne 3,7 / 15,0 / 60 %, 2,2 / 14,4 / 48 %, 4,0 / 19,0 / 43 %: beides gleich wie im Versuch D-445; Überstand von oben 12,0 und 14,3 mm wie bisher; Handgelenk unverändert |
| Prüfung der Pilot-Übungen in der Figur der App (D-447): `render.py <übung> --pruefen` mit `FIGUR` = `Cm-A1` (C männlich, A1, Brust-F 4 cm, Daumen D-446), Messwerte über alle 60 Bilder, Prüfansichten vorn, Seite, Standard in fünf Phasen, Griff aus der Nähe; Prüfseiten mit `tools/uebungen_pruef_bild.py` | Kniebeuge: Knie 176° bis 75,3°, Oberschenkel unten waagrecht (0,0°), Rumpf 6° bis 44°, Stange über der Fußmitte 0,0 cm in allen Bildern, Knie zur Zehenrichtung −1,8 bis +0,1°, Handgelenk 16,0°, Fuß tiefster Punkt 0 mm, Verschiebung höchstens 2,7 mm. Bankdrücken: Ellbogen 172° bis 45,7°, Oberarm zum Rumpf 85° bis 68°, Unterarm höchstens 19,1° aus der Senkrechten, Handgelenk 12,0° bis 39,5° (größter Knick in der Mitte der Bewegung, bis D-430 höchstens 27°), Stange bis zum Brustkontakt (0,0 cm), Füße 0 mm. Latziehen: Ellbogen 168° bis 48,9°, Unterarm höchstens 24,8°, Handgelenk höchstens 16,5°, Lehne 8° bis 18°, Füße 0,1 mm. Finger in allen drei 4,4 bis 5,1 mm in die Stange eingesunken (Absicht seit D-435); keine Meldung des Rigs; Prüfseiten selbst angesehen, kein Durchdringen von Stange, Stoff und Haut zu sehen |
| Schleifen in der Figur der App (D-447): `render.py kniebeuge`, `bankdruecken`, `latziehen` (60 Bilder, 720 × 540, 40 Samples, ein Prozess auf vier CPU-Kernen), Kontaktbogen aller 60 Bilder je Übung, Abweichung zwischen erstem und letztem Bild | Renderzeit 946 s, 1.268 s und 1.049 s; Kontaktbögen selbst angesehen: Bewegung gleichmäßig, kein Sprung; erstes und letztes Bild ohne Unterschied (mittlere Abweichung 0,0), Schleifen nahtlos. Größen MP4 / WebM / Poster / Vorschau: Kniebeuge 72,1 / 62,8 / 7,3 / 4,8 KB, Bankdrücken 52,6 / 46,4 / 8,8 / 4,5 KB, Latziehen 59,6 / 57,0 / 9,6 / 4,5 KB, zusammen 390,1 KB (D-408: 270,0 KB) |
| `pnpm build`, `pnpm check:bundle` (D-447) | bestanden; Startansicht 237,8 KB von 250 KB (unverändert), vorab gespeichert 191 von 266 Dateien, Dateien der Übungsbilder 12 von 12 |
| E2E lokal, Chromium (`pnpm test:e2e`, chromium-desktop und chromium-mobile) mit der Änderung in `switches.spec.ts` (D-447) | 432 bestanden, 132 übersprungen, 0 fehlgeschlagen (15,3 min) |
| CI Lauf 333 zu cfbee88 (D-446) | rot nur in E2E (webkit): `switches.spec.ts:166` „Übungsfortschritt: ‚Als Tabelle‘ bleibt nach Neuladen“ zweimal (mit Wiederholung) „Konsolenfehler im Browser“, empfangen „/localhost:4173/uebungen/medien/bankdruecken.webm due to access control checks.“; sonst 399 bestanden, 164 übersprungen; Ursache und Änderung des Tests in D-447; die anderen Jobs grün |
| CI Lauf 334 zu 3fe7bd5 (D-447, Teil 1) | alle Jobs grün, auch E2E (webkit) mit dem unveränderten Test |
| Bilder und Aufnahmen der App (D-448): `node tools/pilot-screens.mjs` gegen `pnpm preview` (Build mit allen drei neuen Schleifen) | 10 Bilder und Übersicht, Laufzeit 1 min 26 s; Aufnahme des Players 224 Bilder mit 18 je Sekunde, 12,4 s, MP4 98,9 KB, WebM 309,7 KB; `pilot-bewegung.mp4` 7,5 s, 1440 × 360, 229,9 KB; Übersicht 2636 × 1970, 555,3 KB. Alles selbst angesehen, auch als Kontaktbogen der Aufnahmen: Liste mit Vorschaubild, Player zugeklappt mit Bild in „Jetzt“, aufgeklappt mit großer Schleife, Übungsdetails mit Schleife oben, überall die neue Figur; in der Aufnahme bewegen sich alle drei Übungen; kein Symbol statt Bild |
| CI Lauf 336 zu 122b5d6 (D-448) | alle vier Jobs grün, auch E2E (webkit); der Lauf 335 zu 7147e45 wurde vom nächsten Commit abgebrochen (wie in der CI vorgesehen) |

### Phase Übungen, neue Kleidung nach dem Design-Board · 29.10.2026, Cloud-Umgebung (Node 22.22, Chromium 1243)

Auftrag des Produktinhabers vom 29.10.2026 (`docs/prompts/uebungen-kleidung-neu-FORM.md`, Board `docs/prompts/uebungen-kleidung-neu-board.png`): Muskelzonen nur noch in der Muskelkarte, Kleidung 1:1 nach dem Board mit Socken und Schuhen, Bodenkontakt über die Sohle, Handgelenk beim Bankdrücken annähernd gerade; zuerst Standbilder, dann Halt.

| Nachweis | Ergebnis |
|---|---|
| Ohne Muskelzonen (D-449): `py_compile` aller Werkzeuge, Standbild Kniebeuge unten in der Figur der App (`varianten_bilder.py Cm-A1 kniebeuge 1.0`, 480 × 360, 16 Samples) | kompiliert; im Bild kein Lime auf Haut und Stoff, Logos wie bisher; Aufbau und Bild 24 s |
| Kleidung nach dem Board (D-450): `py_compile` aller Werkzeuge; Ruhehaltung orthografisch von vorn, hinten und von der Seite in der Figur der App (C männlich, 600 × 900, 24 Samples), Maße am verformten Netz | kompiliert; Shirt W 35,4 cm (gemessen 35,75), Taille 0,929 W (Board 0,945), Saum 1,069 W (Board 1,07), Länge 64,1 cm = 1,81 W (Board 1,83, Saum 3 cm über dem Schritt); Shorts B 29,2 cm (gemessen 29,1), Länge 1,294 B (Board 1,29), Saum 1,519 B (Board 1,52); Brust-F 4,43 cm, Rücken-F 14,16 cm, Wortmarke 22,47 cm, Oberkante des F 11,68 cm unter dem Bündchen, Shorts-F 4,66 cm; Socke 29 cm über dem Boden, 5,0-mal die schmalste Breite des Schafts (Board 4,3 bis 5,5). Bilder neben dem Board angesehen: Schnitt, Aufteilung und Logos wie auf dem Board |
| Farben im Licht der Szene (D-450): Reihe mit Sheen, Glanz und Rauheit (0,35/0,5/0,82, 0,2/0,5/0,82, 0,1/0,5/0,82, 0,2/0,3/0,85, 0,1/0,25/0,88), je Grundfarbe Schwarz und #1E2124; Median im Bild von vorn am Bauch (Tee) und an den Shorts | mit Schwarz als Grundfarbe im Bild Tee #2F2F2F, #2D2D2D, #2C2C2C, #222222, #1C1C1C (der Glanz hellt unabhängig von der Grundfarbe auf); gewählt 0,1/0,25/0,88 mit Grundfarben #1B2023 und #11171C: Tee #2A2E30 von vorn, #2A2D30 von hinten (Ziel #2A2D30), Shorts #202326 (Board #202326); vorher mit #2A2D30 und 0,35/0,5/0,82 Tee #414345 |
| Standbilder in der Kamera der App (D-450): `varianten_bilder.py Cm` Kniebeuge 1,0, Bankdrücken 0,0 und 1,0, Latziehen 1,0 (720 × 540, 32 Samples) | angesehen: Kleidung, Socken und Schuhe in allen drei Übungen, Tee anthrazit, Shorts fast schwarz, Streifen und Logos in Lime, Schuhe weiß mit schwarzen und Lime-Akzenten. Renderzeit je Bild 14,4 s (Kniebeuge), 19,3 und 18,8 s (Bankdrücken), 13,8 s (Latziehen), Aufbau 7,5 bis 9,3 s |
| Füße und Schuhe vorher (D-451, Stand D-450): Nahaufnahmen des linken Fußes in Ruhehaltung, Kniebeuge unten, Bankdrücken oben, Latziehen unten (vorn, außen, hinten, innen, vorn oben; 480 × 400, 32 Samples); Abstand des Kragens zur Socke in der Ruhehaltung | innen an Ferse und Gewölbe zerklüftete Sohle, vorn an der Spitze offen; oben an der Zunge ein schwarzer Spalt (Blick in den Schuh); Außenseite des Kragens bis 9,2 mm unter der Socke, 46 von 48 Randpunkten weniger als 2 mm über ihr; beim Bankdrücken drückte die Wade 1,8 mm in die Fersenlasche |
| Füße und Schuhe nachher (D-451): dieselben Nahaufnahmen, dazu die Spitze von vorn-außen, außen und vorn | Sohle geschlossen und glatt, an der Ferse Einsatz in Lime, davor schwarzer Keil, unten die schwarze Laufsohle mit Zehenkappe; Kragen und Zunge liegen außen auf der Socke, kein Spalt; die Fersenkappe hinten ohne Futter von innen |
| Prüfung über alle 60 Bilder je Übung (D-451): `render.py <übung> --pruefen` für Kniebeuge, Bankdrücken, Latziehen (Messwerte, 15 Prüfansichten, 6 Ansichten der Hand, 8 Nahaufnahmen des Fußes, 480 × 360, 16 Samples) | keine Meldung des Rigs; Sohle in allen drei Übungen an Ferse und Ballen beidseitig 0,00 mm über dem Boden, tiefster Punkt 0,00 mm, Verschiebung über die Schleife 0,1 / 0,0 / 0,1 mm; Fuß im Schuh 26,96 mm über dem Boden. Kniebeuge: Stange über der Fußmitte 0,00 cm, über der Mitte der Sohle 0,11 cm; Knie zur Zehenrichtung −1,82 bis +0,11°; Knie 6,14 bis 17,47 cm hinter der Zehenspitze, 6,86 bis 18,19 cm hinter der Schuhspitze; Unterschenkel 8,6 bis 18,1° zur Senkrechten. Kragen innen über der Socke mindestens 1,08 / 0,95 / 1,30 mm; Socke über der Haut mindestens 2,86 / 2,76 / 2,96 mm; Löcher über dem Schuh 0 / 0 / 0; Socke zu den Shorts mindestens 13,72 / 21,18 / 19,45 cm. Laufzeit 227 / 235 / 214 s. Nahaufnahmen der Füße angesehen: Sohle flach und geschlossen, Kragen auf der Socke |
| Standbilder in der Kamera der App nach D-451 (`varianten_bilder.py Cm`, 720 × 540, 32 Samples) | angesehen, Schuhe und Socken in allen drei Übungen ohne Fehler; Renderzeit 14,0 s (Kniebeuge), 17,7 und 18,4 s (Bankdrücken), 13,6 s (Latziehen) |
| Handgelenk beim Bankdrücken zerlegt (D-452): Winkel zwischen Unterarm und Längsachse der Mittelhand (Handgelenk → Grundgelenk des Mittelfingers) in 21 Phasen, Streckung (zum Handrücken) und seitlich (zum Daumen positiv), Stange zur Linie des Unterarms | Hilfsachse des Rigs (`laengs`) 14,2° neben der Längsachse der Mittelhand. Stand D-451: Streckung 10,0 bis 16,7°, seitlich −22,9 bis +9,9°, gesamt bis 27,0° (an der Hilfsachse bis 39,4°); Unterarm in der Mitte der Bewegung bis 18,4° zur Seite gekippt, Ellbogen 8,4 cm außerhalb der Hand |
| Raster für den Griff (D-452): Lage 0,38 / 0,45 / 0,52 / 0,60 / 0,68 × Schräge −6 / 0 / 6 / 12 / 18° × Ziel der Streckung 0 / 6 / 12° (75 Einstellungen), fein Lage 0,60 / 0,62 / 0,65 / 0,68 × Schräge 10 / 12 / 14 / 18° × Ziel 4 / 6 / 12° (48), dazu Neigung des Unterarms 0 / 4 / 8 / 12° (8); je 21 Phasen, Figur der App ohne Kleidung, je 6 s | Streckung folgt dem Ziel (Ziel 6°: rund 3 bis 11°); seitlich am kleinsten bei Schräge 12° (−15,4 bis +16,9°); Daumen in der Stange ab Lage unter 0,65 (0,62: bis 5,8 mm, 0,60: bis 6,4 mm, 0,38: bis 12,4 mm), bei 0,65 und 0,68 ohne Kontakt; Neigung des Unterarms nach außen: Mitte −17,5 → −13,5°, Oberarm bis 93° abgespreizt. Gewählt: Lage 0,65, Schräge 12°, Ziel 6° |
| Prüfung über alle 60 Bilder je Übung nach D-452 (`render.py <übung> --pruefen`) | keine Meldung des Rigs. Bankdrücken: Handgelenk gestreckt 4,26 bis 9,25°, seitlich −15,47 bis +16,91°, gesamt 4,58 bis 18,19° (an der Hilfsachse 5,92 bis 30,55°, vorher 12,04 bis 39,47°); Unterarm zur Senkrechten bis 17,82° (vorher 19,06°); Oberarm zum Rumpf 72,2 bis 86,9°; Finger geringster Abstand −4,06 mm (wie bisher eingedrückt). Kniebeuge unverändert, Handgelenk gesamt 21,40°, gestreckt 16,50°, seitlich +14,38°; Latziehen unverändert, gesamt 2,89 bis 30,62°, gestreckt −2,34 bis +2,76°, seitlich 2,46 bis 30,56° (Endposition). Laufzeit 392 / 355 / 229 s |
| Bilder des Handgelenks vorher und nachher (D-452): Bankdrücken von der Seite längs der Stange (Scheiben, Hülsen und Verschlüsse ausgeblendet) und vom Fußende in den Phasen 0, 0,25, 0,5, 0,75, 1 (480 × 480, 32 Samples); Griffblatt (vom Fußende, Seite, oben, schräg, Kopfende) in den Phasen 0, 0,5, 1 | angesehen: von der Seite knickt die Hand vorher in der Mitte der Bewegung sichtbar nach hinten, nachher bildet sie mit dem Unterarm fast eine Linie; vom Fußende weniger seitliches Abknicken; im Griffblatt liegt die Stange etwas tiefer in der Hand, der Daumen wie freigegeben über den Fingern, keine Durchdringung zu sehen |
| Figur neben dem Board (D-453): `kleidung_bilder.py stand`, Ruhehaltung orthografisch von vorn und von hinten (600 × 900, 48 Samples) | neben dem Board angesehen: Schnitt, Farben, Aufteilung, Lage und Größe der Logos wie auf dem Board; Shirt 1 % kürzer und Rückenlogo im Verhältnis des Boards wie in D-450 beschrieben; Rundhals hinten mit dem Bündchen aus D-431 flach am Hals. Renderzeit 16,4 s (vorn) und 15,3 s (hinten), mit Aufbau 38,9 s |
| Nahaufnahmen (D-453): `kleidung_bilder.py nah`, Ruhehaltung (560 × 560, 48 Samples): Brust-F, Rückenlogo, Shorts von vorn und von der Seite, Socke, Schuh von außen und von innen | angesehen: Logos scharf und unverzerrt, Seitenstreifen zum Saum breiter, F vorn am linken Bein; Socke mit schwarzem F außen, die schwarze Spitze liegt im Schuh und ist in keinem Bild zu sehen; Schuh mit schwarzem F, schwarzer Fersenkappe, Fersenlasche und Einsatz in Lime, Sohle geschlossen. Renderzeit je Bild 16,2 bis 25,6 s, zusammen 145,5 s |
| Standbilder in der Größe des Players (D-453): `varianten_bilder.py Cm` Kniebeuge 1,0, Bankdrücken 0,0 und 1,0, Latziehen 1,0 (720 × 540, 40 Samples wie die Schleifen), im Blatt auf 390 px und 56 px verkleinert | angesehen: im großen Player Kleidung, Streifen und Logos klar; im kleinen Player Figur, Gerät, weiße Schuhe und Socken erkennbar, Logos nicht. Renderzeit je Bild 16,4 s (Kniebeuge), 21,3 und 21,9 s (Bankdrücken), 16,8 s (Latziehen), Aufbau 7,4 bis 9,7 s; PNG 336 bis 371 KB |
| Handgelenk vorher und nachher (D-453): `kleidung_bilder.py handgelenk` mit `--vorher` (Griff D-451) und ohne (D-452), Phasen 0 / 0,25 / 0,5 / 0,75 / 1 von der Seite und vom Fußende (480 × 480, 32 Samples) | Winkel an der Längsachse der Mittelhand. Vorher gestreckt 11,4 / 10,3 / 15,4 / 16,4 / 14,1°, seitlich +9,9 / −16,8 / −22,9 / −17,8 / −2,5°, gesamt 15,0 / 19,4 / 26,8 / 23,6 / 14,3°. Nachher gestreckt 7,1 / 4,3 / 7,5 / 9,2 / 7,5°, seitlich +16,9 / −8,9 / −15,4 / −11,0 / +3,5°, gesamt 18,2 / 9,8 / 17,0 / 14,2 / 8,2°. Angesehen: von der Seite bilden Hand und Unterarm nachher fast eine Linie, die Stange liegt über dem Unterarm. Laufzeit 116,6 und 111,6 s |
| Griffblatt vorher und nachher (D-453): `kleidung_bilder.py griff` mit und ohne `--vorher`, Phasen 0 und 0,5, vom Fußende, von der Seite, von oben, schräg und vom Kopfende (480 × 480, 32 Samples) | angesehen: nachher liegt die Stange flacher und etwas tiefer in der Hand, der Daumen nachgeklappt über den Fingern wie freigegeben, kein Teil der Hand sichtbar in der Stange. Laufzeit 126,8 und 126,7 s |
| Blätter (D-453, `uebungen_korrektur_bild.py --runde 7`) | `kleidung-1-board.webp` 63 KB (2030 × 1038), `kleidung-2-nah.webp` 48 KB (1640 × 990), `kleidung-3-player.webp` 54 KB (804 × 1030), `kleidung-4-handgelenk.webp` 134 KB (1548 × 1494), `kleidung-5-griff.webp` 124 KB (1548 × 1494); alle selbst angesehen, Beschriftungen lesbar |
| CI Lauf 337 zu a444420 (D-449), 338 zu ad73cff (D-450), 339 zu 337f2fc (D-451) und 340 zu 465b84f (D-452) | alle vier Jobs grün, auch E2E (webkit) |
| `pnpm format:check`, `pnpm check:docs`, `python3 -m py_compile` der geänderten Werkzeuge, `pnpm build`, `pnpm check:bundle` (D-453); App unverändert, E2E mit Chromium und WebKit in der CI | bestanden; Startansicht 237,8 KB von 250 KB, „Vorab gespeichert: 191 von 266 Dateien“, Dateien der Übungsbilder 12 von 12 |

