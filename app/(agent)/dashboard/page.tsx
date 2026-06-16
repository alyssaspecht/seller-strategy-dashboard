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

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Your Listings</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">Strategy dashboards for each active listing.</p>
        </div>
        <Link href="/properties/new" className="btn-primary self-start whitespace-nowrap sm:self-auto">+ New Strategy</Link>
      </div>

      {properties.length === 0 ? (
        <div className="glass mt-8 flex flex-col items-center justify-center px-8 py-16 text-center">
          <p className="text-lg font-medium">No listings yet</p>
          <p className="mt-1 text-sm text-[var(--muted)]">Create your first seller strategy to get started.</p>
          <Link href="/properties/new" className="btn-primary mt-6">+ New Strategy</Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {properties.map((property) => {
            const active = property.roadmapStages.find((s) => s.status === "ACTIVE");
            return (
              <Link
                key={property.id}
                href={`/properties/${property.id}`}
                className="glass block px-6 py-5 transition hover:bg-white/[0.06]"
              >
                <p className="text-lg font-medium">{property.address}</p>
                {property.price && (
                  <p className="mt-1 text-sm text-[var(--muted)]">${property.price.toLocaleString()}</p>
                )}
                <div className="mt-4 flex items-center gap-2 text-xs">
                  <span className="rounded-full bg-[var(--accent)]/15 px-2.5 py-1 text-[var(--accent)]">
                    {active ? `Stage: ${active.name}` : "No active stage"}
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
