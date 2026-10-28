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
| DTU Fødevareinstituttet (2013): Mål, vægt og portionsstørrelser på fødevarer (Dänemark): Schälverlust Erdäpfel 15 %, Käse in Scheiben 20 g, Avocado mittel 145 g netto, Schalenanteil Ei 10 % | 3 | Erdäpfel geschält, Käsescheiben, Avocado (Sorte Hass, D-368), Gegenproben |
| NICE und NUBEL (Belgien), Voedingscentrum und Veggipedia (Niederlande), DGE 2004 | 3 | Käsescheiben (NICE), Reiswaffeln (Voedingscentrum), Gegenproben |

Gestrichen (keine Einheit, nur Gramm), weil die Werte zu stark schwanken oder sich widersprechen oder keine europäische Quelle eine Stückangabe nennt: Mandarine (40 und 60 g), Zitrone und Limette (meist nur Saft), Mango (Größenklassen 200 bis 800 g), Weckerl, Laugengebäck (im Handel 63 bis 130 g), Toastbrot und Vollkorntoast (20 bis 35 g), Kochschinken (30 und 45 g), gekochte Erdäpfel (keine Quelle für das Gewicht nach dem Kochen) sowie alle übrigen Einträge, die vorher „offen“ waren. Liste: `form-ernaehrung-report.md` Abschnitt 13.

## 4. Andere Datenquellen der App

| Quelle | Lizenz | Nutzung | Namensnennung |
|---|---|---|---|
| Open Food Facts | Datenbank ODbL, Einzelinhalte Database Contents License | Nur per Barcode nach Einwilligung (D-266); Treffer werden lokal gespeichert und nicht veröffentlicht | „Daten: Open Food Facts, Open Database License (ODbL)“ in der App |
| ÖNWT-Einträge aus der „BLS-Recherche“ von nutritional-software.at | Angebot eines Drittanbieters, vom Produktinhaber für den persönlichen Gebrauch abgerufen | Nur als lokaler Import auf seinem Gerät (D-263); nicht im Repository, nicht im App-Paket | nicht nötig, weil nicht verbreitet |
| Schweizer Nährwertdatenbank | freie Nutzung mit Quellenangabe | Nährwerte geprüft, nicht verwendet; die Broschüre „Schweizer Nährwerttabelle 2021“ ist Hauptquelle der Richtwerte je Stück (Abschnitt 3) | in der App unter „Richtwerte je Stück und Scheibe“ |
| Eigene Lebensmittel | eigene Daten des Nutzers | lokal, auf Wunsch synchronisiert | – |

## 5. Muskelkarte der Übungen (D-401)

| Punkt | Angabe |
|---|---|
| Quelle | npm-Paket `react-native-body-highlighter`, Version 3.2.0, Copyright (c) 2022 ELABBASSI Hicham; geladen am 27.10.2026 von `registry.npmjs.org` |
| Lizenz | MIT. Erlaubt Nutzung, Änderung und Weitergabe, auch kommerziell; Bedingung: Copyright- und Lizenzhinweis bleiben bei allen Kopien oder wesentlichen Teilen. Lizenztext im Paket (`LICENSE`) geprüft |
| Genutzt | Nur die SVG-Pfade der männlichen Vorder- und Rückansicht (`dist/assets/bodyFront.js`, `bodyBack.js`) und die beiden Umrisse (`dist/components/SvgMaleWrapper.js`), ohne Haare. Kein Code des Pakets, keine neue Laufzeitabhängigkeit |
| Änderungen | Eigene Farben aus den Tokens (Körper Grau, Hauptmuskeln Lime, mitarbeitende Lime mit 35 % Deckkraft, Hintergrund wie die Karte), eigene Zuordnung der 20 Muskeln der App zu den Bereichen der Vorlage (`MuscleMap.tsx`). Abduktoren haben in der Vorlage keinen eigenen Bereich und färben „gluteal“; Latissimus und oberer Rücken teilen sich „upper-back“ |
| Ablage | `tools/muscle_map.py` erzeugt `src/modules/exercises/ui/muscleMapPaths.ts` (mit Copyright im Kopf); der Lizenztext liegt mit der App unter `/uebungen/muskelkarte-lizenz.txt` (`public/uebungen/muskelkarte-lizenz.txt`) |
| Geprüft, nicht genommen | `react-body-highlighter` 2.0.5 (MIT, GV79): nur grobe Vielecke im Raster 100 × 200, wirkt nicht anatomisch |

## 6. 3D-Pilot der Übungsbilder (D-402)

