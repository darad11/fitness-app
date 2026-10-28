# Animationsplan: Übungen der drei Programme

Stand: 2026-10-27 (Zuordnung D-411), Plan vom 28.10.2026 (D-429). Erzeugt aus `tools/uebungen-3d/familien.json` und `src/modules/training/data/programs.v1.json` mit `tools/uebungen_animationsplan.py`; Änderungen dort, nicht hier.

Vorerst bekommen nur die Übungen der Programme „Ganzkörper A/B, 4 Tage“ (GK), „Push/Pull/Beine, rotierend“ (PPB) und „Winterprogramm 2026“ (W26) eine Animation (Entscheidung des Produktinhabers, fünfte Nachricht vom 28.10.2026). Die drei Pilot-Übungen (Kniebeuge mit Langhantel, Bankdrücken mit Langhantel, Latziehen) sind gebaut und werden in der gewählten Fassung (C männlich, A1, Brust-F 4 cm) neu gerendert; ihre Familien haben die Basis (Rig-Muster, Kamera) schon.

## 1. Was gezählt ist

- **Einheiten:** wie oft die Übung im Verlauf der drei Programme vorkommt (je Woche die Tage laut Plan).
- **Quelle der Bewegung:** „Familie (Code)“ heißt aus dem Grundmuster der Familie im Rig gebaut (wie die Piloten); „Mixamo“ und „CMU“ sind Aufnahmen, die übertragen werden (`docs/uebungen-bewegungsfamilien.md` Abschnitt 5).
- **Aufwand:** Arbeitsstunden je Übung aus D-411 (Variante bauen und prüfen) plus das neue Gerät, einmal gezählt bei der ersten Übung, die es braucht; dazu je Familie die Basis (Grundmuster, Rig-Regeln, Kamera, Prüfseite), bei den drei Pilot-Familien schon geleistet. Ohne Rechenzeit.
- **Renderzeit:** je Übung 60 Bilder der Schleife à 23 s (C männlich, A1, 720 × 540, 40 Proben, ein Prozess auf vier CPU-Kernen, gemessen an den Standbildern D-424: Kniebeuge 18 s, Bankdrücken 25 s) plus 1 min Aufbau und Vorschaubild; mit Gerät im Bild 10 % mehr. Die Rechenzeit läuft im Hintergrund, sie ist kein Arbeitsaufwand.

## 2. Übungen nach Familien

### 1. Waagrechtes Drücken

| Übung | Programme | Einheiten | Quelle der Bewegung | Aufwand (Std.) | davon neues Gerät | Renderzeit (min) | Hinweis |
|---|---|---|---|---|---|---|---|
| Schrägbankdrücken mit Kurzhanteln | GK, PPB, W26 | 23 | Familie (Code) | 0,75 | 0,00 | 26 |  |
| Bankdrücken mit Kurzhanteln | GK, W26 | 22 | Familie (Code) | 2,00 | 1,00 | 26 | neues Gerät: Kurzhanteln |
| Schrägbankdrücken am Kabel | W26 | 7 | Familie (Code) | 1,50 | 0,00 | 26 |  |
| Bankdrücken mit Langhantel | PPB | 4 | Familie (Code) | 0,50 | 0,00 | 26 | Pilot, gebaut (neu rendern) |
| Dips | PPB | 4 | Familie (Code) | 2,50 | 1,00 | 26 | neues Gerät: Dipbarren |
| Liegestütze | W26 | 4 | Mixamo „Push Up“ | 1,50 | 0,00 | 24 |  |
| Enges Bankdrücken | W26 | 2 | Familie (Code) | 0,50 | 0,00 | 26 |  |

Familie Waagrechtes Drücken: 7 Übungen, 66 Einheiten, Aufwand 9,2 Std. (davon neue Geräte 2,0) plus Basis 0,0 Std., Renderzeit 182 min.

### 2. Kniebeuge

