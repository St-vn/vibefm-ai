import { View, Text, StyleSheet } from 'react-native';
import { colors, radius } from '../theme/tokens';

function toTitleCase(str: string): string {
  return str
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function Tag({ label, variant = 'filled', tint = colors.purple }:
  { label?: string | null; variant?: 'filled' | 'outlined'; tint?: string }) {
  const filled = variant === 'filled';
  const displayLabel = toTitleCase(label || '');
  
  if (!displayLabel) return null;

  return (
    <View style={[styles.tag, {
      backgroundColor: filled ? tint : 'transparent',
      borderColor: tint,
    }]}>
      <Text style={[styles.txt, { color: filled ? '#000' : tint }]}>{displayLabel}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  tag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill, borderWidth: 1, marginRight: 8, marginBottom: 6 },
  txt: { fontSize: 11, letterSpacing: 0.5, fontWeight: '700' },
});
