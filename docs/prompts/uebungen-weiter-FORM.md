# FORM · Übungen – Fortsetzung nach Phase 1

> **Stand:** Branch `form-uebungen`, PR #53. Phase 1 ist erledigt: Bestandsaufnahme der 124 Übungen, Gerüst für Vorschaubilder und Demonstration, 111 Ausführungstexte, Quellenvorschlag. Es gelten `CLAUDE.md`, `brand-tokens.md`, `form-markenleitplanken.md` und die Leitlinien in `docs/prompts/uebungen-leitlinien-FORM.md`. Ein Commit je Abschnitt mit D-Nummer, nach jedem Abschnitt Tests, sofort pushen. Nichts kaufen, keine kostenpflichtige Lizenz abschließen. Keine Nachkontrollen planen; gemergt wird nach meiner Freigabe.
>
> **Anhänge:** `form-uebungen-moodboard.png` (Richtung für den Look – nur als Vorbild, nichts davon übernehmen) und `beispiel_grafik.jpg` (Beispiel für Plan C).

## Entscheidung Q-24 – bitte in `docs/decisions.md` festhalten

Der gezeichnete Rohentwurf ist zu einfach; Strichfiguren und Kapsel-Figuren verfolgen wir nicht weiter. Die Übungsbilder sollen einen **realistisch wirkenden menschlichen Körper** zeigen, visuell anspruchsvoll und passend zum Gesamtbild von FORM: Körper in Grau auf dunklem Grund, die arbeitenden Muskeln in Lime hervorgehoben (Moodboard, Bild 1 und 2). Welcher Weg dorthin führt, entscheide ich nach dem Vergleich in Abschnitt 6: eigene 3D-Pipeline (Pilot), gekaufte 3D-Animationen (Plan B) oder Fotos und Videos echter Menschen (Plan C).

## 1. Zuerst: Fehler und Startbündel

- **WebKit:** Im zugeklappten Training bekommt das Gewichtsfeld beim Antippen keinen Fokus – ein Rückschritt dieser Phase. Ursache finden und beheben, Test, der am alten Stand fehlschlägt.
- **Nachladen:** Prüfe bei „Importing a module script failed“, dass ein fehlgeschlagener Import wie in der Stabilitäts-Phase einmal sauber wiederholt wird – gerade weil jetzt mehr nachgeladen wird.
- **Startbündel:** Nenne die aktuelle Größe der Startansicht; Ziel höchstens 238 KB. Alles aus dieser Sitzung wird nachgeladen.

## 2. Muskelkarte – jetzt umsetzen

- Vorder- und Rückansicht eines anatomischen Körpers im Reiter „Muskeln“ der Übungsdetails.
- Hauptmuskeln in Lime #C7FF46, mitarbeitende Muskeln in Lime mit geringer Deckkraft, Körper in Grautönen aus `brand-tokens.md`, Hintergrund wie die Karte; kein Leuchten.
- Grundlage ist eine frei lizenzierte Vorlage (zum Beispiel eine SVG-Muskelkarte unter MIT- oder vergleichbarer Lizenz); Lizenz prüfen und in `docs/licenses-data.md` dokumentieren. In FORM-Farben umgesetzt, nicht das Vorbild aus dem Moodboard nachgebaut.
- Zuordnung der Muskeln aus den vorhandenen Übungsdaten (Haupt- und Nebenmuskeln); für Screenreader als Text.
- Nachgeladen, nicht im Startbündel; Test für zwei Übungen mit unterschiedlichen Muskeln.

## 3. Pilot: eigene 3D-Pipeline ohne Designer

Baue eine Render-Pipeline per Code, zum Beispiel mit Blender und Python.

