# Funktionsinventar und Funktionsmatrix

Stand: 18.10.2026 · Version 0.4 (M1 in Arbeit) · Status: Entscheidungen vorläufig freigegeben; erste Umsetzungsstände eingetragen · Vorgänger: `archive/v0.1-phase-1/feature-inventory.md`

Quelle der Wahrheit ist diese Datei. `feature-inventory.csv` wird daraus mit `python3 tools/feature_inventory_to_csv.py` erzeugt.

## Änderungen gegenüber Version 0.1

- Neue Spalten **Herkunft** (Original verifiziert, Original nicht verifiziert, eigene Verbesserung), **Umfang** (MVP, später, ausgeschlossen) und **Release** (Ausbaustufe und Meilenstein).
- Die Spalte **Entscheidung** enthält jetzt die vorläufig freigegebene Entscheidung mit Verweis auf `decisions.md`.
- MVP-Zeilen verweisen in den Akzeptanzkriterien auf die AK-IDs in `requirements.md` Abschnitt 6.
- Alle 138 Zeilen aus Version 0.1 bleiben mit ihrer ID erhalten. 27 neue Zeilen: ON-18, TP-21 bis TP-26, TS-23 bis TS-27, NU-21 bis NU-25, SY-11 bis SY-20.
- Version 0.14 (Rebranding FORM, Paket F4, 22.10.2026): TH-04 (Streaks) „Ausgeschlossen“ und „Verworfen“: keine Serien-Zähler nach den Markenleitplanken (D-318); die Serie in der Auswertung der Tagesaufgaben (D-284) entfällt, dort steht jetzt „Diese Woche x von y“ (AK-HAB-03).
- Version 0.61 (Phase Übungen, Standbilder der neuen Kleidung, 29.10.2026): Funktionen und Status unverändert; Standbilder neben dem Board, Nahaufnahmen, die drei Pilot-Übungen in der Größe des Players und das Handgelenk beim Bankdrücken vorher und nachher zur Freigabe; die Schleifen der App folgen nach der Freigabe (D-453).
- Version 0.60 (Phase Übungen, Handgelenk beim Bankdrücken, 29.10.2026): Funktionen und Status unverändert; im Werkzeug bleibt das Handgelenk beim Bankdrücken annähernd gerade, höchstens 9,3° gestreckt (D-452).
- Version 0.59 (Phase Übungen, Füße und Bodenkontakt mit Schuhen, 29.10.2026): Funktionen und Status unverändert; im Werkzeug steht die Figur auf geschlossenen Sohlen, Kragen und Socken durchdringen nichts, geprüft über alle Bilder der drei Pilot-Übungen (D-451).
- Version 0.58 (Phase Übungen, Kleidung nach dem Design-Board, 29.10.2026): Funktionen und Status unverändert; im Werkzeug trägt die Figur T-Shirt, Shorts, Socken und Schuhe nach dem Board des Produktinhabers (D-450). Die Schleifen der App folgen nach der Freigabe der Standbilder.
- Version 0.57 (Phase Übungen, Muskelzonen nur noch in der Muskelkarte, 29.10.2026): Funktionen und Status unverändert; im Werkzeug zeigen die Übungsbilder keine Muskelzonen mehr, die Muskelkarte von TP-07 bleibt (D-449). Die Schleifen der App folgen nach der Freigabe der Standbilder.
- Version 0.56 (Phase Übungen, Pilot-Übungen in der Figur der App, 29.10.2026): TP-06, TP-07 und TS-02 mit neuen Schleifen, Postern und Vorschaubildern für Kniebeuge, Bankdrücken und Latziehen in C männlich, Fassung A1, Brust-F 4 cm, mit nachgeklapptem Daumen; Status unverändert (D-447).
- Version 0.55 (Phase Übungen, Daumen-Endglied nachgeklappt, 29.10.2026): Funktionen und Status unverändert; im Werkzeug klappt das Endglied des Daumens nach, bis die Beere aufliegt (D-446).
- Version 0.54 (Phase Übungen, Daumen letzter Versuch, 28.10.2026): Funktionen und Status unverändert; die Videos und Bilder von TP-06, TP-07 und TS-02 bleiben. Daumen mit zwei Hebeln geprüft (Fingerlänge über MakeHuman, Lage der Stange in der Hand), einzeln und zusammen, dazu eine Folgeänderung am Endglied; nicht deutlich besser, die Fassung D-440 bleibt (D-445).
- Version 0.53 (Phase Übungen, Nachricht nach Korrekturrunde 5, 28.10.2026): Funktionen und Status unverändert; die Videos und Bilder von TP-06, TP-07 und TS-02 bleiben. Shorts-F freigegeben; im Werkzeug die personalisierte Variante vollständig entfernt, keine Daten der Person im aktuellen Stand (D-444).
- Version 0.52 (Phase Übungen, Korrekturrunde 5: Daumen nach Handfoto, ein Shorts-F, personalisiertes Modell nach Referenzblatt, 28.10.2026): Funktionen und Status unverändert; die Videos und Bilder von TP-06, TP-07 und TS-02 bleiben, bis der Produktinhaber die Standbilder und Vorschauen freigibt. Im Werkzeug: Daumen flach auf der Faust, Fingerspitzen rollen unter die Stange, Latziehen ebenfalls über den Fingern (D-440); nur noch das F vorn-außen auf den Shorts (D-441); Variante „C männlich – Personalisiert“ neu mit Haarkurven, nur für Vorschauen (D-442); Vergleichsblätter und Bericht (D-443).
- Version 0.51 (Phase Übungen, Korrekturrunde 4: Daumen, zweites Shorts-F, personalisiertes Modell, 28.10.2026): Funktionen und Status unverändert; die Videos und Bilder von TP-06, TP-07 und TS-02 bleiben, bis der Produktinhaber die Standbilder freigibt. Im Werkzeug: Daumen schräg über den Fingern, Finger sinken ein, Latziehen mit Ring (D-435); zweites FORM-F auf den Shorts am linken Bein (D-436); Landmarken, Maße und Gesichtsregler als Grundlage für ein personalisiertes Modell ohne Bilddaten im Repository (D-437); Variante „C männlich – Personalisiert“ nur für Vorschauen (D-438); Vergleichsblätter (D-439).
- Version 0.50 (Phase Übungen, Korrekturrunde 3: Griff, Rundhalskragen, Rückenlogo, 28.10.2026): Funktionen und Status unverändert; die Videos und Bilder von TP-06, TP-07 und TS-02 bleiben, bis der Produktinhaber die Standbilder freigibt. Im Werkzeug: Stange liegt in der Hand (D-430), Rundhalskragen als Halsöffnung im Netz mit Bündchen (D-431), Rückenlogo als Backprint (D-432), Vorher-nachher-Vergleich (D-433); Animationsplan nach Programmen geordnet (D-434).
- Version 0.49 (Phase Übungen, Korrekturen Daumen, Kragen und Rückenlogo, 28.10.2026): Funktionen und Status unverändert; Entscheidung des Produktinhabers: Körper C männlich, Fassung A1, Brust-F 4 cm; die Videos und Bilder von TP-06, TP-07 und TS-02 bleiben, bis er die Standbilder freigibt. Im Werkzeug: Daumen als fester Ring (D-425), Kragen durch eine Ebene am Halsansatz begrenzt (D-426), Rückenlogo je Körper nach den Schulterblättern (D-427), Standbilder C männlich (D-428); Animationsplan für die drei Programme in `uebungen-animationsplan.md` (D-429).
- Version 0.48 (Phase Übungen, Korrekturen Augen, Logos, Kragen und Griff, 28.10.2026): Funktionen und Status unverändert; die Videos und Bilder von TP-06, TP-07 und TS-02 bleiben, bis der Produktinhaber den Körper wählt. Im Werkzeug: Augen mit Iris und Hornhaut, D mit neutralen Augen, Zopf für C weiblich (D-421); Logos je Körperteil begrenzt, F über FORM am Rücken, Kragen am Hals mitgeführt, Stange auf dem Stoff (D-422); voller Griff (D-423); Standbilder und Nahaufnahmen in A1 je Körper (D-424).
- Version 0.47 (Phase Übungen, Korrekturrunde Logos und Zonen, 28.10.2026): Funktionen und Status unverändert; die Videos und Bilder von TP-06, TP-07 und TS-02 bleiben, bis der Produktinhaber eine Fassung freigibt. Im Werkzeug: Kleidung nach Text, FORM-F in Originalproportionen mit Rand über den Zonen, Fassungen A1, A2, B für drei Körper (D-419), Vergleichspaket mit App-Ansichten (D-420).
- Version 0.46 (Phase Übungen, Feinschliff D und C mit MakeHuman-Dateien, 28.10.2026): Funktionen und Status unverändert; die Videos von TP-06, TP-07 und TS-02 bleiben, bis der Produktinhaber die Fassung wählt. Im Werkzeug: Entscheidung für D mit Zonen, Rundhals, FORM-F als Aufdruck in zwei Fassungen, Kantenlicht, Farben nach Vorlage (D-417); C mit Haut, Augen, Brauen, Wimpern und Haaren von MakeHuman (D-418).
- Version 0.45 (Phase Übungen, Brust und Varianten der Figur, 28.10.2026): Funktionen und Status unverändert; die Videos von TP-06, TP-07 und TS-02 bleiben, bis der Produktinhaber eine Variante wählt. Im Werkzeug: Brust natürlich gewölbt mit Körperform aus den Formzielen von MakeHuman (D-413), Varianten der Figur zur Probe (D-414), Vorschaubild eng auf die Figur (D-415), Priorität der Bewegungsfamilien nach Programmen und Vorlagen (D-416).
- Version 0.44 (Phase Übungen, Animationen ohne Kosten, 27.10.2026): TP-06, TP-07 und TS-02 mit neu animierten Schleifen für Kniebeuge, Bankdrücken und Latziehen auf einem IK-Rig: Hände umgreifen die Stange, Knie folgen den Zehen, Füße flach am Boden, Muskelzonen klar begrenzt, Dreiviertelansicht von vorn-seitlich (Latziehen von hinten-seitlich); Status unverändert (D-406 bis D-410). Zuordnung aller 124 Übungen zu Bewegungsfamilien und Quellen als Vorschlag, Übertragen erst nach Freigabe (D-411).
- Version 0.43 (Phase Übungen, Fortsetzung, 27.10.2026): TP-07 mit Muskelkarte vorne und hinten im Reiter „Muskeln“ (D-401) und Ausführung für 122 von 124 Übungen (D-404); TP-06, TP-07 und TS-02 mit Animationen für Kniebeuge, Bankdrücken und Latziehen aus dem 3D-Piloten, Standbild bei „Bewegung reduzieren“, offline nach dem ersten Anzeigen (D-402, D-403). Weg für die übrigen Übungen beim Produktinhaber (D-405).
- Version 0.42 (Phase Übungen, Phase 1, 27.10.2026): TP-06 (Übungsbibliothek), TP-07 (Übungsdetail) und TS-02 (Übungsliste im Player): Vorschaubild links neben dem Namen in allen Übungslisten, Demonstration der aktuellen Übung im Player (aufgeklappt groß, schmal kompakt) und in den Übungsdetails; solange Visuals fehlen, das Symbol in der Kachel (D-397). TP-07 neu mit dem Reiter „Ausführung“: Beschreibung, Ausgangsposition, Schritte, Technik, häufige Fehler, Sicherheit und Quellen für 111 von 124 Basisübungen (D-398). Visuals selbst folgen nach der Entscheidung über die Quelle (Q-24).
- Version 0.41 (Startfläche bei mehrmaligem Start am iPhone Duo, 27.10.2026): SY-02 (PWA): Die Startfläche misst nicht mehr einmal, sondern in jedem Bild und bei jeder Änderung, solange sie da ist; per CSS das aktuelle Fenster plus die Streifen des Duo; das Logo erscheint erst bei zwei gleichen, stimmigen Bildern, höchstens nach 300 ms; widersprüchliche Werte zählen nie; unter „Über die App“ zusätzlich das Layout und das Protokoll des Starts (D-394).
- Version 0.40 (Startfläche nach der Messung am iPhone Duo, 27.10.2026): SY-02 (PWA): Startfläche in allen vier Haltungen des Duo in der Mitte des ganzen Bildschirms, auch wenn das Duo aufgeklappt die Bildschirmbreite des äußeren Displays meldet; Bildschirm aus `screen.*` nur, wenn plausibel, sonst aus den Maßen des Duo, Lage nach den Streifen des Duo, sonst mittig im Fenster; unter „Über die App“ die Gerätedaten mit `screen.*`, `outerWidth`, `screenX` und der Rechnung der Startfläche (D-393).
- Version 0.39 (Korrekturen nach dem zweiten Gerätetest am iPhone Duo, 26.10.2026): SY-02 (PWA) mit Startbildern für das iPhone Duo, zugeklappt und aufgeklappt, hoch und quer, und der Startfläche in der Mitte des ganzen Bildschirms (D-390); CH-08 (Navigation): bei offener Bildschirmtastatur ohne Tab-Leiste und Kreis, das angetippte Feld im oberen Teil der Seite, in allen Formularen; TS-02 (Übungsliste): das Feld unter dem Kopf, die Fußleiste über der Tastatur, außer sie verdeckte das Feld (D-391); CH-08 außerdem ohne sichtbare Scroll-Balken am Touch-Gerät, am Computer dünn in den Farben der App (D-392).
- Version 0.38 (Korrekturen nach dem Gerätetest am iPhone Duo, 26.10.2026): CH-08 (Navigation) und TS-02 (Übungsliste): Tab-Leiste, Kreis und Fußleiste im Training bleiben beim Scrollen am unteren Rand, die Seite scrollt dafür in einem eigenen Rahmen; am Desktop scrollen die Scroll-Tasten den Rahmen; im Training hält der Player den aktiven Satz beim Auf- und Zuklappen selbst an seiner Stelle (D-384 mit Nachträgen); NU-26 (Einkaufsliste): Wischen zum Löschen ohne Ziehen des Browsers (Nachtrag zu D-384); NU-07 (Barcode-Scanning) ohne eigene Drehung, die Kamera startet bei neuer Haltung neu (D-385); TS-02 mit den Muskel-Etiketten in der Titelzeile (D-386); CH-06 (Dashboard „Heute“) mit den Knöpfen der Karte „Ernährung heute“ mittig im freien Raum (D-387); unter „Über die App“ die Gerätedaten zum Nachsehen (D-388); Abschluss mit Bildern, Bericht und Liste für den erneuten Gerätetest (D-389).
- Version 0.37 (Phase iPhone Duo, Phase 2, 26.10.2026): TS-02 (Übungsliste) aufgeklappt zweispaltig mit der Steuerung rechts und neu „Als Nächstes“; TS-07 und TS-09 (Pause mit nächstem Satz) zugeklappt in einer Zeile, ±15 s in der großen Pause; TS-03 (Vorwert) auf sehr schmalen Bildschirmen in einer zweiten Zeile (D-380); NU-02 und NU-03 (Tagesübersicht und Mahlzeiten) aufgeklappt zweispaltig, links Ring und Makros, rechts Mahlzeiten und Wasser (D-381); TH-06 und TS-18 (Kennzahlen und Kalorienschätzung im Fortschritt): Erklärung unter den Kacheln, Kacheln gleich hoch (D-382); TS-07 und TS-09 aufgeklappt mit dem nächsten Satz in bis zu vier Zeilen (D-383).
- Version 0.36 (Phase iPhone Duo, 25.10.2026): Prüfung aller Screens in drei Breiten und Bewertung der Layout-Verbesserungen, ohne Änderung an Funktionen (D-379); TH-03 (Trainingskalender) bleibt „später“.
- Version 0.35 (Phase iPhone Duo, 25.10.2026): TS-04 mit lesbaren Werten ab fünf Zeichen in schmalen Satzzeilen (zugeklappt, 375 bis 390 pt); bei 360 und 320 pt bleibt es eng (D-378).
- Version 0.34 (Phase iPhone Duo, 25.10.2026): Weitere Funde der Prüfung in drei Breiten (D-377): AH-03 und die Auswertung „Je Aufgabe“, NU-02 (Einträge) und BP-01 (Gewichtseinträge) mit Namen aus dem sichtbaren Text, Nebenzeilen als Beschreibung (WCAG 2.5.3, Audit D-08); NU-05 mit lesbarer Mahlzeit-Auswahl zwischen 640 und 767 px; NU-26 mit „Meine Küche“ ganz über der Tab-Leiste; Kopf im Training bis an den Fensterrand; Pause mit sichtbarem Minus und Plus auch schmal; Wochentage im Kalender 11 px.
- Version 0.33 (Phase iPhone Duo, 25.10.2026): CH-08 mit Linse, die auch beim Loslassen außerhalb der Leiste endet (D-376).
- Version 0.32 (Phase iPhone Duo, 25.10.2026): Leseposition bleibt beim Auf- und Zuklappen (Größenwechsel) auf allen Seiten; im Training bleiben Satz, Werte, Pause, Menüs und Dialoge erhalten, mit E2E-Test (D-375).
- Version 0.31 (Phase iPhone Duo, 25.10.2026): NU-07 erkennt nur den sichtbaren Ausschnitt um den Rahmen; Kamerabild höchstens 45 % der Fensterhöhe, damit Bild und Rahmen auch zugeklappt quer ganz sichtbar sind (D-374).
- Version 0.30 (Phase iPhone Duo, 25.10.2026): CH-08 mit Tab-Leiste, die nach jeder Größenänderung neu misst: Auswahl unter dem aktiven Tab auch nach Auf- und Zuklappen im Kreis, Linse nach einem Tipp beim Aufgehen richtig (D-373, Audit E-15).
- Version 0.29 (Phase iPhone Duo, 25.10.2026): CH-08 und alle festen Elemente beachten den sicheren Bereich an der Seite (iPhone Duo: Statusleiste, Dynamic Island und Kamera an der Seite): Tab-Leiste mit Kreis, Blätter, Rückfragen, Hinweise, große Pause, Anmeldung und „Meine Küche“ (D-372); NU-07 mit Schließen und Kamerabild im sicheren Bereich.
- Version 0.28 (Phase Ernährung, 25.10.2026): NU-28 mit Referenzen für Zucker und gesättigte Fettsäuren aus 10 % der Kalorien des Tagesziels, ohne Ziel 50 und 22 g (AK-NUT-15, D-369).
- Version 0.27 (Phase Ernährung, Freigabe der Richtwerte, 25.10.2026): NU-29 mit der Avocado nach DTU 2013 für die Sorte Hass, 145 g (D-368).
- Version 0.26 (Abschluss Phase Ernährung, Abschnitt 4, 25.10.2026): NU-25 mit D-366: Ohne eigenen Wortlaut des Produktinhabers bleibt die Zitierweise des BLS mit DOI; Zahl und Prozentzeichen in der Quellenzeile brechen nicht mehr um.
- Version 0.25 (Abschluss Phase Ernährung, Abschnitt 3, 25.10.2026): NU-29 „Richtwerte je Stück, vorausgewählt“ (AK-NUT-18, D-365): 47 Richtwerte aus europäischen Quellen, „1 Stück · ca. … g“ vorgewählt, Plus und Minus in halben Stück, „Gewicht anpassen“ gemerkt und zurücksetzbar; die einmalige Frage nach dem Stückgewicht entfällt.
- Version 0.24 (Abschluss Phase Ernährung, Abschnitt 2, 25.10.2026): NU-16 mit einzeiliger Nährwerttabelle in festen Spalten, zweite Spalte nur bei einer Menge ungleich 100 g (AK-NUT-08, D-364).
- Version 0.23 (Abschluss Phase Ernährung, Abschnitt 1, 25.10.2026): NU-28 kompakt (AK-NUT-15, D-363): je Zeile Name und „Ist / Referenz g“, einzeilig; Erklärung, Quellen und Einträge ohne Angabe im Info-Blatt, fehlende Werte mit Sternchen.
- Version 0.22 (Phase Ernährung, Abschnitt 6, 25.10.2026): NU-21 mit der Grundauswahl aus dem BLS 4.0 (AK-NUT-17, D-362), NU-29 neu und „Implementiert“ (Stückgewicht einmal angeben und merken, AK-NUT-18), NU-25 zusätzlich mit AK-NUT-19 (Lizenzliste unter „Über die App“). Geprüft mit Unit-, Komponenten- und E2E-Tests in Chromium und in der CI mit WebKit (Lauf 40171590098); der Gerätetest steht aus.
- Version 0.21 (Phase Ernährung, Abschnitt 4, 24.10.2026): NU-26 zusätzlich mit AK-NUT-16 (Wischen nach links löscht einen Artikel mit Rückgängig, D-360).
- Version 0.20 (Phase Ernährung, Abschnitt 3, 24.10.2026): NU-28 neu und „Implementiert“ (AK-NUT-15, D-359): Salz, Zucker, gesättigte Fettsäuren und Ballaststoffe als Ist und Tagesreferenz mit Quelle; Einträge ohne Angabe zählen nicht als 0.
- Version 0.19 (Phase Ernährung, Abschnitt 1, 24.10.2026): NU-08 „Implementiert“ für die lokale Suche (AK-NUT-14, D-356): für jede Datenquelle, mit Einzahl und Mehrzahl, Umlautschreibweisen, österreichischen und bundesdeutschen Begriffen in beide Richtungen, Rang nach Stellung im Namen und lose vor Marke, ohne Dubletten. Eine Online-Suche nach Namen gibt es weiterhin nicht (D-302).
- Version 0.18 (Phase Stabilität, Gerätetests, 24.10.2026): SY-02 und SY-04 bleiben „Implementiert“. Am iPhone bestanden: das Update nach D-343 (AK-PWA-03, T-IPH-M0 Schritt 4) und das Wiederherstellen aus dem Export (D-345). Für „Abgenommen“ fehlen bei SY-02 noch T-IPH-M1, iPad und Mac (AK-DEV-01, AK-DEV-02), bei SY-04 das Zusammenführen (AK-DAT-03).
- Version 0.17 (Phase Stabilität, Nachtrag A-05, 24.10.2026): SY-03 bleibt „Implementiert“; `push_documents` sperrt je Konto, damit beim Abholen keine Nummer übersprungen wird (A-05, D-349). Geprüft mit `pnpm test:db` an Postgres 16 (lokal) und im CI-Job an Postgres 17; der Gerätetest mit zwei Geräten steht weiter aus.
- Version 0.16 (Phase Stabilität, Abschnitt 3, 23.10.2026): SY-04 „Implementiert“: Export und Wiederherstellen aus dem Export mit Prüfung, Zusammenfassung, doppelter Bestätigung und Sicherung vorher (AK-DAT-01, AK-DAT-02, AK-DAT-04, AK-DAT-05, D-345). Geprüft mit Unit-, Komponenten- und E2E-Tests in Chromium; WebKit in der CI und Gerätetest stehen aus. SY-05 bleibt „Zur Umsetzung ausgewählt“, weil der Sicherungshinweis nach 14 Tagen (AK-DAT-12) fehlt; SY-19 (Zusammenführen, AK-DAT-03) bleibt offen.
- Version 0.15 (Phase Stabilität, Abschnitt 1, 23.10.2026): SY-02 „Implementiert“ mit der Update-Strategie aus D-343 (Übernahme beim ersten Start, Hinweis nicht während eines Trainings, einmal neu laden bei fehlenden nachgeladenen Teilen, Startwächter). Geprüft in Chromium mit zwei Builds nacheinander (`e2e/update.spec.ts`); die Fälle ohne Service Worker und der Startwächter laufen auch in WebKit in der CI; Gerätetest T-IPH-M0 Schritt 4 auf dem iPhone steht für diese Fassung aus.
- Version 0.7 (Ernährung Grundausbau, 19.10.2026): „Implementiert" (Unit-, Komponenten- und E2E-Tests in Chromium bestanden; WebKit in der CI und Gerätetest stehen aus): NU-01 (Zielvorschlag), NU-02, NU-03 (vier feste Mahlzeiten), NU-05, NU-09, NU-10, NU-15, NU-17, NU-20, NU-21 (BLS 4.0 mit österreichischen Suchbegriffen), NU-22, NU-25 (D-261, D-262). Teilweise und deshalb noch nicht umgestellt: NU-08 (nur lokale Suche), NU-11 (Favoriten und Zuletzt, ohne Mahlzeitvorlagen), NU-12 (jeder Tag aufrufbar, ohne Wochendurchschnitt), NU-16, NU-19, NU-23 (g, ml und Portionen, ohne Umrechnung ml in g). Barcode und Open Food Facts (NU-07, NU-24) folgen als eigenes Paket.
- Version 0.8 (Lebensmitteldaten importieren, 19.10.2026): NU-25 zusätzlich mit AK-NUT-07 (lokaler Import der ÖNWT-Daten aus der BLS-Recherche, Herkunft in der Suche, D-263). NU-08 bleibt teilweise, bis die Online-Suche (M6) folgt.
- Version 0.9 (Nährwerte anzeigen, 19.10.2026): NU-16 vorgezogen und „Implementiert“ (AK-NUT-08, D-264).
- Version 0.10 (Barcode-Scanner, 19.10.2026): NU-07 und NU-24 vorgezogen und „Implementiert“ (AK-NUT-09, D-266); Gerätetest auf dem iPhone steht aus.
- Version 0.11 (Rezepte, 19.10.2026): RE-02, RE-12 und RE-13 vorgezogen und „Implementiert“ (AK-NUT-10, D-267); RE-01 (Katalog mit Filtern) bleibt später.
- Version 0.12 (Mahlzeit-Vorlagen, 19.10.2026): NU-11 vorgezogen und „Implementiert“ (Favoriten, Zuletzt verwendet und Vorlagen; AK-NUT-11, D-268).
- Version 0.13 (Synchronisierung, 19.10.2026): SY-03 und SY-09 in erster Stufe „Implementiert“ (AK-SYN-01 bis AK-SYN-03, D-269); Gerätetest mit zwei Geräten steht aus.
- Version 0.6 (Notizen, 19.10.2026): „Implementiert" (Unit-, Komponenten- und E2E-Tests in Chromium bestanden): TS-19 (Notizen zu Übung und Einheit im Player, im Verlauf und beim nächsten Mal; D-260).
- Version 0.6 (Eigene Übungen, 19.10.2026): „Implementiert" (Unit-, Komponenten- und E2E-Tests in Chromium bestanden; WebKit in der CI und Gerätetest stehen aus): TP-13 (eigene Übungen anlegen, bearbeiten, archivieren), TP-07 (Übungsdetail mit Angaben, persönlicher Notiz, Standardpause, Gewichtsschritt, Videolink und letzten Einheiten; D-258). TP-26 (Programmdatei) entfällt für R1 und wird über die Synchronisierung in R3 gelöst (D-259).
- Version 0.6 (Eigene Programme, 19.10.2026): „Implementiert" (Unit-, Komponenten- und E2E-Tests in Chromium bestanden; WebKit in der CI und Gerätetest stehen aus): TP-01, TP-02, TP-03, TP-04, TP-08, TP-09, TP-10, TP-12, TP-14, TP-15, TP-16, TP-22, TP-23, TP-24, TP-25 (D-257). TP-13 (eigene Übungen) und TP-26 (Programmdatei) folgen mit AP 2.5 und AP 2.8; ON-14 bleibt bis zum Programmwechsel-Dialog.
- Version 0.5 (Verlauf bearbeiten, 19.10.2026): „Implementiert" (Unit-, Komponenten- und E2E-Tests in Chromium bestanden): TH-01 (Liste, Detail, Bearbeiten, Löschen mit Rückgängig; D-256).
- Version 0.5 (Nachtragen, 18.10.2026): „Implementiert" (Unit-, Komponenten- und E2E-Tests in Chromium bestanden): TS-17, AH-09 (D-255). TS-19 bleibt, bis Notizen auch im Player erfasst werden.
- Version 0.5 (Ziele, 18.10.2026): „Implementiert" (Unit-, Komponenten- und E2E-Tests in Chromium bestanden): ON-07, ON-18, TH-08, BP-06 (D-254). ON-01 und ON-11 (Profil ohne Konto, Anzeigename) ebenfalls „Implementiert"; ON-14 bleibt bis zum Programmwechsel-Dialog in M2.
- Version 0.5 (Schritt F, 18.10.2026): „Implementiert" (Unit-, Komponenten- und E2E-Tests in Chromium bestanden): AH-03, AH-04 (täglich), AH-05 (Serie für Tagesaufgaben, D-253). TH-04 (Serie für Trainings) bleibt offen.
- Version 0.5 (Schritt E, 18.10.2026): „Implementiert" (Unit-, Komponenten- und E2E-Tests in Chromium bestanden; Diagramme hell und dunkel per Bildschirmfoto geprüft): BP-01, BP-02 (ohne Ziellinie), TH-02 (Übungsverlauf unter `/fortschritt/uebung/:id`, Übungsdetail folgt in M2), TH-05, TH-06, TH-07 (Vergleich in Zusammenfassung und auf „Heute"), TS-18 (Kalorienschätzung nach MET, D-251). BP-06 und TH-08 bleiben, bis die Ziele (AP 3.3) umgesetzt sind.
- Version 0.5 (Schritt D, 18.10.2026): „Implementiert" (Unit-, Komponenten- und E2E-Tests in Chromium bestanden): TS-08 (Übungstimer), TS-10 (Übung im Training ersetzen, mit Alternativen; D-250). TP-12 (Ersetzen im Plan) folgt mit dem Programm-Editor in M2.
- Version 0.5 (Schritt C, 18.10.2026): „Implementiert" (Unit-, Komponenten- und E2E-Tests in Chromium bestanden; WebKit in der CI und Gerätetest stehen aus): TP-17 (Vorschau aller Wochen und Tage), TP-19 (Programm aktivieren und beenden; erneutes Aktivieren zählt von vorn), TP-21 (Reihenfolge-Modus mit „Heute geplant"). Gilt für die gebündelten Programme A, B, C (D-249); TP-01, TP-02 und TP-03 bleiben bis zu den eigenen Programmen in M2 „Zur Umsetzung ausgewählt".
- Version 0.4 (AP 1.8): SY-04 bleibt „Zur Umsetzung ausgewählt" (Export umgesetzt, Import in M2 und M4); SY-11 unverändert (Snapshots entstehen, Oberfläche zum Wiederherstellen in M4).
- Version 0.4 (AP 1.7): TH-01 bleibt „Zur Umsetzung ausgewählt" (Liste und Detail umgesetzt, Bearbeiten und Löschen in M2); CH-06 bleibt bis M3.
- Version 0.4 (AP 1.6): „Implementiert": TS-25, SY-12 (Statusanzeige folgt mit AP 1.8).
- Version 0.4 (AP D2): „Implementiert": TS-07, TS-09, TS-21 (Pausentimer mit nächstem Satz, Wake Lock; Nachweise U, K und E in Chromium, Gerätetest steht aus).
- Version 0.3 (M0): Status nur dort geändert, wo der Nachweis vorliegt. „Getestet": SY-16 (Nachweis U bestanden) und SY-10 (E2E in Chromium und WebKit bestanden). „Implementiert": SY-01, SY-06, SY-08, SY-15, SY-17 (Gerätetest bzw. spätere Nachweise stehen aus). „Abgenommen": SY-14 (Gerätetest T-IPH-M0 mit iOS 27.0.1 bestanden). Teilweise umgesetzte Funktionen (SY-02, SY-11, SY-13, CH-08) bleiben „Zur Umsetzung ausgewählt"; ihr Stand steht in `implementation-plan.md` (Stand M0).
- Version 0.4 (M1, AP 1.1 und 1.2): TP-06 „Getestet" (Unit-, Komponenten- und E2E-Tests in Chromium und WebKit bestanden; der Gerätetest steht aus). TP-24 bleibt „Zur Umsetzung ausgewählt", bis „Vorlage verwenden" (M2) umgesetzt ist; „Nur heute trainieren" gibt es seit AP 1.4.
- Version 0.4 (M1, AP 1.4): „Implementiert" (Komponenten- und E2E-Tests in Chromium bestanden; WebKit in der CI und Gerätetest T-IPH-M1 stehen aus): TS-02, TS-03, TS-04, TS-05, TS-06, TS-11, TS-14, TS-22, TS-23, TS-24, TS-26, TS-27. Teilweise umgesetzt und deshalb unverändert: TS-01 (Start aus Programm folgt in M2), TS-12 und TS-13 (AP 1.6), TS-15 (Vergleich in M3), TS-07, TS-09 und TS-21 (AP 1.5), TS-25 (AP 1.6).
- Funktionen, die der Referenz-App laut Rezensionen fehlen, sind als Stand der Rezensionen (2024/2025) formuliert, nicht als aktueller Zustand der App (D-118).

