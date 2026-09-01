-- ============================================================
-- MIGRATIE: profielen kunnen verborgen worden voor de meeste
-- gebruikers, met uitzondering van wie 'can_see_hidden' heeft.
-- ============================================================

alter table profiles add column if not exists hidden boolean not null default false;
alter table profiles add column if not exists can_see_hidden boolean not null default false;

-- Voorbeeld (pas de namen aan naar jullie exacte situatie):
-- update profiles set hidden = true where full_name ilike '%gert%jan%';
-- update profiles set can_see_hidden = true where full_name ilike '%ibrahim%';
