# vibe.fm Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 4-tab Expo (React Native) demo app that identifies a song, extracts a sonic fingerprint, and matches users on acoustic taste — ship a working iOS demo in a 14h solo sprint.

**Architecture:** Expo SDK 56 Managed Workflow (CNG), Expo Router 4-tab layout. No backend — live scan calls Shazam → FreqBlog → OpenRouter/Gemini client-side; Trending/History/Matchmaking read pre-baked JSON from `assets/data/`. A dev mock toggle injects a hardcoded Track Object so the entire scan-result flow is buildable and demoable in the iOS Simulator (which cannot record real mic audio). One reusable `ResultSheet` component renders fingerprint data across Capture, History, and Trending.

**Tech Stack:** Expo SDK 56, React Native 0.81, Expo Router, react-native-reanimated v4 (+ react-native-worklets, New Architecture), Moti, react-native-gesture-handler, @siteed/expo-audio-studio, expo-haptics, expo-location, expo-file-system, StyleSheet (no NativeWind). Pre-batch via Python `seed.py`.

---

## CRITICAL ENVIRONMENT NOTES (read before Task 1)

1. **SDK 56 = Reanimated v4 + New Architecture only.** Reanimated v4 requires `react-native-worklets`. Install with `npx expo install react-native-reanimated react-native-worklets` so versions match the SDK. Moti must resolve to a Reanimated-v4-compatible version (`npx expo install moti` or latest npm). If you see a "worklets version mismatch" runtime error, the cause is mismatched reanimated/worklets versions — reinstall both via `npx expo install`.
2. **Always use `npx expo install <pkg>`** for any Expo or RN-core package, never `npm install <pkg>@<version>`. This auto-resolves the SDK-54-correct version. The version numbers in the original brief are SDK 51 ranges and are WRONG for SDK 56.
3. **iOS Simulator cannot record microphone audio** and has no Taptic engine. The live mic scan (Task 9) and haptics (Task 11) MUST be verified on a physical iPhone via Expo Go or a dev build. Everything else verifies in the simulator. The dev mock toggle (Task 6) exists so you are never blocked by this while building.
4. **expo-file-system new API** is the default in SDK 56. The file-upload byte-strip path (Task 10) uses the new `File` API, not the legacy `readAsStringAsync`. This is documented in that task.
5. **Env vars need `EXPO_PUBLIC_` prefix** to be readable client-side: `process.env.EXPO_PUBLIC_RAPIDAPI_KEY` etc.

---

## File Structure

```
vibe-fm/
├── app/
│   ├── _layout.tsx                 # Root layout (gesture handler, reanimated init)
│   └── (tabs)/
│       ├── _layout.tsx             # Tab navigator (4 tabs, custom bar styling)
│       ├── index.tsx               # Capture tab (default)
│       ├── trending.tsx            # Trending tab
│       ├── matchmaking.tsx         # Matchmaking tab
│       └── history.tsx             # History tab
├── src/
│   ├── theme/
│   │   └── tokens.ts               # Colors, spacing, typography tokens
│   ├── types/
│   │   └── index.ts                # Track, UserVector, SonicProfile types
│   ├── data/
│   │   ├── store.ts                # Zustand scan-history store
│   │   └── mockTrack.ts            # Hardcoded Track for dev mock toggle
│   ├── lib/
│   │   ├── shazam.ts               # Shazam detect call
│   │   ├── freqblog.ts             # FreqBlog lookup call
│   │   ├── gemini.ts               # OpenRouter/Gemini synthesis call
│   │   ├── scanPipeline.ts         # Orchestrates the 3 calls → Track Object
│   │   └── similarity.ts           # Cosine similarity (PURE — tested)
│   └── components/
│       ├── WaveformRing.tsx        # Moti pulse ring
│       ├── SourceToggle.tsx        # Live Mic / File Upload pill
│       ├── ResultSheet.tsx         # Reusable slide-up fingerprint sheet
│       ├── FingerprintBars.tsx     # Horizontal labeled acoustic bars
│       ├── Tag.tsx                 # Filled/outlined tag pill
│       ├── TrendingRow.tsx         # Trending list row
│       ├── SoulmateCard.tsx        # Matchmaking swipe card
│       └── HistoryRow.tsx          # History list row
├── assets/data/
│   ├── mock_tracks.json            # 20 Track Objects (from seed.py)
│   ├── mock_profiles.json          # 30 UserVector objects (from seed.py)
│   └── sonic_profiles.json         # 10 archetypes (from seed.py)
├── seed.py                         # Pre-batch generator (see setup-hackathon.md)
├── __tests__/
│   ├── similarity.test.ts          # Cosine similarity unit tests
│   └── parsing.test.ts             # API response parsing unit tests
├── .env                            # API keys (EXPO_PUBLIC_ prefixed)
└── OMITTED.md                      # Running log of skipped tests/safeguards
```

---

## Test Strategy (Lean — read this)

This is a 14h sprint. Test discipline is deliberately uneven:

- **TDD (failing test first):** Pure logic only — `similarity.ts` (cosine math) and the API response parsers in `parsing.test.ts` (Shazam/FreqBlog/Gemini shape → Track fields). These are cheap, deterministic, and where a silent bug would wreck the demo (wrong match %, crash on unexpected API shape).
- **Manual device/simulator verify:** All UI, animation, navigation, gesture tasks. Each such task ends with a "Verify" step describing exactly what to look at and where.

Every safeguard or test deliberately skipped gets logged in `OMITTED.md` (Task 0 creates it). If something breaks during the demo and you suspect a skipped guard, that file is your retrofit list.

---

## Task 0: OMITTED.md + repo init

**Files:**
- Create: `OMITTED.md`

- [ ] **Step 1: Initialize the project**

Run:
```bash
npx create-expo-app@latest vibe-fm --template blank-typescript
cd vibe-fm
```
Expected: `vibe-fm/` created with Expo SDK 56, TypeScript, `app/` directory (Expo Router default).

- [ ] **Step 2: Create OMITTED.md with the starting skip-list**

Create `OMITTED.md`:
```markdown
# Omitted Tests & Safeguards (Lean Sprint)

Things skipped to ship in 14h. If the demo breaks and you suspect one of these, retrofit it.

## Tests not written
- Component render tests for every UI component (WaveformRing, ResultSheet, cards, rows). Verified manually on device/sim instead.
- Navigation integration tests (tab switching, modal open/close).
- Gesture tests for the swipe deck (threshold commit / spring-back).
- Animation timing tests (staggered reveal, BPM pulse interval).
- expo-location permission-flow tests.

## Safeguards thinned
- No retry/backoff on any API call — single attempt, then graceful-degrade or error sheet.
- No request timeout tuning beyond a single fetch timeout where noted.
- No input sanitization on Shazam title/artist before FreqBlog query (trusted internal flow).
- No persistence of scan history across app restarts (in-memory Zustand only) — see note in Task 5 if you want AsyncStorage.
- No Android-specific verification — iOS demo only.
- File-upload path (Task 10) lower priority than live mic; verify only if demoing upload.

## Known hardware constraints (not bugs)
- iOS Simulator: no mic recording, no haptics. Live scan + haptics verify on physical iPhone only.
```

- [ ] **Step 3: Commit**

```bash
git add OMITTED.md
git commit -m "chore: scaffold Expo project and document omitted tests"
```

---

## Task 1: Install dependencies

**Files:**
- Modify: `package.json` (via installer commands)

- [ ] **Step 1: Install Expo/RN packages via expo install (auto-resolves SDK 56 versions)**

Run:
```bash
npx expo install expo-router expo-haptics expo-location expo-file-system
npx expo install react-native-reanimated react-native-worklets react-native-gesture-handler
npx expo install @siteed/expo-audio-studio moti
```
Expected: each package added to `package.json`. `react-native-reanimated` resolves to v4.x, `react-native-worklets` installed alongside it.

- [ ] **Step 2: Install Zustand (plain npm — not an Expo package)**