## Legende

**Spalten:** ID · Funktion · Originalverhalten (Referenz-App) · Evidenz · Konfidenz · Herkunft · Nutzen · Abhängigkeiten · Aufwand · Prio · Umfang · Release · Entscheidung · Status · Akzeptanzkriterien. Das Modul ergibt sich aus Abschnitt und ID-Präfix.

**Konfidenz** (Beleglage zur Referenz-App): V verifiziert (offizielle Quelle oder Videoanalyse) · V-R nur über Nutzerrezensionen belegt · P plausibel, nicht bestätigt · N nur Drittquelle · VF laut Rezensionen fehlend oder eingeschränkt (Stand der Rezension; aktueller Stand nicht geprüft) · E eigener Vorschlag ohne Bezug zur Referenz-App.

**Herkunft:** OV Verifizierte Originalfunktion (Konfidenz V oder V-R) · ON Nicht verifizierte Originalfunktion (Konfidenz P oder N) · EV Eigene Verbesserung (Konfidenz VF oder E; Funktion geht über den belegten Stand der Referenz-App hinaus).

**Umfang:** MVP (für R1 ausgewählt) · Später (für eine spätere Ausbaustufe vorgesehen) · Ausgeschlossen (bewusst nicht geplant).

**Release:** R1 bis R5 mit Meilenstein (M0 bis M13), Backlog (später, noch ohne Stufe) oder „–".

