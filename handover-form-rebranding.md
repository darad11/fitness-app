# Übergabe · Rebranding der App zu FORM (Look aus dem Konzept, Funktionen unverändert)

Stand: 21.10.2026 · Für die nächste Claude-Code-Sitzung · Verbindlich bleiben `CLAUDE.md`, `implementation-plan.md`, `decisions.md`. Dazu kommen: `handover-markenassets.md` (Pakete A–E), `form-app-assets.zip` (Dateien), `form-markenleitplanken.md` (Sprache, Rückkehr-Flow). Diese Datei ordnet alles und fügt das eigentliche Rebranding (Paket F) und den Rückkehr-Flow (Paket G) hinzu.

## 1. Ziel in einem Satz

Die bestehende App behält jeden Screen, jede Funktion und jeden Datenfluss – und bekommt den Look des FORM-Konzepts: dunkle Fläche, Lime als Akzent, ruhige Karten, das F als Zeichen. Kein Feature wird neu gebaut außer dem Rückkehr-Flow; nichts wird entfernt.

**Was „Look aus dem Konzept“ heißt.** Das Konzeptbild (sechs Screens: Home, Programme, aktives Workout, Abschluss, Übungsdetails, Ernährung) ist Vorlage für Farben, Flächen, Radien, Typografie, Karten, Buttons, Tab-Bar und Progress-Ringe. Es ist **nicht** Vorlage für Texte und Features: der Programmname im Konzeptbild, „Disziplin heute, Ergebnisse morgen“, „Konstanz schlägt Motivation“, „Starke Leistung!“, Konfetti-Emoji und „Tägliche Challenges“ als Zähler widersprechen den Markenleitplanken und werden nicht übernommen. Texte kommen aus `form-markenleitplanken.md`, Abschnitt 4, und dem Textdokument.

**Was gleich bleibt.** Navigation (Heute, Training, Ernährung, Fortschritt, Mehr), alle Unterseiten, Datenmodell, Offline-Verhalten, Synchronisation, Tests. Keine Umbenennung von Routen oder Komponenten, nur deren Darstellung.

## 2. Vorher → Nachher

| Heute (aus dem Screen-Recording) | Nachher (Konzept + Markenhandbuch) |
|---|---|
| Heller Hintergrund, weiße Karten, blaue Akzente, Navy-Hero-Karten | Dunkle Fläche Nacht, Karten eine Stufe heller mit 1-px-Rand, Lime als einziger Akzent, keine Navy-Verläufe |
| Kopfzeile „Fitness“ mit Hantel-Icon | Kopfzeile mit Kachel-F plus Wortmarke (`logo-kopfzeile-dunkel.svg`, 30 px), Tipp führt zu „Heute“ |
| „Guten Tag, DR.“ mit Datum und Uhrzeit | „Guten Morgen / Guten Tag / Guten Abend, [Vorname]“ je nach Uhrzeit, darunter Datum; Uhrzeit entfällt |
| Hero-Karte „Bereit für dein Training?“ Navy mit weißem Button | Karte „Heute geplant“: Trainingstag, Programm, Woche; Primärbutton Lime „Training starten“; ohne Plan: „Freies Training starten“ als Ghost-Button |
| Ernährung-Karte weiß mit Zahl | Karte mit Ring (Lime) für kcal, drei Balken Protein/Kohlenhydrate/Fett in Lime, Grün dunkel, Orange gedämpft |
| Wasser-Karte mit vier blauen Schnellmengen | Karte mit Balken, vier Schnellmengen als Chips (dunkel, Rand), aktiver Chip Lime mit dunkler Schrift |
| Schritte-Karte mit blauem Balken | Karte mit Lime-Balken, Zahl groß, Ziel klein |
| Tab-Bar hell, aktiver Tab blau gefüllt | Tab-Bar Nacht mit Rand oben, Icons Linie, aktiver Tab Lime (Icon und Label), kein gefülltes Rechteck |
| Blaue Primärbuttons, blaue Links | Primär Lime mit Nacht-Schrift; Sekundär Ghost (Rand, helle Schrift); Links in Lime nur für Aktionen, sonst Text hell |
| Icons gemischt (ausgefüllt/Linie) | Ein Icon-Set, Linie, 1,75 px Strich (Lucide oder vorhandenes Set einheitlich) |
| Listen in „Mehr“ mit blauen Icon-Kacheln | Listen mit Icon in Kachel Graphit, Chevron gedämpft |
| Schatten unter Karten | Keine Schatten; Trennung über Fläche und Rand |

