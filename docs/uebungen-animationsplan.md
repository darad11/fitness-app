# Animationsplan: Übungen der drei Programme

Stand: 2026-10-27 (Zuordnung D-411), Plan vom 28.10.2026 (D-429, Reihenfolge nach Programmen D-434). Erzeugt aus `tools/uebungen-3d/familien.json` und `src/modules/training/data/programs.v1.json` mit `tools/uebungen_animationsplan.py`; Änderungen dort, nicht hier.

Vorerst bekommen nur die Übungen der Programme „Ganzkörper A/B, 4 Tage“ (GK), „Push/Pull/Beine, rotierend“ (PPB) und „Winterprogramm 2026“ (W26) eine Animation (Entscheidung des Produktinhabers, fünfte Nachricht vom 28.10.2026). Reihenfolge (sechste Nachricht): erst alle Übungen aus „Ganzkörper A/B“, weil der Produktinhaber dort nach einer Pause startet, dann die noch fehlenden aus „Push/Pull/Beine“, zuletzt die noch fehlenden aus „Winterprogramm 2026“; innerhalb jedes Programms nach Bewegungsfamilien, damit gemeinsame Grundlagen nur einmal entstehen. Die drei Pilot-Übungen (Kniebeuge mit Langhantel, Bankdrücken mit Langhantel, Latziehen) laufen als Schleifen in der App; ihre Familien haben die Basis (Rig-Muster, Kamera) schon. Umgesetzt wird in der Phase Programme (Auftrag `docs/prompts/programme-ganzkoerper-FORM.md`) familienweise: erst eine Prüfseite, die Schleifen der Familie nach der Freigabe des Produktinhabers.

**Fortschritt** (Stand 30.10.2026, Spalte „Stand“ in den Tabellen): Schleife in der App (D-461): 3; Schleife in der App (D-463): 2; Schleife in der App (D-465): 1; Prüfseite, wartet auf Freigabe (D-466): 2; offen: 60.

## 1. Was gezählt ist

- **Einheiten:** wie oft die Übung im Verlauf der drei Programme vorkommt (je Woche die Tage laut Plan).
- **Quelle der Bewegung:** „Familie (Code)“ heißt aus dem Grundmuster der Familie im Rig gebaut (wie die Piloten); „Mixamo“ und „CMU“ sind Aufnahmen, die übertragen werden (`docs/uebungen-bewegungsfamilien.md` Abschnitt 5).
- **Aufwand:** Arbeitsstunden je Übung aus D-411 (Variante bauen und prüfen) plus das neue Gerät, einmal gezählt bei der ersten Übung, die es braucht; dazu je Familie die Basis (Grundmuster, Rig-Regeln, Kamera, Prüfseite), einmal gezählt beim ersten Programm, das die Familie braucht; bei den drei Pilot-Familien schon geleistet. Ohne Rechenzeit.
- **Renderzeit:** je Übung 60 Bilder der Schleife à 23 s (C männlich, A1, 720 × 540, 40 Proben, ein Prozess auf vier CPU-Kernen, gemessen an den Standbildern D-424: Kniebeuge 18 s, Bankdrücken 25 s) plus 1 min Aufbau und Vorschaubild; mit Gerät im Bild 10 % mehr. Die Rechenzeit läuft im Hintergrund, sie ist kein Arbeitsaufwand.

## 2. Übungen nach Programmen und Familien

### 1. Ganzkörper A/B, 4 Tage (GK)

#### Waagrechtes Drücken

| Übung | auch in | Einheiten | Quelle der Bewegung | Aufwand (Std.) | davon neues Gerät | Renderzeit (min) | Hinweis | Stand |
|---|---|---|---|---|---|---|---|---|
| Schrägbankdrücken mit Kurzhanteln | PPB, W26 | 23 | Familie (Code) | 0,75 | 0,00 | 26 |  | Schleife in der App (D-463) |
| Bankdrücken mit Kurzhanteln | W26 | 22 | Familie (Code) | 2,00 | 1,00 | 26 | neues Gerät: Kurzhanteln | Schleife in der App (D-463) |

Waagrechtes Drücken: 2 Übungen, Aufwand 2,8 Std. (davon neue Geräte 1,0) (Basis schon geleistet), Renderzeit 53 min.

#### Kniebeuge

