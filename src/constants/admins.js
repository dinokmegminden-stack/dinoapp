// Az üzenőfal moderátorai. Mivel az appban nincs auth (csak becenév), a
// moderáció becenév-alapú, kliensoldali kapuval: az itt felsorolt becenevekkel
// belépve látszanak a moderációs gombok (üzenet elrejtése/visszaállítása).
//
// FONTOS biztonsági korlát: auth híján ez NEM kriptográfiailag védett — a
// tényleges Supabase RLS az anon kulccsal mindenkinek engedi a műveletet, a
// gomb csak a UI-ban van elrejtve. Komoly moderációhoz Supabase Auth + admin
// szerep kell (lásd README/roadmap). Kisiskolás-közönségnél ez a szint elég.
export const ADMIN_NICKNAMES = [
  'baryonyx_andrewsi_86', // tulajdonos / moderátor
];

export function isAdminNickname(nickname) {
  return !!nickname && ADMIN_NICKNAMES.includes(nickname);
}
