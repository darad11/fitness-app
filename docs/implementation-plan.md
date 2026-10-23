# Implementierungsplan

Stand: 18.10.2026 · Version 0.4 (M1 in Arbeit) · Status: vorläufig freigegeben · Vorgänger: `archive/v0.1-phase-1/implementation-plan.md`

## Änderungen gegenüber Version 0.1

- Meilensteine neu geschnitten: M0 (Basis und PWA), M1 (Training auf dem iPhone), M2 bis M4 (MVP vollständig), danach M5 bis M13 für R2 bis R4.
- Jeder Meilenstein hat Arbeitspakete, zugeordnete Akzeptanzkriterien (AK) und eine prüfbare Abnahme.
- PWA-Installation und Offline-Start liegen in M0, Export und Snapshots in M1.
- Synchronisierung (R3) liegt vor Fortschritt, Aktivität und Gewohnheiten (D-219).

## 1. Arbeitsweise

- Kleine, überprüfbare Arbeitspakete (AP). Nach jedem AP folgt ein Bericht nach der Vorlage in Abschnitt 8.
- Die Funktionsmatrix steuert den Fortschritt: Status „Zur Umsetzung ausgewählt" → „Implementiert" → „Getestet" → „Abgenommen". Abgenommen wird durch den Produktinhaber auf dem Zielgerät.
- Es gilt die Definition of Done aus `requirements.md` Abschnitt 9. Eine Schaltfläche ohne Aktion, ein Diagramm mit Beispieldaten oder eine nur behauptete Funktion zählen nicht.
- Testergebnisse werden wörtlich berichtet, auch Fehlschläge.
- Größen: S unter 1 Tag, M 1 bis 3 Tage, L 3 bis 7 Tage, XL über 1 Woche. Sie dienen der Reihenfolge, nicht als Zusage.
- Code entsteht erst mit Repository (Q-01). Ausnahme M0: Weil das Repository beschlossen ist, aber erst vom Produktinhaber angelegt werden kann, entsteht M0 lokal mit Git-Historie und wird zusätzlich als Archiv übergeben, damit nichts verloren geht.
- Ab M1 arbeitet je Meilenstein oder größerem Arbeitspaket eine eigene Sitzung (D-238). Sie liest zuerst `CLAUDE.md` und diesen Plan, arbeitet auf einem eigenen Branch und endet mit einem Pull Request, dessen CI grün ist, und mit nachgetragenem Stand in den Dokumenten.

## 2. Abweichungen von der Phasenreihenfolge des Auftrags

| Abweichung | Grund |
|---|---|
| PWA-Installation und Offline-Start in M0 statt in Phase 7 | Der erste Meilenstein soll auf dem iPhone im Alltag nutzbar sein (D-101) |
| Export und Snapshots in M1 | Ab M1 entstehen echte Daten; ohne Sync ist der Export die einzige Sicherung |
| Sync-Metadaten ab Schema v1 | Spart eine spätere Migration aller Daten (D-019) |
| Übungsbibliothek vor dem Trainingsplayer | Der Player braucht Übungen |
| Synchronisierung (R3) vor Fortschritt, Aktivität und Gewohnheiten (R4) | Ab Wochenmenü und Einkaufsliste wird Mehrgerätenutzung zum Normalfall; R4-Module entstehen mit getesteter Sync (D-219) |

## 3. Voraussetzungen

| Voraussetzung | Benötigt für | Verantwortlich |
|---|---|---|
| Privates GitHub-Repository (Q-01) | Dauerhafte Ablage, CI mit WebKit, Auslieferung | Produktinhaber legt an oder gibt frei; ich übernehme den Inhalt |
| Hosting mit fester Adresse (Q-02, Vercel) | Nutzung auf dem iPhone | Produktinhaber verbindet Vercel einmalig mit dem Repository; ich liefere die Anleitung |
| Gerät für Gerätetests | Abnahme von M0, M1, M4 | Produktinhaber |
| Durchsicht Basisübungen und Vorlagen (Q-05, Q-06) | Vor Abschluss von M1 | Produktinhaber |

## 4. Release R1: Trainings-MVP

### M0 · Projektbasis, Auslieferung, PWA-Grundlage (Größe M bis L)

Ziel: Eine installierbare App-Shell startet offline unter der festen Produktivadresse; CI ist grün.

| AP | Inhalt | Größe |
|---|---|---|
| 0.1 | Repository und Werkzeuge: pnpm, Vite 8, React 19, TypeScript 6 strict, ESLint 10 mit Modulgrenzen, Prettier, Vitest 5, Playwright 1.64; GitHub-Actions-Workflow mit Node 24 (Lint, Typprüfung, Unit, E2E Chromium und WebKit, Build) | S |
| 0.2 | Hosting: `vercel.json` mit Weiterleitungen, Sicherheits-Headern und Caching; Etikett „Vorschau – Testdaten" für Vorschau-Adressen; Vercel-Projekt durch den Produktinhaber verbunden (D-231) | S |
| 0.3 | Designsystem-Basis: Tokens hell und dunkel, Typografie, Basiskomponenten, Kontrastprüfung als automatischer Test | M |
| 0.4 | App-Shell: Router 8 im Data Mode mit nachgeladenen Bereichen, Tab-Leiste und Seitenleiste, Mehr mit Installieren und Über, Fehlergrenzen, deutscher Textkatalog, Formatierung nach Gerätesprache | M |
| 0.5 | PWA: Manifest, Icons mit Arbeitstitel, Service Worker mit Vorab-Cache und Navigations-Fallback, Update-Hinweis, Erkennung des Safari-Tabs mit Installationshinweis | S |
| 0.6 | Datenbasis: Dexie-Schema v1 mit allen MVP-Tabellen, Basis-Repository (HLC, Tombstones, Schemaversion, Zod), Geräte-ID, UUID v5, Textnormalisierung, Gesundheitsprüfung, Gerüst der Snapshot-Datenbank | M |

AK: AK-PWA-01, AK-PWA-02 (Shell), AK-PWA-03 (Basis), AK-PWA-04, AK-PWA-06, AK-PWA-07, AK-SET-04, AK-SET-06, AK-DAT-11.

