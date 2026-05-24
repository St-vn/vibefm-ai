import { MotiView } from 'moti';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/tokens';

export function WaveformRing({ active, amplitude = 0 }: { active: boolean; amplitude?: number }) {
  return (
    <View style={styles.wrap}>
      <MotiView
        key={active ? 'active' : 'idle'}
        from={{ scale: 1, opacity: 0.6 }}
        animate={active ? { scale: 1 + amplitude * 0.4, opacity: 0.9 } : { scale: 1.08, opacity: 0.6 }}
        transition={active
          ? { type: 'timing', duration: 120 }
          : { type: 'timing', duration: 1400, loop: true }}
        style={styles.ring}
      />
      <Ionicons
        name="mic"
        size={64}
        color={active ? colors.cyan : colors.textPrimary}
        style={styles.icon}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  wrap: { width: 200, height: 200, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: 200, height: 200, borderRadius: 100, borderWidth: 2, borderColor: colors.cyan },
  icon: {},
});
