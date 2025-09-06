import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Health check failed:", error)
    return NextResponse.json(
      { ok: false, error: "DB_FAIL" },
      { status: 500 }
    )
  }
}
