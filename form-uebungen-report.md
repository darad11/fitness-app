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

## 12. Entscheidung D, Feinschliff und C mit MakeHuman-Dateien (zweite Nachricht vom 28.10.2026)

Deine Entscheidung: D mit Zonen; A und B nicht weiter. Die Nachricht steht wörtlich in `docs/prompts/uebungen-varianten-FORM.md` (zweiter Teil). Die angehängte Vorlage der Kleidung ist auch diesmal nicht angekommen; Farben und Logos nach deinem Text. Die Videos der App sind unverändert, bis du die Fassung wählst.

### 12.1 Farben (D-417)

Tee Nacht #0C1219, Shorts Graphit #4A4F57 (`kleidung.GRAPHIT`; vorher #575D67 als Annahme). Graphit liegt nahe am Grau der Bank (#3C424E); mit dem Kantenlicht (12.4) hebt sich beides ab.

### 12.2 Rundhals (D-417)

Ursache des Rollkragens: Der Ausschnitt war ein senkrechter Zylinder von 7,2 × 6,6 cm um das Halsgelenk. Der Hals sitzt aber 3 bis 8 cm vor dem Gelenk (die Kehle bei y ≈ −8 cm, die Zylindervorderkante bei −6,7 cm), darum blieb vorn Stoff stehen. Jetzt wird der Ausschnitt aus dem Netz bestimmt: Mitte und Maße der Halshaut am Halsansatz plus 8 mm Rand, dazu eine Kugel mit 7,5 cm Radius am Halsansatz für den runden Ausschnitt vorn (rund 5 cm unter der Kehle; hinten am Ansatz). Der Schnitt hängt an den Eckpunkten der Ruhehaltung, darum bleibt der Hals in jeder Haltung frei: 15 Nahaufnahmen (drei Übungen × fünf Phasen) in `docs/screens/uebungen/feinschliff-hals.webp`.

### 12.3 Logos (D-417)

Das echte FORM-F aus `public/brand/symbol-f-gruen.svg`, aus den zwei Pfaden gerastert (1024 px) und als Bild auf den Stoff gelegt: Abwicklung um die Körperachse (Bogenlänge quer, Lage längs), so liegt es scharf wie ein Aufdruck und bewegt sich mit dem Stoff. Lage und Höhe:

| Logo | Lage | Höhe des F | bisher |
|---|---|---|---|
| Brust | links, 24° neben der Mitte, 79 % der Rumpfhöhe | 5,5 cm | Zeichen 1,4 cm |
| Rücken | zwischen den Schulterblättern, Mitte, 80 % | 10 cm | – |
| Shorts | außen am linken Bein, 2 cm über dem Saum | 4,5 cm | Zeichen 1,2 cm |

