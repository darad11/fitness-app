# Übungen · Bestandsaufnahme der Bibliothek

Stand: 27.10.2026 · Phase Übungen, Phase 1 (D-397, D-398) · Auftrag `prompts/uebungen-FORM.md`, Leitlinien `prompts/uebungen-leitlinien-FORM.md` Kapitel 5 · Abschnitt 3 wird aus den Daten erzeugt (`python3 tools/exercise_inventory.py`), `pnpm check:docs` prüft die Übereinstimmung.

## 1. Was geprüft wurde

- **Basisbibliothek:** `src/modules/exercises/data/core-exercises.v1.json`, 124 Übungen. Die früher genannte Größenordnung von rund 105 Übungen stammt aus Q-05; dazu kamen 19 Übungen für Programm C (D-248). Jede Übung hat einen dauerhaften Schlüssel (`back_squat_barbell`) und daraus eine feste ID (UUID v5 aus `core-exercise:<Schlüssel>`, D-240). Training, Vorlagen, Programme und Verlauf speichern diese ID, nicht den Namen.
- **Eigene Übungen** des Nutzers liegen in seiner Datenbank, nicht im Code. Sie stehen nicht in dieser Tabelle und bekommen keine Visuals oder Texte aus der Bibliothek; die App zeigt für sie das Symbol in der Kachel und den Hinweis, dass die Ausführung in die eigene Notiz gehört.
- **Vorhandene Bilder und Animationen:** keine. Im Projekt gab es vor dieser Phase kein einziges Übungsbild; `public/` enthält nur Logo, Symbole und Startbilder. Je Übung gibt es die persönliche Angabe „Videolink“ (AK-EXL-04), die der Nutzer selbst einträgt; sie ist kein Visual der Bibliothek.
- **Varianten:** Jede Gerätevariante ist eine eigene Übung (Regel aus `exercise-library.md`), zum Beispiel „Schulterdrücken mit Langhantel, stehend“ und „Schulterdrücken mit Kurzhanteln, sitzend“. Die Spalte „Varianten in der Bibliothek“ nennt Übungen derselben Bewegung mit anderem Gerät (gleicher Anfang des Namens vor „mit“, „am“, „an der“ oder Komma).

## 2. Befund

- **Visuals:** 124 von 124 fehlen. Neu ist die Datenstruktur dafür (`public/uebungen/medien.json`, je Schlüssel: Vorschaubild, Demonstration, Alternativtext, Quelle mit Lizenz), in Phase 1 leer. Solange ein Visual fehlt, zeigt die App das bisherige Symbol (Hantel) in der Kachel.
- **Zuordnung:** eindeutig über den Schlüssel, nie über den Namen. Ein Visual für einen Schlüssel ohne Basisübung wird nicht zugeordnet (Test `media.test.ts`).
- **Ausführung:** 111 von 124 Übungen haben einen eigenen, belegten Text, 13 sind offen (Spalte „Ausführung“, Grund in der Spalte „Hinweis zur Quelle“). Wo die Quelle eine nahe Variante beschreibt oder ein Punkt abgeleitet ist, steht das in derselben Spalte und in der App unter den Quellen.
- **Englische Namen:** aus den Alias-Namen der Suche; wo es keinen gibt, steht „–“.

## 3. Tabelle


### Brust

| Nr. | Name | Englisch | Gerät | Hauptmuskeln | Nebenmuskeln | Varianten in der Bibliothek | Visual | Ausführung | Hinweis zur Quelle | Schlüssel und ID |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Bankdrücken mit Langhantel | Bench Press | Langhantel, Bank | Brust | Trizeps, Vordere Schulter | Bankdrücken mit Kurzhanteln · Bankdrücken an der Multipresse | vorhanden | fertig (exrx.net) | – | `bench_press_barbell` · `d9e18691-fe6c-5885-8a52-a9004e985f9a` |
| 2 | Bankdrücken mit Kurzhanteln | Dumbbell Bench Press | Kurzhantel, Bank | Brust | Trizeps, Vordere Schulter | Bankdrücken mit Langhantel · Bankdrücken an der Multipresse | vorhanden | fertig (acefitness.org, exrx.net) | Sicherheitshinweis zum Ablegen sinngemäß aus der Quelle abgeleitet. | `bench_press_dumbbell` · `1befb0e4-3746-5331-8201-ffa3e293bfd4` |
| 3 | Schrägbankdrücken mit Langhantel | Incline Bench Press | Langhantel, Bank | Brust | Vordere Schulter, Trizeps | Schrägbankdrücken mit Kurzhanteln · Schrägbankdrücken am Kabel | fehlt | fertig (exrx.net) | – | `incline_bench_press_barbell` · `c4df9656-93f6-5694-843d-4f59a08489bc` |
| 4 | Schrägbankdrücken mit Kurzhanteln | Incline Dumbbell Press | Kurzhantel, Bank | Brust | Vordere Schulter, Trizeps | Schrägbankdrücken mit Langhantel · Schrägbankdrücken am Kabel | vorhanden | fertig (exrx.net) | – | `incline_bench_press_dumbbell` · `addd5f52-31a7-5b29-9906-145ff0fb1a41` |
| 5 | Bankdrücken an der Multipresse | Smith Machine Bench Press | Multipresse, Bank | Brust | Trizeps, Vordere Schulter | Bankdrücken mit Langhantel · Bankdrücken mit Kurzhanteln | fehlt | fertig (exrx.net) | – | `bench_press_smith` · `f1cd7c66-2b84-572b-9c24-e4c4ed52ebfa` |
| 6 | Brustpresse an der Maschine | Chest Press | Maschine | Brust | Trizeps, Vordere Schulter | – | fehlt | fertig (exrx.net) | – | `chest_press_machine` · `c6626b67-9c94-5b84-97bd-737003eda766` |
| 7 | Bodendrücken mit Kurzhanteln | Dumbbell Floor Press | Kurzhantel | Brust | Trizeps | – | fehlt | fertig (exrx.net) | Keine Quelle zur Variante mit Kurzhanteln; übernommen ist nur, was auch für die Langhantel-Variante der Quelle gilt. | `floor_press_dumbbell` · `c8aa618b-52f4-5948-baa0-03f4080dd2d9` |
| 8 | Fliegende mit Kurzhanteln | Dumbbell Fly | Kurzhantel, Bank | Brust | Vordere Schulter | Fliegende am Kabel | fehlt | fertig (exrx.net) | – | `fly_dumbbell` · `6ab46a96-44c9-5250-a14a-612dd004ef99` |
| 9 | Fliegende am Kabel | Cable Fly | Kabelzug | Brust | Vordere Schulter | Fliegende mit Kurzhanteln | fehlt | fertig (exrx.net) | Beschreibt die Variante im Stand an den oberen Rollen; Schräg- und Negativvarianten (Alias-Namen) deckt der Text nicht ab. | `cable_fly` · `66f52c13-58c6-54fd-8999-d7c69fa7eec4` |
| 10 | Butterfly an der Maschine | Pec Deck | Maschine | Brust | Vordere Schulter | – | fehlt | fertig (exrx.net) | Quelle beschreibt die Maschine mit Griffen; eine Maschine mit Armpolstern weicht davon ab. | `pec_deck` · `e6f09461-2d18-5d08-8b6f-cb5b3f08799f` |
| 11 | Liegestütze | Push-up | Körpergewicht | Brust | Trizeps, Vordere Schulter, Bauch | – | fehlt | fertig (exrx.net) | – | `push_up` · `bb9c5769-6d58-5cd4-8578-6d2626901a9c` |
| 12 | Schrägbankdrücken am Kabel | Incline Cable Chest Press | Kabelzug, Bank | Brust | Trizeps, Vordere Schulter | Schrägbankdrücken mit Langhantel · Schrägbankdrücken mit Kurzhanteln | fehlt | fertig (exrx.net) | Quelle beschreibt das einarmig geführte Drücken am Kabel auf der Schrägbank mit den unteren Rollen. | `incline_press_cable` · `53ed270a-224c-54a9-aec0-6b74491faf73` |

