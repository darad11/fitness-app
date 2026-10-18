# Funktionsinventar und Funktionsmatrix

Stand: 17.10.2026 · Phase 1 · Status: Vorläufig, Entscheidungen offen

Dieses Inventar listet alle identifizierbaren Xeela-Funktionen sowie die aus dem Auftrag abgeleiteten Systemanforderungen. Jede Zeile ist eine Funktion mit stabiler ID. Die Spalte **Entscheidung** ist überall „Offen", ergänzt um meinen Vorschlag in Klammern. Endgültige Entscheidungen trifft der Produktinhaber nach Prüfung.

Eine maschinenlesbare Fassung liegt in `feature-inventory.csv` (erzeugt mit `python3 tools/feature_inventory_to_csv.py`). Quelle der Wahrheit ist diese Markdown-Datei.

## Legende

**Spalten**: ID · Funktion (Beschreibung) · Originalverhalten (Xeela) · Evidenz (Quellenkürzel aus `product-research.md`, Abschnitt 2.1) · Konfidenz · Nutzen · Abhängigkeiten · Aufwand · Prio · Entscheidung · Status · Akzeptanzkriterien. Das Modul ergibt sich aus dem Abschnitt und dem ID-Präfix.

**Konfidenz**: V = verifiziert (offizielle Quelle oder Videoanalyse) · V-R = verifiziert nur über Nutzerrezensionen · H = historisch, ggf. veraltet · P = plausibel, nicht bestätigt · N = nicht verifiziert (nur Drittquelle) · VF = verifiziert als fehlend oder eingeschränkt (Stand der Quelle) · E = eigener Vorschlag, kein Xeela-Beleg.

**Nutzen** (für die persönliche Nutzung): H = hoch · M = mittel · N = niedrig.

**Aufwand**: S (unter 1 Tag) · M (1 bis 3 Tage) · L (3 bis 7 Tage) · XL (über 1 Woche). Richtwerte für eine KI-gestützte Einzelentwicklung inklusive Tests.

**Prio** (Vorschlag): P0 kritische Grundlagen · P1 Kernfunktionen · P2 Erweiterungen · P3 optional. „–" = nicht vorgesehen.

**Entscheidung**: Offen (Ü) = Vorschlag übernehmen · Offen (A) = Vorschlag anpassen oder verbessern · Offen (E) = Vorschlag ergänzen (nicht in Xeela belegt) · Offen (S) = Vorschlag später · Offen (X) = Vorschlag verwerfen.

**Status**: Noch zu recherchieren · Analysiert · Spezifiziert · Zur Umsetzung ausgewählt · Implementiert · Getestet · Abgenommen. In Phase 1 sind nur die ersten beiden Werte vergeben.

**Evidenz-Kürzel**: AS App Store (mit Versionsnummer bei Release Notes) · GP Google Play · WEB xeelafitness.com · HC-G Hilfecenter Gorgias · HC-Z Hilfecenter Zendesk · TC Challenge-Bedingungen · SD screensdesign-Videoanalyse (Zeitmarke) · DT devteam.inc · MWM mwm.ai · REV Rezensionen · DC Discord.

## Überblick in Zahlen

| Kennzahl | Wert |
|---|---|
| Funktionen gesamt | 138 |
| Konfidenz V (verifiziert) | 82 |
| Konfidenz V-R (nur Rezensionen) | 7 |
| Konfidenz VF (verifiziert als fehlend oder eingeschränkt) | 7 |
| Konfidenz P (plausibel, nicht bestätigt) | 25 |
| Konfidenz N (nur Drittquelle) | 3 |
| Konfidenz E (eigener Vorschlag) | 14 |
| Vorschlag P0 / P1 / P2 / P3 / nicht vorgesehen | 27 / 51 / 39 / 16 / 5 |
| Status „Analysiert" / „Noch zu recherchieren" | 111 / 27 |

Hinweis: „V" bedeutet, dass die Existenz der Funktion belegt ist, nicht, dass ihr vollständiger Umfang bekannt ist. Details, die nur geschlossen wurden, stehen in der Spalte Originalverhalten als solche gekennzeichnet („plausibel", „unbekannt").

## A. Onboarding und Profil (ON)