**Nutzen:** H hoch · M mittel · N niedrig. **Aufwand:** S unter 1 Tag · M 1 bis 3 Tage · L 3 bis 7 Tage · XL über 1 Woche (Richtwerte). **Prio:** P0 kritische Grundlage · P1 Kernfunktion · P2 Erweiterung · P3 optional · „–" nicht geplant.

**Status:** Noch zu recherchieren · Analysiert · Spezifiziert · Zur Umsetzung ausgewählt · Implementiert · Getestet · Abgenommen. MVP-Zeilen stehen auf „Zur Umsetzung ausgewählt", spätere Zeilen mit konkreten Kriterien auf „Spezifiziert".

**Evidenz:** AS App Store (mit Version bei Release Notes) · GP Google Play · WEB Website der Referenz-App · HC-G Hilfecenter Gorgias · HC-Z Hilfecenter Zendesk · TC Challenge-Bedingungen · SD screensdesign-Videoanalyse (Zeitmarke) · DT Fallstudie der Entwicklungsagentur · MWM mwm.ai · REV Rezensionen · DC Discord. Details in `product-research.md`.

<!-- STATS-BEGIN -->
## Überblick in Zahlen

Automatisch erzeugt von `tools/feature_inventory_to_csv.py`.

| Herkunft | MVP | Später | Ausgeschlossen | Summe |
|---|---|---|---|---|
| Original verifiziert (OV) | 50 | 28 | 10 | 88 |
| Original nicht verifiziert (ON) | 13 | 13 | 2 | 28 |
| Eigene Verbesserung (EV) | 49 | 4 | 0 | 53 |
| Summe | 112 | 45 | 12 | 169 |

