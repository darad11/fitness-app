# Basisübungsbibliothek

Stand: 18.10.2026 · Version 0.2 · Status: vom Produktinhaber durchgesehen (Q-05) · Bezug: D-213, D-230, D-240, D-241, AK-EXL-01, AK-EXL-02, `sample-templates.md` Abschnitt 5

## Änderungen gegenüber Version 0.1

- Antworten des Produktinhabers vom 18.10.2026 eingearbeitet (Abschnitt 3).
- „Rudern am Kabel, enger Griff" mit „Rudern am Kabel, sitzend" zusammengelegt; die Push/Pull/Beine-Vorlage nutzt jetzt diese Übung.
- Neu: „Klimmzüge mit Unterstützung" und „Dips mit Unterstützung" mit der Erfassungsart Entlastung × Wiederholungen.
- Cardiogeräte erfassen Dauer und Distanz.
- Die Liste in Abschnitt 5 wird aus den gebündelten Daten erzeugt (`tools/exercise_library_to_md.py`); `pnpm check:docs` prüft, dass beides übereinstimmt.

## 1. Zweck

- Die Liste ist die Basisbibliothek der App. Quelle sind die gebündelten Daten `src/modules/exercises/data/core-exercises.v1.json`; Abschnitt 5 wird daraus erzeugt.
- 124 Übungen (105 aus Q-05, 19 aus dem Winter-Arc-Abgleich in Schritt B, D-248) mit deutschem Namen, Alias-Namen für die Suche (auch englisch), Haupt- und Nebenmuskeln, Gerät und Erfassungsart. Alle 39 Übungen der Beispielvorlagen sind enthalten (Spalte „Vorlage").
- Muskel- und Geräteschlüssel sowie Erfassungsarten wie in `sample-templates.md` Abschnitt 5.2.

## 2. Regeln

| Thema | Regel |
|---|---|
| Namen | „Übung mit Gerät" (z. B. „Bankdrücken mit Kurzhanteln"); verbreitete englische Namen bleiben, wo sie im Studio üblich sind (Hip Thrust, Face Pulls) |
| Varianten | Jede Gerätevariante ist eine eigene Übung, weil Gewichte nicht vergleichbar sind |
| Körpergewicht | Klimmzüge, Dips, Liegestütze und ähnliche Übungen erfassen Zusatzgewicht × Wiederholungen (0 kg = ohne Zusatzgewicht). Bauch- und Konditionsübungen ohne übliches Zusatzgewicht erfassen nur Wiederholungen oder Dauer |
| Unterstützung | Klimmzüge und Dips an der Maschine mit Gegengewicht erfassen die Entlastung in kg × Wiederholungen. Weniger Entlastung ist besser (D-241) |
| Cardiogeräte | Rudergerät, Laufband, Fahrradergometer und Crosstrainer erfassen Dauer und Distanz; das Rudergerät in Metern, die übrigen in Kilometern (D-241) |
| Je Seite | Markiert einseitige Übungen (`isUnilateral`). Es ist eine Angabe zur Übung; wie „3 je Seite" im Training gezählt wird, folgt mit den Vorlagen (AP 1.2) |
| Kategorie | Kraft (Standard), Rumpf oder Kondition; steht in der Spalte „Erfassung" nur, wenn nicht Kraft |
| Gruppe | Gliedert die Liste und die Bibliotheksansicht; gefiltert wird nach Hauptmuskeln und Gerät (AK-EXL-02) |
| Schlüssel | Dauerhaft, Kleinbuchstaben mit Unterstrich; die ID entsteht daraus per UUID v5 aus `core-exercise:<Schlüssel>` (D-240) |
| Nicht enthalten | Dehn- und Mobilitätsübungen (später) |

## 3. Rückfragen und Antworten

| Nr. | Frage | Antwort des Produktinhabers (18.10.2026) | Umsetzung |
|---|---|---|---|
| 1 | „Rudern am Kabel, sitzend" und „Rudern am Kabel, enger Griff" zusammenlegen? | Ja | Eine Übung mit Alias „enger Griff"; Push/Pull/Beine-Vorlage angepasst |
| 2 | Regel für Körpergewichtsübungen (Zusatzgewicht bei Klimmzügen, Dips, Liegestützen, Hüftheben; nur Wiederholungen bei Crunches, Beinheben, Burpees)? | Ja | Wie in Abschnitt 2 |
| 3 | Cardiogeräte: auch Distanz? | Ja, auch Distanz | Neue Erfassungsart Dauer und Distanz (D-241) |
| 4 | Unterstützte Klimmzüge und Dips an der Maschine? | Ja, werden gebraucht | Zwei neue Übungen, neue Erfassungsart Entlastung × Wiederholungen (D-241) |
| 5 | Fehlende Übungen oder andere Namen? | Vorerst nicht | – |

