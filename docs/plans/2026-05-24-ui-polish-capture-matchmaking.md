# Capture + Matchmaking UI Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a microphone icon to the Capture scan ring, and upgrade the Matchmaking swipe deck with a bigger avatar, drag-proportional green/red MATCH/SKIP overlays, and tappable top-tracks that open the existing analysis modal.

**Architecture:** This is a React Native (Expo Router) app. We touch two screens (`app/(tabs)/index.tsx`, `app/(tabs)/matchmaking.tsx`) and two components (`src/components/WaveformRing.tsx`, `src/components/SoulmateCard.tsx`). Swipe overlays are driven by the existing Reanimated shared value (`tx`) already present in `matchmaking.tsx`, interpolated to opacity so feedback is neutral at center and intensifies toward each edge. Tappable tracks resolve a song title against the already-existing `mock_tracks.json` Track objects — no fake data is invented; only songs with a real Track entry become tappable, and tapping reuses the existing `ResultSheet` modal (the same one the History tab uses).

**Tech Stack:** React Native 0.85, Expo Router 56, `react-native-reanimated` 4.3, `react-native-gesture-handler` 2.31, `moti` 0.30, `@expo/vector-icons` (Ionicons), Zustand, TypeScript. Tests run with Jest + ts-jest (Node env, `__tests__/**/*.test.ts`).

---

## File Structure

- `src/components/WaveformRing.tsx` (modify) — add a centered `Ionicons` mic glyph inside the pulsing ring.
- `app/(tabs)/index.tsx` (modify) — no structural change; the mic now lives inside `WaveformRing`, so only verify it still renders. (No edit expected unless the ring needs a label tweak — see Task 2.)
- `src/lib/trackLookup.ts` (create) — pure helper that maps a song title to a full `Track` from `mock_tracks.json`, or `null` if none exists. Lives in `lib/` next to the other pure helpers (`similarity.ts`, `base64.ts`) so it is unit-testable in the Node jest env without RN imports.
- `src/components/SoulmateCard.tsx` (modify) — enlarge avatar; make each top-track row a `Pressable` that highlights on hover/press and fires an `onTrackPress(track)` callback only when a real Track exists.
- `app/(tabs)/matchmaking.tsx` (modify) — add drag-proportional MATCH (green check) / SKIP (red X) overlays driven by `tx`; wire `SoulmateCard.onTrackPress` to open `ResultSheet`.
- `vibe-fm/__tests__/trackLookup.test.ts` (create) — unit tests for the lookup helper.

A note on the "tappable songs" decision: `topSongs` on a profile are plain strings. About 60% of them match a real entry in `mock_tracks.json` by title (e.g. "Devil in a New Dress", "Runaway"); the rest (e.g. "God's Plan", "Nights") have no Track data. Rather than fabricate audio features, only matched songs become tappable and highlight-able; unmatched songs render as plain dimmed text. This matches the "pull from something that already exists, like clicking a card from history" intent.

---

## Task 1: Track-title lookup helper

**Files:**
- Create: `vibe-fm/src/lib/trackLookup.ts`
- Test: `vibe-fm/__tests__/trackLookup.test.ts`

- [ ] **Step 1: Write the failing test**

Create `vibe-fm/__tests__/trackLookup.test.ts`:

```typescript
import { findTrackByTitle } from '../src/lib/trackLookup';

describe('findTrackByTitle', () => {
  it('returns a full Track for a title that exists in mock_tracks', () => {
    const t = findTrackByTitle('Devil in a New Dress');
    expect(t).not.toBeNull();
    expect(t!.title).toBe('Devil in a New Dress');
    expect(t!.artist).toBe('Kanye West');
    expect(typeof t!.tempo).toBe('number');
  });

  it('is case-insensitive and trims whitespace', () => {
    expect(findTrackByTitle('  devil in a new dress  ')).not.toBeNull();
  });

  it('returns null for a title with no matching track', () => {
    expect(findTrackByTitle('God’s Plan')).toBeNull();
    expect(findTrackByTitle('Totally Made Up Song')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd vibe-fm && npx jest __tests__/trackLookup.test.ts`
Expected: FAIL — "Cannot find module '../src/lib/trackLookup'".

- [ ] **Step 3: Write minimal implementation**

Create `vibe-fm/src/lib/trackLookup.ts`:

```typescript
import { Track } from '../types';
import tracksJson from '../../assets/data/mock_tracks.json';

const tracks = tracksJson as Track[];

const byTitle = new Map<string, Track>(
  tracks.map((t) => [t.title.trim().toLowerCase(), t]),
);

export function findTrackByTitle(title: string): Track | null {
  return byTitle.get(title.trim().toLowerCase()) ?? null;
}
```

Note: `tsconfig.jest.json` must allow JSON imports. Verify it has `"resolveJsonModule": true` (Step 4 confirms via the test run; if the test errors on the JSON import, add `"resolveJsonModule": true` and `"esModuleInterop": true` to the `compilerOptions` of `vibe-fm/tsconfig.jest.json`).

- [ ] **Step 4: Run test to verify it passes**

Run: `cd vibe-fm && npx jest __tests__/trackLookup.test.ts`
Expected: PASS (3 tests). If it fails on the JSON import, apply the `tsconfig.jest.json` fix noted above and re-run.

- [ ] **Step 5: Commit**

```bash
git add vibe-fm/src/lib/trackLookup.ts vibe-fm/__tests__/trackLookup.test.ts vibe-fm/tsconfig.jest.json
git commit -m "feat: add track-title lookup helper for matchmaking song taps"
```

---

## Task 2: Microphone icon in the scan ring

**Files:**
- Modify: `vibe-fm/src/components/WaveformRing.tsx`

This is a visual-only change to a React Native component; there is no Node-runnable unit test for rendering. Verification is by reading the diff and running the app (Step 4).

- [ ] **Step 1: Add the Ionicons mic inside the ring**

Replace the entire contents of `vibe-fm/src/components/WaveformRing.tsx` with:

```tsx
import { MotiView } from 'moti';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/tokens';

export function WaveformRing({ active, amplitude = 0 }: { active: boolean; amplitude?: number }) {
  return (
    <View style={styles.wrap}>
      <MotiView
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
```

Why a wrapping `View`: the ring scales/animates via `MotiView`; the mic icon must NOT scale with it (otherwise the glyph distorts), so the icon is a sibling centered over the ring rather than a child of the animated view.

- [ ] **Step 2: Confirm no change needed in `index.tsx`**

Read `vibe-fm/app/(tabs)/index.tsx` lines 111-113. It already renders `<WaveformRing active=... amplitude=... />` inside the `Pressable`. The mic is now internal, so no edit is required here. Leave the "TAP TO SCAN" / "TAP TO UPLOAD" hint text as-is.

- [ ] **Step 3: Type-check**

Run: `cd vibe-fm && npx tsc --noEmit`
Expected: no new errors referencing `WaveformRing.tsx`.

- [ ] **Step 4: Run the app and verify visually**

Run: `cd vibe-fm && npx expo start --web`
Expected: On the Capture (home) tab, a microphone icon sits centered inside the pulsing cyan ring. Tapping starts a scan; while listening the mic turns cyan and the ring reacts to amplitude. The icon stays crisp (does not stretch) as the ring scales.

- [ ] **Step 5: Commit**

```bash
git add vibe-fm/src/components/WaveformRing.tsx
git commit -m "feat: add microphone icon inside capture scan ring"
```

---

## Task 3: Bigger avatar + tappable highlighted top-tracks in SoulmateCard

**Files:**
- Modify: `vibe-fm/src/components/SoulmateCard.tsx`

- [ ] **Step 1: Add an `onTrackPress` prop and render tracks as Pressables**

Replace the entire contents of `vibe-fm/src/components/SoulmateCard.tsx` with:

```tsx
import { useState } from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { colors, fonts, radius, spacing } from '../theme/tokens';
import { Tag } from './Tag';
import { UserVector, Track } from '../types';
import { findTrackByTitle } from '../lib/trackLookup';

const DIMS = ['TEMPO', 'ENERGY', 'ACOUSTIC', 'INSTRUMENTAL', 'VALENCE'];

const LOCAL_ASSETS: Record<string, any> = {
  'kanye.jpg': require('../../assets/images/pfp/kanye.jpg'),
  'drake.jpg': require('../../assets/images/pfp/drake.jpg'),
  'stvn.jpg': require('../../assets/images/pfp/stvn.jpg'),
};

function SongRow({ title, onPress }: { title: string; track: Track; onPress: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[styles.songRow, hovered && styles.songRowHover]}
    >
      <Text style={[styles.songText, hovered && styles.songTextHover]}>{title}</Text>
      <Text style={styles.songChevron}>{'›'}</Text>
    </Pressable>
  );
}

export function SoulmateCard({ profile, score, userVector, onTrackPress }:
  {
    profile: UserVector;
    score: number;
    userVector: [number, number, number, number, number];
    onTrackPress?: (track: Track) => void;
  }) {
  const initials = profile.displayName.split(' ').map((w) => w[0]).join('').slice(0, 2);
  const aligned: string[] = [];
  const diverges: string[] = [];
  const norm = (v: number, i: number) => (i === 0 ? v / 200 : v);
  DIMS.forEach((d, i) => {
    const delta = Math.abs(norm(profile.vector[i], i) - norm(userVector[i], i));
    (delta < 0.15 ? aligned : diverges).push(d);
  });

  const renderAvatar = () => {
    if (profile.avatar) {
      if (profile.avatar.startsWith('local:')) {
        const key = profile.avatar.split(':')[1];
        if (LOCAL_ASSETS[key]) {
          return <Image source={LOCAL_ASSETS[key]} style={styles.avatarImage} />;
        }
      } else {
        return <Image source={{ uri: profile.avatar }} style={styles.avatarImage} />;
      }
    }
    return <View style={styles.avatarPlaceholder}><Text style={styles.initials}>{initials}</Text></View>;
  };

  return (
    <View style={styles.card}>
      {renderAvatar()}
      <Text style={styles.name}>{profile.displayName}</Text>
      <Text style={styles.loc}>{profile.location}</Text>

      <Text style={styles.score}>{score}%</Text>
      <Text style={styles.scoreLabel}>COMPATIBILITY</Text>

      <Text style={styles.section}>SHARED ARTISTS</Text>
      <View style={styles.tagRow}>{profile.topArtists.map((a) => <Tag key={a} label={a} variant="outlined" tint={colors.cyan} />)}</View>

      <Text style={styles.section}>TOP TRACKS</Text>
      <View style={styles.songList}>
        {profile.topSongs.map((s) => {
          const track = findTrackByTitle(s);
          if (track && onTrackPress) {
            return <SongRow key={s} title={s} track={track} onPress={() => onTrackPress(track)} />;
          }
          return <Text key={s} style={styles.songTextPlain}>{s}</Text>;
        })}
      </View>

      <Text style={styles.section}>ALIGNED</Text>
      <View style={styles.tagRow}>{aligned.map((d) => <Tag key={d} label={d} variant="filled" tint={colors.green} />)}</View>

      <Text style={styles.section}>DIVERGES</Text>
      <View style={styles.tagRow}>{diverges.map((d) => <Tag key={d} label={d} variant="outlined" tint={colors.textSecondary} />)}</View>
    </View>
  );
}
const styles = StyleSheet.create({
  card: { width: '90%', height: '78%', backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1,
    borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center' },
  avatarPlaceholder: { width: 112, height: 112, borderRadius: 56, backgroundColor: colors.purple, alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: 112, height: 112, borderRadius: 56, backgroundColor: colors.surfaceElevated, borderWidth: 2, borderColor: colors.border },
  initials: { color: '#fff', fontSize: 38, fontWeight: '700' },
  name: { color: colors.textPrimary, fontSize: 18, fontWeight: '700', marginTop: spacing.sm },
  loc: { color: colors.textSecondary, fontSize: 12 },
  score: { color: colors.green, fontFamily: fonts.mono, fontSize: 56, fontWeight: '700', marginTop: spacing.md },
  scoreLabel: { color: colors.green, fontSize: 10, letterSpacing: 3 },
  section: { color: colors.textSecondary, fontSize: 10, letterSpacing: 2, fontWeight: '700', alignSelf: 'flex-start', marginTop: spacing.md },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', alignSelf: 'flex-start', marginTop: spacing.xs },
  songList: { alignSelf: 'stretch', marginTop: spacing.xs },
  songRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 8, paddingHorizontal: 10, borderRadius: radius.sm, marginBottom: 4,
    borderWidth: 1, borderColor: 'transparent' },
  songRowHover: { backgroundColor: colors.surfaceElevated, borderColor: colors.cyan },
  songText: { color: colors.textPrimary, fontSize: 13 },
  songTextHover: { color: colors.cyan, fontWeight: '700' },
  songTextPlain: { color: colors.textTertiary, fontSize: 13, paddingVertical: 8, paddingHorizontal: 10 },
  songChevron: { color: colors.cyan, fontSize: 16, fontWeight: '700' },
});
```

