# SDK 56 → 54 Downgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Downgrade vibe-fm from Expo SDK 56 to SDK 54 so it runs in Expo Go (max SDK 54) on iPhone without a paid Apple Developer account.

**Architecture:** Replace all SDK-56-specific packages with SDK-54-compatible versions. The biggest breaking changes are: Reanimated 4 → 3 (removes `react-native-worklets` dependency), React 19 → 18, RN 0.85 → 0.74, and all `expo-*` packages from their SDK-56 versions to SDK-54 versions. Moti 0.30 → 0.29 (Reanimated 3 compatible). Babel plugin changes. Code using Reanimated APIs must be verified — Reanimated 3 vs 4 API is mostly identical for the primitives used here (`useSharedValue`, `useAnimatedStyle`, `withSpring`, `runOnJS`, `interpolate`, `Extrapolation`) so no code changes expected, only dep changes.

**Tech Stack:** Expo SDK 54, React 18, React Native 0.74, Reanimated 3.10.x, Moti 0.29, expo-router 3.x

---

## Dependency Map — SDK 54 Target Versions

| Package | SDK 56 (current) | SDK 54 target |
|---------|-----------------|---------------|
| `expo` | `~56.0.4` | `~54.0.0` |
| `expo-router` | `~56.2.6` | `~4.0.0` |
| `expo-constants` | `~56.0.15` | `~17.0.0` |
| `expo-dev-client` | `~56.0.15` | **REMOVE** (not needed for Expo Go) |
| `expo-document-picker` | `~56.0.4` | `~13.0.0` |
| `expo-file-system` | `~56.0.7` | `~17.0.0` |
| `expo-haptics` | `~56.0.3` | `~13.0.1` |
| `expo-linear-gradient` | `~56.0.4` | `~14.0.0` |
| `expo-linking` | `~56.0.11` | `~7.0.0` |
| `expo-location` | `~56.0.13` | `~17.0.0` |
| `expo-status-bar` | `~56.0.4` | `~2.0.0` |
| `react` | `19.2.3` | `18.2.0` |
| `react-dom` | `19.2.3` | `18.2.0` |
| `react-native` | `0.85.3` | `0.74.5` |
| `react-native-gesture-handler` | `~2.31.1` | `~2.16.0` |
| `react-native-reanimated` | `4.3.1` | `~3.10.1` |
| `react-native-safe-area-context` | `~5.7.0` | `~4.10.0` |
| `react-native-screens` | `4.25.2` | `~3.31.0` |
| `react-native-web` | `^0.21.2` | `~0.19.10` |
| `react-native-worklets` | `0.8.3` | **REMOVE** |
| `moti` | `^0.30.0` | `^0.29.0` |
| `@expo/vector-icons` | `^15.0.2` | `^14.0.0` |
| `@types/react` | `~19.2.2` | `~18.2.0` |
| `babel-preset-expo` | `^56.0.12` | `^11.0.0` |
| `jest-expo` | `^56.0.4` | `^54.0.0` |
| `typescript` | `~6.0.3` | `~5.3.3` |
| `@siteed/expo-audio-studio` | `^3.2.1` | `^3.0.2` |
| `zustand` | `^5.0.13` | `^4.5.0` |

---

## Task 1: Update package.json

**Files:**
- Modify: `vibe-fm/package.json`

- [ ] **Step 1: Replace package.json dependencies block**

```json
{
  "name": "vibe-fm",
  "version": "1.0.0",
  "main": "expo-router/entry",
  "dependencies": {
    "@expo/vector-icons": "^14.0.0",
    "@siteed/expo-audio-studio": "^3.0.2",
    "expo": "~54.0.0",
    "expo-constants": "~17.0.0",
    "expo-document-picker": "~13.0.0",
    "expo-file-system": "~17.0.0",
    "expo-haptics": "~13.0.1",
    "expo-linear-gradient": "~14.0.0",
    "expo-linking": "~7.0.0",
    "expo-location": "~17.0.0",
    "expo-router": "~4.0.0",
    "expo-status-bar": "~2.0.0",
    "moti": "^0.29.0",
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "react-native": "0.74.5",
    "react-native-gesture-handler": "~2.16.0",
    "react-native-reanimated": "~3.10.1",
    "react-native-safe-area-context": "~4.10.0",
    "react-native-screens": "~3.31.0",
    "react-native-web": "~0.19.10",
    "zustand": "^4.5.0"
  },
  "devDependencies": {
    "@types/jest": "^29.5.0",
    "@types/react": "~18.2.0",
    "babel-preset-expo": "^11.0.0",
    "jest": "^29.7.0",
    "jest-expo": "^54.0.0",
    "ts-jest": "^29.1.0",
    "typescript": "~5.3.3"
  },
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "test": "jest"
  },
  "jest": {
    "preset": "ts-jest",
    "testEnvironment": "node",
    "testMatch": [
      "**/__tests__/**/*.test.ts"
    ],
    "transform": {
      "^.+\\.ts$": [
        "ts-jest",
        {
          "tsconfig": "tsconfig.jest.json"
        }
      ]
    }
  },
  "private": true
}
```

