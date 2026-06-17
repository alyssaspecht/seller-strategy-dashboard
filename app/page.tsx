import Link from "next/link";

export default function Home() {
  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden px-6 min-h-screen">
      <div className="relative text-center max-w-2xl mx-auto fade-up">
        {/* Logo mark */}
        <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--accent)] to-purple-500 text-xl font-bold shadow-2xl shadow-[var(--accent)]/30">
          S
        </div>

        <h1 className="text-5xl font-semibold tracking-tight leading-tight">
          Your listing.<br />
          <span className="bg-gradient-to-r from-[var(--accent)] via-purple-400 to-[var(--accent)] bg-clip-text text-transparent bg-[length:200%_auto] animate-[shimmer-slide_4s_linear_infinite]">
            Fully transparent.
          </span>
        </h1>

        <p className="mx-auto mt-5 max-w-md text-lg text-[var(--muted)] leading-relaxed">
          Give sellers a real-time window into your strategy — what&apos;s happening, why it&apos;s working, and what&apos;s next.
        </p>

        <div className="mt-10 flex justify-center gap-4">
          <Link href="/login" className="btn-primary px-8 py-3 text-base">
            Agent Login
          </Link>
          <Link href="/signup" className="btn-secondary px-8 py-3 text-base">
            Create Account
          </Link>
        </div>

        {/* Feature pills */}
        <div className="mt-12 flex flex-wrap justify-center gap-3">
          {["AI-Generated Strategy", "Live Roadmap", "Seller Portal", "Marketing Plan"].map((f) => (
            <span key={f} className="glass px-4 py-1.5 text-xs text-[var(--muted)] rounded-full">
              {f}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
