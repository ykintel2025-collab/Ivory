import { createClient } from "@/lib/supabase/server";
import StatCard from "@/components/StatCard";
import Badge from "@/components/Badge";
import RiskDonutChart from "@/components/RiskDonutChart";
import DeleteButton from "@/components/DeleteButton";
import DeleteProjectButton from "@/components/DeleteProjectButton";
import ManagePhasesForm from "@/components/ManagePhasesForm";
import EditModal from "@/components/EditModal";
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    { data: project },
    { data: risks },
    { data: blockers },
    { data: tasks },
    { data: budget },
    { data: phases },
    { data: registrations },
    { data: projectMembers },
    { data: viewerProfile },
    { data: activityLog },
  ] = await Promise.all([
    supabase
      .from("projects")
      .select("name, client, location, status")
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
    supabase.from("phases").select("*").eq("project_id", projectId).order("number"),
    supabase
      .from("registrations")
      .select("*")
      .eq("project_id", projectId)
      .order("expected_completion", { ascending: true, nullsFirst: false }),
    supabase
      .from("project_members")
      .select("id, user_id, profiles(id, full_name, hidden)")
      .eq("project_id", projectId),
    supabase
      .from("profiles")
      .select("can_see_hidden")
      .eq("id", user?.id ?? "")
      .single(),
    supabase
      .from("activity_log")
      .select("*, profiles(full_name)")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(15),
  ]);

  const canSeeHidden = viewerProfile?.can_see_hidden ?? false;
  const visibleMembers = (projectMembers ?? []).filter(
    (m: any) => !m.profiles?.hidden || canSeeHidden
  );

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
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Image
            src="/logo-crest.png"
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 rounded-full"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl text-ink">
                {project?.name ?? "Project"}
              </h1>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  project?.status === "actief"
                    ? "bg-teal-soft text-teal"
                    : project?.status === "gepauzeerd"
                    ? "bg-amber-soft text-amber"
                    : "bg-ink/5 text-ink/50"
                }`}
              >
                {project?.status ?? "actief"}
              </span>
              <EditModal
                table="projects"
                id={projectId}
                title="Project bewerken"
                initialValues={{
                  name: project?.name,
                  client: project?.client,
                  location: project?.location,
                  status: project?.status,
                }}
                fields={[
                  { key: "name", label: "Projectnaam", type: "text" },
                  { key: "client", label: "Opdrachtgever", type: "text" },
                  { key: "location", label: "Locatie", type: "text" },
                  {
                    key: "status",
                    label: "Status",
                    type: "select",
                    options: [
                      { value: "actief", label: "Actief" },
                      { value: "gepauzeerd", label: "Gepauzeerd" },
                      { value: "afgerond", label: "Afgerond" },
                    ],
                  },
                ]}
              />
            </div>
            <p className="text-sm text-ink/50">
              {[project?.client, project?.location].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-ivory-line bg-ivory-card p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="font-display text-lg text-ink">Team</h2>
          <p className="text-xs text-ink/40">
            Vult zich automatisch aan zodra je iemand een taak toewijst
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {visibleMembers.map((m: any) => (
            <div
              key={m.id}
              className="flex items-center gap-2 rounded-full border border-ivory-line py-1 pl-3 pr-1.5"
            >
              <span className="text-sm text-ink">
                {m.profiles?.hidden && !canSeeHidden
                  ? "Intern teamlid"
                  : m.profiles?.full_name}
              </span>
              <DeleteButton
                table="project_members"
                id={m.id}
                confirmText="Deze persoon uit dit project verwijderen?"
              />
            </div>
          ))}
          {visibleMembers.length === 0 && (
            <p className="text-sm text-ink/40">
              Nog niemand — wijs een taak toe aan iemand en die verschijnt hier.
            </p>
          )}
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

      <div className="rounded-xl border border-ivory-line bg-ivory-card p-6 shadow-sm">
        <h2 className="mb-4 font-display text-lg text-ink">Activiteit</h2>
        <div className="space-y-2">
          {(activityLog ?? []).map((a: any) => (
            <div key={a.id} className="flex items-start gap-2 text-sm">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
              <p className="text-ink/70">
                <span className="font-medium text-ink">
                  {a.profiles?.full_name ?? "Iemand"}
                </span>{" "}
                {a.action} {a.entity_type} "{a.entity_label}"
                {a.detail ? ` (${a.detail})` : ""}
                <span className="ml-1 text-xs text-ink/40">
                  · {new Date(a.created_at).toLocaleString("nl-NL", { dateStyle: "short", timeStyle: "short" })}
                </span>
              </p>
            </div>
          ))}
          {(activityLog ?? []).length === 0 && (
            <p className="text-sm text-ink/40">Nog geen activiteit geregistreerd.</p>
          )}
        </div>
      </div>

      <ManagePhasesForm projectId={projectId} phases={phases ?? []} />

      <div className="rounded-xl border border-ivory-line bg-ivory-card p-6 shadow-sm">
        <h2 className="mb-3 font-display text-lg text-ink/60">Gevarenzone</h2>
        <DeleteProjectButton
          projectId={projectId}
          projectName={project?.name ?? ""}
        />
      </div>
    </div>
  );
}
