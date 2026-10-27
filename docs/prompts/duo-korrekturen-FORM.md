# FORM · iPhone Duo – Korrekturen nach dem Gerätetest

> Branch `form-duo`, PR #52. Ich habe am echten iPhone Duo getestet, an der Vorschau dieses Branches. Vieles ist in Ordnung; die Fehler unten traten **nur am Gerät** auf, nicht in deinen Browser-Tests. Suche deshalb gezielt nach Ursachen, die nur Safari auf dem Duo zeigt, und baue die Lösung so robust, dass sie nicht von Messwerten des Browsers abhängt. Ein Commit je Abschnitt mit D-Nummer, Tests, pushen. Keine Nachkontrollen planen; gemergt wird nach meinem erneuten Gerätetest.
>
> **Anhänge:** `duo-feste-elemente.png` (Einzelbilder aus drei Bildschirmaufnahmen, A bis C) und `duo-player-und-scanner.png` (zwei Screenshots, D und E).

## 1. Feste Elemente verrutschen (höchste Priorität)

- **A, zugeklappt, Training:** Die Fußleiste mit „Satz erledigt“ wandert beim Scrollen in die Bildschirmmitte und liegt dort im Inhalt; erst nach dem Scrollen springt sie zurück nach unten.
- **B, zugeklappt, Trainingsdetails:** Beim Scrollen stehen die Tab-Leiste bzw. der Kreis mitten im Inhalt statt unten.
- **C, aufgeklappt quer, Heute:** Die Tab-Leiste steht in der Bildschirmmitte, der Kreis rechts mitten über der Wasser-Karte.

**Erwartet:** Tab-Leiste, Kreis und die Fußleiste des Trainings kleben jederzeit am unteren Rand über dem sicheren Bereich – beim Schwung-Scrollen, beim Gummiband-Effekt am Seitenende, nach dem Auf- und Zuklappen und nach dem Drehen.

**Untersuchen, vermutlich eine gemeinsame Ursache:**
- Ein Vorfahre mit `transform`, `filter`, `backdrop-filter`, `perspective`, `will-change` oder `contain` wird zum Bezugsrahmen für `position: fixed` – zum Beispiel durch die Startfläche, Seitenübergänge oder die Änderungen am Systemrand aus D-372.
- Positionen, die per JavaScript aus `innerHeight`, `visualViewport` oder `100vh`/`dvh` berechnet werden, obwohl die Systemleisten des Duo an der Seite liegen.
- Welcher Container tatsächlich scrollt, und wie sich das Gummiband am Seitenende auswirkt.

**Lösung bevorzugt in reinem CSS:** `position: fixed` mit `bottom` aus dem sicheren Bereich, ohne per JavaScript berechnete Lage; JavaScript nur für das Schrumpfen der Leiste, als `transform` innerhalb des fixierten Elements. Nichts darf die Leisten während des Scrollens neu positionieren.

## 2. Scanner: Kamerabild aufgeklappt quer um 90° gedreht

**E:** Aufgeklappt quer zeigt der Scanner das Bild, als würde man das Gerät seitlich halten (die Tastatur des Laptops steht senkrecht). Untersuche eigene Drehlogik – CSS-Drehung nach `screen.orientation`, `window.orientation` oder dem Seitenverhältnis – und die Annahme, die natürliche Ausrichtung sei hoch; beim inneren Display des Duo ist sie womöglich quer. **Erwartet:** keine eigene Drehung, das Video zeigt den Kamerastrom so, wie iOS ihn liefert; Rahmen und Erkennungsbereich richten sich nach der tatsächlichen Videogröße (`videoWidth`, `videoHeight`). In allen Haltungen steht das Bild aufrecht.

## 3. Training: Muskel-Etiketten in die Titelzeile

**D:** Das Etikett („Brust“) steht unter dem Übungsnamen und überdeckt dabei die Zeile „Erstes Mal“. Die Etiketten stehen künftig in der Titelzeile rechts neben dem Namen, vor (i) und „…“. Reicht der Platz nicht, brechen sie in eine eigene Zeile um – nie über „Erstes Mal“ oder anderem Text. In allen Breiten.

## 4. Heute aufgeklappt: Knöpfe der Karte „Ernährung heute“

Im zweispaltigen Layout ist die Karte so hoch wie die Wasser-Karte daneben; die drei runden Knöpfe (Scanner, Lebensmittel, Einkaufsliste) sitzen direkt unter den Makros, darunter bleibt viel leerer Platz (Bild C2). Die drei Knöpfe stehen vertikal mittig im freien Raum unter den Makros, horizontal weiterhin mittig.

## 5. Gerätedaten zum Nachsehen

Damit ich dir bei Gerätefehlern echte Werte schicken kann: unter „Mehr › Über die App“ ein zugeklappter Bereich „Gerätedaten“ mit `innerWidth`/`innerHeight`, `visualViewport` (Breite, Höhe, `offsetTop`, `pageTop`), den sicheren Bereichen, `screen.orientation` (Typ, Winkel), `devicePixelRatio` und dem Anzeigemodus (App vom Home-Bildschirm oder Safari). Werte aktualisieren sich live beim Drehen, Auf- und Zuklappen; nichts wird übertragen. Klein, nachgeladen, keine neue Abhängigkeit.

## 6. Tests und Abschluss

- Je Abschnitt Tests, soweit im Browser nachstellbar; für Abschnitt 1 zusätzlich eine Prüfung, dass kein Vorfahre der Leisten einen eigenen Bezugsrahmen für `position: fixed` bildet.
- Im Bericht: die gefundene Ursache je Fehler – oder, falls nicht belegbar, die geprüften Hypothesen und was du abgesichert hast.
- Eine kurze Liste für meinen erneuten Gerätetest.
- Alle Prüfungen wie gewohnt, Bilder erneuern; pushen und stoppen.
