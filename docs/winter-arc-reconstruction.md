# Rekonstruktion „2026 Winter Arc“ (Xeela)

Version 1.0 · 18.10.2026 · Quelle für Programm C in `evolution-plan.md`. Die Abschnitte 5 und 6 erzeugt `tools/winter_arc_to_md.py` aus `tools/data/winter-arc-2026.source.json` und `tools/data/winter-arc-exercise-map.json`; `pnpm check:docs` prüft sie.

## 1. Zweck und Grenzen

- Das Programm wird nachgebaut, damit der Produktinhaber es in der eigenen App mit eigenen Daten trainieren kann. Es ist ein Trainingsplan aus Übungsnamen, Sätzen, Wiederholungen und Pausen; Videos, Bilder, Texte und Gestaltung von Xeela werden nicht übernommen (nur der Beschreibungstext ist hier als Beleg zitiert).
- Einzige Quelle ist die Bildschirmaufnahme des Produktinhabers aus seiner Xeela-App (acht Teile, 18.10.2026) und das Player-Video desselben Tages. Eine öffentliche Quelle für die Inhalte des Programms gibt es nicht; Websuche am 18.10.2026 nach „Xeela Winter Arc“ fand nur Marketingseiten und Challenge-Bedingungen ohne Übungslisten.
- Kein Wert ist geschätzt oder ergänzt. Wo die Aufnahme etwas nicht zeigt, steht es in Abschnitt 4 als offen. Gewichte gibt das Programm nicht vor; die App zeigt dem Nutzer wie bisher seinen Vorwert (AK-TRN-05).

## 2. Vorgehen

| Schritt | Was | Nachweis |
|---|---|---|
| 1 | Aus jedem Teil 1 Bild je Sekunde als Bildtafel (6 Tafeln je Teil, `ffmpeg`) | Scratch-Verzeichnis der Sitzung, nicht im Repository |
| 2 | Jede Tafel gelesen, Übungen mit Satz, Wiederholungen und Pause übertragen; Teilgrenzen auf Anschluss geprüft (z. B. Teil 2 endet bei Woche 2 Tag 12 Übung 1, Teil 3 beginnt dort) | `source` je Tag in der Datendatei |
| 3 | Lücken (schnelles Scrollen in Woche 5 bis 8, Seitenübergänge) mit 6 Bildern je Sekunde erneut gelesen | Zeitstempel mit „Lücke … geschlossen“ |
| 4 | Tag 1 zusätzlich gegen das Player-Video geprüft (Übungen, Sätze, Pausen stimmen überein) | `player 00:00–00:02` |
| 5 | Plausibilität: Anzahl Übungen und Sätze je Tag gegen die Kopfzeile der Tagesansicht; Summe 40 Tage, 8 Wochen, 5 Tage je Woche | `tools/winter_arc_to_md.py --check` |

Kennzeichnung der Aussagen in diesem Dokument: **gesehen** (in der Aufnahme), **abgeleitet** (aus Gesehenem gefolgert, als solches markiert), **offen** (nicht erkennbar). Offiziell bestätigt ist nichts, weil Xeela keine Programmlisten veröffentlicht.

## 3. Programmstruktur (gesehen)

| Angabe | Wert | Quelle |
|---|---|---|
| Name, Trainer | „2026 Winter Arc“, „Ilya \| Xeela Trainer“ | T1 00:00–00:07 |
| Dauer | 8 Wochen, 40 Einheiten, 5 Trainingstage je Woche | T1 00:00–00:07 |
| Angaben je Tag in Xeela | ca. 525 kcal, ca. 75 min, 12 Muskelgruppen | T1 00:00–00:07; Player-Abschluss „525 cal“ |
| Beschreibung (Zitat) | „Winter Arc is an 8-week challenge inside Xeela built for people who refuse to get soft when the year slows down. You train five days a week for eight weeks, forty sessions total, all programmed in the app so you never have to guess what to do. This is not a casual plan and it is not a participation trophy. One person who stays consistent, checks in, and shows real change wins $10,000. If you want winter to be a build season instead of a fade, this is the lock-in.“ | T1 00:00–00:07 |
| „Key Benefits“ (Zitat) | Enhanced Muscle Definition; Increased Strength; Improved Metabolism; Boosted Confidence | T1 00:00–00:07 |
| Wochenaufbau | Tag A „Chest and Back“ (6 Übungen, 16 Sätze), B „Shoulders and Arms“ (7, 19), C „Legs and Abs“ (8, 22), D „Upper Body“ (6, 16), E „Lower Body and Abs“ (8, 22); Ausnahmen Tag 12 (7, 21) und Tag 14 (8, 24) | Kopfzeilen der Tagesansichten |
| Ruhetage | Woche 1: Tag 2 und 3; Woche 2 bis 8: die ersten beiden Tage der Woche (Tag 8 und 9, 15 und 16 usw.) | Kalenderleiste in T1 bis T8 |
| Pausen | 90 s nach Grundübungen, 75 s bei den meisten, 60 s bei Isolation und Waden, 45 s bei Bauch, 0 s nach dem Laufband | Satzzeilen; Verteilung: 90 s × 59, 75 s × 108, 60 s × 40, 45 s × 32, 0 s × 39 |
| Abschluss | Laufband 30:00 min als letzte Übung fast jedes Tages | Satzzeilen |
| Kalender (abgeleitet) | In der Aufnahme beginnt Woche 1 am Sonntag, 18.10.2026 (Tag 1), Ruhetage Montag und Dienstag; ab Woche 2 Ruhetage Sonntag und Montag, Training Dienstag bis Samstag. Das Programm selbst ist datumsunabhängig | Kalenderleiste |

Insgesamt 278 Übungseinträge mit 71 verschiedenen Xeela-Namen (Xeela nennt „279 Exercises“ in der Fortschrittsansicht; Differenz siehe Abschnitt 4).

## 4. Unsicherheiten und offene Punkte

| Nr. | Punkt | Stand | Umgang |
|---|---|---|---|
| U-1 | Orangefarbene Sternmarkierung an einzelnen Übungen (z. B. Tag 17 Übung 4, Tag 32 Übung 1, Tag 46 Übung 5, Tag 52 bis 55 jeweils erste oder zweite Übung) | gesehen; laut Produktinhaber (Q-13, 18.10.2026) ein **Dropset**: schwer beginnen, nach jedem Satz das Gewicht um 30 % senken, keine Pause dazwischen | Vor Programm C die vollständige Sternliste aus den Aufnahmen in die Datendatei übertragen (`dropset: true`) und als Drop-Sätze ohne Pause abbilden (AK-TRN-03); keine Gewichte vorgeben |
| U-2 | Tag 14: Laufband mit „3 Sets • 30:00“, Kopfzeile 24 Sätze | gesehen; wahrscheinlich Datenfehler in Xeela | In der Datendatei wie angezeigt; in Programm C als 1 × 30 min (Q-13, beantwortet 18.10.2026) |
| U-3 | „279 Exercises“ in der Fortschrittsansicht gegen 278 gezählte Einträge | gesehen | Differenz vermutlich durch U-2 oder eine Zählung je Satzgruppe; kein Tag fehlt (40 Tage, Kopfzeilen stimmen) |
| U-4 | Tippfehler in Xeela („Quad Extentions“, „Leg press Calf Raise“, „Overhead Cable Tricep Extention“, „Flat Dumbbell Bench Press (chest)“) | gesehen | Wörtlich beibehalten; deutsche Namen im Abgleich |
| U-5 | Ausführung einzelner Übungen | vom Produktinhaber am 18.10.2026 nachgesehen: Frontheben sitzend, Knieheben stehend, Beinheben liegend, Wadenheben sitzend, Klimmzüge an der Maschine; nur „Chest Fly With Push“ bleibt unklar | Abgleich in Abschnitt 5 aktualisiert; Klimmzüge mit Entlastung × Wiederholungen |
| U-6 | Gewichte, Tempo außer „3-Second Eccentric“, Aufwärmsätze | nicht Teil des Programms | Nicht erfunden; Aufwärmsätze nach den Regeln der App optional |
| U-7 | Kalorien „525 cal“ und „75 min“ je Tag | gesehen, Berechnung unbekannt | Nicht übernommen; eigene Schätzung nach MET mit Kennzeichnung (`evolution-plan.md`) |
| U-8 | Datum des Programmstarts | nur in der Aufnahme des Produktinhabers | Programm C ohne Datum; Start wählt der Nutzer |

