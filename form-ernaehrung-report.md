# Phase Ernährung – Bericht

Stand: 24.10.2026 · Branch `form-ernaehrung` (Basis `6612f17`, `main` nach PR #50), Entwurfs-PR #51 · Auftrag: `docs/prompts/ernaehrung-FORM.md` (neuer Gesamtauftrag vom 24.10.2026; er ersetzt den ersten Auftrag vollständig, der in `444d7f1` steht). Aufbau wie `form-stabilitaet-report.md`.

Regeln: Ein Commit je Abschnitt mit D-Nummer, nach jedem Abschnitt Tests, sofort pushen. Startansicht unter 250 KB, Lebensmitteldaten nur nachgeladen. Keine Nährwerte erfinden, jede Zahl hat eine Quelle. Texte nach `form-markenleitplanken.md`. Nur Getestetes gilt als fertig; Testergebnisse stehen wörtlich je Abschnitt. Reihenfolge laut Auftrag: 0, 1, 2 (bis zur fertigen CSV), 3, 4, dann Halt bis zur Freigabe der Liste; Abschnitt 6 (Einbau) erst danach.

---

## 1. Abschnitte

| Abschnitt | Ergebnis | Entscheidung | Stand |
|---|---|---|---|
| Phasenstart | CI auf `main` (Lauf 40119684695) grün geprüft, Branch und Entwurfs-PR, `CLAUDE.md` mit Phase und Regel für neue Tabellen | D-353 | erledigt |
| §0 Stand prüfen und umsteuern | Bestand aufgenommen; der lokal angefangene Einbau (BLS-Auszug per Filter, USDA-Stückgewichte, Laden in der App) zurückgenommen; Ursachenanalyse und BLS-Rohdaten behalten | D-355 | erledigt |
| §1 Warum die Suche heute nichts findet | Ursache belegt (D-354): keine Daten für lose Lebensmittel seit D-279, Schwächen der Suche | D-354 | Analyse erledigt, Behebung folgt |

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
