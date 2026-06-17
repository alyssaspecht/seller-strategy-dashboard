import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { prisma } = await import("@/lib/prisma");
    const count = await prisma.user.count();
    return NextResponse.json({ ok: true, userCount: count });
  } catch (e: unknown) {
    const err = e as Error;
    return NextResponse.json({
      ok: false,
      error: err.message,
      name: err.name,
      stack: err.stack?.slice(0, 800),
    }, { status: 500 });
  }
}
