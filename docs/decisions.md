# Entscheidungsprotokoll

Stand: 18.10.2026 · Version 0.5 (M1 in Arbeit) · Vorgängerversion: `archive/v0.1-phase-1/decisions.md`

## Statuswerte

| Status | Bedeutung |
|---|---|
| Festgelegt | durch den Auftrag vorgegeben |
| Freigegeben | Produktentscheidung des Produktinhabers, vorläufig freigegeben am 18.10.2026 |
| Bestätigt | Phase-1-Vorschlag unverändert übernommen |
| Geändert | Phase-1-Vorschlag mit Begründung angepasst |
| Entschieden | dokumentierte Standardentscheidung für ein nicht kritisches Detail; jederzeit änderbar |
| Vorgesehen | Richtung festgelegt, verbindlich erst nach dem genannten Prüfschritt |
| Verschoben | auf eine spätere Ausbaustufe verlegt |
| Offen | Rückfrage an den Produktinhaber |

## Änderungen gegenüber Version 0.1

- Abschnitt B neu: Produktentscheidungen des Produktinhabers aus Phase 2.
- Phase-1-Vorschläge D-010 bis D-030 mit neuem Status.
- Abschnitte C bis E neu: technische Entscheidungen, Datenquellen, offene Fragen.
- Die Phase-1-Fragen F-01 bis F-20 sind in Abschnitt F ihren Antworten zugeordnet.
- Version 0.3 und 0.4: Hosting (D-231), Modulgrenzen (D-232), Entscheidungen aus der Umsetzung von M0 (D-233 bis D-237) und Arbeit über mehrere Sitzungen (D-238); Nachtrag: Ladezustand ohne Standardwerte (D-239). M1: Schlüssel der Basisübungen (D-240), Erfassungsarten nach der Durchsicht (D-241), Übungsbibliothek in der App (D-242), Beispielvorlagen in der App (D-243).

## A. Durch den Auftrag festgelegt

| ID | Entscheidung | Status |
|---|---|---|
| D-001 | Web-App zuerst, später PWA; keine native App in den ersten Ausbaustufen | Festgelegt |
| D-002 | React, TypeScript, Vite | Festgelegt |
| D-003 | Local-first mit lokaler Datenbank; localStorage nur für unkritische UI-Präferenzen | Festgelegt |
| D-004 | Supabase für optionale Synchronisierung und Anmeldung, sofern die Analyse es bestätigt | Festgelegt, bestätigt durch D-205 |
| D-005 | Ein Nutzer; keine Multi-User-Plattform; keine kommerziellen Funktionen | Festgelegt |
| D-006 | Eigenständiger Code und eigenständiges Design; keine geschützten Inhalte | Festgelegt |
| D-007 | Keine Microservices, keine unnötigen Abstraktionen | Festgelegt |

## B. Produktentscheidungen des Produktinhabers (Phase 2)