### Rücken

| Nr. | Name | Englisch | Gerät | Hauptmuskeln | Nebenmuskeln | Varianten in der Bibliothek | Visual | Ausführung | Hinweis zur Quelle | Schlüssel und ID |
|---|---|---|---|---|---|---|---|---|---|---|
| 13 | Kreuzheben mit Langhantel | Deadlift | Langhantel | Unterer Rücken, Gesäß, Oberschenkel hinten | Oberschenkel vorne, Trapez, Unterarme | – | fehlt | fertig (acefitness.org, exrx.net) | – | `deadlift_barbell` · `724dfde0-3231-5172-86c5-265fc5511b6f` |
| 14 | Klimmzüge | Pull-up | Klimmzugstange | Latissimus | Bizeps, Oberer Rücken | Klimmzüge mit Unterstützung · Klimmzüge im Untergriff | fehlt | fertig (acefitness.org, exrx.net) | – | `pull_up` · `23775e80-9bcc-5529-a8e1-0af70bbc4923` |
| 15 | Klimmzüge mit Unterstützung | Assisted Pull-up | Maschine | Latissimus | Bizeps, Oberer Rücken | Klimmzüge · Klimmzüge im Untergriff | fehlt | fertig (exrx.net) | Die Quellen sagen nichts zur Einstellung des Gegengewichts; dieser Punkt fehlt. | `assisted_pull_up` · `86549491-6d57-5eaa-a0b3-d27986e90ce1` |
| 16 | Klimmzüge im Untergriff | Chin-up | Klimmzugstange | Latissimus, Bizeps | Oberer Rücken | Klimmzüge · Klimmzüge mit Unterstützung | fehlt | fertig (acefitness.org, exrx.net) | – | `chin_up` · `ac317cae-6fcd-5a05-b0af-cab99086661b` |
| 17 | Latziehen | Lat Pulldown | Kabelzug | Latissimus | Bizeps, Oberer Rücken | Latziehen, enger Griff | vorhanden | fertig (acefitness.org, exrx.net) | – | `lat_pulldown` · `f3a5257c-a964-5dce-989c-5502406147ee` |
| 18 | Latziehen, enger Griff | Close-Grip Lat Pulldown | Kabelzug | Latissimus | Bizeps, Oberer Rücken | Latziehen | fehlt | fertig (acefitness.org, exrx.net) | Allgemeine Hinweise stammen von der Seite zum breiten Latziehen. | `lat_pulldown_close` · `e1da8f74-8e8a-52c1-a0a7-81526f0feb73` |
| 19 | Rudern am Kabel, sitzend | Seated Cable Row | Kabelzug | Oberer Rücken, Latissimus | Bizeps, Hintere Schulter | Rudern mit Langhantel, vorgebeugt · Rudern mit Kurzhanteln, vorgebeugt · Rudern an der Maschine · Rudern an der Multipresse, vorgebeugt | fehlt | fertig (exrx.net) | Folgt dem Standardgriff; weiter Griff und Untergriff (Alias-Namen) sind nicht eigens beschrieben. | `seated_cable_row` · `ad506360-ee74-5369-b109-6a5f6d9d5f5f` |
| 20 | Rudern mit Langhantel, vorgebeugt | Barbell Row | Langhantel | Oberer Rücken, Latissimus | Bizeps, Hintere Schulter, Unterer Rücken | Rudern am Kabel, sitzend · Rudern mit Kurzhanteln, vorgebeugt · Rudern an der Maschine · Rudern an der Multipresse, vorgebeugt | fehlt | fertig (exrx.net) | – | `bent_over_row_barbell` · `4f6f22ca-b1cc-5995-8b0e-592de3e081ed` |
| 21 | Rudern mit Kurzhanteln, vorgebeugt | Dumbbell Bent-over Row | Kurzhantel | Oberer Rücken, Latissimus | Bizeps, Hintere Schulter | Rudern am Kabel, sitzend · Rudern mit Langhantel, vorgebeugt · Rudern an der Maschine · Rudern an der Multipresse, vorgebeugt | fehlt | fertig (acefitness.org, exrx.net) | ExRx beschreibt die einarmige Form; die beidarmige Ausführung stützt sich auf einen ACE-Auszug aus einem Buch, Haltungshinweise auf einen ACE-Fachartikel. | `bent_over_row_dumbbell` · `7fd618f8-c40e-5624-9e16-48454b29efdf` |
| 22 | Einarmiges Rudern mit Kurzhantel | One-Arm Dumbbell Row | Kurzhantel, Bank | Latissimus, Oberer Rücken | Bizeps, Hintere Schulter | – | fehlt | fertig (exrx.net) | – | `one_arm_row_dumbbell` · `1e7ef254-edc6-59d1-98a5-93483baadb41` |
| 23 | T-Bar-Rudern | T-Bar Row | Langhantel | Oberer Rücken, Latissimus | Bizeps, Hintere Schulter, Unterer Rücken | – | fehlt | fertig (exrx.net) | Quelle beschreibt die Hebelmaschine; übernommen ist nur, was auch für die freie T-Stange gilt. | `t_bar_row` · `48900a58-3f34-5735-9bc4-c501d7c581a3` |
| 24 | Rudern an der Maschine | Machine Row | Maschine | Oberer Rücken, Latissimus | Bizeps, Hintere Schulter | Rudern am Kabel, sitzend · Rudern mit Langhantel, vorgebeugt · Rudern mit Kurzhanteln, vorgebeugt · Rudern an der Multipresse, vorgebeugt | fehlt | fertig (exrx.net) | – | `machine_row` · `4a7ac80a-510d-5874-8601-2f00851e2dce` |
| 25 | Überzüge am Kabel | Straight-Arm Pulldown | Kabelzug | Latissimus | Trizeps | – | fehlt | fertig (exrx.net) | – | `straight_arm_pulldown` · `508d0cee-0dbe-58fc-9c4b-b26ccdf27344` |
| 26 | Rückenstrecken | Back Extension | Maschine | Unterer Rücken | Gesäß, Oberschenkel hinten | – | fehlt | fertig (exrx.net) | Folgt der Rückenstreckung am 45-Grad-Gerät; die Hüftstreckung (Back Raise) hat eine eigene Quelle. | `back_extension` · `5acb083d-a9fa-5737-815e-c7bcddd53772` |
| 27 | Schulterheben mit Kurzhanteln | Dumbbell Shrug | Kurzhantel | Trapez | Unterarme | – | fehlt | fertig (exrx.net) | – | `shrug_dumbbell` · `d3a1f760-9c7b-5cb2-b654-cc35d0910c00` |
| 28 | Einarmiges Latziehen am Kabel, kniend | Kneeling Single-Arm Lat Pulldown | Kabelzug | Latissimus | Bizeps | – | fehlt | fertig (exrx.net) | Zielpunkt des Zugs nur allgemein beschrieben. | `lat_pulldown_single_arm` · `84108809-6cc3-5093-939d-92573a5d828d` |
| 29 | Rudern an der Multipresse, vorgebeugt | Smith Machine Row | Multipresse | Oberer Rücken, Latissimus | Bizeps, Hintere Schulter | Rudern am Kabel, sitzend · Rudern mit Langhantel, vorgebeugt · Rudern mit Kurzhanteln, vorgebeugt · Rudern an der Maschine | fehlt | fertig (exrx.net) | – | `bent_over_row_smith` · `3f310ca3-2876-5de5-bd66-7daf0f086934` |

