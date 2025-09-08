/*
  Dev-only seed script. Inserts demo places (and optional meetup/event) into your Supabase project.
  SAFEGUARDS:
  - Requires SUPABASE_SERVICE_ROLE and NEXT_PUBLIC_SUPABASE_URL
  - Requires SEED_PROJECT_REF to match the URL project ref
  - Intended for local/dev only; never run against prod
*/

const { createClient } = require('@supabase/supabase-js');

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE;
  const expectedRef = process.env.SEED_PROJECT_REF;
  const seedUser = process.env.SEED_USER_ID; // auth.users(id) to attribute created_by

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
    console.error('[seed] SEED_USER_ID (auth.users.id) is required to populate created_by. Aborting.');
    process.exit(1);
  }

  const supabase = createClient(url, service, { auth: { persistSession: false } });

  const places = [
    { title: 'Somerset House', description: 'Courtyard and river walk', lat: 51.5111, lng: -0.1172 },
    { title: 'Coal Drops Yard', description: 'Shops and canal path', lat: 51.5343, lng: -0.1255 },
    { title: 'Borough Market', description: 'Great food stalls', lat: 51.5054, lng: -0.0911 },
  ];

  console.log('[seed] Inserting demo places…');
  const { error: placesErr } = await supabase.from('places').insert(
    places.map((p) => ({ ...p, created_by: seedUser }))
  );
  if (placesErr) console.warn('[seed] places insert error:', placesErr.message);
  else console.log('[seed] places ok');

  // Optional: meetups
  const meetup = {
    title: 'Coffee & Walk', description: 'Morning meetup by the river',
    lat: 51.5079, lng: -0.0994, visibility: 'members', starts_at: new Date().toISOString(), ends_at: new Date(Date.now()+2*60*60*1000).toISOString(), created_by: seedUser,
  };
  try {
    const { error } = await supabase.from('meetups').insert(meetup);
    if (error) console.warn('[seed] meetups skipped:', error.message); else console.log('[seed] meetups ok');
  } catch (e) { console.warn('[seed] meetups skipped:', e.message); }

  // Optional: events
  const event = {
    title: 'Evening Social', description: 'Drinks near the Thames',
    lat: 51.5076, lng: -0.1246, visibility: 'members', starts_at: new Date().toISOString(), ends_at: new Date(Date.now()+3*60*60*1000).toISOString(), created_by: seedUser,
  };
  try {
    const { error } = await supabase.from('events').insert(event);
    if (error) console.warn('[seed] events skipped:', error.message); else console.log('[seed] events ok');
  } catch (e) { console.warn('[seed] events skipped:', e.message); }

  console.log('[seed] Done.');
}

main().catch((e) => { console.error('[seed] fatal:', e); process.exit(1); });


