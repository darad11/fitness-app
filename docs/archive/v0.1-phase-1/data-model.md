# Datenmodell (Vorschlag)

Stand: 17.10.2026 · Phase 1 · Status: Vorschlag zur Bestätigung

## 1. Konventionen

| Thema | Regel |
|---|---|
| IDs | UUID v4 (`crypto.randomUUID()`), clientseitig erzeugt, nie wiederverwendet |
| Zeitpunkte | ISO 8601 in UTC (`2026-10-17T18:04:11.000Z`) in Feldern `…At` |
| Tagesbezug | `dayKey` als lokales Datum `YYYY-MM-DD` plus `tz` (IANA-Zone, z. B. `Europe/Vienna`) auf dem Datensatz. Tagesauswertungen gruppieren nach `dayKey`, nie nach UTC |
| Einheiten intern | Masse kg (Körper) und kg (Last), Länge cm, Distanz m, Dauer s, Volumen ml, Energie kcal, Makros g. Imperial nur in der Anzeige; Umrechnung dokumentiert in `shared/lib/units.ts` (1 lb = 0,45359237 kg, 1 in = 2,54 cm) |
| Rundung | Speicherung ungerundet (Gleitkomma); Rundung nur in der Anzeige (kcal ganzzahlig, Makros eine Nachkommastelle, Gewicht 0,1 kg, Last 0,25 kg) |
| Sync-Metadaten | Jede synchronisierbare Tabelle: `createdAt`, `updatedAt`, `deletedAt` (null oder Zeit), `rev` (int, startet bei 1), `deviceId`. Server zusätzlich `user_id`, `server_updated_at` |
| Löschen | Soft Delete per `deletedAt`. Harte Löschung nur durch Bereinigungsjob nach erfolgreicher Sync und Frist (Standard 90 Tage) oder durch „Alle Daten löschen" |
| Historie | Protokolldaten (Sessions, Sätze, Ernährungseinträge, geplante Mahlzeiten) speichern Snapshots der relevanten Stammdaten (Name, Nährwerte pro 100 g, Satzziele). Spätere Änderungen an Stammdaten verändern Protokolle nicht |
| Versionierung | Rezepte und Programme sind versioniert (`version`, `parentId`). Bearbeiten erzeugt eine neue Version, Protokolle verweisen auf `id + version` |
| Validierung | Zod-Schema je Entität; dasselbe Schema prüft Eingaben, Importe und Sync-Daten |
| Idempotenz | Schreiboperationen mit fachlicher Doppelgefahr (Schnelleintrag, Import) tragen einen `idempotencyKey` |

## 2. Entitätsübersicht

