import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import NewProjectForm from "@/components/NewProjectForm";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: memberships } = await supabase
    .from("project_members")
    .select("project_id, role, projects(id, name, client, location, status)")
    .eq("user_id", user?.id ?? "");

  const projects = (memberships ?? [])
    .map((m: any) => m.projects)
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              Jouw projecten
            </h1>
            <p className="text-sm text-slate-500">
              Kies een project of maak een nieuwe aan
            </p>
          </div>
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
              {p.client && (
                <p className="text-xs text-slate-500">{p.client}</p>
              )}
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
  );
}
