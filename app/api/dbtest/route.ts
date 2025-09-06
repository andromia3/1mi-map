export const runtime = "nodejs";
import { prisma } from "@/lib/prisma";
export async function GET() {
  try {
    const rows = await prisma.$queryRaw`SELECT current_user, current_database()`;
    return Response.json({ ok: true, rows });
  } catch (e: any) {
    console.error("DBTEST_FAIL", e?.message);
    return Response.json({ ok: false, error: e?.message }, { status: 500 });
  }
}
