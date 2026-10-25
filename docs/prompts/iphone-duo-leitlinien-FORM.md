# FORM · iPhone Duo – Adaptive UX & Responsive Design

> **Stand:** FORM ist live, die Phase Stabilität ist gemergt (PR #50). Diese Sitzung arbeitet auf einem eigenen Branch `form-duo` von `main` mit Entwurfs-PR für die CI; gemergt wird nach meiner Freigabe. Keine Nachkontrollen planen.
>
> **Vorbemerkung für diese Sitzung (gilt vor allem anderen).** Die App ist seit dem Rebranding FORM: nur Dunkel, Farben und Maße aus `brand-tokens.md`, Regeln aus `CLAUDE.md` und `form-markenleitplanken.md`. Die schwebende Tab-Leiste mit dunklem Glas, Linse und dem Schrumpfen zum runden Button bleibt im schmalen Zustand; für den breiten Zustand darf geprüft werden, ob eine seitliche Navigation einen klaren Vorteil bringt – sonst bleibt sie. Im Workout-Player einen Platz für die Übungsdemonstration vorsehen (die Bilder kommen in einer späteren Sitzung), ohne jetzt Bilder einzubauen. Startansicht bleibt unter 250 KB (aktuell 234,3 KB); mehrspaltige Layouts und ihre Komponenten werden nachgeladen, nicht ins Startbündel gelegt. Dieser Prompt ersetzt Kapitel 12 aus `docs/prompts/audit-FORM.md`.

## 1. Deine Aufgabe
Optimiere die bestehende FORM-App gezielt für die Nutzung auf dem iPhone Duo – sowohl im zugeklappten Zustand mit dem äußeren Display als auch im aufgeklappten Zustand mit dem größeren inneren Display. Du agierst als Senior Mobile UX Designer, Responsive UI Engineer und Frontend Architect. Das Ziel ist nicht, die bestehende Oberfläche lediglich größer oder kleiner zu skalieren. FORM soll sich in beiden Zuständen wie eine bewusst für das jeweilige Display gestaltete, hochwertige App anfühlen.

**Analysiere zuerst die vorhandene Codebasis, das Framework, die Navigation und die bestehenden Komponenten. Implementiere die Optimierungen direkt in der bestehenden App. Baue keine separate App und dupliziere nicht unnötig die Komponenten.** Bewahre die bestehende visuelle Identität, die Funktionen, die gespeicherten Daten und die Architektur von FORM.

## 2. Zuerst die tatsächliche technische Grundlage prüfen
Untersuche: welches Framework die App verwendet; ob es sich um eine Web-App, PWA, native iOS-App oder eine andere Architektur handelt; welche Responsive- und Layoutmechanismen bereits vorhanden sind; welche Bildschirmgrößen, Viewports und Breakpoints aktuell unterstützt werden; ob das Zielgerät tatsächlich über auswertbare Zustandsinformationen für zugeklapptes und aufgeklapptes Display verfügt; welche offiziellen APIs und Layoutmöglichkeiten für das konkrete Gerät und Framework verfügbar sind. Recherchiere bei Bedarf die offizielle Dokumentation. Erfinde keine gerätespezifischen APIs und gehe nicht davon aus, dass eine spezielle Fold-State-Erkennung verfügbar ist. Falls keine zuverlässige Erkennung des Gerätezustands möglich ist, implementiere ein robustes adaptives Layout anhand der tatsächlich verfügbaren Fensterbreite und des Viewports. Vermeide fragile gerätespezifische Hacks.

## 3. Designprinzipien
Dieselbe visuelle Identität in beiden Zuständen. Behalte Farben und Design-Tokens, Typografie, Abstände und Radien, Karten und Bedienelemente, Icons, Animationen, Navigationslogik und den Dark Mode. Die Optimierung konzentriert sich auf Layout, Informationshierarchie, Lesbarkeit und Bedienbarkeit – minimalistisch, hochwertig, modern, intuitiv. Vermeide unnötig große leere Flächen, überdimensionierte Karten, zu kleine Schrift, abgeschnittene Inhalte, horizontales Scrollen ohne Mehrwert, doppelte Navigationsleisten, unnötig viele Spalten, unruhige Layoutwechsel und schwer erreichbare Bedienelemente.

## 4. Äußeres Display (zugeklappt)
Prüfe sämtliche zentralen Screens: Home/Dashboard, Trainingsübersicht, Programm-Details, aktiver Workout-Player, Übungsbibliothek, Workout-Abschluss, Trainingskalender, Fortschritt und Analytics, Ernährung und Makros, Küche und Einkaufsliste, Wasser-Tracker, Tagesaufgaben, Einstellungen und Onboarding.
Anforderungen: alle wichtigen Informationen ohne abgeschnittene Inhalte; primäre Aktionen gut erreichbar; Schrift lesbar; Karten passen sich der Breite an; Diagramme bleiben verständlich; Formulare und Eingabefelder laufen nicht aus dem Bildschirm; Dialoge und Menüs vollständig sichtbar; Navigation übersichtlich. Einspaltige Layouts, wo sinnvoll; sekundäre Informationen gegebenenfalls kompakt zusammenfassen, ohne Funktionen zu entfernen.

## 5. Inneres Display (aufgeklappt)
Mehr als eine vergrößerte Version. Prüfe, wo zusätzliche Breite einen Mehrwert erzeugt: Zwei- oder Mehrspaltenlayouts, größere Kalender, Diagramme neben Kennzahlen, Trainingsdetails neben Übungslisten, kompaktere Übungsbibliothek mit mehr Informationen, Makros und Mahlzeiten nebeneinander, zusammengehörige Fortschrittskennzahlen, klar strukturiertes Dashboard.
Layoutregeln: sinnvolle maximale Inhaltsbreite; keine endlos breiten Bereiche; responsive Grid- und Flexbox-Layouts; Schriftgrößen nicht pauschal vergrößern; Platz für relevante Informationen statt Dekoration; klare Hierarchie; Zusammengehöriges beieinander. Für jeden Screen individuell entscheiden: ein-, zwei- oder mehrspaltig.

## 6. Aktiver Workout-Player (besonders wichtig)
**Zugeklappt** priorisieren: aktuelle Übung, Platz für die visuelle Übungsanleitung, aktueller Satz, Gewicht und Wiederholungen, vorherige Leistungswerte, Resttimer, Aktion zum Abschließen des Satzes, Gesamtfortschritt – ohne unnötiges Scrollen; Sekundäres ausklappbar.
**Aufgeklappt** prüfen, ob sich kombinieren lassen: Übung und Visualisierung, Eingabe von Gewicht und Wiederholungen, bisherige Sätze, vorherige Leistungswerte, Resttimer, Fortschritt, nächste Übungen – die Fläche verbessert die Bedienung, nicht die Informationsmenge.
**Zustandswechsel:** aktives Workout bleibt erhalten, aktueller Satz bleibt ausgewählt, eingegebene Werte bleiben, Resttimer läuft korrekt weiter, Scrollposition möglichst erhalten, keine Aktion doppelt, kein Neustart. Gezielt testen.

## 7. Navigation und Interaktionen
Schmal kompakt und gut bedienbar; breit prüfen, ob zusätzliche Navigations- oder Kontextinformationen sinnvoll sind. Navigationsstruktur nur mit klarem Vorteil ändern; alle Funktionen in beiden Zuständen erreichbar; nach dem Aufklappen keine andere Informationsstruktur.

## 8. Charts, Kalender und Datenvisualisierungen
Prüfe Beschriftungen und Achsen, Legenden, Touch-Ziele, Tooltip-Positionen, Kalenderzellen, Diagrammproportionen, Tabellenbreiten, Scrollverhalten. Schmal vereinfachen, ohne entscheidende Informationen zu verlieren; breit zusätzliche Details, wenn sie das Verständnis verbessern. Keine überfüllten Diagramme, keine zu kleinen Beschriftungen.

## 9. Touch-Bedienung und Accessibility
Ausreichend große interaktive Flächen, genug Abstand, lesbare Texte, sichtbare Zustände, Tastaturbedienung wo relevant, reduzierte Bewegung respektieren, keine rein farbbasierten Statusinformationen. Einhandbedienung im zugeklappten Zustand besonders beachten.

## 10. Technische Umsetzung
Gemeinsame responsive Architektur: vorhandene Komponenten, CSS Grid und Flexbox, vorhandene Tokens, zentrale Breakpoints, wiederverwendbare Layout-Komponenten, zustandsunabhängige Geschäftslogik. Vermeide getrennte Implementierungen, doppelte Datenhaltung, unnötige Frameworks, harte gerätespezifische Pixelwerte und Sonderfälle in jeder Komponente. Wo eine unterschiedliche Darstellung nötig ist: gemeinsame Daten- und Geschäftslogik mit passenden responsiven Präsentationskomponenten.

## 11. Tests und Qualitätssicherung
Alle zentralen Screens in mindestens drei Layoutklassen: schmal (äußeres Display), breit (aufgeklappt), Zwischenbereich (Wechsel von einer auf mehrere Spalten). Echte Gerätemessungen oder offizielle Spezifikationen verwenden; sonst Viewport-Annahmen dokumentieren. Insbesondere testen: Navigation, Workout-Player, Satz- und Gewichtseingaben, Resttimer, Kalender, Diagramme, Modals und Dialoge, Tastatureingaben, Scrollpositionen, Wechsel der Fenstergröße, Erhalt des App-Zustands, Laden und Speichern. Vorhandene Tests, Build, TypeScript und Lint ausführen; eigene Fehler beheben; Einschränkungen ehrlich dokumentieren.

## 12. Eigenständige Verbesserungsvorschläge
Über die Vorgaben hinausdenken (kompakte Workout-Steuerung zugeklappt, umfassendere Analyse aufgeklappt, nebeneinander angeordnete Übungsdetails, effizientere Eingabe bei langen Trainings, bessere Kalender- und Fortschrittsansichten, adaptive Navigation). Bewerten nach Nutzervorteil, Komplexität, Wartbarkeit; einteilen in hoher Mehrwert, optionale spätere Erweiterung, unnötige Komplexität.

## 13. Abschlussbericht
Analysierte Screens und Komponenten; gefundene Layoutprobleme; geänderte Dateien; implementierte responsive Layouts; Verhalten schmal und breit; tatsächlich ausgeführte Tests; behobene Probleme; bestehende Einschränkungen; empfohlene Verbesserungen. Nicht behaupten, auf dem echten Gerät getestet zu haben, wenn nur Browser-Viewports verwendet wurden.

## Abschließende Leitlinie
FORM soll auf dem iPhone Duo in beiden Zuständen wie eine durchdachte, hochwertige App wirken. Zugeklappt: Übersicht, Geschwindigkeit, einfache Bedienung. Aufgeklappt: zusätzliche Übersicht, bessere Datenvisualisierung, effizientere Abläufe. **Analysiere zuerst, entwickle eine klare responsive Strategie, implementiere sie in der vorhandenen Architektur, teste sorgfältig, bewahre Funktionen und Daten.**