| Release | Funktionen |
|---|---|
| Backlog | 7 |
| R1 | 112 |
| R2 | 19 |
| R3 | 1 |
| R4 | 13 |
| R5 | 5 |

| Prio | P0 | P1 | P2 | P3 | – |
|---|---|---|---|---|---|
| Anzahl | 42 | 69 | 30 | 16 | 12 |

| Status | Anzahl |
|---|---|
| Abgenommen | 1 |
| Analysiert | 38 |
| Getestet | 3 |
| Implementiert | 91 |
| Noch zu recherchieren | 1 |
| Spezifiziert | 16 |
| Verworfen | 2 |
| Zur Umsetzung ausgewählt | 17 |
<!-- STATS-END -->

## A. Onboarding, Profil, Ziele (ON)

| ID | Funktion | Originalverhalten (Referenz-App) | Evidenz | Konfidenz | Herkunft | Nutzen | Abhängigkeiten | Aufwand | Prio | Umfang | Release | Entscheidung | Status | Akzeptanzkriterien |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ON-01 | Nutzung ohne Konto; lokales Profil mit optionalem Anzeigenamen | Pflicht-Registrierung mit E-Mail vor dem Quiz | SD 00:39; HC-G | V | OV | H | SY-01 | S | P0 | MVP | R1 · M3 | Anpassen: kein Konto; Anmeldung nur für Sync (D-113) | Implementiert | AK-SET-05 |
| ON-02 | Kurze Ersteinrichtung | Quiz mit 19 Schritten, danach Paywall | SD 01:12; GP | V | OV | M | ON-07; ON-18; TP-24; SY-14 | S | P1 | MVP | R1 · M3 | Anpassen: höchstens vier Schritte, alles überspringbar | Zur Umsetzung ausgewählt | AK-ONB-01 |
| ON-03 | Zieltyp (Abnehmen, Halten, Aufbauen, Leistung) | Ziele im Quiz; Programme nach Zielen | HC-G; GP; WEB | V | OV | M | NU-01 | S | P2 | Später | R2 · M5 | Später: steuert das Kalorienziel; im MVP ergibt sich die Richtung aus dem Zielgewicht | Analysiert | Zieltyp datiert gespeichert; steuert die Kalorienanpassung |
| ON-04 | Plausibilitätsprüfung für Zielgewicht und Zielrate | Warnung „Health risk!" bei zu ehrgeizigem Ziel | SD 01:58 | V | OV | M | ON-09; ON-18 | S | P2 | Später | R2 · M5 | Später: benötigt Größe und Zieldatum | Analysiert | Hinweis bei Zielrate über 1 % Körpergewicht pro Woche; keine Diagnose |
| ON-05 | Trainingsniveau | Survey-Frage „experience"; Level-Tags an Programmen | HC-G; WEB | V | OV | N | – | S | P3 | Später | Backlog | Später: nur als Metadatum von Vorlagen | Analysiert | Niveau filtert Vorlagen |
| ON-06 | Trainingsort und verfügbare Geräte | Home oder Gym, Geräte im Quiz | GP; HC-G | V | OV | M | TP-12 | M | P3 | Später | Backlog | Später: Filter für Übungsalternativen | Analysiert | Gerätefilter wirkt auf Alternativen und Bibliothek |
| ON-07 | Wochenziel „Trainings pro Woche" | Trainingshäufigkeit nicht belegt | – | P | ON | H | TH-08 | S | P1 | MVP | R1 · M3 | Übernehmen als Wochenziel (D-220) | Implementiert | AK-SET-01, AK-DSH-05 |
| ON-08 | Ernährungspräferenzen und Ausschlüsse | Diätpräferenz im Quiz; laut Rezensionen nur wenige Optionen | HC-G; REV | V | OV | M | RE-01 | S | P2 | Später | R2 · M7 | Anpassen: frei definierbare Tags | Analysiert | Rezeptfilter respektieren Ausschlüsse |
| ON-09 | Körperdaten für Formeln (Größe, Geburtsdatum, Geschlecht, Aktivität) | Gewicht und Alter im Quiz; Größe plausibel | GP; HC-G | V | OV | H | NU-01 | S | P1 | Später | R2 · M5 | Später: erst für die Kalorienberechnung nötig | Analysiert | Eingaben validiert; Formeln dokumentiert |
| ON-10 | Programmempfehlung nach dem Quiz | Empfohlenes Programm oder Katalog | HC-Z | V | OV | N | – | M | – | Ausgeschlossen | – | Ausschließen: Auswahl trifft der Nutzer selbst | Analysiert | Entfällt |
| ON-11 | Profil bearbeiten | „Profile & settings" | HC-G | V | OV | M | ON-01 | S | P1 | MVP | R1 · M3 | Übernehmen | Implementiert | AK-SET-02, AK-SET-05 |
| ON-12 | Einheiten metrisch oder imperial | Einstellung „Units" | HC-G | V | OV | N | – | S | – | Ausgeschlossen | – | Ausschließen: nur metrisch (D-104); Umrechnung bleibt intern | Analysiert | Entfällt |
| ON-13 | Erinnerungen und Benachrichtigungseinstellungen | Workout-Reminder; tägliche Motivationsnachrichten | AS 3.1.4; WEB | V | OV | M | Web Push; Server | L | P3 | Später | R5 | Später: nur installierte Web-App, Server nötig | Analysiert | Push nach Einwilligung; iOS nur installiert ab 16.4 |
| ON-14 | Programm wechseln, Ziel ändern | Menü, „Change workout plan", neues Ziel, Programm wählen | HC-Z | V | OV | H | TP-19; ON-18 | S | P1 | MVP | R1 · M2 | Übernehmen | Zur Umsetzung ausgewählt | AK-PRG-07, AK-SET-01 |
| ON-15 | Alle Daten löschen | Konto löschen ist permanent | WEB; REV | V | OV | H | SY-11 | S | P1 | MVP | R1 · M4 | Anpassen: lokal im MVP, Cloud-Daten ab R3 | Zur Umsetzung ausgewählt | AK-DAT-10 |
| ON-16 | Abo, Testphase, Paywall | 7 Tage Testphase, harte Paywall nach dem Quiz | AS; SD 02:38 | V | OV | N | – | – | – | Ausgeschlossen | – | Ausschließen (D-005) | Analysiert | Entfällt |
| ON-17 | Referral-Programm und Guthabenpunkte | Credits durch Nutzung, anrechenbar auf die Mitgliedschaft | AS 3.4.0; AS 3.4.2 | V | OV | N | – | – | – | Ausgeschlossen | – | Ausschließen (D-005) | Analysiert | Entfällt |
| ON-18 | Zielgewicht festlegen | Zielgewicht im Quiz mit Warnung | SD 01:58 | V | OV | H | BP-01 | S | P1 | MVP | R1 · M3 | Übernehmen | Implementiert | AK-SET-01, AK-DSH-06, AK-BW-05 |

## B. Trainingsplanung (TP)

