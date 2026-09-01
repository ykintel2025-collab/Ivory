import { createClient } from "@/lib/supabase/server";
import KanbanBoard from "@/components/KanbanBoard";

export const dynamic = "force-dynamic";

export default async function TasksPage({
  params,
}: {
  params: { projectId: string };
}) {
  const supabase = createClient();
  const { data: tasks } = await supabase
    .from("tasks")
    .select("*, phases(number, name)")
    .eq("project_id", params.projectId)
    .order("due_date", { ascending: true, nullsFirst: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-ink">Taken</h1>
        <p className="text-sm text-ink/50">
          Kanban-bord — gebruik de knoppen om taken te verplaatsen
        </p>
      </div>
      <KanbanBoard tasks={(tasks as any) ?? []} />
    </div>
  );
}
