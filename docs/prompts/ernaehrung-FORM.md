# FORM · Sitzung Ernährung – neuer Gesamtauftrag

> **Dieser Auftrag ersetzt den bisherigen Ernährungs-Auftrag vollständig.** Branch `form-ernaehrung` mit Entwurfs-PR; `form-ernaehrung` ist in `CLAUDE.md` die aktuelle Phase. Es gelten `CLAUDE.md`, `form-markenleitplanken.md` und `brand-tokens.md`; Makrofarben, Ring und Karten sind festgelegt und bleiben unverändert. Neue Tabellen schränken ihre Rechte in der Migration selbst ein (`supabase/README.md`). Keine Nährwerte erfinden – jede Zahl hat eine Quelle. Texte in der Du-Form, Werte als allgemeine Referenz, nie als medizinische Vorgabe, keine Verbrennungs- oder Defizitsprache. Startansicht bleibt unter 250 KB (aktuell 234,3 KB); Lebensmitteldaten werden nachgeladen. Ein Commit je Abschnitt mit D-Nummer, nach jedem Abschnitt Tests, sofort pushen. Keine Nachkontrollen planen.

## 0. Stand prüfen und umsteuern

Prüfe, was auf `form-ernaehrung` bereits gemacht wurde. Die Übernahme der USDA-Daten als Hauptquelle entfällt: Was davon schon eingebaut ist, nimmst du wieder heraus. Was unabhängig von der Quelle nützlich ist, behältst du – zum Beispiel Suchnormalisierung, Umrechnungsfunktionen, Tests. Halte im Bericht fest, was du behalten und was du zurückgenommen hast.

## 1. Warum die Suche heute nichts findet

„Apfel“, „Eier“ oder „Tomaten“ liefern keine brauchbaren Treffer. Ursache belegen: Datenquelle, Laden, Suchindex und Filter, Groß- und Kleinschreibung, Umlaute (ä/ae), Singular und Plural (Tomate/Tomaten, Ei/Eier, Apfel/Äpfel), Synonyme. Open Food Facts ist produktbezogen und deckt lose Lebensmittel schlecht ab. Behebe die Suchlogik so, dass sie für jede Datenquelle funktioniert; bei allgemeinen Begriffen stehen lose Lebensmittel vor Markenprodukten. Keine vorgetäuschten Treffer.

## 2. Datenquelle: kuratierte Auswahl aus dem BLS

**Hauptquelle ist der Bundeslebensmittelschlüssel (BLS) 4.0** des Max Rubner-Instituts – aber nicht als Ganzes. Die vielen deutschen Produkte, Gerichte und Varianten will ich nicht in der App.

- **Feste Auswahlliste statt Filter:** nur Grundnahrungsmittel – Obst, Gemüse, Erdäpfel, Hülsenfrüchte, Getreide und einfache Getreideprodukte (Reis, Nudeln, Haferflocken, Mehl, einfache Brotsorten wie Schwarzbrot, Vollkornbrot, Semmel), Eier, Milch und Milchprodukte, Fleisch, Geflügel, Fisch, Nüsse und Samen, Öle und Fette. Keine Gerichte, keine Wurst- und Fertigprodukte, keine regionalen deutschen Spezialitäten.
- **Ein Eintrag je Lebensmittel**, roh; zusätzlich nur Zubereitungen, die man so isst und die deutlich andere Werte haben (z. B. Reis gekocht, Nudeln gekocht, Erdäpfel gekocht). Keine Varianten wie „geschält“, „gedünstet“, „tiefgefroren“, außer sie sind üblich.
- **Österreichische Bezeichnung als Anzeigename**, die bundesdeutsche als Suchbegriff: Paradeiser, Erdäpfel, Karfiol, Marillen, Ribisel, Fisolen, Melanzani, Kohlsprossen, Zwetschken, Kren, Topfen, Obers, Schlagobers, Faschiertes, Semmel, Germ und weitere.
- **Stückgewichte für hiesige Größen** (z. B. Apfel mittel, Ei Größe M), aus der Quelle oder mit dokumentierter Herkunft; in der App sichtbar und änderbar.
- **Europäische Rechenregeln:** Prüfe, ob der BLS Kohlenhydrate ohne Ballaststoffe, Energie mit den EU-Faktoren (4/4/9, Ballaststoffe 2 kcal je g) und Salz angibt; wo nicht, umrechnen (Salz = Natrium × 2,5).
- **Lücken:** Was in Österreich Grundnahrungsmittel ist, aber im BLS fehlt, wird in der Liste als fehlend markiert. Nur dafür USDA (umgerechnet nach den Regeln oben, als USDA gekennzeichnet) oder ein eigener Eintrag mit Quelle.
- **Nutzungsbedingungen** von BLS 4.0 (und gegebenenfalls USDA) prüfen und in `docs/licenses-data.md` festhalten; Quellenangabe je Eintrag und in „Über die App“.

