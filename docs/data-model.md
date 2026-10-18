# Datenmodell

Stand: 18.10.2026 · Version 0.3 (M0 umgesetzt) · Status: MVP-Schema v1 umgesetzt (Basisfelder, Tabellen, Indizes), Fachtypen folgen ab M1 · Vorgänger: `archive/v0.1-phase-1/data-model.md`

## Änderungen gegenüber Version 0.1

- Neu: Analyse der Datenbeziehungen und Wahl der Sync-Einheit (Abschnitt 2). Ergebnis: Synchronisierung pro Aggregat (D-205).
- Lokale Speicherung als Aggregat-Dokumente mit lokalen Projektionen statt normalisierter Tabellen (D-204).
- Hybride logische Uhr (HLC) statt clientseitiger Revisionszähler (D-206); deterministische IDs für natürliche Schlüssel und gebündelte Stammdaten (D-207, D-230).
- Versionsketten für Programme und Rezepte entfallen; historische Treue über Snapshots (D-209).
- Konfliktregeln je Entität als 3-Wege-Merge mit Vorrangregeln (Abschnitt 7) statt einer Tabelle mit Zwei-Wege-Regeln.
- Konkretes Dexie-Schema v1 für den MVP (Abschnitt 6), Export- und Importformat (Abschnitt 11), Serverschema für R3 (Abschnitt 12).
- Version 0.3 (M0): Basisfeld `type` an jeder Wurzel; unbekannte Felder bleiben erhalten (D-234); fester Namensraum für UUID v5 (D-235); Inhalt der Tabelle `meta` und der Snapshot-Datenbank konkretisiert (Abschnitt 5); Schema v1 umgesetzt in `src/shared/db/schema.ts` (Abschnitt 6).

## 1. Konventionen