| ID | Funktion | Originalverhalten (Xeela) | Evidenz | Konfidenz | Nutzen | Abhängigkeiten | Aufwand | Prio | Entscheidung | Status | Akzeptanzkriterien |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ON-01 | Lokales Profil anlegen (Name optional, Geburtsdatum, Geschlecht für Formeln, Größe, Gewicht) | Pflicht-Registrierung mit E-Mail vor dem Quiz | SD 00:39; HC-G | V | H | SY-01 | S | P0 | Offen (A: kein Pflichtkonto, Konto nur für Sync) | Analysiert | Profil ohne Internet anlegbar; Pflichtfelder validiert; nach Browser-Neustart vorhanden |
| ON-02 | Geführte Ersteinrichtung | Quiz mit 19 Schritten, danach Paywall | SD 01:12; GP | V | M | ON-03 bis ON-09 | M | P1 | Offen (A: kurz, überspringbar, später änderbar) | Analysiert | Höchstens 8 Schritte; jeder Schritt überspringbar; Abbruch ohne Datenverlust; später erneut aufrufbar |
| ON-03 | Fitnessziel wählen (Abnehmen, Halten, Aufbauen, Leistung) | Ziele im Quiz; Programme nach Zielen | HC-G; GP; WEB | V | H | – | S | P0 | Offen (Ü) | Analysiert | Ziel gespeichert und änderbar; Änderung erzeugt neue Zielversion mit Gültigkeitsdatum; Historie bleibt |
| ON-04 | Zielgewicht mit Plausibilitätsprüfung | Warnung „Health risk!" bei zu ehrgeizigem Ziel | SD 01:58 | V | M | ON-01; BP-01 | S | P1 | Offen (Ü) | Analysiert | Hinweis bei Zielrate über 1 % Körpergewicht pro Woche oder Ziel-BMI außerhalb definierter Spanne; keine Diagnose; Texte dokumentiert |
| ON-05 | Trainingsniveau | Survey „experience"; Programme mit Level-Tags | HC-G; WEB | V | M | – | S | P1 | Offen (Ü) | Analysiert | Niveau gespeichert; beeinflusst Vorlagenvorschläge; änderbar |
| ON-06 | Trainingsort und verfügbare Geräte | Home oder Gym; „no equipment needed to start" | GP; HC-G | V | H | TP-06 | M | P1 | Offen (Ü) | Analysiert | Geräte als Mehrfachauswahl; Übungsfilter und Alternativen berücksichtigen Auswahl |
| ON-07 | Trainingshäufigkeit (Tage pro Woche) | Nicht belegt | – | P | H | TP-03 | S | P1 | Offen (Ü) | Noch zu recherchieren | Wert 1 bis 7; Wochenplan-Vorschlag nutzt ihn |
| ON-08 | Ernährungspräferenzen und Ausschlüsse | Diätpräferenz im Quiz; laut Rezensionen nur wenige Optionen | HC-G; REV | V | M | RE-01; RE-14 | S | P2 | Offen (A: frei definierbare Tags) | Analysiert | Mehrfachauswahl plus freie Ausschlusstags; Rezeptfilter respektieren sie |
| ON-09 | Körperdaten im Onboarding (Größe, Gewicht, Geburtsdatum) | Gewicht und Alter belegt; Größe plausibel | GP; HC-G | V | H | BP-01; NU-01 | S | P0 | Offen (Ü) | Analysiert | Eingabe in cm und kg mit Validierung; erstes Gewicht wird Gewichtseintrag |
| ON-10 | Programmempfehlung nach Onboarding | Empfohlenes Programm oder Katalog durchsuchen | HC-Z | V | M | TP-01 | M | P2 | Offen (A: Vorlagenempfehlung) | Analysiert | Mindestens eine passende Vorlage zu Ziel, Niveau, Häufigkeit, Ort; Begründung sichtbar |
| ON-11 | Profil bearbeiten | „Profile & settings" | HC-G | V | H | ON-01 | S | P0 | Offen (Ü) | Analysiert | Alle Profilfelder editierbar; sofort persistiert |
| ON-12 | Einheiten metrisch/imperial | Zeile „Units" in den Einstellungen | HC-G | V | M | – | S | P1 | Offen (A: intern metrisch, Anzeige umschaltbar) | Analysiert | Umschalten ändert nur die Anzeige; gespeicherte Werte bleiben metrisch; Rundung dokumentiert |
| ON-13 | Erinnerungen und Benachrichtigungseinstellungen | Workout-Reminder, Einstellungsseite; tägliche Motivationsnachrichten | AS 3.1.4; WEB | V | M | SY-02; Web Push | L | P3 | Offen (S: Browser-Einschränkungen) | Analysiert | Erinnerungen konfigurierbar; iOS nur in installierter PWA ab 16.4; Fallback In-App-Hinweise |
| ON-14 | Ziel oder Programm wechseln | Menü, „Change workout plan", neues Ziel, Programm wählen | HC-Z | V | H | TP-01; TP-19 | S | P1 | Offen (Ü) | Analysiert | Wechsel beendet aktuelle Einschreibung mit Datum; vergangene Einheiten unverändert |
| ON-15 | Konto und Daten löschen | Permanente Löschung laut Datenschutzseite | WEB; REV | V | H | SY-03 | M | P1 | Offen (Ü) | Analysiert | Lokale Daten vollständig löschbar; bei Sync auch Cloud-Daten und Fotos; Bestätigung mit Export-Angebot |
| ON-16 | Abo, Testphase, Paywall | 7 Tage Testphase, harte Paywall nach Quiz | AS; SD 02:38 | V | N | – | – | – | Offen (X) | Analysiert | Entfällt |
| ON-17 | Referral-Programm und Sweat Equity | Credits durch Nutzung, anrechenbar auf Mitgliedschaft | AS 3.4.0; AS 3.4.2 | V | N | – | – | – | Offen (X) | Analysiert | Entfällt |

## B. Trainingsplanung (TP)

