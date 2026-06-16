import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { MarketingItemType } from "@prisma/client";

const MARKETING_TYPE_LABEL: Record<MarketingItemType, string> = {
  MLS: "MLS Listing",
  SOCIAL: "Social Media",
  VIDEO: "Video",
  OPEN_HOUSE: "Open House",
  REVERSE_PROSPECTING: "Reverse Prospecting",
  OUTREACH: "Agent Outreach",
  OTHER: "Marketing",
};

export default async function SellerViewPage({ params }: { params: Promise<{ shareToken: string }> }) {
  const { shareToken } = await params;

  const property = await prisma.property.findUnique({
    where: { shareToken },
    include: {
      roadmapStages: { orderBy: { order: "asc" } },
      marketingItems: { orderBy: { createdAt: "asc" } },
      visibility: true,
      agent: { select: { name: true } },
    },
  });

  if (!property) notFound();

  const visibility = property.visibility;
  const showRoadmap = visibility?.showRoadmap ?? true;
  const showMarketingPlan = visibility?.showMarketingPlan ?? true;
  const showReasoning = visibility?.showReasoning ?? true;

  const visibleItems = property.marketingItems.filter((i) => i.visibleToSeller);

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl overflow-x-hidden px-4 py-12 sm:px-6">
      <div className="text-center">
        <p className="text-sm text-[var(--muted)]">Your Listing Strategy</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{property.address}</h1>
        {property.price && <p className="mt-1 text-[var(--muted)]">${property.price.toLocaleString()}</p>}
        {property.agent?.name && (
          <p className="mt-2 text-xs text-[var(--muted)]">Prepared by {property.agent.name}</p>
        )}
      </div>

      {showRoadmap && property.roadmapStages.length > 0 && (
        <section className="mt-10 glass px-4 py-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[var(--muted)]">Listing Progress</p>
          <div className="flex items-center overflow-x-auto pb-1">
            {property.roadmapStages.map((stage, i) => (
              <div key={stage.id} className="flex items-center">
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${
                      stage.status === "COMPLETED"
                        ? "bg-emerald-500 text-white"
                        : stage.status === "ACTIVE"
                        ? "bg-[var(--accent)] text-white ring-4 ring-[var(--accent)]/20"
                        : "bg-white/10 text-[var(--muted)]"
                    }`}
                  >
                    {stage.status === "COMPLETED" ? "✓" : ""}
                  </div>
                  <span
                    className={`whitespace-nowrap text-[11px] ${
                      stage.status === "UPCOMING" ? "text-[var(--muted)]" : "text-white"
                    }`}
                  >
                    {stage.name}
                  </span>
                </div>
                {i < property.roadmapStages.length - 1 && (
                  <div className={`mx-1 h-0.5 w-8 shrink-0 ${stage.status === "COMPLETED" ? "bg-emerald-500" : "bg-white/10"}`} />
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {showMarketingPlan && visibleItems.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold tracking-tight">Marketing Plan</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">What we&apos;re doing to get your home in front of buyers.</p>
          <div className="mt-4 space-y-3">
            {visibleItems.map((item) => (
              <div key={item.id} className="glass px-5 py-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--accent)]">{MARKETING_TYPE_LABEL[item.type]}</p>
                  <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-[var(--muted)]">{item.status}</span>
                </div>
                <p className="mt-2 font-medium">{item.objective}</p>
                {showReasoning && item.reasoning && (
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    <span className="text-white/70">Why: </span>{item.reasoning}
                  </p>
                )}
                {item.results && (
                  <p className="mt-2 text-sm text-emerald-400">{item.results}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {!(showRoadmap && property.roadmapStages.length > 0) && !(showMarketingPlan && visibleItems.length > 0) && (
        <div className="glass mt-10 px-6 py-10 text-center text-[var(--muted)]">
          Your agent hasn&apos;t shared strategy details yet. Check back soon.
        </div>
      )}
    </div>
  );
}
