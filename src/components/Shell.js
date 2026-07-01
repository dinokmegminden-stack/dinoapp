import { View, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import AdSenseSlot, { AD_SLOT_LEFT, AD_SLOT_RIGHT } from '../../AdSenseSlot';

export default function Shell({ children }) {
  const { width } = useWindowDimensions();
  const showAdSlots = Platform.OS === 'web' && width >= 900;
  const isWideWeb = Platform.OS === 'web' && width >= 700;

  return (
    <View style={styles.shellOuter}>
      {showAdSlots && (
        <View style={styles.adSlot}>
          <AdSenseSlot slotId={AD_SLOT_LEFT} />
        </View>
      )}
      <View style={[styles.shellInner, isWideWeb && styles.shellInnerWide]}>
        {children}
      </View>
      {showAdSlots && (
        <View style={styles.adSlot}>
          <AdSenseSlot slotId={AD_SLOT_RIGHT} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  shellOuter: {
    flex: 1,
    width: '100%',
    minHeight: '100%',
    backgroundColor: '#283618',
    alignItems: 'stretch',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  shellInner: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    minHeight: '100%',
  },
  shellInnerWide: {
    maxWidth: 720,
  },
  adSlot: {
    flex: 1,
    minWidth: 120,
    maxWidth: 300,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(254,250,224,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(254,250,224,0.06)',
    borderStyle: 'dashed',
    margin: 12,
    borderRadius: 8,
  },
});
