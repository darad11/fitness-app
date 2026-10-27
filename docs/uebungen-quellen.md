# Übungen · Quellenvorschlag für die Visuals

Stand: 27.10.2026 · Phase Übungen, Phase 1 Punkt 4 (D-399, Q-24) · Leitlinien `prompts/uebungen-leitlinien-FORM.md` Kapitel 6 und 7 · Entscheidung beim Produktinhaber; nichts davon ist beschafft, gekauft oder in großer Zahl erzeugt.

## 1. Wie geprüft wurde

- **Direkt eingesehen** (Dateien geladen, Lizenzdateien gelesen, Beispielbilder angesehen): free-exercise-db (README, Datenliste mit 876 Übungen, ein Beispielbild), wrkout/exercises.json (README), everkinetic/data (Lizenzdatei, Datenliste mit 293 Übungen, zwei Bildpaare), wger-project/wger (Lizenztabelle, Bildmodell).
- **Nur über die Websuche** (Trefferzusammenfassungen, Seiten selbst nicht geöffnet): Lizenzhinweise zu wger und Everkinetic, Nutzungsbedingungen und Angebot von ExerciseDB/AscendAPI. Das Netz dieser Sitzung lässt nur die Suche und GitHub zu; wger.de selbst war gesperrt.
- **Nicht geprüft:** MuscleWiki, Gym Visual, WorkoutLabs, Adobe Stock, Shutterstock, iStock, LottieFiles, Open Peeps, Mixamo, Adobe Firefly, Midjourney. Das gemeinsame Kontingent der Websuche war nach den Ausführungstexten aufgebraucht. Was unten dazu steht, ist Vorwissen und als „nicht geprüft“ markiert; Preise dazu nenne ich nicht.
- **Abdeckung:** Stichprobe jede 8. Übung der Bibliothek (Nr. 1, 9, 17 … 121, 16 Übungen), abgeglichen per Namenssuche in den geladenen Daten. free-exercise-db 14 von 16, Everkinetic 12 bis 13 von 16. Everkinetic fehlen unter anderem Bird Dog, Dead Bug, Pallof Press, Burpees, Bergsteiger, Hampelmann, Hip Thrust, Bulgarische Kniebeuge, Nordic Curls und alle Cardiogeräte.

## 2. Vergleich

| Quelle | Abdeckung der 124 Übungen | Bildstil | Format | Lizenz und Namensnennung | Kommerzielle Nutzung | Kosten | Aufwand | Bewertung |
|---|---|---|---|---|---|---|---|---|
| Eigener FORM-Stil (Abschnitt 3) | 100 % | einheitlich, Figur aus Kapseln in Seitenansicht auf dunkler Fläche, Farben aus den Tokens | SVG, zwei Phasen im Wechsel; Vorschaubild = Endposition | eigenes Werk, keine Namensnennung | uneingeschränkt | Arbeitszeit, keine Lizenz | hoch einmalig: Figur und Gerätebausteine, 124 Posenpaare, Prüfung | **Empfehlung** |
| Everkinetic (everkinetic/data, GitHub) | rund 60 bis 70 % (Stichprobe) | schwarze Strichzeichnung, muskulöse Figur, Geräte mitgezeichnet | SVG (Ø rund 20 KB) und PNG, je Übung zwei Phasen („relaxation“, „tension“) | Lizenzdatei im Repository: CC BY-SA 4.0 (Dritte nennen teils 3.0); Namensnennung „Everkinetic“ nötig; bearbeitete Bilder (umgefärbt) unter derselben Lizenz | ja, mit den Pflichten der Lizenz | 0 € | mittel: zwei Füllfarben, auf hell über dunkel umzufärben; Zuordnung von Hand; Lücken bleiben | Zweitwahl |
| wger (wger.de) | unbekannt (872 Übungen im Datenbestand, Bilder nicht prüfbar) | gemischt: Linie, 3D, Low-Poly, Foto (Standard Foto) | Bild | je Bild eigene Lizenz (CC BY-SA 3/4, CC0, CC BY 4, ODbL), mit Autor und Quelle | je nach Bild, bei SA mit Weitergabe unter gleicher Lizenz | 0 € | hoch: jedes Bild einzeln sichten und belegen | nur für Einzelfälle mit geprüfter Lizenz |
| free-exercise-db (yuhonas, GitHub) | rund 80 bis 85 % | Fotos echter Personen im Studio | JPG, zwei je Übung, rund 70 KB | als „Unlicense“ ausgewiesen, Lizenzdatei fehlt; Daten stammen aus wrkout/exercises.json, das für kommerzielle Nutzung auf ein Bezahlangebot verweist | **ungeklärt** | 0 € | gering | ausschließen: Herkunft der Fotos unbelegt, im Beispielbild ein Herstellerlogo, Fotos von Menschen |
| ExerciseDB / AscendAPI | hoch (laut Suche rund 1.500 GIFs) | 3D-Figur (nicht geprüft) | GIF über eine API | laut Nutzungsbedingungen nur im Abo, widerruflich, **Speichern verboten** | nur im Abo | Bezahlpläne ohne veröffentlichte Preise | gering | ausschließen: kein Offline, jeder Abruf geht an Dritte |
| MuscleWiki | unbekannt | Videos von Personen (nicht geprüft) | Video | nicht geprüft | unbekannt | unbekannt | – | vermutlich ungeeignet (Personen, fremde App) |
| Gym Visual | vermutlich hoch | 3D-Figur, heller Hintergrund (nicht geprüft) | GIF, Video | nicht geprüft | unbekannt | unbekannt | mittel bis hoch | offen: weißer Hintergrund, Recht zur Bearbeitung unklar |
| Stock-Anbieter (Adobe Stock, Shutterstock, iStock) | gering je Set | Vektor, oft heller Hintergrund | Vektor, teils Animation | Standardlizenzen für Apps (nicht geprüft) | vermutlich ja | nicht recherchiert | hoch: Set suchen, Lücken | Lücken zwingen zum Stilbruch |
| LottieFiles | gering | uneinheitlich | Vektoranimation (JSON) | vermutlich „Lottie Simple License“ (nicht geprüft) | vermutlich ja | unbekannt | mittel, dazu eine neue Laufzeitbibliothek (D-203) | ungeeignet |