| ID | Funktion | Originalverhalten (Referenz-App) | Evidenz | Konfidenz | Herkunft | Nutzen | Abhängigkeiten | Aufwand | Prio | Umfang | Release | Entscheidung | Status | Akzeptanzkriterien |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| TP-01 | Programme und Vorlagen | Benannte Trainerprogramme mit Level, Wochen, Minuten, Sätzen; Home und Gym | WEB; HC-Z | V | OV | H | TP-03; TP-24 | M | P0 | MVP | R1 · M1/M2 | Anpassen: eigene Programme, eigene Vorlagen, Beispielvorlagen; keine Inhalte der Referenz-App (D-106) | Implementiert | AK-PRG-01, AK-PRG-06, AK-PRG-11 |
| TP-02 | Programmdetailseite | Vorhanden, 2025 überarbeitet | AS 3.1.5 | V | OV | M | TP-01 | S | P1 | MVP | R1 · M2 | Übernehmen | Implementiert | AK-PRG-12 |
| TP-03 | Programmstruktur aus Wochen und Trainingstagen | Feste Wochenstruktur mit festen Ruhetagen (laut Rezensionen 2024/2025) | REV | V-R | OV | H | – | M | P0 | MVP | R1 · M2 | Anpassen: Wochen frei definierbar, keine festen Ruhetage (D-214) | Implementiert | AK-PRG-01, AK-PRG-02 |
| TP-04 | Übungsreihenfolge im Plan festlegen | Reihenfolge im Training erzwungen (laut Rezensionen) | REV | V-R | OV | H | TP-06 | M | P0 | MVP | R1 · M2 | Anpassen: sortierbar; im Training nicht erzwungen | Implementiert | AK-PRG-03, AK-TRN-08 |
| TP-05 | Einheiten im Kalender verschieben (Drag and Drop) | „Swap Workouts" per Drag and Drop | SD 12:05 | V | OV | M | AH-08 | M | P2 | Später | R4 · M11 | Später: der Reihenfolge-Modus macht Verschieben im MVP unnötig | Analysiert | Einheit per Ziehen oder Menü auf einen anderen Tag; Historie unberührt |
| TP-06 | Übungsbibliothek mit Suche und Filtern | Muskelkarte; Liste nach Muskel inklusive Übungen außerhalb des Programms | HC-G; SD 06:28; AS 3.4.2 | V | OV | H | – | M | P0 | MVP | R1 · M1 | Anpassen: eigene deutsche Basisbibliothek (D-213) | Getestet | AK-EXL-01, AK-EXL-02 |
| TP-07 | Übungsdetail mit Beschreibung, Muskeln, Gerät, Videolink | Eingebettetes Video pro Übung | REV; SD 12:38 | V | OV | M | TP-06 | S | P1 | MVP | R1 · M2 | Anpassen: mit persönlichem Videolink; Ausführung mit Quellen (D-398), Visuals nach Q-24 (D-397) | Implementiert | AK-EXL-04, AK-EXL-05 |
| TP-08 | Satzschema (Typ, Wiederholungsbereich, Zielgewicht, Zielzeit) | Feste Satzanzahl, Rep-Bereiche | REV; WEB | V | OV | H | TP-04 | M | P0 | MVP | R1 · M2 | Anpassen: frei editierbar | Implementiert | AK-PRG-04 |
| TP-09 | Pausenzeiten je Übung und Satz | Vorgegeben; Pausentimer vorhanden | AS 3.1.6; WEB | V | OV | H | TS-07 | S | P0 | MVP | R1 · M1/M2 | Übernehmen | Implementiert | AK-PRG-04, AK-TRN-10 |
| TP-10 | Drop-Sätze | „Refined dropsets" | AS 3.1.7; WEB | V | OV | M | TP-08 | M | P1 | MVP | R1 · M2 | Übernehmen (D-108) | Implementiert | AK-TRN-03, AK-PRG-04 |
| TP-11 | Supersätze und Zirkel | Nicht belegt | – | P | ON | M | TP-04 | M | P2 | Später | R4 · M11 | Später: Gruppenfeld im Datenmodell reserviert (D-108) | Spezifiziert | Übungen gruppierbar; Wechsel innerhalb der Gruppe; Pause nach der Gruppe |
| TP-12 | Übung im Plan ersetzen, mit Alternativen | Alternativen bei fehlendem Gerät (laut Rezensionen) | REV | V-R | OV | H | TP-06 | S | P1 | MVP | R1 · M2 | Übernehmen | Implementiert | AK-PRG-03 |
| TP-13 | Eigene Übungen | Nicht belegt | – | P | ON | H | TP-06 | S | P1 | MVP | R1 · M2 | Übernehmen | Implementiert | AK-EXL-03 |
| TP-14 | Eigenes Programm erstellen und bearbeiten | Nur Trainerprogramme (laut Rezensionen) | REV | VF | EV | H | TP-03 | L | P0 | MVP | R1 · M2 | Verbesserung (D-107) | Implementiert | AK-PRG-01 bis AK-PRG-04, AK-PRG-10 |
| TP-15 | Sätze im Plan hinzufügen und entfernen | Laut Rezensionen nicht möglich | REV | VF | EV | H | TP-08 | S | P0 | MVP | R1 · M2 | Verbesserung | Implementiert | AK-PRG-04 |
| TP-16 | Verpasste Einheiten nachholen, Tag frei wählen | Laut Rezensionen nur nach Zurücksetzen des Plans | REV | VF | EV | H | TP-21 | S | P1 | MVP | R1 · M2 | Verbesserung über den Reihenfolge-Modus | Implementiert | AK-PRG-08 |
| TP-17 | Vorschau aller Wochen und Tage | Laut Rezensionen nur der aktuelle Tag sichtbar | REV | VF | EV | M | TP-03 | S | P1 | MVP | R1 · M2 | Verbesserung | Implementiert | AK-PRG-12 |
| TP-18 | Progressionsvorschlag | Smart Weight Suggestion aus zuletzt erreichten Wiederholungen | HC-G; WEB | V | OV | M | TH-02 | M | P2 | Später | R4 · M11 | Später: transparente Regel (Double Progression) | Spezifiziert | Vorschlag mit sichtbarer Begründung; nie automatisch übernommen |
| TP-19 | Programm aktivieren, beenden, neu starten | Zurücksetzen möglich | REV; HC-Z | V-R | OV | M | TP-01 | S | P1 | MVP | R1 · M2 | Übernehmen | Implementiert | AK-PRG-07 |
| TP-20 | Programmphasen und Deload-Wochen | Nicht belegt | – | P | ON | N | TP-03 | M | P3 | Später | Backlog | Später: über die Wochenstruktur abbildbar | Analysiert | Optional |
| TP-21 | Reihenfolge-Modus: nächster Trainingstag aus der Programmfolge | – | – | E | EV | H | TP-03 | S | P0 | MVP | R1 · M2 | Verbesserung (D-214) | Implementiert | AK-PRG-08, AK-DSH-02 |
| TP-22 | Optionaler Wochentag je Trainingstag | – | – | E | EV | M | TP-21 | S | P2 | MVP | R1 · M2 | Verbesserung | Implementiert | AK-PRG-09 |
| TP-23 | Programm duplizieren | – | – | E | EV | H | TP-14 | S | P1 | MVP | R1 · M2 | Verbesserung (D-107) | Implementiert | AK-PRG-05 |
| TP-24 | Gekennzeichnete Beispielvorlagen | – | – | E | EV | M | TP-06 | S | P0 | MVP | R1 · M1 | Verbesserung (D-106); Inhalt in `sample-templates.md` | Implementiert | AK-PRG-06, AK-PWA-02 |
| TP-25 | Als Vorlage speichern, Vorlage verwenden | – | – | E | EV | M | TP-23 | S | P1 | MVP | R1 · M2 | Verbesserung (D-107) | Implementiert | AK-PRG-06 |
| TP-26 | Programm als Datei auf ein anderes Gerät übertragen | – | – | E | EV | M | SY-04 | S | P2 | Später | R3 · M9 | Ersetzt durch die Synchronisierung mit Supabase (D-259) | Analysiert | Programm erscheint nach der Synchronisierung auf dem zweiten Gerät |

## C. Aktive Trainingseinheit (TS)

| ID | Funktion | Originalverhalten (Referenz-App) | Evidenz | Konfidenz | Herkunft | Nutzen | Abhängigkeiten | Aufwand | Prio | Umfang | Release | Entscheidung | Status | Akzeptanzkriterien |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| TS-01 | Training starten: aus Programm, Vorlage oder frei | Start des Tagestrainings von Home | HC-G; SD | V | OV | H | TP-21 | M | P0 | MVP | R1 · M1 | Übernehmen | Zur Umsetzung ausgewählt | AK-TRN-01, AK-TRN-02, AK-TRN-22 |
| TS-02 | Übungsliste mit Sätzen | Video, Satzliste, Eingaben je Übung | SD 13:04 | V | OV | H | TP-06 | M | P0 | MVP | R1 · M1 | Anpassen: alle Übungen in einer Liste | Implementiert | AK-TRN-08, AK-UX-03 |
| TS-03 | Vorherige Leistungswerte | Vorherige Wiederholungen seit einem Update sichtbar | REV; AS | V | OV | H | SY-18 | S | P0 | MVP | R1 · M1 | Übernehmen | Implementiert | AK-TRN-05 |
| TS-04 | Gewicht eingeben | Verbesserte Gewichtsauswahl | AS 3.1.6 | V | OV | H | SY-16 | S | P0 | MVP | R1 · M1 | Übernehmen | Implementiert | AK-TRN-04 |
| TS-05 | Wiederholungen eingeben | Vorhanden | HC-G | V | OV | H | – | S | P0 | MVP | R1 · M1 | Übernehmen | Implementiert | AK-TRN-04 |
| TS-06 | Satz abschließen, mit Vorschlag | „log reps and weight after each set" | HC-G | V | OV | H | TS-04 | S | P0 | MVP | R1 · M1 | Übernehmen (D-225) | Implementiert | AK-TRN-06, AK-TRN-07 |
| TS-07 | Pausentimer | Startet nach dem Satz; läuft seit 3.1.6 im Hintergrund weiter | AS 3.1.6; SD 13:18 | V | OV | H | TP-09 | M | P0 | MVP | R1 · M1 | Anpassen: zeitstempelbasiert; kein Hintergrundton zugesagt (D-215) | Implementiert | AK-TRN-10, AK-TRN-11, AK-TRN-12 |
| TS-08 | Übungstimer für Zeitsätze | Vorhanden | AS 3.1.6 | V | OV | M | TS-07 | S | P1 | MVP | R1 · M2 | Übernehmen | Implementiert | AK-TRN-14 |
| TS-09 | Nächster Satz im Pausentimer | Fehlt laut Videoanalyse | SD 13:18 | VF | EV | M | TS-07 | S | P1 | MVP | R1 · M1 | Verbesserung | Implementiert | AK-TRN-10 |
| TS-10 | Übung im Training ersetzen | Möglich (laut Rezensionen) | REV | V-R | OV | H | TP-12 | S | P1 | MVP | R1 · M2 | Übernehmen | Implementiert | AK-TRN-09 |
| TS-11 | Sätze und Übungen im Training hinzufügen und entfernen | Sätze laut Rezensionen nicht ergänzbar | REV | VF | EV | H | – | S | P0 | MVP | R1 · M1 | Verbesserung | Implementiert | AK-TRN-09, AK-TRN-02 |
| TS-12 | Automatisches Speichern jeder Eingabe | Laut Rezensionen Abstürze mit Verlust der Eingaben | REV | VF | EV | H | SY-01 | M | P0 | MVP | R1 · M1 | Verbesserung | Zur Umsetzung ausgewählt | AK-TRN-16, AK-TRN-25 |
| TS-13 | Wiederaufnahme nach Reload, Hintergrund und Offline-Phase; Pausieren | Nicht belegt | – | P | ON | H | TS-12; SY-13 | M | P0 | MVP | R1 · M1/M2 | Übernehmen (D-109, D-216) | Zur Umsetzung ausgewählt | AK-TRN-17, AK-TRN-18, AK-TRN-26 |
| TS-14 | Training abschließen | „complete workout" | HC-G | V | OV | H | TS-06 | S | P0 | MVP | R1 · M1 | Übernehmen | Implementiert | AK-TRN-19 |
| TS-15 | Trainingszusammenfassung | Übungen, Kalorien, Sätze | SD 14:40 | V | OV | M | TS-14 | S | P0 | MVP | R1 · M1/M3 | Anpassen: ohne Kalorienschätzung (D-226); Vergleich ab M3 | Zur Umsetzung ausgewählt | AK-TRN-20 |
| TS-16 | Ergebnis teilen | Social Sharing | AS 3.1.5; AS 3.2.1 | V | OV | N | Web Share | S | P3 | Später | R5 | Später | Analysiert | Bild erzeugen und über das Teilen-Menü teilen |
| TS-17 | Krafttraining nachtragen, Aktivität erfassen | Manuelle Workouts seit 3.4.11 | AS 3.4.11 | V | OV | H | TS-01 | M | P1 | MVP | R1 · M2 | Anpassen: Krafttraining mit Sätzen oder Aktivität mit Dauer und Distanz | Implementiert | AK-TRN-23 |
| TS-18 | Kalorienschätzung pro Einheit | In der Zusammenfassung | SD 14:40 | V | OV | N | ON-09 | S | P2 | MVP | R1 · Schritt E | Vorgezogen als gekennzeichnete Schätzung nach MET (D-251, Q-16) | Implementiert | AK-HIS-06 |
| TS-19 | Notizen zu Einheit und Übung | Nicht belegt | – | P | ON | M | – | S | P2 | MVP | R1 · M2 | Übernehmen | Implementiert | AK-TRN-24 |
| TS-20 | RPE/RIR und Tempo | Nicht belegt | – | P | ON | N | TS-05 | S | P3 | Später | R4 · M11 | Später: Feld im Datenmodell reserviert (D-108) | Spezifiziert | Optionales Feld je Satz |
| TS-21 | Bildschirm während des Trainings aktiv halten | – | – | E | EV | H | Wake Lock (iOS ab 18.4 in installierten Web-Apps) | S | P1 | MVP | R1 · M1 | Verbesserung (D-215, D-228) | Implementiert | AK-TRN-13 |
| TS-22 | Aufwärmsätze | Nicht belegt | – | P | ON | H | TP-08 | S | P0 | MVP | R1 · M1 | Übernehmen (D-108) | Implementiert | AK-TRN-03 |
| TS-23 | Satzstatus geplant, erledigt, übersprungen | – | – | E | EV | H | TS-06 | S | P0 | MVP | R1 · M1 | Verbesserung (D-108) | Implementiert | AK-TRN-07 |
| TS-24 | Fortschrittsanzeige der Einheit | – | – | E | EV | M | TS-02 | S | P1 | MVP | R1 · M1 | Verbesserung (D-108) | Implementiert | AK-TRN-15 |
| TS-25 | Leiste „Training läuft" und Rücksprung ins Training | – | – | E | EV | H | TS-13 | S | P0 | MVP | R1 · M1 | Verbesserung | Implementiert | AK-TRN-17, AK-DSH-01 |
| TS-26 | Training verwerfen | – | – | E | EV | M | TS-01 | S | P1 | MVP | R1 · M1 | Verbesserung | Implementiert | AK-TRN-21 |
| TS-27 | Freie Reihenfolge der Satzerfassung | Erzwungene Reihenfolge (laut Rezensionen) | REV | VF | EV | H | TS-02 | S | P0 | MVP | R1 · M1 | Verbesserung | Implementiert | AK-TRN-08 |

