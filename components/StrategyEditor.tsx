"use client";

import { useState } from "react";
import Link from "next/link";
import type { Property, RoadmapStage, MarketingItem, VisibilitySettings, RoadmapStatus, MarketingItemType, PerformanceStat, Prisma } from "@prisma/client";

type FullProperty = Property & {
  roadmapStages: RoadmapStage[];
  marketingItems: MarketingItem[];
  performanceStats: PerformanceStat[];
  visibility: VisibilitySettings | null;
};

const STATUS_CYCLE: RoadmapStatus[] = ["UPCOMING", "ACTIVE", "COMPLETED"];
const STATUS_LABEL: Record<RoadmapStatus, string> = {
  UPCOMING: "Upcoming",
  ACTIVE: "Active",
  COMPLETED: "Completed",
};
const STATUS_COLOR: Record<RoadmapStatus, string> = {
  UPCOMING: "bg-white/10 text-[var(--muted)]",
  ACTIVE: "bg-[var(--accent)]/20 text-[var(--accent)]",
  COMPLETED: "bg-emerald-500/20 text-emerald-400",
};

const MARKETING_TYPE_LABEL: Record<MarketingItemType, string> = {
  MLS: "MLS",
  SOCIAL: "Social",
  VIDEO: "Video",
  OPEN_HOUSE: "Open House",
  REVERSE_PROSPECTING: "Reverse Prospecting",
  OUTREACH: "Agent Outreach",
  OTHER: "Other",
};

type StrategyBrief = {
  positioningTheme?: string;
  campaignTagline?: string;
  heroFeature?: string;
  heroFeatureWhy?: string;
  targetBuyer?: string;
  strengthsAndChallenges?: { strengths: string[]; challenges: string[]; opportunities: string[] };
  mlsHeadline?: string;
  mlsRemarks?: string;
  agentRemarks?: string;
  featureHierarchy?: { feature: string; marketingAngle: string; why: string }[];
  reelIdeas?: { title: string; hook: string; concept: string; why: string }[];
  stagingPriorities?: { area: string; action: string; impact: string }[];
  launchTimeline?: { phase: string; tasks: string[] }[];
  weeklyMarketingPlan?: { week: string; focus: string; tactics: string[] }[];
};

const TABS = ["Strategy Brief", "Marketing Plan", "Roadmap Details", "Performance", "Details", "Visibility & Sharing"] as const;

