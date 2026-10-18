# UX-/UI-Audit und Designsystem 2.0

Version 1.0 · 18.10.2026 · Grundlage: Bildschirmfotos aller Seiten der App (Stand `m1-training`, hell und dunkel, iPhone-Breite 390 pt) gegen die Xeela-Referenzen (`reference-analysis.md`) und die Vorgaben des Master-Prompts (Abschnitte 5 und 9: ruhig, modern, hochwertig, kein generisches Admin-Dashboard, Premium-Player). Die Bildschirmfotos liegen im Sitzungsverzeichnis, nicht im Repository.

## 1. Befunde

Priorität: P0 behindert die Nutzung im Training, P1 prägt den Gesamteindruck, P2 Feinschliff.

| Nr. | Seite | Problem | Prio |
|---|---|---|---|
| A-01 | Alle | Jede Karte hat einen sichtbaren 1-px-Rahmen auf nahezu gleich hellem Grund; Hierarchie entsteht nur über die Überschrift. Wirkt wie ein Formular, nicht wie ein Produkt | P1 |
| A-02 | Alle | Seitentitel 28 px halbfett ohne Vorzeile; keine Einordnung (Datum, Bereich, Programm) über dem Titel. Xeela setzt eine kleine Vorzeile und einen großen Titel | P1 |
| A-03 | Alle | Nur eine Abstufung für Flächen (Seite, Karte); keine „Bühne“ für die wichtigste Information (laufendes Training, heutiger Tag, Restzeit) | P1 |
| A-04 | Alle | Schaltflächen rechteckig mit 8 px Radius, sekundäre mit dunklem Rahmen; Primäraktion und Nebenaktion sehen gleich schwer aus | P1 |
| A-05 | Tab-Leiste | Aktiver Tab nur über einen 2-px-Strich oben und blaue Farbe erkennbar; wenig Anfassbarkeit | P2 |
| A-06 | Heute | Zwei gleich laute Textkarten („Diese Version“, „Status“); der Tag selbst (Training heute, nächster Schritt) fehlt; die Seite lädt nicht zum Starten ein | P1 |
| A-07 | Training | Eine Schaltfläche und zwei Listenzeilen auf leerer Seite; kein Bezug zu Programm, letztem Training oder nächstem Tag | P1 |
| A-08 | Programme | Karten mit Rahmen, Etikett „Beispiel“ und Beschreibungszeile; kein Hinweis auf Dauer, Tage je Woche als Zahl, keine Vorschau | P2 |
| A-09 | Vorlage | Hinweiskarte und Ablaufkarte nehmen den ersten Bildschirm ein; die Trainingstage, die der Nutzer starten will, liegen unterhalb | P1 |
| A-10 | Übungen | Suche mit Rahmen, zwei native Auswahlfelder mit Beschriftung; Gruppenlisten als Rahmenkästen. Funktional, aber schwer | P2 |
| A-11 | Player | Kopf klein (Titel 20 px, Dauer und Fortschritt 14 px); Fortschritt nur als Text; Programm und Einheit nicht erkennbar; „Übung entfernen“ als Textlink neben jedem Übungsnamen konkurriert mit dem Namen | P0 |
| A-12 | Player | Satzzeilen: Vorwert als „–“ in schmaler Spalte, Felder 44 px hoch ohne Einheit in der Zeile; der hervorgehobene Satz hat Rahmen und Grauton, aber Name und Ziel des Satzes stehen nicht am Satz | P0 |
| A-13 | Player | Pausenleiste (Zwischenstand AP 1.5): Restzeit wird abgeschnitten, Leiste und Aktionsleiste stapeln sich zu zwei Zeilen Knöpfen; der nächste Satz ist unlesbar | P0 |
| A-14 | Player | Kein Hinweis auf die nächste Übung; keine Ausführungshinweise erreichbar; Beenden und Übung hinzufügen in derselben Leiste wie „Satz erledigt“ | P0 |
| A-15 | Zusammenfassung | Vier gleich große Rahmenkacheln, Text „ohne Aufwärmsätze“ hängt lose darunter; kein Moment des Abschlusses, kein Bezug zum Programm | P1 |
| A-16 | Einstellungen, Mehr, Über, Installieren | Konsistent, aber mit denselben Rahmenkarten; Listenzeilen ohne visuelle Gruppierung des Symbols | P2 |
| A-17 | Dunkelmodus | Rahmen heller als die Flächen, dadurch noch stärker „verdrahtet“; sonst gleichwertig | P2 |
| A-18 | Alle | Keine Leerzustände mit Bild oder Form, nur ein Satz Text; Ladezustände als graue Blöcke sind in Ordnung | P2 |

Was gut ist und bleibt: Bedienziele mindestens 44 pt, Kontraste geprüft, Tabellenziffern, Fokusringe, Skelette ohne Animation, `<dialog>` mit Scrim, Texte in `de.ts`, Tokens als einzige Farbquelle.