| Übung | auch in | Einheiten | Quelle der Bewegung | Aufwand (Std.) | davon neues Gerät | Renderzeit (min) | Hinweis | Stand |
|---|---|---|---|---|---|---|---|---|
| Beinpresse | PPB, W26 | 23 | Familie (Code) | 5,25 | 4,00 | 26 | neues Gerät: Beinpresse 45° | Schleife in der App (D-465) |

Kniebeuge: 1 Übungen, Aufwand 5,2 Std. (davon neue Geräte 4,0) (Basis schon geleistet), Renderzeit 26 min.

#### Senkrechtes Ziehen

| Übung | auch in | Einheiten | Quelle der Bewegung | Aufwand (Std.) | davon neues Gerät | Renderzeit (min) | Hinweis | Stand |
|---|---|---|---|---|---|---|---|---|
| Latziehen | W26 | 17 | Familie (Code) | 0,50 | 0,00 | 26 | Pilot | Schleife in der App (D-461) |

Senkrechtes Ziehen: 1 Übungen, Aufwand 0,5 Std. (davon neue Geräte 0,0) (Basis schon geleistet), Renderzeit 26 min.

#### Rumpf

| Übung | auch in | Einheiten | Quelle der Bewegung | Aufwand (Std.) | davon neues Gerät | Renderzeit (min) | Hinweis | Stand |
|---|---|---|---|---|---|---|---|---|
| Unterarmstütz (Plank) | W26 | 22 | Familie (Code) | 0,75 | 0,00 | 26 |  | Prüfseite, wartet auf Freigabe (D-466) |
| Crunches | W26 | 20 | Familie (Code) | 0,50 | 0,00 | 26 |  | Prüfseite, wartet auf Freigabe (D-466) |

Rumpf: 2 Übungen, Aufwand 1,2 Std. (davon neue Geräte 0,0) plus Basis der Familie 12,0 Std., Renderzeit 53 min.

#### Schulter und Brust isoliert

| Übung | auch in | Einheiten | Quelle der Bewegung | Aufwand (Std.) | davon neues Gerät | Renderzeit (min) | Hinweis | Stand |
|---|---|---|---|---|---|---|---|---|
| Seitheben mit Kurzhanteln | PPB, W26 | 24 | Familie (Code) | 0,50 | 0,00 | 26 |  | offen |

Schulter und Brust isoliert: 1 Übungen, Aufwand 0,5 Std. (davon neue Geräte 0,0) plus Basis der Familie 5,0 Std., Renderzeit 26 min.

#### Waagrechtes Ziehen

| Übung | auch in | Einheiten | Quelle der Bewegung | Aufwand (Std.) | davon neues Gerät | Renderzeit (min) | Hinweis | Stand |
|---|---|---|---|---|---|---|---|---|
| Rudern am Kabel, sitzend | PPB, W26 | 24 | Familie (Code) | 2,50 | 2,00 | 26 | neues Gerät: Kabelrudern-Station (Sitz, Fußstütze, untere Rolle) | offen |

Waagrechtes Ziehen: 1 Übungen, Aufwand 2,5 Std. (davon neue Geräte 2,0) plus Basis der Familie 6,0 Std., Renderzeit 26 min.

#### Beine isoliert

| Übung | auch in | Einheiten | Quelle der Bewegung | Aufwand (Std.) | davon neues Gerät | Renderzeit (min) | Hinweis | Stand |
|---|---|---|---|---|---|---|---|---|
| Beinbeuger liegend | W26 | 23 | Familie (Code) | 4,00 | 3,00 | 26 | neues Gerät: Beinbeuger-Maschine, liegend | offen |

Beine isoliert: 1 Übungen, Aufwand 4,0 Std. (davon neue Geräte 3,0) plus Basis der Familie 4,0 Std., Renderzeit 26 min.

#### Hüftbeuge

| Übung | auch in | Einheiten | Quelle der Bewegung | Aufwand (Std.) | davon neues Gerät | Renderzeit (min) | Hinweis | Stand |
|---|---|---|---|---|---|---|---|---|
| Rumänisches Kreuzheben mit Kurzhanteln | W26 | 21 | Familie (Code) | 0,50 | 0,00 | 26 |  | offen |

Hüftbeuge: 1 Übungen, Aufwand 0,5 Std. (davon neue Geräte 0,0) plus Basis der Familie 10,0 Std., Renderzeit 26 min.