| ID | Funktion | Originalverhalten (Xeela) | Evidenz | Konfidenz | Nutzen | Abhängigkeiten | Aufwand | Prio | Entscheidung | Status | Akzeptanzkriterien |
|---|---|---|---|---|---|---|---|---|---|---|---|
| TP-01 | Programme und Vorlagen (Katalog) | Benannte Trainerprogramme mit Level, Wochen, Minuten, Sätzen; Home und Gym | WEB; HC-Z | V | H | TP-02 bis TP-04 | L | P1 | Offen (A: eigene Vorlagen, keine Xeela-Inhalte) | Analysiert | Mindestens drei Startvorlagen (Ganzkörper, Ober/Unter, Push/Pull/Legs); Metadaten Level, Dauer, Tage pro Woche; filterbar |
| TP-02 | Programmdetailseite | Vorhanden, 2025 überarbeitet | AS 3.1.5 | V | M | TP-01 | S | P1 | Offen (Ü) | Analysiert | Zeigt Wochenstruktur, Tage, Übungen, Satzschema, geschätzte Dauer; Start-Aktion |
| TP-03 | Wochenstruktur mit Trainings- und Ruhetagen | Fest vorgegeben; Ruhetage nicht wählbar (Stand 2025) | REV | V-R | H | TP-01 | M | P0 | Offen (A: frei konfigurierbar) | Analysiert | Wochentage je Trainingstag zuweisbar; Ruhetage verschiebbar; Änderungen wirken nur auf zukünftige Tage |
| TP-04 | Trainingstag mit Übungsreihenfolge | Reihenfolge erzwungen | REV | V-R | H | TP-06 | M | P0 | Offen (A: änderbar, nicht erzwungen) | Analysiert | Übungen sortierbar; im Training frei wählbar; Reihenfolge wird mit der Einheit gespeichert |
| TP-05 | Einheiten in der Woche verschieben (Swap Workouts) | Drag and Drop von Einheiten | SD 12:05 | V | H | TP-03; AH-08 | M | P1 | Offen (Ü) | Analysiert | Einheit auf anderen Tag verschiebbar; zwei Einheiten pro Tag erlaubt und sichtbar; Historie unberührt |
| TP-06 | Übungsbibliothek | Muskelkarte; Liste nach Muskel inkl. Übungen außerhalb des Programms | HC-G; SD 06:28; AS 3.4.2 | V | H | Datenquelle Übungen | L | P0 | Offen (A: offene Datenquelle, Suche, Filter) | Analysiert | Mindestens 300 Übungen mit Muskelgruppen, Gerät, Typ; Volltextsuche; Filter; offline verfügbar |
| TP-07 | Übungsdetail mit Demonstration | Eingebettetes Video pro Übung | REV; SD 12:38 | V | M | TP-06; Medienlizenz | M | P1 | Offen (A: Bilder aus offener Quelle, optional eigener Videolink) | Analysiert | Beschreibung, Primär- und Sekundärmuskeln, Bild oder Animation; eigenes Video per URL; Medien gecacht |
| TP-08 | Satzschema (Sätze, Wiederholungsbereich, Zielgewicht) | Feste Satzanzahl, Rep-Bereiche | REV; WEB | V | H | TP-04 | M | P0 | Offen (A: editierbar) | Analysiert | Pro Übung Satzanzahl, Rep-Bereich, optional Zielgewicht oder Prozent von e1RM; editierbar |
| TP-09 | Pausenzeiten pro Übung oder Satz | Vorgegeben; Pausentimer vorhanden | AS 3.1.6; WEB | V | H | TS-07 | S | P0 | Offen (Ü) | Analysiert | Pausenzeit pro Übung, pro Satz überschreibbar; Standardwert in Einstellungen |
| TP-10 | Drop-Sets | „Refined dropsets" | AS 3.1.7; WEB | V | M | TP-08 | M | P2 | Offen (Ü) | Analysiert | Satztyp Drop mit Teilgewichten; Volumen berücksichtigt alle Teilsätze |
| TP-11 | Supersätze und Zirkel | Nicht belegt | – | P | M | TP-04 | M | P2 | Offen (E) | Noch zu recherchieren | Übungen gruppierbar; Training wechselt innerhalb der Gruppe; Pause nach Gruppe |
| TP-12 | Übung austauschen (Alternativen) | Alternativen bei fehlendem Gerät | REV | V-R | H | TP-06 | M | P1 | Offen (Ü) | Analysiert | Alternativen nach Muskelgruppe und verfügbarem Gerät; Austausch einmalig oder dauerhaft |
| TP-13 | Eigene Übungen anlegen | Nicht belegt | – | P | H | TP-06 | S | P1 | Offen (E) | Noch zu recherchieren | Eigene Übung mit Name, Muskeln, Gerät, Typ; in Suche und Historie gleichwertig |
| TP-14 | Eigenes Training und Programm erstellen | Nur Trainerprogramme | REV | VF | H | TP-01 bis TP-09 | L | P1 | Offen (E) | Analysiert | Programm aus Tagen und Übungen zusammenstellbar; duplizierbar; versioniert |
| TP-15 | Sätze hinzufügen oder entfernen (Plan) | Nicht möglich | REV | VF | H | TP-08 | S | P0 | Offen (E) | Analysiert | Sätze im Plan ergänzen und entfernen |
| TP-16 | Einheiten umplanen und nachholen | Nicht möglich (Stand 2025) | REV | VF | H | TP-03; TP-05 | M | P1 | Offen (E) | Analysiert | Verpasste Einheit nachholbar oder als ausgelassen markierbar; Auswirkung auf Streak dokumentiert |
| TP-17 | Vorschau kommender Tage und Wochen | Nur der aktuelle Tag sichtbar (Stand 2025) | REV | VF | M | TP-03 | S | P1 | Offen (E) | Analysiert | Alle Tage einsehbar; Kalenderansicht |
| TP-18 | Progressionsvorschlag (Smart Weight Suggestion) | Vorschlag aus zuletzt erreichten Reps; Hinweis „time to move up" | HC-G; WEB | V | H | TH-02; TP-08 | M | P1 | Offen (A: transparente Regel, z. B. Double Progression) | Analysiert | Vorschlag mit sichtbarer Begründung; Schrittweite pro Gerät konfigurierbar; nie automatisch übernommen |
| TP-19 | Programm neu starten oder beenden | Reset möglich | REV; HC-Z | V-R | M | TP-01 | S | P1 | Offen (Ü) | Analysiert | Einschreibung mit Start und Ende; Neustart erzeugt neue Einschreibung; alte Einheiten bleiben |
| TP-20 | Programmphasen und Deload-Wochen | Nicht belegt | – | P | N | TP-01 | M | P3 | Offen (S) | Noch zu recherchieren | Optional |

## C. Aktive Trainingseinheit (TS)

