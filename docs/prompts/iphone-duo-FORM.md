# FORM · iPhone Duo – vollständige Prüfung, Fehler beheben, Layout nach Freigabe

> **Stand:** FORM ist live; Rebranding, Stabilität und Ernährung sind gemergt (zuletzt `dd27315`). Diese Sitzung arbeitet auf einem eigenen Branch `form-duo` von `main` mit Entwurfs-PR; `form-duo` in `CLAUDE.md` als aktuelle Phase eintragen. Es gelten `CLAUDE.md`, `brand-tokens.md`, `form-markenleitplanken.md`. Keine Nachkontrollen planen; gemergt wird nach meiner Freigabe.
>
> **Die ausführlichen Leitlinien in `docs/prompts/iphone-duo-leitlinien-FORM.md` sind verbindlich** – alle dort genannten Screens, Anforderungen, Prüfungen und Berichtspunkte. Dieser Auftrag legt nur die Reihenfolge fest: zuerst vollständig prüfen und Fehler beheben, Layout-Änderungen erst nach meiner Freigabe. Grund: Die App ist seit dem Rebranding breitenunabhängig gebaut (D-313) und sieht auf dem Duo schon gut aus; was gut funktioniert, soll nicht ohne Not umgebaut werden.

## Phase 1 – vollständige Prüfung und Fehler

**1. Gerät.** Recherchiere die tatsächlichen Viewport-Maße des iPhone Duo zugeklappt und aufgeklappt (offizielle Angaben). Erfinde keine Geräte-APIs; gibt es keine verlässliche Erkennung des Zustands, gilt die Fensterbreite. Fehlen offizielle Maße, dokumentiere deine Annahmen.

**2. Alle Screens aus den Leitlinien (Kapitel 4) in drei Breiten** – zugeklappt, aufgeklappt und ein Zwischenmaß –, mit Übersichtsbild. Geprüft wird alles aus den Kapiteln 3 bis 9 der Leitlinien: Lesbarkeit, abgeschnittene Inhalte, Diagramme und Kalender, Dialoge und Blätter, Touch-Ziele, Einhandbedienung, Barrierefreiheit.

**3. Diese Fehler behebst du gleich, ohne auf meine Freigabe zu warten:**
- **Barcode-Scanner auf dem Duo falsch ausgerichtet.** Untersuche Kamerabild und Suchrahmen: Ausrichtung und Drehung des Videos, Seitenverhältnis und `object-fit`, die Lage des Rahmens über dem Video, die Zuordnung des Erkennungsbereichs zum sichtbaren Bild, das Verhalten beim Auf- und Zuklappen und beim Drehen. In beiden Zuständen müssen Bild und Rahmen deckungsgleich sein, und ein Barcode im Rahmen wird erkannt.
- **Tab-Leiste reagiert und bewegt sich auf dem Duo nicht wie vorgesehen.** Sie muss sich in beiden Zuständen genau so verhalten wie auf dem iPhone: beim Scrollen zum runden Button schrumpfen und wieder aufgehen, die Linse beim Ziehen mitführen, jeder Tipp trifft. Untersuche, welcher Container scrollt, die Reaktion auf Größenänderungen, Zeiger-Ereignisse und die breitenabhängige Positionierung.
- **Alles, was beim Auf- und Zuklappen verloren geht** (Kapitel 6 der Leitlinien): laufendes Training, eingegebene Werte, ausgewählter Satz, Pausen-Timer, offene Blätter und Dialoge, Scrollposition. Mit E2E-Tests, die das Fenster während des Trainings verkleinern und vergrößern.
- Weitere Fehler, die du bei der Prüfung findest, ebenso.

Liegen der Nachricht Bilder oder Aufnahmen vom Duo bei, sind sie die Referenz für die beiden Fehler. Jeder behobene Fehler bekommt einen Test, der am alten Stand fehlschlägt. Was sich nur am echten Gerät prüfen lässt, kommt auf die Liste für meinen Gerätetest.

**4. Bewertung der Layout-Verbesserungen** (Kapitel 5, 7, 8 und 12 der Leitlinien): je Screen, wo der aufgeklappte Bildschirm echten Nutzen bringt – mit Nutzen, Aufwand und Risiko, eingeteilt in „lohnt sich“, „später“, „unnötig“. Kandidaten, die ich mir vorstelle: laufendes Training (Satzliste links, Pausen-Timer und nächste Übung rechts), Ernährung (Ring mit Makros links, Mahlzeiten rechts), Programme (Liste links, Details rechts), Fortschritt (Diagramme neben den Kennzahlen).

**Dann stoppe** und gib mir: das Übersichtsbild, den Bericht zu den behobenen Fehlern, die Bewertung als Tabelle und deine Empfehlung, welche Layout-Verbesserungen umgesetzt werden sollen.

## Phase 2 – nach meiner Freigabe

- Die freigegebenen Layout-Verbesserungen umsetzen, nach Kapitel 10 der Leitlinien: vorhandene Komponenten und Tokens, zentrale Umbruchpunkte, keine doppelte Logik. Mehrspaltige Layouts werden nachgeladen; die Startansicht bleibt unter 250 KB (aktuell 234,6 KB).
- Navigation nur ändern, wenn es einen klaren Vorteil gibt; die schwebende Tab-Leiste bleibt sonst, wie sie ist.
- Tests nach Kapitel 11 in drei Breiten, Bilder erneuern, alle Prüfungen wie gewohnt; Abschlussbericht nach Kapitel 13; pushen, stoppen.
- Zum Schluss eine kurze Liste für meinen Gerätetest am iPhone Duo, zugeklappt und aufgeklappt.
