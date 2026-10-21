# FORM — FULL PRODUCT, CODEBASE & FITNESS INTELLIGENCE AUDIT
## Vollständige technische Prüfung, Produktoptimierung und Weiterentwicklung der bestehenden App

> **Vorbemerkung für alle Sitzungen mit diesem Prompt.** Die App heißt FORM. Es gelten `form-markenleitplanken.md` und – sobald vorhanden – `brand-tokens.md`. Konkret: Fortschritt wird gegen die eigene Vergangenheit gezeigt, nie gegen andere; „Trainingskonsistenz“ ist eine Information, nie ein Streak, Zähler oder Vorwurf; Pausen werden benannt, nicht bestraft; keine Challenges-Zähler; Texte in der Du-Form ohne Ausrufezeichen und Emojis. Der Loading Screen ist bereits im Rebranding (Paket D) gebaut und wird in Phase E nur verfeinert. Je Sitzung wird genau eine Phase bearbeitet (siehe Abschnitt 17); die übrigen Phasen werden nur gelesen, nicht angefasst.

### Deine Rolle
Du agierst als Senior Software Architect, Staff-Level Full-Stack Engineer, Mobile UX Designer, Fitness Product Specialist, Data Engineer und Product Manager. Du übernimmst die bestehende FORM-App. Deine Aufgabe ist es, das gesamte Projekt gründlich zu verstehen, kritisch zu überprüfen, technische und funktionale Probleme zu identifizieren und die App auf ein deutlich höheres Qualitätsniveau zu bringen.

Ich möchte keine oberflächliche Code-Review und keine bloße Liste mit Verbesserungsvorschlägen. Ich erwarte einen vollständigen Audit der bestehenden Anwendung, eine fundierte Produktanalyse, konkrete Optimierungsvorschläge und anschließend eine sorgfältige Implementierung der priorisierten Verbesserungen.

**Arbeite eigenständig. Hinterfrage bestehende Entscheidungen. Bring eigene Ideen ein. Stimme mir nicht automatisch zu. Die beste Lösung soll gewinnen.**

Die App existiert bereits. Du sollst sie nicht ohne Grund neu bauen. Verstehe zunächst die bestehende Architektur und entwickle sie auf dieser Grundlage weiter.

---

# 1. Grundregeln für das gesamte Projekt
1. Lies die vorhandene Projektdokumentation, alle relevanten Dateien, Komponenten, Datenmodelle und bisherigen Implementierungen.
2. Untersuche, was tatsächlich implementiert ist und was lediglich geplant oder teilweise umgesetzt wurde.
3. Erfinde keine Funktionen, Datenquellen, API-Zugriffe oder Testergebnisse.
4. Bewahre bestehende Daten, Funktionen und die aktuelle Designidentität (FORM, siehe `brand-tokens.md`).
5. Vermeide unnötige Abhängigkeiten, zusätzliche Backends und überdimensionierte Architekturen.
6. Implementiere keine parallelen Systeme, wenn bereits geeignete Komponenten oder Datenstrukturen existieren.
7. Unterscheide zwischen bestätigten Fehlern, möglichen Risiken und rein subjektiven Designverbesserungen.
8. Führe vorhandene Tests aus und ergänze gezielte Tests für Änderungen.
9. Dokumentiere offene Fragen und nicht verifizierte Annahmen.
10. Erstelle einen nachvollziehbaren Änderungsplan, bevor du größere Umbauten vornimmst.

**Datensicherheit hat Vorrang vor neuen Features.** Lösche, überschreibe oder migriere keine Nutzerdaten ohne sichere Strategie. Verändere keine produktiven Datenstrukturen, bevor du die Auswirkungen auf vorhandene Daten und Synchronisierung verstanden hast.

---

# 2. Phase 1 — Vollständiger Audit der bestehenden App