| Punkt | Angabe |
|---|---|
| Grundmodell | MakeHuman, Repository `makehuman/makehuman` (Zweig `master`), Dateien `makehuman/data/3dobjs/base.obj` (Grundmodell), `makehuman/data/rigs/default.mhskel` (Skelett) und `default_weights.mhw` (Gewichte); geladen am 27.10.2026 über `raw.githubusercontent.com`, mit `LICENSE.md` |
| Lizenz | CC0 1.0 Universal für alle Assets: „The assets are defined as any data contributing to the graphical output of MakeHuman“, darunter Grundmodell, Ziele, Posen (`LICENSE.md` Abschnitt C). Keine Pflicht zur Namensnennung, keine Weitergabe unter gleicher Lizenz |
| Was das für die Bilder heißt | `LICENSE.md` Abschnitt D: Das Projekt erhebt keinen Anspruch auf Ausgaben, ausdrücklich auch nicht auf „Renderings“ und „Graphical data generated via scripting or plugins“; „there is no limitation on what you can do with this combined output“. Die gerenderten Schleifen, Standbilder und Vorschaubilder sind damit frei nutzbar, auch in der App und im öffentlichen Repository; die Quelle nennen wir trotzdem (`medien.json`, Quelle `form_3d_pilot`) |
| Werkzeug | Blender 4.2 als Python-Modul `bpy` (GPL), nur zum Rendern, nicht Teil der App. Was Blender rendert, gehört dem, der es rendert; die GPL gilt nicht für die Bilder |
| Eigenes | Posen, Bewegung, Geräte, Muskelzonen, Licht und Farben in `tools/uebungen-3d/` |
| Ablage | Die MakeHuman-Dateien liegen nicht im Repository (`tools/uebungen-3d/quelle/`, in `.gitignore`); `render.py --hole` lädt sie. Ergebnisse in `public/uebungen/medien/` |

## 7. Bewegungsdaten für weitere Übungsfamilien (D-411)

Für die drei Pilot-Übungen ist keine fremde Bewegung verwendet: Kniebeuge, Bankdrücken und Latziehen rechnet das IK-Rig aus Zielen (D-407). Die folgenden Quellen sind für weitere Familien vorgesehen, erst nach Freigabe des Produktinhabers und nach Sichtprüfung jeder Aufnahme. Übersicht und Zuordnung in `docs/uebungen-bewegungsfamilien.md`.

| Quelle | Lizenz (Wortlaut) | Was das für FORM heißt | Belege |
|---|---|---|---|
| CMU Graphics Lab Motion Capture Database | „This data is free for use in research projects. You may include this data in commercially-sold products, but you may not resell this data directly, even in converted form.“ Für Veröffentlichungen erbeten: „The data used in this project was obtained from mocap.cs.cmu.edu. The database was created with funding from NSF EIA-0196217.“ | Gerenderte Videos in der App sind erlaubt. Die Bewegungsdaten selbst (auch umgewandelt) kommen nicht ins Repository, denn es ist öffentlich und eine Weitergabe dort wäre mehr als Einbau in ein Produkt. Mit der ersten CMU-Übung kommt die Danksagung hierher und in `medien.json` zur Quelle | Original `mocap.cs.cmu.edu` (aus dieser Umgebung nicht abrufbar); wörtliche Kopien in `github.com/SheffieldML/GPy` (`GPy/util/data_resources.json`) und `github.com/probml/pyprobml` |
| BVH-Umwandlung der CMU-Daten (Bruce Hahne, cgspeed) | „CMU places no restrictions on the use of the original dataset, and I (Bruce) place no additional restrictions on the use of this particular BVH conversion.“ | Wie CMU. Geladen würde über GitHub (`github.com/una-dinosauria/cmu-mocap`), keine neue Adresse nötig | README und READMEFIRST in `github.com/una-dinosauria/cmu-mocap`, zitiert in `github.com/Shriinivas/cmubvh` |
| Mixamo (Adobe) | FAQ von Adobe: „You can use both characters and animations royalty free for personal, commercial, and non-profit projects“; nicht erlaubt ist die Weitergabe der rohen Figuren- und Animationsdateien („the files may not be distributed to customers or non-team members“); keine Namensnennung nötig | Nur mit Adobe-Konto; ich lege keines an. Lädt der Produktinhaber Dateien herunter, liegen sie nur lokal in `tools/uebungen-3d/quelle/mixamo/` (in `.gitignore`), nie im Repository; in die App kommen nur gerenderte Videos. Vor dem ersten Einsatz die aktuelle offizielle FAQ im Browser prüfen (die Forenkopie ist von 2022) | `helpx.adobe.com/creative-cloud/faq/mixamo-faq.html` (aus dieser Umgebung nicht abrufbar, Wortlaut aus Suchtreffern); FAQ-Kopie im Adobe-Forum `community.adobe.com/t5/mixamo-discussions/…/m-p/13234775` |

**Nicht verwenden:** AMASS (enthält CMU, Lizenz nur nichtkommerziell), die FBX-Umwandlung auf `data.4tu.nl` (CC BY-NC 4.0) und `huggingface.co/datasets/gbionics/cmu-fbx` (Lizenz ungeklärt).

