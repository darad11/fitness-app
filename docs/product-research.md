# Produktrecherche: Referenz-App

Stand: 17.10.2026 · Phase 1 (Produktanalyse) · Status: Entwurf zur Prüfung

> **Hinweis zu Version 0.2 (18.10.2026):** Inhalt unverändert. Die Produktentscheidungen aus Phase 2 stehen in `decisions.md`, die Prüfung der Datenquellen in `data-sources.md`. Die in Abschnitt 9 genannten Schwächen sind Erkenntnisse aus Rezensionen (überwiegend 2024 und 2025), nicht zwingend der heutige Stand der Referenz-App (D-118).

## 1. Zweck und Einordnung

Dieses Dokument fasst zusammen, was sich über den Funktionsumfang der Referenz-App aus öffentlich zugänglichen Quellen belegen lässt. Es ist die Grundlage für die Funktionsmatrix in `feature-inventory.md`.

Die Anwendung, die wir bauen, ist eine eigenständige persönliche Plattform. Es werden keine Inhalte, Medien, Programme, Designs oder Schnittstellen von der Referenz-App übernommen. Die Referenz-App dient ausschließlich als funktionale Orientierung.

## 2. Methodik und Quellenlage (wichtig)

**Kein Zugriff auf die installierte App.** Ich habe die Referenz-App nicht bedienen können. Alle Aussagen stammen aus Sekundärquellen.

**Direkter Webzugriff war blockiert.** Die Netzwerkrichtlinie dieser Cloud-Umgebung hat jeden direkten Abruf der Quellseiten verweigert (CONNECT 403 am Proxy), darunter `apps.apple.com`, `play.google.com`, die Website der Referenz-App, ihre Hilfecenter bei Gorgias und Zendesk, `screensdesign.com`, `web.archive.org`. Verfügbar war nur die serverseitige Websuche, die Seitenausschnitte und Zitate liefert. Folgen:

