# FORM · Paket F6 – zweiter Feinschliff vor dem Merge

Branch `form-rebranding`, PR #49. Es gelten `CLAUDE.md`, `form-markenleitplanken.md` und `brand-tokens.md`. Danach wird gemergt.

**Anhang:** `f6-referenzen.png` – die gewählten Varianten: Makro-Ring V2 (Abschnitt 2), Aufgaben V1 (Abschnitt 4) und die Karten-Varianten V2a bis V2d (Abschnitt 5); welche Karte gilt, steht in meiner Nachricht. Gerenderte Vorlagen mit Ersatzschrift; Maße und Farben stehen hier im Text.

**Arbeitsweise wie in F5:** Ursachen beheben, vorhandene Komponenten und Tokens nutzen, keine neuen Abhängigkeiten. Ein Commit je Abschnitt mit D-Nummer, nach jedem Abschnitt Tests, sofort pushen. Keine Nachkontrollen planen; ich melde mich mit der Freigabe.

---

## 1. Logo in der Kopfzeile scharf

Das Logo oben in der Kopfzeile wirkt durch einen Glas- oder Weichzeichner-Effekt unscharf. Icon und Wortmarke müssen jederzeit gestochen scharf sein. Prüfe `backdrop-filter`, `filter`, Deckkraft, Masken, Pseudo-Elemente, überlagernde Hintergründe und die Skalierung des Bildes (SVG in passender Größe, kein Hochskalieren eines Rasterbildes, keine Transform-Skalierung mit Bruchteilen von Pixeln). Ein Glaseffekt der Kopfzeile darf nur bleiben, wenn er das Logo nicht berührt. Prüfen auf 360, 390 und 768 pt, beim Scrollen und auf Retina-Darstellung.

## 2. Makro-Ring: neue Farben, weichere Übergänge (Variante V2)

**Farben** – Eiweiß, Kohlenhydrate, Fett bekommen eine eigene kühle Farbfamilie; Lime bleibt das Signal für Bedienung und Fortschritt:

| Token | Dunkel (ausgeliefert) | Hell (angelegt, Vorschlag, 3:1 auf Weiß prüfen) |
|---|---|---|
| `--macro-protein` | #34D6C0 (Türkis) | #0F9E8C |
| `--macro-carbs` | #5A92FF (Blau) | #2F6FE0 |
| `--macro-fat` | #B08CFF (Violett) | #7B5CE0 |

Überall gleich verwenden: Ring, Legende, Balken, kompakte Fassung auf „Heute“, Makro-Karten und Diagramme mit Makros. Grafikkontrast mindestens 3:1 auf `--surface` und `--surface-2` im Test. In `brand-tokens.md` und den Diagrammfarben nachziehen.

**Übergänge** – deutlich weicher als bisher, ohne grelle Mischtöne: Verlauf über den Farbton (nicht linear in RGB), etwa 18° Bogen je Seite einer Naht, höchstens ein Drittel des kürzeren Nachbarabschnitts, damit die Anteile erkennbar bleiben. Umsetzung nach deiner Wahl – zum Beispiel ein CSS-`conic-gradient` mit Ringmaske oder ein SVG aus feinen Segmenten –, entscheidend sind Schärfe, Leistung und korrekte Proportionen. Runde Enden, 0 kcal und Überschreitung wie in F5 festgelegt.

## 3. Erledigt-Markierungen kleiner

Das kleine grüne Quadrat neben „erledigt“ in der Legende des Aufgaben-Kalenders ist die verbindliche Größe (Basis).
- **Verlauf:** Markierung in Basisgröße, dezent.
- **Je Aufgabe:** Basis plus 2 pt.
- **Aufgaben-Kalender:** kompakte Zellen in sieben Spalten, Markierung Basis plus 2 pt.
- Häkchen etwa 60 % der Markierung, Eckenradius proportional, sauber am Text ausgerichtet, keine größere Zeilenhöhe.
- Eine gemeinsame Komponente mit Größen-Tokens; wo die Markierung bedienbar ist, bleibt die Tippfläche 44 pt (über Innenabstand).

Alle drei Ansichten nebeneinander vergleichen und im Bericht als Screenshot zeigen.

## 4. Aufgaben als bearbeitbar erkennbar (Variante V1)

