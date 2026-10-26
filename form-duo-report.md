# FORM · Bericht zur Phase iPhone Duo

Stand: 26.10.2026, Phase 2 abgeschlossen · Branch `form-duo`, Entwurfs-PR [darad11/fitness-app#52](https://github.com/darad11/fitness-app/pull/52) · Auftrag `docs/prompts/iphone-duo-FORM.md`, verbindliche Leitlinien `docs/prompts/iphone-duo-leitlinien-FORM.md` · Entscheidungen ab D-370

Getestet wurde in Browser-Fenstern mit den Maßen des iPhone Duo (Chromium in dieser Umgebung, WebKit in GitHub Actions). Auf dem echten Gerät ist nichts getestet; was nur dort prüfbar ist, steht in der Liste für den Gerätetest.

## 1. Auftrag und Reihenfolge

Phase 1: Gerätemaße recherchieren, alle Screens der Leitlinien (Kapitel 4) in drei Breiten prüfen, Fehler sofort beheben (Barcode-Scanner, Tab-Leiste, Verluste beim Auf- und Zuklappen, weitere Funde), Layout-Verbesserungen bewerten, dann stoppen. Phase 2 (Layouts) erst nach Freigabe. Vorher geprüft: CI-Lauf 40223344366 auf `main` (`dd27315`) mit allen vier Jobs grün (D-370).

Phase 2, freigegeben am 26.10.2026: Workout-Player für beide Zustände, Ernährung aufgeklappt zweispaltig, Erklärung der Kalorien im Fortschritt (Abschnitt 9); danach die Bilder in drei Breiten erneuert, die Liste für deinen Gerätetest ergänzt (Abschnitt 6) und dieser Bericht abgeschlossen (Abschnitt 10, nach Kapitel 13 der Leitlinien). Die Tab-Leiste bleibt.

## 2. Gerät: Maße zugeklappt und aufgeklappt (D-371)

### 2.1 Was offiziell feststeht

| Quelle | Aussage |
|---|---|
| Apple, Human Interface Guidelines „Designing for iPhone Duo“ (neu am 9.9.2026, `developer.apple.com/design/human-interface-guidelines/designing-for-iphone-duo`, hier gelesen am 25.10.2026) | Zwei Displays, jedes mit eigener Frontkamera; Scharnier in der Mitte. Das äußere Display ist breiter und kürzer als bei anderen iPhones. Dort legt das System Statusleiste, Dynamic Island, Werkzeugleiste und Tab-Leiste an die Seite (hintere Kante), damit oben und unten Platz für Inhalt bleibt. Aufgeklappt quer bleiben die Leisten an der Seite, „at the same vertical height“; nur aufgeklappt hoch gibt es waagrechte Leisten. Die äußere Kamera sitzt in der Ecke und ist immer sichtbar. Halb aufgeklappt teilt die Faltzone das innere Display. Empfehlung: Größenklassen statt Layouts je Haltung, keine festen Breiten, sichere Bereiche beachten, beim Falten nur das Nötige verschieben. |
| WebKit, „WebKit Features for Safari 27.1“ (`webkit.org/blog/18486`) | Breite des Viewports in Safari 27.1 je nach Haltung 382 bis 951 CSS-Pixel, Höhe 368 bis 902. Äußeres Display hoch: 382 breit, Inhalt nur neben den Safari-Leisten an der Seite; quer: 594 breit (SVH 368, LVH 406). Inneres Display quer mit einem Tab: 951 breit. Device Posture API und Viewport Segments API nur als Entwicklervorschau hinter Feature-Flags. |
| Apple, technische Daten (regionale Seiten) | Inneres Display 7,6 Zoll (als Rechteck 19,26 cm), 1878 × 2670 Pixel, 430 ppi; äußeres Display 5,4 Zoll (als Rechteck 13,62 cm). |

Die Seiten von `apple.com`, `support.apple.com` und `webkit.org` sperrt die Netzwerkregel dieser Umgebung. Die Angaben von WebKit und den technischen Daten stammen deshalb aus Suchergebnissen, die diese Seiten wiedergeben; die Seite von Apple zu den Leitlinien war direkt lesbar.

### 2.2 Nicht offiziell, nur aus Messungen Dritter

- Äußeres Display: 1398 × 2034 Pixel, 460 ppi (MacObserver, MacRumors), also 466 × 678 pt; die Web-Ansicht in Safari ist 466 pt breit, das Layout 382, weil rechts die Safari-Leisten stehen.
- Sicherer Bereich des äußeren Displays: oben 0, rechts 84, unten 34 pt (safearea.info, als „noch nicht geprüft“ markiert).
- Gemessen in Safari (innerWidth × innerHeight, ein Artikel, mit KI-Hilfe geschrieben): zugeklappt 382 × 580, aufgeklappt hoch 669 × 825, aufgeklappt quer 951 × 543.

### 2.3 Zustand erkennen

Eine Web-App erfährt den Klappzustand nicht verlässlich: Device Posture API und Viewport Segments API stecken in Safari 27.1 hinter Feature-Flags, die normale Nutzer nicht einschalten. FORM richtet sich deshalb nur nach der Breite des Fensters (CSS-Breakpoints und Container-Abfragen) und erfindet keine Geräte-Schnittstelle. Auf- und Zuklappen ist für die App eine Größenänderung des Fensters.

### 2.4 Prüfmaße (Annahmen)

| Name | Haltung | Fenster in pt | Sicherer Bereich in pt (Annahme) | Breakpoint der App |
|---|---|---|---|---|
| zugeklappt | äußeres Display hoch | 466 × 678 (Home-Bildschirm-App) | rechts 84, unten 34 | unter `sm` (40 rem) |
| Zwischenmaß | inneres Display hoch (Gerät gedreht) | 669 × 951 | oben 24, unten 20 | `sm` bis `md` |
| aufgeklappt | inneres Display quer (so, wie man es aufklappt) | 951 × 669 | rechts 84, unten 20 | `md` bis `lg` |

Begründung: FORM läuft als App vom Home-Bildschirm, ohne Safari-Leisten; dann reicht die Seite dank `viewport-fit=cover` unter die Systemleiste an der Seite, und der sichere Bereich meldet ihre Breite. Für den rechten Rand gibt es nur die eine Zahl von 84 pt; sie gilt in den Tests für beide Displays. Die übrigen Werte sind geschätzt (oben wie die Statusleiste eines iPad, unten wie der Home-Balken). Ist der echte Rand schmaler, bleibt mehr Platz, weil die App den gemeldeten Wert nimmt und keine feste Zahl. Zusätzlich geprüft: 382 × 640 (Safari zugeklappt) und 594 × 368 (zugeklappt quer, die niedrigste Haltung).

In allen drei Haltungen ist das Fenster schmaler als 64 rem (1024 px): Es gilt überall die Tab-Leiste, nie die Seitenleiste. Chromium kann den sicheren Bereich über die Entwicklerschnittstelle (`Emulation.setSafeAreaInsetsOverride`) nachstellen; WebKit in Playwright kann das nicht. Die Tests dazu laufen deshalb nur in Chromium; die Prüfmaße liegen in `e2e/duo.ts`.

## 3. Behobene Fehler

Jeder behobene Fehler hat einen Test, der am alten Stand fehlschlägt (Gegenprobe: Test gegen den alten Quellstand gebaut und ausgeführt).

### 3.1 Tab-Leiste, Blätter und Dialoge unter dem Systemrand (D-372)

- **Befund:** Zugeklappt (466 pt, rechts 84 pt Systemrand) reichte die Tab-Leiste bis x = 454; „Mehr“ lag von 361 bis 446 und damit zum größten Teil im Systemrand, der Kreis beim Scrollen ganz (398 bis 454). Aufgeklappt (951 pt) lag der Kreis bei 883 bis 939, der Systemrand beginnt bei 867. Im Scanner lagen „Schließen“ (414 bis 458) und der rechte Teil von Kamerabild und Rahmen im Systemrand; das sichtbare Bild war deshalb nicht mittig, der Rahmen rechts angeschnitten.
- **Ursache:** Die Seiten halten den sicheren Bereich ein (`page-gutters`), die festen Elemente nicht. Am iPhone hoch ist der seitliche Rand 0, deshalb fiel das bisher nicht auf. Beim Duo liegen Statusleiste, Dynamic Island und Kamera an der Seite.
- **Lösung:** Tab-Leiste, Blätter, Rückfragen, Hinweise, große Pause, Anmeldung und „Meine Küche“ beachten den sicheren Bereich links und rechts. Der Kreis der Tab-Leiste rückt mit, weil er am Innenrand gemessen wird.
- **Test:** `e2e/duo-safe-area.spec.ts`, 3 Tests (Chromium, Handy-Profil): am alten Stand 3 von 3 fehlgeschlagen (446 statt höchstens 382,5; 939 statt höchstens 867,5; 458 statt höchstens 382,5), mit der Korrektur 3 von 3 bestanden.
- **Nur am Gerät prüfbar:** wie breit der Systemrand einer App vom Home-Bildschirm wirklich ist und ob Tipps direkt daneben sicher ankommen.

### 3.2 Tab-Leiste: Auswahl und Linse nach einer Größenänderung (D-373)

- **Befund 1:** Zugeklappt auf „Ernährung“ runterscrollen (Kreis), aufklappen, hochscrollen: Die Auswahl stand bei 314 bis 393, der aktive Tab bei 387 bis 492. Die Leiste sah verschoben aus und „bewegte sich nicht wie vorgesehen“.
- **Ursache 1:** Die Auswahl wurde beim Fenster-Ereignis `resize` gesetzt, bevor `tabMinimize` den Kreis neu vermaß; sie nahm die Breiten der alten Fenstergröße und wurde danach nicht mehr korrigiert.
- **Befund 2 (Audit E-15, bisher „nicht verifiziert“):** Tipp auf den Kreis und gleich danach ein zweiter Tipp, während die Leiste aufgeht; danach von „Heute“ zu „Fortschritt“ ziehen: Gewählt wurde „Mehr“, die Linse hing bis zu 120 px hinter dem Finger.
- **Ursache 2:** Die Linse maß ihre Maße einmal und verwarf sie nur beim Fenster-Ereignis `resize`; beim Aufgehen aus dem Kreis maß sie Zwischenmaße.
- **Lösung:** Die Auswahl folgt jeder Größenänderung der Einträge (`ResizeObserver`), ohne zu gleiten. Die Linse misst bei jeder Berührung neu und während einer Geste bei jeder Größenänderung der Leiste.
- **Test:** `e2e/duo-tabbar.spec.ts`, 2 Tests (Chromium und WebKit, Handy-Profil): am alten Stand 2 von 2 fehlgeschlagen (Auswahl 69 px daneben; Ziehen endete auf `/mehr`), mit der Korrektur 2 von 2 bestanden; die bisherigen Tests der Tab-Leiste bestehen weiter.
- **Nur am Gerät prüfbar:** ob iOS beim Auf- und Zuklappen weitere Zwischengrößen meldet; die Leiste misst jetzt nach jeder davon neu.

### 3.3 Barcode-Scanner: Bild, Rahmen und Erkennung (D-374)

Untersucht wurden Ausrichtung und Drehung des Videos, Seitenverhältnis und `object-fit`, die Lage des Rahmens, die Zuordnung des Erkennungsbereichs und das Verhalten beim Auf- und Zuklappen und Drehen. Aufnahmen vom Gerät lagen nicht bei.

- **Befund 1 (behoben mit D-372):** Zugeklappt lagen der rechte Teil von Kamerabild und Rahmen und „Schließen“ unter dem Systemrand; das sichtbare Bild war nicht mittig.
- **Befund 2:** Erkannt wurde im ganzen Kamerabild, auch im Teil, den `object-fit: cover` abschneidet. Am iPhone hoch liefert die Kamera ein hohes Bild, der Kasten ist 4 : 3 quer: Oben und unten fehlen je rund ein Fünftel. Ein Code dort wurde erkannt, obwohl man ihn nicht sieht; der Rahmen hatte für die Erkennung keine Bedeutung.
- **Befund 3:** Zugeklappt quer (594 × 368 pt) blieb der Kasten 4 : 3; Bild und Rahmen lagen unterhalb des sichtbaren Bereichs (Unterkante bei 562 px).
- **Lösung:** Erkannt wird nur der sichtbare Ausschnitt um den Rahmen: das Band des Rahmens mit je der halben Rahmenhöhe darüber und darunter, in voller sichtbarer Breite. Der Ausschnitt wird bei jedem Durchgang (alle 250 ms) aus den aktuellen Maßen berechnet, also auch nach Auf- und Zuklappen und Drehen (`calc/scanRegion.ts`). Der Kasten ist höchstens 45 % der Fensterhöhe hoch, der Rahmen steht mittig darin.
- **Test:** `scanRegion.test.ts` (8 Tests); `e2e/duo-scanner.spec.ts`, `duo-scanner-mitte.spec.ts`, `duo-scanner-lage.spec.ts` mit einem Standbild als Kamera (EAN-13 an gewählter Stelle, `e2e/fakeCamera.ts`). Am alten Stand 2 von 5 fehlgeschlagen (unsichtbarer Code erkannt; quer Unterkante 561,7 statt höchstens 368); die drei Gegenkontrollen „Code im Rahmen wird erkannt“ (zugeklappt, aufgeklappt, quer) bestehen am alten und am neuen Stand. Mit der Korrektur 5 von 5 bestanden, die bisherigen Scanner-Tests ebenso.
- **Nur am Gerät prüfbar:** ob Safari das Kamerabild auf dem inneren Display aufrecht zeigt (aufgeklappt hält man das Gerät wie zugeklappt, das System meldet aber Querformat); ob ein echter Code im Rahmen in beiden Zuständen erkannt wird.

### 3.4 Auf- und Zuklappen: Training, Werte, Dialoge, Leseposition (D-375)

- **Geprüft im laufenden Training** (Größenwechsel zugeklappt → aufgeklappt → Zwischenmaß → zugeklappt): dieselbe Einheit, derselbe ausgewählte Satz, der eingetippte Wert, das offene Menü des Satzes, der Pausen-Timer (läuft weiter, beginnt nicht neu), ein offener Dialog mit getipptem Text, die Zahl der Sätze (keine Aktion doppelt) und die Lage des aktuellen Satzes. Alles blieb erhalten, schon am alten Stand: Blätter und Dialoge sind ein Element mit Breakpoints in CSS, nichts wird beim Größenwechsel neu aufgebaut; die Pause rechnet mit dem gespeicherten Endzeitpunkt.
- **Befund:** Auf Seiten mit Text verrutschte die Leseposition. Beim Aufklappen bricht Text anders um, die Seite wird kürzer, die Scrollposition in Pixeln bleibt. Auf „Heute“ und „Programme und Vorlagen“ stand das Element der Leselinie danach 182 bis 193 px höher, teils oberhalb des Bildschirms. WebKit kennt keine Scroll-Verankerung, Chromium setzt sie bei Breitenänderungen aus.
- **Lösung:** `ScrollManager` merkt sich beim Scrollen das Element auf der Leselinie (ein Viertel der Fensterhöhe) und stellt es nach jeder Größenänderung wieder an dieselbe Stelle. Es bleibt der Bezug, bis du selbst scrollst; so führt Auf- und wieder Zuklappen genau zurück. Ganz oben bleibt die Seite oben.
- **Test:** `e2e/duo-resize.spec.ts`, 3 Tests (Chromium und WebKit, Handy-Profil): Leseposition auf zwei Seiten am alten Stand 2 von 2 fehlgeschlagen (Abweichung 182,4 und 192,7 px), mit der Korrektur bestanden, auch in drei Wiederholungen; der Trainingstest besteht am alten und am neuen Stand.
- **Nur am Gerät prüfbar:** ob iOS die App beim Auf- und Zuklappen neu lädt. Dann gingen nicht gespeicherte Zustände verloren (offene Dialoge, Scrollposition); Training, Sätze und Pause liegen ohnehin in der Datenbank.

### 3.5 Linse bleibt nach Loslassen außerhalb der Leiste stehen (D-376)

- **Befund:** Beim Wiederholen des Tests zu 3.2 blieb die Linse in einem von drei Läufen sichtbar stehen. Ein Tipp fängt den Zeiger nicht, sonst ginge der Klick auf den Tab verloren. Glitt die Leiste beim Aufgehen unter dem Zeiger weg, kam das Loslassen nie bei ihr an.
- **Lösung:** Während eines Drucks hört die Linse auch am Fenster auf das Loslassen; außerhalb der Leiste gilt es als Abbruch.
- **Test:** `e2e/duo-tabbar.spec.ts` „Loslassen außerhalb der Leiste beendet die Linse“: am alten Stand fehlgeschlagen (Linse blieb aktiv), mit der Korrektur bestanden.

### 3.6 Weitere Funde der Prüfung in drei Breiten (D-377)

Gefunden bei der Prüfung aller Screens in drei Breiten (Bilder, Messungen und axe je Screen).

- **Kopf im Training:** Zugeklappt endete der klebende Kopf 64 pt vor dem Fensterrand, „Beenden“ und der Titel standen 64 pt weiter links als der Inhalt der Seite, die Trennlinie hörte vor dem Rand auf. Ursache: Der Kopf reichte nur um den Seitenrand über den Inhalt hinaus, nicht um den Systemrand. Jetzt bis an den Fensterrand, der Inhalt bündig (neue Hilfsklasse `page-bleed`).
- **Mahlzeit beim Hinzufügen:** Aufgeklappt hoch (669 pt) war die Auswahl der Mahlzeit 58 px breit, von „Snacks“ blieb das „S“. Jetzt stehen Auswahl und Knöpfe erst ab 768 px nebeneinander, die Auswahl ist dann mindestens 160 px breit.
- **„Meine Küche“ aufgeklappt:** Bei 669 pt Höhe lag das Menü teils unter der Tab-Leiste; „Rezepte“ ließ sich nicht tippen. Jetzt rollt das Menü beim Öffnen ganz ins Bild.
- **Namen für Screenreader und Sprachsteuerung (WCAG 2.5.3):** In den Zeilen der Tagesaufgaben, der Auswertung „Je Aufgabe“, der Ernährung und der Gewichtseinträge enthielt der vorgelesene Name den sichtbaren Text nur zum Teil; axe meldete das, sobald Daten da sind. Jetzt besteht der Name aus dem sichtbaren Namen und einem unsichtbaren Rest („Lesen bearbeiten“, „Lesen – Auswertung öffnen“, „Skyr Natur von Spar bearbeiten“), Rhythmus, Quote, Menge und Kalorien werden als Beschreibung mit vorgelesen (erledigt Audit D-08).
- **Wochentage im Kalender:** 10 px, jetzt 11 px.
- **Pause, ±15 s:** Zugeklappt (vor der Korrektur des Kopfs) und bei 320 pt war die Pause so schmal, dass die Symbole Minus und Plus auf 0 px schrumpften; zu sehen war zweimal „15 s“. Jetzt bleiben die Symbole 16 px breit, die Chips haben weniger Innenabstand.
- **Test:** `e2e/duo-funde.spec.ts`, 6 Tests (Handy-Profil; der Kopf nur in Chromium): am alten Stand 6 von 6 fehlgeschlagen (Kopf endete bei 402 statt am Rand 466; Auswahl 57,75 px bei 640 px; „Rezepte“ verdeckt; axe mit Verstößen gegen `label-content-name-mismatch`; Wochentage 10 px; Minus-Symbol 0 px), mit der Korrektur 6 von 6 bestanden. Dazu `src/shared/ui/name-rest.test.tsx` (4 Tests) und Name samt Beschreibung eines Eintrags mit Marke in `nutrition-ui.test.tsx`.
- **Unterwegs bemerkt und vor dem Commit behoben:** Ein versteckter Namensteil in abgeschnittenem Text (Auswertung „Je Aufgabe“) lag hinter dem Zeilenende und machte die Seite bei 320 px um 77 px breiter; der bestehende Test „kleiner Bildschirm, nichts ragt über den Rand“ schlug an. Der versteckte Teil steht jetzt als eigenes Kind des Links.

### 3.7 Satzzeile: lange Werte abgeschnitten (D-378)

- **Befund:** Beim Messen für die Bewertung: „102,5“ passte zugeklappt nicht ins Feld für kg (Feld 57 px, Wert rund 59 px bei 18 px Schrift), in Safari zugeklappt (382 pt) und auf normalen iPhones noch weniger (390 pt: 51 px, 375 pt: 44 px). Zu sehen war „102,“.
- **Ursache:** Die Zeile hat feste Spalten (Satz, Vorwert, erledigt, Menü) und 8 px Abstand; für die beiden Felder blieb zu wenig.
- **Lösung:** Die Satzzeilen richten sich nach ihrer eigenen Breite. Unter 24 rem werden Abstände und Vorwert-Spalte etwas schmaler, und Werte ab fünf Zeichen stehen in 16 statt 18 px. Kleiner nicht, sonst vergrößert iOS die Seite beim Antippen. Aufgeklappt bleibt alles, wie es war.
- **Test:** `e2e/duo-funde.spec.ts` „Satzzeile: „102,5“ passt ins Feld …“ (390 pt und zugeklappt; bei 382 pt nur die kleinere Schrift, weil das Passen dort von der Schriftart abhängt): am alten Stand fehlgeschlagen (10 px über den Rand bei 390 pt), mit der Korrektur bestanden.
- **Schriftart:** Gemessen mit Inter, ähnlich breit wie die Systemschrift des iPhone. Mit einer breiteren Schrift (DejaVu Sans) fehlen bei 382 und 375 pt 0,6 und 3,6 px; das zeigt der Gerätetest.
- **Offen:** Bei 360 pt ragt „102,5“ weiter 7 px hinaus, bei 320 pt (iPhone SE oder mini mit Anzeigezoom „Größerer Text“) sind die Felder nur 25 px breit. Das braucht eine zweite Zeile in der Satzzeile und ist eine Layout-Entscheidung; sie kommt in die Bewertung der Layout-Verbesserungen. Erledigt in Phase 2 mit D-380 (Abschnitt 9.1), auch die Frage der Schriftart bei 382 und 375 pt.

## 4. Prüfung aller Screens in drei Breiten (D-379)

### 4.1 Vorgehen

- **Werkzeug:** `tools/duo-screens.mjs` öffnet in Chromium 28 Ansichten in den drei Prüfmaßen aus Abschnitt 2.4: zugeklappt 466 × 678 pt (rechts 84 pt Systemrand), Zwischenmaß 669 × 951 (inneres Display hoch), aufgeklappt 951 × 669 (rechts 84 pt). Mit Testdaten: Tagesziel und zwei Mahlzeiten, Wasser, fünf Gewichtsmessungen, zwei Tagesaufgaben, Einkaufsliste, aktives Programm mit laufendem Training und Pause. Das laufende Training wechselt dabei die Größe wie beim Auf- und Zuklappen.
- **Je Ansicht automatisch geprüft:** waagrechter Überlauf, Bedienelemente und Text unter dem Systemrand, Bedienelemente übereinander, abgeschnittener Text, Schrift unter 11 px, gestauchte Symbole, Tippflächen unter 44 × 44 pt (Hinweis) und Barrierefreiheit mit axe (WCAG 2.1 AA). Dazu jedes Bild angesehen.
- **Ergebnis im Repository:** 84 Bilder in `docs/screens/duo/` (je Ansicht und Breite), das Übersichtsbild `docs/screens/duo/uebersicht-duo.png` und die Befunde `docs/screens/duo/befunde.json`. Neu erzeugen: `pnpm build`, `pnpm preview`, dann `node tools/duo-screens.mjs`.
- **Grenzen:** Browser-Fenster mit den Maßen des Duo, nicht das Gerät; Chromium statt Safari; der sichere Bereich ist nachgestellt. Halb aufgeklappt (Falz) sehen Web-Apps nicht, das ist nicht geprüft. Die Tooltips der Diagramme sind nicht einzeln geprüft; Recharts hält sie im Zeichenbereich, und der liegt im Inhalt.

### 4.2 Screens aus Kapitel 4 der Leitlinien

| Screen | Ansichten (Bilder) | Ergebnis |
|---|---|---|
| Home und Dashboard | `erster-start`, `heute`, `tab-leiste-kreis` | in Ordnung; ab 768 pt Ernährung und Wasser nebeneinander |
| Trainingsübersicht | `training` | in Ordnung |
| Programm-Details | `programme`, `programm-details` | in Ordnung |
| Aktiver Workout-Player | `training-aktiv`, `training-pause-gross`, `dialog-verwerfen` | behoben: große Pause neben dem Systemrand (D-372), nichts geht beim Größenwechsel verloren (D-375), Kopf und ±15 s (D-377), Satzzeile (D-378). Aufgeklappt ist ohne Scrollen nur eine Satzzeile ganz zu sehen, siehe Abschnitt 5 |
| Übungsbibliothek | `uebungen` | in Ordnung |
| Workout-Abschluss | `abschluss` | in Ordnung |
| Trainingskalender | – | gibt es in der App noch nicht (TH-03 „später“). Geprüft stattdessen der Verlauf (`verlauf`) und der Kalender einer Tagesaufgabe (`aufgabe-kalender`) |
| Fortschritt und Analytics | `fortschritt`, `gewicht`, `uebung-verlauf` | in Ordnung; die Kachel „Kalorien“ ist durch ihre Erklärung viel höher als die anderen, siehe Abschnitt 5 |
| Ernährung und Makros | `ernaehrung`, `hinzufuegen`, `blatt-schnelleintrag`, `scanner` | behoben: Scanner (D-374), Auswahl der Mahlzeit und Namen der Einträge (D-377). Aufgeklappt füllt der Ring den ersten Bildschirm, siehe Abschnitt 5 |
| Küche und Einkaufsliste | `blatt-kueche`, `einkaufsliste` | behoben: „Meine Küche“ neben dem Systemrand (D-372) und über der Tab-Leiste (D-377) |
| Wasser-Tracker | `wasser`, `wasser-verlauf` | in Ordnung |
| Tagesaufgaben | `aufgaben`, `aufgabe-kalender` | behoben: Namen der Zeilen und Wochentage 11 px (D-377). Die Tageszahl im Kalender bleibt 10 px (siehe 4.3) |
| Einstellungen | `mehr`, `einstellungen` | in Ordnung |
| Onboarding | `erster-start`, `anmeldung` | in Ordnung; „Später“ neben dem Systemrand (D-372) |

Nach Phase 2: Player, Ernährung und Fortschritt sind umgestellt (Abschnitt 9); die Bilder in `docs/screens/duo/` zeigen den Stand nach Phase 2.

### 4.3 Ergebnis je Prüfpunkt (Kapitel 3 bis 9)

- **Lesbarkeit:** Keine Schrift unter 11 px außer der Tageszahl im Kalender einer Tagesaufgabe: 10 px in einer 16-px-Markierung, so entschieden mit D-334; das Datum steht im Namen der Zelle. Wochentage jetzt 11 px (D-377), lange Werte im Training ganz lesbar (D-378).
- **Abgeschnittene Inhalte:** kein waagrechter Überlauf, kein abgeschnittener Text. Behoben: Kopf im Training (D-377), Auswahl der Mahlzeit (D-377), Werte in der Satzzeile (D-378).
- **Diagramme und Kalender:** Beschriftungen ab 11 px, Diagramme nutzen die Breite. Der Kalender einer Aufgabe bleibt auch aufgeklappt 7 × 28 pt breit, siehe Abschnitt 5.
- **Dialoge und Blätter:** ganz sichtbar und neben dem Systemrand (D-372); „Meine Küche“ über der Tab-Leiste (D-377); der Scanner auch zugeklappt quer (594 × 368, D-374).
- **Touch-Ziele:** Alle Bedienelemente haben mindestens 44 × 44 pt Tippfläche. Die 7 Hinweise betreffen die Wochentag-Chips (44 × 36 pt sichtbar); ihre Tippfläche reicht über einen unsichtbaren Rand auf 44 pt (D-314).
- **Einhandbedienung zugeklappt:** Tab-Leiste, „Satz erledigt“ und Blätter liegen unten, Rückfragen in der Mitte. Oben und damit für den Daumen weit weg: „Zurück“ (wie in iOS) und im Training die Pause mit „Überspringen“ und ±15 s. Ob sich „Mehr“ direkt neben dem Systemrand gut tippen lässt, zeigt erst das Gerät.
- **Barrierefreiheit:** axe ohne Verstöße in allen 84 Ansichten (im ersten Lauf 16 Verstöße gegen „Label in Name“, behoben mit D-377). Zustände nicht nur über Farbe (Markierungen mit Haken, Rand, Strich; D-334).

### 4.4 Automatische Befunde

| Lauf | Ansichten | Befunde |
|---|---|---|
| Erster Lauf, vor D-377 | 84 | 16 × axe `label-content-name-mismatch`, 27 × Schrift unter 11 px, 7 Hinweise Tippfläche; dazu aus den Bildern die Funde in Abschnitt 3.6 und 3.7 |
| Nach D-377 und D-378 | 84 | 3 × Schrift unter 11 px (Tageszahl im Kalender, bewusst), 7 Hinweise Tippfläche (Wochentag-Chips, siehe 4.3); sonst nichts |
| Nach Phase 2 (D-383) | 84 | wie nach D-378: 3 × Schrift unter 11 px (Tageszahl im Kalender, bewusst), 7 Hinweise Tippfläche; kein Überlauf, nichts unter dem Systemrand, keine Überlagerung, kein abgeschnittener Text, axe ohne Verstöße |

## 5. Bewertung der Layout-Verbesserungen (Kapitel 5, 7, 8 und 12)

Gemessen mit laufendem Training und Pause (Chromium, Prüfmaße aus Abschnitt 2.4):

- **Player aufgeklappt (951 × 669):** Kopf mit Pause 264 pt, Fußleiste 97 pt. Für Übung und Sätze bleiben 284 pt; ganz zu sehen ist eine Satzzeile. Die Felder für kg und Wdh. sind je 298 pt breit.
- **Player zugeklappt (466 × 678):** Kopf mit Pause 274 pt, Fußleiste 111 pt, für Übung und Sätze 269 pt; ganz zu sehen ist eine Satzzeile.
- **Player im Zwischenmaß (669 × 951):** 542 pt für Übung und Sätze, fünf Satzzeilen.
- **Ernährung:** Die erste Mahlzeit beginnt aufgeklappt bei 619 von 669 pt, zugeklappt bei 639 von 678 pt, also hinter der Tab-Leiste. Zu sehen ist nur der Ring mit den Makros. Im Zwischenmaß beginnt sie bei 643 von 951 pt.

| Screen | Vorschlag | Nutzen | Aufwand | Risiko | Einteilung |
|---|---|---|---|---|---|
| Aktiver Workout-Player, aufgeklappt | Zwei Spalten ab 48 rem: links Übungen und Sätze, rechts mitlaufend Pause mit ±15 s, nächster Satz, Fortschritt und der Platz für die Übungsdemonstration (bleibt leer, bis es Bilder gibt) | hoch: statt einer Satzzeile die ganze Höhe für Sätze; Pause und nächster Satz immer sichtbar; Felder nicht mehr 298 pt breit | mittel: Anordnung in CSS um die vorhandenen Teile, keine neue Logik, mit dem Player nachgeladen | mittel: wichtigster Screen; beim Auf- und Zuklappen darf nichts neu aufgebaut werden, die Tests aus D-375 prüfen das | lohnt sich |
| Aktiver Workout-Player, zugeklappt | Pause im Kopf einzeilig (Zeit, nächster Satz, Überspringen), ±15 s in der großen Pause | mittel: rund 60 pt mehr für Sätze, eine Satzzeile mehr; Kapitel 6 verlangt „Sekundäres ausklappbar“ | klein | klein bis mittel: ±15 s ist einen Tipp weiter | lohnt sich |
| Satzzeile bei 320 und 360 pt | Vorwert in einer zweiten Zeile, wenn die Zeile schmaler als 20 rem ist | mittel: bei 320 pt (iPhone SE oder mini mit Anzeigezoom) sind die Felder 25 pt breit; das Duo betrifft es nicht | klein | klein | lohnt sich (mit dem Player) |
| Ernährung, aufgeklappt | Zwei Spalten ab 48 rem: links Ring, Makros und weitere Nährwerte, rechts die Mahlzeiten | hoch: Mahlzeiten und Hinzufügen sofort sichtbar, ohne Scrollen | mittel | klein: nur die Anordnung, Daten und Logik bleiben | lohnt sich |
| Fortschritt, alle Breiten | Erklärung der Kalorien-Schätzung unter die Kacheln statt in die Kachel | mittel: Kacheln gleich hoch, weniger leere Fläche, auch zugeklappt | klein | klein | lohnt sich |
| Fortschritt, aufgeklappt | Körpergewicht und Bestleistungen neben den Kennzahlen | mittel: mehr auf einen Blick; die Seite wird seltener geöffnet | mittel | klein | später |
| Programme | Liste links, Details rechts | mittel: Programme vergleichen ohne Seitenwechsel | hoch: Auswahl und Zurück je nach Breite anders | mittel bis hoch: beim Auf- und Zuklappen wechselt die Struktur (Kapitel 7: keine andere Informationsstruktur) | später |
| Programm-Details | Beschreibung und „Training starten“ links, Wochen und Tage rechts | mittel | klein bis mittel | klein | später |
| Tagesaufgaben | Liste links, Auswertung rechts | mittel | klein bis mittel | klein | später |
| Kalender einer Tagesaufgabe | aufgeklappt größere Zellen (40 statt 28 pt), Tageszahl 11 statt 10 px | klein bis mittel | klein | klein | später |
| Navigation, aufgeklappt | Seitenleiste wie ab 1024 pt statt der schwebenden Tab-Leiste | mittel: aufgeklappt ist die Höhe knapp, die Tab-Leiste liegt über rund 80 pt Inhalt | mittel: Umbruchpunkt für breit und niedrig | mittel: zwei Navigationsarten wechseln beim Auf- und Zuklappen; laut Leitlinien nur mit klarem Vorteil | später, nach deinem Gerätetest |
| Heute | – (ab 768 pt schon zweispaltig) | – | – | – | unnötig |
| Trainingsübersicht | Bühne links, Einstiege rechts | klein | klein | klein | unnötig |
| Übungsbibliothek | Liste zweispaltig | klein: Gruppen nach Muskel lesen sich einspaltig besser; Suche und Filter stehen schon nebeneinander | klein | klein | unnötig |
| Workout-Abschluss, Wasser, Küche und Einkaufsliste, Einstellungen, Anmeldung | – | klein: einspaltig gut lesbar, Felder der Einstellungen schon nebeneinander | – | – | unnötig |

### 5.1 Empfehlung

Für Phase 2 empfehle ich drei Pakete, in dieser Reihenfolge:

1. **Workout-Player:** aufgeklappt zwei Spalten mit dem Platz für die Übungsdemonstration; zugeklappt die einzeilige Pause; die Satzzeile mit zweiter Zeile auf sehr schmalen Bildschirmen. Größter Gewinn, und Kapitel 6 der Leitlinien verlangt beides.
2. **Ernährung aufgeklappt zweispaltig:** Ring links, Mahlzeiten rechts.
3. **Fortschritt:** Erklärung der Kalorien unter die Kacheln (klein, hilft in allen Breiten).

Alles andere später oder gar nicht. Die schwebende Tab-Leiste bleibt; ob aufgeklappt eine Seitenleiste besser ist, entscheiden wir nach deinem Gerätetest.

So würde ich es umsetzen (Kapitel 10): dieselben Komponenten, nur in CSS-Rastern angeordnet, an den vorhandenen Umbruchpunkten (48 rem). Nichts wird je nach Breite ein- oder ausgeblendet und neu aufgebaut; so bleibt beim Auf- und Zuklappen der Zustand erhalten. Player und Ernährung werden schon heute nachgeladen; die neuen Layouts kommen in diese Teile, die Startansicht bleibt bei 235,5 KB. Tests in den drei Breiten wie in Phase 1, Bilder neu.

Umgesetzt in Phase 2 (Freigabe vom 26.10.2026: alle drei Pakete, ohne leeren Platzhalter für die Übungsdemonstration): Abschnitt 9.

## 6. Liste für deinen Gerätetest am iPhone Duo

Am besten an der Vorschau des Branches (Vercel, Link im PR: `fitness-app-git-form-duo-dr-b21f.vercel.app`), als App vom Home-Bildschirm und einmal im Safari-Tab. Mit Testdaten, nicht mit echten Daten. Punkte 10 bis 15 sind neu aus Phase 2.

1. **Systemrand an der Seite (D-372):** Zugeklappt und aufgeklappt: Liegt etwas unter Statusleiste, Dynamic Island oder Kamera? Tab-Leiste, „Mehr“, der Kreis beim Scrollen, „Schließen“ in Blättern und im Scanner, Hinweise unten. Lässt sich „Mehr“ direkt neben dem Systemrand sicher tippen?
2. **Tab-Leiste (D-373, D-376):** In beiden Zuständen runterscrollen (Kreis), hochscrollen (Leiste geht auf), die Linse über die Tabs ziehen, jeden Tab einmal tippen. Dann im Kreis-Zustand auf- und zuklappen und wieder hochscrollen: Steht die Auswahl unter dem aktiven Tab?
3. **Auf- und Zuklappen im Training (D-375):** Training starten, einen Wert tippen, Satz erledigen (Pause läuft), Menü eines Satzes öffnen, dann auf- und zuklappen: Training, Wert, Satz, Menü und Pause bleiben, die Pause zählt richtig weiter. Lädt iOS die App beim Auf- oder Zuklappen neu? Wenn ja, bitte notieren.
4. **Leseposition (D-375):** Auf „Heute“ und „Programme und Vorlagen“ in die Mitte scrollen, auf- und zuklappen: Bleibt derselbe Inhalt sichtbar?
5. **Barcode-Scanner (D-374):** Zugeklappt und aufgeklappt, hoch und quer: Steht das Kamerabild aufrecht? Liegt der Rahmen mittig im Bild? Wird ein Code im Rahmen erkannt, einer außerhalb nicht?
6. **Training zugeklappt (D-377, D-378):** Zeigen die Chips „− 15 s“ und „+ 15 s“ beide Zeichen (seit D-380 zugeklappt in der großen Pause)? Steht „102,5“ ganz im Feld für kg?
7. **„Meine Küche“ aufgeklappt (D-377):** Ist das Menü ganz zu sehen, nichts unter der Tab-Leiste?
8. **Halb aufgeklappt:** Was zeigt FORM, wenn das Gerät nur halb geöffnet ist (Falz)? Web-Apps erfahren davon nichts; bitte ein Foto, falls etwas über den Falz läuft.
9. **Bildschirm im Training aktiv halten:** Bleibt der Bildschirm im Training an, auch nach dem Auf- und Zuklappen?
10. **Player aufgeklappt (D-380, D-383):** Training starten, einen Satz erledigen, aufklappen: Stehen links die Sätze, rechts der Kopf mit Pause (±15 s) und darunter „Als Nächstes“? Ist der nächste Satz in der Pause ganz zu lesen? Ohne Pause: Steht rechts die Karte „Jetzt“? Bleibt die rechte Spalte beim Scrollen der Sätze stehen? Nach jedem „Satz erledigt“: Ist der nächste Satz links ganz zu sehen?
11. **Auf- und Zuklappen mit gescrolltem Satz (D-380):** Aufgeklappt in der Satzliste nach unten scrollen, bis der aktuelle Satz oben steht, dann zuklappen: Steht der Satz unter dem Kopf, nicht dahinter? Wert, Pause und Menü bleiben wie in Punkt 3.
12. **Pause zugeklappt (D-380):** Ist die Pause eine Zeile mit Zeit, nächstem Satz (zwei kurze Zeilen), Pfeil und „Überspringen“? Ist der nächste Satz lesbar? Öffnet der Pfeil die große Pause mit ±15 s? Einmal im Safari-Tab: Dort steht der nächste Satz nicht in der Zeile, weil sie schmaler ist; stört das?
13. **Satzzeile in Safari zugeklappt und auf kleinen iPhones (D-380):** Steht der Vorwert in einer zweiten Zeile mit „Vorwert:“ davor? Passen „102,5“ und die Wiederholungen ganz ins Feld?
14. **Ernährung aufgeklappt (D-381):** Links Ring, Makros und weitere Nährwerte, rechts die Mahlzeiten und das Wasser; Frühstück mit „Hinzufügen“ ohne Scrollen zu sehen? Weitere Nährwerte aufklappen, zuklappen: Bleiben sie offen, stehen die Mahlzeiten wieder unter dem Ring? „Meine Küche“ unten links antippen: Ist das Menü ganz zu sehen (bei wenig Platz öffnet es nach oben)?
15. **Fortschritt (D-382):** Sind die vier Kacheln zugeklappt und aufgeklappt gleich hoch, stehen die Zahlen auf einer Linie, steht die Erklärung der Kalorien darunter?

## 7. Geänderte Dateien in Phase 1

- **App:** `src/app/styles.css` (Hilfsklassen `inset-x-safe`, `page-bleed`), `src/app/layout/TabBar.tsx`, `tabLens.ts`, `ScrollManager.tsx`; `src/shared/ui/Dialog.tsx`, `Toast.tsx`, neu `NameRest.tsx`; Training: `RestStage.tsx`, `SessionPage.tsx`, `SetRow.tsx`, `ValueInput.tsx`; Ernährung: `calc/scanRegion.ts`, `ScannerDialog.tsx`, `barcodeDetector.ts`, `AddFoodPage.tsx`, `KitchenMenu.tsx`, `NutritionPage.tsx`, `format.ts`; Tagesaufgaben: `TaskRow.tsx`, `TaskStats.tsx`, `TaskMatrix.tsx`, `TaskDetailPage.tsx`; `BodyWeightPage.tsx`, `LoginScreen.tsx`; Texte in `de-nutrition.ts` und `de-task-stats.ts`.
- **Tests:** `e2e/duo.ts` (Prüfmaße), `duo-safe-area`, `duo-tabbar`, `duo-scanner`, `duo-scanner-mitte`, `duo-scanner-lage`, `duo-resize`, `duo-funde` mit `fakeCamera.ts` und `scanner.ts`; angepasst `barcode`, `marks`, `tasks`; Unit-Tests `scanRegion.test.ts`, `name-rest.test.tsx` und Anpassungen in `habits-ui`, `task-stats`, `nutrition-ui`, `format`.
- **Werkzeug und Bilder:** `tools/duo-screens.mjs`, `docs/screens/duo/`.
- **Dokumente:** `CLAUDE.md`, `docs/prompts/iphone-duo-FORM.md`, `docs/prompts/iphone-duo-leitlinien-FORM.md`, `docs/decisions.md` (D-370 bis D-379), `docs/testing.md`, `docs/implementation-plan.md`, `docs/feature-inventory.md`, `docs/known-limitations.md`, `audit-report.md` (E-15 und D-08 behoben), dieser Bericht.

## 8. Tests und Einschränkungen

- **Ausgeführt** (Protokolle in `docs/testing.md`): `pnpm test` 124 Dateien, 1085 Tests bestanden; `pnpm lint`, `pnpm typecheck`, `pnpm format:check`, `pnpm check:docs` ohne Befund; `pnpm check:bundle` 235,5 KB von 250 KB; `pnpm test:e2e` in Chromium 365 bestanden, 79 übersprungen, 0 fehlgeschlagen. WebKit läuft in GitHub Actions: Dort scheiterten zuerst die Scanner-Tests aus D-374, weil WebKit mit den Kamera-Optionen von Chromium nicht startete; seit dem Nachtrag zu D-374 ist die CI grün (Lauf 40236345703 zu D-377: alle vier Jobs, WebKit 344 bestanden, 98 übersprungen).
- **Nicht am Gerät getestet.** Alles lief in Browser-Fenstern mit den Maßen des Duo. Die Maße stammen teils von Dritten (Abschnitt 2), der Systemrand von 84 pt ist eine Annahme.
- **Nur in Chromium:** den sicheren Bereich nachstellen und die Kamera durch ein Standbild ersetzen. WebKit prüft dieselben Abläufe ohne Systemrand.
- **Nicht erkennbar:** ob das Duo auf- oder zugeklappt ist und ob es halb geöffnet ist (Falz). FORM richtet sich nur nach der Fensterbreite.
- **Bewusst offen:** Tageszahl im Kalender 10 px (D-334); Satzzeile bei 360 und 320 pt (Vorschlag in Abschnitt 5, erledigt mit D-380).

## 9. Phase 2: Layouts (D-380 bis D-382)

Freigegeben am 26.10.2026: alle drei Pakete wie empfohlen, ohne leeren Platzhalter für die Übungsdemonstration; die Tab-Leiste bleibt. Umgesetzt nach Kapitel 10 der Leitlinien: dieselben Komponenten, nur anders angeordnet, an der Breite des Inhalts (48 rem) statt an der Haltung des Geräts. Die neuen Anordnungen werden mit dem Player und der Ernährung nachgeladen; die Startansicht steht bei 235,7 KB (vorher 235,5 KB). Beim Auf- und Zuklappen wird nichts neu aufgebaut.

### 9.1 Workout-Player (D-380)

| Zustand | Vorher (Messung D-379) | Jetzt |
|---|---|---|
| Aufgeklappt (Inhalt ab 48 rem breit: Duo aufgeklappt, iPad quer, Desktop) | eine Spalte; Kopf mit Pause 264 pt über der Liste, für Übung und Sätze 284 pt, eine Satzzeile ganz zu sehen, Felder 298 pt breit | zwei Spalten: links die Übungen mit den Sätzen, rechts mitlaufend der Kopf mit Trainingstag, Fortschritt und Pause (mit ±15 s und dem nächsten Satz), ohne Pause darunter „Jetzt“ mit dem nächsten Satz, dann „Als Nächstes“ mit bis zu vier folgenden Übungen und ihren offenen Sätzen. Für Übung und Sätze 572 pt, fünf Satzzeilen ganz zu sehen, Felder 118 pt |
| Zugeklappt (eine Spalte, Fenster unter 45 rem hoch: Duo zugeklappt, iPhone quer, iPhone hoch in Safari) | Pause als Karte mit ±15 s; Kopf 274 pt, für Übung und Sätze 269 pt, eine Satzzeile | Pause in einer Zeile: Zeit, nächster Satz in bis zu zwei Textzeilen, Taste für die große Pause, „Überspringen“; ±15 s in der großen Pause. Kopf 192 pt, für Übung und Sätze 351 pt, zwei Satzzeilen |
| Zwischenmaß (669 × 951) und iPhone hoch | – | unverändert |
| Satzzeile schmaler als 20 rem (Fenster unter 384 pt: Safari zugeklappt mit 382 pt, iPhone SE und mini) | bei 382 und 375 pt passte „102,5“ nur knapp, je nach Schriftart nicht ganz; bei 360 pt ragte es 7 px aus dem Feld, bei 320 pt waren die Felder 25 px breit | der Vorwert steht in einer zweiten Zeile unter den Feldern, mit sichtbarem Namen „Vorwert:“; die Felder sind bei 382 pt 83 px, bei 375 pt 80 px, bei 360 pt 72 px und bei 320 pt 52 px breit. Damit ist auch der offene Punkt zur Schriftart aus Abschnitt 3.7 erledigt |

Gemessen in Chromium mit laufendem Training und Pause, Seite ganz oben; in einer Spalte steht unter dem Kopf noch die Karte „Jetzt“, im Training rückt der aktuelle Satz von selbst ins Bild.

- **Übungsdemonstration:** Im Raster der rechten Spalte gibt es den Bereich „demo“ zwischen Hinweis und „Jetzt“. Ohne Bilder hat er keinen Inhalt und keine Höhe; es gibt keinen Platzhalter. Kommen Bilder, gehören sie in diesen Bereich.
- **Pause zugeklappt:** Der nächste Satz steht in bis zu zwei Textzeilen neben der Zeit („Beinpresse, Aufwärm-…“), die Zeile wird dadurch nicht höher. Ist der Player schmaler als 22 rem (Safari zugeklappt mit 382 pt, iPhone SE und mini), bliebe nur ein Wortrest; dann steht der nächste Satz nur für Screenreader da und sichtbar in der Satzliste und in der großen Pause.
- **Rechte Spalte:** klebt oben und reicht nie hinter die Fußleiste; ist sie höher als das Fenster, scrollt sie für sich.
- **Beim Auf- und Zuklappen** bleiben Kopf, Pause und Sätze dieselben Elemente; Werte, Menüs, Dialoge und Pause bleiben erhalten (Tests aus D-375).
- **Unterwegs gefunden und behoben:** Aufgeklappt den aktuellen Satz nach oben gescrollt, dann zugeklappt: Der Kopf stand wieder über der Liste und verdeckte den Satz. Jetzt rückt der Satz nach jeder Größenänderung wieder ins Bild, wenn er vorher zu sehen war.
- **Nachtrag nach der CI:** Die einzeilige Pause gilt bei jedem niedrigen Fenster, auch am iPhone hoch in Safari (das Testprofil iPhone 15 hat 393 × 659 pt). WebKit fand drei Tests, die das nicht berücksichtigten; sie tippen ±15 s jetzt in der großen Pause. Dabei zeigte sich: Wird der Kopf beim Wechsel zwischen zugeklappt und Zwischenmaß 72 pt höher oder niedriger, sprang der Satz bis zum nächsten Takt der Pause (bis 250 ms). Jetzt bleibt er schon im ersten Bild an seiner Stelle, auch wenn sich nur der sichere Bereich ändert.
- **Tests:** `e2e/duo-player.spec.ts`, 3 Tests (Handy-Profil, Chromium und WebKit): zwei Spalten mit axe ohne Verstöße und der Satz nach jedem „Satz erledigt“ ganz sichtbar; einzeilige Pause; Satzzeile bei 390, 360 und 320 pt. Am alten Stand 3 von 3 fehlgeschlagen („Als Nächstes“ fehlt; Pause 142 px statt höchstens 80; Vorwert bei 360 pt in derselben Zeile). Gegenproben für den Satz hinter dem Kopf und für die zweite Textzeile der Pause: beide fehlgeschlagen ohne die Korrektur. Angepasst: `duo-resize.spec.ts` (aufgeklappt rückt der Satz um die Höhe des Kopfs nach oben und bleibt sichtbar) und der Test zu D-377 (±15 s bei 320 × 800, weil die Pause bei 320 × 640 einzeilig ist).
- **Beim Abschluss (D-383):** In der rechten Spalte stand vom nächsten Satz neben der großen Zeit nur „Beinpresse,…“. Dort darf er jetzt bis zu vier Zeilen haben („Nächster Satz: Beinpresse, Arbeitssatz 2 · Ziel 8–12“).
- **Nur am Gerät prüfbar:** wie sich die mitlaufende rechte Spalte beim Scrollen anfühlt; ob die einzeilige Pause zugeklappt gut lesbar ist.

### 9.2 Ernährung (D-381)

| Zustand | Vorher (Messung D-379) | Jetzt |
|---|---|---|
| Aufgeklappt (Inhalt ab 48 rem breit: Duo aufgeklappt, iPad, Desktop) | eine Spalte; die erste Mahlzeit begann bei 619 von 669 pt hinter der Tab-Leiste, zu sehen war nur der Ring mit den Makros | zwei gleich breite Spalten: links Ring, Makros, Hinweise und weitere Nährwerte, darunter „Ziel“ und „Meine Küche“; rechts Frühstück, Mittagessen, Abendessen, Snacks und Wasser. Das Frühstück beginnt bei 194 pt und ist mit Eintrag und „Hinzufügen“ ohne Scrollen zu sehen |
| Zugeklappt und Zwischenmaß (669 pt) | eine Spalte | unverändert |

Gemessen in Chromium mit Tagesziel, zwei Schnelleinträgen und Wasser, Seite ganz oben. Am iPad hoch (820 pt) und am Desktop gelten ebenfalls zwei Spalten.

- **Reihenfolge:** Im Dokument bleibt sie gleich (Ring, „Ziel“ und „Meine Küche“, Mahlzeiten, Wasser), für Screenreader und Tastatur ändert sich nichts. Mahlzeiten und Wasser stehen dafür in einem gemeinsamen Rahmen; das Wasser steht deshalb rechts unter den Mahlzeiten.
- **Linke Spalte:** klebt nicht. Mit offenen weiteren Nährwerten wäre sie höher als das Fenster.
- **„Meine Küche“:** Der Knopf steht aufgeklappt unten in der linken Spalte. Reicht die Seite darunter nicht, um das Menü über die Tab-Leiste zu scrollen (leerer Tag mit offenen weiteren Nährwerten, oder das Wasser ist noch nicht geladen), öffnet es nach oben über die Ringkarte. Gefunden beim Wiederholen des Tests zu D-377: aufgeklappt war „Vorlagen“ in 3 von 5 Läufen verdeckt.
- **Beim Auf- und Zuklappen** bleiben Ring, Mahlzeiten und Wasser dieselben Elemente; aufgeklappte weitere Nährwerte bleiben offen (Test).
- **Tests:** `e2e/duo-nutrition.spec.ts`, 2 Tests (Handy-Profil, Chromium und WebKit): aufgeklappt zwei Spalten, das Frühstück mit Eintrag und „Hinzufügen“ über der Tab-Leiste, axe ohne Verstöße; zugeklappt und im Zwischenmaß eine Spalte, die weiteren Nährwerte bleiben offen; wieder aufgeklappt zwei Spalten. Dazu „Meine Küche“ unten in der linken Spalte: alle vier Einträge frei. Am alten Stand schlagen beide fehl: eine Spalte (Test 1); „Vorlagen“ verdeckt in 3 von 3 Läufen (Test 2, gegen das Menü ohne Öffnen nach oben).
- **Nur am Gerät prüfbar:** ob die schwebende Tab-Leiste aufgeklappt beim Lesen der Mahlzeiten stört.

### 9.3 Fortschritt (D-382)

| Breite | Vorher (Messung mit einem Training) | Jetzt |
|---|---|---|
| Zugeklappt (Kacheln 2 × 2) | Kachel „Kalorien“ mit der Erklärung 242 px hoch, die oberen Kacheln 86 px; die Kacheln endeten bei 533 pt | vier Kacheln je 103 px, die Zahlen unten auf einer Linie, die Erklärung darunter in voller Breite; die Kacheln enden bei 412 pt |
| Zwischenmaß (2 × 2) | 86 und 158 px | vier Kacheln je 86 px |
| Aufgeklappt (vier nebeneinander) | alle vier 208 px hoch, weil die Kalorien-Kachel die Reihe streckte | vier Kacheln je 103 px, die Erklärung in zwei Zeilen darunter |

- **Texte:** Die Methode steht unverändert da („Schätzung nach MET: …“). Die beiden kurzen Hinweise stehen jetzt unter allen Kacheln und nennen deshalb „Kalorien“ im Satz: „Kalorien werden erst mit Körpergewicht geschätzt.“ und „1 Training ohne Kalorien-Schätzung (kein Körpergewicht).“ Gibt es Trainings ohne Schätzung, steht jetzt beides da, der Hinweis und die Methode.
- **Kacheln:** Alle Reihen sind gleich hoch, das Label steht oben, die Zahl unten. So stehen die Zahlen auf einer Linie, auch wenn „Kalorien (Schätzung)“ zweizeilig umbricht. Die gemeinsame Kachel (`StatTile`) bleibt unverändert; die Klassen kommen von der Seite.
- **Tests:** `e2e/duo-progress.spec.ts`, 1 Test (Handy-Profil, Chromium und WebKit): in den drei Breiten gleich hohe Kacheln, Zahlen auf einer Linie, Erklärung unter und nicht in den Kacheln; am alten Stand fehlgeschlagen (155 px Unterschied). Dazu `progress-ui.test.tsx`. Nachtrag nach der CI: Der Test prüft die Lage des Hinweises, nicht den Wortlaut; ein Test-Training unter einer Sekunde hat keine Schätzung, dann steht dort der Hinweis zum Körpergewicht.

## 10. Abschlussbericht nach Kapitel 13 der Leitlinien

Getestet wurde in Browser-Fenstern mit den Maßen des iPhone Duo, nicht auf dem Gerät. Was nur dort prüfbar ist, steht in der Liste für deinen Gerätetest (Abschnitt 6).

### 10.1 Analysierte Screens und Komponenten

- **Screens:** alle aus Kapitel 4 der Leitlinien, 28 Ansichten in den drei Prüfmaßen (Abschnitt 4.2); dazu Safari zugeklappt (382 × 640), zugeklappt quer (594 × 368), iPhone SE (320 × 568), iPhone 15 in Safari (393 × 659) und für die Satzzeile 320 bis 430 pt.
- **Komponenten:** schwebende Tab-Leiste mit Linse und Kreis, Blätter, Rückfragen, Hinweise, „Meine Küche“, Barcode-Scanner, Kopf, Pause und Satzzeile im Player, Ring und Makros der Ernährung, Kennzahl-Kacheln, Kalender und Diagramme, Leseposition beim Größenwechsel.

### 10.2 Gefundene Layoutprobleme

- **Fehler (behoben in Phase 1):** Bedienelemente unter dem Systemrand an der Seite (D-372); Tab-Leiste nach Größenänderung und Linse (D-373, D-376); Scanner erkannte außerhalb des Rahmens, quer lag das Bild außerhalb (D-374); Leseposition verrutschte beim Auf- und Zuklappen (D-375); Kopf im Training, Auswahl der Mahlzeit, „Meine Küche“, Namen für Screenreader, ±15 s, Wochentage (D-377); lange Werte in der Satzzeile (D-378).
- **Fläche (behoben in Phase 2):** Im Player war aufgeklappt und zugeklappt nur eine Satzzeile ganz zu sehen; in der Ernährung begann die erste Mahlzeit aufgeklappt hinter der Tab-Leiste; im Fortschritt war die Kachel „Kalorien“ doppelt so hoch wie die anderen; bei 360 und 320 pt waren die Felder der Satzzeile zu schmal.
- **Unterwegs in Phase 2 (behoben):** Satz nach Aufklappen, Scrollen und Zuklappen hinter dem Kopf; nächster Satz in der einzeiligen Pause nur als „Beinpress…“; Satz sprang beim Wechsel der Pause zwischen Zeile und Karte bis zum nächsten Takt; „Meine Küche“ aufgeklappt unter der Tab-Leiste, wenn die Seite darunter zu kurz war (D-380, D-381).

### 10.3 Implementierte responsive Layouts: Verhalten schmal und breit

| Screen | Zugeklappt (schmal, 466 × 678) | Zwischenmaß (669 × 951) | Aufgeklappt (breit, 951 × 669) |
|---|---|---|---|
| Workout-Player | eine Spalte; Pause in einer Zeile mit Zeit, nächstem Satz und „Überspringen“, ±15 s in der großen Pause | eine Spalte wie bisher, Pause als Karte mit ±15 s | zwei Spalten: links Übungen und Sätze, rechts mitlaufend Kopf mit Pause und nächstem Satz (ohne Pause: „Jetzt“) und „Als Nächstes“; Platz für die Übungsdemonstration im Raster vorbereitet |
| Satzzeile | eine Zeile (als App; in Safari mit 382 pt zweite Zeile für den Vorwert) | eine Zeile | eine Zeile |
| Ernährung | eine Spalte wie bisher | eine Spalte wie bisher | zwei Spalten: links Ring, Makros, weitere Nährwerte, „Ziel“ und „Meine Küche“; rechts Mahlzeiten und Wasser |
| Fortschritt | vier gleich hohe Kacheln (2 × 2), Erklärung der Kalorien darunter | wie zugeklappt | vier Kacheln nebeneinander, Erklärung darunter |
| Alle übrigen Screens | unverändert (Bewertung „später“ oder „unnötig“, Abschnitt 5) | | |
| Navigation | schwebende Tab-Leiste, neben dem Systemrand | Tab-Leiste | Tab-Leiste (unverändert, nach deiner Vorgabe) |

Umbruchpunkte: zwei Spalten ab 48 rem Breite des Inhalts (Container-Abfragen, so zählt der Systemrand mit); einzeilige Pause bei Fenstern unter 45 rem Höhe; zweite Zeile der Satzzeile unter 20 rem Zeilenbreite; nächster Satz in der Pause erst ab 22 rem Breite des Players. Beim Auf- und Zuklappen wird nichts neu aufgebaut: Werte, Menüs, Dialoge, Pause und die Lage des aktuellen Satzes bleiben.

### 10.4 Tatsächlich ausgeführte Tests

- **Unit-Tests:** `pnpm test` nach jedem Paket 124 Dateien, 1085 Tests bestanden.
- **E2E in Chromium, alle Dateien (diese Umgebung):** Paket 1: 368 bestanden, 82 übersprungen, 0 fehlgeschlagen (zweimal); Nachtrag zu D-380 und Paket 2: 370, 84, 0; Paket 3: 371, 85, 0; Abschluss: 371, 85, 0.
- **Im Fenster des iPhone 15 (393 × 659, in Chromium nachgestellt):** ganze Suite 204 bestanden, 22 übersprungen, 1 fehlgeschlagen; der eine Test wählt Handy oder Desktop nach dem Namen des Projekts, mit passendem Namen bestanden.
- **CI in GitHub Actions (Chromium und WebKit):** Paket 1 (Lauf 40283966090) in WebKit 3 fehlgeschlagen: die einzeilige Pause im Profil iPhone 15 und eine Prüfung, die vom Scrollen abhing; behoben im Nachtrag zu D-380. Danach grün: Lauf 40292622372 (Paket 2, WebKit 350 bestanden), Lauf 40295195644 (Paket 3, Chromium 371, WebKit 351 bestanden) und Lauf 40298724340 (Abschluss, WebKit 351 bestanden; in Chromium 370 bestanden und der Fortschritt-Test erst im zweiten Anlauf, behoben im Nachtrag zu D-382). Die CI zum letzten Commit steht im PR.
- **Neue Tests in Phase 2:** `e2e/duo-player.spec.ts` (3), `duo-nutrition.spec.ts` (2), `duo-progress.spec.ts` (1); angepasst `duo-resize`, `duo-funde`, `session`, `resilience` und `progress-ui.test.tsx`. Jede neue Prüfung schlug am alten Stand fehl (Gegenproben in `docs/testing.md`).
- **Wiederholungen gegen Wackeln:** `duo-player` und `duo-resize` je fünfmal: 30 von 30 bestanden; `duo-nutrition`, `duo-funde` und `nutrition` je viermal: 60 von 60.
- **Prüfung aller Screens:** `tools/duo-screens.mjs`, 84 Ansichten in drei Breiten, Befunde wie nach Phase 1 (Abschnitt 4.4), axe ohne Verstöße.
- **Startansicht:** 235,7 KB von 250 KB (vor Phase 2: 235,5 KB). Die neuen Anordnungen werden mit Player und Ernährung nachgeladen.
- **Nicht getestet:** auf dem echten iPhone Duo. Dafür die Liste in Abschnitt 6.

### 10.5 Behobene Probleme

Abschnitt 3 (Phase 1, D-372 bis D-378) und Abschnitt 9 (Phase 2, D-380 bis D-382). Jeder behobene Fehler hat einen Test, der am alten Stand fehlschlägt; die Gegenproben stehen bei den Abschnitten und in `docs/testing.md`.

### 10.6 Geänderte Dateien in Phase 2

- **App:** neu `src/modules/training/ui/player/player-layout.css` und `src/modules/nutrition/ui/nutrition-layout.css`; geändert im Player `SessionPage.tsx`, `RestStage.tsx`, `SetRow.tsx`, `useStableSetView.ts`; in der Ernährung `NutritionPage.tsx`, `KitchenMenu.tsx`; im Fortschritt `ProgressPage.tsx`; Texte in `de-session.ts` und `de-training-pages.ts`.
- **Tests:** neu `e2e/duo-player.spec.ts`, `duo-nutrition.spec.ts`, `duo-progress.spec.ts`; angepasst `duo-resize`, `duo-funde`, `session`, `resilience`, `src/modules/progress/ui/progress-ui.test.tsx`.
- **Bilder:** `docs/screens/duo/` mit Übersicht und Befunden.
- **Dokumente:** `docs/decisions.md` (D-380 bis D-383), `docs/testing.md`, `docs/implementation-plan.md`, `docs/feature-inventory.md` mit CSV, `docs/known-limitations.md`, dieser Bericht.

### 10.7 Bestehende Einschränkungen

- Nicht auf dem echten Gerät getestet; die Prüfmaße stammen teils von Dritten, der Systemrand von 84 pt ist eine Annahme (Abschnitt 2).
- Den sicheren Bereich und die Kamera stellt nur Chromium nach; WebKit prüft dieselben Abläufe ohne Systemrand.
- Ob das Duo auf-, zu- oder halb aufgeklappt ist, erfährt eine Web-App nicht; FORM richtet sich nach der Fenstergröße. Was über den Falz läuft, ist nicht geprüft.
- Ob iOS die App beim Auf- und Zuklappen neu lädt, ist offen.
- Einzeilige Pause: ±15 s sind einen Tipp weiter; in Safari zugeklappt und am iPhone SE oder mini steht der nächste Satz nicht in der Zeile (`docs/known-limitations.md`).
- Aufgeklappt liegt die schwebende Tab-Leiste über rund 80 pt Inhalt; die Navigation bleibt nach deiner Vorgabe.
- Tageszahl im Kalender einer Tagesaufgabe 10 px (bewusst, D-334).

### 10.8 Empfohlene Verbesserungen

- **Übungsdemonstration:** Sobald es Bilder oder Videos gibt, in den vorbereiteten Bereich „demo“ der rechten Spalte im Player; zugeklappt über die Karte „Jetzt“ oder die große Pause.
- **Nach deinem Gerätetest:** ob aufgeklappt eine Seitenleiste statt der Tab-Leiste besser ist (Abschnitt 5).
- **Später (Abschnitt 5):** Fortschritt aufgeklappt mit Körpergewicht und Bestleistungen neben den Kennzahlen; Programme als Liste mit Details; Programm-Details und Tagesaufgaben zweispaltig; größere Kalenderzellen aufgeklappt.
