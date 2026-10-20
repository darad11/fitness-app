# Anforderungen

Stand: 18.10.2026 · Version 0.2 (Phase 2) · Status: MVP-Umfang und MVP-Akzeptanzkriterien vorläufig freigegeben · Vorgänger: `archive/v0.1-phase-1/requirements.md`

## Änderungen gegenüber Version 0.1

- Abschnitt 4 neu: finaler MVP-Umfang mit Abgrenzung.
- Abschnitt 6 neu: 101 MVP-Akzeptanzkriterien (AK) mit Nachweisart und Meilenstein.
- Funktionale Anforderungen mit Ausbaustufe versehen; nichtfunktionale Anforderungen mit konkreten Budgets.
- Plattformvorgaben aus Phase 2 ergänzt: Deutsch, metrisch, Mindestziel iOS 18.4.

## 1. Geltungsbereich

- Persönliche Fitness- und Ernährungsplattform für genau einen Nutzer.
- Zielgeräte: iPhone und iPad als installierte Web-App (Safari), Mac mit Safari oder Chrome.
- Mindestziel iOS, iPadOS und Safari 18.4; Referenz ist die jeweils aktuelle Version (D-228).
- Oberfläche auf Deutsch, Anrede „du"; Einheiten metrisch (kg, cm, g, ml); Geldbeträge, falls je nötig, in Euro.

## 2. Ziele und Nicht-Ziele

**Ziele:** zuverlässiges Trainingsprotokoll vom ersten Meilenstein an; später vollständige Ernährung, Planung, Fortschritt und Synchronisierung; lokale Daten als Grundlage; hochwertige, schnelle Bedienung.

**Nicht-Ziele:** Mehrbenutzerbetrieb, Abo, Community, Wettbewerbe, medizinische Aussagen, Fotoerkennung von Mahlzeiten, Apple-Health- oder Apple-Watch-Integration in der Web-App.

## 3. Ausbaustufen

| Stufe | Inhalt | Meilensteine |
|---|---|---|
| R1 Trainings-MVP | Dashboard, Training mit Programm-Builder, Körpergewicht, Datensicherung, PWA | M0 bis M4 |
| R2 Ernährung | Lebensmittel, Ziele, Protokoll, Tagesübersicht, Verlauf, Barcode, Rezepte, Wochenmenü, Einkaufsliste | M5 bis M8 |
| R3 Synchronisierung | Anmeldung, geräteübergreifender Abgleich, Konfliktbehandlung, Wiederherstellung | M9, M10 |
| R4 Fortschritt, Aktivität, Gewohnheiten | Bestleistungen, Statistiken, Kalender, Supersätze, RPE, Maße, Fotos lokal, Gewohnheiten, Schritte | M11 bis M13 |
| R5 Erweiterungen | Erinnerungen, Foto-Cloud, Kurzbefehl-Automatik, Teilen, Rezept-Import, Übungsmedien | nach Bedarf |

Details und Prüfkriterien je Meilenstein stehen in `implementation-plan.md`.

## 4. MVP-Umfang (R1)

### 4.1 Enthalten

| Bereich | Inhalt | Matrix-IDs |
|---|---|---|
| Dashboard „Heute" | Laufendes Training, nächstes oder heute geplantes Training, letztes Training mit Vergleich, Wochenziel, Körpergewicht mit Ziel, Schnellaktionen, Leerzustände, Hinweise zu Installation, Update und Sicherung | CH-06, CH-07, TH-07, TH-08, BP-06 |
| Programme und Vorlagen | Eigene Programme mit Wochen und Tagen, Übungen zuordnen, sortieren, ersetzen, Satzschema mit Aufwärm-, Arbeits- und Drop-Sätzen, Wiederholungsbereich, Zielgewicht, Zielzeit, Pausen; duplizieren; als Vorlage speichern und verwenden; Beispielvorlagen; aktivieren, beenden, neu starten; Reihenfolge-Modus mit optionalem Wochentag; Vorschau; Datei-Übertragung | TP-01 bis TP-04, TP-06 bis TP-10, TP-12 bis TP-17, TP-19, TP-21 bis TP-26, ON-14 |
| Übungen | Deutsche Basisbibliothek, Suche, Filter, Detail, eigene Übungen, persönliche Anpassungen | TP-06, TP-07, TP-13 |
| Training durchführen | Start aus Programm, Vorlage oder frei; Übungsliste mit Sätzen in freier Reihenfolge; vorherige Werte; Eingabe Gewicht, Wiederholungen, Zeit; Satzstatus; Pausen- und Übungstimer; Fortschritt; Sätze und Übungen hinzufügen, entfernen, ersetzen; automatisches Speichern; Wiederaufnahme; Pausieren; Abschließen; Zusammenfassung; Verwerfen; Wake Lock; Notizen | TS-01 bis TS-15, TS-17, TS-19, TS-21 bis TS-27 |
| Verlauf | Liste, Detail, Bearbeiten, Löschen, Übungsverlauf als Liste und Diagramm | TH-01, TH-02, TH-07 |
| Manuelle Einträge | Krafttraining nachtragen, Aktivität mit Dauer und Distanz erfassen | TS-17, AH-09 |
| Körpergewicht | Erfassen mit Datum und Uhrzeit, Liste, Bearbeiten, Löschen, Verlaufsdiagramm, Zielgewicht | BP-01, BP-02, BP-06, ON-18 |
| Ziele, Profil, Einstellungen | Wochenziel, Zielgewicht, Anzeigename, Trainingseinstellungen, Darstellung, kurze Ersteinrichtung | ON-01, ON-02, ON-07, ON-11, ON-18, SY-06 |
| Daten und Sicherheit | Lokale Datenbank mit Sync-Metadaten, Projektionen, Export, Import (Wiederherstellen, Zusammenführen, Ersetzen), Snapshots, Wiederherstellungsbildschirm, Fehlerprotokoll, dauerhafter Speicher, alle Daten löschen | SY-01, SY-04, SY-05, SY-08, SY-11 bis SY-13, SY-17 bis SY-19, ON-15 |
| Plattform | PWA-Installation, Offline-Betrieb, Update-Hinweis, Hinweis im Safari-Tab, feste Produktivadresse, deutsche Oberfläche, Hell- und Dunkelmodus, Tastaturbedienung, keine Telemetrie | SY-02, SY-06, SY-07, SY-10, SY-14 bis SY-16, SY-20, CH-08 |

### 4.2 Nicht im MVP

