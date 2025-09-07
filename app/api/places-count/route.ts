import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/lib/supabase/types";

export const runtime = "nodejs";

export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    const { count, error } = await supabase.from("places").select("*", { count: "exact", head: true });
    if (error) {
      return new Response(JSON.stringify({ ok: false, error: error.message }), {
        headers: { "content-type": "application/json" },
        status: 500,
      });
    }
    return new Response(JSON.stringify({ ok: true, count: count ?? 0 }), {
      headers: { "content-type": "application/json" },
      status: 200,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      headers: { "content-type": "application/json" },
      status: 500,
    });
  }
}