## 5. Übungsabgleich

71 Xeela-Namen: 50 vorhanden, 20 Varianten vorhandener Übungen, 0 fehlen (0 neue Übungen vorgeschlagen), 1 unklar. Erzeugt aus `tools/data/winter-arc-exercise-map.json`; Status und Konfidenz beziehen sich auf die Zuordnung, nicht auf die Satzwerte. Varianten werden als Ausführungshinweis im Programm und als Alias in der Bibliothek geführt, nicht als eigene Übung (`exercise-library.md` Abschnitt 2). Quelle je Übung: erstes Vorkommen im Programm.

| Xeela-Name | Deutscher Name | Schlüssel | Status | Ergänzung | Quelle | Konfidenz |
|---|---|---|---|---|---|---|
| Alternating Dumbbell Lunges | Ausfallschritte mit Kurzhanteln | `lunge_dumbbell` | Vorhanden | Hinweis „wechselseitig“ | W1 T7, T2 00:12–00:20 | hoch |
| Alternating Flat Dumbbell Press | Bankdrücken mit Kurzhanteln | `bench_press_dumbbell` | Variante | Hinweis „wechselseitig“; Alias „Alternating Dumbbell Press“ | W1 T1, player 00:00–00:02; T1 Liste | hoch |
| Flat Dumbbell Bench Press (chest) | Bankdrücken mit Kurzhanteln | `bench_press_dumbbell` | Vorhanden | Klammer „(chest)“ stammt aus Xeela | W3 T17, T3 00:28–00:34 | hoch |
| Lying Hamstring Curls | Beinbeuger liegend | `lying_leg_curl` | Vorhanden | – | W2 T12, T2 00:45; T3 00:00–00:04 | hoch |
| Leg Raises | Beinheben liegend | `lying_leg_raise` | Vorhanden | Laut Produktinhaber (18.10.2026) liegend | W2 T14, T3 00:18–00:22 | hoch |
| Leg Press Machine | Beinpresse | `leg_press` | Vorhanden | – | W2 T12, T2 00:45; T3 00:00–00:04 | hoch |
| Single Leg Press Machine | Beinpresse, einbeinig | `leg_press_single_leg` | Vorhanden | Aufgenommen in Schritt B (18.10.2026): Oberschenkel vorne und Gesäß, Maschine, je Seite (wie „Einbeiniges Rumänisches Kreuzheben“ eigene Übung) | W1 T7, T2 00:12–00:20 | mittel |
| Quad Extentions | Beinstrecker | `leg_extension` | Vorhanden | Tippfehler „Extentions“ stammt aus Xeela | W2 T12, T2 00:45; T3 00:00–00:04 | hoch |
| Single-Leg Quad Extension | Beinstrecker | `leg_extension` | Variante | Hinweis „einbeinig“ | W2 T14, T3 00:18–00:22 | mittel |
| Bicycles | Bicycle Crunches | `bicycle_crunch` | Vorhanden | Aufgenommen in Schritt B (18.10.2026): Rumpf, Körpergewicht, nur Wiederholungen | W1 T5, T1 00:31–00:42 | hoch |
| Cable Bayesian Curl | Bizepscurls am Kabel | `biceps_curl_cable` | Variante | Hinweis „Bayesian: Zug hinter dem Körper, einarmig“; Alias „Bayesian Curl“ | W1 T4, T1 00:19–00:27 | mittel |
| Single-Arm High Cable Curls | Bizepscurls am Kabel | `biceps_curl_cable` | Variante | Hinweis „hoher Zug, einarmig“; Alias „High Cable Curl“ | W3 T18, T3 00:38–00:41; T4 00:00–00:04 | mittel |
| Alternating Dumbbell Curl With Hold | Bizepscurls mit Kurzhanteln | `biceps_curl_dumbbell` | Variante | Hinweis „wechselseitig, mit Halten“ | W1 T4, T1 00:19–00:27 | hoch |
| Chest Fly Machine | Butterfly an der Maschine | `pec_deck` | Vorhanden | Alias „Chest Fly Machine“ | W1 T1, player 00:00–00:02; T1 Liste | hoch |
| Crunches | Crunches | `crunch` | Vorhanden | – | W1 T5, T1 00:31–00:42 | hoch |
| Dead Bugs | Dead Bug | `dead_bug` | Vorhanden | – | W1 T7, T2 00:12–00:20 | hoch |
| Kneeling Single-Arm Lat Pulldown | Einarmiges Latziehen am Kabel, kniend | `lat_pulldown_single_arm` | Vorhanden | Aufgenommen in Schritt B (18.10.2026): Latissimus, Kabel, je Seite, Gewicht × Wiederholungen | W1 T6, T2 00:01–00:08 | mittel |
| Close Grip Bench Press | Enges Bankdrücken | `close_grip_bench_press` | Vorhanden | Xeela führt die Übung unter Brust, die Bibliothek unter Trizeps | W1 T4, T1 00:19–00:27 | hoch |
| Chest Fly With Push | Fliegende am Kabel | `cable_fly` | Unklar | Produktinhaber konnte die Ausführung nicht einordnen (18.10.2026); bleibt Fliegende am Kabel mit Hinweis „Zuordnung unsicher“ | W1 T6, T2 00:01–00:08 | niedrig |
| Decline Cable Fly | Fliegende am Kabel | `cable_fly` | Variante | Hinweis „von oben nach unten“; Alias „Decline Cable Fly“ | W2 T10, T2 00:28–00:33 | hoch |
| Incline Cable Fly | Fliegende am Kabel | `cable_fly` | Variante | Hinweis „von unten nach oben“; Alias „Incline Cable Fly“ | W3 T17, T3 00:28–00:34 | hoch |
| Incline Dumbbell Skull Crushers | French Press mit Kurzhanteln | `skull_crusher_dumbbell` | Vorhanden | Aufgenommen in Schritt B (18.10.2026): Trizeps, Kurzhanteln und Bank; Hinweis „auf der Schrägbank“ | W3 T18, T3 00:38–00:41; T4 00:00–00:04 | hoch |
| EZ Bar Skull Crushers | French Press mit SZ-Stange | `skull_crusher` | Vorhanden | Alias „Skull Crusher“ | W2 T11, T2 00:36–00:41 | hoch |
| Incline EZ Bar Skull Crushers | French Press mit SZ-Stange | `skull_crusher` | Variante | Hinweis „auf der Schrägbank“ | W2 T13, T3 00:08–00:12 | hoch |
| Spider Cable Front Raise | Frontheben am Kabel | `front_raise_cable` | Vorhanden | Aufgenommen in Schritt B (18.10.2026): Vordere Schulter, Kabel; Hinweis „Brust auf der Schrägbank aufgelegt“ | W3 T20, T4 00:20–00:23 | mittel |
| Seated Front Lateral Raise | Frontheben mit Kurzhanteln | `front_raise_dumbbell` | Variante | Laut Produktinhaber (18.10.2026) Frontheben; Hinweis „sitzend“ | W2 T11, T2 00:36–00:41 | hoch |
| Heel-Elevated Goblet Squats | Goblet Squat | `goblet_squat` | Variante | Hinweis „Fersen erhöht“ | W1 T5, T1 00:31–00:42 | hoch |
| Rope Hammer Curl | Hammercurls am Kabel mit Seil | `hammer_curl_cable` | Vorhanden | Aufgenommen in Schritt B (18.10.2026): Bizeps und Unterarme, Kabel | W1 T6, T2 00:01–00:08 | hoch |
| Heel Taps | Heel Taps | `heel_tap` | Vorhanden | Aufgenommen in Schritt B (18.10.2026): Rumpf (seitlich), Körpergewicht, nur Wiederholungen | W1 T7, T2 00:12–00:20 | hoch |
| Dumbbell Hip Thrust | Hip Thrust mit Kurzhantel | `hip_thrust_dumbbell` | Vorhanden | Aufgenommen in Schritt B (18.10.2026): Gesäß, Kurzhantel und Bank (Bibliothek hat Langhantel und Maschine) | W1 T7, T2 00:12–00:20 | hoch |
| Pull-Ups | Klimmzüge mit Unterstützung | `assisted_pull_up` | Vorhanden | Laut Produktinhaber (18.10.2026) an der Maschine mit Gegengewicht (Entlastung × Wiederholungen, D-241) | W2 T10, T2 00:28–00:33 | hoch |
| Barbell Back Squats | Kniebeuge mit Langhantel | `back_squat_barbell` | Vorhanden | – | W1 T5, T1 00:31–00:42 | hoch |
| Knee Raises | Knieheben stehend | `standing_knee_raise` | Vorhanden | Aufgenommen in Schritt B (18.10.2026). Laut Produktinhaber (18.10.2026) stehend; neu: Rumpf, Körpergewicht, nur Wiederholungen | W2 T12, T2 00:45; T3 00:00–00:04 | hoch |
| Wide Grip Lat Pulldown | Latziehen | `lat_pulldown` | Vorhanden | Weiter Griff ist die Standardausführung; Alias „Wide Grip Lat Pulldown“ | W4 T24, T4 00:39–00:41 (Lücke 00:40 mit 6 B/s geschlossen) | hoch |
| Close Grip Lat Pulldown | Latziehen, enger Griff | `lat_pulldown_close` | Vorhanden | – | W1 T1, player 00:00–00:02; T1 Liste | hoch |
| Cardio Treadmill | Laufband | `treadmill` | Vorhanden | Dauer und Distanz (D-241); im Programm nur die Dauer 30 min vorgegeben | W1 T1, player 00:00–00:02; T1 Liste | hoch |
| Close Grip Push-Up | Liegestütze | `push_up` | Variante | Hinweis „enge Handstellung“; Alias „Close Grip Push-Up“ | W1 T6, T2 00:01–00:08 | hoch |
| Push-Ups | Liegestütze | `push_up` | Vorhanden | – | W3 T17, T3 00:28–00:34 | hoch |
| Cable Hip Hinge Pull-Throughs | Pull-Throughs am Kabel | `cable_pull_through` | Vorhanden | Aufgenommen in Schritt B (18.10.2026): Gesäß und Oberschenkel hinten, Kabel | W1 T5, T1 00:31–00:42 | hoch |
| Reverse Grip EZ Bar Curls | Reverse Curls mit SZ-Stange | `reverse_curl_ez_bar` | Vorhanden | Aufgenommen in Schritt B (18.10.2026): Unterarme und Bizeps, SZ-Stange | W2 T13, T3 00:08–00:12 | hoch |
| Bent-Over Dumbbell Rear Delt Fly | Reverse Flys mit Kurzhanteln | `reverse_fly_dumbbell` | Vorhanden | Alias „Rear Delt Fly“ | W2 T11, T2 00:36–00:41 | hoch |
| Underhand Cable Rows | Rudern am Kabel, sitzend | `seated_cable_row` | Variante | Hinweis „Untergriff“; Alias „Underhand Cable Row“ | W3 T17, T3 00:28–00:34 | hoch |
| Wide Grip Cable Rows | Rudern am Kabel, sitzend | `seated_cable_row` | Variante | Hinweis „weiter Griff“; Alias „Wide Grip Cable Row“ | W3 T20, T4 00:20–00:23 | hoch |
| Smith Machine Row | Rudern an der Multipresse, vorgebeugt | `bent_over_row_smith` | Vorhanden | Aufgenommen in Schritt B (18.10.2026): Oberer Rücken und Latissimus, Multipresse (Regel: jede Gerätevariante eigene Übung) | W2 T10, T2 00:28–00:33 | mittel |
| Dumbbell Romanian Deadlifts | Rumänisches Kreuzheben mit Kurzhanteln | `romanian_deadlift_dumbbell` | Vorhanden | – | W1 T7, T2 00:12–00:20 | hoch |
| Barbell Romanian Deadlift | Rumänisches Kreuzheben mit Langhantel | `romanian_deadlift_barbell` | Vorhanden | – | W1 T5, T1 00:31–00:42 | hoch |
| Russian Twists | Russian Twist | `russian_twist` | Vorhanden | – | W2 T14, T3 00:18–00:22 | hoch |
| Incline Dumbbell Curls | Schrägbank-Curls mit Kurzhanteln | `incline_curl_dumbbell` | Vorhanden | – | W2 T11, T2 00:36–00:41 | hoch |
| Incline Cable Chest Press | Schrägbankdrücken am Kabel | `incline_press_cable` | Vorhanden | Aufgenommen in Schritt B (18.10.2026): Brust, Kabel und Bank, Gewicht × Wiederholungen; Alias „Incline Cable Press“ | W1 T1, player 00:00–00:02; T1 Liste | mittel |
| Alternating Incline Dumbbell Press | Schrägbankdrücken mit Kurzhanteln | `incline_bench_press_dumbbell` | Variante | Hinweis „wechselseitig“ | W2 T13, T3 00:08–00:12 | hoch |
| Machine Shoulder Press | Schulterdrücken an der Maschine | `shoulder_press_machine` | Vorhanden | – | W1 T4, T1 00:19–00:27 | hoch |
| Standing Alternating Shoulder Press | Schulterdrücken mit Kurzhanteln, stehend | `shoulder_press_dumbbell_standing` | Vorhanden | Aufgenommen in Schritt B (18.10.2026): Vordere Schulter, Kurzhanteln (Bibliothek hat nur „sitzend“); Hinweis „wechselseitig“ | W4 T25, T4 00:45; T5 00:00–00:02 | mittel |
| Dual Dumbbell Preacher Curls | Scottcurls mit Kurzhanteln | `preacher_curl_dumbbell` | Vorhanden | Aufgenommen in Schritt B (18.10.2026): Bizeps, Kurzhanteln und Bank (Bibliothek hat nur SZ-Stange) | W2 T11, T2 00:36–00:41 | mittel |
| Arm Cable Lateral Raise | Seitheben am Kabel | `lateral_raise_cable` | Vorhanden | Name in Xeela vermutlich abgeschnitten („Single-Arm …“); einarmig ist die übliche Ausführung | W1 T4, T1 00:19–00:27 | hoch |
| Seated Dumbbell Lateral Raise (with hold) | Seitheben mit Kurzhanteln | `lateral_raise_dumbbell` | Variante | Hinweis „sitzend, mit Halten“ | W5 T32, T5 00:36–00:39 | hoch |
| Spider Dumbbell Lateral Raise | Seitheben mit Kurzhanteln | `lateral_raise_dumbbell` | Variante | Hinweis „Brust auf der Schrägbank aufgelegt“; Alias „Spider Lateral Raise“ | W1 T6, T2 00:01–00:08 | mittel |
| Sit-Ups | Sit-ups | `sit_up` | Vorhanden | Aufgenommen in Schritt B (18.10.2026): Rumpf, Körpergewicht, nur Wiederholungen | W3 T19, T4 00:11–00:15 | hoch |
| T-Bar Row | T-Bar-Rudern | `t_bar_row` | Vorhanden | – | W1 T1, player 00:00–00:02; T1 Liste | hoch |
| Cable Tricep Pushdown (3-Second Eccentric) | Trizepsdrücken am Kabel | `triceps_pushdown_cable` | Variante | Hinweis „3 s senken“ (Tempo, TS-20 ist später vorgesehen; bis dahin Text im Programm) | W1 T4, T1 00:19–00:27 | hoch |
| Single Arm Cable Tricep Extension | Trizepsdrücken am Kabel | `triceps_pushdown_cable` | Variante | Hinweis „einarmig“ | W3 T18, T3 00:38–00:41; T4 00:00–00:04 | mittel |
| Cross-Body Cable Extensions | Trizepsdrücken am Kabel, über Kreuz | `triceps_extension_cable_cross_body` | Vorhanden | Aufgenommen in Schritt B (18.10.2026): Trizeps, Kabel, je Seite | W2 T11, T2 00:36–00:41 | mittel |
| Single-Arm Cross-Body Cable Extension | Trizepsdrücken am Kabel, über Kreuz | `triceps_extension_cable_cross_body` | Vorhanden | Aufgenommen in Schritt B (18.10.2026). Gleiche neue Übung wie „Cross-Body Cable Extensions“ | W6 T41, T7 00:03–00:06 (Übungen 2, 3 mit 6 B/s bestätigt) | mittel |
| Overhead Cable Tricep Extention | Trizepsstrecken über Kopf am Kabel | `overhead_extension_cable` | Vorhanden | Tippfehler „Extention“ stammt aus Xeela | W3 T20, T4 00:20–00:23 | hoch |
| Seated Single-Arm Dumbbell Extensions | Trizepsstrecken über Kopf mit Kurzhantel | `overhead_extension_dumbbell` | Variante | Hinweis „sitzend, einarmig“ | W4 T25, T4 00:45; T5 00:00–00:02 | hoch |
| Plank | Unterarmstütz (Plank) | `plank` | Vorhanden | Dauer (Erfassungsart Zeit) | W2 T12, T2 00:45; T3 00:00–00:04 | hoch |
| Leg press Calf Raise | Wadenheben an der Beinpresse | `calf_press_leg_press` | Vorhanden | – | W2 T12, T2 00:45; T3 00:00–00:04 | hoch |
| Dumbbell Calf Raises | Wadenheben mit Kurzhanteln | `calf_raise_dumbbell` | Vorhanden | Aufgenommen in Schritt B (18.10.2026): Waden, Kurzhanteln | W1 T7, T2 00:12–00:20 | hoch |
| Calf Raise Machine | Wadenheben sitzend | `seated_calf_raise` | Vorhanden | Laut Produktinhaber (18.10.2026) sitzend | W1 T5, T1 00:31–00:42 | hoch |
| Windshield Wipers | Windshield Wipers | `windshield_wiper` | Vorhanden | Aufgenommen in Schritt B (18.10.2026): Rumpf (seitlich), Körpergewicht, nur Wiederholungen | W3 T19, T4 00:11–00:15 | hoch |
| Single-Arm Cable Pullover | Überzüge am Kabel | `straight_arm_pulldown` | Variante | Hinweis „einarmig“; Alias „Cable Pullover“. Eigene Übung, falls der Verlauf getrennt sein soll (offene Frage) | W2 T10, T2 00:28–00:33 | mittel |
| Straight-Arm Lat Pulldown | Überzüge am Kabel | `straight_arm_pulldown` | Vorhanden | Alias „Straight-Arm Pulldown“ | W3 T17, T3 00:28–00:34 | hoch |

