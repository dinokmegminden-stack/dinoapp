import { supabase } from './supabaseClient';

export const MESSAGE_MAX_LEN = 300;

// Üzenőfal — a landing bal sávjában. Nyilvános, becenév alapú (nincs auth).
// A `messages` táblán publikus SELECT + INSERT policy kell (lásd setup SQL).

export async function fetchMessages(limit = 40, { includeHidden = false } = {}) {
  let q = supabase
    .from('messages')
    .select('id, nickname, body, created_at, is_hidden')
    .order('created_at', { ascending: false })
    .limit(limit);
  // Nem-admin nézet: a rejtett üzeneteket kliensoldalon is kiszűrjük.
  if (!includeHidden) q = q.eq('is_hidden', false);

  const { data, error } = await q;
  if (error) {
    console.warn('Supabase hiba (messages fetch):', error);
    return [];
  }
  return data || [];
}

// Moderáció: üzenet elrejtése/visszaállítása (puha, visszafordítható). Csak a
// kliensoldali admin-kapu mögül hívjuk (lásd constants/admins.js korlát).
export async function setMessageHidden(id, hidden) {
  const { error } = await supabase
    .from('messages')
    .update({ is_hidden: hidden })
    .eq('id', id);
  if (error) {
    console.warn('Supabase hiba (messages moderate):', error);
    return { error };
  }
  return { ok: true };
}

// Új üzenet beküldése. Üres/hosszú szöveget kliensoldalon is levágunk/tiltunk;
// a DB check-constraint a végső védvonal. Sikeres beszúrásnál a beszúrt sort adja.
export async function postMessage(nickname, body) {
  const trimmed = String(body || '').trim().slice(0, MESSAGE_MAX_LEN);
  if (!trimmed) return { error: 'empty' };

  const { data, error } = await supabase
    .from('messages')
    .insert({ nickname: nickname || 'Névtelen', body: trimmed })
    .select('id, nickname, body, created_at')
    .single();

  if (error) {
    console.warn('Supabase hiba (messages insert):', error);
    return { error };
  }
  return { data };
}
