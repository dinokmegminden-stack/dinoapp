import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, useWindowDimensions } from 'react-native';
import { IMAGE_MAP } from '../../constants/imageMap';
import DinoCard from '../../components/DinoCard';
import LevelShell from './LevelShell';
import { s } from './RegionLevel.styles';

// LevelShell (16px) + ez a ScrollView (14px) vízszintes paddingje eddig
// összesen 30px rést hagyott mobilon a kártya és a telefon széle közt.
// Mobilon ezt a rést kioltjuk negatív margóval, hogy a kártyalap a
// képernyő széléig érjen — a számláló sor (s.browseCounterRow) saját
// paddingja érintetlen marad, csak a kártyát tartalmazó ScrollView
// bővül ki a LevelShell teljes szélességéig.
const MOBILE_BREAKPOINT = 700;

export default function BrowseScreen({ csomag, packages, onStartQuiz, onBack }) {
  const pkg = packages.find((p) => p.csomag === csomag);
  const dinos = pkg?.dinos || [];
  const [index, setIndex] = useState(0);
  const { width } = useWindowDimensions();
  const isMobile = width < MOBILE_BREAKPOINT;

  const dino = dinos[index];
  const isLastDino = index === dinos.length - 1;

  const handleNext = () => {
    if (isLastDino) {
      onStartQuiz();
    } else {
      setIndex((i) => Math.min(dinos.length - 1, i + 1));
    }
  };

  return (
    <LevelShell>
      {/* A léptetés a DinoCard saját, képre helyezett nyilaival történik —
          nem oldalsó gombokkal, mert azok mobilon annyi szélességet
          vittek el, hogy a kártya tartalma (név, statisztikák) alig fért ki.
          Progress a lebegő pontokkal jelenik meg a kártyán. */}
      <ScrollView
        style={isMobile && { marginHorizontal: -16 }}
        contentContainerStyle={{
          paddingVertical: 14,
          paddingHorizontal: isMobile ? 0 : 14,
          flexGrow: 1,
        }}
      >
        {dino && (
          <DinoCard
            dino={dino}
            imageSource={IMAGE_MAP[dino.name_hu] || null}
            onPrevious={() => setIndex((i) => Math.max(0, i - 1))}
            onNext={handleNext}
            isFirstDino={index === 0}
            isLastDino={false}
            nextIcon={isLastDino ? '▶' : '›'}
            currentIndex={index + 1}
            totalCount={dinos.length}
          />
        )}
      </ScrollView>

      <TouchableOpacity onPress={onBack} style={s.bottomBackLink}>
        <Text style={s.backLinkText}>← Csomagok</Text>
      </TouchableOpacity>
    </LevelShell>
  );
}