## 6. Trainingstage

Je Tag: Muskelgruppe und Name wie in Xeela angezeigt, Sätze × Wiederholungen oder Dauer, Pause nach dem Satz in Sekunden. „Quelle“ nennt Teil und Zeitstempel der Aufnahme, an dem die Werte gelesen wurden (T1 bis T8; „player“ ist das Player-Video). Ruhetage je Woche aus `restDaysByWeek`.

### Woche 1

Ruhetage: Tag 2, 3. Trainingstage: 1, 4, 5, 6, 7.

**Tag 1 · Chest and Back (Brust und Rücken)** · 6 Übungen, 16 Sätze · Quelle: player 00:00–00:02; T1 Liste

| # | Muskel | Übung (Xeela) | Sätze | Wdh. / Dauer | Pause s |
|---|---|---|---|---|---|
| 1 | Brust | Alternating Flat Dumbbell Press | 3 | 10 | 90 |
| 2 | Latissimus | T-Bar Row | 3 | 10 | 90 |
| 3 | Brust | Incline Cable Chest Press | 3 | 12 | 90 |
| 4 | Latissimus | Close Grip Lat Pulldown | 3 | 12 | 75 |
| 5 | Brust | Chest Fly Machine | 3 | 15 | 75 |
| 6 | Kondition | Cardio Treadmill | 1 | 30:00 min | 0 |

