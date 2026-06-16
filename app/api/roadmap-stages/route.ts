import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function assertOwnership(propertyId: string, userId: string) {
  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  return property && property.agentId === userId ? property : null;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { propertyId, name } = await req.json();
  if (!propertyId || !name) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  if (!(await assertOwnership(propertyId, userId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const count = await prisma.roadmapStage.count({ where: { propertyId } });

  const stage = await prisma.roadmapStage.create({
    data: { propertyId, name, order: count, status: "UPCOMING" },
  });

  return NextResponse.json(stage);
}
