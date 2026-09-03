"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const SECTIONS = [
  { value: "", label: "Algemeen (niet gekoppeld)" },
  { value: "risks", label: "Risico's" },
  { value: "tasks", label: "Taken" },
  { value: "scope", label: "Scope" },
  { value: "tracker", label: "Registraties" },
  { value: "suppliers", label: "Apparatuur" },
  { value: "parties", label: "Partijen" },
];

export default function UploadDocumentForm({ projectId }: { projectId: string }) {
  const supabase = createClient();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [section, setSection] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const path = `${projectId}/${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(path, file);

    if (uploadError) {
      setError("Upload mislukt: " + uploadError.message);
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("documents").insert({
      project_id: projectId,
      name: file.name,
      storage_path: path,
      section: section || null,
      size: file.size,
      uploaded_by: user?.id ?? null,
    });

    setLoading(false);
    if (insertError) {
      setError("Opslaan mislukt: " + insertError.message);
      return;
    }

    setFile(null);
    setSection("");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-ivory hover:bg-ink-soft"
      >
        + Document uploaden
      </button>
    );
  }

  return (
    <form
      onSubmit={handleUpload}
      className="space-y-3 rounded-xl border border-ivory-line bg-ivory-card p-5 shadow-sm"
    >
      <h2 className="font-display text-lg text-ink">Document uploaden</h2>

      <div>
        <label className="mb-1 block text-xs font-medium text-ink/60">
          Bestand
        </label>
        <input
          required
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="w-full rounded-lg border border-ivory-line bg-ivory-card px-3 py-2 text-sm text-ink file:mr-3 file:rounded-md file:border-0 file:bg-ivory file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-ink"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-ink/60">
          Koppelen aan onderdeel (optioneel)
        </label>
        <select
          value={section}
          onChange={(e) => setSection(e.target.value)}
          className="w-full rounded-lg border border-ivory-line bg-ivory-card px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
        >
          {SECTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="rounded-lg bg-brick-soft px-3 py-2 text-xs text-brick">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading || !file}
          className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-ivory hover:bg-ink-soft disabled:opacity-60"
        >
          {loading ? "Bezig met uploaden..." : "Uploaden"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg px-4 py-2 text-sm text-ink/60 hover:bg-ivory"
        >
          Annuleren
        </button>
      </div>
    </form>
  );
}