Run:
```bash
npm install zustand
```
Expected: `zustand` in `package.json` dependencies.

- [ ] **Step 3: Configure Babel for Reanimated v4 + worklets**

Verify `babel.config.js` exists. With SDK 56, `babel-preset-expo` auto-includes the worklets/reanimated plugin, so it should read:
```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
```
Do NOT manually add `react-native-reanimated/plugin` — in SDK 56 it is handled by the preset and adding it manually causes a duplicate-plugin error.

- [ ] **Step 4: Verify it boots**

Run:
```bash
npx expo start --clear
```
Press `i` to open the iOS simulator (or scan QR with Expo Go on your iPhone).
Expected: app boots to the default Expo Router screen with no red error box. If you see a "worklets version mismatch" error, re-run `npx expo install react-native-reanimated react-native-worklets`.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json babel.config.js
git commit -m "chore: install core dependencies for SDK 56"
```

---

## Task 2: Theme tokens

**Files:**
- Create: `src/theme/tokens.ts`

- [ ] **Step 1: Write the tokens file**

Create `src/theme/tokens.ts`:
```typescript
export const colors = {
  background: '#000000',
  surface: '#0D0D0D',
  surfaceElevated: '#1A1A1A',
  border: 'rgba(255,255,255,0.08)',
  purple: '#7C3AED',   // sonic profile, archetype, mood
  cyan: '#06B6D4',     // audio signal, acoustic bars, waveform
  green: '#22C55E',    // BPM pulse, match confirm, positive
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textTertiary: '#4B5563',
} as const;

export const spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32,
} as const;

export const fonts = {
  // System fallbacks — no custom font loading in the sprint.
  // mono is used for ALL numeric values (tabular, no layout shift).
  display: 'System',
  mono: 'Courier New',
  body: 'System',
} as const;

export const radius = { sm: 8, md: 12, lg: 20, pill: 999 } as const;
```

- [ ] **Step 2: Verify it imports**

Run:
```bash
npx tsc --noEmit
```
Expected: no type errors referencing `tokens.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/theme/tokens.ts
git commit -m "feat: add theme tokens"
```

> **OMITTED note:** Custom grotesque + monospace fonts (expo-font) skipped — using System / Courier New. If you want the real look, add `expo-font` and load Space Grotesk + a mono face, then update `fonts`. Log this in OMITTED.md if you skip it permanently.

---

## Task 3: Type definitions

**Files:**
- Create: `src/types/index.ts`

- [ ] **Step 1: Write the types**

Create `src/types/index.ts`:
```typescript
export interface SonicProfile {
  name: string;
  tags: string[];
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  albumArt: string;
  tempo: number;
  energy: number;
  valence: number;
  danceability: number;
  acousticness: number;
  instrumentalness: number;
  speechiness: number;
  key: number;
  mode: number;
  microGenre: string;
  moodLabel: string;
  qualitativeDescription: string;
  sonicProfile: SonicProfile;
  location?: string;
  scannedAt: string;
}

export interface UserVector {
  userId: string;
  displayName: string;
  location: string;
  vector: [number, number, number, number, number]; // [tempo, energy, acousticness, instrumentalness, valence]
  topMicroGenres: string[];
  topArtists: string[];
  topSongs: string[];
  scanCount: number;
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add Track and UserVector types"
```

---

## Task 4: Cosine similarity (TDD)

**Files:**
- Create: `src/lib/similarity.ts`
- Test: `__tests__/similarity.test.ts`

- [ ] **Step 1: Add Jest (jest-expo preset)**

Run:
```bash
npx expo install jest-expo jest
npm install --save-dev @types/jest
```
Add to `package.json`:
```json
"scripts": {
  "test": "jest"
},
"jest": {
  "preset": "jest-expo"
}
```

- [ ] **Step 2: Write the failing test**

Create `__tests__/similarity.test.ts`:
```typescript
import { cosineSimilarityPercent, normalizeVector } from '../src/lib/similarity';

describe('cosineSimilarityPercent', () => {
  it('returns 100 for identical vectors', () => {
    const v: [number, number, number, number, number] = [120, 0.8, 0.1, 0.05, 0.6];
    expect(cosineSimilarityPercent(v, v)).toBe(100);
  });

  it('returns a lower score for divergent vectors', () => {
    const a: [number, number, number, number, number] = [60, 0.1, 0.9, 0.8, 0.1];
    const b: [number, number, number, number, number] = [180, 0.95, 0.0, 0.0, 0.95];
    const score = cosineSimilarityPercent(a, b);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThan(100);
  });

  it('handles a zero vector without NaN', () => {
    const zero: [number, number, number, number, number] = [0, 0, 0, 0, 0];
    const b: [number, number, number, number, number] = [120, 0.5, 0.5, 0.5, 0.5];
    expect(Number.isNaN(cosineSimilarityPercent(zero, b))).toBe(false);
  });

  it('normalizes tempo onto 0–1 scale alongside other dims', () => {
    // 120 BPM on a 0–200 scale = 0.6
    expect(normalizeVector([120, 0.5, 0.5, 0.5, 0.5])[0]).toBeCloseTo(0.6, 5);
  });
});
```

- [ ] **Step 3: Run test — verify it fails**

Run: `npm test -- similarity`
Expected: FAIL — "Cannot find module '../src/lib/similarity'".

- [ ] **Step 4: Implement**

Create `src/lib/similarity.ts`:
```typescript
type Vec5 = [number, number, number, number, number];

const TEMPO_MAX = 200; // normalize BPM onto 0–1 like the other dims

export function normalizeVector(v: Vec5): Vec5 {
  return [v[0] / TEMPO_MAX, v[1], v[2], v[3], v[4]];
}

export function cosineSimilarityPercent(a: Vec5, b: Vec5): number {
  const na = normalizeVector(a);
  const nb = normalizeVector(b);
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < 5; i++) {
    dot += na[i] * nb[i];
    magA += na[i] * na[i];
    magB += nb[i] * nb[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  if (denom === 0) return 0;
  const sim = dot / denom; // -1..1, but our values are non-negative so 0..1
  return Math.round(Math.max(0, Math.min(1, sim)) * 100);
}
```

- [ ] **Step 5: Run test — verify it passes**

Run: `npm test -- similarity`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add src/lib/similarity.ts __tests__/similarity.test.ts package.json
git commit -m "feat: cosine similarity for matchmaking compatibility"
```

---

## Task 5: Scan-history store (Zustand)

**Files:**
- Create: `src/data/store.ts`

- [ ] **Step 1: Write the store**

Create `src/data/store.ts`:
```typescript
import { create } from 'zustand';
import { Track, UserVector } from '../types';

interface AppState {
  history: Track[];
  addScan: (track: Track) => void;
  // Derived user vector from scan history: averaged [tempo, energy, acousticness, instrumentalness, valence]
  userVector: () => [number, number, number, number, number];
  scanCount: () => number;
}

export const useStore = create<AppState>((set, get) => ({
  history: [],
  addScan: (track) => set((s) => ({ history: [track, ...s.history] })),
  scanCount: () => get().history.length,
  userVector: () => {
    const h = get().history;
    if (h.length === 0) return [120, 0.5, 0.3, 0.1, 0.5];
    const sum = h.reduce<[number, number, number, number, number]>(
      (acc, t) => [
        acc[0] + t.tempo,
        acc[1] + t.energy,
        acc[2] + t.acousticness,
        acc[3] + t.instrumentalness,
        acc[4] + t.valence,
      ],
      [0, 0, 0, 0, 0],
    );
    return [sum[0] / h.length, sum[1] / h.length, sum[2] / h.length, sum[3] / h.length, sum[4] / h.length];
  },
}));
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/data/store.ts
git commit -m "feat: scan-history store with derived user vector"
```

> **OMITTED note:** History is in-memory only — lost on app restart. For persistence, wrap with zustand `persist` middleware + AsyncStorage (`npx expo install @react-native-async-storage/async-storage`). Skipped for the sprint; demo runs in one session. Log in OMITTED.md.

---

## Task 6: Mock Track + dev toggle

**Files:**
- Create: `src/data/mockTrack.ts`

This is the unblock-the-simulator task. The mock Track lets you build and demo the entire scan-result UI without a physical device.

- [ ] **Step 1: Write the mock**

Create `src/data/mockTrack.ts`:
```typescript
import { Track } from '../types';

// Dev mock: injected when EXPO_PUBLIC_USE_MOCK_SCAN === 'true' OR when running
// in the simulator where mic capture is impossible. Lets the full result-sheet
// flow be built and demoed without a physical device.
export const MOCK_TRACK: Track = {
  id: 'mock-001',
  title: 'Blinding Lights',
  artist: 'The Weeknd',
  album: 'After Hours',
  albumArt: 'https://picsum.photos/seed/blinding/300/300',
  tempo: 171,
  energy: 0.73,
  valence: 0.33,
  danceability: 0.51,
  acousticness: 0.0,
  instrumentalness: 0.0,
  speechiness: 0.06,
  key: 1,
  mode: 1,
  microGenre: 'Synthwave',
  moodLabel: 'Euphoric',
  qualitativeDescription:
    'A relentless synthwave pulse drives icy retro textures over a propulsive beat. The track balances melancholic vocals against bright neon synths, landing somewhere between nostalgia and adrenaline.',
  sonicProfile: { name: 'Euphoric Rave', tags: ['energetic', 'synthetic', 'driving'] },
  scannedAt: new Date().toISOString(),
};

export const USE_MOCK_SCAN = process.env.EXPO_PUBLIC_USE_MOCK_SCAN === 'true';
```

- [ ] **Step 2: Add the toggle to .env**

Create or append `.env`:
```env
EXPO_PUBLIC_RAPIDAPI_KEY=
EXPO_PUBLIC_RAPIDAPI_HOST=shazam.p.rapidapi.com
EXPO_PUBLIC_FREQBLOG_API_KEY=
EXPO_PUBLIC_OPENROUTER_API_KEY=
EXPO_PUBLIC_USE_MOCK_SCAN=true
```
Set `EXPO_PUBLIC_USE_MOCK_SCAN=true` while building in the simulator. Flip to `false` on the physical iPhone to exercise the real pipeline.

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/data/mockTrack.ts .env
git commit -m "feat: dev mock track + scan toggle for simulator builds"
```

> Note: ensure `.env` is gitignored if it ever holds real keys. For the sprint it's empty placeholders + the toggle, so committing is fine. If you paste real keys, add `.env` to `.gitignore` and `git rm --cached .env`.

---

## Task 7: Navigation shell (4 tabs)

**Files:**
- Modify/Create: `app/_layout.tsx`
- Create: `app/(tabs)/_layout.tsx`
- Create: `app/(tabs)/index.tsx`, `app/(tabs)/trending.tsx`, `app/(tabs)/matchmaking.tsx`, `app/(tabs)/history.tsx`

- [ ] **Step 1: Root layout**

Create/replace `app/_layout.tsx`:
```tsx
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#000000' }}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </GestureHandlerRootView>
  );
}
```

- [ ] **Step 2: Tab layout**

Create `app/(tabs)/_layout.tsx`:
```tsx
import { Tabs } from 'expo-router';
import { colors } from '../../src/theme/tokens';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.cyan,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: { fontSize: 11, letterSpacing: 1 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'CAPTURE' }} />
      <Tabs.Screen name="trending" options={{ title: 'TRENDING' }} />
      <Tabs.Screen name="matchmaking" options={{ title: 'MATCH' }} />
      <Tabs.Screen name="history" options={{ title: 'HISTORY' }} />
    </Tabs>
  );
}
```

- [ ] **Step 3: Stub the four screens**

Create `app/(tabs)/index.tsx`:
```tsx
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../src/theme/tokens';