#### Senkrechtes Drücken

| Übung | auch in | Einheiten | Quelle der Bewegung | Aufwand (Std.) | davon neues Gerät | Renderzeit (min) | Hinweis | Stand |
|---|---|---|---|---|---|---|---|---|
| Schulterdrücken an der Maschine | W26 | 20 | Familie (Code) | 5,00 | 4,00 | 26 | neues Gerät: Schulterpresse-Maschine | offen |

Senkrechtes Drücken: 1 Übungen, Aufwand 5,0 Std. (davon neue Geräte 4,0) plus Basis der Familie 5,0 Std., Renderzeit 26 min.

**Ganzkörper A/B, 4 Tage: 11 Übungen in 9 Familien, Aufwand 22,2 Std. (davon neue Geräte 14,0) plus Basis 42,0 Std., Renderzeit 289 min (4,8 Std.).**

### 2. Push/Pull/Beine, rotierend (PPB)

Schon in den Programmen davor: 4 Übungen (Beinpresse, Rudern am Kabel, sitzend, Schrägbankdrücken mit Kurzhanteln, Seitheben mit Kurzhanteln).

#### Kniebeuge

| Übung | auch in | Einheiten | Quelle der Bewegung | Aufwand (Std.) | davon neues Gerät | Renderzeit (min) | Hinweis | Stand |
|---|---|---|---|---|---|---|---|---|
| Kniebeuge mit Langhantel | W26 | 8 | Familie (Code) | 1,00 | 0,00 | 26 | Pilot | Schleife in der App (D-461) |

Kniebeuge: 1 Übungen, Aufwand 1,0 Std. (davon neue Geräte 0,0) (Basis schon geleistet), Renderzeit 26 min.

#### Waagrechtes Drücken

| Übung | auch in | Einheiten | Quelle der Bewegung | Aufwand (Std.) | davon neues Gerät | Renderzeit (min) | Hinweis | Stand |
|---|---|---|---|---|---|---|---|---|
| Bankdrücken mit Langhantel | – | 4 | Familie (Code) | 0,50 | 0,00 | 26 | Pilot | Schleife in der App (D-461) |
| Dips | – | 4 | Familie (Code) | 2,50 | 1,00 | 26 | neues Gerät: Dipbarren | offen |

Waagrechtes Drücken: 2 Übungen, Aufwand 3,0 Std. (davon neue Geräte 1,0) (Basis schon geleistet), Renderzeit 53 min.

#### Senkrechtes Ziehen

| Übung | auch in | Einheiten | Quelle der Bewegung | Aufwand (Std.) | davon neues Gerät | Renderzeit (min) | Hinweis | Stand |
|---|---|---|---|---|---|---|---|---|
| Klimmzüge mit Unterstützung | W26 | 5 | Familie (Code) | 5,50 | 4,00 | 26 | neues Gerät: Gegengewichtsmaschine für Klimmzug und Dip | offen |

Senkrechtes Ziehen: 1 Übungen, Aufwand 5,5 Std. (davon neue Geräte 4,0) (Basis schon geleistet), Renderzeit 26 min.

#### Arme beugen und strecken

| Übung | auch in | Einheiten | Quelle der Bewegung | Aufwand (Std.) | davon neues Gerät | Renderzeit (min) | Hinweis | Stand |
|---|---|---|---|---|---|---|---|---|
| Trizepsdrücken am Kabel | W26 | 8 | Familie (Code) | 0,75 | 0,00 | 26 |  | offen |
| Bizepscurls mit Langhantel | – | 4 | Familie (Code) | 0,50 | 0,00 | 26 |  | offen |
| Hammercurls | – | 4 | Familie (Code) | 0,50 | 0,00 | 26 |  | offen |

Arme beugen und strecken: 3 Übungen, Aufwand 1,8 Std. (davon neue Geräte 0,0) plus Basis der Familie 4,0 Std., Renderzeit 79 min.

#### Beine isoliert

| Übung | auch in | Einheiten | Quelle der Bewegung | Aufwand (Std.) | davon neues Gerät | Renderzeit (min) | Hinweis | Stand |
|---|---|---|---|---|---|---|---|---|
| Wadenheben sitzend | W26 | 11 | Familie (Code) | 3,75 | 3,00 | 26 | neues Gerät: Wadenmaschine, sitzend | offen |
| Beinbeuger sitzend | – | 4 | Familie (Code) | 2,25 | 1,50 | 26 | neues Gerät: Beinbeuger-Maschine, sitzend (vom Beinstrecker abgeleitet) | offen |

