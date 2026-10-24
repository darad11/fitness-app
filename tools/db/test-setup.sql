-- Vorbereitung für die Datenbanktests (A-05, D-349; A-15, D-350): zwei Konten und Hilfen, mit
-- denen jedes Gerät eine eigene Verbindung über dblink ist, angemeldet wie bei PostgREST (Rolle
-- authenticated, Konto als sub im JWT). tools/test-db.mjs führt diese Datei und die Tests in einer
-- Sitzung aus, damit die Hilfen in pg_temp für alle Tests gelten.
create extension if not exists dblink;

insert into auth.users (id) values
  ('00000000-0000-4000-8000-00000000000a'),
  ('00000000-0000-4000-8000-00000000000b')
on conflict (id) do nothing;

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

