// RegionPackIndicator.js
// Kis kör-ikon sor egy régió pakkjainak állapotához (kész / nyitott / lezárt).
// A főképernyő régió-gombjai alá illeszthető, pl.:
//
//   <View style={styles.bigBtnEu}>
//     ...meglévő régió-gomb tartalom...
//     <RegionPackIndicator regionId="karpat_medence" progress={progress} />
//   </View>

import { View, Text, StyleSheet } from 'react-native';
import { REGION_PACKS, isPackUnlocked } from './regionProgress';

// Egy állapot háromféle lehet:
//  - done:    quizPassed === true            -> zöld pajzs / csillag
//  - open:    feloldva, de még nincs teljesítve -> üres, kattintható kör
//  - locked:  még nincs feloldva               -> szürke lakat
function getPackState(regionId, packId, progress) {
  const entry = progress?.[regionId]?.[packId];
  if (entry?.quizPassed) return 'done';
  if (isPackUnlocked(regionId, packId, progress)) return 'open';
  return 'locked';
}

const STATE_STYLE = {
  done: { backgroundColor: '#639922', borderColor: '#8DA34D', icon: '★' },
  open: { backgroundColor: 'rgba(254,250,224,0.08)', borderColor: 'rgba(254,250,224,0.35)', icon: '' },
  locked: { backgroundColor: 'rgba(0,0,0,0.35)', borderColor: 'rgba(254,250,224,0.12)', icon: '🔒' },
};

export default function RegionPackIndicator({ regionId, progress, size = 18 }) {
  const packs = REGION_PACKS[regionId] || [];
  if (!progress) return null;

  return (
    <View style={styles.row}>
      {packs.map((packId) => {
        const state = getPackState(regionId, packId, progress);
        const s = STATE_STYLE[state];
        return (
          <View
            key={packId}
            style={[
              styles.dot,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: s.backgroundColor,
                borderColor: s.borderColor,
              },
            ]}
          >
            {!!s.icon && <Text style={{ fontSize: size * 0.55 }}>{s.icon}</Text>}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 4, marginTop: 6, alignItems: 'center' },
  dot: { borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