**Tag 4 · Shoulders and Arms (Schultern und Arme)** · 7 Übungen, 19 Sätze · Quelle: T1 00:19–00:27

| # | Muskel | Übung (Xeela) | Sätze | Wdh. / Dauer | Pause s |
|---|---|---|---|---|---|
| 1 | Schultern | Machine Shoulder Press | 3 | 10 | 90 |
| 2 | Schultern | Arm Cable Lateral Raise | 3 | 15 | 60 |
| 3 | Bizeps | Alternating Dumbbell Curl With Hold | 3 | 10 | 75 |
| 4 | Brust | Close Grip Bench Press | 3 | 12 | 75 |
| 5 | Bizeps | Cable Bayesian Curl | 3 | 15 | 75 |
| 6 | Trizeps | Cable Tricep Pushdown (3-Second Eccentric) | 3 | 12 | 75 |
| 7 | Kondition | Cardio Treadmill | 1 | 30:00 min | 0 |

**Tag 5 · Legs and Abs (Beine und Bauch)** · 8 Übungen, 22 Sätze · Quelle: T1 00:31–00:42

| # | Muskel | Übung (Xeela) | Sätze | Wdh. / Dauer | Pause s |
|---|---|---|---|---|---|
| 1 | Oberschenkel vorne | Barbell Back Squats | 3 | 10 | 90 |
| 2 | Oberschenkel hinten | Barbell Romanian Deadlift | 3 | 10 | 90 |
| 3 | Oberschenkel vorne | Heel-Elevated Goblet Squats | 3 | 12 | 90 |
| 4 | Oberschenkel hinten | Cable Hip Hinge Pull-Throughs | 3 | 15 | 75 |
| 5 | Waden | Calf Raise Machine | 3 | 15 | 60 |
| 6 | Bauch | Bicycles | 3 | 20 | 45 |
| 7 | Bauch | Crunches | 3 | 20 | 45 |
| 8 | Kondition | Cardio Treadmill | 1 | 30:00 min | 0 |

**Tag 6 · Upper Body (Oberkörper)** · 6 Übungen, 16 Sätze · Quelle: T2 00:01–00:08

| # | Muskel | Übung (Xeela) | Sätze | Wdh. / Dauer | Pause s |
|---|---|---|---|---|---|
| 1 | Latissimus | Kneeling Single-Arm Lat Pulldown | 3 | 10 | 75 |
| 2 | Brust | Chest Fly With Push | 3 | 12 | 75 |
| 3 | Schultern | Spider Dumbbell Lateral Raise | 3 | 15 | 75 |
| 4 | Bizeps | Rope Hammer Curl | 3 | 12 | 60 |
| 5 | Trizeps | Close Grip Push-Up | 3 | 15 | 75 |
| 6 | Kondition | Cardio Treadmill | 1 | 30:00 min | 0 |

**Tag 7 · Lower Body and Abs (Unterkörper und Bauch)** · 8 Übungen, 22 Sätze · Quelle: T2 00:12–00:20

| # | Muskel | Übung (Xeela) | Sätze | Wdh. / Dauer | Pause s |
|---|---|---|---|---|---|
| 1 | Oberschenkel hinten | Dumbbell Romanian Deadlifts | 3 | 12 | 90 |
| 2 | Oberschenkel vorne | Alternating Dumbbell Lunges | 3 | 12 | 90 |
| 3 | Gesäß | Dumbbell Hip Thrust | 3 | 15 | 75 |
| 4 | Oberschenkel vorne | Single Leg Press Machine | 3 | 15 | 75 |
| 5 | Waden | Dumbbell Calf Raises | 3 | 12 | 60 |
| 6 | Bauch | Dead Bugs | 3 | 20 | 45 |
| 7 | Bauch seitlich | Heel Taps | 3 | 00:45 s | 45 |
| 8 | Kondition | Cardio Treadmill | 1 | 30:00 min | 0 |

### Woche 2

Ruhetage: Tag 8, 9. Trainingstage: 10, 11, 12, 13, 14.

**Tag 10 · Chest and Back (Brust und Rücken)** · 6 Übungen, 16 Sätze · Quelle: T2 00:28–00:33

| # | Muskel | Übung (Xeela) | Sätze | Wdh. / Dauer | Pause s |
|---|---|---|---|---|---|
| 1 | Brust | Incline Cable Chest Press | 3 | 10 | 90 |
| 2 | Latissimus | Pull-Ups | 3 | 10 | 90 |
| 3 | Latissimus | Smith Machine Row | 3 | 12 | 90 |
| 4 | Latissimus | Single-Arm Cable Pullover | 3 | 15 | 60 |
| 5 | Brust | Decline Cable Fly | 3 | 15 | 75 |
| 6 | Kondition | Cardio Treadmill | 1 | 30:00 min | 0 |

**Tag 11 · Shoulders and Arms (Schultern und Arme)** · 7 Übungen, 19 Sätze · Quelle: T2 00:36–00:41

