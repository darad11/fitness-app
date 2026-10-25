# Lizenzen der Lebensmitteldaten

Stand: 25.10.2026 · Bezug: D-358 und D-361 (Phase Ernährung §2), D-365 (Richtwerte je Stück), `data-sources.md`, `lebensmittel-auswahl.csv`

Dieses Dokument hält fest, woher die Lebensmitteldaten der App stammen, unter welchen Bedingungen sie genutzt werden und wie die Quelle genannt wird. Der Produktinhaber hat die Auswahlliste am 25.10.2026 freigegeben (D-361); eingebaut ist sie seit Phase Ernährung §6 (D-362). Die Quelle steht an jedem Eintrag (unter der Nährwerttabelle beim Eintragen) und unter „Mehr“ › „Über die App“ › „Lebensmitteldaten und Lizenzen“.

## 1. Bundeslebensmittelschlüssel (BLS) 4.0, Hauptquelle

| Punkt | Angabe |
|---|---|
| Herausgeber | Max Rubner-Institut (MRI), Bundesforschungsinstitut für Ernährung und Lebensmittel, Karlsruhe |
| Version | 4.0, veröffentlicht im Dezember 2025, rund 7.140 Lebensmittel und 138 Nährstoffe; DOI 10.25826/Data20251217-134202-0 |
| Nutzungsbedingungen | Laut BLS-Dokumentation Abschnitt 9.3 kostenfrei und ohne Lizenzbarrieren nutzbar, auch für die Entwicklung von Apps; eine Quellenangabe wird empfohlen. Geprüft im Prüfspike S-2 am 19.10.2026 an der Datei `BLS_4_0_2025_DE.zip` des Produktinhabers (D-261) |
| Lizenzbezeichnung | Laut Websuche vom 18.10.2026 CC BY 4.0 (Namensnennung), siehe `data-sources.md`. Websuchen am 24. und 25.10.2026 bestätigten die kostenfreie Freigabe (Gebühr vollständig entfallen, Open Data), nannten die Lizenzbezeichnung aber nicht. Den Lizenzhinweis aus dem Download wörtlich zu übernehmen, war in der Sitzung vom 25.10.2026 nicht möglich: `blsdb.de` und `mri.bund.de` sind in der Netzwerkregel der Cloud-Sitzung gesperrt. Entscheidung (Auftrag vom 25.10.2026, §4, D-366): Die Nachricht des Produktinhabers nennt keinen eigenen Wortlaut, deshalb bleibt die Zitierweise mit DOI aus der BLS-Dokumentation |
| Genutzte Felder | Code, Bezeichnung und acht Nährwerte je 100 g: Energie (ENERCC), Eiweiß (PROT625), Kohlenhydrate verfügbar (CHO), Zucker (SUGAR), Fett (FAT), gesättigte Fettsäuren (FASAT), Ballaststoffe (FIBT), Salz (NACL) |
| Änderungen | Auf acht Nährwerte gekürzt, Werte auf höchstens zwei Nachkommastellen gerundet (`tools/bls_build.py`); Auswahl von 358 Einträgen; eigene Anzeigenamen (österreichisch), Suchbegriffe, Gruppen und Richtwerte je Stück (D-365, Abschnitt 3). Die BLS-Werte selbst bleiben unverändert; fehlende Werte bleiben fehlend, außer in den Fällen der Regel unten (0 g, als abgeleitet gekennzeichnet) |
| Ablage | `tools/data/bls-4.0.json` (Rohdaten für Werkzeuge, nicht in der App), `docs/lebensmittel-auswahl.csv` (Auswahl mit BLS-Code und BLS-Bezeichnung je Zeile), `src/modules/nutrition/data/basicFoods.json` (Datei der App, aus der CSV erzeugt, D-362) |

Namensnennung in der App (D-362, „Über die App“ › „Lebensmitteldaten und Lizenzen“):

> Nährwerte der Grundauswahl: Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0, Karlsruhe, DOI 10.25826/Data20251217-134202-0. Kostenfrei nutzbar, auch in Apps, mit Quellenangabe. Gekürzt auf acht Nährwerte, ergänzt um österreichische Namen, Suchbegriffe und Richtwerte je Stück.

Je Eintrag (unter der Nährwerttabelle beim Eintragen): „Quelle: BLS 4.0, <BLS-Code> „<BLS-Bezeichnung>““, mit geschütztem Leerzeichen zwischen Zahl und Prozentzeichen (D-366). Die volle Zitierweise mit DOI steht unter „Über die App“; so bleibt es, solange der Produktinhaber keinen anderen Wortlaut nennt (D-366).

### Rechenregeln im Vergleich mit der EU (LMIV)

Geprüft am 24.10.2026 an den 345 BLS-Einträgen der Auswahl; Bericht `form-ernaehrung-report.md` §2.

