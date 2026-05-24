import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useState, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS, interpolate, Extrapolation } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, spacing } from '../../src/theme/tokens';
import { useStore } from '../../src/data/store';
import { SoulmateCard } from '../../src/components/SoulmateCard';
import { ResultSheet } from '../../src/components/ResultSheet';
import { cosineSimilarityPercent } from '../../src/lib/similarity';
import { UserVector, Track } from '../../src/types';
import profilesJson from '../../assets/data/mock_profiles.json';

const THRESHOLD = 120;

export default function Matchmaking() {
  const scanCount = useStore((s) => s.history.length);
  const userVector = useStore((s) => s.userVector)();
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const tx = useSharedValue(0);

  const ranked = useMemo(() => {
    const profiles = profilesJson as UserVector[];
    return profiles
      .map((p) => ({ profile: p, score: cosineSimilarityPercent(userVector, p.vector) }))
      .sort((a, b) => b.score - a.score);
  }, [userVector]);

  // Hooks must run before the early return below (rules-of-hooks); else hook count
  // changes when the gate clears, throwing React #310.
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { rotate: `${tx.value / 20}deg` }],
  }));

  // Background feedback: full-screen tint + giant icon BEHIND the card.
  // Neutral (0) at center, ramps to 1 by THRESHOLD. Right => green MATCH, left => red SKIP.
  const matchBgStyle = useAnimatedStyle(() => ({
    opacity: interpolate(tx.value, [0, THRESHOLD], [0, 1], Extrapolation.CLAMP),
  }));
  const skipBgStyle = useAnimatedStyle(() => ({
    opacity: interpolate(tx.value, [-THRESHOLD, 0], [1, 0], Extrapolation.CLAMP),
  }));

  if (scanCount < 3) {
    return (
      <View style={styles.gate}>
        <Text style={styles.gateTitle}>BUILD YOUR PROFILE</Text>
        <Text style={styles.gateSub}>Scan at least 3 tracks to find your sonic soulmates.</Text>
        <Text style={styles.gateCount}>{scanCount} / 3</Text>
        <Pressable style={styles.btn} onPress={() => router.push('/(tabs)')}>
          <Text style={styles.btnTxt}>GO SCAN</Text>
        </Pressable>
      </View>
    );
  }

  const current = ranked[index % ranked.length];

  function commit() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setIndex((i) => i + 1);
    tx.value = 0;
  }

  const pan = Gesture.Pan()
    .onUpdate((e) => { tx.value = e.translationX; })
    .onEnd((e) => {
      if (Math.abs(e.translationX) > THRESHOLD) {
        tx.value = withSpring(e.translationX > 0 ? 500 : -500);
        runOnJS(commit)();
      } else {
        tx.value = withSpring(0);
      }
    });

  return (
    <View style={styles.c}>
      {/* Background feedback layers — behind the card, full-screen, non-interactive */}
      <Animated.View style={[StyleSheet.absoluteFill, styles.matchBg, matchBgStyle]}>
        <Ionicons name="checkmark" size={220} color={colors.green} />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, styles.skipBg, skipBgStyle]}>
        <Ionicons name="close" size={220} color={colors.danger} />
      </Animated.View>

      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.cardWrap, cardStyle]}>
          <SoulmateCard
            profile={current.profile}
            score={current.score}
            userVector={userVector}
            onTrackPress={setSelectedTrack}
          />
        </Animated.View>
      </GestureDetector>

      <Text style={styles.hint}>SWIPE RIGHT TO MATCH · LEFT TO SKIP</Text>

      {selectedTrack && <ResultSheet track={selectedTrack} onClose={() => setSelectedTrack(null)} />}
    </View>
  );
}
const styles = StyleSheet.create({
  c: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  cardWrap: { width: '100%', alignItems: 'center', justifyContent: 'center', flex: 1 },
  hint: { color: colors.textSecondary, fontSize: 11, letterSpacing: 1, marginBottom: spacing.xl },
  gate: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  gateTitle: { color: colors.textPrimary, fontSize: 16, letterSpacing: 2, fontWeight: '700' },
  gateSub: { color: colors.textSecondary, fontSize: 13, textAlign: 'center', marginTop: spacing.sm },
  gateCount: { color: colors.cyan, fontSize: 32, fontWeight: '700', marginTop: spacing.lg },
  btn: { marginTop: spacing.xl, borderColor: colors.cyan, borderWidth: 1, borderRadius: 999, paddingHorizontal: 24, paddingVertical: 12 },
  btnTxt: { color: colors.cyan, letterSpacing: 2, fontWeight: '700' },
  matchBg: { backgroundColor: 'rgba(34,197,94,0.85)', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' },
  skipBg: { backgroundColor: 'rgba(239,68,68,0.85)', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' },
});
