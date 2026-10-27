# FORM · Sitzung 3 – Exercise Visuals & Demonstrations System

> **Vorbemerkung für diese Sitzung (gilt vor allem anderen).** Die App heißt FORM. Designsystem, Farben, Radien und Typografie kommen aus `brand-tokens.md` und `handover-form-rebranding.md` – kein neues Designsystem. Bildcontainer liegen auf der Fläche `card` mit Radius 12, nie mit weißem Hintergrund. Keine Fotos von Menschen in Studio-Physis, keine Vorher-Nachher-Bilder; Illustrationen oder neutrale Demonstrationen bevorzugen. Sprache nach `form-markenleitplanken.md`: Du-Form, keine Ausrufezeichen, keine Emojis. Assets ohne geklärte Lizenz werden als fehlend markiert, nicht verwendet.

## Deine Rolle
Du agierst als Senior Product Designer, UX Engineer und Full-Stack-Developer mit Erfahrung in Fitness-Apps, Übungsbibliotheken, Animationen und mobilen Workout-Playern.
Deine Aufgabe ist es, die bestehende App um ein hochwertiges visuelles Übungssystem zu erweitern. Nutzer sollen nicht nur den Namen einer Übung lesen, sondern unmittelbar erkennen können, wie die Übung aussieht und wie sie korrekt ausgeführt wird.
Arbeite direkt im bestehenden Projekt. Analysiere zuerst den Code, die vorhandene Übungsbibliothek und die bestehenden Workout-Komponenten. Implementiere danach eine durchgängige Lösung, die sich nahtlos in das vorhandene FORM-Design integriert.

## 1. Referenz und gewünschtes Verhalten
Nutze die angehängten Referenzen als Ausgangspunkt. Das gewünschte Grundprinzip besteht aus zwei Ansichten:

**A. Trainings- und Übungsübersicht.** Neben jeder Übung erscheint links ein kleines, hochwertiges Vorschaubild. Es soll auf einen Blick erkennen lassen, um welche Bewegung oder Übung es sich handelt.

**B. Aktiver Workout-Player.** Wenn ein Training gestartet wird, erhält die aktuell ausgeführte Übung eine deutlich größere visuelle Demonstration. Bevorzugt wird ein dezentes Loop-GIF oder eine andere geeignete Animation, die den Bewegungsablauf verständlich zeigt.

Die Referenz dient als funktionale Inspiration, nicht als Designvorlage, die exakt kopiert werden muss. FORM soll eine eigenständige, modernere und hochwertigere Umsetzung erhalten.

## 2. Übungsübersicht: visuelle Vorschauen
Erweitere die vorhandenen Übungskarten und Übungslisten um ein visuelles Element.
Anforderungen:
- Ein quadratisches oder leicht rechteckiges Vorschaubild links neben dem Übungsnamen.
- Konsistente Bildgrößen, Abstände und Ausrichtung.
- Der Übungsname bleibt gut lesbar.
- Sätze, Wiederholungen, Gewicht und weitere vorhandene Trainingsinformationen bleiben erhalten.
- Die Bilder müssen zur tatsächlich dargestellten Übung passen.
- Die Oberfläche darf durch die Bilder nicht überladen wirken.
- Bilder müssen auch bei dunklem Hintergrund und kleinen Bildschirmgrößen gut erkennbar sein.

Beispiel: Barbell Military Press – kleines Vorschaubild der Übung links, daneben Name und darunter die vorhandenen Angaben wie „3 × 10 Wiederholungen“.

Verwende diese Darstellung überall dort, wo Nutzer Übungen auswählen, vergleichen oder ansehen: Trainingsprogramme, Übungslisten innerhalb eines Workouts, Freies Training, Übungssuche und Übungsdetails, Workout-Zusammenfassungen, sofern das Layout davon profitiert.
Analysiere zunächst die tatsächlichen Komponenten und vermeide unnötige, doppelte Implementierungen.

## 3. Workout-Player: animierte Ausführungsdemonstration
Die aktuelle Übung soll im aktiven Workout-Player deutlich hervorgehoben werden.

**Visuelle Darstellung, bevorzugte Reihenfolge:**
1. Hochwertiges, nahtlos wiederholtes GIF oder eine kurze, optimierte Loop-Animation, wenn eine passende und rechtlich nutzbare Datei vorhanden ist.
2. Ein geeignetes kurzes Video oder eine andere effiziente Animation, wenn sie technisch und gestalterisch besser geeignet ist.
3. Ein hochwertiges statisches Übungsbild, falls keine passende Animation verfügbar ist.

Die Animation soll den Bewegungsablauf klar vermitteln und nicht bloß ein dekoratives Bild sein.

