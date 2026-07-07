import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import { COLORS } from '../constants/colors';
import { FONTS } from '../constants/fonts';

const REGIONS = [
  { id: 1, label: '🦴 Kárpát-medence', color: '#606C38' },
  { id: 2, label: '🦕 Európa', color: '#8B9D3D' },
  { id: 3, label: '🌍 Afrika', color: '#A4AC86' },
  { id: 4, label: '🪶 Ázsia', color: '#9CAF5E' },
  { id: 5, label: '🦖 Amerika', color: '#B5C99A' },
];

export default function InteractiveWorldMap({ onSelectRegion }) {
  const { width } = useWindowDimensions();
  const [hoveredRegion, setHoveredRegion] = useState(null);

  const mapWidth = Math.min(width - 40, 600);
  const mapHeight = (mapWidth / 1200) * 700; // Maintain 1200:700 aspect ratio

  const handleRegionClick = (regionId) => {
    onSelectRegion?.(regionId);
  };

  const handleRegionHover = (regionId, isHover) => {
    if (Platform.OS === 'web') {
      setHoveredRegion(isHover ? regionId : null);
    }
  };

  // For web, render actual SVG with interactivity
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <svg
          viewBox="0 0 1200 700"
          width={mapWidth}
          height={mapHeight}
          style={{ cursor: 'pointer' }}
        >
          {/* Background */}
          <rect width="1200" height="700" fill="#283618" />

          {/* Kárpát-medence (1) */}
          <g
            id="region-1"
            onMouseEnter={() => handleRegionHover(1, true)}
            onMouseLeave={() => handleRegionHover(1, false)}
            onClick={() => handleRegionClick(1)}
            style={{
              cursor: 'pointer',
              opacity: hoveredRegion === null || hoveredRegion === 1 ? 1 : 0.6,
              transition: 'opacity 0.2s',
            }}
          >
            <rect x="380" y="240" width="90" height="80" fill="#606C38" opacity="0.7" />
            <text x="425" y="285" textAnchor="middle" fontSize="14" fill="#FEFAE0" fontWeight="bold">
              🦴
            </text>
          </g>

          {/* Európa (2) */}
          <g
            id="region-2"
            onMouseEnter={() => handleRegionHover(2, true)}
            onMouseLeave={() => handleRegionHover(2, false)}
            onClick={() => handleRegionClick(2)}
            style={{
              cursor: 'pointer',
              opacity: hoveredRegion === null || hoveredRegion === 2 ? 1 : 0.6,
              transition: 'opacity 0.2s',
            }}
          >
            <rect x="320" y="180" width="280" height="120" fill="#8B9D3D" opacity="0.7" />
            <text x="460" y="240" textAnchor="middle" fontSize="16" fill="#FEFAE0" fontWeight="bold">
              🦕
            </text>
          </g>

          {/* Afrika (3) */}
          <g
            id="region-3"
            onMouseEnter={() => handleRegionHover(3, true)}
            onMouseLeave={() => handleRegionHover(3, false)}
            onClick={() => handleRegionClick(3)}
            style={{
              cursor: 'pointer',
              opacity: hoveredRegion === null || hoveredRegion === 3 ? 1 : 0.6,
              transition: 'opacity 0.2s',
            }}
          >
            <rect x="480" y="340" width="200" height="240" fill="#A4AC86" opacity="0.7" />
            <text x="580" y="470" textAnchor="middle" fontSize="16" fill="#FEFAE0" fontWeight="bold">
              🌍
            </text>
          </g>

          {/* Ázsia (4) */}
          <g
            id="region-4"
            onMouseEnter={() => handleRegionHover(4, true)}
            onMouseLeave={() => handleRegionHover(4, false)}
            onClick={() => handleRegionClick(4)}
            style={{
              cursor: 'pointer',
              opacity: hoveredRegion === null || hoveredRegion === 4 ? 1 : 0.6,
              transition: 'opacity 0.2s',
            }}
          >
            <rect x="700" y="200" width="350" height="220" fill="#9CAF5E" opacity="0.7" />
            <text x="875" y="310" textAnchor="middle" fontSize="16" fill="#FEFAE0" fontWeight="bold">
              🪶
            </text>
          </g>

          {/* Amerika (5) */}
          <g
            id="region-5"
            onMouseEnter={() => handleRegionHover(5, true)}
            onMouseLeave={() => handleRegionHover(5, false)}
            onClick={() => handleRegionClick(5)}
            style={{
              cursor: 'pointer',
              opacity: hoveredRegion === null || hoveredRegion === 5 ? 1 : 0.6,
              transition: 'opacity 0.2s',
            }}
          >
            <rect x="80" y="200" width="140" height="160" fill="#B5C99A" opacity="0.7" />
            <rect x="120" y="380" width="100" height="180" fill="#B5C99A" opacity="0.7" />
            <text x="150" y="290" textAnchor="middle" fontSize="16" fill="#FEFAE0" fontWeight="bold">
              🦖
            </text>
          </g>
        </svg>

        {/* Legend */}
        <View style={styles.legend}>
          {REGIONS.map((region) => (
            <View key={region.id} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: region.color }]} />
              <Text style={styles.legendLabel}>{region.label}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  }

  // For mobile/native, use TouchableOpacity buttons instead
  return (
    <View style={styles.mobileContainer}>
      {REGIONS.map((region) => (
        <TouchableOpacity
          key={region.id}
          style={[styles.mobileBtn, { borderColor: region.color }]}
          onPress={() => handleRegionClick(region.id)}
        >
          <Text style={[styles.mobileBtnText, { color: region.color }]}>{region.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 24,
  },
  legend: {
    marginTop: 16,
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendLabel: {
    color: '#FEFAE0',
    fontFamily: FONTS.body,
    fontSize: 12,
  },
  mobileContainer: {
    gap: 12,
    paddingHorizontal: 20,
    marginVertical: 16,
  },
  mobileBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: 'rgba(254,250,224,0.05)',
    alignItems: 'center',
  },
  mobileBtnText: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