export default function Capture() {
  return (
    <View style={styles.c}><Text style={styles.t}>CAPTURE</Text></View>
  );
}
const styles = StyleSheet.create({
  c: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  t: { color: colors.textPrimary, letterSpacing: 2 },
});
```
Create `app/(tabs)/trending.tsx`, `app/(tabs)/matchmaking.tsx`, `app/(tabs)/history.tsx` — identical pattern, swap the label text (`TRENDING`, `MATCH`, `HISTORY`) and component name (`Trending`, `Matchmaking`, `History`).

- [ ] **Step 4: Verify in simulator**

Run: `npx expo start --clear` → press `i`.
Expected: 4-tab bottom bar, dark theme, Capture is the default tab, active tab label is cyan. Tapping each tab shows its placeholder.

- [ ] **Step 5: Commit**

```bash
git add app/
git commit -m "feat: 4-tab navigation shell"
```

---

## Task 8: Reusable fingerprint components

**Files:**
- Create: `src/components/Tag.tsx`
- Create: `src/components/FingerprintBars.tsx`

- [ ] **Step 1: Tag component**

Create `src/components/Tag.tsx`:
```tsx
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius } from '../theme/tokens';

export function Tag({ label, variant = 'filled', tint = colors.purple }:
  { label: string; variant?: 'filled' | 'outlined'; tint?: string }) {
  const filled = variant === 'filled';
  return (
    <View style={[styles.tag, {
      backgroundColor: filled ? tint : 'transparent',
      borderColor: tint,
    }]}>
      <Text style={[styles.txt, { color: filled ? '#000' : tint }]}>{label.toUpperCase()}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  tag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill, borderWidth: 1, marginRight: 8 },
  txt: { fontSize: 11, letterSpacing: 1, fontWeight: '700' },
});
```

- [ ] **Step 2: FingerprintBars component**

Create `src/components/FingerprintBars.tsx`:
```tsx
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../theme/tokens';
import { Track } from '../types';

const BARS: { key: keyof Track; label: string }[] = [
  { key: 'energy', label: 'ENERGY' },
  { key: 'valence', label: 'VALENCE' },
  { key: 'danceability', label: 'DANCE' },
  { key: 'acousticness', label: 'ACOUSTIC' },
  { key: 'instrumentalness', label: 'INSTRUMENTAL' },
  { key: 'speechiness', label: 'SPEECH' },
];