## 4. Übersicht

| Gruppe | Richtwert | Anzahl |
|---|---|---|
| Brust | 10 | 12 |
| Rücken | 14 | 17 |
| Schultern | 10 | 12 |
| Bizeps und Unterarme | 8 | 11 |
| Trizeps | 7 | 11 |
| Rumpf | 11 | 16 |
| Gesäß | 7 | 9 |
| Oberschenkel vorne | 9 | 11 |
| Oberschenkel hinten | 7 | 7 |
| Waden, Adduktoren, Abduktoren | 6 | 7 |
| Ganzkörper und Kondition | 8 | 11 |
| **Summe** | **97** | **124** |

## 5. Liste


### Brust

| Nr. | Name | Alias-Namen (Suche) | Hauptmuskeln | Nebenmuskeln | Gerät | Erfassung | Je Seite | Vorlage | Schlüssel |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Bankdrücken mit Langhantel | Bench Press, Flachbankdrücken | Brust | Trizeps, Vordere Schulter | Langhantel, Bank | Gewicht × Wdh. |  | ✓ | `bench_press_barbell` |
| 2 | Bankdrücken mit Kurzhanteln | Dumbbell Bench Press, KH-Bankdrücken, Alternating Dumbbell Press | Brust | Trizeps, Vordere Schulter | Kurzhantel, Bank | Gewicht × Wdh. |  | ✓ | `bench_press_dumbbell` |
| 3 | Schrägbankdrücken mit Langhantel | Incline Bench Press | Brust | Vordere Schulter, Trizeps | Langhantel, Bank | Gewicht × Wdh. |  |  | `incline_bench_press_barbell` |
| 4 | Schrägbankdrücken mit Kurzhanteln | Incline Dumbbell Press, Alternating Incline Dumbbell Press | Brust | Vordere Schulter, Trizeps | Kurzhantel, Bank | Gewicht × Wdh. |  | ✓ | `incline_bench_press_dumbbell` |
| 5 | Bankdrücken an der Multipresse | Smith Machine Bench Press | Brust | Trizeps, Vordere Schulter | Multipresse, Bank | Gewicht × Wdh. |  |  | `bench_press_smith` |
| 6 | Brustpresse an der Maschine | Chest Press, Brustpresse | Brust | Trizeps, Vordere Schulter | Maschine | Gewicht × Wdh. |  |  | `chest_press_machine` |
| 7 | Bodendrücken mit Kurzhanteln | Dumbbell Floor Press, Floor Press | Brust | Trizeps | Kurzhantel | Gewicht × Wdh. |  | ✓ | `floor_press_dumbbell` |
| 8 | Fliegende mit Kurzhanteln | Dumbbell Fly, Flys | Brust | Vordere Schulter | Kurzhantel, Bank | Gewicht × Wdh. |  |  | `fly_dumbbell` |
| 9 | Fliegende am Kabel | Cable Fly, Cable Crossover, Kabelziehen über Kreuz, Decline Cable Fly, Incline Cable Fly | Brust | Vordere Schulter | Kabelzug | Gewicht × Wdh. |  |  | `cable_fly` |
| 10 | Butterfly an der Maschine | Pec Deck, Butterfly, Chest Fly Machine | Brust | Vordere Schulter | Maschine | Gewicht × Wdh. |  |  | `pec_deck` |
| 11 | Liegestütze | Push-up, Liegestütz, Close Grip Push-Up | Brust | Trizeps, Vordere Schulter, Bauch | Körpergewicht | Gewicht × Wdh. |  | ✓ | `push_up` |
| 12 | Schrägbankdrücken am Kabel | Incline Cable Chest Press, Incline Cable Press | Brust | Trizeps, Vordere Schulter | Kabelzug, Bank | Gewicht × Wdh. |  |  | `incline_press_cable` |

### Rücken

