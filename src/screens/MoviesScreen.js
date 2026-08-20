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
  { title: 'Denver, the Last Dinosaur', year: 1988, yearLabel: '1988–1990', genre: 'cartoon', rating: 6.4, url: 'https://www.imdb.com/title/tt0190178/' },
  { title: 'Jurassic World: Fallen Kingdom', year: 2018, genre: 'cinema', rating: 6.1, url: 'https://www.imdb.com/title/tt4881806/' },
  { title: 'When Dinosaurs Ruled the Earth', year: 2017, genre: 'docu', rating: 6.1, url: 'https://www.imdb.com/title/tt6863036/' },
  { title: 'Jurassic Park III', year: 2001, genre: 'cinema', rating: 6.0, url: 'https://www.imdb.com/title/tt0163025/' },
  { title: 'Jurassic World: Dominion', year: 2022, genre: 'cinema', rating: 5.6, url: 'https://www.imdb.com/title/tt8041270/' },
  { title: 'Walking with Dinosaurs 3D', year: 2013, genre: 'cinema', rating: 5.2, url: 'https://www.imdb.com/title/tt1272018/' },
  { title: "We're Back! A Dinosaur's Story", year: 1993, genre: 'cartoon', rating: 6.0, url: 'https://www.imdb.com/title/tt0108526/' },
  { title: 'The Valley of Gwangi', year: 1969, genre: 'cinema', rating: 6.2, url: 'https://www.imdb.com/title/tt0065163/' },
  { title: 'One Million Years B.C.', year: 1966, genre: 'cinema', rating: 5.7, url: 'https://www.imdb.com/title/tt0060782/' },
  { title: 'Primitive War', year: 2025, genre: 'cinema', rating: 5.3, url: 'https://www.imdb.com/title/tt18312380/' },
  { title: '65', year: 2023, genre: 'cinema', rating: 5.4, url: 'https://www.imdb.com/title/tt12261776/' },
  { title: 'The VelociPastor', year: 2017, genre: 'cinema', rating: 5.1, url: 'https://www.imdb.com/title/tt1843303/' },
  { title: 'Primal', year: 2019, yearLabel: '2019–', genre: 'cartoon', rating: 8.6, url: 'https://www.imdb.com/title/tt10332508/' },
  { title: 'King Kong', year: 1933, genre: 'cinema', rating: 7.9, url: 'https://www.imdb.com/title/tt0024216/' },
  { title: 'Godzilla Minus One', year: 2023, genre: 'cinema', rating: 7.6, url: 'https://www.imdb.com/title/tt23289160/' },
  { title: 'Dinosaurs (TV Series)', year: 1991, yearLabel: '1991–1994', genre: 'cartoon', rating: 7.5, url: 'https://www.imdb.com/title/tt0101081/' },
  { title: 'The Flintstones', year: 1960, yearLabel: '1960–1966', genre: 'cartoon', rating: 7.5, url: 'https://www.imdb.com/title/tt0053502/' },
  { title: 'Jurassic World: Camp Cretaceous', year: 2020, yearLabel: '2020–2022', genre: 'cartoon', rating: 7.5, url: 'https://www.imdb.com/title/tt10436228/' },
  { title: 'Primeval (TV Series)', year: 2007, yearLabel: '2007–2011', genre: 'cinema', rating: 7.2, url: 'https://www.imdb.com/title/tt0808096/' },
  { title: 'Toy Story That Time Forgot', year: 2014, genre: 'cartoon', rating: 7.1, url: 'https://www.imdb.com/title/tt3473654/' },
  { title: 'Monarch: Legacy of Monsters', year: 2023, yearLabel: '2023–', genre: 'cinema', rating: 7.0, url: 'https://www.imdb.com/title/tt17220216/' },
  { title: 'Ice Age: Dawn of the Dinosaurs', year: 2009, genre: 'cartoon', rating: 6.9, url: 'https://www.imdb.com/title/tt1080016/' },
  { title: 'Shin Godzilla', year: 2016, genre: 'cinema', rating: 6.9, url: 'https://www.imdb.com/title/tt4262980/' },
  { title: 'Mothra vs. Godzilla', year: 1964, genre: 'cinema', rating: 6.5, url: 'https://www.imdb.com/title/tt0058379/' },
  { title: 'Godzilla', year: 2014, genre: 'cinema', rating: 6.4, url: 'https://www.imdb.com/title/tt0831387/' },
  { title: 'Godzilla vs. Kong', year: 2021, genre: 'cinema', rating: 6.3, url: 'https://www.imdb.com/title/tt5034838/' },
  { title: 'Godzilla: Final Wars', year: 2004, genre: 'cinema', rating: 6.3, url: 'https://www.imdb.com/title/tt0399102/' },
  { title: 'Godzilla x Kong: The New Empire', year: 2024, genre: 'cinema', rating: 6.0, url: 'https://www.imdb.com/title/tt14539740/' },
  { title: 'Godzilla: King of the Monsters', year: 2019, genre: 'cinema', rating: 6.0, url: 'https://www.imdb.com/title/tt3741700/' },
  { title: 'King Kong', year: 1976, genre: 'cinema', rating: 6.0, url: 'https://www.imdb.com/title/tt0074751/' },
  { title: 'Godzilla 2000', year: 1999, genre: 'cinema', rating: 6.0, url: 'https://www.imdb.com/title/tt0188640/' },
  { title: 'The Land Before Time II: The Great Valley Adventure', year: 1994, genre: 'cartoon', rating: 5.9, url: 'https://www.imdb.com/title/tt0110300/' },
  { title: 'Jurassic World: Rebirth', year: 2025, genre: 'cinema', rating: 5.8, url: 'https://www.imdb.com/title/tt31036941/' },
  { title: 'Journey to the Center of the Earth', year: 2008, genre: 'cinema', rating: 5.8, url: 'https://www.imdb.com/title/tt0373051/' },
  { title: 'Ice Age: Collision Course', year: 2016, genre: 'cartoon', rating: 5.7, url: 'https://www.imdb.com/title/tt3416828/' },
  { title: 'King Kong vs. Godzilla', year: 1963, genre: 'cinema', rating: 5.7, url: 'https://www.imdb.com/title/tt0056142/' },
  { title: 'Godzilla', year: 1998, genre: 'cinema', rating: 5.5, url: 'https://www.imdb.com/title/tt0120685/' },
  { title: 'Land of the Lost', year: 2009, genre: 'cinema', rating: 5.4, url: 'https://www.imdb.com/title/tt0457400/' },
  { title: '10,000 BC', year: 2008, genre: 'cinema', rating: 5.2, url: 'https://www.imdb.com/title/tt0443649/' },
  { title: 'The Ice Age Adventures of Buck Wild', year: 2022, genre: 'cartoon', rating: 4.4, url: 'https://www.imdb.com/title/tt13634480/' },
  { title: 'A Sound of Thunder', year: 2005, genre: 'cinema', rating: 4.3, url: 'https://www.imdb.com/title/tt0318081/' },
  { title: 'Super Mario Bros.', year: 1993, genre: 'cinema', rating: 4.2, url: 'https://www.imdb.com/title/tt0108255/' },
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