## D. Trainingshistorie und Analyse (TH)

| ID | Funktion | Originalverhalten (Referenz-App) | Evidenz | Konfidenz | Herkunft | Nutzen | Abhängigkeiten | Aufwand | Prio | Umfang | Release | Entscheidung | Status | Akzeptanzkriterien |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| TH-01 | Verlauf mit Detail, Bearbeiten und Löschen | Historie wird gespeichert | HC-G | V | OV | H | TS-14 | M | P0 | MVP | R1 · M1/M2 | Übernehmen | Implementiert | AK-HIS-01 bis AK-HIS-04 |
| TH-02 | Übungsverlauf als Liste und Diagramm | Anspruch „visualize your rep & weight progress"; Nutzer vermissen Verlaufsgraphen (Rezensionen) | AS; REV | V | OV | H | SY-18; Recharts | M | P1 | MVP | R1 · M2/M3 | Anpassen: Diagramm aus echten Daten als Verbesserungsziel | Implementiert | AK-EXL-05, AK-HIS-05 |
| TH-03 | Trainingskalender | Nicht belegt | – | P | ON | M | AH-08 | M | P2 | Später | R4 · M11 | Später | Analysiert | Monatsansicht mit geplanten und absolvierten Einheiten |
| TH-04 | Streaks | „New streak feature" seit 3.2.0; Regeln unbekannt | AS 3.2.0 | V | OV | N | TH-01 | S | – | Ausgeschlossen | – | Ausschließen: keine Serien-Zähler, Konsistenz als Wochenbild (Markenleitplanken Regel 2, D-318) | Verworfen | Entfällt |
| TH-05 | Persönliche Bestleistungen | Nicht belegt | – | P | ON | H | SY-18 | M | P2 | MVP | R1 · Schritt E | Vorgezogen mit Schritt E (D-252) | Implementiert | AK-HIS-07 |
| TH-06 | Statistik zu Frequenz, Dauer, Volumen | Nicht belegt | – | P | ON | M | TH-01 | M | P2 | MVP | R1 · Schritt E | Vorgezogen mit Schritt E (D-252) | Implementiert | AK-HIS-06 |
| TH-07 | Vergleich mit der vorherigen Einheit | Vorherige Wiederholungen sichtbar | REV | V | OV | M | TS-03 | S | P1 | MVP | R1 · M3 | Übernehmen | Implementiert | AK-TRN-20, AK-DSH-04 |
| TH-08 | Fortschritt zum Wochenziel | Nicht belegt | – | P | ON | M | ON-07 | S | P1 | MVP | R1 · M3 | Übernehmen (D-220) | Implementiert | AK-DSH-05 |

## E. Ernährung (NU)

| ID | Funktion | Originalverhalten (Referenz-App) | Evidenz | Konfidenz | Herkunft | Nutzen | Abhängigkeiten | Aufwand | Prio | Umfang | Release | Entscheidung | Status | Akzeptanzkriterien |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| NU-01 | Kalorien- und Makroziele berechnen | Aus Präferenzen, Alter, Gewicht, Ziel; Formel unbekannt | HC-G; GP; HC-Z | V | OV | H | ON-09 | M | P1 | MVP | R1 · Schritt G | Anpassen: dokumentierte Formel, überschreibbar, vorgezogen (D-261) | Implementiert | AK-NUT-05 |
| NU-02 | Tagesübersicht mit Zielfortschritt | Kalorien-Widget, „clearer daily targets" | AS 3.1.5; AS 3.5.0 | V | OV | H | NU-05 | M | P1 | MVP | R1 · Schritt G | Übernehmen, vorgezogen (D-261) | Implementiert | AK-NUT-01 |
| NU-03 | Mahlzeiten-Slots | Frühstück, Mittag, Abend (laut Rezensionen) | REV | V | OV | H | – | S | P1 | MVP | R1 · Schritt G | Anpassen: konfigurierbar, vorgezogen (D-261) | Implementiert | AK-NUT-01 |
| NU-04 | Geplante Mahlzeit protokollieren und wechseln | „switch meals, log them" | SD 05:54; HC-G | V | OV | M | RE-03 | M | P2 | Später | R2 · M8 | Anpassen: aus dem eigenen Wochenmenü | Analysiert | Ein Tipp protokolliert die geplante Mahlzeit |
| NU-05 | Lebensmittel oder Mahlzeit protokollieren, mit Snapshot | Portionsanteil, z. B. 0,75 | HC-G | V | OV | H | NU-08 | M | P1 | MVP | R1 · Schritt G | Übernehmen, vorgezogen (D-261) | Implementiert | AK-NUT-01 |
| NU-06 | Hinzufügen als selbstgemacht, Restaurant oder per Barcode | Drei Wege über „+" | HC-G | V | OV | H | NU-07; NU-10 | M | P1 | Später | R2 · M5/M6 | Übernehmen | Spezifiziert | Jeder Weg erzeugt ein validiertes Lebensmittel mit Quelle |
| NU-07 | Barcode-Scanning | Vorhanden, 2026 verbessert | REV; AS 3.5.0 | V | OV | H | Kamera; barcode-detector; Open Food Facts | L | P2 | MVP | R1 · Schritt G | Anpassen: Polyfill (D-305), Open Food Facts nach Einwilligung, vorgezogen (D-266) | Implementiert | AK-NUT-09 |
| NU-08 | Lebensmittelsuche | Vorhanden; bekannte Marken fehlen oft (laut Rezensionen) | REV | V | OV | H | NU-21; Open Food Facts | L | P1 | MVP | R1 · Schritt G | Anpassen: lokal zuerst, für jede Datenquelle (D-356); online nur per Barcode (D-302) | Implementiert | AK-NUT-14 |
| NU-09 | Portionsgröße und Anzahl kombinierbar | Nur eines von beiden (laut Rezension) | REV | VF | EV | H | NU-05 | S | P1 | MVP | R1 · Schritt G | Verbesserung, vorgezogen (D-261) | Implementiert | AK-NUT-02 |
| NU-10 | Eigene Lebensmittel mit Nährwerten | Manuelle Eingabe mit Nährwerten | SD 05:54 | V | OV | H | – | S | P1 | MVP | R1 · Schritt G | Übernehmen, vorgezogen (D-261) | Implementiert | AK-NUT-03 |
| NU-11 | Favoriten, zuletzt verwendet, Mahlzeitvorlagen | Von Nutzern gewünscht, nicht belegt | REV | VF | EV | H | NU-05 | M | P1 | MVP | R1 · Schritt G | Verbesserung, vorgezogen (D-268) | Implementiert | AK-NUT-11 |
| NU-12 | Ernährungsverlauf | Historie wird gespeichert | HC-G | V | OV | H | NU-02 | S | P1 | Später | R2 · M5 | Übernehmen | Spezifiziert | Jeder Tag aufrufbar und editierbar; Wochendurchschnitt |
| NU-13 | Wassertracking | Nur als tägliche Challenge-Aufgabe | TC | V | OV | M | – | S | P3 | Später | R4 · M13 | Später, mit den Gewohnheiten | Analysiert | Schnelleingabe in ml; Tagesziel |
| NU-14 | Fotoerkennung von Mahlzeiten | Nur in einer Drittquelle genannt | MWM | N | ON | N | KI-Dienst | XL | – | Ausgeschlossen | – | Ausschließen | Analysiert | Entfällt |
| NU-15 | Neuberechnung bei Mengenänderung | Seit 3.1.7 | AS 3.1.7 | V | OV | H | NU-05 | S | P1 | MVP | R1 · Schritt G | Übernehmen, vorgezogen (D-261) | Implementiert | AK-NUT-02 |
| NU-16 | Nährwert-Aufschlüsselung je Lebensmittel | Protein, Fett, Kohlenhydrate | REV | V | OV | M | NU-08 | S | P1 | MVP | R1 · Schritt G, D-364 | Übernehmen, vorgezogen (D-264); Tabelle einzeilig in festen Spalten (D-364) | Implementiert | AK-NUT-08 |
| NU-17 | Ziele manuell überschreiben | Nicht belegt | – | P | ON | M | NU-01 | S | P2 | MVP | R1 · Schritt G | Übernehmen, vorgezogen (D-261) | Implementiert | AK-NUT-05 |
| NU-18 | Roh- und Gargewicht | Nicht belegt | – | P | ON | M | NU-21 | S | P2 | Später | R2 · M5 | Anpassen: getrennte Einträge roh und gegart aus dem BLS; optionaler Faktor | Analysiert | Faktor-Werte als Schätzung markiert |
| NU-19 | Quelle und Qualitätsstatus je Lebensmittel | Nicht belegt | – | E | EV | M | NU-10 | S | P1 | Später | R2 · M5 | Verbesserung (D-110) | Spezifiziert | Quelle sichtbar; Anteil geschätzter Werte in der Tagessumme |
| NU-20 | Schnelleintrag nur mit kcal und Makros | Nicht belegt | – | E | EV | M | NU-05 | S | P2 | MVP | R1 · Schritt G | Verbesserung, vorgezogen (D-261) | Implementiert | AK-NUT-04 |
| NU-21 | Generische Lebensmittel mit deutschen Namen | – | – | E | EV | H | Grundauswahl aus dem BLS 4.0 (D-361, D-362); importierte ÖNWT-Daten (D-263) | M | P1 | MVP | R1 · Schritt G | Verbesserung (D-110, D-301), vorgezogen (D-261); kuratierte Grundauswahl mit österreichischen Namen statt des ganzen BLS (D-362) | Implementiert | AK-NUT-01, AK-NUT-06, AK-NUT-17 |
| NU-22 | Kennzeichnung unvollständiger Nährwerte | – | – | E | EV | M | NU-10 | S | P1 | MVP | R1 · Schritt G | Verbesserung (D-110), vorgezogen (D-261) | Implementiert | AK-NUT-04 |
| NU-23 | Einheiten und Haushaltsmaße mit Umrechnung | – | – | E | EV | H | NU-09 | M | P1 | Später | R2 · M5 | Verbesserung (D-110) | Spezifiziert | g, ml, Stück, Portion; ml in g nur über Dichte, sonst markiert |
| NU-24 | Offline-Verhalten der Online-Suche | – | – | E | EV | M | NU-08 | S | P1 | MVP | R1 · Schritt G | Verbesserung, vorgezogen (D-266): ohne Netz Hinweis, lokale Treffer, „Selbst anlegen“ mit Barcode; „für später merken“ entfällt vorerst | Implementiert | AK-NUT-09 |
| NU-26 | Einkaufsliste in „Meine Küche“ | – | – | E | EV | H | – | M | P1 | MVP | R1 · D-287 | Wunsch des Produktinhabers (D-287); Wischen zum Löschen (D-360) | Implementiert | AK-NUT-12, AK-NUT-16 |
| NU-27 | Wasser: Tagesmenge, Ziel, Schnellmengen, Verlauf | – | – | E | EV | H | – | M | P1 | MVP | R1 · D-289 | Wunsch des Produktinhabers (D-289) | Implementiert | AK-NUT-13 |
| NU-28 | Salz, Zucker, gesättigte Fettsäuren und Ballaststoffe mit Tagesreferenz | – | – | E | EV | M | NU-16 | S | P1 | MVP | R1 · D-359, D-363, D-369 | Wunsch des Produktinhabers (Planpunkt 58): Referenzmengen statt Ziele (D-359), kompakt mit Info-Blatt (D-363), Zucker und gesättigte Fettsäuren aus dem Tagesziel (D-369) | Implementiert | AK-NUT-15 |
| NU-29 | Richtwerte je Stück, vorausgewählt; eigenes Gewicht gemerkt | – | – | E | EV | H | NU-21 | S | P1 | MVP | R1 · D-362, D-365, D-368 | Auftrag des Produktinhabers (D-361, D-365): Richtwerte aus europäischen Quellen statt Frage, keine US-Größen; eigenes Gewicht gemerkt und zurücksetzbar; am 25.10.2026 freigegeben (D-368) | Implementiert | AK-NUT-18 |
| NU-25 | Lizenz- und Quellenhinweise für Lebensmitteldaten | – | – | E | EV | M | D-301; D-302 | S | P1 | MVP | R1 · Schritt G | Verbesserung, vorgezogen (D-261); Quelle je Eintrag und Lizenzliste unter „Über die App“ (D-362), Zitierweise des BLS mit DOI (D-366) | Implementiert | AK-NUT-06, AK-NUT-07, AK-NUT-19 |

