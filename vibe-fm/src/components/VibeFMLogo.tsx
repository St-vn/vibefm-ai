import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/tokens';

interface Props {
  size?: 'sm' | 'md' | 'lg';
}

const SIZES = {
  sm: { barH: [10, 16, 8, 20, 13, 7],  barW: 2, barGap: 3, textSize: 18, starSize: 10, logoGap: 8 },
  md: { barH: [12, 20, 10, 26, 16, 8],  barW: 2.5, barGap: 3.5, textSize: 22, starSize: 12, logoGap: 9 },
  lg: { barH: [14, 24, 12, 30, 20, 10], barW: 3, barGap: 4, textSize: 28, starSize: 15, logoGap: 11 },
};

export default function VibeFMLogo({ size = 'md' }: Props) {
  const { barH, barW, barGap, textSize, starSize, logoGap } = SIZES[size];
  const maxH = Math.max(...barH);

  return (
    <View style={styles.row}>
      {/* Equalizer waveform icon */}
      <View style={[styles.icon, { height: maxH }]}>
        {barH.map((h, i) => (
          <View
            key={i}
            style={{
              width: barW,
              height: h,
              backgroundColor: colors.cyan,
              borderRadius: 1,
              marginLeft: i === 0 ? 0 : barGap,
              opacity: 0.9,
            }}
          />
        ))}
      </View>

      <View style={{ width: logoGap }} />

      {/* Wordmark */}
      <Text style={[styles.wordmark, { fontSize: textSize }]}>vibe.fm</Text>

      {/* Purple AI sparkle — superscript */}
      <Text style={[styles.star, { fontSize: starSize }]}>✦</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wordmark: {
    color: colors.textPrimary,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  star: {
    color: colors.purple,
    marginLeft: 2,
    marginBottom: 8, // superscript lift
    lineHeight: 16,
  },
});
