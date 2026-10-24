-- Zurücknehmen der eingeschränkten Rechte (A-15, D-350): stellt die Rechte an sync_documents und
-- an der Sequenz wie vorher her, also die Standardrechte von Supabase (authenticated alle Rechte
-- an der Tabelle, anon und authenticated alle Rechte an der Sequenz). Tabelle, Daten, Funktion und
-- RLS-Regeln ändert es nicht. Liegt bewusst nicht unter supabase/migrations/, damit es nicht von
-- selbst läuft. Bei Bedarf als neue Migration einspielen (Name
-- sync_documents_restrict_rights_revert) und dann mit der vergebenen Version unter
-- supabase/migrations/ ablegen, damit die Liste der Migrationen zum Server passt.
grant all on table public.sync_documents to authenticated;
grant all on sequence public.sync_documents_rev_seq to anon, authenticated;
