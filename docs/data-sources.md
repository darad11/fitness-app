# Externe Datenquellen: Prüfung und Entscheidung

Stand: 19.10.2026 · Version 0.4 · Bezug: D-110, D-261, D-263, D-301 bis D-306

## 1. Zweck und Prüfmethode

Der Produktinhaber verlangt, API-Limits, Lizenzbedingungen, Datenschutz und Offlineverhalten zu prüfen, bevor eine externe Quelle verbindlich integriert wird (D-110). Dieses Dokument hält das Ergebnis fest.

**Methode.** Die Angaben stammen aus einer Websuche mit Zitaten aus offiziellen Seiten, Dokumentationen und Issue-Trackern, Stand 18.10.2026. Ein direkter Abruf der Hosts (`world.openfoodfacts.org`, `blsdb.de`, `naehrwertdaten.ch`) war aus dieser Cloud-Umgebung nicht möglich, weil die Netzwerkrichtlinie sie sperrt. Deshalb werden alle Punkte vor der verbindlichen Integration in einem Prüfspike von der späteren Produktivadresse aus bestätigt (Abschnitt 7).

**Grundsätze.**

- Die lokale Datenbank ist führend. Externe Quellen ergänzen sie nur.
- Ohne Netz bleiben alle Kernfunktionen nutzbar: eigene Lebensmittel, gebündelte generische Lebensmittel, zwischengespeicherte Produkte, Favoriten.
- Jeder Datensatz trägt Quelle und Qualitätsstatus. Protokolle speichern einen Snapshot der Werte (D-209).
- Im MVP (R1) gibt es keine externen Datenabrufe. Alle Quellen in diesem Dokument betreffen R2 und später.

## 2. Übersicht

