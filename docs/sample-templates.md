# Beispielvorlagen und Basisübungsbibliothek

Stand: 18.10.2026 · Version 0.2 (neu in Phase 2) · Status: Entwurf zur Durchsicht durch den Produktinhaber (Q-05, Q-06) · Bezug: D-106, D-213, D-230, TP-24

## 1. Zweck und Kennzeichnung

- Die Vorlagen sind **Beispieldaten**. Sie bilden allgemein verbreitete Trainingsstrukturen ab (Ganzkörper, Ober- und Unterkörper, Push/Pull/Beine, Training zu Hause). Sie enthalten keine Inhalte aus Xeela und geben nicht vor, Originalprogramme zu sein.
- Sie sind keine individuelle Trainingsempfehlung. Zielgewichte sind bewusst leer, weil die Leistungsfähigkeit unbekannt ist.
- In der App trägt jede Beispielvorlage das Etikett „Beispiel". Die Detailansicht zeigt: „Beispieldaten – keine individuelle Trainingsempfehlung. Passe Übungen, Sätze und Gewichte an dich an. Bei gesundheitlichen Fragen hol dir ärztlichen Rat."
- Beispielvorlagen sind schreibgeschützt. „Vorlage verwenden" erzeugt ein eigenes Programm als Kopie, das frei bearbeitbar ist (AK-PRG-06).
- Technisch sind sie gebündelte, versionierte Stammdaten (`sample-templates.v1.json`) mit stabilen IDs (UUID v5 aus Schlüssel und Position). Eine neue Version der Vorlagen verändert nie bereits erstellte Kopien.

## 2. Gemeinsame Festlegungen

| Thema | Festlegung |
|---|---|
| Aufwärmsätze | Vor der ersten Grundübung eines Tages zwei Aufwärmsätze (10 und 5 Wiederholungen, Hinweis „leicht" und „mittel"), bei weiteren Grundübungen einer |
| Pausen | Schwere Grundübungen 150 bis 180 s, weitere mehrgelenkige Übungen 120 s, Isolationsübungen 60 bis 75 s, Rumpf- und Zeitübungen 60 s, Drop-Sätze ohne Pause |
| Wiederholungen | Bereiche, z. B. 8–10; bei Zeitübungen eine Zeitspanne, z. B. 30–45 s |
| Struktur | Wochen mit Trainingstagen; „wiederholen" ist aktiv; keine festen Ruhetage (Reihenfolge-Modus, D-214) |
| Körpergewichtsübungen | Wiederholungen plus optionales Zusatzgewicht (0 kg = ohne Zusatzgewicht) |

## 3. Vorlagen

### 3.1 Beispiel: Ganzkörper A/B, 3 Tage pro Woche

Niveau Einsteiger · Studio · 2 Wochen im Wechsel (Woche 1: A, B, A · Woche 2: B, A, B) · wiederholen

**Tag A**

| Übung | Sätze | Wiederholungen | Pause |
|---|---|---|---|
| Kniebeuge mit Langhantel | 2 Aufwärmen + 3 | 6–8 | 150 s |
| Bankdrücken mit Langhantel | 1 Aufwärmen + 3 | 6–8 | 150 s |
| Rudern am Kabel, sitzend | 3 | 8–12 | 120 s |
| Beinbeuger liegend | 2 | 10–12 | 75 s |
| Unterarmstütz (Plank) | 3 | 30–45 s | 60 s |

**Tag B**

| Übung | Sätze | Wiederholungen | Pause |
|---|---|---|---|
| Rumänisches Kreuzheben mit Langhantel | 2 Aufwärmen + 3 | 8–10 | 150 s |
| Schulterdrücken mit Kurzhanteln, sitzend | 1 Aufwärmen + 3 | 8–10 | 120 s |
| Latziehen | 3 | 8–12 | 120 s |
| Beinpresse | 3 | 10–12 | 120 s |
| Seitstütz | 2 je Seite | 20–40 s | 60 s |

### 3.2 Beispiel: Oberkörper/Unterkörper, 4 Tage pro Woche

Niveau fortgeschrittene Einsteiger · Studio · 1 Woche: Oberkörper 1, Unterkörper 1, Oberkörper 2, Unterkörper 2 · wiederholen

**Oberkörper 1**

| Übung | Sätze | Wiederholungen | Pause |
|---|---|---|---|
| Bankdrücken mit Langhantel | 2 Aufwärmen + 4 | 6–8 | 150 s |
| Rudern mit Langhantel, vorgebeugt | 1 Aufwärmen + 4 | 6–8 | 150 s |
| Schulterdrücken mit Kurzhanteln, sitzend | 3 | 8–10 | 120 s |
| Latziehen | 3 | 8–10 | 120 s |
| Bizepscurls mit Kurzhanteln | 2 | 10–12 | 75 s |
| Trizepsdrücken am Kabel | 2 + 1 Drop-Satz | 10–12, Drop 8–12 | 75 s |

**Unterkörper 1**

