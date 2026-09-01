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
  role text not null default 'lid',
  visible boolean not null default true,
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

-- ---------- LEVERANCIERS- EN APPARATUUROVERZICHT (per project)
