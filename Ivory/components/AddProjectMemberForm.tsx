"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Profile = { id: string; full_name: string };

export default function AddProjectMemberForm({
  projectId,
  availableProfiles,
}: {
  projectId: string;
  availableProfiles: Profile[];
}) {
  const supabase = createClient();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: insertError } = await supabase.from("project_members").insert({
      project_id: projectId,
      user_id: userId,
      role: role || "lid",
      visible: true,
    });

    setLoading(false);
    if (insertError) {
      setError("Toevoegen mislukt: " + insertError.message);
      return;
    }

    setUserId("");
    setRole("");
    setOpen(false);
    router.refresh();
  }

  if (availableProfiles.length === 0) {
    return (
      <p className="text-xs text-ink/40">
        Iedereen met een account staat al in dit project. Nieuwe collega's
        maak je eerst aan via Supabase → Authentication → Users, daarna
        verschijnen ze hier.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-ivory-line bg-ivory-card px-4 py-2 text-sm font-medium text-ink hover:border-gold"
      >
        + Teamlid toevoegen
      </button>
    );
  }

  return (
    <form
      onSubmit={handleAdd}
      className="space-y-3 rounded-xl border border-ivory-line bg-ivory-card p-5 shadow-sm"
    >
      <h2 className="font-display text-lg text-ink">Teamlid toevoegen</h2>

      <div>
        <label className="mb-1 block text-xs font-medium text-ink/60">
          Persoon
        </label>
        <select
          required
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="w-full rounded-lg border border-ivory-line bg-ivory-card px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
        >
          <option value="">Kies iemand...</option>
          {availableProfiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.full_name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-ink/60">
          Rol in dit project
        </label>
        <input
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="bv. Projectleider, CFO, Regulatory Lead"
          className="w-full rounded-lg border border-ivory-line bg-ivory-card px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
        />
      </div>

      {error && (
        <p className="rounded-lg bg-brick-soft px-3 py-2 text-xs text-brick">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-ivory hover:bg-ink-soft disabled:opacity-60"
        >
          {loading ? "Bezig..." : "Toevoegen"}
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