Ernährung, Lebensmittel, Rezepte, Wochenmenü, Einkaufsliste, Wasser · Konto, Anmeldung, Synchronisierung · Bestleistungen, Statistiken, Streaks, Kalender, Verschieben nach Datum · Supersätze und RPE in der Oberfläche (im Datenmodell reserviert) · Progressionsvorschlag · Körpermaße, Körperfett, Fotos · Gewohnheiten, Schritte, Challenges · Erinnerungen und Push · Teilen · Übungsbilder und -videos (persönlicher Videolink ist enthalten) · Drag-and-Drop-Sortierung (Sortieren per Aktion ist enthalten) · Kalorienschätzung für Trainings · imperiale Einheiten.

### 4.3 Vorbereitung späterer Module

Das Datenmodell legt Konventionen, IDs, Änderungsstempel, Tombstones, Snapshots, Exportformat und Konfliktregeln für alle späteren Aggregate fest (`data-model.md` Abschnitte 1, 2, 4 und 7). Spätere Module ergänzen Tabellen durch additive Schema-Versionen, ohne bestehende Daten umzuschreiben.

## 5. Funktionale Anforderungen

| Nr. | Anforderung | Matrix | Stufe |
|---|---|---|---|
| FR-01 | Profil, Ziele und Einstellungen sind lokal anlegbar und änderbar; Zieländerungen sind datiert | ON-01, ON-07, ON-11, ON-18 | R1 |
| FR-02 | Programme bestehen aus Wochen, Tagen, Übungen und Satzschemata; Ruhetage sind nicht fest; jeder Tag ist jederzeit startbar | TP-01 bis TP-04, TP-08, TP-14, TP-21 | R1 |
| FR-03 | Die Übungsbibliothek ist offline durchsuchbar und um eigene Übungen erweiterbar | TP-06, TP-07, TP-13 | R1 |
| FR-04 | Ein Training kann geplant oder frei gestartet werden; jede Eingabe wird sofort lokal gespeichert; eine laufende Einheit übersteht Reload, Offline-Phasen und Hintergrund | TS-01 bis TS-06, TS-12, TS-13 | R1 |
| FR-05 | Der Pausentimer rechnet mit gespeicherten Endzeitpunkten und zeigt den nächsten Satz; der Bildschirm bleibt aktiv, wo der Browser es erlaubt | TS-07, TS-09, TS-21 | R1 |
| FR-06 | Sätze und Übungen sind während des Trainings ergänzbar, entfernbar und ersetzbar, ohne protokollierte Daten zu verlieren | TS-10, TS-11 | R1 |
| FR-07 | Abgeschlossene Einheiten bleiben von späteren Planänderungen unberührt und werden nie durch veraltete Kopien überschrieben | TS-14, TH-01, SY-19 | R1 |
| FR-08 | Verläufe und Kennzahlen stammen ausschließlich aus gespeicherten Daten; unter drei Datenpunkten gibt es keinen Trend | TH-02, BP-02 | R1 |
| FR-09 | Körpergewicht ist mit Datum und Uhrzeit erfass-, bearbeit- und löschbar und als Verlauf sichtbar | BP-01, BP-02 | R1 |
| FR-10 | Alle Daten sind exportierbar und importierbar; vor riskanten Vorgängen entsteht ein Snapshot | SY-04, SY-11, SY-19 | R1 |
| FR-11 | Die App ist installierbar, offline nutzbar und aktualisiert sich nur nach Bestätigung | SY-02 | R1 |
| FR-12 | Ernährungseinträge speichern Nährwert-Snapshots; Tageswerte sind die Summe der Einträge; geschätzte und unvollständige Werte sind gekennzeichnet | NU-02, NU-05, NU-19, NU-22 | R2 |
| FR-13 | Lebensmittel kommen aus eigenen Einträgen, gebündelten generischen Daten und optional aus Open Food Facts; Portionen und Einheiten sind umrechenbar | NU-06 bis NU-10, NU-21, NU-23 | R2 |
| FR-14 | Kalorien- und Makroziele werden mit dokumentierter Formel berechnet und sind überschreibbar | NU-01, NU-17 | R2 |
| FR-15 | Rezepte sind skalierbar; Änderungen verändern protokollierte Mahlzeiten nicht | RE-02, RE-12, RE-13 | R2 |
| FR-16 | Aus einer bestätigten Woche entsteht eine zusammengeführte, kategorisierte, bearbeitbare Einkaufsliste | RE-03 bis RE-11 | R2 |
| FR-17 | Optional gleichen sich Geräte über Supabase ab: idempotent, mit Tombstones, Konfliktregeln pro Entität und sichtbarem Status | SY-03, SY-09 | R3 |
| FR-18 | Maße, Fotos (lokal), Gewohnheiten, Schritte und Kalender sind erfassbar und auswertbar | BP-03, BP-05, AH-01 bis AH-04, AH-08 | R4 |

## 6. Akzeptanzkriterien für den MVP

Nachweis: **U** Unit-Test · **I** Integrationstest mit fake-indexeddb · **E** E2E-Test (Playwright, Chromium und WebKit) · **G** Gerätetest auf echtem Gerät nach Protokoll in `testing.md`. Ein Kriterium gilt erst als erfüllt, wenn alle genannten Nachweise bestanden sind.

### 6.1 Plattform und PWA (AK-PWA)

| AK | Kriterium | Matrix | Nachweis | M |
|---|---|---|---|---|
| AK-PWA-01 | Auf dem iPhone und iPad lässt sich die App in Safari über „Teilen › Zum Home-Bildschirm" installieren und startet als eigenständige App ohne Browserleiste mit Name und Icon; am Mac über Safari „Zum Dock hinzufügen" oder die Chrome-Installation | SY-02 | G | M0 |
| AK-PWA-02 | Nach einem Online-Start öffnet die installierte App im Flugmodus alle MVP-Bereiche einschließlich Übungsbibliothek und Beispielvorlagen; kein Bereich zeigt einen Netzwerkfehler | SY-02, TP-06, TP-24 | E, G | M0, M1 |
| AK-PWA-03 | Eine neue Version wird im Hintergrund geladen und erst nach Bestätigung „Jetzt aktualisieren" aktiv; während einer laufenden Einheit erscheint der Hinweis erst nach deren Abschluss | SY-02 | E | M0, M4 |
| AK-PWA-04 | Läuft die App unter iOS oder iPadOS im Safari-Tab, erscheint ein Hinweis mit Installationsanleitung und dem Satz, dass Daten im Browser-Tab getrennt von der installierten App gespeichert werden; der Hinweis ist ausblendbar und unter Mehr › Installieren erneut abrufbar | SY-14 | E, G | M0 |
| AK-PWA-05 | Nach dem ersten gespeicherten Datensatz fordert die App dauerhaften Speicher an, sofern die Schnittstelle existiert; Mehr › Daten zeigt den Status („dauerhaft" oder „nicht garantiert") und den geschätzten Speicherverbrauch | SY-12 | E | M1 |
| AK-PWA-06 | Im MVP verlassen keine Nutzdaten das Gerät; alle Netzwerkzugriffe gehen an die eigene Hosting-Adresse | SY-10 | E | M0, M4 |
| AK-PWA-07 | Die Produktivadresse ist fest und dokumentiert; Vorschau-Deployments laufen unter anderen Adressen; die Umgebung steht unter „Mehr“ › „Über die App“ (der dauerhafte Balken „Vorschau – Testdaten“ entfällt, D-272) | SY-15 | E, G | M0 |

