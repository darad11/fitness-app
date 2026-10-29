# FORM · Bericht zur Phase Programme

Stand: 29.10.2026, Abschnitt 0 (Vorab) erledigt; Abschnitt 1 begonnen: Rückenlogo in der Konfiguration (D-459), noch nicht gerendert. Schuh und Standbilder stehen aus, weil `*.makehumancommunity.org` in dieser Sitzung gesperrt war (Abschnitt 2.3).

## 1. Abschnitt 0 – Vorab (D-458)

| Punkt | Ergebnis |
|---|---|
| Gerätetest der Phase Übungen | bestanden (Produktinhaber, 29.10.2026) |
| PR #53 (`form-uebungen`) | auf „Ready for review“ gesetzt und auf Anweisung des Produktinhabers als normaler Merge nach `main` gemergt, Merge-Commit `8b2ab96`; vorher CI zum Kopf `aa03bbd` alle Jobs grün, auch WebKit |
| CI auf `main` zu `8b2ab96` | Lauf 40942580965 (Nr. 346): alle vier Jobs grün, auch E2E (webkit); E2E Chromium 11,0 min, WebKit 15,4 min |
| Branch `form-programme` | Beim Auftrag war #53 noch offen, `main` stand auf `25a3553` (Merge von #52); der Branch entstand deshalb zuerst vom Stand von #53. Nach dem Merge auf `main` vorgespult (`8b2ab96`), ohne eigene Commits dazwischen; der Entwurfs-PR nach `main` zeigt nur die neue Arbeit |
| Auftrag | `docs/prompts/programme-ganzkoerper-FORM.md`, in `CLAUDE.md` als aktuelle Phase |

**Nächster Schritt:** Abschnitt 1 in einer neuen Sitzung: Schuh mit echter Schnürung, Profil, angehobener Spitze, Polster am Knöchel und Zehenbox eines Laufschuhs; Rückenlogo im Verhältnis des Startbilds; Standbilder neben dem Board, Rückenlogo vorher und nachher, die drei Pilot-Übungen in Player-Größe; dann Halt bis zur Freigabe.

### 1.1 Bericht zum Paket

```
Arbeitspaket: D-458 Phase Programme: Merge der Phase Übungen, Branch und Entwurfs-PR
Umgesetzte Funktionen: keine (Merge und Dokumente), erfüllte AK: –
Geänderte Dateien: CLAUDE.md, docs/prompts/programme-ganzkoerper-FORM.md (neu), form-programme-report.md (neu), form-uebungen-report.md, docs/decisions.md, docs/testing.md, docs/implementation-plan.md
Technische Entscheidungen: D-458
Ausgeführte Tests: CI auf main zum Merge; pnpm format:check, check:docs; CI zum Entwurfs-PR
Ergebnis: bestanden
Bekannte Einschränkungen: –
Nächste Schritte: Abschnitt 1 (Schuh und Rückenlogo als Standbilder) in einer neuen Sitzung
```

## 2. Abschnitt 1 – Schuh und Rückenlogo (begonnen, D-459)

Auftrag: zuerst nur Standbilder, dann Halt bis zur Freigabe. Vorher geprüft: CI auf `main` zum Merge `8b2ab96` grün (Abschnitt 1), `form-programme` auf dem Stand von `main`.

### 2.1 Rückenlogo kleiner (in der Konfiguration)

F über FORM jetzt in der Proportion des vertikalen Logos im Startbild (D-325): F 2,28 Versalhöhen der Wortmarke hoch statt 3,40 wie auf dem Board, Abstand 0,82 statt 0,78. Die Wortmarke bleibt so groß wie bisher, das F wird rund ein Drittel kleiner. Die Mitte des Blocks bleibt, wo sie war, mittig im oberen Rücken. F und Wortmarke kommen weiter unverzerrt aus den Markendateien.

| Maß (C männlich, W 35,5 cm nach D-450) | bisher (Board) | neu (Startbild) |
|---|---|---|
| F hoch | 14,2 cm | 9,5 cm (67 %) |
| Wortmarke breit | 22,5 cm | 22,5 cm |
| Abstand F zu FORM | 3,3 cm | 3,4 cm |
| Block hoch | 21,6 cm | 17,1 cm |
| Mitte des Blocks unter dem Bündchen | 22,5 cm | 22,5 cm |
| Oberkante des F unter dem Bündchen | 11,7 cm | 14,0 cm |

Der Wert steht in `tools/uebungen-3d/kleidung.py` als `RUECKEN_LOGO`; die Messung des Boards bleibt in `BOARD["ruecken_versal"]`. Setzt man dort die Werte des Boards ein, ergibt die neue Rechnung genau die bisherige Größe und Lage; so entsteht das Vorher-Bild.

**Geprüft:** nur nachgerechnet (Tabelle) und Syntax. **Nicht geprüft:** Gerendert ist noch nichts; die Rückansicht und das Latziehen mit dem neuen Logo fehlen (2.3).

### 2.2 Schuh: Plan

