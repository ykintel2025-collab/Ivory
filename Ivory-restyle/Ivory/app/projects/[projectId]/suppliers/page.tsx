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
        <h1 className="font-display text-2xl text-ink">
          Apparatuur en leveranciers
        </h1>
        <p className="text-sm text-ink/50">Kernitems per afdeling</p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-ivory-line bg-ivory-card shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-ivory-line bg-ivory text-xs uppercase tracking-wide text-ink/50">
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
              <tr key={item.id} className="border-b border-ivory-line">
                <td className="px-4 py-3 text-xs text-ink/40">
                  {item.line_code ?? "—"}
                </td>
                <td className="px-4 py-3 font-medium text-ink">
                  {item.description}
                </td>
                <td className="px-4 py-3 text-ink/70">
                  {item.department ?? "—"}
                </td>
                <td className="px-4 py-3 text-ink/70">
                  {item.supplier ?? "—"}
                </td>
                <td className="px-4 py-3 text-ink/70">{item.model ?? "—"}</td>
                <td className="px-4 py-3 text-ink/70">
                  {item.certification_status ?? "—"}
                </td>
                <td className="px-4 py-3 text-ink/70">
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
                <td colSpan={7} className="px-4 py-6 text-center text-ink/40">
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
