import { createClient } from '@supabase/supabase-js';

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
  const service = process.env.SUPABASE_SERVICE_ROLE as string | undefined;
  const expectedRef = process.env.SEED_PROJECT_REF as string | undefined;
  const seedUser = process.env.SEED_USER_ID as string | undefined; // auth.users(id)

  if (!url || !service) {
    console.error('[seed] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE');
    process.exit(1);
  }
  const host = new URL(url).host; // <ref>.supabase.co
  const projectRef = host.split('.')[0];
  if (!expectedRef || expectedRef !== projectRef) {
    console.error(`[seed] Ref mismatch or missing. Got ref=${projectRef}, expected SEED_PROJECT_REF=${expectedRef}. Aborting.`);
    process.exit(1);
  }
  if (!seedUser) {
    console.error('[seed] SEED_USER_ID (auth.users.id) is required to set created_by. Aborting.');
    process.exit(1);
  }

  const supabase = createClient(url, service, { auth: { persistSession: false } });

  // Places around central London
  const places = [
    { title: 'Somerset House', description: 'Courtyard and river walk', lat: 51.5111, lng: -0.1172 },
    { title: 'Coal Drops Yard', description: 'Shops and canal path', lat: 51.5343, lng: -0.1255 },
    { title: 'Borough Market', description: 'Great food stalls', lat: 51.5054, lng: -0.0911 },
    { title: 'St James’s Park', description: 'Calm walk by the lake', lat: 51.5026, lng: -0.1392 },
  ];

  console.log('[seed] Inserting demo places…');
  const { error: placesErr } = await supabase.from('places').insert(
    places.map((p) => ({ ...p, created_by: seedUser })) as any
  );
  if (placesErr) console.warn('[seed] places insert error:', placesErr.message);
  else console.log('[seed] places ok');

  // Meetup today + 2h
  const startsMeetup = new Date(Date.now() + 2 * 60 * 60 * 1000);
  const endsMeetup = new Date(startsMeetup.getTime() + 2 * 60 * 60 * 1000);
  const meetup = {
    title: 'Coffee & Walk', description: 'Morning meetup by the river',
    lat: 51.5079, lng: -0.0994, visibility: 'members',
    starts_at: startsMeetup.toISOString(), ends_at: endsMeetup.toISOString(), created_by: seedUser,
  } as any;
  try {
    const { error } = await supabase.from('meetups').insert(meetup);
    if (error) console.warn('[seed] meetups skipped:', error.message); else console.log('[seed] meetups ok');
  } catch (e: any) { console.warn('[seed] meetups skipped:', e?.message); }

  // Event tomorrow
  const startsEvent = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const endsEvent = new Date(startsEvent.getTime() + 3 * 60 * 60 * 1000);
  const event = {
    title: 'Evening Social', description: 'Drinks near the Thames',
    lat: 51.5076, lng: -0.1246, visibility: 'members',
    starts_at: startsEvent.toISOString(), ends_at: endsEvent.toISOString(), created_by: seedUser,
  } as any;
  try {
    const { error } = await supabase.from('events').insert(event);
    if (error) console.warn('[seed] events skipped:', error.message); else console.log('[seed] events ok');
  } catch (e: any) { console.warn('[seed] events skipped:', e?.message); }

  console.log('[seed] Done.');
}

main().catch((e) => { console.error('[seed] fatal:', e); process.exit(1); });