| Nr. | Name | Alias-Namen (Suche) | Hauptmuskeln | Nebenmuskeln | Gerät | Erfassung | Je Seite | Vorlage | Schlüssel |
|---|---|---|---|---|---|---|---|---|---|
| 13 | Kreuzheben mit Langhantel | Deadlift | Unterer Rücken, Gesäß, Oberschenkel hinten | Oberschenkel vorne, Trapez, Unterarme | Langhantel | Gewicht × Wdh. |  | ✓ | `deadlift_barbell` |
| 14 | Klimmzüge | Pull-up, Klimmzug, Obergriff | Latissimus | Bizeps, Oberer Rücken | Klimmzugstange | Gewicht × Wdh. |  | ✓ | `pull_up` |
| 15 | Klimmzüge mit Unterstützung | Assisted Pull-up, Klimmzugmaschine, Gravitron, Pull-Ups | Latissimus | Bizeps, Oberer Rücken | Maschine | Entlastung × Wdh. |  |  | `assisted_pull_up` |
| 16 | Klimmzüge im Untergriff | Chin-up, Untergriff | Latissimus, Bizeps | Oberer Rücken | Klimmzugstange | Gewicht × Wdh. |  |  | `chin_up` |
| 17 | Latziehen | Lat Pulldown, Latzug, Wide Grip Lat Pulldown | Latissimus | Bizeps, Oberer Rücken | Kabelzug | Gewicht × Wdh. |  | ✓ | `lat_pulldown` |
| 18 | Latziehen, enger Griff | Close-Grip Lat Pulldown, V-Griff, Close Grip Lat Pulldown | Latissimus | Bizeps, Oberer Rücken | Kabelzug | Gewicht × Wdh. |  |  | `lat_pulldown_close` |
| 19 | Rudern am Kabel, sitzend | Seated Cable Row, Kabelrudern, enger Griff, Close-Grip Cable Row, Underhand Cable Row, Wide Grip Cable Row | Oberer Rücken, Latissimus | Bizeps, Hintere Schulter | Kabelzug | Gewicht × Wdh. |  | ✓ | `seated_cable_row` |
| 20 | Rudern mit Langhantel, vorgebeugt | Barbell Row, Bent-over Row, Langhantelrudern | Oberer Rücken, Latissimus | Bizeps, Hintere Schulter, Unterer Rücken | Langhantel | Gewicht × Wdh. |  | ✓ | `bent_over_row_barbell` |
| 21 | Rudern mit Kurzhanteln, vorgebeugt | Dumbbell Bent-over Row | Oberer Rücken, Latissimus | Bizeps, Hintere Schulter | Kurzhantel | Gewicht × Wdh. |  | ✓ | `bent_over_row_dumbbell` |
| 22 | Einarmiges Rudern mit Kurzhantel | One-Arm Dumbbell Row, Kurzhantelrudern | Latissimus, Oberer Rücken | Bizeps, Hintere Schulter | Kurzhantel, Bank | Gewicht × Wdh. | ja | ✓ | `one_arm_row_dumbbell` |
| 23 | T-Bar-Rudern | T-Bar Row | Oberer Rücken, Latissimus | Bizeps, Hintere Schulter, Unterer Rücken | Langhantel | Gewicht × Wdh. |  |  | `t_bar_row` |
| 24 | Rudern an der Maschine | Machine Row, Chest-supported Row | Oberer Rücken, Latissimus | Bizeps, Hintere Schulter | Maschine | Gewicht × Wdh. |  |  | `machine_row` |
| 25 | Überzüge am Kabel | Straight-Arm Pulldown, Pullover am Kabel, Cable Pullover | Latissimus | Trizeps | Kabelzug | Gewicht × Wdh. |  |  | `straight_arm_pulldown` |
| 26 | Rückenstrecken | Back Extension, Hyperextension, Hyperextensions | Unterer Rücken | Gesäß, Oberschenkel hinten | Maschine | Gewicht × Wdh. |  |  | `back_extension` |
| 27 | Schulterheben mit Kurzhanteln | Dumbbell Shrug, Shrugs | Trapez | Unterarme | Kurzhantel | Gewicht × Wdh. |  |  | `shrug_dumbbell` |
| 28 | Einarmiges Latziehen am Kabel, kniend | Kneeling Single-Arm Lat Pulldown, Single Arm Lat Pulldown | Latissimus | Bizeps | Kabelzug | Gewicht × Wdh. | ja |  | `lat_pulldown_single_arm` |
| 29 | Rudern an der Multipresse, vorgebeugt | Smith Machine Row | Oberer Rücken, Latissimus | Bizeps, Hintere Schulter | Multipresse | Gewicht × Wdh. |  |  | `bent_over_row_smith` |

### Schultern

