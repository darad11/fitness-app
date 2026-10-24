// Prüft die Migrationen des Servers an einem lokalen Postgres (A-05, D-349): frische Datenbank,
// Nachbildung von Supabase (tools/db/supabase-stub.sql), alle Dateien aus supabase/migrations/
// der Reihe nach, dann der Test zur Sperre je Konto (tools/db/push-lock.test.sql) und zuletzt das
// Zurücknehmen aus supabase/rollback/. Vor und nach der Sperre wird der Stand verglichen: Nur
// push_documents darf sich ändern, Tabelle, Rechte und Daten nicht.
//
// Verbindung über die Umgebungsvariablen von psql (PGHOST, PGPORT, PGUSER, PGPASSWORD) mit einem
// Konto mit Superuser-Rechten. Aufruf: node tools/test-db.mjs [--bis <Version>]
// Mit --bis laufen nur die Migrationen bis zu dieser Version, z. B. für die Gegenprobe am Stand
// vor der Sperre: node tools/test-db.mjs --bis 20261019145346 (muss fehlschlagen).
import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const DB = 'form_db_test';
const LOCK_MIGRATION = 'push_documents_lock_per_account';
const ROLLBACK = join(root, 'supabase/rollback/push_documents_lock_per_account_revert.sql');

const args = process.argv.slice(2);
const until = args.includes('--bis') ? args[args.indexOf('--bis') + 1] : undefined;
if (args.includes('--bis') && !/^\d{14}$/.test(until ?? '')) {
  console.error('--bis braucht eine Version mit 14 Ziffern, z. B. 20261019145346');
  process.exit(2);
}

function psql(label, psqlArgs, db = DB) {
  const result = spawnSync('psql', ['-X', '-q', '-v', 'ON_ERROR_STOP=1', '-d', db, ...psqlArgs], {
    encoding: 'utf8',
  });
  if (result.error) throw result.error;
  process.stderr.write(result.stderr);
  if (result.status !== 0) {
    console.error(`Fehlgeschlagen: ${label}`);
    process.exit(1);
  }
  return result.stdout;
}

function file(label, path) {
  psql(label, ['-f', path]);
}

function snapshot() {
  return JSON.parse(psql('Stand lesen', ['-At', '-f', join(root, 'tools/db/snapshot.sql')]));
}

/** Alles außer dem Text von push_documents muss gleich bleiben. */
function withoutBody(state) {
  const { prosrc_md5: _body, has_lock: _lock, ...fn } = state.function;
  return JSON.stringify({ ...state, function: fn });
}

const migrations = readdirSync(join(root, 'supabase/migrations'))
  .filter((name) => /^\d{14}_[a-z0-9_]+\.sql$/.test(name))
  .sort()
  .filter((name) => until === undefined || name.slice(0, 14) <= until);
if (migrations.length === 0) {
  console.error('Keine Migrationen gefunden');
  process.exit(1);
}

psql('Datenbank anlegen', ['-c', `drop database if exists ${DB} with (force)`], 'postgres');
psql('Datenbank anlegen', ['-c', `create database ${DB}`], 'postgres');
file('Nachbildung von Supabase', join(root, 'tools/db/supabase-stub.sql'));

let before;
let after;
for (const name of migrations) {
  const isLock = name.slice(15) === `${LOCK_MIGRATION}.sql`;
  if (isLock) before = snapshot();
  file(`Migration ${name}`, join(root, 'supabase/migrations', name));
  if (isLock) after = snapshot();
  console.log(`Migration eingespielt: ${name}`);
}

if (before && after) {
  if (before.function.has_lock || !after.function.has_lock) {
    console.error('Fehlgeschlagen: push_documents enthält die Sperre nicht (nur danach erwartet)');
    process.exit(1);
  }
  if (withoutBody(before) !== withoutBody(after)) {
    console.error('Fehlgeschlagen: Die Sperre hat mehr geändert als push_documents');
    console.error(`vorher:  ${withoutBody(before)}`);
    console.error(`nachher: ${withoutBody(after)}`);
    process.exit(1);
  }
  console.log('Stand vor und nach der Sperre: nur push_documents geändert');
}

file('Test zur Sperre je Konto', join(root, 'tools/db/push-lock.test.sql'));

if (before && after) {
  // Zurücknehmen: push_documents wieder wie vor der Sperre, Rechte unverändert.
  file('Zurücknehmen', ROLLBACK);
  const reverted = snapshot();
  if (JSON.stringify(reverted.function) !== JSON.stringify(before.function)) {
    console.error('Fehlgeschlagen: Nach dem Zurücknehmen ist push_documents nicht wie vorher');
    console.error(`vorher:   ${JSON.stringify(before.function)}`);
    console.error(`zurück:   ${JSON.stringify(reverted.function)}`);
    process.exit(1);
  }
  console.log('Zurücknehmen: push_documents wieder wortgleich wie vor der Sperre');
}

psql('Datenbank löschen', ['-c', `drop database ${DB} with (force)`], 'postgres');
console.log(`Datenbanktest bestanden (${String(migrations.length)} Migrationen)`);
