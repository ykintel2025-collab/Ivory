-- ============================================================
-- FIX: fase-nummers moeten uniek zijn per project, niet globaal
-- over alle projecten heen (dat brak het aanmaken van nieuwe
-- projecten zodra fase-nummer 1 al ergens anders bestond).
-- ============================================================

alter table phases drop constraint if exists phases_number_key;
alter table phases add constraint phases_project_number_unique unique (project_id, number);