| ID | Funktion | Originalverhalten (Xeela) | Evidenz | Konfidenz | Nutzen | Abhängigkeiten | Aufwand | Prio | Entscheidung | Status | Akzeptanzkriterien |
|---|---|---|---|---|---|---|---|---|---|---|---|
| TS-01 | Training starten (geplant oder frei) | Von Home: Workout des Tages, „View all" | HC-G; SD | V | H | TP-03 | M | P0 | Offen (Ü) | Analysiert | Start aus Heute, Training und Plan; freie Einheit ohne Plan möglich; Startzeit gespeichert |
| TS-02 | Übungsansicht mit Satzliste | Video, Satzliste, Eingaben | SD 13:04 | V | H | TP-07 | M | P0 | Offen (Ü) | Analysiert | Zielwerte je Satz sichtbar; große Tap-Flächen; Tastaturbedienung am Desktop |
| TS-03 | Vorherige Leistungswerte anzeigen | Vorherige Reps seit Update sichtbar | REV; AS (Entwicklerantwort) | V | H | TH-01 | S | P0 | Offen (Ü) | Analysiert | Letzte Einheit derselben Übung je Satz (Gewicht × Reps, Datum); Hinweis bei Erstdurchführung |
| TS-04 | Gewicht eingeben | Verbesserte Gewichtsauswahl | AS 3.1.6 | V | H | – | S | P0 | Offen (Ü) | Analysiert | Schritte 0,25 kg; Plus/Minus mit konfigurierbarer Schrittweite; Vorbelegung; Validierung 0 bis 500 kg |
| TS-05 | Wiederholungen eingeben | Vorhanden | HC-G | V | H | – | S | P0 | Offen (Ü) | Analysiert | Ganzzahl 0 bis 200; Vorbelegung aus Zielbereich |
| TS-06 | Satz abschließen | „log reps and weight after each set" | HC-G | V | H | TS-04; TS-05 | S | P0 | Offen (Ü) | Analysiert | Abschluss mit Zeitstempel; sofort persistiert; rückgängig machbar |
| TS-07 | Pausentimer | Startet nach Satz; läuft im Hintergrund | AS 3.1.6; SD 13:18 | V | H | TP-09 | M | P0 | Offen (A: zeitstempelbasiert) | Analysiert | Übersteht Tabwechsel und Sperrbildschirm (Endzeitpunkt statt Zähler); Ton und Vibration soweit möglich; überspringbar, verlängerbar |
| TS-08 | Übungstimer für Zeitübungen | Vorhanden | AS 3.1.6 | V | M | TS-07 | S | P1 | Offen (Ü) | Analysiert | Sekundenbasierte Sätze mit Timer; Dauer wird gespeichert |
| TS-09 | Nächste Übung im Pausentimer | Fehlt laut Analyse | SD 13:18 | VF | M | TS-07 | S | P1 | Offen (E) | Analysiert | Pausenansicht zeigt nächste Übung und Zielwerte |
| TS-10 | Übung im Training austauschen | Möglich | REV | V-R | H | TP-12 | S | P1 | Offen (Ü) | Analysiert | Austausch ohne Verlust protokollierter Sätze |
| TS-11 | Sätze im Training hinzufügen oder entfernen | Nicht möglich | REV | VF | H | TP-15 | S | P0 | Offen (E) | Analysiert | Beliebig viele Sätze; entfernte Sätze nicht im Volumen |
| TS-12 | Automatisches Zwischenspeichern | Abstürze mit Datenverlust berichtet | REV | V-R | H | SY-01 | M | P0 | Offen (E) | Analysiert | Jede Eingabe innerhalb 1 s in IndexedDB; Test: Reload mitten im Training verliert keinen Satz |
| TS-13 | Training unterbrechen und fortsetzen | Nicht belegt | – | P | H | TS-12 | M | P0 | Offen (E) | Noch zu recherchieren | Laufende Einheit nach Browser-Neustart, Offline-Phase und Gerätesperre fortsetzbar; Pausenzeit sichtbar |
| TS-14 | Training abschließen | „complete workout" | HC-G | V | H | TS-06 | S | P0 | Offen (Ü) | Analysiert | Endzeit, Dauer, Status abgeschlossen; offene Sätze als übersprungen; nicht durch alte Kopien überschreibbar |
| TS-15 | Trainingszusammenfassung | Übungen, Kalorien, Sätze | SD 14:40 | V | M | TS-14 | S | P0 | Offen (A: Kalorien nur als Schätzung) | Analysiert | Dauer, Übungen, Sätze, Volumen, neue Bestleistungen; Kalorien nur markiert als Schätzung |
| TS-16 | Ergebnis teilen | Social Sharing | AS 3.1.5; AS 3.2.1 | V | N | Web Share API | S | P3 | Offen (S) | Analysiert | Optional Bild erzeugen und per Web Share teilen |
| TS-17 | Manuelles Training protokollieren (inkl. Cardio) | Seit 3.4.11 | AS 3.4.11 | V | H | TS-01 | M | P1 | Offen (A: Typ, Dauer, Distanz, Notiz) | Analysiert | Typ, Datum, Dauer, optional Distanz und Notiz; in Historie und Kalender |
| TS-18 | Kalorienschätzung pro Einheit | In Zusammenfassung | SD 14:40 | V | N | Körpergewicht; Dauer | S | P3 | Offen (S) | Analysiert | MET-basiert, klar als Schätzung markiert, abschaltbar |
| TS-19 | Notizen pro Einheit und Übung | Nicht belegt | – | P | M | – | S | P1 | Offen (E) | Noch zu recherchieren | Freitext; in Historie sichtbar |
| TS-20 | RPE/RIR und Tempo | Nicht belegt | – | P | N | TS-05 | S | P3 | Offen (S) | Noch zu recherchieren | Optionales Feld |
| TS-21 | Bildschirm während Training wach halten | Nativ selbstverständlich | – | E | M | Wake Lock API | S | P1 | Offen (E) | Analysiert | Wake Lock aktiv bei laufender Einheit, wenn unterstützt |
| TS-22 | Aufwärmsätze | Nicht belegt | – | P | M | TP-08 | S | P2 | Offen (E) | Noch zu recherchieren | Satztyp Warm-up außerhalb des Arbeitsvolumens; optional Vorschlag aus Arbeitsgewicht |

## D. Trainingshistorie und Analyse (TH)

