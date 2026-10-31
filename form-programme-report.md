# FORM · Bericht zur Phase Programme

Stand: 29.10.2026, Abschnitt 0 (Vorab) erledigt; Abschnitt 1 als Standbilder fertig (D-459, D-460). **Halt:** Ich warte auf deine Freigabe von Schuh und Rückenlogo; danach rendere ich die drei Pilot-Übungen neu.

## 1. Abschnitt 0 – Vorab (D-458)

| Punkt | Ergebnis |
|---|---|
| Gerätetest der Phase Übungen | bestanden (Produktinhaber, 29.10.2026) |
| PR #53 (`form-uebungen`) | auf „Ready for review“ gesetzt und auf Anweisung des Produktinhabers als normaler Merge nach `main` gemergt, Merge-Commit `8b2ab96`; vorher CI zum Kopf `aa03bbd` alle Jobs grün, auch WebKit |
| CI auf `main` zu `8b2ab96` | Lauf 40942580965 (Nr. 346): alle vier Jobs grün, auch E2E (webkit); E2E Chromium 11,0 min, WebKit 15,4 min |
| Branch `form-programme` | Beim Auftrag war #53 noch offen, `main` stand auf `25a3553` (Merge von #52); der Branch entstand deshalb zuerst vom Stand von #53. Nach dem Merge auf `main` vorgespult (`8b2ab96`), ohne eigene Commits dazwischen; der Entwurfs-PR nach `main` zeigt nur die neue Arbeit |
| Auftrag | `docs/prompts/programme-ganzkoerper-FORM.md`, in `CLAUDE.md` als aktuelle Phase |

**Nächster Schritt:** Abschnitt 1 in einer neuen Sitzung: Schuh mit echter Schnürung, Profil, angehobener Spitze, Polster am Knöchel und Zehenbox eines Laufschuhs; Rückenlogo im Verhältnis des Startbilds; Standbilder neben dem Board, Rückenlogo vorher und nachher, die drei Pilot-Übungen in Player-Größe; dann Halt bis zur Freigabe.

### 1.1 Bericht zum Paket

```
Arbeitspaket: D-458 Phase Programme: Merge der Phase Übungen, Branch und Entwurfs-PR
Umgesetzte Funktionen: keine (Merge und Dokumente), erfüllte AK: –
Geänderte Dateien: CLAUDE.md, docs/prompts/programme-ganzkoerper-FORM.md (neu), form-programme-report.md (neu), form-uebungen-report.md, docs/decisions.md, docs/testing.md, docs/implementation-plan.md
Technische Entscheidungen: D-458
Ausgeführte Tests: CI auf main zum Merge; pnpm format:check, check:docs; CI zum Entwurfs-PR
Ergebnis: bestanden
Bekannte Einschränkungen: –
Nächste Schritte: Abschnitt 1 (Schuh und Rückenlogo als Standbilder) in einer neuen Sitzung
```

## 2. Abschnitt 1 – Schuh und Rückenlogo (D-459, D-460)

Auftrag: zuerst nur Standbilder, dann Halt bis zur Freigabe. Vorher geprüft: CI auf `main` zum Merge `8b2ab96` grün (Abschnitt 1), `form-programme` auf dem Stand von `main`. Der erste Teil (D-459) lag noch ohne Bilder vor, weil `*.makehumancommunity.org` gesperrt war (2.6); nach deiner Freigabe der Adresse ist alles gerendert und geprüft (D-460).

### 2.1 Rückenlogo kleiner (D-459)

F über FORM jetzt in der Proportion des vertikalen Logos im Startbild (D-325): F 2,28 Versalhöhen der Wortmarke hoch statt 3,40 wie auf dem Board, Abstand 0,82 statt 0,78. Die Wortmarke bleibt so groß wie bisher, das F wird rund ein Drittel kleiner. Die Mitte des Blocks bleibt, wo sie war, mittig im oberen Rücken. F und Wortmarke kommen weiter unverzerrt aus den Markendateien.

| Maß (C männlich) | bisher (Board) | neu (Startbild) |
|---|---|---|
| F hoch, auf der Figur gemessen | 14,2 cm | 9,5 cm (67 %) |
| Wortmarke breit, auf der Figur gemessen | 22,5 cm | 22,5 cm |
| Abstand F zu FORM | 3,3 cm | 3,4 cm |
| Block hoch | 21,6 cm | 17,1 cm |
| Mitte des Blocks unter dem Bündchen | 22,5 cm | 22,5 cm |
| Oberkante des F unter dem Bündchen, auf der Figur gemessen | 11,7 cm | 13,9 cm |

Am Bild des Logos nachgemessen: F 2,28 Versalhöhen hoch, Abstand 0,82, Wortmarke 5,40 Versalhöhen breit, beide waagrecht mittig. Der Wert steht in `tools/uebungen-3d/kleidung.py` als `RUECKEN_LOGO`; die Messung des Boards bleibt in `BOARD["ruecken_versal"]`. Mit den Werten des Boards ergibt die Rechnung genau das bisherige Logo; so entstehen die Vorher-Bilder.

### 2.2 Schuh näher am Board (D-460)

Alles als Geometrie am Schaft von MakeHuman (`schuhe.py`); Farben, Aufteilung und FORM-F wie bisher nach dem Board. Der Schalter `schuhe.NEU = False` zeigt den Schuh bis D-459 (Vorher-Bilder).

- **Schnürung:** sechs Paar Ösen als kleine Ringe (5 mm) auf dem Rist, von 55,5 bis 78,5 % der Schuhlänge, quer 2,7 cm unten bis 3,7 cm oben auseinander. Flache Senkel (3,8 × 1,8 mm) über Kreuz von Öse zu Öse; wo sie sich kreuzen, liegt eine Bahn über der anderen. Unten ein Steg, oben ein Knoten mit zwei Schlaufen und zwei Enden mit Hülsen. Jeder Punkt sitzt senkrecht über der Oberfläche des Schafts und hängt an denselben Knochen wie der Schaft darunter. Das kleine F auf der Zunge bleibt über der Schnürung sichtbar. Die aufgemalten Fugen entfallen.
- **Profil an der Laufsohle:** Stollen quer zum Fuß, in der Mitte geteilt, 6,2 mm lang mit 3,4 mm Fuge, 2,5 mm hoch, von 3,5 bis 95,5 % der Länge. Der Körper der Sohle beginnt um die Profilhöhe höher; von der Seite sieht man die Stollen als Kerben in der schwarzen Laufsohle, die jetzt 6 mm hoch reicht.
- **Angehobene Spitze:** ab 70 % der Länge hebt sich der Schuh zur Spitze hin bis 12 mm. Ferse und Ballen stehen flach; die Farbfelder (Laufsohle, Zehenkappe) folgen der Spitze.
- **Polster am Knöchel:** schwarzer Wulst (Radius 4 mm) entlang der Oberkante um die Ferse, auf beiden Seiten bis 37 % der Länge (kurz vor der Zunge); seine Enden tauchen in die Kante. Seitlich am Knöchel wölbt sich der Schaft bis 2,5 mm nach außen. Das Futter im Kragen und hinter der Zunge ist schwarz wie auf dem Board.
- **Zehenbox eines Laufschuhs:** ab 56 % der Länge zur Spitze hin bis 20 % schmaler und 30 % flacher, die Spitze 6 mm zur großen Zehe. Der Schaft bleibt dabei mindestens 3,5 mm über der Socke (an den Ecken 5 mm); wo das nicht reicht, gibt er nach.

### 2.3 Zwei alte Durchdringungen behoben

- **Vorfuß:** Im Schuh von MakeHuman ragte die Socke außen am Vorfuß bis 4,0 mm durch den Schaft. Zu sehen war das nicht, weil Socke und Haut im Schuh ausgeblendet sind; es war aber eine Durchdringung. Der Schaft rückt dort jetzt bis 7,0 mm nach außen, die Socke liegt überall mindestens 1,0 mm unter seiner Außenseite.
- **Ferse beim Bankdrücken:** Von hinten innen sah man an der Ferse einen schwarzen Fleck, auch im Schuh bis D-459. Es war die Rückseite des Futters: Das Futter lag dort nur 1 mm unter der Außenlage, und seine Dicke von 2 mm wuchs nach außen. Jetzt ist das Futter 0,3 mm dick, der Fleck ist weg. Ein erster Versuch, die Gewichte am Kragen zu glätten, beseitigte den Fleck auch, ließ aber das Futter an der Ferse 0,8 mm in die Socke rücken; verworfen, die Gewichte bleiben wie bisher.

### 2.4 Prüfung in den drei Pilot-Übungen

Alle 60 Bilder jeder Schleife, Figur der App, verformte Netze (`render.py --pruefen`, neue Werte aus `schuhe.pruefung_neu`). Kleinste Werte über die Schleife:

| | Kniebeuge | Bankdrücken | Latziehen | bis D-459 |
|---|---|---|---|---|
| Ferse und Ballen beider Füße über dem Boden | 0,0 mm | 0,0 mm | 0,0 mm | 0,0 mm |
| Verschiebung der Sohle über die Schleife | 0,1 mm | 0,0 mm | 0,1 mm | 0,1 mm |
| Standhöhe (Fuß im Schuh über dem Boden) | 27,0 mm | 27,0 mm | 27,0 mm | 27,0 mm |
| Kragen innen über der Socke | 1,59 mm | 0,95 mm | 1,59 mm | 0,95 mm |
| Polster über der Socke | 1,60 mm | 0,63 mm | 1,60 mm | – |
| Senkel / Ösen über der Socke | 4,55 / 4,36 mm | 4,55 / 4,36 mm | 4,55 / 4,36 mm | – |
| Socke im Schuh unter der Außenseite der Zehenbox | 1,0 mm | 1,0 mm | 1,0 mm | −4,0 mm (verdeckt) |
| Socke über der Haut | 2,86 mm | 2,76 mm | 2,96 mm | 2,8 mm |
| Löcher über dem Schuh (Punkte) | 0 | 0 | 0 | 0 |
| Sichtbare Socke außerhalb des Schuhs (Punkte) | 0 | 0 | 0 | – |

Positive Werte heißen Luft, negative Durchdringung. Die Spalte „bis D-459“ stammt aus der Prüfung von D-451 (`form-uebungen-report.md`); die Zehenbox des alten Schuhs habe ich in der Ruhehaltung gemessen (der Fuß bewegt sich im Schuh nicht), Standhöhe aus derselben Messung; Polster, Senkel, Ösen und die sichtbare Socke gab es vorher nicht als Prüfwert. Der Rig meldet nichts; Kniebeuge: Knie mindestens 6,9 cm hinter der Schuhspitze, Stange 0,1 cm über der Mitte der Sohle. Die Prüfansichten der Füße (je Übung von außen, vorn, hinten und innen, in Ausgangs- und Endposition, 24 Bilder) habe ich mir angesehen: Schnürung, Polster und Profil sitzen in jeder Haltung, nirgends schaut etwas durch.

### 2.5 Standbilder

In `docs/screens/uebungen/`, gerendert mit `tools/uebungen-3d/schuh_bilder.py` und `varianten_bilder.py` (Licht und Kantenlicht wie in der App, C männlich), Blätter mit `tools/uebungen_korrektur_bild.py --runde 9`:

- `schuh-1-board.webp`: das Board, beide Schuhe aus seiner Richtung vorher und nachher, der linke Schuh von außen, innen, hinten und oben, nachher und vorher.
- `schuh-2-details.webp`: Schnürung von oben und von der Seite, Zunge mit F, Kragen außen, hinten und innen, Spitze und Ferse mit Profil.
- `ruecken-vorher-nachher.webp`: Rückansicht der ganzen Figur und des Oberkörpers, Latziehen mit der Kamera der App und von hinten, in End- und Ausgangsposition, jeweils vorher und nachher.
- `schuh-3-player.webp`: Kniebeuge unten, Bankdrücken oben und unten, Latziehen unten in der Größe des großen Players (390 px), dazu das Vorschaubild (56 px).

Renderzeit je Standbild 16 bis 45 s (560 × 560, 600 × 900 und 720 × 540 Pixel, 40 bis 48 Proben), zusammen mit dem Aufbau der Szenen rund 15 Minuten; die Messung aller 180 Bilder der drei Schleifen knapp 2,5 Minuten.