## 2.1 Architektur und Codequalität
Untersuche: Projektstruktur und Frameworks; Abhängigkeiten und Paketversionen; Komponentenarchitektur; Routing und Navigation; Zustandsverwaltung; Datenmodelle und Datenflüsse; lokale Datenbank und Persistenz; Synchronisierung zwischen Geräten; Authentifizierung und Benutzerverwaltung; Offline-Verhalten und PWA-Funktionen; Fehlerbehandlung; Performance; Responsive Design; Accessibility; Sicherheitsrisiken; Build-, TypeScript-, Lint- und Testkonfiguration.

Identifiziere insbesondere: redundante Komponenten, doppelte Datenhaltung, widersprüchliche Berechnungslogik, veraltete oder ungenutzte Funktionen, unnötige Komplexität, mögliche Datenverluste, Race Conditions, fehlerhafte Datums- und Zeitzonenlogik, unzuverlässige Hintergrundprozesse, Probleme beim Wiederherstellen eines aktiven Workouts. Erstelle eine Übersicht mit Schweregrad, Auswirkungen und konkreter Lösung.

## 2.2 Audit aller Produktbereiche
Prüfe mindestens: Home/Dashboard; Trainingsprogramme; aktives Workout; Übungsbibliothek; Workout-Abschluss; Trainingshistorie; Fortschritt und Analytics; Ernährung; Kalorien und Makronährstoffe; Küche und Einkaufsliste; Wasser-Tracker; Tagesaufgaben; Einstellungen und Onboarding; Persistenz und Synchronisierung; App-Start und Loading Screen. Prüfe jeden Bereich auf funktionale Fehler, inkonsistente Daten, unnötige Interaktionen, fehlende Zustände und Verbesserungspotenzial.

## 2.3 Bestehende Funktionen erhalten
Erstelle eine Bestandsliste der vorhandenen Features und prüfe nach jeder größeren Änderung, ob sie weiterhin funktionieren. Wenn du Architekturänderungen empfiehlst, erkläre: welches konkrete Problem sie lösen, warum eine kleinere Änderung nicht ausreicht, welche Daten und Komponenten betroffen sind, welche Risiken bestehen, wie ein sicherer Übergang umgesetzt wird.

## 2.4 Audit-Ergebnis
Priorisierter Bericht: **P0 – Kritisch** (Datenverlust, Sicherheit, grundlegende Funktionsfehler) · **P1 – Hoch** · **P2 – Mittel** (UX, Performance, Wartbarkeit) · **P3 – Optional**. Nenne zu jedem Problem die betroffenen Dateien oder Komponenten. Führe anschließend die notwendigen Korrekturen durch, bevor du größere neue Features implementierst.

---

# 3. Phase 2 — Trainingskalender und Workout-Protokoll

## 3.1 Kalenderansicht
Integriere einen Trainingskalender in „Fortschritt“. Erkennbar: an welchen Tagen trainiert wurde, welche Workouts, welche Programmeinheit, wie viele Sätze, ob persönliche Rekorde erzielt wurden, besondere Trainingsereignisse, trainingsfreie Tage. Ein Trainingstag soll visuell von einem Tag ohne Training unterscheidbar sein – ruhig, ohne Streak-Logik. Kompakt, übersichtlich, mobilfreundlich; Monatsansicht mit Wochenansicht prüfen.

## 3.2 Tagesdetails
Beim Auswählen eines Tages: Datum, Workout-Name, Programm und Trainingstag, Dauer, Übungen, Sätze und Wiederholungen, Volumen, Gewichte, persönliche Rekorde, Muskelgruppen, besondere Ereignisse, eigene Notizen. Nur tatsächlich vorhandene Daten; ältere Workouts mit weniger Informationen korrekt darstellen, nichts erfinden.

## 3.3 Persönliche Rekorde
Definiere genau, was in FORM als PR gilt (höchstes Gewicht, beste Wiederholungsleistung bei einem Gewicht, geschätzte Maximalkraft nur gekennzeichnet, höchstes Volumen). Ein geschätzter Wert darf nicht als getestetes Gewicht dargestellt werden. Prüfe Übung und Variante, Gewicht, Wiederholungen, Satztyp, Bedingungen, historischen Vergleich. Vermeide falsche PRs durch Einheiten, veränderte Varianten oder unvollständige Daten. PRs sind Fortschritt gegen die eigene Vergangenheit – so auch formulieren.