**Blau bleibt an einer Stelle.** Im aktiven Workout nutzt das Konzept Blau für Satz-Aktionen („Satz erledigt“, „Überspringen“) – damit sich die Trainingsaktion vom Marken-Lime unterscheidet. Das übernehmen wir als Token `action` (nur im aktiven Workout, nirgends sonst).

## 3. Design-Tokens (neu, dunkel als Standard)

Ersetzt die bestehenden Farb-Tokens; Namen an das vorhandene Token-System angleichen und die Zuordnung in `brand-tokens.md` dokumentieren.

| Token | Wert | Verwendung |
|---|---|---|
| `bg` | #0C1219 | App-Hintergrund, Tab-Bar, Kopfzeile |
| `bg-elevated` | #10161F | Hero-Karten, Sheets |
| `card` | #141B25 | Karten, Listenzeilen |
| `card-2` | #1A2230 | Chips inaktiv, Eingabefelder |
| `line` | #232B36 | 1-px-Ränder, Trenner |
| `text` | #F2F3F4 | Primärtext |
| `text-muted` | #AAB2BE | Sekundärtext, Labels |
| `text-faint` | #5B6470 | Platzhalter, deaktiviert |
| `accent` | #C7FF46 | Primärbutton, aktiver Tab, Ringe, Balken, Zeichen |
| `accent-ink` | #0C1219 | Schrift auf Lime |
| `accent-soft` | rgba(199,255,70,0.12) | Hintergrund aktiver Chip-Hover, Badges |
| `action` | #2F7CF6 | nur aktives Workout: Satz erledigt, Überspringen |
| `success` | #4CAF6E | erledigt-Haken, Abschluss |
| `warn` | #E0A33A | Hinweise, Tipp-Karte |
| `danger` | #E5484D | Löschen, Fehler |
| `protein` / `carbs` / `fat` | #C7FF46 / #4C7A00 / #E0A33A | Makro-Balken |
| `tile` / `tile-border` | #0D1118 / #3C424E | Kachel hinter dem F in der Kopfzeile |

| Token | Wert |
|---|---|
| Radius Karte / Button / Chip / Eingabe | 20 px / 14 px / 999 px / 12 px |
| Abstand Seite / Karte innen / Karten untereinander | 20 px / 16 px / 12 px |
| Kopfzeile Höhe / Logo Höhe | 56 px / 30 px |
| Tab-Bar Höhe (ohne Safe-Area) | 64 px |
| Schrift | Inter (bereits prüfen; sonst system-ui), tabellarische Ziffern für alle Werte |
| Größen | Headline 28/600, Titel 20/600, Text 16/400, Label 13/500 +4 % Laufweite, Wert groß 40–56/600 |
| Ring | Strich 10 px, Spur `card-2`, Fortschritt `accent`, abgerundete Enden |
| Schatten | keine |

