import { createClient } from "@/lib/supabase/server";
import Badge from "@/components/Badge";
import AddRiskForm from "@/components/AddRiskForm";
import DeleteButton from "@/components/DeleteButton";

export const dynamic = "force-dynamic";

const RATING_ORDER: Record<string, number> = { hoog: 0, midden: 1, laag: 2 };

export default async function RisksPage({
  params,
}: {
  params: { projectId: string };
}) {
  const supabase = createClient();
  const projectId = params.projectId;

  const [{ data: risks }, { data: members }] = await Promise.all([
    supabase
      .from("risks")
      .select("*, profiles(full_name)")
      .eq("project_id", projectId)
      .order("status")
      .order("created_at", { ascending: false }),
    supabase
      .from("project_members")
      .select("user_id, profiles(full_name)")
      .eq("project_id", projectId),
  ]);

  const memberList = (members ?? []).map((m: any) => ({
    user_id: m.user_id,
    full_name: m.profiles?.full_name ?? "Onbekend",
  }));

  const sorted = [...(risks ?? [])].sort(
    (a, b) => RATING_ORDER[a.rating] - RATING_ORDER[b.rating]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-ink">Risicoregister</h1>
        <p className="text-sm text-ink/50">
          Alle geïdentificeerde risico's, beoordeling en mitigatie
        </p>
      </div>

      <AddRiskForm projectId={projectId} members={memberList} />

      <div className="overflow-x-auto rounded-xl border border-ivory-line bg-ivory-card shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-ivory-line bg-ivory text-xs uppercase tracking-wide text-ink/50">
            <tr>
              <th className="px-4 py-3">Risico</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Mitigatie</th>
              <th className="px-4 py-3">Eigenaar</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r: any) => (
              <tr key={r.id} className="border-b border-ivory-line align-top">
                <td className="px-4 py-3 font-medium text-ink">
                  {r.title}
                  {r.description && (
                    <p className="mt-1 text-xs font-normal text-ink/40">
                      {r.description}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Badge value={r.rating} />
                </td>
                <td className="px-4 py-3">
                  <Badge value={r.status} />
                </td>
                <td className="px-4 py-3 text-ink/70">{r.mitigation ?? "—"}</td>
                <td className="px-4 py-3 text-ink/50">
                  {r.profiles?.full_name ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <DeleteButton table="risks" id={r.id} />
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-ink/40">
                  Nog geen risico's toegevoegd.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
