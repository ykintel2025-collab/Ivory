-- ============================================================
-- HOSPITAL PROJECTS APP — DATABASE SCHEMA (multi-project)
-- Plak dit volledige bestand in de Supabase SQL Editor en klik "Run"
-- Als je een eerdere versie van dit schema al had gedraaid: maak een
-- NIEUW Supabase-project aan en draai dit schema daar, of vraag ons
-- om een migratiescript.
-- ============================================================

-- ---------- PROFIELEN (gekoppeld aan Supabase auth.users) ----------
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  role text not null default 'lid',
  created_at timestamptz not null default now()
);

-- ---------- PROJECTEN ----------
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  client text,
  location text,
  description text,
  status text not null default 'actief' check (status in ('actief','gepauzeerd','afgerond')),
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- ---------- PROJECTLEDEN (bepaalt wie welk project mag zien) ----------
create table if not exists project_members (
  project_id uuid references projects(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  role text not null default 'lid', -- bv. CFO, Projectleider, Regulatory Lead
  visible boolean not null default true, -- op false = op de achtergrond in de UI
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

-- ---------- FASEN (vaste lijst, herbruikbaar over alle projecten) ----------
create table if not exists phases (
  id serial primary key,
  number int not null unique,
  name text not null,
  month_range text
);

insert into phases (number, name, month_range) values
  (1, 'Fundament en Voorbereiding', 'Maand 1-2'),
  (2, 'Marktbenadering en RFQ', 'Maand 2-4'),
  (3, 'Tendervoorbereiding en Inschrijving', 'Maand 4-6'),
  (4, 'Post-Gunning — Inkoop en Productie', 'Maand 7-10'),
  (5, 'Levering, Installatie en Inbedrijfstelling', 'Maand 10-14'),
  (6, 'Training, Overdracht en Nazorg', 'Maand 14-16')
on conflict (number) do nothing;

-- ---------- PARTIJEN (per project) ----------
create table if not exists parties (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  type text,
  contact_name text,
  contact_email text,
  contact_phone text,
  status text default 'actief' check (status in ('actief','inactief','in gesprek')),
  notes text,
  created_at timestamptz not null default now()
);

-- ---------- EXTERNE BLOKKADES (wachten-op-extern-bord, per project) ----------
create table if not exists external_blockers (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,
  description text,
  awaiting_from uuid references parties(id),
  reference text,
  status text not null default 'open' check (status in ('open','ontvangen')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

-- ---------- RISICOREGISTER (per project) ----------
create table if not exists risks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,
  description text,
  rating text not null check (rating in ('hoog','midden','laag')),
  status text not null default 'open' check (status in ('open','opgelost')),
  mitigation text,
  owner_id uuid references profiles(id),
  phase_id int references phases(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- SCOPE-LOG (per project) ----------
create table if not exists scope_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  item_name text not null,
  in_scope boolean not null,
  explanation text,
  source_reference text,
  source_date date,
  created_at timestamptz not null default now()
);

-- ---------- REGISTRATIE-/CERTIFICERINGSTRACKER (per project) ----------
create table if not exists registrations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  item_name text not null,
  device_class text,
  registration_status text not null default 'niet_gestart' check (
    registration_status in ('niet_gestart','in_aanvraag','ingediend','goedgekeurd','afgewezen')
  ),
  expected_completion date,
  owner_id uuid references profiles(id),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- LEVERANCIERS- EN APPARATUUROVERZICHT (per project) ----------
create table if not exists equipment_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  line_code text,
  description text not null,
  department text,
  floor text,
  supplier text,
  model text,
  certification_status text,
  price_estimate numeric,
  currency text default 'EUR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- TAKEN / KANBAN (per project) ----------
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'te_doen' check (status in ('te_doen','mee_bezig','klaar')),
  phase_id int references phases(id),
  owner_id uuid references profiles(id),
  urgency text default 'normaal' check (urgency in ('urgent','hoog','normaal')),
  blocked_by_id uuid references external_blockers(id),
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- COMMUNICATIELOG (per project) ----------
create table if not exists communication_log (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  party_id uuid references parties(id) on delete cascade,
  contact_date date not null default current_date,
  summary text not null,
  follow_up text,
  logged_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- ---------- DOCUMENTVERSIES (per project) ----------
create table if not exists document_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  document_name text not null,
  version text not null,
  version_date date not null,
  notes text,
  created_at timestamptz not null default now()
);

-- ---------- BUDGET (per project) ----------
create table if not exists budget_snapshot (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  allocation numeric not null,
  allocation_currency text default 'EUR',
  estimate_low numeric,
  estimate_high numeric,
  snapshot_date date not null default current_date,
  notes text
);

-- ============================================================
-- ROW LEVEL SECURITY
-- Een gebruiker ziet alleen data van projecten waar hij/zij lid van is.
-- ============================================================

alter table profiles enable row level security;
alter table projects enable row level security;
alter table project_members enable row level security;
alter table parties enable row level security;
alter table external_blockers enable row level security;
alter table risks enable row level security;
alter table scope_items enable row level security;
alter table registrations enable row level security;
alter table equipment_items enable row level security;
alter table tasks enable row level security;
alter table communication_log enable row level security;
alter table document_versions enable row level security;
alter table budget_snapshot enable row level security;

-- Helper: is de ingelogde gebruiker lid van dit project?
create or replace function is_project_member(p_project_id uuid)
returns boolean as $$
  select exists (
    select 1 from project_members
    where project_id = p_project_id and user_id = auth.uid()
  );
$$ language sql stable security definer;

-- Profielen: iedereen die ingelogd is mag profielen lezen (nodig voor namen in UI)
create policy "Ingelogde gebruikers lezen profielen" on profiles
  for select using (auth.role() = 'authenticated');
create policy "Gebruiker beheert eigen profiel" on profiles
  for update using (auth.uid() = id);

-- Projecten: zien/bewerken alleen als lid; iedereen ingelogd mag een nieuw project aanmaken
create policy "Leden zien hun projecten" on projects
  for select using (is_project_member(id));
create policy "Ingelogde gebruikers maken projecten aan" on projects
  for insert with check (auth.role() = 'authenticated');
create policy "Leden bewerken hun project" on projects
  for update using (is_project_member(id));

-- Projectleden: zien wie er nog meer in hun projecten zit
create policy "Leden zien projectleden" on project_members
  for select using (is_project_member(project_id));
create policy "Ingelogde gebruikers voegen zichzelf toe" on project_members
  for insert with check (auth.role() = 'authenticated');
create policy "Leden beheren projectleden" on project_members
  for update using (is_project_member(project_id));
create policy "Leden verwijderen projectleden" on project_members
  for delete using (is_project_member(project_id));

-- Generieke policy-generator voor alle project-gebonden tabellen
do $$
declare
  t text;
begin
  for t in select unnest(array[
    'parties','external_blockers','risks','scope_items',
    'registrations','equipment_items','tasks','communication_log',
    'document_versions','budget_snapshot'
  ])
  loop
    execute format('
      create policy "Leden volledige toegang" on %I
      for all using (is_project_member(project_id))
      with check (is_project_member(project_id));
    ', t);
  end loop;
end $$;

-- ============================================================
-- AUTOMATISCH PROFIEL AANMAKEN BIJ REGISTRATIE
-- ============================================================
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'lid')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================================
-- AUTOMATISCH PROJECTLID MAKEN VAN DE AANMAKER
-- ============================================================
create or replace function handle_new_project()
returns trigger as $$
begin
  insert into project_members (project_id, user_id, role, visible)
  values (new.id, auth.uid(), 'eigenaar', true)
  on conflict do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_project_created on projects;
create trigger on_project_created
  after insert on projects
  for each row execute procedure handle_new_project();
