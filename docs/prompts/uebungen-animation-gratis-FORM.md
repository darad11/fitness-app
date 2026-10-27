# FORM · Übungsanimationen – natürlich und biomechanisch richtig, nur mit kostenlosen Werkzeugen

> **Stand:** Branch `form-uebungen`, PR #53. Der 3D-Pilot (Kniebeuge, Bankdrücken, Latziehen) läuft in der App, die Muskelkarte ist fertig. Es gelten `CLAUDE.md`, `brand-tokens.md`, `form-markenleitplanken.md`, `uebungen-FORM.md` und `docs/prompts/uebungen-leitlinien-FORM.md`. Ein Commit je Abschnitt mit D-Nummer, nach jedem Abschnitt Tests, sofort pushen. Keine Nachkontrollen planen; gemergt wird nach meiner Freigabe.
>
> **Anhang:** `pilot-korrekturen.png` – die Fehler der Kniebeuge im Detail (Hände, Knie, Füße, Muskelzonen, Kamera).

## Deine Rolle

Du arbeitest als 3D-Animator, Movement Designer und Fitness-UX-Experte mit Kenntnissen in Anatomie und Biomechanik. Ziel ist nicht, dass sich eine 3D-Figur bewegt, sondern dass sie eine Übung **natürlich, anatomisch plausibel, verständlich und technisch korrekt** demonstriert. Bevorzuge die beste Bewegung, nicht die aufwendigste Technik.

## 0. Rahmen: keine Kosten

- **Nur kostenlose Werkzeuge und Daten**, deren Lizenz die Nutzung der gerenderten Videos in einer App erlaubt: Blender, MakeHuman (CC0), die CMU Graphics Lab Motion Capture Database (frei nutzbar, auch in kommerziellen Produkten; Rohdaten nicht weiterverkaufen), Mixamo (kostenlos mit Adobe-Konto; Lizenz prüfen). Jede Quelle mit Lizenz in `docs/licenses-data.md`.
- **Nichts kaufen, keine Konten anlegen.** Brauchst du Dateien, die nur mit Konto erhältlich sind (zum Beispiel Mixamo), nenne mir genau, welche Animationen ich herunterladen und dir geben soll, mit Einstellungen (Format, Skelett, Bildrate).
- Brauchst du Adressen unter „Network access“, sag mir vorher, welche.
- Plan B (Exercise Animatic) und Plan C sind zurückgestellt.

## 1. Was erhalten bleibt

Die Muskelkarte gefällt mir sehr gut. Behalte bei: graue, neutrale Körpermodelle; hervorgehobene Haupt- und Nebenmuskeln in Lime; den dunklen Hintergrund; die einheitliche, minimalistische Darstellung; das Prinzip, Übungen als Demonstrationen in der App zu zeigen. Kein komplett neues visuelles System – die Qualität des vorhandenen Ansatzes verbessern.

## 2. Das Fundament: Rig mit inverser Kinematik

Die Fehler des Piloten entstehen, weil Gelenkwinkel einzeln gesetzt werden. Baue deshalb ein Rig für das MakeHuman-Modell (zum Beispiel mit Rigify oder einem eigenen Skript):

- **Beine:** IK mit Zielpunkt für jeden Fuß und Pol-Ziel für jedes Knie – die Knie folgen der Richtung der Zehen und kollabieren nicht nach innen. Füße fest am Boden („foot lock“), Fußwinkel und Standbreite je Übungsvariante.
- **Arme:** IK mit Hand-Zielen, die an Stange, Griff oder Gerät gebunden sind; Pol-Ziele für die Ellbogen. Die Hand bewegt sich mit dem Gerät, nicht umgekehrt.
- **Hände:** echte Griffposen der Finger (Stange umgreifen, Kurzhantel, Kabelgriff, Latzug-Stange), natürliche Handgelenkswinkel, Handflächen richtig ausgerichtet, kein Durchdringen von Hand und Gerät.
- **Rumpf und Becken:** koordiniert, mit Gewichtsverlagerung über der Unterstützungsfläche; die Langhantel bleibt über der Fußmitte.

Prüfe, ob das MakeHuman-Modell natürlich wirkende Hände zulässt. Wenn nicht, nicht durch Kamerawinkel verstecken, sondern eine kostenlose Alternative vorschlagen (zum Beispiel ein anderes CC0-Modell oder verbesserte Handgeometrie).

## 3. Bewegung: echte Daten, sonst Bewegungsfamilien

