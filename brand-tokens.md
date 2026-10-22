# FORM · Design-Tokens der App

Stand: 22.10.2026 · abgeschlossen mit Paket E (D-320); Pakete F1 (D-308), F2 (D-314), C (D-316) · Quelle der Werte: `handover-form-rebranding.md` Abschnitt 3, `form-app-assets/snippets/brand.css` · Datei im Code: `src/shared/ui/tokens.css` · Prüfung: `src/shared/ui/tokens.test.ts`

Diese Datei macht Abschnitt 4 des Markenhandbuchs für die App verbindlich: Welche App-Farbe entspricht welcher Markenfarbe, was wurde gemessen, und wo weicht die App bewusst vom Konzept ab.

## 1. Grundsätze

- Die Token-Namen der App bleiben (`--bg`, `--surface`, `--accent`, …), damit Tailwind-Klassen und Komponenten unverändert funktionieren. Die Markenbegriffe aus der Übergabe (`bg`, `card`, `card-2`, `line`, `text`, …) stehen in der Spalte „Marke“.
- Dunkel ist Standard und wird ausgeliefert (`:root`). Die hellen Tokens sind nur angelegt (`:root[data-theme='light']`) und werden nicht ausgeliefert (D-311, beantwortet Q-23; neu bewerten, wenn Nutzer danach fragen). Lime ist im hellen Modus nur Symbol; Flächen und Text nehmen Grün dunkel `#4C7A00`.
- Flächen sind deckend. Trennung über Fläche und 1-px-Rand, keine Schatten, kein Glas, keine Lichtflecken, keine Verläufe. Einzige Ausnahme ist das Glas der Tab-Leiste (D-312).
- Maße, Radien und Schriftgrößen sind ebenfalls Tokens (`src/app/styles.css`, `@theme`, Abschnitt 2.6); Komponenten und Seiten nutzen keine festen Pixelbreiten (D-313).
- Kontrast nach WCAG 2.1 AA: Text 4,5:1, Bedienelemente und Linien 3:1, geprüft in beiden Blöcken auf jeder Fläche, auf der ein Token liegen kann (`tokens.test.ts`).

## 2. Zuordnung alt → neu je Token

Alt = Stand vor dem Rebranding (D-272, Glas-Look, Blau als Akzent). Neu = FORM. „Hell (angelegt)“ wird nicht ausgeliefert.

### 2.0 Markenfarben aus `brand.css` und ihre App-Tokens

Abgleich nach `handover-markenassets.md` Paket E: Die Variablen aus `form-app-assets/snippets/brand.css` stehen nicht doppelt im Code; die App nutzt ihre eigenen Token-Namen mit denselben Werten. Nichts wurde umgefärbt, um diese Tabelle zu erfüllen.

| `brand.css` | Wert | App-Token (dunkel, ausgeliefert) | Wert in der App | Stand |
|---|---|---|---|---|
| `--form-green` | #C7FF46 | `--accent`, `--accent-ink`, `--focus`, `--macro-protein`, `--data-1` | #c7ff46 | gleich |
| `--form-green-dark` | #4C7A00 | `--macro-carbs`, `--data-6`; hell (angelegt) `--accent`, `--accent-ink` | #4c7a00 | gleich |
| `--form-ink` | #0C1219 | `--bg`, `--bg-top`, `--accent-fg`, `--action-fg`, `theme-color`, Manifest | #0c1219 | gleich |
| `--form-tile` | #0D1118 | `--tile` | #0d1118 | gleich |
| `--form-tile-border` | #3C424E | `--tile-border` | #3c424e | gleich |
| `--form-white` | #FFFFFF | `--fg` (Text, Claim) | #f2f3f4 | Abweichung: Text in `text` #F2F3F4 aus der Übergabe Abschnitt 3; Weiß nur in den Logo-Dateien |
| `.form-claim-sub` (Farbe) | #AAB2BE | `--fg-muted` | #aab2be | gleich |
| `.form-claim` / `.form-claim-sub` | Inter 17/600, 13/400 | `.form-claim`, `.form-claim-sub` in `src/app/styles.css` | Systemschrift 17/600 mit 4 % Laufweite, 13/400 | Abweichung nur in der Schrift (Inter nicht gebündelt, D-203) |
| `.form-logo-header` | Höhe 30 px | `--spacing-logo` (Kopfzeile) | 1,875 rem = 30 px | gleich |

