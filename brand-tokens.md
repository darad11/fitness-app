# FORM · Design-Tokens der App

Stand: 21.10.2026 · Paket F1 (D-308), wird mit Paket E abgeschlossen · Quelle der Werte: `handover-form-rebranding.md` Abschnitt 3, `form-app-assets/snippets/brand.css` · Datei im Code: `src/shared/ui/tokens.css` · Prüfung: `src/shared/ui/tokens.test.ts`

Diese Datei macht Abschnitt 4 des Markenhandbuchs für die App verbindlich: Welche App-Farbe entspricht welcher Markenfarbe, was wurde gemessen, und wo weicht die App bewusst vom Konzept ab.

## 1. Grundsätze

- Die Token-Namen der App bleiben (`--bg`, `--surface`, `--accent`, …), damit Tailwind-Klassen und Komponenten unverändert funktionieren. Die Markenbegriffe aus der Übergabe (`bg`, `card`, `card-2`, `line`, `text`, …) stehen in der Spalte „Marke“.
- Dunkel ist Standard und wird ausgeliefert (`:root`). Die hellen Tokens sind nur angelegt (`:root[data-theme='light']`) und werden erst ausgeliefert, wenn der Produktinhaber Q-23 entscheidet. Lime ist im hellen Modus nur Symbol; Flächen und Text nehmen Grün dunkel `#4C7A00`.
- Flächen sind deckend. Trennung über Fläche und 1-px-Rand, keine Schatten, kein Glas, keine Lichtflecken, keine Verläufe.
- Kontrast nach WCAG 2.1 AA: Text 4,5:1, Bedienelemente und Linien 3:1, geprüft in beiden Blöcken auf jeder Fläche, auf der ein Token liegen kann (`tokens.test.ts`).

## 2. Zuordnung alt → neu je Token

Alt = Stand vor dem Rebranding (D-272, Glas-Look, Blau als Akzent). Neu = FORM. „Hell (angelegt)“ wird nicht ausgeliefert.

### 2.1 Flächen, Text, Ränder

| Token | Alt hell | Alt dunkel | Neu dunkel (ausgeliefert) | Hell (angelegt) | Marke | Verwendung |
|---|---|---|---|---|---|---|
| `--bg` | #e8eef7 | #151b2b | #0c1219 | #ffffff | `bg` Nacht | App-Hintergrund, Tab-Bar, Kopfzeile |
| `--bg-top`, `--bg-bottom` | #f5f8fd, #dce4f0 | #212a3f, #0d1016 | #0c1219 | #ffffff | `bg` | früher Verlauf; jetzt eine Fläche; `--bg-top` ist die Farbe der Statusleiste (`theme-color`) |
| `--bg-elevated` (neu) | – | – | #10161f | #f4f6f8 | `bg-elevated` | Hero-Karten, Sheets |
| `--glow-1` bis `--glow-3` | Blau-, Blau-, Grünfleck | dto. | transparent | transparent | – | Lichtflecken entfallen |
| `--surface` | #ffffffa6 (Glas) | #ffffff0f (Glas) | #141b25 | #ffffff | `card` | Karten, Listenzeilen |
| `--surface-2` | #ffffff73 | #ffffff0d | #1a2230 | #eef1f4 | `card-2` | Chips inaktiv, Eingabefelder, Spur von Ringen und Balken |
| `--panel` | #f8fafdeb | #1a2133eb | #10161f | #ffffff | `bg-elevated` | Dialoge, Sheets |
| `--fg` | #12151c | #f5f7fb | #f2f3f4 | #0c1219 | `text` | Primärtext |
| `--fg-muted` | #4c5565 | #c3cad6 | #aab2be | #4e5867 | `text-muted` | Sekundärtext, Labels |
| `--fg-faint` (neu) | – | – | #5b6470 | #8a93a0 | `text-faint` | Platzhalter, deaktiviert, Chevrons |
| `--border` | #0f1c3a1f | #ffffff24 | #232b36 | #e1e5ea | `line` | 1-px-Ränder, Trenner, Gitterlinien |
| `--border-input` | #5f6878 | #99a2b2 | #6b7482 | #6f7886 | – (Abweichung) | Rand von Eingabefeldern, 3:1 |
| `--glass-edge` | #ffffffcc | #ffffff2e | transparent | transparent | – | Lichtkante entfällt |
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
| `--ink`, `--ink-2` | #0f1d3c, #1f56a0 | #142a4f, #1f4f8f | #10161f | #0c1219 | `bg-elevated` | Bühne (Hero-Karte); vorher Navy-Verlauf |
| `--on-ink`, `--on-ink-muted` | #f5f7fb, #dfe7f4 | #f5f7fb, #c9d4e6 | #f2f3f4, #aab2be | #f2f3f4, #aab2be | `text`, `text-muted` | Text auf der Bühne |
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

