# Supabase: SQL des Servers

`migrations/` enthält das SQL des Supabase-Projekts „fitness-app“ wortgleich und mit denselben Versionen wie auf dem Server (Tabelle `supabase_migrations.schema_migrations`, D-349). Eine Datei hier ändert den Server nicht; eingespielt wird nur mit Zustimmung des Produktinhabers.

| Datei | Inhalt |
|---|---|
| `migrations/20261019145316_sync_documents.sql` | Tabelle `sync_documents` mit Sequenz, Index, RLS und Rechten, erste Fassung von `push_documents` (D-269) |
| `migrations/20261019145346_push_documents_column_names.sql` | `push_documents` mit eindeutigen Spaltennamen im ON CONFLICT |
| `migrations/20261024055418_push_documents_lock_per_account.sql` | Sperre je Konto in `push_documents` (A-05, D-349) |
| `migrations/20261024063941_sync_documents_restrict_rights.sql` | Rechte auf das Nötige: `authenticated` nur SELECT, INSERT, UPDATE und USAGE an der Sequenz, `anon` nichts (A-15, D-350) |
| `rollback/push_documents_lock_per_account_revert.sql` | nimmt die Sperre zurück: `push_documents` wieder wie in `20261019145346` |
| `rollback/sync_documents_restrict_rights_revert.sql` | gibt die Standardrechte von Supabase zurück |

Eine neue Änderung am Server:

1. Neue Datei in `migrations/`, dazu eine Datei zum Zurücknehmen in `rollback/`. Dateien in `rollback/` laufen nie von selbst. In `tools/test-db.mjs` unter `CHECKED` eintragen, welche Werte des Stands sich ändern dürfen.
2. `pnpm test:db`: frische Datenbank mit einer Nachbildung von Supabase, alle Migrationen der Reihe nach, Tests aus `tools/db/`.
3. Nach Zustimmung einspielen. Die Datei bekommt die Version, die der Server vergibt; die gespeicherte Migration muss byte-gleich mit der Datei sein. Den Stand mit `tools/db/snapshot.sql` vorher und nachher vergleichen.

Neue Tabellen bekommen die Standardrechte von Supabase (alle Rechte für `anon` und `authenticated`). Eine Migration für eine neue Tabelle schränkt die Rechte deshalb selbst ein, wie `20261024063941`.

`pnpm test:db` braucht ein Postgres mit Superuser-Konto, Verbindung über `PGHOST`, `PGPORT`, `PGUSER` und `PGPASSWORD`. In der CI läuft es im Job „Datenbank (Postgres 17)“. Gegenproben: `node tools/test-db.mjs --bis 20261019145346` (vor der Sperre) und `--bis 20261024055418` (vor den eingeschränkten Rechten) müssen fehlschlagen.
