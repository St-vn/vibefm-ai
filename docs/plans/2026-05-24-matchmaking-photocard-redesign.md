# Matchmaking Photo-Card Redesign + Background Swipe Feedback

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the matchmaking soulmate card as a full-bleed photo card (profile picture as the card background, info in a bottom gradient scrim with frosted song chips), and move the swipe MATCH/SKIP feedback OFF the card and INTO the page background (full-screen green/red tint + giant check/X behind the sliding card).

**Architecture:** React Native (Expo Router 56). The card (`SoulmateCard`) becomes a layered stack: full-bleed `Image` background → `LinearGradient` bottom scrim → left-aligned content (identity, frosted song chips, aligned/diverges pills). The swipe-feedback layers (tint + giant icon) move out of `SoulmateCard` and into the page (`matchmaking.tsx`), rendered as `absoluteFill` siblings BEHIND the gesture card so the world behind the card reacts while the card itself stays neutral. Opacity of every feedback layer is driven by the existing Reanimated `tx` shared value via `interpolate`.

**Tech Stack:** React Native 0.85, Expo Router 56, `expo-linear-gradient@~56.0.4` (already installed this session), `react-native-reanimated` 4.3 (`interpolate`, `Extrapolation`), `react-native-gesture-handler` 2.31, `@expo/vector-icons` (Ionicons), TypeScript.

**Context — what's wrong with the current build (must be fixed):**
- Swipe feedback was wrongly placed: green/red badges rotated and pinned to the card's own corners. It must instead be the PAGE BACKGROUND tinting + a GIANT icon behind the card.
- Card layout is a mess: mixed center/left alignment, dead right half, "DIVERGES" cropped off the bottom, song chevrons floating far from titles, pills cramped, content truncates at the card border.

**Design decisions (locked with the user):**
- Profile picture is the full-bleed card background.
- Info sits in a BOTTOM gradient scrim panel (top ~50% pure photo, bottom ~50% readable info).
- No-photo profiles use a remote DEFAULT image URL (below).
- Song rows are FROSTED CHIPS: semi-transparent dark rounded chips with the chevron inside, hover brightens.
- Swipe feedback: full-screen tint (green right / red left) + giant ✓/✕ centered behind the card; opacity ramps with drag distance, neutral (0) at center.

**Default avatar URL constant** (used verbatim where specified):
`https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fi.pinimg.com%2F736x%2F81%2F8a%2F1b%2F818a1b89a57c2ee0fb7619b95e11aebd.jpg&f=1&nofb=1&ipt=128fdde9dc857f823db76d46472bc094f791f6bab75af41f2a39a5c6c110ced6`

---

## File Structure

- `vibe-fm/src/components/SoulmateCard.tsx` (modify) — full rewrite to the photo-card layout. Removes the white-card look; adds full-bleed image, `LinearGradient` scrim, frosted song chips, left-aligned content. Keeps the existing `onTrackPress` + `findTrackByTitle` track-tap behavior. Removes the on-card swipe badges (they never belonged here — but they currently live in `matchmaking.tsx`, not here, so nothing to remove from this file).
- `vibe-fm/app/(tabs)/matchmaking.tsx` (modify) — move the swipe-feedback layers (tint + giant icon) to render as `absoluteFill` siblings BEHIND the gesture card, replacing the current on-card corner badges.

No new files. `expo-linear-gradient` is already installed (verified: `~56.0.4`).

A note on overflow / variable song counts: profiles have 3–6 `topSongs` (e.g. "stvn" has 6). The card content lives in the scrim and must never crop. The scrim content area uses natural height growing UP from the bottom; the card height stays a fixed share of the screen but content is laid out bottom-anchored with capped sections (max 4 song chips shown, the rest implied) so nothing clips. See Task 1 Step 1 for the exact cap.

---

## Task 1: Rebuild SoulmateCard as a full-bleed photo card

**Files:**
- Modify: `vibe-fm/src/components/SoulmateCard.tsx`

- [ ] **Step 1: Overwrite the component**

Read `vibe-fm/src/components/SoulmateCard.tsx` first (Write requires it), then overwrite the ENTIRE file with:

