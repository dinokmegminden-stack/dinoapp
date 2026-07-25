---
name: dino-image-prompt
description: >-
  Egységes, stílus-zárolt Gemini képgenerálási promptot állít össze a DínóTudós
  (DinoApp) kártyaképeihez, a Supabase `creatures` tábla élő adataiból. Használd
  MINDIG, amikor egy lényhez kártyakép / dínókép / illusztráció kell, amikor egy
  dínóhoz "hiányzik a kép", amikor egy kikommentelt `imageMap.js` bejegyzést kell
  képpel feltölteni, vagy amikor a felhasználó Gemini/képgenerátor promptot kér
  egy őslényhez — akkor is, ha nem mondja ki a "skill" szót. Kimenete kész angol
  prompt + Wikipedia referencia-kép URL, amit a felhasználó kézzel bemásol
  Geminibe. NEM hív képgeneráló API-t és NEM helyez el fájlt.
---

# DínóKép prompt-építő

## Mit csinál és mit nem
A DínóTudós 111 kártyaképe egy sorozat — a konzisztencia a lényeg. Ez a skill
egyetlen dínóhoz gyárt egy **kész, angol nyelvű Gemini promptot** a rögzített
vizuális kánon szerint, a lény valódi adataival (méret, kor, régió, étrend,
taxon) a Supabase-ből, plusz egy **Wikipedia life-restoration referencia URL-t**.

A tényleges képgenerálás KÉZI: a felhasználó bemásolja a promptot + a referencia
képet Geminibe, letölti az eredményt, és ő maga teszi az `assets/images/` mappába
(onnan a `sync-image-map.js` aktiválja az `imageMap.js` sort). Ez a skill fájlt
NEM ír a képhez és API-t NEM hív.

## Munkafolyamat

### 1. Lény azonosítása
Ha a felhasználó nevet adott, azt használd. Ha azt kérte, hogy egy "hiányzó
képű" lénnyel dolgozz, nézd meg a `src/constants/imageMap.js`-t: a `//`-vel
kikommentelt sorok a még kép nélküli lények. A sor kulcsa (idézőjelben) a
keresendő név.

### 2. Adatok lekérése a Supabase-ből
Futtasd a bundled szkriptet a repo gyökeréből (a `.env`-et és a
`@supabase/supabase-js`-t magától megtalálja):

```bash
node .claude/skills/dino-image-prompt/scripts/query-creature.js "Struthiosaurus"
```

JSON-t ír a `stdout`-ra. Fontos mezők: `common_name`, `scientific_name`,
`length_m_min/max`, `period_hu`, `mya_start/end`, `region_hu`, `csalad_hu`/`rend`,
`rarity`, `diet_hu/eng`, és a **`derived`** blokk, amit KÉSZEN kapsz:

- `derived.is_predator` — húsevő-e (ebből jön a figura hangulata).
- `derived.figure_mood` — magyar leírás: menekülő vagy nyugodt figura.
- `derived.paleontologist_gender` — `férfi`/`nő`, a névből determinisztikusan
  számolva (a sorozatban kb. fele-fele; ugyanaz a lény mindig ugyanazt kapja).
  Ne bíráld felül — pont ez adja a stabil váltakozást állapot nélkül.
- `derived.has_image_url` — van-e már `image_url` a DB-ben.

Ha a szkript több találatot vagy nulla találatot jelez, kérj pontosabb nevet
a felhasználótól, ne találgass.

### 3. Prompt összeállítása
Olvasd be a `references/style-guide.md`-t, és a benne lévő angol sablonból
építsd fel a promptot. A munkafolyamat **image-to-image EDIT**: a prompt első
mondata mindig arra utasít, hogy a modell a CSATOLT képet szerkessze, a dínót
90-95%-ban változatlanul hagyva. A cél a **helyes ember-állat méretarány** —
a figura arányosan pontos. A kánon (edit-in-place, 16:9, Camp Cretaceous stílus,
diet-vezérelt figura, korhű minimális növényzet) KÖTÖTT.

Lényspecifikus behelyettesítés a lekért adatból: `scientific_name`; a hossz a
`derived.length_m`; az **emberi figura egész mondatát a `derived.human_clause`
adja készen** — ezt egy az egyben másold a prompt DIET-sorába, ne rakd össze
magad (a diet × méret logikát és a nemet a szkript már elvégezte). A
`period_hu`/`epoch_hu`-t és a régiót/országot fordítsd angolra (pl. "késő-kréta"
→ "Late Cretaceous"; "Dél-Amerika"/"Argentína" → "South America (Argentina)").

### 4. Referencia-kép = a szerkesztendő alap
Keress a fajra egy Wikipedia/Wikimedia **life restoration** képet (a
`scientific_name` a legjobb kulcs), és add meg a **teljes felbontású** kép-URL-t
(a Wikimedia thumb-nál dobd le a `/thumb/.../###px-` részt). Ez NEM csak
anatómiai referencia — EZT csatolja a felhasználó Geminibe, és EZT szerkeszti a
modell, ezért tiszta, egész-testes, jól látható kép kell. Ha nincs jó life
restoration (csak csontváz/vázlat van), jelezd, hogy az rossz alap az edithez, és
kérd, hogy a felhasználó keressen jobbat.

### 5. Kimenet a felhasználónak
Add ki egyben, másolható blokkban:
1. a kész **angol prompt** (edit-utasítással kezdve),
2. a **referencia-kép URL** — hangsúlyozd: EZT csatolja Geminibe, ezt szerkeszti,
3. egy rövid magyar összefoglaló a döntésekről (méret, kor, régió, ragadozó-e,
   figura neme) — hogy a felhasználó egy pillantással ellenőrizhesse, jó
   adatból dolgoztunk-e.

Röviden emlékeztesd: a képet neki kell legenerálnia Geminiben, majd
`assets/images/<kulcs kisbetűvel>.jpg` néven elmentenie; a `sync-image-map.js`
(vagy `npm run sync-images`) aktiválja az `imageMap.js` sort.

## Elv
A stílus stabilitása fontosabb a kreatív variációnál — a sorozat egységessége a
termék. Ha a felhasználó eltérést kér (más stílus, portré, ember nélkül), az
rendben van, de jelezd, hogy kilóg a kártyasorozatból, és a kánont csak
szándékosan lépd át.
