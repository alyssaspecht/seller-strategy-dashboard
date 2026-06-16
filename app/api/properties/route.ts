import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTemplate } from "@/lib/templates";
import type { MarketingItemType } from "@prisma/client";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  type StrategyShape = { roadmapStages: { name: string; order: number }[]; marketingItems: { type: string; objective: string; reasoning: string }[]; [key: string]: unknown };
  const body = await req.json();
  const { address, price, sellerName, sellerGoals, homeStyle, occupancyStatus, condition, propertyFeatures, templateId, savedTemplateId, aiStrategy } = body as {
    address: string; price?: string; sellerName?: string; sellerGoals?: string;
    homeStyle?: string; occupancyStatus?: string; condition?: string; propertyFeatures?: string;
    templateId?: string; savedTemplateId?: string; aiStrategy?: StrategyShape;
  };

  if (!address) return NextResponse.json({ error: "Address is required" }, { status: 400 });

  // Load from saved DB template if provided
  let savedTemplate: { roadmapStages: { name: string; order: number }[]; marketingItems: { type: string; objective: string; reasoning: string }[] } | undefined;
  if (savedTemplateId) {
    const dbTemplate = await prisma.template.findFirst({ where: { id: savedTemplateId, agentId: userId } });
    if (dbTemplate) {
      savedTemplate = {
        roadmapStages: dbTemplate.roadmapStages as { name: string; order: number }[],
        marketingItems: dbTemplate.marketingItems as { type: string; objective: string; reasoning: string }[],
      };
    }
  }

  // AI-generated strategy takes priority over templates
  const template = aiStrategy ?? savedTemplate ?? (templateId ? getTemplate(templateId) : undefined);

  // Extract strategyBrief (everything except roadmapStages and marketingItems)
  let strategyBrief: Record<string, unknown> | undefined;
  if (aiStrategy) {
    const { roadmapStages: _r, marketingItems: _m, ...brief } = aiStrategy;
    strategyBrief = brief;
  }

  const property = await prisma.property.create({
    data: {
      agentId: userId,
      address,
      price: price ? Number(price) : null,
      sellerName: sellerName || null,
      sellerGoals: sellerGoals || null,
      homeStyle: homeStyle || null,
      occupancyStatus: occupancyStatus || null,
      condition: condition || null,
      propertyFeatures: propertyFeatures || null,
      strategyBrief: strategyBrief ? (strategyBrief as import("@prisma/client").Prisma.InputJsonValue) : undefined,
      templateSource: aiStrategy ? "ai" : savedTemplateId ?? (templateId && !savedTemplate ? templateId : null),
      visibility: { create: {} },
      roadmapStages: template
        ? {
            create: template.roadmapStages.map((s) => ({
              name: s.name,
              order: s.order,
              status: "UPCOMING",
            })),
          }
        : undefined,
      marketingItems: template
        ? {
            create: template.marketingItems.map((m) => ({
              type: m.type as MarketingItemType,
              objective: m.objective,
              reasoning: m.reasoning,
              status: "Planned",
            })),
          }
        : undefined,
    },
  });

  return NextResponse.json({ id: property.id });
}