---

# 4. Phase 3 — Intelligenter Workout-Abschluss

## 4.1 Sofortige Zusammenfassung
Abhängig von den Daten: Dauer, Übungen, Arbeitssätze, Wiederholungen, Volumen, PRs, Fortschritt gegenüber früheren Einheiten, Muskelgruppen, geschätzte Kalorien nur transparent gekennzeichnet. Die wichtigsten Kennzahlen schnell erfassbar; nicht überladen. Abschlusszeile laut Leitplanken: „48 Minuten, 5 Übungen, 18 Sätze. Das warst du.“

## 4.2 Besondere Ereignisse
Automatisch aus tatsächlichen Daten: neuer PR, mehr Wiederholungen als zuletzt, höheres Arbeitsgewicht, vollständig absolviertes Programm, erstmals absolvierte Übung, deutlich verändertes Volumen, eine vollständige Einheit nach längerer Pause (benennen, nicht bewerten). Keine generischen Erfolgsmeldungen ohne Datenbeleg.

## 4.3 Vergleich mit früheren Einheiten
Kurzer Vergleich bei vergleichbaren Daten (zwei zusätzliche Wiederholungen, 5 % mehr Volumen, neuer PR). Dieselbe Übung, dieselben Bedingungen; Abweichungen kennzeichnen.

## 4.4 Eigene Trainingsnotizen
Optionale kurze Notiz: Gefühl, Energie, Schwierigkeit, Beschwerden, Vorsatz für das nächste Mal. Optional, verlängert den Abschluss nicht.

## 4.5 Speichern und Fortsetzen
Der Abschluss gilt erst als gespeichert, wenn die Daten zuverlässig persistiert wurden. Kein Verlust, keine Doppelspeicherung bei Schließen oder Verbindungsverlust.

---

# 5. Phase 4 — Wochen- und Monatsrückblicke

## 5.1 Wochenrückblick
Am Ende der Woche oder auf Abruf: Einheiten, Dauer, Arbeitssätze, Volumen, PRs, Verteilung der Muskelgruppen, Entwicklung ausgewählter Übungen, Schritte, Ruhe- und Trainingstage. Vergleich mit der Vorwoche bei ausreichender Datenbasis. Formulierung: „Diese Woche 3 von 4.“ – kein „verpasst“.

## 5.2 Monatsrückblick
Längerfristige Entwicklungen: Einheiten, Häufigkeit, Volumen, Übungsentwicklung, PRs, Muskelgruppen, Körpergewicht, Schritte. Verständliche Trends statt nur Zahlen.

## 5.3 Qualität der Auswertung
Berücksichtige unterschiedliche Wochenlängen, fehlende Daten, Trainingspausen, Programmänderungen, Übungswechsel, unvollständige Einheiten. Unterscheide „keine Daten vorhanden“ von „keine Trainingseinheit erfasst“.

## 5.4 Darstellung
Dezente Diagramme in Akzentfarbe, eine Serie pro Diagramm, klare Vergleiche. Prüfe, ob Kalender, Wochen- und Monatsrückblick in einer gemeinsamen Struktur besser funktionieren.

---

# 6. Phase 5 — Muskelgruppen-Heatmap
Anatomische Vorder- und Rückansicht, auf der die beanspruchten Muskelgruppen hervorgehoben werden; hochwertig, modern, informativ.