export function FingerprintBars({ track }: { track: Track }) {
  return (
    <View>
      {BARS.map(({ key, label }) => {
        const value = track[key] as number;
        return (
          <View key={key} style={styles.row}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${Math.round(value * 100)}%` }]} />
            </View>
            <Text style={styles.value}>{value.toFixed(2)}</Text>
          </View>
        );
      })}
    </View>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginVertical: 6 },
  label: { color: colors.textSecondary, fontSize: 10, letterSpacing: 1, width: 96 },
  track: { flex: 1, height: 6, backgroundColor: colors.surfaceElevated, borderRadius: 3, overflow: 'hidden' },
  fill: { height: 6, backgroundColor: colors.cyan, borderRadius: 3 },
  value: { color: colors.textPrimary, fontFamily: fonts.mono, fontSize: 12, width: 44, textAlign: 'right' },
});
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: no errors. (Visual verification happens in Task 8b via ResultSheet.)

- [ ] **Step 4: Commit**

```bash
git add src/components/Tag.tsx src/components/FingerprintBars.tsx
git commit -m "feat: Tag and FingerprintBars components"
```

---

## Task 8b: ResultSheet (reusable, staggered reveal)

**Files:**
- Create: `src/components/ResultSheet.tsx`

- [ ] **Step 1: Write the ResultSheet**

Create `src/components/ResultSheet.tsx`:
```tsx
import { View, Text, Image, StyleSheet, Pressable } from 'react-native';
import { MotiView } from 'moti';
import { colors, fonts, radius, spacing } from '../theme/tokens';
import { Track } from '../types';
import { FingerprintBars } from './FingerprintBars';
import { Tag } from './Tag';

const STAGGER = 80; // ms between sections

function Section({ index, children }: { index: number; children: React.ReactNode }) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 260, delay: index * STAGGER }}
    >
      {children}
    </MotiView>
  );
}

export function ResultSheet({ track, onClose }: { track: Track; onClose: () => void }) {
  return (
    <View style={styles.backdrop}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <MotiView
        from={{ translateY: 600 }}
        animate={{ translateY: 0 }}
        transition={{ type: 'spring', damping: 18 }}
        style={styles.sheet}
      >
        <View style={styles.handle} />

        <Section index={0}>
          <View style={styles.hero}>
            <Image source={{ uri: track.albumArt }} style={styles.art} />
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={styles.title}>{track.title}</Text>
              <Text style={styles.artist}>{track.artist}</Text>
            </View>
            <View style={styles.bpmBox}>
              <Text style={styles.bpm}>{Math.round(track.tempo)}</Text>
              <Text style={styles.bpmLabel}>BPM</Text>
            </View>
          </View>
        </Section>

        <Section index={1}>
          <View style={styles.tagRow}>
            <Tag label={track.moodLabel} variant="filled" tint={colors.purple} />
            <Tag label={track.microGenre} variant="outlined" tint={colors.purple} />
          </View>
        </Section>

        <Section index={2}>
          <FingerprintBars track={track} />
        </Section>

        <Section index={3}>
          <Text style={styles.desc}>{track.qualitativeDescription}</Text>
        </Section>

        <Section index={4}>
          <View style={styles.profile}>
            <Text style={styles.profileName}>{track.sonicProfile.name.toUpperCase()}</Text>
            <View style={styles.tagRow}>
              {track.sonicProfile.tags.map((t) => (
                <Tag key={t} label={t} variant="outlined" tint={colors.purple} />
              ))}
            </View>
          </View>
        </Section>
      </MotiView>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg,
    borderColor: colors.border, borderWidth: 1, padding: spacing.lg, height: '75%' },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.textTertiary, alignSelf: 'center', marginBottom: spacing.md },
  hero: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  art: { width: 64, height: 64, borderRadius: radius.sm, backgroundColor: colors.surfaceElevated },
  title: { color: colors.textPrimary, fontSize: 18, fontWeight: '700' },
  artist: { color: colors.textSecondary, fontSize: 14, marginTop: 2 },
  bpmBox: { alignItems: 'center' },
  bpm: { color: colors.green, fontFamily: fonts.mono, fontSize: 20, fontWeight: '700' },
  bpmLabel: { color: colors.green, fontSize: 9, letterSpacing: 1 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', marginVertical: spacing.sm },
  desc: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, marginVertical: spacing.md },
  profile: { marginTop: spacing.sm },
  profileName: { color: colors.purple, fontSize: 13, letterSpacing: 2, fontWeight: '700', marginBottom: spacing.xs },
});
```

- [ ] **Step 2: Temporarily wire it into Capture to verify visually**

Temporarily edit `app/(tabs)/index.tsx`:
```tsx
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { useState } from 'react';
import { colors } from '../../src/theme/tokens';
import { ResultSheet } from '../../src/components/ResultSheet';
import { MOCK_TRACK } from '../../src/data/mockTrack';

export default function Capture() {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.c}>
      <Pressable onPress={() => setOpen(true)}><Text style={styles.t}>TAP TO TEST SHEET</Text></Pressable>
      {open && <ResultSheet track={MOCK_TRACK} onClose={() => setOpen(false)} />}
    </View>
  );
}
const styles = StyleSheet.create({
  c: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  t: { color: colors.cyan, letterSpacing: 2 },
});
```

- [ ] **Step 3: Verify in simulator**

Run app → tap "TAP TO TEST SHEET". Expected: sheet springs up from bottom to 75% height; sections fade/slide in one after another (~80ms apart): hero → tags → bars → description → profile. Album art is a gray box (picsum may not load in sim — fine). BPM shows green `171`. Bars are cyan, values monospace on the right. Tap the dimmed backdrop → sheet closes. This stub is replaced in Task 9.

- [ ] **Step 4: Commit**

```bash
git add src/components/ResultSheet.tsx app/(tabs)/index.tsx
git commit -m "feat: reusable ResultSheet with staggered reveal"
```

---

## Task 9: API parsers (TDD) + scan pipeline

**Files:**
- Create: `src/lib/shazam.ts`, `src/lib/freqblog.ts`, `src/lib/gemini.ts`, `src/lib/scanPipeline.ts`
- Test: `__tests__/parsing.test.ts`

The risky part of the live path is parsing unpredictable API JSON into our `Track`. We TDD the parsers (pure functions) and leave the network calls thin.

- [ ] **Step 1: Write failing parser tests**

Create `__tests__/parsing.test.ts`:
```typescript
import { parseShazam } from '../src/lib/shazam';
import { parseFreqblog } from '../src/lib/freqblog';
import { parseGemini } from '../src/lib/gemini';

describe('parseShazam', () => {
  it('extracts title, artist, album art from a v2 detect response', () => {
    const raw = {
      track: {
        key: '12345',
        title: 'Blinding Lights',
        subtitle: 'The Weeknd',
        images: { coverart: 'https://img/cover.jpg' },
        sections: [{ metadata: [{ title: 'Album', text: 'After Hours' }] }],
      },
    };
    const r = parseShazam(raw);
    expect(r).toEqual({
      id: '12345',
      title: 'Blinding Lights',
      artist: 'The Weeknd',
      album: 'After Hours',
      albumArt: 'https://img/cover.jpg',
    });
  });

  it('returns null when no track present (HTTP 204 / no match)', () => {
    expect(parseShazam({})).toBeNull();
  });
});

describe('parseFreqblog', () => {
  it('maps bpm->tempo and copies acoustic fields with defaults', () => {
    const raw = { bpm: 171, energy: 0.73, valence: 0.33, danceability: 0.51,
      acousticness: 0, instrumentalness: 0, speechiness: 0.06, key: 1, mood: 'Euphoric', genre: 'Synthwave' };
    const r = parseFreqblog(raw);
    expect(r.tempo).toBe(171);
    expect(r.moodLabel).toBe('Euphoric');
    expect(r.microGenre).toBe('Synthwave');
    expect(r.mode).toBe(1);
  });

  it('fills safe defaults for missing fields', () => {
    const r = parseFreqblog({});
    expect(r.tempo).toBe(120);
    expect(r.energy).toBe(0.5);
    expect(r.microGenre).toBe('Unknown');
  });
});

describe('parseGemini', () => {
  it('parses a JSON-string content into description + profile', () => {
    const content = JSON.stringify({
      qualitativeDescription: 'Bright and driving.',
      sonicProfile: { name: 'Euphoric Rave', tags: ['energetic', 'synthetic'] },
    });
    const r = parseGemini(content);
    expect(r.qualitativeDescription).toBe('Bright and driving.');
    expect(r.sonicProfile.name).toBe('Euphoric Rave');
  });

  it('returns graceful defaults on malformed JSON', () => {
    const r = parseGemini('not json {{{');
    expect(r.qualitativeDescription).toContain('unavailable');
    expect(r.sonicProfile.name).toBe('Unclassified');
  });
});
```

- [ ] **Step 2: Run — verify fails**

Run: `npm test -- parsing`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement shazam.ts**

Create `src/lib/shazam.ts`:
```typescript
interface ShazamParsed { id: string; title: string; artist: string; album: string; albumArt: string; }

export function parseShazam(raw: any): ShazamParsed | null {
  const t = raw?.track;
  if (!t || !t.title) return null;
  let album = '';
  const sections = t.sections ?? [];
  for (const s of sections) {
    const meta = s.metadata ?? [];
    const albumRow = meta.find((m: any) => m.title === 'Album');
    if (albumRow) { album = albumRow.text; break; }
  }
  return {
    id: String(t.key ?? Date.now()),
    title: t.title,
    artist: t.subtitle ?? 'Unknown Artist',
    album: album || t.title,
    albumArt: t.images?.coverart ?? '',
  };
}

