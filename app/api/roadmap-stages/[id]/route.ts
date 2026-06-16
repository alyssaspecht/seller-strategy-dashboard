import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function loadOwnedStage(id: string, userId: string) {
  const stage = await prisma.roadmapStage.findUnique({ where: { id }, include: { property: true } });
  if (!stage || stage.property.agentId !== userId) return null;
  return stage;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!(await loadOwnedStage(id, userId))) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const data: { name?: string; status?: "COMPLETED" | "ACTIVE" | "UPCOMING"; order?: number } = {};
  if (typeof body.name === "string") data.name = body.name;
  if (["COMPLETED", "ACTIVE", "UPCOMING"].includes(body.status)) data.status = body.status;
  if (typeof body.order === "number") data.order = body.order;

  const stage = await prisma.roadmapStage.update({ where: { id }, data });
  return NextResponse.json(stage);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!(await loadOwnedStage(id, userId))) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.roadmapStage.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