Key changes from the original:
- Avatar grew from 64x64 (radius 32) to 112x112 (radius 56); placeholder initials from 22 to 38.
- New optional `onTrackPress` prop. When a song resolves to a real `Track` AND the parent passed `onTrackPress`, the song renders as a highlightable `SongRow` (Pressable with `onHoverIn`/`onHoverOut` for web hover and press feedback, plus a chevron). Otherwise it falls back to dimmed plain text (`songTextPlain`).
- The old single-line `tracks` join (`profile.topSongs.join(' · ')`) is replaced by the per-song list.

- [ ] **Step 2: Type-check**

Run: `cd vibe-fm && npx tsc --noEmit`
Expected: no new errors referencing `SoulmateCard.tsx`. (At this point `matchmaking.tsx` does not yet pass `onTrackPress`; that is fine because the prop is optional.)

- [ ] **Step 3: Commit**

```bash
git add vibe-fm/src/components/SoulmateCard.tsx
git commit -m "feat: bigger avatar and tappable highlighted top-tracks in SoulmateCard"
```

---

## Task 4: Drag-proportional MATCH/SKIP overlays + open analysis modal on track tap

**Files:**
- Modify: `vibe-fm/app/(tabs)/matchmaking.tsx`

- [ ] **Step 1: Add overlay state, interpolated styles, ResultSheet wiring, and the overlay views**

Replace the entire contents of `vibe-fm/app/(tabs)/matchmaking.tsx` with:

```tsx
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

  // Overlay opacity scales with drag distance: neutral (0) at center,
  // ramps to 1 by the time the drag reaches THRESHOLD. Right => MATCH, left => SKIP.
  const matchStyle = useAnimatedStyle(() => ({
    opacity: interpolate(tx.value, [0, THRESHOLD], [0, 1], Extrapolation.CLAMP),
  }));
  const skipStyle = useAnimatedStyle(() => ({
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
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.cardWrap, cardStyle]}>
          <SoulmateCard
            profile={current.profile}
            score={current.score}
            userVector={userVector}
            onTrackPress={setSelectedTrack}
          />

          <Animated.View pointerEvents="none" style={[styles.overlay, styles.overlayRight, matchStyle]}>
            <View style={[styles.badge, styles.badgeMatch]}>
              <Ionicons name="checkmark" size={56} color={colors.green} />
              <Text style={[styles.badgeText, { color: colors.green }]}>MATCH</Text>
            </View>
          </Animated.View>

          <Animated.View pointerEvents="none" style={[styles.overlay, styles.overlayLeft, skipStyle]}>
            <View style={[styles.badge, styles.badgeSkip]}>
              <Ionicons name="close" size={56} color={colors.danger} />
              <Text style={[styles.badgeText, { color: colors.danger }]}>SKIP</Text>
            </View>
          </Animated.View>
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
  hint: { color: colors.textTertiary, fontSize: 10, letterSpacing: 1, marginBottom: spacing.xl },
  gate: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  gateTitle: { color: colors.textPrimary, fontSize: 16, letterSpacing: 2, fontWeight: '700' },
  gateSub: { color: colors.textSecondary, fontSize: 13, textAlign: 'center', marginTop: spacing.sm },
  gateCount: { color: colors.cyan, fontSize: 32, fontWeight: '700', marginTop: spacing.lg },
  btn: { marginTop: spacing.xl, borderColor: colors.cyan, borderWidth: 1, borderRadius: 999, paddingHorizontal: 24, paddingVertical: 12 },
  btnTxt: { color: colors.cyan, letterSpacing: 2, fontWeight: '700' },
  overlay: { position: 'absolute', top: 40 },
  overlayRight: { left: 40 },
  overlayLeft: { right: 40 },
  badge: { flexDirection: 'row', alignItems: 'center', borderWidth: 3, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 8 },
  badgeMatch: { borderColor: colors.green, transform: [{ rotate: '-12deg' }] },
  badgeSkip: { borderColor: colors.danger, transform: [{ rotate: '12deg' }] },
  badgeText: { fontSize: 28, fontWeight: '800', letterSpacing: 2, marginLeft: 6 },
});
```

