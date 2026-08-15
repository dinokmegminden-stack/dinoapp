// i18n — a DínóTudós többnyelvűsítésének magja.
// Könyvtárak: expo-localization (eszköz-nyelv) + i18n-js v4 (katalógusok).
// Támogatott nyelvek: magyar (hu, alap/forrás) + angol (en). A német (de)
// később egyszerűen bővíthető: új de.json + a SUPPORTED lista kiegészítése.
//
// A fordítási kulcsok pont-namespace-ekkel: t('nav.home'). Interpoláció
// i18n-js módra: t('header.streak', { days: 3 }) → a "%{days} nap".
//
// A reaktivitást (nyelvváltáskor újrarender) a LanguageProvider adja: a
// komponensek a useT() hookkal kérik a `t`-t, ami a context-nyelvhez kötött,
// így nyelvváltáskor újrarendel. Kép/DB-tartalom fallbackje külön (lásd a
// creature-leírásnál): ha az adott nyelv üres, a magyarra esünk vissza.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import hu from './translations/hu.json';
import en from './translations/en.json';

export const SUPPORTED_LANGUAGES = ['hu', 'en'];
export const DEFAULT_LANGUAGE = 'hu'; // forrásnyelv + végső fallback
const STORAGE_KEY = 'dmm_language';

const CATALOGS = { hu, en };

// Minimál fordító (i18n-js helyett — annak ESM buildje nem resolve-ol Metro
// alatt, és a pluralizációra/locale-kezelésre itt nincs szükség). Pont-
// namespace kulcs (t('nav.home')), hiányzó kulcs → magyar fallback → maga a
// kulcs. Interpoláció: %{name} → opts.name.
function lookup(lang, key) {
  const parts = key.split('.');
  let node = CATALOGS[lang];
  for (const p of parts) node = node == null ? undefined : node[p];
  return node;
}

function translate(lang, key, opts) {
  let val = lookup(lang, key);
  if (val == null && lang !== DEFAULT_LANGUAGE) val = lookup(DEFAULT_LANGUAGE, key);
  // Nem-string katalógusérték (pl. hónap/hétköznap tömb) változatlanul megy vissza —
  // a hívó tömbként használja (t('dashboard.months')[m]).
  if (val != null && typeof val !== 'string') return val;
  let str = val == null ? key : String(val);
  if (opts) {
    str = str.replace(/%\{(\w+)\}/g, (_, k) => (opts[k] != null ? String(opts[k]) : `%{${k}}`));
  }
  return str;
}

// Eszköz-nyelv → támogatott nyelv (különben az alap).
function deviceLanguage() {
  try {
    const code = Localization.getLocales?.()?.[0]?.languageCode;
    return SUPPORTED_LANGUAGES.includes(code) ? code : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

const LanguageContext = createContext({
  lang: DEFAULT_LANGUAGE,
  setLanguage: () => {},
  t: (key, opts) => translate(DEFAULT_LANGUAGE, key, opts),
});

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(DEFAULT_LANGUAGE);

  // Induláskor: mentett nyelv > eszköz-nyelv > alap.
  useEffect(() => {
    (async () => {
      let next = deviceLanguage();
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved && SUPPORTED_LANGUAGES.includes(saved)) next = saved;
      } catch {}
      setLang(next);
    })();
  }, []);

  const setLanguage = useCallback((next) => {
    if (!SUPPORTED_LANGUAGES.includes(next)) return;
    setLang(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }, []);

  // `t` a nyelvhez kötve — nyelvváltáskor új referencia → a fogyasztók újrarendelnek.
  const t = useCallback((key, opts) => translate(lang, key, opts), [lang]);

  const value = useMemo(() => ({ lang, setLanguage, t }), [lang, setLanguage, t]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

// A komponensek ezt használják: const { t, lang, setLanguage } = useT();
export function useT() {
  return useContext(LanguageContext);
}

// Nyelvfüggő mező kiválasztása egy DB-objektumból, magyar fallbackkel.
// Pl. pickLocalized(dino, 'description') → description_en (ha van + nem üres),
// különben description_hu. Így a részleges fordítás sosem üres kártyát ad.
export function pickLocalized(obj, base, lang) {
  if (!obj) return '';
  const localized = obj[`${base}_${lang}`];
  if (localized != null && String(localized).trim() !== '') return localized;
  return obj[`${base}_hu`] ?? '';
}