| Thema | Regel |
|---|---|
| IDs | UUID v4 über `crypto.randomUUID()`. Deterministische UUID v5 für Datensätze mit natürlichem Schlüssel (z. B. Schritte eines Tages, Woche eines Menüs) und für gebündelte Stammdaten (Basisübungen, Beispielvorlagen, BLS-Lebensmittel). Alle im festen Namensraum der App `a9f1c5d1-6d1e-4d1d-b94d-d8ca701b9904` (D-235) mit Schlüsseln je Typ, z. B. `core-exercise:bench_press` oder `singleton:settings` |
| Zeitpunkte | ISO 8601 in UTC mit Millisekunden, z. B. `2026-10-18T09:15:02.123Z` |
| Tagesbezug | `dayKey` (lokales Datum `YYYY-MM-DD`) plus `tz` (IANA-Zone, z. B. `Europe/Vienna`) am Datensatz. Tageswerte gruppieren nach `dayKey`, nie nach UTC. Eine Trainingseinheit gehört zum Tag ihres Starts (D-223) |
| Änderungsstempel | `hlc` = hybride logische Uhr im Format `<ISO-Zeit>-<Zähler 4-stellig>-<Geräte-ID 8-stellig>`, z. B. `2026-10-18T09:15:02.123Z-0003-a1b2c3d4`. Lexikografisch sortierbar. Bei lokaler Änderung: `max(jetzt, letzte Zeit)`, bei Gleichstand Zähler + 1. Beim Empfang fremder Stempel springt die lokale Uhr mindestens auf deren Zeit |
| Einheiten | Masse kg (Körper und Last), Länge cm, Distanz m, Dauer s, Volumen ml, Energie kcal, Nährstoffe g. Nur metrische Anzeige (D-104) |
| Geld | Derzeit nicht benötigt; falls nötig ganzzahlige Cent mit Währung `EUR` (D-105) |
| Rundung | Gespeichert wird ungerundet. Anzeige: Körpergewicht 0,1 kg; Last bis 0,25 kg genau ohne überflüssige Nullen („72,5 kg"); Volumen ganzzahlig; kcal ganzzahlig; Nährstoffe unter 10 g mit einer Nachkommastelle, sonst ganzzahlig |
| Löschen | Weiches Löschen: `deletedAt` enthält den HLC-Stempel der Löschung, `deletedFrom` den Status zum Zeitpunkt der Löschung. Gilt für Wurzeln und Kinder. Physisch entfernt wird erst nach erfolgreichem Abgleich und 180 Tagen (ab R3) oder bei „Alle Daten löschen" |
| Historie | Protokolle speichern Snapshots der verwendeten Stammdaten: Übungsname, Erfassungsart, Satzziele, später Nährwerte und Zutaten. Spätere Änderungen an Stammdaten verändern Protokolle nie (D-209) |
| Schemaversion | `schemaVersion` je Dokument. Inhaltliche Änderungen migrieren beim Lesen über Zod-Transformationen und werden beim nächsten Schreiben gespeichert. Neue Indizes oder Tabellen erhöhen die Dexie-Version (additiv, mit Snapshot) |
| Validierung | Ein Zod-Schema je Typ prüft Eingaben, Importe und später Sync-Daten |
| Suche | Normalisierung: Kleinschreibung, Unicode-NFD ohne diakritische Zeichen, ä/ö/ü/ß zusätzlich als ae/oe/ue/ss, Bindestriche und Mehrfach-Leerzeichen entfernt |

## 2. Analyse der Datenbeziehungen und Wahl der Sync-Einheit

### 2.1 Beziehungen und Schreibmuster

| Entität | Beziehungstyp | Kinder | Schreibmuster | Gleichzeitige Änderung auf zwei Geräten | Invarianten | Sync-Einheit |
|---|---|---|---|---|---|---|
| Trainingseinheit | Aggregatwurzel | Übungen, darunter Sätze | Viele kleine Schreibvorgänge über 30 bis 90 Minuten auf einem Gerät; später seltene Korrekturen | Selten, aber realistisch (laufend auf dem iPhone, Korrektur am Mac; vergessene Einheit auf zweitem Gerät) | Genau ein Status; eine abgeschlossene Einheit darf nie durch eine veraltete laufende Kopie ersetzt werden; Drop-Sätze gehören zu einem Arbeitssatz derselben Übung | Aggregat mit Fachregeln |
| Programm und Vorlage | Aggregatwurzel | Wochen, Tage, Übungen, Satzvorgaben | Bearbeitung in Sitzungen, selten | Selten (Mac und iPad) | Reihenfolge eindeutig; Drop-Vorgabe hat einen Elternsatz | Aggregat mit Konfliktkopie |
| Trainingszustand | Singleton | – | Selten (Programm aktivieren) | Möglich | Höchstens ein aktives Programm | Einzeldokument, feldweise |
| Körpergewicht | Unabhängiger Eintrag | – | Anlegen, selten ändern | Sehr selten | – | Einzeldokument |
| Ziel | Datierter Eintrag | – | Selten | Selten | Ein aktives Ziel je Art | Einzeldokument |
| Einstellungen, Profil | Singleton | – | Selten, feldweise | Möglich, meist verschiedene Felder | – | Einzeldokument, feldweise |
| Eigene Übung, persönliche Übungsangaben | Stammdatum | – | Selten | Selten | Name eindeutig (weich) | Einzeldokument, feldweise |
| Basisübung, Beispielvorlage, BLS-Lebensmittel | Gebündelte Stammdaten | – | Nur durch App-Update | – | Stabile IDs | Nicht synchronisiert (D-230) |
| Ernährungseintrag (R2) | Unabhängiger Eintrag mit Snapshot | – | Häufig, klein | Möglich (gleicher Tag auf Mac und iPhone) | Snapshot bleibt bis zur Bearbeitung unverändert | Einzeldokument |
| Eigenes Lebensmittel (R2) | Stammdatum | Portionen (eingebettet) | Selten | Selten | – | Einzeldokument, feldweise |
| Rezept (R2) | Aggregatwurzel | Zutaten, Schritte | Selten | Selten | – | Aggregat mit Konfliktkopie |
| Wochenmenü (R2) | Aggregatwurzel | Geplante Mahlzeiten | Planung in Sitzungen | Möglich | Eine Woche je Startdatum (deterministische ID) | Aggregat, Kinder zusammengeführt |
| Einkaufsliste (R2) | Aggregatwurzel | Positionen | Abhaken im Laden, Ergänzen zu Hause | Wahrscheinlich (iPhone im Laden, iPad zu Hause) | – | Aggregat, Kinder feldweise |
| Ernährungsziel (R2) | Datierter Eintrag | – | Selten | Selten | Ein aktives Ziel | Einzeldokument |
| Schritte, Gewohnheitseintrag, Wasser, Tagesnotiz (R4) | Eintrag mit natürlichem Schlüssel | – | Täglich | Möglich | Einer je Tag bzw. je Gewohnheit und Tag | Einzeldokument mit deterministischer ID |
| Fortschrittsfoto (R4) | Eintrag plus Binärdaten | Bild | Selten | Selten | Bild unveränderlich | Einzeldokument; Bild separat (R5) |
| Übungsverlauf | Abgeleitete Projektion | – | Bei Änderung der Quelle | – | Jederzeit neu berechenbar | Nicht synchronisiert |

### 2.2 Bewertung der Verfahren

| Verfahren | Vorteile | Nachteile | Ergebnis |
|---|---|---|---|
| Synchronisierung pro Zeile (normalisierte Tabellen, Vorschlag v0.1) | Feingranular; serverseitig per SQL auswertbar | Aggregate kommen in Teilen an (abgeschlossene Einheit ohne Sätze); Löschkaskaden über Tabellen; jede Tabelle braucht Migration, Trigger und RLS auf dem Server | Verworfen |
| **Synchronisierung pro Aggregat** | Atomar; Invarianten im Aggregat prüfbar; eine generische Servertabelle; neue Typen ohne Servermigration; dieselben Regeln für Import und Sync | Größere Nutzlast (eine Einheit etwa 5 bis 15 KB); der Server kann Inhalte nicht per SQL auswerten (für eine persönliche App nicht nötig) | **Gewählt** (D-205) |
| Operations-Log oder CRDT | Maximale automatische Zusammenführung | Hohe Komplexität, schwer prüfbar, für einen Nutzer überdimensioniert | Verworfen |
| Fertige Dienste (PowerSync, ElectricSQL, Dexie Cloud) | Weniger eigener Code | Zusätzlicher Dienst oder Anbieterwechsel; PowerSync bringt SQLite in den Client | Reserve, falls der eigene Ansatz in R3 scheitert |

Folge für den MVP: Dokumente werden schon jetzt als Aggregate gespeichert, und jede Wurzel trägt die Sync-Metadaten. Damit braucht R3 keine Umstellung der lokalen Daten.

## 3. Aggregate des MVP

Schreibweise in TypeScript-Notation; `?` heißt optional. Alle Wurzeln besitzen die Basisfelder, alle Kinder mit eigener Identität die Kindfelder.

```ts
type HLC = string;            // siehe Abschnitt 1
type DayKey = string;         // 'YYYY-MM-DD'

interface Root {
  id: string;                 // UUID
  type: string;               // Dokumenttyp, z. B. 'session', 'settings' (D-234)
  schemaVersion: number;
  createdAt: string;          // ISO UTC
  hlc: HLC;                   // letzte Änderung
  deletedAt: HLC | null;      // Tombstone
  deletedFrom?: string;       // Status zum Zeitpunkt der Löschung
  deviceId: string;           // zuletzt schreibendes Gerät
}
interface Child { id: string; hlc: HLC; deletedAt: HLC | null; deletedFrom?: string; position: number; }
```

Umsetzung (M0): Zod-Schemas in `src/shared/db/documents.ts`, Basis-Repository in `src/shared/db/repository.ts`. Das Repository setzt alle Basisfelder, speichert den Zustand der Uhr in derselben Transaktion (Tabelle `meta`) und erhält Felder, die das Schema nicht kennt (D-234). Eine Wiederherstellung nach dem Löschen entfernt `deletedFrom`.

### 3.1 Trainingseinheit (`session`)

```ts
interface Session extends Root {
  kind: 'strength' | 'activity';
  source: 'program' | 'template' | 'free' | 'manual';
  status: 'in_progress' | 'completed';
  title: string;                                   // z. B. „Tag A · Ganzkörper"
  program?: {                                      // Snapshot bei Start aus Programm oder Vorlage
    programId: string; programName: string;
    weekId: string; weekIndex: number; weekName: string;
    dayId: string; dayIndex: number; dayName: string;
  };
  dayKey: DayKey; tz: string;
  startedAt: string; endedAt?: string;
  pauses: { start: string; end?: string }[];       // Pausieren/Fortsetzen
  durationSec?: number;                            // bei Abschluss gespeichert, ohne Pausen
  bodyweightKg?: number;                           // Snapshot des letzten Gewichtseintrags
  notes?: string;
  activity?: {                                     // nur bei kind = 'activity'
    type: 'run' | 'walk' | 'cycle' | 'swim' | 'row' | 'hike' | 'other';
    label?: string; durationSec: number; distanceM?: number;
  };
  restTimer?: { afterSetId: string; startedAt: string; endsAt: string; durationSec: number } | null;
  setTimer?: { setId: string; startedAt: string } | null;   // laufender Übungstimer
  exerciseIds: string[];                           // abgeleitet, für den Index
  exercises: SessionExercise[];
}
interface SessionExercise extends Child {
  exerciseId: string; nameSnapshot: string;
  trackingMode: 'weight_reps' | 'reps' | 'time' | 'weight_time';
  restSec?: number; notes?: string;
  replacedFromExerciseId?: string;                 // ursprünglich geplante Übung
  group?: { id: string; type: 'superset' | 'circuit' };     // reserviert (R4)
  sets: SessionSet[];
}
interface SessionSet extends Child {
  type: 'warmup' | 'working' | 'drop';
  parentSetId?: string;                            // Pflicht bei 'drop'
  target?: { repsMin?: number; repsMax?: number; weightKg?: number; durationSec?: number };
  actual: { weightKg?: number; reps?: number; durationSec?: number; rpe?: number };  // rpe reserviert (R4)
  status: 'planned' | 'done' | 'skipped';
  completedAt?: string;
  restSec?: number;
}
```

Regeln: Höchstens eine Einheit mit `in_progress` je Gerät. `completed` setzt `endedAt` und `durationSec` voraus. Der Status ist monoton: eine abgeschlossene Einheit wird nie wieder „laufend"; Korrekturen ändern Werte, nicht den Status. Der UI-Fokus (aktive Übung, Scrollposition) liegt in der lokalen Tabelle `sessionUi`, nicht im Dokument.

### 3.2 Programm und Vorlage (`program`)

```ts
interface Program extends Root {
  kind: 'program' | 'template';
  name: string; description?: string;
  origin: 'user' | 'sample-copy' | 'import';
  sampleKey?: string;                              // Herkunft aus einer Beispielvorlage
  level?: 'beginner' | 'intermediate' | 'advanced';
  location?: 'gym' | 'home' | 'both';
  repeat: boolean;                                 // nach der letzten Woche wieder bei Woche 1
  archivedAt?: string;
  weeks: Week[];
}
interface Week extends Child { name: string; days: Day[] }
interface Day extends Child { name: string; weekdayHint?: 1|2|3|4|5|6|7; notes?: string; exercises: PlannedExercise[] }
interface PlannedExercise extends Child {
  exerciseId: string; nameSnapshot: string;        // Anzeige, falls die Übung gelöscht wurde
  restSec?: number; notes?: string;
  group?: { id: string; type: 'superset' | 'circuit' };     // reserviert (R4)
  sets: PlannedSet[];
}
interface PlannedSet extends Child {
  type: 'warmup' | 'working' | 'drop'; parentSetId?: string;
  repsMin?: number; repsMax?: number; weightKg?: number; durationSec?: number;
  restSec?: number; rpeTarget?: number;            // rpeTarget reserviert (R4)
}
```

Beispielvorlagen sind gebündelte, schreibgeschützte Stammdaten mit stabilen IDs (`sample-templates.md`). „Vorlage verwenden" erzeugt ein Nutzerprogramm mit neuen IDs und `origin = 'sample-copy'`.

### 3.3 Trainingszustand (`training_state`, Singleton)

```ts
interface TrainingState extends Root {             // feste ID (UUID v5 aus 'singleton:training_state')
  activeProgramId?: string; activeSince?: string;
  history: { programId: string; from: string; to?: string }[];
}
```

### 3.4 Übungen

Basisübungen kommen aus dem App-Bündel (Abschnitt 5 von `sample-templates.md`) und liegen nicht in der Datenbank. Eigene Übungen sind Dokumente:

```ts
interface CustomExercise extends Root {            // Typ 'exercise'
  name: string; nameNorm: string; aliases: string[];
  primaryMuscles: Muscle[]; secondaryMuscles: Muscle[];
  equipment: Equipment[];
  category: 'strength' | 'cardio' | 'mobility' | 'core';
  trackingMode: 'weight_reps' | 'reps' | 'time' | 'weight_time';
  isUnilateral?: boolean; instructions?: string[];
  archivedAt?: string;
}
interface ExercisePref extends Root {              // Typ 'exercise_pref', ID = UUID v5 aus der Übungs-ID
  exerciseId: string;                              // Basis- oder eigene Übung
  notes?: string; defaultRestSec?: number; weightStepKg?: number;
  videoUrl?: string; hidden?: boolean; favorite?: boolean;
}
```

Persönliche Angaben zu Basisübungen liegen ausschließlich in `ExercisePref`; ein App-Update der Basisbibliothek berührt sie nie (AK-EXL-04).

### 3.5 Körpergewicht (`body_weight`)

```ts
interface BodyWeight extends Root {
  measuredAt: string; dayKey: DayKey; tz: string;
  weightKg: number;                                // 20 bis 400
  note?: string; source: 'manual' | 'import';
}
```

### 3.6 Ziele (`goal`)

```ts
interface Goal extends Root {
  kind: 'body_weight' | 'weekly_sessions';         // später: 'nutrition' (eigener Typ in R2)
  value: number;                                   // kg bzw. Einheiten pro Woche
  effectiveFrom: DayKey; endedAt?: string;
}
```

Aktiv ist je Art das Ziel mit dem jüngsten `effectiveFrom` ohne `endedAt` und ohne Löschung; bei Gleichstand der jüngere HLC. Eine Änderung beendet das bisherige Ziel und legt ein neues an.

### 3.7 Einstellungen und Profil (Singletons)

```ts
interface Settings extends Root {                  // feste ID
  restDefaultSec: number;        // 90
  weightStepKg: number;          // 2,5
  autoStartRest: boolean;        // true
  restSound: boolean;            // true
  keepAwake: boolean;            // true
  theme: 'light' | 'dark' | 'system';   // 'light'
  locale: 'auto' | 'de-AT' | 'de-CH' | 'de-DE';   // 'auto'
  backupReminderDays: number;    // 14
}
interface Profile extends Root { displayName?: string }   // R2 ergänzt Körperdaten für Formeln
```

## 4. Aggregate späterer Ausbaustufen (Spezifikation)

Die Felder sind festgelegt, damit spätere Module ohne Umbau hinzukommen. Feinheiten werden zu Beginn der jeweiligen Stufe spezifiziert.

| Typ | Stufe | Wesentliche Felder | Snapshot und Integrität |
|---|---|---|---|
| `food` (eigenes Lebensmittel) | R2 | name, brand, barcode, basis g/ml, per100 {kcal, protein, carbs, sugar, fat, saturatedFat, fiber, salt}, missing[] (fehlende Felder), servings[{id, name, grams}], densityGPerMl, source ('custom'/'off'/'quick'/'import'), quality ('verified'/'community'/'user'/'estimated'), category, favorite | kcal-Plausibilität 4/4/9 mit Toleranz max(15 %, 20 kcal); unvollständige Felder bleiben leer statt 0 |
| `generic_food` (BLS, lokal) | R2 | BLS-Code, Name, Kategorie, per100, Datenversion | Nicht synchronisiert; ID deterministisch aus dem BLS-Code |
| `food_log_entry` | R2 | dayKey, tz, slotId, loggedAt, kind ('food'/'recipe'/'quick'), foodId oder recipeId, nameSnapshot, quantityGrams, servingsCount, servingNameSnapshot, nutrients (absolut), missing[], quality, isEstimated, notes, idempotencyKey | Nährwerte beim Protokollieren eingefroren; Rezept-Einträge speichern zusätzlich die Zutatenliste als Snapshot |
| `nutrition_target` | R2 | effectiveFrom, kcal, proteinG, carbsG, fatG, method ('computed'/'manual'), inputsSnapshot | Wie Ziele datiert |
| `recipe` | R2 | name, servings, mealTypes[], tags[], prepMin, cookMin, steps[], ingredients[{id, foodId/genericFoodId, nameSnapshot, quantity, unit, grams, per100Snapshot}], nutritionPerServing (Cache) | Bearbeiten ändert das Rezept; Protokolle behalten Snapshots |
| `meal_plan` | R2 | ID aus Wochenstart, weekStart, status ('draft'/'confirmed'), enabledSlots[], meals[{id, dayKey, slotId, recipeId/foodId, servings, nameSnapshot, nutritionSnapshot, status}] | Eine Woche je Startdatum |
| `shopping_list` | R2 | mealPlanId, generatedAt, stale, items[{id, name, foodRef, quantity, unit, category, checked, manual, inPantry, sourceMealIds[]}] | Neuerzeugung behält manuelle Positionen und Vorratsmarken |
| `body_measurement` | R4 | measuredAt, dayKey, site, valueCm, optional bodyFatPercent mit Methode | – |
| `progress_photo` | R4 | takenAt, dayKey, pose, blobId (lokal), sha256, width, height, bytes, note | Bild unveränderlich; Blob in lokaler Tabelle `mediaBlob` |
| `step_entry` | R4 | ID aus dayKey, dayKey, steps, source ('manual'/'shortcut'/'import') | Einer je Tag |
| `habit`, `habit_log` | R4 | habit: name, frequency, targetValue, unit; log: ID aus Gewohnheit und Tag, done, value | Einer je Gewohnheit und Tag |
| `water_entry`, `daily_note` | R4 | dayKey, ml bzw. text | – |

## 5. Lokale, nicht synchronisierte Tabellen

| Tabelle | Inhalt | Lebensdauer |
|---|---|---|
| `exerciseHistory` | Projektion je abgeschlossener Einheit und Übung: exerciseId, sessionId, completedAt, dayKey, title, Sätze (Typ, Gewicht, Wiederholungen, Dauer), bester Satz, bestes geschätztes 1RM, Volumen, Satzzahl | Wird bei Abschluss, Bearbeitung und Löschung in derselben Transaktion aktualisiert; vollständiger Neuaufbau bei Versionswechsel der Projektion |
| `sessionUi` | UI-Zustand der laufenden Einheit (fokussierte Übung und Satz) | Bis zum Abschluss |
| `meta` | Geräte-ID, HLC-Zustand, Projektionsversion, Version der gebündelten Daten, letzter Export, Status „dauerhafter Speicher", ausgeblendete Hinweise, Ersteinrichtung erledigt. Seit M0 belegt: `deviceId` (8 Hex-Zeichen), `hlc` (`{ wallMs, counter }`), `hints.dismissed` (Liste, z. B. `ios-install`) | Dauerhaft |
| `errorLog` | Ringpuffer mit 500 Einträgen: Zeit, Ebene, Bereich, Meldung ohne Nutzdaten, Hash des Stacks, Route, App-Version | Rollierend |
| Datenbank `fitness-snapshots` | Tabelle `snapshots` (`++id, createdAt`): Zeitpunkt, Anlass (`schema-upgrade`, `import`, `delete-all`), App-Version, Quelldatenbank und deren Schemaversion, Kodierung (`gzip` über `CompressionStream`, sonst `json`), Größe, Anzahl je Tabelle und der Inhalt aller Tabellen als komprimiertes JSON | Die letzten fünf |
| R2: `generic_food` | Importierte BLS-Daten | Je Datenversion |
| R3: `outbox`, `syncBase`, `syncState` | Ausstehende Änderungen, letzte bekannte Serverversion je Dokument (Basis für den 3-Wege-Merge), Pull-Cursor | Dauerhaft |
| R4: `mediaBlob` | Fotos und Vorschaubilder | Bis zur Löschung |

## 6. Dexie-Schema v1 (MVP)

```ts
// src/shared/db/schema.ts – Entwurf; umgesetzt in M0 mit generischen Tabellentypen (siehe unten)
import Dexie, { type Table } from 'dexie';

export class AppDb extends Dexie {
  sessions!: Table<Session, string>;
  programs!: Table<Program, string>;
  exercises!: Table<CustomExercise, string>;
  exercisePrefs!: Table<ExercisePref, string>;
  bodyWeights!: Table<BodyWeight, string>;
  goals!: Table<Goal, string>;
  singletons!: Table<Settings | Profile | TrainingState, string>;
  exerciseHistory!: Table<ExerciseHistoryRow, string>;
  sessionUi!: Table<SessionUi, string>;
  meta!: Table<{ key: string; value: unknown }, string>;
  errorLog!: Table<ErrorLogEntry, number>;

  constructor() {
    super('fitness');
    this.version(1).stores({
      sessions: 'id, status, dayKey, startedAt, endedAt, *exerciseIds, [program.programId+endedAt]',
      programs: 'id, kind, archivedAt',
      exercises: 'id, nameNorm, *primaryMuscles, *equipment',
      exercisePrefs: 'id, exerciseId',
      bodyWeights: 'id, measuredAt, dayKey',
      goals: 'id, kind, effectiveFrom',
      singletons: 'id',
      exerciseHistory: 'id, [exerciseId+completedAt], sessionId',
      sessionUi: 'sessionId',
      meta: 'key',
      errorLog: '++seq, at',
    });
  }
}
```

Umsetzung (M0): Die Tabellen speichern Dokumente generisch (`StoredDoc` = Basisfelder plus beliebige Felder); die Fachmodule prüfen beim Lesen mit ihrem Zod-Schema. So kennt `shared/db` keine Fachtypen (Modulgrenzen, `architecture.md` Abschnitt 4). Indizes und Tabellen entsprechen genau dem Entwurf; ein Test prüft beides.

Regeln für spätere Versionen: Neue Module fügen Tabellen in einer neuen Dexie-Version hinzu (additiv). Vor jedem Upgrade entsteht ein Snapshot (D-217). Jede Version hat einen Migrationstest mit einer Datenbank der Vorversion (AK-DAT-07). Gelöschte Datensätze bleiben in den Tabellen und werden in den Repositories gefiltert.

## 7. Konfliktregeln je Entität

### 7.1 Verfahren

Ab R3 führt der Client zwei Fassungen desselben Dokuments mit einem **3-Wege-Merge** zusammen: Basis (letzte bekannte Serverfassung aus `syncBase`), lokale und entfernte Fassung.

1. Für jedes Feld: Sind lokal und entfernt gleich, gilt dieser Wert. Hat nur eine Seite gegenüber der Basis geändert, gilt deren Wert. Haben beide geändert, entscheidet die Vorrangregel des Typs; ohne eigene Regel gewinnt der jüngere HLC des umgebenden Knotens.
2. Kinder werden über ihre ID zugeordnet und rekursiv zusammengeführt. Weil Kinder nur weich gelöscht werden, ist die Vereinigung beider Seiten immer vollständig.
3. Das Ergebnis wird als neue lokale Fassung mit frischem HLC gespeichert, protokolliert und erneut gesendet.

Für den Import (R1) fehlt die Basis. Dann gilt der **2-Wege-Merge** aus Abschnitt 7.4.

### 7.2 Regeln

| Entität | Erkennung | Regel | Begründung | Test |
|---|---|---|---|---|
| Trainingseinheit: Status | Beide Seiten haben den Status geändert | `completed` schlägt `in_progress` | Eine abgeschlossene Einheit wird nie durch eine veraltete laufende Kopie ersetzt | K-01 |
| Trainingseinheit: Ende, Dauer | Nach Statusregel | Werte der abgeschlossenen Seite; sind beide abgeschlossen, der jüngere HLC | Konsistente Endzeit | K-02 |
| Trainingseinheit: Löschung gegen Änderung | Eine Seite gelöscht, die andere geändert | Wurde eine *laufende* Fassung gelöscht (`deletedFrom = in_progress`) und die andere Seite ist abgeschlossen, bleibt die Einheit erhalten. Sonst gewinnt der jüngere HLC | Verwerfen einer veralteten Kopie darf ein abgeschlossenes Training nicht löschen | K-03, K-04 |
| Satz: Status | Beide geändert | `done` schlägt `skipped`, `skipped` schlägt `planned` | Protokollierte Daten haben Vorrang | K-05 |
| Satz: Istwerte | Beide geändert | Werte der Seite mit `done`; sind beide `done`, der jüngere Satz-HLC | Kein Mischen von Gewicht und Wiederholungen aus zwei Messungen | K-06 |
| Satz oder Übung: Löschung gegen erledigte Daten | Eine Seite gelöscht, andere hat `done` | Erledigte Daten bleiben, außer die Löschung erfolgte auf einer Fassung, die den Satz bereits als `done` kannte, und ist jünger | Keine stillen Datenverluste | K-07 |
| Trainingseinheit: Notizen, Titel, Startzeit | Beide geändert | Jüngerer HLC | Seltene Korrekturen | K-08 |
| Programm, Vorlage | Beide Seiten seit der Basis geändert | Die entfernte Fassung wird übernommen; die lokale Fassung entsteht zusätzlich als Kopie „Name (Konflikt, Gerät, Datum)" | Komplexe Strukturen werden nicht vermischt; nichts geht verloren (D-208) | K-09 |
| Trainingszustand | Feldweise | Jüngerer HLC je Feld; die Historie wird vereinigt | Aktivierung auf einem Gerät gewinnt nachvollziehbar | K-10 |
| Einstellungen, Profil | Feldweise | Jüngerer HLC bei gleichem Feld | Verschiedene Felder bleiben beide erhalten | K-11 |
| Ziel | Einträge vereinigt; gleicher Eintrag feldweise | Aktives Ziel nach Abschnitt 3.6 | Keine überschriebene Zielhistorie | K-12 |
| Körpergewicht | Feldweise; Löschung gegen Änderung | Jüngerer HLC; eine jüngere Änderung stellt einen gelöschten Eintrag wieder her und wird protokolliert | Selten, eindeutig | K-13 |
| Eigene Übung, persönliche Übungsangaben | Feldweise | Jüngerer HLC; gelöschte Übungen bleiben über Snapshots in Protokollen lesbar | – | K-14 |
| Ernährungseintrag (R2) | Feldweise | Jüngerer HLC; Löschung gegen Änderung wie Körpergewicht | – | K-15 |
| Eigenes Lebensmittel (R2) | Feldweise | Jüngerer HLC; Protokolle unberührt (Snapshots) | – | K-16 |
| Rezept (R2) | Beide seit der Basis geändert | Konfliktkopie wie Programm | – | K-17 |
| Wochenmenü (R2) | Kinder vereinigt, feldweise | `confirmed` schlägt `draft`, außer die Aufhebung der Bestätigung ist jünger und kannte die Bestätigung | Bestätigte Planung bleibt | K-18 |
| Einkaufsliste (R2) | Positionen vereinigt, feldweise | Abhaken: jüngerer HLC der Position; Mengen: jüngerer HLC; manuelle Positionen bleiben | Laden und Zuhause parallel | K-19 |
| Schritte, Gewohnheitseintrag, Wasser, Tagesnotiz (R4) | Gleiche deterministische ID | Jüngerer HLC | Kein Duplikat je Tag | K-20 |
| Fortschrittsfoto (R4) | Metadaten feldweise | Jüngerer HLC; das Bild ist unveränderlich | – | K-21 |

### 7.3 Löschungen und Tombstones

- Wurzeln und Kinder werden nur markiert (`deletedAt`, `deletedFrom`). Die Oberfläche bietet nach dem Löschen 10 Sekunden „Rückgängig".
- Ab R3 bewahrt der Server Tombstones 180 Tage auf; ein Gerät, das länger nicht abgeglichen hat, führt einen vollständigen Abgleich aller IDs durch.
- Jede Wiederherstellung durch eine jüngere Änderung erzeugt einen Protokolleintrag „wiederhergestellt durch Änderung von Gerät X".

### 7.4 Importregeln (2-Wege-Merge, R1)

1. Vor jedem Import entsteht ein Snapshot (AK-DAT-06).
2. IDs, die nur in der Datei vorkommen, werden übernommen; IDs, die nur lokal vorkommen, bleiben.
3. Trainingseinheiten werden nach den Regeln K-01 bis K-08 zusammengeführt, wobei jedes abweichende Feld als „beide geändert" gilt.
4. Für alle anderen Typen gewinnt bei abweichendem Inhalt die Fassung mit dem jüngeren HLC. Die ältere Fassung bleibt im Snapshot erhalten.
5. Tombstones aus der Datei löschen lokal nur, wenn sie jünger sind als die lokale Fassung; für Trainingseinheiten gilt zusätzlich K-03.
6. Die Zusammenfassung nennt je Typ: neu, aktualisiert, unverändert, gelöscht.

## 8. Integritätsregeln

| Bereich | Regel | Durchsetzung |
|---|---|---|
| Last | 0 bis 500 kg; Eingabe mit Komma oder Punkt; ±-Schritt aus Übung oder Einstellungen | Zod, UI |
| Wiederholungen | Ganzzahl 0 bis 200 | Zod, UI |
| Dauer | 0 bis 86.400 s je Satz | Zod |
| Satzstatus | `done` verlangt die Istwerte der Erfassungsart (z. B. Gewicht und Wiederholungen bei `weight_reps`) und `completedAt` | Zod-Refinement |
| Drop-Satz | `parentSetId` verweist auf einen Arbeitssatz derselben Übung | Zod-Refinement |
| Einheit | Höchstens eine laufende je Gerät; `endedAt ≥ startedAt`; Pausen überschneiden sich nicht | Service in Transaktion |
| Körpergewicht | 20 bis 400 kg; Zeitpunkt höchstens 1 Tag in der Zukunft; Hinweis bei Sprung über 3 kg innerhalb von 3 Tagen | Zod, Service |
| Ziele | Zielgewicht 30 bis 300 kg; Wochenziel 1 bis 7 | Zod |
| Datum | Gültiger `dayKey`; gültige IANA-Zone | Zod |
| Einheiten | Interne Umrechnungen nur im Modul `shared/lib/units.ts` | Lint-Regel |
| Doppelte Einträge | Import über IDs idempotent; Tageswerte über deterministische IDs | Service |
| Gelöschtes | Repositories filtern Tombstones | Basis-Repository |
| Stammdaten | Änderungen an Programmen und Übungen verändern Einheiten nicht (Snapshots) | Service, Test |

## 9. Berechnungen

Alle Formeln liegen als reine Funktionen in `calc/` und sind ohne Oberfläche getestet.

| Größe | Definition |
|---|---|
| Volumen einer Einheit | Σ Gewicht × Wiederholungen über erledigte Arbeits- und Drop-Sätze mit Erfassungsart `weight_reps`; Aufwärmsätze zählen nicht. Übungen nur mit Wiederholungen weisen stattdessen die Summe der Wiederholungen aus |
| Bester Satz | Höchstes Gewicht, bei Gleichstand mehr Wiederholungen; bei `reps` die meisten Wiederholungen; bei `time` die längste Dauer |
| Geschätztes 1RM | Bei 1 Wiederholung das Gewicht; bei 2 bis 10 Wiederholungen Epley: Gewicht × (1 + Wiederholungen / 30); darüber keine Schätzung (D-224) |
| Vorherige Werte | Letzte abgeschlossene Einheit mit derselben Übung aus `exerciseHistory`; Zuordnung je Satztyp und Position innerhalb des Typs; Drop-Sätze über Position des Arbeitssatzes und Position in der Kette |
| Dauer | (Ende oder jetzt) − Start − Summe der Pausen |
| Nächster Trainingstag | Tage aller Wochen in Reihenfolge als Liste. Letzte abgeschlossene Einheit dieses Programms seit der Aktivierung bestimmt die Position; der nächste Tag folgt darauf. Am Ende: Neubeginn, wenn `repeat`, sonst „Programm abgeschlossen". Fehlt der letzte Tag (gelöscht), beginnt die Folge beim ersten Tag mit Hinweis |
| Heute geplant | Hat ein Tag des aktiven Programms den heutigen Wochentag als Hinweis, ist er „heute geplant"; sonst gilt der nächste Tag der Reihenfolge |
| Wochenziel | Zahl der abgeschlossenen, nicht gelöschten Einheiten (Krafttraining und Aktivität) mit `dayKey` von Montag bis Sonntag der laufenden Woche |
| Gewichtstrend | Für jeden Eintrag der Mittelwert aller Einträge der vorangehenden 7 Tage einschließlich; angezeigt ab drei Einträgen im gewählten Zeitraum |
| Gewichtsveränderung | Letzter minus erster Eintrag im Zeitraum, nur bei mindestens zwei Einträgen mit mindestens 7 Tagen Abstand |
| Vergleich mit der Vorgängereinheit | Letzte abgeschlossene Einheit desselben Programmtags (gleiche `dayId`); Differenz von Volumen und erledigten Sätzen |
| Kalorienziel (R2) | Grundumsatz nach Mifflin-St Jeor × Aktivitätsfaktor (1,2 bis 1,9) plus Zielanpassung (Standard −500, 0 oder +300 kcal, änderbar); untere Grenze Grundumsatz mit Hinweis |
| Makroziele (R2) | Protein standardmäßig 1,8 g/kg (1,2 bis 2,6), Fett 0,8 g/kg und mindestens 20 % der Energie, Kohlenhydrate als Rest |
| Nährwerte eines Eintrags (R2) | Wert pro 100 × Menge in g / 100; ml über Dichte, sonst 1:1 mit Kennzeichnung „geschätzt"; fehlende Felder bleiben fehlend und markieren die Summe als unvollständig |
| Rezept je Portion (R2) | Summe der Zutaten / Portionen; Skalierung linear |
| Einkaufsliste (R2) | Schlüssel aus Lebensmittelreferenz (sonst normalisierter Name) und Einheit; Summe der Mengen × Portionsfaktor; Stück getrennt von Gramm |

## 10. Abläufe

- **Training starten:** In einer Transaktion entsteht die Einheit mit allen Übungen und Sätzen des Programmtags, inklusive Snapshots von Namen, Erfassungsart und Zielwerten. Spätere Planänderungen betreffen sie nicht.
- **Satz erledigen:** Validierung, `status = done`, `completedAt`, Pausentimer mit `endsAt` im selben Schreibvorgang. Die Anzeige rechnet die Restzeit aus `endsAt`.
- **Werte tippen:** Entprellt um 300 ms gespeichert; beim Wechsel in den Hintergrund (`visibilitychange`, `pagehide`) wird sofort gespeichert.
- **Abschließen:** Offene Sätze werden nach Rückfrage `skipped`; Status, Ende, Dauer und die Projektion `exerciseHistory` werden in einer Transaktion geschrieben.
- **Bearbeiten oder Löschen einer abgeschlossenen Einheit:** Dokument und Projektion in einer Transaktion.
- **Rückkehr aus dem Hintergrund:** Gesundheitsprüfung der Datenbank (Lesezugriff); bei Fehler einmal neu öffnen, sonst kontrollierter Neustart der App (D-216).
- **Schema-Upgrade:** Vor dem Öffnen mit der neuen Version Snapshot der bestehenden Daten, dann Upgrade, dann Migrationstest-Schema prüfen.

## 11. Export- und Importformat

```json
{
  "format": "fitness-app-backup",
  "formatVersion": 1,
  "appVersion": "1.0.0",
  "schemaVersion": 1,
  "bundleVersions": { "coreExercises": 1, "sampleTemplates": 1 },
  "exportedAt": "2026-10-18T09:15:00.000Z",
  "deviceId": "a1b2c3d4",
  "data": {
    "session": [], "program": [], "exercise": [], "exercise_pref": [],
    "body_weight": [], "goal": [], "settings": [], "profile": [], "training_state": []
  }
}
```

Tombstones sind enthalten, Projektionen nicht (sie werden neu aufgebaut). Eine Programmdatei (AK-PRG-13) nutzt dasselbe Format mit genau einem Programm. Der Import validiert jedes Dokument mit Zod und lehnt die Datei bei Fehlern vollständig ab (AK-DAT-05).

## 12. Serverschema (R3, Entwurf)

```sql
create table public.sync_documents (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  doc_id uuid not null,
  doc_type text not null,
  rev bigint not null,                       -- vom Server vergeben
  hlc text not null,
  deleted boolean not null default false,
  schema_version int not null,
  payload jsonb not null,
  last_mutation_id uuid not null,            -- Idempotenz
  device_id text not null,
  server_updated_at timestamptz not null default clock_timestamp(),
  primary key (user_id, doc_id)
);
create index sync_documents_pull on public.sync_documents (user_id, server_updated_at, doc_id);
alter table public.sync_documents enable row level security;
create policy own_rows on public.sync_documents for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
```

Schreiben erfolgt über eine Postgres-Funktion `push_documents(docs jsonb)`: Sie prüft je Dokument die mitgesendete Basisrevision (optimistische Nebenläufigkeit), erkennt Wiederholungen über `last_mutation_id`, vergibt `rev + 1` und `server_updated_at` und liefert je Dokument „angenommen", „Duplikat" oder „Konflikt" mit der aktuellen Serverfassung. Der Ablauf steht in `architecture.md` Abschnitt 11.

## 13. Migrationen

- Jede Schemaänderung: neue Dexie-Version, Snapshot davor, Migrationstest, Eintrag im Changelog.
- Inhaltliche Änderungen an Dokumenten: `schemaVersion` erhöhen, Migration beim Lesen.
- Keine destruktive Migration ohne vorherigen Export, Snapshot und ausdrückliche Zustimmung.

## 14. Offene Punkte

- Genaue Nährstoffliste für R2 hängt vom Prüfspike S-2 (BLS) ab.
- Ob `deletedFrom` bei Kindern in allen Typen gebraucht wird, wird mit den Konflikttests K-03 bis K-07 in R3 bestätigt.
- Umfang der Basisübungsliste und Muskelgruppen-Aufzählung: Entwurf in `sample-templates.md`, Durchsicht durch den Produktinhaber (Q-05).
