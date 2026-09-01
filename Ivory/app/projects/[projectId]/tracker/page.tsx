import { createClient } from "@/lib/supabase/server";
import Badge from "@/components/Badge";
import AddRegistrationForm from "@/components/AddRegistrationForm";
import DeleteButton from "@/components/DeleteButton";
import EditModal from "@/components/EditModal";

export const dynamic = "force-dynamic";

export default async function TrackerPage({
  params,
}: {
  params: { projectId: string };
}) {
  const supabase = createClient();
  const projectId = params.projectId;

  const [{ data: registrations }, { data: members }] = await Promise.all([
    supabase
      .from("registrations")
      .select("*, profiles(full_name)")
      .eq("project_id", projectId)
      .order("expected_completion", { ascending: true, nullsFirst: false }),
    supabase
      .from("project_members")
      .select("user_id, profiles(full_name)")
      .eq("project_id", projectId),
  ]);

  const memberList = (members ?? []).map((m: any) => ({
    user_id: m.user_id,
    full_name: m.profiles?.full_name ?? "Onbekend",
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-ink">
          Registratietracker
        </h1>
        <p className="text-sm text-ink/50">
          Registratiestatus per apparaat (bv. MDMA/MOHAP) — Klasse II/III kan
          tot 12 maanden duren
        </p>
      </div>

      <AddRegistrationForm projectId={projectId} members={memberList} />

      <div className="overflow-x-auto rounded-xl border border-ivory-line bg-ivory-card shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-ivory-line bg-ivory text-xs uppercase tracking-wide text-ink/50">
            <tr>
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Klasse</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Verwacht klaar</th>
              <th className="px-4 py-3">Eigenaar</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {(registrations ?? []).map((r: any) => (
              <tr key={r.id} className="border-b border-ivory-line">
                <td className="px-4 py-3 font-medium text-ink">
                  {r.item_name}
                </td>
                <td className="px-4 py-3 text-ink/70">
                  {r.device_class ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <Badge value={r.registration_status} />
                </td>
                <td className="px-4 py-3 text-ink/50">
                  {r.expected_completion
                    ? new Date(r.expected_completion).toLocaleDateString("nl-NL")
                    : "—"}
                </td>
                <td className="px-4 py-3 text-ink/50">
                  {r.profiles?.full_name ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <EditModal
                      table="registrations"
                      id={r.id}
                      title="Registratie bewerken"
                      initialValues={{
                        item_name: r.item_name,
                        device_class: r.device_class,
                        registration_status: r.registration_status,
                        expected_completion: r.expected_completion,
                        owner_id: r.owner_id,
                        notes: r.notes,
                      }}
                      fields={[
                        { key: "item_name", label: "Item / apparaat", type: "text" },
                        { key: "device_class", label: "Klasse", type: "text" },
                        {
                          key: "registration_status",
                          label: "Status",
                          type: "select",
                          options: [
                            { value: "niet_gestart", label: "Niet gestart" },
                            { value: "in_aanvraag", label: "In aanvraag" },
                            { value: "ingediend", label: "Ingediend" },
                            { value: "goedgekeurd", label: "Goedgekeurd" },
                            { value: "afgewezen", label: "Afgewezen" },
                          ],
                        },
                        { key: "expected_completion", label: "Verwacht klaar", type: "date" },
                        {
                          key: "owner_id",
                          label: "Eigenaar",
                          type: "select",
                          options: [
                            { value: "", label: "Niemand" },
                            ...memberList.map((m) => ({
                              value: m.user_id,
                              label: m.full_name,
                            })),
                          ],
                        },
                        { key: "notes", label: "Notities", type: "textarea" },
                      ]}
                    />
                    <DeleteButton table="registrations" id={r.id} />
                  </div>
                </td>
              </tr>
            ))}
            {(registrations ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-ink/40">
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