Abnahme M0: CI grün mit Chromium und WebKit; Produktivadresse erreichbar; Gerätetest T-IPH-M0 (Installation und Offline-Start) durch den Produktinhaber bestanden.

**Stand M0 (18.10.2026):** Umgesetzt und über den Pull Request darad11/fitness-app#1 nach `main` gemergt; ausgeliefert unter https://fitness-app-mu-drab.vercel.app. Ergebnisse in `testing.md` Abschnitte 7 und 10.

| AP | Stand |
|---|---|
| 0.1 | Umgesetzt. Werkzeuge, Lösungs-`tsconfig` mit App- und Node-Teil, ESLint mit Modulgrenzen, Prettier, Vitest mit Abdeckungsschwellen, Playwright; CI in GitHub Actions am 18.10.2026 grün mit Chromium und WebKit (nach einer Korrektur, siehe `testing.md` Abschnitt 10) |
| 0.2 | Umgesetzt. `vercel.json` (Weiterleitung, Sicherheits-Header, Caching), Etikett „Vorschau – Testdaten"; Vercel mit dem Repository verbunden; Produktivadresse `https://fitness-app-mu-drab.vercel.app`; Vorschau-Builds der Branches erfolgreich |
| 0.3 | Umgesetzt. Tokens hell und dunkel, Typografie, Basiskomponenten (Button, ButtonLink, Card, PageHeader, LinkList, Banner, SegmentedControl, SelectField, StatusList), automatischer Kontrasttest; zwei Tokens angepasst (D-236) |
| 0.4 | Umgesetzt. Router 8 im Data Mode mit nachgeladenen Seiten, Tab-Leiste und Seitenleiste (nur verfügbare Bereiche), Mehr, Einstellungen (Darstellung, Formatierung), Installieren, Über, Fehlergrenzen, Textkatalog, Formatierung nach Gerätesprache |
| 0.5 | Umgesetzt. Manifest, Icons, Service Worker mit Vorab-Cache und Navigations-Fallback, Update-Hinweis mit Bestätigung, Hinweis im Safari-Tab, Installationsknopf in Chromium |
| 0.6 | Umgesetzt. Dexie-Schema v1 mit allen MVP-Tabellen, Basis-Repository (HLC, Tombstones, Schemaversion, Zod, unbekannte Felder bleiben), Geräte-ID, UUID v5, Textnormalisierung, Gesundheitsprüfung mit kontrolliertem Neustart, Snapshot-Datenbank, Fehlerprotokoll |

Abnahme am 18.10.2026: CI grün mit Chromium und WebKit, Produktivadresse erreichbar, Gerätetest T-IPH-M0 mit iOS 27.0.1 in allen vier Schritten bestanden, einschließlich Update-Hinweis. M0 ist damit vollständig abgenommen.

Nachtrag vom 18.10.2026: Nach der Abnahme war E2E Chromium in der CI unzuverlässig (3 von 12 Ausführungen rot, WebKit immer grün). Ursache waren ein Wettlauf im Test zum Safari-Hinweis und eine kurz falsche Auswahl auf der Einstellungsseite während des Ladens. Behoben über darad11/fitness-app#4 mit einem Platzhalter beim Laden (`Skeleton`, D-239) und angepassten Tests; Einzelheiten in `testing.md` Abschnitt 10.

### M1 · Training auf dem iPhone (Größe XL) – wichtigster Meilenstein

Ziel: Ein echtes Training wird auf dem iPhone protokolliert. Erledigte Sätze überstehen Reload, Wechsel in den Hintergrund, Sperrbildschirm und Offline-Phasen. Die Daten lassen sich exportieren.

| AP | Inhalt | Größe |
|---|---|---|
| 1.1 | Basisbibliothek mit etwa 100 deutschen Übungen (gebündelt, validiert), Suche und Filter, Bibliotheksansicht, Übungsauswahl | M |
| 1.2 | Beispielvorlagen aus `sample-templates.md` als gebündelte Daten, Vorlagenliste und -detail, „Nur heute trainieren" | S |
| 1.3 | Trainings-Domain: Zod-Modell, Anwendungsfälle (starten, Übung und Satz hinzufügen oder entfernen, Werte setzen, erledigt, rückgängig, übersprungen, beenden, verwerfen), Invarianten, Berechnungen (Volumen, bester Satz, 1RM), Projektion `exerciseHistory` | L |
| 1.4 | Trainingsplayer: Kopf, Übungsblöcke, Satzzeilen mit Aufwärm- und Arbeitssätzen, Vorschläge, freie Reihenfolge, Fortschritt, Aktionsleiste | L |
| 1.5 | Pausentimer auf Basis von Endzeitpunkten mit nächstem Satz, ±15 s, Überspringen; Wake Lock mit Neuanforderung; Ton über Web Audio mit Audio-Session „ambient" | M |
| 1.6 | Persistenz und Wiederaufnahme: Entprellung 300 ms, sofortiges Schreiben beim Verbergen, Gesundheitsprüfung bei Rückkehr, kontrollierter Neustart, Leiste „Training läuft", Rücksprung, Speicherfehler-Hinweis, dauerhafter Speicher | M |
| 1.7 | Verlauf als Liste und Detail, Zusammenfassung (ohne Vergleich), Dashboard-Basis (Training läuft, Starten, Leerzustand), Trainingseinstellungen | M |
| 1.8 | Datensicherung: JSON-Export über Teilen-Menü bzw. Download, Snapshot vor Schema-Upgrade, Fehlerprotokoll, Gerüst für Migrationstests | S |
| 1.9 | Tests: Unit und Integration für Domain und Berechnungen; E2E für Start, Sätze, Reload, Fortsetzen, Offline, Sichtbarkeitswechsel, Beenden; WebKit in CI; Gerätetest T-IPH-M1; Befunde in `known-limitations.md` | M |

