# Teststrategie (Entwurf)

Stand: 17.10.2026 · Phase 1 · Status: Entwurf, wird mit Phase 3 verbindlich

## 1. Grundsätze

- Keine Funktion gilt als fertig ohne bestandene Tests für ihre Logik und ihren Workflow (Definition of Done).
- Testergebnisse werden wörtlich berichtet. Fehlschläge werden mit Ausgabe dokumentiert, nie verschwiegen oder erfunden.
- Berechnungen und Services werden ohne UI getestet; die UI wird über Komponenten- und Workflow-Tests abgedeckt.
- WebKit ist Pflicht im E2E-Lauf, weil die Zielgeräte Safari nutzen.

## 2. Werkzeuge

| Ebene | Werkzeug | Zweck |
|---|---|---|
| Unit | Vitest | Berechnungen (`calc/`), Merge-Funktionen, Einheiten, Datum |
| Integration | Vitest plus fake-indexeddb | Repositories, Services, Transaktionen, Migrationen |
| Komponenten | Testing Library, Vitest, jsdom oder Browser-Modus | Formulare, Eingabefelder, Timer-Anzeige, Zustände |
| Workflow (E2E) | Playwright mit Chromium und WebKit, mobile Viewports | Auftrag Abschnitt 11, Offline-Simulation, Reload |
| Barrierefreiheit | axe-core in Playwright | Kernseiten |
| PWA | Lighthouse CI | Installierbarkeit, Service Worker |
| Sync | Vitest mit zwei simulierten Clients gegen lokalen Supabase-Stack (Supabase CLI) oder gegen eine In-Memory-Serverattrappe | Push, Pull, Konflikte, Tombstones, RLS |

## 3. Was getestet wird

### 3.1 Berechnungen (Unit, Ziel 100 % Zweige)

- e1RM (Epley, Grenzen bei 1 und 12 Wiederholungen, keine Schätzung darüber).
- Volumen je Satztyp; Körpergewichtsübungen.
- Progressionsvorschlag (Double Progression) inklusive Schrittweiten.
- Kalorien- und Makroziele (Mifflin-St Jeor, Aktivitätsfaktoren, Anpassung, untere Schranke, Proteinregel).
- Nährwerte eines Eintrags (g, ml mit Dichte, Portionen × Größe), Rundung nur in der Anzeige.
- Plausibilitätsprüfung 4/4/9 mit Toleranz.
- Rezept pro Portion und Skalierung (1, 2, 3,5 Portionen; Rundungsfehler).
- Einkaufslisten-Aggregation (gleiche Zutat, verschiedene Einheiten, Stück vs. Gramm, manuelle Positionen, Vorrat).
- Streak-Regel (Ruhetage, Toleranz, Pausen).
- Datums- und Zeitzonenlogik: `dayKey` um Mitternacht, Zeitumstellung, Reise über Zeitzonen, Wochenstart.
- Einheitenumrechnung (kg/lb, cm/in) hin und zurück ohne Drift.

### 3.2 Persistenz (Integration)

- Jedes Repository: anlegen, lesen, ändern, soft löschen, Tombstone filtern.
- Transaktionen: Training starten (Session, Übungen, Sätze atomar); Woche bestätigen (Plan und Liste atomar).
- Migrationen: Fixture der Version n, Upgrade auf n+1, Datenprüfung.
- Snapshots: Stammdatenänderung verändert keine Protokolle; Rezeptversion bleibt referenziert.
- Invarianten: nur eine Session `in_progress`; eindeutige `dayKey`-Indizes.
- Lasttest: 5 Jahre generierte Daten, Abfragezeiten unter Budget.

### 3.3 Synchronisierung (Integration)

- Push idempotent (Wiederholung ohne Duplikate).
- Pull-Cursor fortlaufend; Abbruch mitten im Pull ohne Datenverlust.
- Konflikttabelle aus `data-model.md`, Abschnitt 6: jeder Fall als Test mit zwei Clients.
- Tombstone gegen spätere Änderung; Reaktivierung protokolliert.
- Absturz zwischen lokalem Schreiben und Push: Outbox-Eintrag bleibt und wird nachgeholt.
- RLS: Zugriff eines zweiten Nutzers auf fremde Zeilen schlägt fehl (Select, Update, Delete, Storage).

### 3.4 Workflows (E2E, Chromium und WebKit, iPhone- und Desktop-Viewport)

1. Training starten und abschließen: Vorlage wählen, Einheit starten, Sätze eingeben, Pausentimer, abschließen, Zusammenfassung, Historie.
2. Training unterbrechen und wieder aufnehmen: Reload, Tab schließen und öffnen, Offline schalten; kein Satz geht verloren; Timer zeigt korrekte Restzeit.
3. Daten nach Browser-Neustart wiederherstellen: Kontext neu starten, Daten vorhanden.
4. Mahlzeit hinzufügen und bearbeiten: Suche, Menge, Slot, Tagessumme; Bearbeitung aktualisiert Summe; Löschung.
5. Rezeptportion ändern: Skalierung, Nährwerte; vergangener Eintrag unverändert.
6. Wochenmenü erstellen: Slots belegen, tauschen, bestätigen.
7. Einkaufsliste generieren: Aggregation prüfen, abhaken, manuelle Position, erneut generieren ohne Verlust der manuellen Position.
8. Körpergewicht protokollieren: Eintrag, Trend ab drei Punkten, kein Trend darunter.
9. Diagramme überprüfen: Werte im Diagramm entsprechen den Rohdaten (Tooltip-Prüfung).
10. Offline-Änderungen synchronisieren: zwei Browserkontexte, Offline-Änderung, Online, Abgleich, Konfliktfall abgeschlossene vs. laufende Einheit.
11. Export und Import: Export erzeugen, Speicher löschen, Import, Datenvergleich.
12. Installation: Manifest und Service Worker vorhanden, Offline-Start der Shell.

### 3.5 Komponenten

- Zahlenfelder (Schrittweiten, Grenzen, Tastatur), Satzzeile (Status, Rückgängig), Timer-Anzeige (aus Endzeitpunkt), Leer- und Fehlerzustände, Dark Mode Snapshots der Kernkomponenten.

## 4. Gerätematrix für manuelle Abnahme

| Gerät | Browser | Prüfpunkte |
|---|---|---|
| iPhone | Safari, installierte Web-App | Installation, Training mit Sperrbildschirm, Kamera-Scan, Safe Areas, Tastatur, Speicherhinweis |
| iPad | Safari, installierte Web-App | Zweispaltige Layouts, externe Tastatur, Split View |
| Mac | Safari (Dock-App) und Chrome | Tastaturkürzel, Fenstergrößen, Export-Download, Push (falls aktiviert) |

Jede Phase endet mit einem Protokoll dieser Matrix (Datum, Gerät, Version, Ergebnis, Abweichungen).

## 5. CI-Gates

Pull Requests und Hauptzweig: Lint, Typecheck, Unit und Integration, E2E (Chromium und WebKit), Build, Lighthouse PWA. Ein roter Lauf blockiert den Merge. Coverage-Mindestwerte: `calc/` 95 %, `service/` und `data/` 85 % Zeilen.

## 6. Testdaten

- Deterministische Fixtures pro Modul (`shared/testing/fixtures`), Generator für Massendaten mit festem Seed.
- Keine realen personenbezogenen Daten in Tests oder im Repository.

## 7. Berichtspflicht

Jeder Arbeitspaket-Bericht enthält: ausgeführte Testbefehle, Anzahl bestanden und fehlgeschlagen, Dauer, Links zu Artefakten (Playwright-Traces bei Fehlern), offene Fehler mit ID.
