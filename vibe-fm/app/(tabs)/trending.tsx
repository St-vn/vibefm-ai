import { SectionList, View, Text, StyleSheet } from 'react-native';
import { useState, useMemo } from 'react';
import { colors, spacing } from '../../src/theme/tokens';
import { TrendingRow } from '../../src/components/TrendingRow';
import { ResultSheet } from '../../src/components/ResultSheet';
import { Track } from '../../src/types';
import tracks from '../../assets/data/charts.json';

export default function Trending() {
  const [selected, setSelected] = useState<Track | null>(null);
  const data = tracks as Track[];

  const sections = useMemo(() => {
    const local = data.filter((t) => t.location === 'Montreal');
    const global = data.filter((t) => t.location !== 'Montreal');
    const byProperty = [...data].sort((a, b) => b.energy - a.energy).slice(0, 8);
    return [
      { title: 'Local · Montreal', data: local },
      { title: 'Global', data: global },
      { title: 'Sonic Property · Energy', data: byProperty },
    ];
  }, [data]);

  return (
    <View style={styles.c}>
      <Text style={styles.gps}>◍ Montreal</Text>
      <SectionList
        sections={sections}
        keyExtractor={(item, i) => item.id + i}
        renderItem={({ item, index }) => (
          <TrendingRow rank={index + 1} track={item} onPress={() => setSelected(item)} />
        )}
        renderSectionHeader={({ section }) => <Text style={styles.header}>{section.title}</Text>}
        stickySectionHeadersEnabled={false}
      />
      {selected && <ResultSheet track={selected} onClose={() => setSelected(null)} />}
    </View>
  );
}
const styles = StyleSheet.create({
  c: { flex: 1, backgroundColor: colors.background, paddingTop: 60 },
  gps: { color: colors.green, fontSize: 11, letterSpacing: 0.5, paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  header: { color: colors.textSecondary, fontSize: 11, letterSpacing: 0.5, fontWeight: '700',
    paddingHorizontal: spacing.md, paddingTop: spacing.lg, paddingBottom: spacing.sm },
});
