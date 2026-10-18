# Referenzanalyse Xeela: Aufnahmen, Screenshots und Abgleich mit der eigenen App

Version 1.0 · 18.10.2026 · Ergänzt `product-research.md` (Sekundärquellen) um das Primärmaterial des Produktinhabers. Gestaltung, Videos, Bilder und Texte von Xeela werden nicht übernommen; die Analyse dient dem Verständnis der Abläufe (`product-research.md` Abschnitt 11).

## 1. Kennzeichnung

Jede Aussage trägt eine Stufe:

| Stufe | Bedeutung |
|---|---|
| **G** gesehen | In einer Aufnahme oder einem Screenshot des Produktinhabers sichtbar (Datei und Zeitstempel angegeben) |
| **O** offiziell bestätigt | Durch eine offizielle Quelle belegt (`product-research.md` Abschnitt 2.1) |
| **A** abgeleitet | Aus Gesehenem gefolgert, nicht direkt sichtbar |
| **E** eigener Vorschlag | Nicht Teil von Xeela |
| **U** unverifiziert | Nur Behauptung, Drittquelle oder nicht erkennbar |

Material (alle Dateien vom 18.10.2026, Aufnahmen aus der Xeela-App des Produktinhabers, iPhone):

| Kürzel | Datei | Länge | Inhalt |
|---|---|---|---|
| V1 | `ScreenRecording_10-18-2026_15-50-21` | 8,8 s | Ansicht „Workout Progress“ |
| V2 | `ScreenRecording_10-18-2026_15-50-56` | 27,5 s | Ernährung: Tagesansicht, „Add Food“, Rezept, Eintrag |
| V3 | `ScreenRecording_10-18-2026_15-53-45` | 72,7 s | Trainingsplayer von der Tagesvorschau bis zum Abschluss |
| T1 bis T8 | `Winter_Arc_2026_Teil_01` bis `_08` | je 42 bis 46 s | Programm „2026 Winter Arc“, alle 56 Kalendertage (`winter-arc-reconstruction.md`) |
| S1 | Screenshot „Daily Challenges“ | – | Tagesaufgaben einer Challenge |
| S2 | Screenshot „Program Progress“ | – | Fortschritt des Programms |

## 2. Referenzmatrix

