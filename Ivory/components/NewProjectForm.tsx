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
      .from("projects")
      .insert({ name, client, location, slug: `${slug}-${Date.now().toString(36)}` })
      .select()
      .single();

    if (insertError || !project) {
      setError("Aanmaken mislukt: " + insertError?.message);
      setLoading(false);
      return;
    }

    // Zeker stellen dat de aanmaker lid is (trigger doet dit ook, dit is een fallback)
    await supabase.from("project_members").upsert({
      project_id: project.id,
      user_id: user.id,
      role: "eigenaar",
      visible: true,
    });

    setLoading(false);
    router.push(`/projects/${project.id}/dashboard`);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
      >
        + Nieuw project
      </button>
    );
  }

  return (
    <form
      onSubmit={handleCreate}
      className="w-full max-w-md space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <h2 className="text-sm font-semibold text-slate-900">Nieuw project</h2>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Projectnaam
        </label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          placeholder="bijv. Shajar Hospital"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Opdrachtgever
        </label>
        <input
          value={client}
          onChange={(e) => setClient(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          placeholder="bijv. QHC Architects & Engineers"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Locatie
        </label>
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
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
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {loading ? "Bezig..." : "Aanmaken"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg px-4 py-2 text-sm text-slate-500 hover:bg-slate-100"
        >
          Annuleren
        </button>
      </div>
    </form>
  );
}
