import { createClient } from "@/lib/supabase/server";
import Badge from "@/components/Badge";

export const dynamic = "force-dynamic";

const RATING_ORDER: Record<string, number> = { hoog: 0, midden: 1, laag: 2 };

export default async function RisksPage({
  params,
}: {
  params: { projectId: string };
}) {
  const supabase = createClient();
  const { data: risks } = await supabase
    .from("risks")
    .select("*, profiles(full_name)")
    .eq("project_id", params.projectId)
    .order("status")
    .order("created_at", { ascending: false });

  const sorted = [...(risks ?? [])].sort(
    (a, b) => RATING_ORDER[a.rating] - RATING_ORDER[b.rating]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Risicoregister</h1>
        <p className="text-sm text-slate-500">
          Alle geïdentificeerde risico's, beoordeling en mitigatie
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Risico</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Mitigatie</th>
              <th className="px-4 py-3">Eigenaar</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.id} className="border-b border-slate-50 align-top">
                <td className="px-4 py-3 font-medium text-slate-800">
                  {r.title}
                  {r.description && (
                    <p className="mt-1 text-xs font-normal text-slate-400">
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
                <td className="px-4 py-3 text-slate-600">{r.mitigation ?? "—"}</td>
                <td className="px-4 py-3 text-slate-500">
                  {r.profiles?.full_name ?? "—"}
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
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