| Nr. | Name | Alias-Namen (Suche) | Hauptmuskeln | Nebenmuskeln | Gerät | Erfassung | Je Seite | Vorlage | Schlüssel |
|---|---|---|---|---|---|---|---|---|---|
| 30 | Schulterdrücken mit Langhantel, stehend | Overhead Press, OHP, Military Press | Vordere Schulter | Trizeps, Seitliche Schulter | Langhantel | Gewicht × Wdh. |  | ✓ | `overhead_press_barbell` |
| 31 | Schulterdrücken mit Kurzhanteln, sitzend | Seated Dumbbell Shoulder Press | Vordere Schulter | Trizeps, Seitliche Schulter | Kurzhantel, Bank | Gewicht × Wdh. |  | ✓ | `shoulder_press_dumbbell_seated` |
| 32 | Schulterdrücken an der Maschine | Machine Shoulder Press | Vordere Schulter | Trizeps, Seitliche Schulter | Maschine | Gewicht × Wdh. |  |  | `shoulder_press_machine` |
| 33 | Arnold Press mit Kurzhanteln | Arnold Press, Arnold-Drücken | Vordere Schulter, Seitliche Schulter | Trizeps | Kurzhantel, Bank | Gewicht × Wdh. |  |  | `arnold_press` |
| 34 | Seitheben mit Kurzhanteln | Lateral Raise, Spider Lateral Raise | Seitliche Schulter | Trapez | Kurzhantel | Gewicht × Wdh. |  | ✓ | `lateral_raise_dumbbell` |
| 35 | Seitheben am Kabel | Cable Lateral Raise | Seitliche Schulter | – | Kabelzug | Gewicht × Wdh. | ja |  | `lateral_raise_cable` |
| 36 | Frontheben mit Kurzhanteln | Front Raise, Seated Front Raise | Vordere Schulter | – | Kurzhantel | Gewicht × Wdh. |  |  | `front_raise_dumbbell` |
| 37 | Reverse Flys mit Kurzhanteln | Reverse Fly, Rear Delt Fly, vorgebeugtes Seitheben | Hintere Schulter | Oberer Rücken | Kurzhantel | Gewicht × Wdh. |  | ✓ | `reverse_fly_dumbbell` |
| 38 | Reverse Butterfly an der Maschine | Reverse Pec Deck | Hintere Schulter | Oberer Rücken | Maschine | Gewicht × Wdh. |  |  | `reverse_pec_deck` |
| 39 | Face Pulls am Kabel | Face Pull | Hintere Schulter | Oberer Rücken, Trapez | Kabelzug | Gewicht × Wdh. |  | ✓ | `face_pull` |
| 40 | Frontheben am Kabel | Cable Front Raise, Spider Cable Front Raise | Vordere Schulter | – | Kabelzug | Gewicht × Wdh. |  |  | `front_raise_cable` |
| 41 | Schulterdrücken mit Kurzhanteln, stehend | Standing Dumbbell Shoulder Press, Standing Alternating Shoulder Press | Vordere Schulter | Seitliche Schulter, Trizeps | Kurzhantel | Gewicht × Wdh. |  |  | `shoulder_press_dumbbell_standing` |

### Bizeps und Unterarme

| Nr. | Name | Alias-Namen (Suche) | Hauptmuskeln | Nebenmuskeln | Gerät | Erfassung | Je Seite | Vorlage | Schlüssel |
|---|---|---|---|---|---|---|---|---|---|
| 42 | Bizepscurls mit Langhantel | Barbell Curl, Langhantelcurls | Bizeps | Unterarme | Langhantel | Gewicht × Wdh. |  | ✓ | `biceps_curl_barbell` |
| 43 | Bizepscurls mit Kurzhanteln | Dumbbell Curl, Kurzhantelcurls, Alternating Dumbbell Curl | Bizeps | Unterarme | Kurzhantel | Gewicht × Wdh. |  | ✓ | `biceps_curl_dumbbell` |
| 44 | Bizepscurls mit SZ-Stange | EZ-Bar Curl, SZ-Curls | Bizeps | Unterarme | SZ-Stange | Gewicht × Wdh. |  |  | `biceps_curl_ez_bar` |
| 45 | Hammercurls | Hammer Curl | Bizeps, Unterarme | – | Kurzhantel | Gewicht × Wdh. |  | ✓ | `hammer_curl` |
| 46 | Scottcurls | Preacher Curl, Larry-Scott-Curls | Bizeps | – | SZ-Stange, Bank | Gewicht × Wdh. |  |  | `preacher_curl` |
| 47 | Bizepscurls am Kabel | Cable Curl, Bayesian Curl, High Cable Curl | Bizeps | Unterarme | Kabelzug | Gewicht × Wdh. |  |  | `biceps_curl_cable` |
| 48 | Schrägbank-Curls mit Kurzhanteln | Incline Dumbbell Curl | Bizeps | – | Kurzhantel, Bank | Gewicht × Wdh. |  |  | `incline_curl_dumbbell` |
| 49 | Handgelenkcurls | Wrist Curl, Unterarmcurls | Unterarme | – | Kurzhantel | Gewicht × Wdh. |  |  | `wrist_curl` |
| 50 | Hammercurls am Kabel mit Seil | Rope Hammer Curl, Cable Hammer Curl | Bizeps, Unterarme | – | Kabelzug | Gewicht × Wdh. |  |  | `hammer_curl_cable` |
| 51 | Scottcurls mit Kurzhanteln | Dumbbell Preacher Curl | Bizeps | – | Kurzhantel, Bank | Gewicht × Wdh. |  |  | `preacher_curl_dumbbell` |
| 52 | Reverse Curls mit SZ-Stange | Reverse Grip EZ Bar Curl, Reverse Curl | Unterarme, Bizeps | – | SZ-Stange | Gewicht × Wdh. |  |  | `reverse_curl_ez_bar` |

