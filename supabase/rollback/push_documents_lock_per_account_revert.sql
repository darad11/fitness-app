-- Zurücknehmen der Sperre je Konto (A-05, D-349): stellt push_documents wortgleich wie in
-- 20261019145346 wieder her. Tabelle, Daten und Rechte ändert es nicht. Liegt bewusst nicht unter
-- supabase/migrations/, damit es nicht von selbst läuft. Bei Bedarf als neue Migration einspielen
-- (Name push_documents_lock_per_account_revert) und dann mit der vergebenen Version unter
-- supabase/migrations/ ablegen, damit die Liste der Migrationen zum Server passt.
create or replace function public.push_documents(docs jsonb)
returns table (doc_id uuid, status text, rev bigint)
language plpgsql
security invoker
set search_path = ''
as $$
#variable_conflict use_column
declare
  d jsonb;
  uid uuid := auth.uid();
  new_rev bigint;
begin
  if uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if jsonb_typeof(docs) <> 'array' or jsonb_array_length(docs) > 500 then
    raise exception 'docs must be an array of at most 500 documents' using errcode = '22023';
  end if;
  for d in select * from jsonb_array_elements(docs) loop
    insert into public.sync_documents as s
      (user_id, doc_id, doc_table, doc_type, hlc, deleted, schema_version, payload, device_id)
    values (
      uid,
      (d->>'doc_id')::uuid,
      d->>'doc_table',
      d->>'doc_type',
      d->>'hlc',
      coalesce((d->>'deleted')::boolean, false),
      (d->>'schema_version')::int,
      d->'payload',
      d->>'device_id'
    )
    on conflict (user_id, doc_id) do update set
      doc_table = excluded.doc_table,
      doc_type = excluded.doc_type,
      hlc = excluded.hlc,
      deleted = excluded.deleted,
      schema_version = excluded.schema_version,
      payload = excluded.payload,
      device_id = excluded.device_id,
      rev = nextval('public.sync_documents_rev_seq'),
      server_updated_at = clock_timestamp()
    where s.hlc < excluded.hlc
    returning s.rev into new_rev;

    doc_id := (d->>'doc_id')::uuid;
    if found then
      status := 'accepted'; rev := new_rev;
    else
      status := 'stale'; rev := null;
    end if;
    return next;
  end loop;
end;
$$;

revoke all on function public.push_documents(jsonb) from public, anon;
grant execute on function public.push_documents(jsonb) to authenticated;