Grundfläche, Akzent und Kachel der App entsprechen damit den Markenfarben. Abweichungen gibt es nur bei Textweiß (#F2F3F4 statt #FFFFFF) und, aus Kontrastgründen, bei `danger`, `--border-input` und `--action-fg` (Abschnitt 4).

### 2.1 Flächen, Text, Ränder

| Token | Alt hell | Alt dunkel | Neu dunkel (ausgeliefert) | Hell (angelegt) | Marke | Verwendung |
|---|---|---|---|---|---|---|
| `--bg` | #e8eef7 | #151b2b | #0c1219 | #ffffff | `bg` Nacht | App-Hintergrund, Tab-Bar, Kopfzeile |
| `--bg-top` | #f5f8fd | #212a3f | #0c1219 | #ffffff | `bg` | Farbe der Statusleiste (`theme-color`) und des `body` |
| `--bg-bottom` | #dce4f0 | #0d1016 | entfällt (F2) | entfällt | – | früher Ende des Verlaufs |
| `--bg-elevated` (neu) | – | – | #10161f | #f4f6f8 | `bg-elevated` | Hero-Karten, Sheets |
| `--glow-1` bis `--glow-3` | Blau-, Blau-, Grünfleck | dto. | entfällt (F2) | entfällt | – | Lichtflecken und die Hintergrundebene `.app-backdrop` entfallen |
| `--surface` | #ffffffa6 (Glas) | #ffffff0f (Glas) | #141b25 | #ffffff | `card` | Karten, Listenzeilen |
| `--surface-2` | #ffffff73 | #ffffff0d | #1a2230 | #eef1f4 | `card-2` | Chips inaktiv, Eingabefelder, Spur von Ringen und Balken |
| `--panel` | #f8fafdeb | #1a2133eb | #10161f | #ffffff | `bg-elevated` | Dialoge, Sheets |
| `--fg` | #12151c | #f5f7fb | #f2f3f4 | #0c1219 | `text` | Primärtext |
| `--fg-muted` | #4c5565 | #c3cad6 | #aab2be | #4e5867 | `text-muted` | Sekundärtext, Labels |
| `--fg-faint` (neu) | – | – | #5b6470 | #8a93a0 | `text-faint` | Platzhalter, deaktiviert, Chevrons |
| `--border` | #0f1c3a1f | #ffffff24 | #232b36 | #e1e5ea | `line` | 1-px-Ränder, Trenner, Gitterlinien |
| `--border-input` | #5f6878 | #99a2b2 | #6b7482 | #6f7886 | – (Abweichung) | Rand von Eingabefeldern, 3:1 |
| `--glass-edge` | #ffffffcc | #ffffff2e | entfällt (F2) | entfällt | – | Lichtkante entfällt |
| `--scrim` | rgb(18 21 28 / 0.45) | rgb(0 0 0 / 0.6) | rgb(0 0 0 / 0.6) | rgb(12 18 25 / 0.45) | – | Hintergrund von Dialogen |

### 2.2 Akzent und Status

| Token | Alt hell | Alt dunkel | Neu dunkel | Hell (angelegt) | Marke | Verwendung |
|---|---|---|---|---|---|---|
| `--accent` | #256abf | #5da1ee | #c7ff46 | #4c7a00 | `accent` Lime | Primärbutton, aktiver Tab, Ringe, Balken, Zeichen |
| `--accent-hover` | #1c5cab | #77b0f1 | #c7ff46 | #4c7a00 | – | gleich wie Akzent; gedrückt 92 % Deckkraft (Komponente) |
| `--accent-fg` | #ffffff | #0b0e14 | #0c1219 | #ffffff | `accent-ink` | Schrift auf Lime |
| `--accent-ink` | #1a5296 | #b1d1f8 | #c7ff46 | #4c7a00 | `accent` / Grün dunkel | Links und Akzenttext auf Flächen |
| `--accent-soft` | #256abf17 | #3987e51f | #c7ff461f | #c7ff460f | `accent-soft` | Badge „Aktiv“, Hover aktiver Chip |
| `--focus` | #256abf | #6aa7ee | #c7ff46 | #4c7a00 | `accent` | Fokusring |
| `--action` (neu) | – | – | #2f7cf6 | #1d5fcc | `action` | nur aktives Workout: „Satz erledigt“, „Überspringen“ |
| `--action-fg` (neu) | – | – | #0c1219 | #ffffff | – (Abweichung) | Schrift auf `action` |
| `--success` | #0c5f3b | #7fe0b3 | #4caf6e | #2b7446 | `success` | erledigt-Haken, Abschluss |
| `--success-soft` | #13794d17 | #3dbe8617 | #4caf6e1f | #4caf6e1a | – | Tonfläche |
| `--warning` | #714a00 | #f0c46e | #e0a33a | #8a5a00 | `warn` | Hinweise, Tipp-Karte |
| `--warning-soft` | #9762001c | #e0a94317 | #e0a33a1f | #e0a33a26 | – | Tonfläche |
| `--danger` | #9a2121 | #ffb9b9 | #ef6368 | #bb292f | `danger` (Abweichung) | Löschen, Fehler |
| `--danger-soft` | #c5303014 | #f26d6d17 | #e5484d10 | #e5484d0f | – | Tonfläche |
| `--ink` | #0f1d3c | #142a4f | #10161f | #0c1219 | `bg-elevated` | nur noch Fläche hinter dem Kamerabild des Scanners; die Bühne nutzt `--bg-elevated` (F2) |
| `--ink-2`, `--on-ink`, `--on-ink-muted` | Navy-Verlauf und Text darauf | dto. | entfallen (E, D-320) | entfallen | – | seit F2 und F3 ohne Verwendung |
| `--tile`, `--tile-border` (neu) | – | – | #0d1118, #3c424e | #0d1118, #3c424e | `tile`, `tile-border` | Kachel hinter dem F |

### 2.3 Makros und Diagramme

| Token | Alt hell | Alt dunkel | Neu dunkel | Hell (angelegt) | Marke |
|---|---|---|---|---|---|
| `--macro-protein` | #78aff2 | #78aff2 | #c7ff46 | #4c7a00 | `protein` |
| `--macro-carbs` | #4fbf86 | #4fbf86 | #4c7a00 | #2b7446 | `carbs` |
| `--macro-fat` | #e5a947 | #e5a947 | #e0a33a | #b56f00 | `fat` |
| `--data-1` | #2a78d6 | #4b94ea | #c7ff46 | #4c7a00 | `accent` (eine Reihe) |
| `--data-2` bis `--data-8` | Orange, Aqua, Gelb, Magenta, Grün, Violett, Rot | dto. | #e0a33a, #4caf6e, #2f7cf6, #aab2be, #4c7a00, #ef6368, #8d96a3 | #b56f00, #2b7446, #1d5fcc, #4e5867, #6b8f00, #bb292f, #6f7886 | aus der Markenpalette (Abweichung: mehrere Reihen) |
| `--chart-grid` | #0f1c3a1f | #ffffff1f | #232b36 | #e1e5ea | `line` |
| `--chart-axis` | #4c5565 | #c3cad6 | #aab2be | #4e5867 | `text-muted` |
| `--chart-point` | #7a8394 | #8f98a9 | #6b7482 | #6f7886 | – (Abweichung, 3:1) |
| `--meter-track` | #c9dcf5 | #1a3157 | #1a2230 | #e6ecd6 | `card-2` |
| `--chart-total` | #3a4150 | #c9d0db | #f2f3f4 | #0c1219 | `text` |

### 2.4 Anmeldung (D-270; entfallen mit Paket C, D-316)

Die Anmeldung hatte eigene Tokens, damit sie auch im hellen Modus dunkel bleibt. Seit F1 glichen ihre Werte denen der App, und ausgeliefert wird nur Dunkel (D-311). Mit Paket C entfallen sie; die Anmeldung nutzt die Tokens der App und die Komponenten aus F2.

| Token | Alt | F1 | Ab Paket C |
|---|---|---|---|
| `--login-bg-1` bis `-3` | #212a3f, #151b2b, #0d1016 (Verlauf) | #0c1219 | entfällt, `--bg` |
| `--login-glow-1` bis `-3` | Blau, Blau, Grün | transparent | entfällt (keine Lichtflecken) |
| `--login-accent`, `--login-accent-2` | #256abf, #1c5cab | #c7ff46 | entfällt, `--accent` (Primärknopf) |
| `--login-accent-fg` | – | #0c1219 | entfällt, `--accent-fg` |
| `--login-fg`, `--login-fg-muted` | #f5f7fb, #d0d6e2 | #f2f3f4, #aab2be | entfällt, `--fg`, `--fg-muted` |
| `--login-focus` | #5598e7 | #c7ff46 | entfällt, `--accent` (Fokus der Felder) |
| `--login-error` | #ffb3b8 | #ef6368 | entfällt, `--danger` |
| `--login-glass`, `--login-glass-line` | Weiß 7 %, Weiß 14 % | #141b25, #232b36 | entfällt (keine Karte, kein Glas) |
| `--login-input`, `--login-input-line` | Weiß 6 %, Weiß 30 % | #1a2230, #6b7482 | entfällt, `--surface-2`, `--border-input` (`field`) |

### 2.5 Schatten, Glas, Tab-Leiste

| Token | Alt | Neu |
|---|---|---|
| `--shadow-card`, `--shadow-float` | Lichtkante, Haarlinie, weicher Schatten | nur der 1-px-Rand (`0 0 0 1px var(--border)`) |
| `--glass-blur` | `blur(24px) saturate(160%)` | entfällt (F2); kein Glas außer der Tab-Leiste |
| `--tabbar-glass` (neu, F2) | – | #141b25d9: Kartenfläche mit 85 % Deckkraft, darüber Weichzeichnung (D-312); hell (angelegt) #fffffff2 |
| `--tabbar-edge` (neu, F2) | – | #ffffff1a: feiner Rand der Leiste (Weiß 10 %); hell #0c12191a |
| `--tabbar-blur` (neu, F2) | – | `blur(20px) saturate(140%)`; mit „Transparenz reduzieren“ deckend `--panel` |
| `--selection-pill` | Blau 14 % / Schwarz 35 % | transparent (aktiver Tab ohne Füllfläche) |
| `--lens-*` | Glas-Linse der Tab-Leiste (D-272) | bleiben (D-312): Linse, Lichtkante und Farbsaum am Rand; `--lens-fill` transparent (ohne Farbfüllung) |

### 2.6 Maße und Typografie (F2, D-314)

Alle Werte stehen als Tokens in `src/app/styles.css` (`@theme`); Tailwind erzeugt daraus Klassen wie `p-card`, `min-h-button`, `rounded-button`, `text-headline`, `max-w-content`.

| Größe | Alt | Neu (Marke) | Token |
|---|---|---|---|
| Seitenrand Handy / Tablet / Desktop | 16 / 24 / 32 px | 20 / 24 / 32 px | `--spacing-page`, `-page-md`, `-page-lg` |
| Innenabstand Karte / Abstand zwischen Karten | 20 / 16 px | 16 / 12 px | `--spacing-card`, `--spacing-stack` |
| Kopfzeile / Logo | 56 / 30 px | 56 / 30 px | `--spacing-header`, `--spacing-logo` |
| Tab-Leiste (ohne Safe-Area) | 64 px | 64 px | `--spacing-tabbar` |
| Eingabe / Primärknopf / Chip / Symbol-Kachel / Tippfläche | 48 / 48 / – / – / 44 px | 48 / 52 / 36 / 40 / 44 px | `--spacing-control`, `-button`, `-chip`, `-tile`, `-touch` |
| Radius Karte / Knopf / Eingabe / Kachel / Sheet / Chip | 20 / 999 / 12 / – / 28 / 999 px | 20 / 14 / 12 / 12 / 24 / 999 px | `--radius-card`, `-button`, `-input`, `-tile`, `-sheet`, `-pill` |
| Größte Inhaltsbreite | 1200 px (an fünf Stellen) | 75 rem (eine Stelle) | `--container-content` |
| Dialog / Blatt ab Tablet / Menü / Tab-Leiste | 28 / 36 / 22 / 34 rem | gleich, als Tokens | `--container-dialog`, `-sheet`, `-menu`, `-tabbar` |
| Logo der Anmeldung und von „Über die App“ (C) | App-Icon 72 px | 64 % der Breite, höchstens 280 px | `--container-logo` (`.brand-logo`) |
| Breakpoints | Tailwind-Standard, dazu 359 px | 22,5 / 40 / 48 / 64 / 80 rem | `--breakpoint-xs` bis `-xl`, gleich in `breakpoints.ts` (Test) |
| Headline (Seitentitel) | 40 px, 700 | 28 px, 600 | `--text-headline` |
| Titel (Karte, Dialog) | 18 bis 28 px, 600 bis 700 | 20 px, 600 | `--text-title` |
| Untertitel | 14 px | 13 px, 400 | `--text-caption` |
| Label (`eyebrow`) | 12 px, 600, Versalien, 8 % Laufweite | 13 px, 500, Versalien, 4 % Laufweite | `--text-eyebrow` |
| Claim der Marke (C) / Unterzeile | – | 17 px, 600, 4 % Laufweite / 13 px, 400 | `--text-claim` (`.form-claim`) / `--text-caption` (`.form-claim-sub`) |
| Wert groß / Timer | 30 bis 40 px, 700 bis 800 / 64 px, 700 | 40 px / 56 px, 600 | `--text-value`, `--text-timer` |
| Tab-Beschriftung | 11 px, 600 | 11 px, 500 | `--text-tab` |
| Ziffern | tabellarisch nur an einzelnen Stellen | tabellarisch in der ganzen App (`body`) | – |
| Symbole | Lucide, Strich 2 px | Lucide, Strich 1,75 px | `svg.lucide` in `styles.css` |
| Schrift | Systemschrift | Systemschrift (Inter ist nicht gebündelt; keine Schrift von Dritten, D-203) | `--font-sans` |

## 3. Gemessene Kontraste (dunkel, ausgeliefert)

Aus `tokens.test.ts` bzw. demselben Rechenweg (WCAG 2.1, gerundet). Hintergrund = Fläche, auf der der Text oder das Element liegt.

| Paar | Kontrast | Anforderung |
|---|---|---|
| `--fg` auf `--bg` / `--surface` / `--surface-2` | 16,9 / 15,6 / 14,4 | 4,5 |
| `--fg-muted` auf `--bg` / `--surface` / `--surface-2` | 8,8 / 8,1 / 7,5 | 4,5 (Übergabe: 7:1 auf Karte, erfüllt) |
| `--fg-faint` auf `--surface` | 2,9 | – (nur Platzhalter und deaktiviert, kein Lesetext) |
| `--accent-ink` (Lime) auf `--bg` / `--surface` | 16,0 / 14,7 | 4,5 |
| `--accent-fg` (Nacht) auf `--accent` (Lime) | 15,97 | 4,5 |
| `--action-fg` (Nacht) auf `--action` (Blau) | 4,8 | 4,5 |
| `--success` / `--warning` / `--danger` auf `--surface` | 6,3 / 7,8 / 5,5 | 4,5 |
| `--danger` auf `--surface-2` / `--bg` | 5,1 / 6,0 | 4,5 |
| `--accent-ink` auf `--accent-soft` (über `--surface-2`) | 9,7 | 4,5 |
| `--success` auf `--success-soft`, `--danger` auf `--danger-soft` (über `--surface-2`) | 4,8 / 4,8 | 4,5 |
| `--accent` (Lime) auf `--bg` / `--surface` / `--meter-track` | 16,0 / 14,7 / 13,6 | 3 |
| `--action` auf `--surface` | 4,4 | 3 |
| `--border-input` auf `--surface-2` | 3,4 | 3 |
| `--macro-protein` / `--macro-carbs` / `--macro-fat` auf `--surface` | 14,7 / 3,4 / 7,8 | 3 |
| `--chart-point` auf `--surface` | 3,7 | 3 |
| `--border` (`line`) auf `--surface` | 1,2 | – (dekorativ) |
| `--tile-border` auf `--tile` | 1,9 | – (dekorativ) |
| Anmeldung (C): Claim `--fg` / Unterzeile `--fg-muted` / Fehlertext `--danger` auf `--bg` | 16,9 / 8,8 / 6,0 | 4,5 |
| Anmeldung (C): Platzhalter `--fg-muted` auf `--surface-2`; Eingaberand `--border-input` auf `--bg` | 7,5; 4,0 | 4,5; 3 |
| Tab-Beschriftung `--fg-muted` / `--fg` / `--accent-ink` auf `--tabbar-glass`, schlechtester Fall über Seite, Karte, card-2, Weiß und Lime | ≥ 4,5 (Test) | 4,5 |

Heller Block (angelegt): alle Textpaare ≥ 4,5, alle Bedienelemente ≥ 3 (Test); Grün dunkel #4C7A00 auf Weiß 5,1.

## 4. Bewusst nicht aus dem Konzept übernommen

| Konzept | App | Grund |
|---|---|---|
| Eingaberand in `line` #232B36 | `--border-input` #6B7482 | Eingabefelder brauchen 3:1 zum Hintergrund (AK-UX-04, WCAG 1.4.11); `line` liegt bei 1,2:1 |
| `danger` #E5484D | #EF6368 | 4,5:1 auf Karten (#E5484D erreicht 4,4) |
| Weiße Schrift auf `action` Blau | Nacht-Schrift `--action-fg` | Weiß auf #2F7CF6 erreicht 3,9:1, Nacht 4,8:1 |
| `--chart-point` in `text-faint` | #6B7482 | Messpunkte sind Information, 3:1 |
| Eine Diagrammfarbe | `--data-1` Lime, `--data-2` bis `-8` aus der Markenpalette | Diagramme mit mehreren Reihen (Tagesaufgaben je Aufgabe, Makros) brauchen unterscheidbare Reihen |
| Inter | Systemschrift | nicht gebündelt; Schrift von Dritten wäre eine Anfrage an Dritte (keine Nutzdaten an Dritte, D-203) |
| Platzhalter in `text-faint` | `text-muted` | Platzhalter sind Text und brauchen 4,5:1; `text-faint` erreicht auf card-2 nur 2,7 |
| Griff des Sheets in `line` | `text-faint` | `line` auf `bg-elevated` hat 1,3:1, der Griff wäre kaum zu sehen; `text-faint` hat 3,0:1 |
| Tab-Leiste ohne Glas (Konzept: Nacht mit Rand oben) | schwebende Glas-Leiste mit Linse und Kreis beim Scrollen in FORM-Farben | Entscheidung des Produktinhabers (D-312) |
| Hell/Dunkel-Umschalter | entfällt in den Einstellungen | nur Dunkel wird ausgeliefert (D-308); eine Wahl ohne Wirkung wäre eine Schaltfläche ohne Funktion |
| Streak-Karte, Hustle-Zeilen, „Tägliche Challenges“, Emojis, Bildkarten, Gradient-Leiste, schräges F | nicht gebaut | Markenleitplanken Abschnitt 2, Regel 10 |
| Reiter „Heute / Woche / Rezepte“ auf der Ernährungsseite | Datumszeile wie bisher, Rezepte über „Meine Küche“ | Es gibt keine Wochenansicht; ein Reiter ohne Inhalt wäre eine Schaltfläche ohne Funktion (F3, D-315) |
| Übungsdetails mit „Ausführung“ und nummerierten Schritten | Reiter „Muskeln“ und „Alternativen“, eigene Notiz als Tipp-Karte | Die Bibliothek enthält keine Anleitungen; keine Platzhalter (F3, D-315) |
| Bild oben in den Übungsdetails, Fotos auf Programmkarten | Fläche `card`, links Symbol in einer Kachel | Keine Fotos und Stockbilder (Leitplanken Regel 9) |
| Körpergrafiken im aktiven Workout | Muskelgruppen als Etiketten | Keine Grafiken, die es in der App noch nicht gibt (Übergabe Abschnitt 5) |
| Zitat-Feld im Abschluss | entfällt | Übergabe Abschnitt 5 |
| Überzogene Pause als Fläche in Lime | Rand und Zahl in Lime | Lime ist Akzent, nie Fläche (Markenassets, Regeln); weiße Schrift auf Lime hätte rund 1:1 |
| Claim in Weiß #FFFFFF (`brand.css`) | `--fg` #F2F3F4 | Keine neuen Hex-Werte (Leitplanken Regel 1); 16,9:1 statt 18,8:1 (C, D-316) |
| Claim in Inter 17/600 (`brand.css`) | Systemschrift 17/600 | wie überall: Inter ist nicht gebündelt (D-203) |
| Anmeldung als Glas-Karte mit Lichtflecken (D-270) | Logo, Claim und Felder direkt auf der Nacht-Fläche | kein Glas außer der Tab-Leiste (D-312), kein Glow in der App (Markenassets) |
| Drei Startbilder im Markenpaket (iPhone 14/15, Pro Max, iPad) | 40 Startbilder für 20 Gerätemaße, hochkant und quer, nach derselben Regel | iOS zeigt ein Startbild nur bei genau passendem Bildschirm; das iPhone-Modell ist nicht bekannt (D-317) |
| Mikrotext „Woche abgeschlossen: Diese Woche 3 von 4.“ | „x von y Trainings diese Woche“ | Formulierung aus AK-DSH-05 bleibt; der Sinn ist derselbe (F4, D-318) |
| Mikrotext „Nutzer überzieht“ | nicht verwendet | Die App misst keine Belastung; ohne Grundlage keine Aussage (Leitplanken Regel 5) |
| Push nach 21 Tagen Pause | nicht gebaut | Keine Push-Infrastruktur; Web Push braucht einen Server (D-319, `known-limitations.md`) |

## 5. Offen beim Produktinhaber

1. App-Farben an die Markenfarben angleichen? Grundfläche, Akzent und Kachel sind schon gleich (Abschnitt 2.0); offen sind nur Textweiß (#F2F3F4 statt #FFFFFF) und die Abweichungen aus Kontrastgründen in Abschnitt 4. Empfehlung: so lassen.
2. Heller Modus: nicht ausgeliefert (D-311); die hellen Tokens und die `-hell`-Logos bleiben angelegt. Neu bewerten, wenn Nutzer danach fragen.
3. Programm C heißt jetzt „Winterprogramm 2026 (Nachbau)“ (D-318), weil „Winter Arc“ zu den gestrichenen Wörtern gehört; die Quelle steht weiter in der Beschreibung. Bitte bestätigen oder einen anderen Namen nennen.
4. Gerätetest T-IPH-M0 Schritt 5: Kaltstart der installierten App ohne weißen Blitz, hochkant und quer (D-317). Vorsicht: Beim Entfernen der alten App vom Home-Bildschirm kann iOS deren Daten löschen; erst nach abgeglichener Synchronisierung oder an einer zweiten Adresse testen (D-321).

## 6. Screenshots

Alle Bilder dunkel, Handy 390 × 844 pt, erzeugt mit `node tools/screenshots.mjs screens` bzw. `komponenten` aus der gebauten App mit Testdaten im frischen Browserprofil (nie aus echten Daten).

- Screens in `docs/screens/`: `heute.png` (und `heute-ganz.png`), `training.png`, `training-programme.png`, `aktives-workout.png`, `abschluss.png`, `uebungsdetails.png`, `ernaehrung.png`, `fortschritt.png` (leer) und `fortschritt-mit-daten.png`, `mehr.png`, `anmeldung.png`, `ueber-die-app.png`, `rueckkehr-flow.png` und `rueckkehr-leichtes-training.png`, Tab-Leiste `tab-leiste-ausgeklappt.png` (dasselbe Bild wie `heute.png`: oben auf „Heute“ ist die Leiste ausgeklappt) und `tab-leiste-kreis.png`.
- Komponenten in `docs/screens/komponenten/`: Knopf, Ring, Chip und Balken, Toast, Karte, Tab-Leiste ausgeklappt und als Kreis, Listenzeile, Eingabe, Leerzustand, Sheet.
- Für die Übergabe (D-321): `docs/screens/uebersicht.png` zeigt alle 28 Bilder verkleinert auf einem Bild, je mit Titel und Dateiname. `docs/screens.zip` enthält alle Bilder in voller Auflösung und die Übersicht (Ordner `screens/`). Beides erzeugt `node tools/screens-overview.mjs` aus den vorhandenen Bildern; nach neuen Screenshots erneut ausführen.
