# Supabase: SQL des Servers

`migrations/` enthält das SQL des Supabase-Projekts „fitness-app“ wortgleich und mit denselben Versionen wie auf dem Server (Tabelle `supabase_migrations.schema_migrations`, D-349). Eine Datei hier ändert den Server nicht; eingespielt wird nur mit Zustimmung des Produktinhabers.

| Datei | Inhalt |
|---|---|
| `migrations/20261019145316_sync_documents.sql` | Tabelle `sync_documents` mit Sequenz, Index, RLS und Rechten, erste Fassung von `push_documents` (D-269) |
| `migrations/20261019145346_push_documents_column_names.sql` | `push_documents` mit eindeutigen Spaltennamen im ON CONFLICT |
| `migrations/20261024055418_push_documents_lock_per_account.sql` | Sperre je Konto in `push_documents` (A-05, D-349) |
| `rollback/push_documents_lock_per_account_revert.sql` | nimmt die Sperre zurück: `push_documents` wieder wie in `20261019145346` |

Eine neue Änderung am Server:

1. Neue Datei in `migrations/`, dazu eine Datei zum Zurücknehmen in `rollback/`. Dateien in `rollback/` laufen nie von selbst.
2. `pnpm test:db`: frische Datenbank mit einer Nachbildung von Supabase, alle Migrationen der Reihe nach, Tests aus `tools/db/`.
3. Nach Zustimmung einspielen. Die Datei bekommt die Version, die der Server vergibt; die gespeicherte Migration muss byte-gleich mit der Datei sein. Den Stand mit `tools/db/snapshot.sql` vorher und nachher vergleichen.

`pnpm test:db` braucht ein Postgres mit Superuser-Konto, Verbindung über `PGHOST`, `PGPORT`, `PGUSER` und `PGPASSWORD`. In der CI läuft es im Job „Datenbank (Postgres 17)“. Gegenprobe am Stand vor der Sperre: `node tools/test-db.mjs --bis 20261019145346` muss fehlschlagen.