- [ ] **Step 2: Commit package.json change**

```bash
git add vibe-fm/package.json
git commit -m "chore: downgrade package.json to SDK 54 target versions"
```

---

## Task 2: Fix babel.config.js

**Files:**
- Modify: `vibe-fm/babel.config.js`

`react-native-worklets/plugin` is Reanimated 4 only. Reanimated 3 uses `react-native-reanimated/plugin`.

- [ ] **Step 1: Replace babel.config.js**

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'],
  };
};
```

- [ ] **Step 2: Commit**

```bash
git add vibe-fm/babel.config.js
git commit -m "fix: swap worklets babel plugin for reanimated/plugin (SDK54/Reanimated3)"
```

---

## Task 3: Clean install

**Files:** none (node_modules, package-lock.json)

- [ ] **Step 1: Delete node_modules and lock file**

```bash
cd vibe-fm
rm -rf node_modules
rm package-lock.json
```

On Windows PowerShell:
```powershell
cd vibe-fm
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
```

- [ ] **Step 2: Fresh install**

```bash
npm install
```

Expected: installs cleanly, no peer dep errors about worklets or React 19.

- [ ] **Step 3: Verify Reanimated version installed**

```bash
npm list react-native-reanimated
```

Expected output contains `react-native-reanimated@3.10.x`

- [ ] **Step 4: Commit lock file**

```bash
git add package-lock.json
git commit -m "chore: regenerate package-lock for SDK54"
```

---

## Task 4: Fix app.json — SDK and bundler metadata

**Files:**
- Modify: `vibe-fm/app.json`

SDK 54 uses Metro bundler with different defaults. Also remove any SDK-56-specific plugin config.

- [ ] **Step 1: Read current app.json and verify plugins array**

Check `plugins` array — if it only contains `"expo-router"`, no change needed. If it has `expo-dev-client` plugin, remove it.

Current `app.json` plugins:
```json
"plugins": [
  "expo-router"
]
```

No change needed here — already clean.

- [ ] **Step 2: Verify sdkVersion not hardcoded**

`app.json` should NOT have `"sdkVersion"` field — Expo infers it from the `expo` package version. Confirm it's absent. If present, remove it.

- [ ] **Step 3: Commit if changed, skip if not**

```bash
git add vibe-fm/app.json
git commit -m "chore: clean app.json for SDK54"
```

---

## Task 5: Fix matchmaking.tsx — Reanimated 3 import paths

**Files:**
- Modify: `vibe-fm/app/(tabs)/matchmaking.tsx`

Reanimated 4 and 3 export `Extrapolation` from the same path. Verify imports are correct for v3.

- [ ] **Step 1: Check current import line**

Current:
```tsx
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS, interpolate, Extrapolation } from 'react-native-reanimated';
```

This import path is identical in Reanimated 3 and 4. **No change needed.**

- [ ] **Step 2: Verify `colors.danger` exists in tokens**

`matchmaking.tsx` line 117 uses `colors.danger`. Check `src/theme/tokens.ts`:

```bash
grep "danger" vibe-fm/src/theme/tokens.ts
```

If missing, add to tokens.ts:
```ts
danger: '#EF4444',
```

- [ ] **Step 3: Commit token fix if needed**

```bash
git add vibe-fm/src/theme/tokens.ts
git commit -m "fix: add danger color token for skip overlay"
```

---

## Task 6: Fix WaveformRing.tsx — Moti 0.29 compatibility

**Files:**
- Modify: `vibe-fm/src/components/WaveformRing.tsx`

Moti 0.29 is compatible with Reanimated 3. API is identical — `MotiView` with `from`/`animate`/`transition` props unchanged.

- [ ] **Step 1: Read WaveformRing.tsx**

```bash
cat vibe-fm/src/components/WaveformRing.tsx
```

- [ ] **Step 2: Verify no Moti 0.30-only APIs used**

Moti 0.30 added `useAnimationState` improvements and `exitBeforeEnter`. If either is used, replace:
- `exitBeforeEnter` → remove (not needed for waveform pulse)
- `useAnimationState` → replace with `useSharedValue` + `useAnimatedStyle` directly

For a simple pulse ring, Moti 0.29 handles `from={{ opacity: 0.3, scale: 0.95 }}` / `animate={{ opacity: 1, scale: 1 }}` with `loop: true` identically. No change expected.

- [ ] **Step 3: Commit if changed**

```bash
git add vibe-fm/src/components/WaveformRing.tsx
git commit -m "fix: verify moti 0.29 compat in WaveformRing"
```

---

## Task 7: Fix ResultSheet.tsx — Moti 0.29 + expo-router compatibility

**Files:**
- Modify: `vibe-fm/src/components/ResultSheet.tsx`

expo-router 4.x (SDK 54) vs 3.x API changes: `useRouter`, `usePathname`, `Link` all unchanged. `Stack` and `Tabs` screen options have minor diffs but ResultSheet doesn't use router directly.

- [ ] **Step 1: Read ResultSheet.tsx and check Moti usage**

```bash
cat vibe-fm/src/components/ResultSheet.tsx
```

- [ ] **Step 2: Check for any `AnimatePresence` from moti**

If `AnimatePresence` is imported from `moti`, it works identically in 0.29.

If `AnimatePresence` is imported from `framer-motion`, replace with moti's version:
```tsx
import { AnimatePresence } from 'moti';
```

- [ ] **Step 3: Commit if changed**

```bash
git add vibe-fm/src/components/ResultSheet.tsx
git commit -m "fix: ResultSheet moti/router compat for SDK54"
```

---

## Task 8: Fix expo-file-system usage — SDK 54 API

**Files:**
- Modify: `vibe-fm/src/lib/base64.ts` (if it uses new File API)

SDK 56 introduced the new `expo-file-system` `File` class API. SDK 54 uses the legacy `FileSystem.readAsStringAsync` / `FileSystem.writeAsStringAsync`.

- [ ] **Step 1: Read base64.ts**

```bash
cat vibe-fm/src/lib/base64.ts
```

- [ ] **Step 2: If new File API used, replace**

If you see `import { File } from 'expo-file-system'` or `new File(...)` pattern, replace with:

```ts
import * as FileSystem from 'expo-file-system';