| Übung | Sätze | Wiederholungen | Pause |
|---|---|---|---|
| Kniebeuge mit Langhantel | 2 Aufwärmen + 4 | 5–7 | 180 s |
| Rumänisches Kreuzheben mit Langhantel | 3 | 8–10 | 150 s |
| Beinpresse | 3 | 10–12 | 120 s |
| Beinbeuger liegend | 3 | 10–12 | 75 s |
| Wadenheben stehend | 3 | 12–15 | 60 s |

**Oberkörper 2**

| Übung | Sätze | Wiederholungen | Pause |
|---|---|---|---|
| Schrägbankdrücken mit Kurzhanteln | 1 Aufwärmen + 3 | 8–10 | 120 s |
| Klimmzüge | 3 | 6–10 | 150 s |
| Rudern am Kabel, sitzend | 3 | 10–12 | 120 s |
| Seitheben mit Kurzhanteln | 3 + 1 Drop-Satz | 12–15, Drop 10–15 | 60 s |
| Face Pulls am Kabel | 3 | 12–15 | 60 s |
| Hammercurls | 2 | 10–12 | 60 s |

**Unterkörper 2**

| Übung | Sätze | Wiederholungen | Pause |
|---|---|---|---|
| Kreuzheben mit Langhantel | 2 Aufwärmen + 3 | 4–6 | 180 s |
| Bulgarische Kniebeuge mit Kurzhanteln | 3 je Seite | 8–10 | 120 s |
| Hip Thrust mit Langhantel | 3 | 8–12 | 120 s |
| Beinstrecker | 3 + 1 Drop-Satz | 12–15, Drop 10–15 | 75 s |
| Unterarmstütz (Plank) | 3 | 45–60 s | 60 s |

### 3.3 Beispiel: Push/Pull/Beine, 3 bis 6 Tage pro Woche

Niveau fortgeschritten · Studio · 1 Woche: Push, Pull, Beine · wiederholen (bei 6 Trainings pro Woche zweimal durchlaufen)

**Push**

| Übung | Sätze | Wiederholungen | Pause |
|---|---|---|---|
| Bankdrücken mit Langhantel | 2 Aufwärmen + 4 | 6–8 | 150 s |
| Schulterdrücken mit Langhantel, stehend | 1 Aufwärmen + 3 | 6–8 | 150 s |
| Schrägbankdrücken mit Kurzhanteln | 3 | 8–10 | 120 s |
| Seitheben mit Kurzhanteln | 3 | 12–15 | 60 s |
| Trizepsdrücken am Kabel | 3 | 10–12 | 75 s |
| Dips | 2 | 8–12 | 90 s |

**Pull**

| Übung | Sätze | Wiederholungen | Pause |
|---|---|---|---|
| Klimmzüge | 1 Aufwärmen + 4 | 6–10 | 150 s |
| Rudern mit Langhantel, vorgebeugt | 3 | 6–8 | 150 s |
| Rudern am Kabel, enger Griff | 3 | 10–12 | 120 s |
| Face Pulls am Kabel | 3 | 12–15 | 60 s |
| Bizepscurls mit Langhantel | 3 | 8–10 | 75 s |
| Hammercurls | 2 | 10–12 | 60 s |

**Beine**

| Übung | Sätze | Wiederholungen | Pause |
|---|---|---|---|
| Kniebeuge mit Langhantel | 2 Aufwärmen + 4 | 5–7 | 180 s |
| Rumänisches Kreuzheben mit Langhantel | 3 | 8–10 | 150 s |
| Beinpresse | 3 | 10–12 | 120 s |
| Beinbeuger sitzend | 3 | 10–12 | 75 s |
| Wadenheben sitzend | 3 | 12–15 | 60 s |
| Beinheben hängend | 3 | 10–15 | 60 s |

### 3.4 Beispiel: Zuhause mit Kurzhanteln, 3 Tage pro Woche

Niveau Einsteiger · Zuhause (Kurzhanteln, optional Bank, Körpergewicht) · 1 Woche: Tag 1, Tag 2, Tag 3 · wiederholen

**Tag 1**

| Übung | Sätze | Wiederholungen | Pause |
|---|---|---|---|
| Goblet Squat | 1 Aufwärmen + 3 | 10–12 | 90 s |
| Liegestütze | 3 | 8–15 | 90 s |
| Einarmiges Rudern mit Kurzhantel | 3 je Seite | 10–12 | 90 s |
| Schulterdrücken mit Kurzhanteln, sitzend | 3 | 10–12 | 90 s |
| Unterarmstütz (Plank) | 3 | 30–45 s | 60 s |

**Tag 2**

| Übung | Sätze | Wiederholungen | Pause |
|---|---|---|---|
| Rumänisches Kreuzheben mit Kurzhanteln | 1 Aufwärmen + 3 | 10–12 | 90 s |
| Ausfallschritte mit Kurzhanteln | 3 je Seite | 10–12 | 90 s |
| Bodendrücken mit Kurzhanteln | 3 | 10–12 | 90 s |
| Reverse Flys mit Kurzhanteln | 3 | 12–15 | 60 s |
| Seitstütz | 2 je Seite | 20–40 s | 60 s |

