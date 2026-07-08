# DínóTudós UI redesign — implementációs spec

Cél: a jelenlegi funkcionálisan kész app (React Native / Expo SDK 54, RN Web via `web.bundler: metro`, Vercel) vizuális rétegének modernizálása. Playful-cartoon irány, vegyes családi célközönség (7-12 évesek + szülők + felnőtt paleo-rajongók).

## 1. Design tokens

Meglévő paletta megtartva, csak konzisztensen alkalmazva:

```js
// src/constants/theme.js
export const COLORS = {
  bgDark: '#283618',      // fő háttér, header szöveg árnyék
  bgMid: '#606C38',       // régió gombok, borderek
  bgMidLight: '#7d8a4a',  // másodlagos kategória (Gyűjtemény gomb)
  accent: '#DDA15E',      // elsődleges CTA, XP badge, latin név
  accentDark: '#BC6C25',  // másodlagos CTA, hover shadow
  cream: '#FEFAE0',       // kártya háttér, világos szöveg
  cardMuted: '#f0e9cf',   // metadata sor háttér a kártyákon
  parokBtn: '#a56a3f',    // Párok gomb (játékmód, nem régió)
  parokBtnShadow: '#6e4529',
};

export const RADIUS = { button: 14, card: 12, cardLarge: 18, pill: 999 };
```

**Fontos:** ne hardcode-olt hex legyen szétszórva komponensekben — minden szín ebből a fájlból importálva.

## 2. "Nyomott gomb" interakciós minta

Ez a visszatérő elem minden CTA-n (régió gombok, Párok, Képkvíz, Milliomos, Részletek gomb). Web mockupban `box-shadow` trükkel csináltam, RN-ben `Animated` kell:

```jsx
// src/components/PressableButton.js
import { useRef } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';

export default function PressableButton({ onPress, style, shadowColor, children }) {
  const translateY = useRef(new Animated.Value(0)).current;

  const pressIn = () => Animated.timing(translateY, { toValue: 3, duration: 80, useNativeDriver: true }).start();
  const pressOut = () => Animated.timing(translateY, { toValue: 0, duration: 80, useNativeDriver: true }).start();

  return (
    <Pressable onPressIn={pressIn} onPressOut={pressOut} onPress={onPress}>
      <Animated.View style={[
        { transform: [{ translateY }] },
        { borderBottomWidth: 5, borderBottomColor: shadowColor },
        style,
      ]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
```

Minden CTA-nak van egy `bg` + hozzá tartozó sötétebb `shadowColor` párja (lásd COLORS fent — pl. `bg: accent, shadowColor: accentDark`).

## 3. Landing page (LandingMenu.js / LandingPage.js)

Struktúra fentről lefelé:

1. **Header sáv**: XP pill (bal, cream háttér, csillag ikon) + hang/user ikon gombok (jobb, kör alakú, `bgMid` háttér)
2. **Logó blokk**: cím enyhén elforgatva (`-3deg`), `textShadow` `accentDark` színnel, alcím `accent` színben
3. **RÉGIÓK szekció** — label + **2×3 grid**: Kárpát-medence, Európa, Afrika, Ázsia, Amerika, Gyűjtemény (utóbbi `bgMidLight` háttérrel megkülönböztetve, mert más kategória, de vizuálisan a régiók blokkjához tartozik)
4. **JÁTÉKMÓDOK szekció** — label + **Párok gomb** teli szélességben, `parokBtn` színnel (nem zöld — nem régió)
5. **Fő CTA-k**: 5MP Képkvíz (`accent` bg) + XP Milliomos (`accentDark` bg), mindkettő teli szélességű, ez a leghangsúlyosabb blokk legalul

Ikonok (Tabler-nevek, de **ellenőrizd a választott RN icon lib-ben**, mert nem minden név egyezik):
- Kárpát-medence: mountain · Európa: building-castle · Afrika: sun · Ázsia: yin-yang (NEM temple, az nem létezik) · Amerika: paw · Gyűjtemény: photo · Párok: cards · Képkvíz: bolt · Milliomos: trophy

## 4. DinoCard.js

**Kritikus megkötés: minden kép 16:9, sosem torzulhat vagy vágódhat.**

### Mobil (< 700px, `flexDirection: column`)
- Kép felül, `aspectRatio: 16/9`, `resizeMode: cover`
- 4 badge a képre overlayolva: bal-fent ritkaság, jobb-fent kor/epoch, bal-lent hossz, jobb-lent súly
- Alatta: név (`name_hu`) + latin név dőlt (`name_latin` + `latin_name_ending`)
- Metadata sorok kártyázva (`cardMuted` háttér): kor tartomány (`mya_min`–`mya_max`), felfedező + év (`discoverer_name`, `discovery_year`)
- Leírás (`description_hu`, min. 3 mondat) — nincs truncate a részletes nézetben
- "Részletek" CTA gomb alul

### Desktop (≥ 700px)
- Kép marad felül, teljes szélesség, **változatlan 16:9** — nem vág vízszintes split-re
- A kép **alatti** tartalom vált `flexDirection: row`-ra: bal oszlop (180px fix szélesség) = név + latin név + metadata kártyák; jobb oszlop (`flex: 1`) = leírás + CTA gomb
- Ezt `useWindowDimensions()` hookkal döntsd el, ne CSS media queryvel

```jsx
const { width } = useWindowDimensions();
const isDesktop = width >= 700;
// ...
<View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 16 }}>
```

## 5. DinoGallery.js — grid nézet

Csak azok a dínók jelennek meg amiknél `regionProgress.quizPassed === true`, **pack szerint csoportosítva**.

- Használj `SectionList`-et, NEM `FlatList` + manuális header-injektálást (kevesebb re-render bug nagy gyűjteménynél)
  - `sections`: pack-ek szerint groupolt tömb
  - `renderSectionHeader`: `"{pack_number}. CSOMAG · {EDU_LABEL}"` felirat
  - `renderItem`: mini kártya (kép 16:9 + név + ritkaság badge jobb-fent)
- **Zárolt (még fel nem oldott) dínók helyén** szaggatott keretes placeholder, lakat ikonnal, "Zárolva" felirattal — ne csak kihagyd őket, mert az motivációt vesz el (a felhasználó nem látja mennyi van még hátra)
- Fejlécben progress pill: `{megszerzett} / {összes}`
- Grid: 3 oszlop mobilon is jól működik a kis kártyaméret miatt (nem kell reszponzívan váltani, mint a DinoCard-nál)

## 6. Ismert technikai buktatók (ne ismételd meg)

- `<Image source={null}>` DOM crash webes buildnél — mindig `resolveImage()` `|| null` fallback + null-check render előtt
- `app.json`-ban kötelező `web.bundler: "metro"`, különben `require()` asset-ek nem oldódnak fel weben
- Import path hibák: mindig `src/` prefix, relatív path ellenőrzés
- `edu` mező **integer**, ne string — típusmismatch a régi kódban visszatérő hibaforrás volt
- Tabler ikon nevek nem mind léteznek — build előtt vizuálisan ellenőrizd mindet, ne csak nevek alapján

## 7. Következő lépések Claude Code-ban

Javasolt sorrend:
1. `theme.js` + `PressableButton.js` létrehozása (alapinfrastruktúra)
2. `LandingMenu.js` átírása a fenti struktúra szerint
3. `DinoCard.js` responsive logika hozzáadása (`useWindowDimensions`)
4. `DinoGallery.js` átállítása `SectionList`-re + zárolt-slot placeholder
5. Ikon-csere és ellenőrzés a választott RN icon libben