| Quelle | Zweck | Lizenz | Zugriff und Limits | Datenschutz | Offline | Bewertung | Status |
|---|---|---|---|---|---|---|---|
| Bundeslebensmittelschlüssel (BLS) 4.0, Max Rubner-Institut | Generische Lebensmittel mit deutschen Namen, rund 7.140 Lebensmittel, 138 Nährstoffe | CC BY 4.0, Namensnennung des MRI als Herausgeber; seit Dezember 2025 kostenfrei | Download (DOI 10.25826/Data20251217-134202-0); keine Laufzeitabfragen | Keine Datenübertragung zur Laufzeit | Vollständig, weil gebündelt | Sehr gut geeignet | Umgesetzt (D-261): Datei vom Produktinhaber, Prüfspike S-2 bestanden |
| Schweizer Nährwertdatenbank 7.1, BLV | Generische Lebensmittel, 1.246 Einträge, Deutsch, Französisch, Italienisch, Englisch | Freie Nutzung, auch kommerziell, mit Pflicht zur Quellenangabe; keine benannte Standardlizenz gefunden | Excel-Download und API | Keine bei gebündelter Nutzung | Vollständig, weil gebündelt | Gut; Alternative, falls BLS ausscheidet | Reserve |
| Österreichische Nährwerttabelle (ÖNWT, nut.s, Universität Wien) | Österreichische Lebensmittel und Markenprodukte, über 10.000 Datensätze | Kommerziell; Daten nur mit Lizenz und Wartungsvertrag, Auslieferung als Installationsprogramm für die Software nut.s | Kein offener Zugang | – | – | Inhaltlich passend, aber kostenpflichtig; die vom Produktinhaber übergebenen RTF-Dateien (13 Pakete, rund 8.200 Einträge, Stand 2024 bis 2026) enthalten nur Namen und Codes, keine Nährwerte | Vorerst nicht (Produktinhaber, 19.10.2026) |
| Website „BLS-Recherche“ von nutritional-software.at | Anzeige von BLS 4.0, BLS 3.02 und ÖNWT-Daten (31.817 Einträge, rund 107 Seiten zu je 300) | Angebot eines Drittanbieters; der Produktinhaber hat nach einer Spende (Hinweis auf der Seite) die Ergebnisliste für den persönlichen Gebrauch selbst abgerufen | Datei `nuts-recherche.json` des Produktinhabers; keine Laufzeitabfragen | Keine Datenübertragung; die Datei wird lokal importiert | Vollständig nach dem Import | Übernommen werden nur die 7.476 ÖNWT-Einträge (österreichische Gerichte und Produkte, ohne Barcode); die deutschen BLS-Daten (4.0 und 3.02) nicht, auf Wunsch des Produktinhabers. Die Marke („Firma“) steht nur auf den Detailseiten; der Produktinhaber hat sie selbst abgerufen (`nuts-marken.json`), die App übernimmt sie beim lokalen Import (D-271) | Umgesetzt als lokaler Import (D-263); nicht im Repository und nicht im App-Paket |
| Andere Apps (FatSecret, Fddb, Yazio, MyFitnessPal) | Markenprodukte | FatSecret: lokale Daten nur in der kostenpflichtigen Ausgabe; die übrigen ohne offenen Zugang | – | – | – | Nur mit ausdrücklicher Erlaubnis des Anbieters (D-306) | Nicht verwendet |
| Open Food Facts | Markenprodukte, Barcode-Suche | Datenbank ODbL; Einzelinhalte Database Contents License; Bilder CC BY-SA, teils mit Rechten Dritter | Laut offizieller Doku (Stand Okt. 2026): 15 Produktabfragen und 10 Suchanfragen pro Minute und IP; Überschreitung führt zu Fehlern. Eigener User-Agent im Format `AppName/Version (Kontakt)` erbeten, Registrierung der App über ein Formular erbeten | Barcode bzw. Suchbegriff und IP-Adresse gehen an Open Food Facts | Nur zwischengespeicherte Produkte | Gut für Barcodes, eingeschränkt für Suche; rund 17.500 Produkte aus Österreich (Stand Oktober 2026) | Umgesetzt für Barcodes nach Einwilligung in der App (D-266); Prüfspike S-1 bestanden: echter Scan auf dem iPhone lieferte Marke und Nährwerte (19.10.2026) |
| USDA FoodData Central | Generische Lebensmittel | Public Domain | API-Schlüssel nötig | IP an US-Behörde | Nur bei Bündelung | Englische Namen, für Deutsch ungeeignet | Nicht vorgesehen (D-303) |
| Eigene Lebensmittel | Alles, was keine Quelle liefert | Eigene Daten | Lokal | Lokal | Vollständig | Pflichtbestandteil | Vorgesehen |
| Eigene Basisübungsbibliothek | Übungen mit deutschen Namen | Eigene Daten, Teil der App | Gebündelt | Lokal | Vollständig | Pflichtbestandteil | Entschieden (D-213) |
| wger | Übungen mit Übersetzungen, auch Deutsch | Code AGPL; Übungsdaten CC BY-SA 3.0 bzw. Lizenz je Übung | API und Datenexport | Abhängig vom Importweg | Nur bei Bündelung | Brauchbar, Qualität gemischt | Spätere Option (D-304) |
| free-exercise-db | Übungen mit Bildern | Unlicense (gemeinfrei) | Download | Keine | Bei Bündelung | Nur Englisch | Spätere Option (D-304) |

## 3. Open Food Facts im Detail

### 3.1 Befunde

