@AGENTS.md
# Projekt Környezet & Architektúra Szabályok: DínóTudós App

RESPONSE DEFAULTS (apply to every reply unless I override):
- Answer directly. No preamble, filler, affirmations, or trailing summary clauses.
- Always use continuous prose (running text) for explanations and answers. Avoid bulleted or numbered lists completely. No decorative headers for short answers.
- Do not use Extended Thinking or web search unless my prompt is explicitly complex or time-sensitive.
- If a task is simple (formatting, grammar, short translation), note once that Haiku may suffice.
- At 15+ messages, offer once to summarize key context for a fresh chat.
- If I request a correction, note once that editing my last message saves tokens.

## 0. Áttekintés — mi ez az app?
A DínóTudós (Dínók Meg Minden — DMM) egy ingyenes, magyar nyelvű oktató alkalmazás gyerekeknek, amely dinoszauruszok és más őslények felfedezésén, gyűjtésén és kvízeken keresztül tanít. Regisztráció helyett a játékos egy egyedi, automatikusan generált becenevet választ (híres dínó neve + egy latin genus-végződés + egy véletlen szám kombinációja), ez azonosítja a Supabase `players` táblában és minden haladását/eredményét.

- **Régiók (6):** Kárpát-medence, Európa, Afrika, Ázsia, Dél-Amerika, Észak-Amerika. Mindegyik csomagokra (pack) bontva, csomagonként záró kvízzel — legalább 80%-os eredmény kell a következő csomag feloldásához (hub-modell: a 6 régió egymástól függetlenül elérhető).
- **Gyűjtemény:** két nézetben böngészhető — a hagyományos csomagos rácsnézet (régió → csomag → lények), és egy "törzsfa idővonal" nézet, ahol mind a 111 lény a valódi korukhoz (millió évhez) igazított függőleges tengelyen, taxonómiai ág (Ornithischia öt ága, Saurischia két ága, plusz külön oszlop a pteroszauruszoknak) szerinti oszlopokban jelenik meg; zárolt lény ág-színre festett kérdőjellel, gyűjtött lény a kártyaképével látszik.
- **4 játékmód:** Párok (memóriajáték, 3 nehézségi szint: kezdő/haladó/profi), Ki vagyok én? (10 kérdéses kvíz, 3 élet), 5mp Képkvíz / Villámkvíz (10 kérdés, kérdésenként 5 másodperc), XP Milliomos (15 kérdéses, egyre nehezedő lépcső — egy rossz válasz azonnal véget vet a körnek).
- **XP-rendszer:** minden helyes válasz/győzelem XP-t ad; ez jelenleg csak az adott eszközön (AsyncStorage), nem a szerveren tárolódik.
- **Ranglisták:** játékmódonként (és a Párok esetén nehézségi szintenként is) külön, kizárólag hibátlan (0 hibás lépés/válasz) futásokból, "összes idő" és "heti" bontásban; ezen felül egy külön ranglista arra, ki mennyi idő alatt érte el az 1000 XP-t (a fiók létrehozásától számítva). Új személyes rekordnál vagy Top 10-be kerülésnél tűzijáték-animáció ünnepel.
- **Analitika:** minden játékmód-indítás és -befejezés naplózva van (`game_events`), hogy látszódjon, melyik játékmódot játsszák a legtöbben.

Platform: React Native (Expo), egyszerre fut webes és natív mobil nézetben; webes asztali böngészőben fix telefon-szélességű középső sávban jelenik meg, két oldalt AdSense-hirdetési hellyel (lásd `Shell` komponens lejjebb).

## 1. Technológiai Stack & Korlátok
- **Keretrendszer:** React Native (Expo v51.0.0, managed workflow).
- **Adatbázis & Backend:** Supabase (PostgreSQL). A kliensoldali lokális JSON fájlok helyét az aszinkron Supabase API hívások veszik át, így minden lekérésnél kötelező a betöltési állapotok (loading) és a hálózati hibák kezelése.
- **Hangszerkezet:** `expo-av` alapú Audio rendszer. Fontos szabály: A hangok némítása globálisan az `isSoundMuted` változón keresztül történik (React Context / Global State), ezt minden hangfájl lejátszása előtt kötelező ellenőrizni!
- **Betűtípusok:** `Cinzel_700Bold` (kizárólag a dínók tudományos nevéhez) és `Roboto_400Regular`, `Roboto_700Bold` (minden más általános szöveghez). Új komponensek létrehozásakor vagy módosításakor figyelni kell a `fontFamily` explicit beállítására a szöveges elemeken (vagy egyedi közös Text wrapper komponens használatára).
- **Kijelző & Elrendezés:** Az alkalmazás tartalmaz egy `Shell` komponenst a webes nézet támogatásához (asztali böngészőben fix telefon-szélesség, két oldalt AdSense hirdetési sávok). Új képernyőket mindig a `Shell` komponensbe kell ágyazni!

## 2. Adatstruktúra & Relációk
- **Fő Adatmodell:** A lények központi tárolója a Supabase `creatures` táblája. A valódi oszlopnevek `common_name` (magyar név) és `scientific_name` (tudományos név) — a `name_hu`/`name_latin`/`nev_koznapi`/`nev_tudomanyos` csak kliensoldali aliasok, amiket a `creaturesService.js` `adaptCreature()` függvénye hoz létre visszafelé kompatibilitás miatt. Egyéb fontos mezők: `mya_start`/`mya_end` (kor millió évben), `edu` (régió-szám), `pack_number` (csomag, 100 = "még nincs pakkban"), `rend`/`alrend`/`csalad` (taxonómia, ez adja a törzsfa idővonal ágait), `rarity`. A lekéréseknél a szűrést és a keresést közvetlenül az adatbázis szintjén kell elvégezni.
- **Játékos-táblák:** `players` (id uuid, `nickname` unique, `created_at`) az egyedi azonosító; `player_progress` (régiónkénti feloldás/streak), `player_cards` és `memory_results` (Párok-specifikus, `nickname` alapján, nem `player_id`-vel — inkonzisztens a többivel, ismert eltérés) tárolja a haladást és eredményeket.
- **Ranglisták & analitika:** `leaderboard_entries` (`player_id`, `region` nullable, `level_type` — pl. `memory_1/2/3`, `whoami`, `lightning`, `millionaire` —, `completion_time_ms`, `achieved_at`) az időalapú, csak hibátlan futásokból épülő ranglistákhoz; `xp_milestones` (`player_id`, `milestone`, `achieved_at`, unique(player_id, milestone)) az "ennyi idő alatt ért el X XP-t" ranglistához; `game_events` (`player_id`, `game_type`, `region`, `edu_level`, `started_at`, `completed_at`) minden játékindítás/-befejezés naplózására.
- **Egyéb:** `quiz_questions`, `creature_families_hu` (`csalad` → `csalad_hu` fordítás). Az összetett lekérdezéseknél a Supabase foreign key hivatkozásait és joinjait kell alkalmazni — de figyelem: nem minden fenti FK-szerű oszlopnak van formális DB-szintű foreign key constraintje, ezért a `leaderboardService.js`/`xpMilestonesService.js` szándékosan két külön lekérdezéssel, kliensoldalon joinolja össze a `nickname`-eket a `player_id`-khoz, nem PostgREST embedded select-tel.