What changed from the original `matchmaking.tsx`:
- Imported `interpolate`, `Extrapolation` from reanimated, `Ionicons`, `ResultSheet`, and `Track`.
- Added `selectedTrack` state; passed `onTrackPress={setSelectedTrack}` to `SoulmateCard`; rendered `ResultSheet` when a track is selected.
- Added `matchStyle` / `skipStyle` animated opacities. They are neutral (0) at center and ramp to full by `THRESHOLD` (the same constant the swipe uses to decide commit), so the visual feedback exactly tracks how close the drag is to triggering. Right drag reveals the green MATCH badge; left drag reveals the red SKIP badge.
- Overlays use `pointerEvents="none"` so they never intercept taps meant for the song rows underneath.

- [ ] **Step 2: Add the `danger` (red) color token**

The overlay uses `colors.danger` for red. Open `vibe-fm/src/theme/tokens.ts` and add a `danger` entry to the `colors` object. Change:

```typescript
  green: '#22C55E',
  textPrimary: '#FFFFFF',
```

to:

```typescript
  green: '#22C55E',
  danger: '#EF4444',
  textPrimary: '#FFFFFF',
```

- [ ] **Step 3: Type-check**

Run: `cd vibe-fm && npx tsc --noEmit`
Expected: no errors. Confirm `colors.danger` resolves (Step 2 added it) and `SoulmateCard`'s `onTrackPress` prop type matches `setSelectedTrack` (both `(track: Track) => void`).

- [ ] **Step 4: Run the full unit test suite**

Run: `cd vibe-fm && npx jest`
Expected: all tests pass, including `trackLookup.test.ts` from Task 1.

- [ ] **Step 5: Run the app and verify the full matchmaking flow**

Run: `cd vibe-fm && npx expo start --web`

Verify (you must have at least 3 scans first — scan 3 tracks on the Capture tab, or the gate screen blocks Matchmaking):
1. The soulmate avatar is noticeably larger than before.
2. Dragging the card right fades in a green checkmark + MATCH badge that gets stronger the further right you drag, and is invisible at center.
3. Dragging left fades in a red X + SKIP badge, proportional to drag distance.
4. Releasing past the threshold advances to the next profile; releasing before it springs back and the overlay fades out.
5. Tapping a top-track that has real data (e.g. on Kanye's card, "Runaway") highlights on hover and opens the analysis `ResultSheet` modal — the same sheet as the History tab. Tapping the backdrop closes it.
6. Songs without track data (dimmed text) are not tappable and show no chevron.

- [ ] **Step 6: Commit**

```bash
git add vibe-fm/app/(tabs)/matchmaking.tsx vibe-fm/src/theme/tokens.ts
git commit -m "feat: drag-proportional match/skip overlays and tap-to-analyze tracks in matchmaking"
```

---

## Self-Review Notes

- **Spec coverage:**
  - "microphone in the scaling button" → Task 2 (mic inside `WaveformRing`).
  - "make the profile picture bigger" → Task 3 (avatar 64→112).
  - "colors (green and red) and checkmark and x when swiping right/left" → Task 4 (`matchStyle`/`skipStyle` overlays with Ionicons `checkmark`/`close`).
  - "becomes more of the other the closer it is to that side, neutral in the middle" → Task 4 (`interpolate(tx, [0,THRESHOLD],[0,1])` and the mirrored left ramp).
  - "click on a song spawns the analysis modal overlay" / "pull from something that already exists like clicking a card from history" → Tasks 1 + 3 + 4 (`findTrackByTitle` resolves real Tracks from `mock_tracks.json`; `ResultSheet` reused).
  - "when you hover it should highlight" → Task 3 (`onHoverIn`/`onHoverOut` → `songRowHover`).
- **Type consistency:** `onTrackPress?: (track: Track) => void` in `SoulmateCard` matches `setSelectedTrack` (a `Dispatch<SetStateAction<Track|null>>`, callable with a `Track`). `findTrackByTitle` returns `Track | null`; only the non-null branch passes a `Track` to `onTrackPress`. `colors.danger` is added in Task 4 Step 2 before first use.
- **Icon names verified:** `mic`, `checkmark`, `close` all exist in the bundled Ionicons glyphmap.
- **No fake data:** Unmatched songs degrade to plain dimmed text rather than fabricating audio features.

---

## Execution Handoff

Plan complete and saved to `docs/plans/2026-05-24-ui-polish-capture-matchmaking.md`. Two execution options:

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — execute tasks in this session with checkpoints for review.

Which approach?