| ID | Funktion | Originalverhalten (Xeela) | Evidenz | Konfidenz | Nutzen | Abhängigkeiten | Aufwand | Prio | Entscheidung | Status | Akzeptanzkriterien |
|---|---|---|---|---|---|---|---|---|---|---|---|
| TH-01 | Verlauf vergangener Einheiten mit Detail | Historie wird gespeichert | HC-G | V | H | TS-14 | M | P0 | Offen (Ü) | Analysiert | Liste mit Datum, Dauer, Volumen; Detail mit allen Sätzen; nachträglich editierbar mit Änderungsvermerk |
| TH-02 | Verlauf pro Übung (Gewicht, Reps, e1RM, Volumen) | Anspruch vorhanden; Nutzer vermissen Graphen | AS; REV | V | H | TH-01 | M | P1 | Offen (A: echte Diagramme) | Analysiert | Diagramm aus gespeicherten Sätzen; Zeiträume 30 und 90 Tage, gesamt; unter 3 Datenpunkten kein Trend |
| TH-03 | Trainingskalender | Nicht belegt | – | P | H | TH-01; TP-03 | M | P1 | Offen (E) | Noch zu recherchieren | Monatsansicht mit geplanten und absolvierten Einheiten |
| TH-04 | Streaks | Seit 3.2.0; Regeln unbekannt | AS 3.2.0 | V | M | TH-01; TP-03 | S | P2 | Offen (A: Regeln definieren, Ruhetage zählen) | Analysiert | Streak zählt geplante Trainingstage; Ruhetage unterbrechen nicht; Regel dokumentiert und getestet |
| TH-05 | Persönliche Bestleistungen | Nicht belegt | – | P | H | TH-01 | M | P1 | Offen (E) | Noch zu recherchieren | PR pro Übung für Maximalgewicht, Reps bei Gewicht, e1RM; Erkennung beim Abschluss; spätere Stammdatenänderungen verändern PRs nicht |
| TH-06 | Statistik Frequenz, Dauer, Volumen | Nicht belegt | – | P | M | TH-01 | M | P2 | Offen (E) | Noch zu recherchieren | Kennzahlen aus echten Daten; Zeiträume wählbar |
| TH-07 | Vergleich mit vorheriger Einheit | Vorherige Reps sichtbar | REV | V | M | TS-03 | S | P1 | Offen (Ü) | Analysiert | Delta je Satz und gesamt in der Zusammenfassung |
| TH-08 | Trainingskonsistenz und Wochenziel | Nicht belegt | – | P | M | ON-07 | S | P2 | Offen (E) | Noch zu recherchieren | Fortschritt „x von y Einheiten diese Woche" im Dashboard |

## E. Ernährung (NU)

| ID | Funktion | Originalverhalten (Xeela) | Evidenz | Konfidenz | Nutzen | Abhängigkeiten | Aufwand | Prio | Entscheidung | Status | Akzeptanzkriterien |
|---|---|---|---|---|---|---|---|---|---|---|---|
| NU-01 | Kalorien- und Makroziele berechnen | Aus Präferenzen, Alter, Gewicht, Ziel; Formel unbekannt | HC-G; GP; HC-Z | V | H | ON-03; ON-09 | M | P1 | Offen (A: dokumentierte Formel, manuell überschreibbar) | Analysiert | Mifflin-St Jeor, Aktivitätsfaktor, Zielanpassung; Protein in g/kg einstellbar; Ziele versioniert nach Gültigkeitsdatum |
| NU-02 | Tagesübersicht mit Zielfortschritt | Kalorien-Widget, klarere Tagesziele | AS 3.1.5; AS 3.5.0 | V | H | NU-05 | M | P1 | Offen (Ü) | Analysiert | Kalorien, Protein, Kohlenhydrate, Fett als Summe aller Einträge; Restwerte; Tageswechsel nach lokaler Zeitzone |
| NU-03 | Mahlzeiten-Slots | Frühstück, Mittag, Abend belegt; Snacks plausibel | REV | V | H | – | S | P1 | Offen (A: Slots konfigurierbar) | Analysiert | Standard vier Slots; umbenennbar; Reihenfolge änderbar |
| NU-04 | Vorgeschlagene Mahlzeiten und Wechseln | „switch meals, log them" | SD 05:54; HC-G | V | M | RE-01; RE-03 | M | P2 | Offen (A: aus eigenem Wochenplan) | Analysiert | Geplante Mahlzeit mit einem Tap protokollierbar; Austausch gegen anderes Rezept |
| NU-05 | Lebensmittel und Mahlzeit protokollieren | Portionsanteil (z. B. 0,75) | HC-G | V | H | NU-08; NU-09 | M | P1 | Offen (Ü) | Analysiert | Eintrag mit Menge in g/ml oder Portionen, Slot, Zeit; Nährwerte beim Protokollieren eingefroren |
| NU-06 | Lebensmittel hinzufügen: selbstgemacht, Restaurant, Barcode | Drei Wege über „+" | HC-G | V | H | NU-07; NU-10 | M | P1 | Offen (Ü) | Analysiert | Alle drei Wege erzeugen ein validiertes Lebensmittel mit Quellenkennzeichnung |
| NU-07 | Barcode-Scanning | Vorhanden, 2026 verbessert | REV; AS 3.5.0 | V | H | Kamera; Open Food Facts | L | P2 | Offen (A: Kamera-Scan per JS-Bibliothek, Fallback manuell) | Analysiert | Scan per Kamera im Browser; Treffer aus Open Food Facts; bei Fehlschlag manuelle Eingabe; Treffer lokal gecacht |
| NU-08 | Lebensmittelsuche | Vorhanden; Marken lückenhaft | REV | V | H | Datenquelle | L | P1 | Offen (A: lokale Basisdaten plus Online-Suche) | Analysiert | Offline-Suche in eigenen und gecachten Einträgen; Online-Suche optional; Deutsch und Englisch |
| NU-09 | Portionsgröße und Anzahl kombinierbar | Nur eines von beiden | REV | V-R | H | NU-05 | S | P1 | Offen (A) | Analysiert | Menge = Anzahl × Portionsgröße; beide Felder editierbar; Umrechnung dokumentiert |
| NU-10 | Eigene Lebensmittel mit Nährwerten | Manuelle Eingabe mit Nährwerten | SD 05:54 | V | H | – | S | P1 | Offen (Ü) | Analysiert | Werte pro 100 g/ml plus Portionen; Pflicht kcal, Protein, Kohlenhydrate, Fett; Plausibilitätsprüfung 4/4/9 mit Toleranz |
| NU-11 | Favoriten, zuletzt verwendet, Mahlzeitvorlagen | Von Nutzern gewünscht, nicht belegt | REV | VF | H | NU-05 | M | P1 | Offen (E) | Analysiert | Zuletzt verwendet automatisch; Favoriten markierbar; Vorlagen aus mehreren Einträgen |
| NU-12 | Ernährungshistorie | Historie wird gespeichert | HC-G | V | H | NU-02 | S | P1 | Offen (Ü) | Analysiert | Beliebiger Tag aufrufbar und editierbar; Wochendurchschnitte |
| NU-13 | Wassertracking | Nur als Challenge-Aufgabe | TC | V | M | – | S | P2 | Offen (E) | Analysiert | Schnelleingabe in ml; Tagesziel; optional im Dashboard |
| NU-14 | Fotoerkennung von Mahlzeiten (Snap Meal) | Nur Drittquelle | MWM | N | N | KI-Dienst; Kosten; Datenschutz | XL | P3 | Offen (X) | Noch zu recherchieren | Nicht geplant |
| NU-15 | Automatische Neuberechnung bei Änderungen | Seit 3.1.7 | AS 3.1.7 | V | H | NU-05 | S | P1 | Offen (Ü) | Analysiert | Mengenänderung aktualisiert Eintrag und Tagessumme sofort; Rezeptänderungen verändern vergangene Einträge nicht |
| NU-16 | Makro-Aufschlüsselung pro Lebensmittel | Protein, Fett, Kohlenhydrate | REV | V | M | NU-08 | S | P1 | Offen (Ü) | Analysiert | Detailansicht mit kcal, Makros, optional Ballaststoffe, Zucker, Salz |
| NU-17 | Ziele manuell anpassen, Ziele je Wochentag | Nicht belegt | – | P | M | NU-01 | S | P2 | Offen (E) | Noch zu recherchieren | Überschreiben der berechneten Ziele; optional unterschiedliche Ziele je Wochentag |
| NU-18 | Roh- und Gargewicht | Nicht belegt | – | P | M | NU-10 | S | P2 | Offen (E) | Noch zu recherchieren | Optionaler Garfaktor pro Lebensmittel; Kennzeichnung als Schätzung |
| NU-19 | Quellenqualität und Schätzwerte kennzeichnen | Nicht belegt | – | E | M | NU-10 | S | P1 | Offen (E) | Analysiert | Quelle je Lebensmittel (verifiziert, Nutzer, importiert, geschätzt); Tagesansicht zeigt Anteil geschätzter Werte |
| NU-20 | Schnelleintrag ohne Lebensmittel | Nicht belegt | – | E | M | NU-05 | S | P2 | Offen (E) | Analysiert | Eintrag nur mit kcal und Makros, als Schätzung markiert |