## 2. Designsystem 2.0: Richtung

Eigenständig, von Xeela nur die Informationshierarchie inspiriert (Vorzeile, großer Titel, Bühne für die aktuelle Aktion, ruhige Listen, kräftige Primäraktion unten). Keine Kopie von Farben, Symbolen oder Layouts.

| Thema | Entscheidung |
|---|---|
| Flächen | Drei Ebenen: Seite `--bg` (kühles Hellgrau), Karte `--surface` (Weiß, ohne Rahmen, weicher Schatten `--shadow-card`), Einsatz `--surface-2` (Felder, Chips). Dazu die **Bühne** `--ink` (tiefes Blaugrau) mit `--on-ink` für die eine wichtigste Karte je Seite: laufendes Training, heutiger Trainingstag, Restzeit, Abschluss |
| Tonflächen | `--accent-soft`, `--success-soft`, `--warning-soft`, `--danger-soft` für Chips, Etiketten, Hinweise; Text darauf in der jeweiligen Vollfarbe (≥ 4,5:1, geprüft) |
| Typografie | Systemschrift bleibt. Neue Stufen: Vorzeile 12 px, Versalien, Laufweite 0,08 em, gedämpft; Display 40 px, fett, Laufweite −0,02 em für Seitentitel und Leitzahlen; Timer 64 px. Fließtext 16, Sekundär 14 |
| Radien | Felder 12, Karten 20, Sheets 28, Schaltflächen Pille |
| Schaltflächen | Pille, Höhe 48 (groß 56); primär Akzent, sekundär `--surface-2` ohne Rahmen, leise nur Text, destruktiv `--danger-soft`; auf der Bühne weiß bzw. Akzent |
| Navigation | Tab-Leiste: aktives Symbol in einer Akzent-Tonfläche; Seitenleiste mit derselben Logik |
| Listen | Zeilen ohne Rahmen in einer Karte, Trennlinien `--border`; Symbol in runder Tonfläche |
| Zahlen | Kennzahlen als `StatTile` (Vorzeile, Zahl 28 bis 40 px, Einheit klein); Fortschritt als `Meter` (Balken) und `ProgressRing` (Kreis) nur mit gespeicherten Daten |
| Bewegung | 120 ms Zustandswechsel, 240 ms Sheets; keine Dekoration; bei `prefers-reduced-motion` nur Überblendungen |
| Dunkelmodus | Gleiche Struktur, Flächen abgestuft statt Rahmen; Bühne etwas heller als die Karte |

## 3. Akzeptanzkriterien für Designsystem 2.0

| Nr. | Kriterium | Prüfung |
|---|---|---|
| DS-1 | Alle Farben kommen aus `tokens.css`; die neuen Tonflächen erreichen mit ihrem Text 4,5:1, Bühne und Text 4,5:1, Bedienelemente 3:1, hell und dunkel | `tokens.test.ts` |
| DS-2 | Jede Seite hat genau eine Primäraktion in Akzent und höchstens eine Bühne | Bildschirmfotos aller Seiten hell und dunkel |
| DS-3 | Bedienziele ≥ 44 pt, im Player ≥ 48 pt; Schrift in Feldern ≥ 16 px | axe in E2E, Komponententests |
| DS-4 | Keine Rahmenkarten mehr; Karten unterscheiden sich vom Grund durch Fläche und Schatten | Bildschirmfotos |
| DS-5 | Player: Programm und Einheit, aktuelle Übung, Satz und Status, Vorwert, Felder, Pause mit Restzeit, Fortschritt, nächste Aktion auf einen Blick, ohne Scrollen bei 390 × 844 | Bildschirmfoto Player mit laufender Pause |
| DS-6 | Pausenleiste: Restzeit nie abgeschnitten, nächster Satz lesbar, drei Aktionen in einer Zeile; Vollansicht mit 64-px-Timer | Komponententest, E2E |
| DS-7 | Dunkelmodus auf jeder Seite ohne Rahmen heller als die Fläche, Kontrast wie hell | Bildschirmfotos, axe |
| DS-8 | Keine Regression: alle Unit-, Komponenten- und E2E-Tests grün; Startbündel unter 250 KB | CI |

## 4. Umsetzung

- **AP D1 Designsystem 2.0:** Tokens, Tailwind-Theme, Grundkomponenten (`Button`, `Card`, `PageHeader`, `Badge`, `LinkList`, `TabBar`, `Sidebar`, `Toast`, `Dialog`, `SegmentedControl`, `SearchField`, `SelectField`, neu `StatTile`, `Meter`, `ProgressRing`, `EmptyState`) und alle bestehenden Seiten außer dem Player.
- **AP D2 Premium-Player:** Player neu nach DS-5 und DS-6 mit Pausenleiste, Ton und Wake Lock (ersetzt AP 1.5 der alten Planung).
- Danach AP 1.6 bis 1.9 wie geplant, jeweils im neuen System.