| Datei, Zeit | Funktion | Interaktionen | Daten | Gestaltung | Umsetzung bei uns | Verbesserung | Stufe |
|---|---|---|---|---|---|---|---|
| V1 0:00–0:02 | Kennzahlen „Workouts, Minutes, Est. Cal Burned“ mit Zeitfilter „All time, 1 Week, 1 Month, 6 Month“ | Filterchips; Teilen-Symbol | 1 Workout, 20 min, 140 kcal | Drei Kacheln, Symbol je Kachel, „?“ an der Kalorienkachel | TH-06 (Statistik), TS-18 (Kalorien), Filter wie AK-BW-05 (30 Tage, 90 Tage, 1 Jahr, Gesamt) | Kalorien nur als „Schätzung“ mit Erklärung, nie ohne Körpergewicht (E) | G |
| V1 0:01 | „Logged workouts“ mit „+ Log workout“ und Hinweis „Did a workout outside your plan? Log it …“ | Schaltfläche | – | Leerzustand als Text | TS-17 (nachtragen, M2 AP 2.6) | Nachtrag zählt zum Wochenziel (D-220) | G |
| V1 0:02–0:05 | Karte „Weight“: Current, Heaviest, Lightest; Liniendiagramm mit Achse 71 bis 95 kg, Datumsachse 5/20 bis 10/18 | Scrollen | 81 kg, 85,5 kg, 79 kg | Geglättete Linie ohne Punkte | BP-01, BP-02 (M3 AP 3.1, 3.2, C-01) | Punkte je Eintrag und Trend statt geglätteter Linie (AK-BW-05), Zeitraumwahl | G |
| V1 0:04–0:07 | „Your Personal Best“: Kacheln Bench Press 0 kg, Deadlift 0 kg, Dips 0, Plank 00:30, Pull Ups 0, Push Ups 0, Squats 0 kg; „+ Exercise“ | Horizontale Liste, Übung hinzufügen | Nullwerte als Platzhalter | Runde Symbolkacheln | TH-05 (Bestleistungen, R4) | Bestleistungen nur aus gespeicherten Sätzen, keine Nullkacheln (AK-DSH-07) | G |
| V1 0:05–0:08 | „Before & After“ mit zwei Fotoplätzen, „View Gallery“, „Share your progress!“, Fußzeile „Live it up! Crafted with Care in California, USA“ | Foto hinzufügen, Galerie, Teilen | – | Gelb gestrichelte Platzhalter | BP-05 (Fotos lokal, M12), CH-04 (Teilen, R5) | Fotos bleiben auf dem Gerät | G |
| V1 durchgehend | Tab-Leiste Home, Store, „+“, Meal, Progress; schwebende Schaltfläche „Log Progress“ | – | – | Blaue Primärfarbe, weiße Fläche | CH-08 (Navigation), CH-07 (Schnellaktionen) | Kein Store; „+“ als Schnellaktion „Gewicht erfassen, Training starten“ (AK-DSH-08) | G |
| V2 0:00–0:03 | Ernährung: Kopf „Meal Plan, Recipes, Grocer(y)“, Datumswahl „Today’s goal, October 18“ | Chips, Datum vor und zurück | – | Ring „Calories 0 of 1859 kcal“ | NU-02 (Tagesübersicht), RE-03, RE-08 (M7, M8) | Ziel aus Formel oder manuell mit Herkunft (NU-01, NU-17) | G |
| V2 0:02–0:05 | Makros „Protein 0 of 163 g, Carbs 0 of 186 g, Fat 0 of 52 g“ | – | Zielwerte | Drei Spalten mit Balken | NU-02 | Gleiche Darstellung in Tokens | G |
| V2 0:03–0:06 | Mahlzeiten „Breakfast 0 / 418 Cal, Lunch 0 / 502, Dinner 0 / 753, Snack 0 / 186“ mit „+“ je Slot; Hinweis „Not what you’re looking for? Change your Dietary Preference“ | „+“ je Mahlzeit; „Change Preference“ | Kalorienbudget je Slot (Summe 1859) | Karten mit Symbol | NU-03 (Mahlzeiten-Slots), NU-04 | Budget je Slot optional, Standard ohne Verteilung | G |
| V2 0:07–0:10 | Blatt „Options to Add Food“: Scan Barcode, Scan Food, Recipes, Search Xeela Food Library, Add Custom Food, Saved Food | Blatt von unten | – | Zwei große Kacheln, vier Listenzeilen | NU-06, NU-07 (Barcode, M6), NU-08 (Suche BLS, M5), NU-10 (eigene), NU-11 (gespeicherte) | „Scan Food“ (Foto) nicht geplant (NU-14 ausgeschlossen); Quellenhinweis je Treffer (NU-19, NU-25) | G |
| V2 0:10–0:16 | Rezepte „Breakfast“ mit Filter Easy, Moderate, Hard; Kacheln mit Bild, Name, Bewertung, „418 Cal“; Detail „Ham and Couscous Breakfast Bowl“, „Difficulty: Moderate“, „5 (6)“, „20 Mins“, „1 Serving“, „Nutrition per serving“, „+ Add Meal“ | Filterchips, Detail, Hinzufügen | Rezeptdaten von Xeela | Bildkacheln, Lade-Animation | RE-01, RE-02 (M7) | Eigene Rezepte und Import (RE-12, RE-15); keine fremden Rezeptinhalte | G |
| V2 0:16–0:18 | Toast „‚Ham and Couscous Breakfast Bowl‘ added“; Ring 418 of 1859 kcal, „78 % remaining“; Makros 37/42/12 g; Eintrag unter Breakfast „418 Cal“ mit Menü „⋮“ | Toast mit Schließen | Snapshot der Nährwerte | Grüner Toast | NU-05 (Snapshot), `Toast` vorhanden | Rückgängig im Toast (E) | G |
| V2 0:19–0:27 | „Add Food details“: Titelbild, Mahlzeit-Chips, Food Name, Servings „1 portion“, Total Nutrition Calories, Protein, Carbs, Fats; „Log & Save Food“; Lesezeichen | Formular, Auswahl der Mahlzeit | Freie Nährwerte | Einspaltiges Formular | NU-10, NU-20 (Schnelleintrag) | Pflichtfeld nur kcal; Kennzeichnung „unvollständig“ (NU-22) | G |
| V3 0:00–0:03 | Tagesvorschau „Week 1 Chest and Back“, „Week 1 · Day 1 · 2026 Winter Arc“, Trainer, Kacheln „6 Exercises, 16 Sets, 75 Mins“, Liste „Workout Circuit“ mit Übung, Muskel, „3 Sets • 10 Reps“, „Rest 01:30 minutes“, „Start Workout“ | Scrollen, Start | Plan des Tages | Dunkle Vorschaubilder je Übung | TP-02, TP-17 (Vorschau), TS-01 | Geschätzte Dauer aus Sätzen und Pausen berechnen, als Schätzung kennzeichnen (E) | G |
| V3 0:03–0:05 | Countdown „3, 2, 1“ vor der ersten Übung | – | – | Große Ziffer auf Schwarz | Nicht übernommen | Direkter Start spart Zeit (E) | G |
| V3 0:05–0:20 | Übungsansicht mit Video, Name, „Set 1/3“, Fortschritt „0 %“, Vor und Zurück, „10+10 Reps (Left + Right)“ | Pfeile, Satzanzeige | Zielwerte je Seite | Vollbild dunkel, große Ziffern | Player S-05 (vorhanden), „je Seite“ (D-243) | Keine Videos (keine Xeela-Assets); eigene Texthinweise statt Video | G |
| V3 0:12–0:16 | „More Options“: „Exercise Info“ (Schritte 1 bis 5, „Muscles worked“ mit Körperfigur), „Smart Suggestions“ (Schalter „Suggest reps & weights“) | Blatt, Schalter | Beschreibungstext von Xeela | Körperfigur mit markierten Muskeln | TP-07 (Übungsdetail, M2 AP 2.5), Vorschläge D-225 | Muskeln aus der Bibliothek; Hinweise nur, wo wir eigene Texte haben; Vorschläge aus Vorwerten statt „smart“ | G |
| V3 0:16–0:22 | „Active Exercise“ mit Tabelle „Set, Left Reps, Right Reps, Weight (kg)“ (Werte 0, „--“), „Jump Set“; „Coming up“ mit Griffsymbolen zum Umsortieren | Direkt bearbeitbare Tabelle, Sprung, Umsortieren | Ist-Werte je Satz | Weiße Tabelle auf Blatt | Satzzeilen S-05 (vorhanden), TS-27 (freie Reihenfolge) | Umsortieren im Player ergänzen (E); eine Zeile je Satz, beide Seiten in einer Zeile (D-243) | G |
| V3 0:22–0:40 | Pause „REST 1:29“ mit „Next: … Set 2/3“, „Track Your Progress“: Felder Reps links und rechts, „Enter Weight Lifted“ mit Zifferntastatur; „Queue“, Vor und Zurück; Fortschritt steigt 6 %, 13 %, 19 % … | Eingabe während der Pause; Tastatur mit Dezimalzeichen | 10, 10, 20 kg | Große Restzeit | AP 1.5 Pausenleiste und Vollansicht; Eingabe jederzeit möglich (AK-TRN-08) | Vollansicht der Pause zeigt den nächsten Satz und erlaubt Eingabe des gerade erledigten Satzes (E, in AP 1.5 geplant) | G |
| V3 0:40–0:55 | Weitere Übungen (T-Bar Row 10 Reps, Incline Cable Chest Press 12 Reps, Rest 1:30 und 1:15), Fortschritt 38 %, 50 %, 63 %, 75 %, „REST 0:00“ mit Laufband „30m 00s“ | – | Plan Tag 1 | – | Fortschritt je Einheit vorhanden (AK-TRN-15) | – | G |
| V3 0:55–1:05 | Abschluss „You’ve completed Week 1 Chest and Back Workout!“, Ring „Day 1 of 56“, „6 Exercises, 525 Cal Burned, 16 Sets“, „You’ll be reminded for your next workout!“, „Share“, „Continue“ | Teilen, Weiter | Tag im Programm, Kalorien (Xeela-Berechnung unbekannt) | Dunkel, Kreis | Zusammenfassung S-06 (Grundfassung vorhanden), TP-19, TS-18 | „Tag x von 40“ nur bei aktivem Programm; Kalorien als Schätzung nach MET; keine Erinnerung ohne Push (bekannte Grenze) | G |
| V3 1:05–1:10 | „Log Progress“: Current Weight, Body fat percentage, Fotos Front, Side, Back; „Cancel, Save“ | Formular nach dem Training | – | – | BP-01, BP-04, BP-05 | Gewicht erfassen aus der Zusammenfassung anbieten (E); Fotos M12 | G |
| V3 1:10–1:12 | Home: Karte „WORKOUT COMPLETED“, „Progress … Day 1/56“, „Share“, „Log Progress“; „Invite & Earn 1200 Sweat Equity“; „Challenge Tasks“: Complete 30 mins of cardio, No Soda, Drink a gallon of water | Aufgaben abhaken | Tagesaufgaben der Challenge | Blaue Karte | CH-06 (Dashboard), AH-03 (Tagesaufgaben, M13) | Eigene Tagesaufgaben ohne Wettbewerb und ohne Empfehlungsprogramm (CH-02, ON-17 ausgeschlossen) | G |
| T1 0:00–0:07 | Programmseite: Name, Trainer, „8 Weeks, 40 Sessions“, Beschreibung, „Key Benefits“, Kalender mit Ruhetagen | Scrollen, Tag wählen | Programmdaten | Kalenderleiste | Programm C (`winter-arc-reconstruction.md`), TP-02, TP-03 | Eigener Beschreibungstext; keine Preisauslobung | G |
| T1 bis T8 | Tagesansichten mit Muskel, Übung, „n Sets • m Reps“, „Rest mm:ss“, Sternmarkierung an einzelnen Übungen | Scrollen | 40 Tage, 278 Einträge | – | Programm C | Bedeutung des Sterns offen (Q-13) | G |
| S1 | „Daily Challenges“: Liste von Tagesaufgaben mit Abhaken | Abhaken | – | – | AH-03, CH-01 | Aufgaben frei definierbar (E) | G |
| S2 | „Program Progress“: „Days Completed 1/56“, „Exercises 5/279“, „Est. Cal 140“, Streaks, Teilen | – | Programmfortschritt | – | TP-19, TH-04 (Streaks), TS-18 | Zählung „Tag x von 40 Trainingstagen“ statt 56 Kalendertagen (E); Streak nur bei aktivem Programm | G |

