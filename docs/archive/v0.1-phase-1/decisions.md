# Entscheidungsprotokoll

Stand: 17.10.2026 · Phase 1

Format: ID · Titel · Status (Festgelegt durch Auftrag, Vorgeschlagen, Entschieden, Verworfen) · Kontext · Entscheidung · Folgen. Vorgeschlagene Einträge sind erst nach Bestätigung durch den Produktinhaber gültig.

## A. Durch den Auftrag festgelegt

| ID | Entscheidung | Folgen |
|---|---|---|
| D-001 | Web-App zuerst, später PWA; keine native App in Phase 1 bis 8 | Browser-Grenzen gelten (siehe `known-limitations.md`) |
| D-002 | React, TypeScript, Vite | Stack in `architecture.md` |
| D-003 | Local-first mit lokaler Datenbank; localStorage nur für UI-Präferenzen | IndexedDB ist führend |
| D-004 | Supabase für optionale Sync und Auth, sofern bestätigt | Postgres mit RLS; eigene Engine |
| D-005 | Ein Nutzer, keine Multi-User-Plattform, keine kommerziellen Funktionen | Xeela-Funktionen Abo, Paywall, Referral, Sweat Equity, Shop, Wettbewerb entfallen |
| D-006 | Eigenständiger Code und eigenständiges Design; keine geschützten Inhalte | Eigene Programme, offene Übungs- und Lebensmitteldaten |
| D-007 | Keine Microservices, keine unnötigen Abstraktionen | Modularer Monolith im Client |

## B. Vorgeschlagen (Bestätigung ausstehend)

| ID | Vorschlag | Kontext und Begründung | Alternative |
|---|---|---|---|
| D-010 | Dexie 4 als Zugriffsschicht auf IndexedDB | Indizes, Transaktionen, Migrationen, `useLiveQuery`; Safari-tauglich | SQLite-WASM (nur sinnvoll mit PowerSync) |
| D-011 | React Router v7 im Library-Modus | Verbreitet, stabil, ausreichend | TanStack Router |
| D-012 | Tailwind CSS v4 mit eigenen Tokens, Radix-Primitives in eigenen Komponenten, Lucide-Icons | Schnell, konsistent, barrierearm, kein Kit-Look | CSS Modules ohne Framework |
| D-013 | Zod als einzige Quelle für Typen und Validierung | Eine Definition für Eingabe, Import, Sync | Valibot |
| D-014 | date-fns; Speicherung ISO UTC plus `dayKey` und `tz` | Zeitzonenstabile Tagesauswertung | Luxon |
| D-015 | Recharts für Diagramme | Einfach, SVG, zugänglich | uPlot bei Performancebedarf |
| D-016 | vite-plugin-pwa mit Workbox; Update per Bestätigung | Standardwerkzeug; kein Zwangsreload im Training | Eigener Service Worker |
| D-017 | Eigene, schlanke Sync-Engine auf Supabase statt PowerSync, ElectricSQL oder Dexie Cloud | Ein Nutzer, überschaubares Volumen, volle Kontrolle, Supabase-Vorgabe; Metadaten und Konfliktregeln dokumentiert | PowerSync, falls die eigene Engine in Phase 8 zu aufwendig wird (Postgres-Schema bleibt nutzbar) |
| D-018 | UUID v4 per `crypto.randomUUID()` | Stabil über Geräte, keine Server-Vergabe | ULID |
| D-019 | Sync-Metadaten (`rev`, `updatedAt`, `deletedAt`, `deviceId`) und Outbox ab Phase 3 | Vermeidet Migration über alle Tabellen in Phase 8 | Erst in Phase 8 (abgelehnt) |
| D-020 | pnpm, ESLint, Prettier, GitHub Actions | Standard | npm, Biome |
| D-021 | Statisches Hosting mit HTTPS | PWA-Voraussetzung | Eigenes Hosting |
| D-022 | Vitest, Testing Library, fake-indexeddb, Playwright mit Chromium und WebKit | WebKit deckt Safari-Verhalten ab | Cypress |
| D-023 | Navigation: Heute, Training, Ernährung, Fortschritt, Mehr; Schnellaktion „+" | Kurze Wege für tägliche Aufgaben; Xeela-Muster bestätigt | Planung als fünfter Tab statt Mehr |
| D-024 | Formeln: Mifflin-St Jeor plus Aktivitätsfaktor; Epley für e1RM; Double Progression als Progressionsregel | Dokumentiert, nachvollziehbar, einstellbar | Harris-Benedict, Brzycki, feste Prozentschritte |
| D-025 | Kommerzielle und soziale Xeela-Funktionen verwerfen (ON-16, ON-17, CH-02, CH-03, CH-05, CH-09) | Nicht relevant für persönliche Nutzung | Social Sharing optional als P3 |
| D-026 | Fortschrittsfotos zuerst lokal; Cloud-Upload erst mit Phase 8 und nur nach Zustimmung | Speicher, Kosten, Datenschutz | Von Anfang an Cloud |
| D-027 | Streak-Regel: aufeinanderfolgende geplante Trainingstage mit abgeschlossener Einheit; Ruhetage unterbrechen nicht | Vorhersagbar, entspricht Ziel „Konsistenz" | Wochenziel-Streak (x Einheiten pro Woche) |
| D-028 | Intern metrische Einheiten; imperial nur in der Anzeige | Eindeutige Speicherung | Einheit pro Datensatz speichern |
| D-029 | Sprache der UI zunächst Deutsch mit vorbereiteter Lokalisierung (de, en) | Produktinhaber schreibt Deutsch; App-Store-Link aus Österreich | Nur Englisch |
| D-030 | Kein Analytics- oder Tracking-SDK; Fehlerprotokoll lokal | Datenschutz, Datensparsamkeit | Selbst gehosteter Fehlertracker später |

