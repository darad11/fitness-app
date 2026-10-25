# Einkaufsliste: Analyse, Abgleich, Bewertung und Bericht

Stand 20.10.2026, Branch `feat/einkaufsliste` (PR #44). Auftrag: „REFORM – Kitchen: Smart Shopping List“ (Master-Prompt des Produktinhabers). Entscheidung: D-287, Texte D-288, Abnahme AK-NUT-12, Matrix NU-26.

## 1. Analyse vor der Umsetzung (Phase 1)

| Bereich | Befund | Folge für die Einkaufsliste |
|---|---|---|
| Küche | „Meine Küche“ (`KitchenMenu`) führt zu Lebensmitteln, Rezepten und Vorlagen | Neuer Eintrag „Einkaufsliste“ mit Zahl der offenen Artikel, eigene Seite `/ernaehrung/einkaufsliste` |
| Lebensmittelbibliothek | Eigene Lebensmittel (`food`), Rezepte (`recipe`), importierte Daten (D-263); keine Kategorien je Lebensmittel | Eigene Lebensmittel als Vorschläge beim Tippen; Kategorie aus dem Namen |
| Rezepte | Zutaten mit Menge in g bzw. ml | „Zutaten auf die Einkaufsliste“ im Rezept, gleiche Zutaten zusammengerechnet |
| Wochenplanung | Kein Wochenmenü und keine geplanten Mahlzeiten (M8, später) | Liste aus geplanten Mahlzeiten noch nicht möglich; `addLines` ist die Grundlage dafür |
| Persistenz | Dexie mit Basis-Repository (HLC, Löschmarkierung, Zod), Sync für alle Dokumenttabellen | Neue Tabelle `shoppingItems` (Dexie v7, additiv, Snapshot und Migrationstest), kein eigenes Backend |
| Design | Tokens, `Card`, `Meter`, `SegmentedControl`, `Toast`, `IconButton`, Dark Mode | Nur vorhandene Bausteine und Tokens |
| Startansicht | 250 KB Grenze, knapp ausgeschöpft | Seite, Rechnung und Texte werden nachgeladen (D-288) |

## 2. Abgleich mit dem Auftrag

| Abschnitt | Verlangt | Umgesetzt |
|---|---|---|
| 2 Grundprinzip | Hinzufügen, Menge und Einheit, abhaken, bearbeiten, löschen, offen und gekauft getrennt, bleibt nach Neustart | Ja; auch Haushalt, Nahrungsergänzung und Sonstiges |
| 3A Schnelleingabe | Enter fügt hinzu, Feld leert sich, Fokus bleibt, Leeres verhindert, Doppelte mit Rückfrage, sofort sichtbar | Ja |
| 3B Details | Name, Menge, Einheit, Kategorie, Notiz, Status; Menge optional | Ja; Bearbeiten über das Stift-Symbol |
| 3C Natürliche Eingabe | „500 g Hähnchenbrust“, „6 Bananen“ erkennen, Unklares unverändert lassen, lokal | Ja, lokal ohne KI; Menge vorne oder hinten; korrigierbar beim Bearbeiten |
| 4 Kategorien | Optional, automatisch wenn sicher, änderbar, Ansicht nach Kategorie optional | Ja; 9 Kategorien, Ansicht „Meine Liste“ oder „Nach Kategorie“ |
| 5 Einkauf | Antippen hakt ab, sofort gespeichert, wieder öffnen, Gekaufte eingeklappt, Menge ändern, einzeln löschen, „Gekaufte entfernen“ | Ja, mit Rückgängig für Löschen und Entfernen; einzeln löschen seit D-360 auch mit einem Wisch nach links (Abschnitt 6) |
| 5 Liste leeren | Nur falls umgesetzt, mit Bestätigung | Bewusst nicht umgesetzt: „Gekaufte entfernen“ deckt den Alltag ab, ein Knopf, der auch offene Artikel löscht, wäre ein unnötiges Risiko |
| 6 Mehrere Listen | Nur wenn einfach; sonst eine Hauptliste mit erweiterbarer Struktur | Eine Hauptliste; ein späteres Feld `listId` lässt sich additiv ergänzen |
| 7A Lebensmittelbibliothek | Auswahl übernimmt den Namen, freie Eingabe bleibt | Eigene, nicht archivierte Lebensmittel erscheinen beim Tippen als Vorschläge unter dem Feld (ein Tipp fügt hinzu); Marke und Nährwerte werden nicht übernommen, weil die Liste keine Nährwerte braucht |
| 7B Rezepte und Mahlzeiten | Nur wenn Daten da sind; Doppelte zusammenrechnen | Rezepte ja („Zutaten auf die Einkaufsliste“, 200 g + 150 g Reis = 350 g); geplante Mahlzeiten gibt es noch nicht |
| 7C Trennung vom Tagebuch | Nichts zählt als gegessen | Ja, getestet (Ernährung bleibt 0 kcal); den Hinweis auf der Seite hat der Produktinhaber entfernen lassen |
| 8A Wiederkehrende Artikel | Häufige, zuletzt verwendete, erneut hinzufügen | „Zuletzt gekauft“ mit einem Tipp; Favoriten nicht (siehe Abschnitt 3) |
| 8B Vorlagen | Prüfen | Nicht umgesetzt (siehe Abschnitt 3) |
| 8C Einheiten | g, kg, Stück, ml, l, Packung, flexibel | Ja; dazu Flasche und Dose, Menge immer optional |
| 8D Fortschritt | „5 von 12 gekauft“, dezent | Ja, mit schmalem Balken |
| 8E Im Laden | Große Haken, kompakt, Trennung, Kategorien, Rückgängig, Scrollposition | Ja; Abhaken lädt die Seite nicht neu, die Scrollposition bleibt (nicht eigens automatisch getestet) |
| 9 Design | Tokens, Komponenten, Dark Mode, Einhandbedienung | Ja; 320 px ohne Überlauf getestet |
| 10 Datenmodell | ID, Name, Menge, Einheit, Kategorie, Notiz, Status, Erstellung, Abhaken, Reihenfolge | Ja (`createdAt`, `doneAt`, `clearedAt`, `position`); siehe `data-model.md` |
| 11 Datenschutz | Lokal, ohne externe Dienste | Ja; keine Anfrage nach außen (Netzwerktest in `APP_PAGES`) |
| 12 Tests | 17 Szenarien | Siehe Abschnitt 4 |
| 13 Produktbewertung | Vorschläge in drei Stufen | Abschnitt 3 |
| 15 Bericht | Dateien, Funktionen, Datenmodell, Tests, offene Punkte, Vorschläge | Abschnitt 5 |

## 3. Produktbewertung

Bewertet nach Nutzen für dich, Aufwand, nötigen Daten und Risiko.

### 3.1 Hoher Mehrwert, zeitnah

| Vorschlag | Nutzen | Aufwand | Daten | Risiko |
|---|---|---|---|---|
| Wochenmenü erzeugt die Einkaufsliste (M8) | Ein Wocheneinkauf ohne Abtippen | Mittel bis hoch | Wochenmenü fehlt noch; `addLines` rechnet bereits zusammen | Gering, die Liste bleibt unabhängig |
| Favoriten bzw. „Immer wieder“ (angeheftete Artikel) | Standardartikel mit einem Tipp, auch wenn sie lange nicht gekauft wurden | Gering | Ein Feld je Artikelname oder eine kleine Tabelle | Gering |
| Reihenfolge der Kategorien wie im eigenen Supermarkt | Kürzerer Weg im Laden | Gering | Eine Einstellung | Gering |

### 3.2 Sinnvolle spätere Erweiterung

| Vorschlag | Nutzen | Aufwand | Daten | Risiko |
|---|---|---|---|---|
| Vorlagen („Wocheneinkauf“, „Supplements“) | Wiederkehrende Einkäufe auf einmal | Mittel | Neue Tabelle | Gering; überschneidet sich mit Favoriten |
| Mehrere Listen | Getrennte Läden oder Haushalt | Mittel | Feld `listId`, Verwaltung | Mittel: mehr Bedienung für eine Person |
| Abhaken kann einen Vorrat füllen (M8 „Vorrat“) | Weiß, was zu Hause ist | Hoch | Vorratsmodell fehlt | Mittel |
| Artikel per Barcode hinzufügen | Leere Packung scannen und nachkaufen | Gering, Scanner ist vorhanden | Barcode und eigene Lebensmittel | Gering; Online-Abfrage nur mit Einwilligung (D-302) |
| Sortieren per Ziehen | Eigene Reihenfolge | Mittel | `position` ist schon da | Gering, aber auf dem iPhone fummelig |

### 3.3 Nicht empfohlen

| Vorschlag | Grund |
|---|---|
| Preise und Budget | Viel Pflege, wenig Nutzen für eine Person |
| KI-Erkennung der Eingabe | Externe Daten, Kosten; die lokale Erkennung reicht |
| Liste mit anderen teilen | Braucht Konten und Freigaben (Q-20), hoher Aufwand |
| Produktdatenbank für jeden Artikel | Einkaufsliste braucht keine Nährwerte; Datenschutz und Abhängigkeit |
| „Liste leeren“ inklusive offener Artikel | Löscht leicht Benötigtes; „Gekaufte entfernen“ reicht |

## 4. Tests zu den 17 Szenarien des Auftrags

| Nr. | Szenario | Nachweis |
|---|---|---|
| 1, 2 | Einen und mehrere Artikel hintereinander | `shopping-ui.test.tsx` (Enter, Fokus bleibt), `e2e/shopping.spec.ts` |
| 3, 4 | Ohne Menge; Menge und Einheit ergänzen | `shoppingService.test.ts`, `shopping-ui.test.tsx` (Bearbeiten) |
| 5 | Bearbeiten | `shopping-ui.test.tsx` |
| 6, 7 | Abhaken, wieder öffnen | `shopping-ui.test.tsx`, `shoppingService.test.ts`, E2E |
| 8 | Löschen mit Rückgängig | `shopping-ui.test.tsx`, `shoppingService.test.ts` |
| 9 | Gekaufte entfernen, offene bleiben | `shoppingService.test.ts`, `shopping-ui.test.tsx` |
| 10 | Doppelte | `entry.test.ts`, `shopping-ui.test.tsx` (Rückfrage, Menge dazurechnen) |
| 11 | Nach Kategorie | `shopping-ui.test.tsx`, E2E |
| 12 | Nach Neuladen | E2E |
| 13 | Offline | E2E (offline eintragen); Offline-Start in `APP_PAGES` |
| 14 | Kleines Smartphone | E2E 320 px ohne Überlauf, Pixel 7 |
| 15 | Fehlerhafte Eingaben | `entry.test.ts` (Unklares bleibt Name), `shoppingService.test.ts` (leer, Menge ≤ 0), Oberfläche (leerer Eintrag) |
| 16 | Küche und Ernährung unverändert | Alle vorhandenen Tests der Ernährung laufen mit (`pnpm test`, `pnpm test:e2e`) |
| 17 | Nichts zählt als gegessen | `shoppingService.test.ts`, `shopping-ui.test.tsx`, E2E (0 kcal) |
| – | Vorschläge aus eigenen Lebensmitteln | `nutritionService.test.ts` (ohne archivierte), `shopping-ui.test.tsx` |

Ergebnisse wörtlich in `testing.md`, Abschnitt „Einkaufsliste“.

## 5. Bericht (Vorlage `implementation-plan.md` Abschnitt 8)

```
Arbeitspaket: Einkaufsliste in „Meine Küche“ (Plan Punkt 53)
Umgesetzte Funktionen: NU-26, erfüllte AK: AK-NUT-12
Geänderte Dateien: neues Modul src/modules/shopping (model, calc/entry, data, service,
  ui/ShoppingListPage, routes, index); src/modules/nutrition/ui/KitchenMenu.tsx,
  RecipeEditPage.tsx, nutrition/index.ts (loadOwnFoodNames); src/shared/db/schema.ts (v7),
  export.ts; src/shared/i18n/de-shopping.ts, de-task-stats.ts, de.ts; src/app/routes.tsx;
  e2e/shopping.spec.ts, e2e/fixtures.ts; Dokumente
Technische Entscheidungen: D-287 (Einkaufsliste), D-288 (Texte nachgeladener Seiten)
Ausgeführte Tests: pnpm format:check, lint, typecheck, test, check:docs, build,
  check:bundle, test:e2e (Chromium); WebKit in GitHub Actions
Ergebnis: siehe testing.md „Einkaufsliste“
Bekannte Einschränkungen: eine Liste; keine Favoriten und Vorlagen; geplante Mahlzeiten
  fehlen noch (M8); Vorschläge nur aus eigenen Lebensmitteln, nicht aus importierten Daten;
  Scrollposition nach dem Abhaken nicht eigens automatisch getestet
Nächste Schritte: Favoriten bzw. „Immer wieder“, Kategorien-Reihenfolge, Wochenmenü (M8)
```

Datenmodell, Persistenz und Offline: ein Dokument `shopping_item` je Artikel in `shoppingItems` (Dexie v7, additiv; Migration v6 → v7 mit Snapshot getestet), gespeichert über das Basis-Repository, synchronisiert wie alle Dokumente, in der Datensicherung enthalten. Die Seite funktioniert offline, weil alles lokal liegt.

## 6. Wischen zum Löschen (D-360, Phase Ernährung §4)

Ein Wisch nach links löscht einen Artikel, ohne „Bearbeiten“ zu öffnen; danach „„Name“ gelöscht“ mit „Rückgängig“ wie beim bisherigen Löschen.

| Regel | Wert |
|---|---|
| Richtung | nach den ersten 10 px einmal für die ganze Geste: nur klar waagrecht nach links (mindestens doppelt so weit zur Seite wie nach oben oder unten) |
| Löschstrecke | 40 % der Zeilenbreite, mindestens 96 px; kürzer gleitet die Zeile zurück |
| Scrollen | `touch-action: pan-y`: senkrecht scrollt der Browser, die Zeile bleibt stehen |
| Anzeige | dezenter Papierkorb hinter der Zeile, ab der Löschstrecke „Löschen“ auf schwacher Warnfläche; für Screenreader ausgeblendet |
| Tastatur und Screenreader | weiter über „Bearbeiten“ und „Löschen“ |
| Umsetzung | `calc/swipe.ts` (ohne React), `ui/SwipeToDelete.tsx`, Zeiger-Ereignisse, keine neue Abhängigkeit |

Gerätetest auf dem iPhone steht aus; geprüft sind Maus und Touch in Chromium (E2E) und WebKit in der CI (Maus).
