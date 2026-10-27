# FORM · iPhone Duo – Startfläche aufgeklappt, Messung am Gerät

> Auftrag des Produktinhabers vom 27.10.2026 im Chat, wörtlich übernommen. Branch `form-duo`, PR #52. Umgesetzt als D-393.
>
> **Anhang:** `duo-startflaeche-messung.png` mit A (Startfläche aufgeklappt hoch und quer, grün gestrichelt die Bildschirmmitte, rot die Mitte des Logos) und B (Gerätedaten zugeklappt hoch, aufgeklappt hoch, aufgeklappt quer). Das Bild liegt nicht im Repository.

Startfläche aufgeklappt noch nicht mittig – gemessen am Gerät (Anhang duo-startflaeche-messung.png):

- Aufgeklappt hoch: Logo 102 pt links der Mitte. Das entspricht genau (466 − 669) / 2 – vermutlich meldet screen.width auf dem Duo auch aufgeklappt die Breite des äußeren Displays (466), und D-390 verschiebt deshalb in die Gegenrichtung.

- Aufgeklappt quer: Logo 42 pt links der Mitte – die Hälfte der 84 pt neben dem Fenster; hier wird gar nicht ausgeglichen.
- Zugeklappt hoch passt.

Gerätedaten: zugeklappt hoch Fenster 382 × 678 (Bildschirm laut Screenshot 466 × 678), aufgeklappt hoch 669 × 869 (669 × 951), aufgeklappt quer 867 × 587 (951 × 669); sichere Bereiche überall 0, 0, 34, 0.

Bitte:

1. Erweitere die Gerätedaten um screen.width und screen.height, screen.availWidth und screen.availHeight, outerWidth und outerHeight, screenX und screenY sowie die berechnete Verschiebung der Startfläche (x und y), damit ich am Gerät nachprüfen kann.
2. Richte die Startfläche in allen vier Zuständen – zugeklappt und aufgeklappt, jeweils hoch und quer – auf die Mitte des ganzen Bildschirms aus. Nutze screen.\* nur, wenn die Werte plausibel sind (Bildschirm in beiden Richtungen mindestens so groß wie das Fenster und passend zur Ausrichtung); sonst die offizielle Lage der Systemstreifen des Duo aus deiner Recherche in Phase 1. Ist nichts verlässlich, steht die Startfläche mittig im Fenster – nie in die Gegenrichtung verschoben.
3. Unit-Tests mit genau diesen Messwerten. Prüfe außerdem, dass Startbild und Startfläche in allen vier Zuständen dieselbe Lage haben, damit beim Übergang nichts springt.

Commit mit D-Nummer, pushen und stoppen.
