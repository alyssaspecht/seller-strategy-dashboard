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

const MARKETING_TYPE_ICON: Record<MarketingItemType, string> = {
  MLS: "🏠",
  SOCIAL: "📱",
  VIDEO: "🎥",
  OPEN_HOUSE: "🚪",
  REVERSE_PROSPECTING: "🔍",
  OUTREACH: "📣",
  OTHER: "📋",
};

const STATUS_COLOR: Record<string, string> = {
  "Scheduled": "badge-upcoming",
  "In Progress": "badge-active",
  "Live": "badge-active",
  "Completed": "badge-completed",
  "Done": "badge-completed",
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
  const stages = property.roadmapStages;
  const completedCount = stages.filter((s) => s.status === "COMPLETED").length;
  const activeStage = stages.find((s) => s.status === "ACTIVE");
  const progress = stages.length > 0 ? Math.round((completedCount / stages.length) * 100) : 0;

  return (
    <div className="min-h-screen">
      {/* Hero header */}
      <div className="border-b border-[var(--border)] bg-black/20 backdrop-blur-xl px-6 py-5">
        <div className="mx-auto max-w-4xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--accent)] to-purple-500 text-sm font-bold shadow-lg shadow-[var(--accent)]/20">
              S
            </div>
            <div>
              <p className="text-xs text-[var(--muted)]">Seller Strategy</p>
              {property.agent?.name && (
                <p className="text-xs font-medium">{property.agent.name}</p>
              )}
            </div>
          </div>
          <span className="badge badge-active">Live Strategy</span>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        {/* Property hero */}
        <div className="fade-up text-center mb-10">
          <p className="text-sm text-[var(--muted)] uppercase tracking-widest mb-2">Your Listing</p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">{property.address}</h1>
          {property.price && (
            <p className="mt-2 text-2xl font-light text-[var(--muted)]">${property.price.toLocaleString()}</p>
          )}
          {property.sellerName && (
            <p className="mt-3 text-sm text-[var(--muted)]">Prepared for <span className="text-white">{property.sellerName}</span></p>
          )}
        </div>

        {/* Progress summary card */}
        {showRoadmap && stages.length > 0 && (
          <div className="glass-strong px-6 py-6 mb-6 fade-up fade-up-delay-1">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
              <div>
                <p className="text-xs uppercase tracking-widest text-[var(--muted)] mb-1">Listing Progress</p>
                <p className="text-lg font-semibold">
                  {activeStage ? `Currently: ${activeStage.name}` : completedCount === stages.length ? "Strategy Complete" : "Getting Started"}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-3xl font-semibold text-[var(--accent)]">{progress}%</p>
                <p className="text-xs text-[var(--muted)]">{completedCount} of {stages.length} stages</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="progress-track mb-6">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>

            {/* Stage track */}
            <div className="flex items-start gap-0 overflow-x-auto pb-2">
              {stages.map((stage, i) => (
                <div key={stage.id} className="flex items-center min-w-0">
                  <div className="flex flex-col items-center gap-2 min-w-[72px]">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium transition-all ${
                        stage.status === "COMPLETED"
                          ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                          : stage.status === "ACTIVE"
                          ? "bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/30 ring-4 ring-[var(--accent)]/20 scale-110"
                          : "bg-white/8 text-[var(--muted)] border border-[var(--border)]"
                      }`}
                    >
                      {stage.status === "COMPLETED" ? "✓" : i + 1}
                    </div>
                    <span className={`text-center text-[10px] leading-tight max-w-[64px] ${
                      stage.status === "UPCOMING" ? "text-[var(--muted)]" : "text-white"
                    }`}>
                      {stage.name}
                    </span>
                  </div>
                  {i < stages.length - 1 && (
                    <div className={`h-0.5 w-6 shrink-0 mb-6 ${stage.status === "COMPLETED" ? "bg-emerald-500" : "bg-white/10"}`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Marketing plan */}
        {showMarketingPlan && visibleItems.length > 0 && (
          <div className="fade-up fade-up-delay-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">Marketing Plan</h2>
                <p className="text-sm text-[var(--muted)]">How we&apos;re getting your home in front of buyers</p>
              </div>
              <span className="text-xs text-[var(--muted)]">{visibleItems.length} activities</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {visibleItems.map((item) => (
                <div key={item.id} className="glass px-5 py-5 transition-all hover:bg-white/[0.07]">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{MARKETING_TYPE_ICON[item.type]}</span>
                      <p className="text-xs font-medium uppercase tracking-wide text-[var(--accent)]">
                        {MARKETING_TYPE_LABEL[item.type]}
                      </p>
                    </div>
                    <span className={`badge shrink-0 ${STATUS_COLOR[item.status] ?? "badge-upcoming"}`}>
                      {item.status}
                    </span>
                  </div>

                  <p className="font-medium text-sm leading-snug">{item.objective}</p>

                  {showReasoning && item.reasoning && (
                    <p className="mt-2.5 text-xs text-[var(--muted)] leading-relaxed border-t border-[var(--border)] pt-2.5">
                      <span className="text-white/50 uppercase tracking-wide text-[10px]">Why: </span>
                      {item.reasoning}
                    </p>
                  )}

                  {item.results && (
                    <div className="mt-2.5 flex items-center gap-1.5 text-xs text-emerald-400">
                      <span>✓</span>
                      {item.results}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!(showRoadmap && stages.length > 0) && !(showMarketingPlan && visibleItems.length > 0) && (
          <div className="glass mt-10 px-6 py-16 text-center fade-up">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent)]/10 text-2xl">
              📋
            </div>
            <p className="font-medium">Strategy in progress</p>
            <p className="mt-1 text-sm text-[var(--muted)]">Your agent is preparing your listing strategy. Check back soon.</p>
          </div>
        )}

        {/* Footer */}
        <p className="mt-12 text-center text-xs text-[var(--muted)]/60">
          Powered by Seller Strategy Dashboard
          {property.agent?.name && ` · ${property.agent.name}`}
        </p>
      </div>
    </div>
  );
}
