# FORM · Bericht zur Phase Übungen

Stand: 27.10.2026, Abschnitt 0, Phase 1, die Fortsetzung (`prompts/uebungen-weiter-FORM.md`, Abschnitt 9) und die Übungsanimationen ohne Kosten (`prompts/uebungen-animation-gratis-FORM.md`, Abschnitt 10) bis zum vereinbarten Halt abgeschlossen; Übertragen auf weitere Übungen nach Freigabe des Produktinhabers · Branch `form-uebungen`, Entwurfs-PR [darad11/fitness-app#53](https://github.com/darad11/fitness-app/pull/53) · Auftrag `docs/prompts/uebungen-FORM.md`, verbindliche Leitlinien `docs/prompts/uebungen-leitlinien-FORM.md` · Entscheidungen D-395 bis D-412

Getestet in Browser-Fenstern (Chromium in dieser Umgebung, WebKit in GitHub Actions), nicht am Gerät. Animationen gibt es für die drei Pilot-Übungen (Abschnitte 9 und 10); in den Bildern mit „prototyp“ kam ein Rohentwurf nur im Test dazu.

## 1. Abschnitt 0 – Vorab

| Punkt | Ergebnis |
|---|---|
| CI auf `main` zum Merge `25a3553` | Lauf 40475256640: alle vier Jobs grün (Lint, Typen, Unit, Dokumente, Build; Datenbank; E2E Chromium; E2E WebKit) |
| Nachtrag Duo | Gerätetest bestanden, eingetragen in `docs/testing.md`, `form-duo-report.md` Abschnitt 15 und in der Beschreibung von PR #52 (D-395) |
| Platz in der Startansicht | 244,7 → 237,0 KB (Ziel höchstens 238 KB), ohne neue Abhängigkeit und ohne Funktion zu entfernen (D-396): Die Skripte im Kopf werden beim Bauen verkleinert (`startflaeche.js` 4,9 → 1,7 KB, `theme-init.js` 1,6 → 0,8 KB), `index.html` ohne Kommentare (5,8 → 5,4 KB), Glas-Linse und Kreis der Tab-Leiste werden nachgeladen (rund 3,5 KB). Nebenbei gefunden und verhindert: Die verkleinerten Skripte standen zweimal mit verschiedenen Prüfsummen im Service Worker; `check-precache` prüft das jetzt |
| Nach Phase 1 | 237,7 KB. Alles Neue (Komponenten, Texte, Daten, Bilder) wird nachgeladen. Die 0,7 KB mehr sind drei Lade-Einträge in der Modulschnittstelle und die neuen Tailwind-Klassen im gemeinsamen CSS |

## 2. Bestandsaufnahme

Volle Tabelle mit allen 124 Übungen (Schlüssel und ID, deutscher und englischer Name, Gerät, Haupt- und Nebenmuskeln, Varianten, Visual, Ausführung, Hinweis zur Quelle): `docs/uebungen-bestand.md`, erzeugt aus den Daten der App, geprüft in `pnpm check:docs`.

| Gruppe | Übungen | mit Visual | Ausführung fertig | Ausführung offen |
|---|---|---|---|---|
| Brust | 12 | 0 | 12 | 0 |
| Rücken | 17 | 0 | 16 | 1 |
| Schultern | 12 | 0 | 12 | 0 |
| Bizeps und Unterarme | 11 | 0 | 11 | 0 |
| Trizeps | 11 | 0 | 10 | 1 |
| Rumpf | 16 | 0 | 12 | 4 |
| Gesäß | 9 | 0 | 7 | 2 |
| Oberschenkel vorne | 11 | 0 | 7 | 4 |
| Oberschenkel hinten | 7 | 0 | 7 | 0 |
| Waden, Adduktoren, Abduktoren | 7 | 0 | 6 | 1 |
| Ganzkörper und Kondition | 11 | 0 | 11 | 0 |
| **Summe** | **124** | **0** | **111** | **13** |

- Die früher genannten rund 105 Übungen sind die aus Q-05; mit Programm C (D-248) sind es 124.
- Im Projekt gab es bisher kein einziges Übungsbild. Je Übung gibt es nur deinen persönlichen Videolink.
- Jede Übung hat einen dauerhaften Schlüssel und daraus eine feste ID. Visuals und Texte hängen an diesem Schlüssel, nie am Namen.
- Varianten: Jede Gerätevariante ist eine eigene Übung (zum Beispiel Schulterdrücken mit Langhantel stehend und mit Kurzhanteln sitzend); Bild und Text gehören deshalb immer zur genauen Variante.

## 3. Gerüst

- **Datenstruktur:** `public/uebungen/medien.json`, je Schlüssel Vorschaubild, Demonstration (Animation mit ruhendem Bild, stummes Video mit Standbild, zwei Phasen oder ein Bild), Alternativtext und Quelle mit Lizenz und Namensnennung. In Phase 1 leer. Der Service Worker speichert die Liste vorab, die Bilder selbst erst beim ersten Anzeigen.
- **Listen:** Vorschaubild links neben dem Namen in Übungsbibliothek und Suche, Übungsauswahl (Freies Training, Ersetzen), Alternativen, Programmvorlagen, Trainingstag bearbeiten; kleiner in „Als Nächstes“, in der Zusammenfassung und in den Übungskarten des Players. Dort erst ab 30 rem Breite: Schmal (Duo zugeklappt, iPhone) zeigt „Jetzt“ die aktuelle Übung, und der erste Satz bleibt über der Fußleiste.
- **Player:** aufgeklappt die große Demonstration im vorbereiteten Platz der rechten Spalte, zugeklappt und am iPhone kompakt rechts in der Karte „Jetzt“, der Text fließt darum. „Satz erledigt“ bleibt unten erreichbar. Die Demonstration gehört zur aktuellen Übung und wird je Übung neu aufgebaut; aktuelle und nächste Übung werden vorgeladen.
- **Verknüpfung:** Antippen der Demonstration öffnet die Übungsinfo mit Kurzfassung der Ausführung und „Alle Angaben zur Übung“ (das Training läuft weiter).
- **Übungsdetails:** Demonstration oben, neuer erster Reiter „Ausführung“.
- **Solange ein Visual fehlt:** das bisherige Symbol (Hantel) in der Kachel, groß mit den Muskel-Etiketten. Kein leerer Kasten, nichts, das wie eine Demonstration aussieht. Ebenso, wenn eine Datei nicht lädt oder die Liste fehlt.

Bilder (`docs/screens/uebungen/`, Übersicht `uebersicht.png`, erzeugt mit `node tools/uebungen-screens.mjs`):

| Ansicht | So wird es ausgeliefert | Mit Rohentwurf (nur Test) |
|---|---|---|
| Übungsliste, iPhone | `rueckfall-liste.png` | `prototyp-liste.png` |
| Player, iPhone | `rueckfall-player-iphone.png` | `prototyp-player-iphone.png` |
| Player, Duo zugeklappt | `rueckfall-player-zugeklappt.png` | `prototyp-player-zugeklappt.png` |
| Player, Duo aufgeklappt | `rueckfall-player-aufgeklappt.png` | `prototyp-player-aufgeklappt.png` |
| Übungsinfo im Player | `rueckfall-player-info.png` | `prototyp-player-info.png` |
| Übungsdetails | `rueckfall-details.png`, `rueckfall-details-ausfuehrung.png` | `prototyp-details.png` |

## 4. Ausführungstexte

- **111 von 124 fertig**, je Übung eigens geschrieben, mit 1 bis 3 Quellen (ExRx.net, ACE Exercise Library, vereinzelt NASM) und Abrufdatum. Wo die Quelle eine nahe Variante beschreibt oder ein Punkt abgeleitet ist, steht das bei 46 Übungen offen dabei, in der App unter den Quellen.
- **Aufbau:** kurze Beschreibung, Ausgangsposition, Schritt für Schritt, Technik (Bewegungsumfang, Tempo), häufige Fehler (nur, wenn eine Quelle sie nennt), Sicherheit, Quellen. Darunter: „Allgemeine Hinweise zur Technik, keine persönliche oder medizinische Empfehlung. Wenn etwas schmerzt, hör auf und lass dich beraten.“
- **Recherche:** Das Netz dieser Sitzung öffnet Fachseiten nicht direkt; die Inhalte kamen über die Websuche, eingeschränkt auf die Fachseiten. Die Texte sind in eigenen Worten.
- **13 offen**, in der App mit „Für diese Übung gibt es noch keine belegte Beschreibung der Ausführung.“:
  - ohne passende Quelle (4): Rudern mit Kurzhanteln, vorgebeugt (beidarmig im Stand); Trizepsdrücken am Kabel, über Kreuz; Heel Taps; Pull-Throughs am Kabel.
  - noch nicht recherchiert, weil das Kontingent der Websuche dieser Sitzung aufgebraucht war (9): Sit-ups, Windshield Wipers, Knieheben stehend, Hip Thrust mit Langhantel, Beinpresse, Hackenschmidt-Kniebeuge, Bulgarische Kniebeuge mit Kurzhanteln, Ausfallschritte mit Kurzhanteln, Seitliches Gehen mit Widerstandsband. Hip Thrust und Beinpresse kommen in den Vorlagen vor; sie hole ich in Phase 2 zuerst nach.
- **Noch nicht da:** eigens ausgewählte „einfachere Alternativen“ je Übung. Der Reiter „Alternativen“ zeigt wie bisher passende Übungen nach Muskeln und Gerät.

## 5. Quellenvorschlag für die Visuals

Vergleich und Begründung: `docs/uebungen-quellen.md`.

| Quelle | Abdeckung | Stil | Lizenz | Bewertung |
|---|---|---|---|---|
| Eigener FORM-Stil (Figur im Code, zwei Phasen) | 100 % | einheitlich, dunkle Fläche, Tokens | eigenes Werk | **Empfehlung** |
| Everkinetic | rund 60 bis 70 % | Strichzeichnung, zwei Phasen, SVG | CC BY-SA 4.0, Namensnennung | Zweitwahl |
| wger | unbekannt | gemischt, oft Fotos | je Bild verschieden | nur Einzelfälle |
| free-exercise-db | rund 80 bis 85 % | Fotos von Personen | ungeklärt | ausschließen |
| ExerciseDB / AscendAPI | hoch | 3D-GIFs | Abo, Speichern verboten | ausschließen |
| MuscleWiki, Gym Visual, Stock, LottieFiles | – | – | nicht geprüft | offen |

**Empfehlung: eigener FORM-Stil.** Einziger Weg, der alle Vorgaben zugleich erfüllt: ein Stil für alle 124 Übungen, keine Fotos, keine fremden Logos, keine Lizenzpflichten, offline und klein, dezente Bewegung durch zwei Phasen im Wechsel. Gegen das Hauptrisiko, eine falsch gezeichnete Bewegung: Pose nach dem belegten Text, Prüfseite mit allen Posenpaaren zur Freigabe je Gruppe, Cardiogeräte als ruhendes Bild. Der Rohentwurf für Kniebeuge und Bankdrücken zeigt Stil und Wirkung; Hände, Griff und Winkel sind darin noch grob.

Nicht geprüft (Kontingent der Websuche aufgebraucht): MuscleWiki, Gym Visual, WorkoutLabs, Stock-Anbieter, LottieFiles, Mixamo, KI-Generatoren. Keine Lizenz abgeschlossen, nichts gekauft.

## 6. Tests

Ergebnisse wörtlich in `docs/testing.md`, Abschnitte „Platz in der Startansicht“ und „Phase Übungen, Phase 1“.

- Unit: `media.test.ts` (Liste, Zuordnung über den Schlüssel, Rückfall, Vorausladen, Texte: jede Übung genau einmal, nur Fachseiten, keine Doppelungen, Leitplanken), `exercise-visual.test.tsx` (Symbol, Bild, Ladefehler, Wechsel ohne falsches Bild, weniger Bewegung, Video stumm), `player-demo.test.tsx` (Demonstration folgt der aktuellen Übung, Abhaken ändert nichts, Vorausladen aktuelle und nächste Übung, Info mit Ausführung).
- E2E: `e2e/uebungen.spec.ts` (Liste mit und ohne Visuals, fehlende Datei, Player zugeklappt und aufgeklappt, Wechsel und Zurück, Neuladen im Training, Details mit Quellen, offene Übung).
- Offline mit echten Bildern, Workout-Abschluss mit Bildern und die Breiten des Duo mit echten Visuals folgen in Phase 2, wenn es Dateien gibt.

## 7. Beobachtungen und Grenzen

- Nach der CI behoben: In WebKit schob das Vorschaubild in der Übungskarte zugeklappt den ersten Satz unter die Fußleiste. Jetzt steht er wie ohne Vorschaubilder (gemessen gegen `main`).
- Die Texte stützen sich auf Zusammenfassungen der Websuche, nicht auf die geöffnete Seite. Die Adressen stehen dabei; ein Abgleich mit der Seite selbst ist in einer Umgebung mit offenem Netz möglich.
- Die Regel des Service Workers für Bilder (bei Bedarf speichern) ist gesetzt, aber erst mit echten Dateien in Phase 2 geprüft.

## 8. Was ich von dir brauche

1. **Q-24:** Quelle der Visuals. Meine Empfehlung: eigener FORM-Stil.
2. Ob ich die 9 noch nicht recherchierten Texte in Phase 2 nachholen soll (Empfehlung: ja, zuerst Hip Thrust und Beinpresse).

## 9. Fortsetzung nach Phase 1 (`uebungen-weiter-FORM.md`)

Entscheidung Q-24 festgehalten (D-400): realistisch wirkender Körper in Grau auf dunklem Grund, arbeitende Muskeln in Lime; kein gezeichneter Stil mehr. Den Weg wählst du nach dem Vergleich.

### 9.1 Behobene Fehler (Abschnitt 1)

| Fehler | Ursache und Behebung | Test |
|---|---|---|
| WebKit: Gewichtsfeld im zugeklappten Training ohne Fokus | Das Vorschaubild in der Übungskarte schob den ersten Satz unter die Fußleiste; seit 8879e65 erst ab 30 rem Breite. `duo-tastatur.spec.ts` ist in WebKit grün (CI-Läufe zu 989007c und 748051c) | schlug am alten Stand fehl (CI 2510894) |
| Fehlgeschlagener Import der Übungsbilder | Fehlte der nachgeladene Teil (Deployment, kein Netz), brach die ganze Seite ab, im Training mit „Dieser Bereich ließ sich nicht laden“. Jetzt zeigen die Bild-Komponenten nichts, die Seite bleibt; außerhalb des Trainings lädt die App genau einmal neu wie in der Stabilitäts-Phase (D-343), im Training nie (D-400) | zwei E2E-Tests, beide am alten Stand rot |
| `uebungen.spec.ts` in WebKit rot | Kein Fehler der Bilder: Die Diagnose zeigt, dass der Kopf des Players in diesem Test in WebKit 148 px höher ist (Karte „Jetzt“ bei 295 statt 147 px), Bild und Karte sind gleich groß. Der Test vergleicht jetzt mit und ohne Bild im selben Browser und nennt bei Abweichung die Lage aller Blöcke samt Text | Ergebnis in der CI zu diesem Stand steht aus |

### 9.2 Startansicht

237,8 KB (gzip), Ziel höchstens 238 KB, Grenze 250 KB. Muskelkarte, Videos und alle neuen Teile laden nach. Einmal fiel auf: Ein nachgeladener Teil nur mit JSX trennte `react` von `jsx-runtime` (+0,4 KB); die Muskelkarte nutzt deshalb `useMemo` (D-401).

### 9.3 Muskelkarte (Abschnitt 2, D-401)

Vorder- und Rückansicht im Reiter „Muskeln“, Hauptmuskeln Lime, Nebenmuskeln Lime mit 35 % Deckkraft, Körper grau. Vorlage: SVG-Pfade aus `react-native-body-highlighter` (MIT), Lizenz in `licenses-data.md` Abschnitt 5. Bilder: `docs/screens/uebungen/muskelkarte-bankdruecken.png`, `muskelkarte-kniebeuge.png`.

### 9.4 3D-Pilot (Abschnitte 3 und 4, D-402, D-403)

- Pipeline in `tools/uebungen-3d/` (Blender 4.2 als Python-Modul, MakeHuman-Grundmodell CC0). Kniebeuge, Bankdrücken, Latziehen als Schleife von 2,5 s, MP4 und WebM 720 × 540, Poster und Vorschau; zusammen rund 280 KB.
- In der App: Liste, Player zu- und aufgeklappt, Übungsdetails; „Bewegung reduzieren“ zeigt das Standbild; offline läuft, was einmal gezeigt wurde.
- Übersicht: `docs/screens/uebungen/pilot-uebersicht.png`; Aufnahme der Bewegung: `pilot-bewegung.mp4` (drei Schleifen nebeneinander) und `pilot-player.webm` (Player aufgeklappt).
- Heruntergeladen wurde nur über bereits freie Adressen: `pypi.org` und `files.pythonhosted.org` (bpy), `raw.githubusercontent.com` (MakeHuman), `registry.npmjs.org` (Muskelkarte). Die Körperformen von MakeHuman (Muskulatur, Proportionen) lagen nicht unter den bekannten Adressen; dafür wäre `github.com` nötig.

### 9.5 Ausführungstexte (Abschnitt 5, D-404)

122 von 124. Neu: Hip Thrust, Beinpresse, Sit-up, Scheibenwischer, Knieheben stehend, Hackenschmidt-Kniebeuge, Bulgarische Split-Kniebeuge, Ausfallschritt mit Kurzhanteln, seitliches Gehen mit Band, Rudern mit zwei Kurzhanteln, Trizepsstrecken über Kreuz; nahe Varianten gekennzeichnet. Offen: Cable Pull-Through und Heel Taps (die nächsten Treffer sind andere Übungen).

### 9.6 Vergleich der Wege (Abschnitt 6, D-405)

Tabelle in `docs/uebungen-quellen.md`. Empfehlung: Plan B mit Exercise Animatic, nach schriftlicher Klärung (Umfärben, Auslieferung in der PWA, Logo, Alpha-Kanal, Lücken), am besten mit Probeclips der drei Pilot-Übungen; Rückfallweg ist der Pilot mit besserem Grundmodell. Plan C scheidet aus.

### 9.7 Tests

Wörtlich in `docs/testing.md`, Abschnitt „Phase Übungen, Fortsetzung“. Unit 1.209 bestanden; E2E Chromium 428 bestanden, danach 4 Offline-Tests rot (Vorschaubilder ohne Netz angefragt), behoben, die betroffenen Dateien 27 bestanden. WebKit nur in der CI.

### 9.8 Offene Punkte

1. Deine Wahl des Wegs (D-405).
2. WebKit-Ergebnis für den umgestellten Player-Test in `uebungen.spec.ts`.
3. Gerätetest der Animationen am iPhone (Autoplay, Schleife, offline, „Bewegung reduzieren“).
4. Cable Pull-Through und Heel Taps ohne belegte Quelle.

## 10. Übungsanimationen ohne Kosten (`uebungen-animation-gratis-FORM.md`)

Auftrag mit Anhang `pilot-korrekturen.png` unter `docs/prompts/`. Nur kostenlose Werkzeuge und Daten: Blender 4.2 als Python-Modul, MakeHuman (CC0), ffmpeg. Nichts gekauft, kein Konto angelegt, keine neue Adresse unter „Network access“. Plan B und Plan C zurückgestellt.

### 10.1 Fehler des bisherigen Piloten und Ursachen (Abschnitt 7.1, D-406)

| Fehler | Ursache | Art |
|---|---|---|
| Hände schweben wie Krallen, umgreifen die Stange nicht | Jedes Fingerglied um einen festen Winkel gebeugt, ohne Bezug zur Stange; das Handziel hing 4,5 bis 6 cm neben der Stange; die Drehung der Hand ergab sich zufällig aus der IK-Kette | Rig, Animationsdaten |
| Knie kippen nach innen (unten 17 cm innerhalb der Fußgelenke) | Blender-IK über vier Knochen; das Pol-Ziel wurde in jedem Bild aus der Lage des Knies neu gesetzt, nichts band das Knie an die Zehenrichtung | Rig |
| Füße uneinheitlich gedreht, nicht fest am Boden (im Stand 1 cm darüber) | Fuß- und Pol-Ziele je Seite getrennt gelöst, die Drehung nach außen saß nur am Halter; der Fuß hing an der IK-Kette, statt auf den Boden gesetzt zu werden | Rig |
| Muskelzonen verschwommen | Weicher Abfall je Muskel, zweimal mit den Nachbarpunkten geglättet, im Material weich gemischt | Zonendaten, Rendering |
| Seitenansicht verdeckt Kopf und Oberkörper | Kniebeuge und Latziehen schräg von hinten, Bankdrücken schräg von der Seite, fester Abstand; die Scheiben lagen vor Kopf und Oberkörper | Rendering |
| Ruck an den Umkehrpunkten | Zeitverlauf mit Kosinus: Die Geschwindigkeit ist stetig, die Beschleunigung springt | Animationsdaten |
| Bankdrücken: Unterarme in der Mitte 21° schräg, Stange unten 1,8 cm über der Brust, Ellbogen oben ganz durchgestreckt (179°) | Ellbogen über ein festes Pol-Ziel 70 cm seitlich der Schulter statt über die Stange; Endpunkte nicht an Brust und Arm gemessen | Rig, Animationsdaten |
| Latziehen: Hände auf den gebogenen Enden, Unterarme bis 58° schräg, Knierolle nicht auf den Oberschenkeln | Handziel 47 cm neben der Mitte; Rolle unabhängig von den Oberschenkeln gesetzt | Animationsdaten |

Zum Modell: MakeHuman-Grundmodell ohne Formziele, 1,67 m, Oberarm 22,8 cm von Gelenk zu Gelenk (eher kurz). Das begrenzt die Reichweite; bei der Kniebeuge liegt die Stange deshalb hoch auf dem Trapez und schräg in der Hand. Die Hände haben drei Glieder je Finger und einen beweglichen Daumen und erlauben natürliche Griffe, wenn die Pose stimmt; ein anderes Modell ist dafür nicht nötig.

### 10.2 Änderungen an Rig, Animation und Darstellung (Abschnitte 2, 3 und 5; D-407, D-409, D-410)

- **Rig statt Einzelwinkel** (`tools/uebungen-3d/rig.py`): Jede Haltung folgt aus Zielen und ist rechnerisch geschlossen gelöst, ohne Blender-IK und ohne Gedächtnis zwischen den Bildern; dieselbe Phase ergibt immer dieselbe Haltung.
  - Beine: Knie in der Ebene der Zehenrichtung, Fuß flach, gedreht und fest am Boden.
  - Arme: Die Hand hängt am Griff und dreht sich nur um die Stange; zu jeder Drehung setzt die Regel der Übung den Ellbogen; gewählt wird die Drehung mit dem geradesten Handgelenk.
  - Hände: Finger bis auf die Stange gebeugt, am verformten Netz nachgemessen und angepasst; Daumen umgreift gegenläufig bis auf die Gegenseite der Stange.
  - Rumpf und Becken: Drehungen um echte Gelenkpunkte, Last über der Unterstützungsfläche.
- **Bewegung** (`haltung.py`): Minimum-Ruck-Verlauf (stetige Beschleunigung), kurze Pause an beiden Umkehrpunkten, 60 Bilder bei 24 fps, nahtlose Schleife. Motion Capture passt zu keiner der drei Pilot-Übungen (keine Aufnahme mit Langhantel oder Gerät, Abschnitt 10.7); die Bewegung ist deshalb aus Ausgangs-, Zwischen- und Endposition gebaut.
- **Muskelzonen** (`zonen.py`, `szene.py`): Umriss je Muskel in Körperkoordinaten, Abstand je Eckpunkt, scharfer Schnitt im Material mit 1,2 mm Übergang. Hauptmuskeln Lime, mitarbeitende Lime mit 42 % Deckkraft, beides aus den Übungsdaten.
- **Kamera** (`szene.bildausschnitt`): Dreiviertelansicht von vorn-seitlich (45°, 10° von oben; liegend 32°), Abstand aus Figur und Gerät über die ganze Bewegung. Latziehen von hinten-seitlich (135°), weil die arbeitenden Muskeln auf dem Rücken liegen und von vorn Säule und Gewichtsblock den Rumpf verdecken.
- **Prüfung** (`render.py --pruefen`): Messwerte für alle 60 Bilder (Gelenkwinkel, Abstand der Finger zur Stange am verformten Netz, Bodenkontakt und Verschiebung der Füße), Prüfansichten von vorn, von der Seite und in der Standardansicht in fünf Phasen, dazu der Griff aus der Nähe von drei Seiten.
- **Modell:** unverändert MakeHuman (CC0). Brust wie bisher abgeflacht (geschlechtsneutral).

### 10.3 Pilot-Übungen neu animiert und geprüft (Abschnitte 4 und 6, D-408)

Messwerte aus `render.py --pruefen` über alle 60 Bilder einer Schleife; Prüfbilder `docs/screens/uebungen/pruef-<übung>.webp` (vorn, Seite und Standardansicht in fünf Phasen, Griff aus der Nähe von drei Seiten). In allen drei: kein Sprung (größte Änderung je Bild entspricht der Bewegung), Schleife schließt ohne Unterschied zwischen erstem und letztem Bild, das Rig meldet nichts.

| Prüfpunkt | Kniebeuge | Bankdrücken | Latziehen |
|---|---|---|---|
| Ausgang | Stand, Knie 176°, Rumpf 6° geneigt, Stange über der Fußmitte | Arme fast gestreckt (171°), Stange über den Schultern | Arme fast gestreckt (168°), Schultern mit angehoben, 8° zurückgelehnt |
| Endposition | Oberschenkel waagrecht, Knie 67°, Rumpf 44° | Stange auf der unteren Brust (Abstand 0 cm), Ellbogen 56°, Oberarm 66° zum Rumpf | Stange vor der oberen Brust, Ellbogen 52°, 18° zurückgelehnt |
| Gelenkausrichtung | Knie zur Zehenrichtung −0,6 bis +1,4°; Stange über der Fußmitte 0,0 cm in jedem Bild; Knie unten 2,5 cm hinter der Zehenspitze | Unterarm unten höchstens 5,7° aus der Senkrechten (Handgelenk über dem Ellbogen), dazwischen höchstens 17° zur Seite | Unterarm im Mittelteil höchstens 5,1° aus der Senkrechten (Zugrichtung des Kabels), unten 27° (breiter Griff) |
| Handgelenk | 12° gestreckt, gleichbleibend | 12° bis 27° (darin 12° gewollte Streckung, Stange tief in der Hand) | höchstens 10° im Mittelteil, oben 11°, unten 17° |
| Griff und Kontakt | Griff 58 cm, Stange in der Handfläche, 20° schräg, Handfläche nach vorn, Ellbogen unten-hinten; Haut höchstens 1,7 mm eingedrückt, 222 Punkte in Kontakt | Griff 60 cm, beide Hände gleich, Daumen umgreift; 1,2 mm, 332 Punkte; am kleinen Finger 2,6 mm Spalt (Stange tief in der Hand) | Griff 64 cm auf dem geraden Teil, 6° schräg; 1,3 mm, 264 Punkte |
| Füße | flach, 18° nach außen, tiefster Punkt 0 mm, Verschiebung höchstens 2,8 mm | flach am Boden, 0 mm | flach am Boden, 0,1 mm |
| Weiteres | hohe Stangenposition auf dem oberen Trapez, Kopf in Verlängerung der Wirbelsäule | Schulterblätter zurückgezogen auf der Bank | Sitz auf Kniehöhe, Knierolle auf den Oberschenkeln; die Stange läuft mit mindestens 4,1 cm Abstand vor dem Gesicht vorbei |

Ausweichen auf Ausgangs- und Endposition mit dezenter Bewegung dazwischen (Abschnitt 6) war bei keiner der drei nötig.

Darstellung in der App: `docs/screens/uebungen/pilot-uebersicht.png` (je Übung Ausgangs- und Endposition, Player zu- und aufgeklappt, Übungsdetails, Liste) und `pilot-player.webm` (Player aufgeklappt mit der Kniebeuge, gut zwei Wiederholungen).

### 10.4 Dateigrößen und Performance

| Übung | MP4 | WebM | Poster | Vorschau | zusammen | vorher | Renderzeit (60 Bilder) |
|---|---|---|---|---|---|---|---|
| Kniebeuge | 54,1 KB | 39,9 KB | 5,3 KB | 2,2 KB | 101,6 KB | 99,7 KB | 1.557 s (neben laufenden Tests) |
| Bankdrücken | 37,6 KB | 29,1 KB | 6,5 KB | 2,8 KB | 76,0 KB | 75,6 KB | 1.154 s |
| Latziehen | 45,1 KB | 37,5 KB | 6,9 KB | 3,0 KB | 92,4 KB | 69,9 KB | 830 s |
| **Summe** | | | | | **270,0 KB** | 245,2 KB | |

Abgerufen wird je Übung nur ein Video (MP4 oder WebM) mit Poster und Vorschau, also 47 bis 62 KB. Alles nachgeladen, die Startansicht bleibt bei 237,8 KB von 250 KB. Latziehen ist größer, weil sich Stange, Kabel und Oberkörper mehr bewegen. Rechnen: Blender 4.2, Cycles auf vier CPU-Kernen, 40 Samples mit Entrauschen, 720 × 540; dazu die Prüfung je Übung (60 Bilder messen, 21 Prüfbilder mit 16 Samples) rund 2 bis 4 Minuten. Für alle 124 Übungen ergibt das rund 35 Stunden Rechenzeit (Abschnitt 10.7).

### 10.5 Alt und neu (Abschnitt 7.3, D-412)

Je Übung ein Standbild (Ausgang und Endposition, alt und neu, je von vorn und von der Seite) und eine kurze Aufnahme (zwei Schleifen, oben alt, unten neu): `docs/screens/uebungen/vergleich-<übung>.webp` und `.mp4`. Beide Stände mit derselben Regel für den Bildausschnitt, 360 × 270, 16 Samples; von der Seite ohne Hantelscheiben, von vorn ohne Säule und Gewichtsblock des Latzugs. Werte des alten Stands nachgemessen mit seinem eigenen Code (Stand `5d155fa`).

| | alt (5d155fa) | neu |
|---|---|---|
| **Kniebeuge** | Finger fest gebeugt, Hand neben der Stange; Knie unten 17 cm innerhalb der Fußgelenke; Füße verschieden gedreht, im Stand 1 cm über dem Boden; unten Knie 94°, Hüfte 12 cm über dem Knie; Zonen weich; Kamera schräg von hinten | Hand umgreift die Stange, Handfläche nach vorn, Ellbogen unten-hinten; Knie folgen den Zehen; beide Füße 18° außen, flach; unten Oberschenkel waagrecht (Knie 67°), Stange über der Fußmitte; Zonen scharf; Dreiviertelansicht vorn |
| **Bankdrücken** | Finger fest gebeugt, Hand 4,5 cm unter der Stange; Unterarme in der Mitte 21° schräg; Stange unten 1,8 cm über der Brust; oben Ellbogen ganz durchgestreckt (179°); Kamera schräg von der Seite | Handgelenke über den Ellbogen (Unterarm unten höchstens 5,7° schräg), Oberarm unten 66° zum Rumpf, Stange berührt die untere Brust, oben Ellbogen 171° (nicht ganz durchgestreckt), Daumen umgreift; Schulterblätter auf der Bank; Dreiviertelansicht vorn oben |
| **Latziehen** | Hände auf den gebogenen Enden und 6 cm unter der Stange; Unterarme bis 58° schräg, Ellbogen unten nur bis 106° gebeugt; Knierolle fest und nicht auf den Oberschenkeln | Hände auf dem geraden Teil, Finger an der Stange; Unterarme im Mittelteil in Zugrichtung (höchstens 5°), unten 27°; Ellbogen unten 52°; Knierolle auf den Oberschenkeln; Stange vor dem Gesicht vorbei bis zur oberen Brust |

### 10.6 Verwendete Daten und Lizenzen

- MakeHuman-Grundmodell, Skelett und Gewichte: CC0 1.0, Renderings frei nutzbar (`licenses-data.md` Abschnitt 6). Nicht im Repository, `render.py --hole` lädt sie.
- Bewegung der drei Pilot-Übungen: eigenes Werk aus dem Rig, keine fremden Bewegungsdaten.
- Für weitere Familien vorgesehen: CMU (frei, auch in Produkten; Daten nicht weiterverkaufen) und Mixamo (lizenzfrei mit Adobe-Konto; Rohdateien nicht weitergeben). Wortlaut, Belege und was davon nicht zu verwenden ist: `licenses-data.md` Abschnitt 7. Rohdaten nie ins öffentliche Repository.
- Werkzeuge: Blender 4.2 (GPL) und ffmpeg nur zum Rendern und Kodieren, nicht Teil der App.

### 10.7 Bewegungsfamilien, Aufwand und Mixamo (Abschnitte 3, 7.4 und 7.5; D-411)

`docs/uebungen-bewegungsfamilien.md`: alle 124 Übungen in zwölf Familien mit Variante, Gerät, Quelle der Bewegung und Aufwand. 112 aus der Familie im Code, 3 mit CMU (Farmer's Walk, Hampelmann, Laufband), 9 mit Mixamo. Für die Pilot-Übungen passt keine freie Aufnahme (keine mit Langhantel oder Gerät beschrieben).

**Aufwand für alle 124 mit diesem Verfahren:** rund 300 Stunden, Spanne 250 bis 400, dazu rund 35 Stunden Rechenzeit. Die Pilot-Familien sind am weitesten (Rig, Griffe, Prüfung stehen); teuer sind Geräte mit vielen Teilen und Übungen am Boden mit Körperkontakt.

**Mixamo:** Liste mit Einstellungen in Abschnitt 7 der Übersicht (Figur „Y Bot“, FBX Binary, Without Skin, 30 fps, Keyframe Reduction none). Priorität 1, acht Animationen, nur für die Familien Rumpf und Kondition: Push Up, Situps, Bicycle Crunch, Plank, Burpee, Jumping Jacks, Jumping Rope, Kettlebell Swing. Für die drei Pilot-Übungen brauche ich nichts.

**Adressen:** keine neue nötig (CMU als BVH über GitHub).

### 10.8 Verbleibende Einschränkungen

- **Modell:** MakeHuman-Grundmodell ohne Formziele: neutrale, eher schmale Figur, Oberarm kurz (22,8 cm). Folgen: Kniebeuge nur mit hoher Stangenposition und schräger Stange in der Hand ohne Knick im Handgelenk; Latziehen unten mit 27° schrägem Unterarm und 17° Handgelenk.
- **Bankdrücken:** Die Schulter bleibt fest; im Mittelteil stehen die Unterarme dadurch bis 17° schräg (Ellbogen etwas außerhalb der Hände). Oben 27° im Handgelenk (12° gewollte Streckung, der Rest seitlich bei gestreckten Armen und breitem Griff). Am kleinen Finger bleibt ein Spalt von 2,6 mm.
- **Haut:** Verformung nur über Gewichte, ohne Korrekturformen; bei starker Beugung kann ein Gelenk etwas Volumen verlieren (in den Prüfbildern nicht störend aufgefallen). Finger drücken bis 1,7 mm in die Stange (gewollt als Kontakt).
- **Geräte:** Stange biegt sich nicht, Kabel ist eine gerade Linie.
- **Nicht geprüft:** das iPhone mit den neuen Videos (Gerätetest steht aus); Mixamo- und CMU-Daten selbst (nicht geladen). WebKit ist in der CI grün (Lauf 40558753879).

### 10.9 Empfehlungen für die nächsten Familien

1. **Kniebeuge** (Frontkniebeuge, Goblet, Multipresse, Hackenschmidt): Rig, Fuß-Lock und Stangenregel stehen; Varianten sind Stangenlage, Griff und Gerät.
2. **Waagrechtes Drücken** (Schrägbank, Kurzhanteln, Maschine): Bank, Griff und Unterarmregel stehen; Kurzhantelgriff ist neu (kurzer Griff, Hand neutral möglich).
3. **Senkrechtes Ziehen** (enger Griff, Untergriff, Klimmzug): Latzug und Kabel stehen.
4. **Hüftbeuge** (Kreuzheben, rumänisches Kreuzheben): neue Regel „Stange am Körper, Rücken gerade, Hüfte nach hinten“.
5. **Rumpf und Kondition** erst mit den Mixamo-Dateien oder CMU, jeweils nach Sichtprüfung.

Vorher empfehle ich zu prüfen, ob die Formziele von MakeHuman (ebenfalls CC0, auf GitHub) eine Figur mit längerem Oberarm und etwas mehr Muskulatur erlauben; das würde Kompromisse wie die schräge Stange bei der Kniebeuge kleiner machen. Je Familie eine Prüfseite wie `pruef-<übung>.webp`.

### 10.10 Was ich von dir brauche

1. Sichtung der drei neuen Schleifen in der App und der Vergleiche; danach deine Freigabe, welche Familie zuerst übertragen wird.
2. Mixamo-Dateien nur, wenn Rumpf oder Kondition dran sind (Liste in `docs/uebungen-bewegungsfamilien.md` Abschnitt 7).
3. Gerätetest am iPhone mit den neuen Videos (Schleife, offline, „Bewegung reduzieren“).
4. Merge-Freigabe für PR #53.

## 11. Brust, Varianten der Figur, Vorschaubild und Priorität (`uebungen-varianten-FORM.md`)

Nachricht des Produktinhabers vom 28.10.2026, wörtlich in `docs/prompts/uebungen-varianten-FORM.md`. Die angehängte Vorlage der Kleidung ist nicht angekommen; Farben nach dem Text, Graphit als Annahme (Abschnitt 11.3). Weiterhin nur kostenlose Werkzeuge und Daten, nichts gekauft, kein Konto angelegt. Die Videos in der App sind unverändert, bis du eine Variante wählst.

### 11.1 Brust: Ursache und Korrektur (D-413)

**Ursache:** nicht die Armbewegung, sondern meine eigene Abflachung der Brust. Für eine geschlechtsneutrale Figur hatte ich die Brustknochen des Grundmodells auf 45 % gestaucht (`Rig.brust_flach`). Gemessen im Querschnitt auf Höhe der Brustwarzen: Die Brustmuskeln lagen dadurch 20 bis 36 mm hinter der Linie des Brustbeins, in jeder Phase aller drei Übungen; am stärksten sichtbar beim Bankdrücken, weil man dort von oben auf die Brust schaut.

**Zweiter, kleinerer Grund:** die Verformung der Haut an der Schulter. Ist der Arm nach vorn gehoben (Bankdrücken oben), springt die Haut vorn an der Achsel abrupt vom Rumpf zum Oberarm; es entsteht eine Kerbe von der Achsel zum Schlüsselbein.

**Korrektur:**

1. **Echte Körperform statt Stauchung** (`tools/uebungen-3d/koerperform.py`): Formziele von MakeHuman (MPFB2, CC0) für Geschlecht, Muskeln, Gewicht, Proportionen und Brustgröße, gewichtet wie in MakeHuman. Die Formziele verschieben auch die Hilfspunkte der Gelenke; das Skelett passt sich so von selbst an.
2. **Hilfsknochen an der Achsel** (`figur.schulter_gewichte`, `Rig._schulterhilfe`): Haut, die zugleich am Oberarm und am Rumpf hängt, gibt ihren Oberarmanteil an einen eigenen Knochen ab. Er nimmt bis 110° Armhebung die halbe Drehung des Oberarms mit, bis 160° gleitend die ganze; über dem Kopf (Latziehen oben) verformt die Haut damit genau wie vorher.
3. **Übungen nach dem Körper:** Griffbreite und Fußstellung wachsen mit der Schulterbreite, Höhen beziehen sich auf Gelenke (Stange knapp unter dem Halsansatz, Brustkontakt auf 65 % der Strecke Hüfte–Halsansatz), Kniewinkel auf der Bank 100° aus den Beinlängen, Fußmitte und Zehenspitze aus dem Netz.

**Ergebnis (Messung am verformten Netz, Querschnitt im Raum des Rumpfs, alle drei Übungen, fünf Phasen):**

| Wölbung (Brustmuskeln vor + oder hinter − der Linie des Brustbeins) | Kniebeuge | Bankdrücken | Latziehen |
|---|---|---|---|
| vorher (Grundmodell, Brust gestaucht) | −36 bis −20 mm | −36 bis −21 mm | −36 bis −20 mm |
| neutral | +5,8 bis +10,3 mm | +4,8 bis +10,1 mm | +5,3 bis +10,4 mm |
| männlich | +6,1 bis +12,9 mm | +3,5 bis +12,9 mm | +5,2 bis +12,9 mm |
| weiblich | +6,7 bis +17,2 mm | +6,4 bis +17,1 mm | +6,5 bis +17,2 mm |

Kleinster und größter Wert über fünf Phasen und drei Höhen (60, 65 und 72 % der Strecke Hüftgelenke–Halsansatz), Querschnitt im Raum des Rumpfs. Dellen im Bereich der Brust (3 bis 11 cm neben der Mitte, bis 80 % Höhe) höchstens 11,5 mm: die Rinne neben dem Brustbein und der Übergang zur Schulter. Ausnahme ist die weibliche Form oben auf der Bank (Arme senkrecht) mit 27 mm über der Brust, dort, wo die Brust in die gehobene Schulter übergeht. Mit dem Achsel-Hilfsknochen sind die Dellen beim Bankdrücken oben kleiner als ohne (8 statt 14 mm bei 80 %, 17 statt 39 mm direkt unter dem Schlüsselbein); Latziehen und Kniebeuge bleiben praktisch gleich.

Nahaufnahmen vorher und nachher: `docs/screens/uebungen/brust-vorher-nachher.webp`.

**Prüfung der Bewegung mit der neuen Figur** (neutral, `render.py --pruefen`, 60 Bilder): Füße flach und fest (Kniebeuge höchstens 2,3 mm Verschiebung), Stange über der Fußmitte 0,00 cm in jedem Bild, Knie zur Zehenrichtung −1,1 bis +0,2°, Finger höchstens 1,25 mm eingedrückt bei 220 bis 326 Punkten in Kontakt, keine Meldung des Rigs. Mit dem Grundmodell ergibt der neue Code genau die alten Werte (Finger 1,71 mm, 222 Punkte). Unterschiede zur alten Figur: Knie unten 75° statt 67° (Oberschenkel kürzer, Unterschenkel länger), Bankdrücken Unterarm unten 8,7° statt 5,7° aus der Senkrechten, Latziehen Unterarm unten 18° statt 27°.

Ein Fehler auf dem Weg, gefunden durch die Prüfung: Der erste Hilfsknochen war der vorhandene Schulterknochen. Blender hält „verbundene“ Knochen an ihrem Gelenk fest; dadurch verschob sich der ganze Arm um einige Millimeter, und die Finger drangen bis 13 mm in die Stange. Der eigene Achsel-Knochen hat dieses Problem nicht und lässt Schulterknochen und Arm unberührt.

### 11.2 Körperformen (D-413)

| Form | Geschlecht | Muskeln | Gewicht | Proportionen | Brust | Größe | Oberarm |
|---|---|---|---|---|---|---|---|
| neutral (A, D) | 0,5 | 0,70 | 0,45 | 0,75 | 0,10 | 1,66 m | 24,2 cm |
| männlich (B, C) | 1,0 | 0,72 | 0,45 | 0,75 | – | 1,73 m | 25,1 cm |
| weiblich (C) | 0,0 | 0,66 | 0,42 | 0,75 | 0,40 | 1,59 m | 23,3 cm |

Werte 0 bis 1 wie in MakeHuman (0,5 = Durchschnitt). Muskeln knapp über dem Durchschnitt, Gewicht knapp darunter: sichtbar trainiert, keine Bodybuilder-Optik. Der Oberarm ist länger als beim Grundmodell (22,8 cm).

### 11.3 Varianten zur Probe (D-414)

| Variante | Figur | Kleidung | Zonen |
|---|---|---|---|
| A | neutral, grau | – | Lime auf der Haut |
| B | männlich, grau | – | Lime auf der Haut |
| C männlich, weiblich | realistisch: Haut, Haare, Augen, Augenbrauen | FORM | je mit Zonen auf dem Stoff (und auf der Haut darunter) und ohne |
| D | neutral, grau | FORM | mit Zonen auf dem Stoff und ohne |

**FORM-Kleidung** (`kleidung.py`): STEP Running Tee in Nacht #0C1219, STEP Shorts in Graphit. Graphit ist eine Annahme, weil die Vorlage nicht ankam: Mit #3C424E (dem Grau von Kacheln und Geräten, `--form-tile-border`) verschwammen Shorts und Bank, deshalb #575D67. Lime-Details klein: Zeichen 3,0 × 1,4 cm auf der linken Brust und 2,4 × 1,2 cm außen am linken Bein, 5 mm breite Paspeln an Ärmel- und Beinsaum; in den Bildern nicht mit Muskelzonen zu verwechseln. Die Teile entstehen aus dem Netz der Figur, liegen eng an und folgen jeder Haltung ohne Stoffsimulation; Säume und Ausschnitt sind scharf. Mit Zonen ist der Stoff über dem Muskel Lime (Hauptmuskeln) oder Lime mit halber Deckkraft (mitarbeitend), auf der freien Haut geht die Zone weiter.

**Realistisch** (`realistisch.py`): Augen von MakeHuman (CC0), Haut als eigener Shader, Augenbrauen aufgemalt, Haare aus Blender (männlich kurzes Partikelhaar, weiblich anliegend mit Dutt). Die Haut-, Haar- und Brauen-Dateien von MakeHuman wären ebenfalls frei (CC0), liegen aber auf `files2.makehumancommunity.org`, das hier gesperrt ist; aus der Nähe wären Haut und Haare damit detailreicher.

**Vergleichsbilder** (720 × 540 je Variante, 40 Samples, Kamera wie in der App): `docs/screens/uebungen/varianten-kniebeuge-unten.webp`, `varianten-bank-oben.webp`, `varianten-bank-unten.webp`, Übersicht `varianten-uebersicht.webp`.

**Renderzeit und Dateigröße je Variante** (Kniebeuge unten, ein Prozess, nacheinander, 4 CPU-Kerne):

| Variante | Renderzeit je Bild | 60 Bilder (eine Schleife), gerechnet | Faktor zu A | Standbild als Poster (WebP) |
|---|---|---|---|---|
| A neutral, grau, Zonen | 13,0 s | 13,1 min | 1,00 | 5,1 KB |
| B männlich, grau, Zonen | 13,7 s | 13,7 min | 1,05 | 5,2 KB |
| D grau, Kleidung, Zonen | 14,1 s | 14,2 min | 1,08 | 5,4 KB |
| D grau, Kleidung | 13,6 s | 13,7 min | 1,05 | 4,9 KB |
| C männlich, real, Zonen | 20,0 s | 20,1 min | 1,54 | 6,0 KB |
| C männlich, real | 19,9 s | 19,9 min | 1,53 | 5,7 KB |
| C weiblich, real, Zonen | 16,1 s | 16,2 min | 1,24 | 6,3 KB |
| C weiblich, real | 16,6 s | 16,7 min | 1,28 | 6,0 KB |

Standbild im Poster-Format 720 × 540 als WebP (Qualität 80), wie die App es lädt. C mit Partikelhaar (männlich) braucht am längsten; die weibliche Haarfläche mit feinen Härchen ist günstiger. Kleidung kostet kaum Zeit.

**Bewertung:**

| Variante | Stärken | Schwächen |
|---|---|---|
| A neutral, grau | Zonen am klarsten (Lime auf Grau), ruhig, für jeden passend; am schnellsten gerendert | wirkt wie eine unbekleidete Gliederpuppe; eine kleine Brustform bleibt sichtbar |
| B männlich, grau | wie A, breitere Schultern, kräftigere Arme; passt, wenn die Figur dir ähneln soll | weniger neutral; sonst kaum Unterschied zu A |
| C realistisch | wirkt am lebendigsten, Kleidung und Gesicht machen die Übung greifbar | Haare und Haut aus der Nähe puppenhaft (eigene Haare, keine MakeHuman-Assets); Zonen auf der Haut wirken wie Farbe; rund 1,2- bis 1,5-fach längere Renderzeit (männlich mit Partikelhaar am langsamsten); Gesicht, Haare und Hautton ziehen den Blick, die Zone tritt zurück (Leitplanke 9: Bilder nur, wo sie erklären) |
| D grau in FORM-Kleidung | Marke sichtbar (Shirt, Shorts, kleines Zeichen), die Figur wirkt bekleidet und natürlicher als A; Zonen auf dem Stoff sehr deutlich (Lime auf Nacht); kaum langsamer als A | Shirt in Nacht auf dem Hintergrund Nacht: der Oberkörper hebt sich nur durch Licht ab; ohne Zonen zeigt D nicht, welcher Muskel arbeitet |

### 11.4 Zwei Varianten als Kniebeuge animiert (D-414)

**Gewählt: A und D mit Zonen.**

1. Beide bleiben beim bisherigen FORM-Stil (graue Figur, Lime als einziges Signal, D-402) und zeigen die arbeitenden Muskeln am deutlichsten: Lime auf Grau bei A, Lime auf dem dunklen Stoff bei D.
2. Zusammen beantworten sie die eigentliche Frage, unbekleidet oder in FORM-Kleidung, mit derselben Figur, denselben Zonen und derselben Bewegung.
3. Beide sind schnell gerendert (13 und 14 s je Bild) und bleiben klein.

Nicht animiert: B unterscheidet sich von A nur im Körperbau, das zeigen die Standbilder. C wirkt mit den eigenen Haaren und der eigenen Haut aus der Nähe puppenhaft, Gesicht und Haare ziehen den Blick von der Zone, und die Renderzeit steigt um das 1,2- bis 1,5-Fache.

| Variante | Renderzeit der Schleife (60 Bilder) | je Bild | MP4 | WebM | Poster | Vorschau | Abruf in der App (ein Video, Poster, Vorschau) |
|---|---|---|---|---|---|---|---|
| A neutral, grau, Zonen | 841 s (14,0 min; mit Aufbau und Kodieren 861 s) | 14,0 s | 51,8 KB | 39,3 KB | 5,1 KB | 3,2 KB | 47,6 KB bis 60,1 KB |
| D grau, FORM-Kleidung, Zonen | 897 s (14,9 min; mit Aufbau und Kodieren 917 s) | 14,9 s | 55,6 KB | 41,6 KB | 5,4 KB | 3,3 KB | 50,3 KB bis 64,3 KB |

720 × 540, 40 Samples, 24 Bilder je Sekunde, 2,5 s Schleife; ein Prozess auf vier CPU-Kernen, nacheinander. Zum Vergleich die bisherige Kniebeuge in der App: MP4 54,1 KB, WebM 39,9 KB (KB zu 1024 Byte wie in Abschnitt 10.4).

Aufnahmen: `docs/screens/uebungen/variante-A-kniebeuge.mp4` und `.webm`, `variante-D-z-kniebeuge.mp4` und `.webm`, beide nebeneinander (zwei Schleifen) `varianten-kniebeuge.mp4`. In der App laufen weiter die bisherigen Videos, bis du wählst.

**Beobachtung:** Beide Schleifen laufen ruhig, Stange und Füße wie bisher. Bei D folgt der Stoff jeder Haltung, ohne dass Haut durchsticht; Säume und das kleine Zeichen bleiben an ihrem Platz, und die Zone geht ohne Kante von den Shorts auf den Oberschenkel über. Die Kleidung kostet rund 7 % Renderzeit (897 statt 841 s) und 6 bis 7 % Dateigröße. Je Bild brauchen die Schleifen im Schnitt 14,0 und 14,9 s, etwas mehr als die Standbilder unten (13,0 und 14,1 s), weil stehende Bilder etwas länger dauern als die tiefe Position.

### 11.5 Lizenzen

Alles in `licenses-data.md` Abschnitt 8: Formziele (MPFB2) und Augen (MakeHuman) CC0 1.0, Renderings frei; Haut, Augenbrauen, Haare und Kleidung eigene Arbeit. Fremde Dateien liegen nicht im Repository, `render.py --hole` lädt sie über `raw.githubusercontent.com` (keine neue Adresse nötig). Nur für die MakeHuman-Haut und -Haare bräuchte es `files2.makehumancommunity.org` (Spiegel `files.makehumancommunity.org`).

### 11.6 Vorschaubild (D-415)

Eigenes Standbild statt Ausschnitt aus dem Poster: Kamera wie die Schleife, Ausschnitt nur um den Körper (5 % Rand), gerendert mit 480 × 480 und auf 240 × 240 verkleinert. Position je Übung, in der sie klein am besten zu erkennen ist: Kniebeuge tiefste Position, Bankdrücken Ausgangsposition (gestreckte Arme mit der Stange; unten verdeckt die Stange das Gesicht), Latziehen Ausgangsposition (Arme über dem Kopf an der breiten Stange). Vergleich alt und neu: `docs/screens/uebungen/vorschau-vergleich.webp`. In die App kommt das neue Vorschaubild mit dem Neurendern nach deiner Wahl.

### 11.7 Priorität und Aufwand (D-416)

Gezählt in den drei Programmen (Einheiten im Verlauf) und vier Vorlagen (Tage): 79 Übungen kommen vor, 68 davon in Programmen. Übersicht mit allen Zahlen: `docs/uebungen-bewegungsfamilien.md` Abschnitt 8.

| Rang | Familie | Einheiten in Programmen | Übungen in Programmen | Aufwand (Std.) |
|---|---|---|---|---|
| 1 | Kniebeuge | 40 | 4 | rund 18 |
| 2 | Rumpf | 68 | 11 | rund 25 |
| 3 | Waagrechtes Drücken | 66 | 7 | rund 23 |
| 4 | Arme beugen und strecken | 57 | 14 | 20 |
| 5 | Beine isoliert | 54 | 6 | 20 |
| 6 | Schulter und Brust isoliert | 48 | 7 | 17 |
| 7 | Hüftbeuge | 44 | 4 | 14 |
| 8 | Waagrechtes Ziehen | 40 | 5 | 19 |
| 9 | Kondition | 39 | 1 | 16 |
| 10 | Senkrechtes Ziehen | 35 | 5 | 18 |
| 11 | Senkrechtes Drücken | 26 | 3 | 12 |
| 12 | Ausfallschritt und einbeinig | 9 | 1 | 9 |

- **Kniebeuge, rund 18 Std.:** Kniebeuge mit Langhantel (Pilot, steht), Goblet Squat, Beinpresse, Beinpresse einbeinig; neu sind Kurzhanteln und die Beinpresse (4 Std., Schlitten auf Schienen). Basis der Familie 8 Std., Prüfseite 1 Std.
- **Rumpf, rund 25 Std.:** elf Übungen (Unterarmstütz, Crunches, Beinheben hängend und liegend, Russian Twist, Dead Bug, Bicycle Crunches, Heel Taps, Sit-ups, Windshield Wipers, Knieheben stehend); Matte und Klimmzugstange. Teuer, weil die Familie fünf Untermuster hat und Körper und Matte sich berühren. Unterarmstütz, Bicycle Crunches und Sit-ups sind mit Mixamo geplant (Dateien von dir, einmalig 4 Std. Übertragung); ohne Mixamo baue ich sie aus der Familie im Code.
- **Waagrechtes Drücken, rund 23 Std.:** sieben Übungen (Bankdrücken mit Langhantel steht, mit Kurzhanteln, Schrägbank mit Kurzhanteln, Liegestütze, Schrägbank am Kabel, enges Bankdrücken, Dips); neu sind Schrägbank, Kabelzug mit D-Griff und Dipbarren. Liegestütze sind mit Mixamo geplant, sonst aus der Familie im Code.

Dazu die Rechenzeit: je Übung 60 Bilder Schleife plus Prüfung, je nach Variante (Abschnitt 11.3).

### 11.8 Tests

- **Prüfung der Bewegung** mit der neuen Figur (neutral) über alle 60 Bilder je Übung: ohne Meldung, Werte in Abschnitt 11.1 und `docs/testing.md`.
- **Brustmessung** am verformten Netz für drei Formen, drei Übungen, fünf Phasen, alter Stand mit demselben Verfahren nachgemessen.
- **Gegenprobe:** Mit dem Grundmodell liefert der neue Code genau die alten Werte (Finger 1,71 mm, 222 Punkte).
- **Fehler auf dem Weg, alle vor den Vergleichsbildern behoben und im Testprotokoll:** verschobener Arm durch einen verbundenen Hilfsknochen, doppelte Gewichte in der Kleidung (zerrissener Stoff), Shirt über Händen und Gesicht, Haare 4 m lang; dazu doppelt kopierte Zonenwerte in der Kleidung (ohne Wirkung aufs Bild, aufgeräumt).
- **Dokumente:** `pnpm check:docs` und `python3 tools/uebungen_familien.py --check` je Paket am Stand des Commits.
- **App** (Code der App in allen vier Paketen unverändert; Stand `0806790` mit den Dokumenten von D-416): `pnpm format:check`, `lint`, `typecheck` und `check:docs` bestanden; `pnpm test:coverage` 1.209 Tests in 135 Dateien bestanden; `pnpm build` und `pnpm check:bundle`: Startansicht 237,8 KB von 250 KB, Dateien der Übungsbilder 12 von 12. `pnpm test:e2e` (Chromium): 431 bestanden, 132 übersprungen, 1 fehlgeschlagen: `start-surface.spec.ts:484` (Startfläche am Duo, D-394), „Bilder ohne Logo davor“, das erste mitgeschnittene Bild zeigte schon das Logo. Einzeln 20-mal wiederholt (beide Fälle des Tests): 20 bestanden.
- **WebKit** läuft in der CI.

### 11.9 Was ich von dir brauche

1. Deine Wahl der Variante (A, B, C männlich oder weiblich, D; bei C und D mit oder ohne Zonen). Danach rendere ich die drei Pilot-Übungen neu, mit dem neuen Vorschaubild.
2. Falls C: ob ich `files2.makehumancommunity.org` nutzen darf (dann trägst du die Adresse unter „Network access“ ein), oder ob die eigenen Haare und die eigene Haut reichen.
3. Falls D oder C: die Vorlage der Kleidung noch einmal (sie kam nicht an), vor allem Graphit und die Lime-Details.
4. Nach dem Neurendern dein Gerätetest; danach gibst du den Merge von PR #53 frei.

### 11.10 Berichte je Paket

```
Arbeitspaket: D-413 Brust natürlich gewölbt, Körperform aus MakeHuman-Formzielen
Umgesetzte Funktionen: Werkzeug für TP-06, TP-07, TS-02 (Videos der App unverändert), erfüllte AK: –
Geänderte Dateien: tools/uebungen-3d/koerperform.py (neu), figur.py, rig.py, uebungen.py, render.py; Dokumente
Technische Entscheidungen: D-413
Ausgeführte Tests: render.py --pruefen (3 Übungen, neutral), Brustmessung (3 Formen × 3 Übungen × 5 Phasen), Gegenprobe Grundmodell, pnpm check:docs
Ergebnis: bestanden; Brustmuskeln +3,5 bis +17 mm vor dem Brustbein, Prüfung ohne Meldung
Bekannte Einschränkungen: weibliche Form oben auf der Bank 27 mm Delle über der Brust
Nächste Schritte: Wahl der Variante, dann Neurendern der drei Pilot-Übungen
```

```
Arbeitspaket: D-414 Varianten der Figur zur Probe, zwei als Kniebeuge animiert
Umgesetzte Funktionen: Werkzeug, erfüllte AK: –
Geänderte Dateien: tools/uebungen-3d/varianten.py, kleidung.py, realistisch.py, varianten_bilder.py (neu), figur.py, render.py; tools/uebungen_varianten_bild.py (neu); docs/screens/uebungen/varianten-*, variante-*; Dokumente
Technische Entscheidungen: D-414
Ausgeführte Tests: 24 Standbilder, Renderzeit je Variante (ein Prozess), zwei Schleifen mit Sichtprüfung, pnpm check:docs
Ergebnis: bestanden; vier Fehler beim Aufbau gefunden und behoben (Testprotokoll)
Bekannte Einschränkungen: Vorlage der Kleidung fehlt (Graphit angenommen); eigene Haare und Haut aus der Nähe einfach; Shirt in Nacht auf Hintergrund Nacht
Nächste Schritte: Wahl der Variante
```

```
Arbeitspaket: D-415 Vorschaubild eng auf die Figur
Umgesetzte Funktionen: Werkzeug für die Vorschau der Übungsbilder, erfüllte AK: –
Geänderte Dateien: tools/uebungen-3d/render.py, uebungen.py; docs/screens/uebungen/vorschau-vergleich.webp; Dokumente
Technische Entscheidungen: D-415
Ausgeführte Tests: render.py --nur-vorschau für 3 Übungen, Sichtprüfung in 240 und 96 px, pnpm check:docs
Ergebnis: bestanden
Bekannte Einschränkungen: in der App erst mit dem Neurendern
Nächste Schritte: mit den drei Pilot-Übungen neu erzeugen
```

```
Arbeitspaket: D-416 Priorität der Familien nach Programmen und Vorlagen
Umgesetzte Funktionen: Planung, erfüllte AK: –
Geänderte Dateien: tools/uebungen_familien.py, docs/uebungen-bewegungsfamilien.md; Dokumente
Technische Entscheidungen: D-416
Ausgeführte Tests: python3 tools/uebungen_familien.py --check, pnpm check:docs; pnpm format:check, lint, typecheck, test:coverage (1.209 bestanden), build, check:bundle (237,8 KB von 250 KB), test:e2e Chromium (431 bestanden, 1 im vollen Lauf rot, einzeln 20-mal bestanden); WebKit in der CI
Ergebnis: Dokumente bestanden; App-Prüfungen wie in Abschnitt 11.8 (ein E2E-Test im vollen Lauf einmal rot, einzeln 20-mal bestanden)
Bekannte Einschränkungen: Aufwand ist Schätzung ohne Rechenzeit
Nächste Schritte: Familien nach dem Merge von PR #53 auf eigenen Branches, zuerst die Kniebeuge
```