export default function StrategyEditor({ property }: { property: FullProperty }) {
  const [tab, setTab] = useState<typeof TABS[number]>(
    property.templateSource === "ai" ? "Strategy Brief" : "Marketing Plan"
  );
  const [stages, setStages] = useState(property.roadmapStages);
  const [items, setItems] = useState(property.marketingItems);
  const [visibility, setVisibility] = useState(property.visibility);
  const [details, setDetails] = useState(property);
  const [stats, setStats] = useState(property.performanceStats);
  const [brief, setBrief] = useState<StrategyBrief | null>(
    property.strategyBrief ? (property.strategyBrief as StrategyBrief) : null
  );

  const sellerUrl = typeof window !== "undefined"
    ? `${window.location.origin}/seller/${property.shareToken}`
    : `/seller/${property.shareToken}`;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/dashboard" className="text-xs text-[var(--muted)]">&larr; All listings</Link>
          <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">{details.address}</h1>
          {details.price && <p className="mt-1 text-sm text-[var(--muted)]">${details.price.toLocaleString()}</p>}
        </div>
        <div className="flex gap-2 self-start sm:self-auto">
          <SaveTemplateButton propertyId={property.id} />
          <a href={sellerUrl} target="_blank" rel="noreferrer" className="btn-secondary text-sm">
            View as Seller
          </a>
        </div>
      </div>

      <div className="mt-6">
        <RoadmapTracker stages={stages} />
      </div>

      <div className="mt-6 flex gap-2 overflow-x-auto border-b border-[var(--border)]">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-1.5 whitespace-nowrap px-4 py-2 text-sm transition ${
              tab === t ? "border-b-2 border-[var(--accent)] text-white" : "text-[var(--muted)] hover:text-white"
            }`}
          >
            {t}
            {t === "Strategy Brief" && brief && (
              <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
            )}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "Strategy Brief" && <StrategyBriefTab propertyId={property.id} brief={brief} setBrief={setBrief} property={details} />}
        {tab === "Marketing Plan" && <MarketingTab propertyId={property.id} items={items} setItems={setItems} />}
        {tab === "Roadmap Details" && <RoadmapTab propertyId={property.id} stages={stages} setStages={setStages} />}
        {tab === "Performance" && <PerformanceTab propertyId={property.id} stats={stats} setStats={setStats} />}
        {tab === "Details" && <DetailsTab propertyId={property.id} details={details} setDetails={setDetails} />}
        {tab === "Visibility & Sharing" && (
          <VisibilityTab propertyId={property.id} visibility={visibility} setVisibility={setVisibility} sellerUrl={sellerUrl} />
        )}
      </div>

      {/* Next / Prev navigation */}
      {(() => {
        const currentIdx = TABS.indexOf(tab);
        const nextTab = TABS[currentIdx + 1];
        const prevTab = TABS[currentIdx - 1];
        return (
          <div className={`mt-8 flex items-center ${prevTab ? "justify-between" : "justify-end"}`}>
            {prevTab && (
              <button onClick={() => setTab(prevTab)} className="btn-secondary flex items-center gap-2 text-sm">
                ← {prevTab}
              </button>
            )}
            {nextTab && (
              <button onClick={() => setTab(nextTab)} className="btn-primary flex items-center gap-2 text-sm">
                Next: {nextTab} →
              </button>
            )}
          </div>
        );
      })()}
    </div>
  );
}

function SaveTemplateButton({ propertyId }: { propertyId: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    if (!name.trim()) return;
    setSaving(true);
    await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), propertyId }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => { setSaved(false); setOpen(false); setName(""); }, 1200);
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-secondary text-sm">
        Save as Template
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && save()}
        placeholder="Template name…"
        className="h-9 w-44 rounded-lg border border-[var(--border)] bg-white/5 px-3 text-sm outline-none focus:border-[var(--accent)]"
      />
      <button onClick={save} disabled={saving || !name.trim()} className="btn-primary text-sm">
        {saved ? "Saved!" : saving ? "Saving…" : "Save"}
      </button>
      <button onClick={() => { setOpen(false); setName(""); }} className="btn-secondary text-sm">Cancel</button>
    </div>
  );
}

function RoadmapTracker({ stages }: { stages: RoadmapStage[] }) {
  const sorted = [...stages].sort((a, b) => a.order - b.order);
  if (sorted.length === 0) return null;

  return (
    <div className="glass px-4 py-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[var(--muted)]">Listing Progress</p>
      <div className="flex items-center overflow-x-auto pb-1">
        {sorted.map((stage, i) => (
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
            {i < sorted.length - 1 && (
              <div className={`mx-1 h-0.5 w-8 shrink-0 ${stage.status === "COMPLETED" ? "bg-emerald-500" : "bg-white/10"}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const STAT_PRESETS = ["MLS Views", "Showings", "Open House Visitors", "Leads", "Social Engagement"];

function PerformanceTab({
  propertyId,
  stats,
  setStats,
}: {
  propertyId: string;
  stats: PerformanceStat[];
  setStats: React.Dispatch<React.SetStateAction<PerformanceStat[]>>;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [label, setLabel] = useState(STAT_PRESETS[0]);
  const [value, setValue] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function addStat() {
    if (!value.trim()) return;
    setSaving(true);
    const res = await fetch("/api/performance-stats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId, label, value, date, note: note.trim() || null }),
    });
    const stat = await res.json();
    setStats((prev) => [stat, ...prev]);
    setValue("");
    setNote("");
    setSaving(false);
    setShowAdd(false);
  }

  async function remove(stat: PerformanceStat) {
    setStats((prev) => prev.filter((s) => s.id !== stat.id));
    await fetch(`/api/performance-stats/${stat.id}`, { method: "DELETE" });
  }

  // Group by label, latest entry per group for the summary cards
  const byLabel = new Map<string, PerformanceStat[]>();
  for (const s of stats) {
    byLabel.set(s.label, [...(byLabel.get(s.label) ?? []), s]);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--muted)]">
        Log key numbers over time to show sellers how the marketing plan is performing.
      </p>

      {byLabel.size > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[...byLabel.entries()].map(([l, entries]) => {
            const latest = entries[0];
            const previous = entries[1];
            const delta = previous ? latest.value - previous.value : null;
            return (
              <div key={l} className="glass px-4 py-3">
                <p className="text-xs text-[var(--muted)]">{l}</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight">{latest.value.toLocaleString()}</p>
                {delta !== null && (
                  <p className={`mt-1 text-xs ${delta >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {delta >= 0 ? "+" : ""}{delta.toLocaleString()} since last entry
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="glass divide-y divide-[var(--border)]">
        {stats.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-[var(--muted)]">No performance data yet.</p>
        )}
        {stats.map((stat) => (
          <div key={stat.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <div>
              <p className="font-medium">{stat.label}: {stat.value.toLocaleString()}</p>
              <p className="text-xs text-[var(--muted)]">
                {new Date(stat.date).toLocaleDateString()}{stat.note ? ` — ${stat.note}` : ""}
              </p>
            </div>
            <button onClick={() => remove(stat)} className="text-xs text-[var(--muted)] hover:text-red-400">Remove</button>
          </div>
        ))}
      </div>

      {showAdd ? (
        <div className="glass space-y-3 px-5 py-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="stat-label">Metric</label>
              <select id="stat-label" value={label} onChange={(e) => setLabel(e.target.value)}>
                {STAT_PRESETS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="stat-value">Value</label>
              <input id="stat-value" type="number" value={value} onChange={(e) => setValue(e.target.value)} placeholder="e.g. 142" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="stat-date">Date</label>
              <input id="stat-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <label htmlFor="stat-note">Note (optional)</label>
              <input id="stat-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. After open house" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={addStat} disabled={saving || !value.trim()} className="btn-primary text-sm">
              {saving ? "Saving..." : "Add Entry"}
            </button>
            <button onClick={() => setShowAdd(false)} className="btn-secondary text-sm">Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowAdd(true)} className="btn-secondary w-full text-sm">+ Add Performance Entry</button>
      )}
    </div>
  );
}

function DetailsTab({
  propertyId,
  details,
  setDetails,
}: {
  propertyId: string;
  details: FullProperty;
  setDetails: React.Dispatch<React.SetStateAction<FullProperty>>;
}) {
  const [address, setAddress] = useState(details.address);
  const [price, setPrice] = useState(details.price?.toString() ?? "");
  const [sellerName, setSellerName] = useState(details.sellerName ?? "");
  const [sellerGoals, setSellerGoals] = useState(details.sellerGoals ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/properties/${propertyId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, price, sellerName, sellerGoals }),
    });
    const updated = await res.json();
    setDetails(updated);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="glass space-y-4 px-5 py-4">
      <div>
        <label htmlFor="details-address">Property Address</label>
        <input id="details-address" value={address} onChange={(e) => setAddress(e.target.value)} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="details-price">List Price</label>
          <input id="details-price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="650000" />
        </div>
        <div>
          <label htmlFor="details-sellerName">Seller Name</label>
          <input id="details-sellerName" value={sellerName} onChange={(e) => setSellerName(e.target.value)} placeholder="Jane & Tom Smith" />
        </div>
      </div>
      <div>
        <label htmlFor="details-sellerGoals">Seller Goals</label>
        <textarea id="details-sellerGoals" rows={2} value={sellerGoals} onChange={(e) => setSellerGoals(e.target.value)} placeholder="e.g. Sell quickly to relocate by August" />
      </div>
      <button onClick={save} disabled={saving || !address.trim()} className="btn-primary text-sm">
        {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
      </button>
    </div>
  );
}

function RoadmapTab({
  propertyId,
  stages,
  setStages,
}: {
  propertyId: string;
  stages: RoadmapStage[];
  setStages: React.Dispatch<React.SetStateAction<RoadmapStage[]>>;
}) {
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);

  async function cycleStatus(stage: RoadmapStage) {
    const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(stage.status) + 1) % STATUS_CYCLE.length];
    setStages((prev) => prev.map((s) => (s.id === stage.id ? { ...s, status: next } : s)));
    await fetch(`/api/roadmap-stages/${stage.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
  }

  async function move(stage: RoadmapStage, direction: -1 | 1) {
    const sorted = [...stages].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((s) => s.id === stage.id);
    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    const a = sorted[idx];
    const b = sorted[swapIdx];
    const updated = sorted.map((s) =>
      s.id === a.id ? { ...s, order: b.order } : s.id === b.id ? { ...s, order: a.order } : s
    );
    setStages(updated);

    await Promise.all([
      fetch(`/api/roadmap-stages/${a.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order: b.order }) }),
      fetch(`/api/roadmap-stages/${b.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order: a.order }) }),
    ]);
  }

  async function rename(stage: RoadmapStage, name: string) {
    setStages((prev) => prev.map((s) => (s.id === stage.id ? { ...s, name } : s)));
    await fetch(`/api/roadmap-stages/${stage.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
  }

  async function remove(stage: RoadmapStage) {
    setStages((prev) => prev.filter((s) => s.id !== stage.id));
    await fetch(`/api/roadmap-stages/${stage.id}`, { method: "DELETE" });
  }

  async function addStage() {
    if (!newName.trim()) return;
    setAdding(true);
    const res = await fetch("/api/roadmap-stages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId, name: newName.trim() }),
    });
    const stage = await res.json();
    setStages((prev) => [...prev, stage]);
    setNewName("");
    setAdding(false);
  }

  const sorted = [...stages].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-3">
      <p className="text-sm text-[var(--muted)]">
        Click a stage&apos;s status to cycle Upcoming &rarr; Active &rarr; Completed. This is what sellers see as the roadmap.
      </p>
      {sorted.map((stage, i) => (
        <div key={stage.id} className="glass flex items-center gap-3 px-4 py-3">
          <div className="flex flex-col gap-0.5">
            <button onClick={() => move(stage, -1)} disabled={i === 0} className="text-xs text-[var(--muted)] disabled:opacity-30">&uarr;</button>
            <button onClick={() => move(stage, 1)} disabled={i === sorted.length - 1} className="text-xs text-[var(--muted)] disabled:opacity-30">&darr;</button>
          </div>
          <input
            value={stage.name}
            onChange={(e) => rename(stage, e.target.value)}
            className="flex-1 !border-0 !bg-transparent !p-0 font-medium"
          />
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--muted)]">Stage Status:</span>
            <button onClick={() => cycleStatus(stage)} className={`rounded-full px-3 py-1 text-xs ${STATUS_COLOR[stage.status]}`}>
              {STATUS_LABEL[stage.status]}
            </button>
          </div>
          <button onClick={() => remove(stage)} className="text-xs text-[var(--muted)] hover:text-red-400">Remove</button>
        </div>
      ))}

      <div className="glass flex items-center gap-3 px-4 py-3">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addStage()}
          placeholder="Add a stage (e.g. Inspection)"
          className="flex-1 !border-0 !bg-transparent !p-0"
        />
        <button onClick={addStage} disabled={adding} className="btn-secondary text-xs">Add</button>
      </div>
    </div>
  );
}

function MarketingItemCard({
  item,
  onSave,
  onRemove,
}: {
  item: MarketingItem;
  onSave: (patch: Partial<MarketingItem>) => Promise<void>;
  onRemove: () => void;
}) {
  const [type, setType] = useState(item.type);
  const [objective, setObjective] = useState(item.objective);
  const [status, setStatus] = useState(item.status);
  const [results, setResults] = useState(item.results ?? "");
  const [reasoning, setReasoning] = useState(item.reasoning ?? "");
  const [visibleToSeller, setVisibleToSeller] = useState(item.visibleToSeller);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    await onSave({ type, objective, status, results: results || null, reasoning, visibleToSeller });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  // Auto-save silently on blur — button is just for feel-good confirmation
  function handleBlur() {
    onSave({ type, objective, status, results: results || null, reasoning, visibleToSeller });
  }

  return (
    <div className="glass px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <select value={type} onChange={(e) => { setType(e.target.value as MarketingItemType); onSave({ type: e.target.value as MarketingItemType }); }} className="!w-auto !py-1 text-sm font-medium">
          {Object.entries(MARKETING_TYPE_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <div className="flex items-center gap-3">
          <label className="!mb-0 flex items-center gap-1.5 whitespace-nowrap text-xs">
            <input type="checkbox" className="!w-auto" checked={visibleToSeller} onChange={(e) => { setVisibleToSeller(e.target.checked); onSave({ visibleToSeller: e.target.checked }); }} />
            Visible to seller
          </label>
          <button onClick={onRemove} className="text-xs text-[var(--muted)] hover:text-red-400">Remove</button>
        </div>
      </div>

      <div className="mt-3">
        <label>Objective</label>
        <textarea rows={2} value={objective} onChange={(e) => setObjective(e.target.value)} onBlur={handleBlur} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <label>Status</label>
          <input value={status} onChange={(e) => setStatus(e.target.value)} onBlur={handleBlur} placeholder="Planned / Active / Done" />
        </div>
        <div>
          <label>Results (optional)</label>
          <input value={results} onChange={(e) => setResults(e.target.value)} onBlur={handleBlur} placeholder="e.g. 24 showings booked" />
        </div>
      </div>

      <div className="mt-3">
        <label>Why we&apos;re doing this</label>
        <textarea rows={2} value={reasoning} onChange={(e) => setReasoning(e.target.value)} onBlur={handleBlur} />
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button onClick={save} disabled={saving} className="btn-primary text-sm">
          {saving ? "Saving..." : saved ? "✓ Saved!" : "Save Changes"}
        </button>
        {saved && <span className="text-xs text-emerald-400">Changes saved</span>}
      </div>
    </div>
  );
}

function MarketingTab({
  propertyId,
  items,
  setItems,
}: {
  propertyId: string;
  items: MarketingItem[];
  setItems: React.Dispatch<React.SetStateAction<MarketingItem[]>>;
}) {
  const [showAdd, setShowAdd] = useState(false);

  async function save(item: MarketingItem, patch: Partial<MarketingItem>) {
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, ...patch } : i)));
    await fetch(`/api/marketing-items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
  }

  async function remove(item: MarketingItem) {
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    await fetch(`/api/marketing-items/${item.id}`, { method: "DELETE" });
  }

  async function addItem(data: { type: MarketingItemType; objective: string; reasoning: string }) {
    const res = await fetch("/api/marketing-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId, ...data, status: "Planned" }),
    });
    const item = await res.json();
    setItems((prev) => [...prev, item]);
    setShowAdd(false);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--muted)]">What we&apos;re doing to market this listing, and why. Edit any item and hit Save Changes.</p>
      {items.map((item) => (
        <MarketingItemCard
          key={item.id}
          item={item}
          onSave={(patch) => save(item, patch)}
          onRemove={() => remove(item)}
        />
      ))}

      {showAdd ? (
        <NewMarketingItemForm onAdd={addItem} onCancel={() => setShowAdd(false)} />
      ) : (
        <button onClick={() => setShowAdd(true)} className="btn-secondary w-full text-sm">+ Add Marketing Item</button>
      )}
    </div>
  );
}

function NewMarketingItemForm({
  onAdd,
  onCancel,
}: {
  onAdd: (data: { type: MarketingItemType; objective: string; reasoning: string }) => void;
  onCancel: () => void;
}) {
  const [type, setType] = useState<MarketingItemType>("MLS");
  const [objective, setObjective] = useState("");
  const [reasoning, setReasoning] = useState("");

  return (
    <div className="glass px-5 py-4">
      <div>
        <label>Type</label>
        <select value={type} onChange={(e) => setType(e.target.value as MarketingItemType)}>
          {Object.entries(MARKETING_TYPE_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>
      <div className="mt-3">
        <label>Objective</label>
        <textarea rows={2} value={objective} onChange={(e) => setObjective(e.target.value)} placeholder="What is this marketing item meant to accomplish?" />
      </div>
      <div className="mt-3">
        <label>Why we&apos;re doing this</label>
        <textarea rows={2} value={reasoning} onChange={(e) => setReasoning(e.target.value)} placeholder="The reasoning sellers will see" />
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => objective.trim() && onAdd({ type, objective: objective.trim(), reasoning: reasoning.trim() })}
          className="btn-primary text-sm"
        >
          Add Item
        </button>
        <button onClick={onCancel} className="btn-secondary text-sm">Cancel</button>
      </div>
    </div>
  );
}

function StrategyBriefTab({
  propertyId,
  brief,
  setBrief,
  property,
}: {
  propertyId: string;
  brief: StrategyBrief | null;
  setBrief: React.Dispatch<React.SetStateAction<StrategyBrief | null>>;
  property: FullProperty;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<StrategyBrief>(brief ?? {});
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");

  async function saveBrief(b: StrategyBrief) {
    setSaving(true);
    await fetch(`/api/properties/${propertyId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ strategyBrief: b }),
    });
    setBrief(b);
    setSaving(false);
    setEditing(false);
  }

  async function generate() {
    setGenerating(true);
    setGenError("");
    const res = await fetch("/api/generate-strategy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address: property.address,
        price: property.price,
        sellerName: property.sellerName,
        sellerGoals: property.sellerGoals,
        homeStyle: property.homeStyle,
        occupancyStatus: property.occupancyStatus,
        condition: property.condition,
        propertyFeatures: property.propertyFeatures,
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      setGenError(data.error ?? "Generation failed. Check your API key.");
      setGenerating(false);
      return;
    }
    const data = await res.json();
    const { roadmapStages: _r, marketingItems: _m, ...newBrief } = data;
    setDraft(newBrief);
    await saveBrief(newBrief);
    setGenerating(false);
  }

  // No brief yet
  if (!brief && !editing) {
    return (
      <div className="space-y-4">
        <div className="glass px-6 py-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/20">
            <svg className="h-6 w-6 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold">No strategy brief yet</h3>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Generate a full positioning strategy — campaign theme, MLS copy, reel hooks, staging tips, and week-by-week marketing plan.
          </p>
          {genError && <p className="mt-3 text-sm text-red-400">{genError}</p>}
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={generate}
              disabled={generating}
              className="btn-primary flex items-center gap-2"
            >
              {generating ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Generating strategy...
                </>
              ) : "✨ Generate with AI"}
            </button>
            <button onClick={() => { setEditing(true); setDraft({}); }} className="btn-secondary text-sm">
              Build manually
            </button>
          </div>
          {!property.propertyFeatures && (
            <p className="mt-4 text-xs text-purple-300/70">
              Tip: Add key features in the Details tab first — the more context Claude has, the better the strategy.
            </p>
          )}
        </div>
      </div>
    );
  }

  // Edit mode
  if (editing) {
    const d = draft;
    const set = (key: keyof StrategyBrief, val: unknown) => setDraft((prev) => ({ ...prev, [key]: val }));

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Edit Strategy Brief</h3>
          <div className="flex gap-2">
            <button onClick={() => { setEditing(false); setDraft(brief ?? {}); }} className="btn-secondary text-sm">Cancel</button>
            <button onClick={() => saveBrief(draft)} disabled={saving} className="btn-primary text-sm">
              {saving ? "Saving..." : "Save Brief"}
            </button>
          </div>
        </div>

        <div className="glass space-y-4 px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-purple-300">Positioning</p>
          <div>
            <label>Campaign Theme</label>
            <input value={d.positioningTheme ?? ""} onChange={(e) => set("positioningTheme", e.target.value)} placeholder="e.g. The Front Porch House" />
          </div>
          <div>
            <label>Campaign Tagline</label>
            <input value={d.campaignTagline ?? ""} onChange={(e) => set("campaignTagline", e.target.value)} placeholder="e.g. Where neighbors become community" />
          </div>
          <div>
            <label>Hero Feature</label>
            <input value={d.heroFeature ?? ""} onChange={(e) => set("heroFeature", e.target.value)} placeholder="The single most compelling thing to lead every piece of marketing" />
          </div>
          <div>
            <label>Why the Hero Feature Wins</label>
            <textarea rows={2} value={d.heroFeatureWhy ?? ""} onChange={(e) => set("heroFeatureWhy", e.target.value)} placeholder="Why this feature matters to the specific buyer who will pay full price" />
          </div>
          <div>
            <label>Target Buyer</label>
            <textarea rows={3} value={d.targetBuyer ?? ""} onChange={(e) => set("targetBuyer", e.target.value)} placeholder="Vivid description of who the ideal buyer is and what they're looking for" />
          </div>
        </div>

        <div className="glass space-y-4 px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-purple-300">MLS Copy</p>
          <div>
            <label>MLS Headline</label>
            <input value={d.mlsHeadline ?? ""} onChange={(e) => set("mlsHeadline", e.target.value)} placeholder="Under 60 characters, lifestyle-first" />
          </div>
          <div>
            <label>Public Remarks</label>
            <textarea rows={6} value={d.mlsRemarks ?? ""} onChange={(e) => set("mlsRemarks", e.target.value)} placeholder="Full MLS public remarks..." />
          </div>
          <div>
            <label>Agent Remarks</label>
            <textarea rows={4} value={d.agentRemarks ?? ""} onChange={(e) => set("agentRemarks", e.target.value)} placeholder="Agent-to-agent notes: showing instructions, offer presentation, context..." />
          </div>
        </div>

        <div className="glass space-y-3 px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-purple-300">Reel Ideas</p>
          {(d.reelIdeas ?? []).map((reel, i) => (
            <div key={i} className="rounded-lg border border-[var(--border)] bg-white/[0.02] p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-purple-300">Reel {i + 1}</p>
                <button
                  type="button"
                  onClick={() => set("reelIdeas", (d.reelIdeas ?? []).filter((_, j) => j !== i))}
                  className="text-xs text-[var(--muted)] hover:text-red-400"
                >Remove</button>
              </div>
              <input
                value={reel.title}
                onChange={(e) => set("reelIdeas", (d.reelIdeas ?? []).map((r, j) => j === i ? { ...r, title: e.target.value } : r))}
                placeholder="Concept title"
              />
              <input
                value={reel.hook}
                onChange={(e) => set("reelIdeas", (d.reelIdeas ?? []).map((r, j) => j === i ? { ...r, hook: e.target.value } : r))}
                placeholder="Opening hook (first 3 seconds)"
              />
              <textarea
                rows={2}
                value={reel.concept}
                onChange={(e) => set("reelIdeas", (d.reelIdeas ?? []).map((r, j) => j === i ? { ...r, concept: e.target.value } : r))}
                placeholder="What to film and how to structure the video"
              />
              <textarea
                rows={2}
                value={reel.why}
                onChange={(e) => set("reelIdeas", (d.reelIdeas ?? []).map((r, j) => j === i ? { ...r, why: e.target.value } : r))}
                placeholder="Why this will resonate with the target buyer"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => set("reelIdeas", [...(d.reelIdeas ?? []), { title: "", hook: "", concept: "", why: "" }])}
            className="btn-secondary w-full text-sm"
          >+ Add Reel Idea</button>
        </div>

        <div className="glass space-y-3 px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-purple-300">Staging Priorities</p>
          {(d.stagingPriorities ?? []).map((s, i) => (
            <div key={i} className="rounded-lg border border-[var(--border)] bg-white/[0.02] p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Area: <span className="text-[var(--muted)]">{s.area || "—"}</span></p>
                <button type="button" onClick={() => set("stagingPriorities", (d.stagingPriorities ?? []).filter((_, j) => j !== i))} className="text-xs text-[var(--muted)] hover:text-red-400">Remove</button>
              </div>
              <input value={s.area} onChange={(e) => set("stagingPriorities", (d.stagingPriorities ?? []).map((x, j) => j === i ? { ...x, area: e.target.value } : x))} placeholder="Area (e.g. Master Bedroom)" />
              <textarea rows={2} value={s.action} onChange={(e) => set("stagingPriorities", (d.stagingPriorities ?? []).map((x, j) => j === i ? { ...x, action: e.target.value } : x))} placeholder="What to do" />
              <input value={s.impact} onChange={(e) => set("stagingPriorities", (d.stagingPriorities ?? []).map((x, j) => j === i ? { ...x, impact: e.target.value } : x))} placeholder="Why it matters" />
            </div>
          ))}
          <button type="button" onClick={() => set("stagingPriorities", [...(d.stagingPriorities ?? []), { area: "", action: "", impact: "" }])} className="btn-secondary w-full text-sm">+ Add Staging Item</button>
        </div>

        <div className="glass space-y-3 px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-purple-300">Weekly Marketing Plan</p>
          {(d.weeklyMarketingPlan ?? []).map((w, i) => (
            <div key={i} className="rounded-lg border border-[var(--border)] bg-white/[0.02] p-4 space-y-2">
              <div className="flex items-center justify-between">
                <input value={w.week} onChange={(e) => set("weeklyMarketingPlan", (d.weeklyMarketingPlan ?? []).map((x, j) => j === i ? { ...x, week: e.target.value } : x))} placeholder="Week label (e.g. Week 1: Launch)" className="font-medium" />
                <button type="button" onClick={() => set("weeklyMarketingPlan", (d.weeklyMarketingPlan ?? []).filter((_, j) => j !== i))} className="text-xs text-[var(--muted)] hover:text-red-400">Remove</button>
              </div>
              <input value={w.focus} onChange={(e) => set("weeklyMarketingPlan", (d.weeklyMarketingPlan ?? []).map((x, j) => j === i ? { ...x, focus: e.target.value } : x))} placeholder="Strategic focus for this week" />
              <textarea rows={3} value={(w.tactics ?? []).join("\n")} onChange={(e) => set("weeklyMarketingPlan", (d.weeklyMarketingPlan ?? []).map((x, j) => j === i ? { ...x, tactics: e.target.value.split("\n") } : x))} placeholder="One tactic per line" />
            </div>
          ))}
          <button type="button" onClick={() => set("weeklyMarketingPlan", [...(d.weeklyMarketingPlan ?? []), { week: "", focus: "", tactics: [] }])} className="btn-secondary w-full text-sm">+ Add Week</button>
        </div>

        <div className="flex gap-2">
          <button onClick={() => { setEditing(false); setDraft(brief ?? {}); }} className="btn-secondary text-sm">Cancel</button>
          <button onClick={() => saveBrief(draft)} disabled={saving} className="btn-primary text-sm">
            {saving ? "Saving..." : "Save Brief"}
          </button>
        </div>
      </div>
    );
  }

  // View mode
  const b = brief!;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--muted)]">AI-generated strategy. Edit any section to customize.</p>
        <div className="flex gap-2">
          <button
            onClick={generate}
            disabled={generating}
            className="btn-secondary text-sm flex items-center gap-1.5"
          >
            {generating ? (
              <><svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg> Regenerating...</>
            ) : "↺ Regenerate"}
          </button>
          <button onClick={() => { setDraft(b); setEditing(true); }} className="btn-secondary text-sm">Edit</button>
        </div>
      </div>

      {/* Positioning */}
      <div className="glass px-5 py-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3">
          <span className="text-purple-300 text-lg">✦</span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-purple-300">Campaign</p>
            <p className="mt-0.5 text-xl font-semibold tracking-tight">{b.positioningTheme || "—"}</p>
            {b.campaignTagline && <p className="mt-1 text-sm italic text-[var(--muted)]">&ldquo;{b.campaignTagline}&rdquo;</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {b.heroFeature && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Hero Feature</p>
              <p className="mt-1 font-medium">{b.heroFeature}</p>
              {b.heroFeatureWhy && <p className="mt-1 text-sm text-[var(--muted)]">{b.heroFeatureWhy}</p>}
            </div>
          )}
          {b.targetBuyer && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Target Buyer</p>
              <p className="mt-1 text-sm text-[var(--muted)]">{b.targetBuyer}</p>
            </div>
          )}
        </div>

        {b.strengthsAndChallenges && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 pt-2 border-t border-[var(--border)]">
            {b.strengthsAndChallenges.strengths?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-emerald-400 mb-2">Strengths</p>
                <ul className="space-y-1">{b.strengthsAndChallenges.strengths.map((s, i) => <li key={i} className="text-xs text-[var(--muted)] flex gap-1.5"><span className="text-emerald-400 mt-0.5">+</span>{s}</li>)}</ul>
              </div>
            )}
            {b.strengthsAndChallenges.challenges?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-amber-400 mb-2">Challenges</p>
                <ul className="space-y-1">{b.strengthsAndChallenges.challenges.map((s, i) => <li key={i} className="text-xs text-[var(--muted)] flex gap-1.5"><span className="text-amber-400 mt-0.5">△</span>{s}</li>)}</ul>
              </div>
            )}
            {b.strengthsAndChallenges.opportunities?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-blue-400 mb-2">Opportunities</p>
                <ul className="space-y-1">{b.strengthsAndChallenges.opportunities.map((s, i) => <li key={i} className="text-xs text-[var(--muted)] flex gap-1.5"><span className="text-blue-400 mt-0.5">→</span>{s}</li>)}</ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MLS Copy */}
      {(b.mlsHeadline || b.mlsRemarks || b.agentRemarks) && (
        <div className="glass px-5 py-5 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">MLS Copy</p>
          {b.mlsHeadline && (
            <div>
              <p className="text-xs text-[var(--muted)]">Headline</p>
              <p className="mt-1 font-semibold text-[var(--accent)]">{b.mlsHeadline}</p>
            </div>
          )}
          {b.mlsRemarks && (
            <div>
              <p className="text-xs text-[var(--muted)]">Public Remarks</p>
              <p className="mt-1 text-sm text-white/80 whitespace-pre-wrap leading-relaxed">{b.mlsRemarks}</p>
            </div>
          )}
          {b.agentRemarks && (
            <div className="pt-3 border-t border-[var(--border)]">
              <p className="text-xs text-[var(--muted)]">Agent Remarks</p>
              <p className="mt-1 text-sm text-white/70 whitespace-pre-wrap">{b.agentRemarks}</p>
            </div>
          )}
        </div>
      )}

      {/* Feature Hierarchy */}
      {b.featureHierarchy && b.featureHierarchy.length > 0 && (
        <div className="glass px-5 py-5 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Feature Priority Order</p>
          {b.featureHierarchy.map((f, i) => (
            <div key={i} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/15 text-xs font-semibold text-[var(--accent)]">{i + 1}</span>
              <div>
                <p className="font-medium text-sm">{f.feature}</p>
                <p className="text-xs text-[var(--accent)]/80 mt-0.5">{f.marketingAngle}</p>
                <p className="text-xs text-[var(--muted)] mt-0.5">{f.why}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reel Ideas */}
      {b.reelIdeas && b.reelIdeas.length > 0 && (
        <div className="glass px-5 py-5 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Reel Ideas</p>
          {b.reelIdeas.map((r, i) => (
            <div key={i} className="rounded-xl border border-[var(--border)] bg-white/[0.02] p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] font-semibold text-purple-300">REEL {i + 1}</span>
                <p className="font-medium text-sm">{r.title}</p>
              </div>
              <p className="text-sm text-white/90 font-medium mb-1">🎬 &ldquo;{r.hook}&rdquo;</p>
              <p className="text-xs text-[var(--muted)] mb-2">{r.concept}</p>
              <p className="text-xs text-purple-300/70"><span className="font-medium text-purple-300">Why it works:</span> {r.why}</p>
            </div>
          ))}
        </div>
      )}

      {/* Staging */}
      {b.stagingPriorities && b.stagingPriorities.length > 0 && (
        <div className="glass px-5 py-5 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Staging Priorities</p>
          {b.stagingPriorities.map((s, i) => (
            <div key={i} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-xs font-semibold text-amber-400">{i + 1}</span>
              <div>
                <p className="text-xs font-semibold text-amber-400">{s.area}</p>
                <p className="text-sm mt-0.5">{s.action}</p>
                <p className="text-xs text-[var(--muted)] mt-0.5">{s.impact}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Launch Timeline */}
      {b.launchTimeline && b.launchTimeline.length > 0 && (
        <div className="glass px-5 py-5 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Launch Timeline</p>
          {b.launchTimeline.map((phase, i) => (
            <div key={i} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/20 text-[10px] font-bold text-[var(--accent)]">{i + 1}</div>
                {i < b.launchTimeline!.length - 1 && <div className="mt-1 h-full w-0.5 bg-[var(--border)]" />}
              </div>
              <div className="pb-3">
                <p className="text-sm font-semibold">{phase.phase}</p>
                <ul className="mt-1 space-y-0.5">
                  {phase.tasks.map((task, j) => <li key={j} className="text-xs text-[var(--muted)] flex gap-1.5"><span>·</span>{task}</li>)}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Weekly Plan */}
      {b.weeklyMarketingPlan && b.weeklyMarketingPlan.length > 0 && (
        <div className="glass px-5 py-5 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Weekly Marketing Plan</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {b.weeklyMarketingPlan.map((w, i) => (
              <div key={i} className="rounded-xl border border-[var(--border)] bg-white/[0.02] p-4">
                <p className="text-xs font-semibold text-[var(--accent)]">{w.week}</p>
                <p className="text-xs text-[var(--muted)] mt-1 mb-2 italic">{w.focus}</p>
                <ul className="space-y-1">
                  {(w.tactics ?? []).map((t, j) => <li key={j} className="text-xs text-white/70 flex gap-1.5"><span className="text-[var(--accent)] mt-0.5">·</span>{t}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function VisibilityTab({
  propertyId,
  visibility,
  setVisibility,
  sellerUrl,
}: {
  propertyId: string;
  visibility: VisibilitySettings | null;
  setVisibility: React.Dispatch<React.SetStateAction<VisibilitySettings | null>>;
  sellerUrl: string;
}) {
  const [copied, setCopied] = useState(false);

  async function toggle(key: keyof VisibilitySettings) {
    if (!visibility) return;
    const value = !visibility[key];
    setVisibility({ ...visibility, [key]: value } as VisibilitySettings);
    await fetch(`/api/properties/${propertyId}/visibility`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: value }),
    });
  }

  if (!visibility) return null;

  const rows: { key: keyof VisibilitySettings; label: string; description: string }[] = [
    { key: "showRoadmap", label: "Show Roadmap", description: "Seller can see the listing lifecycle and current stage." },
    { key: "showMarketingPlan", label: "Show Marketing Plan", description: "Seller can see marketing items and their status." },
    { key: "showReasoning", label: "Show Reasoning (\"Why\")", description: "Seller sees the explanation behind each marketing item." },
    { key: "showAnalytics", label: "Show Analytics", description: "Reserved for future performance metrics." },
  ];

  return (
    <div className="space-y-4">
      <div className="glass space-y-4 px-5 py-4">
        {rows.map((row) => (
          <div key={row.key} className="flex items-center justify-between">
            <div>
              <p className="font-medium">{row.label}</p>
              <p className="text-xs text-[var(--muted)]">{row.description}</p>
            </div>
            <button
              onClick={() => toggle(row.key)}
              className={`h-6 w-11 rounded-full p-0.5 transition ${visibility[row.key] ? "bg-[var(--accent)]" : "bg-white/10"}`}
            >
              <div className={`h-5 w-5 rounded-full bg-white transition ${visibility[row.key] ? "translate-x-5" : ""}`} />
            </button>
          </div>
        ))}
      </div>

      <div className="glass px-5 py-4">
        <p className="font-medium">Seller View Link</p>
        <p className="mt-1 text-xs text-[var(--muted)]">Share this link with your seller. No login required.</p>
        <div className="mt-3 flex gap-2">
          <input readOnly value={sellerUrl} className="!text-xs" />
          <button
            onClick={() => { navigator.clipboard.writeText(sellerUrl); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
            className="btn-secondary text-xs"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>
    </div>
  );
}
