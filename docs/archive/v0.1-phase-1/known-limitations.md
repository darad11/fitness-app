# Bekannte Einschränkungen

Stand: 17.10.2026 · Phase 1

## 1. Grenzen dieser Analyse

- Kein Zugriff auf die installierte Xeela-App; keine eigenen Screenshots oder Bildschirmaufnahmen.
- Direkter Webzugriff auf App Store, Google Play, xeelafitness.com, beide Hilfecenter und Drittseiten wurde von der Netzwerkrichtlinie der Umgebung blockiert. Grundlage sind Suchausschnitte und Zitate. Vollständige Store-Texte, Screenshots und die komplette Versionshistorie fehlen.
- Nutzerrezensionen sind zeitlich gestreut (2024 bis 2026); einzelne Einschränkungen können inzwischen behoben sein.
- Die Funktionsmatrix enthält 27 Positionen mit Status „Noch zu recherchieren". Sie lassen sich am schnellsten mit den in `product-research.md` gelisteten Screenshots klären.

## 2. Browser- und PWA-Einschränkungen auf iPhone und iPad

Auf iOS und iPadOS laufen alle Browser mit der WebKit-Engine. Entscheidend ist daher, was Safari und installierte Home-Bildschirm-Web-Apps können.

| Fähigkeit | Status in Safari/iOS (Stand Kenntnis 2026) | Auswirkung | Unser Umgang |
|---|---|---|---|
| Installation auf dem Home-Bildschirm | Möglich über „Teilen", „Zum Home-Bildschirm"; kein automatischer Install-Prompt | Nutzer muss manuell installieren | In-App-Anleitung mit Erkennung, ob bereits installiert |
| Offline-Nutzung und Service Worker | Unterstützt | Kernfunktionen offline möglich | Workbox-Precache; Daten in IndexedDB |
| Speicherbeständigkeit | Browser-Tab: WebKit löscht skriptbeschreibbaren Speicher einer Website nach 7 Safari-Nutzungstagen ohne Interaktion mit der Site; installierte Home-Bildschirm-Web-Apps führen laut Apple einen eigenen Nutzungszähler, sodass diese Löschung dort in der Praxis nicht greift; bei Speicherdruck kann das System dennoch räumen; `navigator.storage.persist()` bietet keine Garantie wie in Chromium | Risiko von Datenverlust ohne Backup | Installation empfehlen; Export-Erinnerung; Sync so früh wie gewünscht; Speicherüberwachung |
| Speicherkontingent | Großzügig, aber nicht garantiert und nicht abfragbar garantiert | Fotos können Kontingent belasten | Komprimierung, Thumbnails, Auslagerung in Cloud-Storage |
| Web Push | Nur in installierter Web-App ab iOS 16.4, nach Nutzergeste; kein lokales Planen von Benachrichtigungen ohne Server | Erinnerungen benötigen Server (Supabase Edge Function + Cron) und Installation | Erinnerungen als P3; In-App-Hinweise als Grundversion |
| Background Sync, Periodic Sync | Nicht unterstützt | Sync nur bei geöffneter App | Sync bei Start, Sichtbarkeit, online-Ereignis |
| Timer im Hintergrund | JavaScript-Timer werden gedrosselt oder angehalten; Audio im Hintergrund nicht garantiert | Pausentimer-Signal bei gesperrtem Bildschirm unzuverlässig | Endzeitpunkt speichern statt zählen; Wake Lock während des Trainings; große Anzeige; Ton nur im Vordergrund |
| Wake Lock (Bildschirm an) | Unterstützt ab Safari 16.4 | Bildschirm bleibt im Training an | Standard an, abschaltbar |
| Vibration | Nicht unterstützt in iOS Safari | Kein haptisches Feedback | Visuell und Ton |
| Kamera (`getUserMedia`) | Unterstützt, auch in installierter Web-App | Barcode-Scan per Kamera möglich | Live-Scan mit WASM-Decoder; Fallback Foto-Upload und manuelle Eingabe |
| Barcode-Erkennung (`BarcodeDetector`) | Nicht in allen Zielbrowsern verfügbar | Keine native Erkennung garantiert | JavaScript/WASM-Decoder (z. B. ZXing) als Standard; native API nur als Beschleuniger |
| Dateizugriff | Kein File System Access API; Download öffnet „Sichern in Dateien"; Upload per Dateiauswahl | Export/Import funktioniert, aber ohne direkten Ordnerzugriff | ZIP-Export per Download; Import per Dateiauswahl |
| Fotos | Zugriff über Dateiauswahl oder Kamera; EXIF-Orientierung beachten | Funktioniert | Client-seitige Komprimierung |
| Teilen | Web Share API inkl. Dateien unterstützt | Teilen möglich | Optional |
| Apple Health, HealthKit | Keine Web-Schnittstelle | Keine automatische Übernahme von Schritten, Gewicht, Workouts | Manuelle Eingabe; optional iOS-Kurzbefehl, der Health-Daten an eine Supabase-Funktion sendet; native Erweiterung als spätere Option |
| Apple Watch | Nicht erreichbar aus dem Web | Kein Watch-Begleiter | Nicht vorgesehen |
| Schrittzähler im Browser | Keine API | Keine Messung | Manuell oder Import |
| App-Icon-Badge | Unterstützt in installierter Web-App ab 16.4 | Optional nutzbar | Später |
| Tastaturkürzel | Auf iPad mit externer Tastatur möglich | Gut | Vorgesehen |
| EU-Besonderheit | Home-Bildschirm-Web-Apps funktionieren in der EU weiterhin über WebKit | Keine Auswirkung | – |

## 3. Mac

