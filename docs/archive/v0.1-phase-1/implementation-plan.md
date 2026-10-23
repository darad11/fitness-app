# Implementierungsplan (priorisiert)

Stand: 17.10.2026 · Phase 1 · Status: Vorschlag zur Bestätigung

## 1. Arbeitsweise

- Kleine, überprüfbare Arbeitspakete (AP). Jedes AP endet mit einem Bericht: umgesetzte Funktionen (Matrix-IDs), geänderte Dateien, technische Entscheidungen, ausgeführte Tests mit Ergebnis, bekannte Einschränkungen, nächste Schritte.
- Die Funktionsmatrix (`feature-inventory.md`) ist das Steuerinstrument: Status wandert von „Zur Umsetzung ausgewählt" über „Implementiert" und „Getestet" zu „Abgenommen" (Abnahme durch den Produktinhaber auf dem Zielgerät).
- Definition of Done gilt pro Funktion (siehe Auftrag, Abschnitt 12). Eine Schaltfläche ohne Aktion, ein Diagramm mit Beispieldaten oder ein nur lokal gespeicherter Datensatz gelten nicht als fertig.
- Größenangaben: S unter 1 Tag, M 1 bis 3 Tage, L 3 bis 7 Tage, XL über eine Woche (KI-gestützte Einzelentwicklung inklusive Tests). Sie dienen der Reihenfolge, nicht als Zusage.

## 2. Empfohlene Abweichungen von der Phasenreihenfolge des Auftrags

1. **Sync-Metadaten ab Phase 3**: `rev`, `updatedAt`, `deletedAt`, `deviceId` und die Outbox-Tabelle werden von Anfang an angelegt, auch wenn die Sync-Engine erst in Phase 8 kommt. Nachträgliches Einziehen wäre eine Migration über alle Tabellen.
2. **PWA-Grundinstallation direkt nach Phase 4**: Manifest, Service-Worker-Precache und Installationsanleitung sind mit vite-plugin-pwa klein (S bis M) und machen die erste Version sofort auf dem iPhone nutzbar. Der Rest von Phase 7 (Offline-Feinschliff, Update-Flow, Speicherüberwachung) bleibt an seinem Platz.
3. **Export und Import früh (Ende Phase 4)**: Bis Sync existiert, ist der Export das einzige Backup gegen Speicherlöschung durch den Browser.
4. **Übungsbibliothek vor dem Trainingsplayer**: Der Player braucht Übungen; der Import einer offenen Bibliothek gehört in Phase 3.

## 3. Phasen und Arbeitspakete

### Phase 1 · Produktanalyse (abgeschlossen mit diesem Dokumentensatz)

Ergebnis: `product-research.md`, `feature-inventory.md` (138 Positionen), Architektur- und Datenmodellvorschlag, Einschränkungen, offene Fragen.

### Phase 2 · Produktdefinition (gemeinsam, Größe M)

| AP | Inhalt | Ergebnis |
|---|---|---|
| 2.1 | Entscheidungen zu den offenen Fragen in `decisions.md` treffen | Spalte Entscheidung in der Matrix gefüllt |
| 2.2 | Prioritäten bestätigen, MVP-Umfang festlegen | Status „Zur Umsetzung ausgewählt" für Phase 3 und 4 |
| 2.3 | Sitemap und Screen-Katalog finalisieren (`design-system.md`) | Screens mit IDs, Navigationsentscheidung |
| 2.4 | Akzeptanzkriterien der P0-Funktionen schärfen | `requirements.md` auf Stand „Spezifiziert" für P0 |
| 2.5 | Screenshots und Aufnahmen aus der Referenz-App auswerten (falls bereitgestellt) | Matrix-Positionen „Noch zu recherchieren" geklärt |

Gate: Produktinhaber bestätigt MVP-Umfang und Architektur.

### Phase 3 · Technische Grundlagen (Größe L gesamt)

| AP | Inhalt | Größe | Hängt ab von |
|---|---|---|---|
| 3.1 | Repository, pnpm, Vite, React, TypeScript strict, ESLint mit Import-Grenzen, Prettier, CI-Grundlauf | S | 2.x |
| 3.2 | Designsystem-Basis: Tokens, Typografie, Light/Dark, Kernkomponenten (Button, Card, Sheet, Tabs, NumberField, EmptyState), App-Shell mit Tab-Leiste und Seitenleiste | M | 3.1 |
| 3.3 | Dexie-Datenbank v1 mit Schema aus `data-model.md`, Basis-Repository mit Soft Delete und Sync-Metadaten, Outbox-Tabelle, Zod-Schemas | M | 3.1 |
| 3.4 | Routing und Seitengerüst für alle Hauptbereiche mit leeren Zuständen | S | 3.2 |
| 3.5 | Testinfrastruktur: Vitest, Testing Library, fake-indexeddb, Playwright (Chromium, WebKit), erste Migrationstests | S | 3.3 |
| 3.6 | Übungsbibliothek importieren (offene Quelle), Datenmodell `exercise`, Suche und Filter, Übungsdetail mit Bild | M | 3.3 |
| 3.7 | Profil und Einstellungen (ON-01, ON-03, ON-09, ON-11, ON-12, SY-06) | S | 3.3 |