- Links das Abhakfeld (sichtbar etwa 20 pt, Tippfläche 44 pt) – ein Tipp hakt nur ab.
- Der Rest der Zeile öffnet die Detailansicht mit Wochentagen und Einstellungen; rechts ein Chevron in `--fg-faint`.
- Unter dem Titel eine Zeile mit dem Rhythmus: „Täglich“, „Mo · Mi · Fr“, ergänzt um „mit Training abhaken“ bzw. „mit Wasserziel abhaken“, wenn eingeschaltet.
- Erledigte Aufgaben mit gedämpftem Titel, nicht durchgestrichen.
- Gleich auf der Karte „Tagesaufgaben“ auf „Heute“ und auf der Seite „Tagesaufgaben“. Screenreader-Namen getrennt: „Spaziergang abhaken“ und „Spaziergang bearbeiten“.
- Test: Tipp aufs Abhakfeld öffnet nie die Details; Tipp auf die Zeile öffnet sie; beides mit Tastatur erreichbar.

## 5. „Bereit für dein Training?“ mit grüner Fläche

Die Karte bekommt das Prinzip der alten blauen Karte, übertragen auf FORM-Grün. **Welche Variante gilt, steht in meiner Nachricht („Karte: V2a“ bis „V2d“); steht dort nichts, gilt V2c.**

- **V2c – komplett grün, flach (Voreinstellung):** deckende Fläche #283E18, Rand 1 px #405A28, kein Verlauf. Label „Training“ und Beschreibung in hellem Grüngrau (etwa #CED8C4, mindestens 4,5:1), Titel in `--fg`. Knopf weiß (#F2F3F4) mit Schrift in `--accent-fg` und Play-Symbol, Radius 14 pt, volle Breite. Link „Vorlage wählen“ in `--fg`, halbfett.
- **V2a – getönt mit Verlauf:** wie V2c, aber diagonaler Verlauf von #2C4216 (oben links) zu #11191E (unten rechts), Rand #465E2C.
- **V2b – wie V2a, Knopf als Pille:** weißer Knopf mit vollem Radius, Breite nach Inhalt, wie in der alten App.
- **V2d – komplett Lime:** deckende Fläche `--accent` (#C7FF46), Titel und Text in `--accent-fg` (Text mit etwas geringerer Deckkraft, mindestens 4,5:1), Knopf in `--accent-fg` mit weißer Schrift, Link in `--accent-fg`.

Für die gewählte Variante Tokens anlegen (`--stage-tint-…`) und in `brand-tokens.md` als bewusste Ausnahme festhalten: bei V2a bis V2c „auf der grünen Karte ist der Primärknopf weiß“ (bei V2a zusätzlich „einziger Verlauf der App“), bei V2d „einzige Lime-Fläche der App außer Icon 05“. Kein weiterer Lime-Akzent auf der Karte.

## 6. Startbild etwas länger

Nur beim Kaltstart: Die In-App-Startfläche bleibt ab dem ersten Bild mindestens 1,0 Sekunden sichtbar (Ladezeit eingerechnet) und blendet dann in 300 ms aus; dauert das Laden länger, bleibt sie, bis die erste Ansicht bereit ist. Kein Startbild beim Zurückkehren aus dem Hintergrund oder bei Navigation. Bei „Bewegung reduzieren“ ohne Ausblenden, die Mindestzeit bleibt. Das iOS-Startbild selbst ist nicht steuerbar – die In-App-Fläche setzt es nahtlos fort. Das ersetzt die Regel „keine künstliche Wartezeit“ aus F5 für den Kaltstart; in `docs/decisions.md` festhalten.

## 7. Trainingskopf: Woche bleibt sichtbar

„Woche n“ bleibt immer sichtbar. Wird es eng, kürzt du den Programmnamen mit Auslassungspunkten („Winterprogramm 20… · Woche 3“), nicht die Woche.

## 8. Nicht in diesem Paket

Als Punkte in `docs/implementation-plan.md` eintragen, nicht beginnen:
- Karte „Aktivitäten“ unter „Ernährung heute“ mit Kalorien aus Workouts und Nachträgen, später Apple Health über die native App; Verknüpfung mit dem Kalorienbudget ohne doppelte Anrechnung. Titel „Aktivitäten“, nicht „Verbrannte Kalorien“ (Wortfeld der Leitplanken).
- Rückblicke „Das warst du heute“ und „Das warst du diese Woche“.
- Wischen zum Löschen in der Einkaufsliste.

## 9. Tests und Abschluss

- Je Änderung ein Test; bei Fehlern ein Test, der am alten Stand fehlschlägt.
- Betroffene Screens auf 360, 390 und 768 pt; Screenshots erneuern, Übersicht und Zip neu erzeugen.
- `pnpm format:check`, `lint`, `typecheck`, `check:docs`, `test`, `build`, `check:bundle` (Startansicht unter 250 KB), E2E Chromium lokal, WebKit in der CI.
- Bericht wie in F5; danach pushen und stoppen.
