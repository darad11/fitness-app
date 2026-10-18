# Designsystem, Sitemap und Screen-Katalog (Entwurf)

Stand: 17.10.2026 · Phase 1 · Status: Entwurf; Sitemap und Screen-Katalog werden in Phase 2 festgelegt, Tokens und Komponenten in Phase 3 umgesetzt

## 1. Designprinzipien

1. **Zahlen zuerst**: Gewicht, Wiederholungen, Kalorien und Makros sind die Hauptinhalte. Große, tabellarische Ziffern, hoher Kontrast, keine dekorativen Elemente, die mit Zahlen konkurrieren.
2. **Einhändig im Training**: Alle Aktionen während einer Einheit liegen im unteren Drittel des iPhone-Bildschirms; Zielgrößen mindestens 48 px; Eingaben mit Steppern statt Freitext.
3. **Ruhig und hochwertig**: wenige Farben, viel Weißraum, klare Hierarchie über Typografie und Abstand statt über Rahmen und Schatten. Kein Dashboard-Look mit vielen Kacheln gleicher Gewichtung.
4. **Ehrliche Daten**: leere Zustände erklären den nächsten Schritt; keine Platzhalterwerte; Schätzungen sichtbar markiert; Trends erst ab ausreichender Datenlage.
5. **Gleiche Sorgfalt auf dem Mac**: zweispaltige Layouts, Tastaturbedienung, Hover-Zustände, keine aufgeblasene Mobilansicht.
6. **Light Mode als Standard, Dark Mode gleichwertig**: alle Tokens in beiden Modi definiert und geprüft.

## 2. Tokens (Vorschlag, als CSS-Variablen)

| Gruppe | Token | Light | Dark | Verwendung |
|---|---|---|---|---|
| Fläche | `--bg` | #FAFAF9 | #0F1115 | Seitenhintergrund |
| | `--surface` | #FFFFFF | #171A21 | Karten, Sheets |
| | `--surface-2` | #F3F4F6 | #1F232C | Eingabefelder, Zebra |
| Text | `--fg` | #111318 | #ECEEF2 | Primärtext |
| | `--fg-muted` | #5B6270 | #9AA3B2 | Sekundärtext, Labels |
| Linie | `--border` | #E5E7EB | #2A2F3A | Trennlinien |
| Akzent | `--accent` | #1F6FEB | #4C8DFF | Primäraktionen, aktive Tabs, Fortschritt |
| | `--accent-fg` | #FFFFFF | #0B0E14 | Text auf Akzent |
| Status | `--success` | #1B8A5A | #3DBE86 | Satz erledigt, Ziel erreicht |
| | `--warning` | #B7791F | #E0A943 | Schätzung, Speicherhinweis |
| | `--danger` | #C53030 | #F26D6D | Löschen, Fehler |
| Daten | `--data-1` bis `--data-4` | Akzent, #7C3AED, #0D9488, #EA580C | gleiche Reihen in Dark heller | Diagrammreihen (Protein, Kohlenhydrate, Fett, Kalorien) |

Weitere Tokens: Radius 8 / 12 / 20 px; Abstände 4-px-Raster (4, 8, 12, 16, 24, 32, 48); Schatten nur eine Stufe für schwebende Elemente; Bewegungen 120 ms (Zustandswechsel) und 240 ms (Sheets), reduziert bei `prefers-reduced-motion`.

Die Farbwerte sind ein Startpunkt und werden in Phase 3 mit Kontrastprüfung (AA) festgelegt; Akzentfarbe ist eine offene Frage (F-17).

## 3. Typografie

- Systemschrift (San Francisco auf Apple-Geräten, Fallback Inter oder system-ui) für kurze Ladezeiten und native Anmutung.
- Ziffern mit `font-variant-numeric: tabular-nums` überall, wo Zahlen in Spalten oder Timern stehen.
- Skala: 12 (Hilfstext), 14 (Sekundär), 16 (Fließtext), 18 (Listentitel), 22 (Abschnitt), 28 (Seitentitel), 40 bis 56 (Timer, Hauptzahl).
- Zeilenhöhe 1,4 für Text, 1,1 für große Zahlen.

