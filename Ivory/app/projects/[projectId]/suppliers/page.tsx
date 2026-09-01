import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SuppliersPage({
  params,
}: {
  params: { projectId: string };
}) {
  const supabase = createClient();
  const { data: items } = await supabase
    .from("equipment_items")
    .select("*")
    .eq("project_id", params.projectId)
    .order("department", { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          Apparatuur en leveranciers
        </h1>
        <p className="text-sm text-slate-500">Kernitems per afdeling</p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Omschrijving</th>
              <th className="px-4 py-3">Afdeling</th>
              <th className="px-4 py-3">Leverancier</th>
              <th className="px-4 py-3">Model</th>
              <th className="px-4 py-3">Certificering</th>
              <th className="px-4 py-3">Prijsindicatie</th>
            </tr>
          </thead>
          <tbody>
            {(items ?? []).map((item) => (
              <tr key={item.id} className="border-b border-slate-50">
                <td className="px-4 py-3 text-xs text-slate-400">
                  {item.line_code ?? "—"}
                </td>
                <td className="px-4 py-3 font-medium text-slate-800">
                  {item.description}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {item.department ?? "—"}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {item.supplier ?? "—"}
                </td>
                <td className="px-4 py-3 text-slate-600">{item.model ?? "—"}</td>
                <td className="px-4 py-3 text-slate-600">
                  {item.certification_status ?? "—"}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {item.price_estimate
                    ? `${item.currency ?? "EUR"} ${item.price_estimate.toLocaleString(
                        "nl-NL"
                      )}`
                    : "—"}
                </td>
              </tr>
            ))}
            {(items ?? []).length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                  Nog geen apparatuur toegevoegd.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
