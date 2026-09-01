"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError("Inloggen mislukt. Controleer je e-mail en wachtwoord.");
      return;
    }

    router.push("/projects");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen">
      {/* Ink brand panel */}
      <div className="hidden w-1/2 flex-col justify-between bg-ink px-12 py-12 md:flex">
        <Image
          src="/logo-full.png"
          alt="Ivory Global Care"
          width={220}
          height={76}
          className="h-auto w-48"
          priority
        />
        <div>
          <p className="font-display text-4xl leading-tight text-ivory">
            Alle projecten,
            <br />
            <span className="italic text-gold">één overzicht.</span>
          </p>
          <p className="mt-4 max-w-sm text-sm text-ivory/50">
            Risico's, taken, scope en partijen — voor elk project op één
            plek, altijd actueel.
          </p>
        </div>
        <p className="text-xs text-ivory/30">Ivory Global Care BV</p>
      </div>

      {/* Login form */}
      <div className="flex w-full items-center justify-center bg-ivory px-6 md:w-1/2">
        <div className="w-full max-w-sm">
          <h1 className="mb-1 font-display text-2xl text-ink">Welkom terug</h1>
          <p className="mb-8 text-sm text-ink/50">Log in om verder te gaan</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink/70">
                E-mail
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-ivory-line bg-ivory-card px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                placeholder="naam@ivory-project.local"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink/70">
                Wachtwoord
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-ivory-line bg-ivory-card px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-brick-soft px-3 py-2 text-sm text-brick">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-ink px-3 py-2.5 text-sm font-medium text-ivory transition hover:bg-ink-soft disabled:opacity-60"
            >
              {loading ? "Bezig..." : "Inloggen"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