**Verhalten:**
- Die Demonstration gehört zur aktuell ausgewählten Übung.
- Beim Wechsel zur nächsten Übung wird automatisch das passende Visual geladen.
- Beim Wechsel zwischen Übungen darf nicht kurzzeitig die falsche Animation angezeigt werden.
- Die Animation soll unabhängig vom Satz- und Pausentimer funktionieren.
- Das Starten, Pausieren oder Abschließen eines Satzes darf die Übungszuordnung nicht durcheinanderbringen.
- Die Demonstration soll in einer angemessenen Größe sichtbar sein, ohne den eigentlichen Workout-Player und seine Bedienung zu verdrängen.
- Vermeide unnötiges Autoplay von Videos mit Ton.
- Bei schlechter Verbindung, Offline-Nutzung oder fehlenden Dateien muss ein sauberer Fallback angezeigt werden.

Wenn ein Nutzer mehr über die Übung erfahren möchte, soll die Visualisierung mit der vorhandenen Übungsdetailansicht verbunden sein.

## 4. Übungsdetails und korrekte Ausführung
Ergänze beziehungsweise verbessere die Übungsdetailansicht so, dass sie neben der visuellen Demonstration hilfreiche Informationen bereitstellt. Je nach vorhandenen Daten: deutscher Übungsname; internationaler beziehungsweise englischer Name, falls hilfreich; kurze Beschreibung der Ausführung; schrittweise Anleitung; primär trainierte Muskeln; sekundär beanspruchte Muskeln; benötigtes Equipment; sinnvolle Alternativen bei nicht vorhandenem Equipment; wichtige Hinweise zur sicheren und kontrollierten Ausführung.

Die Anleitung muss zur jeweiligen Übung passen. Vermeide generische Texte, die für alle Übungen identisch sind. Die visuellen Demonstrationen sollen die korrekte Bewegung zeigen. Wenn es mehrere Varianten gibt, müssen Bild und Anleitung zur ausgewählten Variante passen (Kurzhantel-Schulterdrücken versus Langhantel-Schulterdrücken). Stelle keine medizinischen oder unbelegten Versprechen auf. Sicherheitshinweise sollen konkret und sachlich sein.

**Ergänzung des Produktinhabers – Ausführung verständlich erklären.** Wenn ich eine Übung öffne, will ich nachvollziehen können, wie ich sie korrekt ausführe – schnell erfassbar, auch mitten im Training. Wo verlässliche Informationen vorliegen: kurze Beschreibung, Ausgangsposition, Schritt-für-Schritt-Ausführung, wichtige Technikhinweise, häufige Fehler, beanspruchte Muskelgruppen, benötigte Ausrüstung, Hinweise zu Bewegungsumfang und kontrollierter Ausführung, passende Varianten oder einfachere Alternativen. Vorhandene Übungsdaten zuerst nutzen; nichts als wissenschaftlich belegt ausgeben, was es nicht ist; allgemeine Technikhinweise klar von individuellen medizinischen Empfehlungen trennen. Fehlt eine Beschreibung, nur auf Basis verlässlicher Quellen ergänzen und die Quelle dokumentieren; keine Platzhalter, die wie echte Demonstrationen aussehen.

## 5. Bestehende Übungsbibliothek vollständig berücksichtigen
Analysiere die vorhandene Übungsbibliothek, einschließlich aller derzeit gespeicherten Übungen. Die zuletzt bekannte Größenordnung liegt bei ungefähr 105 Übungen; überprüfe die tatsächliche aktuelle Anzahl im Code beziehungsweise in den Daten.

Erstelle eine Bestandsaufnahme mit: Übungs-ID; deutschem und englischem Namen, soweit vorhanden; Equipment; Muskelgruppen; vorhandenen Bildern oder Animationen; Qualität und Eindeutigkeit der vorhandenen Zuordnung; fehlenden visuellen Materialien.

Erstelle keine neue parallele Übungsbibliothek, wenn die bestehende erweitert werden kann. Jedes Visual muss einer stabilen Übungs-ID oder einer eindeutigen Zuordnung zugeordnet sein. Verwende nicht ausschließlich den angezeigten Übungsnamen als Schlüssel.

## 6. Recherche und Beschaffung geeigneter Übungsvisuals
Prüfe, welche rechtmäßig nutzbaren Bild- und Animationsquellen sich für die bestehende Übungsbibliothek eignen. Priorisiere:
1. Bereits vorhandene, passende und qualitativ gute Assets im Projekt.
2. Verlässlich verfügbare, rechtlich nutzbare Fitness-Illustrationen oder Demonstrationen.
3. Geeignete Open-Source- oder kommerziell lizenzierte Übungsbibliotheken.
4. Selbst erstellte Visuals, wenn die erforderliche Qualität erreicht werden kann.

Übernimm nicht einfach Bilder aus anderen Fitness-Apps. Dokumentiere für externe Assets: Quelle, Lizenz, Nutzungsbedingungen, erforderliche Namensnennung, Einschränkungen für kommerzielle Nutzung, Herkunft und lokale Zuordnung zur Übung. Verwende keine Bilder oder GIFs, deren Nutzungsrechte ungeklärt sind. Wenn ein Asset nicht rechtmäßig beschafft werden kann, markiere es als fehlend und verwende einen sinnvollen Fallback. Behaupte nicht, die gesamte Bibliothek sei vollständig bebildert, wenn das nicht stimmt.