### Schultern

| Nr. | Name | Englisch | Gerät | Hauptmuskeln | Nebenmuskeln | Varianten in der Bibliothek | Visual | Ausführung | Hinweis zur Quelle | Schlüssel und ID |
|---|---|---|---|---|---|---|---|---|---|---|
| 30 | Schulterdrücken mit Langhantel, stehend | Overhead Press | Langhantel | Vordere Schulter | Trizeps, Seitliche Schulter | Schulterdrücken mit Kurzhanteln, sitzend · Schulterdrücken an der Maschine · Schulterdrücken mit Kurzhanteln, stehend | fehlt | fertig (exrx.net) | Die Quelle nennt „stehend“ nicht ausdrücklich, führt die sitzende Variante aber getrennt. | `overhead_press_barbell` · `1c857deb-d22d-5d14-89a0-2ffb8b9fa097` |
| 31 | Schulterdrücken mit Kurzhanteln, sitzend | Seated Dumbbell Shoulder Press | Kurzhantel, Bank | Vordere Schulter | Trizeps, Seitliche Schulter | Schulterdrücken mit Langhantel, stehend · Schulterdrücken an der Maschine · Schulterdrücken mit Kurzhanteln, stehend | fehlt | fertig (acefitness.org, exrx.net) | – | `shoulder_press_dumbbell_seated` · `d33b1db6-70f8-5ddd-bedd-e9fa627a069e` |
| 32 | Schulterdrücken an der Maschine | Machine Shoulder Press | Maschine | Vordere Schulter | Trizeps, Seitliche Schulter | Schulterdrücken mit Langhantel, stehend · Schulterdrücken mit Kurzhanteln, sitzend · Schulterdrücken mit Kurzhanteln, stehend | fehlt | fertig (exrx.net) | – | `shoulder_press_machine` · `d03d045a-4fdc-509b-8a2e-e6bf5c201842` |
| 33 | Arnold Press mit Kurzhanteln | Arnold Press | Kurzhantel, Bank | Vordere Schulter, Seitliche Schulter | Trizeps | – | fehlt | fertig (exrx.net) | Quelle beschreibt die Übung im Stand, die App nennt eine Bank; Stehen oder Sitzen bleibt offen. | `arnold_press` · `b9918460-70eb-52f5-923d-f4990527228e` |
| 34 | Seitheben mit Kurzhanteln | Lateral Raise | Kurzhantel | Seitliche Schulter | Trapez | Seitheben am Kabel | vorhanden | fertig (exrx.net) | Die Variante „Spider“ (Alias-Name) ist nicht eigens beschrieben. „Leicht schräg nach vorn“ (rund 30° vor der Schulterlinie) ist am 31.10.2026 ergänzt; die Quelle hebt die Arme zur Seite. | `lateral_raise_dumbbell` · `0e5c6176-e511-5a4c-af2f-9f9329d41ef1` |
| 35 | Seitheben am Kabel | Cable Lateral Raise | Kabelzug | Seitliche Schulter | – | Seitheben mit Kurzhanteln | fehlt | fertig (exrx.net) | – | `lateral_raise_cable` · `0e2d8ce7-2f61-50b8-a2a8-3caed82d9f4c` |
| 36 | Frontheben mit Kurzhanteln | Front Raise | Kurzhantel | Vordere Schulter | – | Frontheben am Kabel | fehlt | fertig (exrx.net) | – | `front_raise_dumbbell` · `82cff554-80f4-596b-a1e9-68d07f22b916` |
| 37 | Reverse Flys mit Kurzhanteln | Reverse Fly | Kurzhantel | Hintere Schulter | Oberer Rücken | – | fehlt | fertig (exrx.net) | – | `reverse_fly_dumbbell` · `b37cf55e-fa48-5687-a292-541226ed2426` |
| 38 | Reverse Butterfly an der Maschine | Reverse Pec Deck | Maschine | Hintere Schulter | Oberer Rücken | – | fehlt | fertig (exrx.net) | Gestützt auf die Seiten zur Maschine mit und ohne Griffe; die Sitzrichtung bleibt offen. | `reverse_pec_deck` · `2f54353f-386a-5b9c-853b-42831bbf310a` |
| 39 | Face Pulls am Kabel | Face Pull | Kabelzug | Hintere Schulter | Oberer Rücken, Trapez | – | fehlt | fertig (exrx.net, m.nasm.org, nasm.org) | Hauptquelle NASM; Ellbogenhöhe und Haltung aus der ExRx-Seite zum Rudern für die hintere Schulter mit Seil. | `face_pull` · `0a5753e4-cebb-5e18-8380-5701f8f1afea` |
| 40 | Frontheben am Kabel | Cable Front Raise | Kabelzug | Vordere Schulter | – | Frontheben mit Kurzhanteln | fehlt | fertig (exrx.net) | Quelle beschreibt die Variante mit Stange; wie du zum Kabelzug stehst, nennt sie nicht. | `front_raise_cable` · `52ed1354-8cb1-5023-aa74-170f23cc63f6` |
| 41 | Schulterdrücken mit Kurzhanteln, stehend | Standing Dumbbell Shoulder Press | Kurzhantel | Vordere Schulter | Seitliche Schulter, Trizeps | Schulterdrücken mit Langhantel, stehend · Schulterdrücken mit Kurzhanteln, sitzend · Schulterdrücken an der Maschine | fehlt | fertig (exrx.net) | – | `shoulder_press_dumbbell_standing` · `985c3338-2e46-54db-9fed-dd5209b13ea3` |

