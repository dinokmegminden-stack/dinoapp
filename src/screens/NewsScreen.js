// NewsScreen — a "Dínós Hírek" blogoldal: a `dino_news` bejegyzések teljes
// listája, mindegyiknél a lény fotójával (IMAGE_MAP a common_name szerint),
// dátummal, magyar + tudományos névvel és a teljes hírszöveggel. A landing
// fejléc "Hírek" menüpontja és a bal sáv hír-tételei navigálnak ide.
import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Linking, Platform, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Shell from '../components/Shell';
import HeaderBar from '../components/HeaderBar';
import { COLORS } from '../constants/theme';
import { FONTS } from '../constants/fonts';
import { IMAGE_MAP, MISSING_IMAGE } from '../constants/imageMap';
import { fetchDinoNews, genusOf } from '../services/dinoNewsService';
import { useT } from '../i18n';

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}. ${m}. ${day}.`;
}

export default function NewsScreen({ nickname, progress, onNavigate, onBack }) {
  const { t } = useT();
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const [news, setNews] = useState(null); // null = töltés alatt

  useEffect(() => {
    fetchDinoNews(50).then(setNews);
  }, []);

  return (
    <Shell header={<HeaderBar currentView="news" nickname={nickname} progress={progress} onNavigate={onNavigate} />}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack} accessibilityRole="button" accessibilityLabel={t('common.back')}>
            <MaterialCommunityIcons name="arrow-left" size={20} color={COLORS.cream} />
          </TouchableOpacity>
          <Text style={styles.title}>{t('news.title')}</Text>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {news === null ? (
            <ActivityIndicator color={COLORS.accent} style={{ marginTop: 40 }} />
          ) : news.length === 0 ? (
            <Text style={styles.empty}>{t('news.empty')}</Text>
          ) : (
            news.map((item) => {
              const genus = genusOf(item.scientific_name);
              const img = IMAGE_MAP[genus] || MISSING_IMAGE;
              return (
                <View key={item.id} style={styles.post}>
                  <View style={styles.photoWrap}>
                    <Image source={img} style={styles.photo} resizeMode="cover" />
                  </View>
                  <View style={styles.body}>
                    <Text style={styles.date}>{formatDate(item.published_at)}</Text>
                    <Text style={styles.postTitle}>{genus || item.scientific_name}</Text>
                    {!!item.scientific_name && (
                      <Text style={styles.sci}>{item.scientific_name}</Text>
                    )}
                    <Text style={styles.text}>{item.news_text}</Text>
                    {!!item.source_url && (
                      <TouchableOpacity
                        style={styles.source}
                        onPress={() => Linking.openURL(item.source_url)}
                        accessibilityRole="link"
                      >
                        <MaterialCommunityIcons name="link-variant" size={14} color={COLORS.accent} />
                        <Text style={styles.sourceText} numberOfLines={1}>{t('common.view_source')}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
    </Shell>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 999,
    backgroundColor: 'rgba(20,18,16,0.7)',
    alignItems: 'center', justifyContent: 'center',
  },
  title: {
    color: COLORS.accent,
    fontSize: 22,
    fontFamily: FONTS.heading,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  scroll: { flex: 1, width: '100%' },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 20,
  },
  empty: { color: COLORS.cream, opacity: 0.7, fontFamily: FONTS.body, marginTop: 40 },
  post: {
    width: '100%',
    maxWidth: 820,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: 'rgba(16,14,12,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(254,250,224,0.10)',
  },
  // 16:9 keret a container teljes szélességében; a kép abszolút kitölti, cover.
  photoWrap: {
    width: '100%',
    aspectRatio: 16 / 9,
    overflow: 'hidden',
    backgroundColor: COLORS.darkGreen,
  },
  photo: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  body: { flex: 1, padding: 18 },
  date: {
    color: COLORS.accent,
    fontSize: 12,
    fontFamily: FONTS.bold,
    letterSpacing: 0.5,
    opacity: 0.6,
    marginBottom: 4,
  },
  postTitle: {
    color: COLORS.cream,
    fontSize: 22,
    fontFamily: FONTS.heading,
  },
  sci: {
    color: COLORS.cream,
    fontSize: 13,
    fontFamily: FONTS.body,
    fontStyle: 'italic',
    opacity: 0.6,
    marginBottom: 10,
  },
  text: {
    color: COLORS.cream,
    fontSize: 14.5,
    lineHeight: 22,
    fontFamily: FONTS.body,
    opacity: 0.85,
  },
  source: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    alignSelf: 'flex-start',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  sourceText: {
    color: COLORS.accent,
    fontSize: 13,
    fontFamily: FONTS.bold,
    textDecorationLine: 'underline',
  },
});