- Safari (macOS 14 und neuer): „Zum Dock hinzufügen" erzeugt eine installierte Web-App mit eigenem Fenster und Web Push.
- Chrome und Edge: PWA-Installation mit Install-Prompt, `BarcodeDetector` teilweise verfügbar, Dateisystem-API verfügbar.
- Unterschiede zwischen Browsern werden per Feature-Erkennung behandelt, nie per User-Agent.

## 4. Supabase-bezogene Einschränkungen

- Der Anon-Key ist öffentlich; Sicherheit hängt vollständig an Row Level Security. Jede Tabelle ohne Policy ist ein Datenleck. Tests für RLS gehören zur Definition of Done der Sync.
- Kostenlose Projekte werden nach längerer Inaktivität pausiert und müssen manuell reaktiviert werden. Für den Dauerbetrieb ist ein kleiner Bezahlplan oder regelmäßige Nutzung nötig.
- Region ist bei Projektanlage zu wählen (Empfehlung EU, Frankfurt) und später nicht trivial zu ändern.
- E-Mail-Versand für Magic Links unterliegt Ratenlimits; für einen Nutzer unkritisch.
- Storage-Egress und Speicher sind begrenzt; Fotos nur komprimiert hochladen.
- Bei aktivierter Sync liegen alle synchronisierten Fachdaten (Training, Ernährung, Körperwerte, Fotos) bei Supabase. Das wird in der App an der Stelle erklärt, an der Sync aktiviert wird.

## 5. Datenquellen und Lizenzen

- **Open Food Facts** (Barcode, Produkte): ODbL. Nutzung über die API und lokales Caching sind für den persönlichen Gebrauch unproblematisch; Weitergabe einer abgeleiteten Datenbank verlangt Namensnennung und Share-Alike. Qualität schwankt; Werte sind als „Community" gekennzeichnet.
- **USDA FoodData Central**: Public Domain, englische Bezeichnungen, gute Qualität für Grundnahrungsmittel.
- **Deutschsprachige Nährwertdatenbanken** (z. B. Bundeslebensmittelschlüssel) sind lizenzpflichtig und nicht vorgesehen.
- **Übungsbibliotheken**: free-exercise-db (Public Domain, Bilder enthalten), wger (CC-BY-SA, Namensnennung). Keine Videos; eigene Videolinks möglich.
- **Xeela-Inhalte** (Programme, Rezepte, Videos, Texte) sind proprietär und werden nicht übernommen. Programme müssen als eigene Vorlagen formuliert werden.

## 6. Funktionen, die eine native Erweiterung benötigen (spätere Option)

Mit einem nativen Wrapper (z. B. Capacitor) um dieselbe Web-App wären zusätzlich möglich: HealthKit (Schritte, Gewicht, Workouts lesen und schreiben), lokale geplante Benachrichtigungen, zuverlässige Hintergrund-Timer mit Ton, Haptik, Apple-Watch-Begleit-App (separates Projekt). Diese Option verändert die Web-Architektur nicht, erfordert aber einen Apple-Developer-Account, Xcode und App-Store- oder TestFlight-Verteilung. Sie ist bewusst außerhalb der Phasen 1 bis 8.

## 7. Einschätzung: Was sich problemlos als Web-App umsetzen lässt

Alle datengetriebenen Funktionen ohne Hardware- oder Systemintegration:

- Profil, Ziele, Einstellungen, Einheiten.
- Programme, Vorlagen, Wochenplanung, Übungsbibliothek mit Suche und Filtern, eigene Übungen.
- Trainingsdurchführung mit Sätzen, Wiederholungen, Gewichten, Pausentimer im Vordergrund, Übungstausch, Zusammenfassung.
- Wiederaufnahme eines Trainings nach Reload oder Offline-Phase (IndexedDB).
- Historie, Verläufe, Bestleistungen, Diagramme, Kalender.
- Ernährungstagebuch, eigene Lebensmittel, Favoriten, Zielberechnung, Historie, Wasser.
- Rezepte, Versionierung, Skalierung, Wochenplan, Einkaufsliste mit Aggregation und Abhaken.
- Körpergewicht, Maße, Fortschrittsfotos (mit Speicher- und Backup-Hinweis).
- Gewohnheiten, persönliche Challenges, Tagesaufgaben, Streaks.
- Export, Import, Backup; Dark Mode; Tastaturbedienung.
- Installation als PWA, Offline-Betrieb, Cloud-Sync mit Konfliktbehandlung.

## 8. Einschätzung: Was nur mit Einschränkungen geht

| Funktion | Einschränkung | Realistische Umsetzung |
|---|---|---|
| Erinnerungen und Push | Nur installierte PWA ab iOS 16.4, Server nötig | P3, mit Supabase Edge Function und Cron |
| Pausentimer bei gesperrtem Bildschirm | Kein garantierter Ton oder Vibration | Wake Lock, visuelle Anzeige, Ton im Vordergrund |
| Barcode-Scanning | Langsamer als nativ, abhängig von Kamera und Licht | WASM-Decoder, Fallback manuell |
| Schritte | Keine Messung im Browser | Manuell, Import, Kurzbefehl-Brücke |
| Apple Health, Apple Watch, Wearables | Nicht möglich | Nur mit nativer Erweiterung |
| Fortschrittsfotos | Speicherkontingent, Datenschutz bei Cloud | Komprimierung, privater Bucket, optional lokal-only |
| Social Sharing als Bild | Möglich, aber ohne direkte Instagram-Story-Integration | Web Share mit generiertem Bild |
| Haptisches Feedback | Nicht auf iOS | Entfällt |
| Datenbeständigkeit ohne Sync | Abhängig vom Browserverhalten | Installation, Export, Sync |
| Fotoerkennung von Mahlzeiten | Externer KI-Dienst, Kosten, Datenschutz | Nicht vorgesehen |
