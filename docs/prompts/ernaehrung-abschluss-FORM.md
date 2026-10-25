# FORM · Ernährung – Abschluss vor dem Merge

> **Dieser Auftrag ersetzt alle noch offenen Ernährungs-Anweisungen, auch das einmalige Nachfragen beim Stückgewicht.** Branch `form-ernaehrung`, PR #51. Es gelten `CLAUDE.md`, `form-markenleitplanken.md`, `brand-tokens.md` und die freigegebene `docs/lebensmittel-auswahl.csv`. Ein Commit je Abschnitt mit D-Nummer, nach jedem Abschnitt Tests, sofort pushen. Keine Nachkontrollen planen; gemergt wird nach meiner Freigabe.

## 1. „Weitere Nährwerte“ kompakt

Je Zeile nur Name und „Ist / Referenz g“: „Salz 0,3 / 6 g“, „Zucker 9,6 / 90 g“, „Gesättigte Fettsäuren 5,4 / 20 g“, „Ballaststoffe 6,6 / 30 g“.

- Ohne „von höchstens“ und „von mindestens“, ohne Erklärzeilen unter den Werten, ohne den Absatz zu den Referenzmengen und ohne die Hinweise zu fehlenden Werten.
- Jede Zeile einzeilig; wird es auf 360 pt zu eng, heißt es „Ges. Fettsäuren“.
- Die Erklärung samt Quellen liegt hinter einem kleinen Info-Symbol neben der Überschrift und öffnet sich als Blatt.
- Fehlen bei einem Wert Angaben einzelner Einträge, steht hinter der Zahl ein Sternchen; erklärt wird es im selben Blatt.

## 2. Nährwerttabelle im Lebensmittel-Blatt einzeilig

- Spaltenköpfe und Werte immer in einer Zeile („je 100 g“, „284 kcal“), feste Spaltenbreite, Zahlen rechtsbündig.
- Die zweite Spalte „für x g“ bzw. „für x Stück“ erscheint nur, wenn die Menge nicht 100 g ist.

## 3. Stückgewichte als Richtwerte, schon vorausgewählt

Ich will beim Eintragen nicht nach dem Gewicht gefragt werden. Bei Grundnahrungsmitteln mit ziemlich gleichmäßiger Größe ist das Stückgewicht schon hinterlegt und vorausgewählt.

**Welche Lebensmittel:** Ausgangsliste – erweitere sie um vergleichbare, streiche, was zu stark schwankt: Apfel, Birne, Banane, Orange, Mandarine, Clementine, Kiwi, Pfirsich, Nektarine, Marille, Zwetschke, Zitrone, Limette, Avocado, Mango, Ei, Semmel, Weckerl, Laugengebäck, Paradeiser (mittel), Paprika, Gurke, Zwiebel, Knoblauch (Zehe), Karotte, Erdapfel (mittel), Kohlrabi, Datteln, Reiswaffeln. Zusätzlich die Einheit „Scheibe“, wo sie üblich ist: Schwarzbrot, Mischbrot, Vollkornbrot, Toastbrot, Vollkorntoast, Knäckebrot, Schnittkäse wie Gouda, Emmentaler, Bergkäse und Trappistenkäse, Kochschinken.

**Werte:**

- Typische mittlere Größe, wie man sie in Österreich kauft – keine US-Größen.
- Immer der essbare Anteil: Banane ohne Schale, Orange ohne Schale, Apfel ohne Kerngehäuse, Marille ohne Kern; die Nährwerte des BLS gelten für den essbaren Anteil.
- Herleitung je Eintrag dokumentieren, in dieser Reihenfolge: Angaben aus dem BLS oder seiner Dokumentation; Größenklassen der EU-Vermarktungsnormen bzw. des Österreichischen Lebensmittelbuchs; anerkannte europäische Nährwert- oder Portionstabellen. USDA-Werte nur zum Gegenprüfen, nicht übernehmen.
- In der CSV die Spalten Einheit (Stück oder Scheibe), Stückgewicht in g und Herkunft ergänzen; in der App als „Richtwert“ gekennzeichnet.

**In der App:**

- Hat ein Lebensmittel einen Richtwert, ist „Stück“ (bzw. „Scheibe“) mit Menge 1 vorausgewählt, angezeigt als „1 Stück · ca. 150 g“. Ein Tipp auf „Hinzufügen“ genügt.
- Die Menge lässt sich mit + und − in ganzen und halben Stück ändern; „Gramm“ bleibt jederzeit wählbar.
- Über „Gewicht anpassen“ kann ich den Richtwert für mich ändern; die App merkt sich meinen Wert (wie bisher in den Einstellungen) und zeigt ihn statt des Richtwerts. Zurücksetzen auf den Richtwert ist möglich.
- Hat ein Lebensmittel keinen Richtwert, gibt es nur Gramm – keine Einheit „Stück“ und keine Nachfrage. Das einmalige Nachfragen entfällt vollständig.

## 4. Quellenangabe des BLS

Steht in meiner Nachricht ein Wortlaut für die Quellenangabe, übernimm ihn in „Über die App“, `docs/licenses-data.md` und unter den Nährwerttabellen. Steht dort keiner, bleibt die Zitierweise mit DOI aus der Dokumentation.

## 5. Tests und Abschluss

- Apfel öffnen: „1 Stück · ca. … g“ ist vorausgewählt, mit einem Tipp hinzugefügt; nach „Gewicht anpassen“ zeigt der nächste Apfel meinen Wert.
- Zwei Eier: Menge 2, 2 × 51 g. Banane: essbarer Anteil. Ein Lebensmittel ohne Richtwert, zum Beispiel Kürbis: nur Gramm, keine Nachfrage.
- Suche mit halben Wörtern („Erdäp“, „Parad“) und den zehn Suchbegriffen aus dem ersten Auftrag; offline; Wischen zum Löschen.
- „Weitere Nährwerte“ und die Nährwerttabelle auf 360 und 390 pt einzeilig; Feta mit 100 g zeigt eine Spalte, mit 150 g zwei.
- Screenshots: „Weitere Nährwerte“ aufgeklappt, Apfel mit vorausgewähltem Stück, Feta mit 100 g und mit 150 g, das Info-Blatt; Übersicht und Zip neu erzeugen.
- `pnpm format:check`, `lint`, `typecheck`, `check:docs`, `test`, `build`, `check:bundle` (Startansicht unter 250 KB), E2E Chromium lokal, WebKit in der CI.
- Bericht mit der Liste aller Richtwerte und ihrer Herleitung; danach pushen und stoppen.