Beine isoliert: 2 Übungen, Aufwand 6,0 Std. (davon neue Geräte 4,5) (Basis schon geleistet), Renderzeit 53 min.

#### Hüftbeuge

| Übung | auch in | Einheiten | Quelle der Bewegung | Aufwand (Std.) | davon neues Gerät | Renderzeit (min) | Hinweis | Stand |
|---|---|---|---|---|---|---|---|---|
| Rumänisches Kreuzheben mit Langhantel | W26 | 9 | Familie (Code) | 0,75 | 0,00 | 26 |  | offen |

Hüftbeuge: 1 Übungen, Aufwand 0,8 Std. (davon neue Geräte 0,0) (Basis schon geleistet), Renderzeit 26 min.

#### Waagrechtes Ziehen

| Übung | auch in | Einheiten | Quelle der Bewegung | Aufwand (Std.) | davon neues Gerät | Renderzeit (min) | Hinweis | Stand |
|---|---|---|---|---|---|---|---|---|
| Face Pulls am Kabel | – | 4 | Familie (Code) | 2,50 | 1,00 | 26 | neues Gerät: Seilgriff (Trizepsseil) | offen |
| Rudern mit Langhantel, vorgebeugt | – | 4 | Familie (Code) | 1,50 | 0,00 | 26 |  | offen |

Waagrechtes Ziehen: 2 Übungen, Aufwand 4,0 Std. (davon neue Geräte 1,0) (Basis schon geleistet), Renderzeit 53 min.

#### Rumpf

| Übung | auch in | Einheiten | Quelle der Bewegung | Aufwand (Std.) | davon neues Gerät | Renderzeit (min) | Hinweis | Stand |
|---|---|---|---|---|---|---|---|---|
| Beinheben hängend | – | 4 | Familie (Code) | 1,50 | 0,00 | 26 |  | offen |

Rumpf: 1 Übungen, Aufwand 1,5 Std. (davon neue Geräte 0,0) (Basis schon geleistet), Renderzeit 26 min.

#### Senkrechtes Drücken

| Übung | auch in | Einheiten | Quelle der Bewegung | Aufwand (Std.) | davon neues Gerät | Renderzeit (min) | Hinweis | Stand |
|---|---|---|---|---|---|---|---|---|
| Schulterdrücken mit Langhantel, stehend | – | 4 | Familie (Code) | 0,50 | 0,00 | 26 |  | offen |

Senkrechtes Drücken: 1 Übungen, Aufwand 0,5 Std. (davon neue Geräte 0,0) (Basis schon geleistet), Renderzeit 26 min.

**Push/Pull/Beine, rotierend: 14 Übungen in 9 Familien, Aufwand 24,0 Std. (davon neue Geräte 10,5) plus Basis 4,0 Std., Renderzeit 368 min (6,1 Std.).**

### 3. Winterprogramm 2026 (W26)

Schon in den Programmen davor: 16 Übungen (Bankdrücken mit Kurzhanteln, Beinbeuger liegend, Beinpresse, Crunches, Klimmzüge mit Unterstützung, Kniebeuge mit Langhantel, Latziehen, Rudern am Kabel, sitzend, Rumänisches Kreuzheben mit Kurzhanteln, Rumänisches Kreuzheben mit Langhantel, Schrägbankdrücken mit Kurzhanteln, Schulterdrücken an der Maschine, Seitheben mit Kurzhanteln, Trizepsdrücken am Kabel, Unterarmstütz (Plank), Wadenheben sitzend).

#### Senkrechtes Ziehen

| Übung | auch in | Einheiten | Quelle der Bewegung | Aufwand (Std.) | davon neues Gerät | Renderzeit (min) | Hinweis | Stand |
|---|---|---|---|---|---|---|---|---|
| Einarmiges Latziehen am Kabel, kniend | – | 5 | Familie (Code) | 1,50 | 0,00 | 26 |  | offen |
| Latziehen, enger Griff | – | 4 | Familie (Code) | 1,50 | 0,50 | 26 | neues Gerät: V-Griff | offen |
| Überzüge am Kabel | – | 4 | Familie (Code) | 1,30 | 0,30 | 26 | neues Gerät: gerade Kabelstange, kurz | offen |