Abgeleitet (A): Xeela zählt im Fortschritt Kalendertage (56) und Übungseinträge (279); die Kalorien je Tag (525) sind ein fester Programmwert, nicht aus den Sätzen berechnet (gleicher Wert in Vorschau und Abschluss). Unverifiziert (U): Berechnungsgrundlage der „Est. Cal Burned“ (140 für 20 min), Herkunft der Rezeptdaten, Bedeutung der Sternmarkierung.

## 3. Abgleich mit der eigenen App (Stand `m1-training`, 18.10.2026)

| Bereich | Xeela (G) | Eigene App heute | Lücke | Priorität |
|---|---|---|---|---|
| Programm folgen | Kalender, Tagesvorschau, „Day x of 56“, Ruhetage | Vier Beispielvorlagen, Vorlage ansehen, „heute trainieren“ (AP 1.2, 1.4); kein aktives Programm, kein Fortschritt | Aktives Programm mit nächstem Tag, Ruhetagen und Zähler (M2 AP 2.3 vorgezogen) | P1 |
| Player: Satzerfassung | Tabelle je Satz, links und rechts, Gewicht; Eingabe auch in der Pause | Satzzeilen mit Vorwert, Vorschlag, ±, erledigt, überspringen, entfernen; jederzeit editierbar | Keine | – |
| Player: Pause | Vollbild mit Restzeit, nächstem Satz, Eingabe, Queue | Timer in der Domain (AP 1.3), keine Oberfläche | AP 1.5: Leiste mit Vollansicht, ±15 s, Überspringen, Ton, Wake Lock | P0 |
| Player: Reihenfolge | „Coming up“ mit Umsortieren, „Jump Set“ | Freie Reihenfolge, Sprung durch Scrollen | Umsortieren im Player (klein) | P2 |
| Player: Übungsinfo | Videos, Schritte, Muskelfigur | Name, Vorwert, „Erstes Mal“ | Textliche Ausführungshinweise und Muskeln aus der Bibliothek (M2 AP 2.5); keine Videos | P2 |
| Übung ersetzen | In der Vorschau und im Player (Xeela laut Sekundärquellen; in V3 nicht gezeigt) | Übung hinzufügen und entfernen | Ersetzen mit Alternativen nach Muskel und Gerät (TS-10, TP-12; M2 AP 2.4) | P1 |
| Abschluss | Ring, Tag im Programm, Übungen, Sätze, Kalorien, Teilen, Gewicht und Fotos | Einfache Zusammenfassung (AP 1.4) | Dauer, Volumen, Vergleich (AP 1.7, M3), Tag im Programm, Kalorienschätzung | P1 |
| Fortschritt | Kennzahlen mit Zeitfilter, Gewicht, Bestleistungen, Fotos | Nichts | M3 (Gewicht, Dashboard), R4 (Bestleistungen, Fotos) | P1 bis P2 |
| Tagesaufgaben | Challenge-Aufgaben abhaken | Nichts | M13 vorgezogen als kleine eigene Funktion (AH-03) | P2 |
| Ernährung | Ring, Makros, Slots, Barcode, Rezepte | Nichts | R2 (M5 bis M7) wie geplant | P2 (nach Training) |
| Gestaltung Player | Dunkel, große Ziffern, Video | Helle und dunkle Tokens, Vollbild ohne Tab-Leiste | Große Ziffern für Restzeit und Zielwerte, kontrastreiche Hervorhebung des aktuellen Satzes (schon vorhanden) | P1 (mit AP 1.5) |
| Navigation | Home, Store, +, Meal, Progress | Heute, Training, Mehr (Tab-Leiste) | Bereich „Fortschritt“ ab M3; kein Store | – |
| Datenverlust | Rezensionen berichten Abstürze und verlorene Trainings (U, `product-research.md` Abschnitt 9) | Speichern je Änderung, Endzeitpunkte, Wiederaufnahme (AK-TRN-16, 17) | AP 1.6 (Gesundheitsprüfung, dauerhafter Speicher), AP 1.8 (Export, Snapshot) | P0 |