// Reading file as base64:
const base64 = await FileSystem.readAsStringAsync(uri, {
  encoding: FileSystem.EncodingType.Base64,
});

// Writing file:
await FileSystem.writeAsStringAsync(uri, base64content, {
  encoding: FileSystem.EncodingType.Base64,
});
```

- [ ] **Step 3: Commit**

```bash
git add vibe-fm/src/lib/base64.ts
git commit -m "fix: use SDK54 FileSystem legacy API instead of File class"
```

---

## Task 9: Fix tsconfig.json for TypeScript 5.3

**Files:**
- Modify: `vibe-fm/tsconfig.json`

TypeScript 6.x (SDK 56) has stricter defaults than TS 5.3 (SDK 54). Main diffs: `moduleResolution` default changed.

- [ ] **Step 1: Read tsconfig.json**

```bash
cat vibe-fm/tsconfig.json
```

- [ ] **Step 2: Ensure extends expo base**

Should contain:
```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.d.ts", "expo-env.d.ts"]
}
```

If `moduleResolution` is set to `"bundler"` (TS 6 default), change to `"node"` for TS 5.3 compatibility. If it uses `"bundler"` it may fail with TS 5.3.

- [ ] **Step 3: Commit**

```bash
git add vibe-fm/tsconfig.json
git commit -m "fix: tsconfig for TypeScript 5.3 / SDK54"
```

---

## Task 10: Verify and test

- [ ] **Step 1: Clear Metro cache and start**

```bash
cd vibe-fm
npx expo start --clear
```

Expected: Metro bundler starts, QR code shown, no startup errors in terminal.

- [ ] **Step 2: Scan QR with Expo Go on iPhone**

Open Expo Go (SDK 54) → scan QR. Expected: app loads, no red error screen.

- [ ] **Step 3: Test each tab**

- Capture tab: waveform ring pulses, source toggle works, mock scan runs
- Trending tab: track list renders, tap → analysis modal opens
- Matchmaking tab: requires 3 scans — use mock scan 3x first, then swipe deck appears
- History tab: scanned tracks appear in reverse-chrono list

- [ ] **Step 4: If red screen appears, read the error**

Common errors and fixes:

| Error | Fix |
|-------|-----|
| `Cannot find module 'react-native-worklets'` | babel.config.js still has old plugin — re-check Task 2 |
| `useAnimatedStyle is not a function` | Reanimated not installed correctly — `npm install` again |
| `MotiView: Reanimated version mismatch` | `node_modules/.cache` stale — `npx expo start --clear` |
| `Unable to resolve module expo-dev-client` | Still imported somewhere — grep and remove |
| `TypeError: FileSystem.File is not a constructor` | Task 8 not done — fix base64.ts |

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: SDK54 downgrade complete — runs in Expo Go"
```

---

## Known Non-Issues (don't fix these)

- CRLF warnings from git on Windows — harmless, ignore
- `@siteed/expo-audio-studio` microphone capture — works in Expo Go on SDK 54 (it's in the Expo Go bundle)
- Zustand 4.x vs 5.x — API is backward compatible for the store patterns used here