**6.1 Ansichten:** Vorderansicht, Rückansicht, optional seitlich; Wechsel durch den Nutzer.
**6.2 Zeiträume:** aktuelles Training, Tag, Woche, Monat, individueller Zeitraum – aus den protokollierten Übungen.
**6.3 Muskelgruppen:** Brust; vordere, seitliche, hintere Schulter; Bizeps; Trizeps; Unterarme; oberer und mittlerer Rücken; Latissimus; unterer Rücken; Bauch; Gesäß; Quadrizeps; Beinbeuger; Waden. Zentrale, nachvollziehbare Zuordnung Übung → Muskelgruppen; Haupt- und unterstützende Muskeln getrennt; nicht alle beteiligten Muskeln gleich gewichten.
**6.4 Intensität:** transparente Berechnung aus Arbeitssätzen, primärer Zuordnung, sekundärer Beteiligung, tatsächlich absolvierten Sätzen, optional dokumentierter Intensität. Als geschätzte Trainingsverteilung kennzeichnen, nicht als Messung der Muskelaktivierung.
**6.5 Visuelle Qualität:** keine Tabelle mit Kästchen; klare anatomische SVG-Darstellung mit konsistenten Proportionen, unterscheidbaren Gruppen, dezenten Übergängen in der Akzentfarbe, nachvollziehbarer Skala und Legende. Nur rechtmäßig nutzbare Assets oder eine eigene SVG.

---

# 7. Phase 6 — Favoriten für Trainingsprogramme
Jedes geeignete Programm erhält eine Stern-Aktion; Zustand dauerhaft gespeichert, bleibt nach Reload erhalten; Symbol zeigt den Zustand eindeutig; Bedienung auf kleinen Displays. Prüfe die bestehende Struktur von „Meine Programme“ (eigene Programme, Vorlagen, abonnierte Programme) und integriere Favoriten ohne Verwechslung; bei Bedarf Unterteilung Meine Programme / Favoriten / Vorlagen. Keine redundanten Programmkopien; das Favorisieren verändert die Programmdefinition nicht.

---

# 8. Phase 7 — Apple Health, Apple Watch und WHOOP
**Untersuche zuerst die tatsächlich verfügbaren Integrationsmöglichkeiten.** Recherchiere anhand offizieller Dokumentation: Apple HealthKit, Apple Watch und Workout-Daten, WHOOP-API, Voraussetzungen für native iOS-Apps, Einschränkungen von Web-Apps und PWA, Berechtigungen, Datenverfügbarkeit, Hintergrundaktualisierung. Trenne klar: direkt verfügbar / nur mit nativer iOS-Komponente / über offizielle API / eingeschränkt / derzeit nicht zuverlässig. Keine fingierte Verbindung. Erwartetes Ergebnis dieser Phase ist eine Entscheidungsvorlage (native Hülle ja oder nein, mit Aufwand und Nutzen), keine fertige Integration, solange die App eine PWA ist.

**8.2 Mögliche Daten:** Aktivität (Schritte, Distanz, aktive Kalorien, Trainingsdauer und -art, Herzfrequenz, Ruheherzfrequenz); Regeneration (HRV, Schlafdauer und -phasen, Ruhepuls, Atemfrequenz); Körperdaten (Gewicht, Größe, Körperfett). Priorisiere Werte mit klarem Nutzen.
**8.3 Datenquellen transparent:** Herkunft je Wert (Apple Health, Apple Watch, WHOOP, manuell, FORM-Berechnung); Regel für die bevorzugte Quelle; keine doppelten Schritte, Workouts oder Kalorien.
**8.4 Datenschutz:** explizite Berechtigungen, Datenminimierung, transparente Herkunft, nachvollziehbare Synchronisierung, Deaktivierung möglich, keine unnötige Übertragung an externe Dienste oder KI-Dienste.

---