## 4. Wichtigste Design- und Funktionsverbesserungen (eigene Vorschläge, E)

1. **Pause als Vollansicht mit nächstem Satz und Eingabe** des gerade erledigten Satzes, Leiste bleibt beim Scrollen sichtbar; Restzeit in großer Schrift (AP 1.5).
2. **Aktives Programm mit Zähler „Trainingstag x von 40“**, Ruhetagen und „Heute: Brust und Rücken“ auf der Startseite; der Zähler zählt Trainingstage, nicht Kalendertage.
3. **Kalorien als Schätzung nach MET** mit Erklärung und Körpergewicht als Grundlage; ohne Gewicht kein Wert.
4. **Tagesvorschau mit berechneter Dauer** aus Sätzen und Pausen, als Schätzung gekennzeichnet.
5. **Übung ersetzen mit Alternativen** gleicher Muskelgruppe und passendem Gerät, im Plan und im Player.
6. **Fortschrittsseite nur mit gespeicherten Daten**: keine Nullkacheln, Leerzustände mit Hinweis, Zeitraumwahl wie beim Gewicht.
7. **Tagesaufgaben ohne Wettbewerb**: eigene Liste, abhaken, Streak; keine Preise, kein Teilen-Zwang.
8. **Kein Countdown, keine Videos, kein Store**: schnellerer Start, keine fremden Inhalte, keine Ablenkung.
9. **Rückgängig statt Bestätigungsdialoge**, wo Xeela nur einen Toast zeigt (Eintrag hinzugefügt, Satz erledigt).
10. **Datensicherheit vor Funktionen**: Export, Snapshot, Gesundheitsprüfung und Migrationstests vor jeder Schemaänderung (`evolution-plan.md` Abschnitt 6).
