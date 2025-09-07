import { NextRequest, NextResponse } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

let hasLoggedProfileCheckError = false;

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

  // E2E bypass for visual tests
  if (url.searchParams.get("__e2e") === "1") {
    return res;
  }

  const isProtected = url.pathname === "/map" || url.pathname.startsWith("/map/");

  if (isProtected && !session) {
    const login = new URL("/login", url.origin);
    login.searchParams.set("redirect", url.pathname);
    return NextResponse.redirect(login);
  }

  // Fail-open profile completeness check: redirect only when explicitly incomplete
  if (isProtected && session) {
    try {
      const { data, error } = await supabase.rpc("profile_is_complete");
      if (error) throw error;
      const complete = typeof data === "boolean" ? data : Boolean((data as any)?.complete);
      if (!complete) {
        const onboarding = new URL("/onboarding", url.origin);
        onboarding.searchParams.set("redirect", url.pathname);
        return NextResponse.redirect(onboarding);
      }
    } catch (e) {
      if (!hasLoggedProfileCheckError && process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.warn("[middleware] profile_is_complete failed; allowing request", e);
        hasLoggedProfileCheckError = true;
      }
      // Allow request to proceed on error
      return res;
    }
  }

  return res;
}