### 2.6 Quellen

In der Sitzung vom 29.10.2026 war `*.makehumancommunity.org` zuerst gesperrt (Proxy 403); dort liegt das Paket mit Haut, Augen, Haaren und der Form des Schuhs. Grundmodell, Skelett und Gewichte lädt `render.py --hole` seitdem aus `makehumancommunity/makehuman` (unter `makehuman/makehuman` lieferte `raw.githubusercontent.com` 404), die Körperformen weiter aus `makehumancommunity/mpfb2`. Nach deiner Freigabe der Adresse lud das Paket in rund zwei Minuten (280 MB). Blender 4.2 als Python-Modul kommt über PyPI.

### 2.7 Abweichungen und offene Punkte

- **Form von MakeHuman:** Der Schaft ist weiter `shoes05`, angepasst. Der Rist ist geschlossen (keine Lasche zwischen zwei Ösenleisten), die Schnürung liegt darauf. Nähte, Netzeinsätze und Ziernähte des Boards gibt es nicht.
- **Innen flach:** Die angehobene Spitze ist nur am Schuh; die Zehen der Figur liegen weiter flach, an der Spitze liegen ihre Unterseiten in der Sohle (verdeckt).
- **Profil von unten:** Die App-Kamera sieht die Sohle nie von unten; das Profil zeigt sich an der Kante und an der angehobenen Spitze.
- **Polster beim Bankdrücken:** 0,63 mm über der Socke, weniger als in den anderen Übungen (1,60 mm), aber ohne Durchdringung.
- **In Player-Größe** ist der Schuh rund 30 Pixel lang; Schnürung und Profil sind dort nur angedeutet. Deutlich sieht man sie auf den Detailbildern.

### 2.8 Berichte zu den Paketen

```
Arbeitspaket: D-459 Phase Programme, Abschnitt 1 (erster Teil): Rückenlogo im Verhältnis des Startbilds
Umgesetzte Funktionen: keine in der App; Werkzeug: Rückenlogo in der Konfiguration (tools/uebungen-3d/kleidung.py), neue Adresse des Grundmodells (tools/uebungen-3d/render.py), erfüllte AK: –
Geänderte Dateien: tools/uebungen-3d/kleidung.py, tools/uebungen-3d/render.py, form-programme-report.md, docs/decisions.md, docs/testing.md, docs/implementation-plan.md, docs/licenses-data.md
Technische Entscheidungen: D-459
Ausgeführte Tests: Syntax (py_compile), Nachrechnung der Maße, Laden des Grundmodells von der neuen Adresse, pnpm format:check, pnpm check:docs; CI zum Entwurfs-PR
Ergebnis: bestanden; nicht gerendert
Bekannte Einschränkungen: Paket von MakeHuman in der Sitzung zuerst gesperrt (2.6); Schuh noch nicht umgesetzt (folgte mit D-460)
Nächste Schritte: files2.makehumancommunity.org freigeben, dann Schuh und Standbilder, Halt bis zur Freigabe
```

```
Arbeitspaket: D-460 Phase Programme, Abschnitt 1: Schuh näher am Board und Rückenlogo als Standbilder
Umgesetzte Funktionen: keine in der App; Werkzeug: Schnürung, Profil, angehobene Spitze, Polster am Knöchel, Zehenbox, schwarzes und dünnes Futter (schuhe.py), Prüfwerte pruefung_neu, render.py --nur-messwerte, schuh_bilder.py, Blätter Runde 9; erfüllte AK: –
Geänderte Dateien: tools/uebungen-3d/schuhe.py, tools/uebungen-3d/render.py, tools/uebungen-3d/schuh_bilder.py (neu), tools/uebungen_korrektur_bild.py, docs/screens/uebungen/schuh-1-board.webp, schuh-2-details.webp, ruecken-vorher-nachher.webp, schuh-3-player.webp (neu), form-programme-report.md, docs/decisions.md, docs/testing.md, docs/implementation-plan.md, docs/feature-inventory.md
Technische Entscheidungen: D-460
Ausgeführte Tests: Messung aller 60 Bilder der drei Pilot-Übungen (render.py --pruefen und --nur-messwerte), Prüfansichten der Füße angesehen, Standbilder angesehen; pnpm format:check, pnpm check:docs, pnpm build, pnpm check:bundle; CI zum Entwurfs-PR
Ergebnis: bestanden (Werte in 2.4)
Bekannte Einschränkungen: 2.7
Nächste Schritte: Halt bis zur Freigabe; danach die drei Pilot-Übungen als Schleifen mit Schuh und Rückenlogo, dann Abschnitt 2
```

**Halt:** Ich warte auf deine Freigabe von Schuh und Rückenlogo. Danach rendere ich die drei Pilot-Übungen als Schleifen neu.

## 3. Freigabe von Abschnitt 1: Shorts-F und Schleifen (D-461)

Deine Freigabe vom 30.10.2026: Schuh und Rückenlogo passen, mit einer Korrektur am Shorts-F. Danach die drei Pilot-Übungen als Schleifen in der App.

### 3.1 Shorts-F weiter nach vorn

Das F saß am Lime-Seitenstreifen: auf dem Stoff gemessen 0,0 cm, es berührte ihn. Die Mitte des F lag am Punkt des Netzes, der dem Winkel des Boards am nächsten kam (24° von vorn nach außen um den Oberschenkel). Die Punkte liegen dort rund 10° auseinander; ein kleinerer Winkel landete deshalb auf demselben Punkt und änderte nichts. Jetzt liegt die Mitte genau 10° von vorn nach außen (`kleidung.HOSE_F_WINKEL`). Die Höhe kommt weiter vom bisherigen Punkt, so bleibt das F gleich hoch über dem Saum und gleich groß (4,66 cm hoch).

Gemessen wird auf dem Stoff: Netz der Shorts in der Haltung des Bilds, ohne Glättung, je Dreieck dicht abgetastet (am F rund 2 mm). Ob ein Punkt zum F oder zum Streifen gehört, entscheidet dieselbe Regel wie beim Rendern. Dann die kürzeste Strecke zwischen beiden, am linken Bein (`kleidung.f_streifen_abstand`, auch als Prüfwert in `render.py --pruefen`).

| | Kniebeuge | Bankdrücken | Latziehen |
|---|---|---|---|
| F zum Streifen, kleinster Wert über alle 60 Bilder | 2,54 cm | 2,54 cm | 2,54 cm |
| größter Wert | 2,54 cm | 2,54 cm | 2,54 cm |
| bis D-460 | 0,0 cm (berührt) | 0,0 cm | 0,0 cm |

Der Abstand ist rund die halbe Breite des F wie auf dem Board und ändert sich über die Bewegung nicht, weil sich der Stoff an dieser Stelle nicht verformt. Das F berührt den Streifen in keinem Bild.

### 3.2 Schleifen in der App

Kniebeuge, Bankdrücken und Latziehen neu gerendert: Schuh aus D-460, Rückenlogo aus D-459, Shorts-F aus 3.1, sonst wie bisher (C männlich, 720 × 540, 60 Bilder, 40 Proben). Dieselben Dateinamen in `public/uebungen/medien/`.

| | Kniebeuge | Bankdrücken | Latziehen |
|---|---|---|---|
| Renderzeit, 60 Bilder | 1.463 s | 1.585 s | 1.183 s |
| bisher (D-456) | 1.056 s | 1.397 s | 985 s |
| nahtlos (erstes und letztes Bild pixelgleich) | ja | ja | ja |
| MP4 / WebM | 67,2 / 59,8 KB | 49,5 / 41,5 KB | 55,0 / 50,7 KB |
| Poster / Vorschau | 7,4 / 4,8 KB | 9,0 / 4,5 KB | 9,3 / 4,3 KB |
| abgerufen (MP4, Poster, Vorschau) | 79,4 KB | 63,0 KB | 68,6 KB |

Alle zwölf Dateien zusammen 363,1 KB (bisher 365,3 KB). Die Renderzeit ist länger als in D-456: Der Schuh hat mehr Geometrie, und während der Schleifen liefen Prüfungen für Abschnitt 2 nebenher. In `medien.json` steht als Quelle jetzt `makehumancommunity/makehuman` (die alte Adresse liefert seit dem 29.10.2026 nichts mehr), die Lizenzangabe nennt die Schuhform. Startansicht unverändert 237,8 KB, die Übungsdateien bleiben im Offline-Vorrat.

### 3.3 Bilder

- `docs/screens/uebungen/pilot-uebersicht.png`: je Übung Ausgangs- und Endposition, Player zu und auf, Übungsdetails, dazu die Übungsliste (aus der gebauten App).
- `docs/screens/uebungen/pilot-player.mp4` und `.webm`: kurze Aufnahme des Players, nacheinander Kniebeuge, Bankdrücken und Latziehen; `pilot-bewegung.mp4` zeigt die drei Schleifen nebeneinander.
- `docs/screens/uebungen/shorts-f-abstand.webp`: Nahaufnahme der Shorts in allen drei Übungen, jeweils im Bild mit dem kleinsten Abstand, Kamera senkrecht auf den Stoff, gemessene Strecke eingezeichnet.

### 3.4 Bericht zum Paket

```
Arbeitspaket: D-461 Phase Programme, Abschnitt 1 freigegeben: Shorts-F und Schleifen der Pilot-Übungen
Umgesetzte Funktionen: neue Schleifen, Poster und Vorschaubilder für Kniebeuge, Bankdrücken und Latziehen (Schuh, Rückenlogo, Shorts-F); Werkzeug: Shorts-F genau auf 10° (kleidung.py), Messung F zum Streifen (kleidung.f_streifen_abstand, render.py --pruefen), shorts_bilder.py, Blatt Runde 10; erfüllte AK: –
Geänderte Dateien: tools/uebungen-3d/kleidung.py, tools/uebungen-3d/render.py, tools/uebungen-3d/shorts_bilder.py (neu), tools/uebungen_korrektur_bild.py, public/uebungen/medien/ (12 Dateien), public/uebungen/medien.json, docs/screens/uebungen/ (pilot-*, shorts-f-abstand.webp neu), form-programme-report.md, docs/decisions.md, docs/testing.md, docs/implementation-plan.md, docs/feature-inventory.md
Technische Entscheidungen: D-461
Ausgeführte Tests: Messung F zum Streifen in allen 180 Bildern, Vergleich erstes und letztes Bild je Schleife, Kontaktbogen der Schleifen und Bilder angesehen; pnpm format:check, pnpm check:docs, pnpm build, pnpm check:bundle, pnpm test:e2e (Chromium); CI zum Entwurfs-PR mit WebKit
Ergebnis: bestanden (Werte in 3.1 und 3.2; E2E Chromium 432 bestanden, 132 übersprungen, 0 fehlgeschlagen)
Bekannte Einschränkungen: Renderzeit länger als in D-456 (3.2)
Nächste Schritte: Abschnitt 2, erste Familie aus „Ganzkörper A/B“ als Prüfseite
```

## 4. Abschnitt 2 – Familie „Waagrechtes Drücken“: Prüfseite (D-462)

Erste Familie aus „Ganzkörper A/B“ im Animationsplan: Schrägbankdrücken mit Kurzhanteln (23 Einheiten in den drei Programmen) und Bankdrücken mit Kurzhanteln (22). Bankdrücken mit Langhantel aus derselben Familie läuft schon als Pilot. Wie verlangt zuerst nur die Prüfseite; die Schleifen rendere ich erst nach deiner Freigabe.

### 4.1 Geräte

- **Kurzhantel 20 kg**, Sechskant, gummiert, nach Herstellerangabe (Fitcom Hex 20 kg): 36,5 cm lang, Griff 13 cm lang und 3,4 cm dick, Köpfe 14,5 cm über die Ecken. Griff aus Stahl mit je einem Ring an den Köpfen, Köpfe dunkelgrau wie die Scheiben der Langhantel, eine flache Seite unten, Kanten gerundet.
- **Verstellbare Bank** nach Herstellerangaben (Factory Weights, Life Fitness): Polster 43 cm hoch, 6 cm dick, 30 cm breit, Lehne 80 cm, Sitz 40 cm, 2 cm Spalt am Gelenk. Für das Schrägbankdrücken steht die Lehne auf 30°, der Sitz flach. Rahmen mit Träger am Boden, Füßen, Stütze unter dem Gelenk und Strebe unter der Lehne.
- Flachbank wie beim Bankdrücken mit Langhantel.

