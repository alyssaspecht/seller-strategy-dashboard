import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import StrategyEditor from "@/components/StrategyEditor";

export default async function PropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;

  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      roadmapStages: { orderBy: { order: "asc" } },
      marketingItems: { orderBy: { createdAt: "asc" } },
      performanceStats: { orderBy: [{ date: "desc" }, { createdAt: "desc" }] },
      visibility: true,
    },
  });

  if (!property || property.agentId !== userId) notFound();

  return <StrategyEditor property={property} />;
}
