import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function loadOwnedItem(id: string, userId: string) {
  const item = await prisma.marketingItem.findUnique({ where: { id }, include: { property: true } });
  if (!item || item.property.agentId !== userId) return null;
  return item;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!(await loadOwnedItem(id, userId))) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const data: Record<string, unknown> = {};
  for (const key of ["objective", "status", "reasoning", "results"] as const) {
    if (typeof body[key] === "string") data[key] = body[key];
  }
  if (typeof body.visibleToSeller === "boolean") data.visibleToSeller = body.visibleToSeller;
  if (typeof body.type === "string") data.type = body.type;

  const item = await prisma.marketingItem.update({ where: { id }, data });
  return NextResponse.json(item);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!(await loadOwnedItem(id, userId))) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.marketingItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
