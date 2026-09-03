-- ============================================================
-- MIGRATIE: taken mogen los bestaan (zonder project), net als
-- documenten. Zichtbaar/beheerbaar voor alle ingelogde gebruikers
-- zolang ze niet aan een project hangen.
-- ============================================================

alter table tasks alter column project_id drop not null;

drop policy if exists "Leden volledige toegang" on tasks;
drop policy if exists "Toegang tot taken" on tasks;
create policy "Toegang tot taken" on tasks
  for all using (
    project_id is null or is_project_member(project_id)
  )
  with check (
    project_id is null or is_project_member(project_id)
  );

-- Activiteitenlog moet loze taken overslaan (activity_log vereist een project)
create or replace function public.log_task_activity()
returns trigger as $$
begin
  if TG_OP = 'INSERT' and new.project_id is not null then
    insert into activity_log(project_id, actor_id, action, entity_type, entity_label)
    values (new.project_id, auth.uid(), 'aangemaakt', 'taak', new.title);
  elsif TG_OP = 'UPDATE' and new.project_id is not null then
    if old.status is distinct from new.status then
      insert into activity_log(project_id, actor_id, action, entity_type, entity_label, detail)
      values (new.project_id, auth.uid(), 'status gewijzigd', 'taak', new.title, old.status || ' → ' || new.status);
    end if;
    if old.owner_id is distinct from new.owner_id then
      insert into activity_log(project_id, actor_id, action, entity_type, entity_label)
      values (new.project_id, auth.uid(), 'opnieuw toegewezen', 'taak', new.title);
    end if;
  elsif TG_OP = 'DELETE' and old.project_id is not null then
    insert into activity_log(project_id, actor_id, action, entity_type, entity_label)
    values (old.project_id, auth.uid(), 'verwijderd', 'taak', old.title);
  end if;
  return coalesce(new, old);
end;
$$ language plpgsql security definer set search_path = public;