## 3. Eigener FORM-Stil: Prüfung und Rohentwurf

**Möglich, ja.** Je Übung zwei Phasen, Ausgangs- und Endposition, als Illustration auf der Fläche `card`, im Wechsel gezeigt (bei „weniger Bewegung“ nebeneinander). Das Gerüst der App kann das schon (`kind: "phases"` in `public/uebungen/medien.json`).

**Rohentwurf:** Für zwei Übungen (Kniebeuge und Bankdrücken mit Langhantel) habe ich die Figur als Skizze gezeichnet, nur als Entscheidungshilfe: `docs/screens/uebungen/prototyp/` und die Bilder `docs/screens/uebungen/prototyp-*.png`. Er liegt nicht in der App; in den Bildern kommt er nur im Test dazu. Er zeigt Stil, Größe und Wirkung im Player, ist aber noch grob: Hände, Griff und Gelenkwinkel sind nicht fein abgestimmt.

| Werkzeug | Lizenz | Aufwand | Größe | Risiko |
|---|---|---|---|---|
| **Figur im Code** (SVG aus Kapseln, Gelenkpunkte oder -winkel je Phase als Daten, Geräte als Bausteine: Bank, Stange, Kurzhantel, Kabelrolle, Klimmzugstange, Polster) | eigenes Werk | Figur und Bausteine rund 2 bis 4 Tage; je Übung 10 bis 20 Minuten, also 124 Übungen 3 bis 5 Tage; dazu deine Prüfung | Bibliothek deutlich unter 100 KB, nachgeladen, offline | Bewegung kann falsch sein; Maschinen (Beinpresse, Hackenschmidt, Butterfly) nur schematisch |
| Figma oder Inkscape von Hand | eigenes Werk | 248 Zeichnungen, deutlich mehr Zeit | 2 bis 10 KB je Phase | Stil driftet leicht |
| Blender mit Mixamo | Mixamo laut Vorwissen kommerziell lizenzfrei (nicht geprüft) | sehr hoch, kaum Gerätetraining in Mixamo | mehrere MB | Aufwand, Größe |
| KI-Bildgeneratoren (Firefly, Midjourney) | nicht geprüft; rein maschinell erzeugte Bilder sind laut Vorwissen kaum geschützt | anfangs gering, für 248 einheitliche, korrekte Bilder hoch | Rasterbilder | falsche Anatomie und Griffe, falsche Bewegungen; als Hauptquelle ungeeignet |

## 4. Empfehlung

**Eigener FORM-Stil, als Figur im Code.** Er erfüllt als einzige Möglichkeit alle Vorgaben zugleich: alle 124 Übungen in einem Stil, dunkle Fläche über die Tokens, keine Fotos, keine fremden Logos oder Wasserzeichen, keine Lizenzpflichten, offline und klein, eine dezente Bewegung durch den Wechsel der zwei Phasen. Gegen das Hauptrisiko, eine falsch gezeichnete Bewegung:

1. Jede Pose folgt dem belegten Ausführungstext der Übung (D-398); wo der Text offen ist, bleibt auch das Bild offen.
2. Eine Prüfseite mit allen Posenpaaren, die du je Gruppe freigibst (zuerst die Übungen aus den Vorlagen).
3. Cardiogeräte als ruhendes Bild.

**Zweitwahl:** Everkinetic, umgefärbt, mit Namensnennung „Everkinetic, CC BY-SA 4.0“ in den Übungsdetails und auf einer Seite „Quellen“. Nur wenn der eigene Stil zu aufwendig wird; die Lücken (30 bis 40 %) müssten dann trotzdem selbst gezeichnet werden, und ein Teil der Herkunft ist ungeklärt.

**Nicht verwenden:** free-exercise-db, ExerciseDB/AscendAPI, MuscleWiki. Kostenpflichtige Anbieter (Gym Visual, Stock) habe ich nicht geprüft und keine Lizenz abgeschlossen.

## 5. Adressen

Direkt geladen: `raw.githubusercontent.com/yuhonas/free-exercise-db/main/README.md`, `…/dist/exercises.json`, `…/exercises/Barbell_Squat/0.jpg`; `raw.githubusercontent.com/wrkout/exercises.json/master/README.md`; `github.com/everkinetic/data`; `github.com/wger-project/wger`.

Aus der Suche: https://wger.readthedocs.io/ · https://github.com/everkinetic/data · https://github.com/chaosbastler/opentraining-exercises · https://exercisedb.notion.site/ExerciseDB-API-Terms-of-Use-226983b728ca8090bf7be79564e4b356 · https://exercisedb.gumroad.com/l/exercisedb · https://github.com/exercisedb/exercisedb-api · https://workoutlabs.com/exercise-illustrations-licensing/ (Inhalt nicht geprüft)
