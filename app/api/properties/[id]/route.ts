import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const property = await prisma.property.findUnique({ where: { id } });
  if (!property || property.agentId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const data: Record<string, unknown> = {};

  if (typeof body.address === "string") data.address = body.address;
  if ("price" in body) data.price = body.price === "" || body.price === null ? null : Number(body.price);
  if ("sellerName" in body) data.sellerName = body.sellerName || null;
  if ("sellerGoals" in body) data.sellerGoals = body.sellerGoals || null;
  if ("homeStyle" in body) data.homeStyle = body.homeStyle || null;
  if ("occupancyStatus" in body) data.occupancyStatus = body.occupancyStatus || null;
  if ("condition" in body) data.condition = body.condition || null;
  if ("propertyFeatures" in body) data.propertyFeatures = body.propertyFeatures || null;
  if ("strategyBrief" in body) data.strategyBrief = body.strategyBrief;

  const updated = await prisma.property.update({ where: { id }, data });

  return NextResponse.json(updated);
}
