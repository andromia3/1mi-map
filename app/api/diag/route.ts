export const runtime = "nodejs";

export async function GET() {
  const hasUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const hasAnon = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  return new Response(JSON.stringify({ hasUrl, hasAnon }), {
    headers: { 'content-type': 'application/json' },
    status: 200,
  });
}


