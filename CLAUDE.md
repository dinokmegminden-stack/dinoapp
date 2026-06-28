@AGENTS.md
# Projekt Környezet & Architektúra Szabályok: DínóTudós App

“RESPONSE DEFAULTS (apply to every reply unless I override):
- Answer directly. No preamble, filler, affirmations, or trailing summary clauses.
- Always use continuous prose (running text) for explanations and answers. Avoid bulleted or numbered lists completely. No decorative headers for short answers.
- Do not use Extended Thinking or web search unless my prompt is explicitly complex or time-sensitive.
- If a task is simple (formatting, grammar, short translation), note once that Haiku may suffice.
- At 15+ messages, offer once to summarize key context for a fresh chat.
- If I request a correction, note once that editing my last message saves tokens.”

## 1. Technológiai Stack & Korlátok
- **Keretrendszer:** React Native (Expo v51.0.0, managed workflow).
- **Adatbázis & Backend:** Supabase (PostgreSQL). A kliensoldali lokális JSON fájlok helyét az aszinkron Supabase API hívások veszik át, így minden lekérésnél kötelező a betöltési állapotok (loading) és a hálózati hibák kezelése.
- **Hangszerkezet:** `expo-av` alapú Audio rendszer. Fontos szabály: A hangok némítása globálisan az `isSoundMuted` változón keresztül történik (React Context / Global State), ezt minden hangfájl lejátszása előtt kötelező ellenőrizni!
- **Betűtípusok:** `Cinzel_700Bold` (kizárólag a dínók tudományos nevéhez) és `Roboto_400Regular`, `Roboto_700Bold` (minden más általános szöveghez). Új komponensek létrehozásakor vagy módosításakor figyelni kell a `fontFamily` explicit beállítására a szöveges elemeken (vagy egyedi közös Text wrapper komponens használatára).
- **Kijelző & Elrendezés:** Az alkalmazás tartalmaz egy `Shell` komponenst a webes nézet támogatásához (asztali böngészőben fix telefon-szélesség, két oldalt AdSense hirdetési sávok). Új képernyőket mindig a `Shell` komponensbe kell ágyazni!

## 2. Adatstruktúra & Relációk
- **Fő Adatmodell:** A lények központi tárolója a Supabase `creatures` táblája. Minden rekord egyedi `id` (uuid), `name_hu` (text - magyar név), és `name_latin` (text - tudományos név) mezőkkel rendelkezik, a lekéréseknél a szűrést és a keresést közvetlenül az adatbázis szintjén kell elvégezni.
- **Kapcsolódó Táblák:** A kvízkérdések (`quiz_questions`), játékos kártyák (`player_cards`), játékos haladás (`player_progress`), felhasználók (`players`) és a ranglista (`leaderboard_entries`) relációs kapcsolatban állnak a törzsadatokkal, az összetett lekérdezéseknél a Supabase foreign key hivatkozásait és joinjait kell alkalmazni.