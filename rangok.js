export const AKADEMIAI_RANGLÉTRA = {
  "karpat-medence": {
    id: "karpat-medence",
    nev: "Kárpát-medence",
    dino_szam: 10,
    elerheto_rang: "Iskolás / Tanonc 🎒",
    vizsga_neve: "Alapfokú Természetismeret Felvételi",
    leiras: "A hazai alapok elsajátítása: a Mecsek jura kori lábnyomaitól a Bakony és Erdély kréta időszaki különlegességeiig.",
    szinterv: "Zöldellő, erdős, folyóvölgyes háttér (Bakony és a Hátszegi-szigetvilág hangulata)",
    csomagok: [
      {
        id: "km-szeminarium-1",
        nev: "Gyakorlati szeminárium I.",
        tipus: "szeminarium",
        dino_szam: 5,
        Kviz_neve: "1. sz. Zárthelyi Dolgozat (ZH)"
      },
      {
        id: "km-labor-1",
        nev: "Laborgyakorlat I.",
        tipus: "labor",
        dino_szam: 5, // A valóságban a fájlod alapján itt 6 lesz, de a kód dinamikusan kezeli
        kviz_neve: "2. sz. Zárthelyi Dolgozat (ZH)"
      }
    ]
  },

  "europa": {
    id: "europa",
    nev: "Európa",
    dino_szam: 25,
    elerheto_rang: "Gimnazista / Kutató-diák 📐",
    vizsga_neve: "Dínó-Érettségi",
    leiras: "Kilépünk a kontinensre! Ismerd meg az európai szigetvilágok és szárazföldek változatos faunáját.",
    szinterv: "Mérsékelt övi, tengerparti, sziklás táj",
    csomagok: [
      {
        id: "eu-terep-1",
        nev: "Terepmunka I.",
        tipus: "terepmunka",
        dino_szam: 5,
        kviz_neve: "3. sz. Zárthelyi Dolgozat (ZH)"
      },
      {
        id: "eu-szeminarium-2",
        nev: "Gyakorlati szeminárium II.",
        tipus: "szeminarium",
        dino_szam: 5,
        kviz_neve: "4. sz. Zárthelyi Dolgozat (ZH)"
      },
      {
        id: "eu-labor-2",
        nev: "Laborgyakorlat II.",
        tipus: "labor",
        dino_szam: 5,
        kviz_neve: "5. sz. Zárthelyi Dolgozat (ZH)"
      },
      {
        id: "eu-terep-2",
        nev: "Terepmunka II.",
        tipus: "terepmunka",
        dino_szam: 5,
        kviz_neve: "6. sz. Zárthelyi Dolgozat (ZH)"
      },
      {
        id: "eu-kutatas-1",
        nev: "Önálló Kutatási Projekt",
        tipus: "kutatas",
        dino_szam: 5,
        kviz_neve: "7. sz. Zárthelyi Dolgozat (ZH)"
      }
    ]
  },

  "afrika": {
    id: "afrika",
    nev: "Afrika",
    dino_szam: 10,
    elerheto_rang: "Egyetemi Hallgató / Diplómás 📜",
    vizsga_neve: "Egyetemi Államvizsga / Diploma",
    leiras: "Komolyabb expedíciós terep. Felkészültél a sivatagi és őserdei óriások csontvázainak feltárására?",
    szinterv: "Sivatagos, oázisos, vörös homokos háttér (észak-afrikai kréta folyórendszerek)",
    csomagok: [
      {
        id: "af-terep-3",
        nev: "Gondwanai Terepgyakorlat",
        tipus: "terepmunka",
        dino_szam: 5,
        kviz_neve: "8. sz. Zárthelyi Dolgozat (ZH)"
      },
      {
        id: "af-labor-3",
        nev: "Izolált Faunák Laboratóriuma",
        tipus: "labor",
        dino_szam: 5,
        kviz_neve: "9. sz. Zárthelyi Dolgozat (ZH)"
      }
    ]
  },

  "azsia": {
    id: "azsia",
    nev: "Ázsia",
    dino_szam: 20,
    elerheto_rang: "Doktorandusz / PhD Kutató 🔬",
    vizsga_neve: "Doktori Disszertáció Védés",
    leiras: "Tollas dinoszauruszok, különleges bizarr anatómiájú fajok, amik igazi tudományos precizitást igényelnek.",
    szinterv: "Tollas, sűrű erdős, vulkáni hamus táj (észak-kínai jura/kréta formációk)",
    csomagok: [
      {
        id: "as-szeminarium-3",
        nev: "Tollas Dínók Szeminárium",
        tipus: "szeminarium",
        dino_szam: 5,
        kviz_neve: "10. sz. Zárthelyi Dolgozat (ZH)"
      },
      {
        id: "as-terep-4",
        nev: "Gobi-sivatag Expedíció",
        tipus: "terepmunka",
        dino_szam: 5,
        kviz_neve: "11. sz. Zárthelyi Dolgozat (ZH)"
      },
      {
        id: "as-labor-4",
        nev: "Rendszertani Laboratórium",
        tipus: "labor",
        dino_szam: 5,
        kviz_neve: "12. sz. Zárthelyi Dolgozat (ZH)"
      },
      {
        id: "as-kutatas-2",
        nev: "Pre-doktori Kollokvium",
        tipus: "kutatas",
        dino_szam: 5,
        kviz_neve: "13. sz. Zárthelyi Dolgozat (ZH)"
      }
    ]
  },

  "amerika": {
    id: "amerika",
    nev: "Észak- és Dél-Amerika",
    dino_szam: 20,
    elerheto_rang: "DÍNÓPROFESSZOR (MTA Doktor) 👨‍🏫🎓",
    vizsga_neve: "Akadémiai Székfoglaló (Szigorlat)",
    leiras: "A legnagyobb, legnépszerűbb és legikonikusabb gigászok földje. A dínótudományok abszolút csúcsa.",
    szinterv: "Badlands hangulat, monumentális kanyonok, préri háttér",
    csomagok: [
      {
        id: "am-terep-5",
        nev: "Hell Creek & Morrison Expedíció",
        tipus: "terepmunka",
        dino_szam: 5,
        kviz_neve: "14. sz. Zárthelyi Dolgozat (ZH)"
      },
      {
        id: "am-szeminarium-4",
        nev: "Csúcsragadozók Szeminárium",
        tipus: "szeminarium",
        dino_szam: 5,
        kviz_neve: "15. sz. Zárthelyi Dolgozat (ZH)"
      },
      {
        id: "am-labor-5",
        nev: "Titanosauria Óriások Labor",
        tipus: "labor",
        dino_szam: 5,
        kviz_neve: "16. sz. Zárthelyi Dolgozat (ZH)"
      },
      {
        id: "am-kutatas-3",
        nev: "Professzori Kutatóműhely",
        tipus: "kutatas",
        dino_szam: 5,
        kviz_neve: "17. sz. Zárthelyi Dolgozat (ZH)"
      }
    ]
  }
};