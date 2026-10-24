-- Synchronisierung pro Dokument (D-205, D-269): eine generische Tabelle, Zeilen nur für den
-- angemeldeten Nutzer (RLS). Geschrieben wird über push_documents (gewinnt der jüngere HLC).
create sequence public.sync_documents_rev_seq;

create table public.sync_documents (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  doc_id uuid not null,
  doc_table text not null check (char_length(doc_table) between 1 and 40),
  doc_type text not null check (char_length(doc_type) between 1 and 40),
  hlc text not null check (hlc ~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z-\d{4}-[0-9a-f]{8}$'),
  deleted boolean not null default false,
  schema_version int not null,
  payload jsonb not null check (pg_column_size(payload) < 1000000),
  device_id text not null check (device_id ~ '^[0-9a-f]{8}$'),
  rev bigint not null default nextval('public.sync_documents_rev_seq'),
  server_updated_at timestamptz not null default clock_timestamp(),
  primary key (user_id, doc_id)
);

alter sequence public.sync_documents_rev_seq owned by public.sync_documents.rev;
create index sync_documents_pull on public.sync_documents (user_id, rev);

alter table public.sync_documents enable row level security;

create policy sync_documents_select on public.sync_documents
  for select to authenticated using (user_id = (select auth.uid()));
create policy sync_documents_insert on public.sync_documents
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy sync_documents_update on public.sync_documents
  for update to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

revoke all on public.sync_documents from anon;
grant select, insert, update on public.sync_documents to authenticated;
grant usage on sequence public.sync_documents_rev_seq to authenticated;

-- Schreibt mehrere Dokumente; eine Fassung wird nur übernommen, wenn ihr HLC jünger ist.
-- Antwort je Dokument: accepted (mit neuer rev) oder stale (Server hat gleich alt oder jünger).
create or replace function public.push_documents(docs jsonb)
returns table (doc_id uuid, status text, rev bigint)
language plpgsql
security invoker
set search_path = ''
as $$
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

    if found then
      doc_id := (d->>'doc_id')::uuid; status := 'accepted'; rev := new_rev;
    else
      doc_id := (d->>'doc_id')::uuid; status := 'stale'; rev := null;
    end if;
    return next;
  end loop;
end;
$$;

revoke all on function public.push_documents(jsonb) from public, anon;
grant execute on function public.push_documents(jsonb) to authenticated;