## F. Rezepte und Mahlzeitenplanung (RE)

| ID | Funktion | Originalverhalten (Xeela) | Evidenz | Konfidenz | Nutzen | Abhängigkeiten | Aufwand | Prio | Entscheidung | Status | Akzeptanzkriterien |
|---|---|---|---|---|---|---|---|---|---|---|---|
| RE-01 | Rezeptkatalog mit Filtern | Nach Mahlzeit, Küche, Schwierigkeit | AS 3.5.0 | V | H | RE-02 | M | P2 | Offen (A: eigene Rezepte) | Analysiert | Filter Mahlzeit, Tags, Dauer, Kalorien pro Portion; Volltextsuche |
| RE-02 | Rezept mit Zutaten, Schritten, Nährwerten pro Portion | Rezepte und Anleitungen vorhanden | AS; REV | V | H | NU-10 | M | P2 | Offen (Ü) | Analysiert | Zutaten mit Menge und Lebensmittelreferenz; Nährwerte aus Zutaten berechnet; Portionen; Schritte |
| RE-03 | Wochenplan um Kalorienziel generieren | „weekly meal plan built around your calorie target" | AS 3.5.0 | V | M | RE-01; NU-01 | L | P2 | Offen (A: Vorschlag aus eigenem Katalog, manuell planbar) | Analysiert | Woche mit Slots; Vorschlag erfüllt Tagesziel ±10 %; manuell übersteuerbar |
| RE-04 | Rezepte im Plan tauschen | „swap recipes" | AS 3.5.0 | V | H | RE-03 | S | P2 | Offen (Ü) | Analysiert | Tausch pro Slot; Nährwerte und Einkaufsliste aktualisieren sich |
| RE-05 | Kochtage und Reste | „pick your cooking days" | AS 3.5.0 | V | M | RE-03 | M | P3 | Offen (S) | Analysiert | Kochtage markierbar; Reste auf Folgetage verteilbar |
| RE-06 | Auswahl, welche Mahlzeiten geplant werden | „choose which meals Xeela plans" | AS 3.5.0 | V | M | RE-03 | S | P2 | Offen (Ü) | Analysiert | Slots pro Tag ein- und ausschaltbar |
| RE-07 | Woche bestätigen | „confirmed week" | AS 3.5.0 | V | M | RE-03 | S | P2 | Offen (Ü) | Analysiert | Bestätigte Woche erzeugt Einkaufsliste; spätere Änderungen markieren Liste als veraltet |
| RE-08 | Einkaufsliste aus bestätigter Woche | Vorhanden | AS 3.5.0 | V | H | RE-07 | M | P2 | Offen (Ü) | Analysiert | Liste aus allen geplanten Rezepten × Portionen; reproduzierbar; Test mit Beispielwoche |
| RE-09 | Einkaufsliste nach Kategorien | „easier to read and shop from" | AS 3.5.1 | V | H | RE-08 | S | P2 | Offen (Ü) | Analysiert | Gruppierung nach Lebensmittelkategorie; Sortierung anpassbar |
| RE-10 | Einkaufsliste manuell bearbeiten und abhaken | Nicht belegt | – | P | H | RE-08 | S | P2 | Offen (E) | Noch zu recherchieren | Eigene Einträge; Abhaken persistiert; „bereits vorhanden" ausblendbar |
| RE-11 | Zutatenmengen aggregieren | Plausibel | – | P | H | RE-08 | M | P2 | Offen (E) | Noch zu recherchieren | Gleiche Zutat in gleicher Einheit summiert; Einheiten g, ml, Stück; Rundung auf Einkaufseinheit optional |
| RE-12 | Eigene Rezepte anlegen, bearbeiten, versionieren | Nicht belegt | – | P | H | RE-02 | M | P2 | Offen (E) | Noch zu recherchieren | Bearbeiten erzeugt neue Version; protokollierte Mahlzeiten verweisen auf alte Version |
| RE-13 | Portionsskalierung | Nicht belegt | – | P | H | RE-02 | S | P2 | Offen (E) | Noch zu recherchieren | Skalierung ändert Mengen und Nährwerte linear; Tests mit 1, 2 und 3,5 Portionen |
| RE-14 | Planung nach Ernährungspräferenz | Vorschläge respektieren Präferenzen | HC-G | V | M | ON-08 | S | P2 | Offen (Ü) | Analysiert | Ausgeschlossene Tags erscheinen nicht in Vorschlägen |
| RE-15 | Rezept-Import (URL, Text) | Nicht belegt | – | E | M | RE-12 | L | P3 | Offen (S) | Analysiert | Später |

