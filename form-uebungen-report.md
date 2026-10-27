# FORM · Bericht zur Phase Übungen

Stand: 27.10.2026, Abschnitt 0, Phase 1 und die Fortsetzung (`prompts/uebungen-weiter-FORM.md`, Abschnitt 9) abgeschlossen; Entscheidung über den Weg der Übungsbilder beim Produktinhaber (Q-24, D-405) · Branch `form-uebungen`, Entwurfs-PR [darad11/fitness-app#53](https://github.com/darad11/fitness-app/pull/53) · Auftrag `docs/prompts/uebungen-FORM.md`, verbindliche Leitlinien `docs/prompts/uebungen-leitlinien-FORM.md` · Entscheidungen D-395 bis D-405

Getestet in Browser-Fenstern (Chromium in dieser Umgebung, WebKit in GitHub Actions), nicht am Gerät. Visuals gibt es noch keine; in den Bildern mit „prototyp“ kommt ein Rohentwurf nur im Test dazu.

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
| Knie kippen nach innen | Blender-IK über vier Knochen; das Pol-Ziel wurde in jedem Bild aus der Lage des Knies neu gesetzt, nichts band das Knie an die Zehenrichtung | Rig |
| Füße uneinheitlich gedreht, Gewicht auf den Zehen | Der Fuß behielt die Richtung der Grundhaltung, in der er beim MakeHuman-Modell nicht flach steht; die Drehung nach außen saß nur am Halter, beide Seiten wurden getrennt gelöst | Rig, Modell |
| Muskelzonen verschwommen | Weicher Abfall je Muskel, zweimal mit den Nachbarpunkten geglättet, im Material weich gemischt | Zonendaten, Rendering |
| Seitenansicht verdeckt Kopf und Oberkörper | Kniebeuge und Latziehen schräg von hinten, Bankdrücken schräg von der Seite, fester Abstand; die Scheiben lagen vor Kopf und Oberkörper | Rendering |
| Ruck an den Umkehrpunkten | Zeitverlauf mit Kosinus: Die Geschwindigkeit ist stetig, die Beschleunigung springt | Animationsdaten |
| Bankdrücken mit weit abgespreizten Ellbogen | Pol-Ziel 70 cm seitlich der Schulter | Animationsdaten |
| Latziehen: Hände auf den gebogenen Enden, Knierolle fest | Handziel 47 cm neben der Mitte; Rolle unabhängig von den Oberschenkeln gesetzt | Animationsdaten |

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
