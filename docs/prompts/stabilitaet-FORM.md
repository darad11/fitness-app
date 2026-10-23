# FORM · Sitzung Stabilität und Aufräumen

> **Vorbemerkung.** FORM ist live (PR #49 gemergt, `1dc1dd7`). Diese Sitzung arbeitet auf `form-stabilitaet` mit dem Entwurfs-PR #50. Es gelten `CLAUDE.md`, `audit-report.md` (P2-Punkte inklusive E-16 und „Wiederherstellen aus dem Export“), `brand-tokens.md` und `form-markenleitplanken.md`. Keine neuen Funktionen außer den hier genannten. Ein Commit je Abschnitt mit D-Nummer, nach jedem Abschnitt Tests, sofort pushen. Keine Nachkontrollen planen; gemergt wird nach meiner Freigabe.

## 1. E-16 – zuverlässiger Start nach Updates und ohne Netz (höchste Priorität)

**Befund:** Der E2E-Test „alle Bereiche starten offline“ fällt lokal im vollen Lauf wiederholt durch; laut Trace kam offline ein Modul (`assets/*.js`) nicht aus dem Service Worker, einmal in WebKit sogar mit Netz. In der CI war er grün.

**Hypothesen, jede belegen oder ausschließen:**
- Die Vorab-Liste des Service Workers ist unvollständig (Muster, Ausnahmen, Größengrenze, nachgeladene Teile).
- Wettlauf beim Update: Ein neuer Service Worker übernimmt, während die Seite noch Teile der alten Version anfragt.
- Nach einem Deploy liefert Vercel die gehashten Teile der alten Version nicht mehr aus; ein Gerät mit alter Version kann nachgeladene Seiten nicht mehr öffnen.
- Navigations-Fallback und Zwischenspeicher-Strategie für `index.html`.

**Ziel:**
- Die installierte App startet nach jedem Update zuverlässig, auch ohne Netz.
- Ein fehlgeschlagener Import eines nachgeladenen Teils wird abgefangen: einmal mit der aktuellen Version neu laden, ohne Datenverlust, ohne Schleife; nie mitten in einem laufenden Training.
- Die Update-Strategie ist dokumentiert: wann der neue Service Worker übernimmt, ob und wann ein Hinweis „Neue Version – neu laden“ erscheint.
- Ein reproduzierbarer Test für den Fall „altes Gerät, neue Version, kein Netz“ (zum Beispiel zwei Builds nacheinander), der am alten Stand fehlschlägt.

## 2. Wackelnde Tests und CI

- „Ziehen mit der Linse“ der Tab-Leiste bestand in WebKit zweimal erst im zweiten Versuch.
- „Wasser-Schalter per Tastatur“ fiel lokal einmal durch.
- Die Installation der WebKit-Browser in der CI ist langsam und hing einmal 24 Minuten: Browser zwischenspeichern (z. B. `actions/cache` für Playwright) oder ein passendes Container-Image nutzen.

Ursachen beheben, Wiederholungen nicht erhöhen. Am Ende jeden vormals wackelnden Test 20-mal hintereinander in einer CI-ähnlichen Umgebung laufen lassen und das Ergebnis berichten.

## 3. Wiederherstellen aus dem Export

Der bestehende Export lässt sich wieder einspielen:
- Datei wählen → Prüfung von Version, Aufbau und Plausibilität → Zusammenfassung (Zeitraum, Anzahl Trainings, Ernährungseinträge, Aufgaben) → Bestätigen.
- Vor dem Ersetzen wird der aktuelle Stand automatisch als Export gesichert.
- Ältere Export-Versionen werden migriert; bei einem Fehler bleibt alles unverändert (alles oder nichts).
- Mit Synchronisierung: festlegen und dokumentieren, wie der importierte Stand abgeglichen wird (Konfliktregel K-03).
- Texte nach den Leitplanken, ruhig und klar; Löschen und Ersetzen nur nach ausdrücklicher Bestätigung.
- Test: Export → Import ergibt denselben Stand; beschädigte und fremde Dateien werden abgelehnt, ohne etwas zu verändern.

## 4. Weitere P2-Punkte

Die übrigen P2-Befunde aus `audit-report.md` Abschnitt 5 nach Priorität, darunter B-07 (Start aus einem Programm ohne Fehlerbehandlung im Klick). Jede Behebung mit einem Test, der am alten Stand fehlschlägt. Was zu groß für diese Sitzung ist, mit Begründung im Bericht als offen.

## 5. Startbündel

Die Startansicht liegt bei 236 KB von 250 KB. Prüfen, was ohne Aufwand und ohne neue Abhängigkeit nachgeladen werden kann; Ziel höchstens 235 KB, damit künftige Funktionen Platz haben.

## 6. Tests und Abschluss

- `pnpm format:check`, `lint`, `typecheck`, `check:docs`, `test`, `build`, `check:bundle`, E2E Chromium lokal, WebKit in der CI.
- `docs/known-limitations.md`, `docs/testing.md` und `docs/decisions.md` nachziehen.
- Bericht wie in den Rebranding-Paketen: Ursachen, Änderungen, Dateien, Tests mit Ergebnis, Offenes. Danach pushen und stoppen.