AK: AK-TRN-01, AK-TRN-02, AK-TRN-03 (Aufwärm- und Arbeitssätze), AK-TRN-04 bis AK-TRN-08, AK-TRN-09 (hinzufügen, entfernen), AK-TRN-10 bis AK-TRN-13, AK-TRN-15 bis AK-TRN-17, AK-TRN-19, AK-TRN-20 (Basis), AK-TRN-21, AK-TRN-22, AK-TRN-25, AK-TRN-26, AK-EXL-01, AK-EXL-02, AK-PRG-06 (Beispielvorlage starten), AK-PWA-02, AK-PWA-05, AK-DSH-01, AK-DSH-03, AK-HIS-01, AK-HIS-02, AK-DAT-01, AK-DAT-06 (Erstellung), AK-DAT-07, AK-SET-02 (Training), AK-UX-03, AK-DEV-01, AK-DEV-03.

Abnahme M1: Alle genannten AK bestanden; Gerätetest T-IPH-M1 vom Produktinhaber bestanden und ausgewertet. Ab hier ist die Produktivadresse für echte Trainings freigegeben.

**Stand M1 (18.10.2026):** In Arbeit auf dem Branch `m1-training`, Pull Request darad11/fitness-app#5 (Entwurf). Ergebnisse in `testing.md` Abschnitt 10.

| AP | Stand |
|---|---|
| 1.1 | Umgesetzt bis auf die Übungsauswahl. Basisliste vom Produktinhaber durchgesehen (Q-05, `exercise-library.md`), 105 Übungen als gebündelte, mit Zod geprüfte Daten (D-240, D-241); Suche mit Rang, Filter nach Hauptmuskel und Gerät, Bibliotheksansicht `/uebungen` (S-12) über den Bereich Training (D-242). Die Übungsauswahl im Training (ExercisePicker) entsteht mit dem Trainingsplayer in AP 1.4, weil sie erst dort eine Funktion hat |
| 1.2 | Umgesetzt bis auf „Nur heute trainieren". Die vier Beispielvorlagen sind gebündelte Daten, erzeugt aus `sample-templates.md` und in `pnpm check:docs` geprüft (D-243); Liste `/training/programme` (S-04, nur Beispielvorlagen) und Vorlage `/training/vorlagen/:key` (S-49) mit Etikett „Beispiel", Hinweis, Ablauf und Satzschema. „Nur heute trainieren" kommt mit AP 1.3 und 1.4, weil es eine laufende Einheit und den Player braucht |
| 1.3 | Umgesetzt (ohne Oberfläche, die mit AP 1.4 folgt). Zod-Modell der Einheit; Anwendungsfälle starten (aus einem Vorlagentag oder frei), Übung und Satz hinzufügen oder entfernen, Werte setzen, erledigt mit Vorschlägen, rückgängig, übersprungen, Pausentimer mit Endzeitpunkt (±, überspringen, Drop-Kette), beenden mit Rückfrage bei offenen Sätzen, verwerfen und wiederherstellen; Invarianten (eine laufende Einheit, abgeschlossene unveränderlich, Drop-Sätze mit Arbeitssatz); Berechnungen (Volumen, bester Satz, 1RM, Dauer, Fortschritt, nächster offener Satz); Projektion `exerciseHistory` beim Abschluss in derselben Transaktion, Vorwerte je Satzplatz (D-244) |
| D1 | Umgesetzt (18.10.2026): Designsystem 2.0 nach `ux-audit.md` (D-246): Tokens, Tailwind-Theme, Grundkomponenten, alle bestehenden Seiten; Bildschirmfotos hell und dunkel geprüft |
| D2 | Umgesetzt (18.10.2026): Premium-Player mit Bühne „Jetzt“, Pause als Bühne mit Vollansicht, Ton und Wake Lock (D-247); ersetzt AP 1.5. Gerätebefund zu Ton und Wake Lock steht aus (T-IPH-M1) |
| 1.4 | Umgesetzt bis auf die Pausenleiste (AP 1.5). Player `/training/einheit/:id` als Vollbild mit Kopf (Titel, Dauer, Fortschritt), Übungsblöcken mit Vorwert und „Erstes Mal", Satzzeilen je Erfassungsart mit Vorschlägen als Platzhalter, erledigt, rückgängig, überspringen, entfernen, ±-Tasten, Satz und Übung hinzufügen (Übungsauswahl S-39), Übung entfernen mit Rückfrage, Aktionsleiste, Beenden mit Rückfrage, Verwerfen mit 10 s Rückgängig; Einstiege „Freies Training starten", „Training fortsetzen" und „… heute trainieren" in der Vorlage; einfache Zusammenfassung (Teil von AP 1.7); Fehlerhinweis am Satz mit „Erneut versuchen" (D-245) |
| 1.5 | Umgesetzt als AP D2 |
| 1.6 | Umgesetzt (18.10.2026): Leiste „Training läuft“ mit Rücksprung, Karte auf „Heute“, dauerhafter Speicher; Gesundheitsprüfung und kontrollierter Neustart bestanden schon aus M0 |
| 1.7 | Umgesetzt (18.10.2026): Verlauf mit Detail, „Heute“ mit Einstiegen, Trainingseinstellungen; Vergleich in der Zusammenfassung bleibt M3 |
| 1.8 | Umgesetzt (18.10.2026): JSON-Export, Seite „Daten und Sicherung“ mit Speicherstatus und Snapshot-Liste, Migrationstest-Gerüst; Snapshot vor Schema-Upgrade bestand schon aus M0 |
| 1.9 | Umgesetzt bis auf den Gerätetest (18.10.2026): E2E für Sichtbarkeitswechsel, Überziehung und Offline; T-IPH-M1 steht aus |

