-- Nachbildung der Teile von Supabase, die die Migrationen in supabase/migrations/ brauchen
-- (A-05, D-349). Nur für die lokale Testdatenbank von tools/test-db.mjs, nie auf dem Server.

-- Rollen wie bei Supabase: PostgREST arbeitet als anon oder authenticated. Rollen gelten für den
-- ganzen Server; bei einem zweiten Lauf gibt es sie schon.
do $$
begin
  if not exists (select from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
  if not exists (select from pg_roles where rolname = 'service_role') then
    create role service_role nologin noinherit bypassrls;
  end if;
end
$$;

-- Konten und das Konto der laufenden Anfrage (wie auth.uid() bei Supabase: sub aus dem JWT).
create schema auth;
grant usage on schema auth to anon, authenticated, service_role;
create table auth.users (id uuid primary key);
create function auth.uid() returns uuid
language sql stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;

-- Standardrechte im Schema public wie bei Supabase: Neue Tabellen, Sequenzen und Funktionen
-- gehören allen drei Rollen, bis eine Migration Rechte entzieht.
grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