### Bizeps und Unterarme

| Nr. | Name | Englisch | Gerät | Hauptmuskeln | Nebenmuskeln | Varianten in der Bibliothek | Visual | Ausführung | Hinweis zur Quelle | Schlüssel und ID |
|---|---|---|---|---|---|---|---|---|---|---|
| 42 | Bizepscurls mit Langhantel | Barbell Curl | Langhantel | Bizeps | Unterarme | Bizepscurls mit Kurzhanteln · Bizepscurls mit SZ-Stange · Bizepscurls am Kabel | fehlt | fertig (exrx.net) | – | `biceps_curl_barbell` · `a76a187c-15b9-584a-b47d-7812fca4d96f` |
| 43 | Bizepscurls mit Kurzhanteln | Dumbbell Curl | Kurzhantel | Bizeps | Unterarme | Bizepscurls mit Langhantel · Bizepscurls mit SZ-Stange · Bizepscurls am Kabel | fehlt | fertig (exrx.net) | – | `biceps_curl_dumbbell` · `e8c85f72-b101-5d91-bade-0aba356dbfb9` |
| 44 | Bizepscurls mit SZ-Stange | EZ-Bar Curl | SZ-Stange | Bizeps | Unterarme | Bizepscurls mit Langhantel · Bizepscurls mit Kurzhanteln · Bizepscurls am Kabel | fehlt | fertig (exrx.net) | Quelle ist die Seite zum Curl mit Langhantel, die eine gewinkelte Stange zeigt. | `biceps_curl_ez_bar` · `44e23806-ccdf-5f6b-993f-ace229ec9c6b` |
| 45 | Hammercurls | Hammer Curl | Kurzhantel | Bizeps, Unterarme | – | Hammercurls am Kabel mit Seil | fehlt | fertig (exrx.net) | – | `hammer_curl` · `17811cdb-d676-5b2b-bb5f-2b574bb93bee` |
| 46 | Scottcurls | Preacher Curl | SZ-Stange, Bank | Bizeps | – | Scottcurls mit Kurzhanteln | fehlt | fertig (exrx.net) | – | `preacher_curl` · `73fcde66-60d7-538c-bc5b-ed871aec4925` |
| 47 | Bizepscurls am Kabel | Cable Curl | Kabelzug | Bizeps | Unterarme | Bizepscurls mit Langhantel · Bizepscurls mit Kurzhanteln · Bizepscurls mit SZ-Stange | fehlt | fertig (exrx.net) | – | `biceps_curl_cable` · `62dac099-2ba1-5afd-8c2c-0632c8252cb7` |
| 48 | Schrägbank-Curls mit Kurzhanteln | Incline Dumbbell Curl | Kurzhantel, Bank | Bizeps | – | – | fehlt | fertig (exrx.net) | – | `incline_curl_dumbbell` · `a294d246-c15a-59e2-ae97-5741f1d3dd34` |
| 49 | Handgelenkcurls | Wrist Curl | Kurzhantel | Unterarme | – | – | fehlt | fertig (exrx.net) | Quelle beschreibt die Übung einarmig; der Text passt für einen oder beide Arme. | `wrist_curl` · `f87d6dc8-6ace-5b29-8a93-9c7427e41b75` |
| 50 | Hammercurls am Kabel mit Seil | Rope Hammer Curl | Kabelzug | Bizeps, Unterarme | – | Hammercurls | fehlt | fertig (exrx.net) | – | `hammer_curl_cable` · `e7136e59-ef20-542f-b888-5ad8e102d8fa` |
| 51 | Scottcurls mit Kurzhanteln | Dumbbell Preacher Curl | Kurzhantel, Bank | Bizeps | – | Scottcurls | fehlt | fertig (exrx.net) | Quelle beschreibt die Übung einarmig; der Text passt für einen oder beide Arme. | `preacher_curl_dumbbell` · `0050d232-dbc8-5a00-a6b3-9b78987e6815` |
| 52 | Reverse Curls mit SZ-Stange | Reverse Grip EZ Bar Curl | SZ-Stange | Unterarme, Bizeps | – | – | fehlt | fertig (exrx.net) | Quelle beschreibt die Variante mit Langhantel. | `reverse_curl_ez_bar` · `7184ea20-9af2-5c51-a28c-2d52b8acf79e` |

### Trizeps