```tsx
import { useState } from 'react';
import { View, Text, ImageBackground, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, radius, spacing } from '../theme/tokens';
import { Tag } from './Tag';
import { UserVector, Track } from '../types';
import { findTrackByTitle } from '../lib/trackLookup';

const DIMS = ['TEMPO', 'ENERGY', 'ACOUSTIC', 'INSTRUMENTAL', 'VALENCE'];
const MAX_CHIPS = 4;
const DEFAULT_AVATAR =
  'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fi.pinimg.com%2F736x%2F81%2F8a%2F1b%2F818a1b89a57c2ee0fb7619b95e11aebd.jpg&f=1&nofb=1&ipt=128fdde9dc857f823db76d46472bc094f791f6bab75af41f2a39a5c6c110ced6';

const LOCAL_ASSETS: Record<string, any> = {
  'kanye.jpg': require('../../assets/images/pfp/kanye.jpg'),
  'drake.jpg': require('../../assets/images/pfp/drake.jpg'),
  'stvn.jpg': require('../../assets/images/pfp/stvn.jpg'),
};

function resolveAvatar(avatar?: string) {
  if (avatar) {
    if (avatar.startsWith('local:')) {
      const key = avatar.split(':')[1];
      if (LOCAL_ASSETS[key]) return LOCAL_ASSETS[key];
    } else {
      return { uri: avatar };
    }
  }
  return { uri: DEFAULT_AVATAR };
}

function SongChip({ title, onPress }: { title: string; track: Track; onPress: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[styles.chip, hovered && styles.chipHover]}
    >
      <Text numberOfLines={1} style={[styles.chipText, hovered && styles.chipTextHover]}>{title}</Text>
      <Text style={styles.chipChevron}>{'›'}</Text>
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
  const aligned: string[] = [];
  const diverges: string[] = [];
  const norm = (v: number, i: number) => (i === 0 ? v / 200 : v);
  DIMS.forEach((d, i) => {
    const delta = Math.abs(norm(profile.vector[i], i) - norm(userVector[i], i));
    (delta < 0.15 ? aligned : diverges).push(d);
  });

  const songs = profile.topSongs.slice(0, MAX_CHIPS);

  return (
    <ImageBackground source={resolveAvatar(profile.avatar)} style={styles.card} imageStyle={styles.image}>
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.95)']}
        locations={[0, 0.45, 1]}
        style={styles.scrim}
      >
        <View style={styles.content}>
          <View style={styles.identityRow}>
            <View style={styles.identityLeft}>
              <Text style={styles.name} numberOfLines={1}>{profile.displayName}</Text>
              <Text style={styles.loc}>{profile.location}</Text>
            </View>
            <View style={styles.scoreBox}>
              <Text style={styles.score}>{score}%</Text>
              <Text style={styles.scoreLabel}>MATCH</Text>
            </View>
          </View>

          <Text style={styles.section}>SHARED ARTISTS</Text>
          <View style={styles.tagRow}>
            {profile.topArtists.map((a) => <Tag key={a} label={a} variant="outlined" tint={colors.cyan} />)}
          </View>

          <Text style={styles.section}>TOP TRACKS</Text>
          <View style={styles.chipWrap}>
            {songs.map((s) => {
              const track = findTrackByTitle(s);
              if (track && onTrackPress) {
                return <SongChip key={s} title={s} track={track} onPress={() => onTrackPress(track)} />;
              }
              return (
                <View key={s} style={[styles.chip, styles.chipPlain]}>
                  <Text numberOfLines={1} style={styles.chipTextPlain}>{s}</Text>
                </View>
              );
            })}
          </View>

          <View style={styles.dimRow}>
            <View style={styles.dimCol}>
              <Text style={styles.section}>ALIGNED</Text>
              <View style={styles.tagRow}>
                {aligned.map((d) => <Tag key={d} label={d} variant="filled" tint={colors.green} />)}
              </View>
            </View>
            <View style={styles.dimCol}>
              <Text style={styles.section}>DIVERGES</Text>
              <View style={styles.tagRow}>
                {diverges.map((d) => <Tag key={d} label={d} variant="outlined" tint={colors.textSecondary} />)}
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>
    </ImageBackground>
  );
}
const styles = StyleSheet.create({
  card: { width: '90%', height: '82%', borderRadius: radius.lg, overflow: 'hidden',
    backgroundColor: colors.surfaceElevated, justifyContent: 'flex-end' },
  image: { resizeMode: 'cover' },
  scrim: { justifyContent: 'flex-end', paddingTop: 80 },
  content: { padding: spacing.lg },
  identityRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  identityLeft: { flex: 1, marginRight: spacing.md },
  name: { color: colors.textPrimary, fontSize: 26, fontWeight: '800' },
  loc: { color: colors.textPrimary, opacity: 0.85, fontSize: 13, marginTop: 2 },
  scoreBox: { alignItems: 'flex-end' },
  score: { color: colors.green, fontFamily: fonts.mono, fontSize: 40, fontWeight: '800' },
  scoreLabel: { color: colors.green, fontSize: 10, letterSpacing: 3, marginTop: -4 },
  section: { color: colors.textPrimary, opacity: 0.7, fontSize: 10, letterSpacing: 2, fontWeight: '700', marginTop: spacing.md, marginBottom: spacing.xs },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.55)',
    borderColor: 'rgba(255,255,255,0.18)', borderWidth: 1, borderRadius: radius.pill,
    paddingVertical: 6, paddingHorizontal: 12, marginRight: 8, marginBottom: 8, maxWidth: '100%' },
  chipHover: { backgroundColor: 'rgba(6,182,212,0.25)', borderColor: colors.cyan },
  chipPlain: { opacity: 0.5 },
  chipText: { color: colors.textPrimary, fontSize: 13, flexShrink: 1 },
  chipTextHover: { color: colors.cyan, fontWeight: '700' },
  chipTextPlain: { color: colors.textPrimary, fontSize: 13, flexShrink: 1 },
  chipChevron: { color: colors.cyan, fontSize: 15, fontWeight: '700', marginLeft: 6 },
  dimRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs },
  dimCol: { flex: 1, marginRight: spacing.sm },
});
```

