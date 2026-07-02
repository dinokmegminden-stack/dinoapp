import { useState, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Animated,
  PanResponder,
  Dimensions,
  StatusBar,
  TouchableOpacity,
  Image,
} from 'react-native';
import dinosaurs from './data/dinosaurs.json';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

const COLORS = {
  bg: '#F5F3EE',
  card: '#FFFFFF',
  cardBehind: '#E8E4DC',
  border: '#DDD9D0',
  textPrimary: '#2C2C2A',
  textSecondary: '#888780',
  textMuted: '#B4B2A9',
  green: '#3B6D11',
  greenLight: '#C0DD97',
  greenBg: '#EAF3DE',
  blue: '#185FA5',
  blueBg: '#E6F1FB',
  blueLight: '#B5D4F4',
  coral: '#993C1D',
  coralBg: '#FAECE7',
  coralLight: '#F5C4B3',
  amber: '#854F0B',
  amberBg: '#FAEEDA',
  amberLight: '#FAC775',
};

const IMAGE_MAP = {
  "Iguanodon bernissartensis": require('./assets/images/Iguanodon2.jpg'),
  "Megalosaurus bucklandii": require('./assets/images/megalosaurus.jpeg'),
  "Baryonyx walkeri": require('./assets/images/baryonyx.jpg'),
  "Hypsilophodon foxii": require('./assets/images/hypsilophodon.jpg'),
  "Europasaurus holgeri": require('./assets/images/europasaurus.jpg'),
  "Plateosaurus engelhardti": require('./assets/images/plateosaurus.jpg'),
  "Cetiosaurus oxoniensis": require('./assets/images/cetiosaurus.jpg'),
  "Camptosaurus prestwichii": require('./assets/images/camptosaurus.jpg'),
  "Valdosaurus canaliculatus": require('./assets/images/valdosaurus.jpg'),
  "Mantellisaurus atherfieldensis": require('./assets/images/mantellisaurus.jpg'),
  "Neovenator salerii": require('./assets/images/Iguanodon2.jpg'),
  "Scipionyx samniticus": require('./assets/images/Iguanodon2.jpg'),
  "Draconyx loureiroi": require('./assets/images/Iguanodon2.jpg'),
  "Torvosaurus gurneyi": require('./assets/images/Iguanodon2.jpg'),
  "Lourinhanosaurus antunesi": require('./assets/images/Iguanodon2.jpg'),
  "Liliensternus liliensterni": require('./assets/images/Iguanodon2.jpg'),
  "Rhabdodon priscus": require('./assets/images/Iguanodon2.jpg'),
  "Magyarosaurus dacus": require('./assets/images/Iguanodon2.jpg'),
  "Zalmoxes robustus": require('./assets/images/Iguanodon2.jpg'),
  "Allosaurus europaeus": require('./assets/images/Iguanodon2.jpg'),
  "Thecodontosaurus antiquus": require('./assets/images/Iguanodon2.jpg'),
  "Concavenator corcovatus": require('./assets/images/Iguanodon2.jpg'),
  "Pelecanimimus polyodon": require('./assets/images/Iguanodon2.jpg'),
  "Arcovenator escotae": require('./assets/images/Iguanodon2.jpg'),
};

function getCardColor(dino) {
  const csoport = dino.csoport?.toLowerCase() || '';
  const korszak = dino.korszak?.toLowerCase() || '';
  if (korszak.includes('triász')) return { bg: COLORS.amberBg, accent: COLORS.amberLight, text: COLORS.amber };
  if (csoport.includes('sauropoda') || csoport.includes('ornithopoda') || csoport.includes('plateosauria')) {
    return { bg: COLORS.greenBg, accent: COLORS.greenLight, text: COLORS.green };
  }
  if (csoport.includes('spinosauridae') || csoport.includes('allosauridae') || csoport.includes('megalosauridae') ||
      csoport.includes('abelisauridae') || csoport.includes('carcharodontosauridae') || csoport.includes('coelophysoidea')) {
    return { bg: COLORS.coralBg, accent: COLORS.coralLight, text: COLORS.coral };
  }
  return { bg: COLORS.blueBg, accent: COLORS.blueLight, text: COLORS.blue };
}