**Tag 3**

| Übung | Sätze | Wiederholungen | Pause |
|---|---|---|---|
| Bulgarische Kniebeuge mit Kurzhanteln | 3 je Seite | 8–12 | 90 s |
| Bankdrücken mit Kurzhanteln | 3 | 8–12 | 90 s |
| Rudern mit Kurzhanteln, vorgebeugt | 3 | 10–12 | 90 s |
| Bizepscurls mit Kurzhanteln | 2 | 10–12 | 60 s |
| Hüftheben am Boden (Glute Bridge) | 3 | 12–15 | 60 s |

## 4. Darstellung in der App

- **Vorlagenliste:** Karten mit Name, Etikett „Beispiel", Niveau, Ort, Tage pro Woche, Dauer der Woche; Aktion „Ansehen".
- **Detail:** Wochen und Tage mit Übungen und Satzschema; Hinweistext aus Abschnitt 1; Aktionen „Vorlage verwenden" (Kopie anlegen und optional aktivieren) und „Nur heute trainieren" (startet eine Einheit aus dem gewählten Tag ohne Kopie, `source = template`).
- **Kopie:** Name ohne „Beispiel", etwa „Ganzkörper A/B"; frei bearbeitbar; Herkunft `sample-copy`.

## 5. Basisübungsbibliothek

### 5.1 Umfang

Zielgröße 100 bis 110 Übungen mit deutschen Namen, englischen Alias-Namen für die Suche, Haupt- und Nebenmuskeln, Geräten, Kategorie und Erfassungsart. Alle Übungen der Beispielvorlagen (rund 40) sind enthalten. Die vollständige Liste entsteht in M1 und wird vom Produktinhaber durchgesehen (Q-05).

| Gruppe | Richtwert |
|---|---|
| Brust | 10 |
| Rücken (Latissimus, oberer und unterer Rücken) | 14 |
| Schultern | 10 |
| Bizeps und Unterarme | 8 |
| Trizeps | 7 |
| Rumpf | 11 |
| Gesäß | 7 |
| Oberschenkel vorne | 9 |
| Oberschenkel hinten | 7 |
| Waden, Adduktoren, Abduktoren | 6 |
| Ganzkörper und Kondition (z. B. Kettlebell Swing, Farmer's Walk, Burpees, Seilspringen) | 8 |

### 5.2 Aufzählungen

| Schlüssel | Muskelgruppe | | Schlüssel | Gerät |
|---|---|---|---|---|
| `chest` | Brust | | `barbell` | Langhantel |
| `lats` | Latissimus | | `ez_bar` | SZ-Stange |
| `upper_back` | Oberer Rücken | | `dumbbell` | Kurzhantel |
| `traps` | Trapez | | `kettlebell` | Kettlebell |
| `lower_back` | Unterer Rücken | | `cable` | Kabelzug |
| `front_delts` | Vordere Schulter | | `machine` | Maschine |
| `side_delts` | Seitliche Schulter | | `smith` | Multipresse |
| `rear_delts` | Hintere Schulter | | `bench` | Bank |
| `biceps` | Bizeps | | `pullup_bar` | Klimmzugstange |
| `triceps` | Trizeps | | `dip_station` | Dipstation |
| `forearms` | Unterarme | | `band` | Widerstandsband |
| `abs` | Bauch | | `bodyweight` | Körpergewicht |
| `obliques` | Seitliche Bauchmuskeln | | `cardio_machine` | Cardiogerät |
| `glutes` | Gesäß | | `other` | Sonstiges |
| `quads` | Oberschenkel vorne | | | |
| `hamstrings` | Oberschenkel hinten | | | |
| `adductors` | Adduktoren | | | |
| `abductors` | Abduktoren | | | |
| `calves` | Waden | | | |
| `full_body` | Ganzkörper | | | |

Erfassungsarten: `weight_reps` (Gewicht × Wiederholungen; bei Körpergewichtsübungen Zusatzgewicht), `reps` (nur Wiederholungen), `time` (Dauer), `weight_time` (Gewicht × Dauer, z. B. Farmer's Walk).

### 5.3 Pflege

- Schlüssel wie `core.bench_press_barbell` sind dauerhaft; die ID entsteht daraus per UUID v5. Eine Übung wird nie entfernt, höchstens als veraltet markiert, damit alte Einheiten lesbar bleiben.
- Persönliche Notizen, Standardpause, Gewichtsschritt, Videolink, Favorit und Ausblenden liegen in den persönlichen Übungsangaben (`exercise_pref`) und bleiben bei Updates erhalten.

## 6. Durchsicht durch den Produktinhaber

Bitte prüfen: Passen die vier Vorlagen als Ausgangspunkt? Fehlen Übungen, die Sie regelmäßig machen? Sind die Namen so, wie Sie sie im Studio nennen? Änderungen fließen vor M1 in die gebündelten Daten ein.
