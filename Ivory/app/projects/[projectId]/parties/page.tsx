import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PartiesPage({
  params,
}: {
  params: { projectId: string };
}) {
  const supabase = createClient();
  const projectId = params.projectId;

  const [{ data: parties }, { data: blockers }, { data: logs }] =
    await Promise.all([
      supabase.from("parties").select("*").eq("project_id", projectId).order("name"),
      supabase
        .from("external_blockers")
        .select("*, parties(name)")
        .eq("project_id", projectId)
        .order("status"),
      supabase
        .from("communication_log")
        .select("*, parties(name), profiles(full_name)")
        .eq("project_id", projectId)
        .order("contact_date", { ascending: false })
        .limit(10),
    ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          Partijen & Communicatie
        </h1>
        <p className="text-sm text-slate-500">
          Dossiers, communicatielog en openstaande externe blokkades
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">
          Wachten op extern
        </h2>
        <div className="space-y-2">
          {(blockers ?? [])
            .filter((b) => b.status === "open")
            .map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">{b.title}</p>
                  <p className="text-xs text-slate-400">
                    Wacht op: {b.parties?.name ?? "onbekend"}
                    {b.reference && ` · ${b.reference}`}
                  </p>
                </div>
                <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
                  Open
                </span>
              </div>
            ))}
          {(blockers ?? []).filter((b) => b.status === "open").length === 0 && (
            <p className="text-sm text-slate-400">
              Geen openstaande externe blokkades.
            </p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">Partijen</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {(parties ?? []).map((p) => (
            <div key={p.id} className="rounded-xl border border-slate-100 p-3">
              <div className="mb-1 flex items-center justify-between">
                <p className="text-sm font-medium text-slate-800">{p.name}</p>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    p.status === "actief"
                      ? "bg-green-100 text-green-700"
                      : p.status === "in gesprek"
                      ? "bg-orange-100 text-orange-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {p.status}
                </span>
              </div>
              <p className="text-xs text-slate-500">{p.type}</p>
              {p.contact_name && (
                <p className="mt-1 text-xs text-slate-400">
                  {p.contact_name}
                  {p.contact_email && ` · ${p.contact_email}`}
                </p>
              )}
              {p.notes && (
                <p className="mt-2 text-xs text-slate-500">{p.notes}</p>
              )}
            </div>
          ))}
          {(parties ?? []).length === 0 && (
            <p className="text-sm text-slate-400">Nog geen partijen toegevoegd.</p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">
          Recente communicatie
        </h2>
        <div className="space-y-3">
          {(logs ?? []).map((log) => (
            <div key={log.id} className="border-b border-slate-50 pb-3 last:border-0">
              <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
                <span>{log.parties?.name ?? "Onbekende partij"}</span>
                <span>
                  {new Date(log.contact_date).toLocaleDateString("nl-NL")}
                </span>
              </div>
              <p className="text-sm text-slate-700">{log.summary}</p>
              {log.follow_up && (
                <p className="mt-1 text-xs text-slate-500">
                  Vervolgactie: {log.follow_up}
                </p>
              )}
            </div>
          ))}
          {(logs ?? []).length === 0 && (
            <p className="text-sm text-slate-400">
              Nog geen communicatie gelogd.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