export async function detectSong(base64Pcm: string): Promise<ShazamParsed | null> {
  const res = await fetch('https://shazam.p.rapidapi.com/songs/v2/detect', {
    method: 'POST',
    headers: {
      'content-type': 'text/plain',
      'X-RapidAPI-Key': process.env.EXPO_PUBLIC_RAPIDAPI_KEY ?? '',
      'X-RapidAPI-Host': process.env.EXPO_PUBLIC_RAPIDAPI_HOST ?? 'shazam.p.rapidapi.com',
    },
    body: base64Pcm,
  });
  if (res.status === 204) return null;
  const json = await res.json();
  return parseShazam(json);
}
```

- [ ] **Step 4: Implement freqblog.ts**

Create `src/lib/freqblog.ts`:
```typescript
interface FreqblogParsed {
  tempo: number; energy: number; valence: number; danceability: number;
  acousticness: number; instrumentalness: number; speechiness: number;
  key: number; mode: number; moodLabel: string; microGenre: string;
}

export function parseFreqblog(raw: any): FreqblogParsed {
  const n = (v: any, d: number) => (typeof v === 'number' ? v : d);
  return {
    tempo: n(raw?.bpm, 120),
    energy: n(raw?.energy, 0.5),
    valence: n(raw?.valence, 0.5),
    danceability: n(raw?.danceability, 0.5),
    acousticness: n(raw?.acousticness, 0.2),
    instrumentalness: n(raw?.instrumentalness, 0.1),
    speechiness: n(raw?.speechiness, 0.1),
    key: n(raw?.key, 0),
    mode: raw?.mode === 0 ? 0 : 1,
    moodLabel: raw?.mood ?? 'Unknown',
    microGenre: raw?.genre ?? 'Unknown',
  };
}

export async function lookupFeatures(title: string, artist: string): Promise<FreqblogParsed> {
  const url = `https://api.freqblog.com/lookup?track=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`;
  const res = await fetch(url, { headers: { 'X-API-Key': process.env.EXPO_PUBLIC_FREQBLOG_API_KEY ?? '' } });
  if (!res.ok) return parseFreqblog({}); // graceful defaults
  return parseFreqblog(await res.json());
}
```

- [ ] **Step 5: Implement gemini.ts**

Create `src/lib/gemini.ts`:
```typescript
import { SonicProfile } from '../types';

interface GeminiParsed { qualitativeDescription: string; sonicProfile: SonicProfile; }

export function parseGemini(content: string): GeminiParsed {
  try {
    const o = JSON.parse(content);
    return {
      qualitativeDescription: o.qualitativeDescription ?? 'Description unavailable.',
      sonicProfile: {
        name: o.sonicProfile?.name ?? 'Unclassified',
        tags: Array.isArray(o.sonicProfile?.tags) ? o.sonicProfile.tags : [],
      },
    };
  } catch {
    return { qualitativeDescription: 'Description unavailable.', sonicProfile: { name: 'Unclassified', tags: [] } };
  }
}

export async function synthesize(features: object, sonicProfiles: object): Promise<GeminiParsed> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.EXPO_PUBLIC_OPENROUTER_API_KEY ?? ''}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      response_format: { type: 'json_object' },
      reasoning: { exclude: true },
      messages: [{
        role: 'user',
        content: `Given this track's acoustic data: ${JSON.stringify(features)}, and these sonic archetype profiles: ${JSON.stringify(sonicProfiles)}, return ONLY a JSON object with: {"qualitativeDescription": "2-3 sentences describing the sonic texture and emotional character", "sonicProfile": { "name": "matched archetype name", "tags": ["tag1","tag2"] }}`,
      }],
    }),
  });
  const json = await res.json();
  return parseGemini(json?.choices?.[0]?.message?.content ?? '');
}
```

- [ ] **Step 6: Run parser tests — verify pass**

Run: `npm test -- parsing`
Expected: PASS (6 tests).

- [ ] **Step 7: Implement scanPipeline.ts (orchestration + graceful degrade + mock)**

Create `src/lib/scanPipeline.ts`:
```typescript
import { Track } from '../types';
import { detectSong } from './shazam';
import { lookupFeatures } from './freqblog';
import { synthesize } from './gemini';
import { MOCK_TRACK, USE_MOCK_SCAN } from '../data/mockTrack';
import sonicProfiles from '../../assets/data/sonic_profiles.json';

export type ScanResult = { ok: true; track: Track } | { ok: false; reason: string };

export async function runScan(base64Pcm: string): Promise<ScanResult> {
  if (USE_MOCK_SCAN) {
    return { ok: true, track: { ...MOCK_TRACK, scannedAt: new Date().toISOString() } };
  }
  try {
    const id = await detectSong(base64Pcm);
    if (!id) return { ok: false, reason: 'Could not identify' };

    // FreqBlog + Gemini degrade gracefully; never throw out of here.
    const features = await lookupFeatures(id.title, id.artist).catch(() => null);
    const f = features ?? {
      tempo: 120, energy: 0.5, valence: 0.5, danceability: 0.5, acousticness: 0.2,
      instrumentalness: 0.1, speechiness: 0.1, key: 0, mode: 1, moodLabel: 'Unknown', microGenre: 'Unknown',
    };
    const g = await synthesize(f, sonicProfiles).catch(() => ({
      qualitativeDescription: 'Description unavailable.',
      sonicProfile: { name: 'Unclassified', tags: [] as string[] },
    }));

    const track: Track = {
      id: id.id,
      title: id.title,
      artist: id.artist,
      album: id.album,
      albumArt: id.albumArt,
      tempo: f.tempo, energy: f.energy, valence: f.valence, danceability: f.danceability,
      acousticness: f.acousticness, instrumentalness: f.instrumentalness, speechiness: f.speechiness,
      key: f.key, mode: f.mode, microGenre: f.microGenre, moodLabel: f.moodLabel,
      qualitativeDescription: g.qualitativeDescription, sonicProfile: g.sonicProfile,
      scannedAt: new Date().toISOString(),
    };
    return { ok: true, track };
  } catch (e) {
    return { ok: false, reason: 'Could not identify' };
  }
}
```

Note: this imports `assets/data/sonic_profiles.json` — that file must exist (Task 13 / seed.py). If running before seed.py, create a placeholder `assets/data/sonic_profiles.json` containing `[]` so the import resolves.

- [ ] **Step 8: Commit**

```bash
git add src/lib/ __tests__/parsing.test.ts
git commit -m "feat: API parsers (tested) and scan pipeline with graceful degradation"
```

---

## Task 10: Capture tab — recording + scan flow

**Files:**
- Create: `src/components/WaveformRing.tsx`
- Create: `src/components/SourceToggle.tsx`
- Modify: `app/(tabs)/index.tsx`

- [ ] **Step 1: WaveformRing**

Create `src/components/WaveformRing.tsx`:
```tsx
import { MotiView } from 'moti';
import { StyleSheet } from 'react-native';
import { colors } from '../theme/tokens';

export function WaveformRing({ active, amplitude = 0 }: { active: boolean; amplitude?: number }) {
  // Idle: slow ambient breathing. Active: scale tracks amplitude (0..1).
  return (
    <MotiView
      from={{ scale: 1, opacity: 0.6 }}
      animate={active ? { scale: 1 + amplitude * 0.4, opacity: 0.9 } : { scale: 1.08, opacity: 0.6 }}
      transition={active
        ? { type: 'timing', duration: 120 }
        : { type: 'timing', duration: 1400, loop: true }}
      style={styles.ring}
    />
  );
}
const styles = StyleSheet.create({
  ring: { width: 200, height: 200, borderRadius: 100, borderWidth: 2, borderColor: colors.cyan },
});
```

- [ ] **Step 2: SourceToggle**

Create `src/components/SourceToggle.tsx`:
```tsx
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { colors, radius } from '../theme/tokens';

