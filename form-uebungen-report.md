# FORM · Bericht zur Phase Übungen

Stand: 27.10.2026, Abschnitt 0 und Phase 1 abgeschlossen, Entscheidung über die Quelle der Visuals offen (Q-24) · Branch `form-uebungen`, Entwurfs-PR [darad11/fitness-app#53](https://github.com/darad11/fitness-app/pull/53) · Auftrag `docs/prompts/uebungen-FORM.md`, verbindliche Leitlinien `docs/prompts/uebungen-leitlinien-FORM.md` · Entscheidungen D-395 bis D-399

Getestet in Browser-Fenstern (Chromium in dieser Umgebung, WebKit in GitHub Actions), nicht am Gerät. Visuals gibt es noch keine; in den Bildern mit „prototyp“ kommt ein Rohentwurf nur im Test dazu.

## 1. Abschnitt 0 – Vorab

| Punkt | Ergebnis |
|---|---|
| CI auf `main` zum Merge `25a3553` | Lauf 40475256640: alle vier Jobs grün (Lint, Typen, Unit, Dokumente, Build; Datenbank; E2E Chromium; E2E WebKit) |
| Nachtrag Duo | Gerätetest bestanden, eingetragen in `docs/testing.md`, `form-duo-report.md` Abschnitt 15 und in der Beschreibung von PR #52 (D-395) |
| Platz in der Startansicht | 244,7 → 237,0 KB (Ziel höchstens 238 KB), ohne neue Abhängigkeit und ohne Funktion zu entfernen (D-396): Die Skripte im Kopf werden beim Bauen verkleinert (`startflaeche.js` 4,9 → 1,7 KB, `theme-init.js` 1,6 → 0,8 KB), `index.html` ohne Kommentare (5,8 → 5,4 KB), Glas-Linse und Kreis der Tab-Leiste werden nachgeladen (rund 3,5 KB). Nebenbei gefunden und verhindert: Die verkleinerten Skripte standen zweimal mit verschiedenen Prüfsummen im Service Worker; `check-precache` prüft das jetzt |
| Nach Phase 1 | 237,7 KB. Alles Neue (Komponenten, Texte, Daten, Bilder) wird nachgeladen. Die 0,7 KB mehr sind drei Lade-Einträge in der Modulschnittstelle und die neuen Tailwind-Klassen im gemeinsamen CSS |

## 2. Bestandsaufnahme

Volle Tabelle mit allen 124 Übungen (Schlüssel und ID, deutscher und englischer Name, Gerät, Haupt- und Nebenmuskeln, Varianten, Visual, Ausführung, Hinweis zur Quelle): `docs/uebungen-bestand.md`, erzeugt aus den Daten der App, geprüft in `pnpm check:docs`.

| Gruppe | Übungen | mit Visual | Ausführung fertig | Ausführung offen |
|---|---|---|---|---|
| Brust | 12 | 0 | 12 | 0 |
| Rücken | 17 | 0 | 16 | 1 |
| Schultern | 12 | 0 | 12 | 0 |
| Bizeps und Unterarme | 11 | 0 | 11 | 0 |
| Trizeps | 11 | 0 | 10 | 1 |
| Rumpf | 16 | 0 | 12 | 4 |
| Gesäß | 9 | 0 | 7 | 2 |
| Oberschenkel vorne | 11 | 0 | 7 | 4 |
| Oberschenkel hinten | 7 | 0 | 7 | 0 |
| Waden, Adduktoren, Abduktoren | 7 | 0 | 6 | 1 |
| Ganzkörper und Kondition | 11 | 0 | 11 | 0 |
| **Summe** | **124** | **0** | **111** | **13** |

- Die früher genannten rund 105 Übungen sind die aus Q-05; mit Programm C (D-248) sind es 124.
- Im Projekt gab es bisher kein einziges Übungsbild. Je Übung gibt es nur deinen persönlichen Videolink.
- Jede Übung hat einen dauerhaften Schlüssel und daraus eine feste ID. Visuals und Texte hängen an diesem Schlüssel, nie am Namen.
- Varianten: Jede Gerätevariante ist eine eigene Übung (zum Beispiel Schulterdrücken mit Langhantel stehend und mit Kurzhanteln sitzend); Bild und Text gehören deshalb immer zur genauen Variante.

## 3. Gerüst

- **Datenstruktur:** `public/uebungen/medien.json`, je Schlüssel Vorschaubild, Demonstration (Animation mit ruhendem Bild, stummes Video mit Standbild, zwei Phasen oder ein Bild), Alternativtext und Quelle mit Lizenz und Namensnennung. In Phase 1 leer. Der Service Worker speichert die Liste vorab, die Bilder selbst erst beim ersten Anzeigen.
- **Listen:** Vorschaubild links neben dem Namen in Übungsbibliothek und Suche, Übungsauswahl (Freies Training, Ersetzen), Alternativen, Programmvorlagen, Trainingstag bearbeiten; kleiner in „Als Nächstes“, in der Zusammenfassung und in den Übungskarten des Players. Dort erst ab 30 rem Breite: Schmal (Duo zugeklappt, iPhone) zeigt „Jetzt“ die aktuelle Übung, und der erste Satz bleibt über der Fußleiste.
- **Player:** aufgeklappt die große Demonstration im vorbereiteten Platz der rechten Spalte, zugeklappt und am iPhone kompakt rechts in der Karte „Jetzt“, der Text fließt darum. „Satz erledigt“ bleibt unten erreichbar. Die Demonstration gehört zur aktuellen Übung und wird je Übung neu aufgebaut; aktuelle und nächste Übung werden vorgeladen.
- **Verknüpfung:** Antippen der Demonstration öffnet die Übungsinfo mit Kurzfassung der Ausführung und „Alle Angaben zur Übung“ (das Training läuft weiter).
- **Übungsdetails:** Demonstration oben, neuer erster Reiter „Ausführung“.
- **Solange ein Visual fehlt:** das bisherige Symbol (Hantel) in der Kachel, groß mit den Muskel-Etiketten. Kein leerer Kasten, nichts, das wie eine Demonstration aussieht. Ebenso, wenn eine Datei nicht lädt oder die Liste fehlt.

Bilder (`docs/screens/uebungen/`, Übersicht `uebersicht.png`, erzeugt mit `node tools/uebungen-screens.mjs`):

| Ansicht | So wird es ausgeliefert | Mit Rohentwurf (nur Test) |
|---|---|---|
| Übungsliste, iPhone | `rueckfall-liste.png` | `prototyp-liste.png` |
| Player, iPhone | `rueckfall-player-iphone.png` | `prototyp-player-iphone.png` |
| Player, Duo zugeklappt | `rueckfall-player-zugeklappt.png` | `prototyp-player-zugeklappt.png` |
| Player, Duo aufgeklappt | `rueckfall-player-aufgeklappt.png` | `prototyp-player-aufgeklappt.png` |
| Übungsinfo im Player | `rueckfall-player-info.png` | `prototyp-player-info.png` |
| Übungsdetails | `rueckfall-details.png`, `rueckfall-details-ausfuehrung.png` | `prototyp-details.png` |

## 4. Ausführungstexte

- **111 von 124 fertig**, je Übung eigens geschrieben, mit 1 bis 3 Quellen (ExRx.net, ACE Exercise Library, vereinzelt NASM) und Abrufdatum. Wo die Quelle eine nahe Variante beschreibt oder ein Punkt abgeleitet ist, steht das bei 46 Übungen offen dabei, in der App unter den Quellen.
- **Aufbau:** kurze Beschreibung, Ausgangsposition, Schritt für Schritt, Technik (Bewegungsumfang, Tempo), häufige Fehler (nur, wenn eine Quelle sie nennt), Sicherheit, Quellen. Darunter: „Allgemeine Hinweise zur Technik, keine persönliche oder medizinische Empfehlung. Wenn etwas schmerzt, hör auf und lass dich beraten.“
- **Recherche:** Das Netz dieser Sitzung öffnet Fachseiten nicht direkt; die Inhalte kamen über die Websuche, eingeschränkt auf die Fachseiten. Die Texte sind in eigenen Worten.
- **13 offen**, in der App mit „Für diese Übung gibt es noch keine belegte Beschreibung der Ausführung.“:
  - ohne passende Quelle (4): Rudern mit Kurzhanteln, vorgebeugt (beidarmig im Stand); Trizepsdrücken am Kabel, über Kreuz; Heel Taps; Pull-Throughs am Kabel.
  - noch nicht recherchiert, weil das Kontingent der Websuche dieser Sitzung aufgebraucht war (9): Sit-ups, Windshield Wipers, Knieheben stehend, Hip Thrust mit Langhantel, Beinpresse, Hackenschmidt-Kniebeuge, Bulgarische Kniebeuge mit Kurzhanteln, Ausfallschritte mit Kurzhanteln, Seitliches Gehen mit Widerstandsband. Hip Thrust und Beinpresse kommen in den Vorlagen vor; sie hole ich in Phase 2 zuerst nach.
- **Noch nicht da:** eigens ausgewählte „einfachere Alternativen“ je Übung. Der Reiter „Alternativen“ zeigt wie bisher passende Übungen nach Muskeln und Gerät.

## 5. Quellenvorschlag für die Visuals

Vergleich und Begründung: `docs/uebungen-quellen.md`.

| Quelle | Abdeckung | Stil | Lizenz | Bewertung |
|---|---|---|---|---|
| Eigener FORM-Stil (Figur im Code, zwei Phasen) | 100 % | einheitlich, dunkle Fläche, Tokens | eigenes Werk | **Empfehlung** |
| Everkinetic | rund 60 bis 70 % | Strichzeichnung, zwei Phasen, SVG | CC BY-SA 4.0, Namensnennung | Zweitwahl |
| wger | unbekannt | gemischt, oft Fotos | je Bild verschieden | nur Einzelfälle |
| free-exercise-db | rund 80 bis 85 % | Fotos von Personen | ungeklärt | ausschließen |
| ExerciseDB / AscendAPI | hoch | 3D-GIFs | Abo, Speichern verboten | ausschließen |
| MuscleWiki, Gym Visual, Stock, LottieFiles | – | – | nicht geprüft | offen |

**Empfehlung: eigener FORM-Stil.** Einziger Weg, der alle Vorgaben zugleich erfüllt: ein Stil für alle 124 Übungen, keine Fotos, keine fremden Logos, keine Lizenzpflichten, offline und klein, dezente Bewegung durch zwei Phasen im Wechsel. Gegen das Hauptrisiko, eine falsch gezeichnete Bewegung: Pose nach dem belegten Text, Prüfseite mit allen Posenpaaren zur Freigabe je Gruppe, Cardiogeräte als ruhendes Bild. Der Rohentwurf für Kniebeuge und Bankdrücken zeigt Stil und Wirkung; Hände, Griff und Winkel sind darin noch grob.

Nicht geprüft (Kontingent der Websuche aufgebraucht): MuscleWiki, Gym Visual, WorkoutLabs, Stock-Anbieter, LottieFiles, Mixamo, KI-Generatoren. Keine Lizenz abgeschlossen, nichts gekauft.

## 6. Tests

Ergebnisse wörtlich in `docs/testing.md`, Abschnitte „Platz in der Startansicht“ und „Phase Übungen, Phase 1“.

- Unit: `media.test.ts` (Liste, Zuordnung über den Schlüssel, Rückfall, Vorausladen, Texte: jede Übung genau einmal, nur Fachseiten, keine Doppelungen, Leitplanken), `exercise-visual.test.tsx` (Symbol, Bild, Ladefehler, Wechsel ohne falsches Bild, weniger Bewegung, Video stumm), `player-demo.test.tsx` (Demonstration folgt der aktuellen Übung, Abhaken ändert nichts, Vorausladen aktuelle und nächste Übung, Info mit Ausführung).
- E2E: `e2e/uebungen.spec.ts` (Liste mit und ohne Visuals, fehlende Datei, Player zugeklappt und aufgeklappt, Wechsel und Zurück, Neuladen im Training, Details mit Quellen, offene Übung).
- Offline mit echten Bildern, Workout-Abschluss mit Bildern und die Breiten des Duo mit echten Visuals folgen in Phase 2, wenn es Dateien gibt.

## 7. Beobachtungen und Grenzen

- Nach der CI behoben: In WebKit schob das Vorschaubild in der Übungskarte zugeklappt den ersten Satz unter die Fußleiste. Jetzt steht er wie ohne Vorschaubilder (gemessen gegen `main`).
- Die Texte stützen sich auf Zusammenfassungen der Websuche, nicht auf die geöffnete Seite. Die Adressen stehen dabei; ein Abgleich mit der Seite selbst ist in einer Umgebung mit offenem Netz möglich.
- Die Regel des Service Workers für Bilder (bei Bedarf speichern) ist gesetzt, aber erst mit echten Dateien in Phase 2 geprüft.

## 8. Was ich von dir brauche

1. **Q-24:** Quelle der Visuals. Meine Empfehlung: eigener FORM-Stil.
2. Ob ich die 9 noch nicht recherchierten Texte in Phase 2 nachholen soll (Empfehlung: ja, zuerst Hip Thrust und Beinpresse).