| Übung | Programme | Einheiten | Quelle der Bewegung | Aufwand (Std.) | davon neues Gerät | Renderzeit (min) | Hinweis |
|---|---|---|---|---|---|---|---|
| Beinpresse | GK, PPB, W26 | 23 | Familie (Code) | 5,25 | 4,00 | 26 | neues Gerät: Beinpresse 45° |
| Kniebeuge mit Langhantel | PPB, W26 | 8 | Familie (Code) | 1,00 | 0,00 | 26 | Pilot, gebaut (neu rendern) |
| Beinpresse, einbeinig | W26 | 5 | Familie (Code) | 0,75 | 0,00 | 26 |  |
| Goblet Squat | W26 | 4 | Familie (Code) | 1,00 | 0,00 | 26 |  |

Familie Kniebeuge: 4 Übungen, 40 Einheiten, Aufwand 8,0 Std. (davon neue Geräte 4,0) plus Basis 0,0 Std., Renderzeit 105 min.

### 3. Senkrechtes Ziehen

| Übung | Programme | Einheiten | Quelle der Bewegung | Aufwand (Std.) | davon neues Gerät | Renderzeit (min) | Hinweis |
|---|---|---|---|---|---|---|---|
| Latziehen | GK, W26 | 17 | Familie (Code) | 0,50 | 0,00 | 26 | Pilot, gebaut (neu rendern) |
| Einarmiges Latziehen am Kabel, kniend | W26 | 5 | Familie (Code) | 1,50 | 0,00 | 26 |  |
| Klimmzüge mit Unterstützung | PPB, W26 | 5 | Familie (Code) | 5,50 | 4,00 | 26 | neues Gerät: Gegengewichtsmaschine für Klimmzug und Dip |
| Latziehen, enger Griff | W26 | 4 | Familie (Code) | 1,50 | 0,50 | 26 | neues Gerät: V-Griff |
| Überzüge am Kabel | W26 | 4 | Familie (Code) | 1,30 | 0,30 | 26 | neues Gerät: gerade Kabelstange, kurz |

Familie Senkrechtes Ziehen: 5 Übungen, 35 Einheiten, Aufwand 10,3 Std. (davon neue Geräte 4,8) plus Basis 0,0 Std., Renderzeit 132 min.

### 4. Rumpf

| Übung | Programme | Einheiten | Quelle der Bewegung | Aufwand (Std.) | davon neues Gerät | Renderzeit (min) | Hinweis |
|---|---|---|---|---|---|---|---|
| Unterarmstütz (Plank) | GK, W26 | 22 | Mixamo „Plank“ | 0,75 | 0,00 | 26 |  |
| Crunches | GK, W26 | 20 | Familie (Code) | 0,50 | 0,00 | 26 |  |
| Beinheben liegend | W26 | 5 | Familie (Code) | 0,75 | 0,00 | 26 |  |
| Beinheben hängend | PPB | 4 | Familie (Code) | 1,50 | 0,00 | 26 |  |
| Russian Twist | W26 | 4 | Familie (Code) | 1,25 | 0,00 | 26 |  |
| Heel Taps | W26 | 3 | Familie (Code) | 1,00 | 0,00 | 26 |  |
| Knieheben stehend | W26 | 3 | Familie (Code) | 0,75 | 0,00 | 24 |  |
| Sit-ups | W26 | 3 | Mixamo „Situps“ | 1,00 | 0,00 | 26 |  |
| Bicycle Crunches | W26 | 2 | Mixamo „Bicycle Crunch“ | 1,00 | 0,00 | 26 |  |
| Dead Bug | W26 | 1 | Familie (Code) | 1,00 | 0,00 | 26 |  |
| Windshield Wipers | W26 | 1 | Familie (Code) | 1,25 | 0,00 | 26 |  |

Familie Rumpf: 11 Übungen, 68 Einheiten, Aufwand 10,8 Std. (davon neue Geräte 0,0) plus Basis 12,0 Std., Renderzeit 287 min.

### 5. Arme beugen und strecken