export function SourceToggle({ value, onChange }:
  { value: 'mic' | 'file'; onChange: (v: 'mic' | 'file') => void }) {
  return (
    <View style={styles.pill}>
      {(['mic', 'file'] as const).map((opt) => {
        const active = value === opt;
        return (
          <Pressable key={opt} onPress={() => onChange(opt)}
            style={[styles.seg, active && { backgroundColor: colors.surfaceElevated }]}>
            <Text style={[styles.txt, { color: active ? colors.cyan : colors.textSecondary }]}>
              {opt === 'mic' ? 'LIVE MIC' : 'FILE UPLOAD'}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
const styles = StyleSheet.create({
  pill: { flexDirection: 'row', borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, padding: 3 },
  seg: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.pill },
  txt: { fontSize: 11, letterSpacing: 1, fontWeight: '700' },
});
```

- [ ] **Step 3: Wire Capture screen — recording + scan**

Replace `app/(tabs)/index.tsx`:
```tsx
import { View, Pressable, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useState, useRef } from 'react';
import { useExpoAudioStream } from '@siteed/expo-audio-studio';
import { colors, spacing } from '../../src/theme/tokens';
import { WaveformRing } from '../../src/components/WaveformRing';
import { SourceToggle } from '../../src/components/SourceToggle';
import { ResultSheet } from '../../src/components/ResultSheet';
import { runScan } from '../../src/lib/scanPipeline';
import { useStore } from '../../src/data/store';
import { Track } from '../../src/types';

export default function Capture() {
  const [source, setSource] = useState<'mic' | 'file'>('mic');
  const [phase, setPhase] = useState<'idle' | 'listening' | 'processing'>('idle');
  const [result, setResult] = useState<Track | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [amp, setAmp] = useState(0);
  const pcmChunks = useRef<string[]>([]);
  const addScan = useStore((s) => s.addScan);
  const { startRecording, stopRecording } = useExpoAudioStream();

  async function handleScan() {
    if (phase !== 'idle') return;
    setError(null);
    pcmChunks.current = [];
    setPhase('listening');
    try {
      await startRecording({
        sampleRate: 44100,
        channels: 1,
        encoding: 'pcm_16bit',
        interval: 100,
        onAudioStream: async (event: any) => {
          // event.data is base64 raw PCM (no WAV header)
          pcmChunks.current.push(event.data);
          // crude amplitude proxy from chunk length variation; visual only
          setAmp(Math.min(1, (event.data?.length ?? 0) / 20000));
        },
      });
      // record ~5s
      setTimeout(async () => {
        await stopRecording();
        setPhase('processing');
        const base64 = pcmChunks.current.join('');
        const res = await runScan(base64);
        if (res.ok) {
          addScan(res.track);
          setResult(res.track);
        } else {
          setError(res.reason);
        }
        setPhase('idle');
      }, 5000);
    } catch (e) {
      setError('Could not identify');
      setPhase('idle');
    }
  }

  return (
    <View style={styles.c}>
      <View style={styles.top}><SourceToggle value={source} onChange={setSource} /></View>

      <Pressable onPress={handleScan} disabled={phase !== 'idle'}>
        <WaveformRing active={phase === 'listening'} amplitude={amp} />
      </Pressable>

      {phase === 'listening' && <Text style={styles.hint}>LISTENING…</Text>}
      {phase === 'processing' && <ActivityIndicator color={colors.cyan} style={{ marginTop: spacing.lg }} />}
      {phase === 'idle' && !result && <Text style={styles.hint}>TAP TO SCAN</Text>}

      {error && (
        <View style={styles.errorSheet}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={handleScan}><Text style={styles.retry}>RETRY</Text></Pressable>
        </View>
      )}

      {result && <ResultSheet track={result} onClose={() => setResult(null)} />}
    </View>
  );
}
const styles = StyleSheet.create({
  c: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  top: { position: 'absolute', top: 80 },
  hint: { color: colors.textSecondary, letterSpacing: 2, marginTop: spacing.xl, fontSize: 11 },
  errorSheet: { position: 'absolute', bottom: 40, backgroundColor: colors.surface, borderColor: colors.border,
    borderWidth: 1, borderRadius: 16, padding: spacing.lg, alignItems: 'center' },
  errorText: { color: colors.textPrimary, marginBottom: spacing.sm },
  retry: { color: colors.cyan, letterSpacing: 2, fontWeight: '700' },
});
```

> **IMPORTANT — verify the `@siteed/expo-audio-studio` API surface against its installed version.** The hook name (`useExpoAudioStream`), the `startRecording` option keys (`sampleRate`, `channels`, `encoding`, `onAudioStream`), and the event field (`event.data`) MUST be confirmed against the package's actual docs/types for the version `expo install` pulled. If the API differs, adapt this step — the contract that matters downstream is: produce a single base64 string of raw 44100Hz mono 16-bit PCM and pass it to `runScan`. Log any deviation in OMITTED.md.

- [ ] **Step 4: Verify in simulator with mock toggle ON**

Ensure `.env` has `EXPO_PUBLIC_USE_MOCK_SCAN=true`. Run app → tap the ring. Expected: ring shows listening state ~5s, then processing spinner, then ResultSheet slides up with the mock track (runScan short-circuits to MOCK_TRACK, so no real mic needed). The scan is added to history (verify in Task 12).

- [ ] **Step 5: Verify on physical iPhone with mock toggle OFF (defer if no device yet)**

Set `EXPO_PUBLIC_USE_MOCK_SCAN=false`, restart with `npx expo start --clear`, open in Expo Go on iPhone, grant mic permission, play a song near the phone, tap ring. Expected: real Shazam result or graceful "Could not identify". This is the only step that needs hardware.

- [ ] **Step 6: Commit**

```bash
git add src/components/WaveformRing.tsx src/components/SourceToggle.tsx app/(tabs)/index.tsx
git commit -m "feat: Capture tab recording and scan flow"
```

> **OMITTED note:** File-upload source path is stubbed (toggle switches but only mic records). To implement: use expo-file-system new `File` API to read the picked file, slice off the first 44 bytes (WAV header) at the byte level, base64-encode the remaining bytes, pass to `runScan`. Do NOT trim base64 characters. Skipped unless you plan to demo upload. Log in OMITTED.md.

---

## Task 11: BPM haptic pulse

**Files:**
- Modify: `src/components/ResultSheet.tsx`

- [ ] **Step 1: Add a post-recording haptic pulse to the hero BPM indicator**

In `src/components/ResultSheet.tsx`, add imports at top:
```tsx
import { useEffect, useRef } from 'react';
import * as Haptics from 'expo-haptics';
```
Inside the `ResultSheet` component body, before the `return`, add:
```tsx
  useEffect(() => {
    // Recording session is already stopped by the time the sheet renders.
    // Pulse at the track BPM. Poll-guard is unnecessary here because runScan
    // only resolves after stopRecording() completed in the Capture flow.
    const periodMs = Math.max(250, 60000 / Math.max(40, track.tempo));
    const id = setInterval(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }, periodMs);
    return () => clearInterval(id);
  }, [track.tempo]);
```

- [ ] **Step 2: Verify on physical iPhone**

Open the result sheet on the iPhone. Expected: a light haptic tap repeats at roughly the track's BPM (171 BPM ≈ ~2.8 taps/sec for the mock). On the simulator there is no Taptic engine — no haptic, no crash (the `.catch` swallows it). Visual green BPM number still shows everywhere.

- [ ] **Step 3: Commit**

```bash
git add src/components/ResultSheet.tsx
git commit -m "feat: BPM-synced haptic pulse on result sheet"
```

> **OMITTED note:** The brief's `setInterval` hardware-status poll before the first haptic is omitted because `runScan` resolves only after `stopRecording()` completes, so the sheet never renders while recording. If you see haptics not firing on device (OS still holding the lock), retrofit a 300ms delay before starting the interval. Log in OMITTED.md.

---

## Task 12: Trending tab

**Files:**
- Create: `src/components/TrendingRow.tsx`
- Modify: `app/(tabs)/trending.tsx`

- [ ] **Step 1: TrendingRow**

Create `src/components/TrendingRow.tsx`:
```tsx
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { colors, fonts, spacing } from '../theme/tokens';
import { Track } from '../types';

function chips(t: Track): string[] {
  const out: string[] = [];
  if (t.energy > 0.7) out.push('HIGH ENERGY');
  if (t.instrumentalness > 0.4) out.push('INSTRUMENTAL');
  if (t.danceability > 0.7) out.push('DANCEABLE');
  if (t.acousticness > 0.6) out.push('ACOUSTIC');
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
  chip: { color: colors.cyan, fontSize: 9, letterSpacing: 1, marginVertical: 1 },
});
```

- [ ] **Step 2: Trending screen with 3 sections**

Replace `app/(tabs)/trending.tsx`:
```tsx
import { SectionList, View, Text, StyleSheet } from 'react-native';
import { useState, useMemo } from 'react';
import { colors, spacing } from '../../src/theme/tokens';
import { TrendingRow } from '../../src/components/TrendingRow';
import { ResultSheet } from '../../src/components/ResultSheet';
import { Track } from '../../src/types';
import tracks from '../../assets/data/mock_tracks.json';

export default function Trending() {
  const [selected, setSelected] = useState<Track | null>(null);
  const data = tracks as Track[];

  const sections = useMemo(() => {
    const local = data.filter((t) => t.location === 'Montreal');
    const global = data.filter((t) => t.location !== 'Montreal');
    const byProperty = [...data].sort((a, b) => b.energy - a.energy).slice(0, 8);
    return [
      { title: 'LOCAL · MONTREAL', data: local },
      { title: 'GLOBAL', data: global },
      { title: 'BY SONIC PROPERTY · ENERGY', data: byProperty },
    ];
  }, [data]);

  return (
    <View style={styles.c}>
      <Text style={styles.gps}>◍ MONTREAL</Text>
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
  gps: { color: colors.green, fontSize: 11, letterSpacing: 2, paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  header: { color: colors.textSecondary, fontSize: 11, letterSpacing: 2, fontWeight: '700',
    paddingHorizontal: spacing.md, paddingTop: spacing.lg, paddingBottom: spacing.sm },
});
```

> Requires `assets/data/mock_tracks.json` (Task 13). Before seed.py runs, create a placeholder with 2-3 hand-written Track objects (copy the MOCK_TRACK shape, vary `location`) so this screen renders during the build.

- [ ] **Step 3: Verify in simulator**

Run app → Trending tab. Expected: GPS badge "◍ MONTREAL" in green at top; three section headers; rows with rank, art box, title/artist, cyan property chips. Tap any row → ResultSheet slides up with that track's data. Tap backdrop → closes.

- [ ] **Step 4: Commit**

```bash
git add src/components/TrendingRow.tsx app/(tabs)/trending.tsx
git commit -m "feat: Trending tab with sections and analysis modal"
```

> **OMITTED note:** Real GPS via expo-location is replaced with a static "MONTREAL" badge. To wire real location: request `Location.requestForegroundPermissionsAsync()`, reverse-geocode, show city; on denial show "GLOBAL ONLY". Skipped — static badge is demo-safe and avoids a permission dialog mid-demo. Log in OMITTED.md.

---

## Task 13: Seed data + wire JSON

**Files:**
- Create: `seed.py` (full script in `docs/plans/setup-hackathon.md` §3)
- Create: `assets/data/mock_tracks.json`, `mock_profiles.json`, `sonic_profiles.json`

- [ ] **Step 1: Copy seed.py from the setup doc**

Copy the complete `seed.py` from `docs/plans/setup-hackathon.md` section 3 into the project root.

- [ ] **Step 2: Run it (with keys, or accept fallback random data)**

Run:
```bash
pip install requests
# With keys:
OPENROUTER_API_KEY=xxx FREQBLOG_API_KEY=xxx python seed.py
# Without keys: it will use fallback random values and still produce valid JSON.
```
Expected: `mock_tracks.json` (20), `mock_profiles.json` (30), `sonic_profiles.json` (10) written to project root.

- [ ] **Step 3: Move JSON into the app**

Run:
```bash
mkdir -p assets/data
mv mock_tracks.json mock_profiles.json sonic_profiles.json assets/data/
```
Expected: three files now in `assets/data/`. This replaces any placeholders made in Tasks 9/12.

- [ ] **Step 4: Enable JSON imports in TypeScript**

Ensure `tsconfig.json` has `"resolveJsonModule": true` under `compilerOptions` (Expo's base tsconfig usually includes it; add if missing).

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit` then reload the app → Trending tab now shows 20 real tracks across sections.

- [ ] **Step 6: Commit**

```bash
git add seed.py assets/data/ tsconfig.json
git commit -m "feat: seed script and pre-baked mock data"
```

---

## Task 14: History tab

**Files:**
- Create: `src/components/HistoryRow.tsx`
- Modify: `app/(tabs)/history.tsx`

- [ ] **Step 1: HistoryRow**

Create `src/components/HistoryRow.tsx`:
```tsx
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
        <Text style={styles.chip}>{track.moodLabel.toUpperCase()}</Text>
        <Text style={styles.chip}>{track.microGenre.toUpperCase()}</Text>
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
  chip: { color: colors.purple, fontSize: 9, letterSpacing: 1 },
  time: { color: colors.textTertiary, fontSize: 10, width: 48, textAlign: 'right' },
});
```

- [ ] **Step 2: History screen (empty state + list + reuse sheet)**

Replace `app/(tabs)/history.tsx`:
```tsx
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
        <Text style={styles.emptyTitle}>NO SCANS YET</Text>
        <Text style={styles.emptySub}>Scan your first track to start your sonic archive.</Text>
        <Pressable style={styles.btn} onPress={() => router.push('/(tabs)')}>
          <Text style={styles.btnTxt}>GO TO CAPTURE</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.c}>
      <Text style={styles.h}>HISTORY</Text>
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
  h: { color: colors.textSecondary, fontSize: 11, letterSpacing: 2, fontWeight: '700', paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  empty: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  emptyTitle: { color: colors.textPrimary, fontSize: 16, letterSpacing: 2, fontWeight: '700' },
  emptySub: { color: colors.textSecondary, fontSize: 13, textAlign: 'center', marginTop: spacing.sm },
  btn: { marginTop: spacing.xl, borderColor: colors.cyan, borderWidth: 1, borderRadius: 999, paddingHorizontal: 24, paddingVertical: 12 },
  btnTxt: { color: colors.cyan, letterSpacing: 2, fontWeight: '700' },
});
```

- [ ] **Step 3: Verify in simulator**

Run app. With mock toggle ON, do a scan on Capture first (adds to history). Then History tab → row appears; tap → ResultSheet opens. Fresh start with no scans → empty state + "GO TO CAPTURE" button navigates to Capture.

- [ ] **Step 4: Commit**

```bash
git add src/components/HistoryRow.tsx app/(tabs)/history.tsx
git commit -m "feat: History tab with empty state and sheet reuse"
```

> **OMITTED note:** Date-group headers (Today/Yesterday/This Week) replaced with a flat list + relative timestamps. Within one demo session all scans are "now"/minutes ago, so grouping adds no demo value. Retrofit with a SectionList keyed by day bucket if needed. Log in OMITTED.md.

---

## Task 15: Matchmaking tab — swipe deck

**Files:**
- Create: `src/components/SoulmateCard.tsx`
- Modify: `app/(tabs)/matchmaking.tsx`

- [ ] **Step 1: SoulmateCard**

Create `src/components/SoulmateCard.tsx`:
```tsx
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, radius, spacing } from '../theme/tokens';
import { Tag } from './Tag';
import { UserVector } from '../types';

const DIMS = ['TEMPO', 'ENERGY', 'ACOUSTIC', 'INSTRUMENTAL', 'VALENCE'];

export function SoulmateCard({ profile, score, userVector }:
  { profile: UserVector; score: number; userVector: [number, number, number, number, number] }) {
  const initials = profile.displayName.split(' ').map((w) => w[0]).join('').slice(0, 2);
  const aligned: string[] = [];
  const diverges: string[] = [];
  const norm = (v: number, i: number) => (i === 0 ? v / 200 : v);
  DIMS.forEach((d, i) => {
    const delta = Math.abs(norm(profile.vector[i], i) - norm(userVector[i], i));
    (delta < 0.15 ? aligned : diverges).push(d);
  });

  return (
    <View style={styles.card}>
      <View style={styles.avatar}><Text style={styles.initials}>{initials}</Text></View>
      <Text style={styles.name}>{profile.displayName}</Text>
      <Text style={styles.loc}>{profile.location}</Text>

      <Text style={styles.score}>{score}%</Text>
      <Text style={styles.scoreLabel}>COMPATIBILITY</Text>

      <Text style={styles.section}>SHARED ARTISTS</Text>
      <View style={styles.tagRow}>{profile.topArtists.map((a) => <Tag key={a} label={a} variant="outlined" tint={colors.cyan} />)}</View>

      <Text style={styles.section}>TOP TRACKS</Text>
      <Text style={styles.tracks}>{profile.topSongs.join(' · ')}</Text>

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
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.purple, alignItems: 'center', justifyContent: 'center' },
  initials: { color: '#fff', fontSize: 22, fontWeight: '700' },
  name: { color: colors.textPrimary, fontSize: 18, fontWeight: '700', marginTop: spacing.sm },
  loc: { color: colors.textSecondary, fontSize: 12 },
  score: { color: colors.green, fontFamily: fonts.mono, fontSize: 56, fontWeight: '700', marginTop: spacing.md },
  scoreLabel: { color: colors.green, fontSize: 10, letterSpacing: 3 },
  section: { color: colors.textSecondary, fontSize: 10, letterSpacing: 2, fontWeight: '700', alignSelf: 'flex-start', marginTop: spacing.md },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', alignSelf: 'flex-start', marginTop: spacing.xs },
  tracks: { color: colors.textPrimary, fontSize: 12, alignSelf: 'flex-start', marginTop: spacing.xs },
});
```

- [ ] **Step 2: Matchmaking screen with gate + swipe deck**

Replace `app/(tabs)/matchmaking.tsx`:
```tsx
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useState, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, spacing } from '../../src/theme/tokens';
import { useStore } from '../../src/data/store';
import { SoulmateCard } from '../../src/components/SoulmateCard';
import { cosineSimilarityPercent } from '../../src/lib/similarity';
import { UserVector } from '../../src/types';
import profilesJson from '../../assets/data/mock_profiles.json';

const THRESHOLD = 120;

export default function Matchmaking() {
  const scanCount = useStore((s) => s.history.length);
  const userVector = useStore((s) => s.userVector)();
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const tx = useSharedValue(0);

  const ranked = useMemo(() => {
    const profiles = profilesJson as UserVector[];
    return profiles
      .map((p) => ({ profile: p, score: cosineSimilarityPercent(userVector, p.vector) }))
      .sort((a, b) => b.score - a.score);
  }, [userVector]);

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

  function commit(dir: 'left' | 'right') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setIndex((i) => i + 1);
    tx.value = 0;
  }

  const pan = Gesture.Pan()
    .onUpdate((e) => { tx.value = e.translationX; })
    .onEnd((e) => {
      if (Math.abs(e.translationX) > THRESHOLD) {
        tx.value = withSpring(e.translationX > 0 ? 500 : -500);
        runOnJS(commit)(e.translationX > 0 ? 'right' : 'left');
      } else {
        tx.value = withSpring(0);
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { rotate: `${tx.value / 20}deg` }],
  }));

  return (
    <View style={styles.c}>
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.cardWrap, cardStyle]}>
          <SoulmateCard profile={current.profile} score={current.score} userVector={userVector} />
        </Animated.View>
      </GestureDetector>
      <Text style={styles.hint}>SWIPE RIGHT TO MATCH · LEFT TO SKIP</Text>
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
});
```

> Requires `assets/data/mock_profiles.json` (Task 13).

- [ ] **Step 3: Verify in simulator**

With < 3 scans → gate screen with "X / 3" counter and "GO SCAN" button. Do 3 mock scans on Capture (mock toggle ON), return to Matchmaking → top-ranked card shows with large green compatibility %, shared artists, aligned/divergent dims. Drag card past threshold → it flies off and the next card appears. Drag a little and release → springs back. (Haptic only on device.)

- [ ] **Step 4: Commit**

```bash
git add src/components/SoulmateCard.tsx app/(tabs)/matchmaking.tsx
git commit -m "feat: Matchmaking swipe deck with compatibility scoring"
```

> **OMITTED note:** Green-flash-on-match and left-fade animations are simplified to a fly-off translate. Next-card-peeking-behind is omitted (single card rendered). Retrofit by rendering `ranked[index+1]` behind with a slight scale. Log in OMITTED.md.

---

## Task 16: Final integration pass

**Files:** none (verification + cleanup)

- [ ] **Step 1: Full type check + tests**

Run:
```bash
npx tsc --noEmit && npm test
```
Expected: no type errors; similarity + parsing suites pass (10 tests total).

- [ ] **Step 2: Simulator smoke run (mock ON)**

Run app, walk the demo path: Capture scan → sheet → close → Trending scroll → tap row → modal → close → History shows scan → Matchmaking (after 3 scans) → swipe a card. Expected: no red error boxes, all tabs render, sheets open/close.

- [ ] **Step 3: Physical iPhone run (mock OFF) — the demo-critical path**

Set `EXPO_PUBLIC_USE_MOCK_SCAN=false`, fill real API keys in `.env`, `npx expo start --clear`, open in Expo Go on iPhone. Play a song, scan. Expected: real identification + fingerprint, BPM haptic pulses on the sheet. If APIs fail, graceful degradation shows partial data — not a crash.

- [ ] **Step 4: Review OMITTED.md**

Read `OMITTED.md`. Confirm every skipped item encountered during the build is logged (file upload, real GPS, date grouping, history persistence, fonts, deck polish, haptic poll-guard). Add any that are missing.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore: final integration pass and OMITTED log review"
```

---

## Self-Review (completed against the briefs)

**Spec coverage:**
- Capture scan → fingerprint sheet: Tasks 8b, 9, 10, 11 ✓
- Trending 3 sections + modal: Task 12 ✓
- Matchmaking swipe + cosine score + aligned/divergent: Tasks 4, 15 ✓
- History list + empty state + sheet reuse: Task 14 ✓
- Theme tokens / colors / mono numerics: Tasks 2, 8, 8b ✓
- Graceful API degradation: Task 9 (scanPipeline) ✓
- Seed data pipeline: Task 13 ✓
- Dev mock for simulator: Task 6 ✓

**Known deviations from the brief (all logged in OMITTED.md or task notes):**
- SDK 56 forces Reanimated v4 + New Architecture + worklets (brief assumed SDK 51 versions) — handled in Critical Notes + Task 1.
- File-upload path stubbed (Task 10 note).
- Static Montreal GPS badge instead of expo-location (Task 12 note).
- Flat history instead of date groups (Task 14 note).
- `@siteed/expo-audio-studio` API surface must be confirmed against installed version (Task 10 warning).

**Type consistency:** `runScan` → `ScanResult` consumed in Task 10; `cosineSimilarityPercent` signature matches Tasks 4 and 15; `Track`/`UserVector`/`SonicProfile` from Task 3 used consistently; `ResultSheet({track, onClose})` props identical across Tasks 8b, 12, 14.
