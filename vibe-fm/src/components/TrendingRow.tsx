import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { colors, fonts, spacing } from '../theme/tokens';
import { Track } from '../types';

function chips(t: Track): string[] {
  const out: string[] = [];
  if (t.energy > 0.7) out.push('High Energy');
  if (t.instrumentalness > 0.4) out.push('Instrumental');
  if (t.danceability > 0.7) out.push('Danceable');
  if (t.acousticness > 0.6) out.push('Acoustic');
  return out.slice(0, 3);
}

export function TrendingRow({ rank, track, onPress }:
  { rank: number; track: Track; onPress: () => void }) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <Text style={styles.rank}>{String(rank).padStart(2, '0')}</Text>
      <Image source={{ uri: track.albumArt }} style={styles.art} />
      <View style={{ flex: 1, marginLeft: spacing.md }}>
        <Text style={styles.title} numberOfLines={1}>{track.title}</Text>
        <Text style={styles.artist} numberOfLines={1}>{track.artist}</Text>
      </View>
      <View style={styles.chips}>
        {chips(track).map((c) => <Text key={c} style={styles.chip}>{c}</Text>)}
      </View>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
    borderBottomColor: colors.border, borderBottomWidth: 1 },
  rank: { color: colors.textTertiary, fontFamily: fonts.mono, fontSize: 13, width: 28 },
  art: { width: 44, height: 44, borderRadius: 6, backgroundColor: colors.surfaceElevated },
  title: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  artist: { color: colors.textSecondary, fontSize: 12 },
  chips: { alignItems: 'flex-end' },
  chip: { color: colors.cyan, fontSize: 9, letterSpacing: 1, marginVertical: 1, fontWeight: '700' },
});