Zwei Fassungen: **F in Lime** (`D-z`) und **F hell Ton in Ton** (`D-z-hell`, #AAB2BE aus den Tokens, dieselbe Farbfamilie wie Nacht und Graphit). Damit kein Logo mit einer Zone zu verwechseln ist, ist ein Lime-F in einer Lime-Zone in der Stoffarbe ausgespart (Brust beim Bankdrücken, Rücken beim Latziehen): Es bleibt als F lesbar, statt zu verschwinden oder als Rest stehen zu bleiben. Nahaufnahmen aller drei Logos in beiden Farben und die Standbilder in der Breite des Players (390 px): `docs/screens/uebungen/logos-nah.webp`. Die Paspeln an den Säumen bleiben 5 mm Lime.

### 12.4 Kantenlicht (D-417)

Zwei schmale Flächenlichter hinter der Figur (je 30° neben der Gegenrichtung der Kamera, 3,2 m hoch, 280 und 200 W) statt des schwachen Gegenlichts (90 W). Sie geben Figur, Kleidung und Geräten eine dünne helle Kante. Vergleich in vier Stufen (ohne, 200/140, 280/200, 420/300 W): `docs/screens/uebungen/feinschliff-kantenlicht.webp`; 200/140 hob die Silhouette kaum, 420/300 machte Arme und Schultern zu hell. In den Vergleichsbildern steht die Fassung „ohne Kantenlicht (bisher)“ neben der neuen, dazu die Alternative „Tee in Graphit“.

### 12.5 Variante C mit den Dateien von MakeHuman (D-418)

`*.makehumancommunity.org` ist frei; `render.py --hole` lädt das Paket `makehuman_system_assets_cc0.zip` (267 MB) und packt nur die genutzten Teile aus: Haut `young_caucasian_male` und `_female` (Bild 2048 × 2048 auf der Abwicklung von `base.obj`), Augen `high-poly` mit `brown_eye.png`, Brauen `eyebrow001` und `eyebrow005`, Wimpern `eyelashes01` und `eyelashes02`, Haare `short02` (männlich) und `bob02` (weiblich; ein Pferdeschwanz läge beim Bankdrücken auf der Bank). Alle Teile sind Proxys wie die Augen (drei Körperpunkte plus Versatz) und hängen am Kopf. Die Haarbilder sind blond mit starkem Glanz; ich habe sie dunkelbraun eingefärbt und den Glanz gesenkt. Lizenz: CC0 1.0, jede Datei trägt den Vermerk im Kopf; Wortlaut in `docs/licenses-data.md` Abschnitt 8. C trägt dieselbe Kleidung wie D (F in Lime, Kantenlicht), je mit Zonen und ohne.

Aus der Nähe wirken die Augen des Mannes schmal; das liegt an Augen und Lidern aus den MakeHuman-Dateien, nicht an den Wimpern (mit und ohne gleich). In der Größe der App ist das nicht zu sehen.

### 12.6 Vergleichsbilder

Je Moment ein Bild mit acht Kacheln im selben Ausschnitt, 720 × 540 je Kachel, 40 Proben, Kamera wie in der App: `docs/screens/uebungen/feinschliff-kniebeuge-unten.webp`, `feinschliff-bank-oben.webp`, `feinschliff-bank-unten.webp`, Übersicht `feinschliff-uebersicht.webp`. Reihe 1: D mit Zonen, F in Lime, Kantenlicht · F hell Ton in Ton · F in Lime ohne Kantenlicht (bisher) · Tee in Graphit. Reihe 2: C männlich und weiblich, je mit Zonen und ohne.

**Renderzeit je Bild** (720 × 540, 40 Proben, ein Prozess nacheinander auf vier CPU-Kernen; Aufbau einmal je Fassung und Übung):

| Fassung | Aufbau | Kniebeuge unten | Bankdrücken oben | Bankdrücken unten | je Bild im Schnitt |
|---|---|---|---|---|---|
| D · Zonen, F in Lime, Kantenlicht | 5,6 s | 16,7 s | 23,6 s | 23,4 s | 21,2 s |
| D · Zonen, F hell Ton in Ton | 5,6 s | 15,7 s | 23,2 s | 22,7 s | 20,5 s |
| D · Zonen, F in Lime, ohne Kantenlicht (bisher) | 5,6 s | 16,4 s | 21,8 s | 20,9 s | 19,7 s |
| D · Zonen, Tee in Graphit | 6,2 s | 16,4 s | 22,5 s | 21,8 s | 20,2 s |
| C · männlich, MakeHuman, Zonen | 4,0 s | 18,0 s | 23,3 s | 24,5 s | 21,9 s |
| C · männlich, MakeHuman | 4,0 s | 17,1 s | 23,3 s | 24,0 s | 21,5 s |
| C · weiblich, MakeHuman, Zonen | 4,7 s | 17,7 s | 23,6 s | 24,3 s | 21,9 s |
| C · weiblich, MakeHuman | 4,3 s | 17,2 s | 22,0 s | 22,4 s | 20,5 s |

Zum Vergleich D-414: A 13,0 s, D mit Zonen 14,1 s je Bild (ohne Kantenlicht, kleine Zeichen statt Logos). Das Kantenlicht kostet rund 7,8 % Zeit, Haut und Haarsträhnen von MakeHuman rund 3 % mehr als D (Bankdrücken liegt bei allen über der Kniebeuge, weil Bank und Scheiben mehr Fläche füllen). Dateigrößen der Vergleichsbilder: `feinschliff-kniebeuge-unten.webp` 81,2 KB, `feinschliff-bank-oben.webp` 80,5 KB, `feinschliff-bank-unten.webp` 83,2 KB, `feinschliff-uebersicht.webp` 95,2 KB, `logos-nah.webp` 81,5 KB.

**Beobachtung in den Vergleichsbildern:**

- **Kantenlicht:** Ohne (bisher) verschwimmt der Oberkörper in Nacht mit dem Hintergrund, nur die grauen Arme zeichnen die Figur; mit Kantenlicht haben Schultern, Rücken, Stange und Scheiben eine schmale helle Kante, die Silhouette ist in allen drei Momenten klar, ohne dass die Zonen heller würden. Das Tee in Graphit hebt sich auch ohne Kante ab, nimmt der Kleidung aber den Kontrast von Nacht zu Graphit aus der Vorlage.
- **F in Lime:** aus der Nähe klar als FORM-F; in der Größe der App ein kleines Lime-Zeichen auf der Brust (in der Kniebeuge nicht von einer kleinen Zone zu unterscheiden). Beim Bankdrücken liegt es in der Lime-Zone und erscheint ausgespart als dunkles F; auf dem Hosenbein liegt es in der Oberschenkelzone und ist dort in der Kniebeuge ebenfalls ausgespart. Das Rücken-F (10 cm) ist in den drei Momenten nicht im Bild (Kamera von vorn-seitlich), nur beim Latziehen.
- **F hell Ton in Ton:** aus der Nähe ebenso klar, ruhiger; in der Größe der App ein feines helles Zeichen, das nie mit einer Zone zu verwechseln ist, auch nicht in der Lime-Zone beim Bankdrücken (helles F auf Lime).
- **Lesbarkeit im Player:** In 390 px Breite ist das Brust-F 7 bis 8 px hoch, als Buchstabe gerade noch erkennbar, als Marke eindeutig erst beim Rücken-F. Größer als 5,5 cm würde es auf der Brust wie ein Aufdruck eines Sportvereins wirken; ich lasse es so und nenne es als Stellschraube (`kleidung.LOGOS`).
- **C mit MakeHuman-Dateien:** Haut, Haare, Brauen und Augen wirken jetzt natürlich, auch beim Liegen auf der Bank (kurze Haare, kein Durchstoßen); in der Größe der App ist der Unterschied zur eigenen Haut aus D-414 deutlich, der zur grauen Figur ebenfalls: Gesicht, Hautton und Haare ziehen den Blick, die Zonen treten etwas zurück. Renderzeit nur rund 3 % über D.

### 12.7 Empfehlung

**D mit Zonen, Tee in Nacht, F hell Ton in Ton, mit Kantenlicht.** Gründe: Das helle F ist nie mit einer Zone zu verwechseln, bleibt beim Bankdrücken in der Lime-Zone lesbar, und Lime bleibt das einzige Signal für arbeitende Muskeln (D-402). Das Kantenlicht löst den Kontrast, ohne die Farben der Vorlage zu ändern; Graphit nur als Rückfall, falls dir die Kante am Gerät nicht reicht. Das F in Lime ist markentypischer, wirkt in der Größe der App aber wie ein kleines Lime-Zeichen auf der Brust. C ist mit den MakeHuman-Dateien eine faire Alternative geworden (natürlich, kaum langsamer); gegen C spricht, dass Gesicht, Haut und Haare vom Muskel ablenken und die Figur eine bestimmte Person zeigt, wo die graue Figur neutral bleibt. Falls du C willst: männlich mit Zonen.

### 12.8 Tests

- **Hals:** vermessen in der Ruhehaltung (Kehle 8 cm vor dem Gelenk), Nahaufnahmen von vorn, seitlich, hinten und aus der Kamera der App, dann 15 Phasen aller drei Übungen; in jedem Bild frei.
- **F:** Rasterung gegen eine Pillow-Rasterung derselben Pfade geprüft (Abweichung nur an Rändern); Ausrichtung in Nahaufnahmen geprüft, zwei Fehler gefunden und behoben (Rücken spiegelverkehrt, Bein auf dem Kopf); Lime-F in Lime-Zonen beim Latziehen und Bankdrücken geprüft.
- **Kantenlicht:** vier Stärken an der Kniebeuge unten verglichen.
- **MakeHuman:** Paket geladen (298.739.872 Byte, 517 Dateien), Lizenzvermerk in jeder genutzten Datei; Haare und Augen in Nahaufnahmen geprüft, Haare eingefärbt.
- **Dokumente:** `pnpm check:docs` je Paket am Stand des Commits; `python3 -m py_compile` aller Werkzeuge.
- **App:** Code und Videos unverändert; die CI (Lint, Typen, Unit, Dokumente, Build, Datenbank, E2E Chromium und WebKit) läuft auf jedem Commit, Ergebnis im Testprotokoll. CI zum vorigen Stand `890dd80` (Lauf 40652262738) in allen Jobs grün, auch WebKit; die Läufe zu D-417 und D-418 stehen im Testprotokoll und in PR #53.
- Alles wörtlich in `docs/testing.md`, Abschnitt „Feinschliff D und C mit MakeHuman-Dateien“.

### 12.9 Was ich von dir brauche

1. Deine Wahl: F in Lime oder hell Ton in Ton; Kantenlicht ja oder nein (sonst Tee in Graphit); oder doch C (männlich oder weiblich, mit Zonen oder ohne). Danach rendere ich die drei Pilot-Übungen neu, mit dem neuen Vorschaubild, und baue sie ein.
2. Falls die Vorlage der Kleidung Details zeigt, die vom Text abweichen (Schnitt des Ausschnitts, Lage der Logos, Paspeln): die Datei noch einmal, zum Beispiel als Bild im Repository.
3. Nach dem Neurendern dein Gerätetest; danach gibst du den Merge von PR #53 frei.

### 12.10 Berichte je Paket

```
Arbeitspaket: D-417 Feinschliff D: Farben nach Vorlage, Rundhals, FORM-F als Aufdruck, Kantenlicht
Umgesetzte Funktionen: Werkzeug für TP-06, TP-07, TS-02 (Videos der App unverändert), erfüllte AK: –
Geänderte Dateien: tools/uebungen-3d/kleidung.py, szene.py, render.py, varianten.py, nahaufnahme.py (neu); tools/uebungen_varianten_bild.py; docs/screens/uebungen/feinschliff-hals.webp, feinschliff-kantenlicht.webp, logos-nah.webp; Dokumente
Technische Entscheidungen: D-417
Ausgeführte Tests: Halsmessung, Nahaufnahmen Hals (4 Richtungen, 15 Phasen), Rasterung des F, Ausrichtung der Logos, Lime-F in Zonen, Kantenlicht in vier Stärken, pnpm check:docs
Ergebnis: bestanden; zwei Fehler bei der Ausrichtung der Logos gefunden und behoben
Bekannte Einschränkungen: Vorlage der Kleidung fehlt weiterhin (Farben und Logos nach dem Text); Lime-F in einer Lime-Zone in der Stoffarbe
Nächste Schritte: Wahl der Fassung durch den Produktinhaber
```

```
Arbeitspaket: D-418 Variante C mit Haut, Augen, Brauen, Wimpern und Haaren von MakeHuman
Umgesetzte Funktionen: Werkzeug, erfüllte AK: –
Geänderte Dateien: tools/uebungen-3d/realistisch.py, figur.py, varianten.py; docs/screens/uebungen/feinschliff-kniebeuge-unten.webp, feinschliff-bank-oben.webp, feinschliff-bank-unten.webp, feinschliff-uebersicht.webp; docs/licenses-data.md; Dokumente
Technische Entscheidungen: D-418
Ausgeführte Tests: Paket geladen und Lizenz je Datei geprüft, Nahaufnahmen Kopf (Haare, Augen mit und ohne Wimpern), 24 Standbilder mit Renderzeit, pnpm check:docs
Ergebnis: bestanden
Bekannte Einschränkungen: Augen des Mannes aus der Nähe schmal (MakeHuman-Dateien); Haarbilder eingefärbt
Nächste Schritte: Wahl der Fassung durch den Produktinhaber
```

## 13. Korrekturrunde Logos, Zonen und Vergleichspaket (`uebungen-korrektur-logos-FORM.md`)

Dein Auftrag ersetzt die vorige Korrekturrunde; er steht in `docs/prompts/uebungen-korrektur-logos-FORM.md`. Gezielte Korrekturen, kein Neustart: Modelle, Bewegung, Hals, Kantenlicht (280/200 W), Tee in Nacht und Kamera bleiben wie in D-417 und D-418. Zuerst nur das Vergleichspaket (Abschnitt 9); die Videos und Bilder der App bleiben unverändert, bis du freigibst.

### 13.1 Kleidung nach deinem Text (D-419)

- **Tee:** Nacht #0C1219, Rundhals, kleines F vorn links, F zwischen den Schulterblättern, schmale Lime-Einfassung an den Seitenschlitzen am Saum (Schlitz 5 cm, Einfassung 3,5 mm, beidseitig).
- **Shorts:** Graphit #4A4F57, Kordelenden in Lime vorn am Bund (zwei Bänder 3 mm, 6 cm lang, dickeres Ende), F außen am linken Bein.
- Die Paspeln an Ärmeln und Beinen aus D-414 entfallen, weil dein Text sie nicht nennt.
- Beide Details liegen als Bilder auf dem Stoff, wie die Logos: Das Netz der Figur hat Punkte 5 bis 8 mm auseinander, ein 3 mm schmales Band lässt sich als Feld je Punkt nicht darstellen (erster Versuch unsichtbar). Der Schlitz schneidet den Stoff über die Deckkraft.
- Die Kordelenden liegen in allen drei Übungen unter dem Saum des Tees, das bis über die Hüftgelenke reicht; von außen sind sie nicht zu sehen. Das Tee kürzer zu machen hieße, die Kleidung aus D-417 zu ändern; ich habe es gelassen.

### 13.2 Logos (D-419)

- **Originalproportionen:** Jedes F wird jetzt eben auf den Stoff projiziert (Bildebene senkrecht zur mittleren Oberfläche am Logo, Hochachse längs des Körperteils). Die Abwicklung um die Körperachse aus D-417 zog das Rücken-F am flacheren Rücken in die Breite. Eine Maske sorgt dafür, dass das Bild nur auf den Flächen liegt, die zur Bildebene zeigen (kein Spiegelbild auf der Gegenseite).
- **Eine Konfiguration** (`kleidung.LOGOS`) für alle Übungen und Körper, links und rechts aus Sicht des Trägers:

| Logo | Lage | Höhe des F |
|---|---|---|
| Brust | links (Herzseite), 7 cm neben der Mitte, 8,5 cm unter dem Schultergelenk | 4 cm (dazu 3,5 und 4,5 cm im Vergleich) |
| Rücken | mittig zwischen den Schulterblättern, 8 cm unter dem Schultergelenk | 8 cm |
| Shorts | außen am linken Bein, 30 % der Strecke Hüfte–Knie, 2,7 cm über dem Saum | 3,5 cm |

- Bei C männlich sitzt das Brust-F damit näher an der Mitte als in D-417: Dort lag es bei einem festen Winkel, der am breiteren Rumpf weiter außen landete; jetzt bei einem festen Abstand von 7 cm.
- **Rand in Stoffarbe:** Jedes F hat einen schmalen Rand in der Farbe des Stoffs (3,6 % seiner Höhe: 1,4 mm auf der Brust, 2,9 mm am Rücken, 1,3 mm an den Shorts) und liegt immer über den Zonen; der Ausschnitt in Lime-Zonen aus D-417 ist weg. So bleibt das F auf einer Lime-Zone als Aufdruck lesbar und verschmilzt nie mit ihr (geprüft: helles F auf der Brustzone beim Bankdrücken, Lime-F auf der gedämpften Rückenzone beim Latziehen, Lime-F auf der Oberschenkelzone in der Kniebeuge).
- Geprüft aus mehreren Perspektiven an allen drei Körpern (von vorn, aus der Kamera der App, von hinten, von der Seite); Nahaufnahmen in `paket-2-brustlogo-nah.webp`, `paket-3-ruecken.webp`, `paket-4-shorts-nah.webp`.

### 13.3 Fassungen A1, A2 und B (D-419)

| Fassung | Zonen | Logos |
|---|---|---|
| A1 | Lime wie in der Muskelkarte | alle hell Ton in Ton (#AAB2BE) |
| A2 | gedämpft: Hauptmuskeln halb Lime, mitarbeitende ein Viertel (Stoff, Körper und Haut gleich) | Kollektion: vorn hell, hinten und am Bein Lime |
| B | keine, weder auf der Kleidung noch auf der Haut | Kollektion |

Für alle drei Körper (D, C männlich, C weiblich): Schlüssel `D-A1` bis `Cw-B` in `varianten.py`.

### 13.4 Vergleichspaket (D-420)

Alle Blätter in `docs/screens/uebungen/`, eindeutig beschriftet, Nummern wie in deinem Abschnitt 9:

1. `paket-1-brustlogo-groessen.webp`: Brust-F 3,5, 4 und 4,5 cm für D und C männlich in der Größe der App: großer Player 390 px breit (Übungsdetails, Duo aufgeklappt) und das Vorschaubild des kleinen Players (56 px, dazu zweifach).
2. `paket-2-brustlogo-nah.webp`: Brust je Körper von vorn und aus der Kamera der App.
3. `paket-3-ruecken.webp`: Rücken je Körper in der Kniebeuge von hinten und beim Latziehen.
4. `paket-4-shorts-nah.webp`: Shorts-Logo je Körper.
5. `paket-5-bank-oben.webp`, `paket-5-bank-unten.webp`: Bankdrücken in A1, A2 und B, Zeilen D, C männlich, C weiblich.
6. `paket-6-kniebeuge.webp`: Kniebeuge in A1, A2 und B.
7. `paket-7-c-maennlich.webp`: C männlich, drei Momente in A1 und B, Logos aus der Nähe.
8. `paket-8-c-weiblich.webp`: C weiblich ebenso.
9. `paket-9-app-D.webp`, `paket-9-app-Cm.webp`, `paket-9-app-Cw.webp`: je Fassung der kleine Player am iPhone, die Übungsübersicht, die Übungsdetails und der aufgeklappte Player am Duo, mit den Standbildern der Fassung (mit „Bewegung reduzieren“ zeigt der Player das Standbild; die Medien wurden nur im Build getauscht, nichts davon ist in der App).

Dazu `paket-hals-kantenlicht.webp`: Hals und Kantenlicht je Körper.

**Renderzeit je Bild** (720 × 540, 40 Proben, ein Prozess nacheinander auf vier CPU-Kernen):

| Körper | Fassung | Aufbau | Kniebeuge unten | Bankdrücken oben | Bankdrücken unten | je Bild im Schnitt |
|---|---|---|---|---|---|---|
| D | A1 | 6,5 s | 16,9 s | 22,5 s | 22,8 s | 20,7 s |
| D | A2 | 6,7 s | 16,7 s | 24,6 s | 26,4 s | 22,6 s |
| D | B | 6,1 s | 16,2 s | 25,6 s | 24,4 s | 22,1 s |
| C männlich | A1 | 4,9 s | 18,3 s | 24,9 s | 26,0 s | 23,1 s |
| C männlich | A2 | 4,6 s | 18,4 s | 25,0 s | 25,4 s | 22,9 s |
| C männlich | B | 4,4 s | 18,7 s | 25,8 s | 24,2 s | 22,9 s |
| C weiblich | A1 | 5,9 s | 18,7 s | 24,6 s | 25,9 s | 23,1 s |
| C weiblich | A2 | 6,6 s | 18,8 s | 25,5 s | 25,9 s | 23,4 s |
| C weiblich | B | 6,0 s | 19,0 s | 24,9 s | 26,5 s | 23,5 s |

B ohne Zonen ist nicht schneller als A1: Die Zonen kosten im Shader nichts Messbares. Die 13 Blätter des Pakets: `paket-1-brustlogo-groessen.webp` 70,9 KB, `paket-2-brustlogo-nah.webp` 58,7 KB, `paket-3-ruecken.webp` 60,7 KB, `paket-4-shorts-nah.webp` 20,6 KB, `paket-5-bank-oben.webp` 96,8 KB, `paket-5-bank-unten.webp` 99,7 KB, `paket-6-kniebeuge.webp` 96,2 KB, `paket-7-c-maennlich.webp` 61,5 KB, `paket-8-c-weiblich.webp` 63,7 KB, `paket-9-app-Cm.webp` 202,0 KB, `paket-9-app-Cw.webp` 202,2 KB, `paket-9-app-D.webp` 198,6 KB, `paket-hals-kantenlicht.webp` 96,7 KB; zusammen 1328,3 KB.

### 13.5 Bewertung in der tatsächlichen Darstellung

Bewertet an den App-Ansichten (`paket-9-app-*.webp`), nicht an den Renderbildern: kleiner Player am iPhone (Vorschaubild 56 px in der Karte „Jetzt“), Übungsübersicht (56 px), Übungsdetails (Standbild 390 px breit) und aufgeklappter Player am Duo (Standbild rund 400 px breit).

| Kriterium | A1 · Zonen Lime, Logos hell | A2 · Zonen gedämpft, Logos Kollektion | B · ohne Zonen |
|---|---|---|---|
| Verständlichkeit der Übung | gut: Haltung, Stange und Bank tragen die Übung, die Zonen stören sie nicht | gut, wie A1 | gut, wie A1 |
| Erkennbarkeit der arbeitenden Muskeln | klar, auch in 56 px: Lime auf Nacht und Graphit | sichtbar, aber matt (olivgrün); in 56 px schwächer | nur in der Muskelkarte der Details, im Player gar nicht |
| Sichtbarkeit des FORM-Logos | Brust-F in 390 px ein feines helles Zeichen, in 56 px nicht zu sehen; Rücken-F nur bei Übungen von hinten (Latziehen) | Shorts-F in Lime in 390 px als kleines Lime-Zeichen zu sehen, Brust-F wie A1 | wie A2, dazu ohne Konkurrenz durch Zonen am deutlichsten |
| Visuelle Ruhe und Hochwertigkeit | ruhig: Lime nur an den Zonen, Logos leise, Rand in Stoffarbe | unruhig: zwei Grüntöne (mattes Zonen-Olive neben Lime-Logos) | am ruhigsten, wirkt wie ein Produktbild der Kleidung |
| Konsistenz zwischen Player und Muskelkarte | gleiches Lime, gleiche Bedeutung „dieser Muskel arbeitet“ | Lime bedeutet im Player Marke, in der Karte Muskel: verkehrt zur Karte | keine Zonen im Player, die Karte trägt die Information allein |

**Unterschiede in Smartphone-Größe:** In 56 px (kleiner Player, Übersicht) bleiben Silhouette, Stange und die Lime-Zonen (A1 deutlich, A2 schwach); Logos, Schlitze und Kordeln sind in keiner Fassung zu sehen. In 390 px (Details, Duo) sind die Zonen und das Brust-F als feines Zeichen zu sehen, das Shorts-F in Lime (A2, B) als kleiner Punkt; das Rücken-F erscheint in den drei Pilot-Übungen nur beim Latziehen. **Körper:** D und C männlich unterscheiden sich in 56 px nur durch Hautton und Haar; C wirkt menschlicher, D ruhiger, und bei D heben sich die Lime-Zonen an Armen und Beinen besser vom Grau ab als vom Hautton. C weiblich ist als Fassung gleichwertig, Haare und Gesicht ziehen in 390 px etwas mehr Blick.

**Brustlogo-Größen** (`paket-1-brustlogo-groessen.webp`): 3,5 cm ist in 390 px kaum zu finden, 4 cm ein feines Zeichen, 4,5 cm etwas deutlicher, aber noch kein Buchstabe. Als Buchstabe lesbar wäre das F im großen Player (390 px) erst ab rund 8 cm (etwa 10 px hoch), im kleinen Player nie. In der Nahaufnahme wirken 4 cm wie ein hochwertiger Aufdruck; 4,5 cm rückt bei D schon näher an die Mitte als ein Sportshirt-Logo.

### 13.6 Empfehlung

**Körper D, Fassung A1, Brust-F 4 cm.**

- **Fassung A1:** Lime bleibt im Player und in der Muskelkarte dasselbe Signal, die Zonen sind auch in 56 px lesbar, und die hellen Logos mit Rand in Stoffarbe sind nie mit einer Zone zu verwechseln. A2 dämpft die Zonen, kehrt aber die Bedeutung von Lime um (Marke im Player, Muskel in der Karte) und wirkt mit zwei Grüntönen unruhig. B ist das ruhigste Bild, verliert aber die Trainingsinformation im Player, für die die Zonen da sind (D-402).
- **Zonen auf der Kleidung: ja**, weil der kleine Player und die Übersicht sonst nur die Haltung zeigen und die Muskelkarte erst in den Details zu sehen ist.
- **Verwechslung gelöst:** Logos liegen immer über den Zonen, haben einen Rand in Stoffarbe und sind in A1 nie Lime; der Ausschnitt in Zonen aus D-417 ist weg.
- **Körper D statt C männlich:** D ist in der App ruhiger, die Lime-Zonen heben sich an Armen und Beinen vom Grau besser ab als vom Hautton, die Figur zeigt keine bestimmte Person und ist über alle 124 Übungen gleich; C männlich bleibt eine echte Alternative, falls dir das Menschliche wichtiger ist, dann ebenfalls mit A1 und 4 cm.
- **Brust-F 4 cm:** als Detail stimmig (eine Handbreit neben der Mitte, unter der Schulternaht), in 390 px ein feines Zeichen; 4,5 cm bringt in der App kaum mehr Sichtbarkeit und rückt näher an die Mitte. Die Marke trägt das Rücken-F (8 cm), das bei Übungen von hinten voll sichtbar ist, dazu das Shorts-F.

### 13.7 Tests

- **Logos:** aus vier Perspektiven an drei Körpern geprüft; Rand über Zonen in drei Fällen geprüft (Bankdrücken Brust, Latziehen Rücken, Kniebeuge Shorts).
- **Details:** Schlitz erst 3,6 cm zu hoch (Suche nur in Rumpfpunkten, die Hüftseite zählt am Saum zum Bein), behoben; Kordelenden vorhanden, unter dem Saum.
- **Fassungen:** 27 Standbilder und 27 Vorschaubilder, dazu 4 Größenfassungen; Renderzeiten im Testprotokoll.
- **App-Ansichten:** 36 Bildschirmfotos (9 Fassungen × kleiner Player am iPhone, aufgeklappter Player am Duo, Übungsübersicht mit Suche „Langhantel“, Übungsdetails der Kniebeuge; iPhone 390 × 844 in doppelter Auflösung, Duo aufgeklappt 951 × 669, „Bewegung reduzieren“), Medien nur in `dist/uebungen/medien/` getauscht und danach zurückgesetzt (Prüfsummen gleich `public/`).
- **Dokumente:** `pnpm check:docs` je Paket am Stand des Commits; `python3 -m py_compile` aller Werkzeuge.
- **CI:** zu `dfa586e` (D-418) alle Jobs grün, auch WebKit; die Läufe zu D-419 und D-420 stehen in PR #53 und im Testprotokoll.
- Alles wörtlich in `docs/testing.md`, Abschnitt „Korrekturrunde Logos und Zonen“.

### 13.8 Was ich von dir brauche

Deine Freigabe einer Kombination aus Körper (D oder C männlich), Fassung (A1, A2 oder B) und Brustlogo-Größe. Danach rendere ich die drei Pilot-Übungen in dieser Fassung neu und baue sie ein; nach deinem Gerätetest gibst du den Merge von PR #53 frei.

### 13.9 Berichte je Paket

```
Arbeitspaket: D-419 Kleidung nach Text, Logos in Originalproportionen mit Rand, Fassungen A1, A2, B
Umgesetzte Funktionen: Werkzeug für TP-06, TP-07, TS-02 (Videos der App unverändert), erfüllte AK: –
Geänderte Dateien: tools/uebungen-3d/kleidung.py, varianten.py, szene.py, realistisch.py; tools/uebungen_paket_bild.py (neu), tools/uebungen-fassungen-screens.mjs (neu); CLAUDE.md; Dokumente
Technische Entscheidungen: D-419
Ausgeführte Tests: Nahaufnahmen aus vier Perspektiven an drei Körpern, Rand über Zonen, Schlitz und Kordel, pnpm check:docs
Ergebnis: bestanden; ein Fehler (Schlitz zu hoch) gefunden und behoben
Bekannte Einschränkungen: Kordelenden unter dem Saum nicht sichtbar; Details und Logos als Bilder, nicht als Netz
Nächste Schritte: Vergleichspaket (D-420)
```

```
Arbeitspaket: D-420 Vergleichspaket mit App-Ansichten, Bewertung und Empfehlung
Umgesetzte Funktionen: Planung und Nachweis, erfüllte AK: –
Geänderte Dateien: docs/screens/uebungen/paket-*.webp; Dokumente
Technische Entscheidungen: D-420
Ausgeführte Tests: 27 Standbilder, 27 Vorschaubilder, 4 Größenfassungen, 24 Nahaufnahmen, 36 App-Ansichten, alle selbst angesehen; pnpm check:docs
Ergebnis: bestanden
Bekannte Einschränkungen: App-Ansichten mit Standbildern statt Schleifen (Medien nur im Build getauscht)
Nächste Schritte: Freigabe der Kombination durch den Produktinhaber, dann Neurendern der drei Pilot-Übungen
```

## 14. Korrekturen Augen, Logos, Kragen und Griff (vierte Nachricht vom 28.10.2026)

Deine Entscheidung: Fassung A1 (Zonen Lime, Logos hell mit Rand in Stoffarbe) und Brust-F 4 cm; den Körper wählst du nach dieser Runde zwischen D, C männlich und C weiblich. Der Anhang `korrektur-markierungen.png` ist nicht angekommen: Im Upload-Ordner der Sitzung lagen nur die fünf Auftragsdateien. Ich habe nach deinem Text gearbeitet, der die sechs Punkte klar beschreibt, und jede Ursache zuerst in Nahaufnahmen des alten Stands geprüft.

### 14.1 Augen und Zopf (D-421)

- **Ursache der schwarzen Augen:** Das Augenbild von MakeHuman trägt Lederhaut, Iris und Pupille; die Hornhaut des Augennetzes liegt auf einem durchsichtigen Eckbereich des Bilds. Mein Material ignorierte die Deckkraft, darum verdeckte eine bläulich-graue Schale die Iris, und die Augen wirkten schwarz. Jetzt zeigt der deckende Teil das Bild (feucht glänzend), die Hornhaut ist eine durchsichtige Schale mit Glanz nach Fresnel; Iris und Pupille sind sichtbar.
- **D:** dieselben Augen in Körpergrau mit weich dunklerer Iris aus der Helligkeit des Bilds. Die Augenhöhlen des Grundmodells sind sonst leer, darum die schwarzen Löcher.
- **Frau:** Haare `hair/ponytail01` aus dem CC0-Paket (zum Zopf gebunden), dunkel eingefärbt; Lizenz in `docs/licenses-data.md` Abschnitt 8. Beim Laden stürzte Blender zunächst ab: Die Datei führt mitten in der Referenzliste eine `material`-Zeile, die mein Leser als Ende der Liste nahm. Behoben, die Liste wird jetzt vollständig gelesen.

### 14.2 Kleidung: Shorts-F, Rücken, Kragen (D-422)

- **Shorts-F innen am Bein:** Die Ursache war die ebene Projektion. Sie reicht beliebig tief, und die Innenseite des rechten Beins zeigt zur selben Bildebene wie die Außenseite des linken; so bekam sie ein zweites F, beim Bankdrücken mit gespreizten Beinen sichtbar. Jetzt gilt jedes Logo nur für sein Körperteil (Rumpf bzw. linkes Bein) und nur bis 5 bzw. 8 cm vor und hinter der Bildebene. Geprüft an der Geometrie: Bankdrücken vom Fußende (Innenseiten beider Beine frei), Seitenansicht des linken Beins (F außen, unverändert); das Brust-F und das Rücken-Logo haben dieselbe Begrenzung.
- **Rücken:** Unter dem F steht die Wortmarke FORM als vertikales Logo nach der Regel des Startbilds: F 2,28 Versalhöhen hoch, Abstand 0,82 Versalhöhen, beide mittig. Das F bleibt 8 cm hoch an seiner Lage; daraus folgen Versalhöhe 3,5 cm, Abstand 2,9 cm und 18,9 cm Breite der Wortmarke. Das ist breit, aber die Originalproportion. Beide Teile kommen aus den Markendateien und liegen als ein Bild mit Rand in Stoffarbe über den Zonen; beim Latziehen von C weiblich sitzt es über den Lime-Zonen des Rückens und bleibt lesbar.
- **Kragen:** Der Rundhals war ein festes Feld je Eckpunkt in der Grundhaltung. Hebt die Schulter das Trapez, hebt sie den Stoff mit, und die Kante stieg am Hals hoch, vor allem unter der Stange. Jetzt misst der Shader den Abstand zum Rundhals an einem Leerobjekt, das mit dem Halsknochen mitläuft; die Haut unter dem Stoff folgt derselben Regel. Der Kragen liegt in der Kniebeuge unten beidseits am Halsansatz, in den anderen Phasen und Übungen folgt er dem Hals genauso, weil die Regel dieselbe ist.
- **Stange auf dem Stoff:** In Kniebeuge und Bankdrücken liegt die Stange jetzt um die Stoffhöhe weiter außen, auf dem Tee statt in ihm.

### 14.3 Griff (D-423)

- **Ursache:** Der Daumen zielte mit der Spitze auf die Stangenoberfläche gegenüber der Handfläche. So umgriff er die Stange zwar, hing aber wie ein Haken unter ihr, mit Abstand zu den Fingern; von vorn wirkte er abstehend und nach hinten geknickt.
- **Jetzt:** Daumenballen und Grundglied umschließen die Stange von der Gegenseite der Finger, die Spitze liegt über den Mittelgliedern von Zeige- und Mittelfinger, das Endglied legt sich auf die Finger. Die Beugung ist fest begrenzt (Grundglied 20 bis 60°, Endglied 20 bis 70°, kein Knick nach hinten). Weiche Strafen reichten nicht: Damit blieb der Daumen in Kniebeuge und Latziehen gestreckt und knickte beim Bankdrücken im Endglied 92°; die Grenzen gelten jetzt im Suchraster selbst.
- **Stange schräg:** Beim Bankdrücken liegt die Stange 12° schräg in der Handfläche, vom Zeigefingerballen zum Handballen, tief über dem Unterarm (Kniebeuge 20°, Latziehen 6° wie bisher).
- **Geprüft** in allen drei Übungen und Phasen: Beugung Bankdrücken 20°/70°, Kniebeuge 20°/20°, Latziehen 20°/28°; der Daumen drückt die Haut 0,1 bis 0,7 mm ein wie die Finger, nichts dringt ein. In der Kniebeuge ragt die Daumenspitze über dem Zeigefinger knapp über die Stange; das ist der Daumen auf dem Finger, kein Abstehen. Für den Blick entlang der Stange blendet `nahaufnahme.py --ohne-scheiben` die Scheiben aus, sonst steht die Kamera in der Scheibe.

### 14.4 Standbilder und Nahaufnahmen (D-424)

Alle Blätter in `docs/screens/uebungen/`:

1. `korrektur-1-standbilder.webp`: Fassung A1 mit Brust-F 4 cm, Zeilen D, C männlich, C weiblich; Spalten Kniebeuge tiefste Position, Bankdrücken Ausgangs- und Endposition; Kamera wie in der App.
2. `korrektur-2-nah-D.webp`, `korrektur-3-nah-Cm.webp`, `korrektur-4-nah-Cw.webp`: je Körper Augen, Hals und Kragen (Kniebeuge unten), Rücken mit Schriftzug (Latziehen unten, von hinten), Shorts-Logo (linkes Bein außen), Griff beim Bankdrücken von vorn (Fußende), von der Seite (schräg entlang der Stange, Scheiben ausgeblendet) und vom Kopfende, dazu der Griff in der Kniebeuge.

**Renderzeit je Bild** (720 × 540, 40 Proben, ein Prozess nacheinander auf vier CPU-Kernen; der Aufbau enthält jetzt die Daumensuche mit festen Grenzen):

| Körper | Aufbau Kniebeuge / Bankdrücken | Kniebeuge unten | Bankdrücken oben | Bankdrücken unten | je Bild im Schnitt |
|---|---|---|---|---|---|
| D | 6,1 / 6,1 s | 17,7 s | 31,5 s | 32,0 s | 27,1 s |
| C männlich | 5,7 / 5,3 s | 18,3 s | 24,7 s | 25,0 s | 22,7 s |
| C weiblich | 6,0 / 5,4 s | 18,4 s | 23,9 s | 25,7 s | 22,7 s |

Zum Vergleich D-420: D 21,8 s, C männlich 23,0 s, C weiblich 23,3 s je Bild. Die 4 Blätter: `korrektur-1-standbilder.webp` 105,8 KB, `korrektur-2-nah-D.webp` 72,4 KB, `korrektur-3-nah-Cm.webp` 83,0 KB, `korrektur-4-nah-Cw.webp` 85,1 KB; zusammen 346,3 KB.

**Was die Blätter zeigen, je Körper:**

- **D:** Augen in Körpergrau mit weich dunklerer Iris, das Gesicht bleibt neutral und ohne Löcher. Kragen in der Kniebeuge unten beidseits am Halsansatz, die Stange liegt auf dem Tee. F über FORM mittig zwischen den Schulterblättern, über den Lime-Zonen lesbar. Shorts-F außen am linken Bein, der Schlitz mit Lime-Einfassung darüber. Griff beim Bankdrücken: von vorn Finger über der Stange, der Daumen liegt dahinter; vom Kopfende die Daumenspitze über dem Zeigefinger; in der Kniebeuge ragt sie über dem Zeigefinger knapp über die Stange.
- **C männlich:** Lederhaut, braune Iris und Pupille sichtbar, mit Glanz. Die Lidspalte bleibt eng; das kommt aus dem Formziel des Gesichts, nicht aus dem Auge. Kragen, Rücken, Shorts und Griff wie bei D.
- **C weiblich:** dunkler Zopf am Hinterkopf, Nacken und Hals frei, Augen mit Iris. Die Wortmarke reicht auf dem schmaleren Rücken fast über die ganze Breite zwischen den Ärmeln, bleibt aber in Originalproportion zum 8-cm-F. Kragen, Shorts und Griff wie bei D.

**Zu allen dreien:** Die Standbilder entsprechen der Kamera der App; in dieser Größe sind die korrigierten Augen und der Daumen kaum zu erkennen, der Kragen und das Rücken-Logo schon. Die Renderzeit je Bild liegt etwas über D-420, weil die Hornhaut durchsichtig ist und die Daumensuche im Aufbau mehr Lagen prüft.

### 14.5 Tests

- **Ursachen** vor jeder Korrektur in Nahaufnahmen des alten Stands geprüft (Augen, Griff, Beine beim Bankdrücken, Kragen), danach dieselben Ansichten neu; Messwerte des Griffs in allen drei Übungen und Phasen.
- **Standbilder und Nahaufnahmen:** 9 Standbilder (3 Körper × 3 Momente, `varianten_bilder.py`) und 24 Nahaufnahmen (`nahaufnahme.py`, 480 px, Augen 32 Proben, sonst 24), alle selbst angesehen; 4 Blätter, zusammen 346,3 KB.
- **Dokumente:** `pnpm check:docs` und Prettier je Paket am Stand des Commits; `python3 -m py_compile` aller Werkzeuge.
- **CI:** CI zu `bd65d53` (D-421, Lauf 40682710242) und `fd5d8ee` (D-422, Lauf 40682762529) vom jeweils nächsten Commit abgebrochen, wie in der CI vorgesehen; Lauf 40684266041 zu `f0bc9aa` (D-423) lief beim Schreiben dieses Protokolls noch, der Lauf zum Commit von D-424 folgt; Stand in PR #53.
- Alles wörtlich in `docs/testing.md`, Abschnitt „Korrekturen Augen, Logos, Kragen und Griff“.

### 14.6 Was ich von dir brauche

Deine Wahl des Körpers (D, C männlich oder C weiblich). Danach rendere ich die drei Pilot-Übungen in A1 mit Brust-F 4 cm neu und baue sie ein; nach deinem Gerätetest gibst du den Merge von PR #53 frei.

### 14.7 Berichte je Paket

```
Arbeitspaket: D-421 Augen mit Iris und Hornhaut, neutrale Augen für D, Zopf für C weiblich
Umgesetzte Funktionen: Werkzeug für TP-06, TP-07, TS-02 (Videos der App unverändert), erfüllte AK: –
Geänderte Dateien: tools/uebungen-3d/realistisch.py, varianten.py; Lizenzen, Testprotokoll, Bericht
Technische Entscheidungen: D-421
Ausgeführte Tests: Augenbild gemessen, Nahaufnahmen Kopf D, C männlich, C weiblich, Zopf von hinten; pnpm check:docs
Ergebnis: bestanden; ein Fehler (Absturz beim Zopf) gefunden und behoben
Bekannte Einschränkungen: Iris von MakeHuman in Braun, keine Wahl der Augenfarbe
Nächste Schritte: Kleidung (D-422)
```

```
Arbeitspaket: D-422 Logos je Körperteil begrenzt, F über FORM am Rücken, Kragen am Hals mitgeführt, Stange auf dem Stoff
Umgesetzte Funktionen: Werkzeug, erfüllte AK: –
Geänderte Dateien: tools/uebungen-3d/kleidung.py, rig.py, uebungen.py, render.py, varianten.py; Dokumente
Technische Entscheidungen: D-422
Ausgeführte Tests: Nahaufnahmen Beine (Bankdrücken vom Fußende), Bein außen, Kragen (45°, 135°, Kamera der App), Rücken (D Kniebeuge, C weiblich Latziehen); pnpm check:docs
Ergebnis: bestanden
Bekannte Einschränkungen: Wortmarke 18,9 cm breit (Originalproportion zum 8-cm-F)
Nächste Schritte: Griff (D-423)
```

```
Arbeitspaket: D-423 voller Griff mit Daumen über den Fingern, Stange schräg in der Hand
Umgesetzte Funktionen: Werkzeug, erfüllte AK: –
Geänderte Dateien: tools/uebungen-3d/rig.py, uebungen.py, nahaufnahme.py; Dokumente
Technische Entscheidungen: D-423
Ausgeführte Tests: Messung je Übung (Winkel, Abstände, drei Phasen), Nahaufnahmen aus fünf Richtungen; pnpm check:docs
Ergebnis: bestanden; weiche Strafen verworfen, feste Grenzen
Bekannte Einschränkungen: in der Kniebeuge ragt die Daumenspitze über dem Zeigefinger knapp über die Stange
Nächste Schritte: Standbilder und Nahaufnahmen (D-424)
```

```
Arbeitspaket: D-424 Standbilder und Nahaufnahmen in A1 je Körper
Umgesetzte Funktionen: Nachweis, erfüllte AK: –
Geänderte Dateien: docs/screens/uebungen/korrektur-*.webp, tools/uebungen_korrektur_bild.py; Dokumente
Technische Entscheidungen: D-424
Ausgeführte Tests: 9 Standbilder (3 Körper × 3 Momente, `varianten_bilder.py`) und 24 Nahaufnahmen (`nahaufnahme.py`, 480 px, Augen 32 Proben, sonst 24), alle selbst angesehen; 4 Blätter, zusammen 346,3 KB; pnpm check:docs
Ergebnis: bestanden
Bekannte Einschränkungen: keine Videos, nur Standbilder (nach der Wahl des Körpers)
Nächste Schritte: Wahl des Körpers durch den Produktinhaber, dann die drei Pilot-Übungen neu rendern und einbauen
```

## 15. Korrekturen Daumen, Kragen und Rückenlogo (fünfte Nachricht vom 28.10.2026)

Deine Entscheidung: Körper C männlich, Fassung A1, Brust-F 4 cm; die weibliche Figur bleibt zurückgestellt und kann später als zweite Figur dazukommen. Dein Anhang mit den Markierungen ist diesmal angekommen. Die Pilot-Übungen und die Videos der App rendere ich erst nach deiner Freigabe der Standbilder neu.

### 15.1 Daumen (D-425)

- **Warum die Suche nicht reichte:** Das Ziel der Daumenspitze lag über den Fingern, und die Suche fand Lagen, in denen der Daumen neben den Fingern nach oben ragte. Aus allen drei Blickwinkeln blieb der „Daumen hoch“.
- **Feste Konstruktion:** Alle Daumengelenke liegen auf dem Kreis um die Stangenachse (Stangenradius plus Daumendicke) in der Ebene quer zur Stange durch das Sattelgelenk. Der Daumen läuft in Gegenrichtung der Finger: vom Handgelenk her unter der Stange hindurch und auf der Gegenseite hoch; die Spitze endet auf der Stange unter den Mittelgliedern von Zeige- und Mittelfinger, die sich darüber schließen. Daumen und Finger bilden so den geschlossenen Ring. Je Glied dreht eine Abbildung die Ruhe-Richtung auf die Sehne des Kreises und die Beere zur Stange.
- **Feste Winkel für die 28-mm-Stange** (C männlich, Bankdrücken): Sattelgelenk 71°, Grundgelenk 39°, Endgelenk 69°. Kniebeuge 52°/30°/69°, Latziehen (24 mm) 43°/19°/73°. Die Winkel folgen aus der Konstruktion und sind je Übung gleich in allen Phasen.
- **Dabei gefunden:** Die Kontaktmessung des Daumens nahm Haut des Daumenballens und der Schwimmhaut mit, die weit vom Knochen liegt, und trieb die Daumendicke auf das Doppelte; der Daumen schwebte 1,3 cm um die Stange. Jetzt zählt nur Haut bis 16 mm neben den Gliedknochen; der Daumen drückt die Haut 0,7 bis 0,8 mm ein wie die Finger.
- **Geprüft** aus vier Blickwinkeln beim Bankdrücken (vom Fußende, von der Seite, vom Kopfende, von oben) und in Kniebeuge und Latziehen: Nichts zeigt von der Stange weg. Von vorn ist die Daumenspitze neben dem Zeigefinger zu sehen, vom Kopfende liegt sie unter den Fingern.

### 15.2 Kragen (D-426)

- **Ursache der Spitze:** Kugel und Ellipse des Rundhalses schneiden nur, was im Querschnitt des Halses liegt. Hebt die Schulter das Trapez, steigt der Stoff seitlich neben dem Hals über die Kugel hinaus und blieb als Spitze stehen, vor allem unter der Stange.
- **Jetzt:** Zusätzlich begrenzt eine Ebene quer zum Hals den Stoff, in der Höhe, in der die Kugel in der Grundhaltung seitlich endet; darüber gibt es keinen Stoff. Die Ebene läuft mit dem Halsknochen mit wie Kugel und Ellipse. Die Kante ist in der tiefsten Kniebeuge rundum gleichmäßig, die Grundhaltung bleibt wie sie war.

### 15.3 Rückenlogo (D-427)

- **Regel:** Die Wortmarke nimmt zwei Drittel der Breite zwischen den Schulterblättern ein, das F folgt aus der festen Proportion (F 2,28 Versalhöhen hoch, Abstand 0,82). Die Breite zwischen den Schulterblättern kommt aus den Marken des Grundmodells für die Schulterblattmitten, mit der Körperform verschoben: Abstand der Mitten minus Breite eines Blatts (45 % des Mittenabstands). Beim Grundmodell liegen die inneren Ränder dann bei ±6,5 cm.
- **C männlich:** Breite 12,6 cm, Wortmarke 8,4 cm, F 3,5 cm, Block 6,4 cm hoch, Versalhöhe 1,6 cm (D 11,4 cm, C weiblich 10,1 cm Breite). Vorher waren es 18,9 cm und 8 cm; das Logo ist jetzt ein kleiner Aufdruck zwischen den Schulterblättern. Wenn du es größer willst, ist der Anteil eine Zahl in der Konfiguration.

### 15.4 Standbilder und Nahaufnahmen (D-428)

Alle Blätter in `docs/screens/uebungen/`:

1. `korrektur2-1-standbilder.webp`: C männlich, A1, Brust-F 4 cm; Kniebeuge tiefste Position, Bankdrücken Ausgangs- und Endposition, Kamera wie in der App.
2. `korrektur2-2-nahaufnahmen.webp`: Griff beim Bankdrücken von vorn (Fußende), von der Seite (entlang der Stange), vom Kopfende und von oben; Kragen in der tiefsten Kniebeuge aus der Kamera der App und von hinten-seitlich; Rückenlogo beim Latziehen und in der Kniebeuge von hinten.

**Renderzeit je Bild** (C männlich, 720 × 540, 40 Proben, ein Prozess auf vier CPU-Kernen): Aufbau 4,8 s (Kniebeuge) und 4,6 s (Bankdrücken); Kniebeuge unten 17,7 s, Bankdrücken oben 24,3 s, unten 25,8 s, im Schnitt 22,6 s (D-424: 22,7 s). Die 2 Blätter: `korrektur2-1-standbilder.webp` 39,7 KB, `korrektur2-2-nahaufnahmen.webp` 82,5 KB; zusammen 122,2 KB.

**Was die Blätter zeigen:**

- **Daumen:** Von vorn liegt der Daumen um die vordere Hälfte der Stange, die Spitze neben dem Zeigefinger; von der Seite ist der Ring aus Daumen und Fingern zu sehen; vom Kopfende und von oben liegt der Daumen unter den Fingern, nichts ragt über die Stange, nichts zeigt von ihr weg.
- **Kragen:** In der tiefsten Kniebeuge läuft die Kante rundum am Halsansatz, auch auf der Seite der Stange; die Stange liegt auf dem Tee.
- **Rückenlogo:** F über FORM sitzt klein und mittig zwischen den Schulterblättern, über den Lime-Zonen beim Latziehen und auf dem dunklen Stoff in der Kniebeuge, in Originalproportionen.
- **Standbilder:** In der Größe der App ändern die drei Korrekturen das Bild kaum; Kragen und Logo sind zu erkennen, der Daumen nicht.

### 15.5 Animationsplan für die drei Programme (D-429)

Die Liste steht in `docs/uebungen-animationsplan.md`, erzeugt aus der Familienzuordnung (D-411) und den Programmen der App; `pnpm check:docs` prüft, dass sie zu den Daten passt. Je Übung: Familie, Programme und Einheiten, Quelle der Bewegung, Aufwand (Übung plus neues Gerät, einmal gezählt), Renderzeit.

- **Umfang:** 68 Übungen mit 526 Einheiten in den drei Programmen; die Platzhalter der Programme sind keine Übungen.
- **Aufwand:** 103,0 Std. für die Übungen (davon neue Geräte 39,8) plus 63,0 Std. Basis der Familien (die drei Pilot-Familien haben sie schon) und einmalige Arbeiten für CMU, Mixamo, Kabelverlauf und Prüfseiten: 68 Übungen, rund 192 Arbeitsstunden (Übungen 103,0, Basis der Familien 63,0, einmalig 26). Das ist eine Einzelschätzung wie in D-411; nach den ersten beiden Familien führe ich sie an der Ist-Zeit nach.
- **Rechenzeit:** rund 29,7 Stunden (1784 min) auf vier CPU-Kernen, 60 Bilder à 23 s je Übung wie bei C männlich gemessen; sie läuft im Hintergrund.
- **Reihenfolge:** erst die Pilot-Familien Waagrechtes Drücken, Kniebeuge, Senkrechtes Ziehen, dann nach Einheiten Rumpf, Arme beugen und strecken, Beine isoliert, Schulter und Brust isoliert, Hüftbeuge, Waagrechtes Ziehen, Kondition, Senkrechtes Drücken, Ausfallschritt und einbeinig. Jede Familie kommt nach dem Merge von PR #53 auf einen eigenen Branch mit Prüfseite.

### 15.6 Tests

- **Ursachen** vor jeder Korrektur in Nahaufnahmen geprüft (Daumenlage gemessen, Kragen aus zwei Richtungen), danach dieselben Ansichten neu; Daumen in allen drei Übungen und Phasen gemessen.
- **Standbilder und Nahaufnahmen:** 3 Standbilder und 8 Nahaufnahmen von C männlich, alle selbst angesehen; zwei Blätter.
- **Animationsplan:** Werkzeug mit `--check` in `pnpm check:docs`.
- **Dokumente:** `pnpm check:docs` und Prettier je Paket am Stand des Commits; `python3 -m py_compile` aller Werkzeuge.
- **CI:** Die Läufe zu den fünf Commits stehen in PR #53; wie in der CI vorgesehen bricht jeder Push den laufenden Lauf ab, der Lauf zum letzten Commit zählt.
- Alles wörtlich in `docs/testing.md`, Abschnitt „Korrekturen Daumen, Kragen und Rückenlogo“.

### 15.7 Was ich von dir brauche

Deine Freigabe der Standbilder. Danach rendere ich die drei Pilot-Übungen in C männlich, A1, Brust-F 4 cm neu und baue sie ein; nach deinem Gerätetest gibst du den Merge von PR #53 frei. Die Animationen der drei Programme kommen danach familienweise auf eigenen Branches mit Prüfseite.

### 15.8 Berichte je Paket

```
Arbeitspaket: D-425 Daumen als fester Ring um die Stange
Umgesetzte Funktionen: Werkzeug für TP-06, TP-07, TS-02 (Videos der App unverändert), erfüllte AK: –
Geänderte Dateien: tools/uebungen-3d/rig.py; Dokumente
Technische Entscheidungen: D-425
Ausgeführte Tests: Lage der Daumengelenke gemessen, Winkel und Abstände in drei Übungen und Phasen, Nahaufnahmen aus vier Richtungen; pnpm check:docs
Ergebnis: bestanden; zwei Fehler gefunden und behoben (Suche statt Konstruktion, Kontaktmessung mit Ballenhaut)
Bekannte Einschränkungen: feste Winkel aus der Konstruktion, je Übung gleich in allen Phasen
Nächste Schritte: Kragen (D-426)
```

```
Arbeitspaket: D-426 Rundhals durch eine Ebene am Halsansatz begrenzt
Umgesetzte Funktionen: Werkzeug, erfüllte AK: –
Geänderte Dateien: tools/uebungen-3d/kleidung.py; Dokumente (Nachweise im Commit von D-427)
Technische Entscheidungen: D-426
Ausgeführte Tests: Kragen in der tiefsten Kniebeuge aus zwei Richtungen; pnpm check:docs
Ergebnis: bestanden
Bekannte Einschränkungen: keine
Nächste Schritte: Rückenlogo (D-427)
```

```
Arbeitspaket: D-427 Rückenlogo je Körper nach der Breite zwischen den Schulterblättern
Umgesetzte Funktionen: Werkzeug, erfüllte AK: –
Geänderte Dateien: tools/uebungen-3d/kleidung.py; Dokumente
Technische Entscheidungen: D-427
Ausgeführte Tests: Marken gelesen, Maße je Körper gemessen, Nahaufnahmen Latziehen und Kniebeuge von hinten; pnpm check:docs
Ergebnis: bestanden; Zahlen in D-428 nachgemessen und berichtigt
Bekannte Einschränkungen: Blattbreite als Anteil des Mittenabstands angesetzt
Nächste Schritte: Standbilder (D-428)
```

```
Arbeitspaket: D-428 Standbilder und Nahaufnahmen C männlich
Umgesetzte Funktionen: Nachweis, erfüllte AK: –
Geänderte Dateien: docs/screens/uebungen/korrektur2-*.webp, tools/uebungen_korrektur_bild.py; Dokumente
Technische Entscheidungen: D-428
Ausgeführte Tests: 3 Standbilder, 8 Nahaufnahmen, alle selbst angesehen; pnpm check:docs
Ergebnis: bestanden
Bekannte Einschränkungen: nur Standbilder, Videos nach der Freigabe
Nächste Schritte: Animationsplan (D-429), dann Halt
```

```
Arbeitspaket: D-429 Animationsplan für die drei Programme
Umgesetzte Funktionen: Planung, erfüllte AK: –
Geänderte Dateien: docs/uebungen-animationsplan.md, tools/uebungen_animationsplan.py, package.json (check:docs); Dokumente
Technische Entscheidungen: D-429
Ausgeführte Tests: --check in pnpm check:docs; Summen gegen die Daten geprüft
Ergebnis: bestanden
Bekannte Einschränkungen: Einzelschätzung wie D-411, Renderzeit aus den Standbildern hochgerechnet
Nächste Schritte: Freigabe der Standbilder, Pilot-Übungen neu rendern und einbauen
```

## 16. Korrekturrunde 3: Griff, Rundhalskragen und Rückenlogo (`uebungen-korrektur3-FORM.md`)

Dein Auftrag steht in `docs/prompts/uebungen-korrektur3-FORM.md`; der Anhang mit deinen Markierungen ist angekommen. Gerendert wird nur C männlich in A1 mit Brust-F 4 cm; die Pilot-Übungen und die Videos der App bleiben unverändert, bis du freigibst.

### 16.1 Griff: die Stange liegt in der Hand (D-430)

- **Ursache:** nicht die Daumenwinkel, sondern die Lage der Stange. `Rig.griff` schob die Stange so weit von der Handfläche weg, dass kein Punkt der Hand mehr als 2,5 mm in sie ragte. Die Ballen liegen aber 3 cm über den Mittelhandknochen; so lag die Stange 4,8 cm über den Knochen auf den Ballen statt in der Hand. Die Finger reichten nicht um sie herum, rollten als Faust davor ein, und der Daumen hing darunter.
- **Jetzt:** Die Stange sinkt 9 mm in die Haut der Handfläche ein, wie Ballen und Hohlhand unter Last nachgeben; die Haut in der Stange ist nicht zu sehen. Geprüft wird nur, dass keine Haut auf der Gegenseite aus der Stange ragt. Beim Bankdrücken liegt sie in der oberen Hohlhand und 18° schräg vom Zeigefingerballen zum Handballen; das Handgelenk steht über dem Unterarm. Finger und Daumen schließen sich mit der Konstruktion aus D-425 um die Stange: Daumen Sattelgelenk 41°, Grundgelenk 53°, Endgelenk 69°; die Finger drücken die Haut 0,1 bis 1,9 mm ein, der Daumen 0,7 mm.
- **Sichtprobe:** Vom Fußende läuft die Stange durch die geschlossene Hand, von oben greifen die Finger über sie, der Daumen schließt den Ring unten mit der Spitze neben dem Zeigefinger; vom Kopfende liegt er unter den Fingern.
- **Kniebeuge und Latziehen:** behalten ihre eigenen Griffe (Stange hinter dem Nacken bei 0,6 und 20° schräg; Latzugstange bei 0,72 und 6°), nur mit demselben Einsinken. Auch dort schließt sich die Hand um die Stange; die Kniebeuge zeigt den Handrücken, das Latziehen den Obergriff.

### 16.2 Rundhalskragen (D-431)

- **Ursache:** Kugel, Ellipse und Ebenen schnitten im Shader an einem mitlaufenden Leerobjekt; die Kante war die Summe mehrerer Flächen und blieb an den Übergängen unruhig. Dazu kommt dieser Körper: Die Trapezmuskeln liegen seitlich fast auf Höhe des Halsansatzes (Haut bei 13 cm seitlich 0,63 bis 0,64 m, Halsansatz 0,665 m).
- **Jetzt:** Die Halsöffnung ist eine Fläche durch drei Marken des Körpers, als Feld je Eckpunkt wie die Säume: vorn 1,5 cm unter der Höhe der Schlüsselbeinenden (Drosselgrube), hinten 1,2 cm über dem Halsansatz, seitlich bei der Halsbreite 1,5 cm unter dem Halsknochen. Die Fläche ist die geneigte Ebene durch vorn und hinten, seitlich zum Halsansatz angehoben, und unterhalb der vorderen Kante gibt es immer Stoff. Der Stoff bis 6 cm von der Öffnung hängt gleitend am Halsansatz, damit Schultern und Trapez die Kante nicht heben; auf der Kante liegt ein Bündchen von 14 mm als eigenes Netz.
- **Weg dorthin, ehrlich:** Vier Fassungen. Eine Ellipse mit Zylinder ließ den Nacken aus dem Zylinder fallen (Lappen seitlich am Hals); die reine Ebene schnitt über die Schultern (siehe Ursache); die seitlich angehobene Fläche lief vorn als Spitze die Brustbeinrinne hinab, weil die Ebene die vorgewölbte Brust trifft, und dem Bündchen fehlten dort die Schnittpunkte. Erst mit dem Stoff unterhalb der vorderen Kante und dem Bündchen aus einem eigenen Feld ist der Kragen rund.
- **Geprüft:** von vorn und von der Seite im Stand, in der tiefsten Kniebeuge mit aufliegender Stange aus zwei Richtungen, beim Latziehen oben mit gehobenen Armen, beim Bankdrücken: Kante am Halsansatz, Bündchen durchgehend 2,2 bis 2,6 mm über dem Stoff, keine Spitzen.

### 16.3 Rückenlogo (D-432)

- **Regel:** Die Wortmarke ist 15 cm breit (ein Wert in der Konfiguration), das F folgt aus der festen Proportion des vertikalen Logos: 6,3 cm hoch, Block 11,4 cm. Die Oberkante des F liegt 7 cm unter der hinteren Kante der Halsöffnung, waagrecht mittig. Die Regel aus D-427 (zwei Drittel der Breite zwischen den Schulterblättern) ist weg; sie hatte das Logo auf 8,4 cm verkleinert und zu tief gesetzt.
- **Geprüft** in Kniebeuge (Ausgang, von hinten; tiefste Position von hinten-seitlich), Latziehen (Endposition, von hinten, über den Lime-Zonen) und Bankdrücken (Rückenlage): mittig im oberen Rücken, Originalproportionen, folgt dem Stoff.

### 16.4 Vorher-nachher-Vergleich (D-433)

Alle Blätter in `docs/screens/uebungen/`, links der Stand D-429 (Werkzeug aus dem Repository ausgecheckt), rechts der Stand nach den Korrekturen, dieselben Kameras:

1. `korrektur3-1-griff.webp`: Griff beim Bankdrücken vom Fußende, von der Seite entlang der Stange, von oben auf die Hand, vom Kopfende; Griff in der Kniebeuge und beim Latziehen.
2. `korrektur3-2-kragen.webp`: Kragen von vorn und von der Seite im Stand, in der tiefsten Kniebeuge aus der Kamera der App und von hinten-seitlich, beim Latziehen oben mit gehobenen Armen.
3. `korrektur3-3-ruecken.webp`: Rückenlogo in der Kniebeuge und beim Latziehen, bisherige und korrigierte Position und Größe.
4. `korrektur3-4-gesamt.webp`: Gesamtansicht jeder Pilot-Übung (Kniebeuge unten, Bankdrücken Ausgang, Latziehen Endposition), Kamera wie in der App.
5. `korrektur3-5-player.webp`: die Gesamtansichten in der Größe des großen Players (390 px breit) und des kleinen Players (56 px).

**Renderzeit** (C männlich, 720 × 540, 40 Proben, ein Prozess auf vier CPU-Kernen; der Aufbau enthält Griffsuche und Kragen):

| Standbild | Aufbau vorher / nachher | Bild vorher / nachher |
|---|---|---|
| Kniebeuge unten | 5,4 / 5,1 s | 19,4 / 17,3 s |
| Bankdrücken oben | 4,9 / 5,0 s | 32,1 / 23,9 s |
| Latziehen unten | 8,8 / 6,3 s | 37,3 / 18,6 s |

Die 5 Blätter: `korrektur3-1-griff.webp` 118,1 KB, `korrektur3-2-kragen.webp` 110,0 KB, `korrektur3-3-ruecken.webp` 48,7 KB, `korrektur3-4-gesamt.webp` 67,5 KB, `korrektur3-5-player.webp` 40,9 KB; zusammen 385,2 KB.

**Was die Blätter zeigen:**

- **Griff:** Vorher saß die Faust über der Stange, die Finger rollten in die Handfläche, der Daumen hing darunter. Nachher läuft die Stange vom Fußende gesehen durch die geschlossene Hand, von oben greifen die Finger über die Stange, von der Seite ist der Ring aus Fingern und Daumen zu sehen, vom Kopfende liegt der Daumen unter den Fingern. Kniebeuge und Latziehen zeigen dieselbe geschlossene Hand mit ihren eigenen Griffen.
- **Kragen:** Vorher eine flache Kante mit Spitze und Einschnitt, seitlich am Hals hochgezogen. Nachher ein runder Ausschnitt mit Bündchen: vorn unter der Drosselgrube, seitlich am Halsansatz, hinten über dem Halswirbel; in der tiefsten Kniebeuge mit aufliegender Stange und beim Latziehen oben bleibt er am Halsansatz.
- **Rückenlogo:** Vorher klein und tief zwischen den Schulterblättern (Wortmarke 8,4 cm). Nachher ein Backprint von 15 cm Breite mit der Oberkante des F 7 cm unter dem Kragen, in Originalproportionen; beim Latziehen liegt er über den Lime-Zonen und bleibt lesbar.
- **Gesamtansichten:** In der Kamera der App sind Kragen und Backprint zu erkennen, der Griff liest sich als geschlossene Hand; sonst ist das Bild unverändert. Die Renderzeiten vorher liefen parallel zu anderen Renderings und sind nicht vergleichbar.
- **Player-Größe:** Im großen Player (390 px) sind Kragen, Griff und Backprint sichtbar; im kleinen Player (56 px) bleibt wie bisher nur die Silhouette mit den Lime-Zonen.

### 16.5 Animationsplan nach Programmen (D-434)

`docs/uebungen-animationsplan.md` ordnet die Übungen jetzt nach Programmen: erst alle aus „Ganzkörper A/B“, dann die noch fehlenden aus „Push/Pull/Beine“, zuletzt die noch fehlenden aus „Winterprogramm 2026“; innerhalb jedes Programms nach Familien, die Basis einer Familie zählt beim ersten Programm, das sie braucht, neue Geräte bei der ersten Übung.

| Reihenfolge | Programm | Übungen | Familien | Aufwand Übungen (Std.) | Basis (Std.) | Renderzeit |
|---|---|---|---|---|---|---|
| 1 | Ganzkörper A/B, 4 Tage | 11 | 9 | 22,2 | 42,0 | 289 min (4,8 Std.) |
| 2 | Push/Pull/Beine, rotierend | 14 | 9 | 24,0 | 4,0 | 368 min (6,1 Std.) |
| 3 | Winterprogramm 2026 | 43 | 12 | 56,8 | 17,0 | 1126 min (18,8 Std.) |

Summe unverändert: 68 Übungen, rund 192 Arbeitsstunden, rund 30 Stunden Rechenzeit.

Noch nichts davon ist gerendert; umgesetzt wird nach der Freigabe der Pilot-Übungen und dem Merge von PR #53, auf einem eigenen Branch, familienweise mit Prüfseite.

### 16.6 Tests

- **Ursachen** gemessen statt geraten: Handgeometrie und Lage der Stange (Griff), Halsansatz und Trapezhöhe (Kragen), Maße des Logos; danach dieselben Ansichten neu.
- **Griff:** Winkel und Abstände in allen drei Übungen und Phasen; Sichtprobe aus vier Richtungen beim Bankdrücken.
- **Kragen:** vier Fassungen nacheinander, Bündchen numerisch (Höhe über dem Stoff je Stütze) und in fünf Ansichten.
- **Vergleich:** 13 Nahaufnahmen vorher und 13 nachher (`nahaufnahme.py`, 560 px, 24 Proben) und je 3 Standbilder, alle selbst angesehen; 5 Blätter, zusammen 385,2 KB.
- **Dokumente:** `pnpm check:docs` und Prettier je Paket am Stand des Commits; `python3 -m py_compile` aller Werkzeuge; der Animationsplan mit `--check`.
- **CI:** Die Läufe zu den Commits stehen in PR #53; jeder Push bricht den laufenden Lauf ab, der Lauf zum letzten Commit zählt.
- Alles wörtlich in `docs/testing.md`, Abschnitt „Korrekturrunde 3“.

### 16.7 Übertragbarkeit und offene Punkte

- **Griff:** Das Einsinken der Stange in die Handfläche und die Konstruktion von Fingern und Daumen gelten für jede Übung mit Stange oder Griff; die Lage in der Hand (Anteil und Schrägstellung) bleibt je Übung ein Wert, weil Bankdrücken, Kniebeuge und Latziehen verschieden greifen. Für Kurzhanteln und Kabelgriffe (Animationsplan) ist dieselbe Konstruktion mit anderem Radius zu erwarten.
- **Kragen und Rückenlogo:** hängen an den Marken des Körpers (Schlüsselbeine, Halsansatz, Halsbreite) und gelten unverändert für alle Übungen und für die zurückgestellte weibliche Figur.
- **Offen:** deine Freigabe der Standbilder; danach rendere ich die drei Pilot-Übungen neu und baue sie ein, nach deinem Gerätetest gibst du den Merge von PR #53 frei.

### 16.8 Berichte je Paket

```
Arbeitspaket: D-430 Stange liegt in der Hand
Umgesetzte Funktionen: Werkzeug für TP-06, TP-07, TS-02 (Videos der App unverändert), erfüllte AK: –
Geänderte Dateien: tools/uebungen-3d/rig.py, uebungen.py; Auftrag, CLAUDE.md, Dokumente
Technische Entscheidungen: D-430
Ausgeführte Tests: Handgeometrie gemessen, Winkel und Abstände in drei Übungen und Phasen, Nahaufnahmen aus vier Richtungen; pnpm check:docs
Ergebnis: bestanden; Ursache war die Lage der Stange, nicht der Daumen
Bekannte Einschränkungen: Haut der Handfläche in der Stange (9 mm), nicht sichtbar
Nächste Schritte: Kragen (D-431)
```

```
Arbeitspaket: D-431 Rundhalskragen als Halsöffnung im Netz mit Bündchen
Umgesetzte Funktionen: Werkzeug, erfüllte AK: –
Geänderte Dateien: tools/uebungen-3d/kleidung.py, varianten.py; Dokumente
Technische Entscheidungen: D-431
Ausgeführte Tests: Halsansatz gemessen, vier Fassungen in fünf Ansichten, Bündchen numerisch; pnpm check:docs
Ergebnis: bestanden nach vier Fassungen
Bekannte Einschränkungen: Fläche aus drei Marken, nicht aus einem Schnittmuster
Nächste Schritte: Rückenlogo (D-432)
```

```
Arbeitspaket: D-432 Rückenlogo als Backprint
Umgesetzte Funktionen: Werkzeug, erfüllte AK: –
Geänderte Dateien: tools/uebungen-3d/kleidung.py; Dokumente
Technische Entscheidungen: D-432
Ausgeführte Tests: Maße gemessen, Nahaufnahmen in drei Übungen; pnpm check:docs
Ergebnis: bestanden
Bekannte Einschränkungen: keine
Nächste Schritte: Vergleich (D-433)
```

```
Arbeitspaket: D-433 Vorher-nachher-Vergleich
Umgesetzte Funktionen: Nachweis, erfüllte AK: –
Geänderte Dateien: docs/screens/uebungen/korrektur3-*.webp, tools/uebungen_korrektur_bild.py; Dokumente
Technische Entscheidungen: D-433
Ausgeführte Tests: 13 Nahaufnahmen vorher und 13 nachher (`nahaufnahme.py`, 560 px, 24 Proben) und je 3 Standbilder, alle selbst angesehen; 5 Blätter, zusammen 385,2 KB; pnpm check:docs
Ergebnis: bestanden
Bekannte Einschränkungen: Standbilder statt Schleifen
Nächste Schritte: Animationsplan (D-434), dann Halt
```

```
Arbeitspaket: D-434 Animationsplan nach Programmen
Umgesetzte Funktionen: Planung, erfüllte AK: –
Geänderte Dateien: tools/uebungen_animationsplan.py, docs/uebungen-animationsplan.md; Dokumente
Technische Entscheidungen: D-434
Ausgeführte Tests: --check in pnpm check:docs; Summen unverändert gegen D-429 geprüft
Ergebnis: bestanden
Bekannte Einschränkungen: Einzelschätzung wie D-411
Nächste Schritte: Freigabe der Standbilder durch den Produktinhaber
```

## 17. Korrekturrunde 4: Daumen, zweites Shorts-F und personalisiertes Modell (`uebungen-korrektur4-FORM.md`)

Dein Auftrag steht in `docs/prompts/uebungen-korrektur4-FORM.md`; beide Anhänge mit deinen Markierungen und die drei Fotos sind angekommen. Gerendert wird nur C männlich in A1 mit Brust-F 4 cm; die Pilot-Übungen und die Videos der App bleiben unverändert, bis du freigibst. Deine Fotos, ihre Landmarken, Texturen und alle Vorschauen des personalisierten Modells liegen nur im Arbeitsordner der Sitzung, nie im Repository (Abschnitt 17.3).

### 17.1 Daumen: klar vom Zeigefinger getrennt (D-435)

- **Ursache:** nicht die Kamera und nicht der Griff als Ganzes, sondern die Lage des Daumens. Die Ringkonstruktion aus D-425 legte alle Daumengelenke in die Querebene durch das Sattelgelenk auf denselben Radius wie die Finger. Diese Ebene ist die Ebene des Zeigefingers (bei der schrägen Stange 3 mm daneben), darum lief der Daumen mit Grund- und Endglied durch den Zeigefinger hindurch: Knochenabstand 3,5 bis 4,7 mm, 57 von 180 Hautpunkten des Daumens im Zeigefinger. Dazu kommt die Hand des Grundmodells: Die Fingerknochen liegen fast am Fingerrücken (Beere 15 mm, Rücken 5 mm vom Knochen). Mit nur 0,8 mm Kontakt blieben die Knochen 29 mm von der Stangenachse, die Finger rollten sich kaum, und die Fingerspitzen endeten oben auf der Stange, genau dort, wo der Daumen liegen muss.
- **Jetzt:** Die Fingerbeeren sinken wie die Handfläche 4 mm in die Stange ein (Zeigefinger 88°/32°/22° statt 82°/30°/21°). Der Daumen läuft gegenläufig um die Stange und dabei schräg über die Finger hinweg: am Ballen auf der Stange, darüber auf dem Rücken der Fingerspitzen, die Spitze zwischen Zeige- und Mittelfinger. Was unter ihm liegt, kommt aus einer Hülle der Haut von Zeige- und Mittelfinger im Griff; die Beere ist am Netz gemessen (12,6 mm), Beere und Fingerrücken geben zusammen 3 mm nach. Je Gelenk wird der Winkel so bestimmt, dass das Glied seine Länge behält, und der Radius nur so weit angehoben, dass Gelenk und Glied frei liegen und das nächste Glied flach folgen kann. Beim Bankdrücken: Sattelgelenk 56°, Grundgelenk 34°, Endgelenk 71°; Abstand zu den Fingerknochen mindestens 10 mm, Daumenhaut 0,7 mm von der Fingerhaut, keine Fingerhaut im Daumen.
- **Sichtprobe:** Vom Fußende liegt der Daumen als eigener Finger vor der Stange und steigt zur Spitze am Zeigefinger auf; von oben und schräg liegt er getrennt vor den Fingern; von der Seite ist sein Profil zu sehen, mit einem kleinen Spalt zur Fingerspitze; vom Kopfende liegt er wie bisher hinter der Stange.
- **Kniebeuge und Latziehen:** Die Kniebeuge übernimmt die Konstruktion (64°/45°/74°, Abstände ab 8,8 mm); im Bild liegt der Daumen hinter der Stange. Das Latziehen behält den Ring aus D-425: An der dünnen Latzugstange (24 mm) stünde der Daumen über den Fingern als Haken von der Hand ab (Sattelgelenk 48 mm von der Achse). Im Ring überschneiden sich Daumen und Zeigefinger dort wie bisher, hinter den Fingern verdeckt; das steht so im Testprotokoll. Nach deinem Auftrag wird die Korrektur nur übernommen, wo der Griff richtig bleibt.
- **Ehrlich:** Der Weg dorthin hatte Zwischenstände mit senkrecht abstehendem Daumen (nur die Gelenke über der Hülle, dann ohne Vorausschau); alle sind im Testprotokoll. Der Spalt zur Fingerspitze in der Seitenansicht bleibt, weil ein gerades Glied einer gewölbten Fingerspitze nicht ganz folgt.