### Trizeps

| Nr. | Name | Alias-Namen (Suche) | Hauptmuskeln | Nebenmuskeln | Gerät | Erfassung | Je Seite | Vorlage | Schlüssel |
|---|---|---|---|---|---|---|---|---|---|
| 53 | Trizepsdrücken am Kabel | Triceps Pushdown, Pushdown, Cable Tricep Pushdown | Trizeps | – | Kabelzug | Gewicht × Wdh. |  | ✓ | `triceps_pushdown_cable` |
| 54 | Trizepsstrecken über Kopf am Kabel | Overhead Cable Triceps Extension, Overhead Cable Tricep Extension | Trizeps | – | Kabelzug | Gewicht × Wdh. |  |  | `overhead_extension_cable` |
| 55 | Trizepsstrecken über Kopf mit Kurzhantel | Dumbbell Overhead Triceps Extension, Seated Single-Arm Dumbbell Extension | Trizeps | – | Kurzhantel | Gewicht × Wdh. |  |  | `overhead_extension_dumbbell` |
| 56 | French Press mit SZ-Stange | Skull Crusher, Stirndrücken, Lying Triceps Extension | Trizeps | – | SZ-Stange, Bank | Gewicht × Wdh. |  |  | `skull_crusher` |
| 57 | Enges Bankdrücken | Close-Grip Bench Press, Close Grip Bench Press | Trizeps | Brust, Vordere Schulter | Langhantel, Bank | Gewicht × Wdh. |  |  | `close_grip_bench_press` |
| 58 | Trizeps-Kickbacks mit Kurzhantel | Triceps Kickback | Trizeps | – | Kurzhantel | Gewicht × Wdh. | ja |  | `triceps_kickback` |
| 59 | Dips | Barrendips, Dips am Barren | Trizeps, Brust | Vordere Schulter | Dipstation | Gewicht × Wdh. |  | ✓ | `dip` |
| 60 | Dips mit Unterstützung | Assisted Dip, Dipmaschine | Trizeps, Brust | Vordere Schulter | Maschine | Entlastung × Wdh. |  |  | `assisted_dip` |
| 61 | Dips an der Bank | Bench Dip | Trizeps | Brust, Vordere Schulter | Bank | Gewicht × Wdh. |  |  | `bench_dip` |
| 62 | Trizepsdrücken am Kabel, über Kreuz | Cross-Body Cable Extension, Cross Body Tricep Extension | Trizeps | – | Kabelzug | Gewicht × Wdh. | ja |  | `triceps_extension_cable_cross_body` |
| 63 | French Press mit Kurzhanteln | Dumbbell Skull Crusher | Trizeps | – | Kurzhantel, Bank | Gewicht × Wdh. |  |  | `skull_crusher_dumbbell` |

### Rumpf

