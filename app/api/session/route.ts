import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/lib/supabase/types";

export const runtime = "nodejs";

export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    const { data: { session }, error } = await supabase.auth.getSession();
    return new Response(
      JSON.stringify({ hasSession: Boolean(session), email: session?.user?.email ?? null, error: error?.message ?? null, ts: Date.now() }),
      { headers: { "content-type": "application/json" }, status: 200 }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ hasSession: false, error: String(err) }),
      { headers: { "content-type": "application/json" }, status: 500 }
    );
  }
}