Senkrechtes Ziehen: 3 Übungen, Aufwand 4,3 Std. (davon neue Geräte 0,8) (Basis schon geleistet), Renderzeit 79 min.

#### Waagrechtes Drücken

| Übung | auch in | Einheiten | Quelle der Bewegung | Aufwand (Std.) | davon neues Gerät | Renderzeit (min) | Hinweis | Stand |
|---|---|---|---|---|---|---|---|---|
| Schrägbankdrücken am Kabel | – | 7 | Familie (Code) | 1,50 | 0,00 | 26 |  | offen |
| Liegestütze | – | 4 | Mixamo „Push Up“ | 1,50 | 0,00 | 24 |  | offen |
| Enges Bankdrücken | – | 2 | Familie (Code) | 0,50 | 0,00 | 26 |  | offen |

Waagrechtes Drücken: 3 Übungen, Aufwand 3,5 Std. (davon neue Geräte 0,0) (Basis schon geleistet), Renderzeit 77 min.

#### Kniebeuge

| Übung | auch in | Einheiten | Quelle der Bewegung | Aufwand (Std.) | davon neues Gerät | Renderzeit (min) | Hinweis | Stand |
|---|---|---|---|---|---|---|---|---|
| Beinpresse, einbeinig | – | 5 | Familie (Code) | 0,75 | 0,00 | 26 |  | offen |
| Goblet Squat | – | 4 | Familie (Code) | 1,00 | 0,00 | 26 |  | offen |

Kniebeuge: 2 Übungen, Aufwand 1,8 Std. (davon neue Geräte 0,0) (Basis schon geleistet), Renderzeit 53 min.

#### Arme beugen und strecken

| Übung | auch in | Einheiten | Quelle der Bewegung | Aufwand (Std.) | davon neues Gerät | Renderzeit (min) | Hinweis | Stand |
|---|---|---|---|---|---|---|---|---|
| Bizepscurls am Kabel | – | 6 | Familie (Code) | 0,75 | 0,00 | 26 |  | offen |
| Trizepsdrücken am Kabel, über Kreuz | – | 6 | Familie (Code) | 1,00 | 0,00 | 26 |  | offen |
| Hammercurls am Kabel mit Seil | – | 5 | Familie (Code) | 0,75 | 0,00 | 26 |  | offen |
| French Press mit SZ-Stange | – | 4 | Familie (Code) | 1,00 | 0,00 | 26 |  | offen |
| Scottcurls mit Kurzhanteln | – | 4 | Familie (Code) | 0,75 | 0,00 | 26 |  | offen |
| Trizepsstrecken über Kopf am Kabel | – | 4 | Familie (Code) | 1,25 | 0,00 | 26 |  | offen |
| Bizepscurls mit Kurzhanteln | – | 3 | Mixamo „Bicep Curl“ | 1,00 | 0,00 | 26 |  | offen |
| Reverse Curls mit SZ-Stange | – | 3 | Familie (Code) | 0,50 | 0,00 | 26 |  | offen |
| Schrägbank-Curls mit Kurzhanteln | – | 3 | Familie (Code) | 1,00 | 0,00 | 26 |  | offen |
| French Press mit Kurzhanteln | – | 2 | Familie (Code) | 0,50 | 0,00 | 26 |  | offen |
| Trizepsstrecken über Kopf mit Kurzhantel | – | 1 | Familie (Code) | 1,00 | 0,00 | 26 |  | offen |

Arme beugen und strecken: 11 Übungen, Aufwand 9,5 Std. (davon neue Geräte 0,0) (Basis schon geleistet), Renderzeit 289 min.

#### Kondition

| Übung | auch in | Einheiten | Quelle der Bewegung | Aufwand (Std.) | davon neues Gerät | Renderzeit (min) | Hinweis | Stand |
|---|---|---|---|---|---|---|---|---|
| Laufband | – | 39 | CMU 35_17 | 4,50 | 3,00 | 26 | neues Gerät: Laufband | offen |

Kondition: 1 Übungen, Aufwand 4,5 Std. (davon neue Geräte 3,0) plus Basis der Familie 10,0 Std., Renderzeit 26 min.

