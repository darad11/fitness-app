-- Zwei gleichzeitige Sendungen eines Kontos, keine übersprungene Nummer (A-05, D-349).
-- Läuft über tools/test-db.mjs in einer frischen Testdatenbank (Nachbildung von Supabase und alle
-- Migrationen). Jedes Gerät ist eine eigene Verbindung über dblink, angemeldet wie bei PostgREST:
-- Rolle authenticated, Konto als sub im JWT. Ein Fehler bricht mit einer Meldung ab.
create extension dblink;

insert into auth.users (id) values
  ('00000000-0000-4000-8000-00000000000a'),
  ('00000000-0000-4000-8000-00000000000b');

-- Was Gerät C beim Abholen gesehen hat.
create temp table seen (doc_id uuid, rev bigint);

-- Verbindung eines Geräts, angemeldet mit dem Konto.
create function pg_temp.device(name text, account uuid) returns void
language plpgsql as $$
begin
  perform dblink_connect(name, format('dbname=%s user=%s', current_database(), current_user));
  perform dblink_exec(name, 'set role authenticated');
  perform dblink_exec(name, format('set request.jwt.claims = %L',
    json_build_object('sub', account, 'role', 'authenticated')));
end
$$;

-- Ein Dokument, wie es die App an push_documents sendet.
create function pg_temp.doc(id uuid, hlc text, device text) returns jsonb
language sql as $$
  select jsonb_build_array(jsonb_build_object(
    'doc_id', id, 'doc_table', 'sessions', 'doc_type', 'session', 'hlc', hlc, 'deleted', false,
    'schema_version', 1, 'payload', jsonb_build_object('id', id), 'device_id', device))
$$;

create function pg_temp.push_sql(docs jsonb) returns text
language sql as $$
  select format('select doc_id, status, rev from public.push_documents(%L::jsonb)', docs)
$$;

-- Senden und auf die Antwort warten.
create function pg_temp.push(name text, docs jsonb)
returns table (doc_id uuid, status text, rev bigint)
language sql as $$
  select * from dblink(name, pg_temp.push_sql(docs)) as t(doc_id uuid, status text, rev bigint)
$$;

-- Nach dem Senden ohne Warten: ist das Gerät fertig, oder wartet es auf eine Sperre?
create function pg_temp.state(name text, backend int) returns text
language plpgsql as $$
begin
  for i in 1..400 loop
    if dblink_is_busy(name) = 0 then
      return 'fertig';
    end if;
    if exists (select 1 from pg_locks l where l.pid = backend and not l.granted) then
      return 'wartet';
    end if;
    perform pg_sleep(0.05);
  end loop;
  raise exception 'Gerät % ist nach 20 s weder fertig, noch wartet es', name;
end
$$;

-- Antwort einer Sendung ohne Warten abholen.
create function pg_temp.finish(name text) returns bigint
language plpgsql as $$
declare
  new_rev bigint;
begin
  for i in 1..400 loop
    exit when dblink_is_busy(name) = 0;
    perform pg_sleep(0.05);
  end loop;
  select t.rev into new_rev from dblink_get_result(name) as t(doc_id uuid, status text, rev bigint);
  -- Das leere Ergebnis danach gibt die Verbindung wieder frei.
  perform * from dblink_get_result(name) as t(doc_id uuid, status text, rev bigint);
  return new_rev;
end
$$;

-- Abholen wie die App: rev > Cursor, aufsteigend, 500 je Seite.
create function pg_temp.pull(name text, cursor_rev bigint)
returns table (doc_id uuid, rev bigint)
language sql as $$
  select * from dblink(name, format(
    'select doc_id, rev from public.sync_documents where rev > %s order by rev limit 500',
    cursor_rev)) as t(doc_id uuid, rev bigint)
$$;

-- 1. Gerät A und B desselben Kontos senden gleichzeitig; Gerät C holt dazwischen ab.
do $$
declare
  account constant uuid := '00000000-0000-4000-8000-00000000000a';
  backend_b int;
  b_state text;
  cursor_rev bigint := 0;
  rev_a bigint;
  rev_b bigint;
  missing text;