- Ich konnte keine Screenshots, keine vollständigen Store-Beschreibungen und keine vollständige Versionshistorie einsehen.
- Zitate sind Ausschnitte, die die Suche zurückgegeben hat. Sie sind wörtlich wiedergegeben, aber ohne vollständigen Kontext.
- Datumsangaben zu Versionen schwanken zwischen Storefronts (Datumsformat TT/MM vs. MM/TT, relative Angaben wie „4d ago"). Ich gebe die plausibelste Lesart an und markiere Unsicherheit.

Wenn der Netzwerkzugriff für die genannten Hosts freigegeben wird (Einstellungen der Cloud-Umgebung, Netzwerkzugriff, erlaubte Domains), kann ich die Primärquellen vollständig auswerten und dieses Dokument nachschärfen.

### 2.1 Quellenverzeichnis und Kürzel

| Kürzel | Quelle | Art | Verlässlichkeit |
|---|---|---|---|
| AS | App Store Listing, mehrere Storefronts (US, AT, AU, DK, BM, UZ u. a.), inkl. Versionshistorie und Rezensionen | Offiziell (Anbietertext), Rezensionen Nutzer | Hoch für Anbietertext, mittel für Rezensionen |
| GP | Google Play Listing der Referenz-App (en_US, en_AU, en_IN, en_GB u. a.) | Offiziell | Hoch |
| WEB | Website der Referenz-App: `/pages/home`, App-Landingpage, `/pages/get-fit`, Produkt- und Challenge-Seiten | Offiziell (Marketing) | Mittel bis hoch, teils veraltet |
| HC-G | Hilfecenter der Referenz-App (Gorgias), Kategorien Workouts, Nutrition, Subscription and Payment, Settings | Offiziell (Support), teils „updated 2 years ago" | Hoch, aber potenziell veraltet |
| HC-Z | Hilfecenter der Referenz-App (Zendesk), Artikel zuletzt Oktober 2025 aktualisiert | Offiziell (Support) | Hoch |
| TC | Teilnahmebedingungen der Challenges (30 Day Reset, 75 Day Challenge, 90 Day Challenge) auf der Website der Referenz-App | Offiziell (rechtlich) | Hoch |
| SD | screensdesign.com „UI Breakdown" der Referenz-App (Analyse eines Bedienvideos mit Zeitmarken) | Drittquelle, videobasiert | Mittel bis hoch |
| DT | Portfolio-Fallstudie der Entwicklungsagentur zur Referenz-App | Drittquelle (Eigenaussage Agentur) | Mittel |
| MWM | mwm.ai App-Verzeichnis (Drittlisting mit FAQ) | Drittquelle, unklare Herkunft der Texte | Niedrig |
| REV | Nutzerrezensionen (App Store, Google Play, justuseapp.com, worldsapps.com) | Nutzeraussagen, teils 2024/2025 | Niedrig bis mittel, zeitabhängig |
| AB | appbrain.com, apkpure.com, apptopia.com | Drittlistings (Metadaten) | Niedrig bis mittel |
| DC | Einladungsseite zum Discord-Server der Referenz-App | Offiziell (Community) | Hoch für Existenz |

### 2.2 Konfidenzstufen in diesem Dokument und in der Matrix

- **Verifiziert**: durch offizielle Quelle (AS, GP, WEB, HC, TC) oder durch SD mit Zeitmarke belegt.
- **Verifiziert (Rezensionen)**: nur durch mehrere übereinstimmende Nutzerrezensionen belegt; Zustand zum Zeitpunkt der Rezension.
- **Historisch**: belegt, aber möglicherweise durch spätere Versionen verändert (z. B. Hilfeartikel „updated 2 years ago").
- **Plausibel**: aus Kontext naheliegend, nicht belegt.
- **Nicht verifiziert (Drittquelle)**: nur in MWM oder ähnlichen Listings genannt.
- **Verifiziert als fehlend**: Rezensionen oder SD benennen das Fehlen ausdrücklich (Stand der Quelle).
- **Eigener Vorschlag**: nicht Teil der Referenz-App.

## 3. Produktsteckbrief der Referenz-App (belegt)

| Merkmal | Befund | Quelle |
|---|---|---|
| Name | Name der Referenz-App mit Untertitel; je nach Storefront ein anderer Untertitel, historisch zwei weitere Bezeichnungen | AS, GP, AB |
| Anbieter | eine LLC; Kategorie Health & Fitness | AS |
| Plattformen | iOS (ab iOS 15.0, ca. 88,4 MB), Android (ab 8.0) | AS, AB |
| Preismodell | Kostenloser Download, Abo mit 7 Tagen Testphase, harte Paywall nach dem Onboarding-Quiz; Hilfecenter nennt 23,99 USD/Monat bzw. 172,73 USD/Jahr; Store-IAP je nach Region ca. 19,99 bis 132,99 USD; ein Drittlisting nennt deutlich höhere Preise | HC-G, AS, SD, AB |
| Bewertungen | App Store US ca. 4,7 bis 4,8 bei ca. 1,7 bis 2,4 Tsd. Bewertungen (je nach Zeitpunkt); Google Play ca. 4,3 bis 4,7; Downloads laut Play „50K+" | AS, GP, AB |
| Support | zwei Support-Adressen des Anbieters (eine im Play-Eintrag, eine aus Entwicklerantworten) | GP, AS |
| Community | Discord-Server der Referenz-App, ca. 3.200 Mitglieder; Zugang zum Head Trainer über Discord beworben | DC, WEB |
| Technik (Drittquelle) | Ursprünglich FlutterFlow + Firebase; Neuaufbau in Flutter mit AWS (Postgres RDS, NestJS-API) durch die Entwicklungsagentur | DT |
| Datenschutz-Label (US App Store) | „Data Linked to You": Kontaktdaten, Identifier, Nutzungsdaten, Diagnose; „Data Used to Track You": Identifier, Nutzungsdaten. Play: keine Weitergabe an Dritte, Verschlüsselung bei Übertragung | AS, GP |

## 4. Versionshistorie (rekonstruiert)

Die Einträge stammen aus Suchausschnitten der App-Store-Versionshistorie. Daten sind auf die plausibelste Lesart normalisiert; Abweichungen zwischen Storefronts sind möglich.

| Version | Datum (ca.) | Inhalt laut Release Notes | Konfidenz |
|---|---|---|---|
| 3.1.4 | Jul 2025 | Workout-Erinnerungen, Einstellungsseite für Benachrichtigungen | Verifiziert |
| 3.1.5 | 21.07.2025 | Social-Media-Sharing, aktualisiertes Kalorien-Widget, neues Onboarding, aktualisierte Programmdetailseite. Ein Play-Eintrag „3.1.5 Juli 2025" erwähnt manuelle Workouts; Zuordnung unsicher | Verifiziert (Details teils unsicher) |
| 3.1.6 | 28.07.2025 | Übungs- und Pausentimer laufen im Hintergrund weiter; verbesserte Gewichtsauswahl | Verifiziert |
| 3.1.7 | 01.08.2025 | „Refined dropsets"; automatische Neuberechnung der Nährwerte bei Mahlzeiten | Verifiziert |
| 3.1.8 | 28.08.2025 | Aktionsrabatt, Bugfixes | Verifiziert |
| 3.2.0 | 05.09.2025 | „New streak feature" | Verifiziert |
| 3.2.1 | Sep 2025 | Neues App-Icon, Verbesserungen beim Teilen | Verifiziert |
| 3.3.x | Herbst 2025 | Keine Inhalte gefunden | Lücke |
| 3.4.0 | 17.12.2025 | Guthaben-Programm der Referenz-App (Credits durch Workouts und protokollierte Aktivität, anrechenbar auf die Mitgliedschaft) | Verifiziert |
| 3.4.2 | 30.12.2025 | Referral-System; „Bring back exercises page - find it in the plus zone or settings" | Verifiziert |
| 3.4.5 | Anfang 2026 | „Home UI updates" | Verifiziert |
| 3.4.6 | 2026 | Fix für Teilen unter iOS 26 | Verifiziert |
| 3.4.11 | 12.08.2026 | „You can now log your own manual workouts" | Verifiziert |
| 3.5.0 | 08.09.2026 | Wochen-Mahlzeitenplanung um das Kalorienziel; Rezepte tauschen, Kochtage wählen, planbare Mahlzeiten auswählen; Einkaufsliste aus der bestätigten Woche; Rezeptkatalog nach Mahlzeit, Küche, Schwierigkeit; „smoother food log, barcode scanning improvements, and clearer daily targets" | Verifiziert |
| 3.5.1 | ca. 15.09.2026 | „Grocery lists are now easier to read and shop from" | Verifiziert |
| 3.5.2 | Okt 2026 | Bugfixes | Verifiziert |

Lücken: Versionen vor 3.1.4 und die 3.3.x-Reihe konnten nicht rekonstruiert werden.

## 5. Verifizierte Funktionen nach Bereich

Die Belegzitate sind englische Originalausschnitte aus den Quellen.

### A. Onboarding und Profil

- **Pflicht-Registrierung vor dem Quiz**, dann Personalisierungs-Quiz mit 19 Schritten, dann harte Paywall (SD: Sign-up 00:39, Quiz 01:12, Paywall 02:38). Verifiziert.
- **Quiz-Inhalte**: „Personalized workout plans based on several answers you give us in your signup survey" (HC-G); Survey umfasst „body type, goals, gender, experience, access to gym equipment, and several other factors" (HC-G); Ernährungsziele „based on dietary preferences, age, weight and fitness goal" (GP). Play: „a few quick questions" über „goals, body, and lifestyle", „in under 5 minutes". Verifiziert. Nicht belegt: Körpergröße, Trainingshäufigkeit, Aktivitätslevel als eigene Fragen (plausibel).
- **Plausibilitätswarnung beim Ziel**: Ein zu ehrgeiziges Ziel wird als „Health risk!" markiert (SD 01:58). Verifiziert.
- **Programmempfehlung nach Quiz** und späterer Wechsel: Home, Menü oben links, „Change workout plan", optional neues Ziel, dann empfohlenes Programm wählen oder andere durchsuchen (HC-Z). Verifiziert.
- **Profil und Einstellungen**: Home, Profil oben links, „Profile & settings", Tab „Settings"; Zeile „Units" mit metrisch/imperial (HC-G). Verifiziert, historisch (Layout seit 3.4.5 ggf. verändert).
- **Benachrichtigungen**: Workout-Reminder und Benachrichtigungs-Einstellungsseite (AS 3.1.4); Website bewirbt „daily notifications and motivational messages". Verifiziert.
- **Konto löschen**: Datenschutzseite beschreibt permanente Löschung; Rezensionen: Löschung kündigt das Abo nicht. Verifiziert.
- **Kommerziell**: Abo, Paywall, Referral-Programm, Guthabenpunkte, 20 % Supplement-Rabatt für Abonnenten (HC-G, AS). Verifiziert, für unser Produkt nicht relevant.

### B. Trainingsplanung

- **Programmkatalog** mit benannten Programmen und Metadaten: Level (Beginner bis Advanced, auch kombiniert), Dauer in Wochen, Minuten pro Einheit, Sätze pro Einheit. Beispiele von der Website: Beginner 11 Wochen 60 Min 20 Sätze; Advanced 16 Wochen 40 Min 20 Sätze; Advanced 12 Wochen 75 Min 32 Sätze; „Bulk Up" 13 Wochen 60 Min 32 Sätze; „At Home Sculpt" 19 Wochen Beginner 60 Min 26 Sätze; „60 Day Summer Shred"; zwei nach Trainern benannte Programme. Ziele „from weight loss and muscle building to yoga and flexibility" (WEB, REV). Verifiziert. Die konkrete Programmstruktur (Split, Tage pro Woche) ist nicht belegt.
- **Programmdetailseite** (AS 3.1.5 „updated program details page"). Verifiziert.
- **Home- und Gym-Varianten**, „no equipment needed to start" (GP, WEB). Verifiziert.
- **Feste Wochenstruktur mit festen Ruhetagen**: „you cannot pick your rest days"; Ruhetag kann nicht in Trainingstag getauscht werden; nächster Tag erst am Tag selbst sichtbar; verpasste Workouts nicht nachholbar ohne Reset (REV, 2024/2025). Verifiziert (Rezensionen), Stand unsicher.
- **Swap Workouts**: „allows users to easily drag and drop sessions to fit their week" (SD 12:05). Verifiziert. Widerspricht teils älteren Rezensionen; vermutlich später ergänzt.
- **Übungen austauschen**: Rezensionen beschreiben Alternativen bei fehlendem Gerät („great alternatives when something doesn't work for me", „switch exercises"). Verifiziert (Rezensionen).
- **Übungsbibliothek mit Muskelkarte**: „Click on the 'Exercises' tab in the bottom navigation bar. Select the muscle of interest. This will show you all exercises that work the selected muscle (even ones outside of your personal program)" (HC-G); „human body diagram where users can tap specific muscles to see relevant exercises" (SD 06:28); seit 3.4.2 in der „plus zone or settings" (AS). Verifiziert. Textsuche oder Filter nicht belegt.
- **Videodemonstrationen pro Übung**: „every workout includes a video demonstration" (REV), eingebettete Demos (SD 12:38). Verifiziert.
- **Vorgegebene Sätze und Rep-Bereiche**, feste Satzanzahl: „doesn't allow you the option to add sets", „fixed set amount" (REV). Verifiziert als Einschränkung.
- **Drop-Sets**: „Refined dropsets" (AS 3.1.7); Website-Workouts mit Drop-Set nach 15 s Pause (WEB). Verifiziert.
- **Smart Weight Suggestion**: „tells you what weight you should be doing for a certain exercise based on how many reps you recently completed with certain weights" (HC-G); Landingpage: „automatically notify you when it's time to move up in weight for each exercise" (WEB). Verifiziert.
- **Übungsreihenfolge erzwungen**: „You cannot 'check off' an exercise until the one prior is done" (REV). Verifiziert (Rezensionen).
- **Eigene Übungen, eigener Trainingsplan-Builder, Supersätze, Aufwärmsätze**: nicht belegt.

### C. Aktive Trainingseinheit

- **Ablauf**: Training des Tages von Home starten (Workout-Karte, „View all" oben rechts), „log reps and weight after each set", dann „complete workout" zum Speichern (HC-G, SD 13:04). Verifiziert.
- **Vorherige Leistungswerte**: Entwicklerantwort „the app now shows you how many reps you did before"; Rezension: Update zeigt „previously logged reps". Ältere Rezension: „It won't show you what weights you've recorded in the past". Verifiziert, mit Historie.
- **Gewichtsauswahl** verbessert (AS 3.1.6). Verifiziert.
- **Pausentimer und Übungstimer**, seit 3.1.6 auch im Hintergrund (AS). Pausentimer-Screen zeigt laut SD (13:18) nicht die nächste Übung. Verifiziert.
- **Trainingszusammenfassung** nach Abschluss: „quantifies the effort (exercises, calories, sets)" (SD 14:40). Verifiziert. Kalorienschätzung also vorhanden.
- **Teilen** von Ergebnissen auf Social Media (AS 3.1.5, 3.2.1, 3.4.6). Verifiziert.
- **Manuelle Workouts** protokollieren (AS 3.4.11). Felder (Dauer, Kalorien, Typ) nicht belegt.
- **Datenverlust durch Abstürze**: Rezensionen berichten von Abstürzen mit Verlust der Eingaben und von nicht als abgeschlossen gespeicherten Workouts. Verifiziert (Rezensionen). Für uns eine zentrale Anforderung an Persistenz.
- **Unterbrechen und Fortsetzen**, Notizen, RPE, Tempo: nicht belegt.

### D. Trainingshistorie und Analyse

- **Historie bleibt gespeichert**: „all meal and workout history will be saved" (HC-G). Verifiziert.
- **Rep- und Gewichtsfortschritt**: „track and visualize your rep & weight progress" (AS). Verifiziert als Anspruch; Rezensionen wünschen sich dennoch „a graph of your lifting weight progress throughout time" und bemängeln fehlende Wochenübersicht. Umfang unklar.
- **Streaks** (AS 3.2.0). Regeln (Ruhetage, Unterbrechung) nicht belegt.
- **Trainingskalender, persönliche Bestleistungen, Volumen- und Frequenzstatistiken**: nicht belegt.

### E. Ernährung

- **Berechnete Tagesziele** für Kalorien und Makros: „Calculated, customized daily macro-nutrient goals" (HC-G); Basis „dietary preferences, age, weight and fitness goal" (GP). Hilfeartikel „How are my calories/macros calculated?" existiert (HC-Z), Inhalt nicht abrufbar. Verifiziert; Formel unbekannt.
- **Tagesübersicht**: Kalorien-Widget auf Home (AS 3.1.5), „clearer daily targets" (AS 3.5.0), „daily calories and macros breakdown" (GP). Verifiziert.
- **Vorgeschlagene Mahlzeiten** passend zu Präferenzen: „Meal suggestions to reach those goals, that abide by your dietary preferences" (HC-G); „switch meals, log them, or even manually add new food items with detailed nutritional info" (SD 05:54). Verifiziert. Rezensionen: Vorschläge zu ähnlich, nur wenige Diätoptionen.
- **Mahlzeit protokollieren mit Portionsanteil**: „Under 'Number of servings' enter what portion of the meal you ate. For example, if you ate 3/4 of a chicken sandwich, you would enter '0.75'" (HC-G). Verifiziert.
- **Lebensmittel hinzufügen**: „From any of the 4 main screens, click the blue '+' sign in the bottom-middle portion of the screen. Click 'Add food item.' Depending if the food you ate was homemade, from a restaurant, or has a scannable barcode, you can choose which" (HC-G). Verifiziert, historisch.
- **Barcode-Scanning** (REV mehrfach, AS 3.5.0). Verifiziert.
- **Datenbanksuche**: vorhanden, aber „common brands don't usually load when you look them up"; „you can input the serving size and how many servings you had", laut anderer Rezension nicht beides gleichzeitig (REV). Verifiziert mit Qualitätsvorbehalt.
- **Automatische Neuberechnung** der Nährwerte bei Mahlzeitänderung (AS 3.1.7). Verifiziert.
- **Favoriten, gespeicherte eigene Mahlzeiten**: von Nutzern gewünscht, Existenz nicht belegt.
- **Wassertracking**: nur als tägliche Aufgabe in Challenges (TC), kein eigenständiger Tracker belegt.
- **Snap Meal (Fotoerkennung)**: nur MWM. Nicht verifiziert.

### F. Rezepte und Mahlzeitenplanung (ab 3.5.0)

- „Answer a few quick questions and get a weekly meal plan built around your calorie target - Make it yours: swap recipes, pick your cooking days, and choose which meals [die Referenz-App] plans - Get a grocery list generated from your confirmed week" (AS 3.5.0). Verifiziert.
- „browse the new recipe catalog by meal time, cuisine, difficulty and more" (AS 3.5.0). Verifiziert.
- Rezepte mit Anleitung: „all of the recipes and instructions" (AS), „meals and how to cook them" (REV). Verifiziert. Felder wie Portionen, Zubereitungszeit nicht belegt.
- Einkaufsliste „easier to read and shop from" (AS 3.5.1). Kategorien, Abhaken, manuelle Bearbeitung, Mengenaggregation: nicht belegt.
- Eigene Rezepte, Portionsskalierung: nicht belegt.

### G. Körper und Fortschritt

- **Gewicht im Onboarding**, Ziel „watch the weight come off" (GP). Ein Körpergewichtsverlauf mit „current, heaviest, and lightest weights with a detailed graph" wird nur von MWM behauptet. Nicht verifiziert.
- **Fortschrittsfotos**: Rezension erwähnt „progress photo library"; Challenge-Bedingungen verlangen Front-, Seiten- und Rückenfotos und deren Einreichung über die App (REV, TC). Teilweise verifiziert.
- **Körpermaße, Körperfett, Wochen-/Monatsauswertungen, Notizen**: nicht belegt.

### H. Aktivität und Gewohnheiten

- **Schritte**: Website „Track workouts, steps, calories, and overall fitness progress" (WEB). Quelle der Schrittdaten (Health-Integration oder manuell) nicht belegt. Agentur-Fallstudie: „integrated with your wearable devices" (DT). Rezension: andere Apps „sync with your Apple Watch or sync with your health fitness app" seien einfacher, Entwickler „working on better integrations". Status unklar.
- **Tägliche Aufgaben in Challenges**: „[Die Referenz-App] also helps keep track of tasks to be done daily while doing the challenge, such as drinking enough water, reading a book, walking enough steps, and following your suggested diet" (TC). Verifiziert, aber an Challenges gebunden.
- **Streaks** (siehe D). Verifiziert.
- **Erinnerungen** (siehe A). Verifiziert.
- **Gewohnheiten außerhalb von Challenges, Kalender, Aktivitätsziele**: nicht belegt.

### I. Weitere Bereiche

- **Challenges**: zeitlich begrenzte Programme (30, 75, 90 Tage) mit Workouts und Ernährung, Teilnahme über die App bei aktivem Abo, Fotoeinreichung, Gewinnerauswahl nach „most significant physical change"; eine Rezension erwähnt „top 5 of the competition" (TC, REV). Verifiziert. In-App-Leaderboard nicht belegt.
- **Home-Dashboard**: Workout-Karte des Tages (z. B. „back and biceps") und Kalorienziel-Tracker (SD); blaue „+"-Schaltfläche unten Mitte als Schnellzugriff („plus zone") für Lebensmittel und Übungsseite (HC-G, AS 3.4.2). Verifiziert.
- **Navigation**: „4 main screens" mit unterer Tab-Leiste, historisch ein „Exercises"-Tab (HC-G). Aktuelle Tab-Namen nicht belegt.
- **Community** über Discord, extern (DC, REV). Verifiziert.
- **Shop, Supplements, Coaching-Produkte, PDF-Guides**: Teil des Geschäftsmodells der Referenz-App (WEB). Verifiziert, nicht relevant.

## 6. Historische oder möglicherweise veraltete Befunde

- Hilfeartikel des Gorgias-Centers sind teils zwei Jahre alt (Navigationspfade, Exercises-Tab, 4 Hauptscreens). Seit 3.4.5 wurde die Home-UI überarbeitet, seit 3.4.2 liegt die Übungsseite in der Plus-Zone oder den Einstellungen.
- Rezensionen zu fehlender Flexibilität (Ruhetage, Reihenfolge, Vorschau) stammen überwiegend aus 2024/2025. „Swap Workouts" (SD) deutet auf spätere Verbesserungen hin.
- Preise aus dem Hilfecenter sind datiert; Drittlistings zeigen abweichende Preise.
- Ältere Rezension: keine Anzeige vergangener Gewichte; spätere Entwicklerantwort: vorherige Reps werden angezeigt.

## 7. Plausible, aber nicht bestätigte Annahmen

- Körpergröße, Trainingshäufigkeit und Aktivitätslevel werden im Quiz abgefragt (nötig für Kalorienberechnung und Programmwahl).
- Mahlzeiten-Slots Frühstück, Mittag, Abendessen, eventuell Snacks (Rezensionen nennen die ersten drei).
- Die Einkaufsliste aggregiert Mengen gleicher Zutaten und ist nach Kategorien gegliedert („easier to read and shop from").
- Ein Körpergewichtsverlauf existiert (MWM); Fortschrittsfotos können in der App hochgeladen werden.
- Die Kalorienschätzung pro Workout basiert auf Dauer, Körpergewicht und einem MET-ähnlichen Faktor.
- Tab-Leiste mit Home, Training, Ernährung und Profil/Progress.

## 8. Nicht verifizierte Funktionen (nur Drittquellen oder Behauptungen)

- Snap Meal: Fotoerkennung von Mahlzeiten mit Kalorien- und Makroschätzung (MWM).
- Körpergewichtsgraph mit aktuellem, höchstem und niedrigstem Gewicht (MWM).
- Wearable- oder Apple-Health-Integration (DT, Marketing „steps").
- Apple-Watch-App.
- In-App-Leaderboard für Challenges.
- Favoriten, gespeicherte Mahlzeiten, eigene Rezepte, Portionsskalierung.
- Wassertracker außerhalb von Challenges.
- Trainingskalender, persönliche Bestleistungen, Volumenstatistiken.
- Supersätze, Aufwärmsätze, RPE, Tempo, Notizen.
- Unterbrechen und Fortsetzen eines Trainings nach App-Neustart.
- Sprachen der App (vermutlich nur Englisch; nicht belegt).

## 9. Muster aus Nutzerfeedback und Konsequenzen für unser Produkt

Die Beobachtungen geben den Stand der jeweiligen Rezension wieder. Sie werden als Verbesserungsziele genutzt, nicht als Behauptung über die aktuelle Version der Referenz-App.

| Beobachtung (REV) | Konsequenz für unsere Anforderungen |
|---|---|
| Abstürze mit Verlust der Trainingseingaben | Jede Satzeingabe wird sofort lokal persistiert; laufendes Training ist nach Neustart wiederherstellbar (P0) |
| Feste Satzanzahl, keine Sätze hinzufügbar | Sätze pro Übung frei ergänzen, entfernen, überspringen (P0) |
| Ruhetage nicht verschiebbar, keine Vorschau | Flexible Wochenplanung, Vorschau aller Tage, Nachholen und Verschieben (P1) |
| Übungen erst nach Abschluss der vorherigen abhakbar | Freie Reihenfolge, Supersätze optional (P1) |
| Keine Verlaufsgraphen pro Übung | Übungsverlauf (Gewicht, e1RM, Volumen) als Diagramm aus echten Daten (P1) |
| Lebensmitteldatenbank lückenhaft, Marken fehlen | Eigene Lebensmittel, Favoriten, Wiederverwendung, offene Datenquellen mit Barcode (P1) |
| Portion entweder Größe oder Anzahl | Menge in Gramm und Portionen kombinierbar (P1) |
| Vorschläge zu ähnlich, wenige Diätoptionen | Rezeptkatalog mit eigenen Rezepten, Tags, Filter; Präferenzen frei definierbar (P2) |
| Preis und Abo | Kein Abo, keine Paywall, keine Telemetrie an Dritte |

## 10. Technische Erkenntnisse aus der Recherche

- Die Referenz-App ist eine native Flutter-App mit eigenem Backend (Postgres, NestJS, AWS). Funktionen wie Hintergrund-Timer, Push-Erinnerungen, Kamera-Barcode und Social Sharing sind nativ gelöst. Unsere Web-App muss diese Punkte im Rahmen der Browser-Möglichkeiten lösen (siehe `known-limitations.md`).
- Die Inhalte der Referenz-App (Programme, Videos, Rezepte, Lebensmitteldaten) sind proprietär. Wir benötigen eigene oder offen lizenzierte Quellen: Übungsdaten (z. B. free-exercise-db, Public Domain; wger, CC-BY-SA), Lebensmittel (Open Food Facts, ODbL; USDA FoodData Central, Public Domain), eigene Rezepte und Pläne.

## 11. Benötigte Screenshots und Bildschirmaufnahmen

Priorität A (für die Kernfunktionen der Phasen 4 und 5):

1. Home/Heute-Screen mit Workout-Karte, Kalorien-Widget und „+"-Schaltfläche; außerdem das geöffnete „+"-Menü (Plus-Zone).
2. Wochen- oder Programmansicht der Workouts, inklusive Ruhetagen und „Swap Workouts" (Drag and Drop).
3. Programmdetailseite und der Ablauf „Change workout plan" (Zielabfrage, Programmauswahl).
4. Trainingsplayer: Übungsansicht mit Video, Satzliste, Gewichts- und Wiederholungseingabe, Anzeige vorheriger Werte, Smart Weight Suggestion.
5. Pausentimer-Screen und Übungstimer.
6. Übung austauschen (Alternativen) während des Trainings.
7. Trainingszusammenfassung nach „complete workout" und der Teilen-Dialog.
8. Manuelles Workout protokollieren (alle Felder).
9. Übungsbibliothek mit Muskelkarte, Übungsliste, Übungsdetail.
10. Ernährung Tagesansicht: Mahlzeiten-Slots, Zielbalken, protokollierte Einträge.
11. Mahlzeit protokollieren (Portionsanteil), Mahlzeit wechseln.
12. „Add food item": Auswahl homemade, restaurant, barcode; Suchergebnisse; Portionsauswahl; manuelle Nährwerteingabe.
13. Barcode-Scanner und Ergebnis.
14. Wochen-Mahlzeitenplaner: Fragen, generierte Woche, Rezept tauschen, Kochtage, Woche bestätigen.
15. Rezeptkatalog mit Filtern und ein Rezeptdetail.
16. Einkaufsliste (Struktur, Kategorien, Abhaken, Bearbeiten).

Priorität B (für die Phasen 6 bis 9):

17. Alle Fortschrittsansichten: Gewicht, Graphen, Fotos, Streak-Anzeige.
18. Challenges: Übersicht, Beitritt, tägliche Aufgabenliste, Fotoeinreichung, Rangliste.
19. Schritte oder Aktivitätsanzeige und eventuelle Health- oder Wearable-Berechtigungsdialoge.
20. Profil & Einstellungen: alle Tabs, Einheiten, Benachrichtigungen, Ernährungspräferenzen, Ziel ändern, Konto.
21. Historie: vergangene Workouts (Detail), vergangene Ernährungstage.
22. Onboarding-Quiz: Bildschirmaufnahme aller 19 Schritte inklusive Zielwarnung.

Bildschirmaufnahmen (besonders wertvoll): ein komplettes Training von Start bis Zusammenfassung; ein ganzer Ernährungstag inklusive Barcode-Scan; Wochenplan erstellen bis Einkaufsliste.

Hinweis: Screenshots dienen nur dem Verständnis der Workflows. Gestaltung und Inhalte werden nicht kopiert.

## 12. Offene Fragen an den Produktinhaber

Siehe `decisions.md`, Abschnitt „Offene Produktentscheidungen". Die wichtigsten: eigene Programme vs. Programm-Builder, Datenquellen für Übungen und Lebensmittel, Umfang des MVP, Sync-Zeitpunkt, Umgang mit Fotos und Schritten, UI-Sprache, Zielgeräte und Browser, Hosting.

## 13. Nachtrag 18.10.2026: Primärmaterial des Produktinhabers und ergänzende Recherche

**Primärmaterial.** Der Produktinhaber hat am 18.10.2026 drei Bildschirmaufnahmen seiner Referenz-App (Fortschritt, Ernährung, Trainingsplayer), acht Aufnahmen von Programm C und zwei Screenshots (Daily Challenges, Program Progress) bereitgestellt. Auswertung mit Zeitstempeln in `reference-analysis.md`; das Programm in `winterprogramm-2026.md`. Damit sind die Abläufe des Players, der Ernährungs-Tagesansicht und der Fortschrittsseite erstmals aus erster Hand belegt (Stufe „gesehen“); frühere Angaben in den Abschnitten 5 bis 8 bleiben als Sekundärbelege stehen.

**Ergänzende Websuche (Abruf 18.10.2026).** Direkte Seitenabrufe scheiterten in dieser Sitzung an der Namensauflösung (`apps.apple.com`, `play.google.com`, Website der Referenz-App, `openfoodfacts.github.io`, `pacompendium.com`); verfügbar waren nur Suchausschnitte. Kennzeichnung: **O** offiziell bestätigt (Ausschnitt einer offiziellen Seite), **U** unverifiziert, **A** abgeleitet, **E** eigener Vorschlag.

| Thema | Befund | Quelle (Websuche, 18.10.2026) | Stufe |
|---|---|---|---|
| Programm C | Keine öffentliche Seite mit Übungsliste, Satzschema oder Trainingstagen; Treffer nur zu Marketing und Challenge-Bedingungen | Suche „Name der Referenz-App und des Programms“ | A: die Aufnahme ist die einzige Quelle |
| Nutzerfeedback zur Referenz-App | Rezensionsaggregatoren berichten weiterhin Abstürze und verlorene Trainingsdaten | Rezensionsseiten (REV) | U: zeitabhängig, nicht nachprüfbar |
| Open Food Facts Limits | 15 Produktabfragen und 10 Suchanfragen je Minute und IP; eigener User-Agent erbeten; Lizenz ODbL mit Namensnennung und Share-Alike | API-Dokumentation (Ausschnitte) | O: deckt sich mit `data-sources.md` Abschnitt 3.1 |
| MET-Werte | Adult Compendium 2024: 02050 Krafttraining kräftig 6,0; 02052 Kniebeuge/Kreuzheben 5,0; 02054 mehrere Übungen 8–15 Wdh. 3,5; 02056 Körpergewicht allgemein 3,0; 02057 hochintensiv 6,5 | Suchausschnitte zu pacompendium.com | O mit Vorbehalt: Seite nicht abrufbar, vor Umsetzung prüfen |
| free-exercise-db | Unlicense, über 800 Übungen mit Bildern (JSON auf GitHub) | GitHub-Suchausschnitt | O mit Vorbehalt: Lizenzdatei prüfen |
| wger | Lizenz je Datensatz (CC-Varianten), keine pauschale Freigabe | wger-Dokumentation | O |

**Folgen für die Planung:** `evolution-plan.md` (Schritte A bis H), Rückfragen Q-13 bis Q-18 in `decisions.md`.

