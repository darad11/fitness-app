# Designsystem, Sitemap und Screen-Katalog

Stand: 21.10.2026 · Version 0.5 (Marke FORM, Rebranding F1 und F2) · Status: Sitemap und Screen-Katalog für den MVP final (vorläufig freigegeben); Tokens umgesetzt und automatisch geprüft · Vorgänger: `archive/v0.1-phase-1/design-system.md`

## Änderungen gegenüber Version 0.1

- Version 0.5 (Marke FORM, Rebranding F1 und F2): Farben nach D-308, Komponenten, Maße und Schrift nach D-314, Breakpoints und Inhaltsbreite an einer Stelle (D-313), Tab-Leiste mit Glas in FORM-Farben (D-312). Werte, Kontraste und Abweichungen in `brand-tokens.md`; die Abschnitte 3 bis 5 sind angepasst, die Farbtabellen in Abschnitt 2 zeigen einen älteren Stand.
- Farbtokens rechnerisch geprüft (WCAG-Kontrast und Diagrammpalette). Geändert: heller Akzent `#1F6FEB` → `#256abf`, Erfolgstext `#1B8A5A` → `#13794D`, Warntext `#B7791F` → `#976200`; im dunklen Modus getrennte Tokens für Akzentfläche und Akzenttext. Neu: Rahmen für Eingabefelder mit mindestens 3:1.
- Diagrammregeln neu nach einer validierten Methode (Abschnitt 8).
- Navigation im MVP ohne Ernährung (D-211); Sitemap und Screen-Katalog mit Ausbaustufen, Routen, Zuständen und AK-Verweisen.
- Neu: Unterschiede Touch und Desktop, Texte und Ton.
- Version 0.4 (Designsystem 2.0, AP D1 und D2): Richtung und Befunde in `ux-audit.md`. Flächen ohne Rahmen mit Schatten `--shadow-card`, Bühne `--ink` mit `--on-ink`, Tonflächen `--accent-soft`, `--success-soft`, `--warning-soft`, `--danger-soft`; Schaltflächen als Pille (48 px); Radien 12/20/28; Vorzeile (`eyebrow`), Display 40 px, Timer 64 px; neue Komponenten `StatTile`, `Meter`, `ProgressRing`, `EmptyState`, `IconButton`; Player mit Bühne „Jetzt“ und Pause als Bühne (`RestStage`). Seitenhintergrund hell `#f3f4f7`, dunkel `#0d1016`.
- Version 0.3 (M0): Tokens als CSS-Variablen in `src/shared/ui/tokens.css`, Tailwind nutzt nur diese (Standardpaletten abgeschaltet). Der automatische Kontrasttest fand zwei Grenzfälle; angepasst wurden `--border-input` hell und `--meter-track` dunkel (D-236). Grundfassungen von S-01 und S-34 in M0. Nachtrag: Ladezustand mit `Skeleton` und `aria-busy` (D-239).

## 1. Designprinzipien

1. **Zahlen zuerst.** Gewicht, Wiederholungen, Zeiten und später Nährwerte sind der Inhalt. Große, ruhige Ziffern, hoher Kontrast, keine Dekoration, die mit Zahlen konkurriert.
2. **Einhändig im Training.** Alle Aktionen einer Einheit liegen im unteren Drittel; Bedienziele mindestens 48 pt; Eingaben ohne Umwege.
3. **Ruhig und hochwertig.** Wenige Farben, ein Akzent, viel Weißraum, Hierarchie über Typografie und Abstand statt über Rahmen und Schatten. Kein Kachel-Dashboard mit gleich lauten Karten.
4. **Ehrliche Daten.** Leere Zustände nennen den nächsten Schritt; keine Platzhalterwerte; Schätzungen sichtbar markiert; Trends erst ab ausreichender Datenlage.
5. **Gleiche Sorgfalt auf dem Mac.** Seitenleiste, zweispaltige Ansichten, Tastaturkürzel, Hover als Ergänzung.
6. **Hell als Standard, Dunkel gleichwertig.** Jedes Token ist für beide Modi definiert und geprüft.

## 2. Farbtokens

Marke FORM (D-308, D-314): Die Werte stehen in `src/shared/ui/tokens.css`, die Zuordnung alt → neu, die gemessenen Kontraste und die bewussten Abweichungen in `brand-tokens.md`. Flächen sind deckend: Nacht `--bg`, Bühne und Sheets `--bg-elevated` (`--ink`, `--panel`), Karten `--surface`, Chips und Eingaben `--surface-2`; Trennung über den 1-px-Rand `--border`, keine Schatten, keine Verläufe. Glas gibt es nur in der Tab-Leiste (`--tabbar-glass`, D-312). Lime (`--accent`) ist der einzige Akzent; Blau (`--action`) nur im aktiven Workout. `tokens.test.ts` prüft den Kontrast. Die Tabellen unten zeigen den Stand vor D-272 und gelten nur noch für Namen und Verwendung.

### 2.1 Oberfläche

Geprüft mit einem eigenen WCAG-Kontrastskript (Werte gerundet). Text braucht 4,5:1, Bedienelemente und Diagrammlinien 3:1.

