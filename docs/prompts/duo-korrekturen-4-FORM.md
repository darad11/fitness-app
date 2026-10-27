# FORM · iPhone Duo – Startfläche wechselt bei mehrmaligem Start

> Auftrag des Produktinhabers vom 27.10.2026 im Chat, wörtlich übernommen. Branch `form-duo`, PR #52. Umgesetzt als D-394.
>
> **Anhang:** `duo-startflaeche-wechselnd.png`, aufgeklappt quer, dieselbe Haltung, mehrmals gestartet (Aufnahme 08:06): Start 1 (0,5 s) und Start 3 (5,5 s) mittig, Start 4 (8,1 s) mit dem Logo 728 px = 243 pt links der Mitte, Mitte bei 233 pt. Grün gestrichelt die Bildschirmmitte, rot die Mitte des Logos. Das Bild liegt nicht im Repository.

Startfläche wechselt bei mehrmaligem Start: Aufgeklappt quer, dieselbe Haltung, mehrere Kaltstarts hintereinander (Anhang duo-startflaeche-wechselnd.png). Zweimal steht das Logo mittig, beim vierten Start liegt seine Mitte bei 233 pt – der halben Breite des äußeren Displays (466 pt). Vermutlich meldet iOS beim Start manchmal noch die Maße des zugeklappten Zustands, und die Startfläche übernimmt diese einmalige Messung vor dem ersten Bild.

Bitte:

1. Keine einmalige Messung: Die Startfläche richtet sich per CSS am aktuellen Fenster aus; die Verschiebung für die Streifen des Duo steht in CSS-Variablen und wird bei jeder Größenänderung, Drehung und Änderung des visualViewport neu gesetzt, solange die Startfläche sichtbar ist.
2. Das Logo bleibt unsichtbar, bis die Werte stabil und plausibel sind – zwei aufeinanderfolgende Bilder mit gleichen Maßen, die zu einer bekannten Haltung des Duo passen oder bei denen Fenster und Bildschirm gleich groß sind –, höchstens 300 ms; danach erscheint es ohne Sprung an der richtigen Stelle.
3. Werte, die sich widersprechen (zum Beispiel ein Fenster mit der Breite des äußeren Displays bei Ausrichtung quer), werden nie zur Berechnung genutzt.
4. In den Gerätedaten zusätzlich: die Maße, die beim Start zuerst gemeldet wurden, und wann sie sich geändert haben.
5. Tests, die das nachstellen: zuerst Maße des zugeklappten Zustands, kurz danach die aufgeklappten – am Ende steht das Logo mittig, und es war nie an der falschen Stelle sichtbar.

Commit mit D-Nummer, pushen und stoppen.
