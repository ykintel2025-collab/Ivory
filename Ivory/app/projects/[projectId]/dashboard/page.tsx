import { createClient } from "@/lib/supabase/server";
import StatCard from "@/components/StatCard";
import Badge from "@/components/Badge";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  params,
}: {
  params: { projectId: string };
}) {
  const supabase = createClient();
  const projectId = params.projectId;

  const [
    { data: risks },
    { data: blockers },
    { data: tasks },
    { data: budget },
    { data: phases },
    { data: registrations },
  ] = await Promise.all([
    supabase.from("risks").select("*").eq("project_id", projectId),
    supabase
      .from("external_blockers")
      .select("*, parties(name)")
      .eq("project_id", projectId)
      .eq("status", "open"),
    supabase
      .from("tasks")
      .select("*, phases(number, name)")
      .eq("project_id", projectId),
    supabase
      .from("budget_snapshot")
      .select("*")
      .eq("project_id", projectId)
      .order("snapshot_date", { ascending: false })
      .limit(1),
    supabase.from("phases").select("*").order("number"),
    supabase
      .from("registrations")
      .select("*")
      .eq("project_id", projectId)
      .order("expected_completion", { ascending: true, nullsFirst: false }),
  ]);

  const openHighRisks = (risks ?? []).filter(
    (r) => r.rating === "hoog" && r.status === "open"
  ).length;

  const blockedCount = blockers?.length ?? 0;

  const budgetRow = budget?.[0];
  const budgetPct = budgetRow
    ? Math.round((budgetRow.estimate_high / budgetRow.allocation) * 100)
    : null;

  const phaseProgress = (phases ?? []).map((phase) => {
    const phaseTasks = (tasks ?? []).filter((t) => t.phase_id === phase.id);
    const done = phaseTasks.filter((t) => t.status === "klaar").length;
    const total = phaseTasks.length;
    return { ...phase, done, total };
  });

  const upcomingDeadlines = [
    ...(tasks ?? [])
      .filter((t) => t.due_date && t.status !== "klaar")
      .map((t) => ({ label: t.title, date: t.due_date, type: "Taak" })),
    ...(registrations ?? [])
      .filter((r) => r.expected_completion && r.registration_status !== "goedgekeurd")
      .map((r) => ({
        label: r.item_name,
        date: r.expected_completion,
        type: "Registratie",
      })),
  ]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">Projectoverzicht</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label="Open hoge risico's"
          value={openHighRisks}
          tone={openHighRisks > 0 ? "danger" : "success"}
        />
        <StatCard
          label="Geblokkeerd (wacht op extern)"
          value={blockedCount}
          tone={blockedCount > 0 ? "danger" : "success"}
        />
        <StatCard
          label="Budgetraming"
          value={budgetPct ? `${budgetPct}%` : "—"}
          sub={
            budgetRow
              ? `€${(budgetRow.estimate_low / 1e6).toFixed(1)}–${(
                  budgetRow.estimate_high / 1e6
                ).toFixed(1)}M van €${(budgetRow.allocation / 1e6).toFixed(1)}M`
              : "Nog geen data"
          }
        />
        <StatCard
          label="Openstaande taken"
          value={(tasks ?? []).filter((t) => t.status !== "klaar").length}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">
            Voortgang per fase
          </h2>
          <div className="space-y-3">
            {phaseProgress.map((phase) => (
              <div key={phase.id}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">
                    Fase {phase.number} — {phase.name}
                  </span>
                  <span className="text-slate-400">
                    {phase.done}/{phase.total || 0}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-slate-900"
                    style={{
                      width: phase.total
                        ? `${(phase.done / phase.total) * 100}%`
                        : "0%",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">
            Eerstvolgende deadlines
          </h2>
          {upcomingDeadlines.length === 0 ? (
            <p className="text-sm text-slate-400">Geen deadlines gevonden.</p>
          ) : (
            <ul className="space-y-3">
              {upcomingDeadlines.map((d, i) => (
                <li key={i} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-slate-800">{d.label}</p>
                    <p className="text-xs text-slate-400">{d.type}</p>
                  </div>
                  <span className="text-xs font-medium text-slate-500">
                    {new Date(d.date).toLocaleDateString("nl-NL")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">
            Openstaande hoge risico's
          </h2>
          <Link
            href={`/projects/${projectId}/risks`}
            className="text-xs font-medium text-slate-500 hover:underline"
          >
            Alle risico's →
          </Link>
        </div>
        <div className="space-y-2">
          {(risks ?? [])
            .filter((r) => r.rating === "hoog" && r.status === "open")
            .map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2"
              >
                <p className="text-sm text-slate-700">{r.title}</p>
                <Badge value={r.status} />
              </div>
            ))}
          {(risks ?? []).filter((r) => r.rating === "hoog" && r.status === "open")
            .length === 0 && (
            <p className="text-sm text-slate-400">Geen open hoge risico's.</p>
          )}
        </div>
      </div>
    </div>
  );
}
