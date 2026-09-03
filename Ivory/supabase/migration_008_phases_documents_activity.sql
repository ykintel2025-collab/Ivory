-- ============================================================
-- MIGRATIE: fasen worden per-project (i.p.v. één vaste lijst voor
-- alle projecten), documenten mogen zonder project bestaan
-- (later toewijsbaar), en er komt een activiteitenlog.
-- ============================================================

-- ---------- 1. FASEN WORDEN PER-PROJECT ----------
alter table phases add column if not exists project_id uuid references projects(id) on delete cascade;

-- Bestaande fasen (1-6, ooit gemaakt voor Shajar) koppelen aan het
-- eerste/oudste project, zodat bestaande taken/risico's blijven werken.
update phases set project_id = (
  select id from projects order by created_at asc limit 1
)
where project_id is null;

-- Vanaf nu is een fase altijd van één specifiek project.
alter table phases alter column project_id set not null;

-- Fasen hadden nog geen RLS (bewust overgeslagen bij het opzetten).
-- Dat hoort nu wel, want het is projectgebonden data.
alter table phases enable row level security;
drop policy if exists "Leden volledige toegang" on phases;
create policy "Leden volledige toegang" on phases
  for all using (is_project_member(project_id))
  with check (is_project_member(project_id));

-- ---------- 2. DOCUMENTEN MOGEN ZONDER PROJECT ----------
alter table documents alter column project_id drop not null;

drop policy if exists "Leden volledige toegang" on documents;
create policy "Toegang tot documenten" on documents
  for all using (
    project_id is null or is_project_member(project_id)
  )
  with check (
    project_id is null or is_project_member(project_id)
  );

-- Opslag: bestanden zonder project komen in een map "unassigned/" en
-- zijn zichtbaar/beheerbaar voor alle ingelogde gebruikers.
drop policy if exists "Leden lezen documenten" on storage.objects;
create policy "Leden lezen documenten" on storage.objects
  for select using (
    bucket_id = 'documents'
    and (
      (storage.foldername(name))[1] = 'unassigned'
      or is_project_member((storage.foldername(name))[1]::uuid)
    )
  );

drop policy if exists "Leden uploaden documenten" on storage.objects;
create policy "Leden uploaden documenten" on storage.objects
  for insert with check (
    bucket_id = 'documents'
    and (
      (storage.foldername(name))[1] = 'unassigned'
      or is_project_member((storage.foldername(name))[1]::uuid)
    )
  );

drop policy if exists "Leden verwijderen documenten" on storage.objects;
create policy "Leden verwijderen documenten" on storage.objects
  for delete using (
    bucket_id = 'documents'
    and (
      (storage.foldername(name))[1] = 'unassigned'
      or is_project_member((storage.foldername(name))[1]::uuid)
    )
  );

drop policy if exists "Leden verplaatsen documenten" on storage.objects;
create policy "Leden verplaatsen documenten" on storage.objects
  for update using (
    bucket_id = 'documents'
    and (
      (storage.foldername(name))[1] = 'unassigned'
      or is_project_member((storage.foldername(name))[1]::uuid)
    )
  );

-- ---------- 3. ACTIVITEITENLOG ----------
create table if not exists activity_log (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  actor_id uuid references profiles(id),
  action text not null,
  entity_type text not null,
  entity_label text,
  detail text,
  created_at timestamptz not null default now()
);

alter table activity_log enable row level security;
drop policy if exists "Leden lezen activiteiten" on activity_log;
create policy "Leden lezen activiteiten" on activity_log
  for select using (is_project_member(project_id));
drop policy if exists "Leden loggen activiteiten" on activity_log;
create policy "Leden loggen activiteiten" on activity_log
  for insert with check (is_project_member(project_id));

-- Automatisch loggen bij taken (aanmaken, status wijzigen, toewijzen, verwijderen)
create or replace function public.log_task_activity()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    insert into activity_log(project_id, actor_id, action, entity_type, entity_label)
    values (new.project_id, auth.uid(), 'aangemaakt', 'taak', new.title);
  elsif TG_OP = 'UPDATE' then
    if old.status is distinct from new.status then
      insert into activity_log(project_id, actor_id, action, entity_type, entity_label, detail)
      values (new.project_id, auth.uid(), 'status gewijzigd', 'taak', new.title, old.status || ' → ' || new.status);
    end if;
    if old.owner_id is distinct from new.owner_id then
      insert into activity_log(project_id, actor_id, action, entity_type, entity_label)
      values (new.project_id, auth.uid(), 'opnieuw toegewezen', 'taak', new.title);
    end if;
  elsif TG_OP = 'DELETE' then
    insert into activity_log(project_id, actor_id, action, entity_type, entity_label)
    values (old.project_id, auth.uid(), 'verwijderd', 'taak', old.title);
  end if;
  return coalesce(new, old);
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_task_activity on tasks;
create trigger on_task_activity
after insert or update or delete on tasks
for each row execute procedure public.log_task_activity();

-- Automatisch loggen bij risico's
create or replace function public.log_risk_activity()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    insert into activity_log(project_id, actor_id, action, entity_type, entity_label)
    values (new.project_id, auth.uid(), 'aangemaakt', 'risico', new.title);
  elsif TG_OP = 'UPDATE' then
    if old.status is distinct from new.status then
      insert into activity_log(project_id, actor_id, action, entity_type, entity_label, detail)
      values (new.project_id, auth.uid(), 'status gewijzigd', 'risico', new.title, old.status || ' → ' || new.status);
    end if;
  elsif TG_OP = 'DELETE' then
    insert into activity_log(project_id, actor_id, action, entity_type, entity_label)
    values (old.project_id, auth.uid(), 'verwijderd', 'risico', old.title);
  end if;
  return coalesce(new, old);
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_risk_activity on risks;
create trigger on_risk_activity
after insert or update or delete on risks
for each row execute procedure public.log_risk_activity();

-- Automatisch loggen bij documenten (alleen als ze aan een project hangen)
create or replace function public.log_document_activity()
returns trigger as $$
begin
  if TG_OP = 'INSERT' and new.project_id is not null then
    insert into activity_log(project_id, actor_id, action, entity_type, entity_label)
    values (new.project_id, auth.uid(), 'geüpload', 'document', new.name);
  elsif TG_OP = 'UPDATE' and old.project_id is null and new.project_id is not null then
    insert into activity_log(project_id, actor_id, action, entity_type, entity_label)
    values (new.project_id, auth.uid(), 'toegewezen', 'document', new.name);
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_document_activity on documents;
create trigger on_document_activity
after insert or update on documents
for each row execute procedure public.log_document_activity();

-- ---------- 4. NIEUWE PROJECTEN KRIJGEN NEUTRALE STANDAARDFASEN ----------
create or replace function public.create_project(
  p_name text,
  p_client text,
  p_location text,
  p_slug text
) returns projects
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_project projects;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'Niet ingelogd (auth.uid() is null)';
  end if;

  insert into projects (name, client, location, slug, created_by)
  values (p_name, p_client, p_location, p_slug, v_uid)
  returning * into v_project;

  insert into project_members (project_id, user_id, role, visible)
  values (v_project.id, v_uid, 'eigenaar', true)
  on conflict do nothing;

  insert into phases (project_id, number, name) values
    (v_project.id, 1, 'Voorbereiding'),
    (v_project.id, 2, 'Uitvoering'),
    (v_project.id, 3, 'Oplevering'),
    (v_project.id, 4, 'Nazorg');

  return v_project;
end;
$$;