| ID | Entscheidung | Status | Folgen in den Unterlagen |
|---|---|---|---|
| D-101 | Responsive Web-App mit PWA-Unterstützung zuerst; nutzbar auf iPhone, iPad und Mac; die erste Version soll früh im Alltag nutzbar sein | Freigegeben | Meilenstein M1 ist ein Training auf dem iPhone; PWA-Installation und Offline-Grundlagen ab M0 |
| D-102 | Technische Ausgangsbasis: React, TypeScript strict, Vite, React Router, Tailwind CSS mit eigenen Tokens, Radix-Primitives wo sinnvoll, Dexie und IndexedDB, Zod, date-fns, Recharts, vite-plugin-pwa, Vitest, Playwright mit WebKit, Supabase später | Freigegeben | Prüfung in `architecture.md` Abschnitt 2; Abweichungen D-201 bis D-203 |
| D-103 | Primäre UI-Sprache Deutsch | Freigegeben | D-212 |
| D-104 | Metrisches System (kg, cm, g, ml) | Freigegeben | Imperiale Anzeige ausgeschlossen (ON-12); Umrechnungsmodul bleibt intern |
| D-105 | Währung Euro, sofern Geldbeträge nötig sind | Freigegeben | Im MVP keine Geldbeträge; Konvention in `data-model.md` |
| D-106 | Keine Kopie proprietärer Xeela-Programme oder -Inhalte; flexibler Programm-Builder; einige eindeutig als Beispieldaten gekennzeichnete Vorlagen | Freigegeben | `sample-templates.md`; TP-01, TP-14, TP-23 bis TP-25 |
| D-107 | Builder-Umfang: eigene Programme, Vorlagen anlegen und wiederverwenden, Wochen und Tage, Übungen frei zuordnen und sortieren, bearbeiten, ersetzen, Sätze/Wiederholungen/Pausen, manuelles Hinzufügen, duplizieren; erweiterbar um weitere Trainingsmethoden | Freigegeben | Datenmodell mit reservierten Feldern für Gruppen und RPE |
| D-108 | MVP-Durchführung: Aufwärm-, Arbeits- und Drop-Sätze, Gewicht, Wiederholungen, vorherige Werte, Pausentimer, Übungstimer, Satzstatus, Fortschritt, automatisches Speichern, Historie, Zusammenfassung, manuelle Workouts; Supersätze und RPE nur in der Architektur | Freigegeben | `requirements.md` AK-TRN |
| D-109 | Der laufende Trainingszustand übersteht Reload, Offline-Phasen und Hintergrund; Hintergrundtöne werden nur nach Prüfung zugesagt | Freigegeben | D-215, D-216; Gerätetest T-IPH-M1 |
| D-110 | Lebensmittel: Open Food Facts für Marken und Barcode prüfen; ergänzen um eigene Lebensmittel, manuelle Nährwerte, generische Lebensmittel mit Quelle, Portionen, Einheitenumrechnung, Kennzeichnung unvollständiger und geschätzter Werte, Quellen- und Qualitätsstatus; keine alleinige Abhängigkeit von einem externen Dienst; gespeicherte Mahlzeiten behalten ihre Werte; Limits, Lizenz, Datenschutz und Offlineverhalten vor Integration prüfen | Freigegeben | `data-sources.md`; D-301 bis D-305 |
| D-111 | MVP: Dashboard, Trainingsmodul, Körpergewicht, Datengrundlagen für spätere Module; nicht alle Module gleichzeitig | Freigegeben | `requirements.md` Abschnitt 4 |
| D-112 | Ernährung als zweite große Ausbaustufe, nie als bloßes UI-Mock-up | Freigegeben | Release R2 |
| D-113 | Local-first verbindlich; Dexie; früh geplant: stabile IDs, Schema-Versionierung, Zeitstempel, Änderungsmetadaten, Soft Deletes, Export/Import, Wiederherstellung, Supabase-Sync; kein eigener Backend-Server; keine pauschale Last-write-wins-Strategie; Konfliktregeln pro Entität | Freigegeben | D-204 bis D-209; `data-model.md` Abschnitt 7 |
| D-114 | Fortschrittsfotos zunächst nur lokal; Foto-Cloud keine MVP-Voraussetzung | Freigegeben | BP-05 in R4, Cloud in R5 |
| D-115 | Schritte später manuell oder über einen iOS-Kurzbefehl | Freigegeben | AH-01; `known-limitations.md` Abschnitt 2 |
| D-116 | Keine Apple-Health- oder Apple-Watch-Integration in der Web-App | Freigegeben | AH-07 ausgeschlossen |
| D-117 | Gewohnheiten als späteres Modul | Freigegeben | R4 |
| D-118 | Verifizierte Xeela-Funktionen bleiben Maßstab der Roadmap; Kategorien Original verifiziert, Original nicht verifiziert, eigene Verbesserung, MVP, später, ausgeschlossen; dokumentierte Schwächen sind Erkenntnisse aus Rezensionen, nicht automatisch der aktuelle Stand | Freigegeben | Spalten Herkunft und Umfang in `feature-inventory.md` |
| D-119 | Eigenständiges, hochwertiges Design; mobile-first; Light Mode, optional Dark Mode; keine funktionslosen Buttons, keine vorgetäuschten Daten; definierte Lade-, Fehler- und Leerzustände | Freigegeben | `design-system.md` |

## C. Technische Entscheidungen

### C.1 Phase-1-Vorschläge mit neuem Status

