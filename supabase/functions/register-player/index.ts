// register-player — a nickname-regisztrációt szerver oldalra tolja, hogy
// IP-alapú limitet lehessen rá tenni (max 5 regisztráció / IP). A kliens
// (playersService.js registerPlayer()) mostantól ezt hívja a közvetlen
// `players` tábla-INSERT helyett — a service role key itt bypassolja az RLS-t,
// a `players` táblán az anon INSERT policy-t emiatt törölni kell (lásd
// data/sqls/create_registration_attempts_table.sql), különben a bot
// megkerülné a limitet közvetlen INSERT-tel.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const MAX_REGISTRATIONS_PER_IP = 5;

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), { status: 405 });
  }

  let body: { nickname?: string; pin?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_json' }), { status: 400 });
  }

  const { nickname, pin } = body;
  if (!nickname || !pin) {
    return new Response(JSON.stringify({ error: 'missing_fields' }), { status: 400 });
  }

  // Supabase Edge Functions mögött a Kong gateway rakja be az x-forwarded-for
  // fejlécet — az első érték a tényleges kliens-IP, a többi a proxy-lánc.
  const forwardedFor = req.headers.get('x-forwarded-for') || '';
  const ip = forwardedFor.split(',')[0].trim() || 'unknown';

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { count, error: countError } = await supabase
    .from('registration_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('ip', ip);

  if (countError) {
    return new Response(JSON.stringify({ error: 'count_failed' }), { status: 500 });
  }

  if ((count || 0) >= MAX_REGISTRATIONS_PER_IP) {
    return new Response(JSON.stringify({ error: 'too_many_registrations' }), { status: 429 });
  }

  const { data, error } = await supabase
    .from('players')
    .insert({ nickname, pin })
    .select('id, nickname, created_at')
    .single();

  if (error) {
    if (error.code === '23505') {
      return new Response(JSON.stringify({ taken: true }), { status: 200 });
    }
    return new Response(JSON.stringify({ error: 'insert_failed' }), { status: 500 });
  }

  await supabase.from('registration_attempts').insert({ ip });

  return new Response(JSON.stringify({ success: true, player: data }), { status: 200 });
});
