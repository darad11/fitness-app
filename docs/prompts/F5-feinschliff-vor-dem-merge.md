# FORM · Paket F5 – Fehler und Feinschliff vor dem Merge

> Kopie des Auftrags. Gemäß Abschnitt 7.1 sind hier der Name der fremden App, ihr Programmname und das Wort für eine Kopie durch Platzhalter in eckigen Klammern ersetzt; sonst unverändert.

Branch `form-rebranding`, PR #49. Es gelten `CLAUDE.md`, `form-markenleitplanken.md` und `brand-tokens.md`. Dieses Paket schließt das Rebranding ab; danach wird gemergt.

**Anhänge zu dieser Nachricht**
- `IMG_0476.pdf` – fünf Screenshots vom iPhone (Vorschau-Version): 1 Tagesaufgabe bearbeiten, 2 Auswertung einer Tagesaufgabe mit Kalender, 3 Ziele mit Wochenziel, 4 und 5 Programmliste.
- `form-aufnahme-training-sprung.png` – Einzelbilder aus einer Bildschirmaufnahme des aktiven Trainings.
- `form-aufnahme-programm-scroll.png` – Einzelbilder aus einer Bildschirmaufnahme beim Öffnen einer Vorlage.
- `form-referenzen.png` – Vorlagen: A der Ernährungs-Ring der bisherigen App (Abschnitt 5.1), B die neue Kopfzeile (4.1), C1, C2 und C3 die Varianten des neuen Startbilds (4.5), D die Karte „Bereit für dein Training?“ (3.3).

**Referenz „bisherige Fitness-App“:** der Stand auf `backup/vor-form-rebranding`. Dort stimmen Größenverhältnisse von Kopfzeile, Icons und Bedienelementen; dort liegt auch die Karte „Bereit für dein Training“. Vergleiche bei Regressionen immer mit diesem Stand.

**Arbeitsweise:** Ursachen beheben, nicht Symptome. Vor jeder Änderung betroffene Komponenten, Zustände, Datenflüsse und Styles prüfen; gemeinsame Ursachen zuerst (mehrere defekte Schalter → gemeinsame Komponente oder State-Logik). Keine neuen Abhängigkeiten, kein Overengineering, Datenmodelle nur mit Migrations- und Rückfallplan. Ein Commit je Abschnitt mit D-Nummer, nach jedem Abschnitt Tests, sofort pushen. Die Reihenfolge der Abschnitte ist die Priorität.

---

## 1. Defekte Bedienelemente (höchste Priorität)

**1.1 Schalter beim Bearbeiten einer Tagesaufgabe** (Screenshot 1): „Mit Training abhaken“ und „Mit Wasserziel abhaken“ lassen sich nicht betätigen. Im selben Formular laufen das Eingabefeld, die Wochentags-Chips („So“) und die Schalter rechts aus der Karte heraus. Prüfe, ob das die Ursache ist (Tippfläche abgeschnitten oder überdeckt), und unabhängig davon Handler, kontrollierten Zustand, Überschreiben durch alte Props, deaktivierte Elemente, Overlays und `z-index`. Alles muss innerhalb der Karte liegen; die sieben Wochentage passen auf 390 pt in eine Zeile oder brechen kontrolliert um.

**1.2 Körpergewicht als Tabelle:** Der Umschalter zwischen Diagramm und Tabelle wirkt nicht. Ursache finden und beheben.

**1.3 Alle übrigen Schalter:** Erstelle eine Liste aller Ein-/Aus-Schalter und Umschalter der App und teste jeden. In F2 wurden Komponenten umgebaut – prüfe gezielt, ob hier eine Regression gegenüber `backup/vor-form-rebranding` vorliegt, und repariere sie an der gemeinsamen Stelle.

**1.4 Wochenziel** (Screenshot 3): Oben steht „Aktuell: 4 Trainings pro Woche“, das Auswahlfeld zeigt „3 Trainings pro Woche“. Das Auswahlfeld muss mit dem gespeicherten Wert vorbelegt sein, nach „Ändern“ genau den gewählten Wert speichern und überall anzeigen. Testen mit 3, 4 und 5 sowie nach Neuladen.

