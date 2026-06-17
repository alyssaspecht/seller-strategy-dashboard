"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    let res: Response;
    try {
      res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
    } catch {
      setError("Could not reach the server. Please try again.");
      setLoading(false);
      return;
    }

    if (!res.ok) {
      let msg = "Something went wrong. Please try again.";
      try { const d = await res.json(); msg = d.error ?? msg; } catch {}
      setError(msg);
      setLoading(false);
      return;
    }

    const signInRes = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);

    if (signInRes?.error) {
      setError("Account created but sign-in failed — please log in manually.");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden px-6">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-[var(--accent)]/20 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-purple-500/20 blur-[100px]" />

      <form onSubmit={handleSubmit} className="glass-strong relative w-full max-w-sm px-8 py-10 shadow-2xl">
        <div className="mx-auto mb-5 flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--accent)] to-purple-500 text-sm font-semibold">
          S
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-center">Create your account</h1>
        <p className="mt-1 text-sm text-[var(--muted)] text-center">Start building seller strategies.</p>

        <div className="mt-6 space-y-4">
          <div>
            <label htmlFor="name">Name</label>
            <input id="name" type="text" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label htmlFor="email">Email</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label htmlFor="password">Password</label>
            <input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary mt-6 w-full">
          {loading ? "Creating account..." : "Create account"}
        </button>

        <p className="mt-4 text-center text-sm text-[var(--muted)]">
          Already have an account? <Link href="/login" className="text-[var(--accent)]">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
