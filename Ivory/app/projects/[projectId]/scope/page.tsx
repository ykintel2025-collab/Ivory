import { createClient } from "@/lib/supabase/server";
import AddScopeItemForm from "@/components/AddScopeItemForm";
import DeleteButton from "@/components/DeleteButton";
import EditModal from "@/components/EditModal";

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
        <h1 className="font-display text-2xl text-ink">Scope-log</h1>
        <p className="text-sm text-ink/50">
          Vastgelegde scope-beslissingen met bron en datum
        </p>
      </div>

      <AddScopeItemForm projectId={params.projectId} />

      <div className="overflow-x-auto rounded-xl border border-ivory-line bg-ivory-card shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-ivory-line bg-ivory text-xs uppercase tracking-wide text-ink/50">
            <tr>
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Toelichting</th>
              <th className="px-4 py-3">Bron</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {(items ?? []).map((item) => (
              <tr key={item.id} className="border-b border-ivory-line align-top">
                <td className="px-4 py-3 font-medium text-ink">
                  {item.item_name}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      item.in_scope
                        ? "bg-teal-soft text-teal"
                        : "bg-ink/5 text-ink/50"
                    }`}
                  >
                    {item.in_scope ? "In scope" : "Buiten scope"}
                  </span>
                </td>
                <td className="px-4 py-3 text-ink/70">{item.explanation}</td>
                <td className="px-4 py-3 text-xs text-ink/40">
                  {item.source_reference}
                  {item.source_date && (
                    <>
                      <br />
                      {new Date(item.source_date).toLocaleDateString("nl-NL")}
                    </>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <EditModal
                      table="scope_items"
                      id={item.id}
                      title="Scope-item bewerken"
                      initialValues={{
                        item_name: item.item_name,
                        in_scope: String(item.in_scope),
                        explanation: item.explanation,
                        source_reference: item.source_reference,
                        source_date: item.source_date,
                      }}
                      fields={[
                        { key: "item_name", label: "Item", type: "text" },
                        {
                          key: "in_scope",
                          label: "Status",
                          type: "boolean",
                          options: [
                            { value: "true", label: "In scope" },
                            { value: "false", label: "Buiten scope" },
                          ],
                        },
                        { key: "explanation", label: "Toelichting", type: "textarea" },
                        { key: "source_reference", label: "Bron", type: "text" },
                        { key: "source_date", label: "Brondatum", type: "date" },
                      ]}
                    />
                    <DeleteButton table="scope_items" id={item.id} />
                  </div>
                </td>
              </tr>
            ))}
            {(items ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-ink/40">
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