| Regel der LMIV | BLS 4.0 | Ergebnis |
|---|---|---|
| Kohlenhydrate ohne Ballaststoffe | Feld CHO „Kohlenhydrate, verfügbar“ | passt, keine Umrechnung |
| Energie mit 4 kcal/g Eiweiß und Kohlenhydrate, 9 kcal/g Fett, 2 kcal/g Ballaststoffe | ENERCC ist berechnet; in der Auswahl weicht er im Median um 0,4 kcal von 4·Eiweiß + 4·Kohlenhydrate + 9·Fett + 2·Ballaststoffe ab (273 von 339 vollständigen Einträgen innerhalb ±2 kcal); ohne den Ballaststoffanteil wären es im Median 4,2 kcal | passt, keine Umrechnung; größere Abweichungen nur bei Obst mit viel Fruchtsäure und bei Sauerkraut |
| Salz = Natrium × 2,5 | Feld NACL, laut BLS-Dokumentation Abschnitt 5.8 aus Natrium × 2,5 | passt, keine Umrechnung |

### Fehlende Werte: Regel für abgeleitete Werte (D-361)

Entscheidung des Produktinhabers vom 25.10.2026. Fehlt in der Quelle ein Wert, zählt die App ihn nicht als 0, sondern zeigt „fehlt“. Nur in zwei Fällen ist er 0 g, in der Liste in der Spalte „Abgeleitete Werte“ und in der App als abgeleitet gekennzeichnet:

| Nährstoff | 0 g bei | Grund |
|---|---|---|
| Ballaststoffe | rein tierischen Lebensmitteln (Gruppen Eier, Milch und Milchprodukte, Fleisch, Geflügel, Wurst und Schinken, Fisch; dazu Butter, Butterschmalz, Schweineschmalz) und reinen Fetten | Ballaststoffe stammen nur aus Pflanzen |
| Eiweiß, Kohlenhydrate | reinen Fetten (Gruppe Öle und Fette, mindestens 99 g Fett je 100 g) | reines Fett enthält beides nicht |

Betroffen sind 13 Werte (Liste in D-361). Honig, Margarine und Halbfettmargarine fallen nicht unter die Regel; ihre fehlenden Ballaststoffe bleiben „fehlt“. `tools/lebensmittel_auswahl.py` prüft die Regel in beide Richtungen.

## 2. USDA, nur für Lücken und als Gegenprobe

| Punkt | Angabe |
|---|---|
| Herausgeber | U.S. Department of Agriculture, Agricultural Research Service: USDA National Nutrient Database for Standard Reference, Release 28 (SR28, 2015); bei den genutzten Einträgen gleich mit Release 24 |
| Nutzungsbedingungen | Daten einer US-Bundesbehörde, gemeinfrei (FoodData Central: CC0 1.0); Quellenangabe erbeten |
| Nährwerte | Nur für drei Lebensmittel, die im BLS fehlen und für die der Produktinhaber USDA gewählt hat (D-361): Pfefferoni (11670 „Peppers, hot chili, green, raw“), Butternusskürbis (11485 „Squash, winter, butternut, raw“), Magermilch (01151 „Milk, nonfat, fluid, without added vitamin A and vitamin D (fat free or skim)“). Quelle je Eintrag „USDA SR28“ mit Nummer und Bezeichnung |
| Umrechnung nach EU-Regeln | Kohlenhydrate = Kohlenhydrate nach Differenz minus Ballaststoffe (SR rechnet sie mit), Energie = 4 × Eiweiß + 4 × Kohlenhydrate + 9 × Fett + 2 × Ballaststoffe in ganzen kcal, Salz = Natrium × 2,5. Eiweiß bleibt, wie veröffentlicht (Stickstofffaktor 6,25 bei 11670 und 11485, bei 01151 nicht angegeben; mit 6,25 statt 6,38 wären es rund 0,07 g weniger) |
| Richtwerte je Stück | Nur als Gegenprobe, nie übernommen (Auftrag vom 25.10.2026, D-365). Die früheren Werte für Eiklar (33 g) und Dotter (17 g) aus SR 01124 und 01125 sind ersetzt durch das Schweizer Ernährungsbulletin 2021 (35 g und 17 g, Abschnitt 3) |
| Ablage | `tools/data/usda-sr28-auswahl.json` mit den Rohwerten je 100 g wie veröffentlicht (aus `ABBREV.txt` und `FOOD_DES.txt`) |

Namensnennung in der App (D-362, D-365, „Über die App“): „Pfefferoni, Butternusskürbis und Magermilch: U.S. Department of Agriculture, Agricultural Research Service (2015): USDA National Nutrient Database for Standard Reference, Release 28. Gemeinfrei. Nährwerte nach EU-Regeln umgerechnet. Bei den Richtwerten je Stück nur zum Vergleich.“ Je Eintrag: „Quelle: USDA SR28, <Nummer> „<Bezeichnung>“, umgerechnet nach EU-Regeln“.

## 3. Belege der Richtwerte je Stück (D-365)