Key points:
- `ImageBackground` is the full-bleed photo; `resolveAvatar` returns the local require, the profile's remote uri, or the DEFAULT_AVATAR uri (no-photo fallback) — no more initials placeholder.
- `LinearGradient` scrim (transparent → near-black) sits over the photo, content anchored to the bottom.
- Identity is a single left/right row: name+location left, score+MATCH right. No center/left mixing.
- Song rows are frosted chips (`rgba(0,0,0,0.55)` + light border); hover → cyan tint + cyan border + cyan bold text; chevron lives INSIDE the chip right after the title (`marginLeft: 6`), not floated to the card edge. Capped at `MAX_CHIPS` (4) so the list never overflows the scrim.
- ALIGNED / DIVERGES are two equal columns side-by-side, even margins — fixes the cramped corner + cropped DIVERGES.

- [ ] **Step 2: Type-check**

Run: `cd vibe-fm && npx tsc --noEmit`
Expected: no errors referencing `SoulmateCard.tsx`. (`expo-linear-gradient` ships its own types; if tsc complains it cannot find the module, confirm `node_modules/expo-linear-gradient` exists — it was installed this session.)

- [ ] **Step 3: Run unit tests (regression check)**

Run: `cd vibe-fm && npx jest`
Expected: all suites pass (the `trackLookup` tests are unaffected by this UI change).

- [ ] **Step 4: Commit**

```bash
git add vibe-fm/src/components/SoulmateCard.tsx vibe-fm/package.json vibe-fm/package-lock.json
git commit -m "feat: rebuild SoulmateCard as full-bleed photo card with scrim and frosted chips"
```

(package.json/lock are included because `expo-linear-gradient` was added as a dependency.)

---

## Task 2: Move swipe feedback into the page background

**Files:**
- Modify: `vibe-fm/app/(tabs)/matchmaking.tsx`

- [ ] **Step 1: Overwrite matchmaking screen**