### 6.2 Ersteinrichtung (AK-ONB)

| AK | Kriterium | Matrix | Nachweis | M |
|---|---|---|---|---|
| AK-ONB-01 | Beim ersten Start folgen höchstens vier Schritte: Begrüßung, Installationshinweis (nur iOS-Browser-Tab), optional Wochenziel und Zielgewicht, Wahl „Beispielvorlage", „Eigenes Programm" oder „Später"; jeder Schritt ist überspringbar; die Einrichtung ist unter Mehr erneut aufrufbar; ein Abbruch verliert keine bereits gemachten Eingaben | ON-02 | E | M3 |

### 6.3 Training durchführen (AK-TRN)

| AK | Kriterium | Matrix | Nachweis | M |
|---|---|---|---|---|
| AK-TRN-01 | „Starten" beim nächsten Trainingstag eines aktiven Programms erzeugt innerhalb von 1 s eine laufende Einheit mit allen Übungen und Sätzen des Tages; Namen und Zielwerte sind als Snapshot gespeichert | TS-01 | I, E | M1 |
| AK-TRN-02 | „Freies Training" startet eine leere Einheit; Übungen kommen über die Bibliothek hinzu, und für jede lassen sich Sätze erfassen | TS-01, TS-11 | E | M1 |
| AK-TRN-03 | Jeder Satz hat einen Typ: Aufwärmen, Arbeitssatz oder Drop-Satz. Aufwärmsätze sind sichtbar unterschieden und zählen nicht zum Volumen. Ein Drop-Satz gehört zu einem vorangehenden Arbeitssatz; der Pausentimer startet erst nach dem letzten Drop-Satz der Kette | TS-22, TP-10 | U, E | M1 (Aufwärmen, Arbeit), M2 (Drop) |
| AK-TRN-04 | Gewicht akzeptiert 0 bis 500 kg mit Komma oder Punkt („72,5" und „72.5"); die ±-Tasten nutzen den Gewichtsschritt aus den Einstellungen oder der Übung (Standard 2,5 kg); Wiederholungen sind ganzzahlig 0 bis 200; ungültige Eingaben werden mit Hinweis abgelehnt, ohne gespeicherte Werte zu überschreiben | TS-04, TS-05 | U, E | M1 |
| AK-TRN-05 | Jeder Satz zeigt die Werte des passenden Satzes aus der letzten abgeschlossenen Einheit mit derselben Übung, samt Datum. Passend heißt: gleicher Satztyp und gleiche Position innerhalb dieses Typs. Ohne Vorgeschichte steht „Erstes Mal" | TS-03, SY-18 | I, E | M1 |
| AK-TRN-06 | Leere Felder zeigen Vorschläge als Platzhalter: den Vorwert, sonst einen festen Zielwert. „Satz erledigt" übernimmt sichtbare Vorschläge. Gibt es nur einen Zielbereich (z. B. 8–10) oder keinen Vorschlag, verlangt „erledigt" eine Eingabe | TS-06 | U, E | M1 |
| AK-TRN-07 | Ein Satz ist geplant, erledigt oder übersprungen. „Erledigt" lässt sich rückgängig machen; die Werte bleiben dabei erhalten | TS-06, TS-23 | U, E | M1 |
| AK-TRN-08 | Jeder Satz jeder Übung ist jederzeit erfassbar; keine Übung sperrt eine andere | TS-27, TS-02 | E | M1 |
| AK-TRN-09 | Sätze lassen sich hinzufügen (Vorschlag aus dem letzten Satz) und entfernen; Übungen lassen sich hinzufügen, entfernen (mit Rückfrage bei erledigten Sätzen) und ersetzen. Beim Ersetzen einer Übung mit erledigten Sätzen behält die ursprüngliche Übung diese Sätze, und offene Sätze wandern zur neuen Übung | TS-10, TS-11 | U, E | M1 (hinzufügen, entfernen), M2 (ersetzen) |
| AK-TRN-10 | Nach „erledigt" startet der Pausentimer automatisch (abschaltbar) mit der Pausenzeit aus Satz, Übung oder Einstellungen in dieser Reihenfolge; ±15 s und „Überspringen" sind möglich; der Timer zeigt den nächsten offenen Satz mit Übung und Zielwerten | TS-07, TS-09, TP-09 | U, E | M1 |
| AK-TRN-11 | Der Timer beruht auf einem gespeicherten Endzeitpunkt. Nach Tabwechsel, Reload oder Rückkehr aus dem Hintergrund zeigt er innerhalb von 1 s die korrekte Restzeit (±1 s) oder die Überziehung, z. B. „+0:42" | TS-07 | U, E, G | M1 |
| AK-TRN-12 | Bei Pausenende erscheint im Vordergrund eine deutliche visuelle Anzeige und, falls aktiviert, ein kurzer Ton. Für gesperrten Bildschirm und Hintergrund wird kein Signal zugesagt; das tatsächliche Verhalten wird im Gerätetest protokolliert und in `known-limitations.md` eingetragen | TS-07 | G | M1 |
| AK-TRN-13 | Während einer laufenden Einheit bleibt der Bildschirm per Wake Lock aktiv, sofern unterstützt und eingeschaltet; nach Rückkehr in den Vordergrund wird der Wake Lock neu angefordert; fehlt die Unterstützung, erklärt die Einstellung dies | TS-21 | E, G | M1 |
| AK-TRN-14 | Bei Übungen mit Erfassungsart „Zeit" startet und stoppt ein Satz-Timer; die Dauer wird als Istwert gespeichert; ein laufender Satz-Timer übersteht einen Reload | TS-08 | E | M2 |
| AK-TRN-15 | Die Einheit zeigt Dauer ohne Pausen, erledigte und geplante Sätze sowie den Fortschritt je Übung | TS-24 | E | M1 |
| AK-TRN-16 | Jede Statusänderung eines Satzes ist spätestens 1 s nach der Aktion in IndexedDB gespeichert, jede Werteingabe spätestens 0,5 s nach der letzten Eingabe. Nachweis: „erledigt" und sofortiger Reload behält den Satz; Eingabe, 0,6 s warten, Reload behält den Wert | TS-12 | E | M1 |
| AK-TRN-17 | Nach Reload, Beenden und Neustart der App oder einer Offline-Phase sind alle erledigten Sätze, Eingaben (gemäß AK-TRN-16) und der Timerzustand erhalten; die Startseite führt mit einem Tipp zurück; auf allen Seiten erscheint die Leiste „Training läuft" | TS-13, TS-25 | E, G | M1 |
| AK-TRN-18 | „Pausieren" hält die Trainingsdauer an, „Fortsetzen" setzt sie fort; Pausen zählen nicht zur Dauer | TS-13 | U, E | M2 |
| AK-TRN-19 | „Training beenden" fragt bei offenen Sätzen, ob diese als übersprungen gelten sollen; danach ist die Einheit abgeschlossen, die Endzeit gesetzt und die Zusammenfassung sichtbar; die Einheit erscheint sofort im Verlauf | TS-14 | E | M1 |
| AK-TRN-20 | Die Zusammenfassung zeigt Dauer, Zahl der Übungen, erledigte Sätze, Volumen in kg ohne Aufwärmsätze und je Übung den besten Satz; ab M3 zusätzlich den Vergleich mit der letzten Einheit desselben Trainingstags, nur wenn eine solche existiert | TS-15, TH-07 | U, E | M1, M3 |
| AK-TRN-21 | „Training verwerfen" entfernt die Einheit nach Bestätigung; „Rückgängig" ist 10 s lang möglich | TS-26 | E | M1 |
| AK-TRN-22 | Pro Gerät läuft höchstens eine Einheit; ein zweiter Start bietet „Laufendes Training fortsetzen" an | TS-01 | E | M1 |
| AK-TRN-23 | Ein Krafttraining lässt sich mit Datum, Uhrzeit, Dauer und Sätzen ohne Timer nachtragen; eine Aktivität lässt sich mit Typ, Datum, Dauer, optional Distanz und Notiz erfassen; beides erscheint im Verlauf und zählt zum Wochenziel | TS-17, AH-09 | E | M2 |
| AK-TRN-24 | Einheit und Übung können eine Notiz erhalten; sie erscheint im Verlauf und beim nächsten Mal derselben Übung | TS-19 | E | M2 |
| AK-TRN-25 | Schlägt ein Speichern fehl, erscheint sofort ein sichtbarer Hinweis mit „Erneut versuchen", und der Satz wird nicht als gespeichert dargestellt | TS-12, SY-13 | I, E | M1 |
| AK-TRN-26 | Bei Rückkehr in den Vordergrund prüft die App die Datenbankverbindung; bei Verlust öffnet sie neu oder startet die App kontrolliert neu, bevor neue Eingaben möglich sind; kein bereits gespeicherter Satz geht verloren | TS-13, SY-13 | I, G | M1 |

