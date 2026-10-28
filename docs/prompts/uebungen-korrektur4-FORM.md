# FORM – Korrekturrunde 4: Daumen, zweites Shorts-Logo und personalisiertes Modell

> **Stand:** Branch `form-uebungen`, PR #53, zuletzt D-430 bis D-434 (Kopf `ae7df54`). Entschieden: Körper C männlich, Fassung A1, Brust-F 4 cm. Die Korrekturen aus Runde 3 sind größtenteils gelungen – Rundhals mit Bündchen, Backprint und Lage der Stange in der Hand bleiben, wie sie sind. Die Pilot-Übungen sind weiterhin nicht in die produktiven Videos übernommen.
>
> **Anhänge:** `korrektur3-1-griff copy.jpg` (Markierungen am Daumen) und `korrektur3-5-player copy.jpg` (Markierung für das zweite Shorts-Logo). Die Fotos für das personalisierte Modell schicke ich gesondert.
>
> Prüfe zuerst die tatsächliche Implementierung, bevor du etwas änderst. Keine unnötigen Änderungen an funktionierenden Elementen, keine Änderungen an den produktiven Videos, keine Veröffentlichung ohne meine Freigabe der neuen Standbilder. Ein Commit je Abschnitt mit D-Nummer, sofort pushen; keine Nachkontrollen planen.

## 1. Daumen: klar vom Zeigefinger getrennt

### Das Problem

Die Hand umfasst die Stange jetzt ausreichend – das bleibt so. Aber der Daumen verschmilzt optisch mit Zeige- und Mittelfinger, besonders vom Fußende und von oben gesehen (rote Markierungen). Er ist nicht als eigenständiger Finger erkennbar. Die Aufgabe ist **nicht**, den Griff erneut umzubauen, sondern Lage des Daumens und Trennung zu den Fingern zu korrigieren.

### Gewünschtes Ergebnis

- Der Daumen ist ein eigenständiger Teil der Hand, klar von Zeige- und Mittelfinger zu unterscheiden.
- Er verläuft natürlich gegenüber den Fingern und liegt plausibel an der Stange an; Kuppe, Gelenke und Daumenballen bilden eine zusammenhängende, anatomisch plausible Form.
- Er verschmilzt nicht mit den Fingern, läuft nicht durch sie hindurch und erscheint nicht als überdimensionierte Hautfläche.
- Kein sichtbarer Spalt, der ihn neben der Hand schweben lässt; er liegt nicht auf der falschen Seite der Stange.
- Die Finger umfassen die Stange weiterhin vollständig und natürlich.

### Technische Vorgehensweise

Untersuche zuerst die Ursache: Geometrie der Daumenglieder, Gelenkrotation, Lage des Daumenballens, sich durchdringende Netze, die Kontaktkorrektur an der Stange (drückt sie den Daumen in Handfläche oder Finger?) oder die Kamera. Prüfe insbesondere, ob Daumen und Finger einander durchdringen, ob die Daumenkuppe von den Fingern verdeckt wird und ob die Stange den Daumen in eine unnatürliche Lage zwingt.

Optimiere Geometrie und Gelenkstellungen, keine Verschiebungen, die nur in einer Kamera gut aussehen. Funktioniert die bisherige Konstruktion grundsätzlich nicht, darfst du eine bessere entwickeln – Griff, Hand und Stange als ein zusammenhängendes System.

### Perspektiven

Bankdrücken: vom Fußende, von der Seite entlang der Stange, von oben auf die Hand und eine schräge Nahaufnahme, in der Daumen und Finger zugleich sichtbar sind. Danach Kniebeuge und Latziehen prüfen; die Korrektur dort nur übernehmen, wenn der jeweilige Griff anatomisch richtig bleibt.

**Abnahmekriterium:** Auf den Standbildern ist eindeutig zu erkennen, wo der Daumen liegt, wie er sich von den Fingern unterscheidet und wie die ganze Hand die Stange umfasst.

## 2. Zweites FORM-Logo auf den Shorts

### Ziel