#### Schulter und Brust isoliert

| Übung | auch in | Einheiten | Quelle der Bewegung | Aufwand (Std.) | davon neues Gerät | Renderzeit (min) | Hinweis | Stand |
|---|---|---|---|---|---|---|---|---|
| Butterfly an der Maschine | – | 5 | Familie (Code) | 5,00 | 4,00 | 26 | neues Gerät: Butterfly-Maschine (auch für Reverse Butterfly) | offen |
| Fliegende am Kabel | – | 5 | Familie (Code) | 5,00 | 3,50 | 26 | neues Gerät: Kabelzug: zwei Säulen mit höhenverstellbaren Rollen, D-Griff | offen |
| Seitheben am Kabel | – | 5 | Familie (Code) | 1,00 | 0,00 | 26 |  | offen |
| Reverse Flys mit Kurzhanteln | – | 4 | Familie (Code) | 1,00 | 0,00 | 26 |  | offen |
| Frontheben mit Kurzhanteln | – | 3 | Mixamo „Front Raises“ | 1,00 | 0,00 | 26 |  | offen |
| Frontheben am Kabel | – | 2 | Familie (Code) | 1,00 | 0,00 | 26 |  | offen |

Schulter und Brust isoliert: 6 Übungen, Aufwand 14,0 Std. (davon neue Geräte 7,5) (Basis schon geleistet), Renderzeit 158 min.

#### Rumpf

| Übung | auch in | Einheiten | Quelle der Bewegung | Aufwand (Std.) | davon neues Gerät | Renderzeit (min) | Hinweis | Stand |
|---|---|---|---|---|---|---|---|---|
| Beinheben liegend | – | 5 | Familie (Code) | 0,75 | 0,00 | 26 |  | offen |
| Russian Twist | – | 4 | Familie (Code) | 1,25 | 0,00 | 26 |  | offen |
| Heel Taps | – | 3 | Familie (Code) | 1,00 | 0,00 | 26 |  | offen |
| Knieheben stehend | – | 3 | Familie (Code) | 0,75 | 0,00 | 24 |  | offen |
| Sit-ups | – | 3 | Mixamo „Situps“ | 1,00 | 0,00 | 26 |  | offen |
| Bicycle Crunches | – | 2 | Mixamo „Bicycle Crunch“ | 1,00 | 0,00 | 26 |  | offen |
| Dead Bug | – | 1 | Familie (Code) | 1,00 | 0,00 | 26 |  | offen |
| Windshield Wipers | – | 1 | Familie (Code) | 1,25 | 0,00 | 26 |  | offen |

Rumpf: 8 Übungen, Aufwand 8,0 Std. (davon neue Geräte 0,0) (Basis schon geleistet), Renderzeit 208 min.

#### Beine isoliert

| Übung | auch in | Einheiten | Quelle der Bewegung | Aufwand (Std.) | davon neues Gerät | Renderzeit (min) | Hinweis | Stand |
|---|---|---|---|---|---|---|---|---|
| Beinstrecker | – | 7 | Familie (Code) | 4,00 | 3,50 | 26 | neues Gerät: Beinstrecker-Maschine | offen |
| Wadenheben mit Kurzhanteln | – | 7 | Familie (Code) | 0,50 | 0,00 | 26 |  | offen |
| Wadenheben an der Beinpresse | – | 2 | Familie (Code) | 0,75 | 0,00 | 26 |  | offen |

Beine isoliert: 3 Übungen, Aufwand 5,2 Std. (davon neue Geräte 3,5) (Basis schon geleistet), Renderzeit 79 min.

#### Hüftbeuge

| Übung | auch in | Einheiten | Quelle der Bewegung | Aufwand (Std.) | davon neues Gerät | Renderzeit (min) | Hinweis | Stand |
|---|---|---|---|---|---|---|---|---|
| Hip Thrust mit Kurzhantel | – | 9 | Familie (Code) | 0,50 | 0,00 | 26 |  | offen |
| Pull-Throughs am Kabel | – | 5 | Familie (Code) | 1,25 | 0,00 | 26 |  | offen |

Hüftbeuge: 2 Übungen, Aufwand 1,8 Std. (davon neue Geräte 0,0) (Basis schon geleistet), Renderzeit 53 min.

