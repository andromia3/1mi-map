import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ 
    status: "ok", 
    auth: "supabase",
    timestamp: new Date().toISOString(),
    message: "This is a Supabase-only app with no Prisma"
  });
}
