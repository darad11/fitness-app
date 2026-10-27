# Übungen · Quellen und Wege für die Übungsbilder

Stand: 27.10.2026 · Fortsetzung Abschnitt 6 (D-405) nach der Entscheidung Q-24 (D-400): realistisch wirkender Körper in Grau auf dunklem Grund, arbeitende Muskeln in Lime. Verglichen werden drei Wege; entschieden wird beim Produktinhaber. Nichts gekauft, keine Lizenz abgeschlossen, keine Anfrage gestellt.

## Vergleich der Wege (Q-24)

Plan B und C: nur Websuche (rund 58 Suchen am 27.10.2026), Seiten nicht geöffnet, Lizenztexte nicht vollständig gelesen; was nicht belegt ist, steht als „unbekannt“. Abdeckung per Stichprobe: jede 8. Übung der Bibliothek (16 Übungen, Liste unten). Der Pilot ist gemessen.

| | Pilot: eigene 3D-Pipeline (D-402) | Plan B: Exercise Animatic | Plan B: Gym Visual | Plan C: YMove | Plan C: Stock (Adobe Stock, Shutterstock) |
|---|---|---|---|---|---|
| Ergebnis, Beispiele | Kniebeuge, Bankdrücken, Latziehen in der App; `docs/screens/uebungen/pilot-uebersicht.png`, Aufnahme `pilot-player.webm` | 3D-Figur „realistic style“ mit hervorgehobenen Muskeln (Herstellerangabe), z. B. exerciseanimatic.com/product-page/barbell-bench-press-1 | Videos und GIFs „with the muscles worked highlighted“, z. B. gymvisual.com/videos/2936-barbell-close-grip-bench-press.html; Aussehen in den Treffern nicht beschrieben | Videos echter Menschen, 1.164 auf Weiß (Herstellerangabe), ymove.app/exercise-video-library | Fotoserien einzelner Fotografen auf Weiß, z. B. stock.adobe.com/137279529 |
| Muskeln hervorgehoben | ja, Zonen in Lime, mitarbeitende gedämpft | ja (Farbe ab Werk unbekannt) | ja (Farbe unbekannt) | nein | nein |
| Eigene Farben, dunkler Grund | ja, genau der FORM-Look (Grau, Lime #C7FF46, #0C1219) | Umfärben laut FAQ erlaubt; Fassungen mit Greenscreen, also freistellbar | unklar: Bearbeitung nicht geregelt, nur KI-Bearbeitung verboten | unbekannt | Adobe Standardlizenz erlaubt Bearbeitung; Muskeln nicht darstellbar |
| Lizenz für Apps | eigenes Werk auf CC0-Grundlage, ohne Pflichten (`licenses-data.md` Abschnitt 6) | „N-ECL“, lebenslang, ohne Namensnennung, auch in Apps (nur Herstellerangaben) | „N-CRFL“, unbefristet, iOS- und Android-Apps erlaubt; Weitergabe verboten, ein offenes App-Projekt wertet Dateien im öffentlichen Repository als Weitergabe | Abo, Streaming von YMove; Rechte enden mit dem Abo, Dateien müssen gelöscht werden | Standardlizenz je Bild; erweiterte Lizenz bei Produkten zum Verkauf |
| Model-Freigaben | entfällt (keine echte Person) | entfällt | entfällt | unbekannt | Adobe je Bild vermerkt („Model Released“), Shutterstock laut Drittquelle alle Bezahlinhalte |
| Preis | 0 €, nur Arbeitszeit und Rechenzeit | Gesamtpaket regulär 599 USD, im Angebot 349 USD (einmalig) | ab 5 Videos je 6 USD, rechnerisch 124 Videos rund 744 USD; GIFs rund 112 USD | 19 bis 299 USD im Monat; offline erst ab 79 USD im Monat | Adobe erweiterte Lizenz 79,99 USD je Bild; sonst unbekannt |
| Abdeckung der 124 | alle möglich, jede Übung einzeln zu bauen; heute 3 | Stichprobe: 9 von 16 direkt, 5 als Variante, 2 nicht belegt (Cable Fly, Seitstütz); Katalog 2.300 bis 2.600 Videos | Stichprobe: 12 von 16 direkt, 4 als Variante; Katalog über 6.500 GIFs | Stichprobe: 5 direkt, 2 Variante, 9 nicht belegt (wenige Suchen) | keine durchgehende Serie gefunden |
| Gleiche Person, gleicher Stil | ja, eine Figur, ein Licht, eine Kamera-Regel | ja (eine Serie), männlich und weiblich | vermutlich ja | einheitliches Studio, ob eine Person alles zeigt: unbekannt | nur innerhalb einer Fotoserie |
| Offline, local-first | ja, Dateien in der App, bei Bedarf gespeichert | ja, wenn die Lizenz Dateien in einer PWA erlaubt (zu klären) | wie links, Weitergabeverbot zu klären | nein (Streaming), offline nur im teuren Abo | ja |
| Aufwand für 124 | Pipeline steht; je Übung Posen im Code und Prüfung etwa 1 bis 2 Stunden, neue Geräte (Beinpresse, Hackenschmidt, Butterfly, Kabelturm, Rudergerät, Kurzhanteln) je 2 bis 4 Stunden: zusammen grob 150 bis 250 Stunden, dazu deine Freigabe je Übung (Schätzung) | Auswahl, Freistellen und Umfärben je Clip, Zuordnung; Lücken selbst füllen | wie Exercise Animatic, falls Bearbeitung erlaubt | Anbindung an fremden Dienst | 124 einzelne Bilder suchen, freistellen; Lücken bleiben |
| Renderzeit | gemessen auf 4 CPU-Kernen (Cycles, 40 Samples, 720 × 540, 60 Bilder): 968, 1.179 und 928 s je Übung, also 15 bis 20 Minuten oder rund 17 s je Bild; für 124 Übungen rund 35 Stunden Rechenzeit. Mit Grafikkarte deutlich weniger (nicht gemessen). Dateien je Übung 70 bis 95 KB (MP4 und WebM), zusammen 280 KB | entfällt | entfällt | entfällt | entfällt |
| Grenzen | Grundmodell von MakeHuman ohne Körperformen (Muskulatur, Proportionen): wirkt wie eine Gliederpuppe, nicht wie ein trainierter Körper; Muskelzonen sind gemalte Bereiche, keine einzelnen Muskeln; Hände und Finger vereinfacht; keine Kollisionsprüfung (Stange und Polster können den Körper streifen); Maschinen schematisch | Aussehen, Logo im Paket, Alpha-Kanal und Lieferform vor dem Kauf zu prüfen | Aussehen unbekannt, Bearbeitungs- und Weitergaberecht unklar | widerspricht local-first und „keine Nutzdaten an Dritte“ | keine Muskeln, uneinheitlicher Stil |

**Empfehlung: Plan B mit Exercise Animatic, nach schriftlicher Klärung; der Pilot bleibt der Rückfallweg.**

Begründung:

1. **Realismus.** Q-24 verlangt einen realistisch wirkenden Körper. Der Pilot trifft Farben, Licht und Bewegung genau, sein Körper bleibt aber eine glatte Gliederpuppe. Besser würde er erst mit den Körperformen von MakeHuman (Muskulatur, Proportionen) oder einem besseren CC0-Modell; die Dateien dazu lagen in dieser Sitzung nicht unter den bekannten Adressen, und `github.com` selbst war gesperrt. Ein fertiger Katalog hat diesen Stand ab Werk.
2. **Aufwand.** Für 124 Übungen braucht der Pilot nach meiner Schätzung 150 bis 250 Stunden Arbeit und je Übung deine Freigabe der Bewegung. Exercise Animatic kostet einmalig 349 bis 599 USD und deckt die Stichprobe zu 14 von 16 ab (9 direkt, 5 als Variante).
3. **FORM-Look.** Exercise Animatic erlaubt laut FAQ das Umfärben und liefert Fassungen mit Greenscreen. Grau auf dunklem Grund mit Lime-Zonen ist damit erreichbar, aber nicht bewiesen.
4. **Plan C** scheidet aus: Fotos und Videos zeigen keine Muskeln, YMove streamt von fremden Servern, und Stock-Serien decken die Liste nicht.

Vor einem Kauf schriftlich klären (Exercise Animatic, zum Vergleich auch Gym Visual): Darf man umfärben und freistellen? Darf man die Dateien in einer öffentlich erreichbaren PWA ausliefern und im Repository ablegen? Gibt es sie ohne Logo und mit Alpha-Kanal? Gibt es die Lücken der Stichprobe (Cable Fly, Seitstütz)? Am besten mit je einem Probeclip für die drei Pilot-Übungen, damit der Vergleich mit dem Pilot am selben Bild möglich ist. Fällt die Klärung negativ aus, ist der Pilot der Weg: zuerst ein besseres Grundmodell, dann die Übungen der Vorlagen.

Stichprobe: 1 Bankdrücken mit Langhantel, 9 Fliegende am Kabel, 17 Latziehen, 25 Überzüge am Kabel, 33 Arnold Press, 41 Schulterdrücken stehend, 49 Handgelenkcurls, 57 Enges Bankdrücken, 65 Seitstütz, 73 Bird Dog, 81 Hip Thrust an der Maschine, 89 Kniebeuge mit Langhantel, 97 Beinstrecker, 105 Good Mornings, 113 Wadenheben mit Kurzhanteln, 121 Rudergerät. Weitere geprüfte Anbieter: Muscle & Motion (App-Lizenz nur auf Anfrage, Inhalte bleiben in deren App), Envato Elements (einzelne passende Clips, keine Serie), WorkoutLabs (2D), Hyperhuman, Central Athlete, Getty Images (zu teuer), Auftragsarbeit über Upwork oder Fiverr (laut einem Auftragstext 40 bis 100 USD je Animation, Qualität uneinheitlich).

---

Die folgenden Abschnitte sind der Stand aus Phase 1 (D-399), vor der Entscheidung Q-24. Der gezeichnete Stil ist damit verworfen.

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