| Entität (Tabelle) | Modul | Zweck | Sync | Konfliktregel |
|---|---|---|---|---|
| `user_profile` | profile | Stammdaten der Person | ja | LWW (letzter Schreiber gewinnt) |
| `fitness_goal` | profile | Zielhistorie mit Gültigkeit | ja | LWW |
| `user_preferences` | profile | Einheiten, Theme, Standards | ja | LWW feldweise |
| `nutrition_target` | nutrition | Kalorien- und Makroziele mit Gültigkeit | ja | LWW |
| `exercise` | exercises | Übungsbibliothek inkl. eigener Übungen | ja | LWW |
| `workout_program` | training | Programmvorlage (versioniert) | ja | LWW pro Version |
| `workout_day` | training | Trainingstag einer Programmversion | ja | LWW |
| `workout_day_exercise` | training | Übung mit Satzschema in einem Tag | ja | LWW |
| `program_enrollment` | training | Aktive Nutzung eines Programms mit Wochenzuordnung | ja | LWW; Status-Rangfolge |
| `workout_session` | training | Durchgeführte oder laufende Einheit | ja | Status-Rangfolge, siehe 6 |
| `session_exercise` | training | Übung innerhalb einer Einheit (Snapshot) | ja | Vereinigung nach ID |
| `exercise_set` | training | Einzelner Satz | ja | Vereinigung nach ID; `done` schlägt `planned` |
| `personal_record` | training | Abgeleiteter Cache der Bestleistungen | nein (lokal, neu berechenbar) | – |
| `food_item` | nutrition | Lebensmittel mit Nährwerten pro 100 g/ml und Portionen | ja | LWW |
| `food_log_entry` | nutrition | Protokollierter Eintrag (Lebensmittel, Rezept, Schnelleintrag) | ja | Vereinigung nach ID |
| `nutrition_day` | nutrition | Optionaler Tageskopf: Zielsnapshot, Notiz | ja | LWW |
| `water_entry` | nutrition | Wassereintrag | ja | Vereinigung nach ID |
| `recipe` | recipes | Rezeptversion | ja | Nur anhängen (neue Version), LWW auf Metadaten |
| `recipe_ingredient` | recipes | Zutat einer Rezeptversion | ja | Vereinigung nach ID |
| `meal_plan` | recipes | Wochenplan | ja | LWW; `confirmed` schlägt `draft` |
| `planned_meal` | recipes | Geplante Mahlzeit (Snapshot) | ja | Vereinigung nach ID |
| `shopping_list` | recipes | Einkaufsliste | ja | LWW |
| `shopping_list_item` | recipes | Position mit Abhak-Status | ja | Vereinigung; `checked` feldweise LWW |
| `weight_entry` | body | Körpergewicht | ja | Vereinigung nach ID |
| `body_measurement` | body | Körpermaß | ja | Vereinigung nach ID |
| `progress_photo` | body | Foto-Metadaten | ja | LWW |
| `media_blob` | body | Binärdaten lokal | nur Storage-Upload | – |
| `step_entry` | activity | Schritte pro Tag | ja | LWW pro `dayKey` |
| `habit` | activity | Gewohnheit | ja | LWW |
| `habit_log` | activity | Erledigung pro Tag | ja | Vereinigung; `done` feldweise LWW |
| `challenge` | activity | Persönliche Challenge | ja | LWW |
| `challenge_task_log` | activity | Erledigte Aufgabe pro Tag | ja | Vereinigung |
| `daily_note` | body | Tagesnotiz | ja | LWW |
| `device` | sync | Bekannte Geräte | ja | LWW |
| `sync_outbox` | sync | Ausstehende Änderungen | nein | – |
| `sync_state` | sync | Cursor pro Tabelle | nein | – |
| `error_log` | shared | Lokales Fehlerprotokoll | nein | – |

Gegenüber der Liste im Auftrag: `WorkoutExercises` heißt hier `session_exercise`; `FoodLogs` und `FoodLogItems` sind zu `food_log_entry` plus optionalem `nutrition_day` zusammengefasst (Tagessummen werden berechnet, nicht gespeichert); `DailyActivities` und `StepEntries` sind zu `step_entry` plus `workout_session` mit `source = manual` zusammengefasst; `MealPlans`/`PlannedMeals` bleiben; `Challenges` bleibt, ohne Multi-User.

## 3. Entitäten im Detail

Schreibweise: Feld · Typ · Pflicht · Constraint. Sync-Metadaten (Abschnitt 1) sind überall vorhanden und hier nicht wiederholt.

### 3.1 Profil und Ziele

**user_profile** (genau ein Datensatz pro Nutzer)
- `displayName` string optional
- `birthDate` date optional (für Alter in Formeln)
- `sex` enum `female | male | unspecified` optional (nur für Formeln; bei `unspecified` Mittelwert, gekennzeichnet)
- `heightCm` number optional, 100 bis 250
- `activityLevel` enum `sedentary | light | moderate | active | very_active` optional
- `trainingLevel` enum `beginner | intermediate | advanced` optional
- `trainingDaysPerWeek` int optional, 1 bis 7
- `trainingLocation` enum `home | gym | both` optional
- `equipment` string[] (kontrollierte Liste: `barbell, dumbbell, kettlebell, cable, machine, band, bodyweight, bench, pullup_bar, …`)
- `dietaryTags` string[] (z. B. `vegetarian, vegan, no_pork, lactose_free`, frei erweiterbar)

**fitness_goal**
- `type` enum `lose | maintain | gain | performance`
- `targetWeightKg` number optional, 30 bis 300
- `weeklyRateKg` number optional, −1,5 bis +1,0 (Warnung über ±1 % Körpergewicht)
- `effectiveFrom` date, `effectiveTo` date optional. Index `effectiveFrom`
- Regel: Es gibt höchstens ein Ziel ohne `effectiveTo`.

**user_preferences**
- `unitSystem` enum `metric | imperial` (Standard metric)
- `theme` enum `system | light | dark`
- `defaultRestSec` int 0 bis 600 (Standard 90)
- `weightStepKg` number (Standard 2,5; alternativ 1,25, 1, 0,5)
- `mealSlots` Array von `{ id, name, order }` (Standard Frühstück, Mittag, Abend, Snacks)
- `startOfWeek` enum `monday | sunday` (Standard monday)
- `language` enum `de | en`
- `timerSound` boolean, `wakeLock` boolean