### 6.4 Programme und Vorlagen (AK-PRG)

| AK | Kriterium | Matrix | Nachweis | M |
|---|---|---|---|---|
| AK-PRG-01 | Ein Programm hat einen Namen, optional eine Beschreibung und mindestens eine Woche mit mindestens einem Trainingstag | TP-14, TP-03, TP-01 | U, E | M2 |
| AK-PRG-02 | Wochen und Tage lassen sich hinzufügen, umbenennen, duplizieren, löschen (mit Rückfrage) und umsortieren | TP-03 | E | M2 |
| AK-PRG-03 | Übungen lassen sich einem Tag aus der Bibliothek hinzufügen, umsortieren (Aktionen „nach oben" und „nach unten", auch per Tastatur), ersetzen (mit Alternativen gleicher Hauptmuskelgruppe) und entfernen | TP-04, TP-12 | E | M2 |
| AK-PRG-04 | Pro Übung gibt es Sätze mit Typ, Wiederholungsbereich (Bereich oder fester Wert), optionalem Zielgewicht, optionaler Zielzeit bei Zeitübungen und Pausenzeit; Sätze lassen sich hinzufügen und entfernen | TP-08, TP-09, TP-10, TP-15 | U, E | M2 |
| AK-PRG-05 | Ein Programm lässt sich duplizieren; die Kopie hat neue IDs, ist unabhängig und trägt den Zusatz „(Kopie)" | TP-23 | U, E | M2 |
| AK-PRG-06 | Ein Programm lässt sich als Vorlage speichern; „Vorlage verwenden" erzeugt ein neues Programm als Kopie. Beispielvorlagen tragen das Etikett „Beispiel" und den Hinweis „Beispieldaten – keine individuelle Trainingsempfehlung"; sie sind nicht bearbeitbar, nur kopierbar | TP-24, TP-25, TP-01 | E | M1 (Beispiel starten), M2 |
| AK-PRG-07 | Höchstens ein Programm ist aktiv; das Aktivieren eines anderen beendet das bisherige mit Datum; vergangene Einheiten bleiben unverändert | TP-19, ON-14 | U, E | M2 |
| AK-PRG-08 | Der nächste Trainingstag ist der Tag nach dem zuletzt abgeschlossenen Tag dieses Programms, über Wochengrenzen hinweg; nach der letzten Woche beginnt das Programm wieder bei Woche 1, wenn „wiederholen" aktiv ist, sonst gilt es als abgeschlossen; jeder andere Tag ist jederzeit startbar; es gibt keine festen Ruhetage | TP-21, TP-16 | U, E | M2 |
| AK-PRG-09 | Je Trainingstag lässt sich optional ein Wochentag hinterlegen; passt er zu heute, zeigt das Dashboard „Heute geplant" | TP-22 | U, E | M2 |
| AK-PRG-10 | Änderungen an einem Programm wirken nur auf künftig gestartete Einheiten; laufende und abgeschlossene Einheiten behalten ihren Snapshot | TP-14 | I | M2 |
| AK-PRG-11 | Programme lassen sich archivieren oder löschen (mit Rückfrage, 10 s rückgängig); Einheiten daraus bleiben mit Programmname im Verlauf | TP-01 | E | M2 |
| AK-PRG-12 | Die Programmansicht zeigt alle Wochen und Tage mit Übungen und markiert den nächsten Tag | TP-02, TP-17 | E | M2 |
| AK-PRG-13 | Ein Programm lässt sich als Datei exportieren und auf einem anderen Gerät importieren; bei gleicher ID fragt die App, ob aktualisiert oder als Kopie angelegt werden soll | TP-26 | I, E | R3 (D-259: über die Synchronisierung statt Programmdatei) |

### 6.5 Übungen (AK-EXL)

