"use client";

import { createClient } from "@/lib/supabase/client";
import DeleteButton from "@/components/DeleteButton";

function formatSize(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentRow({ doc }: { doc: any }) {
  const supabase = createClient();

  return (
    <div className="flex items-center justify-between rounded-lg border border-ivory-line px-3 py-2.5">
      <div className="min-w-0">
        {doc.url ? (
          <a
            href={doc.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block truncate text-sm font-medium text-ink hover:underline"
          >
            {doc.name}
          </a>
        ) : (
          <p className="truncate text-sm font-medium text-ink">{doc.name}</p>
        )}
        <p className="text-xs text-ink/40">
          {doc.profiles?.full_name ?? "Onbekend"} ·{" "}
          {new Date(doc.created_at).toLocaleDateString("nl-NL")}
          {doc.size ? ` · ${formatSize(doc.size)}` : ""}
        </p>
      </div>
      <DeleteButton
        table="documents"
        id={doc.id}
        confirmText={`${doc.name} verwijderen? Dit kan niet ongedaan worden gemaakt.`}
        beforeDelete={async () => {
          await supabase.storage.from("documents").remove([doc.storage_path]);
        }}
      />
    </div>
  );
}