**nutrition_target**
- `kcal` int 800 bis 6000
- `proteinG`, `carbsG`, `fatG` number ≥ 0
- `method` enum `computed | manual`
- `inputsSnapshot` JSON optional (Gewicht, Größe, Alter, Aktivitätsfaktor, Anpassung), damit die Berechnung nachvollziehbar bleibt
- `weekdayOverrides` JSON optional (z. B. Trainingstage mit mehr Kohlenhydraten)
- `effectiveFrom` date, `effectiveTo` date optional

### 3.2 Übungen und Programme

**exercise**
- `name` string Pflicht, eindeutig je `source`; `aliases` string[]
- `primaryMuscles` enum[] (`chest, back_lats, back_upper, traps, front_delts, side_delts, rear_delts, biceps, triceps, forearms, abs, obliques, lower_back, glutes, quads, hamstrings, calves, adductors, abductors, neck, full_body, cardio`)
- `secondaryMuscles` enum[]
- `equipment` enum[] (siehe Profil)
- `category` enum `strength | cardio | mobility | timed`
- `trackingMode` enum `weight_reps | reps | time | distance_time | weight_time`
- `isUnilateral` boolean, `isBodyweight` boolean
- `instructions` string[] optional, `mediaUrls` string[] optional, `videoUrl` string optional
- `source` enum `library | custom`, `sourceId` string optional, `license` string optional
- `isArchived` boolean. Indizes: `name`, `*primaryMuscles`, `*equipment`, `source`

**workout_program**
- `name`, `description` optional
- `goal` enum (wie fitness_goal) optional, `level` enum optional, `location` enum optional
- `daysPerWeek` int 1 bis 7, `durationWeeks` int optional
- `version` int ≥ 1, `rootId` UUID (gleich für alle Versionen), `isTemplate` boolean, `isArchived` boolean
- Regel: Eine Version ist nach erstem Start einer Einheit unveränderlich; Änderungen erzeugen `version + 1`.

**workout_day**
- `programId` (Version), `order` int, `name` string, `weekdayHint` int 1 bis 7 optional, `notes` optional. Index `[programId+order]`

**workout_day_exercise**
- `dayId`, `order` int, `exerciseId`, `groupId` UUID optional (Supersatz oder Zirkel), `restSec` int optional, `notes` optional
- `sets` JSON-Array von `{ type: warmup | working | drop | amrap, repMin?, repMax?, targetWeightKg?, percentOf1Rm?, durationSec?, distanceM? }` mit mindestens einem Eintrag. Index `[dayId+order]`

**program_enrollment**
- `programId` (Version), `startDate` date, `endDate` date optional
- `schedule` JSON: Zuordnung `dayId → weekday[]` oder `rotation` (Tag folgt Tag, Ruhetage als Lücken)
- `status` enum `active | paused | completed | cancelled`
- Regel: höchstens ein `active` je Zeitpunkt (fachlich; mehrere parallele Programme sind nicht vorgesehen).

### 3.3 Trainingseinheiten

**workout_session**
- `source` enum `planned | free | manual`
- `enrollmentId`, `programId`, `dayId` optional (bei `planned`)
- `dayNameSnapshot` string optional, `programNameSnapshot` string optional
- `dayKey`, `tz`, `startedAt`, `endedAt` optional
- `status` enum `in_progress | completed | abandoned`
- `durationSec` int optional (abgeleitet, gespeichert bei Abschluss)
- `bodyweightKg` number optional (Snapshot für relative Werte)
- `notes` optional
- Manuelle Einheiten: `manualType` enum `strength | run | walk | cycle | swim | other` optional, `distanceM` optional, `caloriesKcal` optional mit `caloriesEstimated` boolean
- Indizes: `status`, `dayKey`, `startedAt`, `[enrollmentId+dayId]`
- Regeln: genau eine Session darf `in_progress` sein; `endedAt ≥ startedAt`; `completed` setzt `endedAt` voraus.

**session_exercise**
- `sessionId`, `order` int, `exerciseId`, `exerciseNameSnapshot`, `trackingModeSnapshot`
- `groupId` optional, `restSec` optional, `notes` optional
- `replacedExerciseId` optional (ursprünglich geplante Übung bei Austausch)
- Index `[sessionId+order]`, `exerciseId`

