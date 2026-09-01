import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import NewProjectForm from "@/components/NewProjectForm";
import StatCard from "@/components/StatCard";
import Badge from "@/components/Badge";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    { data: memberships },
    { data: openHighRisks },
    { data: openBlockers },
    { data: openTasks },
    { data: registrations },
  ] = await Promise.all([
    supabase
      .from("project_members")
      .select("project_id, role, projects(id, name, client, location, status)")
      .eq("user_id", user?.id ?? ""),
    // RLS scoopt dit automatisch tot projecten waar de gebruiker lid van is
    supabase
      .from("risks")
      .select("*, projects(name)")
      .eq("status", "open")
      .eq("rating", "hoog"),
    supabase
      .from("external_blockers")
      .select("*, projects(name), parties(name)")
      .eq("status", "open"),
    supabase
      .from("tasks")
      .select("*, projects(name)")
      .neq("status", "klaar")
      .order("due_date", { ascending: true, nullsFirst: false }),
    supabase
      .from("registrations")
      .select("*, projects(name)")
      .neq("registration_status", "goedgekeurd")
      .not("expected_completion", "is", null)
      .order("expected_completion", { ascending: true }),
  ]);

  const projects = (memberships ?? [])
    .map((m: any) => m.projects)
    .filter(Boolean);

  const upcomingDeadlines = [
    ...(openTasks ?? [])
      .filter((t: any) => t.due_date)
      .map((t: any) => ({
        label: t.title,
        date: t.due_date,
        type: "Taak",
        project: t.projects?.name,
      })),
    ...(registrations ?? []).map((r: any) => ({
      label: r.item_name,
      date: r.expected_completion,
      type: "Registratie",
      project: r.projects?.name,
    })),
  ]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">
            Overzicht over al je projecten heen
          </p>
        </div>

        {/* Globaal overzicht */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard
            label="Open hoge risico's"
            value={(openHighRisks ?? []).length}
            tone={(openHighRisks ?? []).length > 0 ? "danger" : "success"}
          />
          <StatCard
            label="Geblokkeerd (wacht op extern)"
            value={(openBlockers ?? []).length}
            tone={(openBlockers ?? []).length > 0 ? "danger" : "success"}
          />
          <StatCard label="Openstaande taken" value={(openTasks ?? []).length} />
          <StatCard label="Actieve projecten" value={projects.length} />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Openstaande hoge risico's, alle projecten */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-slate-900">
              Open hoge risico's
            </h2>
            <div className="space-y-2">
              {(openHighRisks ?? []).slice(0, 6).map((r: any) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2"
                >
                  <div>
                    <p className="text-sm text-slate-700">{r.title}</p>
                    <p className="text-xs text-slate-400">{r.projects?.name}</p>
                  </div>
                  <Badge value="hoog" />
                </div>
              ))}
              {(openHighRisks ?? []).length === 0 && (
                <p className="text-sm text-slate-400">
                  Geen open hoge risico's. 👍
                </p>
              )}
            </div>
          </div>

          {/* Eerstvolgende deadlines, alle projecten */}
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
                      <p className="text-xs text-slate-400">
                        {d.type} · {d.project}
                      </p>
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

        {/* Wachten op extern, alle projecten */}
        {(openBlockers ?? []).length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-slate-900">
              Wachten op extern
            </h2>
            <div className="space-y-2">
              {(openBlockers ?? []).map((b: any) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2"
                >
                  <div>
                    <p className="text-sm text-slate-700">{b.title}</p>
                    <p className="text-xs text-slate-400">
                      {b.projects?.name} · wacht op {b.parties?.name ?? "onbekend"}
                    </p>
                  </div>
                  <Badge value="open" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projecten */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
              Jouw projecten
            </h2>
            <NewProjectForm />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {projects.map((p: any) => (
              <Link
                key={p.id}
                href={`/projects/${p.id}/dashboard`}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-400"
              >
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">{p.name}</p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      p.status === "actief"
                        ? "bg-green-100 text-green-700"
                        : p.status === "gepauzeerd"
                        ? "bg-orange-100 text-orange-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {p.status}
                  </span>
                </div>
                {p.client && <p className="text-xs text-slate-500">{p.client}</p>}
                {p.location && (
                  <p className="text-xs text-slate-400">{p.location}</p>
                )}
              </Link>
            ))}
            {projects.length === 0 && (
              <p className="text-sm text-slate-400">
                Nog geen projecten. Maak je eerste project aan.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
