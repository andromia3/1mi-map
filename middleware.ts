import { NextRequest, NextResponse } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export const config = { matcher: ["/map", "/map/:path*"] };

export async function middleware(req: NextRequest) {
  const url = new URL(req.url);
  const res = NextResponse.next({ request: { headers: req.headers } });

  const supabase = createMiddlewareClient(
    { req, res },
    {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const isProtected = url.pathname === "/map" || url.pathname.startsWith("/map/");

  if (isProtected && !session) {
    const login = new URL("/login", url.origin);
    login.searchParams.set("redirect", url.pathname);
    return NextResponse.redirect(login);
  }

  return res;
}
