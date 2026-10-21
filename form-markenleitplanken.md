# FORM · Markenleitplanken für die UI-Verfeinerung

Stand: 21.10.2026 · Gilt zusammen mit dem Briefing „Brand Identity & UI Refinement“ und vor den Konzeptbildern. Bei Widerspruch zwischen Konzeptbild und diesem Block gilt dieser Block. Grundlage: Markenstrategie FORM (Abschnitte 4, 6, 8, 10, 11) und die Logoentwürfe auf dem Canvas.

## 1. Die Marke in vier Sätzen

- FORM ist die Marke für den Wiederanfang, nicht für die Transformation. Kein Zielkörper, kein Zieltermin, keine Vorher-Nachher-Logik.
- FORM spricht wie ein Begleiter, der selbst schon einmal am Boden lag: ruhig, konkret, warm, ohne Druck. Nie Drill-Instructor, nie Cheerleader.
- Vier Werte, jeder mit Kosten: Ehrlichkeit (keine geschönten Zahlen), der nächste Schritt (das Kleinste, das heute geht), Grenzen (Pause ist Training), Zugehörigkeit (kein Ranking, keine Beschämung).
- Claims: FORM YOURSELF. / Werde die Person, die du sein möchtest. · GET BACK UP. / Steh wieder auf. Fang wieder an. · ONE STEP AT A TIME. / Ein Schritt nach dem anderen. · ERST ICH. DANN ALLES ANDERE. / Kümmere dich um dich selbst, bevor du dich in allem anderen verlierst. Grundgedanke dahinter: You can always rebuild.

## 2. Zehn Regeln

1. **Bestehendes Designsystem ist die Basis.** Dunkle Oberfläche, eine Akzentfarbe, vorhandene Tokens. Keine neue Palette, keine neuen Hex-Werte, keine neue Schrift, bevor die bestehenden dokumentiert und bewertet sind.
2. **Keine Streaks.** Kein Serien-Zähler, keine Flamme, keine „längste Serie“. Konsistenz wird als Wochenbild gezeigt („diese Woche 3 von 4“), nie als Kette, die reißen kann. D-284 bleibt: Tage ohne Eintrag zählen nicht als verfehlt.
3. **Kein Vergleich mit anderen.** Fortschritt immer gegen die eigene Vergangenheit. Keine Rankings, keine Bestenlisten, keine Durchschnittswerte anderer – auch nicht, wenn mehrere Nutzer kommen (Q-20).
4. **Produktsprache:** Deutsch, „du“, Verben statt Substantive, keine Ausrufezeichen, keine Emojis in Produkttexten. Gestrichen: Beast Mode, Grind, Winter Arc, Challenge dich, Bestform, Cheat Day, verbrennen, „Disziplin heute, Ergebnisse morgen“, „Starke Leistung!“. Englische Claims nur mit deutscher Unterzeile und nur an Markenstellen (Onboarding, Über die App), nie als Dekor in Karten.
5. **Zahlen gehören dem Nutzer.** Angezeigt wird, was er eingetragen oder gemessen hat. Keine Hochrechnung bis zum Zielgewicht, keine geschätzten Trainingskalorien ohne nachvollziehbare Grundlage, kein Kaloriendefizit als Standardziel, keine rote Markierung beim Überschreiten.
6. **Pause ist Training.** Ruhetage erscheinen als geplant, nicht als Lücke. Nach einer schweren Woche darf die App zum Weniger raten; sie fordert nie mehr ein.
7. **Eine Empfehlung pro Tag.** „Heute“ zeigt oben genau einen nächsten Schritt (das geplante Training oder die nächste fällige Aufgabe), darunter die Karten. Keine Liste offener Pflichten über dem Fold.
8. **Logo und Icon.** Aufrechtes Schritt-F (Entwürfe A–C auf dem Canvas), kein schräges Geschwindigkeits-F, keine Hantel, keine Flamme, kein Verlauf. Wortmarke FORM in Versalien, vorerst ohne Punkt. App-Icon: dunkle Kachel plus Monogramm, Akzentfarbe höchstens in einem Element.
9. **Bilder nur, wo sie erklären.** Übungsbild und Muskelgruppen ja; Stock-Hero-Bilder auf Programmkarten, Bergpanoramen und Farbverläufe als Dekor nein.
10. **Aus den Konzeptbildern übernehmen:** Screen-Struktur und Hierarchie, große ruhige Zahlen im Player und beim Abschluss, die Makro-Karte, die Kachel-Icons 01 Minimal / 02 Bold / 08 Monogram, die Tipp-Box bei Übungsdetails. **Nicht übernehmen:** Streak-Karte, Hustle-Zeilen, „TRAIN · FUEL · PROGRESS“, Gradient-Leiste, schräges F, Bildkarten, Emojis.

