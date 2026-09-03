import { createClient } from "@/lib/supabase/server";
import GlobalShell from "@/components/GlobalShell";
import DocumentRow from "@/components/DocumentRow";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function GlobalDocumentsPage() {
  const supabase = createClient();

  const { data: documents } = await supabase
    .from("documents")
    .select("*, projects(id, name), profiles(full_name)")
    .order("created_at", { ascending: false });

  const docsWithUrls = await Promise.all(
    (documents ?? []).map(async (d: any) => {
      const { data: signed } = await supabase.storage
        .from("documents")
        .createSignedUrl(d.storage_path, 3600);
      return { ...d, url: signed?.signedUrl ?? null };
    })
  );

  // Groepeer per project
  const byProject = new Map<string, { name: string; docs: typeof docsWithUrls }>();
  for (const doc of docsWithUrls) {
    const key = doc.project_id;
    if (!byProject.has(key)) {
      byProject.set(key, { name: doc.projects?.name ?? "Onbekend project", docs: [] });
    }
    byProject.get(key)!.docs.push(doc);
  }

  return (
    <GlobalShell>
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-3xl text-ink">Documenten</h1>
          <p className="text-sm text-ink/50">
            Alle documenten, over al je projecten heen
          </p>
        </div>

        {byProject.size === 0 && (
          <p className="text-sm text-ink/40">
            Nog geen documenten geüpload. Ga naar een project → Documenten om
            te beginnen.
          </p>
        )}

        {Array.from(byProject.entries()).map(([projectId, group]) => (
          <div
            key={projectId}
            className="rounded-xl border border-ivory-line bg-ivory-card p-6 shadow-sm"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg text-ink">{group.name}</h2>
              <Link
                href={`/projects/${projectId}/documents`}
                className="text-xs font-medium text-ink/50 hover:underline"
              >
                Naar project →
              </Link>
            </div>
            <div className="space-y-2">
              {group.docs.map((doc: any) => (
                <DocumentRow key={doc.id} doc={doc} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </GlobalShell>
  );
}
