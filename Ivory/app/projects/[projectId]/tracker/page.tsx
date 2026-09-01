import { createClient } from "@/lib/supabase/server";
import Badge from "@/components/Badge";

export const dynamic = "force-dynamic";

export default async function TrackerPage({
  params,
}: {
  params: { projectId: string };
}) {
  const supabase = createClient();
  const { data: registrations } = await supabase
    .from("registrations")
    .select("*, profiles(full_name)")
    .eq("project_id", params.projectId)
    .order("expected_completion", { ascending: true, nullsFirst: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          Registratietracker
        </h1>
        <p className="text-sm text-slate-500">
          Registratiestatus per apparaat (bv. MDMA/MOHAP) — Klasse II/III kan
          tot 12 maanden duren
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Klasse</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Verwacht klaar</th>
              <th className="px-4 py-3">Eigenaar</th>
            </tr>
          </thead>
          <tbody>
            {(registrations ?? []).map((r) => (
              <tr key={r.id} className="border-b border-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">
                  {r.item_name}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {r.device_class ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <Badge value={r.registration_status} />
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {r.expected_completion
                    ? new Date(r.expected_completion).toLocaleDateString("nl-NL")
                    : "—"}
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {r.profiles?.full_name ?? "—"}
                </td>
              </tr>
            ))}
            {(registrations ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  Nog geen registraties toegevoegd.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
