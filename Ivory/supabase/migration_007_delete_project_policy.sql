-- ============================================================
-- MIGRATIE: projecten mogen verwijderd worden, alleen door de
-- eigenaar van dat project.
-- ============================================================

drop policy if exists "Eigenaar verwijdert project" on projects;
create policy "Eigenaar verwijdert project" on projects
  for delete
  using (
    exists (
      select 1 from project_members
      where project_id = projects.id
        and user_id = auth.uid()
        and role = 'eigenaar'
    )
  );
