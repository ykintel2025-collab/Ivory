import { createClient } from "@/lib/supabase/server";
import StatCard from "@/components/StatCard";
import Badge from "@/components/Badge";
import RiskDonutChart from "@/components/RiskDonutChart";
import Link from "next/link";
import Image from "next/image";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  params,
}: {
  params: { projectId: string };
}) {
  const supabase = createClient();
  const projectId = params.projectId;

  const [
    { data: project },
    { data: risks },
    { data: blockers },
    { data: tasks },
    { data: budget },
    { data: phases },
    { data: registrations },
  ] = await Promise.all([
    supabase
      .from("projects")
      .select("name, client, location")
      .eq("id", projectId)
      .single(),
    supabase.from("risks").select("*").eq("project_id", projectId),
    supabase
      .from("external_blockers")
      .select("*, contacts(name)")
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

  const openRisks = (risks ?? []).filter((r) => r.status === "open");
  const riskCounts = {
    hoog: openRisks.filter((r) => r.rating === "hoog").length,
    midden: openRisks.filter((r) => r.rating === "midden").length,
    laag: openRisks.filter((r) => r.rating === "laag").length,
  };

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
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Image
          src="/logo-crest.png"
          alt=""
          width={40}
          height={40}
          className="h-10 w-10 shrink-0 rounded-full"
        />
        <div>
          <h1 className="font-display text-2xl text-ink">
            {project?.name ?? "Project"}
          </h1>
          <p className="text-sm text-ink/50">
            {[project?.client, project?.location].filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Open hoge risico's"
          value={riskCounts.hoog}
          tone={riskCounts.hoog > 0 ? "danger" : "success"}
        />
        <StatCard
          label="Geblokkeerd (wacht op extern)"
          value={blockedCount}
          tone={blockedCount > 0 ? "danger" : "success"}
        />
        <StatCard
          label="Openstaande taken"
          value={(tasks ?? []).filter((t) => t.status !== "klaar").length}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-ivory-line bg-ivory-card p-6 shadow-sm">
          <h2 className="mb-4 font-display text-lg text-ink">
            Risico-verdeling
          </h2>
          <RiskDonutChart
            hoog={riskCounts.hoog}
            midden={riskCounts.midden}
            laag={riskCounts.laag}
          />
        </div>

        <div className="rounded-xl border border-ivory-line bg-ivory-card p-6 shadow-sm">
          <h2 className="mb-1 font-display text-lg text-ink">
            Budget voor dit project
          </h2>
          {budgetRow ? (
            <>
              <p className="mb-4 text-xs text-ink/40">
                Raming t.o.v. toegewezen budget
              </p>
              <div className="mb-2 h-3 w-full overflow-hidden rounded-full bg-ivory">
                <div
                  className={`h-3 rounded-full ${
                    (budgetPct ?? 0) > 100 ? "bg-brick" : "bg-gold"
                  }`}
                  style={{ width: `${Math.min(budgetPct ?? 0, 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink/70">
                  €{(budgetRow.estimate_low / 1e6).toFixed(1)}–
                  {(budgetRow.estimate_high / 1e6).toFixed(1)}M raming
                </span>
                <span className="font-medium text-ink">
                  {budgetPct}% van €{(budgetRow.allocation / 1e6).toFixed(1)}M
                </span>
              </div>
            </>
          ) : (
            <p className="text-sm text-ink/40">
              Nog geen budgetraming vastgelegd voor dit project.
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-ivory-line bg-ivory-card p-6 shadow-sm">
          <h2 className="mb-4 font-display text-lg text-ink">
            Voortgang per fase
          </h2>
          <div className="space-y-3">
            {phaseProgress.map((phase) => (
              <div key={phase.id}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium text-ink/80">
                    Fase {phase.number} — {phase.name}
                  </span>
                  <span className="text-ink/40">
                    {phase.done}/{phase.total || 0}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-ivory">
                  <div
                    className="h-2 rounded-full bg-gold"
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

        <div className="rounded-xl border border-ivory-line bg-ivory-card p-6 shadow-sm">
          <h2 className="mb-4 font-display text-lg text-ink">
            Eerstvolgende deadlines
          </h2>
          {upcomingDeadlines.length === 0 ? (
            <p className="text-sm text-ink/40">Geen deadlines gevonden.</p>
          ) : (
            <ul className="space-y-3">
              {upcomingDeadlines.map((d, i) => (
                <li key={i} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-ink">{d.label}</p>
                    <p className="text-xs text-ink/40">{d.type}</p>
                  </div>
                  <span className="text-xs font-medium text-ink/50">
                    {new Date(d.date).toLocaleDateString("nl-NL")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-ivory-line bg-ivory-card p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg text-ink">
            Openstaande hoge risico's
          </h2>
          <Link
            href={`/projects/${projectId}/risks`}
            className="text-xs font-medium text-ink/50 hover:underline"
          >
            Alle risico's →
          </Link>
        </div>
        <div className="space-y-2">
          {(risks ?? [])
            .filter((r) => r.rating === "hoog" && r.status === "open")
            .map((r) => (
              <Link
                key={r.id}
                href={`/projects/${projectId}/risks`}
                className="flex items-center justify-between rounded-lg border border-ivory-line px-3 py-2 transition hover:border-gold"
              >
                <p className="text-sm text-ink/80">{r.title}</p>
                <Badge value={r.status} />
              </Link>
            ))}
          {(risks ?? []).filter((r) => r.rating === "hoog" && r.status === "open")
            .length === 0 && (
            <p className="text-sm text-ink/40">Geen open hoge risico's.</p>
          )}
        </div>
      </div>
    </div>
  );
}
