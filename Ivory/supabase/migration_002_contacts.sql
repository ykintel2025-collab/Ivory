-- ============================================================
-- MIGRATIE: Partijen worden algemene, herbruikbare "relaties"
-- die aan meerdere projecten toegewezen kunnen worden, elk met
-- een eigen rol per project.
-- Draai dit NADAT de nieuwe code live staat (zie instructies).
-- ============================================================

-- 1. Algemene relaties (los van een specifiek project)
create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text,
  contact_name text,
  contact_email text,
  contact_phone text,
  notes text,
  created_at timestamptz not null default now()
);

alter table contacts enable row level security;

drop policy if exists "Ingelogde gebruikers volledige toegang" on contacts;
create policy "Ingelogde gebruikers volledige toegang" on contacts
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- 2. Koppeltabel: welke relatie hoort bij welk project, met eigen rol
create table if not exists project_contacts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  contact_id uuid not null references contacts(id) on delete cascade,
  role text,
  status text default 'actief' check (status in ('actief','inactief','in gesprek')),
  notes text,
  created_at timestamptz not null default now(),
  unique (project_id, contact_id)
);

alter table project_contacts enable row level security;

drop policy if exists "Leden volledige toegang" on project_contacts;
create policy "Leden volledige toegang" on project_contacts
  for all using (is_project_member(project_id))
  with check (is_project_member(project_id));

-- 3. Bestaande partijen overzetten (zelfde id's, dus koppelingen blijven werken)
insert into contacts (id, name, type, contact_name, contact_email, contact_phone, notes, created_at)
select id, name, type, contact_name, contact_email, contact_phone, notes, created_at
from parties
on conflict (id) do nothing;

insert into project_contacts (project_id, contact_id, role, status, notes, created_at)
select project_id, id, type, status, notes, created_at
from parties
on conflict (project_id, contact_id) do nothing;

-- 4. Verwijzingen omzetten van 'parties' naar 'contacts'
alter table external_blockers drop constraint if exists external_blockers_awaiting_from_fkey;
alter table external_blockers add constraint external_blockers_awaiting_from_fkey
  foreign key (awaiting_from) references contacts(id);

alter table communication_log drop constraint if exists communication_log_party_id_fkey;
alter table communication_log add constraint communication_log_party_id_fkey
  foreign key (party_id) references contacts(id);

-- 5. Oude tabel opruimen
drop table if exists parties cascade;
