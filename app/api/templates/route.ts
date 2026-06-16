import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const templates = await prisma.template.findMany({
    where: { agentId: userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(templates);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, propertyId } = body;

  if (!name || !propertyId) {
    return NextResponse.json({ error: "name and propertyId are required" }, { status: 400 });
  }

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    include: {
      roadmapStages: { orderBy: { order: "asc" } },
      marketingItems: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!property || property.agentId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const template = await prisma.template.create({
    data: {
      agentId: userId,
      name,
      roadmapStages: property.roadmapStages.map((s) => ({ name: s.name, order: s.order })),
      marketingItems: property.marketingItems.map((m) => ({
        type: m.type,
        objective: m.objective,
        reasoning: m.reasoning ?? "",
      })),
    },
  });

  return NextResponse.json(template);
}