| Übung | Programme | Einheiten | Quelle der Bewegung | Aufwand (Std.) | davon neues Gerät | Renderzeit (min) | Hinweis |
|---|---|---|---|---|---|---|---|
| Trizepsdrücken am Kabel | PPB, W26 | 8 | Familie (Code) | 0,75 | 0,00 | 26 |  |
| Bizepscurls am Kabel | W26 | 6 | Familie (Code) | 0,75 | 0,00 | 26 |  |
| Trizepsdrücken am Kabel, über Kreuz | W26 | 6 | Familie (Code) | 1,00 | 0,00 | 26 |  |
| Hammercurls am Kabel mit Seil | W26 | 5 | Familie (Code) | 0,75 | 0,00 | 26 |  |
| Bizepscurls mit Langhantel | PPB | 4 | Familie (Code) | 0,50 | 0,00 | 26 |  |
| French Press mit SZ-Stange | W26 | 4 | Familie (Code) | 1,00 | 0,00 | 26 |  |
| Hammercurls | PPB | 4 | Familie (Code) | 0,50 | 0,00 | 26 |  |
| Scottcurls mit Kurzhanteln | W26 | 4 | Familie (Code) | 0,75 | 0,00 | 26 |  |
| Trizepsstrecken über Kopf am Kabel | W26 | 4 | Familie (Code) | 1,25 | 0,00 | 26 |  |
| Bizepscurls mit Kurzhanteln | W26 | 3 | Mixamo „Bicep Curl“ | 1,00 | 0,00 | 26 |  |
| Reverse Curls mit SZ-Stange | W26 | 3 | Familie (Code) | 0,50 | 0,00 | 26 |  |
| Schrägbank-Curls mit Kurzhanteln | W26 | 3 | Familie (Code) | 1,00 | 0,00 | 26 |  |
| French Press mit Kurzhanteln | W26 | 2 | Familie (Code) | 0,50 | 0,00 | 26 |  |
| Trizepsstrecken über Kopf mit Kurzhantel | W26 | 1 | Familie (Code) | 1,00 | 0,00 | 26 |  |

Familie Arme beugen und strecken: 14 Übungen, 57 Einheiten, Aufwand 11,2 Std. (davon neue Geräte 0,0) plus Basis 4,0 Std., Renderzeit 368 min.

### 6. Beine isoliert

| Übung | Programme | Einheiten | Quelle der Bewegung | Aufwand (Std.) | davon neues Gerät | Renderzeit (min) | Hinweis |
|---|---|---|---|---|---|---|---|
| Beinbeuger liegend | GK, W26 | 23 | Familie (Code) | 4,00 | 3,00 | 26 | neues Gerät: Beinbeuger-Maschine, liegend |
| Wadenheben sitzend | PPB, W26 | 11 | Familie (Code) | 3,75 | 3,00 | 26 | neues Gerät: Wadenmaschine, sitzend |
| Beinstrecker | W26 | 7 | Familie (Code) | 4,00 | 3,50 | 26 | neues Gerät: Beinstrecker-Maschine |
| Wadenheben mit Kurzhanteln | W26 | 7 | Familie (Code) | 0,50 | 0,00 | 26 |  |
| Beinbeuger sitzend | PPB | 4 | Familie (Code) | 2,25 | 1,50 | 26 | neues Gerät: Beinbeuger-Maschine, sitzend (vom Beinstrecker abgeleitet) |
| Wadenheben an der Beinpresse | W26 | 2 | Familie (Code) | 0,75 | 0,00 | 26 |  |

Familie Beine isoliert: 6 Übungen, 54 Einheiten, Aufwand 15,2 Std. (davon neue Geräte 11,0) plus Basis 4,0 Std., Renderzeit 158 min.

### 7. Schulter und Brust isoliert

| Übung | Programme | Einheiten | Quelle der Bewegung | Aufwand (Std.) | davon neues Gerät | Renderzeit (min) | Hinweis |
|---|---|---|---|---|---|---|---|
| Seitheben mit Kurzhanteln | GK, PPB, W26 | 24 | Familie (Code) | 0,50 | 0,00 | 26 |  |
| Butterfly an der Maschine | W26 | 5 | Familie (Code) | 5,00 | 4,00 | 26 | neues Gerät: Butterfly-Maschine (auch für Reverse Butterfly) |
| Fliegende am Kabel | W26 | 5 | Familie (Code) | 5,00 | 3,50 | 26 | neues Gerät: Kabelzug: zwei Säulen mit höhenverstellbaren Rollen, D-Griff |
| Seitheben am Kabel | W26 | 5 | Familie (Code) | 1,00 | 0,00 | 26 |  |
| Reverse Flys mit Kurzhanteln | W26 | 4 | Familie (Code) | 1,00 | 0,00 | 26 |  |
| Frontheben mit Kurzhanteln | W26 | 3 | Mixamo „Front Raises“ | 1,00 | 0,00 | 26 |  |
| Frontheben am Kabel | W26 | 2 | Familie (Code) | 1,00 | 0,00 | 26 |  |