| # | Muskel | Übung (Xeela) | Sätze | Wdh. / Dauer | Pause s |
|---|---|---|---|---|---|
| 1 | Schultern | Seated Front Lateral Raise | 3 | 10 | 90 |
| 2 | Schultern | Bent-Over Dumbbell Rear Delt Fly | 3 | 15 | 75 |
| 3 | Bizeps | Dual Dumbbell Preacher Curls | 3 | 12 | 75 |
| 4 | Trizeps | EZ Bar Skull Crushers | 3 | 12 | 75 |
| 5 | Bizeps | Incline Dumbbell Curls | 3 | 15 | 75 |
| 6 | Trizeps | Cross-Body Cable Extensions | 3 | 15 | 75 |
| 7 | Kondition | Cardio Treadmill | 1 | 30:00 min | 0 |

**Tag 12 · Legs and Abs (Beine und Bauch)** · 7 Übungen, 21 Sätze · Quelle: T2 00:45; T3 00:00–00:04

| # | Muskel | Übung (Xeela) | Sätze | Wdh. / Dauer | Pause s |
|---|---|---|---|---|---|
| 1 | Oberschenkel vorne | Leg Press Machine | 3 | 12 | 90 |
| 2 | Waden | Leg press Calf Raise | 3 | 15 | 60 |
| 3 | Oberschenkel hinten | Cable Hip Hinge Pull-Throughs | 3 | 15 | 75 |
| 4 | Oberschenkel vorne | Quad Extentions | 3 | 15 | 90 |
| 5 | Oberschenkel hinten | Lying Hamstring Curls | 3 | 12 | 75 |
| 6 | Bauch | Knee Raises | 3 | 15 | 45 |
| 7 | Bauch | Plank | 3 | 00:45 s | 45 |

**Tag 13 · Upper Body (Oberkörper)** · 6 Übungen, 16 Sätze · Quelle: T3 00:08–00:12

| # | Muskel | Übung (Xeela) | Sätze | Wdh. / Dauer | Pause s |
|---|---|---|---|---|---|
| 1 | Brust | Alternating Incline Dumbbell Press | 3 | 10 | 90 |
| 2 | Latissimus | T-Bar Row | 3 | 10 | 90 |
| 3 | Schultern | Arm Cable Lateral Raise | 3 | 12 | 60 |
| 4 | Bizeps | Reverse Grip EZ Bar Curls | 3 | 15 | 60 |
| 5 | Trizeps | Incline EZ Bar Skull Crushers | 3 | 15 | 75 |
| 6 | Kondition | Cardio Treadmill | 1 | 30:00 min | 0 |

**Tag 14 · Lower Body and Abs (Unterkörper und Bauch)** · 8 Übungen, 24 Sätze · Quelle: T3 00:18–00:22

| # | Muskel | Übung (Xeela) | Sätze | Wdh. / Dauer | Pause s |
|---|---|---|---|---|---|
| 1 | Oberschenkel hinten | Barbell Romanian Deadlift | 3 | 10 | 90 |
| 2 | Oberschenkel vorne | Single-Leg Quad Extension | 3 | 15 | 75 |
| 3 | Gesäß | Dumbbell Hip Thrust | 3 | 12 | 75 |
| 4 | Oberschenkel vorne | Alternating Dumbbell Lunges | 3 | 10 | 90 |
| 5 | Waden | Calf Raise Machine | 3 | 15 | 60 |
| 6 | Bauch | Leg Raises | 3 | 15 | 45 |
| 7 | Bauch seitlich | Russian Twists | 3 | 00:45 s | 45 |
| 8 | Kondition | Cardio Treadmill | 3 | 30:00 min | 0 |

### Woche 3

Ruhetage: Tag 15, 16. Trainingstage: 17, 18, 19, 20, 21.

**Tag 17 · Chest and Back (Brust und Rücken)** · 6 Übungen, 16 Sätze · Quelle: T3 00:28–00:34

| # | Muskel | Übung (Xeela) | Sätze | Wdh. / Dauer | Pause s |
|---|---|---|---|---|---|
| 1 | Brust | Flat Dumbbell Bench Press (chest) | 3 | 10 | 90 |
| 2 | Latissimus | Straight-Arm Lat Pulldown | 3 | 12 | 75 |
| 3 | Brust | Push-Ups | 3 | 15 | 75 |
| 4 | Latissimus | Underhand Cable Rows | 3 | 8 | 75 |
| 5 | Brust | Incline Cable Fly | 3 | 15 | 75 |
| 6 | Kondition | Cardio Treadmill | 1 | 30:00 min | 0 |

**Tag 18 · Shoulders and Arms (Schultern und Arme)** · 7 Übungen, 19 Sätze · Quelle: T3 00:38–00:41; T4 00:00–00:04

| # | Muskel | Übung (Xeela) | Sätze | Wdh. / Dauer | Pause s |
|---|---|---|---|---|---|
| 1 | Schultern | Machine Shoulder Press | 3 | 10 | 90 |
| 2 | Schultern | Spider Dumbbell Lateral Raise | 3 | 15 | 75 |
| 3 | Bizeps | Rope Hammer Curl | 3 | 10 | 75 |
| 4 | Trizeps | Incline Dumbbell Skull Crushers | 3 | 12 | 75 |
| 5 | Bizeps | Single-Arm High Cable Curls | 3 | 15 | 60 |
| 6 | Trizeps | Single Arm Cable Tricep Extension | 3 | 15 | 60 |
| 7 | Kondition | Cardio Treadmill | 1 | 30:00 min | 0 |

**Tag 19 · Legs and Abs (Beine und Bauch)** · 7 Übungen, 19 Sätze · Quelle: T4 00:11–00:15

| # | Muskel | Übung (Xeela) | Sätze | Wdh. / Dauer | Pause s |
|---|---|---|---|---|---|
| 1 | Oberschenkel vorne | Alternating Dumbbell Lunges | 3 | 10 | 75 |
| 2 | Oberschenkel hinten | Dumbbell Romanian Deadlifts | 3 | 12 | 90 |
| 3 | Oberschenkel vorne | Heel-Elevated Goblet Squats | 3 | 10 | 90 |
| 4 | Waden | Calf Raise Machine | 3 | 12 | 60 |
| 5 | Bauch | Sit-Ups | 3 | 15 | 45 |
| 6 | Bauch seitlich | Windshield Wipers | 3 | 12 | 45 |
| 7 | Kondition | Cardio Treadmill | 1 | 30:00 min | 0 |

**Tag 20 · Upper Body (Oberkörper)** · 6 Übungen, 16 Sätze · Quelle: T4 00:20–00:23

| # | Muskel | Übung (Xeela) | Sätze | Wdh. / Dauer | Pause s |
|---|---|---|---|---|---|
| 1 | Brust | Incline Cable Chest Press | 3 | 10 | 90 |
| 2 | Latissimus | Wide Grip Cable Rows | 3 | 15 | 75 |
| 3 | Schultern | Spider Cable Front Raise | 3 | 12 | 60 |
| 4 | Bizeps | Single-Arm High Cable Curls | 3 | 15 | 60 |
| 5 | Trizeps | Overhead Cable Tricep Extention | 3 | 12 | 75 |
| 6 | Kondition | Cardio Treadmill | 1 | 30:00 min | 0 |

**Tag 21 · Lower Body and Abs (Unterkörper und Bauch)** · 8 Übungen, 22 Sätze · Quelle: T4 00:27–00:30

| # | Muskel | Übung (Xeela) | Sätze | Wdh. / Dauer | Pause s |
|---|---|---|---|---|---|
| 1 | Gesäß | Dumbbell Hip Thrust | 3 | 15 | 90 |
| 2 | Oberschenkel vorne | Single Leg Press Machine | 3 | 15 | 75 |
| 3 | Oberschenkel hinten | Lying Hamstring Curls | 3 | 12 | 75 |
| 4 | Oberschenkel vorne | Alternating Dumbbell Lunges | 3 | 12 | 75 |
| 5 | Waden | Dumbbell Calf Raises | 3 | 15 | 60 |
| 6 | Bauch | Leg Raises | 3 | 15 | 45 |
| 7 | Bauch | Bicycles | 3 | 20 | 45 |
| 8 | Kondition | Cardio Treadmill | 1 | 30:00 min | 0 |

### Woche 4

Ruhetage: Tag 22, 23. Trainingstage: 24, 25, 26, 27, 28.

