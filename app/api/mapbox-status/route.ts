export const runtime = "nodejs";

export async function GET() {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || process.env.MAPBOX_TOKEN;
  const hasToken = Boolean(token);
  const prefix = token ? String(token).slice(0, 12) : null;
  return new Response(JSON.stringify({ hasToken, prefix }), {
    headers: { "content-type": "application/json" },
    status: 200,
  });
}


