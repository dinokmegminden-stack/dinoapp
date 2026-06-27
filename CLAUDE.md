@AGENTS.md
# Projekt Környezet & Architektúra Szabályok: DínóTudós App

## 1. Technológiai Stack & Korlátok
- **Keretrendszer:** React Native (Expo v54.0.0, managed workflow).
- **Hangszerkezet:** `expo-av` alapú Audio rendszer. Fontos szabály: A hangok némítása globálisan az `isSoundMuted` változón keresztül történik, ezt minden hangfájl lejátszása előtt kötelező ellenőrizni!
- **Betűtípusok:** `Cinzel_700Bold` (kizárólag a dínók tudományos nevéhez) és `Roboto_400Regular`, `Roboto_700Bold` (minden más általános szöveghez). Új komponensek létrehozásakor vagy módosításakor figyelni kell a `fontFamily` explicit beállítására.
- **Kijelző & Elrendezés:** Az alkalmazás tartalmaz egy `Shell` komponenst a webes nézet támogatásához (asztali böngészőben fix telefon-szélesség, két oldalt AdSense hirdetési sávok). Új képernyőket mindig a `Shell` komponensbe kell ágyazni!

## 2. Adatstruktúra & Navigáció
- **Egységes Adatmodell:** Minden régió (Kárpát-medence, Európa, Afrika) JSON adatbázisa (`dinosaurs.json`, `karpatok.json`) teljesen azonos, lapos tömb struktúrával rendelkezik.
- **Állapotkezelés:** A navigáció deklaratív, a fő `App.js` komponensben lévő `view` és `region` state-ek vezérlik (`landing`, `nickname`, `packages`, `packageBrowse`, `packageQuiz`).
- **Progress:** A haladást a `regionProgress.js` kezeli, a mentés `AsyncStorage`-ba történik a felhasználó beceneve (`nickname`) alapján.

## 3. Stratégiai Célok & Refaktorálási Irányelvek (Claude részére)
- **Közös Kvízmotor:** Tervben van a kvízek egységesítése. Új kvízlogika írásakor vagy módosításakor törekedj az absztrakcióra, hogy a kód alkalmas legyen egy későbbi, közös kvízmotorba való beolvadásra.
- **Kód Duplikáció Csökkentése:** A `Level1Karpat`, `Level2Europa` és `Level3Afrika` mappákban lévő képernyők (Packages, Browse, Quiz) jelenleg duplikált logikát tartalmaznak. Ha új funkciót fejlesztesz, vagy meglévőt módosítasz, mindig tegyél javaslatot a komponensek generikussá tételére és kiemelésére, hogy a régiók dinamikusan, paraméterezve kaphassák meg a saját tartalmaikat.
- **Képek Kezelése:** A dínó kártyák képeit az `IMAGE_MAP` objektumból kell kiszedni a dínó tudományos neve (`nev_tudomanyos`) alapján. Ha nincs találat, explicit módon fallback emojit kell alkalmazni a csoport alapján (pl. sauropoda esetén 🦕, theropoda esetén 🦖).