In der Bankdrückposition soll ein zusätzliches FORM-F auf den Shorts sichtbar sein – an der rot markierten Stelle in `korrektur3-5-player copy.jpg`: auf dem Bein, das beim Bankdrücken zur Kamera zeigt, vorn-außen nahe dem Saum. Bestimme an der Geometrie, welches Bein des Trägers das ist (vermutlich das rechte). Ist die Markierung nicht eindeutig zuzuordnen, frag nach, statt die Lage zu raten.

### Anforderungen

- Das bestehende FORM-F aus den Markendateien, in Originalproportionen und in der Logofarbe der Fassung A1 – hell Ton in Ton mit schmalem Rand in Stofffarbe –, gleiche Größe wie das bisherige Shorts-F (3,5 cm).
- Es liegt auf der Oberfläche der Shorts und folgt der Stoffgeometrie: nicht schwebend, nicht eingesunken, nicht verzerrt, nicht von den Beinen verdeckt.
- In der tatsächlichen Player-Größe erkennbar.
- Eine Ergänzung: Brust-, Rücken- und das bisherige Shorts-Logo bleiben unverändert.
- Körpergebunden über die bestehende Logo-Konfiguration, nicht als Sonderlösung je Bild. Prüfe die Wirkung auch in Kniebeuge und Latziehen.

Rendere eine Nahaufnahme der Shorts und die vollständige Bankdrückposition in Player-Größe.

## 3. Zusätzliche männliche Variante mit meinem Gesicht

### Ziel

Das bestehende männliche Modell bleibt als unveränderte Standardvariante. Erstelle zusätzlich eine eindeutig benannte Variante **„C männlich – Personalisiert“**, die mein Aussehen anhand meiner Fotos so genau wie technisch möglich wiedergibt und dieselben Übungen ausführen kann. Es soll erkennbar dieselbe Person sein, nicht bloß ein beliebiges Modell mit ähnlicher Frisur.

### Datenschutz – zwingend

Das Repository ist öffentlich. Deshalb:
- Meine Fotos, daraus erzeugte Gesichtstexturen, Zwischenbilder und erkannte Gesichtsmerkmale werden **nie committet** und liegen nur außerhalb des Repositorys in der Arbeitsumgebung der Sitzung. Trag die verwendeten Pfade in `.gitignore` ein, bevor du anfängst, und prüfe vor jedem Commit, dass nichts davon darin ist.
- Ins Repository kommen nur die Reglerwerte des Modells und die Konfiguration der Variante – keine Bilddaten meines Gesichts. Vorschau-Renderings der personalisierten Variante liegen ebenfalls nur außerhalb des Repositorys, bis ich sie freigebe.
- Nach Abschluss der Runde löschst du die Fotos und die abgeleiteten Texturen aus der Arbeitsumgebung und bestätigst mir das.

### Gesichtstreue hat Priorität

Übernimm die sichtbaren Merkmale so genau wie möglich: Gesichtsform und -proportionen, Stirn und Haaransatz, Frisur mit Länge, Farbe und Form, Augenform, -abstand und -farbe, Augenbrauen nach Form, Dichte und Lage, Nase mit Breite, Länge und Spitze, Lippen und Mundform, Wangen und Wangenknochen, Kieferpartie, Kinn, Ohren, Bart mit Dichte, Konturen und Übergängen, und weitere individuelle Merkmale, die für die Wiedererkennbarkeit wichtig sind.

**Nicht verschönern, stilisieren oder eigenständig verändern** – keine andere Frisur, kein anderer Bart, keine symmetrischere Gesichtsform, keine veränderte Nase, keine größeren Augen, keine idealisierten Züge. Ist ein Detail auf den Fotos nicht eindeutig zu erkennen, erfinde nichts; nutze eine vorsichtige Annäherung und kennzeichne sie.

### Technische Umsetzung