**Erwartung für alle Punkte:** zuverlässig mit Touch, Maus und Tastatur bedienbar; Zustand sofort sichtbar; gespeichert nach der bestehenden Datenlogik; nach Neuladen und Ansichtswechsel unverändert; Tippfläche mindestens 44 pt; je Schalter ein Test, der die Bedienung und das Speichern prüft.

## 2. Aktives Training: Ansicht springt nach der Eingabe

Anhang `form-aufnahme-training-sprung.png`: Gewicht eingeben, über das Häkchen der Tastaturleiste bestätigen – der Satz wird erledigt, oben erscheint die Pausenkarte, und die Ansicht springt so, dass der gerade erledigte und der nächste Satz hinter Kopf und Pausenkarte verschwinden. Man muss jedes Mal von Hand zurückscrollen.

**Erwartet:**
- Während der Eingabe von Gewicht, Wiederholungen, Zeit oder Distanz ändert sich die Scrollposition nicht, der Fokus bleibt.
- Nach dem Erledigen eines Satzes ist der nächste aktive Satz sichtbar – unterhalb von Kopf und Pausenkarte, nicht dahinter (zum Beispiel über `scroll-margin-top` in Höhe von Kopf plus Pausenkarte).
- Die Pausenkarte verdeckt nie Eingabefelder; ihr Erscheinen darf die Ansicht nicht ruckartig verschieben.
- Automatisches Scrollen nur, wenn es dem Nutzer hilft, nicht bei jedem Tastendruck.

**Untersuchen:** Auto-Scroll- und Fokus-Handler, Effekte, die bei jedem State-Update laufen, Ref- und Scroll-Container, wechselnde Keys und neu gemountete Zeilen, Höhenänderungen der Pausenkarte, Sticky-Positionierung, Verhalten mit offener Bildschirmtastatur (iOS-Safari und installierte App).

**Kopf im Training** (sichtbar in derselben Aufnahme): Oben klein „Programmname · Woche n“, als Titel nur der Trainingstag („Tag 1 · Brust und Rücken“ bzw. „Tag A“), einzeilig mit Kürzung; der Programmname steht nicht doppelt. Gilt auch für das leichte Training.

**Test:** ein ganzes Training im Handy-Viewport mit mehreren Übungen – Satz per Tastatur-Häkchen und per „Satz erledigt“ abschließen; nach jedem Satz liegt der nächste aktive Satz sichtbar und unverdeckt im Viewport.

## 3. Programme und Training

**3.1 Programm öffnet nicht am Anfang** (Anhang `form-aufnahme-programm-scroll.png`): Beim Öffnen einer Vorlage oder eines Programms startet die Detailseite mitten auf der Seite. Neue Seiten starten oben; beim Zurückgehen bleibt die vorherige Position der Liste erhalten. Prüfe, welcher Container scrollt (Fenster oder `main`), und setze die Position beim Seitenwechsel gezielt zurück. Test: mehrere Programme nacheinander öffnen, zurück, wieder öffnen.

**3.2 Etiketten in den Programmkarten** (Screenshots 4 und 5): „Aktiv“, „Programm“ und „Beispiel“ stehen mal hinter dem Titel, mal darunter („Oberkörper/Unterkörper“, „Zuhause mit Kurzhanteln“). Einheitlich: Etikett oben rechts in der Karte, der Titel links bricht vorher um, der Chevron bleibt rechts mittig, Abstände zum Rand wie das Innenmaß der Karte. Mit Flexbox oder Grid, ohne feste Pixelpositionen; auf sehr schmalen Breiten kontrolliert.