| AK | Kriterium | Matrix | Nachweis | M |
|---|---|---|---|---|
| AK-EXL-01 | Die Basisbibliothek enthält mindestens 100 Übungen mit deutschem Namen, Hauptmuskelgruppen, Gerät und Erfassungsart; sie ist ab dem ersten Start offline verfügbar | TP-06 | U, E | M1 |
| AK-EXL-02 | Die Suche findet Namen und Alias-Namen, auch englische, unabhängig von Groß- und Kleinschreibung, Umlautschreibweise (ä/ae) und Bindestrichen; Filter nach Muskelgruppe und Gerät; Ergebnis in unter 100 ms bei 500 Übungen | TP-06 | U, E | M1 |
| AK-EXL-03 | Eigene Übungen lassen sich anlegen, bearbeiten und archivieren; sie erscheinen gleichwertig in Suche, Programmen und Verlauf; bei gleichem Namen wie eine bestehende Übung erscheint ein Hinweis | TP-13 | E | M2 |
| AK-EXL-04 | Für jede Übung lassen sich persönliche Notiz, Standardpause, Gewichtsschritt und ein Videolink speichern; App-Updates der Basisbibliothek überschreiben diese Angaben nie | TP-07 | U, E | M2 |
| AK-EXL-05 | Das Übungsdetail zeigt Muskeln, Gerät, persönliche Angaben, den Videolink (öffnet extern) und die letzten Einheiten mit dieser Übung; ab M3 zusätzlich das Verlaufsdiagramm | TP-07, TH-02 | E | M2, M3 |

### 6.6 Verlauf (AK-HIS)

| AK | Kriterium | Matrix | Nachweis | M |
|---|---|---|---|---|
| AK-HIS-01 | Der Verlauf listet abgeschlossene Einheiten absteigend, nach Woche gruppiert, mit Name, Datum, Dauer, Sätzen und Volumen bzw. Aktivitätsdaten; er bleibt bei 1.000 Einheiten flüssig | TH-01 | E | M1, M4 |
| AK-HIS-02 | Das Detail zeigt alle Übungen und Sätze mit Typ, Werten, Status und Notizen | TH-01 | E | M1 |
| AK-HIS-03 | Werte, Sätze, Datum, Uhrzeit und Notiz einer abgeschlossenen Einheit sind änderbar; vorherige Werte und Verläufe aktualisieren sich danach | TH-01, SY-18 | I, E | M2 |
| AK-HIS-04 | Eine Einheit lässt sich mit Rückfrage löschen und 10 s lang wiederherstellen; danach bleibt eine Löschmarkierung für die spätere Synchronisierung | TH-01 | I, E | M2 |
| AK-HIS-05 | Das Übungsdiagramm zeigt je Einheit den besten Satz (Gewicht) oder das geschätzte 1RM (Epley, nur 1 bis 10 Wiederholungen) in den Zeiträumen 3 Monate, 1 Jahr und Gesamt; unter drei Datenpunkten erscheint statt einer Linie die Liste mit Hinweis | TH-02 | U, E | M3 |
| AK-HIS-06 | „Fortschritt“ zeigt Trainings, Minuten, Volumen und die Kalorienschätzung für die Zeiträume Woche (ab Montag), Monat, 3 Monate, Jahr und Gesamt, ausschließlich aus gespeicherten Einheiten; die Kalorienschätzung erscheint nur mit gespeichertem Körpergewicht und ist als Schätzung gekennzeichnet (D-251) | TH-06, TS-18 | U, E | Schritt E |
| AK-HIS-07 | Je Übung gilt der beste Satz nach Erfassungsart als Bestleistung (bei Gewicht höchstes Gewicht, bei Gleichstand mehr Wiederholungen; dazu das beste geschätzte 1RM); die Zusammenfassung markiert „Neue Bestleistung“ nur, wenn eine frühere Einheit der Übung existiert und übertroffen wurde | TH-05 | U, K | Schritt E |

### 6.7 Körpergewicht (AK-BW)

| AK | Kriterium | Matrix | Nachweis | M |
|---|---|---|---|---|
| AK-BW-01 | Gewicht wird in kg mit einer Nachkommastelle erfasst (Komma oder Punkt), Bereich 20 bis 400 kg; Datum und Uhrzeit sind vorbelegt mit jetzt, änderbar und höchstens einen Tag in der Zukunft; eine Notiz ist optional | BP-01 | U, E | M3 |
| AK-BW-02 | Weicht ein Wert um mehr als 3 kg vom zeitlich nächsten Eintrag innerhalb von 3 Tagen ab, erscheint „Bitte prüfen"; Speichern bleibt möglich | BP-01 | U | M3 |
| AK-BW-03 | Die Liste zeigt alle Einträge absteigend, nach Monat gruppiert, mit Differenz zum vorherigen Eintrag | BP-01 | E | M3 |
| AK-BW-04 | Tippen auf einen Eintrag öffnet die Bearbeitung; Löschen ist 10 s lang rückgängig zu machen | BP-01 | E | M3 |
| AK-BW-05 | Das Diagramm bietet 30 Tage, 90 Tage, 1 Jahr und Gesamt; jeder Eintrag ist ein Punkt; der gleitende 7-Tage-Durchschnitt erscheint ab drei Einträgen im Zeitraum; ein gesetztes Zielgewicht erscheint als beschriftete Linie; der Tooltip zeigt Datum, Uhrzeit und Wert; eine Tabelle dient als Textalternative | BP-02, BP-06 | U, E | M3 |
| AK-BW-06 | Die Veränderung im Zeitraum erscheint nur, wenn mindestens zwei Einträge mit mindestens 7 Tagen Abstand vorliegen; ohne Ziel bleibt die Veränderung neutral gefärbt | BP-02 | U | M3 |

### 6.8 Dashboard (AK-DSH)

| AK | Kriterium | Matrix | Nachweis | M |
|---|---|---|---|---|
| AK-DSH-01 | Eine laufende Einheit hat Vorrang: Karte „Training läuft" mit Dauer, Fortschritt und „Fortsetzen" | CH-06, TS-25 | E | M1 |
| AK-DSH-02 | Bei aktivem Programm zeigt die Karte „Heute geplant" (Wochentag-Hinweis) oder „Nächstes Training" mit „Starten" und „Anderen Tag wählen" | CH-06, TP-21, TP-22 | E | M2, M3 |
| AK-DSH-03 | Ohne Programm erscheint ein Leerzustand mit „Beispielvorlage wählen", „Eigenes Programm erstellen" und „Freies Training" | CH-06 | E | M1, M3 |
| AK-DSH-04 | „Letztes Training" zeigt Datum, Name, Dauer, Sätze, Volumen und die Veränderung zur vorherigen Einheit desselben Tages; ohne abgeschlossenes Training fehlt die Karte | TH-07 | E | M3 |
| AK-DSH-05 | Das Wochenziel zeigt „x von y Trainings diese Woche" (Montag bis Sonntag) mit Fortschrittsbalken; ohne Ziel erscheint „Wochenziel festlegen" | TH-08, ON-07 | U, E | M3 |
| AK-DSH-06 | „Körpergewicht" zeigt den letzten Wert mit Datum, ab drei Einträgen einen Mini-Verlauf und, falls gesetzt, den Abstand zum Zielgewicht; ohne Daten erscheint „Gewicht erfassen" | BP-06, ON-18 | E | M3 |
| AK-DSH-07 | Jede Zahl stammt aus gespeicherten Daten; fehlende Daten erzeugen einen Leerzustand mit passender Aktion, nie einen Platzhalterwert | CH-06 | E | M3 |
| AK-DSH-08 | „Gewicht erfassen", „Training nachtragen" und „Training starten" sind mit höchstens zwei Tipps erreichbar | CH-07 | E | M3 |