| ID | Vorschlag aus Phase 1 | Status | Begründung und Auswirkung |
|---|---|---|---|
| D-010 | Dexie als Zugriffsschicht | Bestätigt | Dexie 4.4 (geprüft am 18.10.2026) |
| D-011 | React Router v7 | Geändert | Aktuell ist React Router 8 (seit 17.06.2026). Wir nutzen den Data Mode mit `createBrowserRouter`; `RouterProvider` kommt aus `react-router/dom`. Voraussetzungen React ≥ 19.2.7 und Node ≥ 22.22 sind erfüllt. Für eine reine Browser-App ohne Server ändern die Brüche von Version 8 nichts |
| D-012 | Tailwind v4, Radix in eigenen Komponenten, Lucide | Bestätigt | Tailwind 4.3 setzt Safari 16.4 voraus; unser Mindestziel liegt darüber (D-228) |
| D-013 | Zod für Typen und Validierung | Bestätigt | Zod 4.6 |
| D-014 | date-fns; ISO-UTC plus `dayKey` und Zeitzone | Bestätigt | date-fns 4.4; `@date-fns/tz` nur bei Bedarf |
| D-015 | Recharts | Bestätigt | Recharts 3.10; Diagrammregeln in `design-system.md` Abschnitt 8 |
| D-016 | vite-plugin-pwa mit Workbox | Bestätigt mit Auflage | Vite 8 erfordert vite-plugin-pwa 2.0 (erschienen am 03.10.2026). Wegen der kurzen Reife sichern Offline-E2E-Tests in M0 die Funktion ab. Rückfallebene ist Vite 7 mit vite-plugin-pwa 1.3 |
| D-017 | Eigene, schlanke Sync-Engine | Geändert | Ersetzt durch aggregatbasierte Dokument-Synchronisierung (D-205) |
| D-018 | UUID v4 | Bestätigt, erweitert | Ergänzt um deterministische IDs für natürliche Schlüssel (D-207) |
| D-019 | Sync-Metadaten von Anfang an | Bestätigt, präzisiert | Hybride logische Uhr statt clientseitiger Revisionszähler (D-206) |
| D-020 | pnpm, ESLint, Prettier, GitHub Actions | Bestätigt | ESLint 10, typescript-eslint 8.71 |
| D-021 | Statisches Hosting mit HTTPS | Bestätigt | Anbieter Vercel (D-231) |
| D-022 | Vitest, Testing Library, fake-indexeddb, Playwright mit Chromium und WebKit | Bestätigt mit Auflage | Vitest 5, Playwright 1.64; WebKit läuft in CI, nicht in dieser Cloud-Umgebung (D-210) |
| D-023 | Navigation Heute, Training, Ernährung, Fortschritt, Mehr | Geändert | Im MVP ohne Ernährung, weil keine funktionslosen Bereiche erscheinen dürfen (D-211) |
| D-024 | Formeln Mifflin-St Jeor, Epley, Double Progression | Teilweise verschoben | Epley im MVP (D-224); Progressionsvorschlag in R4; Kalorienformel in R2 |
| D-025 | Kommerzielle und soziale Xeela-Funktionen verwerfen | Bestätigt | – |
| D-026 | Fotos zuerst lokal | Bestätigt | D-114 |
| D-027 | Streak-Regel | Verschoben | Streaks kommen erst in R4 |
| D-028 | Intern metrisch | Bestätigt, erweitert | Auch die Anzeige bleibt metrisch (D-104) |
| D-029 | UI Deutsch, Lokalisierung vorbereitet | Bestätigt | D-212 |
| D-030 | Kein Analytics- oder Tracking-SDK | Bestätigt | – |

### C.2 Neue technische Entscheidungen

