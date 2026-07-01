export function groupByPackage(list) {
  const map = {};
  list.forEach((d) => {
    const key = d.csomag || 1;
    if (!map[key]) map[key] = [];
    map[key].push(d);
  });
  return Object.keys(map)
    .map(Number)
    .sort((a, b) => a - b)
    .map((csomag) => ({ csomag, dinos: map[csomag] }));
}

export function getRegionKeyFromEdu(eduLevel) {
  return { 1: 'karpat', 2: 'europa', 3: 'afrika', 4: 'azsia', 5: 'amerika' }[eduLevel];
}

export function csomagToPackId(eduLevel, csomag, REGION_PACKS) {
  const rKey = getRegionKeyFromEdu(eduLevel);
  return REGION_PACKS[rKey]?.[csomag - 1];
}
