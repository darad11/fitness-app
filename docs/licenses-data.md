# Lizenzen der Lebensmitteldaten

Stand: 24.10.2026 · Bezug: D-358 (Phase Ernährung §2), `data-sources.md`, `lebensmittel-auswahl.csv`

Dieses Dokument hält fest, woher die Lebensmitteldaten der App stammen, unter welchen Bedingungen sie genutzt werden und wie die Quelle genannt wird. Die Auswahlliste ist noch nicht in die App eingebaut; das geschieht nach Freigabe durch den Produktinhaber (Phase Ernährung §6). Ab dann steht die Quelle an jedem Eintrag und unter „Über die App“.

## 1. Bundeslebensmittelschlüssel (BLS) 4.0, Hauptquelle

| Punkt | Angabe |
|---|---|
| Herausgeber | Max Rubner-Institut (MRI), Bundesforschungsinstitut für Ernährung und Lebensmittel, Karlsruhe |
| Version | 4.0, veröffentlicht im Dezember 2025, rund 7.140 Lebensmittel und 138 Nährstoffe; DOI 10.25826/Data20251217-134202-0 |
| Nutzungsbedingungen | Laut BLS-Dokumentation Abschnitt 9.3 kostenfrei und ohne Lizenzbarrieren nutzbar, auch für die Entwicklung von Apps; eine Quellenangabe wird empfohlen. Geprüft im Prüfspike S-2 am 19.10.2026 an der Datei `BLS_4_0_2025_DE.zip` des Produktinhabers (D-261) |
| Lizenzbezeichnung | Laut Websuche vom 18.10.2026 CC BY 4.0 (Namensnennung), siehe `data-sources.md`. Eine Websuche am 24.10.2026 bestätigte die kostenfreie Freigabe, nannte die Lizenzbezeichnung aber nicht. Vor dem Einbau (§6) wird der Lizenzhinweis aus dem Download wörtlich übernommen |
| Genutzte Felder | Code, Bezeichnung und acht Nährwerte je 100 g: Energie (ENERCC), Eiweiß (PROT625), Kohlenhydrate verfügbar (CHO), Zucker (SUGAR), Fett (FAT), gesättigte Fettsäuren (FASAT), Ballaststoffe (FIBT), Salz (NACL) |
| Änderungen | Auf acht Nährwerte gekürzt, Werte auf höchstens zwei Nachkommastellen gerundet (`tools/bls_build.py`); Auswahl von 345 Einträgen; eigene Anzeigenamen (österreichisch), Suchbegriffe, Gruppen und Stückgewichte. Die BLS-Werte selbst bleiben unverändert |
| Ablage | `tools/data/bls-4.0.json` (Rohdaten für Werkzeuge, nicht in der App), `docs/lebensmittel-auswahl.csv` (Auswahl mit BLS-Code und BLS-Bezeichnung je Zeile) |

Namensnennung in der App (ab §6), Vorschlag:

> Nährwerte: Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0, DOI 10.25826/Data20251217-134202-0. Auswahl gekürzt; Namen, Suchbegriffe und Stückgewichte ergänzt.

Je Eintrag: „Quelle: BLS 4.0“ mit BLS-Code und BLS-Bezeichnung.

### Rechenregeln im Vergleich mit der EU (LMIV)

Geprüft am 24.10.2026 an den 345 BLS-Einträgen der Auswahl; Bericht `form-ernaehrung-report.md` §2.

| Regel der LMIV | BLS 4.0 | Ergebnis |
|---|---|---|
| Kohlenhydrate ohne Ballaststoffe | Feld CHO „Kohlenhydrate, verfügbar“ | passt, keine Umrechnung |
| Energie mit 4 kcal/g Eiweiß und Kohlenhydrate, 9 kcal/g Fett, 2 kcal/g Ballaststoffe | ENERCC ist berechnet; in der Auswahl weicht er im Median um 0,4 kcal von 4·Eiweiß + 4·Kohlenhydrate + 9·Fett + 2·Ballaststoffe ab (273 von 339 vollständigen Einträgen innerhalb ±2 kcal); ohne den Ballaststoffanteil wären es im Median 4,2 kcal | passt, keine Umrechnung; größere Abweichungen nur bei Obst mit viel Fruchtsäure und bei Sauerkraut |
| Salz = Natrium × 2,5 | Feld NACL, laut BLS-Dokumentation Abschnitt 5.8 aus Natrium × 2,5 | passt, keine Umrechnung |

## 2. USDA, nur für Lücken und Stückgewichte

| Punkt | Angabe |
|---|---|
| Herausgeber | U.S. Department of Agriculture, Agricultural Research Service: National Nutrient Database for Standard Reference (SR), Release 24 |
| Nutzungsbedingungen | Daten einer US-Bundesbehörde, gemeinfrei (FoodData Central: CC0 1.0); Quellenangabe erbeten |
| Verwendung jetzt | Nur drei Stückgewichte als Vorschlag in der Auswahlliste: Ei (Gegenprobe), Eiklar, Dotter (SR-Nummern 01123, 01124, 01125). Keine Nährwerte |
| Verwendung nach Freigabe | Nur für Lebensmittel, die im BLS fehlen und für die der Produktinhaber USDA wählt. Dann umgerechnet nach den EU-Regeln: Kohlenhydrate ohne Ballaststoffe (SR rechnet sie mit), Energie mit den EU-Faktoren, Salz = Natrium × 2,5; Quelle je Eintrag „USDA SR“ mit Nummer |

## 3. Amtliche Texte als Belege für Stückgewichte

Keine lizenzpflichtigen Daten, sondern Rechts- und Verwaltungstexte, nur zitiert:

- Vermarktungsnormen für Eier: Verordnung (EG) Nr. 589/2008 Art. 4 (Gewichtsklassen XL, L, M, S), seit 2023 ersetzt durch die Delegierte Verordnung (EU) 2023/2465. Grundlage für „Ei, Größe M“.
- Österreichisches Lebensmittelbuch, Codex-Kapitel B 18 „Backerzeugnisse“: Mindestgewicht der Semmel 46 g nach dem Backen (Seite „Kaisersemmel“ des österreichischen Landwirtschaftsministeriums, bmluk.gv.at).

## 4. Andere Datenquellen der App

| Quelle | Lizenz | Nutzung | Namensnennung |
|---|---|---|---|
| Open Food Facts | Datenbank ODbL, Einzelinhalte Database Contents License | Nur per Barcode nach Einwilligung (D-266); Treffer werden lokal gespeichert und nicht veröffentlicht | „Daten: Open Food Facts, Open Database License (ODbL)“ in der App |
| ÖNWT-Einträge aus der „BLS-Recherche“ von nutritional-software.at | Angebot eines Drittanbieters, vom Produktinhaber für den persönlichen Gebrauch abgerufen | Nur als lokaler Import auf seinem Gerät (D-263); nicht im Repository, nicht im App-Paket | nicht nötig, weil nicht verbreitet |
| Schweizer Nährwertdatenbank | freie Nutzung mit Quellenangabe | geprüft, nicht verwendet | – |
| Eigene Lebensmittel | eigene Daten des Nutzers | lokal, auf Wunsch synchronisiert | – |