| ID | Entscheidung | Status | Begründung, Alternativen, Auswirkung |
|---|---|---|---|
| D-201 | TypeScript 6.0.x statt 7.0 | Entschieden | typescript-eslint 8.71 unterstützt nur TypeScript < 6.1. Ohne typisiertes Linting entfielen die Prüfungen der Modulgrenzen. Funktional hat das keine Auswirkung. Der Wechsel auf 7 erfolgt, sobald typescript-eslint ihn unterstützt |
| D-202 | Node 24 LTS in CI, lokal mindestens Node 22.22 | Entschieden | Anforderungen von React Router 8 und Vitest 5 |
| D-203 | Laufzeitabhängigkeiten im MVP nur: react, react-dom, react-router, dexie, dexie-react-hooks, zod, date-fns, recharts, Radix-Pakete, lucide-react, clsx, workbox-window | Entschieden | Kein globaler Zustandsspeicher, keine Formular-, i18n- oder Drag-and-Drop-Bibliothek im MVP. Jede weitere Abhängigkeit braucht einen Eintrag hier |
| D-204 | Lokale Datenhaltung als Aggregat-Dokumente plus lokale, neu aufbaubare Projektionen | Entschieden | Atomare Änderungen pro Aggregat, einfache Wiederaufnahme, passend zur Sync-Einheit. Projektionen liefern schnelle Abfragen (vorherige Werte, Verläufe). Alternative: normalisierte Tabellen wie in v0.1. Analyse in `data-model.md` Abschnitt 2 |
| D-205 | Synchronisierung pro Aggregat statt pro Zeile; serverseitig eine generische Tabelle `sync_documents` in Supabase Postgres mit RLS, serververgebener Revision, optimistischer Nebenläufigkeitskontrolle, idempotenten Mutations-IDs und Pull mit Cursor und Überlappungsfenster; Zusammenführung als 3-Wege-Merge mit Regeln pro Typ | Entschieden (Umsetzung R3) | Kein eigener Server, eine Migration für alle Typen, Konfliktregeln im getesteten Client-Code. Alternativen: normalisierte Tabellen pro Entität, PowerSync, ElectricSQL, Dexie Cloud. Bewertung in `architecture.md` Abschnitt 11 |
| D-206 | Hybride logische Uhr (HLC) als Änderungsstempel; Serverzeit nur für den Pull-Cursor | Entschieden | Robust gegen abweichende Geräteuhren; kausal korrekt nach jedem Abgleich |
| D-207 | Deterministische IDs (UUID v5) für Datensätze mit natürlichem Schlüssel und für gebündelte Stammdaten | Entschieden | Zwei Geräte, die denselben Tageswert anlegen, erzeugen dieselbe ID statt eines Duplikats. Basisübungen haben auf allen Geräten dieselbe ID |
| D-208 | Konfliktkopie bei Programmen und Rezepten, wenn beide Seiten seit dem letzten Abgleich geändert haben | Entschieden | Komplexe Strukturen werden nicht still vermischt; es geht nichts verloren |
| D-209 | Historische Treue über Snapshots statt Versionsketten (Programme, Rezepte) | Entschieden | Einheiten und Protokolleinträge speichern die verwendeten Werte. Versionsketten entfallen, das vereinfacht Modell und Sync |
| D-210 | Playwright-WebKit läuft in GitHub Actions; in dieser Cloud-Umgebung ist nur Chromium installiert | Entschieden | Gerätetests auf echten Geräten bleiben Pflicht, weil Playwright-WebKit nicht Safari auf iOS ist |
| D-211 | Navigation im MVP: Heute, Training, Fortschritt, Mehr; ab R2 zusätzlich Ernährung | Entschieden | `design-system.md` Abschnitt 9 |
| D-212 | Texte in einem typisierten deutschen Katalog; Formatierung über `Intl` nach Gerätesprache (de-AT, de-CH, de-DE; sonst de-DE); Dezimalkomma; Wochenbeginn Montag; 24-Stunden-Zeit | Entschieden | Keine i18n-Bibliothek nötig. Bei Gerätesprache de-AT erscheint zum Beispiel „Jänner" |
| D-213 | Übungsbibliothek im MVP: eigene kuratierte deutsche Basisbibliothek mit etwa 100 Übungen, gebündelt und versioniert, ohne Bilder; persönliche Anpassungen getrennt gespeichert | Entschieden | Unabhängig von externen Quellen, deutsche Namen in gleichbleibender Qualität. Import aus wger (CC BY-SA) oder free-exercise-db (Unlicense) bleibt spätere Option |
| D-214 | Trainingsplanung im Reihenfolge-Modus: Der nächste Tag folgt auf den zuletzt abgeschlossenen Tag des Programms; keine festen Ruhetage; jeder Tag ist jederzeit startbar; optionaler Wochentag-Hinweis | Entschieden | Behebt die laut Rezensionen festen Ruhetage, die erzwungene Reihenfolge und das fehlende Nachholen. Kalender mit Datumsplanung folgt in R4 |
| D-215 | Pausentimer auf Basis gespeicherter Endzeitpunkte; Ton nur im Vordergrund über Web Audio; Audio-Session-Typ „ambient", sofern vorhanden, damit Musik weiterläuft; Wake Lock während der Einheit mit erneuter Anforderung bei Rückkehr | Entschieden, Gerätetest offen | Ein Ton bei gesperrtem Bildschirm wird nicht zugesagt. Der Trick mit stiller Audiowiedergabe ist verworfen, weil er Musik unterbricht und unzuverlässig ist |
| D-216 | Schutz gegen Verbindungsverlust der IndexedDB in Safari: Prüfung bei Rückkehr in den Vordergrund, einmaliges Wiederöffnen, sonst kontrollierter Neustart der App vor neuen Eingaben; Schreibvorgänge sofort bzw. mit 300 ms Entprellung | Entschieden | WebKit-Fehler 197050 ist offen; Dexie öffnet zwar neu, das hilft laut Berichten nicht immer |
| D-217 | Automatischer Snapshot vor Schema-Upgrade, jedem Import und Komplettlöschung in einer separaten lokalen Datenbank; die letzten fünf bleiben erhalten | Entschieden | Wiederherstellung nach fehlerhaften Migrationen oder Bedienfehlern |
| D-218 | Exportformat JSON mit Formatversion; Import „Zusammenführen" (Sitzungsregeln für Trainingseinheiten, sonst gewinnt die neuere Version; ältere Stände bleiben im Snapshot) und „Ersetzen"; Programmdatei zur Übertragung zwischen Geräten vor der Sync | Entschieden | Backup ab M1; Mehrgerätenutzung ohne Cloud möglich |
| D-219 | Ausbaustufen: R1 Trainings-MVP, R2 Ernährung, R3 Synchronisierung, R4 Fortschritt, Aktivität, Gewohnheiten, R5 Erweiterungen | Entschieden, änderbar | Ab Wochenmenü und Einkaufsliste wird Mehrgerätenutzung zum Normalfall; R4-Module entstehen dann direkt mit getesteter Sync |
| D-220 | Das Wochenziel zählt alle abgeschlossenen Einheiten, also Krafttraining und Aktivitäten; Woche Montag bis Sonntag nach lokaler Zeit | Entschieden | Rückfrage Q-07 |
| D-221 | Kein Lighthouse-PWA-Gate; stattdessen Playwright-Prüfungen für Manifest, Service Worker und Offline-Start sowie manuelle Prüfung in den Chrome-Entwicklerwerkzeugen | Entschieden | Lighthouse hat die PWA-Kategorie entfernt |
| D-222 | Arbeitstitel der App „Fitness" für Manifest und Home-Bildschirm | Entschieden, änderbar | Rückfrage Q-03; der Name auf dem Home-Bildschirm wird bei der Installation festgelegt |
| D-223 | Eine Einheit gehört zum Tag ihres Starts (`dayKey` beim Start), auch über Mitternacht | Entschieden | Eindeutige Zuordnung für Verlauf und Wochenziel |
| D-224 | Geschätztes 1RM nach Epley nur für 1 bis 10 Wiederholungen; darüber keine Schätzung | Entschieden | Konservativ, nachvollziehbar |
| D-225 | Vorschlagswerte erscheinen als Platzhalter; „Satz erledigt" übernimmt nur sichtbare Vorschläge aus echten Vorwerten oder festen Zielwerten, nie aus Bereichen | Entschieden | Schnelle Erfassung ohne vorgetäuschte Daten |
| D-226 | Keine Kalorienschätzung für Trainings im MVP | Entschieden | Keine geschätzten Werte ohne Bedarf |
| D-227 | Anrede in der Oberfläche „du" | Entschieden, änderbar | Üblich in Fitness-Apps; Rückfrage Q-10 |
| D-228 | Mindestziel iOS und iPadOS 18.4, macOS mit Safari 18.4 oder aktuellem Chrome; Referenz ist die jeweils aktuelle Version | Entschieden | Ab 18.4 funktioniert Wake Lock in installierten Web-Apps. Ältere Versionen laufen ohne Wake Lock |
| D-229 | Routen mit deutschen Pfaden ohne Umlaute (z. B. `/heute`, `/training/einheit/:id`) | Entschieden | Einheitlich zur Oberfläche |
| D-230 | Basisbibliothek, Beispielvorlagen und später generische Lebensmittel sind gebündelte, versionierte Stammdaten; sie werden nicht synchronisiert | Entschieden | Gleiche Daten auf allen Geräten derselben App-Version; nur Nutzerdaten werden synchronisiert |
| D-231 | Hosting auf Vercel (Hobby-Plan, kostenlos, nur persönliche Nutzung) mit Build aus dem privaten Repository; Hauptzweig `main` ist die Produktivadresse `<projekt>.vercel.app`, jeder andere Branch erhält eine Vorschau-Adresse. Supabase dient erst ab R3 für Anmeldung und Synchronisierung, nicht für das Hosting | Entschieden am 18.10.2026 auf Rückfrage des Produktinhabers | Supabase bietet kein eigenes Hosting für Web-Apps; der Umweg über Storage hat keine SPA-Weiterleitung und keine eigenen Header, und kostenlose Projekte pausieren nach 7 Tagen, die App wäre dann nicht erreichbar. Vercel verbindet private GitHub-Repositories direkt, erkennt Vite, setzt Header über `vercel.json` und ist für persönliche Nutzung kostenlos (laut Sekundärquellen 100 GB Datentransfer pro Monat, für diese App reichlich). Cloudflare Pages wäre gleichwertig; Vercel ist für die Einrichtung durch den Produktinhaber einfacher. Ein späterer Wechsel betrifft nur `vercel.json` |
| D-232 | Modulgrenzen über die ESLint-Regel `no-restricted-imports` mit Pfad-Aliasen (`@/shared`, `@/modules/<name>`) statt eslint-plugin-boundaries | Entschieden | Keine zusätzliche Abhängigkeit, die mit ESLint 10 erst erprobt werden müsste; die Regeln aus `architecture.md` Abschnitt 4 bleiben gleich |
| D-233 | Formatierung de-CH: Schweizer Tausendertrennzeichen („1’234“ bzw. „1'234“), aber Dezimalkomma statt Punkt | Entschieden in M0 | AK-SET-04 verlangt ein Dezimalkomma; `Intl` liefert für de-CH einen Punkt. Das Dezimalzeichen wird deshalb ersetzt. Das Tausendertrennzeichen kommt aus den Sprachdaten des Systems und unterscheidet sich je nach Version (ICU 77: „’“, ICU 78: „'“). Eingaben akzeptieren weiterhin Komma und Punkt. Betrifft nur Geräte mit Sprache oder Region Schweiz |
| D-234 | Jedes Dokument trägt sein Typfeld `type`; das Repository erhält Felder, die das Schema nicht kennt, beim Lesen und Schreiben | Entschieden in M0 | `type` unterscheidet Dokumente in gemeinsamen Tabellen (z. B. Einstellungen und Profil in `singletons`) und im Export. Unbekannte Felder bleiben, damit eine ältere App-Version Daten einer neueren nicht still verkürzt (Vorbereitung auf Sync und Import) |
| D-235 | Fester Namensraum für deterministische IDs (UUID v5): `a9f1c5d1-6d1e-4d1d-b94d-d8ca701b9904`; SHA-1 dafür im eigenen Code | Entschieden in M0 | Der Namensraum darf sich nie ändern, sonst ändern sich alle abgeleiteten IDs (z. B. Einstellungen, Basisübungen). Eigenes SHA-1, weil `crypto.subtle` nur asynchron arbeitet; geprüft mit Referenzwerten |
| D-236 | Zwei Farbtokens nach dem automatischen Kontrasttest angepasst: `--border-input` hell `#8A93A1` → `#828b99`; `--meter-track` dunkel `#184f95` → `#15365f` | Entschieden in M0 | Der alte Eingaberahmen lag auf dem Seitenhintergrund bei 2,97:1 und auf Fläche 2 bei 2,82:1 (Grenze 3:1); neu 3,30, 3,44 und 3,13. Die alte dunkle Spur des Fortschrittsbalkens hatte zur Füllung nur 2,23:1; neu 3,35:1 |
| D-237 | Die lokale Vorschau für E2E-Tests (`vite preview`) sendet dieselben Sicherheits-Header wie Vercel; sie werden aus `vercel.json` gelesen | Entschieden in M0 | Verstöße gegen die Content Security Policy fallen so schon in den Tests auf; die Header sind nur an einer Stelle gepflegt |
| D-238 | Arbeit über mehrere Sitzungen: je Meilenstein oder größerem Arbeitspaket eine eigene Claude-Sitzung; Übergabe über Pull Requests und die Dokumente im Repository. `CLAUDE.md` enthält die Arbeitsregeln, ein Start-Hook (`.claude/hooks/session-start.sh`) installiert in Cloud-Sitzungen die Abhängigkeiten | Entschieden am 18.10.2026 auf Rückfrage des Produktinhabers | Frische Sitzungen arbeiten zuverlässiger als eine sehr lange, deren frühe Teile nur noch zusammengefasst vorliegen. Weil Stand und Entscheidungen vollständig im Repository stehen, geht beim Wechsel nichts verloren. Sitzungen laufen nacheinander, nicht parallel auf denselben Dateien; ein Pull Request wird von der Sitzung betreut, die ihn angelegt hat |
| D-239 | Ladezustand: Bis gespeicherte Werte gelesen sind, zeigt eine Ansicht einen ruhigen Platzhalter in der Form des Inhalts (`Skeleton`, ohne Animation; der Bereich trägt `aria-busy`). Auswahlen und Eingaben erscheinen erst mit den gespeicherten Werten, nie vorab mit Standardwerten | Entschieden in M0 (Nachtrag) | Mit Standardwerten zeigte die Einstellungsseite kurz „Hell" als gewählt und sprang nach dem Laden mit einem Farbübergang um; in der CI fiel das als Kontrastfehler auf (`testing.md` Abschnitt 10). Setzt `design-system.md` Abschnitt 7 um („Skelett in der Form des Inhalts"). E2E-Tests warten, bis kein Bereich mehr `aria-busy` trägt |
| D-240 | Schlüssel der Basisübungen in Kleinbuchstaben mit Unterstrich ohne Präfix (z. B. `bench_press_barbell`); die ID entsteht per UUID v5 aus `core-exercise:<Schlüssel>` | Entschieden in M1 | Vereinheitlicht `sample-templates.md` (bisher `core.bench_press_barbell`) mit `data-model.md` und dem Test in `uuid.test.ts`. Schlüssel ändern sich nie, sonst ändern sich die IDs |
| D-241 | Zwei weitere Erfassungsarten: `time_distance` (Dauer und Distanz) und `assisted_reps` (Entlastung in kg × Wiederholungen). Distanz wird in Metern gespeichert (`distanceM`) und je Übung in m oder km eingegeben und angezeigt (`distanceUnit`); die Entlastung steht in `assistKg`, nie in `weightKg`. Volumen und geschätztes 1RM entstehen nur aus Gewicht × Wiederholungen. Bester Satz: bei Entlastung die geringste Entlastung, bei Gleichstand mehr Wiederholungen; bei Dauer und Distanz die größte Distanz | Entschieden in M1 auf Antwort des Produktinhabers (Q-05) | Der Produktinhaber braucht Distanz an Cardiogeräten und unterstützte Klimmzüge und Dips. Ein eigenes Feld für die Entlastung verhindert, dass sie als Last ins Volumen oder in Bestleistungen eingeht. Das Rudergerät zählt in Metern, Laufband, Fahrradergometer und Crosstrainer in Kilometern |
| D-242 | Übungsbibliothek in der App: Die Basisübungen liegen in einer eigenen, nachgeladenen Datei (`core-exercises.v1.json`), die der Service Worker vorab speichert. Die Seite `/uebungen` gehört zum Bereich Training; Suche und Filter stehen in der Adresse (`?q=…&muskel=…&geraet=…`). Der Muskelfilter prüft nur Hauptmuskeln. Ohne Suche und Filter ist die Liste nach Gruppen gegliedert, sonst nach Rang (Name beginnt mit der Suche, Treffer im Namen, Treffer im Alias) und alphabetisch | Entschieden in M1 | Die Daten (rund 5 KB gzip, mit eigenen Übungen und Medien später mehr) verlangsamen so nicht den Start der App und sind trotzdem offline da. Suche und Filter bleiben bei Zurück und Neuladen erhalten. Nebenmuskeln im Filter brächten zu viele unpassende Treffer (z. B. Bankdrücken unter Trizeps) |
| D-243 | Beispielvorlagen in der App: Die Daten entstehen aus den Tabellen in `sample-templates.md` (`tools/sample_templates_from_md.py`). Ein einzelner Aufwärmsatz hat 5 Wiederholungen. „3 je Seite" heißt drei Sätze, jeder Satz umfasst beide Seiten; Wiederholungen und Zeit gelten je Seite. Zeitziele sind Bereiche wie Wiederholungen (`durationMinSec`, `durationMaxSec`). Drop-Sätze gehören zum letzten Arbeitssatz und haben keine Pause. Die Liste steht unter `/training/programme`, eine Vorlage unter `/training/vorlagen/:key` (S-49); wiederholte Tage (Woche 1: A, B, A) erscheinen in der Ansicht einmal | Entschieden in M1, änderbar | Das Dokument bleibt die eine Quelle der Vorlagen, eine Abweichung fällt in der CI auf. Sätze je Seite wie in den meisten Trainingsplänen; so passt ein Satz in eine Satzzeile des Players. `sample-templates.md` legte die Wiederholungen eines einzelnen Aufwärmsatzes nicht fest; 5 entspricht dem zweiten, „mittleren" Satz |

