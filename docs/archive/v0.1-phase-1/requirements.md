# Anforderungen (Entwurf)

Stand: 17.10.2026 · Phase 1 · Status: Entwurf, wird in Phase 2 zu „Spezifiziert" geführt

## 1. Geltungsbereich

- Persönliche Fitness- und Ernährungsplattform für genau einen Nutzer.
- Zielgeräte: Mac (Safari, Chrome), iPhone und iPad (Safari, als installierte Web-App).
- Phase 1 bis 8: Web-App und PWA. Keine native App.

## 2. Ziele und Nicht-Ziele

Ziele: vollständiger Trainings- und Ernährungsworkflow; zuverlässige lokale Speicherung; Offline-Nutzung; optionale Synchronisierung; langfristig auswertbare Historie; hochwertige, schnelle Bedienung.

Nicht-Ziele: Mehrbenutzerbetrieb, Abo, Community, Wettbewerbe, medizinische Aussagen, Fotoerkennung von Mahlzeiten, native Health-Integration (bis auf Weiteres).

## 3. Funktionale Anforderungen (Übersicht)

Die Detailanforderungen und Akzeptanzkriterien stehen in `feature-inventory.md`. Hier die verbindlichen Kernaussagen pro Modul mit Verweis auf die Matrix-IDs.

| Nr. | Anforderung | Matrix |
|---|---|---|
| FR-01 | Profil, Ziele und Einstellungen sind lokal anlegbar und änderbar; Zieländerungen sind versioniert | ON-01, ON-03, ON-09, ON-11, ON-12 |
| FR-02 | Programme bestehen aus Tagen mit Übungen und Satzschema; Wochenzuordnung und Ruhetage sind frei; Programme sind nach Start versioniert | TP-01 bis TP-04, TP-08, TP-09, TP-14, TP-19 |
| FR-03 | Die Übungsbibliothek ist offline durchsuchbar (Name, Muskel, Gerät) und um eigene Übungen erweiterbar | TP-06, TP-07, TP-13 |
| FR-04 | Ein Training kann geplant oder frei gestartet werden; jede Eingabe wird sofort gespeichert; ein laufendes Training ist nach Neustart, Offline-Phase und Gerätesperre fortsetzbar | TS-01 bis TS-06, TS-12, TS-13 |
| FR-05 | Der Pausentimer rechnet mit Endzeitpunkten, überlebt Tabwechsel und zeigt die nächste Übung; der Bildschirm bleibt im Training an, wenn der Browser es erlaubt | TS-07 bis TS-09, TS-21 |
| FR-06 | Sätze können hinzugefügt, entfernt, übersprungen und Übungen getauscht werden, ohne protokollierte Daten zu verlieren | TS-10, TS-11, TP-12, TP-15 |
| FR-07 | Abgeschlossene Trainings sind unveränderlich gegenüber späteren Planänderungen und werden nie durch veraltete Kopien überschrieben | TS-14, TH-01, SY-03 |
| FR-08 | Verläufe, Bestleistungen und Statistiken werden ausschließlich aus gespeicherten Daten berechnet; unter drei Datenpunkten wird kein Trend angezeigt | TH-02, TH-05, TH-06, BP-02 |
| FR-09 | Ernährungseinträge speichern Nährwert-Snapshots; Tageswerte sind die Summe der Einträge; geschätzte Werte sind gekennzeichnet | NU-02, NU-05, NU-15, NU-19 |
| FR-10 | Lebensmittel können manuell, per Suche und per Barcode angelegt werden; Portionsgröße und Anzahl sind kombinierbar; Favoriten und Vorlagen existieren | NU-06 bis NU-11 |
| FR-11 | Kalorien- und Makroziele werden mit dokumentierter Formel berechnet und können manuell überschrieben werden; Ziele sind nach Gültigkeit versioniert | NU-01, NU-17 |
| FR-12 | Rezepte sind versioniert und skalierbar; Rezeptänderungen verändern protokollierte Mahlzeiten nicht | RE-02, RE-12, RE-13 |
| FR-13 | Ein Wochenplan ordnet Rezepte Tagen und Slots zu; aus der bestätigten Woche entsteht eine aggregierte, kategorisierte, bearbeitbare Einkaufsliste | RE-03 bis RE-11 |
| FR-14 | Körpergewicht, Maße und Fotos werden mit Datum erfasst; Fotos bleiben standardmäßig lokal | BP-01 bis BP-06 |
| FR-15 | Gewohnheiten und manuelle Aktivitäten (inkl. Schritte) sind erfassbar und im Kalender sichtbar | AH-01 bis AH-04, AH-08, TS-17 |
| FR-16 | Das Dashboard zeigt nur vorhandene Daten und bietet bei fehlenden Daten den nächsten Schritt an | CH-06, CH-07 |
| FR-17 | Alle Daten sind exportierbar (JSON, CSV, ZIP mit Fotos) und importierbar; vollständige Löschung ist möglich | SY-04, SY-05, ON-15 |
| FR-18 | Die App ist als PWA installierbar und offline nutzbar; Updates erfolgen nach Bestätigung | SY-02 |
| FR-19 | Optional synchronisiert die App über Supabase mit idempotenten Operationen, Tombstones, Konfliktregeln pro Entität und sichtbarem Status | SY-03, SY-09 |

