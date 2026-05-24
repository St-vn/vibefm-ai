import { View, Pressable, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme/tokens';

export function SourceToggle({ value, onChange }:
  { value: 'mic' | 'file'; onChange: (v: 'mic' | 'file') => void }) {
  return (
    <View style={styles.pill}>
      {(['mic', 'file'] as const).map((opt) => {
        const active = value === opt;
        return (
          <Pressable key={opt} onPress={() => onChange(opt)}
            style={[styles.seg, active && { backgroundColor: colors.surfaceElevated }]}>
            <View style={styles.row}>
              <Ionicons 
                name={opt === 'mic' ? 'mic' : 'cloud-upload'} 
                size={14} 
                color={active ? colors.cyan : colors.textSecondary} 
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.txt, { color: active ? colors.cyan : colors.textSecondary }]}>
                {opt === 'mic' ? 'Live Mic' : 'File Upload'}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
const styles = StyleSheet.create({
  pill: { flexDirection: 'row', borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, padding: 3 },
  seg: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill },
  row: { flexDirection: 'row', alignItems: 'center' },
  txt: { fontSize: 10, letterSpacing: 1, fontWeight: '700' },
});