47 Einträge der Liste haben einen Richtwert für 1 Stück, 1 Scheibe oder 1 Zehe: mittlere Größe, essbarer Anteil. Die Herleitung steht je Eintrag in der Spalte „Herkunft des Stückgewichts“ von `lebensmittel-auswahl.csv`, in der Reihenfolge des Auftrags: Stufe 1 BLS oder seine Dokumentation (nennt keine Stückgewichte, nur „je 100 g essbarer Anteil“), Stufe 2 Vermarktungsnormen und Österreichisches Lebensmittelbuch, Stufe 3 anerkannte europäische Nährwert- oder Portionstabellen. USDA nur als Gegenprobe. Übernommen sind nur einzelne, zitierte Zahlen, keine Datenbank. Gesucht wurde am 25.10.2026 per Websuche; die PDFs selbst ließen sich in der Cloud-Sitzung nicht öffnen.

| Quelle | Stufe | Wofür |
|---|---|---|
| Delegierte Verordnung (EU) 2023/2465 (Vermarktungsnormen für Eier; vorher VO (EG) Nr. 589/2008): Gewichtsklasse M = 53 bis unter 63 g | 2 | Größe des Eis |
| Österreichisches Lebensmittelbuch, Codex-Kapitel B 18 „Backerzeugnisse“ (auch Fassung Dezember 2025): Mindestausbackgewicht der Semmel 46 g; Seite „Kaisersemmel“ des Landwirtschaftsministeriums (bmluk.gv.at) | 2 | Semmel |
| Schweizer Nährwerttabelle 2021 (Schweizerische Gesellschaft für Ernährung SGE, Bundesamt für Gesundheit BAG, ETH Zürich), Tabelle „Durchschnittliche Gewichte verschiedener Lebensmittel (essbarer Anteil)“, Richtwerte für mittelgroße Exemplare | 3 | Hauptquelle für Obst, Gemüse, Brot, Knäckebrot |
| Prüße, Hüther, Hohgardt: Mittlere Gewichte einzelner Obst- und Gemüseerzeugnisse, BVL-Erhebung Braunschweig 2001/02 (Gesunde Pflanzen 56, 2004); viele Werte der Schweizer Tabelle stammen daraus | 3 | Bezug der Schweizer Werte, Marillen (essbarer Anteil 50,0 g bei 53,6 g Gesamtgewicht), Gegenproben |
| Schweizer Ernährungsbulletin 2021 (BLV), Eier: Ei ohne Schale 51 g, Eigelb 17 g, Eiweiss 35 g | 3 | Ei, Ei gekocht, Eiklar, Dotter |
| CoFID (Composition of Foods Integrated Dataset, Vereinigtes Königreich): essbarer Anteil Apfel 0,87, Birne 0,85 | 3 | Apfel und Birne ohne Kerngehäuse |
| DTU Fødevareinstituttet (2013): Mål, vægt og portionsstørrelser på fødevarer (Dänemark): Schälverlust Erdäpfel 15 %, Käse in Scheiben 20 g, Schalenanteil Ei 10 % | 3 | Erdäpfel geschält, Käsescheiben, Gegenproben |
| NICE und NUBEL (Belgien), Voedingscentrum und Veggipedia (Niederlande), DGE 2004 | 3 | Käsescheiben (NICE), Reiswaffeln (Voedingscentrum), Gegenproben |

Gestrichen (keine Einheit, nur Gramm), weil die Werte zu stark schwanken oder sich widersprechen oder keine europäische Quelle eine Stückangabe nennt: Mandarine (40 und 60 g), Zitrone und Limette (meist nur Saft), Mango (Größenklassen 200 bis 800 g), Weckerl, Laugengebäck (im Handel 63 bis 130 g), Toastbrot und Vollkorntoast (20 bis 35 g), Kochschinken (30 und 45 g), gekochte Erdäpfel (keine Quelle für das Gewicht nach dem Kochen) sowie alle übrigen Einträge, die vorher „offen“ waren. Liste: `form-ernaehrung-report.md` Abschnitt 13.

## 4. Andere Datenquellen der App

| Quelle | Lizenz | Nutzung | Namensnennung |
|---|---|---|---|
| Open Food Facts | Datenbank ODbL, Einzelinhalte Database Contents License | Nur per Barcode nach Einwilligung (D-266); Treffer werden lokal gespeichert und nicht veröffentlicht | „Daten: Open Food Facts, Open Database License (ODbL)“ in der App |
| ÖNWT-Einträge aus der „BLS-Recherche“ von nutritional-software.at | Angebot eines Drittanbieters, vom Produktinhaber für den persönlichen Gebrauch abgerufen | Nur als lokaler Import auf seinem Gerät (D-263); nicht im Repository, nicht im App-Paket | nicht nötig, weil nicht verbreitet |
| Schweizer Nährwertdatenbank | freie Nutzung mit Quellenangabe | Nährwerte geprüft, nicht verwendet; die Broschüre „Schweizer Nährwerttabelle 2021“ ist Hauptquelle der Richtwerte je Stück (Abschnitt 3) | in der App unter „Richtwerte je Stück und Scheibe“ |
| Eigene Lebensmittel | eigene Daten des Nutzers | lokal, auf Wunsch synchronisiert | – |
