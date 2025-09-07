import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

async function signIn(email: string, password: string) {
  const supabase = createClient(url, anon);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return createClient(url, anon, { global: { headers: { Authorization: `Bearer ${data.session?.access_token}` } } });
}

describe('RLS self-only policies', () => {
  it('prevents updating other users settings', async () => {
    // Requires two test users in the project with known credentials
    const a = await signIn('test+a@example.com', 'password');
    const b = await signIn('test+b@example.com', 'password');

    // Read b's id
    const { data: bProfile } = await b.from('profiles').select('id').limit(1).maybeSingle();
    expect(bProfile?.id).toBeTruthy();

    // From A, attempt to update settings for B
    const { error } = await a.from('user_settings').update({ settings: { map: { style_key: 'night' } } } as any).eq('user_id', bProfile!.id);
    expect(error).toBeTruthy();
  });
});