Gate: Lint, Typecheck, Unit- und Migrationstests grün; App startet offline mit leeren Zuständen.

### Phase 4 · Erste nutzbare Version: Training (Größe XL gesamt)

| AP | Inhalt | Matrix-IDs | Größe |
|---|---|---|---|
| 4.1 | Programme und Vorlagen: Datenmodell, drei Startvorlagen, eigener Plan-Editor (Tage, Übungen, Satzschema, Pausen), Einschreibung mit Wochenzuordnung | TP-01 bis TP-04, TP-08, TP-09, TP-13 bis TP-15, TP-19 | L |
| 4.2 | Trainingsplayer: Start, Übungsansicht, vorherige Werte, Gewicht- und Wiederholungseingabe, Satz abschließen, Sätze hinzufügen/entfernen, Übung tauschen | TS-01 bis TS-06, TS-10, TS-11 | L |
| 4.3 | Timer und Wiederaufnahme: Pausentimer zeitstempelbasiert, Übungstimer, Wake Lock, automatische Persistenz, Fortsetzen nach Reload und Offline | TS-07, TS-08, TS-09, TS-12, TS-13, TS-21 | M |
| 4.4 | Abschluss, Zusammenfassung, Historie, Vergleich, manuelles Training | TS-14, TS-15, TS-17, TH-01, TH-07 | M |
| 4.5 | Dashboard „Heute" mit Training, Wochenfortschritt, leeren Zuständen; Schnellaktion | CH-06, CH-07, CH-08, TH-08 | M |
| 4.6 | PWA-Grundinstallation (vorgezogen aus Phase 7): Manifest, Precache, Installationsanleitung | SY-02 (Teil) | S |
| 4.7 | Export und Import JSON (vorgezogen) | SY-04 (Teil) | S |
| 4.8 | Workflow-Tests: Training starten und abschließen; unterbrechen und fortsetzen; Reload mitten im Training; Gerätetest iPhone, iPad, Mac | – | M |

Gate: Ein echtes Training wird auf dem iPhone von Anfang bis Ende protokolliert, überlebt Reload und Sperrbildschirm, erscheint in der Historie. Meilenstein M2.

### Phase 5 · Ernährung (Größe XL gesamt)

| AP | Inhalt | Matrix-IDs | Größe |
|---|---|---|---|
| 5.1 | Lebensmittel: Datenmodell, eigene Lebensmittel, Portionen, Plausibilitätsprüfung, lokale Suche | NU-06, NU-08, NU-10, NU-16, NU-19 | M |
| 5.2 | Protokoll und Tagesübersicht: Slots, Einträge mit Snapshot, Mengen × Portionen, Tagessummen, Historie | NU-02, NU-03, NU-05, NU-09, NU-12, NU-15 | L |
| 5.3 | Zielberechnung mit dokumentierter Formel, manuelle Überschreibung, Zielversionen | NU-01, NU-17 | M |
| 5.4 | Favoriten, zuletzt verwendet, Mahlzeitvorlagen, Schnelleintrag, Wasser | NU-11, NU-13, NU-20 | M |
| 5.5 | Rezepte: Anlegen, Zutaten, Versionierung, Nährwerte pro Portion, Skalierung, Katalog mit Filtern | RE-01, RE-02, RE-12, RE-13 | L |
| 5.6 | Online-Suche und Barcode: Open Food Facts, Kamera-Scan mit WASM-Decoder, Caching | NU-07, NU-08 (online) | L |
| 5.7 | Workflow-Tests: Mahlzeit hinzufügen und bearbeiten; Rezeptportion ändern; Tagessummen; Gerätetest Kamera | – | M |

Gate: Ein ganzer Tag wird protokolliert; Summen stimmen mit Handrechnung überein; Rezeptänderung verändert vergangene Einträge nicht. Meilenstein M3.

### Phase 6 · Planung und Fortschritt (Größe XL gesamt)

| AP | Inhalt | Matrix-IDs | Größe |
|---|---|---|---|
| 6.1 | Wochen-Mahlzeitenplan: Slots, Vorschlag aus eigenem Katalog, Tauschen, Bestätigen | RE-03, RE-04, RE-06, RE-07, RE-14, NU-04 | L |
| 6.2 | Einkaufsliste: Erzeugung, Aggregation, Kategorien, Abhaken, manuelle Einträge, Vorrat | RE-08 bis RE-11 | M |
| 6.3 | Körper: Gewicht, Maße, Fotos mit Komprimierung und Vergleich | BP-01 bis BP-03, BP-05, BP-06 | L |
| 6.4 | Analyse: Übungsverläufe, e1RM, Bestleistungen, Statistiken, Gewichtstrend, Zeiträume | TH-02, TH-05, TH-06, BP-02, BP-07 | L |
| 6.5 | Gewohnheiten, Tagesaufgaben, persönliche Challenges, Schritte manuell | AH-01 bis AH-04, CH-01 | M |
| 6.6 | Kalender über alle Module; Einheiten verschieben, nachholen, Vorschau | TH-03, AH-08, TP-05, TP-16, TP-17 | M |
| 6.7 | Progressionsvorschlag, Drop-Sets, Supersätze, Aufwärmsätze, Notizen | TP-18, TP-10, TP-11, TS-22, TS-19 | M |
| 6.8 | Workflow-Tests: Wochenmenü erstellen; Einkaufsliste generieren; Gewicht protokollieren; Diagramme prüfen | – | M |

