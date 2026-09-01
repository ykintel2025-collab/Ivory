"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

function navItems(projectId: string) {
  return [
    { href: `/projects/${projectId}/dashboard`, label: "Dashboard", icon: "📊" },
    { href: `/projects/${projectId}/risks`, label: "Risico's", icon: "⚠️" },
    { href: `/projects/${projectId}/tasks`, label: "Taken", icon: "✅" },
    { href: `/projects/${projectId}/scope`, label: "Scope", icon: "📋" },
    { href: `/projects/${projectId}/tracker`, label: "Registraties", icon: "🩺" },
    { href: `/projects/${projectId}/suppliers`, label: "Apparatuur", icon: "🏥" },
    { href: `/projects/${projectId}/parties`, label: "Partijen", icon: "🤝" },
  ];
}

export default function AppShell({
  children,
  projectId,
  projectName,
}: {
  children: React.ReactNode;
  projectId: string;
  projectName?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [mobileOpen, setMobileOpen] = useState(false);
  const items = navItems(projectId);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white px-4 py-6 md:flex md:flex-col">
        <div className="mb-6 px-2">
          <Link
            href="/projects"
            className="text-xs font-medium text-slate-400 hover:text-slate-600"
          >
            ← Alle projecten
          </Link>
          <p className="mt-2 truncate text-sm font-semibold text-slate-900">
            {projectName ?? "Project"}
          </p>
        </div>
        <nav className="flex-1 space-y-1">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                pathname?.startsWith(item.href)
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <button
          onClick={handleLogout}
          className="mt-4 rounded-lg px-3 py-2 text-left text-sm text-slate-500 hover:bg-slate-100"
        >
          Uitloggen
        </button>
      </aside>

      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {projectName ?? "Project"}
          </p>
          <Link href="/projects" className="text-xs text-slate-400">
            ← Alle projecten
          </Link>
        </div>
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
        >
          Menu
        </button>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 top-14 z-10 bg-white p-4 md:hidden">
          <nav className="space-y-1">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-medium ${
                  pathname?.startsWith(item.href)
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="mt-2 w-full rounded-lg px-3 py-3 text-left text-sm text-slate-500 hover:bg-slate-100"
            >
              Uitloggen
            </button>
          </nav>
        </div>
      )}

      <main className="flex-1 px-4 py-6 pt-24 md:px-8 md:py-8 md:pt-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