## G. Körper und Fortschritt (BP)

| ID | Funktion | Originalverhalten (Xeela) | Evidenz | Konfidenz | Nutzen | Abhängigkeiten | Aufwand | Prio | Entscheidung | Status | Akzeptanzkriterien |
|---|---|---|---|---|---|---|---|---|---|---|---|
| BP-01 | Körpergewicht protokollieren | Gewicht im Onboarding; Verlauf nur Drittquelle | GP; MWM | V | H | – | S | P1 | Offen (E) | Analysiert | Eintrag mit Datum und Zeit, kg auf 0,1; mehrere pro Tag erlaubt; Notiz |
| BP-02 | Gewichtsverlauf mit Trend | Nur Drittquelle | MWM | N | H | BP-01 | M | P1 | Offen (E) | Noch zu recherchieren | Diagramm 7, 30, 90 Tage und gesamt; gleitender Durchschnitt; unter 3 Punkten kein Trend; Zielgewicht als Linie |
| BP-03 | Körpermaße | Nicht belegt | – | P | M | – | S | P2 | Offen (E) | Noch zu recherchieren | Taille, Hüfte, Brust, Arme, Oberschenkel in cm; Verlauf |
| BP-04 | Körperfett (optional) | Nicht belegt | – | P | N | – | S | P3 | Offen (S) | Noch zu recherchieren | Prozentwert mit Methode |
| BP-05 | Fortschrittsfotos | „progress photo library" (Rezension); Challenge-Fotos Front, Seite, Rücken | REV; TC | V | M | Speicher; Sync-Storage | L | P2 | Offen (E) | Analysiert | Lokal komprimiert gespeichert; Pose-Tag; Vergleichsansicht; Export und vollständige Löschung |
| BP-06 | Zielerreichung | Zielgewicht im Onboarding | SD 01:58 | V | M | ON-04; BP-01 | S | P2 | Offen (E) | Analysiert | Fortschritt aus echten Einträgen; keine Projektion ohne ausreichende Daten |
| BP-07 | Wochen- und Monatsauswertung | Nicht belegt | – | P | M | TH-06; NU-12; BP-02 | M | P2 | Offen (E) | Noch zu recherchieren | Zusammenfassung pro Woche: Trainings, Volumen, Ø Kalorien, Ø Gewicht |
| BP-08 | Persönliche Notizen | Nicht belegt | – | P | N | – | S | P3 | Offen (S) | Noch zu recherchieren | Freitext pro Tag |

## H. Aktivität und Gewohnheiten (AH)

| ID | Funktion | Originalverhalten (Xeela) | Evidenz | Konfidenz | Nutzen | Abhängigkeiten | Aufwand | Prio | Entscheidung | Status | Akzeptanzkriterien |
|---|---|---|---|---|---|---|---|---|---|---|---|
| AH-01 | Schritte erfassen | Beworben; Datenquelle unklar | WEB; DT | V | M | Keine Browser-API | S | P2 | Offen (A: manuell, Import per iOS-Kurzbefehl, später nativ) | Analysiert | Manueller Tageswert; CSV- oder Kurzbefehl-Import; keine Behauptung automatischer Messung |
| AH-02 | Aktivitätsziele | Nicht belegt | – | P | M | AH-01 | S | P2 | Offen (E) | Noch zu recherchieren | Tagesziel mit Fortschritt im Dashboard |
| AH-03 | Tägliche Aufgaben (Wasser, Lesen, Schritte, Diät) | In Challenges | TC | V | M | AH-04 | M | P2 | Offen (A: als Gewohnheiten, nicht an Challenge gebunden) | Analysiert | Aufgabenliste pro Tag; Abhaken persistiert; Historie |
| AH-04 | Gewohnheiten definieren und tracken | Außerhalb von Challenges nicht belegt | – | P | M | – | M | P2 | Offen (E) | Analysiert | Gewohnheit mit Häufigkeit; Verlauf und Erfüllungsquote |
| AH-05 | Streaks für Gewohnheiten | Streak-Funktion für Training vorhanden | AS 3.2.0 | V | N | AH-04 | S | P3 | Offen (S) | Analysiert | Regeln dokumentiert |
| AH-06 | Erinnerungen | Workout-Reminder | AS 3.1.4 | V | M | ON-13 | L | P3 | Offen (S) | Analysiert | Siehe ON-13 |
| AH-07 | Wearable- oder Apple-Health-Integration | Behauptet (Agentur); Rezensionen zweifeln | DT; REV | N | M | Nativ erforderlich | XL | P3 | Offen (S: separate native Option) | Noch zu recherchieren | Nicht in der Web-App; als spätere Capacitor-Option dokumentiert |
| AH-08 | Kalender aller Ereignisse | Nicht belegt | – | P | M | TH-03 | M | P2 | Offen (E) | Noch zu recherchieren | Monats- und Wochenansicht mit Trainings, Mahlzeitenplan, Gewicht, Gewohnheiten |
| AH-09 | Manuelle Aktivitätseinträge | Manuelle Workouts | AS 3.4.11 | V | H | TS-17 | – | P1 | Offen (Ü) | Analysiert | Siehe TS-17 |

## I. Challenges, Community, Dashboard (CH)