## 7. Visuelle Qualität und einheitliches Design
Die Umsetzung muss sich am vorhandenen FORM-Design orientieren. Behalte die bestehende visuelle Identität, Farben, Typografie, Abstände, Karten und Interaktionsmuster bei. Entwickle kein völlig neues Designsystem.

Die Visuals sollen einheitlich zugeschnitten und positioniert sein, eine konsistente visuelle Qualität besitzen, auf dunklen Oberflächen klar erkennbar sein, keine störenden Wasserzeichen oder fremden App-Logos enthalten, keine ungewollten weißen Hintergründe in dunklen Karten erzeugen und auf mobilen Geräten und Desktop gleichermaßen funktionieren. Wenn die Quellen unterschiedliche Bildstile haben, untersuche, ob einheitliche Hintergründe, Rahmen oder Bildcontainer die Bibliothek harmonisieren können. Verfälsche dabei nicht die Übung selbst. Verwende keine künstlichen Animationseffekte, die eine Bewegung falsch darstellen.

## 8. Technische Architektur und Performance
Untersuche zuerst, wie Bilder, Assets und Übungsdaten derzeit organisiert werden. Implementiere eine möglichst einfache, robuste Lösung. Berücksichtige: optimierte Bildformate und sinnvolle Auflösungen; Lazy Loading für Bilder außerhalb des sichtbaren Bereichs; Vermeidung unnötiger Downloads beim Durchblättern; effizientes Caching häufig genutzter Visuals; sinnvolle Ladezustände und Fehler-Fallbacks; responsive Darstellung; Offline-Verfügbarkeit entsprechend der bestehenden PWA- beziehungsweise Local-First-Architektur; korrekte Asset-Zuordnung nach Reload; keine unnötigen großen Abhängigkeiten; keine Backend-Migration, wenn sie für die Funktion nicht notwendig ist.

Für den Workout-Player sollen die Visuals der aktuellen und gegebenenfalls der nächsten Übung bevorzugt geladen werden. Lade nicht die komplette Medienbibliothek auf einmal. Wenn GIFs zu groß sind, prüfe optimierte Alternativen wie WebP-Animationen oder kurze, stumme Videos. Die Funktion muss auch dann stabil bleiben, wenn ein Visual fehlt oder nicht geladen werden kann. Bundle-Grenze der Startansicht (250 KB, `pnpm check:bundle`) bleibt bestehen.

## 9. Barrierefreiheit und Bedienbarkeit
Hinterlege aussagekräftige Alternativtexte. Verlasse dich nicht ausschließlich auf Farbe. Verhindere, dass Animationen wichtige Bedienelemente verdecken. Berücksichtige reduzierte Bewegungseinstellungen. Sorge dafür, dass die Workout-Steuerung jederzeit zugänglich bleibt. Zeige bei fehlenden Animationen weiterhin den Übungsnamen und die relevanten Informationen an.

## 10. Tests und Qualitätssicherung
Teste anhand realer Übungen aus der vorhandenen Bibliothek. Mindestens: Übung in der Übersicht mit Vorschaubild; dieselbe Übung im Player mit Demonstration; Wechsel zur nächsten Übung; Wechsel zurück; Übung mit mehreren Varianten; Übung ohne Bild; fehlgeschlagenes Laden einer Animation; Offline-Aufruf einer bereits verfügbaren Übung; kleine mobile Bildschirmgröße; Workout-Abschluss und Zusammenfassung; Reload während eines laufenden Workouts; Verifizierung, dass Bilder und Animationen niemals einer falschen Übung zugeordnet werden. Führe vorhandene Tests aus, ergänze gezielte Tests und behebe Fehler, die durch die Änderungen entstehen.

## 11. Umsetzung und Abschlussbericht
Reihenfolge: Code, Übungsdaten und Assets untersuchen → Bestand und fehlende Visuals dokumentieren → Datenstruktur für Übungsvisuals definieren oder erweitern → Übungsübersicht mit Vorschaubildern → große Demonstration im Player → Übungsdetails ergänzen → Assets mit geklärten Nutzungsrechten zuordnen → Ladeverhalten, Caching, Offline-Fallbacks, Performance → Tests → Abschlussbericht.

Der Bericht enthält: geänderte Dateien und Komponenten; tatsächlich implementierte Funktionen; Anzahl der überprüften Übungen; Anzahl mit passenden Bildern; Anzahl mit Animationen; Übungen mit fehlenden Visuals; Quellen und Lizenzstatus; Testergebnisse; bekannte Einschränkungen und nächste Schritte.

## Abschließende Leitlinie
FORM soll eine Übung visuell erklären können, ohne dass Nutzer erst außerhalb der App danach suchen müssen. Analysiere zuerst die tatsächliche Implementierung. Bewahre die bestehende Architektur und Nutzerdaten. Setze die Änderungen vollständig um, prüfe die Ergebnisse und kennzeichne ehrlich, was tatsächlich fertig ist.