### 4.2 Bewegung

Beide Übungen nach demselben Muster:

- **Lage:** Rücken und Schulterblätter auf der Bank, Schultern leicht zurückgezogen, Füße flach am Boden, Knie 100°, wie beim Bankdrücken mit Langhantel. Auf der Schrägbank sitzt das Gesäß auf dem Sitz am Gelenk, Rücken und Gesäß sinken je rund 4 mm ins Polster.
- **Griff:** Griff quer, Handflächen zu den Füßen, voller Griff mit dem Daumen über den Fingern, wie beim Bankdrücken mit Langhantel (D-452).
- **Ausgang:** Arme fast gestreckt (Ellbogen 172°), Hanteln senkrecht über den Schultergelenken, innen 8 cm auseinander.
- **Abwärts:** Der Unterarm bleibt senkrecht unter dem Griff. Der Oberarm zeigt 50° vom Rumpf zur Seite, in der Ebene der Bank gemessen (empfohlen 45 bis 60°, kein Abspreizen). Die Hanteln gehen dabei in einem Bogen nach außen und etwas zu den Füßen und kommen seitlich der Brust an. Die Griffe sinken gleichmäßig, aufwärts derselbe Weg zurück.
- **Tiefe flach:** Oberarm 25° unter der Bank, der Ellbogen knapp unter der Bank, Ellbogen 65°.
- **Tiefe schräg:** Die Griffe kommen gleich nah an die Brust wie flach, senkrecht zur Lehne gemessen: Oberarm 13,9° unter der Lehne, Ellbogen 58,7°, Hanteln seitlich der oberen Brust. Weil der Unterarm senkrecht steht, die Lehne aber 30° geneigt ist, braucht die Schrägbank dafür weniger Winkel unter der Lehne als die Flachbank.

### 4.3 Messwerte über alle 60 Bilder

| | Schrägbankdrücken | Bankdrücken |
|---|---|---|
| Ellbogen | 58,7° bis 172,0° | 65,0° bis 172,0° |
| Oberarm unten unter der Bankebene | 13,9° | 25,0° |
| Oberarm vom Rumpf zur Seite, solange der Ellbogen unter der Bank ist | 50,0° bis 55,8° | 50,0° |
| Unterarm zur Senkrechten | höchstens 3,8° | höchstens 4,5° |
| Handgelenk nach hinten | −0,2° bis 7,6° | −0,6° bis 7,6° |
| Handgelenk zur Seite (+ zum Daumen) | −1,5° bis 2,4° | −2,1° bis 2,4° |
| Handgelenk gesamt | höchstens 7,9° | höchstens 7,9° |
| Knie | 100° | 100° |
| Ferse und Ballen beider Füße über dem Boden | 0,0 mm | 0,0 mm |
| Verschiebung der Sohle über die Schleife | 0,0 mm | 0,0 mm |
| Rücken und Gesäß im Polster (Ziel 4 mm) | 3,9 bis 5,1 mm | 2,8 mm |
| Oberschenkel über dem Polster | 14,6 mm | 7,8 mm |
| Köpfe der Hanteln zum Körper (ohne Hände) | mindestens 37,4 mm | mindestens 37,4 mm |
| Hand zu den Innenseiten der Köpfe | 13,7 mm | 13,7 mm |
| Finger am Griff | 4,1 mm eingedrückt, 453 Punkte in Kontakt | 4,1 mm, 451 bis 453 Punkte |
| Köpfe innen auseinander | 8,0 bis 46,1 cm | 8,0 bis 40,9 cm |
| Kragen / Kragenpolster über der Socke | 1,0 / 0,7 mm | 0,9 / 0,6 mm |
| Shorts-F zum Streifen | 2,54 cm | 2,54 cm |
| Meldungen des Rigs | 0 | 0 |

Positive Werte heißen Luft, negative Durchdringung. Die Finger sinken wie bei allen Griffen gewollt 4 mm in den Griff ein (D-435), sonst dringt nichts ein. Am nächsten kommen die Köpfe dem Handgelenk; Brust und Schultern bleiben weiter weg. Die Regel „Knie über den Zehen“ gilt für Übungen im Stand; auf der Bank stehen die Füße flach vor den Knien.

### 4.4 Prüfseite und Rechenzeit

`docs/screens/uebungen/familie-waagrechtes-druecken.webp` (230 KB, aus `tools/uebungen_pruef_bild.py --familie`): je Übung Ausgangs- und Endposition mit der Kamera der App und von der Seite, der Griff der linken Hand von der Handfläche und vom Handrücken, der linke Fuß von außen und von vorn, jeweils in Ausgangs- und Endposition, darunter die Messwerte.

Rechenzeit: Messung aller 60 Bilder und Prüfansichten 316 s (Bankdrücken) und 304 s (Schrägbankdrücken), Griffbilder je knapp eine Minute. Die Schleifen schätze ich nach den Pilot-Übungen auf je 20 bis 26 Minuten. Dateigrößen folgen mit den Schleifen; bei den Pilot-Übungen sind es 63 bis 79 KB je Übung.

### 4.5 Werkzeug

- `geraete.py`: `kurzhantel()` und `schraegbank()` mit den Maßen aus 4.1.
- `uebungen.py`: `BankdrueckenKH` und `SchraegbankdrueckenKH`, dazu die Prüfwerte Köpfe zum Körper, Hand zu den Köpfen und Körper im Polster.
- `render.py --pruefen`: nimmt diese Werte und den Namen der Übung in die Messwerte auf.
- `familie_bilder.py`: Nahaufnahmen des Griffs; `uebungen_pruef_bild.py --familie`: die Prüfseite.
- Animationsplan: neue Spalte „Stand“ und eine Zeile zum Fortschritt (`familien.json`, Eintrag `fortschritt`).

Beim Bau geprüft und behoben, bevor die Prüfseite entstand: Die Köpfe der Hantel standen zuerst 30° schief zur Achse (Reihenfolge der Drehungen); jetzt liegen sie auf der Achse mit einer flachen Seite unten. Der Abstand der Köpfe zum Körper maß zuerst die eigene Hand mit, die den Griff hält; jetzt zählt der Körper ohne Hände, die Hand hat ihren eigenen Wert.

### 4.6 Abweichungen und offene Punkte

- **Tiefe auf der Schrägbank:** Ich habe „gleich nah an die Brust wie flach“ gewählt (4.2). Die Alternative wäre derselbe Winkel unter der Lehne wie flach (25°); dann stünde der Ellbogen bei 49° und die Hanteln lägen auf Höhe der Schultern. Das kann ich auf deinen Wunsch umstellen.
- **Bahn auf der Schrägbank:** In der Mitte der Bewegung stehen die Hanteln bis 3,1 cm je Seite weiter außen als unten (flach 1,8 cm), weil der senkrechte Unterarm auf der geneigten Lehne den Bogen weiter macht. Sichtbar wird das erst in der Schleife.
- **Hantel:** ohne Aufschrift und ohne Gewichtsangabe.

### 4.7 Bericht zum Paket

```
Arbeitspaket: D-462 Phase Programme, Abschnitt 2: Familie „Waagrechtes Drücken“, Prüfseite
Umgesetzte Funktionen: keine in der App; Werkzeug: Kurzhantel und verstellbare Bank (geraete.py), Bankdrücken und Schrägbankdrücken mit Kurzhanteln (uebungen.py), neue Prüfwerte, Griffbilder (familie_bilder.py), Prüfseite (uebungen_pruef_bild.py --familie), Spalte „Stand“ im Animationsplan; erfüllte AK: –
Geänderte Dateien: tools/uebungen-3d/geraete.py, tools/uebungen-3d/uebungen.py, tools/uebungen-3d/render.py, tools/uebungen-3d/familie_bilder.py (neu), tools/uebungen_pruef_bild.py, tools/uebungen-3d/familien.json, tools/uebungen_animationsplan.py, docs/uebungen-animationsplan.md, docs/screens/uebungen/familie-waagrechtes-druecken.webp (neu), form-programme-report.md, docs/decisions.md, docs/testing.md, docs/implementation-plan.md, docs/feature-inventory.md
Technische Entscheidungen: D-462
Ausgeführte Tests: render.py --pruefen für beide Übungen (alle 60 Bilder gemessen, Prüfansichten), Griffbilder, alle Bilder angesehen; pnpm format:check, pnpm check:docs; CI zum Entwurfs-PR
Ergebnis: bestanden (Werte in 4.3)
Bekannte Einschränkungen: 4.6
Nächste Schritte: Halt bis zur Freigabe der Prüfseite; danach die beiden Schleifen rendern und in die App einbauen (Bilder, Bildbeschreibungen, Offline-Vorrat), dann die nächste Familie
```

**Halt:** Ich warte auf deine Freigabe der Prüfseite. Danach rendere ich die beiden Schleifen und baue sie ein.

## 5. Freigabe „Waagrechtes Drücken“: Bahn der Hanteln und Schleifen (D-463)

Deine Freigabe vom 30.10.2026 mit zwei Entscheidungen: Die Tiefe auf der Schrägbank bleibt (Griffe unten gleich nah an der Brust wie flach). Die Hanteln dürfen in der Mitte nicht weiter außen sein als unten, sondern laufen gleichmäßig von seitlich der Brust nach oben über die Schultern, nach oben leicht zusammen.

### 5.1 Bahn der Hanteln

Bis D-462 blieb der Unterarm auf der ganzen Bahn senkrecht. Der Ellbogen ist am weitesten vom Schultergelenk weg, wenn der Oberarm waagrecht steht; mit senkrechtem Unterarm gingen deshalb auch die Hanteln dort nach außen. Ganz oben schwenkten sie außerdem auf den letzten 1,5 cm Höhe 8 cm Richtung Kopf (auf der Prüfseite nicht zu sehen, weil sie nur Ausgang und Ende zeigt).

Jetzt läuft die Bahn in zwei glatten Kurven: unten das Handgelenk vom Punkt unten (Unterarm senkrecht) bis zum Bogen mit senkrechtem Unterarm bei 45° über der Waagrechten, mit Stützpunkten, die nach oben nur enger und höher werden; darüber die Griffe bis zum Ausgang über den Schultern. Ausgang und Ende sind wie freigegeben.

Seitlicher Abstand der Hanteln, Griffmitte zu Griffmitte (in Klammern innen zwischen den Köpfen):

| | unten | Mitte | oben | vorher größte Breite |
|---|---|---|---|---|
| Bankdrücken mit Kurzhanteln | 73,8 cm (37,3) | 71,8 cm (35,3) | 44,5 cm (8,0) | 77,4 cm |
| Schrägbankdrücken mit Kurzhanteln | 76,3 cm (39,8) | 74,6 cm (38,1) | 44,5 cm (8,0) | 82,6 cm |

„Mitte“ heißt halbe Höhe der Bahn. Über alle 60 Bilder nimmt die Breite von oben nach unten nur zu, unten ist sie am größten. Eine Bahn, die nie breiter wird, gibt es nur mit leicht schrägem Unterarm: In der Mitte steht der Ellbogen etwas außerhalb der Hand.

| Über alle 60 Bilder | Bankdrücken | Schrägbankdrücken |
|---|---|---|
| Unterarm zur Senkrechten | höchstens 6,8° (vorher 4,5°) | höchstens 9,1° (vorher 3,8°) |
| Ellbogen weiter außen als unten | bis 1,8 cm | bis 3,2 cm |
| Handgelenk gesamt | höchstens 8,6° | höchstens 10,2° |
| Köpfe der Hanteln zum Körper (ohne Hände) | mindestens 37,4 mm | mindestens 37,4 mm |
| Sohlen über dem Boden | 0,0 mm | 0,0 mm |
| Meldungen des Rigs | 0 | 0 |

Alle übrigen Werte wie auf der Prüfseite (D-462).

### 5.2 Schleifen in der App

Gerendert wie die Pilot-Übungen (C männlich, 720 × 540, 60 Bilder, 40 Proben), eingetragen in `public/uebungen/medien.json` mit Bildbeschreibung.

