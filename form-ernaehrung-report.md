# Phase Ernährung – Bericht

Stand: 25.10.2026 · Branch `form-ernaehrung` (Basis `6612f17`, `main` nach PR #50), Entwurfs-PR #51 · Auftrag: `docs/prompts/ernaehrung-FORM.md` (neuer Gesamtauftrag vom 24.10.2026; er ersetzt den ersten Auftrag vollständig, der in `444d7f1` steht), seit 25.10.2026 abgeschlossen nach `docs/prompts/ernaehrung-abschluss-FORM.md` (ersetzt alle offenen Ernährungs-Anweisungen, auch die einmalige Frage nach dem Stückgewicht). Aufbau wie `form-stabilitaet-report.md`.

Regeln: Ein Commit je Abschnitt mit D-Nummer, nach jedem Abschnitt Tests, sofort pushen. Startansicht unter 250 KB, Lebensmitteldaten nur nachgeladen. Keine Nährwerte erfinden, jede Zahl hat eine Quelle. Texte nach `form-markenleitplanken.md`. Nur Getestetes gilt als fertig; Testergebnisse stehen wörtlich je Abschnitt. Reihenfolge laut Auftrag: 0, 1, 2 (bis zur fertigen CSV), 3, 4, dann Halt bis zur Freigabe der Liste; Abschnitt 6 (Einbau) erst danach.

---

## 1. Abschnitte

| Abschnitt | Ergebnis | Entscheidung | Stand |
|---|---|---|---|
| Phasenstart | CI auf `main` (Lauf 40119684695) grün geprüft, Branch und Entwurfs-PR, `CLAUDE.md` mit Phase und Regel für neue Tabellen | D-353 | erledigt |
| §0 Stand prüfen und umsteuern | Bestand aufgenommen; der lokal angefangene Einbau (BLS-Auszug per Filter, USDA-Stückgewichte, Laden in der App) zurückgenommen; Ursachenanalyse und BLS-Rohdaten behalten | D-355 | erledigt |
| §1 Warum die Suche heute nichts findet | Ursache belegt (D-354): keine Daten für lose Lebensmittel seit D-279, Schwächen der Suche. Suche neu für jede Datenquelle: Umlautschreibweisen, Einzahl und Mehrzahl, Synonyme in beide Richtungen, Grundwörter, Rang nach Stellung im Namen, lose vor Marke, keine Dubletten | D-354, D-356 | erledigt; Unit-Tests und E2E in Chromium bestanden, Gegenprobe am alten Stand rot; CI-Lauf 40124992752 mit allen vier Jobs grün, auch E2E (webkit) |
| §1 Nachtrag | Ganzes Wort vor Grundwort (Milch vor Buttermilch, Erdäpfel vor Ofenerdäpfel), drei Scheintreffer weniger (Oberschenkel bei „Obers“, Butternut bei „Butter“, gehackte Tomaten bei „Hackfleisch“); gefunden bei der Probe über die Auswahlliste | D-357 | erledigt; Unit-Tests und E2E in Chromium bestanden, Gegenprobe am alten Stand rot; CI-Lauf 40127846395 grün |
| §2 Auswahlliste aus dem BLS 4.0 | `docs/lebensmittel-auswahl.csv` mit 354 Zeilen: 345 Grundnahrungsmittel aus dem BLS 4.0 in zwölf Gruppen, 9 fehlende als „fehlt im BLS“; EU-Rechenregeln geprüft (keine Umrechnung nötig); Stückgewichte 5 belegt, 74 offen; Lizenzen in `docs/licenses-data.md`; nicht eingebaut | D-358 | Liste fertig zur Durchsicht, CI-Lauf 40129250444 grün; wartet auf Freigabe |
| §3 Salz, Zucker, gesättigte Fettsäuren, Ballaststoffe | Ist und Tagesreferenz unter „Weitere Nährwerte“ („4 g von höchstens 6 g“, „von mindestens 30 g“) mit Erklärung und Quelle; fehlende Angaben nicht als 0, Einträge ohne Angabe mit Namen | D-359 | erledigt; Unit-Tests und E2E in Chromium bestanden, Gegenprobe am alten Stand rot; CI-Lauf 40130994920 grün |
| §4 Einkaufsliste: Wischen zum Löschen | Wisch nach links löscht genau diesen Artikel, danach „Rückgängig“; kurz, schräg, senkrecht oder nach rechts passiert nichts; Scrollen bleibt beim Browser; Tastatur und Screenreader über „Bearbeiten“ | D-360 | erledigt; Unit-Tests und E2E in Chromium (Maus und echter Touch) bestanden, Gegenproben rot; CI-Lauf 40133009248 mit allen vier Jobs grün, auch E2E (webkit) |
| Liste nach der Freigabe ergänzt | Entscheidungen 1 bis 8 eingearbeitet: 366 Zeilen, 13 neue Einträge, drei USDA-Lücken, Regel für abgeleitete 0 g, Spalten Einheit, Hinweis und abgeleitete Werte, zusätzliche Suchbegriffe; Prüfung erweitert | D-361 | erledigt (`baeac1e`); `pnpm check:docs` ohne Befund, zehn Gegenproben gemeldet |
| §6 Einbau der Grundauswahl | 361 Lebensmittel nachgeladen und offline; Suche schon beim Tippen; Menge in g oder Stück; Stückgewicht einmal angeben, gemerkt und änderbar; Quelle je Eintrag; Lizenzliste unter „Über die App“ | D-362 | erledigt; Unit-Tests und E2E in Chromium bestanden, Gegenproben rot; WebKit zuerst rot am Fokus des Gewichtsfelds, behoben im Nachtrag; CI-Lauf 40171590098 mit allen vier Jobs grün, auch E2E (webkit) |
| Abschluss §1 „Weitere Nährwerte“ kompakt | je Zeile Name und „Ist / Referenz g“, einzeilig bei 320, 360 und 390 pt; Sternchen bei fehlenden Werten; Erklärung, Quellen und Einträge ohne Angabe im Info-Blatt | D-363 | erledigt; Unit-, Komponenten- und E2E-Tests in Chromium bestanden; WebKit in der CI |

## 2. §0 Stand prüfen und umsteuern

### Bestand beim neuen Auftrag

Auf dem Branch waren zwei Commits: `444d7f1` (Phasenstart, D-353) und `8f0a0dd` (Ursache der fehlenden Treffer, D-354). Alles Weitere war nur lokal angefangen und nicht committet: ein Auszug aus dem BLS 4.0 per Gruppenfilter, Stückgewichte aus der USDA-Datenbank SR24 und der Einbau beider in die App.

### Behalten und zurückgenommen

| Teil | Stand | Entscheidung | Grund |
|---|---|---|---|
| Phasenstart: Branch, Entwurfs-PR #51, `CLAUDE.md` (Phase `form-ernaehrung`, Regel für die Rechte neuer Tabellen), D-353 | committet (`444d7f1`) | behalten | gilt im neuen Auftrag unverändert |
| Ursachenanalyse der Suche, D-354 | committet (`8f0a0dd`) | behalten, gehört jetzt zu §1 | unabhängig von der Datenquelle |
| Erster Auftrag `docs/prompts/ernaehrung-FORM.md` | committet | durch den neuen Auftrag ersetzt; der erste bleibt in `444d7f1` nachlesbar | der neue ersetzt ihn vollständig |
| USDA-Stückgewichte: Werkzeug `tools/usda_portions_extract.py`, Auszug `tools/data/usda-sr24-portionen.json` (47 USDA-Lebensmittel), Zuordnung `tools/data/portionen.json` (49 BLS-Einträge, 91 Portionen), Feld `portionSource` am Lebensmittel | lokal | zurückgenommen | USDA nur noch für Lebensmittel, die im BLS fehlen; Stückgewichte sollen hiesige Größen haben (§2) |
| BLS-Auszug per Gruppenfilter: `tools/grundnahrungsmittel_build.py`, nachgeladene Datei `grundnahrungsmittel.json` (4.624 Einträge, alle Hauptgruppen außer Gerichten und Gebäck), Eintrag in `.prettierignore` | lokal | zurückgenommen | feste Auswahlliste statt Filter (§2) |
| Einbau in die App: Laden der Datei, Grundnahrungsmittel in Suche und „Zuletzt verwendet“, Karte „Grundnahrungsmittel“ in „Meine Lebensmittel“, Hinweis bei Ladefehler, Texte | lokal | zurückgenommen | Einbau erst nach Freigabe der Liste (§6) |
| Quellenzeile je Eintrag im Fenster „Hinzufügen“ | lokal | zurückgestellt bis §6 | kommt zusammen mit den BLS-Einträgen und „Über die App“ |
| Dubletten zwischen zwei Datenquellen erkennen (gleicher Name, gleiche Pflichtwerte) | lokal | behalten, in §1 für jede Datenquelle verallgemeinert | unabhängig von der Quelle |
| BLS 4.0 als Rohdaten: `tools/data/bls-4.0.json` (byte-gleich mit `58dee8c^:src/modules/nutrition/data/bls-4.0.json`, 7.140 Lebensmittel, acht Nährwerte), `tools/bls_build.py` (Umwandlung aus der Excel-Datei, D-261) | lokal, mit §2 committet (`72e9094`) | behalten | Grundlage der Auswahlliste |

In die App eingebaut war vom zurückgenommenen Teil nichts: Keiner der lokalen Stände wurde committet oder gepusht, `main` und der Entwurfs-PR enthalten ihn nicht.

### Geänderte Dateien

`docs/prompts/ernaehrung-FORM.md` (neuer Auftrag), `form-ernaehrung-report.md` (neu gegliedert), `docs/decisions.md` (D-355, D-354 mit neuem Abschnittsbezug), `docs/implementation-plan.md` (Punkt 67).

### Tests mit Ergebnis

Nur Unterlagen, kein Code geändert. `pnpm format:check` und `pnpm check:docs` ohne Befund; CI-Lauf 40123167625 zu `1f55e19` erfolgreich.

## 3. §1 Warum die Suche heute nichts findet

### Ursache (Analyse vom 24.10.2026, D-354)

Zwei Ursachen, beide belegt.

1. **Keine Daten für lose Lebensmittel.** Seit D-279 (20.10.2026) liefert die App keine eigenen Lebensmitteldaten mehr mit. Gesucht wird nur in eigenen Lebensmitteln, Rezepten und dem ÖNWT-Import (D-263). Ohne Import findet die Suche „Apfel“, „Ei“ oder „Tomaten“ deshalb gar nichts. Der ÖNWT-Import enthält laut D-263 und `data-sources.md` österreichische Gerichte und Produkte, keine Tabelle für Obst, Gemüse oder Eier; ob einzelne lose Lebensmittel darunter sind, lässt sich ohne deine Datei nicht prüfen (sie liegt nicht im Repository). Er liegt außerdem nur auf dem Gerät, auf dem er importiert wurde.
2. **Schwächen der Suche.** Selbst mit passenden Daten verfehlt die Suche häufige Eingaben: Sie vergleicht nur Wortteile, kennt keine Mehrzahl, wandelt „ae“ in der Eingabe nicht in „ä“ um, kennt keine Synonyme (Brokkoli/Broccoli, Nudeln/Teigwaren, Ei/Hühnerei) und stellt bei gleichem Rang kürzere Namen nach vorn, also „Apfelmus“ vor „Apfel roh“.

#### Beleg

Die heutige Suchfunktion (`searchFoods` in `calc/foodSearch.ts`, unverändert) einmal ohne Daten wie in der App ohne Import, einmal über den BLS 4.0 aus der Git-Historie (`58dee8c^`, 7.140 Einträge, mit den österreichischen Suchbegriffen aus `austrianTerms.ts`). Lauf vom 24.10.2026 mit Vitest, Ausgabe wörtlich gekürzt auf die ersten fünf Treffer:

```
A) Stand heute ohne Import (nur eigene Lebensmittel, hier keine):
  Apfel: 0 Treffer
  Äpfel: 0 Treffer
  Aepfel: 0 Treffer
  Ei: 0 Treffer
  Eier: 0 Treffer
  Tomate: 0 Treffer
  Tomaten: 0 Treffer
B) Dieselbe Suche über den BLS 4.0 (7.140 Einträge), erste fünf Treffer:
  Apfel: 325 Treffer -> Apfelmus | Apfel roh | Apfelkorn | Apfelsaft | Apfelwein
  Äpfel: 325 Treffer -> Apfelmus | Apfel roh | Apfelkorn | Apfelsaft | Apfelwein
  Aepfel: 207 Treffer -> Vanilleäpfel | Himmel und Erde (Äpfel und Kartoffeln) mit gebratenem Speck | …
  Ei: 2624 Treffer -> Eiswein | Eierlikör | Eiskaffee | Eierpunsch | Eiskonfekt
  Eier: 155 Treffer -> Eierlikör | Eierpunsch | Eierpastete | Eier gekocht | Eier russisch
  Tomate: 143 Treffer -> Tomate roh | Tomatenmark | Tomate Pulver | Tomate gekocht | Tomatenketchup
  Tomaten: 124 Treffer -> Tomatenmark | Tomatenketchup | Tomatensuppe gebunden | Tomatenkartoffeln gedünstet | Tomatensauce aus Tomatenmark
  Paradeiser: 143 Treffer -> Tomate roh | Tomatenmark | Tomate Pulver | Tomate gekocht | Tomatenketchup
  Erdäpfel: 204 Treffer -> Kartoffelwurst | Kartoffelgratin | Kartoffelschnee | Kartoffelsticks | Butterkartoffeln
  Karotten: 47 Treffer -> Karottensuppe | Karottencremesuppe | Karottensaftschorle | Karotten-/Möhrenpüree | Karotten/Möhren, gekocht
  Brokkoli: 0 Treffer ->
  Paprika: 60 Treffer -> Paprikacremesuppe | Paprikaspeckwurst | Paprika-Gurkengemüse gedünstet | Paprikasalat mit Essigmarinade | Paprikasauce von Bechamelsauce
  Fisch: 99 Treffer -> Fischbrühe | Fischkraftbrühe | Fischleberöl/Lebertran | Fischburger mit Seelachs | Fischmayonnaise mit Kabeljau
  Öl: 716 Treffer -> Olivenöl | Olivenpastete | Oliven grün, gesäuert, abgetropft | …
  Nudeln: 21 Treffer -> Reisnudeln roh | Reisnudeln gekocht | Rohrnudeln gebacken | Schupfnudeln gegart | Dampfnudeln süß gebraten
  Bananen: 13 Treffer -> Bananenquark | Bananennektar | Bananenkompott | Bananennektarschorle | Bananenkompott mit Süßstoff
```

„Hühnerei roh“ erscheint bei „Ei“ erst weit hinten und bei „Eier“ gar nicht; „Tomate roh“ fehlt bei „Tomaten“, „Banane roh“ bei „Bananen“, „Gemüsepaprika rot, roh“ bei „Paprika“ unter den ersten Treffern, echter Fisch (Lachs, Forelle) bei „Fisch“.

#### Die Punkte des Auftrags einzeln

| Punkt | Befund | Ursache? |
|---|---|---|
| Datenquelle | Keine gebündelte Tabelle seit D-279; ÖNWT-Import produktbezogen und nur auf einem Gerät; Open Food Facts nur per Barcode (D-266, D-302) | ja, Hauptursache |
| Initialisierung und Laden | `useFoodCatalog` lädt eigene Lebensmittel, Rezepte und den Import aus IndexedDB; ohne Import bleibt die Liste der Grundlebensmittel leer, ohne Fehlermeldung | Folge der Datenquelle |
| Suchindex und Filter | Jedes Wort muss als Wortteil vorkommen; Rang: Name beginnt mit dem ersten Wort, dann Wortteil im Namen, dann Alias; danach kürzere Namen zuerst. Zwei Buchstaben wie „ei“ oder „öl“ treffen tausende Wortteile (Weizen, Oliven) | ja |
| Deutsche Bezeichnungen und Synonyme | Nur österreichische Begriffe (`austrianTerms.ts`), und nur für Namen, die das deutsche Wort enthalten. Es fehlen Brokkoli/Broccoli, Nudeln/Teigwaren, Ei/Hühnerei, Paprika/Gemüsepaprika, Rindfleisch/Rind | ja |
| Groß- und Kleinschreibung | Wird ausgeglichen | nein |
| Umlaute | „Äpfel“ findet „Apfel“ (Umlaut wird zu a). „Aepfel“ findet „Apfel“ nicht: Die Schreibweise „ae“ wird nur beim Lebensmittel ergänzt, nicht bei der Eingabe | ja, für „ae/oe/ue“ |
| Einzahl und Mehrzahl | Keine Behandlung: „Tomaten“, „Bananen“, „Eier“, „Karotten“ finden die Einzahl nicht | ja |
| Lokale Speicherung | Import in eigener IndexedDB `…-lebensmittel`, nicht exportiert, nicht synchronisiert (D-263) | trägt bei: anderes Gerät, kein Import |
| Synchronisierung | Eigene Lebensmittel werden abgeglichen, die Importdaten nicht (Absicht, D-263) | trägt bei |
| Langsame oder fehlende Quelle | Die Suche nach Namen braucht kein Netz; beim Laden zeigt die Seite einen Platzhalter. Kein Einfluss auf die fehlenden Treffer | nein |
| Vermutung Open Food Facts | Stimmt als Aussage über Open Food Facts (produktbezogen), ist hier aber nicht die Ursache: Die App fragt Open Food Facts nie nach Namen, nur nach Barcodes. Eine Namenssuche dort würde lose Lebensmittel ohnehin schlecht abdecken und Suchbegriffe an einen Dienst senden | nein |

Keine vorgetäuschten Treffer: Die Behebung kommt aus einer besseren Suche für jede Datenquelle (unten) und aus der kuratierten Auswahl aus dem BLS (§2, Einbau nach Freigabe in §6).

Die Analyse ist Commit `8f0a0dd` (damals als §2 des ersten Auftrags). Der Beleg stammt aus einem vorübergehenden Vitest-Lauf gegen die unveränderte Suchfunktion; die Datei wurde danach entfernt. Die Fälle gehen als Tests in die Behebung ein.

### Behebung: Suche für jede Datenquelle (D-356)

Die Suche (`calc/foodSearch.ts`) ist neu geschrieben und gilt für alle Quellen gleich: eigene Lebensmittel, Rezepte, ÖNWT-Import, gescannte Produkte und später die BLS-Auswahl. Das Sprachwissen steht getrennt in `calc/foodTerms.ts`.

| Punkt | Lösung |
|---|---|
| Groß- und Kleinschreibung, Umlaute | Eingabe und Lebensmittel werden gleich gefaltet: „Äpfel“, „Aepfel“ und „Apfel“ sind dasselbe Wort, ebenso „Müsli“ und „Muesli“ |
| Einzahl und Mehrzahl | Ohne Wörterbuch: „-n“, „-e“, „-s“ am Ende (Tomaten, Bananen, Nüsse, Kiwis); „-er“ nur über eine kurze Liste (Eier, Hühner, Kräuter …), damit „Butter“ nicht „Butt“ trifft |
| Synonyme | 60 Gruppen in beide Richtungen, österreichisch und bundesdeutsch (Paradeiser/Tomate, Erdäpfel/Kartoffel, Topfen/Quark, Karfiol/Blumenkohl, Fisolen/grüne Bohne, Marille/Aprikose …), Schreibweisen (Brokkoli/Broccoli, Jogurt/Joghurt) und Kurzformen (Nudel/Teigware/Pasta, Ei/Hühnerei). Auch in zusammengesetzten Wörtern: „Erdäpfelpüree“ findet „Kartoffelpüree“ |
| Falsche Freunde | 14 Wörter, die ein anderes Lebensmittelwort enthalten, ohne es zu meinen, zählen nicht als Teiltreffer: Erdapfel, Granatapfel und Apfelsine bei „Apfel“, Seelachs bei „Lachs“, Knoblauch bei „Lauch“, Reis und Paradeiser bei „Eis“ |
| Suchindex und Rang | Ganzes Wort oder Grundwort am Anfang des Namens zuerst („Olivenöl“ ist ein Öl, „Hühnerei“ ein Ei), dann ganzes Wort weiter hinten (Zutat eines Gerichts), dann Marke oder Suchbegriff, dann Wortanfang; Wortteile mitten im Wort erst ab fünf Buchstaben. Bei gleichem Rang lose Lebensmittel vor Markenprodukten, dann kürzere Namen |
| Kurze Wörter | „Öl“ wird mit Umlaut verglichen und findet Rapsöl und Olivenöl, nicht Karfiol oder Oliven; „Ei“ trifft nie „Brei“ |
| Dubletten | Gleicher Name, gleiche Marke und gleiche Pflichtwerte erscheinen einmal, der eigene Eintrag zuerst |
| Vorgetäuschte Treffer | Keine: Jede Fundstelle steht im Namen, in der Marke oder in einem Suchbegriff des Eintrags oder über ein dokumentiertes Synonym |

#### Nachher über den BLS 4.0

Dieselben Suchbegriffe wie im Beleg oben, dazu Topfen, Nudeln und weitere, jetzt mit der neuen Suche über den ganzen BLS 4.0 (7.140 Einträge, mit Gerichten), danach die Laufzeit über 12.140 Einträge (BLS plus 5.000 Einträge mit Marke). Lauf vom 24.10.2026 mit dem endgültigen Code, vorübergehender Vitest-Lauf, Datei danach entfernt, Ausgabe wörtlich:

```
Index 7.140 Einträge: 147 ms
  Apfel: 123 Treffer -> Apfel roh | Vanilleäpfel | Apfel gedünstet | Apfel getrocknet | Apfel geschält, roh
  Äpfel: 123 Treffer -> Apfel roh | Vanilleäpfel | Apfel gedünstet | Apfel getrocknet | Apfel geschält, roh
  Aepfel: 123 Treffer -> Apfel roh | Vanilleäpfel | Apfel gedünstet | Apfel getrocknet | Apfel geschält, roh
  Ei: 341 Treffer -> Eier gekocht | Hühnerei roh | Eier russisch | Hühnerei Pulver | Hühnerei gekocht
  Eier: 177 Treffer -> Eier gekocht | Hühnerei roh | Eier russisch | Hühnerei Pulver | Hühnerei gekocht
  Tomate: 143 Treffer -> Tomate roh | Tomate Pulver | Tomate gekocht | Tomate gebacken | Tomate gegrillt
  Tomaten: 143 Treffer -> Tomate roh | Tomate Pulver | Tomate gekocht | Tomate gebacken | Tomate gegrillt
  Paradeiser: 143 Treffer -> Tomate roh | Tomate Pulver | Tomate gekocht | Tomate gebacken | Tomate gegrillt
  Erdäpfel: 204 Treffer -> Kartoffel geschält, roh | Kartoffel-Gemüse-Kuchen | Batate/Süßkartoffel, roh | Kartoffel ungeschält, roh | Kartoffel-Lauchcremesuppe
  Topfen: 89 Treffer -> Bananenquark | Früchtequark | Vanillequark | Quark-Plunder | Quark-Mokka-Creme
  Karotten: 75 Treffer -> Karotte/Möhre, roh | Karotten-/Möhrenpüree | Karotte/Möhre, gekocht | Karotte/Möhre, gebacken | Karotte/Möhre, gedünstet
  Brokkoli: 25 Treffer -> Broccoli roh | Broccoli gekocht | Broccoli gebacken | Broccoli gedünstet | Broccoli tiefgefroren
  Paprika: 60 Treffer -> Gemüsepaprika rot, roh | Gemüsepaprika gelb, roh | Gemüsepaprika grün, roh | Gemüsepaprika rot, gekocht | Gemüsepaprika gelb, gekocht
  Fisch: 99 Treffer -> Thunfisch roh | Schellfisch roh | Tintenfisch roh | Schwertfisch roh | Thunfisch gegrillt
  Nüsse: 113 Treffer -> Walnuss | Paranuss | Haselnuss | Pekannuss | Nuss-Plunder
  Öl: 92 Treffer -> Hanföl | Leinöl | Mohnöl | Sojaöl | Kokosöl
  Nudeln: 148 Treffer -> Reisnudeln roh | Reisnudeln gekocht | Rohrnudeln gebacken | Schupfnudeln gegart | Teigwaren eifrei, roh
  Bananen: 24 Treffer -> Banane roh | Kochbanane roh | Banane getrocknet | Kochbanane gekocht | Kochbanane gebacken
Suche über 12140 Einträge: Median 23.0 ms, langsamste 43.4 ms
```

Was bleibt: Über den ganzen BLS stehen noch Gerichte zwischen den Grundlebensmitteln („Vanilleäpfel“, „Kartoffel-Gemüse-Kuchen“), und „Topfen“ zeigt zuerst Quarkspeisen, weil der BLS „Speisequark“ schreibt. Beides löst die kuratierte Auswahl mit österreichischen Anzeigenamen und ohne Gerichte (§2, Einbau in §6): Dort heißt der Eintrag „Topfen“ und steht als ganzes Wort vorn. Die Laufzeit wurde in Node gemessen (Index für 7.140 Einträge 147 ms, einmal je Datenstand); auf dem iPhone ist mit einem Mehrfachen zu rechnen, die Eingabe bleibt durch die verzögerte Suche flüssig.

#### Geänderte Dateien

`src/modules/nutrition/calc/foodSearch.ts` (neu geschrieben), `src/modules/nutrition/calc/foodTerms.ts` (neu), `src/modules/nutrition/calc/foodSearch.test.ts` (neu), `e2e/nutrition.spec.ts` (neuer Test, Hilfsfunktion für Importzeilen), `docs/decisions.md` (D-356), `docs/requirements.md` (AK-NUT-14), `docs/feature-inventory.md` und `.csv` (NU-08), `docs/testing.md`, dieser Bericht.

#### Tests mit Ergebnis

| Nachweis | Ergebnis |
|---|---|
| `src/modules/nutrition/calc/foodSearch.test.ts` | 16 bestanden: Faltung, Einzahlformen, Apfel/Äpfel/Aepfel, Ei/Eier ohne Brei, Tomate/Tomaten/Paradeiser in beide Richtungen, Mehrzahl, österreichische Begriffe, Schreibweisen, Öl, falsche Freunde, keine vorgetäuschten Treffer, Dubletten, bisheriges Verhalten (D-306) |
| `pnpm test` | 117 Dateien, 1002 Tests bestanden |
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | ohne Befund |
| `pnpm build`, `pnpm check:bundle` | Startansicht 234,3 KB von 250 KB (unverändert) |
| E2E `nutrition.spec.ts` und `nutrition-ring.spec.ts`, Chromium Desktop und Pixel 7 | 22 bestanden, 2 übersprungen, 0 fehlgeschlagen; darin neu „Suche: Mehrzahl, Umlautschreibweise und Synonyme, lose vor Marke (D-356)“ mit Tomaten, Paradeiser, Eier, Ei, Aepfel, Äpfel, Kartoffeln über importierte Daten |
| Gegenprobe: neuer E2E-Test gegen die alte Suche | 2 von 2 fehlgeschlagen (Desktop und Mobil) beim ersten Begriff: „Expected pattern: /^Tomate roh/“ |
| WebKit | CI-Lauf 40124992752 zu `b7dfaec`: alle vier Jobs grün, auch „E2E (webkit)“ |

### Nachtrag (D-357): ganzes Wort vor Grundwort, drei Scheintreffer weniger

Gefunden bei der Probe der Suche über die Auswahlliste aus §2: vorübergehender Vitest-Lauf über die 354 Einträge von `docs/lebensmittel-auswahl.csv` (Anzeigename, Suchbegriffe und BLS-Bezeichnung als Suchwörter), Datei danach entfernt.

| Befund vorher | Ursache | Behebung |
|---|---|---|
| „Milch“ zeigte Magermilch und Buttermilch vor „Milch 3,5 %“, „Joghurt“ das Magerjoghurt vor „Joghurt 1,5 %“, „Erdäpfel“ zuerst Ofenerdäpfel, „Kartoffeln“ die Süßkartoffel vor „Erdäpfel, gekocht“, „Kürbis“ den Butternusskürbis vor „Kürbis, Hokkaido“ | Ganzes Wort und Grundwort am Anfang des Namens hatten dieselbe Stufe 7; danach entschied der kürzere Name | Neue Stufe 8 für das ganze Wort am Anfang (auch über Einzahl und Synonym); das Grundwort bleibt bei 7 |
| „Sahne“ und „Obers“ fanden „Hühneroberschenkel mit Haut“ | „obers“ steckt in „Oberschenkel“ | falscher Freund „Oberschenkel“ |
| „Butter“ fand den Butternusskürbis über dessen Suchbegriff „Butternut“ | nur „Butternuss“ stand bei den falschen Freunden | falscher Freund „Butternut“ |
| „Hackfleisch“ und „Faschiertes“ fanden „Paradeiser aus der Dose“ über den Suchbegriff „gehackte Tomaten“ | Synonym „Gehacktes“ mit der Einzahlform „gehackte“ | „Gehacktes“ gestrichen; in der Liste heißt der Suchbegriff jetzt „Tomatenkonserve“ |

Probe nachher, erste fünf Treffer, Ausgabe wörtlich (Auszug):

```
Erdäpfel     → Erdäpfel, roh | Erdäpfel, gekocht | Erdäpfel in der Schale, gekocht | Ofenerdäpfel | Süßkartoffel, roh
Kartoffeln   → Erdäpfel, roh | Erdäpfel, gekocht | Erdäpfel in der Schale, gekocht | Ofenerdäpfel | Süßkartoffel, roh
Milch        → Milch 1,5 % | Milch 3,5 % | Magermilch | Buttermilch | Magerjoghurt
Joghurt      → Joghurt 1,5 % | Joghurt 3,5 % | Magerjoghurt | Sahnejoghurt 10 % | Griechisches Joghurt 10 %
Hackfleisch  → Faschiertes gemischt | Faschiertes gemischt, gebraten | Rindsfaschiertes | Schweinsfaschiertes
Sahne        → Kaffeeobers | Schlagobers | Sauerrahm 10 % | Sauerrahm 15 % | Sahnejoghurt 10 %
Butter       → Butter | Buttermilch | Butterschmalz | Toastbrot | Erdnussmus
Kürbis       → Kürbis, Hokkaido | Butternusskürbis | Kürbiskerne | Kürbiskernöl
```

Toastbrot und Erdnussmus bleiben bei „Butter“ mit Absicht: Ihre Suchbegriffe „Buttertoast“ und „Erdnussbutter“ enthalten das Wort. Die vollständige Probe mit allen Prüfwörtern steht in §2.

#### Geänderte Dateien

`src/modules/nutrition/calc/foodSearch.ts` (Stufe 8), `src/modules/nutrition/calc/foodTerms.ts` (zwei falsche Freunde, „Gehacktes“ gestrichen), `src/modules/nutrition/calc/foodSearch.test.ts` (drei Tests), `docs/decisions.md` (D-357), `docs/testing.md`, `docs/implementation-plan.md`, dieser Bericht.

#### Tests mit Ergebnis

| Nachweis | Ergebnis |
|---|---|
| `src/modules/nutrition/calc/foodSearch.test.ts` | 19 bestanden (16 bisherige unverändert, 3 neue) |
| Gegenprobe: die drei neuen Tests gegen die Suche aus D-356 | 3 von 3 fehlgeschlagen, die 16 bisherigen bestanden |
| `pnpm test` | 117 Dateien, 1005 Tests bestanden |
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | ohne Befund |
| `pnpm build`, `pnpm check:bundle` | Startansicht 234,3 KB von 250 KB (unverändert) |
| E2E `nutrition.spec.ts` und `nutrition-ring.spec.ts`, Chromium Desktop und Pixel 7 | 22 bestanden, 2 übersprungen, 0 fehlgeschlagen |
| WebKit | CI-Lauf 40127846395 zu `6be7660`: erfolgreich |

---

## 4. §2 Auswahlliste aus dem BLS 4.0

### Ergebnis

`docs/lebensmittel-auswahl.csv`: 354 Zeilen, UTF-8 mit BOM und Semikolon wie `docs/feature-inventory.csv`, öffnet sich so direkt in Excel und Numbers. Spalten laut Auftrag: Anzeigename, Suchbegriffe, Gruppe, Zubereitung, BLS-Code, BLS-Bezeichnung, Stückgewicht (g), Herkunft des Stückgewichts, Quelle. Sortiert nach den zwölf Gruppen in der Reihenfolge des Auftrags, innerhalb der Gruppe alphabetisch. Die Liste ist **nicht** in die App eingebaut; das folgt nach deiner Freigabe in §6.

`tools/lebensmittel_auswahl.py` prüft die Liste gegen die BLS-Daten und läuft in `pnpm check:docs` mit: Jeder BLS-Code existiert, die BLS-Bezeichnung ist wortgleich, Gruppen und Reihenfolge stimmen, kein Name und kein Code doppelt, ein Stückgewicht nur mit Herkunft. Ohne Schalter gibt das Skript die Zusammenfassung unten aus. Wenn du die Liste in Excel änderst und wieder als CSV speicherst, zeigt die Prüfung, ob alles zusammenpasst.

### Wie ausgewählt wurde

- **Gruppen:** Obst, Gemüse, Erdäpfel, Hülsenfrüchte, Getreide und Getreideprodukte, Eier, Milch und Milchprodukte, Fleisch, Geflügel, Fisch, Nüsse und Samen, Öle und Fette. Pilze und Kräuter stehen bei Gemüse, Tofu bei Hülsenfrüchten, Brot und Gebäck bei Getreide.
- **Nicht aufgenommen:** Gerichte, Wurst und Schinken, Fertigprodukte, regionale deutsche Spezialitäten.
- **Ein Eintrag je Lebensmittel, roh.** Zubereitungen nur, wenn man sie so isst und wiegt und die Werte deutlich abweichen: gekocht bei Reis, Nudeln, Getreide, Hülsenfrüchten, Erdäpfeln (gekocht, in der Schale gekocht, Ofenerdäpfel), Rote Rüben und Spargel; Ei gekocht; gebraten oder gegrillt nur bei den häufigsten Eiweißquellen (Hühnerbrust, Putenbrust, Faschiertes, Lachs, Tafelspitz gekocht, Garnelen gekocht). Keine Varianten wie geschält, gedünstet oder tiefgefroren. Bei Erdäpfeln steht in der Spalte Zubereitung, ob geschält oder in der Schale, weil der BLS beides getrennt führt.
- **Konserven und Eingelegtes** nur, wo sie das übliche Grundnahrungsmittel sind und eigene Werte haben (meist mehr Salz): Hülsenfrüchte, Mais, Paradeiser, Thunfisch, Sardinen, Essiggurkerl, Oliven.
- **Fett- und Sortenstufen** als eigene Einträge, wo man sie getrennt kauft: Milch 1,5 und 3,5 %, Joghurt, Topfen, Paprika rot, gelb und grün.
- **Namen:** österreichisch als Anzeigename (Paradeiser, Erdäpfel, Karfiol, Marillen, Ribisel, Fisolen, Melanzani, Kohlsprossen, Zwetschken, Kren, Topfen, Schlagobers, Kaffeeobers, Faschiertes, Semmel, Germ, Vogerlsalat, Häuptelsalat, Eierschwammerl, Herrenpilze, Weichseln, Ringlotten, Kletzen, Beiried, Schopf, Reinanke, Waller …), bundesdeutsch als Suchbegriff. Mehrzahl und Schreibweisen wie „Aepfel“ stehen nicht in der Liste, die kennt die Suche selbst (D-356).

### Zusammenfassung: Anzahl je Gruppe

Ausgabe von `python3 tools/lebensmittel_auswahl.py`:

| Gruppe | Einträge | davon aus dem BLS | fehlt im BLS | Stückgewicht belegt | Stückgewicht offen |
|---|---:|---:|---:|---:|---:|
| Obst | 46 | 46 | 0 | 0 | 26 |
| Gemüse | 76 | 73 | 3 | 0 | 26 |
| Erdäpfel | 6 | 6 | 0 | 0 | 5 |
| Hülsenfrüchte | 20 | 19 | 1 | 0 | 0 |
| Getreide und Getreideprodukte | 62 | 61 | 1 | 1 | 17 |
| Eier | 4 | 4 | 0 | 4 | 0 |
| Milch und Milchprodukte | 41 | 38 | 3 | 0 | 0 |
| Fleisch | 25 | 25 | 0 | 0 | 0 |
| Geflügel | 12 | 12 | 0 | 0 | 0 |
| Fisch | 28 | 28 | 0 | 0 | 0 |
| Nüsse und Samen | 21 | 20 | 1 | 0 | 0 |
| Öle und Fette | 13 | 13 | 0 | 0 | 0 |
| **Summe** | **354** | **345** | **9** | **5** | **74** |

### Fehlende Lebensmittel

Österreichische Grundnahrungsmittel, die der BLS 4.0 nicht führt. Sie stehen in der Liste mit leerem BLS-Code und „fehlt im BLS“ in der Spalte Quelle.

| Lebensmittel | Gruppe | Was der BLS hat | Möglich |
|---|---|---|---|
| Pfefferoni | Gemüse | keine scharfen Paprika | USDA SR 11670 „Peppers, hot chili, green, raw“ oder eigener Eintrag |
| Butternusskürbis | Gemüse | nur Hokkaido und Gartenkürbis | USDA SR 11485 „Squash, winter, butternut, raw“ oder eigener Eintrag |
| Rote Zwiebel | Gemüse | nur Speisezwiebel | Suchbegriff bei Zwiebel oder eigener Eintrag |
| Käferbohnen | Hülsenfrüchte | keine Feuerbohnen | eigener Eintrag mit Packungsangabe |
| Knödelbrot | Getreide | nur Semmel und Croutons mit Butter | eigener Eintrag mit Packungsangabe |
| Griechisches Joghurt 10 % | Milch | Sahnejoghurt 10 %, nicht abgetropft | eigener Eintrag mit Packungsangabe |
| Magermilch | Milch | nur als Pulver und in Sauermilchprodukten | USDA SR 01151 „Milk, nonfat, fluid“ oder eigener Eintrag |
| Sauerrahm 15 % | Milch | nur 10 % und 20 % | eigener Eintrag mit Packungsangabe |
| Hanfsamen, geschält | Nüsse und Samen | nur Hanföl | eigener Eintrag mit Packungsangabe |

Im BLS vorhanden, obwohl man es nicht erwartet: Saibling, Reinanke (Felchen), Ringlotten (Reineclaude), Germ (Backhefe frisch), Fenchel, Petersilwurzel, Bärlauch, Löwenzahn, Trappistenkäse, Quargel (Sauermilchkäse), Mehrkornweckerl, Laugengebäck.

### EU-Rechenregeln geprüft

Geprüft an den 345 BLS-Einträgen der Liste, vorübergehendes Skript, Ergebnis:

| Regel der LMIV | BLS 4.0 | Ergebnis |
|---|---|---|
| Kohlenhydrate ohne Ballaststoffe | Feld CHO „Kohlenhydrate, verfügbar“ | passt |
| Energie: 4 kcal/g Eiweiß und Kohlenhydrate, 9 kcal/g Fett, 2 kcal/g Ballaststoffe | mit diesen Faktoren gerechnet weicht der BLS-Wert im Median um 0,4 kcal ab; 273 von 339 vollständigen Einträgen liegen innerhalb ±2 kcal, 324 innerhalb ±5 kcal. Ohne den Ballaststoffanteil wären es im Median 4,2 kcal und nur 105 innerhalb ±2 kcal | passt |
| Salz = Natrium × 2,5 | Feld NACL, laut BLS-Dokumentation Abschnitt 5.8 aus Natrium × 2,5 | passt |

Die größten Abweichungen: Zitrone +18,4 kcal, getrocknete Birne (Kletzen) −15,7, Dörrmarillen +15,2, Limette +14,0, Maracuja +11,4, Rosinen +10,2, weiße Bohnen trocken +9,6, Holunder +8,3, Ribisel +7,7 und +7,2, Sauerkraut +7,5. Das ist vor allem Obst mit viel Fruchtsäure und Sauerkraut mit Milchsäure; organische Säuren zählen nach der EU mit 3 kcal/g und Zuckeralkohole mit 2,4 kcal/g, beides gehört nicht zu den acht Nährwerten der App. Das passt zu den Abweichungen; einzeln je Eintrag geprüft habe ich es nicht. **Ergebnis: Die BLS-Werte folgen den EU-Regeln, es wird nichts umgerechnet.** Nur USDA-Werte für Lücken müssten umgerechnet werden (`docs/licenses-data.md` Abschnitt 2).

Fehlende Werte in der Auswahl (im BLS leer, in der App später als „fehlt“ sichtbar, nicht als 0): Eiweiß bei Kokosöl und Schweineschmalz; Fett bei Apfelringen, Dörrzwetschken, Ringlotten und Essiggurkerl; gesättigte Fettsäuren bei Bärlauch; Ballaststoffe bei 13 Einträgen (Crème fraîche, Feta, Mascarpone, Mozzarella, Ricotta, Lachs roh, Pangasius, Räuchermakrele, Seelachs, Thunfisch im eigenen Saft, Butter, Margarine, Halbfettmargarine). Zucker und Salz sind überall vorhanden.

### Stückgewichte

| Stand | Einträge | Herkunft |
|---|---|---|
| belegt | Ei 51 g, Ei gekocht 51 g | abgeleitet: Gewichtsklasse M = 53 bis unter 63 g mit Schale (EU-Vermarktungsnorm), Mitte 58 g, minus 12 % Schale (Abfallanteil laut USDA SR); Gegenprobe USDA „1 large egg“ = 50 g |
| belegt | Eiklar 33 g, Dotter 17 g | USDA SR 01124 und 01125 für „1 large“; US large entspricht etwa Größe M |
| belegt | Semmel 46 g | Mindestgewicht nach dem Backen laut Codex-Kapitel B 18 (bmluk.gv.at); im Handel oft schwerer |
| offen | 74 Einträge, bei denen ein Stück oder eine Scheibe sinnvoll ist (Obst, Gemüse, Erdäpfel, Gebäck, Brot je Scheibe) | keine Quelle für hiesige Größen gefunden, siehe Frage 1 |
| leer | alles, was man nicht stückweise isst (Mehl, Öl, Milch, Fleisch, Beeren …) | – |

Der BLS 4.0 enthält keine Stückgewichte: Die Datei hat je Lebensmittel Code und Namen und je Nährstoff Wert, Herkunft und Referenz (Prüfspike S-2). Gefunden habe ich nur Seiten ohne Quelle, US- oder australische Größen und Bundgewichte für den Gemüsebau; ein „mittlerer Apfel“ liegt dort zwischen 130 und 182 g. Deshalb sind die Felder leer und als „offen“ markiert statt geschätzt.

### Offene Fragen

1. **Stückgewichte für Obst, Gemüse und Brot (74 offen).** Vorschlag: leer lassen; in der App gibst du dort Gramm ein oder trägst einmal dein eigenes Stückgewicht ein (der Auftrag sieht vor, dass es änderbar ist). Alternativ USDA-Werte mit Quelle (US-Größen, oft größer, z. B. Apfel 182 g) oder eine Tabelle, die du nennst.
2. **Ei, Eiklar, Dotter, Semmel:** Passen die Herleitungen (Ei M 51 g, Eiklar 33 g, Dotter 17 g, Semmel 46 g als Mindestgewicht)?
3. **Fehlende Werte:** 6 Einträge ohne Eiweiß- oder Fettwert und 13 ohne Ballaststoffwert (oben). Vorschlag: aufnehmen und den Wert als fehlend zeigen. Sollen reine Fette und tierische Lebensmittel stattdessen 0 g bekommen? Das wäre sachlich richtig, stammt aber nicht aus der Quelle.
4. **Lücken:** Für die 9 fehlenden Lebensmittel USDA (umgerechnet, als USDA gekennzeichnet) oder eigener Eintrag nach Packung? Vorschlag: USDA für Pfefferoni, Butternusskürbis und Magermilch; rote Zwiebel als Suchbegriff bei Zwiebel; die übrigen nach Packungsangabe.
5. **Mehltypen:** Die österreichischen Typen habe ich den nächsten deutschen zugeordnet (W 480 → Type 405, W 700 → Type 550, W 1600 → Type 1600, R 960 → Roggen Type 997); die Werte unterscheiden sich wenig. Passt das?
6. **Was fehlt, weil es keine der genannten Gruppen ist:** Getränke, Zucker, Honig, Marmelade, Kakao, Gewürze und Salz, Pflanzendrinks, Proteinpulver, Schinken und Speck. Sollen einzelne davon in die Liste?
7. **Grenzfälle, die drin sind:** Germ (bei Getreide, weil keine Gruppe passt), Reiswaffeln, Erdnuss- und Mandelmus, Tofu, Paradeismark, Konserven. Raus oder drin lassen?

### Probe: Suche über die Liste

Vorschau auf §6: vorübergehender Vitest-Lauf über die 354 Einträge (Anzeigename, Suchbegriffe und BLS-Bezeichnung als Suchwörter, erste fünf Treffer), mit der Suche nach D-357, Datei danach entfernt. Ausgabe wörtlich:

```
Apfel        → Apfel | Apfelringe, getrocknet
Äpfel        → Apfel | Apfelringe, getrocknet
Aepfel       → Apfel | Apfelringe, getrocknet
Ei           → Ei | Ei, gekocht | Dotter | Eiklar | Eisbergsalat
Eier         → Ei | Ei, gekocht | Dotter | Eiklar | Eiernudeln, gekocht
Tomate       → Paradeiser | Paradeiser aus der Dose | Passierte Paradeiser | Paradeismark
Tomaten      → Paradeiser | Paradeiser aus der Dose | Passierte Paradeiser | Paradeismark
Paradeiser   → Paradeiser | Paradeiser aus der Dose | Passierte Paradeiser | Paradeismark
Erdäpfel     → Erdäpfel, roh | Erdäpfel, gekocht | Erdäpfel in der Schale, gekocht | Ofenerdäpfel | Süßkartoffel, roh
Kartoffeln   → Erdäpfel, roh | Erdäpfel, gekocht | Erdäpfel in der Schale, gekocht | Ofenerdäpfel | Süßkartoffel, roh
Topfen       → Topfen 10 % | Topfen 20 % | Topfen 40 % | Magertopfen
Quark        → Topfen 10 % | Topfen 20 % | Topfen 40 % | Magertopfen
Reis         → Reis, gekocht | Reis, trocken | Naturreis, gekocht | Naturreis, trocken | Parboiled Reis, gekocht
Nudeln       → Nudeln, gekocht | Nudeln, trocken | Eiernudeln, gekocht | Eiernudeln, trocken | Reisnudeln, gekocht
Milch        → Milch 1,5 % | Milch 3,5 % | Magermilch | Buttermilch | Magerjoghurt
Joghurt      → Joghurt 1,5 % | Joghurt 3,5 % | Magerjoghurt | Sahnejoghurt 10 % | Griechisches Joghurt 10 %
Hühnerbrust  → Hühnerbrust, roh | Hühnerbrust, gebraten
Lachs        → Lachs, roh | Lachs, gegrillt | Räucherlachs
Nüsse        → Walnüsse | Paranüsse | Haselnüsse | Pekannüsse | Macadamianüsse
Öl           → Leinöl | Rapsöl | Kokosöl | Sesamöl | Olivenöl
Brot         → Weißbrot | Mischbrot | Toastbrot | Dinkelbrot | Knäckebrot
Semmel       → Semmel | Vollkornsemmel | Semmelbrösel | Knödelbrot | Roggenweckerl
Brötchen     → Semmel | Vollkornsemmel | Semmelbrösel | Knödelbrot | Roggenweckerl
Hackfleisch  → Faschiertes gemischt | Faschiertes gemischt, gebraten | Rindsfaschiertes | Schweinsfaschiertes
Faschiertes  → Faschiertes gemischt | Faschiertes gemischt, gebraten | Rindsfaschiertes | Schweinsfaschiertes
Sahne        → Kaffeeobers | Schlagobers | Sauerrahm 10 % | Sauerrahm 15 % | Sahnejoghurt 10 %
Obers        → Kaffeeobers | Schlagobers | Sauerrahm 10 % | Sauerrahm 15 % | Sahnejoghurt 10 %
Bohnen       → Käferbohnen | Sojabohnen, trocken | Kidneybohnen, gekocht | Kidneybohnen, trocken | Weiße Bohnen, gekocht
Butter       → Butter | Buttermilch | Butterschmalz | Toastbrot | Erdnussmus
Kürbis       → Kürbis, Hokkaido | Butternusskürbis | Kürbiskerne | Kürbiskernöl
Mais         → Mais | Mais aus der Dose | Polenta, gekocht | Polenta, trocken
Erbsen       → Erbsen, grün | Erbsen, getrocknet | Kichererbsen, gekocht | Kichererbsen, trocken | Kichererbsen aus der Dose
```

Die erste Probe mit der Suche aus D-356 zeigte die Schwächen, die D-357 behebt (§1 Nachtrag). „Ei“ findet an fünfter Stelle noch „Eisbergsalat“, weil die Suche beim Tippen Wortanfänge zeigt; die vier Ei-Einträge stehen davor.

### Geänderte Dateien

`docs/lebensmittel-auswahl.csv` (neu), `docs/licenses-data.md` (neu), `tools/lebensmittel_auswahl.py` (neu), `tools/bls_build.py` und `tools/data/bls-4.0.json` (zurück ins Repository, nur für Werkzeuge), `package.json` (Prüfung in `check:docs`), `docs/decisions.md` (D-358), `docs/data-sources.md` (Nachtrag), `docs/implementation-plan.md`, `docs/testing.md`, dieser Bericht.

### Tests mit Ergebnis

| Nachweis | Ergebnis |
|---|---|
| `python3 tools/lebensmittel_auswahl.py --check` | „lebensmittel-auswahl: 354 Einträge geprüft“ |
| Gegenprobe: Liste absichtlich verfälscht (BLS-Bezeichnung, Gruppe, Stückgewicht ohne Herkunft), danach zurückgesetzt | 3 Fehler gemeldet, Exit-Code 1: „BLS-Bezeichnung weicht ab (BLS: „Apfel roh“)“, „unbekannte Gruppe „Obstsorte““, „Stückgewicht ohne Herkunft“ |
| `tools/data/bls-4.0.json` gegen die Git-Historie | SHA-256 `4b1760d9…e3f0`, gleich wie `58dee8c^:src/modules/nutrition/data/bls-4.0.json` |
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` (jetzt mit der Listenprüfung) | ohne Befund |
| `pnpm test` | 117 Dateien, 1005 Tests bestanden (kein App-Code geändert) |
| `pnpm build`, `pnpm check:bundle` | Startansicht 234,3 KB von 250 KB, unverändert; die Liste ist nicht in der App |
| E2E, ganze Suite in Chromium (Desktop und Pixel 7) | 322 bestanden, 50 übersprungen, 0 fehlgeschlagen (11,8 min) |
| WebKit | CI-Lauf 40129250444 zu `72e9094`: erfolgreich |

---

## 5. §3 Salz, Zucker, gesättigte Fettsäuren, Ballaststoffe mit Referenz

### Ergebnis

Unter „Weitere Nährwerte“ in der Karte „Gegessen“ (weiterhin zugeklappt, wie in D-272 entschieden) steht je Wert eine Zeile „Ist von Referenz“:

| Wert | Anzeige | Referenz | Quelle |
|---|---|---|---|
| Salz | „0,3 g von höchstens 6 g“ | Referenzmenge für Erwachsene | VO (EU) Nr. 1169/2011 (LMIV), Anhang XIII Teil B |
| Zucker | „9,6 g von höchstens 90 g“ | Referenzmenge für Erwachsene, Gesamtzucker | ebenso |
| Gesättigte Fettsäuren | „5,4 g von höchstens 20 g“ | Referenzmenge für Erwachsene | ebenso |
| Ballaststoffe | „6,6 g von mindestens 30 g“ | Richtwert für Erwachsene | Deutsche Gesellschaft für Ernährung (DGE) |

- Unter jeder Zeile eine kurze Erklärung mit Quelle; am Ende die Quellen ausgeschrieben, die Grenze beim freien Zucker und „Allgemeine Orientierungswerte für Erwachsene, keine Ziele und keine medizinische Empfehlung“.
- **Freier Zucker:** WHO und DGE empfehlen weniger als 10 % der Energie. Die Nährwertangaben (BLS, Packungen, Open Food Facts) nennen nur den Gesamtzucker; der Wert wäre geschätzt. Die App zeigt ihn deshalb nicht und sagt das.
- **Kein Lob, keine Farbe:** Weder beim Einhalten noch beim Überschreiten ändert sich die Anzeige (Markenleitplanken Punkt 5: keine rote Markierung beim Überschreiten).
- **Fehlende Angaben zählen nicht als 0:** Die Summe gilt für die Einträge mit Wert. Die übrigen stehen darunter mit Namen: „Ohne Angabe, nicht mitgezählt: Apfel.“ (höchstens drei Namen, dann „und 2 weitere“). Fehlen dieselben Einträge bei allen vier Werten, etwa ein Schnelleintrag nur mit kcal, steht der Hinweis einmal. Hat kein Eintrag einen Wert, steht „keine Angabe“ statt „0 g“. Der bisherige Hinweis unter der Karte („Bei mindestens einem Eintrag fehlen Werte für …“) bleibt, damit man die Lücke auch zugeklappt sieht.
- **Aufbau:** eine Zeile je Wert statt der drei Spalten unter den Makros, weil „4 g von höchstens 6 g“ dort am Handy keinen Platz hat. Die Rechnung steht ohne React in `calc/references.ts`.

Die Beispielzahlen oben stammen aus einem Bildschirmfoto im Handyformat (390 pt, dunkel): Haferflocken 60 g, Joghurt 200 g und ein Schnelleintrag mit 450 kcal; bei allen vier Werten steht einmal „Ohne Angabe bei allen vier Werten, nicht mitgezählt: Schnelleintrag.“

### Geprüfte Quellen

| Angabe | Quelle |
|---|---|
| Zucker 90 g, gesättigte Fettsäuren 20 g, Salz 6 g als Referenzmengen für Erwachsene | VO (EU) Nr. 1169/2011, Anhang XIII Teil B „Referenzmengen für die Zufuhr von Energie und ausgewählten Nährstoffen“ (Rechtstext, per Websuche über gesetze.legal, freirecht.de und legislation.gov.uk geprüft) |
| Ballaststoffe mindestens 30 g am Tag | DGE, Referenzwert für Erwachsene (DGE-FAQ Ballaststoffe 2021) |
| Freier Zucker unter 10 % der Energie | WHO-Leitlinie „Sugars intake for adults and children“ (2015); Konsenspapier von DAG, DDG und DGE (2018) |

### Geänderte Dateien

`src/modules/nutrition/calc/references.ts` und `.test.ts` (neu), `src/modules/nutrition/ui/NutritionPage.tsx`, `src/shared/i18n/de-nutrition.ts` und `.test.ts`, `src/modules/nutrition/ui/nutrition-ui.test.tsx`, `e2e/nutrition.spec.ts`, `docs/decisions.md` (D-359), `docs/requirements.md` (AK-NUT-15), `docs/feature-inventory.md` und `.csv` (NU-28, Version 0.20), `docs/implementation-plan.md`, `docs/testing.md`, dieser Bericht.

### Tests mit Ergebnis

| Nachweis | Ergebnis |
|---|---|
| `src/modules/nutrition/calc/references.test.ts` (neu) | 6 bestanden: Referenzwerte und Quellen, Summe auf 0,1 g, fehlende Angaben nicht als 0, „keine Angabe“ ohne jeden Wert, Tag ohne Einträge, gemeinsamer Hinweis |
| `src/shared/i18n/de-nutrition.test.ts` | 6 bestanden, davon 4 neu: „höchstens“ und „mindestens“, höchstens drei Namen und „und 2 weitere“, gemeinsamer Hinweis, Quellen ohne Ausrufezeichen |
| `src/modules/nutrition/ui/nutrition-ui.test.tsx` | 16 bestanden, davon 2 neu: Ist und Referenz mit Quelle für Müsli und Apfel (Apfel ohne Salz, gesättigte Fettsäuren und Ballaststoffe wird genannt, nicht als 0 gezählt), „keine Angabe“ bei einem Schnelleintrag |
| Gegenprobe: die zwei neuen Komponententests gegen die alte Übersicht | 2 von 2 fehlgeschlagen, die übrigen 14 bestanden |
| `pnpm test` | 118 Dateien, 1017 Tests bestanden |
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | ohne Befund |
| `pnpm build`, `pnpm check:bundle` | Startansicht 234,2 KB von 250 KB |
| E2E `nutrition.spec.ts` (erweitert: Referenzen, Quelle, axe-Prüfung der aufgeklappten Liste), `nutrition-ring.spec.ts`, `network-a11y.spec.ts`, Chromium Desktop und Pixel 7, endgültiger Stand | 80 bestanden, 2 übersprungen, 0 fehlgeschlagen |
| E2E, ganze Suite in Chromium, Stand vor dem gemeinsamen Hinweis | 322 bestanden, 50 übersprungen, 0 fehlgeschlagen (12,3 min) |
| Gegenprobe: erweiterter E2E-Test gegen die alte Übersicht | 2 von 2 fehlgeschlagen: „Expected pattern: /von höchstens 6 g/“, erhalten „Salz0 gZucker1,6 gGesättigte Fettsäuren0 gBallaststoffe3,4 g“ |
| WebKit | CI-Lauf 40130994920 zu `5c98762`: erfolgreich |

---

## 6. §4 Einkaufsliste: Wischen zum Löschen

### Ergebnis

Jeder Artikel der Einkaufsliste (offen und gekauft, in „Meine Liste“ und „Nach Kategorie“) lässt sich mit einem Wisch nach links löschen, ohne „Bearbeiten“ zu öffnen.

| Anforderung | Umsetzung |
|---|---|
| Wisch nach links löscht, ohne Bearbeiten-Modus | Loslassen nach der Löschstrecke löscht; die Zeile gleitet hinaus |
| Dezente, eindeutige Löschaktion | Beim Wischen erscheint hinter der Zeile ein gedämpfter Papierkorb; ab der Löschstrecke „Löschen“ in der Warnfarbe auf schwacher Warnfläche |
| Nur dieser Artikel | Jede Zeile hat ihre eigene Geste; geprüft mit drei und mit 24 Artikeln |
| Senkrechtes Scrollen ungestört | `touch-action: pan-y`: Senkrecht scrollt der Browser selbst, die Zeile bekommt dann keine Bewegung. E2E mit echten Touch-Ereignissen (Chromium, Pixel 7): senkrechter Wisch über eine Zeile scrollt die Seite, nichts wird gelöscht |
| Kurzer oder schräger Wisch löst nichts aus | Nach den ersten 10 px entscheidet die Richtung einmal für die ganze Geste: nur klar waagrecht nach links (mindestens doppelt so weit zur Seite wie nach oben oder unten, flacher als etwa 27°). Gelöscht wird erst ab 40 % der Zeilenbreite, mindestens 96 px; am Handy (343 px) sind das 137 px. Kürzer gleitet die Zeile zurück |
| Danach Hinweis mit „Rückgängig“ | Derselbe Hinweis wie beim bisherigen Löschen: „„Milch“ gelöscht“ mit „Rückgängig“, 10 s |
| Tastatur und Screenreader | Der bisherige Weg bleibt: „Bearbeiten“ (Stift) und „Löschen“. Die Anzeige hinter der Zeile ist für Screenreader ausgeblendet |
| Pointer-Ereignisse, keine neue Abhängigkeit | `calc/swipe.ts` (Richtung, Verschiebung, Löschstrecke, ohne React) und `ui/SwipeToDelete.tsx` (Zeiger-Ereignisse, Zeigerfang) |

Zwei Dinge, die die Tests aufgedeckt haben und die behoben sind: (1) Mit der Maus schickte der Browser nach einem schrägen oder nach rechts gerichteten Ziehen, das auf derselben Zeile endete, einen Klick, der den Artikel abhakte. Jetzt gilt jede Bewegung über die ersten 10 px als Geste; der Klick danach wird verworfen, ein Tipp bleibt ein Tipp. Am Handy schickt der Browser nach einer Bewegung ohnehin keinen Klick. (2) Bewegung reduzieren: ohne Gleiten, das Löschen kommt sofort.

Schlägt das Löschen fehl (Datenbank), erscheint der bekannte Fehlerhinweis und die Zeile gleitet zurück.

Grenzen: Auf dem iPhone selbst ist das Wischen noch nicht geprüft; die E2E-Tests nutzen Maus (Chromium und WebKit) und echte Touch-Ereignisse nur in Chromium, weil WebKit in Playwright keine Touch-Bewegungen erzeugen kann.

### Geänderte Dateien

`src/modules/shopping/calc/swipe.ts` und `.test.ts` (neu), `src/modules/shopping/ui/SwipeToDelete.tsx` (neu), `src/modules/shopping/ui/ShoppingListPage.tsx`, `src/modules/shopping/ui/shopping-ui.test.tsx`, `e2e/shopping.spec.ts`, `docs/decisions.md` (D-360), `docs/requirements.md` (AK-NUT-16), `docs/feature-inventory.md` und `.csv` (NU-26, Version 0.21), `docs/shopping-list.md` (Abschnitt 6), `docs/implementation-plan.md`, `docs/testing.md`, dieser Bericht.

### Tests mit Ergebnis

| Nachweis | Ergebnis |
|---|---|
| `src/modules/shopping/calc/swipe.test.ts` (neu) | 5 bestanden: Entscheidung erst nach 10 px, nur klar waagrecht nach links, senkrecht, schräg (45° und knapp steiler als 2 : 1) und nach rechts nicht, Verschiebung nur nach links, Löschstrecke 40 % bzw. mindestens 96 px |
| `src/modules/shopping/ui/shopping-ui.test.tsx` | 10 bestanden, davon 4 neu: Wisch löscht nur diesen Artikel mit Rückgängig; kurz, schräg, senkrecht und nach rechts ohne Folgen; kein Abhaken durch den Klick nach einer Geste (waagrecht zu kurz und schräg), ein Tipp danach hakt ab; `touch-pan-y` und Löschen über „Bearbeiten“ |
| Gegenprobe: die vier neuen Komponententests gegen die alte Liste | 4 von 4 fehlgeschlagen, die übrigen 6 bestanden |
| Gegenprobe: Klick nach schrägem Wisch mit der ersten Fassung (Klick nur nach waagrechtem Wisch verworfen) | 1 von 10 fehlgeschlagen; deshalb gilt jetzt jede Bewegung über 10 px als Geste |
| `pnpm test` | 119 Dateien, 1026 Tests bestanden |
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | ohne Befund |
| `pnpm build`, `pnpm check:bundle` | Startansicht 234,4 KB von 250 KB; +0,1 KB gegenüber dem Stand ohne §4 durch neue CSS-Klassen in der gemeinsamen CSS-Datei (z. B. `touch-pan-y`), der Code der Liste wird nachgeladen |
| E2E `shopping.spec.ts`, Chromium Desktop und Pixel 7 | 9 bestanden, 1 übersprungen (Touch-Test nur in Chromium mit Touch): neu „Wisch nach links löscht nur diesen Artikel, mit Rückgängig; kurz, schräg und senkrecht nicht“ (Maus) und „echter Touch-Wisch löscht, senkrechtes Wischen scrollt die Seite“ (Touch-Ereignisse über das Chrome-Protokoll, 24 Artikel) |
| Erster E2E-Lauf vor der Behebung | 2 fehlgeschlagen: Desktop „Expected: 3, Received: 2“ (Maus-Klick nach schrägem Ziehen hakte ab, behoben, siehe oben); Pixel 7 „Expected: 2, Received: 1“ (Testdaten „Artikel 01“ wurden als „Artikel“ mit Menge 1 erkannt und als Doppelte abgelehnt; Testdaten geändert) |
| E2E, ganze Suite in Chromium, endgültiger Stand (mit §3) | 325 bestanden, 51 übersprungen, 0 fehlgeschlagen (12,9 min) |
| Bildschirmfotos im Handyformat (390 pt, dunkel) | während des Wischens gedämpfter Papierkorb, ab der Löschstrecke „Löschen“ auf schwacher Warnfläche, danach „„Bananen“ gelöscht“ mit „Rückgängig“ |
| WebKit | CI-Lauf 40133009248 zu `bce4e15`: alle vier Jobs grün, auch „E2E (webkit)“ mit dem Maus-Test zum Wischen |

---

## 7. Erste Übergabe (24.10.2026)

Laut Auftrag Abschnitt 5 war hier Halt: Abschnitte 0, 1 (mit Nachtrag), 2 (bis zur fertigen Liste), 3 und 4 sind erledigt, committet und gepusht. Abschnitt 6, der Einbau der Liste in die App, beginnt erst nach deiner Freigabe der Liste.

| Für dich | Wo |
|---|---|
| Auswahlliste zur Durchsicht (354 Zeilen, öffnet in Excel und Numbers) | `docs/lebensmittel-auswahl.csv` |
| Zusammenfassung: Anzahl je Gruppe, fehlende Lebensmittel, offene Fragen | Abschnitt 4 dieses Berichts |
| Lizenzen der Lebensmitteldaten | `docs/licenses-data.md` |
| Bericht zu §0, §1, §3 und §4 | Abschnitte 2, 3, 5 und 6 dieses Berichts |

Was die Freigabe braucht: deine Antworten auf die sieben offenen Fragen in Abschnitt 4 (am wichtigsten: Stückgewichte, fehlende Werte, Lücken) und Änderungen an der Liste, falls du welche hast. Du kannst die CSV direkt bearbeiten; `pnpm check:docs` prüft danach, ob Codes und BLS-Bezeichnungen noch stimmen.

Commits der Phase: `444d7f1` (D-353), `8f0a0dd` (D-354), `1f55e19` (D-355), `b7dfaec` (D-356), `6be7660` (D-357), `72e9094` (D-358), `5c98762` (D-359) und `bce4e15` (D-360). Gemergt wird nur nach deiner Freigabe.

---

## 8. Liste nach der Freigabe ergänzt (D-361)

### Ergebnis

Deine acht Entscheidungen vom 25.10.2026 sind in `docs/lebensmittel-auswahl.csv` eingearbeitet, die Liste hat jetzt 366 Zeilen. Drei Spalten kamen am Ende dazu, damit die CSV die einzige Quelle für die App bleibt: „Einheit“ (Stück, Scheibe, Zehe, Stange, Kolben; leer heißt nur Gramm), „Hinweis in der App“ und „Abgeleitete Werte“.

| Entscheidung | Umsetzung |
|---|---|
| 1 Stückgewichte | 79 Einträge mit Einheit bleiben ohne Gewicht, keine US-Werte; die App fragt beim ersten „Stück“ danach (§6) |
| 2 Herleitungen | Ei 51 g, Ei gekocht 51 g, Eiklar 33 g, Dotter 17 g und Semmel 46 g als bestätigt vermerkt; Hinweise „Größe M“, „Ei Größe M“ und bei der Semmel „Mindestgewicht, anpassbar“ |
| 3 Fehlende Werte | Regel: Ballaststoffe 0 g bei rein tierischen Lebensmitteln und reinen Fetten, Eiweiß und Kohlenhydrate 0 g bei reinen Fetten (Öle und Fette ab 99 g Fett). Abgeleitet sind 13 Werte: Ballaststoffe bei Crème fraîche, Feta, Mascarpone, Mozzarella, Ricotta, Lachs roh, Pangasius, Räuchermakrele, Seelachs, Thunfisch im eigenen Saft und Butter, Eiweiß bei Kokosöl und Schweineschmalz. „Fehlt“ bleiben: Fett bei Apfelringen, Dörrzwetschken, Ringlotten, Essiggurkerl, Orangen- und Apfelsaft, gesättigte Fettsäuren bei Bärlauch, Ballaststoffe bei Honig (enthält Pollen, USDA nennt 0,2 g), Margarine und Halbfettmargarine (weder rein tierisch noch reines Fett) |
| 4 Lücken | USDA SR28 für Pfefferoni (11670), Butternusskürbis (11485) und Magermilch (01151), Rohwerte in `tools/data/usda-sr28-auswahl.json`; rote Zwiebel als Suchbegriff bei Zwiebel; Käferbohnen, Knödelbrot, griechisches Joghurt 10 %, Sauerrahm 15 % und geschälte Hanfsamen kommen nicht in die App (Barcode oder eigenes Lebensmittel) |
| 5 Mehltypen | unverändert, österreichische Namen |
| 6 Neu aus dem BLS | Zucker, Honig, Marmelade, Haferdrink, Sojadrink, Mandeldrink, Orangensaft, Apfelsaft, Kochschinken, Rohschinken, Schweinsschulter, Leberkäse, Frankfurter; neue Gruppen „Wurst und Schinken“, „Zucker, Honig und Marmelade“, „Getränke“ |
| 7 Grenzfälle | bleiben |
| 8 Suchbegriffe | Kale, Röhrlsalat, Lachsforelle, Babyspinat, Rundkornreis, Risottoreis, Milchreis, Spätzle, Nockerl, Leichtmilch; bei den neuen Einträgen außerdem naheliegende Formen wie Hafermilch, Leberkas, Staubzucker |

USDA, umgerechnet nach den EU-Regeln (Kohlenhydrate ohne Ballaststoffe, Energie mit 4/4/9 und 2 kcal je g Ballaststoffe, Salz = Natrium × 2,5), je 100 g:

| Lebensmittel | kcal | Eiweiß | Kohlenhydrate | Fett | Ballaststoffe | Zucker | ges. Fettsäuren | Salz |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Pfefferoni | 45 | 2,0 | 7,96 | 0,2 | 1,5 | 5,1 | 0,02 | 0,02 |
| Butternusskürbis | 48 | 1,0 | 9,69 | 0,1 | 2,0 | 2,2 | 0,02 | 0,01 |
| Magermilch | 34 | 3,37 | 4,96 | 0,08 | 0 | 5,09 | 0,05 | 0,11 |

Bei der Magermilch nennt USDA mehr Zucker als Kohlenhydrate (nach Differenz); beide Werte bleiben, wie sie veröffentlicht sind. Den Eiweißfaktor gibt SR28 dort nicht an; mit dem EU-Faktor 6,25 statt 6,38 für Milch wären es rund 0,07 g weniger.

**Milch 1,5 %:** Der BLS-Eintrag „Milch fettarm, frisch, 1,5 % Fett, pasteurisiert“ (1,54 g Fett) passt zu den in Österreich üblichen Sorten (Websuche: Schärdinger Fettarme Milch 1,5 %, NÖM Leichtmilch 1,5 %). Eine Abweichung gibt es nur bei Nischensorten: Milch mit 0,9 % Fett (NÖM fasten) hat 0,6 g Fett und rund 5 kcal je 100 ml weniger, Magermilch mit 0,5 % Fett hat 0,4 g Fett und rund 4 kcal mehr als der USDA-Wert (0,08 g).

### Zusammenfassung je Gruppe

Ausgabe von `python3 tools/lebensmittel_auswahl.py`:

| Gruppe | Einträge | aus dem BLS | aus USDA | nicht in der App | Stückgewicht belegt | Stückgewicht offen |
|---|---:|---:|---:|---:|---:|---:|
| Obst | 46 | 46 | 0 | 0 | 0 | 26 |
| Gemüse | 75 | 73 | 2 | 0 | 0 | 27 |
| Erdäpfel | 6 | 6 | 0 | 0 | 0 | 5 |
| Hülsenfrüchte | 20 | 19 | 0 | 1 | 0 | 0 |
| Getreide und Getreideprodukte | 62 | 61 | 0 | 1 | 1 | 17 |
| Eier | 4 | 4 | 0 | 0 | 4 | 0 |
| Milch und Milchprodukte | 41 | 38 | 1 | 2 | 0 | 0 |
| Fleisch | 26 | 26 | 0 | 0 | 0 | 0 |
| Geflügel | 12 | 12 | 0 | 0 | 0 | 0 |
| Wurst und Schinken | 4 | 4 | 0 | 0 | 0 | 4 |
| Fisch | 28 | 28 | 0 | 0 | 0 | 0 |
| Nüsse und Samen | 21 | 20 | 0 | 1 | 0 | 0 |
| Öle und Fette | 13 | 13 | 0 | 0 | 0 | 0 |
| Zucker, Honig und Marmelade | 3 | 3 | 0 | 0 | 0 | 0 |
| Getränke | 5 | 5 | 0 | 0 | 0 | 0 |
| **Summe** | **366** | **358** | **3** | **5** | **5** | **79** |

### Geänderte Dateien

`docs/lebensmittel-auswahl.csv`, `tools/lebensmittel_auswahl.py` (neue Spalten, Gruppen, USDA-Angaben, Regel für abgeleitete Werte in beide Richtungen), `tools/data/usda-sr28-auswahl.json` (neu), `docs/licenses-data.md`, `docs/decisions.md` (D-361), `docs/implementation-plan.md`, `docs/testing.md`.

### Tests mit Ergebnis

| Nachweis | Ergebnis |
|---|---|
| `python3 tools/lebensmittel_auswahl.py --check` | „366 Einträge geprüft“ |
| Gegenproben an einer Kopie der Zeilen: Regel nicht angewandt (Feta), falsch angewandt (Honig, Margarine), Wert steht im BLS (Ei), Herkunft ohne Einheit, unbekannte Einheit, Hinweis ohne Einheit, falsche USDA-Nummer, falsche USDA-Bezeichnung, falsches Format | 10 von 10 gemeldet |
| `pnpm format:check`, `pnpm check:docs` | ohne Befund |

Beim Commit `baeac1e` ist versehentlich eine Python-Cache-Datei (`tools/__pycache__/…pyc`) mit ins Repository gekommen; der Commit zu §6 nimmt sie heraus, `.gitignore` schließt solche Dateien jetzt aus.

---

## 9. §6 Einbau der Grundauswahl (D-362)

### Ergebnis

Die freigegebene Liste ist in der App, ohne Import und auch offline. Ablauf: suchen → Ergebnis wählen → Menge in g oder Stück → Nährwerte prüfen → hinzufügen.

| Punkt | Umsetzung |
|---|---|
| Daten | `tools/lebensmittel_auswahl.py --build` erzeugt aus der CSV `src/modules/nutrition/data/basicFoods.json`: 361 Lebensmittel (358 aus dem BLS 4.0, 3 aus USDA SR28), ohne die fünf Lücken für Barcode oder eigenen Eintrag. `pnpm check:docs` meldet, wenn die Datei nicht zur CSV passt; wer die CSV ändert, baut die Datei mit `--build` neu |
| Nachladen und offline | eigener Teil von 47,3 KB (gzip 14,8 KB), erst im Ernährungsbereich geladen und vom Service Worker vorab gespeichert; Startansicht 234,5 KB von 250 KB |
| Suche | Grundauswahl nach den eigenen Lebensmitteln und vor importierten Daten, mit derselben Suche für alle Quellen und der Herkunft „BLS“ oder „USDA“. Dazu behoben: Halbe Wörter wie „Erdäp“, „Parad“, „Seel“ oder „Knob“ fanden vorher nichts, bis das Wort fertig war (Fehler aus D-356) |
| Menge in g oder Stück | Umschaltung „g“ / „Stück“ (bzw. Scheibe, Zehe, Stange, Kolben) bei den 84 Einträgen mit Einheit. Mit Stückgewicht aus der Liste ist „Stück“ vorgewählt: „1 Stück = 51 g · Größe M“, daneben „Gewicht ändern“ |
| Stückgewicht einmal angeben | Ohne Gewicht zuerst Gramm. „Stück“ öffnet das Feld „Gewicht für 1 Stück in g“, mit Fokus und dem Hinweis „Am genauesten ist eine Küchenwaage. FORM merkt sich das Gewicht für dieses Lebensmittel, du kannst es jederzeit ändern.“ Beim Hinzufügen wird das Gewicht gemerkt; beim nächsten Mal ist „Stück“ vorgewählt. Ein Gewicht gleich dem aus der Liste entfernt den eigenen Wert |
| Nährwerte und Quelle | Tabelle je 100 g und für die Menge; darunter „Quelle: BLS 4.0, E111100 „Hühnerei roh““ bzw. „Quelle: USDA SR28, 11670 „Peppers, hot chili, green, raw“, umgerechnet nach EU-Regeln“. Abgeleitete 0 g mit Sternchen und Erklärung, fehlende Werte als „–“, nicht als 0 |
| Eintrag | eingefrorene Werte (D-209), bei Stück als Portion mit Anzahl, z. B. „2 × Stück (102 g)“; Ring und weitere Nährwerte zeigen ihn sofort |
| Lizenzliste | „Mehr“ › „Über die App“ › „Lebensmitteldaten und Lizenzen“: BLS 4.0, USDA SR28, Belege der Stückgewichte, Open Food Facts, importierte Daten |

### Wo das gemerkte Stückgewicht liegt

In den Einstellungen, als neues Feld `pieceWeights` (ID des Lebensmittels → Gramm), synchronisiert und gesichert wie alle Einstellungen. Ich hatte zuerst eine eigene Tabelle erwogen und mich dagegen entschieden: Eine neue Dokumentart hätte ältere App-Versionen beim Abgleich angehalten (D-292), zum Beispiel die Produktivadresse, solange du die Vorschau mit demselben Konto testest. So gibt es keine neue Tabelle und keine neue Datenbankversion; ältere Versionen behalten das Feld und ignorieren es. Rückfall: Wird die Funktion zurückgenommen, bleibt das Feld ungenutzt liegen, nichts geht verloren. Grenze: Wie bei allen Einstellungen gewinnt beim Abgleich die jüngere Fassung des ganzen Dokuments.

### Grenzen

- Werte je 100 g, auch bei Getränken; bei Milch in ml liegt man um etwa 3 % daneben.
- In Rezepten gibt es „Stück“ nur, wenn das Gewicht schon bekannt ist; sonst Gramm.
- Den Lizenzhinweis des BLS aus dem Download konnte ich nicht wörtlich übernehmen: `blsdb.de` und `mri.bund.de` sind in der Netzwerkregel der Cloud-Sitzung gesperrt. Die App nennt die Zitierweise aus der BLS-Dokumentation (Abschnitt 9.3, Quellenangabe empfohlen) mit DOI. Bitte sieh im Download nach, ob dort eine Lizenz steht, die einen anderen Wortlaut verlangt.
- WebKit und das iPhone selbst sind noch nicht geprüft; WebKit läuft in der CI.

### Bilder

Im Handyformat (390 pt, dunkel) geprüft: Trefferliste zu „Eier“, Dialog „Ei hinzufügen“ mit 2 Stück und Quelle, Dialog „Apfel hinzufügen“ mit der Frage nach dem Gewicht, Feta mit abgeleitetem Wert, „Über die App“ mit der Lizenzliste.

### Geänderte Dateien

Neu: `src/modules/nutrition/data/basicFoods.json` (erzeugt), `src/modules/nutrition/data/basicFoods.ts` und `.test.ts`, `src/modules/nutrition/model/basicFood.ts`, `src/modules/nutrition/calc/pieces.ts` und `.test.ts`, `src/modules/nutrition/service/pieceWeightService.ts` und `.test.ts`, `src/modules/nutrition/ui/LogDialog.tsx` (aus `AddFoodPage.tsx` herausgelöst und erweitert), `e2e/basic-foods.spec.ts`. Geändert: `src/modules/nutrition/calc/foodSearch.ts` und `.test.ts`, `src/modules/nutrition/model/foodItem.ts`, `src/modules/nutrition/ui/useFoodCatalog.ts`, `AddFoodPage.tsx`, `NutrientTable.tsx`, `nutrition-ui.test.tsx`, `src/modules/settings/model/settings.ts`, `data/settingsRepository.ts`, `index.ts`, `ui/AboutPage.tsx`, `src/app/app.test.tsx`, `src/shared/i18n/de-nutrition.ts` und `de-more.ts`, `e2e/nutrition.spec.ts` (Suchtest für importierte Daten neben der Grundauswahl), `tools/lebensmittel_auswahl.py` (`--build`, Abgleich in `--check`), `.prettierignore`, `.gitignore`. Unterlagen: `docs/decisions.md` (D-362), `docs/requirements.md` (AK-NUT-17 bis AK-NUT-19), `docs/feature-inventory.md` und `.csv` (NU-21, NU-25, NU-29, Version 0.22), `docs/data-model.md`, `docs/licenses-data.md`, `docs/known-limitations.md`, `docs/implementation-plan.md`, `docs/testing.md`, dieser Bericht.

### Tests mit Ergebnis

| Nachweis | Ergebnis |
|---|---|
| `src/modules/nutrition/data/basicFoods.test.ts` (neu) | 22 bestanden: 361 Einträge ohne die Lücken, feste IDs wie beim früheren BLS, Stückgewichte, Einheiten, Hinweise und Suchbegriffe aus der Liste, BLS-Werte unverändert und fehlende als fehlend, 13 abgeleitete Werte, USDA nach EU-Regeln, Lizenzliste je Quelle, einmaliges Nachladen, Ablehnung falscher Dateien; Suche nach Apfel, Äpfel, Aepfel, apfel, Ei, Eier, Tomate, Tomaten, Paradeiser, Erdäpfel und Topfen, Suchbegriffe der Liste, Suche beim Tippen |
| `calc/pieces.test.ts`, `service/pieceWeightService.test.ts` (neu) | 5 und 6 bestanden: Rundung und Grenzen, eigenes vor Listengewicht, Stück-Portion, gemerkte Gewichte, nur Änderungen schreiben, Listenwert entfernt den eigenen, übrige Einstellungen und Felder neuerer Versionen bleiben |
| `calc/foodSearch.test.ts` | 20 bestanden, davon 1 neu (falsche Freunde beim Antippen) |
| `ui/nutrition-ui.test.tsx` | 19 bestanden, davon 3 neu (zwei Eier als Stück mit Ring und weiteren Nährwerten, Gewicht einmal angeben mit Fokus, merken und ändern, abgeleitete Werte und USDA-Quelle); ein bisheriger Test erwartet jetzt die Grundauswahl vor dem Import |
| `src/app/app.test.tsx` | 26 bestanden, davon 1 neu (Lizenzliste unter „Über die App“) |
| Gegenprobe: Tipp-Tests gegen die Suche vor §6 | 2 von 2 fehlgeschlagen („Erdäp“ fand nichts) |
| Gegenprobe: Fokus-Prüfung ohne Fokus-Logik | 1 von 19 fehlgeschlagen |
| `pnpm test` | 122 Dateien, 1064 Tests bestanden |
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | ohne Befund |
| `pnpm build`, `pnpm check:bundle` | Startansicht 234,5 KB von 250 KB; Grundauswahl als eigener Teil 47,3 KB (gzip 14,8 KB), im Service Worker vorab gespeichert |
| E2E `basic-foods.spec.ts` (neu), Chromium Desktop und Pixel 7 | 8 bestanden: Suche nach den zehn Begriffen des Auftrags ohne Scheintreffer und beim Tippen; zwei Eier als Stück mit Ring „138 von 2.200 kcal“ und weiteren Nährwerten sofort; Stückgewicht einmal angeben (Fokus im Gewichtsfeld, Dialog ohne axe-Verstoß nach WCAG 2.1 AA), nach Neuladen gemerkt; offline suchen und eintragen. Der erste Lauf mit der axe-Prüfung scheiterte 2-mal am Test selbst (Selektor `[role="dialog"]` statt `dialog[open]`), danach 8 von 8 bestanden |
| E2E, ganze Suite in Chromium (Stand vor der Fokus-Verbesserung) | 333 bestanden, 51 übersprungen, 0 fehlgeschlagen (8,3 min) |
| E2E mit dem Endstand: `basic-foods`, `nutrition`, `nutrition-ring`, `shopping` (Wischen zum Löschen mit Rückgängig, Scrollen ungestört), `network-a11y` | 97 bestanden, 3 übersprungen, 0 fehlgeschlagen |
| WebKit, CI-Lauf 40170203278 zu `c117ec8` | rot: 2 fehlgeschlagen, beide „Stückgewicht einmal angeben“ (webkit-desktop und webkit-mobile) an `toBeFocused()`, „Received: inactive“; 319 bestanden, 62 übersprungen, 1 wackelnd („Tab-Leiste: Die Linse legt sich … binnen 2 s ab“, 2067 statt 2000 ms, im zweiten Versuch bestanden, nicht von §6). Alle übrigen neuen Tests bestanden auch in WebKit |

### Nachtrag: Fokus des Gewichtsfelds in WebKit

Ursache: Nach dem Klick auf ein Label setzt WebKit den Fokus erst nach dem Klick auf dessen Optionsfeld. Die App hatte das Gewichtsfeld schon während des Klicks fokussiert, danach nahm WebKit den Fokus wieder weg. Jetzt setzt die App den Fokus mit einem Zeitgeber nach der Standardbehandlung des Tipps. Ein Zeitgeber unter einer Sekunde behält in WebKit die Geste des Tipps, auf dem iPhone darf die Tastatur also aufgehen; das ist am Gerät noch zu prüfen.

| Nachweis | Ergebnis |
|---|---|
| Neuer Komponententest: Reihenfolge wie in WebKit (Klick aufs Optionsfeld, danach dessen Fokus) | mit der Korrektur bestanden; Gegenprobe mit dem sofortigen Fokus fehlgeschlagen |
| `nutrition-ui.test.tsx` | 20 bestanden |
| `pnpm test` | 122 Dateien, 1065 Tests bestanden |
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck` | ohne Befund |
| E2E `basic-foods.spec.ts`, Chromium Desktop und Pixel 7 | 8 bestanden |
| WebKit, CI-Lauf 40171590098 zu `9c851b1` | alle vier Jobs grün; „E2E (webkit)“ 322 bestanden, 62 übersprungen, 0 fehlgeschlagen, nichts wackelnd |

---

## 10. Übergabe und Halt

Abschnitt 6 ist erledigt, committet und gepusht; laut Auftrag ist hier Halt. Gemergt wird nur nach deiner Freigabe.

| Für dich | Wo |
|---|---|
| Ergänzte Liste (366 Zeilen) | `docs/lebensmittel-auswahl.csv` |
| Bericht zur Ergänzung und zu §6 | Abschnitte 8 und 9 dieses Berichts |
| Lizenzen und Rechenregeln | `docs/licenses-data.md` |

Offen bei dir:
1. **Lizenzhinweis des BLS:** im Download nachsehen, ob er einen bestimmten Wortlaut verlangt (Abschnitt 9, Grenzen).
2. **Gerätetest:** auf dem iPhone einmal „Apfel“ als Stück eintragen (Gewicht angeben), dann erneut öffnen; dazu ein Ei mit 2 Stück.
3. **Vorschau und Abgleich:** Das gemerkte Stückgewicht liegt in den Einstellungen; ältere Versionen gleichen weiter ab. Du kannst die Vorschau also mit deinem Konto testen.

Commits der Phase: `444d7f1` (D-353), `8f0a0dd` (D-354), `1f55e19` (D-355), `b7dfaec` (D-356), `6be7660` (D-357), `72e9094` (D-358), `5c98762` (D-359), `bce4e15` (D-360), `baeac1e` (D-361), `c117ec8` (D-362) und `9c851b1` (D-362, Nachtrag Fokus in WebKit).

---

## 11. Abschluss §1: „Weitere Nährwerte“ kompakt (D-363)

Auftrag: `docs/prompts/ernaehrung-abschluss-FORM.md` vom 25.10.2026. Er ersetzt alle offenen Ernährungs-Anweisungen.

### Ergebnis

| Punkt | Umsetzung |
|---|---|
| Zeilen | je Wert nur Name und „Ist / Referenz g“, z. B. „Salz 0,3 / 6 g“, „Zucker 9,6 / 90 g“, „Gesättigte Fettsäuren 5,4 / 20 g“, „Ballaststoffe 6,6 / 30 g“; ohne „von höchstens/mindestens“, Erklärzeilen, Quellenabsatz und Hinweise auf fehlende Werte |
| Einzeilig | Name links, Zahl rechts, kein Umbruch. Gemessen: Die Liste ist bei 360 pt 288 px breit, bei 390 pt 318 px. Die breiteste Zeile („Gesättigte Fettsäuren 125* / 20 g“) braucht mit Inter 223 px, mit der breiten DejaVu Sans 241 px. Der volle Name passt also bei 360 pt; „Ges. Fettsäuren“ steht erst, wenn die Liste schmaler als 16 rem ist (etwa 320 pt). Screenreader lesen immer den vollen Namen |
| Fehlende Werte | Sternchen hinter der Zahl, z. B. „0,5* / 6 g“, vorgelesen „nicht bei allen Einträgen angegeben“; ohne jede Angabe „–* / 6 g“. Fehlende Werte zählen weiter nicht als 0 |
| Info-Blatt | kleines Info-Symbol neben der Überschrift („Erklärung und Quellen“), öffnet ein Blatt: Referenz je Wert („Salz: höchstens 6 g“, „Ballaststoffe: mindestens 30 g“) mit kurzer Erklärung, das Sternchen, „Ohne Angabe an diesem Tag“ mit den Namen, die Quellen und die Grenze beim freien Zucker |
| Hinweis unter den Makros | „Bei mindestens einem Eintrag fehlen Werte für …“ nennt nur noch Eiweiß, Kohlenhydrate und Fett und steht direkt unter ihnen, über dem Pfeil. Die vier weiteren Werte tragen das Sternchen; der lange Satz unter der kompakten Liste wäre doppelt gewesen (beim ersten Bildschirmfoto aufgefallen) |

### Geänderte Dateien

Neu: `src/modules/nutrition/ui/ExtrasPanel.tsx`, `docs/prompts/ernaehrung-abschluss-FORM.md` (Auftrag). Geändert: `src/modules/nutrition/ui/NutritionPage.tsx`, `src/shared/i18n/de-nutrition.ts` und `.test.ts`, `src/modules/nutrition/ui/nutrition-ui.test.tsx`, `e2e/narrow-layout.spec.ts`, `e2e/nutrition.spec.ts`, `e2e/basic-foods.spec.ts`, `e2e/nutrition-ring.spec.ts`. Unterlagen: `docs/decisions.md` (D-363), `docs/requirements.md` (AK-NUT-15), `docs/feature-inventory.md` und `.csv` (NU-28, Version 0.23), `docs/implementation-plan.md`, `docs/testing.md`, dieser Bericht.

### Tests mit Ergebnis

| Nachweis | Ergebnis |
|---|---|
| `de-nutrition.test.ts`, `nutrition-ui.test.tsx` | 5 und 20 bestanden; neu gefasst: kompakte Zeilen mit Sternchen, Info-Blatt mit Erklärung, Einträgen ohne Angabe und Quellen, „–*“ ohne jede Angabe, Hinweis unter den Makros nur für Eiweiß, Kohlenhydrate und Fett |
| Gegenprobe: die zwei neu gefassten Komponententests gegen die alte Liste | 2 von 2 fehlgeschlagen („expected '35 g von höchstens 90 g' to be '35 / 90 g'“) |
| `pnpm test` | 122 Dateien, 1064 Tests bestanden |
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm check:docs` | ohne Befund |
| `pnpm build`, `pnpm check:bundle` | Startansicht 234,6 KB von 250 KB |
| E2E `narrow-layout.spec.ts` (neu: „Weitere Nährwerte: jede Zeile einzeilig“ bei 320, 360 und 390 pt, Pixel 7) | 3 bestanden; im Desktop-Projekt wie die übrigen schmalen Breiten übersprungen. Der erste Lauf scheiterte 3-mal am Test selbst (erwarteter Text ohne den Vorlesetext des Sternchens), danach bestanden |
| E2E `nutrition.spec.ts` (Info-Blatt, axe nach WCAG 2.1 AA für die aufgeklappte Liste und das Blatt ohne Verstoß), `basic-foods.spec.ts`, `nutrition-ring.spec.ts`, `network-a11y.spec.ts`, `narrow-layout.spec.ts` mit dem Endstand | 103 bestanden, 11 übersprungen, 0 fehlgeschlagen |
| E2E, ganze Suite (Chromium), Stand vor dem Hinweis unter den Makros | 336 bestanden, 54 übersprungen, 0 fehlgeschlagen (10,0 min) |
| WebKit | in der CI nach dem Push |
