# Phase Ernährung – Bericht

Stand: 24.10.2026 · Branch `form-ernaehrung` (Basis `6612f17`, `main` nach PR #50), Entwurfs-PR #51 · Auftrag: `docs/prompts/ernaehrung-FORM.md` (neuer Gesamtauftrag vom 24.10.2026; er ersetzt den ersten Auftrag vollständig, der in `444d7f1` steht). Aufbau wie `form-stabilitaet-report.md`.

Regeln: Ein Commit je Abschnitt mit D-Nummer, nach jedem Abschnitt Tests, sofort pushen. Startansicht unter 250 KB, Lebensmitteldaten nur nachgeladen. Keine Nährwerte erfinden, jede Zahl hat eine Quelle. Texte nach `form-markenleitplanken.md`. Nur Getestetes gilt als fertig; Testergebnisse stehen wörtlich je Abschnitt. Reihenfolge laut Auftrag: 0, 1, 2 (bis zur fertigen CSV), 3, 4, dann Halt bis zur Freigabe der Liste; Abschnitt 6 (Einbau) erst danach.

---

## 1. Abschnitte

| Abschnitt | Ergebnis | Entscheidung | Stand |
|---|---|---|---|
| Phasenstart | CI auf `main` (Lauf 40119684695) grün geprüft, Branch und Entwurfs-PR, `CLAUDE.md` mit Phase und Regel für neue Tabellen | D-353 | erledigt |
| §0 Stand prüfen und umsteuern | Bestand aufgenommen; der lokal angefangene Einbau (BLS-Auszug per Filter, USDA-Stückgewichte, Laden in der App) zurückgenommen; Ursachenanalyse und BLS-Rohdaten behalten | D-355 | erledigt |
| §1 Warum die Suche heute nichts findet | Ursache belegt (D-354): keine Daten für lose Lebensmittel seit D-279, Schwächen der Suche. Suche neu für jede Datenquelle: Umlautschreibweisen, Einzahl und Mehrzahl, Synonyme in beide Richtungen, Grundwörter, Rang nach Stellung im Namen, lose vor Marke, keine Dubletten | D-354, D-356 | erledigt; Unit-Tests und E2E in Chromium bestanden, Gegenprobe am alten Stand rot; WebKit in der CI |

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
| BLS 4.0 als Rohdaten: `tools/data/bls-4.0.json` (byte-gleich mit `58dee8c^:src/modules/nutrition/data/bls-4.0.json`, 7.140 Lebensmittel, acht Nährwerte), `tools/bls_build.py` (Umwandlung aus der Excel-Datei, D-261) | lokal | behalten, kommt mit §2 | Grundlage der Auswahlliste |

In die App eingebaut war vom zurückgenommenen Teil nichts: Keiner der lokalen Stände wurde committet oder gepusht, `main` und der Entwurfs-PR enthalten ihn nicht.

### Geänderte Dateien

`docs/prompts/ernaehrung-FORM.md` (neuer Auftrag), `form-ernaehrung-report.md` (neu gegliedert), `docs/decisions.md` (D-355, D-354 mit neuem Abschnittsbezug), `docs/implementation-plan.md` (Punkt 67).

### Tests mit Ergebnis

Nur Unterlagen, kein Code geändert. `pnpm format:check` und `pnpm check:docs` siehe Commit.

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
| WebKit | in der CI zum Commit |