**Tag 24 · Chest and Back (Brust und Rücken)** · 6 Übungen, 16 Sätze · Quelle: T4 00:39–00:41 (Lücke 00:40 mit 6 B/s geschlossen)

| # | Muskel | Übung (Xeela) | Sätze | Wdh. / Dauer | Pause s |
|---|---|---|---|---|---|
| 1 | Latissimus | Smith Machine Row | 3 | 10 | 90 |
| 2 | Brust | Alternating Incline Dumbbell Press | 3 | 8 | 75 |
| 3 | Latissimus | Kneeling Single-Arm Lat Pulldown | 3 | 12 | 75 |
| 4 | Brust | Push-Ups | 3 | 15 | 75 |
| 5 | Latissimus | Wide Grip Lat Pulldown | 3 | 15 | 75 |
| 6 | Kondition | Cardio Treadmill | 1 | 30:00 min | 0 |

**Tag 25 · Shoulders and Arms (Schultern und Arme)** · 7 Übungen, 19 Sätze · Quelle: T4 00:45; T5 00:00–00:02

| # | Muskel | Übung (Xeela) | Sätze | Wdh. / Dauer | Pause s |
|---|---|---|---|---|---|
| 1 | Schultern | Standing Alternating Shoulder Press | 3 | 10 | 90 |
| 2 | Schultern | Arm Cable Lateral Raise | 3 | 15 | 60 |
| 3 | Bizeps | Alternating Dumbbell Curl With Hold | 3 | 12 | 75 |
| 4 | Trizeps | Cross-Body Cable Extensions | 3 | 15 | 75 |
| 5 | Bizeps | Rope Hammer Curl | 3 | 10 | 75 |
| 6 | Trizeps | Seated Single-Arm Dumbbell Extensions | 3 | 12 | 60 |
| 7 | Kondition | Cardio Treadmill | 1 | 30:00 min | 0 |

**Tag 26 · Legs and Abs (Beine und Bauch)** · 8 Übungen, 22 Sätze · Quelle: T5 00:06–00:11

| # | Muskel | Übung (Xeela) | Sätze | Wdh. / Dauer | Pause s |
|---|---|---|---|---|---|
| 1 | Oberschenkel vorne | Leg Press Machine | 3 | 10 | 90 |
| 2 | Waden | Leg press Calf Raise | 3 | 15 | 60 |
| 3 | Oberschenkel hinten | Barbell Romanian Deadlift | 3 | 12 | 90 |
| 4 | Oberschenkel hinten | Cable Hip Hinge Pull-Throughs | 3 | 12 | 75 |
| 5 | Oberschenkel vorne | Quad Extentions | 3 | 15 | 75 |
| 6 | Bauch | Crunches | 3 | 20 | 45 |
| 7 | Bauch | Plank | 3 | 00:45 s | 45 |
| 8 | Kondition | Cardio Treadmill | 1 | 30:00 min | 0 |

**Tag 27 · Upper Body (Oberkörper)** · 6 Übungen, 16 Sätze · Quelle: T5 00:15–00:17 (Titel und Übung 3 mit 6 B/s bestätigt)

| # | Muskel | Übung (Xeela) | Sätze | Wdh. / Dauer | Pause s |
|---|---|---|---|---|---|
| 1 | Brust | Flat Dumbbell Bench Press (chest) | 3 | 10 | 90 |
| 2 | Latissimus | Close Grip Lat Pulldown | 3 | 10 | 90 |
| 3 | Schultern | Bent-Over Dumbbell Rear Delt Fly | 3 | 15 | 60 |
| 4 | Bizeps | Dual Dumbbell Preacher Curls | 3 | 15 | 75 |
| 5 | Trizeps | Overhead Cable Tricep Extention | 3 | 12 | 75 |
| 6 | Kondition | Cardio Treadmill | 1 | 30:00 min | 0 |

**Tag 28 · Lower Body and Abs (Unterkörper und Bauch)** · 8 Übungen, 22 Sätze · Quelle: T5 00:20–00:22 (Übungen 2, 5, 6 mit 6 B/s bestätigt)

| # | Muskel | Übung (Xeela) | Sätze | Wdh. / Dauer | Pause s |
|---|---|---|---|---|---|
| 1 | Oberschenkel hinten | Dumbbell Romanian Deadlifts | 3 | 15 | 90 |
| 2 | Oberschenkel vorne | Single-Leg Quad Extension | 3 | 15 | 75 |
| 3 | Gesäß | Dumbbell Hip Thrust | 3 | 12 | 75 |
| 4 | Oberschenkel vorne | Alternating Dumbbell Lunges | 3 | 12 | 90 |
| 5 | Waden | Dumbbell Calf Raises | 3 | 15 | 60 |
| 6 | Bauch seitlich | Heel Taps | 3 | 00:45 s | 45 |
| 7 | Bauch | Plank | 3 | 00:45 s | 45 |
| 8 | Kondition | Cardio Treadmill | 1 | 30:00 min | 0 |

### Woche 5

Ruhetage: Tag 29, 30. Trainingstage: 31, 32, 33, 34, 35.

**Tag 31 · Chest and Back (Brust und Rücken)** · 6 Übungen, 16 Sätze · Quelle: T5 00:30–00:33 (Übungen 3, 4 mit 6 B/s bestätigt)

| # | Muskel | Übung (Xeela) | Sätze | Wdh. / Dauer | Pause s |
|---|---|---|---|---|---|
| 1 | Brust | Incline Cable Chest Press | 3 | 12 | 90 |
| 2 | Latissimus | T-Bar Row | 3 | 10 | 90 |
| 3 | Brust | Decline Cable Fly | 3 | 12 | 75 |
| 4 | Latissimus | Kneeling Single-Arm Lat Pulldown | 3 | 12 | 75 |
| 5 | Brust | Chest Fly Machine | 3 | 15 | 75 |
| 6 | Kondition | Cardio Treadmill | 1 | 30:00 min | 0 |

**Tag 32 · Shoulders and Arms (Schultern und Arme)** · 7 Übungen, 19 Sätze · Quelle: T5 00:36–00:39

| # | Muskel | Übung (Xeela) | Sätze | Wdh. / Dauer | Pause s |
|---|---|---|---|---|---|
| 1 | Schultern | Machine Shoulder Press | 3 | 10 | 90 |
| 2 | Schultern | Seated Dumbbell Lateral Raise (with hold) | 3 | 15 | 75 |
| 3 | Brust | Close Grip Bench Press | 3 | 12 | 75 |
| 4 | Bizeps | Single-Arm High Cable Curls | 3 | 15 | 60 |
| 5 | Trizeps | Cable Tricep Pushdown (3-Second Eccentric) | 3 | 12 | 75 |
| 6 | Bizeps | Incline Dumbbell Curls | 3 | 12 | 60 |
| 7 | Kondition | Cardio Treadmill | 1 | 30:00 min | 0 |

**Tag 33 · Legs and Abs (Beine und Bauch)** · 8 Übungen, 22 Sätze · Quelle: T6 00:00–00:03

| # | Muskel | Übung (Xeela) | Sätze | Wdh. / Dauer | Pause s |
|---|---|---|---|---|---|
| 1 | Oberschenkel vorne | Barbell Back Squats | 3 | 10 | 90 |
| 2 | Oberschenkel hinten | Lying Hamstring Curls | 3 | 15 | 75 |
| 3 | Oberschenkel vorne | Single-Leg Quad Extension | 3 | 15 | 75 |
| 4 | Oberschenkel hinten | Cable Hip Hinge Pull-Throughs | 3 | 12 | 75 |
| 5 | Waden | Calf Raise Machine | 3 | 15 | 60 |
| 6 | Bauch | Knee Raises | 3 | 15 | 45 |
| 7 | Bauch seitlich | Russian Twists | 3 | 00:45 s | 45 |
| 8 | Kondition | Cardio Treadmill | 1 | 30:00 min | 0 |

**Tag 34 · Upper Body (Oberkörper)** · 6 Übungen, 16 Sätze · Quelle: T6 00:09–00:11

