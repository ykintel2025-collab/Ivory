"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Project = { id: string; name: string };

export default function AssignDocumentForm({
  documentId,
  storagePath,
  projects,
}: {
  documentId: string;
  storagePath: string;
  projects: Project[];
}) {
  const supabase = createClient();
  const router = useRouter();
  const [projectId, setProjectId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAssign() {
    if (!projectId) return;
    setLoading(true);
    setError(null);

    const filename = storagePath.split("/").pop();
    const newPath = `${projectId}/${filename}`;

    const { error: moveError } = await supabase.storage
      .from("documents")
      .move(storagePath, newPath);

    if (moveError) {
      setError("Verplaatsen mislukt: " + moveError.message);
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("documents")
      .update({ project_id: projectId, storage_path: newPath })
      .eq("id", documentId);

    setLoading(false);
    if (updateError) {
      setError("Bijwerken mislukt: " + updateError.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex items-center gap-1.5">
      <select
        value={projectId}
        onChange={(e) => setProjectId(e.target.value)}
        className="rounded-md border border-ivory-line bg-ivory-card px-2 py-1 text-xs text-ink focus:border-ink focus:outline-none"
      >
        <option value="">Toewijzen aan...</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <button
        onClick={handleAssign}
        disabled={!projectId || loading}
        className="rounded-md bg-ink px-2 py-1 text-xs font-medium text-ivory hover:bg-ink-soft disabled:opacity-40"
      >
        {loading ? "..." : "OK"}
      </button>
      {error && <span className="text-xs text-brick">{error}</span>}
    </div>
  );
}
