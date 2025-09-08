const isProd = process.env.NODE_ENV === 'production';

function read(name: string): string | undefined {
  const v = process.env[name];
  return (v && String(v).trim().length) ? v : undefined;
}

export function getEnv() {
  const SUPABASE_URL = read('NEXT_PUBLIC_SUPABASE_URL');
  const SUPABASE_ANON_KEY = read('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  const MAPBOX_TOKEN = read('NEXT_PUBLIC_MAPBOX_TOKEN') || read('MAPBOX_TOKEN');

  if (!isProd) {
    const missing: string[] = [];
    if (!SUPABASE_URL) missing.push('NEXT_PUBLIC_SUPABASE_URL');
    if (!SUPABASE_ANON_KEY) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    if (!MAPBOX_TOKEN) missing.push('NEXT_PUBLIC_MAPBOX_TOKEN or MAPBOX_TOKEN');
    if (missing.length) {
      const msg = `[env] Missing required keys: ${missing.join(', ')}. Create .env.local and set them.`;
      // Throw once at startup paths; callers can catch if needed
      throw new Error(msg);
    }
  }

  return { SUPABASE_URL, SUPABASE_ANON_KEY, MAPBOX_TOKEN } as {
    SUPABASE_URL: string | undefined;
    SUPABASE_ANON_KEY: string | undefined;
    MAPBOX_TOKEN: string | undefined;
  };
}


