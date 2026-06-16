import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { propertyId, type, objective, status, reasoning } = await req.json();
  if (!propertyId || !type || !objective) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property || property.agentId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const item = await prisma.marketingItem.create({
    data: {
      propertyId,
      type,
      objective,
      status: status || "Planned",
      reasoning: reasoning || null,
    },
  });

  return NextResponse.json(item);
}
