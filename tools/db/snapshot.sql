-- Stand von push_documents, sync_documents, Rechten und Daten als ein JSON-Objekt (A-05, D-349;
-- Rechte je Rolle seit A-15, D-350). Nur lesend. tools/test-db.mjs vergleicht damit lokal vor und
-- nach jeder Migration; auf dem Server dieselbe Abfrage vor und nach dem Einspielen. Rechte stehen
-- sortiert, damit nur der Inhalt zählt, nicht die Reihenfolge. Inhalte der Zeilen erscheinen nicht,
-- nur Anzahl und Prüfsumme.
with
fn as (
  select (select count(*)
          from pg_proc p
          join pg_namespace n on n.oid = p.pronamespace
          where n.nspname = 'public' and p.proname = 'push_documents') as count,
         md5(p.prosrc) as prosrc_md5,
         position('pg_advisory_xact_lock' in p.prosrc) > 0 as has_lock,
         (select string_agg(a::text, ',' order by a::text) from unnest(p.proacl) a) as acl,
         p.prosecdef as security_definer,
         array_to_string(p.proconfig, ',') as config,
         p.provolatile::text as volatility,
         pg_get_userbyid(p.proowner) as owner,
         pg_get_function_identity_arguments(p.oid) as arguments,
         pg_get_function_result(p.oid) as result
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'push_documents'
  limit 1
),
tbl as (
  select (select string_agg(a::text, ',' order by a::text) from unnest(c.relacl) a) as acl,
         c.relrowsecurity as rls,
         c.relforcerowsecurity as force_rls,
         pg_get_userbyid(c.relowner) as owner
  from pg_class c
  where c.oid = 'public.sync_documents'::regclass
),
cols as (
  select md5(string_agg(format('%s %s %s %s', a.attname, format_type(a.atttypid, a.atttypmod),
           a.attnotnull, pg_get_expr(d.adbin, d.adrelid)), ' | ' order by a.attnum)) as md5
  from pg_attribute a
  left join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
  where a.attrelid = 'public.sync_documents'::regclass and a.attnum > 0 and not a.attisdropped
),
cons as (
  select md5(string_agg(format('%s: %s', conname, pg_get_constraintdef(oid)), ' | ' order by conname)) as md5
  from pg_constraint
  where conrelid = 'public.sync_documents'::regclass
),
idx as (
  select string_agg(indexdef, ' | ' order by indexname) as defs
  from pg_indexes
  where schemaname = 'public' and tablename = 'sync_documents'
),
pol as (
  select count(*) as count,
         md5(string_agg(format('%s %s %s %s %s', policyname, cmd, roles::text, qual, with_check), ' | '
           order by policyname)) as md5
  from pg_policies
  where schemaname = 'public' and tablename = 'sync_documents'
),
seq as (
  select (select string_agg(a::text, ',' order by a::text) from unnest(c.relacl) a) as acl
  from pg_class c
  where c.oid = 'public.sync_documents_rev_seq'::regclass
),
seqv as (
  select last_value, is_called from public.sync_documents_rev_seq
),
-- Was jede Rolle tatsächlich darf (MAINTAIN gibt es erst ab Postgres 17).
rights as (
  select json_object_agg(r.rolname, json_build_object(
           'table', (select coalesce(string_agg(p, ',' order by p), '')
                     from unnest(array['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES',
                                       'TRIGGER']
                                 || case when current_setting('server_version_num')::int >= 170000
                                         then array['MAINTAIN'] else array[]::text[] end) p
                     where has_table_privilege(r.rolname, 'public.sync_documents', p)),
           'sequence', (select coalesce(string_agg(p, ',' order by p), '')
                        from unnest(array['USAGE', 'SELECT', 'UPDATE']) p
                        where has_sequence_privilege(r.rolname, 'public.sync_documents_rev_seq', p)),
           'push_documents', has_function_privilege(r.rolname, 'public.push_documents(jsonb)', 'EXECUTE'))
         order by r.rolname) as roles
  from pg_roles r
  where r.rolname in ('anon', 'authenticated', 'service_role')
),
dat as (
  select count(*) as rows,
         coalesce(max(rev), 0) as max_rev,
         count(distinct user_id) as accounts,
         md5(coalesce(string_agg(t::text, E'\n' order by user_id, doc_id), '')) as rows_md5
  from public.sync_documents t
)
select json_build_object(
  'function', (select row_to_json(fn) from fn),
  'table', (select json_build_object(
      'acl', tbl.acl, 'rls', tbl.rls, 'force_rls', tbl.force_rls, 'owner', tbl.owner,
      'columns_md5', (select md5 from cols), 'constraints_md5', (select md5 from cons),
      'indexes', (select defs from idx), 'policies', (select count from pol),
      'policies_md5', (select md5 from pol),
      'triggers', (select count(*) from pg_trigger
                   where tgrelid = 'public.sync_documents'::regclass and not tgisinternal))
    from tbl),
  'sequence', (select json_build_object('acl', seq.acl, 'last_value', seqv.last_value,
      'is_called', seqv.is_called) from seq, seqv),
  'rights', (select roles from rights),
  'data', (select row_to_json(dat) from dat),
  'auth_users', (select count(*) from auth.users)
) as snapshot;
