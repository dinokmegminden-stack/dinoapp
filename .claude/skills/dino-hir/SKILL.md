---
name: dino-hir
description: >-
  A DínóTudós (DinoApp) "Dínós Hírek" bejegyzéseit gyártja: a felhasználó bemásol
  egy ~10 mondatos, magyar (vagy idegen nyelvű) szöveget egy ÚJ őslény-felfedezésről,
  a skill pedig kinyeri a strukturált mezőket és két kész SQL-parancsot állít elő —
  egy `creatures` INSERT/UPDATE-et (a lény felvétele/frissítése) és egy `dino_news`
  INSERT-et (maga a hír, a lényhez kötve). Használd MINDIG, amikor a felhasználó egy
  új dínóról/őslényről szóló hírszöveget másol be, "hírt csinálnánk belőle", "vidd fel
  Supabase-be", vagy új fajt akar felvenni a gyűjteménybe — akkor is, ha nem mondja ki
  a "skill" szót. NEM ír közvetlenül a Supabase-be: kész SQL-t ad, amit a felhasználó
  a Supabase SQL editorban futtat le.
---

# Dínós Hír-építő

## Mit csinál és mit nem
Bemenet: egy szabad szöveges hír egy őslény-felfedezésről (jellemzően ~10 mondat).
Kimenet: **két kész SQL-blokk** — (1) `creatures` INSERT (vagy UPDATE, ha a faj már
létezik) a kinyerhető mezőkkel, (2) `dino_news` INSERT a teljes hírszöveggel, a
lényhez `creature_id`-vel kötve. Plusz egy rövid lista a **ki nem tölthető mezőkről**.

A skill DB-t NEM ír közvetlenül (az anon kulcs csak olvas / RLS tiltja az írást).
A felhasználó a Supabase **SQL editorban** futtatja a kapott parancsokat. A hírszöveget
SOHA nem írjuk át/rövidítjük — szó szerint, `$$...$$` dollár-idézéssel kerül be.

## Előfeltétel: a `dino_news` tábla
Ha még nincs, a felhasználónak egyszer le kell futtatnia:

```sql
create table dino_news (
  id uuid primary key default gen_random_uuid(),
  published_at timestamptz not null default now(),
  scientific_name text,
  common_name text,
  news_text text not null,
  creature_id uuid references creatures(id),
  source_url text,
  image_url text,
  is_published boolean not null default true
);
create index on dino_news (published_at desc);
```
A skill mindig emlékeztessen erre egy sorban, de ne generálja újra, ha a felhasználó
jelezte, hogy már megvan.

## Mezők kinyerése a szövegből
Töltsd ki, amit a szöveg egyértelműen tartalmaz VAGY biztosan levezethető. Amit nem,
azt HAGYD KI (ne találj ki adatot) és sorold fel a végén. Guess-nél tegyél `-- ` kommentet.

- **scientific_name**: a latin binomiális név (pl. `Uragasaurus kalasinensis`).
- **common_name**: NE találj ki magyar nevet. Ha a szöveg tartalmaz valódi magyar
  köznapi nevet, tedd be; ha nincs, hagyd NULL-on. A megjelenített cím és a kép-kulcs
  amúgy is a **genus** (a `scientific_name` első fele, pl. `Uragasaurus`), nem a common_name —
  a `dino_news.common_name` opcionális/elhagyható.
