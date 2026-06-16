import Link from "next/link";

export default function NotFound() {
  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden px-6">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-[var(--accent)]/20 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-purple-500/20 blur-[100px]" />

      <div className="glass-strong relative w-full max-w-sm px-8 py-10 text-center shadow-2xl">
        <div className="mx-auto mb-5 flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--accent)] to-purple-500 text-sm font-semibold">
          S
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          This link may be broken or the listing is no longer available.
        </p>
        <Link href="/" className="btn-primary mt-6 inline-block">Go home</Link>
      </div>
    </div>
  );
}
