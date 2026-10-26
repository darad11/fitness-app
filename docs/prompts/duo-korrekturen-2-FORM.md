# FORM · iPhone Duo – Korrekturen nach dem zweiten Gerätetest

> Auftrag des Produktinhabers vom 26.10.2026 im Chat, wörtlich übernommen. Branch `form-duo`, PR #52.
>
> **Anhang:** `duo-befunde-2.png` mit A (Startfläche zugeklappt und aufgeklappt, grün gestrichelt die Bildschirmmitte, rot die Mitte von Logo und Claim) und B (zugeklappt, Einkaufsliste, Artikel bearbeiten, vier Einzelbilder). Das Bild liegt nicht im Repository.

Drei Dinge sind zu ändern (Anhang duo-befunde-2.png):

1. Startfläche nicht mehr mittig (A): Zugeklappt und aufgeklappt stehen Logo und „FORM YOURSELF.“ um die seitliche Systemleiste nach links verschoben. Sie sollen wie vorher in der Mitte des ganzen Bildschirms stehen – die Startfläche hat keine Bedienelemente, deshalb richtet sie sich nicht nach den sicheren Bereichen. Gleiche Lage wie das iOS-Startbild, damit beim Übergang nichts springt. Prüfe auch, ob es Startbilder für die Maße des Duo gibt (zugeklappt und aufgeklappt, hoch und quer); falls nicht, ergänze sie nach derselben Regel.

2. Tastatur in Formularen (B, zugeklappt, Einkaufsliste – Artikel bearbeiten): Die Tab-Leiste liegt über der Tastatur mitten im Formular und verdeckt Felder, und beim Antippen eines Felds springt die Ansicht bis zum Seitenanfang und wieder zurück – vermutlich eine Folge des Scroll-Rahmens aus D-384. Erwartet: Bei offener Tastatur sind Tab-Leiste und Kreis ausgeblendet; das angetippte Feld wird ohne Springen sichtbar gemacht; die Fußleiste im Training darf über der Tastatur bleiben, verdeckt aber nie das Feld, in das ich tippe. Prüfe alle Formulare – Einkaufsliste, Lebensmittel suchen und Menge, Gewicht, Ziele, Tagesaufgaben, Anmeldung, Eingaben im Training –, zugeklappt und aufgeklappt und auf dem normalen iPhone.

3. Keine sichtbaren Scroll-Balken: Die grauen Balken des Scroll-Rahmens sollen auf Touch-Geräten nicht zu sehen sein – im Seitenrahmen und in allen anderen scrollbaren Bereichen (Blätter, Listen, Dialoge). Das Scrollen selbst bleibt unverändert, auch mit Tastatur. Am Computer mit Maus bleiben sie, aber dünn und dunkel in den Farben der App.

Je ein Commit mit D-Nummer, Tests, Bilder erneuern, pushen und stoppen; danach teste ich erneut am Gerät.