Read the file first, then overwrite the ENTIRE contents with:

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
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.matchBg, matchBgStyle]}>
        <Ionicons name="checkmark" size={220} color={colors.green} />
      </Animated.View>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.skipBg, skipBgStyle]}>
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
  matchBg: { backgroundColor: 'rgba(34,197,94,0.22)', alignItems: 'center', justifyContent: 'center' },
  skipBg: { backgroundColor: 'rgba(239,68,68,0.22)', alignItems: 'center', justifyContent: 'center' },
});
```

What changed vs the current (broken) version:
- Removed the on-card corner badges (the rotated MATCH/SKIP `Animated.View`s that were children of the card wrapper).
- Added two `absoluteFill` background layers rendered BEFORE the `GestureDetector`, so they sit behind the card. Each tints the whole page (`rgba` green/red at 0.22) and centers a giant 220px Ionicon. `pointerEvents="none"` keeps taps flowing to the card's song chips.
- `matchBgStyle` / `skipBgStyle` drive opacity from `tx` — 0 at center, ramping to full by `THRESHOLD`. Lean right → page washes green + giant ✓ glows behind card; lean left → red + ✕.
- The card (`cardWrap`) renders AFTER the feedback layers, so it slides on top and stays visually neutral.
- Also bumped the hint text from `textTertiary` to `textSecondary` for the low-contrast complaint.

Note: `colors.danger` was added to `tokens.ts` in the prior round and is committed — no token change needed here. Verify it exists (`grep danger vibe-fm/src/theme/tokens.ts`); if missing, add `danger: '#EF4444',` after the `green` line in the `colors` object.

- [ ] **Step 2: Type-check**

Run: `cd vibe-fm && npx tsc --noEmit`
Expected: no errors. Confirm `colors.danger` resolves and `Ionicons` names `checkmark`/`close` are accepted.

- [ ] **Step 3: Run unit tests**

Run: `cd vibe-fm && npx jest`
Expected: all suites pass.

- [ ] **Step 4: Commit**

```bash
git add vibe-fm/app/(tabs)/matchmaking.tsx
git commit -m "feat: move swipe match/skip feedback to page background with giant icon behind card"
```

---

## Task 3: Visual verification in browser

**Files:** none (verification only).

The matchmaking screen is gated behind 3 scans and the Zustand store is in-memory (no persistence), so it resets on reload. To see the card you must first add 3 scans.

- [ ] **Step 1: Start the web app**

Run: `cd vibe-fm && npx expo start --web`
(If port 8081 is busy from a prior session, either reuse the already-running server or accept the new port.)

- [ ] **Step 2: Seed 3 scans, then open Match**

In the running web app: go to the CAPTURE tab, switch the source toggle to FILE, and upload any audio file 3 times (each adds a scan), OR scan via mic 3 times. Once `history.length >= 3`, open the MATCH tab — the gate clears and the card deck shows.

- [ ] **Step 3: Verify the redesign**

Confirm visually:
1. The profile picture fills the entire card (full-bleed), not a small avatar circle.
2. A dark gradient fades up from the bottom; name (large, left), location, and the green score%/MATCH (right) read clearly over it.
3. Top tracks are frosted dark chips with the chevron inside; hovering a chip with real track data brightens it cyan; tapping opens the analysis `ResultSheet`.
4. ALIGNED and DIVERGES sit in two even columns at the bottom — DIVERGES is fully visible, not cropped.
5. Dragging the card RIGHT washes the PAGE BACKGROUND green with a giant ✓ behind the card; dragging LEFT washes it red with a giant ✕; at center the background is plain black. The card itself does not tint.
6. The "SWIPE RIGHT…" hint is readable (not near-invisible grey).

- [ ] **Step 4: Report**

If anything is off (clipping, unreadable text, gesture/scroll conflict, missing icon), note it for a follow-up fix task. If all six checks pass, the redesign is done.

---

## Self-Review Notes

- **Spec coverage:**
  - "profile picture as big as possible / the background" → Task 1 (`ImageBackground` full-bleed).
  - "buttons and elements have to be a certain way to avoid conflict" → Task 1 (bottom scrim + frosted chips give contrast over the photo).
  - "background changes color the more you lean, giant check/X in the background not on the card" → Task 2 (`absoluteFill` tint + 220px icon behind the gesture card).
  - "the background that contains the card should change color" → Task 2 (the page `View` is the tinted surface; card sits on top).
  - default pfp for no-photo profiles → Task 1 (`DEFAULT_AVATAR` uri fallback).
  - frosted chips, hover highlight → Task 1 (`chip`/`chipHover`).
  - cropped DIVERGES / truncation / cramped pills / floating chevrons / low contrast → Task 1 (column layout, capped chips, chevron-inside) + Task 2 (hint contrast bump).
- **Type consistency:** `onTrackPress?: (track: Track) => void` matches `setSelectedTrack`. `findTrackByTitle` returns `Track | null`; only the non-null branch renders a tappable `SongChip`. `resolveAvatar` returns either a `require()` result or `{ uri: string }`, both valid `ImageBackground` sources.
- **Dependency:** `expo-linear-gradient@~56.0.4` installed this session; committed with Task 1.
- **Icon names verified:** `checkmark`, `close` exist in the bundled Ionicons glyphmap (confirmed previously).
- **Gesture/scroll:** card content is capped (`MAX_CHIPS = 4`, two-column dims) so no inner scroll is needed — avoids the swipe-vs-scroll gesture conflict entirely.

---

## Execution Handoff

Plan saved to `docs/plans/2026-05-24-matchmaking-photocard-redesign.md`. Two execution options:

1. **Subagent-Driven (recommended)** — fresh subagent per task (Sonnet for the two component rewrites; verification done in-session), review between tasks.
2. **Inline Execution** — execute here with checkpoints.

Which approach?
