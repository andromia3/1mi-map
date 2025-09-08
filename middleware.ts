import { NextRequest, NextResponse } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { log } from "@/src/lib/log";

let hasLoggedProfileCheckError = false;

export const config = { matcher: ["/((?!_next/|api/|login|signup|favicon|assets).*)"] };

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

  const isProtected = true;

  if (isProtected && !session) {
    const login = new URL("/login", url.origin);
    login.searchParams.set("redirect", url.pathname);
    return NextResponse.redirect(login);
  }

  // Fail-open profile completeness check in code (no DB RPC)
  if (isProtected && session) {
    // Never redirect away from onboarding itself, to avoid loops
    if (url.pathname.startsWith('/onboarding')) {
      return res;
    }
    // If client signaled onboarding completed just now, allow pass-through once
    if (req.cookies.get('onboarding_ok')?.value === '1' || url.searchParams.get('ok') === '1') {
      return res;
    }
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("display_name, city, timezone")
        .eq("id", session.user.id)
        .maybeSingle();
      if (error) throw error;
      const displayNameOk = typeof profile?.display_name === 'string' && profile.display_name.trim().length > 0;
      const cityOk = typeof profile?.city === 'string' && profile.city.trim().length > 0;
      const tzOk = typeof profile?.timezone === 'string' && profile.timezone.trim().length > 0;
      const complete = displayNameOk && cityOk && tzOk;
      if (!complete) {
        const onboarding = new URL("/onboarding", url.origin);
        onboarding.searchParams.set("redirect", url.pathname);
        return NextResponse.redirect(onboarding);
      }
    } catch (e) {
      if (!hasLoggedProfileCheckError && process.env.NODE_ENV !== "production") {
        log.warn("[middleware] profile completeness check failed; allowing request", e);
        hasLoggedProfileCheckError = true;
      }
      return res; // fail-open
    }
  }

  return res;
}