## F. Rezepte und Mahlzeitenplanung (RE)

| ID | Funktion | Originalverhalten (Referenz-App) | Evidenz | Konfidenz | Herkunft | Nutzen | Abhängigkeiten | Aufwand | Prio | Umfang | Release | Entscheidung | Status | Akzeptanzkriterien |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| RE-01 | Rezeptkatalog mit Filtern | Nach Mahlzeit, Küche, Schwierigkeit | AS 3.5.0 | V | OV | H | RE-02 | M | P2 | Später | R2 · M7 | Anpassen: eigene Rezepte | Spezifiziert | Filter nach Mahlzeit, Tags, Dauer, kcal pro Portion; Volltextsuche |
| RE-02 | Rezept mit Zutaten, Schritten, Nährwerten pro Portion | Rezepte und Anleitungen vorhanden | AS; REV | V | OV | H | NU-10 | M | P1 | MVP | R1 · M7 | Übernehmen, vorgezogen (D-267) | Implementiert | AK-NUT-10 |
| RE-03 | Wochenmenü erstellen, manuell oder per Vorschlag | Generiert um das Kalorienziel | AS 3.5.0 | V | OV | M | RE-01; NU-01 | L | P2 | Später | R2 · M8 | Anpassen: manuelle Planung zuerst; Vorschlag aus eigenem Katalog nachrangig | Spezifiziert | Woche × Slots; Tagessummen sichtbar |
| RE-04 | Rezepte im Plan tauschen | „swap recipes" | AS 3.5.0 | V | OV | H | RE-03 | S | P1 | Später | R2 · M8 | Übernehmen | Spezifiziert | Tausch aktualisiert Summen und Einkaufsliste |
| RE-05 | Kochtage und Reste | „pick your cooking days" | AS 3.5.0 | V | OV | M | RE-03 | M | P3 | Später | Backlog | Später | Analysiert | Kochtage markierbar; Reste auf Folgetage verteilbar |
| RE-06 | Auswahl der geplanten Mahlzeiten | „choose which meals [the app] plans" | AS 3.5.0 | V | OV | M | RE-03 | S | P2 | Später | R2 · M8 | Übernehmen | Spezifiziert | Slots pro Woche ein- und ausschaltbar |
| RE-07 | Woche bestätigen | „confirmed week" | AS 3.5.0 | V | OV | M | RE-03 | S | P2 | Später | R2 · M8 | Übernehmen | Spezifiziert | Bestätigung erzeugt die Einkaufsliste; spätere Änderung markiert sie als veraltet |
| RE-08 | Einkaufsliste aus der bestätigten Woche | Vorhanden | AS 3.5.0 | V | OV | H | RE-07 | M | P1 | Später | R2 · M8 | Übernehmen | Spezifiziert | Aus Rezepten × Portionen; reproduzierbar |
| RE-09 | Einkaufsliste nach Kategorien | „easier to read and shop from" | AS 3.5.1 | V | OV | H | RE-08 | S | P1 | Später | R2 · M8 | Übernehmen | Spezifiziert | Gruppierung nach Lebensmittelkategorie |
| RE-10 | Einkaufsliste bearbeiten, abhaken, Vorrat | Nicht belegt | – | P | ON | H | RE-08 | S | P1 | Später | R2 · M8 | Übernehmen | Spezifiziert | Eigene Einträge; Abhaken gespeichert; Vorrat ausblendbar |
| RE-11 | Zutatenmengen zusammenführen | Plausibel | – | P | ON | H | RE-08 | M | P1 | Später | R2 · M8 | Übernehmen | Spezifiziert | Gleiche Zutat und Einheit summiert; Stück getrennt von Gramm |
| RE-12 | Eigene Rezepte anlegen und bearbeiten | Nicht belegt | – | P | ON | H | RE-02 | M | P1 | MVP | R1 · M7 | Anpassen: Snapshots statt Versionsketten (D-209); Konfliktkopie bei Sync (D-208), vorgezogen (D-267) | Implementiert | AK-NUT-10 |
| RE-13 | Portionsskalierung | Nicht belegt | – | P | ON | H | RE-02 | S | P1 | MVP | R1 · M7 | Übernehmen, vorgezogen (D-267): Portionen ganzzahlig, eingetragen wird die Anzahl Portionen | Implementiert | AK-NUT-10 |
| RE-14 | Planung nach Ernährungspräferenzen | Vorschläge respektieren Präferenzen | HC-G | V | OV | M | ON-08 | S | P3 | Später | Backlog | Später | Analysiert | Ausschlüsse wirken auf Vorschläge |
| RE-15 | Rezept-Import aus URL oder Text | Nicht belegt | – | E | EV | M | RE-12 | L | P3 | Später | R5 | Später | Analysiert | Später |

## G. Körper und Fortschritt (BP)

| ID | Funktion | Originalverhalten (Referenz-App) | Evidenz | Konfidenz | Herkunft | Nutzen | Abhängigkeiten | Aufwand | Prio | Umfang | Release | Entscheidung | Status | Akzeptanzkriterien |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| BP-01 | Körpergewicht erfassen, bearbeiten, löschen, als Liste | Gewicht im Onboarding; ein Verlauf ist nur in einer Drittquelle genannt | GP; MWM | V | OV | H | – | S | P0 | MVP | R1 · M3 | Übernehmen (D-111) | Implementiert | AK-BW-01 bis AK-BW-04 |
| BP-02 | Gewichtsverlauf mit Trend | Nur in einer Drittquelle genannt | MWM | N | ON | H | BP-01; Recharts | M | P1 | MVP | R1 · M3 | Übernehmen (D-111) | Implementiert | AK-BW-05, AK-BW-06 |
| BP-03 | Körpermaße | Nicht belegt | – | P | ON | M | – | S | P2 | Später | R4 · M12 | Später | Analysiert | Umfänge in cm mit Verlauf |
| BP-04 | Körperfett, optional | Nicht belegt | – | P | ON | N | – | S | P3 | Später | R4 · M12 | Später | Analysiert | Prozentwert mit Messmethode |
| BP-05 | Fortschrittsfotos, lokal | „progress photo library" (Rezension); Fotos für Challenges | REV; TC | V | OV | M | Gerätespeicher | L | P2 | Später | R4 · M12 | Später: lokal (D-114); Cloud in R5 | Analysiert | Lokal komprimiert; Vergleich; Export; vollständige Löschung |
| BP-06 | Fortschritt zum Zielgewicht | Zielgewicht im Onboarding | SD 01:58 | V | OV | M | ON-18 | S | P1 | MVP | R1 · M3 | Übernehmen | Implementiert | AK-DSH-06, AK-BW-05 |
| BP-07 | Wochen- und Monatsauswertung | Nicht belegt | – | P | ON | M | TH-06 | M | P2 | Später | R4 · M12 | Später | Analysiert | Zusammenfassung pro Woche aus echten Daten |
| BP-08 | Persönliche Notizen pro Tag | Nicht belegt | – | P | ON | N | – | S | P3 | Später | Backlog | Später | Analysiert | Freitext pro Tag |

## H. Aktivität und Gewohnheiten (AH)