# 9. Phase 8 — Intelligente Kalorien- und Ernährungsanpassung
**9.1 Persönlicher Energiebedarf:** bestehendes Onboarding und Berechnung prüfen (Alter, Geschlecht beziehungsweise Formelangaben, Größe, Gewicht, Aktivitätsniveau, Trainingshäufigkeit, Ziel). Unterscheide Grundumsatz, Gesamtenergiebedarf, geplantes Ziel, tatsächliche Aufnahme, erfasste Aktivität; als Schätzungen kennzeichnen.
**9.2 Krafttraining und Kalorien:** tatsächliche Aktivitätsdaten nur mit Quelle, Datum, ohne Doppelübernahme; aktive von gesamten Kalorien trennen; ohne verlässliche Daten keine scheinbar exakte Zahl.
**9.3 Schritte und Alltagsaktivität:** Überschneidungen von Schritten, aktiven Kalorien und Trainingskalorien berücksichtigen; nicht einfach addieren.
**9.4 Keine unkontrollierte Veränderung:** optionales „Dynamisches Kalorienziel“ mit sichtbarem Basisziel, berücksichtigter Aktivität, Anpassung und Tagesziel; bei unzureichender Datenqualität keine Anpassung. Nie als Vorgabe eines Defizits (Leitplanke: deine Zahlen gehören dir).
**9.5 Makros und Mikronährstoffe:** Ziele passend zu Zielen und Kalorienziel; keine ungefragten Änderungen; Mikronährstoffe nur mit zuverlässigen Daten.

---

# 10. Phase 9 — Persönlicher Trainingscoach
**10.1 Progression erkennen:** Entwicklung jeder Übung über vergleichbare Einheiten (Gewicht, Wiederholungen, Arbeitssätze, Volumen, dokumentierte Schwierigkeit, Ausführungsqualität). Beispiel-Tonfall: „Du hast bei der Beinpresse in zwei vergleichbaren Einheiten alle Sätze mit 10 Wiederholungen geschafft. Wenn sich das kontrolliert angefühlt hat, kannst du beim nächsten Mal eine kleine Gewichtserhöhung ausprobieren.“
**10.2 Regeln:** etablierte Prinzipien aus zuverlässigen Quellen recherchieren (Double Progression, Wiederholungsbereiche, schrittweise Erhöhung, Volumen, Erholung, Anfänger versus Fortgeschrittene); transparente Regeln je Übung und Programm.
**10.3 Auslöser:** nicht allein ein beendeter Satz; prüfen, ob alle Arbeitssätze und der Wiederholungsbereich erreicht wurden, ob vergleichbare Einheiten vorliegen, ob Übung oder Ausführung geändert wurden, ob Beschwerden dokumentiert sind, ob die Progression im Programm sinnvoll ist. Bei fehlenden Informationen vorsichtig formulieren.
**10.4 Weitere Empfehlungen:** Gewichtserhöhung, Stagnation, Trainingshäufigkeit gegenüber Plan, wenig trainierte Muskelgruppen, Volumenänderungen, Pausen (benennen, nicht bewerten), Passung zu Zielen. Keine Warnungen aus normalen Schwankungen.
**10.5 Regenerationsdaten:** nur ergänzend; keine Diagnose. Tonfall: „Deine Erholungsdaten weichen von deinem üblichen Bereich ab. Wenn du dich heute müde fühlst, kann eine leichtere Einheit sinnvoll sein.“
**10.6 Erklärbarkeit:** jede Empfehlung erklärt Beobachtung, Daten, Begründung, konkrete Handlung; unterscheidet Beobachtung, Empfehlung, unsichere Schätzung. Keine generative KI als Voraussetzung für Berechnungen; erst transparente, testbare Logik.

---

# 11. Phase 10 — Onboarding und personalisierte Ziele
**11.1 Angaben:** Alter, Größe, Gewicht, Geschlecht beziehungsweise Formelangaben, Aktivitätsniveau, Trainingserfahrung, -häufigkeit, Hauptziel, Ernährungsziel, gewünschte Gewichtsentwicklung. Ziele: Abnehmen, halten, Zunehmen, Kraft, Routine aufbauen. Keine unnötig intimen Angaben; Zieldatum und Zielkörper sind keine Pflichtfelder (Leitplanke).
**11.2 Vorschläge:** Kalorienbedarf, Protein, Kohlenhydrate, Fett, Trainingshäufigkeit, Ausgangsniveau, geeignete Programme – nachvollziehbar, als Ausgangswerte gekennzeichnet.
**11.3 Nutzerkontrolle:** alle Ziele überprüfbar und änderbar; keine ungefragten Änderungen; vorhandene Daten bleiben; bestehende Profile nicht erneut durch das Onboarding führen – fehlende Angaben ergänzen.
**11.4 Geringe Reibung:** kurz, Standardwerte, optionale Angaben auslassbar. Die Onboarding-Sequenz mit Manifest-Auszug aus dem Textdokument (Abschnitt 3) ist der Rahmen; Zielabfrage danach.

