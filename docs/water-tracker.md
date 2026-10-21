# Wasser: Analyse, Abgleich, Bewertung und Bericht

Stand 21.10.2026, Branch `feat/wasser`. Auftrag: „REFORM — Water Tracker“ (Master-Prompt des Produktinhabers). Entscheidung: D-289, Abnahme AK-NUT-13, Matrix NU-27. Der Branch baut auf `feat/einkaufsliste` (#44) auf, weil beide die Datenbankversion erhöhen (v7 Einkaufsliste, v8 Wasser).

## 1. Analyse vor der Umsetzung

| Bereich | Befund | Folge für Wasser |
|---|---|---|
| Ernährung | Tagebuch mit Lebensmitteln, Nährwerten je Eintrag, Tagesnavigation; kein Getränke- oder Wassertracking | Eigene Datenquelle `water_entry`, keine doppelte Speicherung, Tagebuch unberührt |
| Ziele | Datierte Ziele `goal` (Zielgewicht, Wochenziel) mit `effectiveFrom` und `endedAt` (AK-SET-01) | Wasserziel als neue Art `water_daily` statt eigener Einstellung; Historie bleibt richtig |
| Ernährungsziel | `nutrition_target` verlangt kcal und Makros | Ungeeignet für Wasser, das auch ohne Ernährungserfassung funktionieren soll |
| Einstellungen | Singleton `settings` | Eigene Schnellmengen als optionales Feld `waterQuickMl` |
| Tagesaufgaben | `autoDone: 'training'` hakt automatisch ab (D-285) | Zweite Regel `water`, gleiches Verhalten (nur ohne Eintrag, manuell korrigierbar) |
| Heute | Ernährung, Schritte, Tagesaufgaben stehen auf Wunsch untereinander (D-277, D-283) | Wasser direkt unter „Ernährung heute“ (vom Produktinhaber festgelegt), danach Schritte und Tagesaufgaben |
| Persistenz | Dexie mit Basis-Repository (HLC, Löschmarkierung, Zod), Sync für alle Dokumenttabellen | Tabelle `waterLog` (Dexie v8, additiv, Snapshot, Migrationstest); Sync und Datensicherung ohne Sonderweg |
| Startansicht | Grenze 250 KB, knapp ausgeschöpft | Karte, Seite, Rechnung und Texte werden nachgeladen (D-288); dafür lädt der Zähler der Einkaufsliste in „Meine Küche“ kein Repository mehr. Ergebnis 249,4 KB |

## 2. Abgleich mit dem Auftrag

| Abschnitt | Verlangt | Umgesetzt |
|---|---|---|
| 2 Platzierung | In Küche oder Ernährung, optional „Heute“, Detailansicht; keine neue Hauptnavigation | Karte auf „Heute“ und in der Ernährung (für den gewählten Tag), Seite `/ernaehrung/wasser` über den Pfeil der Karte |
| 3 Hauptansicht | Menge, Ziel, Rest, Fortschritt, Schnellaktionen, letzten Eintrag rückgängig | Ja |
| 4 Visualisierung | Lesbare Menge, sich füllende Anzeige, Zielmarke, klein lesbar, Ziel erreicht positiv, kein Ende bei 100 % | Balken mit Zielmarke; über dem Ziel wächst die Skala, die Marke rückt nach innen; grün und „Tagesziel erreicht, x darüber“ |
| 5 Schnell hinzufügen | +150, +250, +500, +750 ml, anpassbar, sofort gespeichert, ohne Rückfrage | Ja; anpassbar unter „Schnellmengen“ |
| 6 Eigene Menge | Positive Zahlen, ungültige verhindern, ml intern, Anzeige ml oder l | Ja; „330“, „330 ml“, „1.000“, „0,5 l“; unter 1 l in ml, sonst in l |
| 7 Einträge | Je Trinkaktion ein Eintrag, Uhrzeit, rückgängig, löschen, bearbeiten | Ja; Nachgetragenes zeigt „nachgetragen am …“ statt einer erfundenen Uhrzeit |
| 8 Ziel | Einstellbar, Standard nur ohne eigenes Ziel, sofort gespeichert, Historie unverändert, vorhandenes Zielmodell nutzen, keine medizinische Aussage | Ja; Standard 2.000 ml, Hinweis „deine Vorgabe, keine Empfehlung“ |
| 9 Tageswechsel | Lokaler Kalendertag, kein Reset beim Start, kein Verlust, keine Doppelten | Ja; Summe wird aus Einträgen gerechnet, nichts wird zurückgesetzt |
| 10 Verlauf | Ø, Tage mit Ziel, Quote über 7 oder 30 Tage, Wochenbalken; Tage ohne Daten nicht als 0 | Ja; Ø und „Ziel erreicht x von y“ über abgeschlossene Tage mit Einträgen, Balken je Tag, Hinweis auf Tage ohne Eintrag |
| 11 Tagesaufgaben | Nur bei ausdrücklicher Aktivierung, nachvollziehbar, manuell korrigierbar, Aufgabe ändert Wasser nicht | Ja („Mit Wasserziel abhaken“) |
| 12 Ernährung | Keine doppelte Speicherung, Getränke nicht als Wasser, kcal unberührt, Wasser ohne Ernährung nutzbar | Ja; getrennte Datenquelle, getestet |
| 13 Design | Tokens, Komponenten, Einhandbedienung, kleine Displays, keine neue Optik | Ja; nur vorhandene Tokens und Bausteine, 320 px getestet |
| 14 Persistenz | Lokal sofort, Neuladen, offline, Migration ohne Verlust, kein neues Backend, Sync | Ja |
| 15 Vorschläge | Bewerten in drei Stufen | Abschnitt 3 |
| 16 Tests | 15 Szenarien | Abschnitt 4 |

## 3. Produktbewertung

### 3.1 Hoher Mehrwert

| Vorschlag | Nutzen | Aufwand | Daten | Risiko | Stand |
|---|---|---|---|---|---|
| Anpassbare Schnellmengen | Eigene Flaschen und Gläser mit einem Tipp | Gering | `settings` | Gering | Umgesetzt |
| Schnellzugriff auf „Heute“ | Eintragen ohne Seitenwechsel | Gering | – | Gering | Umgesetzt |
| Verbindung mit Tagesaufgaben | „2 l Wasser“ nicht doppelt abhaken | Gering | `autoDone` | Gering | Umgesetzt |
| Wochenübersicht | Muster erkennen | Gering | Einträge | Gering | Umgesetzt (7 und 30 Tage) |

### 3.2 Sinnvolle spätere Erweiterung

| Vorschlag | Nutzen | Aufwand | Daten | Risiko |
|---|---|---|---|---|
| Häufig verwendete eigene Mengen vorschlagen | Weniger Tippen bei wechselnden Gefäßen | Gering | Einträge | Gering |
| Uhrzeit beim Nachtragen wählbar | Genauerer Tagesverlauf | Gering | `loggedAt` | Gering |
| Wasser aus Apple Health über den Kurzbefehl | Keine doppelte Eingabe, wenn eine andere App Wasser schreibt | Mittel | Kurzbefehl wie bei den Schritten (D-277) | Mittel: zweite Quelle, Doppelte vermeiden |
| Getränke aus dem Tagebuch als Wasser anrechnen (nur ausdrücklich je Lebensmittel) | Mineralwasser aus dem Tagebuch zählt mit | Mittel | Kennzeichen am Lebensmittel | Mittel: Doppelzählung, daher nur mit klarer Regel |

### 3.3 Nicht empfohlen

| Vorschlag | Grund |
|---|---|
| Erinnerungen per Mitteilung | Eine Web-App auf dem iPhone kann ohne Server keine verlässlichen Erinnerungen senden (`known-limitations.md`); unzuverlässige Erinnerungen wären schlechter als keine |
| Automatisch berechnetes „ideales“ Ziel | Der Bedarf ist individuell; eine Formel würde eine Empfehlung vortäuschen |
| Animierte Wassergrafik | Mehr Aufwand und Akku, kein zusätzlicher Erkenntniswert |

## 4. Tests zu den 15 Szenarien des Auftrags

| Nr. | Szenario | Nachweis |
|---|---|---|
| 1 | Schnellbutton | `water-ui.test.tsx`, `e2e/water.spec.ts` |
| 2 | Eigene Menge | `water.test.ts` (Eingaben), `water-ui.test.tsx`, E2E (offline „1,25 l“) |
| 3 | Ungültige Eingaben | `water.test.ts`, `waterService.test.ts`, `water-ui.test.tsx` (Menge und Ziel) |
| 4 | Bearbeiten und löschen | `waterService.test.ts`, `water-ui.test.tsx` |
| 5 | Letzten Eintrag rückgängig | `water-ui.test.tsx` (entfernen und zurückholen) |
| 6 | Tagessumme | `water.test.ts`, `waterService.test.ts` |
| 7 | Ziel ändern | `waterService.test.ts` (ab heute, frühere Tage behalten ihr Ziel), `water-ui.test.tsx` |
| 8 | Ziel erreicht | `water-ui.test.tsx` (erreicht und darüber), `waterService.test.ts` |
| 9 | Neuer Kalendertag | `waterService.test.ts` (23:50 und 00:10), E2E mit Uhr |
| 10 | Historie erhalten | `waterService.test.ts`, `water.test.ts` (Verlauf), E2E (Verlauf am nächsten Tag) |
| 11 | Neuladen | E2E |
| 12 | Offline | E2E (Service Worker steuert die Seite, offline eintragen); Offline-Start in `APP_PAGES` |
| 13 | Kleines Smartphone | E2E 320 px auf „Heute“ und `/ernaehrung/wasser` |
| 14 | Tagesaufgaben | `habitService.test.ts`, `habits-ui.test.tsx`, E2E (Abhaken bei 2 l, manuell zurücknehmen bleibt) |
| 15 | Keine Werte im Ernährungstagebuch | `waterService.test.ts`, `water-ui.test.tsx`, E2E (0 kcal) |

Ergebnisse wörtlich in `testing.md`, Abschnitt „Wasser“.

## 5. Bericht (Vorlage `implementation-plan.md` Abschnitt 8)

```
Arbeitspaket: Wasser (Plan Punkt 55)
Umgesetzte Funktionen: NU-27, erfüllte AK: AK-NUT-13
Geänderte Dateien: neues Modul src/modules/water (model, calc, data, service, ui/WaterCard,
  ui/WaterPage, ui/WaterChart, routes, index); src/shared/db/schema.ts (v8), export.ts;
  src/modules/goals (Art water_daily, Verlauf im Profil); src/modules/settings/model
  (waterQuickMl); src/modules/habits (autoDone water, Schalter, Abhaken); src/modules/dashboard
  (Karte auf „Heute“); src/modules/nutrition (Karte in der Ernährung, Zähler der Einkaufsliste);
  src/modules/shopping (useOpenShoppingCount); src/shared/i18n/de-water.ts, de.ts; e2e; Dokumente
Technische Entscheidungen: D-289
Ausgeführte Tests: pnpm format:check, lint, typecheck, test, check:docs, build, check:bundle,
  test:e2e (Chromium); WebKit in GitHub Actions
Ergebnis: siehe testing.md „Wasser“
Bekannte Einschränkungen: keine Erinnerungen (iPhone, siehe 3.3); Uhrzeit beim Nachtragen nicht
  wählbar; Wasser aus Apple Health wird nicht übernommen; ein Eintrag über 5 l wird abgelehnt
Nächste Schritte: häufige eigene Mengen, Uhrzeit beim Nachtragen, später Health-Kurzbefehl
```

Speicherung: ein Dokument je Trinkaktion; die Tagessumme wird aus den Einträgen des lokalen Kalendertags gerechnet, nie gespeichert. Ein neuer Tag beginnt deshalb ohne Zurücksetzen bei 0, und frühere Tage bleiben vollständig. Der Verlauf rechnet je Tag mit dem Ziel, das an diesem Tag galt.
