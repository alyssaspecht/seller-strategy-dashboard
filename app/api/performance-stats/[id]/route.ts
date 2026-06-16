import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function assertOwner(id: string, userId: string) {
  const stat = await prisma.performanceStat.findUnique({ where: { id }, include: { property: true } });
  if (!stat || stat.property.agentId !== userId) return null;
  return stat;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await assertOwner(id, userId);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const data: Record<string, string | number | Date | null> = {};
  if (typeof body.label === "string") data.label = body.label;
  if (body.value !== undefined) data.value = Number(body.value);
  if (body.date) data.date = new Date(body.date);
  if ("note" in body) data.note = body.note || null;

  const updated = await prisma.performanceStat.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await assertOwner(id, userId);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.performanceStat.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