### 6.9 Ziele, Profil, Einstellungen (AK-SET)

| AK | Kriterium | Matrix | Nachweis | M |
|---|---|---|---|---|
| AK-SET-01 | Zielgewicht (30 bis 300 kg) und Trainings pro Woche (1 bis 7) lassen sich setzen, ändern und entfernen; jede Änderung wird mit Datum festgehalten | ON-07, ON-18, ON-14 | U, E | M3 |
| AK-SET-02 | Trainingseinstellungen: Standardpause 0 bis 600 s (Standard 90 s), Gewichtsschritt 0,5 / 1 / 1,25 / 2,5 / 5 kg (Standard 2,5), Pausentimer automatisch, Ton bei Pausenende, Bildschirm aktiv halten; Änderungen wirken sofort | ON-11 | E | M1, M3 |
| AK-SET-03 | Darstellung Hell (Standard), Dunkel oder System; beide Modi erfüllen AK-UX-04 | SY-06 | E | M4 |
| AK-SET-04 | Alle Texte sind deutsch; Datum und Zahlen folgen der Gerätesprache (de-AT ergibt „Jänner", sonst de-DE); Wochenbeginn Montag; 24-Stunden-Zeit; Dezimalkomma | SY-16 | U | M0 |
| AK-SET-05 | Die App funktioniert ohne Konto; der Anzeigename ist optional; es gibt keine Pflichtangaben | ON-01, ON-11 | E | M3 |
| AK-SET-06 | Mehr › Installieren zeigt die Anleitung für iPhone, iPad und Mac und erkennt, ob die App bereits installiert läuft | SY-14 | E | M0 |
| AK-SET-07 | Mehr › Über zeigt App-Version, Änderungsprotokoll und Lizenzhinweise der verwendeten Bibliotheken und Daten | SY-20 | E | M4 |

### 6.10 Daten und Sicherheit (AK-DAT)

| AK | Kriterium | Matrix | Nachweis | M |
|---|---|---|---|---|
| AK-DAT-01 | „Daten exportieren" erzeugt eine JSON-Datei mit allen MVP-Daten inklusive Metadaten und Löschmarkierungen; auf iOS über das Teilen-Menü („In Dateien sichern"), am Mac als Download; der Dateiname enthält Datum und Uhrzeit | SY-04 | I, E, G | M1 |
| AK-DAT-02 | Eine Exportdatei lässt sich in eine leere Datenbank importieren; danach sind alle Daten identisch (Vergleich im Test) | SY-04, SY-05 | I, E | M2 |
| AK-DAT-03 | Import in eine bestehende Datenbank führt nach den Importregeln zusammen (`data-model.md` Abschnitt 7.4): Trainingseinheiten nach den Sitzungsregeln, sonst gewinnt die neuere Version; vorher entsteht ein Snapshot; danach erscheint eine Zusammenfassung mit neu, aktualisiert und unverändert je Datentyp | SY-19, SY-11 | U, I, E | M4 |
| AK-DAT-04 | „Ersetzen" ist nur nach doppelter Bestätigung möglich; vorher entsteht automatisch ein Snapshot | SY-04, SY-11 | E | M4 |
| AK-DAT-05 | Ungültige oder fremde Dateien werden ohne Änderung der Datenbank abgelehnt, mit verständlichem Grund | SY-04 | U, I | M2 |
| AK-DAT-06 | Vor Schema-Upgrade, jedem Import und „Alle Daten löschen" entsteht automatisch ein Snapshot in einer separaten lokalen Datenbank; die letzten fünf bleiben erhalten; unter Mehr › Daten lassen sie sich wiederherstellen und exportieren | SY-11 | I, E | M1 (Erstellung), M4 (Oberfläche) |
| AK-DAT-07 | Jede Schemaversion hat einen Migrationstest mit einer Datenbank der Vorversion | SY-01 | I | ab M1 |
| AK-DAT-08 | Lässt sich die Datenbank nicht öffnen, erscheint ein Wiederherstellungsbildschirm mit Ursache, „Erneut versuchen", „Snapshot wiederherstellen", „Fehlerprotokoll exportieren" und „Zurücksetzen" (erst nach Export-Angebot und doppelter Bestätigung) | SY-13 | I, E | M4 |
| AK-DAT-09 | Stürzt eine Ansicht ab, erscheint eine Fehleransicht mit „Neu laden"; andere Bereiche bleiben nutzbar; der Fehler wird ohne Nutzdaten protokolliert | SY-08, SY-13 | E | M4 |
| AK-DAT-10 | „Alle Daten löschen" entfernt nach doppelter Bestätigung alle lokalen Daten; vorher entsteht ein Snapshot, und ein Export wird angeboten | ON-15 | E | M4 |
| AK-DAT-11 | Jeder gespeicherte Datensatz hat ID, Erstellzeit, HLC-Änderungsstempel, Löschmarkierung statt physischer Löschung und Schemaversion; Schema-Tests prüfen das | SY-17, SY-01 | U | M0, M1 |
| AK-DAT-12 | Liegen Daten vor und gab es 14 Tage keinen Export, zeigt das Dashboard einen Sicherungshinweis mit „Jetzt exportieren" | SY-05 | U, E | M3 |

### 6.11 Bedienung, Barrierefreiheit, Leistung (AK-UX)

