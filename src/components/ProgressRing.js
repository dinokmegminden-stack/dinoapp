// ProgressRing — kis kör alakú haladásjelző (SVG). A `ratio` (0..1) szerinti
// ív rajzolódik a track fölé; a gyerek (pl. százalék-szöveg) középre kerül.
import React from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

export default function ProgressRing({
  size = 40,
  stroke = 3.5,
  ratio = 0,
  color = '#aebf92',
  trackColor = 'rgba(254,250,224,0.15)',
  bgColor = null,
  children,
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, ratio));
  const dash = c * clamped;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        {!!bgColor && <Circle cx={size / 2} cy={size / 2} r={r - stroke / 2} fill={bgColor} />}
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={trackColor} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          // 12 óra pozícióból indul, óramutató irányban
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {children}
    </View>
  );
}
