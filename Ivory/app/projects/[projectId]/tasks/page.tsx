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

  const [{ data: tasks }, { data: members }, { data: phases }] =
    await Promise.all([
      supabase
        .from("tasks")
        .select("*, phases(number, name), profiles(full_name)")
        .eq("project_id", projectId)
        .order("due_date", { ascending: true, nullsFirst: false }),
      supabase
        .from("project_members")
        .select("user_id, profiles(full_name)")
        .eq("project_id", projectId),
      supabase.from("phases").select("*").order("number"),
    ]);

  const memberList = (members ?? [])
    .map((m: any) => ({
      user_id: m.user_id,
      full_name: m.profiles?.full_name ?? "Onbekend",
    }))
    .filter((m) => m.full_name !== "Onbekend" || m.user_id);

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
        members={memberList}
        phases={phases ?? []}
      />
      <KanbanBoard
        tasks={(tasks as any) ?? []}
        members={memberList}
        phases={phases ?? []}
      />
    </div>
  );
}
