# Architekturempfehlung

Stand: 17.10.2026 · Phase 1 · Status: Empfehlung zur Bestätigung

## 1. Ziele und Randbedingungen

Aus dem Auftrag abgeleitet:

- Responsive Web-App zuerst, später als PWA auf iPhone, iPad und Mac installierbar. Keine native App in Phase 1 bis 8.
- Local-first: Kernfunktionen laufen ohne Netz; lokale Daten sind führend; nichts hängt an einem Server-Roundtrip.
- Optionale geräteübergreifende Synchronisierung über Supabase mit echter Konfliktbehandlung.
- Ein Nutzer, keine Multi-User-Plattform, kein kommerzielles Modell. Erweiterbarkeit bleibt möglich.
- Modular, wartbar, ohne Microservices, ohne überdimensioniertes State-Management.
- Historische Daten dürfen durch spätere Änderungen an Stammdaten nicht verfälscht werden.

## 2. Empfehlung in Kürze

Der im Auftrag genannte Ausgangspunkt wird bestätigt. Es gibt keine stillschweigenden Änderungen. Ergänzungen sind als solche markiert.

| Baustein | Empfehlung | Begründung | Geprüfte Alternative |
|---|---|---|---|
| UI-Framework | React 19 mit TypeScript (strict) | Vorgabe; größtes Ökosystem; langfristig wartbar | – |
| Build | Vite | Vorgabe; schnell; gute PWA-Integration | – |
| Routing | React Router v7 (Library-Modus, Lazy Routes) | Verbreitet, stabil, ausreichend für eine SPA ohne Server | TanStack Router (bessere Typisierung, kleinere Community); wählbar, falls gewünscht |
| Styling und Komponenten (Ergänzung) | Tailwind CSS v4 mit eigenen Design-Tokens als CSS-Variablen; zugängliche Primitives (Radix UI) in eigene Komponenten gekapselt; Icons Lucide | Schnelle, konsistente Umsetzung; Barrierefreiheit über Primitives; kein Vendor-Lock, Komponenten liegen im Repo | CSS Modules ohne Tailwind (mehr Handarbeit); fertige Komponentenkits (generischer Admin-Look, schwer anzupassen) |
| Lokale Datenbank | IndexedDB über Dexie 4 mit `dexie-react-hooks` (`useLiveQuery`) | Vorgabe geprüft und bestätigt: strukturierte Daten, Indizes, Transaktionen, Migrationen, reaktive Abfragen; Safari-tauglich | SQLite-WASM mit OPFS (mächtiger, aber Safari-Reibung, größeres Bundle, nötig nur für PowerSync); localStorage (ungeeignet) |
| Validierung und Typen (Ergänzung) | Zod-Schemas als einzige Quelle für Entitätstypen, Validierung bei Eingabe, Import und Sync | Eine Definition für Typen, Laufzeitprüfung und Migration | io-ts, Valibot (gleichwertig, kleiner verbreitet) |
| Datum und Zeit (Ergänzung) | date-fns; Speicherung als ISO-8601 UTC plus lokaler Tagesschlüssel `dayKey` und Zeitzone | Tageslogik (Ernährung, Gewohnheiten) muss zeitzonenstabil sein | Luxon, Day.js |
| Diagramme (Ergänzung) | Recharts (SVG) mit eigenem Theme; bei Performance-Bedarf uPlot | Einfach, zugänglich, ausreichend für Verlaufslinien und Balken | visx (mehr Aufwand), Chart.js (Canvas, weniger zugänglich) |
| PWA | vite-plugin-pwa (Workbox): Precache der App-Shell, Runtime-Caching für Medien, Update-Hinweis statt Zwangsreload | Vorgabe; Workbox ist der Standard | Handgeschriebener Service Worker (mehr Fehlerquellen) |
| Cloud (optional) | Supabase: Postgres, Auth, Storage, Row Level Security; eigene, schlanke Sync-Engine im Client | Vorgabe bestätigt; Postgres mit RLS ist für einen Nutzer sicher und günstig | PowerSync oder ElectricSQL (fertige Sync, aber zusätzlicher Dienst und SQLite-Zwang); Dexie Cloud (einfachste Sync, aber anderer Anbieter statt Supabase); Firebase (kein SQL, Lock-in) |
| Tests | Vitest, Testing Library, fake-indexeddb; Playwright (Chromium und WebKit) für Workflows | Vorgabe; WebKit-Läufe decken Safari-Verhalten ab | Jest (langsamer mit Vite), Cypress |
| Tooling | pnpm, ESLint (typescript-eslint), Prettier, GitHub Actions | Standard, reproduzierbar | npm, Biome |
| Hosting | Statisches Hosting mit HTTPS (Cloudflare Pages, Netlify, Vercel oder GitHub Pages) | PWA, Kamera und Service Worker brauchen HTTPS | Eigenes Hosting |