| ID | Funktion | Originalverhalten (Xeela) | Evidenz | Konfidenz | Nutzen | Abhängigkeiten | Aufwand | Prio | Entscheidung | Status | Akzeptanzkriterien |
|---|---|---|---|---|---|---|---|---|---|---|---|
| CH-01 | Persönliche Challenges mit Tagesaufgaben | Zeitlich begrenzte Programme mit Aufgaben, Fotos, Gewinnern | TC | V | M | AH-03; BP-05 | M | P3 | Offen (A: nur persönlich, ohne Wettbewerb) | Analysiert | Challenge mit Dauer, Aufgabenset, Fortschritt in Prozent; Abbruch ohne Datenverlust |
| CH-02 | Wettbewerb, Rangliste, Preise | Gewinnerauswahl; „top 5" | TC; REV | V | N | Multi-User | – | – | Offen (X) | Analysiert | Entfällt |
| CH-03 | Community (Discord) | Extern | DC | V | N | – | – | – | Offen (X) | Analysiert | Entfällt |
| CH-04 | Social Sharing | Vorhanden | AS 3.1.5 | V | N | Web Share | S | P3 | Offen (S) | Analysiert | Siehe TS-16 |
| CH-05 | Motivationsnachrichten | Beworben | WEB | V | N | – | S | P3 | Offen (X) | Analysiert | Entfällt oder optional |
| CH-06 | Dashboard „Heute" | Workout-Karte, Kalorien-Widget, „+" | SD; HC-G | V | H | TS-01; NU-02 | M | P0 | Offen (A: nur verfügbare Daten) | Analysiert | Zeigt geplantes Training, Kalorien und Makros, Gewicht, offene Gewohnheiten, Wochenfortschritt; leere Zustände mit nächstem Schritt; keine Platzhalterdaten |
| CH-07 | Schnellaktion „+" (Mahlzeit, Gewicht, Aktivität, Wasser) | Plus-Zone | HC-G; AS 3.4.2 | V | H | – | S | P1 | Offen (Ü) | Analysiert | Aus allen Hauptbereichen erreichbar; höchstens zwei Taps bis zur Eingabe |
| CH-08 | Navigation mit vier bis fünf Hauptbereichen | Vier Hauptscreens, Tab-Leiste | HC-G | V | H | – | S | P0 | Offen (A: Heute, Training, Ernährung, Fortschritt, Mehr) | Analysiert | Tab-Leiste mobil, Seitenleiste am Desktop; Tiefe höchstens drei Ebenen |
| CH-09 | Shop, Supplements, Coaching, PDF-Guides | Geschäftsmodell | WEB | V | N | – | – | – | Offen (X) | Analysiert | Entfällt |

## J. System, Daten und Synchronisierung (SY)

| ID | Funktion | Originalverhalten (Xeela) | Evidenz | Konfidenz | Nutzen | Abhängigkeiten | Aufwand | Prio | Entscheidung | Status | Akzeptanzkriterien |
|---|---|---|---|---|---|---|---|---|---|---|---|
| SY-01 | Lokale Datenbank (IndexedDB über Dexie) als führender Speicher | Server-Backend | DT | E | H | – | M | P0 | Offen (E) | Analysiert | Alle Fachdaten in IndexedDB; Schema versioniert mit Migrationen; localStorage nur für UI-Präferenzen |
| SY-02 | PWA: Installation, Offline-Shell, Caching | Native App | – | E | H | SY-01 | M | P1 | Offen (E) | Analysiert | Installierbar auf iPhone, iPad, Mac; Kernfunktionen offline; Update-Hinweis statt Zwangsreload |
| SY-03 | Cloud-Sync (Supabase) mit Konfliktregeln | Server-Backend | DT | E | H | SY-01; SY-09 | XL | P2 | Offen (E) | Analysiert | Idempotente Push- und Pull-Operationen; Tombstones; Konfliktregel pro Entität; Sync-Status sichtbar; Tests für Konfliktfälle |
| SY-04 | Export und Import (JSON, CSV) | Nicht belegt | – | E | H | SY-01 | M | P1 | Offen (E) | Analysiert | Vollexport inklusive Fotos als ZIP; Import mit Validierung und Duplikaterkennung |
| SY-05 | Backup und Wiederherstellung | – | – | E | H | SY-03; SY-04 | M | P2 | Offen (E) | Analysiert | Wiederherstellung auf neuem Gerät aus Cloud oder Datei; dokumentierter Ablauf |
| SY-06 | Light und Dark Mode | – | – | E | M | Designsystem | S | P1 | Offen (E) | Analysiert | Systemeinstellung respektiert, manuell überschreibbar |
| SY-07 | Tastaturbedienung und Barrierearmut | – | – | E | M | Designsystem | M | P1 | Offen (E) | Analysiert | Fokusreihenfolge; Shortcuts im Training; Kontrast AA |
| SY-08 | Lokales Fehlerprotokoll ohne sensible Daten | – | – | E | M | – | S | P1 | Offen (E) | Analysiert | Ringpuffer in IndexedDB; exportierbar; keine Nährwert- oder Gewichtsdaten im Protokoll |
| SY-09 | Authentifizierung nur für Sync | Pflichtkonto | SD 00:39 | E | M | SY-03 | M | P2 | Offen (E) | Analysiert | App ohne Konto voll nutzbar; Anmeldung per Magic Link oder Passkey; RLS auf allen Tabellen |
| SY-10 | Datensparsamkeit, keine Drittanbieter-Telemetrie | Tracking-Identifier laut Privacy Label | AS | E | H | – | S | P0 | Offen (E) | Analysiert | Keine Analytics-SDKs; externe Aufrufe dokumentiert (Lebensmittel-API, Supabase) |

## Zusammenfassung der P0-Vorschläge (kritische Grundlagen)

ON-01, ON-03, ON-09, ON-11 · TP-03, TP-04, TP-06, TP-08, TP-09, TP-15 · TS-01 bis TS-07, TS-11 bis TS-15 · TH-01 · CH-06, CH-08 · SY-01, SY-10.

Diese Menge entspricht der „ersten nutzbaren Version" aus Phase 4: Dashboard, Trainingsübersicht, Trainingsdurchführung mit Sätzen, Wiederholungen, Pausentimer und persistierter Historie.