**Stand Erweiterungsplan (18.10.2026):** Schritt B (Bibliothek, D-248) und Schritt C (Programme A, B, C und aktives Programm, D-249) umgesetzt auf dem Branch `evolution-programs` (Pull Request #7, Basis `m1-training`); Schritt D (Player: Übungsinfo, Umsortieren, Ersetzen mit Alternativen, Übungstimer, Tagesvorschau, D-250) auf dem Branch `evolution-player`; B, C und D am 18.10.2026 über #5, #7 und #8 nach `main` gemergt. Schritt E (Fortschritt: Körpergewicht mit Diagramm, Kennzahlen, Bestleistungen, Übungsverlauf, Kalorienschätzung, D-251, D-252) über #9 gemergt; damit sind AP 3.1, 3.2 und 3.6 sowie Teile von 3.4 vorgezogen, AP 3.3 (Ziele) steht aus. Schritt F (Tagesaufgaben mit Serie, Motivationssatz, Dexie v2, D-253) auf dem Branch `evolution-tasks` (PR #11); Ziele und Profil (AP 3.3, D-254) auf dem Branch `evolution-goals` (PR #12); Nachtragen (AP 2.6, D-255) auf dem Branch `m2-nachtragen` (PR #13); Verlauf bearbeiten und löschen (AP 2.7, D-256) auf dem Branch `m2-verlauf-bearbeiten`. Alles bis hier am 19.10.2026 über #11 bis #14 gemergt. Eigene Programme und Vorlagen (AP 2.1 bis 2.4, D-257) über #15 gemergt. Eigene Übungen (AP 2.5, D-258) über #16 gemergt; die Programmdatei entfällt (D-259). Notizen im Player (D-260) über #17 gemergt. Ernährung Grundausbau (Schritt G, D-261, D-262) auf dem Branch `feat/ernaehrung-basis`. Ergebnisse in `testing.md` Abschnitt 10; Inhalt der Programme in `programs.md`. Damit ist AP 2.3 für gebündelte Programme vorgezogen; für eigene Programme folgt der Rest in M2.


### M2 · Programm-Builder und Trainingsplanung (Größe XL)

| AP | Inhalt | Größe |
|---|---|---|
| 2.1 | Programm-Domain und Editor: Wochen, Tage, Übungen, Satzschema mit Aufwärm-, Arbeits- und Drop-Sätzen, Wiederholungsbereich, Zielgewicht, Zielzeit, Pausen; Sortieren per Aktion (umgesetzt am 19.10.2026, D-257) | L |
| 2.2 | Vorlagen: als Vorlage speichern, Vorlage verwenden, duplizieren, archivieren, löschen mit Rückgängig (umgesetzt am 19.10.2026, D-257) | M |
| 2.3 | Aktivieren, Reihenfolge-Modus, Wochentag-Hinweis, Vorschau, Trainingsübersicht (Aktivieren, Reihenfolge-Modus, Vorschau und „Heute geplant“ für gebündelte Programme seit Schritt C, D-249; für eigene Programme mit Wochentag-Hinweis am 19.10.2026, D-257) | M |
| 2.4 | Einheit aus Programm mit Snapshots; Ersetzen im Training und im Plan; Drop-Sätze im Player; Übungstimer; Pausieren und Fortsetzen (offen, D-297); Notizen (Ersetzen im Training, Umsortieren und Übungstimer seit Schritt D, D-250; Einheit aus eigenem Programm mit Snapshot samt Zielgewicht, Ersetzen im Plan und Drop-Sätze im Plan am 19.10.2026, D-257; Notizen im Player am 19.10.2026, D-260) | L |
| 2.5 | Eigene Übungen, persönliche Übungsangaben, Übungsdetail mit letzten Einheiten (umgesetzt am 19.10.2026, D-258) | M |
| 2.6 | Krafttraining nachtragen, Aktivität erfassen (umgesetzt am 18.10.2026, D-255) | M |
| 2.7 | Verlauf bearbeiten und löschen mit Aktualisierung der Projektion (umgesetzt am 19.10.2026, D-256) | M |
| 2.8 | Import in eine leere Datenbank (Programmdatei entfällt, D-259: Mehrgerätenutzung über die Synchronisierung in R3; umgesetzt als Wiederherstellen aus dem Export am 23.10.2026, auch in eine bestehende Datenbank durch Ersetzen, D-345) | M |
| 2.9 | Tests und Gerätekurztest (eigenes Programm und eigene Übung am iPhone; Programmdatei entfällt, D-259) | M |

AK: AK-PRG-01 bis AK-PRG-12 (AK-PRG-13 nach R3, D-259), AK-TRN-03 (Drop), AK-TRN-09 (ersetzen), AK-TRN-14, AK-TRN-18, AK-TRN-23, AK-TRN-24, AK-EXL-03, AK-EXL-04, AK-EXL-05 (ohne Diagramm), AK-HIS-03, AK-HIS-04, AK-DAT-02, AK-DAT-05, AK-DSH-02 (Programmkarte).

Abnahme M2: Alle genannten AK bestanden; Gerätekurztest bestanden.

### M3 · Körpergewicht, Dashboard, Verlauf und Ziele (Größe L)

| AP | Inhalt | Größe |
|---|---|---|
| 3.1 | Körpergewicht: Domain, Erfassen-Sheet, Liste, Bearbeiten und Löschen, Plausibilitätshinweis (umgesetzt mit Schritt E, D-252) | M |
| 3.2 | Diagramm-Basis (Recharts mit Tokens, Tooltip, Tabellenansicht, Zeitraum) und die Diagramme C-01 bis C-03; Rendering hell und dunkel per Bildschirmfoto geprüft (umgesetzt mit Schritt E; C-01 ohne Ziellinie bis AP 3.3) | L |
| 3.3 | Ziele und Profil (Wochenziel, Zielgewicht, Historie); Einstellungen vervollständigen (Ziele, Historie und Anzeigename umgesetzt am 18.10.2026, D-254) | S |
| 3.4 | Dashboard vollständig: alle Karten, Vergleich mit der letzten Einheit, Wochenziel, Gewicht, Erfassen-Sheet, Sicherungshinweis (Karten „Letztes Training“, „Körpergewicht“ mit Abstand zum Ziel, „Wochenziel“ und „Tagesaufgaben“ seit Schritt E, F und Zielen; Erfassen-Sheet und Sicherungshinweis offen) | M |
| 3.5 | Ersteinrichtung | S |
| 3.6 | Zusammenfassung mit Vergleich (umgesetzt mit Schritt E, dazu Kalorienschätzung und Bestleistung) | S |
| 3.7 | Tests | M |

AK: AK-BW-01 bis AK-BW-06, AK-HIS-05, AK-EXL-05 (Diagramm), AK-DSH-02 bis AK-DSH-08, AK-SET-01, AK-SET-05, AK-ONB-01, AK-TRN-20 (Vergleich), AK-DAT-12.

Abnahme M3: Alle genannten AK bestanden; Diagramme zeigen ausschließlich gespeicherte Daten.

### M4 · Datensicherheit, Qualität und MVP-Abnahme, Version 1.0 (Größe L)

| AP | Inhalt | Größe |
|---|---|---|
| 4.1 | Import „Zusammenführen" und „Ersetzen", Snapshot-Oberfläche, „Alle Daten löschen" | M |
| 4.2 | Wiederherstellungsbildschirm, Fehlergrenzen, Export des Fehlerprotokolls | M |
| 4.3 | Update ohne Unterbrechung des Trainings, Version und Änderungsprotokoll, Lizenzhinweise | S |
| 4.4 | Dunkelmodus vollständig, Barrierefreiheit (axe, Tastatur, Kürzel), Bedienziele, reduzierte Bewegung | M |
| 4.5 | Leistung: Datengenerator für fünf Jahre, Messung der Budgets, Bündelanalyse | M |
| 4.6 | Vollständige E2E-Suite in Chromium und WebKit; Gerätetests T-IPH-M4 (Regression), T-IPD-M4, T-MAC-M4 | M |
| 4.7 | Dokumentation: Matrix-Status, Einschränkungen, Testprotokolle, Changelog | S |

AK: AK-DAT-03, AK-DAT-04, AK-DAT-06 (Oberfläche), AK-DAT-08 bis AK-DAT-10, AK-PWA-03 (vollständig), AK-PWA-06, AK-SET-03, AK-SET-07, AK-UX-01 bis AK-UX-08, AK-HIS-01 (Leistung), AK-DEV-02, AK-DEV-03.

Abnahme M4: Alle 101 MVP-Kriterien bestanden; der Produktinhaber nimmt R1 ab; die MVP-Zeilen der Matrix stehen auf „Abgenommen".

## 5. Spätere Ausbaustufen

| M | Inhalt | Prüfbare Abnahme |
|---|---|---|
| **R2 Ernährung** | | |
| M5 | Prüfspike S-2 (BLS); Lebensmittelmodell mit eigenen und BLS-Lebensmitteln; Portionen und Einheiten; Ziele per Formel und manuell; Protokoll mit Snapshots; Tagesübersicht; Verlauf; Favoriten, Zuletzt, Vorlagen; Schnelleintrag; Kennzeichnung unvollständig und geschätzt; Quellenhinweise; Navigation um Ernährung erweitert | Ein ganzer Tag wird protokolliert; Summen stimmen mit einer Handrechnung überein; Stammdatenänderung lässt vergangene Einträge unverändert |
| M6 | Prüfspikes S-1 (Open Food Facts) und S-3 (Barcode); Einwilligung; Drosselung; Cache; Offline-Verhalten; bei Bedarf Edge Function als Proxy | Barcode eines realen Produkts wird am iPhone erkannt und übernommen; ohne Netz bleibt die manuelle Eingabe sofort nutzbar |
| M7 | Rezepte mit Zutaten, Nährwerten pro Portion, Skalierung, Katalog, Protokollieren | Portionsänderung skaliert korrekt; Rezeptänderung verändert vergangene Einträge nicht |
| M8 | Wochenmenü, Tausch, Bestätigung; Einkaufsliste mit Zusammenführung, Kategorien, Abhaken, Vorrat | Eine Woche wird geplant und die Einkaufsliste entsteht reproduzierbar aus den geplanten Rezepten |
| **R3 Synchronisierung** | | |
| M9 | Supabase-Projekt (EU), Tabelle `sync_documents`, RLS mit Tests, Anmeldung, Outbox, Push, Pull, Status, erster Upload | Daten eines Geräts erscheinen auf einem zweiten Gerät; RLS-Tests bestanden |
| M10 | Konfliktregeln K-01 bis K-19, Konfliktkopien, Tombstones, Wiederherstellung auf neuem Gerät, Löschen der Cloud-Daten; Zwei-Geräte-Tests | Konflikt „abgeschlossen gegen laufend" endet mit der abgeschlossenen Einheit; alle Konflikttests bestanden; Gerätetest mit iPhone, iPad und Mac |
| **R4 Fortschritt, Aktivität, Gewohnheiten** | | |
| M11 | Bestleistungen, Statistiken, Trainingskalender, Verschieben nach Datum, Streaks, Supersätze, RPE, Progressionsvorschlag | Bestleistungen entstehen beim Abschluss korrekt; Supersatz-Ablauf funktioniert im Player |
| M12 | Körpermaße, Körperfett, Fotos lokal mit Vergleich, Wochen- und Monatsbericht | Fotos überstehen Neustart, lassen sich exportieren und vollständig löschen |
| M13 | Gewohnheiten, Tagesaufgaben, Wasser, Schritte manuell und per Kurzbefehl über Datei oder Zwischenablage | Ein Kurzbefehl überträgt Schritte ohne Server in die installierte App |
| **R5 Erweiterungen** | Push-Erinnerungen, Foto-Cloud, Kurzbefehl-Automatik über Supabase, Teilen, Rezept-Import, Übungsmedien, Drag and Drop, persönliche Challenges, Bewertung einer nativen Erweiterung | Je Funktion eigene Kriterien |

## 6. Abbildung auf die Phasen des Auftrags

| Phase im Auftrag | Umsetzung |
|---|---|
| Phase 3 · Technische Grundlagen | M0 |
| Phase 4 · Erste nutzbare Version | M1 bis M4 |
| Phase 5 · Ernährung | M5 bis M7 |
| Phase 6 · Planung und Fortschritt | M8 sowie M11 bis M13 |
| Phase 7 · PWA und Offline | Ab M0 laufend, abgeschlossen in M4 |
| Phase 8 · Synchronisierung | M9, M10 |
| Phase 9 · Qualität und Erweiterungen | Laufend und R5 |

## 7. Kritischer Pfad und Risiken

- Kritischer Pfad bis M1: Q-01 und Q-02 → AP 0.1 → AP 0.6 → AP 1.1 → AP 1.3 → AP 1.4, 1.5, 1.6 → Gerätetest T-IPH-M1.
- Größte Risiken bis M1: Verhalten von Safari im Hintergrund (Verbindungsverlust der IndexedDB, angehaltene Timer) und die junge Version von vite-plugin-pwa. Gegenmaßnahmen in `architecture.md` Abschnitt 16.
- Umfang: R1 umfasst 82 Funktionen und 101 Kriterien. Neue Wünsche während R1 kommen in die Matrix mit Umfang „Später", außer sie sind für ein bestehendes Kriterium nötig.

## 8. Vorlage für den Bericht nach jedem Arbeitspaket

```
Arbeitspaket: <Nummer und Titel>
Umgesetzte Funktionen: <Matrix-IDs>, erfüllte AK: <IDs>
Geänderte Dateien: <Liste>
Technische Entscheidungen: <neu oder geändert, mit Verweis auf decisions.md>
Ausgeführte Tests: <Befehle>
Ergebnis: <bestanden / fehlgeschlagen, Anzahl, wörtliche Fehlerausgabe>
Bekannte Einschränkungen: <Liste>
Nächste Schritte: <Liste>
```

## 9. Nächste konkrete Schritte

1. Erledigt: Q-01 und Q-02 beantwortet (`darad11/fitness-app`, Vercel).
2. Erledigt: M0 umgesetzt (AP 0.1 bis 0.6) und berichtet; Repository angelegt, Pull Request mit grüner CI; Vercel verbunden, Produktivadresse `https://fitness-app-mu-drab.vercel.app`.
3. Erledigt: M0 gemergt und ausgeliefert; T-IPH-M0 Schritte 1 bis 3 bestanden (iOS 27.0.1).
4. Erledigt: T-IPH-M0 Schritt 4 (Update-Hinweis) bestanden.
5. Erledigt mit darad11/fitness-app#4: E2E Chromium in der CI stabilisiert (`testing.md` Abschnitt 10).
6. Erledigt: Basisübungsliste vorgelegt und vom Produktinhaber durchgesehen (Q-05, D-241).
7. Erledigt: AP 1.1 Übungsbibliothek (ohne Übungsauswahl, die mit AP 1.4 folgt).
8. Erledigt: AP 1.2 Beispielvorlagen (ohne „Nur heute trainieren", das mit AP 1.3 und 1.4 folgt).
9. Erledigt: AP 1.3 Trainings-Domain.
10. Erledigt: AP 1.4 Trainingsplayer (ohne Pausenleiste).
11. Zur Freigabe: Erweiterungsplan `evolution-plan.md` mit der Erfassung von Programm C (`winterprogramm-2026.md`), Referenzanalyse (`reference-analysis.md`) und Rückfragen Q-13 bis Q-18 (Branch `evolution-plan`, Pull Request als Entwurf).
12. Erledigt: Q-18 beantwortet (ja); Vorgabe des Produktinhabers, ab jetzt alles nach dem Master-Prompt zu gestalten. Darauf Designsystem 2.0 (AP D1) und Premium-Player mit Pause, Ton und Wake Lock (AP D2, ersetzt AP 1.5), siehe `ux-audit.md`, D-246, D-247.
13. Erledigt: AP 1.6 Persistenz und Wiederaufnahme.
14. Erledigt: AP 1.7 Verlauf, Dashboard-Basis, Trainingseinstellungen.
15. Erledigt: AP 1.8 Datensicherung.
16. Erledigt: AP 1.9 E2E-Tests. Offen: Gerätetest T-IPH-M1 durch den Produktinhaber, Auswertung in `known-limitations.md`.
17. Erledigt (Branch `evolution-programs`): Schritt B, Bibliothek um 19 Übungen aus dem Abgleich für Programm C erweitert (D-248).
18. Erledigt (Branch `evolution-programs`): Schritt C, Programme A, B, C als Stammdaten (`programs.md`) und aktives Programm mit nächstem Tag, Zähler und „Heute geplant“ (D-249). Offen: weitere Dropset-Sterne von Programm C vom Produktinhaber (U-1).
19. Produktinhaber führt T-IPH-M1 durch; ich werte aus und dokumentiere; danach Pull Requests #5 und `evolution-programs` zur Freigabe.
20. Erledigt (Branch `evolution-player`): Schritt D, Player ausgebaut (D-250).
21. Erledigt: #5, #7 und #8 nach `main` gemergt (Freigabe des Produktinhabers am 18.10.2026 ohne ausführlichen Test; Befunde meldet er nach).
22. Erledigt (Branch `evolution-progress`): Schritt E, Fortschritt und Auswertung (D-251, D-252).
23. Erledigt (Branch `evolution-tasks`): Schritt F, Tagesaufgaben mit Serie und Motivationssatz (D-253); erste Schemaänderung (Dexie v2) mit Snapshot und Migrationstest.
24. Erledigt (Branch `evolution-goals`): Ziele und Profil (AP 3.3, D-254) mit Ziellinie, Wochenziel-Karte, Abstand zum Zielgewicht und Anzeigename.
25. Erledigt (Branch `m2-nachtragen`): AP 2.6 Training nachtragen und Aktivität erfassen (D-255).
26. Erledigt (Branch `m2-verlauf-bearbeiten`): AP 2.7 Verlauf bearbeiten und löschen (D-256).
27. Erledigt (Branch `feat/eigene-programme`): AP 2.1 bis 2.4 eigene Programme und Vorlagen mit Editor, Kopieren, Archiv und Löschen mit Rückgängig (D-257); offen in AP 2.4: Notizen im Player (TS-19).
28. Erledigt (Branch `feat/eigene-uebungen`): AP 2.5 eigene Übungen, persönliche Angaben und Übungsdetail (D-258). Programmdatei entfällt auf Wunsch des Produktinhabers (D-259).
29. Erledigt (über #17 gemergt): Notizen im Player (TS-19, D-260). Import einer Datensicherung (AP 2.8) zurückgestellt auf Wunsch des Produktinhabers.
30. Erledigt (über #18 gemergt): Schritt G Grundausbau (M5 ohne Rezepte): Q-19 beantwortet, BLS 4.0 gebündelt mit österreichischen Suchbegriffen, eigene Lebensmittel, Tagesprotokoll mit vier Mahlzeiten, Schnelleintrag, Ziele selbst oder per Vorschlag, Dexie v3 (D-261, D-262).
31. Erledigt (über #19 gemergt): Lebensmitteldaten der BLS-Recherche als lokaler Import, nur die 7.476 ÖNWT-Lebensmittel; deutsche Daten (BLS 3.02) und auslaufende Produkte weggelassen (D-263). Offen: Marken aus den Detailseiten (Skript beim Produktinhaber), Entscheidung zum gebündelten BLS 4.0. Offen beim Produktinhaber: Import auf dem iPhone mit seiner Datei.
32. Erledigt (über #20 gemergt): alle Nährwerte beim Hinzufügen und Bearbeiten, Zucker, Salz, Ballaststoffe und gesättigte Fettsäuren in der Tagesübersicht (D-264); „Heute“ ohne „Status“ und „Diese Version“ (D-265).
33. Erledigt (über #25 gemergt): Marken aus `nuts-marken.json` beim lokalen Import, 5.934 der 7.476 Lebensmittel mit Marke, in der Suche sichtbar und suchbar (D-271). Offen beim Produktinhaber: Datei auf dem iPhone importieren.
34. Erledigt (über #21 gemergt): Barcode-Scanner mit Open Food Facts nach Einwilligung, Treffer unter „Meine Lebensmittel“ (D-266). Gerätetest bestanden: Kamera und Open Food Facts mit Marke und Nährwerten (S-1, S-3).
35. Erledigt (über #22 gemergt): Rezepte mit Zutaten, Portionen und Nährwerten, portionsweise eintragen, Dexie v4 (D-267).
36. Erledigt (über #23 gemergt): Mahlzeit-Vorlagen aus einer Mahlzeit speichern und mit einem Tipp eintragen, Dexie v5 (D-268).
37. Erledigt (über #24 gemergt): Synchronisierung, erste Stufe: Supabase-Projekt in Frankfurt, Tabelle und Funktion mit RLS, Anmeldung mit E-Mail und Passwort, automatischer Abgleich, Dexie v6 (D-269). Offen beim Produktinhaber: Konto im Supabase-Dashboard anlegen, Anmeldungen sperren, Gerätetest mit zwei Geräten.
38. Erledigt (über #27 gemergt): Registrieren im Anmeldefenster mit Bestätigungsmail (D-273).
39. Erledigt (über #26 gemergt): Glas-Look für die ganze App in hell und dunkel, Tab-Leiste mit Glas-Linse, einklappbare Seitenleiste, Kalorien-Ring und Gewichtskurve, Vorschau-Balken entfernt (D-272). Offen: Gerätetest auf dem iPhone (Weichzeichnen und Linse).
40. Erledigt (über #29 gemergt): aktuelles Gewicht beim Zielgewicht; ein Knopf „Gewicht erfassen“ (D-274).
41. Erledigt (über #30 gemergt): kleiner Makro-Ring und „Barcode scannen“ auf „Heute“; Scanner öffnet sofort, Mahlzeit nach Uhrzeit, danach zurück zu „Heute“ (D-275).
42. Erledigt (über #31 gemergt): Begrüßung mit Uhr wie im Dashboard, Tab-Leiste minimiert sich beim Runterscrollen zum Kreis, Tagesaufgaben unten (D-276).
43. Erledigt (über #32 gemergt): Schritte aus dem Dashboard auf „Heute“ unter der Ernährung, Anmeldung je Gerät unter Mehr, nur lesend (D-277). Vom Produktinhaber am 20.10.2026 am Gerät bestätigt.
44. Erledigt (über #34 gemergt): Marke in Tagesliste und in den Fenstern zum Eintragen und Bearbeiten (D-278).
45. Erledigt (über #36 gemergt): BLS 4.0 entfernt (D-279), Gewichte mit gleichem Zeitpunkt in richtiger Reihenfolge, Zutatenzeile im Rezept, wackelige Tests robuster, Hinweis zu Grunddaten entfernt.
46. Erledigt (über #37 gemergt): Logo und Name über der Begrüßung, Daten/Installieren/Schritte in den Einstellungen (D-280).
47. Erledigt (über #38 gemergt): Statusleiste auf allen Seiten und bei der Anmeldung ohne farbliche Unterbrechung (D-281).
48. Erledigt (über #39 gemergt): Datumsfeld beim Nachtragen ragt am iPhone nicht mehr über den Rand (D-282).
49. Erledigt (über #40 gemergt): Tagesaufgaben als schlichte tägliche Checkliste, Pausieren und Löschen ohne verfälschte Vergangenheit (D-283).
50. Erledigt (über #41 gemergt): Fortschritt der Tagesaufgaben mit Kennzahlen, Verlauf, Gesamtübersicht, Einzelauswertung und Hinweisen (D-284).
51. Erledigt (über #42 gemergt): Wochentage je Aufgabe und „Mit Training abhaken“ (D-285). Später möglich: „10.000 Schritte“ aus den Dashboard-Schritten abhaken.
52. Erledigt (über #43 gemergt): Logo und Name auf jeder Seite links oben (D-286).
53. Erledigt (über #44 gemergt): Einkaufsliste in „Meine Küche“ mit Rezept-Zutaten (D-287). Eigene Lebensmittel werden beim Tippen vorgeschlagen. Abgleich mit dem Auftrag, Bewertung und Bericht: `shopping-list.md`. Später möglich: Favoriten, Kategorien-Reihenfolge, mehrere Listen, Vorlagen.
54. Ich: Datensicherung einspielen (AP 2.8) entfällt vorerst auf Wunsch des Produktinhabers. Später: feldweise Zusammenführung und Aufräumen alter Löschmarkierungen (D-269).
55. Erledigt (über #45 gemergt): Wasser auf „Heute“, in der Ernährung und als eigene Seite mit Ziel, Verlauf, Schnellmengen und „mit Wasserziel abhaken“ (D-289). Abgleich mit dem Auftrag, Bewertung und Bericht: `water-tracker.md`. Später möglich: häufige eigene Mengen, Uhrzeit beim Nachtragen, Wasser aus Apple Health.
56. Beantwortet (Q-22), umgesetzt mit Punkt 57: Markenstrategie FORM liegt in `brand-form.md` mit drei Logo-Entwürfen. Nach Antwort des Produktinhabers: eigenes Paket für Name, Symbol, Kopfzeile, Anmeldebildschirm und „Über die App“, mit Bildern vorher; Home-Bildschirm-Name ändert sich erst bei Neuinstallation (D-222).
57. Erledigt (über #49 gemergt, 23.10.2026, normaler Merge `1dc1dd7`): Rebranding zur Marke FORM mit den Paketen F0, F1, A, B, F2, F3, C, D, F4, G und E (D-307 bis D-320), dazu die Übergabe in den Marken-Chat (D-321). Bericht mit Testergebnissen: `form-rebranding-report.md`; Tokens, Kontraste und Abweichungen: `brand-tokens.md`; Bilder: `docs/screens/`, alle auf einem Bild in `docs/screens/uebersicht.png`, als Archiv `docs/screens.zip`. Danach Feinschliff F5 vor dem Merge (Auftrag `docs/prompts/F5-feinschliff-vor-dem-merge.md`, D-322 bis D-331): Bedienelemente, aktives Training, Programme, Kopfzeile und Startbild C3, Ernährung, Zeitraum-Auswahl, Texte und Marke, Entscheidungen, schmale Breiten; Bericht in `form-rebranding-report.md` Abschnitt 7. Danach Feinschliff F6 vor dem Merge (Auftrag `docs/prompts/F6-feinschliff-vor-dem-merge.md`, D-332 bis D-340): Logo der Kopfzeile scharf, Makro-Ring V2, kleinere Erledigt-Markierungen, Aufgaben nach V1, Karte „Bereit für dein Training?“ V2c, Startfläche mindestens 1,0 s, Woche im Trainingskopf, nächste Schritte als Punkte 62 bis 64; Bericht in `form-rebranding-report.md` Abschnitt 8. Vor dem Merge Hinweistext „Werte für“ und drei Screenshots (D-341, Abschnitt 9), nach dem Merge Prüfung der Auslieferung (Abschnitt 10). Offen beim Produktinhaber: Gerätetest T-IPH-M0 Schritte 5 und 6, jetzt an der Produktivadresse (D-329, D-332, D-337), Schalter „Allow new users to sign up“ prüfen (D-328). Danach: mehrspaltige Layouts für breite Bildschirme in einer eigenen Sitzung (D-313).
58. Nach dem Merge, eigene Sitzung: Nährstoffe Salz, Zucker, gesättigte Fettsäuren und Ballaststoffe mit Referenzwerten (heute nur Summen in der Tagesübersicht, D-264). Vorher klären: Quelle der Referenzwerte und ob ein Wert als Obergrenze oder als Ziel gilt (D-330).
59. Nach dem Merge, eigene Sitzung: Grundnahrungsmittel und Suche in der Ernährung; laut Produktinhaber findet die Suche „Apfel“, „Eier“ und „Tomaten“ nicht. Zuerst die Ursache klären (fehlende Daten oder Suche), dann Quelle und Lizenz der Grundnahrungsmittel (D-306, D-330).
60. Nach dem Merge, eigene Sitzung: eigene Workouts aus der Übungsbibliothek zusammenstellen (D-330).
61. Nach dem Merge, eigene Sitzung: Ausführungsanleitungen in den Übungsdetails, mit eigenen Texten (D-106, D-330).
62. Nach dem Merge, eigene Sitzung: Karte „Aktivitäten“ unter „Ernährung heute“ mit den Kalorien aus Workouts und Nachträgen, später aus Apple Health über die native App (AH-07, D-116). Verknüpft mit dem Kalorienbudget, ohne doppelte Anrechnung. Titel „Aktivitäten“, nicht „Verbrannte Kalorien“ (Wortfeld der Leitplanken, `form-markenleitplanken.md`). Vorher klären: wie die App die Kalorien eines Workouts schätzt und ob sie das Budget des Tages erhöhen (D-339).
63. Nach dem Merge, eigene Sitzung: Rückblicke „Das warst du heute“ und „Das warst du diese Woche“ (D-339). Texte nach den Leitplanken, ohne Streaks und Zähler für Serien.
64. Nach dem Merge, eigene Sitzung: Wischen zum Löschen in der Einkaufsliste (D-339). Wie das Löschen heute mit „Rückgängig“; der bisherige Weg ohne Wischen bleibt für Tastatur und Screenreader.
65. Angelegt (23.10.2026): Branch `form-stabilitaet` von `main` für die nächste Phase, mit Entwurfs-PR nach `main` für die CI (D-342). Ab jetzt bekommt jede Phase einen eigenen Branch von `main`; den Auftrag der Phase gibt der Produktinhaber.
66. Abgeschlossen, wartet auf Durchsicht und Merge durch den Produktinhaber (Branch `form-stabilitaet`, Entwurfs-PR #50, Auftrag `prompts/stabilitaet-FORM.md`): Phase Stabilität. Abschnitt 1 erledigt: zuverlässiger Start nach Updates und ohne Netz, Ursache des Offline-Tests, Startwächter, einmal neu laden, Update-Strategie (E-16, D-343); Nachtrag nach der CI: drei Befunde in WebKit behoben. Abschnitt 2 erledigt: Ursachen der wackelnden Tests behoben (Linse, Wasser-Schalter, Seitenende), E2E-Jobs im Image von Playwright, Wiederholung auf Abruf (D-344); Nachträge nach der Wiederholung in der CI: Seitenende auf `/ernaehrung` behoben; Startwächter in WebKit behoben (index.html lädt keine Module mehr vor). Abschnitt 3 erledigt: Wiederherstellen aus dem Export mit Prüfung, Zusammenfassung, doppelter Bestätigung, Sicherung vorher und Regeln für die Synchronisierung (A-14, D-345); Zusammenführen (AK-DAT-03) bleibt offen. Abschnitt 4 erledigt: weitere P2-Befunde nach Priorität und B-07 (D-346); offen mit Grund A-03 Rest, A-05, A-06, C-04 Rest, E-03 Rest, B-02 nach D-297. Abschnitt 5 erledigt: Startansicht 234,3 KB statt 239,5 KB durch getrennte Textkataloge (D-347). Abschnitt 6 erledigt: alle Prüfungen, vorübergehende Gegenprobe entfernt, Unterlagen nachgezogen (D-348); jeder früher wackelnde Test bestand in der CI 20-mal in Chromium und WebKit. Bericht: `form-stabilitaet-report.md`, offene Punkte mit Grund in Abschnitt 7.