| Nr. | Name | Englisch | Gerät | Hauptmuskeln | Nebenmuskeln | Varianten in der Bibliothek | Visual | Ausführung | Hinweis zur Quelle | Schlüssel und ID |
|---|---|---|---|---|---|---|---|---|---|---|
| 53 | Trizepsdrücken am Kabel | Triceps Pushdown | Kabelzug | Trizeps | – | Trizepsdrücken am Kabel, über Kreuz | fehlt | fertig (exrx.net) | Hauptquelle beschreibt die Ausführung mit Stange, das Seil nur als Hinweis. | `triceps_pushdown_cable` · `87804d4d-a15f-5ac0-b1e5-39b81b6e65d6` |
| 54 | Trizepsstrecken über Kopf am Kabel | Overhead Cable Triceps Extension | Kabelzug | Trizeps | – | Trizepsstrecken über Kopf mit Kurzhantel | fehlt | fertig (exrx.net) | – | `overhead_extension_cable` · `3c167a61-474d-5bfa-aa0b-371394cb6fe1` |
| 55 | Trizepsstrecken über Kopf mit Kurzhantel | Dumbbell Overhead Triceps Extension | Kurzhantel | Trizeps | – | Trizepsstrecken über Kopf am Kabel | fehlt | fertig (exrx.net) | Hauptquelle beidhändig, die einarmige Variante als zweite Quelle. | `overhead_extension_dumbbell` · `4f10a575-9d50-5750-a6cb-e582c936d9ef` |
| 56 | French Press mit SZ-Stange | Skull Crusher | SZ-Stange, Bank | Trizeps | – | French Press mit Kurzhanteln | fehlt | fertig (exrx.net) | – | `skull_crusher` · `1114442e-da56-5eda-8db7-95fb4f64853a` |
| 57 | Enges Bankdrücken | Close-Grip Bench Press | Langhantel, Bank | Trizeps | Brust, Vordere Schulter | – | fehlt | fertig (exrx.net) | – | `close_grip_bench_press` · `8f164f12-6441-550c-97a2-ffd839dd26cf` |
| 58 | Trizeps-Kickbacks mit Kurzhantel | Triceps Kickback | Kurzhantel | Trizeps | – | – | fehlt | fertig (exrx.net) | – | `triceps_kickback` · `21eeff05-c206-5f2b-bdc2-d605e89b6572` |
| 59 | Dips | Dips | Dipstation | Trizeps, Brust | Vordere Schulter | Dips mit Unterstützung · Dips an der Bank | fehlt | fertig (exrx.net) | Endpunkt der Bewegung aus einer nahen Variante der Quelle (Dips am Kabel). | `dip` · `a1947af5-2394-599f-81c9-fbe384f10c7b` |
| 60 | Dips mit Unterstützung | Assisted Dip | Maschine | Trizeps, Brust | Vordere Schulter | Dips · Dips an der Bank | fehlt | fertig (exrx.net) | Endpunkt der Bewegung aus einer nahen Variante der Quelle (Dips am Kabel). | `assisted_dip` · `1aa03c15-bd35-5b0f-add4-6bc03d8ed2eb` |
| 61 | Dips an der Bank | Bench Dip | Bank | Trizeps | Brust, Vordere Schulter | Dips · Dips mit Unterstützung | fehlt | fertig (exrx.net) | – | `bench_dip` · `809c0c10-c809-5b33-9046-bc37c2f8cb7b` |
| 62 | Trizepsdrücken am Kabel, über Kreuz | Cross-Body Cable Extension | Kabelzug | Trizeps | – | Trizepsdrücken am Kabel | fehlt | fertig (exrx.net) | ExRx beschreibt die „Cable Side Triceps Extension“: Seilzug auf der Seite des freien Arms, Griff hinter dem Nacken, Streckung zur Seite. Das ist der Weg quer zum Körper. Formen mit Griff vor der Brust oder anderer Seilzughöhe beschreibt die Quelle nicht. | `triceps_extension_cable_cross_body` · `e996d46c-b60b-5128-894b-4851bf5274ae` |
| 63 | French Press mit Kurzhanteln | Dumbbell Skull Crusher | Kurzhantel, Bank | Trizeps | – | French Press mit SZ-Stange | fehlt | fertig (exrx.net) | – | `skull_crusher_dumbbell` · `89d13d8d-4c2b-51e6-8a8d-9c070ce12577` |

### Rumpf

| Nr. | Name | Englisch | Gerät | Hauptmuskeln | Nebenmuskeln | Varianten in der Bibliothek | Visual | Ausführung | Hinweis zur Quelle | Schlüssel und ID |
|---|---|---|---|---|---|---|---|---|---|---|
| 64 | Unterarmstütz (Plank) | Plank | Körpergewicht | Bauch | Unterer Rücken | – | vorhanden | fertig (acefitness.org, exrx.net) | Die Quelle von ACE (Hände flach, Handflächen unten) ist am 30.10.2026 ergänzt. | `plank` · `c96d798b-9ae0-5162-9c18-33af65cfbb50` |
| 65 | Seitstütz | Side Plank | Körpergewicht | Seitliche Bauchmuskeln | Bauch | – | fehlt | fertig (exrx.net) | – | `side_plank` · `314162b2-cd55-5c37-82d5-45c6e563019a` |
| 66 | Crunches | Crunch | Körpergewicht | Bauch | – | Crunches am Kabel, kniend | vorhanden | fertig (exrx.net) | Die Quelle zu den verschränkten Armen ist am 30.10.2026 ergänzt; sie legt die Unterschenkel auf eine Bank. | `crunch` · `4c98384f-3eda-52eb-9332-1786d758387f` |
| 67 | Crunches am Kabel, kniend | Cable Crunch | Kabelzug | Bauch | – | Crunches | fehlt | fertig (exrx.net) | – | `cable_crunch` · `8a51d6e5-9250-5e49-828b-5d04cd63b7df` |
| 68 | Beinheben hängend | Hanging Leg Raise | Klimmzugstange | Bauch | Seitliche Bauchmuskeln | – | fehlt | fertig (exrx.net) | Die Quelle ordnet die Übung den Hüftbeugern zu; der Bauch arbeitet vor allem haltend. | `hanging_leg_raise` · `9697cc53-28cf-5dd1-950a-ecd1dfd7fddc` |
| 69 | Beinheben liegend | Lying Leg Raise | Körpergewicht | Bauch | – | – | fehlt | fertig (exrx.net) | Die Quelle ordnet die Übung den Hüftbeugern zu; der Bauch arbeitet vor allem haltend. | `lying_leg_raise` · `00af2adf-83b4-56c4-b168-6613bb3acfc1` |
| 70 | Russian Twist | Russian Twists | Körpergewicht | Seitliche Bauchmuskeln | Bauch | – | fehlt | fertig (exrx.net) | Quelle beschreibt die Variante mit Medizinball. | `russian_twist` · `710fb97e-95bd-5a50-8ddd-008b4a684701` |
| 71 | Bauchroller | Ab Wheel Rollout | Sonstiges | Bauch | Latissimus | – | fehlt | fertig (exrx.net) | Die Quelle ordnet die Übung den Hüftbeugern zu; der Bauch arbeitet vor allem haltend. | `ab_wheel` · `92699f62-e2d0-584b-aa0d-ad3b48adec2d` |
| 72 | Dead Bug | Dead Bugs | Körpergewicht | Bauch | – | – | fehlt | fertig (acefitness.org) | – | `dead_bug` · `bb171441-00ec-5491-b116-d69065414b7e` |
| 73 | Vierfüßlerstand diagonal (Bird Dog) | Bird Dog | Körpergewicht | Unterer Rücken | Bauch, Gesäß | – | fehlt | fertig (acefitness.org, exrx.net) | – | `bird_dog` · `05092082-c4bf-5298-a9e6-cfa995009854` |
| 74 | Pallof Press am Kabel | Pallof Press | Kabelzug | Seitliche Bauchmuskeln | Bauch | – | fehlt | fertig (acefitness.org) | Quelle ist die ACE-Übung zum Drücken gegen die Drehung; die Haltezeit stammt aus einer Zusammenfassung der Suche und ist nicht eigens bestätigt. | `pallof_press` · `529eea54-6e7d-5fad-9146-c80d61a3097a` |
| 75 | Bicycle Crunches | Bicycles | Körpergewicht | Bauch, Seitliche Bauchmuskeln | – | – | fehlt | fertig (acefitness.org) | – | `bicycle_crunch` · `94c20410-149a-5051-88ce-949b54886d18` |
| 76 | Heel Taps | Heel Taps | Körpergewicht | Seitliche Bauchmuskeln | Bauch | – | fehlt | offen | Keine Quelle zur liegenden Form mit der Hand zur Ferse. ACE führt unter „heel tap“ eine andere Übung (Beine in 90 Grad, Ferse absenken); ExRx und NASM nur andere Bauchübungen. | `heel_tap` · `9ab94547-5fe9-5434-a95e-6a76fb848c97` |
| 77 | Sit-ups | Sit-ups | Körpergewicht | Bauch | – | – | fehlt | fertig (exrx.net) | – | `sit_up` · `11e61b0a-2f62-55da-9de4-5a1d09b15d7b` |
| 78 | Windshield Wipers | Windshield Wipers | Körpergewicht | Seitliche Bauchmuskeln, Bauch | – | – | fehlt | fertig (acefitness.org, exrx.net) | ExRx führt die liegende Form als „Lying Twist“; eine eigene Seite „Windshield Wiper“ gibt es dort nur hängend und ohne Anleitung. | `windshield_wiper` · `0dbf2781-bde3-55c1-b0fe-bb532225413b` |
| 79 | Knieheben stehend | Knee Raises | Körpergewicht | Bauch | Oberschenkel vorne | – | fehlt | fertig (acefitness.org, exrx.net) | ExRx beschreibt die Variante mit Fußmanschette am Kabel, ACE eine Variante über eine Hürde; übernommen sind nur Bewegungsweg, Stütze und Haltung. | `standing_knee_raise` · `f9865d33-7852-50ed-ae15-cf1e2665367f` |