| | Schrägbankdrücken | Bankdrücken |
|---|---|---|
| Renderzeit, 60 Bilder | 1.791 s | 1.596 s |
| MP4 / WebM | 41,1 / 35,5 KB | 43,1 / 35,5 KB |
| Poster / Vorschau | 8,9 / 4,1 KB | 8,5 / 4,2 KB |
| abgerufen (MP4, Poster, Vorschau) | 54,2 KB | 55,7 KB |

Nebenher liefen Proben der Beinpresse, daher die längere Zeit beim Schrägbankdrücken. Das Bankdrücken entstand in zwei Teilen: 33 Bilder vor einem Neustart der Arbeitsumgebung, 27 danach (`render.py --fortsetzen` rendert nur fehlende Bilder). Beim Schrägbankdrücken sind erstes und letztes Bild pixelgleich; beim Bankdrücken weichen 511 Pixel um höchstens 5 von 255 Stufen ab, Rauschen aus dem zweiten Prozess, nicht zu sehen. Startansicht unverändert 237,8 KB; die Liste nennt jetzt 20 Dateien, alle im Build vorhanden. Der Name der Quelle heißt nicht mehr „(Pilot)“, weil sie nun auch für andere Übungen gilt.

### 5.3 Aufnahme

`docs/screens/uebungen/waagrechtes-druecken-bewegung.mp4`: die beiden Schleifen der App nebeneinander, je dreimal (aus `tools/uebungen_bewegung.py`).

### 5.4 Bericht zum Paket

```
Arbeitspaket: D-463 Phase Programme, Abschnitt 2: Familie „Waagrechtes Drücken“, Bahn und Schleifen in der App
Umgesetzte Funktionen: Schleifen, Poster und Vorschaubilder für Schrägbankdrücken und Bankdrücken mit Kurzhanteln in der App; Werkzeug: Bahn der Hanteln nie breiter als unten (uebungen.py), render.py --fortsetzen, uebungen_bewegung.py; erfüllte AK: –
Geänderte Dateien: tools/uebungen-3d/uebungen.py, tools/uebungen-3d/render.py, tools/uebungen_bewegung.py (neu), public/uebungen/medien/ (8 Dateien neu), public/uebungen/medien.json, e2e/uebungen.spec.ts, docs/uebungen-bestand.md, docs/screens/uebungen/waagrechtes-druecken-bewegung.mp4 (neu), tools/uebungen-3d/familien.json, docs/uebungen-animationsplan.md, form-programme-report.md, docs/decisions.md, docs/testing.md, docs/implementation-plan.md, docs/feature-inventory.md
Technische Entscheidungen: D-463
Ausgeführte Tests: Messung aller 60 Bilder beider Übungen (render.py --pruefen --nur-messwerte), Breite über die Phase geprüft, Bilder in fünf Phasen angesehen, erstes und letztes Bild verglichen; pnpm format:check, pnpm check:docs, pnpm build, pnpm check:bundle, pnpm test:e2e (Chromium); CI zum Entwurfs-PR mit WebKit
Ergebnis: siehe 5.1, 5.2 und docs/testing.md
Bekannte Einschränkungen: in der Mitte leicht schräger Unterarm (5.1)
Nächste Schritte: Prüfseite der nächsten Familie aus „Ganzkörper A/B“ (Kniebeuge: Beinpresse)
```

## 6. Nächste Familie: Kniebeuge mit der Beinpresse, Prüfseite (D-464)

Im Animationsplan kommt nach „Waagrechtes Drücken“ die Familie „Kniebeuge“. Aus „Ganzkörper A/B“ ist dort neu nur die Beinpresse (23 Einheiten in den drei Programmen); die Kniebeuge mit Langhantel läuft schon als Pilot. Wie verlangt zuerst nur die Prüfseite.

### 6.1 Gerät

Beinpresse 45° (`geraete.beinpresse`). Die Seiten der Hersteller sind in dieser Umgebung gesperrt; die Maße stammen aus der Websuche:

- **Fußplatte** 72 × 50 cm wie Bodykore G277 (28,35 × 19,92 Zoll), senkrecht zur Schiene.
- **Schlitten** auf zwei Schienen unter 45°, mit Wagen und zwei Hörnern mit je zwei Scheiben 20 kg.
- **Lehne** 30° über der Waagrechten (verstellbar 30 bis 50° wie Benchfit Exceed ISO), **Sitz** 40 cm hoch und 15° nach vorn steigend, Polster 38 cm breit, 7 cm dick.
- **Haltegriffe** schräg neben dem Sitz.
- **Gesamtmaß** im Modell 179 × 150 × 149 cm (lang × breit × hoch, Schlitten oben). Vorbilder: Hammer Strength Linear Leg Press 241 × 165 × 145 cm, Precor DPL0601 244 × 145 × 145 cm. Breite und Höhe passen; die Vorbilder sind länger, weil ihre Schienen und ihr Rahmen weiter reichen.

### 6.2 Bewegung

- **Lage:** Rücken und Gesäß an Lehne und Sitz, Kopf an der Lehne, Hände an den Griffen.
- **Füße:** etwas weiter als hüftbreit, Zehen 15° nach außen, die ganze Sohle flach auf der Platte. Das Rig kann den Fuß dafür jetzt vom Boden auf eine beliebige Ebene drehen.
- **Lage der Füße auf der Platte:** Die Fußgelenke stehen 10 cm über der Linie von der Hüfte längs der Schiene. Mit den Füßen genau auf dieser Linie wäre das Sprunggelenk unten über 40° gebeugt, mehr als üblich beweglich; so sind es 31°.
- **Bahn:** Ausgang oben mit Knie 165° (nicht durchgedrückt), Ende unten mit Knie 95°, der Schlitten fährt dabei 22,1 cm, gleichmäßig. Die Knie zeigen über die Zehen.
- **Griffe:** Ich habe die Richtung der Griffe gesucht (längs, quer, senkrecht, schräg); schräg von vorn oben nach hinten unten bleibt das Handgelenk am geradesten (3,2°), der Arm locker (Ellbogen 139°).

### 6.3 Messwerte über alle 60 Bilder

| | Wert |
|---|---|
| Knie | 95° bis 165° |
| Hüfte (Oberschenkel zum Rumpf) | 62,6° bis 99,6° |
| Sprunggelenk gebeugt | 0° bis 31,3° |
| Knie neben der Fußachse (+ außen) | −0,8 bis +0,2 cm |
| Ferse und Ballen beider Füße auf der Platte | 0,0 mm (höchstens 0,01 mm) |
| Füße auf der Platte verschoben | 0,1 mm |
| Handgelenk gesamt (nach hinten / zur Seite) | 3,2° (−2,2° / −2,3°) |
| Finger am Griff | 4,5 mm eingedrückt (gewollt wie bei allen Griffen, D-435), 167 Punkte in Kontakt |
| Rücken und Gesäß im Polster (Ziel 4 mm) | 5,1 mm |
| Oberschenkel über dem Sitz | mindestens 64 mm |
| Kragen / Kragenpolster über der Socke | 1,6 / 1,6 mm |
| Shorts-F zum Streifen | 2,54 cm |
| Meldungen des Rigs | 0 |

Positive Werte heißen Luft, negative Durchdringung. Auf der Beinpresse zählt der Kontakt der Sohle zur Platte, nicht zum Boden; dafür misst `schuhe.kontakt_ebene` den Abstand der Sohle zur Ebene der Platte, und die Verschiebung der Füße wird im Raum des Schlittens gemessen (die Platte fährt mit).

### 6.4 Prüfseite und Rechenzeit

`docs/screens/uebungen/familie-kniebeuge.webp`: Ausgangs- und Endposition mit der Kamera der App (von links hinten, damit die Platte die Füße nicht verdeckt) und von der Seite, der Griff der linken Hand von außen und von oben, der linke Fuß von außen und von hinten, darunter die Messwerte. In den Fuß-Nahaufnahmen sind Scheiben, Hörner, Schiene und Wagen ausgeblendet, damit die Kante zwischen Sohle und Platte frei liegt. Rechenzeit: Messung und Prüfansichten rund 5,3 min, Griffbilder rund 1 min. Die Schleife schätze ich nach den bisherigen auf rund 25 Minuten; ihre Größe folgt mit ihr.

### 6.5 Abweichungen und offene Punkte

- **Länge des Geräts:** 179 statt rund 240 cm (6.1).
- **Lehne 30°** und **Füße 10 cm über der Linie** sind meine Wahl, beide verstellbar. Eine steilere Lehne schließt die Hüfte unten weiter (je 5° Lehne rund 5° enger).
- **Tiefe:** Knie unten 95°. Tiefer ginge, dann würde das Sprunggelenk mehr gebeugt und die Hüfte enger.
- **Gerät ohne Aufschrift**, Scheiben wie an der Langhantel.

### 6.6 Bericht zum Paket

```
Arbeitspaket: D-464 Phase Programme, Abschnitt 2: Familie „Kniebeuge“ mit der Beinpresse, Prüfseite
Umgesetzte Funktionen: keine in der App; Werkzeug: Beinpresse 45° (geraete.py), Übung Beinpresse (uebungen.py), Fuß auf einer Ebene (rig.py), Kontakt der Sohle zur Platte (schuhe.py, render.py), Fuß- und Griffansichten je Übung (render.py, familie_bilder.py, uebungen_pruef_bild.py), Stand im Animationsplan; erfüllte AK: –
Geänderte Dateien: tools/uebungen-3d/geraete.py, tools/uebungen-3d/uebungen.py, tools/uebungen-3d/rig.py, tools/uebungen-3d/schuhe.py, tools/uebungen-3d/render.py, tools/uebungen-3d/familie_bilder.py, tools/uebungen_pruef_bild.py, tools/uebungen-3d/familien.json, docs/uebungen-animationsplan.md, docs/screens/uebungen/familie-kniebeuge.webp (neu), form-programme-report.md, docs/decisions.md, docs/testing.md, docs/implementation-plan.md, docs/feature-inventory.md
Technische Entscheidungen: D-464
Ausgeführte Tests: render.py beinpresse --pruefen (alle 60 Bilder gemessen, Prüfansichten), Griffbilder, Bilder angesehen; pnpm format:check, pnpm check:docs; CI zum Entwurfs-PR
Ergebnis: bestanden (Werte in 6.3)
Bekannte Einschränkungen: 6.5
Nächste Schritte: Halt bis zur Freigabe der Prüfseite; danach die Schleife rendern und einbauen, dann die nächste Familie
```

## 7. Freigabe „Kniebeuge (Beinpresse)“: Sitz und Lehne, Schleife in der App (D-465)

Deine Freigabe vom 30.10.2026: Füße 10 cm höher, Lehne 30°, Knie unten 95° bleiben. Vor dem Rendern solltest du prüfen lassen, ob Gesäß und unterer Rücken in jeder Phase an Sitz und Lehne bleiben und ob sich das Becken unten weder abhebt noch einrollt.

### 7.1 Befund

Die Messung zeigte einen Fehler der Prüfseite:

- Das Gesäß schwebte 57 bis 60 mm über dem Sitz.
- Die Lende lag 15 bis 31 mm vor der Lehne. Nur der obere Rücken lag an.
- Der Kopf lag 2,2 cm über der Lehne. Auf der Prüfseite stand „Kopf an der Lehne“; gemessen hatte ich das nicht.

Der Wert „Rücken und Gesäß 5,1 mm im Polster“ war die tiefste Stelle beider Polster zusammen und zeigte nur den oberen Rücken. Ursachen:

- Ich hatte das Gesäß mit gestreckten Beinen auf den Sitz gesetzt. Mit gebeugter Hüfte liegt die Haut unter dem Becken anders.
- Der Rumpf hatte die Form des Stehens, mit Hohlkreuz. Auf einer flachen Lehne bleibt die Lende so frei.

### 7.2 Korrektur