| # | Muskel | Übung (Xeela) | Sätze | Wdh. / Dauer | Pause s |
|---|---|---|---|---|---|
| 1 | Brust | Alternating Flat Dumbbell Press | 3 | 10 | 90 |
| 2 | Latissimus | Smith Machine Row | 3 | 12 | 90 |
| 3 | Schultern | Spider Dumbbell Lateral Raise | 3 | 15 | 75 |
| 4 | Bizeps | Reverse Grip EZ Bar Curls | 3 | 12 | 60 |
| 5 | Trizeps | Cross-Body Cable Extensions | 3 | 15 | 60 |
| 6 | Kondition | Cardio Treadmill | 1 | 30:00 min | 0 |

**Tag 35 · Lower Body and Abs (Unterkörper und Bauch)** · 8 Übungen, 22 Sätze · Quelle: T6 00:14–00:16 (Übungen 2, 3 mit 6 B/s bestätigt)

| # | Muskel | Übung (Xeela) | Sätze | Wdh. / Dauer | Pause s |
|---|---|---|---|---|---|
| 1 | Oberschenkel hinten | Barbell Romanian Deadlift | 3 | 12 | 90 |
| 2 | Oberschenkel vorne | Alternating Dumbbell Lunges | 3 | 12 | 75 |
| 3 | Gesäß | Dumbbell Hip Thrust | 3 | 15 | 75 |
| 4 | Oberschenkel vorne | Single Leg Press Machine | 3 | 15 | 75 |
| 5 | Waden | Dumbbell Calf Raises | 3 | 15 | 60 |
| 6 | Bauch | Leg Raises | 3 | 15 | 45 |
| 7 | Bauch | Sit-Ups | 3 | 15 | 45 |
| 8 | Kondition | Cardio Treadmill | 1 | 30:00 min | 0 |

### Woche 6

Ruhetage: Tag 36, 37. Trainingstage: 38, 39, 40, 41, 42.

**Tag 38 · Chest and Back (Brust und Rücken)** · 6 Übungen, 16 Sätze · Quelle: T6 00:25–00:28

| # | Muskel | Übung (Xeela) | Sätze | Wdh. / Dauer | Pause s |
|---|---|---|---|---|---|
| 1 | Brust | Alternating Flat Dumbbell Press | 3 | 8 | 90 |
| 2 | Latissimus | Underhand Cable Rows | 3 | 12 | 75 |
| 3 | Brust | Incline Cable Chest Press | 3 | 12 | 75 |
| 4 | Latissimus | Close Grip Lat Pulldown | 3 | 15 | 75 |
| 5 | Latissimus | Straight-Arm Lat Pulldown | 3 | 15 | 60 |
| 6 | Kondition | Cardio Treadmill | 1 | 30:00 min | 0 |

**Tag 39 · Shoulders and Arms (Schultern und Arme)** · 7 Übungen, 19 Sätze · Quelle: T6 00:32–00:38

| # | Muskel | Übung (Xeela) | Sätze | Wdh. / Dauer | Pause s |
|---|---|---|---|---|---|
| 1 | Schultern | Seated Front Lateral Raise | 3 | 10 | 90 |
| 2 | Schultern | Bent-Over Dumbbell Rear Delt Fly | 3 | 15 | 75 |
| 3 | Bizeps | Rope Hammer Curl | 3 | 12 | 75 |
| 4 | Trizeps | EZ Bar Skull Crushers | 3 | 12 | 75 |
| 5 | Bizeps | Dual Dumbbell Preacher Curls | 3 | 15 | 75 |
| 6 | Trizeps | Overhead Cable Tricep Extention | 3 | 15 | 75 |
| 7 | Kondition | Cardio Treadmill | 1 | 30:00 min | 0 |

**Tag 40 · Legs and Abs (Beine und Bauch)** · 8 Übungen, 22 Sätze · Quelle: T6 00:42–00:45 (Titel mit 6 B/s bestätigt)

| # | Muskel | Übung (Xeela) | Sätze | Wdh. / Dauer | Pause s |
|---|---|---|---|---|---|
| 1 | Oberschenkel vorne | Leg Press Machine | 3 | 15 | 90 |
| 2 | Oberschenkel hinten | Dumbbell Romanian Deadlifts | 3 | 10 | 90 |
| 3 | Gesäß | Dumbbell Hip Thrust | 3 | 12 | 75 |
| 4 | Oberschenkel vorne | Quad Extentions | 3 | 15 | 75 |
| 5 | Waden | Dumbbell Calf Raises | 3 | 12 | 60 |
| 6 | Bauch | Leg Raises | 3 | 15 | 45 |
| 7 | Bauch | Crunches | 3 | 20 | 45 |
| 8 | Kondition | Cardio Treadmill | 1 | 30:00 min | 0 |

**Tag 41 · Upper Body (Oberkörper)** · 6 Übungen, 16 Sätze · Quelle: T7 00:03–00:06 (Übungen 2, 3 mit 6 B/s bestätigt)

| # | Muskel | Übung (Xeela) | Sätze | Wdh. / Dauer | Pause s |
|---|---|---|---|---|---|
| 1 | Latissimus | Smith Machine Row | 3 | 10 | 75 |
| 2 | Brust | Chest Fly Machine | 3 | 15 | 75 |
| 3 | Schultern | Arm Cable Lateral Raise | 3 | 15 | 60 |
| 4 | Trizeps | Single-Arm Cross-Body Cable Extension | 3 | 12 | 60 |
| 5 | Bizeps | Alternating Dumbbell Curl With Hold | 3 | 12 | 60 |
| 6 | Kondition | Cardio Treadmill | 1 | 30:00 min | 0 |

**Tag 42 · Lower Body and Abs (Unterkörper und Bauch)** · 8 Übungen, 22 Sätze · Quelle: T7 00:08–00:11 (Titel und Übungen 1, 5, 6 mit 6 B/s bestätigt)

| # | Muskel | Übung (Xeela) | Sätze | Wdh. / Dauer | Pause s |
|---|---|---|---|---|---|
| 1 | Oberschenkel vorne | Alternating Dumbbell Lunges | 3 | 15 | 90 |
| 2 | Oberschenkel hinten | Lying Hamstring Curls | 3 | 15 | 75 |
| 3 | Gesäß | Dumbbell Hip Thrust | 3 | 15 | 75 |
| 4 | Oberschenkel vorne | Single Leg Press Machine | 3 | 12 | 75 |
| 5 | Waden | Calf Raise Machine | 3 | 15 | 60 |
| 6 | Bauch | Sit-Ups | 3 | 15 | 45 |
| 7 | Bauch | Plank | 3 | 00:45 s | 45 |
| 8 | Kondition | Cardio Treadmill | 1 | 30:00 min | 0 |

### Woche 7

Ruhetage: Tag 43, 44. Trainingstage: 45, 46, 47, 48, 49.

**Tag 45 · Chest and Back (Brust und Rücken)** · 6 Übungen, 16 Sätze · Quelle: T7 00:18–00:21 (Übung 4 mit 6 B/s bestätigt)

| # | Muskel | Übung (Xeela) | Sätze | Wdh. / Dauer | Pause s |
|---|---|---|---|---|---|
| 1 | Brust | Alternating Incline Dumbbell Press | 3 | 10 | 90 |
| 2 | Brust | Push-Ups | 3 | 15 | 75 |
| 3 | Latissimus | Kneeling Single-Arm Lat Pulldown | 3 | 10 | 75 |
| 4 | Latissimus | Wide Grip Cable Rows | 3 | 12 | 75 |
| 5 | Brust | Decline Cable Fly | 3 | 15 | 75 |
| 6 | Kondition | Cardio Treadmill | 1 | 30:00 min | 0 |

**Tag 46 · Shoulders and Arms (Schultern und Arme)** · 7 Übungen, 19 Sätze · Quelle: T7 00:25–00:27 (Titel und Übungen 1, 5 mit 6 B/s bestätigt)

| # | Muskel | Übung (Xeela) | Sätze | Wdh. / Dauer | Pause s |
|---|---|---|---|---|---|
| 1 | Schultern | Spider Cable Front Raise | 3 | 12 | 75 |
| 2 | Schultern | Bent-Over Dumbbell Rear Delt Fly | 3 | 15 | 75 |
| 3 | Bizeps | Incline Dumbbell Curls | 3 | 12 | 75 |
| 4 | Trizeps | Incline Dumbbell Skull Crushers | 3 | 10 | 75 |
| 5 | Bizeps | Cable Bayesian Curl | 3 | 10 | 90 |
| 6 | Trizeps | Cable Tricep Pushdown (3-Second Eccentric) | 3 | 12 | 75 |
| 7 | Kondition | Cardio Treadmill | 1 | 30:00 min | 0 |