begin
  perform pg_temp.device('a', account);
  perform pg_temp.device('b', account);
  perform pg_temp.device('c', account);
  select pid into backend_b from dblink('b', 'select pg_backend_pid()') as t(pid int);

  -- A sendet; die Transaktion bleibt offen, rev ist vergeben, aber noch nicht sichtbar.
  perform dblink_exec('a', 'begin');
  select p.rev into rev_a from pg_temp.push('a', pg_temp.doc(
    '0000000a-0000-4000-8000-000000000001', '2026-10-24T08:00:00.000Z-0000-0000000a', '0000000a')) p;

  -- B sendet gleichzeitig.
  perform dblink_exec('b', 'begin');
  perform dblink_send_query('b', pg_temp.push_sql(pg_temp.doc(
    '0000000a-0000-4000-8000-000000000002', '2026-10-24T08:00:01.000Z-0000-0000000b', '0000000b')));
  b_state := pg_temp.state('b', backend_b);
  if b_state = 'fertig' then
    -- Ohne Sperre ist B schon durch und committet vor A.
    rev_b := pg_temp.finish('b');
    perform dblink_exec('b', 'commit');
  end if;

  -- C holt ab, solange A offen ist.
  insert into seen select * from pg_temp.pull('c', cursor_rev);
  select coalesce(max(s.rev), cursor_rev) into cursor_rev from seen s;

  -- A committet; wartet B auf die Sperre, kommt es jetzt dran.
  perform dblink_exec('a', 'commit');
  if b_state = 'wartet' then
    rev_b := pg_temp.finish('b');
    perform dblink_exec('b', 'commit');
  end if;

  -- C holt ab dem Cursor erneut ab.
  insert into seen select * from pg_temp.pull('c', cursor_rev);

  -- Jede Nummer des Kontos muss bei C angekommen sein.
  select string_agg(s.rev::text, ', ' order by s.rev) into missing
  from public.sync_documents s
  where s.user_id = account and not exists (select 1 from seen x where x.rev = s.rev);
  if missing is not null then
    raise exception 'Übersprungen: Gerät C hat rev % nie geholt (A rev %, B rev %, B %, Cursor %)',
      missing, rev_a, rev_b, b_state, cursor_rev;
  end if;
  if b_state <> 'wartet' or rev_b is null or rev_b <= rev_a then
    raise exception 'B hat nicht auf A gewartet (B %, A rev %, B rev %)', b_state, rev_a, rev_b;
  end if;
  raise notice 'bestanden: B wartete auf A; C hat rev % und % geholt, keine Nummer übersprungen',
    rev_a, rev_b;
  perform dblink_disconnect('a');
  perform dblink_disconnect('b');
  perform dblink_disconnect('c');
end
$$;

-- 2. Die Sperre gilt je Konto: Ein anderes Konto wartet nicht.
do $$
declare
  backend_v int;
  v_state text;
begin
  perform pg_temp.device('a', '00000000-0000-4000-8000-00000000000a');
  perform pg_temp.device('v', '00000000-0000-4000-8000-00000000000b');
  select pid into backend_v from dblink('v', 'select pg_backend_pid()') as t(pid int);
  perform dblink_exec('a', 'begin');
  perform pg_temp.push('a', pg_temp.doc(
    '0000000a-0000-4000-8000-000000000003', '2026-10-24T08:00:02.000Z-0000-0000000a', '0000000a'));
  perform dblink_exec('v', 'begin');
  perform dblink_send_query('v', pg_temp.push_sql(pg_temp.doc(
    '0000000b-0000-4000-8000-000000000001', '2026-10-24T08:00:03.000Z-0000-0000000c', '0000000c')));
  v_state := pg_temp.state('v', backend_v);
  perform pg_temp.finish('v');
  perform dblink_exec('v', 'commit');
  perform dblink_exec('a', 'commit');
  if v_state <> 'fertig' then
    raise exception 'Ein anderes Konto hat auf die Sperre gewartet (%)', v_state;
  end if;
  raise notice 'bestanden: ein anderes Konto sendet, ohne zu warten';
  perform dblink_disconnect('a');
  perform dblink_disconnect('v');
end
$$;

-- 3. Antworten wie vorher: jüngerer HLC angenommen, gleicher HLC stale, rev steigt.
do $$
declare
  first_push record;
  same_push record;
  newer_push record;
begin
  perform pg_temp.device('a', '00000000-0000-4000-8000-00000000000a');
  select * into first_push from pg_temp.push('a', pg_temp.doc(
    '0000000a-0000-4000-8000-000000000004', '2026-10-24T09:00:00.000Z-0000-0000000a', '0000000a'));
  select * into same_push from pg_temp.push('a', pg_temp.doc(
    '0000000a-0000-4000-8000-000000000004', '2026-10-24T09:00:00.000Z-0000-0000000a', '0000000a'));
  select * into newer_push from pg_temp.push('a', pg_temp.doc(
    '0000000a-0000-4000-8000-000000000004', '2026-10-24T09:00:01.000Z-0000-0000000a', '0000000a'));
  if first_push.status <> 'accepted' or same_push.status <> 'stale' or same_push.rev is not null
     or newer_push.status <> 'accepted' or newer_push.rev <= first_push.rev then
    raise exception 'push_documents antwortet anders als vorher: % / % / %',
      first_push, same_push, newer_push;
  end if;
  raise notice 'bestanden: jüngerer HLC angenommen (rev % > %), gleicher HLC stale',
    newer_push.rev, first_push.rev;
  perform dblink_disconnect('a');
end
$$;