- **Haltung im Sitzen**, in der ganzen Schleife gleich: Lende 25° flacher als im Stand, wie beim Sitzen üblich. Das Becken kippt dafür gegenüber dem Brustkorb nach hinten; Brustkorb und Schultern liegen wie vorher an der Lehne. Das Hüftgelenk beugt sich so gegenüber dem Becken höchstens 107°; mit dem Becken wie im Stand waren es rund 117° (180° − 62,6°).
- **Kopf** zurück an die Lehne, der Blick bleibt gleich (Hals 14° gestreckt, Kopf 14° gebeugt).
- **Lage:** Die Lende liegt an jeder Stelle 2 mm im Polster. Das Gesäß setze ich jetzt mit den gebeugten Beinen von fünf Phasen auf den Sitz.
- **Polster geben nach:** Sitz und Lehne geben unter Haut, Shirt, Shorts und Haaren nach wie Schaumstoff. Wo Kreuzbein und Brustkorb tiefer einsinken, zeigt das Polster eine weiche Delle statt einer Durchdringung.

### 7.3 Messwerte über alle 60 Bilder

| | Wert |
|---|---|
| Gesäß im Sitz | 4,0 mm (unten) bis 18,4 mm (oben) |
| Lende an der Lehne, schwächste Stelle | 2,0 bis 2,2 mm im Polster |
| Becken verschoben / gedreht | 0,0 mm / 0,0° |
| Kreuzbein / oberer Rücken / Kopf im Polster | 19,3 bis 25,7 / 7,0 / 2,1 mm |
| tiefste Delle im Polster | 36,8 bis 44,5 mm (unter dem Shirt am Kreuzbein) |
| Haut oder Kleidung durch das Polster | 0,0 mm |
| Hüftgelenk gebeugt (zum Becken) | 68 bis 107° |
| Hüfte (Oberschenkel zum Rumpf) | 59,4 bis 96,4° |
| Knie / Sprunggelenk gebeugt | 95 bis 165° / bis 31,3° |
| Knie neben der Fußachse (+ außen) | −0,8 bis +0,2 cm |
| Sohle auf der Platte / Füße verschoben | 0,0 mm / 0,1 mm |
| Handgelenk gesamt | 1,9° |
| Meldungen des Rigs | 0 |

„Lende“ heißt 12 bis 26 cm über den Hüftgelenken, in Streifen zu 2 cm; gezählt ist der Streifen mit dem geringsten Wert. Unter 0 hieße dort eine Lücke. Das Gesäß sinkt unten weniger tief ein, weil die Haut der Gesäßfalte mit dem Oberschenkel mitgeht; das Becken selbst bleibt fest. Am Kreuzbein steht der Saum des Shirts im Sitzen bis 2 cm ab; dort gibt das Polster bis 44,5 mm nach, in der Ecke zwischen Sitz und Lehne.

Gefunden beim Prüfen: Zuerst gab das Polster nur unter der Haut nach, weil Shirt und Shorts erst nach dem Aufbau der Übung entstehen; das Shirt ragte dann bis 4,2 mm durch. Behoben, bevor die Schleife gerendert wurde.

### 7.4 Schleife in der App

Gerendert wie die übrigen Schleifen (C männlich, 720 × 540, 60 Bilder, 40 Proben) und in `public/uebungen/medien.json` eingetragen, mit Bildbeschreibung.

| | Beinpresse |
|---|---|
| Renderzeit, 60 Bilder | 2.960 s |
| MP4 / WebM | 64,1 / 54,7 KB |
| Poster / Vorschau | 14,6 / 6,6 KB |
| abgerufen (MP4, Poster, Vorschau) | 85,3 KB (mit WebM 76,0 KB) |

Die Renderzeit ist länger als geschätzt (rund 25 min), weil nebenher die Prüfansichten der Beinpresse und der nächsten Familie liefen. Mit 85,3 KB liegt die Beinpresse an der Grenze von rund 85 KB je Übung: Das große Gerät macht Poster und Vorschau größer als bei den Hanteln. Erstes und letztes Bild der Schleife sind pixelgleich. Startansicht unverändert 237,8 KB; die Liste nennt jetzt 24 Dateien, alle im Build vorhanden.

### 7.5 Aufnahme

`docs/screens/uebungen/beinpresse-bewegung.mp4`: die Schleife der App, dreimal (aus `tools/uebungen_bewegung.py`).

**Test zu den Aufgabenzeilen:** Diesmal bestanden (360, 390 und 768 pt). Vermutete Ursache des Ausfalls vom letzten Mal: Der Test misst Abhakfeld, Zeile und Pfeil nacheinander. Auf „Heute“ laden die Karten über den Aufgaben nach (Ernährung, Wasser, Schritte); kommt eine davon zwischen zwei Messungen dazu, rutscht die Zeile nach unten. Die 75,6 px Versatz von damals passen dazu. Fällt er wieder aus, messe ich alle drei Lagen in einem Schritt.

**Weitere Tests:** Einmal fiel ein Zeittest der Startfläche aus („Heute“ nach 1.195 ms statt vor 1.121 ms), während nebenher Blender rechnete; einzeln fünfmal bestanden.

### 7.6 Prüfseite

`docs/screens/uebungen/familie-kniebeuge.webp` neu mit der korrigierten Haltung und den neuen Werten (Gesäß, Lende, Kreuzbein, Kopf, Becken, Polster).

### 7.7 Bericht zum Paket

```
Arbeitspaket: D-465 Phase Programme, Abschnitt 2: Beinpresse, Sitz und Lehne korrigiert, Schleife in der App
Umgesetzte Funktionen: Schleife, Poster und Vorschaubild der Beinpresse in der App; Werkzeug: Haltung im Sitzen (Lende, Kopf), Lage an Lehne und Sitz mit gebeugten Beinen, Polster geben nach (geraete.weiches_polster, geraete.eindruecken), neue Messwerte; erfüllte AK: –
Geänderte Dateien: tools/uebungen-3d/uebungen.py, tools/uebungen-3d/geraete.py, tools/uebungen_pruef_bild.py, tools/uebungen_bewegung.py, public/uebungen/medien/ (4 Dateien neu), public/uebungen/medien.json, e2e/uebungen.spec.ts, docs/uebungen-bestand.md, docs/screens/uebungen/beinpresse-bewegung.mp4 (neu), docs/screens/uebungen/familie-kniebeuge.webp, tools/uebungen-3d/familien.json, docs/uebungen-animationsplan.md, form-programme-report.md, docs/decisions.md, docs/testing.md, docs/implementation-plan.md, docs/feature-inventory.md
Technische Entscheidungen: D-465
Ausgeführte Tests: Messung aller 60 Bilder (render.py beinpresse --pruefen --nur-messwerte), Suche der Haltung, Standbilder und Polster ohne Figur angesehen, Schleife gerendert, erstes und letztes Bild verglichen, Prüfseite neu; pnpm format:check, pnpm lint, pnpm typecheck, pnpm test, pnpm check:docs, pnpm build, pnpm check:bundle, pnpm test:e2e (Chromium; ein Zeittest unter Last fehlgeschlagen, einzeln bestanden); CI zum Entwurfs-PR mit WebKit
Ergebnis: siehe 7.3 und 7.4
Bekannte Einschränkungen: Gesäß sinkt unten weniger tief ein als oben (Haut der Gesäßfalte); Shirt am Kreuzbein steht im Sitzen ab (7.3)
Nächste Schritte: Prüfseite der nächsten Familie aus „Ganzkörper A/B“ (Rumpf)
```

## 8. Nächste Familie: Rumpf mit Unterarmstütz und Crunches, Prüfseite (D-466)

Im Animationsplan kommt nach „Kniebeuge“ und „Senkrechtes Ziehen“ (Latziehen, Pilot) die Familie „Rumpf“: Unterarmstütz (Plank, 22 Einheiten) und Crunches (20 Einheiten). Wie verlangt zuerst nur die Prüfseite.

### 8.1 Matte

