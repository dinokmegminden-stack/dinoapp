// KutatokScreen — a "Kutatók" blogoldal: paleontológusokról, felfedezésekről
// és a tudománytörténet nagy pillanatairól szóló hosszabb cikkek, a
// `research_articles` táblából. A `dino_news`/NewsScreen.js mintáját követi,
// de itt nincs egy adott lényhez kötött fotó — a cikkek egy-egy kutatóról,
// expedícióról vagy korszakról szólnak, nem egy konkrét fajról.
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Linking, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Shell from '../components/Shell';
import HeaderBar from '../components/HeaderBar';
import PaleontologistTimeline from '../components/PaleontologistTimeline';
import { COLORS, RADIUS } from '../constants/theme';
import { FONTS } from '../constants/fonts';
import { fetchResearchArticles } from '../services/researchArticlesService';
import { fetchPaleontologists, fetchArticlePaleontologistLinks } from '../services/paleontologistsService';

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}. ${m}. ${day}.`;
}

// A cikktörzs "## "-tal jelölt sorokat szakaszcímként jelenít meg, üres
// sorral elválasztott bekezdéseket pedig normál szövegként — nem kell hozzá
// JSON-struktúra vagy markdown-parser, elég egy egyszerű konvenció.
function ArticleBody({ text }) {
  const blocks = String(text || '').split(/\n\s*\n/).filter(Boolean);
  return (
    <View style={styles.articleBody}>
      {blocks.map((block, i) => {
        const trimmed = block.trim();
        if (trimmed.startsWith('## ')) {
          return (
            <Text key={i} style={styles.sectionHeading}>{trimmed.slice(3).trim()}</Text>
          );
        }
        return (
          <Text key={i} style={styles.paragraph}>{trimmed}</Text>
        );
      })}
    </View>
  );
}

export default function KutatokScreen({ nickname, progress, onNavigate, onBack }) {
  const [articles, setArticles] = useState(null); // null = töltés alatt
  const [people, setPeople] = useState([]);
  const [links, setLinks] = useState([]); // { article_id, paleontologist_id }[]
  const [selectedPersonId, setSelectedPersonId] = useState(null);

  useEffect(() => {
    fetchResearchArticles(50).then(setArticles);
    fetchPaleontologists().then(setPeople);
    fetchArticlePaleontologistLinks().then(setLinks);
  }, []);

  // paleontológus id -> az ő cikkeinek id-halmaza — kliensoldali join a
  // kapcsolótábla apró méretét kihasználva (lásd paleontologistsService.js).
  const articleIdsByPerson = useMemo(() => {
    const map = new Map();
    for (const link of links) {
      if (!map.has(link.paleontologist_id)) map.set(link.paleontologist_id, new Set());
      map.get(link.paleontologist_id).add(link.article_id);
    }
    return map;
  }, [links]);

  const selectedPerson = people.find((p) => p.id === selectedPersonId) || null;
  const visibleArticles = useMemo(() => {
    if (!articles) return articles;
    if (!selectedPersonId) return articles;
    const ids = articleIdsByPerson.get(selectedPersonId);
    return articles.filter((a) => ids && ids.has(a.id));
  }, [articles, selectedPersonId, articleIdsByPerson]);

  return (
    <Shell header={<HeaderBar currentView="kutatok" nickname={nickname} progress={progress} onNavigate={onNavigate} />}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack} accessibilityRole="button" accessibilityLabel="Vissza">
            <MaterialCommunityIcons name="arrow-left" size={20} color={COLORS.cream} />
          </TouchableOpacity>
          <Text style={styles.title}>KUTATÓK</Text>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <PaleontologistTimeline
            people={people}
            selectedId={selectedPersonId}
            onSelect={setSelectedPersonId}
          />

          {!!selectedPerson && (
            <TouchableOpacity style={styles.filterChip} onPress={() => setSelectedPersonId(null)}>
              <Text style={styles.filterChipText}>
                {selectedPerson.emoji} {selectedPerson.name} cikkei
              </Text>
              <MaterialCommunityIcons name="close" size={16} color={COLORS.bgDark} />
            </TouchableOpacity>
          )}

          {articles === null ? (
            <ActivityIndicator color={COLORS.accent} style={{ marginTop: 40 }} />
          ) : visibleArticles.length === 0 ? (
            <Text style={styles.empty}>
              {selectedPerson
                ? `${selectedPerson.name}-hoz még nincs kapcsolódó cikk.`
                : 'Egyelőre nincs cikk.'}
            </Text>
          ) : (
            visibleArticles.map((item) => (
              <View key={item.id} style={styles.post}>
                <Text style={styles.date}>{formatDate(item.published_at)}</Text>
                <Text style={styles.postTitle}>{item.title}</Text>
                {!!item.author && <Text style={styles.author}>{item.author}</Text>}

                <ArticleBody text={item.body_text} />

                {!!item.source_url && (
                  <TouchableOpacity
                    style={styles.source}
                    onPress={() => Linking.openURL(item.source_url)}
                    accessibilityRole="link"
                  >
                    <MaterialCommunityIcons name="link-variant" size={14} color={COLORS.accent} />
                    <Text style={styles.sourceText} numberOfLines={1}>Forrás megtekintése</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
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
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.pill,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginTop: -6,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  filterChipText: {
    color: COLORS.bgDark,
    fontSize: 13,
    fontFamily: FONTS.bodyBold,
  },
  post: {
    width: '100%',
    maxWidth: 820,
    borderRadius: 18,
    backgroundColor: 'rgba(16,14,12,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(254,250,224,0.10)',
    padding: 20,
  },
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
  author: {
    color: COLORS.cream,
    fontSize: 13,
    fontFamily: FONTS.body,
    fontStyle: 'italic',
    opacity: 0.6,
    marginTop: 4,
  },
  articleBody: {
    marginTop: 14,
    gap: 12,
  },
  sectionHeading: {
    color: COLORS.accent,
    fontSize: 16,
    fontFamily: FONTS.bodyBold,
    marginTop: 4,
  },
  paragraph: {
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
    marginTop: 16,
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