## D. Datenquellen

| ID | Entscheidung | Status | Prüfschritt |
|---|---|---|---|
| D-301 | Generische Lebensmittel: Bundeslebensmittelschlüssel 4.0 (Max Rubner-Institut, CC BY 4.0, rund 7.140 Lebensmittel mit deutschen Namen) als gebündelte, offline verfügbare Quelle | Vorgesehen | Prüfspike S-2 zu Beginn von M5; Alternative ist die Schweizer Nährwertdatenbank |
| D-302 | Markenprodukte und Barcode: Open Food Facts | Vorgesehen, nicht verbindlich | Prüfspike S-1 zu Beginn von M6: CORS von der Produktivadresse, User-Agent-Anforderung im Browser, Limits, Lizenzpflichten, Datenschutzhinweis. Rückfallebene ist eine Supabase Edge Function als Proxy |
| D-303 | USDA FoodData Central nicht vorgesehen | Entschieden | Englische Bezeichnungen; BLS deckt den Bedarf |
| D-304 | Übungsdaten aus eigener Basisbibliothek (D-213); wger und free-exercise-db nur als spätere optionale Importquelle | Entschieden | Lizenzprüfung je Übung bei wger nötig |
| D-305 | Barcode-Erkennung über das Paket `barcode-detector` (Polyfill auf Basis von zxing-wasm), weil Safari `BarcodeDetector` nicht standardmäßig anbietet | Vorgesehen | Prüfspike S-3 auf dem iPhone zu Beginn von M6 |