| ID | Funktion | Originalverhalten (Referenz-App) | Evidenz | Konfidenz | Herkunft | Nutzen | Abhängigkeiten | Aufwand | Prio | Umfang | Release | Entscheidung | Status | Akzeptanzkriterien |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| AH-01 | Schritte erfassen, manuell oder per Kurzbefehl | Schritte beworben; Datenquelle unklar | WEB; DT | V | OV | M | – | M | P2 | Später | R4 · M13 (automatisch R5) | Anpassen: manuell sowie Kurzbefehl über Datei oder Zwischenablage; automatisch erst über Server in R5 (D-115) | Noch zu recherchieren | Tageswert; Import; keine Behauptung automatischer Messung |
| AH-02 | Aktivitätsziele | Nicht belegt | – | P | ON | M | AH-01 | S | P3 | Später | R4 · M13 | Später | Analysiert | Tagesziel mit Fortschritt |
| AH-03 | Tägliche Aufgaben | In Challenges: Wasser, Lesen, Schritte, Diät | TC | V | OV | M | AH-04 | M | P2 | MVP | R1 · Schritt F | Anpassen: eigene Aufgaben ohne Vorgaben, vorgezogen (D-253, Q-17) | Implementiert | AK-HAB-01 |
| AH-04 | Gewohnheiten definieren und verfolgen | Außerhalb von Challenges nicht belegt | – | P | ON | M | – | M | P2 | MVP | R1 · Schritt F | Täglich vorgezogen (D-253); Häufigkeiten und Erfüllungsquote später | Implementiert | AK-HAB-01 |
| AH-05 | Streaks für Gewohnheiten | Streak-Funktion für Training | AS 3.2.0 | V | OV | N | AH-04 | S | – | Ausgeschlossen | – | Auf Wunsch des Produktinhabers entfernt (D-283): nur „x von y erledigt“ | Verworfen | AK-HAB-02 |
| AH-06 | Erinnerungen | Workout-Reminder | AS 3.1.4 | V | OV | M | ON-13 | L | P3 | Später | R5 | Später | Analysiert | Siehe ON-13 |
| AH-07 | Apple Health, Apple Watch, Wearables | Laut Agentur integriert; Rezensionen bezweifeln es | DT; REV | N | ON | M | Native App | XL | – | Ausgeschlossen | – | Ausschließen für die Web-App (D-116); native Option dokumentiert | Analysiert | Entfällt in der Web-App |
| AH-08 | Kalender aller Ereignisse | Nicht belegt | – | P | ON | M | TH-03 | M | P2 | Später | R4 · M11 | Später | Analysiert | Monats- und Wochenansicht mit allen Ereignissen |
| AH-09 | Manuelle Aktivitätseinträge | Manuelle Workouts | AS 3.4.11 | V | OV | H | TS-17 | – | P1 | MVP | R1 · M2 | Übernehmen über TS-17 | Implementiert | AK-TRN-23 |

## I. Challenges, Community, Dashboard (CH)

| ID | Funktion | Originalverhalten (Referenz-App) | Evidenz | Konfidenz | Herkunft | Nutzen | Abhängigkeiten | Aufwand | Prio | Umfang | Release | Entscheidung | Status | Akzeptanzkriterien |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| CH-01 | Persönliche Challenges mit Tagesaufgaben | Zeitlich begrenzte Programme mit Aufgaben, Fotos, Gewinnern | TC | V | OV | N | AH-04 | M | P3 | Später | Backlog | Später: nur persönlich, ohne Wettbewerb | Analysiert | Dauer, Aufgaben, Fortschritt in Prozent |
| CH-02 | Wettbewerb, Rangliste, Preise | Gewinnerauswahl; „top 5" | TC; REV | V | OV | N | – | – | – | Ausgeschlossen | – | Ausschließen (D-005) | Analysiert | Entfällt |
| CH-03 | Community (Discord) | Extern | DC | V | OV | N | – | – | – | Ausgeschlossen | – | Ausschließen | Analysiert | Entfällt |
| CH-04 | Social Sharing | Vorhanden | AS 3.1.5 | V | OV | N | Web Share | S | P3 | Später | R5 | Später | Analysiert | Siehe TS-16 |
| CH-05 | Motivationsnachrichten | Beworben | WEB | V | OV | N | – | S | – | Ausgeschlossen | – | Ausschließen | Analysiert | Entfällt |
| CH-06 | Dashboard „Heute" | Workout-Karte, Kalorien-Widget, „+" | SD; HC-G | V | OV | H | TS-01; BP-01 | M | P0 | MVP | R1 · M1/M3 | Anpassen: nur verfügbare Daten, keine Platzhalter | Zur Umsetzung ausgewählt | AK-DSH-01 bis AK-DSH-07, AK-UX-02 |
| CH-07 | Schnellaktionen | „Plus-Zone" | HC-G; AS 3.4.2 | V | OV | H | – | S | P1 | MVP | R1 · M3 | Anpassen: Aktion „Erfassen" | Zur Umsetzung ausgewählt | AK-DSH-08 |
| CH-08 | Navigation mit Hauptbereichen | Vier Hauptscreens mit Tab-Leiste | HC-G | V | OV | H | – | S | P0 | MVP | R1 · M0 | Anpassen: Heute, Training, Fortschritt, Mehr (D-211) | Zur Umsetzung ausgewählt | AK-UX-01, AK-UX-07 |
| CH-09 | Shop, Supplements, Coaching, PDF-Guides | Geschäftsmodell | WEB | V | OV | N | – | – | – | Ausgeschlossen | – | Ausschließen (D-005) | Analysiert | Entfällt |

## J. System, Daten, Synchronisierung (SY)

| ID | Funktion | Originalverhalten (Referenz-App) | Evidenz | Konfidenz | Herkunft | Nutzen | Abhängigkeiten | Aufwand | Prio | Umfang | Release | Entscheidung | Status | Akzeptanzkriterien |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| SY-01 | Lokale Datenbank (Dexie, IndexedDB) als führender Speicher | Server-Backend | DT | E | EV | H | – | M | P0 | MVP | R1 · M0 | Verbesserung (D-113, D-204) | Implementiert | AK-DAT-07, AK-DAT-11, AK-UX-06 |
| SY-02 | PWA mit Installation, Offline-Betrieb, Update-Hinweis | Native App | – | E | EV | H | SY-15 | M | P0 | MVP | R1 · M0/M4 | Verbesserung (D-101); Update-Strategie und Start nach Updates (D-343) | Implementiert | AK-PWA-01 bis AK-PWA-03, AK-DEV-01, AK-DEV-02 |
| SY-03 | Cloud-Synchronisierung | Server-Backend | DT | E | EV | H | SY-09; SY-17 | XL | P1 | MVP | R1 · M9 | Verbesserung (D-205), erste Stufe vorgezogen (D-269): ganze Dokumente, jüngerer HLC, Regeln K-01 und Konfliktkopie; Sendungen je Konto nacheinander (A-05, D-349) | Implementiert | AK-SYN-02, AK-SYN-03 |
| SY-04 | Export und Import | Nicht belegt | – | E | EV | H | SY-01 | M | P0 | MVP | R1 · M1/M2/M4 | Verbesserung (D-218); Wiederherstellen D-345; Dateiname `form-sicherung-…` D-352 | Implementiert | AK-DAT-01, AK-DAT-02, AK-DAT-04, AK-DAT-05 |
| SY-05 | Backup und Wiederherstellung | – | – | E | EV | H | SY-04; SY-11 | M | P1 | MVP | R1 · M2/M4 (Cloud R3) | Verbesserung | Zur Umsetzung ausgewählt | AK-DAT-02, AK-DAT-12 |
| SY-06 | Hell- und Dunkelmodus | – | – | E | EV | M | Design-Tokens | S | P1 | MVP | R1 · M0/M4 | Verbesserung (D-119) | Implementiert | AK-SET-03, AK-UX-04 |
| SY-07 | Tastaturbedienung und Barrierearmut | – | – | E | EV | M | – | M | P1 | MVP | R1 · M4 | Verbesserung | Zur Umsetzung ausgewählt | AK-UX-03 bis AK-UX-05, AK-UX-08 |
| SY-08 | Lokales Fehlerprotokoll ohne Nutzdaten | – | – | E | EV | M | – | S | P1 | MVP | R1 · M1/M4 | Verbesserung | Implementiert | AK-DAT-09 |
| SY-09 | Anmeldung nur für die Sync | Pflichtkonto | SD 00:39 | E | EV | M | SY-03 | M | P1 | MVP | R1 · M9 | Verbesserung, vorgezogen (D-269): E-Mail und Passwort, Konto im Supabase-Dashboard | Implementiert | AK-SYN-01 |
| SY-10 | Keine Drittanbieter-Telemetrie | Tracking-Identifier laut Privacy Label | AS | E | EV | H | – | S | P0 | MVP | R1 · M0 | Verbesserung (D-030) | Getestet | AK-PWA-06 |
| SY-11 | Automatischer Snapshot vor riskanten Vorgängen | – | – | E | EV | H | SY-01 | M | P0 | MVP | R1 · M1/M4 | Verbesserung (D-217) | Zur Umsetzung ausgewählt | AK-DAT-06, AK-DAT-04 |
| SY-12 | Dauerhaften Speicher anfordern, Speicherstatus | – | – | E | EV | H | – | S | P1 | MVP | R1 · M1/M4 | Verbesserung | Implementiert | AK-PWA-05 |
| SY-13 | Wiederherstellung bei Datenbankfehlern | Anlass: Abstürze mit Datenverlust (laut Rezensionen) | REV | E | EV | H | SY-11 | M | P0 | MVP | R1 · M1/M4 | Verbesserung (D-216) | Zur Umsetzung ausgewählt | AK-DAT-08, AK-TRN-25, AK-TRN-26 |
| SY-14 | Hinweis bei Nutzung im Safari-Tab | – | – | E | EV | H | SY-02 | S | P0 | MVP | R1 · M0 | Verbesserung | Abgenommen | AK-PWA-04, AK-SET-06 |
| SY-15 | Hosting mit fester HTTPS-Adresse und Vorschau-Umgebungen | – | – | E | EV | H | Q-01; Q-02 | S | P0 | MVP | R1 · M0 | Verbesserung (D-021) | Implementiert | AK-PWA-07 |
| SY-16 | Deutsche Oberfläche, Formatierung nach Gerätesprache | – | – | E | EV | H | – | S | P0 | MVP | R1 · M0 | Verbesserung (D-103, D-212) | Getestet | AK-SET-04 |
| SY-17 | Sync-fähige Metadaten ab Schema v1 | – | – | E | EV | H | SY-01 | S | P0 | MVP | R1 · M0 | Verbesserung (D-206, D-207) | Implementiert | AK-DAT-11 |
| SY-18 | Lokale Projektionen für Auswertungen | – | – | E | EV | H | SY-01 | S | P0 | MVP | R1 · M1 | Verbesserung (D-204) | Zur Umsetzung ausgewählt | AK-TRN-05, AK-HIS-03 |
| SY-19 | Import mit Zusammenführung nach Konfliktregeln | – | – | E | EV | H | SY-04 | M | P1 | MVP | R1 · M4 | Verbesserung (D-218) | Zur Umsetzung ausgewählt | AK-DAT-03 |
| SY-20 | Versionsanzeige und Änderungsprotokoll in der App | – | – | E | EV | N | – | S | P2 | MVP | R1 · M4 | Verbesserung | Zur Umsetzung ausgewählt | AK-SET-07 |
