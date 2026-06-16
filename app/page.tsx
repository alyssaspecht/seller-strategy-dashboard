import Link from "next/link";

export default function Home() {
  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden px-6">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-[var(--accent)]/20 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-purple-500/20 blur-[100px]" />

      <div className="glass-strong relative w-full max-w-xl px-10 py-14 text-center shadow-2xl">
        <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--accent)] to-purple-500 text-lg font-semibold">
          S
        </div>
        <h1 className="text-4xl font-semibold tracking-tight">Seller Strategy Dashboard</h1>
        <p className="mx-auto mt-3 max-w-sm text-[var(--muted)]">
          Show sellers the plan — what&apos;s happening, why, and what&apos;s next.
        </p>
        <div className="mt-10 flex justify-center gap-3">
          <Link href="/login" className="btn-primary px-6">Agent Login</Link>
          <Link href="/signup" className="btn-secondary px-6">Create Account</Link>
        </div>
      </div>
    </div>
  );
}