Details, Quellen und Prüfkriterien stehen in `data-sources.md`.

## E. Offene Fragen

### E.1 Blockierend für Meilenstein M0 (nicht für die Planung)

| Nr. | Frage | Empfehlung |
|---|---|---|
| Q-01 | Darf ich Code, Dokumente und CI in einem neuen privaten GitHub-Repository führen? | Beantwortet am 18.10.2026: ja, `darad11/fitness-app`, privat. Diese Sitzung darf keine Repositories anlegen; der Produktinhaber legt es leer an, danach binde ich es an und lade alles hoch |
| Q-02 | Welches Hosting und welche feste Adresse? | Beantwortet am 18.10.2026: Vercel (D-231). Produktivadresse `https://fitness-app-mu-drab.vercel.app` (von Vercel vergeben, Projekt `fitness-app`). Sie muss bis zur ersten echten Datennutzung (M1) unverändert bleiben; eine Änderung oder eigene Domain wäre vorher einzurichten. Vercel ist mit dem Repository verbunden |

### E.2 Nicht blockierend, mit Standardentscheidung

| Nr. | Frage | Standard bis zur Antwort |
|---|---|---|
| Q-03 | Name der App | Arbeitstitel „Fitness" (D-222) |
| Q-04 | Geräte und Versionen (iPhone, iPad, Mac; Safari oder Chrome am Mac) | Mindestziel 18.4, Referenz aktuelle Versionen (D-228) |
| Q-05 | Prüfung der deutschen Basisübungsliste | Beantwortet am 18.10.2026: Durchsicht des Entwurfs mit fünf Rückfragen; 105 Übungen, Antworten in `exercise-library.md` Abschnitt 3 (D-241) |
| Q-06 | Prüfung der Beispielvorlagen | `sample-templates.md` |
| Q-07 | Zählen Aktivitäten wie Laufen zum Wochenziel? | Ja (D-220) |
| Q-08 | Einwilligung für Open-Food-Facts-Abfragen (Barcode, Suchbegriff und IP gehen an Open Food Facts) | Einmalige Einwilligung vor der ersten Online-Abfrage, jederzeit widerrufbar (R2) |
| Q-09 | Supabase-Konto und Region | Neues Projekt in der EU (Frankfurt) zu Beginn von R3 |
| Q-10 | Anrede und Designrichtung | „du", Akzentfarbe Blau, Systemschrift (D-227, `design-system.md`) |
| Q-11 | Welche Xeela-Funktionen nutzen Sie heute täglich, welche nie? | Dient der Prioritätsprüfung von R2 bis R4 |
| Q-12 | Screenshots oder Bildschirmaufnahmen aus Xeela (Liste in `product-research.md` Abschnitt 11) | Optional; nur zum Verständnis von Abläufen |