### 2.4 Anmeldung (D-270, immer dunkel)

| Token | Alt | Neu | Marke |
|---|---|---|---|
| `--login-bg-1` bis `-3` | #212a3f, #151b2b, #0d1016 (Verlauf) | #0c1219 | `bg` |
| `--login-glow-1` bis `-3` | Blau, Blau, Grün | transparent | – |
| `--login-accent`, `--login-accent-2` | #256abf, #1c5cab | #c7ff46 | `accent` |
| `--login-accent-fg` (neu) | – | #0c1219 | `accent-ink` |
| `--login-fg`, `--login-fg-muted` | #f5f7fb, #d0d6e2 | #f2f3f4, #aab2be | `text`, `text-muted` |
| `--login-focus` | #5598e7 | #c7ff46 | `accent` |
| `--login-error` | #ffb3b8 | #ef6368 | `danger` |
| `--login-glass`, `--login-glass-line` | Weiß 7 %, Weiß 14 % | #141b25, #232b36 | `card`, `line` |
| `--login-input`, `--login-input-line` | Weiß 6 %, Weiß 30 % | #1a2230, #6b7482 | `card-2`, Eingaberand |

### 2.5 Schatten, Glas, Tab-Leiste

| Token | Alt | Neu |
|---|---|---|
| `--shadow-card`, `--shadow-float` | Lichtkante, Haarlinie, weicher Schatten | nur der 1-px-Rand (`0 0 0 1px var(--border)`) |
| `--glass-blur` | `blur(24px) saturate(160%)` | `none` |
| `--selection-pill` | Blau 14 % / Schwarz 35 % | transparent (aktiver Tab ohne Füllfläche) |
| `--lens-*` | Glas-Linse der Tab-Leiste (D-272) | bleiben bis Paket F2 definiert; die Linse entfällt mit der neuen Tab-Leiste |

### 2.6 Maße und Typografie

| Größe | Alt | Neu (Marke) |
|---|---|---|
| Radius Karte / Eingabe / Chip / Sheet | 20 / 12 / 999 / 28 px | 20 / 12 / 999 / 24 px (Sheet ab F2) |
| Radius Button | 999 px (Pille) | 14 px (ab F2) |
| Label (`eyebrow`) | 12 px, 600, Versalien, 8 % Laufweite | 13 px, 500, Versalien, 4 % Laufweite |
| Ziffern | tabellarisch nur an einzelnen Stellen | tabellarisch in der ganzen App (`body`) |
| Schrift | Systemschrift | Systemschrift (Inter ist nicht gebündelt; keine Schrift von Dritten, D-203) |

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
| `--success` / `--warning` / `--danger` auf `--surface` | 6,3 / 7,8 / 5,7 | 4,5 |
| `--on-ink` / `--on-ink-muted` auf `--ink` | 16,3 / 8,5 | 4,5 |
| `--accent-ink` auf `--accent-soft` (über `--surface-2`) | 9,7 | 4,5 |
| `--success` auf `--success-soft`, `--danger` auf `--danger-soft` (über `--surface-2`) | 4,8 / 4,8 | 4,5 |
| `--accent` (Lime) auf `--bg` / `--surface` / `--meter-track` | 16,0 / 14,7 / 13,0 | 3 |
| `--action` auf `--surface` | 4,4 | 3 |
| `--border-input` auf `--surface-2` | 3,4 | 3 |
| `--macro-protein` / `--macro-carbs` / `--macro-fat` auf `--surface` | 14,7 / 3,4 / 7,8 | 3 |
| `--chart-point` auf `--surface` | 3,7 | 3 |
| `--border` (`line`) auf `--surface` | 1,2 | – (dekorativ) |
| `--tile-border` auf `--tile` | 1,9 | – (dekorativ) |
| `--login-fg` / `--login-fg-muted` / `--login-error` auf `--login-bg-1` | 16,9 / 8,8 / 5,6 | 4,5 |
| `--login-accent-fg` auf `--login-accent` | 15,97 | 4,5 |

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
| Hell/Dunkel-Umschalter | entfällt in den Einstellungen | nur Dunkel wird ausgeliefert (D-308); eine Wahl ohne Wirkung wäre eine Schaltfläche ohne Funktion |
| Streak-Karte, Hustle-Zeilen, „Tägliche Challenges“, Emojis, Bildkarten, Gradient-Leiste, schräges F | nicht gebaut | Markenleitplanken Abschnitt 2, Regel 10 |

Weitere Einträge folgen mit den Paketen F2 bis G (Komponenten und Screens).
