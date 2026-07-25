# DínóKép stílus-referencia

Ez a fájl rögzíti a DínóTudós kártyaképek vizuális kánonját. A promptnak
ANGOLUL kell szólnia a képgenerátorhoz (Gemini jobban követi), de a
lény-tényeket a Supabase magyar/latin adataiból vesszük.

## A legfontosabb elv: EDIT, nem új generálás
A munkafolyamat **image-to-image szerkesztés**: a felhasználó egy meglévő
dínó-képet (Wikipedia life restoration) csatol Geminibe, és a prompt arra
utasítja a modellt, hogy azt SZERKESSZE, ne generáljon újat. A dínó maradjon
**90-95%-ban változatlan** — anatómia, színek, arányok, póz megőrizve.

Miért: a kártyasorozat lényege a **helyes ember-állat méretarány**. A kép célja,
hogy a néző a dínó mellett egy léptékhelyes emberi alakot lásson, és felfogja a
valódi méretét. Ezért a dínót nem újrarajzoljuk (az torzítaná az anatómiát és a
méretet), hanem a meglévő, hiteles ábrázolást megtartjuk, és köré tesszük a
korhű környezetet + egy **arányosan pontos** emberi figurát.

## Fix kánon (soha ne térj el)
- **Szerkesztés:** mindig a csatolt képet módosítsd, a dínó 90-95%-ban változatlan.
- **Képarány:** 16:9 fekvő (a `TradingCard` képhelye `aspectRatio: 16/9`).
- **Stílus:** "Jurassic World: Camp Cretaceous" félig realisztikus, részletes
  animált stílus, mint a sorozatban — NEM fotorealisztikus, NEM blueprint-vázlat.
- **Környezet:** korhű, MINIMÁLIS növényzet (period_hu/epoch + region_hu alapján).
  Ne legyen dús dzsungel — a lényeg a lény és a lépték, nem a háttér.
- **Fókusz:** a dínó a főszereplő; az emberi figura léptékhelyesen, jól láthatóan.

## Emberi figura — a lépték a lényeg (diet × méret)
Egy modern paleontológus, **arányosan pontos** mérettel — EZ adja az
összehasonlítást. A viselkedés nem csak a diettől függ, hanem a valós
méretaránytól is, hogy hihető legyen: egy 12 m-es ragadozó elől menekülni
logikus, de egy 1 m-es ragadozónál az ember a nagyobb, ezért nem retteg, hanem
óvatosan megfigyel.

A `query-creature.js` ezt a mátrixot KÉSZEN kiszámolja, és a
`derived.human_clause` mezőben egy kész angol mondatot ad — a promptba ezt kell
egy az egyben behelyettesíteni. Nem kell magadnak összerakni. A logika (átlátásra):

| | small (<1.5 m) | medium (1.5–3 m) | large (>3 m) |
|---|---|---|---|
| **ragadozó** | ember fölényben, óvatosan tanulmányozza | ember óvatosan hátrál | ember rémülten menekül |
| **nem ragadozó** | ember nyugodtan megfigyeli | ember nyugodtan megfigyeli | ember áhítattal felnéz rá |

A nemet (`derived.paleontologist_gender`, `nő`→female / `férfi`→male) a szkript
már beírta a mondatba — determinisztikus, ne bíráld felül. Ismeretlen hossznál a
méretosztály `medium`.

## Angol prompt-sablon
A `[...]` helyekre a DB-adat és a `derived` levezetés kerül. A `discovered_country`
és a `period_hu`/`epoch_hu` angol megfelelőjét írd be (pl. "Kréta"+"késő" →
"Late Cretaceous"; "Dél-Amerika"/"Argentína" → "South America (Argentina)").
A hosszhoz a `length_m_max`-ot használd (ha nincs, a `length_m_min`-t).

```
Edit the attached image instead of generating a new one. Keep the dinosaur
90-95% unchanged. Preserve the original dinosaur artwork, anatomy, colors,
proportions, and pose.

A "Jurassic World: Camp Cretaceous"-style animated depiction of the
[scientific_name] dinosaur in a natural [English era] environment with minimal,
era-appropriate vegetation. The image is composed in a 16:9 widescreen aspect
ratio. The dinosaur is rendered in the same semi-realistic, detailed animated
art style as the show — not photorealistic, not a blueprint sketch.

[derived.human_clause — a szkript kész angol mondata ide, egy az egyben]

The dinosaur's length is approximately [length] meters. The focus is on the
dinosaur, with the human character clearly visible for scale.
```

## Referencia-kép = a szerkesztendő alap
A prompt mellé MINDIG adj egy Wikipedia/Wikimedia "life restoration" kép-URL-t
a fajra (`scientific_name` a legjobb kulcs). Ez NEM csak referencia — EZT csatolja
a felhasználó Geminibe, és EZT szerkeszti a modell. Ezért olyan képet válassz,
ami tiszta, jól látható, egész-testes ábrázolás. Ha nincs jó life restoration,
jelezd, hogy a felhasználó keressen jobbat — csontváz/vázlat rossz alap az
edithez. A teljes felbontású URL-t add (a Wikimedia thumb-oknál dobd le a
`/thumb/.../###px-` részt).