## 4. Komponenten (Inventar)

| Ebene | Komponenten |
|---|---|
| Basis | Button (primär, sekundär, leise, destruktiv), IconButton, Input, NumberField mit Stepper, Select, Segmented Control, Switch, Checkbox, Tag, Badge, Tooltip, Skeleton |
| Struktur | Card, Section mit Titel und Aktion, List und ListItem, Table (Desktop), Sheet (unten, mobil) und Dialog (Desktop), Tabs, Accordion, Toast |
| Navigation | TabBar (mobil, 5 Einträge plus „+"), Sidebar (Desktop), TopBar mit Titel und Aktionen, Breadcrumb (Desktop, max. 3 Ebenen) |
| Fachlich | SetRow (Satzzeile: Ziel, Gewicht, Reps, Status), RestTimer (groß, Fortschrittsring, nächste Übung), ExerciseCard, ProgramWeekGrid, MacroBars (Kalorien und drei Makros), FoodSearchResult, PortionPicker, RecipeIngredientRow, ShoppingItemRow, WeightTrendChart, ExerciseProgressChart, HabitCheckRow, CalendarMonth, PhotoCompare, SyncStatusPill, EmptyState, ErrorState |

Komponenten liegen im Repo unter `shared/ui` (Basis, Struktur, Navigation) und in den Modulen (fachlich). Primitives von Radix liefern Fokusmanagement und Tastaturverhalten.

## 5. Layout und Breakpoints

| Bereich | Breite | Layout |
|---|---|---|
| Mobil | unter 640 px | Einspaltig, TabBar unten, Sheets für Eingaben, Safe Areas beachtet |
| Tablet | 640 bis 1023 px | Zweispaltig in Listen-Detail-Ansichten; TabBar bleibt oder wechselt zur Seitenleiste (Entscheidung Phase 3) |
| Desktop | ab 1024 px | Seitenleiste links, Inhalt bis 1200 px Breite, Detail rechts, Dialoge statt Sheets |

Trainingsplayer: eigenes Vollbild-Layout ohne TabBar, mit fixer Aktionsleiste unten (Satz fertig, Pause überspringen, Übung wechseln) und Tastaturkürzeln am Desktop (Enter: Satz fertig; Pfeile: Gewicht und Reps; R: Pause überspringen; N: nächste Übung).

## 6. Zustände

- Laden: Skeletons in der Form des Inhalts, nie Spinner über ganzen Seiten.
- Leer: Illustration klein oder keine, ein Satz Erklärung, eine primäre Aktion („Erstes Training planen").
- Fehler: Ursache in einfachen Worten, Wiederholen-Aktion, Verweis auf Fehlerprotokoll.
- Offline: dezente Statusleiste; Funktionen, die Netz brauchen (Barcode-Suche, Sync), zeigen es am Element.
- Schätzung: Warn-Token plus Text „geschätzt" an Wert und in der Tagessumme.

## 7. Diagramme

- Eine Akzentfarbe pro Diagramm für die Hauptreihe, Neutraltöne für Kontext (Zielgerade, Durchschnitt).
- Linien für Verläufe (Gewicht, e1RM), Balken für Summen pro Zeitraum (Volumen, Kalorien), gestapelte Balken nur für Makros mit festen Datenfarben.
- Zeiträume 7, 30, 90 Tage und gesamt, je nach Datenart; Achsen mit Einheiten; Tooltip mit Rohwert und Datum.
- Kein Trend und keine Glättung unter drei Punkten; Lücken werden nicht interpoliert.
- Diagramme sind in Light und Dark geprüft und haben eine Textalternative (Tabelle aufklappbar).

## 8. Barrierefreiheit

- Kontrast mindestens 4,5:1 für Text, 3:1 für große Zahlen und Grafik.
- Alle Aktionen per Tastatur; sichtbarer Fokus; logische Reihenfolge; Sheets mit Fokusfalle und Escape.
- Labels für alle Eingaben; Timer mit `aria-live` nur bei Zustandswechsel, nicht jede Sekunde.
- Zielgrößen mindestens 44 px, im Training 48 px.
- Bewegungen reduzierbar.

## 9. Sitemap (vorläufig)

```
Heute (/today)
  Geplantes Training · Kalorien und Makros · Gewicht · Gewohnheiten · Wochenfortschritt
  Schnellaktion „+": Mahlzeit, Gewicht, Aktivität, Wasser, Freies Training
Training (/training)
  Aktuelles Programm und Woche (/training)
  Programme und Vorlagen (/training/programs, /training/programs/:id)
  Programm-Editor (/training/programs/:id/edit)
  Trainingsplayer (/training/session/:id)  Vollbild
  Historie (/training/history, /training/history/:id)
  Übungen (/exercises, /exercises/:id)  Suche, Filter, Verlauf pro Übung
Ernährung (/nutrition/:date)
  Tagesansicht · Eintrag hinzufügen (Suche, Barcode, eigenes Lebensmittel, Schnelleintrag)
  Lebensmittel (/foods, /foods/:id)
  Rezepte (/recipes, /recipes/:id, /recipes/:id/edit)
  Wochenplan (/plan/:week)
  Einkaufsliste (/shopping/:id)
  Wasser (im Tag)
Fortschritt (/progress)
  Gewicht und Maße · Fotos · Trainingsanalyse · Bestleistungen · Wochenbericht
Mehr (/more)
  Kalender (/calendar)
  Gewohnheiten und Challenges (/habits)
  Profil (/profile)
  Einstellungen (/settings): Einheiten, Darstellung, Training, Ernährung, Benachrichtigungen
  Daten (/settings/data): Export, Import, Speicher, Löschen
  Sync (/settings/sync): Konto, Status, Geräte, Protokoll
  Über (/about): Version, Quellen, Lizenzen
```

Offene Entscheidung: „Planung" (Wochenplan und Einkaufsliste) als eigener Tab statt unter Ernährung (F-17 verwandt, D-023).

## 10. Screen-Katalog (vorläufig)

| ID | Screen | Hauptinhalt | Matrix |
|---|---|---|---|
| S-01 | Heute | Karten je nach Datenlage, Schnellaktion | CH-06, CH-07 |
| S-02 | Onboarding | Profil, Ziel, Niveau, Ort, Geräte, Häufigkeit, Ernährung | ON-02 bis ON-09 |
| S-03 | Training Übersicht | Aktuelle Woche mit Tagen, Verschieben, nächste Einheit | TP-03, TP-05, TP-17 |
| S-04 | Programme | Vorlagen und eigene Programme | TP-01 |
| S-05 | Programmdetail | Struktur, Start, Duplizieren | TP-02, TP-19 |
| S-06 | Programm-Editor | Tage, Übungen, Satzschema, Pausen, Gruppen | TP-04, TP-08, TP-09, TP-11, TP-14, TP-15 |
| S-07 | Trainingsplayer | Übung, Sätze, Eingabe, vorherige Werte, Vorschlag | TS-01 bis TS-06, TS-10, TS-11, TP-18 |
| S-08 | Pausentimer | Restzeit, nächste Übung, Aktionen | TS-07, TS-09 |
| S-09 | Zusammenfassung | Dauer, Volumen, Bestleistungen, Vergleich | TS-15, TH-07 |
| S-10 | Manuelles Training | Typ, Dauer, Distanz, Notiz | TS-17 |
| S-11 | Historie | Liste, Filter, Detail | TH-01 |
| S-12 | Übungen | Suche, Filter Muskel und Gerät, Muskelkarte optional | TP-06 |
| S-13 | Übungsdetail | Beschreibung, Medien, Verlauf, Bestleistungen | TP-07, TH-02, TH-05 |
| S-14 | Eigene Übung | Formular | TP-13 |
| S-15 | Ernährung Tag | Slots, Einträge, Zielbalken, Wasser | NU-02, NU-03, NU-13 |
| S-16 | Eintrag hinzufügen | Suche, Favoriten, zuletzt, Barcode, eigenes Lebensmittel, Schnelleintrag | NU-05 bis NU-11, NU-20 |
| S-17 | Portion wählen | Menge, Portion, Anzahl, Vorschau Nährwerte | NU-09 |
| S-18 | Lebensmittel | Liste, Favoriten, eigene | NU-08, NU-11 |
| S-19 | Lebensmitteldetail | Nährwerte, Portionen, Quelle, Qualität | NU-10, NU-16, NU-19 |
| S-20 | Barcode-Scanner | Kamera, Treffer, Fallback | NU-07 |
| S-21 | Rezepte | Katalog, Filter | RE-01 |
| S-22 | Rezeptdetail | Zutaten, Schritte, Nährwerte, Skalierung, Versionen | RE-02, RE-13 |
| S-23 | Rezept-Editor | Zutaten mit Suche, Schritte, Tags | RE-12 |
| S-24 | Wochenplan | Woche × Slots, Vorschlag, Tauschen, Bestätigen | RE-03 bis RE-07 |
| S-25 | Einkaufsliste | Kategorien, Abhaken, manuelle Einträge, Vorrat | RE-08 bis RE-11 |
| S-26 | Ziele Ernährung | Berechnung, Eingaben, manuell, Verlauf | NU-01, NU-17 |
| S-27 | Fortschritt | Übersicht mit Einstiegen | BP, TH |
| S-28 | Gewicht und Maße | Einträge, Trend, Zielgerade | BP-01 bis BP-03, BP-06 |
| S-29 | Fotos | Galerie, Vergleich, Aufnahme | BP-05 |
| S-30 | Trainingsanalyse | Übungsverläufe, Statistiken | TH-02, TH-06 |
| S-31 | Gewohnheiten | Liste, Tageshaken, Verlauf, Challenge | AH-03, AH-04, CH-01 |
| S-32 | Kalender | Monat und Woche, alle Ereignisse | AH-08, TH-03 |
| S-33 | Profil | Stammdaten, Ziele | ON-01, ON-03, ON-11 |
| S-34 | Einstellungen | Einheiten, Darstellung, Trainingsstandards, Slots, Benachrichtigungen | ON-12, ON-13, SY-06 |
| S-35 | Daten | Export, Import, Speicher, Löschen | SY-04, SY-05, ON-15 |
| S-36 | Sync | Konto, Status, Geräte, Protokoll, Konflikte | SY-03, SY-09 |
| S-37 | Über | Version, Changelog, Lizenzen der Datenquellen | – |

## 11. Trainingsmodus im Detail (Vorgabe für Phase 4)

- Oben: Übungsname, Satz x von y, vorherige Werte derselben Übung.
- Mitte: Satzliste mit Ziel (z. B. 8 bis 10 × 60 kg), Eingabefelder Gewicht und Reps als Stepper, Status.
- Unten fix: „Satz fertig" (groß), „Pause überspringen", „Übung wechseln", Menü (Satz hinzufügen, Notiz, Training beenden).
- Nach „Satz fertig": Pausentimer als Overlay mit Restzeit, +30 s, überspringen, nächste Übung.
- Eingabe ohne Systemtastatur möglich (Stepper mit konfigurierbarer Schrittweite); Tastatur optional über Tap auf die Zahl.
- Jede Änderung sofort gespeichert; sichtbarer Hinweis „gespeichert" ist nicht nötig, Verlust ist ausgeschlossen.
