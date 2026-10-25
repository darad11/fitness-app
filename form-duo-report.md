# FORM · Bericht zur Phase iPhone Duo

Stand: 25.10.2026 · Branch `form-duo`, Entwurfs-PR [darad11/fitness-app#52](https://github.com/darad11/fitness-app/pull/52) · Auftrag `docs/prompts/iphone-duo-FORM.md`, verbindliche Leitlinien `docs/prompts/iphone-duo-leitlinien-FORM.md` · Entscheidungen ab D-370

Getestet wurde in Browser-Fenstern mit den Maßen des iPhone Duo (Chromium in dieser Umgebung, WebKit in GitHub Actions). Auf dem echten Gerät ist nichts getestet; was nur dort prüfbar ist, steht in der Liste für den Gerätetest.

## 1. Auftrag und Reihenfolge

Phase 1: Gerätemaße recherchieren, alle Screens der Leitlinien (Kapitel 4) in drei Breiten prüfen, Fehler sofort beheben (Barcode-Scanner, Tab-Leiste, Verluste beim Auf- und Zuklappen, weitere Funde), Layout-Verbesserungen bewerten, dann stoppen. Phase 2 (Layouts) erst nach Freigabe. Vorher geprüft: CI-Lauf 40223344366 auf `main` (`dd27315`) mit allen vier Jobs grün (D-370).

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