### Gesäß

| Nr. | Name | Englisch | Gerät | Hauptmuskeln | Nebenmuskeln | Varianten in der Bibliothek | Visual | Ausführung | Hinweis zur Quelle | Schlüssel und ID |
|---|---|---|---|---|---|---|---|---|---|---|
| 80 | Hip Thrust mit Langhantel | Hip Thrust | Langhantel, Bank | Gesäß | Oberschenkel hinten | Hip Thrust an der Maschine · Hip Thrust mit Kurzhantel | fehlt | fertig (exrx.net) | – | `hip_thrust_barbell` · `4b9393c3-4e84-5e3d-8cda-397dca14a924` |
| 81 | Hip Thrust an der Maschine | Machine Hip Thrust | Maschine | Gesäß | Oberschenkel hinten | Hip Thrust mit Langhantel · Hip Thrust mit Kurzhantel | fehlt | fertig (exrx.net) | Quelle beschreibt eine Maschine mit Scheiben; Hinweise zum Oberkörper aus der Seite zur Langhantel. | `hip_thrust_machine` · `79d69918-83b2-57e1-99ce-352effbe3519` |
| 82 | Hüftheben am Boden (Glute Bridge) | Glute Bridge | Körpergewicht | Gesäß | Oberschenkel hinten | – | fehlt | fertig (acefitness.org) | Der Schritt zum Absenken ist sinngemäß ergänzt. | `glute_bridge` · `5b8001c8-b8d0-542b-b7aa-1d5af4e76b89` |
| 83 | Kickbacks am Kabel | Cable Glute Kickback | Kabelzug | Gesäß | Oberschenkel hinten | – | fehlt | fertig (exrx.net) | – | `cable_kickback` · `34a9f420-f873-5a49-b7ac-250a728797a1` |
| 84 | Step-ups mit Kurzhanteln | Step-up | Kurzhantel, Bank | Gesäß, Oberschenkel vorne | Oberschenkel hinten | – | fehlt | fertig (exrx.net) | – | `step_up_dumbbell` · `6c5f062e-ce4a-5f0c-8667-80b87dcd66e8` |
| 85 | Kreuzheben Sumo mit Langhantel | Sumo Deadlift | Langhantel | Gesäß, Adduktoren, Oberschenkel vorne | Oberschenkel hinten, Unterer Rücken | – | fehlt | fertig (exrx.net) | – | `sumo_deadlift` · `feaae133-0401-55ef-ac69-6ab6c20d6678` |
| 86 | Ausfallschritte rückwärts mit Kurzhanteln | Reverse Lunge | Kurzhantel | Gesäß, Oberschenkel vorne | Oberschenkel hinten | – | fehlt | fertig (exrx.net) | – | `reverse_lunge_dumbbell` · `d1b93c46-14c4-5f5d-be20-75cc6b808375` |
| 87 | Pull-Throughs am Kabel | Cable Pull Through | Kabelzug | Gesäß, Oberschenkel hinten | Unterer Rücken | – | fehlt | offen | Keine Quelle zum Pull-Through am Kabel (ExRx, ACE, NASM, Human Kinetics, NSCA, Mayo Clinic). Die nächsten Treffer bei ExRx (Suspended Pull Through, Cable Straight-back Straight-leg Deadlift) sind andere Übungen. | `cable_pull_through` · `357dd05a-4fb5-5470-9061-9ac7d335f39d` |
| 88 | Hip Thrust mit Kurzhantel | Dumbbell Hip Thrust | Kurzhantel, Bank | Gesäß | Oberschenkel hinten | Hip Thrust mit Langhantel · Hip Thrust an der Maschine | fehlt | fertig (acefitness.org, exrx.net) | Gestützt auf die erhöhte Gesäßbrücke von ACE und die Seite zur Langhantel. | `hip_thrust_dumbbell` · `d8d3370a-493f-564f-bf05-44cc8484a039` |

### Oberschenkel vorne

