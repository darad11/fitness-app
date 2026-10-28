# FORM – Korrekturrunde 3: Griff, Rundhalskragen und Rückenlogo

> **Stand:** Branch `form-uebungen`, PR #53, zuletzt D-425 bis D-429 und Nachtrag `2f24614`. Entschieden sind Körper **C männlich**, Fassung **A1**, Brust-F **4 cm**. Ein Commit je Abschnitt mit D-Nummer, sofort pushen. Keine Nachkontrollen planen.
>
> **Anhang:** `korrektur2-2-nahaufnahmen copy.jpg` – deine letzten Nahaufnahmen mit meinen roten Markierungen.

## Deine Aufgabe

Überarbeite die bestehenden Renderings anhand des angehängten Screenshots und der roten Markierungen. Die bisherigen Korrekturen gehen in die richtige Richtung, aber drei Punkte sind noch nicht zufriedenstellend:

1. Die Finger umfassen die Langhantel nicht, und der Daumen sieht unnatürlich aus.
2. Der Halsausschnitt ist kein sauberer, normaler Rundhalskragen.
3. Der FORM-Backprint sitzt zu tief und ist zu klein geworden.

**Wichtig:** Korrigiere die tatsächliche Geometrie beziehungsweise die Platzierung der Elemente. Verändere nicht bloß den Kamerawinkel, um Fehler zu verstecken. Rendere zuerst nur Vergleichsbilder; die produktiven Animationen und Videos der App änderst du erst nach meiner Freigabe.

## 1. Griff: Die Stange muss in der Hand liegen

### Was die Bilder zeigen

Die Hand bildet eine geschlossene Faust, die **über** der Stange sitzt: Die Finger rollen in die eigene Handfläche statt um die Stange. Von oben sieht man nur die Knöchel auf der Stange, von vorn hängt der Daumen als einzelner Wulst darunter, von der Seite steht er ab. Die bisherige Korrektur hat sich auf die Winkel des Daumens konzentriert – das eigentliche Problem ist, dass die Stange nicht in der Hand liegt.

### Gewünschte Darstellung – voller Griff

- **Lage der Stange:** Beim Bankdrücken liegt die Stange schräg in der Handfläche, tief am Handballen über den Unterarmknochen, nicht an den Fingerwurzeln und nicht unter der Faust. Das Handgelenk steht gerade über dem Unterarm.
- **Finger:** Sie legen sich von oben um die Stange; die Fingerballen berühren die Stange auf der Gegenseite. Die Krümmung endet an der Stange – die Finger rollen nicht weiter in die Handfläche. Grund-, Mittel- und Endgelenke passen zum Durchmesser von 28 mm.
- **Daumen:** Er umschließt die Stange in Gegenrichtung zu den Fingern, sodass Hand und Daumen einen geschlossenen Ring um die Stange bilden; die Daumenspitze liegt auf Zeige- und Mittelfinger. Er zeigt weder nach oben noch steht er ab, ist nicht verdreht, nicht zu dick und schwebt nicht.
- **Sichtprobe:** Von vorn sieht man die Stange **durch** die geschlossene Hand laufen; von oben sieht man die Finger über die Stange greifen, nicht eine Faust, die auf ihr liegt.
- Nichts dringt in die Stange ein. Die Hand darf nicht aussehen, als wäre sie um eine unsichtbare Stange modelliert. Kein Griff ohne Daumen beim Bankdrücken – das wäre gefährlich.

### Technische Prüfung

Untersuche, ob die Ursache in der Handgeometrie, den Gelenkpositionen, den Fingerrotationen, der Lage der Stange relativ zur Handfläche oder der Kontaktmessung liegt. Prüfe die Fingergrund-, Mittel- und Endgelenke, die Krümmung jedes Fingers, Opposition und Rotation des Daumens, die Ausrichtung des Handgelenks zum Unterarm und den tatsächlichen Kontakt zwischen Hand und Stange.

Bewährter Weg: zuerst die Handfläche an die richtige Stelle der Stange legen, dann jeden Finger und den Daumen Glied für Glied schließen, bis er die Stange berührt – und dort anhalten. Die bisher festgelegten Daumenwinkel sind keine unveränderliche Vorgabe, wenn sie zu einer unnatürlichen Haltung führen. Optimiere den gesamten Griff am tatsächlichen 3D-Modell.

Beginne mit dem Bankdrücken. Prüfe danach, ob der Griff für Kniebeuge und Latziehen übernommen werden kann oder ob sie eigene Griffe brauchen; die Handhaltung muss zur jeweiligen Übung passen.

## 2. Shirt: ein normaler, sauberer Rundhalskragen

Ich möchte einen schlichten, realistischen Rundhalskragen, wie man ihn von einem hochwertigen Sportshirt kennt.

- Gleichmäßige, abgerundete Form, die natürlich um den Halsansatz verläuft: vorn etwas unter der Drosselgrube, seitlich am Halsansatz, hinten knapp über dem vorstehenden Halswirbel.
- Keine spitzen Ausläufer, Dreiecke oder unregelmäßigen Einschnitte; der Stoff ragt weder in den Hals noch über den Halsansatz hinaus.
- Weder zu eng am Hals noch übermäßig tief.
- Aus allen Perspektiven plausibel und stabil, wenn sich Schultern und Kopf bewegen, das Trapez sich hebt oder die Stange aufliegt.

