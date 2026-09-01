import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ScopePage({
  params,
}: {
  params: { projectId: string };
}) {
  const supabase = createClient();
  const { data: items } = await supabase
    .from("scope_items")
    .select("*")
    .eq("project_id", params.projectId)
    .order("in_scope", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Scope-log</h1>
        <p className="text-sm text-slate-500">
          Vastgelegde scope-beslissingen met bron en datum
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Toelichting</th>
              <th className="px-4 py-3">Bron</th>
            </tr>
          </thead>
          <tbody>
            {(items ?? []).map((item) => (
              <tr key={item.id} className="border-b border-slate-50 align-top">
                <td className="px-4 py-3 font-medium text-slate-800">
                  {item.item_name}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      item.in_scope
                        ? "bg-green-100 text-green-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {item.in_scope ? "In scope" : "Buiten scope"}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">{item.explanation}</td>
                <td className="px-4 py-3 text-xs text-slate-400">
                  {item.source_reference}
                  {item.source_date && (
                    <>
                      <br />
                      {new Date(item.source_date).toLocaleDateString("nl-NL")}
                    </>
                  )}
                </td>
              </tr>
            ))}
            {(items ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                  Nog geen scope-items toegevoegd.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