**Die Liste zuerst zur Durchsicht:** Lege sie als `docs/lebensmittel-auswahl.csv` an – Spalten: Anzeigename, Suchbegriffe, Gruppe, Zubereitung, BLS-Code, BLS-Bezeichnung, Stückgewicht (g), Herkunft des Stückgewichts, Quelle –, mit etwa 300 bis 400 Einträgen, sortiert nach Gruppe. Dazu eine kurze Zusammenfassung: Anzahl je Gruppe, fehlende Lebensmittel, offene Fragen. **Die Liste wird erst nach meiner Freigabe in die App eingebaut.**

## 3. Weitere Nährstoffe: Salz, Zucker, gesättigte Fettsäuren, Ballaststoffe

In der Ernährungsübersicht als Ist/Referenz, z. B. „4 g von höchstens 6 g“. Ausgangspunkte zum Prüfen und Belegen:
- Referenzmengen der EU-Lebensmittelinformationsverordnung (VO (EU) 1169/2011, Anhang XIII) für Erwachsene: Zucker 90 g (Gesamtzucker), gesättigte Fettsäuren 20 g, Salz 6 g – Referenzmengen, keine Ziele.
- Ballaststoffe: Richtwert der DGE mindestens 30 g pro Tag.
- Freier bzw. zugesetzter Zucker (WHO und DGE: weniger als 10 % der Energie) nur, wenn die Daten ihn vom natürlich enthaltenen unterscheiden; sonst die Einschränkung nennen.

„Höchstens“ für Salz, gesättigte Fettsäuren und Zucker – ohne Lob fürs Erreichen; „mindestens“ für Ballaststoffe. Kurze Erklärung je Wert mit Quelle. Fehlende Angaben einzelner Einträge sichtbar machen, nicht als 0 zählen. Dieser Abschnitt hängt nicht an der Auswahlliste und wird gleich umgesetzt.

## 4. Einkaufsliste: Wischen zum Löschen

Einzelne Artikel lassen sich mit einem Wisch nach links löschen, ohne vorher den Bearbeiten-Modus zu öffnen. Dezente, eindeutige Löschaktion; nur dieser Artikel wird entfernt; senkrechtes Scrollen bleibt ungestört, ein kurzer oder schräger Wisch löst nichts aus; danach ein Hinweis mit „Rückgängig“ wie bei den übrigen Löschaktionen. Für Tastatur und Screenreader bleibt der bestehende Weg zum Löschen. Mit Pointer-Ereignissen, ohne neue Abhängigkeit. Auch dieser Abschnitt hängt nicht an der Auswahlliste.

## 5. Reihenfolge und Halt

Arbeite 0, 1, 2 (bis zur fertigen CSV), 3 und 4 ab, jeweils mit Tests und Commit. **Dann stoppe** und gib mir: die CSV, die Zusammenfassung aus Abschnitt 2 und den Bericht zu 0, 1, 3 und 4. Nach meiner Freigabe der Liste folgt Abschnitt 6.

## 6. Nach der Freigabe: Einbau der Auswahl

Die freigegebene Liste als nachgeladene Datei einbauen, mit Suche, Stückgewichten und Quellenangaben. Ablauf in möglichst wenigen Tipps: suchen → Ergebnis wählen → Menge in g oder Stück → Nährwerte prüfen → hinzufügen.

**Tests:** Suche nach Apfel, Äpfel, Aepfel, Ei, Eier, Tomate, Tomaten, Paradeiser, Erdäpfel, Topfen; Hinzufügen mit korrekten Nährwerten; Makro-Ring und die neuen Nährstoffe aktualisieren sich sofort; offline; Wischen zum Löschen mit Rückgängig und ohne Störung des Scrollens; Lizenzliste vollständig; Startansicht unter 250 KB; `pnpm format:check`, `lint`, `typecheck`, `check:docs`, `test`, `build`, `check:bundle`, E2E Chromium lokal, WebKit in der CI. Bericht wie gewohnt; danach pushen und stoppen.