**Werkzeuge:** Blender 4.2 als Python-Modul (GPL, nur zum Rendern), ffmpeg (LGPL/GPL, nur zum Kodieren). Beide sind nicht Teil der App; die GPL gilt nicht für die gerenderten Bilder.

## 8. Körperform, Kleidung, Haut, Augen und Haare der Figur (D-413, D-414, D-417, D-418, D-421)

Geprüft am 28.10.2026 für die Varianten A bis D, ergänzt am selben Tag für den Feinschliff von D (FORM-F als Aufdruck) und C mit den Dateien von MakeHuman. Nur kostenlose Quellen, die die Nutzung in der App erlauben; nichts gekauft, kein Konto angelegt. Wie beim Grundmodell liegen fremde Dateien nicht im Repository (`tools/uebungen-3d/quelle/`, in `.gitignore`); `render.py --hole` lädt sie.

| Element | Quelle | Lizenz (Wortlaut) | Was das für FORM heißt |
|---|---|---|---|
| Körperform (Formziele: Geschlecht, Muskeln, Gewicht, Proportionen, Brustgröße) | MPFB2, Repository `makehumancommunity/mpfb2`, `src/mpfb/data/targets/` (30 Dateien `*.target.gz`, Liste in `koerperform.ziele`), über `raw.githubusercontent.com` | `LICENSE.md` Abschnitt C: Assets sind „any data contributing to the output from MPFB“, darunter „Targets and modifiers“; „These assets have been released under CC0 1.0 Universal“. Abschnitt D: keine Ansprüche auf „Renderings“ und „Graphical data generated via scripting or plugins“ | Frei nutzbar, auch in der App und im öffentlichen Repository; keine Namensnennung nötig. Der Code von MPFB2 (GPLv3) wird nicht verwendet, nur die Daten |
| Haut, Augen, Augenbrauen, Wimpern, Haare (Variante C, D-418) | MakeHuman, Paket `makehuman_system_assets_cc0.zip` (267 MB) von `files2.makehumancommunity.org/asset_packs/makehuman_system_assets/`, Seite `static.makehumancommunity.org/assets/assetpacks/makehuman_system_assets.html`. Verwendet: `skins/young_caucasian_male` und `_female` (Bilder 2048 × 2048), `eyes/high-poly` mit `eyes/materials/brown_eye.png`, `eyebrows/eyebrow001` und `eyebrow005`, `eyelashes/eyelashes01` und `eyelashes02`, `hair/short02` (männlich) und `hair/ponytail01` (weiblich, Zopf, seit D-421 statt `hair/bob02`) (je `.mhclo`, `.obj`, `.mhmat`, `.png`) | Jede Datei im Kopf: „This asset was explicitly released as CC0 in september 2020. The license text for CC0 can be found in the root of this repository.“ Die Seite des Pakets führt jedes Teil mit „CC0“; die FAQ der Pakete: CC0 „basically means that the author has donated this asset to the public domain. There are no restrictions on the use.“ `LICENSE.md` des MakeHuman-Repositorys Abschnitt C (Assets CC0 1.0) und D (keine Ansprüche auf Renderings) | Frei nutzbar, auch in der App und im öffentlichen Repository; keine Namensnennung nötig. Die Dateien liegen nicht im Repository (`tools/uebungen-3d/quelle/makehuman/`, in `.gitignore`); `render.py --hole` lädt das Paket und packt nur die genannten Teile aus. Die Anpassung an die Figur (Eckpunkte aus drei Eckpunkten des Körpers plus Versatz) ist eigener Code nach dem Verfahren von MakeHuman (`realistisch._proxy`); das Augenmaterial (deckender Teil mit dem Bild, durchsichtige Hornhaut mit Glanz, D-421) ebenso |
| Kleidung (STEP Running Tee in Nacht #0C1219, STEP Shorts in Graphit #4A4F57, Paspeln in Lime) | eigener Code `tools/uebungen-3d/kleidung.py`: aus dem Netz der Figur (CC0) abgeleitet, Farben nach der Vorlage des Produktinhabers (Nachricht vom 28.10.2026) und `brand-tokens.md` | eigene Arbeit nach der FORM-Marke | keine Einschränkung |
| FORM-F auf der Kleidung (D-417) | `public/brand/symbol-f-gruen.svg` aus dem Repository (Markendatei von FORM, `docs/brand-form.md`), gerastert zu `quelle/form-f.png` | Markenzeichen des Produktinhabers | keine Einschränkung; nur in der App und ihren Bildern |

Vor D-418 waren Haut, Augenbrauen und Haare eigene Arbeit ohne Dateien (eigener Shader, aufgemaltes Feld, Partikelhaar und Haarfläche aus Blender; Stand D-414, Commit `068509a`), weil die Adressen von MakeHuman gesperrt waren; der Produktinhaber hat `*.makehumancommunity.org` am 28.10.2026 freigegeben.
