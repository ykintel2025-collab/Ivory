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
        <h1 className="font-display text-2xl text-ink">
          Partijen & Communicatie
        </h1>
        <p className="text-sm text-ink/50">
          Dossiers, communicatielog en openstaande externe blokkades
        </p>
      </div>

      <div className="rounded-xl border border-ivory-line bg-ivory-card p-6 shadow-sm">
        <h2 className="mb-4 font-display text-lg text-ink">
          Wachten op extern
        </h2>
        <div className="space-y-2">
          {(blockers ?? [])
            .filter((b) => b.status === "open")
            .map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between rounded-lg border border-ivory-line px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium text-ink">{b.title}</p>
                  <p className="text-xs text-ink/40">
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
            <p className="text-sm text-ink/40">
              Geen openstaande externe blokkades.
            </p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-ivory-line bg-ivory-card p-6 shadow-sm">
        <h2 className="mb-4 font-display text-lg text-ink">Partijen</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {(parties ?? []).map((p) => (
            <div key={p.id} className="rounded-lg border border-ivory-line p-3">
              <div className="mb-1 flex items-center justify-between">
                <p className="text-sm font-medium text-ink">{p.name}</p>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    p.status === "actief"
                      ? "bg-teal-soft text-teal"
                      : p.status === "in gesprek"
                      ? "bg-amber-soft text-amber"
                      : "bg-slate-100 text-ink/50"
                  }`}
                >
                  {p.status}
                </span>
              </div>
              <p className="text-xs text-ink/50">{p.type}</p>
              {p.contact_name && (
                <p className="mt-1 text-xs text-ink/40">
                  {p.contact_name}
                  {p.contact_email && ` · ${p.contact_email}`}
                </p>
              )}
              {p.notes && (
                <p className="mt-2 text-xs text-ink/50">{p.notes}</p>
              )}
            </div>
          ))}
          {(parties ?? []).length === 0 && (
            <p className="text-sm text-ink/40">Nog geen partijen toegevoegd.</p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-ivory-line bg-ivory-card p-6 shadow-sm">
        <h2 className="mb-4 font-display text-lg text-ink">
          Recente communicatie
        </h2>
        <div className="space-y-3">
          {(logs ?? []).map((log) => (
            <div key={log.id} className="border-b border-ivory-line pb-3 last:border-0">
              <div className="mb-1 flex items-center justify-between text-xs text-ink/40">
                <span>{log.parties?.name ?? "Onbekende partij"}</span>
                <span>
                  {new Date(log.contact_date).toLocaleDateString("nl-NL")}
                </span>
              </div>
              <p className="text-sm text-ink/80">{log.summary}</p>
              {log.follow_up && (
                <p className="mt-1 text-xs text-ink/50">
                  Vervolgactie: {log.follow_up}
                </p>
              )}
            </div>
          ))}
          {(logs ?? []).length === 0 && (
            <p className="text-sm text-ink/40">
              Nog geen communicatie gelogd.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