Noch nicht umgesetzt; geplant nach dem Board, alles als Geometrie am Schaft von `shoes05` (`schuhe.py`):

- **Schnürung:** Ösen als kleine Ringe in zwei Reihen beiderseits der Zunge, Senkel als Röhren über Kreuz von Öse zu Öse, oben eine Schleife; Gewichte vom nächsten Punkt des Schafts, damit alles mit dem Fuß läuft. Die aufgemalten Fugen entfallen.
- **Laufsohle:** Profil als echte Stollen unter der Sohle, an der Kante als Kerben sichtbar; Spitze ab dem Ballen angehoben, Ferse und Ballen bleiben flach am Boden.
- **Polster am Knöchel:** wulstiger Kragen mit schwarzem Futter, seitlich am Knöchel etwas aufgepolstert.
- **Zehenbox eines Laufschuhs:** vorn schmaler und flacher zulaufend, zur Innenseite gerichtet, statt der runden, flachen Kappe.
- **Farben, Aufteilung, FORM-F:** wie bisher nach dem Board.

Danach Bodenkontakt, Standhöhe und Durchdringung in allen drei Pilot-Übungen neu messen (`render.py --pruefen`, `schuhe.bodenkontakt`, `schuhe.durchdringung`).

### 2.3 Blockiert: Paket von MakeHuman gesperrt

Die Figur entsteht in jeder Sitzung neu aus Dateien, die nicht im Repository liegen (`render.py --hole`). Stand in der Sitzung vom 29.10.2026:

| Quelle | Inhalt | Ergebnis |
|---|---|---|
| `raw.githubusercontent.com`, `makehuman/makehuman` (bisherige Adresse) | Grundmodell `base.obj`, Skelett, Gewichte, `LICENSE.md` | 404 auf jede Datei |
| `raw.githubusercontent.com`, `makehumancommunity/makehuman` (neue Adresse in `render.py`) | dieselben Dateien unter denselben Pfaden | geladen; Grundmodell mit 19.158 Eckpunkten und 18.486 Flächen |
| `raw.githubusercontent.com`, `makehumancommunity/mpfb2` | Körperformen (Formziele) | erreichbar (200) |
| `files2.makehumancommunity.org` | Paket `makehuman_system_assets_cc0.zip`: Haut, Augen, Haare, Brauen, Wimpern, Schuhform `shoes05` | gesperrt (Proxy 403); `files.`, `static.` und `www.makehumancommunity.org` ebenfalls nicht erreichbar |
| Ersatz für das Paket | `makehumancommunity/makehuman-assets` über `raw.githubusercontent.com`; `github.com`, `codeload.github.com`; PyPI-Paket `makehuman` 1.3.2 | 404; 403; ohne die Dateien |

Ohne das Paket fehlen Haut, Haare und die Form des Schuhs; die Figur der Pilot-Übungen lässt sich nicht wie bisher aufbauen, und am Schuh ist nichts zu prüfen. Blender 4.2 als Python-Modul kommt über PyPI, die Adresse ist frei. Die Installation lief hier langsam; der erste Versuch endete an der Grenze von 30 Minuten für Hintergrundaufgaben, ein zweiter läuft mit längerer Grenze.

**Was es braucht:** `files2.makehumancommunity.org` (oder `*.makehumancommunity.org`) als erlaubte Adresse in den Netzwerkeinstellungen der Umgebung; am 28.10.2026 war die Adresse frei (`docs/licenses-data.md` Abschnitt 8). Danach: Schuh nach 2.2, Standbilder (Schuh von außen, innen, hinten und oben neben dem Board; Rückenlogo vorher und nachher in der Rückansicht und beim Latziehen; die drei Pilot-Übungen in Player-Größe), dann Halt bis zur Freigabe.

### 2.4 Bericht zum Paket

```
Arbeitspaket: D-459 Phase Programme, Abschnitt 1 (erster Teil): Rückenlogo im Verhältnis des Startbilds
Umgesetzte Funktionen: keine in der App; Werkzeug: Rückenlogo in der Konfiguration (tools/uebungen-3d/kleidung.py), neue Adresse des Grundmodells (tools/uebungen-3d/render.py), erfüllte AK: –
Geänderte Dateien: tools/uebungen-3d/kleidung.py, tools/uebungen-3d/render.py, form-programme-report.md, docs/decisions.md, docs/testing.md, docs/implementation-plan.md, docs/licenses-data.md
Technische Entscheidungen: D-459
Ausgeführte Tests: Syntax (py_compile), Nachrechnung der Maße, Laden des Grundmodells von der neuen Adresse, pnpm format:check, pnpm check:docs; CI zum Entwurfs-PR
Ergebnis: bestanden; nicht gerendert
Bekannte Einschränkungen: Paket von MakeHuman in der Sitzung gesperrt (2.3); Schuh nicht umgesetzt
Nächste Schritte: files2.makehumancommunity.org freigeben, dann Schuh und Standbilder, Halt bis zur Freigabe
```
