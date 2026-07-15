// Ideiglenes preview-képernyő az új TradingCard design megmutatásához —
// az Eoraptor adatai a data/db2db.csv-ből, kép nélkül (nincs eoraptor kép
// az assets/images mappában, lásd a kártya csont-ikon fallbackjét).
import React from 'react';
import { ScrollView } from 'react-native';
import Shell from '../components/Shell';
import TradingCard from '../components/TradingCard';

const EORAPTOR = {
  name_hu: 'Eoraptor',
  name_latin: 'Eoraptor lunensis',
  epoch: 'késő-triász',
  mya_min: 228,
  mya_max: 228,
  length_m_min: 1,
  length_m_max: 1,
  weight_kg_min: 5,
  weight_kg_max: 10,
  region: 'Dél-Amerika',
  description_hu:
    'Az Eoraptor a világ egyik legősibb és legprimitívebb ismert dinoszaurusza, amely a triász időszak hajnalán élt a mai Argentína vidékén. ' +
    'Ez a kistermetű, alig egy méter hosszú és macska súlyú állat rendkívül gyorsan és kecsesen futott a hátsó lábain. ' +
    'Mindenevő életmódot folytathatott, amit a szájában található hegyes ragadozó fogak és a növények csipegetésére alkalmas laposabb fogak keveréke is egyértelműen bizonyít.',
};

export default function TradingCardPreviewScreen() {
  return (
    <Shell>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 40 }}>
        <TradingCard dino={EORAPTOR} imageSource={null} cardNumber="No. 001" />
      </ScrollView>
    </Shell>
  );
}