- **Lizenz:** Nur Werkzeuge und Modelle, deren Lizenz die Nutzung in einer kommerziellen App erlaubt. Viele Verfahren zur 3D-Gesichtsrekonstruktion beruhen auf Gesichtsmodellen, die nur für nichtkommerzielle Forschung freigegeben sind – die scheiden aus. Prüfe und dokumentiere jede Lizenz in `docs/licenses-data.md`.
- **Bevorzugter Weg:** Gesichtsmerkmale (Landmarken) mit einem frei lizenzierten Werkzeug auf allen Fotos erkennen und damit die Gesichtsregler von MakeHuman (CC0) so einstellen, dass Form und Proportionen aus allen Blickwinkeln passen. Eine Gesichtstextur aus den Fotos nur ergänzend und nur, wenn sie aus seitlichen und schrägen Ansichten ohne sichtbare Nähte und Fehler funktioniert – keine Fototextur über eine unpassende Grundform legen.
- Skelett, Rig und Animationen bleiben unverändert nutzbar; Kopf, Hals und Körper sind natürlich verbunden; Haare, Bart und Gesicht durchdringen sich bei Bewegung nicht und fallen nicht auseinander; Texturauflösung angemessen; Renderzeit und Ladezeit steigen nicht unverhältnismäßig.
- Wenn die Fotos noch fehlen: Bereite die Technik vor, erstelle aber keine erfundene Rekonstruktion meines Gesichts, sondern fordere die Fotos an.

### Erwartung

Kennzeichne ehrlich, welche Bereiche sich aus den Fotos nicht zuverlässig ableiten lassen. Behaupte keine perfekte Gesichtstreue – ich beurteile sie an den Vorschauen.

### Varianten und Kompatibilität

- Die neue Variante ist über die bestehende Modellkonfiguration wählbar; nichts wird automatisch auf sie umgestellt.
- Vorerst nur für Test- und Vorschau-Renderings.
- Prüfe die Gesichtstreue von vorn, im Dreiviertelprofil und von der Seite, jeweils neben meinen Fotos; teste die drei Pilot-Übungen.

## 4. Reihenfolge

1. Ursache der Verschmelzung von Daumen und Fingern finden und korrigieren.
2. Zweites Shorts-Logo platzieren.
3. Technische Grundlage für das personalisierte Modell prüfen und vorbereiten, einschließlich `.gitignore`.
4. Nach Eingang meiner Fotos die Variante erstellen.
5. Für alle drei Aufgaben getrennte Vorschau-Renderings.
6. Prüfung aus mehreren Perspektiven und in der tatsächlichen Player-Größe.
7. Übersichtliche Vorher-nachher-Dokumentation.

### Was du mir zeigst

- **A. Griff:** Vorher-nachher der Hand; Daumen und Finger aus vier Perspektiven; Bankdrücken, Kniebeuge und Latziehen.
- **B. Shorts-Logo:** Nahaufnahme an der markierten Stelle; vollständige Bankdrückposition in Player-Größe.
- **C. Personalisiertes Modell:** bestehendes und personalisiertes Modell nebeneinander; Gesicht von vorn, im Dreiviertelprofil und von der Seite, jeweils neben dem passenden Foto; mindestens eine vollständige Übungsposition, vorzugsweise Bankdrücken.

## 5. Grenzen

Keine produktiven Videos ersetzen; keine Änderungen an anderen Übungen ohne Notwendigkeit; keine unaufgeforderten Änderungen am FORM-Branding; keine Vereinheitlichung, die die verschiedenen Griffe zerstört; keine Behauptung perfekter Gesichtstreue; bestehende Daten, Konfigurationen und Animationen bewahren. Kleine, nachvollziehbare Änderungen mit dokumentierten Commits und Tests.

**Nach den Standbildern und Vorschauen stoppst du und wartest auf meine Freigabe.** Erst nach meiner ausdrücklichen Zustimmung kommen die Änderungen in die Pilot-Übungen und später in die produktiven Animationen.

## 6. Abschlussbericht

Warum der Daumen verschmolzen ist und wie du das behoben hast; wo und wie das zweite Shorts-Logo sitzt; wie die personalisierte Variante technisch umgesetzt ist und welche Lizenzen gelten; welche Ansichten und Übungen geprüft wurden; welche Grenzen die Rekonstruktion aus den Fotos hat; welche Dateien, Konfigurationen und Tests geändert wurden; die Bestätigung, dass keine Bilddaten meines Gesichts im Repository liegen und die Fotos gelöscht sind; welche Schritte noch auf meine Freigabe warten.