## 3. Der Rückkehr-Flow (neu, vor jedem weiteren Feature)

Der wichtigste Markenmoment im Produkt. Keine andere Fitness-App gestaltet ihn ernsthaft.

**Auslöser.** Erstes Öffnen von „Heute“ nach mindestens 14 Tagen ohne irgendeinen Eintrag (Training, Tagesaufgabe, Schritte, Ernährung, Wasser). Schwelle als Konstante, gleich dem Hinweis aus D-284.

**Verhalten.**
- Keine Zahl verpasster Tage, keine Rückstandsliste, keine rot markierten Aufgaben.
- Ein Sheet auf „Heute“, einmalig pro Rückkehr, jederzeit wegwischbar.
- Drei Optionen, alle gleichwertig gestaltet, keine ist die „richtige“:
  - *Ein Spaziergang* → schließt das Sheet und hebt die Schritte-Karte hervor.
  - *Ein leichtes Training* → öffnet das geplante Training mit dem Hinweis „Weniger Sätze sind heute in Ordnung“. Keine Änderung an Plan oder Trainingslogik, nur der Hinweis.
  - *Nur reinschauen* → schließt das Sheet, sonst nichts.
- Pausierte Aufgaben bleiben pausiert. Fällige Aufgaben erscheinen wie an jedem anderen Tag.
- In Verlauf und Fortschritt wird die Lücke als „Pause“ beschriftet, nicht als Null-Balken.
- Optionaler Push nach 21 Tagen, höchstens einmal: „Drei Wochen Pause. Das kommt vor. Ein kurzer Spaziergang heute?“ Kein zweiter Push.

**Texte (final, nicht umformulieren).**
- Titel: „Schön, dass du da bist.“
- Text: „Eine Pause gehört dazu. Was ist dir heute möglich?“
- Knöpfe: „Ein Spaziergang“ · „Ein leichtes Training“ · „Nur reinschauen“
- Hinweis im Training: „Weniger Sätze sind heute in Ordnung.“

**Nachweis.** E2E mit `page.clock`: 14+ Tage ohne Eintrag erzeugen, Sheet erscheint genau einmal, jede Option führt zum beschriebenen Zustand, kein Text nennt die Anzahl der Tage. Entscheidung als D-Nummer in `decisions.md`.

## 4. Mikrotexte (Kopiervorlage)

| Situation | So nicht | So FORM |
| --- | --- | --- |
| Erster Start | Willkommen auf deiner Transformationsreise! | Schön, dass du da bist. Wo fangen wir an? |
| Rückkehr nach Pause | Du hast deinen Streak verloren. Jetzt durchstarten! | Eine Pause gehört dazu. Was ist dir heute möglich? |
| Training beendet | Starke Leistung! 💪 | 48 Minuten, 5 Übungen, 18 Sätze. Das warst du. |
| Ziel erreicht | Du bist eine Maschine! | 10.000 Schritte. Das warst du. |
| Nutzer überzieht | Push harder! | Das war viel heute. Morgen darf leichter sein. |
| Woche abgeschlossen | 7-Tage-Serie! Weiter so! | Diese Woche 3 von 4. |
| Neues Programm | Verbrenne Fett in 30 Tagen | Vier Wochen, dreimal pro Woche, 20 Minuten. Mehr nicht. |
| Leerer Zustand | Noch keine Daten | Hier erscheint dein erstes Training. |
| Ruhetag | Kein Training geplant | Heute ist Pause eingeplant. |

## 5. Prüffragen vor dem Merge

- [ ] Gibt es irgendwo einen Serien-Zähler, eine Flamme oder „in Folge“? → raus
- [ ] Steht ein Ausrufezeichen oder Emoji in einem Produkttext? → raus
- [ ] Zeigt ein Screen einen Vergleich mit anderen Menschen? → raus
- [ ] Beschämt ein Text eine Pause oder einen verpassten Tag? → umformulieren
- [ ] Hat jede angezeigte Zahl eine Grundlage, die der Nutzer selbst geliefert hat? → sonst entfernen
- [ ] Ist das F aufrecht, die Wortmarke ohne Punkt, die Akzentfarbe nur in einem Element? → sonst korrigieren
- [ ] Funktioniert der Rückkehr-Flow im E2E ohne Nennung der Tage? → sonst nicht mergen
