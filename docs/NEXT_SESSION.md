# Hol tartunk — folytatás ide (2026-07-22 este)

## 🔴 Azonnali teendő: EAS build/submit folyamatban

Egy Android production build fut a háttérben az Expo felhőjén, amit **closed
testing** sávra (Play Console "alpha" track) szánunk, "DinoExp" néven.

- Build ID: `695f367d-9b39-4c3b-bbb4-55edd512a78b`
- Státusz-link: https://expo.dev/accounts/dinokmegminden/projects/DinoApp/builds/695f367d-9b39-4c3b-bbb4-55edd512a78b
- Utoljára ellenőrizve: **IN_QUEUE** (még nem kezdődött el maga a fordítás)
- `versionCode` automatikusan 10 → 11 lett (remote version source, ez normális)

**Következő lépés, ha a build végzett (FINISHED):**
```
npx eas-cli submit --platform android --profile production --non-interactive
```
Ez tölti fel a Play Console-ba, a `track: "alpha"` (= Closed testing) sávra,
az `eas.json`-ban beállított service account kulccsal
(`./git_not_commit/google-play-service-account.json`).

**⚠️ Ha hibát dob vagy "draft"-ként ragad be:** a Play Console-ban még
**nincs kitöltve** a Store Listing (bolt-cím, leírás, screenshotok) és a
megfelelőségi űrlapok (tartalom-besorolás, adatvédelmi/data-safety kérdőív,
célközönség-nyilatkozat) — a user szerint ("Nem, még nincs kitöltve"). Ezt
Google jellemzően megköveteli már Closed testingnél is, csak a webes Play
Console felületen tölthető ki, nem EAS-ből. Ha a submit emiatt akad el, ezt
a usernek kell befejeznie a Play Console-ban, mielőtt a release ténylegesen
elindulhatna a tesztelőknek.

## ⚠️ Nincs commitolva / push-olva

Az `eas.json` és `app.json` módosításai **még nincsenek commitolva**:
- `eas.json`: `submit.production.android.track`: `"internal"` → `"alpha"`
- `app.json`: `expo.name`: `"DínóTudós: Kártyák és Kvíz"` → `"DinoExp"`

Ha a build/submit sikeres és a user jóváhagyja, ezeket is commitolni +
push-olni kell (eddig minden más változtatást ő kért commitolni/push-olni,
tételesen jóváhagyva).

## Ma elkészült és már push-olva van (main ág)

Commit sorrend (legrégebbitől a legújabbig):
1. `643d866` — interaktív, hoverelhető világtérkép (`RegionWorldMap`) a
   régiógombok helyett; új "DÍNÓ EXPEDÍCIÓ" hero-logó (Caprasimo/Figtree
   betűtípusok, balra rendezve, hoverre megjelenő alcím); dínónevek egységes
   Caprasimo betűtípusra váltva a kártyákon; új "Akasztófa" játékmód
   (tudományos név kitalálása, 6 hibalehetőség, aszteroida-becsapódás
   animációval — lásd `assets/6.png`, `AsteroidImpactPanel.js`); szélesebb
   landing-elrendezés
2. `a60ae0b` — Kentrosaurus kép visszaállítva az eredeti fájlra (a
   `kentrosaurus2.jpg`-s próbálkozás után)
3. `3fadf46` — hiányzó dínóképek pótolva: Eoraptor, Antarctosaurus (ezeknek
   korábban egyáltalán nem volt `imageMap.js` bejegyzésük), Alvarezsaurus
4. `dd9fa22` — **a landing háttérkép mindenhol megjelenik**: a `Shell`
   komponensnek alapértelmezett háttérképe lett, így minden Shell-alapú
   képernyő (régió-csomagok, Gyűjtemény, Ranglista, Irányítópult, kvízek)
   automatikusan megkapja; a `LevelShell` (régió-képernyők) is megkapta
   ugyanezt (korábban ez volt a hiányzó láncszem); az egérmozgás-parallax
   eltávolítva az `AnimatedLandingBg`-ből; a korábban tömör hátterű
   kártyák/gombok most áttetszők (Collection, Leaderboard, Dashboard,
   régió "Vissza/Újra" gomb); XP-pill áthelyezve a jobb felső ikonok mellé;
   4 új dínókép aktiválva (Gasparinisaura, Camarasaurus, Triceratops,
   Parasaurolophus)

## Nyitott, még nem lezárt szálak

- **`eotrachodon.jpg` és `elopteryx.jpg`** az `assets/images/` mappában
  megvannak, de **egyik sem szerepel** a 111 elemes adatbázisban
  (`data/111 db.csv`) — valószínűleg árva fájlok. Nincs hozzájuk
  `imageMap.js` bejegyzés. Ha kiderül, mihez tartoznak, pótolni kell.
- **`kentrosaurus2.jpg`** megmaradt a mappában használaton kívül (a user a
  régi `kentrosaurus.jpg`-t kérte vissza) — nincs törölve, csak nincs
  bekötve.
- A "Quiz Game" mappa (`C:\Users\Ryzen\Quiz Game`) egy **teljesen külön
  projekt** (Godot-alapú dínó-kvíz játék + PHP backend), amit korábban
  elemeztünk és egy Supabase-migrációs tervet is készítettünk hozzá — ez
  független a DinoApp munkától, a user épp egyeztet róla a csapatával,
  "folytassuk a DinoAppal" utasítással parkoltattuk.

## Referencia — a mai session főbb technikai döntései

- `react-native-svg` (`SvgXml`) a világtérképhez; a nyers SVG JS
  string-ként generálva (`src/constants/worldMapSvg.js`), mert nincs élő
  SVG-transformer a Metro configban.
- A hangman-kép végül **nem** SVG lett (az eredeti `hangman_trex.svg` 1.9MB,
  3226 path, szemantikus csoportosítás nélkül) — helyette egy sima PNG
  (`assets/6.png`, 6-panelos aszteroida-becsapódás sprite-csík), amit
  `Image` komponens + pozíció-eltolás mutat kockánként.
- `Caprasimo_700` és `Figtree_600SemiBold` új Google Fonts csomagok
  (`@expo-google-fonts/caprasimo`, `@expo-google-fonts/figtree`).
- A CLAUDE.md szabálya szerint a dínók **tudományos neve** mindig
  `Cinzel_700Bold`-ot kap — ez az akasztófa-játék megoldás-képernyőjén be
  van tartva.