**Tag 47 · Legs and Abs (Beine und Bauch)** · 8 Übungen, 22 Sätze · Quelle: T7 00:31–00:34 (Übungen 2–4 mit 6 B/s bestätigt)

| # | Muskel | Übung (Xeela) | Sätze | Wdh. / Dauer | Pause s |
|---|---|---|---|---|---|
| 1 | Oberschenkel vorne | Barbell Back Squats | 3 | 12 | 90 |
| 2 | Oberschenkel hinten | Cable Hip Hinge Pull-Throughs | 3 | 12 | 75 |
| 3 | Oberschenkel vorne | Heel-Elevated Goblet Squats | 3 | 15 | 90 |
| 4 | Oberschenkel hinten | Lying Hamstring Curls | 3 | 12 | 75 |
| 5 | Waden | Calf Raise Machine | 3 | 15 | 60 |
| 6 | Bauch | Knee Raises | 3 | 15 | 45 |
| 7 | Bauch seitlich | Heel Taps | 3 | 00:45 s | 45 |
| 8 | Kondition | Cardio Treadmill | 1 | 30:00 min | 0 |

**Tag 48 · Upper Body (Oberkörper)** · 6 Übungen, 16 Sätze · Quelle: T7 00:39–00:40; T8 00:01–00:04

| # | Muskel | Übung (Xeela) | Sätze | Wdh. / Dauer | Pause s |
|---|---|---|---|---|---|
| 1 | Brust | Incline Cable Chest Press | 3 | 10 | 90 |
| 2 | Latissimus | Smith Machine Row | 3 | 12 | 90 |
| 3 | Schultern | Seated Front Lateral Raise | 3 | 10 | 75 |
| 4 | Bizeps | Single-Arm High Cable Curls | 3 | 15 | 60 |
| 5 | Trizeps | Overhead Cable Tricep Extention | 3 | 15 | 75 |
| 6 | Kondition | Cardio Treadmill | 1 | 30:00 min | 0 |

**Tag 49 · Lower Body and Abs (Unterkörper und Bauch)** · 8 Übungen, 22 Sätze · Quelle: T8 00:07–00:10 (Titel und Übungen 1, 5 mit 6 B/s bestätigt)

| # | Muskel | Übung (Xeela) | Sätze | Wdh. / Dauer | Pause s |
|---|---|---|---|---|---|
| 1 | Oberschenkel hinten | Dumbbell Romanian Deadlifts | 3 | 10 | 90 |
| 2 | Oberschenkel vorne | Alternating Dumbbell Lunges | 3 | 15 | 90 |
| 3 | Gesäß | Dumbbell Hip Thrust | 3 | 10 | 75 |
| 4 | Oberschenkel vorne | Single Leg Press Machine | 3 | 12 | 60 |
| 5 | Waden | Dumbbell Calf Raises | 3 | 12 | 60 |
| 6 | Bauch seitlich | Russian Twists | 3 | 00:45 s | 45 |
| 7 | Bauch | Plank | 3 | 00:45 s | 45 |
| 8 | Kondition | Cardio Treadmill | 1 | 30:00 min | 0 |

### Woche 8

Ruhetage: Tag 50, 51. Trainingstage: 52, 53, 54, 55, 56.

**Tag 52 · Chest and Back (Brust und Rücken)** · 6 Übungen, 16 Sätze · Quelle: T8 00:18–00:21 (Übungen 2, 3 mit 6 B/s bestätigt)

| # | Muskel | Übung (Xeela) | Sätze | Wdh. / Dauer | Pause s |
|---|---|---|---|---|---|
| 1 | Brust | Flat Dumbbell Bench Press (chest) | 3 | 8 | 90 |
| 2 | Latissimus | Close Grip Lat Pulldown | 3 | 12 | 75 |
| 3 | Brust | Incline Cable Chest Press | 3 | 12 | 75 |
| 4 | Latissimus | Straight-Arm Lat Pulldown | 3 | 15 | 75 |
| 5 | Brust | Chest Fly Machine | 3 | 15 | 75 |
| 6 | Kondition | Cardio Treadmill | 1 | 30:00 min | 0 |

**Tag 53 · Shoulders and Arms (Schultern und Arme)** · 7 Übungen, 19 Sätze · Quelle: T8 00:23–00:26 (Übung 3 mit 6 B/s bestätigt)

| # | Muskel | Übung (Xeela) | Sätze | Wdh. / Dauer | Pause s |
|---|---|---|---|---|---|
| 1 | Schultern | Machine Shoulder Press | 3 | 8 | 90 |
| 2 | Schultern | Arm Cable Lateral Raise | 3 | 15 | 75 |
| 3 | Bizeps | Dual Dumbbell Preacher Curls | 3 | 15 | 75 |
| 4 | Trizeps | Incline EZ Bar Skull Crushers | 3 | 10 | 75 |
| 5 | Bizeps | Rope Hammer Curl | 3 | 10 | 75 |
| 6 | Trizeps | Single-Arm Cross-Body Cable Extension | 3 | 15 | 60 |
| 7 | Kondition | Cardio Treadmill | 1 | 30:00 min | 0 |

**Tag 54 · Legs and Abs (Beine und Bauch)** · 8 Übungen, 22 Sätze · Quelle: T8 00:29–00:31 (Titel und Übungen 4–6 mit 6 B/s bestätigt)

| # | Muskel | Übung (Xeela) | Sätze | Wdh. / Dauer | Pause s |
|---|---|---|---|---|---|
| 1 | Oberschenkel vorne | Heel-Elevated Goblet Squats | 3 | 10 | 90 |
| 2 | Oberschenkel hinten | Barbell Romanian Deadlift | 3 | 12 | 90 |
| 3 | Oberschenkel vorne | Single-Leg Quad Extension | 3 | 15 | 75 |
| 4 | Oberschenkel hinten | Lying Hamstring Curls | 3 | 12 | 75 |
| 5 | Waden | Calf Raise Machine | 3 | 15 | 60 |
| 6 | Bauch | Leg Raises | 3 | 15 | 45 |
| 7 | Bauch seitlich | Russian Twists | 3 | 00:45 s | 45 |
| 8 | Kondition | Cardio Treadmill | 1 | 30:00 min | 0 |

**Tag 55 · Upper Body (Oberkörper)** · 6 Übungen, 16 Sätze · Quelle: T8 00:35–00:38 (Übungen 2, 3 mit 6 B/s bestätigt)

| # | Muskel | Übung (Xeela) | Sätze | Wdh. / Dauer | Pause s |
|---|---|---|---|---|---|
| 1 | Latissimus | Kneeling Single-Arm Lat Pulldown | 3 | 12 | 75 |
| 2 | Brust | Chest Fly Machine | 3 | 10 | 90 |
| 3 | Schultern | Standing Alternating Shoulder Press | 3 | 10 | 75 |
| 4 | Bizeps | Reverse Grip EZ Bar Curls | 3 | 12 | 60 |
| 5 | Trizeps | Cross-Body Cable Extensions | 3 | 15 | 75 |
| 6 | Kondition | Cardio Treadmill | 1 | 30:00 min | 0 |

**Tag 56 · Lower Body and Abs (Unterkörper und Bauch)** · 8 Übungen, 22 Sätze · Quelle: T8 00:41–00:44 (Titel und Übungen 1–3 mit 6 B/s bestätigt)

| # | Muskel | Übung (Xeela) | Sätze | Wdh. / Dauer | Pause s |
|---|---|---|---|---|---|
| 1 | Oberschenkel vorne | Barbell Back Squats | 3 | 12 | 90 |
| 2 | Oberschenkel hinten | Lying Hamstring Curls | 3 | 15 | 75 |
| 3 | Gesäß | Dumbbell Hip Thrust | 3 | 12 | 75 |
| 4 | Oberschenkel vorne | Alternating Dumbbell Lunges | 3 | 10 | 75 |
| 5 | Waden | Dumbbell Calf Raises | 3 | 15 | 60 |
| 6 | Bauch | Plank | 3 | 01:00 min | 45 |
| 7 | Bauch | Crunches | 3 | 20 | 45 |
| 8 | Kondition | Cardio Treadmill | 1 | 30:00 min | 0 |