| Thema | Befund | Quelle | Sicherheit |
|---|---|---|---|
| Rate-Limits | 15 Produktabfragen/min/IP, 10 Suchanfragen/min/IP. Ältere Angaben von 100 Produktabfragen pro Minute gelten als überholt; ein GitHub-Issue vom Oktober 2026 weist ausdrücklich darauf hin | Offizielle API-Dokumentation (Ausschnitt); GitHub-Issue mwdearing/health-nutrition #297 | Mittel; im Spike bestätigen |
| User-Agent | Eigener User-Agent für jeden Aufruf erbeten | Support-Seite „Are there conditions to use the API?" | Hoch |
| User-Agent im Browser | Browser erlauben Seiten-JavaScript nicht zuverlässig, den User-Agent zu setzen. Eine offizielle Antwort für reine Browser-Apps wurde nicht gefunden | Forum-Thread ohne Antwort | Offen; im Spike klären |
| CORS | Widersprüchlich. Der Produkt-Endpunkt funktioniert vermutlich aus dem Browser; für Such- und Facetten-Endpunkte gibt es offene Issues zu CORS-Fehlern und HTTP 503 (Juni 2026) | GitHub-Issues openfoodfacts-server #13738, #13943; openfoodfacts-explorer #1553 | Niedrig; im Spike messen |
| Lizenz | ODbL für die Datenbank (Namensnennung, Share-Alike bei öffentlicher Nutzung einer abgeleiteten Datenbank); DbCL für Einzelinhalte; Bilder CC BY-SA mit möglichen Rechten Dritter | Offizielle Lizenzseite und Wiki | Hoch |
| Datenschutz | Kein Konto für Lesezugriffe nötig. Übertragen werden Barcode oder Suchbegriff und die IP-Adresse | Eigene Ableitung aus der API-Nutzung | Hoch |
| Offline | Kein Offline-Zugriff; Datendumps sind mehrere Gigabyte groß und für den Browser ungeeignet | Eigene Bewertung | Hoch |

### 3.2 Vorgesehene Nutzung (R2, nach bestandenem Spike)

