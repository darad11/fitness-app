// Prüft die Migrationen des Servers an einem lokalen Postgres (A-05, D-349; A-15, D-350): frische
// Datenbank, Nachbildung von Supabase (tools/db/supabase-stub.sql), alle Dateien aus
// supabase/migrations/ der Reihe nach, dann die Tests aus tools/db/ und zuletzt das Zurücknehmen
// aus supabase/rollback/ in umgekehrter Reihenfolge. Vor und nach jeder Migration mit Datei zum
// Zurücknehmen wird der Stand verglichen (tools/db/snapshot.sql): Ändern darf sich nur, was in
// CHECKED steht; nach dem Zurücknehmen muss genau das wieder wie vorher sein.
//
// Verbindung über die Umgebungsvariablen von psql (PGHOST, PGPORT, PGUSER, PGPASSWORD) mit einem
// Konto mit Superuser-Rechten. Aufruf: node tools/test-db.mjs [--bis <Version>]
// Mit --bis laufen nur die Migrationen bis zu dieser Version, z. B. für die Gegenprobe:
//   node tools/test-db.mjs --bis 20261019145346   Stand vor der Sperre je Konto (muss fehlschlagen)
//   node tools/test-db.mjs --bis 20261024055418   Stand vor den eingeschränkten Rechten (ebenso)
import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const DB = 'form_db_test';
const TESTS = ['test-setup.sql', 'push-lock.test.sql', 'rights.test.sql'];

/** Migrationen mit Datei zum Zurücknehmen: was sie ändern dürfen und was danach gelten muss. */
const CHECKED = [
  {
    name: 'push_documents_lock_per_account',
    label: 'Sperre je Konto',
    rollback: 'push_documents_lock_per_account_revert.sql',
    changes: ['function.prosrc_md5', 'function.has_lock'],
    expected: (before, after) => !before.function.has_lock && after.function.has_lock,
  },
  {
    name: 'sync_documents_restrict_rights',
    label: 'Rechte',
    rollback: 'sync_documents_restrict_rights_revert.sql',
    changes: [
      'table.acl',
      'sequence.acl',
      'rights.anon.sequence',
      'rights.authenticated.table',
      'rights.authenticated.sequence',
    ],
    expected: (_before, after) =>
      after.rights.authenticated.table === 'INSERT,SELECT,UPDATE' &&
      after.rights.authenticated.sequence === 'USAGE' &&
      after.rights.anon.table === '' &&
      after.rights.anon.sequence === '',
  },
];

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

function fail(message) {
  console.error(`Fehlgeschlagen: ${message}`);
  process.exit(1);
}

function snapshot() {
  return JSON.parse(psql('Stand lesen', ['-At', '-f', join(root, 'tools/db/snapshot.sql')]));
}

/** Verschachtelter Stand als flache Liste, z. B. „rights.anon.sequence“. */
function flat(value, prefix = '') {
  if (value === null || typeof value !== 'object') return { [prefix]: value };
  return Object.assign(
    {},
    ...Object.entries(value).map(([key, inner]) => flat(inner, prefix ? `${prefix}.${key}` : key)),
  );
}

function changedKeys(before, after) {
  const a = flat(before);
  const b = flat(after);
  return [...new Set([...Object.keys(a), ...Object.keys(b)])].filter(
    (key) => JSON.stringify(a[key]) !== JSON.stringify(b[key]),
  );
}

const migrations = readdirSync(join(root, 'supabase/migrations'))
  .filter((name) => /^\d{14}_[a-z0-9_]+\.sql$/.test(name))
  .sort()
  .filter((name) => until === undefined || name.slice(0, 14) <= until);
if (migrations.length === 0) fail('Keine Migrationen gefunden');

psql('Datenbank anlegen', ['-c', `drop database if exists ${DB} with (force)`], 'postgres');
psql('Datenbank anlegen', ['-c', `create database ${DB}`], 'postgres');
file('Nachbildung von Supabase', join(root, 'tools/db/supabase-stub.sql'));

/** Geprüfte Migrationen in der Reihenfolge, in der sie eingespielt wurden, mit dem Stand davor. */
const applied = [];
for (const name of migrations) {
  const check = CHECKED.find((entry) => name.slice(15) === `${entry.name}.sql`);
  const before = check ? snapshot() : undefined;
  file(`Migration ${name}`, join(root, 'supabase/migrations', name));
  console.log(`Migration eingespielt: ${name}`);
  if (!check || !before) continue;
  const after = snapshot();
  const changed = changedKeys(before, after);
  const unexpected = changed.filter((key) => !check.changes.includes(key));
  if (unexpected.length > 0) {
    fail(`${check.label}: auch ${unexpected.join(', ')} geändert`);
  }
  if (!check.expected(before, after)) {
    fail(`${check.label}: Stand nach der Migration nicht wie vorgesehen: ${JSON.stringify(after)}`);
  }
  console.log(`${check.label}: geändert nur ${changed.join(', ')}`);
  applied.push({ check, before });
}

psql(
  'Tests',
  TESTS.flatMap((name) => ['-f', join(root, 'tools/db', name)]),
);

// Zurücknehmen in umgekehrter Reihenfolge: Was die Migration geändert hat, ist wieder wie vorher.
for (const { check, before } of [...applied].reverse()) {
  file(`Zurücknehmen ${check.label}`, join(root, 'supabase/rollback', check.rollback));
  const reverted = flat(snapshot());
  const original = flat(before);
  const different = check.changes.filter(
    (key) => JSON.stringify(reverted[key]) !== JSON.stringify(original[key]),
  );
  if (different.length > 0) {
    fail(`Zurücknehmen ${check.label}: ${different.join(', ')} nicht wie vorher`);
  }
  console.log(`Zurücknehmen ${check.label}: wieder wie vorher`);
}

psql('Datenbank löschen', ['-c', `drop database ${DB} with (force)`], 'postgres');
console.log(`Datenbanktest bestanden (${String(migrations.length)} Migrationen)`);