1. **Wo frei nutzbare Motion-Capture-Daten zur Übung passen** (CMU, gegebenenfalls Mixamo), übertrage sie auf unsere Figur und korrigiere mit dem IK-Rig Hände, Füße und Gerät.
2. **Sonst Bewegungsfamilien:** Ordne alle 124 Übungen etwa zehn Grundmustern zu – zum Beispiel Kniebeuge, Hüftbeuge, waagrechtes Drücken, senkrechtes Drücken, waagrechtes Ziehen, senkrechtes Ziehen, Ausfallschritt, Beugen und Strecken der Arme, Rumpf, Kondition. Baue jede Familie einmal biomechanisch sauber mit Ausgangs-, Zwischen- und Endpositionen; einzelne Übungen sind Varianten davon (Gerät, Griff, Winkel, Bewegungsumfang). Erzwinge keine starre, identische Haltung für alle Übungen.
3. Weiche Beschleunigung und Abbremsung, saubere Übergänge, kein Springen am Ende der Schleife.

## 4. Die drei Pilot-Übungen zuerst

**Kniebeuge mit Langhantel** (siehe `pilot-korrekturen.png`):
- Ausgangsposition: Füße etwa schulterbreit, Zehen leicht nach außen, ganze Sohle am Boden; Stange auf dem oberen Rücken über der Fußmitte; Hände umgreifen die Stange, Handgelenke gerade, Ellbogen zeigen nach unten-hinten.
- Abwärts: Hüfte kontrolliert nach unten und hinten, Knie folgen den Zehen, Rumpf und Becken koordiniert, Stange auf einer senkrechten Bahn.
- Tiefste Position: kontrollierte, plausible Tiefe; Knie über den Zehen; keine Durchdringungen.
- Aufwärts: Knie und Hüfte strecken sich gemeinsam, kein Kollabieren der Knie, kein Springen oder seitliches Ausweichen der Stange.

**Bankdrücken mit Langhantel:** beide Hände greifen die Stange gleich breit und nachvollziehbar, Handgelenke über den Ellbogen, Schulterblätter auf der Bank, Füße am Boden; die Stange senkt sich kontrolliert zur unteren Brust und geht zurück.

**Latziehen am Kabel:** Hände greifen die Stange tatsächlich, Griffbreite und Handorientierung passen zur Variante, die Stange bewegt sich mit den Händen, Schultern, Ellbogen und Handgelenke folgen einem nachvollziehbaren Muster, Oberschenkel unter dem Polster.

## 5. Darstellung

- Muskelzonen klar begrenzt wie in der Muskelkarte, kein verschwommener Farbnebel; Haupt- und Nebenmuskeln wie in den Übungsdaten.
- Kamera: Dreiviertelansicht von vorn-seitlich als Standard, damit Knie, Füße und Rücken sichtbar sind; Geräte verdecken weder Kopf noch Gelenke. Gleiche Perspektive, gleiches Licht, gleiche Qualität für alle Übungen.
- Weiterhin: stumme Schleife von 2 bis 3 Sekunden, Standbild als Vorschaubild und bei „Bewegung reduzieren“, geringe Dateigröße, nachgeladen, offline wie bisher, Startbündel unter 250 KB.

## 6. Qualitätskontrolle je Übung

Für jede Pilot-Übung: Ausgangsposition, ganze Bewegung, mindestens eine frontale und eine seitliche Perspektive, Griff und Kontakt mit dem Gerät, Gelenkausrichtung während der Bewegung, Übergang am Ende der Schleife, passende Muskelzonen – und die Darstellung in der FORM-App, nicht nur im Renderer. Lässt sich eine Übung nicht überzeugend kontinuierlich animieren, prüfe eine klare Darstellung von Ausgangs- und Endposition mit dezenter Bewegung dazwischen.

## 7. Vorgehen und Halt

1. Fehler des bisherigen Piloten benennen und ihre Ursache (Modell, Rig, Animationsdaten, Rendering).
2. Rig mit IK bauen, die drei Pilot-Übungen neu animieren.
3. Vergleich alt und neu je Übung aus zwei Perspektiven als Bild und kurze Aufnahme.
4. Zuordnung aller 124 Übungen zu Bewegungsfamilien und Quellen (Motion Capture frei verfügbar, Mixamo nötig, Familie) als Tabelle; dazu deine ehrliche Schätzung des Aufwands für alle 124 mit diesem Verfahren.
5. Liste der Mixamo-Animationen, die ich dir herunterladen soll, falls sie helfen.

**Dann stoppen.** Übertrage das Verfahren erst nach meiner Freigabe auf weitere Übungen – familienweise, mit Prüfseite je Familie.

## 8. Bericht

Identifizierte Probleme und Ursachen, Änderungen an Modell, Rig und Animation, Unterschiede alt und neu für Kniebeuge, Bankdrücken und Latziehen, Dateigrößen und Performance, verwendete Daten mit Lizenz, verbleibende Einschränkungen, Empfehlungen für die nächsten Familien.

**Qualitätsmaßstab:** Die Übungen müssen auch bei genauer Betrachtung glaubwürdig sein. Natürlichkeit, korrekte Bewegungsabläufe und verständliche Demonstrationen haben Vorrang vor dekorativen Effekten.