- **mya_start / mya_end**: kor millió évben (pl. „150–145 millió éve" → start 150, end 145).
- **edu**: a régió-szám a lelőhely alapján — mapping:
  1 = Kárpát-medence · 2 = Európa · 3 = Afrika · 4 = Ázsia · 5 = Dél-Amerika · 6 = Észak-Amerika.
  Délkelet-/Kelet-/Közép-Ázsia, Kína, Thaiföld, Mongólia → 4. USA/Kanada → 6. Argentína/Brazília → 5.
- **pack_number**: alapból az AKTUÁLIS év utolsó két számjegye (2026 → 26), hacsak a
  felhasználó mást nem mond.
- **region_hu**: a régió magyar neve (az edu címkéje, pl. `Ázsia`).
- **era_hu / period_hu / epoch_hu**: földtörténeti kor. Mezozoikum; időszak Triász/Jura/Kréta;
  epocha pl. `késő-jura`, `kora-kréta`. Csak amit a szöveg megad.
- **diet_hu / diet_eng**: étrend. Sauropoda/hadrosaurida/ceratopsia → `növényevő`/`herbivore`;
  theropoda ragadozó → `ragadozó`/`carnivore`. Csak ha a szöveg vagy a taxon egyértelmű.
- **rend / alrend / csalad / csalad_hu**: taxonómia. Csak amit a szöveg kimond vagy biztos:
  - sauropoda → rend `Saurischia`, alrend `Sauropodomorpha`
  - theropoda → rend `Saurischia`, alrend `Theropoda`
  - a `csalad` a szövegben említett család (pl. `Mamenchisauridae`), `csalad_hu` a magyar
    alakja (`Mamenchisauridák`). Ha nincs kimondva, hagyd ki.
- **category** (KÖTELEZŐ, NOT NULL): a lény típusa. Értékkészlet: `dinosaur` (alap),
  `bird` (korai madár / Avialae, pl. `-ornis` végződés, „madárfaj"), `pterosaur`
  (repülő hüllő / pteroszaurusz). MINDIG töltsd ki — enélkül az INSERT elhasal.
- **discovered_country / geological_formation**: ország, földtani formáció, ha szerepel.
- **description_hu**: 1–2 mondatos tömör magyar leírás a lényről (NEM a teljes hír) — a
  legjellemzőbb vonások + lelőhely. Ne másold be az egész hírt ide.
- **Ne töltsd** (jellemzően nincs a hírben): `discovery_year`, `discoverer_name`, méret/tömeg
  mezők (`height_*`, `length_*`, `weight_*`), `rarity`, `latin_name_end`, `category`, `pbdb_*`.
  A `latin_name_end` (becenév-generátorhoz) ajánlott érték: a genus végződése, pl. `'saurus'` —
  javasold a végén, de csak akkor tedd az INSERT-be, ha a felhasználó kéri.

## Kimeneti formátum
Adj pontosan ezt, ebben a sorrendben:

1. Egy soros emlékeztető: fut-e már a `dino_news` create table (ha bizonytalan).
2. **`creatures` INSERT** — csak a kitöltött oszlopokkal, `$$...$$` a `description_hu`-hoz,
   `-- ` kommentek a guess-eknél.
3. **`dino_news` INSERT** — `scientific_name`, `news_text` ($$…$$, szó szerint), `creature_id`
   a `(select id from creatures where scientific_name = '…' limit 1)` alkérdéssel. A
   `common_name` NEM kötelező (hagyd ki, ha nincs valódi magyar név). A megjelenítéshez/képhez
   a genus kell — a kép-fájlt a `IMAGE_MAP`-ben a **genus** kulcsával kell felvenni (pl.
   `"Uragasaurus": require('.../uragasaurus.jpg')`); erre emlékeztesd a felhasználót egy sorban.
4. **UPDATE-változat** a `creatures`-re (ugyanazok a mezők, `where scientific_name = '…'`) —
   arra az esetre, ha a faj sora már létezik.
5. Rövid lista: mely mezőket nem lehetett kitölteni (kézi pótlás).

Fontos: a `creatures` INSERT-nek a `dino_news` INSERT ELŐTT kell lefutnia (a `creature_id`
alkérdés különben NULL-t ad). Ezt írd is oda egy sorban.

## Minta (Uragasaurus kalasinensis)
A `creatures` INSERT tölti: scientific_name, common_name (ideiglenes), edu=4, pack_number=26,
region_hu=Ázsia, era/period/epoch (Mezozoikum/Jura/késő-jura), mya 150/145, diet növényevő,
rend Saurischia, alrend Sauropodomorpha, csalad Mamenchisauridae / csalad_hu Mamenchisauridák,
discovered_country Thaiföld, geological_formation Phu Kradung Formáció, description_hu tömör.
A `dino_news` INSERT a teljes 10 mondatos szöveget viszi be, creature_id alkérdéssel.
