-- ============================================================
-- MIGRATIE: voeg een losse id-kolom toe aan project_members
-- (nodig om teamleden individueel te kunnen verwijderen vanuit de app)
-- ============================================================

alter table project_members add column if not exists id uuid unique default gen_random_uuid();
