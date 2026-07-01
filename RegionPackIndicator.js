// RegionPackIndicator.js
// Kis kör-ikon sor egy régió pakkjainak állapotához (kész / nyitott / lezárt).
// Props: eduLevel (int, 1–5) és progress objektum.
//
// Használat:
//   <RegionPackIndicator eduLevel={1} progress={progress} />
//   <RegionPackIndicator eduLevel={4} progress={progress} />

import { View, Text, StyleSheet } from 'react-native';
import { REGION_PACKS, isPackUnlocked } from './regionProgress';

// Állapot háromféle:
//  done:   quizPassed === true          → zöld csillag
//  open:   feloldva, még nem teljesítve → üres kör
//  locked: még nincs feloldva           → szürke lakat
function getPackState(eduLevel, packNumber, progress) {
  const entry = progress?.[eduLevel]?.[packNumber];
  if (entry?.quizPassed) return 'done';
  if (isPackUnlocked(eduLevel, packNumber, progress)) return 'open';
  return 'locked';
}

const STATE_STYLE = {
  done:   { backgroundColor: '#639922',                    borderColor: '#8DA34D',                   icon: '★' },
  open:   { backgroundColor: 'rgba(254,250,224,0.08)',     borderColor: 'rgba(254,250,224,0.35)',    icon: ''  },
  locked: { backgroundColor: 'rgba(0,0,0,0.35)',           borderColor: 'rgba(254,250,224,0.12)',    icon: '🔒' },
};

export default function RegionPackIndicator({ eduLevel, progress, size = 18 }) {
  const packs = REGION_PACKS[eduLevel] || [];
  if (!progress) return null;

  return (
    <View style={styles.row}>
      {packs.map((packNumber) => {
        const state = getPackState(eduLevel, packNumber, progress);
        const s = STATE_STYLE[state];
        return (
          <View
            key={packNumber}
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
