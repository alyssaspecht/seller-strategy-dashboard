import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "AI generation is not configured." }, { status: 503 });
  }

  const { address, price, sellerName, sellerGoals, homeStyle, occupancyStatus, condition, propertyFeatures } = await req.json();

  const priceFormatted = price ? `$${Number(price).toLocaleString()}` : "not specified";

  const prompt = `You are a top-producing real estate listing strategist who has studied the marketing tactics of the most successful agents on social media — agents like Chelsea Peitz, Glennda Baker, and Byron Lazine. You create listing strategies that are deeply specific to each property, buyer-psychology driven, and ready to execute.

Generate a complete listing strategy for this property:

PROPERTY DETAILS:
- Address: ${address}
- List price: ${priceFormatted}
- Home style: ${homeStyle || "not specified"}
- Occupancy: ${occupancyStatus || "not specified"}
- Condition: ${condition || "not specified"}
- Key features / updates: ${propertyFeatures || "not specified"}
- Seller name: ${sellerName || "not specified"}
- Seller goals: ${sellerGoals || "not specified"}

Return ONLY a valid JSON object — no markdown, no explanation, no code fences. Use this exact structure:

{
  "positioningTheme": "A campaign name for this listing (e.g. 'The Front Porch House', 'The Forever Home', 'The Lock-and-Leave')",
  "campaignTagline": "One punchy line that captures the lifestyle this home sells (not the features — the feeling)",
  "heroFeature": "The single most compelling feature to lead every piece of marketing with",
  "heroFeatureWhy": "Exactly why this feature matters to the specific buyer who will pay full price for this home",
  "targetBuyer": "A vivid 2-3 sentence description of who the ideal buyer is, what stage of life they're in, and what they're looking for emotionally and practically",
  "strengthsAndChallenges": {
    "strengths": ["strength 1", "strength 2", "strength 3"],
    "challenges": ["challenge 1", "challenge 2"],
    "opportunities": ["opportunity 1", "opportunity 2"]
  },
  "mlsHeadline": "Compelling MLS headline under 60 characters that leads with lifestyle, not features",
  "mlsRemarks": "Full MLS public remarks (250-300 words). Open with the lifestyle. Weave in the features naturally. Close with a call to action. Write like a human, not a brochure.",
  "agentRemarks": "Agent-to-agent remarks (100-150 words) covering showing instructions, offer presentation notes, and any context that helps buyer's agents position the home for their clients.",
  "featureHierarchy": [
    { "feature": "Feature name", "marketingAngle": "How to present this in marketing copy", "why": "Why this specific feature matters to the target buyer" }
  ],
  "reelIdeas": [
    {
      "title": "Reel concept title",
      "hook": "Opening line (first 3 seconds — must stop the scroll)",
      "concept": "What to film and how to structure the 15-60 second video",
      "why": "Why this specific angle will resonate with the target buyer at this price point"
    }
  ],
  "stagingPriorities": [
    { "area": "Room or area", "action": "Specific staging action", "impact": "Why this matters for photography and buyer perception" }
  ],
  "launchTimeline": [
    { "phase": "Phase name (e.g. 'Day -7: Pre-Photography')", "tasks": ["task 1", "task 2"] }
  ],
  "weeklyMarketingPlan": [
    { "week": "Week label (e.g. 'Week 1: Launch')", "focus": "The strategic objective for this week", "tactics": ["specific tactic 1", "specific tactic 2"] }
  ],
  "roadmapStages": [
    { "name": "Stage name", "order": 0 }
  ],
  "marketingItems": [
    {
      "type": "MLS" | "SOCIAL" | "VIDEO" | "OPEN_HOUSE" | "REVERSE_PROSPECTING" | "OUTREACH" | "OTHER",
      "objective": "What we will do",
      "reasoning": "Property-specific reason — reference the hero feature, target buyer, or seller goals directly"
    }
  ]
}

RULES:
- positioningTheme must be specific to THIS property — never generic
- featureHierarchy: list 4-6 features in order of marketing impact, not square footage order
- reelIdeas: exactly 4 ideas. Each hook must be conversational and stop-scroll worthy. Reference the actual property, not templates.
- stagingPriorities: 3-5 high-impact, low-cost actions. Be specific (e.g. "Remove the TV from the master bedroom — buyers need to see it as a retreat, not a media room")
- launchTimeline: cover Day -7 through Day 7 in phases
- weeklyMarketingPlan: 4 weeks (Pre-Launch, Launch Week, Week 2, Week 3+)
- roadmapStages: 6-8 stages covering full listing lifecycle
- marketingItems: 5-8 items, types must be exactly one of: MLS, SOCIAL, VIDEO, OPEN_HOUSE, REVERSE_PROSPECTING, OUTREACH, OTHER
- Every section must reference specifics about this property — no generic real estate boilerplate`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8000,
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";

  let strategy;
  try {
    // Strip markdown code fences if Claude wraps the JSON
    const cleaned = text.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
    strategy = JSON.parse(cleaned);
  } catch {
    console.error("AI parse error. Raw response:", text.slice(0, 500));
    return NextResponse.json({ error: "Failed to parse AI response", raw: text.slice(0, 300) }, { status: 500 });
  }

  if (!strategy.roadmapStages || !strategy.marketingItems) {
    return NextResponse.json({ error: "Invalid AI response structure" }, { status: 500 });
  }

  return NextResponse.json(strategy);
}