**Light Mode.** Entscheidung offen (siehe Übergabe). Bis dahin: Dark ist Standard und wird erzwungen (`color-scheme: dark`, `theme-color` #0C1219); Light-Tokens aus `brand.css` (`--form-ink` auf Weiß, Grün dunkel #4C7A00 für Text) nur anlegen, nicht ausliefern.

## 4. Komponenten

- **Kopfzeile.** Links `logo-kopfzeile-dunkel.svg` als `<img>` 30 px (nicht inline, Bundle-Grenze), rechts Kalender- oder Glocken-Icon wie bisher. Kein „Fitness“-Schriftzug, kein Hantel-Icon mehr. Tipp-Fläche 44 px, `alt="FORM – zu Heute"`.
- **Begrüßung.** „Guten Morgen, [Vorname]“ (5–11 Uhr), „Guten Tag“ (11–18), „Guten Abend“ (ab 18); Datum darunter in `text-muted`; keine Uhrzeit. Name aus dem Profil; fehlt er, nur „Guten Morgen“.
- **Karte.** `card`, Rand `line` 1 px, Radius 20, Innenabstand 16; Label oben in `text-muted` 13 px Versalien mit Laufweite; Wert groß mit tabellarischen Ziffern.
- **Primärbutton.** `accent` Fläche, `accent-ink` Schrift 16/600, Höhe 52, Radius 14, volle Breite in Karten; Pressed: 92 % Deckkraft. Ein Primärbutton pro Screen.
- **Sekundärbutton.** Transparent, Rand `line`, Schrift `text`. Tertiär: nur Text in `accent`.
- **Chips.** `card-2` mit Rand, aktiv `accent` mit `accent-ink`; Höhe 36, Radius 999.
- **Ring.** SVG, 10 px, `accent` auf `card-2`; Zahl mittig 28/600, Einheit darunter 12.
- **Balken.** 6 px, Radius 3, Spur `card-2`.
- **Tab-Bar.** `bg`, Rand oben `line`, fünf Tabs, Icon 24 Linie, Label 11/500; aktiv Icon und Label `accent`, keine Füllfläche. Safe-Area unten beachten.
- **Listenzeile (Mehr, Training).** Icon in Kachel 40 px `card-2` Radius 12, Titel 16/600, Untertitel 13 `text-muted`, Chevron `text-faint`.
- **Eingaben.** `card-2`, Rand `line`, Fokus-Rand `accent`, Radius 12, Höhe 48, Platzhalter `text-faint`.
- **Sheets und Dialoge.** `bg-elevated`, Griff 36×4 `line`, Radius 24 oben.
- **Toasts.** `card` mit Rand, Text `text`, keine Farbe außer bei Fehler.
- **Leerzustände.** Icon in `text-faint`, Text aus der Mikrotext-Tabelle, ein Sekundärbutton.

## 5. Screens

**Heute.** Kopfzeile, Begrüßung, Karte „Heute geplant“ (Tag, Programm, Woche, Primärbutton „Training starten“; ohne Plan: Titel „Freies Training“, Ghost-Button „Freies Training starten“, Textlink „Vorlage wählen“), Karte Ernährung (Ring plus drei Makro-Balken, Schnellaktionen als Icon-Buttons in `card-2`), Karte Wasser (Balken, vier Chips, Textlink „Eigene Menge“), Karte Schritte (Zahl, Balken, Jahr-Zeile klein), Karte Tagesaufgaben (Liste mit Haken in `success`, Textlink „Aufgabe hinzufügen“), Karte Wochenziel, Karte Körpergewicht. Reihenfolge wie heute; die „Tägliche Challenges“-Zählkarte aus dem Konzept wird **nicht** gebaut (Leitplanke: keine Streak-Logik).

**Training.** Hero „Heute geplant“ oder „Freies Training“ in `bg-elevated`, Listen Programme und Vorlagen / Nachtragen / Verlauf / Übungen als Listenzeilen. Programme-Liste wie Konzept: Karte mit Titel, Untertitel (Tage · Wochen), Badge „Aktiv“ in `accent-soft` mit `accent`-Schrift; ohne Hintergrundfotos (keine Stockbilder) – stattdessen Fläche `card` und links ein Icon in Kachel.

**Aktives Workout.** Kopf mit Zurück, Programm · Woche, Button „Beenden“ (Ghost); Fortschrittsbalken `accent`; Pausentimer-Karte mit großer Zahl, Buttons −15 s / +15 s (Chips) und „Überspringen“ (`action`); Übungskarte mit Name, Satz-Info, Muskelgruppen-Chips, Satztabelle (Vorwert, kg, Wdh., Haken `success`); Fuß „Satz erledigt“ in `action` volle Breite, daneben „+“ Ghost. Keine Körpergrafiken oder Fotos, wenn sie nicht schon in der App sind.

**Workout-Abschluss.** Titel „Training abgeschlossen“, Zeile „48 Minuten, 5 Übungen, 18 Sätze. Das warst du.“ (aus der Mikrotext-Tabelle; nicht „Starke Leistung!“, kein Emoji); Kacheln Dauer / Übungen / Sätze, Karte Gesamtvolumen und geschätzte Kalorien, Listenzeile „Details anzeigen“, Karte „Nächste Einheit“ mit Datum; Primärbutton „Zur Übersicht“. Das Zitat-Feld aus dem Konzept entfällt.

**Übungsdetails.** Titel, englischer Name, Muskel-Chips, Tabs Ausführung / Muskeln / Alternativen, nummerierte Schritte (Kreis mit Zahl in `card-2`), Tipp-Karte mit `warn`-Rand und Glühbirne-Icon. Foto oben nur, wenn die App schon Bilder hat; sonst Fläche `card`.

**Ernährung.** Tabs Heute / Woche / Rezepte als Chips; Datumszeile mit Pfeilen; Karte Ring plus Makros; Chips „Ziel“ und „Meine Küche“ als Sekundärbuttons; Mahlzeiten als Listenzeilen mit Icon-Kachel, Titel, Beschreibung, kcal rechts; leere Mahlzeit: „Noch nichts eingetragen.“ plus Textlink „Hinzufügen“ in `accent`.

**Fortschritt und Mehr.** Fortschritt: Leerzustand „Fortschritt braucht ein paar Tage. Er zeigt dich gegen dich, nicht gegen andere.“ mit Sekundärbutton „Gewicht erfassen“; Diagramme später in `accent`, eine Serie. Mehr: Listenzeilen Profil und Ziele / Einstellungen / Synchronisierung / Über die App; „Über die App“ mit `logo-anmeldung-dunkel.svg` ohne Claim, Version, „Nach Updates suchen“.

**Anmeldung.** `logo-anmeldung-dunkel.svg` 64 % Breite (max. 280 px) bei 30 % Höhe, Claim „FORM YOURSELF.“ und Unterzeile als Text (`.form-claim`, `.form-claim-sub` aus `brand.css`), Felder E-Mail / Passwort, Primärbutton „Anmelden“, Fehlertext aus der Mikrotext-Tabelle.

**Startbild.** `splash` aus dem Paket: Nacht, Symbol mittig 24 % Breite, `apple-touch-startup-image` für die drei Größen, Manifest `background_color` und `theme_color` #0C1219.

## 6. Pakete in Reihenfolge

| Paket | Inhalt | Nachweis |
|---|---|---|
| **F1 Tokens** | Neue Farb-, Radius-, Typo-Tokens; Dark erzwungen; `brand-tokens.md` mit Zuordnung alt → neu | Build grün, Screens dunkel ohne Regressionen |
| **A Icons und Manifest** | aus `handover-markenassets.md` | Tab, Homescreen iOS, maskable |
| **B Kopfzeile** | Kachel-F plus Wortmarke, Begrüßung nach Tageszeit | auf jeder Seite, Tipp → Heute, E2E-Selektoren angepasst |
| **F2 Komponenten** | Button, Karte, Chip, Ring, Balken, Tab-Bar, Listenzeile, Eingabe, Sheet, Toast, Leerzustand | Storybook/Screenshot je Komponente |
| **F3 Screens** | Heute, Training, aktives Workout, Abschluss, Übungsdetails, Ernährung, Fortschritt, Mehr | Screenshot je Screen gegen das Konzept |
| **C Anmeldung und Über die App** | Logo plus Claim; Über die App ohne Claim | Kontrast geprüft |
| **D Startbild** | Splash, Manifest-Farben | Kaltstart ohne weißen Blitz |
| **F4 Texte** | Mikrotexte aus den Leitplanken: Begrüßung, Abschluss, Leerzustände, Push; keine Ausrufezeichen, keine Emojis | Wortfeld-Prüfung |
| **G Rückkehr-Flow** | Auslöser 14+ Tage ohne Eintrag; Screen „Schön, dass du da bist. / Eine Pause gehört dazu. Was ist dir heute möglich?“; Optionen Spaziergang / leichtes Training / Nur reinschauen; Verhalten laut Leitplanken Abschnitt 3; einmal pro Rückkehr, abweisbar | Unit-Test Auslöser, E2E Flow, keine Serienzähler |
| **E Token-Abgleich** | `brand-tokens.md` final: Tabelle alt/neu, Kontrastwerte, offene Abweichungen | Datei im Repo und zurück in den Marken-Chat |

Reihenfolge: F1 → A → B → F2 → F3 → C → D → F4 → G → E. Jedes Paket ein Commit mit D-Nummer in `decisions.md`.

## 7. Leitplanken für die Umsetzung

- Kein Inline-SVG für Logos in der Startansicht; alle Logos als `<img>` aus `public/brand/`. Bundle-Grenze 250 KB (`pnpm check:bundle`) nach jedem Paket prüfen.
- Keine neuen Abhängigkeiten für Ringe oder Diagramme; Ring als eigenes SVG.
- Keine Fotos, keine Stockbilder, keine Illustrationen; Flächen und Icons reichen.
- Kontrast: Text auf `bg` und `card` mindestens 4,5:1 (`text-muted` auf `card` ist 7:1); Lime nie als Textfarbe auf hell.
- Kein Glow am F in der App.
- Alle Tests bleiben grün, inklusive WebKit; Selektoren, die auf „Fitness“ oder Icon-Namen prüfen, werden angepasst, nicht gelöscht.
- Keine Streak-, Serien- oder Challenge-Zähler; „Tägliche Challenges“ aus dem Konzept wird nicht gebaut.

## 8. Ergebnis zurück in den Marken-Chat

`brand-tokens.md` mit: Tabelle alt → neu je Token, gemessene Kontraste, Stellen, an denen das Konzept bewusst nicht übernommen wurde, Screenshots der acht Screens (dunkel) als PNG im Ordner `docs/screens/`. Diese Datei macht Abschnitt 4 des Markenhandbuchs verbindlich.

## 9. Startprompt für die Claude-Code-Sitzung

> Lies zuerst `CLAUDE.md`, `implementation-plan.md`, `decisions.md`, dann `handover-form-rebranding.md`, `handover-markenassets.md` und `form-markenleitplanken.md`. Entpacke `form-app-assets.zip` nach `public/brand/`, `public/icons/`, `public/splash/`. Ziel: die App behält alle Funktionen und bekommt den FORM-Look nach Abschnitt 3 bis 5 der Rebranding-Übergabe. Arbeite die Pakete in der Reihenfolge F1, A, B, F2, F3, C, D, F4, G, E ab, ein Commit pro Paket, D-Nummern in `decisions.md`. Nach jedem Paket `pnpm check:bundle` und die E2E-Tests inklusive WebKit. Übernimm keine Texte aus dem Konzeptbild; Texte kommen aus den Leitplanken. Lege am Ende `brand-tokens.md` an und mache Screenshots der acht Hauptscreens nach `docs/screens/`. Frage nur, wenn eine Entscheidung die Richtung ändert; sonst triff sie und notiere sie.