Gate: Planung bis Einkaufsliste läuft durch; Diagramme zeigen ausschließlich gespeicherte Daten. Meilenstein M4.

### Phase 7 · PWA und Offlinefähigkeit (Größe L gesamt)

| AP | Inhalt | Größe |
|---|---|---|
| 7.1 | Offline-Verhalten vollständig: Navigations-Fallback, Medien-Cache, Offline-Indikator | M |
| 7.2 | Update-Flow ohne Zwangsreload; Versionsanzeige; Changelog in der App | S |
| 7.3 | Speicherüberwachung, Export-Erinnerung, ZIP-Export mit Fotos, Import mit Duplikaterkennung | M |
| 7.4 | Mobile Optimierung: Safe Areas, Tastaturverhalten, Scroll, große Ziele im Training, iPad-Layout | M |
| 7.5 | Wiederherstellungstests: Speicher leeren und aus Export zurückspielen; Lighthouse-PWA-Check | S |

Gate: Installation auf iPhone, iPad und Mac; Lighthouse PWA bestanden; Wiederherstellung aus Export getestet. Meilenstein M5.

### Phase 8 · Synchronisierung (Größe XL gesamt)

| AP | Inhalt | Größe |
|---|---|---|
| 8.1 | Supabase-Projekt (EU), SQL-Migrationen aller Tabellen, Trigger, RLS, RLS-Tests | M |
| 8.2 | Auth: Magic Link oder Passkey, Sitzungen, Abmelden ohne Datenverlust | S |
| 8.3 | Sync-Engine: Outbox-Push, Pull mit Cursor, Auslöser, Backoff, Statusanzeige | L |
| 8.4 | Konfliktlöser pro Entität mit Tabellen-Tests und Zwei-Geräte-Simulation | L |
| 8.5 | Fotos: Storage-Upload, signierte URLs, Download bei Bedarf | M |
| 8.6 | Wiederherstellung auf neuem Gerät; Vollabgleich; Löschung aller Cloud-Daten | M |
| 8.7 | Workflow-Tests: Offline-Änderungen synchronisieren; Konflikt abgeschlossene vs. laufende Einheit; Tombstones | M |

Gate: Dieselben Daten auf Mac, iPhone und iPad; alle Konflikttests grün; RLS-Tests grün. Meilenstein M6.

### Phase 9 · Qualität und Erweiterungen (fortlaufend)

- Performance-Budgets prüfen (Start unter 2 s auf iPhone, Interaktionen unter 100 ms), Bundle-Analyse, Lazy Loading.
- Barrierefreiheit: axe-Prüfung, Tastatur, Kontrast, Screenreader-Labels.
- Erinnerungen per Web Push (Edge Function, Cron), falls gewünscht.
- Optionale Integrationen: Kurzbefehl-Brücke für Schritte und Gewicht, USDA-Import, Rezept-Import.
- Entscheidung über native Erweiterung (Capacitor) für HealthKit.

## 4. Meilensteine

| Meilenstein | Inhalt | Nach Phase |
|---|---|---|
| M1 | Grundlagen laufen, Übungsbibliothek durchsuchbar | 3 |
| M2 | Erstes echtes Training am iPhone protokolliert, installierbar, exportierbar | 4 |
| M3 | Ernährung täglich nutzbar | 5 |
| M4 | Planung, Einkaufsliste, Fortschritt | 6 |
| M5 | Vollständige PWA, Offline, Wiederherstellung | 7 |
| M6 | Geräteübergreifende Sync | 8 |
| M7 | Qualitätsziele erreicht | 9 |

## 5. Kritischer Pfad und Risiken

- Kritischer Pfad: 3.3 (Datenbank) → 3.6 (Übungen) → 4.1 (Programme) → 4.2/4.3 (Player, Timer, Persistenz) → 4.8 (Gerätetest).
- Größte technische Risiken: Sync-Konflikte (Phase 8), Speicherbeständigkeit in Safari (Phase 4 bis 7), Barcode-Scan im Browser (Phase 5). Gegenmaßnahmen in `architecture.md`, Abschnitt 13.
- Größtes Produktrisiko: Umfang. Die Matrix hat 138 Positionen; P0 und P1 allein sind 78. Die Phasen 4 und 5 sollten strikt auf P0/P1 begrenzt bleiben.
