import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../theme/tokens';
import { Track } from '../types';

const BARS: { key: keyof Track; label: string }[] = [
  { key: 'energy', label: 'Energy' },
  { key: 'valence', label: 'Valence' },
  { key: 'danceability', label: 'Dance' },
  { key: 'acousticness', label: 'Acoustic' },
  { key: 'instrumentalness', label: 'Instrumental' },
  { key: 'speechiness', label: 'Speech' },
];

export function FingerprintBars({ track }: { track: Track }) {
  return (
    <View>
      {BARS.map(({ key, label }) => {
        const value = (track[key] as number) ?? 0;
        return (
          <View key={key} style={styles.row}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${Math.round(value * 100)}%` }]} />
            </View>
            <Text style={styles.value}>{`${Math.round(value * 100)}%`}</Text>
          </View>
        );
      })}
    </View>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginVertical: 6 },
  label: { color: colors.textSecondary, fontSize: 10, letterSpacing: 1, width: 96 },
  track: { flex: 1, height: 6, backgroundColor: colors.surfaceElevated, borderRadius: 3, overflow: 'hidden' },
  fill: { height: 6, backgroundColor: colors.cyan, borderRadius: 3 },
  value: { color: colors.textPrimary, fontFamily: fonts.mono, fontSize: 12, width: 44, textAlign: 'right' },
});