| Nr. | Name | Englisch | Gerät | Hauptmuskeln | Nebenmuskeln | Varianten in der Bibliothek | Visual | Ausführung | Hinweis zur Quelle | Schlüssel und ID |
|---|---|---|---|---|---|---|---|---|---|---|
| 89 | Kniebeuge mit Langhantel | Back Squat | Langhantel | Oberschenkel vorne, Gesäß | Adduktoren, Unterer Rücken | Kniebeuge an der Multipresse | vorhanden | fertig (exrx.net) | – | `back_squat_barbell` · `572e6fea-7c72-5622-a62c-c844a1eb72ce` |
| 90 | Frontkniebeuge mit Langhantel | Front Squat | Langhantel | Oberschenkel vorne | Gesäß, Bauch | – | fehlt | fertig (exrx.net) | – | `front_squat_barbell` · `f45fc053-9ec2-54f6-853d-b20cec1334ee` |
| 91 | Goblet Squat | Goblet Squat | Kurzhantel, Kettlebell | Oberschenkel vorne, Gesäß | Bauch | – | fehlt | fertig (exrx.net) | Ablauf aus der Seite zur Kniebeuge mit Kurzhanteln, weil die Seite zum Goblet Squat keinen Ablauf beschreibt. | `goblet_squat` · `e778ec94-4ff0-5f6b-9111-9cad5724cb61` |
| 92 | Kniebeuge an der Multipresse | Smith Machine Squat | Multipresse | Oberschenkel vorne, Gesäß | – | Kniebeuge mit Langhantel | fehlt | fertig (exrx.net) | Hinweis zum Einhängen der Stange aus der Beschreibung des Aushakens abgeleitet. | `squat_smith` · `8d07eac8-b5e2-5d91-b670-253ff1af2c37` |
| 93 | Beinpresse | Leg Press | Maschine | Oberschenkel vorne, Gesäß | Oberschenkel hinten | Beinpresse, einbeinig | vorhanden | fertig (exrx.net) | Quelle beschreibt die 45-Grad-Beinpresse; der Hinweis zum Ablegen der Sicherung stammt von der einbeinigen Variante. | `leg_press` · `5f06b716-93ce-5b12-adf2-e80792c48503` |
| 94 | Hackenschmidt-Kniebeuge | Hack Squat | Maschine | Oberschenkel vorne | Gesäß | – | fehlt | fertig (exrx.net) | – | `hack_squat` · `62a9f45c-b5a4-5dec-b773-0b8781ee4a10` |
| 95 | Bulgarische Kniebeuge mit Kurzhanteln | Bulgarian Split Squat | Kurzhantel, Bank | Oberschenkel vorne, Gesäß | Oberschenkel hinten | – | fehlt | fertig (exrx.net) | – | `bulgarian_split_squat_dumbbell` · `7d604fd8-b795-53b4-b4e6-b089d07e98a0` |
| 96 | Ausfallschritte mit Kurzhanteln | Dumbbell Lunge | Kurzhantel | Oberschenkel vorne, Gesäß | Oberschenkel hinten | – | fehlt | fertig (exrx.net) | – | `lunge_dumbbell` · `22ab398c-7994-500f-b17a-45b482c2d086` |
| 97 | Beinstrecker | Leg Extension | Maschine | Oberschenkel vorne | – | – | fehlt | fertig (exrx.net) | – | `leg_extension` · `ae365731-444a-5d44-bf6b-bba38ec0a46f` |
| 98 | Wandsitzen | Wall Sit | Körpergewicht | Oberschenkel vorne | Gesäß | – | fehlt | fertig (nasm.org) | Einzige Quelle ist ein Fachartikel von NASM; ExRx und ACE haben keinen Eintrag. | `wall_sit` · `4061cd08-ea58-53ff-bbca-3cc064ef116a` |
| 99 | Beinpresse, einbeinig | Single Leg Press | Maschine | Oberschenkel vorne, Gesäß | – | Beinpresse | fehlt | fertig (exrx.net) | – | `leg_press_single_leg` · `6484e8f1-97c1-58b0-a8cc-da40dd91cfb9` |

### Oberschenkel hinten

| Nr. | Name | Englisch | Gerät | Hauptmuskeln | Nebenmuskeln | Varianten in der Bibliothek | Visual | Ausführung | Hinweis zur Quelle | Schlüssel und ID |
|---|---|---|---|---|---|---|---|---|---|---|
| 100 | Rumänisches Kreuzheben mit Langhantel | Romanian Deadlift | Langhantel | Oberschenkel hinten, Gesäß | Unterer Rücken | Rumänisches Kreuzheben mit Kurzhanteln | fehlt | fertig (acefitness.org, exrx.net) | – | `romanian_deadlift_barbell` · `9914d540-9c0c-5a4d-9a46-0e9d0ac1b619` |
| 101 | Rumänisches Kreuzheben mit Kurzhanteln | Dumbbell Romanian Deadlift | Kurzhantel | Oberschenkel hinten, Gesäß | Unterer Rücken | Rumänisches Kreuzheben mit Langhantel | fehlt | fertig (acefitness.org, exrx.net) | Gestützt auf einen ACE-Technikartikel, der Kurzhanteln erlaubt, und die Seite zur Langhantel. | `romanian_deadlift_dumbbell` · `3b203ddc-70a3-595e-b0d8-868f0c584c8c` |
| 102 | Einbeiniges Rumänisches Kreuzheben mit Kurzhantel | Single-Leg RDL | Kurzhantel | Oberschenkel hinten, Gesäß | Unterer Rücken | – | fehlt | fertig (exrx.net) | Quelle arbeitet mit je einer Hantel pro Hand; der Text deckt eine oder zwei Hanteln ab. | `single_leg_rdl_dumbbell` · `7cb49da4-3ea3-5cbf-8537-a732b12ef30a` |
| 103 | Beinbeuger liegend | Lying Leg Curl | Maschine | Oberschenkel hinten | Waden | – | fehlt | fertig (exrx.net) | – | `lying_leg_curl` · `7164e5ec-706f-55b0-861b-fde498f8f28c` |
| 104 | Beinbeuger sitzend | Seated Leg Curl | Maschine | Oberschenkel hinten | – | – | fehlt | fertig (exrx.net) | – | `seated_leg_curl` · `ff340a95-597e-5376-938a-004a8a26ec6b` |
| 105 | Good Mornings mit Langhantel | Good Morning | Langhantel | Oberschenkel hinten, Unterer Rücken | Gesäß | – | fehlt | fertig (exrx.net) | Folgt der Variante mit gestreckten Knien. | `good_morning` · `c490f632-2f33-5aa0-9527-a030c31b74d1` |
| 106 | Nordic Curls | Nordic Hamstring Curl | Körpergewicht | Oberschenkel hinten | – | – | fehlt | fertig (exrx.net) | Quelle führt die Übung als „Inverse Leg Curl“; beschrieben ist die Variante am Boden mit Abfangen. | `nordic_curl` · `d55cf0cf-ae23-5c0c-8798-663aa03cb218` |