## C. Offene Produktentscheidungen (Fragen an den Produktinhaber)

Zu jeder Frage steht eine Empfehlung. Die Antworten fließen in die Spalte Entscheidung der Funktionsmatrix.

| Nr. | Frage | Optionen | Empfehlung |
|---|---|---|---|
| F-01 | Sollen Xeela-ähnliche vorgefertigte Programme nachgebaut werden oder liegt der Schwerpunkt auf einem flexiblen Programm-Builder mit wenigen Startvorlagen? | (a) Nur Builder, (b) Builder plus drei bis fünf generische Vorlagen, (c) eigene Programme des Produktinhabers als Vorlagen erfassen | (b), ergänzt um (c), falls eigene Pläne vorliegen |
| F-02 | Welche Übungsquelle ist akzeptabel: offene Datenbank mit Bildern (Public Domain oder CC-BY-SA), eigene Übungsliste oder beides? | (a) free-exercise-db, (b) wger, (c) nur eigene | (a) mit Möglichkeit eigener Übungen und optionaler Videolinks |
| F-03 | Lebensmitteldaten: Open Food Facts online (Barcode, Marken) plus eigene Einträge, oder ausschließlich eigene Einträge ohne externe Abfragen? | (a) OFF plus eigene, (b) nur eigene, (c) zusätzlich USDA-Import | (a), USDA optional später |
| F-04 | Trainieren Sie mit Supersätzen, Drop-Sets, Aufwärmsätzen, RPE? Welche davon braucht der Player ab Phase 4? | Beliebige Kombination | Aufwärmsätze und Drop-Sets früh (klein), Supersätze Phase 6, RPE optional |
| F-05 | MVP-Umfang Phase 4: nur Training (wie im Auftrag) oder zusätzlich Gewichtserfassung als Mini-Funktion? | (a) Nur Training, (b) Training plus Gewicht | (b), weil Gewicht klein ist und das Dashboard sinnvoll füllt |
| F-06 | Wann soll Sync kommen: nach Ernährung (Phase 8 wie geplant) oder früher, weil Daten sonst nur per Export gesichert sind? | (a) Phase 8, (b) direkt nach Phase 4 | (a) mit frühem Export; (b) nur wenn Sie sofort auf mehreren Geräten arbeiten wollen |
| F-07 | Besteht bereits ein Supabase-Konto oder -Projekt? Welche Region? | – | Neues Projekt in der EU (Frankfurt) |
| F-08 | Fortschrittsfotos: lokal, in der Cloud oder gar nicht? | (a) Lokal, (b) Cloud nach Zustimmung, (c) keine | (a) zuerst, (b) ab Phase 8 |
| F-09 | Schritte: manuell, per iOS-Kurzbefehl-Brücke (benötigt Sync) oder weglassen? | (a) Manuell, (b) Kurzbefehl, (c) weglassen | (a) in Phase 6, (b) in Phase 9 prüfen |
| F-10 | Gewohnheiten und persönliche Challenges: gewünscht oder verzichtbar? | (a) Gewohnheiten ja, Challenges nein, (b) beides, (c) keines | (a) |
| F-11 | UI-Sprache Deutsch, Englisch oder beides? Lebensmittelnamen bevorzugt Deutsch? | – | Deutsch zuerst, Englisch vorbereitet |
| F-12 | Zielgeräte und Browser: iOS-Version, iPad-Modell, macOS-Browser (Safari oder Chrome)? | – | Mindestens iOS 16.4 für Web Push; Safari als Referenz |
| F-13 | Hosting: Cloudflare Pages, Netlify, Vercel, GitHub Pages oder eigener Server? Eigene Domain? | – | Cloudflare Pages oder Netlify mit eigener Domain |
| F-14 | Repository: lokal hier anlegen und auf GitHub veröffentlichen (privat)? | – | Privates GitHub-Repository |
| F-15 | Welche Xeela-Funktionen nutzen Sie heute tatsächlich täglich, welche nie? | Freitext | Dient der Prioritätsprüfung |
| F-16 | Können Sie Screenshots oder Aufnahmen gemäß `product-research.md`, Abschnitt 11, bereitstellen? | – | Priorität A reicht für Phase 2 |
| F-17 | Designrichtung: Farbakzent, Vorbilder (nicht Xeela), bevorzugte Typografie, Dark Mode als Standard? | – | Neutrale Basis mit einem Akzent; Systemschrift; Light Standard, Dark optional |
| F-18 | Soll die App einen Namen bekommen (Arbeitstitel fehlt)? | Freitext | Benötigt für Manifest und Icon |
| F-19 | Kalorienziel: Standardanpassung (−500/+300 kcal) und Proteinwert (1,8 g/kg) akzeptabel? | Werte | Standard übernehmen, einstellbar |
| F-20 | Streak-Regel laut D-027 akzeptabel? | (a) Ja, (b) Wochenziel | (a) |