Familie Schulter und Brust isoliert: 7 Übungen, 48 Einheiten, Aufwand 14,5 Std. (davon neue Geräte 7,5) plus Basis 5,0 Std., Renderzeit 184 min.

### 8. Hüftbeuge

| Übung | Programme | Einheiten | Quelle der Bewegung | Aufwand (Std.) | davon neues Gerät | Renderzeit (min) | Hinweis |
|---|---|---|---|---|---|---|---|
| Rumänisches Kreuzheben mit Kurzhanteln | GK, W26 | 21 | Familie (Code) | 0,50 | 0,00 | 26 |  |
| Hip Thrust mit Kurzhantel | W26 | 9 | Familie (Code) | 0,50 | 0,00 | 26 |  |
| Rumänisches Kreuzheben mit Langhantel | PPB, W26 | 9 | Familie (Code) | 0,75 | 0,00 | 26 |  |
| Pull-Throughs am Kabel | W26 | 5 | Familie (Code) | 1,25 | 0,00 | 26 |  |

Familie Hüftbeuge: 4 Übungen, 44 Einheiten, Aufwand 3,0 Std. (davon neue Geräte 0,0) plus Basis 10,0 Std., Renderzeit 105 min.

### 9. Waagrechtes Ziehen

| Übung | Programme | Einheiten | Quelle der Bewegung | Aufwand (Std.) | davon neues Gerät | Renderzeit (min) | Hinweis |
|---|---|---|---|---|---|---|---|
| Rudern am Kabel, sitzend | GK, PPB, W26 | 24 | Familie (Code) | 2,50 | 2,00 | 26 | neues Gerät: Kabelrudern-Station (Sitz, Fußstütze, untere Rolle) |
| Rudern an der Multipresse, vorgebeugt | W26 | 5 | Familie (Code) | 0,75 | 0,00 | 26 |  |
| Face Pulls am Kabel | PPB | 4 | Familie (Code) | 2,50 | 1,00 | 26 | neues Gerät: Seilgriff (Trizepsseil) |
| Rudern mit Langhantel, vorgebeugt | PPB | 4 | Familie (Code) | 1,50 | 0,00 | 26 |  |
| T-Bar-Rudern | W26 | 3 | Familie (Code) | 2,00 | 0,50 | 26 | neues Gerät: Landmine-Halterung |

Familie Waagrechtes Ziehen: 5 Übungen, 40 Einheiten, Aufwand 9,2 Std. (davon neue Geräte 3,5) plus Basis 6,0 Std., Renderzeit 132 min.

### 10. Kondition

| Übung | Programme | Einheiten | Quelle der Bewegung | Aufwand (Std.) | davon neues Gerät | Renderzeit (min) | Hinweis |
|---|---|---|---|---|---|---|---|
| Laufband | W26 | 39 | CMU 35_17 | 4,50 | 3,00 | 26 | neues Gerät: Laufband |

Familie Kondition: 1 Übungen, 39 Einheiten, Aufwand 4,5 Std. (davon neue Geräte 3,0) plus Basis 10,0 Std., Renderzeit 26 min.

### 11. Senkrechtes Drücken

| Übung | Programme | Einheiten | Quelle der Bewegung | Aufwand (Std.) | davon neues Gerät | Renderzeit (min) | Hinweis |
|---|---|---|---|---|---|---|---|
| Schulterdrücken an der Maschine | GK, W26 | 20 | Familie (Code) | 5,00 | 4,00 | 26 | neues Gerät: Schulterpresse-Maschine |
| Schulterdrücken mit Langhantel, stehend | PPB | 4 | Familie (Code) | 0,50 | 0,00 | 26 |  |
| Schulterdrücken mit Kurzhanteln, stehend | W26 | 2 | Familie (Code) | 0,75 | 0,00 | 26 |  |