**3.3 „Bereit für dein Training?“ statt „Freies Training“** (Anhang `form-referenzen.png`, Bild D): Wenn kein Training läuft und kein Programm aktiv ist, zeigt die oberste Karte auf „Heute“ und „Training“ wieder die Karte der bisherigen App, in FORM-Gestaltung: Bühnenkarte (`--bg-elevated`, 1-px-Rand), Label „Training“ in `--fg-muted`, Titel „Bereit für dein Training?“ in der Größe der Karte „Heute geplant“, Text „Starte ein freies Training oder wähle eine Vorlage.“ (ohne den früheren Satz zum Speicherort – er stimmt nicht mehr, sobald synchronisiert wird), Primärknopf in Lime „Freies Training starten“ mit Play-Symbol über die volle Breite, darunter Textlink „Vorlage wählen“ in Lime zu „Programme und Vorlagen“. Läuft ein Training, erscheint wie bisher „Training läuft“; ist ein Programm aktiv, „Heute geplant“. Verbunden mit dem bestehenden Start-Ablauf, keine doppelten Aufforderungen auf derselben Seite.

## 4. Kopfzeile, Icons und Markierungen

**4.1 Kopfzeilen-Logo kleiner, mit grünem Icon** (Anhang `form-referenzen.png`, Bild B; Verhältnisse wie in der bisherigen App auf `backup/vor-form-rebranding`): links das App-Icon mit grünem Hintergrund, rechts daneben die Wortmarke.
- **Icon:** Kachel 28 pt, Radius 22,5 % der Kachel, Fläche `--accent` (#C7FF46), ohne Rand; darin das F in `--accent-fg` (#0C1219) in der Lage des App-Icons – F-Höhe 45,7 % der Kachel, um 1,2 % der Kachelbreite nach rechts und 1,9 % nach unten aus der Mitte versetzt (wie `form-icon-05-neon`, nur in den Farben der App-Tokens, damit die Kachel exakt zu den Primärknöpfen passt).
- **Wortmarke:** Versalhöhe 12,5 pt in `--fg`, Abstand zur Kachel 10 pt, vertikal zur Kachel mittig.
- **Herstellung:** aus den vorhandenen Pfaden zusammensetzen – das F aus `public/brand/symbol-f-gruen.svg`, die Gruppe `wortmarke` aus `logo-kopfzeile-dunkel.svg` –, keine neue Zeichnung. In Einheiten einer Kachel von 1400: F mit Faktor 0,64 skaliert, Wortmarke mit Faktor 0,625 (Versalhöhe 625), Abstand 500, Oberkante der Wortmarke bei 387,5. Als `public/brand/logo-kopfzeile-kompakt.svg` ablegen und in der Kopfzeile verwenden; benannte Gruppen `kachel`, `symbol`, `wortmarke`.
- Tippfläche 44 pt und `alt` bleiben; die Seitenleiste auf breiten Bildschirmen nutzt dasselbe Icon (eingeklappt nur die grüne Kachel). Die bisherigen Dateien bleiben im Ordner. Das Homescreen-Icon ändert sich nicht.

**4.2 Icon der Karte „Wochenziel“:** dasselbe Regler-Icon wie bei „Tagesaufgaben“ – dieselbe Komponente, Größe, Strichstärke, Position.

**4.3 Erledigt-Markierungen** (Screenshot 2): Im Kalender der Auswertung einer Tagesaufgabe ist das Feld für einen erledigten Tag viel zu groß. Kalenderzellen deutlich kleiner (etwa 28 bis 32 pt, Haken etwa 14 pt), Rahmen in Lime nur für „heute“ und dünn, Legende passend. Wo erledigte Aufgaben in Listen markiert werden: sichtbare Markierung etwa 20 pt bei einer Tippfläche von 44 pt, sauber am Text ausgerichtet, ohne die Zeilenhöhe zu vergrößern.

**4.4 Abstand am Seitenende** (Screenshot 1): Der runde Button deckt am Ende der Seite Text ab („Löschen nimmt die Aufgabe ab heute aus der Liste …“). Am Seitenende muss so viel Platz sein, dass weder die ausgeklappte Leiste noch der runde Button Inhalt verdecken.

**4.5 Startbild mit stehendem Logo und Claim** (Anhang `form-referenzen.png`, Bilder C1 bis C3): Beim Start der App erscheint nicht mehr nur das Symbol, sondern das Logo in der Variante „Vertikal“ – das F oben, darunter zentriert die Wortmarke FORM –, dazu der Claim „FORM YOURSELF.“. **Welche Variante gilt, steht in meiner Nachricht:** C1 – Claim direkt unter dem Logo; C2 – wie C1, dazu „ONE STEP AT A TIME.“ als Fußzeile; C3 – Logo allein in der Mitte, „FORM YOURSELF.“ als Fußzeile. Steht dort nichts, gilt C3.
- **Logo** (aus den vorhandenen Pfaden von Symbol und Wortmarke, keine neue Zeichnung): Breite der Wortmarke 36 % der kurzen Bildschirmseite; Symbolhöhe das 2,28-Fache der Versalhöhe der Wortmarke; Abstand zwischen Symbol und Wortmarke das 0,82-Fache der Versalhöhe; Symbol horizontal zentriert. Farben wie in den Logo-Dateien: Symbol #C7FF46, Wortmarke #FFFFFF, Fläche #0C1219.
- **Nur C1 und C2 – Claim unter dem Logo:** „FORM YOURSELF.“ in Inter SemiBold (SIL-Lizenz), Versalhöhe etwa 0,38 der Versalhöhe der Wortmarke, Laufweite 0,19 em, Farbe #F2F3F4, horizontal zentriert; Abstand von der Grundlinie der Wortmarke bis zur Oberkante des Claims das 1,15-Fache der Versalhöhe der Wortmarke. Die deutsche Unterzeile entfällt auf dem Startbild bewusst – es ist nur kurz zu sehen. Die Mitte der Gruppe aus Logo und Claim liegt bei 47 % der Bildschirmhöhe.
- **Nur C3 – Claim als Fußzeile:** Das Logo allein steht mit seiner Mitte bei 47 % der Bildschirmhöhe. „FORM YOURSELF.“ in Inter SemiBold, Schriftgröße etwa 3,25 % der Bildschirmbreite, Laufweite 0,21 em, Farbe #AAB2BE, horizontal zentriert, Grundlinie 58 pt über dem unteren Rand.
- **Nur C2 – Fußzeile:** „ONE STEP AT A TIME.“ in Inter Medium, Schriftgröße etwa 2,9 % der Bildschirmbreite, Laufweite 0,2 em, Farbe #6B7380, horizontal zentriert, Grundlinie 58 pt über dem unteren Rand.
- **Schrift als Pfade:** Claim und Fußzeile werden in den Startbildern als Pfade gesetzt, nicht als Live-Text – sonst sähen Startbild und Startfläche je nach Gerät unterschiedlich aus. Inter liegt dafür nur im Werkzeug (`tools/`), nicht in der App.
- **Startbilder:** `tools/splash.mjs` auf diese Regel umstellen, alle 40 `apple-touch-startup-image`-Bilder neu erzeugen, `splash.svg` als neue Vorlage mit benannten Gruppen `symbol`, `wortmarke`, `claim` (und `fusszeile`). Die Tests, die bisher gegen die drei symbolischen Bilder des Markenpakets prüfen, auf die neue Regel umstellen.
- **Übergang in die App:** Eine In-App-Startfläche aus derselben SVG, pixelgenau gleich dem Startbild, liegt über der App, solange sie initialisiert, und blendet in etwa 250 ms aus, sobald die erste Ansicht bereit ist. Keine künstliche Wartezeit; ist die App schon bereit, entfällt die Fläche. Bei „Bewegung reduzieren“ ohne Ausblenden. Das SVG wird nachgeladen bzw. als kleines Inline-Element gesetzt, ohne die Startansicht über 250 KB zu bringen.
- **Test:** Startbild-Tests grün; Kaltstart der installierten App (Vorschau-Adresse zum Home-Bildschirm hinzufügen) ohne weißen Blitz und ohne Sprung zwischen Startbild und Startfläche; Startzeit nicht länger als vorher.

## 5. Ernährung

**5.1 Ring mit Makros** (Anhang `form-referenzen.png`, Bild A: Ring der bisherigen App): ein Ring, dessen Bogen die gegessenen Kalorien im Verhältnis zum Tagesziel zeigt und in Abschnitte nach den Makros geteilt ist – nacheinander Eiweiß (`--macro-protein`), Kohlenhydrate (`--macro-carbs`), Fett (`--macro-fat`), jeder Abschnitt so lang wie sein Kalorienanteil (Eiweiß und Kohlenhydrate 4 kcal je g, Fett 9 kcal je g). Kalorien, die keinem Makro zugeordnet sind (z. B. Schnelleinträge nur mit kcal), erscheinen erst ab 5 % der gegessenen Kalorien als letzter Abschnitt in neutralem Grau; kleinere Differenzen (Rundung) werden anteilig auf die Makro-Abschnitte verteilt. An den Übergängen weiche, aber kurze Farbverläufe (etwa 3° Bogen), damit zwischen Lime, Grün dunkel und Orange keine trüben Mischtöne entstehen; runde Enden, Rest der Spur in `--surface-2`. In der Mitte die gegessenen kcal groß, darunter „/ Tagesziel kcal“.
- Ernährungsseite (Karte „Gegessen“): großer Ring mittig, darunter drei Spalten Eiweiß, Kohlenhydrate, Fett mit „Ist / Ziel g“ und Balken in denselben Farben, darunter „noch x kcal“ – Aufbau wie im Vorbild, Farben und Flächen von FORM.
- Heute (Karte „Ernährung heute“): kompakter Aufbau wie jetzt, aber derselbe Ring, dieselbe Komponente. Auch kompakt steht in der Mitte die Einheit: „732“ und darunter „/ 2.390 kcal“ – nie eine Zahl ohne kcal (Bild D).
- Bei 0 kcal ist nur die Spur sichtbar, ohne Darstellungsfehler. Über dem Ziel ist der Ring voll, die Abschnitte behalten ihre Anteile, unter der Zahl steht neutral „x kcal über dem Tagesziel“ – keine Warnfarbe, keine Bewertung.
- Werte aus der bestehenden Berechnung, nichts doppelt rechnen; Aktualisierung sofort nach jedem Eintrag; für Screenreader als Text („732 von 2.390 kcal, davon Eiweiß 184, Kohlenhydrate 68, Fett 459“), nicht nur über Farbe.

**5.2 Datumszeile einzeilig** auf 390 pt (kürzeres Format, z. B. „Heute · Do., 22. Okt.“).

**5.3 Hinweistext:** „Zucker, gesättigte Fettsäuren, Ballaststoffe, Salz fehlt bei mindestens einem Eintrag“ ersetzen durch „Bei mindestens einem Eintrag fehlen Angaben zu …“ mit korrekter Aufzählung für jede Anzahl an Nährstoffen.

**5.4 Karte „Aktuelles Ziel“:** Den Text aus „Kalorien – aus Vorschlag übernommen“ verwenden, ohne Datum. Nur das Datum entfällt; bei einer späteren Änderung des Ziels aktualisiert sich der Text.

## 6. Fortschritt

**6.1 Zeitraum-Auswahl einzeilig** auf 390 pt (Woche, Monat, 3 Monate, Jahr, Gesamt), ohne horizontales Scrollen.

## 7. Texte und Marke

**7.1 Keine Hinweise auf [die fremde App].** Programm C heißt „Winterprogramm 2026“, die Beschreibung wird neutral (z. B. „8 Wochen, 40 Trainingstage, fünf Einheiten pro Woche im Studio.“), ohne „[Wort für Kopie]“, „Aufnahme des Produktinhabers“ oder den alten Namen. Das ersetzt die Entscheidung von vorhin, die Quelle in der Beschreibung zu behalten. Globale Suche nach „[Name der fremden App]“, „[Wort für Kopie]“ und „[alter Programmname]“ in Code, Programmdaten, Texten, README und Dokumentation; nimm alle drei in die Wortfeld-Prüfung auf, auch für die Programmdaten. Einzige Ausnahme: ein interner Vermerk in `docs/known-limitations.md`, ohne Namen, dass Programm C auf einer fremden Vorlage beruht und vor einer öffentlichen Öffnung durch ein eigenes Programm ersetzt wird. Technisch nötige Treffer, falls es welche gibt, dokumentieren statt blind löschen.

**7.2 Anmeldung:** Der Text „Noch kein Konto? Registrieren“ bleibt, die Registrierung bleibt offen. Passe die bisherige Entscheidung, die Registrierung in Supabase zu schließen, in `docs/decisions.md` und im Audit-Report an.

**7.3 Persönliche Angaben im öffentlichen Repository:** Das Repository ist öffentlich. Prüfe interne Dokumente – Übergaben, Berichte, Prompts, Planungsdateien in `docs/` und im Wurzelverzeichnis – auf persönliche Angaben, die über die öffentliche Gründergeschichte hinausgehen, etwa Arbeitgeber oder Branche, weitere eigene Unternehmen, private Kontaktdaten oder medizinische Einzelheiten wie Verletzungen, und ersetze sie dort durch neutrale Formulierungen. **Nicht anfassen:** die Gründergeschichte in den App-Texten, auf der Website und in Markenmaterial – sie ist der Kern und Ursprung von FORM und bleibt, wie sie ist. Die Git-Historie nicht umschreiben; nur den aktuellen Stand bereinigen und im Bericht auflisten, welche Dateien betroffen waren.

## 7a. Entscheidungen zu den offenen Punkten des Rebranding-Berichts

Bitte in `docs/decisions.md` festhalten:
1. **Serie** in der Auswertung der Tagesaufgaben bleibt entfernt; „Diese Woche x von y“ bleibt.
2. **Gerätetest Startbild:** Die Daten in der App sind Testdaten, der Hinweis auf möglichen Datenverlust beim Entfernen der App gilt für mich nicht. Ich teste zuerst an der Vorschau und füge die App nach dem Merge neu hinzu.
3. **Push nach längerer Pause:** weglassen.
4. Als **P2-Punkte** in `audit-report.md` aufnehmen: „Wiederherstellen aus dem Export“ (muss vor echten Nutzern da sein) und, mit hoher Priorität, die Ursachensuche für den lokal wiederholt roten Test „alle Bereiche starten offline“ – es muss geklärt sein, ob die installierte App nach einem Update ohne Netz zuverlässig startet.
5. Der **Name von Programm C** ist in Abschnitt 7.1 geregelt.

## 8. Nicht in diesem Paket

Diese Wünsche kommen in eigene Sitzungen nach dem Merge – nur in `docs/implementation-plan.md` als nächste Schritte eintragen, nicht beginnen:
- Nährstoffe Salz, Zucker, gesättigte Fettsäuren, Ballaststoffe mit Referenzwerten.
- Grundnahrungsmittel und Suche in der Ernährung (Apfel, Eier, Tomaten werden nicht gefunden).
- Eigene Workouts aus der Übungsbibliothek zusammenstellen.
- Ausführungsanleitungen in den Übungsdetails.

## 9. Tests und Abschluss

- Je behobenem Fehler ein Test, der ohne den Fix fehlschlägt (Schalter, Wochenziel, Seitenanfang, Sprung im Training, frei vom Namen der fremden App).
- Betroffene Screens auf 360, 390 und 768 pt Breite prüfen: keine Überlappung, keine abgeschnittenen Knöpfe, keine ungewollten Umbrüche.
- Screenshots der geänderten Screens erneuern, `node tools/screens-overview.mjs` ausführen.
- `pnpm format:check`, `lint`, `typecheck`, `check:docs`, `test`, `build`, `check:bundle` (Startansicht unter 250 KB), E2E Chromium lokal, WebKit in der CI.
- Bericht wie bisher: gefundene Probleme, Ursachen, Änderungen, Dateien, Tests mit Ergebnis, Offenes, nicht Prüfbares, Empfehlungen. Nur Geprüftes gilt als erledigt.

Danach pushen und stoppen; gemergt wird nach meiner Freigabe.
