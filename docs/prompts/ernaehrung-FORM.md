# FORM · Sitzung Ernährung – Grundnahrungsmittel, Suche und weitere Nährstoffe

> **Stand:** FORM ist live, die Phasen Rebranding und Stabilität sind gemergt. Makrofarben, Ring und Karten sind festgelegt (`brand-tokens.md`); daran ändert diese Sitzung nichts.
>
> **Vorbemerkung.** Eigener Branch von `main` (`form-ernaehrung`) mit Entwurfs-PR; `form-ernaehrung` in `CLAUDE.md` als aktuelle Phase eintragen. Neue Tabellen schränken ihre Rechte in der Migration selbst ein (`supabase/README.md`). Keine Nachkontrollen planen. Es gelten `CLAUDE.md`, `form-markenleitplanken.md`, `brand-tokens.md`. Startansicht bleibt unter 250 KB – Lebensmitteldaten werden nachgeladen, nie ins Startbündel. Keine Nährwerte erfinden; jede Zahl hat eine Quelle. Texte in der Du-Form, Werte als allgemeine Referenz, nie als medizinische Vorgabe; keine Defizit- oder Verbrennungssprache.

## 1. Grundnahrungsmittel verfügbar machen

Heute findet die Suche „Apfel“, „Eier“ oder „Tomaten“ keine brauchbaren Ergebnisse. Das ist ein grundlegendes Problem für den Ernährungstracker.

Mindestens auffindbar und protokollierbar: Obst (Apfel, Banane, Orange, Beeren …), Gemüse (Tomaten, Gurken, Paprika, Karotten, Brokkoli …), Eiweißquellen (Eier, Hähnchen, Rind, Fisch …), Milchprodukte und Alternativen, Getreide, Reis, Kartoffeln, Hülsenfrüchte, Nüsse, Samen, Öle und Fette. Beispielhafte Mindestliste, nicht abschließend.

## 2. Ursache der fehlenden Treffer

Untersuche Datenquelle, Initialisierung und Laden, Suchindex und Filter, deutsche Bezeichnungen und Synonyme, Groß-/Kleinschreibung, Umlaute (ä/ae), Singular und Plural (Tomate/Tomaten, Ei/Eier), lokale Speicherung, Synchronisierung, Verhalten bei langsamer oder fehlender Quelle. Vermutung zum Prüfen: Open Food Facts ist produktbezogen (Barcodes, Marken) und deckt lose Lebensmittel schlecht ab. Keine hartcodierten Scheintreffer.

## 3. Datenquelle

Prüfe zuerst, was im Projekt vorhanden ist. Für lose Lebensmittel eine verlässliche Nährwerttabelle pro 100 g, lokal als nachgeladene Datei gebündelt (offline nutzbar). Kandidaten, deren Nutzungsbedingungen, Namensnennung und Kosten du vor der Verwendung prüfst und dokumentierst: Schweizer Nährwertdatenbank (deutsche Bezeichnungen), USDA FoodData Central (Foundation/SR Legacy, englisch – Übersetzung nötig), Bundeslebensmittelschlüssel (deutsch, Lizenz klären). Open Food Facts bleibt für Barcodes und Markenprodukte.

Anforderungen: Angaben pro 100 g; Quelle je Eintrag sichtbar; roh, gekocht und zubereitet unterscheiden, wo die Werte deutlich abweichen; essbare Standardportionen (1 Apfel ≈ x g, 1 Ei ≈ y g – aus der Quelle, nicht geschätzt); keine Dubletten; bei generischen Begriffen lose Lebensmittel vor Markenprodukten. Lizenzliste in `docs/licenses-data.md`.

## 4. Suche und Eingabe

Ablauf in möglichst wenigen Tipps: suchen → Ergebnis wählen → Menge (g oder Portion) → Nährwerte prüfen → hinzufügen. Testen mit häufigen deutschen Begriffen und alternativen Schreibweisen.

## 5. Weitere Nährstoffe: Salz, Zucker, gesättigte Fettsäuren, Ballaststoffe

In der Ernährungsübersicht als Ist/Referenz, z. B. „4 g von höchstens 6 g“. Ausgangspunkte zum Prüfen und Belegen:
- Referenzmengen der EU-Lebensmittelinformationsverordnung (VO (EU) 1169/2011, Anhang XIII) für Erwachsene: Zucker 90 g (Gesamtzucker), gesättigte Fettsäuren 20 g, Salz 6 g – Referenzmengen, keine Ziele.
- Ballaststoffe: Richtwert der DGE mindestens 30 g pro Tag.
- Freie bzw. zugesetzte Zucker: WHO und DGE weniger als 10 % der Energiezufuhr – nur anzeigen, wenn die Daten freien Zucker vom natürlich enthaltenen unterscheiden. Wenn nicht, die Einschränkung nennen und keine Genauigkeit vortäuschen.

Darstellung: „höchstens“ für Salz, gesättigte Fettsäuren und Zucker – mit Annäherung, ohne Lob fürs Erreichen; „mindestens“ für Ballaststoffe. Kurze Erklärung je Wert über einen Info-Hinweis mit Quelle. Konsistent in Datenverarbeitung, Tagesübersicht und Wochenansicht. Fehlende Angaben bei einzelnen Einträgen sichtbar machen, nicht als 0 zählen.

## 6. Einkaufsliste: Wischen zum Löschen

Einzelne Artikel lassen sich mit einem Wisch nach links löschen, ohne vorher den Bearbeiten-Modus zu öffnen.
- Der Wisch zeigt eine dezente, eindeutige Löschaktion; nur dieser Artikel wird entfernt.
- Senkrechtes Scrollen bleibt ungestört; ein kurzer oder schräger Wisch löst nichts aus.
- Nach dem Löschen ein Hinweis mit „Rückgängig“ wie bei den übrigen Löschaktionen der App.
- Für Tastatur und Screenreader bleibt das Löschen über den bestehenden Weg erreichbar.
- Umsetzung mit Pointer-Ereignissen ohne neue Abhängigkeit; so, dass eine spätere native Umsetzung dasselbe Verhalten übernehmen kann.

## 7. Tests und Bericht

Suche nach Apfel, Ei, Eier, Tomate, Tomaten, Äpfel/Aepfel; Wischen zum Löschen mit Rückgängig und ohne Störung des Scrollens; Hinzufügen mit korrekten Nährwerten; Makro-Ring und neue Nährstoffe aktualisieren sich sofort; offline; Lizenzliste vollständig; Startansicht unter 250 KB. Bericht wie bisher.