---

# 12. Phase 11 — Adaptive Oberfläche (iPhone Duo)
Untersuche zuerst die tatsächlichen technischen Möglichkeiten des Geräts, Betriebssystems und Frameworks anhand verfügbarer Dokumentation; gehe nicht von unverifizierten APIs aus.
**12.1 Kompakter Zustand:** Navigation, Dashboard, Programme, Player, Eingaben, Diagramme, Historie vollständig bedienbar; kein horizontales Scrollen, keine abgeschnittenen Texte, keine zu kleinen Bedienelemente.
**12.2 Aufgeklappter Zustand:** größere Kalender, nebeneinander liegende Karten, zusätzliche Details, bessere Diagramme, breitere Tabellen, kombinierte Workout- und Detailansichten – der Platz verbessert die Übersicht, nicht nur die Größe.
**12.3 Übergänge:** aktives Workout, laufender Timer, eingegebene Werte, Dialoge, Scrollposition, ungespeicherte Änderungen überleben einen Wechsel der Fenstergröße.
**12.4 Progressive Enhancement:** ohne Faltzustands-API robuste responsive Breakpoints; keine fragilen Hacks.

---

# 13. Phase 12 — App-Start und Loading Screen
Bereits im Rebranding umgesetzt (Startbild Nacht mit Symbol). Hier nur verfeinern: dezente, kurze Übergangsanimation mit dem vorhandenen Symbol aus `public/brand/`, keine neue Logo-Variante, keine künstliche Wartezeit, reduzierte Bewegung respektieren, Zustand im Hintergrund laden, lokale Daten schnell sichtbar, Fehler verständlich. Nativen Launch Screen und In-App-Animation unterscheiden; nur umsetzen, was zur Plattform passt.

---

# 14. Phase 13 — Weitere sinnvolle Produktverbesserungen
Prüfe eigenständig: Verbindung von Training, Ernährung und Aktivität; personalisierte Trainingsziele; Regenerationsübersichten; langfristige Fortschrittsvisualisierung; bessere Historie; intelligente, sparsame Erinnerungen; Bedienung im Workout; Datenexport; Offline-Nutzung; Wiederherstellung unterbrochener Einheiten; Barrierefreiheit; Widgets und Schnellzugriffe; nachvollziehbare Wochenberichte. Bewerte nach Nutzervorteil, Komplexität, Datenabhängigkeiten, Risiko, Wartbarkeit, Datenschutz, Produktwert. Kategorien: **Must-have**, **Sinnvolle Erweiterung**, **Nicht empfohlen**. Setze nicht jede Idee um.

---

# 15. Phase 14 — Datenschutz, Sicherheit und Datenintegrität
Prüfe Zugriffskontrollen, Berechtigungen, Authentifizierung, Datenübertragung, lokale Speicherung, Synchronisierung, Fehlerbehandlung, Export, Löschfunktionen, Protokollierung sensibler Daten, Sicherheitslücken. Gesundheitsdaten nicht unnötig an externe Dienste. Bei Integrationen: offizielle Schnittstellen, dokumentierte Berechtigungen, nur erforderliche Daten, keine doppelten Importe, widerrufene Berechtigungen korrekt behandeln. Vorhandene Architektur vor neuer Infrastruktur prüfen.

---