| Token | Hell | Dunkel | Verwendung | Kontrast (hell / dunkel) |
|---|---|---|---|---|
| `--bg` | `#FAFAF9` | `#0F1115` | Seitenhintergrund | – |
| `--surface` | `#FFFFFF` | `#171A21` | Karten, Sheets, Diagrammfläche | – |
| `--surface-2` | `#F3F4F6` | `#1F232C` | Eingabefelder, gruppierte Bereiche | – |
| `--fg` | `#111318` | `#ECEEF2` | Primärtext | 18,6 / 15,0 auf Fläche |
| `--fg-muted` | `#5B6270` | `#9AA3B2` | Sekundärtext, Achsen, Zielinien | 6,1 / 6,8 auf Fläche; 5,6 / 6,2 auf Fläche 2 |
| `--border` | `#E5E7EB` | `#2A2F3A` | Trennlinien, Gitterlinien (dekorativ) | – |
| `--border-input` | `#828b99` (D-236) | `#6B7383` | Rahmen von Eingabefeldern | auf Seite, Fläche, Fläche 2: 3,3 / 3,4 / 3,1 (hell), 4,0 / 3,7 / 3,3 (dunkel) |
| `--accent` | `#256abf` | `#3987e5` | Primäre Schaltflächen, aktive Tabs, Fortschritt | Weiß auf Akzent 5,4; Dunkel auf Akzent 5,3 |
| `--accent-hover` | `#1c5cab` | `#5598e7` | Hover und gedrückt | Weiß 6,6; Dunkel 6,5 |
| `--accent-fg` | `#FFFFFF` | `#0B0E14` | Text auf Akzentfläche | siehe oben |
| `--accent-ink` | `#256abf` | `#5598e7` | Links, Akzenttext, Symbole auf Flächen | 5,4 / 5,8 auf Fläche; 4,9 / 5,3 auf Fläche 2 |
| `--focus` | `#256abf` | `#5598e7` | Fokusring 2 px mit 2 px Abstand | ≥ 3:1 |
| `--success` | `#13794D` | `#3DBE86` | Erfolgstext, „erledigt", Ziel erreicht | 5,4 / 7,4 |
| `--warning` | `#976200` | `#E0A943` | Hinweise, „geschätzt", Speicherwarnung | 5,2 / 8,2 |
| `--danger` | `#C53030` | `#F26D6D` | Löschen, Fehler | 5,5 / 6,0 |
| `--accent-soft`, `--success-soft`, `--warning-soft`, `--danger-soft` | `#e6edf9`, `#e2f3ea`, `#fbf0da`, `#fbe7e7` | `#15263f`, `#10302a`, `#33290f`, `#3a1c1f` | Tonflächen für Chips, Etiketten, Hinweise, aktiven Tab; Text darauf in der Vollfarbe | je ≥ 4,5 (Test) |
| `--ink`, `--ink-2` | `#151b2b`, `#212a3f` | `#1a2030`, `#242c40` | Bühne: eine Karte je Seite für die wichtigste Information (laufendes Training, „Jetzt“, Pause, Abschluss); `--ink-2` für Kacheln auf der Bühne | – |
| `--on-ink`, `--on-ink-muted` | `#f5f7fb`, `#aab3c5` | `#f1f3f8`, `#aab3c5` | Text auf der Bühne | ≥ 4,5 auf `--ink` und `--ink-2` (Test) |
| `--shadow-card`, `--shadow-float` | weich, 4 bis 6 % | 25 bis 45 % | Karten; schwebende Elemente (Sheet, Toast, Menü) | – |

Statusfarben erscheinen nie allein: immer mit Symbol und Text.

### 2.2 Diagramme

Die Diagrammpalette ist die validierte Referenzpalette der Datenvisualisierungs-Methode, geprüft gegen unsere Flächen `#FFFFFF` (hell) und `#171A21` (dunkel) mit dem Validierungsskript der Methode (Prüfungen: Helligkeitsband, Chroma, Farbfehlsichtigkeit, Unterscheidbarkeit bei normalem Sehen, Kontrast).

| Slot | Farbton | Hell | Dunkel | Verwendung |
|---|---|---|---|---|
| `--data-1` | Blau | `#2a78d6` | `#3987e5` | Hauptreihe jedes Diagramms; ab R2 Protein |
| `--data-2` | Orange | `#eb6834` | `#d95926` | ab R2 Kohlenhydrate |
| `--data-3` | Aqua | `#1baf7a` | `#199e70` | ab R2 Fett |
| `--data-4` bis `--data-8` | Gelb, Magenta, Grün, Violett, Rot | `#eda100`, `#e87ba4`, `#008300`, `#6250d6`, `#e34948` | `#c98500`, `#d55181`, `#008300`, `#9085e9`, `#e66767` | Reserve in fester Reihenfolge |

| Prüfung | Ergebnis hell | Ergebnis dunkel |
|---|---|---|
| Alle 8 Slots, benachbarte Paare | Bestanden; schwächstes Paar unter Farbfehlsichtigkeit ΔE 9,1, normales Sehen ΔE 19,6 | Bestanden; ΔE 8,4 bzw. 19,3 |
| Slots 1 bis 3, alle Paare | Bestanden; ΔE 9,2 bzw. 24,0 | Bestanden; ΔE 9,4 bzw. 20,9 |
| Kontrast zur Fläche | Aqua, Gelb und Magenta unter 3:1: Diese Slots erscheinen nur mit sichtbarer Beschriftung oder Tabellenansicht | Alle ≥ 3:1 |

Weitere Diagramm-Tokens:

| Token | Hell | Dunkel | Verwendung |
|---|---|---|---|
| `--chart-grid` | `#E5E7EB` | `#2A2F3A` | Gitterlinien, 1 px, durchgezogen |
| `--chart-axis` | `#5B6270` | `#9AA3B2` | Achsenbeschriftung, Ziel- und Referenzlinien |
| `--chart-point` | `#8A93A1` | `#6B7383` | Einzelmesspunkte als Kontext (3,1 / 3,7) |
| `--meter-track` | `#cde2fb` | `#15365f` (D-236) | Unbefüllter Teil eines Fortschrittsbalkens (hellere bzw. dunklere Stufe der Akzentskala); Füllung `--accent` dazu 4,1:1 bzw. 3,4:1 |
| `--chart-total` | `#3A4150` | `#C3CAD6` | Gesamtwert (ab R2 Kalorien) neben farbigen Makros |

### 2.3 Umsetzung

Tokens als CSS-Variablen auf `:root` (dunkel, ausgeliefert); die hellen Werte stehen unter `:root[data-theme='light']` und werden nicht ausgeliefert (D-311). Tailwind liest Farben, Maße, Radien, Schriftgrößen und Breakpoints über `@theme` in `src/app/styles.css`. Der `body` trägt `--bg-top` als Hintergrund (Farbe der Statusleiste); eine eigene Hintergrundebene mit Lichtflecken gibt es nicht mehr (D-314).

## 3. Typografie

