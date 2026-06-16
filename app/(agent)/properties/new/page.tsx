"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TEMPLATES } from "@/lib/templates";

type SavedTemplate = { id: string; name: string; createdAt: string };
type StartingPoint = "template" | "ai" | "blank";

const HOME_STYLES = ["Single Family", "Condo", "Townhome", "Multi-Family", "Land", "Other"];
const OCCUPANCY_OPTIONS = ["Vacant", "Owner-Occupied", "Tenant-Occupied"];
const CONDITION_OPTIONS = ["Move-In Ready", "Needs Cosmetic Updates", "Fixer-Upper"];

export default function NewPropertyPage() {
  const router = useRouter();
  const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>([]);
  const [startingPoint, setStartingPoint] = useState<StartingPoint>("template");
  const [templateId, setTemplateId] = useState<string>("standard");

  // Core fields
  const [address, setAddress] = useState("");
  const [price, setPrice] = useState("");
  const [sellerName, setSellerName] = useState("");
  const [sellerGoals, setSellerGoals] = useState("");

  // Detail fields (used by AI)
  const [homeStyle, setHomeStyle] = useState("");
  const [occupancyStatus, setOccupancyStatus] = useState("");
  const [condition, setCondition] = useState("");
  const [propertyFeatures, setPropertyFeatures] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("Creating...");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/templates").then(r => r.json()).then(data => {
      if (Array.isArray(data)) setSavedTemplates(data);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    let aiStrategy: Record<string, unknown> | null = null;

    if (startingPoint === "ai") {
      setLoadingMsg("Analyzing your property and researching the market...");
      const aiRes = await fetch("/api/generate-strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, price, sellerName, sellerGoals, homeStyle, occupancyStatus, condition, propertyFeatures }),
      });
      if (!aiRes.ok) {
        const data = await aiRes.json();
        setError(data.error ?? "AI generation failed. Try a template instead.");
        setLoading(false);
        return;
      }
      aiStrategy = await aiRes.json();
      setLoadingMsg("Building your strategy...");
    }

    const isSaved = startingPoint === "template" && savedTemplates.some(t => t.id === templateId);

    const res = await fetch("/api/properties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address, price: price || null, sellerName, sellerGoals,
        homeStyle, occupancyStatus, condition, propertyFeatures,
        templateId: startingPoint === "template" ? templateId : null,
        savedTemplateId: isSaved ? templateId : null,
        aiStrategy,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Something went wrong");
      return;
    }

    const data = await res.json();
    router.push(`/properties/${data.id}`);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">New Seller Strategy</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Start from a template, generate with AI, or build manually.
      </p>

      <form onSubmit={handleSubmit} className="glass mt-8 space-y-6 px-6 py-6">
        {/* Core fields */}
        <div>
          <label htmlFor="address">Property Address</label>
          <input id="address" required value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Lakeshore Dr, Austin TX 78701" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="price">List Price (optional)</label>
            <input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="650000" />
          </div>
          <div>
            <label htmlFor="sellerName">Seller Name (optional)</label>
            <input id="sellerName" value={sellerName} onChange={(e) => setSellerName(e.target.value)} placeholder="Jane & Tom Smith" />
          </div>
        </div>

        <div>
          <label htmlFor="sellerGoals">Seller Goals (optional)</label>
          <textarea id="sellerGoals" rows={2} value={sellerGoals} onChange={(e) => setSellerGoals(e.target.value)} placeholder="e.g. Sell quickly to relocate by August, maximize price" />
        </div>

        {/* Starting point selector */}
        <div>
          <label className="!mb-3">Starting point</label>
          <div className="flex gap-2">
            {(["template", "ai", "blank"] as StartingPoint[]).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setStartingPoint(opt)}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm transition ${
                  startingPoint === opt
                    ? "border-[var(--accent)] bg-[var(--accent)]/10 text-white"
                    : "border-[var(--border)] bg-white/[0.02] text-[var(--muted)] hover:bg-white/[0.05]"
                }`}
              >
                {opt === "template" && "From template"}
                {opt === "ai" && (
                  <span className="flex items-center justify-center gap-1.5">
                    Generate with AI
                    <span className="rounded-full bg-purple-500/20 px-1.5 py-0.5 text-[10px] text-purple-300">NEW</span>
                  </span>
                )}
                {opt === "blank" && "Start blank"}
              </button>
            ))}
          </div>

          {startingPoint === "template" && (
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {savedTemplates.map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setTemplateId(t.id)}
                  className={`text-left px-4 py-3 rounded-xl border transition ${
                    templateId === t.id
                      ? "border-[var(--accent)] bg-[var(--accent)]/10"
                      : "border-[var(--border)] bg-white/[0.02] hover:bg-white/[0.05]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{t.name}</p>
                    <span className="rounded-full bg-[var(--accent)]/15 px-2 py-0.5 text-[10px] text-[var(--accent)]">Saved</span>
                  </div>
                  <p className="mt-1 text-xs text-[var(--muted)]">Your saved template</p>
                </button>
              ))}
              {TEMPLATES.map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setTemplateId(t.id)}
                  className={`text-left px-4 py-3 rounded-xl border transition ${
                    templateId === t.id
                      ? "border-[var(--accent)] bg-[var(--accent)]/10"
                      : "border-[var(--border)] bg-white/[0.02] hover:bg-white/[0.05]"
                  }`}
                >
                  <p className="font-medium">{t.name}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">{t.description}</p>
                </button>
              ))}
            </div>
          )}

          {startingPoint === "ai" && (
            <div className="mt-3 space-y-4 rounded-xl border border-purple-500/20 bg-purple-500/5 px-4 py-4">
              <p className="text-sm text-purple-200/80">
                Claude will generate a full positioning strategy — campaign theme, MLS copy, reel ideas, staging tips, and week-by-week marketing plan. The more detail you add here, the more tailored it gets.
              </p>

              {/* Property detail fields for AI */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="text-xs text-[var(--muted)]">Home Style</label>
                  <select
                    value={homeStyle}
                    onChange={(e) => setHomeStyle(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white/[0.04] px-3 py-2 text-sm text-white focus:border-[var(--accent)] focus:outline-none"
                  >
                    <option value="">Select...</option>
                    {HOME_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[var(--muted)]">Occupancy</label>
                  <select
                    value={occupancyStatus}
                    onChange={(e) => setOccupancyStatus(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white/[0.04] px-3 py-2 text-sm text-white focus:border-[var(--accent)] focus:outline-none"
                  >
                    <option value="">Select...</option>
                    {OCCUPANCY_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[var(--muted)]">Condition</label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white/[0.04] px-3 py-2 text-sm text-white focus:border-[var(--accent)] focus:outline-none"
                  >
                    <option value="">Select...</option>
                    {CONDITION_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-[var(--muted)]">Key Features & Updates</label>
                <textarea
                  rows={3}
                  value={propertyFeatures}
                  onChange={(e) => setPropertyFeatures(e.target.value)}
                  placeholder="e.g. New roof 2024, wraparound front porch, renovated kitchen with quartz counters, fenced backyard, 3-car garage, cul-de-sac lot, walking distance to elementary school"
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-[var(--accent)] focus:outline-none resize-none"
                />
                <p className="mt-1 text-[11px] text-purple-300/60">List every update, feature, and standout quality you can think of. Claude uses this to build the positioning strategy.</p>
              </div>
            </div>
          )}

          {startingPoint === "blank" && (
            <p className="mt-3 text-sm text-[var(--muted)]">
              You&apos;ll start with an empty roadmap and marketing plan, and can add stages and items yourself.
            </p>
          )}
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              {loadingMsg}
            </span>
          ) : startingPoint === "ai" ? "Generate Strategy with AI" : "Create Strategy"}
        </button>
      </form>
    </div>
  );
}
