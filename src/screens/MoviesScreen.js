// MoviesScreen — statikus dínós/őslényes filmlista, IMDB-értékeléssel,
// műfajjal és linkkel, oszlop szerint rendezhetően. Nincs Supabase-tábla
// mögötte (a NewsScreen/KutatokScreen mintáját követi elrendezésben, de a
// MOVIES konstans itt, kliensoldalon él).
import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Platform, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Shell from '../components/Shell';
import HeaderBar from '../components/HeaderBar';
import { COLORS } from '../constants/theme';
import { FONTS } from '../constants/fonts';
import { useT } from '../i18n';

const MOVIES = [
  { title: 'Prehistoric Planet (Apple TV+)', year: 2022, yearLabel: '2022–2025', genre: 'docu', rating: 8.4, url: 'https://www.imdb.com/title/tt10324164/' },
  { title: 'Jurassic Park', year: 1993, genre: 'cinema', rating: 8.2, url: 'https://www.imdb.com/title/tt0107290/' },
  { title: 'Walking with Dinosaurs (BBC Series)', year: 1999, genre: 'docu', rating: 8.3, url: 'https://www.imdb.com/title/tt0206884/' },
  { title: 'The Land Before Time', year: 1988, genre: 'cartoon', rating: 7.4, url: 'https://www.imdb.com/title/tt0095489/' },
  { title: 'Dinosaur Planet (BBC)', year: 2003, genre: 'docu', rating: 7.7, url: 'https://www.imdb.com/title/tt0482625/' },
  { title: 'Ice Age', year: 2002, genre: 'cartoon', rating: 7.6, url: 'https://www.imdb.com/title/tt0268380/' },
  { title: 'Godzilla', year: 1954, genre: 'cinema', rating: 7.6, url: 'https://www.imdb.com/title/tt0047034/' },
  { title: 'King Kong', year: 2005, genre: 'cinema', rating: 7.3, url: 'https://www.imdb.com/title/tt0360717/' },
  { title: 'Jurassic World', year: 2015, genre: 'cinema', rating: 6.9, url: 'https://www.imdb.com/title/tt0369610/' },
  { title: 'The Good Dinosaur', year: 2015, genre: 'cartoon', rating: 6.7, url: 'https://www.imdb.com/title/tt1979388/' },
  { title: 'Kong: Skull Island', year: 2017, genre: 'cinema', rating: 6.7, url: 'https://www.imdb.com/title/tt3731562/' },
  { title: 'The End of Oak Street', year: 2026, genre: 'cinema', rating: 7.0, approx: true, url: 'https://www.imdb.com/title/tt27165187/' },
  { title: 'The Lost World: Jurassic Park', year: 1997, genre: 'cinema', rating: 6.5, url: 'https://www.imdb.com/title/tt0119567/' },
  { title: 'Dinosaur (Disney)', year: 2000, genre: 'cartoon', rating: 6.4, url: 'https://www.imdb.com/title/tt0130623/' },
  { title: 'Jurassic World: Fallen Kingdom', year: 2018, genre: 'cinema', rating: 6.1, url: 'https://www.imdb.com/title/tt4881806/' },
  { title: 'When Dinosaurs Ruled the Earth', year: 2017, genre: 'docu', rating: 6.1, url: 'https://www.imdb.com/title/tt6863036/' },
  { title: 'Jurassic Park III', year: 2001, genre: 'cinema', rating: 6.0, url: 'https://www.imdb.com/title/tt0163025/' },
  { title: 'Jurassic World: Dominion', year: 2022, genre: 'cinema', rating: 5.6, url: 'https://www.imdb.com/title/tt8041270/' },
  { title: 'Walking with Dinosaurs 3D', year: 2013, genre: 'cinema', rating: 5.2, url: 'https://www.imdb.com/title/tt1272018/' },
];

// Oszloponkénti alap rendezési irány első kattintásra: a szöveges/év oszlopok
// növekvő, az értékelés csökkenő (legjobb film felül) sorrenddel indít.
const COLUMNS = [
  { key: 'title', defaultDir: 'asc' },
  { key: 'year', defaultDir: 'asc' },
  { key: 'genre', defaultDir: 'asc' },
  { key: 'rating', defaultDir: 'desc' },
];

function ratingColor(rating) {
  if (rating >= 7.5) return '#7CCB6E';
  if (rating >= 6.5) return COLORS.accent;
  return 'rgba(254,250,224,0.6)';
}

function SortIcon({ active, dir }) {
  if (!active) return <MaterialCommunityIcons name="unfold-more-horizontal" size={14} color="rgba(254,250,224,0.35)" />;
  return (
    <MaterialCommunityIcons
      name={dir === 'asc' ? 'arrow-up' : 'arrow-down'}
      size={14}
      color={COLORS.accent}
    />
  );
}