- Nur der Produkt-Endpunkt per Barcode wird standardmäßig genutzt. Die Online-Suche nach Namen ist optional und nachrangig, weil die lokale Suche über BLS, eigene und zwischengespeicherte Lebensmittel zuerst läuft.
- Angefragt werden nur benötigte Felder, voraussichtlich `code`, `product_name`, `product_name_de`, `brands`, `quantity`, `serving_size`, `serving_quantity`, `nutrition_data_per` und die Nährwerte pro 100 g bzw. 100 ml (`energy-kcal_100g`, `energy-kj_100g`, `proteins_100g`, `carbohydrates_100g`, `sugars_100g`, `fat_100g`, `saturated-fat_100g`, `fiber_100g`, `salt_100g`). Die Feldnamen werden im Spike bestätigt.
- Clientseitige Drosselung mit Sicherheitsabstand: höchstens 10 Produktabfragen und 5 Suchanfragen pro Minute und Gerät; Suche erst ab 3 Zeichen und 600 ms Pause.
- Jedes abgerufene Produkt wird als Lebensmittel mit Quelle `off`, Abrufzeitpunkt und Qualitätsstatus „Community" lokal gespeichert. Eine erneute Abfrage desselben Barcodes nutzt den Cache.
- Fehlende Nährwerte werden als unvollständig markiert (NU-22). Liefert die Quelle nur Kilojoule, wird mit 1 kcal = 4,184 kJ umgerechnet und der Wert als abgeleitet gekennzeichnet.
- Produktbilder werden standardmäßig nicht geladen, um Datenübertragung und Lizenzfragen klein zu halten.
- Vor der ersten Online-Abfrage erklärt ein Dialog, welche Daten an Open Food Facts gehen, und holt eine Einwilligung ein (Q-08). Die Einwilligung ist in den Einstellungen widerrufbar.
- Ohne Netz: Der gescannte Barcode wird gemerkt („später nachschlagen"), und die manuelle Eingabe steht sofort bereit (NU-24).
- Namensnennung „Daten: Open Food Facts, ODbL" in der Lebensmittel-Detailansicht und unter Mehr › Über.
- Share-Alike: Der lokale Cache ist eine abgeleitete Datenbank für den persönlichen Gebrauch und wird nicht veröffentlicht. Der App-Code selbst enthält keine Open-Food-Facts-Daten.

### 3.3 Entscheidungsregel für den User-Agent

| Spike-Ergebnis | Vorgehen |
|---|---|
| Open Food Facts akzeptiert Browser-Aufrufe ohne eigenen User-Agent (Doku oder Antwort von reuse@openfoodfacts.org) und CORS funktioniert | Direkter Aufruf aus der App |
| Eigener User-Agent zwingend oder CORS unzuverlässig | Schlanke Supabase Edge Function als Proxy: setzt den User-Agent, drosselt, speichert kurz zwischen. Das ist kein eigener Server, setzt aber ein Supabase-Projekt vor R3 voraus |
| Beides scheitert | Barcode-Funktion entfällt; manuelle Eingabe und BLS bleiben |

## 4. Bundeslebensmittelschlüssel 4.0 im Detail

- **Herausgeber und Lizenz:** Max Rubner-Institut, seit dem 15. bzw. 16.12.2025 als Open Data unter CC BY 4.0. Die Namensnennung lautet sinngemäß „Max Rubner-Institut (MRI): Bundeslebensmittelschlüssel (BLS) 4.0, DOI 10.25826/Data20251217-134202-0, Lizenz CC BY 4.0, Daten gekürzt und umgewandelt". Der genaue Wortlaut folgt der Lizenzangabe im Download.
- **Umfang:** etwa 7.140 Lebensmittel und 138 Nährstoffe; Referenzdokumentation vom Januar 2026.
- **Nutzung:** Ein Skript unter `tools/` wandelt den Download in eine kompakte JSON-Datei um (Felder: BLS-Code, deutscher Name, Kategorie, kcal, Protein, Kohlenhydrate, Zucker, Fett, gesättigte Fettsäuren, Ballaststoffe, Salz). Geschätzte Größe etwa 1,4 MB, komprimiert etwa 0,3 bis 0,4 MB. Die Datei wird nur im Ernährungsmodul geladen und einmal pro Datenversion in eine lokale, nicht synchronisierte Tabelle übernommen.
- **IDs:** deterministisch aus dem BLS-Code (UUID v5), damit Protokolleinträge auf allen Geräten auf dieselbe ID verweisen (D-207).
- **Roh und gegart:** BLS führt Zubereitungsformen als eigene Einträge. Das deckt NU-18 ohne Schätzfaktor ab.
- **Prüfspike S-2:** Lizenztext im Download, Dateiformat, Feldnamen, Einheiten, Vollständigkeit der benötigten Nährstoffe, Kategorien für die Einkaufsliste, Stichprobe von 30 Lebensmitteln gegen die Dokumentation, Bündelgröße.

## 5. Schweizer Nährwertdatenbank (Reserve)

Version 7.1 mit 1.246 generischen Lebensmitteln in 19 Ober- und 106 Unterkategorien. Nutzung frei, auch kommerziell, mit Pflicht zur Quellenangabe. Sie wird genutzt, falls BLS im Spike ausscheidet, oder ergänzend für fehlende Kategorien.

## 6. Übungsdaten

- **MVP:** eigene Basisbibliothek mit etwa 100 Übungen, deutschen Namen, englischen Alias-Namen für die Suche, Muskelgruppen, Geräten und Erfassungsart. Gebündelt und versioniert, IDs deterministisch aus einem stabilen Schlüssel (D-207, D-213, D-230). Umfang und Struktur in `sample-templates.md` Abschnitt 6.
- **Erweiterung (Schritt B in `evolution-plan.md`):** 18 weitere Übungen aus dem Abgleich mit Programm C (`winterprogramm-2026.md` Abschnitt 5), weiterhin eigene Daten ohne Fremdinhalte.
- **Übungsabbildungen (Backlog):** free-exercise-db (yuhonas, GitHub) steht laut Websuche vom 18.10.2026 unter der Unlicense (gemeinfrei) mit über 800 Übungen und Bildern über `raw.githubusercontent.com`; vor einer Nutzung Lizenzdatei im Repository prüfen und Bilder gebündelt ausliefern, nie zur Laufzeit von GitHub laden (keine Datenübertragung an Dritte).
- **Kalorienschätzung (Schritt E):** MET-Werte aus dem Adult Compendium of Physical Activities 2024 (`evolution-plan.md` Abschnitt 7); die Website `pacompendium.com` war aus der Cloud-Umgebung nicht erreichbar, die Werte stammen aus Suchausschnitten und werden vor der Umsetzung geprüft.
- **Später (Backlog):** optionaler Import aus wger mit deutschen Übersetzungen. Die Lizenz ist je Übung zu prüfen (CC BY-SA 3.0 bzw. Angabe pro Übung) und erfordert Namensnennung sowie Share-Alike für die abgeleiteten Daten. Bilder aus free-exercise-db (gemeinfrei) sind eine Option für Übungsabbildungen.

## 7. Prüfspikes vor verbindlicher Integration

| Spike | Zeitpunkt | Prüfpunkte | Ergebnis |
|---|---|---|---|
| S-1 Open Food Facts | Beginn M6 | CORS von der Produktivadresse für Produkt- und Such-Endpunkt; Antwortzeiten; Verhalten an den Limits; User-Agent-Klärung; Vollständigkeit für 20 typische Produkte aus Österreich und Deutschland | Entscheidung direkt, Proxy oder Verzicht; Eintrag in `decisions.md` |
| S-2 BLS-Import | 19.10.2026 | Nutzungsbedingungen (Dokumentation Abschnitt 9.3: kostenfrei, ohne Lizenzbarrieren, auch für App-Entwicklung, Quellenangabe empfohlen), Format (Excel, 7.140 Zeilen, 418 Spalten, je Nährstoff Wert, Herkunft und Referenz), Feldnamen (ENERCC, PROT625, CHO, SUGAR, FAT, FASAT, FIBT, NACL), Einheiten je 100 g, alle Einträge mit Energiewert, Bündelgröße 590 KB bzw. 164 KB gzip | Bestanden; D-261 |
| S-3 Barcode im Browser | Beginn M6 | `barcode-detector`-Polyfill auf dem iPhone in der installierten App: Erkennungsrate für EAN-13, EAN-8, UPC-A; Kamerazugriff und wiederholte Berechtigungsabfragen; Akkulast | Freigabe D-305 |

## 8. Datenflüsse nach Ausbaustufe

| Ausbaustufe | Externe Empfänger | Übertragene Daten |
|---|---|---|
| R1 (MVP) | Nur das Hosting | Abruf der App-Dateien; der Anbieter sieht IP-Adresse und Zugriffsprotokolle. Keine Nutzdaten |
| R2 | Keine im Grundausbau (BLS gebündelt); später Open Food Facts nach Einwilligung | Barcode oder Suchbegriff, IP-Adresse |
| R3 | Supabase (nach Anmeldung) | Alle synchronisierten Nutzdaten: Training, Körperwerte, Einstellungen, Ernährung |
| R5 | Supabase Storage (nach Zustimmung) | Fortschrittsfotos |

## 9. Quellen der Prüfung

- Open Food Facts API-Dokumentation: https://openfoodfacts.github.io/openfoodfacts-server/api/
- Open Food Facts Lizenz: https://openfoodfacts.github.io/documentation/docs/Product-Opener/api/tutorials/license-be-on-the-legal-side/
- Open Food Facts Nutzungsbedingungen der API: https://support.openfoodfacts.org/help/en-gb/12-api-data-reuse/94-are-there-conditions-to-use-the-api
- Hinweis auf die geänderten Limits: https://github.com/mwdearing/health-nutrition/issues/297
- CORS-Issues: https://github.com/openfoodfacts/openfoodfacts-server/issues/13738, https://github.com/openfoodfacts/openfoodfacts-server/issues/13943, https://github.com/openfoodfacts/openfoodfacts-explorer/issues/1553
- BLS 4.0: https://www.blsdb.de/ und https://blsdb.de/download; Meldung: https://www.heise.de/en/news/Bundeslebensmittelschluessel-4-0-Nutrient-database-now-publicly-available-11123877.html
- Schweizer Nährwertdatenbank: https://naehrwertdaten.ch/de/informationen/ und https://naehrwertdaten.ch/en/downloads/
- wger-Dokumentation: https://wger.readthedocs.io/
- free-exercise-db: https://github.com/yuhonas/free-exercise-db (Websuche 18.10.2026)
- Adult Compendium of Physical Activities 2024: https://pacompendium.com/ (Websuche 18.10.2026, Seite selbst nicht abrufbar)

**Nachtrag 20.10.2026 (D-279):** Der gebündelte BLS 4.0 ist aus der App entfernt. Lebensmitteldaten kommen nur noch aus dem lokalen Import (ÖNWT, D-263), eigenen Einträgen und Open Food Facts (Barcode).