- **Grundlage:** ein frei lizenziertes, realistisches 3D-Menschenmodell; Lizenz prüfen und dokumentieren – auch, was sie für die gerenderten Bilder bedeutet (Namensnennung, Weitergabe).
- **Bewegung:** jede Übung als Posen im Code – Ausgangs- und Endposition über die Gelenke, dazwischen echte Bewegung mit weicher Beschleunigung und kurzer Pause an den Endpunkten. Gelenkwinkel und Haltung fachlich richtig (Rücken, Knie, Griff).
- **Geräte:** saubere 3D-Modelle in richtigen Größenverhältnissen – Langhantel mit Scheiben, Bank, Kabelzug mit Rolle und Griff.
- **FORM-Look:** Körper matt in Grautönen, die arbeitenden Muskelgruppen als Zonen in Lime #C7FF46, Hintergrund #0C1219, weiches Licht von schräg vorn, Seiten- oder Dreiviertelansicht, geschlechtsneutral, kein Gesicht im Vordergrund, kein Leuchten.
- **Ausgabe je Übung:** stumme Schleife von 2 bis 3 Sekunden, eine Wiederholung, nahtlos (MP4 und WebM, etwa 720 px), dazu ein Standbild als Poster und Vorschaubild (etwa 240 px).
- **Nur drei Übungen:** Kniebeuge mit Langhantel, Bankdrücken, Latziehen am Kabel.
- Musst du für Installation oder Modell etwas herunterladen, sag mir vorher, welche Adressen ich unter „Network access“ freigeben muss.

## 4. Technik für alle Wege

- Medien-Typ „Animation“ je stabiler Übungs-ID, mit Standbild als Vorschaubild und als Bild bei „Bewegung reduzieren“.
- Nachgeladen; im Training die aktuelle und die nächste Übung vorladen, sonst bei Bedarf zwischenspeichern; offline das, was schon geladen war; Startbündel unter 250 KB.
- Vorschaubild als abgerundetes Quadrat auf der Fläche `card` (für Plan C mit weißem Hintergrund alternativ als Kreis wie im Beispiel – bitte als Option vorsehen).
- Die drei Pilot-Übungen damit einbauen: Liste, Player zugeklappt und aufgeklappt, Übungsdetails. Übungen ohne Animation zeigen weiter das bisherige Symbol mit den Muskel-Etiketten.

## 5. Ausführungstexte

- Die 9 offenen nachholen, zuerst Hip Thrust und Beinpresse.
- Für die 4 ohne Quelle mit den englischen Bezeichnungen suchen: Cable Pull-Through, Alternating Heel Touch, Cross-Body Cable Triceps Extension, Bent-Over Two-Arm Dumbbell Row. Findest du nur eine nahe Variante, beschreibe diese und kennzeichne es.

## 6. Vergleich der Wege – nur recherchieren, nichts kaufen

- **Pilot (Abschnitt 3):** Ergebnis, Aufwand für alle 124 Übungen, Renderzeit, Grenzen.
- **Plan B:** zwei bis drei Anbieter fertiger 3D-Übungsanimationen mit hervorgehobenen Muskeln – Beispiele, Lizenz für Apps, Preis, Abdeckung unserer 124 Übungen, ob sie in eigenen Farben und auf dunklem Hintergrund rendern.
- **Plan C:** zwei bis drei Anbieter von Übungsfotos oder -videos mit echten Menschen wie in `beispiel_grafik.jpg` – Beispiele, Lizenz für Apps samt Model-Freigaben, Preis, Abdeckung unserer 124 Übungen, ob alle Übungen von derselben Person im selben Stil vorliegen und ob die Lizenz erlaubt, den Hintergrund abzudunkeln oder zu entfernen.
- Alles in einer Tabelle in `docs/uebungen-quellen.md`, mit deiner Empfehlung und Begründung.

## 7. Dann stoppen und liefern

- Die drei Pilot-Übungen als Übersichtsbild (Ausgangs- und Endposition, Liste, Player zugeklappt und aufgeklappt, Details) und als kurze Aufnahme der Bewegung.
- Die Muskelkarte als Bilder für zwei Übungen.
- Den Vergleich der Wege mit Empfehlung.
- Den Bericht: behobene Fehler, Stand der Ausführungstexte, Größe der Startansicht, Tests mit Ergebnis, offene Punkte.
