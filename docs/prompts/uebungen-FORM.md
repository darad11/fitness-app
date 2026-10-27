# FORM · Übungen – Bilder, Demonstrationen und Ausführung

> **Stand:** FORM ist live; Rebranding, Stabilität, Ernährung und iPhone Duo sind gemergt (zuletzt `25a3553`). Diese Sitzung arbeitet auf einem eigenen Branch `form-uebungen` von `main` mit Entwurfs-PR; `form-uebungen` in `CLAUDE.md` als aktuelle Phase eintragen. Es gelten `CLAUDE.md`, `brand-tokens.md`, `form-markenleitplanken.md`. Keine Nachkontrollen planen; gemergt wird nach meiner Freigabe.
>
> **Die ausführlichen Leitlinien in `docs/prompts/uebungen-leitlinien-FORM.md` sind verbindlich** – Inhalte, Anforderungen, Qualität, Barrierefreiheit, Tests und Bericht. Dieser Auftrag legt die Reihenfolge fest und ergänzt, was seit ihrer Entstehung dazugekommen ist.

## 0. Vorab

1. **CI auf `main`** zum Merge `25a3553` prüfen.
2. **Nachtrag Duo:** Der Gerätetest am iPhone Duo ist bestanden (Startfläche bei zehn Kaltstarts aufgeklappt hoch und quer mittig, übrige Punkte in Ordnung). In `docs/testing.md`, im Duo-Bericht und in der Beschreibung von PR #52 als bestanden eintragen.
3. **Platz im Startbündel:** Die Startansicht liegt bei 244,7 von 250 KB. Schaffe zuerst wieder Luft – Ziel höchstens 238 KB –, ohne neue Abhängigkeit und ohne Funktionen zu entfernen, zum Beispiel durch Nachladen selten gebrauchter Teile oder ein schlankeres Skript der Startfläche. Alles, was diese Sitzung hinzufügt – Bilder, Animationen, Texte zur Ausführung, Komponenten –, wird nachgeladen und liegt nie im Startbündel. Der Service Worker speichert Medien nicht alle vorab, sondern bei Bedarf; die aktuelle und die nächste Übung im Training werden vorausgeladen.

## Phase 1 – Bestandsaufnahme, Gerüst, Texte und Quellenvorschlag

1. **Bestandsaufnahme der Übungsbibliothek** nach Kapitel 5 der Leitlinien: alle Übungen mit ID, Namen, Ausrüstung, Muskelgruppen, vorhandenen Visuals und Varianten.
2. **Gerüst:** Datenstruktur für Visuals je stabiler Übungs-ID; Vorschaubild links in allen Übungslisten (Kapitel 2); große Demonstration im Workout-Player (Kapitel 3) – aufgeklappt auf dem Duo im dafür vorbereiteten Platz der rechten Spalte, zugeklappt und auf dem iPhone kompakt, ohne die Bedienung mit einer Hand zu verdrängen; Verknüpfung mit den Übungsdetails. Solange ein Visual fehlt, zeigt der Platz das bisherige Symbol in der Kachel mit den Muskel-Etiketten – **keine Platzhalter, die wie Demonstrationen aussehen**, und kein leerer Kasten.
3. **Ausführung** nach Kapitel 4 der Leitlinien: kurze Beschreibung, Ausgangsposition, Schritte, Technikhinweise, häufige Fehler, Varianten und einfachere Alternativen – je Übung eigens, nicht generisch, nur aus verlässlichen Quellen und mit dokumentierter Quelle; Texte nach den Leitplanken (Du-Form, sachlich, keine Versprechen, keine medizinischen Empfehlungen). Was du nicht belegen kannst, bleibt offen und steht im Bericht.
4. **Quellenvorschlag für die Visuals** nach Kapitel 6: Recherchiere rechtlich nutzbare Quellen und vergleiche sie in einer Tabelle – Abdeckung der Bibliothek, Bildstil, Format (Bild, Animation, Video), Lizenz und Namensnennung, kommerzielle Nutzung, Kosten, Aufwand. Prüfe ausdrücklich auch, ob ein **eigener, einheitlicher FORM-Stil** möglich ist – zum Beispiel zwei Phasen je Übung (Ausgangs- und Endposition) als Illustration auf dunkler Fläche, im Wechsel gezeigt –, und welche Werkzeuge und Lizenzbedingungen dafür gelten würden. Empfiehl eine Lösung mit Begründung.

**Dann stoppe** und gib mir: die Bestandsaufnahme als Tabelle, Bilder des Gerüsts (Liste, Player zugeklappt und aufgeklappt, Übungsdetails), den Stand der Ausführungstexte (wie viele fertig, wie viele offen) und den Quellenvorschlag mit Empfehlung. Beschaffe oder erzeuge noch keine Visuals in großer Zahl und schließe keine kostenpflichtige Lizenz ab.

## Phase 2 – nach meiner Entscheidung

- Die Visuals aus der gewählten Quelle zuordnen bzw. erstellen, mit Lizenz, Quelle und Namensnennung je Asset (Kapitel 6 und 7); einheitlicher Zuschnitt auf der Fläche `card`, keine weißen Hintergründe, keine fremden Logos oder Wasserzeichen.
- Ladeverhalten, Caching, Offline und reduzierte Bewegung nach Kapitel 8 und 9; die Startansicht bleibt unter 250 KB.
- Tests nach Kapitel 10, auch in den Breiten des Duo; Bilder erneuern; Abschlussbericht nach Kapitel 11 mit den ehrlichen Zahlen: wie viele Übungen mit Bild, mit Animation, ohne Visual.
- Zum Schluss eine kurze Liste für meinen Gerätetest am iPhone und am Duo.
