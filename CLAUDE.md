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
- **5 játékmód:** Párok (memóriajáték, 3 nehézségi szint: kezdő/haladó/profi), Ki vagyok én? (10 kérdéses kvíz, 3 élet), 5mp Képkvíz / Villámkvíz (10 kérdés, kérdésenként 5 másodperc), XP Milliomos (15 kérdéses, egyre nehezedő lépcső — egy rossz válasz azonnal véget vet a körnek), Dínófutam (vízszintes, 3 egymás alatti sávos ügyességi futójáték — kerülgetni kell a sziklákat/skorpiókat, be kell kapni a húsdarabokat XP-ért, a pálya egyre gyorsul).
- **XP-rendszer:** minden helyes válasz/győzelem XP-t ad; elsődlegesen AsyncStorage-ban él (azonnali olvasás), de a `player_progress.xp` oszlopba is mentődik (`saveXPToServer`), bejelentkezéskor/regisztrációkor a szerver felülírja a lokálisat (`syncXPFromServer`) — így eszközváltás után sem vész el.
- **Ranglisták:** játékmódonként (és a Párok esetén nehézségi szintenként is) külön, kizárólag hibátlan (0 hibás lépés/válasz) futásokból, "összes idő" és "heti" bontásban; ezen felül egy külön ranglista arra, ki mennyi idő alatt érte el az 1000 XP-t (a fiók létrehozásától számítva). Új személyes rekordnál vagy Top 10-be kerülésnél tűzijáték-animáció ünnepel.
- **Analitika:** minden játékmód-indítás és -befejezés naplózva van (`game_events`), hogy látszódjon, melyik játékmódot játsszák a legtöbben.

## 1. Kódolási Szabályok & Ismert Eltérések
- **Hangok:** A hangok némítása globálisan az `isSoundMuted` változón keresztül történik — ezt minden hangfájl lejátszása előtt kötelező ellenőrizni!
- **Shell-be ágyazott komponensek:** A `Shell`-be ágyazott képernyő legkülső `container` View-jának explicit `width: '100%'` kell; különben a wide-web módban az `alignItems: 'center'` miatt a tartalom zsugorodik helyett hogy kitöltené a rendelkezésre álló helyet (ismert hiba: Dínófutam pálya).
- **Adatmodell:** `creatures` táblában `common_name` és `scientific_name` az elsődleges oszlopok; kliensoldali aliasokat az `adaptCreature()` függvény hoz létre (visszafelé kompatibilitás). `player_cards` és `memory_results` a `nickname` alapján indexeltek (ismert inkonzisztencia), nem `player_id`-vel.

## Agent skills

### Issue tracker

Issues live as GitHub issues in `dinokmegminden-stack/dinoapp`, via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context layout — `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.