import { StyleSheet, Platform } from 'react-native';
import { COLORS } from '../../constants/colors';

// Web-en a flex:1 lánc nem mindig nyúlik ki a teljes viewportig, ha a tartalom
// alacsonyabb nála — 100vh minHeight ez ellen véd, mert a viewporthoz képest
// számolódik, nem az ős lánc flex-viselkedéséhez (lásd Shell.js azonos mintáját).
const webFullHeight = Platform.select({ web: { minHeight: '100vh' }, default: {} });

export const s = StyleSheet.create({
  backText: { color: COLORS.gold || '#DDA15E', fontSize: 15, fontWeight: '800' },
  navRow: { flexDirection: 'row', gap: 10, padding: 14 },
  navBtnPrimary: { backgroundColor: 'rgba(221,161,94,0.16)', borderColor: COLORS.gold || '#DDA15E' },
  navBtnPrimaryText: { color: COLORS.gold || '#DDA15E', fontSize: 15, fontWeight: '800' },
  outer: { flex: 1, width: '100%', minHeight: '100%', backgroundColor: COLORS.bg, alignItems: 'center', ...webFullHeight },
  inner: { flex: 1, width: '100%', maxWidth: 480, minHeight: '100%', paddingHorizontal: 16, paddingTop: 50 },
  innerWide: { maxWidth: 900 },
  innerExtraWide: { maxWidth: 1360 },
  loadingText: { color: '#FEFAE0', fontSize: 16, textAlign: 'center', marginTop: 40 },
  errorText: { color: '#BC6C25', fontSize: 16, textAlign: 'center', marginTop: 40 },

  backLink: { paddingVertical: 8, marginBottom: 4 },
  backLinkText: { color: COLORS.gold || '#DDA15E', ...Platform.select({ web: { cursor: 'pointer' } }), fontSize: 15, fontWeight: '800' },

  primaryBtn: { backgroundColor: 'rgba(221,161,94,0.16)', borderWidth: 2, borderColor: COLORS.gold || '#DDA15E', borderRadius: 24, paddingVertical: 14, paddingHorizontal: 28, alignItems: 'center', width: '100%' },
  primaryBtnText: { color: COLORS.gold || '#DDA15E', fontSize: 15, fontWeight: '800' },

  packagesScroll: { paddingBottom: 60 },
  packagesScrollFlex: { flex: 1 },

  // "Vissza" / "Főmenü" gombok mindig a képernyő alján ülnek, nem a
  // tetején — hogy ne vegyenek el helyet a tartalom fölött.
  bottomBackLink: { alignItems: 'center', paddingVertical: 14 },
  quizContentFlex: { flex: 1 },
  levelTitle: { color: COLORS.gold || '#DDA15E', fontSize: 15, fontWeight: '900', letterSpacing: 2, marginTop: 8 },
  levelSubtitle: { color: '#FEFAE0', fontSize: 24, fontWeight: '900', marginTop: 2 },
  levelDesc: { color: 'rgba(254,250,224,0.55)', fontSize: 15, lineHeight: 21, marginTop: 8, marginBottom: 18 },

  packageCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(254,250,224,0.06)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(254,250,224,0.16)', padding: 14, marginBottom: 12 },
  packageCardLocked: { opacity: 0.5 },
  packageIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.06)', justifyContent: 'center', alignItems: 'center' },
  packageIcon: { fontSize: 22 },
  packageName: { color: '#FEFAE0', fontSize: 15, fontWeight: '800' },
  packageMeta: { color: 'rgba(254,250,224,0.55)', fontSize: 15, marginTop: 2 },
  packageLockedHint: { color: '#BC6C25', fontSize: 15, marginTop: 4, fontWeight: '600' },
  packagePassedHint: { color: '#606C38', fontSize: 15, marginTop: 4, fontWeight: '700' },

  browseCounterRow: { alignItems: 'flex-end', marginBottom: 10, paddingHorizontal: 14 },
  browseCounter: { color: 'rgba(254,250,224,0.55)', fontSize: 15, fontWeight: '700' },

  browseMainRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 8 },
  sideBtnLeft: { width: 50, height: 50, justifyContent: 'center', alignItems: 'center', borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(254,250,224,0.15)' },
  sideBtnRight: { width: 50, height: 50, justifyContent: 'center', alignItems: 'center', borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(254,250,224,0.15)' },
  sideBtnPrimary: { backgroundColor: 'rgba(221,161,94,0.2)', borderColor: 'rgba(221,161,94,0.4)' },
  sideBtnText: { color: '#FEFAE0', fontSize: 20, fontWeight: '700' },
  sideBtnPrimaryText: { color: COLORS.gold || '#DDA15E', fontSize: 20, fontWeight: '700' },
  sideBtnDisabled: { opacity: 0.3 },
  sideBtnDisabledText: { opacity: 0.5 },

  characterSelectorGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, paddingVertical: 12 },
  charThumb: { width: 70, alignItems: 'center', padding: 6, borderRadius: 10, borderWidth: 1, borderColor: 'transparent' },
  charThumbActive: { borderColor: COLORS.green, backgroundColor: COLORS.greenBg },
  charThumbImg: { width: 50, height: 50 },
  charThumbPlaceholder: { backgroundColor: 'rgba(254,250,224,0.1)', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  charThumbInitial: { color: '#FEFAE0', fontSize: 20, fontWeight: '800' },
  charThumbName: { color: COLORS.textMuted, fontSize: 15, marginTop: 4, textAlign: 'center' },

  browseNavRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  navBtn: { flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(254,250,224,0.16)', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  navBtnDisabled: { opacity: 0.3 },
  navBtnText: { color: '#FEFAE0', fontSize: 15, fontWeight: '700' },

  quizStartBtn: { backgroundColor: 'rgba(221,161,94,0.16)', borderWidth: 1, borderColor: COLORS.gold || '#DDA15E', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 14, marginBottom: 24 },
  quizStartBtnText: { color: COLORS.gold || '#DDA15E', fontSize: 15, fontWeight: '800' },

  quizQuestionBox: { backgroundColor: 'rgba(255,255,255,0.03)', borderLeftWidth: 3, borderLeftColor: COLORS.gold || '#DDA15E', padding: 16, borderRadius: 8, marginTop: 4 },
  quizQuestionText: { color: '#FEFAE0', fontSize: 15, fontWeight: '700', lineHeight: 21 },
  optionBtn: { backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12 },
  optionBtnText: { color: '#FEFAE0', fontSize: 15, fontWeight: '500' },
  optionBtnSelected: { backgroundColor: 'rgba(221,161,94,0.18)', borderColor: COLORS.gold || '#DDA15E' },
  optionBtnCorrect: { backgroundColor: '#606C38', borderColor: '#7d8d49' },
  optionBtnIncorrect: { backgroundColor: '#BC6C25', borderColor: '#9c5419' },

  resultWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 60 },
  resultEmoji: { fontSize: 56, marginBottom: 12 },
  resultTitle: { color: '#FEFAE0', fontSize: 20, fontWeight: '900', textAlign: 'center' },
  resultDesc: { color: 'rgba(254,250,224,0.55)', fontSize: 15, textAlign: 'center', marginTop: 8, marginBottom: 24, lineHeight: 21, paddingHorizontal: 12 },
});