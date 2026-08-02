// register-player — a nickname-regisztrációt szerver oldalra tolja, hogy
// IP-alapú limitet lehessen rá tenni (max 5 regisztráció / IP). A kliens
// (playersService.js registerPlayer()) mostantól ezt hívja a közvetlen
// `players` tábla-INSERT helyett — a service role key itt bypassolja az RLS-t,
// a `players` táblán az anon INSERT policy-t emiatt törölni kell (lásd
// data/sqls/create_registration_attempts_table.sql), különben a bot
// megkerülné a limitet közvetlen INSERT-tel.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const MAX_REGISTRATIONS_PER_IP = 5;

// Webes kliens (Expo web, más origin) hívja — CORS preflight (OPTIONS) és a
// tényleges válasz fejlécei nélkül a böngésző "Failed to fetch"-csel elnyeli
// a hívást, mielőtt a válasz teste egyáltalán eljutna a hívóhoz.
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405);
  }

  let body: { nickname?: string; pin?: string; email?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  const { nickname, pin } = body;
  if (!nickname || !pin) {
    return json({ error: 'missing_fields' }, 400);
  }

  // Opcionális mező — üresen hagyható, nincs rajta formátum-kényszer a
  // szerveren (a kliens oldali TextInput keyboardType="email-address" segít
  // elgépelés ellen, de ez nem validáció).
  const email = typeof body.email === 'string' ? body.email.trim() || null : null;

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
    return json({ error: 'count_failed' }, 500);
  }

  if ((count || 0) >= MAX_REGISTRATIONS_PER_IP) {
    return json({ error: 'too_many_registrations' }, 429);
  }

  const { data, error } = await supabase
    .from('players')
    .insert({ nickname, pin, email })
    .select('id, nickname, created_at')
    .single();

  if (error) {
    if (error.code === '23505') {
      return json({ taken: true }, 200);
    }
    return json({ error: 'insert_failed' }, 500);
  }

  await supabase.from('registration_attempts').insert({ ip });

  return json({ success: true, player: data }, 200);
});
