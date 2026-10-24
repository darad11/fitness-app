-- Rechte an sync_documents und der Sequenz (A-15, D-350): Die App sendet und holt ab; Leeren,
-- Löschen und Lesen der Sequenz sind für angemeldete Konten abgelehnt; nicht angemeldete haben
-- keine Rechte an Tabelle, Sequenz und push_documents. Läuft über tools/test-db.mjs nach
-- tools/db/test-setup.sql. Ein Fehler bricht mit einer Meldung ab.

-- 1. Angemeldet: senden und abholen gehen, Leeren und Löschen nicht.
do $$
declare
  sent record;
  fetched int;
begin
  perform pg_temp.device('r', '00000000-0000-4000-8000-00000000000a');
  select * into sent from pg_temp.push('r', pg_temp.doc(
    '0000000a-0000-4000-8000-000000000010', '2026-10-24T10:00:00.000Z-0000-0000000a', '0000000a'));
  if sent.status <> 'accepted' or sent.rev is null then
    raise exception 'Senden geht nicht mehr: %', sent;
  end if;
  select count(*) into fetched from pg_temp.pull('r', sent.rev - 1) p
  where p.doc_id = '0000000a-0000-4000-8000-000000000010';
  if fetched <> 1 then
    raise exception 'Abholen geht nicht mehr: % Zeilen statt 1', fetched;
  end if;

  perform dblink_exec('r', 'begin');
  begin
    perform dblink_exec('r', 'truncate public.sync_documents');
    raise exception 'Leeren wurde nicht abgelehnt: authenticated konnte sync_documents leeren';
  exception when insufficient_privilege then
    null;
  end;
  perform dblink_exec('r', 'rollback');

  begin
    perform dblink_exec('r', 'delete from public.sync_documents');
    raise exception 'Löschen wurde nicht abgelehnt';
  exception when insufficient_privilege then
    null;
  end;

  begin
    perform * from dblink('r', 'select last_value from public.sync_documents_rev_seq')
      as t(last_value bigint);
    raise exception 'authenticated durfte die Sequenz lesen';
  exception when insufficient_privilege then
    null;
  end;
  raise notice 'bestanden: angemeldet senden (rev %) und abholen; Leeren, Löschen und Lesen der Sequenz abgelehnt',
    sent.rev;
  perform dblink_disconnect('r');
end
$$;

-- 2. Nicht angemeldet: nichts an Sequenz, Tabelle und push_documents.
do $$
begin
  perform dblink_connect('n', format('dbname=%s user=%s', current_database(), current_user));
  perform dblink_exec('n', 'set role anon');
  begin
    perform * from dblink('n', $q$select nextval('public.sync_documents_rev_seq')$q$) as t(n bigint);
    raise exception 'anon durfte die Sequenz weiterzählen';
  exception when insufficient_privilege then
    null;
  end;
  begin
    perform * from dblink('n', 'select last_value from public.sync_documents_rev_seq')
      as t(last_value bigint);
    raise exception 'anon durfte die Sequenz lesen';
  exception when insufficient_privilege then
    null;
  end;
  begin
    perform * from dblink('n', 'select doc_id from public.sync_documents') as t(doc_id uuid);
    raise exception 'anon durfte sync_documents lesen';
  exception when insufficient_privilege then
    null;
  end;
  begin
    perform * from dblink('n', $q$select doc_id from public.push_documents('[]'::jsonb)$q$)
      as t(doc_id uuid);
    raise exception 'anon durfte push_documents aufrufen';
  exception when insufficient_privilege then
    null;
  end;
  raise notice 'bestanden: nicht angemeldet weder Sequenz noch Tabelle noch push_documents';
  perform dblink_disconnect('n');
end
$$;

-- 3. Rechte laut Katalog: authenticated genau SELECT, INSERT, UPDATE und USAGE an der Sequenz.
do $$
declare
  priv text;
  unused text[] := array['DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER'];
begin
  -- MAINTAIN gibt es erst ab Postgres 17; als Array anhängen, ein Text davor wäre ein Array-Literal.
  if current_setting('server_version_num')::int >= 170000 then
    unused := unused || array['MAINTAIN'];
  end if;
  foreach priv in array array['SELECT', 'INSERT', 'UPDATE'] loop
    if not has_table_privilege('authenticated', 'public.sync_documents', priv) then
      raise exception 'authenticated fehlt % an sync_documents', priv;
    end if;
  end loop;
  foreach priv in array unused loop
    if has_table_privilege('authenticated', 'public.sync_documents', priv) then
      raise exception 'authenticated hat noch % an sync_documents', priv;
    end if;
    if has_table_privilege('anon', 'public.sync_documents', priv) then
      raise exception 'anon hat % an sync_documents', priv;
    end if;
  end loop;
  if not has_sequence_privilege('authenticated', 'public.sync_documents_rev_seq', 'USAGE') then
    raise exception 'authenticated fehlt USAGE an der Sequenz';
  end if;
  foreach priv in array array['SELECT', 'UPDATE'] loop
    if has_sequence_privilege('authenticated', 'public.sync_documents_rev_seq', priv) then
      raise exception 'authenticated hat noch % an der Sequenz', priv;
    end if;
  end loop;
  foreach priv in array array['USAGE', 'SELECT', 'UPDATE'] loop
    if has_sequence_privilege('anon', 'public.sync_documents_rev_seq', priv) then
      raise exception 'anon hat % an der Sequenz', priv;
    end if;
  end loop;
  if not has_function_privilege('authenticated', 'public.push_documents(jsonb)', 'EXECUTE')
     or has_function_privilege('anon', 'public.push_documents(jsonb)', 'EXECUTE') then
    raise exception 'Rechte an push_documents verändert';
  end if;
  raise notice 'bestanden: Rechte laut Katalog wie vorgesehen (authenticated: SELECT, INSERT, UPDATE; Sequenz nur USAGE; anon nichts)';
end
$$;
