# Implementierungsplan

Stand: 18.10.2026 · Version 0.2 (Phase 2) · Status: vorläufig freigegeben · Vorgänger: `archive/v0.1-phase-1/implementation-plan.md`

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

### M2 · Programm-Builder und Trainingsplanung (Größe XL)

| AP | Inhalt | Größe |
|---|---|---|
| 2.1 | Programm-Domain und Editor: Wochen, Tage, Übungen, Satzschema mit Aufwärm-, Arbeits- und Drop-Sätzen, Wiederholungsbereich, Zielgewicht, Zielzeit, Pausen; Sortieren per Aktion | L |
| 2.2 | Vorlagen: als Vorlage speichern, Vorlage verwenden, duplizieren, archivieren, löschen mit Rückgängig | M |
| 2.3 | Aktivieren, Reihenfolge-Modus, Wochentag-Hinweis, Vorschau, Trainingsübersicht | M |
| 2.4 | Einheit aus Programm mit Snapshots; Ersetzen im Training und im Plan; Drop-Sätze im Player; Übungstimer; Pausieren und Fortsetzen; Notizen | L |
| 2.5 | Eigene Übungen, persönliche Übungsangaben, Übungsdetail mit letzten Einheiten | M |
| 2.6 | Krafttraining nachtragen, Aktivität erfassen | M |
| 2.7 | Verlauf bearbeiten und löschen mit Aktualisierung der Projektion | M |
| 2.8 | Import in eine leere Datenbank; Programmdatei exportieren und importieren | M |
| 2.9 | Tests und Gerätekurztest (eigenes Programm am iPhone; Programmdatei vom Mac übertragen) | M |

AK: AK-PRG-01 bis AK-PRG-13, AK-TRN-03 (Drop), AK-TRN-09 (ersetzen), AK-TRN-14, AK-TRN-18, AK-TRN-23, AK-TRN-24, AK-EXL-03, AK-EXL-04, AK-EXL-05 (ohne Diagramm), AK-HIS-03, AK-HIS-04, AK-DAT-02, AK-DAT-05, AK-DSH-02 (Programmkarte).

Abnahme M2: Alle genannten AK bestanden; Gerätekurztest bestanden.

### M3 · Körpergewicht, Dashboard, Verlauf und Ziele (Größe L)

| AP | Inhalt | Größe |
|---|---|---|
| 3.1 | Körpergewicht: Domain, Erfassen-Sheet, Liste, Bearbeiten und Löschen, Plausibilitätshinweis | M |
| 3.2 | Diagramm-Basis (Recharts mit Tokens, Tooltip, Tabellenansicht, Zeitraum) und die Diagramme C-01 bis C-03; Rendering hell und dunkel per Bildschirmfoto geprüft | L |
| 3.3 | Ziele und Profil (Wochenziel, Zielgewicht, Historie); Einstellungen vervollständigen | S |
| 3.4 | Dashboard vollständig: alle Karten, Vergleich mit der letzten Einheit, Wochenziel, Gewicht, Erfassen-Sheet, Sicherungshinweis | M |
| 3.5 | Ersteinrichtung | S |
| 3.6 | Zusammenfassung mit Vergleich | S |
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

1. Produktinhaber: Q-01 (Repository) und Q-02 (Hosting und Adresse) beantworten; optional Q-03 bis Q-06.
2. Ich: Dokumente mit Archiv ins Repository übernehmen.
3. Ich: M0 umsetzen (AP 0.1 bis 0.6) und berichten; parallel Anleitung zur Verbindung mit Vercel.
4. Produktinhaber: Vercel verbinden; Gerätetest T-IPH-M0.
5. Ich: Basisübungsliste als Entwurf zur Durchsicht vorlegen.
6. M1 umsetzen; Produktinhaber führt T-IPH-M1 durch; ich werte aus und dokumentiere.
