export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const user = await prisma.user.findUnique({ where: { username: "vincent" } });
    if (!user) return NextResponse.json({ ok: false, error: "NO_VINCENT" }, { status: 404 });

    const matches = await bcrypt.compare("changeme1", user.passwordHash);
    return NextResponse.json({ ok: true, matches });
  } catch (e: any) {
    console.error("DEBUG_HASH_FAIL", e?.message);
    return NextResponse.json({ ok: false, error: e?.message ?? "FAIL" }, { status: 500 });
  }
}