- Systemschrift: `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif` (San Francisco auf Apple-Geräten); Inter ist nicht gebündelt (D-203).
- Skala der Marke FORM (D-314): Headline 28/600 (`text-headline`, Seitentitel), Titel 20/600 (`text-title`, Karten und Dialoge), Text 16/400, Untertitel 13/400 (`text-caption`), Label 13/500 in Versalien mit 4 % Laufweite (`eyebrow`), Wert groß 40/600 (`text-value`), Timer 56/600 (`text-timer`), Tab-Beschriftung 11/500 (`text-tab`). Eingabefelder mindestens 16 px, damit iOS nicht zoomt.
- Ziffern: Tabellenziffern in der ganzen App (`body`), damit sich wechselnde Ziffern nicht verschieben.
- Zeilenhöhe 1,4 für Text, 1,05 bis 1,2 für große Zahlen und Titel. Gewicht 600 für Kennzahlen und Titel, 400 für Text, 500 für Labels.

## 4. Abstände, Radien, Schatten, Bewegung

- Tokens statt fester Pixel (D-313, D-314): Seitenrand 20 (Handy), 24 (ab 48 rem), 32 (ab 64 rem); Innenabstand der Karte 16; Abstand zwischen Karten 12; Kopfzeile 56, Logo 30, Tab-Leiste 64, Eingabe 48, Primärknopf 52, Chip 36, Symbol-Kachel 40, kleinste Tippfläche 44. Größte Inhaltsbreite 75 rem (`max-w-content`). Breakpoints `xs` 22,5, `sm` 40, `md` 48, `lg` 64, `xl` 80 rem an einer Stelle (`@theme`), im Code über `src/shared/ui/breakpoints.ts`.
- Radien 12 (Eingaben, Symbol-Kacheln), 14 (Knöpfe), 20 (Karten), 24 (Sheets und Dialoge), rund (Chips, Etiketten, runde Symbol-Knöpfe).
- Keine Schatten: Karten, Sheets, Toasts und Menüs tragen den 1-px-Rand (`--shadow-card`, `--shadow-float` sind nur dieser Rand). Kein Glas außer der Tab-Leiste (D-312).
- Bewegung: 120 ms für Zustandswechsel, 240 ms für Sheets; gedrückte Knöpfe 92 % Deckkraft; bei `prefers-reduced-motion` ohne Animation.
- Sichere Bereiche: `env(safe-area-inset-*)` für Tab-Leiste, Aktionsleiste des Trainings und Sheets.

## 5. Komponenten (MVP)

