-- ============================================================
-- MIGRATIE: Documenten uploaden, per project, optioneel gekoppeld
-- aan een onderdeel (of vrij/algemeen).
-- ============================================================

-- 1. Opslag-bucket aanmaken (privé — alleen via de app toegankelijk)
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- 2. Documenten-tabel (metadata per bestand)
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  storage_path text not null,
  section text,
  size bigint,
  uploaded_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

alter table documents enable row level security;

drop policy if exists "Leden volledige toegang" on documents;
create policy "Leden volledige toegang" on documents
  for all using (is_project_member(project_id))
  with check (is_project_member(project_id));

-- 3. Opslag-beveiliging: alleen projectleden mogen bestanden van
-- hun eigen projecten lezen/uploaden/verwijderen. Bestanden worden
-- opgeslagen als "{project_id}/{bestandsnaam}", dus de eerste map
-- in het pad bepaalt bij welk project het hoort.
drop policy if exists "Leden lezen documenten" on storage.objects;
create policy "Leden lezen documenten" on storage.objects
  for select using (
    bucket_id = 'documents'
    and is_project_member((storage.foldername(name))[1]::uuid)
  );

drop policy if exists "Leden uploaden documenten" on storage.objects;
create policy "Leden uploaden documenten" on storage.objects
  for insert with check (
    bucket_id = 'documents'
    and is_project_member((storage.foldername(name))[1]::uuid)
  );

drop policy if exists "Leden verwijderen documenten" on storage.objects;
create policy "Leden verwijderen documenten" on storage.objects
  for delete using (
    bucket_id = 'documents'
    and is_project_member((storage.foldername(name))[1]::uuid)
  );