#### Ausfallschritt und einbeinig

| Übung | auch in | Einheiten | Quelle der Bewegung | Aufwand (Std.) | davon neues Gerät | Renderzeit (min) | Hinweis | Stand |
|---|---|---|---|---|---|---|---|---|
| Ausfallschritte mit Kurzhanteln | – | 9 | Familie (Code) | 0,75 | 0,00 | 26 |  | offen |

Ausfallschritt und einbeinig: 1 Übungen, Aufwand 0,8 Std. (davon neue Geräte 0,0) plus Basis der Familie 7,0 Std., Renderzeit 26 min.

#### Waagrechtes Ziehen

| Übung | auch in | Einheiten | Quelle der Bewegung | Aufwand (Std.) | davon neues Gerät | Renderzeit (min) | Hinweis | Stand |
|---|---|---|---|---|---|---|---|---|
| Rudern an der Multipresse, vorgebeugt | – | 5 | Familie (Code) | 0,75 | 0,00 | 26 |  | offen |
| T-Bar-Rudern | – | 3 | Familie (Code) | 2,00 | 0,50 | 26 | neues Gerät: Landmine-Halterung | offen |

Waagrechtes Ziehen: 2 Übungen, Aufwand 2,8 Std. (davon neue Geräte 0,5) (Basis schon geleistet), Renderzeit 53 min.

#### Senkrechtes Drücken

| Übung | auch in | Einheiten | Quelle der Bewegung | Aufwand (Std.) | davon neues Gerät | Renderzeit (min) | Hinweis | Stand |
|---|---|---|---|---|---|---|---|---|
| Schulterdrücken mit Kurzhanteln, stehend | – | 2 | Familie (Code) | 0,75 | 0,00 | 26 |  | offen |

Senkrechtes Drücken: 1 Übungen, Aufwand 0,8 Std. (davon neue Geräte 0,0) (Basis schon geleistet), Renderzeit 26 min.

**Winterprogramm 2026: 43 Übungen in 12 Familien, Aufwand 56,8 Std. (davon neue Geräte 15,3) plus Basis 17,0 Std., Renderzeit 1126 min (18,8 Std.).**

## 3. Summen und Reihenfolge

| Reihenfolge | Programm | Übungen | Familien | Einheiten | Aufwand Übungen (Std.) | davon neue Geräte | Basis (Std.) | Renderzeit (min) |
|---|---|---|---|---|---|---|---|---|
| 1 | Ganzkörper A/B, 4 Tage | 11 | 9 | 239 | 22,2 | 14,0 | 42,0 | 289 |
| 2 | Push/Pull/Beine, rotierend | 14 | 9 | 77 | 24,0 | 10,5 | 4,0 | 368 |
| 3 | Winterprogramm 2026 | 43 | 12 | 210 | 56,8 | 15,3 | 17,0 | 1126 |
| | **Summe** | **68** | **12** | **526** | **103,0** | **39,8** | **63,0** | **1784** |

Einmalige Arbeiten für die genutzten Quellen:

- CMU-Import (BVH, Umrechnung auf 24 Bilder je Sekunde), Übertragung auf das MakeHuman-Skelett, Fußsperre, Schnitt und Schleife: 8 Std.
- Mixamo-Übertragung (Skelett mixamorig auf das MakeHuman-Skelett): 4 Std.
- Kabelverlauf über mehrere Rollen und Seilgriff (wiederverwendbar): 2 Std.
- Prüfseite je Familie (12 × 1 h): 12 Std.

**Gesamt: 68 Übungen, rund 192 Arbeitsstunden** (Übungen 103,0, Basis der Familien 63,0, einmalig 26) **und rund 29,7 Stunden Rechenzeit** (1784 min) auf vier CPU-Kernen. Die Schätzung je Übung ist eine Einzelschätzung wie in D-411 (Spanne dort 250 bis 400 Stunden für alle 124 Übungen); nach den ersten beiden Familien wird sie an der Ist-Zeit nachgeführt.

**Reihenfolge:** Programm für Programm wie in der Tabelle, innerhalb des Programms Familie für Familie (Pilot-Familien zuerst, dann nach Einheiten). Jede Familie kommt auf einem eigenen Branch mit Prüfseite; die Videos gehen erst in die App, wenn der Produktinhaber die Prüfseite freigibt.
