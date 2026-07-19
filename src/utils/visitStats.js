// visitStats.js — a `game_events` sorok started_at időbélyegeiből származtatott
// "melyik napokon látogatott el a játékos" és "hány napos a szériája" logika.
// Tisztán függvények (nincs Supabase-hívás itt, azt lásd gameEventsService.js
// getVisitDates()-jét) — a helyi (eszköz) időzóna szerinti naptári napot
// használjuk, nem UTC-t, hogy a "ma"/"tegnap" a játékos szemszögéből legyen helyes.

export function toDateKey(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// A szériát a mai naptól (vagy ha ma még nem járt itt, a tegnapi naptól)
// visszafelé számolja, amíg megszakítás nélküli napokat talál — így a széria
// nem nullázódik le csak azért, mert a mai nap még nem ért véget.
export function computeStreak(dateKeys) {
  if (!dateKeys || dateKeys.length === 0) return 0;
  const daySet = new Set(dateKeys);

  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  if (!daySet.has(toDateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!daySet.has(toDateKey(cursor))) return 0;
  }

  let streak = 0;
  while (daySet.has(toDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
