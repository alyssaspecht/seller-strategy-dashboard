import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { propertyId, label, value, date, note } = body;

  if (!propertyId || !label || value === undefined || value === null) {
    return NextResponse.json({ error: "propertyId, label, and value are required" }, { status: 400 });
  }

  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property || property.agentId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const stat = await prisma.performanceStat.create({
    data: {
      propertyId,
      label,
      value: Number(value),
      date: date ? new Date(date) : undefined,
      note: note || null,
    },
  });

  return NextResponse.json(stat);
}