### Waden, Adduktoren, Abduktoren

| Nr. | Name | Englisch | Gerät | Hauptmuskeln | Nebenmuskeln | Varianten in der Bibliothek | Visual | Ausführung | Hinweis zur Quelle | Schlüssel und ID |
|---|---|---|---|---|---|---|---|---|---|---|
| 107 | Wadenheben stehend | Standing Calf Raise | Maschine | Waden | – | – | fehlt | fertig (exrx.net) | – | `standing_calf_raise` · `e3dcd2e3-7922-5f0f-923b-f00dec3ad1b6` |
| 108 | Wadenheben sitzend | Seated Calf Raise | Maschine | Waden | – | – | fehlt | fertig (exrx.net) | – | `seated_calf_raise` · `081603ec-9881-515b-858f-b7c3798e98f9` |
| 109 | Wadenheben an der Beinpresse | Calf Press | Maschine | Waden | – | Wadenheben mit Kurzhanteln | fehlt | fertig (exrx.net) | – | `calf_press_leg_press` · `2dcf2e1f-de66-580e-903d-d981ee5499c5` |
| 110 | Adduktorenmaschine | Hip Adduction | Maschine | Adduktoren | – | – | fehlt | fertig (exrx.net) | – | `hip_adduction_machine` · `7d11734a-3f5c-589f-8396-cd6a46bde826` |
| 111 | Abduktorenmaschine | Hip Abduction | Maschine | Abduktoren | Gesäß | – | fehlt | fertig (exrx.net) | – | `hip_abduction_machine` · `8bf042b1-22c0-55d8-858d-57731d35d88f` |
| 112 | Seitliches Gehen mit Widerstandsband | Lateral Band Walk | Widerstandsband | Abduktoren | Gesäß | – | fehlt | fertig (acefitness.org) | Keine Seite der ACE-Übungsbibliothek gefunden; die Angaben stammen aus ACE-Fachartikeln. | `lateral_band_walk` · `c5aa28c5-328c-58e5-be1b-b2e888c9a987` |
| 113 | Wadenheben mit Kurzhanteln | Dumbbell Calf Raise | Kurzhantel | Waden | – | Wadenheben an der Beinpresse | fehlt | fertig (exrx.net) | Quelle beschreibt die Übung mit einer Kurzhantel und Abstützen mit der anderen Hand. | `calf_raise_dumbbell` · `f88ffccb-0c37-5ee3-aa35-cbaa766e9521` |

### Ganzkörper und Kondition

| Nr. | Name | Englisch | Gerät | Hauptmuskeln | Nebenmuskeln | Varianten in der Bibliothek | Visual | Ausführung | Hinweis zur Quelle | Schlüssel und ID |
|---|---|---|---|---|---|---|---|---|---|---|
| 114 | Kettlebell Swing | KB Swing | Kettlebell | Gesäß, Oberschenkel hinten | Unterer Rücken, Ganzkörper | – | fehlt | fertig (acefitness.org, exrx.net) | – | `kettlebell_swing` · `3741b1fc-3c7e-5c89-ae4f-d9294ba9b48e` |
| 115 | Thruster mit Kurzhanteln | Dumbbell Thruster | Kurzhantel | Ganzkörper | Oberschenkel vorne, Vordere Schulter | – | fehlt | fertig (acefitness.org, exrx.net) | ACE führt die Übung als „Squat to Overhead Press“. | `thruster_dumbbell` · `8ff0a49d-ed04-509e-9429-c452e5db0bc1` |
| 116 | Farmer's Walk | Farmers Walk | Kurzhantel, Kettlebell | Unterarme, Trapez | Ganzkörper | – | fehlt | fertig (acefitness.org, exrx.net) | Gestützt auf die Variante mit Kettlebells und das Tragen mit Kurzhanteln. | `farmers_walk` · `356ea1bf-2aff-5da7-bfff-20b91709c51d` |
| 117 | Burpees | Burpee | Körpergewicht | Ganzkörper | – | – | fehlt | fertig (exrx.net) | – | `burpee` · `dd8aa58f-8344-57c1-9603-c852807a64cb` |
| 118 | Bergsteiger (Mountain Climbers) | Mountain Climber | Körpergewicht | Bauch | Ganzkörper | – | fehlt | fertig (exrx.net) | – | `mountain_climber` · `a3938746-78d7-5dd9-bb1e-88a5583f0617` |
| 119 | Hampelmann | Jumping Jacks | Körpergewicht | Ganzkörper | – | – | fehlt | fertig (exrx.net) | – | `jumping_jack` · `6abfab74-f1f7-561e-a3c3-1ddf3f9c945b` |
| 120 | Seilspringen | Jump Rope | Sonstiges | Waden | Ganzkörper | – | fehlt | fertig (exrx.net) | – | `jump_rope` · `814ea4d2-60b0-5436-9f34-051d1e690241` |
| 121 | Rudergerät | Rowing Machine | Cardiogerät | Ganzkörper | – | – | fehlt | fertig (exrx.net) | – | `rowing_machine` · `bde85d7b-5ffc-52e3-9f6b-2d201d67bd95` |
| 122 | Fahrradergometer | Stationary Bike | Cardiogerät | Oberschenkel vorne | Waden | – | fehlt | fertig (exrx.net) | Gilt für das aufrechte Fahrradergometer, nicht für das Liegeergometer. | `stationary_bike` · `8afd6d80-d16b-55be-8e7a-f5f566741ac8` |
| 123 | Laufband | Treadmill | Cardiogerät | Ganzkörper | – | – | fehlt | fertig (exrx.net) | Gilt für ein motorisiertes Laufband. | `treadmill` · `9d892e37-e39e-5b73-b0dc-7d19aabe927b` |
| 124 | Crosstrainer | Elliptical | Cardiogerät | Ganzkörper | – | – | fehlt | fertig (exrx.net) | Gilt für Geräte mit beweglichen Armhebeln. | `elliptical` · `972a9661-bf1c-58a8-8023-2639b57bd504` |

Summe: 124 Übungen · mit Visual 9 · ohne Visual 115 · Ausführung fertig 122 · offen 2