| Nr. | Name | Alias-Namen (Suche) | Hauptmuskeln | Nebenmuskeln | Gerät | Erfassung | Je Seite | Vorlage | Schlüssel |
|---|---|---|---|---|---|---|---|---|---|
| 64 | Unterarmstütz (Plank) | Plank, Front Plank | Bauch | Unterer Rücken | Körpergewicht | Dauer · Rumpf |  | ✓ | `plank` |
| 65 | Seitstütz | Side Plank | Seitliche Bauchmuskeln | Bauch | Körpergewicht | Dauer · Rumpf | ja | ✓ | `side_plank` |
| 66 | Crunches | Crunch | Bauch | – | Körpergewicht | Wdh. · Rumpf |  |  | `crunch` |
| 67 | Crunches am Kabel, kniend | Cable Crunch | Bauch | – | Kabelzug | Gewicht × Wdh. · Rumpf |  |  | `cable_crunch` |
| 68 | Beinheben hängend | Hanging Leg Raise | Bauch | Seitliche Bauchmuskeln | Klimmzugstange | Wdh. · Rumpf |  | ✓ | `hanging_leg_raise` |
| 69 | Beinheben liegend | Lying Leg Raise, Leg Raises | Bauch | – | Körpergewicht | Wdh. · Rumpf |  |  | `lying_leg_raise` |
| 70 | Russian Twist | Russian Twists | Seitliche Bauchmuskeln | Bauch | Körpergewicht | Gewicht × Wdh. · Rumpf |  |  | `russian_twist` |
| 71 | Bauchroller | Ab Wheel Rollout, Ab Roller | Bauch | Latissimus | Sonstiges | Wdh. · Rumpf |  |  | `ab_wheel` |
| 72 | Dead Bug | Käfer, Dead Bugs | Bauch | – | Körpergewicht | Wdh. · Rumpf |  |  | `dead_bug` |
| 73 | Vierfüßlerstand diagonal (Bird Dog) | Bird Dog | Unterer Rücken | Bauch, Gesäß | Körpergewicht | Wdh. · Rumpf | ja |  | `bird_dog` |
| 74 | Pallof Press am Kabel | Pallof Press, Anti-Rotation | Seitliche Bauchmuskeln | Bauch | Kabelzug | Gewicht × Wdh. · Rumpf | ja |  | `pallof_press` |
| 75 | Bicycle Crunches | Bicycles, Radfahren | Bauch, Seitliche Bauchmuskeln | – | Körpergewicht | Wdh. · Rumpf |  |  | `bicycle_crunch` |
| 76 | Heel Taps | Fersentipper | Seitliche Bauchmuskeln | Bauch | Körpergewicht | Wdh. · Rumpf |  |  | `heel_tap` |
| 77 | Sit-ups | Situps | Bauch | – | Körpergewicht | Wdh. · Rumpf |  |  | `sit_up` |
| 78 | Windshield Wipers | Scheibenwischer | Seitliche Bauchmuskeln, Bauch | – | Körpergewicht | Wdh. · Rumpf |  |  | `windshield_wiper` |
| 79 | Knieheben stehend | Knee Raises, Standing Knee Raise | Bauch | Oberschenkel vorne | Körpergewicht | Wdh. · Rumpf |  |  | `standing_knee_raise` |

### Gesäß

| Nr. | Name | Alias-Namen (Suche) | Hauptmuskeln | Nebenmuskeln | Gerät | Erfassung | Je Seite | Vorlage | Schlüssel |
|---|---|---|---|---|---|---|---|---|---|
| 80 | Hip Thrust mit Langhantel | Hip Thrust, Hüftstoßen | Gesäß | Oberschenkel hinten | Langhantel, Bank | Gewicht × Wdh. |  | ✓ | `hip_thrust_barbell` |
| 81 | Hip Thrust an der Maschine | Machine Hip Thrust, Glute Drive | Gesäß | Oberschenkel hinten | Maschine | Gewicht × Wdh. |  |  | `hip_thrust_machine` |
| 82 | Hüftheben am Boden (Glute Bridge) | Glute Bridge | Gesäß | Oberschenkel hinten | Körpergewicht | Gewicht × Wdh. |  | ✓ | `glute_bridge` |
| 83 | Kickbacks am Kabel | Cable Glute Kickback | Gesäß | Oberschenkel hinten | Kabelzug | Gewicht × Wdh. | ja |  | `cable_kickback` |
| 84 | Step-ups mit Kurzhanteln | Step-up, Aufsteiger | Gesäß, Oberschenkel vorne | Oberschenkel hinten | Kurzhantel, Bank | Gewicht × Wdh. | ja |  | `step_up_dumbbell` |
| 85 | Kreuzheben Sumo mit Langhantel | Sumo Deadlift | Gesäß, Adduktoren, Oberschenkel vorne | Oberschenkel hinten, Unterer Rücken | Langhantel | Gewicht × Wdh. |  |  | `sumo_deadlift` |
| 86 | Ausfallschritte rückwärts mit Kurzhanteln | Reverse Lunge | Gesäß, Oberschenkel vorne | Oberschenkel hinten | Kurzhantel | Gewicht × Wdh. | ja |  | `reverse_lunge_dumbbell` |
| 87 | Pull-Throughs am Kabel | Cable Pull Through, Hip Hinge Pull-Through | Gesäß, Oberschenkel hinten | Unterer Rücken | Kabelzug | Gewicht × Wdh. |  |  | `cable_pull_through` |
| 88 | Hip Thrust mit Kurzhantel | Dumbbell Hip Thrust | Gesäß | Oberschenkel hinten | Kurzhantel, Bank | Gewicht × Wdh. |  |  | `hip_thrust_dumbbell` |