**exercise_set**
- `sessionExerciseId`, `order` int
- `type` enum `warmup | working | drop | amrap`
- Zielwerte (Snapshot aus Plan): `targetRepMin`, `targetRepMax`, `targetWeightKg`, `targetDurationSec` optional
- Istwerte: `weightKg` number 0 bis 500 optional, `reps` int 0 bis 200 optional, `durationSec` int 0 bis 86400 optional, `distanceM` number optional, `rpe` number 1 bis 10 optional
- `status` enum `planned | done | skipped`
- `completedAt` optional (Pflicht bei `done`), `restEndsAt` optional (für laufenden Timer)
- Index `[sessionExerciseId+order]`, `completedAt`
- Regeln: `done` erfordert je nach `trackingMode` die passenden Istwerte; Gewicht in 0,25-kg-Schritten (weiche Prüfung); Volumen zählt nur `working`, `drop`, `amrap`.

**personal_record** (lokaler Cache)
- `exerciseId`, `kind` enum `max_weight | max_reps_at_weight | e1rm | max_volume_session | max_duration`
- `value` number, `weightKg` optional, `reps` optional, `setId`, `sessionId`, `achievedAt`
- Wird bei Abschluss einer Session aktualisiert und kann jederzeit vollständig aus `exercise_set` neu berechnet werden.

### 3.4 Ernährung