**Technische Umsetzung:** Die Kombination aus Kugel, Ellipse und den Begrenzungsebenen reicht nicht. Entwickle eine bessere Lösung – eine sauber definierte Halsöffnung in der Shirt-Geometrie, einen eigenständigen schlichten Kragenring (ein schmales Kragenbündchen wie bei einem echten Shirt ist willkommen) oder eine Kombination aus beidem. Wähle die Lösung, die mit möglichst wenig Komplexität am natürlichsten wirkt, und schneide die Form nicht erneut mit einer zusätzlichen Ebene ab.

**Prüfung:** Nahaufnahme von vorn und von der Seite, tiefste Kniebeuge mit aufliegender Stange, Bewegung mit angehobenen Armen (Latziehen oben).

## 3. Rückenlogo: höher und in Backprint-Größe

- **Höhe:** im oberen Rücken zwischen den Schulterblättern, an der typischen Position eines hochwertigen Backprints. Die rote Linie in der Rückansicht der Kniebeuge zeigt die gewünschte Höhe: Die Oberkante des F sitzt etwa 6 bis 8 cm unter dem Kragen – nah daran, aber nicht am Kragen klebend.
- **Größe:** Die letzte Regel hat den Aufdruck zu klein gemacht (F 3,5 cm, Wortmarke 8,4 cm). Ein Backprint ist deutlich größer: Wortmarke etwa 15 cm breit bei C männlich, das F in fester Proportion dazu. Halte die Größe als einen Wert in der Konfiguration.
- Originalproportionen des FORM-Logos bewahren, weder F noch Schriftzug verzerren; das Logo sitzt auf dem Stoff und folgt der Oberfläche des Shirts.
- Gut erkennbar aus der Rückansicht.
- Eine gemeinsame, nachvollziehbare Positionierung für alle Übungen – geprüft bei Bankdrücken, Kniebeuge und Latziehen.

## 4. Was unverändert bleibt

FORM-F und Schriftzug, Shirt- und Shorts-Farben, Licht und Kantenlicht, Körpermodell und Muskelkarte, Bildgrößen und Bildcontainer, Dateigrößen und Performance, Zuordnung der Visuals zu den Übungen. Keine zusätzlichen Marken, Logos oder Dekorationen.

Gerendert wird nur **C männlich** in Fassung A1 mit Brust-F 4 cm. Die weibliche Figur und die graue Figur D brauchst du in dieser Runde nicht.

## 5. Rendern und Freigabe

Reihenfolge: Griff beim Bankdrücken korrigieren → Rundhalskragen → Rückenlogo → Nahaufnahmen rendern → aus mehreren Perspektiven prüfen → in der tatsächlichen Player-Größe kontrollieren → Vorher-nachher-Vergleich mit eindeutigen Beschriftungen.

Der Vergleich enthält mindestens:
- den Griff beim Bankdrücken vom Fußende, von der Seite entlang der Stange und von oben auf die Hand, dazu den Griff bei Kniebeuge und Latziehen;
- den Kragen von vorn, von der Seite, in der tiefsten Kniebeuge und beim Latziehen oben;
- das Rückenlogo in der bisherigen und der korrigierten Position und Größe;
- eine Gesamtansicht jeder Pilot-Übung.

**Stoppe nach dem Rendern und warte auf meine Freigabe.** Bis dahin bleiben die produktiven Videos und Übungsvisualisierungen unverändert.

## 6. Reihenfolge der Animationen danach – jetzt nur planen

Ich starte nach einer langen Pause mit „Ganzkörper A/B“; die Animationen sollen mir dort zuerst helfen. Ordne deshalb `docs/uebungen-animationsplan.md` nach Programmen statt nur nach Familien:

1. alle Übungen aus **„Ganzkörper A/B“**,
2. danach die noch fehlenden aus **„Push Pull Beine“**,
3. zuletzt die noch fehlenden aus **„Winterprogramm 2026“**.

Innerhalb jedes Programms gruppierst du nach Bewegungsfamilien, damit gemeinsame Grundlagen nur einmal entstehen. Nenne je Programm die Zahl der Übungen, den Aufwand und die Renderzeit. Noch nichts davon rendern – umgesetzt wird erst nach Freigabe der Pilot-Übungen und dem Merge von #53, auf einem eigenen Branch, familienweise mit Prüfseite.

## 7. Abschlussbericht

Kurz: die gefundenen Ursachen der drei Probleme, die geometrischen und positionsbezogenen Änderungen, die erstellten Renderings, ob die Korrekturen für weitere Übungen übernommen werden können, die neue Reihenfolge im Animationsplan und was noch offen ist.

**Ziel:** ein natürlicher Griff, ein sauberer Rundhalskragen und ein hochwertig platzierter Backprint, ohne die gelungenen Elemente des FORM-Designs zu beeinträchtigen.
