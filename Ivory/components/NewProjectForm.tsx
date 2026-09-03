"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function NewProjectForm() {
  const supabase = createClient();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [client, setClient] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Niet ingelogd.");
      setLoading(false);
      return;
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const { data: project, error: insertError } = await supabase
      .rpc("create_project", {
        p_name: name,
        p_client: client,
        p_location: location,
        p_slug: `${slug}-${Date.now().toString(36)}`,
      })
      .select()
      .single();

    if (insertError || !project) {
      setError("Aanmaken mislukt: " + insertError?.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    router.push(`/projects/${(project as any).id}/dashboard`);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-ivory hover:bg-ink-soft"
      >
        + Nieuw project
      </button>
    );
  }

  return (
    <form
      onSubmit={handleCreate}
      className="w-full max-w-md space-y-3 rounded-xl border border-ivory-line bg-ivory-card p-6 shadow-sm"
    >
      <h2 className="font-display text-lg text-ink">Nieuw project</h2>
      <div>
        <label className="mb-1 block text-xs font-medium text-ink/70">
          Projectnaam
        </label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-ivory-line bg-ivory-card px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
          placeholder="bijv. Shajar Hospital"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-ink/70">
          Opdrachtgever
        </label>
        <input
          value={client}
          onChange={(e) => setClient(e.target.value)}
          className="w-full rounded-lg border border-ivory-line bg-ivory-card px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
          placeholder="bijv. QHC Architects & Engineers"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-ink/70">
          Locatie
        </label>
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full rounded-lg border border-ivory-line bg-ivory-card px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
          placeholder="bijv. Dibba Al Husn, VAE"
        />
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-ivory hover:bg-ink-soft disabled:opacity-60"
        >
          {loading ? "Bezig..." : "Aanmaken"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg px-4 py-2 text-sm text-ink/50 hover:bg-ivory"
        >
          Annuleren
        </button>
      </div>
    </form>
  );
}