export default function MoviesScreen({ nickname, progress, onNavigate, onBack }) {
  const { t } = useT();
  const { width } = useWindowDimensions();
  const isWide = width >= 700;

  const [sortKey, setSortKey] = useState('rating');
  const [sortDir, setSortDir] = useState('desc');

  const handleSort = (key) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(COLUMNS.find((c) => c.key === key).defaultDir);
    }
  };

  const genreLabel = (genre) => {
    if (genre === 'docu') return t('movies.genre_docu');
    if (genre === 'cartoon') return t('movies.genre_cartoon');
    return t('movies.genre_cinema');
  };

  const sortedMovies = useMemo(() => {
    const list = [...MOVIES];
    const dirMul = sortDir === 'asc' ? 1 : -1;
    list.sort((a, b) => {
      let av = a[sortKey];
      let bv = b[sortKey];
      if (sortKey === 'genre') {
        av = genreLabel(a.genre);
        bv = genreLabel(b.genre);
      }
      if (typeof av === 'string') return av.localeCompare(bv) * dirMul;
      return (av - bv) * dirMul;
    });
    return list;
  }, [sortKey, sortDir, t]);

  const HeaderCell = ({ col, style, label }) => (
    <TouchableOpacity style={[styles.headCellBtn, style]} onPress={() => handleSort(col)} accessibilityRole="button">
      <Text style={[styles.cell, styles.headCell]}>{label}</Text>
      <SortIcon active={sortKey === col} dir={sortDir} />
    </TouchableOpacity>
  );

  return (
    <Shell header={<HeaderBar currentView="movies" nickname={nickname} progress={progress} onNavigate={onNavigate} />}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack} accessibilityRole="button" accessibilityLabel={t('common.back')}>
            <MaterialCommunityIcons name="arrow-left" size={20} color={COLORS.cream} />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>{t('movies.title')}</Text>
            <Text style={styles.hint}>{t('movies.hint')}</Text>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <View style={styles.table}>
            <View style={[styles.row, styles.headRow]}>
              <HeaderCell col="title" style={styles.titleCol} label={t('movies.col_title')} />
              {isWide && <HeaderCell col="year" style={styles.yearCol} label={t('movies.col_year')} />}
              {isWide && <HeaderCell col="genre" style={styles.genreCol} label={t('movies.col_genre')} />}
              <HeaderCell col="rating" style={styles.ratingCol} label={t('movies.col_rating')} />
              <View style={styles.linkCol} />
            </View>

            {sortedMovies.map((movie) => (
              <View key={movie.url} style={styles.row}>
                <View style={styles.titleCol}>
                  <Text style={styles.cell}>{movie.title}</Text>
                  {!isWide && (
                    <Text style={styles.yearInline}>{movie.yearLabel || movie.year} · {genreLabel(movie.genre)}</Text>
                  )}
                </View>
                {isWide && <Text style={[styles.cell, styles.yearCol]}>{movie.yearLabel || movie.year}</Text>}
                {isWide && <Text style={[styles.cell, styles.genreCol]}>{genreLabel(movie.genre)}</Text>}
                <Text style={[styles.cell, styles.ratingCol, { color: ratingColor(movie.rating) }]}>
                  ★ {movie.approx ? '~' : ''}{movie.rating.toFixed(1)}
                </Text>
                <View style={styles.linkCol}>
                  <TouchableOpacity
                    style={styles.linkBtn}
                    onPress={() => Linking.openURL(movie.url)}
                    accessibilityRole="link"
                    accessibilityLabel={t('movies.watch_link')}
                  >
                    <MaterialCommunityIcons name="open-in-new" size={16} color={COLORS.accent} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
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
  hint: {
    color: COLORS.cream,
    opacity: 0.6,
    fontFamily: FONTS.body,
    fontSize: 13,
    marginTop: 4,
  },
  scroll: { flex: 1, width: '100%' },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  table: {
    width: '100%',
    maxWidth: 860,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: 'rgba(16,14,12,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(254,250,224,0.10)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(254,250,224,0.08)',
  },
  headRow: {
    backgroundColor: 'rgba(254,250,224,0.04)',
    paddingVertical: 6,
  },
  headCellBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  headCell: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    opacity: 0.85,
  },
  cell: {
    color: COLORS.cream,
    fontSize: 15,
    fontFamily: FONTS.body,
  },
  titleCol: { flex: 1, paddingRight: 12 },
  yearCol: { width: 88 },
  genreCol: { width: 80 },
  yearInline: {
    color: COLORS.cream,
    opacity: 0.5,
    fontSize: 12,
    fontFamily: FONTS.body,
    marginTop: 2,
  },
  ratingCol: {
    width: 68,
    fontFamily: FONTS.bold,
  },
  linkCol: {
    width: 40,
    alignItems: 'center',
  },
  linkBtn: {
    padding: 6,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
});
