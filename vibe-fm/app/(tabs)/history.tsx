import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { colors, spacing } from '../../src/theme/tokens';
import { useStore } from '../../src/data/store';
import { HistoryRow } from '../../src/components/HistoryRow';
import { ResultSheet } from '../../src/components/ResultSheet';
import { Track } from '../../src/types';

export default function History() {
  const history = useStore((s) => s.history);
  const [selected, setSelected] = useState<Track | null>(null);
  const router = useRouter();

  if (history.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>No scans yet</Text>
        <Text style={styles.emptySub}>Scan your first track to start your sonic archive.</Text>
        <Pressable style={styles.btn} onPress={() => router.push('/(tabs)')}>
          <Text style={styles.btnTxt}>Go to capture</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.c}>
      <Text style={styles.h}>History</Text>
      <FlatList
        data={history}
        keyExtractor={(t, i) => t.id + i}
        renderItem={({ item }) => <HistoryRow track={item} onPress={() => setSelected(item)} />}
      />
      {selected && <ResultSheet track={selected} onClose={() => setSelected(null)} />}
    </View>
  );
}
const styles = StyleSheet.create({
  c: { flex: 1, backgroundColor: colors.background, paddingTop: 60 },
  h: { color: colors.textSecondary, fontSize: 11, letterSpacing: 0.5, fontWeight: '700', paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  empty: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  emptyTitle: { color: colors.textPrimary, fontSize: 16, letterSpacing: 0.5, fontWeight: '700' },
  emptySub: { color: colors.textSecondary, fontSize: 13, textAlign: 'center', marginTop: spacing.sm },
  btn: { marginTop: spacing.xl, borderColor: colors.cyan, borderWidth: 1, borderRadius: 999, paddingHorizontal: 24, paddingVertical: 12 },
  btnTxt: { color: colors.cyan, letterSpacing: 0.5, fontWeight: '700' },
});
