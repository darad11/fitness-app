-- Rechte auf das, was die App braucht (A-15, D-350). Durch die Standardrechte von Supabase im
-- Schema public hatte authenticated alle Rechte an sync_documents (auch Löschen, Leeren, Auslöser,
-- Verweise) und anon Rechte an der Sequenz. Die App liest beim Abholen und legt über
-- push_documents an oder ändert; dafür braucht authenticated SELECT, INSERT und UPDATE an der
-- Tabelle und USAGE an der Sequenz (nextval). anon braucht nichts davon. Eigentümer und
-- service_role behalten ihre Rechte; push_documents und die RLS-Regeln bleiben, wie sie sind.
revoke all on table public.sync_documents from anon, authenticated;
grant select, insert, update on table public.sync_documents to authenticated;

revoke all on sequence public.sync_documents_rev_seq from anon, authenticated;
grant usage on sequence public.sync_documents_rev_seq to authenticated;
