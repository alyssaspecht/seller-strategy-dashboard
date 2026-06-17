import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id as string;

  const properties = await prisma.property.findMany({
    where: { agentId: userId },
    include: { roadmapStages: { orderBy: { order: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  const totalListings = properties.length;
  const activeListings = properties.filter((p) =>
    p.roadmapStages.some((s) => s.status === "ACTIVE")
  ).length;
  const completedListings = properties.filter((p) =>
    p.roadmapStages.length > 0 && p.roadmapStages.every((s) => s.status === "COMPLETED")
  ).length;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="fade-up flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-[var(--muted)]">{greeting()}, {session?.user?.name?.split(" ")[0] ?? "Agent"}</p>
          <h1 className="text-2xl font-semibold tracking-tight mt-0.5">Your Listings</h1>
        </div>
        <Link href="/properties/new" className="btn-primary self-start whitespace-nowrap sm:self-auto gap-1.5">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" d="M12 5v14M5 12h14" />
          </svg>
          New Strategy
        </Link>
      </div>

      {/* Stat cards */}
      <div className="mt-6 grid grid-cols-3 gap-4 fade-up fade-up-delay-1">
        <div className="glass stat-card px-5 py-4">
          <p className="text-xs text-[var(--muted)] uppercase tracking-wide">Total Listings</p>
          <p className="mt-2 text-3xl font-semibold">{totalListings}</p>
          <p className="mt-1 text-xs text-[var(--muted)]">all time</p>
        </div>
        <div className="glass stat-card px-5 py-4">
          <p className="text-xs text-[var(--muted)] uppercase tracking-wide">Active</p>
          <p className="mt-2 text-3xl font-semibold text-[var(--accent)]">{activeListings}</p>
          <p className="mt-1 text-xs text-[var(--muted)]">in progress</p>
        </div>
        <div className="glass stat-card px-5 py-4">
          <p className="text-xs text-[var(--muted)] uppercase tracking-wide">Completed</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-400">{completedListings}</p>
          <p className="mt-1 text-xs text-[var(--muted)]">sold</p>
        </div>
      </div>

      {/* Listings */}
      {properties.length === 0 ? (
        <div className="glass mt-8 flex flex-col items-center justify-center px-8 py-20 text-center fade-up fade-up-delay-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)] mb-4">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <p className="text-lg font-medium">No listings yet</p>
          <p className="mt-1 text-sm text-[var(--muted)]">Create your first seller strategy to get started.</p>
          <Link href="/properties/new" className="btn-primary mt-6">+ New Strategy</Link>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 fade-up fade-up-delay-2">
          {properties.map((property) => {
            const stages = property.roadmapStages;
            const completed = stages.filter((s) => s.status === "COMPLETED").length;
            const active = stages.find((s) => s.status === "ACTIVE");
            const progress = stages.length > 0 ? Math.round((completed / stages.length) * 100) : 0;

            return (
              <Link
                key={property.id}
                href={`/properties/${property.id}`}
                className="glass group block px-6 py-5 transition-all duration-200 hover:bg-white/[0.07] hover:border-white/15 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{property.address}</p>
                    {property.price && (
                      <p className="mt-0.5 text-sm text-[var(--muted)]">${property.price.toLocaleString()}</p>
                    )}
                  </div>
                  <span className={`badge shrink-0 ${active ? "badge-active" : completed === stages.length && stages.length > 0 ? "badge-completed" : "badge-upcoming"}`}>
                    {active ? "Active" : completed === stages.length && stages.length > 0 ? "Sold" : "Draft"}
                  </span>
                </div>

                {stages.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-xs text-[var(--muted)]">{active ? `Stage: ${active.name}` : `${completed}/${stages.length} stages`}</p>
                      <p className="text-xs text-[var(--muted)]">{progress}%</p>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between">
                  <p className="text-xs text-[var(--muted)]">
                    {new Date(property.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                  <span className="text-xs text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity">
                    View strategy →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
