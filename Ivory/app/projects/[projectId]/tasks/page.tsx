import { createClient } from "@/lib/supabase/server";
import KanbanBoard from "@/components/KanbanBoard";
import NewTaskForm from "@/components/NewTaskForm";

export const dynamic = "force-dynamic";

export default async function TasksPage({
  params,
}: {
  params: { projectId: string };
}) {
  const supabase = createClient();
  const projectId = params.projectId;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: tasks }, { data: allProfiles }, { data: viewerProfile }, { data: phases }] =
    await Promise.all([
      supabase
        .from("tasks")
        .select("*, phases(number, name), profiles(id, full_name, hidden)")
        .eq("project_id", projectId)
        .order("due_date", { ascending: true, nullsFirst: false }),
      supabase.from("profiles").select("id, full_name, hidden").order("full_name"),
      supabase
        .from("profiles")
        .select("can_see_hidden")
        .eq("id", user?.id ?? "")
        .single(),
      supabase.from("phases").select("*").order("number"),
    ]);

  const canSeeHidden = viewerProfile?.can_see_hidden ?? false;

  // Lijst met mensen die je mag toewijzen: iedereen, tenzij verborgen en jij mag dat niet zien
  const assignableProfiles = (allProfiles ?? [])
    .filter((p: any) => !p.hidden || canSeeHidden)
    .map((p: any) => ({ user_id: p.id, full_name: p.full_name }));

  // Namen maskeren op taken waarvan de eigenaar verborgen is en jij geen rechten hebt
  const maskedTasks = (tasks ?? []).map((t: any) => {
    if (t.profiles?.hidden && !canSeeHidden) {
      return { ...t, profiles: { full_name: "Intern toegewezen" } };
    }
    return t;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-ink">Taken</h1>
          <p className="text-sm text-ink/50">
            Kanban-bord — gebruik de knoppen om taken te verplaatsen
          </p>
        </div>
      </div>
      <NewTaskForm
        projectId={projectId}
        members={assignableProfiles}
        phases={phases ?? []}
      />
      <KanbanBoard
        tasks={maskedTasks as any}
        members={assignableProfiles}
        phases={phases ?? []}
        projectId={projectId}
      />
    </div>
  );
}