function StatBox({ label, value }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function DinoCard({ dino, index, total }) {
  const color = getCardColor(dino);
  const image = IMAGE_MAP[dino.nev_tudomanyos] || null;

  return (
    <View style={styles.card}>
      <View style={[styles.cardImageArea, { backgroundColor: color.bg }]}>
        <View style={[styles.periodBadge, { borderColor: color.accent }]}>
          <Text style={[styles.periodBadgeText, { color: color.text }]}>{dino.korszak}</Text>
        </View>
        <View style={[styles.cladeBadge, { borderColor: COLORS.blueLight }]}>
          <Text style={styles.cladeBadgeText}>{dino.csoport?.split('(')[0].trim()}</Text>
        </View>

        {image ? (
          <Image
            source={image}
            style={styles.dinoImage}
            resizeMode="cover"
          />
        ) : (
          <Text style={[styles.fallbackEmoji, { color: color.accent }]}>
            {dino.csoport?.toLowerCase().includes('sauropoda') ? '🦕' : '🦖'}
          </Text>
        )}

        {/* Javítás: A számlálónak adjunk z-indexet vagy igazítsuk el, hogy ne takarja a badge */}
        <Text style={styles.counterText}>{index + 1} / {total}</Text>
      </View>

      <ScrollView style={styles.cardBody} showsVerticalScrollIndicator={false}>
        <Text style={styles.scientificName}>{dino.nev_tudomanyos}</Text>
        <Text style={styles.commonName}>{dino.nev_koznapi} · {dino.kor_millioev}</Text>

        <View style={styles.divider} />

        <View style={styles.statsGrid}>
          <StatBox label="Hossz" value={`${dino.meretek?.hossz_m} m`} />
          <StatBox label="Magasság" value={`${dino.meretek?.magassag_m} m`} />
          <StatBox label="Tömeg" value={`${dino.meretek?.tomeg_kg?.toLocaleString()} kg`} />
          {/* JAVÍTVA: felfedezés -> felfedezes */}
          <StatBox label="Felfedezve" value={`${dino.felfedezes?.ev}`} />
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionLabel}>Megtalálás helye</Text>
<Text style={styles.bodyText}>
  {dino.megtalalas_helye?.helyszin} · {dino.megtalalas_helye?.orszag}
</Text>

        {/* JAVÍTVA: felfedezés -> felfedezes */}
        <Text style={styles.sectionLabel}>Felfedező</Text>
        <Text style={styles.bodyText}>{dino.felfedezes?.felfedezo}</Text>

        {/* JAVÍTVA: felfedezés -> felfedezes */}
        <Text style={styles.sectionLabel}>Körülmény</Text>
        <Text style={styles.bodyText}>{dino.felfedezes?.korulmeny}</Text>

        <Text style={styles.sectionLabel}>Érdekesség</Text>
        <Text style={[styles.bodyText, styles.highlight]}>{dino.erdekesseg}</Text>

        <Text style={styles.sectionLabel}>Múzeum</Text>
        <Text style={styles.bodyText}>{dino.muzeum}</Text>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

export default function App() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const position = useRef(new Animated.ValueXY()).current;

  const swipe = useCallback((direction) => {
    const x = direction === 'next' ? -SCREEN_WIDTH * 1.5 : SCREEN_WIDTH * 1.5;
    Animated.timing(position, {
      toValue: { x, y: 0 },
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setCurrentIndex((prev) =>
        direction === 'next'
          ? Math.min(dinosaurs.length - 1, prev + 1)
          : Math.max(0, prev - 1)
      );
      position.setValue({ x: 0, y: 0 });
    });
  }, [position]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: 0 });
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx < -SWIPE_THRESHOLD) {
          swipe('next');
        } else if (gesture.dx > SWIPE_THRESHOLD) {
          swipe('prev');
        } else {
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const dino = dinosaurs[currentIndex];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>EURÓPA DINÓI</Text>
        <Text style={styles.headerSub}>Húzd balra a következőhöz →</Text>
      </View>

      <View style={styles.cardStack}>
        {currentIndex < dinosaurs.length - 1 && (
          <View style={[styles.card, styles.cardBehind]} />
        )}
        <Animated.View
          style={[styles.cardWrapper, {
            transform: [
              { translateX: position.x },
              { rotate: position.x.interpolate({
                inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
                outputRange: ['-6deg', '0deg', '6deg'],
              })},
            ],
          }]}
          {...panResponder.panHandlers}
        >
          <DinoCard dino={dino} index={currentIndex} total={dinosaurs.length} />
        </Animated.View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.navBtn, currentIndex === 0 && styles.navBtnDisabled]}
          onPress={() => currentIndex > 0 && swipe('prev')}
        >
          <Text style={styles.navBtnText}>← Előző</Text>
        </TouchableOpacity>

        <View style={styles.dots}>
          {dinosaurs.slice(Math.max(0, currentIndex - 2), Math.min(dinosaurs.length, currentIndex + 3)).map((_, i) => {
            const realIndex = Math.max(0, currentIndex - 2) + i;
            return (
              <View key={realIndex} style={[styles.dot, realIndex === currentIndex && styles.dotActive]} />
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.navBtn, currentIndex === dinosaurs.length - 1 && styles.navBtnDisabled]}
          onPress={() => currentIndex < dinosaurs.length - 1 && swipe('next')}
        >
          <Text style={styles.navBtnText}>Következő →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingTop: 52, paddingHorizontal: 24, paddingBottom: 12 },
  headerTitle: { fontSize: 12, fontWeight: '600', letterSpacing: 2, color: COLORS.textPrimary },
  headerSub: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  cardStack: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  cardWrapper: { width: '100%', height: '100%', position: 'absolute' },
  card: { width: '100%', height: '100%', backgroundColor: COLORS.card, borderRadius: 20, borderWidth: 0.5, borderColor: COLORS.border, overflow: 'hidden' },
  cardBehind: { position: 'absolute', backgroundColor: COLORS.cardBehind, top: 8, left: 8, right: -8, borderRadius: 20 },
cardImageArea: { 
  width: '100%',
  aspectRatio: 18/9,
  position: 'relative', 
  overflow: 'hidden' 
},
dinoImage: { width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 },
  fallbackEmoji: { fontSize: 64 },
  periodBadge: { position: 'absolute', bottom: 10, left: 12, backgroundColor: 'rgba(255,255,255,0.75)', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 0.5, zIndex: 2 },
cladeBadge: { position: 'absolute', bottom: 10, right: 12, backgroundColor: 'rgba(255,255,255,0.75)', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 0.5, zIndex: 2 },
  
  periodBadgeText: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5 },
 
  cladeBadgeText: { fontSize: 10, fontWeight: '500', color: COLORS.blue },
  counterText: { position: 'absolute', bottom: 10, right: 14, fontSize: 10, color: COLORS.textMuted, zIndex: 2 },
  cardBody: { flex: 1, padding: 16 },
  scientificName: { fontSize: 18, fontWeight: '600', color: COLORS.textPrimary, fontStyle: 'italic' },
  commonName: { fontSize: 11, color: COLORS.textSecondary, marginTop: 3, letterSpacing: 0.3 },
  divider: { height: 0.5, backgroundColor: COLORS.border, marginVertical: 12 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statBox: { flex: 1, minWidth: '45%', backgroundColor: COLORS.bg, borderRadius: 8, padding: 10, borderWidth: 0.5, borderColor: COLORS.border },
  statLabel: { fontSize: 9, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3 },
  statValue: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  sectionLabel: { fontSize: 9, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 12, marginBottom: 4 },
  bodyText: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
  highlight: { color: COLORS.textPrimary, fontStyle: 'italic' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, paddingBottom: 32 },
  navBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 0.5, borderColor: COLORS.border },
  navBtnDisabled: { opacity: 0.3 },
  navBtnText: { fontSize: 12, color: COLORS.textPrimary },
  dots: { flexDirection: 'row', gap: 5, alignItems: 'center' },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: COLORS.border },
  dotActive: { width: 14, backgroundColor: COLORS.green, borderRadius: 3 },
});