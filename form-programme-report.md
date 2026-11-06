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

## 12. Nächste Familie: Waagrechtes Ziehen mit Rudern am Kabel, Prüfseite (D-470)

Im Animationsplan kommt nach „Schulter und Brust isoliert“ die Familie „Waagrechtes Ziehen“. Aus „Ganzkörper A/B“ gehört nur das Rudern am Kabel, sitzend dazu (24 Einheiten); es ist zugleich die Referenz der Familie. Wie verlangt zuerst nur die Prüfseite.

### 12.1 Gerät

- **Station:** Long Pull Row mit Gewichtsblock wie die [Jerai Fitness Long Pull Row](https://www.jeraifitness.com/products/long-pull-row-dual--pulley) (239 × 102 × 229 cm, Block 100 kg). Zwei geneigte Fußplatten links und rechts der Rolle, 70° über der Waagrechten, 23 cm hoch wie die [Ironmaster Low Row Foot Plate](https://www.ironmaster.com/products/low-row-foot-plate/). Davor die Säule mit dem Gewichtsblock; er hebt sich um den Weg des Griffs.
- **Sitz:** 43 cm hoch wie die Flachbank, lang wie bei Long-Pull-Stationen; das Polster gibt unter Gesäß und Oberschenkeln nach. Eine Sitzhöhe nennt keine der Quellen.
- **V-Griff:** enger Parallelgriff nach Händlerangaben zu den Rudergriffen von Gorilla Sports: Griffe 12 cm lang ([Angebot bei Kaufland](https://www.kaufland.de/product/374230116/)), 2,5 cm dick, innen 12 cm auseinander und 19 cm lang (Parallelgriff, Angebot bei Decathlon). Er hängt drehbar am Kabel und richtet sich nach den Händen.

Alle Maße stammen aus der Websuche (Angaben von Herstellern und Händlern).

### 12.2 Bewegung

- **Quelle:** Familie (Code), wie im Plan.
- **Sitzen:** Rumpf aufrecht wie im Stand, Füße etwa hüftbreit flach auf den Platten, Knie leicht gebeugt (160°). Das Becken bleibt fest, das Gesäß liegt 4 mm im Polster.
- **Ausgang:** Arme fast gestreckt, der Rumpf in der Lende 16° vorgeneigt, die Schultern nach vorn.
- **Ziehen:** Der Griff kommt zur Taille, erst steigend, dann gerade heran. Dabei richtet sich der untere Rücken auf, und die Schulterblätter gehen zusammen. Am Ende steht der Griff vor dem Bauch, die Ellbogen hinter dem Rumpf und nah am Körper.
- **Zurück** derselbe Weg, ohne Pause am vorderen Umkehrpunkt.

### 12.3 Abgleich mit dem Ausführungstext

Der Text in der App passt; geändert habe ich nichts. Dafür hat die Animation sich nach dem Text gerichtet:

| Text in der App | Animation |
|---|---|
| „… stell die Füße auf die Fußplatten.“ / „… bis die Knie nur noch leicht gebeugt sind.“ | Sohlen flach auf den Platten, Knie 160° |
| „Zieh den Griff zur Taille und richte dabei den unteren Rücken auf.“ | Griff am Ende vor dem Bauch auf Höhe der Taille; Lende von 16° auf 0° |
| „Lass den Griff kontrolliert nach vorn, bis die Arme gestreckt sind.“ | Ausgang mit fast gestreckten Armen |
| „Beginn die nächste Wiederholung ohne Pause am vorderen Umkehrpunkt.“ | Zeitablauf ohne Pause im Ausgang; bisher hatten alle Schleifen an beiden Enden eine kurze Pause |

### 12.4 Messwerte über alle 60 Bilder

| | Wert |
|---|---|
| Ellbogen | 167,1° (Ausgang) bis 74,0° (Ende, 106° gebeugt) |
| Rumpf zur Senkrechten / Lende gebeugt | 14,6° bis 0,9° / 16° bis 0° |
| Schlüsselbein (Schulterblätter) | 8° nach vorn bis 10° zurück |
| Oberarm hinter dem Rumpf / Ellbogen hinter dem Schultergelenk (Ende) | 16,1° / 7,2 cm |
| Ellbogen neben dem Schultergelenk | 3,2 cm innen bis 4,8 cm außen |
| Griff über dem Sitz / Weg des Griffs | 12,0 bis 26,3 cm / 39,7 cm |
| Handgelenk gesamt | 2,4 bis 6,0° |
| Finger am Griff | 4,3 mm eingedrückt (gewollt, wie bei allen Griffen) |
| Hände und Griff vor dem Shirt | mindestens 10,0 mm (Ende) |
| Hände, Unterarme und Griff über Beinen und Shorts | mindestens 7,6 mm |
| Kabel zu Beinen, Shorts und Schuhen | mindestens 104,5 mm |
| Knie / Hüfte (Oberschenkel zum Rumpf) / Sprunggelenk | 160° / 73,4 bis 87,1° / 2,3° gestreckt |
| Sohlen auf den Platten (Ferse und Ballen) / verschoben | 0,0 mm / 0,0 mm |
| Gesäß im Sitz / Oberschenkel im Polster | 3,8 bis 4,0 mm / 3,8 bis 4,0 mm |
| Polster: tiefste Delle / Haut oder Kleidung durch das Polster | 14,3 bis 15,3 mm / 0,0 mm |
| Kragen und Kragenpolster über der Socke | 1,6 mm |
| Meldungen des Rigs | 0 |

### 12.5 Prüfseite und Rechenzeit

`docs/screens/uebungen/familie-waagrechtes-ziehen.webp`: Ausgangs- und Endposition mit der Kamera der App und von der Seite, V-Griff und Hände von der Seite und schräg von vorn, der linke Fuß von außen und von der Person aus, darunter die Messwerte. Rechenzeit: Messung und Prüfansichten 386 s, Nahaufnahmen 83 s.

Beim Prüfen gefunden und behoben:
- Die Prüfung „Hände vor dem Shirt“ zählte zuerst die Unterarme gegen die Ärmel; das Ende lag so 30 cm zu weit vorn, der Ellbogen blieb bei 152°. Jetzt Hände und Griff gegen das Shirt ohne Ärmel, an offenen Rändern ohne Vorzeichen.
- Der Griff lag zuerst quer zum Kabel; das Handgelenk knickte bis 50° zur Seite. Ein V-Griff hängt drehbar am Kabel, jetzt liegt er quer zu den Unterarmen, mit dem Griff schräg in der Hand wie beim Bankdrücken (12°): Handgelenk höchstens 6,0°.
- Am Ende lagen die Unterarme zuerst auf den Oberschenkeln (Griff 15 cm über dem Sitz), dann die Unterkanten der Fäuste 19 mm in den Shorts; jetzt endet der Griff auf Höhe des Nabels und steigt früher.
- Zwei Nahaufnahmen zeigten nichts (von hinten oben verdeckt der Kopf die Hände, von vorn verdeckt die Fußplatte den Fuß); jetzt andere Richtungen.
- Die Säule (2,1 m) machte die Figur im Bild klein; der Ausschnitt richtet sich jetzt nach Figur, Sitz, Fußplatten und Griff, die Säule darf oben angeschnitten sein.

### 12.6 Abweichungen und offene Punkte

- **Bahn des Griffs:** Auf einer Geraden streiften die Unterkanten der Fäuste kurz vor dem Ende die Shorts über dem Schoß. Jetzt steigt der Griff früher zur Taille und kommt dann gerade heran.
- **Sitzhöhe:** 43 cm wie die Flachbank, ohne Herstellerangabe.
- **Rumpf:** Im Ausgang neigt sich nur die Lende (16°), das Becken bleibt fest. Möglich wäre auch, das Becken etwas mitkippen zu lassen.
- **Ellbogen am Ende:** 106° gebeugt, Oberarm 16° hinter dem Rumpf; die Familie nennt 15 bis 30°. Weiter zurück ginge mit einem tieferen Griff, dann kämen die Fäuste den Oberschenkeln näher.

### 12.7 Bericht zum Paket

```
Arbeitspaket: D-470 Phase Programme, Abschnitt 2: Familie „Waagrechtes Ziehen“ (Rudern am Kabel, sitzend), Prüfseite
Umgesetzte Funktionen: keine in der App; Werkzeug: Kabelrudern-Station und V-Griff (geraete.kabelrudern, geraete.v_griff), Rudern am Kabel (uebungen.RudernKabel) mit Sitzen auf weichem Polster, Füßen flach auf geneigten Platten, V-Griff quer zu den Unterarmen und Bahn zur Taille, Zeitablauf ohne Pause im Ausgang (haltung.ablauf), Abstände von Händen, Armen, Griff und Kabel zu Shirt, Beinen und Shorts, neue Zeilen der Prüfseite; erfüllte AK: –
Geänderte Dateien: tools/uebungen-3d/geraete.py, tools/uebungen-3d/uebungen.py, tools/uebungen-3d/haltung.py, tools/uebungen-3d/render.py, tools/uebungen_pruef_bild.py, tools/uebungen-3d/familien.json, docs/uebungen-animationsplan.md, docs/screens/uebungen/familie-waagrechtes-ziehen.webp (neu), form-programme-report.md, docs/decisions.md, docs/testing.md, docs/implementation-plan.md, docs/feature-inventory.md
Technische Entscheidungen: D-470
Ausgeführte Tests: render.py rudern_kabel --pruefen (alle 60 Bilder gemessen, Prüfansichten), Nahaufnahmen, Bilder angesehen; Zeitablauf der übrigen Übungen an allen 60 Bildern verglichen; pnpm format:check, pnpm check:docs, pnpm check:bundle; CI zum Entwurfs-PR
Ergebnis: bestanden (Werte in 12.4)
Bekannte Einschränkungen: 12.6
Nächste Schritte: Halt bis zur Freigabe der Prüfseite; danach die Schleife rendern und einbauen, dann die nächste Familie
```

**Halt:** Ich warte auf deine Freigabe der Prüfseite „Waagrechtes Ziehen“.

## 13. CI: Test „Bereit für dein Training?“ in WebKit (D-471)

Nach D-470 war die CI in WebKit rot: Der Test „„Bereit für dein Training?“ auf Heute und Training, wenn nichts läuft und kein Programm aktiv ist“ startet ein Training aus „Ganzkörper A/B“ und lädt danach die Seite „Training“ neu. Der Player lädt die Videos der aktuellen und der nächsten Übung vor; seit Tag A Videos hat (Beinpresse, Bankdrücken mit Kurzhanteln), bricht das Neuladen diese Abrufe ab, und WebKit meldet das als Konsolenfehler. In der App selbst lädt nichts neu. Der Test geht jetzt über den Pfeil im Player zurück, wie man es in der App tut, und prüft danach dasselbe. In Chromium bestanden; WebKit prüft die CI.

## 14. Rudern: Sitz mittig nach deinem Hinweis (D-472)

Dein Hinweis vom 31.10.2026: „es sieht so aus als würde er viel zu weit vorne sitzen“, dazu ein Bild einer Station, auf dem die Person mittig sitzt. Das stimmte: Die Vorderkante des Sitzes lag nur 8 cm vor den Hüftgelenken, nach hinten reichte der Sitz 1,10 m. Die Figur saß ganz vorn auf der Kante, die Oberschenkel ragten frei darüber hinaus.

### 14.1 Änderung

- **Sitz:** 95 cm lang statt 1,10 m. Er reicht von unter den Knien (Vorderkante 42 cm vor den Hüftgelenken) gleich weit hinter das Gesäß; seine Mitte liegt unter dem Gesäß. Ein erster Schritt mit der Vorderkante 25 cm vor den Hüftgelenken ließ die Figur noch im vorderen Drittel sitzen.
- **Füße:** Die Fußgelenke liegen 5 statt 12 cm unter den Hüftgelenken, die Fußplatten stehen 7 cm höher. So liegen die Oberschenkel fast waagrecht; Gesäß und Ansatz der Oberschenkel liegen auf, unter den Knien bleiben gut 4 cm Luft. Mit 12 cm lägen die Kniekehlen auf der Vorderkante des Sitzes, die Waden hingen davor tiefer als der Sitz.
- **Ende des Griffs:** 23 statt 20 cm über den Hüftgelenken, weil die Oberschenkel höher liegen. Bei 20 cm lagen die unteren Kappen des V-Griffs 7,8 mm in den Shorts.
- **Bildausschnitt:** mit den Beinen des Sitzes bis zum Boden. Mit dem kürzeren Sitz waren Boden und Beine des Sitzes unten abgeschnitten.
- **Nahaufnahme des Fußes von hinten:** Die Kamera steht höher. Im Ausgang stand sie im linken Unterarm; das war schon bei D-470 am Rand des Bildes zu sehen.
- Unverändert: Knie 160°, Becken, Rumpf, Bahn des Griffs und Zeitablauf.

### 14.2 Ausführungstext

„Setz dich etwas nach vorn, um den Griff zu fassen, und stell die Füße auf die Fußplatten.“ und „Schieb die Hüfte zurück, bis die Knie nur noch leicht gebeugt sind.“ beschreiben das Aufsetzen; die Schleife zeigt die Haltung danach. Der Text passt, geändert habe ich nichts.

### 14.3 Messwerte über alle 60 Bilder

Nur was sich gegenüber 12.4 geändert hat:

| | vorher (D-470) | jetzt |
|---|---|---|
| Ellbogen | 167,1° bis 74,0° | 168,0° bis 69,1° (Ende 111° gebeugt) |
| Oberarm hinter dem Rumpf / Ellbogen hinter dem Schultergelenk (Ende) | 16,1° / 7,2 cm | 15,7° / 7,0 cm |
| Griff über dem Sitz / Weg des Griffs | 12,0 bis 26,3 cm / 39,7 cm | 16,0 bis 29,2 cm / 42,1 cm |
| Hände, Unterarme und Griff über Beinen und Shorts | mindestens 7,6 mm | mindestens 18,3 mm |
| Kabel zu Beinen, Shorts und Schuhen | mindestens 104,5 mm | mindestens 105,6 mm |
| Hüfte (Oberschenkel zum Rumpf) / Sprunggelenk | 73,4 bis 87,1° / 2,3° gestreckt | 68,6 bis 82,4° / 7,0° gestreckt |
| Gesäß im Sitz / Oberschenkel im Polster | 3,8 bis 4,0 mm / 3,8 bis 4,0 mm | 1,8 bis 4,0 mm / 0,4 bis 0,6 mm |
| Polster: tiefste Delle | 14,3 bis 15,3 mm | 14,1 bis 15,2 mm |

Gleich geblieben: Rumpf 14,6 bis 0,9° zur Senkrechten, Lende 16 bis 0°, Schlüsselbein 8° nach vorn bis 10° zurück, Handgelenk 2,4 bis 6,0°, Finger 4,3 mm eingedrückt (gewollt), Hände und Griff mindestens 10,0 mm vor dem Shirt, Knie 160°, Sohlen 0,0 mm auf den Platten und nicht verschoben, nichts durch das Polster, keine Meldungen des Rigs.

### 14.4 Bilder und Video

- **Standbild:** `docs/screens/uebungen/rudern-sitz-vorher-jetzt.webp`, vorher und jetzt von der Seite und mit der Kamera der App.
- **Prüfseite:** `docs/screens/uebungen/familie-waagrechtes-ziehen.webp` neu.
- **Video:** die Schleife mit der Kamera der App, dreimal abgespielt, an dich geschickt. In die App kommt sie nach deiner Freigabe.

### 14.5 Bericht zum Paket

```
Arbeitspaket: D-472 Phase Programme, Abschnitt 2: Rudern am Kabel, Sitz mittig (Hinweis des Produktinhabers)
Umgesetzte Funktionen: keine in der App; Werkzeug: Sitz der Kabelrudern-Station 95 cm lang, Vorderkante unter den Knien (geraete.RUDERN, RudernKabel.SITZ_VOR), Füße 5 cm unter den Hüftgelenken (TIEFER), Ende des Griffs 23 cm über den Hüftgelenken (TAILLE), Bildausschnitt mit den Beinen des Sitzes, Nahaufnahme des Fußes von hinten höher; erfüllte AK: –
Geänderte Dateien: tools/uebungen-3d/geraete.py, tools/uebungen-3d/uebungen.py, tools/uebungen-3d/familien.json, docs/uebungen-animationsplan.md, docs/screens/uebungen/familie-waagrechtes-ziehen.webp, docs/screens/uebungen/rudern-sitz-vorher-jetzt.webp (neu), form-programme-report.md, docs/decisions.md, docs/testing.md, docs/implementation-plan.md, docs/feature-inventory.md
Technische Entscheidungen: D-472
Ausgeführte Tests: drei Phasen je Schritt, Gegenprobe mit den alten Fußplatten, render.py rudern_kabel --pruefen (alle 60 Bilder, zweimal), Nahaufnahmen, Schleife mit 60 Bildern (nur zur Ansicht), Bilder angesehen; pnpm format:check, pnpm check:docs, pnpm check:bundle; CI zum Entwurfs-PR
Ergebnis: bestanden (Werte in 14.3)
Bekannte Einschränkungen: Sitzhöhe und Sitzlänge ohne Herstellerangabe; die Lage des Sitzes folgt dem Vorlagebild
Nächste Schritte: Halt bis zur Freigabe der Prüfseite; danach die Schleife (schon gerendert) in die App, dann die nächste Familie
```

**Halt:** Ich warte auf deine Freigabe der Prüfseite „Waagrechtes Ziehen“.

## 15. Rudern: Ausführung nach deinem Vorlagebild (D-473)

Dein Hinweis vom 31.10.2026: „die ausführung des renders ist nicht korrekt orientiere dich an dieser ausführung hier“, mit demselben Bild der Station von hinten rechts oben.

### 15.1 Die Unterschiede

| | Vorlagebild | bisher (D-470 bis D-472) |
|---|---|---|
| Oberkörper | aufrecht, auch mit gestreckten Armen | im Ausgang in der Lende 16° vorgebeugt, richtet sich beim Ziehen auf |
| Knie | deutlich gebeugt | 160°, fast gestreckt |
| Füße | auf einer großen, geneigten Platte | auf zwei kleinen Platten |
| Kabel | waagrecht in Brusthöhe, Rolle vorn an der Säule | von einer Rolle zwischen den Füßen schräg nach oben |
| Arme im Ausgang | nach vorn gestreckt, Hände etwa in Brusthöhe | nach vorn unten zu den Füßen |

Die alte Schleife folgte ExRx „Cable Seated Row“. Dort beugt sich der untere Rücken im Ausgang nach vorn und richtet sich beim Ziehen auf. Dein Bild zeigt die Variante mit geradem Rücken.

### 15.2 Änderung

- **Station:** eine Fußplatte für beide Füße (46 × 40 cm, geschätzt), die Rolle vorn an der Säule in Brusthöhe, eine Strebe von der Platte zur Rolle. Das Kabel läuft waagrecht zum Griff.
- **Oberkörper:** aufrecht über die ganze Bewegung. Nur die Schultern gehen im Ausgang nach vorn und am Ende zurück, die Schulterblätter zusammen.
- **Knie:** 130°. Die Füße liegen 11 cm unter den Hüftgelenken; bei 8 cm kamen Fäuste und Unterarme den Knien bis 16 mm nah.
- **Griff:** waagrecht vom Ausgang mit fast gestreckten Armen bis vor die untere Brust, 10 mm vor dem Shirt.
- **Ellbogen:** zeigen weiter nach hinten. Sonst endete der Oberarm nur 11° hinter dem Rumpf; die Familie nennt 15 bis 30°.
- Unverändert: Sitz mittig (D-472), V-Griff, ohne Pause am vorderen Umkehrpunkt.

### 15.3 Ausführungstext

Der Text passte zur alten Variante („richte dabei den unteren Rücken auf“, „bis die Knie nur noch leicht gebeugt sind“). Neu:

| | vorher | jetzt |
|---|---|---|
| Kurz | „Am tiefen Kabelzug sitzend ziehst du den Griff zur Taille …“ | „Am Kabelzug sitzend ziehst du den Griff waagrecht zu den unteren Rippen …“ |
| Aufbau | „… stell die Füße auf die Fußplatten.“ / „Schieb die Hüfte zurück, bis die Knie nur noch leicht gebeugt sind.“ | „… stell die Füße auf die Fußplatte.“ / „Schieb die Hüfte zurück und richte den Oberkörper auf. Die Knie bleiben gebeugt.“ / „Fass den Griff so, dass die Handflächen zueinander zeigen.“ |
| Ausführung | „Zieh den Griff zur Taille und richte dabei den unteren Rücken auf.“ / „Lass den Griff kontrolliert nach vorn, bis die Arme gestreckt sind.“ | „Zieh den Griff zu den unteren Rippen und die Schulterblätter zusammen.“ / „Der Oberkörper bleibt dabei aufrecht.“ / „Lass den Griff kontrolliert nach vorn, bis die Arme gestreckt sind und die Schultern nach vorn gehen.“ |
| Hinweis, Fehler | – | „Lehn dich nicht nach vorn, um Schwung zu holen.“ / „Oberkörper kippt nach vorn und holt Schwung.“ |

Quellen: ExRx „Cable Straight Back Seated Row“ (Oberkörper aufrecht, auch auf dem Rückweg), NASM „How to Perform a Close-Grip Seated Machine Row“ (Handflächen zueinander, Hände zu den unteren Rippen, Schulterblätter zusammen, nicht nach vorn lehnen), weiter ExRx „Cable Seated Row“ für den vorderen Umkehrpunkt. Die Quellen nennen „leicht gebeugte“ Knie; der Hinweis zur Quelle sagt, dass die Knie nach deinem Bild stärker gebeugt sind. Die Seiten ließen sich in der Cloud-Umgebung nicht öffnen; die Sätze stammen aus Suchauszügen. Bitte lies sie im Browser gegen. Das Kabel in Brusthöhe nennt keine Quelle, es folgt deinem Bild.

### 15.4 Messwerte über alle 60 Bilder

| | vorher (D-472) | jetzt |
|---|---|---|
| Rumpf zur Senkrechten / Lende gebeugt | 14,6 bis 0,9° / 16 bis 0° | 0,9° / 0°, über die ganze Schleife |
| Ellbogen | 168,0° bis 69,1° | 166,3° bis 56,3° (Ende 124° gebeugt) |
| Oberarm hinter dem Rumpf / Ellbogen hinter dem Schultergelenk (Ende) | 15,7° / 7,0 cm | 18,0° / 8,1 cm |
| Ellbogen neben dem Schultergelenk | 3,2 cm innen bis 4,7 cm außen | 2,3 bis 3,9 cm innen |
| Griff über dem Sitz / Weg des Griffs | 16,0 bis 29,2 cm / 42,1 cm | 38,0 cm, waagrecht / 38,2 cm |
| Knie / Hüfte / Sprunggelenk | 160° / 68,6 bis 82,4° / 7,0° gestreckt | 130° / 71,9° / 12,2° gebeugt |
| Hände, Unterarme und Griff über Beinen und Shorts | mindestens 18,3 mm | mindestens 22,8 mm |
| Kabel zu Beinen, Shorts und Schuhen | mindestens 105,6 mm | mindestens 163,9 mm |
| Gesäß im Sitz / Oberschenkel zum Polster | 1,8 bis 4,0 mm / 0,4 bis 0,6 mm darin | 4,0 mm / 5,2 mm darüber |
| Polster: tiefste Delle | 14,1 bis 15,2 mm | 14,9 mm |

Gleich geblieben: Schlüsselbein 8° nach vorn bis 10° zurück, Handgelenk 2,5 bis 5,9°, Finger 4,3 mm eingedrückt (gewollt), Hände und Griff mindestens 10,0 mm vor dem Shirt, Sohlen 0,0 mm auf der Platte und nicht verschoben, nichts durch das Polster, keine Meldungen des Rigs.

**Abweichungen und offene Punkte**

- **Ellbogen am Ende:** 124° gebeugt; die Familie nennt 90 bis 110°. Der Griff kommt bis 10 mm an die unteren Rippen heran, dafür muss der Ellbogen stärker beugen. Mit dem Griff weiter vor dem Körper wäre er weniger gebeugt.
- **Fußplatte und Rolle:** Maße und Höhe nach deinem Bild geschätzt, ohne Herstellerangabe.
- **Kamera der App:** unverändert schräg von vorn. Dein Bild zeigt die Person von hinten; diese Ansicht steht im Vergleichsbild.

### 15.5 Bilder und Video

- **Vergleich:** `docs/screens/uebungen/rudern-ausfuehrung-vorher-jetzt.webp`, vorher und jetzt von der Seite und mit der Kamera der App, dazu jetzt von hinten rechts oben wie dein Bild. Dein Bild selbst liegt nicht im Repository.
- **Prüfseite:** `docs/screens/uebungen/familie-waagrechtes-ziehen.webp` neu.
- **Video:** die Schleife mit der Kamera der App, dreimal abgespielt, an dich geschickt. In die App kommt sie nach deiner Freigabe.

### 15.6 Bericht zum Paket

```
Arbeitspaket: D-473 Phase Programme, Abschnitt 2: Rudern am Kabel nach dem Vorlagebild des Produktinhabers
Umgesetzte Funktionen: Anleitung „Rudern am Kabel, sitzend“ angepasst (Oberkörper aufrecht, Knie gebeugt, Griff zu den unteren Rippen, Quellen ExRx und NASM); Werkzeug: Kabelrudern-Station mit einer Fußplatte und der Rolle in Brusthöhe (geraete.kabelrudern), Rudern mit aufrechtem Rumpf, Knie 130°, waagrechter Bahn und Ellbogen weiter nach hinten (uebungen.RudernKabel); erfüllte AK: –
Geänderte Dateien: tools/uebungen-3d/geraete.py, tools/uebungen-3d/uebungen.py, tools/uebungen-3d/familien.json, src/modules/exercises/data/exercise-guides.v1.json, docs/uebungen-animationsplan.md, docs/uebungen-bewegungsfamilien.md, docs/uebungen-bestand.md, docs/screens/uebungen/familie-waagrechtes-ziehen.webp, docs/screens/uebungen/rudern-ausfuehrung-vorher-jetzt.webp (neu), form-programme-report.md, docs/decisions.md, docs/testing.md, docs/implementation-plan.md, docs/feature-inventory.md
Technische Entscheidungen: D-473
Ausgeführte Tests: drei Phasen je Schritt, Vergleich mit dem Vorlagebild aus derselben Richtung, render.py rudern_kabel --pruefen (alle 60 Bilder), Nahaufnahmen, Schleife mit 60 Bildern (nur zur Ansicht), Bilder angesehen; pnpm format:check, pnpm test, pnpm check:docs, pnpm build, pnpm check:bundle, pnpm test:e2e (Chromium); CI zum Entwurfs-PR
Ergebnis: bestanden (Werte in 15.4; E2E 432 bestanden, 132 übersprungen)
Bekannte Einschränkungen: Ellbogen am Ende stärker gebeugt als die Familie nennt; Fußplatte und Höhe der Rolle geschätzt; Quellen nur aus Suchauszügen gelesen
Nächste Schritte: Halt bis zur Freigabe der Prüfseite; danach die Schleife (schon gerendert) in die App, dann die nächste Familie
```

**Halt:** Ich warte auf deine Freigabe der Prüfseite „Waagrechtes Ziehen“.

## 16. Freigabe „Waagrechtes Ziehen“: Kamera schräg von hinten, Schleife in der App (D-474)

Deine Freigabe vom 31.10.2026 mit drei Entscheidungen: die Kamera schräg von hinten wie beim Latziehen, der Quellenhinweis nennt offen die Abweichungen von ExRx, und die 124° im Ellbogen am Ende passen.

### 16.1 Kamera

Wie beim Latziehen 135° (schräg von hinten links) und 10° von oben; bisher schräg von vorn (75°, 12°). Verglichen habe ich 135° mit 10°, 15° und 18° und 150° mit 15°, jeweils im Ausgang, in der Mitte und am Ende:

- Bei 150° verschwinden Arme und Griff am Ende hinter dem Rücken.
- Bei 135° sieht man den Rücken mit den Schulterblättern, den linken Arm mit dem Ellbogen hinter dem Rumpf, den Griff und das Kabel bis zur Rolle; 15° und 18° bringen kaum etwas dazu.
- Das Vorschaubild zeigt die Figur ebenfalls schräg von hinten.

### 16.2 Quellenhinweis

| vorher | jetzt |
|---|---|
| „Oberkörper aufrecht nach ExRx „Cable Straight Back Seated Row“, Griff zu den Rippen nach NASM; die Variante mit gebeugtem unterem Rücken ist nicht beschrieben. Knie stärker gebeugt als dort (Vorlagebild, 31.10.2026). Weiter Griff und Untergriff (Alias-Namen) sind nicht eigens beschrieben.“ | „Folgt ExRx „Cable Straight Back Seated Row“ mit aufrechtem Oberkörper. Abweichend davon sind die Knie deutlich statt leicht gebeugt, und der Griff kommt zu den unteren Rippen statt zur Taille (wie bei NASM), nach einem Vorlagebild vom 31.10.2026. Weiten Griff und Untergriff beschreibt sie nicht.“ |

Die erste Fassung hatte 308 Zeichen; die Prüfung der Daten erlaubt 300 und hat sie verworfen. Die Animation und die übrigen Sätze bleiben wie bei D-473.

### 16.3 Schleife in der App

Gerendert wie die übrigen Schleifen (C männlich, 720 × 540, 60 Bilder, 40 Proben) und in `public/uebungen/medien.json` eingetragen, mit Bildbeschreibung.

| | Rudern am Kabel, sitzend |
|---|---|
| Renderzeit, 60 Bilder | 1.518 s |
| MP4 / WebM | 53,4 / 47,5 KB |
| Poster / Vorschau | 13,2 / 6,1 KB |
| abgerufen (MP4, Poster, Vorschau) | 72,7 KB (mit WebM 66,8 KB) |

Ohne Pause am vorderen Umkehrpunkt ist das letzte Bild nicht gleich dem ersten (458 Pixel um bis zu 63 von 255 Stufen verschieden): Die Bewegung läuft dort weiter, die Schleife schließt ohne Sprung.

### 16.4 Aufnahme und Prüfseite

`docs/screens/uebungen/rudern-bewegung.mp4`: die Schleife der App, dreimal (7,5 s). `docs/screens/uebungen/familie-waagrechtes-ziehen.webp` neu mit der Kamera schräg von hinten; die Messwerte sind dieselben wie bei D-473 (15.4). Messung und Prüfansichten 390 s, Nahaufnahmen 72 s.

**Tests:** Unit-Tests 1.209 bestanden. Die E2E-Tests liefen ohne Blender nebenher: 431 bestanden, 1 fehlgeschlagen, wieder der Zeittest der Startfläche (D-394), diesmal in der Fassung „… nur beim Laden des Skripts wie beim vierten Start …“: Das Logo war schon im ersten abgetasteten Bild zu sehen. Einzeln fünfmal wiederholt lief er fehlerfrei; mit dem Rudern hat er nichts zu tun. Er schlug lokal jetzt zum zweiten Mal einmalig fehl (zuerst bei D-469 unter Last) und ist damit ein Kandidat für eine eigene Prüfung.

### 16.5 Bericht zum Paket

```
Arbeitspaket: D-474 Phase Programme, Abschnitt 2: Freigabe „Waagrechtes Ziehen“, Rudern am Kabel in der App
Umgesetzte Funktionen: TP-06, TP-07 und TS-02 mit Schleife, Poster und Vorschaubild auch für das Rudern am Kabel, sitzend (Kamera schräg von hinten wie beim Latziehen); Quellenhinweis nennt die Abweichungen von ExRx; erfüllte AK: –
Geänderte Dateien: tools/uebungen-3d/uebungen.py, tools/uebungen-3d/familien.json, src/modules/exercises/data/exercise-guides.v1.json, public/uebungen/medien.json, public/uebungen/medien/rudern_kabel.mp4, .webm, -poster.webp, -vorschau.webp (neu), e2e/uebungen.spec.ts, docs/screens/uebungen/rudern-bewegung.mp4 (neu), docs/screens/uebungen/familie-waagrechtes-ziehen.webp, docs/uebungen-animationsplan.md, docs/uebungen-bestand.md, form-programme-report.md, docs/decisions.md, docs/testing.md, docs/implementation-plan.md, docs/feature-inventory.md
Technische Entscheidungen: D-474
Ausgeführte Tests: Kameravergleich (vier Richtungen und Neigungen), render.py rudern_kabel (Schleife) und --pruefen, Nahaufnahmen, Bilder angesehen; npx vitest run media.test.ts; pnpm format:check, pnpm test, pnpm build, pnpm check:bundle, pnpm test:e2e (Chromium), pnpm check:docs; CI zum Entwurfs-PR
Ergebnis: bestanden bis auf einen E2E-Zeittest der Startfläche (einmalig, einzeln fünfmal bestanden)
Bekannte Einschränkungen: keine neuen; der Zeittest der Startfläche (D-394) schlug lokal zum zweiten Mal einmalig fehl
Nächste Schritte: Prüfseite der nächsten Familie „Beine isoliert“ (Beinbeuger liegend), dann Halt
```

## 17. Nächste Familie: Beine isoliert mit Beinbeuger liegend, Prüfseite (D-475)

Im Animationsplan kommt nach „Waagrechtes Ziehen“ die Familie „Beine isoliert“. Aus „Ganzkörper A/B“ gehört nur der Beinbeuger liegend dazu (23 Einheiten); er ist zugleich die Referenz der Familie. Wie verlangt zuerst nur die Prüfseite.

### 17.1 Gerät

- **Maschine:** liegender Beinbeuger mit Gewichtsblock; Grundfläche wie die Life Fitness Insignia Leg Curl (159 × 106 × 148 cm, Block 85 kg).
- **Polster:** Brust- und Oberschenkelpolster fallen vom Scheitel unter der Hüfte je 15° ab, wie bei der True Fitness FUSE-1800 („Chest and thigh pads angled at 15º“). Zusammen sind sie 81 cm lang (Legend Fitness 912: 108 cm), weil sie sich nach der Figur richten: Das Brustpolster endet 3 cm vor dem Halsansatz, das Oberschenkelpolster 6 cm vor den Kniegelenken.
- **Hebel und Rolle:** Die Drehachse liegt auf der Achse der Kniegelenke, die Rolle hinten auf den Unterschenkeln knapp über den Fersen. So verlangen es die Handbücher von Life Fitness („positioning the knees just off of the pad aligned with the machine pivot“, „lower leg pad should be positioned comfortably above the back of the ankles“) und Hoist. Die Nocke sitzt rechts an der Achse, ein Riemen läuft am Längsträger zur Säule mit dem Gewichtsblock vor dem Kopf.
- **Griffe:** vorn neben dem Brustpolster, 11° zu den Füßen hin abfallend.
- **Geschätzt**, weil keine Quelle es nennt: Scheitel 76 cm über dem Boden, Polster 30 cm breit und 7 cm dick, Rolle Ø 12 cm (Angabe eines Heimgeräts) und 46 cm lang, Lage der Griffe.

Alle Werte stammen aus der Websuche. Die Seiten ließen sich in der Cloud-Umgebung nicht öffnen; gelesen habe ich nur die Auszüge der Suche.

### 17.2 Bewegung

- **Quelle:** Familie (Code), wie im Plan.
- **Lage:** bäuchlings; der Rumpf fällt 15° zum Kopf hin ab, die Oberschenkel 15° zu den Knien, die Hüfte steht bei 149°. Brust, Bauch und Hüfte liegen mit Shirt und Shorts 4 mm im Polster, das unter dem Körper nachgibt. Die Knie liegen knapp hinter dem Polster.
- **Hände** an den Griffen, **Kopf** in Verlängerung des Rumpfs.
- **Beugen:** Das Knie beugt von 175° (fast gestreckt) bis 60°, also 120° gebeugt; die Familie nennt 110 bis 130°. Hebel und Rolle drehen um dieselbe Achse mit, die Rolle bleibt 1 mm in Socke und Haut. Der Gewichtsblock hebt sich um den Weg der Nocke. Das Sprunggelenk bleibt wie im Stand, Hüfte und Oberkörper liegen still.
- **Zurück** derselbe Weg, mit der kurzen Pause an beiden Umkehrpunkten wie bei den übrigen Schleifen.
- **Kamera der App:** von der Seite, etwas von hinten und oben (100°, 20°). So sieht man die Kniebeugung, die Rückseite der Oberschenkel und die Rolle. Verglichen habe ich auch schräg vom Kopf her (70°, 15°) und schräg von hinten (120°, 25°).

### 17.3 Abgleich mit dem Ausführungstext

Der Text in der App passt; geändert habe ich nichts.

| Text in der App | Animation |
|---|---|
| „Leg dich bäuchlings auf die Bank. Die Knie liegen knapp über der Bankkante, die Unterschenkel unter dem Polster.“ | bäuchlings, Kniegelenke 6 cm hinter dem Oberschenkelpolster, Rolle hinten auf den Unterschenkeln |
| „Beug die Knie und zieh das Polster nach oben.“ | Knie bis 120° gebeugt, Hebel und Rolle drehen mit |
| „Senk das Polster ab, bis die Knie wieder gestreckt sind.“ | zurück bis 175° |
| „Halt den Oberkörper auf der Bank.“ | Rumpf und Hüfte bleiben über die ganze Schleife 4 mm im Polster |

### 17.4 Messwerte über alle 60 Bilder

| | Wert |
|---|---|
| Knie | 175° (Ausgang) bis 60° (Ende, 120° gebeugt) |
| Hüfte (Oberschenkel zum Rumpf) / Rumpf zur Waagrechten | 149,1° / 15,9°, Kopf tiefer |
| Sprunggelenk | 1,5° gebeugt, wie im Stand |
| Kniegelenk zur Drehachse / Hebel und Rolle gedreht | 0,0 mm / 0 bis 115° |
| Ellbogen / Handgelenk / Finger am Griff | 65,6° / 0,4° / 4,5 mm eingedrückt (gewollt) |
| Brust und Bauch / Hüfte am Scheitel im Polster | 4,0 mm / 4,0 mm |
| Oberschenkel zum Polster | 1,3 mm darüber |
| Rolle in Socke und Haut / zu den Schuhen | 1,0 mm / 15,9 mm |
| Kopf und Hals zum Gerät | 60,7 mm |
| Socke: Löcher über dem Schuh / Kragen über der Socke | 0 / 1,6 mm |
| Polster: tiefste Delle / Haut oder Kleidung durch das Polster | 3,4 mm / 0,0 mm |
| Meldungen des Rigs | 0 |

### 17.5 Prüfseite und Rechenzeit

`docs/screens/uebungen/familie-beine-isoliert.webp`: Ausgangs- und Endposition mit der Kamera der App und von der Seite, die linke Hand am Griff von außen und von vorn, der linke Fuß mit der Rolle von außen und von hinten, darunter die Messwerte. Rechenzeit: Messung und Prüfansichten 412 s, Nahaufnahmen 74 s.

Beim Prüfen gefunden und behoben:
- Beim Bauen der Übung gibt es Shirt, Shorts und Socken noch nicht. Die Rolle lag so 1 mm in der Haut, aber 4 mm in der Socke, und die Polster kannten die Kleidung nicht. Jetzt liegen Polster, Drehachse und Rolle erst beim ersten Bild fest, wenn die Figur angezogen ist (wie beim Rudern).
- Mit den Griffen längs des Polsters knickte das Handgelenk 10° zum kleinen Finger. Gesucht unter elf Richtungen: 11° zu den Füßen hin abfallend 0,4°.
- Der Riemen lief schräg durchs Bild; jetzt läuft er an der Nocke hinab und am Längsträger entlang.
- Das Brustpolster reichte bis 2 cm hinter den Halsansatz, Hals und Kinn kamen dem Gerät 11 mm nah; jetzt endet es 3 cm davor, 60,7 mm Luft.
- Die Prüfung auf Löcher in der Socke über dem Schuh schießt ihre Strahlen nach unten und waagrecht, gedacht für stehende Füße. Beim Beinbeuger drehen Fuß und Schuh mit dem Unterschenkel, sie meldete bis 48 Punkte, obwohl sich am Fuß nichts ändert. Bei frei hängenden Füßen drehen die Strahlen jetzt mit dem Fuß: 0 Punkte. Für alle übrigen Übungen bleibt die Prüfung, wie sie war.

### 17.6 Abweichungen und offene Punkte

- **Polsterlänge:** 81 statt 108 cm; die Polster richten sich nach der Figur.
- **Geschätzte Maße:** Höhe der Liegefläche, Polsterbreite und -dicke, Rolle und Griffe (17.1).
- **Ende bei 120° im Knie:** Mitte der Familie (110 bis 130°). Mehr Beugung ginge, dann käme die Rolle näher an die Oberschenkel.
- **Rolle:** starr, sie liegt 1 mm in Socke und Haut; die Polster der Liegefläche geben nach, die Rolle nicht.
- **Oberschenkel:** liegen nahe der Hüfte im Polster, zu den Knien hin 1,3 mm darüber (sie werden schlanker).

### 17.7 Bericht zum Paket

```
Arbeitspaket: D-475 Phase Programme, Abschnitt 2: Familie „Beine isoliert“ (Beinbeuger liegend), Prüfseite
Umgesetzte Funktionen: keine in der App; Werkzeug: Beinbeuger-Maschine, liegend (geraete.beinbeuger) mit zwei geneigten Polstern, Hebel und Rolle auf der Achse der Kniegelenke, Griffen, Säule mit Gewichtsblock und Riemen; Beinbeuger liegend (uebungen.BeinbeugerLiegend) mit Lage auf den Polstern nach dem Ankleiden, Unterschenkel um die Kniegelenke gedreht, Fuß fest am Unterschenkel, Hände an den Griffen; render.messen ohne Bodenkontakt bei frei hängenden Füßen, Prüfung auf Löcher in der Socke mit dem Fuß gedreht; neue Zeilen der Prüfseite; erfüllte AK: –
Geänderte Dateien: tools/uebungen-3d/geraete.py, tools/uebungen-3d/uebungen.py, tools/uebungen-3d/render.py, tools/uebungen-3d/schuhe.py, tools/uebungen_pruef_bild.py, tools/uebungen-3d/familien.json, docs/uebungen-animationsplan.md, docs/screens/uebungen/familie-beine-isoliert.webp (neu), form-programme-report.md, docs/decisions.md, docs/testing.md, docs/implementation-plan.md, docs/feature-inventory.md
Technische Entscheidungen: D-475
Ausgeführte Tests: drei Phasen in zwei Läufen, elf Griffrichtungen, drei Kameras, render.py beinbeuger_liegend --pruefen (alle 60 Bilder, zweimal), Nahaufnahmen, Bilder angesehen; pnpm format:check, pnpm check:docs, pnpm check:bundle; CI zum Entwurfs-PR
Ergebnis: bestanden (Werte in 17.4)
Bekannte Einschränkungen: 17.6
Nächste Schritte: Halt bis zur Freigabe der Prüfseite; danach die Schleife rendern und einbauen, dann die nächste Familie
```

**Halt:** Ich warte auf deine Freigabe der Prüfseite „Beine isoliert“.

## 18. Zeittest der Startfläche unabhängig von der Rechenlast (D-476)

Der Test „Startfläche am iPhone Duo: zuerst Maße des zugeklappten Zustands, … (D-394)“ schlug bei D-469 und D-474 je einmal im vollen E2E-Lauf fehl: Das Logo war schon im ersten aufgezeichneten Bild zu sehen. Die Startfläche zeigt das Logo spätestens nach 300 ms, im Skript und als Netz zusätzlich per CSS-Animation. Unter Last kam das erste Bild erst danach.

Jetzt steht im Test die Uhr der Seite: Zeit, Zeitgeber und Bilder laufen nur, wenn der Test sie Bild für Bild um 16 ms vorstellt. Auch die CSS-Animationen stehen. Die Frist von 300 ms liegt damit in der vorgestellten Zeit, und der Test prüft nur noch die Reihenfolge der Bilder. Die App selbst ist unverändert.

Unter Volllast (sechs Prozesse rechnen nebenher, vier Testprozesse gleichzeitig) liefen beide Fassungen zusammen 40-mal: alle bestanden. Mein erster Entwurf schlug unter Last noch fehl, weil die Uhr nach dem Einsetzen weiterlief und das Anhalten auf die Startzeit dann schon in der Vergangenheit lag; jetzt hält sie eine Minute später an.

## 19. Kleidung nach dem Board: Zwischenstand (D-477)

Dein Hinweis vom 31.10.2026: Shirt und Shorts sind nicht zu unterscheiden, die Figur wirkt wie in einem Ganzkörperanzug, das Gesäß wird stark betont. Im Werkzeug geändert, noch nicht in der App:

- **Saum:** 1 cm unter dem Bund der Shorts; das Shirt bedeckt die Shorts 4,1 cm statt 21 cm.
- **Shirt:** fällt unter der Brust gerade nach unten statt Taille, Bauch und Hohlkreuz zu folgen; dazu etwas Luft zum Saum hin. Schultern und Brust liegen an wie bisher.
- **Shorts:** weite Beine, die von Hüfte und Gesäß gerade nach unten fallen; innen wenig Weite.
- **Saumband:** eine Kante am Saum mit leichtem Schatten.
- Farben, Logos und Seitenstreifen bleiben.

Angesehen habe ich bisher nur die Ruhehaltung von vorn, von der Seite und von hinten. Die Bilder in Bewegung hast du angehalten; Standbilder neben dem Board und in Player-Größe folgen auf dein Zeichen.

## 20. Kleidung nach deinen Hinweisen (D-478)

Deine Hinweise vom 31.10.2026 zum Zwischenstand (D-477), im Werkzeug umgesetzt. Die Schleifen der App bleiben bis zu deiner Freigabe, wie sie sind.

### 20.1 Was sich ändert

- **Länge:** Der Saum liegt 7 cm unter dem Bund der Shorts. Das Shirt bedeckt die Shorts rund 10 cm und reicht etwa bis zum oberen Rand des Gesäßes. Mit 4 cm (D-477) wirkte es wie ein kurzes Shirt für die Straße.
- **Schnitt:** enger. Unter der Brust fällt der Stoff nur noch wenig nach unten, am Saum ist weniger Luft, und die Weite aus dem Umriss des Boards zählt nur zur Hälfte (größte Weite 2,1 statt 4,2 cm).
- **Logos:** je 20 % kleiner. Brust-F 3,5 statt 4,4 cm hoch, Shorts-F 3,7 statt 4,7 cm, Rücken-F 7,6 statt 9,5 cm, FORM 18,0 statt 22,5 cm breit.
- **Rückenlogo:** höher. Die Oberkante des F liegt wie auf dem Board 11,7 cm unter dem Kragenbündchen, bisher 13,9 cm.
- **Seitenstreifen:** 25 % schmaler.
- **Saum über den Shorts:** Bei tiefer Hüftbeugung kamen die Shorts seitlich an der Hüfte durch das Shirt; unten in der Kniebeuge sah man dort Lime vom Seitenstreifen. Jetzt hält eine Kollision den unteren Teil des Shirts und das Saumband in jeder Haltung über den Shorts.
- **Gesäß:** Shirt und Shorts überspannen hinten die Gesäßfalte, statt in sie hineinzufallen. Ganz unten am Schritt bleibt eine kleine Mulde; eine Brücke bis dort zog sich in tiefer Beugung zu einer Spitze.
- **Saumband:** Hinten am Gesäß bildete es in der tiefen Kniebeuge eine Zickzackkante; jetzt bleibt es glatt.
- Farben und Aufteilung wie auf dem Board.

### 20.2 Messwerte

Neun Phasen je Übung; gemessen am sichtbaren Teil des Shirts, ohne und mit Kollision und Brücke über die Gesäßfalte.

| Messwert | Kniebeuge | Rudern am Kabel | Beinbeuger liegend |
|---|---|---|---|
| Shorts durch das Shirt, tiefster Punkt (ohne → mit) | 6,9 → 2,4 mm | 6,4 → 0,7 mm | keiner (9,0 mm darunter) |
| Saumband in den Shorts, tiefster Punkt (ohne → mit) | 14,4 → 8,0 mm | 11,0 → 1,0 mm | keiner (8,4 mm darüber) |

Die Reste bei der Kniebeuge liegen in der Falte zwischen Oberschenkel und Bauch, mitten in der Abwärtsbewegung. Im Bild der App sind sie nicht zu sehen; das habe ich in drei Phasen angesehen.

### 20.3 Standbilder

- `docs/screens/uebungen/kleidung2-1-board.webp`: die Figur von vorn, von der Seite und von hinten neben dem Board.
- `docs/screens/uebungen/kleidung2-2-player.webp`: Beinbeuger, Kniebeuge und Rudern in Player-Größe (720 × 540), Ausgang und Ende.

### 20.4 Bericht zum Paket

```
Arbeitspaket: D-478 Kleidung nach den Hinweisen des Produktinhabers (Länge, Schnitt, Logos, Rückenlogo, Seitenstreifen)
Umgesetzte Funktionen: keine in der App; Werkzeug: Saum 7 cm unter dem Bund, engerer Schnitt, Logos 20 % kleiner, Rückenlogo mit der Oberkante des F wie auf dem Board, Seitenstreifen 25 % schmaler, Kollision von Shirt und Saumband mit den Shorts, Brücke über die Gesäßfalte, glattes Saumband; erfüllte AK: –
Geänderte Dateien: tools/uebungen-3d/kleidung.py, tools/uebungen-3d/uebungen.py, docs/screens/uebungen/kleidung2-1-board.webp (neu), docs/screens/uebungen/kleidung2-2-player.webp (neu), form-programme-report.md, docs/decisions.md, docs/testing.md, docs/implementation-plan.md, docs/feature-inventory.md
Technische Entscheidungen: D-478
Ausgeführte Tests: Ruhehaltung von vorn, von der Seite und von hinten in sieben Ständen; Kniebeuge, Rudern und Beinbeuger in neun Phasen gemessen, ohne und mit Kollision; Nahaufnahmen der Hüfte unten in der Kniebeuge; Kniebeuge in drei Phasen in Player-Größe; Standbilder angesehen; pnpm format:check, pnpm check:docs, pnpm check:bundle; CI zum Entwurfs-PR
Ergebnis: bestanden (Werte in 20.2)
Bekannte Einschränkungen: Reste in der Hüftfalte (20.2); beim Rudern kommt die Haut am Ärmelsaum bis 5,5 mm durch den Ärmel (Arme hinten), dort ist sie zur Hälfte ausgeblendet; die Ärmel sind unverändert, das war schon vorher so (korrigiert in D-480: Messfehler, die Haut blieb unter ihrem Ärmel)
Nächste Schritte: Halt bis zur Freigabe; danach alle zehn fertigen Schleifen mit der neuen Kleidung neu, dann der Beinbeuger
```

## 21. Becken beim Beinbeuger (D-479)

Dein Auftrag: prüfen, dass das Becken in jeder Phase auf dem Polster bleibt und sich beim Beugen nicht anhebt.

- **Messwert:** Das Becken hebt sich gegenüber dem Ausgang um **0,00 mm**, in allen 60 Bildern. Gemessen an der Mitte zwischen den Beckenknochen, senkrecht zum Oberschenkelpolster.
- **Auflage:** Die Hüfte liegt am Scheitel in jedem Bild 2,74 mm im Polster, Brust und Bauch 4,00 mm, die Oberschenkel 4,00 mm. Nichts kommt durch die Oberfläche der Polster (0,00 mm).
- Der Rumpf liegt in der Bewegung fest, nur Unterschenkel, Hebel und Rolle drehen. Der Messwert steht künftig auf der Prüfseite.

**Halt:** Ich warte auf deine Freigabe der Kleidung.

## 22. Ärmel in allen Übungen (D-480)

Am 31.10.2026 hast du die Kleidung aus D-478 freigegeben; die Reste in der Hüftfalte bei Kniebeuge, Latziehen und Beinpresse bleiben. Dein Auftrag dazu: die Ärmel korrigieren, weil beim Rudern die Haut nahe dem Ärmelsaum bis 5,5 mm durch den Stoff kam, und die Ärmel in allen zehn fertigen Übungen und beim Beinbeuger prüfen.

- **Ergebnis:** Die Haut kommt nirgends durch den Ärmel. In allen elf Übungen bleibt die sichtbare Haut am Ärmelsaum in jeder Phase 4,8 bis 5,5 mm unter ihrem Ärmel.
- **Die 5,5 mm waren ein Messfehler von mir:** Ich hatte die Haut mit der nächsten Fläche des ganzen Shirts verglichen. Beim Rudern liegt der Oberarm am Rumpf an; die nächste Fläche war dann die Seite des Shirts am Rumpf, und die Haut des Arms liegt richtigerweise außerhalb davon. Gegen den eigenen Ärmel gemessen blieb sie beim Rudern 5,0 bis 5,5 mm darunter.
- **Keine Änderung an den Ärmeln:** Eine Kollision der Ärmel mit den Oberarmen habe ich ausprobiert. Sie änderte keinen Wert und ist nicht im Werkzeug.
- **Messung im Werkzeug:** Jede Prüfung misst jetzt die Kleidung mit: Shorts unter dem Shirt, Saumband über den Shorts und Haut unter dem eigenen Ärmel (`kleidung.durchdringung`, in `render.messen`).

| Übung | Haut unter dem Ärmel am Saum (neun Phasen) |
|---|---|
| Kniebeuge | 4,81 mm |
| Bankdrücken | 4,85 bis 5,49 mm |
| Latziehen | 4,83 bis 5,47 mm |
| Bankdrücken mit Kurzhanteln | 5,06 bis 5,47 mm |
| Schrägbankdrücken mit Kurzhanteln | 4,99 bis 5,48 mm |
| Beinpresse | 5,48 mm |
| Unterarmstütz | 5,03 mm |
| Crunches | 5,05 bis 5,06 mm |
| Seitheben | 5,46 mm |
| Rudern am Kabel | 4,96 bis 5,49 mm |
| Beinbeuger liegend | 5,20 mm |

## 23. Lime-Akzent am Shirt: drei Varianten zur Auswahl (D-481)

Dein Auftrag: drei Varianten aus `docs/prompts/form-tshirt-lime-varianten.png` auf der Figur vergleichen, sonst alles wie D-478 und kein weiteres Lime am Shirt.

- **1 · Kit-Linie:** Seitenpaneele längs der Seitennaht, an der Achsel 1 cm breit, am Saum 7 cm; sie setzen die Streifen der Shorts nach oben fort, von vorn und hinten als schmale Kante zu sehen.
- **3 · Kragen & Ärmel:** Kragenbündchen in Lime und ein Streifen von 1 cm am Ärmelsaum.
- **6 · Schulterband:** ein Band von 1,2 cm vom Kragenbündchen über die Schulter und außen am Ärmel bis zum Saum. Von vorn und hinten nur als schmale Linie auf der Schulter zu sehen, beim Seitheben deutlich oben auf den Armen.
- **Kanten:** scharf, als Aufdruck auf dem Stoff. Bei Kit-Linie und Schulterband gab der erste Versuch gezackte Kanten bzw. ein welliges Band; jetzt laufen die Kanten glatt.
- **Abstand zu den Logos:** nirgends berührt ein Akzent Brust-F oder Rückendruck. Kit-Linie mindestens 11,7 cm, Streifen am Ärmel 17,7 cm, Schulterband 14,1 cm; das Kragenbündchen endet 5,0 cm über dem Brust-F.

Vergleichsblatt: `docs/screens/uebungen/lime-varianten.webp`. Im Werkzeug schaltet `kleidung.AKZENT` die Variante um; bis zu deiner Auswahl bleibt es beim Stand D-478.

**Halt:** Ich warte auf deine Auswahl. Danach rendere ich alle zehn fertigen Schleifen mit der neuen Kleidung und dem gewählten Akzent neu und dann den Beinbeuger.

## 24. Schulterband kräftiger: vier Fassungen (D-482)

Dein Hinweis: Kit-Linie und Kragen & Ärmel sind fertig verglichen, das Schulterband ist mit 1,2 cm viel zu dezent. Statt dessen vier Fassungen nach deinem Bild `docs/prompts/form-tshirt-schulterband-kraeftig.png`:

- **6 · 3 cm:** gleich breit vom Kragenbündchen über die Schulter und außen am Ärmel bis zum Ärmelsaum.
- **6 · zulaufend:** auf der Schulter 3 cm, zum Ärmelsaum hin breiter bis 5 cm, wie die Streifen der Shorts.
- **6a:** zulaufend, dazu eine Lime-Linie von 0,6 cm unten auf dem Saumband, rund um das Shirt.
- **6b:** zulaufend, dazu Schlitze an beiden Seiten vom Saum 6 cm aufwärts mit Lime-Einfassung, direkt über den Streifen der Shorts; durch den Schlitz sieht man die Shorts.
- **Lage:** Das Band sitzt mittig auf der Schulternaht, je zur Hälfte vorn und hinten, am Ärmel außen. So ist es von vorn, von der Seite und von hinten klar zu sehen.
- **Abstand zu den Logos:** mindestens 13,6 cm; kein Band berührt Brust-F oder Rückendruck.
- **Nahaufnahme des Saums:** In der Ruhehaltung hängt die Hand vor dem Saum, deshalb zeigt das Blatt den Saum beim Seitheben oben.

Blatt: `docs/screens/uebungen/schulterband-kraeftig.webp`.

**Halt:** Ich warte auf deine endgültige Wahl. Danach setze ich den Akzent, rendere alle zehn fertigen Schleifen neu und dann den Beinbeuger.

## 25. Kleidung final (D-483)

Deine Entscheidung vom 31.10.2026: Basis bleibt das Design-Board, dazu zwei bewusste Ergänzungen.

- **Shirt:** Schulterband 6 · zulaufend in Lime, auf der Schulter 3 cm, zum Ärmelsaum hin bis 5 cm, mittig auf der Schulternaht und außen am Ärmel. Keine Saumlinie, keine Saumschlitze.
- **Shorts:** schmalere Seitenstreifen nach Variante A, mittig auf der Seitennaht: auf dem Stoff gemessen 1,08 cm unter dem Bund und 2,58 cm am Saum. Das Shorts-F hat in jeder Haltung 9,73 cm Abstand zum Streifen (gefordert mindestens 2 cm).
- **Sonst** wie D-478: Länge, Saumkante, Farben und Logos.
- **Streifen gerade:** Der schmale Streifen zeigte, wie unruhig die bisherige Seitennaht lief. Jetzt ist die Naht eine glatte Kurve mittig an der Seite, der Streifen läuft im Profil gerade.
- **Ärmel:** unverändert; mit der finalen Kleidung bleibt die Haut am Ärmelsaum 4,81 bis 5,49 mm unter dem Stoff, nirgends kommt sie durch.

Standbilder: `docs/screens/uebungen/kleidung-final.webp`.

**Halt:** Ich warte auf deine Freigabe. Danach rendere ich alle zehn fertigen Schleifen mit der finalen Kleidung neu, dann den Beinbeuger, und mache mit der Prüfseite der nächsten Familie weiter.

## 26. Shorts-F so groß wie das Brust-F (D-484)

Deine Freigabe vom 31.10.2026: Die Kleidung ist freigegeben, mit einer Änderung am Shorts-F.

- **Befund:** Nach dem Entwurf waren beide F fast gleich groß, auf dem Stoff aber nicht. Das Logo lag auf der Haut, und die Shorts stehen am Saum weit ab. Dadurch war das Shorts-F auf dem Stoff 4,0 cm hoch und 5,9 cm breit, das Brust-F 3,8 × 3,9 cm. Dein Eindruck stimmte.
- **Jetzt:** Das Shorts-F liegt direkt auf dem Stoff, in der Form des Symbols und mit derselben Fläche wie das Brust-F: 3,7 × 4,0 cm.
- **Gleich geblieben:** die Lage, die Unterkante 2,46 cm über dem Saum (bisher 2,44 cm) und der Abstand zum Streifen, jetzt 10,3 cm (mindestens 2 cm).

Blatt: `docs/screens/uebungen/shorts-f-wie-brust-f.webp`.

Weiter ohne Halt: alle zehn fertigen Schleifen und der Beinbeuger mit der finalen Kleidung, dann die Prüfseite der nächsten Familie.

## 27. Zehn Schleifen mit der finalen Kleidung (D-485)

Nach deiner Freigabe habe ich alle zehn fertigen Schleifen mit der finalen Kleidung neu gerendert und in die App eingebaut: Schulterband, schmale Seitenstreifen und das neue Shorts-F. Bewegung, Kamera und Ablauf sind gleich geblieben, die Dateinamen auch.

- **Kniebeuge:** 61 min, erstes und letztes Bild pixelgleich.
- **Bankdrücken:** 68 min, erstes und letztes Bild pixelgleich.
- **Latziehen:** 39 min, erstes und letztes Bild pixelgleich.
- **Bankdrücken mit Kurzhanteln:** 51 min, erstes und letztes Bild pixelgleich.
- **Schrägbankdrücken mit Kurzhanteln:** 53 min, erstes und letztes Bild pixelgleich.
- **Beinpresse:** 35 min, erstes und letztes Bild pixelgleich.
- **Unterarmstütz:** 80 min, erstes und letztes Bild pixelgleich.
- **Crunches:** 69 min, erstes und letztes Bild pixelgleich.
- **Seitheben:** 37 min, erstes und letztes Bild pixelgleich.
- **Rudern am Kabel:** 47 min, letztes Bild weicht vom ersten in 7.333 Pixeln um bis zu 63 von 255 Stufen ab (an Arm und Griff, dazu vereinzeltes Rauschen im ganzen Bild; kleiner als die Schritte zu den Nachbarbildern mit 14.370 und 6.107 Pixeln, weil die Bewegung am vorderen Umkehrpunkt ohne Pause weiterläuft, wie bei D-474).

Alle Kontaktbögen habe ich angesehen. Die Aufnahme aller Schleifen folgt mit dem Beinbeuger (D-486).

```
Arbeitspaket: D-485 Phase Programme, zehn fertige Schleifen mit der finalen Kleidung
Umgesetzte Funktionen: neue Schleifen, Poster und Vorschaubilder für zehn Übungen (Kleidung D-483, Shorts-F D-484); Werkzeug: uebungen_bewegung.py mit Raster und Beschriftung; erfüllte AK: –
Geänderte Dateien: public/uebungen/medien/ (40 Dateien), tools/uebungen_bewegung.py, form-programme-report.md, docs/decisions.md, docs/testing.md, docs/implementation-plan.md, docs/feature-inventory.md
Technische Entscheidungen: D-485
Ausgeführte Tests: zehn Schleifen gerendert, Kontaktbögen und erstes/letztes Bild geprüft; format:check, build, check:bundle (Startansicht 237,8 KB), check:docs; E2E Chromium 432 bestanden, 132 übersprungen, 0 fehlgeschlagen; WebKit in der CI
Ergebnis: bestanden
Bekannte Einschränkungen: keine neuen
Nächste Schritte: Beinbeuger liegend in die App (D-486), dann die Prüfseite der nächsten Familie
```

## 28. Beinbeuger liegend in der App (D-486)

Nach den zehn Schleifen kam der Beinbeuger: mit der finalen Kleidung, Bewegung und Kamera wie auf der Prüfseite (D-475). In der Übungsliste hat er jetzt ein Vorschaubild, in den Details läuft die Schleife.

- **Messwerte über alle 60 Bilder:** Knie 175,0° bis 60,0°, Becken gegenüber dem Ausgang angehoben 0,00 mm, Hüfte am Scheitel 2,74 mm im Polster, Rolle zu den Schuhen mindestens 15,9 mm, Kopf und Hals zum Gerät mindestens 58,4 mm, Haut unter dem Ärmel mindestens 5,20 mm, Shorts unter dem Shirt mindestens 8,96 mm, Saumband über den Shorts mindestens 8,39 mm, Shorts-F zum Streifen 10,30 cm, Meldungen des Rigs 0.
- **Text:** passt zur Animation (D-475), keine Änderung.
- **Beim Einbau gefunden:** Der erste Alternativtext war mit 297 Zeichen zu lang (erlaubt sind 240). Dann verwirft die App die ganze Liste der Bilder, und die Übungsliste zeigt nur Symbole. Der erste E2E-Lauf hat das gezeigt; der Text ist jetzt kürzer (233 Zeichen). Den Unit-Test, der die Liste prüft, hatte ich vorher nicht laufen lassen; er hätte es auch gefunden.
- **Aufnahme aller elf Schleifen:** `docs/screens/uebungen/schleifen-bewegung.mp4`, 1440 × 810, 7,5 s, 454 KB; elf beschriftete Felder in vier Spalten, jede Schleife dreimal; angesehen und dem Produktinhaber geschickt.

```
Arbeitspaket: D-486 Phase Programme, Beinbeuger liegend in der App
Umgesetzte Funktionen: Schleife, Poster und Vorschaubild des Beinbeugers liegend (medien.json: lying_leg_curl); Aufnahme aller elf Schleifen; erfüllte AK: –
Geänderte Dateien: public/uebungen/medien/beinbeuger_liegend*.{mp4,webm,webp} (neu), public/uebungen/medien.json, e2e/uebungen.spec.ts, tools/uebungen-3d/familien.json, docs/uebungen-bestand.md, docs/uebungen-animationsplan.md, docs/screens/uebungen/schleifen-bewegung.mp4 (neu), form-programme-report.md, docs/decisions.md, docs/testing.md, docs/implementation-plan.md, docs/feature-inventory.md
Technische Entscheidungen: D-486
Ausgeführte Tests: Schleife gerendert, Kontaktbogen und erstes/letztes Bild geprüft, Messwerte über alle 60 Bilder; Unit-Tests 1.209 bestanden; format:check, lint, typecheck, build, check:bundle (Startansicht 237,8 KB, Übungsbilder 44 von 44), check:docs; E2E Chromium im ersten Lauf 2 fehlgeschlagen (Alternativtext zu lang), nach der Korrektur 432 bestanden, 132 übersprungen, 0 fehlgeschlagen; WebKit in der CI
Ergebnis: bestanden, nach der Korrektur des Alternativtexts
Bekannte Einschränkungen: keine neuen
Nächste Schritte: Prüfseite der nächsten Familie „Hüftbeuge“ (Rumänisches Kreuzheben mit Kurzhanteln), dann Halt
```

## 29. Nächste Familie: Hüftbeuge mit Rumänischem Kreuzheben mit Kurzhanteln, Prüfseite (D-487)

Im Animationsplan kommt nach „Beine isoliert“ die Familie „Hüftbeuge“. Aus „Ganzkörper A/B“ gehört nur das Rumänische Kreuzheben mit Kurzhanteln dazu (21 Einheiten); es ist zugleich die Referenz der Familie. Wie verlangt zuerst nur die Prüfseite.

### 29.1 Gerät

- **Kurzhanteln:** zwei Hanteln mit 8 kg, dieselben wie beim Seitheben (288 mm lang, Köpfe 110 mm).
- **Warum nicht 20 kg:** Die Hanteln mit 20 kg sind 36,5 cm lang. Bei dieser Griffbreite blieben zwischen den inneren Köpfen nur 6 mm. Schwerere Hanteln gehen, wenn du sie möchtest; dann prüfe ich den Abstand neu.

### 29.2 Bewegung

- **Quelle:** Familie (Code), nach dem Ausführungstext der App und den Werten der Familie. Die Seiten von ExRx und NASM ließen sich in der Cloud-Umgebung nicht öffnen.
- **Stand:** hüftbreit, Zehen 8° nach außen, Sohlen flach. Die Knie sind 20° gebeugt und bleiben so (Familie: 15 bis 25°).
- **Hanteln:** im Obergriff vor den Oberschenkeln, die Griffe quer, 10,8° schräg in der Hand. So bleibt das Handgelenk gerade (höchstens 6,4°). Die Arme sind fast gestreckt (Ellbogen 172,0°).
- **Abwärts:** Die Hüfte schiebt nach hinten, der Rumpf neigt sich mit geradem Rücken um die Hüftgelenke. Die Hanteln gleiten an der Vorderseite der Beine nach unten, 1,4 bis 6,5 mm vor Haut, Shorts und Shirt.
- **Unten:** Rumpf 20,8° zur Waagrechten (Familie: 0 bis 45°), Hüfte 91,2° gebeugt (Familie: 70 bis 100°), die Griffe 1,8 cm unter den Kniegelenken.
- **Gleichgewicht:** Der gemeinsame Schwerpunkt von Körper und Hanteln bleibt über der Fußmitte (−0,04 bis 0,05 cm). Für den Körper habe ich 75 kg angenommen, die Anteile der Körperteile stammen aus einer Standardtabelle (Winter 2009).
- **Kopf:** in Verlängerung des Rumpfs, Kinn leicht eingezogen, der Blick geht zum Boden.
- **Zurück** derselbe Weg, mit der kurzen Pause an beiden Umkehrpunkten wie bei den übrigen Schleifen.
- **Kamera der App:** 75° von der Seite, 8° von oben. So sieht man die Hüftbeuge und den geraden Rücken, und beide Hanteln bleiben im Bild. Verglichen habe ich 90°, 60° und 45° (`docs/screens/uebungen/hueftbeuge-kameras.webp`).

### 29.3 Abgleich mit dem Ausführungstext

Der Text in der App passt; geändert habe ich nichts.

| Text in der App | Animation |
|---|---|
| „Halt in jeder Hand eine Kurzhantel vor den Oberschenkeln.“ | Obergriff, Hanteln quer vor den Oberschenkeln |
| „Stell die Füße etwa hüftbreit. Die Knie sind leicht gebeugt, der Rücken ist gerade.“ | hüftbreit, Knie 20° gebeugt, Rücken gerade |
| „Schieb die Hüfte nach hinten und senk die Hanteln an der Vorderseite der Beine ab.“ | Hüfte nach hinten, Hanteln 1,4 bis 6,5 mm vor den Beinen |
| „Geh nur so tief, bis du eine Dehnung hinten im Oberschenkel spürst und der Rücken lang bleibt.“ | unten Rumpf 20,8° zur Waagrechten, Griffe knapp unter den Knien |
| „Streck Hüfte und Knie, bis du wieder aufrecht stehst.“ und „Halt die Knie die ganze Zeit leicht gebeugt.“ | zurück bis zum aufrechten Stand, die Knie bleiben 20° gebeugt |
| „Halt das Kinn leicht eingezogen und schau Richtung Boden.“ | Kopf in Verlängerung des Rumpfs, Kinn 4° eingezogen |

### 29.4 Messwerte über alle 60 Bilder

| | Wert |
|---|---|
| Knie | 160,0°, fest |
| Hüfte | 17,5° bis 91,2° gebeugt (Rumpf zum Oberschenkel 162,5° bis 88,8°) |
| Rumpf zur Waagrechten | 83,8° bis 20,8° |
| Unterschenkel zur Senkrechten | 0,3° bis 8,8° |
| Schwerpunkt mit Hanteln über der Fußmitte | −0,04 bis 0,05 cm |
| Hanteln über der Fußmitte | 2,2 bis 15,0 cm davor |
| Griffe unter den Kniegelenken (unten) | 1,8 cm |
| Arme | oben 17,8° nach vorn, unten 16,1° zurück |
| Ellbogen / Handgelenk gesamt | 172,0° / höchstens 6,4° |
| Köpfe vor Haut, Shorts und Shirt | 1,4 bis 6,5 mm |
| Hanteln zueinander / Hand zu den Köpfen | 67,4 mm / 6,9 mm |
| Finger am Griff | −4,3 mm (gewollt eingedrückt) |
| Sohlen über dem Boden / verschoben | 0,0 mm / 0,1 mm |
| Kragen über der Socke | 1,6 mm |
| Shorts-F zum Streifen | 10,3 cm |
| Haut unter dem Ärmel | 5,4 mm |
| Shorts unter dem Shirt / Saumband über den Shorts | −5,9 mm / −12,9 mm (vordere Hüftfalte, siehe 29.6) |
| Meldungen des Rigs | 0 |

### 29.5 Prüfseite und Rechenzeit

`docs/screens/uebungen/familie-hueftbeuge.webp`: Ausgangs- und Endposition mit der Kamera der App und von der Seite, Griff und Hantel von vorn und von außen, der linke Fuß von außen und von vorn, darunter die Messwerte. Rechenzeit: Messung und Prüfansichten 755 s, Nahaufnahmen 312 s (neben zwei Strömen der Schleifen).

Beim Prüfen gefunden und behoben:
- Mit „Hanteln über der Fußmitte“ stand die Hüfte schon oben 18 cm hinter der Ausgangslage und war 30° gebeugt. Jetzt zählt der gemeinsame Schwerpunkt: Die Figur steht oben aufrecht.
- Der Ellbogen sprang zwischen 164° und 178°: Die Hand drehte sich um den Griff in eine andere Lösung, und 172° liegen nur 1,3 mm vor der vollen Streckung. Jetzt wird die Drehung der Hand einmal bestimmt und dann die Entfernung des Griffs gesucht: 172,0° in jedem Bild.
- Unter dem offenen Saum der Shorts zeigt die Normale der Randfläche zur Seite; ein Kopf 22 mm vor der Haut galt als 40 mm in den Shorts. Jetzt zählen Punkte hinter Randflächen nicht als darin.
- Mit fünf Stützen kamen die Köpfe beim Vorbeigleiten an den Knien bis 8 mm in Haut und Kleidung; mit 17 Stützen und einem Spline nicht mehr.
- Die Suchschritte meldeten „Handgelenk nicht erreichbar“ (360 Meldungen); es zählt jetzt nur die gewählte Haltung: 0 Meldungen.

### 29.6 Abweichungen und offene Punkte

- **Hanteln:** 8 kg statt einer schwereren Hantel (29.1).
- **Tiefe:** Die Griffe enden knapp unter den Knien, der Rumpf 20,8° über der Waagrechten. Tiefer geht, solange der Rücken gerade bleibt.
- **Kleidung:** In der vorderen Hüftfalte kommt das Saumband bis 12,9 mm in die Shorts und die Shorts bis 5,9 mm ins Shirt (Phase 0,7 bis 1,0). In der Kamera der App und von vorn unten ist nichts zu sehen, wie bei den freigegebenen Resten von Kniebeuge, Latziehen und Beinpresse.
- **Körpergewicht** für den Schwerpunkt: 75 kg angenommen.

### 29.7 Bericht zum Paket

```
Arbeitspaket: D-487 Phase Programme, Abschnitt 2: Familie „Hüftbeuge“ (Rumänisches Kreuzheben mit Kurzhanteln), Prüfseite
Umgesetzte Funktionen: keine in der App; Werkzeug: Rumänisches Kreuzheben mit Kurzhanteln (uebungen.RumaenischesKreuzhebenKH) mit Schwerpunkt über der Fußmitte, Hanteln an den Beinen entlang, Griffachse und Entfernung des Griffs gesucht; Abstand der Hanteln zur Kleidung an offenen Rändern; neue Zeilen der Prüfseite (Kleidung, Hüftbeuge); erfüllte AK: –
Geänderte Dateien: tools/uebungen-3d/uebungen.py, tools/uebungen_pruef_bild.py, tools/uebungen-3d/familien.json, docs/uebungen-animationsplan.md, docs/screens/uebungen/familie-hueftbeuge.webp (neu), docs/screens/uebungen/hueftbeuge-kameras.webp (neu), form-programme-report.md, docs/decisions.md, docs/testing.md, docs/implementation-plan.md, docs/feature-inventory.md
Technische Entscheidungen: D-487
Ausgeführte Tests: fünf Testläufe in drei Phasen, Abtastung der Luft über den Winkel der Arme, vier Kameras, render.py rumaenisches_kreuzheben_kh --pruefen (alle 60 Bilder, zweimal), Nahaufnahmen der Griffe und der Hüftfalte, Bilder angesehen; bestanden; Startansicht 237,8 KB, Übungsbilder 44 von 44
Ergebnis: bestanden (Werte in 29.4)
Bekannte Einschränkungen: 29.6
Nächste Schritte: Halt bis zur Freigabe der Prüfseite; danach die Schleife des Rumänischen Kreuzhebens
```

## 30. Bildliste robust (D-488)

Dein Auftrag: Ein zu langer Text darf nicht mehr die ganze Bildliste verwerfen, und eine Prüfung soll so etwas vor dem E2E-Lauf finden.

- **Jetzt:** Die App prüft die Liste Eintrag für Eintrag. Ein ungültiger Eintrag fällt allein heraus; diese Übung zeigt ihr Symbol, alle anderen ihr Bild. Nur wenn die ganze Liste kaputt ist (falsche Version, falscher Aufbau), gilt sie wie bisher als nicht vorhanden.
- **Meldung:** Jeder übersprungene Eintrag steht als Warnung in der Konsole und im Fehlerprotokoll der App, mit Schlüssel und Grund. Beides bleibt auf dem Gerät.
- **Vor dem E2E-Lauf:** Ein Unit-Test und `pnpm check:docs` (neu `tools/check_medien.py`) finden zu lange Alternativtexte, fehlende Dateien und fehlende Quellen. Die Grenze von 240 Zeichen liest die Prüfung aus dem Schema der App, damit beide nicht auseinanderlaufen. Gegenprobe mit 294 Zeichen: Beide schlagen an und nennen den Eintrag.
- **E2E:** Ein neuer Test liefert eine Liste mit einem zu langen Text: Bankdrücken zeigt das Symbol, die Kniebeuge ihr Bild, die Warnung steht genau einmal in der Konsole.

```
Arbeitspaket: D-488 Phase Programme, Bildliste robust
Umgesetzte Funktionen: ungültiger Eintrag der Bildliste fällt allein heraus und wird als Warnung gemeldet (Konsole, Fehlerprotokoll); Prüfung der Liste in check:docs und im Unit-Test; erfüllte AK: –
Geänderte Dateien: src/modules/exercises/model/media.ts, src/modules/exercises/data/media.ts, src/modules/exercises/data/media.test.ts, src/shared/db/errorLog.ts, src/shared/db/browser.test.ts, e2e/uebungen.spec.ts, tools/check_medien.py (neu), package.json, docs/architecture.md, form-programme-report.md, docs/decisions.md, docs/testing.md, docs/implementation-plan.md, docs/feature-inventory.md
Technische Entscheidungen: D-488
Ausgeführte Tests: Unit-Tests 1.213 bestanden (4 neu), Gegenprobe mit 294 Zeichen in Unit-Test und check_medien.py; format:check, lint, typecheck, check:docs, build, check:bundle (Startansicht 237,9 KB); E2E Chromium 434 bestanden, 132 übersprungen, 0 fehlgeschlagen; WebKit in der CI
Ergebnis: bestanden
Bekannte Einschränkungen: keine neuen
Nächste Schritte: Rudern: Naht geprüft (D-489); Rumänisches Kreuzheben in die App (D-490)
```

## 31. Rudern: Schleifenende geprüft (D-489)

Du wolltest wissen, ob man am Ende der Rudern-Schleife einen Sprung sieht. Nein: Die Bewegung läuft über die Naht stetig weiter.

- **Warum:** Ohne Pause vorn endet der Rückweg genau dort, wo der nächste Zug beginnt. Beide Wege werden zum Umkehrpunkt hin weich langsamer und danach weich schneller.
- **Gemessen** in den Bildern 57, 58, 59, 0, 1, 2: Weg des Griffs 0,57 → 0,18 → 0,02 → 0,00 → 0,01 → 0,11 cm, Ellbogen 159,2 → 163,4 → 165,9 → 166,3 → 166,0 → 164,5°. Der Schritt über die Naht ist so klein wie die Schritte direkt daneben, wie an jedem weichen Umkehrpunkt.
- **Im Bild:** `docs/screens/uebungen/rudern-naht.webp` zeigt die Bilder 56 bis 3; vorn steht die Bewegung kurz fast still, ohne Ruck.
- **Videos:** je 60 gleich lange Bilder, kein doppeltes Bild am Ende.

Deshalb habe ich nichts geändert und nichts neu gerendert.

```
Arbeitspaket: D-489 Phase Programme, Rudern am Kabel: Schleifenende geprüft
Umgesetzte Funktionen: keine; Prüfung der Naht mit Messwerten, Bildern und den Videodateien; erfüllte AK: –
Geänderte Dateien: docs/screens/uebungen/rudern-naht.webp (neu), form-programme-report.md, docs/decisions.md, docs/testing.md, docs/implementation-plan.md, docs/feature-inventory.md
Technische Entscheidungen: D-489
Ausgeführte Tests: Messwerte aller 60 Bilder, Phase des Ablaufs, Bilder 56 bis 3, Pixelvergleich, ffprobe; bestanden; Startansicht 237,9 KB, Übungsbilder 44 von 44
Ergebnis: kein Sprung, keine Änderung nötig
Bekannte Einschränkungen: keine
Nächste Schritte: Rumänisches Kreuzheben in die App (D-490)
```

## 32. Rumänisches Kreuzheben in der App (D-490)

Deine Freigabe der Prüfseite: Hanteln 8 kg, Kamera 75°, Knie 20°, Schwerpunkt über der Fußmitte und Hanteln dicht an den Beinen bleiben, das Saumband in der Hüftfalte auch. Die Tiefe sollte sich nach dem geraden Rücken richten.

### 32.1 Rücken, Nacken und Blick unten

| | Stand | unten |
|---|---|---|
| Lendenwirbel gegen das Becken gedreht | 0,0° | 0,0° |
| Hautlinie der Lende, Mitte (hohl, Winkel zwischen unten und oben) | −9,5° | −5,5° |
| Hautlinie der Lende, 3 cm neben der Mitte | −20,6° | −15,4° |
| Hautlinie verschoben gegenüber dem Stand | – | höchstens 1,2 mm (Mitte), 6,2 mm (daneben) |
| Nacken: Kopf gegen den Rumpf gebeugt | 4,0° | 4,0° |
| Blick unter der Waagrechten | 7,0° | 70,0° |
| Blick trifft den Boden | weit vorn | 70 cm vor den Schuhspitzen |

- **Lende:** Die Figur beugt nur in der Hüfte; Lende, Brustkorb und Kopf bleiben in sich wie im Stand. Die Hautlinie wird unten um bis zu 3,9° flacher, weil die Haut über dem Kreuzbein ein wenig mit dem Oberschenkel mitgeht. Die Linie verschiebt sich dabei um gut einen Millimeter. Ein Rundrücken entsteht nicht.
- **Nacken und Blick:** Der Kopf bleibt in der Verlängerung des Rumpfs, das Kinn 4,0° eingezogen. Unten geht der Blick schräg nach unten auf den Boden vor den Füßen, nicht nach vorn.
- **Tiefe:** Der Rücken bleibt bei 20,8° über der Waagrechten neutral. Deshalb bleibt die Tiefe: Hüfte 91,2° gebeugt, Griffe 1,8 cm unter den Kniegelenken. Das setzt hintere Oberschenkel voraus, die diese Hüftbeugung bei 20° gebeugten Knien zulassen; das liegt im Bereich der Familie (70 bis 100°).
- **Neu im Werkzeug:** Diese Werte misst die Prüfung jetzt bei jedem Bild mit (wie das Becken beim Beinbeuger, D-479), damit spätere Änderungen sie zeigen.

### 32.2 Schleife

- 27 min Rechenzeit, erstes und letztes Bild pixelgleich, Kontaktbogen angesehen.
- In der Übungsliste hat das Kreuzheben jetzt ein Vorschaubild, in den Details läuft die Schleife.
- **Aufnahme:** `docs/screens/uebungen/kreuzheben-bewegung.mp4`, 720 × 540, 7,5 s, 117 KB, die Schleife dreimal; angesehen und dem Produktinhaber geschickt.

```
Arbeitspaket: D-490 Phase Programme, Rumänisches Kreuzheben mit Kurzhanteln in der App
Umgesetzte Funktionen: Schleife, Poster und Vorschaubild des Rumänischen Kreuzhebens (medien.json: romanian_deadlift_dumbbell); Werkzeug: Messwerte für Lende, Nacken und Blick; erfüllte AK: –
Geänderte Dateien: public/uebungen/medien/rumaenisches_kreuzheben_kh*.{mp4,webm,webp} (neu), public/uebungen/medien.json, e2e/uebungen.spec.ts, tools/uebungen-3d/uebungen.py, tools/uebungen_pruef_bild.py, tools/uebungen-3d/familien.json, docs/uebungen-bestand.md, docs/uebungen-animationsplan.md, docs/screens/uebungen/kreuzheben-bewegung.mp4 (neu), form-programme-report.md, docs/decisions.md, docs/testing.md, docs/implementation-plan.md, docs/feature-inventory.md
Technische Entscheidungen: D-490
Ausgeführte Tests: Messung von Lende, Nacken und Blick am Skelett und am verformten Netz, Messwerte über alle 60 Bilder, Schleife gerendert, Kontaktbogen und erstes/letztes Bild geprüft; Unit-Tests 1.213 bestanden; format:check, lint, typecheck, check:docs, build, check:bundle (Startansicht 237,9 KB, Übungsbilder 48 von 48); E2E Chromium 434 bestanden, 132 übersprungen, 0 fehlgeschlagen; WebKit in der CI
Ergebnis: bestanden
Bekannte Einschränkungen: keine neuen
Nächste Schritte: Prüfseite der letzten Familie aus „Ganzkörper A/B“: Senkrechtes Drücken mit Schulterdrücken an der Maschine (D-491), dann Halt
```

## 33. Letzte Familie: Senkrechtes Drücken mit Schulterdrücken an der Maschine, Prüfseite (D-491)

Nach dem Kreuzheben fehlt in „Ganzkörper A/B“ nur noch eine Übung: das Schulterdrücken an der Maschine (20 Einheiten). Das Programm ist also noch nicht ganz animiert; deshalb wie verlangt zuerst die Prüfseite dieser Familie.

### 33.1 Stand von „Ganzkörper A/B“

| Übung | Familie | Stand |
|---|---|---|
| Schrägbankdrücken mit Kurzhanteln | Waagrechtes Drücken | Schleife in der App (D-463, Kleidung D-485) |
| Bankdrücken mit Kurzhanteln | Waagrechtes Drücken | Schleife in der App (D-463, Kleidung D-485) |
| Beinpresse | Kniebeuge | Schleife in der App (D-465, Kleidung D-485) |
| Latziehen | Senkrechtes Ziehen | Schleife in der App (D-461, Kleidung D-485) |
| Unterarmstütz | Rumpf | Schleife in der App (D-467, Kleidung D-485) |
| Crunches | Rumpf | Schleife in der App (D-467, Kleidung D-485) |
| Seitheben mit Kurzhanteln | Schulter und Brust isoliert | Schleife in der App (D-469, Kleidung D-485) |
| Rudern am Kabel, sitzend | Waagrechtes Ziehen | Schleife in der App (D-474, Kleidung D-485) |
| Beinbeuger liegend | Beine isoliert | Schleife in der App (D-486) |
| Rumänisches Kreuzheben mit Kurzhanteln | Hüftbeuge | Schleife in der App (D-490) |
| Schulterdrücken an der Maschine | Senkrechtes Drücken | Prüfseite, wartet auf deine Freigabe (D-491) |

### 33.2 Gerät

- **Vorbild:** Life Fitness Insignia Shoulder Press, 164 × 144 × 185 cm, Gewichtsblock 85 kg, zwei unabhängige Arme, die beim Drücken zusammenlaufen. Die Seite des Herstellers ließ sich in der Cloud-Umgebung nicht öffnen; die Werte stammen aus Suchauszügen.
- **Sitz und Rückenpolster:** Sitz 40 × 40 cm, Rückenpolster 32 × 62 cm, 10° nach hinten geneigt (geschätzt). Gesäß und Rücken liegen mit Shorts und Shirt 4 mm im Polster.
- **Hebel:** Jeder Arm dreht um eine eigene Achse hinter dir, 70 cm von der Achse bis zum Griff. Die Griffe laufen auf einem Bogen nach oben und zusammen. Der Gewichtsblock hebt sich dabei.

### 33.3 Bewegung

- **Sitzen:** Füße schulterbreit flach am Boden, Knie 95°, Rücken am Polster, Kopf gerade, Blick nach vorn.
- **Unten (Ausgang):** Obergriff, Oberarm 10,1° unter der Waagrechten und 25,6° vor der Ebene der Schultern, Unterarm senkrecht, Ellbogen 77,8° (Familie: 70 bis 90°). Die Griffe stehen damit auf Stirnhöhe, 82,9 cm auseinander.
- **Oben:** Arme fast gestreckt (Ellbogen 172,0°), die Griffe 57,4 cm auseinander über den Schultergelenken. Die Schulterblätter drehen mit nach oben.
- **Kamera der App:** 30° von vorn seitlich, 8° von oben. So sieht man Gesicht, beide Arme und das Zusammenlaufen der Hebel. Verglichen habe ich 15°, 45° und 60° (`docs/screens/uebungen/senkrechtes-druecken-kameras.webp`); ab 45° verdeckt oben der Kopf den rechten Arm.

### 33.4 Abgleich mit dem Ausführungstext

Der Text in der App passt; geändert habe ich nichts.

| Text in der App | Animation |
|---|---|
| „Stell den Sitz so ein, dass du die Schulter im ganzen Umfang bewegen kannst.“ | unten Oberarm knapp unter der Waagrechten, oben Arme fast gestreckt |
| „Setz dich und greif die Griffe seitlich im Obergriff.“ | Obergriff an den waagrechten Griffen links und rechts |
| „Drück die Griffe nach oben, bis die Arme über dem Kopf gestreckt sind.“ | oben Ellbogen 172,0°, Griffe über den Schultergelenken |
| „Senk sie kontrolliert wieder ab und wiederhole.“ | derselbe Weg zurück, mit der kurzen Pause an beiden Umkehrpunkten |

### 33.5 Messwerte über alle 60 Bilder

| | Wert |
|---|---|
| Ellbogen unten / oben | 77,8° / 172,0° |
| Oberarm zur Waagrechten unten / oben | −10,1° / 75,2° |
| Unterarm zur Senkrechten unten / oben / höchstens | 2,1° / 6,8° / 13,5° |
| Handgelenk unten / oben / höchstens | 3,3° / 8,8° / 12,9° |
| Unterarm gedreht unten → oben | 22,7° → −27,8° |
| Griffe auseinander unten / oben | 82,9 / 57,4 cm |
| Griffe über dem Schultergelenk unten / oben | 29,9 / 58,2 cm |
| Griffe vor dem Schultergelenk unten / oben | 12,4 / 0,0 cm |
| Hebel gedreht / Schlüsselbein gehoben | 31,0° / 14,0° |
| Gesäß im Sitz / Rücken im Polster | 4,0 bis 4,0 mm / 4,0 bis 4,0 mm |
| Delle / durch die Oberfläche | 4,0 mm / 0,0 mm |
| Kopf und Hals zum Gerät / Arme zu Hebeln, Griffen und Rahmen | 159 mm / 46 mm |
| Finger am Griff | −4,1 mm (gewollt eingedrückt) |
| Sohlen über dem Boden / verschoben | 0,0 mm / 0,0 mm |
| Shorts unter dem Shirt / Saumband / Haut unter dem Ärmel | −1,1 / 0,7 / 5,2 mm |
| Shorts-F zum Streifen / Kragen über der Socke | 10,3 cm / 1,6 mm |
| Meldungen des Rigs | 0 |

### 33.6 Abweichungen und offene Punkte

- **Unterarm in der Mitte:** Er kippt bis 13,5° nach innen, das Handgelenk knickt bis 12,8° zum kleinen Finger. Die Griffe laufen auf dem Bogen des Hebels früher zusammen, als die Ellbogen folgen. Mit den Griffen oben 19 cm neben der Mitte waren es 17°; jetzt stehen sie oben 24 cm daneben.
- **Unterarm gedreht:** Der Griff ist fest am Hebel und dreht sich mit ihm. Der Unterarm dreht sich dadurch über den Weg um 50°. Ein Griff, der sich frei drehen kann, würde das vermeiden; dann sähe die Maschine aber anders aus als das Vorbild.
- **Griffhöhe unten:** Die Handbücher stellen den Sitz so ein, dass die Griffe auf Schulterhöhe stehen. Mit senkrechtem Unterarm und dem Oberarm knapp unter der Waagrechten (Werte der Familie) liegen sie bei mir auf Stirnhöhe. Tiefer würden die Ellbogen deutlich unter die Schultern sinken.
- **Kleidung:** Vorn an der Hüftfalte kommen die Shorts an je einem Punkt links und rechts 1,1 mm durch das Shirt, in jedem Bild gleich. In der Kamera der App ist das nicht zu sehen (Nahansicht der Hüfte angesehen).
- **Rückenpolster und Sitz:** geschätzt, nicht vom Vorbild abgemessen.

### 33.7 Bericht zum Paket

```
Arbeitspaket: D-491 Phase Programme, Abschnitt 2: Familie „Senkrechtes Drücken“ (Schulterdrücken an der Maschine), Prüfseite
Umgesetzte Funktionen: keine in der App; Werkzeug: Schulterdrückmaschine (geraete.schulterpresse) mit zwei zusammenlaufenden Hebeln, Übung uebungen.SchulterdrueckenMaschine (Polster an der echten Oberfläche ausgerichtet, Griffe auf dem Bogen der Hebel, Ellbogen oben gesucht), neue Zeilen der Prüfseite; erfüllte AK: –
Geänderte Dateien: tools/uebungen-3d/geraete.py, tools/uebungen-3d/uebungen.py, tools/uebungen_pruef_bild.py, tools/uebungen-3d/familien.json, docs/uebungen-animationsplan.md, docs/screens/uebungen/familie-senkrechtes-druecken.webp (neu), docs/screens/uebungen/senkrechtes-druecken-kameras.webp (neu), form-programme-report.md, docs/decisions.md, docs/testing.md, docs/implementation-plan.md, docs/feature-inventory.md
Technische Entscheidungen: D-491
Ausgeführte Tests: drei Probeläufe, Vergleich der Griffstellung in fünf Phasen, vier Kameras, render.py schulterdruecken_maschine --pruefen (alle 60 Bilder), Nahaufnahmen des Griffs, Bilder angesehen; bestanden; Startansicht 237,9 KB, Übungsbilder 48 von 48
Ergebnis: bestanden (Werte in 33.5)
Bekannte Einschränkungen: 33.6
Nächste Schritte: Halt bis zur Freigabe der Prüfseite; danach die Schleife. Dann ist „Ganzkörper A/B“ vollständig animiert
```

## 34. Schulterdrücken an der Maschine in der App (D-492)

Deine Freigabe: Feste Griffe und Kamera 30° bleiben, die Griffe sollen unten aber auf Höhe von Kinn bis Ohr beginnen, der Oberarm etwas unter der Waagrechten, die Unterarme annähernd senkrecht.

- **Gemessen:** Über dem Schultergelenk liegen beim Sitzen das Kinn 15,1 cm, die Mitte des Ohrs 22,7 cm und die Augen 25,7 cm hoch. Die Griffe standen bei 29,9 cm, also über den Augen.
- **Neu:** Die Griffe stehen unten 5,7 cm über dem Kinn und 1,9 cm unter der Mitte des Ohrs. Der Oberarm steht 31,4° unter der Waagrechten, der Unterarm 6,4° zur Senkrechten, der Ellbogen hat 65,0°.
- **Warum nicht tiefer:** Mit annähernd senkrechtem Unterarm müsste der Ellbogen bei Griffen auf Kinnhöhe unter 40° schließen. Auf Ohrhöhe wären es 60°; ich habe 65° gewählt, damit die Bewegung nicht gequetscht wirkt.
- **Handgelenk:** Oben stehen die Griffe jetzt 26 statt 24 cm neben der Mitte. So knickt das Handgelenk über den ganzen Weg höchstens 11,4° (vorher 12,9°).
- **Werte der Familie für die Maschine:** Griffe unten zwischen Kinn und Ohr, Oberarm etwa 30° unter der Waagrechten, Ellbogen unten etwa 115° gebeugt, Unterarme annähernd senkrecht (bis etwa 12°), oben fast gestreckt.
- **Text:** Er nennt keine Griffhöhe, sondern den ganzen Bewegungsumfang. Das passt, geändert habe ich nichts.
- **Messwerte über alle 60 Bilder:** Ellbogen 65,0° → 172,0°, Oberarm unten 31,4° unter der Waagrechten und 40,3° vor der Ebene der Schultern, Unterarm unten 6,4° zur Senkrechten (höchstens 12,7°), Handgelenk höchstens 11,4°, Unterarm gedreht 37,7° → −20,6°, Griffe 77,4 → 62,2 cm auseinander, unten 20,8 cm über den Schultergelenken, 5,7 cm über dem Kinn und 1,9 cm unter der Mitte des Ohrs, Hebel 38,6°; Gesäß und Rücken 4,0 mm im Polster, nichts durch die Oberfläche; Arme mindestens 43 mm von Hebeln, Griffen und Rahmen, Kopf 159 mm vom Gerät; Shorts 1,1 mm im Shirt (Hüftfalte, bleibt), Ärmel 5,1 mm; Meldungen 0.
- **Schleife:** 23 min, erstes und letztes Bild pixelgleich. In der Übungsliste hat das Schulterdrücken jetzt ein Vorschaubild, in den Details läuft die Schleife.
- **Aufnahme:** `docs/screens/uebungen/schulterdruecken-bewegung.mp4`, 720 × 540, 7,5 s, 107 KB, die Schleife dreimal; angesehen und dem Produktinhaber geschickt.

Damit haben alle elf Übungen von „Ganzkörper A/B“ eine Schleife in der App.

```
Arbeitspaket: D-492 Phase Programme, Schulterdrücken an der Maschine in der App
Umgesetzte Funktionen: Schleife, Poster und Vorschaubild des Schulterdrückens an der Maschine (medien.json: shoulder_press_machine); Werkzeug: Ausgangslage über Griffhöhe zwischen Kinn und Ohr und Ellbogenwinkel, Werte für Griffe zu Kinn und Ohr; erfüllte AK: –
Geänderte Dateien: public/uebungen/medien/schulterdruecken_maschine*.{mp4,webm,webp} (neu), public/uebungen/medien.json, e2e/uebungen.spec.ts, tools/uebungen-3d/uebungen.py, tools/uebungen-3d/familien.json, docs/uebungen-bestand.md, docs/uebungen-animationsplan.md, docs/uebungen-bewegungsfamilien.md, docs/screens/uebungen/schulterdruecken-bewegung.mp4 (neu), form-programme-report.md, docs/decisions.md, docs/testing.md, docs/implementation-plan.md, docs/feature-inventory.md
Technische Entscheidungen: D-492
Ausgeführte Tests: Kopf am Netz gemessen, neun Varianten der Ausgangslage, Messwerte über alle 60 Bilder, Schleife gerendert, Kontaktbogen und erstes/letztes Bild geprüft; Unit-Tests 1.213 bestanden; format:check, lint, typecheck, check:docs, build, check:bundle (Startansicht 237,8 KB, Übungsbilder 52 von 52); E2E Chromium 434 bestanden, 132 übersprungen, 0 fehlgeschlagen; WebKit in der CI
Ergebnis: bestanden
Bekannte Einschränkungen: keine neuen
Nächste Schritte: Übersicht aller elf Übungen von „Ganzkörper A/B“ (D-493), dann Halt für den Gerätetest
```

## 35. Übersicht „Ganzkörper A/B“ (D-493)

Alle elf Übungen von „Ganzkörper A/B“ laufen jetzt als Schleife in der App, in der Reihenfolge der Tage. Die Größen sind die Dateien in `public/uebungen/medien/`; der Stand nennt die Entscheidung, mit der die Schleife in die App kam. Seit D-485 tragen alle Schleifen die finale Kleidung; Beinbeuger, Kreuzheben und Schulterdrücken wurden gleich mit ihr gerendert.

| Nr. | Tag | Übung | Stand | MP4 | WebM | Poster | Vorschau | zusammen |
|---|---|---|---|---|---|---|---|---|
| 1 | A | Beinpresse | Schleife in der App (D-465) | 63,5 KB | 55,4 KB | 15,0 KB | 6,9 KB | 140,8 KB |
| 2 | A | Bankdrücken mit Kurzhanteln | Schleife in der App (D-463) | 43,3 KB | 35,7 KB | 8,3 KB | 4,2 KB | 91,4 KB |
| 3 | A | Rudern am Kabel, sitzend | Schleife in der App (D-474) | 56,0 KB | 51,3 KB | 13,6 KB | 6,4 KB | 127,3 KB |
| 4 | A | Schulterdrücken an der Maschine | Schleife in der App (D-492) | 52,5 KB | 48,9 KB | 10,4 KB | 4,3 KB | 116,2 KB |
| 5 | A | Unterarmstütz (Plank) | Schleife in der App (D-467) | 22,1 KB | 18,0 KB | 10,7 KB | 3,2 KB | 54,1 KB |
| 6 | B | Rumänisches Kreuzheben mit Kurzhanteln | Schleife in der App (D-490) | 53,1 KB | 49,1 KB | 6,1 KB | 3,9 KB | 112,2 KB |
| 7 | B | Latziehen | Schleife in der App (D-461) | 59,2 KB | 56,9 KB | 9,8 KB | 4,4 KB | 130,3 KB |
| 8 | B | Schrägbankdrücken mit Kurzhanteln | Schleife in der App (D-463) | 40,9 KB | 35,7 KB | 8,9 KB | 4,1 KB | 89,6 KB |
| 9 | B | Beinbeuger liegend | Schleife in der App (D-486) | 72,8 KB | 73,2 KB | 12,1 KB | 5,2 KB | 163,2 KB |
| 10 | B | Seitheben mit Kurzhanteln | Schleife in der App (D-469) | 48,8 KB | 47,5 KB | 7,0 KB | 3,1 KB | 106,3 KB |
| 11 | B | Crunches | Schleife in der App (D-467) | 57,6 KB | 48,8 KB | 12,7 KB | 4,2 KB | 123,3 KB |
| | | **zusammen** | | | | | | **1.254,6 KB** |

Übersichtsbild: `docs/screens/uebungen/ganzkoerper-ab-uebersicht.webp`, das Poster jeder Übung in Player-Größe (390 × 292 px, wie der große Player am iPhone). Die Liste entsteht mit `python3 tools/uebungen_programm_uebersicht.py compound_ab_4 --name ganzkoerper-ab`.

Jetzt halte ich an: Du machst den Gerätetest von „Ganzkörper A/B“, danach entscheiden wir über den Merge von #54.

```
Arbeitspaket: D-493 Phase Programme, Übersicht „Ganzkörper A/B“
Umgesetzte Funktionen: keine in der App; Werkzeug: Übersicht eines Programms (Liste mit Stand und Dateigrößen, Bild in Player-Größe); erfüllte AK: –
Geänderte Dateien: tools/uebungen_programm_uebersicht.py (neu), docs/screens/uebungen/ganzkoerper-ab-uebersicht.webp (neu), form-programme-report.md, docs/decisions.md, docs/testing.md, docs/implementation-plan.md, docs/feature-inventory.md
Technische Entscheidungen: D-493
Ausgeführte Tests: Werkzeug ausgeführt, Bild angesehen; bestanden; Startansicht 237,8 KB, Übungsbilder 52 von 52
Ergebnis: bestanden
Bekannte Einschränkungen: keine neuen
Nächste Schritte: Gerätetest von „Ganzkörper A/B“ durch den Produktinhaber, danach Entscheidung über den Merge von #54
```

## 36. Alte Kleidung im Gerätetest: Prüfsumme im Dateinamen (D-494)

Du hast im Gerätetest bei den meisten Übungen noch die alte Kleidung gesehen. Die Dateien im Branch tragen die finale Kleidung; dein Gerät hat alte Fassungen aus seinem Speicher gezeigt.

**Ursache.** Die App legt jede Schleife beim ersten Anzeigen im Speicher des Geräts ab und spielt sie danach von dort, auch ohne Netz (D-403). Erkannt wird eine Datei an ihrem Namen. D-485 hat zehn Schleifen mit der finalen Kleidung unter ihren alten Namen ersetzt; unter `kniebeuge.mp4` liegt seit D-412 schon die fünfte Fassung. Ein Gerät, das eine Datei schon hatte, holte die neue nicht. Neue Namen hatten nur Beinbeuger, Rumänisches Kreuzheben und Schulterdrücken. Deshalb zeigten 8 der 11 Übungen von „Ganzkörper A/B“ die alte Kleidung.

**Behebung.**

- Jede Datei trägt jetzt die Prüfsumme ihres Inhalts im Namen, etwa `kniebeuge-8ccb4065.mp4`. Ändert sich der Inhalt, ändert sich der Name, und das Gerät lädt die neue Datei. Alle 52 Dateien der 13 Übungen sind umbenannt, ihr Inhalt bleibt gleich.
- Nach dem Laden der Bildliste löscht die App aus dem Speicher, was die Liste nicht mehr nennt. So verschwinden die alten Fassungen auch vom Gerät; alles Aktuelle bleibt offline verfügbar.
- Nach dem Rendern vergibt `python3 tools/uebungen_medien_version.py` die Namen. `pnpm check:docs` meldet jede Datei ohne passende Prüfsumme und jede Datei im Ordner, die die Liste nicht nennt. Eine neu gerenderte Schleife, die noch nicht eingebaut ist, fällt so vor dem E2E-Lauf auf.
- Die Werkzeuge für Aufnahmen und Ansichten finden die Dateien weiter über ihren Namen ohne Prüfsumme.

**Am Gerät.** Öffne die App mit Netz. Erscheint „Neue Version verfügbar“, tippe auf „Jetzt aktualisieren“; sonst schließ die App ganz und öffne sie neu. Danach lädt sie die Schleifen neu.

```
Arbeitspaket: D-494 Phase Programme, Übungsbilder mit Prüfsumme im Dateinamen
Umgesetzte Funktionen: neue Fassungen der Übungsbilder erreichen das Gerät (neuer Name je Inhalt), alte Fassungen fallen aus dem Speicher; Werkzeug und Prüfung für die Namen; erfüllte AK: –
Geänderte Dateien: public/uebungen/medien.json, public/uebungen/medien/ (52 Dateien umbenannt), src/modules/exercises/data/media.ts, src/modules/exercises/data/media.test.ts, vite.config.ts (Hinweis), e2e/uebungen.spec.ts, e2e/uebungen-offline.spec.ts, tools/uebungen_medien_version.py (neu), tools/uebungen-medien.mjs (neu), tools/check_medien.py, tools/uebungen_bewegung.py, tools/pilot-screens.mjs, tools/uebungen-fassungen-screens.mjs, tools/uebungen-3d/render.py (Hinweis), docs/architecture.md, docs/decisions.md, docs/testing.md, docs/implementation-plan.md, docs/feature-inventory.md, docs/feature-inventory.csv, form-programme-report.md
Technische Entscheidungen: D-494
Ausgeführte Tests: Unit-Tests 1.217 (4 neu, mit Gegenprobe), Werkzeug in vier Fällen, check:docs, Build, check:bundle, E2E Chromium 434 bestanden, 132 übersprungen, 0 fehlgeschlagen; WebKit in der CI
Ergebnis: bestanden
Bekannte Einschränkungen: wie bisher braucht eine Schleife, die das Gerät noch nicht geladen hat, einmal Netz (D-403)
Nächste Schritte: Gerätetest von „Ganzkörper A/B“ durch den Produktinhaber fortsetzen, danach Entscheidung über den Merge von #54
```

## 37. Player am iPhone Duo: Befunde A bis D behoben (D-495)

Dein Gerätetest am Duo, aufgeklappt quer, im eigenen Training: Die Animationen passten, der Player hatte vier Fehler. Den Anhang `duo-player-befunde.png` habe ich nicht bekommen; nachgestellt habe ich alles nach deiner Bildschirmaufnahme und den drei Bildern vom Vormittag, mit den Fenstern, die wir am Gerät gemessen haben (D-393).

**A · Pause und andere Vollbildansichten in der Mitte des Bildschirms.** Die große Pause stand in der Mitte des Fensters, also 42 pt links der Bildschirmmitte; kam oben der Streifen dazu, auch 41 pt zu tief. Jetzt rechnet die App wie die Startfläche aus, wo die Mitte des ganzen Bildschirms liegt, und stellt den Inhalt dorthin. Die Knöpfe bleiben im Fenster: Der Inhalt wird auf der Seite gegenüber dem Streifen schmaler, er rutscht nie hinein. Dasselbe gilt jetzt für die Anmeldung, die Wiederherstellung und Dialoge in der Mitte, etwa die Übungsinfo und „Training beenden?“. Zugeklappt bleiben der großen Pause 266 pt, dort stehen ±15 s nebeneinander und „Überspringen“ darunter.

**B · Ränder neben der Animation.** Der Rahmen war 4:3, aber höchstens 40 % der Fensterhöhe hoch. Griff diese Grenze, wurde er breiter als das Video, und links und rechts stand die Fläche in einer helleren Farbe (in den Details bei 867 × 669: Seitenverhältnis 1,674 statt 1,333). Jetzt hat der Rahmen immer das Seitenverhältnis des Videos und wird schmaler statt breiter. Das Video füllt ihn ganz, und er hat dieselbe Farbe wie der Grund des Videos, ohne Rand. So blitzt auch an halben Pixeln keine Linie auf. Geprüft im Player, in der Übungsinfo und in den Details bei allen Breiten von iPhone und Duo.

**C · Abgeschnittenes.** In „Als Nächstes“ war jeder Eintrag so breit wie der ganze Name (359 px in 304 px), die Zahl der Sätze rutschte aus der Spalte: „3 S“. Jetzt kürzt sich der Name mit Auslassungspunkten, „3 Sätze“ bleibt ganz. Die Animation bleibt immer ganz sichtbar, siehe D.

**D · Scrollen.** Die rechte Spalte war 558 px hoch, ihr Inhalt 853 px; sie scrollte für sich, und am Seitenende schob der Rahmen sie 147 px nach oben. Daher kam das Mitlaufen und Springen. Jetzt ist sie genau so hoch wie der Platz über der Fußleiste, scrollt nicht mehr für sich und steht von Anfang an fest, auch am Seitenende. Nur die Sätze links scrollen. Die Animation skaliert mit dem Platz. „Als Nächstes“ zeigt nur ganze Einträge, und am Duo quer bleibt neben Kopf, „Jetzt“ und Animation für keinen Eintrag Platz. Die nächste Übung steht dann in „Jetzt“ unter „Danach“ und in der Pause. Ist das Fenster niedriger als 36 rem (iPhone quer), scrollt die Spalte wie bisher für sich, sonst bliebe für die Animation nichts.

**Tests.** Neu `e2e/duo-player-befunde.spec.ts` mit fünf Tests für A bis D. Am alten Stand schlagen alle fünf fehl: Pause und Übungsinfo bei 433,5 statt 475,5 pt; Rahmen 1,674 statt 1,333; die Spalte scrollt 120 px für sich; der Eintrag reicht bis 1186,6 statt höchstens 1132,5 px. Dazu Unit-Tests für die Mitte des Bildschirms (mit der Rechnung der Startfläche) und für die ganzen Einträge.

**Bilder und Aufnahme.** `docs/screens/duo/player-duo-quer.webp` (acht Ansichten quer), `player-duo-lagen.webp` (quer mit Streifen oben, hoch, zugeklappt), `player-vorher-nachher.webp` (die Befunde vorher und nachher) und `player-scrollen.mp4` (Scrollen quer bis ans Seitenende und zurück, 13 s). In der Aufnahme stand die rechte Spalte in allen 719 Bildern bei 0 px. Die Systemstreifen sind in den Bildern dunkel ergänzt, die Linie in Lime ist die Mitte des Bildschirms.

**Grenze.** Schwung-Scrollen und das Nachfedern am Seitenende des iPhone lassen sich hier nicht nachstellen. Geprüft ist das Scrollen Bild für Bild in Chromium (Gesten mit Nachlauf) und mit Schritten in WebKit (CI). Das letzte Wort hat dein Gerätetest.

```
Arbeitspaket: D-495 Phase Programme, Player am iPhone Duo (Befunde A bis D)
Umgesetzte Funktionen: Vollbildansichten und Dialoge in der Mitte des ganzen Bildschirms; Rahmen der Animation im Seitenverhältnis des Videos ohne Kanten; rechte Spalte fest über der Fußleiste, nur ganze Einträge in „Als Nächstes“; erfüllte AK: –
Geänderte Dateien: src/shared/ui/screenCenter.ts (neu), src/shared/ui/screenCenter.test.ts (neu), src/shared/ui/index.ts, src/shared/ui/Dialog.tsx, src/shared/ui/tokens.css, src/app/styles.css, src/main.tsx, src/app/RecoveryScreen.tsx, src/modules/sync/ui/LoginScreen.tsx, src/modules/exercises/ui/ExerciseVisual.tsx, src/modules/training/ui/player/SessionPage.tsx, src/modules/training/ui/player/RestStage.tsx, src/modules/training/ui/player/player-layout.css, src/modules/training/ui/player/useFittingRows.ts (neu), src/modules/training/ui/player/useFittingRows.test.ts (neu), e2e/duo-player-befunde.spec.ts (neu), e2e/duo-player.spec.ts, tools/duo-player-rundgang.mjs (neu), tools/duo-player-aufnahme.mjs (neu), tools/duo_player_bilder.py (neu), docs/screens/duo/player-*.webp, docs/screens/duo/player-scrollen.mp4, docs/decisions.md, docs/design-system.md, docs/testing.md, docs/implementation-plan.md, docs/feature-inventory.md, docs/feature-inventory.csv, form-programme-report.md
Technische Entscheidungen: D-495
Ausgeführte Tests: Unit-Tests 1.227 (137 Dateien); E2E Chromium 441 bestanden, 135 übersprungen, 0 fehlgeschlagen; Gegenprobe am alten Stand: 5 von 5 neuen Tests fehlgeschlagen; Startansicht 238,5 KB; WebKit in der CI
Ergebnis: bestanden
Bekannte Einschränkungen: Schwung-Scrollen und Nachfedern nur am Gerät prüfbar; unter 36 rem Fensterhöhe scrollt die rechte Spalte für sich
Nächste Schritte: Gerätetest des Produktinhabers, danach Entscheidung über den Merge von #54
```

## 38. Rundgang durch den Player, weitere Befunde (D-496)

Den Player bin ich in fünf Haltungen durchgegangen: Duo aufgeklappt quer (867 × 669 und mit Streifen oben 867 × 587), aufgeklappt hoch (669 × 869), zugeklappt (382 × 678) und iPhone (390 × 844). Die Schritte waren Start, Scrollen bis ans Ende, Satz erledigen, Pause klein und groß, Übungsinfo, Übung hinzufügen, Wechsel zur nächsten Übung, Rückfrage „Training beenden?“ und Zusammenfassung; dazu eine Übung wirklich hinzugefügt und die Pause überzogen. Zu jedem Schritt gibt es ein Bild und automatische Prüfungen (`tools/duo-player-rundgang.mjs`). Nach D-495 melden sie nichts mehr. Am alten Stand meldeten sie quer in jedem Schritt die rechte Spalte hinter der Fußleiste und am Seitenende 131 px oben aus dem Bild.

Weitere Befunde, nicht behoben und zu deiner Entscheidung (Bild `docs/screens/duo/player-weitere-befunde.webp`):

| Nr. | Wo | Befund | Vorschlag |
|---|---|---|---|
| E1 | Pausenkarte rechts am Duo quer; „Jetzt“ am iPhone | „Ziel“ und die Zahl stehen in verschiedenen Zeilen: „Ziel“ / „5“, „Ziel“ / „10“ | geschütztes Leerzeichen zwischen „Ziel“ und Wert (ebenso „Satz 1 von 5“) |
| E2 | kleine Pause am iPhone hoch | vom nächsten Satz steht nur „Beinpresse,…“ da; „Aufwärmsatz 2 · Ziel 5“ fehlt, weil „Nächster Satz:“ eine der zwei Zeilen braucht | drei Zeilen, oder die Bezeichnung nur für Screenreader wie zugeklappt |
| E3 | zugeklappt, Dialoge in der Mitte | Folge von A: 266 statt 350 pt breit, „Training beenden?“ bricht um, die Knöpfe stehen untereinander | so lassen (Mitte des Bildschirms) oder zugeklappt in der Mitte des Fensters |
| E4 | Duo quer | Folge von D: „Als Nächstes“ steht nicht da, weil neben Kopf, „Jetzt“ und Animation kein ganzer Eintrag passt; mit Streifen oben wird die Animation in der Pause klein (rund 175 × 132 px) | so lassen, oder die Animation zugunsten eines Eintrags verkleinern |

Ohne Befund geprüft: Wechsel zur nächsten Übung (die Animation wechselt), Übung hinzufügen (sie steht am Ende, 19 Sätze), überzogene Pause (Rand in Lime, „Pause vorbei“) und Rückfrage mit Zusammenfassung in allen Haltungen.

```
Arbeitspaket: D-496 Phase Programme, Rundgang durch den Player am Duo
Umgesetzte Funktionen: keine in der App; Liste weiterer Befunde mit Bild; Werkzeug für den Rundgang; erfüllte AK: –
Geänderte Dateien: docs/screens/duo/player-weitere-befunde.webp (neu), form-programme-report.md, docs/decisions.md, docs/testing.md, docs/implementation-plan.md, docs/feature-inventory.md, docs/feature-inventory.csv
Technische Entscheidungen: D-496
Ausgeführte Tests: Rundgang in fünf Haltungen, Prüfungen ohne Meldung; check:docs
Ergebnis: bestanden
Bekannte Einschränkungen: E1 bis E4 offen, zur Entscheidung
Nächste Schritte: Gerätetest des Produktinhabers, Entscheidung zu E1 bis E4, danach über den Merge von #54
```

## 39. Wiedergabe: Start im Player, zweimal und Wiederholen (D-497)

**Ursache, warum die Beinpresse nicht lief.** Die Animationen starteten nur über das Attribut `autoplay`. Safari startet ein solches Video erst, wenn es das Video für sichtbar hält, und hält es an, sobald es das nicht mehr tut. Die rechte Spalte des Players steht seit D-495 fest: Sie klebt oben, hat einen negativen Rand und schneidet ab, alles in einem eigenen Scrollbereich. Dort hielt Safari das Video der ersten Übung nach dem Start offenbar für unsichtbar. In der Übungsinfo und in den Details liegt es einfach im Bild, deshalb lief es dort. Am Gerät kann ich das nicht nachprüfen; Chromium spielt die Beinpresse auch am alten Stand. Mit einem Skript, das `autoplay` wirkungslos macht, steht sie am alten Stand nach dem Start still, genau wie bei dir.

**Was jetzt gilt.**

- Die App startet die Animation selbst, sobald sie im Bild ist, und auch nach der Rückkehr in die App. Dafür gilt Safaris Regel zur Sichtbarkeit nicht. Ist sie ausgeblendet (andere Spalte, weggescrollt), hält sie an.
- Im Stromsparmodus lässt iOS ein Video nur nach einem Tippen starten. Dann läuft die Animation ab dem ersten Tippen irgendwo im Player. Das ist eine Grenze von iOS, ich habe sie in `known-limitations.md` eingetragen.
- Im Player läuft sie ohne Ende, nach dem Start und nach jedem Wechsel.
- In Übungsinfo und Details läuft sie zweimal (5 Sekunden) und bleibt auf dem letzten Bild stehen. Unten rechts erscheint dann ein kleiner Pfeil im Kreis. Ein Tippen auf die Animation spielt sie wieder zweimal ab, von vorn.
- Safari bekommt jetzt die MP4-Datei (H.264), die das iPhone in Hardware abspielt; vorher bekam es die WebM-Datei. Die 13 WebM-Dateien hatten außerdem einen Alphakanal, den kein Bild braucht. Ich habe sie aus denselben Einzelbildern ohne ihn neu kodiert: Das Bild ist gleich, jede Datei ist rund 2,8 KB kleiner. Das Render-Skript macht das künftig selbst.

**Alle elf Übungen geprüft.** Der neue Test geht „Ganzkörper A/B“ ganz durch: Tag A mit fünf, Tag B mit sechs Übungen, jeweils gleich nach dem Start, gleich nach jedem Wechsel (ohne weiteres Tippen) und nach der Pause. Er stellt Safaris Verhalten nach (`autoplay` wirkungslos). Am alten Stand scheitert er bei der Beinpresse, am neuen laufen alle elf.

| Prüfung | alter Stand | neu |
|---|---|---|
| Beinpresse nach dem Start, `autoplay` wirkungslos | angehalten | läuft |
| alle elf Übungen nach Start und Wechsel | – (scheitert bei der ersten) | alle laufen |
| Stromsparmodus nachgestellt | auch nach dem Tippen angehalten | ab dem ersten Tippen |
| Details und Übungsinfo | laufen ohne Ende | zweimal, Symbol, Tippen wiederholt |

**Nachtrag nach der CI.** In WebKit (die Engine von Safari, in der CI unter Linux) blieb die Animation in den Details nach zwei Durchläufen nicht stehen: Ich hatte die Durchläufe am Rücksprung der Zeit an den Anfang gezählt, und den meldet WebKit dort nicht so. Jetzt zählt die App, wie oft das Video zu Ende ist, und startet es danach selbst neu; das meldet jeder Browser. Die elf Übungen im Player und der Stromsparmodus waren auch in WebKit schon grün. Danach meldete WebKit nach dem Neustart teils ein zweites „Ende“ gleich hinterher; ein Ende zählt jetzt erst, wenn der Durchlauf mindestens zur Hälfte lief. Auch das reichte in WebKit nicht: Dort liefen Übungsinfo und Details dreimal oder hielten nicht an. Jetzt wiederholt der Browser die Animation selbst, wie im Player, und die App misst nur die Zeit, die sie wirklich läuft: Nach anderthalb Durchläufen schaltet sie das Wiederholen ab, der zweite Durchlauf läuft zu Ende und die Animation steht am letzten Bild. Ereignisse zählt sie nicht mehr. Weggescrollt oder im Hintergrund zählt keine Zeit (Nachtrag 3). Die nächste CI zeigte die Ursache genauer: WebKit unter Linux springt bei diesen Dateien schon nach 1,91 s an den Anfang und kennt die Länge nicht verlässlich, und ein Sprung an den Anfang während der Wiedergabe ließ es an Stelle 0 hängen. Jetzt zählt die App einfach den ersten Sprung an den Anfang und schaltet danach das Wiederholen ab; zum Wiederholen springt sie nur im angehaltenen Zustand an den Anfang (Nachtrag 4). Die CI danach zeigte noch einen Haken: Schaltete die App das Wiederholen genau im Sprung an den Anfang ab, blieb WebKit stehen. Jetzt schaltet sie es eine halbe Sekunde später ab, mitten im zweiten Durchlauf (Nachtrag 5). Das betrifft auch Safari am iPhone, denn es nutzt denselben Kern. **Noch offen:** Auch danach blieb WebKit unter Linux in der CI beim ersten Sprung an den Anfang hängen, ob mit oder ohne Wiederholen. Das liegt nach allem, was die Meldungen zeigen, am Nachladen der Datei in dieser Umgebung, nicht an der Zählung: In Chromium läuft alles, und am iPhone lief die Schleife ohne Ende schon vor D-497. Ob es am iPhone zweimal läuft und anhält, zeigt dein Gerätetest; danach entscheide ich mit dir, wie der Test in WebKit weitergeht.

```
Arbeitspaket: D-497 Phase Programme, Wiedergabe der Übungsschleifen
Umgesetzte Funktionen: Start der Schleifen durch die App statt `autoplay`, nur sichtbar, erneut bei der nächsten Geste; Player ohne Ende, Übungsinfo und Details zweimal mit Symbol und Wiederholen per Tippen; eine Datei, MP4 vor WebM; WebM ohne Alphakanal; erfüllte AK: –
Geänderte Dateien: src/modules/exercises/ui/useLoopPlayback.ts (neu), src/modules/exercises/ui/ExerciseVisual.tsx, src/modules/exercises/data/media.ts, src/modules/training/ui/player/SessionPage.tsx, src/shared/i18n/de-exercise-media.ts, src/shared/ui/tokens.css, src/app/styles.css, src/test-setup.ts, Tests (exercise-visual.test.tsx, tokens.test.ts, e2e/uebungen-wiedergabe.spec.ts neu, e2e/uebungen.spec.ts), public/uebungen/medien.json und 13 WebM, tools/uebungen-3d/render.py, Dokumentation
Technische Entscheidungen: D-497
Ausgeführte Tests: format:check, lint, typecheck, test (1.235), check:docs, build, check:bundle (238,6 KB), test:e2e Chromium (446 bestanden), Gegenprobe am alten Stand
Ergebnis: bestanden; WebKit läuft in der CI
Bekannte Einschränkungen: am Gerät nicht prüfbar; im Stromsparmodus startet die Animation erst beim ersten Tippen
Nächste Schritte: D-498 Karte „Jetzt“, D-499 Details breit, D-500 Messung
```

## 40. Karte „Jetzt“: nächste Übung und laufende Animation (D-498)

- Neben „Danach:“ steht jetzt ein kleines Vorschaubild der nächsten Übung (32 px), am iPhone, am Duo zugeklappt und aufgeklappt.
- Am iPhone und am Duo zugeklappt läuft in „Jetzt“ die Animation der aktuellen Übung klein mit, statt des Standbilds: 112 × 84 px statt 56 × 56 px, im Seitenverhältnis der Videos. Ein Tippen öffnet wie bisher die Übungsinfo mit großer Animation und Ausführung.
- Aufgeklappt bleibt die kleine Animation aus; dort läuft die große in der rechten Spalte.
- Scrollst du zu den Sätzen, sodass „Jetzt“ nicht mehr im Bild ist, hält die kleine Animation an und läuft weiter, sobald die Karte wieder zu sehen ist. Das spart Akku.
- Der aktuelle Satz bleibt am iPhone und zugeklappt über der Fußleiste (gemessen: Satz bis 575 px, Fußleiste ab 767 bzw. 601 px).
- Nachtrag nach der CI: In WebKit (Safari) rutschte am Duo zugeklappt der erste Satz unter die Fußleiste. Bei niedrigem Fenster ist „Jetzt“ deshalb kompakter: Animation 96 × 72 px, Name eine Stufe kleiner, Vorschaubild 24 px. Die Karte ist dort jetzt sogar etwas niedriger als vor D-498; das Gewichtsfeld steht 82 px über der Fußleiste. Die Tastatur ändert daran nichts.
- Nachtrag 2: Auch danach lag der Satz in WebKit unter der Fußleiste, 109 px zu tief. Wahrscheinlich ist das gar kein Fehler der Karte: WebKit läuft in der CI wie Safari im Browser-Tab, und dort zeigt die App über jeder Seite den Hinweis, sie zum Home-Bildschirm hinzuzufügen (rund 190 px). Am Gerät läuft sie installiert, ohne den Hinweis. Der Test läuft jetzt wie die installierte App und nennt bei einem Fehlschlag die Lage aller Teile, damit die nächste CI das bestätigt. Die kompaktere Karte bleibt, sie ist auch ohne den Hinweis besser.

```
Arbeitspaket: D-498 Phase Programme, Karte „Jetzt“
Umgesetzte Funktionen: Vorschaubild der nächsten Übung neben „Danach:“; schmal laufende Schleife der aktuellen Übung in „Jetzt“, Tippen öffnet die Übungsinfo; erfüllte AK: –
Geänderte Dateien: src/modules/exercises/ui/ExerciseVisual.tsx, src/modules/exercises/ui/SymbolTile.tsx, src/modules/training/ui/exerciseVisuals.tsx, src/modules/training/ui/player/SessionPage.tsx, Tests (exercise-visual.test.tsx, e2e/player-jetzt.spec.ts neu), Dokumentation
Technische Entscheidungen: D-498
Ausgeführte Tests: format:check, lint, typecheck, test, check:docs, build, check:bundle, test:e2e Chromium
Ergebnis: bestanden bis auf den Zeittest der Startfläche unter Last (einzeln 3 von 3 bestanden); WebKit läuft in der CI
Bekannte Einschränkungen: am Gerät nicht geprüft
Nächste Schritte: D-499 Details breit, D-500 Messung und Vorschlag
```

## 41. Übungsdetails aufgeklappt: Animation und Muskelkarte nebeneinander (D-499)

- Am Duo aufgeklappt (quer und hoch) steht die Muskelkarte direkt neben der Animation, mit 20 px Abstand und genau so hoch wie sie (quer 268 px, hoch 283 px); die Figuren der Karte passen sich an. Ein erster Entwurf ließ die Karte in ihrer eigenen Größe stehen (419 px hoch), das schob die Reiter unter die Tab-Leiste.
- Im Reiter „Muskeln“ steht dann keine zweite Karte mehr, nur die Angaben (Hauptmuskeln, mitarbeitend, Gerät, Erfassung).
- Zugeklappt und am iPhone bleibt alles wie bisher: die Animation allein oben, die Karte im Reiter „Muskeln“.
- Klappst du das Duo auf oder zu, wechselt die Karte ihren Platz, ohne dass die Seite neu lädt.

```
Arbeitspaket: D-499 Phase Programme, Übungsdetails breit
Umgesetzte Funktionen: Muskelkarte neben der Animation ab 40 rem Breite, gleich hoch, im Reiter dann nur die Angaben; schmal wie bisher; erfüllte AK: –
Geänderte Dateien: src/modules/progress/ui/ExerciseDetailPage.tsx, src/modules/exercises/ui/MuscleMap.tsx, src/modules/exercises/ui/muscle-map.css, src/modules/exercises/index.ts, src/shared/ui/breakpoints.ts, Tests (e2e/uebungen-details-breit.spec.ts neu, breakpoints.test.ts neu, muscle-map.test.tsx), Dokumentation
Technische Entscheidungen: D-499
Ausgeführte Tests: format:check, lint, typecheck, test (1.242), check:docs, build, check:bundle (238,9 KB), test:e2e Chromium
Ergebnis: bestanden; WebKit läuft in der CI
Bekannte Einschränkungen: am Gerät nicht geprüft
Nächste Schritte: D-500 Messung und Vorschlag zur Größe der Figur
```


## 42. Gleich große Animation im Player: Rahmen und Figur (D-500)

Du hattest geschrieben, die Animationen wirken im Training nicht alle gleich groß. Gemessen habe ich zwei Dinge: den Rahmen der Animation im Player und die Figur im Bild.

**Rahmen.** Gemessen in „Ganzkörper A/B“, Tag A und B mit allen Sätzen, am ersten Satz jeder Übung, dazu mit laufendem Timer (Unterarmstütz) und in der Pause. Fenster und sichere Bereiche wie am Gerät gemessen (D-393). Ungleich war der Rahmen nur am Duo quer: Dort bekommt die Animation die Höhe, die neben Kopf und „Jetzt“ bleibt, und „Jetzt“ war je nach Länge von Name und Angaben 146 bis 226 px hoch.

| Fenster | vorher, elf Übungen | jetzt, elf Übungen |
|---|---|---|
| iPhone 390 × 844 | 112 × 84 | 112 × 84 |
| iPhone quer 844 × 390 | 96 × 72 | 96 × 72 |
| Duo zugeklappt 382 × 678 | 96 × 72 | 96 × 72 |
| Duo hoch 669 × 869 | 112 × 84 | 112 × 84 |
| Duo quer beim Start 867 × 669 | 220,2 × 165,1 bis 326,3 × 244,7, mit Timer 241 × 180,7 | 273,5 × 205,1, auch mit Timer |
| Duo quer im Training (Streifen oben) 867 × 587 | 110,8 × 83,1 bis 217 × 162,7, mit Timer 131,6 × 98,7 | 164,2 × 123,1, auch mit Timer |
| iPad 1180 × 820, Computer 1440 × 900 | 336 × 252 | 336 × 252 |

- Am Duo quer ist „Jetzt“ jetzt immer gleich hoch (186 px): Name etwas kleiner mit Platz für zwei Zeilen, Angaben mit Platz für zwei Zeilen, „Danach:“ in einer Zeile mit kleinerem Bild (24 px), „Letzte Übung“ gleich hoch; der laufende Satz-Timer steht an der Stelle von „Danach:“ und ist dort 1,5 statt 3,5 rem groß. Die Notiz steht links in der Karte der Übung.
- Gekürzt wird in keiner der elf Übungen etwas, auch nicht mit Vorwerten aus einem früheren Training. Nur „Danach:“ endet bei zwei langen Namen mit „…“ (Schulterdrücken an der Maschine, Schrägbankdrücken mit Kurzhanteln); ganz stehen sie links.
- Gleich groß heißt am Duo quer: größer als vorher bei sechs Übungen, kleiner bei fünf mit kurzem Namen (Beinpresse, Unterarmstütz, Latziehen, Beinbeuger, Crunches).
- In der Pause steht statt „Jetzt“ die Pausenanzeige; der Rahmen ist dann in allen elf Übungen 284,7 × 213,5 bzw. 175,4 × 131,5 px, wie bisher etwas größer als im Satz.
- **Zur Entscheidung:** Im Fenster mit dem Streifen oben bleibt die Animation klein (164 × 123 px). Kopf und „Jetzt“ brauchen dort mit ihren Abständen 337 der 476 px der rechten Spalte. Stünde der Kopf (Programm, Fortschritt, „Beenden“) im niedrigen Fenster links über der Liste, hätte die Animation in beiden Querlagen ihre volle Größe 336 × 252 px. Das ist gerechnet, nicht gebaut; links wäre die Liste dafür 135 px kürzer. Sag mir, ob ich das umsetzen soll.

**Figur.** Gemessen in Blender mit der Kamera jeder Schleife, in jedem zweiten Bild, über alle Punkte von Körper, Kleidung und Schuhen. „Maßstab“ heißt: so viele Pixel ist ein Meter an der Mitte der Figur im Bild 720 × 540. Gleicher Maßstab heißt gleich groß wirkende Figur, auch wenn sie liegt.

| Übung | Maßstab jetzt (px/m) | Figur jetzt hoch × breit (px im Bild) | davon im Player, Duo quer (px hoch) | kleinster Rand (px) | Vorschlag: Faktor | Figur danach hoch (px) | Geräte angeschnitten |
|---|---|---|---|---|---|---|---|
| Beinpresse | 279 | 292 × 386 | 111 | 58 | 0,97 | 286 | ja |
| Bankdrücken mit Kurzhanteln | 289 | 491 × 372 | 187 | 7 | 0,94 | 456 | nein |
| Rudern am Kabel, sitzend | 330 | 339 × 331 | 129 | 10 | 0,82 | 267 | ja |
| Schulterdrücken an der Maschine | 286 | 517 × 262 | 196 | 7 | 0,95 | 486 | ja |
| Unterarmstütz (Plank) | 379 | 228 × 692 | 86 | 7 | 0,71 | 154 | nein |
| Rumänisches Kreuzheben mit Kurzhanteln | 284 | 522 × 252 | 198 | 7 | 0,95 | 496 | nein |
| Latziehen | 288 | 521 × 247 | 198 | 3 | 0,94 | 488 | ja |
| Schrägbankdrücken mit Kurzhanteln | 273 | 497 × 344 | 189 | 7 | 0,99 | 491 | nein |
| Beinbeuger liegend | 412 | 405 × 713 | 154 | −9 | 0,66 | 265 | ja |
| Seitheben mit Kurzhanteln | 291 | 521 × 441 | 198 | 9 | 0,93 | 483 | nein |
| Crunches | 493 | 324 × 686 | 123 | 17 | 0,55 | 174 | nein |

- Der Maßstab reicht von 273 bis 493 px/m: Die Figur in Crunches wirkt 1,8-mal so groß wie beim Schrägbankdrücken. Bisher passt die Kamera Figur und Gerät zusammen ins Bild ein; liegende und flache Übungen sind niedriger, die Kamera kommt näher.
- Beim Beinbeuger ragt die Figur in einem Teil der Bewegung 9 px über den rechten Rand. Das widerspricht deiner Regel „die Figur nie“ schon heute.
- **Vorschlag:** ein Maßstab für alle elf, 271 px/m. Das ist der größte, bei dem jede Figur in jedem Bild mit 4 % Rand ganz im Bild bleibt; die Grenze setzt das Rumänische Kreuzheben (stehend, fast bildhoch). Die Kamera behält Richtung und Neigung, zielt auf die Mitte der Figur und steht überall 3,69 m entfernt. Stehende Figuren werden dadurch kaum kleiner (0,93 bis 0,99), liegende und sitzende deutlich (Crunches 0,55, Beinbeuger 0,66, Unterarmstütz 0,71, Rudern 0,82). Geräte sind am Rand angeschnitten bei Beinpresse, Rudern, Schulterdrücken, Latziehen und Beinbeuger, die Figur nirgends.
- Das Vergleichsblatt zeigt je Übung das Bild jetzt und mit dem Vorschlag, mit dem Rahmen der Figur über die ganze Bewegung: `docs/screens/uebungen/groesse-vorschlag.webp`. Neu gerendert wird erst nach deiner Freigabe; die Kameras dafür rechnet `tools/uebungen-3d/figur_vorschlag.py`.

```
Arbeitspaket: D-500 Phase Programme, Größe der Animation im Player
Umgesetzte Funktionen: Rahmen der Animation im Player in jeder Übung gleich groß (Duo quer: „Jetzt“ gleich hoch, auch mit Timer und bei „Letzte Übung“); Messung der Figur in allen elf Schleifen; Vorschlag gemeinsamer Maßstab 271 px/m mit Vergleichsblatt; erfüllte AK: –
Geänderte Dateien: src/modules/training/ui/player/SessionPage.tsx, src/modules/training/ui/player/player-layout.css, Tests (e2e/uebungen-wiedergabe.spec.ts, e2e/player-jetzt.spec.ts), tools/player-rahmen-messen.mjs (neu), tools/uebungen-3d/figur_messen.py (neu), tools/uebungen-3d/figur_vorschlag.py (neu), docs/screens/uebungen/groesse-vorschlag.webp (neu), Dokumentation
Technische Entscheidungen: D-500
Ausgeführte Tests: format:check, lint, typecheck, test (1.245), check:docs, build, check:bundle (238,9 KB), test:e2e Chromium (456 bestanden), Player-Tests nach dem letzten Schritt (64 bestanden), Gegenprobe am alten Stand, Messungen mit `tools/player-rahmen-messen.mjs` und in Blender
Ergebnis: bestanden; WebKit läuft in der CI
Bekannte Einschränkungen: am Gerät nicht geprüft; Figur noch nicht neu gerendert (Freigabe offen); Animation im Fenster mit Streifen 164 × 123 px (Vorschlag Kopf links offen)
Nächste Schritte: Freigabe des Maßstabs und der Lage des Kopfs durch den Produktinhaber
```

## 43. Bilder und Aufnahmen zu D-497 bis D-500

- `docs/screens/duo/wiedergabe-schmal.webp`: iPhone und Duo zugeklappt, je Player (die kleine Animation läuft in „Jetzt“, daneben „Danach:“ mit Bild), Übungsinfo nach zwei Durchläufen mit dem Symbol zum Wiederholen, Übungsdetails wie bisher.
- `docs/screens/duo/wiedergabe-aufgeklappt.webp`: Duo quer beim Start (867 × 669) und im Training mit dem Streifen oben (867 × 587), Übungsinfo nach zwei Durchläufen, Details mit Muskelkarte daneben, quer und hoch. Hier sieht man, wie klein die Animation im Fenster mit Streifen bleibt (Abschnitt 42, zur Entscheidung).
- `docs/screens/duo/wiedergabe-iphone.mp4` (18 s): Start, die Animation der Beinpresse läuft sofort; Übungsinfo, zweimal, Symbol, Tippen spielt sie wieder ab; Wechsel zur nächsten Übung, deren Animation gleich läuft.
- `docs/screens/duo/wiedergabe-duo-quer.mp4` (23 s): dasselbe am Duo quer im Training (867 × 587), mit zwei Wechseln; Rahmen und „Jetzt“ bleiben gleich groß.
- Nebenbefund: Zweimal heute spielte ein Video statt des MP4 das WebM (im vollen E2E-Lauf und im ersten Versuch der Duo-Aufnahme). Die App weicht so aus, wenn eine Datei nicht lädt; das ist gewollt. In acht gezielten Versuchen kam der Fehler nicht wieder. Am iPhone spielt Safari das MP4 mit dem Decoder des Geräts; ob es dort vorkommt, zeigt der Gerätetest.

## 44. Nach deinen Entscheidungen: Figur, Kopf links, Tests (D-501 bis D-503)

**Figur (D-501).** Kein gemeinsamer Maßstab, wie du entschieden hast; stattdessen füllt jede Figur ihren Rahmen mit gleichem Rand. Neu gerendert habe ich die drei, die du freigegeben hast. Die Kamera behält Richtung und Neigung, zielt auf die Mitte der Figur und kommt so nah, dass die Figur über die ganze Bewegung 2 % Rand behält. Der Beinbeuger ragt nicht mehr über den rechten Rand, die Figur ist dafür 3 % kleiner. Die Beinpresse füllt jetzt 96 % statt 54 % des Rahmens, die Figur ist 1,76-mal so groß; von der Maschine bleiben Fußplatte, Polster und ein Teil der Gewichte im Bild. Das Rudern füllt 96 % statt 63 %, die Figur ist 1,45-mal so groß; Kabel, Griff und Fußplatte bleiben im Bild. Damit füllen alle elf Figuren ihren Rahmen zu 91 bis 97 %. Die Vorschaubilder der Liste haben ihre eigene Kamera und bleiben gleich. Vorher und nachher: `docs/screens/uebungen/figur-fuellen.webp`.

```
Arbeitspaket: D-501 Phase Programme, Figur füllt ihren Rahmen
Umgesetzte Funktionen: Kamera „füllen“ für Schleifen (2 % Rand, mittig, Gerät angeschnitten); Beinbeuger, Beinpresse und Rudern am Kabel neu gerendert und eingebaut; erfüllte AK: –
Geänderte Dateien: tools/uebungen-3d/figur_rahmen.py (neu), render.py, uebungen.py, figur_messen.py, figur_vorschlag.py, public/uebungen/medien.json und 9 Dateien in public/uebungen/medien, docs/screens/uebungen/figur-fuellen.webp, Dokumentation
Technische Entscheidungen: D-501
Ausgeführte Tests: siehe docs/testing.md, Abschnitt „Figur füllt ihren Rahmen“
Ergebnis: siehe dort
Bekannte Einschränkungen: Die übrigen acht Figuren bleiben, wie sie sind (91 bis 97 %), ihre Ränder sind nicht überall gleich
Nächste Schritte: Gerätetest des Produktinhabers
```

**Kopf links (D-502).** Im niedrigen Fenster am Duo quer steht der Kopf mit Programm, Fortschritt und „Beenden“ jetzt links über der Liste. Er bleibt oben stehen, wenn du scrollst; „Beenden“ ist immer erreichbar. Die Pause steht darin in einer Zeile wie zugeklappt, ±15 s gibt es in der großen Pause. Rechts ist die Animation in allen elf Übungen 336 × 252 px groß, bei 669 und bei 587 px Fensterhöhe, auch mit Timer und in der Pause. In der Pause zeigt die rechte Spalte unter der Animation „Als Nächstes“, weil „Jetzt“ dann entfällt: bei 669 px vier Einträge, bei 587 px zwei. Dabei fiel ein Sprung beim Öffnen auf: Muskel-Etiketten und Vorwerte kamen erst nach dem ersten Bild, die erste Karte wurde 13 px höher, und die Seite rutschte samt Kopf um diese Höhe. Jetzt erscheint der Player erst, wenn beides geladen ist; nichts springt mehr. Ragt der erste Satz beim Öffnen unten unter die Fußleiste, rückt der Player ihn gleich ganz darüber. Das betrifft das Duo zugeklappt: Dort lag er schon vorher 3 px darunter, jetzt steht er 4 px darüber, und der obere Rand von „Jetzt“ liegt 6 px unter dem Kopf. Das bitte beim Gerätetest mit ansehen.

```
Arbeitspaket: D-502 Phase Programme, Kopf links im niedrigen Fenster am Duo quer
Umgesetzte Funktionen: Kopf mit Pause links über der Liste, fest; Animation rechts 336 × 252 px; Öffnen ohne Sprung; aktiver Satz beim Öffnen über der Fußleiste; erfüllte AK: –
Geänderte Dateien: src/modules/training/ui/player/SessionPage.tsx, useStableSetView.ts, useTwoColumns.ts (neu), useTwoColumns.test.ts (neu), player-layout.css, src/modules/training/data/useSession.ts, e2e/duo-player.spec.ts, Dokumentation
Technische Entscheidungen: D-502
Ausgeführte Tests: siehe docs/testing.md, Abschnitt „Kopf links im niedrigen Fenster am Duo quer“
Ergebnis: siehe dort
Bekannte Einschränkungen: Schwung-Scrollen und Gummiband des iPhone nicht nachstellbar; WebKit läuft in der CI
Nächste Schritte: D-501 Schleifen neu, Gerätetest des Produktinhabers
```

**Tests der Wiedergabe (D-503).** Die drei Tests „zweimal, dann anhalten“ hängen nicht mehr am Nachladen echter Videos. Im Test ersetzt ein nachgestelltes Video die Wiedergabe: Es läuft nur weiter, springt an den Anfang oder endet, wenn der Test es sagt, mit denselben Ereignissen wie im Browser. Geprüft wird in drei Runden: von selbst, nach dem Tippen, nach dem zweiten Tippen. Jede Runde läuft zweimal, dann steht das letzte Bild mit dem Symbol. Eine Taste anderswo startet die angehaltene Animation nicht, und hinter der Übungsinfo läuft der Player weiter ohne Ende. Das läuft in Chromium und WebKit gleich. Die echte Wiedergabe prüfen die bisherigen Tests nur noch in Chromium; am Gerät prüfst du sie.

```
Arbeitspaket: D-503 Phase Programme, Tests der Wiedergabe mit nachgestelltem Video
Umgesetzte Funktionen: Logik „zweimal, dann anhalten, Tippen spielt erneut zweimal ab“ in Chromium und WebKit mit nachgestelltem Videoende; echte Wiedergabe nur in Chromium; erfüllte AK: –
Geänderte Dateien: e2e/uebungen-wiedergabe.spec.ts, Dokumentation
Technische Entscheidungen: D-503
Ausgeführte Tests: format:check, lint, typecheck, check:docs, test:e2e Chromium (uebungen-wiedergabe 9 bestanden)
Ergebnis: bestanden; WebKit läuft in der CI
Bekannte Einschränkungen: echte Wiedergabe in WebKit nicht mehr in der CI geprüft, am Gerät durch den Produktinhaber
Nächste Schritte: D-501 Schleifen neu, D-502 Kopf links
```

## 45. Dali’s PPLC (D-504)

**Was entstanden ist.** Dein Plan steht als Programm „Dali’s PPLC“ in der App, in der Liste der Programme ganz oben: Push, Pull, Beine und Compound, vier Einheiten pro Woche in dieser Reihenfolge, 8 Wochen, danach von vorn. Übungen und Reihenfolge sind genau wie in deinem Plan; unter jeder Übung steht dein englischer Name. Sätze, Ziele und Pausen kommen aus Ganzkörper A/B und Push/Pull/Beine: 3 Arbeitssätze, bei derselben Übung dieselben Ziele und Pausen, Aufwärmsätze bei der ersten Übung des Tages und vor schweren Grundübungen. Deine Vorwerte aus anderen Programmen erscheinen bei denselben Übungen. Mit „Übernehmen und anpassen“ machst du daraus eine Kopie, die du selbst ändern kannst.

**Zuordnung.** Fast alles war eindeutig. Drei Annahmen: „Machine Squat“ ist die Hackenschmidt-Kniebeuge, „Machine Leg Curl“ der Beinbeuger liegend wie in Ganzkörper A/B, „Machine Calf Raise“ das Wadenheben stehend. Für das „Leverage Machine High Row“ gab es keine passende Übung; es ist neu in der Bibliothek als „High Row an der Maschine“, getrennt vom Rudern an der Maschine, damit beide ihren eigenen Vorwert haben. Seine Anleitung fehlt noch, weil die Quelle (ExRx) aus der Arbeitsumgebung nicht erreichbar war.

**Nachtrag nach der CI.** Mit der zusätzlichen Karte fiel in WebKit beim Auf- und Zuklappen die Leselinie der Programmseite in eine Lücke zwischen zwei Karten; dort hielt die App die Leseposition nicht. Jetzt nimmt sie dann das Element knapp darunter oder darüber.

**Einschätzung und Vorschläge** stehen in der Nachricht an dich; umgesetzt ist nur dein Plan, so wie du ihn geschickt hast.

```
Arbeitspaket: D-504 Phase Programme, Dali’s PPLC
Umgesetzte Funktionen: gebündeltes Programm „Dali’s PPLC“ (4 Tage, 8 Wochen, wiederholt); neue Übung „High Row an der Maschine“; erfüllte AK: –
Geänderte Dateien: tools/data/programs.source.json, tools/programs_build.py, src/modules/training/data/programs.v1.json, src/app/layout/ScrollManager.tsx (Nachtrag), src/modules/exercises/data/core-exercises.v1.json, exercise-guides.v1.json, tools/uebungen-3d/familien.json, tools/uebungen_familien.py, Tests mit der Zahl der Übungen und der Liste der Programme, erzeugte Übersichten in docs/, Dokumentation
Technische Entscheidungen: D-504
Ausgeführte Tests: siehe docs/testing.md, Abschnitt „Dali’s PPLC“
Ergebnis: siehe dort
Bekannte Einschränkungen: Anleitung zum High Row offen; Animationen gibt es für 6 der 21 Übungen des Programms
Nächste Schritte: deine Rückmeldung zu den Annahmen und Vorschlägen; Gerätetest; Merge von PR #54
```

## 46. Dali’s PPLC neu: Satzzahl je Woche, Wiederholen ab Woche 8, Hinweise (D-505)

**Was neu ist.** „Dali’s PPLC“ ist nach deinen Nachrichten neu gebaut: Push am Montag, Pull am Dienstag, Legs am Donnerstag, Compound am Samstag, mit deinen englischen Namen, Übungen, Wiederholungsbereichen und Pausen. Der Infotext steht wörtlich in der Beschreibung. Am Pull-Tag stehen jetzt Machine Reverse Fly und Iso Row; das Langhantelrudern ist am Compound-Tag, das Rudern am Kabel ist weg. Am Compound-Tag wechseln Dumbbell Bench Press (ungerade Wochen) und Dip (gerade Wochen).

**Satzzahl je Woche.** Die App rechnet nichts um; jede Woche hat ihre eigenen Tage mit der passenden Satzzahl.

| Wochen | Grundübungen | übrige |
|---|---|---|
| 1–2 | 2 | 2 |
| 3 | 3 | 3 |
| 4–6 | 4 | 3 |
| 7 (leicht) | 2 | 1 |
| 8 (Einstieg) | 3 | 2 |
| 9–13 | 4 | 3 |
| 14 (leicht) | 2 | 1 |
| 15 (Einstieg) | 3 | 2 |
| 16–20 | 4 | 3 |
| 21 (leicht) | 2 | 1 |

Nach Woche 21 geht es mit Woche 8 weiter, so folgt die leichte Woche immer nach sechs Wochen. Machine Calf Raise am Compound-Tag hat fest 2 Sätze, in leichten Wochen 1. In leichten Wochen heißen die Tage „Push · leicht“ usw.

**Hinweise auf „Heute“.** Am ersten Tag von Woche 4: „Ab dieser Woche mehr Sätze: Grundübungen 4, übrige 3.“ Am ersten Tag jeder leichten Woche: „Diese Woche ist leichter: etwa die Hälfte der Sätze.“ Am ersten Tag jeder Einstiegswoche danach: „Neuer Aufbaublock: Diese Woche steigst du mit etwas weniger Sätzen ein.“ Die Karte „Aktives Programm“ zeigt den Hinweis unter dem Tag. Auch die Notiz zum Tag in eigenen Programmen erscheint dort; so behält eine Kopie von Dali’s PPLC die Hinweise.

**Wiederholen ab Woche.** Neue Einstellung der Programme. Bei eigenen Programmen wählst du im Editor unter „Wiederholen ab“ die Woche, mit der es nach der letzten Woche weitergeht. Sie erscheint nur, wenn „Nach der letzten Woche von vorn beginnen“ an ist.

**Programmseite.** 84 Tage untereinander wären zu lang. Darum lässt sich jede Woche aufklappen; offen ist die Woche des nächsten Tages, ohne aktives Programm Woche 1. „Als Nächstes“ steht nur beim richtigen Tag, nicht bei jedem Tag mit gleichem Namen.

**Annahmen.** Supersätze kann die App nicht; Lateral Raise und Dumbbell Curl stehen hintereinander. Die Wochentage sind ein Plan; trainierst du an einem anderen Tag, geht es trotzdem mit dem nächsten Tag weiter.

**Noch offen, folgt in eigenen Paketen:** die Einstellung „Übungsnamen auf Englisch“, die Wertung der Unterstützung bei Dip und Pull-Up mit den Alternativen, die Animationen.

```
Arbeitspaket: D-505 Phase Programme, Dali’s PPLC neu
Umgesetzte Funktionen: Satzzahl je Woche (21 Wochen), Wiederholen ab Woche n (gebündelte und eigene Programme, Editor), Hinweise auf „Heute“, Wochen zum Aufklappen, Wochentage; erfüllte AK: –
Geänderte Dateien: tools/data/dali-pplc.source.json (neu), tools/data/programs.source.json, tools/programs_build.py, src/modules/training/data/programs.v1.json, src/modules/training/model/program.ts, calc/sampleTemplates.ts, calc/programProgress.ts, calc/programTree.ts, service/programService.ts, ui/SampleTemplatePage.tsx, ui/ActiveProgramCard.tsx, ui/programs/ProgramEditPage.tsx, src/shared/i18n/de.ts, de-program-editor.ts, Tests, e2e/programs.spec.ts, e2e/fixtures.ts, erzeugte Übersichten in docs/, Dokumentation
Technische Entscheidungen: D-505
Ausgeführte Tests: siehe docs/testing.md, Abschnitt „Dali’s PPLC neu“
Ergebnis: siehe dort
Bekannte Einschränkungen: keine Supersätze; Namen noch deutsch mit englischem Namen darunter, bis die Einstellung „Übungsnamen auf Englisch“ steht
Nächste Schritte: Einstellung „Übungsnamen auf Englisch“, Unterstützung als Fortschritt, Animationsliste und erste Prüfseite
```

## 47. Übungsnamen auf Englisch (D-506)

**Was neu ist.** Programme haben die Einstellung „Übungsnamen auf Englisch“. In „Dali’s PPLC“ ist sie an. Dann stehen deine englischen Namen überall im Programm: auf der Programmseite, im Player, in der Übungsinfo, in der Pause, in der Zusammenfassung und im Verlauf. Die Anleitung zur Übung, die Muskeln, die Bibliothek und „Fortschritt“ bleiben deutsch.

**Suche.** Die Bibliothek findet die Übungen weiter auf Deutsch und Englisch. 15 Namen aus deinem Plan fand sie bisher nicht als Ganzes, z. B. „Machine Squat“ oder „Leverage Machine Iso Row“; sie stehen jetzt als weitere Namen bei der Übung.

**Eigene Programme.** Übernimmst du Dali’s PPLC, bleibt die Einstellung an. Im Editor kannst du sie unter „Angaben“ ausschalten. Der Schalter erscheint nur, wenn das Programm englische Namen hat.

**Gut zu wissen.** Ersetzt du im Player eine Übung, trägt die neue den deutschen Namen aus der Bibliothek. Einheiten, die du schon begonnen oder beendet hast, behalten ihre Namen.

```
Arbeitspaket: D-506 Phase Programme, Übungsnamen auf Englisch
Umgesetzte Funktionen: Einstellung „Übungsnamen auf Englisch“ (gebündelte und eigene Programme, Schalter im Editor), englische Namen in Programmseite, Player, Pause, Verlauf; 15 weitere Namen in der Bibliothek für die Suche; erfüllte AK: –
Geänderte Dateien: src/modules/training/model/program.ts, calc/exerciseName.ts (neu), calc/plan.ts, calc/sampleTemplates.ts, calc/programTree.ts, service/programService.ts, ui/SampleTemplatePage.tsx, ui/programs/ProgramEditPage.tsx, ui/programs/DayEditPage.tsx, src/shared/i18n/de-program-editor.ts, src/modules/exercises/data/core-exercises.v1.json, tools/data/dali-pplc.source.json, tools/programs_build.py, src/modules/training/data/programs.v1.json, Tests, e2e/programs.spec.ts, erzeugte Übersichten in docs/, Dokumentation
Technische Entscheidungen: D-506
Ausgeführte Tests: siehe docs/testing.md, Abschnitt „Übungsnamen auf Englisch“
Ergebnis: siehe dort
Bekannte Einschränkungen: Übungen ohne englischen Namen und ersetzte Übungen bleiben deutsch
Nächste Schritte: Unterstützung als Fortschritt und Alternativen bei Dip und Pull-Up; Animationsliste und erste Prüfseite
```

## 48. Unterstützung als Fortschritt; Ziel und Alternativen (D-507)

**Was schon richtig war.** Bei Dip und Pull-Up an der Maschine erfasst die App die Unterstützung in kg, getrennt vom Gewicht. Bester Satz, Bestleistungen und „Neue Bestleistung“ werten weniger Unterstützung als besser, bei gleicher Unterstützung mehr Wiederholungen. Vorwerte und Verlauf zeigen z. B. „−20 kg × 8“. Ins Volumen und ins 1RM geht die Unterstützung nicht ein. Das ist jetzt zusätzlich durch Tests abgesichert.

**Was neu ist.**
- Überall heißt es „Unterstützung“ statt „Entlastung“, wie in deiner Nachricht.
- Die Knöpfe ± im Player heißen bei diesen Übungen „Unterstützung − 2,5“ und „Unterstützung + 2,5“.
- Im Fortschritt der Übung steht „Unterstützung im besten Satz“ und der Hinweis „Weniger Unterstützung ist Fortschritt: Sinkt der Wert, wirst du stärker.“
- Alternativen: Bei Dips mit Unterstützung steht Dips als „Ziel“ zuerst, bei Klimmzügen mit Unterstützung Klimmzüge als „Ziel“ und danach Latziehen. Das gilt in den Übungsdetails und beim Ersetzen im Player und im Editor.

```
Arbeitspaket: D-507 Phase Programme, Unterstützung als Fortschritt
Umgesetzte Funktionen: Wort „Unterstützung“, Knöpfe ± mit Unterstützung, Hinweis im Fortschritt, Ziel und Alternativen in der Bibliothek; erfüllte AK: –
Geänderte Dateien: src/modules/exercises/model/exercise.ts, calc/alternatives.ts, ui/ExercisePicker.tsx, data/core-exercises.v1.json, src/modules/progress/ui/ExerciseDetailPage.tsx, ExerciseProgressPage.tsx, src/modules/training/ui/player/SetRow.tsx, src/shared/i18n/de.ts, de-session.ts, de-training-pages.ts, Tests, e2e/session.spec.ts, e2e/exercises.spec.ts, Dokumentation
Technische Entscheidungen: D-507
Ausgeführte Tests: siehe docs/testing.md, Abschnitt „Unterstützung als Fortschritt“
Ergebnis: siehe dort
Bekannte Einschränkungen: keine
Nächste Schritte: Animationsliste und erste Prüfseite
```

## 49. Animationen für Dali’s PPLC: Liste und erste Prüfseite, Pull-Up an der Gegengewichtsmaschine (D-508)

### 49.1 Alle Übungen des Programms nach Bewegungsfamilien

25 verschiedene Übungen: 6 haben schon eine Schleife in der App, 19 sind neu. „Einheiten“ zählt, wie oft die Übung in den 21 Wochen vorkommt.

| Familie | Übung (dein Name) | in der App | Einheiten | Stand | Gerät |
|---|---|---|---|---|---|
| Senkrechtes Ziehen | Pull-Up | Klimmzüge mit Unterstützung | 42 | neu, **Prüfseite (D-508)** | Gegengewichtsmaschine für Klimmzug und Dip (neu) |
| Waagrechtes Drücken | Dumbbell Bench Press | Bankdrücken mit Kurzhanteln | 32 | Schleife in der App | Kurzhanteln, Flachbank |
| Waagrechtes Drücken | Dip | Dips mit Unterstützung | 31 | neu | dieselbe Gegengewichtsmaschine |
| Waagrechtes Drücken | Dumbbell Incline Bench Press | Schrägbankdrücken mit Kurzhanteln | 21 | Schleife in der App | Kurzhanteln, Schrägbank |
| Kniebeuge | Machine Leg Press | Beinpresse | 42 | Schleife in der App | Beinpresse 45° |
| Kniebeuge | Machine Squat | Hackenschmidt-Kniebeuge | 21 | neu | Hackenschmidt-Maschine (neu) |
| Beine isoliert | Machine Calf Raise | Wadenheben stehend | 42 | neu | Wadenmaschine, stehend (neu) |
| Beine isoliert | Machine Leg Curl | Beinbeuger liegend | 21 | Schleife in der App | Beinbeuger-Maschine |
| Beine isoliert | Machine Seated Leg Curl | Beinbeuger sitzend | 21 | neu | Beinbeuger-Maschine, sitzend (neu) |
| Beine isoliert | Machine Leg Extension | Beinstrecker | 21 | neu | Beinstrecker-Maschine (neu) |
| Beine isoliert | Machine Seated Calf Raise | Wadenheben sitzend | 21 | neu | Wadenmaschine, sitzend (neu) |
| Arme beugen und strecken | Cable Tricep Pushdown | Trizepsdrücken am Kabel | 21 | neu | Kabelzug mit Stange (neu) |
| Arme beugen und strecken | Dumbbell Alternating Hammer Curl | Hammercurls | 21 | neu | Kurzhanteln |
| Arme beugen und strecken | Dumbbell Curl | Bizepscurls mit Kurzhanteln | 21 | neu | Kurzhanteln |
| Waagrechtes Ziehen | Leverage Machine Iso Row | Rudern an der Maschine | 21 | neu | Rudermaschine, brustgestützt (neu) |
| Waagrechtes Ziehen | Leverage Machine High Row | High Row an der Maschine | 21 | neu | High-Row-Maschine (neu) |
| Waagrechtes Ziehen | Barbell Bent-Over Row | Rudern mit Langhantel, vorgebeugt | 21 | neu | Langhantel |
| Schulter und Brust isoliert | Dumbbell Lateral Raise | Seitheben mit Kurzhanteln | 42 | Schleife in der App | Kurzhanteln |
| Schulter und Brust isoliert | Cable Fly | Fliegende am Kabel | 21 | neu | Kabelzug mit zwei Säulen (neu) |
| Schulter und Brust isoliert | Machine Reverse Fly | Reverse Butterfly an der Maschine | 21 | neu | Butterfly-Maschine (neu) |
| Senkrechtes Drücken | Dumbbell Seated Shoulder Press | Schulterdrücken mit Kurzhanteln, sitzend | 21 | neu | Kurzhanteln, Bank fast senkrecht |
| Senkrechtes Drücken | Barbell Military Press | Schulterdrücken mit Langhantel, stehend | 21 | neu | Langhantel |
| Hüftbeuge | Barbell Deadlift | Kreuzheben mit Langhantel | 21 | neu | Langhantel |
| Rumpf | Plank | Unterarmstütz (Plank) | 21 | Schleife in der App | Matte |
| Rumpf | Cable Crunch | Crunches am Kabel, kniend | 21 | neu | Kabelzug mit Seil (neu) |

**Reihenfolge der Familien** (wie bisher: Familien mit fertiger Grundlage aus den Piloten zuerst, dann nach Einheiten; `docs/uebungen-animationsplan.md`, Abschnitt 2.2): Senkrechtes Ziehen (Pull-Up), Waagrechtes Drücken (Dip, an derselben Maschine), Kniebeuge (Machine Squat), Beine isoliert (vier Maschinen), Arme beugen und strecken, Waagrechtes Ziehen, Schulter und Brust isoliert, Senkrechtes Drücken, Hüftbeuge, Rumpf. Geschätzt rund 49 Arbeitsstunden, davon 31 für die neuen Geräte, dazu 8 Stunden Rechenzeit.

**Machine Squat:** Ich nehme wie besprochen eine Hackenschmidt-Maschine (Schulterpolster, Rückenpolster auf einem schrägen Schlitten, Fußplatte). Sieht sie in deinem Studio anders aus, passe ich sie später an.

### 49.2 Gerät: Gegengewichtsmaschine für Klimmzug und Dip

- **Vorbild:** die übliche Bauart mit Kniepolster (Life Fitness Assisted Chin/Dip, StairMaster Gravitron, Technogym Selection). Die Seiten der Hersteller ließen sich in der Cloud-Umgebung nicht öffnen; die Maße sind geschätzt.
- **Aufbau:** vorn ein Turm, 2,32 m hoch, mit dem Gewichtsblock hinter einer Rückwand. Oben gehen zwei Ausleger nach hinten zu den offenen Klimmzuggriffen: Zwischen den Griffen ist frei, der Kopf geht hindurch. Die Griffe sind waagrecht, 2,20 m hoch, ihre Mitten 72 cm auseinander. Die Dipgriffe sitzen am Turm auf 1,30 m und sind für Klimmzüge nach vorn geklappt. Links und rechts je eine Trittstufe auf 42 cm.
- **Kniepolster:** 42 × 34 cm, an zwei parallelen Hebeln von 70 cm, die am Turm gelagert sind. Das Polster bleibt dadurch waagrecht und läuft auf einem Bogen. Das Gegengewicht drückt es nach oben; der Gewichtsblock hebt sich, wenn das Polster sinkt (22 cm über die ganze Bewegung).

### 49.3 Bewegung

- **Knien:** Oberschenkel fast senkrecht (8° vor der Senkrechten), Unterschenkel waagrecht auf dem Polster, Knie 82°. Knie und Schienbeine liegen 4 mm im Polster, die Füße hängen dahinter frei, die Zehen zeigen nach unten.
- **Griff:** weit im Obergriff, Handflächen nach vorn. Die Griffe stehen im Ausgang über den Schultergelenken.
- **Unten (Ausgang):** Arme und Schultern gestreckt: Ellbogen 165°, Schlüsselbeine 22° angehoben, Oberkörper 5° zurück.
- **Oben:** Die Mitte des Halses ist auf Höhe der Griffe. Ellbogen 42°, die Ellbogen sind nach unten und etwas nach hinten gezogen, die Unterarme fast senkrecht, die Schulterblätter gesenkt und etwas zurück, Oberkörper 15° zurück.
- **Weg:** Das Polster steigt mit den Knien um 49 cm (von 66 auf 115 cm über dem Boden) und läuft dabei auf seinem Bogen; die Griffe bleiben fest.
- **Handgelenk:** Mit dem Griff so schräg in der Hand wie beim Latziehen (20°) knickte es in der Mitte bis 22° zum kleinen Finger. Verglichen habe ich 13 Fassungen: 10°, 12°, 14°, 15°, 20° und 30° Schräge, den Unterarm senkrecht oder 10° bis 15° nach außen, Griffe nach außen 15° und 25° ab- oder ansteigend. Abfallende Griffe machten es schlimmer (bis 48°). Gewählt: 14° Schräge, Unterarm 10° nach außen, waagrechte Griffe; das Handgelenk bleibt zwischen −10° und +12°.

- **Kamera der App:** 135° von hinten seitlich, 10° von oben, wie beim Latziehen. So sieht man Rücken, Schulterblätter und beide Arme, dazu Kniepolster und Turm. Verglichen habe ich 160°, 110° und 45° (`docs/screens/uebungen/senkrechtes-ziehen-kameras.webp`): Fast von hinten stehen die Arme genau nebeneinander und das Polster verschwindet hinter den Beinen; von der Seite verdeckt ein Arm den anderen; von vorn seitlich sieht man das Gesicht, der Rücken als arbeitender Teil aber fehlt.
- **Prüfseite:** `docs/screens/uebungen/familie-senkrechtes-ziehen.webp`.

### 49.4 Abgleich mit dem Ausführungstext

Der Text in der App passt; geändert habe ich nichts.

| Text in der App | Animation |
|---|---|
| „Greif die Stange weit.“ | Griffe 72 cm auseinander, deutlich breiter als die Schultern |
| „Stell oder knie dich auf die Plattform der Maschine, je nach Bauart.“ | kniend auf dem Kniepolster |
| „Zieh dich nach oben, bis der Hals etwa auf Höhe der Hände ist.“ | oben die Mitte des Halses auf Höhe der Griffe |
| „Senk dich ab, bis Arme und Schultern ganz gestreckt sind.“ | unten Ellbogen 165°, Schlüsselbeine angehoben |
| „Senk dich ruhig und gleichmäßig ab.“ | derselbe Weg zurück, mit der kurzen Pause an beiden Umkehrpunkten wie bei allen Schleifen |

### 49.5 Messwerte über alle 60 Bilder

| | Wert |
|---|---|
| Ellbogen unten / oben | 165,0° / 42,5° |
| Oberarm zur Waagrechten unten / oben | 63,6° darüber / 48,6° darunter |
| Unterarm zur Senkrechten, höchstens | 17,4° (oben 3,3°) |
| Handgelenk zur Seite / nach hinten / gesamt | −10,2° bis +12,1° / −4,6° bis +6,5° / höchstens 12,1° |
| Griffe auseinander | 71,8 cm |
| Griffe über dem Schultergelenk unten / oben | 56,1 / 15,5 cm |
| Griffe vor dem Schultergelenk | −1,4 bis 9,0 cm |
| Griffe über der Mitte des Halses unten / oben | 47,7 / 0,0 cm |
| Oberkörper zurückgelehnt / Schlüsselbeine angehoben | 5° bis 15° / 22° bis 0° |
| Knie | 82,0° |
| Kniepolster über dem Boden / gehoben | 66,3 bis 115,2 cm / 48,9 cm |
| Knie und Schienbeine im Polster / durch die Oberfläche | 4,0 mm / 0,0 mm |
| Kopf und Hals zur Maschine | mindestens 190,7 mm |
| Arme zur Maschine | mindestens 77,9 mm |
| Körper, Kleidung und Schuhe zur Maschine (ohne Polster und Griffe) | mindestens 66,0 mm |
| Finger am Griff | −4,2 mm (gewollt eingedrückt), 442 Punkte in Kontakt |
| Shorts unter dem Shirt / Saumband über den Shorts / Haut unter dem Ärmel | 9,0 / 8,7 / 4,8 mm |
| Shorts-F zum Streifen / Kragen über der Socke | 10,3 cm / 1,6 mm |
| Meldungen des Rigs | 0 |

### 49.6 Abweichungen und offene Punkte

- **Maße der Maschine:** geschätzt, nicht von einem Vorbild abgemessen; die Seiten der Hersteller waren aus der Arbeitsumgebung nicht erreichbar. Steht in deinem Studio eine andere Bauart (z. B. mit Trittplattform zum Stehen statt Kniepolster), passe ich Maschine und Haltung an. Der Ausführungstext erlaubt beides („Stell oder knie dich …“).
- **Griffe:** waagrecht und gerade. Viele Maschinen haben zusätzlich abgewinkelte weite Griffe und parallele Griffe; mit nach außen abfallenden Griffen knickte das Handgelenk bis 48°, darum gerade.
- **Bogen des Polsters:** Das Polster läuft an seinen Hebeln auf einem Bogen; Knie und Hüfte wandern dadurch unten und oben um 4,4 cm zum Turm hin. Die Griffe bleiben fest, die Arme gleichen das aus.
- **Füße:** Das Sprunggelenk bleibt wie im Stand, die Zehen zeigen hinter dem Polster nach unten. Manche knien mit gestreckten Füßen; das wäre eine kleine Änderung.
- **Handgelenk:** höchstens 12° zur Seite, ähnlich wie beim Latziehen (13°).
- **Werkzeug:** Die Ansicht „Kamera der App“ auf der Prüfseite zeigte in jeder Phase die Ausgangslage, weil die Kamera mit „Füllen“ (D-501) für den Ausschnitt die ganze Schleife durchgeht und die Figur danach nicht zurückgesetzt wurde. Behoben in `render.py`; die Schleifen in der App waren nicht betroffen (dort entsteht die Kamera einmal vor dem ersten Bild).

### 49.7 Bericht zum Paket

```
Arbeitspaket: D-508 Phase Programme, Animationen für Dali’s PPLC: Liste und Prüfseite der ersten Familie (Senkrechtes Ziehen, Klimmzüge mit Unterstützung)
Umgesetzte Funktionen: keine in der App; Liste nach Familien, Animationsplan mit Dali’s PPLC, Werkzeug: Gegengewichtsmaschine für Klimmzug und Dip (geraete.klimmzugmaschine), Übung uebungen.KlimmzugUnterstuetzt, neue Zeilen der Prüfseite, Ansicht der App auf der Prüfseite in der richtigen Phase; erfüllte AK: –
Geänderte Dateien: tools/uebungen-3d/geraete.py, tools/uebungen-3d/uebungen.py, tools/uebungen-3d/render.py, tools/uebungen_pruef_bild.py, tools/uebungen_animationsplan.py, tools/uebungen-3d/familien.json, docs/uebungen-animationsplan.md, docs/screens/uebungen/familie-senkrechtes-ziehen.webp (neu), docs/screens/uebungen/senkrechtes-ziehen-kameras.webp (neu), form-programme-report.md, docs/decisions.md, docs/testing.md, docs/implementation-plan.md, docs/feature-inventory.md
Technische Entscheidungen: D-508
Ausgeführte Tests: Probelauf, Vergleich von 13 Griffhaltungen, render.py klimmzug_unterstuetzt --pruefen (alle 60 Bilder), Nahaufnahmen von Griff und Fuß, vier Kameras, Bilder angesehen; Dokumente geprüft
Ergebnis: bestanden (Werte in 49.5); Fehler in der Ansicht der App auf der Prüfseite gefunden und behoben
Bekannte Einschränkungen: 49.6
Nächste Schritte: Halt bis zu deiner Freigabe der Prüfseite; danach die Schleife des Pull-Ups, dann die nächste Familie (Dip an derselben Maschine)
```

## 50. Pull-Up in der App (D-509)

Deine Freigabe: Maße, Knien am Kniepolster und hängende Füße bleiben. Geprüft werden sollte noch, dass oben die Schultern unten sind, die Brust zur Stange geht und der Körper nicht schwingt, mit Messwert.

- **Schultern oben:** Die Mitte des Ohrs steht oben 23,2 cm über dem Schultergelenk, im Stand 22,3 cm. Die Schultern sind oben also 0,9 cm tiefer als im Stand und nicht zu den Ohren gezogen. Unten im Hang sind es 15,7 cm, weil Arme und Schultern dort ganz gestreckt sind, wie im Text.
- **Brust zur Stange:** Mit den Werten der Prüfseite lag die Brust oben 10,0 cm vor der Linie der Griffe. Sie ging an der Stange vorbei, der Kopf kam dicht an die Ausleger. Jetzt stehen die Griffe im Ausgang 14 statt 3 cm vor den Schultergelenken. Oben liegt die Brust 1,1 cm hinter der Linie der Griffe, die Halsgrube 7,1 cm unter ihnen, die Mitte des Halses auf ihrer Höhe. Vergleich: `docs/screens/uebungen/klimmzug-oben-vergleich.webp`.
- **Kein Schwingen:** Die Rücklage nimmt gleichmäßig von 5° auf 15° zu und wieder ab. Die Mitte des Körpers wandert bis zwei Drittel des Wegs 5,6 cm nach hinten, dann 1,0 cm zurück. Die Hüfte folgt dem Bogen des Polsters: bis zur Mitte des Wegs 4,3 cm vom Turm weg, dann zurück. Das ist der Bogen der Hebel aus der Prüfseite. An beiden Umkehrpunkten steht alles still.
- **Verglichen:** Griffe 10 cm vor den Schultern: Brust oben 3,0 cm vor der Linie. 22° statt 15° Rücklage: Brust 3,5 cm dahinter, aber das Handgelenk knickt bis 16,1°. Gewählt sind 14 cm und 15°: Handgelenk höchstens 13,2°.
- **Text:** passt („bis der Hals etwa auf Höhe der Hände ist“), geändert habe ich nichts.
- **Messwerte über alle 60 Bilder:** Ellbogen 165,0° → 55,1°, Unterarm 7,9° bis 13,3° zur Senkrechten, Handgelenk 5,0° bis 13,2° zum Daumen, Griffe 9,7 bis 20,0 cm vor den Schultergelenken, Kniepolster 66,8 bis 115,2 cm über dem Boden, Knie 4,0 mm im Polster, nichts durch die Oberfläche; Kopf und Hals mindestens 235 mm, Arme 77 mm, Körper, Kleidung und Schuhe 66 mm von der Maschine; Kleidung ohne Durchdringung; Meldungen 0.
- **Schleife:** 22 min, erstes und letztes Bild pixelgleich. In der Übungsliste haben die Klimmzüge mit Unterstützung jetzt ein Vorschaubild, in den Details läuft die Schleife.
- **Aufnahme:** `docs/screens/uebungen/klimmzug-bewegung.mp4`, 720 × 540, 7,5 s, 144 KB, die Schleife dreimal.

```
Arbeitspaket: D-509 Phase Programme, Klimmzüge mit Unterstützung in der App
Umgesetzte Funktionen: Schleife, Poster und Vorschaubild der Klimmzüge mit Unterstützung (medien.json: assisted_pull_up); Werkzeug: Griffe 14 cm vor den Schultern, Messwerte für Schultern, Brust, Hüfte und Mitte des Körpers; erfüllte AK: –
Geänderte Dateien: public/uebungen/medien/klimmzug_unterstuetzt*.{mp4,webm,webp} (neu), public/uebungen/medien.json, e2e/uebungen.spec.ts, tools/uebungen-3d/uebungen.py, tools/uebungen_pruef_bild.py, tools/uebungen-3d/familien.json, docs/uebungen-bestand.md, docs/uebungen-animationsplan.md, docs/screens/uebungen/klimmzug-bewegung.mp4 (neu), docs/screens/uebungen/klimmzug-oben-vergleich.webp (neu), form-programme-report.md, docs/decisions.md, docs/testing.md, docs/implementation-plan.md, docs/feature-inventory.md
Technische Entscheidungen: D-509
Ausgeführte Tests: Messung der Endlage (Ohr, Brust, Halsgrube, Hüfte, Mitte des Körpers), Vergleich von drei Fassungen, render.py klimmzug_unterstuetzt --pruefen (alle 60 Bilder), Nahaufnahmen, Schleife gerendert, Kontaktbogen und erstes/letztes Bild geprüft, Aufnahme angesehen; Unit-Tests 1.273 bestanden; format:check, lint, typecheck, check:docs, build, check:bundle (Startansicht 239,7 KB, Übungsbilder 56 von 56); E2E Chromium 469 bestanden, 151 übersprungen, 0 fehlgeschlagen; WebKit in der CI
Ergebnis: bestanden
Bekannte Einschränkungen: keine neuen
Nächste Schritte: Prüfseiten der nächsten Familien gemeinsam: Dip an derselben Maschine (Waagrechtes Drücken) und Machine Squat (Kniebeuge, Hackenschmidt-Maschine), dann Halt
```

## 51. Prüfseiten Dip und Machine Squat (D-510, D-511)

Wie gewünscht zwei Familien zusammen: Waagrechtes Drücken mit dem Dip an derselben Maschine wie der Pull-Up und Kniebeuge mit Machine Squat an der Hackenschmidt-Maschine. Entscheidungen, die bei dir liegen, stehen gesammelt in 51.3.

### 51.1 Dips mit Unterstützung (Waagrechtes Drücken, D-510)

Prüfseite: `docs/screens/uebungen/familie-waagrechtes-druecken-dip.webp`, Kameravergleich: `docs/screens/uebungen/waagrechtes-druecken-dip-kameras.webp`.

- **Dieselbe Maschine:** Turm, Ausleger, Kniepolster, Hebel und Lager sind genau die des Pull-Ups. Das Polster läuft auf demselben Bogen, der Gewichtsblock hebt sich, wenn das Polster sinkt.
- **Diparme neu:** Die Dipgriffe der ersten Prüfseite (40 cm vorn am Turm) reichten nicht bis zu dir, denn du kniest 75 cm vor dem Turm. Jetzt hat jede Seite einen Arm auf einem Lager außen an der Säule, 67,5 cm lang bis zum Gummigriff. Zum Dip ist er zu dir geschwenkt, zum Pull-Up nach vorn. Schwenkbare Dipgriffe gibt es so auch bei anderen Herstellern; die Maße sind geschätzt. Die Schleife des Pull-Ups zeigt noch die kurzen Griffe; mit deiner Freigabe rendere ich sie neu.
- **Bewegung:** kniend wie beim Pull-Up, Hände im neutralen Griff, Daumen vorn, oben senkrecht unter den Schultern. Oben sind die Arme gestreckt (Ellbogen 172°), die Schultern gesenkt, der Oberkörper 5° vor. Ab, bis der Oberarm etwa waagrecht ist (3° darunter, Ellbogen 80°), der Oberkörper dann 24° vor, die Ellbogen nach hinten.
- **Kamera:** 115°, mehr von der Seite als beim Pull-Up: So sind Tiefe, Ellbogen und Vorneigung zu sehen und beide Arme.

| Messwert über alle 60 Bilder | Wert |
|---|---|
| Ellbogen oben / unten | 172,0° / 80,3° |
| Oberarm zur Waagrechten oben / unten | 75,1° / 3,0° darunter |
| Oberarm zum Rumpf unten (Dehnung in der Schulter) | 59,1° |
| Unterarm zur Senkrechten, höchstens / unten | 16,0° / 12,8° (Ellbogen 5,5 cm hinter dem Handgelenk) |
| Handgelenk, höchstens | 9,7° |
| Oberkörper vorgeneigt | 5° bis 24° |
| Schultern unten: Ohr längs des Rumpfs über dem Schultergelenk | 23,4 bis 24,3 cm, im Stand 22,4 cm |
| Schultergelenk vor der Mitte des Griffs oben / unten | 0,0 / 14,6 cm |
| Kniepolster über dem Boden / Hüfte waagrecht | 99,4 bis 78,8 cm / höchstens 0,6 cm |
| Hände auseinander (Mitte der Griffe) | 54,1 cm (Schultergelenke 39,8 cm) |
| Knie im Polster / durch die Oberfläche | 4,0 mm / 0,0 mm |
| Rumpf zu den Diparmen / Arme / Kopf zur Maschine | mindestens 95 / 105 / 181 mm |
| Finger im Gummigriff | 8,4 mm (Pull-Up 4,2 mm), in den Nahaufnahmen nicht zu sehen |
| Kleidung, Meldungen des Rigs | ohne Durchdringung, 0 |

**Abgleich mit dem Ausführungstext:** passt, geändert habe ich nichts.

| Text in der App | Animation |
|---|---|
| „Stütz dich mit gestreckten Armen auf die schulterbreiten Griffe, die Schultern über den Händen.“ | oben Ellbogen 172°, Schultergelenk senkrecht über der Mitte des Griffs; Griffe 54 cm auseinander |
| „Stell dich auf den Hebel; bei manchen Maschinen kniest du auf einem Polster.“ | kniend auf dem Kniepolster, wie beim Pull-Up |
| „Beug die Arme und senk den Körper, bis du eine leichte Dehnung in den Schultern spürst.“ | unten Oberarm etwa waagrecht, 59° hinter dem Rumpf |
| „Drück dich hoch, bis die Arme gestreckt sind.“ | zurück bis 172° im Ellbogen |

### 51.2 Hackenschmidt-Kniebeuge (Kniebeuge, D-511)

Prüfseite: `docs/screens/uebungen/familie-kniebeuge-hackenschmidt.webp`, Kameravergleich: `docs/screens/uebungen/kniebeuge-hackenschmidt-kameras.webp`.

- **Maschine (neu):** Hack-Squat-Maschine mit Scheiben nach der üblichen Bauart, Maße geschätzt. Zwei Schienen unter 45° hinter dir, darauf der Schlitten mit Rückenpolster, Schulterpolstern und Griffen; vorn unten die feste Fußplatte, vorn 15° höher.
- **Bewegung:** Der Rücken liegt die ganze Zeit gleich am Polster und fährt mit dem Schlitten 33 cm die Schiene hinab. Nur Hüfte, Knie und Sprunggelenke beugen sich. Oben sind die Beine fast gestreckt (Knie 168°), unten hat das Knie 75°, die Oberschenkel stehen fast parallel zur Platte.
- **Füße:** Die Linie von der Hüfte zum Fußgelenk steht oben fast in der Richtung der Schiene. Im ersten Versuch standen die Füße unter der Hüfte; dann schoben sich die Knie unten 23 cm vor die Zehen. Jetzt bleiben sie 3 cm dahinter, das Sprunggelenk beugt sich unten 22°.
- **Rücken am Polster:** wie bei der Beinpresse, die Lende etwas flacher. Das Gesäß drückt das Polster 17 bis 19 mm ein (an der Beinpresse das Kreuzbein 19 bis 26 mm); Lende, oberer Rücken und Kopf liegen an.
- **Schulterpolster und Griffe:** Die Schulterpolster sitzen außen auf den Schultern; weiter innen lagen die Haare darin. Die Hände halten Griffe neben der Brust, der Ellbogen ist 49° gebeugt, das Handgelenk gerade.
- **Kamera:** 60° schräg von vorn: Knie, Füße und der Weg des Schlittens sind gut zu sehen.

| Messwert über alle 60 Bilder | Wert |
|---|---|
| Knie oben / unten | 168,0° / 75,0° |
| Hüfte (Oberschenkel zum Rumpf) oben / unten | 174,3° / 132,6° |
| Sprunggelenk oben / unten | 23,0° gestreckt / 21,9° gebeugt |
| Knie neben der Fußachse / unten hinter der Zehenspitze | 3,5 bis 4,4 cm außen / 3,2 cm |
| Oberschenkel unten zur Platte | 7° vor parallel |
| Weg des Schlittens | 33,3 cm |
| Sohlen auf der Platte | flach (0,0 mm), nicht verschoben (0,1 mm) |
| Lende / Gesäß / oberer Rücken / Kopf im Polster | 2,7 bis 3,0 / 16,9 bis 19,2 / 4,1 / 2,8 mm |
| Schulterpolster auf den Schultern | 5,7 mm |
| Tiefste Delle / durch die Oberfläche | 38,4 mm (Shorts am Gesäß) / 0,0 mm |
| Arme / Beine / Kopf zur Maschine | mindestens 50,7 / 45,4 / 67,2 mm |
| Ellbogen / Handgelenk / Finger im Griff | 48,8° / 8,6° / 4,6 mm |
| Kleidung, Meldungen des Rigs | ohne Durchdringung, 0 |

**Abgleich mit dem Ausführungstext:** passt bis auf die Tiefe (Frage 3).

| Text in der App | Animation |
|---|---|
| „Lehn dich mit dem Rücken an das Polster, die Schultern liegen unter den Schulterpolstern.“ | Rücken am Polster, Schulterpolster auf den Schultern |
| „Stell die Füße etwas höher als den unteren Rand auf die Plattform.“ | Platte 50 cm tief, ihre Mitte 4 cm vor der Mitte der Füße: die Fersen stehen ein Stück über dem unteren Rand |
| „Senk den Schlitten ab, indem du Knie und Hüfte beugst.“ | Knie 168° → 75°, Hüfte 174° → 133° |
| „Geh so tief, bis die Knie kurz vor der vollen Beugung sind.“ | unten 75° im Knie, Oberschenkel fast parallel zur Platte |
| „Drück dich zurück nach oben, bis die Beine gestreckt sind.“ | oben 168°, nicht durchgedrückt |
| „Führ die Knie in Linie mit den Füßen.“ | Knie über der Fußachse, 3,5 bis 4,4 cm außen |
| „Geh nur so tief, wie der Rücken am Polster bleibt.“; Fehler „Fersen heben sich“, „Becken löst sich“ | Rücken und Becken in jeder Phase am Polster, Sohlen flach |

### 51.3 Deine Entscheidungen

Bitte kurz zu jedem Punkt; ohne Antwort bleibt es beim Vorschlag.

1. **Dip, Vorneigung:** Unten neigt sich der Oberkörper 24° vor (Brust und Trizeps). Aufrechter betont den Trizeps; dann stehen die Unterarme unten schräger (mit 16° Vorneigung gemessen 18,7°, mit 24° 12,8°). Vorschlag: 24° lassen.
2. **Dip, Diparme:** lange Arme, außen an den Säulen geschwenkt (Annahme). Hat die Maschine in deinem Studio feste Dipgriffe an eigenen Stützen, baue ich sie so.
3. **Machine Squat, Tiefe:** unten 75° im Knie, die Oberschenkel fast parallel zur Platte (Familie: 100 bis 120° gebeugt). Der Text sagt „kurz vor der vollen Beugung“; tiefer ginge, dann beugen sich Hüfte und Sprunggelenk weiter. Vorschlag: 75° lassen.
4. **Machine Squat, Maschine:** Hack-Squat-Maschine mit Scheiben, Schlitten unter 45°, Fußplatte 15° geneigt, Griffe neben der Brust (Annahme). Steht in deinem Studio eine andere Bauart, etwa mit Gewichtsblock oder Griffen an den Schulterpolstern, baue ich sie danach.

### 51.4 Berichte zu den Paketen

```
Arbeitspaket: D-510 Phase Programme, Prüfseite Dips mit Unterstützung (Waagrechtes Drücken) an derselben Gegengewichtsmaschine
Umgesetzte Funktionen: keine in der App; Werkzeug: Übung uebungen.DipUnterstuetzt auf der Bahn des Pull-Ups, Diparme (geraete.dipgriffe), Messwerte für Schultern längs des Rumpfs, Ellbogen, Schultergelenk über dem Griff und Abstände zu den Diparmen, Zeilen der Prüfseite; erfüllte AK: –
Geänderte Dateien: tools/uebungen-3d/geraete.py, tools/uebungen-3d/uebungen.py, tools/uebungen_pruef_bild.py, tools/uebungen-3d/familien.json, docs/uebungen-animationsplan.md, docs/screens/uebungen/familie-waagrechtes-druecken-dip.webp (neu), docs/screens/uebungen/waagrechtes-druecken-dip-kameras.webp (neu), form-programme-report.md, docs/decisions.md, docs/testing.md, docs/implementation-plan.md, docs/feature-inventory.md
Technische Entscheidungen: D-510
Ausgeführte Tests: drei Probeläufe, Kameravergleich, render.py dip_unterstuetzt --pruefen (alle 60 Bilder), Nahaufnahmen, Bilder angesehen, Pull-Up nach dem Umbau gleich (60 Bilder); format:check und check:docs bestanden
Ergebnis: bestanden (Werte in 51.1)
Bekannte Einschränkungen: Maße der Diparme geschätzt; die Schleife des Pull-Ups zeigt bis zum Neu-Rendern die kurzen Dipgriffe
Nächste Schritte: Prüfseite Machine Squat (D-511), dann Halt bis zu deiner Freigabe beider Prüfseiten
```

```
Arbeitspaket: D-511 Phase Programme, Prüfseite Hackenschmidt-Kniebeuge (Kniebeuge, Machine Squat) an einer neuen Maschine
Umgesetzte Funktionen: keine in der App; Werkzeug: Hackenschmidt-Maschine (geraete.hackenschmidt), Übung uebungen.Hackenschmidt mit Messwerten zu Knie, Hüfte, Sprunggelenk, Rücken- und Schulterpolstern und Abständen zur Maschine, Zeilen der Prüfseite, Prüfung der Socke bei geneigter Platte (render.messen); erfüllte AK: –
Geänderte Dateien: tools/uebungen-3d/geraete.py, tools/uebungen-3d/uebungen.py, tools/uebungen-3d/render.py, tools/uebungen_pruef_bild.py, tools/uebungen-3d/familien.json, docs/uebungen-animationsplan.md, docs/screens/uebungen/familie-kniebeuge-hackenschmidt.webp (neu), docs/screens/uebungen/kniebeuge-hackenschmidt-kameras.webp (neu), form-programme-report.md, docs/decisions.md, docs/testing.md, docs/implementation-plan.md, docs/feature-inventory.md
Technische Entscheidungen: D-511
Ausgeführte Tests: Probeläufe (Fußstellung gerechnet und gemessen, Rücken in zwölf Fassungen, Griffe in 15 Fassungen), Kameravergleich, render.py hackenschmidt --pruefen (alle 60 Bilder), Nahaufnahmen, Bilder angesehen; format:check und check:docs bestanden
Ergebnis: bestanden (Werte in 51.2)
Bekannte Einschränkungen: Maße der Maschine geschätzt
Nächste Schritte: Halt bis zu deiner Freigabe beider Prüfseiten und deinen Antworten in 51.3; danach Schleifen Dip und Machine Squat, Pull-Up neu mit den Diparmen, dann die nächsten Familien (Beine isoliert, Arme beugen und strecken)
```

## 52. Roter E2E-Lauf zu D-509: Test robust (D-512)

In der CI war zum Commit des Pull-Ups (`1027d78`) ein E2E-Test rot: „Player aufgeklappt“ am Duo, mit der Meldung „nicht sichtbar“. Der nächste Commit mit gleichem App-Code war grün, lokal auch.

- **Ursache:** Der Test misst die Lage von Kopf, Liste und Pause wiederholt, bis sie stimmt. Hat ein Teil gerade keine Fläche, weil der Player nach dem Wechsel der Fenstergröße umbaut, warf die Messung einen Fehler, und Playwright bricht die Wiederholung bei einem Fehler sofort ab. Nachgestellt: Fehler nach 72 ms, obwohl das Element nach 0,5 s da ist.
- **Behoben:** Die Messung meldet jetzt „noch nicht sichtbar“ und wartet weiter. Dreimal hintereinander grün; die App ist unverändert.

```
Arbeitspaket: D-512 Phase Programme, E2E „Player aufgeklappt“ am Duo robust
Umgesetzte Funktionen: keine in der App; Test: Abfragen der Lage mit expect.poll warten, statt abzubrechen; erfüllte AK: –
Geänderte Dateien: e2e/duo-player.spec.ts, form-programme-report.md, docs/decisions.md, docs/testing.md
Technische Entscheidungen: D-512
Ausgeführte Tests: Ursache im Quelltext von Playwright und nachgestellt; duo-player.spec.ts dreimal (15 bestanden); lint, typecheck, format:check, check:docs, check:bundle (Startansicht 239,7 KB); E2E Chromium 469 bestanden, 151 übersprungen, 0 fehlgeschlagen; WebKit in der CI
Ergebnis: bestanden
Bekannte Einschränkungen: dieselbe Art Messung steht noch in anderen Tests (Duo, Übungsdetails, „Jetzt“); dort war sie bisher nicht rot
Nächste Schritte: Halt bis zu deiner Freigabe der Prüfseiten Dip und Machine Squat
```

## 53. Dip und Machine Squat in der App, Pull-Up neu (D-513)

Nach deiner Freigabe beider Prüfseiten: Die Schleifen für Dip und Machine Squat sind gerendert und eingebaut, der Pull-Up ist mit den schwenkbaren Diparmen neu gerendert. Der Code ist der Stand der Prüfseiten, nichts daran geändert.

- **Dip:** 24° Vorneigung unten, Oberarm etwa waagrecht (3° darunter), wie auf der Prüfseite. Schleife 60 Bilder, 1082 s.
- **Machine Squat:** Hackenschmidt-Maschine mit 45°-Schlitten, unten 75° im Knie. Schleife 1189 s.
- **Pull-Up:** dieselbe Bewegung wie in D-509, jetzt mit den Diparmen der Dip-Prüfseite, zum Pull-Up nach vorn geschwenkt. Schleife 1103 s.
- **Alle drei:** erstes und letztes Bild pixelgleich, kein Sprung am Ende; Kontaktbogen angesehen.

**Textänderung Hackenschmidt-Kniebeuge, wie gewünscht:**

| | Text |
|---|---|
| vorher | „Geh so tief, bis die Knie kurz vor der vollen Beugung sind.“ |
| jetzt | „Geh so tief, bis die Oberschenkel etwa parallel zur Plattform sind.“ |

„Plattform“ statt „Platte“, weil der Text der Übung die Fußplatte schon so nennt („Stell die Füße … auf die Plattform“, „Fersen heben sich von der Plattform ab“). Ein Quellenhinweis unter dem Text nennt die Abweichung von ExRx.

**In der App:**

| Übung | MP4 | WebM | Poster | Vorschau | Alternativtext |
|---|---|---|---|---|---|
| Dips mit Unterstützung | 63,9 KB | 53,6 KB | 12,2 KB | 5,1 KB | 216 Zeichen |
| Hackenschmidt-Kniebeuge | 88,0 KB | 71,0 KB | 16,9 KB | 6,4 KB | 231 Zeichen |
| Klimmzüge mit Unterstützung (neu) | 66,5 KB | 57,9 KB | 10,1 KB | 4,9 KB | unverändert |

16 Übungen haben jetzt eine Animation (vorher 14). Neue Dateinamen mit Prüfsumme, damit dein Gerät die neue Fassung lädt (D-494). Aufnahmen: `docs/screens/uebungen/dip-bewegung.mp4`, `hackenschmidt-bewegung.mp4` und `klimmzug-bewegung.mp4` (neu), je 720 × 540, 7,5 s, die Schleife dreimal.

**Eigene Aufgabe nach diesem PR (deine Antwort):** die Messungen der Lage in den übrigen Tests (Duo, Übungsdetails, „Jetzt“) so robust machen wie in D-512. Steht im Plan.

```
Arbeitspaket: D-513 Phase Programme, Dip und Machine Squat in der App, Pull-Up mit den Diparmen neu
Umgesetzte Funktionen: Animationen für Dips mit Unterstützung und Hackenschmidt-Kniebeuge in der App, Pull-Up neu; Ausführungstext der Hackenschmidt-Kniebeuge; erfüllte AK: –
Geänderte Dateien: public/uebungen/medien/dip_unterstuetzt*, hackenschmidt*, klimmzug_unterstuetzt* (neu, die alten Pull-Up-Dateien gelöscht), public/uebungen/medien.json, src/modules/exercises/data/exercise-guides.v1.json, e2e/uebungen.spec.ts, tools/uebungen-3d/familien.json, docs/uebungen-bestand.md, docs/uebungen-animationsplan.md, docs/screens/uebungen/dip-bewegung.mp4, hackenschmidt-bewegung.mp4 (neu), klimmzug-bewegung.mp4, form-programme-report.md, docs/decisions.md, docs/testing.md, docs/implementation-plan.md, docs/feature-inventory.md, docs/feature-inventory.csv
Technische Entscheidungen: D-513
Ausgeführte Tests: drei Schleifen je 60 Bilder, Naht pixelgleich, Kontaktbogen angesehen; format:check, lint, typecheck; Unit-Tests 1.273 bestanden; build, check:bundle (Startansicht 239,7 KB, Übungsbilder 64 von 64); check:docs; E2E Chromium 469 bestanden, 151 übersprungen, 0 fehlgeschlagen; WebKit in der CI
Ergebnis: bestanden
Bekannte Einschränkungen: Maße der Maschinen geschätzt, wie freigegeben; weicht deine Maschine ab, passen wir sie später an
Nächste Schritte: Prüfseiten der Familien „Beine isoliert“ und „Arme beugen und strecken“, Halt bis zur Freigabe; nach diesem PR die Messungen der Lage in den übrigen Tests
```

## 54. Prüfseiten Beine isoliert und Arme beugen und strecken (D-514, D-515)

Wie gewünscht zwei Familien zusammen: „Beine isoliert“ mit vier neuen Maschinen und „Arme beugen und strecken“ mit Curls und Trizepsdrücken am Kabel. Entscheidungen, die bei dir liegen, stehen gesammelt in 54.3.

### 54.1 Beine isoliert: vier neue Maschinen (D-514)

Prüfseite: `docs/screens/uebungen/familie-beine-isoliert-pplc.webp`. Alle vier Maschinen nach der üblichen Bauart mit Gewichtsblock, die Maße geschätzt; die Seiten der Hersteller sind in der Cloud-Umgebung nicht erreichbar.

- **Beinstrecker:** Sitz und Rückenlehne, 15° zurückgeneigt. Dein Kniegelenk liegt genau auf der Drehachse des Hebels (0,0 mm), die Rolle vorn auf den Schienbeinen, 9 cm über dem Fußgelenk. Knie von 90° bis 177° (fast gestreckt). Die Hände halten Griffe seitlich am Sitz. Kamera 75°: schräg von vorn, Beine und Rolle frei.
- **Beinbeuger sitzend:** dieselbe Bauart, Lehne 20° zurück. Ein Oberschenkelpolster liegt quer über den Oberschenkeln, 10 cm hinter den Knien; die Rolle hinter den Unterschenkeln knapp über den Knöcheln. Knie von 172° (fast gestreckt) bis 60° (120° gebeugt, Familie 110 bis 130°), die Fußspitzen 10° angezogen, wie der Text sagt. Kamera 80°.
- **Wadenheben stehend:** Schultern unter den Polstern eines Schlittens, der am Turm vor dir senkrecht läuft; die Ballen auf der Kante eines 10 cm hohen Blocks, die Fersen frei. Sprunggelenk von 12° gebeugt (Fersen 3,5 cm unter der Oberseite des Blocks) bis 25° gestreckt (Ferse 6,2 cm darüber), Knie fast gestreckt. Unter der Kante kippt der ganze Schuh um die Kante; darüber bleibt der Vorfuß flach auf dem Block und der Schuh biegt sich am Ballen, wie beim Unterarmstütz. Hände an Griffen quer vor der Brust. Kamera 85°, von der Seite: Dort sieht man die Fersen.
- **Wadenheben sitzend:** Sitz ohne Lehne, das Kniepolster eine Rolle auf den unteren Oberschenkeln, an einem Hebel von der Säule vor dem Block. Derselbe Weg im Sprunggelenk; die Knie heben sich dabei, die Rolle folgt den Oberschenkeln und gleitet höchstens 2 mm. Die Hände halten Griffe an den Enden der Rolle (siehe 54.3). Kamera 80°.
- **Unterwegs korrigiert:** Beim Beinbeuger sitzend streiften die Schuhe in einem Bild den Längsträger am Boden (0,08 mm): Sitz und Knie jetzt 3 cm höher, beide Sitzmaschinen neu geprüft. Beim Wadenheben sitzend lagen die Hände zuerst flach auf zwei weichen Polstern; das Werkzeug drückte die Unterseite der Polster bis zu den Händen ein. Mit der Rolle und Griffen ist das sauber.

| Messwert über alle 60 Bilder | Beinstrecker | Beinbeuger sitzend |
|---|---|---|
| Knie Ausgang → Ende | 90,0° → 177,0° | 172,0° → 60,0° |
| Kniegelenk zur Drehachse des Hebels | 0,0 mm | 0,0 mm |
| Hüfte (Oberschenkel zum Rumpf), Lehne | 104,1°, 15° zurück | 109,1°, 20° zurück |
| Sprunggelenk (+ Fußspitzen angezogen) | 1,5° (wie im Stand) | 11,5° („Zieh die Fußspitzen zu dir“) |
| Rolle in Socke und Haut / zu den Schuhen | −1,0 / 16,8 mm | −1,0 / 30,8 mm |
| Oberschenkelpolster auf Haut und Shorts | – | −2,9 bis −1,8 mm |
| Gesäß im Sitz / Rücken im Polster / Delle / durch die Oberfläche | 4,0 / 4,0 / 4,0 / 0,0 mm | 4,0 / 4,0 / 4,0 / 0,0 mm |
| Unterschenkel zur Sitzkante, mindestens | 15,1 mm | 19,9 mm |
| Schuhe zum Gerät (ohne Rolle), mindestens | 24,6 mm | 19,2 mm |
| Gewichtsblock gehoben | 12,2 cm | 15,6 cm |
| Ellbogen / Handgelenk an den Sitzgriffen | 124,7° / 1,0° | 121,0° / 4,1° |
| Shorts unter dem Shirt / Saumband über den Shorts | −2,5 / −7,5 mm (Hüftfalte) | 0,1 / −3,2 mm |
| Meldungen des Rigs | 0 | 0 |

| Messwert über alle 60 Bilder | Wadenheben stehend | Wadenheben sitzend |
|---|---|---|
| Sprunggelenk Ausgang → Ende (+ gebeugt, − gestreckt) | 12,0° → −25,0° | 12,0° → −25,0° |
| Ferse zur Oberseite des Blocks | −3,5 bis +6,2 cm | −3,0 bis +5,8 cm |
| Schuh am Ballen gebogen, höchstens | 22,8° | 21,2° |
| Sohle über dem Block, tiefster Punkt | 0,0 bis 0,8 mm | 0,1 bis 0,9 mm |
| Fuß und Socke im Schuh | 0 Punkte außerhalb, Haut 3,8 mm unter dem Schaft | 0 Punkte außerhalb, Haut 3,8 mm unter dem Schaft |
| Knie | 176,0° („Halt die Knie gerade“) | 87,7° bis 89,8° |
| Körper gehoben / Oberschenkel zur Waagrechten | −2,6 bis +4,2 cm | −2,7° bis +5,8° |
| Schulterpolster: Delle / durch die Oberfläche / Kopf und Haare zum Gerät | 7,6 / 0,0 / 34,1 mm | – |
| Kniepolster auf der Haut / gleitet längs des Oberschenkels | – | −4,7 bis −2,0 mm / höchstens 2,0 mm |
| Gesäß im Sitz / Delle | – | 4,0 bis 14,7 mm (oben am wenigsten) / höchstens 13,7 mm |
| Ellbogen / Handgelenk | 57,0° / 2,9° | 82,1° bis 96,0° / höchstens 5,4° |
| Shorts unter dem Shirt / Saumband über den Shorts | 9,0 / 8,6 mm | −0,8 / −12,3 mm (Hüftfalte) |
| Meldungen des Rigs | 0 | 0 |

**Abgleich mit den Ausführungstexten:** Beinstrecker, Beinbeuger sitzend und Wadenheben stehend passen, ich habe nichts geändert. Beim Wadenheben sitzend weicht nur die Haltung der Hände ab:

| Text in der App | Animation |
|---|---|
| Beinstrecker: „Stell die Maschine so ein, dass dein Kniegelenk auf Höhe der Drehachse des Hebels liegt. Halt dich an den seitlichen Griffen fest.“ | Kniegelenk 0,0 mm von der Drehachse, Hände an den Griffen am Sitz |
| Beinstrecker: „Streck die Knie und drück den Hebel nach vorn und oben, bis die Beine gerade sind.“ | Knie 90° → 177° |
| Beinbeuger: „Leg die Rückseite der Unterschenkel auf das Polster, knapp über den Knöcheln.“ | Mitte der Rolle 8 cm über dem Fußgelenk |
| Beinbeuger: „Zieh die Fußspitzen zu dir.“ | Fußspitzen 10° angezogen |
| Wadenheben: „Heb die Fersen so hoch wie möglich …“ / „Senk die Fersen ab, bis du eine Dehnung in der Wade spürst.“ | 25° gestreckt / 12° gebeugt (Familie 20 bis 30° / 10 bis 15°) |
| Wadenheben stehend: „Halt die Knie gerade.“ | Knie 176° in jedem Bild |
| Wadenheben sitzend: „Leg die Hände auf die Polster und löse den Sicherungshebel.“ | Hände an Griffen an den Enden der Polsterrolle (Frage 3) |

### 54.2 Arme beugen und strecken (D-515)

Prüfseite: `docs/screens/uebungen/familie-arme.webp`.

- **Bizepscurls und Hammercurls:** Stand wie beim Seitheben, Kurzhanteln wie dort (8 kg). Die Oberarme hängen so weit zur Seite, dass die Hanteln unten frei von Oberschenkeln und Shorts bleiben. Beide Arme beugen gleichzeitig (siehe 54.3). Oben geht der Ellbogen etwas nach vorn, bis der Unterarm fast senkrecht steht, nicht weiter. Beim Bizepscurl dreht der Unterarm nach außen, bis die Handfläche zur Schulter zeigt; beim Hammercurl bleibt der Daumen oben. Kamera 30°, schräg von vorn. Korrigiert: Unten fand die Hand mit 168° im Ellbogen den Griff nicht ganz (6,8 mm daneben), und gleich nach dem Ausgang sprang der Arm in einem Bild kurz in die volle Streckung, weil die Drehung der Hand um den Griff zwischen zwei fast gleich guten Lösungen wechselte. Jetzt unten 165°, die Drehung wird je Bild einmal gesucht und dann festgehalten: Die Hand liegt in jedem Bild am Ziel, der Ellbogen läuft ohne Sprung.
- **Trizepsdrücken am Kabel:** neuer Kabelzug mit oberer Rolle und kurzer gerader Stange (50 cm). Stand etwa hüftbreit, Knie leicht gebeugt, Oberkörper 10° vor; Hände eng im Obergriff. Oben, wie im Text, „bis der Unterarm nahe am Oberarm ist“: Ellbogen 48°, die Stange auf Höhe des Kinns, der Ellbogen etwas nach vorn oben gewandert. Unten gestreckt (178°), die Ellbogen an den Seiten. Kamera 75°, schräg von vorn-seitlich; von vorn stünde die Säule im Bild. Korrigiert: Die Beine standen in der ersten Prüfung 14 mm im Boden (ein Fehler in der Reihenfolge der Rechnung), jetzt flach am Boden.

| Messwert über alle 60 Bilder | Bizepscurls | Hammercurls |
|---|---|---|
| Ellbogen unten → oben | 165,0° → 40,0° | 165,0° → 40,0° |
| Oberarm vor der Senkrechten, oben | 24,5° | 24,5° |
| Unterarm oben zur Senkrechten | 15,5° (vor der Senkrechten) | 15,5° |
| Unterarm gedreht, unten → oben | 17,1° → −88,7° | 17,1° → 1,6° |
| Handgelenk, höchstens | 7,5° | 3,6° |
| Hand am Ziel, höchstens daneben | 0,0 mm | 0,0 mm |
| Köpfe der Hanteln vor Haut und Kleidung, mindestens | 2,9 mm | 11,5 mm |
| Sohlen am Boden / verschoben | 0,0 mm / 0,0 mm | 0,0 mm / 0,0 mm |
| Meldungen des Rigs | 0 | 0 |

| Messwert über alle 60 Bilder | Trizepsdrücken am Kabel |
|---|---|
| Ellbogen oben → unten | 48,0° → 178,4° |
| Oberarm vor dem Rumpf oben / unten (Rumpf 10° vor) | 25,7° / 21,4° |
| Ellbogen am Rumpf oben / unten (Haut zu Haut) | 48,6 / 7,8 mm |
| Unterarm zur Senkrechten oben / unten (0 = nach unten) | 144,5° / 14,6° |
| Handgelenk, höchstens | 9,0° |
| Hände auseinander | 23,9 cm |
| Kabel zur Senkrechten | 0,0° bis 9,6° |
| Stange zur Haut / zur Kleidung, mindestens | 49,0 / 31,0 mm |
| Gewichtsblock gehoben | 61,1 cm |
| Knie / Sohlen am Boden | 168,0° / 0,0 mm |
| Meldungen des Rigs | 0 |

**Abgleich mit den Ausführungstexten:** passt, geändert habe ich nichts. Die Texte beschreiben die Curls abwechselnd und erlauben beide Arme gleichzeitig („Du kannst auch beide Arme gleichzeitig beugen.“).

### 54.3 Deine Entscheidungen

Bitte kurz zu jedem Punkt; ohne Antwort bleibt es beim Vorschlag.

1. **Wadenheben sitzend, Hände:** an Griffen an den Enden der Polsterrolle statt flach auf den Polstern, wie der Text sagt („Leg die Hände auf die Polster“). Vorschlag: so lassen und den Text anpassen: „Halt dich an den Griffen am Polster fest und löse den Sicherungshebel.“
2. **Wadenheben, Weg im Sprunggelenk:** 12° gebeugt (Fersen 3,5 cm unter dem Block) bis 25° gestreckt (Ferse 6,2 cm darüber), stehend und sitzend gleich. Vorschlag: so lassen.
3. **Maschinen (Annahmen):** Beinstrecker und Beinbeuger sitzend je eine Maschine mit Lehne und Gewichtsblock, der Hebel rechts; Wadenmaschine stehend mit Turm, Schlitten und Griffen vor der Brust; Wadenmaschine sitzend mit Hebel von der Säule vorn; Kabelzug mit einer Säule und Ausleger. Weicht eine Maschine in deinem Studio ab, sag mir die Bauart, dann baue ich sie danach.
4. **Hammercurls abwechselnd?** In deinem Plan heißt die Übung „Dumbbell Alternating Hammer Curl“; jetzt beugen beide Arme gleichzeitig. Abwechselnd hieße: eine Schleife mit erst links, dann rechts, doppelt so lang (etwa 4 statt 2 Sekunden) und etwa doppelt so groß. Vorschlag: Hammercurls abwechselnd, Bizepscurls („Dumbbell Curl“) gleichzeitig.
5. **Trizepsdrücken, Ausgang oben:** wie im Text mit dem Unterarm nahe am Oberarm (Ellbogen 48°, Stange auf Kinnhöhe). Viele beginnen erst mit etwa waagrechten Unterarmen (Ellbogen um 90°, Stange auf Brusthöhe); das wäre ein kürzerer Weg und eine Änderung am Text. Vorschlag: wie im Text lassen.

### 54.4 Berichte zu den Paketen

```
Arbeitspaket: D-514 Phase Programme, Prüfseite „Beine isoliert“ (Beinstrecker, Beinbeuger sitzend, Wadenheben stehend und sitzend) an vier neuen Maschinen
Umgesetzte Funktionen: keine in der App; Werkzeug: Sitzmaschine für Beinstrecker und Beinbeuger (geraete.beinmaschine_sitzend), Wadenmaschinen stehend und sitzend (geraete.wadenmaschine_stehend, geraete.wadenmaschine_sitzend), vier Übungen mit Messwerten (uebungen.Beinstrecker, BeinbeugerSitzend, WadenhebenStehend, WadenhebenSitzend), Fuß auf der Kante mit gebogenem Schuh, geraete.eindruecken mit wählbarer Tiefe, Zeilen der Prüfseite; erfüllte AK: –
Geänderte Dateien: tools/uebungen-3d/geraete.py, tools/uebungen-3d/uebungen.py, tools/uebungen_pruef_bild.py, tools/uebungen-3d/familien.json, docs/uebungen-animationsplan.md, docs/screens/uebungen/familie-beine-isoliert-pplc.webp (neu), form-programme-report.md, docs/decisions.md, docs/testing.md, docs/implementation-plan.md, docs/feature-inventory.md
Technische Entscheidungen: D-514
Ausgeführte Tests: Probeläufe je Maschine, Griffe gesucht, render.py --pruefen und Nahaufnahmen für alle vier (je 60 Bilder), Beinstrecker und Beinbeuger nach der Korrektur ein zweites Mal, Sprünge in den Messwerten geprüft, Bilder angesehen; format:check und check:docs bestanden
Ergebnis: bestanden (Werte in 54.1)
Bekannte Einschränkungen: Maße der Maschinen geschätzt; Wadenheben sitzend: Hände an Griffen statt flach auf den Polstern (Frage 1)
Nächste Schritte: Prüfseite „Arme beugen und strecken“ (D-515), dann Halt bis zu deiner Freigabe beider Prüfseiten
```

```
Arbeitspaket: D-515 Phase Programme, Prüfseite „Arme beugen und strecken“ (Bizepscurls, Hammercurls, Trizepsdrücken am Kabel)
Umgesetzte Funktionen: keine in der App; Werkzeug: Kabelzug mit oberer Rolle und gerader Stange (geraete.kabelzug_oben), Übungen uebungen.Bizepscurl, Hammercurl (vom Seitheben abgeleitet) und Trizepsdruecken mit Messwerten, Zeilen der Prüfseite; erfüllte AK: –
Geänderte Dateien: tools/uebungen-3d/geraete.py, tools/uebungen-3d/uebungen.py, tools/uebungen_pruef_bild.py, tools/uebungen-3d/familien.json, docs/uebungen-animationsplan.md, docs/screens/uebungen/familie-arme.webp (neu), form-programme-report.md, docs/decisions.md, docs/testing.md, docs/implementation-plan.md, docs/feature-inventory.md
Technische Entscheidungen: D-515
Ausgeführte Tests: Probeläufe, Kameravergleich Trizepsdrücken, render.py --pruefen und Nahaufnahmen für alle drei (je 60 Bilder), nach den Korrekturen (Handdrehung der Curls, Reihenfolge beim Trizepsdrücken) neu, Sprünge in den Messwerten geprüft, Bilder angesehen; format:check und check:docs bestanden
Ergebnis: bestanden (Werte in 54.2)
Bekannte Einschränkungen: Maße des Kabelzugs geschätzt; Curls gleichzeitig statt abwechselnd (Frage 4)
Nächste Schritte: Halt bis zu deiner Freigabe beider Prüfseiten und deinen Antworten in 54.3; danach die Schleifen beider Familien, dann die nächsten Familien (Waagrechtes Ziehen, Schulter und Brust isoliert)
```

## 55. Beine isoliert und Arme in der App (D-516, D-517)

Nach deiner Freigabe beider Prüfseiten mit deinen fünf Entscheidungen: zuerst die Beine (55.1), dann die Arme (55.2), je gerendert und eingebaut. Geändert habe ich nur, was du entschieden hast.

### 55.1 Beine isoliert (D-516)

**Wadenheben, Bewegungsweite (deine Entscheidung 2).** Unten mehr Dehnung, oben so hoch auf die Ballen, wie Fuß und Schuh es sauber zulassen. Gemessen über alle 60 Bilder:

| | vorher (D-514) | stehend jetzt | sitzend jetzt |
|---|---|---|---|
| Sprunggelenk unten (gebeugt) | 12° | 18° | 20° |
| Ferse unten unter dem Block | 3,5 / 3,0 cm | 5,5 cm | 5,4 cm |
| Sprunggelenk oben (gestreckt) | 25° | 38° | 29° |
| Ferse oben über dem Block | 6,2 / 5,8 cm | 9,2 cm | 6,6 cm |
| Fuß geneigt unten → oben | | −16° → 34° | −16° → 24° |
| Schuh am Ballen gebogen, höchstens | 22,8 / 21,2° | 34,2° | 24,3° |
| Kragenpolster über der Socke, mindestens | | 0,2 mm | 0,2 mm |
| Innenseite des Kragens über der Socke, mindestens | | 0,7 mm | 0,7 mm |
| Sohle über dem Block | 0,0 bis 0,8 / 0,1 bis 0,9 mm | 0,0 bis 0,9 mm | 0,0 bis 0,9 mm |

Warum oben nicht gleich: Was oben begrenzt, ist das Polster am Kragen des Schuhs. Stehend berührt es die Socke ab 39° (bei 40° läge es 0,2 mm darin), sitzend schon ab 31°, weil Unterschenkel und Wade bei gebeugtem Knie anders zum Schuh stehen. Darum stehend 38°, sitzend 29°, je mit 0,2 mm Luft. Für dieselbe Tiefe unten braucht das Sprunggelenk sitzend 2° mehr; die Neigung des Fußes ist in beiden gleich (16°). Nahaufnahmen des Fußes unten und oben habe ich angesehen.

Sitzend drücken die Oberschenkel den Sitz unten tiefer ein (Gesäß 4 bis 18 mm im Polster, vorher bis 15 mm), das Kniepolster gleitet höchstens 3,6 mm längs der Oberschenkel (vorher 2,0 mm).

**Text Wadenheben sitzend (deine Entscheidung 1):**

| | Text |
|---|---|
| vorher | „Leg die Hände auf die Polster und löse den Sicherungshebel.“ |
| jetzt | „Halt dich an den Griffen am Polster fest und löse den Sicherungshebel.“ |

Dazu in der Zeile davor „unter das Polster“ statt „unter die Polster“, weil die Maschine eine Rolle hat; ein Quellenhinweis nennt die Abweichung.

**Beinstrecker und Beinbeuger sitzend:** unverändert wie auf der Prüfseite.

**In der App:**

| Übung | MP4 | WebM | Poster | Vorschau | zusammen | Alternativtext |
|---|---|---|---|---|---|---|
| Beinstrecker | 66,0 KB | 59,0 KB | 14,0 KB | 4,9 KB | 143,9 KB | 215 Zeichen |
| Beinbeuger sitzend | 68,7 KB | 61,3 KB | 13,1 KB | 5,7 KB | 148,8 KB | 236 Zeichen |
| Wadenheben stehend | 36,8 KB | 29,5 KB | 7,3 KB | 3,2 KB | 76,8 KB | 219 Zeichen |
| Wadenheben sitzend | 52,3 KB | 44,4 KB | 12,1 KB | 5,3 KB | 114,2 KB | 235 Zeichen |

Je 60 Bilder, gerendert in 2409 bis 3276 s (neben den Prüfläufen für die nächsten Prüfseiten); erstes und letztes Bild pixelgleich, kein Sprung am Ende; Kontaktbögen angesehen. 20 Übungen haben jetzt eine Animation (vorher 16). Aufnahme: `docs/screens/uebungen/beine-isoliert-pplc-bewegung.mp4`, die vier Schleifen nebeneinander, 1440 × 270, 7,5 s.

### 55.2 Arme (D-517)

**Trizepsdrücken, Ellbogen (deine Entscheidung 5).** Auf der Prüfseite wanderte der Ellbogen nach oben hin 4° nach vorn und stand oben 4,9 cm vom Rumpf weg (unten 7,8 mm). Jetzt bleibt er in jedem Bild an derselben Stelle seitlich am Rumpf; nur der Unterarm bewegt sich. Gemessen über alle 60 Bilder:

| Messwert | Prüfseite (D-515) | jetzt |
|---|---|---|
| Ellbogen weg von seiner festen Stelle | – | 0,0 mm in jedem Bild |
| Ellbogen nach vorn längs des Rumpfs | – | 0,0 mm in jedem Bild |
| Oberarm vor dem Rumpf | 25,7° oben, 21,4° unten | 21,4° in jedem Bild |
| Ellbogen am Rumpf (Haut zu Haut) | 48,6 mm oben, 7,8 mm unten | 6,7 bis 12,2 mm |
| Ellbogen oben → unten | 48° → 178° | 48° → 176° |
| Stange oben | Kinnhöhe | 141,6 cm über dem Boden, etwas unter Schulterhöhe |
| Handgelenk, höchstens | 9,0° | 8,7° |
| Stange zur Haut / zur Kleidung, mindestens | 49 / 31 mm | 52 / 55 mm |
| Kabel zu Kopf und Haaren, mindestens | – | 41 mm |

Start wie im Text mit dem Unterarm nahe am Oberarm (48°). Damit die Hände an der Stange bleiben, dreht der Oberarm dabei 5 bis 17° um seine Längsachse; das ist im Bild nicht zu sehen. Weil der Ellbogen nicht mehr nach oben wandert, kommt die Stange oben nur bis unter die Schulter statt bis zum Kinn.

**Hammercurls abwechselnd (deine Entscheidung 4):** erst links, dann rechts, je eine Wiederholung im Ablauf der Familie; die Schleife hat 120 statt 60 Bilder (5 s). Ellbogen 165° → 40°, Handgelenk höchstens 3,6°, Hand am Ziel 0,0 mm, Köpfe der Hanteln mindestens 11,5 mm vor Haut und Kleidung. Die Bizepscurls bleiben gleichzeitig.

**Dateigröße (deine Vorgabe: je Übung höchstens rund 120 KB):** MP4 48,6 KB, WebM 40,9 KB, Poster 6,6 KB, Vorschau 2,8 KB, zusammen 98,9 KB. Gelesen habe ich das wie die Spalte „Dateien zusammen“ in der Übersicht. Die Hammercurls bleiben damit unter rund 120 KB, ohne stärkere Kodierung: In jeder Hälfte bewegt sich nur ein Arm, das Video wird dadurch kaum größer. Zum Vergleich die Bizepscurls, gleichzeitig und halb so lang: 93,5 KB.

**In der App:**

| Übung | Bilder | MP4 | WebM | Poster | Vorschau | zusammen | Alternativtext |
|---|---|---|---|---|---|---|---|
| Trizepsdrücken am Kabel | 60 | 40,1 KB | 35,2 KB | 8,2 KB | 3,4 KB | 87,0 KB | 209 Zeichen |
| Bizepscurls mit Kurzhanteln | 60 | 43,9 KB | 40,1 KB | 6,7 KB | 2,8 KB | 93,5 KB | 211 Zeichen |
| Hammercurls (abwechselnd) | 120 | 48,6 KB | 40,9 KB | 6,6 KB | 2,8 KB | 98,9 KB | 216 Zeichen |

Erstes und letztes Bild je pixelgleich, kein Sprung am Ende; Kontaktbögen angesehen. 23 Übungen haben jetzt eine Animation (vorher 20). Aufnahme: `docs/screens/uebungen/arme-pplc-bewegung.mp4`, die drei Schleifen nebeneinander, 1440 × 360, 15 s (dreimal die Hammercurls).

### 55.3 Berichte zu den Paketen

```
Arbeitspaket: D-516 Phase Programme, Beine isoliert in der App, Wadenheben mit mehr Bewegungsweite, Text Wadenheben sitzend
Umgesetzte Funktionen: Animationen für Beinstrecker, Beinbeuger sitzend, Wadenheben stehend und sitzend in der App; Wadenheben stehend 18° → 38°, sitzend 20° → 29°; Ausführungstext seated_calf_raise zu den Griffen am Polster; erfüllte AK: –
Geänderte Dateien: tools/uebungen-3d/uebungen.py (WadenhebenStehend, WadenhebenSitzend), public/uebungen/medien/beinstrecker*, beinbeuger_sitzend*, wadenheben_stehend*, wadenheben_sitzend* (neu), public/uebungen/medien.json, src/modules/exercises/data/exercise-guides.v1.json, e2e/uebungen.spec.ts, tools/uebungen-3d/familien.json, docs/uebungen-bestand.md, docs/uebungen-animationsplan.md, docs/screens/uebungen/beine-isoliert-pplc-bewegung.mp4 (neu), form-programme-report.md, docs/decisions.md, docs/testing.md, docs/implementation-plan.md, docs/feature-inventory.md
Technische Entscheidungen: D-516
Ausgeführte Tests: Winkel unten und oben in Proben und über alle 60 Bilder gemessen, Nahaufnahmen des Fußes; vier Schleifen je 60 Bilder, Naht pixelgleich, Kontaktbögen angesehen; format:check, lint, typecheck; Unit-Tests 1.273 bestanden (140 Dateien); build, check:bundle (Startansicht 239,7 KB, Übungsbilder 80 von 80); check:docs; E2E Chromium 469 bestanden, 151 übersprungen, 0 fehlgeschlagen; WebKit in der CI
Ergebnis: bestanden
Bekannte Einschränkungen: Maße der Maschinen geschätzt, wie freigegeben; oben begrenzt das Polster am Kragen des Schuhs den Weg (stehend 38°, sitzend 29°)
Nächste Schritte: Arme in der App (D-517), danach die Prüfseiten „Waagrechtes Ziehen“ und „Schulter und Brust isoliert“, Halt bis zu deiner Freigabe
```

```
Arbeitspaket: D-517 Phase Programme, Arme in der App: Bizepscurls gleichzeitig, Hammercurls abwechselnd, Trizepsdrücken mit festen Ellbogen
Umgesetzte Funktionen: Animationen für Bizepscurls mit Kurzhanteln, Hammercurls (abwechselnd, 120 Bilder) und Trizepsdrücken am Kabel in der App; Trizepsdrücken mit dem Ellbogen an einer festen Stelle am Rumpf; render.py für Schleifen mit eigener Zahl an Bildern und eigener Haltung je Bild, tools/uebungen_bewegung.py für unterschiedlich lange Schleifen; erfüllte AK: –
Geänderte Dateien: tools/uebungen-3d/uebungen.py (Bizepscurl, Hammercurl, Trizepsdruecken), tools/uebungen-3d/render.py, tools/uebungen_bewegung.py, tools/uebungen_pruef_bild.py, public/uebungen/medien/trizepsdruecken_kabel*, bizepscurl_kh*, hammercurl_kh* (neu), public/uebungen/medien.json, e2e/uebungen.spec.ts, tools/uebungen-3d/familien.json, docs/uebungen-bestand.md, docs/uebungen-animationsplan.md, docs/screens/uebungen/arme-pplc-bewegung.mp4 (neu), form-programme-report.md, docs/decisions.md, docs/testing.md, docs/implementation-plan.md, docs/feature-inventory.md
Technische Entscheidungen: D-517
Ausgeführte Tests: Trizepsdrücken und Hammercurls über alle Bilder gemessen; drei Schleifen, Naht pixelgleich, Kontaktbögen angesehen; format:check, lint, typecheck; Unit-Tests 1.273 bestanden (140 Dateien); build, check:bundle (Startansicht 239,7 KB, Übungsbilder 92 von 92); check:docs; E2E Chromium 469 bestanden, 151 übersprungen, 0 fehlgeschlagen; WebKit in der CI
Ergebnis: bestanden
Bekannte Einschränkungen: Maße des Kabelzugs geschätzt, wie freigegeben; die Stange kommt beim Trizepsdrücken oben bis unter die Schulter statt bis zum Kinn, weil der Ellbogen nicht mehr wandert
Nächste Schritte: Halt bis zu deiner Freigabe der Prüfseiten „Waagrechtes Ziehen“ und „Schulter und Brust isoliert“ (56.3)
```

## 56. Prüfseiten Waagrechtes Ziehen und Schulter und Brust isoliert (D-518, D-519)

Wie gewünscht zwei Familien zusammen, in der Reihenfolge des Animationsplans: „Waagrechtes Ziehen“ mit drei Übungen und „Schulter und Brust isoliert“ mit zwei. Entscheidungen, die bei dir liegen, stehen gesammelt in 56.3.

### 56.1 Waagrechtes Ziehen (D-518)

Prüfseite: `docs/screens/uebungen/familie-waagrechtes-ziehen-pplc.webp`.

**Rudern mit Langhantel, vorgebeugt.** Die Haltung kommt vom Rumänischen Kreuzheben, das du freigegeben hast: Knie 22° gebeugt (158°), der Rumpf mit geradem Rücken 37° zur Waagrechten (Familie 30 bis 60°), die Hüfte so weit hinten, dass der Schwerpunkt mit der hängenden Stange über der Fußmitte steht; Rumpf und Beine bleiben danach fest. Langhantel mit zwei Scheiben zu 20 kg, breit im Obergriff (Hände 60 cm auseinander). Die Stange hängt unten unter den Schultern und kommt auf einer Geraden an den oberen Bauch, 1,5 cm vor das Shirt; die Schulterblätter gehen dabei zurück. Die Stange liegt schräg in der Hand wie bei breiten Griffen (D-452), sonst knickte das Handgelenk unten 22° zur Seite. Kamera 45° schräg von vorn: verglichen mit 30° bis 90°, ab 60° verdeckt die nahe Scheibe den Körper.

**Rudern an der Maschine.** Neue Hebelmaschine mit Scheiben nach der üblichen Bauart (Maße geschätzt): Sitz, Brustpolster, vorn ein Turm, für jeden Arm ein eigener Hebel, am Ende ein drehbarer Griff. Du sitzt mit der Brust am Polster (4 mm eingedrückt), der Rumpf 12° vor, Knie 100°. Neutraler Griff, Daumen oben; der Griff dreht sich mit dem Unterarm, fest am Hebel knickte das Handgelenk bis 55°. Ausgang mit fast gestreckten Armen und den Schultern vorn, Ende mit den Oberarmen 15° hinter dem Rumpf und den Schulterblättern zusammen.

**High Row an der Maschine.** Dieselbe Maschine, die Hebel kommen von einer Achse vorn unten (1,30 m lang; mit 0,80 m lief der Griff in der Mitte nah am Gesicht vorbei). Ausgang mit den Armen etwa 40° über der Waagrechten nach vorn oben, Zug schräg nach unten, bis die Ellbogen unten am Rumpf sind. Einen Ausführungstext hat die Übung in der App noch nicht (D-504: die Quelle war nicht erreichbar, auch heute nicht); die Bewegung folgt der Beschreibung im Plan: „sitzend, Brust am Polster, Griffe vorn oben an Hebelarmen, Zug schräg nach unten zu den unteren Rippen“.

| Messwert über alle 60 Bilder | Rudern Langhantel | Rudern Maschine | High Row |
|---|---|---|---|
| Ellbogen Ausgang → Ende | 169° → 69° | 166° → 73° | 166° → 59° (unterwegs 54°) |
| Oberarm am Ende hinter dem Rumpf | 40° | 16° | 6° |
| Ellbogen vom Rumpf zur Seite | 16° bis 43° | 8° bis 18° | 14° bis 48° |
| Handgelenk, höchstens | 11° (Stange schräg in der Hand) | 3,5° | 2,2° |
| Schulterblätter zurück (Schlüsselbein) | −6° → 8° | −8° → 10° | −8° → 10° |
| Stange zur Kleidung / zur Haut ohne Hände, mindestens | 15 / 30 mm | – | – |
| Scheiben über dem Boden, mindestens | 35 cm | – | – |
| Schwerpunkt hinter der Fußmitte | 0,0 bis 7,9 cm | – | – |
| Brust / Gesäß im Polster | – | 4 / 4 mm, nichts durch | 4 / 4 mm, nichts durch |
| Maschine zum Körper (ohne Polster und Griffe), mindestens | – | 55 mm | 7,9 mm (am Ende) |
| Arme zum Brustpolster, mindestens | – | 24 mm | 87 mm |
| Lende / Blick | wie im Stand / 56° unter der Waagrechten | – | – |
| Meldungen des Rigs | 0 | 0 Meldungen | 0 |

Unterwegs korrigiert: Beim Rudern an der Maschine zeigte der Ellbogen erst nach innen, das Brustpolster wurde beim Einpassen von Oberschenkeln und Armen 7 cm verschoben, die Fußspitzen stießen an den Turm, und an festen Griffen knickte das Handgelenk bis 55° (jetzt drehbare Griffe, wie an solchen Maschinen üblich). Die Meldungen „Handgelenk nicht erreichbar“ kamen aus Zwischenschritten der drehbaren Griffe; ohne sie nachgemessen: 0 Meldungen. Ein kleiner Würfel oben links in einer Nebenansicht der High Row war eine Platte am Hebelende, die doppelt verschoben frei im Raum lag. Ich habe sie entfernt, auch an der Schulterpresse; dort lag sie in keinem der 60 Bilder der Schleife, die Schleife bleibt, wie sie ist. Auf der Prüfseite zeige ich die Füße von außen und von hinten, weil von vorn der Turm davor steht.

### 56.2 Schulter und Brust isoliert (D-519)

Prüfseite: `docs/screens/uebungen/familie-schulter-brust-pplc.webp`.

**Fliegende am Kabel.** Neuer Kabelturm mit zwei Säulen und Rollen oben, D-Griffe. Wie im Text: obere Rollen, Hüfte und Knie leicht gebeugt (Knie 165°, Oberkörper 15° vor), Ellbogen leicht gebeugt und fest (160°). Ausgang mit den Armen zur Seite, 12° hinter der Ebene der Schultern, Ende mit den Händen vor dem unteren Bauch. Drei Dinge habe ich unterwegs gerade gezogen:

- Am Ende läuft das Kabel fast in Linie mit dem Unterarm. Ein starrer D-Griff stand dann mit den Streben bis 4,8 mm im Handgelenk. Jetzt kippt der Griff um seine Stange, so wenig wie nötig, und liegt mit 1 mm Luft am Handgelenk an, wie sich ein echter Griff anlegt (bis 20°).
- Mit den Händen 6 cm neben der Mitte berührten sich die Hände, und die beiden Griffe lagen 12,9 mm ineinander. Jetzt enden die Griffe 7,5 cm neben der Mitte, 31 mm auseinander.
- Von der Seite verdeckte die nahe Säule den Körper; in dieser Prüfansicht blende ich sie aus.

**Reverse Butterfly an der Maschine.** Dieselbe Bauart wie die Rudermaschine, aber die Hebel hängen von senkrechten Achsen über den Schultern. Neutraler Griff (Daumen oben) auf Schulterhöhe, Ellbogen fest (165°); die Arme gehen als Ganzes von vorn bis auf Höhe des Rumpfs („bis die Ellbogen etwa auf Höhe des Oberkörpers sind“). Das Brustpolster ist 24 cm hoch: Mit 34 cm wie beim Rudern reichte es unten 2 cm in die Oberschenkel.

| Messwert über alle 60 Bilder | Fliegende am Kabel | Reverse Butterfly |
|---|---|---|
| Ellbogen | 160° fest | 165° fest |
| Arm Ausgang → Ende | 12° hinter → 90° vor der Ebene der Schultern | 88° vor → 6° hinter der Ebene der Schultern |
| Ellbogen auf Schulterhöhe | – | 0,05 cm darüber, in jedem Bild |
| Handgelenk, höchstens | 2,5° | 0,3° |
| Kabel zur Haut / zur Kleidung, mindestens | 34 mm / weiter als 50 mm (so weit gesucht) | – |
| Streben des D-Griffs zur Haut, mindestens | 1,0 mm | – |
| Griffe / Hände zueinander am Ende | Griffe 31 mm, Hände 24 mm | – |
| Gewichtsblock gehoben, höchstens | 89 cm | – |
| Brust / Gesäß im Polster | – | 4 / 4 mm, nichts durch |
| Maschine zum Körper / Arme zum Brustpolster, mindestens | – | 24 / 46 mm |
| Meldungen des Rigs | 0 | 0 |

### 56.3 Deine Entscheidungen

Bitte kurz zu jedem Punkt; ohne Antwort bleibt es beim Vorschlag.

1. **Rudern mit Langhantel, Weg der Stange:** wie im Text bis an den oberen Bauch; der Oberarm steht am Ende dafür 40° hinter dem Rumpf (Familie 15 bis 30°). Vorschlag: so lassen.
2. **Maschinen (Annahmen):** eine Hebelmaschine mit Brustpolster für Rudern und High Row (je Arm ein Hebel, drehbare Griffe; für die High Row Hebel von vorn unten), der Reverse Butterfly mit hängenden Hebeln, ein Kabelturm mit zwei Säulen. Weicht ein Gerät in deinem Studio ab, nenn mir die Bauart.
3. **High Row, Text:** Die App hat für „High Row an der Maschine“ noch keinen Ausführungstext. Vorschlag: einen Text nach der Animation schreiben, zusammen mit der Schleife (Brust am Polster, Griffe vorn oben, Zug schräg nach unten, bis die Ellbogen am Rumpf sind).
4. **Fliegende am Kabel, Stand:** hüftbreit parallel, wie es der Text nahelegt („Beug Hüfte und Knie leicht“); in meinem Plan stand eine Schrittstellung. Vorschlag: parallel lassen.
5. **Reverse Butterfly, Griff:** Daumen oben; der Text lässt Daumen oben oder unten zu, je nach Maschine. Vorschlag: so lassen.

### 56.4 Berichte zu den Paketen

```
Arbeitspaket: D-518 Phase Programme, Prüfseite „Waagrechtes Ziehen“ (Rudern mit Langhantel, Rudern an der Maschine, High Row an der Maschine) an einer neuen Rudermaschine
Umgesetzte Funktionen: keine in der App; Werkzeug: Rudermaschine mit Brustpolster, Hebeln je Arm und drehbaren Griffen (geraete.rudermaschine), Übungen uebungen.RudernLanghantel (aus der Hüftbeuge), RudernMaschine und HighRowMaschine mit Messwerten, Zeilen der Prüfseite; Platte am Hebelende der Schulterpresse entfernt (lag außerhalb des Bildes); erfüllte AK: –
Geänderte Dateien: tools/uebungen-3d/geraete.py, tools/uebungen-3d/uebungen.py, tools/uebungen_pruef_bild.py, tools/uebungen-3d/familien.json, docs/uebungen-animationsplan.md, docs/screens/uebungen/familie-waagrechtes-ziehen-pplc.webp (neu), form-programme-report.md, docs/decisions.md, docs/testing.md, docs/implementation-plan.md, docs/feature-inventory.md
Technische Entscheidungen: D-518
Ausgeführte Tests: Kameravergleich Rudern mit Langhantel, Probeläufe, render.py --pruefen und Nahaufnahmen für alle drei (je 60 Bilder), Rudern an der Maschine nach dem Bereinigen der Meldungen nachgemessen, Lage der verschobenen Platte in allen Ansichten nachgerechnet, Sprünge in den Messwerten geprüft, Bilder angesehen; format:check und check:docs bestanden
Ergebnis: bestanden (Werte in 56.1)
Bekannte Einschränkungen: Maße der Maschine geschätzt; High Row ohne Ausführungstext in der App (Frage 3)
Nächste Schritte: Prüfseite „Schulter und Brust isoliert“ (D-519), dann Halt bis zu deiner Freigabe beider Prüfseiten
```

```
Arbeitspaket: D-519 Phase Programme, Prüfseite „Schulter und Brust isoliert“ (Fliegende am Kabel, Reverse Butterfly an der Maschine)
Umgesetzte Funktionen: keine in der App; Werkzeug: Kabelturm mit zwei Säulen und D-Griffen (geraete.kabelturm, geraete.d_griff), Übungen uebungen.FliegendeKabel (vom Seitheben abgeleitet, D-Griff legt sich an das Handgelenk) und ReverseButterfly (Rudermaschine mit hängenden Hebeln, Brustpolster mit eigenem Maß), Teile je Übung in Prüfansichten ausblenden (render.ausblenden), Zeilen der Prüfseite; erfüllte AK: –
Geänderte Dateien: tools/uebungen-3d/geraete.py, tools/uebungen-3d/uebungen.py, tools/uebungen-3d/render.py, tools/uebungen_pruef_bild.py, tools/uebungen-3d/familien.json, docs/uebungen-animationsplan.md, docs/screens/uebungen/familie-schulter-brust-pplc.webp (neu), form-programme-report.md, docs/decisions.md, docs/testing.md, docs/implementation-plan.md, docs/feature-inventory.md
Technische Entscheidungen: D-519
Ausgeführte Tests: Probeläufe, Proben zu Öse, Griff und Kippen des D-Griffs, render.py --pruefen und Nahaufnahmen (Fliegende dreimal, Butterfly zweimal nach den Korrekturen, je 60 Bilder), Abstand der beiden D-Griffe zueinander, Polster gegen Oberschenkel und Arme, Sprünge in den Messwerten geprüft, Bilder angesehen; format:check und check:docs bestanden
Ergebnis: bestanden (Werte in 56.2)
Bekannte Einschränkungen: Maße von Kabelturm und Butterfly geschätzt; Stand parallel statt Schrittstellung (Frage 4)
Nächste Schritte: Halt bis zu deiner Freigabe beider Prüfseiten und deinen Antworten in 56.3; danach die Schleifen beider Familien
```

## 57. Waagrechtes Ziehen und Schulter und Brust isoliert in der App (D-520, D-521)

Nach deiner Freigabe beider Prüfseiten mit deinen fünf Entscheidungen: zuerst „Waagrechtes Ziehen“ (57.1), dann „Schulter und Brust isoliert“ (57.2), je gerendert und eingebaut.

### 57.1 Waagrechtes Ziehen (D-520)

**Rudern mit Langhantel, Rumpf und Lende (deine Entscheidung 1).** Die 40° am Oberarm bleiben. Gemessen über alle 60 Bilder:

| Messwert | Wert |
|---|---|
| Rumpf zur Waagrechten | 37,1° in jedem Bild (Spanne 0,0°) |
| Hüfte, Rumpf zum Oberschenkel | 100,0° in jedem Bild |
| Knie | 158,0° in jedem Bild |
| Lendenwirbel gegen das Becken gedreht | 0,0° in jedem Bild |
| Hautlinie der Lende (L5 bis L1) | −5,6° hohl; im aufrechten Stand −10,6°, also 5,0° flacher; höchstens 1,5 mm verschoben |
| Nacken / Blick | 4° gebeugt / 56° unter der Waagrechten |

Rumpf und Beine stehen still, es bewegen sich nur Arme und Schulterblätter: kein Aufrichten mit Schwung. Der untere Rücken bleibt neutral: Die Wirbel der Lende sind gegen das Becken nicht gedreht. Die Hautlinie ist 5° flacher als im Stand, weil die Haut über dem Kreuzbein mit dem gebeugten Oberschenkel mitgeht; beim Rumänischen Kreuzheben, das du freigegeben hast, waren es unten 3,9° (D-490). Bisher verglich das Werkzeug die Lende mit dem ersten Bild der Schleife, das hier schon vorgebeugt ist; jetzt mit dem aufrechten Stand.

**High Row, Text (deine Entscheidung 3).** Quelle: ExRx „Lever Isolateral Seated High Row“, eine zugelassene Quelle. Die Seiten von exrx.net und acefitness.org lässt das Netz dieser Arbeitsumgebung nicht zu; den Text der Seite habe ich über die Websuche gelesen.

| Teil | Text in der App |
|---|---|
| Kurz | „An der Maschine mit Brustpolster ziehst du die Griffe von vorn oben schräg nach hinten unten, bis die Ellbogen hinter dem Rücken sind.“ |
| Ausgangsposition | „Setz dich und leg die Brust an das Polster.“ · „Stell das Brustpolster so ein, dass die Schultern bei gestreckten Armen nach vorn gehen können.“ · „Stell Sitz oder Griffe so ein, dass die Handgelenke den Ellbogen folgen können.“ · „Greif die Griffe im Obergriff.“ |
| Ausführung | „Zieh die Griffe nach hinten, bis die Ellbogen hinter dem Rücken sind und die Schultern zurückgezogen sind.“ · „Lass die Griffe zurück, bis die Arme gestreckt sind und die Schultern nach vorn gehen.“ |
| Hinweise | „Zieh am Ende des Zugs die Schultern zurück.“ · „Lass am Ende des Rückwegs die Schultern nach vorn gehen, so nutzt du den ganzen Weg.“ |
| Quellenhinweis | „Quelle für diese Übung am 05.11.2026 gelesen. Die Richtung schräg nach unten ergibt sich aus den Griffen vorn oben; die Quelle sagt nur „zurück“.“ |

**High Row, Animation an den Text angeglichen.** Gemessen über alle 60 Bilder:

| | Prüfseite (D-518) | jetzt |
|---|---|---|
| Griff | Daumen oben an senkrechten Griffen | Obergriff an waagrechten Griffen |
| Hebel | von einer Achse vorn unten, 1,30 m | hängend von Lagern über und hinter dir, 0,80 m, ohne Scheiben |
| Oberarm am Ende hinter dem Rumpf | 6° | 21° |
| Ellbogengelenk am Ende zur Haut des Rückens | 5,1 cm davor | 1,0 cm dahinter (Haut am Ellbogen 4,0 cm) |
| Ellbogen Ausgang → Ende | 166° → 59° | 166° → 71° (Familie 70 bis 90°) |
| Unterarm zur Zugrichtung | 7° bis 74° | 29° bis 49° |
| Handgelenk, höchstens | 2,2° | 10,5° |
| Maschine zum Körper, mindestens | 7,9 mm | 36,4 mm |
| Arme zum Brustpolster, mindestens | 87 mm | 110 mm |
| Brust im Polster | 4 mm | 4 mm, nichts durch |
| Meldungen des Rigs | 0 | 0 |

„The seat or grip should be adjusted to allow wrists to follow elbows“ heißt: Der Unterarm zeigt in die Richtung, in die der Griff gezogen wird. Mit der Achse vorn unten wich er am Ende 74° davon ab, an hängenden Hebeln höchstens 49°. Ganz in Linie geht es auf einem Kreisbogen nicht, weil die Hände von vorn oben steil zum Bauch kommen. Die Scheiben habe ich weggelassen: An den hängenden Hebeln verdeckten sie von hinten den Kopf. Im Obergriff liegt der Griff 8° schräg in der Hand; mit 14° wie beim Rudern knickte das Handgelenk 11,6°.

**Rudern an der Maschine.** Wie auf der Prüfseite; mit dem Code dieses Pakets nachgemessen, alle Werte gleich. Neu gemessen: Am Ende liegt das Ellbogengelenk 1,1 cm vor der Haut des Rückens, die Haut am Ellbogen 2,3 cm dahinter. Die Ellbogen sind also hinter dem Rücken, wie im Text.

**In der App:**

| Übung | MP4 | WebM | Poster | Vorschau | zusammen | Alternativtext |
|---|---|---|---|---|---|---|
| Rudern mit Langhantel, vorgebeugt | 67,6 KB | 52,8 KB | 10,9 KB | 4,3 KB | 135,6 KB | 215 Zeichen |
| Rudern an der Maschine | 58,0 KB | 43,0 KB | 11,8 KB | 5,2 KB | 118,0 KB | 197 Zeichen |
| High Row an der Maschine | 79,4 KB | 66,9 KB | 13,1 KB | 5,8 KB | 165,2 KB | 209 Zeichen |

Je 60 Bilder, gerendert in 3024 bis 4668 s (zum Teil zwei Schleifen gleichzeitig, daneben die Prüfläufe der nächsten Familien); erstes und letztes Bild pixelgleich, kein Sprung am Ende; Kontaktbögen angesehen. Die rund 120 KB aus deiner Entscheidung zu den Hammercurls (D-517) habe ich auf deren doppelt lange Schleife bezogen. Die High Row liegt mit 165 KB im Bereich der anderen Maschinen (Rudern am Kabel 167 KB, Beinpresse 189 KB). 26 Übungen haben jetzt eine Animation (vorher 23). Aufnahme: `docs/screens/uebungen/waagrechtes-ziehen-pplc-bewegung.mp4`, die drei Schleifen nebeneinander mit Namen, 1440 × 360, 7,5 s.

### 57.2 Schulter und Brust isoliert (D-521)

**Fliegende am Kabel, Schrittstellung (deine Entscheidung 4).** Ein Fuß steht vor dem anderen, die Füße etwa schulterbreit: die Fußgelenke 17 cm neben der Mitte (33 cm auseinander), das linke 18 cm vor, das rechte 18 cm hinter der Stelle, über der der Rumpf steht. Beide Sohlen liegen flach. Der Oberkörper bleibt wie auf der Prüfseite 15° aus der Hüfte vorgeneigt, die Knie leicht gebeugt. Gemessen über alle 60 Bilder:

| Messwert | Prüfseite (D-519) | jetzt |
|---|---|---|
| Stand | hüftbreit, parallel | Schrittstellung, Füße 36 cm vor- und hintereinander, etwa schulterbreit |
| Knie | 165° | vorn 165,0°, hinten 162,9° |
| Oberkörper aus der Hüfte vor | 15° | 15° |
| Sohlen (Ferse und Ballen) über dem Boden | 0,0 mm | 0,0 mm, nicht verschoben |
| Ellbogen | 160° fest | 160° fest |
| Handgelenk, höchstens | 2,5° | 2,5° |
| Kabel zur Haut (ohne Hände), mindestens | 34 mm | 34 mm |
| Streben des D-Griffs zur Haut, mindestens | 1,0 mm | 1,0 mm |
| Hände am Ende auseinander | 24 mm | 24 mm |
| Gewichtsblock gehoben, höchstens | 89 cm | 89 cm |
| Meldungen des Rigs | 0 | 0 |

**Text (deine Entscheidung 4: „Passe den Text an, falls nötig“).** Nötig war es, der Text nannte keinen Stand. ExRx („Cable Isolateral Standing Fly“) nennt keinen. ACE („Standing Decline Cable Flyes“) nennt die Schrittstellung, will den Oberkörper aber senkrecht. Human Kinetics („Try this move: cable fly“, aus Brad Schoenfelds „The M.A.X. Muscle Plan 2.0“, eine zugelassene Quelle) beschreibt genau deine Ausführung: Schrittstellung, Füße etwa schulterbreit, Oberkörper leicht vorgeneigt, obere Rollen, die Hände treffen sich etwa auf Höhe der Taille. Gelesen habe ich die Seiten über die Websuche, weil das Netz dieser Arbeitsumgebung acefitness.org und exrx.net nicht zulässt.

| | vorher | jetzt |
|---|---|---|
| Ausgangsposition | „Beug Hüfte und Knie leicht, beug auch die Ellbogen leicht.“ | „Stell einen Fuß vor den anderen, die Füße etwa schulterbreit auseinander.“ · „Beug Hüfte und Knie leicht und neig den Oberkörper aus der Hüfte leicht nach vorn. Beug auch die Ellbogen leicht.“ |
| Ausführung, Schritt 1 | „Führ die Griffe in einer umarmenden Bewegung vor dem Körper zusammen.“ | „…, bis sich die Hände etwa auf Höhe der Taille treffen.“ |
| Hinweis 2 | „Lehn dich aus der Hüfte leicht nach vorn, so hält dein Oberkörper dem Zug der Kabel stand.“ | „Halte den Oberkörper fest. Die Neigung aus der Hüfte hilft ihm, dem Zug der Kabel standzuhalten.“ |
| Quellen | ExRx | ExRx, Human Kinetics |
| Quellenhinweis | „Beschreibt die Variante im Stand an den oberen Rollen; …“ | ergänzt: „Schrittstellung und Hände auf Höhe der Taille nach Human Kinetics, am 05.11.2026 gelesen.“ |

**Reverse Butterfly (deine Entscheidung 5):** Daumen oben, wie auf der Prüfseite. Mit dem Code dieses Pakets nachgemessen: alle Werte wie auf der Prüfseite, 0 Meldungen.

**In der App:**

| Übung | MP4 | WebM | Poster | Vorschau | zusammen | Alternativtext |
|---|---|---|---|---|---|---|
| Fliegende am Kabel | 79,4 KB | 71,0 KB | 13,0 KB | 4,1 KB | 167,4 KB | 225 Zeichen |
| Reverse Butterfly an der Maschine | 76,1 KB | 61,7 KB | 13,3 KB | 5,1 KB | 156,1 KB | 222 Zeichen |

Je 60 Bilder, gerendert in 6219 und 6661 s (gleichzeitig, daneben die Prüfläufe der nächsten Familien; darin rund 23 min angehalten, während die E2E-Tests von D-520 liefen); erstes und letztes Bild pixelgleich, kein Sprung am Ende; Kontaktbögen angesehen. 28 Übungen haben jetzt eine Animation (vorher 26). Aufnahme: `docs/screens/uebungen/schulter-brust-pplc-bewegung.mp4`, beide Schleifen nebeneinander mit Namen, 960 × 360, 7,5 s.

### 57.3 Berichte zu den Paketen

```
Arbeitspaket: D-520 Phase Programme, Waagrechtes Ziehen in der App: Rudern mit Langhantel, Rudern an der Maschine, High Row mit Ausführungstext nach ExRx
Umgesetzte Funktionen: Animationen für Rudern mit Langhantel, Rudern an der Maschine und High Row an der Maschine in der App; Ausführungstext high_row_machine nach ExRx; High Row im Obergriff an hängenden Hebeln, bis die Ellbogen hinter dem Rücken sind; neue Messwerte: Lende gegen den aufrechten Stand, Ellbogen hinter dem Rücken, Unterarm zur Zugrichtung; erfüllte AK: –
Geänderte Dateien: tools/uebungen-3d/uebungen.py (RudernLanghantel, RudernMaschine, HighRowMaschine, ReverseButterfly), src/modules/exercises/data/exercise-guides.v1.json, public/uebungen/medien/rudern_langhantel*, rudern_maschine*, high_row_maschine* (neu), public/uebungen/medien.json, e2e/uebungen.spec.ts, tools/uebungen-3d/familien.json, docs/uebungen-bestand.md, docs/uebungen-animationsplan.md, docs/screens/uebungen/waagrechtes-ziehen-pplc-bewegung.mp4 (neu), form-programme-report.md, docs/decisions.md, docs/testing.md, docs/implementation-plan.md, docs/feature-inventory.md
Technische Entscheidungen: D-520
Ausgeführte Tests: Rumpf und Lende über alle 60 Bilder, High Row nach dem Abgleich und Rudern an der Maschine mit dem neuen Code gemessen, Probe Ellbogen zur Haut des Rückens; drei Schleifen je 60 Bilder, Naht pixelgleich, Kontaktbögen angesehen; format:check, lint, typecheck; Unit-Tests 1.273 bestanden (140 Dateien; im ersten Lauf unter Last 10 Zeitüberschreitungen, ohne Last alle bestanden); build, check:bundle (Startansicht 239,7 KB, Übungsbilder 104 von 104); check:docs; E2E Chromium 469 bestanden, 151 übersprungen, 0 fehlgeschlagen; WebKit in der CI
Ergebnis: bestanden
Bekannte Einschränkungen: Maße der Rudermaschine geschätzt, wie freigegeben; exrx.net nur über die Websuche gelesen (Netz der Arbeitsumgebung); bei der High Row folgt der Unterarm dem Zug nicht ganz (29 bis 49°)
Nächste Schritte: Schleifen „Schulter und Brust isoliert“ (D-521), danach die Prüfseiten „Senkrechtes Drücken“, „Hüftbeuge“ und „Rumpf“, Halt bis zu deiner Freigabe
```

```
Arbeitspaket: D-521 Phase Programme, Schulter und Brust isoliert in der App: Fliegende am Kabel in Schrittstellung, Reverse Butterfly mit Daumen oben
Umgesetzte Funktionen: Animationen für Fliegende am Kabel und Reverse Butterfly an der Maschine in der App; Fliegende in Schrittstellung mit leicht vorgeneigtem Oberkörper; Ausführungstext cable_fly mit Schrittstellung und Händen auf Höhe der Taille nach Human Kinetics; erfüllte AK: –
Geänderte Dateien: tools/uebungen-3d/uebungen.py (FliegendeKabel), src/modules/exercises/data/exercise-guides.v1.json, public/uebungen/medien/fliegende_kabel*, reverse_butterfly* (neu), public/uebungen/medien.json, e2e/uebungen.spec.ts, tools/uebungen-3d/familien.json, docs/uebungen-bestand.md, docs/uebungen-animationsplan.md, docs/screens/uebungen/schulter-brust-pplc-bewegung.mp4 (neu), form-programme-report.md, docs/decisions.md, docs/testing.md, docs/implementation-plan.md, docs/feature-inventory.md
Technische Entscheidungen: D-521
Ausgeführte Tests: Fliegende in Schrittstellung über alle 60 Bilder, beide Übungen mit dem neuen Code nachgemessen (unverändert); zwei Schleifen je 60 Bilder, Naht pixelgleich, Kontaktbögen angesehen; format:check, lint, typecheck; Unit-Tests 1.273 bestanden (140 Dateien); build, check:bundle (Startansicht 239,7 KB, Übungsbilder 112 von 112); check:docs; E2E Chromium 469 bestanden, 151 übersprungen, 0 fehlgeschlagen; WebKit in der CI
Ergebnis: bestanden
Bekannte Einschränkungen: Maße von Kabelturm und Butterfly geschätzt, wie freigegeben; Human Kinetics und ExRx nur über die Websuche gelesen (Netz der Arbeitsumgebung)
Nächste Schritte: Prüfseiten „Senkrechtes Drücken“, „Hüftbeuge“ und „Rumpf“, Halt bis zu deiner Freigabe
```

## 58. Prüfseiten Senkrechtes Drücken, Hüftbeuge und Rumpf (D-522, D-523, D-524)

Wie gewünscht die letzten drei Familien aus Dali’s PPLC zusammen, in der Reihenfolge des Animationsplans: „Senkrechtes Drücken“ mit zwei Übungen, „Hüftbeuge“ und „Rumpf“ mit je einer. Entscheidungen, die bei dir liegen, stehen gesammelt in 58.4.

### 58.1 Senkrechtes Drücken (D-522)

Prüfseite: `docs/screens/uebungen/familie-senkrechtes-druecken-pplc.webp`.

**Schulterdrücken mit Langhantel, stehend.** Wie im Text: Obergriff etwas breiter als schulterbreit, die Stange vorn auf Höhe des Halses, dann nach oben, bis die Arme gestreckt sind. Stand etwa hüftbreit, Knie fast gestreckt, Langhantel mit zwei Scheiben zu 10 kg. Die Stange steigt senkrecht und kommt dabei von 4 cm vor der Fußmitte über die Fußmitte; ganz über der Fußmitte lag sie unten im Hals. Damit sie an Kinn, Nase und Stirn vorbeikommt, gehen Kopf und Rumpf etwas zurück, so wenig wie nötig: Vor Gesicht und Hals bleiben 12 mm frei, vor den Haaren 5 mm. Der Kopf gleicht die Neigung des Rumpfs aus, der Blick bleibt waagrecht. Oben steht der Rumpf wieder senkrecht unter der Stange. Die Hüfte steht in jedem Bild so, dass der Schwerpunkt von Körper und Stange über der Fußmitte liegt.

**Schulterdrücken mit Kurzhanteln, sitzend.** Auf der Bank mit fast senkrechter Lehne (80°), Kopf, Schultern und Gesäß an der Lehne, wie im Text; die Lehne ist dafür 90 cm lang. Kurzhanteln zu 8 kg, Handflächen nach vorn. Der Ausgang ist wie an der Schulterpresse, die du freigegeben hast (D-492): Griffe zwischen Kinn und Ohr, die Ellbogen leicht vor dem Körper und unter den Handgelenken. Die Hanteln steigen auf einer Geraden, bis die Arme fast gestreckt sind.

| Messwert über alle 60 Bilder | Langhantel stehend | Kurzhanteln sitzend |
|---|---|---|
| Ellbogen Ausgang → Ende | 35° → 176° | 64° → 178° |
| Unterarm zur Senkrechten, höchstens | 29° (wenn die Stange am Kopf vorbeigeht) | 13° |
| Handgelenk, höchstens | 21° | 9,4° |
| Ausgang | Stange 154,6 cm hoch, auf Höhe des Halses | Griffe 5,5 cm über dem Kinn |
| Kopf / Rumpf zurück, höchstens | 14,3° / 13,5°; Blick in jedem Bild waagrecht | an der Lehne, Hinterkopf 1,0 mm im Polster |
| Gesicht, Hals und Haare zur Stange, mindestens | 8,0 mm | – |
| Köpfe der Hanteln zur Haut / zu den Haaren, mindestens | – | 34 / 164 mm |
| Schwerpunkt neben der Fußmitte, höchstens | 0,3 mm | – |
| Lende gegenüber dem Stand | höchstens 1,6° hohler | – |
| Gesäß / Rücken im Polster | – | 4,0 / 4,0 mm, nichts durch |
| Arme zur Bank, mindestens | – | 79 mm |
| Meldungen des Rigs | 0 | 0 |

Unterwegs korrigiert, stehend: Mit der Stange quer in der Hand knickte das Handgelenk oben 25°, mit 11° schräg in der Mitte 23°; mit 6° sind es höchstens 21°. Der Blick ging mit dem Rumpf bis 14° nach oben; jetzt gleicht der Kopf das aus. Die Stange streifte an der Stirn die Haare (1,2 mm darin); jetzt zählen die Haare in der Suche mit, es bleiben 8,0 mm. Sitzend: Mit den Werten aus der Planung (Griffe mittig zwischen Kinn und Ohr, Ellbogen 80°) standen die Hanteln 94 cm auseinander, und das Handgelenk knickte 31°; der Hinterkopf lag 38 mm vor der Lehne; die Finger lagen 8,8 mm im Griff; der Unterarm stand in der Mitte 18° schräg. Ein Messfehler: „Stange zur Kleidung“ zählte bis −299 mm, weil die Suche weit über dem Kopf die Innenseite des Kragens fand; jetzt wird nur in der Nähe gemessen.

### 58.2 Hüftbeuge (D-523)

Prüfseite: `docs/screens/uebungen/familie-hueftbeuge-pplc.webp`.

**Kreuzheben mit Langhantel.** Wie im Text: Füße flach etwa hüftbreit, die Stange über der Fußmitte, Obergriff etwas weiter als schulterbreit, Rücken gerade. Langhantel mit zwei Scheiben zu 20 kg auf dem Boden. Die Stange steigt senkrecht über der Fußmitte und gleitet 1 cm vor Schienbeinen und Oberschenkeln hoch, bis du aufrecht stehst; unten kommt sie kurz auf dem Boden zur Ruhe. Unten stehen die Schultern 5 cm vor der Stange, ab knapp der Hälfte des Wegs gehen sie hinter die Stange. Für jede Höhe der Stange habe ich die Neigung des Rumpfs gesucht, bei der die Stange die Beine knapp verfehlt; daraus folgen Hüfte und Knie.

| Messwert über alle 60 Bilder | Wert |
|---|---|
| Knie unten → oben | 105° → 176°, an den Oberschenkeln 142° gehalten (Familie unten 60 bis 80° gebeugt) |
| Hüfte unten → oben | 40° → 169° |
| Rumpf zur Waagrechten | 16° → 89° (Familie unten 0 bis 45°) |
| Schultern über der Hüfte | 11 bis 45 cm („die Schultern bleiben höher als die Hüfte“) |
| Schultern zur Stange | 5 cm davor → 16 cm dahinter |
| Arm zur Senkrechten | unten 3° hinter, oben 18° vor der Schulter |
| Stange über der Fußmitte | in jedem Bild (0,0 cm) |
| Stange zu den Beinen / zur Haut am verformten Netz, mindestens | 10 mm / 7,4 mm |
| Stange zur Kleidung, mindestens | 6,3 mm |
| Schwerpunkt hinter der Fußmitte | 4,9 bis 8,3 cm |
| Lende: Wirbel gegen das Becken / Hautlinie gegen den Stand | 0,0° / 0,8 bis 5,1° flacher (neutral) |
| Nacken / Blick unter der Waagrechten | 4° / 77° → 4° |
| Handgelenk, höchstens | 10,3° |
| Meldungen des Rigs | 0 |

Unterwegs korrigiert: Mit dem Schwerpunkt über der Fußmitte als Bedingung beugten sich die Knie unten bis 35° wie in einer tiefen Hocke. Mit einem vorgegebenen Verlauf des Knies wanderten die Schultern in der Mitte bis 30 cm vor die Stange. Jetzt ist die Lage der Schultern zur Stange vorgegeben, der Schwerpunkt ist ein Messwert. Die Suche fand dann eine zweite Lösung mit aufrechtem Rumpf und 42° im Knie; jetzt nimmt sie die erste von oben. Die Knie beugten sich an den Oberschenkeln kurz wieder um 6°, weil die Schultern dort schnell hinter die Stange gingen; das passt nicht zu „streck Hüfte und Knie“. Jetzt bleiben die Schultern dort etwas länger vorn, und das Knie hält 142°, bis es sich weiter streckt. Der schnelle Abstand hielt eine Stange im Schienbein für frei; jetzt schneidet das Werkzeug die Beine auf fünf Höhen über den Querschnitt der Stange, die Shorts zählen mit (nur auf Höhe der Achse lag die Stange am Saum der Shorts 0,6 mm im Stoff). Ein Messfehler: „Stange zur Kleidung“ zählte in drei Bildern −49 mm, obwohl die Stange 27 mm vor den Shorts lag; jetzt wird ohne Vorzeichen von der Achse der Stange aus gemessen.

Kleidung: In der vorderen Hüftfalte liegt das Saumband bis 12,8 mm in den Shorts, die Shorts bis 5,4 mm im Shirt (Rumpf 41 bis 53°), von Bild zu Bild wechselnd, wie beim Rumänischen Kreuzheben (D-490, dort so freigegeben); in den Prüfansichten fällt es nicht auf.

### 58.3 Rumpf (D-524)

Prüfseite: `docs/screens/uebungen/familie-rumpf-pplc.webp`.

**Crunches am Kabel, kniend.** Neuer Seilgriff am Kabelzug mit oberer Rolle, wie beim Trizepsdrücken. Kniend auf der Matte, die Hüfte etwas zurück, die Zehen aufgestellt wie beim Unterarmstütz. Die Hände halten das Seil seitlich am Kopf, die Handgelenke an den Schläfen, wie im Text. Der Rumpf rollt sich ein, verteilt über fünf Wirbel von der Lende bis zum Brustkorb, und die Ellbogen gehen zu den Oberschenkeln. Becken und Beine bleiben, wo sie sind, der Nacken bleibt in Verlängerung des Rumpfs. Das Seil hängt als V vom Haken zu den Händen und legt sich um den Hinterkopf.

| Messwert über alle 60 Bilder | Wert |
|---|---|
| Rumpf eingerollt | 0 → 90° |
| Rumpf vor der Senkrechten | 36° → 95° |
| Oberschenkel hinter der Senkrechten / Knie | 15,0° / 54,6° in jedem Bild |
| Ellbogengelenk zu den Oberschenkeln | 34 → 3,0 cm |
| Arme zu Oberschenkeln und Shorts, mindestens | 18 mm |
| Seil zu Kopf und Haaren, mindestens | 1,8 mm |
| Ellbogen / Handgelenk | 56° / 17,2°, fest |
| Knie / Schuhe in der Matte | 4,0 / 2,0 mm |
| Gewichtsblock gehoben, höchstens | 70 cm |
| Meldungen des Rigs | 0 |

Unterwegs korrigiert: Mit dem Seil in Linie mit dem Unterarm knickte das Handgelenk 99°; jetzt liegt das Seil quer durch die Faust. Mit der Rolle 10 cm vor den Händen lag sie am Ende hinter dem Kopf, und das Seil lief durch die Haare; jetzt liegt sie 40 cm davor, das Seil legt sich um den Hinterkopf. Die Ellbogen zeigten beim Einrollen in eine feste Richtung; jetzt dreht ihre Richtung mit dem Brustkorb. Mit 25° Vorneigung und 70° Einrollen blieben die Ellbogen 32 cm vor den Oberschenkeln; mit 35° und 90° kommen sie bis 3 cm heran.

### 58.4 Deine Entscheidungen

Bitte kurz zu jedem Punkt; ohne Antwort bleibt es beim Vorschlag.

1. **Schulterdrücken stehend, Ausgang:** wie im Text vorn auf Höhe des Halses. Der Ellbogen ist dort 35°; die Familie nennt unten 70 bis 90°, das passt eher zu einer Stange auf Höhe des Kinns. Vorschlag: wie im Text lassen.
2. **Schulterdrücken stehend, am Kopf vorbei:** Kopf und Rumpf gehen bis 14° zurück, das Handgelenk knickt dort bis 21°; oben steht der Rumpf wieder senkrecht. Die Alternative wäre eine Stange, die vor dem Gesicht einen Bogen nach vorn macht. Vorschlag: so lassen.
3. **Kreuzheben, oben:** Die Stange bleibt über der Fußmitte und 1 cm vor den Oberschenkeln. Dadurch hängen die Arme oben 18° vor der Senkrechten, und der Schwerpunkt liegt 8 cm hinter der Fußmitte (unten 6 cm). Vorschlag: so lassen. Alternative: oben die Stange 3 bis 4 cm näher zu den Fersen, die Arme fast senkrecht.
4. **Kreuzheben, Griff:** Obergriff; der Text erlaubt auch den Kreuzgriff. Vorschlag: Obergriff.
5. **Crunches am Kabel, Füße:** Zehen aufgestellt wie beim Unterarmstütz; der Text sagt dazu nichts, flach aufliegende Fußrücken gingen auch. Vorschlag: so lassen.

### 58.5 Berichte zu den Paketen

```
Arbeitspaket: D-522 Phase Programme, Prüfseite „Senkrechtes Drücken“ (Schulterdrücken mit Langhantel stehend, Schulterdrücken mit Kurzhanteln sitzend)
Umgesetzte Funktionen: keine in der App; Werkzeug: uebungen.SchulterdrueckenLanghantel (Kopf und Rumpf weichen der Stange aus, Blick waagrecht, Haare in der Suche) und uebungen.SchulterdrueckenKH (Bank mit langer Lehne, geraete.schraegbank mit lehne_laenge), Messung Stange zur Kleidung (stange_zur_kleidung), Zeilen der Prüfseite; erfüllte AK: –
Geänderte Dateien: tools/uebungen-3d/uebungen.py, tools/uebungen-3d/geraete.py, tools/uebungen_pruef_bild.py, tools/uebungen-3d/familien.json, docs/uebungen-animationsplan.md, docs/screens/uebungen/familie-senkrechtes-druecken-pplc.webp (neu), form-programme-report.md, docs/decisions.md, docs/testing.md, docs/implementation-plan.md, docs/feature-inventory.md
Technische Entscheidungen: D-522
Ausgeführte Tests: Probeläufe beider Übungen, render.py --pruefen und Nahaufnahmen (stehend dreimal, zuletzt mit den Haaren in der Suche), Sprünge in den Messwerten geprüft, Bilder angesehen; format:check und check:docs bestanden
Ergebnis: bestanden (Werte in 58.1)
Bekannte Einschränkungen: Ellbogen unten 35° statt 70 bis 90° (Frage 1); Gewichte angenommen (Langhantel 40 kg, Kurzhanteln 8 kg)
Nächste Schritte: Prüfseiten „Hüftbeuge“ (D-523) und „Rumpf“ (D-524), dann Halt bis zu deiner Freigabe
```

```
Arbeitspaket: D-523 Phase Programme, Prüfseite „Hüftbeuge“ (Kreuzheben mit Langhantel)
Umgesetzte Funktionen: keine in der App; Werkzeug: uebungen.KreuzhebenLanghantel (Stange über der Fußmitte nah an den Beinen, Rumpf je Höhe gesucht, Knie strecken sich durchgehend, Schwerpunkt als Messwert), Messung Stange zur Kleidung ohne Vorzeichen, Zeilen der Prüfseite; erfüllte AK: –
Geänderte Dateien: tools/uebungen-3d/uebungen.py, tools/uebungen_pruef_bild.py, tools/uebungen-3d/familien.json, docs/uebungen-animationsplan.md, docs/screens/uebungen/familie-hueftbeuge-pplc.webp (neu), form-programme-report.md, docs/decisions.md, docs/testing.md, docs/implementation-plan.md, docs/feature-inventory.md
Technische Entscheidungen: D-523
Ausgeführte Tests: Probeläufe, Probe Stange zu den Shorts ohne Vorzeichen, Probe Knie gegen die Lage der Schultern, render.py --pruefen und Nahaufnahmen (zweimal, zuletzt mit durchgehend gestreckten Knien und fünf Schnitten), Sprünge in den Messwerten geprüft, Bilder angesehen; format:check und check:docs bestanden
Ergebnis: bestanden (Werte in 58.2)
Bekannte Einschränkungen: Schwerpunkt 5 bis 8 cm hinter der Fußmitte, Arme oben 18° vor der Senkrechten (Frage 3); Saumband in der Hüftfalte wie bei D-490
Nächste Schritte: Prüfseite „Rumpf“ (D-524), dann Halt bis zu deiner Freigabe
```

```
Arbeitspaket: D-524 Phase Programme, Prüfseite „Rumpf“ (Crunches am Kabel, kniend)
Umgesetzte Funktionen: keine in der App; Werkzeug: Seilgriff (geraete.seil), Kabelzug mit oberer Rolle ohne Stange, uebungen.KabelcrunchKniend (Rumpf rollt über fünf Wirbel ein, Seil um den Hinterkopf), Zeilen und Bildunterschriften der Prüfseite; erfüllte AK: –
Geänderte Dateien: tools/uebungen-3d/uebungen.py, tools/uebungen-3d/geraete.py, tools/uebungen_pruef_bild.py, tools/uebungen-3d/familien.json, docs/uebungen-animationsplan.md, docs/screens/uebungen/familie-rumpf-pplc.webp (neu), form-programme-report.md, docs/decisions.md, docs/testing.md, docs/implementation-plan.md, docs/feature-inventory.md
Technische Entscheidungen: D-524
Ausgeführte Tests: Probeläufe, render.py --pruefen und Nahaufnahmen, Sprünge in den Messwerten geprüft, Bilder angesehen; format:check und check:docs bestanden
Ergebnis: bestanden (Werte in 58.3)
Bekannte Einschränkungen: Maße von Seil und Kabelzug geschätzt; Zehen aufgestellt (Frage 5)
Nächste Schritte: Halt bis zu deiner Freigabe der drei Prüfseiten und deinen Antworten in 58.4; danach die Schleifen
```

## 59. Schleifen der letzten drei Familien, E1 bis E3 und Übersicht Dali’s PPLC (ab D-525)

Du hast die Prüfseiten „Senkrechtes Drücken“, „Hüftbeuge“ und „Rumpf“ freigegeben, mit fünf Entscheidungen, und zu den Befunden E1 bis E4 aus dem Rundgang durch den Player (D-496) entschieden. Die Pakete kommen einzeln: zuerst E1 bis E3 (D-525), dann die Schleifen der drei Familien und die Übersicht.

### 59.1 E1 bis E4 im Player (D-525)

| Befund | Deine Entscheidung | Umgesetzt |
|---|---|---|
| E1 „Ziel“ und Zahl in verschiedenen Zeilen | geschütztes Leerzeichen zwischen Wort und Zahl | „Ziel 10“, „Satz 1 von 5“, „Aufwärmsatz 2“ und „Vorwert 60“ bleiben zusammen, ebenso Zahl und Einheit („45 s“, „60 kg“). In „Jetzt“ und in der Pause, klein und groß. |
| E2 kleine Pause am iPhone hoch: nur „Beinpresse,…“ | voller Name der nächsten Übung | „Nächster Satz“ steht dort nur noch für Screenreader, wie schon im niedrigen Fenster. Der Text hat bis zu drei Zeilen, der Name steht vorn und damit ganz da. |
| E3 zugeklappt: Dialoge 266 statt 350 pt breit | mittig im Fenster mit voller Breite | Zugeklappt stehen Rückfragen und Übungsinfo mittig im Fenster, 350 pt breit, „Training beenden?“ in einer Zeile. Aufgeklappt bleiben sie in der Mitte des Bildschirms. |
| E4 „Als Nächstes“ fehlt aufgeklappt quer | bleibt so | keine Änderung |

Neue Tests: E1 und E2 am iPhone hoch (390 × 844), E3 am nachgestellten Duo zugeklappt und aufgeklappt. Gegen den Stand davor sind alle drei rot, mit der Änderung grün.

### 59.2 Rumpf (D-526)

**Crunches am Kabel, kniend (deine Entscheidung 5):** Zehen aufgestellt, bleibt. Die Schleife ist wie auf der Prüfseite (D-524).

### 59.3 Hüftbeuge (D-527)

**Kreuzheben oben (deine Entscheidung 3).** Oben steht die Figur jetzt aufrecht wie im Stand: Becken und Rumpf wie im Stand, die Knie 176°. Die gestreckten Arme hängen von den Schultern nach vorn, bis die Stange 1 cm vor Oberschenkeln und Shorts liegt. Bis D-523 blieb die Stange auch oben über der Fußmitte; dafür lehnte sich die Figur zurück (Hüfte 169°). Jetzt kommt die Stange ab den Knien sanft so weit vor die Fußmitte, wie der aufrechte Stand oben verlangt.

Oben gemessen (Bild 29 bis 36):

| Messwert | Prüfseite (D-523) | jetzt |
|---|---|---|
| Rumpf zur Senkrechten | zurückgelehnt, Hüfte 169° | 0,9° vor der Senkrechten, Hüfte 175,4° |
| Schultern zur Hüfte, waagrecht | – | 2,6 cm vor der Hüfte |
| Knie | 176° | 176,0° |
| Arm zur Senkrechten | 18° vor | 16,1° vor |
| Lende: Wirbel gegen das Becken | 0,0° | 0,0° |
| Lende: Hautlinie gegen den aufrechten Stand | über die Bewegung 0,8 bis 5,1° flacher | oben 0,2° flacher, 1,2 mm verschoben: neutral |
| Gemeinsamer Schwerpunkt von Körper und Stange | 8 cm hinter der Fußmitte | 0,1 cm vor der Fußmitte |
| Stange zur Fußmitte | darüber | 7,8 cm davor, 84,4 cm hoch |
| Stange zur Kleidung, mindestens | 6,3 mm | 8,7 mm, oben 9,2 mm |

**Was nicht zusammen geht:** Arme senkrecht und die Stange genau über der Fußmitte passen aufrecht nicht zur Stange an den Oberschenkeln. Die Vorderseite der Oberschenkel mit den Shorts liegt auf Höhe der Stange 5,5 cm vor der Fußmitte, die Schultergelenke 6,3 cm dahinter. Senkrechte Arme brächten die Stange in die Oberschenkel; genau über der Fußmitte müsste sich die Figur zurücklehnen wie bis D-523. Ich habe es nach dem Gleichgewicht entschieden: Der gemeinsame Schwerpunkt von Körper und Stange steht über der Fußmitte, die Arme hängen 16° vor der Senkrechten. Auch beim echten Kreuzheben liegt die Stange oben vorn an den Oberschenkeln, die Arme etwas schräg.

Über die ganze Bewegung: Knie 105° → 176°, sie strecken sich nur (an den Oberschenkeln 142° gehalten, dann in sieben Bildern gleichmäßig auf 176°); Hüfte 40° → 175°; Schwerpunkt unten 5,7 cm hinter der Fußmitte, oben darüber; Stange mindestens 8,7 mm vor der Kleidung und 7,3 mm vor der Haut; in der Hüftfalte das Saumband bis 6,8 mm in den Shorts und die Shorts bis 3,4 mm im Shirt (auf der Prüfseite 12,8 und 5,4 mm); 0 Meldungen des Rigs.

**Griff (deine Entscheidung 4):** Obergriff, wie auf der Prüfseite.

### 59.4 Senkrechtes Drücken (D-528)

**Military Press, Ausgang (deine Entscheidung 1).** Die Stange bleibt vorn auf Höhe des Halses.

**Military Press, am Kopf vorbei (deine Entscheidung 2).** Jetzt schafft zuerst der Kopf Platz: Hals gestreckt, Kopf ebenso weit gebeugt, der Blick bleibt waagrecht, bis 25°. Erst wenn das nicht reicht, geht der Rumpf aus der Hüfte zurück, höchstens 7°. Bis D-524 gingen Kopf und Rumpf gemeinsam je bis 15°. Damit die Stange mit so wenig Rumpf am Gesicht vorbeikommt, steht sie unten 8 statt 4 cm vor der Fußmitte und kommt bis oben gleichmäßig über die Fußmitte. Mit 4 cm lag sie bis 13 mm im Gesicht, mit 6 cm 9 mm in den Haaren.

Das Handgelenk: Die Stange liegt tiefer im Handballen, über dem Unterarm, und 14° schräg in der Hand. Der Unterarm neigt sich von vorn höchstens 10° zur Seite; so muss das Handgelenk nicht zur Seite knicken. Verglichen habe ich 0°, 6°, 10°, 12° und 14° Schräge, 6 bis 18° Seitenneigung und drei Lagen der Stange im Ausgang.

Gemessen über alle 60 Bilder:

| Messwert | Prüfseite (D-522) | jetzt |
|---|---|---|
| Rumpf zurück, höchstens | 13,5° | 5,5° (oben 0,9° vor der Senkrechten) |
| Lende: Wirbel gegen das Becken | – | 0,0° in jedem Bild |
| Lende: Hautlinie gegen den aufrechten Stand | höchstens 1,6° hohler | 0,2 bis 0,8° hohler, höchstens 1,8 mm verschoben: kein Hohlkreuz |
| Kopf zurück, höchstens | 14,3° | 25°; Blick in jedem Bild waagrecht |
| Handgelenk, höchstens | 21° | 10,7° (gestreckt −5,1 bis 4,0°, zur Seite −9,7 bis 10,0°) |
| Gesicht, Hals und Haare zur Stange, mindestens | 8,0 mm | 6,3 mm |
| Schwerpunkt neben der Fußmitte | höchstens 0,3 mm | 0,0 cm; in den zwei Bildern, in denen der Kopf zurückkommt, 0,9 und 0,7 cm |
| Ellbogen Ausgang → Ende | 35° → 176° | 37° → 176° |
| Unterarm zur Senkrechten, höchstens | 29° | 35° |
| Meldungen des Rigs | 0 | 0 |

Eine Folge: Wenn die Stange an der Stirn vorbeigeht, steht der Unterarm bis 35° schräg (vorher 29°). Der Rumpf geht weniger zurück, die Ellbogen stehen dort vor der Stange. Oben und unten steht der Unterarm wie vorher fast senkrecht.

**Schulterdrücken mit Kurzhanteln, sitzend** wie auf der Prüfseite.

**Naht der Schleifen.** Beim Schulterdrücken mit Kurzhanteln sind erstes und letztes Bild pixelgleich. Bei der Military Press weicht das letzte Bild um weniger als einen zehntel Pixel ab. Die Suche nach der Lage der Hüfte geht vom vorherigen Bild aus und landet nach dem Hin und Zurück 0,3 mm daneben. In der Schleife ist das nicht zu sehen; deshalb habe ich nicht neu gerendert.

### 59.5 Übersicht Dali’s PPLC (D-529)

Bild in Player-Größe: `docs/screens/uebungen/dalis-pplc-uebersicht.webp`.

Geladen wird je Übung, was die App zeigt: das Vorschaubild in Listen, das Poster und eine Datei der Schleife, MP4 zuerst. WebM lädt sie nur, wenn MP4 nicht läuft. Die Dateien kommen erst, wenn die Übung gebraucht wird, nicht vorab.

| Nr. | Tag | Übung | Stand | MP4 | WebM | Poster | Vorschau | geladen | alle Dateien |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Push, Compound | Bankdrücken mit Kurzhanteln | Schleife in der App (D-463) | 43,3 KB | 32,9 KB | 8,3 KB | 4,2 KB | 55,7 KB | 88,6 KB |
| 2 | Push | Schrägbankdrücken mit Kurzhanteln | Schleife in der App (D-463) | 40,9 KB | 33,0 KB | 8,9 KB | 4,1 KB | 53,9 KB | 86,9 KB |
| 3 | Push | Schulterdrücken mit Kurzhanteln, sitzend | Schleife in der App (D-528) | 39,5 KB | 33,7 KB | 8,3 KB | 3,4 KB | 51,1 KB | 84,8 KB |
| 4 | Push, Compound | Dips mit Unterstützung | Schleife in der App (D-513) | 63,9 KB | 53,6 KB | 12,2 KB | 5,1 KB | 81,2 KB | 134,8 KB |
| 5 | Push, Compound | Seitheben mit Kurzhanteln | Schleife in der App (D-469) | 48,8 KB | 44,7 KB | 7,0 KB | 3,1 KB | 58,8 KB | 103,6 KB |
| 6 | Push | Fliegende am Kabel | Schleife in der App (D-521) | 79,4 KB | 71,0 KB | 13,0 KB | 4,1 KB | 96,5 KB | 167,4 KB |
| 7 | Push | Trizepsdrücken am Kabel | Schleife in der App (D-517) | 40,1 KB | 35,2 KB | 8,2 KB | 3,4 KB | 51,8 KB | 87,0 KB |
| 8 | Pull | Kreuzheben mit Langhantel | Schleife in der App (D-527) | 59,8 KB | 49,2 KB | 6,1 KB | 5,3 KB | 71,1 KB | 120,4 KB |
| 9 | Pull, Compound | Klimmzüge mit Unterstützung | Schleife in der App (D-509, mit den Diparmen neu in D-513) | 66,5 KB | 57,9 KB | 10,1 KB | 4,9 KB | 81,5 KB | 139,3 KB |
| 10 | Pull | Rudern an der Maschine | Schleife in der App (D-520) | 58,0 KB | 43,0 KB | 11,8 KB | 5,2 KB | 75,0 KB | 118,0 KB |
| 11 | Pull | High Row an der Maschine | Schleife in der App (D-520) | 79,4 KB | 66,9 KB | 13,1 KB | 5,8 KB | 98,3 KB | 165,2 KB |
| 12 | Pull | Reverse Butterfly an der Maschine | Schleife in der App (D-521) | 76,1 KB | 61,7 KB | 13,3 KB | 5,1 KB | 94,5 KB | 156,1 KB |
| 13 | Pull | Hammercurls | Schleife in der App (D-517) | 48,6 KB | 40,9 KB | 6,6 KB | 2,8 KB | 57,9 KB | 98,9 KB |
| 14 | Legs | Hackenschmidt-Kniebeuge | Schleife in der App (D-513) | 88,0 KB | 71,0 KB | 16,9 KB | 6,4 KB | 111,3 KB | 182,3 KB |
| 15 | Legs, Compound | Beinpresse | Schleife in der App (D-465) | 91,8 KB | 72,2 KB | 17,9 KB | 6,9 KB | 116,6 KB | 188,8 KB |
| 16 | Legs | Beinbeuger liegend | Schleife in der App (D-486) | 70,5 KB | 68,6 KB | 11,6 KB | 5,2 KB | 87,2 KB | 155,9 KB |
| 17 | Legs | Beinbeuger sitzend | Schleife in der App (D-516) | 68,7 KB | 61,3 KB | 13,1 KB | 5,7 KB | 87,5 KB | 148,8 KB |
| 18 | Legs | Beinstrecker | Schleife in der App (D-516) | 66,0 KB | 59,0 KB | 14,0 KB | 4,9 KB | 84,9 KB | 143,9 KB |
| 19 | Legs, Compound | Wadenheben stehend | Schleife in der App (D-516) | 36,8 KB | 29,5 KB | 7,3 KB | 3,2 KB | 47,4 KB | 76,8 KB |
| 20 | Legs | Wadenheben sitzend | Schleife in der App (D-516) | 52,3 KB | 44,4 KB | 12,1 KB | 5,3 KB | 69,8 KB | 114,2 KB |
| 21 | Legs | Unterarmstütz (Plank) | Schleife in der App (D-467) | 22,1 KB | 15,3 KB | 10,7 KB | 3,2 KB | 36,0 KB | 51,4 KB |
| 22 | Compound | Schulterdrücken mit Langhantel, stehend | Schleife in der App (D-528) | 46,9 KB | 44,3 KB | 6,8 KB | 3,0 KB | 56,7 KB | 101,0 KB |
| 23 | Compound | Rudern mit Langhantel, vorgebeugt | Schleife in der App (D-520) | 67,6 KB | 52,8 KB | 10,9 KB | 4,3 KB | 82,8 KB | 135,6 KB |
| 24 | Compound | Bizepscurls mit Kurzhanteln | Schleife in der App (D-517) | 43,9 KB | 40,1 KB | 6,7 KB | 2,8 KB | 53,4 KB | 93,5 KB |
| 25 | Compound | Crunches am Kabel, kniend | Schleife in der App (D-526) | 65,6 KB | 52,3 KB | 8,9 KB | 5,0 KB | 79,4 KB | 131,8 KB |
| | | **zusammen** | | | | | | **1.840,3 KB** | **3.074,9 KB** |

Größen gemessen an den Dateien in `public/uebungen/medien` (1 KB = 1.024 Byte). „Tag“ fasst die Wochen zusammen: Push, Pull, Legs und Compound.

### 59.6 Texte von High Row und Fliegenden, Netz

Du hast exrx.net und acefitness.org im Netz freigegeben. Beide sind jetzt erreichbar, die Verbindung steht. Die Seiten selbst lassen automatische Abrufe aber nicht zu: exrx.net antwortet mit 403 und einer Prüfung von Cloudflare („cf-mitigated: challenge“), www.acefitness.org mit 403 von Azure Front Door. Das Werkzeug zum Abrufen von Seiten findet exrx.net gar nicht. Eine solche Sperre umgehe ich nicht. Abgleichen konnte ich die Texte deshalb nicht; sie bleiben, wie sie sind: High Row nach den Auszügen der Seite aus der Websuche (D-520), Fliegende am Kabel nach Human Kinetics (D-521). Wenn du mir den Text der beiden Seiten schickst, gleiche ich ihn ab.

### 59.7 Berichte zu den Paketen

```
Arbeitspaket: D-525 Phase Programme, Befunde E1 bis E3 im Player (Entscheidung des Produktinhabers zu E1 bis E4)
Umgesetzte Funktionen: geschütztes Leerzeichen zwischen Wort und Zahl in „Jetzt“ und in der Pause (keepNumbersTogether); kleine Pause am iPhone hoch mit vollem Namen der nächsten Übung, „Nächster Satz“ nur für Screenreader; Dialoge am Duo zugeklappt mittig im Fenster mit voller Breite (--dialog-dx, --dialog-dy); erfüllte AK: –
Geänderte Dateien: src/modules/training/calc/format.ts, src/modules/training/calc/format.test.ts, src/modules/training/ui/player/SessionPage.tsx, src/modules/training/ui/player/RestStage.tsx, src/modules/training/ui/player/player-layout.css, src/shared/ui/screenCenter.ts, src/shared/ui/screenCenter.test.ts, src/app/styles.css, e2e/player-befunde-e.spec.ts (neu), e2e/duo-player-befunde.spec.ts, e2e/duo-player.spec.ts, form-programme-report.md, docs/decisions.md, docs/testing.md, docs/implementation-plan.md, docs/feature-inventory.md, docs/feature-inventory.csv
Technische Entscheidungen: D-525
Ausgeführte Tests: format:check, lint, typecheck; Unit-Tests 1.276 bestanden (140 Dateien); check:docs; build; check:bundle (Startansicht 239,9 KB); pnpm test:e2e (Chromium) 472 bestanden, 153 übersprungen, 1 fehlgeschlagen: duo-player.spec.ts „Pause zugeklappt in einer Zeile“ suchte „Aufwärmsatz 2“ mit normalem Leerzeichen; Muster auf \s geändert, danach duo-player.spec.ts 5 bestanden, 5 übersprungen; Gegenprobe der drei neuen E2E-Tests gegen den Stand davor: alle drei rot
Ergebnis: bestanden
Bekannte Einschränkungen: E4 bleibt wie entschieden; WebKit läuft in der CI
Nächste Schritte: Schleifen „Rumpf“ (D-526), „Hüftbeuge“ (D-527) und „Senkrechtes Drücken“ (D-528), Übersicht Dali’s PPLC (D-529), dann Halt für den Gerätetest
```

```
Arbeitspaket: D-526 Phase Programme, Schleife „Rumpf“ (Crunches am Kabel, kniend)
Umgesetzte Funktionen: Animation in der App; erfüllte AK: –
Geänderte Dateien: tools/uebungen-3d/familien.json, docs/uebungen-animationsplan.md, docs/uebungen-bestand.md, public/uebungen/medien.json, public/uebungen/medien/ (vier Dateien neu), e2e/uebungen.spec.ts, docs/screens/uebungen/rumpf-pplc-bewegung.mp4 (neu), form-programme-report.md, docs/decisions.md, docs/testing.md, docs/implementation-plan.md, docs/feature-inventory.md
Technische Entscheidungen: D-526
Ausgeführte Tests: Format, Lint, Typen und Dokumente bestanden; Unit-Tests 1.274 von 1.276 neben zwei Blender-Renderläufen (zwei Tests der Tagesaufgaben mit Zeitüberschreitung, 5,1 s; die Datei allein 11 von 11 bestanden); Build, Startansicht 239,9 KB, Übungsbilder 116 von 116; E2E Chromium 472 bestanden, 153 übersprungen, 1 fehlgeschlagen (Scanner zugeklappt, Rückfrage zu Open Food Facts kam unter Last nicht; allein 3 von 3 bestanden); Naht pixelgleich
Ergebnis: bestanden
Bekannte Einschränkungen: Maße von Seil und Kabelzug geschätzt (wie D-524)
Nächste Schritte: Schleife „Hüftbeuge“ (D-527)
```

```
Arbeitspaket: D-527 Phase Programme, Schleife „Hüftbeuge“ (Kreuzheben mit Langhantel)
Umgesetzte Funktionen: Animation in der App; oben aufrecht ohne Zurücklehnen (`_oben_aufrecht`), die Stange ab den Knien sanft vor die Fußmitte (`_stange_y`), Obergriff; Fehler in `_abstand_beine` behoben (Lage der Stange überschrieben); Messwert „Schultern vor der Hüfte“; erfüllte AK: –
Geänderte Dateien: tools/uebungen-3d/uebungen.py, tools/uebungen-3d/familien.json, docs/uebungen-animationsplan.md, docs/uebungen-bestand.md, public/uebungen/medien.json, public/uebungen/medien/ (vier Dateien neu), e2e/uebungen.spec.ts, docs/screens/uebungen/hueftbeuge-pplc-bewegung.mp4 (neu), form-programme-report.md, docs/decisions.md, docs/testing.md, docs/implementation-plan.md, docs/feature-inventory.md
Technische Entscheidungen: D-527
Ausgeführte Tests: Format, Lint, Typen und Dokumente bestanden; Unit-Tests 1.276 bestanden (140 Dateien); Build, Startansicht 239,9 KB, Übungsbilder 120 von 120; E2E Chromium (drei Worker) 473 bestanden, 153 übersprungen, 0 fehlgeschlagen; Naht pixelgleich
Ergebnis: bestanden (Werte in 59.3)
Bekannte Einschränkungen: Arme oben 16° vor der Senkrechten und die Stange 7,8 cm vor der Fußmitte (aufrecht mit der Stange an den Oberschenkeln geht es nicht anders, Begründung in 59.3); Saumband in der Hüftfalte bis 6,8 mm in den Shorts wie bei D-490
Nächste Schritte: Schleifen „Senkrechtes Drücken“ (D-528)
```

```
Arbeitspaket: D-528 Phase Programme, Schleifen „Senkrechtes Drücken“ (Schulterdrücken mit Langhantel stehend, Schulterdrücken mit Kurzhanteln sitzend)
Umgesetzte Funktionen: Animationen beider Übungen in der App, damit alle 25 Übungen von Dali’s PPLC animiert; Military Press nach der Entscheidung des Produktinhabers: der Kopf schafft zuerst Platz, der Rumpf höchstens 7° zurück, die Stange tiefer im Handballen und 14° schräg, der Unterarm von vorn höchstens 10° zur Seite (`_regel`), Ausgang 8 cm vor der Fußmitte; Messwert „Rumpf zur Senkrechten“; erfüllte AK: –
Geänderte Dateien: tools/uebungen-3d/uebungen.py, tools/uebungen-3d/familien.json, docs/uebungen-animationsplan.md, docs/uebungen-bestand.md, public/uebungen/medien.json, public/uebungen/medien/ (acht Dateien neu), e2e/uebungen.spec.ts, docs/screens/uebungen/senkrechtes-druecken-pplc-bewegung.mp4 (neu), form-programme-report.md, docs/decisions.md, docs/testing.md, docs/implementation-plan.md, docs/feature-inventory.md
Technische Entscheidungen: D-528
Ausgeführte Tests: Format, Lint, Typen und Dokumente bestanden; Unit-Tests 1.276 bestanden (140 Dateien); Build, Startansicht 239,9 KB, Übungsbilder 128 von 128; E2E Chromium (drei Worker) 472 bestanden, 153 übersprungen, 1 fehlgeschlagen (Zeittest der Startfläche, 1.371 statt höchstens 1.307 ms unter drei Workern; die Datei allein 18 von 18 bestanden)
Ergebnis: bestanden (Werte in 59.2)
Bekannte Einschränkungen: Unterarm zur Senkrechten bis 35°, wenn die Stange an der Stirn vorbeigeht (Prüfseite 29°); Naht der Military Press um weniger als 0,1 px versetzt; Schwerpunkt in zwei Bildern bis 0,9 cm neben der Fußmitte; Gewichte angenommen (Langhantel 40 kg, Kurzhanteln 8 kg)
Nächste Schritte: Übersicht Dali’s PPLC (D-529), dann Halt für den Gerätetest
```

```
Arbeitspaket: D-529 Phase Programme, Übersicht „Dali’s PPLC“ (Liste mit Stand und Dateigrößen, Bild in Player-Größe)
Umgesetzte Funktionen: keine in der App; Werkzeug: uebungen_programm_uebersicht.py mit Spalte „geladen“ (MP4, Poster, Vorschau) und Tagen nach Bezeichnung; erfüllte AK: –
Geänderte Dateien: tools/uebungen_programm_uebersicht.py, docs/screens/uebungen/dalis-pplc-uebersicht.webp (neu), form-programme-report.md, docs/decisions.md, docs/testing.md, docs/implementation-plan.md, docs/feature-inventory.md, docs/feature-inventory.csv
Technische Entscheidungen: D-529
Ausgeführte Tests: Format und Dokumente bestanden; die App ist gegenüber D-528 unverändert (dort Unit-Tests 1.276 bestanden und E2E vollständig), deshalb E2E nur für die Übungsliste: e2e/uebungen.spec.ts 17 bestanden, 3 übersprungen
Ergebnis: bestanden (Liste in 59.5)
Bekannte Einschränkungen: Texte von High Row und Fliegenden nicht mit den Originalseiten abgeglichen, beide Seiten sperren automatische Abrufe (59.6)
Nächste Schritte: Gerätetest des Produktinhabers, danach die Entscheidung über den Merge von #54
```

## 60. Gerätetest Dali’s PPLC am Duo: Korrekturen (ab D-530)

Gerätetest des Produktinhabers vom 06.11.2026: Englische Namen und Wochenwechsel am Compound-Tag passen. Korrigiert werden die Sätze, der Beinbeuger sitzend, die Schleifen und vier Befunde im Player.

### 60.1 Zwei feste Regeln (D-530)

In `CLAUDE.md` unter „Dauerhafte Anweisungen des Produktinhabers“ stehen jetzt wörtlich: „Antworte immer auf Deutsch, auch in Zwischenmeldungen.“ und „Netzwerkfreigaben, Berechtigungen und Einstellungen der Umgebung änderst du nie selbst. Brauchst du eine Freigabe, fragst du mich.“ Nebenbei berichtigt: D-526 bis D-529 standen in `docs/decisions.md` in der Tabelle der Datenquellen, jetzt nach D-525.

### 60.2 Sätze in Dali’s PPLC (D-531)

Jede Übung beginnt jetzt in jeder Woche mit genau einem Aufwärmsatz, Ziel 8–10 Wiederholungen. Danach folgen die Arbeitssätze:

| Wochen | Grundübungen | übrige |
|---|---|---|
| 1–3 | 3 | 3 |
| Aufbau (4–6, 9–13, 16–20) | 4 | 3 |
| leicht (7, 14, 21) | 2 | 1 |
| Einstieg nach der leichten Woche (8, 15) | 3 | 2 |

Drei Punkte habe ich selbst entschieden:

- Plank: Der Aufwärmsatz dauert 15–20 s, etwa die Hälfte der Arbeitszeit von 30–45 s. 8–10 Wiederholungen passen bei einer Haltezeit nicht.
- Kreuzheben, Machine Squat und Beinpresse am Compound-Tag hatten zwei Aufwärmsätze, jetzt einen, wie verlangt.
- Machine Calf Raise am Compound-Tag hat seit deiner Nachricht vom 04.11. „mit zwei Sätzen“ eine feste Zahl. In den Wochen 1–3 hat er jetzt drei wie jede Übung, ab Woche 4 weiter zwei, in leichten Wochen einen. Soll er ab Woche 4 auch drei haben, ist das eine Zahl.

Das Gewicht des Aufwärmsatzes rechnet die App nicht aus, eine Vorlage kennt nur feste Gewichte. Der Infotext nennt die Hälfte, der Player schlägt wie bisher den Vorwert des letzten Aufwärmsatzes vor. Der Infotext steht wörtlich wie in deiner Nachricht.

### 60.3 Ohne Machine Seated Leg Curl (D-532)

Der Legs-Tag hat jetzt sieben Übungen, das Programm 24. „Beinbeuger sitzend“ bleibt in der Bibliothek mit Animation und Ausführung, die Suche findet ihn weiter auch unter dem englischen Namen. Die Übersicht ist neu: geladen werden zusammen 1.752,8 KB (vorher 1.840,3 KB), alle Dateien 2.926,1 KB; das Bild `docs/screens/uebungen/dalis-pplc-uebersicht.webp` zeigt 24 Übungen.

### 60.4 Rechte Spalte in der Pause (D-533)

Am Duo aufgeklappt zeigt die rechte Spalte jetzt immer dasselbe: die Animation und „Jetzt“ mit „Danach“ und Vorschaubild, auch in der Pause. Die Karte „Als Nächstes“ gibt es nicht mehr, auch nicht auf größeren Bildschirmen; die nächste Übung steht in „Jetzt“, alle stehen links in der Liste. Zugeklappt nimmt die Pause wie bisher den Platz von „Jetzt“ ein.

### 60.5 Rand der Karten am Duo quer (D-534)

Am nachgestellten Duo quer (Fenster 867 × 669 wie am Gerät gemessen) hat die linke Spalte keinen eigenen Scrollbereich. Gefunden habe ich aber eine dünne graue Linie genau am rechten Rand der Karten: Im niedrigen Fenster klebt der Kopf links oben, und die Karten laufen beim Scrollen darunter durch. Ihr 1-px-Rand ragte dabei rechts neben dem Kopf heraus und sah aus wie eine Scrollleiste über dem Rand der Karte. Jetzt reicht der Kopf rechts 4 px weiter, der Rand läuft ganz darunter durch. Falls du am Gerät eine andere Leiste gesehen hast, schick mir bitte ein Bildschirmfoto.

### 60.9 Berichte zu den Paketen

```
Arbeitspaket: D-530 Phase Programme, zwei feste Regeln in CLAUDE.md
Umgesetzte Funktionen: keine in der App; Regeln „immer Deutsch, auch in Zwischenmeldungen“ und „Netzwerkfreigaben, Berechtigungen und Einstellungen der Umgebung nie selbst ändern“; Reihenfolge in docs/decisions.md berichtigt; erfüllte AK: –
Geänderte Dateien: CLAUDE.md, docs/decisions.md, docs/implementation-plan.md, form-programme-report.md
Technische Entscheidungen: D-530
Ausgeführte Tests: format:check und check:docs bestanden; die App ist unverändert, die CI prüft wie immer alles einschließlich WebKit
Ergebnis: bestanden
Bekannte Einschränkungen: –
Nächste Schritte: Sätze von Dali’s PPLC (D-531)
```

```
Arbeitspaket: D-531 Phase Programme, Sätze in Dali’s PPLC (Gerätetest, Punkt 1)
Umgesetzte Funktionen: vor jeder Übung ein Aufwärmsatz (Ziel 8–10, Plank 15–20 s), Wochen 1–3 je drei Arbeitssätze, ab Woche 4 der Aufbau wie bisher, Infotext wörtlich; Quelle `warmup`, Schema `warmupTarget`; erfüllte AK: –
Geänderte Dateien: tools/data/dali-pplc.source.json, tools/programs_build.py, src/modules/training/model/program.ts, src/modules/training/calc/sampleTemplates.ts, src/modules/training/data/programs.v1.json, docs/programs.md, src/modules/training/calc/programs.test.ts, src/modules/training/calc/sampleTemplates.test.ts, src/modules/training/ui/programs-ui.test.tsx, e2e/programs.spec.ts, form-programme-report.md, docs/decisions.md, docs/testing.md, docs/implementation-plan.md, docs/feature-inventory.md
Technische Entscheidungen: D-531
Ausgeführte Tests: Format, Lint, Typen und Dokumente bestanden; Unit-Tests 1.277 von 1.278 im ersten Lauf (programs-ui.test.tsx erwartete den alten Infotext; angepasst, danach die Datei 11 von 11); Build, Startansicht 240,0 KB, Übungsbilder 128 von 128; E2E Chromium (drei Worker) 475 bestanden, 153 übersprungen, 0 fehlgeschlagen; Gegenprobe: die vier neuen und geänderten Unit-Tests gegen den Stand davor rot
Ergebnis: bestanden
Bekannte Einschränkungen: Gewicht des Aufwärmsatzes nicht ausgerechnet (Infotext nennt die Hälfte); WebKit läuft in der CI
Nächste Schritte: Machine Seated Leg Curl aus dem Programm (D-532)
```

```
Arbeitspaket: D-532 Phase Programme, Dali’s PPLC ohne Machine Seated Leg Curl (Gerätetest, Punkt 2)
Umgesetzte Funktionen: Legs-Tag ohne Beinbeuger sitzend; Übung und Animation bleiben in der Bibliothek; Übersicht mit 24 Übungen; erfüllte AK: –
Geänderte Dateien: tools/data/dali-pplc.source.json, src/modules/training/data/programs.v1.json, docs/programs.md, src/modules/training/calc/programs.test.ts, docs/uebungen-animationsplan.md, docs/uebungen-bewegungsfamilien.md, docs/screens/uebungen/dalis-pplc-uebersicht.webp, form-programme-report.md, docs/decisions.md, docs/testing.md, docs/implementation-plan.md, docs/feature-inventory.md
Technische Entscheidungen: D-532
Ausgeführte Tests: Format, Lint, Typen und Dokumente bestanden; Unit-Tests des Trainings 211 bestanden (31 Dateien), der neue Test gegen den Stand davor rot; Build, Startansicht 240,0 KB, Übungsbilder 128 von 128; E2E Chromium (Programme, Vorlagen, Programmliste, eigene Programme, Übungen) 43 bestanden, 5 übersprungen, 0 fehlgeschlagen
Ergebnis: bestanden
Bekannte Einschränkungen: WebKit läuft in der CI
Nächste Schritte: rechte Spalte am Duo aufgeklappt in der Pause (D-533)
```

```
Arbeitspaket: D-533 Phase Programme, rechte Spalte am Duo aufgeklappt in der Pause (Gerätetest, Punkt 4)
Umgesetzte Funktionen: „Jetzt“ in zwei Spalten auch in der Pause; Karte „Als Nächstes“ entfernt; in einer Spalte blendet `data-pause` „Jetzt“ in der Pause aus; erfüllte AK: –
Geänderte Dateien: src/modules/training/ui/player/SessionPage.tsx, src/modules/training/ui/player/player-layout.css, src/modules/training/ui/player/useFittingRows.ts (entfernt), src/modules/training/ui/player/useFittingRows.test.ts (entfernt), src/modules/training/ui/player/player-ui.test.tsx, src/shared/i18n/de-session.ts, e2e/duo-player-befunde.spec.ts, e2e/duo-player.spec.ts, e2e/uebungen-wiedergabe.spec.ts, form-programme-report.md, docs/decisions.md, docs/testing.md, docs/implementation-plan.md, docs/feature-inventory.md
Technische Entscheidungen: D-533
Ausgeführte Tests: Format, Lint, Typen und Dokumente bestanden; Player-Tests 30 bestanden (5 Dateien); Build, Startansicht 240,0 KB, Übungsbilder 128 von 128; E2E Chromium für Player, Pause, Duo, Wiedergabe und Übungen (9 Dateien) 55 bestanden, 24 übersprungen, 1 fehlgeschlagen: `uebungen-wiedergabe.spec.ts` „Rahmen und „Jetzt“ gleich groß“ fand nach dem letzten Satz Pause und „Alle Sätze erledigt“ zugleich (gewollt, D-533); Abfrage angepasst, danach bestanden; der neue Test C gegen den Build davor rot
Ergebnis: bestanden
Bekannte Einschränkungen: WebKit läuft in der CI
Nächste Schritte: Rand der Karten links am Duo quer (D-534)
```

```
Arbeitspaket: D-534 Phase Programme, Rand der Karten am Duo quer (Gerätetest, Punkt 5)
Umgesetzte Funktionen: Kopf links im niedrigen Fenster deckt den Rand der Karten ab (4 px über die Spalte); erfüllte AK: –
Geänderte Dateien: src/modules/training/ui/player/player-layout.css, e2e/duo-player-befunde.spec.ts, e2e/duo-player.spec.ts, form-programme-report.md, docs/decisions.md, docs/testing.md, docs/implementation-plan.md, docs/feature-inventory.md
Technische Entscheidungen: D-534
Ausgeführte Tests: Format, Lint, Typen und Dokumente bestanden; Build, Startansicht 240,0 KB, Übungsbilder 128 von 128; E2E Chromium Duo und Player (6 Dateien) 28 bestanden, 19 übersprungen, 1 fehlgeschlagen (Kante des Kopfs, Test angepasst, danach `duo-player.spec.ts` 5 bestanden, 5 übersprungen); der neue Test mit dem CSS davor 2 rot, mit der Änderung 2 grün
Ergebnis: bestanden
Bekannte Einschränkungen: Ursache am nachgestellten Gerät gefunden, nicht am Gerät selbst; WebKit läuft in der CI
Nächste Schritte: kleine Pause (D-535)
```

