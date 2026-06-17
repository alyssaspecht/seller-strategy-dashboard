"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    let res;
    try {
      res = await signIn("credentials", { email, password, redirect: false });
    } catch {
      setError("Could not reach the server. Please try again.");
      setLoading(false);
      return;
    }

    setLoading(false);

    if (res?.error) {
      setError("Invalid email or password. If this is your first time on the new site, try creating a new account.");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm fade-up">
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--accent)] to-purple-500 text-base font-bold shadow-2xl shadow-[var(--accent)]/30 mb-4">
            S
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">Sign in to your agent dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-strong px-8 py-8 shadow-2xl">
          <div className="space-y-4">
            <div>
              <label htmlFor="email">Email</label>
              <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div>
              <label htmlFor="password">Password</label>
              <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary mt-6 w-full py-3">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Signing in...
              </span>
            ) : "Sign in"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-[var(--muted)]">
          No account?{" "}
          <Link href="/signup" className="text-[var(--accent)] hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  );
}
