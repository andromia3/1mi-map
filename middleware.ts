import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function middleware(req: Request) {
  const url = new URL(req.url);
  const protectedPaths = ["/map"];
  const isProtected = protectedPaths.some(p => url.pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  // Create a response we can pass cookies through
  const res = NextResponse.next();
  const supabase = supabaseServer();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    const redirectUrl = new URL("/login", url.origin);
    redirectUrl.searchParams.set("redirect", url.pathname);
    return NextResponse.redirect(redirectUrl);
  }
  return res;
}

export const config = { matcher: ["/map/:path*", "/map"] };