# 16. Phase 15 — Technische Qualitätssicherung
**16.1 Automatisiert:** Build, TypeScript, Lint, Unit-, Integrations-, relevante E2E-Tests (inklusive WebKit) tatsächlich ausführen; eigene Fehler beheben; vorbestehende getrennt dokumentieren. Bundle-Grenze der Startansicht 250 KB.
**16.2 Funktional:** App öffnen und initialisieren; lokale Daten laden; Programm auswählen; Workout starten; Satz abschließen; Gewicht und Wiederholungen ändern; Resttimer; App schließen oder neu laden; Workout fortsetzen; abschließen; Zusammenfassung speichern; PR erkennen; Workout im Kalender finden; Wochen- und Monatsrückblick; Heatmap; Programm favorisieren; Favoriten nach Reload; Ernährungswerte; Aktivitätsdaten ohne Doppelzählung (sofern Integration); responsive Darstellung; Bildschirmzustand wechseln; Loading Screen und Fehlerzustände.
**16.3 Datenintegrität:** keine doppelten Workouts, verlorenen Sätze, falschen Volumina, falschen PRs, doppelten Kalorien, ungewollten Zieländerungen, überschriebenen Nutzerdaten, unkontrollierten Resets beim Tageswechsel.

---

# 17. Phase 16 — Umsetzung und Priorisierung (eine Phase je Sitzung)
**Phase A — Audit und kritische Fehler:** Repository analysieren, Implementierung verstehen, Fehler und Risiken dokumentieren, P0/P1 beheben, Tests ausführen. Ergebnis `audit-report.md`.
**Phase B — Trainingshistorie und Fortschritt:** Kalender, PR-Protokoll, Workout-Abschluss, Rückblicke, Heatmap.
**Phase C — Programme und Coach:** Favoriten, Progressionsempfehlungen, Trainingsregeln, Erklärungen.
**Phase D — Onboarding und Aktivitätsdaten:** Profil und Ziele, Kalorien- und Makroberechnung, Recherche der Health-Integrationen, Datenquellen und Importlogik, Entscheidungsvorlage native Hülle.
**Phase E — Mobile UX und App-Start:** adaptive Ansichten, iPhone-Duo-Konzept nach bestätigten Möglichkeiten, Loading-Screen-Verfeinerung, responsive Optimierungen.
**Phase F — Finaler Audit:** Regressionstests, Datenintegrität, Performance, Dokumentation, offene Probleme, nächste Prioritäten.

Reihenfolge anpassen, wenn Abhängigkeiten es erfordern; größere Abweichungen begründen. Zuerst sichere, klar abgegrenzte Verbesserungen; für riskante Architekturänderungen Migrations- und Rückfallplan.

---

# 18. Abschließender Bericht (je Phase)
**A. Audit-Ergebnisse** · **B. Tatsächlich vorgenommene Änderungen** (Dateien, Komponenten, Datenmodelle, Funktionen, Entferntes mit Begründung) · **C. Implementierte Features** (was, wie, welche Daten, welche Grenzen) · **D. Tests** (ausgeführt, Ergebnisse, behoben, nicht ausführbar) · **E. Integrationen** (Datenquellen, Schnittstellen, Berechtigungen, offen) · **F. Eigene Empfehlungen** (die fünf wertvollsten nächsten Verbesserungen nach Nutzen, Aufwand, Risiko) · **G. Offene Punkte** (unvollständig, nicht verifiziert, fehlende Daten, Einschränkungen, spätere Tests).

Behaupte niemals, etwas implementiert oder getestet zu haben, wenn dies nicht tatsächlich geschehen ist.

---

# 19. Abschließende Leitlinie
FORM soll sich zu einer hochwertigen, persönlichen Trainings- und Gesundheitsplattform entwickeln, die Training, Ernährung, Aktivität und langfristige Entwicklung sinnvoll miteinander verbindet – zuverlässig, schnell, verständlich, mit nachvollziehbaren Empfehlungen, verantwortungsvollem Umgang mit Daten, überzeugend auf allen Bildschirmgrößen, langfristig wartbar. **Deine Aufgabe ist nicht, möglichst viele Features hinzuzufügen. Deine Aufgabe ist es, FORM messbar besser zu machen.** Analysiere zuerst. Verstehe die vorhandene Implementierung. Identifiziere die wichtigsten Probleme. Entwickle eigene Verbesserungsvorschläge. Implementiere mit Bedacht. Bewahre Daten. Teste die Ergebnisse tatsächlich.