## F. Phase-1-Fragen und ihr Stand

| Phase-1-Frage | Stand |
|---|---|
| F-01 Vorlagen oder Builder | Beantwortet: Builder plus gekennzeichnete Beispielvorlagen (D-106, D-107) |
| F-02 Übungsquelle | Entschieden: eigene Basisbibliothek (D-213, D-304) |
| F-03 Lebensmitteldaten | Beantwortet und geprüft (D-110, D-301 bis D-303) |
| F-04 Satztypen | Beantwortet (D-108) |
| F-05 MVP-Umfang | Beantwortet: Training plus Körpergewicht plus Dashboard (D-111) |
| F-06 Zeitpunkt der Sync | Entschieden: R3 nach der Ernährung (D-219) |
| F-07 Supabase-Konto und Region | Offen als Q-09 |
| F-08 Fotos | Beantwortet: lokal (D-114) |
| F-09 Schritte | Beantwortet: manuell oder Kurzbefehl (D-115) |
| F-10 Gewohnheiten, Challenges | Beantwortet: Gewohnheiten später; persönliche Challenges im Backlog (D-117) |
| F-11 UI-Sprache | Beantwortet: Deutsch (D-103, D-212) |
| F-12 Zielgeräte | Teilweise beantwortet: iPhone, iPad, Mac (D-101); Versionen offen als Q-04 |
| F-13 Hosting | Beantwortet: Vercel (D-231) |
| F-14 Repository | Beantwortet: `darad11/fitness-app` (Q-01) |
| F-15 Tägliche Nutzung von Xeela | Offen als Q-11 |
| F-16 Screenshots | Offen als Q-12 |
| F-17 Designrichtung | Standard gesetzt, Rückfrage Q-10 |
| F-18 App-Name | Standard gesetzt, Rückfrage Q-03 |
| F-19 Kalorienstandards | Verschoben nach R2 |
| F-20 Streak-Regel | Verschoben nach R4 |