| Ebene | Komponenten |
|---|---|
| Basis | Button (primär Lime, sekundär Ghost mit Rand, leise als Text in Lime, destruktiv als Ghost in Rot; Größen 40, 48, 52 px), IconButton (rund, 44 px, optional in einer Kachel card-2), Eingabe `field` (card-2, Rand 3:1, Radius 12, Fokus-Rand Lime), NumberField (Dezimalkomma, ±-Schritte), DurationField, Select, SegmentedControl (als Chips), Switch, Checkbox, Chip (36 px, aktiv Lime), Tag, Badge („Beispiel", „Aktiv"), Tooltip, Skeleton |
| Struktur | Card (Fläche, 1-px-Rand, Titel oder Label), Bühne (`bg-elevated`), Section mit Titel und Aktion, List und ListItem (Listenzeile mit Symbol-Kachel 40 px), Table (Desktop und Tabellenansicht der Diagramme), Sheet (mobil, unten, Griff, wegwischbar) und Dialog (Desktop), Tabs, Accordion, Toast mit „Rückgängig", Banner (global) |
| Navigation | TabBar (mobil, Glas mit Linse, beim Scrollen ein Kreis rechts), Sidebar (Desktop, deckend), Kopfzeile mit Kachel-F und Wortmarke, Back-Navigation |
| Training | SetRow (Typ, Vorwert, Gewicht, Wiederholungen oder Zeit, Status), ExerciseBlock, RestTimerBar und RestTimerFull, SessionHeader (Dauer, Fortschritt), SessionBanner („Training läuft"), ExercisePicker, ReplaceSheet, ProgramWeekView, DayEditor, SetSchemeEditor |
| Fortschritt | StatTile (Label und Wert), Meter (Balken 6 px), ProgressRing (SVG, Strich 10 px, Lime auf card-2), Sparkline, WeightChart, ExerciseProgressChart, ChartTable |
| System | EmptyState (Symbol in `text-faint`, ein Satz, eine Aktion), ErrorState, RecoveryScreen, UpdateBanner, InstallGuide, PreviewBadge, StorageStatus, ImportWizard |

Jede Komponente hat definierte Zustände: Standard, Hover (nur Zeiger), Fokus, gedrückt, deaktiviert, Laden, Fehler. Screenshots je Komponente: `docs/screens/komponenten/` (erzeugt mit `node tools/screenshots.mjs komponenten`).

## 6. Touch und Desktop

| Thema | Touch (iPhone, iPad) | Desktop (Mac), iPad mit Tastatur |
|---|---|---|
| Bedienziele | Mindestens 44 × 44 pt, im Training 48 × 48 pt | Gleiche Größen; zusätzlich Hover |
| Primäraktionen | Unten erreichbar (Tab-Leiste, Aktionsleiste, Sheets) | Oben rechts in der Kopfzeile oder in der Detailspalte |
| Eingaben | `inputmode="decimal"` für Gewicht, `numeric` für Wiederholungen, `enterkeyhint="next"` bzw. `done`; Schrift ≥ 16 px | Tastatur; Pfeiltasten ändern Zahlen um einen Schritt |
| Gesten | Keine Funktion nur per Wischen; jede Wischaktion hat einen sichtbaren Knopf | Kontextmenü als Ergänzung |
| Overlays | Sheet von unten mit Griff | Dialog zentriert, Esc schließt |
| Layout | Einspaltig; iPad zweispaltig ab 768 pt | Seitenleiste, Inhalt bis 1200 px, Liste und Detail nebeneinander |
| Kürzel | – | Im Training: Eingabetaste im Wiederholungsfeld = Satz erledigt; Tab und Umschalt+Tab zwischen Feldern; Esc schließt; ⌘K bzw. Strg+K öffnet die Übungssuche |
| Fokus | Sichtbar bei Tastaturbedienung | Immer sichtbar (2 px `--focus`) |

## 7. Zustände und Hinweise

| Zustand | Gestaltung | Beispieltext |
|---|---|---|
| Laden | Skelett in der Form des Inhalts (`Skeleton`, ohne Animation), der Bereich trägt `aria-busy`; Auswahlen und Eingaben erst mit den gespeicherten Werten, nie vorab mit Standardwerten (D-239); nie ein Ganzseiten-Spinner | – |
| Leer | Ein Satz, eine Hauptaktion | „Noch kein Training gespeichert. Starte mit einer Vorlage oder einem freien Training." |
| Fehler | Ursache in einfachen Worten, „Erneut versuchen", Verweis auf das Fehlerprotokoll | „Speichern hat nicht geklappt. Deine Eingabe ist noch da." |
| Zu wenig Daten | Liste statt Diagramm | „Für einen Verlauf braucht es mindestens drei Einträge." |
| Geschätzt (ab R2) | Warnfarbe mit Symbol und Wort | „geschätzt" |
| Vorschau-Deployment | Dauerhaftes Etikett oben | „Vorschau – Testdaten" |
| Safari-Tab unter iOS | Banner mit Anleitung | „Für dauerhafte Daten: Teilen › Zum Home-Bildschirm. Daten im Browser-Tab sind von der installierten App getrennt." |
| Update | Banner, nie während eines Trainings | „Neue Version verfügbar · Jetzt aktualisieren" |
| Sicherung | Karte auf „Heute" nach 14 Tagen ohne Export | „Letzte Sicherung vor 16 Tagen · Jetzt exportieren" |

## 8. Diagramme

### 8.1 Grundregeln

- Erst die Form wählen, dann die Farbe. Eine einzelne Zahl ist eine Kennzahl, kein Diagramm.
- Eine Achse pro Diagramm; nie zwei Skalen.
- Linien 2 px, Punkte mindestens 8 px mit 2 px Ring in Flächenfarbe; Gitterlinien 1 px, durchgezogen, nur horizontal.
- Text trägt Text-Tokens, nie die Reihenfarbe; die Zuordnung leistet ein Farbsymbol daneben.
- Ab zwei Reihen gibt es eine Legende; das Ende der Hauptreihe trägt eine direkte Beschriftung; nie eine Zahl an jedem Punkt.
- Hover und Tastaturfokus zeigen einen Tooltip mit Fadenkreuz; Trefferflächen mindestens 24 px. Jedes Diagramm hat eine umschaltbare Tabellenansicht, damit kein Wert nur im Tooltip steht.
- Zeitraumwahl als Segmented Control in einer Zeile über dem Diagramm.
- Unter drei Datenpunkten keine Linie und kein Trend; Lücken werden nicht interpoliert.
- Liniendiagramme dürfen eine Achse ohne Nullpunkt haben; Balken beginnen immer bei null.
- Nach der Umsetzung werden alle Diagramme in Hell und Dunkel gerendert und als Bildschirmfoto geprüft (Beschriftungen, Überlappungen, Ränder).

### 8.2 Diagramme im MVP

Stand Schritt E (18.10.2026): C-01, C-02 und C-03 umgesetzt (`src/shared/charts/LineTimeChart.tsx`, Recharts), Bildschirmfotos hell und dunkel in `screenshots/c01-gewicht-*.png`; die Ziellinie in C-01 kam mit den Zielen (D-254). Linien verbinden Punkte gerade, ohne Glättung, damit keine Werte zwischen den Messungen erfunden wirken.

| ID | Diagramm | Form | Farben | Interaktion | Regeln |
|---|---|---|---|---|---|
| C-01 | Körpergewicht (S-28) | Linie für den gleitenden 7-Tage-Durchschnitt, Punkte für jede Messung, waagerechte Ziellinie | Linie `--data-1`; Punkte `--chart-point`; Ziellinie 1 px `--chart-axis` mit Beschriftung „Ziel 75,0 kg" | Legende „Messung" und „Ø 7 Tage"; Beschriftung am Linienende; Tooltip mit Datum, Uhrzeit, Wert und Durchschnitt; Zeiträume 30 T, 90 T (Standard), 1 J, Gesamt; Tabellenansicht | Durchschnitt ab drei Einträgen im Zeitraum; y-Achse mit runden Grenzen um die Daten |
| C-02 | Übungsverlauf (S-13) | Linie mit Punkt je Einheit auf einer echten Zeitachse | `--data-1`, keine Legende (eine Reihe; der Titel nennt die Kennzahl) | Umschalter „Bester Satz" und „Geschätztes 1RM"; Zeiträume 3 M, 1 J (Standard), Gesamt; Tooltip mit Datum, Wert, Satz (z. B. „80 kg × 6") und Einheit; Beschriftung am letzten Punkt; Tabellenansicht | 1RM nur für 1 bis 10 Wiederholungen; unter drei Punkten Liste |
| C-03 | Mini-Verlauf Körpergewicht (S-01) | Sparkline mit bis zu 12 letzten Messungen | Linie `--chart-point`, letzter Punkt `--data-1` | Keine; für Screenreader als Text „78,4 kg, minus 1,2 kg in 30 Tagen" | Ab drei Einträgen |

### 8.3 Kennzahlen und Fortschrittsbalken

- **StatTile:** Bezeichnung in Satzschreibweise ohne Doppelpunkt · Wert (Gewicht 600, proportionale Ziffern) · optionale Veränderung mit Vorzeichen und Zeitraum · optionale Sparkline. Beispiel: „Körpergewicht · 78,4 kg · −1,2 kg in 30 Tagen".
- **Farbe der Veränderung:** Beim Gewicht in Richtung Ziel `--success`; vom Ziel weg und ohne Ziel neutral `--fg-muted`; nie Rot. Beim Trainingsvolumen immer neutral mit Pfeilsymbol, damit Entlastungswochen nicht als Misserfolg erscheinen.
- **Meter (Wochenziel):** Füllung `--accent`, Spur `--meter-track`, Text daneben „2 von 3 Trainings"; bei erreichtem Ziel zusätzlich Häkchen-Symbol und „Wochenziel erreicht".

### 8.4 Ausblick R2

Makronährstoffe tragen feste Farben über alle Ansichten: Protein `--data-1`, Kohlenhydrate `--data-2`, Fett `--data-3`; Kalorien neutral `--chart-total`. Weil Aqua im hellen Modus unter 3:1 liegt, zeigen Makro-Balken immer den Wert als Text daneben. Über- und Unterschreitung des Ziels erscheinen mit Symbol und Text, nicht nur farbig.

## 9. Navigation und Sitemap

### 9.1 Navigation

| Ausbaustufe | iPhone (Tab-Leiste) | Desktop und iPad quer (Seitenleiste) |
|---|---|---|
| R1 (MVP) | Heute · Training · Fortschritt · Mehr | Heute, Training (Programme, Verlauf, Übungen), Fortschritt, Mehr |
| ab R2 | Heute · Training · Ernährung · Fortschritt · Mehr | zusätzlich Ernährung (Tag, Lebensmittel, Rezepte, Wochenmenü, Einkauf) |

- Die Aktion „Erfassen" sitzt oben rechts auf „Heute" und öffnet ein Sheet: Training starten oder fortsetzen, Training nachtragen, Gewicht erfassen; ab R2 Mahlzeit und Wasser.
- Der Trainingsplayer ist eine Vollbildansicht ohne Tab-Leiste. Außerhalb davon zeigt eine Leiste „Training läuft" den Weg zurück.
- Höchstens drei Ebenen Tiefe.
- Glas-Look (D-272): Am Handy schwebt die Tab-Leiste als Glas-Kapsel über dem Inhalt; ein Finger hebt die Auswahl als Linse an, Ziehen wählt beim Loslassen. Ab 1024 px schwebt links eine eingeklappte Seitenleiste mit Symbolen, die unter der Maus oder mit Tastaturfokus ausklappt; der Inhalt rückt dabei mit.

### 9.2 Sitemap

```
Heute (/heute)                                         R1
  Tagesaufgaben (/heute/aufgaben)                      R1 (Schritt F)
  Training läuft · Heute geplant / Nächstes Training · Letztes Training
  Wochenziel · Körpergewicht · Hinweise (Installation, Update, Sicherung)
  Erfassen › Training starten · Training nachtragen · Gewicht erfassen
Training (/training)                                   R1
  Aktives Programm, nächster Tag, Vorschau
  Programme und Vorlagen › Detail › Editor › Trainingstag
  Beispielvorlage (/training/vorlagen/:key)
  Trainingsplayer (/training/einheit/:id) › Zusammenfassung
  Nachtragen (/training/nachtragen)
  Verlauf (/training/verlauf) › Detail
  Übungen (/uebungen) › Detail › Eigene Übung
Ernährung (/ernaehrung/:datum)                         R2
  Tag › Eintrag hinzufügen · Lebensmittel · Rezepte · Wochenmenü · Einkaufsliste
Fortschritt (/fortschritt)                             R1
  Körpergewicht (/fortschritt/gewicht)                 R1
  Übungsverläufe (Einstieg, Detail in /uebungen/:id)   R1
  Maße, Fotos, Trainingsanalyse, Bestleistungen        R4
Mehr (/mehr)                                           R1
  Profil und Ziele · Einstellungen · Daten und Sicherung
  Installieren · Über
  Synchronisierung (/mehr/sync)                        R3
  Gewohnheiten (/gewohnheiten), Kalender (/kalender)   R4
```

## 10. Screen-Katalog

### 10.1 MVP (R1)

| ID | Screen | Route | M | Inhalt | Aktionen | Zustände | AK |
|---|---|---|---|---|---|---|---|
| S-01 | Heute | `/heute` | M0 (Grundfassung), M1, M3 | Karten nach Datenlage: Training läuft, Heute geplant oder Nächstes Training, Letztes Training, Wochenziel, Körpergewicht, Hinweise | Fortsetzen, Starten, Anderen Tag wählen, Erfassen, Gewicht erfassen, Wochenziel festlegen | Ohne Programm: Vorlage, Eigenes, Frei; ohne Gewicht: Gewicht erfassen; Laden: Skelett je Karte | AK-DSH-01 bis AK-DSH-08, AK-DAT-12 |
| S-02 | Ersteinrichtung | Overlay beim ersten Start | M3 | Begrüßung, Installationshinweis, Wochenziel, Zielgewicht, Programmwahl | Weiter, Überspringen | – | AK-ONB-01 |
| S-03 | Training | `/training` | M1, M2 | Aktives Programm, Woche, nächster Tag, Vorschau; Einstiege Programme, Verlauf, Übungen, Nachtragen | Starten, Anderen Tag wählen, Freies Training, Programm wechseln | Ohne Programm: Leerzustand | AK-PRG-08, AK-PRG-12, AK-TRN-02 |
| S-04 | Programme und Vorlagen | `/training/programme` | M1, M2 | Meine Programme (aktiv markiert), meine Vorlagen, Beispielvorlagen | Neu, Vorlage verwenden, Importieren | Nur Beispielvorlagen vorhanden | AK-PRG-06, AK-PRG-11, AK-PRG-13 |
| S-05 | Programmdetail | `/training/programme/:id` | M2 | Wochen, Tage, Übungen, Satzschema, nächster Tag markiert | Aktivieren, Tag starten, Bearbeiten, Duplizieren, Als Vorlage speichern, Exportieren, Archivieren, Löschen | – | AK-PRG-05 bis AK-PRG-07, AK-PRG-12, AK-PRG-13 |
| S-49 | Beispielvorlage | `/training/vorlagen/:key` | M1 | Wie Programmdetail, mit Etikett „Beispiel" und Hinweistext | Vorlage verwenden, Nur heute trainieren | – | AK-PRG-06 |
| S-06 | Programm-Editor | `/training/programme/:id/bearbeiten` | M2 | Name, Beschreibung, wiederholen, Wochen und Tage | Hinzufügen, Umbenennen, Duplizieren, Löschen, Nach oben, Nach unten | Laufende Speicherung; Löschen mit Rückgängig | AK-PRG-01, AK-PRG-02 |
| S-38 | Trainingstag bearbeiten | `/training/programme/:id/tage/:dayId` | M2 | Übungen mit Satzschema; Wochentag-Hinweis | Übung hinzufügen, ersetzen, verschieben, entfernen; Satz hinzufügen; Typ, Bereich, Zielgewicht, Zielzeit, Pause | – | AK-PRG-03, AK-PRG-04, AK-PRG-09 |
| S-39 | Übung auswählen | Sheet | M1 | Suche, Filter Muskelgruppe und Gerät, Zuletzt, Favoriten | Auswählen, mehrfach | Keine Treffer: „Eigene Übung anlegen" | AK-EXL-02, AK-TRN-02 |
| S-40 | Übung ersetzen | Sheet | M2 | Alternativen gleicher Hauptmuskelgruppe, Suche | Nur heute ersetzen, Im Plan ersetzen | – | AK-PRG-03, AK-TRN-09 |
| S-07 | Trainingsplayer | `/training/einheit/:id` | M1 | Kopf mit Titel, Dauer, Fortschritt; Übungsblöcke mit Satzzeilen; Pausenleiste; Aktionsleiste | Satz erledigt, rückgängig, überspringen; Werte ändern; Satz und Übung hinzufügen, entfernen, ersetzen; Pausieren; Notiz; Beenden; Verwerfen | Speicherfehler-Hinweis; Wake Lock nicht verfügbar; Wiederaufnahme | AK-TRN-01 bis AK-TRN-26 |
| S-08 | Pausentimer | Leiste im Player, aufklappbar zur Vollansicht | M1 | Restzeit groß, nächster Satz mit Zielwerten | +15 s, −15 s, Überspringen | Überziehung „+0:42" | AK-TRN-10 bis AK-TRN-12 |
| S-09 | Zusammenfassung | `/training/einheit/:id/zusammenfassung` | M1, M3 | Dauer, Übungen, Sätze, Volumen, bester Satz je Übung, Vergleich (M3), Notiz | Fertig, Bearbeiten | Ohne Vorgängereinheit kein Vergleich | AK-TRN-20 |
| S-10 | Nachtragen | `/training/nachtragen` | M2 (umgesetzt 18.10.2026, D-255) | Wahl Krafttraining oder Aktivität; Formulare | Speichern | Validierungshinweise | AK-TRN-23 |
| S-11 | Verlauf | `/training/verlauf`, `/training/verlauf/:id` | M1, M2 | Liste nach Wochen; Detail mit allen Sätzen | Öffnen, Bearbeiten, Löschen | Leer: „Noch kein Training gespeichert" | AK-HIS-01 bis AK-HIS-04 |
| S-12 | Übungen | `/uebungen` | M1 | Suche, Filter, Liste mit Muskelgruppe und Gerät | Öffnen, Eigene Übung | Keine Treffer | AK-EXL-01, AK-EXL-02 |
| S-13 | Übungsdetail | `/uebungen/:id` | M2, M3 | Muskeln, Gerät, persönliche Angaben, Videolink, letzte Einheiten, Diagramm C-02 | Persönliche Angaben bearbeiten, Favorit, eigene Übung bearbeiten | Unter drei Einheiten: Liste mit Hinweis | AK-EXL-04, AK-EXL-05, AK-HIS-05 |
| S-14 | Eigene Übung | `/uebungen/neu` | M2 | Formular: Name, Alias, Muskeln, Gerät, Kategorie, Erfassungsart | Speichern, Archivieren | Hinweis bei gleichem Namen | AK-EXL-03 |
| S-27 | Fortschritt | `/fortschritt` | M3 | Körpergewicht (Kennzahl, Mini-Verlauf), häufig trainierte Übungen mit Einstieg in den Verlauf | Öffnen | Leer mit nächstem Schritt | AK-BW-05, AK-HIS-05 |
| S-28 | Körpergewicht | `/fortschritt/gewicht` | M3 | Kennzahlen, Diagramm C-01 mit Zeitraum, Tabellenansicht, Liste nach Monaten | Erfassen, Bearbeiten, Löschen | Leer; unter drei Einträgen kein Trend | AK-BW-01 bis AK-BW-06 |
| S-41 | Gewicht erfassen | Sheet | M3 | Gewicht, Datum, Uhrzeit, Notiz | Speichern, Löschen (bei Bearbeitung) | Plausibilitätshinweis | AK-BW-01, AK-BW-02, AK-BW-04 |
| S-48 | Mehr | `/mehr` | M0 | Profil und Ziele, Einstellungen, Daten und Sicherung, Installieren, Über | Öffnen | – | AK-UX-01 |
| S-33 | Profil und Ziele | `/mehr/profil` | M3 (umgesetzt 18.10.2026, D-254) | Anzeigename, Zielgewicht, Wochenziel, Zielhistorie | Ändern, Entfernen | – | AK-SET-01, AK-SET-05 |
| S-34 | Einstellungen | `/mehr/einstellungen` | M0 (Darstellung, Formatierung), M1, M3, M4 | Training, Darstellung, Hinweis zur Sprache und Formatierung | Umschalten, Werte ändern | Wake Lock nicht verfügbar: Erklärung | AK-SET-02 bis AK-SET-04, AK-TRN-13 |
| S-35 | Daten und Sicherung | `/mehr/daten` | M1, M2, M4 | Speicherstatus, Export, Import, Snapshots, Fehlerprotokoll, Alle Daten löschen | Exportieren, Importieren, Wiederherstellen, Löschen | – | AK-DAT-01 bis AK-DAT-10, AK-PWA-05 |
| S-45 | Import-Assistent | Sheet bzw. Dialog | M2, M4 | Datei wählen, Prüfung, Vorschau mit Anzahl je Typ, Modus, Bericht | Zusammenführen, Ersetzen, Abbrechen | Ungültige Datei mit Grund | AK-DAT-02 bis AK-DAT-05 |
| S-42 | Installieren | `/mehr/installieren` | M0 | Anleitung für iPhone, iPad und Mac; erkannter Status | – | Bereits installiert | AK-PWA-04, AK-SET-06 |
| S-37 | Über | `/mehr/ueber` | M0, M4 | Version, Änderungen, Lizenzen | Nach Update suchen | – | AK-SET-07 |
| S-43 | Wiederherstellung | Vollbild bei Datenbankfehler | M1, M4 | Ursache, Optionen | Erneut versuchen, Snapshot wiederherstellen, Fehlerprotokoll exportieren, Zurücksetzen | – | AK-DAT-08 |
| S-44 | Fehleransicht | Je Route | M0, M4 | Meldung | Neu laden | – | AK-DAT-09 |
| S-50 | Tagesaufgaben | `/heute/aufgaben` | Schritt F | Serie, Heute erledigt, neue Aufgabe, Liste mit Abhaken, Umbenennen, Ordnen, Beenden, letzte 14 Tage, beendete Aufgaben | Anlegen, Umbenennen, Nach oben, Nach unten, Beenden, Wieder aufnehmen | Leer: „Noch keine Aufgabe“ | AK-HAB-01, AK-HAB-02 |
| S-46 | Globale Hinweisleisten | Alle Seiten | M0 bis M4 | Training läuft, Update verfügbar, Installationshinweis (Vorschau-Balken entfällt, D-272) | Tippen führt zur Aktion | – | AK-TRN-17, AK-PWA-03, AK-PWA-04, AK-PWA-07 |

Grundfassungen aus M0: S-01 zeigt Datum, die Karte „Diese Version“ und die Karte „Status“ (Offline-Bereitschaft, Startart mit Weg zu „Installieren“, Hinweis auf lokale Daten); beide Karten entfallen am 19.10.2026 (D-265), die Anleitung bleibt unter „Mehr“ → „Installieren“, der Speicherstand unter „Daten“. S-34 enthält Darstellung (Hell, Dunkel, System) und „Datum und Zahlen“ mit Beispielzeile. Navigation in M0: Heute und Mehr; Training und Fortschritt erscheinen erst mit M1 und M3 (AK-UX-01). Stand M1 (AP 1.1): Training erscheint in der Navigation; S-03 enthält zunächst nur den Einstieg „Übungen", weitere Einstiege folgen mit ihren Arbeitspaketen. S-12 ist umgesetzt (Suche, Filter Muskelgruppe und Gerät nebeneinander, Liste nach Gruppen; ohne Öffnen, weil das Übungsdetail S-13 erst in M2 kommt). Auf `/uebungen` bleibt Training in der Navigation markiert. AP 1.2: S-03 hat den Einstieg „Programme und Vorlagen"; S-04 zeigt in M1 nur die Beispielvorlagen als Karten mit Etikett „Beispiel" und Kurzangaben; S-49 zeigt Hinweis, Ablauf der Wochen und jeden Trainingstag einmal mit Satzschema, z. B. „2 Aufwärmsätze, 3 Sätze · 6–8 Wdh. · Pause 2:30 min". Basiskomponente `Badge` neu. AP 1.4: S-07 umgesetzt wie in Abschnitt 11, ohne Pausenleiste (AP 1.5), Pausieren und Notiz (M2); Kopfzeile je Übung mit Satz, Vorwert und Einheiten; ±-Tasten am hervorgehobenen Satz; Zusatzaktionen je Satz hinter „…". S-39 als Blatt von unten. S-09 in einer Grundfassung (Dauer, Übungen, Sätze, Volumen, bester Satz). Basiskomponenten `Dialog` (natives `<dialog>`) und `Toast` neu; Token `--scrim` für den Hintergrund von Dialogen. AP 2.1 bis 2.4 (D-257): S-04 zeigt „Meine Programme“ mit „Neues Programm“ (Dialog mit Name und Beschreibung), „Meine Vorlagen“ (nur wenn vorhanden), ein einklappbares Archiv und danach die gebündelten Programme und Beispielvorlagen; Löschen bietet 10 s „Rückgängig“. S-05 zeigt Bearbeiten, Als Vorlage speichern bzw. Vorlage verwenden, Duplizieren, Archivieren und Löschen; Exportieren folgt mit AP 2.8. S-49 bietet „Als eigenes Programm übernehmen“. S-06 speichert Name und Beschreibung mit „Speichern“, alles andere sofort; Aktionen je Woche und Tag als Symbolknöpfe mit ausgeschriebener Beschriftung für Screenreader. S-38 zeigt je Übung die Sätze als Karten mit Typ, Bereich von–bis, Zielgewicht bzw. Unterstützung, Zeit und Distanz je Erfassungsart; Pause je Übung als Auswahl mit „Standard“; S-40 (Ersetzen im Plan) nutzt die Übungsauswahl mit Alternativen. AP 2.5 (D-258): S-12 zeigt oben „Eigene Übung“, „Eigene Übungen“ als erste Gruppe mit Etikett „Eigene“, jede Zeile öffnet S-13; ohne Treffer bietet die Liste „„<Suche>“ als eigene Übung anlegen“ an; archivierte eigene Übungen stehen einklappbar am Ende. S-13 unter `/uebungen/:id` zeigt Angaben (Muskeln, Gerät, Erfassung), „Persönliche Angaben“ (Notiz, Standardpause, Gewichtsschritt, Videolink mit „Video öffnen“) und „Letzte Einheiten“ (fünf, mit Weg zu C-02); eigene Übungen zusätzlich „Bearbeiten“ und „Archivieren“. S-14 (eigene Übung) als Dialog mit Name, Hauptmuskelgruppe, weiterer Muskelgruppe, Gerät, Erfassung, Distanz-Einheit und „Je Seite“, mit Hinweis bei gleichem Namen. S-39 zeigt eigene Übungen mit Etikett und am Ende „Eigene Übung anlegen“. Programmdatei und „Importieren“ in S-04 und S-05 entfallen (D-259).

Schritt G Grundausbau (D-261): Navigation mit fünf Bereichen (Heute, Training, Ernährung, Fortschritt, Mehr). S-15 (Tag) unter `/ernaehrung` mit Tageswechsel, Bühne „Gegessen“ (Energie, Ziel, Rest, Makros als Balken, Hinweise auf Lücken und Schätzungen) und je Mahlzeit einer Karte mit Einträgen und „Hinzufügen“; Eintrag antippen öffnet einen Dialog für Menge, Mahlzeit und Löschen (10 s Rückgängig). S-16 (Hinzufügen) unter `/ernaehrung/hinzufuegen` mit Mahlzeit, Schnelleintrag, „Eigenes Lebensmittel anlegen“, Suche, Favoriten und „Zuletzt verwendet“; Treffer mit Quellenetikett (BLS, Eigenes) und Energie je 100; Auswahl öffnet einen Dialog mit Einheit (Portion oder g/ml), Menge und Vorschau der Energie. S-18 und S-19 (Meine Lebensmittel, Formular). S-26 (Ziele) mit „Selbst festlegen“ und „Vorschlag berechnen“. Karte „Ernährung heute“ auf S-01.

### 10.2 Spätere Ausbaustufen

| ID | Screen | Stufe |
|---|---|---|
| S-15 bis S-26 | Ernährung: Tag, Eintrag hinzufügen, Portion, Lebensmittel, Lebensmitteldetail, Barcode, Rezepte, Rezeptdetail, Rezept-Editor, Wochenmenü, Einkaufsliste, Ernährungsziele | R2 |
| S-36 | Synchronisierung: Konto, Status, Geräte, Protokoll | R3 |
| S-29, S-30, S-47 | Fotos, Trainingsanalyse mit Bestleistungen und Statistik, Körpermaße | R4 |
| S-31, S-32 | Gewohnheiten, Kalender | R4 |

## 11. Trainingsplayer im Detail

- **Kopf:** Titel (z. B. „Tag A · Ganzkörper"), laufende Dauer ohne Pausen, Fortschritt „8 von 20 Sätzen", Menü mit Pausieren, Notiz, Übung hinzufügen, Beenden, Verwerfen.
- **Übungsblöcke:** Name, Hauptmuskelgruppe, Notiz; darunter Satzzeilen. Jede Zeile zeigt Typ (A = Aufwärmen, Zahl = Arbeitssatz, D = Drop-Satz, eingerückt), Vorwert („60 × 8"), Felder für Gewicht und Wiederholungen (bzw. Zeit mit Start-Knopf) und den Knopf „erledigt". Erledigte Sätze erscheinen in Erfolgsfarbe mit Häkchen.
- **Freie Reihenfolge:** Jede Zeile ist jederzeit bedienbar; die App hebt den nächsten offenen Satz hervor, erzwingt ihn aber nicht.
- **Vorschläge:** Platzhalter zeigen Vorwert oder festen Zielwert; „erledigt" übernimmt sichtbare Vorschläge (D-225).
- **Bühne „Jetzt":** Unter dem Kopf eine Karte in `--ink` mit der aktuellen Übung, Satz x von n, Ziel, Vorwert und der nächsten Übung; nach dem letzten Satz „Alle Sätze erledigt".
- **Pause als Bühne (`RestStage`):** Erscheint nach „erledigt" im klebenden Kopf und ersetzt „Jetzt": Restzeit 40 px, nächster Satz mit Ziel und Vorwert, −15 s, +15 s, Überspringen; Pfeil öffnet die Vollansicht mit Timer 64 px. Überziehung „+0:42" färbt die Bühne in Akzent (AK-TRN-12).
- **Kopf:** Vorzeile (Programm und Woche oder „Freies Training"), Titel, Fortschrittsbalken mit Dauer, „x von n Sätzen", Schaltfläche „Beenden".
- **Aktionsleiste:** „Satz erledigt" (groß) für den hervorgehobenen Satz und „Übung hinzufügen"; „Beenden" steht im Kopf, „Training verwerfen" am Ende der Liste.
- **Speicherung:** Ohne Speichern-Knopf; jede Änderung wird sofort gesichert. Bei einem Fehler erscheint ein Hinweis direkt am betroffenen Satz.

## 12. Texte und Ton

- Anrede „du", kurze Sätze, aktive Verben auf Knöpfen („Training starten", „Satz erledigt", „Gewicht erfassen").
- Satzschreibweise in Überschriften und Bezeichnungen.
- Zahlen und Datum über `Intl` nach Gerätesprache (D-212): „72,5 kg", „Sa., 18. Okt.", „09:15"; Tausendertrennung nach Gerätesprache; „heute" und „gestern" für die letzten zwei Tage.
- Keine Bewertung von Körperwerten; neutrale Formulierungen, keine medizinischen Aussagen.

## 13. Barrierefreiheit

- Kontrast nach Abschnitt 2; Fokus immer sichtbar; logische Reihenfolge; Sheets und Dialoge mit Fokusfalle und Esc.
- Jedes Eingabefeld hat eine Beschriftung; Satzzeilen sind für Screenreader als „Satz 2, Arbeitssatz, 60 Kilogramm, 8 Wiederholungen, erledigt" lesbar.
- Der Timer meldet über `aria-live` nur Zustandswechsel (Start, Ende), nicht jede Sekunde.
- Diagramme haben eine Tabellenansicht und eine kurze Textzusammenfassung.
- Bewegung reduzierbar; keine Information nur über Farbe.

## 14. Prüfungen

| Prüfung | Werkzeug | Stand |
|---|---|---|
| Kontrast der UI-Tokens | Automatischer Test `src/shared/ui/tokens.test.ts` (liest `tokens.css`, läuft in der CI) | Bestanden nach Anpassung (D-236); prüft auch, dass beide dunklen Blöcke gleich sind |
| Diagrammpalette | Validierungsskript der Datenvisualisierungs-Methode, hell und dunkel, benachbarte und alle Paare | Bestanden; Kontrast-Hinweis für drei helle Slots (Abschnitt 2.2) |
| Automatische Barrierefreiheit | axe in Playwright (WCAG 2.1 A und AA) | Ab M0 für alle vorhandenen Ansichten in Hell und Dunkel; Chromium bestanden, WebKit folgt in der CI |
| Diagramme visuell | Bildschirmfotos hell und dunkel | M3 |
