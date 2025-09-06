export const runtime = "nodejs";
import { verifyDatabase } from "@/scripts/verify-db";

export async function GET() {
  try {
    const result = await verifyDatabase();
    return Response.json(result, { status: result.ok ? 200 : 500 });
  } catch (e: any) {
    console.error("DBTEST_FAIL", e?.message);
    return Response.json({ 
      ok: false, 
      error: e?.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
