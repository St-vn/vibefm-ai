import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { colors, spacing } from '../theme/tokens';
import { Track } from '../types';

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function HistoryRow({ track, onPress }: { track: Track; onPress: () => void }) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <Image source={{ uri: track.albumArt }} style={styles.art} />
      <View style={{ flex: 1, marginLeft: spacing.md }}>
        <Text style={styles.title} numberOfLines={1}>{track.title}</Text>
        <Text style={styles.artist} numberOfLines={1}>{track.artist}</Text>
      </View>
      <View style={styles.chips}>
        <Text style={styles.chip}>{track.moodLabel || ''}</Text>
        <Text style={styles.chip}>{track.microGenre || ''}</Text>
      </View>
      <Text style={styles.time}>{relTime(track.scannedAt)}</Text>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
    borderBottomColor: colors.border, borderBottomWidth: 1 },
  art: { width: 44, height: 44, borderRadius: 6, backgroundColor: colors.surfaceElevated },
  title: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  artist: { color: colors.textSecondary, fontSize: 12 },
  chips: { alignItems: 'flex-end', marginRight: spacing.sm },
  chip: { color: colors.purple, fontSize: 9, letterSpacing: 1, fontWeight: '700' },
  time: { color: colors.textTertiary, fontSize: 10, width: 48, textAlign: 'right' },
});