## 4. Nichtfunktionale Anforderungen

| Bereich | Anforderung | Prüfung |
|---|---|---|
| Performance | Start bis interaktiv unter 2 s auf einem iPhone der letzten drei Jahre bei warmem Cache; Interaktionen im Training unter 100 ms; typische Datenbankabfragen unter 50 ms bei 5 Jahren Daten (ca. 1.000 Trainings, 20.000 Sätze, 15.000 Ernährungseinträge) | Lighthouse, Playwright-Timing, Lasttest mit generierten Daten |
| Offline | Alle Kernfunktionen (FR-01 bis FR-16) ohne Netz; Online nur für Barcode-Suche, Sync, Medien-Nachladen | E2E mit Offline-Modus |
| Datenintegrität | Regeln aus `data-model.md`, Abschnitt 7; keine stillen Datenverluste; jede Zusammenführung protokolliert | Unit-Tests, Konflikttests |
| Zuverlässigkeit | Reload, Tabwechsel, Gerätesperre und Absturz des Browsers verlieren höchstens die letzte ungespeicherte Tastatureingabe | E2E-Reload-Tests |
| Sicherheit und Datenschutz | Keine Secrets im Client; RLS auf allen Tabellen; keine Telemetrie an Dritte; externe Aufrufe dokumentiert; Fotos privat; Fehlerprotokoll ohne Nutzdaten | Code-Review, RLS-Tests |
| Barrierefreiheit | WCAG 2.1 AA für Kernflüsse: Kontrast, Fokus, Tastatur, Labels, Zielgrößen mindestens 44 px | axe, manuelle Prüfung |
| Wartbarkeit | TypeScript strict; Modulgrenzen per Lint; Tests für Berechnungen und Services; Dokumentation je Arbeitspaket | CI |
| Kompatibilität | Safari ab iOS 16.4 und macOS 14; aktuelle Chrome- und Edge-Versionen; Feature-Erkennung statt User-Agent | Playwright WebKit und Chromium, Gerätetest |
| Lokalisierung | Deutsch als Standard, Englisch vorbereitet; Zahlen- und Datumsformate nach Locale; Zeitzone des Geräts | Unit-Tests für Formatierung |
| Speicher | Fotos komprimiert; Speicherverbrauch sichtbar; Warnung ab 80 % des geschätzten Kontingents | Manuelle Prüfung |
| Design | Mobile-first, responsive, Light und Dark Mode, konsistente Lade-, Leer- und Fehlerzustände | Design-Review |

## 5. Annahmen und Randbedingungen

- Der Nutzer kann HTTPS-Hosting bereitstellen oder einen Dienst dafür nutzen.
- Die Supabase-Nutzung ist optional; ohne Konto läuft die App vollständig lokal.
- Übungs- und Lebensmitteldaten stammen aus offenen Quellen oder vom Nutzer.
- Die App gibt keine medizinischen Ratschläge; Berechnungen tragen einen Hinweis.
- Die Netzwerkrichtlinie der Entwicklungsumgebung muss für Paketregistries und, für die Recherche, für die Quellseiten freigegeben sein.