**food_item**
- `name` Pflicht, `brand` optional, `barcode` string optional (Index), `language` enum
- `per100` JSON Pflicht: `{ kcal, proteinG, carbsG, fatG, fiberG?, sugarG?, saturatedFatG?, saltG?, sodiumMg? }`, alle ≥ 0
- `basis` enum `g | ml`, `densityGPerMl` optional (für Umrechnung ml ↔ g)
- `servings` JSON-Array `{ id, name, grams }` (z. B. „1 Scheibe" 25 g)
- `cookedFactor` number optional (Gargewicht ÷ Rohgewicht; Kennzeichnung geschätzt)
- `source` enum `off | usda | custom | import | quick`, `sourceId` optional, `dataQuality` enum `verified | user | estimated`
- `category` enum (für Einkaufsliste: `produce, meat_fish, dairy, bakery, pantry, frozen, beverages, snacks, other`)
- `isFavorite` boolean, `lastUsedAt` optional, `useCount` int
- Indizes: `name`, `barcode`, `isFavorite`, `lastUsedAt`
- Plausibilitätsregel: `|kcal − (4·proteinG + 4·carbsG + 9·fatG)| ≤ max(0,15 · kcal, 20)`; sonst Kennzeichnung `inconsistent` (speichern erlaubt, sichtbar markiert).

**food_log_entry**
- `dayKey`, `tz`, `slotId` (aus Präferenzen), `loggedAt`
- `kind` enum `food | recipe | quick`
- `foodItemId` optional, `recipeId` + `recipeVersion` optional
- `nameSnapshot` string
- `quantityGrams` number > 0 (normalisierte Menge), `servingsCount` number optional, `servingNameSnapshot` optional
- `nutrients` JSON Snapshot (gleiche Struktur wie `per100`, aber absolut für die Menge)
- `isEstimated` boolean, `dataQualitySnapshot` enum
- `notes` optional, `idempotencyKey` optional
- Indizes: `dayKey`, `[dayKey+slotId]`, `foodItemId`, `loggedAt`
- Tagessumme = Summe der `nutrients` aller nicht gelöschten Einträge des `dayKey`. Nie gespeichert als Wahrheit; optional gecacht mit Invalidierung.

**nutrition_day** (optional pro Tag)
- `dayKey`, `tz`, `targetSnapshot` JSON (Ziel des Tages, eingefroren), `notes` optional. Index `dayKey` eindeutig.

**water_entry**
- `dayKey`, `tz`, `loggedAt`, `ml` int 1 bis 5000. Index `dayKey`

### 3.5 Rezepte, Wochenplan, Einkaufsliste

**recipe** (eine Zeile pro Version)
- `rootId` UUID, `version` int, `isLatest` boolean
- `name`, `description` optional, `servings` number > 0, `servingName` optional
- `mealTypes` enum[] (`breakfast | lunch | dinner | snack`), `tags` string[], `cuisine` optional, `difficulty` enum optional, `prepMin`, `cookMin` optional
- `steps` string[]
- `nutritionPerServing` JSON (Cache, aus Zutaten berechnet)
- `dietaryTags` string[] (abgeleitet und manuell)
- `imageBlobId` optional, `sourceUrl` optional, `isArchived` boolean
- Indizes: `rootId`, `[rootId+version]`, `isLatest`, `*mealTypes`, `*tags`

**recipe_ingredient**
- `recipeId` (Version), `order`, `foodItemId` optional, `nameSnapshot`
- `quantity` number > 0, `unit` enum `g | ml | piece`, `grams` number (normalisiert; bei `piece` über Portionsgröße, sonst `null` mit Kennzeichnung)
- `per100Snapshot` JSON (eingefroren bei Speichern der Version), `note` optional, `isOptional` boolean
- Index `[recipeId+order]`

**meal_plan**
- `weekStartDate` date (Montag), `status` enum `draft | confirmed`
- `targetKcalSnapshot` int optional, `enabledSlots` string[]
- `confirmedAt` optional. Index `weekStartDate` eindeutig

**planned_meal**
- `mealPlanId`, `dayKey`, `slotId`, `order`
- `recipeId` + `recipeVersion` optional oder `foodItemId` optional
- `servings` number > 0, `nameSnapshot`, `nutritionSnapshot` JSON
- `isCookDay` boolean, `leftoverOfId` optional, `status` enum `planned | eaten | skipped`
- Indizes: `[mealPlanId+dayKey]`, `dayKey`

**shopping_list**
- `mealPlanId` optional, `name`, `status` enum `open | done`, `generatedAt`, `isStale` boolean (Plan nach Erzeugung geändert)

**shopping_list_item**
- `listId`, `foodItemId` optional, `name`, `quantity` number, `unit` enum, `category` enum
- `checked` boolean, `checkedAt` optional, `isManual` boolean, `inPantry` boolean
- `sourcePlannedMealIds` UUID[] (Nachvollziehbarkeit)
- Index `[listId+category]`

### 3.6 Körper

**weight_entry**: `measuredAt`, `dayKey`, `tz`, `weightKg` 20 bis 400, `note` optional, `source` enum `manual | import`. Indizes `dayKey`, `measuredAt`.

**body_measurement**: `measuredAt`, `dayKey`, `site` enum (`waist, hip, chest, neck, left_arm, right_arm, left_thigh, right_thigh, left_calf, right_calf, shoulders`), `valueCm` 10 bis 250; optional `bodyFatPercent` 2 bis 70 mit `method`. Index `[site+measuredAt]`.

**progress_photo**: `takenAt`, `dayKey`, `pose` enum `front | side | back | other`, `blobId` (lokal), `storagePath` optional (Cloud), `width`, `height`, `bytes`, `sha256`, `note` optional, `weightEntryId` optional. Index `dayKey`.

**media_blob** (lokal): `id`, `mime`, `blob`, `thumbnailBlob`, `bytes`, `sha256`, `uploadedAt` optional.

**daily_note**: `dayKey`, `text`. Index `dayKey` eindeutig.

### 3.7 Aktivität

**step_entry**: `dayKey`, `tz`, `steps` int 0 bis 100000, `source` enum `manual | import`, `note` optional. Index `dayKey` eindeutig.

**habit**: `name`, `icon` optional, `frequency` JSON `{ type: daily | weekly, timesPerWeek?, weekdays? }`, `targetValue` number optional mit `unit` (z. B. 2000 ml), `startDate`, `endDate` optional, `order`, `isArchived`.

**habit_log**: `habitId`, `dayKey`, `tz`, `done` boolean, `value` number optional, `completedAt` optional. Index `[habitId+dayKey]` eindeutig.

**challenge**: `name`, `startDate`, `durationDays` int 1 bis 365, `tasks` JSON-Array `{ id, title, habitId? }`, `status` enum `active | completed | cancelled`, `notes`.

**challenge_task_log**: `challengeId`, `taskId`, `dayKey`, `done`, `completedAt`. Index `[challengeId+dayKey]`.

### 3.8 Sync und System

**device**: `id` (deviceId), `name`, `platform`, `appVersion`, `lastSeenAt`.

**sync_outbox** (lokal): `id` auto, `table`, `rowId`, `op` enum `upsert | delete`, `rev`, `enqueuedAt`, `attempts`, `nextAttemptAt`, `lastError` optional. Index `[table+rowId]`, `nextAttemptAt`.

**sync_state** (lokal): `table` (Schlüssel), `lastServerUpdatedAt`, `lastPushAt`, `lastFullSyncAt`.

**error_log** (lokal, Ringpuffer 500 Einträge): `at`, `level`, `scope`, `message`, `stackHash`, `context` (ohne Nutzdaten).

## 4. Dexie-Schema (Skizze)

```ts
// shared/db/schema.ts (Auszug)
db.version(1).stores({
  user_profile: 'id, updatedAt',
  fitness_goal: 'id, effectiveFrom, updatedAt',
  user_preferences: 'id, updatedAt',
  nutrition_target: 'id, effectiveFrom, updatedAt',
  exercise: 'id, name, *primaryMuscles, *equipment, source, updatedAt',
  workout_program: 'id, rootId, [rootId+version], isTemplate, updatedAt',
  workout_day: 'id, [programId+order], updatedAt',
  workout_day_exercise: 'id, [dayId+order], exerciseId, updatedAt',
  program_enrollment: 'id, status, startDate, updatedAt',
  workout_session: 'id, status, dayKey, startedAt, [enrollmentId+dayId], updatedAt',
  session_exercise: 'id, [sessionId+order], exerciseId, updatedAt',
  exercise_set: 'id, [sessionExerciseId+order], completedAt, updatedAt',
  personal_record: 'id, [exerciseId+kind], achievedAt',
  food_item: 'id, name, barcode, isFavorite, lastUsedAt, source, updatedAt',
  food_log_entry: 'id, dayKey, [dayKey+slotId], foodItemId, loggedAt, updatedAt',
  nutrition_day: 'id, &dayKey, updatedAt',
  water_entry: 'id, dayKey, updatedAt',
  recipe: 'id, rootId, [rootId+version], isLatest, *mealTypes, *tags, updatedAt',
  recipe_ingredient: 'id, [recipeId+order], foodItemId, updatedAt',
  meal_plan: 'id, &weekStartDate, status, updatedAt',
  planned_meal: 'id, [mealPlanId+dayKey], dayKey, updatedAt',
  shopping_list: 'id, mealPlanId, status, updatedAt',
  shopping_list_item: 'id, [listId+category], updatedAt',
  weight_entry: 'id, dayKey, measuredAt, updatedAt',
  body_measurement: 'id, [site+measuredAt], dayKey, updatedAt',
  progress_photo: 'id, dayKey, takenAt, updatedAt',
  media_blob: 'id, sha256',
  daily_note: 'id, &dayKey, updatedAt',
  step_entry: 'id, &dayKey, updatedAt',
  habit: 'id, order, isArchived, updatedAt',
  habit_log: 'id, &[habitId+dayKey], dayKey, updatedAt',
  challenge: 'id, status, updatedAt',
  challenge_task_log: 'id, [challengeId+dayKey], updatedAt',
  device: 'id',
  sync_outbox: '++id, [table+rowId], nextAttemptAt',
  sync_state: 'table',
  error_log: '++id, at',
});
```

Hinweis: `&` markiert eindeutige Indizes, `*` Multi-Entry-Indizes, `[a+b]` zusammengesetzte Indizes. Das tatsächliche Schema wird in Phase 3 festgelegt und ab dann nur noch per Migration verändert.

## 5. Postgres-Schema (Skizze) und RLS

Jede synchronisierte Tabelle in Postgres spiegelt die Felder, ergänzt um:

```sql
user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
rev integer not null,
device_id text,
server_updated_at timestamptz not null default now(),
deleted_at timestamptz
```

- Trigger `set_server_updated_at` vor Insert/Update setzt `server_updated_at = now()`.
- Trigger `reject_stale_rev` verhindert Update, wenn `new.rev <= old.rev`, und meldet Konflikt (Fehlercode, Client holt Server-Version und merged).
- Index je Tabelle auf `(user_id, server_updated_at)` für Pull-Cursor.
- RLS: `enable row level security`; Policies für `select`, `insert`, `update`, `delete` mit `using (user_id = auth.uid())` und `with check (user_id = auth.uid())`.
- JSON-Felder als `jsonb`; Enums als `text` mit Check-Constraint (einfachere Migrationen).
- Storage-Bucket `progress-photos` privat; Pfad `{user_id}/{photo_id}.jpg`; Policy auf `storage.objects` mit `auth.uid()::text = (storage.foldername(name))[1]`.

## 6. Konfliktregeln im Detail

| Situation | Regel | Begründung |
|---|---|---|
| Gleicher Datensatz auf zwei Geräten geändert (Stammdaten, Einstellungen) | Höheres `rev` gewinnt; bei Gleichstand späteres `updatedAt`; bei Gleichstand `deviceId` lexikografisch (deterministisch) | Einfach, vorhersagbar |
| Session auf Gerät A abgeschlossen, auf Gerät B noch `in_progress` (ältere Kopie) | `completed` gewinnt unabhängig von `rev`; B übernimmt A und verwirft eigenen Status, behält aber Sätze, die A nicht kennt (Vereinigung) | Abgeschlossene Trainings dürfen nicht verloren gehen |
| Zwei `completed`-Versionen derselben Session | Mehr `done`-Sätze gewinnt; dann späteres `endedAt`; Sätze werden vereinigt | Maximale Datenerhaltung |
| Satz auf A als `done`, auf B gelöscht | Löschung gewinnt nur, wenn `deletedAt` nach `completedAt` liegt, sonst bleibt der Satz | Bewusste spätere Löschung respektieren |
| Lebensmittel auf A bearbeitet, auf B protokolliert | Kein Konflikt: Protokoll hat Snapshot; Stammdatenänderung LWW | Snapshots entkoppeln |
| Rezept auf A bearbeitet (Version 3) und auf B bearbeitet (ebenfalls Version 3) | Beide Versionen bleiben; `isLatest` geht an die mit späterem `updatedAt`; Hinweis in der UI „zwei Bearbeitungen" | Nichts geht verloren |
| Einkaufsposition auf A abgehakt, auf B Menge geändert | Feldweise: `checked` von A, `quantity` von B | Unterschiedliche Felder, kein echter Konflikt |
| Schritte für denselben Tag auf A und B eingetragen | Späteres `updatedAt` gewinnt; Hinweis in UI | Eindeutiger Tageswert |
| Löschung gegen spätere Änderung | Änderung mit höherem `rev` reaktiviert (setzt `deletedAt = null`) und wird im Sync-Protokoll vermerkt | Vermeidet stilles Verschwinden |

Alle Regeln werden als reine Funktionen `merge(local, remote): Result` implementiert und mit Tabellen-Tests abgedeckt.

## 7. Datenintegritätsregeln

| Bereich | Regel | Durchsetzung |
|---|---|---|
| Gewichte (Last) | 0 bis 500 kg; Schrittweite weich 0,25 kg | Zod + UI |
| Wiederholungen | Ganzzahl 0 bis 200 | Zod + UI |
| Satzstatus | `done` nur mit Istwerten passend zum Tracking-Modus; `completedAt` Pflicht | Zod-Refinement |
| Session | genau eine `in_progress`; `endedAt ≥ startedAt`; `completed` nur mit `endedAt` | Service + DB-Abfrage in Transaktion |
| Datumsangaben | `dayKey` gültig; nicht mehr als 1 Tag in der Zukunft; `tz` gültige IANA-Zone | Zod + Service |
| Portionen | `quantityGrams > 0`; `servingsCount > 0`; Produkt konsistent | Zod |
| Nährwerte | ≥ 0; kcal-Plausibilität (Abschnitt 3.4); Makros ≤ 100 g pro 100 g | Zod mit Warnstufe |
| Einheiten | Intern metrisch; Umrechnung nur in `shared/lib/units.ts` | Lint-Regel gegen Rohfaktoren in UI |
| Doppelte Einträge | `idempotencyKey` bei Import und Schnelleingabe; Warnung bei identischem Eintrag innerhalb 2 Minuten | Service |
| Gelöschte Datensätze | Soft Delete; Abfragen über Basis-Repository filtern `deletedAt` | Repository |
| Konflikte | Deterministische Merge-Funktionen; Protokolleintrag bei jeder Zusammenführung mit Datenänderung | Sync-Engine |
| Stammdatenänderung | Protokolle bleiben unverändert (Snapshots); Programme nach Start unveränderlich (neue Version) | Service |

## 8. Zentrale Berechnungen (Spezifikation)

Alle Formeln liegen in `calc/` und sind ohne UI testbar.

- **Geschätztes 1RM (e1RM)**: Epley `w · (1 + r / 30)` für 1 ≤ r ≤ 12; über 12 Wiederholungen keine Schätzung (Anzeige „n/a"). Brzycki als Alternative in den Einstellungen.
- **Volumen**: Σ `weightKg · reps` über `working`, `drop`, `amrap`; bei Körpergewichtsübungen optional `bodyweightKg · reps` (gekennzeichnet).
- **Progressionsvorschlag (Double Progression)**: Erreichen alle Arbeitssätze `repMax` beim selben Gewicht, Vorschlag `+ weightStep` (pro Übung oder Gerät konfigurierbar); Verfehlen zwei Sätze `repMin`, Vorschlag Gewicht halten oder `− weightStep`. Begründung wird mit angezeigt.
- **Kalorienziel**: BMR nach Mifflin-St Jeor (`10·kg + 6,25·cm − 5·Alter + 5` bzw. `− 161`); TDEE = BMR · Aktivitätsfaktor (1,2 / 1,375 / 1,55 / 1,725 / 1,9); Zielanpassung Standard −500 kcal (abnehmen), 0 (halten), +300 kcal (aufbauen), frei änderbar; untere Schranke BMR (Warnung darunter). Keine medizinische Aussage; Hinweistext in der UI.
- **Makros**: Protein Standard 1,8 g/kg (einstellbar 1,2 bis 2,6); Fett Standard 0,8 g/kg, mindestens 20 % der Kalorien; Kohlenhydrate = Rest / 4.
- **Nährwerte eines Eintrags**: `nutrient = per100 · quantityGrams / 100`; bei `ml`-Basis über `densityGPerMl`, sonst 1:1 mit Kennzeichnung geschätzt.
- **Tagessumme**: Summe aller Einträge des `dayKey`; Anteil geschätzter Kalorien wird mit ausgewiesen.
- **Rezept pro Portion**: Σ Zutaten-Nährwerte ÷ `servings`; Skalierung auf `n` Portionen mit Faktor `n / servings` linear auf Mengen und Nährwerte.
- **Einkaufsliste**: Gruppierungsschlüssel `foodItemId` (sonst normalisierter Name) plus Einheit; Summe der Mengen × Portionsfaktor der geplanten Mahlzeit; Stück bleibt getrennt von Gramm; Kategorie aus `food_item.category`; manuelle Positionen und `inPantry` bleiben bei Neuerzeugung erhalten.
- **Streak (Vorschlag)**: zählt aufeinanderfolgende geplante Trainingstage mit abgeschlossener Einheit (±1 Tag Toleranz, konfigurierbar); Ruhetage und pausierte Programme unterbrechen nicht. Regel ist eine offene Produktentscheidung.
- **Trendlinie Gewicht**: gleitender Durchschnitt über 7 Tage; Anzeige erst ab 3 Messpunkten im Zeitraum.

## 9. Beispielabläufe

**Training starten**: Service lädt `workout_day` und `workout_day_exercise` der eingeschriebenen Programmversion, erzeugt `workout_session` (`in_progress`), je Übung eine `session_exercise` mit Namens-Snapshot und je geplantem Satz einen `exercise_set` (`planned`) mit Zielwerten. Alles in einer Transaktion. Spätere Planänderungen betreffen diese Session nicht.

**Satz abschließen**: Service validiert Istwerte, setzt `status = done`, `completedAt`, `restEndsAt = now + restSec`, schreibt Outbox-Eintrag. UI rechnet Timer aus `restEndsAt`.

**Rezept ändern**: Service kopiert die aktuelle Version zu `version + 1`, setzt `isLatest` um, schreibt Zutaten mit neuen `per100Snapshot`. `planned_meal` und `food_log_entry` behalten `recipeVersion` und Snapshot.

**Woche bestätigen**: `meal_plan.status = confirmed`, Einkaufsliste wird aus `planned_meal` erzeugt; bestehende manuelle Positionen und `inPantry`-Markierungen einer vorherigen Liste derselben Woche werden übernommen.

## 10. Migrationen

- Jede Schemaänderung: neue Dexie-Version mit Upgrade-Funktion, neue SQL-Migration unter `supabase/migrations/`, Eintrag im Changelog, Test mit Fixture der Vorgängerversion.
- Rückwärtskompatibel lesen: Sync akzeptiert fehlende neue Felder (Zod `default`), nie fehlende Pflichtfelder ohne Migration.
- Keine destruktiven Migrationen ohne Export davor und ausdrückliche Zustimmung.

## 11. Offene Punkte

- Umfang der Nährwertfelder (nur Makros oder auch Ballaststoffe, Zucker, Salz).
- Streak-Regel und Toleranz.
- Ob `nutrition_day` von Anfang an nötig ist (Zielsnapshot) oder Ziele über `effectiveFrom` ausreichen.
- Ob Fotos in der ersten Sync-Version enthalten sind (Speicher, Kosten, Datenschutz).
- Quelle und Umfang der Übungsbibliothek (bestimmt Enum-Listen für Muskeln und Geräte).