| AK | Kriterium | Matrix | Nachweis | M |
|---|---|---|---|---|
| AK-UX-01 | Jede sichtbare Schaltfläche löst eine implementierte Aktion aus; nicht verfügbare Module erscheinen nicht in der Navigation | CH-08 | E | M4 |
| AK-UX-02 | Jede Ansicht hat die im Screen-Katalog festgelegten Lade-, Leer- und Fehlerzustände | CH-06 | E | M4 |
| AK-UX-03 | Bedienziele sind mindestens 44 × 44 pt groß, im Training mindestens 48 × 48 pt; die Hauptaktionen im Training liegen im unteren Bildschirmdrittel | SY-07, TS-02 | E, G | M1, M4 |
| AK-UX-04 | Texte erfüllen WCAG 2.1 AA (4,5:1, große Schrift 3:1), Bedienelemente und Diagrammlinien mindestens 3:1, in Hell und Dunkel; geprüft per Token-Skript und axe | SY-06, SY-07 | U, E | M4 |
| AK-UX-05 | Am Mac und iPad mit Tastatur ist alles per Tastatur bedienbar. Im Training gelten: Eingabetaste im Wiederholungsfeld = Satz erledigt, Tab und Umschalt+Tab zwischen Feldern, Esc schließt Dialoge, ⌘K bzw. Strg+K öffnet die Übungssuche | SY-07 | E | M4 |
| AK-UX-06 | Die installierte App ist auf dem Referenz-iPhone nach einem Kaltstart in unter 2 s bedienbar; „Satz erledigt" gibt in unter 100 ms sichtbare Rückmeldung; die Abfrage vorheriger Werte dauert bei fünf Jahren generierter Daten unter 50 ms | SY-01 | E, G | M4 |
| AK-UX-07 | iPhone im Hochformat, iPad hoch und quer sowie in Split View und Mac ab 1024 px Breite funktionieren ohne horizontales Scrollen; am Desktop gibt es eine Seitenleiste | CH-08 | E, G | M4 |
| AK-UX-08 | Bei `prefers-reduced-motion` entfallen Bewegungen außer notwendigen Zustandswechseln | SY-07 | E | M4 |

### 6.12 Tagesaufgaben (AK-HAB)

| AK | Kriterium | Matrix | Nachweis | M |
|---|---|---|---|---|
| AK-HAB-01 | Tagesaufgaben lassen sich frei anlegen (Name bis 80 Zeichen), umbenennen, per „nach oben“ und „nach unten“ ordnen, ab heute pausieren (hinter dem Symbol oben rechts wieder aufnehmbar) und löschen (beides 10 s rückgängig); jede Aufgabe gilt ab dem Tag des Anlegens bis vor den Tag des Pausierens oder Löschens, ohne frühere Pausen; je Aufgabe und Tag gibt es genau einen Eintrag „erledigt“; am neuen Tag ist alles offen, Neuladen setzt nichts zurück, frühere Tage bleiben unverändert (D-283) | AH-03, AH-04 | U, K, E | Schritt F, D-283 |
| AK-HAB-03 | Fortschritt unter „Verwalten“ nach D-284: Zeitraum 7/30/90/Gesamt ändert alle Zahlen; Quote ohne heute und ohne Tage ohne Eintrag; neue Aufgaben zählen nicht rückwirkend; pausierte und gelöschte nur an ihren fälligen Tagen; Serie und beste Serie; Gesamtübersicht je Aufgabe und Tag; Einzelauswertung mit Vergleich nur bei genug Daten, Kalender und Wochentagen; Hinweise nur ab 14 fälligen Tagen | AH-03 | U, K, E | D-284 |
| AK-HAB-02 | „Heute“ zeigt die Tagesaufgaben als schlichte Liste zum Abhaken (Kreis mit Haken, Text durchgestrichen) und darunter einen schmalen Balken mit „x von y erledigt“; keine Serie (D-283, ersetzt die Serie aus D-253) | AH-05 | U, K, E | Schritt F, D-283 |

### 6.12a Ernährung, Grundausbau (AK-NUT)

| AK | Kriterium | Matrix | Nachweis | M |
|---|---|---|---|---|
| AK-NUT-01 | Ein Tag lässt sich in vier Mahlzeiten (Frühstück, Mittagessen, Abendessen, Snacks) mit Lebensmitteln aus dem BLS und eigenen Lebensmitteln protokollieren; die Tagessumme stimmt mit einer Handrechnung überein; Einträge behalten ihre Werte, auch wenn das Lebensmittel später geändert wird; jeder Tag ist über Vor und Zurück aufrufbar | NU-02, NU-03, NU-05, NU-21 | U, K, E | Schritt G |
| AK-NUT-02 | Die Menge wird in g bzw. ml oder als Anzahl einer Portion erfasst; eine Mengenänderung rechnet den Eintrag neu; ein Eintrag lässt sich in eine andere Mahlzeit verschieben und mit 10 s „Rückgängig“ löschen | NU-09, NU-15 | U, K | Schritt G |
| AK-NUT-03 | Eigene Lebensmittel mit Name, optional Marke, Basis g oder ml, Pflichtwerten Energie, Eiweiß, Kohlenhydrate und Fett je 100, optionalen weiteren Werten und Portionen; bei Abweichung der Energie von 4/4/9 erscheint ein Hinweis; Favorit und Archiv | NU-10 | U, K | Schritt G |
| AK-NUT-04 | Ein Schnelleintrag nur mit Energie und optional Makros ist möglich und als Schätzung gekennzeichnet; fehlen Werte bei einem Eintrag, weist die Tagesübersicht darauf hin | NU-20, NU-22 | U, K | Schritt G |
| AK-NUT-05 | Das Tagesziel lässt sich selbst eintragen oder aus einem Vorschlag (Mifflin-St Jeor, Aktivität, Richtung) übernehmen; Ziele sind datiert, eine Änderung gilt ab heute; die Tagesübersicht zeigt Ziel, Rest und Makros | NU-01, NU-17 | U, K, E | Schritt G |
| AK-NUT-06 | Die Suche findet Lebensmittel auch über österreichische Bezeichnungen (z. B. Topfen, Erdäpfel, Paradeiser) und funktioniert ohne Netz; der Quellenhinweis zum BLS ist sichtbar | NU-21, NU-25 | U, K, E | Schritt G |
| AK-NUT-07 | Eine Datei der BLS-Recherche lässt sich lokal importieren: Vorschau mit übernommenen (ÖNWT) und weggelassenen Einträgen (deutsche BLS-Daten, auslaufend, unklar oder unvollständig); nach Bestätigung erscheinen die Lebensmittel mit Herkunft in der Suche, auch nach Neuladen und ohne Netz; „Import entfernen“ nimmt sie aus der Suche, Protokolleinträge bleiben; eine fremde Datei wird abgelehnt | NU-25 | U, K, E | Schritt G |
| AK-NUT-08 | Beim Hinzufügen zeigt die App alle acht Nährwerte je 100 und für die gewählte Menge, beim Bearbeiten die Werte des Eintrags; die Tagesübersicht zeigt zusätzlich Zucker, Salz, Ballaststoffe und gesättigte Fettsäuren; fehlende Werte sind als „–“ bzw. „Unvollständig“ erkennbar | NU-16 | K, E | Schritt G |
| AK-NUT-09 | „Barcode scannen“ erkennt EAN-13, EAN-8 und UPC-A mit der Kamera oder per Eingabe; ein Barcode aus „Meine Lebensmittel“ wird ohne Netz gefunden; ein unbekannter Barcode geht erst nach Einwilligung und nur als Barcode an Open Food Facts; ein vollständiger Treffer wird als eigenes Lebensmittel mit Quelle gespeichert und lässt sich sofort eintragen; ohne Treffer, ohne Netz oder bei fehlenden Werten bietet die App das Formular mit Barcode an; die Einwilligung lässt sich zurückziehen | NU-07, NU-24 | U, K, E, G | Schritt G |
| AK-NUT-10 | Ein Rezept mit Name, Portionen und Zutaten aus der Lebensmittelsuche (Menge in g bzw. ml oder als Portion) lässt sich anlegen, bearbeiten, archivieren und löschen; die Nährwerte je Portion und gesamt stimmen mit einer Handrechnung überein; fehlende Werte einer Zutat erscheinen als unvollständig; das Rezept lässt sich portionsweise eintragen, und spätere Änderungen am Rezept ändern bestehende Einträge nicht | RE-02, RE-12, RE-13 | U, K, E | M7 |
| AK-NUT-11 | Die Einträge einer Mahlzeit lassen sich als Vorlage mit Namen speichern; unter „Lebensmittel hinzufügen“ trägt „Alle eintragen“ alle Posten mit unveränderten Werten in die gewählte Mahlzeit und den gewählten Tag ein; Vorlagen lassen sich umbenennen und mit Rückgängig löschen | NU-11 | U, K, E | Schritt G |