### Oberschenkel vorne

| Nr. | Name | Alias-Namen (Suche) | Hauptmuskeln | Nebenmuskeln | Gerät | Erfassung | Je Seite | Vorlage | Schlüssel |
|---|---|---|---|---|---|---|---|---|---|
| 89 | Kniebeuge mit Langhantel | Back Squat, Squat, Barbell Back Squat | Oberschenkel vorne, Gesäß | Adduktoren, Unterer Rücken | Langhantel | Gewicht × Wdh. |  | ✓ | `back_squat_barbell` |
| 90 | Frontkniebeuge mit Langhantel | Front Squat | Oberschenkel vorne | Gesäß, Bauch | Langhantel | Gewicht × Wdh. |  |  | `front_squat_barbell` |
| 91 | Goblet Squat | Becherkniebeuge, Heel-Elevated Goblet Squat | Oberschenkel vorne, Gesäß | Bauch | Kurzhantel, Kettlebell | Gewicht × Wdh. |  | ✓ | `goblet_squat` |
| 92 | Kniebeuge an der Multipresse | Smith Machine Squat | Oberschenkel vorne, Gesäß | – | Multipresse | Gewicht × Wdh. |  |  | `squat_smith` |
| 93 | Beinpresse | Leg Press, Leg Press Machine | Oberschenkel vorne, Gesäß | Oberschenkel hinten | Maschine | Gewicht × Wdh. |  | ✓ | `leg_press` |
| 94 | Hackenschmidt-Kniebeuge | Hack Squat | Oberschenkel vorne | Gesäß | Maschine | Gewicht × Wdh. |  |  | `hack_squat` |
| 95 | Bulgarische Kniebeuge mit Kurzhanteln | Bulgarian Split Squat | Oberschenkel vorne, Gesäß | Oberschenkel hinten | Kurzhantel, Bank | Gewicht × Wdh. | ja | ✓ | `bulgarian_split_squat_dumbbell` |
| 96 | Ausfallschritte mit Kurzhanteln | Dumbbell Lunge, Lunges, Alternating Dumbbell Lunges | Oberschenkel vorne, Gesäß | Oberschenkel hinten | Kurzhantel | Gewicht × Wdh. | ja | ✓ | `lunge_dumbbell` |
| 97 | Beinstrecker | Leg Extension, Quad Extension | Oberschenkel vorne | – | Maschine | Gewicht × Wdh. |  | ✓ | `leg_extension` |
| 98 | Wandsitzen | Wall Sit | Oberschenkel vorne | Gesäß | Körpergewicht | Dauer |  |  | `wall_sit` |
| 99 | Beinpresse, einbeinig | Single Leg Press | Oberschenkel vorne, Gesäß | – | Maschine | Gewicht × Wdh. | ja |  | `leg_press_single_leg` |

### Oberschenkel hinten

| Nr. | Name | Alias-Namen (Suche) | Hauptmuskeln | Nebenmuskeln | Gerät | Erfassung | Je Seite | Vorlage | Schlüssel |
|---|---|---|---|---|---|---|---|---|---|
| 100 | Rumänisches Kreuzheben mit Langhantel | Romanian Deadlift, RDL, Barbell Romanian Deadlift | Oberschenkel hinten, Gesäß | Unterer Rücken | Langhantel | Gewicht × Wdh. |  | ✓ | `romanian_deadlift_barbell` |
| 101 | Rumänisches Kreuzheben mit Kurzhanteln | Dumbbell Romanian Deadlift, Dumbbell RDL | Oberschenkel hinten, Gesäß | Unterer Rücken | Kurzhantel | Gewicht × Wdh. |  | ✓ | `romanian_deadlift_dumbbell` |
| 102 | Einbeiniges Rumänisches Kreuzheben mit Kurzhantel | Single-Leg RDL | Oberschenkel hinten, Gesäß | Unterer Rücken | Kurzhantel | Gewicht × Wdh. | ja |  | `single_leg_rdl_dumbbell` |
| 103 | Beinbeuger liegend | Lying Leg Curl, Lying Hamstring Curl | Oberschenkel hinten | Waden | Maschine | Gewicht × Wdh. |  | ✓ | `lying_leg_curl` |
| 104 | Beinbeuger sitzend | Seated Leg Curl | Oberschenkel hinten | – | Maschine | Gewicht × Wdh. |  | ✓ | `seated_leg_curl` |
| 105 | Good Mornings mit Langhantel | Good Morning | Oberschenkel hinten, Unterer Rücken | Gesäß | Langhantel | Gewicht × Wdh. |  |  | `good_morning` |
| 106 | Nordic Curls | Nordic Hamstring Curl | Oberschenkel hinten | – | Körpergewicht | Wdh. |  |  | `nordic_curl` |

