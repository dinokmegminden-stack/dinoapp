// Footer — a landing (és általában a Shell-t használó oldalak) alján megjelenő,
// sötét, teljes szélességű lábléc: YouTube-csatorna, impresszum, adatvédelem,
// közösségi ikonok. A Shell `footer` propján át, a fejléccel szimmetrikusan,
// a belső (maxWidth-re szorított) tartalmon KÍVÜL renderel.
import React from 'react';
import { View, Text, Pressable, StyleSheet, Linking, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, TEXT_OPACITY } from '../constants/theme';
import { playSound } from '../audio/audioSystem';
import { useT } from '../i18n';

const YOUTUBE_URL = 'https://www.youtube.com/@dinokmegminden';

function FooterLink({ icon, label, onPress }) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <Pressable
      style={[styles.link, hovered && styles.linkHovered]}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      accessibilityRole="button"
    >
      {!!icon && <MaterialCommunityIcons name={icon} size={15} color={COLORS.cream} style={{ opacity: hovered ? 1 : 0.75 }} />}
      <Text style={[styles.linkText, hovered && styles.linkTextHovered]}>{label}</Text>
    </Pressable>
  );
}

function SocialIcon({ icon, onPress }) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <Pressable
      style={[styles.social, hovered && styles.socialHovered]}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      accessibilityRole="button"
    >
      <MaterialCommunityIcons name={icon} size={17} color={hovered ? COLORS.bgDark : COLORS.cream} />
    </Pressable>
  );
}

export default function Footer({ onOpenInfo }) {
  const { t } = useT();
  const openYoutube = () => {
    playSound('click');
    Linking.openURL(YOUTUBE_URL);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.inner}>
        <View style={styles.brandCol}>
          <Text style={styles.brandText}>DMM Lexikon</Text>
          <Text style={styles.tagline}>{t('footer.tagline')}</Text>
        </View>

        <View style={styles.linksCol}>
          <FooterLink icon="youtube" label={t('footer.youtube_channel')} onPress={openYoutube} />
          <FooterLink label={t('footer.imprint')} onPress={onOpenInfo} />
          <FooterLink label={t('footer.privacy')} onPress={onOpenInfo} />
        </View>

        <View style={styles.socialCol}>
          <SocialIcon icon="youtube" onPress={openYoutube} />
          <SocialIcon icon="instagram" onPress={openYoutube} />
          <SocialIcon icon="facebook" onPress={openYoutube} />
        </View>
      </View>

      <View style={styles.bottomRow}>
        <Text style={styles.copy}>{t('footer.copyright', { year: new Date().getFullYear() })}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    marginTop: 32,
    backgroundColor: 'rgba(0,10,14,0.92)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(254,250,224,0.10)',
    paddingHorizontal: 40,
    paddingTop: 24,
    paddingBottom: 16,
  },
  inner: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 20,
  },
  brandCol: { minWidth: 200, gap: 4 },
  brandText: { color: COLORS.cream, fontSize: 16, fontFamily: FONTS.heading, opacity: TEXT_OPACITY.primary },
  tagline: { color: COLORS.cream, fontSize: 12.5, fontFamily: FONTS.body, opacity: TEXT_OPACITY.meta },
  linksCol: { gap: 8 },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  linkHovered: {},
  linkText: { color: COLORS.cream, fontSize: 13, fontFamily: FONTS.body, opacity: TEXT_OPACITY.secondary },
  linkTextHovered: { color: COLORS.accent, opacity: 1 },
  socialCol: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  social: {
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: 'rgba(254,250,224,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { cursor: 'pointer', transitionProperty: 'background-color', transitionDuration: '120ms' },
    }),
  },
  socialHovered: { backgroundColor: COLORS.accent },
  bottomRow: {
    marginTop: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(254,250,224,0.06)',
    alignItems: 'center',
  },
  copy: { color: COLORS.cream, fontSize: 11.5, fontFamily: FONTS.body, opacity: TEXT_OPACITY.meta },
});
