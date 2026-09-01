import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import NewProjectForm from "@/components/NewProjectForm";
import StatCard from "@/components/StatCard";
import Badge from "@/components/Badge";
import MyTasksList from "@/components/MyTasksList";

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
    { data: myTasksRaw },
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
      .select("*, projects(name), contacts(name)")
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
    supabase
      .from("tasks")
      .select("id, title, due_date, urgency, project_id, projects(name)")
      .eq("owner_id", user?.id ?? "")
      .neq("status", "klaar")
      .order("due_date", { ascending: true, nullsFirst: false }),
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
        href: `/projects/${t.project_id}/tasks`,
      })),
    ...(registrations ?? []).map((r: any) => ({
      label: r.item_name,
      date: r.expected_completion,
      type: "Registratie",
      project: r.projects?.name,
      href: `/projects/${r.project_id}/tracker`,
    })),
  ]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  const myTasks = (myTasksRaw ?? []).map((t: any) => ({
    id: t.id,
    title: t.title,
    due_date: t.due_date,
    urgency: t.urgency,
    project_id: t.project_id,
    project_name: t.projects?.name ?? "",
  }));

  return (
    <div className="min-h-screen bg-ivory px-4 py-10 md:px-10">
      <div className="mx-auto max-w-5xl space-y-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl text-ink">Dashboard</h1>
            <p className="text-sm text-ink/50">
              Overzicht over al je projecten heen
            </p>
          </div>
          <Link
            href="/contacts"
            className="shrink-0 rounded-lg border border-ivory-line bg-ivory-card px-4 py-2 text-sm font-medium text-ink hover:border-gold"
          >
            Relaties beheren
          </Link>
        </div>

        {/* Globaal overzicht */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <StatCard
            label="Mijn open taken"
            value={myTasks.length}
          />
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

        {/* Mijn taken */}
        <div className="rounded-xl border border-ivory-line bg-ivory-card p-6 shadow-sm">
          <h2 className="mb-4 font-display text-lg text-ink">Mijn taken</h2>
          <MyTasksList tasks={myTasks} />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Openstaande hoge risico's, alle projecten */}
          <div className="rounded-xl border border-ivory-line bg-ivory-card p-6 shadow-sm">
            <h2 className="mb-4 font-display text-lg text-ink">
              Open hoge risico's
            </h2>
            <div className="space-y-2">
              {(openHighRisks ?? []).slice(0, 6).map((r: any) => (
                <Link
                  key={r.id}
                  href={`/projects/${r.project_id}/risks`}
                  className="flex items-center justify-between rounded-lg border border-ivory-line px-3 py-2 transition hover:border-gold"
                >
                  <div>
                    <p className="text-sm text-ink/80">{r.title}</p>
                    <p className="text-xs text-ink/40">{r.projects?.name}</p>
                  </div>
                  <Badge value="hoog" />
                </Link>
              ))}
              {(openHighRisks ?? []).length === 0 && (
                <p className="text-sm text-ink/40">
                  Geen open hoge risico's. 👍
                </p>
              )}
            </div>
          </div>

          {/* Eerstvolgende deadlines, alle projecten */}
          <div className="rounded-xl border border-ivory-line bg-ivory-card p-6 shadow-sm">
            <h2 className="mb-4 font-display text-lg text-ink">
              Eerstvolgende deadlines
            </h2>
            {upcomingDeadlines.length === 0 ? (
              <p className="text-sm text-ink/40">Geen deadlines gevonden.</p>
            ) : (
              <ul className="space-y-3">
                {upcomingDeadlines.map((d, i) => (
                  <li key={i}>
                    <Link
                      href={d.href}
                      className="flex items-center justify-between rounded-lg text-sm transition hover:text-gold"
                    >
                      <div>
                        <p className="font-medium text-ink">{d.label}</p>
                        <p className="text-xs text-ink/40">
                          {d.type} · {d.project}
                        </p>
                      </div>
                      <span className="text-xs font-medium text-ink/50">
                        {new Date(d.date).toLocaleDateString("nl-NL")}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Wachten op extern, alle projecten */}
        {(openBlockers ?? []).length > 0 && (
          <div className="rounded-xl border border-ivory-line bg-ivory-card p-6 shadow-sm">
            <h2 className="mb-4 font-display text-lg text-ink">
              Wachten op extern
            </h2>
            <div className="space-y-2">
              {(openBlockers ?? []).map((b: any) => (
                <Link
                  key={b.id}
                  href={`/projects/${b.project_id}/parties`}
                  className="flex items-center justify-between rounded-lg border border-ivory-line px-3 py-2 transition hover:border-gold"
                >
                  <div>
                    <p className="text-sm text-ink/80">{b.title}</p>
                    <p className="text-xs text-ink/40">
                      {b.projects?.name} · wacht op {b.contacts?.name ?? "onbekend"}
                    </p>
                  </div>
                  <Badge value="open" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Projecten */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg text-ink">
              Jouw projecten
            </h2>
            <NewProjectForm />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {projects.map((p: any) => (
              <Link
                key={p.id}
                href={`/projects/${p.id}/dashboard`}
                className="rounded-xl border border-ivory-line bg-ivory-card p-6 shadow-sm transition hover:border-gold"
              >
                <div className="mb-1 flex items-center justify-between">
                  <p className="font-display text-lg text-ink">{p.name}</p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      p.status === "actief"
                        ? "bg-teal-soft text-teal"
                        : p.status === "gepauzeerd"
                        ? "bg-amber-soft text-amber"
                        : "bg-slate-100 text-ink/50"
                    }`}
                  >
                    {p.status}
                  </span>
                </div>
                {p.client && <p className="text-xs text-ink/50">{p.client}</p>}
                {p.location && (
                  <p className="text-xs text-ink/40">{p.location}</p>
                )}
              </Link>
            ))}
            {projects.length === 0 && (
              <p className="text-sm text-ink/40">
                Nog geen projecten. Maak je eerste project aan.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
