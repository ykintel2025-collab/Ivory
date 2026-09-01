"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DeleteButton({
  table,
  id,
  confirmText = "Weet je zeker dat je dit wilt verwijderen?",
}: {
  table: string;
  id: string;
  confirmText?: string;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    if (!window.confirm(confirmText)) return;
    setBusy(true);
    await supabase.from(table).delete().eq("id", id);
    setBusy(false);
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      disabled={busy}
      title="Verwijderen"
      className="shrink-0 rounded-md p-1.5 text-ink/30 transition hover:bg-brick-soft hover:text-brick disabled:opacity-50"
    >
      ✕
    </button>
  );
}