### Waden, Adduktoren, Abduktoren

| Nr. | Name | Alias-Namen (Suche) | Hauptmuskeln | Nebenmuskeln | Gerät | Erfassung | Je Seite | Vorlage | Schlüssel |
|---|---|---|---|---|---|---|---|---|---|
| 107 | Wadenheben stehend | Standing Calf Raise | Waden | – | Maschine | Gewicht × Wdh. |  | ✓ | `standing_calf_raise` |
| 108 | Wadenheben sitzend | Seated Calf Raise, Calf Raise Machine | Waden | – | Maschine | Gewicht × Wdh. |  | ✓ | `seated_calf_raise` |
| 109 | Wadenheben an der Beinpresse | Calf Press, Leg Press Calf Raise | Waden | – | Maschine | Gewicht × Wdh. |  |  | `calf_press_leg_press` |
| 110 | Adduktorenmaschine | Hip Adduction, Adduktoren | Adduktoren | – | Maschine | Gewicht × Wdh. |  |  | `hip_adduction_machine` |
| 111 | Abduktorenmaschine | Hip Abduction, Abduktoren | Abduktoren | Gesäß | Maschine | Gewicht × Wdh. |  |  | `hip_abduction_machine` |
| 112 | Seitliches Gehen mit Widerstandsband | Lateral Band Walk, Monster Walk | Abduktoren | Gesäß | Widerstandsband | Wdh. |  |  | `lateral_band_walk` |
| 113 | Wadenheben mit Kurzhanteln | Dumbbell Calf Raise | Waden | – | Kurzhantel | Gewicht × Wdh. |  |  | `calf_raise_dumbbell` |

### Ganzkörper und Kondition

| Nr. | Name | Alias-Namen (Suche) | Hauptmuskeln | Nebenmuskeln | Gerät | Erfassung | Je Seite | Vorlage | Schlüssel |
|---|---|---|---|---|---|---|---|---|---|
| 114 | Kettlebell Swing | KB Swing | Gesäß, Oberschenkel hinten | Unterer Rücken, Ganzkörper | Kettlebell | Gewicht × Wdh. |  |  | `kettlebell_swing` |
| 115 | Thruster mit Kurzhanteln | Dumbbell Thruster | Ganzkörper | Oberschenkel vorne, Vordere Schulter | Kurzhantel | Gewicht × Wdh. |  |  | `thruster_dumbbell` |
| 116 | Farmer's Walk | Farmers Walk, Bauernlauf, Farmer Carry | Unterarme, Trapez | Ganzkörper | Kurzhantel, Kettlebell | Gewicht × Dauer |  |  | `farmers_walk` |
| 117 | Burpees | Burpee | Ganzkörper | – | Körpergewicht | Wdh. · Kondition |  |  | `burpee` |
| 118 | Bergsteiger (Mountain Climbers) | Mountain Climber | Bauch | Ganzkörper | Körpergewicht | Dauer · Kondition |  |  | `mountain_climber` |
| 119 | Hampelmann | Jumping Jacks | Ganzkörper | – | Körpergewicht | Dauer · Kondition |  |  | `jumping_jack` |
| 120 | Seilspringen | Jump Rope, Rope Skipping | Waden | Ganzkörper | Sonstiges | Dauer · Kondition |  |  | `jump_rope` |
| 121 | Rudergerät | Rowing Machine, Ruderergometer, Rower | Ganzkörper | – | Cardiogerät | Dauer und Distanz (m) · Kondition |  |  | `rowing_machine` |
| 122 | Fahrradergometer | Stationary Bike, Heimtrainer, Indoor Bike | Oberschenkel vorne | Waden | Cardiogerät | Dauer und Distanz (km) · Kondition |  |  | `stationary_bike` |
| 123 | Laufband | Treadmill, Cardio Treadmill | Ganzkörper | – | Cardiogerät | Dauer und Distanz (km) · Kondition |  |  | `treadmill` |
| 124 | Crosstrainer | Elliptical, Ellipsentrainer | Ganzkörper | – | Cardiogerät | Dauer und Distanz (km) · Kondition |  |  | `elliptical` |