### 6.12b Synchronisierung, erste Stufe (AK-SYN)

| AK | Kriterium | Matrix | Nachweis | M |
|---|---|---|---|---|
| AK-SYN-01 | Unter „Mehr“ → „Synchronisierung“ meldet man sich mit E-Mail und Passwort an und ab; ohne Anmeldung bleibt die App voll nutzbar und sendet nichts; falsche Zugangsdaten und fehlendes Netz werden verständlich gemeldet; beim Abmelden bleiben die Daten auf dem Gerät | SY-09 | U, I, E | M9 |
| AK-SYN-02 | Angemeldet gleicht die App alle eigenen Dokumente (inklusive Löschmarkierungen) mit Supabase ab: beim Öffnen, nach Änderungen, beim Zurückkehren, bei wiederkehrendem Netz, alle 5 Minuten und per „Jetzt abgleichen“; ein zweites Gerät erhält neue, geänderte und gelöschte Dokumente; der Stand (Zeit, geholt, gesendet, Fehler) ist sichtbar | SY-03 | U, I, E, G | M9 |
| AK-SYN-03 | Bei Änderungen auf beiden Geräten gewinnt die jüngere Fassung; eine abgeschlossene Trainingseinheit wird nie durch eine laufende ersetzt; bei Programmen und Rezepten entsteht statt Überschreiben eine Konfliktkopie; ein anderer Nutzer sieht keine fremden Zeilen (RLS) | SY-03 | U, I | M9 |

### 6.13 Gerätetests (AK-DEV)

| AK | Kriterium | Matrix | Nachweis | M |
|---|---|---|---|---|
| AK-DEV-01 | Das iPhone-Protokoll T-IPH-M1 aus `testing.md` ist vollständig bestanden; die Befunde zu Ton, Timer, Hintergrund und Sperrbildschirm sind dokumentiert | TS-07, TS-13, SY-02 | G | M1 |
| AK-DEV-02 | Die Protokolle T-IPD-M4 (iPad) und T-MAC-M4 (Mac) sind bestanden | SY-02, SY-07 | G | M4 |
| AK-DEV-03 | Jedes Geräteprotokoll ist mit Datum, Gerät, Betriebssystemversion und App-Version in `testing.md` eingetragen | – | G | M1, M4 |

## 7. Nichtfunktionale Anforderungen

| Bereich | Anforderung | Prüfung |
|---|---|---|
| Leistung | Siehe AK-UX-06; zusätzlich Bundle der Startansicht unter 250 KB komprimiert, Diagramme und seltene Bereiche nachgeladen | Build-Analyse, E2E-Messung |
| Offline | Alle MVP-Funktionen ohne Netz; Netz nur für App-Updates | AK-PWA-02 |
| Datenintegrität | Regeln aus `data-model.md` Abschnitt 8; keine stillen Datenverluste; jede Zusammenführung protokolliert | Unit- und Integrationstests |
| Zuverlässigkeit | Reload, Tabwechsel, Gerätesperre und Browserabsturz verlieren höchstens die letzte noch nicht gespeicherte Eingabe (unter 0,5 s) | AK-TRN-16, AK-TRN-17 |
| Datenschutz | Keine Telemetrie; keine Nutzdaten an Dritte im MVP; Fehlerprotokoll ohne Nutzdaten | AK-PWA-06, Code-Review |
| Sicherheit | Content Security Policy und Sicherheits-Header beim Hosting; keine Secrets im Client | Header-Prüfung in E2E |
| Barrierefreiheit | WCAG 2.1 AA für die Kernabläufe | AK-UX-03 bis AK-UX-05 |
| Wartbarkeit | TypeScript strict; Modulgrenzen per Lint; Tests für Berechnungen und Services; Bericht je Arbeitspaket | CI |
| Kompatibilität | Siehe Abschnitt 1; Feature-Erkennung statt Browser-Erkennung | E2E Chromium und WebKit, Gerätetests |
| Design | Mobile-first, responsiv, Hell und Dunkel, definierte Zustände | Design-Review, AK-UX-02 |

## 8. Annahmen und Randbedingungen

- Der Produktinhaber stellt ein GitHub-Repository und ein Hosting-Konto bereit oder gibt deren Einrichtung frei (Q-01, Q-02).
- Die Produktivadresse bleibt dauerhaft gleich; ein Wechsel erfordert Export und Import.
- Übungs- und Lebensmitteldaten stammen aus eigener Pflege oder offenen Quellen mit dokumentierter Lizenz.
- Die App gibt keine medizinischen Ratschläge; Berechnungen tragen einen Hinweis.
- Gerätetests führt der Produktinhaber nach Protokoll durch; ich werte die Befunde aus und dokumentiere sie.

## 9. Definition of Done (verbindlich je Funktion)

1. Anforderungen und Akzeptanzkriterien sind dokumentiert.
2. Die Funktion ist vollständig implementiert; jede sichtbare Aktion funktioniert.
3. Daten werden korrekt und dauerhaft gespeichert.
4. Fehlerfälle sind behandelt und getestet.
5. Alle zugeordneten Nachweise (U, I, E, G) sind bestanden; die Testergebnisse sind wörtlich berichtet.
6. Es gibt keine bekannten kritischen Regressionen.
7. Matrix, Einschränkungen und Changelog sind aktualisiert.
8. Die Funktion ist auf den vorgesehenen Geräten geprüft.
