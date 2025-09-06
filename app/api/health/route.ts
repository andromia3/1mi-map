export const runtime = "nodejs";
import { prisma } from "@/lib/prisma";
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ ok: true });
  } catch (e: any) {
    console.error("HEALTH_FAIL", e?.message);
    return Response.json({ ok: false, error: "DB_FAIL" }, { status: 500 });
  }
}