Familie Senkrechtes Drücken: 3 Übungen, 26 Einheiten, Aufwand 6,2 Std. (davon neue Geräte 4,0) plus Basis 5,0 Std., Renderzeit 79 min.

### 12. Ausfallschritt und einbeinig

| Übung | Programme | Einheiten | Quelle der Bewegung | Aufwand (Std.) | davon neues Gerät | Renderzeit (min) | Hinweis |
|---|---|---|---|---|---|---|---|
| Ausfallschritte mit Kurzhanteln | W26 | 9 | Familie (Code) | 0,75 | 0,00 | 26 |  |

Familie Ausfallschritt und einbeinig: 1 Übungen, 9 Einheiten, Aufwand 0,8 Std. (davon neue Geräte 0,0) plus Basis 7,0 Std., Renderzeit 26 min.

## 3. Summen und Reihenfolge

| Rang | Familie | Übungen | Einheiten | Aufwand Übungen (Std.) | davon neue Geräte | Basis (Std.) | Renderzeit (min) |
|---|---|---|---|---|---|---|---|
| 1 | Waagrechtes Drücken | 7 | 66 | 9,2 | 2,0 | 0,0 | 182 |
| 2 | Kniebeuge | 4 | 40 | 8,0 | 4,0 | 0,0 | 105 |
| 3 | Senkrechtes Ziehen | 5 | 35 | 10,3 | 4,8 | 0,0 | 132 |
| 4 | Rumpf | 11 | 68 | 10,8 | 0,0 | 12,0 | 287 |
| 5 | Arme beugen und strecken | 14 | 57 | 11,2 | 0,0 | 4,0 | 368 |
| 6 | Beine isoliert | 6 | 54 | 15,2 | 11,0 | 4,0 | 158 |
| 7 | Schulter und Brust isoliert | 7 | 48 | 14,5 | 7,5 | 5,0 | 184 |
| 8 | Hüftbeuge | 4 | 44 | 3,0 | 0,0 | 10,0 | 105 |
| 9 | Waagrechtes Ziehen | 5 | 40 | 9,2 | 3,5 | 6,0 | 132 |
| 10 | Kondition | 1 | 39 | 4,5 | 3,0 | 10,0 | 26 |
| 11 | Senkrechtes Drücken | 3 | 26 | 6,2 | 4,0 | 5,0 | 79 |
| 12 | Ausfallschritt und einbeinig | 1 | 9 | 0,8 | 0,0 | 7,0 | 26 |
| | **Summe** | **68** | **526** | **103,0** | **39,8** | **63,0** | **1784** |

Einmalige Arbeiten für die genutzten Quellen:

- CMU-Import (BVH, Umrechnung auf 24 Bilder je Sekunde), Übertragung auf das MakeHuman-Skelett, Fußsperre, Schnitt und Schleife: 8 Std.
- Mixamo-Übertragung (Skelett mixamorig auf das MakeHuman-Skelett): 4 Std.
- Kabelverlauf über mehrere Rollen und Seilgriff (wiederverwendbar): 2 Std.
- Prüfseite je Familie (12 × 1 h): 12 Std.

**Gesamt: 68 Übungen, rund 192 Arbeitsstunden** (Übungen 103,0, Basis der Familien 63,0, einmalig 26) **und rund 29,7 Stunden Rechenzeit** (1784 min) auf vier CPU-Kernen. Die Schätzung je Übung ist eine Einzelschätzung wie in D-411 (Spanne dort 250 bis 400 Stunden für alle 124 Übungen); nach den ersten beiden Familien wird sie an der Ist-Zeit nachgeführt.

**Reihenfolge:** erst die drei Pilot-Familien (Kniebeuge, Waagrechtes Drücken, Senkrechtes Ziehen), weil Rig-Muster und Kamera stehen, dann die übrigen Familien nach Einheiten in den drei Programmen. Jede Familie kommt auf einem eigenen Branch mit Prüfseite; die Videos gehen erst in die App, wenn der Produktinhaber die Prüfseite freigibt.
