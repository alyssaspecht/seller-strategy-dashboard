export type TemplateStage = { name: string; order: number };
export type TemplateMarketingItem = {
  type: "MLS" | "SOCIAL" | "VIDEO" | "OPEN_HOUSE" | "REVERSE_PROSPECTING" | "OUTREACH" | "OTHER";
  objective: string;
  reasoning: string;
};

export type Template = {
  id: string;
  name: string;
  description: string;
  roadmapStages: TemplateStage[];
  marketingItems: TemplateMarketingItem[];
};

const STANDARD_STAGES: TemplateStage[] = [
  "Preparation",
  "Photography",
  "Pre-Marketing",
  "Launch",
  "Exposure",
  "Engagement",
  "Market Review",
  "Offer Stage",
  "Under Contract",
  "Closing",
].map((name, i) => ({ name, order: i }));

export const TEMPLATES: Template[] = [
  {
    id: "standard",
    name: "Standard Listing",
    description: "A balanced roadmap and marketing mix that works for most homes.",
    roadmapStages: STANDARD_STAGES,
    marketingItems: [
      { type: "MLS", objective: "List on MLS with professional photos and compelling description", reasoning: "The MLS feeds nearly every major real estate site, so this is the foundation of buyer exposure." },
      { type: "SOCIAL", objective: "Share listing across agent and brokerage social channels", reasoning: "Extends reach beyond MLS syndication to the agent's personal network of buyers and agents." },
      { type: "OPEN_HOUSE", objective: "Host an opening weekend open house", reasoning: "Creates urgency and lets serious buyers experience the home in person early." },
      { type: "REVERSE_PROSPECTING", objective: "Notify agents with matching buyer searches", reasoning: "Directly reaches agents whose clients are actively looking for a home like this one." },
    ],
  },
  {
    id: "luxury",
    name: "Luxury Listing",
    description: "Heavier emphasis on photography, video, private showings, and press.",
    roadmapStages: STANDARD_STAGES,
    marketingItems: [
      { type: "VIDEO", objective: "Produce a cinematic property video and aerial drone footage", reasoning: "Luxury buyers expect a premium first impression — video sets the tone before they ever visit." },
      { type: "MLS", objective: "List on MLS with a narrative-driven description and full photo set", reasoning: "Establishes the home's story and positioning across all syndicated sites." },
      { type: "SOCIAL", objective: "Run a targeted social campaign featuring video and lifestyle content", reasoning: "Builds buzz with affluent buyers who discover homes through curated content." },
      { type: "OUTREACH", objective: "Personal outreach to top local luxury agents for private previews", reasoning: "Many luxury buyers transact off-market or before public launch — private previews surface them early." },
      { type: "OTHER", objective: "Pitch to local press and real estate publications", reasoning: "Press coverage extends reach and reinforces the home's prestige positioning." },
    ],
  },
  {
    id: "fast-sale",
    name: "Fast Sale",
    description: "A compressed timeline with an aggressive pricing strategy and open-house-heavy push.",
    roadmapStages: STANDARD_STAGES,
    marketingItems: [
      { type: "MLS", objective: "List on MLS at a competitive, attention-grabbing price", reasoning: "Pricing slightly below market creates immediate demand and multiple-offer potential." },
      { type: "OPEN_HOUSE", objective: "Host open houses on both the first weekend and the following weekend", reasoning: "Maximizes foot traffic during the highest-interest window right after launch." },
      { type: "SOCIAL", objective: "Run a short, high-frequency social ad push in week one", reasoning: "Concentrated visibility in the first days drives the urgency needed for a fast sale." },
      { type: "REVERSE_PROSPECTING", objective: "Send same-day reverse prospecting notices at launch", reasoning: "Gets the listing in front of ready buyers immediately, before it has time to sit." },
    ],
  },
  {
    id: "new-construction",
    name: "New Construction",
    description: "Builder-focused milestones with fewer open houses and more digital/reverse prospecting.",
    roadmapStages: STANDARD_STAGES,
    marketingItems: [
      { type: "MLS", objective: "List on MLS highlighting builder, finishes, and completion timeline", reasoning: "Buyers of new construction care about specs and timeline as much as the finished product." },
      { type: "VIDEO", objective: "Create a walkthrough video of the model or floor plan", reasoning: "Helps buyers visualize the finished home when it isn't move-in ready yet." },
      { type: "REVERSE_PROSPECTING", objective: "Targeted reverse prospecting to agents with new-construction buyers", reasoning: "New construction appeals to a specific buyer segment best reached directly." },
      { type: "OUTREACH", objective: "Coordinate with builder on co-marketing and broker previews", reasoning: "Aligning with the builder's marketing multiplies reach and credibility." },
    ],
  },
];

export function getTemplate(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