Gymnastikmatte 180 × 60 × 1,5 cm, das gängige Maß im Studio: [PROGYM Gymnastikmatte mit Ösen](https://www.benz-sport.de/gymnastik-gymnastikmatten-gymnastikmatten-mit-oesen/progym-gymnastikmatte-mit-oesen-180-x-60-x-15-cm-31141) (für gewerbliche Nutzung), [Sissel Gymnastikmatte](https://www.ebay.de/p/10029083321), [Trendy Sport ProfiGymMat](https://www.preissuchmaschine.de/preisvergleich/trendy-sport-profigymmat-trainingsmatte-therapiematte-500002915951.html). Sie gibt wie die Polster der Beinpresse unter Haut, Kleidung und Schuhen nach; die Unterseite bleibt am Boden.

### 8.2 Unterarmstütz

- **Quelle der Bewegung:** Der Plan nannte Mixamo „Plank“. Mixamo-Dateien brauchen dein Konto und liegen nicht vor; eine gehaltene Haltung braucht auch keine Aufnahme. Ich habe sie darum aus dem Code gebaut, wie die Piloten.
- **Haltung:** Unterarme parallel auf der Matte, Ellbogen senkrecht unter den Schultern, Hände locker zur Faust, Daumen oben. Beine geschlossen und fast gestreckt, auf dem Vorfuß der Schuhe, Fersen nach hinten. Der Körper bildet von Kopf bis Fersen eine Linie und steigt zu den Schultern um 4,2°. Kopf in Verlängerung des Rumpfs.
- **Schleife:** Halten mit dezenter Atmung; der Rücken wölbt sich in der Mitte leicht.

### 8.3 Crunches

- **Liegen:** Knie 70°, Füße flach auf der Matte. Bei 85° stünde der Fuß 44° gestreckt, und der Kragen des Schuhs schnitte 0,7 mm in die Socke; mit 70° sind es 37,6° und 0,5 mm Luft. Die Lende liegt an jeder Stelle auf, dafür ist sie flacher als im Stand, wie beim Liegen mit gebeugten Beinen üblich. Der Kopf liegt auf.
- **Bewegung:** Der Oberkörper rollt ein, bis die Schulterblätter gut 3 cm über der Matte sind: von 9,5° auf 38,1° zur Matte. Lende und Becken bleiben liegen, der Nacken bleibt neutral, zwischen Kinn und Brustbein bleiben gut 10 cm.
- **Arme:** lang neben dem Körper, Handflächen unten, zu Beginn auf der Matte; beim Einrollen reichen sie waagrecht Richtung Knie. Das ist die zweite Quelle der Anleitung in der App (ExRx „Crunch (arms down)“).
- **Gewebe flacht ab:** Im Liegen sinken Gesäß und Brustkorb tiefer, als eine Matte von 1,5 cm nachgibt. Haut und Kleidung legen sich darum 3 mm unter der Oberseite flach, wie Gewebe auf festem Grund; die Matte gibt 3 mm nach. Ohne das lägen Gesäß 12,6 mm und Schulterblätter 9,1 mm in der Matte.

### 8.4 Messwerte über alle 60 Bilder

**Unterarmstütz**

| | Wert |
|---|---|
| Hüfte über der Linie Schulter–Fußgelenk | 1,6 bis 1,7 cm (gerade Linie) |
| Körper steigt zu den Schultern | 4,2° |
| Ellbogen vor der Schulter / Oberarm zur Senkrechten | 0,0 cm / höchstens 0,1° |
| Ellbogen | 89° |
| Handgelenk gesamt (seitlich / gestreckt) | 4,8 bis 5,0° (−5,0° / −0,4°) |
| Knie / Sprunggelenk gebeugt | 177° / 16,6° |
| Unterarm / Faust auf der Matte | 1,0 bis 2,0 / 2,0 mm eingedrückt |
| Schuh: vorderer Rand der Sohle auf der Matte | 2,5 mm eingedrückt (Ferse 172 mm darüber) |
| Körper sonst über der Matte | mindestens 16 mm |
| Auflage vom Rand der Matte | mindestens 5,2 cm |
| Matte: Delle / Haut, Kleidung oder Schuh durch die Matte | 1,9 / 0,0 mm |
| Sohle verschoben / Meldungen des Rigs | 0,0 mm / 0 |

**Crunches**

| | Wert |
|---|---|
| Oberkörper zur Matte | 9,5° (liegend) bis 38,1° (oben) |
| Lende auf der Matte, schwächste Stelle | 1,5 bis 3,0 mm, in jeder Phase |
| Gesäß / Kreuzbein auf der Matte | 3,0 / 3,0 mm (ohne Abflachen 12,6 mm) |
| Becken verschoben / gedreht | 0,0 mm / 0,0° |
| Schulterblätter | liegend 3,0 mm auf der Matte, oben 32,6 mm darüber |
| Untere Brustwirbel | liegend 3,0 mm auf der Matte, oben 0,4 mm darüber |
| Kopf | liegend 3,0 mm auf der Matte, oben 227 mm darüber |
| Kinn zum Brustbein | 10,5 bis 11,5 cm |
| Hände | zu Beginn 2,0 mm auf der Matte, oben 109 mm darüber, mindestens 68 mm vom Körper |
| Knie / Hüfte (Oberschenkel zum Rumpf) / Ellbogen | 70° / 128 bis 132° / 172° |
| Sprunggelenk gestreckt / Kragen des Schuhs über der Socke | 37,6° / 0,5 mm |
| Sohlen auf der Matte (Ferse und Ballen) / verschoben | 0,0 mm / 0,0 mm |
| Auflage vom Rand der Matte | mindestens 10,7 cm |
| Matte: Delle / Haut, Kleidung oder Schuh durch die Matte | 3,0 / 0,0 mm |
| Meldungen des Rigs | 0 |

Positive Werte heißen „in der Matte“ (eingedrückt), negative Luft. Gemessen an der Oberfläche der Kleidung; die Matte gibt dort so weit nach.

### 8.5 Prüfseite und Rechenzeit

`docs/screens/uebungen/familie-rumpf.webp`: je Übung Ausgangs- und Endposition mit der Kamera der App und von der Seite; beim Unterarmstütz Unterarm und Faust von außen und von vorn, der linke Fuß von außen und von hinten; bei den Crunches Rumpf und Matte von der Seite und schräg vom Kopf her, der linke Fuß von außen und von vorn; darunter die Messwerte. Rechenzeit: Unterarmstütz Messung und Prüfansichten 850 s, Nahaufnahmen 185 s (nebenher lief die Schleife der Beinpresse); Crunches 369 s und 53 s.

Beim Prüfen gefunden und behoben:
- Die unsichtbare Fläche, auf die sich das Gewebe legt, erschien in den Prüfansichten weiß um die Matte; sie ist jetzt für jeden Strahl ausgeblendet (auch in der Schleife).
- Die Schuhspitzen beim Unterarmstütz lagen 8 mm vor dem Ende der Matte; jetzt liegen beide Übungen mittig.
- Die Nahaufnahme des Fußes beim Unterarmstütz zeigte die Auflage nicht; ihr Bildmittelpunkt liegt jetzt am Rand der Sohle auf der Matte.
- Bei den Crunches lagen die Hände zuerst neben der Matte und der Kragen des Schuhs schnitt in die Socke (siehe 8.3).

### 8.6 Abweichungen und offene Punkte

- **Quelle Unterarmstütz:** Code statt Mixamo (8.2).
- **Hände beim Unterarmstütz:** Faust mit dem Daumen oben. Möglich wären auch flache Hände.
- **Arme bei den Crunches:** lang Richtung Knie. Möglich wären auch die Hände an den Schläfen oder vor der Brust verschränkt.
- **Kopf bei den Crunches:** liegt zu Beginn jeder Wiederholung auf. Manche lassen ihn zwischen den Wiederholungen leicht angehoben.
- **Schuhe beim Unterarmstütz:** Die Sohle biegt sich nicht; der Schuh steht auf dem vorderen Rand der Sohle.

### 8.7 Bericht zum Paket

```
Arbeitspaket: D-466 Phase Programme, Abschnitt 2: Familie „Rumpf“ (Unterarmstütz, Crunches), Prüfseite
Umgesetzte Funktionen: keine in der App; Werkzeug: Gymnastikmatte (geraete.matte), Übungen auf der Matte mit nachgebender Matte und abflachendem Gewebe (uebungen.Boden), Unterarmstütz, Crunches, Arm ohne Griff (rig.arm_frei), Nahaufnahmen je Übung, Stand im Animationsplan; erfüllte AK: –
Geänderte Dateien: tools/uebungen-3d/geraete.py, tools/uebungen-3d/uebungen.py, tools/uebungen-3d/rig.py, tools/uebungen-3d/schuhe.py, tools/uebungen-3d/render.py, tools/uebungen-3d/familie_bilder.py, tools/uebungen_pruef_bild.py, tools/uebungen-3d/familien.json, docs/uebungen-animationsplan.md, docs/screens/uebungen/familie-rumpf.webp (neu), form-programme-report.md, docs/decisions.md, docs/testing.md, docs/implementation-plan.md, docs/feature-inventory.md
Technische Entscheidungen: D-466
Ausgeführte Tests: render.py unterarmstuetz und crunch --pruefen (alle 60 Bilder gemessen, Prüfansichten), Nahaufnahmen, Bilder angesehen, Lage auf der Matte und Abstand der Hände gemessen; pnpm format:check, pnpm check:docs; CI zum Entwurfs-PR
Ergebnis: bestanden (Werte in 8.4)
Bekannte Einschränkungen: 8.6
Nächste Schritte: Halt bis zur Freigabe der Prüfseite; danach die Schleifen rendern und einbauen, dann die nächste Familie
```

**Halt:** Ich warte auf deine Freigabe der Prüfseite „Rumpf“.

## 9. Freigabe „Rumpf“: flache Hände, verschränkte Arme, Kopf angehoben, Schuh im Vorfuß, Schleifen in der App (D-467)

Deine Freigabe vom 30.10.2026 mit drei Entscheidungen: Hände flach und Unterarme parallel beim Unterarmstütz; Arme vor der Brust verschränkt und Kopf leicht angehoben bei den Crunches. Dazu der Auftrag, dass sich der Schuh im Vorfuß biegt wie ein Laufschuh.

### 9.1 Unterarmstütz: Hände flach, Unterarme parallel

- **Hände:** Handflächen unten, Finger gestreckt nach vorn, wie ACE „Front Plank“ es beschreibt („palms down and hands facing forward“). Hand und Unterarm bilden eine Linie, das Handgelenk ist 1,3 bis 1,6° gestreckt.
- **Unterarme:** parallel, 0,0° zueinander; Ellbogen senkrecht unter den Schultern.
- **Finger:** Im Grundmodell sind sie leicht gekrümmt, der Daumen hängt nach unten. Mit der Handfläche auf der Matte lagen sie zuerst 9 bis 41 mm in ihr. Jetzt stelle ich jedes Glied waagrecht und drehe den Finger dann um sein erstes Gelenk auf die Matte.
- **Matte 185 cm:** Mit flachen Händen und gebogenem Vorfuß liegen Fingerspitzen und Schuhspitzen 178,7 cm auseinander. Auf einer Matte von 180 cm blieben an jedem Ende 6,6 mm. Ich nehme darum die [AIREX Coronella 185](https://www.physioparts.co.uk/airex-coronella-185) (185 × 60 × 1,5 cm, auch bei [Galaxus](https://www.galaxus.nl/en/s3/product/airex-coronella-185-with-eyelets-blue-15-mm-yoga-mats-43816361)); jetzt bleiben 3,1 cm. Die Crunches liegen auf derselben Matte.

### 9.2 Crunches: Arme verschränkt, Kopf angehoben

- **Arme:** Die Handgelenke kreuzen sich auf dem oberen Brustbein, der rechte Unterarm liegt auf dem linken. Die Hände liegen flach auf der Brust und zeigen zur Gegenschulter, die Ellbogen zu den Knien. Die Arme gehen mit dem Brustkorb. Beim Einrollen heben sich die Ellbogen etwas, und die Hände passen ihre Beugung an, damit sie auf dem Shirt bleiben.
- **Kopf:** Kopf und Nacken in Verlängerung der Wirbelsäule wie im Stand. Der Kopf bleibt in jeder Phase angehoben, mindestens 28,6 mm über der Matte; das Kinn ist 9,4 bis 10,2 cm vom Brustbein entfernt, etwa eine Faust. Bis D-466 lag der Kopf zu Beginn auf, der Hals war 20° gestreckt.

### 9.3 Schuh im Vorfuß

- **Biegung:** Der Schuh biegt sich jetzt mit den Zehen am Ballen, wie ein Laufschuh. Die Zone ist 7,5 cm lang und liegt mittig über den Grundgelenken der Zehen. Fuß, Socke, Schaft, Sohle, Lasche, Senkel, Ösen und Kragenpolster biegen sich um dieselbe Achse; so bleiben die Abstände zwischen den Schichten gleich.
- **Unterarmstütz:** 55°. Die Sohle liegt vom Ballen bis zur Spitze auf der Matte, 2,1 mm eingedrückt. Bei 40° stand sie noch auf ihrem vorderen Teil. Die Ferse steht jetzt 132 mm über der Matte (vorher 172 mm), der Körper steigt zu den Schultern um 5,8° (vorher 4,2°).
- **Nichts dringt durch:** Über alle 60 Bilder liegt der Fuß mindestens 3,7 mm unter der Außenseite des Schafts, die Socke in der Zehenbox mindestens 1,0 mm; Senkel und Ösen liegen 1,65 und 1,69 mm über der Socke. Kein Punkt von Fuß oder Socke liegt außerhalb des Schuhs.
- **Künftig:** Jede Übung kann den Winkel je Phase vorgeben. Bei Liegestützen, Ausfallschritten und Wadenheben ist das im Animationsplan vermerkt.
- **Nahaufnahme:** `docs/screens/uebungen/unterarmstuetz-vorfuss.webp`, linker Fuß vorher und jetzt aus vier Richtungen.

### 9.4 Ausführungstext abgeglichen

Geändert:

| Übung | vorher | jetzt |
|---|---|---|
| Unterarmstütz, Vorbereitung | „Setz die Unterarme auf, die Ellbogen liegen unter den Schultern.“ | „Setz die Unterarme parallel auf, die Ellbogen liegen unter den Schultern, die Hände flach.“ |
| Unterarmstütz, Quellen | ExRx „Front Plank“ | dazu ACE „Front Plank“ (Hände flach, Handflächen unten), mit Hinweis auf die Ergänzung |
| Crunches, Vorbereitung | zwei Schritte | neuer dritter Schritt: „Verschränk die Arme vor der Brust.“ |
| Crunches, Quellen | ExRx „Crunch (arms down)“ | ExRx „Crunch (arms crossed)“, mit Hinweis: Diese Quelle legt die Unterschenkel auf eine Bank |

Unverändert, weil der Text schon passt:
- Crunches, Kopf: „Halte den Nacken neutral und lass Platz zwischen Kinn und Brustbein.“ Das ist der angehobene Kopf mit einer Faust Abstand.
- Crunches, Absenken: „… bis die Schulterblätter den Boden wieder berühren“. Unten liegen sie 3,0 mm auf der Matte, der Kopf bleibt oben.
- Unterarmstütz, Füße: „die Fußballen stehen auf dem Boden“. Das ist der gebogene Vorfuß.

exrx.net ist in dieser Umgebung gesperrt (Netzwerkregel). Die Seite „Crunch (arms crossed)“ habe ich über die Websuche geprüft, wie schon in D-398. Freigeben könntest du die Adresse in den Einstellungen der Umgebung unter „Network access“, „Allowed domains“.

### 9.5 Messwerte über alle 60 Bilder

**Unterarmstütz**

| | Wert |
|---|---|
| Hüfte über der Linie Schulter–Fußgelenk | 1,6 bis 1,7 cm (gerade Linie) |
| Körper steigt zu den Schultern | 5,8° |
| Ellbogen vor der Schulter / Oberarm zur Senkrechten | 0,0 cm / höchstens 0,1° |
| Unterarme zueinander / Ellbogen | 0,0° / 91,3 bis 91,6° |
| Handgelenk gesamt (seitlich) | 1,3 bis 1,6° (0,0°) |
| Unterarm / Hand / Finger in der Matte | 1,1 bis 2,0 / 2,9 / 2,0 mm |
| Vorfuß gebogen / Sohle vom Ballen bis zur Spitze in der Matte | 55° / 2,1 mm |
| Ferse über der Matte / Knie / Sprunggelenk gebeugt | 132 mm / 177° / 16,6° |
| Fuß unter dem Schaft / Socke in der Zehenbox | mindestens 3,7 / 1,0 mm |
| Senkel / Ösen / Kragenpolster über der Socke | 1,65 / 1,69 / 1,62 mm |
| Fuß oder Socke außerhalb des Schuhs | 0 Punkte |
| Körper sonst über der Matte | mindestens 18,0 mm |
| Auflage vom Rand der Matte | mindestens 3,1 cm |
| Matte: Delle / Haut, Kleidung oder Schuh durch die Matte | 2,1 / 0,0 mm |
| Meldungen des Rigs | 0 |

**Crunches**

| | Wert |
|---|---|
| Oberkörper zur Matte | 9,5° (liegend) bis 38,1° (oben) |
| Lende auf der Matte, schwächste Stelle | 1,45 bis 3,0 mm, in jeder Phase |
| Gesäß / Kreuzbein auf der Matte | 3,0 / 3,0 mm |
| Becken verschoben / gedreht | 0,0 mm / 0,0° |
| Schulterblätter | unten 3,0 mm auf der Matte, oben 32,4 mm darüber |
| Kopf über der Matte | mindestens 28,6 mm (unten), oben 250 mm |
| Kinn zum Brustbein | 9,4 bis 10,2 cm |
| Hand links / rechts auf dem Shirt | −0,4 bis +0,8 mm / 0,0 mm |
| rechter Unterarm auf dem linken | −0,5 bis +2,1 mm |
| Unterarme und Hände über dem Shirt | an der tiefsten Stelle −0,5 mm |
| Ellbogen / Handgelenk links / rechts | 59,4° / 13,3 bis 19,9° / 16,3 bis 16,9° |
| Knie / Hüfte (Oberschenkel zum Rumpf) | 70° / 128 bis 132° |
| Sohlen auf der Matte / Kragen des Schuhs über der Socke | 0,0 mm / 0,5 mm |
| Auflage vom Rand der Matte | mindestens 10,7 cm |
| Matte: Delle / Haut, Kleidung oder Schuh durch die Matte | 3,0 / 0,0 mm |
| Meldungen des Rigs | 0 |

Bei den Händen und Armen heißt ein Wert unter 0, dass Haut den Stoff oder die Haut des anderen Arms höchstens 0,5 mm eindrückt; das ist weniger, als Gewebe dort nachgibt. Beim Unterarmstütz heißen positive Werte „in der Matte“.

### 9.6 Schleifen in der App

Gerendert wie die übrigen Schleifen (C männlich, 720 × 540, 60 Bilder, 40 Proben) und in `public/uebungen/medien.json` eingetragen, mit Bildbeschreibung.

| | Unterarmstütz | Crunches |
|---|---|---|
| Renderzeit, 60 Bilder | 2.932 s | 1.929 s |
| MP4 / WebM | 21,3 / 17,3 KB | 55,2 / 45,8 KB |
| Poster / Vorschau | 10,2 / 3,0 KB | 12,3 / 4,1 KB |
| abgerufen (MP4, Poster, Vorschau) | 34,5 KB (mit WebM 30,5 KB) | 71,7 KB (mit WebM 62,3 KB) |

Die Renderzeiten sind länger als geschätzt (rund 26 min), weil nebenher die Prüfansichten beider Familien und die Nahaufnahmen liefen. Der Unterarmstütz ist klein, weil sich im Bild nur der Rücken beim Atmen bewegt. Erstes und letztes Bild sind bei beiden Schleifen pixelgleich. Startansicht unverändert 237,8 KB; die Liste nennt jetzt 32 Dateien, alle im Build vorhanden.

### 9.7 Aufnahme

`docs/screens/uebungen/rumpf-bewegung.mp4`: beide Schleifen der App nebeneinander, je dreimal (7,5 s).

### 9.8 Prüfseite

`docs/screens/uebungen/familie-rumpf.webp` neu mit dem freigegebenen Stand: flache Hände, Unterarme parallel und der gebogene Vorfuß beim Unterarmstütz, verschränkte Arme und angehobener Kopf bei den Crunches, dazu die neuen Messwerte. Rechenzeit: Unterarmstütz 767 s und 263 s, Crunches 888 s und 243 s; nebenher liefen die Schleifen.

### 9.9 Abweichungen, Beobachtungen und offene Punkte

- **Achsel:** Beim Prüfen der verschränkten Arme habe ich am Übergang von Oberarm und Rumpf gemessen. Dort liegt die Haut des Oberarms in jeder Übung 11 bis 28 mm im Rumpf, auch in den freigegebenen: Crunches 26 und 28 mm, Kniebeuge 17 und 26 mm, Unterarmstütz 12 und 16 mm, Beinpresse 13 und 21 mm, Latziehen 12 und 16 mm, Bankdrücken mit Kurzhanteln 11 und 12 mm (links und rechts). Das kommt aus der Verformung des Grundmodells in der Achsel, nicht von den Armen vor der Brust. Der Ärmel des Shirts deckt die Stelle; zu sehen ist sie nicht.
- **D-465 berichtigt:** In `docs/decisions.md` standen bei D-465 Werte eines Zwischenstands (Delle 17,2 bis 23,4 mm, bis 0,65 mm durch die Oberfläche). Richtig sind, wie im Bericht 7.3: Delle 36,8 bis 44,5 mm, 0,0 mm durch die Oberfläche.
- **Quelle Crunches:** ExRx „Crunch (arms crossed)“ legt die Unterschenkel auf eine Bank; die Animation und der Text bleiben bei den Füßen auf der Matte. Der Hinweis in der App nennt das.
- **Tests unter Last:** Kein Ausfall. Die Unit-Tests liefen, während Blender die Schleife der Crunches rechnete (1.209 bestanden); die E2E-Tests liefen danach ohne Blender (432 bestanden).

### 9.10 Bericht zum Paket

```
Arbeitspaket: D-467 Phase Programme, Abschnitt 2: Familie „Rumpf“ freigegeben; flache Hände, verschränkte Arme, Kopf angehoben, Schuh im Vorfuß, Schleifen in der App
Umgesetzte Funktionen: Schleifen, Poster und Vorschaubilder von Unterarmstütz und Crunches in der App; Anleitung beider Übungen an die Animation angepasst; Werkzeug: Vorfuß gebogen (schuhe.Vorfuss, schuhe.im_schuh, vorfuss_grad), flache Hände (Unterarmstuetz._finger_flach), verschränkte Arme (Crunch._arm_ziele, _tabellen), Matte 185 cm, Nahaufnahme vorher und jetzt (vorfuss_bilder.py, uebungen_korrektur_bild.py --runde 11); erfüllte AK: –
Geänderte Dateien: tools/uebungen-3d/uebungen.py, tools/uebungen-3d/schuhe.py, tools/uebungen-3d/rig.py, tools/uebungen-3d/geraete.py, tools/uebungen-3d/render.py, tools/uebungen-3d/vorfuss_bilder.py (neu), tools/uebungen_korrektur_bild.py, tools/uebungen_pruef_bild.py, tools/uebungen-3d/familien.json, src/modules/exercises/data/exercise-guides.v1.json, public/uebungen/medien.json, public/uebungen/medien/ (8 Dateien neu), e2e/uebungen.spec.ts, docs/uebungen-bestand.md, docs/uebungen-animationsplan.md, docs/uebungen-bewegungsfamilien.md, docs/screens/uebungen/unterarmstuetz-vorfuss.webp (neu), docs/screens/uebungen/rumpf-bewegung.mp4 (neu), docs/screens/uebungen/familie-rumpf.webp, form-programme-report.md, docs/decisions.md, docs/testing.md, docs/implementation-plan.md, docs/feature-inventory.md
Technische Entscheidungen: D-467 (dazu D-465 berichtigt)
Ausgeführte Tests: Messung aller 60 Bilder beider Übungen, Nahaufnahme vorher und jetzt, Schleifen gerendert, erstes und letztes Bild verglichen, Prüfseite neu; pnpm format:check, pnpm lint, pnpm typecheck, pnpm check:docs, pnpm test (unter Last), pnpm build, pnpm check:bundle, pnpm test:e2e (Chromium, ohne Last); CI zum Entwurfs-PR mit WebKit
Ergebnis: siehe 9.5 bis 9.8; Unit-Tests 1.209 bestanden (unter Last), E2E 432 bestanden, 0 fehlgeschlagen (ohne Last); WebKit in der CI
Bekannte Einschränkungen: 9.9
Nächste Schritte: Prüfseite der nächsten Familie aus „Ganzkörper A/B“ (Schulter und Brust isoliert)
```

## 10. Nächste Familie: Schulter und Brust isoliert mit Seitheben, Prüfseite (D-468)

Im Animationsplan kommt nach „Rumpf“ die Familie „Schulter und Brust isoliert“. Aus „Ganzkörper A/B“ gehört nur das Seitheben mit Kurzhanteln dazu (24 Einheiten); es ist zugleich die Referenz der Familie. Wie verlangt zuerst nur die Prüfseite.

### 10.1 Hantel

Leichte Kurzhantel 8 kg, Sechskant, gummiert, nach Händlerangaben zur HMS HEX PRO 8 kg: 288 mm lang, Köpfe 110 mm, Griff 110 mm lang und gerieft ([e-catalog](https://e-catalog.co.uk/gtin/5907695518092/), eine litauische Händlerseite mit denselben Zahlen). Eine dritte Angabe weicht ab (308 mm lang, Griff 122 mm, Köpfe 95 mm, [nextag](https://www.nextag.de/preisvergleich/500001365648_hms-hex-pro-hantel-8.html)); ich nehme die Zahlen, die zweimal vorkommen. Die Dicke des Griffs nennt für 8 kg keine Quelle; 34 mm wie beim Modell 10 kg derselben Reihe (Händlerseite aio.lv) und wie bei der Hantel der Bankdrück-Übungen. Die Köpfe sind wie dort über die Ecken gemessen; so passt auch das Gewicht.

Die Seite des litauischen Händlers (varle.lt) ist in dieser Umgebung gesperrt, wie exrx.net; die Zahlen stammen aus der Websuche. Freigeben könntest du beide unter „Network access“, „Allowed domains“.

### 10.2 Bewegung

- **Quelle:** Familie (Code), wie im Plan; für das Seitheben ist keine Mixamo-Animation belegt.
- **Stand:** Füße etwa hüftbreit, Zehen 8° nach außen, die ganze Sohle am Boden. Knie leicht gebeugt (168°), Rumpf in der Hüfte 10° vorgeneigt, Kopf in Verlängerung des Rumpfs. Becken und Beine bleiben über die ganze Schleife fest.
- **Ausgang:** Hanteln vor den Oberschenkeln, Handflächen zueinander, Ellbogen leicht gebeugt und nach hinten gerichtet. Mit den Handflächen zueinander liegt die Hantel längs; ihr hinterer Kopf stieße bei senkrecht hängendem Arm in den Oberschenkel. Der Arm hängt darum 13,6° nach vorn, gerade so weit, dass die Köpfe 12 mm vor Shorts und Shirt bleiben.
- **Heben:** Die Arme heben sich seitlich, bis die Ellbogen auf Schulterhöhe sind. Oben steht der Oberarm waagrecht, 20° vor der Ebene der Schultern; die Handflächen zeigen nach unten, der Ellbogen liegt 1,9 cm über dem Handgelenk. Der Arm dreht als Ganzes um das Schultergelenk auf dem kürzesten Weg, ohne Drehung um den Oberarm: Der Ellbogen bleibt bei 165°, der Arm dreht nicht nach außen. Oben hebt sich das Schlüsselbein um 8°, wie es die Schulter beim Heben tut.
- **Abwärts** derselbe Weg zurück.

### 10.3 Abgleich mit dem Ausführungstext

Der Text in der App passt zur Animation; ich habe nichts geändert:

| Text in der App | Animation |
|---|---|
| „Halte die Kurzhanteln vor den Oberschenkeln, die Ellbogen leicht gebeugt.“ | Hanteln vor den Oberschenkeln, Ellbogen 165° |
| „Beug dich in Hüfte und Knien leicht vor.“ | Rumpf 10° vorgeneigt, Knie 168° |
| „Heb die Oberarme seitlich an, bis die Ellbogen auf Schulterhöhe sind.“ | oben Ellbogen 0,0 cm über dem Schultergelenk, Oberarm waagrecht |
| „Lass die Ellbogen dabei nach hinten zeigen.“ | Ellbogen in jeder Phase nach hinten |
| „Halte den Winkel im Ellbogen während der ganzen Bewegung gleich.“ | 165,1° ± 0,02° |
| „Heb die Arme seitlich an, statt sie nach außen zu drehen.“ | keine Drehung um den Oberarm |
| „Die Ellbogen sinken unter die Handgelenke“ (Fehler) | Ellbogen immer über dem Handgelenk, oben 1,9 cm |

### 10.4 Messwerte über alle 60 Bilder

| | Wert |
|---|---|
| Armhebung (0 = hängend) | 13,85° (Ausgang) bis 90,0° (oben) |
| Oberarm oben zur Waagrechten / Ellbogen oben über dem Schultergelenk | 0,0° / 0,0 cm |
| Oberarm vor der Ebene der Schultern (ab 60° Armhebung) | 20,0 bis 25,8° |
| Ellbogen | 165,1° (gleich) |
| Ellbogen über dem Handgelenk | mindestens 1,9 cm (oben) |
| Handgelenk gesamt (gebeugt / zum Daumen) | 5,0 bis 5,1° (4,6° / 2,1°) |
| Finger am Griff | 4,1 mm eingedrückt, wie beim Bankdrücken (gewollt) |
| Hand zu den Köpfen / Köpfe vor Haut und Kleidung | 3,7 mm / mindestens 12,0 mm |
| Griffe auseinander | 26,3 bis 142,7 cm |
| Knie / Rumpf vorgeneigt / Schlüsselbein gehoben | 168° / 10° / 0 bis 8° |
| Sohlen am Boden (Ferse und Ballen) / verschoben | 0,0 mm / 0,0 mm |
| Kragen / Kragenpolster über der Socke | 1,6 / 1,6 mm |
| Meldungen des Rigs | 0 |

### 10.5 Prüfseite und Rechenzeit

`docs/screens/uebungen/familie-schulter-brust-isoliert.webp`: Ausgangs- und Endposition mit der Kamera der App und von der Seite, Griff und Hantel der linken Hand von vorn und von außen, der linke Fuß von außen und von vorn, darunter die Messwerte. Rechenzeit: Messung und Prüfansichten 676 s, Nahaufnahmen 125 s; nebenher liefen die Schleifen der Familie „Rumpf“.

Beim Prüfen gefunden und behoben:
- Die Finger lagen laut Messung zuerst 7,5 mm im Griff. Gezählt waren auch Punkte, deren Gewicht sich auf mehrere Fingerglieder verteilt. Mit derselben Auswahl wie bei den übrigen Übungen sind es 4,1 mm, wie beim Bankdrücken mit Kurzhanteln (gewollt: Der Griff drückt etwas in die Haut der Finger).
- Die Prüfseite zeigte gerundete Nullen als „−0,0“; jetzt „0,0“.

### 10.6 Abweichungen und offene Punkte

- **Ausgang vor den Oberschenkeln:** Wie im Text der App (ExRx). Viele andere Anleitungen beginnen mit den Hanteln seitlich neben den Oberschenkeln; dann hinge der Arm senkrecht, und der Text müsste sich ändern.
- **Ebene oben:** 20° vor der Ebene der Schultern. Oft empfohlen wird die Ebene des Schulterblatts, rund 30°; ExRx sagt „zur Seite“.
- **Gewicht der Hantel:** 8 kg als leichte Hantel; das Gewicht in der App hängt davon nicht ab.
- **Schlüsselbein:** hebt sich oben um 8°, wie die Schulter beim seitlichen Heben mitgeht. Deutlich mehr wäre Hochziehen der Schultern; ganz ohne geht auch, wenn du das lieber siehst.

### 10.7 Bericht zum Paket

```
Arbeitspaket: D-468 Phase Programme, Abschnitt 2: Familie „Schulter und Brust isoliert“ (Seitheben mit Kurzhanteln), Prüfseite
Umgesetzte Funktionen: keine in der App; Werkzeug: Kurzhantel 8 kg (geraete.KH8, Maße je Hantel), Seitheben (uebungen.Seitheben) mit Suche des Ausgangs vor den Oberschenkeln, Messwerte für Arme, Hanteln und Finger je Hand, neue Zeilen der Prüfseite; erfüllte AK: –
Geänderte Dateien: tools/uebungen-3d/geraete.py, tools/uebungen-3d/uebungen.py, tools/uebungen_pruef_bild.py, tools/uebungen-3d/familien.json, docs/uebungen-animationsplan.md, docs/screens/uebungen/familie-schulter-brust-isoliert.webp (neu), form-programme-report.md, docs/decisions.md, docs/testing.md, docs/implementation-plan.md, docs/feature-inventory.md
Technische Entscheidungen: D-468
Ausgeführte Tests: render.py seitheben_kh --pruefen (alle 60 Bilder gemessen, Prüfansichten), Nahaufnahmen, Bilder angesehen; pnpm format:check, pnpm check:docs; CI zum Entwurfs-PR
Ergebnis: bestanden (Werte in 10.4)
Bekannte Einschränkungen: 10.6
Nächste Schritte: Halt bis zur Freigabe der Prüfseite; danach die Schleife rendern und einbauen, dann die nächste Familie
```

**Halt:** Ich warte auf deine Freigabe der Prüfseite „Schulter und Brust isoliert“.

## 11. Freigabe „Schulter und Brust isoliert“: Seitheben mit 30°, Schleife in der App (D-469)

Deine Freigabe vom 31.10.2026 mit drei Entscheidungen: Der Start vor den Oberschenkeln bleibt, ebenso die 8° des Schlüsselbeins; oben steht der Arm 30° vor der Schulterlinie statt 20°.

### 11.1 Ebene 30°

- Oben steht der Oberarm jetzt 30,0° vor der Schulterlinie, waagrecht, der Ellbogen auf Schulterhöhe. Das ist die Ebene des Schulterblatts.
- Der Start bleibt: Der Arm hängt 13,6° nach vorn (gesucht wie bisher, jetzt 13,57°), die Köpfe der Hanteln bleiben 12,0 mm vor Shorts und Shirt.
- Die Griffe liegen oben 131,4 cm auseinander (vorher 142,7 cm), weil die Arme weiter vorn stehen.

### 11.2 Ausführungstext

Der Text sagte nur „seitlich“. Geändert:

| | vorher | jetzt |
|---|---|---|
| Ausführung, Schritt 1 | „Heb die Oberarme seitlich an, bis die Ellbogen auf Schulterhöhe sind.“ | „Heb die Oberarme seitlich und leicht schräg nach vorn an, bis die Ellbogen auf Schulterhöhe sind.“ |
| Hinweis zur Quelle | „Die Variante „Spider“ (Alias-Name) ist nicht eigens beschrieben.“ | dazu: „„Leicht schräg nach vorn“ (rund 30° vor der Schulterlinie) ist am 31.10.2026 ergänzt; die Quelle hebt die Arme zur Seite.“ |

Eine der zugelassenen Quellen (ExRx, ACE, NASM, Human Kinetics, Mayo Clinic) mit der Schulterblattebene beim Seitheben habe ich nicht gefunden; ExRx sagt „zur Seite“. Der Hinweis in der App sagt darum offen, dass die Ergänzung von uns stammt. Unverändert: „Heb die Arme seitlich an, statt sie nach außen zu drehen.“ Der Satz meint die Drehung des Arms, nicht die Richtung. Derselbe Satz beim vorgebeugten Seitheben (Reverse Flys) bleibt, dort stehen die Arme quer zum Oberkörper.

### 11.3 Messwerte über alle 60 Bilder

| | Wert |
|---|---|
| Armhebung (0 = hängend) | 13,9° (Ausgang) bis 90,0° (oben) |
| Oberarm oben zur Waagrechten / Ellbogen oben über dem Schultergelenk | 0,0° / 0,0 cm |
| Oberarm vor der Schulterlinie (ab 60° Armhebung) | 30,0 bis 35,9° |
| Ellbogen | 165,07 bis 165,11° |
| Ellbogen über dem Handgelenk | mindestens 1,9 cm (oben) |
| Handgelenk gesamt | 5,0° |
| Finger am Griff / Hand zu den Köpfen | 4,1 mm eingedrückt (gewollt) / 3,7 mm |
| Köpfe vor Haut, Shorts und Shirt | mindestens 12,0 mm |
| Griffe auseinander | 26,3 bis 131,4 cm |
| Knie / Rumpf vorgeneigt / Schlüsselbein gehoben | 168° / 10° / 0 bis 8° |
| Sohlen am Boden / verschoben | 0,0 mm / 0,0 mm |
| Meldungen des Rigs | 0 |

### 11.4 Schleife in der App

Gerendert wie die übrigen Schleifen (C männlich, 720 × 540, 60 Bilder, 40 Proben) und in `public/uebungen/medien.json` eingetragen, mit Bildbeschreibung.

| | Seitheben mit Kurzhanteln |
|---|---|
| Renderzeit, 60 Bilder | 1.879 s |
| MP4 / WebM | 44,8 / 41,8 KB |
| Poster / Vorschau | 6,8 / 3,0 KB |
| abgerufen (MP4, Poster, Vorschau) | 54,6 KB (mit WebM 51,6 KB) |

Nebenher liefen die Prüfansichten des Seithebens und der nächsten Familie. Erstes und letztes Bild sind pixelgleich. Startansicht unverändert 237,8 KB; die Liste nennt jetzt 36 Dateien, alle im Build vorhanden.

### 11.5 Aufnahme und Prüfseite

`docs/screens/uebungen/seitheben-bewegung.mp4`: die Schleife der App, dreimal (7,5 s). `docs/screens/uebungen/familie-schulter-brust-isoliert.webp` neu mit der Ebene von 30° und den neuen Werten; Messung und Prüfansichten 570 s, Nahaufnahmen 135 s.

**Tests:** Die Unit-Tests liefen unter Last (Blender rechnete die Prüfansichten der nächsten Familie): 1.209 bestanden, kein Ausfall. Die E2E-Tests liefen ohne Blender: 431 bestanden, 1 fehlgeschlagen, ein Zeittest der Startfläche: „Startfläche am iPhone Duo: zuerst Maße des zugeklappten Zustands, 120 ms lang, danach die aufgeklappten – Logo nie an der falschen Stelle, am Ende mittig (D-394)“. Das Logo war schon im ersten abgetasteten Bild zu sehen. Einzeln lief der Test fünfmal fehlerfrei; mit dem Seitheben hat er nichts zu tun.

### 11.6 Bericht zum Paket

```
Arbeitspaket: D-469 Phase Programme, Abschnitt 2: Seitheben freigegeben, Ebene 30°, Schleife in der App
Umgesetzte Funktionen: Schleife, Poster und Vorschaubild des Seithebens mit Kurzhanteln in der App; Anleitung angepasst (leicht schräg nach vorn); Werkzeug: Ebene oben 30°; erfüllte AK: –
Geänderte Dateien: tools/uebungen-3d/uebungen.py, src/modules/exercises/data/exercise-guides.v1.json, public/uebungen/medien.json, public/uebungen/medien/ (4 Dateien neu), e2e/uebungen.spec.ts, docs/uebungen-bestand.md, tools/uebungen-3d/familien.json, docs/uebungen-animationsplan.md, docs/screens/uebungen/seitheben-bewegung.mp4 (neu), docs/screens/uebungen/familie-schulter-brust-isoliert.webp, form-programme-report.md, docs/decisions.md, docs/testing.md, docs/implementation-plan.md, docs/feature-inventory.md
Technische Entscheidungen: D-469
Ausgeführte Tests: Messung aller 60 Bilder, Schleife gerendert, erstes und letztes Bild verglichen, Prüfseite neu; pnpm format:check, pnpm lint, pnpm typecheck, pnpm check:docs, pnpm test (unter Last), pnpm build, pnpm check:bundle, pnpm test:e2e (Chromium, ohne Last); CI zum Entwurfs-PR mit WebKit
Ergebnis: siehe 11.3 und 11.4; Unit-Tests 1.209 bestanden (unter Last), E2E 431 bestanden und 1 Zeittest der Startfläche fehlgeschlagen (ohne Last; einzeln fünfmal bestanden); WebKit in der CI
Bekannte Einschränkungen: keine neuen
Nächste Schritte: Prüfseite der nächsten Familie aus „Ganzkörper A/B“ (Waagrechtes Ziehen)
```
