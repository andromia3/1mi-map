export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let username = (body?.username ?? "").trim();
    const password = (body?.password ?? "").toString();

    if (!username || !password) {
      return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
    }

    // If you want usernames case-insensitive, normalize here:
    // username = username.toLowerCase();

    const user = await prisma.user.findUnique({ where: { username } });

    if (!user) {
      console.error("LOGIN_NO_USER", { username });
      return NextResponse.json({ error: "NO_USER" }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      console.error("LOGIN_BAD_PASSWORD", { username });
      return NextResponse.json({ error: "BAD_PASSWORD" }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set("oneMi_session", JSON.stringify({ userId: user.id }), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (e) {
    console.error("LOGIN_FAIL", e);
    return NextResponse.json({ error: "LOGIN_FAIL" }, { status: 500 });
  }
}