Bewusst nicht vorgesehen: Next.js oder anderes Server-Rendering (keine SEO, kein Server nötig), Redux oder vergleichbare globale Stores (Daten leben in IndexedDB, UI-Zustand lokal), GraphQL, Microservices, Analytics-SDKs.

## 3. Systemübersicht

```
+-------------------------------------------------------------------+
|  Browser / installierte PWA (iPhone, iPad, Mac)                    |
|                                                                   |
|  UI-Schicht (React)                                               |
|   Seiten, Layouts, Designsystem, Navigation                       |
|            |  liest reaktiv (useLiveQuery)   |  ruft Aktionen     |
|            v                                 v                    |
|  Fachmodule (reines TypeScript, kein React)                       |
|   training | exercises | nutrition | recipes | body | activity    |
|   model (Zod) · calc (Formeln) · service (Use Cases) · data (Repo)|
|            |                                                      |
|            v                                                      |
|  Lokale Datenbank (Dexie / IndexedDB)  <----->  Sync-Engine       |
|   versionierte Tabellen, Outbox, Sync-State     Outbox, Pull,     |
|   Medien-Blobs                                   Merge, Backoff   |
|                                                       |           |
|  Service Worker (Workbox): App-Shell, Medien-Cache    |           |
+-------------------------------------------------------|-----------+
                                                        | HTTPS
                                 +----------------------v----------+
                                 |  Supabase (optional)            |
                                 |  Postgres + RLS · Auth ·        |
                                 |  Storage (private Fotos)        |
                                 +---------------------------------+
                                 Externe Datenquellen (nur lesend,
                                 dokumentiert): Open Food Facts,
                                 USDA FoodData Central, Übungsdaten
```

Grundsatz: Die UI schreibt nie direkt an Supabase. Jede Änderung geht in die lokale Datenbank; die Sync-Engine repliziert asynchron. Dadurch verhält sich die App online und offline identisch.

## 4. Modulstruktur

```
src/
  app/                    App-Shell, Router, Provider, Layouts, globale Styles
  modules/
    dashboard/            „Heute": Komposition aus den anderen Modulen
    training/             Programme, Pläne, Durchführung, Historie, Progression
    exercises/            Übungsbibliothek, eigene Übungen, Medien
    nutrition/            Lebensmittel, Protokoll, Ziele, Wasser
    recipes/              Rezepte, Wochenplan, Einkaufsliste
    body/                 Gewicht, Maße, Fotos
    activity/             Schritte, Gewohnheiten, Challenges
    calendar/             Kalenderansicht über alle Module
    profile/              Profil, Einstellungen, Einheiten
    sync/                 Supabase-Client, Sync-Engine, Auth, Konfliktlöser
    export/               Export, Import, Backup
  shared/
    ui/                   Designsystem: Button, Card, Sheet, NumberField, Timer …
    lib/                  Datum, Einheiten, Formatierung, IDs, Ergebnis-Typen
    db/                   Dexie-Datenbank, Schema, Migrationen, Basis-Repository
    sync/                 Sync-Metadaten, Entitätsregistrierung, Merge-Interfaces
    testing/              Fixtures, Test-Utilities, fake-indexeddb-Setup
public/                   Manifest, Icons
supabase/migrations/      SQL: Tabellen, RLS-Policies, Trigger
e2e/                      Playwright-Tests
docs/                     Dokumentation
tools/                    Skripte (z. B. Datenimport, Inventar-Export)
```

Jedes Fachmodul hat dieselbe innere Struktur:

- `model/`: Zod-Schemas, abgeleitete Typen, Invarianten.
- `calc/`: reine Funktionen (e1RM, Volumen, Nährwerte, Skalierung). Keine Seiteneffekte, vollständig unit-getestet.
- `data/`: Repositories über Dexie, Abfragen, Transaktionen.
- `service/`: Anwendungsfälle („Training starten", „Satz abschließen", „Woche bestätigen"), orchestrieren Repositories und Berechnungen.
- `ui/`: Seiten und Komponenten des Moduls.
- `index.ts`: öffentliche Schnittstelle. Andere Module importieren nur daraus.

Abhängigkeitsregeln (per ESLint-Regel `import/no-restricted-paths` erzwungen):

1. `ui` darf `service`, `data`, `model`, `calc` nutzen. Umgekehrt nie.
2. `model` und `calc` importieren kein React, kein Dexie, kein Supabase.
3. Module importieren keine Interna anderer Module, nur deren `index.ts`.
4. `sync` kennt Entitäten nur über eine Registrierung (Tabellenname, Schema, Merge-Regel), nicht über Modul-Interna.
5. `shared` importiert nichts aus `modules`.

## 5. Lokale Datenhaltung

- **Dexie-Datenbank** mit einer Tabelle pro Entität (siehe `data-model.md`). Jede synchronisierbare Tabelle trägt dieselben Metadaten: `id`, `createdAt`, `updatedAt`, `deletedAt`, `rev`, `deviceId`.
- **Schema-Versionierung**: Jede Änderung erhöht die Dexie-Version mit einer Upgrade-Funktion. Migrationen sind vorwärtsgerichtet, idempotent und getestet (fake-indexeddb mit Fixture der Vorversion).
- **Transaktionen**: Zusammengesetzte Schreibvorgänge (Satz abschließen und Session-Zeitstempel aktualisieren; Woche bestätigen und Einkaufsliste erzeugen) laufen in einer Dexie-Transaktion.
- **Reaktive Lesezugriffe**: `useLiveQuery` liefert UI-Updates ohne globalen Store.
- **Soft Delete**: Löschen setzt `deletedAt`. Abfragen filtern Tombstones. Endgültige Bereinigung erst nach erfolgreicher Sync und Ablauf einer Frist.
- **Medien**: Fotos als Blob in einer eigenen Tabelle, komprimiert (max. Kantenlänge und Qualität konfigurierbar), mit Thumbnail. Metadaten in `progress_photo`.
- **Speicherdruck**: `navigator.storage.estimate()` wird überwacht; ab Schwellwert Hinweis auf Sync oder Export.
- **localStorage** nur für UI-Präferenzen ohne Verlustfolgen (letzter Tab, eingeklappte Bereiche).

## 6. Zustandsverwaltung

- Fachdaten: ausschließlich IndexedDB, gelesen über `useLiveQuery`.
- Laufendes Training: ebenfalls in IndexedDB (`workout_session` mit Status `in_progress`). Die UI hält nur abgeleiteten Zustand (z. B. aktuell fokussierter Satz). Ein Reload stellt den Zustand aus der Datenbank wieder her.
- Timer: gespeichert wird der Endzeitpunkt (`restEndsAt`), nicht ein Zähler. Anzeige rechnet aus `Date.now()`; damit überleben Timer Tabwechsel, Sperrbildschirm und Reload.
- Flüchtiger UI-Zustand: React-State und URL-Parameter. Kein Redux, kein globaler Store. Sollte ein modulübergreifender flüchtiger Zustand nötig werden (z. B. Mini-Player des laufenden Trainings in jeder Ansicht), ist ein kleiner Zustand-Store (Zustand-Bibliothek) zulässig, begründet in `decisions.md`.

## 7. Routing und Navigation

Vorschlag für die Hauptbereiche (Details und Screen-Katalog in `design-system.md`):

- Mobil: Tab-Leiste mit Heute, Training, Ernährung, Fortschritt, Mehr; zentrale Schnellaktion „+".
- Desktop: Seitenleiste mit allen Bereichen, Inhalt zweispaltig wo sinnvoll (z. B. Trainingsplan links, Detail rechts).
- Routen sind flach (`/today`, `/training`, `/training/session/:id`, `/nutrition/:date`, `/recipes`, `/plan/:week`, `/shopping/:id`, `/progress`, `/habits`, `/calendar`, `/settings`). Höchstens drei Ebenen.
- Der laufende Trainings-Screen ist eine Vollbild-Route ohne Tab-Leiste, mit großem Eingabefeld und Tastaturkürzeln.

## 8. Synchronisierung (Entwurf)

Die Sync-Engine ist optional aktivierbar. Ohne Anmeldung bleibt alles lokal.

### 8.1 Metadaten und Identitäten

- IDs: UUID v4 per `crypto.randomUUID()`, clientseitig erzeugt, auf allen Geräten stabil.
- `rev`: pro Datensatz monoton steigende Ganzzahl, vom schreibenden Client erhöht.
- `updatedAt`: Client-Zeit (ISO UTC). Nur für Anzeige und als Tie-Breaker.
- `server_updated_at`: vom Server per Trigger gesetzt; einzige Grundlage für Pull-Cursor. Client-Uhren spielen für die Replikation keine Rolle.
- `deviceId`: pro Installation erzeugt; für Diagnose und Konfliktprotokolle.

### 8.2 Ablauf

1. **Schreiben**: Jede lokale Änderung schreibt den Datensatz und einen Outbox-Eintrag in derselben Transaktion (`sync_outbox`: Tabelle, ID, Operation, rev).
2. **Push**: Die Engine sendet Outbox-Einträge gebündelt als Upsert (`on_conflict=id`). Die Operation ist idempotent: gleiches `id` und `rev` erzeugen keine Duplikate. Ein Server-Trigger lehnt Upserts mit älterem `rev` ab und liefert die aktuelle Server-Version zurück.
3. **Konflikt**: Der Client führt die lokale und die Server-Version nach der Regel der Entität zusammen (siehe 8.3), schreibt das Ergebnis mit erhöhtem `rev` und sendet erneut.
4. **Pull**: Pro Tabelle `where server_updated_at > cursor order by server_updated_at limit n`. Jeder empfangene Datensatz wird nach derselben Regel gemerged. Cursor wird erst nach erfolgreichem Schreiben in IndexedDB fortgeschrieben.
5. **Auslöser**: App-Start, `online`-Ereignis, `visibilitychange` (sichtbar), nach lokalen Schreibvorgängen (entprellt), manuell. Kein Background Sync, da Safari ihn nicht unterstützt.
6. **Fehler**: Exponentielles Backoff pro Outbox-Eintrag; nach n Versuchen Markierung „benötigt Aufmerksamkeit" mit sichtbarem Hinweis; Fehlerprotokoll lokal ohne Nutzdaten.
7. **Wiederherstellung**: Outbox und Cursor liegen in IndexedDB; nach Absturz setzt die Engine fort. Ein Vollabgleich („alles neu laden") ist jederzeit möglich und überschreibt lokale Daten nur nach Merge-Regeln.

### 8.3 Konfliktregeln (Kurzfassung, Details im Datenmodell)

| Entitätstyp | Regel |
|---|---|
| Einstellungen, Profil, Ziele | Letzter Schreiber gewinnt (höheres `rev`, dann `updatedAt`) |
| Trainingseinheit (Session) | Status-Rangfolge: `completed` schlägt `in_progress` und `abandoned`; bei zwei `completed` gewinnt die mit mehr abgeschlossenen Sätzen, dann `updatedAt`. Eine abgeschlossene Einheit wird nie durch eine veraltete Kopie ersetzt |
| Sätze einer Einheit | Vereinigung nach Satz-ID; pro Satz letzter Schreiber; ein Satz mit Status `done` schlägt `planned` |
| Ernährungseinträge, Gewicht, Maße, Schritte, Gewohnheitslogs | Vereinigung nach ID; pro Datensatz letzter Schreiber; Duplikate gleicher Bedeutung werden per Idempotenzschlüssel vermieden |
| Lebensmittel, Übungen, Rezepte (Stammdaten) | Letzter Schreiber gewinnt; Rezeptbearbeitung erzeugt neue Version, alte Versionen werden nie überschrieben |
| Wochenplan, Einkaufsliste | Feldweise: Abhak-Status pro Position letzter Schreiber; Positionen Vereinigung |
| Löschungen | Tombstone gewinnt gegen ältere Änderungen; eine spätere Änderung (höheres `rev`) reaktiviert den Datensatz und wird protokolliert |

### 8.4 Sicherheit

- Alle Tabellen mit `user_id` und RLS-Policy `user_id = auth.uid()` für Select, Insert, Update, Delete.
- Supabase-Anon-Key ist per Design öffentlich; Schutz kommt ausschließlich aus RLS. Service-Role-Key existiert nie im Client.
- Fotos in privatem Storage-Bucket, Zugriff über signierte URLs mit kurzer Laufzeit; Pfad enthält `user_id`.
- Auth: E-Mail-Magic-Link oder Passkey; Sitzungen mit Refresh-Token; Abmelden löscht lokale Sitzungsdaten, nicht die Fachdaten (Rückfrage).

## 9. PWA-Strategie

- Manifest mit `display: standalone`, Icons, Theme-Farben, `start_url` auf Heute.
- Service Worker (Workbox): Precache der gebauten Assets; `NetworkFirst` für HTML-Navigation mit Offline-Fallback auf die Shell; `CacheFirst` mit Ablauf für Übungsbilder; keine Caches für Supabase-API-Antworten (Daten liegen in IndexedDB).
- Update-Verhalten: neue Version wird heruntergeladen, Nutzer bestätigt den Wechsel. Niemals Zwangsreload während eines laufenden Trainings.
- iOS-Besonderheiten: Installationsanleitung („Teilen", „Zum Home-Bildschirm"), da kein Install-Prompt; Push nur in installierter App ab iOS 16.4; Wake Lock während Trainings. Siehe `known-limitations.md`.

## 10. Externe Integrationen (nur lesend, dokumentiert)

| Zweck | Quelle | Lizenz | Nutzung |
|---|---|---|---|
| Barcode und Produktdaten | Open Food Facts API | ODbL (Namensnennung, Share-Alike für Datenbankweitergabe) | Online-Abfrage per Barcode oder Suche; Treffer werden als FoodItem mit Quelle `off` lokal gespeichert |
| Generische Lebensmittel | USDA FoodData Central | Public Domain | Optionaler Import einer Teilmenge (englische Namen) |
| Übungsbibliothek | free-exercise-db (Unlicense) oder wger (CC-BY-SA) | Offen | Einmaliger Import in die lokale Bibliothek mit Bildern; Quellenangabe in der App |
| Teilen | Web Share API | – | Optional |
| Schritte | Manuell oder iOS-Kurzbefehl, der Health-Daten an eine Supabase Edge Function sendet | – | Spätere Option, nur mit Sync |

Kein Dienst erhält Nutzdaten außer Supabase (bei aktivierter Sync) und Open Food Facts (Barcode oder Suchbegriff).

## 11. Qualität, Build und Betrieb

- TypeScript strict, ESLint mit Import-Grenzen, Prettier.
- Tests: siehe `testing.md`. Mindestanforderung: `calc/` und `service/` zu 90 % abgedeckt; alle Workflows aus dem Auftrag als Playwright-Tests in Chromium und WebKit.
- CI (GitHub Actions): Lint, Typecheck, Unit, E2E, Build, Lighthouse-PWA-Check.
- Releases: semantische Versionen; `CHANGELOG.md`; Datenbankmigrationen mit Versionsnummer im Changelog.
- Fehlerprotokoll lokal; optional später ein selbst gehosteter Fehlertracker. Keine Analytics.

## 12. Verworfene Alternativen (Kurzbegründung)

- **Capacitor oder React Native jetzt**: widerspricht der Vorgabe „Web zuerst"; bleibt als spätere Option für HealthKit und Watch.
- **PowerSync oder ElectricSQL jetzt**: lösen Sync gut, erzwingen aber SQLite-WASM im Client und einen weiteren Dienst. Für einen Nutzer mit überschaubarem Datenvolumen ist eine eigene, dokumentierte Engine beherrschbar. Das Postgres-Schema bleibt kompatibel, ein späterer Wechsel wäre ohne Neubau der Fachmodule möglich.
- **Dexie Cloud**: einfachste Sync für Dexie, aber anderer Anbieter als Supabase, geschlossener Server. Als Fallback notiert.
- **Server-Rendering (Next.js, Remix)**: kein Bedarf, erhöht Komplexität und Hosting-Kosten.
- **Globaler Store (Redux, MobX)**: IndexedDB plus `useLiveQuery` deckt den Bedarf ab.

## 13. Risiken und Gegenmaßnahmen

| Risiko | Auswirkung | Gegenmaßnahme |
|---|---|---|
| Safari löscht IndexedDB (Speicherdruck, lange Inaktivität im Browser-Tab) | Datenverlust ohne Sync | Installation als PWA empfehlen; Export-Erinnerung; frühe Sync-Option; Speicherüberwachung |
| Eigene Sync-Engine ist fehleranfällig | Datenverlust oder Duplikate | Metadaten von Anfang an; Konflikttests mit simulierten Geräten; Vollabgleich; keine harten Löschungen |
| Pausentimer-Signal bei gesperrtem Bildschirm | Verpasster Pausenende-Ton | Wake Lock während Training; große visuelle Anzeige; Hinweis in den Einstellungen |
| Lebensmitteldaten lückenhaft oder fehlerhaft | Falsche Tageswerte | Quellenkennzeichnung; Plausibilitätsprüfung; eigene Lebensmittel und Favoriten |
| Barcode-Scan im Browser langsamer als nativ | Bedienkomfort | WASM-Decoder, Autofokus-Hinweise, manuelle Eingabe als schneller Fallback |
| Umfang wächst schneller als Qualität | Halbfertige Funktionen | Definition of Done; Funktionsmatrix als Steuerinstrument; kleine Arbeitspakete |

## 14. Entscheidungsbedarf

Offene Architekturentscheidungen (Routing-Bibliothek, UI-Stack, Diagrammbibliothek, Hosting, Supabase-Region, Zeitpunkt der Sync-Einführung) sind in `decisions.md` mit Empfehlung aufgeführt.
